/**
 * The second Reel engine. The voice leads, the screen follows.
 *
 * The first engine painted the carousel's slides one frame at a time and the
 * measured result was six seconds of average watch time on a thirty-three
 * second video: a reading surface shown to people who came to watch. This one
 * is built the other way round, from what the finished thing must be — a
 * spoken story over moving pictures, cut every few seconds, captioned word by
 * word for the 85% who watch on mute.
 *
 * The spine of a post is `reel2` in the post JSON:
 *
 *   "reel2": {
 *     "voice": "Charon",
 *     "mood": "tension",
 *     "lang": "fr",
 *     "title": "5 à 8 mots, la carte affichée frame 0",
 *     "beats": [
 *       { "script": "…", "visual": { "type": "veo",        "spec": { subject, action, setting, … } } },
 *       { "script": "…", "visual": { "type": "screenshot", "url": "https://…" } },
 *       { "script": "…", "visual": { "type": "image",      "spec": { subject, setting, … } } },
 *       { "script": "…", "visual": { "type": "file",       "file": "media/<slug>/x.mp4|.png" } }
 *     ]
 *   }
 *
 * Every script sentence is held to the same evidence standard as a slide —
 * the gate checks the words, this file only performs them. Money: one Veo clip
 * per Reel by default (the hook), stills for the rest, and every purchase is
 * priced by genmedia into state/spend.jsonl.
 *
 * The narration is timed by forced alignment, not estimated: Whisper hears the
 * finished voice track and reports when each word is said, and beat boundaries
 * and karaoke timing both come from that. Whisper also mishears — it wrote
 * "cloud" for "Claude" on the first run — so its transcription is thrown away
 * and only its clock is kept, mapped positionally onto the words we actually
 * wrote.
 */

import { readFile, writeFile, appendFile, mkdir, access } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import { ffmpeg, ffprobe } from "./ffmpeg.mjs";
import { tts, genVideo, genImage, journal } from "./genmedia.mjs";
import { veoPrompt, imagePrompt, promptIssues, MOODS } from "./promptcraft.mjs";
import { loadPlaywright, chromiumExecutable } from "./browser.mjs";
import { acquireOne, creditLine } from "./imagery.mjs";
import {
  TARGET_S, END_S, TAIL_S, SPEECH_S, TEMPO_MIN, TEMPO_MAX, RAW_MAX_S,
  BEATS_MIN, BEATS_MAX, TTS_TRIES, medianRate, wordWindow,
} from "./format.mjs";

const run = promisify(execFile);

const W = 1080, H = 1920, FPS = 25;

/* ---------------------------- the 60-second contract ----------------------
 * The série is "L'actu IA en 60 secondes" and the bio promises one every day.
 * Until 2026-07-31 that was a hope, not a contract: the engine only refused a
 * file *over* 62 seconds, so the four Reels the account had actually shipped
 * ran 47 to 51 seconds and every one of them was declared COMPLIANT. A promise
 * printed in the bio and broken by every artefact is worse than no promise.
 *
 * So the duration is now built, not measured. The video is exactly TARGET_S
 * long by construction: the last visual beat runs until the end-card starts,
 * the end-card is fixed, and the final mux is cut to TARGET_S. What varies —
 * how long the voice actually took to say the words — is absorbed *before* the
 * clock is read, by time-stretching the narration onto SPEECH_S with atempo.
 *
 * atempo preserves pitch, and the correction it has to make is small because
 * the gate holds the copy to a word window derived from the account's own
 * measured speaking rate. A few percent is inaudible; past TEMPO_MAX it would
 * start to sound rushed, so instead of stretching further the engine refuses
 * and says how many words to write. The word window and this clamp are the
 * same rule seen from two ends, and `state/voice-rate.jsonl` is what keeps
 * them honest as the voice or its direction changes.
 */
/** A still that holds longer than this is re-framed rather than left sitting:
 * "change something every two to three seconds" is the manual's rule and a
 * 60-second Reel has longer beats than a 50-second one had. The re-frame is a
 * second encode of the same picture, so it costs ffmpeg time and no money. */
const REFRAME_S = 5.2;
const BG_HEX = "0x08080C"; // brand.colors.bg
const FONT_DIR = path.join(process.cwd(), "brand", "fonts");
const HANDLE = "@ORDER.OF.MAGNITUDE";
// The end-card is fixed text, not per-post copy: the ritual is the point.
// "Pour la suivante" is the serialization ask — the viewer closes the loop.
const END_PROMISE = "UNE ACTU IA PAR JOUR.";
const END_FOLLOW = "ABONNE-TOI POUR LA SUIVANTE";

/* ------------------------- the voice's own rate --------------------------- */

/**
 * Every narration the account has ever bought, as words over raw seconds.
 *
 * This is the loop that lets the format hold itself together without anyone
 * tuning it: the gate derives the word window from the median of these
 * readings, so if the voice, its direction or the language changes pace, the
 * window follows within three Reels instead of waiting for a human to notice
 * that scripts have started failing. Written before any correction — see the
 * warning in the build.
 */
const RATE_LEDGER = path.join(process.cwd(), "state", "voice-rate.jsonl");

async function recordVoiceRate(entry) {
  try {
    await mkdir(path.dirname(RATE_LEDGER), { recursive: true });
    await appendFile(RATE_LEDGER, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
  } catch (err) {
    // A missing rate reading costs the next run a little calibration; it must
    // never cost this run its Reel.
    console.log(`note: could not record the voice rate (${err.message})`);
  }
}

export async function voiceRateSamples() {
  try {
    return (await readFile(RATE_LEDGER, "utf8"))
      .split("\n").filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch { return []; }
}

/* ------------------------- whisper, once per machine ---------------------- */

const VENV = path.join(os.homedir(), ".cache", "oom-whisper");

async function ensureWhisper() {
  const py = path.join(VENV, "bin", "python");
  try { await access(py); return py; } catch { /* build it */ }
  console.log("bootstrapping whisper venv (first run on this machine, ~2 min)…");
  await run("python3", ["-m", "venv", VENV]);
  await run(path.join(VENV, "bin", "pip"), ["-q", "install", "faster-whisper"], { timeout: 300_000 });
  return py;
}

/** Whisper's French tokenizer splits elisions and hyphenations into
 * continuation tokens: "l'IA" arrives as "l" + "'IA", "lui-même" as
 * "lui" + "-même". Each pair is one spoken word on one clock, so a French
 * narration read perfectly still failed the word-count check (165 heard for
 * a 151-word script, measured twice on 2026-07-29). Merge a token that
 * begins with an apostrophe or a hyphen back into its predecessor, keeping
 * the predecessor's start and the continuation's end.
 *
 * A digit following a word ("Opus 5") sometimes comes back as "Opus" +
 * "-5" — Whisper's way of writing the numeral, not a hyphenated compound —
 * and merging it swallows a real script word every time a name is followed
 * by a number (measured on "Opus 5" spoken twice, 2026-07-30: heard count
 * undershot by 2 for exactly this reason). A hyphen continuation that is
 * pure digits is kept as its own token instead. */
export function mergeContinuations(words) {
  const out = [];
  for (const w of words) {
    const prev = out.at(-1);
    if (prev && /^-\d/.test(w.w)) { out.push({ ...w, w: w.w.slice(1) }); }
    else if (prev && /^['’-]/.test(w.w)) { prev.w += w.w; prev.e = w.e; }
    else out.push({ ...w });
  }
  return out;
}

/** Word clock from the voice track. Transcribed words are replaced by ours.
 * The account speaks French since 2026-07-29; the multilingual "base" model
 * hears it, and the language is forced so a short clip cannot be misdetected.
 * English is kept for fixtures and for any deliberate English post. */
async function alignWords(voiceWav, scriptWords, workDir, lang = "fr") {
  const py = await ensureWhisper();
  /* `base` was heard on 2026-07-31 against the day's real French narration and
     it sits on the edge of the guard below: 192 words heard for a 188-word
     script, when the tolerance is 4. It writes "Entropique" for Anthropic and
     "pitons" for Python, and each mishearing is a chance to split or merge a
     token and kill a Reel that has already been paid for. `large-v3-turbo`,
     int8-quantised, heard 189 — one off — and got both names right.

     It costs about 70 seconds more per build on a 20-core machine and a 1.6 GB
     download on a cold container. That is the correct trade: the transcription
     itself is thrown away, but the count is what fails a build and the word
     boundaries are what the beat cuts and the karaoke are made of. Greedy
     decoding (beam_size 1) is used deliberately — nothing downstream reads the
     text, so paying for a beam search over wording buys nothing. */
  const model = lang === "en" ? "base.en" : "large-v3-turbo";
  const script = `
from faster_whisper import WhisperModel
import json, sys, os
m = WhisperModel("${model}", device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
segs, _ = m.transcribe(sys.argv[1], word_timestamps=True, language="${lang}", beam_size=1, condition_on_previous_text=False)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(words, open(sys.argv[2], "w"))
print(len(words))
`;
  const scriptFile = path.join(workDir, "align.py");
  const wordsFile = path.join(workDir, "words.json");
  await writeFile(scriptFile, script);
  await run(py, [scriptFile, voiceWav, wordsFile], { timeout: 240_000 });
  const heard = mergeContinuations(JSON.parse(await readFile(wordsFile, "utf8")));
  // The tolerance was a flat 2 words when a script was ~150 words long. At the
  // 60-second format's ~180 it is scaled, because the chance of one honest
  // mishearing grows with the length of the reading and a single token must not
  // cost a built Reel. It stays tight enough that a whole dropped sentence
  // still fails, which is what the guard is for.
  const slack = Math.max(2, Math.ceil(scriptWords.length / 60));
  if (Math.abs(heard.length - scriptWords.length) > slack) {
    throw new Error(
      `alignment heard ${heard.length} words for a ${scriptWords.length}-word script — ` +
        "the voice said something the script does not, listen to voice.wav before publishing"
    );
  }
  // Positional mapping: our words, whisper's clock. Off-by-a-couple is spread
  // proportionally rather than guessed at.
  const n = Math.min(heard.length, scriptWords.length);
  const out = [];
  for (let i = 0; i < scriptWords.length; i++) {
    const src = heard[Math.min(i, n - 1)];
    out.push({ w: scriptWords[i], s: src.s, e: src.e });
  }
  return out;
}

/* ------------------------------ the beats -------------------------------- */

function beatWordRanges(beats) {
  const ranges = [];
  let start = 0;
  for (const b of beats) {
    const count = b.script.trim().split(/\s+/).length;
    ranges.push({ start, end: start + count - 1 });
    start += count;
  }
  return ranges;
}

/* ---------------------------- ASS karaoke -------------------------------- */

/** ASS wants &HAABBGGRR. We keep hex as RRGGBB everywhere humans read it. */
export function hexToAss(rrggbb) {
  const m = /^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(rrggbb);
  if (!m) throw new Error(`bad hex colour ${rrggbb}`);
  return `&H00${m[3]}${m[2]}${m[1]}`.toUpperCase();
}

function assTime(t) {
  return `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, "0")}:${(t % 60).toFixed(2).padStart(5, "0")}`;
}

/**
 * Chunks of at most four words, broken at punctuation, upper-cased, one
 * Dialogue per chunk with per-word \k so the spoken word is the accent-
 * coloured one. Screenshot beats push their captions to the low band so type
 * never sits on the article it is quoting — that collision shipped once in
 * the prototype and was caught by looking, which is the only way it can be.
 *
 * Two fixed layers ride above the karaoke, and both exist because of measured
 * behaviour, not taste:
 *
 * - `opts.title` — the hook card. The full hook, fully formed on frame zero,
 *   in the display face, gone by ~3.2s. The karaoke reveals the spoken line
 *   word by word, which means that without this card the first frame of the
 *   Reel — the whole audition, and the grid thumbnail — carried three words
 *   of a sixteen-word sentence. Stacked hooks (card states the claim, voice
 *   opens the story, picture sets the scene) hold measurably more viewers
 *   through the first seconds than any single layer does.
 * - `opts.endcard {from, dur}` — the close. The engine appends a brand-dark
 *   card after the last spoken word and prints the fixed serial promise and
 *   the follow ask on it. Fixed on purpose: the ritual close is the account's
 *   signature, the voice never has to spend runtime on it, and the last frame
 *   finally asks for the one thing a viewer can do for a new account.
 */
/** The widest line each karaoke style renders inside the safe margins.
 * Measured on 2026-07-29 for K (86px, 60px margins): 23-char lines fit with
 * room, a 32-char line lost a glyph at each edge, so ~40px per uppercase
 * char. KLOW (62px, 30px margins) gets the same px-per-em budget: 1020px /
 * (0.465em × 62px) ≈ 35 chars. */
const KARAOKE_MAX_CHARS = 24;
const KARAOKE_MAX_CHARS_LOW = 35;

/** Uppercase Anton runs about 0.47em wide, so the frame's 952 usable pixels
 * hold roughly `952 / (0.47 * size)` characters on a line. The hook card is
 * allowed two lines and no more: three lines of display type is a poster, not
 * an audition frame. Sizes step down rather than scaling continuously so the
 * card keeps a recognisable weight from Reel to Reel. */
export function titleFontSize(title) {
  const len = String(title || "").length;
  const fits = (size) => len <= Math.floor((952 / (0.47 * size)) * 2);
  for (const size of [116, 104, 92, 82]) if (fits(size)) return size;
  return 74;
}

export function buildAss(words, beats, ranges, accentHex, opts = {}) {
  const accent = hexToAss(accentHex);
  const titleSize = titleFontSize(opts.title);
  const lowBeats = new Set(ranges.filter((_, i) => beats[i].visual?.type === "screenshot").flatMap((r) => {
    const list = [];
    for (let i = r.start; i <= r.end; i++) list.push(i);
    return list;
  }));
  const head = [
    "[Script Info]", `PlayResX: ${W}`, `PlayResY: ${H}`, "WrapStyle: 2", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: K,Archivo SemiBold,86,${accent},&H00FFFFFF,&H00101010,&H96000000,-1,0,0,0,100,100,1,0,1,7,3,2,60,60,600,1`,
    `Style: KLOW,Archivo SemiBold,62,${accent},&H00FFFFFF,&H00101010,&H96000000,-1,0,0,0,100,100,1,0,1,7,3,2,30,30,170,1`,
    // BorderStyle 3 is an opaque box, not an outline, and it is the fix for the
    // worst frame this engine ever produced. On 2026-07-31 the hook card
    // "CLAUDE A PIÉGÉ 15 MACHINES BIEN RÉELLES" was set at 116px over a receipt
    // beat: the first line ran off both edges of the frame and the second landed
    // exactly on the article's own headline, so the audition frame — the one
    // that is also the grid thumbnail — showed two unreadable sentences on top
    // of each other. The gate passed it (38 characters, under its 64 ceiling),
    // the engine called the file COMPLIANT, and only looking at the frame found
    // it. A box means the card is legible over anything; the size below means it
    // fits inside the margins.
    `Style: TITLE,Anton,${titleSize},&H00FFFFFF,&H00FFFFFF,&H00101010,&HB4000000,0,0,0,0,100,100,0,0,3,18,0,8,64,64,300,1`,
    `Style: ENDBIG,Anton,100,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,0,0,0,0,100,100,0,0,1,3,2,5,80,80,0,1`,
    `Style: ENDFOLLOW,Archivo SemiBold,58,${accent},&H00FFFFFF,&H00101010,&H96000000,-1,0,0,0,100,100,1,0,1,3,2,5,80,80,0,1`,
    "", "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const fixed = [];
  if (opts.title) {
    const tEnd = Math.min(3.2, Math.max(2.2, words[0] ? (ranges[0] ? words[Math.min(ranges[0].end, words.length - 1)].e : 3.2) : 3.2));
    const text = String(opts.title).toUpperCase().replace(/\\/g, "").replace(/[{}]/g, "");
    fixed.push(`Dialogue: 1,${assTime(0)},${assTime(tEnd)},TITLE,,0,0,0,,{\\q1\\fad(0,220)}${text}`);
  }
  if (opts.endcard) {
    const { from, dur } = opts.endcard;
    const t0 = assTime(from), t1 = assTime(from + dur);
    fixed.push(`Dialogue: 1,${t0},${t1},ENDBIG,,0,0,0,,{\\q1\\fad(160,0)\\pos(${W / 2},${Math.round(H * 0.42)})}${END_PROMISE}`);
    fixed.push(`Dialogue: 1,${t0},${t1},ENDFOLLOW,,0,0,0,,{\\q1\\fad(160,0)\\pos(${W / 2},${Math.round(H * 0.54)})}${END_FOLLOW}`);
  }
  // WrapStyle 2 never wraps, so a chunk wider than the frame walks off both
  // edges: "OPENAI A SUSPENDU L'ENTRAÎNEMENT" (32 chars) shipped-almost on
  // 2026-07-29 reading "PENAI … ENTRAÎNEMEN". At the K style's size the frame
  // holds about 24 characters, so the chunker caps characters as well as words.
  const chunkChars = (ch) => ch.map((x) => x.word.w).join(" ").length;
  const capFor = (i) => (lowBeats.has(i) ? KARAOKE_MAX_CHARS_LOW : KARAOKE_MAX_CHARS);
  const chunks = [];
  let chunk = [];
  words.forEach((word, i) => {
    if (chunk.length && chunkChars(chunk) + 1 + word.w.length > capFor(chunk[0].i)) { chunks.push(chunk); chunk = []; }
    chunk.push({ word, i });
    if (chunk.length >= 4 || /[,.]$/.test(word.w)) { chunks.push(chunk); chunk = []; }
  });
  if (chunk.length) chunks.push(chunk);
  // A lone word makes a caption that flickers; give it back to its sentence —
  // unless the reunion itself would overflow the line.
  for (let i = chunks.length - 1; i > 0; i--) {
    if (chunks[i].length === 1 && chunks[i - 1].length < 5 &&
        chunkChars(chunks[i - 1]) + 1 + chunkChars(chunks[i]) <= capFor(chunks[i - 1][0].i)) {
      chunks[i - 1].push(...chunks[i]);
      chunks.splice(i, 1);
    }
  }
  const events = chunks.map((ch) => {
    const style = lowBeats.has(ch[0].i) ? "KLOW" : "K";
    const parts = ch.map(({ word }) => {
      const cs = Math.max(4, Math.round((word.e - word.s) * 100));
      return `{\\k${cs}}` + word.w.toUpperCase().replace(/[,.]/g, "");
    });
    return `Dialogue: 0,${assTime(ch[0].word.s)},${assTime(ch.at(-1).word.e + 0.06)},${style},,0,0,0,,${parts.join(" ")}`;
  });
  return head.concat(events).concat(fixed).join("\n");
}

/* ------------------------------ visuals ---------------------------------- */

async function screenshot(url, outFile) {
  const { chromium } = await loadPlaywright();
  const executablePath = await chromiumExecutable();
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ executablePath, proxy, args: ["--disable-blink-features=AutomationControlled"] });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      locale: "en-US",
    });
    // The egress proxy resets Chromium's TLS handshakes (any site, any TLS
    // version, ECH and post-quantum off — measured 2026-07-28), while
    // Playwright's Node-side fetch through the same proxy is fine. So the
    // browser renders and Node does all the fetching.
    await ctx.route("**/*", async (route) => {
      try { await route.fulfill({ response: await route.fetch() }); }
      catch { try { await route.abort(); } catch { /* page may be gone */ } }
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2500);
    for (const sel of ['button:has-text("Accept")', 'button:has-text("AGREE")', ".fc-cta-consent"]) {
      try { await page.locator(sel).first().click({ timeout: 1200 }); } catch { /* no banner is the good case */ }
    }
    // The receipt is the page's journalism, not its ad inventory: a Norton
    // banner shipped inside the TechCrunch receipt on the first live Reel.
    // Heuristic and best-effort — a hidden ad leaves a gap, which reads fine.
    await page.addStyleTag({
      content:
        '[id*="google_ads"],[id^="ad-"],[class*="advert"],[class^="ad-"],[class*=" ad-"],' +
        'ins.adsbygoogle,iframe[src*="ads"],iframe[src*="doubleclick"],[data-ad],[data-ad-unit],' +
        '[id*="taboola"],[class*="outbrain"],[class*="sponsor"],[id*="sponsor"],' +
        '[aria-label*="advertisement" i]{display:none!important;visibility:hidden!important}',
    }).catch(() => {});
    // The receipt is the headline, and the top of an article page is not where
    // the headline lives: the first live Reel's card framed the site chrome, a
    // display ad and a decorative photo, with the headline below the crop.
    // Scroll the h1 to the top of the viewport (minus a little context) so the
    // crop that follows starts on the journalism.
    await page.evaluate(() => {
      const h = document.querySelector("article h1") || document.querySelector("h1");
      if (h) {
        h.scrollIntoView({ block: "start" });
        window.scrollBy(0, -96);
      }
    }).catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: outFile });
  } finally {
    await browser.close();
  }
  return outFile;
}

/**
 * The Ken-Burns filter chain for one still, in one of two framings.
 *
 * `variant 0` is the wide, centred drift the account has always used.
 * `variant 1` is a punch-in anchored low in the picture — a different shot of
 * the same photograph, not a continuation of the first. Cutting between the two
 * is how a beat that has to hold for seven seconds still changes something
 * every three, which is the manual's rule and the thing the account's 21% and
 * 29% retention readings are actually about.
 *
 * Both stay inside the same 1.2x oversample, so the punch-in costs no extra
 * upscaling of a generated still: it is the zoompan window that moves, not the
 * source resolution.
 */
export function panFilter(dur, variant = 0) {
  const frames = Math.max(1, Math.round(dur * FPS));
  const cw = Math.round(W * 1.2), ch = Math.round(H * 1.2);
  const z = variant === 1 ? `1.26+0.06*on/${frames}` : `1+0.07*on/${frames}`;
  const x = "iw/2-(iw/zoom/2)";
  const y = variant === 1 ? "ih-ih/zoom" : "ih/2-(ih/zoom/2)";
  return (
    `scale=${cw}:${ch}:force_original_aspect_ratio=increase,crop=${cw}:${ch},` +
    `zoompan=z='${z}':x='${x}':y='${y}':d=${frames}:s=${W}x${H}:fps=${FPS},setsar=1`
  );
}

/** Every segment is encoded identically so the concat demuxer's `-c copy` stays
 * valid — the same reason the end-card is encoded rather than generated inline. */
const ENC = ["-r", String(FPS), "-c:v", "libx264", "-preset", "fast", "-crf", "18"];

async function concatSegments(parts, outFile) {
  const list = outFile.replace(/\.mp4$/, "_parts.txt");
  await writeFile(list, parts.map((f) => `file '${path.resolve(f)}'`).join("\n"));
  await ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", outFile]);
}

/** A still, panned and zoomed just enough to never sit still — and re-framed
 * once if the beat is long enough that drift alone would read as a freeze. */
export async function segmentFromImage(img, dur, outFile, extraFilters = []) {
  const shot = async (d, variant, out) =>
    ffmpeg(["-y", "-loop", "1", "-i", img, "-t", String(d),
      "-vf", [panFilter(d, variant), ...extraFilters].join(","), ...ENC, out]);
  if (dur <= REFRAME_S) return shot(dur, 0, outFile);
  const a = outFile.replace(/\.mp4$/, "_a.mp4");
  const b = outFile.replace(/\.mp4$/, "_b.mp4");
  const half = Number((dur / 2).toFixed(2));
  await shot(half, 0, a);
  await shot(Number((dur - half).toFixed(2)), 1, b);
  await concatSegments([a, b], outFile);
}

/**
 * The receipt card: the page floats over its own blurred, darkened self and
 * drifts upward. Full-frame screenshots collided with the captions; a card
 * leaves the low band clear, and reads as evidence rather than as our design.
 */
async function segmentFromScreenshot(shot, dur, outFile) {
  // The card is CROPPED to a fixed height so its bottom edge is deterministic:
  // 880x1250 at x=100,y~230 ends by ~1480, and the KLOW caption band at ~1690
  // can never collide with it. The first live Reel proved the alternative —
  // position the captions in a fixed place under a card of page-dependent
  // height, and some page's headline will eventually sit exactly there.
  //
  // Variant 1 is a push-in on the same receipt: the page is scaled wider and
  // cropped shorter, so the headline fills more of the frame. A receipt beat is
  // often the attaque, which is the longest beat in a 60-second Reel — the
  // opener of the 31 July build ran 9.2 seconds — and a card that only drifts
  // 80 pixels in nine seconds is a still photograph of a webpage. Both variants
  // keep the card's bottom edge well above the caption band.
  const shotAt = async (d, variant, out) => {
    const CARD_W = variant === 1 ? 1000 : 880;
    const CARD_H = variant === 1 ? 1000 : 1250;
    const x = variant === 1 ? 40 : 100;
    const y0 = variant === 1 ? 320 : 230;
    await ffmpeg([
      "-y", "-loop", "1", "-i", shot, "-t", String(d),
      "-filter_complex",
      `[0]split=2[bg][fg];` +
        `[bg]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=28,eq=brightness=-0.25[bgb];` +
        // The card starts under the handle badge and never drifts up into it —
        // the first cut had white site chrome sliding beneath white type.
        `[fg]scale=${CARD_W}:-1,crop=${CARD_W}:'min(ih,${CARD_H})':0:0[card];` +
        `[bgb][card]overlay=x=${x}:y='${y0}-80*t/${d}'[v]`,
      "-map", "[v]", ...ENC, out,
    ]);
  };
  if (dur <= REFRAME_S) return shotAt(dur, 0, outFile);
  const a = outFile.replace(/\.mp4$/, "_a.mp4");
  const b = outFile.replace(/\.mp4$/, "_b.mp4");
  const half = Number((dur / 2).toFixed(2));
  await shotAt(half, 0, a);
  await shotAt(Number((dur - half).toFixed(2)), 1, b);
  await concatSegments([a, b], outFile);
}

/** A real photograph, panned like a still, with its credit burned small in
 * the lower-left — above the platform's bottom UI band, below the karaoke.
 *
 * This type exists because of 2026-07-29: a Reel about Sam Altman shipped
 * with five generated mood stills and never showed a single real thing or
 * person. The account's rule stands — a generated picture may NEVER depict a
 * real person — but the conclusion was never "no faces": it is real,
 * openly-licensed photographs, credited, through the same Openverse/Commons
 * machinery the carousels always had. The credit rides on the segment
 * itself; a licence you cannot see is a licence you are not honouring. */
async function segmentFromPhoto(img, dur, credit, outFile, workDir) {
  const extra = [];
  if (credit) {
    const creditFile = path.join(workDir, `${path.basename(outFile, ".mp4")}.credit.txt`);
    await writeFile(creditFile, credit);
    extra.push(
      `drawtext=fontfile=${path.join(FONT_DIR, "archivo-bold.ttf")}:textfile=${creditFile}:fontsize=26:fontcolor=white@0.72:x=48:y=${H - 400}:shadowcolor=black@0.7:shadowx=2:shadowy=2`
    );
  }
  // A photograph gets the same re-framing as a still, credit burned on both
  // shots: a licence you cannot see on screen is a licence you are not honouring.
  await segmentFromImage(img, dur, outFile, extra);
}

/** The end-card: the brand's dark ground, silent; the ASS layer prints the
 * promise and the follow ask over it. Encoded with the same codec settings as
 * every other segment so the concat demuxer's `-c copy` stays valid. */
async function segmentEndcard(dur, outFile) {
  await ffmpeg([
    "-y", "-f", "lavfi", "-i", `color=c=${BG_HEX}:s=${W}x${H}:r=${FPS}:d=${dur}`,
    "-pix_fmt", "yuv420p", "-r", String(FPS), "-c:v", "libx264", "-preset", "fast", "-crf", "18", outFile,
  ]);
}

/** A clip, trimmed to the beat; a beat longer than its clip holds the last frame. */
async function segmentFromVideo(clip, dur, outFile) {
  await ffmpeg([
    "-y", "-i", clip, "-t", String(dur),
    "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},tpad=stop_mode=clone:stop_duration=${dur},setsar=1`,
    "-r", String(FPS), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "18", outFile,
  ]);
}

/* ------------------------- names a picture may not show ------------------- */

/**
 * The names the post itself uses must never reach a generated picture. The
 * first live run lost minutes to this being naive: every capitalized word in
 * the slides counted as a name, so beat 1's spec tripped on "The" and the run
 * had to reword a prompt that named nobody. English capitalizes sentence
 * openers; a stoplist of those words stays out of the net, and what remains —
 * Microsoft, Redis, Kimi — is what the rule was ever about.
 */
const CAPITALIZED_NOISE = new Set([
  "The", "And", "But", "For", "Not", "With", "From", "That", "This", "These", "Those",
  "Its", "They", "Their", "There", "Then", "Than", "When", "Where", "What", "Who", "Whose",
  "How", "Why", "Will", "Would", "Could", "Should", "Can", "May", "Might", "Must",
  "Has", "Have", "Had", "Was", "Were", "Are", "Been", "Being", "Does", "Did", "Done",
  "Say", "Says", "Said", "New", "Now", "One", "Two", "Three", "First", "Last", "Next",
  "More", "Most", "Less", "Over", "Under", "About", "After", "Before", "Between",
  "Into", "Onto", "Out", "Off", "All", "Any", "Some", "Every", "Each", "Both",
  "Few", "Many", "Much", "Very", "Just", "Also", "Still", "Even", "Only", "Here",
  "Send", "Swipe", "Follow", "You", "Your", "Our", "His", "Her", "Him", "Them", "She",
]);

export function extractForbidNames(post) {
  const text = JSON.stringify(post.slides || "") + (post.centralClaim || "");
  return [...new Set(text.match(/[A-Z][a-zA-Z0-9-]{2,}/g) || [])]
    .filter((w) => !CAPITALIZED_NOISE.has(w))
    .slice(0, 40);
}

/* --------------------------------- main ---------------------------------- */

export async function buildReel(postFile, mediaDir) {
  const post = JSON.parse(await readFile(postFile, "utf8"));
  const plan = post.reel2;
  if (!plan?.beats?.length) throw new Error("post has no reel2 plan");
  if (plan.beats.length < BEATS_MIN || plan.beats.length > BEATS_MAX)
    throw new Error(`reel2 wants ${BEATS_MIN} to ${BEATS_MAX} beats for the 60-second format, got ${plan.beats.length}`);
  if (!plan.title?.trim()) throw new Error("reel2 has no `title` — the hook card is frame zero and the grid thumbnail; 5 to 8 words, fully formed");
  const lang = plan.lang === "en" ? "en" : "fr";
  const mood = MOODS[plan.mood] ? plan.mood : "steady";
  const accent = MOODS[mood].accent;
  const slug = post.slug || path.basename(postFile, ".json");
  await mkdir(mediaDir, { recursive: true });

  const forbidNames = extractForbidNames(post);

  /* 1 — the voice. French narration gets a French news direction — the default
     style prompt is English and steers the accent wrong — and Charon (Google's
     "Informative" voice) as the default register. Gemini TTS has a documented
     quality cliff past ~60 seconds of output and a ~1-in-10 accent/pacing
     drift; RAW_MAX_S keeps us under the cliff, and a failed word-count
     alignment downstream is the cue to regenerate once before debugging.

     The words per minute in the direction below is a lever, not a description:
     the voice does not deliver the number it is given (it reads about 196 when
     asked for 200), but removing the number entirely dropped it to 166 and made
     the format unbuildable. Treat it as a dial that has been calibrated, and
     `state/voice-rate.jsonl` as the instrument that reads the result. */
  const narration = plan.beats.map((b) => b.script.trim()).join("\n\n");
  /* The direction, on the structure Google documents for TTS prompting: audio
     profile, then scene, then director's notes, then the transcript. It used to
     be one sentence.

     The pace line is load-bearing and stays FIRST. Measured 2026-07-31 on the
     day's real script: rewriting the direction without an explicit words-per-
     minute dropped the voice from 3.22 to 2.77 words per second, which is a
     68-second reading of a 56-second budget and a build that stops before it
     starts. The number in the direction and the number the voice delivers are
     not the same (it asks 200, it reads about 196) — that is expected; what
     matters is that removing it costs 15%. Change this text and you have
     changed the reading rate: `state/voice-rate.jsonl` re-learns it over three
     builds, and those three builds are the risk. */
  const frStyle = [
    "Profil: presentateur francais de flash info technologique, voix masculine posee, sure d'elle, jamais souriante.",
    "Scene: studio radio, micro proche, aucune reverberation, aucun bruit de fond.",
    "Notes du realisateur: DEBIT RAPIDE de flash info, environ 200 mots par minute, jamais lent, jamais solennel. Accent francais de France standard. Attaque la toute premiere phrase net et pleine puissance, sans respiration prealable et sans montee progressive, comme si le sujet etait deja commence. Descends legerement le ton en fin de phrase au lieu de le monter. Respire seulement entre les paragraphes, et brievement. Appuie tres legerement les chiffres et les noms propres, rien d'autre. Aucune emphase theatrale, aucun enthousiasme publicitaire, aucun sourire dans la voix.",
    "Lis maintenant ce texte exactement tel qu'il est ecrit, sans rien ajouter:",
  ].join("\n");
  /* 1b — the 60-second contract, applied to the only thing that varies.
     Every reading is recorded raw, before any correction, because that ledger
     is what the gate's word window is derived from: correct first and the
     account would calibrate itself against its own correction and drift
     forever. Rejected readings are recorded too — they are real evidence about
     how fast this voice reads, and dropping them would bias the median toward
     whatever happened to be convenient.

     The re-roll exists because the same 188 words, same model, same voice, same
     direction, came back at 3.26 words a second in the morning's A/B and 3.70
     in the afternoon's first build: this API is stochastic, and the spread
     between two readings is wider than the whole word window. Rewriting the
     script would be the wrong response to that — the script was fine, the die
     landed badly. A reading costs about two and a half cents, so buying another
     is the cheapest thing in the pipeline; only after three bad rolls is it the
     copy's fault. */
  const scriptWords = narration.split(/\s+/).filter(Boolean);
  const voiceName = plan.voice || (lang === "fr" ? "Charon" : "Fenrir");
  const rawWav = path.join(mediaDir, "voice2_raw.wav");
  let voice = null, tempo = 0, rate = 0;
  for (let attempt = 1; attempt <= TTS_TRIES; attempt++) {
    const got = await tts({
      text: narration,
      voice: voiceName,
      ...(lang === "fr" ? { style: frStyle } : {}),
      outFile: rawWav,
      slug,
    });
    const t = got.seconds / SPEECH_S;
    const r = got.seconds > 0 ? scriptWords.length / got.seconds : 0;
    await recordVoiceRate({ slug, words: scriptWords.length, seconds: got.seconds, voice: voiceName, lang, attempt, accepted: t >= TEMPO_MIN && t <= TEMPO_MAX && got.seconds <= RAW_MAX_S });
    console.log(
      `voice attempt ${attempt}: ${scriptWords.length} words in ${got.seconds.toFixed(1)}s (${r.toFixed(2)} w/s) — ` +
        `atempo ${t.toFixed(3)} onto ${SPEECH_S}s for a ${TARGET_S}s file`
    );
    if (t >= TEMPO_MIN && t <= TEMPO_MAX && got.seconds <= RAW_MAX_S) { voice = got; tempo = t; rate = r; break; }
    if (attempt < TTS_TRIES) {
      console.log(`  outside the silent stretch range [${TEMPO_MIN}, ${TEMPO_MAX}] — the voice varies between readings, buying another`);
      await journal(`narration re-roll: ${got.seconds.toFixed(1)}s, atempo ${t.toFixed(3)} out of range`);
      continue;
    }
    /* Three bad readings, and the Reel still ships.
     *
     * Sixty seconds is a promise, and so is one a day; when they collide the
     * daily one wins, because a viewer notices a missing day and nobody has
     * ever noticed three seconds. So the last reading is kept, the stretch is
     * clamped to what stays inaudible, and the file lands wherever that puts it
     * — 57 or 63 seconds rather than 60. The run says so in its report and
     * moves on. Failing here would spend a slot arguing with a die roll. */
    voice = got;
    tempo = Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, t));
    rate = r;
    const want = Math.round(SPEECH_S * (r || 3.26));
    console.log(
      `  ${TTS_TRIES} readings all outside the range. Keeping the last one and clamping the stretch to ${tempo.toFixed(3)}: ` +
        `the file will be about ${(got.seconds / tempo + TAIL_S + END_S).toFixed(1)}s instead of ${TARGET_S}. ` +
        `Say so in the report; if it happens twice in a week the scripts want to be about ${want} words.`
    );
    await journal(`narration out of range on ${TTS_TRIES} readings, clamped to ${tempo.toFixed(3)} — file will not be exactly ${TARGET_S}s`);
  }
  const timedWav = path.join(mediaDir, "voice2.wav");
  await ffmpeg(["-y", "-i", rawWav, "-filter:a", `atempo=${tempo.toFixed(6)}`, "-ar", "48000", timedWav]);
  await journal(`voice ${scriptWords.length} words ${voice.seconds.toFixed(1)}s raw (${rate.toFixed(2)} w/s), atempo ${tempo.toFixed(3)} → ${SPEECH_S}s`);

  /* 2 — the clock, read off the corrected voice so the karaoke matches what
     actually plays. The last beat runs to the end-card rather than to its own
     last word plus a pad: that is what makes the file exactly TARGET_S long
     however the reading came out. */
  const words = await alignWords(timedWav, scriptWords, mediaDir, lang);
  const ranges = beatWordRanges(plan.beats);
  /* Normally this is exactly TARGET_S - END_S, because the stretch put the
     narration on SPEECH_S. It differs only when the stretch had to be clamped
     above, in which case the file is deliberately a few seconds off rather than
     not existing. */
  const speech = voice.seconds / tempo;
  const total = Number((speech + TAIL_S).toFixed(2));
  const bounds = ranges.map((r, i) => ({
    t0: i === 0 ? 0 : words[r.start].s - 0.05,
    t1: i === ranges.length - 1 ? total : words[r.end].e + 0.22,
  }));
  for (let i = 1; i < bounds.length; i++) bounds[i].t0 = bounds[i - 1].t1;
  if (bounds.at(-1).t1 <= bounds.at(-1).t0)
    throw new Error(`the last beat has no room before the end-card (voice runs to ${bounds.at(-1).t0.toFixed(1)}s of ${total}s) — the scripts are too long`);
  // The video outlives the voice by the end-card: promise + follow ask on the
  // brand ground, music still under it, hard cut at exactly TARGET_S.
  const videoTotal = Number((total + END_S).toFixed(2));

  /* 3 — the pictures, cheapest that serves the beat. */
  const segFiles = [];
  let veoAudio = null;
  for (let i = 0; i < plan.beats.length; i++) {
    const beat = plan.beats[i];
    const dur = Number((bounds[i].t1 - bounds[i].t0).toFixed(2));
    const seg = path.join(mediaDir, `seg2_${i}.mp4`);
    const type = beat.visual?.type || "image";
    if (type === "veo") {
      const clip = beat.visual.file || path.join(mediaDir, `veo_${i}.mp4`);
      if (!beat.visual.file) {
        const prompt = beat.visual.prompt || veoPrompt({ ...beat.visual.spec, mood });
        const issues = promptIssues(prompt, { forbidNames });
        if (issues.length) throw new Error(`veo prompt refused:\n  ${issues.join("\n  ")}`);
        const durationSeconds = dur <= 4.2 ? 4 : dur <= 6.2 ? 6 : 8;
        /* 1080p is native for this frame: a 9:16 clip at 720p is 720x1280 and
           gets enlarged 1.5x to fill 1080x1920, which is visible on the one
           beat the whole audition rests on. The API only allows 1080p at 8
           seconds, so a shorter beat stays at 720p rather than buying seconds
           it will not show. Veo Fast: $0.12/s at 1080p against $0.10 at 720p,
           so native resolution costs 16 cents on a normal Reel. */
        const resolution = beat.visual.resolution || (durationSeconds === 8 ? "1080p" : "720p");
        await genVideo({ prompt, durationSeconds, resolution, outFile: clip, slug });
      }
      await segmentFromVideo(clip, dur, seg);
      if (!veoAudio) veoAudio = { file: clip, at: bounds[i].t0, dur };
    } else if (type === "screenshot") {
      const shot = beat.visual.file || path.join(mediaDir, `shot_${i}.png`);
      if (!beat.visual.file) await screenshot(beat.visual.url, shot);
      await segmentFromScreenshot(shot, dur, seg);
    } else if (type === "photo") {
      let file = beat.visual.file || null;
      let credit = beat.visual.credit || null;
      if (!file) {
        const entry = await acquireOne(
          { kind: "photo", query: beat.visual.query, alt: beat.visual.alt || "" },
          { dir: mediaDir, name: `photo_${i}` }
        );
        file = path.resolve(process.cwd(), entry.file);
        credit = creditLine(entry);
        console.log(`photo ${i}: "${entry.title || beat.visual.query}" — ${credit}. LOOK at it before publishing.`);
        await journal(`photo ${i} acquired: ${credit}`);
      }
      await segmentFromPhoto(file, dur, credit, seg, mediaDir);
    } else if (type === "file") {
      const src = beat.visual.file;
      if (/\.(mp4|mov|webm)$/i.test(src)) await segmentFromVideo(src, dur, seg);
      else await segmentFromImage(src, dur, seg);
    } else {
      const img = beat.visual?.file || path.join(mediaDir, `still_${i}.jpg`);
      if (!beat.visual?.file) {
        const prompt = beat.visual?.prompt || imagePrompt({ ...beat.visual?.spec, mood });
        const issues = promptIssues(prompt, { forbidNames });
        if (issues.length) throw new Error(`image prompt refused:\n  ${issues.join("\n  ")}`);
        await genImage({ prompt, outFile: img, slug });
      }
      await segmentFromImage(img, dur, seg);
    }
    segFiles.push(seg);
    console.log(`beat ${i}: ${type} ${dur}s — "${beat.script.split(/\s+/).slice(0, 6).join(" ")}…"`);
    await journal(`beat ${i} built: ${type} ${dur}s`);
  }

  /* 3b — the end-card, sized to whatever is left of the minute.
     Every segment is quantised to whole frames, and a re-framed still is two
     segments, so ten beats can drift a few tenths away from the arithmetic.
     Rather than hope the sum lands on 60, measure the beats that were actually
     written and give the remainder to the end-card: the file is then exactly
     TARGET_S long to within one frame, which is what "60 secondes" has to mean
     if it is printed in the bio. */
  const beatsTotal = (await Promise.all(segFiles.map(async (f) => Number((await ffprobe(f)).format.duration))))
    .reduce((a, b) => a + b, 0);
  const endDur = Number((TARGET_S - beatsTotal).toFixed(3));
  if (endDur < 1.5)
    throw new Error(`only ${endDur.toFixed(2)}s left for the end-card after ${beatsTotal.toFixed(2)}s of beats — the serial promise and the follow ask need ${END_S}s`);
  const endSeg = path.join(mediaDir, `seg2_end.mp4`);
  await segmentEndcard(endDur, endSeg);
  segFiles.push(endSeg);

  /* 4 — one video track, captions burned over it. */
  const concatList = path.join(mediaDir, "concat2.txt");
  await writeFile(concatList, segFiles.map((f) => `file '${path.resolve(f)}'`).join("\n"));
  const noSub = path.join(mediaDir, "reel2_nosub.mp4");
  await ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", noSub]);
  const assFile = path.join(mediaDir, "cap2.ass");
  await writeFile(assFile, buildAss(words, plan.beats, ranges, accent, {
    title: plan.title,
    endcard: { from: beatsTotal, dur: endDur },
  }));
  const withSub = path.join(mediaDir, "reel2_sub.mp4");
  await ffmpeg([
    "-y", "-i", noSub, "-vf",
    `subtitles=${assFile}:fontsdir=${FONT_DIR},` +
      `drawtext=fontfile=${path.join(FONT_DIR, "archivo-bold.ttf")}:text='${HANDLE}':fontsize=34:fontcolor=white@0.8:x=(w-text_w)/2:y=100:shadowcolor=black@0.6:shadowx=2:shadowy=2`,
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", withSub,
  ]);

  /* 5 — the mix: voice on top, the mood's bed ducked under it, the Veo clip's
     own ambience under the beat it belongs to, everything normalised to the
     platform's -14 LUFS so the Reel is as loud as whatever played before it. */
  const bed = path.join(process.cwd(), "brand", "audio", `${mood}.mp3`);
  const mix = path.join(mediaDir, "mix2.wav");
  const inputs = ["-i", path.join(mediaDir, "voice2.wav"), "-i", bed];
  let ambFilter = "anullsrc=r=48000:cl=stereo,atrim=0:0.1[amb];";
  if (veoAudio) {
    inputs.push("-i", veoAudio.file);
    ambFilter = `[2:a]aresample=48000,atrim=0:${veoAudio.dur},volume=0.35,afade=t=out:st=${Math.max(0, veoAudio.dur - 0.5)}:d=0.5,adelay=${Math.round(veoAudio.at * 1000)}|${Math.round(veoAudio.at * 1000)},apad=whole_dur=${videoTotal}[amb];`;
  }
  await ffmpeg([
    "-y", ...inputs, "-filter_complex",
    `[0:a]aresample=48000,apad=whole_dur=${videoTotal},asplit=2[vo1][vo2];` +
      `[1:a]aresample=48000,atrim=0:${videoTotal},volume=0.30,afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, videoTotal - 1.4)}:d=1.4[mus];` +
      ambFilter +
      `[mus][vo1]sidechaincompress=threshold=0.05:ratio=8:attack=40:release=400[duck];` +
      `[vo2][duck][amb]amix=inputs=3:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]`,
    "-map", "[out]", "-ac", "2", "-ar", "48000", mix,
  ]);
  const outFile = path.join(mediaDir, "reel.mp4");
  await ffmpeg(["-y", "-i", withSub, "-i", mix, "-t", String(videoTotal), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", outFile]);

  /* 6 — believe the file, not the plan. */
  const probed = await ffprobe(outFile);
  const dur = Number(probed.format.duration);
  const v = probed.streams.find((s) => s.codec_type === "video");
  const a = probed.streams.find((s) => s.codec_type === "audio");
  const violations = [];
  // The série is "L'actu IA en 60 secondes" and the bio promises one a day, so
  // the duration is a claim the account makes in public. It is checked like
  // every other claim: on the file, both ways. The old check only had an upper
  // bound, which is how four Reels of 47 to 51 seconds were called COMPLIANT.
  if (Math.abs(dur - videoTotal) > 0.6)
    violations.push(`duration ${dur.toFixed(2)}s is not the ${videoTotal.toFixed(2)}s this build was assembled to — something desynchronised between the segments and the mux`);
  if (dur < 45 || dur > 75)
    violations.push(`duration ${dur.toFixed(2)}s is nowhere near the ${TARGET_S}s the série promises`);
  else if (Math.abs(dur - TARGET_S) > 1.5)
    console.log(`note: ${dur.toFixed(1)}s rather than ${TARGET_S}s — the narration could not be stretched onto the budget inaudibly. Publishable, but say so in the report.`);
  if (v?.codec_name !== "h264") violations.push(`video codec ${v?.codec_name}`);
  if (!(v?.width === W && v?.height === H)) violations.push(`frame ${v?.width}x${v?.height}`);
  if (a?.codec_name !== "aac") violations.push(`audio codec ${a?.codec_name}`);
  console.log(violations.length ? `VIOLATIONS: ${violations.join("; ")}` : `COMPLIANT ${dur.toFixed(1)}s ${W}x${H} h264+aac`);
  await journal(violations.length ? `reel VIOLATIONS: ${violations.join("; ")}` : `reel COMPLIANT ${dur.toFixed(1)}s`);
  return { file: outFile, seconds: dur, compliant: violations.length === 0, violations };
}

/* ------------------------------- CLI ------------------------------------ */

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (invokedDirectly) {
  const [postFile, mediaDir] = process.argv.slice(2);
  if (!postFile || !mediaDir) {
    console.log("usage: node src/reel2.mjs posts/<slug>.json media/<slug>");
    process.exit(1);
  }
  buildReel(postFile, mediaDir).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
