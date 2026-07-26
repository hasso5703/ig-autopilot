# Carousel `2026-07-26-surgical-robot-simulation` — published

**Run:** scheduled, 2026-07-26. **Instruction:** publish the already-built carousel on Hasan's
request, and nothing else. **Outcome: published at 10:54:17 UTC.**

No research, no re-render, no re-acquire. The six committed JPEGs are the artefact, and a human has
already looked at them.

## 1. The gate

`node src/validate.mjs posts/2026-07-26-surgical-robot-simulation.json` → **PASSED**, exit 0.

- **0 errors, 0 warnings.** The hero/headline composition rule that rejected the previous attempt did
  not fire at all — not as a warning either. The cover hero now reads `500`, and the headline carries
  `8,192` / five hours / two minutes, so there is no repeated figure to catch.
- **9/9 evidence fetches VERIFIED** — 4 slide quotes, 3 corroborations, 2 caption quotes, across
  `hitconsultant.net`, `blogs.nvidia.com`, `arxiv.org`. No source moved.
- 6 slides.
- `npm test` → **43/43 pass**, 0 fail.

## 2. Last look at the two slides

Read as the final check before this became public and permanent.

- **01.jpg** — Cover: a masked surgeon in a white cap at a da Vinci console, cyan-graded, kicker
  "22 JULY 2026 · NVIDIA", headline "8,192 VIRTUAL SURGICAL ROBOTS TRAINED AT ONCE. *FIVE HOURS
  BECAME TWO MINUTES.*", hero block "**500** HOURS OF REAL SURGERY WENT INTO IT", swipe prompt, and
  the "Bejaay · CC0" credit on one line. The hero no longer repeats a headline figure. Type sits
  inside the margins; nothing clipped, nothing unreadable.
- **03.jpg** — Contrast slide, marked 03/06: a translucent panel over a US Navy operating-theatre
  photograph, label "WHAT WENT INTO THE TRAINING SET" in bright legible grey-white, claim "Nearly
  *500 hours* of anonymised data from one surgical robot", then a solid cyan panel listing
  "Gallbladder removal. Prostate removal. Hernia repair. Hysterectomy.", sourced "NVIDIA · 22 JUL
  2026". On-subject and legible throughout.

Both slides carry the template fixes that the earlier report flagged as missing: the contrast label
is bright rather than muted, and the picture credit is clipped to a single line. These JPEGs are the
post-fix render.

## 3. Publish

- **Pinned commit:** `e9602f9ec348a266c6eda9859305b859f7830618`. URLs came from
  `node src/publish.mjs urls`, never hand-written, never a `/main/` branch path.
- **Dry run:** parent container `18073007717470854`, six children, every image fetched by Meta
  without error.
- **Publish:** **media id `18335552563281084`**, carousel container `18073007891470854`, six
  children.
- **Permalink:** **https://www.instagram.com/p/DbQOMqRFhxh/** — `CAROUSEL_ALBUM`, timestamp
  `2026-07-26T10:54:17+0000`, confirmed by reading the media back from the API.
- One clean call. No error after `media_publish`, so no quota check and no retry were needed.
- Caption taken verbatim from the post JSON (1,235 bytes), read programmatically rather than
  retyped, including the `AI-assisted.` disclosure line.

## 4. Scope held

- **The gap guard was not run, and any gap reading is overridden by instruction.** A human asked for
  this post. `node src/state.mjs guard` was never invoked.
- **No Reel.** This story's Reel has been live since 10:36 UTC (`17876548944684073`,
  `/reel/DbQMCT0jvwu/`). Only the carousel went out.
- **State appended, not rewritten.** `state/posted.jsonl` went from three lines to four. The three
  existing lines are byte-for-byte untouched; one line was appended via `recordPosted`.

## 5. What nearly went wrong

- **The stale local ref was real again.** `git fetch` moved `origin/main` from `42a8451` to
  `e9602f9` — the clone's ref was four commits behind before fetching, exactly the trap the
  instruction flagged. Judging "ahead" before the fetch would have been wrong, and a push from that
  state would have reverted live commits. After fetching, HEAD and `origin/main` agreed at `e9602f9`
  with a clean working tree, and that is the SHA the images were pinned to.
- **The checkout was on a detached HEAD** at that same SHA, so the final push needed `main` attached
  first rather than a bare `git push origin main`.
- **Cosmetic only, not a stop:** the photo credit on 03.jpg is ellipsised by the layout — "U.S. Navy
  photo by Mass Communica… · Public …". That is the template's deliberate one-line clipping of the
  credit, not clipped content, so it did not stop the run.
