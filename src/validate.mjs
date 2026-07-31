/**
 * The fact gate. A post spec that does not pass this is never rendered.
 *
 * The point of this file is that "no hallucinations" must be a property of the
 * system, not a promise in a prompt. A language model asked to be careful will
 * usually be careful; that is not the same as being unable to invent a figure.
 * So each content slide must carry `evidence`: a verbatim sentence from the
 * source it cites. Then:
 *
 *   1. every number in the slide's body must also appear in its evidence
 *      -> a figure cannot be recomputed, rounded or imagined
 *   2. in online mode, the cited page is fetched and the evidence string must
 *      actually occur in it
 *      -> a quotation cannot be fabricated, because we go and look
 *
 * Checks fail CLOSED. An unreachable source is not "probably fine", it is
 * unverifiable, and unverifiable does not get published.
 */

import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { tokens } from "./state.mjs";
import { simplicityIssues } from "./promptcraft.mjs";
import {
  BEATS_MIN, BEATS_MAX, STILLS_MAX, REAL_MIN, DEFAULT_RATE, BEAT_MIN_WORDS, RATE_SAMPLES_MIN,
  VEO_MAX_S, VEO_STRETCH_MAX, beatSeconds, medianRate, wordWindow, TARGET_S,
} from "./format.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const UA = "order-of-magnitude/1.0 (+https://github.com/hasso5703/ig-autopilot)";

const CAPTION_MAX = 2200;      // Instagram's hard limit
const SLIDES_MIN = 4;
const SLIDES_MAX = 10;         // Meta's carousel ceiling
const HOOK_MAX_CHARS = 95;     // beyond this the auto-fit shrinks it to unreadable
const EVIDENCE_MIN_CHARS = 40;
const STALE_DAYS = 4;          // beyond this the newest source is not news any more
const FIGURE_MAX_CHARS = 6;    // what the stat archetype can actually render at 190px on one line

/**
 * How much of the central claim's vocabulary a corroborating quote must echo.
 *
 * Calibrated against the case that exposed the hole. The claim was about
 * librarians running workshops teaching people to switch AI features off. A
 * genuine second report of that story repeats librarians, workshops, AI and
 * usually the town; an article about the AI backlash in general repeats only
 * "AI". Below MIN is another subject and is rejected. Between MIN and THIN it
 * is on topic but sparse, which is worth a human glance, not a refusal.
 *
 * These are floors, not proofs. Nothing mechanical can confirm that a page
 * supports a claim; this only rules out that it is about something else.
 */
const CLAIM_OVERLAP_MIN = 0.25;
const CLAIM_OVERLAP_THIN = 0.45;

/**
 * Distinctive vocabulary shared between a claim and a quote.
 * Reuses the pipeline's own tokeniser so "workshops" and "workshop" collide.
 */
export function claimOverlap(claim, quote) {
  const a = new Set(tokens(claim));
  const b = new Set(tokens(quote));
  if (!a.size) return { shared: [], ratio: 0 };
  const shared = [...a].filter((t) => b.has(t));
  return { shared, ratio: shared.length / a.size };
}

/** Digit runs, normalised: "1,050" -> "1050", "$30.5B" -> "30.5".
 * French copy groups thousands with spaces: "1 100" in a script must match
 * "1,100" in an English evidence quote. A space only joins digits when it
 * separates groups of exactly three ("10 000"), so "July 27, 2026" stays two
 * numbers and never merges. Decimals stay on the point: figures are copied as
 * the source writes them ("3.5"), never re-punctuated into "3,5". */
/**
 * A hostname is a name, and the digits inside it are spelling, not evidence.
 *
 * The caption of every post credits its sources by domain, and on 2026-07-31 one
 * of them was `actionnews5.com`. The gate extracted "5" from it, found no
 * evidence quote containing a 5, and refused the post \u2014 for a figure nobody had
 * claimed. The run spent a gate round adding a quote that carried the words
 * "Action News 5" purely to satisfy the arithmetic. Local American television is
 * numbered by convention (Action News 5, WMC 5, Channel 4), so this was never a
 * one-off, and the same trap sits in any URL with a year in its path.
 *
 * Only whole hostnames and URLs are removed, and only when the part after the
 * last dot is alphabetic \u2014 so "actionnews5.com" goes and "1.2", "GPT-5.6" and
 * "2,000" stay, which is the whole point.
 */
const HOSTS = /\bhttps?:\/\/\S+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.[a-z]{2,}\b/gi;

/**
 * French written without its accents.
 *
 * Both runs on 2026-07-31 wrote their entire first draft — narration, caption,
 * every script — as "penurie", "memoire", "telephone". Both caught it by
 * re-reading, and both said in their report that nothing in the pipeline would
 * have. They were right: it gates green, and then the voice reads "retire" for
 * "retiré" and "installees" for "installées" through a whole Reel, in public,
 * on an account whose entire promise is that a human checked it.
 *
 * Two nets, because they fail differently. The density check is the one that
 * cannot argue: measured on this account's own published French, narration runs
 * 3.8–4.0% accented letters and a stripped draft runs 0.00%, so a floor of 1%
 * over a body long enough to be meaningful sits four times below real French and
 * far above a stripped one. It says nothing about a short string — the hook card
 * "xAI fait tourner 69 turbines sans permis" is legitimately 0%.
 *
 * The word list catches the half-stripped draft the density check would let by,
 * and every entry on it is a word whose unaccented form is not French at all.
 * Ambiguous ones are deliberately absent: "retire", "marche", "a" and "ou" are
 * all real words without their accents, and a rule that cries wolf on those
 * would be turned off within a week.
 */
const NEVER_UNACCENTED =
  /\b(?:tres|apres|deja|etre|etait|etaient|memes?|systemes?|modeles?|problemes?|donnees|securite|energie|electricite|realite|verite|qualite|capacite|activite|societes?|annees?|premiere|derniere|penurie|memoire|telephones?|numerique|resultats?|interet|acces|succes|progres|evenement|developpement|reseaux?|operationnel|prefere)\b/gi;

const ACCENTED = /[àâäéèêëîïôöùûüçœæ]/gi;
const LETTERS = /[a-zàâäéèêëîïôöùûüçœæ]/gi;

/** Accented letters per 100 letters. Only meaningful over a real body of text. */
export function accentDensity(text) {
  const letters = (String(text).match(LETTERS) || []).length;
  if (!letters) return { letters: 0, accents: 0, per100: null };
  const accents = (String(text).match(ACCENTED) || []).length;
  return { letters, accents, per100: (accents / letters) * 100 };
}

/** Where French has lost its accents. `min` letters before the density test
 * means anything; below that only the word list speaks. */
export function frenchAccentIssues(text, { min = 200 } = {}) {
  const out = [];
  const s = String(text || "");
  const { letters, per100 } = accentDensity(s);
  if (letters >= min && per100 < 1)
    out.push(
      `${per100.toFixed(2)}% of its letters carry an accent, over ${letters} letters. This account's own published French runs 3.8 to 4.0%. ` +
        `The accents have been stripped: the gate cannot see it, and the voice will read them out.`
    );
  const words = [...new Set((s.match(NEVER_UNACCENTED) || []).map((w) => w.toLowerCase()))];
  if (words.length) out.push(`unaccented French: ${words.slice(0, 8).join(", ")}${words.length > 8 ? "…" : ""}`);
  return out;
}

const numbers = (s) =>
  (String(s).replace(HOSTS, " ").match(/\d{1,3}(?:[\u00A0\u202F ]\d{3})+(?:\.\d+)?|\d[\d,]*(?:\.\d+)?/g) || []).map((n) =>
    n.replace(/[,\u00A0\u202F ]/g, "").replace(/\.$/, "")
  );

/**
 * The account's own measured speaking rate, in French words per second.
 *
 * The word window a script has to hit is not a taste; it is the arithmetic of a
 * 60-second file, and the only unknown in it is how fast the voice reads. The
 * engine writes every raw reading to `state/voice-rate.jsonl`, so the window
 * follows the voice instead of a number somebody typed once. The last dozen
 * readings, not all of them: a voice or direction change should take effect in
 * days, not be averaged away by history.
 */
/** The readings the window is built from: this voice's when there are enough of
 * them, the whole ledger otherwise. Voices differ by up to 18% in pace —
 * measured across six on 2026-07-31 — so a ledger full of the previous voice
 * would size the next Reels wrong, which is exactly the window's job to prevent.
 *
 * The floor is `RATE_SAMPLES_MIN`, read from format.mjs rather than written here.
 * It was a hardcoded 3 in this function while format.mjs said 3 as well, and the
 * two agreed by luck until the floor moved to 4 — at which point the gate would
 * have sized scripts from a sample its own module considers too small. */
export function voiceSamples(voice) {
  try {
    const all = readFileSync(path.join(ROOT, "state", "voice-rate.jsonl"), "utf8")
      .split("\n").filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const mine = all.filter((r) => !voice || r.voice === voice);
    return (mine.length >= RATE_SAMPLES_MIN ? mine : all).slice(-12);
  } catch { return []; }
}

function measuredRate(voice) {
  const sample = voiceSamples(voice);
  return sample.length ? medianRate(sample) : DEFAULT_RATE;
}

/**
 * Product and model names that carry a version: "Mythos 5", "Claude Opus 4.7",
 * "GPT-5.6". These are the names an edit can silently swap, and swapping one
 * changes who did what.
 *
 * The near-miss this exists for, 2026-07-31: Anthropic disclosed three separate
 * incidents. Claude Mythos 5 published the malicious PyPI package; Claude Opus
 * 4.7 was the one that kept attacking after realising the target was real. The
 * scouts' script narrated the PyPI story for five beats saying only "Claude",
 * then named "Opus 4.7" in the sixth — every sentence true, and a viewer with
 * six seconds reconstructs one story in which Opus 4.7 shipped the malware.
 * Nothing caught it: the digits were quoted, the quotes were verbatim, the gate
 * was green twice. A name is a fact, and until now it was the only kind of fact
 * on this account that nothing checked.
 *
 * Years and counts are excluded — the number must be small or carry a decimal,
 * which is what a version looks like and what "2026" and "141,006" do not.
 */
export function versionedActors(text) {
  const out = [];
  const s = String(text || "");
  const isVersion = (n) => /\./.test(n) || Number(n) < 100;
  const isActor = (name) => !NOT_A_VERSIONED_NAME.has(name.split(/\s+/).at(-1).toLowerCase());
  for (const m of s.matchAll(/\b((?:[A-Z][A-Za-z]{2,}\s+){0,2}[A-Z][A-Za-z]{2,})\s+(\d+(?:\.\d+)?)\b/g)) {
    if (isVersion(m[2]) && isActor(m[1])) out.push(`${m[1]} ${m[2]}`);
  }
  for (const m of s.matchAll(/\b([A-Z][A-Za-z]{2,}-\d+(?:\.\d+)?)\b/g)) if (isActor(m[1].split("-")[0])) out.push(m[1]);
  return [...new Set(out)];
}

/** A capitalised word before a number is usually a sentence opener or a date,
 * not a model: "On 27 July", "Depuis 5 ans", "Sur 15 machines". The check only
 * exists to catch product versions, so anything that reads as prose is out. */
const NOT_A_VERSIONED_NAME = new Set([
  ...["january", "february", "march", "april", "may", "june", "july", "august",
    "september", "october", "november", "december"],
  ...["janvier", "février", "fevrier", "mars", "avril", "mai", "juin", "juillet",
    "août", "aout", "septembre", "octobre", "novembre", "décembre", "decembre"],
  ...["the", "this", "that", "these", "those", "and", "but", "for", "with", "from",
    "over", "under", "about", "after", "before", "between", "since", "only", "all",
    "some", "each", "every", "one", "two", "three", "another", "than", "then", "when",
    "where", "what", "who", "how", "why", "now", "new", "its", "their", "his", "her",
    "they", "there", "was", "were", "are", "has", "have", "had", "said", "says"],
  ...["le", "la", "les", "un", "une", "des", "du", "de", "dans", "sur", "avec", "pour",
    "par", "que", "qui", "est", "sont", "ils", "elle", "son", "ses", "ces", "cette",
    "depuis", "selon", "après", "apres", "avant", "plus", "moins", "tout", "tous",
    "environ", "près", "pres", "soit", "puis", "donc", "mais", "chaque", "entre"],
]);

/** "Claude Mythos 5" is also "Mythos 5" when spoken. Both spellings satisfy the
 * naming rule; neither is satisfied by saying "Claude" alone. */
const actorForms = (name) => {
  const parts = name.split(/\s+/);
  // The full name and the short one a French sentence would actually use. Never
  // the bare version number: "5" is in half the scripts this account writes.
  return [...new Set([name, parts.slice(-2).join(" ")])].filter((f) => /[A-Za-z]{2}/.test(f));
};

/**
 * Named entities, decoded because a page that writes `&rsquo;` was answering
 * NOT_FOUND on a quote that was on it word for word. Numeric entities were
 * already handled, which is why the gap stayed invisible: TechCrunch serves a
 * literal apostrophe, Digital Trends serves `&rsquo;`, and only the second one
 * broke. Same failure shape as the markup-split quote — the sentence is really
 * there, the flattened page just does not spell it the same way.
 */
const NAMED_ENTITIES = {
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", apos: "'", quot: '"',
  mdash: "—", ndash: "–", hellip: "…", lt: "<", gt: ">", nbsp: " ",
  // Punctuation a newsroom actually emits around figures and quotes.
  deg: "°", euro: "€", pound: "£", cent: "¢", times: "×", minus: "−",
  frac12: "1/2", frac14: "1/4", frac34: "3/4", middot: "·", bull: "•",
  laquo: "«", raquo: "»", sbquo: "‚", bdquo: "„", prime: "′",
  // Accented Latin-1. The account writes French and reads sources that spell
  // café, Pokémon and Nvidia's señor with entities; without these a quote
  // carrying one is unmatchable, which is the same failure as &rsquo; wearing a
  // different letter.
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", agrave: "à", acirc: "â",
  auml: "ä", aacute: "á", ccedil: "ç", icirc: "î", iuml: "ï", iacute: "í",
  ocirc: "ô", ouml: "ö", oacute: "ó", ugrave: "ù", ucirc: "û", uuml: "ü",
  uacute: "ú", ntilde: "ñ", szlig: "ß", oslash: "ø", aring: "å", aelig: "æ",
  // Keys are lower-case only: the lookup lower-cases the entity name, and
  // flatten lower-cases the whole page before any comparison, so `&Eacute;` and
  // `&eacute;` resolve to the same thing. A capitalised key here would be a line
  // that can never run.
};

/**
 * Tags that never break a word, and are therefore removed without leaving a
 * space where they stood.
 *
 * Every tag used to become a space, which is right for a paragraph and wrong for
 * a subscript. TechCrunch sets nitrogen oxides as `NO<sub>x</sub>`, so the
 * flattened page read "no x" while the quote read "nox", and the gate answered
 * NOT_FOUND on a sentence that was on the page word for word. The 15:35 run lost
 * a gate round to it and then rewrote the beat — "polluants qui forment le smog"
 * instead of the term the source uses — to route around a bug in this file. That
 * is editorial damage caused by a space.
 *
 * Inline elements render with no gap between them and their neighbours, so
 * removing them outright is what a reader sees: `<b>Bold</b>text` reads
 * "Boldtext", and `NO<sub>x</sub>` reads "NOx". Everything not on this list —
 * p, div, li, br, td, h1 — still becomes a space, because those do separate.
 */
const INLINE_TAGS = "a|abbr|b|bdi|bdo|cite|code|data|del|dfn|em|font|i|ins|kbd|mark|q|rp|rt|ruby|s|samp|small|span|strong|sub|sup|time|tt|u|var|wbr";

export const flatten = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(new RegExp(`</?(?:${INLINE_TAGS})(?:\\s[^>]*)?/?>`, "gi"), "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED_ENTITIES[n.toLowerCase()] ?? m)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

const normQuote = (s) =>
  String(s)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

/**
 * A 5xx is usually the origin having a bad second, not a verdict. TechCrunch
 * returned 503 to the validator and 200 to the same user-agent moments later,
 * and the run paid for a whole rejected gate cycle to find that out. Two
 * retries, backing off; a 4xx is still an answer and is not retried.
 */
async function fetchPage(url, attempt = 0) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) {
      if (res.status >= 500 && attempt < 2) {
        clearTimeout(t);
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        return fetchPage(url, attempt + 1);
      }
      return { ok: false, error: `HTTP ${res.status}${attempt ? ` after ${attempt + 1} tries` : ""}` };
    }
    return { ok: true, text: flatten(await res.text()) };
  } catch (e) {
    if (attempt < 2 && e.name !== "AbortError") {
      clearTimeout(t);
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      return fetchPage(url, attempt + 1);
    }
    return { ok: false, error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(t);
  }
}

/**
 * @param {object} post
 * @param {{online?: boolean, allowUnverifiable?: boolean}} opts
 */
/**
 * What a headline has to be before it is allowed to be the first thing anyone
 * sees.
 *
 * The two carousels this account published were accurate, sourced and ignored.
 * "The data centers unplugged. The lights flickered." is a fine line of prose
 * and a bad hook: it describes rather than states, and it gives a thumb no
 * reason to stop. The accounts that do reach people write "This Chinese
 * developer just open sourced a model that predicts the future". The difference
 * is not exaggeration — that particular claim is a stretch we may not make. The
 * difference is that theirs names a subject, an action and a stake in nine
 * words, and ours named a mood.
 *
 * So these rules check for the *shape* of a hook, never for volume. Nothing
 * here permits overstating what a source said; the evidence gate below still
 * decides that, and it is not negotiable. A headline can be sharp and true, and
 * if it cannot be, the story is the wrong story.
 */
/*
 * Fifteen, not thirteen, and the two extra words are for a name.
 *
 * "Kimi K3, a Chinese AI, found 19 security holes in Redis in 90 minutes" is
 * fourteen words. Under the old ceiling it did not fit, so the run wrote "A
 * Chinese AI found 19 unknown ways into a database" instead — and a rule I wrote
 * to keep hooks readable had quietly taught it to delete the proper nouns. Two
 * words of brevity is a bad trade for the name of the thing.
 */
const HOOK_MAX_WORDS = 15;

/**
 * Nationality is not a name.
 *
 * The anchor rule asked for "a number or a capitalised word", and "Chinese"
 * satisfied both halves of the account's worst hook. A nationality tells a
 * reader nothing they can look up, and "a Chinese AI" reads as a category where
 * "Kimi K3, from the Chinese lab Moonshot" reads as a fact.
 */
const NATIONALITIES = new Set(
  ("chinese american french british english japanese korean indian european russian german israeli " +
   "canadian australian dutch swedish spanish italian brazilian mexican african asian western")
    .split(" ")
);

/** Capitalised words that name nothing: too generic to be an anchor. */
const NOT_A_NAME = new Set(["the", "a", "an", "this", "that", "it", "its", "and", "but", "for", "one", "two", "three", "new", "now", "how", "why", "when", "they", "their", "his", "her", "he", "she", "we", "you", "i", "no", "so", "if", "in", "on", "at", "of", "to", "by"]);

/**
 * The proper nouns in a sentence that name actors — companies, products, people,
 * places. Multi-word names are returned token by token, which is enough: if a
 * slide says "Hugging Face" the token "Hugging" is present.
 */
export function namedActors(text) {
  const words = String(text || "").replace(/[^\w\s.'-]/g, " ").split(/\s+/);
  const out = [];
  for (let i = 0; i < words.length; i++) {
    // The possessive is not part of the name. "OpenAI's" must match a cover that
    // says "OpenAI", which it did not until this line existed.
    const clean = (w) => w.replace(/['’]s$/i, "").replace(/[.'’-]+$/, "");
    const isName = (w) => {
      const c = clean(w);
      return (
        /^[A-Z][A-Za-z0-9.'’-]{2,}$/.test(c) &&
        c.length >= 3 &&
        !NOT_A_NAME.has(c.toLowerCase()) &&
        !NATIONALITIES.has(c.toLowerCase())
      );
    };
    if (!isName(words[i])) continue;
    // Consecutive capitalised words are one name: "Hugging Face", not two
    // complaints about "Hugging" and "Face".
    const parts = [clean(words[i])];
    while (i + 1 < words.length && isName(words[i + 1])) parts.push(clean(words[++i]));
    out.push(parts.join(" "));
  }
  return [...new Set(out)];
}

/**
 * The known-facts lint. On 2026-07-29 a published Reel described Hugging Face
 * as "le site où les développeurs du monde entier stockent leur code" —
 * GitHub's description, on the platform whose whole identity is models and
 * datasets. The evidence gate cannot see this: an apposition has no digits
 * and quotes nothing. Nothing mechanical can check every apposition either;
 * what it can do is refuse the handful of mischaracterisations an AI-news
 * account is most likely to make about the entities it covers most. High
 * precision only: every pattern here is an error a French tech reader would
 * screenshot and laugh at, never a stylistic call.
 */
const KNOWN_FACTS = [
  {
    re: /\bhugging ?face\b[^.!?\n]{0,90}\b(stocke\w*|store\w*|storing|h[ée]berge\w*|rangent?)\b[^.!?\n]{0,40}\bcode\b/i,
    fix: "Hugging Face is not a general code host (that is GitHub); it is the platform where AI models and datasets are shared. Write: \"Hugging Face, la plateforme où le monde entier partage ses modèles d'IA\".",
  },
  { re: /\bclaude\b[^.!?\n]{0,40}\b(d['’]openai|de google|de meta|de mistral)\b/i, fix: "Claude is Anthropic's model." },
  { re: /\b(openai|google|meta)['’]s\s+claude\b/i, fix: "Claude is Anthropic's model." },
  { re: /\bchatgpt\b[^.!?\n]{0,40}\b(d['’]anthropic|de google|de meta)\b/i, fix: "ChatGPT is OpenAI's product." },
  { re: /\b(anthropic|google|meta)['’]s\s+chatgpt\b/i, fix: "ChatGPT is OpenAI's product." },
  { re: /\bgemini\b[^.!?\n]{0,40}\b(d['’]openai|d['’]anthropic|de meta)\b/i, fix: "Gemini is Google's model." },
  { re: /\b(openai|anthropic|meta)['’]s\s+gemini\b/i, fix: "Gemini is Google's model." },
];

export function factIssues(text) {
  const t = String(text || "");
  const issues = [];
  for (const { re, fix } of KNOWN_FACTS) {
    const m = t.match(re);
    if (m) issues.push(`states a known falsehood ("${m[0].slice(0, 70)}") — ${fix}`);
  }
  return issues;
}

/** Openers that promise a thumb nothing. Every one of these is a description.
 * The account writes in French since 2026-07-29; the French half of each list
 * is the same disease in the other language. */
const DEAD_OPENERS = [
  /^(the )?(rise|fall|future|state|age|era|dawn|world) of\b/i,
  /^(how|why) [a-z]/i,
  /^a (look|deep dive|guide|primer)\b/i,
  /^everything you need to know\b/i,
  /^(here'?s|this is) (how|why|what)\b/i,
  /^(what|why) (this|that|it) means\b/i,
  /^(inside|meet|introducing)\b/i,
  /^(comment|pourquoi) [a-zà-ü]/i,
  /^(l['’]essor|la mont[ée]e|le futur|l['’]avenir|l['’][èe]re|le monde) d/i,
  /^tout (savoir|comprendre) sur\b/i,
  /^ce qu['’]il faut (savoir|retenir)\b/i,
  /^(zoom|focus|retour) sur\b/i,
  /^(d[ée]couvrez|plong[ée]e? (dans|au)|voici (comment|pourquoi))\b/i,
];

/** Words that sound like something and mean nothing. */
const FILLER = /\b(game[- ]?changer|revolutionary|revolutionize|landscape|journey|unlock|harness|delve|paradigm|disrupt(ing|ive)?|cutting[- ]edge|seamless|robust|leverage|r[ée]volutionnaire|r[ée]volutionne[rnt]?|r[ée]volution|paysage|[ée]cosyst[èe]me|incontournable|paradigme|disruptif|disruptive|bouleverse[rnt]?|d[ée]cryptage)\b/i;

export function hookIssues(headline) {
  const raw = String(headline || "").replace(/\*+/g, "").trim();
  if (!raw) return ["missing"];
  const issues = [];
  const words = raw.split(/\s+/).filter(Boolean);

  if (words.length > HOOK_MAX_WORDS)
    issues.push(`${words.length} words. A hook is read in under a second, so ${HOOK_MAX_WORDS} is the ceiling. Cut it to the subject, the action and the stake.`);

  for (const re of DEAD_OPENERS)
    if (re.test(raw))
      issues.push(`opens with a description ("${raw.split(/\s+/).slice(0, 3).join(" ")}…"). State the surprise instead of announcing that there is one.`);

  const filler = raw.match(FILLER);
  if (filler) issues.push(`contains "${filler[0]}", which is a word that sounds like something and means nothing. Say what actually happened.`);

  if (/\?\s*$/.test(raw))
    issues.push("is a question. A question hook makes the reader do the work; answer it on the slide instead.");

  /*
   * The anchor rule. A hook needs something concrete in it — a number, or a
   * name. "Libraries now teach you to switch AI off" has one (AI, libraries as
   * subject). "The future of work is changing" has none, and no amount of
   * typography saves it. Checked as: at least one digit, or at least one
   * capitalised word that is not merely the first word of the sentence.
   */
  const hasDigit = /\d/.test(raw);
  // A capital after a full stop is not a name. The headline that started this
  // rewrite, "The data centers unplugged. The lights flickered.", passed the
  // first version of this check on the strength of its second "The".
  /*
   * Words that open a sentence without naming anything. The list matters more
   * than it looks: the check used to skip the first word outright, which threw
   * away the anchor in every hook that opens with its subject — "Libraries now
   * teach you to switch AI off", "Nvidia would co-sign $250 billion". Position 0
   * is where the best hooks put the name, so it is read like any other word and
   * filtered by meaning instead.
   */
  const SENTENCE_WORDS = new Set([
    "the", "a", "an", "this", "that", "it", "and", "but", "in", "on", "for", "now", "when", "why", "how",
    "they", "its", "their", "no", "one", "two", "three", "everything", "something", "nothing", "anything",
    "everyone", "someone", "anyone", "nobody", "people", "most", "many", "some", "all", "after", "before",
    "once", "since", "what", "who", "there", "here", "we", "you", "he", "she", "his", "her", "if", "so",
    "your", "our", "these", "those", "every", "both", "each", "another", "other", "more", "less", "first", "last",
    // French sentence-openers: capitalised by position, naming nothing.
    "le", "la", "les", "un", "une", "des", "ce", "cette", "ces", "cet", "il", "elle", "ils", "elles",
    "et", "mais", "dans", "sur", "pour", "quand", "pourquoi", "comment", "leur", "leurs", "son", "sa", "ses",
    "ne", "pas", "plus", "moins", "tout", "tous", "toute", "toutes", "rien", "personne", "quelque",
    "après", "avant", "depuis", "alors", "donc", "voici", "voilà", "chaque", "autre", "autres",
    "notre", "votre", "nos", "vos", "nous", "vous", "je", "tu", "on", "si", "déjà", "encore",
    "hier", "demain", "aujourd'hui", "être", "avoir", "faire", "sont", "était", "vient", "vont",
  ]);
  const hasName = words
    .map((w) => w.replace(/[^\w.'-]/g, ""))
    .some(
      (w) =>
        /^[A-Z][A-Za-z.'-]+$/.test(w) &&
        !SENTENCE_WORDS.has(w.toLowerCase()) &&
        !NATIONALITIES.has(w.toLowerCase()) &&
        !NOT_A_NAME.has(w.toLowerCase())
    );
  if (!hasDigit && !hasName)
    issues.push("has no number and no name in it. A hook needs one concrete anchor a stranger can grab: who did it, or how much.");

  return issues;
}

/**
 * Pictures are not optional any more, and generated ones are not documentary.
 *
 * The first rule is why this exists: two carousels of type on black reached
 * nobody. The second is the one that could end the account. A generated picture
 * that appears to show a real person or a reported event, on an account whose
 * whole promise is that what it shows is real, is indefensible however good it
 * looks — so a prompt may not name anyone the post itself quotes or credits.
 */
/** The palette table, read once, so validate does not need the render pipeline. */
let _palettes = null;
function brandPalettes() {
  if (!_palettes) {
    try {
      _palettes = JSON.parse(readFileSync(path.join(ROOT, "brand", "brand.json"), "utf8")).palettes || {};
    } catch {
      _palettes = {};
    }
  }
  return _palettes;
}

/**
 * The light belongs to the mood, and this is advice rather than a refusal.
 *
 * Three consecutive posts declared `tension` and every prompt still asked for
 * cold blue, so four covers side by side on the profile read as one post
 * repeated. The accent is six per cent of the frame; the photograph is the rest
 * of it, and the photograph is what makes two covers look identical. But a
 * prompt that ignores its palette produces a dull grid, not a false one, so it
 * says its piece and gets out of the way.
 */
export function imageStyleIssues(slide, post = {}) {
  const img = slide?.image;
  const light = post?.moodLight;
  if (!img || img.kind !== "illustration" || !light) return [];
  const key = light.split(" ")[1] || light.split(" ")[0];
  if (new RegExp(key, "i").test(String(img.prompt || ""))) return [];
  return [`the prompt does not ask for the light this post's mood carries ("${light}"). Two covers look alike because of the photograph, not because of the accent.`];
}

export function imageIssues(slide, post = {}) {
  const img = slide.image;
  // Optional since 2026-07-31. This block described the picture the carousel
  // renderer would composite onto a slide, and carousels were retired three
  // days earlier: nothing acquires it, nothing renders it, nobody sees it. It
  // was still mandatory, so every post cost its writer nine invented picture
  // descriptions and a forgotten one blocked the build. When a block IS
  // present the checks below still apply, because the same shapes describe the
  // Reel's `photo` beats.
  if (!img) return [];
  const issues = [];

  if (img.kind !== "photo" && img.kind !== "illustration")
    issues.push(`kind is "${img.kind}", expected "photo" or "illustration"`);
  if (img.kind === "photo" && !String(img.query || "").trim())
    issues.push("a photo needs a plain keyword `query`. Openverse and Commons are keyword indexes, not search engines: \"electrical substation\" finds one, \"the moment the substation tripped at night\" finds nothing");
  if (img.kind === "illustration") {
    const prompt = String(img.prompt || "").trim();
    if (prompt.length < 25) issues.push("an illustration needs a `prompt` of at least 25 characters describing the scene");
    if (!/\bno text\b/i.test(prompt))
      issues.push('the prompt must end with "no text". Generated lettering comes out as garbled pseudo-English and it lands on the one account that cannot afford to look fake');

    // Names the post itself quotes or credits, which a generated picture may
    // not depict. Attributions carry them ("Hannah Cyrus, reference librarian"),
    // so they are collected rather than guessed at.
    const names = new Set();
    for (const s of post.slides || []) {
      const who = String(s.attribution || "").split(",")[0].trim();
      if (who.split(/\s+/).length >= 2) for (const part of who.split(/\s+/)) if (/^[A-Z][a-z]{2,}$/.test(part)) names.add(part);
    }
    for (const name of names)
      if (new RegExp(`\\b${name}\\b`).test(prompt))
        issues.push(`the prompt names "${name}", who is a real person this post quotes. A generated picture may set a mood; it may never appear to show someone real`);
  }
  if (!String(img.alt || "").trim())
    issues.push("needs `alt` text: one plain sentence describing what is in the picture");
  if (img.mode && !["full", "top", "field"].includes(img.mode))
    issues.push(`mode is "${img.mode}", expected full, top or field`);

  return issues;
}

export async function validatePost(post, opts = {}) {
  const online = opts.online !== false;
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  /*
   * Taste is not a fact.
   *
   * A rule about a redundant figure on a cover went into the same list as "this
   * sentence does not exist on the page it cites", and an hour later it refused a
   * finished, verified, reviewed carousel that Hasan had asked to go out. That
   * was my mistake, not the rule's. An error stops a publish, and only two kinds
   * of thing have earned that: something that would make the account WRONG, and
   * Hasan's own standing instructions. Composition rules I invented — a hero that
   * repeats a figure, a hook that opens weakly, a close that asks for nothing —
   * say their piece and get out of the way.
   */
  const nag = (m) => warnings.push(m);

  // ---- structure ----------------------------------------------------------
  if (!post.slug || !/^[a-z0-9][a-z0-9-]{2,60}$/.test(post.slug)) err(`slug invalid or missing: ${post.slug}`);

  /*
   * The repository contains a complete, gate-clean post that must never be
   * published: `test/fixtures/smoke-post.json`, which exercises the whole
   * pipeline without touching the account. It is a story that has already been
   * published and deleted, and nothing but a filename stopped a run in a hurry
   * from copying it into `posts/` and shipping a repeat. Hasan asked the right
   * question about test material sitting in a production repository; this is
   * the answer to it.
   */
  if (!opts.fixture && /^(fixture|smoke|cloud-smoke|test)-/.test(post.slug || ""))
    err(`slug "${post.slug}" belongs to a test fixture. Fixtures exercise the pipeline; they are never published. Research and write your own story.`);
  const slides = Array.isArray(post.slides) ? post.slides : [];
  if (slides.length < SLIDES_MIN || slides.length > SLIDES_MAX)
    err(`slide count ${slides.length} outside ${SLIDES_MIN}..${SLIDES_MAX}`);
  if (slides[0]?.type !== "hook") err("first slide must be type 'hook'");
  if (slides.at(-1)?.type !== "cta") err("last slide must be type 'cta'");

  const hook = slides[0];
  if (hook?.headline && hook.headline.replace(/\*/g, "").length > HOOK_MAX_CHARS)
    err(`hook headline is ${hook.headline.length} chars, max ${HOOK_MAX_CHARS} — it would render too small to read`);
  for (const issue of hookIssues(hook?.headline)) nag(`hook headline: ${issue}`);

  /*
   * NAME THE THING. This is fatal, and it is the rule this account most needed.
   *
   * Two published posts anonymised their own subjects. A verified claim read
   * "the Chinese AI model Kimi K3 … the Redis database" and the cover read "A
   * Chinese AI found 19 unknown ways into a database" — "Kimi K3" appeared on no
   * slide at all. Another claim named "the production servers of Hugging Face"
   * and the cover said "it hacked a real company", with the victim first named
   * on slide six of seven.
   *
   * The cause was my own rubric. `recognition` says NVIDIA is recognisable and a
   * simulation framework is not, and the run read that as an instruction to
   * remove names a layperson would not know. It is the opposite: a name is what
   * makes a story real, and the fix for an unfamiliar name is a two-word
   * apposition, not deletion — "Kimi K3, a Chinese AI model", "Hugging Face,
   * where the world's AI models are kept". That is how every newsroom does it,
   * and it is why the routine's own email reports read better than the posts
   * they describe: the reports name things.
   *
   * So: every actor the central claim names must appear on the cover or on slide
   * two, the two slides anyone actually sees.
   */
  /*
   * The hero restates the headline in figures; it does not print the same figure
   * twice. A live Reel opened with "8,192 virtual surgical robots trained at
   * once" above a hero reading "8,192" — half the loudest space on a cover spent
   * saying one thing. Advice, not a refusal: it is redundant, not false.
   */
  const heroValue = String(hook?.hero?.value || "").replace(/\*+/g, "").trim();
  const headlineText = String(hook?.headline || "").replace(/\*+/g, "");
  if (heroValue && headlineText.includes(heroValue))
    nag(`the hero value "${heroValue}" already appears in the headline. The hero carries the comparison the headline does not: quote a different figure, or drop it.`);

  /*
   * The placeholders that stood where a name belonged.
   *
   * Requiring "every actor in the claim must appear on the cover" was the first
   * attempt and it was wrong: it reads "Librarians" at the start of a sentence
   * as a proper noun and refuses honest copy. The defect is narrower and more
   * precise than that. It is a phrase like "a Chinese AI", "a real company", "a
   * database" standing in for something the claim names — evasion, not brevity.
   */
  const PLACEHOLDERS = [
    /\b(?:a|an|another|one|the)\s+(?:real|major|big|large|small|tech|technology|unnamed|certain|leading|prominent|other)?\s*(?:company|companies|firm|startup|start-up|business|lab|laboratory|organisation|organization|vendor)\b/i,
    /\b(?:a|an|the)\s+(?:chinese|american|french|british|japanese|korean|indian|european|russian|german|israeli)\s+(?:ai|model|company|firm|startup|lab|team|developer|researcher|giant)\b/i,
    /\b(?:a|an)\s+(?:database|chatbot|search engine|social network|hospital|newspaper|university|bank)\b/i,
    /\bthe\s+(?:company|firm|lab|startup)\s+(?:that|which|whose)\b/i,
  ];

  const claimNames = namedActors(post.centralClaim);
  const coverSlides = slides.slice(0, 2);
  const coverText = coverSlides
    .flatMap((s2) => [s2?.headline, s2?.kicker, s2?.title, s2?.figure, s2?.unit, s2?.body, s2?.claim, s2?.caveat, s2?.hero?.value, s2?.hero?.label])
    .filter(Boolean)
    .join(" ");
  const allSlideText = slides
    .flatMap((s2) => [s2?.headline, s2?.kicker, s2?.title, s2?.figure, s2?.unit, s2?.body, s2?.claim, s2?.caveat, s2?.hero?.value, s2?.hero?.label, s2?.attribution])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const onCover = (n) => coverText.toLowerCase().includes(n.toLowerCase().split(" ")[0]);
  const namesOffCover = claimNames.filter((n) => !onCover(n));

  /*
   * NAME THE THING. Fatal, and the rule this account most needed.
   *
   * Two published posts anonymised their own subjects. A verified claim read
   * "the Chinese AI model Kimi K3 … the Redis database" and the cover read "A
   * Chinese AI found 19 unknown ways into a database" — "Kimi K3" appeared on no
   * slide at all. Another claim named "the production servers of Hugging Face"
   * and the cover said "it hacked a real company", the victim first named on
   * slide six of seven.
   *
   * The cause was my own rubric: `recognition` says NVIDIA is recognisable and a
   * simulation framework is not, and the run read that as licence to delete names
   * a layperson would not know. It is the opposite. A name is what makes a story
   * real, and an unfamiliar name is fixed by two words of apposition, never by
   * deletion — "Kimi K3, a Chinese AI model", "Hugging Face, where the world's AI
   * models are kept". It is also why the routine's own email reports read better
   * than the posts they describe: the reports name things.
   */
  for (const re of PLACEHOLDERS) {
    const hit = coverText.match(re);
    if (!hit) continue;
    if (namesOffCover.length)
      err(
        `the cover says "${hit[0].trim()}" while your own central claim names ${namesOffCover.join(" and ")}. ` +
          `Name it. An unfamiliar name is fixed with a two-word apposition ("Kimi K3, a Chinese AI model"), never by deleting it — "a Chinese AI" and "a real company" are what this account looked like when it went wrong.`
      );
    else
      nag(`the cover says "${hit[0].trim()}", which names nothing. If the source names it, so should the cover.`);
    break;
  }

  for (const n of claimNames)
    if (!allSlideText.includes(n.toLowerCase().split(" ")[0]))
      nag(`"${n}" is in your central claim and on no slide at all. If it is the subject, the reader should be able to look it up.`);

  /*
   * The send test, and it is the most important field in the file.
   *
   * The rubric asks how sendable a story is and the run scores itself, which
   * means it can rate a medical-physics simulation SDK at 0.75 and nothing
   * contradicts it. So the score now has to produce an artefact: the actual
   * message a person would send with this post. Reading it back is the test, and
   * a machine can do half of it — a message that needs the word "framework" or
   * "inference" to make sense is a message nobody sends.
   *
   * Fatal, not advisory. Hasan's judgement on the published output was
   * unambiguous: the pipeline works and the stories are not stories. This check
   * runs before a single picture is fetched, so complying costs nothing but
   * choosing better.
   */
  /*
   * Is this news today.
   *
   * The account published a story on 26 July whose event was 22 July, and it
   * read exactly as it was: nothing happened, so something old that held up got
   * dressed as news. `timeliness` was a 0.10 weight the run graded itself on,
   * which is not a control. The dates are already in the spec, so measure them.
   *
   * The newest cited source is the test. A story every outlet covered four days
   * ago is not what people are talking about now, whatever its merits.
   */
  const dates = slides
    .map((s2) => s2.source?.date)
    .filter((d) => /^\d{4}-\d{2}-\d{2}/.test(String(d || "")))
    .map((d) => new Date(d).getTime());
  if (dates.length) {
    const ageDays = (Date.now() - Math.max(...dates)) / 86400000;
    if (ageDays > STALE_DAYS)
      err(
        `the freshest source on this post is ${ageDays.toFixed(1)} days old. That is not news, it is an archive piece with a date on it. ` +
          `Find today's story, or find a source published in the last ${STALE_DAYS} days that carries this one forward.`
      );
    else if (ageDays > 2)
      nag(`the freshest source is ${ageDays.toFixed(1)} days old. It will read as "nothing happened today" unless the hook makes clear what is new about it now.`);
  }

  /*
   * The stat archetype takes a short numeral and nothing else. `140,000` was
   * rendered as "140,0" with the rest clipped off the frame, on a published
   * slide, and only opening the JPEG caught it: at `statMin` 190px on one line,
   * seven glyphs cannot fit. The archetype exists for `$5`, `3x`, `2.6M`.
   */
  for (const [i, s2] of slides.entries()) {
    const fig = String(s2.figure || "").replace(/\*+/g, "").trim();
    if (s2.type === "stat" && fig.length > FIGURE_MAX_CHARS)
      err(
        `slide ${i + 1}: the figure "${fig}" is ${fig.length} characters and the stat archetype fits ${FIGURE_MAX_CHARS}. ` +
          `It renders clipped, not small. Use the shortest true form of the number, or pick a different figure and put this one in the body.`
      );
  }

  /*
   * Two domains can be one source.
   *
   * A run published a story corroborated by Reuters and Benzinga — two
   * newsrooms, two domains, both VERIFIED — and said plainly in its own report
   * that underneath them was a single Wall Street Journal scoop it could not
   * fetch. It was right, it hedged every slide with "in talks", and the gate had
   * nothing to say. A green gate proves quotation, and this is the second shape
   * of the corroboration hole: not an unrelated page, but the same page twice.
   *
   * Detectable, because a rewrite says so. "the Wall Street Journal reported",
   * "according to Reuters" — when every corroborating quote credits the same
   * third party, they are not independent. A warning, not a refusal: the story
   * may still be worth publishing, hedged, and that call needs judgement the
   * gate does not have. But the run should never have had to notice this alone.
   */
  const wireCheck = Array.isArray(post.corroboration) ? post.corroboration : [];
  if (wireCheck.length >= 2) {
    /*
     * Who a quote credits. Two shapes cover almost every rewrite: "according to
     * a Wall Street Journal report" and "the Wall Street Journal reported". The
     * determiner matters — the first version required "the" and missed "a", so
     * it saw nothing in the exact pair of quotes that prompted it.
     */
    const CREDITS = /\b(?:according to|citing|per)\s+(?:a|an|the)?\s*([A-Z][\w'.]+(?:\s+[A-Z][\w'.]+){0,3})|\b(?:the\s+)?([A-Z][\w'.]+(?:\s+[A-Z][\w'.]+){0,3})\s+(?:reported|report(?:s|ed)?\b|first reported)/;
    const attributed = wireCheck.map((c) => {
      const m = CREDITS.exec(String(c.quote || ""));
      return (m && (m[1] || m[2]) || "").trim().toLowerCase();
    });
    const named = attributed.filter(Boolean);
    if (named.length >= 2 && new Set(named).size === 1)
      nag(
        `every corroborating quote credits the same third party ("${named[0]}"), so these are ${wireCheck.length} rewrites of one report, not ${wireCheck.length} independent sources. ` +
          `Publish it hedged if it is worth publishing, say "reported" rather than asserting it, and say so in your run report — but do not treat a green gate as corroboration here.`
      );
  }

  const sendTest = String(post.sendTest || "").trim();
  if (!sendTest)
    err('`sendTest` is missing. Write the one-line message someone would actually send a friend along with this post, in their words. If you cannot write it without wincing, the story is the wrong story.');
  else {
    if (sendTest.length > 160) err(`\`sendTest\` is ${sendTest.length} characters. Nobody types that in a DM. Under 160.`);
    const INSIDER = /\b(framework|sdk|api|library|libraries|open[- ]sourc\w*|benchmark|inference|pipeline|parameters?|weights|repo|repository|toolkit|runtime|latency|throughput|inf[ée]rence|latence|param[èe]tres?|biblioth[èe]que logicielle|d[ée]p[ôo]t de code)\b/i;
    const hit = sendTest.match(INSIDER);
    if (hit)
      err(`\`sendTest\` contains "${hit[0]}". That is an industry word, and a message that needs one is a message nobody sends. Either the story has a consequence you can say in plain words, or it is not a story.`);
  }

  // ---- every slide carries a picture --------------------------------------
  const moodLight = brandPalettes()[post.mood]?.light;
  for (const [i, s2] of slides.entries()) {
    for (const issue of imageIssues(s2, post)) err(`slide ${i + 1} (${s2.type}) image: ${issue}`);
    for (const issue of imageStyleIssues(s2, { ...post, moodLight })) nag(`slide ${i + 1} image: ${issue}`);
  }

  /*
   * Never promise a frequency. The account published "One story a day" and
   * "A new one tomorrow" on every carousel it made, and then went to four posts
   * a day, which turned both lines into something a viewer can check and find
   * false. A cadence that changes with the numbers cannot be printed on the
   * artwork.
   */
  /* `\b` is ASCII-only in JavaScript, so `\bà` never matches after a space:
   * the boundary needs a word character on one side and neither a space nor an
   * accented letter is one. "À demain" slipped through this check for that
   * reason alone. Any pattern anchored on an accented letter needs an explicit
   * class, not a word boundary. */
  const FREQUENCY_CLAIM =
    /\b(one|two|three|1|2|3)\s+(?:\w+\s+){0,2}(story|stories|post|posts|reel|reels|video|videos)\s+(?:\w+\s+){0,2}(a|per|each)\s+(day|week)\b|\b(a new one|another one)\s+(tomorrow|every day|daily)\b|\bdaily\s+(?:\w+\s+){0,2}(story|post|reel|video)\b|\b(une|deux|trois|1|2|3)\s+(?:\w+\s+){0,2}(actu|actus|info|infos|vid[ée]o|vid[ée]os|story|stories)s?\s+(?:\w+\s+){0,2}(?:par|chaque)\s+(jour|semaine|matin|soir)\b|\bchaque\s+(jour|matin|soir)\b|\btous les (jours|matins|soirs)\b|\bquotidien(ne)?s?\b|(?:^|[\s.,;:!?\"'])[àa] demain\b|\brendez-vous demain\b/i;
  for (const [i, s2] of slides.entries()) {
    for (const v of [s2.headline, s2.sub, s2.title, s2.body]) {
      if (v && FREQUENCY_CLAIM.test(v))
        err(`slide ${i + 1} (${s2.type}) promises a publishing frequency ("${String(v).slice(0, 60)}"). The cadence changes with what the numbers say; do not print it on the artwork.`);
    }
  }
  if (post.caption && FREQUENCY_CLAIM.test(post.caption))
    err("the caption promises a publishing frequency. The cadence changes with what the numbers say; do not print it.");
  /*
   * And to the spoken script, which the manual has always covered ("not in the
   * caption, not on a slide, not spoken") and the check never reached. The
   * end-card carries the promise because it is a fixed surface that gets
   * updated if the cadence ever changes; a sentence the voice says is a claim a
   * viewer can check against the grid and find false.
   */
  for (const [i, b] of (post.reel2?.beats || []).entries()) {
    if (FREQUENCY_CLAIM.test(String(b?.script || "")))
      err(`reel2 beat ${i + 1} speaks a publishing frequency. The end-card carries the promise, and it is the only surface that does, because it is the one that gets updated if the cadence changes.`);
  }

  /*
   * The closing slide has one job and it is not signing off.
   *
   * Watch time is the heaviest ranking signal and DM sends are the next, worth
   * three to five times a like for reaching non-followers. The old sign-off
   * asked for nothing at all. So the last slide must ask for something a
   * stranger can do, and the template already draws the icons and the follow
   * badge underneath whatever it says.
   */
  const cta = slides.at(-1);
  if (cta?.type === "cta") {
    const asked = `${cta.headline || ""} ${cta.sub || ""}`;
    if (!/\b(send|share|save|show|forward|tag|follow|envoie[sz]?|partage[sz]?|montre[sz]?|transf[èe]re[sz]?|pr[ée]viens|pr[ée]venez|enregistre[sz]?|abonne)\b/i.test(asked))
      nag('the closing slide asks for nothing. Name one action a stranger can take, and prefer sending it to someone over a like: "Send this to anyone who…".');
  }

  // ---- house style: no dashes standing in for punctuation ------------------
  // An em dash is a writer's shortcut for a thought they have not decided how
  // to punctuate. Two shorter sentences almost always read better, and on a
  // slide the glyph is a long grey bar that breaks the line rhythm. Banned
  // outright so it cannot creep back in one post at a time.
  const DASHES = /[—–]|(?<![-\w])--(?!-)/;
  const textFields = (s) => [s.headline, s.kicker, s.title, s.body, s.figure, s.unit, s.claim, s.caveat, s.claimLabel, s.caveatLabel, s.sub, s.attribution, s.hero?.value, s.hero?.label];
  for (const [i, s] of slides.entries()) {
    for (const v of textFields(s)) {
      if (v && DASHES.test(v))
        err(`slide ${i + 1} (${s.type}): contains an em dash, en dash or "--" in "${String(v).slice(0, 70)}…" — rewrite as two sentences or use a comma`);
    }
  }
  if (post.caption && DASHES.test(post.caption))
    err(`caption contains an em dash, en dash or "--" — rewrite as two sentences or use a comma`);

  // ---- known-facts lint ----------------------------------------------------
  // Every surface a viewer can read or hear, one pass. See KNOWN_FACTS above.
  const PUBLIC_TEXT = [
    ...slides.flatMap((s, i) => textFields(s).map((v) => [`slide ${i + 1}`, v])),
    ["caption", post.caption],
    ["sendTest", post.sendTest],
    ["reel2 title", post.reel2?.title],
    ...(Array.isArray(post.reel2?.beats) ? post.reel2.beats.map((b, i) => [`reel2 beat ${i + 1}`, b?.script]) : []),
  ];
  for (const [where, v] of PUBLIC_TEXT) {
    if (!v) continue;
    for (const issue of factIssues(v)) err(`${where}: ${issue}`);
  }

  // ---- caption ------------------------------------------------------------
  if (!post.caption) err("caption missing");
  if (post.caption && post.caption.length > CAPTION_MAX)
    err(`caption is ${post.caption.length} chars, Instagram's limit is ${CAPTION_MAX}`);
  if (post.caption && !/\bai[- ]assisted\b|\bmade with ai\b|\bwritten with ai\b|\bassist[ée]e? par (l['’])?ia\b|\bg[ée]n[ée]r[ée]e?s? (avec|par) (l['’])?ia\b/i.test(post.caption))
    err("caption carries no AI disclosure (EU AI Act art. 50, applicable 2026-08-02, and Meta policy for realistic synthetic audio). The house line: 'Voix et images générées par IA · Script écrit et vérifié par un humain.'");

  // Do not advertise rigour. Showing a source on every slide is the proof;
  // a paragraph claiming that everything was checked reads as a defence, and
  // protesting too much is what an account without sources does.
  const SELF_PRAISE = /(every|each)\s+(claim|figure|fact|number)[^.]{0,80}(verified|checked|sourced|quoted)|machine[- ]checked|fact[- ]checked against|before (anything is|it is) (posted|published)|no hype[.,]? no reposts/i;
  if (post.caption && SELF_PRAISE.test(post.caption))
    err("caption claims its own rigour. The sources printed on every slide already prove it; delete the sentence rather than assert it");

  /* The caption is public French too, and it is the surface a reader can quote
     back. The house disclosure line at its foot carries accents of its own, so
     the density is measured on the caption as written. */
  if (post.caption && (post.reel2?.lang ?? "fr") === "fr")
    for (const issue of frenchAccentIssues(post.caption)) err(`caption: ${issue}`);

  // ---- the caption is not a free-text field ------------------------------
  // It was, and that was the largest hole left in the gate. The manual tells
  // the writer to put "what did not fit on a slide" in the caption, which is
  // exactly where the most detailed figures end up, and nothing checked them.
  // The first clean run duly published "an extra 3.49 gigawatts" and "another
  // 11 minutes" in its caption. Both plausible, both probably true, neither
  // traceable to any quote the system had verified.
  //
  // Caption-only claims therefore need caption-only evidence, held in
  // `captionEvidence: [{ quote, url }]`, and checked exactly like slide
  // evidence. Prose is free; digits are not.
  const capEv = Array.isArray(post.captionEvidence) ? post.captionEvidence : [];
  for (const [i, e] of capEv.entries()) {
    if (!e?.quote || e.quote.trim().length < EVIDENCE_MIN_CHARS)
      err(`captionEvidence[${i}]: quote missing or shorter than ${EVIDENCE_MIN_CHARS} chars`);
    if (!e?.url || !/^https:\/\//.test(e.url)) err(`captionEvidence[${i}]: missing https url`);
  }

  // ---- per-slide evidence -------------------------------------------------
  const contentSlides = slides.filter((s) => s.type !== "hook" && s.type !== "cta");
  if (contentSlides.length < 2) err(`only ${contentSlides.length} evidence-bearing slide(s). The slides are not rendered any more, they are the backbone that forces the story into claims that each carry their own quote — and one claim is not a story you can corroborate.`);

  const domains = new Set();

  for (const [i, s] of contentSlides.entries()) {
    const at = `content slide ${i + 1}`;
    if (!s.source?.url || !/^https:\/\//.test(s.source.url)) { err(`${at}: missing https source.url`); continue; }
    if (!s.source?.name) err(`${at}: missing source.name`);
    if (!s.source?.date || !/^\d{4}-\d{2}-\d{2}$/.test(s.source.date)) err(`${at}: source.date must be YYYY-MM-DD`);
    try { domains.add(new URL(s.source.url).hostname.replace(/^www\./, "")); } catch { err(`${at}: unparseable source.url`); }

    if (!s.evidence || s.evidence.trim().length < EVIDENCE_MIN_CHARS)
      { err(`${at}: evidence missing or shorter than ${EVIDENCE_MIN_CHARS} chars — every claim needs a verbatim quote`); continue; }

    // 1. numbers in the body must be present in the evidence (or be the date)
    const haystack = new Set([...numbers(s.evidence), ...numbers(s.source.date || "")]);
    const unsupported = [...new Set(numbers(s.body))].filter((n) => !haystack.has(n));
    if (unsupported.length)
      err(`${at}: figure(s) ${unsupported.join(", ")} appear in the body but not in the evidence quote — a number must be copied, never derived`);
  }

  // Numbers outside a content body are the blind spot that matters most: the
  // hook, the hero figure and the contrast cells are the LOUDEST text on the
  // whole carousel, and none of them carries its own evidence. So every digit
  // anywhere in the post must be supported by the evidence of SOME slide.
  // Without this, a derived figure like "$0 extra" — true-sounding, never
  // actually stated by the source — walks straight onto slide 1.
  /* Corroboration quotes belong here, and their absence was a real hole found
   * on 2026-07-31: the sources named the model "Mythos 5" in the corroborating
   * sentence and nowhere else, so naming it in the script — the correct thing
   * to do — was refused as an unquoted figure. A corroboration quote is fetched
   * from its page and must match verbatim, exactly like slide evidence; it is
   * evidence, and every check that reads evidence must read it. */
  const allEvidence = new Set([
    ...slides.flatMap((s) => [...numbers(s.evidence ?? ""), ...numbers(s.source?.date ?? "")]),
    ...capEv.flatMap((e) => numbers(e.quote ?? "")),
    ...(post.corroboration || []).flatMap((c) => numbers(c?.quote ?? "")),
  ]);

  /* The same corpus as prose, for the checks that are about words rather than
   * digits. Corroboration quotes belong here even though they carry no slide:
   * they are the sentences where the sources state the central claim, which is
   * exactly where the story's actors are named. */
  const evidenceText = [
    ...slides.map((s) => s.evidence ?? ""),
    ...capEv.map((e) => e.quote ?? ""),
    ...(post.corroboration || []).map((c) => c?.quote ?? ""),
  ].join(" \n ");

  // Digits in the caption get the same treatment as digits on a slide.
  const capUnsupported = [...new Set(numbers(post.caption ?? ""))].filter((n) => !allEvidence.has(n));
  if (capUnsupported.length)
    err(
      `caption: figure(s) ${capUnsupported.join(", ")} appear in the caption but in no evidence quote. ` +
        `Add the supporting sentence to captionEvidence: [{ quote, url }], or drop the figure`
    );
  /*
   * The caption's first line is a Google search result. Public professional
   * accounts have been indexed since July 2025 and the snippet is that line, so
   * a windup or a repeat of the hook wastes the only sentence a searcher reads.
   * The manual has said 125 characters since the French pivot and nothing
   * checked it, which is how a rule becomes decoration.
   */
  const firstLine = String(post.caption ?? "").split("\n")[0].trim();
  /*
   * And a floor, which is not a style rule at all.
   *
   * `findRecentByCaption` in publish.mjs is what decides, when `media_publish`
   * errors, whether the post went live anyway. It matches the first 60
   * characters of the caption's first line against recent media — and it gives
   * up and returns null when that line is under 12 characters. A short first
   * line therefore silently disables the guard against the account's worst
   * failure: a publish error that was actually a success, retried into a double
   * post. Forty characters keeps the match distinctive, and it is also what the
   * line needs to be a useful search snippet.
   */
  if (firstLine.length && firstLine.length < 40)
    err(`caption: the first line is only ${firstLine.length} characters. It has two jobs and fails both short: it is the Google snippet, and it is what the publisher matches on to tell "the post went live despite the error" from "nothing was published". Under 12 characters that check silently gives up. Write the second-best fact and the entity names, 40 to 125 characters.`);
  if (firstLine.length > 125)
    err(`caption: the first line is ${firstLine.length} characters. Only the first line shows before "more", and it is the Google snippet: 125 is the ceiling. Put the second-best fact and the entity names there, not a windup.`);

  const LOUD_FIELDS = ["headline", "kicker", "title", "figure", "unit", "claim", "caveat", "sub", "attribution"];
  for (const [i, s] of slides.entries()) {
    const fields = [...LOUD_FIELDS.map((f) => s[f]), s.hero?.value, s.hero?.label];
    const found = [...new Set(fields.flatMap((v) => numbers(v ?? "")))];
    const unsupported = found.filter((n) => !allEvidence.has(n));
    if (unsupported.length)
      err(
        `slide ${i + 1} (${s.type}): figure(s) ${unsupported.join(", ")} appear in headline/hero/label text but in no evidence quote anywhere in the post — a headline number must be quoted, not derived`
      );
  }

  // ---- the Reel's spoken script is held to the slide standard --------------
  //
  // reel2 scripts are new prose, not slide text read aloud, which means they
  // are a fresh path for an unquoted figure to reach the public — spoken AND
  // printed as karaoke, the loudest surface the account has. Same rule as
  // everywhere else: prose is free, digits are not. Shape errors are caught
  // here too, because reel2.mjs only runs after money starts being spent.
  if (post.reel2 !== undefined) {
    const beats = Array.isArray(post.reel2?.beats) ? post.reel2.beats : [];
    if (beats.length < BEATS_MIN || beats.length > BEATS_MAX)
      err(`reel2: ${beats.length} beats — the ${TARGET_S}-second spine is ${BEATS_MIN} to ${BEATS_MAX}. Fewer than ${BEATS_MIN} means a picture holds for ten seconds; more than ${BEATS_MAX} means beats too short to say anything.`);

    /*
     * The hook card. The karaoke reveals the spoken line word by word, which
     * meant frame zero — the whole audition, and the grid thumbnail — used to
     * carry three words of a sixteen-word sentence. `title` is the full hook,
     * burned fully formed from the first frame. It is held to the same shape
     * rules as a slide headline, and its digits to the same evidence rule as
     * every other digit on the account.
     */
    const title = String(post.reel2?.title || "").trim();
    if (!title) err("reel2: `title` is missing — 5 to 8 words shown as a static card from frame zero; it is the audition and the grid thumbnail");
    else {
      // 52, not 64: the card is display type inside 952 usable pixels and it is
      // allowed two lines. A 61-character title still needs three lines at the
      // smallest size the engine will use, and three lines of Anton over a
      // photograph is a poster nobody reads in 1.7 seconds.
      if (title.length > 52) err(`reel2: title is ${title.length} chars — it is burned as display type on the audition frame and 52 is what fits on two lines. Cut it to the subject, the action and the stake.`);
      if (DASHES.test(title)) err("reel2: title contains an em dash, en dash or \"--\" — rewrite as two sentences");
      const unsupportedT = [...new Set(numbers(title))].filter((n) => !allEvidence.has(n));
      if (unsupportedT.length) err(`reel2: title figure(s) ${unsupportedT.join(", ")} appear in no evidence quote — a number must be copied, never derived`);
      /*
       * An error, not a warning, since 2026-07-31. The manual has called these
       * "four hard rules, enforced by the gate" since the pivot and said "the
       * gate refuses it, and it will reject the next one like it" — and on the
       * card that IS the audition frame and the grid thumbnail they were only
       * ever nags. A question, a "Comment X…" opener or a hook with no name and
       * no number in it is the single most expensive thing this account can
       * publish, because nothing after it gets watched.
       *
       * Checked against six real hooks from this account's own history before
       * promoting it: all six pass, all four known bad shapes are caught.
       */
      for (const issue of hookIssues(title)) err(`reel2 title: ${issue}`);
    }
    if (post.reel2?.lang && !["fr", "en"].includes(post.reel2.lang))
      err(`reel2: unknown lang "${post.reel2.lang}" — "fr" (the account's language) or "en"`);

    /* Accents, on everything the public hears or reads. The narration is checked
       whole rather than beat by beat, because a single beat is too short for the
       density to mean anything. */
    if ((post.reel2?.lang ?? "fr") === "fr") {
      const narration = beats.map((b) => b?.script || "").join(" ");
      for (const issue of frenchAccentIssues(narration)) err(`reel2 narration: ${issue}`);
      for (const issue of frenchAccentIssues(post.reel2?.title || "", { min: Infinity })) err(`reel2 title: ${issue}`);
    }
    const VISUALS = new Set(["veo", "screenshot", "image", "photo", "card", "file"]);
    /**
     * Everything the sources actually say, minus the proper names.
     *
     * The names have to come out, and a build on 2026-07-31 is why. The gate
     * asks a picture to share vocabulary with the story; the engine separately
     * refuses a generated picture whose prompt names anything the post reports
     * on, because a generated image must never look like documentation of a
     * real thing. A spec that satisfied the first rule with "a Python package
     * page" was then refused by the second, and a run could have bounced
     * between them until it ran out of time.
     *
     * Common nouns are the answer to both: "package", "registry", "scanner",
     * "credentials" anchor a picture in the story without pretending to depict
     * a named product.
     */
    const properNouns = new Set(
      namedActors([post.centralClaim || "", evidenceText].join(" ")).flatMap((n) => tokens(n))
    );
    const storyVocab = new Set(
      [...new Set(tokens([post.centralClaim || "", evidenceText].join(" ")))].filter((w) => !properNouns.has(w))
    );
    /*
     * How long each beat holds the screen, predicted before anything is bought.
     * The engine derives the same split from Whisper's alignment of the
     * narration it actually paid for, so the two never agree to the frame — but
     * they agree closely enough to refuse the shapes that cannot work, and
     * refusing them here costs nothing.
     */
    const perBeat = beatSeconds(beats.map((b) => (b?.script?.trim() || "").split(/\s+/).filter(Boolean).length));

    let words = 0;
    for (const [i, b] of beats.entries()) {
      const at = `reel2 beat ${i + 1}`;
      if (!b?.script?.trim()) { err(`${at}: no script — the copy is the runtime`); continue; }
      const beatWords = b.script.trim().split(/\s+/).length;
      words += beatWords;
      if (beatWords < BEAT_MIN_WORDS)
        err(`${at}: ${beatWords} word(s) — under ${BEAT_MIN_WORDS} the picture flashes and the caption cannot be read, and the seconds it gives up land on another beat as a still held far too long. Merge it into its neighbour.`);
      /*
       * A veo beat cannot outlast its clip. Veo's maximum is 8 seconds, the
       * engine's purchase ladder stops there, and the renderer covers a small
       * shortfall by slowing the clip — past that it freezes the last frame.
       * Refuse the script rather than ship the freeze: this is the one beat of
       * the Reel that moves, and paying for it to stop is waste.
       */
      if (b.visual?.type === "veo" && !b.visual?.file && perBeat[i] > VEO_MAX_S * VEO_STRETCH_MAX * 0.94)
        err(`${at}: a veo beat that speaks for ${perBeat[i].toFixed(1)}s cannot be shown — Veo's longest clip is ${VEO_MAX_S}s and the engine may slow it by ${Math.round((VEO_STRETCH_MAX - 1) * 100)}%, so past ~${(VEO_MAX_S * VEO_STRETCH_MAX * 0.94).toFixed(1)}s it ends on a frozen frame. Shorten this beat, or move the sentence to its neighbour.`);
      if (DASHES.test(b.script)) err(`${at}: contains an em dash, en dash or "--" — rewrite as two sentences`);
      const unsupported = [...new Set(numbers(b.script))].filter((n) => !allEvidence.has(n));
      if (unsupported.length)
        err(`${at}: figure(s) ${unsupported.join(", ")} are spoken but appear in no evidence quote — a number must be copied, never derived`);
      const type = b.visual?.type ?? "image";
      if (!VISUALS.has(type)) err(`${at}: unknown visual type "${type}"`);
      if (type === "screenshot" && !b.visual?.url && !b.visual?.file) err(`${at}: a screenshot beat needs a url or a file`);
      if ((type === "veo" || type === "image") && !b.visual?.spec && !b.visual?.prompt && !b.visual?.file)
        err(`${at}: a ${type} beat needs a spec, a prompt or a file`);
      if (type === "photo" && !b.visual?.query && !b.visual?.file)
        err(`${at}: a photo beat needs a \`query\` (two or three plain nouns for the photo indexes) or a pinned file`);
      if (type === "card") {
        if (!b.visual?.value?.trim()) err(`${at}: a card beat needs a \`value\` — the figure or the short phrase it prints large`);
        if (!b.visual?.label?.trim()) err(`${at}: a card beat needs a \`label\` — one line under the value saying what it counts`);
        else if (b.visual.label.length > 62) err(`${at}: the card's label is ${b.visual.label.length} chars — it is set large under the figure and 62 is what fits on two lines`);
        if (b.visual?.value && b.visual.value.length > 12) err(`${at}: the card's value is ${b.visual.value.length} chars — it renders at 150px, so it is a figure or two words, never a sentence`);
        const cardNums = [...new Set(numbers(`${b.visual?.value || ""} ${b.visual?.label || ""}`))].filter((n) => !allEvidence.has(n));
        if (cardNums.length) err(`${at}: card figure(s) ${cardNums.join(", ")} appear in no evidence quote — a card is printed at 150px, so its digits are the loudest on the account`);
        if (DASHES.test(`${b.visual?.value || ""}${b.visual?.label || ""}`)) err(`${at}: the card contains an em dash, en dash or "--"`);
      }
      if ((type === "veo" || type === "image") && !b.visual?.file) {
        const specText = [b.visual?.prompt, ...(b.visual?.spec ? Object.values(b.visual.spec) : [])].filter(Boolean).join(" ");
        for (const issue of simplicityIssues(specText)) err(`${at}: ${issue}`);
        /*
         * The furniture rule. On 2026-07-31 six of a Reel's eight beats showed
         * nothing that was in the news: a laptop alone on a table, stacks of
         * paper, an office door ajar, a smartphone beside a glass of water.
         * Hasan: *"pourquoi on regarde un smartphone et un verre d'eau posé sur
         * une table ? Il faut vraiment mieux choisir ce qu'on montre."*
         *
         * Every one of those had passed, because nothing checked whether the
         * picture had anything to do with the story. This does: the spec's own
         * words must overlap the vocabulary of the sources. Both are in English
         * — the specs because Veo and Imagen read English, the evidence because
         * the sources are international — so the comparison is fair.
         *
         * It is a floor, not taste. It cannot tell a good picture from a dull
         * one; it can tell a picture OF the story from a picture of a desk.
         */
        const specNouns = new Set(tokens([b.visual?.spec?.subject, b.visual?.spec?.action, b.visual?.spec?.setting, b.visual?.prompt].filter(Boolean).join(" ")));
        // Five letters or more: "left" matched "a misconfiguration left the
        // machines with live internet access" and let an office door through,
        // which is precisely the kind of accident that makes a rule useless.
        const shared = [...specNouns].filter((w) => w.length >= 5 && storyVocab.has(w));
        if (specNouns.size && !shared.length)
          err(
            `${at}: this ${type} shows nothing the story contains. "${b.visual?.spec?.subject || b.visual?.prompt || ""}" shares no word with the sources, ` +
              `which is how a Reel about a malicious package ends up showing a glass of water. Pick a subject the evidence actually names — available here: ` +
              `${[...storyVocab].filter((w) => w.length > 4).slice(0, 18).join(", ")}. Common nouns only — a generated picture may never name a product or a company, so the overlap has to come from what the story is ABOUT. If nothing fits, the beat wants a receipt, a real photograph or a \`card\`, not a still.`
          );
      }
    }

    /*
     * The wallpaper cap. The 29 July Reel shipped five generated mood stills
     * and not one real thing: dark corridor, studio mic, pen, tower, tail
     * lights — an ambiance loop about nothing, on a story with a famous face
     * and a famous product. Generated stills may only ever set a mood, so
     * three is the ceiling; the rest of the screen time belongs to surfaces
     * that show something real (photo, screenshot, veo).
     */
    const ambiance = beats.filter((b) => (b.visual?.type ?? "image") === "image").length;
    if (ambiance > STILLS_MAX)
      err(`reel2: ${ambiance} generated ambiance stills — the ceiling is ${STILLS_MAX}. Use \`photo\` (a real, credited photograph) or a second \`screenshot\` for the rest; a story with a named person in it should show that person's real face.`);
    /* Stated the other way round, because a cap alone can be satisfied by a Reel
     * that shows nothing real at all: at least REAL_MIN beats must be a surface
     * that exists — a credited photograph, a receipt, or a Veo shot of a
     * concrete action. The 29 July Reel had zero and read as an ambiance loop. */
    const receipts = beats.filter((b) => b.visual?.type === "screenshot").length;
    if (receipts > 3)
      err(`reel2: ${receipts} screenshot receipts — the ceiling is 3. A receipt beats a still every time, which is why the cap is generous, but four pages of somebody else's website in a row is a press review, not a Reel.`);
    const cards = beats.filter((b) => b.visual?.type === "card").length;
    if (cards > 2)
      err(`reel2: ${cards} typographic cards — the ceiling is 2. A card is a strong surface precisely because it is rare; three of them is a slideshow with a voice over it.`);
    const real = beats.filter((b) => ["photo", "screenshot", "veo"].includes(b.visual?.type ?? "image")).length;
    if (beats.length >= BEATS_MIN && real < REAL_MIN)
      err(`reel2: only ${real} beat(s) show something real — the floor is ${REAL_MIN} (\`photo\`, \`screenshot\` or \`veo\`). Generated stills set a mood; they are never the substance.`);

    /* The runtime, which is now a contract rather than a hope.
     *
     * "L'actu IA en 60 secondes" is the série's name and the bio's promise, and
     * for the first four Reels it was neither: 130-155 words read as 47 to 51
     * seconds and nothing checked the floor. The window below is arithmetic —
     * SPEECH_S of narration at the voice's own measured rate — and the engine
     * time-stretches whatever residue is left, so a script inside the window
     * always yields exactly a 60-second file and a script outside it is a Reel
     * that would have to be rescued audibly. */
    const win = wordWindow(measuredRate(post.reel2?.voice));
    if (words > win.max)
      err(`reel2: ${words} words of narration — over the ${win.max}-word ceiling for the ${TARGET_S}-second format (target ${win.target} at the voice's measured ${win.rate.toFixed(2)} words/second). Cut the longest beats first.`);
    if (beats.length && words < win.min)
      err(`reel2: ${words} words of narration — under the ${win.min}-word floor for the ${TARGET_S}-second format (target ${win.target} at ${win.rate.toFixed(2)} words/second). The série promises 60 seconds every day; a short script is a broken promise, not a tight edit. Add reporting, not padding: the detail that did not fit, the caveat, the second source's number.`);

    /* Who did what. See versionedActors: the account's near-miss of 2026-07-31
     * was an edit that let a viewer attach one model's incident to another
     * model's name, with every sentence true and the gate green twice. */
    const narration = beats.map((b) => String(b?.script || "")).join(" ");
    const claimActors = [...new Set((post.corroboration || []).flatMap((c) => versionedActors(c?.quote)))];
    const spokenActors = versionedActors(narration);
    for (const a of spokenActors) {
      if (!actorForms(a).some((f) => evidenceText.includes(f)))
        err(`reel2: the narration names "${a}", which appears in no evidence quote. A name is a fact like a figure: copy it from the source or do not say it.`);
    }
    if (claimActors.length) {
      const opening = beats.slice(0, 2).map((b) => String(b?.script || "")).join(" ");
      const named = claimActors.filter((a) => actorForms(a).some((f) => opening.includes(f)));
      if (!named.length)
        err(
          `reel2: the sources name the actor of the central claim as ${claimActors.map((a) => `"${a}"`).join(" / ")}, and the first two beats name none of them. ` +
            `Telling the story anonymously and naming a model later is how a viewer attaches the wrong incident to the wrong name. Name the actor in the attaque, with its apposition.`
        );
    }

    /*
     * The last spoken thing is the ask, and on 2026-07-31 Hasan changed what it
     * asks for: *"le 'envoie ça à celui qui répète que…' franchement c'est pas
     * fou, c'est pas sérieux. Au lieu de ça à la fin on peut vraiment demander
     * de s'abonner pour la news de demain et de lâcher un like."*
     *
     * The trade-off, stated once so nobody has to rediscover it: a DM share is
     * worth three to five times a like for reaching non-followers, so on pure
     * ranking the send was the stronger ask. But the send ask this account
     * actually wrote — "envoie ça à celui qui répète que l'IA reste enfermée" —
     * was a strawman addressed to nobody, and an ask that makes a viewer wince
     * converts worse than a weaker ask that sounds like a person. At zero
     * followers the subscription is also the thing the account most needs, and
     * the serial promise ("celle de demain") is what makes it answerable.
     */
    const lastScript = String(beats.at(-1)?.script || "");
    if (lastScript && !/(abonne|abonnez|abonnement|suis[- ]moi|follow)/i.test(lastScript))
      err("reel2: the last beat asks for nothing — ask for the subscription, and say what it buys (\"Abonne-toi pour l'actu IA de demain\"). A close that only summarises is a close a viewer scrolls past.");
    else if (lastScript && !/(demain|suivante|prochaine)/i.test(lastScript))
      nag("reel2: the last beat asks for a follow without saying what comes next — a viewer subscribes to the next edition, never to the one just watched. Name tomorrow.");

    if (post.reel2?.mood && !["steady", "tension", "drive", "wonder"].includes(post.reel2.mood))
      err(`reel2: unknown mood "${post.reel2.mood}"`);
  }

  // ---- corroboration of the central claim ---------------------------------
  //
  // This used to be one warning: "fewer than 2 distinct domains". It was the
  // weakest rule in the file and a live run found the hole. Counting domains
  // anywhere in the post means a single slide citing an unrelated page
  // satisfies it — and on 2026-07-25 a run came within one decision of citing
  // an MIT Technology Review piece about the AI backlash to corroborate a
  // story about librarians running workshops. Two domains, both quotes real,
  // gate green, nothing corroborated. The agent stopped on its own judgement,
  // which is not a control.
  //
  // The lesson, in its words: a green gate does not prove corroboration, only
  // quotation. So the post must now name the one claim it rests on and show
  // two independent pages that each carry THAT claim.
  //
  // Whether a page really supports a claim is not fully mechanisable. What is
  // mechanisable is whether it is even talking about the same thing: an
  // unrelated page does not repeat the claim's distinctive words. That is a
  // floor, not a proof, and it is deliberately set where it separates "about
  // another subject entirely" from "thin but genuinely on topic".
  const claim = post.centralClaim;
  const corr = Array.isArray(post.corroboration) ? post.corroboration : [];

  if (!claim || String(claim).trim().length < 30) {
    err("centralClaim is missing or too short — state in one sentence the single claim this whole post rests on, so corroboration has something to be checked against");
  } else if (corr.length < 2) {
    err(`corroboration has ${corr.length} entr${corr.length === 1 ? "y" : "ies"} — the central claim needs at least 2 independent sources, each with { url, quote }`);
  } else {
    const corrDomains = new Set();
    for (const [i, c] of corr.entries()) {
      const at = `corroboration[${i}]`;
      if (!c?.url || !/^https:\/\//.test(c.url)) { err(`${at}: missing https url`); continue; }
      if (!c?.quote || c.quote.trim().length < EVIDENCE_MIN_CHARS) {
        err(`${at}: quote missing or shorter than ${EVIDENCE_MIN_CHARS} chars`);
        continue;
      }
      try { corrDomains.add(new URL(c.url).hostname.replace(/^www\./, "")); } catch { err(`${at}: unparseable url`); }

      const { shared, ratio } = claimOverlap(claim, c.quote);
      if (shared.length < 2 || ratio < CLAIM_OVERLAP_MIN) {
        err(
          `${at}: this quote does not appear to be about the central claim — it shares only ` +
            `${shared.length} distinctive word(s) with it (${shared.join(", ") || "none"}, ${(ratio * 100).toFixed(0)}%). ` +
            `A real quote on a real page still corroborates nothing if the page is about something else. ` +
            `Quote the sentence where this source states the claim itself, or drop the source.`
        );
      } else if (ratio < CLAIM_OVERLAP_THIN) {
        warnings.push(`${at}: thin overlap with the central claim (${(ratio * 100).toFixed(0)}%: ${shared.join(", ")}) — check by eye that it really supports it`);
      }
    }
    if (corrDomains.size < 2)
      err(`corroboration cites ${corrDomains.size} distinct domain(s) (${[...corrDomains].join(", ") || "none"}) — two outlets syndicating one wire story are not two sources`);
  }

  // ---- online: the quote must exist on the cited page ---------------------
  const evidenceChecks = [];
  if (online) {
    const cache = new Map();
    for (const [i, s] of contentSlides.entries()) {
      if (!s.source?.url || !s.evidence) continue;
      if (!cache.has(s.source.url)) cache.set(s.source.url, await fetchPage(s.source.url));
      const page = cache.get(s.source.url);
      const at = `content slide ${i + 1}`;

      if (!page.ok) {
        evidenceChecks.push({ slide: i + 1, url: s.source.url, status: "UNVERIFIABLE", detail: page.error });
        if (!opts.allowUnverifiable) err(`${at}: source unreachable (${page.error}) — cannot verify the quote, refusing to publish`);
        continue;
      }
      const found = page.text.includes(normQuote(s.evidence));
      evidenceChecks.push({ slide: i + 1, url: s.source.url, status: found ? "VERIFIED" : "NOT_FOUND" });
      if (!found)
        err(`${at}: the evidence quote does not appear on ${s.source.url} — either it was paraphrased or it was invented`);
    }

    // The corroborating quotes get the same treatment as everything else:
    // being on topic is worthless if the sentence was never written.
    for (const [i, c] of corr.entries()) {
      if (!c?.quote || !c?.url) continue;
      if (!cache.has(c.url)) cache.set(c.url, await fetchPage(c.url));
      const page = cache.get(c.url);
      if (!page.ok) {
        evidenceChecks.push({ corroboration: i + 1, url: c.url, status: "UNVERIFIABLE", detail: page.error });
        if (!opts.allowUnverifiable) err(`corroboration[${i}]: source unreachable (${page.error}) — cannot verify the quote, refusing to publish`);
        continue;
      }
      const found = page.text.includes(normQuote(c.quote));
      evidenceChecks.push({ corroboration: i + 1, url: c.url, status: found ? "VERIFIED" : "NOT_FOUND" });
      if (!found) err(`corroboration[${i}]: the quote does not appear on ${c.url} — either it was paraphrased or it was invented`);
    }

    for (const [i, e] of capEv.entries()) {
      if (!e?.quote || !e?.url) continue;
      if (!cache.has(e.url)) cache.set(e.url, await fetchPage(e.url));
      const page = cache.get(e.url);
      if (!page.ok) {
        evidenceChecks.push({ caption: i + 1, url: e.url, status: "UNVERIFIABLE", detail: page.error });
        if (!opts.allowUnverifiable) err(`captionEvidence[${i}]: source unreachable (${page.error})`);
        continue;
      }
      const found = page.text.includes(normQuote(e.quote));
      evidenceChecks.push({ caption: i + 1, url: e.url, status: found ? "VERIFIED" : "NOT_FOUND" });
      if (!found) err(`captionEvidence[${i}]: the quote does not appear on ${e.url}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings, evidenceChecks, slideCount: slides.length, domains: [...domains] };
}

if (process.argv[1] && process.argv[1].endsWith("validate.mjs")) {
  const file = process.argv[2];

  /*
   * `window` exists so nobody has to compute it.
   *
   * The manual says in bold, twice, not to carry the word count in your head and
   * not to derive it. On 2026-07-31 the 16:30 run read that sentence and then
   * wrote its own snippet to print the window anyway — filtered the voice ledger
   * on a field name that does not exist, got zero samples, silently fell back to
   * the default rate, and trimmed a script that had gated green from 199 words
   * to 189. The real floor was 194. The gate caught it on the next run; had it
   * not, tomorrow's publish run would have burned a narration on a script the
   * engine refuses.
   *
   * The instruction was right and the run still went around it, so the answer is
   * not a louder instruction. It is one command, shorter to type than the
   * snippet, that reads the same ledger the gate reads.
   */
  if (file === "window") {
    const voice = process.argv[3] || "Sadaltager";
    const samples = voiceSamples(voice);
    const w = wordWindow(measuredRate(voice));
    const enough = samples.filter((r) => r.voice === voice).length >= RATE_SAMPLES_MIN;
    console.log(JSON.stringify({
      voice, min: w.min, max: w.max, target: w.target, rate: Number(w.rate.toFixed(3)),
      readings: samples.length,
      source: enough ? `measured, ${voice}` : `too few readings of ${voice} — falling back`,
    }, null, 2));
    console.error(
      `\n${w.min} to ${w.max} words, aim for ${w.target}, at ${w.rate.toFixed(2)} words a second over ${samples.length} reading(s).` +
        `\nThis is the number the gate will hold you to. Do not compute it yourself: on 2026-07-31 a run did, ` +
        `\nfiltered the ledger on a field that does not exist, and trimmed a script from 199 words to 189 against a floor of 194.`
    );
    process.exit(0);
  }

  if (!file) { console.error("usage: node src/validate.mjs <post.json> [--offline] [--allow-unverifiable]\n       node src/validate.mjs window [voice]   # the word window, without computing it yourself"); process.exit(2); }
  const post = JSON.parse(await readFile(path.resolve(file), "utf8"));
  const r = await validatePost(post, {
    online: !process.argv.includes("--offline"),
    allowUnverifiable: process.argv.includes("--allow-unverifiable"),
    // Only the smoke test passes this, and it publishes nothing. A production
    // run that reaches for it is a run about to publish a fixture.
    fixture: process.argv.includes("--fixture"),
  });
  console.log(JSON.stringify(r, null, 2));
  if (!r.ok) { console.error(`\nREJECTED — ${r.errors.length} error(s)`); process.exit(1); }
  console.error("\nPASSED");
}
