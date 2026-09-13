/*
 * Scout-side photo acquisition, so a publish run inherits pinned `file` beats
 * and never spends its window on the indexes.
 *
 * It acquires through the same `acquireOne` the engine uses, and prints, for
 * each query, the OK/FAIL line, the candidate's TITLE and AUTHOR, and the exact
 * `credit` string to paste into the beat. Two notebook lessons are wired in:
 * a .jpg on disk does not prove acquisition (a refused candidate is written and
 * then rejected, 08/09 19h30), and the index serves AI-GENERATED pictures that
 * only the title and the author reveal (08/09 06h30) — so read those two lines
 * before you open the jpg.
 *
 * Usage: node scout-photos.mjs "media/<slug>:<name>:<two or three plain nouns>" ...
 */
import { acquireOne, creditLine } from "./src/imagery.mjs";

for (const arg of process.argv.slice(2)) {
  const [dir, name, ...rest] = arg.split(":");
  const query = rest.join(":");
  const t0 = Date.now();
  try {
    const c = await acquireOne({ type: "photo", query, alt: query }, { dir, name });
    const s = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`OK   ${s}s ${name} "${query}"
     file=${c.file}
     title=${c.title || "?"}
     author=${c.creator || "?"}
     credit=${JSON.stringify(creditLine(c))}
     source=${c.sourceUrl || c.url || c.source || "?"}`);
  } catch (e) {
    console.log(`FAIL ${((Date.now() - t0) / 1000).toFixed(0)}s ${name} "${query}" -> ${e.message}`);
  }
}
