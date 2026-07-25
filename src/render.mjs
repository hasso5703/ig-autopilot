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
 * - Pictures are inlined as data URIs from `media/<slug>/imagery.json` rather
 *   than fetched by the page. A render that reaches the network is a render
 *   that can silently produce a different image than the one that was reviewed.
 * - Text is auto-fitted in-page by binary search on font-size, then the finished
 *   slide is measured. Two failures that shipped were invisible to every check
 *   we had: text that overflowed its shape, and text that filled a third of the
 *   frame and left the rest black. Both are measured here now.
 */

import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { slideHtml } from "./template.mjs";
import { loadPlaywright, chromiumExecutable } from "./browser.mjs";
import { loadImagery } from "./imagery.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

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
 * Turns the imagery sheet into what the template wants: a data URI plus the
 * credit line. A slide whose acquisition failed resolves to null, and the
 * template falls back to the abstract field — never to a substitute picture.
 */
export async function loadSlideImages(post) {
  const sheet = await loadImagery(post.slug);
  const out = {};
  for (const [n, entry] of Object.entries(sheet.slides || {})) {
    if (!entry || entry.failed || !entry.file) continue;
    try {
      const buf = await readFile(path.join(ROOT, entry.file));
      out[Number(n)] = {
        dataUri: `data:image/jpeg;base64,${buf.toString("base64")}`,
        credit: entry.credit || "",
        generated: !!entry.generated,
        focal: entry.focal || post.slides[Number(n) - 1]?.image?.focal || "center",
        mode: post.slides[Number(n) - 1]?.image?.mode || null,
      };
    } catch (err) {
      console.error(`warn: slide ${n} picture ${entry.file} could not be read (${err.message}) — falling back to the field`);
    }
  }
  return out;
}

/**
 * Runs inside the page: pick the largest font-size that still composes.
 *
 * An earlier version tested `scrollHeight <= clientHeight` on the element
 * itself, which is vacuously true for an auto-height block — so it always chose
 * the maximum and headlines silently spilled past their intended shape. Three
 * real constraints instead:
 *
 *   - a line budget (`data-maxlines`), because a hook that wraps to six lines
 *     is not a hook however well it technically fits;
 *   - the box the text was given (`.fitbox`, or the `.cell` it sits in) must
 *     contain it, which is what lets a stretching layout grow its type into the
 *     height it actually has;
 *   - the slide as a whole must not overflow the 1080x1350 canvas.
 */
const FIT_FN = () => {
  const slide = document.querySelector(".slide");
  const overflows = () =>
    slide.scrollHeight > slide.clientHeight + 1 ||
    document.body.scrollHeight > document.body.clientHeight + 1;

  // Padding is not a line. Display elements now carry the padding that keeps
  // their ink inside their own box, and counting it as content would tell the
  // fitter a three-line headline was four.
  const lineCount = (el) => {
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight);
    if (!lh || Number.isNaN(lh)) return 1;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    return Math.round((el.scrollHeight - pad) / lh);
  };

  /*
   * No tolerance any more, and that is the point. An earlier version allowed a
   * fifth of an em of slop here, because Anton paints outside a line box of 1.0
   * and every display element flush to the bottom of its box looked like it was
   * overflowing. Tolerating the ink meant the ink then got cropped by the
   * clipping that hid it, which took the tops off capitals and the tails off
   * descenders on published slides. The overhang is padding on the element now,
   * so it is real layout, and this check can be exact again.
   */
  const boxOverflows = (el) => {
    const box = el.closest(".cell") || el.closest(".fitbox");
    return !!box && box.scrollHeight > box.clientHeight + 1;
  };

  for (const el of document.querySelectorAll(".fit")) {
    const max = Number(el.dataset.max);
    const min = Number(el.dataset.min);
    const maxLines = Number(el.dataset.maxlines || 99);

    let lo = min, hi = max, best = min;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      el.style.fontSize = mid + "px";
      if (lineCount(el) <= maxLines && !boxOverflows(el) && !overflows()) { best = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }
    el.style.fontSize = best + "px";
  }

  const bad = [...document.querySelectorAll(".fit")]
    .filter((el) => Number(el.style.fontSize.replace("px", "")) <= Number(el.dataset.min))
    .map((el) => el.className.replace(/\s*(fit|mass|onpic|display)\s*/g, " ").trim() || "text");
  return { overflowing: overflows(), atFloor: bad };
};

/**
 * Runs inside the page after fitting: how much of the space this slide had for
 * type does its type actually occupy.
 *
 * This exists because of one published slide. Two panels, 48px text, centred in
 * a frame they used 38% of, with the rest black. Every fact on it was verified
 * and every automated check was green, because nothing measured whether the
 * design had been finished. It is the vertical extent that matters, not the
 * area: a column of text spanning the frame reads as designed even with air
 * between the lines.
 */
const COVERAGE_FN = () => {
  // Measured against the box the layout actually gave the type — the stretching
  // `.fitbox`, or the padded slide body for archetypes that do not use one.
  // Measuring against the whole canvas would punish the hook, whose top half is
  // deliberately photograph.
  const inner = document.querySelector(".fitbox") || document.querySelector(".cells") || document.querySelector(".inner");
  const masses = [...document.querySelectorAll(".mass")].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.height > 1 && r.width > 1 && el.textContent.trim().length;
  });
  if (!inner || !masses.length) return { coverage: 0, top: 0, bottom: 0, available: 0 };

  const box = inner.getBoundingClientRect();
  const style = getComputedStyle(inner);
  const available = box.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const top = Math.min(...masses.map((el) => el.getBoundingClientRect().top));
  const bottom = Math.max(...masses.map((el) => el.getBoundingClientRect().bottom));
  return {
    coverage: available > 0 ? (bottom - top) / available : 0,
    top: Math.round(top),
    bottom: Math.round(bottom),
    available: Math.round(available),
  };
};

/**
 * Runs inside the page after fitting: is any text sitting inside a box that
 * would crop it.
 *
 * Hasan found the bug this exists for by looking at a slide: the tops were
 * shaved off the capitals of "WHAT IT LOOKED LIKE" and the tails off the
 * descenders of the paragraph under it. Anton paints outside a line box of 1.0,
 * a `.fitbox` was clipping in order to keep the slide's scrollHeight clean of a
 * scaled background, and between them they trimmed published type. Every
 * automated check was green: the fitter was satisfied, coverage was high, the
 * facts were verified.
 *
 * The first version of this check compared bounding boxes and found nothing,
 * because `getBoundingClientRect` returns the LAYOUT box and the cropped part
 * was ink painting outside it. Measuring geometry cannot see this. The
 * invariant can: clipping is the picture layers' job and never text's, so no
 * ancestor of a text element may hide its overflow, the canvas itself excepted.
 * Structural, exact, and it fails the moment someone reaches for overflow:hidden
 * to fix a scrollHeight again.
 */
const CLIP_FN = () => {
  // The canvas itself must clip: <body> is the 1080x1350 frame, .slide is the
  // artwork, .picwrap holds the photograph that bleeds on purpose. Everything
  // else that hides overflow is a box someone put text into.
  const ALLOWED = new Set(["slide", "picwrap"]);
  const problems = [];
  const texts = [...document.querySelectorAll(".slide *")].filter(
    (el) => el.children.length === 0 && el.textContent.trim().length && el.getBoundingClientRect().height > 1
  );
  for (const el of texts) {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflow === "visible" && cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      if (p === document.body || p === document.documentElement) continue;
      if ([...p.classList].some((c) => ALLOWED.has(c))) continue;
      problems.push(
        `"${el.textContent.trim().slice(0, 34)}" sits inside .${p.className.split(" ")[0] || p.tagName.toLowerCase()}, which hides its overflow and will crop the ink of the type`
      );
      break;
    }
  }
  return [...new Set(problems)];
};

export async function renderPost(post, outDir, { images = null } = {}) {
  const { chromium } = await loadPlaywright();
  const brand = JSON.parse(await readFile(path.join(ROOT, "brand", "brand.json"), "utf8"));
  if (post.accent) brand.colors.accent = post.accent;
  const fonts = await loadFonts(brand);
  const pictures = images ?? (await loadSlideImages(post));

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

  try {
    for (let i = 0; i < total; i++) {
      const slide = post.slides[i];
      const html = slideHtml(brand, fonts, slide, i + 1, total, pictures[i + 1] || null);
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);

      // Fail loudly if ANY font did not load. A silent fallback to a generic
      // grotesque produces a publishable but off-brand image, and nobody
      // notices until it is on the grid — so check every family/weight we
      // actually use, not just the display face.
      //
      // Activate every declared face first. CSS font loading is lazy: a face is
      // only fetched when a glyph actually needs it, so on the hook slide
      // (whose Archivo text is all bold) Archivo 400 would still read
      // "unloaded". load() resolves from the inlined data URI, or leaves the
      // face unloaded if the font is genuinely broken, so the check keeps its
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
        throw new Error(`slide ${i + 1} (${slide.type}) overflows the canvas even at minimum type size — the copy is too long for this archetype`);
      if (fit.atFloor.length) warnings.push(`slide ${i + 1}: text hit its minimum size (${fit.atFloor.join(", ")}) — consider shortening the copy`);

      const clipped = await page.evaluate(CLIP_FN);
      if (clipped.length)
        throw new Error(`slide ${i + 1} (${slide.type}) puts text in a box that crops it:\n  ${clipped.join("\n  ")}`);

      const cov = await page.evaluate(COVERAGE_FN);
      const floor = brand.coverage?.[slide.type] ?? 0.55;
      if (cov.coverage < floor)
        throw new Error(
          `slide ${i + 1} (${slide.type}) leaves the frame empty: its type covers ${(cov.coverage * 100).toFixed(0)}% of the ${cov.available}px it was given, floor is ${(floor * 100).toFixed(0)}%. ` +
            `Write more, or move the point onto this slide — do not ship a slide that is mostly background.`
        );

      const file = path.join(outDir, `${String(i + 1).padStart(2, "0")}.jpg`);
      await page.screenshot({ path: file, type: "jpeg", quality: brand.jpegQuality });
      files.push(file);
      console.error(`slide ${i + 1} ${slide.type.padEnd(8)} coverage ${(cov.coverage * 100).toFixed(0)}%  picture ${pictures[i + 1] ? (pictures[i + 1].generated ? "generated" : "photo") : "none"}`);
    }
  } finally {
    await browser.close();
  }

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
