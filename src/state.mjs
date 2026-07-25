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
 */
const CONSIDERED_TTL_MS = 3 * 24 * 3600 * 1000;
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

if (process.argv[1] && process.argv[1].endsWith("state.mjs")) {
  const { posted, seen } = await loadState();
  console.log(JSON.stringify({ posted: posted.length, seen: seen.length, lastPosted: posted.at(-1) ?? null }, null, 2));
}
