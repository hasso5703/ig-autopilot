/**
 * Performance collection: what actually happened to the things we published.
 *
 * Until now the pipeline was write-only. It picked a story, made a carousel,
 * posted it, and never looked back. That is fine for a demo and useless for a
 * system that is supposed to get better, because the two signals that decide
 * Instagram distribution in 2026 are shares and saves, and neither is visible
 * from the publishing side.
 *
 * This module reads them back and appends them to state/metrics.jsonl, one
 * record per post per collection run, so the series is a time series and not a
 * snapshot. A post's reach keeps moving for days; a single reading taken an
 * hour after publishing says almost nothing.
 *
 * METRIC AVAILABILITY IS DISCOVERED, NOT ASSUMED.
 * Meta's reference says "Insights data is not available for any media within an
 * Instagram Media album", which reads as though carousels have no insights at
 * all. Probed against our own published carousel (media 17905277859456798,
 * CAROUSEL_ALBUM/FEED) on 2026-07-25, that is not what it means: the parent
 * carousel answers 200 for ten metrics. The sentence is about the child images
 * inside the album, not the album itself.
 *
 * Only `navigation` and `impressions` are refused, and the refusal is a
 * media-type incompatibility, not an authorization failure:
 *   code 100 "The Media Insights API does not support the <m> metric for this
 *   media product type."
 * No scope was ever cited as missing, so nothing needs re-authorizing.
 *
 * The discovery machinery below is kept anyway, and the cached answer lives in
 * state/metrics-support.json. Meta retires metrics without warning (impressions
 * itself was retired for media created after 2024-07-02), so a hard-coded list
 * would rot silently. This re-derives the set the first time a batch call fails.
 */

import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadState } from "./state.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "state");
const METRICS = path.join(DIR, "metrics.jsonl");
const ACCOUNT = path.join(DIR, "account.jsonl");
const SUPPORT = path.join(DIR, "metrics-support.json");

const API = "https://graph.instagram.com";
const VERSION = process.env.IG_API_VERSION || "v25.0";

/**
 * Every metric worth asking for, most useful first.
 *
 * `shares` and `saved` lead deliberately: a share into a DM is the heaviest
 * ranking signal Instagram has, and a save is the second. Likes are last
 * because they are the metric that flatters most and predicts least.
 *
 * `impressions` is here only to be tested and dropped: Meta deprecated it for
 * media created after 2024-07-02, so it should fail, and confirming that it
 * fails is cheaper than trusting a changelog.
 */
const CANDIDATES = [
  "shares",
  "saved",
  "reach",
  "views",
  // Retention is the number era 2 lives or dies on, and the one the first era
  // never collected: avg watch time (ms) against the Reel's duration is the
  // completion signal Instagram ranks on, and it is the gate for any cadence
  // increase. Reels-only metrics; the probe drops them on other media types.
  "ig_reels_avg_watch_time",
  "ig_reels_video_view_total_time",
  "total_interactions",
  "likes",
  "comments",
  "profile_visits",
  "profile_activity",
  "follows",
  "navigation",
  "impressions",
];

/** Fields that live on the media object itself, no insights permission needed. */
const MEDIA_FIELDS = "id,media_type,media_product_type,permalink,timestamp,like_count,comments_count";

/**
 * The account itself, tracked over time.
 *
 * Follower count is the number this project is ultimately judged on, and it is
 * the one number no per-post metric can give you: a post can reach thousands
 * and convert nobody. Recorded as a series so growth is visible as a slope
 * rather than guessed at from a single figure.
 */
const ACCOUNT_FIELDS = "id,username,account_type,followers_count,follows_count,media_count";

export async function accountSnapshot() {
  const r = await get("me", { fields: ACCOUNT_FIELDS });
  // followers_count is not guaranteed on every account type, so a failure here
  // is recorded and stepped over rather than allowed to kill the whole run.
  return r.ok
    ? { at: new Date().toISOString(), ok: true, ...r.data }
    : { at: new Date().toISOString(), ok: false, error: r.error };
}

function requireToken() {
  const t = process.env.IG_ACCESS_TOKEN;
  if (!t) throw new Error("IG_ACCESS_TOKEN is not set");
  return t;
}

/**
 * A GET that never throws on an API-level error.
 *
 * Discovery depends on reading the error, not on being interrupted by it: an
 * unsupported metric is a normal outcome here, not a failure of the run.
 */
async function get(pathname, params) {
  const url = new URL(`${API}/${VERSION}/${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", requireToken());

  let res, text;
  try {
    res = await fetch(url);
    text = await res.text();
  } catch (e) {
    return { ok: false, error: { message: `network: ${e.message}` } };
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: { message: `HTTP ${res.status}, non-JSON: ${text.slice(0, 200)}` } };
  }
  if (!res.ok || json.error) {
    const e = json.error || {};
    return {
      ok: false,
      status: res.status,
      error: {
        code: e.code ?? null,
        subcode: e.error_subcode ?? null,
        message: e.message || text.slice(0, 200),
      },
    };
  }
  return { ok: true, data: json };
}

/** Flattens Meta's insights envelope into { metric: value }. */
function flatten(payload) {
  const out = {};
  for (const row of payload?.data ?? []) {
    const v = row.values?.[0]?.value;
    // `navigation` and friends come back as an object of breakdowns.
    out[row.name] = v && typeof v === "object" ? v : (v ?? null);
  }
  return out;
}

/**
 * The support cache is keyed by media product type AND remembers which
 * candidates produced it. Both lessons were bought: the first cache was probed
 * on a carousel and silently decided what Reels were allowed to report, and
 * when the Reels watch-time metrics were added to CANDIDATES on 2026-07-28,
 * a shape that never re-probes would have ignored them forever. A record whose
 * candidate list differs from today's is stale and rediscovered.
 */
async function readSupportFile() {
  if (!existsSync(SUPPORT)) return { types: {} };
  try {
    const s = JSON.parse(await readFile(SUPPORT, "utf8"));
    if (s && typeof s.types === "object") return s;
    // Legacy single-record shape: probed on a since-deleted carousel with an
    // older candidate list. Carrying it forward would only preserve its blind
    // spots; rediscovery costs a dozen requests once per type.
    return { types: {} };
  } catch {
    return { types: {} };
  }
}

async function readSupport(type) {
  const file = await readSupportFile();
  const rec = file.types[type];
  if (!rec || !Array.isArray(rec.supported)) return null;
  const sameCandidates = JSON.stringify(rec.candidates ?? []) === JSON.stringify(CANDIDATES);
  return sameCandidates ? rec : null;
}

/**
 * Determines which metrics this account can actually read for one media
 * product type, by asking for each candidate alone. Run once per type per
 * candidate-list, then cached.
 */
async function discoverSupport(mediaId, type) {
  const supported = [];
  const rejected = {};
  for (const m of CANDIDATES) {
    const r = await get(`${mediaId}/insights`, { metric: m });
    if (r.ok) supported.push(m);
    else rejected[m] = `code=${r.error.code ?? "?"} sub=${r.error.subcode ?? "-"}: ${r.error.message}`;
  }
  const record = { discoveredAt: new Date().toISOString(), probedOn: mediaId, candidates: CANDIDATES, supported, rejected };
  const file = await readSupportFile();
  file.types[type] = record;
  await mkdir(DIR, { recursive: true });
  await writeFile(SUPPORT, JSON.stringify(file, null, 2) + "\n", "utf8");
  return record;
}

/**
 * Metrics for one post. Uses the cached supported set when there is one, and
 * falls back to rediscovery if the batch call breaks, which is what happens
 * when Meta retires a metric under us.
 */
export async function mediaMetrics(mediaId, supports = {}) {
  const media = await get(mediaId, { fields: MEDIA_FIELDS });
  if (!media.ok) {
    return { mediaId, at: new Date().toISOString(), ok: false, media: null, mediaError: media.error, insights: {}, insightsError: null, supported: [] };
  }
  const type = media.data.media_product_type || media.data.media_type || "UNKNOWN";

  let sup = supports[type] ?? (await readSupport(type));
  if (!sup) sup = await discoverSupport(mediaId, type);
  supports[type] = sup;

  let insights = {};
  let insightsError = null;

  if (sup.supported.length) {
    const batch = await get(`${mediaId}/insights`, { metric: sup.supported.join(",") });
    if (batch.ok) {
      insights = flatten(batch.data);
    } else {
      const fresh = await discoverSupport(mediaId, type);
      sup = fresh;
      supports[type] = fresh;
      if (fresh.supported.length) {
        const retry = await get(`${mediaId}/insights`, { metric: fresh.supported.join(",") });
        if (retry.ok) insights = flatten(retry.data);
        else insightsError = retry.error;
      } else {
        insightsError = batch.error;
      }
    }
  }

  return {
    mediaId,
    at: new Date().toISOString(),
    ok: media.ok,
    media: media.data,
    mediaError: null,
    insights,
    insightsError,
    supported: sup.supported,
  };
}

/**
 * Reads every published post and appends one metrics record each.
 * @returns {Promise<Array>} the records written
 */
export async function collectAll() {
  await mkdir(DIR, { recursive: true });
  const account = await accountSnapshot();
  await appendFile(ACCOUNT, JSON.stringify(account) + "\n", "utf8");

  const { posted } = await loadState();
  const ids = posted.map((p) => p.mediaId).filter(Boolean);
  if (!ids.length) return [];

  // Discovery happens per media product type, on the oldest post of that type
  // encountered (posted.jsonl is oldest-first): a post published minutes ago
  // may not have insights yet, which would poison the cache with false
  // negatives. The shared map keeps it to one discovery per type per run.
  const supports = {};
  const records = [];
  for (const id of ids) records.push(await mediaMetrics(id, supports));

  await mkdir(DIR, { recursive: true });
  await appendFile(METRICS, records.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
  return records;
}

/**
 * The last reading for each post, newest first.
 * This is what the editorial step reads to learn what worked.
 */
export async function latestPerPost() {
  if (!existsSync(METRICS)) return [];
  const rows = (await readFile(METRICS, "utf8"))
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter(Boolean);

  const byId = new Map();
  for (const r of rows) byId.set(r.mediaId, r); // later lines win
  return [...byId.values()].sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

/**
 * Account readings, oldest first. Returns the newest plus the reading closest
 * to 7 days before it, which is what turns a follower count into a growth rate.
 */
export async function accountTrend() {
  if (!existsSync(ACCOUNT)) return { now: null, weekAgo: null };
  const rows = (await readFile(ACCOUNT, "utf8"))
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter((r) => r && r.ok);

  const now = rows.at(-1) ?? null;
  if (!now) return { now: null, weekAgo: null };

  const target = Date.parse(now.at) - 7 * 86400000;
  let weekAgo = null;
  for (const r of rows) {
    if (Date.parse(r.at) <= target) weekAgo = r;
  }
  return { now, weekAgo };
}

if (process.argv[1] && process.argv[1].endsWith("insights.mjs")) {
  const cmd = process.argv[2] || "collect";
  const run = async () => {
    if (cmd === "support") return await readSupportFile();
    if (cmd === "latest") return latestPerPost();
    if (cmd === "account") return accountTrend();
    if (cmd === "collect") return collectAll();
    throw new Error(`unknown command: ${cmd}`);
  };
  run().then(
    (r) => console.log(JSON.stringify(r, null, 2)),
    (e) => {
      console.error("FAILED:", e.message);
      process.exit(1);
    }
  );
}
