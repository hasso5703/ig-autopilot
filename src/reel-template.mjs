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

import { iconRow } from "./template.mjs";

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
  if (out && words(out) <= hard) return out.replace(/\s+/g, " ");

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

/**
 * What the voice says over a beat.
 *
 * It is the text already on the screen, never a paraphrase of it. Everything
 * printed on a slide has been through the gate; a sentence invented for the
 * narration would not have been, and nobody would ever see it to check. A post
 * may override this per slide with a `narration` field, but the same rule
 * applies to what it writes there.
 */
/**
 * "3.1 GW" read aloud over a unit that already says "gigawatts" comes out as
 * "three point one gigawatts gigawatts". The abbreviation is dropped when the
 * unit plainly spells it out, and never when it carries magnitude: dropping the
 * M from "2.6M downloads" would not be clumsy, it would be false.
 */
const MAGNITUDE = /^[MBKT%x]$/i;

function spokenFigure(figure, unit) {
  const f = String(figure || "").trim();
  const m = /^([^A-Za-z]*)([A-Za-z]+)$/.exec(f);
  if (!m) return f;
  const [, numeric, suffix] = m;
  if (MAGNITUDE.test(suffix)) return f;
  const firstWord = String(unit || "").trim().split(/\s+/)[0] || "";
  const spellsItOut = firstWord.length > 3 && firstWord[0].toLowerCase() === suffix[0].toLowerCase();
  return spellsItOut ? numeric.trim() : f;
}

function defaultNarration(b) {
  const clean = (s) => String(s || "").replace(/\*+/g, "").replace(/\s+/g, " ").trim();
  const join = (...parts) =>
    parts
      .map(clean)
      .filter(Boolean)
      .map((s) => (/[.!?]$/.test(s) ? s : s + "."))
      .join(" ");

  switch (b.type) {
    case "cover":
      return join(b.headline);
    case "stat":
      return join(`${spokenFigure(b.figure, b.unit)} ${clean(b.unit)}`, b.body);
    case "quote":
      return join(b.body, b.attribution && clean(b.attribution).split(",")[0]);
    case "contrast":
      return join(`${clean(b.claimLabel)}, ${clean(b.claim)}`, `${clean(b.caveatLabel)}, ${clean(b.caveat)}`);
    case "end":
      /*
       * The headline, not the sub. A run found the last spoken line of every
       * Reel was the account tagline while the send ask sat on screen in
       * silence — the most valuable second in the video spent on the one
       * sentence that asks for nothing.
       */
      return join(b.headline || b.sub);
    default:
      return join(b.title, b.body);
  }
}

/**
 * Cuts the beats to the voice.
 *
 * Before this, durations came from a words-per-second guess and the narration
 * was laid over the top, so the voice finished a sentence while the next beat
 * was already on screen. Now a beat lasts exactly as long as its line takes to
 * say, plus a held moment, and the pad is handed back so the audio can be
 * padded by the identical amount and stay in sync to the frame.
 */
export function applyNarrationTiming(beats, segments, { pad = 0.55, min = 2.2, long = 6 } = {}) {
  return beats.map((b, i) => {
    const spoken = segments[i]?.seconds ?? 0;
    // No upper clamp, deliberately. Capping the picture at 7.5s while the voice
    // needed 8.0 produced a negative pad, ffmpeg refused it, and the run fell
    // back to a silent Reel — a whole feature lost to a clamp. A beat that runs
    // long is an editorial problem with the copy, not an arithmetic one: it is
    // flagged as `long` for the run to shorten, and the picture waits for the
    // sentence to finish.
    const duration = Math.max(min, spoken + pad);
    return { ...b, duration, spoken, long: spoken > long, longAt: long, silence: +(duration - spoken).toFixed(3) };
  });
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
        /*
       * 13, not 9. Twice in a row a run reported that this beat kept only the
       * setup and dropped the payoff — "used to take over five hours" with no
       * "now it takes two minutes", "the company said AI was the reason" with
       * no "investors did not buy it". `shorten` only takes whole sentences, so
       * a budget that fits one fits exactly the wrong one. The length this buys
       * is no longer dangerous: the Reel refuses to paint if the total runs
       * past 25 seconds.
       */
      b = { type: "stat", figure: s.figure ?? "", unit: s.unit ?? "", body: shorten(s.body, 13), source: s.source?.name };
        break;
      case "quote":
        b = { type: "quote", body: shorten(s.body, 14), attribution: s.attribution ?? "", source: s.source?.name };
        break;
      case "contrast":
        b = {
          type: "contrast",
          claimLabel: s.claimLabel ?? "Claimed",
          claim: shorten(s.claim, 8),
          caveatLabel: s.caveatLabel ?? "In fact",
          caveat: shorten(s.caveat, 8),
          source: s.source?.name,
        };
        break;
      case "cta":
        b = { type: "end", headline: s.headline ?? "", sub: s.sub ?? "" };
        break;
      default:
        b = { type: "line", title: s.title ?? "", body: shorten(s.body, 11), source: s.source?.name };
    }
    b.words = wordCount(b.headline, b.kicker, b.body, b.title, b.unit, b.claim, b.caveat, b.sub, b.attribution);
    b.duration = beatDuration(b.words, b.type);
    b.slideIndex = post.slides.indexOf(s) + 1;
    b.narration = s.narration || defaultNarration(b);
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
/*
 * Four, not five.
 *
 * The account's first measured Reel: 168 views, 100% non-followers, 89.9% of
 * them from the Reels tab — and an average watch time of SIX SECONDS on a
 * 33-second video, with 59.7% of viewers skipping it. The surface works. The
 * length does not. A Reel that nobody finishes teaches the ranking system to
 * stop showing it, so the target is now 15 to 25 seconds, which means four
 * beats and less text in each.
 */
const MAX_BEATS = 4;
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
      /*
       * The close does more work than any other beat and the old one wasted it
       * on "A new one tomorrow.", which was a promise the account stopped
       * keeping the day it went to four posts. What replaces it is what the
       * ranking model actually rewards: a send ask first, because a DM share is
       * worth three to five likes for reaching non-followers and it is the
       * second heaviest signal there is, then the four actions drawn where the
       * viewer's thumb already is, then the follow.
       */
      return [
        b.headline && { cls: "headline sm", html: inline(b.headline) },
        b.sub && { cls: "body", html: inline(b.sub) },
        {
          cls: "engage",
          html:
            iconRow("#ffffff") +
            `<div class="followRow"><span class="plus">+</span><span class="word">Follow</span></div>` +
            `<div class="handle">${esc(handle)}</div>`,
        },
      ].filter(Boolean);
    default:
      return [
        b.title && { cls: "title", html: inline(b.title) },
        b.body && { cls: "body", html: inline(b.body) },
      ].filter(Boolean);
  }
}

export function html(post, brand, fonts, opts = {}) {
  const beats = opts.beats ?? buildTimeline(post);
  const pictures = opts.pictures ?? {};
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
      /*
       * The picture behind the beat, and a slow push in on it.
       *
       * A Reel of type on black is a slideshow, and a slideshow loses a viewer
       * in the first second. Motion is the cheapest retention there is: every
       * beat's photograph drifts from 1.02 to 1.10 across its own duration, so
       * something is always moving even while the text holds still. The veil is
       * not decoration — white type over an unmodified photograph is a coin
       * flip, and no check in this repository can see contrast.
       */
      const pic = pictures[b.slideIndex];
      const bg = pic
        ? `<div class="bgw"><div class="bg" style="background-image:url('${pic.dataUri}')"></div><div class="tint"></div><div class="veil"></div><div class="dim"></div></div>`
        : `<div class="bgw"><div class="nofield"></div></div>`;
      return `<section class="beat b-${b.type}" data-b="${i}">${bg}${lines}</section>`;
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
.beat{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;
      padding:210px 200px 470px 96px;opacity:0;will-change:opacity}
.ln{opacity:0;will-change:opacity,transform;position:relative;z-index:2;
     text-shadow:0 3px 30px rgba(0,0,0,.62),0 1px 3px rgba(0,0,0,.5)}

/* ---------- the picture behind each beat ---------- */
.bgw{position:absolute;inset:0;z-index:0;overflow:hidden}
.bg{position:absolute;inset:0;background-size:cover;background-position:center;
    filter:grayscale(.3) contrast(1.06) saturate(.9) brightness(.78);will-change:transform}
.tint{position:absolute;inset:0;background:${c.accent};opacity:.1;mix-blend-mode:color}
.veil{position:absolute;inset:0;opacity:var(--scrim,1);
  background:linear-gradient(180deg,rgba(8,8,12,.72) 0%,rgba(8,8,12,.3) 26%,rgba(8,8,12,.55) 55%,rgba(8,8,12,.93) 82%,${c.bg} 100%)}
/* Set per beat by the renderer, from the brightness it measures behind that
   beat's own words. A single fixed veil put white body copy on a sunlit library
   ceiling and every check called it fine. */
.dim{position:absolute;inset:0;background:#08080C;opacity:var(--dim,0)}
.nofield{position:absolute;inset:0;
  background:radial-gradient(60% 40% at 26% 20%, rgba(77,225,255,.2) 0%, rgba(8,8,12,0) 70%),${c.bg}}
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
.hl{font-family:'Archivo';font-size:40px;color:#D8DDE5}
.figure{font-family:'Anton';font-size:286px;line-height:.94;color:${c.accent};letter-spacing:-.02em}
.unit{font-family:'Anton';font-size:72px;line-height:1.1;color:#fff;margin-top:30px}
.title{font-family:'Anton';font-size:92px;line-height:1.05;color:#fff;margin-bottom:34px}
.body{font-family:'Archivo';font-size:50px;line-height:1.5;color:#EEF1F6;margin-top:30px}
.quote{font-family:'Anton';font-size:82px;line-height:1.28;color:#fff}
.attrib{font-family:'Archivo';font-size:40px;color:#D8DDE5;margin-top:40px;display:flex;align-items:center;gap:20px}
.tick{display:inline-block;width:64px;height:5px;background:${c.accent}}
.cell{font-family:'Archivo';font-weight:700;font-size:64px;line-height:1.3;color:#fff;
      border-left:10px solid #2a2d34;padding:36px 0 36px 44px;margin:22px 0}
.cell.alt{border-left-color:${c.accent}}
.cl{display:block;font-size:32px;letter-spacing:.12em;text-transform:uppercase;color:#CDD3DC;margin-bottom:16px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.handle{font-family:'Anton';font-size:76px;color:${c.accent};letter-spacing:-.01em}
.engage{margin-top:56px}
.engage .icons{display:flex;gap:40px;margin-bottom:30px}
.engage .icons svg{filter:drop-shadow(0 3px 16px rgba(0,0,0,.7))}
.followRow{display:flex;align-items:center;gap:20px;margin-bottom:16px}
.followRow .plus{display:flex;align-items:center;justify-content:center;width:64px;height:64px;
                 border-radius:50%;background:${c.accent};color:${c.accentInk};
                 font-family:'Anton';font-size:48px;line-height:1;padding-bottom:5px;flex:0 0 auto;
                 will-change:transform}
.followRow .word{font-weight:700;font-size:36px;letter-spacing:.22em;text-transform:uppercase;color:#fff}

#bar{position:absolute;top:0;left:0;height:6px;background:${c.accent};z-index:10}
/* The handle, on every frame of every Reel. A Reel is the most stolen format
   there is and the wordmark alone gives a viewer no way to find the account. */
#mark{position:absolute;top:96px;left:0;right:0;text-align:center;font-family:'Archivo';font-weight:700;
      font-size:30px;letter-spacing:.2em;text-transform:uppercase;color:#D5DAE2;z-index:10;
      text-shadow:0 2px 18px rgba(0,0,0,.8),0 0 3px rgba(0,0,0,.6)}
/* #6a707a was chosen against flat black. Over a photograph it disappears, and a
   source credit nobody can read is the same as no source credit. */
#src{position:absolute;bottom:410px;left:96px;right:200px;font-family:'Archivo';font-size:30px;
     letter-spacing:.06em;text-transform:uppercase;color:#C3C9D2;z-index:10;
     text-shadow:0 2px 18px rgba(0,0,0,.7)}
</style></head><body>
<div id="stage">${stage}<div id="bar"></div><div id="mark">${esc(brand.handle)}</div><div id="src"></div></div>
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
/**
 * Exposure for one beat, set before any frame is painted. Kept off the render
 * path on purpose: it must not change while the video plays.
 */
window.exposeBeat = function (i, scrim, dim) {
  const el = els[i];
  if (!el) return;
  el.style.setProperty('--scrim', String(scrim));
  el.style.setProperty('--dim', String(dim));
};

/** The box this beat's words occupy, for measuring what is behind them. */
window.beatTextBox = function (i) {
  const lines = [...els[i].querySelectorAll('.ln')];
  if (!lines.length) return null;
  const r = lines.map((l) => l.getBoundingClientRect());
  return {
    x: Math.min(...r.map((b) => b.left)),
    y: Math.min(...r.map((b) => b.top)),
    w: Math.max(...r.map((b) => b.right)) - Math.min(...r.map((b) => b.left)),
    h: Math.max(...r.map((b) => b.bottom)) - Math.min(...r.map((b) => b.top)),
    big: lines.every((l) => parseFloat(getComputedStyle(l).fontSize) >= 60),
  };
};

window.showText = function (visible) {
  for (const el of document.querySelectorAll('.ln, #bar, #mark, #src')) el.style.visibility = visible ? '' : 'hidden';
};

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

    // The slow push in. Applied whenever the beat is anywhere near the screen,
    // including through its fade, so the movement does not visibly start.
    const kb = el.querySelector('.bg');
    if (kb && u > -0.5 && u < d + 0.5) {
      kb.style.transform = 'scale(' + (1.02 + 0.08 * Math.min(1, Math.max(0, u / d))).toFixed(4) + ')';
    }

    // The follow badge breathes while the closing beat is up. Motion draws the
    // eye to the one control this beat is asking a stranger to use, and like
    // every other thing here it is a function of t alone, so a frame is still
    // reproducible from its timestamp.
    const badge = el.querySelector('.followRow .plus');
    if (badge && active) {
      badge.style.transform = 'scale(' + (1 + 0.07 * Math.sin(u * 5.2)).toFixed(4) + ')';
    }

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
