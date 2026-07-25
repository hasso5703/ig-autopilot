/**
 * Profile picture generator.
 *
 * An Instagram avatar is shown at 32px in the feed and about 110px on the
 * profile, always cropped to a circle. That rules out the wordmark: "ORDER OF
 * MAGNITUDE" is unreadable below roughly 200px. What survives is a mark of two
 * or three glyphs, and the account already has one hiding in its name.
 *
 * An order of magnitude IS 10x. Three glyphs, unmistakable at any size, and it
 * explains the name to anyone who reads it once.
 *
 * Rendered at 1080x1080. Everything sits inside the inscribed circle with room
 * to spare, because Instagram crops without asking.
 *
 *   node src/avatar.mjs [outDir]
 */

import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SIZE = 1080;

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const require = createRequire(import.meta.url);
    for (const c of [process.env.PLAYWRIGHT_PKG, "/opt/node22/lib/node_modules/playwright"].filter(Boolean)) {
      try { return require(c); } catch {}
    }
    try { return require(path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "playwright")); } catch {}
    throw new Error("cannot resolve the 'playwright' package");
  }
}

async function chromiumExecutable() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  const { readdir } = await import("node:fs/promises");
  for (const e of (await readdir(base)).filter((x) => x.startsWith("chromium")).sort().reverse()) {
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell"]) {
      const p = path.join(base, e, rel);
      if (existsSync(p)) return p;
    }
  }
}

/**
 * @param {object} v variant
 * @param {string} anton base64 font
 */
function html(v, anton, colors) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Anton';src:url(data:font/woff2;base64,${anton}) format('woff2');font-weight:400;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${SIZE}px;height:${SIZE}px;overflow:hidden}
.a{position:relative;width:${SIZE}px;height:${SIZE}px;background:${v.bg};
   display:flex;align-items:center;justify-content:center;overflow:hidden}
${v.glow ? `.a::before{content:"";position:absolute;inset:-20%;
   background:radial-gradient(42% 42% at 50% 34%, ${v.glow} 0%, rgba(0,0,0,0) 70%)}` : ""}
.a::after{content:"";position:absolute;inset:0;
  background-image:url("${GRAIN}");opacity:.06;mix-blend-mode:overlay}
.m{position:relative;font-family:'Anton',sans-serif;font-size:${v.size}px;line-height:.78;
   color:${v.ink};letter-spacing:-0.045em;transform:translateY(${v.shift}px)}
.m i{font-style:normal;color:${v.mult};letter-spacing:-0.02em}
</style></head><body>
<div class="a"><div class="m">10<i>&times;</i></div></div></body></html>`;
}

const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='.5'/></svg>`
  );

export async function renderAvatars(outDir) {
  const brand = JSON.parse(await readFile(path.join(ROOT, "brand", "brand.json"), "utf8"));
  const c = brand.colors;
  const anton = (await readFile(path.join(ROOT, "brand", "fonts", brand.fonts.display.file))).toString("base64");

  // Tested at the sizes Instagram actually uses (110px on profile, 32px in
  // feed), circle-cropped. Two things decided the set: a dark avatar becomes an
  // unreadable blob against Instagram's white chrome, and a low-contrast
  // multiplication sign is the first thing to vanish when the mark shrinks.
  // Settled after testing at 110px and 32px: an accent disc with the mark in
  // near-black. White-on-accent washes out when it shrinks, and any dark
  // background becomes an unreadable dot against Instagram's white chrome.
  // 620px is the size where the mark still breathes on the profile page and
  // is still legible in the feed.
  const variants = [
    { name: "order-of-magnitude", bg: c.accent, ink: c.bg, mult: c.bg, size: 620, shift: 12 },
  ];

  await mkdir(outDir, { recursive: true });
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ executablePath: await chromiumExecutable(), args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });

  const files = [];
  for (const v of variants) {
    await page.setContent(html(v, anton, c), { waitUntil: "load" });
    await page.evaluate(async () => { await Promise.allSettled([...document.fonts].map((f) => f.load())); });
    const ok = await page.evaluate(() => document.fonts.check("400 100px 'Anton'"));
    if (!ok) throw new Error("Anton failed to load; refusing to render an off-brand avatar");
    const f = path.join(outDir, `${v.name}.jpg`);
    await page.screenshot({ path: f, type: "jpeg", quality: 95 });
    files.push(f);
  }
  await browser.close();
  return files;
}

if (process.argv[1] && process.argv[1].endsWith("avatar.mjs")) {
  const out = process.argv[2] || path.join(ROOT, "brand", "avatar");
  for (const f of await renderAvatars(out)) console.log(f);
}
