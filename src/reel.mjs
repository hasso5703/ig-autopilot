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
import { html, buildTimeline, applyNarrationTiming, totalDuration, FPS } from "./reel-template.mjs";
import { loadPlaywright, chromiumExecutable, assertFontsLoaded } from "./browser.mjs";
import { loadSlideImages } from "./render.mjs";
import { speak, DEFAULT_VOICE } from "./voice.mjs";
import { pickBed } from "./music.mjs";

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
export async function renderFrames(post, brand, fonts, dir, opts = {}) {
  const beats = opts.beats ?? buildTimeline(post);
  const total = totalDuration(beats);
  const frames = Math.round(total * FPS);

  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ executablePath: await chromiumExecutable(), args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

  await page.setContent(html(post, brand, fonts, { beats, pictures: opts.pictures ?? {} }), { waitUntil: "load" });

  await assertFontsLoaded(page, ["400 100px 'Anton'", "400 40px 'Archivo'", "700 40px 'Archivo'"]);

  const stage = await page.$("#stage");
  for (let n = 0; n < frames; n++) {
    await page.evaluate((t) => window.render(t), n / FPS);
    // JPEG, not PNG. These frames are an intermediate the encoder immediately
    // re-compresses, and PNG encoding of a 2 megapixel frame was costing more
    // wall clock than everything else in the pipeline put together: 630 frames
    // took five minutes to paint. Quality 92 is indistinguishable after H.264.
    await stage.screenshot({ path: path.join(dir, `${String(n).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
  }
  await browser.close();
  return { frames, total, beats };
}

/**
 * Encodes the painted frames, with the sound.
 *
 * The first version synthesised two sine waves, because Instagram's music
 * library is phone-only and sampling someone else's record is a licensing
 * problem wearing a technical disguise. That reasoning was right and the
 * conclusion was too timid: a sub-bass hum is not sound design, it is an
 * apology. What ships now is a spoken narration over a CC0 bed, both of which
 * we are unambiguously entitled to use, and the bed ducks under the voice
 * instead of fighting it.
 *
 * `--silent` still exists and still emits a real, silent AAC track: a Reel with
 * no audio stream at all is a different case to Instagram than one that is
 * merely quiet.
 */
export async function encode(dir, out, seconds, { silent = false, voice = null, bed = null } = {}) {
  const ff = ffmpegBin();
  const d = seconds.toFixed(3);
  const fade = Math.min(1.6, seconds / 6);

  const audioIn = [];
  const filter = [];
  const parts = [];

  if (silent || (!voice && !bed)) {
    audioIn.push("-f", "lavfi", "-i", `anullsrc=r=48000:cl=stereo:d=${d}`);
    parts.push("[1:a]");
  } else {
    if (voice) {
      audioIn.push("-i", voice);
      const idx = audioIn.filter((a) => a === "-i").length;
      // asplit, because a filter output may be consumed exactly once. The voice
      // is needed twice: mixed into the result, and again as the sidechain that
      // pushes the music out of its way.
      filter.push(
        `[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${d},volume=1.6,` +
          `alimiter=limit=0.95,asplit=2[vo][vokey]`
      );
    }
    if (bed) {
      audioIn.push("-i", bed);
      const idx = audioIn.filter((a) => a === "-i").length;
      filter.push(
        `[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${d},volume=0.34,` +
          `afade=t=in:st=0:d=${fade.toFixed(2)},afade=t=out:st=${(seconds - fade).toFixed(2)}:d=${fade.toFixed(2)}[bedraw]`
      );
      if (voice) {
        // The bed drops out of the way of the voice rather than being mixed
        // permanently low: full presence in the gaps between lines, well under
        // the narration while it speaks. A fixed low level does neither.
        filter.push(`[bedraw][vokey]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=420[bed]`);
        parts.push("[bed]", "[vo]");
      } else {
        filter.push(`[bedraw]anull[bed]`);
        parts.push("[bed]");
      }
    } else {
      parts.push("[vo]");
    }
    filter.push(
      parts.length > 1
        ? `${parts.join("")}amix=inputs=${parts.length}:duration=first:normalize=0[a]`
        : `${parts[0]}anull[a]`
    );
  }

  const filterArgs = filter.length ? ["-filter_complex", filter.join(";")] : [];
  const map = filter.length ? ["-map", "0:v", "-map", "[a]"] : ["-map", "0:v", "-map", "1:a"];

  await run(ff, [
    "-y", "-loglevel", "error",
    "-framerate", String(FPS), "-i", path.join(dir, "%05d.jpg"),
    ...audioIn, ...filterArgs, ...map,
    // crf 23 with a ceiling, not crf 20. Photographic beats plus film grain are
    // expensive to encode, and the first Reel with pictures came out at 9 MB for
    // 22 seconds — every one of which lives in this repository's history for
    // ever, at two Reels a day. Instagram re-encodes the upload regardless, so
    // the only thing a higher bitrate buys is git weight.
    "-c:v", "libx264", "-preset", "slow", "-crf", "23",
    "-maxrate", "4500k", "-bufsize", "9000k",
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

  const pictures = await loadSlideImages(post);

  /*
   * The voice is built BEFORE the frames, because it decides how long they are.
   * Each beat lasts exactly as long as its narration takes to say, clamped, and
   * the audio is padded by the same amount so picture and voice cannot drift.
   * If synthesis fails the Reel is still made — silent, and loudly reported.
   * A day without narration is a worse Reel; a day without a Reel is no reach.
   */
  let beats = buildTimeline(post);
  let vo = null;
  if (!opts.silent) {
    try {
      vo = await speak(beats.map((b) => b.narration), {
        voice: opts.voice || DEFAULT_VOICE,
        outDir,
        gap: (seconds) => Math.max(2.2, seconds + 0.55) - seconds,
      });
      beats = applyNarrationTiming(beats, vo.segments);
    } catch (err) {
      console.error(`warn: narration failed (${err.message}) — the Reel will be made without a voice`);
    }
  }

  const bed = opts.silent ? null : await pickBed(post.mood || "tension");

  const { frames, total } = await renderFrames(post, brand, fonts, frameDir, { beats, pictures });
  const painted = Date.now();

    // Named reel.mp4, not <slug>.mp4, because that is the path reelUrl() builds
  // and Meta fetches. The first version required the operator to rename it by
  // hand between rendering and publishing, which is a step a tired run skips.
  const out = path.join(outDir, "reel.mp4");
  await encode(frameDir, out, total, { ...opts, voice: vo?.file || null, bed: bed?.path || null });
  const encoded = Date.now();

  const p = await probe(out);
  const issues = complianceIssues(p);
  if (!opts.keepFrames) await rm(frameDir, { recursive: true, force: true });

  return {
    file: out,
    voice: vo ? { voice: vo.voice, seconds: +vo.duration.toFixed(2), lines: vo.segments.map((s) => s.text) } : null,
    music: bed ? { file: bed.file, title: bed.title, creator: bed.creator, license: bed.license } : null,
    pictures: Object.fromEntries(Object.entries(pictures).map(([k, v]) => [k, v.generated ? "generated" : "photo"])),
    beats: beats.map((b) => ({
      type: b.type,
      seconds: +b.duration.toFixed(2),
      words: b.words,
      narration: b.narration,
      ...(b.long ? { long: "this line takes over 7.5s to say — shorten it" } : {}),
    })),
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
  const voiceIdx = process.argv.indexOf("--voice");
  renderReel(file, outDir || "/tmp/reel", {
    silent: process.argv.includes("--silent"),
    keepFrames: process.argv.includes("--keep-frames"),
    voice: voiceIdx >= 0 ? process.argv[voiceIdx + 1] : undefined,
  }).then(
    (r) => {
      console.log(JSON.stringify(r, null, 2));
      if (r.issues.length) { console.error("\nNOT COMPLIANT:\n - " + r.issues.join("\n - ")); process.exit(1); }
      console.error("\nCOMPLIANT");
    },
    (e) => { console.error("FAILED:", e.message); process.exit(1); }
  );
}
