/**
 * The repo is the CDN, and CDNs fill up.
 *
 * Meta's publish flow fetches `media/<slug>/reel.mp4` from
 * raw.githubusercontent.com ONCE, at publish time, and copies it to its own
 * CDN; the SHA-pinned URL never gets fetched again after that. The heavy files
 * therefore have a working life of exactly one publish — and they were being
 * kept forever. Measured 2026-08-10: media/ at 529 MB after two weeks,
 * ~19-30 MB a Reel, two Reels a day. That is ~1.2 GB a month of dead weight
 * every future container clones before it can do anything.
 *
 * So: any slug published more than PRUNE_AFTER_DAYS ago loses its heavy files
 * (video, audio, images). The small ones stay — specs live in posts/, and the
 * .json/.key sidecars in media/ (word clocks, alignment, cache keys) are a few
 * KB of analytic memory. Git history keeps every pruned byte anyway: the
 * SHA-pinned URLs of published Reels keep serving from the old commits, which
 * is exactly why pruning the working tree is safe for live posts.
 *
 * Never pruned, whatever their age: slugs absent from state/posted.jsonl.
 * A banked spec waiting for tonight's publish run has media and no posted
 * entry, and deleting a Reel between its build and its publish would be the
 * most expensive rm this repo can express.
 *
 *   node src/prune-media.mjs           what would go, and how many MB (dry)
 *   node src/prune-media.mjs --live    delete; land the deletions with land.mjs
 */

import { readdir, stat, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadState } from "./state.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const MEDIA = path.join(ROOT, "media");

export const PRUNE_AFTER_DAYS = 7;
const HEAVY = /\.(mp4|mov|webm|wav|pcm|jpg|jpeg|png)$/i;

/**
 * Pure: which files may go. `slugDirs` is { slug: [filenames] }; `posted` is
 * the ledger. A slug qualifies only when its NEWEST posted entry is older than
 * the cutoff — a slug published twice (carousel then Reel) ages from the
 * second publication.
 */
export function prunable(posted, slugDirs, { now = new Date(), days = PRUNE_AFTER_DAYS } = {}) {
  const cutoff = now.getTime() - days * 86400000;
  const newestPublish = new Map();
  for (const p of posted || []) {
    if (!p?.slug || !p?.at) continue;
    const t = Date.parse(p.at);
    if (!newestPublish.has(p.slug) || t > newestPublish.get(p.slug)) newestPublish.set(p.slug, t);
  }
  const out = [];
  for (const [slug, files] of Object.entries(slugDirs || {})) {
    const t = newestPublish.get(slug);
    if (t === undefined || t > cutoff) continue; // unpublished or too fresh: keep everything
    const heavy = (files || []).filter((f) => HEAVY.test(f));
    if (heavy.length) out.push({ slug, files: heavy.sort() });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function main() {
  const live = process.argv.includes("--live");
  const { posted } = await loadState();
  const slugDirs = {};
  if (existsSync(MEDIA)) {
    for (const slug of await readdir(MEDIA)) {
      const dir = path.join(MEDIA, slug);
      if (!(await stat(dir)).isDirectory()) continue;
      slugDirs[slug] = await readdir(dir);
    }
  }
  const plan = prunable(posted, slugDirs);
  let bytes = 0, count = 0;
  for (const { slug, files } of plan) {
    for (const f of files) {
      const file = path.join(MEDIA, slug, f);
      bytes += (await stat(file).catch(() => ({ size: 0 }))).size;
      count++;
      if (live) await rm(file, { force: true });
    }
    console.log(`${live ? "pruned" : "would prune"} ${slug}: ${files.length} file(s)`);
  }
  console.log(
    `${live ? "PRUNED" : "DRY RUN"}: ${count} file(s), ${(bytes / 1048576).toFixed(0)} MB across ${plan.length} slug(s) ` +
      `published over ${PRUNE_AFTER_DAYS} days ago.` +
      (live ? ` Land the deletions: node src/land.mjs "prune: media over ${PRUNE_AFTER_DAYS} days old" media` : " Run with --live to delete.")
  );
}

if (process.argv[1] && process.argv[1].endsWith("prune-media.mjs")) {
  main().catch((e) => { console.error(`prune failed: ${e.message}`); process.exit(1); });
}
