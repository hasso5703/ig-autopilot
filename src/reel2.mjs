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
 *     "voice": "Sadaltager",
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

import { readFile, writeFile, appendFile, mkdir, access, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
  BEATS_MIN, BEATS_MAX, TTS_TRIES, VEO_STRETCH_MAX, DEFAULT_RATE, medianRate, wordWindow,
  COUNTDOWN,
} from "./format.mjs";

const run = promisify(execFile);

const W = 1080, H = 1920;

/* ------------------------------ why 30, and why ×4 -----------------------
 * Hasan, 2026-07-31: *"les vidéos tremblent un peu, ne sont pas stables, genre
 * les zooms vers les images et même la vidéo, même sur les reels déjà
 * publiés."* He was right, and it was three separate defects. All three were
 * measured on a test pattern before anything was changed.
 *
 * 1. THE ZOOM. `zoompan` truncates its crop origin to whole INPUT pixels. The
 *    Ken-Burns move is 7% over a whole beat, so the origin creeps by a fraction
 *    of a pixel per frame and the truncation makes it hesitate between two
 *    positions. Measured on a line that should have drifted a steady -0.148
 *    px/frame: it went +0.16, +0.19, 0.00, -0.67, +0.18, 0.00, -0.68 — moving
 *    the WRONG WAY two frames out of three, ±0.46px of vibration. The visible
 *    error is `zoom × output_width / input_width`, so the only lever is a
 *    bigger input. At SUPERSAMPLE 4 the same line drifts -0.15, -0.15, -0.14,
 *    -0.15: standard deviation falls from 0.352px to 0.053px. ×8 buys almost
 *    nothing more and triples the render (76s against 23s for a 6-second clip).
 *
 * 2. THE RECEIPT. `overlay` truncates y the same way, and the card's 80-pixel
 *    drift over a beat is well under a pixel per frame: measured, it froze for
 *    three or four frames then jumped two pixels, over and over. The drift is
 *    gone — the mid-beat re-frame is what keeps a long receipt alive now.
 *
 * 3. THE FRAME RATE. Veo renders at 24, the timeline ran at 25, so one frame
 *    in every 24 was duplicated: measured at 24 near-identical frames out of 89
 *    on a plain `fps` conversion. And a 25 fps master is not what the platform
 *    plays, so everything else was being re-timed after upload too. The
 *    timeline is 30 now, and the Veo clip is converted by blending rather than
 *    duplication (`framerate`): same measured smoothness as motion-compensated
 *    interpolation, 7 seconds of work instead of 90, and no ghosting on the
 *    deliberately simple shots the manual allows.
 */
const FPS = 30;
const SUPERSAMPLE = 4;

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
/** The two small surfaces drawn by ffmpeg rather than by libass: the handle
 * badge that rides every frame, and the credit line a photo beat owes its
 * photographer. Both were still on Archivo Bold after the typefaces changed on
 * 2026-07-31 — the badge is on screen for the whole sixty seconds, so it was
 * the most-seen leftover of the old identity. */
const UI_FONT = path.join(FONT_DIR, "oom-ui.ttf");
const HANDLE = "@ORDER.OF.MAGNITUDE";
/* The end-card is fixed text, not per-post copy: the ritual is the point.
 *
 * Rewritten on 2026-07-31 on Hasan's instruction. It used to be one line of
 * promise and one thin line of follow ask, both small enough to read as a
 * legal notice. Now the promise is set across two lines of wide display black
 * and the ask is explicit about what it wants and when: tomorrow's edition, and
 * a like. The serial promise is still what does the work — a viewer subscribes
 * to the NEXT one, never to the one they just watched. */
const END_PROMISE = ["UNE ACTU IA", "PAR JOUR."];
const END_ASK = ["ABONNE-TOI POUR DEMAIN", "ET LAISSE UN LIKE"];

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

/**
 * How much quieter the reading ends than it starts, in dB.
 *
 * Hasan, 2026-08-01, on the day's Reel: "à la fin la voix google tts chuchote un
 * peu". He is right that something changes, and the last beat is the one that
 * asks for the follow, so it is worth watching.
 *
 * What the measurements actually say, on the two published narrations:
 *
 *   31 July  decline -2.20 dB   spectral drift +0.09 dB   transcribed fine
 *   1 August decline -1.60 dB   spectral drift +1.78 dB   transcriber drifted
 *
 * So the level is NOT the differentiator — the day he heard it declines less.
 * What differs is timbre: the reading drifts towards the high end, which is what
 * breathiness looks like. Levelling cannot repair that; speechnorm recovers
 * about a decibel of gain and leaves the voice exactly as breathy.
 *
 * Nor is it why Whisper failed: the 31 July narration has the larger decline and
 * transcribed perfectly, and the 1 August one anchors 90% off that container.
 *
 * This records the cheap half of the picture — two ffmpeg passes, about a
 * second — because two files are not enough to put a threshold on. That is
 * precisely the mistake three readings of one script made with the word window.
 * A fortnight of numbers in the ledger is what would justify a rule; a hunch
 * from two is not. A failure here is never allowed to matter.
 */
async function voiceDecline(wav) {
  const meanOf = async (ss, t) => {
    try {
      const { stderr } = await run("ffmpeg", ["-v", "info", "-nostats", "-ss", String(ss), "-t", String(t), "-i", wav, "-af", "volumedetect", "-f", "null", "-"], { maxBuffer: 4 * 1024 * 1024 });
      return Number(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/.exec(stderr)?.[1]);
    } catch { return NaN; }
  };
  try {
    const total = Number((await ffprobe(wav)).format.duration);
    if (!Number.isFinite(total) || total < 6) return null;
    const third = total / 3;
    const [head, tail] = await Promise.all([meanOf(0, third), meanOf(total - third, third)]);
    if (!Number.isFinite(head) || !Number.isFinite(tail)) return null;
    return Number((tail - head).toFixed(2));
  } catch { return null; }
}

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

/** The alignment model, by name, so the fetch and the transcription agree. */
const WHISPER_MODEL = { fr: "large-v3-turbo", en: "base.en" };

async function ensureWhisper(lang = "fr") {
  const py = path.join(VENV, "bin", "python");
  try {
    await access(py);
  } catch {
    console.log("bootstrapping whisper venv (first run on this machine, ~2 min)…");
    await run("python3", ["-m", "venv", VENV]);
    await run(path.join(VENV, "bin", "pip"), ["-q", "install", "faster-whisper"], { timeout: 300_000 });
  }
  /*
   * Fetch the weights as their own step, always.
   *
   * They used to download lazily inside the transcription call, whose timeout
   * has to cover the reading itself — fine while the model was `base` at 142
   * MB, and a trap from the moment it became `large-v3-turbo` at 1.6 GB on
   * 2026-07-31. A cold container would have had four minutes to pull 1.6 GB,
   * load it and transcribe a minute of speech, and the failure would have
   * arrived after the narration was already paid for, phrased as a timeout with
   * nothing to say about downloads.
   *
   * On a warm machine this returns in about three seconds, so it costs nothing
   * to do it every time; on a cold one it is the honest place for the wait, and
   * it says so.
   */
  const model = WHISPER_MODEL[lang] ?? WHISPER_MODEL.fr;
  const t0 = Date.now();
  await run(py, ["-c", `from faster_whisper import WhisperModel; WhisperModel("${model}", device="cpu", compute_type="int8")`],
    { timeout: 900_000 });
  const secs = (Date.now() - t0) / 1000;
  if (secs > 20) console.log(`whisper ${model} fetched in ${Math.round(secs)}s (cold container, ~1.6 GB)`);
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
async function alignWords(voiceWav, scriptWords, workDir, lang = "fr", cacheKey = "") {
  /*
   * The alignment is cached beside the reading it belongs to, for the same
   * reason the reading is.
   *
   * The narration has been fingerprinted since 2026-07-31 so that a rebuild
   * triggered by a picture — a dead browser, an advert caught on a receipt —
   * costs nothing. The notebook recorded that as costing "ni narration ni
   * passe Whisper". Half of that was untrue: the audio was reused and then
   * transcribed again, every single build.
   *
   * That was invisible while transcription was deterministic. On a four-core
   * container on 2026-08-01 it is not: the same cached narration scored 78% of
   * its script on one pass and 61% on the next, so every re-render for a
   * picture re-rolled the karaoke's clock and could fail a build that had
   * already passed. Cache the clock with the voice, and a picture fix is a
   * picture fix.
   */
  const alignFile = path.join(workDir, "align.json");
  const alignKeyFile = path.join(workDir, "align.key");
  if (cacheKey) {
    const stored = (await readFile(alignKeyFile, "utf8").catch(() => "")).trim();
    if (stored === cacheKey) {
      const cached = await readFile(alignFile, "utf8").then(JSON.parse).catch(() => null);
      if (Array.isArray(cached) && cached.length === scriptWords.length) {
        console.log(`alignment: reusing the clock already measured for this reading (${cached.length} words). No transcription.`);
        return cached;
      }
    }
  }
  const py = await ensureWhisper(lang);
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
  const model = WHISPER_MODEL[lang] ?? WHISPER_MODEL.fr;
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
  /* The weights are already on disk by now, so this budget is for the reading
     alone: about 40 seconds on twenty cores, and a cloud container has fewer. */
  await run(py, [scriptFile, voiceWav, wordsFile], { timeout: 420_000 });
  let heard = mergeContinuations(JSON.parse(await readFile(wordsFile, "utf8")));
  let anchored = anchorToScript(heard, scriptWords, { floor: 0 });
  let coverage = anchored.filter((w) => w.anchored).length / scriptWords.length;
  console.log(
    `alignment: ${heard.length} tokens heard for ${scriptWords.length} script words, ` +
      `${anchored.filter((w) => w.anchored).length} anchored (${(coverage * 100).toFixed(0)}%)`
  );

  /*
   * A poor whole-file decode gets one windowed retry, automatically.
   *
   * This is the hour the 2026-08-01 run spent, encoded. Its whole-file decode
   * dropped 30 of 209 words and anchored 69% — barely over the floor — and the
   * message it got said the VOICE was wrong, so it bought a second narration
   * chasing a phantom. It then bisected by hand for close to an hour before
   * finding what a slice test says in four seconds: every 12-second piece of
   * that audio transcribes verbatim, and only the long file drifts. It measured
   * the fix too, and did not have time to build it: windowed decoding gave it
   * 201 of 209 where the whole file gave 179.
   *
   * Measured here on the same published audio, on a healthy machine: whole-file
   * anchors 90%, windowed 90%, so nothing is gained when nothing is wrong —
   * and windowed costs about three times the wall clock, which is why it is a
   * retry and not the default. On the container that produced 69%, it is the
   * difference between a run that continues and a run that spends an hour.
   *
   * Whisper's long-form pass carries its own state across a whole file and can
   * lose it; a window cannot drift further than its own length. Nothing
   * downstream reads the transcription's words — only its clock — so a slightly
   * worse wording with a sound clock is a strictly better trade.
   */
  if (coverage < ALIGN_HEALTHY) {
    console.log(
      `alignment: ${(coverage * 100).toFixed(0)}% is under the ${(ALIGN_HEALTHY * 100).toFixed(0)}% this normally reaches — ` +
        "re-reading in windows before blaming the voice. This costs time, never money."
    );
    await journal(`alignment thin at ${(coverage * 100).toFixed(0)}%, retrying windowed`);
    try {
      const windowedFile = path.join(workDir, "words-windowed.json");
      await writeFile(scriptFile, windowedScript(model, lang));
      await run(py, [scriptFile, voiceWav, windowedFile], { timeout: 600_000 });
      const heard2 = mergeContinuations(JSON.parse(await readFile(windowedFile, "utf8")));
      const anchored2 = anchorToScript(heard2, scriptWords, { floor: 0 });
      const coverage2 = anchored2.filter((w) => w.anchored).length / scriptWords.length;
      console.log(`alignment: windowed re-read anchors ${(coverage2 * 100).toFixed(0)}% (whole file was ${(coverage * 100).toFixed(0)}%)`);
      if (coverage2 > coverage) { heard = heard2; anchored = anchored2; coverage = coverage2; }
    } catch (err) {
      /* A failed retry must not lose the decode we already have: fall through
         to the guard below with the whole-file result and let it decide. */
      console.error(`alignment: the windowed re-read failed (${String(err.message).slice(0, 120)}); keeping the whole-file decode`);
    }
  }

  if (coverage < ALIGN_FLOOR) {
    throw new Error(
      `alignment recognised only ${(coverage * 100).toFixed(0)}% of the script (floor ${(ALIGN_FLOOR * 100).toFixed(0)}%), ` +
        "and a windowed re-read of the same audio did no better.\n" +
        "Two independent decodes agreeing is what makes this the voice's fault rather than the transcriber's: " +
        "listen to voice2_raw.wav before spending anything. If it reads the script correctly, this is a bug in the alignment, not a bad narration — " +
        "do not buy another reading."
    );
  }
  if (cacheKey) {
    await writeFile(alignFile, JSON.stringify(anchored));
    await writeFile(alignKeyFile, cacheKey);
  }
  return anchored;
}

/** Strip a token to what two transcriptions of the same word must share. */
const alignKey = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/**
 * Our words, whisper's clock — matched by content instead of by position.
 *
 * This used to be a positional mapping guarded by a word count: heard[i] gave
 * the timing of scriptWords[i], and a count more than a few off failed the
 * build. That is exact when the transcription is, and it was, until a container
 * with four cores read the same narration twice on 2026-08-01 and dropped
 * twenty-three words of it both times. The audio was fine: every slice of it,
 * transcribed on its own, came back verbatim, and the whole file came back with
 * "labishopsie", "Hyper Auxerrecher" and a runaway of "pouce pouce pouce".
 * large-v3-turbo drifts on long dense French here; `small` truncated the last
 * beat instead, `base` lost fourteen words, VAD and beam search made it worse.
 *
 * A drifting transcriber is not the same event as a voice reading the wrong
 * script, and only the second one is worth killing a paid Reel over. So the
 * heard tokens are anchored onto the script by longest common subsequence, the
 * words nothing was heard for have their timings interpolated between the
 * anchors around them, and the guard measures how much of the script was
 * actually recognised rather than how many tokens came back. A voice reading
 * something else anchors almost nothing and still fails, which is the case the
 * guard was built for.
 */
/** Where a healthy decode lands, and where one stops being usable.
 *
 * Both measured on the same published narration of 2026-08-01. A machine that
 * transcribes it properly anchors 90% of the script, whole-file or windowed,
 * three passes running and identical every time. The container that built that
 * Reel anchored 69%. A voice reading an entirely different script anchors 32%.
 *
 * So 85% is "this went normally", and below it something is worth retrying;
 * 65% is "no reading of this script could look like that", and it stands where
 * the run that measured it put it. */
export const ALIGN_HEALTHY = 0.85;
export const ALIGN_FLOOR = 0.65;

/** Whisper again, in overlapping windows with their offsets added back.
 *
 * Long-form decoding carries state across the whole file and can lose it; a
 * window cannot drift beyond its own length. Slices are cut with ffmpeg, which
 * is already a hard dependency, so this adds nothing to install. Tokens landing
 * inside a window's overlap are dropped in favour of what the previous window
 * already heard there, which keeps the clock monotonic across the seams.
 *
 * The window is 12 seconds because 20 was not short enough. Measured on the
 * 2026-08-02 Google Earth narration, one 200-word reading, three decodes of the
 * same file: whole-file 35%, 20-second windows 59%, 12-second windows 82%. At
 * 20 seconds a drifting window still swallowed two whole beats and the build
 * died over the 65% floor with the narration already paid for. Twelve is also
 * the length the 2026-08-01 run measured by hand when it bisected this for an
 * hour and found every 12-second slice coming back verbatim, so two containers
 * now agree. The cost is wall clock on the retry path only (about 60 seconds
 * here on four cores); a healthy decode never reaches this function. */
/** The words a writer actually chose for a beat's picture.
 *
 * A `spec` is the author's; the camera, lens, ambiance and no-text rules that
 * the prompt builders append are the engine's, identical on every prompt, and
 * cannot depict anybody. Only the former is tested against the post's forbidden
 * names — see promptIssues. A beat that carries a hand-written `prompt` instead
 * of a `spec` returns null, so that prompt keeps being checked in full. */
export function authoredText(visual) {
  const spec = visual?.spec;
  if (!spec || typeof spec !== "object") return null;
  return Object.values(spec).filter((v) => typeof v === "string").join(" ");
}

export const windowedScript = (model, lang) => `
from faster_whisper import WhisperModel
import json, sys, os, subprocess, tempfile
WIN, OVERLAP = 12.0, 4.0
wav, out = sys.argv[1], sys.argv[2]
dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",wav],
                           capture_output=True, text=True, check=True).stdout.strip())
m = WhisperModel("${model}", device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
words, start, tmp = [], 0.0, tempfile.mkdtemp()
while start < dur - 0.05:
    length = min(WIN, dur - start)
    piece = os.path.join(tmp, "w%d.wav" % int(start * 100))
    subprocess.run(["ffmpeg","-v","error","-y","-ss","%.3f" % start,"-t","%.3f" % length,"-i",wav,piece], check=True)
    segs, _ = m.transcribe(piece, word_timestamps=True, language="${lang}", beam_size=1, condition_on_previous_text=False)
    for s in segs:
        for w in s.words:
            ws, we = w.start + start, w.end + start
            if words and ws < words[-1]["e"] - 0.02: continue
            words.append({"w": w.word.strip(), "s": round(ws, 3), "e": round(we, 3)})
    start += WIN - OVERLAP
json.dump(words, open(out, "w"))
print(len(words))
`;

export function anchorToScript(heard, scriptWords, { floor = ALIGN_FLOOR } = {}) {
  if (!heard.length) throw new Error("alignment heard nothing at all — the narration is silent or unreadable");
  const A = scriptWords.map(alignKey);
  const B = heard.map((h) => alignKey(h.w));
  // LCS table. A 200-word script against ~200 tokens is 40k cells: free.
  const dp = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1));
  for (let i = A.length - 1; i >= 0; i--)
    for (let j = B.length - 1; j >= 0; j--)
      dp[i][j] = A[i] && A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const out = scriptWords.map((w) => ({ w, s: null, e: null }));
  let i = 0, j = 0, anchors = 0;
  while (i < A.length && j < B.length) {
    if (A[i] && A[i] === B[j]) {
      out[i].s = heard[j].s;
      out[i].e = heard[j].e;
      out[i].anchored = true;
      anchors++;
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }

  /* The floor is deliberately low. Whisper mishears names, splits contractions
     and invents tokens over trailing silence; two thirds of a script recognised
     in order is a voice reading that script badly heard, and a voice reading a
     different one lands nowhere near it. */
  /* `floor: 0` is how alignWords asks for the numbers without a verdict: it
     wants to know how the decode went so it can decide whether to re-read the
     audio in windows before anyone concludes the voice is wrong. The verdict
     itself moved there, where both decodes are in hand. */
  const coverage = anchors / scriptWords.length;
  if (floor > 0 && coverage < floor)
    throw new Error(
      `alignment recognised only ${anchors} of ${scriptWords.length} script words ` +
        `(${(coverage * 100).toFixed(0)}%, floor ${(floor * 100).toFixed(0)}%) — the voice said something the script does not, ` +
        "listen to voice2_raw.wav before publishing"
    );

  // Fill the gaps: interpolate inside, extrapolate at the ends, keep it monotonic.
  const known = out.map((o, k) => (o.s === null ? -1 : k)).filter((k) => k >= 0);
  const first = known[0], last = known.at(-1);
  const span = out[last].e - out[first].s;
  const per = span > 0 ? span / Math.max(1, last - first) : 0.3;
  for (let k = first - 1; k >= 0; k--) {
    out[k].e = out[k + 1].s;
    out[k].s = Math.max(0, out[k].e - per);
  }
  for (let k = last + 1; k < out.length; k++) {
    out[k].s = out[k - 1].e;
    out[k].e = out[k].s + per;
  }
  for (let a = 0; a < known.length - 1; a++) {
    const lo = known[a], hi = known[a + 1];
    if (hi === lo + 1) continue;
    const step = (out[hi].s - out[lo].e) / (hi - lo);
    for (let k = lo + 1; k < hi; k++) {
      out[k].s = out[lo].e + step * (k - lo - 1);
      out[k].e = out[lo].e + step * (k - lo);
    }
  }
  return out;
}

/* ------------------------------ the beats -------------------------------- */

/* ---------------------- the silent build (no TTS) ------------------------
 *
 * Added 2026-09-02, live, on Hasan's instruction, because the media key died
 * and two publishing slots had already been lost to it. Every paid surface on
 * this account comes through one key: the voice, the stills and the clip. With
 * it dead the choice is not "a cheaper Reel", it is a Reel with no narration at
 * all — so the words move from the ear to the eye. The karaoke was already
 * built for the 85% who watch on mute; here it carries the whole story, over
 * receipts, real credited photographs and typographic cards, with the mood bed
 * as the only sound.
 *
 * Nothing about the format's arithmetic changes: the same word window, the same
 * 55.6s of "speech", the same 3s end-card, the same 60-second file. What would
 * normally be measured off the voice is derived from the word counts instead,
 * which is exactly what the gate's window already assumes. This path buys
 * nothing, so it can never be the reason a build costs money, and it is opt-in
 * (OOM_SILENT=1): a run with a working key never reaches it.
 */
const SILENT = process.env.OOM_SILENT === "1";

/** The clock a silent build reads instead of Whisper's.
 *
 * Words are spread evenly over the speech budget at the voice's own measured
 * pace, with a short breath between beats so a picture is not cut on the last
 * syllable. Same shape as the aligner's output: { w, s, e }. */
export function silentWordClock(beats, budget, { pause = 0.32 } = {}) {
  const per = beats.map((b) => String(b.script).trim().split(/\s+/).filter(Boolean));
  const n = per.reduce((a, w) => a + w.length, 0);
  if (!n) throw new Error("silent clock: the beats carry no words");
  const pauses = pause * Math.max(0, beats.length - 1);
  const dt = (budget - pauses) / n;
  if (dt <= 0.08) throw new Error(`silent clock: ${n} words do not fit in ${budget}s`);
  const out = [];
  let t = 0;
  per.forEach((ws, bi) => {
    for (const w of ws) {
      out.push({ w, s: Number(t.toFixed(3)), e: Number((t + dt * 0.94).toFixed(3)) });
      t += dt;
    }
    if (bi < per.length - 1) t += pause;
  });
  return out;
}

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
 *
 * Recomputed on 2026-07-31 from the caption face's own metrics rather than by
 * eye: OOM Caption averages 0.58 em per uppercase character, so a line holds
 * `usable_width / (0.58 × size)`. The captions went from 86px to 104px because
 * they were hard to read on a phone, and a bigger face holds fewer characters —
 * the two numbers below move together and neither may be raised alone. The
 * chunker also drops from four words to three for the same reason; a shorter
 * caption is read faster, which is the point of having one.
 *
 * Raised again 2026-08-10 (Hasan: bigger captions) — sizes went 104→112 and
 * 78→88, and the caps moved WITH them, scaled off the proven point rather
 * than the 0.58 estimate: 18 chars at 104px shipped daily without a clipped
 * frame, and the measured overflow ("about 24 characters" at 104, the
 * 2026-07-29 near-ship) scales to ~22 at 112px, so 18 keeps its margin.
 * The low band's 26-at-78 becomes 23-at-88 by the same arithmetic. Verified
 * on rendered frames, not just arithmetic, before landing. */
const KARAOKE_MAX_CHARS = 18;
const KARAOKE_MAX_CHARS_LOW = 23;
const KARAOKE_MAX_WORDS = 3;

/** Uppercase Anton runs about 0.47em wide, so the frame's 952 usable pixels
 * hold roughly `952 / (0.47 * size)` characters on a line. The hook card is
 * allowed two lines and no more: three lines of display type is a poster, not
 * an audition frame. Sizes step down rather than scaling continuously so the
 * card keeps a recognisable weight from Reel to Reel.
 *
 * The ladder moved up one notch on 2026-08-10 (Hasan: bigger on-screen text)
 * — the fit function is what makes that safe: a title that no longer fits a
 * rung at the new size simply takes the rung below, and the two-line ceiling
 * holds either way. The fallback stays 74, because it is the only rung that
 * holds the gate's 52-character worst case (74px holds 54 characters over
 * two lines; 78px holds 50, and a title the gate accepted must never walk
 * off the card). */
export function titleFontSize(title) {
  const len = String(title || "").length;
  const fits = (size) => len <= Math.floor((952 / (0.47 * size)) * 2);
  for (const size of [124, 112, 100, 88]) if (fits(size)) return size;
  return 74;
}

export function buildAss(words, beats, ranges, accentHex, opts = {}) {
  const accent = hexToAss(accentHex);
  const titleSize = titleFontSize(opts.title);
  const wordsOfBeats = (pred) => new Set(ranges.filter((_, i) => pred(beats[i])).flatMap((r) => {
    const list = [];
    for (let i = r.start; i <= r.end; i++) list.push(i);
    return list;
  }));
  const lowBeats = wordsOfBeats((b) => b.visual?.type === "screenshot");
  /* A card beat carries its own type, so the karaoke stays off it. Rendered
   * together the first time, the figure, its line and the caption stacked into
   * three blocks of text saying the same thing — the card printed "141 006 /
   * sessions d'évaluation relues" and the caption underneath read "SESSIONS
   * RELUES". The voice still speaks; the screen shows one thing. */
  /* A SILENT build has no voice to say the sentence the card is illustrating,
     so silencing the karaoke there would leave the beat with no words at all —
     seven to eleven seconds of a figure and nothing else. The stacking this
     guards against is the lesser evil; in a silent build the karaoke IS the
     story. */
  const cardWords = SILENT ? new Set() : wordsOfBeats((b) => b.visual?.type === "card");
  const head = [
    "[Script Info]", `PlayResX: ${W}`, `PlayResY: ${H}`, "WrapStyle: 2", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    // K sits at MarginV 560 — lower-middle, clear of both the receipt card art
    // and the platform's bottom band. KLOW is the screenshot-beat band, and its
    // MarginV moved 170 → 350 on 2026-08-10: at 170 the captions sat inside the
    // ~320px strip Instagram covers with its own caption and actions UI, which
    // is why they read as "too low" on a phone while looking fine in the raw
    // file (Hasan, 2026-08-10). 350 clears the platform band; the receipt card
    // it must also clear got 100px shorter in segmentFromScreenshot the same
    // day, so the band still never touches the page it captions.
    `Style: K,OOM Caption,112,${accent},&H00FFFFFF,&H00101010,&H96000000,0,0,0,0,100,100,0,0,1,8,4,2,60,60,560,1`,
    `Style: KLOW,OOM Caption,88,${accent},&H00FFFFFF,&H00101010,&H96000000,0,0,0,0,100,100,0,0,1,7,4,2,30,30,350,1`,
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
    `Style: TITLE,OOM Display,${titleSize},&H00FFFFFF,&H00FFFFFF,&H00101010,&HB4000000,0,0,0,0,100,100,0,0,3,18,0,8,64,64,300,1`,
    `Style: CARDBIG,OOM Display Wide,150,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,0,0,0,0,100,100,0,0,1,0,0,5,70,70,0,1`,
    `Style: CARDLINE,OOM Caption,58,${accent},&H00FFFFFF,&H00101010,&H96000000,0,0,0,0,100,100,1,0,1,0,0,5,90,90,0,1`,
    `Style: ENDBIG,OOM Display Wide,104,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,0,0,0,0,100,100,2,0,1,3,2,5,70,70,0,1`,
    `Style: ENDFOLLOW,OOM Caption,68,${accent},&H00FFFFFF,&H00101010,&H96000000,0,0,0,0,100,100,1,0,1,3,2,5,70,70,0,1`,
    // The countdown corner: top-right, below the platform's camera icon
    // (~110px) and above the title box (MarginV 300) and both receipt-card
    // tops (y 230 and 320), so it never sits on anything that matters. Digits
    // at 84px in the display face, slightly translucent so it reads as
    // chrome, not as content.
    `Style: COUNT,OOM Display,84,&H26FFFFFF,&H00FFFFFF,&H00101010,&H78000000,0,0,0,0,100,100,0,0,1,3,0,9,0,48,132,1`,
    "", "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const fixed = [];
  if (opts.title) {
    const tEnd = Math.min(3.2, Math.max(2.2, words[0] ? (ranges[0] ? words[Math.min(ranges[0].end, words.length - 1)].e : 3.2) : 3.2));
    const text = String(opts.title).toUpperCase().replace(/\\/g, "").replace(/[{}]/g, "");
    fixed.push(`Dialogue: 1,${assTime(0)},${assTime(tEnd)},TITLE,,0,0,0,,{\\q1\\fad(0,220)}${text}`);
  }
  // Cards print inside their own beat's window, taken from the word clock like
  // everything else on this timeline.
  beats.forEach((b, i) => {
    if ((b.visual?.type) !== "card") return;
    const r = ranges[i];
    if (!r || !words[r.start] || !words[r.end]) return;
    const t0 = assTime(Math.max(0, words[r.start].s - 0.05));
    const t1 = assTime(words[r.end].e + 0.22);
    const clean = (v) => String(v || "").replace(/\\/g, "").replace(/[{}]/g, "").toUpperCase();
    const value = clean(b.visual.value);
    const label = clean(b.visual.label);
    if (value) fixed.push(`Dialogue: 1,${t0},${t1},CARDBIG,,0,0,0,,{\\q2\\fad(180,120)\\pos(${W / 2},${Math.round(H * 0.40)})}${value}`);
    if (label) fixed.push(`Dialogue: 1,${t0},${t1},CARDLINE,,0,0,0,,{\\q1\\fad(180,120)\\pos(${W / 2},${Math.round(H * 0.53)})}${label}`);
  });

  if (opts.endcard) {
    const { from, dur } = opts.endcard;
    const t0 = assTime(from), t1 = assTime(from + dur);
    // Four positioned lines rather than two wrapped ones: the wrap point of a
    // display face is not something to leave to the renderer on the one frame
    // that asks the viewer for something.
    const lines = [
      [END_PROMISE[0], "ENDBIG", 0.335],
      [END_PROMISE[1], "ENDBIG", 0.425],
      [END_ASK[0], "ENDFOLLOW", 0.565],
      [END_ASK[1], "ENDFOLLOW", 0.635],
    ];
    for (const [text, style, yFrac] of lines) {
      fixed.push(`Dialogue: 1,${t0},${t1},${style},,0,0,0,,{\\q2\\fad(160,0)\\pos(${W / 2},${Math.round(H * yFrac)})}${text}`);
    }
  }

  /* The countdown, one Dialogue a second on its own layer, counting the
   * seconds actually in the file — so a clamped 62-second build honestly says
   * 62, because a chrono that lies is worse than none on an account whose
   * whole promise is that nothing on screen is invented. It runs through the
   * end-card to zero out exactly at the cut. See format.mjs COUNTDOWN for why
   * this is a flag and how its effect on retention gets measured. */
  if (opts.countdown && opts.endcard) {
    const totalS = opts.endcard.from + opts.endcard.dur;
    const n = Math.round(totalS);
    for (let s = 0; s < n; s++) {
      fixed.push(`Dialogue: 2,${assTime(s)},${assTime(Math.min(s + 1, totalS))},COUNT,,0,0,0,,{\\q2}${n - s}`);
    }
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
    if (cardWords.has(i)) { if (chunk.length) { chunks.push(chunk); chunk = []; } return; }
    if (chunk.length && chunkChars(chunk) + 1 + word.w.length > capFor(chunk[0].i)) { chunks.push(chunk); chunk = []; }
    chunk.push({ word, i });
    if (chunk.length >= KARAOKE_MAX_WORDS || /[,.]$/.test(word.w)) { chunks.push(chunk); chunk = []; }
  });
  if (chunk.length) chunks.push(chunk);
  // A lone word makes a caption that flickers; give it back to its sentence —
  // unless the reunion itself would overflow the line, or the two chunks are
  // not adjacent words. The adjacency check is what keeps a merged line from
  // spanning a silenced card beat: the last word before the card and the first
  // word after it are neighbours in `chunks` but not on the clock, and a line
  // built from both ("APRÈS PHOENIX", 2026-08-05) sits on screen for the whole
  // card as a nonsense caption the card silencing was meant to prevent.
  for (let i = chunks.length - 1; i > 0; i--) {
    if (chunks[i].length === 1 && chunks[i - 1].length < KARAOKE_MAX_WORDS + 1 &&
        chunks[i][0].i === chunks[i - 1].at(-1).i + 1 &&
        chunkChars(chunks[i - 1]) + 1 + chunkChars(chunks[i]) <= capFor(chunks[i - 1][0].i)) {
      chunks[i - 1].push(...chunks[i]);
      chunks.splice(i, 1);
    }
  }
  const events = chunks.map((ch) => {
    const style = lowBeats.has(ch[0].i) ? "KLOW" : "K";
    const parts = ch.map(({ word }) => {
      const cs = Math.max(4, Math.round((word.e - word.s) * 100));
      /* Sentence punctuation is dropped so the karaoke reads as speech, not as
         a transcript. It used to be dropped EVERYWHERE in the token, which
         quietly rewrote every decimal the account has ever spoken: "99.1%"
         was burned onto the frame as "991%" and "12.3 milliards" as "123
         milliards" (measured 2026-09-02, on the card beats of the first
         silent build — invisible until then because the karaoke is normally
         silenced over a card). A figure on screen is a claim, and this one
         was multiplying claims by ten. Strip only the edges of the token. */
      return `{\\k${cs}}` + word.w.toUpperCase().replace(/^[,.]+|[,.]+$/g, "");
    });
    return `Dialogue: 0,${assTime(ch[0].word.s)},${assTime(ch.at(-1).word.e + 0.06)},${style},,0,0,0,,${parts.join(" ")}`;
  });
  return head.concat(events).concat(fixed).join("\n");
}

/* ------------------------------ visuals ---------------------------------- */

/**
 * Two attempts, and a longer patience on the second.
 *
 * A build on 2026-07-31 died on `page.goto: Timeout 30000ms exceeded` against a
 * page that had screenshotted fine an hour earlier — the narration was already
 * bought and the run was over. A receipt page being slow once is weather, not a
 * finding, and it must not cost a Reel.
 */
/**
 * The consent-dialog selectors, exported so the cross-frame click is testable
 * without a browser. `:has-text()` is a substring match and case-insensitive,
 * so "Agree" covers "I Agree" and "AGREE".
 */
export const CONSENT_SELECTORS = [
  'button:has-text("Accept")',
  'button:has-text("Agree")',
  'a:has-text("Agree")',
  '[role="button"]:has-text("Agree")',
  'button:has-text("Zustimmen")',
  ".fc-cta-consent",
];

async function screenshot(url, outFile, attempt = 1) {
  try {
    return await screenshotOnce(url, outFile, attempt === 1 ? 30_000 : 60_000);
  } catch (err) {
    if (attempt >= 2) throw err;
    console.log(`screenshot of ${url} failed (${err.message.split("\n")[0]}) — one more try with a longer wait`);
    await new Promise((r) => setTimeout(r, 4000));
    return screenshot(url, outFile, attempt + 1);
  }
}

async function screenshotOnce(url, outFile, gotoTimeout) {
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
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: gotoTimeout });
    await page.waitForTimeout(2500);
    // Consent dialogs live in an iframe as often as not, and a locator on the
    // page only ever searches the main frame. On 2026-08-01 the Decoder receipt
    // came back as a full-frame GDPR wall — "We and our 193 partners…", the two
    // green buttons, and the headline nowhere — because its CMP is framed and
    // every selector below silently missed it. That shot was the Reel's opening
    // beat, which is the audition frame and the grid thumbnail, and it passed
    // every automated check. So click in every frame, not just the top one.
    // And a consent layer that has not rendered yet cannot be clicked. On
    // 2026-08-03 euronews.com came back as a blank white page: its CMP mounts
    // late, so at 2.5s there was nothing to click and nothing to strip, and by
    // the time the shot was taken the white modal covered the article. One
    // extra pass a couple of seconds later costs nothing when there is no
    // banner (every click simply finds nothing) and saves the beat when the
    // banner is slow. Measured: the same URL renders the headline, the byline
    // and the standfirst once the second pass clicks "Agree and close".
    for (const pass of [0, 1]) {
      if (pass) await page.waitForTimeout(2000);
      for (const frame of page.frames()) {
        for (const sel of CONSENT_SELECTORS) {
          try { await frame.locator(sel).first().click({ timeout: 1200 }); } catch { /* no banner is the good case */ }
        }
      }
    }
    await page.waitForTimeout(800);
    // Belt and braces: whatever survived the clicks and still covers the page
    // is not journalism. A consent wall is always fixed or sticky and always
    // large, so removing large fixed overlays leaves the article behind it.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" && cs.position !== "sticky") continue;
        const r = el.getBoundingClientRect();
        if (r.height > 350 && r.width > 250) el.remove();
      }
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }).catch(() => {});
    // The receipt is the page's journalism, not its ad inventory: a Norton
    // banner shipped inside the TechCrunch receipt on the first live Reel.
    // Heuristic and best-effort — a hidden ad leaves a gap, which reads fine.
    //
    // `video` is hidden for a different reason, found on 2026-07-31: this
    // Chromium has no proprietary codecs, so a local-news page's embedded
    // player renders as a black rectangle with "DEMUXER_ERROR_NO_SUPPORTED_
    // STREAMS / FFmpegDemuxer: no supported streams" printed across it. That
    // shipped into a built Reel's Action News 5 receipt, sitting between the
    // headline and the byline, and no automated check could see it: the
    // screenshot succeeded, the page was the right one, the crop was correct.
    // A receipt exists to show the headline, never the outlet's video, so the
    // player is dropped like an ad and leaves the same harmless gap.
    await page.addStyleTag({
      content:
        '[id*="google_ads"],[id^="ad-"],[class*="advert"],[class^="ad-"],[class*=" ad-"],' +
        'ins.adsbygoogle,iframe[src*="ads"],iframe[src*="doubleclick"],[data-ad],[data-ad-unit],' +
        '[id*="taboola"],[class*="outbrain"],[class*="sponsor"],[id*="sponsor"],' +
        '[aria-label*="advertisement" i],' +
        'video,[class*="video-player"],[class*="videoPlayer"],[id*="video-player"],' +
        // Digital Trends, 2026-08-01: a float player captioned "Ad Loading" sat
        // across the headline in two consecutive receipts, and a Google One Tap
        // card covered the paragraph under it. Neither matched anything above:
        // the player is a generic `[class*=player]` wrapper with no `video` in
        // it while it is still loading its ad, and One Tap is a same-origin
        // iframe named after credentials rather than after advertising. A
        // receipt is the page's journalism; both of these are the page asking
        // for something.
        '[class*="player"],[id*="player"],[class*="jw-"],[id*="connatix"],[class*="cnx_"],' +
        '[id*="credential_picker"],iframe[src*="accounts.google.com"],[class*="one-tap"],' +
        '[class*="onetap"],[aria-label*="sign in" i]' +
        '{display:none!important;visibility:hidden!important}',
    }).catch(() => {});
    // ...and CSS is not enough on its own. Action News 5 mounts its player
    // inside a shadow root (`div.powa-shadow`), which an injected stylesheet
    // does not cross, so the black error slab survived the rule above and was
    // still sitting in the middle of the receipt. Remove the nodes outright,
    // shadow hosts included, before anything measures the layout.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("video,audio")) el.remove();
      const hosts = [];
      const walk = (root) => {
        for (const el of root.querySelectorAll("*")) {
          if (!el.shadowRoot) continue;
          if (el.shadowRoot.querySelector("video,audio")) hosts.push(el);
          else walk(el.shadowRoot);
        }
      };
      walk(document);
      for (const el of hosts) el.remove();
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
  const cw = W * SUPERSAMPLE, ch = H * SUPERSAMPLE;
  const z = variant === 1 ? `1.26+0.06*on/${frames}` : `1+0.07*on/${frames}`;
  const x = "iw/2-(iw/zoom/2)";
  const y = variant === 1 ? "ih-ih/zoom" : "ih/2-(ih/zoom/2)";
  return (
    `scale=${cw}:${ch}:force_original_aspect_ratio=increase,crop=${cw}:${ch},` +
    `zoompan=z='${z}':x='${x}':y='${y}':d=${frames}:s=${W}x${H}:fps=${FPS},setsar=1`
  );
}

/**
 * What a bought narration is keyed on: everything that decides how it sounds.
 *
 * Exported so the rule is tested against the real function and not a copy of it
 * in the test file — the same reason `latestBy` is exported from state.mjs. The
 * failure this guards against is silent and public: a reading reused for a
 * script it does not say. So the key is the whole input, not a summary of it,
 * and any edit anywhere in any beat produces a different key and a cache that is
 * simply absent.
 */
export function voiceCacheKey({ narration, voice, lang, style = "" }) {
  return createHash("sha256").update(JSON.stringify([narration, voice, lang, style])).digest("hex").slice(0, 16);
}

/** Every segment is encoded identically so the concat demuxer's `-c copy` stays
 * valid — the same reason the end-card is encoded rather than generated inline. */
const ENC = ["-r", String(FPS), "-c:v", "libx264", "-preset", "fast", "-crf", "18"];

/**
 * How many segments may render at once.
 *
 * Read from the machine, never assumed. This code runs on a 20-core workstation
 * when a human is testing and on whatever a cloud routine is given at 18:36, and
 * the wrong constant is bad in both directions: too low wastes most of a build's
 * wall-clock, too high gets an ffmpeg killed by the kernel halfway through a
 * Reel that has already been paid for.
 *
 * Two limits, whichever is stricter. Cores, because a supersampled `zoompan`
 * uses about 1.5 of them; memory, because each render peaks near 1.8 GB and a
 * container's ceiling is not its host's. `os.totalmem()` reports the HOST in a
 * container, so the cgroup file is read first and only falls back to the OS
 * when there is none. Three is the cap: measured on the day's real beats,
 * three-at-a-time was 2.06x and five only 2.41x, for double the memory.
 *
 * One is always allowed. A single-core container simply behaves as it did
 * before this existed.
 */
function renderConcurrency() {
  const cores = Math.floor((os.availableParallelism?.() ?? os.cpus()?.length ?? 2) / 2);
  let free = os.freemem();
  for (const p of ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"]) {
    try {
      const raw = readFileSync(p, "utf8").trim();
      // "max" means no cgroup ceiling; a limit far past the host's RAM means the
      // same thing written as a number.
      if (raw !== "max" && Number(raw) > 0 && Number(raw) < os.totalmem()) free = Math.min(free, Number(raw) * 0.6);
    } catch { /* no cgroup here, or not readable: the OS numbers stand */ }
  }
  const byMemory = Math.floor(free / (2.2 * 1024 ** 3));
  const n = Math.max(1, Math.min(3, cores, byMemory));
  return Number(process.env.REEL_RENDER_JOBS) > 0 ? Number(process.env.REEL_RENDER_JOBS) : n;
}

/**
 * Run the beat renders, several at a time, and report each as it lands.
 *
 * A failure must not be swallowed by the ones still running: the first rejection
 * is re-thrown after the pool drains, so the build stops with the real error
 * instead of a later, stranger one about a missing segment. The journal records
 * completion order, which is the honest thing for a flight recorder to hold —
 * if the run dies mid-render, what it wrote is what had actually finished.
 */
export async function renderAll(renders, beats) {
  /* Count against the beats, not against `renders.length`: a sparse array is as
     long as its highest assigned index, so a missing LAST render would make the
     two agree and the hole would only surface later as a missing segment file. */
  const jobs = Array.from({ length: beats.length }, (_, i) => ({ fn: renders[i], i }))
    .filter((j) => typeof j.fn === "function");
  if (jobs.length !== beats.length)
    throw new Error(`internal: ${beats.length - jobs.length} beat(s) produced no render step — this is a bug in the engine, not a problem with the spec`);
  const n = renderConcurrency();
  console.log(`rendering ${jobs.length} beats, ${n} at a time`);
  const queue = [...jobs];
  let failure = null;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (queue.length) {
        const job = queue.shift();
        if (failure) return;                     // stop starting new work once one has failed
        try {
          await job.fn();
          await journal(`beat ${job.i} rendered: ${beats[job.i]?.visual?.type || "image"}`);
        } catch (err) {
          failure ??= err;
          return;
        }
      }
    })
  );
  if (failure) throw failure;
}

/**
 * The one encode that ends up in the repository, and it is not the one the
 * segments use.
 *
 * Every published reel.mp4 is committed forever, because Instagram fetches the
 * URL server-side at publish time. That is 19 MB a day at the segments' CRF 18,
 * which is 0.7 GB a month and 8.6 GB a year of history that every cloud run
 * clones before it can start working. Measured on 2026-07-31 on the hardest
 * frame the account produces — fine green terminal type on black, under
 * karaoke: CRF 18 gives 19.06 MB, CRF 22 gives 11.35 MB, and at 100% zoom they
 * are indistinguishable. 21 keeps a margin for the harder motion a Veo beat can
 * contain and still cuts about a third of the weight.
 *
 * The intermediate segments stay at 18 on purpose: they are re-encoded once by
 * the subtitle burn, and starting lossier there would compound.
 */
const FINAL_CRF = "21";

async function concatSegments(parts, outFile) {
  const list = outFile.replace(/\.mp4$/, "_parts.txt");
  await writeFile(list, parts.map((f) => `file '${path.resolve(f)}'`).join("\n"));
  await ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", outFile]);
}

/** A still, panned and zoomed just enough to never sit still — and re-framed
 * once if the beat is long enough that drift alone would read as a freeze.
 *
 * No `-loop 1`. `zoompan` generates all `d` output frames from a single input
 * frame, so looping the image only fed the graph hundreds of copies that the
 * `scale` in front of it dutifully enlarged to 4320x7680 before `zoompan` threw
 * them away. Removing it leaves the output byte-for-byte identical — verified on
 * 2026-07-31 by comparing the md5 of the decoded stream, and across seven beat
 * durations for frame count — while peak memory falls from 3.6 GB to 1.8 GB per
 * render. That halving is what makes several renders at once safe on a container
 * whose size this code does not get to know.
 */
export async function segmentFromImage(img, dur, outFile, extraFilters = []) {
  const shot = async (d, variant, out) =>
    ffmpeg(["-y", "-i", img, "-t", String(d),
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
  // 880x1150 at x=100,y~230 ends by ~1380, and the KLOW caption band (top
  // ~1460 since its MarginV moved to 350 on 2026-08-10) can never collide
  // with it. The first live Reel proved the alternative — position the
  // captions in a fixed place under a card of page-dependent height, and some
  // page's headline will eventually sit exactly there. The card lost its
  // bottom 100px when the band moved up; that strip is the least evidentiary
  // part of a receipt — the 2026-08-10 businesstoday capture filled it with
  // an empty grey ADVERTISEMENT slot — and the headline zone is untouched.
  //
  // Variant 1 is a push-in on the same receipt: the page is scaled wider and
  // cropped shorter, so the headline fills more of the frame. A receipt beat is
  // often the attaque, which is the longest beat in a 60-second Reel — the
  // opener of the 31 July build ran 9.2 seconds — and a card that only drifts
  // 80 pixels in nine seconds is a still photograph of a webpage. Both variants
  // keep the card's bottom edge well above the caption band.
  const shotAt = async (d, variant, out) => {
    const CARD_W = variant === 1 ? 1000 : 880;
    const CARD_H = variant === 1 ? 1000 : 1150;
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
          // A FIXED y. The drift that used to live here moved 80 pixels over a
        // beat, which is well under one pixel per frame, and overlay rounds y
        // down: measured, the card froze for three or four frames and then
        // jumped two. A card that does not move at all is stable, and the
        // mid-beat re-frame below is what stops it being static.
        `[bgb][card]overlay=x=${x}:y=${y0}[v]`,
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
      `drawtext=fontfile=${UI_FONT}:textfile=${creditFile}:fontsize=26:fontcolor=white@0.72:x=48:y=${H - 400}:shadowcolor=black@0.7:shadowx=2:shadowy=2`
    );
  }
  // A photograph gets the same re-framing as a still, credit burned on both
  // shots: a licence you cannot see on screen is a licence you are not honouring.
  await segmentFromImage(img, dur, outFile, extra);
}

/**
 * A typographic card: the brand's ground, with the beat's figure and its line
 * printed over it by the ASS layer. It costs nothing and it is the answer to a
 * problem that had been solved with wallpaper.
 *
 * Hasan, 2026-07-31, on the Reel built that afternoon: *"à la fin quand on voit
 * un verre d'eau et un smartphone à côté, franchement c'est pas au niveau,
 * pourquoi on regarde un smartphone et un verre d'eau posé sur une table ? Il
 * faut vraiment mieux choisir ce qu'on montre."* Six of that Reel's eight beats
 * showed nothing from the story: a laptop on a table, stacks of paper, a door
 * ajar, a phone beside a glass of water. Not one of them was in the news.
 *
 * The cause was structural, not editorial. Receipts are capped at two and real
 * photographs only exist for some subjects, so everything else got filled with
 * whatever a generated still could safely depict — which is furniture. A card
 * gives the writer a fourth surface that is always available, always about the
 * story (it prints its own figures, which the gate holds to the evidence like
 * every other digit), and looks designed rather than bought.
 *
 * The ground is a flat colour and it stays one: the first cut ran a push-in
 * over it, which is eight megapixels a frame of arithmetic producing an
 * identical image, because a solid colour zoomed is the same solid colour. The
 * movement a card needs is the cut into it and the type fading up; both are
 * free.
 */
async function segmentCard(dur, outFile) {
  await ffmpeg([
    "-y", "-f", "lavfi", "-i", `color=c=${BG_HEX}:s=${W}x${H}:r=${FPS}:d=${dur}`,
    "-pix_fmt", "yuv420p", ...ENC, outFile,
  ]);
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
/**
 * A beat may want more seconds than the clip has. Veo's ceiling is 8 and the
 * purchase ladder stops there, so any beat that speaks for longer used to end
 * on a frozen frame — `tpad=stop_mode=clone` holds the last picture for the
 * remainder. 2026-07-31's two builds both did it, by 0.30s and 0.23s: small
 * enough to read as a stutter rather than a fault, which is exactly why it
 * survived three days of watching the output.
 *
 * Retiming is the honest repair. Slowing an ambient shot by up to 15% is not
 * perceptible — there is no lip movement to desynchronise and no cut to soften
 * — and it fills the beat with motion instead of a still. `setpts` runs before
 * `framerate` so the blend resamples the stretched timeline, not the original.
 * `tpad` stays as the last resort for the case the gate is supposed to have
 * already refused.
 */
async function segmentFromVideo(clip, dur, outFile) {
  let stretch = 1;
  try {
    const have = Number((await ffprobe(clip)).format.duration);
    if (Number.isFinite(have) && have > 0.5 && dur > have)
      stretch = Math.min(dur / have, VEO_STRETCH_MAX);
  } catch {
    /* Unreadable duration is not a reason to fail a build that has already been
       paid for: fall through to the old behaviour, which is a freeze at worst. */
  }
  const retime = stretch > 1.001 ? `setpts=${stretch.toFixed(5)}*PTS,` : "";
  // `framerate` resamples by blending neighbours; without it, -r would simply
  // duplicate frames and Veo's native 24 against the timeline's 30 produced a
  // freeze roughly once every four frames.
  await ffmpeg([
    "-y", "-i", clip, "-t", String(dur),
    "-vf", `${retime}framerate=fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},tpad=stop_mode=clone:stop_duration=${dur},setsar=1`,
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

/**
 * The French news direction, at module level so a calibration run can buy a
 * reading with exactly the text the engine ships. It used to be a local inside
 * the build, which meant any tool measuring the voice was measuring a copy.
 */
export const FR_DIRECTION = [
    "Profil: presentateur francais de flash info technologique, voix masculine posee, sure d'elle, jamais souriante.",
    "Scene: studio radio, micro proche, aucune reverberation, aucun bruit de fond.",
    "Notes du realisateur: DEBIT RAPIDE de flash info, environ 200 mots par minute, jamais lent, jamais solennel. Accent francais de France standard. Attaque la toute premiere phrase net et pleine puissance, sans respiration prealable et sans montee progressive, comme si le sujet etait deja commence. Descends legerement le ton en fin de phrase au lieu de le monter. Respire seulement entre les paragraphes, et brievement. Appuie tres legerement les chiffres et les noms propres, rien d'autre. Aucune emphase theatrale, aucun enthousiasme publicitaire, aucun sourire dans la voix.",
    "Lis maintenant ce texte exactement tel qu'il est ecrit, sans rien ajouter:",
  ].join("\n");

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
     style prompt is English and steers the accent wrong — and Sadaltager
     (Google's "Lively" voice) as the default register, chosen by ear on
     2026-07-31 over Charon's "Informative". Gemini TTS has a documented
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
  const frStyle = FR_DIRECTION;
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
    /* Sadaltager since 2026-07-31, Hasan's ear: "je veux la voix F à partir de
     maintenant". A single A/B reading suggested 3.49 words a second; measuring
     it properly with calibrate-voice.mjs gave 3.22, 3.34, 3.44 — a median of
     3.34, five percent slower than the anecdote. That is why the ledger is
     filtered by voice and why a voice change is calibrated before the next run
     and not after it. */
  const voiceName = plan.voice || (lang === "fr" ? "Sadaltager" : "Fenrir");
  const rawWav = path.join(mediaDir, "voice2_raw.wav");
  let voice = null, tempo = 0, rate = 0;

  /*
   * A narration already bought for exactly this text is not bought again.
   *
   * On 2026-07-31 the day's Reel was built five times: once because Chromium
   * died mid-screenshot, once because a photograph turned out to be a derelict
   * building, twice more to get a broken video player off a receipt. The script
   * stopped changing after the second build. Each rebuild bought two or three
   * fresh readings anyway — eleven in all, six of them refused for tempo — and
   * ran Whisper over each one. That is most of the run's narration spend and
   * several minutes of its wall clock, paid to hear the same words again
   * because a picture was wrong.
   *
   * The key is everything that decides the audio: the narration text, the voice,
   * the language, the direction. A photo, a prompt or a screenshot's CSS
   * changing leaves the reading valid. Any edit to any script changes the key
   * and the cache is simply absent — there is no staleness to reason about,
   * which is the point of hashing the input rather than trusting a timestamp.
   */
  const voiceKey = voiceCacheKey({ narration, voice: voiceName, lang, style: lang === "fr" ? frStyle : "" });
  const voiceKeyFile = path.join(mediaDir, "voice2_raw.key");
  if (SILENT) {
    /* No reading is bought and none is faked: the track is real silence, and
       the words are timed on the same budget a reading would have been
       stretched onto. */
    voice = { file: rawWav, seconds: SPEECH_S, usd: 0 };
    tempo = 1;
    rate = scriptWords.length / SPEECH_S;
    console.log(
      `voice: SILENT build — nothing bought. ${scriptWords.length} words timed at ${rate.toFixed(2)} w/s ` +
        `over ${SPEECH_S}s; the karaoke carries the story.`
    );
    await journal(`silent build: no narration bought, ${scriptWords.length} words timed at ${rate.toFixed(2)} w/s`);
  }
  if (!SILENT && (await readFile(voiceKeyFile, "utf8").catch(() => "")).trim() === voiceKey) {
    const probed = await ffprobe(rawWav).then((p) => Number(p.format.duration)).catch(() => 0);
    const t = probed / SPEECH_S;
    if (probed > 0 && t >= TEMPO_MIN && t <= TEMPO_MAX && probed <= RAW_MAX_S) {
      voice = { file: rawWav, seconds: probed, usd: 0 };
      tempo = t;
      rate = scriptWords.length / probed;
      console.log(
        `voice: reusing the reading already bought for this exact script — ${probed.toFixed(1)}s ` +
          `(${rate.toFixed(2)} w/s), atempo ${tempo.toFixed(3)}. No purchase.`
      );
      await journal(`narration reused for an unchanged script (${probed.toFixed(1)}s, atempo ${tempo.toFixed(3)}) — no spend`);
    }
  }

  for (let attempt = 1; voice === null && attempt <= TTS_TRIES; attempt++) {
    const got = await tts({
      text: narration,
      voice: voiceName,
      ...(lang === "fr" ? { style: frStyle } : {}),
      outFile: rawWav,
      slug,
    });
    const t = got.seconds / SPEECH_S;
    const r = got.seconds > 0 ? scriptWords.length / got.seconds : 0;
    await recordVoiceRate({ slug, words: scriptWords.length, seconds: got.seconds, voice: voiceName, lang, attempt, accepted: t >= TEMPO_MIN && t <= TEMPO_MAX && got.seconds <= RAW_MAX_S, declineDb: await voiceDecline(rawWav) });
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
    const want = Math.round(SPEECH_S * (r || DEFAULT_RATE));
    console.log(
      `  ${TTS_TRIES} readings all outside the range. Keeping the last one and clamping the stretch to ${tempo.toFixed(3)}: ` +
        `the file will be about ${(got.seconds / tempo + TAIL_S + END_S).toFixed(1)}s instead of ${TARGET_S}. ` +
        `Say so in the report; if it happens twice in a week the scripts want to be about ${want} words.`
    );
    await journal(`narration out of range on ${TTS_TRIES} readings, clamped to ${tempo.toFixed(3)} — file will not be exactly ${TARGET_S}s`);
  }
  /* Stamp the reading with what produced it, so a rebuild for a picture does
     not pay to hear the same words again. Written only once the reading is the
     one being used, and only when it is inside the stretch range — a clamped
     reading is a compromise this build settled for, never a thing to hand to
     the next one. */
  if (!SILENT && tempo >= TEMPO_MIN && tempo <= TEMPO_MAX) await writeFile(voiceKeyFile, voiceKey);
  else if (!SILENT) await rm(voiceKeyFile, { force: true }).catch(() => {});

  const timedWav = path.join(mediaDir, "voice2.wav");
  if (SILENT)
    await ffmpeg(["-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", String(SPEECH_S), timedWav]);
  else await ffmpeg(["-y", "-i", rawWav, "-filter:a", `atempo=${tempo.toFixed(6)}`, "-ar", "48000", timedWav]);
  if (!SILENT)
    await journal(`voice ${scriptWords.length} words ${voice.seconds.toFixed(1)}s raw (${rate.toFixed(2)} w/s), atempo ${tempo.toFixed(3)} → ${SPEECH_S}s`);

  /* 2 — the clock, read off the corrected voice so the karaoke matches what
     actually plays. The last beat runs to the end-card rather than to its own
     last word plus a pad: that is what makes the file exactly TARGET_S long
     however the reading came out. */
  const words = SILENT
    ? silentWordClock(plan.beats, SPEECH_S)
    : await alignWords(timedWav, scriptWords, mediaDir, lang, `${voiceKey}:${tempo.toFixed(6)}`);
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

  /* 3 — the pictures, cheapest that serves the beat.
   *
   * Two phases, and the split is the point. Everything that spends money or
   * reaches the network happens first, in beat order, one at a time: a refused
   * prompt stops the run before the next purchase, the spend ledger reads in the
   * order a human expects, and a failure costs the fewest dollars it can.
   *
   * Rendering is then pure CPU over files named after their own beat — every
   * temporary path in here is derived from `outFile`, so nothing is shared and
   * several can run at once. `zoompan` is single-threaded: one ffmpeg uses about
   * 1.5 cores and the rest of the machine sits idle. Measured 2026-07-31 over
   * the day's real beat durations, on identical output: 70.9s one at a time,
   * 34.3s at three. Five was only 17% faster than three and doubles the memory,
   * so three is the knee and the cap.
   */
  const renders = [];
  const render = (i, fn) => { renders[i] = fn; };
  let veoAudio = null;
  const ctx = plan.beats.map((beat, i) => ({
    i,
    beat,
    dur: Number((bounds[i].t1 - bounds[i].t0).toFixed(2)),
    seg: path.join(mediaDir, `seg2_${i}.mp4`),
    type: beat.visual?.type || "image",
  }));
  const segFiles = ctx.map((c) => c.seg);
  const logBeat = async ({ i, beat, dur, type }) => {
    console.log(`beat ${i}: ${type} ${dur}s — "${beat.script.split(/\s+/).slice(0, 6).join(" ")}…"`);
    await journal(`beat ${i} acquired: ${type} ${dur}s`);
  };
  /* A rebuild must not pay to see the same picture again — the exact promise
     `voiceCacheKey` already keeps for the narration, extended to the two paid
     surfaces. The key hashes everything that decides the pixels (the prompt,
     the seconds, the resolution); a script edit moves the beat durations and
     the key with them, so there is no staleness to reason about. Before this,
     `veo_0.mp4` could sit on disk while a rebuild bought it again: the 05/08
     build that died at 13 minutes would have re-paid its whole bill. */
  const mediaKey = (parts) => createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 16);
  const cachedOk = async (file, keyFile, key) => {
    const held = (await readFile(keyFile, "utf8").catch(() => "")).trim();
    if (held !== key) return false;
    return access(file).then(() => true, () => false);
  };

  /* Pass A — everything free. The network surfaces (screenshots, photos) go
     FIRST because they are the fragile ones: a Cloudflare wall on a receipt
     page must kill the build while the bill is still $0, not after the veo
     opener has been bought. Within the pass, beat order, so the journal still
     reads like the Reel. */
  for (const c of ctx) {
    const { i, beat, dur, seg, type } = c;
    if (type === "screenshot") {
      const shot = beat.visual.file || path.join(mediaDir, `shot_${i}.png`);
      if (!beat.visual.file) await screenshot(beat.visual.url, shot);
      render(i, () => segmentFromScreenshot(shot, dur, seg));
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
      render(i, () => segmentFromPhoto(file, dur, credit, seg, mediaDir));
    } else if (type === "card") {
      render(i, () => segmentCard(dur, seg));
    } else if (type === "file") {
      const src = beat.visual.file;
      render(i, () => (/\.(mp4|mov|webm)$/i.test(src) ? segmentFromVideo(src, dur, seg) : segmentFromImage(src, dur, seg)));
    } else {
      continue;
    }
    await logBeat(c);
  }

  /* Pass B — everything paid, in beat order, one at a time: a refused prompt
     still stops the run before the next purchase, and the spend ledger still
     reads in the order a human expects. */
  for (const c of ctx) {
    const { i, beat, dur, seg, type } = c;
    if (type === "veo") {
      const clip = beat.visual.file || path.join(mediaDir, `veo_${i}.mp4`);
      if (!beat.visual.file) {
        const prompt = beat.visual.prompt || veoPrompt({ ...beat.visual.spec, mood });
        const issues = promptIssues(prompt, { forbidNames, authored: authoredText(beat.visual) });
        if (issues.length) throw new Error(`veo prompt refused:\n  ${issues.join("\n  ")}`);
        const durationSeconds = dur <= 4.2 ? 4 : dur <= 6.2 ? 6 : 8;
        /* 1080p is native for this frame: a 9:16 clip at 720p is 720x1280 and
           gets enlarged 1.5x to fill 1080x1920, which is visible on the one
           beat the whole audition rests on. The API only allows 1080p at 8
           seconds, so a shorter beat stays at 720p rather than buying seconds
           it will not show. Veo Fast: $0.12/s at 1080p against $0.10 at 720p,
           so native resolution costs 16 cents on a normal Reel. */
        const resolution = beat.visual.resolution || (durationSeconds === 8 ? "1080p" : "720p");
        const key = mediaKey(["veo", prompt, durationSeconds, resolution]);
        const keyFile = path.join(mediaDir, `veo_${i}.key`);
        if (await cachedOk(clip, keyFile, key)) {
          console.log(`veo ${i}: reusing the clip already bought for this exact prompt — no purchase.`);
          await journal(`veo ${i} reused from cache — no spend`);
        } else {
          await genVideo({ prompt, durationSeconds, resolution, outFile: clip, slug });
          await writeFile(keyFile, key);
        }
      }
      render(i, () => segmentFromVideo(clip, dur, seg));
      if (!veoAudio) veoAudio = { file: clip, at: bounds[i].t0, dur };
    } else if (type === "screenshot" || type === "photo" || type === "card" || type === "file") {
      continue;
    } else {
      const img = beat.visual?.file || path.join(mediaDir, `still_${i}.jpg`);
      if (!beat.visual?.file) {
        const prompt = beat.visual?.prompt || imagePrompt({ ...beat.visual?.spec, mood });
        const issues = promptIssues(prompt, { forbidNames, authored: authoredText(beat.visual) });
        if (issues.length) throw new Error(`image prompt refused:\n  ${issues.join("\n  ")}`);
        const key = mediaKey(["image", prompt]);
        const keyFile = path.join(mediaDir, `still_${i}.key`);
        if (await cachedOk(img, keyFile, key)) {
          console.log(`still ${i}: reusing the picture already bought for this exact prompt — no purchase.`);
          await journal(`still ${i} reused from cache — no spend`);
        } else {
          await genImage({ prompt, outFile: img, slug });
          await writeFile(keyFile, key);
        }
      }
      render(i, () => segmentFromImage(img, dur, seg));
    }
    await logBeat(c);
  }

  await renderAll(renders, plan.beats);

  /* 3b — the end-card, sized to whatever is left of the minute.
     Every segment is quantised to whole frames, and a re-framed still is two
     segments, so ten beats can drift a few tenths away from the arithmetic.
     Rather than hope the sum lands on 60, measure the beats that were actually
     written and give the remainder to the end-card: the file is then exactly
     TARGET_S long to within one frame, which is what "60 secondes" has to mean
     if it is printed in the bio. */
  const beatsTotal = (await Promise.all(segFiles.map(async (f) => Number((await ffprobe(f)).format.duration))))
    .reduce((a, b) => a + b, 0);
  let endDur = Number((TARGET_S - beatsTotal).toFixed(3));
  if (endDur < 1.5) {
    /* This used to throw — after every purchase had been made. It fired in
       exactly the case the narration path promises to survive: a clamped
       reading makes `total` overrun SPEECH_S, the beats absorb the overrun,
       and TARGET_S minus the measured beats leaves nothing for the end-card.
       The daily promise outranks the 60-second one (the TTS fallback above
       says so in as many words), so the end-card takes what the assembly
       actually left it and the file lands a few seconds long, flagged by the
       existing duration note below. Killing a paid build over arithmetic the
       build already chose to accept was the bug. */
    const fallback = Number((videoTotal - beatsTotal).toFixed(3));
    endDur = Math.max(1.5, fallback);
    console.log(
      `end-card squeeze: ${(TARGET_S - beatsTotal).toFixed(2)}s left of the ${TARGET_S}s budget after ` +
        `${beatsTotal.toFixed(2)}s of beats — giving it ${endDur.toFixed(2)}s and letting the file run long. Say so in the report.`
    );
    await journal(`end-card squeezed to ${endDur.toFixed(2)}s (beats ${beatsTotal.toFixed(2)}s) — file will not be exactly ${TARGET_S}s`);
  }
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
    countdown: COUNTDOWN,
  }));
  const withSub = path.join(mediaDir, "reel2_sub.mp4");
  await ffmpeg([
    "-y", "-i", noSub, "-vf",
    `subtitles=${assFile}:fontsdir=${FONT_DIR},` +
      `drawtext=fontfile=${UI_FONT}:text='${HANDLE}':fontsize=34:fontcolor=white@0.8:x=(w-text_w)/2:y=100:shadowcolor=black@0.6:shadowx=2:shadowy=2`,
    "-c:v", "libx264", "-preset", "fast", "-crf", FINAL_CRF, withSub,
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
