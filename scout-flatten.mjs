/*
 * Fetch pages and flatten them EXACTLY as validate.mjs does, but WITHOUT the
 * final .toLowerCase(), so evidence quotes can be sliced straight out of the
 * result with indexOf and pasted into a spec.
 *
 * Two notebook lessons live here and both cost a gate round-trip when ignored
 * (03/09, 08/09, 15/09): flatten() removes INLINE tags with NO space and every
 * other tag WITH one, so a home-made `replace(/<[^>]+>/g,' ')` invents a space
 * wherever the page has a link and the quote comes back NOT_FOUND; and the case
 * must stay the page's, because the versioned-name check does a case-sensitive
 * includes on evidence.
 *
 * Usage: node scout-flatten.mjs <url> [<url>...]   -> writes /tmp/pagesC/<name>.txt
 * Also exports flattenCase() for scripts that build a spec.
 */
import fs from 'fs';
const INLINE_TAGS = "a|abbr|b|bdi|bdo|cite|code|data|del|dfn|em|font|i|ins|kbd|mark|q|rp|rt|ruby|s|samp|small|span|strong|sub|sup|time|tt|u|var|wbr";
const NE={nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",rsquo:"'",lsquo:"'",ldquo:'"',rdquo:'"',mdash:'-',ndash:'-',hellip:'...',eacute:'é',egrave:'è'};
export const flattenCase = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(new RegExp(`</?(?:${INLINE_TAGS})(?:\\s[^>]*)?/?>`, "gi"), "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => NE[n.toLowerCase()] ?? m)
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[–—]/g, "-")
  .replace(/\s+/g, " ")
  .trim();
if (process.argv[2]) {
  const OUT='/tmp/pagesC'; fs.mkdirSync(OUT,{recursive:true});
  for (const u of process.argv.slice(2)) {
    try {
      const r = await fetch(u, { headers: { 'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36' } });
      const t = flattenCase(await r.text());
      const name = u.replace(/https?:\/\//,'').replace(/[^a-z0-9]+/gi,'_').slice(0,70);
      fs.writeFileSync(`${OUT}/${name}.txt`, t);
      console.log(r.status, t.length, `${OUT}/${name}.txt`);
    } catch (e) { console.log('ERR', u, e.message); }
  }
}
