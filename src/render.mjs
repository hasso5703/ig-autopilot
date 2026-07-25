/**
 * Renders a post spec into 1080x1350 JPEG slides using Chromium via Playwright.
 *
 * Usage:  node src/render.mjs <post.json> [outDir]
 *
 * Design notes
 * ------------
 * - Exact pixel output: viewport is the canvas, deviceScaleFactor 1, so a
 *   screenshot is the artwork, not a scaled approximation.
 * - Instagram accepts JPEG only, so we never emit PNG.
 * - Text is auto-fitted in-page by binary search on font-size. A headline that
 *   silently overflows is the most common way these templates break, and it is
 *   invisible until someone looks at the image.
 */

import { readFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";
import { slideHtml } from "./template.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

/**
 * Playwright is installed globally in the cloud sandbox, not in this repo.
 * `NODE_PATH` does not help: Node's ESM resolver ignores it entirely (it only
 * ever applied to CommonJS `require`). Verified the hard way — a bare
 * `import("playwright")` fails with ERR_MODULE_NOT_FOUND there.
 *
 * So resolve it explicitly: try a normal import first (works when installed
 * locally), then fall back to requiring it by absolute path. This keeps the
 * pipeline a single command with no symlink or setup step to forget.
 */
async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (localMiss) {
    const require = createRequire(import.meta.url);
    const candidates = [process.env.PLAYWRIGHT_PKG, "/opt/node22/lib/node_modules/playwright"];
    try {
      candidates.push(path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "playwright"));
    } catch {
      /* npm not on PATH; the explicit candidates may still hit */
    }
    for (const c of candidates.filter(Boolean)) {
      try {
        return require(c);
      } catch {
        /* try the next candidate */
      }
    }
    throw new Error(
      `cannot resolve the 'playwright' package. Tried a local import and: ${candidates.filter(Boolean).join(", ")}. ` +
        `Set PLAYWRIGHT_PKG to its absolute path. Original error: ${localMiss.message}`
    );
  }
}

/**
 * Playwright normally resolves its browser from PLAYWRIGHT_BROWSERS_PATH.
 * We fall back to globbing that directory so a bumped Chromium build number
 * does not break the pipeline.
 */
async function chromiumExecutable() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  const entries = await readdir(base).catch(() => []);
  for (const e of entries.filter((x) => x.startsWith("chromium")).sort().reverse()) {
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell"]) {
      const p = path.join(base, e, rel);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

async function loadFonts(brand) {
  const dir = path.join(ROOT, "brand", "fonts");
  const specs = [brand.fonts.display, brand.fonts.body, brand.fonts.bodyBold];
  return Promise.all(
    specs.map(async (f) => ({
      family: f.family,
      weight: f.weight,
      base64: (await readFile(path.join(dir, f.file))).toString("base64"),
    }))
  );
}

/**
 * Runs inside the page: pick the largest font-size that still composes.
 *
 * The previous version tested `scrollHeight <= clientHeight` on the element
 * itself, which is vacuously true for an auto-height block — so it always
 * chose the maximum and headlines silently spilled past their intended shape.
 * Two real constraints instead:
 *
 *   - a line budget (`data-maxlines`), because a hook that wraps to six lines
 *     is not a hook however well it technically fits;
 *   - the slide as a whole must not overflow the 1080x1350 canvas.
 */
const FIT_FN = () => {
  const slide = document.querySelector(".slide");
  const overflows = () =>
    slide.scrollHeight > slide.clientHeight + 1 ||
    document.body.scrollHeight > document.body.clientHeight + 1;

  const lineCount = (el) => {
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    if (!lh || Number.isNaN(lh)) return 1;
    return Math.round(el.scrollHeight / lh);
  };

  for (const el of document.querySelectorAll(".fit")) {
    const max = Number(el.dataset.max);
    const min = Number(el.dataset.min);
    const maxLines = Number(el.dataset.maxlines || 99);

    let lo = min, hi = max, best = min;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      el.style.fontSize = mid + "px";
      if (lineCount(el) <= maxLines && !overflows()) { best = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }
    el.style.fontSize = best + "px";
  }

  // Report anything that ended up at its floor and still does not compose:
  // better a loud failure than a quietly ugly slide.
  const bad = [...document.querySelectorAll(".fit")]
    .filter((el) => Number(el.style.fontSize.replace("px", "")) <= Number(el.dataset.min))
    .map((el) => el.className);
  return { overflowing: overflows(), atFloor: bad };
};

export async function renderPost(post, outDir) {
  const { chromium } = await loadPlaywright();
  const brand = JSON.parse(await readFile(path.join(ROOT, "brand", "brand.json"), "utf8"));
  if (post.accent) brand.colors.accent = post.accent;
  const fonts = await loadFonts(brand);

  await mkdir(outDir, { recursive: true });

  const executablePath = await chromiumExecutable();
  const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
  const page = await browser.newPage({
    viewport: { width: brand.canvas.width, height: brand.canvas.height },
    deviceScaleFactor: 1,
  });

  const files = [];
  const warnings = [];
  const total = post.slides.length;

  for (let i = 0; i < total; i++) {
    const html = slideHtml(brand, fonts, post.slides[i], i + 1, total);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    // Fail loudly if ANY font did not load. A silent fallback to a generic
    // grotesque produces a publishable but off-brand image, and nobody notices
    // until it is on the grid — so check every family/weight we actually use,
    // not just the display face.
    //
    // Activate every declared face first. CSS font loading is lazy: a face is
    // only fetched when a glyph actually needs it, so on the hook slide (whose
    // Archivo text is all bold) Archivo 400 would still read "unloaded" and on
    // the CTA slide (no bold) Archivo 700 would — a false alarm on a perfectly
    // good font. load() resolves from the inlined data URI, or leaves the face
    // unloaded if the font is genuinely broken, so the check below keeps its
    // teeth: it still catches a real failure, it just no longer invents one.
    const missing = await page.evaluate(
      async (specs) => {
        await Promise.allSettled([...document.fonts].map((f) => f.load()));
        return specs.filter((s) => !document.fonts.check(`${s.weight} 100px '${s.family}'`));
      },
      fonts.map((f) => ({ family: f.family, weight: f.weight }))
    );
    if (missing.length) {
      const names = missing.map((m) => `${m.family} ${m.weight}`).join(", ");
      throw new Error(`fonts failed to load (${names}) — refusing to render off-brand slides`);
    }

    const fit = await page.evaluate(FIT_FN);
    if (fit.overflowing)
      throw new Error(`slide ${i + 1} (${post.slides[i].type}) overflows the canvas even at minimum type size — the copy is too long for this archetype`);
    if (fit.atFloor.length) warnings.push(`slide ${i + 1}: text hit its minimum size (${fit.atFloor.join(", ")}) — consider shortening the copy`);

    const file = path.join(outDir, `${String(i + 1).padStart(2, "0")}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: brand.jpegQuality });
    files.push(file);
  }

  await browser.close();
  for (const w of warnings) console.error(`warn: ${w}`);
  return files;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error("usage: node src/render.mjs <post.json> [outDir]");
    process.exit(2);
  }
  const post = JSON.parse(await readFile(specPath, "utf8"));
  const outDir = process.argv[3] || path.join(ROOT, "media", post.slug);
  const files = await renderPost(post, outDir);
  for (const f of files) console.log(f);
}
