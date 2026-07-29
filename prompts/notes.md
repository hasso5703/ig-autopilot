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
  viewer would notice. A 33s Reel landed ≈ $0.40; the 60s FR format (7 beats,
  1 veo + 5 stills) lands ≈ $0.61. Proof: spend.jsonl 28-29/07.
- 2026-07-28 · Set RUN_JOURNAL=reports/journal/<UTC-date>-<slot>.md at step 0;
  the engine appends spend/beat/verdict lines itself. Commit the journal
  before every purchase and publish, so a quota death leaves the receipts.
- 2026-07-28 · techcrunch.com and prnewswire.com answer 503 to the session's
  WebFetch tool but 200 to curl with a browser UA; the gate's own fetcher is
  unaffected (quotes VERIFIED same day). Read articles via curl. Proof: 10h
  scout 28/07.
- 2026-07-28 · Outlets edit articles after publication: TechCrunch changed
  "UK" to "U.K." mid-day and a morning-gated candidate went NOT_FOUND by 19h.
  Re-run validate.mjs on any stored spec before building from it; re-copy the
  quote verbatim from the live page. Proof: 19h journal 28/07.
- 2026-07-29 · The freshness gate (STALE_DAYS=4) ages fixtures against the
  wall clock: goodPost()'s hardcoded 2026-07-25 failed 4 suite tests at once
  on 29/07 (now dynamic). test/fixtures/smoke-post.json still carries static
  07-25 dates, so CLI-validating it fails on staleness: age, not regression.
  Proof: 06h journal 29/07.
- 2026-07-28 · The 27/07 Microsoft carousel was deleted from the account
  (mediaId 17884181772455155 returns "does not exist"; only the day's Reel
  remains). Its posted.jsonl entry is intentional memory that still blocks
  re-coverage; never reconcile or delete it. insights.mjs reporting ok:false
  for that id is normal. Proof: publish.mjs recent + insights, 19h 28/07.
- 2026-07-29 · PIVOT FR + format 60s (commit du 29/07 après-midi) : tout le
  public en français; reel2 exige `title` (hook card frame 0) + `lang: fr` +
  dernier beat avec envoi nominatif; narration 130-155 mots, plafond moteur
  56s + end-card 3s auto; voix Charon + direction FR; disclosure "Voix et
  images générées par IA · Script écrit et vérifié par un humain."; premier
  commentaire + réponses via src/engage.mjs (dry-run par défaut);
  recordPosted accepte durationS pour la rétention du watch. Un spec anglais
  d'avant le pivot se réécrit en français puis se re-gate.
- 2026-07-29 · Leçons du 1er Reel FR (DbYIlApjil_) : une apposition copiée
  d'une source négligente (TechCrunch décrivant Hugging Face comme un dépôt
  de code) a atteint la publication; le gate a maintenant un lint
  known-facts qui refuse les classiques, et l'apposition se vérifie comme un
  chiffre. Visuels : 5 stills d'ambiance = papier peint; plafond 3 stills,
  type `photo` (vraies photos créditées Openverse/Commons) pour les
  personnes et produits nommés. Frames : une par beat, jamais des timestamps
  fixes.
- 2026-07-29 · Photo beats (16h): l'API Openverse peut répondre 503 quelques
  minutes (curl direct répondait 200 pendant que le build échouait; réessayer,
  pas déboguer). Le filtre fond-blanc rejette presque toutes les photos de
  conférence d'Altman; deux photos CC BY sombres qui passent: "Sam Altman
  speaking at TED" (Steve Jurvetson) et "The Prime Minister meets with AI
  developers" (UK Prime Minister). Épingler file+credit sur les beats photo
  évite la ré-acquisition; reel2 rachète le TTS (~$0.012) à chaque tentative,
  donc chaque échec de build coûte une narration. Proof: journal 16h 29/07.
- 2026-07-29 · Chirurgie volontaire du registre (14h UTC): Hasan a supprimé
  du compte le Reel DbYIlApjil_ (altman-decelerate, publié 12h49) car
  l'apposition Hugging Face fautive y était prononcée. Son enregistrement
  posted a été retiré à la main pour que le créneau de 16:30 republie le
  spec corrigé (gate PASSED, vraies photos d'Altman aux beats 2 et 4, veo
  et screenshot réutilisés via file). Ce n'est pas une perte de mémoire:
  c'est le remplacement assumé d'un Reel retiré. Le spend du premier build
  reste dû dans spend.jsonl.
