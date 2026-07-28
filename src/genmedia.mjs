/**
 * The Google media client: video, images, speech, and what each of them cost.
 *
 * One key (GEMINI_API_KEY), one file. Everything paid goes through here so that
 * every run can say, in dollars, what it spent — the ledger lands in
 * state/spend.jsonl next to the metrics, because a pipeline that pays per asset
 * and cannot name its own bill is how budgets die quietly.
 *
 * Model policy, per Hasan (2026-07-27): the cheapest tier of everything, always.
 * Video prefers Veo Lite and only falls back up the price list when a model is
 * absent from the key; images default to Nano Banana Lite; batch is used for
 * images when the caller can wait, because Google sells the same pixels at half
 * price under a 24h SLA that in practice resolves far sooner. The price table
 * below is copied from ai.google.dev/gemini-api/docs/pricing on 2026-07-27 —
 * when Google moves a price, move it here, nowhere else.
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
  image: {
    "gemini-3.1-flash-lite-image": 0.0336,
    "gemini-3.1-flash-image": 0.067,
    "gemini-3-pro-image": 0.134,
  },
  imageBatchFactor: 0.5,
  // 2.5 Flash TTS: $10 per million audio tokens at 25 tokens a second.
  ttsPerSecond: 0.00025,
};

/** Cheapest first. pickVideoModel() takes the first one the key can see. */
const VIDEO_PREFERENCE = [
  "veo-3.1-lite-generate-preview",
  "veo-3.1-fast-generate-preview",
  "veo-3.1-generate-preview",
];

export const IMAGE_MODEL = "gemini-3.1-flash-lite-image";
/** For the rare picture that must carry legible type — covers, not backgrounds. */
export const IMAGE_MODEL_TEXT = "gemini-3-pro-image";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

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
  const instance = { prompt };
  if (imageFile) {
    const mime = imageFile.endsWith(".png") ? "image/png" : "image/jpeg";
    instance.image = { inlineData: { mimeType: mime, data: (await readFile(imageFile)).toString("base64") } };
  }
  const op = await api(`models/${model}:predictLongRunning`, {
    instances: [instance],
    parameters: { aspectRatio, durationSeconds, resolution },
  });
  const t0 = Date.now();
  let done = null;
  while (Date.now() - t0 < 8 * 60_000) {
    const state = await api(op.name, null, { method: "GET" });
    if (state.done) { done = state; break; }
    await new Promise((r) => setTimeout(r, 15_000));
  }
  if (!done) throw new Error(`Veo operation still running after 8 minutes: ${op.name}`);
  if (done.error) throw new Error(`Veo refused: ${done.error.message || JSON.stringify(done.error).slice(0, 300)}`);
  const uri = done.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if (!uri) throw new Error(`Veo finished with no video uri: ${JSON.stringify(done.response || {}).slice(0, 300)}`);
  const res = await withRetry(async () => {
    const r = await fetch(uri, { headers: { "x-goog-api-key": apiKey() } });
    if (!r.ok) throw new Error(`video download -> HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }, "veo download");
  await writeFile(outFile, res);
  const usd = (PRICES.video[model]?.[resolution] ?? 0.4) * durationSeconds;
  await recordSpend({ slug, kind: "video", model, units: `${durationSeconds}s@${resolution}`, usd });
  return { file: outFile, model, usd, seconds: durationSeconds };
}

function extractInlineImage(candidates) {
  for (const part of candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) return Buffer.from(part.inlineData.data, "base64");
  }
  return null;
}

/** One picture, interactively, at the Lite price unless told otherwise. */
export async function genImage({ prompt, aspectRatio = "9:16", model = IMAGE_MODEL, outFile, slug = "" }) {
  const out = await api(`models/${model}:generateContent`, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio } },
  });
  const buf = extractInlineImage(out.candidates);
  if (!buf) throw new Error(`image model returned no image: ${JSON.stringify(out).slice(0, 300)}`);
  await writeFile(outFile, buf);
  const usd = PRICES.image[model] ?? 0.067;
  await recordSpend({ slug, kind: "image", model, units: aspectRatio, usd });
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
  const requests = items.map((it, i) => ({
    request: {
      contents: [{ parts: [{ text: it.prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: it.aspectRatio || "9:16" } },
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
            results[i] = { file: items[i].outFile, model, usd: (PRICES.image[model] ?? 0.067) * PRICES.imageBatchFactor, batched: true };
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
  const out = await api(`models/${TTS_MODEL}:generateContent`, {
    contents: [{ parts: [{ text: `${style}: ${text}` }] }],
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
