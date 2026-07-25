/**
 * Slide HTML generation.
 *
 * Every slide is a self-contained HTML document sized exactly to the canvas.
 * Fonts are inlined as base64 data URIs so rendering never depends on a live
 * CDN — the cloud sandbox that renders these has a domain allowlist, and a
 * silent font fallback would ruin the typography without failing the run.
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Wraps a headline so that words marked with *asterisks* render in the accent
 * colour: "THESE *GITHUB* PROJECTS" -> GITHUB in accent.
 */
const accentize = (text) =>
  esc(text).replace(/\*([^*]+)\*/g, '<em class="a">$1</em>');

function fontFaces(fonts) {
  return fonts
    .map(
      (f) => `@font-face{
  font-family:'${f.family}';
  font-style:normal;
  font-weight:${f.weight};
  font-display:block;
  src:url(data:font/woff2;base64,${f.base64}) format('woff2');
}`
    )
    .join("\n");
}

function baseCss(brand, fonts) {
  const { colors: c, canvas } = brand;
  return `${fontFaces(fonts)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${canvas.width}px;height:${canvas.height}px;overflow:hidden}
body{
  background:${c.bg};
  color:${c.ink};
  font-family:'Archivo',sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:geometricPrecision;
}
.slide{position:relative;width:${canvas.width}px;height:${canvas.height}px;overflow:hidden}
.display{font-family:'Anton',sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:-0.005em;line-height:0.92}
.a{color:${c.accent};font-style:normal}

/* wordmark strip: thin rules either side of the brand name */
.mark{display:flex;align-items:center;gap:24px;width:100%}
.mark .line{flex:1;height:2px;background:${c.rule};opacity:.85}
.mark .name{
  font-family:'Archivo',sans-serif;font-weight:700;font-size:26px;
  letter-spacing:${brand.wordmarkTracking || ".3em"};
  text-transform:uppercase;white-space:nowrap;
}
.footnote{
  font-family:'Archivo',sans-serif;font-weight:700;font-size:24px;
  letter-spacing:.28em;text-transform:uppercase;color:${c.muted};
}

/* ---- hook slide ---- */
.hook .bg{position:absolute;inset:0;background-size:cover;background-position:center}
.hook .scrim{
  position:absolute;inset:0;
  background:linear-gradient(to bottom,
    rgba(11,11,15,0) 0%,
    rgba(11,11,15,.18) 42%,
    rgba(11,11,15,.92) 58%,
    ${c.bg} 66%);
}
.hook .stack{
  position:absolute;left:0;right:0;bottom:0;
  padding:0 62px 74px;display:flex;flex-direction:column;align-items:center;gap:34px;
}
.hook h1{text-align:center;width:100%}

/* ---- content slide ---- */
.content{display:flex;flex-direction:column;padding:74px 74px 68px}
.content .top{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:64px}
.content .idx{
  font-family:'Archivo',sans-serif;font-weight:700;font-size:26px;
  letter-spacing:.22em;color:${c.accent};
}
.content .brand{
  font-family:'Archivo',sans-serif;font-weight:700;font-size:20px;
  letter-spacing:.18em;color:${c.muted};text-transform:uppercase;
}
.content h2{margin-bottom:46px}
/* Short copy used to sit pinned to the top with dead space below it, which
   read as sparse rather than composed. Centring the block in its remaining
   space makes a two-line body look as deliberate as a six-line one. */
.content .body{
  font-size:44px;line-height:1.34;color:#E9E9EF;font-weight:400;
  flex:1;overflow:hidden;
  display:flex;flex-direction:column;justify-content:center;
}
.content .body strong{font-weight:700;color:${c.ink}}
.content .src{
  margin-top:40px;padding-top:30px;border-top:2px solid rgba(255,255,255,.14);
  font-size:24px;line-height:1.4;color:${c.muted};
}
.content .src b{color:#C9C9D2;font-weight:700}

/* ---- cta slide ---- */
.cta{display:flex;flex-direction:column;justify-content:center;align-items:center;
     padding:74px 70px;text-align:center;gap:40px}
.cta h2{width:100%}
.cta .sub{font-size:40px;line-height:1.35;color:#D6D6DE;max-width:850px}
.cta .handle{
  font-family:'Anton',sans-serif;font-size:58px;color:${c.accent};
  text-transform:uppercase;letter-spacing:.01em;
}
.cta .disclosure{
  position:absolute;left:70px;right:70px;bottom:56px;
  font-size:21px;line-height:1.4;color:#6E6E7A;
}`;
}

function doc(brand, fonts, bodyHtml, extraCss = "") {
  return `<!doctype html><html><head><meta charset="utf-8">
<style>${baseCss(brand, fonts)}
${extraCss}</style></head><body>${bodyHtml}</body></html>`;
}

/** Slide 1: full-bleed visual + oversized hook headline. */
export function hookSlide(brand, fonts, slide) {
  const bg = slide.background?.dataUri
    ? `background-image:url('${slide.background.dataUri}')`
    : `background:radial-gradient(120% 90% at 50% 8%, #23233A 0%, #12121C 46%, ${brand.colors.bg} 100%)`;

  return doc(
    brand,
    fonts,
    `<div class="slide hook">
      <div class="bg" style="${bg}"></div>
      <div class="scrim"></div>
      <div class="stack">
        <div class="mark"><span class="line"></span><span class="name">${esc(brand.wordmark)}</span><span class="line"></span></div>
        <h1 class="display fit" data-max="${brand.type.hookMax}" data-min="${brand.type.hookMin}">${accentize(slide.headline)}</h1>
        ${slide.kicker ? `<div class="footnote">${esc(slide.kicker)}</div>` : ""}
      </div>
    </div>`
  );
}

/** Slides 2..n-1: one idea per slide, always with its source. */
export function contentSlide(brand, fonts, slide, index, total) {
  const src = slide.source
    ? `<div class="src"><b>${esc(slide.source.name)}</b> · ${esc(slide.source.date)}<br>${esc(slide.source.url)}</div>`
    : "";
  return doc(
    brand,
    fonts,
    `<div class="slide content">
      <div class="top">
        <span class="idx">${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
        <span class="brand">${esc(brand.wordmark)}</span>
      </div>
      <h2 class="display fit" data-max="${brand.type.titleMax}" data-min="${brand.type.titleMin}">${accentize(slide.title)}</h2>
      <div class="body fit-body" data-max="${brand.type.bodyMax}" data-min="${brand.type.bodyMin}">${accentize(slide.body).replace(/\n/g, "<br>")}</div>
      ${src}
    </div>`
  );
}

/** Final slide: the ask. Carries the AI-disclosure line (EU AI Act art. 50). */
export function ctaSlide(brand, fonts, slide) {
  return doc(
    brand,
    fonts,
    `<div class="slide cta">
      <h2 class="display fit" data-max="${brand.type.titleMax + 8}" data-min="${brand.type.titleMin}">${accentize(slide.headline)}</h2>
      <div class="handle">${esc(brand.handle)}</div>
      ${slide.sub ? `<div class="sub">${esc(slide.sub)}</div>` : ""}
      <div class="disclosure">${esc(brand.aiDisclosure)}</div>
    </div>`
  );
}

export function slideHtml(brand, fonts, slide, index, total) {
  if (slide.type === "hook") return hookSlide(brand, fonts, slide);
  if (slide.type === "cta") return ctaSlide(brand, fonts, slide);
  return contentSlide(brand, fonts, slide, index, total);
}
