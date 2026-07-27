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
import { ffmpeg } from "./ffmpeg.mjs";
import { writeFile, rm } from "node:fs/promises";
import os from "node:os";

const ROOT = path.resolve(import.meta.dirname, "..");

/**
 * One account, not one post.
 *
 * Four covers side by side on the profile grid were indistinguishable: the same
 * cold blue-teal photograph, the same cyan accent, the same layout, the same
 * position. What makes this one account is the typeface, the black ground and
 * the handle. What should make each post a different one is the accent, and it
 * was nailed to a single cyan.
 *
 * The mood the post already declares picks it. An explicit `accent` still wins,
 * because a story occasionally wants a colour no mood covers.
 */
export function applyPalette(brand, post) {
  const p = brand.palettes?.[post?.mood];
  if (p) {
    brand.colors.accent = p.accent;
    brand.colors.accentInk = p.accentInk;
  }
  if (post?.accent) brand.colors.accent = post.accent;
  if (post?.accentInk) brand.colors.accentInk = post.accentInk;
  return brand;
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

  /*
   * Width, which nothing measured until a stat slide shipped its figure clipped.
   * "$100M" carries no space, so it can never wrap: the line count stays 1, no
   * box spills vertically, and the fitter happily locked it to the 520px
   * ceiling and painted the M off the right edge. `body` is overflow:hidden, so
   * the spill was invisible to every other check here. Any figure past about
   * three glyphs was affected, silently.
   */
  const widthOverflows = (el) => {
    if (el.scrollWidth > el.clientWidth + 1) return true;
    const box = el.closest(".cell") || el.closest(".fitbox");
    return !!box && box.scrollWidth > box.clientWidth + 1;
  };

  for (const el of document.querySelectorAll(".fit")) {
    const max = Number(el.dataset.max);
    const min = Number(el.dataset.min);
    const maxLines = Number(el.dataset.maxlines || 99);

    let lo = min, hi = max, best = min;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      el.style.fontSize = mid + "px";
      if (lineCount(el) <= maxLines && !boxOverflows(el) && !widthOverflows(el) && !overflows()) { best = mid; lo = mid + 1; }
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

/**
 * How bright is the brightest part of the backdrop under the text.
 *
 * Not the mean. The mean said 30% for a slide whose body copy sat across a
 * sunlit barrel vault at nearly 70%, because the dark reading room below it
 * pulled the average down — and the average is not what anyone reads on. The
 * crop is box-averaged into a 6x8 grid instead and the check runs against the
 * 88th percentile cell: bright enough to catch a window behind two words,
 * forgiving enough not to be ruled by one specular highlight.
 */
export async function regionLuma(png, { x, y, w, h }) {
  const file = path.join(os.tmpdir(), `oom-luma-${process.pid}.png`);
  await writeFile(file, png);
  try {
    const { stdout } = await ffmpeg([
      "-i", file,
      "-vf", `crop=${Math.max(8, Math.round(w))}:${Math.max(8, Math.round(h))}:${Math.max(0, Math.round(x))}:${Math.max(0, Math.round(y))},scale=6:8:flags=area`,
      "-f", "rawvideo", "-pix_fmt", "gray", "-",
    ]);
    const cells = [...Buffer.from(stdout, "binary")].map((v) => v / 255).sort((a, b) => a - b);
    if (!cells.length) return null;
    return cells[Math.min(cells.length - 1, Math.floor(cells.length * 0.88))];
  } finally {
    await rm(file, { force: true });
  }
}

/**
 * Turns the dimmer up until the type is readable on the picture behind it, and
 * no further.
 *
 * Every fixed scrim is wrong for some photograph. The value tuned on a
 * night-time server hall reduced a bright reading room to grey mud on the
 * carousel, and the lighter value used for the Reel left white body copy on a
 * pale cream ceiling — which a cloud run caught by opening the frames, after
 * `coverage` and `complianceIssues` had both called it fine. Measuring what is
 * actually behind the words removes the judgement call: hide the text, screenshot
 * the backdrop, average the region the words occupy, and add darkness only while
 * it is needed.
 *
 * The ceilings are the WCAG contrast floors read backwards for white text: 4.5:1
 * for body copy lands near 0.42 of full brightness, 3:1 for large display type
 * near 0.55. Below the floor the loop stops, so a dark photograph keeps all of
 * its detail.
 */
// Calibrated by eye against the rendered slides, then left alone. White on a
// backdrop at 0.34 is about 7:1; the WCAG floors would allow 0.46 for body copy
// and 0.58 for large type, and both look strained on a phone at arm's length.
export const EXPOSURE_LADDER = [
  { scrim: 0.35, dim: 0 }, { scrim: 0.5, dim: 0 }, { scrim: 0.65, dim: 0 },
  { scrim: 0.8, dim: 0 }, { scrim: 1, dim: 0 },
  { scrim: 1, dim: 0.18 }, { scrim: 1, dim: 0.34 }, { scrim: 1, dim: 0.5 },
];

export const TEXT_LUMA_MAX = 0.34;
export const DISPLAY_LUMA_MAX = 0.48;

async function autoDim(page, brand) {
  const region = await page.evaluate(() => {
    const masses = [...document.querySelectorAll(".mass")].filter((el) => el.textContent.trim().length);
    if (!masses.length) return null;
    const rects = masses.map((el) => el.getBoundingClientRect());
    // every, not some: a slide carrying one enormous figure above a paragraph
    // is a slide whose paragraph decides how dark the backdrop has to be.
    const big = masses.every((el) => parseFloat(getComputedStyle(el).fontSize) >= 60);
    return {
      x: Math.min(...rects.map((r) => r.left)),
      y: Math.min(...rects.map((r) => r.top)),
      w: Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left)),
      h: Math.max(...rects.map((r) => r.bottom)) - Math.min(...rects.map((r) => r.top)),
      big,
    };
  });
  if (!region || region.w < 4 || region.h < 4) return { dim: 0, luma: null };

  const ceiling = region.big ? DISPLAY_LUMA_MAX : TEXT_LUMA_MAX;

  /*
   * Lightest first, and stop at the first setting that is dark enough. Backdrop
   * brightness falls monotonically along this ladder, so the first pass is also
   * the most of the photograph anyone will ever see.
   *
   * That direction matters as much as the ceiling. The first version of this
   * only ever added darkness, and a cloud run measured the result: backdrops at
   * 3 to 16 percent brightness across a whole carousel, every photograph reduced
   * to texture. Legible, and no reason to look. A scrim that can only tighten
   * produces exactly the posts nobody saw.
   */
  const LADDER = EXPOSURE_LADDER;

  let last = null;
  for (const step of LADDER) {
    await page.evaluate((s) => {
      const slide = document.querySelector(".slide");
      slide.style.setProperty("--dim", String(s.dim));
      slide.style.setProperty("--scrim", String(s.scrim));
      document.querySelectorAll(".inner, .credit, .rail").forEach((el) => (el.style.visibility = "hidden"));
    }, step);
    const png = await page.screenshot({ type: "png" });
    await page.evaluate(() => {
      document.querySelectorAll(".inner, .credit, .rail").forEach((el) => (el.style.visibility = ""));
    });
    last = await regionLuma(png, region);
    if (last === null || last <= ceiling) return { ...step, luma: last, ceiling };
  }
  return { ...LADDER.at(-1), luma: last, ceiling, floorHit: true };
}

export async function renderPost(post, outDir, { images = null } = {}) {
  const { chromium } = await loadPlaywright();
  const brand = JSON.parse(await readFile(path.join(ROOT, "brand", "brand.json"), "utf8"));
  applyPalette(brand, post);
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

      const dimming = pictures[i + 1] ? await autoDim(page, brand) : { dim: 0, scrim: 1, luma: null };
      if (dimming.floorHit)
        throw new Error(
          `slide ${i + 1} (${slide.type}): the picture is still at ${(dimming.luma * 100).toFixed(0)}% brightness behind the text with the dimmer at maximum, and white type on it would not be readable. Choose a darker picture, or move the text off it.`
        );

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
      console.error(
        `slide ${i + 1} ${slide.type.padEnd(8)} coverage ${(cov.coverage * 100).toFixed(0)}%  ` +
          `picture ${pictures[i + 1] ? (pictures[i + 1].generated ? "generated" : "photo") : "none"}` +
          (dimming.luma === null ? "" : `  backdrop ${(dimming.luma * 100).toFixed(0)}% (scrim ${dimming.scrim}, dim ${dimming.dim})`)
      );
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
