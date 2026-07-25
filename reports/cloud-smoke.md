# Cloud smoke test of the rebuilt pipeline

Runner: Claude Code on the web, Ubuntu 24.04 (noble), Node on a fresh container,
repo cloned at session start. Run began 2026-07-25 23:06 UTC. Nothing was
published. `src/publish.mjs` and `src/publish-reel.mjs` were never invoked, in
any mode. Nothing under `state/` was written. No source file was edited.

Fixture: `test/fixtures/smoke-post.json`, slug `cloud-smoke-2026-07-26`, copied to
`/tmp/smoke.json` for steps 3–5.

One note before the results: the fixture is dated 2026-07-26 and the container
clock says 2026-07-25. Nothing in the run depends on it — the slides render
"25 JULY 2026" from the source dates, not from the slug — but the slug and the
day are one day apart and if a future run keys a directory off `new Date()` it
will not match the slug it was handed.

---

## 1. Setup

| command | wall clock | result |
|---|---|---|
| `npm install --no-audit --no-fund` | **2 s** | added 2 packages (playwright only) |
| `apt-get update` | **4 s** | ok |
| `apt-get install -y ffmpeg` | **35 s** | ok |
| `ffmpeg -version \| head -1` | — | `ffmpeg version 6.1.1-3ubuntu5 Copyright (c) 2000-2023 the FFmpeg developers` |
| `npm test` | **0.2 s** | **38/38 pass, 0 fail** |

ffmpeg installs. It was genuinely absent from the image — `apt-get install` pulled
the full dependency chain (libavfilter, libavdevice, libsdl2, pocketsphinx and the
rest) and `ffprobe` came with it at `/usr/bin/ffprobe`. 35 s is the cost of that,
every cold container, twice a day.

`npm install` being 2 s is not a good sign disguised as one: it added 2 packages
because Chromium is already on the image at `/opt/pw-browsers` and
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` is set. On a runner without that pre-baked
browser this step is a ~150 MB download, not 2 s.

Test suite is green, all 38, in 195 ms. Nothing skipped, nothing todo.

**Verdict on step 1: passes. ~41 s.**

---

## 2. The gate, online

`node src/validate.mjs test/fixtures/smoke-post.json` — exit 0, **1 s**.

```json
{
  "ok": true,
  "errors": [],
  "warnings": [],
  "evidenceChecks": [
    { "slide": 1, "url": "https://techcrunch.com/2026/07/25/librarians-are-hosting-viral-avoiding-ai-workshops-for-people-who-are-fed-up-with-big-tech/", "status": "VERIFIED" },
    { "slide": 2, "url": "https://techcrunch.com/2026/07/25/librarians-are-hosting-viral-avoiding-ai-workshops-for-people-who-are-fed-up-with-big-tech/", "status": "VERIFIED" },
    { "slide": 3, "url": "https://techcrunch.com/2026/07/25/librarians-are-hosting-viral-avoiding-ai-workshops-for-people-who-are-fed-up-with-big-tech/", "status": "VERIFIED" },
    { "slide": 4, "url": "https://www.bangordailynews.com/2026/07/02/midcoast/midcoast-culture/maine-librarians-are-helping-patrons-resist-ai-joam40zk0w/", "status": "VERIFIED" },
    { "slide": 5, "url": "https://www.bangordailynews.com/2026/07/02/midcoast/midcoast-culture/maine-librarians-are-helping-patrons-resist-ai-joam40zk0w/", "status": "VERIFIED" },
    { "corroboration": 1, "url": "https://techcrunch.com/2026/07/25/librarians-are-hosting-viral-avoiding-ai-workshops-for-people-who-are-fed-up-with-big-tech/", "status": "VERIFIED" },
    { "corroboration": 2, "url": "https://www.bangordailynews.com/2026/07/02/midcoast/midcoast-culture/maine-librarians-are-helping-patrons-resist-ai-joam40zk0w/", "status": "VERIFIED" },
    { "caption": 1, "url": "https://techcrunch.com/2026/07/25/librarians-are-hosting-viral-avoiding-ai-workshops-for-people-who-are-fed-up-with-big-tech/", "status": "VERIFIED" },
    { "caption": 2, "url": "https://www.bangordailynews.com/2026/07/02/midcoast/midcoast-culture/maine-librarians-are-helping-patrons-resist-ai-joam40zk0w/", "status": "VERIFIED" },
    { "caption": 3, "url": "https://techcrunch.com/2026/07/25/librarians-are-hosting-viral-avoiding-ai-workshops-for-people-who-are-fed-up-with-big-tech/", "status": "VERIFIED" }
  ],
  "slideCount": 7,
  "domains": ["techcrunch.com", "bangordailynews.com"]
}

PASSED
```

**Both newsroom origins answer a datacenter IP.** techcrunch.com and
bangordailynews.com both returned 200 with the article body intact — no Cloudflare
interstitial, no 403, no consent wall stripping the text. All ten quote checks
found their sentence on the page.

Ten checks in one second is two fetches, not ten: `validate.mjs` keeps an
in-process `Map` keyed by URL (src/validate.mjs:407), so each of the two distinct
articles is fetched once and the other eight checks read the cached body. That
cache is per-invocation, so this is a real network result — but it also means the
gate's cost does not scale with the number of quotes, and a run against five
distinct sources will take five times as long.

The failure path is correctly wired: an unreachable source produces
`UNVERIFIABLE` and, unless `allowUnverifiable`, an error that refuses the
publish (src/validate.mjs:417). It did not fire today.

**Verdict on step 2: passes, and the network finding is the good news — 1 s.**

---

## 3. Pictures

`node src/imagery.mjs /tmp/smoke.json` — exit 0, **9 s**. All three origins
answered: api.openverse.org, commons.wikimedia.org and image.pollinations.ai.
None of them refused the datacenter IP.

| slide | kind | provider | licence | credit line |
|---|---|---|---|---|
| 1 | illustration | pollinations/sana | generated | `Illustration · AI-generated` |
| 2 | photo | openverse/wikimedia | CC BY (`by`) | `Tony Webster from Portland, Oregon · CC BY` |
| 3 | illustration | pollinations/sana | generated | `Illustration · AI-generated` |
| 4 | photo | openverse/wikimedia | CC0 | `LingLass · CC0` |
| 5 | illustration | pollinations/sana | generated | `Illustration · AI-generated` |
| 6 | photo | openverse/wikimedia | CC0 | `Smallbones · CC0` |
| 7 | illustration | pollinations/sana | generated | `Illustration · AI-generated` |

Photo slides carry a `sourceUrl` back to the Commons file page and a `title`;
generated slides carry the prompt and seed 1000. `imagery.json` is written and
records all of it. Alternation is photo/illustration by slide type, and every
generated prompt ends in "no text" / "no lettering".

### What is actually in the files

I opened all seven under `media/cloud-smoke-2026-07-26/src/`.

1. **01.jpg** (92 KB, generated) — a library reading room at night, warm shaded
   lamps left and right, tall stacks receding into blue-black, a wooden table in
   the foreground with a small dark object on it. Matches the prompt. The "phone
   glowing face up" is the weakest part: the object on the table reads as a
   closed book or a block, not a phone. No lettering anywhere. Usable.
2. **02.jpg** (612 KB, photo) — Boston Public Library's Bates Hall: barrel-vaulted
   coffered ceiling, arched windows, rows of green-shaded reading lamps, several
   dozen people at the tables. Genuinely the right picture for a story about
   library classes. Bright, warm, high-key — remember that, it matters in step 5.
3. **03.jpg** (119 KB, generated) — rows of empty blue folding chairs facing a lit
   projector screen in a cold-lit community room. Exactly the brief. No text on
   the screen. Best of the four generations.
4. **04.jpg** (498 KB, photo) — Indiana Supreme Court law library: two storeys of
   black bookcases with a mezzanine railing, numbered bay plates, a leather sofa.
   Handsome, and the numbered bay plates (12, 13, 48–51) are small enough not to
   read as type. Fine.
5. **05.jpg** (118 KB, generated) — macro of a dark, scuffed metal block with a
   single ringed hole in it on a dark plate. The prompt asked for "a worn toggle
   switch"; what came back has **no toggle** — it is a socket or a bolt boss. It
   is atmospheric and abstract enough to work under type, but as a literal
   illustration of "turning it off" it does not depict the thing it names.
6. **06.jpg** (349 KB, photo) — a small yellow-brick Carnegie-style town library
   in summer, US flags on the lawn, school buses parked behind. On brief for
   "small town library". **Carries real lettering**: `— PUBLIC LIBRARY` is carved
   across the pediment. No automated check in this repo looks for that.
7. **07.jpg** (76 KB, generated) — cyan-and-white bokeh receding into black,
   long-exposure style. Abstract, no text, good CTA backdrop.

No hallucinated faces, no depiction of a quoted person, no watermarks, no
provider logos, nothing off-topic. **Seven for seven on-brief; two soft misses
(the phone in 01, the missing toggle in 05) that only a human eye catches.**

**Verdict on step 3: passes — 9 s. The step billed as most likely to fail was the
cheapest and cleanest of the five.**

---

## 4. Render

`node src/render.mjs /tmp/smoke.json /tmp/smoke-media` — exit 0, **4 s**, seven
JPEGs written.

```
slide 1 hook     coverage 90%   picture generated
slide 2 stat     coverage 100%  picture photo
slide 3 content  coverage 100%  picture generated
slide 4 contrast coverage 100%  picture photo
slide 5 quote    coverage 79%   picture generated
slide 6 content  coverage 100%  picture photo
slide 7 cta      coverage 35%   picture generated
```

Nothing was thrown. But read those numbers as what they are: coverage is how much
of the intended text made it inside its box, and five of seven at 100% means the
gate is measuring "did the words fit", not "is this worth looking at".

### Slide by slide, would it stop a thumb

1. **Hook — yes.** "LIBRARIES / NOW TEACH / YOU TO / SWITCH AI OFF" in Anton, the
   first word in cyan, over the night-library picture. Strong, readable at
   thumbnail size, and the `70 / TURNED UP. A DOZEN IS A NORMAL TURNOUT.` stat
   bar underneath gives a reason to swipe. The best slide in the set. The one
   flaw: at 90% coverage the type has eaten so much of the frame that the picture
   is decoration, not information.
2. **Stat — no.** The photo is scrimmed almost to black; Bates Hall, one of the
   most photogenic rooms in American librarianship, is reduced to a grey texture.
   Worse, the headline breaks as "PEOPLE AT ONE CLASS ON TURNING AI / OFF" with a
   single orphaned word on line two. Legible, unlovely.
3. **Content — borderline.** Clean split: picture on top, dark panel with body
   copy below, "turning the features off" picked out in cyan. Readable and dull.
   It is a paragraph on a card. Nobody stops for a paragraph.
4. **Contrast — yes, structurally.** The claim/rebuttal pairing with the cyan
   block below the grey one is the strongest layout in the deck and the arrow
   between them earns its place. But the picture behind it is invisible — you
   cannot tell there is a library back there — so slide 4 could have shipped with
   no picture at all and looked identical.
5. **Quote — yes.** Big white quote set over the dark macro, "turn it off" in
   cyan, attribution rule and byline underneath. 79% coverage and it is the
   better for it: the picture actually shows through. This is what the others
   should look like.
6. **Content — borderline, and the one to watch.** Picture on top, dark panel
   below. The town library's carved `PUBLIC LIBRARY` pediment sits directly above
   the rendered headline "A TOWN LIBRARY MADE IT A SERVICE" — two different
   typefaces stacked, one of them real-world stone. It reads as a mistake.
7. **CTA — yes.** At 35% coverage the bokeh does the work, "ONE STORY A DAY /
   @ORDER.OF.MAGNITUDE / A new one tomorrow." sits low and clean. Correct
   restraint.

**Two of seven would stop a thumb on their own (1, 7), two more once you are
already swiping (5, 4). The scrim is the problem: it is tuned so hard toward
guaranteeing legibility that on five of seven slides the picture might as well
not be there. That is the failure mode that produced the two carousels nobody
saw, in a new costume.**

**Verdict on step 4: passes mechanically — 4 s.**

---

## 5. The Reel

`node src/reel.mjs /tmp/smoke.json /tmp/smoke-media` — exit 0, **370 s (6 m 10 s)**.

**Narration succeeded.** No fallback to silence. `src/voice.mjs` built the
virtualenv, pip-installed `kokoro-onnx` and `soundfile`, and downloaded
`kokoro-v1.0.int8.onnx` (92.4 MB) and `voices-v1.0.bin` (28.2 MB) into
`.cache/kokoro` — 358 MB on disk after pip. All of it worked first try from a
datacenter IP; the GitHub release assets were reachable.

- **Voice:** `af_heart`, 33.22 s of speech across 5 lines.
- **Music bed:** `wonder-f009cbcb.mp3` — "Future Ambience Background" by
  BurghRecords, CC0. Selected from `post.mood: "wonder"`.

### Beats

| # | type | seconds | words | flag | narration |
|---|---|---|---|---|---|
| 1 | cover | 2.96 | 14 | — | "Libraries now teach you to switch AI off." |
| 2 | stat | 8.74 | 21 | **long** | "70 people at one class on turning AI off. Hannah Cyrus runs the computer classes at the public library in Bangor, Maine." |
| 3 | contrast | 11.41 | 23 | **long** | "What it looks like, People turning their backs on technology. What she actually says, Cyrus is the one who points out how useful the software that scans old library documents is." |
| 4 | quote | 7.91 | 24 | — | "People are frustrated with auto-complete on steroids. These things are trying to finish their sentences for them. Hannah Cyrus." |
| 5 | end | 2.20 | 8 | — | "A new one tomorrow." |

Two beats flagged `long` — "this line takes over 7.5s to say — shorten it" — and
the flag is right. Beat 3 alone is 34% of the Reel.

### File and probe

```
frames  831 @ 25 fps
seconds 33.22
bytes   6,832,060  →  6.51 MB
1080x1920, yuv420p, h264, 25/1 fps, aac, 48000 Hz, stereo
issues  []
```

`ffprobe -v error -show_entries stream=codec_type,codec_name,duration`:

```
codec_name=h264
codec_type=video
duration=33.200000
codec_name=aac
codec_type=audio
duration=33.222000
```

**COMPLIANT** — no violations.

Timing as reported: `paintMs 339872`, `encodeMs 29262`.

**`paintMs` is mislabelled and it hides the expensive part.** `t0` is set before
`loadSlideImages` and before `speak()` (src/reel.mjs:223–252), so that 339.9 s is
everything-except-encode. From artifact mtimes the real split is:

| phase | wall clock |
|---|---|
| venv + pip + 120 MB of weights | ~25 s |
| Kokoro synthesis (33 s of speech) | ~57 s |
| painting 831 frames in Chromium | **~259 s** |
| ffmpeg encode | 29 s |

The weights are cached under `.cache/` — gitignored, and gone with the container.
Every cold run pays the 25 s again.

### Audio is real, not silence

`volumedetect` over the muxed file: `mean_volume -21.6 dB`, `max_volume -0.4 dB`,
n_samples 3,190,784. `voice.wav` is 3.19 MB = 33.2 s of mono 48 kHz PCM. There is
a voice in there and it is mixed under a bed, not a silent track with an aac
header.

### Looking at it

Frames pulled at 0.4, 5, 11, 17, 22 s, plus frame 0 for good measure.

- **0.4 s — the profile-grid thumbnail is fully formed. The black-frame-zero
  regression is fixed.** Kicker "ORDER OF MAGNITUDE", dateline "25 JULY 2026 ·
  BANGOR, MAINE", the three-line headline with "Libraries" in cyan, and the
  `70 / turned up. A dozen is a normal turnout.` stat, all at full opacity over a
  visible library interior. Nothing is mid-fade. I also pulled frame 0 itself
  (`select=eq(n,0)`): identical, fully formed, mean luma 29.2 — dark by design,
  not black. Both the first frame and the grid frame are safe.
- **5 s and 11 s — the picture is present and the type is NOT reliably legible.**
  This is the one real defect. Both frames sit on beat 2 over the Bates Hall
  photo, and the Reel's scrim is far lighter than the carousel's: the pale cream
  ceiling shows through at near-full brightness and the white body copy
  ("people at one class on turning AI off", "Hannah Cyrus runs the computer
  classes…") is set white-on-cream across the top two-thirds of the text block.
  `SOURCE: TECHCRUNCH` at the bottom is grey-on-pale and effectively unreadable.
  The cyan `70` survives; nothing else does cleanly. The identical photo was
  scrimmed to near-black on carousel slide 2 and was perfectly legible there. The
  Reel and the carousel do not share a scrim, and the Reel's is wrong for a
  high-key picture.
- **17 s and 22 s — picture present, type legible, and the two frames are almost
  indistinguishable.** Both are beat 3 over the law-library photo, which is dark
  and takes white type well. But 11.4 s on one card with a Ken Burns move so slow
  it is imperceptible across five seconds is a third of the Reel spent on a
  static image. The `long` flag caught the sentence; nothing caught the picture
  sitting still.

**Verdict on step 5: it produces a compliant, narrated, watchable-once Reel — and
it costs 6 minutes.**

---

## 6. Cost

**Total wall clock, steps 1–5: ~426 s (7 m 06 s).**

| step | wall clock | share |
|---|---|---|
| 1 · setup (npm, apt, ffmpeg, tests) | 41 s | 10% |
| 2 · gate, online | 1 s | <1% |
| 3 · pictures | 9 s | 2% |
| 4 · render | 4 s | 1% |
| 5 · Reel | 370 s | **87%** |

Three largest contributors, all inside step 5 except one:

1. **Painting 831 Reel frames in Chromium — ~259 s (61% of the run).** One
   screenshot per frame at 1080×1920, 25 fps, for 33 s of video.
2. **Kokoro TTS synthesis — ~57 s (13%).** 33 s of speech in 57 s of CPU, int8
   ONNX on whatever cores this container has.
3. **`apt-get install ffmpeg` — 35 s (8%).** Paid on every cold container because
   ffmpeg is not in the image.

Then encode (29 s) and the Kokoro venv+weights download (25 s).

Seven minutes twice a day is affordable. But note what is *not* in that number:
this run did no research, read no feeds, and wrote no post. A real daily run adds
feed reads, model calls, and the publish round-trip on top of these seven
minutes, and the Reel painting cost does not shrink.

---

## VERDICT

### 1. Can the daily routine run this pipeline unattended today?

**Yes — with one caveat that is not about whether it runs.**

Every step completed, exit 0, on a cold container, from a datacenter IP. ffmpeg
installs. All 38 tests pass. Both newsrooms answer. All three picture origins
answer. Kokoro builds its venv and pulls 120 MB of weights first try. The Reel is
COMPLIANT, narrated, 6.51 MB, and its thumbnail frame is fully formed. There is
no blocker.

The caveat: *running* and *being worth publishing* are different tests, and the
pipeline only automates the first. Beat 2 of the Reel puts white type on a pale
ceiling and it is genuinely hard to read — and every automated check in this
repository called that frame fine. `complianceIssues()` checked the codec.
`coverage` checked that the words fit in the box. Nothing checked whether a human
can read them. If this runs unattended tomorrow it will publish that slide, and
the failure will look exactly like the two carousels that reached nobody: green
everywhere, invisible in the feed.

So: yes for the daily routine, **no for the daily routine without a human opening
the frames**, which is the same thing this smoke test just did.

### 2. Single most likely thing to break tomorrow, and what I would change

**Most likely to break: the picture providers, and specifically
image.pollinations.ai.** Four of seven slides came from it — every illustration —
and it is the only one of the three with no licence terms, no versioned API, and
no obligation to anyone. openverse.org and commons.wikimedia.org are institutions
with uptime commitments; pollinations is a free endpoint that answered today.
When it stops answering, or rate-limits a datacenter IP, or changes its response
shape, four slides lose their picture. `imagery.mjs` retries a shorter query for
*photo* slides that find nothing — I saw the test for it — but a generation
endpoint that 503s is a different failure, and `attempt: 0` on all four means
nothing exercised that path today.

**What I would change, in the order I would do it:**

1. **Fix the Reel scrim before anything else.** It is the only defect in this run
   that would reach a viewer. Measure the mean luminance of each picture's text
   region and set the scrim from it, rather than using one fixed value; the
   carousel already gets this right on the same photo, so the correct value
   exists in this repo. Then add a legibility assertion — sample the luma under
   each text block, refuse below a contrast floor — so this is caught by a check
   and not by me opening JPEGs.
2. **Give pollinations a fallback.** Cache the last successful generation per
   prompt hash, or fall back to a photo query for illustration slides, so a dead
   generator degrades to a duller Reel rather than a missing picture. Log which
   path was taken so the report shows it.
3. **Split `paintMs`.** It currently reports 340 s for a phase that is 259 s of
   painting, 57 s of speech, 25 s of downloads and a second of file I/O. Anyone
   optimising off that number optimises the wrong thing. Three counters, named
   for what they measure.
4. **Cut beat 3.** 11.4 s on one static card is a third of the Reel. The `long`
   flag already fires on it and nothing acts on the flag — make it hard-fail, or
   split the beat, or move the picture. A viewer will not sit through it.
5. **Warm the container.** ffmpeg in the image (35 s) and the Kokoro weights
   baked or on a persistent volume (25 s) removes 60 s a run, twice a day, for
   free.

---

*Run 2026-07-25 23:06–23:15 UTC. No post was researched, written, or published.
Nothing under `state/` was touched. `src/`, `prompts/` and `test/` are unmodified.*
