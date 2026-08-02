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

import { readFile, writeFile, mkdir, appendFile, readdir } from "node:fs/promises";
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
/*
 * Shortened from 36 hours to 24 on 2026-08-02, when the daily floor became two
 * Reels. The arithmetic is the whole reason: the day now needs two publishable
 * stories instead of one, so the pool is asked for twice as much, while a
 * 36-hour window kept every story a scout weighed and passed over out of reach
 * until the middle of the NEXT day — past two of the four slots that would have
 * wanted it. A story that lost this morning's comparison should be comparable
 * again tomorrow morning, not tomorrow evening.
 *
 * 24 hours still does the job the window exists for, which is stopping the same
 * day's four runs from re-litigating each other's rejects: the widest gap
 * inside a day is 06:30 to 19:30, thirteen hours, comfortably inside it.
 */
const CONSIDERED_TTL_MS = 24 * 3600 * 1000;

/*
 * `revisit`: a good story the run could not publish YET, not one it judged
 * and passed over.
 *
 * On 2026-07-30 the 19:30 scout found three genuinely strong candidates
 * (LinkedIn's report-AI-slop button, Chrome fixing 1,072 bugs in a month,
 * a self-replicating prompt-injection worm in Copilot) and recorded all three
 * `considered` because they were one to two hours old and no second outlet
 * had picked them up yet. Correct call on the corroboration, wrong shelf:
 * 36 hours hides them from the next morning's scouts, and by the time they
 * reappear the second sources they were waiting for have made them ordinary.
 *
 * So the outcome now says WHY a story was left: `considered` means weighed
 * and beaten, `revisit` means blocked on something that resolves with time —
 * usually corroboration that has not been published yet. Six hours is one
 * news cycle: long enough that the same run's siblings do not re-litigate it,
 * short enough that the next slot sees it while it is still today's story.
 */
const REVISIT_TTL_MS = 6 * 3600 * 1000;
// `published-deleted`: the story went out, a human wiped the grid, and nobody
// should re-cover it as new — the 28 July morning run did exactly that after a
// wipe emptied posted.jsonl and took the fingerprints with it.
const BLOCKS_FOREVER = new Set(["posted", "rejected", "published-deleted"]);

/**
 * The most recent record by timestamp, never by file position. The ledgers
 * merge by union when two writers race (.gitattributes), and a union keeps
 * every line but promises nothing about order — so "last line" stopped meaning
 * "latest post" the day concurrent pushes became survivable.
 */
export const latestBy = (rows) =>
  rows.reduce((best, r) => (!best || Date.parse(r.at ?? 0) > Date.parse(best.at ?? 0) ? r : best), null);

/** Exported so the rule can be tested against the real code rather than a
 * reimplementation of it: a test that restates the logic proves nothing. */
export const stillBlocks = (r, now = Date.now()) => {
  const outcome = r.outcome ?? "posted"; // posted.jsonl entries carry no outcome
  if (BLOCKS_FOREVER.has(outcome)) return true;
  const at = Date.parse(r.at ?? "");
  const ttl = outcome === "revisit" ? REVISIT_TTL_MS : CONSIDERED_TTL_MS;
  return Number.isNaN(at) ? true : now - at < ttl;
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
  /*
   * Refuse anything that is not an array, loudly.
   *
   * The signature is `recordSeen([{ ...item, outcome, reason }])` — one array,
   * each entry carrying its own outcome. On 2026-08-02 a run called it the
   * other way round, `recordSeen(item, "considered", "why")`, which is the
   * shape the manual's prose suggests. `entries.length` was then `undefined`,
   * the guard below read that as "nothing to write", and the function returned
   * having written nothing and thrown nothing. The run's echo said "recorded 5"
   * and the ledger was untouched.
   *
   * That failure mode is the expensive one: `seen.jsonl` is what stops the next
   * run re-reading and re-publishing a story this one already weighed, so a
   * silent no-op here does not lose a log line, it loses the account's memory.
   * A caller that gets the shape wrong must find out now, not in the morning.
   */
  if (!Array.isArray(entries))
    throw new TypeError(
      "recordSeen: expects an ARRAY of entries — recordSeen([{ ...item, outcome, reason }]), not (item, outcome, reason). Each entry carries its own `outcome` and `reason` as fields."
    );
  if (!entries.length) return;
  await mkdir(DIR, { recursive: true });
  const at = new Date().toISOString();
  const lines = entries.map((e) =>
    JSON.stringify({ at, url: e.url, title: e.title, source: e.source, fingerprint: e.fingerprint ?? fingerprint(e.title), tokens: e.tokens ?? tokens(e.title), outcome: e.outcome ?? "considered", reason: e.reason ?? null })
  );
  await appendFile(SEEN, lines.join("\n") + "\n", "utf8");
}

export async function recordPosted(entry) {
  /*
   * Refuse a record that cannot recognise its own story.
   *
   * A run passed the wrong field names and the fingerprint came out as the
   * string "undefin" — the first seven characters of "undefined". It caught it
   * by eye on the echoed line. Had it not, `filterFresh` would never have
   * matched this story again and the next run would have been free to publish
   * it a second time, to the same audience, as new.
   *
   * The fingerprint is derived from the title, so a missing title is not a
   * cosmetic omission: it is a record that silently opts out of deduplication.
   */
  if (!entry?.slug) throw new Error("recordPosted: `slug` is required");
  if (!String(entry.title || "").trim())
    throw new Error(
      "recordPosted: `title` is required — the fingerprint and tokens are derived from it, and without them this story is invisible to filterFresh and can be republished as new. Pass { slug, mediaId, permalink, url, title, source }."
    );
  if (!String(entry.url || "").trim()) throw new Error("recordPosted: `url` is required (the story's source page)");

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
    // The Reel's real duration, so the watch can turn the API's average watch
    // time into a retention percentage. Optional: carousels never had one.
    ...(Number.isFinite(entry.durationS) ? { durationS: entry.durationS } : {}),
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
/*
 * Two hours, not six.
 *
 * Six was right for one post a day. On 2026-07-26 the account's first measured
 * numbers arrived and settled the strategy: the carousel got **zero views**, and
 * the Reel got 168 from an audience that was 100% non-followers, 89.9% of it
 * from the Reels tab. Reels are the only surface where strangers exist, so the
 * cadence became four runs a day, one Reel each.
 *
 * The six-hour gap was already the binding constraint before anyone chose that:
 * the first live run published its carousel and its Reel and was then blocked
 * from a second story by its own guard. The guard is still here and still worth
 * having — it is what stopped two carousels going out forty minutes apart — but
 * it now measures the distance between scheduled runs (four to five hours) with
 * margin, rather than forbidding the cadence outright.
 */
export const MIN_GAP_HOURS = 2;

/**
 * The deliberate override, for when a human wants a second post the same day.
 *
 * The value is awkward on purpose. A flag like `FORCE=1` gets set once during a
 * test and then lives in the environment forever, quietly disarming the guard
 * for every future run. Something that has to be typed out in full is something
 * nobody sets by accident and nobody leaves behind without noticing.
 */
const OVERRIDE = "yes-i-want-a-second-post-today";

/**
 * The four scheduled slots, and how close we are to one.
 *
 * A run reported the thing nobody had noticed: a hand-launched run inside two
 * hours of a scheduled slot silently eats that slot, and nothing warns you at
 * launch time — you find out afterwards, from the blocked run's report. It cost
 * nothing that evening because the day still delivered four Reels, but the
 * person launching by hand is the one who needs to know, before they launch.
 */
/*
 * The four scheduled slots, on the hour they actually fire.
 *
 * The third entry read 15 until 2026-08-02, three days after Hasan moved the
 * afternoon publish from 15:00 to 16:30 (2026-07-29) to sit inside the French
 * 18h–19h engagement peak. Only `nextSlot` reads this, and only to warn that
 * publishing now would leave the next slot inside the 2-hour gap — so the stale
 * 15 made that warning fire an hour early and, worse, understated the gap. It
 * matters more now that two of the four slots publish rather than one.
 */
export const SLOTS_UTC = [6, 10, 16, 19];

export function nextSlot(now = new Date()) {
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  const next = SLOTS_UTC.find((s) => s > h);
  const hours = next === undefined ? 24 - h + SLOTS_UTC[0] : next - h;
  return {
    slotUtc: next === undefined ? SLOTS_UTC[0] : next,
    hours: Math.round(hours * 10) / 10,
    wouldEatIt: hours < MIN_GAP_HOURS,
  };
}

/**
 * Is another run alive right now?
 *
 * The publish gap guard cannot see one. It measures time since the last
 * RECORDED publication, and a run that is halfway through a build has recorded
 * nothing — it has spent a dollar fifty and has nothing to show a guard. So on
 * 2026-07-31, when Hasan hand-launched the day's run an hour before the
 * scheduled one, the two would have been invisible to each other: the 16:36 run
 * would have found no Reel for the day, no gap violation and no orphan on the
 * account, and started a second build. Two Reels in a day, against a ceiling the
 * manual calls hard, and neither run doing anything wrong.
 *
 * The flight recorder is the signal that already exists. Runs land their journal
 * before every purchase, so a journal whose last line is minutes old means
 * somebody is working. File mtimes are useless here — a fresh clone stamps every
 * file with the checkout time — so the timestamp comes from the content: the
 * date is in the filename, the time is in the line.
 *
 * This reports; it does not block. A journal left warm by a run that died would
 * otherwise cost the day its Reel, which is a worse failure than the one being
 * prevented. The manual carries the procedure: wait, look again, and if the
 * other journal has not moved, it is not a run any more.
 */
export async function runsInFlight({ now = Date.now(), mine = process.env.RUN_JOURNAL || "", warmMinutes = 20 } = {}) {
  const dir = path.join(ROOT, "reports", "journal");
  let names = [];
  try {
    names = (await readdir(dir)).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const mineBase = mine ? path.basename(mine) : "";
  const out = [];
  for (const name of names) {
    if (name === mineBase) continue;
    const day = name.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    if (!day) continue;
    let text = "";
    try { text = await readFile(path.join(dir, name), "utf8"); } catch { continue; }
    const times = [...text.matchAll(/^- (\d{2}:\d{2}(?::\d{2})?)\b/gm)].map((m) => m[1]);
    if (!times.length) continue;
    const clock = times.at(-1).length === 5 ? `${times.at(-1)}:00` : times.at(-1);
    let t = Date.parse(`${day}T${clock}Z`);
    if (!Number.isFinite(t)) continue;
    // A run that crosses midnight UTC keeps writing into the previous day's
    // file, so a line that looks 20 hours old is really minutes old. But that
    // correction only applies to a run that really did cross midnight, and the
    // filename says whether it could have: a journal named `<day>-19h.md` whose
    // last line reads 19:37 is a day old, not three minutes old. Shifting it
    // anyway made every scheduled run see yesterday's run at the same slot as
    // alive (measured, 19h run of 2026-07-31), which tells a publish run to
    // stand down and hand the day away. So shift only when the clock is earlier
    // in the day than the slot the file is named for, and when the name carries
    // no slot hour, do not shift: a missed warning costs a wait, a false one
    // costs the day's Reel.
    const slotHour = Number(name.match(/^\d{4}-\d{2}-\d{2}-(\d{2})h/)?.[1]);
    const lineHour = Number(clock.slice(0, 2));
    if (now - t > 12 * 3600_000 && Number.isFinite(slotHour) && lineHour < slotHour) t += 24 * 3600_000;
    if (t - now > 5 * 60_000) continue;            // clock skew or a bad line: not evidence
    const minutesAgo = Math.round(((now - t) / 60_000) * 10) / 10;
    if (minutesAgo <= warmMinutes) out.push({ journal: `reports/journal/${name}`, lastLineAt: new Date(t).toISOString(), minutesAgo });
  }
  return out.sort((a, b) => a.minutesAgo - b.minutesAgo);
}

export async function publishGap() {
  const { posted } = await loadState();
  const last = latestBy(posted);
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

/**
 * Whether this run owes a carousel, and what has gone out lately.
 *
 * Four runs a day each publish one Reel; the carousel exists for the profile
 * grid a Reel viewer taps through to, and one is enough. A run has no memory of
 * its siblings, so it asks this rather than guessing.
 *
 * A ROLLING WINDOW, not a calendar day, and the difference is not academic. The
 * first version counted carousels since midnight UTC. A carousel published at
 * 23:54:52 UTC therefore belonged to yesterday, and the run six hours later was
 * told the grid was empty and owed a second one — reasoning honestly from an
 * arbitrary boundary. Hours since the last carousel cannot be gamed by where a
 * clock happens to fall.
 */
export const REEL_EVERY_HOURS = 20;

/**
 * How many Reels a single UTC day may carry.
 *
 * One was the rule until 2026-08-01, when Hasan raised it: *"c'est un reel par
 * jour minimum; quand il y a beaucoup d'histoires qui sont intéressantes, j'en
 * veux deux… ce n'est pas un problème que ça devienne une norme."* So two is a
 * normal day, not an exception that needs defending, and `REEL_EVERY_HOURS`
 * keeps meaning what it always meant: the FLOOR the bio promises, not a cap.
 *
 * The hard ceiling that survives is one Reel per RUN, and it is not enforced
 * here because no run can see its siblings mid-build — it is enforced by the
 * run itself, which stops publishing once it has published (manual, step 11).
 * What this constant does is stop a run reasoning from `due: false` that the
 * day is closed: the day is closed when `roomToday` is 0.
 *
 * A CALENDAR DAY here, deliberately, unlike REEL_EVERY_HOURS above. "Two a day"
 * is a statement about a day, so it has to be counted on the same boundary the
 * bio's reader uses. The rolling window still governs the gap and the floor, so
 * a Reel at 23:50 UTC cannot unlock two more at 00:10: the 2h gap and the
 * 20h floor both still apply on top of this.
 */
export const REELS_PER_DAY_MAX = 2;

/**
 * How many Reels a single UTC day OWES. This is the floor, and it is the
 * number a run is failing when it publishes less.
 *
 * It was 1 — expressed only as `REEL_EVERY_HOURS`, a rolling 20-hour gap —
 * until 2026-08-02, when Hasan closed the gap between "two are allowed" and
 * "two happen": *"je veux minimum 2 reels publiés par jour à partir de
 * maintenant ! systématiquement 2 par jour"*.
 *
 * The distinction that matters, because the previous rule kept producing
 * one-Reel days while being followed to the letter: two a day stopped being
 * PERMISSION and became an OBLIGATION. A run that publishes the day's first
 * Reel has not met the day's promise, it has met half of it, and the second is
 * owed exactly the way the first one is. `due` is computed from this constant
 * now, not from the rolling gap, because a floor counted in hours can be
 * satisfied by a single post and a floor counted in posts cannot.
 *
 * What did NOT change, and must not be inferred away:
 *   - One Reel per RUN is still the hard ceiling (the 27 July death). Two a day
 *     is therefore always the work of two runs.
 *   - The 2-hour spacing guard still applies between them.
 *   - Promise 1 outranks this. A story that cannot be verified is not
 *     published to make a count, ever — a missed floor is named in the report,
 *     it is never met with something unsourced.
 */
export const REELS_PER_DAY_MIN = 2;

/** Same UTC calendar day. Used only by the per-day Reel count. */
export const sameUtcDay = (a, b) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

/** The old name, kept so nothing outside this file breaks on the rename.
 * Carousels are retired; the cadence it measured is the Reel's now. */
export const CAROUSEL_EVERY_HOURS = REEL_EVERY_HOURS;

/**
 * Is this published record a Reel?
 *
 * By what Instagram gave back, not by the slug. This used to test the slug for
 * "-reel" and no slug this account has ever written contains it: the account's
 * slugs are dated story names (`2026-07-30-opus5-vending-cartels`). So it
 * returned false for everything, and `state.mjs today` — the report a run reads
 * at step 0 — has been saying `"reels": 0` after publishing a Reel and counting
 * that Reel as a carousel, on an account where carousels are retired.
 *
 * The permalink is the fact: Instagram serves Reels under `/reel/` and feed
 * posts under `/p/`. `durationS` backs it up, because only a Reel record carries
 * one. A record with neither is old or hand-written, and reads as not-a-Reel,
 * which is what it would have done before.
 */
export const isReel = (p) => /\/reel\//.test(p.permalink || "") || Number(p.durationS) > 0;

/**
 * What this account has been talking about, so a run can avoid saying it again.
 *
 * Two runs in a row published an AI-breaks-security story — the OpenAI test
 * model breaking into Hugging Face, then Kimi K3 finding Redis zero-days. Both
 * were real, both were what was actually happening that week, and the second run
 * flagged it itself: "back-to-back it reads as a narrow account." Nothing else
 * could see it. `filterFresh` dedupes stories, not subjects, so two distinct
 * stories about the same thing pass every check we have.
 *
 * These themes are coarse on purpose. The judgement of whether a story is really
 * the same subject belongs to the run; this only puts the recent record in front
 * of it, in one line, so the question gets asked.
 */
const THEMES = {
  security: /\b(hack|hacked|hacking|breach|exploit|zero[- ]day|vulnerab|malware|ransom|intrusion|cyber|penetrat)/i,
  jobs: /\b(layoff|laid off|job cuts|redundanc|fired|hiring freeze|workforce|replace(d|s)? (staff|workers|people))/i,
  money: /\b(billion|valuation|funding|raise[sd]?|backstop|invest|ipo|revenue|bubble)/i,
  safety: /\b(lawsuit|sued|suing|regulat|ban|court|liabilit|harm|died|death|injur)/i,
  models: /\b(launch|releas|open[- ]sourc|weights|benchmark|model card|outperform)/i,
  infra: /\b(data cent|datacent|gigawatt|power|grid|chips?|gpu|fab|energy)/i,
};

export function themesOf(text) {
  const t = String(text || "");
  return Object.entries(THEMES).filter(([, re]) => re.test(t)).map(([k]) => k);
}

/*
 * `posts` was 4 until 2026-08-02. Four stories used to be four days of grid; at
 * two Reels a day it is two, and the question this command exists to answer —
 * "would a stranger scrolling our recent posts think this account is narrow?" —
 * is asked about a scroll, not about a day. Six keeps it three days wide, which
 * is what four used to buy.
 */
export async function recentThemes(now = new Date(), { posts = 6 } = {}) {
  const { posted } = await loadState();
  // One entry per story: a carousel and its Reel share a title and would
  // otherwise count twice.
  const seen = new Set();
  const stories = [];
  const newestFirst = [...posted].sort((a, b) => Date.parse(b.at ?? 0) - Date.parse(a.at ?? 0));
  for (const p of newestFirst) {
    const key = p.fingerprint || p.title || p.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    stories.push(p);
    if (stories.length >= posts) break;
  }
  const counts = {};
  for (const p of stories) for (const th of themesOf(`${p.title || ""} ${p.slug || ""}`)) counts[th] = (counts[th] || 0) + 1;
  const runOn = Object.entries(counts).filter(([, n]) => n >= 2).map(([k]) => k);
  return {
    stories: stories.map((p) => ({ at: p.at, title: p.title || p.slug, themes: themesOf(`${p.title || ""} ${p.slug || ""}`) })),
    counts,
    runOn,
  };
}

/**
 * What the account owes today.
 *
 * This answered a retired question until 2026-07-31: it measured the gap since
 * the last CAROUSEL and reported `lastCarousel` and a carousel count, three days
 * after the manual started telling runs that "`state.mjs today` no longer
 * reports a carousel as owed". A run reading it saw `"due": true` beside a
 * `lastCarousel` field and a Reel counted as a carousel — the report and the
 * manual said different things about the same account.
 *
 * It now measures what there is to measure: the gap since the last publication
 * of any kind, and what the last 24 hours actually contain. `due` is the bio's
 * promise — one story a day — not a carousel cadence.
 */
export async function publishDue(now = new Date()) {
  const { posted } = await loadState();
  const last = latestBy(posted);
  const hours = last ? (now - new Date(last.at)) / 3600000 : null;
  const since24 = posted.filter((p) => now - new Date(p.at) < 24 * 3600000);
  const reelsToday = posted.filter((p) => isReel(p) && sameUtcDay(new Date(p.at), now)).length;
  const owedToday = Math.max(0, REELS_PER_DAY_MIN - reelsToday);
  return {
    // The floor is counted in Reels published today, not in hours since the
    // last one: a rolling gap goes quiet after a single post and that is
    // exactly how the account kept producing one-Reel days (Hasan, 2026-08-02).
    due: owedToday > 0,
    hoursSinceLastPost: hours === null ? null : Math.round(hours * 10) / 10,
    every: REEL_EVERY_HOURS,
    reelsToday,
    dailyMin: REELS_PER_DAY_MIN,
    owedToday,
    dailyMax: REELS_PER_DAY_MAX,
    roomToday: Math.max(0, REELS_PER_DAY_MAX - reelsToday),
    lastPost: last ? { at: last.at, slug: last.slug, reel: isReel(last) } : null,
    last24h: { reels: since24.filter(isReel).length, other: since24.filter((p) => !isReel(p)).length },
  };
}

/**
 * A grid wipe with the memory kept.
 *
 * When Hasan empties the account, the repo's record follows — but the first
 * wipe emptied posted.jsonl and the anti-repeat fingerprints died with it, so
 * the next morning's run re-covered a story the account had already told.
 * Wiping is now one command: every published record migrates into seen.jsonl
 * as `published-deleted` (blocks forever), and only then are the ledgers of
 * dead media emptied.
 */
export async function wipeGrid({ dir = DIR } = {}) {
  const postedFile = path.join(dir, "posted.jsonl");
  const seenFile = path.join(dir, "seen.jsonl");
  const metricsFile = path.join(dir, "metrics.jsonl");
  const posted = await readJsonl(postedFile);
  const at = new Date().toISOString();
  const lines = posted.map((p) =>
    JSON.stringify({
      at, url: p.url ?? null, title: p.title ?? p.slug, source: p.source ?? null,
      fingerprint: p.fingerprint ?? fingerprint(p.title ?? p.slug ?? ""),
      tokens: p.tokens ?? tokens(p.title ?? ""),
      outcome: "published-deleted", reason: `grid wipe ${at.slice(0, 10)}`,
    })
  );
  if (lines.length) await appendFile(seenFile, lines.join("\n") + "\n", "utf8");
  await writeFile(postedFile, "", "utf8");
  await writeFile(metricsFile, "", "utf8");
  return { migrated: lines.length };
}

if (process.argv[1] && process.argv[1].endsWith("state.mjs")) {
  if (process.argv[2] === "themes") {
    const r = await recentThemes();
    for (const s2 of r.stories) console.log(`${s2.at.slice(0, 16)}  [${s2.themes.join(", ") || "-"}]  ${s2.title.slice(0, 66)}`);
    console.error(
      r.runOn.length
        ? `\nTHE LAST ${r.stories.length} STORIES LEAN ON: ${r.runOn.join(", ")}. A third in a row reads as a narrow account. Prefer a story that is not about ${r.runOn.join(" or ")}, unless today's is genuinely the biggest thing happening.`
        : `\nNo theme repeats across the last ${r.stories.length} stories. Nothing to avoid.` +
          "\nThis compares WORDS. You compare MEANING, and at two Reels a day the grid fills twice as fast:" +
          " ask in words what a stranger would say the last six posts are about, and check the day's TWO Reels are not one subject twice."
    );
  } else if (process.argv[2] === "today") {
    /*
     * Carousels are retired (2026-07-28), and the published record settled it:
     * every carousel this account made measured 0 reach, and the final one
     * peaked at a single view, because Instagram does not push feed posts from
     * an account nobody follows. Worse, carousel-first ordering cost a Reel —
     * the 2026-07-27 run published its carousel, then died on a usage limit
     * while still building the Reel. All of the spend, none of the discovery.
     * Reels carry share_to_feed=true now, so the Reel IS the grid.
     */
    const t = await publishDue();
    console.log(JSON.stringify({ ...t, carouselsRetired: "2026-07-28" }, null, 2));
    console.error("\nCarousels are retired. This run publishes a Reel or nothing; Reels populate the grid themselves.");
    console.error(
      t.owedToday > 0
        ? `\nThe day holds ${t.reelsToday} Reel(s) and OWES ${t.owedToday} more of ${t.dailyMin}.` +
            " `due` is true. Two Reels a day is the floor Hasan set on 2026-08-02, not a target:" +
            " publishing one and scouting is a HALF-KEPT day, and it is named as a miss in the report." +
            " One Reel per RUN is still the ceiling, so this run publishes one and the next slot owes the other."
        : `\nThe day holds ${t.reelsToday} Reel(s) of ${t.dailyMax}, so the floor of ${t.dailyMin} is met and the day is full.` +
            " You are a scout: bank TWO gate-clean candidates for tomorrow, because tomorrow owes two."
    );
  } else if (process.argv[2] === "guard") {
    const role = process.argv[3] === "scout" ? "scout" : "publish";
    const g = await publishGap();
    const others = await runsInFlight();
    console.log(JSON.stringify({ ...g, role, otherRunsInFlight: others }, null, 2));
    if (others.length && role !== "scout") {
      console.error(
        `\nANOTHER RUN IS ALIVE. ${others.map((o) => `${o.journal} wrote a line ${o.minutesAgo} minutes ago`).join("; ")}.` +
          "\nIt has probably spent money and has certainly not recorded anything yet, so no guard here can see it:" +
          "\nthe gap guard measures time since the last RECORDED publication, and a build in progress has recorded nothing." +
          "\nDo not build. Wait ten minutes and run this again. If that journal has not moved, the run behind it is dead" +
          "\nand the day is yours; if it has, you are the scout for tomorrow. Say which one you concluded, and why."
      );
    }
    if (!g.ok) {
      // The guard exists to stop a second PUBLICATION landing too close to the
      // first. A scout publishes nothing, so killing it here only costs the
      // day its preparation — which is what happened on 2026-07-28 when the
      // morning publish put the 10:00 scout inside the gap for no benefit.
      if (role === "scout") {
        console.error(
          `\nGAP ACTIVE (last post ${g.hours}h ago, minimum ${g.min}h) — but you are a scout and publish nothing.` +
            `\nCarry on: gather, verify, leave the candidate on main. Do NOT publish anything this run.`
        );
      } else {
        console.error(
          `\nBLOCKED — the last post went out ${g.hours}h ago and the minimum gap is ${g.min}h.` +
            `\nA publish run stops here. This guard is about SPACING, not about the daily count:` +
            `\nthe day may still be owed a Reel, or still have room for its second, and a later slot will have both.`
        );
        process.exit(1);
      }
    }
    if (!g.ok) { /* scout with the gap active: notes above, nothing else to print */ } else {
    const slot = nextSlot();
    if (slot.wouldEatIt)
      console.error(
        `\nNOTE: the next scheduled slot is ${String(slot.slotUtc).padStart(2, "0")}:00 UTC, ${slot.hours}h away, which is inside the ${MIN_GAP_HOURS}h gap. ` +
          `If this run publishes, that slot will be blocked when it fires. Check \`state.mjs today\` for roomToday before you decide: ` +
          `if the day would still have room for another Reel afterwards, that slot losing its turn may cost the day one. Say so in your report.`
      );
    console.error(
      g.overridden
        ? `\nCLEAR to publish — BUT ONLY BECAUSE THE GUARD WAS OVERRIDDEN. The last post was ${g.hours}h ago, under the ${g.min}h minimum. Say this in your final report.`
        : "\nCLEAR to publish"
    );
    }
  } else if (process.argv[2] === "wipe-grid") {
    const r = await wipeGrid();
    console.log(JSON.stringify(r, null, 2));
    console.error(
      `\n${r.migrated} published record(s) migrated to seen.jsonl as published-deleted; posted.jsonl and metrics.jsonl emptied.` +
        `\nCommit and land this with land.mjs, then delete the posts in the app if not already done.`
    );
  } else {
    const { posted, seen } = await loadState();
    console.log(JSON.stringify({ posted: posted.length, seen: seen.length, lastPosted: latestBy(posted) ?? null }, null, 2));
  }
}
