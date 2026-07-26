# Carousel `2026-07-26-surgical-robot-simulation` — not published

**Run:** scheduled, 2026-07-26. **Instruction:** publish the already-built carousel on Hasan's request.
**Outcome: nothing was published.** The fact gate rejected the post at step 2, and the run's own
instruction for that branch is "publish nothing and report what changed".

The gate did not fail because a source moved. Every quotation still verifies. It failed because
**the repo's rules changed after the artefact was built** — in a commit that cites this very
artefact as its reason.

## 1. The gate output

`node src/validate.mjs posts/2026-07-26-surgical-robot-simulation.json` → exit 1.

```json
{
  "ok": false,
  "errors": [
    "the hero value \"8,192\" already appears in the headline. The hero carries the comparison the headline does not: quote a different figure, or drop it."
  ],
  "warnings": [],
  "evidenceChecks": [
    { "slide": 1, "url": "https://hitconsultant.net/2026/07/22/nvidia-launches-isaac-open-source-medical-physics-simulation-framework/", "status": "VERIFIED" },
    { "slide": 2, "url": "https://blogs.nvidia.com/blog/medical-physics-simulation-open-source/", "status": "VERIFIED" },
    { "slide": 3, "url": "https://blogs.nvidia.com/blog/medical-physics-simulation-open-source/", "status": "VERIFIED" },
    { "slide": 4, "url": "https://arxiv.org/abs/2604.21017", "status": "VERIFIED" },
    { "corroboration": 1, "url": "https://blogs.nvidia.com/blog/medical-physics-simulation-open-source/", "status": "VERIFIED" },
    { "corroboration": 2, "url": "https://hitconsultant.net/2026/07/22/nvidia-launches-isaac-open-source-medical-physics-simulation-framework/", "status": "VERIFIED" },
    { "corroboration": 3, "url": "https://www.techtimes.com/articles/321330/20260723/nvidia-cuts-surgical-robot-training-hours-minutes-open-source-simulator.htm", "status": "VERIFIED" },
    { "caption": 1, "url": "https://blogs.nvidia.com/blog/medical-physics-simulation-open-source/", "status": "VERIFIED" },
    { "caption": 2, "url": "https://hitconsultant.net/2026/07/22/nvidia-launches-isaac-open-source-medical-physics-simulation-framework/", "status": "VERIFIED" }
  ],
  "slideCount": 6,
  "domains": ["hitconsultant.net", "blogs.nvidia.com", "arxiv.org"]
}

REJECTED — 1 error(s)
```

All nine live fetches VERIFIED. No source drifted. The three pages the post quotes are unchanged.

## 2. What changed: the rule, not the sources

```
62871b8  2026-07-26T10:21:02Z  post: 2026-07-26-surgical-robot-simulation   ← spec + 6 JPEGs committed
fb095ea  2026-07-26T10:33:39Z  reel: 2026-07-26-surgical-robot-simulation
c076c9d  2026-07-26T10:36:17Z  state: reel …                                ← Reel goes live
1d4f631  2026-07-26T10:40:13Z  Three things the run caught in its own report…  ← the new rule
c217bcf  2026-07-26T10:41:08Z  openai.com 403s from here…
```

`1d4f631` (authored by Hasan, 19 minutes after the JPEGs were committed) added to `src/validate.mjs`:

```js
const heroValue = String(hook?.hero?.value || "").replace(/\*+/g, "").trim();
const headlineText = String(hook?.headline || "").replace(/\*+/g, "");
if (heroValue && headlineText.includes(heroValue))
  err(`the hero value "${heroValue}" already appears in the headline. …`);
```

Its commit message names this exact artefact:

> A live Reel opened with "8,192 virtual surgical robots trained at once" and printed "8,192" again
> in the hero directly underneath. … A report is not a control: the gate refuses a hero value that
> already appears in the headline.

So the carousel is unpublished-and-rejected for the reason it should be: **it is the artefact the new
rule was written against.** The post passed twice before because the rule did not exist yet.

### The same commit also changed the render templates

`1d4f631` touched `src/template.mjs` and `src/reel-template.mjs` as well — brightening the contrast
panel label (`.contrast .claim .lab`: `c.muted` → `c.body` + text-shadow, `nowrap` + ellipsis) and
clipping the picture credit to one line. **The committed JPEGs predate those fixes by 19 minutes**,
so they render the old, rejected styling. Publishing them would ship both defects the commit fixed.

## 3. The six slides, as committed

Read with fresh eyes as the last check before permanence:

1. **01.jpg** — Surgeon at a da Vinci console, cyan-graded. Headline "8,192 VIRTUAL SURGICAL ROBOTS
   TRAINED AT ONCE. *FIVE HOURS BECAME TWO MINUTES.*" — and directly beneath it the hero prints
   **"8,192" a second time**, at display size. **This is the defect.** Confirmed visually, exactly as
   the commit describes.
2. **02.jpg** — Huge cyan "8,192" over the corridor-of-arms illustration, "TRAINING RUNS AT THE SAME
   TIME", body on the two-minutes/five-hours contrast. Clean and strong in isolation — but it means
   **"8,192" appears three times in the first two slides.**
3. **03.jpg** — Contrast slide over the US Navy keyhole-surgery photograph. The label "WHAT WENT INTO
   THE TRAINING SET" is **muted grey on a translucent panel over the photo** — the exact defect
   `1d4f631` fixed. The credit "U.S. Navy photo by Mass Communica… · Public domain" **wraps to two
   grey lines** — the other defect that commit fixed. Cyan caveat panel below is excellent.
4. **04.jpg** — Lone arm on a test bench under a hard lamp. "WHAT IT DOES *NOT* SKIP" + the
   before-not-instead-of caveat. Clean; nothing wrong.
5. **05.jpg** — Light beam across a steel table, the arXiv pull-quote on dataset scarcity, cyan
   attribution rule. Clean; the best-composed slide in the set.
6. **06.jpg** — CTA over the abstract blue field, share/save/comment/like glyphs, FOLLOW,
   @ORDER.OF.MAGNITUDE, "AI-ASSISTED" disclosure present. Clean.

Nothing is clipped or mismatched, and no picture is out of place. Slides 2, 4, 5, 6 are publishable
as-is. **Slides 1 and 3 are the problem**, and they are the cover and the strongest photograph.

## 4. Why this could not simply be fixed in-run

`.gitignore` carries `media/*/src/`, and `media/2026-07-26-surgical-robot-simulation/src/` does not
exist in this clone. Re-rendering is worse than the prompt assumed — it would lose **all six**
pictures, not just the generated ones:

- `acquirePost()` (`src/imagery.mjs:409`) does `if (existing && !reroll) continue` — every slide
  already has an `imagery.json` entry, so a plain re-acquire re-downloads **nothing**.
- `loadSlideImages()` (`src/render.mjs:~57`) then hits ENOENT on each `src/NN.jpg`, warns, and
  "the template falls back to the abstract field — never to a substitute picture."

So a naive `node src/render.mjs` here yields six abstract gradient slides and discards the CC0
Wikimedia console photograph and the public-domain US Navy theatre photograph. Not done. With
`reroll: true` the queries and seeds re-run fresh, so the photographs would likely differ anyway.

Fixing the hero also cannot be done by editing the spec alone: the duplicated "8,192" is **baked into
the pixels of 01.jpg**. It needs a re-render, which needs the raw pictures, which are not here.

## 5. State — unchanged

Nothing was appended. `state/posted.jsonl` is exactly as it was, three lines, the last being the
Reel that is already live:

```
2026-07-25T23:54:52Z  2026-07-25-chatgpt-pastor-lawsuit        18052922747787623  /p/DbPCrC6muSP/
2026-07-26T00:22:25Z  2026-07-25-chatgpt-pastor-lawsuit-reel   18096151676368646  /reel/DbPFy_zAALF/
2026-07-26T10:36:12Z  2026-07-26-surgical-robot-simulation-reel 17876548944684073 /reel/DbQMCT0jvwu/
```

No media id, no permalink, no pinned commit SHA — no containers were created, so there is nothing to
pin. `publish.mjs urls`, `dry-run` and `publish` were **not run**; steps 4–6 of the instruction were
not reached. The IG quota is untouched.

## 6. What nearly went wrong

- **The stale local ref the instruction warned about was real.** `refs/heads/main` in this clone sat
  at `42a8451`, four commits behind `origin/main` at `c217bcf`. HEAD was detached at `c217bcf`. Had
  the run reached step 6 and pushed without fetching first, it would have pushed a branch missing the
  new gate rule and the template fixes — i.e. force-reverted Hasan's 10:40 commit. `git fetch` first,
  as the instruction says, is what caught it.
- **The gap guard was overridden by instruction**, as directed. `node src/state.mjs guard` was not
  run and no gap reading was consulted. That override stands on its own and is unaffected by this
  report — the post stopped at the fact gate, not at the guard.
- **The instruction's premise is now stale.** It states the carousel is "fully researched, gated,
  rendered and committed" and that the gate "passed twice already". Both were true when written and
  neither is true now; `1d4f631` changed the gate underneath. Worth noting the prompt anticipated a
  step-2 failure meaning *a source page changed* — the actual cause was the repo's own rules.

## 7. Recommendation

The carousel cannot go out as built. Three options, in order of preference:

1. **Re-run the full pipeline for this story in an environment that re-acquires imagery**, with the
   hook's hero changed to carry the comparison rather than repeat the figure — e.g. hero value
   `"2 min"` / label `"down from over five hours"`, which is the contrast the headline does not
   already print, and is covered verbatim by the existing HIT Consultant evidence. That fixes the
   cover and picks up the contrast-label and credit fixes on slide 3 at the same time.
2. **Publish nothing for this story.** The Reel is already live and carries the same story; the grid
   does not obviously owe a second telling of it.
3. Publish as-is only by explicitly relaxing the new rule — not recommended, since it would repeat
   the already-public Reel's mistake into the permanent grid, which is what `1d4f631` exists to stop.

Option 1 needs a decision from Hasan on the replacement hero before a run can proceed, since this run
is scoped to publish, not to edit.
