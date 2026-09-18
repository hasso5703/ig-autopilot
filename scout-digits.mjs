/*
 * Recount every digit in a spec against the CITATIONS ALONE.
 *
 * The gate's own pool (validate.mjs allEvidence) also contains numbers(source.date),
 * so a spoken figure that happens to equal a day, month or year of a cited source
 * passes with no quote behind it (measured 15/09: "14 tricheurs" passed because a
 * slide was dated 2026-09-14). This is the 20-second reflex the notebook asks for,
 * as a command instead of a retyped scratchpad script.
 *
 * Usage: node scout-digits.mjs posts/<slug>.json
 * Kicker dates are the expected and only legitimate hits.
 */
import fs from 'fs';
const post = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
// EXACT copy of numbers() from src/validate.mjs (minus the HOSTS strip), so this
// check cannot disagree with the gate about what a digit is. A home-made regex
// split "91 692" into 91 and 692 and reported a false UNSUPPORTED on 18/09.
const nums = s => (String(s).match(/\d{1,3}(?:[\u00A0\u202F ]\d{3})+(?:\.\d+)?|\d[\d,]*(?:\.\d+)?/g) || []).map(n => n.replace(/[,\u00A0\u202F ]/g,'').replace(/\.$/,''));
const cited = new Set();
for (const s of post.slides||[]) for (const n of nums(s.evidence)) cited.add(n);
for (const e of post.captionEvidence||[]) for (const n of nums(e.quote)) cited.add(n);
for (const c of post.corroboration||[]) for (const n of nums(c.quote)) cited.add(n);
console.log('digits present in CITATIONS ONLY:', [...cited].sort().join(' '));
const check = (label, text) => {
  const bad = [...new Set(nums(text))].filter(n=>!cited.has(n));
  if (bad.length) console.log('  UNSUPPORTED', label, '->', bad.join(', '), '::', String(text).slice(0,110));
};
(post.reel2?.beats||[]).forEach((b,i)=>{
  check(`beat ${i} script`, b.script);
  if (b.visual?.value) check(`beat ${i} card.value`, b.visual.value);
  if (b.visual?.label) check(`beat ${i} card.label`, b.visual.label);
});
check('reel2.title', post.reel2?.title);
check('caption', post.caption);
(post.slides||[]).forEach((s,i)=>{
  for (const f of ['headline','kicker','body','title','claim','caveat','figure','unit','sub','swipe','attribution'])
    if (s[f]) check(`slide ${i+1} ${f}`, s[f]);
  if (s.hero) { check(`slide ${i+1} hero.value`, s.hero.value); check(`slide ${i+1} hero.label`, s.hero.label); }
});
console.log('done');
