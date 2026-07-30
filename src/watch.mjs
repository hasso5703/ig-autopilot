/**
 * The daily watch: is the machine alive, is it about to die, and is anything
 * we published actually working.
 *
 * Everything numeric happens here rather than in the routine's prompt. An agent
 * asked to "work out how many days are left" will do it correctly most of the
 * time, and the failure mode of the remaining fraction is a confident wrong
 * number in an alert, which is worse than no alert. Dates, deltas and
 * thresholds are arithmetic; arithmetic belongs in code.
 *
 *   node src/watch.mjs          collect metrics, print the report
 *   node src/watch.mjs --dry    report from stored data, no API calls
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadState } from "./state.mjs";
import { collectAll, latestPerPost, accountTrend } from "./insights.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const TOKEN_FILE = path.join(ROOT, "state", "token.json");

/**
 * How long after a scheduled post we start calling it a failure.
 *
 * The routine runs daily, so anything past 26 hours means a run was skipped or
 * died. The two extra hours absorb a late start without crying wolf.
 */
const SILENCE_ALARM_HOURS = 26;

const DAY = 86400000;
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

export async function tokenStatus() {
  if (!existsSync(TOKEN_FILE)) {
    return { known: false, note: "state/token.json is missing, expiry cannot be tracked" };
  }
  const t = JSON.parse(await readFile(TOKEN_FILE, "utf8"));
  const issued = Date.parse(t.issuedAt);
  if (Number.isNaN(issued)) return { known: false, note: "issuedAt is not a valid date" };

  const lifetime = (t.lifetimeDays ?? 60) * DAY;
  const daysLeft = Math.floor((issued + lifetime - Date.now()) / DAY);
  const warnAt = t.warnAtDays ?? 14;

  return {
    known: true,
    daysLeft,
    warnAt,
    expiresOn: new Date(issued + lifetime).toISOString().slice(0, 10),
    urgent: daysLeft <= warnAt,
    dead: daysLeft <= 0,
    howToRenew: t.howToRenew ?? null,
  };
}

/**
 * Did the last run actually gather, or only say it did?
 *
 * `src/feeds.mjs` writes state/feeds-last.json as a side effect of really
 * fetching. If that file is older than a day, the daily run did not reach its
 * gather step, whatever its report said. This is the one check here that
 * verifies a run's work rather than its conclusions.
 */
export async function gatherHealth() {
  const file = path.join(ROOT, "state", "feeds-last.json");
  if (!existsSync(file)) return { known: false, note: "no gather has ever been recorded" };
  try {
    const f = JSON.parse(await readFile(file, "utf8"));
    const ageHours = (Date.now() - Date.parse(f.at)) / 3600000;
    const dead = (f.feeds ?? []).filter((x) => !x.ok).map((x) => x.name);
    return {
      known: true,
      ok: ageHours <= SILENCE_ALARM_HOURS,
      ageHours: Math.round(ageHours * 10) / 10,
      fresh: f.fresh ?? null,
      feeds: (f.feeds ?? []).length,
      dead,
    };
  } catch {
    return { known: false, note: "state/feeds-last.json is unreadable" };
  }
}

export async function publishHealth() {
  const { posted } = await loadState();
  const last = posted.at(-1);
  if (!last) return { ok: false, ever: false, note: "nothing has ever been published" };

  const ageHours = (Date.now() - Date.parse(last.at)) / 3600000;
  return {
    ok: ageHours <= SILENCE_ALARM_HOURS,
    ever: true,
    ageHours: Math.round(ageHours * 10) / 10,
    total: posted.length,
    last: { at: last.at, title: last.title, permalink: last.permalink, slug: last.slug },
  };
}

/**
 * Joins each published post to its newest metrics reading, and to the reading
 * before it so the report can show movement rather than a static total.
 */
async function performance() {
  const { posted } = await loadState();
  const latest = await latestPerPost();
  const byId = new Map(latest.map((r) => [r.mediaId, r]));

  return posted.map((p) => {
    const r = byId.get(p.mediaId);
    const i = r?.insights ?? {};
    return {
      slug: p.slug,
      title: p.title,
      permalink: p.permalink,
      postedAt: p.at,
      read: r?.at ?? null,
      reach: i.reach ?? null,
      shares: i.shares ?? null,
      saved: i.saved ?? null,
      views: i.views ?? null,
      interactions: i.total_interactions ?? null,
      follows: i.follows ?? null,
      profileVisits: i.profile_visits ?? null,
      avgWatchS: typeof i.ig_reels_avg_watch_time === "number" ? Math.round(i.ig_reels_avg_watch_time / 100) / 10 : null,
      retention: retentionPct(i.ig_reels_avg_watch_time, p.durationS),
      error: r?.insightsError ?? null,
    };
  });
}

/**
 * Average watch time over real duration, as a percentage — the single number
 * that predicts whether Instagram widens a Reel's audience. The API reports
 * milliseconds; the duration comes from `recordPosted` (ffprobe at publish
 * time). Null when either side is missing, never guessed.
 */
export function retentionPct(avgWatchMs, durationS) {
  if (typeof avgWatchMs !== "number" || !Number.isFinite(durationS) || durationS <= 0) return null;
  return Math.round((avgWatchMs / 1000 / durationS) * 100);
}

const n = (v) => (v === null || v === undefined ? "-" : String(v));

/** A report short enough to read on a phone without scrolling. */
export function format(report) {
  const L = [];
  const { health, token, posts } = report;

  L.push(`ORDER OF MAGNITUDE — ${new Date().toISOString().slice(0, 10)}`);
  L.push("");

  if (!health.ever) {
    L.push("PUBLICATION   ALERTE : aucun post n'a jamais été publié.");
  } else if (health.ok) {
    L.push(`PUBLICATION   ok, dernier il y a ${plural(Math.round(health.ageHours), "heure", "heures")} (${health.total} au total)`);
  } else {
    L.push(`PUBLICATION   ALERTE : rien depuis ${plural(Math.round(health.ageHours), "heure", "heures")}. La routine a sauté un tour ou a planté.`);
  }

  if (!token.known) L.push(`TOKEN         inconnu : ${token.note}`);
  else if (token.dead) L.push(`TOKEN         MORT depuis le ${token.expiresOn}. Plus rien ne peut être publié.`);
  else if (token.urgent) L.push(`TOKEN         ALERTE : ${plural(token.daysLeft, "jour restant", "jours restants")} (expire le ${token.expiresOn}). À renouveler maintenant.`);
  else L.push(`TOKEN         ${plural(token.daysLeft, "jour restant", "jours restants")} (expire le ${token.expiresOn})`);

  const a = report.account;
  if (a?.now?.ok) {
    const f = a.now.followers_count;
    const before = a.weekAgo?.followers_count;
    const delta = typeof f === "number" && typeof before === "number" ? f - before : null;
    const move = delta === null ? "" : delta > 0 ? ` (+${delta} en 7 jours)` : delta < 0 ? ` (${delta} en 7 jours)` : " (stable sur 7 jours)";
    L.push(`COMPTE        ${n(f)} abonnés${move} · ${n(a.now.media_count)} posts`);
  }

  const g = report.gather;
  if (g?.known) {
    if (!g.ok) L.push(`COLLECTE      ALERTE : aucune récupération de flux depuis ${plural(Math.round(g.ageHours), "heure", "heures")}. Le run n'a pas atteint son étape de collecte.`);
    else L.push(`COLLECTE      ${n(g.fresh)} sujets frais sur ${n(g.feeds)} flux${g.dead.length ? ` · muets : ${g.dead.join(", ")}` : ""}`);
  } else if (g) {
    L.push(`COLLECTE      inconnue : ${g.note}`);
  }

  L.push("");
  L.push("POSTS");
  if (!posts.length) L.push("  aucun");
  for (const p of posts) {
    L.push(`  ${p.slug}`);
    L.push(`    portée ${n(p.reach)} · partages ${n(p.shares)} · saves ${n(p.saved)} · vues ${n(p.views)} · abonnés gagnés ${n(p.follows)}`);
    if (p.retention !== null) L.push(p.retention > 100
      ? `    rétention ${p.retention}% (watch moyen ${n(p.avgWatchS)}s) — au-delà de 100 ce sont des boucles comptées, pas un bug`
      : `    rétention ${p.retention}% (watch moyen ${n(p.avgWatchS)}s) — sous 40% le hook ou la longueur est en cause`);
    if (p.error) L.push(`    stats indisponibles : ${p.error.message}`);
  }

  if (token.urgent && token.howToRenew) {
    L.push("");
    L.push(`RENOUVELER    ${token.howToRenew}`);
  }
  return L.join("\n");
}

export async function buildReport({ collect = true } = {}) {
  if (collect) await collectAll();
  const [health, token, posts, account, gather] = await Promise.all([
    publishHealth(),
    tokenStatus(),
    performance(),
    accountTrend(),
    gatherHealth(),
  ]);
  const alerts = [];
  if (!health.ok) alerts.push("publication");
  if (token.dead || token.urgent) alerts.push("token");
  if (gather.known && !gather.ok) alerts.push("collecte");
  return { at: new Date().toISOString(), health, token, account, gather, posts, alerts };
}

if (process.argv[1] && process.argv[1].endsWith("watch.mjs")) {
  const dry = process.argv.includes("--dry");
  const json = process.argv.includes("--json");
  buildReport({ collect: !dry }).then(
    (r) => console.log(json ? JSON.stringify(r, null, 2) : format(r)),
    (e) => {
      console.error("FAILED:", e.message);
      process.exit(1);
    }
  );
}
