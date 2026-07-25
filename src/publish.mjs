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

const API = "https://graph.instagram.com";
const VERSION = process.env.IG_API_VERSION || "v25.0";
// "me" resolves to the token's own account on graph.instagram.com.
const TARGET = process.env.IG_TARGET || "me";

const MAX_CHILDREN = 10;
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  const r = await call("POST", `${TARGET}/media_publish`, { creation_id: carouselId });
  return { published: true, id: r.id, carouselId, childIds };
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
    if (cmd === "quota") return publishingQuota();
    if (cmd === "dry-run" || cmd === "publish") {
      const [caption, ...urls] = rest;
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
