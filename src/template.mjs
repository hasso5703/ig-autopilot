/**
 * Slide composition.
 *
 * Not one template with fields swapped — a set of archetypes, because a
 * carousel of seven identical layouts is boring to swipe and swipe-through is
 * the metric that buys distribution (70%+ reaches 3-5x more non-followers).
 *
 * Rewritten 2026-07-26 after two carousels reached nobody. The old templates
 * were type on black: correct, sourced, and indistinguishable at thumbnail size
 * from every other account that posts screenshots of press releases. Three
 * things changed, and each is a rule here rather than a preference.
 *
 *   1. EVERY SLIDE CARRIES A PICTURE. A photograph under a scrim, or a
 *      generated field. What stops a thumb is an image; type is what keeps it
 *      stopped. `imagery.mjs` acquires them, this file places them, and a slide
 *      whose picture failed degrades to an abstract field rather than to a lie.
 *
 *   2. THE TYPE FILLS THE FRAME. Every archetype's content block is a flex
 *      child that stretches, and the auto-fitter grows text into whatever
 *      height it is given instead of sitting at a fixed size in the middle of a
 *      void. `render.mjs` then measures the text coverage of the finished slide
 *      and refuses anything under the floor in `brand.json`. The slide that
 *      caused this rewrite measured 0.38.
 *
 *   3. THREE LEVELS OF HIERARCHY, NEVER MORE. Primary (the point), secondary
 *      (the support), tertiary (index, brand, source). Each separated by a
 *      large jump, never a small one. Timid contrast is what makes a layout
 *      read as a filled-in form.
 *
 * Slide 2 is a second cover: Instagram re-serves a carousel starting at slide 2
 * to people who scrolled past slide 1, so it gets the `stat` archetype — one
 * enormous figure, no paragraph, able to stop a thumb on its own.
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
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
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
 * nothing at render time. It also hides the banding a free-tier generated
 * picture shows when it is upscaled from 686px to fill 1080.
 */
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='220' height='220' filter='url(%23n)' opacity='0.5'/></svg>`
  );

/**
 * The engagement row, drawn rather than fetched.
 *
 * Instagram's own controls sit outside the frame and a viewer has to think to
 * find them. Showing the same four shapes inside the artwork names the action
 * without pretending to be a button. Order is deliberate and it is the order the
 * ranking model cares about: send first, then save, then comment, then like.
 * Sends are worth three to five times a like for reaching non-followers, and
 * likes per reach is the weakest of the three signals.
 */
export const ICONS = {
  send: "M2 21l21-9L2 3v7l15 2-15 2v7z",
  save: "M6 2h12a1 1 0 0 1 1 1v19l-7-5-7 5V3a1 1 0 0 1 1-1z",
  comment: "M12 2C6.5 2 2 5.9 2 10.7c0 2.7 1.4 5.1 3.7 6.7L5 22l4.4-2.3c.8.2 1.7.3 2.6.3 5.5 0 10-3.9 10-8.7S17.5 2 12 2z",
  like: "M12 21s-8.5-5.3-8.5-11A5 5 0 0 1 12 6.6 5 5 0 0 1 20.5 10c0 5.7-8.5 11-8.5 11z",
};

export const iconRow = (color) =>
  `<div class="icons">${["send", "save", "comment", "like"]
    .map((k) => `<svg viewBox="0 0 24 24" width="52" height="52" aria-hidden="true"><path d="${ICONS[k]}" fill="${color}"/></svg>`)
    .join("")}</div>`;

/** Height of the bleeding picture on a `top` layout. 44% of the canvas. */
const TOP_IMAGE_H = 596;

function baseCss(brand, fonts) {
  const c = brand.colors;
  const g = brand.grid;
  const t = brand.type;
  return `${fontFaces(fonts)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${brand.canvas.width}px;height:${brand.canvas.height}px;overflow:hidden}
body{background:${c.bg};color:${c.ink};font-family:'Archivo',sans-serif;
     -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}

.slide{position:relative;width:${brand.canvas.width}px;height:${brand.canvas.height}px;
       overflow:hidden;display:flex;flex-direction:column}
.slide::after{content:"";position:absolute;inset:0;background-image:url("${GRAIN}");
              opacity:.05;pointer-events:none;mix-blend-mode:overlay;z-index:5}

/* ---------- picture layers ----------
   Four layers, always in this order: the photograph, a duotone tint that pulls
   every source picture toward one palette, a scrim that buys legibility, and
   the grain above everything. Text never sits directly on an unmodified
   photograph: white on a bright sky is unreadable and no validator can see it. */
.picwrap{position:absolute;inset:0;z-index:0;overflow:hidden}
.pic{position:absolute;left:0;right:0;top:0;background-size:cover;background-position:center;
     filter:grayscale(.28) contrast(1.05) saturate(.95) brightness(.9)}
.pic.full{height:100%}
.pic.top{height:${TOP_IMAGE_H}px}
.pic.field{height:100%;filter:grayscale(.45) contrast(1.03) brightness(.66) blur(2px);transform:scale(1.06)}
.tint{position:absolute;inset:0;z-index:1;background:${c.accent};opacity:.11;mix-blend-mode:color;pointer-events:none}
/* The adaptive layer. Every fixed scrim is wrong for some photograph: the one
   that made a night-time server hall readable turned Bates Hall, one of the
   most photogenic reading rooms in the world, into grey mud — and the lighter
   one used on the Reel left white type sitting on a pale cream ceiling. So the
   renderer measures the actual backdrop under the actual text and turns this
   up until the text is readable, and no further. Set from JavaScript at render
   time, which is why it starts at nothing. */
.dimmer{position:absolute;inset:0;z-index:2;pointer-events:none;background:#08080C;opacity:var(--dim,0)}
.scrim{position:absolute;left:0;right:0;z-index:2;pointer-events:none;opacity:var(--scrim,1)}
.scrim.bottom{bottom:0;height:82%;
  background:linear-gradient(180deg,rgba(8,8,12,0) 0%,rgba(8,8,12,.3) 34%,rgba(8,8,12,.72) 66%,${c.bg} 97%)}
.scrim.topfade{top:0;height:30%;background:linear-gradient(180deg,rgba(8,8,12,.78) 0%,rgba(8,8,12,0) 100%)}
.scrim.veil{inset:0;height:100%;background:rgba(8,8,12,.3)}
.scrim.seam{top:${TOP_IMAGE_H - 190}px;height:190px;
  background:linear-gradient(180deg,rgba(8,8,12,0) 0%,${c.bg} 100%)}
/* No picture: an abstract field rather than flat black, so a failed acquisition
   still looks deliberate. */
.field-fallback{position:absolute;inset:0;z-index:0;
  background:radial-gradient(58% 44% at 22% 18%, rgba(77,225,255,.22) 0%, rgba(77,225,255,.05) 45%, rgba(8,8,12,0) 72%),
             radial-gradient(48% 38% at 86% 88%, rgba(77,225,255,.14) 0%, rgba(8,8,12,0) 70%),
             ${c.bg}}

.inner{position:relative;z-index:3;flex:1 1 auto;display:flex;flex-direction:column;
       padding:${g.margin}px;min-height:0}
.inner.below{padding-top:${TOP_IMAGE_H - 96}px}

/* Anton's glyphs are taller than a line box of 1.0: at 92px a three-line
   headline paints 23px outside the element it belongs to. That ink used to be
   cropped by the clipping below, which took the tops off capitals on the first
   line and the descenders off the last. The padding is that overhang, in em so
   it tracks whatever size the fitter lands on, and it means the ink is now
   INSIDE the box rather than merely tolerated outside it. */
.display,.figure,.hero,.unit,.qm,.handle,.hv{padding-top:.14em;padding-bottom:.14em}
.display{font-family:'Anton',sans-serif;font-weight:400;text-transform:uppercase;
         letter-spacing:-0.014em;line-height:1.0}
.a{color:${c.accent};font-style:normal}
.onpic{text-shadow:0 3px 34px rgba(0,0,0,.6),0 1px 4px rgba(0,0,0,.45)}

/* A stretching box the auto-fitter measures against. Without it, text inside a
   flex child that grows can never be told apart from text that overflows it. */
/* NOT overflow:hidden. It was, briefly, to keep the slide's scrollHeight clean
   of the scaled blur behind a field layout — and it cropped letters. Clipping
   is the picture layers' job (.picwrap) and never text's: a box that hides its
   overflow hides a broken glyph just as willingly as a broken layout. The
   fitter reads scrollHeight, which reports a spill whether or not it is
   visible, so nothing is lost by letting type breathe. */
.fitbox{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;min-height:0}

/* ---------- persistent furniture ---------- */
.rail{position:absolute;left:0;top:0;height:9px;width:100%;background:rgba(255,255,255,.09);z-index:6}
.rail i{display:block;height:100%;background:${c.accent}}

.topbar{display:flex;align-items:center;justify-content:space-between;gap:20px;
        font-weight:700;font-size:22px;letter-spacing:.2em;text-transform:uppercase;
        color:${c.muted};flex:0 0 auto}
.stamp{position:absolute;top:${g.margin}px;right:${g.margin}px;z-index:7;
       font-weight:700;font-size:22px;letter-spacing:.1em;text-transform:uppercase;
       color:rgba(255,255,255,.82);white-space:nowrap;
       text-shadow:0 2px 16px rgba(0,0,0,.8),0 0 3px rgba(0,0,0,.6)}
.topbar .idx{color:${c.accent}}

/* The source line used to print the full URL, which cost two lines and 200px of
   canvas to render something nobody can read or click. The domain and the date
   are the claim; the URL belongs in the caption. */
.foot{margin-top:auto;flex:0 0 auto;padding-top:26px;display:flex;align-items:flex-end;
      justify-content:space-between;gap:24px;
      border-top:1px solid rgba(255,255,255,.16);
      font-size:24px;line-height:1.3;color:${c.muted};font-weight:700;
      letter-spacing:.1em;text-transform:uppercase}
.foot .src{color:${c.body}}
.foot .src i{font-style:normal;color:${c.accent}}
/* One line, clipped. A two-line grey credit under a cyan panel reads as a
   caption someone forgot to finish. */
.credit{font-size:17px;font-weight:400;letter-spacing:.06em;color:rgba(255,255,255,.42);
        text-align:right;max-width:430px;text-transform:none;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ---------- hook ---------- */
.hook .inner{justify-content:flex-end}
.hook .kicker{font-weight:700;font-size:24px;letter-spacing:.26em;text-transform:uppercase;
              color:${c.accent};margin-bottom:26px}
.hook h1{margin-bottom:30px}
.hook .heroWrap{display:flex;align-items:center;gap:24px;margin-bottom:30px;
                border-left:9px solid ${c.accent};padding-left:26px}
.hook .hero{font-family:'Anton',sans-serif;font-size:132px;line-height:.86;color:${c.accent};
            letter-spacing:-0.02em;flex:0 0 auto}
.hook .heroLabel{font-weight:700;font-size:30px;line-height:1.3;letter-spacing:.02em;
                 text-transform:uppercase;color:${c.ink}}
.hook .mark{display:flex;align-items:center;gap:20px;margin-bottom:18px}
.hook .mark .line{flex:1;height:2px;background:${c.rule};opacity:.45}
.hook .mark .name{font-weight:700;font-size:24px;letter-spacing:.1em;
                  text-transform:uppercase;white-space:nowrap;color:${c.ink}}
.hook .swipe{text-align:center;font-weight:700;font-size:22px;
             letter-spacing:.3em;text-transform:uppercase;color:${c.body}}
.hook .credit{position:absolute;right:${g.margin}px;bottom:26px;z-index:4}

/* ---------- stat: slide 2 doubles as a cover ---------- */
.stat .figure{font-family:'Anton',sans-serif;color:${c.accent};line-height:.9;text-transform:uppercase;
              letter-spacing:-0.03em;margin-bottom:10px}
/* text-wrap:balance so a two-line unit does not leave one word alone on the
   second line. A run reported "AI" orphaned under a full line and left it,
   correctly — it was readable. It should not have had to choose. */
.stat .unit{font-family:'Anton',sans-serif;font-size:70px;line-height:1.06;color:${c.ink};
            text-transform:uppercase;letter-spacing:-0.01em;margin-bottom:38px;text-wrap:balance}
.stat .say{font-size:${t.bodyMax - 4}px;line-height:1.42;color:${c.body};padding-bottom:.12em}
.stat .say b{color:${c.ink};font-weight:700}

/* ---------- content ---------- */
.content h2{margin-bottom:30px}
.content .body{font-size:${t.bodyMax}px;line-height:1.4;color:${c.body};font-weight:400;padding-bottom:.12em}
.content .body b{color:${c.ink};font-weight:700}

/* ---------- quote ---------- */
.quote .fitbox{justify-content:flex-end}
.quote .qm{font-family:'Anton',sans-serif;font-size:170px;line-height:.62;color:${c.accent};margin-bottom:14px}
.quote blockquote{font-weight:700;line-height:1.26;color:${c.ink};margin-bottom:34px}
.quote .by{font-size:28px;line-height:1.35;letter-spacing:.04em;color:${c.body};
           display:flex;align-items:flex-start;gap:18px}
.quote .by .tick{display:inline-block;width:46px;height:5px;background:${c.accent};flex:0 0 auto;margin-top:14px}
.quote .by b{color:${c.accent};font-weight:700}

/* ---------- contrast: claim vs caveat ----------
   The published version put two fixed-height panels in the middle of the frame
   and left 55% of it empty. The cells stretch now, and their text is fitted to
   the height they end up with rather than set at 48px and hoped for. */
/* margin-top, because the cells stretch now and the top one ended up butting
   straight against the index and the wordmark. Nothing measures the gap between
   furniture and content, so it went out on a published slide reading as a
   collision even though nothing technically overlapped. */
.contrast .cells{flex:1 1 auto;display:flex;flex-direction:column;gap:${brand.grid.gutter}px;
                 min-height:0;margin-top:30px}
.contrast .cell{flex:1 1 0;min-height:0;padding:44px 46px;border-radius:8px;
                display:flex;flex-direction:column;justify-content:center}
/* The label sits inside a translucent panel over a photograph, so muted grey
   disappears into whatever is behind it. Bright, with an edge, and it may not
   wrap: a two-line kicker over an operating theatre was the weakest thing on an
   otherwise strong slide. */
.contrast .cell .lab{font-weight:700;font-size:25px;letter-spacing:.2em;
                     text-transform:uppercase;margin-bottom:22px;flex:0 0 auto;
                     white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.contrast .cell .txt{line-height:1.18;font-weight:700;padding-bottom:.1em}
.contrast .claim{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)}
.contrast .claim .lab{color:${c.body};text-shadow:0 2px 12px rgba(0,0,0,.8)}
.contrast .claim .txt{color:${c.body}}
.contrast .caveat{background:${c.accent}}
.contrast .caveat .lab{color:rgba(4,18,26,.66)}
.contrast .caveat .txt{color:${c.accentInk}}
/* The caveat panel is filled with the accent colour, and *emphasis* paints text
   in that same accent colour. On 2026-07-25 a slide went out reading "What she
   wants back is ." with the point rendered invisibly on its own background. The
   gate was green throughout: it verifies quotations, it cannot see contrast.
   Forbidding the markup here would rely on whoever writes the next slide
   remembering. Underlining instead makes the failure unreachable. */
.contrast .caveat .a{color:${c.accentInk};text-decoration:underline;
                     text-decoration-thickness:5px;text-underline-offset:8px}
.contrast .arrow{flex:0 0 auto;text-align:center;font-family:'Anton',sans-serif;
                 font-size:34px;color:${c.accent};letter-spacing:.3em}

/* ---------- cta ---------- */
.cta .inner{align-items:center;text-align:center;justify-content:flex-end}
.cta h2{margin-bottom:26px}
.cta .sub{font-size:44px;line-height:1.3;color:${c.ink};max-width:880px;font-weight:700;margin-bottom:30px}
.cta .icons{display:flex;justify-content:center;gap:34px;margin-bottom:28px}
.cta .icons svg{filter:drop-shadow(0 3px 14px rgba(0,0,0,.6))}
.cta .follow{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:14px}
.cta .follow .plus{display:flex;align-items:center;justify-content:center;
                   width:52px;height:52px;border-radius:50%;background:${c.accent};
                   color:${c.accentInk};font-family:'Anton',sans-serif;font-size:40px;line-height:1;
                   padding-bottom:4px;flex:0 0 auto}
.cta .follow .word{font-weight:700;font-size:30px;letter-spacing:.22em;text-transform:uppercase;color:${c.ink}}
.cta .handle{font-family:'Anton',sans-serif;font-size:84px;line-height:1;color:${c.accent};
             text-transform:uppercase;letter-spacing:-0.01em;margin-bottom:18px}
.cta .disclosure{margin-top:26px;font-size:20px;line-height:1.4;color:${c.muted};
                 letter-spacing:.12em;text-transform:uppercase}`;
}

const doc = (brand, fonts, body) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss(brand, fonts)}</style></head><body>${body}</body></html>`;

/**
 * The handle, on every slide, whatever the archetype.
 *
 * It was in the topbar for one render, which put it on four slides out of seven:
 * a `content` slide with a picture across the top has no topbar at all, so the
 * one layout most worth lifting carried no mark. Absolutely positioned on the
 * slide instead, so no archetype can forget it and no layout choice can drop it.
 *
 * Reposting accounts lift slides wholesale. "ORDER OF MAGNITUDE" tells a viewer
 * who made it and gives them no way to find it; the handle does both, and it
 * contains the brand name anyway.
 */
const stamp = (brand) => `<div class="stamp">${esc(brand.handle)}</div>`;

const rail = (i, n) => `<div class="rail"><i style="width:${Math.round((i / n) * 100)}%"></i></div>`;

/*
 * The handle, not the wordmark, and on every single slide.
 *
 * Reposting accounts lift slides wholesale, and "ORDER OF MAGNITUDE" tells a
 * viewer who made it while giving them no way to find it. The handle does both
 * jobs at once, so it replaces the wordmark as furniture rather than sitting
 * next to it: one mark, always in the same place, always actionable, and it
 * still contains the brand name.
 */
const topbar = (brand, i, n) =>
  `<div class="topbar"><span class="idx">${String(i).padStart(2, "0")} / ${String(n).padStart(2, "0")}</span></div>`;

/** techcrunch.com -> TECHCRUNCH. The domain is the claim; the URL is caption material. */
export function sourceLabel(source) {
  if (!source) return "";
  if (source.name) return source.name;
  try {
    return new URL(source.url).hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return "";
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return esc(iso || "");
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

const creditChip = (image) =>
  image?.credit ? `<div class="credit">${esc(image.credit)}</div>` : "";

const foot = (s, image) => {
  const left = s.source
    ? `<span class="src">${esc(sourceLabel(s.source))} <i>·</i> ${shortDate(s.source.date)}</span>`
    : "<span></span>";
  return `<div class="foot">${left}${creditChip(image)}</div>`;
};

/**
 * The picture layers for a slide.
 *
 * `mode` comes from the archetype unless the post overrides it:
 *   full   the picture is the slide, text sits in the scrim at the bottom
 *   top    the picture bleeds across the top 44%, text below it
 *   field  blurred and dropped to a third of its brightness, a texture for type
 */
function picture(image, mode) {
  if (!image?.dataUri) return `<div class="field-fallback"></div>`;
  const pos = image.focal === "top" ? "center top" : image.focal === "bottom" ? "center bottom" : "center";
  const layers = [
    `<div class="pic ${mode}" style="background-image:url('${image.dataUri}');background-position:${pos}"></div>`,
    `<div class="tint"></div>`,
  ];
  if (mode === "full") layers.push(`<div class="scrim topfade"></div>`, `<div class="scrim bottom"></div>`);
  if (mode === "top") layers.push(`<div class="scrim seam"></div>`);
  if (mode === "field") layers.push(`<div class="scrim veil"></div>`);
  layers.push(`<div class="dimmer"></div>`);
  return `<div class="picwrap">${layers.join("")}</div>`;
}

const mode = (image, fallback) => image?.mode || fallback;

/** Slide 1 — a poster. Picture, headline, one hero figure. Nothing else. */
function hook(brand, fonts, s, i, n, image) {
  const hero = s.hero
    ? `<div class="heroWrap mass"><span class="hero">${esc(s.hero.value)}</span><span class="heroLabel">${nl(s.hero.label ?? "")}</span></div>`
    : "";
  return doc(
    brand,
    fonts,
    `<div class="slide hook">${picture(image, mode(image, "full"))}${rail(i, n)}
      <div class="inner">
        <div class="fitbox" style="justify-content:flex-end">
          ${s.kicker ? `<div class="kicker mass">${esc(s.kicker)}</div>` : ""}
          <h1 class="display fit onpic mass" data-max="${brand.type.hookMax}" data-min="${brand.type.hookMin}" data-maxlines="4">${accentize(s.headline)}</h1>
          ${hero}
        </div>
        <div class="mark"><span class="line"></span><span class="name">${esc(brand.wordmark)}</span><span class="line"></span></div>
        <div class="swipe">${esc(s.swipe ?? "Swipe for the receipts")}</div>
      </div>
      ${creditChip(image)}
    </div>`
  );
}

/** Slide 2 — one number, big enough to work as a cover on its own. */
function stat(brand, fonts, s, i, n, image) {
  return doc(
    brand,
    fonts,
    `<div class="slide stat">${picture(image, mode(image, "field"))}${rail(i, n)}
      <div class="inner">
        ${topbar(brand, i, n)}
        <div class="fitbox">
          <div class="figure fit mass" data-max="${brand.type.statMax}" data-min="${brand.type.statMin}" data-maxlines="1">${esc(s.figure)}</div>
          ${s.unit ? `<div class="unit mass">${accentize(s.unit)}</div>` : ""}
          <div class="say mass">${nl(s.body)}</div>
        </div>
        ${foot(s, image)}
      </div>
    </div>`
  );
}

/** A picture across the top, an idea underneath it. */
function content(brand, fonts, s, i, n, image) {
  const m = mode(image, "top");
  return doc(
    brand,
    fonts,
    `<div class="slide content">${picture(image, m)}${rail(i, n)}
      <div class="inner ${m === "top" ? "below" : ""}">
        ${m === "top" ? "" : topbar(brand, i, n)}
        <div class="fitbox">
          <h2 class="display fit mass" data-max="${brand.type.titleMax}" data-min="${brand.type.titleMin}" data-maxlines="3">${accentize(s.title)}</h2>
          <div class="body mass">${nl(s.body)}</div>
        </div>
        ${foot(s, image)}
      </div>
    </div>`
  );
}

function quote(brand, fonts, s, i, n, image) {
  return doc(
    brand,
    fonts,
    `<div class="slide quote">${picture(image, mode(image, "full"))}${rail(i, n)}
      <div class="inner">
        ${topbar(brand, i, n)}
        <div class="fitbox">
          <div class="qm">&ldquo;</div>
          <blockquote class="fit onpic mass" data-max="${brand.type.quoteMax}" data-min="${brand.type.quoteMin}" data-maxlines="7">${nl(s.body)}</blockquote>
          <div class="by mass"><span class="tick"></span><b>${esc(s.attribution ?? sourceLabel(s.source))}</b></div>
        </div>
        ${foot(s, image)}
      </div>
    </div>`
  );
}

/** The turn: what it looks like, next to what the source actually says. */
function contrast(brand, fonts, s, i, n, image) {
  return doc(
    brand,
    fonts,
    `<div class="slide contrast">${picture(image, mode(image, "field"))}${rail(i, n)}
      <div class="inner">
        ${topbar(brand, i, n)}
        <div class="cells">
          <div class="cell claim mass">
            <div class="lab">${esc(s.claimLabel ?? "The headline")}</div>
            <div class="txt fit" data-max="${brand.type.cellMax}" data-min="${brand.type.cellMin}" data-maxlines="5">${nl(s.claim)}</div>
          </div>
          <div class="arrow">&#9660;</div>
          <div class="cell caveat mass">
            <div class="lab">${esc(s.caveatLabel ?? "The footnote")}</div>
            <div class="txt fit" data-max="${brand.type.cellMax}" data-min="${brand.type.cellMin}" data-maxlines="5">${nl(s.caveat)}</div>
          </div>
        </div>
        ${foot(s, image)}
      </div>
    </div>`
  );
}

function cta(brand, fonts, s, i, n, image) {
  return doc(
    brand,
    fonts,
    `<div class="slide cta">${picture(image, mode(image, "full"))}${rail(i, n)}
      <div class="inner">
        <div class="fitbox" style="justify-content:flex-end">
          <h2 class="display fit onpic mass" data-max="${brand.type.titleMax + 10}" data-min="${brand.type.titleMin}" data-maxlines="3">${accentize(s.headline)}</h2>
          ${s.sub ? `<div class="sub mass">${accentize(s.sub)}</div>` : ""}
          ${iconRow(brand.colors.ink)}
          <div class="follow"><span class="plus">+</span><span class="word">Follow</span></div>
          <div class="handle mass">${esc(brand.handle)}</div>
          <div class="disclosure">${esc(brand.aiDisclosure)}</div>
        </div>
      </div>
      ${creditChip(image)}
    </div>`
  );
}

const ARCHETYPES = { hook, stat, content, quote, contrast, cta };

export function slideHtml(brand, fonts, slide, index, total, image = null) {
  const fn = ARCHETYPES[slide.type];
  if (!fn) throw new Error(`unknown slide type '${slide.type}' — expected one of ${Object.keys(ARCHETYPES).join(", ")}`);
  const html = fn(brand, fonts, slide, index, total, image);
  // Injected here rather than in each archetype: seven templates are seven
  // chances to forget the one element that has to be on all of them.
  return html.replace("</body>", `${stamp(brand)}</body>`);
}

export const SLIDE_TYPES = Object.keys(ARCHETYPES);
