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

import { validatePost, claimOverlap, hookIssues, imageIssues } from "../src/validate.mjs";
import { tokens, similarity, SIMILARITY_THRESHOLD, publishGap, MIN_GAP_HOURS, CAROUSEL_EVERY_HOURS, recordPosted, themesOf } from "../src/state.mjs";
import { shorten, splitFigure, buildTimeline, totalDuration, applyNarrationTiming } from "../src/reel-template.mjs";
import { queryLadder, scoreCandidate, creditLine } from "../src/imagery.mjs";
import { complianceIssues } from "../src/reel.mjs";

// ---------------------------------------------------------------------------
// A post that should always pass, so a rule that rejects everything is caught.
// ---------------------------------------------------------------------------
const CLAIM =
  "Librarians across the United States are running free public workshops that teach people how to switch AI features off.";

// The gate ages sources against the wall clock (STALE_DAYS). A hardcoded date
// here put a time bomb in the suite: on 2026-07-29 every goodPost() test failed
// at once because "2026-07-25" had quietly become four days old. The newest
// source must stay fresh relative to the day the suite runs.
const FRESH_DATE = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
// The kicker's digits must exist among the evidence tokens, which include the
// source date split as ["2026","07","28"] — so the day stays zero-padded.
const FRESH_KICKER = `${FRESH_DATE.slice(8, 10)} July ${FRESH_DATE.slice(0, 4)}`;

const goodPost = () => ({
  slug: "2026-07-25-test",
  centralClaim: CLAIM,
  corroboration: [
    { url: "https://techcrunch.com/a", quote: "Librarians are running free workshops that teach people how to switch AI features off on their own phones." },
    { url: "https://www.bangordailynews.com/b", quote: "Librarians in Maine teach free workshops showing people how to turn off the AI features on their devices." },
  ],
  caption: "A short caption with the figure 70 in it. AI-assisted.",
  captionEvidence: [{ url: "https://techcrunch.com/a", quote: "About 70 people turned up to the class, far more than the usual dozen." }],
  mood: "tension",
  sendTest: "Librarians are running free classes on switching AI off, and 70 people turned up to one.",
  slides: [
    { type: "hook", headline: "Libraries now teach you to switch AI off", kicker: FRESH_KICKER, hero: { value: "70", label: "turned up" }, swipe: "Swipe",
      image: photo("public library interior") },
    { type: "stat", figure: "70", unit: "people came", body: "A dozen is the usual turnout for this class.", evidence: "About 70 people turned up to the class, far more than the usual dozen.", source: { url: "https://techcrunch.com/a", name: "TechCrunch", date: FRESH_DATE },
      image: photo("library reading room") },
    { type: "content", title: "What they teach", body: "How to switch the features off.", evidence: "The class explains how to switch the features off on a phone or laptop.", source: { url: "https://www.bangordailynews.com/b", name: "Bangor Daily News", date: "2026-07-02" },
      image: drawn("a dim room lit by one phone screen, cinematic, no text") },
    { type: "cta", headline: "Send this to *anyone* who still trusts a chatbot with symptoms", sub: "Follow for the next one.",
      image: drawn("abstract field of small cyan lights in the dark, no text") },
  ],
});

const photo = (query) => ({ kind: "photo", query, alt: `a photograph of ${query}` });
const drawn = (prompt) => ({ kind: "illustration", prompt, alt: "an illustration" });

const errs = async (post) => (await validatePost(post, { online: false })).errors;
const hasErr = (list, re) => list.some((e) => re.test(e));

test("the send test is the story's own sendability, made checkable", async () => {
  const p = goodPost();
  delete p.sendTest;
  assert.ok(hasErr(await errs(p), /`sendTest` is missing/));

  // The exact failure this exists for: a story whose imagined DM needs an
  // industry word. That post scored 0.81 on the old rubric and Hasan hated it.
  p.sendTest = "NVIDIA open sourced a surgical robot simulation framework, 8,192 environments in parallel.";
  assert.ok(hasErr(await errs(p), /industry word/));
});

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
// Incident 2026-07-25, found in the first published Reel: the stat beat counted
// up from zero, so a paused frame read "66 people at one class" over a
// TechCrunch credit. 66 appears in no source. The JSON said 70 and the
// validator verified 70; the multiplication happened in the browser at paint
// time, downstream of every check.
//
// The account's whole promise is that every figure is traceable to a sentence
// in a source. A number the renderer invented for one second breaks it exactly
// as thoroughly as one invented in the JSON.
// ---------------------------------------------------------------------------
test("the renderer never invents a figure the source does not contain", async () => {
  const { html } = await import("../src/reel-template.mjs");
  const { readFile } = await import("node:fs/promises");
  const brand = JSON.parse(await readFile(new URL("../brand/brand.json", import.meta.url), "utf8"));

  const post = {
    slides: [
      { type: "hook", headline: "A headline", kicker: "K", hero: { value: "70", label: "l" } },
      { type: "stat", figure: "70", unit: "people at one class", body: "A dozen is usual.", source: { name: "TechCrunch" } },
      { type: "cta", headline: "One story a day", sub: "A new one tomorrow." },
    ],
  };
  const page = html(post, brand, { anton: "", archivo: "", archivoBold: "" });

  // The figure must be in the document as written, not assembled at runtime.
  assert.match(page, />70</, "the sourced figure is not in the markup, so something builds it at paint time");

  // Strip comments before looking for arithmetic: the explanation of this very
  // bug lives next to the fix and must not be mistaken for the bug.
  const code = page
    .slice(page.indexOf("<script>"))
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  for (const forbidden of [/\bfmt\s*\(/, /__fig\b/, /\.value\s*\*/, /dataset\.count[\s\S]{0,200}?textContent\s*=/]) {
    assert.ok(!forbidden.test(code), `the render loop still builds a figure at paint time: ${forbidden}`);
  }
});

// ---------------------------------------------------------------------------
// A run's account of its own gathering is a claim. Nobody is watching this
// account day to day, so a run that skipped the feeds and wrote a plausible
// table would go unnoticed. feeds.mjs writes the evidence; the watch checks it.
// ---------------------------------------------------------------------------
test("a gather that has not happened for a day raises an alarm", async () => {
  const { format } = await import("../src/watch.mjs");
  const base = {
    health: { ever: true, ok: true, ageHours: 2, total: 3 },
    token: { known: true, daysLeft: 40, expiresOn: "2026-09-23", urgent: false, dead: false },
    posts: [],
  };
  const stale = format({ ...base, gather: { known: true, ok: false, ageHours: 51.2, fresh: 0, feeds: 14, dead: [] } });
  assert.match(stale, /COLLECTE\s+ALERTE/, "a stale gather must be shouted about, not shown as a number");

  const fine = format({ ...base, gather: { known: true, ok: true, ageHours: 1, fresh: 68, feeds: 14, dead: ["arXiv cs.AI"] } });
  assert.match(fine, /COLLECTE\s+68 sujets frais/);
  assert.match(fine, /arXiv/, "a silent feed should be named");
});

// ---------------------------------------------------------------------------
// Incident: a branch-path media URL would have baked a stale image into a post
// permanently. raw.githubusercontent caches /main/ paths for minutes and treats
// commit paths as immutable, and Meta copies whatever it fetches to its own CDN.
// ---------------------------------------------------------------------------
test("a reel URL is pinned to a commit, never to a branch", async () => {
  const { reelUrl } = await import("../src/publish-reel.mjs");
  const sha = "0123456789abcdef0123456789abcdef01234567";

  const url = reelUrl("2026-07-25-test", sha);
  assert.ok(url.includes(`/${sha}/`), "the SHA is not in the URL");
  assert.ok(!/\/(main|master)\//.test(url), "a branch path would serve a cached, stale file");
  assert.match(url, /^https:\/\/raw\.githubusercontent\.com\//);
  assert.ok(url.endsWith(".mp4"));

  // An empty or absent sha means "use HEAD" and is not an error.
  for (const bad of ["main", "master", "abc", "0123456789abcdef0123456789abcdef0123456", "0123456789ABCDEF0123456789abcdef01234567"])
    assert.throws(() => reelUrl("s", bad), /not a full commit sha/, `accepted "${bad}" as a commit`);
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

// ---------------------------------------------------------------------------
// 2026-07-26, and this one came from Hasan rather than from a crash: two
// carousels went out accurate, sourced, well typeset and ignored. The diagnosis
// was the first line of each. "The data centers unplugged. The lights
// flickered." is prose; it names nothing a stranger can grab.
// ---------------------------------------------------------------------------
test("a headline that names a mood instead of a thing is rejected", () => {
  assert.ok(hookIssues("The data centers unplugged. The lights flickered.").length);
  assert.ok(hookIssues("The future of work is changing").length);
  assert.equal(hookIssues("3.1 gigawatts walked off the grid in 30 seconds").length, 0);
  assert.equal(hookIssues("Libraries now teach you to switch AI off").length, 0);
});

test("a capital letter after a full stop does not count as a name", () => {
  // The first version of the anchor rule passed the headline above on the
  // strength of its second "The", which is the very headline it exists to
  // catch. Sentence words are not anchors.
  assert.ok(hookIssues("Everything stopped. They noticed. It flickered.").some((i) => /no number and no name/.test(i)));
});

test("hooks that announce a surprise, ask a question, or reach for filler are rejected", () => {
  assert.ok(hookIssues("How AI is changing the workplace").some((i) => /description/.test(i)));
  assert.ok(hookIssues("What happens when the grid loses 3 gigawatts?").some((i) => /question/.test(i)));
  assert.ok(hookIssues("A game-changer for 3 million developers").some((i) => /means nothing/.test(i)));
});

// ---------------------------------------------------------------------------
// Pictures. The account's promise is that what it shows is real, so a generated
// picture may set a mood and may never appear to show someone it quotes.
// ---------------------------------------------------------------------------
// A slide's `image` block described what the carousel renderer would composite.
// Carousels were retired on 2026-07-28 and the block stayed mandatory until
// 2026-07-31, so every post cost its writer nine invented picture descriptions
// that nothing acquired, nothing rendered and nobody saw — and forgetting one
// blocked the build. It is optional now; what it must NOT do is stop being
// checked when it IS there, because the same shapes describe `photo` beats.
test("a slide's picture block is optional, and still linted when present", async () => {
  const p = goodPost();
  delete p.slides[1].image;
  assert.equal((await errs(p)).filter((e) => /image: missing/.test(e)).length, 0,
    "a missing block is not an error any more");

  p.slides[1].image = { kind: "illustration", prompt: "a photo of Kimi K3 hacking Redis", alt: "x" };
  assert.ok(hasErr(await errs(p), /slide 2/), "a block that IS there is still held to the rules");
});

test("a generated picture may not depict a person the post quotes", () => {
  const post = { slides: [{ type: "quote", attribution: "Hannah Cyrus, reference librarian" }] };
  const slide = { type: "quote", image: { kind: "illustration", prompt: "a portrait of Hannah at her library desk, cinematic, no text", alt: "x" } };
  assert.ok(imageIssues(slide, post).some((i) => /never appear to show someone real/.test(i)));
});

test("an illustration prompt must forbid lettering, and a photo needs a keyword query", () => {
  assert.ok(imageIssues({ image: { kind: "illustration", prompt: "a wide cinematic shot of a server hall", alt: "x" } }).some((i) => /no text/.test(i)));
  assert.ok(imageIssues({ image: { kind: "photo", alt: "x" } }).some((i) => /keyword `query`/.test(i)));
  assert.equal(imageIssues({ image: { kind: "photo", query: "server rack", alt: "racks" } }).length, 0);
});

// ---------------------------------------------------------------------------
// Openverse and Commons are keyword indexes. A sentence finds nothing at all.
// ---------------------------------------------------------------------------
test("a photo query that finds nothing is retried shorter, longest first", () => {
  const ladder = queryLadder("librarian helping a patron at the public library desk");
  assert.equal(ladder[0], "librarian helping a patron at the public library desk");
  assert.ok(ladder.length > 2);
  assert.equal(ladder.at(-1).split(/\s+/).length, 1);
});

test("diagrams and logos are ranked below photographs", () => {
  const base = { width: 2000, height: 1400, license: "cc0", provider: "openverse/flickr" };
  assert.ok(scoreCandidate({ ...base, title: "Power grid map of Poland" }) < scoreCandidate({ ...base, title: "Substation at dusk" }));
});

test("the credit line is one short line, not a catalogue entry", () => {
  const line = creditLine({ generated: false, license: "by", creator: "Novoklimov", title: "Switchyard of electric substation 750kV in the Ural mountains" });
  assert.equal(line, "Novoklimov · CC BY");
  assert.equal(creditLine({ generated: true }), "Illustration · AI-generated");
});

// ---------------------------------------------------------------------------
// 2026-07-26: beats were capped at 7.5s while a narration line took 8.0s to
// say. The pad went negative, ffmpeg refused the filtergraph, and the run fell
// back to a silent Reel. A whole feature lost to a clamp.
// ---------------------------------------------------------------------------
test("a beat is never shorter than the line it has to say", () => {
  const timed = applyNarrationTiming([{ type: "cover" }, { type: "line" }, { type: "end" }], [{ seconds: 8.4 }, { seconds: 0.6 }, { seconds: 3.0 }]);
  for (const [i, b] of timed.entries()) {
    assert.ok(b.duration >= [8.4, 0.6, 3.0][i], `beat ${i} is shorter than its narration`);
    assert.ok(b.silence >= 0, `beat ${i} would need negative silence`);
  }
  assert.ok(timed[0].long, "a line that takes 8.4s to say must be flagged for shortening");
});

test("narration is the text on the screen, and does not say the unit twice", () => {
  const beats = buildTimeline({
    slides: [
      { type: "hook", headline: "Libraries now teach you to switch AI off" },
      { type: "stat", figure: "3.1 GW", unit: "gigawatts of demand, gone in 30 seconds", body: "" },
      { type: "stat", figure: "2.6M", unit: "downloads in a week", body: "" },
      { type: "cta", headline: "One story a day", sub: "Follow for the next one." },
    ],
  });
  assert.equal(beats[0].narration, "Libraries now teach you to switch AI off.");
  assert.ok(!/gigawatts.*gigawatts/i.test(beats[1].narration), beats[1].narration);
  // Magnitude is meaning, not clumsiness: dropping the M would make it false.
  assert.ok(/2\.6M/.test(beats[2].narration), beats[2].narration);
});

// ---------------------------------------------------------------------------
// Hasan, 2026-07-26, looking at the live run reading the smoke-test report:
// "il fallait pas le cacher?" The report is fine and deliberate. The fixture
// beside it was not: a complete, gate-clean post about a story that had just
// been deleted from the account, one copy away from being republished.
// ---------------------------------------------------------------------------
test("a test fixture cannot be published, whatever else is right about it", async () => {
  const p = goodPost();
  p.slug = "fixture-do-not-publish";
  assert.ok(hasErr(await errs(p), /belongs to a test fixture/));

  // and the smoke test, which publishes nothing, can still exercise the gate
  const allowed = await validatePost(p, { online: false, fixture: true });
  assert.equal(allowed.ok, true, allowed.errors.join("\n"));
});

// ---------------------------------------------------------------------------
// 2026-07-26: the account went to four posts a day while every carousel it had
// ever made still said "One story a day" and "A new one tomorrow" on its last
// slide, and asked for nothing at all. Watch time is the heaviest ranking
// signal, sends the next, and the sign-off was spending the one frame that
// could ask for either.
// ---------------------------------------------------------------------------
test("a slide may not promise a publishing frequency", async () => {
  const p = goodPost();
  p.slides.at(-1).headline = "One story a day";
  assert.ok(hasErr(await errs(p), /promises a publishing frequency/));

  const q = goodPost();
  q.caption = "A new one tomorrow. AI-assisted.";
  assert.ok(hasErr(await errs(q), /caption promises a publishing frequency/));
});

test("a close that asks for nothing is advice, not a refusal", async () => {
  // Demoted 2026-07-26. A composition rule of mine refused a finished, verified
  // carousel an hour after I wrote it, and Hasan had asked for that carousel.
  // Only a wrong fact or one of his own standing rules stops a publish now.
  const p = goodPost();
  p.slides.at(-1).headline = "The takeaway";
  p.slides.at(-1).sub = "That is the story.";
  const r = await validatePost(p, { online: false });
  assert.equal(r.ok, true, "style must not block: " + r.errors.join("; "));
  assert.ok(r.warnings.some((w) => /asks for nothing/.test(w)), "but it must still say so");
});

// ---------------------------------------------------------------------------
// 2026-07-26: a carousel published at 23:54:52 UTC belonged to "yesterday", so
// the run six hours later was told the grid was empty and owed a second one.
// The code was right and the rule was arbitrary. Hasan spotted it in a live
// run's own words: "no carousel yet today — so this run owes both."
// ---------------------------------------------------------------------------
test("the carousel window is rolling, not a calendar day", async () => {
  const justBeforeMidnight = new Date("2026-07-25T23:54:52Z");
  const sixHoursLater = new Date("2026-07-26T06:00:00Z");
  const hours = (sixHoursLater - justBeforeMidnight) / 3600000;
  assert.ok(hours < CAROUSEL_EVERY_HOURS, "six hours is inside the window");
  // and a full day later it is due again
  assert.ok((new Date("2026-07-26T20:30:00Z") - justBeforeMidnight) / 3600000 >= CAROUSEL_EVERY_HOURS);
});

// ---------------------------------------------------------------------------
// 2026-07-26: a live Reel opened with "8,192 virtual surgical robots trained at
// once" and printed "8,192" again in the hero underneath. The manual had
// forbidden it since the first post; nothing checked, so half the loudest space
// on the cover said one thing twice. The run caught it in its own report, which
// is not a control.
// ---------------------------------------------------------------------------
test("the hero may not repeat a figure the headline already carries", async () => {
  const p = goodPost();
  p.slides[0].headline = "70 people came to one class on switching AI off";
  p.slides[0].hero = { value: "70", label: "turned up" };
  const r = await validatePost(p, { online: false });
  assert.equal(r.ok, true, "a repeated figure is redundant, not false");
  assert.ok(r.warnings.some((w) => /already appears in the headline/.test(w)));

  p.slides[0].hero = { value: "30", label: "was the cap on sign-ups" };
  const clean = await validatePost(p, { online: false });
  assert.ok(!clean.warnings.some((w) => /already appears in the headline/.test(w)));
});

// ---------------------------------------------------------------------------
// 2026-07-26: a run passed the wrong field names to recordPosted and the
// fingerprint came out "undefin" — the first seven characters of "undefined".
// It caught that by eye. Had it not, filterFresh would never have matched the
// story again and a later run could have republished it, to the same audience,
// as new.
// ---------------------------------------------------------------------------
test("a posted record that cannot recognise its own story is refused", async () => {
  await assert.rejects(() => recordPosted({ slug: "x", mediaId: "1", url: "https://a.com/x" }), /`title` is required/);
  await assert.rejects(() => recordPosted({ slug: "x", mediaId: "1", title: "T" }), /`url` is required/);
  await assert.rejects(() => recordPosted({ mediaId: "1", title: "T", url: "https://a.com/x" }), /`slug` is required/);
});

// ---------------------------------------------------------------------------
// 2026-07-27: two runs in a row published an AI-breaks-security story — an
// OpenAI test model breaking into Hugging Face, then Kimi K3 finding Redis
// zero-days. Both real, both the week's actual news, and the second run flagged
// it itself: "back-to-back it reads as a narrow account." Nothing could see it,
// because filterFresh dedupes stories and not subjects.
// ---------------------------------------------------------------------------
test("a theme running through recent posts is named, and a carousel plus its Reel count once", () => {
  assert.deepEqual(themesOf("Kimi K3 agents found Redis zero-days and built an RCE exploit"), ["security"]);
  assert.ok(themesOf("Monday.com blames AI for layoffs").includes("jobs"));
  assert.ok(themesOf("Nvidia to guarantee $250 billion of data centre financing").includes("money"));
  // A story with no matching theme is not forced into one.
  assert.deepEqual(themesOf("Librarians teach a class on turning features off"), []);
});

// ---------------------------------------------------------------------------
// Three times now I have put a backtick inside the CSS template literal in
// template.mjs — writing `top` or `mix-blend-mode` in a comment — and each time
// the file stopped parsing. The suite caught it only because something happened
// to import it. This imports every module, so nothing can be added to src/ and
// go unparsed.
// ---------------------------------------------------------------------------
test("every module in src/ parses and loads", async () => {
  const { readdir } = await import("node:fs/promises");
  const files = (await readdir(new URL("../src", import.meta.url))).filter((f) => f.endsWith(".mjs"));
  assert.ok(files.length >= 10, `expected the whole pipeline, found ${files.length} modules`);
  for (const f of files) {
    await assert.doesNotReject(() => import(`../src/${f}`), `${f} does not load`);
  }
});

test("the artifact multipliers are refused before money, at gate and engine", async () => {
  const { simplicityIssues, promptIssues, veoPrompt } = await import("../src/promptcraft.mjs");
  assert.ok(simplicityIssues("dense night highway traffic, rows of red brake lights").length, "the 29 July opener is now refused");
  assert.ok(simplicityIssues("a crowded station at rush hour").length);
  assert.equal(simplicityIssues("a single vending machine dropping one can into the tray").length, 0);
  const p = veoPrompt({ subject: "highway traffic", action: "flowing", setting: "at night" });
  assert.ok(promptIssues(p).some((i) => /many-moving-objects/.test(i)), "promptIssues carries the same refusal");

  const post = goodPost();
  post.reel2 = goodReel2();
  post.reel2.beats[0].visual = { type: "veo", spec: { subject: "dense highway traffic", action: "braking", setting: "at night" } };
  assert.ok(hasErr(await errs(post), /many-moving-objects/), "the gate refuses it before the publish run wastes a cycle");
});

test("promptcraft: the mood decides the light, and the refusals refuse", async () => {
  const { veoPrompt, imagePrompt, promptIssues, MOODS } = await import("../src/promptcraft.mjs");
  const p = veoPrompt({ subject: "a person", action: "typing", setting: "in a dark office", mood: "tension" });
  assert.ok(p.includes(MOODS.tension.light), "the mood's light phrase reaches the prompt");
  // Exclusions moved to descriptive phrasing on 2026-07-30, per Google's own
  // guide (avoid instructive "no X"); the intent is unchanged and asserted.
  assert.ok(/free of readable lettering/.test(p), "the no-lettering rule is always present");
  assert.ok(/nobody speaks/.test(p), "Veo must not talk under the narration");
  const i = imagePrompt({ subject: "hands", setting: "a desk", mood: "wonder" });
  assert.ok(i.includes(MOODS.wonder.light));
  assert.deepEqual(promptIssues("a quiet street at night"), []);
  assert.ok(promptIssues("the Hugging Face office at night", { forbidNames: ["Hugging Face"] }).length === 1,
    "a prompt naming the reported subject is refused");
  assert.ok(promptIssues('a man says "hello there" softly').length === 1, "quoted dialogue is refused");
});

test("reel2 alignment: whisper's French elision fragments merge back into one spoken word", async () => {
  const { mergeContinuations } = await import("../src/reel2.mjs");
  const heard = [
    { w: "pause", s: 0.0, e: 0.4 },
    { w: "de", s: 0.4, e: 0.5 },
    { w: "l", s: 0.5, e: 0.6 },
    { w: "'IA.", s: 0.6, e: 0.9 },
    { w: "lui", s: 1.0, e: 1.2 },
    { w: "-même", s: 1.2, e: 1.5 },
    { w: "qu", s: 1.6, e: 1.7 },
    { w: "’il", s: 1.7, e: 1.9 },
  ];
  const merged = mergeContinuations(heard);
  assert.deepEqual(merged.map((x) => x.w), ["pause", "de", "l'IA.", "lui-même", "qu’il"],
    "a token opening with an apostrophe or hyphen is a fragment of the previous word");
  assert.equal(merged[2].s, 0.5, "the merged word keeps the fragment's start");
  assert.equal(merged[2].e, 0.9, "and the continuation's end");
  assert.equal(mergeContinuations([{ w: "'orphan", s: 0, e: 1 }]).length, 1,
    "a leading fragment with no predecessor survives unmerged");
  const heardDigit = [
    { w: "Opus", s: 0, e: 0.3 },
    { w: "-5", s: 0.3, e: 0.6 },
    { w: "vient", s: 0.6, e: 0.9 },
  ];
  const mergedDigit = mergeContinuations(heardDigit);
  assert.deepEqual(mergedDigit.map((x) => x.w), ["Opus", "5", "vient"],
    "a hyphen before a digit is Whisper's numeral, not a compound-word fragment, and stays its own word");
});

test("reel2 karaoke: ASS colours convert, orphan words rejoin their sentence, screenshots caption low", async () => {
  const { hexToAss, buildAss } = await import("../src/reel2.mjs");
  assert.equal(hexToAss("FFB300"), "&H0000B3FF", "RRGGBB becomes ASS &H00BBGGRR");
  const words = [
    { w: "Google", s: 0.0, e: 0.3 }, { w: "listed", s: 0.3, e: 0.6 }, { w: "shared", s: 0.6, e: 0.9 },
    { w: "Claude", s: 0.9, e: 1.2 }, { w: "chats.", s: 1.2, e: 1.5 },
    { w: "The", s: 1.5, e: 1.7 }, { w: "links", s: 1.7, e: 2.0 }, { w: "live.", s: 2.0, e: 2.3 },
  ];
  const beats = [{ script: "Google listed shared Claude chats.", visual: { type: "screenshot" } },
                 { script: "The links live.", visual: { type: "image" } }];
  const ranges = [{ start: 0, end: 4 }, { start: 5, end: 7 }];
  const ass = buildAss(words, beats, ranges, "FFB300");
  assert.ok(!/Dialogue:[^\n]*,K[^L]*,{\\k\d+}CHATS\s*$/m.test(ass), "no dialogue holds a single orphan word");
  const dialogues = ass.split("\n").filter((l) => l.startsWith("Dialogue:"));
  const low = dialogues.filter((d) => d.includes(",KLOW,"));
  // The captions grew from 86px to 104px on 2026-07-31 because they were hard
  // to read on a phone, so a five-word sentence no longer fits on one line and
  // the screenshot beat now captions in two. What must stay true is that every
  // one of its captions is in the LOW band, clear of the receipt card.
  assert.ok(low.length >= 1, "the screenshot beat captions in the low band");
  assert.equal(low.reduce((n, d) => n + (d.match(/\\k\d+/g) || []).length, 0), 5,
    "all five words of the screenshot beat are captioned, none dropped");
  assert.ok(dialogues.every((d) => (d.match(/\\k\d+/g) || []).length >= 2), "every caption carries at least two timed words");

  // WrapStyle 2 never wraps, so a wide line walks off both frame edges:
  // "OPENAI A SUSPENDU L'ENTRAÎNEMENT" nearly shipped clipped on 2026-07-29.
  const wide = [
    { w: "OpenAI", s: 0.0, e: 0.4 }, { w: "a", s: 0.4, e: 0.5 }, { w: "suspendu", s: 0.5, e: 1.0 },
    { w: "l'entraînement", s: 1.0, e: 1.8 }, { w: "du", s: 1.8, e: 2.0 }, { w: "modèle.", s: 2.0, e: 2.5 },
  ];
  const wideAss = buildAss(wide, [{ script: "x", visual: { type: "image" } }], [{ start: 0, end: 5 }], "FFB300");
  const wideLines = wideAss.split("\n").filter((l) => l.startsWith("Dialogue: 0"));
  for (const d of wideLines) {
    const textLen = d.replace(/^.*?,,0,0,0,,/, "").replace(/\{[^}]*\}/g, "").length;
    assert.ok(textLen <= 18, `karaoke line wider than the K style's frame budget: ${textLen} chars`);
  }
});

/**
 * A legal 60-second plan. It has to be a real one: 8 beats and ~180 words, the
 * window the format module derives from SPEECH_S and the voice's measured rate.
 * The old fixture was 4 beats and 30 words, which is what a fixture looks like
 * when the format it is supposed to protect was never enforced.
 */
const goodReel2 = () => ({
  voice: "Charon", mood: "tension", lang: "fr",
  title: "70 personnes pour apprendre à couper l'IA",
  beats: [
    { script: "Dans une bibliothèque publique américaine, un cours gratuit apprend à éteindre l'intelligence artificielle de son téléphone. 70 personnes se sont présentées un mardi après-midi.",
      visual: { type: "veo", spec: { subject: "a librarian's hands", action: "closing a laptop", setting: "in a small-town library" } } },
    { script: "Et le plus parlant n'est pas le nombre venu ce jour-là. C'est très exactement ce que ces gens étaient venus y chercher.",
      visual: { type: "screenshot", url: "https://techcrunch.com/a" } },
    { script: "La salle en attendait une douzaine, comme chaque semaine depuis l'ouverture de l'atelier. Le bibliothécaire a fini par refuser du monde à la porte.",
      visual: { type: "photo", query: "public library interior", alt: "a public library reading room" } },
    { script: "Les participants ne demandaient pas comment se servir de ces outils, ni comment écrire de meilleures instructions. Ils demandaient comment les faire taire.",
      visual: { type: "photo", query: "library reading room", alt: "a library reading room" } },
    { script: "Donc les bibliothèques ont ouvert des séances sans inscription et sans frais, un après-midi par semaine, dans des villes où personne d'autre ne le fait.",
      visual: { type: "image", spec: { subject: "a dim reading room", setting: "in a public library" } } },
    { script: "Mais la demande ne vient pas de qui vous croyez. La moitié de la salle avait moins de quarante ans, et beaucoup travaillent avec ces outils toute la journée.",
      visual: { type: "image", spec: { subject: "a public library computer", setting: "in a bright reading room" } } },
    { script: "Le cours ne dit jamais que la technologie est mauvaise. Il dit que le réglage existe, qu'il est caché, et qu'il vous appartient.",
      visual: { type: "image", spec: { subject: "a switch on a wall", setting: "in a bright corridor" } } },
    { script: "La séance suivante est déjà complète. Abonne-toi pour l'actu IA de demain, et laisse un like si tu as appris quelque chose.",
      visual: { type: "image", spec: { subject: "a phone face down", setting: "on a wooden table" } } },
  ],
});

test("reel2 scripts are held to the slide standard: digits quoted, shape checked", async () => {
  const p = goodPost();
  p.reel2 = goodReel2();
  assert.equal((await errs(p)).filter((e) => /reel2/.test(e)).length, 0, "a clean plan passes");

  p.reel2.beats[1].script = "Il a trouvé 19 failles en 90 minutes.";
  assert.ok(hasErr(await errs(p), /spoken but appear in no evidence/), "an unquoted spoken figure is refused, in French too");

  p.reel2.beats[1].script = "70 personnes sont venues.";
  p.reel2.beats[1].visual = { type: "screenshot" };
  assert.ok(hasErr(await errs(p), /screenshot beat needs a url or a file/));

  p.reel2 = goodReel2();
  p.reel2.beats = p.reel2.beats.slice(0, 3);
  assert.ok(hasErr(await errs(p), /the 60-second spine is 7 to 10/));
});

// ---------------------------------------------------------------------------
// The 60-second contract. The bio promises "L'actu IA en 60 secondes" daily and
// the first four Reels ran 47 to 51 seconds, every one of them reported
// COMPLIANT: the engine only ever had an upper bound, and the gate only ever
// had a word ceiling. A promise nothing measures is a promise nothing keeps.
// ---------------------------------------------------------------------------
/**
 * The fixture's length is coupled to a ledger that real runs keep writing to,
 * and a red suite stops every run. If this ever fails, the fix is to resize
 * goodReel2 to the window the message prints — never to loosen the window.
 */
test("the fixture sits inside the window the gate actually computes", async () => {
  const p = goodPost();
  p.reel2 = goodReel2();
  const words = p.reel2.beats.reduce((n, b) => n + b.script.trim().split(/\s+/).length, 0);
  const e = (await errs(p)).filter((x) => /word (floor|ceiling)|words of narration/.test(x));
  assert.equal(e.length, 0,
    `goodReel2 is ${words} words and the gate refuses it: ${e[0] || ""}. Resize the fixture, do not widen the window.`);
});

// The manual has banned a printed cadence since the account promised "One
// story a day" and then published four. It said the gate enforced it "in both
// languages" and on every surface. On 2026-07-31 the gate missed all three of
// these: an adjective between the number and the noun defeated the pattern, the
// spoken script was never checked at all, and `\bà` never matches after a space
// because JavaScript's word boundary is ASCII-only.
// land.mjs is the only way anything reaches main, so its failure modes are the
// account's failure modes. Two of them shipped and were found on 2026-07-31:
// it could not push a commit it had already made, and it called every rebase
// refusal a conflict with a human — including "you have unstaged changes",
// which is the state a run is ALWAYS in when the manual tells it to land the
// journal before a purchase.
test("landing refuses a red suite for code, never for the flight recorder", async () => {
  const src = await (await import("node:fs/promises")).readFile(new URL("../src/land.mjs", import.meta.url), "utf8");
  assert.match(src, /ALWAYS_LANDABLE\s*=\s*\/\^\(state\\\/\|reports\\\/journal\\\/\)/,
    "state/ and reports/journal/ always land: a journal that cannot record a death is worse than a red suite");
  assert.match(src, /npm.*test|suiteIsGreen/, "code landings run the suite first");
  assert.match(src, /rebase", "--autostash"/,
    "a dirty tree is the normal state mid-run; without autostash git refuses and the failure reads as a human conflict");
  assert.doesNotMatch(src, /--force|-f\b/, "there is no force in this file and none is ever to be added");
});

test("a printed cadence is refused wherever it appears", async () => {
  const p = goodPost();
  p.reel2 = goodReel2();

  const freq = async () => (await errs(p)).filter((e) => /frequency/i.test(e)).length;
  assert.equal(await freq(), 0, "the clean fixture promises nothing");

  p.caption = "Une actu IA par jour.\n\n" + p.caption;
  assert.ok(await freq(), "an adjective between the number and the noun must not defeat it");

  p.caption = goodPost().caption;
  p.slides.at(-1).headline = "One verified story a day";
  assert.ok(await freq(), "same trap in English");

  p.slides.at(-1).headline = goodPost().slides.at(-1).headline;
  p.reel2.beats[2].script = "On en reparle chaque jour ici, promis.";
  assert.ok(await freq(), "the spoken script is a surface too");

  p.reel2.beats[2].script = goodReel2().beats[2].script;
  p.reel2.beats.at(-1).script = "Abonne-toi pour la suite. À demain.";
  assert.ok(await freq(), "an accented word boundary is not a word boundary in JavaScript");

  // And it must not fire on a figure the story actually reports.
  p.reel2 = goodReel2();
  p.caption = goodPost().caption;
  p.reel2.beats[2].script = "La classe accueille 70 personnes par jour selon le rapport. Abonne-toi pour demain.";
  assert.equal(await freq(), 0, "a reported rate is not a promise about this account");
});

test("the caption's first line is the Google snippet, and it is bounded", async () => {
  const p = goodPost();
  p.caption = "x".repeat(126) + "\n\nreste de la légende. AI-assisted.";
  assert.ok(hasErr(await errs(p), /first line is 126 characters/));
  p.caption = "x".repeat(120) + "\n\nreste de la légende. AI-assisted.";
  assert.ok(!hasErr(await errs(p), /first line is/));

  // The floor is not style. publish.mjs recognises a post that went live
  // despite an error by matching the first 60 characters of this line, and it
  // gives up under 12 — so a short first line silently disarms the guard
  // against a double post, which is the worst thing this account can do.
  p.caption = "Anthropic.\n\nreste de la légende. AI-assisted.";
  assert.ok(hasErr(await errs(p), /first line is only 10 characters/));
});

test("the runtime is a contract: a script too short for 60 seconds is refused", async () => {
  const p = goodPost();
  p.reel2 = goodReel2();
  assert.equal((await errs(p)).filter((e) => /reel2/.test(e)).length, 0, "a full-length plan passes");

  // The exact shape of every Reel this account published before 2026-07-31:
  // inside the old 130-155 window, and 10 seconds short of the promise.
  p.reel2.beats = p.reel2.beats.map((b) => ({ ...b, script: b.script.split(/\s+/).slice(0, 14).join(" ") }));
  p.reel2.beats.at(-1).script = "Envoie ça à quelqu'un qui subit ces fenêtres.";
  assert.ok(hasErr(await errs(p), /under the \d+-word floor/), "a 47-second Reel is not a 60-second Reel");

  p.reel2 = goodReel2();
  p.reel2.beats[0].script += " " + "et encore un mot".repeat(20);
  assert.ok(hasErr(await errs(p), /over the \d+-word ceiling/));
});

test("the word window is arithmetic on the voice's own measured rate", async () => {
  const { wordWindow, medianRate, SPEECH_S, DEFAULT_RATE, TARGET_S, END_S, TAIL_S } = await import("../src/format.mjs");
  assert.equal(Number((TARGET_S - END_S - TAIL_S).toFixed(2)), SPEECH_S, "the speech budget is what is left of the minute");

  // A voice that reads faster needs more words to fill the same 55.6 seconds.
  const slow = wordWindow(3.0), fast = wordWindow(3.6);
  assert.ok(fast.target > slow.target, "a faster voice buys a longer script");
  assert.ok(slow.min < slow.target && slow.target < slow.max);

  /*
   * The floor is four readings, not three, and three is exactly why.
   *
   * On 2026-07-31 `calibrate-voice.mjs` bought three readings of Sadaltager and
   * the ledger reached its old floor of three on the strength of them. All three
   * were of ONE script — that day's PyPI story — and gave a median of 3.34. The
   * evening's turbines script, same voice, same direction, same model, read at a
   * median of 3.77: the same voice reads different copy about 13% apart, wider
   * than the whole word window.
   *
   * The publish run then wrote 188 words to a window centred on 3.34. At 188
   * words the engine needs 50.0s of raw audio to stay inside the stretch band,
   * a ceiling of 3.76 words a second — and the night's median reading was 3.77.
   * Six of its eleven narrations were refused before they were ever played.
   *
   * One calibration run produces exactly three readings of exactly one script,
   * so three could never be enough to size every script that follows.
   */
  assert.equal(medianRate([{ words: 180, seconds: 50 }, { words: 180, seconds: 60 }]), DEFAULT_RATE, "two readings do not speak");
  assert.equal(medianRate([{ words: 180, seconds: 60 }, { words: 180, seconds: 60 }, { words: 180, seconds: 60 }]), DEFAULT_RATE,
    "and neither do the three a single calibration produces");
  assert.equal(medianRate(Array.from({ length: 4 }, () => ({ words: 180, seconds: 60 }))), 3, "four is the floor");

  // Junk lines are ignored rather than averaged in — and they do not count
  // towards the floor either.
  assert.equal(medianRate([{ words: 0, seconds: 60 }, { words: 180, seconds: 0 }, ...Array.from({ length: 4 }, () => ({ words: 180, seconds: 60 }))]), 3);
  assert.equal(medianRate([{ words: 0, seconds: 60 }, { words: 180, seconds: 0 }, ...Array.from({ length: 3 }, () => ({ words: 180, seconds: 60 }))]), DEFAULT_RATE,
    "three good readings plus two junk ones is still three good readings");

  // The default is measured, not chosen: the median of every Sadaltager reading
  // this account has bought. A wrong default is what a fresh ledger inherits.
  assert.ok(DEFAULT_RATE > 3.5 && DEFAULT_RATE < 3.8, `DEFAULT_RATE ${DEFAULT_RATE} should sit inside the measured 3.22-4.16 spread, near its middle`);
});

test("reel2: the hook card is required and held to headline rules", async () => {
  const p = goodPost();
  p.reel2 = goodReel2();

  delete p.reel2.title;
  assert.ok(hasErr(await errs(p), /`title` is missing/), "no title, no audition frame");

  p.reel2.title = "Un chiffre que personne n'avait vérifié: 2 300 inscrits";
  assert.ok(hasErr(await errs(p), /title figure\(s\) 2300/), "a title figure outside the evidence is refused");

  p.reel2.title = "70 personnes pour apprendre à couper l'IA";
  assert.equal((await errs(p)).filter((e) => /title/.test(e)).length, 0);

  // The four hook rules are errors on the card, not warnings. The manual called
  // them "hard rules, enforced by the gate" from the day of the French pivot,
  // and until 2026-07-31 the card that is the audition frame only got nagged.
  for (const bad of [
    "Claude a-t-il piégé 15 machines ?",
    "Comment Claude a piégé des machines",
    "Une révolution dans le paysage de l'IA",
  ]) {
    p.reel2.title = bad;
    assert.ok(hasErr(await errs(p), /reel2 title:/), `hook refused: ${bad}`);
  }

  // And it must not fire on the shapes this account actually publishes.
  for (const good of [
    "Claude a piégé 15 machines bien réelles",
    "Vos chats Claude étaient sur Google",
    "OpenAI vient de perdre le contrôle de ses modèles",
  ]) {
    p.reel2.title = good;
    assert.equal((await errs(p)).filter((e) => /reel2 title:/.test(e)).length, 0, `hook accepted: ${good}`);
  }
});

test("reel2: the last beat asks for the subscription, and says what it buys", async () => {
  const p = goodPost();
  p.reel2 = goodReel2();
  p.reel2.beats.at(-1).script = "Voilà pour aujourd'hui.";
  assert.ok(hasErr(await errs(p), /last beat asks for nothing/));

  // The send ask this account used to write was a strawman addressed to nobody;
  // Hasan replaced it on 2026-07-31 with the subscription. A send ask alone is
  // no longer enough.
  p.reel2.beats.at(-1).script = "Envoie ça à celui qui répète que l'IA reste enfermée.";
  assert.ok(hasErr(await errs(p), /last beat asks for nothing/), "a send ask is not the ask any more");

  // Asking for the follow without naming the next edition is the weak version.
  p.reel2.beats.at(-1).script = "Abonne-toi si ça t'a plu.";
  const warns = (await validatePost(p, { online: false })).warnings;
  assert.ok(warns.some((w) => /without saying what comes next/.test(w)), "a follow ask with no tomorrow is flagged");

  p.reel2.beats.at(-1).script = "Abonne-toi pour l'actu IA de demain, et laisse un like.";
  assert.ok(!hasErr(await errs(p), /last beat asks for nothing/));
});

test("French thousands separators match English evidence, dates never merge", async () => {
  const p = goodPost();
  p.slides.splice(3, 0, {
    type: "content", title: "Les chiffres",
    body: "Au total, 1 100 personnes se sont inscrites cette année.",
    evidence: "In total, 1,100 people signed up for the workshops this year across the state of Maine.",
    source: { url: "https://techcrunch.com/a", name: "TechCrunch", date: FRESH_DATE },
    image: photo("library shelves"),
  });
  const list = await errs(p);
  assert.ok(!hasErr(list, /1100/), "1 100 in French copy matches 1,100 in the quote:\n" + list.join("\n"));

  p.slides[3].body = "Au total, 2 300 personnes se sont inscrites cette année.";
  assert.ok(hasErr(await errs(p), /2300/), "a spaced figure with no evidence is still refused");
});

test("the caption disclosure and the gate speak French now", async () => {
  const p = goodPost();
  p.caption = "Une légende avec le chiffre 70 dedans. Assisté par IA.";
  assert.ok(!hasErr(await errs(p), /AI disclosure/), "the French disclosure is accepted");
  p.caption = "Une légende avec le chiffre 70 dedans, sans mention.";
  assert.ok(hasErr(await errs(p), /AI disclosure/), "no disclosure, no pass");
});

test("French dead openers and filler are refused like their English twins", async () => {
  assert.ok(hookIssues("Pourquoi l'IA change tout").some((i) => /description/.test(i)));
  assert.ok(hookIssues("Tout savoir sur les agents IA").some((i) => /description/.test(i)));
  assert.ok(hookIssues("Une avancée révolutionnaire pour 3 millions de développeurs").some((i) => /means nothing/.test(i)));
  assert.equal(hookIssues("OpenAI a coupé 3.1 gigawatts en 30 secondes").length, 0);
  assert.ok(hookIssues("Les modèles progressent encore").some((i) => /no number and no name/.test(i)), "a French sentence-opener capital is not a name");
});

test("the caption may not promise a cadence, in either language", async () => {
  const p = goodPost();
  p.caption = "Une actu par jour, chaque jour. Le chiffre 70. Assisté par IA.";
  assert.ok(hasErr(await errs(p), /publishing frequency/));
});

test("the hook card and the end-card ride above the karaoke", async () => {
  const { buildAss } = await import("../src/reel2.mjs");
  const words = [
    { w: "Google", s: 0.0, e: 0.3 }, { w: "listait", s: 0.3, e: 0.6 }, { w: "des", s: 0.6, e: 0.9 },
    { w: "chats", s: 0.9, e: 1.2 }, { w: "partagés.", s: 1.2, e: 1.5 },
  ];
  const beats = [{ script: "Google listait des chats partagés.", visual: { type: "image" } }];
  const ranges = [{ start: 0, end: 4 }];
  const ass = buildAss(words, beats, ranges, "FF8A3D", { title: "Google exposait vos chats Claude", endcard: { from: 40, dur: 3 } });
  assert.ok(/Style: TITLE,OOM Display,/.test(ass), "the title style uses the display face");
  assert.ok(/Style: TITLE,[^,]+,\d+,[^\n]*,3,\d+,\d+,8,/.test(ass),
    "the title rides on an opaque box (BorderStyle 3), which is what stopped it colliding with the receipt underneath");
  assert.ok(/Dialogue: 1,0:00:00\.00,[^,]+,TITLE,.*GOOGLE EXPOSAIT VOS CHATS CLAUDE/.test(ass), "the full hook is burned from frame zero, upper-cased");
  // The end-card is four positioned lines since 2026-07-31: the promise across
  // two lines of wide display black, then what it wants and when.
  const end = ass.split("\n").filter((l) => /,(ENDBIG|ENDFOLLOW),/.test(l));
  assert.equal(end.length, 4, "four lines on the end-card");
  assert.ok(end.every((l) => /0:00:40\.00,0:00:43\.00/.test(l)), "all of them for the card's whole three seconds");
  const endText = end.join(" ");
  assert.ok(/UNE ACTU IA/.test(endText) && /PAR JOUR\./.test(endText), "the serial promise");
  assert.ok(/ABONNE-TOI POUR DEMAIN/.test(endText), "the follow ask names when");
  assert.ok(/ET LAISSE UN LIKE/.test(endText), "and the like ask Hasan called for on 2026-07-31");
  const plain = buildAss(words, beats, ranges, "FF8A3D");
  assert.ok(!/TITLE|ENDBIG|ENDFOLLOW/.test(plain.split("[Events]")[1]), "no opts, no fixed layers — old call sites unchanged");
});

test("the known-facts lint catches the Hugging Face incident, in both languages", async () => {
  const { factIssues } = await import("../src/validate.mjs");
  assert.ok(factIssues("il a piraté Hugging Face, le site où les développeurs du monde entier stockent leur code").length, "the exact published sentence is refused");
  assert.ok(factIssues("Hugging Face, a site developers use to store and share code").length, "the English source phrasing is refused too");
  assert.equal(factIssues("Hugging Face, la plateforme où le monde entier partage ses modèles d'IA").length, 0);
  assert.ok(factIssues("Claude, le modèle d'OpenAI, progresse encore").length, "wrong maker is refused");
  assert.ok(factIssues("OpenAI's Claude scored higher this week").length);
  assert.equal(factIssues("Claude, le modèle d'Anthropic, progresse encore").length, 0);
});

test("reel2: photo beats validated, mood wallpaper capped at three stills", async () => {
  const p = goodPost();
  p.reel2 = goodReel2();
  p.reel2.beats[1].visual = { type: "photo" };
  assert.ok(hasErr(await errs(p), /photo beat needs a `query`/));
  p.reel2.beats[1].visual = { type: "photo", query: "sam altman" };
  assert.ok(!hasErr(await errs(p), /photo beat needs/));

  // Every beat a generated still: the 29 July Reel's exact failure, and the
  // cap and the floor catch it from both ends.
  p.reel2 = goodReel2();
  p.reel2.beats = p.reel2.beats.map((b) => ({ ...b, visual: { type: "image", spec: { subject: "a dim room", setting: "at night" } } }));
  const wallpaper = await errs(p);
  assert.ok(hasErr(wallpaper, /ceiling is 4/), "five generated stills read as wallpaper");
  assert.ok(hasErr(wallpaper, /show something real — the floor is 3/), "a Reel that shows nothing real is refused, not merely capped");

  // And the floor is what a cap alone cannot say: four stills are fine when
  // the rest of the Reel is receipts and photographs.
  p.reel2 = goodReel2();
  assert.ok(!hasErr(await errs(p), /ceiling is 4|floor is 3/));
});

// ---------------------------------------------------------------------------
// A beat's share of the run is decided by its share of the words, and both ends
// of that share have a limit the gate never checked.
//
// The short end is a flash: a one-word beat renders nine frames — its picture
// is subliminal, its caption cannot be read, and the seconds it gives up land
// on another beat as a picture held far too long.
//
// The long end costs money. Veo's longest clip is eight seconds; the engine
// sizes its purchase to the beat but the ladder stops there, and every second
// past it used to hold the last frame. Both of 2026-07-31's builds did exactly
// that, by 0.30s and 0.23s against a clip Veo delivers at 8.000s — measured on
// the rendered file, the last nine frames carried 89% less motion than the body
// of the clip. Small enough to read as a stutter, which is why three days of
// watching the output never caught it.
// ---------------------------------------------------------------------------
test("a beat is neither a flash nor longer than the clip it bought", async () => {
  const p = goodPost();

  p.reel2 = goodReel2();
  p.reel2.beats[2].script = "Voilà.";
  assert.ok(hasErr(await errs(p), /1 word\(s\) — under \d+ the picture flashes/), "a one-word beat is a flash frame, not a beat");

  // A veo beat may not talk for longer than the engine can cover by slowing the
  // clip. Give it every other beat's words and it is far past that.
  p.reel2 = goodReel2();
  const vi = p.reel2.beats.findIndex((b) => b.visual?.type === "veo");
  assert.ok(vi >= 0, "the fixture must carry a veo beat for this rule to be exercised");
  p.reel2.beats[vi].script += ` ${p.reel2.beats.map((b) => b.script).join(" ")}`;
  assert.ok(hasErr(await errs(p), /Veo's longest clip is 8s.*frozen frame/s), "a veo beat past the stretch is refused before it is bought");

  // The rule is a floor on the degenerate case, not a tax on real writing: the
  // fixture's own beats sit inside it untouched.
  p.reel2 = goodReel2();
  assert.ok(!hasErr(await errs(p), /picture flashes|frozen frame/));

  // A pinned clip is not bought and may be any length, so the rule stands down.
  p.reel2 = goodReel2();
  p.reel2.beats[vi].visual.file = "media/pinned/clip.mp4";
  p.reel2.beats[vi].script += ` ${p.reel2.beats.map((b) => b.script).join(" ")}`;
  assert.ok(!hasErr(await errs(p), /frozen frame/), "a pinned clip is not sized by Veo's ceiling");

  // The prediction and the arithmetic the engine will do are the same function.
  const { beatSeconds, SPEECH_S } = await import("../src/format.mjs");
  const secs = beatSeconds(p.reel2.beats.map((b) => b.script.trim().split(/\s+/).length));
  assert.ok(Math.abs(secs.reduce((a, b) => a + b, 0) - SPEECH_S) < 0.01, "the beats share the spoken run exactly");
  assert.deepEqual(beatSeconds([]), [], "no beats is not a division by zero");
  assert.deepEqual(beatSeconds([0, 0]), [0, 0], "empty scripts are not a division by zero");
});

// ---------------------------------------------------------------------------
// 2026-07-31. Anthropic disclosed three incidents: Claude Mythos 5 published
// the malicious PyPI package, Claude Opus 4.7 was the one that kept attacking
// after realising the target was real. The day's script said "Claude" for five
// beats and then named "Opus 4.7" in the sixth. Every sentence was true, every
// digit was quoted, the gate passed twice — and a viewer reconstructs one story
// in which Opus 4.7 shipped the malware.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 2026-07-31. Six of a Reel's eight beats showed nothing that was in the news:
// a laptop alone on a table, stacks of paper, a door ajar, a phone beside a
// glass of water. Hasan: "pourquoi on regarde un smartphone et un verre d'eau
// posé sur une table ?" Nothing checked whether a picture had anything to do
// with the story, so nothing stopped it.
// ---------------------------------------------------------------------------
test("a picture has to show something the story contains", async () => {
  const p = goodPost();
  p.reel2 = goodReel2();
  assert.equal((await errs(p)).filter((e) => /shows nothing/.test(e)).length, 0, "a plan anchored in the story passes");

  p.reel2.beats[4].visual = { type: "image", spec: { subject: "a smartphone lying face up beside a glass of water", setting: "on a pale wooden table" } };
  assert.ok(hasErr(await errs(p), /shows nothing the story contains/), "furniture is refused");

  // "a laptop keyboard" would NOT be refused here, and correctly so: this
  // fixture's sources mention a laptop. The rule is about a picture with no
  // connection to the story, not about a banned list of objects.
  p.reel2.beats[4].visual = { type: "veo", spec: { subject: "a single hand", action: "turns a brass doorknob", setting: "in a dim corridor" } };
  assert.ok(hasErr(await errs(p), /shows nothing the story contains/), "a stock gesture is refused, and it is the most expensive beat");

  // The trap this rule created, and the reason proper nouns are excluded from
  // the vocabulary it accepts: the engine separately refuses a generated
  // picture whose prompt names anything the post reports on. A spec that
  // satisfied this rule with a brand name would have died later in the build,
  // after the narration was paid for.
  p.reel2.beats[4].visual = { type: "image", spec: { subject: "a Librarians conference banner", setting: "in a hall" } };
  assert.ok(hasErr(await errs(p), /shows nothing the story contains/),
    "overlapping only on a proper noun does not count — the engine would refuse that prompt anyway");

  p.reel2.beats[4].visual = { type: "image", spec: { subject: "a public workshop sign", setting: "in a bright hall" } };
  assert.ok(!hasErr(await errs(p), /shows nothing/), "a common noun from the story is what anchors a picture");
});

test("a name is a fact: the actor of the claim is named in the attaque", async () => {
  const { versionedActors } = await import("../src/validate.mjs");
  assert.deepEqual(versionedActors("Mythos 5 also picked up on signs"), ["Mythos 5"]);
  assert.deepEqual(versionedActors("This incident involved Claude Opus 4.7, and was the only case"), ["Claude Opus 4.7"]);
  assert.deepEqual(versionedActors("GPT-5.6 was cut by 80%"), ["GPT-5.6"]);
  assert.deepEqual(versionedActors("On 27 July 2026 the package was run on 15 real systems"), [],
    "a year is not a version and a count is not a model");

  const p = goodPost();
  p.reel2 = goodReel2();
  p.corroboration[0].quote = "Mythos 5 published a malicious package while librarians were teaching people how to switch AI features off.";
  assert.ok(hasErr(await errs(p), /first two beats name none of them/), "the story's actor may not stay anonymous until beat six");

  p.reel2.beats[0].script = "Mythos 5, un modèle d'intelligence artificielle, a publié un logiciel piégé. " + p.reel2.beats[0].script;
  assert.ok(!hasErr(await errs(p), /first two beats name none/), "naming it in the attaque is the fix");

  // And a version the sources never printed cannot be spoken at all.
  p.reel2 = goodReel2();
  p.reel2.beats[2].script = "Le cours tournait sur Mythos 9, sorti la semaine dernière.";
  assert.ok(hasErr(await errs(p), /names "Mythos 9", which appears in no evidence quote/));
});

test("retention is arithmetic in code, not a guess in a prompt", async () => {
  const { retentionPct } = await import("../src/watch.mjs");
  assert.equal(retentionPct(12000, 24), 50);
  assert.equal(retentionPct(63970, 58.2), 110, "loops can push retention past 100, and that is the good case");
  assert.equal(retentionPct(null, 24), null);
  assert.equal(retentionPct(12000, undefined), null);
  assert.equal(retentionPct(12000, 0), null);
});

test("the seed ledger closes the /comments blind spot", async () => {
  const { alreadySeeded } = await import("../src/engage.mjs");
  const rows = [{ kind: "comment", target: "111", id: "c1" }, { kind: "reply", target: "222", id: "c2" }];
  assert.ok(alreadySeeded(rows, "111"), "a seeded media is remembered even though the API would show nothing");
  assert.ok(!alreadySeeded(rows, "222"), "a reply is not a seed");
  assert.ok(!alreadySeeded([], "111"));
});

test("the closing-slide ask speaks French since the pivot", async () => {
  const p = goodPost();
  p.slides.at(-1).headline = "Envoie ça à quelqu'un qui fait confiance aux chatbots";
  p.slides.at(-1).sub = "Une info par jour, sans le bruit.";
  const r = await validatePost(p, { online: false });
  assert.ok(!r.warnings.some((w) => /asks for nothing/.test(w)), "a French send ask is an ask:\n" + r.warnings.join("\n"));
  p.slides.at(-1).headline = "Voilà pour aujourd'hui";
  p.slides.at(-1).sub = "À bientôt.";
  const r2 = await validatePost(p, { online: false });
  assert.ok(r2.warnings.some((w) => /asks for nothing/.test(w)), "a close that asks nothing still warns");
});

// ---------------------------------------------------------------------------
// `.gitattributes` states the invariant these ledgers live under: they merge by
// union, so every line survives a race and NO line's position means anything.
// state.mjs obeyed it. Three other readers did not, and each was one push race
// away from a wrong answer delivered with confidence:
//
//   insights latestPerPost  — a stale reading outranking a settled one, on the
//                             very numbers a run consults to decide what works
//   insights accountTrend   — a growth rate computed from the wrong two readings
//   watch publishHealth     — a silence alarm about an account that published
//                             this morning, acted on by the evening vigil
//   engage recentPublished  — the run's first comment posted under an old Reel
//
// The fixtures below are deliberately shuffled: file order disagrees with time
// order, which is exactly what a union merge produces.
// ---------------------------------------------------------------------------
test("every ledger reader sorts by timestamp, because a union merge shuffles lines", async () => {
  const { recentPublished } = await import("../src/engage.mjs");
  const { latestBy } = await import("../src/state.mjs");

  const shuffled = [
    { slug: "middle", mediaId: "2", at: "2026-07-29T10:00:00Z" },
    { slug: "oldest", mediaId: "1", at: "2026-07-27T10:00:00Z" },
    { slug: "newest", mediaId: "3", at: "2026-07-31T10:00:00Z" },
  ];
  assert.deepEqual(
    recentPublished(shuffled, 2).map((p) => p.slug), ["newest", "middle"],
    "the conversation opens under the newest Reel, wherever its line sits"
  );
  assert.equal(latestBy(shuffled).slug, "newest", "the silence alarm reads the same record the gap guard does");

  // The metrics reader keeps one row per media, and it must be the fresh one
  // even when the stale one was appended after it.
  const { readFile, writeFile, mkdir, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const nodePath = await import("node:path");
  const cwd = process.cwd();
  const tmp = await (await import("node:fs/promises")).mkdtemp(nodePath.join(os.tmpdir(), "oom-ledger-"));
  try {
    await mkdir(nodePath.join(tmp, "state"), { recursive: true });
    await writeFile(
      nodePath.join(tmp, "state", "metrics.jsonl"),
      [
        JSON.stringify({ mediaId: "A", at: "2026-07-31T12:00:00Z", reach: 900 }),
        JSON.stringify({ mediaId: "A", at: "2026-07-30T12:00:00Z", reach: 12 }),  // older, but appended later
        JSON.stringify({ mediaId: "B", at: "2026-07-31T09:00:00Z", reach: 40 }),
      ].join("\n") + "\n"
    );
    // insights resolves its paths from the module's own directory, so the test
    // reads the real ledger's shape through a copy of the function's logic is
    // not enough — point the module at the fixture by running it from there.
    const src = await readFile(nodePath.join(cwd, "src", "insights.mjs"), "utf8");
    await mkdir(nodePath.join(tmp, "src"), { recursive: true });
    await writeFile(nodePath.join(tmp, "src", "insights.mjs"), src);
    await writeFile(nodePath.join(tmp, "src", "state.mjs"), await readFile(nodePath.join(cwd, "src", "state.mjs"), "utf8"));
    const { latestPerPost } = await import(nodePath.join(tmp, "src", "insights.mjs"));
    const rows = await latestPerPost();
    const a = rows.find((r) => r.mediaId === "A");
    assert.equal(a.reach, 900, "the settled reading wins over the stale one appended after it");
    assert.deepEqual(rows.map((r) => r.mediaId), ["A", "B"], "and the list itself is newest first");
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// `state.mjs today` is the first thing a run reads, and for three days it was
// wrong about the only kind of post this account makes. `isReel` tested the slug
// for "-reel"; no slug this account has ever written contains it, so the report
// said `"reels": 0` right after publishing a Reel and counted that Reel as a
// carousel — on an account where the manual says carousels are retired. The
// permalink is the fact Instagram itself returns.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 2026-07-31, 15:33 UTC: Hasan hand-launched the day's run an hour before the
// scheduled one. The two would have been invisible to each other — the 16:36 run
// would have found no Reel recorded for the day, no gap violation, and no orphan
// on the account, because a build in progress has recorded nothing anywhere. It
// would have started a second build: two Reels in one day against a ceiling the
// manual calls hard, and neither run doing anything wrong.
//
// The flight recorder was already the signal. File mtimes cannot carry it (a
// fresh clone stamps every file with the checkout time), so liveness is read
// from the content: the date from the filename, the time from the line.
// ---------------------------------------------------------------------------
test("a run can tell that another run is still alive", async () => {
  const { runsInFlight } = await import("../src/state.mjs");
  const { writeFile, unlink } = await import("node:fs/promises");
  const stamp = (msAgo) => new Date(Date.now() - msAgo).toISOString();
  const day = (iso) => iso.slice(0, 10);
  const clock = (iso) => iso.slice(11, 19);

  const warm = stamp(4 * 60_000);
  const f = `reports/journal/${day(warm)}-t1h.md`;
  const cold = stamp(90 * 60_000);
  const g = `reports/journal/${day(cold)}-t2h.md`;
  await writeFile(f, `# fixture\n\n- ${clock(warm)} step 5: building\n`);
  await writeFile(g, `# fixture\n\n- ${clock(cold)} step 9: recorded\n`);
  try {
    const live = await runsInFlight();
    assert.ok(live.some((o) => o.journal === f), "a journal written four minutes ago is a run at work");
    assert.ok(!live.some((o) => o.journal === g), "one written ninety minutes ago is not");

    assert.ok(!(await runsInFlight({ mine: f })).some((o) => o.journal === f), "a run does not mistake its own recorder for somebody else's");
    assert.ok(!(await runsInFlight({ warmMinutes: 2 })).some((o) => o.journal === f), "the warm window is what decides, and it is a parameter");

    // A line dated in the future is bad data, not evidence of a run.
    const ahead = stamp(-60 * 60_000);
    const h = `reports/journal/${day(ahead)}-t3h.md`;
    await writeFile(h, `# fixture\n\n- ${clock(ahead)} step 0: skewed clock\n`);
    try {
      assert.ok(!(await runsInFlight()).some((o) => o.journal === h), "an hour in the future is skew, and skew is not a signal");
    } finally { await unlink(h); }

    // Both journal line shapes in the real files parse: with and without seconds.
    const m = stamp(3 * 60_000);
    const k = `reports/journal/${day(m)}-t4h.md`;
    await writeFile(k, `# fixture\n\n- ${clock(m).slice(0, 5)} step 1: no seconds on this one\n`);
    try {
      assert.ok((await runsInFlight()).some((o) => o.journal === k), "half the real lines carry HH:MM only");
    } finally { await unlink(k); }
  } finally {
    await unlink(f).catch(() => {});
    await unlink(g).catch(() => {});
  }
});

test("a Reel is recognised by what Instagram returned, not by its slug", async () => {
  const { isReel, REEL_EVERY_HOURS, CAROUSEL_EVERY_HOURS } = await import("../src/state.mjs");

  // The two records this account actually holds, verbatim in shape.
  assert.equal(
    isReel({ slug: "2026-07-27-microsoft-cyber-model", permalink: "https://www.instagram.com/p/DbT0CNwCdYu/" }),
    false, "a /p/ permalink is a feed post"
  );
  assert.equal(
    isReel({ slug: "2026-07-30-opus5-vending-cartels", permalink: "https://www.instagram.com/reel/DbaxRq1EuJN/", durationS: 50.16 }),
    true, "a /reel/ permalink is a Reel — and note the slug contains no '-reel', which is what the old test looked for"
  );
  assert.equal(isReel({ slug: "x", durationS: 60 }), true, "only a Reel record carries a probed duration");
  assert.equal(isReel({ slug: "2026-07-30-opus5-vending-cartels" }), false, "no permalink and no duration: not claimed as a Reel");
  assert.equal(isReel({}), false, "and an empty record claims nothing");

  assert.equal(REEL_EVERY_HOURS, 20, "the cadence the report measures is the Reel's now");
  assert.equal(CAROUSEL_EVERY_HOURS, REEL_EVERY_HOURS, "the retired name still resolves, so nothing outside breaks on the rename");
});

test("engagement helpers: only real published media, only real comments", async () => {
  const { recentPublished, commentTextIssues } = await import("../src/engage.mjs");
  const posted = [
    { slug: "a", mediaId: "1" },
    { slug: "b" },
    { slug: "c", mediaId: "3" },
  ];
  assert.deepEqual(recentPublished(posted).map((p) => p.slug), ["c", "a"], "no mediaId, no conversation surface; newest first");
  assert.ok(commentTextIssues("").includes("empty"));
  assert.ok(commentTextIssues("👍").length > 0, "an emoji nod is not a comment");
  assert.equal(commentTextIssues("Bonne question, la réponse est dans la source citée.").length, 0);
});

test("a sentence-opening The is not a name, and Microsoft still is", async () => {
  const { extractForbidNames } = await import("../src/reel2.mjs");
  const names = extractForbidNames({
    centralClaim: "The company said Microsoft's model found flaws in Redis. This beat Anthropic.",
    slides: [{ headline: "Send this to your team. Every score is Microsoft's own." }],
  });
  for (const noise of ["The", "This", "Send", "Every"]) assert.ok(!names.includes(noise), `"${noise}" must not be treated as a name`);
  for (const real of ["Microsoft", "Redis", "Anthropic"]) assert.ok(names.includes(real), `"${real}" must be caught`);
});

// The cap rose from 20 to 26 on 2026-07-31: it had started evicting measured
// facts. Two runs that week each learned something worth a future run's
// minutes and had to throw it away to stay under the ceiling, which is the
// notebook failing at the one job it has.
const NOTES_MAX = 26;

test("the notebook stays small, dated and below its own rules line", async () => {
  const { readFile } = await import("node:fs/promises");
  const text = await readFile(new URL("../prompts/notes.md", import.meta.url), "utf8");
  const entriesAt = text.indexOf("ENTRIES:");
  assert.ok(entriesAt > 0, "the ENTRIES line must exist — it is the border between constitution and notes");
  const entries = text.slice(entriesAt).split("\n").filter((l) => /^- /.test(l));
  assert.ok(entries.length <= NOTES_MAX, `${entries.length} entries — the cap is ${NOTES_MAX}; merge or delete before adding`);
  for (const e of entries) assert.ok(/^- \d{4}-\d{2}-\d{2} · /.test(e), `entry lacks a date: "${e.slice(0, 60)}"`);
  assert.ok(!/—/.test(text.slice(entriesAt)), "no em dashes, even here");
});

// Incident 2026-07-30: the 19:30 scout filed three strong candidates as
// `considered` because no second outlet had picked them up yet — hiding them
// from the next morning's scouts for 36 hours, by which time the corroboration
// they were waiting for had made them ordinary.
test("a story blocked on corroboration comes back in one news cycle, not two days", async () => {
  const { stillBlocks } = await import("../src/state.mjs");
  const now = Date.parse("2026-07-31T08:00:00Z");
  const at = (h) => new Date(now - h * 3600000).toISOString();

  assert.equal(stillBlocks({ at: at(8), outcome: "revisit" }, now), false, "a revisit story is visible again after 6h");
  assert.equal(stillBlocks({ at: at(2), outcome: "revisit" }, now), true, "and does not re-litigate inside the same cycle");
  assert.equal(stillBlocks({ at: at(8), outcome: "considered" }, now), true, "a considered story still waits out its 36h");
  assert.equal(stillBlocks({ at: at(40), outcome: "considered" }, now), false);
  assert.equal(stillBlocks({ at: at(999), outcome: "rejected" }, now), true, "rejected blocks forever, whatever the shelf life");
  assert.equal(stillBlocks({ at: at(999), outcome: "posted" }, now), true);
  assert.equal(stillBlocks({ at: "not a date", outcome: "revisit" }, now), true, "an unparseable date fails closed");
});

test("the latest record is found by timestamp, not by file position", async () => {
  const { latestBy } = await import("../src/state.mjs");
  const rows = [
    { at: "2026-07-28T09:12:00Z", slug: "middle" },
    { at: "2026-07-28T11:00:00Z", slug: "newest" },
    { at: "2026-07-27T20:00:00Z", slug: "oldest" },
  ];
  assert.equal(latestBy(rows).slug, "newest", "a union merge may reorder lines; the reader must not care");
  assert.equal(latestBy([]), null);
});

test("a grid wipe migrates fingerprints instead of erasing them", async () => {
  const { mkdtemp, writeFile: wf, readFile: rf } = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const { wipeGrid } = await import("../src/state.mjs");
  const dir = await mkdtemp(path.join(os.tmpdir(), "oom-wipe-"));
  await wf(path.join(dir, "posted.jsonl"), JSON.stringify({ at: "2026-07-28T09:12:00Z", slug: "s", title: "Claude chats on Google", url: "https://x.test/a" }) + "\n");
  await wf(path.join(dir, "metrics.jsonl"), "{}\n");
  const r = await wipeGrid({ dir });
  assert.equal(r.migrated, 1);
  assert.equal(await rf(path.join(dir, "posted.jsonl"), "utf8"), "", "posted.jsonl is emptied");
  assert.equal(await rf(path.join(dir, "metrics.jsonl"), "utf8"), "", "metrics.jsonl is emptied");
  const seen = (await rf(path.join(dir, "seen.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(seen[0].outcome, "published-deleted");
  assert.ok(seen[0].fingerprint && seen[0].tokens.length, "the anti-repeat identity survives the wipe");
});

/* 2026-07-31: a built Reel shipped the Action News 5 receipt with a black
   rectangle across it reading "DEMUXER_ERROR_NO_SUPPORTED_STREAMS /
   FFmpegDemuxer: no supported streams" — this Chromium has no proprietary
   codecs, so the outlet's embedded player renders as its own error message.
   The screenshot succeeded, the page was right, the crop was right, and only
   looking at the frame caught it. A receipt shows the headline, never the
   outlet's video player. */
test("the receipt's style block hides video players, not only ads", async () => {
  const { readFile: rf } = await import("node:fs/promises");
  const src = await rf(new URL("../src/reel2.mjs", import.meta.url), "utf8");
  const style = src.match(/await page\.addStyleTag\(\{[\s\S]*?\}\)/);
  assert.ok(style, "screenshotOnce still injects a style tag");
  assert.match(style[0], /(^|[,'"\s])video\b/, "bare <video> is hidden in the receipt");
  assert.match(style[0], /adsbygoogle/, "and the ad rules are still there");
  // CSS alone was not enough: Action News 5 mounts its player inside a shadow
  // root, which an injected stylesheet does not cross, so the slab survived a
  // rebuild made specifically to remove it. The nodes have to be deleted.
  assert.match(src, /shadowRoot\.querySelector\("video,audio"\)/, "shadow-root players are removed, not just styled");
});

/* 2026-07-31 (16h scout): a Digital Trends sentence copied character for
   character out of the live page came back NOT_FOUND. The page writes
   `Samsung&rsquo;s`, and flatten() decoded numeric entities but not named
   ones, so the flattened page read "samsung&rsquo;s" while the quote read
   "samsung's". The gate was calling a real quote invented, which is the one
   direction of error nobody double-checks. */
test("flatten decodes named and hex entities, not only numeric ones", async () => {
  const { flatten } = await import("../src/validate.mjs");
  const page = "<p>Higher chip prices delivered record profits for Samsung&rsquo;s semiconductor business.</p>";
  assert.match(flatten(page), /samsung's semiconductor business/, "&rsquo; becomes a plain apostrophe");
  assert.match(flatten("<p>the &ldquo;RAMaggedon&rdquo; is here</p>"), /the "ramaggedon" is here/);
  assert.match(flatten("<p>Samsung&#x2019;s call</p>"), /samsung's call/, "hex entities decode too");
  assert.match(flatten("<p>2027 &mdash; 2028</p>"), /2027 - 2028/, "&mdash; normalises like a literal em dash");
  assert.match(flatten("<p>&unknownentity; stays</p>"), /&unknownentity; stays/, "an unknown entity is left alone rather than mangled");
  // The account writes French and its sources spell café and Pokémon with
  // entities. Missing those is the same failure as &rsquo; wearing other letters.
  assert.match(flatten("<p>un caf&eacute; &agrave; Paris</p>"), /un café à paris/, "accented named entities decode");
  assert.match(flatten("<p>90&deg;C et 2&nbsp;000&euro;</p>"), /90°c et 2 000€/, "so do the ones a newsroom puts next to figures");
});

/* 2026-07-31 (15:35 publish run): TechCrunch sets nitrogen oxides as
   `NO<sub>x</sub>`. Every tag became a space, so the flattened page read "no x"
   while the quote read "nox", and the gate answered NOT_FOUND on a sentence that
   was on the page word for word. The run lost a gate round and then rewrote the
   beat — "polluants qui forment le smog" instead of the term the source uses —
   to route around a bug in the gate. Verified against the live article: it does
   contain the literal string NO<sub>x</sub>. */
test("a word split by inline markup is still the word the source printed", async () => {
  const { flatten } = await import("../src/validate.mjs");

  assert.match(flatten("<p>more than 2,000 tons of smog-forming NO<sub>x</sub> per year</p>"), /smog-forming nox per year/,
    "the exact sentence that cost the 31 July run a gate round and a beat rewrite");
  assert.match(flatten("<p>CO<sub>2</sub> and m<sup>3</sup></p>"), /co2 and m3/, "subscripts and superscripts both");
  assert.match(flatten('<p>a <a href="/x">link</a>ed word</p>'), /a linked word/, "an anchor inside a word does not split it");
  assert.match(flatten('<p><span class="x">69</span> turbines</p>'), /69 turbines/, "a span carrying a figure keeps it whole");

  // And the space must survive where it means something, or every paragraph
  // boundary would weld two sentences into one unmatchable string.
  assert.match(flatten("<p>Une phrase.</p><p>Une autre.</p>"), /une phrase\. une autre\./, "block elements still separate");
  assert.match(flatten("<li>un</li><li>deux</li>"), /un deux/, "so do list items");
  assert.match(flatten("ligne un<br>ligne deux"), /ligne un ligne deux/, "and line breaks");
});

/* The 16:30 run read "do not compute the word window yourself" in bold, then
   computed it: it filtered the voice ledger on a field name that does not exist,
   got zero samples, silently fell back to the default rate, and trimmed a script
   that had gated green from 199 words to 189 — against a real floor of 194. The
   answer to an instruction a run goes around is not a louder instruction, it is
   one command that is shorter than the snippet. Its numbers must be the gate's
   own, from the same reader, or it would be a fourth place for them to drift. */
test("the window a run can ask for is the window the gate enforces", async () => {
  const { voiceSamples } = await import("../src/validate.mjs");
  const { wordWindow, medianRate, RATE_SAMPLES_MIN, DEFAULT_RATE } = await import("../src/format.mjs");

  const samples = voiceSamples("Sadaltager");
  assert.ok(Array.isArray(samples), "the ledger reader is exported so the CLI and the gate share it");
  assert.ok(samples.length <= 12, "and it is the recent readings, not the whole history");

  // The floor lives in format.mjs and nowhere else. It was hardcoded as 3 in
  // validate.mjs while format.mjs also said 3; the two agreed by luck, and the
  // day the floor moved to 4 the gate would have sized scripts from a sample its
  // own module considers too small.
  assert.equal(medianRate(Array.from({ length: RATE_SAMPLES_MIN - 1 }, () => ({ words: 180, seconds: 60 }))), DEFAULT_RATE);
  assert.equal(medianRate(Array.from({ length: RATE_SAMPLES_MIN }, () => ({ words: 180, seconds: 60 }))), 3);

  const w = wordWindow(3.71);
  assert.ok(w.min < w.target && w.target < w.max, "the window brackets its own target");
});

/* The 31 July publish run built its Reel five times: Chromium died mid-
   screenshot, a photograph turned out to be a derelict building, and a broken
   video player on a receipt took two more attempts to remove. The script stopped
   changing after the second build. Each rebuild bought two or three fresh
   narrations anyway — eleven in all, six refused for tempo — and ran Whisper
   over every one. Most of the run's narration spend, and minutes of its wall
   clock, went on hearing the same words again because a picture was wrong.

   The reading is now keyed on everything that decides how it sounds. Verified
   end to end: a fully-pinned build with GEMINI_API_KEY unset completes and
   prints COMPLIANT 60.0s off the cached reading, and the same build with one
   word changed in one beat stops on the missing key instead of reusing it. */
test("a narration is reused only for the exact words it says", async () => {
  const { voiceCacheKey } = await import("../src/reel2.mjs");
  const narration = "Première phrase du script.\n\nDeuxième phrase.";
  const base = { narration, voice: "Sadaltager", lang: "fr", style: "DEBIT RAPIDE" };
  const key = voiceCacheKey(base);

  assert.equal(voiceCacheKey({ ...base }), key, "the same input is the same reading");
  for (const [why, change] of [
    ["a word changed", { narration: narration.replace("Deuxième", "Troisième") }],
    ["an accent dropped", { narration: narration.replace("Première", "Premiere") }],
    ["a comma added", { narration: narration.replace("script.", "script,") }],
    ["trailing whitespace", { narration: `${narration} ` }],
    ["another voice", { voice: "Charon" }],
    ["another language", { lang: "en" }],
    ["a different direction", { style: "DEBIT RAPIDE " }],
  ]) {
    assert.notEqual(voiceCacheKey({ ...base, ...change }), key, `${why} must buy a new reading, never reuse the old one`);
  }
  assert.match(key, /^[0-9a-f]{16}$/);
});

/* 2026-07-31, both runs, independently: each wrote its entire first draft —
   narration, caption, every script — with the French accents stripped.
   "penurie", "memoire", "telephone". Both caught it by re-reading and both said
   in their report that nothing in the pipeline would have. They were right: it
   gates green, and then the voice reads "retire" for "retiré" through a whole
   Reel on an account whose promise is that a human checked it.

   Thresholds are measured, not chosen: this account's own published French runs
   3.8-4.0% accented letters and a stripped draft runs 0.00%. */
test("French that has lost its accents is refused before the voice reads it", async () => {
  const { frenchAccentIssues, accentDensity } = await import("../src/validate.mjs");
  const real =
    "SpaceX annonce le retrait des 69 turbines à gaz sans permis qui alimentent Colossus, " +
    "ses centres de données près de Memphis. Les turbines resteront installées jusqu'en 2027, " +
    "et la société précise que la qualité de l'air reste conforme aux normes fédérales américaines. " +
    "Le problème n'est pas réglé pour autant : le développement du site dépend d'une énergie qu'il " +
    "produit lui-même, année après année.";
  const strip = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

  assert.ok(accentDensity(real).per100 > 3, "the fixture really is normal French");
  assert.deepEqual(frenchAccentIssues(real), [], "real French raises nothing");

  const stripped = frenchAccentIssues(strip(real));
  assert.ok(stripped.some((i) => /carry an accent/.test(i)), "a fully stripped draft fails on density");
  assert.ok(stripped.some((i) => /unaccented French/.test(i)), "and on words that are not French without their accents");

  // Half-stripped sits above the density floor, so only the word list can see it.
  const half = real.replace(/é/g, (m, i) => (i % 2 ? "e" : m));
  assert.ok(accentDensity(half).per100 > 1, "half-stripped clears the density floor");
  assert.ok(frenchAccentIssues(half).some((i) => /unaccented French/.test(i)), "the word list catches what density cannot");

  // What must never fire: a short line legitimately without accents. The hook
  // card "xAI fait tourner 69 turbines sans permis" carries none at all.
  assert.deepEqual(frenchAccentIssues("xAI fait tourner 69 turbines sans permis", { min: Infinity }), [],
    "a short accent-free hook is not a defect");
  assert.deepEqual(frenchAccentIssues("Samsung dit que la pause va durer", { min: Infinity }), []);

  // And words that ARE French without an accent must not be on the list.
  for (const ok of ["il retire les turbines", "le marche public", "les derniers jours", "ou bien"])
    assert.deepEqual(frenchAccentIssues(ok, { min: Infinity }), [], `"${ok}" is correct French and must not be flagged`);
});

/* Same run, same gate round: the caption credits its sources by domain, and one
   was actionnews5.com. The gate extracted "5", found no evidence quote carrying
   a 5, and refused the post for a figure nobody had claimed. The run then added
   a quote containing "Action News 5" purely to satisfy the arithmetic. Local
   American television is numbered by convention, so this was never a one-off. */
test("digits inside a hostname are spelling, not evidence", async () => {
  const p = goodPost();
  p.caption = `${p.caption}\n\nSources : techcrunch.com, actionnews5.com, selc.org`;
  const e = await errs(p);
  assert.ok(!hasErr(e, /caption figure/), "a numbered domain is not a claim the post has to source");

  // What must still be caught: a real figure in the same caption.
  const q = goodPost();
  q.caption = `${q.caption}\n\nCela concerne 4173 personnes. Sources : actionnews5.com`;
  assert.ok(hasErr(await errs(q), /4173/), "a bare figure beside a domain is still a claim");
});
