# The pilot's notebook

<!-- CONSTITUTION — runs never edit anything above the RULES line.
The manual (routine.md) says what to do; this file is where runs leave each
other operational facts the code cannot encode. It exists because the lessons
that make runs fast — which sites block us, what a cold container costs, which
command to trust — used to die inside mail reports the next run never read. -->

RULES (enforced by `npm test`, which every run executes before anything else):
- Entries live below the ENTRIES line, one dash-bullet each, dated, with proof.
- **At most 20 entries.** To add when full, first merge or delete a stale one.
- Operational facts only: timings, endpoints, blocks, command usage. Never
  editorial taste, never anything that loosens a gate or a ceiling — those are
  proposals for the report, not notes. A note that argues policy gets deleted.
- Fix code before writing a note: a fixed bug cannot recur, a noted one can.
- Wrong notes are worse than no notes. If a note contradicts what you observe,
  verify live, then correct or delete it in the same commit as your evidence.

ENTRIES:

- 2026-07-28 · Datacenter-IP blocks, measured: The Verge, Ars Technica,
  openai.com article pages, VentureBeat article pages (feed works), Axios,
  Cybernews. A quote can never be gated from these; corroborate elsewhere.
  Proof: runs of 26-28/07.
- 2026-07-28 · google.com search pages reCAPTCHA this egress. Screenshot the
  source article or product page, never a search page. Proof: run 27/07.
- 2026-07-28 · Cold container costs: npm install ~40s, ffmpeg install ~40s,
  Whisper venv bootstrap ~2min + 140MB model, first Kokoro-free run. Budget
  them before the story work, not during. Proof: journals 27-28/07.
- 2026-07-28 · Land state on main ONLY via `node src/land.mjs "msg" [paths]`.
  Local `main` is clone-time state, not truth; a checkout nearly erased
  posted.jsonl on 28/07. Never force-push, ever. Proof: run report 28/07.
- 2026-07-28 · `state.mjs guard scout` never blocks (scouts publish nothing);
  bare `guard` is for publish runs and stops them inside the 2h gap.
- 2026-07-28 · Start every publish run with `node src/publish.mjs recent` vs
  posted.jsonl: a dead run may have published without recording. An unrecorded
  post republished as new is the account's worst failure. Proof: 27/07 death.
- 2026-07-28 · Veo Lite 720p ($0.05/s) is the default and looked broadcast-
  clean on the first live Reel; do not pay Fast/1080p without a reason a
  viewer would notice. A full Reel lands ≈ $0.40. Proof: spend.jsonl 28/07.
- 2026-07-28 · Set RUN_JOURNAL=reports/journal/<UTC-date>-<slot>.md at step 0;
  the engine appends spend/beat/verdict lines itself. Commit the journal
  before every purchase and publish, so a quota death leaves the receipts.
- 2026-07-28 · techcrunch.com and prnewswire.com answer 503 to the session's
  WebFetch tool but 200 to curl with a browser UA; the gate's own fetcher is
  unaffected (quotes VERIFIED same day). Read articles via curl. Proof: 10h
  scout 28/07.
