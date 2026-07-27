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
import path from "node:path";
import { tokens } from "./state.mjs";

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

/** Digit runs, normalised: "1,050" -> "1050", "$30.5B" -> "30.5" */
const numbers = (s) =>
  (String(s).match(/\d[\d,]*(?:\.\d+)?/g) || []).map((n) => n.replace(/,/g, "").replace(/\.$/, ""));

const flatten = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
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
const HOOK_MAX_WORDS = 13;

/** Openers that promise a thumb nothing. Every one of these is a description. */
const DEAD_OPENERS = [
  /^(the )?(rise|fall|future|state|age|era|dawn|world) of\b/i,
  /^(how|why) [a-z]/i,
  /^a (look|deep dive|guide|primer)\b/i,
  /^everything you need to know\b/i,
  /^(here'?s|this is) (how|why|what)\b/i,
  /^(what|why) (this|that|it) means\b/i,
  /^(inside|meet|introducing)\b/i,
];

/** Words that sound like something and mean nothing. */
const FILLER = /\b(game[- ]?changer|revolutionary|revolutionize|landscape|journey|unlock|harness|delve|paradigm|disrupt(ing|ive)?|cutting[- ]edge|seamless|robust|leverage)\b/i;

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
  const SENTENCE_WORDS = new Set(["the", "a", "an", "this", "that", "it", "and", "but", "in", "on", "for", "now", "when", "why", "how", "they", "its", "their", "no", "one", "two", "three"]);
  const hasName = words
    .slice(1)
    .map((w) => w.replace(/[^\w.'-]/g, ""))
    .some((w) => /^[A-Z][A-Za-z.'-]+$/.test(w) && !SENTENCE_WORDS.has(w.toLowerCase()));
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
export function imageIssues(slide, post = {}) {
  const img = slide.image;
  if (!img) return ["missing. Every slide carries a picture: `image: { kind: 'photo', query: '…' }` or `{ kind: 'illustration', prompt: '…' }`"];
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
   * The hero restates the headline in figures; it does not print the same figure
   * twice. The manual has said so since the first post and nothing checked it,
   * so a live Reel opened with "8,192 virtual surgical robots trained at once"
   * above a hero reading "8,192". Compliant, sourced, and half the loudest
   * space on the cover spent saying one thing.
   */
  const heroValue = String(hook?.hero?.value || "").replace(/\*+/g, "").trim();
  const headlineText = String(hook?.headline || "").replace(/\*+/g, "");
  if (heroValue && headlineText.includes(heroValue))
    nag(`the hero value "${heroValue}" already appears in the headline. The hero carries the comparison the headline does not: quote a different figure, or drop it.`);

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
    const INSIDER = /\b(framework|sdk|api|library|libraries|open[- ]sourc\w*|benchmark|inference|pipeline|parameters?|weights|repo|repository|toolkit|runtime|latency|throughput)\b/i;
    const hit = sendTest.match(INSIDER);
    if (hit)
      err(`\`sendTest\` contains "${hit[0]}". That is an industry word, and a message that needs one is a message nobody sends. Either the story has a consequence you can say in plain words, or it is not a story.`);
  }

  // ---- every slide carries a picture --------------------------------------
  for (const [i, s] of slides.entries()) {
    for (const issue of imageIssues(s, post)) err(`slide ${i + 1} (${s.type}) image: ${issue}`);
  }

  /*
   * Never promise a frequency. The account published "One story a day" and
   * "A new one tomorrow" on every carousel it made, and then went to four posts
   * a day, which turned both lines into something a viewer can check and find
   * false. A cadence that changes with the numbers cannot be printed on the
   * artwork.
   */
  const FREQUENCY_CLAIM = /\b(one|two|three|1|2|3)\s+(story|stories|post|posts|reel|reels)\s+(a|per|each)\s+(day|week)\b|\b(a new one|another one)\s+(tomorrow|every day|daily)\b|\bdaily\s+(story|post|reel)\b/i;
  for (const [i, s2] of slides.entries()) {
    for (const v of [s2.headline, s2.sub, s2.title, s2.body]) {
      if (v && FREQUENCY_CLAIM.test(v))
        err(`slide ${i + 1} (${s2.type}) promises a publishing frequency ("${String(v).slice(0, 60)}"). The cadence changes with what the numbers say; do not print it on the artwork.`);
    }
  }
  if (post.caption && FREQUENCY_CLAIM.test(post.caption))
    err("the caption promises a publishing frequency. The cadence changes with what the numbers say; do not print it.");

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
    if (!/\b(send|share|save|show|forward|tag|follow)\b/i.test(asked))
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

  // ---- caption ------------------------------------------------------------
  if (!post.caption) err("caption missing");
  if (post.caption && post.caption.length > CAPTION_MAX)
    err(`caption is ${post.caption.length} chars, Instagram's limit is ${CAPTION_MAX}`);
  if (post.caption && !/\bai[- ]assisted\b|\bmade with ai\b|\bwritten with ai\b/i.test(post.caption))
    err("caption carries no AI disclosure (EU AI Act art. 50, applicable 2026-08-02). Two words at the end is enough: 'AI-assisted.'");

  // Do not advertise rigour. Showing a source on every slide is the proof;
  // a paragraph claiming that everything was checked reads as a defence, and
  // protesting too much is what an account without sources does.
  const SELF_PRAISE = /(every|each)\s+(claim|figure|fact|number)[^.]{0,80}(verified|checked|sourced|quoted)|machine[- ]checked|fact[- ]checked against|before (anything is|it is) (posted|published)|no hype[.,]? no reposts/i;
  if (post.caption && SELF_PRAISE.test(post.caption))
    err("caption claims its own rigour. The sources printed on every slide already prove it; delete the sentence rather than assert it");

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
  if (contentSlides.length < 2) err(`only ${contentSlides.length} content slides — a carousel needs at least 2`);

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
  const allEvidence = new Set([
    ...slides.flatMap((s) => [...numbers(s.evidence ?? ""), ...numbers(s.source?.date ?? "")]),
    ...capEv.flatMap((e) => numbers(e.quote ?? "")),
  ]);

  // Digits in the caption get the same treatment as digits on a slide.
  const capUnsupported = [...new Set(numbers(post.caption ?? ""))].filter((n) => !allEvidence.has(n));
  if (capUnsupported.length)
    err(
      `caption: figure(s) ${capUnsupported.join(", ")} appear in the caption but in no evidence quote. ` +
        `Add the supporting sentence to captionEvidence: [{ quote, url }], or drop the figure`
    );
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
    err("centralClaim is missing or too short — state in one sentence the single claim this carousel rests on, so corroboration has something to be checked against");
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
  if (!file) { console.error("usage: node src/validate.mjs <post.json> [--offline] [--allow-unverifiable]"); process.exit(2); }
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
