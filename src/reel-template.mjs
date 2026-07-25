/**
 * The vertical template: a carousel turned into something that plays.
 *
 * A carousel and a Reel are not the same medium wearing different dimensions.
 * A carousel is read at the reader's pace, so a dense slide is fine: they can
 * linger. A Reel advances whether or not anyone finished the sentence. Reusing
 * the carousel slides at 9:16 would produce a slideshow that is unreadable at
 * exactly the moments that matter, so the beats here carry deliberately less
 * text and hold it longer.
 *
 * Everything is a PURE FUNCTION OF TIME. The page exposes render(t) and nothing
 * animates by itself: no CSS transitions, no requestAnimationFrame, no reliance
 * on wall-clock. The renderer steps t forward and screenshots. That matters for
 * three reasons — the same post always produces byte-identical frames, a single
 * frame can be inspected in isolation when something looks wrong, and frame
 * timing cannot drift under load in a shared cloud sandbox.
 */

const W = 1080;
const H = 1920;

/** Instagram needs 5s minimum for a Reel to be eligible for the Reels tab. */
export const MIN_DURATION = 5.5;
export const FPS = 25;

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inline = (text) =>
  esc(text)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*]+)\*/g, '<em class="a">$1</em>');

/**
 * Trims a carousel body down to what can be read while it is on screen.
 * Cuts on sentence boundaries, never mid-thought, and never mid-number.
 */
export function shorten(text, maxWords = 14) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const words = (s) => s.split(/\s+/).filter(Boolean).length;

  // A whole sentence slightly over budget still beats a clean fragment, so the
  // budget is a target and this is the wall.
  const hard = Math.round(maxWords * 1.7);

  // Whole sentences first: a beat that ends mid-thought reads as a bug.
  const sentences = clean.match(/[^.!?]+[.!?]*/g) ?? [clean];
  let out = "";
  for (const s of sentences) {
    const candidate = (out + " " + s).trim();
    if (out && words(candidate) > maxWords) break;
    out = candidate;
  }
  if (out && words(out) <= hard) return out;

  // A single sentence longer than the whole budget still has to fit, so fall
  // back to clause boundaries, which at least leave a grammatical fragment.
  const first = out || sentences[0].trim();
  if (words(first) <= hard) return first;
  const clauses = first.split(/(?<=[,;:])\s+/);
  let clipped = "";
  for (const c of clauses) {
    const candidate = (clipped + " " + c).trim();
    if (clipped && words(candidate) > maxWords) break;
    clipped = candidate;
  }
  if (clipped && words(clipped) <= hard) return clipped.replace(/[,;:]$/, "");

  // Nothing clean fits. The first attempt at this cut on the word count and
  // shipped "A grid has to keep supply and demand matched second", which reads
  // as a rendering bug rather than as prose. Supporting text that cannot be
  // shown whole is better not shown: the carousel still carries it, and a beat
  // with one strong line beats a beat with one broken one.
  return "";
}

/**
 * Splits a figure so the numeric part can count up while its prefix and suffix
 * stay put. "$5" keeps the dollar sign nailed to the left, "40%" the percent to
 * the right, and neither jitters while the digits move.
 */
export function splitFigure(raw) {
  const s = String(raw ?? "").trim();
  const m = s.match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: s, value: null, decimals: 0, suffix: "" };
  const digits = m[2].replace(/,/g, "");
  const dot = digits.indexOf(".");
  return {
    prefix: m[1],
    value: Number(digits),
    decimals: dot === -1 ? 0 : digits.length - dot - 1,
    suffix: m[3],
  };
}

/**
 * How long a beat stays up.
 *
 * Reading on video is slower than on paper: there is motion competing for the
 * eye and no way to go back. Budgeting roughly three words a second, plus a
 * fixed cost for the entrance animation and a beat of silence at the end so the
 * viewer is not still reading when it cuts.
 */
function beatDuration(words, type) {
  // Roughly three words a second, which is a comfortable pace for large type
  // with motion competing for the eye, plus a fixed cost for the entrance and a
  // moment of stillness at the end so the cut does not land mid-sentence.
  //
  // The clamp is the tell. When beats saturate it, every one lasts the same
  // length and the result is a slideshow no matter how good the typography.
  // Text budgets are tuned so ordinary beats sit inside this range and only
  // genuinely dense ones touch the ceiling.
  const base = type === "stat" ? 1.9 : type === "cover" ? 2.0 : 1.4;
  return Math.min(5.4, Math.max(2.6, base + words / 2.9));
}

const wordCount = (...parts) =>
  parts.filter(Boolean).join(" ").replace(/\*+/g, "").split(/\s+/).filter(Boolean).length;

/**
 * Turns a post spec into beats. The carousel archetypes map across, but each
 * one sheds text on the way: what reads well when you control the pace is too
 * much when you do not.
 */
export function buildTimeline(post) {
  const beats = [];

  for (const s of post.slides ?? []) {
    let b;
    switch (s.type) {
      case "hook":
        b = {
          type: "cover",
          kicker: s.kicker ?? "",
          headline: s.headline ?? "",
          heroValue: s.hero?.value ?? "",
          heroLabel: s.hero?.label ?? "",
        };
        break;
      case "stat":
        b = { type: "stat", figure: s.figure ?? "", unit: s.unit ?? "", body: shorten(s.body, 12), source: s.source?.name };
        break;
      case "quote":
        b = { type: "quote", body: shorten(s.body, 20), attribution: s.attribution ?? "", source: s.source?.name };
        break;
      case "contrast":
        b = {
          type: "contrast",
          claimLabel: s.claimLabel ?? "Claimed",
          claim: shorten(s.claim, 10),
          caveatLabel: s.caveatLabel ?? "In fact",
          caveat: shorten(s.caveat, 10),
          source: s.source?.name,
        };
        break;
      case "cta":
        b = { type: "end", headline: s.headline ?? "", sub: s.sub ?? "" };
        break;
      default:
        b = { type: "line", title: s.title ?? "", body: shorten(s.body, 16), source: s.source?.name };
    }
    b.words = wordCount(b.headline, b.kicker, b.body, b.title, b.unit, b.claim, b.caveat, b.sub, b.attribution);
    b.duration = beatDuration(b.words, b.type);
    beats.push(b);
  }

  const chosen = select(beats);

  // A Reel shorter than 5 seconds is not eligible for the Reels tab, which is
  // the entire reason for making one. Stretch the last beat rather than
  // inventing content.
  const total = chosen.reduce((a, b) => a + b.duration, 0);
  if (total < MIN_DURATION && chosen.length) {
    chosen[chosen.length - 1].duration += MIN_DURATION - total;
  }
  return chosen;
}

/**
 * Which beats make the cut.
 *
 * The first version converted every slide and produced a 35 second Reel where
 * five of seven beats sat on the duration ceiling — uniform, long, and exactly
 * the slideshow this template exists to avoid. Trimming words further only made
 * the beats thin without making them fewer.
 *
 * The mistake was treating the Reel as the carousel in a different shape. It is
 * not: it is the trailer. It has to survive being watched by someone who has
 * never heard of the account, at which point completion rate is the currency,
 * and completion rate falls off a cliff with length. So keep the opening, the
 * one figure that carries the story, the turn, and the sign-off, and let the
 * carousel hold everything else.
 *
 * Priority when trimming: the cover and the sign-off are structural. A `stat`
 * is the reason a data account exists. A `contrast` is the turn, which is the
 * most send-worthy beat there is. A `quote` gives a human voice. Plain `line`
 * beats go first, because they are the ones the carousel tells better.
 */
const MAX_BEATS = 5;
const KEEP_ORDER = ["line", "quote", "contrast", "stat"];

function select(beats) {
  if (beats.length <= MAX_BEATS) return beats;

  const structural = new Set([0, beats.length - 1]);
  const droppable = beats
    .map((b, i) => ({ b, i }))
    .filter(({ i }) => !structural.has(i));

  const toDrop = new Set();
  let need = beats.length - MAX_BEATS;

  for (const type of KEEP_ORDER) {
    for (const { i, b } of droppable) {
      if (need <= 0) break;
      if (b.type === type && !toDrop.has(i)) { toDrop.add(i); need--; }
    }
    if (need <= 0) break;
  }
  return beats.filter((_, i) => !toDrop.has(i));
}

export const totalDuration = (beats) => beats.reduce((a, b) => a + b.duration, 0);

const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='.5'/></svg>`
  );

/** The lines of a beat, in entrance order. Each becomes one staggered element. */
function beatLines(b, handle) {
  switch (b.type) {
    case "cover":
      return [
        b.kicker && { cls: "kicker", html: inline(b.kicker) },
        b.headline && { cls: "headline", html: inline(b.headline) },
        b.heroValue && { cls: "hero", html: `<span class="hv">${esc(b.heroValue)}</span><span class="hl">${esc(b.heroLabel)}</span>` },
      ].filter(Boolean);
    case "stat":
      return [
        { cls: "figure", html: esc(b.figure), count: b.figure },
        b.unit && { cls: "unit", html: inline(b.unit) },
        b.body && { cls: "body", html: inline(b.body) },
      ].filter(Boolean);
    case "quote":
      return [
        { cls: "quote", html: inline(b.body) },
        b.attribution && { cls: "attrib", html: `<i class="tick"></i>${esc(b.attribution)}` },
      ].filter(Boolean);
    case "contrast":
      return [
        { cls: "cell", html: `<span class="cl">${esc(b.claimLabel)}</span>${inline(b.claim)}` },
        { cls: "cell alt", html: `<span class="cl">${esc(b.caveatLabel)}</span>${inline(b.caveat)}` },
      ];
    case "end":
      return [
        b.headline && { cls: "headline sm", html: inline(b.headline) },
        b.sub && { cls: "body", html: inline(b.sub) },
        { cls: "handle", html: esc(handle) },
      ].filter(Boolean);
    default:
      return [
        b.title && { cls: "title", html: inline(b.title) },
        b.body && { cls: "body", html: inline(b.body) },
      ].filter(Boolean);
  }
}

export function html(post, brand, fonts) {
  const beats = buildTimeline(post);
  const c = brand.colors;
  const total = totalDuration(beats);

  const stage = beats
    .map((b, i) => {
      const lines = beatLines(b, brand.handle)
        .map(
          (l, j) =>
            `<div class="ln ${l.cls}" data-i="${j}"${l.count ? ` data-count="${esc(l.count)}"` : ""}>${l.html}</div>`
        )
        .join("");
      return `<section class="beat b-${b.type}" data-b="${i}">${lines}</section>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Anton';src:url(data:font/woff2;base64,${fonts.anton}) format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Archivo';src:url(data:font/woff2;base64,${fonts.archivo}) format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Archivo';src:url(data:font/woff2;base64,${fonts.archivoBold}) format('woff2');font-weight:700;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${c.bg}}
#stage{position:relative;width:${W}px;height:${H}px;background:${c.bg};overflow:hidden}
#stage::after{content:"";position:absolute;inset:0;background-image:url("${GRAIN}");opacity:.05;mix-blend-mode:overlay;pointer-events:none;z-index:9}
/* Instagram draws its own chrome over a Reel and does not ask first: the
   caption, handle and audio strip eat the bottom of the frame, the like /
   comment / share column eats the right edge, and the header eats the top.
   Anything placed outside this box is not "tight", it is invisible. The first
   render put the source line at 104px from the bottom, squarely underneath the
   caption. */
.beat{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;
      padding:210px 200px 470px 96px;opacity:0;will-change:opacity}
.ln{opacity:0;will-change:opacity,transform}
b{font-weight:700}
em.a{font-style:normal;color:${c.accent}}

/* A kicker that wraps orphans two words on a second line and looks broken.
   text-wrap:balance splits it evenly when it must wrap at all. */
.kicker{font-family:'Archivo';font-weight:700;font-size:34px;letter-spacing:.13em;line-height:1.35;
        text-transform:uppercase;color:${c.accent};margin-bottom:38px;text-wrap:balance}
.headline{font-family:'Anton';font-size:108px;line-height:1.04;color:#fff;letter-spacing:-.005em}
.headline.sm{font-size:86px}
.hero{margin-top:56px;display:flex;flex-direction:column;gap:10px}
.hv{font-family:'Anton';font-size:132px;line-height:1;color:${c.accent}}
.hl{font-family:'Archivo';font-size:40px;color:#9aa0ab}
.figure{font-family:'Anton';font-size:286px;line-height:.94;color:${c.accent};letter-spacing:-.02em}
.unit{font-family:'Anton';font-size:72px;line-height:1.1;color:#fff;margin-top:30px}
.title{font-family:'Anton';font-size:92px;line-height:1.05;color:#fff;margin-bottom:34px}
.body{font-family:'Archivo';font-size:50px;line-height:1.5;color:#d6dae1;margin-top:30px}
.quote{font-family:'Anton';font-size:82px;line-height:1.28;color:#fff}
.attrib{font-family:'Archivo';font-size:40px;color:#9aa0ab;margin-top:40px;display:flex;align-items:center;gap:20px}
.tick{display:inline-block;width:64px;height:5px;background:${c.accent}}
.cell{font-family:'Archivo';font-weight:700;font-size:64px;line-height:1.3;color:#fff;
      border-left:10px solid #2a2d34;padding:36px 0 36px 44px;margin:22px 0}
.cell.alt{border-left-color:${c.accent}}
.cl{display:block;font-size:34px;letter-spacing:.14em;text-transform:uppercase;color:#8c929c;margin-bottom:16px}
.handle{font-family:'Anton';font-size:76px;color:${c.accent};margin-top:72px;letter-spacing:-.01em}

#bar{position:absolute;top:0;left:0;height:6px;background:${c.accent};z-index:10}
#mark{position:absolute;top:96px;left:0;right:0;text-align:center;font-family:'Archivo';font-weight:700;
      font-size:28px;letter-spacing:.34em;text-transform:uppercase;color:#565c66;z-index:10}
#src{position:absolute;bottom:410px;left:96px;right:200px;font-family:'Archivo';font-size:30px;
     letter-spacing:.06em;text-transform:uppercase;color:#6a707a;z-index:10}
</style></head><body>
<div id="stage">${stage}<div id="bar"></div><div id="mark">${esc(brand.wordmark)}</div><div id="src"></div></div>
<script>
const BEATS = ${JSON.stringify(beats.map((b) => ({ duration: b.duration, source: b.source ?? "" })))};
const TOTAL = ${total};
const els = [...document.querySelectorAll('.beat')];
const bar = document.getElementById('bar');
const src = document.getElementById('src');

// Deliberately gentle easing. Motion here exists to draw the eye to the next
// line, not to be noticed; anything springier reads as a template.
const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);


/**
 * Paints the frame at time t. Called once per frame by the renderer and by
 * nothing else, so a frame is reproducible from t alone.
 */
window.render = function (t) {
  bar.style.width = (Math.min(1, t / TOTAL) * ${W}) + 'px';

  let start = 0;
  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i], el = els[i], u = t - start, d = b.duration;
    const active = u >= -0.001 && u < d;

    // Beats overlap by a fraction of a second at the seam. A hard cut is
    // punchier in theory and jarring in practice at this size.
    //
    // The opening beat is exempt from the fade. Frame zero of a Reel is not a
    // neutral moment: it is the thumbnail Instagram can pick for the profile
    // grid, and it is the frame that decides whether a thumb stops. Fading in
    // from black spends both on nothing. The first beat is fully formed at t=0
    // and simply holds.
    const IN = 0.22, OUT = 0.18;
    const first = i === 0;
    let o = 0;
    if (active) {
      const fadeIn = first ? 1 : easeOut(u / IN);
      o = Math.min(fadeIn, u > d - OUT ? Math.max(0, (d - u) / OUT) : 1);
    }
    el.style.opacity = o;

    if (active) {
      src.textContent = b.source ? 'Source: ' + b.source : '';
      const lines = el.querySelectorAll('.ln');
      lines.forEach((ln, j) => {
        const lag = 0.09 * j;
        const p = first ? 1 : easeOut((u - lag) / 0.42);
        ln.style.opacity = p;
        ln.style.transform = 'translateY(' + ((1 - p) * 30).toFixed(2) + 'px)';

        // The figure is revealed, never computed.
        //
        // This used to count up from zero, painting the sourced value scaled by
        // an easing ramp and writing the product into the element. It
        // shipped in the first published Reel and it was wrong in the way this
        // account can least afford: easeOut decelerates, so the animation spent
        // its longest moments on 66, 67, 68, 69 on the way to a sourced 70 —
        // exactly the values that read as a real attendance figure rather than
        // as an artifact. A paused frame showed "66 people at one class" over a
        // TechCrunch credit. That is a fabricated sourced statistic.
        //
        // No check could have caught it. The JSON says 70 and the validator
        // verified 70; the multiplication happened in the browser at paint
        // time, downstream of everything.
        //
        // So the arithmetic is gone. The element always holds the sourced text,
        // and a clip-path wipes it into view. Every frame shows part of the
        // real figure and no frame shows a different number, which makes the
        // fault unreachable rather than merely fixed.
        if (ln.dataset.count !== undefined) {
          const w = first ? 1 : easeOut((u - lag) / 0.55);
          ln.style.clipPath = 'inset(0 ' + ((1 - w) * 100).toFixed(2) + '% 0 0)';
        }
      });
    }
    start += d;
  }
  if (t >= TOTAL - 0.05) src.textContent = src.textContent;
};
window.render(0);
</script></body></html>`;
}
