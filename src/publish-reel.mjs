/**
 * Publishing a Reel.
 *
 * Different from the carousel path in one structural way: images have to be
 * fetched by Meta from a public URL, but video can be pushed. The resumable
 * flow creates an empty container, hands back an upload URI, and takes the
 * bytes directly:
 *
 *   POST graph.instagram.com/<v>/me/media?upload_type=resumable&media_type=REELS
 *     -> { id, uri }
 *   POST <uri>            Authorization: OAuth <token>, offset: 0, file_size: N
 *     -> { success: true }
 *   POST me/media_publish creation_id=<id>
 *
 * That matters beyond convenience. The carousel path pins images to a commit
 * SHA in a public repo, which is fine for 200KB JPEGs and unsustainable for a
 * megabyte of video every day: git history never shrinks. Pushing bytes means
 * nothing has to be hosted at all.
 *
 * CAVEAT, and it is not settled: Meta documents this flow only for
 * graph.facebook.com and describes it as being for "apps that have implemented
 * Facebook Login for Business". This account uses Instagram Login. Whether the
 * flow exists on graph.instagram.com is an empirical question, so the code
 * tries it, detects a missing upload URI as a definite answer rather than a
 * crash, and falls back to the hosted-URL path.
 */

import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const API = "https://graph.instagram.com";
const VERSION = process.env.IG_API_VERSION || "v25.0";
const TARGET = process.env.IG_TARGET || "me";

/**
 * Which frame becomes the grid thumbnail.
 *
 * Left to itself Instagram may take frame zero, and frame zero used to be pure
 * black because the opening beat faded in. The template no longer does that,
 * but a profile grid is the first thing a visitor judges and it is not worth
 * depending on someone else's default. 1.2s is inside the opening beat, after
 * any settle and well before the first cut.
 */
const THUMB_OFFSET_MS = 1200;

const POLL_INTERVAL_MS = 5000;
// Video containers take far longer than image ones: Meta transcodes.
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function requireToken() {
  const t = process.env.IG_ACCESS_TOKEN;
  if (!t) throw new Error("IG_ACCESS_TOKEN is not set");
  return t;
}

async function call(method, pathname, params) {
  const url = new URL(`${API}/${VERSION}/${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: requireToken() });
  const res =
    method === "GET"
      ? await fetch(`${url}?${body}`)
      : await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`${method} ${pathname} -> HTTP ${res.status}, non-JSON: ${text.slice(0, 300)}`);
  }
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(
      `${method} ${pathname} -> HTTP ${res.status} code=${e.code ?? "?"} subcode=${e.error_subcode ?? "-"}: ${e.message || text.slice(0, 300)}`
    );
  }
  return json;
}

/**
 * Opens a resumable container.
 * @returns {Promise<{id: string, uri: string|null}>} uri is null when this API
 *          path does not offer resumable upload, which is the thing worth knowing.
 */
export async function createResumableContainer({ caption, shareToFeed = true, audioName, thumbOffsetMs = THUMB_OFFSET_MS } = {}) {
  const r = await call("POST", `${TARGET}/media`, {
    media_type: "REELS",
    upload_type: "resumable",
    share_to_feed: shareToFeed ? "true" : "false",
    ...(thumbOffsetMs != null ? { thumb_offset: String(thumbOffsetMs) } : {}),
    ...(caption ? { caption } : {}),
    ...(audioName ? { audio_name: audioName } : {}),
  });
  return { id: r.id, uri: r.uri ?? null, raw: r };
}

/** Container that pulls the file from a URL, for when resumable is unavailable. */
export async function createHostedContainer(videoUrl, { caption, shareToFeed = true, audioName, thumbOffsetMs = THUMB_OFFSET_MS } = {}) {
  if (!/^https:\/\//.test(videoUrl)) throw new Error(`video_url must be https: ${videoUrl}`);
  const r = await call("POST", `${TARGET}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    share_to_feed: shareToFeed ? "true" : "false",
    ...(thumbOffsetMs != null ? { thumb_offset: String(thumbOffsetMs) } : {}),
    ...(caption ? { caption } : {}),
    ...(audioName ? { audio_name: audioName } : {}),
  });
  return { id: r.id, uri: null, raw: r };
}

/**
 * Pushes the file. Meta wants `offset` and `file_size` headers and the raw body,
 * and uses `Authorization: OAuth <token>` rather than a query parameter.
 */
export async function uploadBytes(uri, file) {
  const bytes = await readFile(file);
  const { size } = await stat(file);

  const res = await fetch(uri, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${requireToken()}`,
      offset: "0",
      file_size: String(size),
      "Content-Type": "application/octet-stream",
    },
    body: bytes,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`upload -> HTTP ${res.status}, non-JSON: ${text.slice(0, 300)}`);
  }
  if (!res.ok || json.error || json.success === false) {
    const e = json.error || {};
    throw new Error(`upload -> HTTP ${res.status} code=${e.code ?? "?"}: ${e.message || text.slice(0, 300)}`);
  }
  return { ...json, bytes: size };
}

/** Video containers report IN_PROGRESS for a while; publishing early fails. */
export async function waitForContainer(id, { onTick } = {}) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let last = null;
  while (Date.now() < deadline) {
    const r = await call("GET", id, { fields: "status_code,status" });
    last = r;
    onTick?.(r);
    if (r.status_code === "FINISHED") return r;
    if (r.status_code === "ERROR" || r.status_code === "EXPIRED")
      throw new Error(`container ${id} -> ${r.status_code}: ${r.status || "no detail"}`);
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`container ${id} still ${last?.status_code ?? "unknown"} after ${POLL_TIMEOUT_MS / 1000}s`);
}

/**
 * The whole path. `dryRun` builds and uploads but never publishes, which is a
 * genuinely safe way to test: an unpublished container simply expires.
 */
export async function publishReel(file, caption, opts = {}) {
  const { shareToFeed = true, audioName, dryRun = false, videoUrl = null, onStep = () => {} } = opts;

  let container;
  let route;
  if (videoUrl) {
    route = "hosted";
    container = await createHostedContainer(videoUrl, { caption, shareToFeed, audioName });
  } else {
    container = await createResumableContainer({ caption, shareToFeed, audioName });
    if (container.uri) {
      route = "resumable";
      onStep({ step: "container", route, id: container.id, uri: container.uri });
      await uploadBytes(container.uri, file);
      onStep({ step: "uploaded", bytes: (await stat(file)).size });
    } else {
      throw new Error(
        "the container came back without an upload uri, so resumable upload is not available on this API path. " +
          "Host the file and pass { videoUrl } instead."
      );
    }
  }
  onStep({ step: "container", route, id: container.id });

  const finished = await waitForContainer(container.id, { onTick: (r) => onStep({ step: "status", ...r }) });
  onStep({ step: "finished", ...finished });

  if (dryRun) return { published: false, route, containerId: container.id };

  const r = await call("POST", `${TARGET}/media_publish`, { creation_id: container.id });
  return { published: true, route, id: r.id, containerId: container.id };
}

// ---- CLI -------------------------------------------------------------------
// node src/publish-reel.mjs probe                      does resumable exist here?
// node src/publish-reel.mjs dry-run <file> <caption>   build + upload, never publish
// node src/publish-reel.mjs publish <file> <caption>
if (process.argv[1] && process.argv[1].endsWith("publish-reel.mjs")) {
  const [cmd, ...rest] = process.argv.slice(2);
  const run = async () => {
    if (cmd === "probe") {
      const c = await createResumableContainer({ caption: "probe, never published" });
      return {
        resumableSupported: Boolean(c.uri),
        containerId: c.id,
        uploadUri: c.uri,
        note: c.uri
          ? "resumable upload IS available on graph.instagram.com; this container was never filled and will expire"
          : "no upload uri returned: resumable is NOT available here, the hosted-URL route is required",
        raw: c.raw,
      };
    }
    if (cmd === "dry-run" || cmd === "publish") {
      const [file, ...caption] = rest;
      if (!file) throw new Error("need a file");
      return publishReel(path.resolve(file), caption.join(" "), {
        dryRun: cmd === "dry-run",
        onStep: (s) => console.error("  ..", JSON.stringify(s)),
      });
    }
    throw new Error(`unknown command: ${cmd ?? "(none)"}`);
  };
  run().then(
    (r) => console.log(JSON.stringify(r, null, 2)),
    (e) => { console.error("FAILED:", e.message); process.exit(1); }
  );
}
