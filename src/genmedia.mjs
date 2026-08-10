/**
 * The Google media client: video, images, speech, and what each of them cost.
 *
 * One key (GEMINI_API_KEY), one file. Everything paid goes through here so that
 * every run can say, in dollars, what it spent — the ledger lands in
 * state/spend.jsonl next to the metrics, because a pipeline that pays per asset
 * and cannot name its own bill is how budgets die quietly.
 *
 * Model policy, per Hasan: it was "the cheapest tier of everything, always"
 * (2026-07-27) and became "one tier up on video, images and voice, never the
 * most expensive" (2026-07-31). So: Veo Fast rather than Lite, Nano Banana 2 at
 * 2K rather than its Lite distillation at 1K, Gemini 3.1 Flash TTS rather than
 * 2.5 — and explicitly NOT Veo standard, not Nano Banana Pro, not Pro TTS. Each
 * choice below carries the measurement that justified it. Batch is used for
 * images when the caller can wait, because Google sells the same pixels at half
 * price under a 24h SLA that in practice resolves far sooner. Prices come from
 * ai.google.dev/gemini-api/docs/pricing; per-picture cost is measured off the
 * response, because the per-picture figures in that table were wrong by 40%.
 */

import { readFile, writeFile, appendFile, unlink } from "node:fs/promises";
import path from "node:path";
import { ffmpeg, ffprobe } from "./ffmpeg.mjs";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Prices in USD, official table 2026-07-27. Video is per second of output. */
export const PRICES = {
  video: {
    "veo-3.1-lite-generate-preview": { "720p": 0.05, "1080p": 0.08 },
    "veo-3.1-fast-generate-preview": { "720p": 0.10, "1080p": 0.12 },
    "veo-3.1-generate-preview": { "720p": 0.40, "1080p": 0.40 },
  },
  /**
   * Images are sold per token, not per picture, so the per-picture figures that
   * used to live here were guesses dressed as facts — and they were wrong.
   * Measured against the live API on 2026-07-31 with a real house-style prompt:
   *
   *   lite,   1K (768x1376)    1531 tok   $0.0459   (the table said $0.0336)
   *   flash,  1K (768x1376)    1647 tok   $0.0988   (the table said $0.0670)
   *   flash,  2K (1536x2752)   2138 tok   $0.1283
   *
   * So the rate below is per million OUTPUT tokens, straight off the official
   * table, and every picture's cost is computed from what the API says it
   * actually produced. A ledger that reports a number nobody measured is worse
   * than no ledger: it is a number people plan with.
   */
  imagePerMTok: {
    "gemini-3.1-flash-lite-image": 30,
    "gemini-3.1-flash-image": 60,
    "gemini-3-pro-image": 120,
  },
  imageBatchFactor: 0.5,
  // 3.1 Flash TTS: $20 per million audio tokens at 25 tokens a second.
  ttsPerSecond: 0.0005,
};

/** What one picture cost, from the response rather than from a table. Falls back
 * to the measured 2K flash figure only when the API omits its own accounting. */
function imageUsd(model, usageMetadata, { batched = false } = {}) {
  const tok = usageMetadata?.candidatesTokenCount ?? 0;
  const rate = PRICES.imagePerMTok[model] ?? 60;
  const usd = tok > 0 ? (tok / 1e6) * rate : 0.1283;
  return batched ? usd * PRICES.imageBatchFactor : usd;
}

/**
 * The video tier, and why it moved up on 2026-07-31 (Hasan: *"on peut dépenser
 * un tout petit plus pour la vidéo et les images sans abuser et sans utiliser
 * le plus gros modèle le plus cher"*).
 *
 * Lite was the default while the policy was "cheapest of everything, always".
 * The measured cost of that policy is on the account: a generated clip that
 * reads as slop is clocked in half a second and the audition is over, and the
 * one Veo beat is usually the opener. Fast is one tier up, twice the price and
 * a different model; the $0.40 standard is eight times Lite and is deliberately
 * NOT in this list, so a missing Fast can never silently produce a bill four
 * times what the run expected. If neither is on the key, that is a finding, not
 * a fallback.
 */
const VIDEO_PREFERENCE = [
  "veo-3.1-fast-generate-preview",
  "veo-3.1-lite-generate-preview",
];

/**
 * Stills, one tier up on the same day and for the same reason: Nano Banana 2
 * rather than its Lite distillation. Lite also caps at 1K, which is under the
 * 1080x1920 frame before the Ken-Burns oversample even starts, so the upgrade
 * buys resolution as well as drawing.
 */
export const IMAGE_MODEL = "gemini-3.1-flash-image";
export const IMAGE_SIZE = "2K";
/** For the rare picture that must carry legible type — covers, not backgrounds. */
export const IMAGE_MODEL_TEXT = "gemini-3-pro-image";
/**
 * The voice, moved up a generation on 2026-07-31 for the same reason as the
 * pictures. Measured that day on the day's real 188-word script, with the
 * rewritten French direction:
 *
 *   2.5-flash  Charon      55.9s   3.36 w/s   in window
 *   3.1-flash  Charon      57.7s   3.26 w/s   in window
 *   3.1-flash  Sadaltager  53.9s   3.49 w/s   in window   <- chosen 31/07, Hasan's ear
 *   3.1-flash  Puck        61.9s   3.04 w/s   in window
 *   3.1-flash  Rasalgethi  63.3s   2.97 w/s   OUT
 *   2.5-pro    Charon      66.2s   2.84 w/s   OUT
 *
 * Two things that table settles. The Pro tier is not an upgrade here: it reads
 * so much more deliberately that 188 words no longer fit a 60-second Reel, and
 * buying it would mean rewriting the format around it. And the voice is not a
 * free choice either — swapping it moves the reading rate by up to 18%, which
 * is the whole width of the word window, so a voice change is a recalibration
 * (three builds of `state/voice-rate.jsonl`) and never a casual edit.
 */
const TTS_MODEL = "gemini-3.1-flash-tts-preview";

function apiKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) {
    throw new Error(
      "GEMINI_API_KEY is not set. It lives in the cloud environment variables, " +
        "never in this repository — the repo is public."
    );
  }
  return k;
}

function describeError(err) {
  const parts = [err?.message, err?.cause?.message, err?.name && !err?.message ? err.name : null]
    .map((p) => (p ? String(p).trim() : ""))
    .filter(Boolean);
  return [...new Set(parts)].join(" — ") || `unnamed ${err?.constructor?.name || typeof err} with no message`;
}

/** Same shape as imagery.mjs: 429 and 5xx back off and retry, anything else is an answer. */
async function withRetry(fn, what, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const retryable = /HTTP (429|5\d\d)|fetch failed|timeout|ECONNRESET|EAI_AGAIN/i.test(describeError(err));
      if (!retryable || i === tries - 1) throw err;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
      console.error(`retrying ${what} after ${describeError(err)}`);
    }
  }
  throw last;
}

async function api(pathname, body, { method = "POST" } = {}) {
  return withRetry(async () => {
    const res = await fetch(`${BASE}/${pathname}`, {
      method,
      headers: { "x-goog-api-key": apiKey(), "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = (await res.text()).slice(0, 500);
      throw new Error(`${pathname} -> HTTP ${res.status}: ${text}`);
    }
    return res.json();
  }, pathname.split(":")[0]);
}

/**
 * The bill, one line per asset, appended as it is incurred rather than summed
 * at the end — a run that dies mid-flight still leaves its receipts.
 */
const SPEND_FILE = path.join(process.cwd(), "state", "spend.jsonl");
async function recordSpend(entry) {
  const line = { at: new Date().toISOString(), ...entry, usd: Number(entry.usd.toFixed(4)) };
  try {
    await appendFile(SPEND_FILE, JSON.stringify(line) + "\n");
  } catch {
    /* a missing state/ dir means we are not in the repo root; the console line still tells the story */
  }
  console.log(`spend: $${line.usd} ${entry.kind} ${entry.model}${entry.note ? ` (${entry.note})` : ""}`);
  await journal(`spend $${line.usd} — ${entry.kind} ${entry.model} ${entry.units ?? ""}`);
  return line;
}

/**
 * The daily ceiling, in code for the first time.
 *
 * The manual's "$3 a Reel asks for an explanation" lived in prose, and nothing
 * ever read state/spend.jsonl back before buying — the ledger was a receipt
 * drawer, not a brake. A normal day is $1–2 across both Reels; the worst day so
 * far was $4.45 (2026-07-31, the jitter hunt). Six dollars is therefore not a
 * budget, it is a circuit breaker: nothing legitimate hits it, and the failure
 * mode it exists for — a retry loop or a prompt loop quietly re-buying media —
 * burns tens of dollars precisely because each item costs under one.
 *
 * The check reads the same ledger the receipts land in, so an in-flight run
 * sees its own purchases immediately. Parallel runs only see each other after
 * a land, which is fine for a breaker with 4x headroom. Override for a
 * deliberately expensive day with OOM_DAILY_SPEND_CAP.
 */
export const DAILY_SPEND_CAP_USD = Number(process.env.OOM_DAILY_SPEND_CAP || 6);

/** Pure so the suite can hold the arithmetic: entries + an estimate -> verdict. */
export function spendRoom(entries, estUsd, { now = new Date(), cap = DAILY_SPEND_CAP_USD } = {}) {
  const day = now.toISOString().slice(0, 10);
  const spent = (entries || [])
    .filter((e) => e && typeof e.usd === "number" && String(e.at || "").slice(0, 10) === day)
    .reduce((a, e) => a + e.usd, 0);
  return { spent: Number(spent.toFixed(4)), cap, ok: spent + estUsd <= cap };
}

async function assertSpendRoom(estUsd, what) {
  let entries = [];
  try {
    entries = (await readFile(SPEND_FILE, "utf8"))
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => { try { return JSON.parse(l); } catch { return null; } });
  } catch {
    /* no ledger, no history: a fresh checkout starts at zero */
  }
  const room = spendRoom(entries, estUsd);
  if (!room.ok) {
    await journal(`SPEND CAP: refused ${what} (~$${estUsd}) — $${room.spent} already spent today, cap $${room.cap}`);
    throw new Error(
      `daily spend cap: $${room.spent} already spent today and ${what} would add ~$${estUsd} (cap $${room.cap}). ` +
        `A normal day is $1–2, so something is re-buying. Read state/spend.jsonl for today's receipts; ` +
        `override deliberately with OOM_DAILY_SPEND_CAP if this day is meant to be expensive.`
    );
  }
}

/**
 * The run journal: one line per event, appended to whatever file RUN_JOURNAL
 * points at, silently skipped when it points nowhere. It exists because a run
 * that dies on a usage limit takes its narration with it — the 27 July death
 * left a bought Veo clip visible only by inference from a commit message. The
 * journal is the flight recorder: cheap lines, written at the moment things
 * happen, committed with whatever lands next.
 */
export async function journal(line) {
  const file = process.env.RUN_JOURNAL;
  if (!file) return;
  try {
    await appendFile(file, `- ${new Date().toISOString().slice(11, 19)} ${line}\n`);
  } catch {
    /* a journal must never be able to fail a run */
  }
}

let modelListCache = null;
async function listModels() {
  if (!modelListCache) {
    const out = await api("models?pageSize=200", null, { method: "GET" });
    modelListCache = (out.models || []).map((m) => m.name.replace(/^models\//, ""));
  }
  return modelListCache;
}

/**
 * Veo Lite appeared on this key a day after Fast did, and the first listing —
 * truncated at 50 entries — hid it. Ask with a high page size, take the
 * cheapest present, and say which one was chosen so a silent fallback to a 2x
 * price is visible in the run log.
 */
export async function pickVideoModel() {
  const models = await listModels();
  for (const candidate of VIDEO_PREFERENCE) {
    if (models.includes(candidate)) return candidate;
  }
  throw new Error(`no Veo model on this key; saw: ${models.filter((m) => m.startsWith("veo")).join(", ") || "none"}`);
}

/**
 * One video clip. Text-to-video by default; pass `imageFile` to animate a
 * first frame instead (the control pattern: a cheap Nano Banana still decides
 * the composition, Veo only has to move it). Native audio is always on.
 *
 * durationSeconds must be 4, 6 or 8, and 1080p requires 8 — API rules, not ours.
 * Files live on Google's side for two days; this downloads immediately.
 */
export async function genVideo({ prompt, imageFile, durationSeconds = 8, resolution = "720p", aspectRatio = "9:16", outFile, slug = "" }) {
  if (![4, 6, 8].includes(durationSeconds)) throw new Error(`durationSeconds must be 4, 6 or 8, got ${durationSeconds}`);
  if (resolution === "1080p" && durationSeconds !== 8) throw new Error("1080p requires durationSeconds 8");
  const model = await pickVideoModel();
  const usd = (PRICES.video[model]?.[resolution] ?? 0.4) * durationSeconds;
  await assertSpendRoom(usd, `a ${durationSeconds}s ${resolution} veo clip`);
  const instance = { prompt };
  if (imageFile) {
    const mime = imageFile.endsWith(".png") ? "image/png" : "image/jpeg";
    instance.image = { inlineData: { mimeType: mime, data: (await readFile(imageFile)).toString("base64") } };
  }
  const op = await api(`models/${model}:predictLongRunning`, {
    instances: [instance],
    parameters: { aspectRatio, durationSeconds, resolution },
  });
  /* Once the operation is submitted the money is committed on Google's side,
   * whatever happens on ours. Both failure paths below used to throw before
   * recordSpend ever ran, so a slow-but-billed clip or a failed download became
   * an invisible charge — the ledger's whole promise is that it has no
   * invisible charges. `video-orphan` lines carry the price of a clip that was
   * (probably) produced and never used; the note says which way it was lost. */
  const orphan = async (note) => {
    await recordSpend({ slug, kind: "video-orphan", model, units: `${durationSeconds}s@${resolution}`, usd, note });
  };
  const t0 = Date.now();
  let done = null;
  while (Date.now() - t0 < 8 * 60_000) {
    const state = await api(op.name, null, { method: "GET" });
    if (state.done) { done = state; break; }
    await new Promise((r) => setTimeout(r, 15_000));
  }
  if (!done) {
    await orphan("poll timed out after 8 minutes; the clip may still have been produced and billed");
    throw new Error(`Veo operation still running after 8 minutes: ${op.name}`);
  }
  if (done.error) throw new Error(`Veo refused: ${done.error.message || JSON.stringify(done.error).slice(0, 300)}`);
  const uri = done.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if (!uri) throw new Error(`Veo finished with no video uri: ${JSON.stringify(done.response || {}).slice(0, 300)}`);
  let res;
  try {
    res = await withRetry(async () => {
      const r = await fetch(uri, { headers: { "x-goog-api-key": apiKey() } });
      if (!r.ok) throw new Error(`video download -> HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    }, "veo download");
  } catch (err) {
    await orphan(`produced but the download failed (${describeError(err)})`);
    throw err;
  }
  await writeFile(outFile, res);
  await recordSpend({ slug, kind: "video", model, units: `${durationSeconds}s@${resolution}`, usd });
  return { file: outFile, model, usd, seconds: durationSeconds };
}

function extractInlineImage(candidates) {
  for (const part of candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) return Buffer.from(part.inlineData.data, "base64");
  }
  return null;
}

/**
 * One picture, interactively.
 *
 * `imageSize` matters more than it looks: a "1K" 9:16 picture comes back at
 * 768x1376, which is smaller than the 1080x1920 frame before the Ken-Burns
 * oversample has even started, so every still used to be enlarged about 1.7x on
 * screen. 2K returns 1536x2752 and the whole chain becomes a downscale. It cost
 * 30% more, not the 4x the area suggests, because image tokens do not scale
 * with pixels. Measured 2026-07-31; Lite cannot do 2K at all.
 */
export async function genImage({ prompt, aspectRatio = "9:16", imageSize = IMAGE_SIZE, model = IMAGE_MODEL, outFile, slug = "" }) {
  await assertSpendRoom(0.14, "a generated still");
  const imageConfig = { aspectRatio };
  if (imageSize && model !== "gemini-3.1-flash-lite-image") imageConfig.imageSize = imageSize;
  const out = await api(`models/${model}:generateContent`, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig },
  });
  const buf = extractInlineImage(out.candidates);
  if (!buf) throw new Error(`image model returned no image: ${JSON.stringify(out).slice(0, 300)}`);
  await writeFile(outFile, buf);
  const usd = imageUsd(model, out.usageMetadata);
  await recordSpend({ slug, kind: "image", model, units: `${aspectRatio} ${imageConfig.imageSize || "1K"}`, usd });
  return { file: outFile, model, usd };
}

/**
 * The same pictures at half price, when the run can afford to wait for them.
 *
 * Batch is an operation, not a request: submit every image at once, poll, and
 * if the job has not resolved inside `timeoutMs` fall back to interactive for
 * whatever is missing — a stuck batch must cost minutes, never the slot. The
 * measured turnarounds go in the run report; if they stay in the low minutes,
 * batch stays the default for stills, and the 24h SLA remains what it is: a
 * ceiling nobody has hit yet.
 */
export async function genImagesBatch(items, { model = IMAGE_MODEL, timeoutMs = 10 * 60_000, slug = "" } = {}) {
  await assertSpendRoom(0.07 * items.length, `a batch of ${items.length} still(s)`);
  const sized = model !== "gemini-3.1-flash-lite-image";
  const requests = items.map((it, i) => ({
    request: {
      contents: [{ parts: [{ text: it.prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: it.aspectRatio || "9:16", ...(sized ? { imageSize: it.imageSize || IMAGE_SIZE } : {}) },
      },
    },
    metadata: { key: String(i) },
  }));
  const results = new Array(items.length).fill(null);
  let batchUsd = 0;
  const t0 = Date.now();
  try {
    const op = await api(`models/${model}:batchGenerateContent`, {
      batch: { displayName: `oom-${slug || "images"}`, inputConfig: { requests: { requests } } },
    });
    while (Date.now() - t0 < timeoutMs) {
      const state = await api(op.name, null, { method: "GET" });
      if (state.done) {
        if (state.error) throw new Error(`batch failed: ${state.error.message}`);
        const inlined =
          state.response?.inlinedResponses?.inlinedResponses ||
          state.response?.inlinedResponses ||
          [];
        for (const item of inlined) {
          const i = Number(item.metadata?.key ?? -1);
          const buf = extractInlineImage(item.response?.candidates);
          if (i >= 0 && buf) {
            await writeFile(items[i].outFile, buf);
            results[i] = { file: items[i].outFile, model, usd: imageUsd(model, item.response?.usageMetadata, { batched: true }), batched: true };
            batchUsd += results[i].usd;
          }
        }
        break;
      }
      await new Promise((r) => setTimeout(r, 20_000));
    }
  } catch (err) {
    console.error(`image batch fell through: ${describeError(err)}`);
  }
  if (batchUsd > 0) {
    await recordSpend({
      slug, kind: "image-batch", model,
      units: `${results.filter(Boolean).length}/${items.length} in ${Math.round((Date.now() - t0) / 1000)}s`,
      usd: batchUsd,
    });
  }
  for (let i = 0; i < items.length; i++) {
    if (!results[i]) {
      console.log(`batch missing image ${i}, buying it interactively`);
      results[i] = await genImage({ ...items[i], model, slug });
    }
  }
  return results;
}

/**
 * Narration. The style instruction travels inside the text because that is the
 * only channel this API has; keep it short and imperative. Output is 24 kHz
 * mono PCM which ffmpeg wraps into a WAV, and the cost is measured off the
 * file rather than estimated off the text.
 */
export async function tts({ text, voice = "Fenrir", style = "Narrate as a sharp, energetic tech news voice. Fast paced, urgent, clear articulation, short pauses between paragraphs", outFile, slug = "" }) {
  await assertSpendRoom(0.03, "a narration reading");
  // Direction and transcript are separated by a blank line, not by a colon:
  // that is the shape Google documents and the shape every rate measurement on
  // 2026-07-31 was taken with. The colon form used to glue the last word of the
  // direction onto the first word of the news.
  const out = await api(`models/${TTS_MODEL}:generateContent`, {
    contents: [{ parts: [{ text: `${style}\n\n${text}` }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });
  const data = out.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) throw new Error(`TTS returned no audio: ${JSON.stringify(out).slice(0, 300)}`);
  const pcm = outFile.replace(/\.wav$/, ".pcm");
  await writeFile(pcm, Buffer.from(data, "base64"));
  await ffmpeg(["-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", pcm, outFile]);
  await unlink(pcm).catch(() => {});
  const probed = await ffprobe(outFile);
  const seconds = Number(probed.format.duration) || 0;
  const usd = seconds * PRICES.ttsPerSecond;
  await recordSpend({ slug, kind: "tts", model: TTS_MODEL, units: `${seconds.toFixed(1)}s ${voice}`, usd });
  return { file: outFile, seconds, usd, voice };
}

/* ------------------------------- CLI ------------------------------------ */

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (invokedDirectly) {
  const [cmd, ...rest] = process.argv.slice(2);
  const usage = "usage: genmedia.mjs models | image \"prompt\" out.png | video \"prompt\" out.mp4 | tts \"text\" out.wav";
  try {
    if (cmd === "models") {
      console.log("video model:", await pickVideoModel());
    } else if (cmd === "image" && rest.length >= 2) {
      console.log(await genImage({ prompt: rest[0], outFile: rest[1] }));
    } else if (cmd === "video" && rest.length >= 2) {
      console.log(await genVideo({ prompt: rest[0], outFile: rest[1] }));
    } else if (cmd === "tts" && rest.length >= 2) {
      console.log(await tts({ text: rest[0], outFile: rest[1] }));
    } else {
      console.log(usage);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(describeError(err));
    process.exitCode = 1;
  }
}
