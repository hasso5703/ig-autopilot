/**
 * Minimal dependency-free RSS / Atom reader.
 *
 * Deliberately not a full XML parser: feeds are fetched from a fixed allowlist
 * of known publishers, and a hand-rolled extractor has no install step and
 * cannot break because a transitive dependency changed. If a feed's shape ever
 * defeats it, that feed yields zero items and the run continues on the others,
 * which is the correct failure mode for a news pipeline.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const UA = "order-of-magnitude/1.0 (+https://github.com/hasso5703/ig-autopilot)";
const FETCH_TIMEOUT_MS = 20000;

const strip = (s) =>
  (s ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) =>
      ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&#39;": "'" })[m] ?? m
    )
    .replace(/\s+/g, " ")
    .trim();

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? strip(m[1]) : "";
};

/** Atom puts the URL in an attribute, RSS in the element body. */
function itemLink(xml) {
  const atom =
    xml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) ||
    xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (atom) return atom[1];
  const rss = tag(xml, "link");
  return rss || "";
}

function parseFeed(xml, sourceName) {
  const blocks = xml.match(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi) || [];
  return blocks
    .map((b) => {
      const dateRaw =
        tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date");
      const d = dateRaw ? new Date(dateRaw) : null;
      return {
        source: sourceName,
        title: tag(b, "title"),
        url: itemLink(b),
        summary: (tag(b, "description") || tag(b, "summary") || tag(b, "content")).slice(0, 600),
        published: d && !isNaN(d) ? d.toISOString() : null,
      };
    })
    .filter((i) => i.title && i.url);
}

async function fetchFeed(feed) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feed.url, { headers: { "user-agent": UA, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" }, signal: ctrl.signal });
    if (!res.ok) return { feed, ok: false, error: `HTTP ${res.status}`, items: [] };
    const items = parseFeed(await res.text(), feed.name);
    return { feed, ok: true, items };
  } catch (e) {
    // A blocked host in the sandbox surfaces here; report it rather than hide it.
    return { feed, ok: false, error: e.name === "AbortError" ? "timeout" : e.message, items: [] };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fetches every configured feed concurrently.
 * @param {{maxAgeHours?: number}} opts
 * @returns {Promise<{items: object[], report: object[]}>}
 */
/**
 * How long an item stays eligible, by tier.
 *
 * One window for every source was wrong, and a live check showed why: on a
 * Saturday all seven primary sources were empty inside 36 hours while the press
 * feeds carried 51 items. Nothing was broken — labs do not publish daily and
 * arXiv is legitimately closed at weekends — but the effect was that the
 * pipeline almost never saw the sources the manual tells it to prefer.
 *
 * The two kinds of source decay at different rates. A lab's own announcement
 * from three days ago is still the story if nobody has told it well; a news
 * report from three days ago is old news. So primary sources get four days and
 * the press keeps the tight window. Repetition is already prevented by state,
 * not by the clock.
 */
const TIER1_MAX_AGE_HOURS = 96;

export async function gather(opts = {}) {
  const maxAgeHours = opts.maxAgeHours ?? 48;
  const cfg = JSON.parse(await readFile(path.join(ROOT, "sources.json"), "utf8"));
  const feeds = [
    ...cfg.tier1_primary.map((f) => ({ ...f, tier: 1, maxAgeHours: f.maxAgeHours ?? Math.max(maxAgeHours, TIER1_MAX_AGE_HOURS) })),
    ...cfg.tier2_press.map((f) => ({ ...f, tier: 2, maxAgeHours: f.maxAgeHours ?? maxAgeHours })),
  ];

  const results = await Promise.all(feeds.map(fetchFeed));
  const now = Date.now();

  const items = results
    .flatMap((r) =>
      r.items
        .filter((i) => !i.published || new Date(i.published).getTime() >= now - r.feed.maxAgeHours * 3600 * 1000)
        .map((i) => ({ ...i, weight: r.feed.weight ?? 0.5, tier: r.feed.tier }))
    )
    .sort((a, b) => (b.published || "").localeCompare(a.published || ""));

  const kept = {};
  for (const i of items) kept[i.source] = (kept[i.source] ?? 0) + 1;

  const report = results.map((r) => ({
    name: r.feed.name,
    ok: r.ok,
    fetched: r.items.length,
    fresh: kept[r.feed.name] ?? 0,
    windowHours: r.feed.maxAgeHours,
    ...(r.ok ? {} : { error: r.error }),
  }));

  return { items, report };
}

if (process.argv[1] && process.argv[1].endsWith("feeds.mjs")) {
  const hours = Number(process.argv[2] || 48);
  const { items, report } = await gather({ maxAgeHours: hours });
  console.error("FEED REPORT          fresh / fetched   window");
  for (const r of report) {
    console.error(
      `  ${r.ok ? "ok  " : "FAIL"} ${String(r.fresh).padStart(4)} /${String(r.fetched).padStart(5)}   ${String(r.windowHours) + "h"}`.padEnd(34) +
        `  ${r.name}${r.error ? "  <- " + r.error : ""}`
    );
  }
  console.error(`\n${items.length} fresh items (press ${hours}h, primary sources ${TIER1_MAX_AGE_HOURS}h)\n`);
  console.log(JSON.stringify(items, null, 2));
}
