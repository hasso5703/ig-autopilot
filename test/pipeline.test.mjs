/**
 * The regression net.
 *
 * Every case in here is a bug that actually shipped or came within one decision
 * of shipping. That is the entry criterion: this file is not a survey of the
 * codebase, it is a list of things that went wrong once and must not go wrong
 * again quietly. Each test names its incident.
 *
 *   node --test test/
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { validatePost, claimOverlap } from "../src/validate.mjs";
import { tokens, similarity, SIMILARITY_THRESHOLD, publishGap, MIN_GAP_HOURS } from "../src/state.mjs";
import { shorten, splitFigure, buildTimeline, totalDuration } from "../src/reel-template.mjs";
import { complianceIssues } from "../src/reel.mjs";

// ---------------------------------------------------------------------------
// A post that should always pass, so a rule that rejects everything is caught.
// ---------------------------------------------------------------------------
const CLAIM =
  "Librarians across the United States are running free public workshops that teach people how to switch AI features off.";

const goodPost = () => ({
  slug: "2026-07-25-test",
  centralClaim: CLAIM,
  corroboration: [
    { url: "https://techcrunch.com/a", quote: "Librarians are running free workshops that teach people how to switch AI features off on their own phones." },
    { url: "https://www.bangordailynews.com/b", quote: "Librarians in Maine teach free workshops showing people how to turn off the AI features on their devices." },
  ],
  caption: "A short caption with the figure 70 in it. AI-assisted.",
  captionEvidence: [{ url: "https://techcrunch.com/a", quote: "About 70 people turned up to the class, far more than the usual dozen." }],
  slides: [
    { type: "hook", headline: "Libraries now teach you to switch AI off", kicker: "25 July 2026", hero: { value: "70", label: "turned up" }, swipe: "Swipe" },
    { type: "stat", figure: "70", unit: "people came", body: "A dozen is the usual turnout for this class.", evidence: "About 70 people turned up to the class, far more than the usual dozen.", source: { url: "https://techcrunch.com/a", name: "TechCrunch", date: "2026-07-25" } },
    { type: "content", title: "What they teach", body: "How to switch the features off.", evidence: "The class explains how to switch the features off on a phone or laptop.", source: { url: "https://www.bangordailynews.com/b", name: "Bangor Daily News", date: "2026-07-02" } },
    { type: "cta", headline: "One story a day", sub: "A new one tomorrow." },
  ],
});

const errs = async (post) => (await validatePost(post, { online: false })).errors;
const hasErr = (list, re) => list.some((e) => re.test(e));

test("an honest post passes — a gate that rejects everything is not a gate", async () => {
  const r = await validatePost(goodPost(), { online: false });
  assert.equal(r.ok, true, "unexpected errors:\n" + r.errors.join("\n"));
});

// ---------------------------------------------------------------------------
// Incident 2026-07-25: a run nearly corroborated a story about librarians with
// an MIT Technology Review piece about the AI backlash. Two domains, both
// quotes real on their pages, gate green, nothing corroborated.
// ---------------------------------------------------------------------------
test("a quote from an unrelated page is rejected as corroboration", async () => {
  const p = goodPost();
  p.corroboration[1] = {
    url: "https://www.technologyreview.com/z",
    quote: "A growing backlash against artificial intelligence is reshaping how the public thinks about the technology.",
  };
  assert.ok(hasErr(await errs(p), /does not appear to be about the central claim/));
});

test("two quotes from the same domain are not two sources", async () => {
  const p = goodPost();
  p.corroboration[1] = { ...p.corroboration[1], url: "https://techcrunch.com/other" };
  assert.ok(hasErr(await errs(p), /distinct domain/));
});

test("a single source is refused", async () => {
  const p = goodPost();
  p.corroboration = [p.corroboration[0]];
  assert.ok(hasErr(await errs(p), /at least 2 independent sources/));
});

test("a post with no centralClaim is refused", async () => {
  const p = goodPost();
  delete p.centralClaim;
  assert.ok(hasErr(await errs(p), /centralClaim/));
});

/**
 * The near-miss above shares exactly one word with the claim, so it is caught by
 * the "fewer than 2 shared words" rule and would still be caught if the ratio
 * floor were deleted. Mutation testing showed precisely that: setting
 * CLAIM_OVERLAP_MIN to 0 left every test green. This case shares three common
 * words and only the ratio rejects it.
 */
test("a quote sharing several common words but little of the claim is still rejected", async () => {
  const p = goodPost();
  p.corroboration[1] = {
    url: "https://example.org/z",
    quote: "Free public transport is expanding across several American cities this year and next.",
  };
  assert.ok(hasErr(await errs(p), /does not appear to be about the central claim/),
    "the ratio floor is not doing any work: this quote shares 3 words but only 23% of the claim");
});

test("the overlap floor separates the real case from the near-miss by a wide margin", () => {
  const real = claimOverlap(CLAIM, "Librarians in Maine teach free workshops showing people how to turn off AI features.");
  const nearMiss = claimOverlap(CLAIM, "A growing backlash against artificial intelligence is reshaping public opinion.");
  assert.ok(real.ratio > 0.4, `genuine corroboration scored only ${real.ratio}`);
  assert.ok(nearMiss.ratio < 0.15, `the unrelated page scored ${nearMiss.ratio}`);
});

// ---------------------------------------------------------------------------
// Incident: a derived figure "$0 extra" reached slide 1. Nothing checked
// numbers outside a content body.
// ---------------------------------------------------------------------------
test("a headline figure that appears in no evidence quote is refused", async () => {
  const p = goodPost();
  p.slides[0].hero.value = "500";
  assert.ok(hasErr(await errs(p), /slide 1.*500|500.*headline/i));
});

test("a caption figure that appears in no evidence quote is refused", async () => {
  const p = goodPost();
  p.caption = "Now the caption claims 3.49 gigawatts. AI-assisted.";
  assert.ok(hasErr(await errs(p), /caption.*3\.49/));
});

// ---------------------------------------------------------------------------
// Hasan, explicitly: no em dashes anywhere in the content, and no telling the
// reader how rigorous we are.
// ---------------------------------------------------------------------------
test("em dashes in slide text are refused", async () => {
  const p = goodPost();
  p.slides[2].body = "How to switch the features off — quietly.";
  assert.ok((await errs(p)).length > 0);
});

test("self-congratulation in the caption is refused", async () => {
  const p = goodPost();
  p.caption = "Every figure independently verified against primary sources. AI-assisted.";
  assert.ok((await errs(p)).length > 0);
});

// ---------------------------------------------------------------------------
// Incident: "launches" and "launching" fingerprinted differently, so the same
// story from two outlets would have posted twice.
// ---------------------------------------------------------------------------
test("the same story from two outlets collides", () => {
  const a = tokens("OpenAI launches a new reasoning model for enterprises");
  const b = tokens("OpenAI is launching new reasoning models for the enterprise");
  assert.ok(similarity(a, b) >= SIMILARITY_THRESHOLD, `overlap only ${similarity(a, b)}`);
});

test("two unrelated stories sharing a company name do not collide", () => {
  const a = tokens("OpenAI launches a new reasoning model for enterprises");
  const b = tokens("OpenAI faces a lawsuit over training data in Germany");
  assert.ok(similarity(a, b) < SIMILARITY_THRESHOLD, `overlap ${similarity(a, b)} is too high`);
});

// ---------------------------------------------------------------------------
// Incident: a run found 3 fresh stories out of 29 because the run forty minutes
// earlier had marked 26 of them considered under a three-day window.
// ---------------------------------------------------------------------------
test("the considered window is short enough not to starve the pool", async () => {
  const { readFile } = await import("node:fs/promises");
  const day = 24 * 3600 * 1000;

  const src = await readFile(new URL("../src/state.mjs", import.meta.url), "utf8");
  const m = src.match(/const CONSIDERED_TTL_MS = ([^;]+);/);
  assert.ok(m, "the window must stay a named constant, findable and reviewable");

  const ttl = Function(`return ${m[1]}`)();
  assert.ok(ttl <= 2 * day, `${ttl / day} days blocks the pool for longer than stories stay interesting`);
  assert.ok(ttl >= day, "under a day lets a run re-evaluate what it already passed over");
});

test("an unseen story is always evaluable", async () => {
  const { filterFresh } = await import("../src/state.mjs");
  const r = await filterFresh([
    { title: "A completely novel story about seahorse robotics in Reykjavik", url: "https://example.com/seahorse" },
  ]);
  assert.equal(r.fresh.length, 1, "dedup rejected a story it has never seen");
});

// ---------------------------------------------------------------------------
// Incident: two runs fired forty minutes apart and only a sourcing failure
// stopped a second carousel going out.
// ---------------------------------------------------------------------------
test("the publish guard blocks inside the minimum gap and the override needs the exact phrase", async () => {
  const before = process.env.OOM_PUBLISH_ANYWAY;
  try {
    delete process.env.OOM_PUBLISH_ANYWAY;
    const g = await publishGap();
    if (g.hours !== null && g.hours < MIN_GAP_HOURS) {
      assert.equal(g.ok, false, "guard let a too-recent post through");
      process.env.OOM_PUBLISH_ANYWAY = "1";
      assert.equal((await publishGap()).ok, false, "a loose value disarmed the guard");
      process.env.OOM_PUBLISH_ANYWAY = "yes-i-want-a-second-post-today";
      const o = await publishGap();
      assert.equal(o.ok, true);
      assert.equal(o.overridden, true, "an override must announce itself");
    }
  } finally {
    if (before === undefined) delete process.env.OOM_PUBLISH_ANYWAY;
    else process.env.OOM_PUBLISH_ANYWAY = before;
  }
});

// ---------------------------------------------------------------------------
// Incident: the reel shipped "A grid has to keep supply and demand matched
// second", cut on a word count. It reads as a rendering bug, not as prose.
// ---------------------------------------------------------------------------
test("text is never cut mid-thought; it is dropped instead", () => {
  const long = "A grid has to keep supply and demand matched second by second, or the frequency drifts and equipment trips offline across the whole interconnection.";
  const out = shorten(long, 10);
  assert.ok(out === "" || /[.!?]$/.test(out) || out.split(/\s+/).length <= 17,
    `produced a fragment: "${out}"`);
  assert.notEqual(out, "A grid has to keep supply and demand matched second");
});

/**
 * The test above is satisfied by the clause fallback, which returns a clean
 * fragment and never reaches the final `return ""`. Mutation testing proved it:
 * restoring the word-count truncation left every test green because that line
 * was never executed. This sentence has no clause boundaries at all, so nothing
 * can be salvaged and dropping is the only correct answer.
 */
test("when nothing clean fits, the line is dropped rather than butchered", () => {
  const noClauses =
    "A grid has to keep supply and demand matched second by second or the frequency drifts and equipment trips offline across the whole interconnection immediately";
  assert.equal(shorten(noClauses, 10), "",
    "a sentence with no clause boundaries must be dropped, not cut on a word count");
});

test("a sentence that fits is kept whole", () => {
  const s = "A dozen is the usual turnout for this class.";
  assert.equal(shorten(s, 14), s);
});

test("figures split so the prefix and suffix stay put while the digits move", () => {
  assert.deepEqual(splitFigure("$5"), { prefix: "$", value: 5, decimals: 0, suffix: "" });
  assert.deepEqual(splitFigure("40%"), { prefix: "", value: 40, decimals: 0, suffix: "%" });
  assert.deepEqual(splitFigure("2.6M"), { prefix: "", value: 2.6, decimals: 1, suffix: "M" });
  assert.deepEqual(splitFigure("1,050"), { prefix: "", value: 1050, decimals: 0, suffix: "" });
});

// ---------------------------------------------------------------------------
// Incident: converting all seven slides produced 35 seconds with five beats
// pinned to the duration ceiling. A Reel is the trailer, not the carousel.
// ---------------------------------------------------------------------------
test("a long carousel becomes a trailer, not a slideshow", () => {
  const post = goodPost();
  post.slides = [
    post.slides[0],
    post.slides[1],
    { type: "content", title: "A", body: "One.", evidence: "x", source: { name: "S" } },
    { type: "contrast", claimLabel: "Normally", claim: "A few seconds", caveatLabel: "This time", caveat: "Ten minutes", evidence: "x", source: { name: "S" } },
    { type: "quote", body: "Something said.", attribution: "Someone", evidence: "x", source: { name: "S" } },
    { type: "content", title: "B", body: "Two.", evidence: "x", source: { name: "S" } },
    post.slides[3],
  ];
  const beats = buildTimeline(post);
  assert.ok(beats.length <= 5, `${beats.length} beats is a slideshow`);
  assert.equal(beats[0].type, "cover", "the opening must survive the cut");
  assert.equal(beats.at(-1).type, "end", "the sign-off must survive the cut");
  assert.ok(beats.some((b) => b.type === "stat"), "the figure carries the story");
});

test("every reel is inside Instagram's 5 to 90 second window for the Reels tab", () => {
  const short = { slides: [{ type: "hook", headline: "Hi", hero: {} }, { type: "cta", headline: "Bye" }] };
  assert.ok(totalDuration(buildTimeline(short)) >= 5, "under 5s is not eligible for the Reels tab");
  const beats = buildTimeline(goodPost());
  const t = totalDuration(beats);
  assert.ok(t >= 5 && t <= 90, `${t}s is outside the eligible window`);
});

// ---------------------------------------------------------------------------
// Incident 2026-07-25: a published slide read "What she wants back is ." The
// caveat panel is filled with the accent colour and *emphasis* paints text in
// that same colour, so the point of the slide was invisible on its own
// background. Every fact on it was verified and the gate was green: it checks
// quotations and cannot see contrast.
// ---------------------------------------------------------------------------
test("emphasis is never painted in the colour of the panel behind it", async () => {
  const { slideHtml } = await import("../src/template.mjs");
  const { readFile } = await import("node:fs/promises");
  const brand = JSON.parse(await readFile(new URL("../brand/brand.json", import.meta.url), "utf8"));
  const fonts = [{ family: "Anton", weight: 400, base64: "" }];

  const html = slideHtml(
    brand,
    fonts,
    {
      type: "contrast",
      claimLabel: "Claimed",
      claim: "A few seconds to recover",
      caveatLabel: "In fact",
      caveat: "What she wants back is *the choice*",
      evidence: "x",
      source: { url: "https://example.com", name: "S", date: "2026-07-25" },
    },
    4,
    7
  );

  const accent = brand.colors.accent.toLowerCase();

  // The panel really is accent-filled; if that ever changes this test should be
  // revisited rather than silently passing for the wrong reason.
  assert.match(html, new RegExp(`\\.contrast \\.caveat\\{background:${accent}`, "i"),
    "the caveat panel is no longer accent-filled; re-derive what this test is protecting");

  const rule = html.match(/\.contrast \.caveat \.a\{([^}]*)\}/i);
  assert.ok(rule, "nothing scopes emphasis inside the caveat panel, so it inherits the accent colour and vanishes");

  const colour = rule[1].match(/color:\s*([^;]+)/i)?.[1]?.trim().toLowerCase();
  assert.notEqual(colour, accent, "emphasis inside the caveat panel is painted in the panel's own colour");
});

// ---------------------------------------------------------------------------
// The encoder flags have been wrong before, so the file is checked, not the
// intent behind it.
// ---------------------------------------------------------------------------
test("compliance is judged on the produced file, and catches each violation", () => {
  const ok = { video: "h264", pixFmt: "yuv420p", width: 1080, height: 1920, audio: "aac", sampleRate: 48000, channels: 2, seconds: 25 };
  assert.deepEqual(complianceIssues(ok), []);
  assert.ok(complianceIssues({ ...ok, video: "hevc" }).length);
  assert.ok(complianceIssues({ ...ok, pixFmt: "yuv444p" }).length);
  assert.ok(complianceIssues({ ...ok, width: 1920, height: 1080 }).length);
  assert.ok(complianceIssues({ ...ok, audio: undefined }).length);
  assert.ok(complianceIssues({ ...ok, sampleRate: 96000 }).length);
  assert.ok(complianceIssues({ ...ok, seconds: 3 }).length, "under 5s must be flagged");
  assert.ok(complianceIssues({ ...ok, seconds: 120 }).length, "over 90s must be flagged");
});
