/**
 * Run-to-run memory, stored as JSONL in the repo.
 *
 * Git is the database here. That sounds odd until you look at the constraints:
 * the cloud sandbox is wiped between runs, its only durable, already-
 * authenticated storage is the git remote, and an append-only log of what was
 * published is exactly what you want to be able to audit later.
 *
 *   state/posted.jsonl  one line per published carousel
 *   state/seen.jsonl    one line per story the pipeline has already considered
 *
 * `seen` matters as much as `posted`: a story rejected by the fact gate must
 * not come back tomorrow and be re-examined from scratch every single run.
 */

import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "state");
const POSTED = path.join(DIR, "posted.jsonl");
const SEEN = path.join(DIR, "seen.jsonl");

const STOP = new Set(["the","a","an","of","to","in","for","on","and","is","are","with","its","it","at","as","by","from","that","this","new","now","how","why","what"]);

/**
 * Crude suffix stripping. Not linguistically principled, but it makes
 * "launches"/"launching" and "enterprise"/"enterprises" collide, which is the
 * whole point: the same story carried by two outlets must not post twice.
 */
function stem(w) {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

/** Stemmed, stopword-free token set for a headline. */
export function tokens(title) {
  return [
    ...new Set(
      String(title)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w))
        .map(stem)
    ),
  ].sort();
}

/** Order-independent word signature, for exact-match lookups. */
export function fingerprint(title) {
  return tokens(title).slice(0, 12).join("-");
}

/** Jaccard overlap of two token sets: |A∩B| / |A∪B|. */
export function similarity(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

/**
 * Above this overlap two headlines are treated as the same story. Tuned so
 * that the same announcement across outlets collides, while two unrelated
 * stories that happen to share a company name do not.
 */
export const SIMILARITY_THRESHOLD = 0.6;

async function readJsonl(file) {
  if (!existsSync(file)) return [];
  const text = await readFile(file, "utf8");
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter(Boolean);
}

export async function loadState() {
  const [posted, seen] = await Promise.all([readJsonl(POSTED), readJsonl(SEEN)]);
  return { posted, seen };
}

/**
 * Splits candidates into ones worth considering and ones already handled.
 * Matches on canonical URL first, then on the title fingerprint, so the same
 * story covered by three outlets only gets through once.
 */
/**
 * How long a merely-considered story stays excluded.
 *
 * The first live runs recorded every story they looked at as `considered`, and
 * `considered` blocked forever: 54 stories were permanently unpublishable after
 * two runs, including any that might become the story of the week tomorrow. At
 * that rate the pipeline starves itself in days.
 *
 * So only two outcomes block permanently: `posted` (never repeat ourselves) and
 * `rejected` (the fact gate killed it; do not spend another run on it). Anything
 * merely considered comes back after this window, which is long enough to stop
 * the same day's runs re-evaluating it and short enough that a developing story
 * gets a second look.
 *
 * Three days turned out to still be too long. A run on 2026-07-25 found 3 fresh
 * stories out of 29 because the run forty minutes earlier had marked 26 of them
 * considered, and reported the pool as structurally empty. The window only has
 * to outlast the same day's runs; a story worth publishing that lost yesterday's
 * comparison deserves to be compared again today, especially now that primary
 * sources carry a four-day freshness window of their own.
 */
const CONSIDERED_TTL_MS = 36 * 3600 * 1000;
const BLOCKS_FOREVER = new Set(["posted", "rejected"]);

const stillBlocks = (r) => {
  const outcome = r.outcome ?? "posted"; // posted.jsonl entries carry no outcome
  if (BLOCKS_FOREVER.has(outcome)) return true;
  const at = Date.parse(r.at ?? "");
  return Number.isNaN(at) ? true : Date.now() - at < CONSIDERED_TTL_MS;
};

export async function filterFresh(items) {
  const { posted, seen } = await loadState();
  const history = [...posted, ...seen].filter(stillBlocks);
  const urls = new Set(history.map((r) => canonical(r.url)).filter(Boolean));
  // Older records may predate token storage; recover them from the title.
  const knownTokens = history.map((r) => r.tokens ?? tokens(r.title ?? "")).filter((t) => t.length);

  const fresh = [];
  const skipped = [];
  const thisRun = [];

  for (const it of items) {
    const tk = tokens(it.title);

    if (urls.has(canonical(it.url))) { skipped.push({ ...it, reason: "url already handled" }); continue; }

    const prior = knownTokens.find((t) => similarity(t, tk) >= SIMILARITY_THRESHOLD);
    if (prior) {
      skipped.push({ ...it, reason: `same story already handled (overlap ${similarity(prior, tk).toFixed(2)})` });
      continue;
    }

    const dupe = thisRun.find((t) => similarity(t, tk) >= SIMILARITY_THRESHOLD);
    if (dupe) {
      skipped.push({ ...it, reason: `duplicate within this run (overlap ${similarity(dupe, tk).toFixed(2)})` });
      continue;
    }

    thisRun.push(tk);
    fresh.push({ ...it, fingerprint: fingerprint(it.title), tokens: tk });
  }
  return { fresh, skipped };
}

export function canonical(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    u.hash = "";
    // Strip campaign junk so the same article from two feeds collapses to one.
    for (const p of [...u.searchParams.keys()]) if (/^utm_|^ref$|^source$/i.test(p)) u.searchParams.delete(p);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}${u.search}`;
  } catch {
    return url;
  }
}

export async function recordSeen(entries) {
  if (!entries.length) return;
  await mkdir(DIR, { recursive: true });
  const at = new Date().toISOString();
  const lines = entries.map((e) =>
    JSON.stringify({ at, url: e.url, title: e.title, source: e.source, fingerprint: e.fingerprint ?? fingerprint(e.title), tokens: e.tokens ?? tokens(e.title), outcome: e.outcome ?? "considered", reason: e.reason ?? null })
  );
  await appendFile(SEEN, lines.join("\n") + "\n", "utf8");
}

export async function recordPosted(entry) {
  await mkdir(DIR, { recursive: true });
  const line = JSON.stringify({
    at: new Date().toISOString(),
    slug: entry.slug,
    mediaId: entry.mediaId,
    permalink: entry.permalink ?? null,
    url: entry.url,
    title: entry.title,
    source: entry.source,
    fingerprint: entry.fingerprint ?? fingerprint(entry.title),
    tokens: entry.tokens ?? tokens(entry.title),
    sources: entry.sources ?? [],
  });
  await appendFile(POSTED, line + "\n", "utf8");
}

/**
 * Minimum gap between two published posts.
 *
 * On 2026-07-25 two runs fired forty minutes apart. The second found nothing
 * publishable, so nothing happened — but had a story cleared, a second carousel
 * would have gone out forty minutes after the first, to an account holding one
 * post and zero followers. Nothing in the manual forbade it: the manual governs
 * one post per run, and says nothing about runs.
 *
 * Six hours allows up to four posts a day if the schedule ever calls for it,
 * while making the accidental double-post impossible. A manual re-run to test
 * the pipeline is exactly the situation that trips this, which is the point.
 */
export const MIN_GAP_HOURS = 6;

/**
 * The deliberate override, for when a human wants a second post the same day.
 *
 * The value is awkward on purpose. A flag like `FORCE=1` gets set once during a
 * test and then lives in the environment forever, quietly disarming the guard
 * for every future run. Something that has to be typed out in full is something
 * nobody sets by accident and nobody leaves behind without noticing.
 */
const OVERRIDE = "yes-i-want-a-second-post-today";

export async function publishGap() {
  const { posted } = await loadState();
  const last = posted.at(-1);
  if (!last) return { ok: true, hours: null, min: MIN_GAP_HOURS, last: null, overridden: false };

  const hours = (Date.now() - Date.parse(last.at)) / 3600000;
  const overridden = process.env.OOM_PUBLISH_ANYWAY === OVERRIDE;

  return {
    ok: hours >= MIN_GAP_HOURS || overridden,
    overridden: overridden && hours < MIN_GAP_HOURS,
    hours: Math.round(hours * 10) / 10,
    min: MIN_GAP_HOURS,
    last: { at: last.at, slug: last.slug, permalink: last.permalink ?? null },
  };
}

if (process.argv[1] && process.argv[1].endsWith("state.mjs")) {
  if (process.argv[2] === "guard") {
    const g = await publishGap();
    console.log(JSON.stringify(g, null, 2));
    if (!g.ok) {
      console.error(
        `\nBLOCKED — the last post went out ${g.hours}h ago and the minimum gap is ${g.min}h.` +
          `\nStop this run now. Do not research, render or publish.`
      );
      process.exit(1);
    }
    console.error(
      g.overridden
        ? `\nCLEAR to publish — BUT ONLY BECAUSE THE GUARD WAS OVERRIDDEN. The last post was ${g.hours}h ago, under the ${g.min}h minimum. Say this in your final report.`
        : "\nCLEAR to publish"
    );
  } else {
    const { posted, seen } = await loadState();
    console.log(JSON.stringify({ posted: posted.length, seen: seen.length, lastPosted: posted.at(-1) ?? null }, null, 2));
  }
}
