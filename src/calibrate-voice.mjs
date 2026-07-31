/**
 * Buy a few readings of a real script and write them to the voice ledger, so a
 * change of voice does not cost the next three Reels their sizing.
 *
 *   node src/calibrate-voice.mjs posts/<slug>.json [howMany]
 *
 * Why this exists. The gate derives the word window from the median reading
 * rate in `state/voice-rate.jsonl`, filtered to the voice actually configured.
 * That ledger is filled by real builds, which is the right way round — but it
 * means the first three Reels after a voice change are sized against a default
 * rather than against the voice that is speaking. On 2026-07-31 Hasan changed
 * the voice to Sadaltager and the ledger held nine readings of Charon and none
 * of the new one. The two happened to be within half a percent of each other,
 * so nothing would have broken; a slower voice would have mis-sized three
 * scripts in a row before the ledger caught up, and nobody would have known
 * why the builds kept re-rolling their narration.
 *
 * A reading costs about three cents. Buying three is cheaper than finding out.
 * The narrations are thrown away: only the words-per-second is kept.
 */

import { readFile, unlink, mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { tts } from "./genmedia.mjs";
import { FR_DIRECTION } from "./reel2.mjs";
import { medianRate, wordWindow } from "./format.mjs";

const LEDGER = path.join(process.cwd(), "state", "voice-rate.jsonl");

export async function calibrate(postFile, times = 3) {
  const post = JSON.parse(await readFile(postFile, "utf8"));
  const plan = post.reel2;
  if (!plan?.beats?.length) throw new Error("that post has no reel2 plan to read");
  const lang = plan.lang === "en" ? "en" : "fr";
  const voice = plan.voice || (lang === "fr" ? "Sadaltager" : "Fenrir");
  const narration = plan.beats.map((b) => b.script.trim()).join("\n\n");
  const words = narration.split(/\s+/).filter(Boolean).length;

  console.log(`calibrating ${voice} on ${words} words, ${times} readings`);
  await mkdir(path.dirname(LEDGER), { recursive: true });
  const rates = [];
  for (let i = 1; i <= times; i++) {
    const out = path.join(os.tmpdir(), `oom-calib-${i}.wav`);
    const got = await tts({
      text: narration,
      voice,
      ...(lang === "fr" ? { style: FR_DIRECTION } : {}),
      outFile: out,
      slug: `calibration-${voice}`,
    });
    const rate = words / got.seconds;
    rates.push(rate);
    await appendFile(
      LEDGER,
      JSON.stringify({
        at: new Date().toISOString(), slug: `calibration-${voice}`,
        words, seconds: got.seconds, voice, lang, calibration: true,
      }) + "\n"
    );
    console.log(`  reading ${i}: ${got.seconds.toFixed(2)}s -> ${rate.toFixed(2)} words/second`);
    await unlink(out).catch(() => {});
  }
  const median = medianRate(rates.map((r) => ({ words: 100, seconds: 100 / r })));
  console.log(`\nmedian for ${voice}: ${median.toFixed(2)} words/second`);
  console.log(`word window it produces: ${JSON.stringify(wordWindow(median))}`);
  return { voice, words, rates, median };
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (invokedDirectly) {
  const [postFile, times] = process.argv.slice(2);
  if (!postFile) {
    console.log("usage: node src/calibrate-voice.mjs posts/<slug>.json [howMany]");
    process.exit(1);
  }
  calibrate(postFile, Number(times) || 3).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
