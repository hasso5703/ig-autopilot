/*
 * Scout-side receipt capture. Replicates src/reel2.mjs screenshotOnce exactly
 * (same viewport, UA, ctx.route replay, consent passes, overlay strip, ad CSS)
 * so what it writes is byte-for-byte the file the engine would write, and the
 * publish run can pin it with `file` and skip the slow half of the build.
 *
 * Two differences, both deliberate and both from the notebook:
 *  - `top` mode replaces the scroll-to-h1 with window.scrollTo(0,0), for
 *    showcase/newsroom pages whose h1 sits above the masthead (22/08, 23/08).
 *  - it prints page.url() and every image alt in frame, which is the only way
 *    to catch the "clean receipt of the wrong story / wrong face" traps
 *    (10/08 TNW, 14/08 anthropic, 23/08 hbs.edu, 25/08 fortune).
 *
 * Usage: node scout-capture.mjs <url> <outFile> [top]
 */
import { loadPlaywright, chromiumExecutable } from "./src/browser.mjs";
import { CONSENT_SELECTORS } from "./src/reel2.mjs";

const [url, outFile, mode] = process.argv.slice(2);
const t0 = Date.now();
const { chromium } = await loadPlaywright();
const executablePath = await chromiumExecutable();
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const browser = await chromium.launch({ executablePath, proxy, args: ["--disable-blink-features=AutomationControlled"] });
let frames = 0;
try {
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    locale: "en-US",
  });
  await ctx.route("**/*", async (route) => {
    try { await route.fulfill({ response: await route.fetch() }); }
    catch { try { await route.abort(); } catch {} }
  });
  const page = await ctx.newPage();
  page.on("framenavigated", () => { frames++; });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2500);
  for (const pass of [0, 1]) {
    if (pass) await page.waitForTimeout(2000);
    for (const frame of page.frames()) {
      for (const sel of CONSENT_SELECTORS) {
        try { await frame.locator(sel).first().click({ timeout: 1200 }); } catch {}
      }
    }
  }
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed" && cs.position !== "sticky") continue;
      const r = el.getBoundingClientRect();
      if (r.height > 350 && r.width > 250) el.remove();
    }
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }).catch(() => {});
  await page.addStyleTag({
    content:
      '[id*="google_ads"],[id^="ad-"],[class*="advert"],[class^="ad-"],[class*=" ad-"],' +
      'ins.adsbygoogle,iframe[src*="ads"],iframe[src*="doubleclick"],[data-ad],[data-ad-unit],' +
      '[id*="taboola"],[class*="outbrain"],[class*="sponsor"],[id*="sponsor"],' +
      '[aria-label*="advertisement" i],' +
      'video,[class*="video-player"],[class*="videoPlayer"],[id*="video-player"],' +
      '[class*="player"],[id*="player"],[class*="jw-"],[id*="connatix"],[class*="cnx_"],' +
      '[id*="credential_picker"],iframe[src*="accounts.google.com"],[class*="one-tap"],' +
      '[class*="onetap"],[aria-label*="sign in" i]' +
      '{display:none!important;visibility:hidden!important}',
  }).catch(() => {});
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("video,audio")) el.remove();
    const hosts = [];
    const walk = (root) => {
      for (const el of root.querySelectorAll("*")) {
        if (!el.shadowRoot) continue;
        if (el.shadowRoot.querySelector("video,audio")) hosts.push(el);
        else walk(el.shadowRoot);
      }
    };
    walk(document);
    for (const el of hosts) el.remove();
  }).catch(() => {});

  if (mode === "top") {
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  } else {
    await page.evaluate(() => {
      const h = document.querySelector("article h1") || document.querySelector("h1");
      if (h) { h.scrollIntoView({ block: "start" }); window.scrollBy(0, -96); }
    }).catch(() => {});
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: outFile });

  // The three checks only a scout can run.
  const landed = page.url();
  const alts = await page.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((i) => i.alt && i.getBoundingClientRect().top < 2000 && i.getBoundingClientRect().height > 60)
      .map((i) => i.alt.slice(0, 90))
  ).catch(() => []);
  const h1 = await page.evaluate(() => (document.querySelector("h1")?.innerText || "").slice(0, 160)).catch(() => "");
  console.log(JSON.stringify({ ok: true, seconds: ((Date.now() - t0) / 1000).toFixed(0), frames, landedUrl: landed, h1, altsInFrame: alts }, null, 1));
} finally {
  await browser.close();
}
