/**
 * Renders a post spec into an Instagram-Reel-compliant MP4.
 *
 * Two stages, deliberately separated: Chromium paints frames, ffmpeg turns them
 * into a file. Neither knows about the other, so a bad frame can be looked at
 * on its own and a bad encode can be re-run without repainting anything.
 *
 * The specs are Meta's, and they are not suggestions:
 *   MP4, moov atom at the front, H.264 progressive, closed GOP, yuv420p
 *   AAC audio, 48 kHz or less, mono or stereo
 *   1080x1920, 23-60 fps
 *   between 5 and 90 seconds to be eligible for the Reels tab
 * That last line is the whole point of making one: a Reel outside 5-90s at 9:16
 * still posts, but it does not reach the surface where non-followers are.
 *
 *   node src/reel.mjs posts/<slug>.json /tmp/out
 */

import { readFile, mkdir, rm } from "node:fs/promises";
import { execFile, execSync } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { html, buildTimeline, totalDuration, FPS } from "./reel-template.mjs";
import { loadPlaywright, chromiumExecutable, assertFontsLoaded } from "./browser.mjs";

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const W = 1080;
const H = 1920;


function ffmpegBin() {
  for (const c of [process.env.FFMPEG_BIN, "ffmpeg"].filter(Boolean)) {
    try { execSync(`${c} -version`, { stdio: "ignore" }); return c; } catch {}
  }
  throw new Error(
    "ffmpeg not found. The cloud environment needs it installed first:\n" +
      "  apt-get update && apt-get install -y ffmpeg\n" +
      "  apt-get --fix-broken install -y   # if the first reports 404s on transitive deps"
  );
}

/**
 * Paints every frame.
 *
 * One screenshot per frame is not the fastest way to make a video, but it is
 * the only one where what ships is exactly what the template drew. Compositing
 * motion in ffmpeg from a handful of stills would be cheaper and would rule out
 * the two things worth having: per-line entrances and a figure that counts up.
 */
export async function renderFrames(post, brand, fonts, dir) {
  const beats = buildTimeline(post);
  const total = totalDuration(beats);
  const frames = Math.round(total * FPS);

  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ executablePath: await chromiumExecutable(), args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

  await page.setContent(html(post, brand, fonts), { waitUntil: "load" });

  await assertFontsLoaded(page, ["400 100px 'Anton'", "400 40px 'Archivo'", "700 40px 'Archivo'"]);

  const stage = await page.$("#stage");
  for (let n = 0; n < frames; n++) {
    await page.evaluate((t) => window.render(t), n / FPS);
    await stage.screenshot({ path: path.join(dir, `${String(n).padStart(5, "0")}.png`), type: "png" });
  }
  await browser.close();
  return { frames, total, beats };
}

/**
 * Encodes the painted frames.
 *
 * The audio is generated, never sampled. Instagram's music library is reachable
 * only from the phone app, and baking someone else's recording into the file to
 * work around that is a licensing problem wearing a technical disguise. A low
 * synthesised bed is legally unambiguous and, at this volume, reads as intent
 * rather than as a soundtrack. `--silent` swaps it for a silent-but-present
 * track: a Reel with no audio stream at all is a different case to Instagram
 * than one that is merely quiet.
 */
export async function encode(dir, out, seconds, { silent = false } = {}) {
  const ff = ffmpegBin();
  const d = seconds.toFixed(3);
  const fade = Math.min(1.0, seconds / 6);

  const audioIn = silent
    ? ["-f", "lavfi", "-i", `anullsrc=r=48000:cl=stereo:d=${d}`]
    : ["-f", "lavfi", "-i", `sine=frequency=55:sample_rate=48000:duration=${d}`,
       "-f", "lavfi", "-i", `sine=frequency=82.41:sample_rate=48000:duration=${d}`];

  const filter = silent
    ? []
    : ["-filter_complex",
       `[1:a][2:a]amix=inputs=2:duration=first,lowpass=f=180,volume=0.06,` +
       `afade=t=in:st=0:d=${fade.toFixed(3)},afade=t=out:st=${(seconds - fade).toFixed(3)}:d=${fade.toFixed(3)},` +
       `aformat=channel_layouts=stereo[a]`];

  const map = silent ? ["-map", "0:v", "-map", "1:a"] : ["-map", "0:v", "-map", "[a]"];

  await run(ff, [
    "-y", "-loglevel", "error",
    "-framerate", String(FPS), "-i", path.join(dir, "%05d.png"),
    ...audioIn, ...filter, ...map,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20",
    "-pix_fmt", "yuv420p", "-r", String(FPS),
    // Closed GOP, one keyframe every two seconds, no scene-cut keyframes:
    // Meta asks for closed GOP explicitly and scene detection breaks it.
    "-g", String(FPS * 2), "-keyint_min", String(FPS * 2), "-sc_threshold", "0",
    "-profile:v", "high", "-level", "4.0",
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
    "-shortest", "-movflags", "+faststart",
    out,
  ], { maxBuffer: 1 << 26 });

  return out;
}

/** Reads back what was actually produced. Never trust the encoder's exit code alone. */
export async function probe(file) {
  const ff = ffmpegBin().replace(/ffmpeg$/, "ffprobe");
  const { stdout } = await run(ff, [
    "-v", "error", "-print_format", "json", "-show_format", "-show_streams", file,
  ], { maxBuffer: 1 << 26 });
  const j = JSON.parse(stdout);
  const v = j.streams.find((s) => s.codec_type === "video") ?? {};
  const a = j.streams.find((s) => s.codec_type === "audio") ?? {};
  return {
    bytes: Number(j.format.size),
    seconds: Number(j.format.duration),
    width: v.width, height: v.height, pixFmt: v.pix_fmt, video: v.codec_name,
    fps: v.r_frame_rate,
    audio: a.codec_name, sampleRate: a.sample_rate ? Number(a.sample_rate) : null, channels: a.channels ?? null,
  };
}

/**
 * Meta's requirements, checked against the produced file rather than assumed
 * from the encoder flags. The flags have been wrong before.
 */
export function complianceIssues(p) {
  const bad = [];
  if (p.video !== "h264") bad.push(`video codec is ${p.video}, needs h264`);
  if (p.pixFmt !== "yuv420p") bad.push(`pixel format is ${p.pixFmt}, needs yuv420p`);
  if (p.width !== W || p.height !== H) bad.push(`${p.width}x${p.height}, needs ${W}x${H}`);
  if (p.audio !== "aac") bad.push(`audio codec is ${p.audio ?? "none"}, needs aac`);
  if (p.sampleRate && p.sampleRate > 48000) bad.push(`audio ${p.sampleRate} Hz, 48000 is the maximum`);
  if (p.channels && p.channels > 2) bad.push(`${p.channels} audio channels, 1 or 2 allowed`);
  if (!(p.seconds >= 5 && p.seconds <= 90))
    bad.push(`${p.seconds?.toFixed(2)}s — outside 5-90s, so it will NOT be eligible for the Reels tab`);
  return bad;
}

export async function renderReel(postFile, outDir, opts = {}) {
  const post = JSON.parse(await readFile(path.resolve(postFile), "utf8"));
  const brand = JSON.parse(await readFile(path.join(ROOT, "brand", "brand.json"), "utf8"));
  const f = brand.fonts;
  const fonts = {
    anton: (await readFile(path.join(ROOT, "brand", "fonts", f.display.file))).toString("base64"),
    archivo: (await readFile(path.join(ROOT, "brand", "fonts", f.body.file))).toString("base64"),
    archivoBold: (await readFile(path.join(ROOT, "brand", "fonts", f.bodyBold.file))).toString("base64"),
  };

  await mkdir(outDir, { recursive: true });
  const frameDir = path.join(outDir, "_frames");
  const t0 = Date.now();
  const { frames, total, beats } = await renderFrames(post, brand, fonts, frameDir);
  const painted = Date.now();

  const out = path.join(outDir, `${post.slug}.mp4`);
  await encode(frameDir, out, total, opts);
  const encoded = Date.now();

  const p = await probe(out);
  const issues = complianceIssues(p);
  if (!opts.keepFrames) await rm(frameDir, { recursive: true, force: true });

  return {
    file: out,
    beats: beats.map((b) => ({ type: b.type, seconds: +b.duration.toFixed(2), words: b.words })),
    frames,
    seconds: +total.toFixed(2),
    probe: p,
    issues,
    timing: { paintMs: painted - t0, encodeMs: encoded - painted },
  };
}

if (process.argv[1] && process.argv[1].endsWith("reel.mjs")) {
  const [file, outDir] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!file) { console.error("usage: node src/reel.mjs <post.json> [outDir] [--silent] [--keep-frames]"); process.exit(2); }
  renderReel(file, outDir || "/tmp/reel", {
    silent: process.argv.includes("--silent"),
    keepFrames: process.argv.includes("--keep-frames"),
  }).then(
    (r) => {
      console.log(JSON.stringify(r, null, 2));
      if (r.issues.length) { console.error("\nNOT COMPLIANT:\n - " + r.issues.join("\n - ")); process.exit(1); }
      console.error("\nCOMPLIANT");
    },
    (e) => { console.error("FAILED:", e.message); process.exit(1); }
  );
}
