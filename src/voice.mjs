/**
 * Narration.
 *
 * A Reel is watched with the sound on far more often than a feed post is, and a
 * voice is what turns a slideshow into something that holds a viewer for thirty
 * seconds. This module produces one: Kokoro-82M, open weights, ONNX, CPU only,
 * no account and no key — the same constraint every other part of this pipeline
 * lives under, because an unattended routine cannot renew a subscription.
 *
 * Two things it deliberately does NOT do.
 *
 *   It does not clone a voice, or imitate anyone. The account speaks as itself.
 *   It does not paraphrase. The narration is the text already on the screen,
 *   which means the voice inherits the same verification as everything else: if
 *   a sentence passed the gate to be printed, it may be said aloud, and nothing
 *   else may.
 *
 * Everything is cached under `.cache/kokoro`, which is gitignored. On the cloud
 * runner that is a cold ~90s the first time a run needs a voice: about 15s of
 * pip, about 3s for a 92 MB model, and the rest synthesis. Synthesis runs at
 * roughly 0.6x realtime, measured on the box, so a 40 second Reel costs about 25
 * seconds of CPU.
 *
 *   node src/voice.mjs "One line." "Another line." --out /tmp/vo
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, access, rm } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { ffmpeg, ffprobe } from "./ffmpeg.mjs";

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, ".cache", "kokoro");

const MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx";
const VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin";

/**
 * The shortlist, and why it is a shortlist. Kokoro ships 50-odd voices and most
 * of them are wrong for this: too bright, too young, too eager. These four read
 * a news line without selling it. `af_heart` is the default because it is the
 * warmest of the American voices and the least obviously synthetic on short
 * declarative sentences, which is all this account writes.
 */
export const VOICES = {
  af_heart: "American female, warm, level. The default.",
  af_bella: "American female, slightly brighter and faster.",
  am_michael: "American male, low and even.",
  bf_emma: "British female, cooler and more formal.",
};

export const DEFAULT_VOICE = process.env.OOM_VOICE || "af_heart";

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fetchTo(url, file) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

/**
 * Creates the virtualenv and downloads the weights, once. Every step is
 * idempotent and checked by its artefact rather than by a marker file, so a run
 * interrupted halfway through re-does only what is actually missing.
 */
export async function ensureKokoro() {
  const venv = path.join(CACHE, "venv");
  const python = path.join(venv, "bin", "python");
  const model = path.join(CACHE, "kokoro-v1.0.int8.onnx");
  const voices = path.join(CACHE, "voices-v1.0.bin");

  await mkdir(CACHE, { recursive: true });

  if (!(await exists(python))) {
    await run("python3", ["-m", "venv", venv], { timeout: 180000 });
  }
  try {
    await run(python, ["-c", "import kokoro_onnx, soundfile"], { timeout: 60000 });
  } catch {
    await run(path.join(venv, "bin", "pip"), ["install", "--quiet", "kokoro-onnx", "soundfile"], {
      timeout: 600000,
      maxBuffer: 1 << 24,
    });
  }
  if (!(await exists(model))) await fetchTo(MODEL_URL, model);
  if (!(await exists(voices))) await fetchTo(VOICES_URL, voices);

  return { python, model, voices };
}

/**
 * Speaks `lines` and returns one WAV plus the timing of every line inside it.
 *
 * `gap` is the silence inserted between lines, and it is doing editorial work:
 * a beat change lands on the silence, so the cut is heard before it is seen.
 */
export async function speak(lines, { voice = DEFAULT_VOICE, speed = 1.0, gap = 0.32, outDir } = {}) {
  // `gap` may be a function of the line's own length. The Reel uses that: a beat
  // is clamped to a minimum and a maximum on screen, and the silence after the
  // line is whatever makes the audio exactly as long as the picture it sits
  // under. A fixed gap would drift out of sync the first time a clamp bit.
  const gapFor = (seconds, i) => Math.max(0.05, typeof gap === "function" ? gap(seconds, i) : gap);
  if (!VOICES[voice]) console.error(`warn: voice "${voice}" is not on the shortlist — using it anyway`);
  const dir = outDir || path.join(CACHE, "out");
  const segDir = path.join(dir, "_segments");
  await rm(segDir, { recursive: true, force: true });
  await mkdir(segDir, { recursive: true });

  const { python, model, voices } = await ensureKokoro();

  const child = execFile(
    python,
    [path.join(ROOT, "src", "kokoro_tts.py"), model, voices, voice, String(speed), segDir],
    { timeout: 900000, maxBuffer: 1 << 26 }
  );
  child.stdin.end(JSON.stringify(lines));
  const { stdout } = await new Promise((resolve, reject) => {
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve({ stdout: out }) : reject(new Error(`kokoro_tts.py exited ${code}:\n${err.slice(-800)}`))
    );
  });

  const { segments } = JSON.parse(stdout);
  if (!segments.length) throw new Error("nothing to say — every narration line was empty");

  /*
   * Concatenated with ffmpeg rather than in Python: the gap has to be exact,
   * because the video timeline is built from these numbers and a drift of a few
   * hundred milliseconds over six beats is a voice that finishes talking while
   * the wrong picture is on screen.
   */
  const wav = path.join(dir, "voice.wav");
  const inputs = [];
  const filter = [];
  segments.forEach((s, i) => {
    inputs.push("-i", s.file);
    filter.push(`[${i}:a]aresample=48000,aformat=sample_fmts=s16:channel_layouts=mono,apad=pad_dur=${gapFor(s.seconds, i).toFixed(3)}[s${i}]`);
  });
  filter.push(`${segments.map((_, i) => `[s${i}]`).join("")}concat=n=${segments.length}:v=0:a=1[out]`);
  await ffmpeg(["-y", ...inputs, "-filter_complex", filter.join(";"), "-map", "[out]", wav]);

  let t = 0;
  const timeline = segments.map((s, i) => {
    const pad = gapFor(s.seconds, i);
    const seg = {
      text: s.text,
      start: +t.toFixed(3),
      seconds: +s.seconds.toFixed(3),
      end: +(t + s.seconds).toFixed(3),
      slot: +(s.seconds + pad).toFixed(3),
    };
    t += s.seconds + pad;
    return seg;
  });

  const probed = await ffprobe(wav);
  const duration = Number(probed.format.duration);
  await rm(segDir, { recursive: true, force: true });

  return { file: wav, voice, duration, segments: timeline };
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const voiceIdx = args.indexOf("--voice");
  const outDir = outIdx >= 0 ? args[outIdx + 1] : undefined;
  const voice = voiceIdx >= 0 ? args[voiceIdx + 1] : DEFAULT_VOICE;
  const consumed = new Set([outIdx, outIdx + 1, voiceIdx, voiceIdx + 1].filter((i) => i > 0));
  const lines = args.filter((a, i) => !a.startsWith("--") && !consumed.has(i));
  if (!lines.length) {
    console.error(`usage: node src/voice.mjs "line one" "line two" [--voice ${Object.keys(VOICES).join("|")}] [--out dir]`);
    process.exit(2);
  }
  const res = await speak(lines, { voice, outDir });
  console.log(JSON.stringify(res, null, 2));
}
