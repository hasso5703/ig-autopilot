/**
 * Slide composition.
 *
 * Not one template with fields swapped — a set of archetypes, because a
 * carousel of seven identical layouts is boring to swipe and swipe-through is
 * the metric that buys distribution (70%+ reaches 3-5x more non-followers).
 *
 * Three rules run through all of it:
 *
 *   1. THREE LEVELS OF HIERARCHY, NEVER MORE. Primary (the point), secondary
 *      (the support), tertiary (index, brand, source). Each separated by a
 *      large jump in size or weight, never a small one — timid contrast is
 *      what makes a layout read as a filled-in template.
 *
 *   2. SLIDE 2 IS A SECOND COVER. Instagram re-serves a carousel starting at
 *      slide 2 to people who scrolled past slide 1, so slide 2 gets a `stat`
 *      archetype: one enormous figure, no paragraph. It has to stop a thumb on
 *      its own.
 *
 *   3. EVERY SLIDE PULLS FORWARD. A progress rail shows there is more, and the
 *      last content slide carries the turn that makes the CTA earned.
 *
 * Archetypes: hook · stat · content · quote · contrast · cta
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Inline markup, applied AFTER escaping so a post spec can never inject HTML:
 *   **word**  ->  bold, in full-strength ink
 *   *word*    ->  accent colour
 * Order matters — the double-star pass must run first, or `*` eats its stars.
 */
const inline = (text) =>
  esc(text)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<em class="a">$1</em>');

const accentize = inline;
const nl = (s) => inline(s).replace(/\n/g, "<br>");

function fontFaces(fonts) {
  return fonts
    .map(
      (f) => `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${f.base64}) format('woff2')}`
    )
    .join("\n");
}

/**
 * Film grain as an inline SVG turbulence. Flat #08080C on a phone screen looks
 * like a rendering error; a trace of noise reads as printed matter and costs
 * nothing at render time.
 */
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='220' height='220' filter='url(%23n)' opacity='0.5'/></svg>`
  );

function baseCss(brand, fonts) {
  const c = brand.colors;
  const g = brand.grid;
  return `${fontFaces(fonts)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${brand.canvas.width}px;height:${brand.canvas.height}px;overflow:hidden}
body{background:${c.bg};color:${c.ink};font-family:'Archivo',sans-serif;
     -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}

.slide{position:relative;width:${brand.canvas.width}px;height:${brand.canvas.height}px;
       overflow:hidden;padding:${g.margin}px;display:flex;flex-direction:column}
.slide::after{content:"";position:absolute;inset:0;background-image:url("${GRAIN}");
              opacity:.055;pointer-events:none;mix-blend-mode:overlay}

.display{font-family:'Anton',sans-serif;font-weight:400;text-transform:uppercase;
         letter-spacing:-0.012em;line-height:0.88}
.a{color:${c.accent};font-style:normal}

/* ---------- persistent furniture ---------- */
.rail{position:absolute;left:0;top:0;height:9px;width:100%;background:rgba(255,255,255,.07);z-index:3}
.rail i{display:block;height:100%;background:${c.accent}}

.topbar{display:flex;align-items:center;justify-content:space-between;
        font-weight:700;font-size:21px;letter-spacing:.2em;text-transform:uppercase;
        color:${c.muted};flex:0 0 auto}
.topbar .idx{color:${c.accent}}

.foot{margin-top:auto;flex:0 0 auto;padding-top:30px;
      border-top:1px solid rgba(255,255,255,.13);
      font-size:22px;line-height:1.42;color:${c.muted}}
.foot b{color:${c.body};font-weight:700}
.foot .u{color:${c.faint};word-break:break-all}

/* ---------- hook ---------- */
.hook{justify-content:flex-end;padding-top:150px}
.hook .glow{position:absolute;left:-14%;top:-26%;width:128%;height:96%;
  background:radial-gradient(46% 42% at 50% 50%, rgba(77,225,255,.28) 0%, rgba(77,225,255,.06) 42%, rgba(8,8,12,0) 72%);}
.hook .kicker{font-weight:700;font-size:23px;letter-spacing:.26em;text-transform:uppercase;
              color:${c.accent};margin-bottom:34px}
.hook h1{margin-bottom:40px}
.hook .heroWrap{display:flex;align-items:baseline;gap:26px;margin-bottom:44px}
.hook .hero{font-family:'Anton',sans-serif;font-size:196px;line-height:.82;color:${c.accent};letter-spacing:-0.02em}
.hook .heroLabel{font-weight:700;font-size:27px;line-height:1.3;letter-spacing:.06em;
                 text-transform:uppercase;color:${c.body};max-width:540px}
.hook .mark{display:flex;align-items:center;gap:22px}
.hook .mark .line{flex:1;height:2px;background:${c.rule};opacity:.5}
.hook .mark .name{font-weight:700;font-size:23px;letter-spacing:${brand.wordmarkTracking};
                  text-transform:uppercase;white-space:nowrap;color:${c.ink}}
.hook .swipe{margin-top:26px;text-align:center;font-weight:700;font-size:21px;
             letter-spacing:.3em;text-transform:uppercase;color:${c.muted}}

/* ---------- stat: slide 2 doubles as a cover ---------- */
.stat{justify-content:center;text-align:left}
.stat .figure{font-family:'Anton',sans-serif;color:${c.accent};line-height:.8;
              letter-spacing:-0.03em;margin-bottom:16px}
.stat .unit{font-family:'Anton',sans-serif;font-size:64px;color:${c.ink};
            text-transform:uppercase;letter-spacing:-0.01em;margin-bottom:40px}
.stat .say{font-size:44px;line-height:1.3;color:${c.body};max-width:900px}
.stat .say b{color:${c.ink};font-weight:700}

/* ---------- content ---------- */
.content .mid{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;
               padding:38px 0 44px}
.content h2{margin-bottom:34px}
.content .body{font-size:46px;line-height:1.3;color:${c.body};font-weight:400}
.content .body b{color:${c.ink};font-weight:700}

/* ---------- quote ---------- */
.quote{justify-content:center}
.quote .qm{font-family:'Anton',sans-serif;font-size:150px;line-height:.6;color:${c.accent};opacity:.85;margin-bottom:18px}
.quote blockquote{font-weight:700;line-height:1.2;color:${c.ink};margin-bottom:38px}
.quote .by{font-size:26px;letter-spacing:.05em;color:${c.muted}}
.quote .by b{color:${c.accent};font-weight:700}

/* ---------- contrast: claim vs caveat ---------- */
.contrast{justify-content:center;gap:30px}
.contrast .cell{padding:52px 48px;border-radius:6px}
.contrast .cell .lab{font-weight:700;font-size:22px;letter-spacing:.24em;
                     text-transform:uppercase;margin-bottom:20px}
.contrast .cell .txt{font-size:48px;line-height:1.24}
.contrast .claim{background:rgba(255,255,255,.055)}
.contrast .claim .lab{color:${c.muted}}
.contrast .claim .txt{color:${c.body}}
.contrast .caveat{background:${c.accent}}
.contrast .caveat .lab{color:rgba(4,18,26,.62)}
.contrast .caveat .txt{color:${c.accentInk};font-weight:700}

/* ---------- cta ---------- */
.cta{justify-content:center;align-items:center;text-align:center}
.cta h2{margin-bottom:34px}
.cta .handle{font-family:'Anton',sans-serif;font-size:74px;color:${c.accent};
             text-transform:uppercase;letter-spacing:-0.01em;margin-bottom:30px}
.cta .sub{font-size:38px;line-height:1.34;color:${c.body};max-width:800px}
.cta .disclosure{position:absolute;left:${g.margin}px;right:${g.margin}px;bottom:52px;
                 font-size:20px;line-height:1.4;color:${c.faint};text-align:center}`;
}

const doc = (brand, fonts, body) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss(brand, fonts)}</style></head><body>${body}</body></html>`;

const rail = (i, n) => `<div class="rail"><i style="width:${Math.round((i / n) * 100)}%"></i></div>`;

const topbar = (brand, i, n) =>
  `<div class="topbar"><span class="idx">${String(i).padStart(2, "0")} / ${String(n).padStart(2, "0")}</span><span>${esc(brand.wordmark)}</span></div>`;

const foot = (s) =>
  s.source
    ? `<div class="foot"><b>${esc(s.source.name)}</b> · ${esc(s.source.date)}<br><span class="u">${esc(s.source.url)}</span></div>`
    : "";

/** Slide 1 — a poster. Headline plus one hero figure, nothing else competing. */
function hook(brand, fonts, s, i, n) {
  const hero = s.hero
    ? `<div class="heroWrap"><span class="hero">${esc(s.hero.value)}</span><span class="heroLabel">${nl(s.hero.label ?? "")}</span></div>`
    : "";
  return doc(
    brand,
    fonts,
    `<div class="slide hook">${rail(i, n)}<div class="glow"></div>
      ${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ""}
      <h1 class="display fit" data-max="${brand.type.hookMax}" data-min="${brand.type.hookMin}" data-maxlines="4">${accentize(s.headline)}</h1>
      ${hero}
      <div class="mark"><span class="line"></span><span class="name">${esc(brand.wordmark)}</span><span class="line"></span></div>
      <div class="swipe">${esc(s.swipe ?? "Swipe for the receipts")}</div>
    </div>`
  );
}

/** Slide 2 — one number, big enough to work as a cover on its own. */
function stat(brand, fonts, s, i, n) {
  return doc(
    brand,
    fonts,
    `<div class="slide stat">${rail(i, n)}${topbar(brand, i, n)}
      <div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:center">
        <div class="figure fit" data-max="${brand.type.statMax}" data-min="${brand.type.statMin}" data-maxlines="1">${esc(s.figure)}</div>
        ${s.unit ? `<div class="unit">${accentize(s.unit)}</div>` : ""}
        <div class="say">${nl(s.body)}</div>
      </div>
      ${foot(s)}
    </div>`
  );
}

function content(brand, fonts, s, i, n) {
  return doc(
    brand,
    fonts,
    `<div class="slide content">${rail(i, n)}${topbar(brand, i, n)}
      <div class="mid">
        <h2 class="display fit" data-max="${brand.type.titleMax}" data-min="${brand.type.titleMin}" data-maxlines="3">${accentize(s.title)}</h2>
        <div class="body">${nl(s.body)}</div>
      </div>
      ${foot(s)}
    </div>`
  );
}

function quote(brand, fonts, s, i, n) {
  return doc(
    brand,
    fonts,
    `<div class="slide quote">${rail(i, n)}${topbar(brand, i, n)}
      <div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:center">
        <div class="qm">&ldquo;</div>
        <blockquote class="fit" data-max="${brand.type.quoteMax}" data-min="${brand.type.quoteMin}" data-maxlines="7">${nl(s.body)}</blockquote>
        <div class="by">&mdash; <b>${esc(s.attribution ?? s.source?.name ?? "")}</b></div>
      </div>
      ${foot(s)}
    </div>`
  );
}

/** The turn: what they claimed, next to what the footnote actually said. */
function contrast(brand, fonts, s, i, n) {
  return doc(
    brand,
    fonts,
    `<div class="slide contrast">${rail(i, n)}${topbar(brand, i, n)}
      <div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:30px">
        <div class="cell claim"><div class="lab">${esc(s.claimLabel ?? "The headline")}</div><div class="txt">${nl(s.claim)}</div></div>
        <div class="cell caveat"><div class="lab">${esc(s.caveatLabel ?? "The footnote")}</div><div class="txt">${nl(s.caveat)}</div></div>
      </div>
      ${foot(s)}
    </div>`
  );
}

function cta(brand, fonts, s, i, n) {
  return doc(
    brand,
    fonts,
    `<div class="slide cta">${rail(i, n)}
      <h2 class="display fit" data-max="${brand.type.titleMax + 10}" data-min="${brand.type.titleMin}" data-maxlines="3">${accentize(s.headline)}</h2>
      <div class="handle">${esc(brand.handle)}</div>
      ${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ""}
      <div class="disclosure">${esc(brand.aiDisclosure)}</div>
    </div>`
  );
}

const ARCHETYPES = { hook, stat, content, quote, contrast, cta };

export function slideHtml(brand, fonts, slide, index, total) {
  const fn = ARCHETYPES[slide.type];
  if (!fn) throw new Error(`unknown slide type '${slide.type}' — expected one of ${Object.keys(ARCHETYPES).join(", ")}`);
  return fn(brand, fonts, slide, index, total);
}

export const SLIDE_TYPES = Object.keys(ARCHETYPES);
