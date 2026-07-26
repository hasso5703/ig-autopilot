/**
 * The music bed.
 *
 * Instagram's own library is the only sound that carries a discovery bonus, and
 * it is unreachable: the content-publishing API has no audio parameter for any
 * media type, and music cannot be added to an already-published post. So sound
 * means baking a track into the MP4, which means a track we are certain we may
 * bake in.
 *
 * The beds are CURATED AND COMMITTED, not searched per run, and they are chosen
 * by MEASUREMENT rather than by title. That distinction cost a published Reel.
 *
 * The first four were picked from Openverse by reading their names, which I said
 * at the time was a guess. Hasan listened to the result and called it a horror
 * soundtrack. He was right, and it is measurable: the bed that shipped had a
 * spectral centroid of 498 Hz. That is sub-bass rumble, and it does two bad
 * things at once — it reads as dread, and it sits directly under the fundamentals
 * of speech (300-3400 Hz) so it muddies the voice it is supposed to support.
 * Openverse's CC0 audio is a sound-effects library; its whole music pool measured
 * between 480 and 580 Hz.
 *
 * These four are Kevin MacLeod's, from incompetech.com, and every one was
 * measured before it was committed: centroid between 1.2 and 4.5 kHz, an audible
 * pulse, low-cut at 130 Hz so nothing competes with the narration. `node
 * src/music.mjs measure` re-checks them, so the next person to swap a bed can
 * check the claim instead of trusting the filename.
 *
 * Licence: CC BY 4.0, which is an obligation, not a formality. Every bed carries
 * its `attribution` string, `reel.mjs` prints it with the finished file, and the
 * manual requires it in the Reel's caption. Attribution we do not print is
 * attribution we have not given.
 *
 *   node src/music.mjs list
 *   node src/music.mjs measure     # the centroid of every committed bed
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ffmpeg } from "./ffmpeg.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const AUDIO_DIR = path.join(ROOT, "brand", "audio");
const SHEET = path.join(AUDIO_DIR, "beds.json");
const UA = "order-of-magnitude/1.0 (+https://github.com/hasso5703/ig-autopilot)";

export async function beds() {
  try {
    return JSON.parse(await readFile(SHEET, "utf8"));
  } catch {
    return [];
  }
}

/**
 * Picks the bed for a story.
 *
 * `mood` comes from the post spec and is advisory: an unmatched mood falls back
 * to the first bed rather than to silence, because a Reel with no audio stream
 * is treated differently by Instagram than one that is merely quiet.
 */
export async function pickBed(mood = "tension") {
  const all = await beds();
  if (!all.length) return null;
  const hit = all.find((b) => b.mood === mood) || all.find((b) => b.mood === "steady") || all[0];
  return { ...hit, path: path.join(AUDIO_DIR, hit.file) };
}

export const MOODS = ["steady", "tension", "drive", "wonder"];

/* ------------------------------------------------------------------ *
 * Curation (run by a human, not by the routine)
 * ------------------------------------------------------------------ */

/**
 * Re-measure what is committed. The point is that a bed's suitability is a
 * number, not an opinion about its name: centroid tells you whether it will read
 * as dread and whether it will fight the voice.
 */
async function measure() {
  for (const b of await beds()) {
    const file = path.join(AUDIO_DIR, b.file);
    const { stdout } = await ffmpeg([
      "-i", file, "-ss", "10", "-t", "20",
      "-af", "aspectralstats=measure=centroid,ametadata=print:key=lavfi.aspectralstats.1.centroid:file=-",
      "-f", "null", "-",
    ]);
    const vals = String(stdout).split("\n").filter((l) => l.includes("centroid=")).map((l) => Number(l.split("=")[1]));
    const mean = vals.length ? Math.round(vals.reduce((a, c) => a + c, 0) / vals.length) : 0;
    const verdict = mean < 1000 ? "TOO DARK — reads as dread and masks the voice" : mean > 5000 ? "thin" : "in the editorial band";
    console.log(`${b.mood.padEnd(8)} ${String(mean).padStart(5)} Hz  ${verdict}  (${b.title} — ${b.creator})`);
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "measure") {
    await measure();
  } else {
      for (const b of await beds())
      console.log(`${b.mood.padEnd(8)} ${b.file.padEnd(14)} ${b.title.padEnd(20)} ${b.creator} (${b.license})\n         ${b.why}\n         ${b.attribution}`);
  }
}
