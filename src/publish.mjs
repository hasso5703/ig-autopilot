/**
 * Instagram carousel publishing via the Instagram API with Instagram Login.
 *
 * Host is graph.instagram.com (NOT graph.facebook.com — that is the
 * Facebook-Login path, which needs a linked Page and different permissions).
 *
 * Flow, per Meta's content-publishing reference:
 *   1. one item container per image, with is_carousel_item=true
 *   2. one parent container, media_type=CAROUSEL, children=<ids>, caption
 *   3. media_publish with creation_id=<parent id>
 *
 * Every image_url must be publicly reachable at publish time: Meta cURLs it
 * server-side. There is no raw-bytes upload path for images.
 */

import { execSync } from "node:child_process";

const API = "https://graph.instagram.com";
const VERSION = process.env.IG_API_VERSION || "v25.0";
// "me" resolves to the token's own account on graph.instagram.com.
const TARGET = process.env.IG_TARGET || "me";

const MAX_CHILDREN = 10;
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const REPO = process.env.IG_MEDIA_REPO || "hasso5703/ig-autopilot";

/**
 * Builds the public URLs Instagram will fetch, pinned to a commit SHA.
 *
 * This is not a stylistic choice. raw.githubusercontent.com caches
 * branch-path URLs (.../main/...) for several minutes, but treats
 * commit-path URLs (.../<sha>/...) as immutable. Measured on 2026-07-25:
 * immediately after a push that changed 01.jpg from 63450 to 109898 bytes,
 * the /main/ URL still served 63450 while the /<sha>/ URL served 109898.
 *
 * Meta copies the image to its own CDN at publish time, so fetching a stale
 * frame bakes the wrong artwork into the post permanently, with no error
 * anywhere. Always publish from the SHA.
 */
export function mediaUrls(slug, count, sha) {
  const rev = sha || execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  if (!/^[0-9a-f]{40}$/.test(rev)) throw new Error(`not a full commit sha: ${rev}`);
  return Array.from(
    { length: count },
    (_, i) => `https://raw.githubusercontent.com/${REPO}/${rev}/media/${slug}/${String(i + 1).padStart(2, "0")}.jpg`
  );
}

function requireToken() {
  const t = process.env.IG_ACCESS_TOKEN;
  if (!t) throw new Error("IG_ACCESS_TOKEN is not set");
  return t;
}

async function call(method, pathname, params, { token } = {}) {
  const url = new URL(`${API}/${VERSION}/${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: token ?? requireToken() });

  const res =
    method === "GET"
      ? await fetch(`${url}?${body}`)
      : await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${method} ${pathname} -> HTTP ${res.status}, non-JSON body: ${text.slice(0, 300)}`);
  }
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(
      `${method} ${pathname} -> HTTP ${res.status} ${e.type || ""} ` +
        `code=${e.code ?? "?"} subcode=${e.error_subcode ?? "-"}: ${e.message || text.slice(0, 300)}`
    );
  }
  return json;
}

/** Posts published in the trailing 24h. Instagram allows 100. */
export async function publishingQuota() {
  const r = await call("GET", `${TARGET}/content_publishing_limit`, { fields: "quota_usage,config" });
  return r.data?.[0] ?? { quota_usage: null };
}

export async function whoami() {
  return call("GET", `${TARGET}`, { fields: "id,username,account_type" });
}

async function createItemContainer(imageUrl) {
  const r = await call("POST", `${TARGET}/media`, {
    image_url: imageUrl,
    is_carousel_item: "true",
  });
  return r.id;
}

async function createCarouselContainer(childIds, caption) {
  const r = await call("POST", `${TARGET}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    ...(caption ? { caption } : {}),
  });
  return r.id;
}

/**
 * Containers are processed asynchronously. Publishing an unfinished container
 * fails, so we wait for FINISHED and surface ERROR / EXPIRED explicitly.
 */
async function waitForContainer(id) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let last = null;
  while (Date.now() < deadline) {
    const r = await call("GET", id, { fields: "status_code,status" });
    last = r;
    if (r.status_code === "FINISHED") return r;
    if (r.status_code === "ERROR" || r.status_code === "EXPIRED") {
      throw new Error(`container ${id} -> ${r.status_code}: ${r.status || "no detail"}`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`container ${id} still ${last?.status_code ?? "unknown"} after ${POLL_TIMEOUT_MS / 1000}s`);
}

/**
 * Publishes a carousel.
 * @param {string[]} imageUrls publicly reachable JPEG URLs, in slide order
 * @param {string}   caption
 * @param {{dryRun?: boolean}} opts dryRun builds every container but never publishes
 * @returns {Promise<{published: boolean, id?: string, carouselId: string, childIds: string[]}>}
 */
export async function publishCarousel(imageUrls, caption, opts = {}) {
  if (!Array.isArray(imageUrls) || imageUrls.length < 2) {
    throw new Error(`a carousel needs at least 2 images, got ${imageUrls?.length ?? 0}`);
  }
  if (imageUrls.length > MAX_CHILDREN) {
    throw new Error(`a carousel accepts at most ${MAX_CHILDREN} images, got ${imageUrls.length}`);
  }
  for (const u of imageUrls) {
    if (!/^https:\/\//.test(u)) throw new Error(`image_url must be https: ${u}`);
    if (!/\.jpe?g(\?|$)/i.test(u)) throw new Error(`Instagram accepts JPEG only: ${u}`);
  }

  const quota = await publishingQuota();
  if (typeof quota.quota_usage === "number" && quota.quota_usage >= 100) {
    throw new Error(`publishing quota exhausted (${quota.quota_usage}/100 in the last 24h)`);
  }

  const childIds = [];
  for (const url of imageUrls) {
    const id = await createItemContainer(url);
    await waitForContainer(id);
    childIds.push(id);
  }

  const carouselId = await createCarouselContainer(childIds, caption);
  await waitForContainer(carouselId);

  if (opts.dryRun) return { published: false, carouselId, childIds };

  return publishContainer(carouselId, caption, { childIds });
}

/**
 * Publish a finished container, and never report a success as a failure.
 *
 * A live run watched `media_publish` return HTTP 403 "Application request limit
 * reached" — and the carousel was already on the grid, created seconds earlier.
 * The CLI printed FAILED. The run's own instinct was to retry, which would have
 * put the same carousel on the account twice; it queried `me/media` by hand
 * first and found the post. That check belongs here, not in the judgement of
 * whoever happens to be reading the output.
 *
 * The asymmetry is the point: a retry after a real failure costs one duplicate
 * post that cannot be deleted through this API, while a wrongly-reported failure
 * costs nothing once somebody looks. So when the publish call throws, go and
 * look before believing it.
 */
export async function publishContainer(creationId, caption, extra = {}) {
  try {
    const r = await call("POST", `${TARGET}/media_publish`, { creation_id: creationId });
    return { published: true, id: r.id, creationId, ...extra };
  } catch (err) {
    const found = await findRecentByCaption(caption).catch(() => null);
    if (found) {
      return {
        published: true,
        id: found.id,
        permalink: found.permalink ?? null,
        creationId,
        ...extra,
        recoveredFromError: err.message,
        note:
          "media_publish reported an error but the post is live — found by reading back me/media. " +
          "DO NOT RETRY. Record this id and permalink as published.",
      };
    }
    throw new Error(
      `${err.message}

Checked me/media and found no post matching this caption, so nothing was published. ` +
        `Safe to retry once, after checking the quota.`
    );
  }
}

/**
 * The most recent post whose caption starts the same way as ours, published in
 * the last few minutes. Captions are compared on their first line only: Meta
 * normalises whitespace and can truncate, and the first line is the part this
 * pipeline writes most deliberately.
 */
export async function findRecentByCaption(caption, { withinMinutes = 15 } = {}) {
  const mine = String(caption || "").split("\n")[0].replace(/\s+/g, " ").trim().slice(0, 60).toLowerCase();
  if (mine.length < 12) return null;
  const r = await call("GET", `${TARGET}/media`, {
    fields: "id,caption,permalink,media_type,media_product_type,timestamp",
    limit: "10",
  });
  const cutoff = Date.now() - withinMinutes * 60000;
  for (const m of r.data || []) {
    if (new Date(m.timestamp).getTime() < cutoff) continue;
    const theirs = String(m.caption || "").split("\n")[0].replace(/\s+/g, " ").trim().slice(0, 60).toLowerCase();
    if (theirs && theirs === mine) return m;
  }
  return null;
}

// ---- CLI -------------------------------------------------------------------
// node src/publish.mjs whoami
// node src/publish.mjs quota
// node src/publish.mjs dry-run   <caption> <url1> <url2> ...
// node src/publish.mjs publish   <caption> <url1> <url2> ...
if (process.argv[1] && process.argv[1].endsWith("publish.mjs")) {
  const [cmd, ...rest] = process.argv.slice(2);
  const run = async () => {
    if (cmd === "whoami") return whoami();
    if (cmd === "recent") return call("GET", `${TARGET}/media`, { fields: "id,caption,permalink,media_type,timestamp", limit: "10" });
    if (cmd === "quota") return publishingQuota();
    if (cmd === "urls") {
      const [slug, count] = rest;
      return mediaUrls(slug, Number(count));
    }
    if (cmd === "dry-run" || cmd === "publish") {
      const [caption, ...urls] = rest;
      for (const u of urls) {
        if (/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/(main|master)\//.test(u))
          throw new Error(`refusing a branch-path media URL (${u}) — raw.githubusercontent caches those, and Instagram would bake a stale image into the post. Use: node src/publish.mjs urls <slug> <count>`);
      }
      return publishCarousel(urls, caption, { dryRun: cmd === "dry-run" });
    }
    throw new Error(`unknown command: ${cmd ?? "(none)"}`);
  };
  run().then(
    (r) => console.log(JSON.stringify(r, null, 2)),
    (e) => {
      console.error("FAILED:", e.message);
      process.exit(1);
    }
  );
}
