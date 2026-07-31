/**
 * The 60-second format, in one place.
 *
 * Until 2026-07-31 these numbers lived in three files and disagreed: the manual
 * said "5 to 7 beats, 130 to 155 words", `validate.mjs` refused fewer than 4 or
 * more than 7, and `reel2.mjs` accepted 4 and refused a narration over 56
 * seconds. Nothing enforced a *minimum* duration anywhere, so the série called
 * "L'actu IA en 60 secondes" shipped four Reels of 47 to 51 seconds and the
 * engine called every one of them COMPLIANT.
 *
 * A rule that lives in three files is three rules. This module is the one the
 * gate reads, the one the engine builds to, and the one the manual quotes.
 *
 * The chain, end to end:
 *
 *   words ──(the voice's measured rate)──▶ raw narration seconds
 *         ──(atempo, ≤ ±10%)────────────▶ SPEECH_S exactly
 *         ──(+ tail + end-card)─────────▶ TARGET_S exactly, every single time
 *
 * The gate holds the copy inside the word window so the stretch stays small and
 * inaudible; the engine's stretch absorbs whatever the gate could not predict.
 * Neither alone is enough: word counts cannot predict a text-to-speech engine's
 * pace, and a stretch large enough to fix a badly-sized script would be heard.
 */

export const TARGET_S = 60.0;   // the contract the bio prints and the série is named after
export const END_S = 3.0;       // the fixed brand end-card, after the last spoken word
export const TAIL_S = 1.4;      // the kicker lands, the picture holds, then the card
export const SPEECH_S = Number((TARGET_S - END_S - TAIL_S).toFixed(2)); // 55.6

/** How far the engine may time-stretch the narration without it being heard.
 * The window covers the whole word window read at either end of the voice's
 * measured rate spread, with headroom: a script the gate accepted must never
 * die at the stretch. */
export const TEMPO_MIN = 0.90, TEMPO_MAX = 1.12;

/** Gemini TTS has a documented quality cliff past about 60 seconds of output,
 * and a stretch cannot repair a bad reading. A raw narration longer than this
 * is refused whatever the tempo maths says. */
export const RAW_MAX_S = 61.0;

/** Beats, and why the floor moved from 4 to 7 on 2026-07-31: at 60 seconds a
 * 5-beat Reel is 11 seconds a beat. The manual's own rule is "change something
 * every two to three seconds", the engine re-frames a long still once, and
 * beyond ~7 seconds neither is enough to keep a picture alive. */
export const BEATS_MIN = 7, BEATS_MAX = 10;

/** Generated stills may only ever set a mood. The cap rose from 3 to 4 with the
 * beat count so the ratio of wallpaper to real surfaces did not get worse, and
 * REAL_MIN is the same rule stated positively: at least this many beats must
 * show something that exists (a credited photograph, a receipt, a Veo shot). */
export const STILLS_MAX = 4, REAL_MIN = 3;

/** The account's default speaking rate in French words per second, used until
 * `state/voice-rate.jsonl` holds enough real readings to speak for itself.
 * Measured on the two Reels that carried a recorded duration: 158 words in
 * 47.2s (3.35 w/s) and 150 in 48.0s (3.13 w/s). */
export const DEFAULT_RATE = 3.24;
export const RATE_SAMPLES_MIN = 3;

/** Rate readings are noisy, so the window is derived from the median of the
 * recent ones rather than the last one. */
export function medianRate(samples) {
  const rates = samples
    .map((s) => (Number(s?.words) > 0 && Number(s?.seconds) > 0 ? s.words / s.seconds : null))
    .filter((r) => Number.isFinite(r) && r > 1 && r < 8)
    .sort((a, b) => a - b);
  if (rates.length < RATE_SAMPLES_MIN) return DEFAULT_RATE;
  const mid = Math.floor(rates.length / 2);
  return rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
}

/**
 * The word window a script must land in so that the engine's stretch stays
 * inside [TEMPO_MIN, TEMPO_MAX]. Narrower than the stretch allows on purpose:
 * the gate should reject a script the engine would only just rescue, so the
 * margin absorbs the day-to-day variation of the voice rather than being spent
 * in advance.
 */
export function wordWindow(rate = DEFAULT_RATE) {
  const min = Math.ceil(SPEECH_S * rate * 0.96);
  const max = Math.floor(SPEECH_S * rate * 1.06);
  return { min, max, target: Math.round(SPEECH_S * rate), rate };
}
