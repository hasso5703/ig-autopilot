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
  Cybernews, nytimes.com articles (403 with browser UA, 30/07). A quote can
  never be gated from these; corroborate elsewhere. Proof: runs of 26-30/07.
  Ajout 31/07: anthropic.com/news repond 200 et se gate sans probleme (les
  citations du post du 30/07 sont passees VERIFIED du premier coup). Quand
  l'histoire est l'annonce d'un labo, tenter le primaire d'abord: openai.com
  est l'exception qui bloque, pas la regle.
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
  WebFetch tool but 200 to curl with a browser UA. Read articles via curl.
  Correction 30/07: validate.mjs's own Node fetch can ALSO 503 techcrunch.com
  intermittently even though curl succeeds at the same moment (seen 3x in
  ~20s); its built-in 2-retry backoff was not always enough. Just rerun
  `node src/validate.mjs` after a short wait, it passes. Proof: 10h scout
  28/07, 16h scout 30/07.
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
- 2026-07-29 · Une rétention >100% dans watch.mjs n'est pas un bug d'unité:
  ig_reels_avg_watch_time compte les boucles (mesuré 160386 ms de watch moyen
  sur un Reel de 51 s, total exactement 2x la moyenne, portée 0). Sous ~50 de
  portée, ignorer. Proof: insights collect 23h 29/07.
- 2026-07-29 · L'edge Graph /comments ne renvoie PAS le commentaire que le
  compte a posté lui-même via l'API: media.comments_count=1 (le seed
  17878825803503784) mais engage.mjs recent affiche "no comments". Ne jamais
  re-seeder parce que la liste paraît vide; vérifier comments_count d'abord.
  Proof: engage recent vs insights media, 23h 29/07.
- 2026-07-30 · Whisper hears a digit after a word as a hyphen-prefixed
  fragment ("Opus 5" -> "Opus"+"-5"), and mergeContinuations wrongly folded
  it into the previous word as an elision, silently swallowing the digit and
  tripping the word-count alignment guard every time a name is followed by a
  number. Fixed in src/reel2.mjs (pure-digit hyphen fragments stay their own
  token); test added. Also: a bare plural product query ("vending machines")
  can return only near-white cutouts on Openverse and fail every candidate;
  add a qualifier (place, time of day: "vending machines night") to reach
  real documentary photos. Proof: 12h55 hand-launched publish run 30/07.
- 2026-07-30 · Doctrine visuelle v2 (commit de midi): palettes MOODS
  réécrites du noir nocturne vers la lumière du jour éditoriale; hiérarchie
  par beat (photo réelle du sujet, reçu, photo d'objet, veo simple, stills
  ponts); métaphores visuelles interdites (l'autoroute qui freine du 29/07
  = slop reconnu en 0,3 s); simplicityIssues refuse foules, trafic et
  rangées avant tout achat, au gate comme au moteur. Les prompts
  d'illustration des slides écrits avant ce jour portent l'ancienne lumière:
  le warning du gate est attendu, pas bloquant. Correction 30/07 apres midi:
  brand.json/palettes.*.light n'avait pas ete resynchronise avec ce commit
  (seul promptcraft.mjs MOODS l'etait), d'ou le warning meme sur des prompts
  neufs; corrige (les deux fichiers portent la meme lumiere). brand.json.light
  n'est lu que par le nag de validate.mjs, jamais par render.mjs/template.mjs
  qui n'utilisent que .accent, donc l'edition etait sans risque.
- 2026-07-31 · `revisit` est le troisieme outcome de recordSeen: bonne
  histoire bloquee par le temps (pas encore corroboree, primaire
  injoignable), revient au bout de 6h au lieu de 36h. Ne mets `considered`
  que sur ce qui a perdu la comparaison. Et le hook "Unverified" de GitHub:
  une ligne dans le rapport, rien d'autre, jamais d'amend ni de commit
  correctif sur une branche laterale (voir routine.md, When things go wrong).
