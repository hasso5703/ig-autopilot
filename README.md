# ig-autopilot

Autonomous French AI-news Reels for Instagram
[@order.of.magnitude](https://instagram.com/order.of.magnitude) — one story,
sixty seconds, every day. Runs as a scheduled Claude Code cloud routine: no
server, no local machine involved.

The account's promise is narrow and absolute: **every factual claim is traceable
to a verbatim sentence in a cited source.** `src/validate.mjs` is what makes
that a property of the system rather than a promise in a prompt.

## What it actually publishes

A vertical Reel, 1080×1920, **exactly 60.0 seconds**, in French: a spoken story
over cut pictures, word-by-word captions for the 85% who watch on mute, a hook
card burned from frame zero, and a fixed end-card asking for tomorrow's edition.
Carousels were retired on 2026-07-28 — every one this account published reached
zero accounts, because Instagram does not show feed posts from an account nobody
follows. `share_to_feed=true` puts the Reel itself on the grid.

## Pipeline

```
sources.json ─► gather ─► score ─► write the spec (claim + quoted sentences)
                                        │
                                 the fact gate  (validate.mjs)
                    ≥2 independent sources · every digit and every versioned
                    name copied verbatim · every picture shows something the
                    story contains · the runtime fits 60 seconds
                                        │
                          reel2.mjs ─► publish-reel.mjs ─► land.mjs
                     (voice, Whisper clock,   (Graph API)   (record on main)
                      Veo, stills, cards,
                      karaoke, mix, 60.0s)
```

## Layout

| Path | Role |
|---|---|
| `prompts/routine.md` | the operating manual the routine follows — authoritative |
| `prompts/notes.md` | the pilots' notebook: dated operational facts runs leave each other |
| `src/format.mjs` | **the 60-second format in one place** — beats, caps, word window |
| `src/validate.mjs` | **the fact gate** — see below |
| `src/reel2.mjs` | the Reel engine: the voice leads, the screen follows |
| `src/genmedia.mjs` | every paid call (Veo, images, TTS) and what each one cost |
| `src/calibrate-voice.mjs` | measure a voice before trusting a window built on it |
| `src/land.mjs` | the only way anything reaches `main` |
| `src/state.mjs` | run-to-run memory, the publication gap guard, theme repetition |
| `src/feeds.mjs` | dependency-free RSS/Atom reader over `sources.json` |
| `src/imagery.mjs` | openly-licensed photographs, with their licence and author |
| `src/insights.mjs`, `src/watch.mjs` | what the account's own posts actually did |
| `src/engage.mjs` | seed the first comment, answer the real ones |
| `posts/<slug>.json` | one post spec per story: claim, evidence, caption, `reel2` plan |
| `media/<slug>/reel.mp4` | the published Reel — this URL is what Instagram fetches |
| `state/*.jsonl` | append-only ledgers: posted, seen, spend, metrics, voice rates |
| `src/render.mjs`, `src/template.mjs`, `src/reel.mjs` | **retired** carousel path, kept for history |

## The fact gate

Each evidence-bearing slide carries `evidence`: a verbatim sentence from the
source it cites. The slides are never rendered — they are the backbone that
forces the story to be decomposed into claims that each carry their own quote.
Then, mechanically:

1. **every digit anywhere in the post must appear in some evidence quote** — a
   figure cannot be recomputed, rounded or imagined;
2. **every versioned product name spoken aloud must appear in one too** — a name
   is a fact, and on 2026-07-31 an edit that fused two models' incidents nearly
   accused the wrong one with sentences that were all individually true;
3. **the cited page is fetched and the quote must occur in it** — a quotation
   cannot be fabricated, because the gate goes and looks;
4. **a generated picture must share vocabulary with the sources** — this is what
   stops a Reel about a malicious package showing a glass of water on a table;
5. **the narration must fit sixty seconds** at the voice's own measured reading
   rate, which the engine records after every build.

Checks fail closed: an unreachable source is not "probably fine", it is
unverifiable, and unverifiable is not published.

## Meta's constraints, which shape the design

1. **Media is fetched server-side at publish time**, so the MP4 must already be
   live at a public URL — hence `media/` is committed to this public repo and
   served from `raw.githubusercontent.com`, always SHA-pinned (branch paths are
   cached and would bake a stale video into the post forever).
2. **Instagram Login path** (`graph.instagram.com`), not Facebook Login: no
   Facebook Page required, the app stays in Development mode with Standard
   Access, no App Review. 100 API posts per 24h.
3. **A publish error is not proof that nothing published.** `media_publish` has
   returned HTTP 403 *after* the post was already live. Both publishers read
   `me/media` back before surfacing any error and say which case you are in.

## Running by hand

```bash
npm test                                           # the regression net; a red suite stops a run
node src/state.mjs today                           # what the account owes today
node src/validate.mjs posts/<slug>.json            # the gate, including the word window
node src/reel2.mjs posts/<slug>.json media/<slug>  # build the Reel (about $1.50)
node src/calibrate-voice.mjs posts/<slug>.json 3   # after any voice change, before the next run

IG_ACCESS_TOKEN=… node src/publish.mjs whoami      # sanity check
IG_ACCESS_TOKEN=… node src/publish.mjs quota       # posts used in the last 24h
```

Landing is only ever `node src/land.mjs "message" [paths]`. Never
`git checkout main`, never a hand `git push`, never force: the container's local
`main` is a photograph of clone time, and `land.mjs` treats `origin/main` as the
only truth.

## Secrets

`IG_ACCESS_TOKEN` and `GEMINI_API_KEY` are supplied by the routine's **cloud
environment variables**, never committed. This repo is public; `.gitignore`
blocks `.env`, `*.token` and `secrets/`. `state/token.json` holds only the
token's issue date and renewal instructions, never the token itself.

## Verified facts (checked live, not assumed)

- Graph API versions accepted on `graph.instagram.com`: `v23.0`, `v24.0`,
  `v25.0`. `v26.0` does not exist. The code defaults to `v25.0`.
- `raw.githubusercontent.com` serves committed media with a correct
  content-type and is on the cloud environment's default allowlist.
- Some origins block datacenter addresses and always will (The Verge, Ars
  Technica, openai.com article pages). From here a 403 is an answer, not a bug;
  the current list lives in `prompts/notes.md`.
- Typefaces are committed rather than fetched, and are SIL OFL instances cut
  from Archivo and Inter: see `brand/TYPEFACES.md`.
