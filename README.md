# ig-autopilot

Autonomous AI/tech news carousels for Instagram [@order.of.magnitude](https://instagram.com/order.of.magnitude).
Runs as a scheduled Claude Code cloud routine — no server, no local machine involved.

## Why it is built this way

Three facts from Meta's own documentation shape the whole design:

1. **`image_url` is mandatory.** Meta cURLs the media server-side at publish time
   (*"the media must be hosted on a publicly accessible server at the time of the attempt"*).
   Raw-byte upload exists for video/Reels only. So rendered slides must live at a public URL —
   hence `media/` is committed to this public repo and served from `raw.githubusercontent.com`.
2. **JPEG only**, 1080×1350 (4:5), max 10 slides per carousel, 100 API posts / 24h.
3. **Instagram Login path** (`graph.instagram.com`), not Facebook Login — no Facebook Page
   required, and the app stays in Development mode with Standard Access, so no App Review.

And one from Instagram's 2026 ranking behaviour: **DM shares are the heaviest ranking signal**,
ahead of likes and comments. Every format decision optimises for "worth sending to a friend".

## Pipeline

```
sources.json ──► gather ──► score ──► extract (claim + quoted source sentence)
                                          │
                                   fact-check gate
                          (≥2 independent sources, numbers matched verbatim;
                           one unsupported claim kills the post)
                                          │
                              write ──► render ──► publish
                                       (Chromium)   (Graph API)
```

## Layout

| Path | Role |
|---|---|
| `brand/brand.json` | design tokens — colours, type scale, wordmark, AI-disclosure line |
| `brand/fonts/*.woff2` | Anton + Archivo, committed so rendering never depends on a live CDN |
| `src/template.mjs` | slide HTML (hook / content / CTA) |
| `src/render.mjs` | Chromium → exact 1080×1350 JPEG, with in-page text auto-fit |
| `src/publish.mjs` | item containers → carousel container → `media_publish` |
| `src/refresh-token.mjs` | 60-day long-lived token maintenance |
| `src/feeds.mjs` | dependency-free RSS/Atom reader over `sources.json` |
| `src/state.mjs` | run-to-run memory + cross-publisher duplicate detection |
| `src/validate.mjs` | **the fact gate** — see below |
| `prompts/routine.md` | the operating manual the scheduled routine follows |
| `posts/<slug>.json` | one post spec per story |
| `media/<slug>/NN.jpg` | rendered slides — these URLs are what Instagram reads |
| `state/` | what has already been posted, for deduplication |

## The fact gate

`src/validate.mjs` is the reason this account can claim zero hallucinations
without hand-waving. Each content slide carries `evidence`: a verbatim sentence
from the source it cites. Two mechanical checks then apply:

1. **every digit in a slide body must also appear in its evidence** — a figure
   cannot be recomputed, rounded or imagined;
2. **the cited page is fetched and the evidence string must occur in it** — a
   quotation cannot be fabricated, because the gate goes and looks.

Checks fail closed: an unreachable source is not "probably fine", it is
unverifiable, and unverifiable is not published.

Proven against a live article on 2026-07-25:

| Case | Result |
|---|---|
| honest post, real quote | `ok: true`, both quotes `VERIFIED` |
| body claims `$450 million`, absent from the quote | rejected — *figure 450 appears in the body but not in the evidence* |
| plausible but fabricated quote | rejected — `NOT_FOUND` on the live page |

## Editorial rules (non-negotiable)

- **Extractive, not generative.** A content slide may only assert what a quoted sentence from a
  cited source says. No claim without a source URL and date on the slide itself.
- **Numbers are copied, never derived.** If a figure cannot be matched verbatim in the source
  text, the post is discarded.
- **Two independent sources** for any headline claim; primary sources (a lab's own announcement)
  outrank press coverage.
- **Original framing.** Instagram demotes accounts whose output is mostly unoriginal content —
  reposting is not just lazy here, it removes the account from recommendations.
- **AI disclosure** on the final slide and in the caption, per EU AI Act art. 50, applicable
  2 August 2026 for AI-generated text published to inform the public.

## Running by hand

```bash
node src/render.mjs posts/<slug>.json          # -> media/<slug>/01.jpg …
IG_ACCESS_TOKEN=… node src/publish.mjs whoami  # sanity check
IG_ACCESS_TOKEN=… node src/publish.mjs quota   # posts used in last 24h

# builds every container but never publishes — safe against a live account
IG_ACCESS_TOKEN=… node src/publish.mjs dry-run "caption" <url1> <url2>
```

## Secrets

`IG_ACCESS_TOKEN` is supplied by the routine's **cloud environment variables**, never committed.
This repo is public; `.gitignore` blocks `.env`, `*.token` and `secrets/`.

## Verified facts (checked live, not assumed)

- Graph API versions accepted on `graph.instagram.com`: `v23.0`, `v24.0`, `v25.0`. `v26.0` does
  not exist. The code defaults to `v25.0`.
- `GET /me` returns `{ id, username, account_type: "BUSINESS" }` for this account.
- `raw.githubusercontent.com` serves committed images with a correct `image/*` content-type and
  is on the cloud environment's default allowlist.
- The cloud sandbox ships Chromium 141 + Playwright 1.56 preinstalled; `fonts.googleapis.com`
  and `fonts.gstatic.com` are allowlisted, but fonts are committed anyway for determinism.
