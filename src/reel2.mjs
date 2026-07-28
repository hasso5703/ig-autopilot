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
 *     "voice": "Fenrir",
 *     "mood": "tension",
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

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import { ffmpeg, ffprobe } from "./ffmpeg.mjs";
import { tts, genVideo, genImage } from "./genmedia.mjs";
import { veoPrompt, imagePrompt, promptIssues, MOODS } from "./promptcraft.mjs";
import { loadPlaywright, chromiumExecutable } from "./browser.mjs";

const run = promisify(execFile);

const W = 1080, H = 1920, FPS = 25;
const MIN_S = 12, MAX_S = 35;
const FONT_DIR = path.join(process.cwd(), "brand", "fonts");
const HANDLE = "@ORDER.OF.MAGNITUDE";

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

/** Word clock from the voice track. Transcribed words are replaced by ours. */
async function alignWords(voiceWav, scriptWords, workDir) {
  const py = await ensureWhisper();
  const script = `
from faster_whisper import WhisperModel
import json, sys
m = WhisperModel("base.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(sys.argv[1], word_timestamps=True, language="en")
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(words, open(sys.argv[2], "w"))
print(len(words))
`;
  const scriptFile = path.join(workDir, "align.py");
  const wordsFile = path.join(workDir, "words.json");
  await writeFile(scriptFile, script);
  await run(py, [scriptFile, voiceWav, wordsFile], { timeout: 240_000 });
  const heard = JSON.parse(await readFile(wordsFile, "utf8"));
  if (Math.abs(heard.length - scriptWords.length) > 2) {
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
 */
export function buildAss(words, beats, ranges, accentHex) {
  const accent = hexToAss(accentHex);
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
    "", "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const chunks = [];
  let chunk = [];
  words.forEach((word, i) => {
    chunk.push({ word, i });
    if (chunk.length >= 4 || /[,.]$/.test(word.w)) { chunks.push(chunk); chunk = []; }
  });
  if (chunk.length) chunks.push(chunk);
  // A lone word makes a caption that flickers; give it back to its sentence.
  for (let i = chunks.length - 1; i > 0; i--) {
    if (chunks[i].length === 1 && chunks[i - 1].length < 5) {
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
  return head.concat(events).join("\n");
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
    await page.waitForTimeout(600);
    await page.screenshot({ path: outFile });
  } finally {
    await browser.close();
  }
  return outFile;
}

/** A still, panned and zoomed just enough to never sit still. */
async function segmentFromImage(img, dur, outFile) {
  const frames = Math.max(1, Math.round(dur * FPS));
  await ffmpeg([
    "-y", "-loop", "1", "-i", img, "-t", String(dur),
    "-vf",
    `scale=${Math.round(W * 1.2)}:${Math.round(H * 1.2)}:force_original_aspect_ratio=increase,` +
      `crop=${Math.round(W * 1.2)}:${Math.round(H * 1.2)},` +
      `zoompan=z='1+0.07*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},setsar=1`,
    "-r", String(FPS), "-c:v", "libx264", "-preset", "fast", "-crf", "18", outFile,
  ]);
}

/**
 * The receipt card: the page floats over its own blurred, darkened self and
 * drifts upward. Full-frame screenshots collided with the captions; a card
 * leaves the low band clear, and reads as evidence rather than as our design.
 */
async function segmentFromScreenshot(shot, dur, outFile) {
  await ffmpeg([
    "-y", "-loop", "1", "-i", shot, "-t", String(dur),
    "-filter_complex",
    `[0]split=2[bg][fg];` +
      `[bg]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=28,eq=brightness=-0.25[bgb];` +
      // The card starts under the handle badge and never drifts up into it —
      // the first cut had white site chrome sliding beneath white type.
      `[fg]scale=880:-1[card];[bgb][card]overlay=x=100:y='230-80*t/${dur}'[v]`,
    "-map", "[v]", "-r", String(FPS), "-c:v", "libx264", "-preset", "fast", "-crf", "18", outFile,
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
  if (plan.beats.length < 3 || plan.beats.length > 6) throw new Error(`reel2 wants 3 to 6 beats, got ${plan.beats.length}`);
  const mood = MOODS[plan.mood] ? plan.mood : "steady";
  const accent = MOODS[mood].accent;
  const slug = post.slug || path.basename(postFile, ".json");
  await mkdir(mediaDir, { recursive: true });

  const forbidNames = extractForbidNames(post);

  /* 1 — the voice. The copy is the runtime, so this is the budget gate too. */
  const narration = plan.beats.map((b) => b.script.trim()).join("\n\n");
  const voice = await tts({ text: narration, voice: plan.voice || "Fenrir", outFile: path.join(mediaDir, "voice2.wav"), slug });
  if (voice.seconds > MAX_S) {
    throw new Error(
      `narration is ${voice.seconds.toFixed(1)}s, over the ${MAX_S}s ceiling — cut the scripts, longest beats first. Nothing was painted.`
    );
  }
  if (voice.seconds < MIN_S) console.log(`note: narration is only ${voice.seconds.toFixed(1)}s; under ${MIN_S}s the story is probably underexplained`);

  /* 2 — the clock. */
  const scriptWords = narration.split(/\s+/).filter(Boolean);
  const words = await alignWords(path.join(mediaDir, "voice2.wav"), scriptWords, mediaDir);
  const ranges = beatWordRanges(plan.beats);
  const bounds = ranges.map((r, i) => ({
    t0: i === 0 ? 0 : words[r.start].s - 0.05,
    t1: i === ranges.length - 1 ? words[r.end].e + 1.2 : words[r.end].e + 0.22,
  }));
  for (let i = 1; i < bounds.length; i++) bounds[i].t0 = bounds[i - 1].t1;
  const total = bounds.at(-1).t1;

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
        await genVideo({ prompt, durationSeconds, resolution: beat.visual.resolution || "720p", outFile: clip, slug });
      }
      await segmentFromVideo(clip, dur, seg);
      if (!veoAudio) veoAudio = { file: clip, at: bounds[i].t0, dur };
    } else if (type === "screenshot") {
      const shot = beat.visual.file || path.join(mediaDir, `shot_${i}.png`);
      if (!beat.visual.file) await screenshot(beat.visual.url, shot);
      await segmentFromScreenshot(shot, dur, seg);
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
  }

  /* 4 — one video track, captions burned over it. */
  const concatList = path.join(mediaDir, "concat2.txt");
  await writeFile(concatList, segFiles.map((f) => `file '${path.resolve(f)}'`).join("\n"));
  const noSub = path.join(mediaDir, "reel2_nosub.mp4");
  await ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", noSub]);
  const assFile = path.join(mediaDir, "cap2.ass");
  await writeFile(assFile, buildAss(words, plan.beats, ranges, accent));
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
    ambFilter = `[2:a]aresample=48000,atrim=0:${veoAudio.dur},volume=0.35,afade=t=out:st=${Math.max(0, veoAudio.dur - 0.5)}:d=0.5,adelay=${Math.round(veoAudio.at * 1000)}|${Math.round(veoAudio.at * 1000)},apad=whole_dur=${total}[amb];`;
  }
  await ffmpeg([
    "-y", ...inputs, "-filter_complex",
    `[0:a]aresample=48000,apad=pad_dur=1.5,asplit=2[vo1][vo2];` +
      `[1:a]aresample=48000,atrim=0:${total},volume=0.30,afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, total - 1.2)}:d=1.2[mus];` +
      ambFilter +
      `[mus][vo1]sidechaincompress=threshold=0.05:ratio=8:attack=40:release=400[duck];` +
      `[vo2][duck][amb]amix=inputs=3:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]`,
    "-map", "[out]", "-ac", "2", "-ar", "48000", mix,
  ]);
  const outFile = path.join(mediaDir, "reel.mp4");
  await ffmpeg(["-y", "-i", withSub, "-i", mix, "-t", String(total), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", outFile]);

  /* 6 — believe the file, not the plan. */
  const probed = await ffprobe(outFile);
  const dur = Number(probed.format.duration);
  const v = probed.streams.find((s) => s.codec_type === "video");
  const a = probed.streams.find((s) => s.codec_type === "audio");
  const violations = [];
  if (!(dur >= 5 && dur <= 90)) violations.push(`duration ${dur}s outside 5–90`);
  if (v?.codec_name !== "h264") violations.push(`video codec ${v?.codec_name}`);
  if (!(v?.width === W && v?.height === H)) violations.push(`frame ${v?.width}x${v?.height}`);
  if (a?.codec_name !== "aac") violations.push(`audio codec ${a?.codec_name}`);
  console.log(violations.length ? `VIOLATIONS: ${violations.join("; ")}` : `COMPLIANT ${dur.toFixed(1)}s ${W}x${H} h264+aac`);
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
