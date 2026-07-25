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

async function fetchPage(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, text: flatten(await res.text()) };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(t);
  }
}

/**
 * @param {object} post
 * @param {{online?: boolean, allowUnverifiable?: boolean}} opts
 */
export async function validatePost(post, opts = {}) {
  const online = opts.online !== false;
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);

  // ---- structure ----------------------------------------------------------
  if (!post.slug || !/^[a-z0-9][a-z0-9-]{2,60}$/.test(post.slug)) err(`slug invalid or missing: ${post.slug}`);
  const slides = Array.isArray(post.slides) ? post.slides : [];
  if (slides.length < SLIDES_MIN || slides.length > SLIDES_MAX)
    err(`slide count ${slides.length} outside ${SLIDES_MIN}..${SLIDES_MAX}`);
  if (slides[0]?.type !== "hook") err("first slide must be type 'hook'");
  if (slides.at(-1)?.type !== "cta") err("last slide must be type 'cta'");

  const hook = slides[0];
  if (hook?.headline && hook.headline.replace(/\*/g, "").length > HOOK_MAX_CHARS)
    err(`hook headline is ${hook.headline.length} chars, max ${HOOK_MAX_CHARS} — it would render too small to read`);

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
  });
  console.log(JSON.stringify(r, null, 2));
  if (!r.ok) { console.error(`\nREJECTED — ${r.errors.length} error(s)`); process.exit(1); }
  console.error("\nPASSED");
}
