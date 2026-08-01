# The pilot's notebook

<!-- CONSTITUTION — runs never edit anything above the RULES line.
The manual (routine.md) says what to do; this file is where runs leave each
other operational facts the code cannot encode. It exists because the lessons
that make runs fast — which sites block us, what a cold container costs, which
command to trust — used to die inside mail reports the next run never read. -->

RULES (enforced by `npm test`, which every run executes before anything else):
- Entries live below the ENTRIES line, one dash-bullet each, dated, with proof.
- **At most 26 entries.** When full, delete before you merge, and delete in
  this order: first any entry whose lesson has since been encoded in the code,
  a test or the manual (it is not operational memory any more, it is history),
  then the oldest entry nothing has needed. Merging two live facts into one
  bullet is the last resort, not the first, because merged notes get skimmed.
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
  est l'exception qui bloque, pas la regle. Ajout 31/07 (dossier xAI Memphis):
  bloquent aussi wreg.com, localmemphis.com, datacenterdynamics.com et x.ai;
  repondent 200 et se gatent sans probleme actionnews5.com (Gray TV, la presse
  locale americaine en general) et selc.org. Sur une histoire locale, la
  station TV locale est souvent la seule source joignable qui porte la
  declaration de l'entreprise. Ajout 31/07 (16h): pcgamer.com et
  digitaltrends.com repondent 200 et se gatent du premier coup; sur une
  publication de resultats, la presse specialisee joignable porte souvent la
  citation verbatim de l'appel que le primaire ne publie pas. Attention, elle
  peut l'attribuer a des personnes differentes (meme phrase donnee a Daniel Oh
  par PC Gamer et a Jaejune Kim par Digital Trends): cite l'entreprise, pas la
  personne, tant qu'un transcript n'a pas tranche.
- 2026-07-28 · google.com search pages reCAPTCHA this egress. Screenshot the
  source article or product page, never a search page. Proof: run 27/07.
- 2026-07-31 · Le depot grossit de ~19 Mo par Reel publie (reel.mp4 commite pour
  qu'Instagram le fetch), soit ~0,6 Go/mois et ~7 Go/an que CHAQUE run clone
  avant de commencer. L'encodage final est passe de CRF 18 a 21 (mesure sur le
  pire cas, du texte fin vert sur noir sous karaoke: 19,06 Mo contre 11,35 a
  CRF 22, indiscernables a 100%): -35% environ. Ca ralentit la croissance, ca ne
  la resout pas. Quand le clone deviendra lent, la vraie reponse est de retirer
  les vieux reel.mp4 de HEAD (Instagram a copie la video sur son CDN a la
  publication, l'URL ne sert plus apres). Proof: mesures du 31/07.
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
- 2026-07-28 · Set RUN_JOURNAL=reports/journal/<UTC-date>-<slot>.md at step 0;
  the engine appends spend/beat/verdict lines itself. Commit the journal
  before every purchase and publish, so a quota death leaves the receipts.
- 2026-07-28 · techcrunch.com and prnewswire.com answer 503 to the session's
  WebFetch tool but 200 to curl with a browser UA. Read articles via curl.
  Correction 30/07: validate.mjs's own Node fetch can ALSO 503 techcrunch.com
  intermittently even though curl succeeds at the same moment (seen 3x in
  ~20s); its built-in 2-retry backoff was not always enough. Just rerun
  `node src/validate.mjs` after a short wait, it passes. Proof: 10h scout
  28/07, 16h scout 30/07. Ajout 31/07 (19h): pcgamer.com fait pareil. Le meme
  spec a donne REJECTED 4 erreurs puis PASSED 0 erreur sur deux lancements
  consecutifs, toutes les erreurs sur des URL pcgamer. Une citation qui revient
  NOT_FOUND en lot sur un seul domaine est un reseau qui tousse, pas un article
  reecrit: relance avant de rouvrir la page.
- 2026-07-28 · Outlets edit articles after publication: TechCrunch changed
  "UK" to "U.K." mid-day and a morning-gated candidate went NOT_FOUND by 19h.
  Re-run validate.mjs on any stored spec before building from it; re-copy the
  quote verbatim from the live page. Proof: 19h journal 28/07.
- 2026-07-28 · The 27/07 Microsoft carousel was deleted from the account
  (mediaId 17884181772455155 returns "does not exist"; only the day's Reel
  remains). Its posted.jsonl entry is intentional memory that still blocks
  re-coverage; never reconcile or delete it. insights.mjs reporting ok:false
  for that id is normal. Proof: publish.mjs recent + insights, 19h 28/07.
- 2026-07-29 · Photo beats (16h): l'API Openverse peut répondre 503 quelques
  minutes (curl direct répondait 200 pendant que le build échouait; réessayer,
  pas déboguer). Le filtre fond-blanc rejette presque toutes les photos de
  conférence d'Altman; deux photos CC BY sombres qui passent: "Sam Altman
  speaking at TED" (Steve Jurvetson) et "The Prime Minister meets with AI
  developers" (UK Prime Minister). Épingler file+credit sur les beats photo
  évite la ré-acquisition. Correction 31/07: reel2 ne rachète PLUS la narration
  quand le script n'a pas bougé: la lecture est empreintée (texte + voix +
  langue + direction) dans le dossier du build, donc un rebuild déclenché par
  une image ne coûte ni narration ni passe Whisper. Condition: reconstruire dans
  le MÊME `media/<slug>` et ne pas le vider entre deux tentatives.
  Correction 01/08: "ni passe Whisper" etait FAUX, la moitie seulement etait
  vraie. L'audio etait reutilise puis RE-TRANSCRIT a chaque build. Corrige
  (align.json + align.key, meme empreinte que la narration): un rebuild pour une
  image ne retranscrit plus rien. Verifie a la ligne "alignment: reusing the
  clock already measured for this reading".
  Proof: journal 16h 29/07; cache prouvé de bout en bout le 31/07; correction 01/08.
- 2026-07-29 · Une rétention >100% dans watch.mjs n'est pas un bug d'unité:
  ig_reels_avg_watch_time compte les boucles (mesuré 160386 ms de watch moyen
  sur un Reel de 51 s, total exactement 2x la moyenne, portée 0). Sous ~50 de
  portée, ignorer. Proof: insights collect 23h 29/07.
- 2026-07-29 · L'edge Graph /comments ne renvoie PAS le commentaire que le
  compte a posté lui-même via l'API: media.comments_count=1 (le seed
  17878825803503784) mais engage.mjs recent affiche "no comments". Ne jamais
  re-seeder parce que la liste paraît vide; vérifier comments_count d'abord.
  Proof: engage recent vs insights media, 23h 29/07.
- 2026-07-30 · Une requete photo au pluriel nu ("vending machines") peut ne
  renvoyer que des decoupes sur fond blanc et echouer sur tous les candidats;
  ajoute un qualificatif (lieu, moment: "vending machines night") pour
  atteindre de vraies photos documentaires. (Le piege Whisper "Opus 5" du meme
  jour est corrige dans reel2.mjs et couvert par un test.) Proof: run 30/07.
  Ajout 31/07: un panorama large echoue autrement, sur le filtre fond-blanc.
  Les trois photos "memphis mississippi river skyline" ont ete refusees a
  48-59% de quasi-blanc, parce qu'un panorama de ville est surtout du ciel
  pale. Remede, ~2 min: telecharger l'original Commons, le recadrer en 9:16 sur
  le sujet avec ffmpeg, et l'epingler avec `file` + `credit` (le credit se
  recupere sur l'API Commons, champ extmetadata.Artist + LicenseShortName).
  Le moteur brule alors le credit normalement. Ajout 31/07 (19h): le candidat
  le MIEUX classe peut etre historiquement faux, et aucun filtre ne le voit.
  "computer memory modules" met en tete (8.0) un module memoire de CDC 7600
  expose au National Cryptologic Museum: vraie photo, bien licenciee, 0% de
  blanc, et une piece de musee des annees 1970 sur une actu de prix de RAM
  2027. Meme forme que la centrale en ruine du 15h. Donc sur un beat photo qui
  compte, lance `imagery.mjs candidates`, REGARDE les trois premiers, et epingle
  celui que tu as choisi avec `file` + `credit` (creditLine = creator + licence,
  le creator se lit sur api.openverse.org/v1/images/?q=...). Sans epinglage, le
  build prend le premier. Ajout 01/08: le piege existe aussi en MARQUE, pas
  seulement en epoque. "folding smartphone" ne renvoie que des Huawei Mate XT
  dans un magasin Huawei de Guangzhou (les 12 premiers), et "nvidia graphics
  card" une GeForce 7600 de 2006: sur un beat qui nomme un produit precis,
  interroge le produit ("samsung galaxy z flip"), pas sa categorie. Et quand
  meme le produit ne donne que la mauvaise generation, la carte `card` portant
  le chiffre est plus honnete qu'une photo du bon fabricant au mauvais modele.
  Mesure 01/08 aussi: AUCUNE photo documentaire de datacenter n'est atteignable
  ici ("data center server hall" 0 candidat, "data center" sort le batiment NSA
  d'Utah, "server room rack" des salles bleues rawpixel). N'y passe pas de temps.
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
- 2026-07-31 · Le format 60 s est tenu par le code, plus par un comptage de
  mots. src/format.mjs porte tous les nombres (7 a 10 beats, plafond 4 stills,
  plancher 3 surfaces reelles, fenetre de mots calculee sur SPEECH_S et sur le
  debit reel de la voix, journalise dans state/voice-rate.jsonl). reel2 etire la
  narration a l'atempo et coupe le fichier a 60,0 s exactement; un script hors
  fenetre arrete le build juste apres la narration (~$0,012 depense, aucune
  image achetee) et donne le nombre de mots a ecrire. Ne recopie jamais un
  nombre de mots de memoire: lance validate.mjs et ecris a la fenetre imprimee.
  Un still qui tient plus de 5,2 s est recadre une fois, gratuitement. La duree
  d'un beat est sa part des mots: sous 6 mots l'image clignote (refuse), et un
  beat `veo` au-dela de ~8,6 s ne peut pas etre montre, car le plus long clip Veo
  fait 8 s et le moteur ne peut que le ralentir un peu avant que la derniere
  image ne gele. Les deux builds du 31/07 ont gele ~0,3 s: mesure sur le fichier,
  89% de mouvement en moins sur les dernieres images. Proof: suite verte 79/79 et
  gate en ligne PASSED sur le spec du 31/07.
- 2026-07-31 · Paliers de modeles (consigne Hasan: un cran au-dessus, jamais le
  plus cher). Veo 3.1 Fast, 1080p des que le beat prend 8 s (natif pour
  1080x1920; le 720p etait agrandi 1,5x). Images gemini-3.1-flash-image en 2K:
  mesure live, 1536x2752 pour $0,128 contre 768x1376 pour $0,046 en Lite, soit
  +30% seulement car les tokens image ne suivent pas la surface, et c'est la
  premiere taille qui depasse le cadre. Voix gemini-3.1-flash-tts-preview.
  Le prix par image est desormais calcule sur usageMetadata, pas sur une table:
  l'ancienne table se trompait de 40%. Reel normal ~$1,20-1,60. Proof: img_ab
  et voice_ab du 31/07.
- 2026-07-31 · La voix et sa direction fixent le debit, donc la fenetre de mots.
  Une lecture chacune sur le script du jour (188 mots): 2.5-flash/Charon 3,36
  mots/s, 3.1-flash/Charon 3,26, Sadaltager 3,49, Puck 3,04, Rasalgethi 2,97
  HORS fenetre, 2.5-pro/Charon 2,84 HORS fenetre. CES CHIFFRES SONT DES
  ANECDOTES, une lecture chacun: Sadaltager mesure trois fois le meme jour donne
  3,34 de mediane, pas 3,49. Sers-t'en pour ecarter une voix, jamais pour
  dimensionner une fenetre (voir l'entree calibration). Le Pro n'est pas une amelioration
  ici: il lit trop lentement pour 60 s. Et retirer le "environ 200 mots par
  minute" de la direction fait tomber le debit a 2,77 (build refuse). Changer
  de voix = recalibrer (3 builds de state/voice-rate.jsonl), jamais un detail.
  ATTENTION: le meme script/modele/voix/direction a donne 3,26 puis 3,70 mots/s
  a 4 h d'intervalle, soit 13% d'ecart, plus large que la fenetre entiere. Donc
  un debit hors fenetre n'accuse PAS le script: le moteur rachete une lecture
  (jusqu'a 3, ~$0,025 piece) avant de refuser. Ne reecris le script que si les
  trois lectures echouent.
- 2026-07-31 · Whisper: modele large-v3-turbo int8, beam_size=1, 1,6 Go
  telecharges par ensureWhisper AVANT la transcription. Le 01/08 la transcription
  longue a derive sur le conteneur du run de 8h: 179 tokens pour 209 mots, 69%
  d'ancrage, des tokens inventes ("labishopsie", boucle "pouce pouce pouce").
  Ce n'etait PAS la narration: chaque tranche de 12 s du meme fichier revenait
  mot pour mot. UN TAUX BAS N'ACCUSE JAMAIS LA VOIX, ne rachete pas de lecture.
  CORRECTION 01/08, re-mesure hors conteneur sur le voice2_raw.wav publie: la
  cause n'est PAS le nombre de coeurs. A 4 threads comme a 20, le meme fichier
  rend 219 tokens et 90% d'ancrage, identique sur 3 passes donc deterministe;
  l'audio etire par atempo donne exactement pareil. La derive appartient a
  l'environnement du conteneur et ne se reproduit pas ailleurs: ne pars pas la
  chasser. Ecartes aussi: base (perd 14 mots), small (tronque le dernier beat),
  vad_filter et beam_size=5 (pires). LE CODE S'EN CHARGE: sous 85% d'ancrage il
  relit l'audio en fenetres de 20 s tout seul (~3x plus lent, zero dollar) et
  garde le meilleur des deux decodages; il ne refuse que si les DEUX echouent, et
  le message le dit alors explicitement. Lis la ligne "alignment: ... anchored
  (N%)" et laisse-le faire. Proof: wbench 31/07, run 08h 01/08, re-mesures 01/08.
- 2026-07-31 · Ce qu'on MONTRE est desormais tenu par le gate, pas par le gout.
  Une image generee ou un veo dont le `spec` ne partage aucun mot (>=5 lettres)
  avec les sources est REFUSE: c'est ce qui a laisse passer un verre d'eau, une
  porte entrouverte et des piles de papier sur une actu de paquet malveillant.
  Si la regle se declenche, ne cherche pas un synonyme qui passe: le beat veut
  une autre surface. Recus jusqu'a 3 (un recu bat toujours un still), nouveau
  type `card` (valeur + label sur le fond de marque, 0 $, 2 max, chiffres tenus
  par l'evidence), stills 4 max, 3 surfaces reelles min. Proof: build 31/07.
- 2026-07-31 · Tremblement des Reels, trois causes distinctes mesurees puis
  corrigees. (1) zoompan tronque l'origine de decoupe en pixels entiers: sur un
  zoom lent le trait partait a l'envers 2 frames sur 3 (+0,16 +0,19 0,00 -0,67).
  Corrige par un surechantillonnage x4 avant zoompan, ecart-type 0,352 -> 0,086
  px, +85 s de rendu par Reel. (2) overlay tronque y pareil: la carte du recu
  restait figee 3-4 frames puis sautait 2 px. Derive supprimee, c'est le
  recadrage a mi-beat qui l'anime. (3) Veo rend en 24 i/s, la timeline etait a
  25: une frame dupliquee par seconde. Timeline a 30 i/s et conversion du clip
  par `framerate` (melange), aussi lisse que minterpolate pour 7 s au lieu de
  90. Proof: mesures sur mire, jitter/ 31/07.
- 2026-07-31 · Changer de voix EXIGE de la recalibrer, et une seule lecture ne
  suffit pas. Sadaltager mesuree une fois en A/B: 3,49 mots/s. Mesuree trois
  fois avec `node src/calibrate-voice.mjs posts/<slug>.json 3` (~$0,09, les
  narrations sont jetees, seul le debit est garde): 3,22 / 3,34 / 3,44, mediane
  3,34. Soit 5% d'ecart avec l'anecdote, et la borne haute de l'ancienne
  fenetre (210 mots) aurait donne une lecture de 65 s, au-dessus du plafond
  moteur: build refuse APRES paiement. Le gate filtre le registre par voix et
  retombe sur DEFAULT_RATE tant qu'il n'a pas 3 lectures de la voix courante.
  Donc: apres tout changement de voix ou de direction, lance la calibration
  avant le premier run. Proof: calibrate-voice 31/07.
- 2026-07-31 · Le navigateur peut mourir APRES avoir ecrit la capture, et le
  build entier meurt avec lui. Deux builds sur cinq ont plante sur un
  Playwright ProtocolError ("closed", pendant les cookies) juste apres avoir
  ecrit shot_N.png, sur des pages lourdes (TechCrunch: cloudflare + recaptcha +
  regie; Action News 5: taboola). Le fichier sur disque est COMPLET et
  utilisable. Donc a chaque echec de build: epingler avec `"file"` tout ce qui
  est deja ecrit dans media/<slug>/ (shot_N.png, still_N.jpg, photo_N.jpg)
  avant de relancer. Le relance ne rachete alors que la narration (~$0,05 pour
  1 a 3 lectures) au lieu des images. Reel entier du 31/07: $0,53 en 5 builds.
  Ajout 01/08: REGARDE le shot_N.png lui-meme, pas seulement le frame rendu.
  digitaltrends.com a livre deux recus de suite ou un lecteur flottant "Ad
  Loading" couvrait le titre, puis un carton Google One Tap le paragraphe. Aucun
  ne matchait les selecteurs anti-pub (le lecteur est un `[class*=player]` sans
  `video` tant qu'il charge sa pub, One Tap est nomme d'apres les credentials).
  Selecteurs elargis dans reel2.mjs, le 3e tir etait propre. Un recu qui montre
  la regie au lieu du titre passe tous les controles automatiques.
  Proof: journal 15h 31/07, run 08h 01/08.
- 2026-07-31 · Le gate peut se tromper dans le sens "il refuse du vrai", et
  personne n'audite ce sens-la. Trois cas en deux runs le 31/07: un mot coupe
  par du balisage (NOx en <sub>), une entite nommee non decodee (&rsquo;), un
  chiffre lu dans un nom de domaine (actionnews5.com). Les trois sont corriges
  dans le code et couverts par des tests, donc ils ne reviendront pas. La
  METHODE, elle, reste: quand une citation que tu as copiee mot pour mot revient
  NOT_FOUND, refais le fetch en Node et cherche la sous-chaine dans le texte
  aplati AVANT de reformuler la phrase ou de suspecter une reecriture de
  l'article. Le 31/07 un run a reecrit un beat ("polluants qui forment le smog"
  au lieu du terme de sa source) pour contourner un bug du gate: c'est du degat
  editorial cause par une espace. Proof: gate 16h 31/07, correctifs du soir.
