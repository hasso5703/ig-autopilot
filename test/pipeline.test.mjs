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
test("every slide needs a picture", async () => {
  const p = goodPost();
  delete p.slides[1].image;
  assert.ok(hasErr(await errs(p), /slide 2 \(stat\) image: missing/));
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

test("promptcraft: the mood decides the light, and the refusals refuse", async () => {
  const { veoPrompt, imagePrompt, promptIssues, MOODS } = await import("../src/promptcraft.mjs");
  const p = veoPrompt({ subject: "a person", action: "typing", setting: "in a dark office", mood: "tension" });
  assert.ok(p.includes(MOODS.tension.light), "the mood's light phrase reaches the prompt");
  assert.ok(/No readable text/.test(p), "the no-text rule is always present");
  assert.ok(/No speech, no dialogue/.test(p), "Veo must not talk under the narration");
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
  assert.equal(low.length, 1, "the screenshot beat's caption sits in the low band");
  assert.equal((low[0].match(/\\k\d+/g) || []).length, 5, "the orphan 'chats.' rejoined its four-word sentence");
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
    assert.ok(textLen <= 24, `karaoke line wider than the K style's frame budget: ${textLen} chars`);
  }
});

const goodReel2 = () => ({
  voice: "Charon", mood: "tension", lang: "fr",
  title: "70 personnes pour apprendre à couper l'IA",
  beats: [
    { script: "Des bibliothèques américaines apprennent maintenant à couper l'IA.", visual: { type: "veo", spec: { subject: "a librarian's hands", action: "closing a laptop", setting: "in a small-town library" } } },
    { script: "70 personnes sont venues à un seul cours.", visual: { type: "screenshot", url: "https://techcrunch.com/a" } },
    { script: "Et la demande ne vient pas de qui vous croyez.", visual: { type: "image", spec: { subject: "a dim reading room", setting: "in a public library" } } },
    { script: "Envoie ça à quelqu'un qui subit les popups IA.", visual: { type: "image", spec: { subject: "a phone face down", setting: "on a wooden table" } } },
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

  p.reel2.beats = p.reel2.beats.slice(0, 3);
  assert.ok(hasErr(await errs(p), /the 60-second spine is 4 to 7/));
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
});

test("reel2: the last beat must name who to send it to", async () => {
  const p = goodPost();
  p.reel2 = goodReel2();
  p.reel2.beats.at(-1).script = "Voilà pour aujourd'hui.";
  assert.ok(hasErr(await errs(p), /last beat asks for nothing/));
  p.reel2.beats.at(-1).script = "Préviens un ami qui partage ses chats IA.";
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
  assert.ok(/Style: TITLE,Anton/.test(ass), "the title style uses the display face");
  assert.ok(/Dialogue: 1,0:00:00\.00,[^,]+,TITLE,.*GOOGLE EXPOSAIT VOS CHATS CLAUDE/.test(ass), "the full hook is burned from frame zero, upper-cased");
  assert.ok(/Dialogue: 1,0:00:40\.00,0:00:43\.00,ENDBIG,.*UNE ACTU IA PAR JOUR\./.test(ass), "the end-card prints the serial promise");
  assert.ok(/Dialogue: 1,0:00:40\.00,0:00:43\.00,ENDFOLLOW,.*ABONNE-TOI POUR LA SUIVANTE/.test(ass), "the end-card asks for the follow");
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

  const mk = (script) => ({ script, visual: { type: "image", spec: { subject: "a dim room", setting: "at night" } } });
  p.reel2 = goodReel2();
  p.reel2.beats = [
    p.reel2.beats[0],
    mk("Une salle sombre, encore."),
    mk("Une autre salle sombre."),
    mk("Toujours une salle sombre."),
    { script: "Envoie ça à un ami.", visual: { type: "image", spec: { subject: "a phone face down", setting: "on a table" } } },
  ];
  assert.ok(hasErr(await errs(p), /ceiling is 3/), "four generated stills read as wallpaper");
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

test("the notebook stays small, dated and below its own rules line", async () => {
  const { readFile } = await import("node:fs/promises");
  const text = await readFile(new URL("../prompts/notes.md", import.meta.url), "utf8");
  const entriesAt = text.indexOf("ENTRIES:");
  assert.ok(entriesAt > 0, "the ENTRIES line must exist — it is the border between constitution and notes");
  const entries = text.slice(entriesAt).split("\n").filter((l) => /^- /.test(l));
  assert.ok(entries.length <= 20, `${entries.length} entries — the cap is 20; merge or delete before adding`);
  for (const e of entries) assert.ok(/^- \d{4}-\d{2}-\d{2} · /.test(e), `entry lacks a date: "${e.slice(0, 60)}"`);
  assert.ok(!/—/.test(text.slice(entriesAt)), "no em dashes, even here");
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
