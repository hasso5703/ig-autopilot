/**
 * Publishing a Reel.
 *
 * The flow, and there is only one that works here:
 *
 *   POST me/media  media_type=REELS  video_url=<public https url>  caption
 *     -> { id }
 *   GET  <id>?fields=status_code            until FINISHED (Meta transcodes)
 *   POST me/media_publish  creation_id=<id>
 *
 * This was expected to be the fallback rather than the route. Meta documents a
 * resumable upload that takes raw bytes and needs nothing hosted, which would
 * have been the better answer: a Reel is around 1.1 MB and git history never
 * shrinks, so hosting one a day costs roughly 400 MB a year that deleting the
 * file will not reclaim.
 *
 * SETTLED 2026-07-25 against the live account: resumable does not exist on
 * graph.instagram.com with an Instagram Login token. It is not a soft absence
 * either. Meta rejects the request before creating anything:
 *
 *   HTTP 400 code=100  "The parameter video_url is required"
 *
 * So the video must be publicly fetchable at publish time, exactly like the
 * carousel images, and for the same reason it is pinned to a commit SHA rather
 * than a branch path. Meta fetches it once and copies it to its own CDN, so
 * nothing needs to stay reachable afterwards; when the repository gets heavy
 * the answer is GitHub release assets, which live outside git history.
 *
 * The resumable path is kept behind an explicit `tryResumable` flag so that if
 * Meta ever enables it for Instagram Login, switching is one argument.
 */

import { readFile, stat } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const REPO = process.env.IG_MEDIA_REPO || "hasso5703/ig-autopilot";

/**
 * The public URL Meta will fetch the video from.
 *
 * Pinned to a commit SHA for the same reason the carousel images are:
 * raw.githubusercontent caches branch-path URLs for minutes but treats
 * commit-path URLs as immutable. Measured on 2026-07-25, a /main/ URL served a
 * stale image for several minutes after the push that replaced it. Meta copies
 * the file to its own CDN at publish time, so fetching a stale frame bakes the
 * wrong artwork in permanently, with no error anywhere.
 *
 * The cost, stated plainly: a Reel is around 1.1 MB and git history never
 * shrinks, so this adds roughly 400 MB a year that cannot be reclaimed by
 * deleting the file later. That is comfortable for a year or two and is not a
 * permanent answer. Meta only fetches the file once, at container creation, so
 * nothing needs to stay hosted afterwards; when the repository gets heavy the
 * fix is to serve videos from GitHub release assets, which live outside git
 * history and can be deleted, rather than to rewrite history.
 */
export function reelUrl(slug, sha) {
  const rev = sha || execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  if (!/^[0-9a-f]{40}$/.test(rev)) throw new Error(`not a full commit sha: ${rev}`);
  return `https://raw.githubusercontent.com/${REPO}/${rev}/media/${slug}/reel.mp4`;
}

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
 * Attempts a resumable container.
 *
 * SETTLED 2026-07-25, against the live account: this does not exist on
 * graph.instagram.com with an Instagram Login token. The failure is not the
 * graceful one this function originally assumed. Meta does not return a
 * container without an upload URI; it refuses the request outright:
 *
 *   HTTP 400 code=100  "The parameter video_url is required"
 *
 * which is the API saying, in its own way, that the only route here is a
 * publicly fetchable URL. The first version of this code treated a missing URI
 * as the signal and therefore crashed instead of reporting, which is exactly
 * the shape of bug that makes a probe useless. It now catches the refusal and
 * returns it as an answer.
 *
 * @returns {Promise<{supported: boolean, id?: string, uri?: string, error?: object}>}
 */
export async function createResumableContainer({ caption, shareToFeed = true, audioName, thumbOffsetMs = THUMB_OFFSET_MS } = {}) {
  try {
    const r = await call("POST", `${TARGET}/media`, {
      media_type: "REELS",
      upload_type: "resumable",
      share_to_feed: shareToFeed ? "true" : "false",
      ...(thumbOffsetMs != null ? { thumb_offset: String(thumbOffsetMs) } : {}),
      ...(caption ? { caption } : {}),
      ...(audioName ? { audio_name: audioName } : {}),
    });
    return { supported: Boolean(r.uri), id: r.id, uri: r.uri ?? null, raw: r };
  } catch (e) {
    return { supported: false, error: { message: e.message }, raw: null };
  }
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

  // The hosted route is the only one that works on this API path; resumable is
  // kept behind an explicit opt-in so that if Meta ever enables it for
  // Instagram Login the switch is one flag, not a rewrite.
  let container;
  let route;

  if (!videoUrl && opts.tryResumable) {
    const r = await createResumableContainer({ caption, shareToFeed, audioName });
    if (r.supported) {
      route = "resumable";
      container = r;
      onStep({ step: "container", route, id: r.id, uri: r.uri });
      await uploadBytes(r.uri, file);
      onStep({ step: "uploaded", bytes: (await stat(file)).size });
    } else {
      onStep({ step: "resumable-unavailable", detail: r.error?.message ?? "no upload uri returned" });
    }
  }

  if (!container) {
    if (!videoUrl) {
      throw new Error(
        "a Reel needs a publicly fetchable video_url on this API path. Resumable upload is not available " +
          "with an Instagram Login token: Meta answers HTTP 400 code=100 'The parameter video_url is required'. " +
          "Commit the MP4 and pass the SHA-pinned URL from reelUrl(slug)."
      );
    }
    route = "hosted";
    container = await createHostedContainer(videoUrl, { caption, shareToFeed, audioName });
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
        resumableSupported: c.supported,
        containerId: c.id ?? null,
        uploadUri: c.uri ?? null,
        error: c.error ?? null,
        note: c.supported
          ? "resumable upload IS available; this container was never filled and will expire"
          : "resumable upload is NOT available on this API path. Meta answers HTTP 400 code=100 " +
            "'The parameter video_url is required'. Use the hosted route: commit the MP4 and pass reelUrl(slug).",
        raw: c.raw,
      };
    }
    if (cmd === "url") {
      const [slug, sha] = rest;
      if (!slug) throw new Error("usage: url <slug> [sha]");
      return reelUrl(slug, sha);
    }
    if (cmd === "dry-run" || cmd === "publish") {
      const [file, ...caption] = rest;
      if (!file) throw new Error("need a file");
      const url = process.env.IG_REEL_URL || null;
      if (url && /raw\.githubusercontent\.com\/[^/]+\/[^/]+\/(main|master)\//.test(url))
        throw new Error(`refusing a branch-path video URL (${url}) — raw.githubusercontent caches those and Instagram would bake a stale video into the post. Use: node src/publish-reel.mjs url <slug>`);
      return publishReel(path.resolve(file), caption.join(" "), {
        dryRun: cmd === "dry-run",
        videoUrl: url,
        tryResumable: process.argv.includes("--try-resumable"),
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
