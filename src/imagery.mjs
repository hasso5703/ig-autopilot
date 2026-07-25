/**
 * Imagery — the layer that decides whether a thumb stops.
 *
 * Two published carousels were pure type on black. They are readable, they are
 * sourced, and they look like every other text account on the platform. What
 * stops a scroll is a picture, so every slide now gets one, and this module is
 * where pictures come from. Everything here is free and needs no account, on
 * purpose: an unattended routine cannot renew a key.
 *
 * Three providers, tried in the order a picture editor would try them.
 *
 *   photo         Openverse (api.openverse.org) — 800M openly licensed images
 *                 aggregated from Wikimedia, Flickr, museums. Anonymous access
 *                 is 20/min and 200/day, measured, which is ten times what a
 *                 three-post day needs.
 *   photo         Wikimedia Commons directly, when Openverse's index is thin on
 *                 a named entity (a company, a building, a person). Commons is
 *                 fresher than the aggregator for news subjects.
 *   illustration  Pollinations (image.pollinations.ai) — no key, no signup.
 *                 Anonymous callers get the `sana` model at 686x858 whatever
 *                 size is requested; the aspect ratio IS honoured, so ask for
 *                 the ratio you want and let the upscale below do the rest.
 *
 * LICENCE POLICY, and it is narrow on purpose. Only `cc0`, `pdm` and `by` are
 * accepted. Not `by-sa`: share-alike propagates to the composed slide, and a
 * carousel is a derivative work. Not `nc`, not `nd`. A picture we cannot prove
 * we may use is worse than no picture, because it is the kind of mistake that
 * arrives as a takedown months later.
 *
 * GENERATED IMAGES ARE NEVER DOCUMENTARY. A generated picture may set a mood,
 * an atmosphere, a concept. It may never depict the reported event, a named
 * person, or an identifiable real place, because this account's entire promise
 * is that what it shows is real. The routine writes the prompt; `validate.mjs`
 * refuses a generated image on a slide carrying evidence about a person, and
 * every generated image is stamped visibly on the slide.
 *
 * Usage:
 *   node src/imagery.mjs posts/<slug>.json           # acquire what is missing
 *   node src/imagery.mjs posts/<slug>.json --slide 3 --reroll   # try another
 *   node src/imagery.mjs candidates "<query>"        # look before committing
 */

import { readFile, writeFile, mkdir, stat, rm } from "node:fs/promises";
import path from "node:path";
import { ffmpeg } from "./ffmpeg.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

const UA = "order-of-magnitude/1.0 (Instagram editorial bot; +https://github.com/hasso5703/ig-autopilot)";

/** Licences whose obligations a composed slide can actually honour. */
export const ALLOWED_LICENCES = new Set(["cc0", "pdm", "by"]);

const MAX_DOWNLOAD = 30 * 1024 * 1024;

/** Everything the pipeline is allowed to know about a picture. */
const emptyCredit = { provider: null, license: null, creator: null, title: null, sourceUrl: null };

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const len = Number(res.headers.get("content-length") || 0);
  if (len > MAX_DOWNLOAD) throw new Error(`${url} is ${(len / 1e6).toFixed(1)} MB, over the ${MAX_DOWNLOAD / 1e6} MB cap`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_DOWNLOAD) throw new Error(`${url} is ${(buf.length / 1e6).toFixed(1)} MB, over the cap`);
  if (buf.length < 8000) throw new Error(`${url} returned ${buf.length} bytes, too small to be a usable photograph`);
  return buf;
}

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

/**
 * Openverse. `license_type=commercial,modification` still lets `by-sa` through,
 * so the licence set is filtered again here rather than trusted to the query.
 */
export async function searchOpenverse(query, { limit = 12 } = {}) {
  const u = new URL("https://api.openverse.org/v1/images/");
  u.searchParams.set("q", query);
  u.searchParams.set("license_type", "commercial,modification");
  u.searchParams.set("size", "large");
  u.searchParams.set("mature", "false");
  u.searchParams.set("page_size", String(limit));
  const data = await getJson(u.toString());
  return (data.results || [])
    .filter((r) => ALLOWED_LICENCES.has(String(r.license).toLowerCase()))
    .filter((r) => r.url && /\.(jpe?g|png|webp)(\?|$)/i.test(r.url))
    .map((r) => ({
      url: r.url,
      width: r.width || 0,
      height: r.height || 0,
      title: r.title || "",
      creator: r.creator || "",
      license: String(r.license).toLowerCase(),
      licenseVersion: r.license_version || "",
      sourceUrl: r.foreign_landing_url || r.url,
      provider: `openverse/${r.source || "unknown"}`,
      filesize: r.filesize || 0,
      tags: (r.tags || []).map((t) => (typeof t === "string" ? t : t.name)).filter(Boolean).slice(0, 30),
    }));
}

/**
 * Wikimedia Commons. The aggregator lags on breaking news subjects; Commons
 * itself does not. `extmetadata` carries the licence short name and the author
 * as HTML, which is why both are stripped before they reach a slide.
 */
export async function searchCommons(query, { limit = 10 } = {}) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  u.searchParams.set("action", "query");
  u.searchParams.set("format", "json");
  u.searchParams.set("generator", "search");
  u.searchParams.set("gsrsearch", `filetype:bitmap ${query}`);
  u.searchParams.set("gsrnamespace", "6");
  u.searchParams.set("gsrlimit", String(limit));
  u.searchParams.set("prop", "imageinfo");
  u.searchParams.set("iiprop", "url|size|extmetadata");
  u.searchParams.set("iiurlwidth", "1600");
  const data = await getJson(u.toString());
  const pages = Object.values(data?.query?.pages || {});
  const strip = (s) => String(s || "").replace(/<[^>]*>/g, "").trim();
  const licence = (m) => {
    const raw = strip(m?.LicenseShortName?.value || m?.License?.value).toLowerCase();
    if (/cc0|zero/.test(raw)) return "cc0";
    if (/public domain|pd-|pdm/.test(raw)) return "pdm";
    if (/cc by-sa|share.?alike/.test(raw)) return "by-sa";
    if (/cc by(?!-)/.test(raw)) return "by";
    return raw || "unknown";
  };
  return pages
    .map((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii) return null;
      const meta = ii.extmetadata || {};
      return {
        url: ii.thumburl || ii.url,
        width: ii.thumbwidth || ii.width || 0,
        height: ii.thumbheight || ii.height || 0,
        title: (p.title || "").replace(/^File:/, "").replace(/\.[a-z]+$/i, ""),
        creator: strip(meta.Artist?.value),
        license: licence(meta),
        licenseVersion: "",
        sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
        provider: "commons",
        filesize: ii.size || 0,
      };
    })
    .filter((c) => c && ALLOWED_LICENCES.has(c.license) && /\.(jpe?g|png|webp)$/i.test(c.url.split("?")[0]));
}

/**
 * Pollinations. Anonymous callers get one model and a fixed pixel budget, so
 * the only levers that matter are the prompt and the seed. `seed` is recorded
 * in the sidecar: a picture nobody can reproduce is a picture nobody can check.
 */
export async function generate(prompt, { seed = 1, width = 1080, height = 1350, timeout = 120000 } = {}) {
  const u = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
  u.searchParams.set("width", String(width));
  u.searchParams.set("height", String(height));
  u.searchParams.set("nologo", "true");
  u.searchParams.set("safe", "true");
  u.searchParams.set("seed", String(seed));
  const res = await fetch(u.toString(), {
    headers: { "User-Agent": UA, Referer: "https://github.com/hasso5703/ig-autopilot" },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`pollinations -> HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) throw new Error(`pollinations returned ${buf.length} bytes`);
  return buf;
}

/* ------------------------------------------------------------------ *
 * Choosing
 * ------------------------------------------------------------------ */

/**
 * A picture editor's ranking, written down. Resolution first, because a slide
 * is 1080 wide and a 640px photograph blown up to fill it looks like a scan.
 */
export function scoreCandidate(c) {
  let score = 0;
  const px = c.width * c.height;
  if (px >= 1920 * 1080) score += 3;
  else if (px >= 1280 * 720) score += 2;
  else if (px >= 900 * 600) score += 1;
  else score -= 3;
  if (c.width < 900) score -= 4;

  const ratio = c.height ? c.width / c.height : 1;
  if (ratio >= 0.7 && ratio <= 1.9) score += 2;
  else if (ratio > 2.6 || ratio < 0.5) score -= 3;

  if (c.license === "cc0" || c.license === "pdm") score += 2;
  if (/wikimedia|commons|nasa|smithsonian|science_museum|met/.test(c.provider)) score += 1;
  if (/flickr/.test(c.provider)) score += 0.5;

  // Diagrams, logos and screenshots read as clip art at full bleed.
  if (/\b(logo|icon|diagram|chart|map|screenshot|flag|coat of arms)\b/i.test(c.title)) score -= 4;
  return score;
}

/**
 * Both indexes are keyword search, not natural language. "librarian helping
 * patron at public library desk" returns nothing at all while "librarian
 * library" returns hundreds, so a query that finds nothing is retried shorter
 * before the slide is given up on. Longest first: precision when it exists.
 */
const STOPWORDS = new Set("a an the of at in on for with and to from by into over under its their his her this that new".split(" "));

export function queryLadder(query) {
  const words = query.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
  const salient = words.filter((w) => !STOPWORDS.has(w) && w.length > 2);
  const ladder = [query];
  if (salient.length > 3) ladder.push(salient.slice(0, 3).join(" "));
  if (salient.length > 1) ladder.push(salient.slice(0, 2).join(" "));
  if (salient.length) ladder.push(salient[0]);
  return [...new Set(ladder)];
}

/* ------------------------------------------------------------------ *
 * Normalising
 * ------------------------------------------------------------------ */

/**
 * Every acquired picture is re-encoded to a common shape before it is allowed
 * near a slide: at most 1440px on the long edge (base64 of the original goes
 * into the page, and a 12 MP photograph makes Chromium crawl), upscaled with
 * lanczos when it arrives smaller than the canvas, always progressive JPEG.
 *
 * The unsharp pass matters for generated pictures specifically: the free tier
 * returns 686x858 and everything downstream shows it at 1080 wide.
 */
async function normalise(inputPath, outputPath) {
  const filters = [
    "scale='if(gt(a,1),min(1440,max(iw,1080)),-2)':'if(gt(a,1),-2,min(1800,max(ih,1350)))':flags=lanczos",
    "unsharp=5:5:0.35:3:3:0.2",
  ].join(",");
  await ffmpeg(["-y", "-i", inputPath, "-vf", filters, "-q:v", "3", outputPath]);
  await rm(inputPath, { force: true });
  const { size } = await stat(outputPath);
  if (size < 5000) throw new Error(`normalised image is ${size} bytes — the source was probably not an image`);
  return outputPath;
}

/* ------------------------------------------------------------------ *
 * Acquisition
 * ------------------------------------------------------------------ */

/**
 * One line, and a short one. The first version printed title, author and
 * licence, wrapped onto two lines of 17px grey, and read as a legal notice
 * stapled to the artwork. CC BY asks for attribution, not for a catalogue
 * entry: the author and the licence discharge it, and the full record with the
 * title and the URL lives in `imagery.json` where it can be audited.
 */
export function creditLine(entry) {
  if (entry.generated) return "Illustration · AI-generated";
  const lic = { cc0: "CC0", pdm: "Public domain", by: "CC BY" }[entry.license] || entry.license;
  const who = (entry.creator || entry.title || "").replace(/\s+/g, " ").trim();
  const short = who.length > 34 ? who.slice(0, 33).trimEnd() + "…" : who;
  return [short, lic].filter(Boolean).join(" · ");
}

/**
 * Acquire one slide's picture.
 *
 * `spec` is what the routine wrote in the post:
 *   { kind: "photo", query: "…", alt: "…" }
 *   { kind: "illustration", prompt: "…", alt: "…", seed?: n }
 */
export async function acquireOne(spec, { dir, name, attempt = 0 }) {
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${name}.raw`);
  const out = path.join(dir, `${name}.jpg`);

  if (spec.kind === "illustration") {
    const seed = spec.seed ?? 1000 + attempt * 137;
    const buf = await generate(spec.prompt, { seed });
    await writeFile(tmp, buf);
    await normalise(tmp, out);
    return {
      ...emptyCredit,
      file: path.relative(ROOT, out),
      generated: true,
      provider: "pollinations/sana",
      license: "generated",
      prompt: spec.prompt,
      seed,
      alt: spec.alt || "",
    };
  }

  const query = spec.query || spec.prompt || "";
  if (!query) throw new Error("a photo image spec needs a `query`");

  /*
   * Relevance, checked rather than assumed, and checked at every rung of the
   * ladder. Both indexes rank on their own signals and will happily answer
   * "electrical substation night" with a bronze horse sculpture at a place
   * called Don Mills *station* — which is what the first run of this module put
   * on a slide. A candidate has to actually mention something the query asked
   * for, and a rung that returns only irrelevant pictures is treated as empty.
   */
  const wanted = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const isRelevant = (c) => {
    const hay = `${c.title} ${(c.tags || []).join(" ")}`.toLowerCase();
    return wanted.some((w) => hay.includes(w.replace(/s$/, "")));
  };

  let candidates = [];
  let nearMiss = null;
  for (const q of queryLadder(query)) {
    let found = await searchOpenverse(q);
    if (found.length < 3) {
      try {
        found = found.concat(await searchCommons(q));
      } catch (err) {
        console.error(`warn: Commons search failed (${err.message}) — continuing with Openverse only`);
      }
    }
    nearMiss ||= found[0] || null;
    candidates = found.filter(isRelevant);
    if (candidates.length) break;
  }
  if (!candidates.length && nearMiss)
    throw new Error(
      `nothing openly licensed actually matches "${query}". Closest was "${nearMiss.title}", which is about something else. ` +
        `Use a plainer query, or make this slide an illustration.`
    );
  candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  if (!candidates.length) throw new Error(`no openly licensed photograph found for "${query}"`);

  const errors = [];
  for (const c of candidates.slice(attempt, attempt + 5)) {
    try {
      await writeFile(tmp, await download(c.url));
      await normalise(tmp, out);
      return {
        file: path.relative(ROOT, out),
        generated: false,
        provider: c.provider,
        license: c.license,
        creator: c.creator,
        title: c.title,
        sourceUrl: c.sourceUrl,
        alt: spec.alt || c.title,
      };
    } catch (err) {
      errors.push(`${c.url}: ${err.message}`);
    }
  }
  throw new Error(`every candidate for "${query}" failed:\n  ${errors.join("\n  ")}`);
}

/** Where a post's imagery lives. Raw pictures are cache, not history. */
export function imageryPaths(slug) {
  const dir = path.join(ROOT, "media", slug, "src");
  return { dir, sidecar: path.join(ROOT, "media", slug, "imagery.json") };
}

export async function loadImagery(slug) {
  const { sidecar } = imageryPaths(slug);
  try {
    return JSON.parse(await readFile(sidecar, "utf8"));
  } catch {
    return { slug, slides: {} };
  }
}

export async function acquirePost(post, { only = null, reroll = false } = {}) {
  const { dir, sidecar } = imageryPaths(post.slug);
  const sheet = await loadImagery(post.slug);
  sheet.slug = post.slug;
  sheet.acquired = new Date().toISOString();
  sheet.slides ||= {};
  const failures = [];

  for (let i = 0; i < post.slides.length; i++) {
    const n = i + 1;
    const spec = post.slides[i].image;
    if (!spec) continue;
    if (only && only !== n) continue;
    const existing = sheet.slides[n];
    if (existing && !reroll) continue;

    const attempt = reroll ? (existing?.attempt ?? 0) + 1 : 0;
    const name = String(n).padStart(2, "0");

    /*
     * One slide that cannot find a picture must not cost the whole post, and it
     * must never be quietly filled with a generated one instead: a made-up
     * picture standing in for a documentary one is the exact failure this
     * account cannot afford. So the slide is recorded as failed, the render
     * falls back to the abstract field, and the failure is printed loudly for
     * the run to fix with a different query or an explicit illustration.
     */
    try {
      const entry = await acquireOne(spec, { dir, name, attempt });
      entry.attempt = attempt;
      entry.credit = creditLine(entry);
      sheet.slides[n] = entry;
      console.log(`slide ${n}: ${entry.generated ? "generated" : "photo"} — ${entry.credit}  ->  ${entry.file}`);
    } catch (err) {
      sheet.slides[n] = { failed: true, kind: spec.kind, query: spec.query || spec.prompt, error: err.message };
      failures.push(`slide ${n} (${spec.kind}): ${err.message}`);
      console.error(`FAILED slide ${n} (${spec.kind}): ${err.message}`);
    }
  }

  await mkdir(path.dirname(sidecar), { recursive: true });
  await writeFile(sidecar, JSON.stringify(sheet, null, 2) + "\n");
  if (failures.length) console.error(`\n${failures.length} slide(s) have no picture:\n  ${failures.join("\n  ")}`);
  return sheet;
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [cmd, ...rest] = process.argv.slice(2);

  if (cmd === "candidates") {
    const q = rest.join(" ");
    const found = [...(await searchOpenverse(q)), ...(await searchCommons(q).catch(() => []))];
    found.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
    for (const c of found.slice(0, 12)) {
      console.log(`${scoreCandidate(c).toFixed(1).padStart(5)}  ${String(c.width)}x${c.height}  ${c.license.padEnd(4)}  ${c.provider.padEnd(20)}  ${c.title.slice(0, 60)}`);
      console.log(`       ${c.url}`);
    }
    if (!found.length) console.log(`no candidates for "${q}"`);
  } else if (cmd) {
    const post = JSON.parse(await readFile(cmd, "utf8"));
    const slideArg = rest.indexOf("--slide");
    const only = slideArg >= 0 ? Number(rest[slideArg + 1]) : null;
    await acquirePost(post, { only, reroll: rest.includes("--reroll") });
  } else {
    console.error("usage: node src/imagery.mjs <post.json> [--slide N] [--reroll]\n       node src/imagery.mjs candidates \"<query>\"");
    process.exit(2);
  }
}
