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

const ROOT = path.resolve(import.meta.dirname, "..");
const UA = "order-of-magnitude/1.0 (+https://github.com/hasso5703/ig-autopilot)";

const CAPTION_MAX = 2200;      // Instagram's hard limit
const SLIDES_MIN = 4;
const SLIDES_MAX = 10;         // Meta's carousel ceiling
const HOOK_MAX_CHARS = 95;     // beyond this the auto-fit shrinks it to unreadable
const EVIDENCE_MIN_CHARS = 40;

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

  // ---- caption ------------------------------------------------------------
  if (!post.caption) err("caption missing");
  if (post.caption && post.caption.length > CAPTION_MAX)
    err(`caption is ${post.caption.length} chars, Instagram's limit is ${CAPTION_MAX}`);
  if (post.caption && !/ai[- ]assisted|generated with ai|ai\b.*(assist|help)/i.test(post.caption))
    err("caption carries no AI disclosure (required by EU AI Act art. 50 from 2026-08-02)");

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

  // 2. corroboration: a post should not rest on a single publisher
  if (domains.size < 2)
    warnings.push(`all claims cite a single domain (${[...domains][0] ?? "none"}) — prefer at least two independent sources`);

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
