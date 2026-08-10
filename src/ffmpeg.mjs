/**
 * One place to find ffmpeg, and a usable error when it is not there.
 *
 * `ffmpeg` is not in the cloud image and is installed per run. Every module
 * that touches pixels or audio needs it, so resolving it in each of them
 * produced three different failure messages for the same missing package.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access } from "node:fs/promises";
import { constants } from "node:fs";

const run = promisify(execFile);

let cached = null;

export async function ffmpegPath() {
  if (cached) return cached;
  for (const candidate of [process.env.FFMPEG_PATH, "/usr/bin/ffmpeg", "ffmpeg"]) {
    if (!candidate) continue;
    try {
      if (candidate.startsWith("/")) await access(candidate, constants.X_OK);
      await run(candidate, ["-version"]);
      cached = candidate;
      return cached;
    } catch {
      /* try the next one */
    }
  }
  throw new Error(
    "ffmpeg not found. It is not in the cloud image and has to be installed each run:\n" +
      "  apt-get update && apt-get install -y ffmpeg\n" +
      "Images, audio and video all depend on it, so nothing downstream can run."
  );
}

/** Runs ffmpeg and throws with its stderr, which is where it says what it disliked.
 *
 * The default window is 420s, not 240: a supersampled `zoompan` render measured
 * +85s alone (2026-07-31), and three renders share the machine at once, so a
 * long beat under contention brushed the old ceiling with nothing actually
 * wrong. A timeout or an OOM kill gets ONE retry — those are weather on a
 * shared container. A non-zero exit does not: a bad filter graph fails the
 * same way every time, and retrying it just doubles the wait for the error. */
export async function ffmpeg(args, { timeout = 420000, attempt = 1 } = {}) {
  const bin = await ffmpegPath();
  try {
    return await run(bin, ["-hide_banner", "-loglevel", "error", ...args], {
      timeout,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    const killed = Boolean(err.killed || err.signal);
    if (killed && attempt === 1) {
      console.error(`ffmpeg ${err.signal || "killed"} after ${timeout / 1000}s — retrying once (contention, not a filter error)`);
      return ffmpeg(args, { timeout, attempt: 2 });
    }
    const detail = String(err.stderr || err.message).trim().split("\n").slice(-6).join("\n");
    throw new Error(`ffmpeg failed: ${args.join(" ")}\n${detail}`);
  }
}

/** ffprobe, as JSON. Returns the parsed `format` and `streams`. */
export async function ffprobe(file) {
  const bin = (await ffmpegPath()).replace(/ffmpeg$/, "ffprobe");
  const { stdout } = await run(bin, [
    "-v", "error",
    "-show_format", "-show_streams",
    "-of", "json",
    file,
  ]);
  return JSON.parse(stdout);
}
