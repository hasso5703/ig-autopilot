/**
 * Finding Chromium, in an environment that keeps moving.
 *
 * This logic lived in three files. That was fine until the sandbox changed
 * shape: one cloud run found playwright under /opt/node22, a later one found it
 * in an entirely different global root, and a fresh clone has it nowhere until
 * `npm install` runs. Three copies means three places to fix and three chances
 * to fix only two.
 *
 * Node's ESM resolver ignores NODE_PATH, which is the trap here: exporting it
 * looks like it should work and silently does nothing for `import`. A cloud run
 * lost time to exactly that. So resolution goes through createRequire, and every
 * path tried is reported when they all fail, because "cannot resolve the
 * playwright package" tells whoever reads the log nothing about where to look.
 */

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";

export async function loadPlaywright() {
  const tried = [];

  try {
    return await import("playwright");
  } catch (e) {
    tried.push(`import("playwright") from ${import.meta.url}: ${e.code ?? e.message}`);
  }

  const require = createRequire(import.meta.url);
  const candidates = [process.env.PLAYWRIGHT_PKG, "/opt/node22/lib/node_modules/playwright"];

  try {
    candidates.push(path.join(execSync("npm root -g", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(), "playwright"));
  } catch (e) {
    tried.push(`npm root -g failed: ${e.message}`);
  }

  for (const c of candidates.filter(Boolean)) {
    try {
      return require(c);
    } catch (e) {
      tried.push(`${c}: ${e.code ?? e.message}`);
    }
  }

  throw new Error(
    "cannot resolve the 'playwright' package. Tried:\n  " +
      tried.join("\n  ") +
      "\nFix: run `npm install` in the repo, or set PLAYWRIGHT_PKG to the package directory. " +
      "Note that NODE_PATH does not work here: Node's ESM resolver ignores it."
  );
}

/**
 * The browser binary, when Playwright's own download location has been
 * overridden. Returns undefined to let Playwright use its default, which is the
 * right answer when PLAYWRIGHT_BROWSERS_PATH is unset.
 */
export async function chromiumExecutable() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;

  for (const e of (await readdir(base)).filter((x) => x.startsWith("chromium")).sort().reverse()) {
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell"]) {
      const p = path.join(base, e, rel);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

/** Loads every declared face before asking whether it loaded: CSS font loading is lazy. */
export async function assertFontsLoaded(page, faces) {
  await page.evaluate(async () => { await Promise.allSettled([...document.fonts].map((f) => f.load())); });
  for (const f of faces) {
    if (!(await page.evaluate((s) => document.fonts.check(s), f)))
      throw new Error(`font not loaded: ${f} — refusing to render off-brand output`);
  }
}
