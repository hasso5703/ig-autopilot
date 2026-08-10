/**
 * The experience the account has actually earned, computed instead of recalled.
 *
 * For two weeks the pipeline collected metrics religiously (state/metrics.jsonl,
 * 1,100+ readings) and no code ever read them back to change anything. The one
 * closed loop was voice-rate -> word window. Everything editorial — which
 * subjects reach strangers, which opening surface holds them, which stories get
 * sent — lived in whichever journal a run happened to re-read, and the best
 * analysis the repo ever produced (2026-08-08: veo openers 21.7% mean retention,
 * photo 19.0%, screenshot 16.8%) was done by hand and never ran again.
 *
 * This module is that analysis, mechanised. It joins the three ledgers the
 * account already keeps (posted, metrics, account) to the specs in posts/, and
 * writes the digest a picking run reads at step 2b:
 *
 *   node src/learn.mjs          print the digest, write state/lessons.json
 *   node src/learn.mjs --dry    print only, write nothing
 *
 * What it deliberately is NOT: a scorer. n is two dozen posts; these are
 * directional readings, not proof, and the digest says so on every section
 * with a thin sample. The pick stays a judgement — this puts the account's own
 * record in front of it, the way `state.mjs themes` already does for repetition.
 *
 * The one editorial fact the record already supports, printed at the top
 * because it was measured, not felt: the four best-viewed Reels all land on
 * the viewer's own life (their health, their next purchase, their privacy,
 * their pay), and the account's institutional stories (AI Act, FCC, Congress)
 * sit at half the median. Recognition of the subject is not enough; the
 * criterion that separates the account's own hits from its own flops is
 * whether the viewer is IN the story. sources.json calls it `proximite`.
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadState } from "./state.mjs";
import { themesOf } from "./state.mjs";
import { latestPerPost } from "./insights.mjs";
import { retentionPct } from "./watch.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const LESSONS = path.join(ROOT, "state", "lessons.json");
const POSTS_DIR = path.join(ROOT, "posts");

/** Two days: a reading younger than this is still climbing (a post's reach
 * keeps moving for days — insights.mjs says so in its header), so cross-post
 * comparisons mark it and the aggregates exclude it. */
const SETTLED_AFTER_H = 48;

const median = (xs) => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2);
};
const mean = (xs) => {
  const v = xs.filter((x) => Number.isFinite(x));
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};

/** What the first thing on screen was, from the spec's own plan. `file` pins
 * are classified by what the file is, because a pinned veo clip is still a
 * moving opener. */
export function beat0Surface(spec) {
  const v = spec?.reel2?.beats?.[0]?.visual;
  if (!v) return null;
  if (v.type === "file") return /\.(mp4|mov|webm)$/i.test(String(v.file || "")) ? "veo" : "photo";
  return v.type || null;
}

/**
 * The pure join: every published Reel with its settled numbers, grouped the
 * ways a picking run actually asks. Takes plain data so the test suite can
 * feed it fixtures; never reaches for the network.
 */
export function buildLessons({ posted, latest, specs, account, now = new Date() }) {
  const byId = new Map((latest || []).map((r) => [r.mediaId, r]));
  const rows = [];
  for (const p of posted || []) {
    if (!p.mediaId || !p.slug) continue;
    const r = byId.get(p.mediaId);
    if (!r || !r.insights) continue;
    const i = r.insights;
    const spec = specs?.[p.slug];
    const ageH = (now - new Date(p.at)) / 3600000;
    rows.push({
      slug: p.slug,
      at: p.at,
      hourUtc: new Date(p.at).getUTCHours(),
      views: i.views ?? null,
      reach: i.reach ?? null,
      avgWatchS: typeof i.ig_reels_avg_watch_time === "number" ? Math.round(i.ig_reels_avg_watch_time / 100) / 10 : null,
      retentionPct: retentionPct(i.ig_reels_avg_watch_time, p.durationS),
      likes: i.likes ?? null,
      comments: i.comments ?? null,
      saved: i.saved ?? null,
      shares: i.shares ?? null,
      beat0: beat0Surface(spec),
      themes: themesOf(`${p.title || ""} ${p.slug}`),
      sendTest: spec?.sendTest ?? null,
      settled: ageH >= SETTLED_AFTER_H,
    });
  }
  rows.sort((a, b) => (b.views ?? -1) - (a.views ?? -1));

  const settled = rows.filter((r) => r.settled && Number.isFinite(r.views));
  const group = (key) => {
    const out = {};
    for (const r of settled) {
      const ks = key(r);
      for (const k of Array.isArray(ks) ? ks : [ks]) {
        if (!k) continue;
        (out[k] ??= { n: 0, views: [], retention: [], saves: 0, shares: 0 });
        out[k].n++;
        out[k].views.push(r.views);
        out[k].retention.push(r.retentionPct);
        out[k].saves += r.saved ?? 0;
        out[k].shares += r.shares ?? 0;
      }
    }
    return Object.fromEntries(
      Object.entries(out).map(([k, g]) => [k, {
        n: g.n,
        medianViews: median(g.views),
        meanRetentionPct: mean(g.retention),
        saves: g.saves,
        shares: g.shares,
        thin: g.n < 5,
      }])
    );
  };

  // Follower movement by day, joined to what was published that day — the
  // account-level metric the per-post API refuses (`follows` is unsupported
  // for REELS, state/metrics-support.json), read the only way it can be.
  const daily = new Map();
  for (const a of account || []) {
    if (!a?.ok || !a.at) continue;
    const day = a.at.slice(0, 10);
    const held = daily.get(day);
    if (!held || a.at > held.at) daily.set(day, a);
  }
  const days = [...daily.keys()].sort();
  const followerDays = [];
  for (let i = 1; i < days.length; i++) {
    const delta = (daily.get(days[i]).followers_count ?? 0) - (daily.get(days[i - 1]).followers_count ?? 0);
    followerDays.push({
      date: days[i],
      delta,
      published: rows.filter((r) => r.at.slice(0, 10) === days[i]).map((r) => ({ slug: r.slug, views: r.views })),
    });
  }
  const nowAcct = days.length ? daily.get(days.at(-1)) : null;

  const brief = (r) => ({ slug: r.slug, views: r.views, retentionPct: r.retentionPct, saved: r.saved, shares: r.shares, sendTest: r.sendTest });
  return {
    at: now.toISOString(),
    n: rows.length,
    nSettled: settled.length,
    medianViews: median(settled.map((r) => r.views)),
    medianRetentionPct: median(settled.map((r) => r.retentionPct)),
    top: settled.slice(0, 5).map(brief),
    bottom: settled.slice(-5).reverse().map(brief),
    byBeat0: group((r) => r.beat0),
    byTheme: group((r) => r.themes),
    byPublishHourUtc: group((r) => (Number.isFinite(r.hourUtc) ? String(r.hourUtc).padStart(2, "0") : null)),
    followers: nowAcct
      ? {
          now: nowAcct.followers_count ?? null,
          bestDays: [...followerDays].sort((a, b) => b.delta - a.delta).slice(0, 3).filter((d) => d.delta > 0),
        }
      : null,
    posts: rows,
  };
}

/** The digest a run reads: one screen, medians before means, thin samples
 * labelled as thin, and the top/bottom sendTests side by side — that
 * juxtaposition is the lesson, and it needs no model to read. */
export function formatLessons(l) {
  const L = [];
  const pct = (v) => (v === null || v === undefined ? "-" : `${v}%`);
  L.push(`LESSONS — ${l.n} published Reels, ${l.nSettled} settled (>=48h). Directional, not proof.`);
  L.push(`median views ${l.medianViews ?? "-"} · median retention ${pct(l.medianRetentionPct)}`);
  L.push("");
  L.push("TOP (settled, by views) — what strangers actually opened:");
  for (const r of l.top) L.push(`  ${String(r.views).padStart(5)} v ${pct(r.retentionPct).padStart(4)} ${r.saved ?? 0}s/${r.shares ?? 0}sh  ${r.slug}`);
  for (const r of l.top.slice(0, 2)) if (r.sendTest) L.push(`        » ${r.sendTest}`);
  L.push("BOTTOM:");
  for (const r of l.bottom) L.push(`  ${String(r.views).padStart(5)} v ${pct(r.retentionPct).padStart(4)} ${r.saved ?? 0}s/${r.shares ?? 0}sh  ${r.slug}`);
  L.push("");
  const grp = (title, g) => {
    const keys = Object.keys(g);
    if (!keys.length) return;
    L.push(title);
    for (const k of keys.sort((a, b) => (g[b].medianViews ?? 0) - (g[a].medianViews ?? 0)))
      L.push(`  ${k.padEnd(12)} n=${g[k].n}${g[k].thin ? " (thin)" : ""}  median ${g[k].medianViews ?? "-"} v · retention ${pct(g[k].meanRetentionPct)} · ${g[k].saves} saves · ${g[k].shares} shares`);
  };
  grp("BY OPENING SURFACE (beat 0):", l.byBeat0);
  grp("BY THEME:", l.byTheme);
  grp("BY PUBLISH HOUR (UTC):", l.byPublishHourUtc);
  if (l.followers) {
    L.push("");
    L.push(`FOLLOWERS now ${l.followers.now ?? "-"}; best days:`);
    for (const d of l.followers.bestDays)
      L.push(`  ${d.date} +${d.delta} — published: ${d.published.map((p) => `${p.slug} (${p.views ?? "?"} v)`).join(", ") || "nothing that day"}`);
  }
  return L.join("\n");
}

export async function collectLessons({ now = new Date() } = {}) {
  const { posted } = await loadState();
  const latest = await latestPerPost();
  let account = [];
  const acctFile = path.join(ROOT, "state", "account.jsonl");
  if (existsSync(acctFile)) {
    account = (await readFile(acctFile, "utf8"))
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  }
  const specs = {};
  if (existsSync(POSTS_DIR)) {
    for (const f of (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".json"))) {
      try { specs[f.replace(/\.json$/, "")] = JSON.parse(await readFile(path.join(POSTS_DIR, f), "utf8")); } catch { /* one bad spec must not blind the digest */ }
    }
  }
  return buildLessons({ posted, latest, specs, account, now });
}

if (process.argv[1] && process.argv[1].endsWith("learn.mjs")) {
  // A learn crash must never cost a run: this is a reading, not a step.
  try {
    const lessons = await collectLessons();
    console.log(formatLessons(lessons));
    if (!process.argv.includes("--dry")) {
      await writeFile(LESSONS, JSON.stringify(lessons, null, 2) + "\n");
      console.error(`\nwritten to state/lessons.json`);
    }
  } catch (e) {
    console.error(`learn.mjs failed (${e.message}) — the digest is a reading, carry on without it`);
  }
  process.exit(0);
}
