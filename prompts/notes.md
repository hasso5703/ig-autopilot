# The pilot's notebook

<!-- CONSTITUTION, runs never edit anything above the RULES line.
The manual (routine.md) says what to do; this file is where runs leave each
other operational facts the code cannot encode. It exists because the lessons
that make runs fast, which sites block us, what a cold container costs, which
command to trust, used to die inside mail reports the next run never read. -->

RULES (enforced by `npm test`, which every run executes before anything else):
- Entries live below the ENTRIES line, one dash-bullet each, dated, with proof.
- **At most 26 entries.** When full, delete before you merge, and delete in
  this order: first any entry whose lesson has since been encoded in the code,
  a test or the manual (it is not operational memory any more, it is history),
  then the oldest entry nothing has needed. Merging two live facts into one
  bullet is the last resort, not the first, because merged notes get skimmed.
- Operational facts only: timings, endpoints, blocks, command usage. Never
  editorial taste, never anything that loosens a gate or a ceiling, those are
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
  personne, tant qu'un transcript n'a pas tranche. Ajout 01/08 (10h): quand le
  primaire est un billet openai.com (403), deux contournements mesures joignables
  en 200 et gates du premier coup: raw.githubusercontent.com (le README d'un
  depot openai/... porte le contenu de l'annonce, github.com et api.github.com
  sont eux interceptes 403 par le proxy de session) et cdn.openai.com (les PDF,
  mais validate.mjs lit du texte, donc un PDF ne se gate pas). Repondent 200 et
  se gatent aussi: the-decoder.com, officechai.com, erdosproblems.com. Ajout
  01/08 (16h): blog.google, npr.org, engadget.com et digitaldigging.org
  (Substack) repondent 200 et se gatent du premier coup. Ajout 02/08 (06h):
  nbcnews.com, cbsnews.com (y compris ses editions locales /minnesota/) et
  fox9.com repondent 200 et se gatent du premier coup, 7 citations sur 7. Sur
  une decision de justice americaine, TechCrunch n'est qu'une breve qui cite
  NBC: remonte au newsroom d'origine, et prends la station locale CBS/FOX pour
  la SECONDE source, elle lit les minutes du greffe elle-meme et porte les
  citations que le national coupe. Reflexe sur une actu
  produit Google: blog.google porte l'annonce ET le retrait DANS LA MEME PAGE
  ("Update, 7/31:" avant "Original post, 7/30:"), donc un seul recu couvre le
  lancement et le retropedalage, et c'est le primaire. Le Substack d'un
  chercheur (digitaldigging.org) est souvent le vrai primaire d'une histoire
  OSINT, avant toute reprise presse. Ajout 02/08 (10h): sur une actu de
  reglementation europeenne, repondent 200 et se gatent du premier coup
  digital-strategy.ec.europa.eu (le primaire: c'est la Commission elle-meme),
  euronews.com (redaction de Bruxelles, interviews d'experts a elle), et deux
  sources juridiques qui portent les dates que la presse resume mal,
  joneswalker.com et techpolicy.press. Bloquent: politico.eu (403),
  reuters.com (401). Attention a la date de l'analyse juridique:
  techpolicy.press du 02/04 decrivait le report comme une PROPOSITION, c'est
  joneswalker.com du 16/07 qui atteste qu'il a ete adopte en juin. Lis la date
  de signature avant de citer un cabinet comme s'il decrivait aujourd'hui.
  Ajout 03/08 (19h30), LE PIEGE INVERSE, mesure sur cnbc.com: un 403 en curl ou
  en WebFetch NE PROUVE PAS que le gate est bloque, ce sont trois chemins reseau
  differents. cnbc.com rend 403 a curl (UA navigateur) ET a WebFetch, et 200 /
  791 ko au fetch Node de validate.mjs, qui est le seul qui compte pour le gate:
  les 8 citations CNBC sont passees VERIFIED du premier coup. Avant d'abandonner
  une histoire dont le primaire "bloque", teste-le comme le gate le testera:
  `node --input-type=module -e "const r=await fetch(URL,{headers:{'user-agent':
  'Mozilla/5.0'}});console.log(r.status,(await r.text()).length)"`. Joignables et
  gates du premier coup ce jour-la: cnbc.com, cbsnews.com, thehill.com,
  technologyreview.com. Bloquent: fcc.gov (403), therobotreport.com (403),
  qz.com (403 partout), washingtonpost.com (503), reuters.com et theverge.com
  (403). Et attention aux coquilles du primaire: techcrunch.com a ecrit "during
  the year ending in March 31" (le "in" est d'eux), citation NOT_FOUND tant que
  tu ne le recopies pas. Ajout 04/08 (19h30): repondent 200 au fetch gate et se
  gatent du premier coup: waymo.com/blog, 9to5mac.com, appleinsider.com,
  dallasinnovates.com. engadget.com re-confirme mais sa reprise du dossier
  Apple-OpenAI credite TechCrunch ("according to a report by techcrunch"):
  pour corroborer, prends 9to5mac ou appleinsider, qui lisent le dossier
  judiciaire eux-memes. Ajout 06/08 (06h30), dossier AISI: repondent 200 au
  fetch gate ET se capturent proprement du premier coup aisi.gov.uk (blog),
  aljazeera.com, csoonline.com; cnn.com se gate aussi (200). Bloquent:
  bleepingcomputer.com (403), bbc.com et theguardian.com (403). venturebeat.com
  rend 429 sur ses pages article (limite de debit, pas un blocage: reessayer
  plus tard peut marcher). PIEGE DE CAPTURE sur aisi.gov.uk: banniere cookies
  "WWW.AISI.GOV.UK uses cookies" + bouton "I understand" collee en BAS de la
  capture, survit au clic dans les frames, meme famille que blog.google.
  Remede gratuit: `crop=1290:2293:0:0` garde titre + chapo + date. aljazeera
  garde un bandeau "Advertisement" fin tout en haut (crop du haut si le beat
  compte). Sur une actu d'une agence publique, le blog de l'agence est le
  meilleur recu: titre, chapo et date tiennent dans le cadre 9:16 sans rien
  couper. Et pour tester une capture hors moteur, il FAUT rejouer le
  `ctx.route` de reel2 (fulfill via fetch Node) et passer `proxy`: un
  Playwright nu prend ERR_CONNECTION_RESET sur tous les domaines et ne prouve
  rien. Ajout 06/08 (19h30): deepmind.google/blog repond 200 au fetch gate
  (157 ko) et porte le texte entier de l'annonce, c'est un primaire joignable
  au meme titre que blog.google. MAIS le piege du soir n'etait pas l'acces,
  c'etait la CORROBORATION: sur une annonce de labo vieille de 4 h, la seule
  reprise existante etait venturebeat.com, qui a rendu 429 puis 503 en quatre
  minutes, et aucun autre media joignable ne portait l'histoire. Une actu de
  labo publiee dans l'apres-midi n'a souvent PAS de second domaine avant le
  lendemain matin: c'est un `revisit`, pas un `considered`, et ca se teste en
  5 minutes (fetch du concurrent + une recherche) AVANT d'ecrire quoi que ce
  soit. Ajout 07/08 (06h30), dossier Suno: repondent 200 au fetch gate et se
  gatent du premier coup suno.com/blog (le primaire), gizmodo.com et
  engadget.com; techcrunch.com re-confirme. Sur une actu d'entreprise, le blog
  de la boite porte l'annonce entiere et c'est le recu le plus leger. ET LE
  PIEGE DU JOUR, a tester AVANT de choisir l'histoire: bloomberg.com rend 403
  au fetch gate. Une exclu Bloomberg est donc INGATABLE au primaire, et ses
  reprises (9to5mac, macrumors, siliconangle, androidheadlines, techcrunch)
  creditent toutes Bloomberg: c'est un seul rapport habille de six domaines,
  pas une corroboration, meme quand le gate passe au vert. Le reflexe qui
  coute 30 s: fetch le primaire cite par la depeche avant de scorer l'histoire.
  Ajout 07/08 (10h30), dossier WeatherNext: repondent 200 au fetch gate et se
  gatent du premier coup unite.ai et opensourceforu.com (deux reprises de
  l'annonce Google DeepMind), et deepmind.google/blog se re-confirme. Bloquent
  au fetch gate sur le dossier Meta/Nouveau-Mexique: theguardian.com, bbc.com,
  reuters.com, apnews.com, france24.com. Repondent 200: cbsnews.com,
  edition.cnn.com, pbs.org, cbc.ca, techpolicy.press, npr.org. venturebeat.com
  re-rend 429 (limite de debit, deuxieme jour de suite). ATTENTION corroboration
  sur une annonce de labo: unite.ai et opensourceforu ne sont pas des enquetes,
  ils reecrivent le meme billet + le meme papier Nature. Le gate passe au vert
  et c'est UNE annonce habillee de trois domaines; ce qui la valide vraiment est
  externe au web (papier revu par les pairs, forecasters du NHC/CIRA/Met Office
  co-auteurs). Dis-le dans le rapport plutot que de lire le vert comme une
  corroboration. ET la coquille du jour, meme famille que le "during the year
  ending in March 31" de TechCrunch: unite.ai ecrit "cyclones from 2023 through
  2025" la ou le primaire ecrit "from 2023 to 2024". Le primaire gagne (manuel),
  et le plus simple est de ne pas faire porter la fourchette au texte public.
  Ajout 08/08 (06h30), dossier virus concus par IA: LE RECU PRIMAIRE QUAND
  L'EDITEUR SCIENTIFIQUE BLOQUE, c'est pubmed.ncbi.nlm.nih.gov. Bloquent au
  fetch gate: science.org (403), news.stanford.edu (403), betanews.com (403),
  eurekalert.org (403), newscientist.com (403), biorxiv.org (429), nature.com
  (fetch failed). Mais la fiche PubMed de l'article
  (pubmed.ncbi.nlm.nih.gov/<pmid>/) rend 200 et porte L'ABSTRACT VERBATIM du
  papier Science, avec la reference complete (revue, date, volume, doi) et les
  affiliations: c'est le primaire, dans les mots des auteurs, et ses citations
  sont passees VERIFIED du premier coup. La ligne "Comment in" donne en prime le
  pmid du commentaire publie a cote (ici Inglesby/Hanke, "AI-designed viral
  genomes"), soit le recu de la controverse. Pour trouver le pmid sans deviner:
  pubmed.ncbi.nlm.nih.gov/?term=<titre du papier>, puis lire les /NNNNNNNN/ dans
  le HTML. Sur une actu de PAPIER SCIENTIFIQUE, va a PubMed AVANT de chercher une
  reprise presse. Repondent 200 et se gatent du premier coup ce jour-la:
  thenextweb.com (re-confirme), uppermichiganssource.com (Gray TV, re-confirme),
  press.asimov.com, techtimes.com. ATTENTION corroboration, meme piege que
  Bloomberg le 07/08: TNW et Gray creditent tous les deux le New York Times
  (injoignable), donc c'est press.asimov.com, qui lit le papier lui-meme, qui
  fait la vraie seconde lecture. Mesure du meme jour pour le dossier
  OpenAI/Astra: techcrunch.com, cnbc.com, csoonline.com et theregister.com
  rendent 200; openai.com, theverge.com, arstechnica.com, axios.com et
  zdnet.com rendent 403. Ajout 08/08 (10h30), dossier Rippling:
  rippling.com/blog rend 200 au fetch gate et se gate du PREMIER coup, 12
  citations sur 12; sur une actu d'entreprise le blog de la boite est a la fois
  le primaire et le recu le plus leger, ca se re-confirme. techcrunch.com rend
  200 le meme jour. Bloquent: ign.com (403), 01net.it (403). PIEGE DE DATE,
  nouveau et generalisable: le flux Simon Willison (et Hacker News) relaie des
  liens vers des articles de N'IMPORTE QUEL age, et la date que feeds.mjs
  affiche est celle du BILLET qui relaie, pas celle de l'article. "The
  Tokenpocalypse" est arrive date du 07/08 et l'article 404media est du
  24 JUIN. En prime 404media.co rend 200 mais coupe au paywall apres ~4
  paragraphes (5 ko de texte aplati): les chiffres Accenture/Uber n'y sont pas
  gatables. Lis la date DANS l'article avant de scorer un item Willison ou HN.
  Ajout 08/08 (16h30): PubMed est aussi un EXCELLENT RECU, pas seulement un
  primaire gatable. La fiche pubmed.ncbi.nlm.nih.gov/<pmid>/ se capture du
  premier coup, sans banniere cookies, et le cadre 9:16 tient le titre du
  papier, "Science. 2026.", les auteurs et le debut de l'abstract: c'est le
  recu le plus credible qui existe sur une actu de papier scientifique. Meme
  mesure sur thenextweb.com, capture propre et titre entier lisible, pas de mur
  de consentement. Les deux recus du Reel virus sont passes sans retouche.
  Ajout 08/08 (19h30), dossier SpaceX/Terafab: sur une actu industrielle
  locale americaine, la presse locale est joignable EN BLOC et c'est elle qui
  porte les chiffres que le national resume mal. Rendent 200 au fetch gate et
  se gatent du premier coup kbtx.com (Gray TV), kxxv.com (Scripps),
  abc13.com (KTRK) et theeagle.com; techcrunch.com re-confirme (200). ET LE
  PIEGE DE CORROBORATION DU JOUR, inverse de celui du 07/08: la depeche
  techcrunch credite explicitement "according to a report from bloomberg"
  (injoignable), donc c'est ELLE la source derivee; ce sont les deux stations
  locales, qui avaient chacune leur reporter dans la salle du commissioners
  court, qui font la vraie double lecture. Sur une reunion publique, cherche
  les redactions qui y etaient physiquement avant de compter les domaines.
  Elles se contredisent utilement: techcrunch ecrit "100% tax abatement" quand
  l'avocat de SpaceX dit en seance "approximately 78 percent" ($20 M/an sur
  35 ans, $710 M au total). Le primaire gagne et l'ecart vaut une diapo.
  Attention aussi a l'orthographe du meme porte-parole selon la source
  ("Riley Trettel" chez techcrunch, "Riley Trennell" chez kbtx): cite
  l'entreprise, pas la personne, comme sur le dossier Samsung du 31/07.
  Bloquent ce jour-la au fetch gate: optometrytimes.com (403),
  genesisopenmodels.anl.gov (403), searchengineland.com (403), martech.org
  (429), openai.com (403, re-confirme). venturebeat.com rend 429 sur ses pages
  article pour le TROISIEME jour consecutif: quand tu planifies, traite-le
  comme indisponible, pas comme un alea a reessayer.
  Ajout 09/08 (06h30), dossier OpenAI/Astra: rendent 200 au fetch gate et se
  gatent du premier coup unite.ai, the-decoder.com et techcrunch.com (0 erreur
  sur 12 citations). Bloquent: axios.com (403), technology.org (403),
  openai.com (403, re-confirme), finance.yahoo.com (fetch failed). ET LE PIEGE
  DE CORROBORATION, meme famille que Bloomberg le 07/08 mais dans le sens
  inverse: ici l'exclu Axios est injoignable ET le primaire openai.com aussi,
  donc TOUTES les reprises joignables reecrivent le meme billet OpenAI. Le
  gate passe au vert sur 3 domaines et ca reste UNE annonce. La nuance qui la
  rend quand meme publiable: le fait corrobore est "OpenAI a DIT x", et deux
  redactions qui citent la meme declaration publique attestent bien qu'elle a
  ete faite. Dis-le dans le rapport, ne lis pas le vert comme une enquete
  independante. Bonus mesure le meme jour: the-decoder porte, en fin d'article
  sous "update:", une confirmation d'Altman sur X que la sortie est retardee,
  que ni techcrunch ni unite.ai n'ont; sur une annonce de labo, lis le bas de
  page de the-decoder avant d'ecrire la chute.
  Ajout 09/08 (10h30), dossier ChatGPT gratuit illimite: rendent 200 au fetch
  gate et se gatent du premier coup (12/12) techcrunch.com, unite.ai,
  macrumors.com et testingcatalog.com. Bloque: neowin.net (403). RAPPEL
  macrumors: il SE GATE mais ne se CAPTURE PAS (mur Cloudflare, mesure 03/08),
  donc il sert de source et de corroboration, jamais de recu. testingcatalog.com
  est un petit site (peu d'iframes) et est le meilleur candidat recu de ce lot
  sur le critere O(frames) du 06/08, a confirmer en moteur.
  Ajout 09/08 (19h30), dossier motif anti-cameras: rendent 200 au fetch gate
  norecognition.org, sandbox.norecognition.org (/about et /research) et
  defcon.org. Bloquent: startlandnews.com (403) et kickstarter.com (403), donc
  la campagne de financement et le seul autre journal a avoir couvert le projet
  sont ingatables. PIEGE DE CORROBORATION, encore, et la variante la plus dure:
  le RESULTAT (la demo publique) n'est rapporte QUE par techcrunch, et le
  "second domaine" est le site du chercheur lui-meme. Ca reste publiable (le
  primaire atteste la recherche, la methode et le passage au DEF CON, et il
  publie ses propres reserves), mais ne lis pas le vert comme deux redactions.
  ET LA MECANIQUE DU GATE QUI COUTE DEUX ALLERS-RETOURS: le controle
  "corroboration ... shares only N distinctive word(s)" est un POURCENTAGE du
  vocabulaire du centralClaim, donc un centralClaim qui empile DEUX
  affirmations (le resultat + la demo) fait chuter le score mecaniquement:
  13% puis 21%, alors que la meme citation passait a 30% une fois le claim
  ramene a UNE seule affirmation, ce que le manuel demande deja. Ecris une
  phrase, une affirmation, avant de suspecter la source.
  Ajout 10/08 (06h30), dossier Amazon/Pecos: rendent 200 au fetch gate et se
  gatent du premier coup distilled.earth (le Substack du cabinet Cleanview),
  thenextweb.com (re-confirme) et newrepublic.com. Bloque: gvwire.com (403).
  ET LE REFLEXE QUI TROUVE LE VRAI PRIMAIRE, meme famille que digitaldigging.org
  le 02/08: la breve techcrunch credite explicitement "according to the new york
  times" (injoignable), donc elle est DERIVEE; le scoop est le bulletin de
  l'analyste, qui a lu les permis d'air de l'Etat, commande de l'imagerie
  satellite et obtenu la confirmation de l'entreprise. Sur une actu
  d'INFRASTRUCTURE ou d'ENERGIE, cherche le bulletin du cabinet d'analyse AVANT
  la reprise presse: il est joignable, il est le primaire, et il porte les
  chiffres que la breve resume. Nuance a dire dans le rapport: le NYT a enquete
  en parallele et reste illisible d'ici, donc toutes les reprises joignables
  (tnw, newrepublic) citent soit Cleanview soit le NYT, et le vert du gate
  n'atteste pas deux enquetes independantes.
  Ajout 10/08 (10h30), dossier OpenClaw/salle de sport: abc.net.au rend 403 au
  fetch gate ET est bloque dans WebFetch, donc une exclu de l'ABC australienne
  est ingatable au primaire. Le contournement mesure, et il est excellent:
  rnz.co.nz rend 200 et porte L'ARTICLE ENTIER de l'ABC, signature comprise
  ("cam wilson and rhiannon hobbins for abc news"), donc toutes les citations
  (14/14 VERIFIED du premier coup) se prennent la-bas, y compris les paroles de
  l'agent et les experts. businesstoday.in rend 200 aussi mais ecrit "according
  to an abc report". DONC, et c'est la meme famille que Bloomberg le 07/08 et le
  NYT ce matin: RNZ n'est pas une seconde redaction, c'est de la SYNDICATION.
  Deux domaines verts = UN seul reportage. Publiable en le disant ("rapporte
  par la radio publique australienne"), jamais lu comme une corroboration.
  Reflexe general: sur une actu australienne, cherche RNZ avant d'abandonner.
  Ajout 10/08 (19h30): venturebeat.com rend 429 au fetch gate pour le QUATRIEME
  jour consecutif (07, 08, 09 et 10/08). Ce n'est plus une limite de debit
  passagere a reessayer: quand tu planifies, traite-le comme indisponible, et
  n'ecris pas une histoire dont il est la SEULE source. Perdu ce soir pour cette
  raison: l'exclu Stanford/Merck (37 000 agents en biotech virtuelle), remise en
  revisit sans une ligne d'ecrite.
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
  Ajout 05/08: un premier build complet a froid (venv Whisper + narration +
  veo + stills + captures + rendu) depasse la fenetre de 10 min d'un outil
  Bash en avant-plan: le build du 05/08 a ete TUE a l'assemblage a ~13 min.
  Lance reel2.mjs en arriere-plan (run_in_background). Un build tue apres les
  achats ne perd rien: epingle tout ce qui est sur disque avec `file` et
  relance dans le MEME dossier, le rebuild du 05/08 a coute $0.
- 2026-07-28 · Land state on main ONLY via `node src/land.mjs "msg" [paths]`.
  Local `main` is clone-time state, not truth; a checkout nearly erased
  posted.jsonl on 28/07. Never force-push, ever. Proof: run report 28/07.
  Ajout 06/08 (19h30), PIEGE DE SHELL a la publication: le CLI imprime TOUTES
  ses reponses en JSON, donc `publish-reel.mjs url <slug>` sort l'URL AVEC ses
  guillemets. `URL=$(node src/publish-reel.mjs url <slug> | tail -1)` capture
  donc `"https://..."` et le dry-run meurt sur `FAILED: the video URL is not
  fetchable (Failed to parse URL from ...)`. Ce n'est ni le reseau ni l'URL:
  c'est une paire de guillemets. Pipe le dans `tr -d '\"' | xargs` avant de
  l'exporter. Echec bruyant, gratuit, attrape par le dry-run (rien n'est
  publie), mais il coute un aller-retour a chaque run qui script cette etape.
  Ajout 08/08 (06h30), LE HOOK DE FIN DE SESSION MENT, et sa consigne est un
  piege: il imprime "There are N unpushed commit(s) on branch claude/<...>.
  Please push these changes". C'est FAUX apres un land.mjs reussi. Il compare la
  branche de travail a origin/claude/<...>, qui n'existe pas, donc il compte les
  commits de land.mjs comme non pousses alors qu'ils sont deja sur origin/main
  et prouves. Verifie en 5 s avant de toucher a quoi que ce soit:
  `git rev-parse HEAD` et `git rev-parse origin/main` rendent le MEME sha, et
  `git log origin/main..HEAD` est vide. Ne pousse PAS la branche laterale: le
  prochain run clone la branche par defaut, tout y est deja, et un ref de plus
  vers des commits deja dans main ne sauve rien (voir le 30/07). Meme traitement
  que le hook "Unverified": une ligne dans le rapport, et on passe.
- 2026-08-01 · Le filtre "l'image montre quelque chose de l'histoire" compare
  des mots RACINISES (state.mjs tokens/stem), et la racine casse au pluriel:
  "spheres" donne "spher", "sphere" donne "sphere", donc un spec au pluriel ne
  matche pas une source au singulier et le beat est refuse a tort. En plus la
  racine doit faire 5 lettres ou plus: "packed"/"packing" donnent "pack" (4) et
  ne comptent jamais. Ecris les sujets de spec au SINGULIER et vise un nom long
  present tel quel dans une citation d'evidence. Verifier avant de relancer le
  gate: `node -e "import('./src/state.mjs').then(m=>console.log(m.tokens('...')))"`.
  Proof: gate 10h 01/08, beat "identical spheres packed" refuse, "a dense sphere
  packing" accepte.
  Ajout 03/08 (11h): DANS UN SPEC VEO, `action` EST UN MOUVEMENT, JAMAIS UNE
  DESTINATION. Ecrit "is pressed down into its slot on a laptop board until it
  lies flat": Veo a interpole vers l'etat final et la barrette a ete AVALEE par
  la carte (pellicule: presente a 3 s, en train de couler a 4 s, slot vide a
  6 s). Les mots qui declenchent ca sont les etats finaux, until it lies flat,
  into place, fully inserted, flush. Ecris un participe present qui fait UNE
  chose ("dropping one can into the tray"), une seule etape (pas inserer-puis-
  basculer: la physique lache sur les actions sequentielles), et nomme en
  positif ce qui doit rester vrai a la derniere image. Tout ce qui rentre DANS
  autre chose est la famille a risque; ce qui tombe/glisse/bascule garde le
  sujet entier. Ajout 04/08: le controle "le spec ne nomme personne du post"
  matche par MOT, pas par entite: "a white and grey body" est refuse parce que
  les sources disent "White House". Sur une histoire qui cite la Maison-Blanche,
  ecris les couleurs autrement ("pale grey"); le message du moteur nomme le mot
  fautif, lis-le avant de chercher plus loin. ET LE CONTROLE: une image fixe ne peut pas auditer un
  mouvement, les deux images prises dans ce beat (0,5 s et 3,0 s) etaient
  parfaitement plausibles, la faute n'existe qu'ENTRE elles. Monte la pellicule
  de 8 vignettes (hstack, commande dans routine.md) sur tout beat veo.
  Proof: Reel 2026-08-03-macbook-air-memoire, publie avec le defaut.
  Ajout 07/08 (19h30), GENERALISE le piege "White House" ci-dessus: storyVocab
  RETIRE tout token appartenant a un nom propre des sources, donc un mot commun
  tres banal peut devenir invisible au filtre. Dossier Suno: "music" est
  supprime parce que les citations disent "Universal Music Group" et "Sony
  Music Entertainment", donc un spec veo decrivant "its music player screen"
  a ete refuse "shares no word with the sources" alors que l'histoire parle de
  musique de bout en bout. "generat" tombe pareil (AI-generated). Et le message
  du gate ne liste que les 18 premiers mots autorises par ordre alphabetique,
  donc il coupe avant celui qui t'interesse: ne devine pas, imprime la liste
  entiere en 10 s (storyVocab = tokens(centralClaim + evidence) MOINS
  tokens(namedActors(...)), les deux exportes). Mots surs et utiles ici: audio,
  track, stream, platform, listen, recording, download. Remede applique:
  "audio player screen" + "as the track plays", accepte du premier coup.
  Ajout 08/08 (10h30), LE PIEGE EN AMONT, qui explique la moitie des refus:
  storyVocab est construit sur centralClaim + les citations d'EVIDENCE DU POST,
  jamais sur l'article entier. Un mot bien present dans la source mais que tu
  n'as cite nulle part n'existe pas pour le filtre. Dossier Rippling: TechCrunch
  ecrit "dumping them into a paper shredder", mais cette phrase n'etait
  l'evidence d'aucune diapo, donc un spec veo "a banknote across the feed slot
  of a paper shredder" a ete refuse "shares no word with the sources" sur un
  vocabulaire de 89 mots ou ni shredder, ni paper, ni cash ne figuraient. Deux
  issues, et la premiere n'est pas toujours la bonne: soit la phrase merite
  vraiment d'etre une evidence (cite-la), soit le beat veut une autre surface.
  Ici c'etait la seconde: le shredder n'existe que dans la PUB de l'entreprise,
  pas dans les faits rapportes, donc le gate refusait a juste titre une
  metaphore. Imprime le vocabulaire ENTIER avant d'ecrire un spec, le message
  n'en montre que 18 par ordre alphabetique.
  Ajout 09/08 (06h30), LE CAS OU AUCUN SPEC NE PEUT PASSER, et c'est une
  information, pas un obstacle: sur une actu d'ANNONCE (evaluation, rapport,
  reglement), storyVocab ne contient AUCUN nom physique. Dossier Astra, 86
  mots, et pas un seul screen, server, cable, room, board, machine: seuls des
  abstraits (capability, evaluation, framework, severity, development). Deux
  specs image ont ete refuses de suite. Ne cherche pas un synonyme: le seul
  spec qui est passe decrivait un ECRAN D'EVALUATION ("a terminal window
  filled with security evaluation output"), parce que security et evaluation
  sont les seuls concrets du lot. Reflexe: sur une actu d'annonce, prevois des
  le depart photos + recus + `card`, et budgete UNE still au maximum.
  Ajout 09/08 (16h30), LE MEME CAS RESOLU AUTREMENT, et ca repond aussi a la
  question du beat 0 anime. Dossier ChatGPT gratuit illimite: storyVocab fait
  86 mots et ne contient AUCUN objet physique (ni phone, ni smartphone, ni
  screen, ni device; seulement button, upload, report, prompt, error). Donc
  aucun spec veo d'ouverture n'etait possible, et ce n'est pas un jugement de
  gout: sur une actu de CHANGEMENT DE REGLE PRODUIT (une limite qui saute, un
  tarif, une disponibilite), il n'existe pas de moment filmable, exactement
  comme la ligne "reglement qui entre en vigueur" du manuel. Imprime le
  vocabulaire AVANT de debattre du beat 0, ca tranche en 10 s. Ce qui a pris le
  beat 0 a la place: une vraie photo documentaire de quelqu'un avec son
  telephone (rang 1 de la hierarchie, au-dessus d'un clip genere).
  ET LA STILL DE DOCUMENT QUI NE RATE PAS: le manuel interdit la prose inventee
  ("a page of a proof" est revenu couvert d'anglais illisible le 01/08). Demande
  des COLONNES DE CHIFFRES et le piege disparait: spec "a printed evaluation
  report page filled with columns of numbers" + "lying flat under a desk lamp" +
  "extreme close-up, the page fills the entire frame" a rendu du premier coup
  une page de tableaux numeriques nette, zero mot anglais, zero logo, zero date.
  Les chiffres se lisent comme de la notation, la prose non: c'est la meme regle
  que "formules, symboles ou code" mais avec une formulation qui marche.
  Ajout 10/08 (10h30), DEUX FACONS DONT UN MOT "EVIDENT" DISPARAIT DU VOCABULAIRE,
  dossier OpenClaw/salle de sport. (1) namedActors a mange "software" parce que
  les citations portent "law firm Thomsons" et surtout "Software is not a legal
  person" EN DEBUT DE PHRASE (majuscule = nom propre pour le detecteur). Sur une
  histoire dont le sujet EST un logiciel, le mot "software" etait donc interdit
  de spec: meme famille que "music" supprime par "Universal Music Group" le
  07/08, mais declenche par une simple majuscule de debut de phrase, pas par une
  vraie entite. (2) LE MOT COMPOSE NE SE DECOUPE PAS: les sources ecrivent
  "waitlist", donc un spec disant "a waiting list of names" est refuse "shares no
  word" alors que l'histoire ne parle que de ca ("waiting" et "list" sont deux
  tokens, aucun n'est "waitlist", et "list" fait 4 lettres donc ne compterait pas
  de toute facon). Le correctif a passe du premier coup: "a class waitlist of
  names shown on a screen" (class + waitlist, tous deux dans le vocabulaire).
  Re-confirme aussi le cas "aucun spec veo possible" du 09/08: sur ce dossier les
  123 tokens ne contiennent AUCUN objet filmable (ni phone, ni screen, ni laptop,
  ni door, ni machine; "gym" fait 3 lettres), seulement reservation, waitlist,
  class, position, place. Imprime le vocabulaire ENTIER avant d'ecrire un spec ET
  avant de debattre du beat 0, le message du gate n'en montre que 18.
  Ajout 10/08 (16h30), LA STILL D'ECRAN QUI NE RATE PAS, et elle generalise la
  "page de chiffres" du 09/08 au cas ou l'histoire se passe DANS un logiciel.
  Une still generee decrivant une page d'interface ("a gym class booking page
  open on a laptop screen") est la famille a prose inventee du 01/08: le modele
  remplit l'ecran de faux anglais lisible. Les deux specs qui ont RENDU PROPRE du
  premier coup, sur ce meme dossier: (1) "a laptop screen filled with the source
  code of a class reservation page" -> un vrai ecran de code, du bruit qui se lit
  comme de la notation, zero phrase anglaise lisible; (2) "a class waitlist
  screen filled with a single column of position numbers" -> un panneau
  "POSITION" avec la colonne 1 a 22, net, zero mot invente, ET une famille
  visuelle differente de la premiere. Regle: sur une actu de logiciel, demande du
  CODE ou des NUMEROS, jamais une interface. Bonus: ces deux surfaces ne se
  ressemblent pas, ce qui repond aussi a "Alternate visual families" quand deux
  beats doivent montrer un ecran.
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
  Ajout 03/08 (17h), precise et CORRIGE le 03/08 (19h30): ce n'est pas seulement
  que l'edge cache nos propres commentaires, LE TOKEN ECRIT LES COMMENTAIRES MAIS
  NE LES LIT PAS. Mesure: /comments rend `data: []` AVEC des curseurs de paging
  valides (donc il y a bien des lignes, filtrees a la sortie), et un commentaire
  interroge PAR SON ID rend `{}`, y compris nos propres seeds, dont l'id est au
  registre. Le compte est bien un BUSINESS et le token est valide (`me` repond).
  Il manque la capacite de lecture des commentaires; seul Hasan peut re-autoriser
  le token. En attendant, `engage.mjs recent` compare desormais tout seul
  comments_count au registre et imprime "⚠ N comment(s) the API did not return"
  (fonction `unreadableComments`, couverte par un test): ne re-diagnostique pas ca
  a la main, lis la ligne. Le 03/08 elle a trouve 1 commentaire d'inconnu sur le
  Reel MacBook Air, le mieux distribue du compte, impossible a lire ni a repondre.
  Note aussi: le token est un token Instagram Login, donc graph.facebook.com
  repond "Cannot parse access token"; tout passe par graph.instagram.com.
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
  Ajout 02/08: sur un responsable politique, la requete au nom nu sort une
  photo VRAIE mais hors ton, et le premier candidat part au build. "keith
  ellison" met en tete une poignee de main a la Farm Fest sous une banderole
  "BEEF, IT'S WHAT'S FOR DINNER" (8.0), inutilisable sur une actu de loi;
  "keith ellison official portrait" met en tete le portrait officiel, fond bleu
  et drapeau, meme score. Ajoute "official portrait" a la requete des elus.
  Nuance 03/08: le qualificatif peut rendre ZERO candidat la ou le nom nu
  marche. "sergey lagodinsky official portrait" ne renvoie rien; "sergey
  lagodinsky" sort en 2e un crop Commons 2729x3328 deja en portrait, cadre
  poitrine au Parlement europeen, parfait en 9:16. Lance donc les DEUX
  requetes et regarde: une requete qualifiee vide ne prouve pas qu'il n'y a
  pas de photo. Sur un elu peu photographie, le candidat "(cropped)" de
  Commons est souvent deja en portrait, MAIS c'est aussi un re-televersement
  minuscule une fois sur deux: CORRECTION 04/08, "Rep. Julie Fedorchak official
  photo, 119th Congress (cropped)" fait 228x305 sur Commons. Il s'affichait
  1600x2140 dans `candidates` parce que l'API MediaWiki renvoie la largeur
  DEMANDEE (iiurlwidth=1600) meme quand elle sert l'original intact
  (utm_content=thumbnail_unscaled), donc il echappait au malus width<900 et
  sortait PREMIER. Corrige dans imagery.mjs (servedSize + test): la taille
  annoncee est desormais min(thumb, original). Le classement est donc fiable,
  mais regarde quand meme la taille avant d'epingler un "(cropped)".
  Verifie aussi l'identite a l'oeil: "erin maye quade 2018" (5.0) ne ressemble
  pas aux photos de la senatrice, beat abandonne plutot que de nommer la
  mauvaise personne. Mesure 01/08 aussi: AUCUNE photo documentaire de datacenter n'est atteignable
  ici ("data center server hall" 0 candidat, "data center" sort le batiment NSA
  d'Utah, "server room rack" des salles bleues rawpixel). N'y passe pas de temps.
  Ajout 06/08 (10h30), dossier Google DeepMind: certains noms tres connus n'ont
  AUCUNE photo libre atteignable ici. Zero candidat pour "demis hassabis",
  "hassabis", "demis hassabis official portrait", "koray kavukcuoglu", "oriol
  vinyals", "google deepmind london office". Et "quoc le" est le piege du
  homonyme en pire: les deux premiers candidats sont l'ile de Phu Quoc au
  Vietnam (7.0). Repondent bien: "jeff dean google" (1768x1326 reel, CC BY 3.0
  Purdue Engineering, il parle devant une slide "Machine Learning" + "Google",
  parfait), "sundar pichai" (plusieurs, dont un 1656x2184 deja en portrait) et
  "googleplex sign" (1600x1200, domaine public). Donc sur une actu de
  dirigeants, teste les visages AVANT d'ecrire les beats: le script doit nommer
  en premier la personne dont tu as le portrait, sinon le spectateur attribue le
  visage au nom prononce.
  Ajout 06/08 (19h30), dossier passage de relais Google, trois requetes qui
  marchent du premier coup et sont parties au build sans epinglage manuel:
  "jeff dean google" (Purdue Engineering, 1600x1200 reel, CC BY, il parle en
  gros plan devant une slide Google, excellent beat 0), "sundar pichai"
  (portrait Lukasz Kobus / Commission europeenne, CC BY, DEJA en portrait,
  drapeau UE derriere, identite verifiee a l'oeil) et "googleplex sign"
  (domaine public). Donc sur une actu de dirigeants Google, Dean/Pichai/le
  panneau sont disponibles la ou Hassabis, Koray et Vinyals ne le sont pas
  (mesure du 06/08 10h30 ci-dessus): construis le script autour des visages
  que tu as. Mesure aussi ce soir pour le dossier WeatherNext mis en revisit:
  l'imagerie de cyclones est ABONDANTE et en domaine public, "hurricane
  satellite" sort du 4200x5400 CC0 (Kirk 2024) et "hurricane melissa" sort
  quatre vues CIRA 2025-10-26 dont une intitulee "Rapid Intensification of
  Hurricane Melissa", soit exactement la phrase que raconte l'histoire.
  Confirme et etendu 07/08 (10h30), quatre requetes qui rendent QUATRE images
  DISTINCTES, toutes reelles et en domaine public (le moteur prend le premier
  candidat, donc une requete par beat sinon tu recuperes deux fois la meme):
  "hurricane melissa" -> Light Fades on a Powerful Hurricane Melissa (CIRA,
  1600x1067), "hurricane melissa jamaica" -> Hurricane Melissa Crosses Jamaica
  (CIRA 2025-10-28), "hurricane melissa sunset" -> A Stunning View of Hurricane
  Melissa as the Sun Sets, "jamaica hurricane relief" -> livraison d'aide
  Ghana/US en Jamaique (1600x1065, de vrais visages, autre famille visuelle).
  Toutes en 1600 de large et en paysage: le crop 9:16 remonte donc en x1,8,
  acceptable mais pas net; si un beat 0 doit etre parfait, cherche l'original
  Commons haute resolution avant d'epingler. Regle generale utile: sur une
  catastrophe naturelle, l'imagerie satellite NOAA/CIRA est en domaine public
  et nomme souvent l'evenement exact que raconte le script.
  Ajout 08/08 (06h30), DEUX PIEGES DE `photo` QU'AUCUN FILTRE NE VOIT, les deux
  attrapes en REGARDANT la planche-contact, pas en lisant le classement.
  (1) UNE ILLUSTRATION N'EST PAS UNE PHOTO: "bacteriophage" sort en 2e
  "Bacteriophage T4 Infection" de DavidGoodsell, qui est une AQUARELLE
  scientifique. Licence, taille et filtre fond-blanc la laissent passer, et un
  beat `photo` doit etre documentaire. Ecarte a l'auteur/au titre: Goodsell,
  openstax.org, "diagram", "cycle", "replication". Le bon candidat est
  "Bacteriophage P2" (Mostafa Fatehi, CC BY, 2304x2944, vraie micrographie MET),
  MAIS il porte une bande d'annotations gravee en bas ("100 nm", "HV=80kV",
  "(c) Mostafa Fatehi") pile ou vont le karaoke et le credit du moteur:
  `crop=1487:2644:408:0` la coupe et garde les 7 phages. (2) UNE PHOTO DE
  PRODUIT GRAVE UNE MARQUE DANS TON SUJET: "antibiotic pills" met en tete (8.0,
  1920x2560, deja en portrait) une plaquette Augmentin ou se lisent
  "GlaxoSmithKline" et "EXP: 11 2012". Sur une actu qui ne parle ni de GSK ni de
  2012, c'est une association fausse et une date qui vieillit le Reel; prends le
  generique sans marque (rawpixel "fraddiction_antibiotic_capsule_care", CC0,
  plaquettes colorees), en sachant que rawpixel plafonne a 1024 px. Re-confirme
  aussi, et c'est la 3e fois: les ex aequo a 7.0 se reordonnent D'UN APPEL A
  L'AUTRE ("escherichia coli microscope" a rendu la micrographie USDA en 3e puis
  en 1re en 20 min). Donc un SCOUT a interet a telecharger, regarder en hstack,
  recadrer en 9:16 et epingler file+credit: ca coute 0 $, ca supprime la derive
  pour le run de publication 10 h plus tard, et c'est la seule facon de voir une
  aquarelle ou une marque. Valeurs sures de ce dossier: "E coli at 10000x,
  original" (Erbe/Pooley USDA, domaine public, 2598x1889, tres contraste) et
  "US Navy 020913-N-3986D-001 Growing bacteria in a petri dish" (domaine public,
  1500x2100, DEJA en portrait, et c'est un vrai VISAGE de technicien, rare sur
  une histoire de labo).
  Ajout 09/08 (06h30): n'interroge PAS commons.wikimedia.org/w/api.php en
  boucle depuis le conteneur, il rend "You are making too many requests to the
  API" en texte brut (donc un JSON.parse qui explose, pas un 429 lisible).
  Passe par `searchOpenverse`/`searchCommons` + `creditLine` de imagery.mjs,
  qui sont exportes, et espace les appels; c'est le chemin qui rend deja
  createur + licence. Valeurs sures mesurees ce jour-la, toutes contemporaines,
  sans marque lisible ni date gravee, recadrees 9:16 et epinglees: "A messy
  network server room showing wires, patch panels" (Moses Cursor Ssebunya, CC0,
  1542x2048, DEJA en portrait, crop=1152:2048:195:0), "Front of server racks at
  NERSC" (Derrick Coetzee, CC0, 4288x2848, crop=1602:2848:1343:0) et "Sam
  Altman speaking at TED" (Steve Jurvetson, CC BY, 2184x2633). ATTENTION sur ce
  dernier: le crop 9:16 plein cadre donne un PLAN ENTIER assis, visage minuscule
  en haut du cadre, inutilisable en dernier beat; `crop=754:1340:610:60` donne
  un vrai portrait poitrine. Sur un beat qui doit finir sur un visage, recadre
  sur la tete, pas sur l'image.
  Ajout 09/08 (10h30), DEUX PIEGES DE PLUS SUR LES REQUETES DE TELEPHONE, et le
  premier est une famille nouvelle. (1) LE FAUX ASSUME: "person using
  smartphone" met en tete "Headset computer with phone as mouse" (8.0, un
  casque-ordinateur, pas un telephone) et sort en 8e "Abraham Lincoln using a
  smartphone (anachronism)" a 7.0. Une image DELIBEREMENT fabriquee, bien
  licenciee, 0% de blanc, qui passe licence, taille et filtre fond-blanc. Ecarte
  au titre les mots anachronism, parody, mockup, concept, AI-generated. (2) LE
  CADRE 9:16 COUPE LE SUJET DE L'HISTOIRE: sur une photo paysage de quelqu'un
  qui tient un telephone, le telephone est au BORD du cadre, donc le crop 9:16
  centre sur le visage le supprime. Les 3 premiers crops de ce dossier ont donne
  trois personnes qui ne tenaient rien. Genere 2-3 valeurs de x et REGARDE en
  hstack avant d'epingler: le sujet du beat, ce n'est pas la personne, c'est la
  personne AVEC l'objet. (3) Deux requetes differentes peuvent rendre la MEME
  seance photo: "screen time" et "smartphone use at railway station" sortent le
  meme homme en chemise a carreaux (meme banque d'images), donc deux beats
  auraient montre le meme visage. Valeurs sures mesurees, contemporaines, sans
  marque ni date lisible, telephone bien dans le cadre: "Screen time" (Rawpixel,
  CC0, 5000x3334, crop=1875:3334:1400:0), "Elderly woman standing next to a
  window and looking at her phone" (Shixart1985, CC BY, 4912x7360 DEJA EN
  PORTRAIT, crop=4140:7360:772:0, et une femme agee dit "tout le monde" mieux
  qu'une photo de bureau) et "Woman sitting in a chair holding a cup looking at
  a phone" (Shixart1985, CC BY, 5753x3835, crop=2157:3835:2100:0).
  Ajout 03/08: ne "monte" JAMAIS a la main la resolution d'une image rawpixel.
  Openverse sert /editor_1024/<cle>.jpg (1024 px, propre); la MEME cle en
  /image_1300/ rend 1300 px avec le filigrane "rawpixel" en travers du cadre, et
  editor_2048 / image_2000 repondent 404. Mesure sur la photo MacBook Air du
  03/08, filigrane visible sur tout le crop, beat abandonne. Corollaire: une
  source rawpixel plafonne a 1024 px, donc un crop 9:16 y fait 381x678 et
  remonte a 1080x1920 en x2,8, trop mou pour un beat 0. Cherche du portrait
  natif (pd.w.org rend du 1536x2048) ou du Commons haute resolution d'abord.
  Ajout 07/08 (16h30), LE CLASSEMENT OPENVERSE BOUGE DANS LA JOURNEE: le scout
  de 10h30 avait mesure "hurricane melissa sunset" -> "A Stunning View ... as
  the Sun Sets"; a 16h30 la MEME requete rend "Light Fades on a Powerful
  Hurricane Melissa" en tete, soit le meme premier candidat que la requete nue
  "hurricane melissa". Les beats 0 et 7 auraient donc montre LA MEME image. Une
  mesure de classement laissee par un run anterieur, meme du meme jour, ne
  garantit donc rien: relance `candidates` et EPINGLE avec `file`+`credit` des
  que deux beats piochent dans le meme sujet. Piege de ton du meme dossier:
  "jamaica hurricane relief" sort SIX candidats a 7.0 qui sont tous la meme
  ceremonie de drapeaux dans la soute d'un avion (Ghana/US), une photo
  diplomatique et pas du secours; la vraie photo de terrain est
  "-ChefsforJamaica- Providing relief after Hurricane Melissa" (World Central
  Kitchen, CC BY 4.0, 4176x2784, une rue detruite avec de vrais gens), qui note
  6.0 et ne gagne jamais toute seule. Pour telecharger un original Commons,
  PERCENT-ENCODE le nom de fichier: un curl sur un nom brut avec parentheses ou
  virgules rend une page d'erreur de 4 ko que ffprobe refuse ("Invalid data
  found"), ce qui ressemble a une image cassee et n'en est pas une. Et
  `candidates` annonce la taille SERVIE (1600xN): les originaux de ce dossier
  faisaient 1631x1088, 1920x1080 et 4176x2784, donc verifie avant de renoncer a
  un beat 0 pour cause de resolution.
  Ajout 07/08 (19h30), LE CLASSEMENT BOUGE EN 25 MINUTES, pas seulement dans la
  journee, et le prix est un beat gache: "recording studio microphone" mettait
  en tete a 19h44 un Shure SM7 (Commons, CC0, 8.0), et le build de 20h10 a
  ramene sur la MEME requete une regie radio bresilienne sombre en paysage
  (console "BB tech", ecran de playlist en portugais lisible dans le cadre),
  en dernier beat avant l'end-card. Donc si tu lances `candidates` pour DECIDER
  d'un beat photo, epingle dans la foulee avec `file`+`credit`, meme quand une
  seule requete sert un seul beat: le delai entre le repere et le build suffit.
  Deuxieme motif du meme incident: creditLine peut rendre un nom d'auteur
  PERCENT-ENCODE ("Jo%E3o%20Silas · CC0") et il se grave tel quel sur l'image;
  un credit qui contient un % dans le journal est donc a reecrire a la main
  (epinglage `credit`) avant publication. Valeur sure retenue sur une actu
  musique: File:Shure_SM7.jpg, CC0, "The Midnite Wolf", 4032x3024 AVEC rotation
  EXIF (ffprobe annonce du paysage, ffmpeg decode en portrait, donc
  `crop=2268:4032:378:0,scale=1080:1920` passe direct).
  Ajout 08/08 (10h30), TROISIEME occurrence du piege d'EPOQUE, desormais un
  reflexe a avoir sur toute requete de bureau: "open plan office" met en tete
  deux photos NOIR ET BLANC des annees 1940 (rangees de dactylos, salle de
  dessin), vraies, bien licenciees, 0% de blanc, et inutilisables sur une actu
  2026. Meme famille que le module CDC 7600 et la GeForce de 2006: seule la
  planche-contact le voit. Valeurs sures mesurees ce jour-la, toutes
  contemporaines et CC0: "Lone office worker (Unsplash)" (Jadon Barnes xjadonx,
  plateau moderne presque vide), et cote stocksnap "Team Meeting" (Startup Stock
  Photos), "Man Laptop" (Kristin Hardwick), "Accounting Finance" (Wilfred Iven,
  tableur + calculatrice) et "Calculator Numbers" (Negative Space, graphique
  imprime). ET pour retrouver le credit d'une image stocksnap: son id de CDN
  (KSLK5TYFZI) ne se cherche PAS dans api.openverse.org, il rend 0 resultat.
  Relance la requete D'ORIGINE avec &source=stocksnap et cherche l'id dans le
  JSON: c'est le seul chemin qui rend creator + licence.
  Ajout 08/08 (10h37, run B), LE PIEGE D'EPOQUE EST AUSSI DANS L'ECRAN, pas
  seulement dans l'objet: "Accounting Finance" (Wilfred Iven, CC0), epinglee le
  matin meme comme valeur sure, montre un logiciel de FACTURATION POLONAIS dont
  l'ecran porte, LISIBLES une fois rendu en 9:16, les dates 03-11-2014 /
  05-11-2014 / 02-04-2015 et le nom d'une vraie personne ("Dariusz Bankowski").
  Meme famille que la plaquette Augmentin (marque + peremption 2012): une date
  qui vieillit le Reel et un inconnu nomme, graves dans le sujet, sur une actu
  2026 dont le script dit "tableau de bord" (et un logiciel de facturation n'est
  pas un tableau de bord). Classement, licence, taille et filtre fond-blanc la
  laissent passer. SEULE la frame RENDUE le montre: une vignette de planche-
  contact a 420 px ne suffit pas, il faut lire le beat en pleine resolution.
  Remplacante mesuree, gatee et rendue du premier coup: Commons "Analytics graphs
  on a MacBook screen" (Luis Llerena, CC0, ORIGINAL 5472x3648, un graphe qui monte
  + un camembert, aucun nom, aucune date), `crop=2052:3648:2100:0` puis
  scale 1080:1920. Garde le bord du portable dans le cadre: le crop serre sur
  l'ecran seul supprime la profondeur de champ et le beat se met a ressembler a
  une seconde capture d'ecran a cote du recu. ET pour REGARDER un candidat
  stocksnap: son CDN (cdn.stocksnap.io/img-thumbs/960w/<id>.jpg) rend du NON-JPEG
  en curl (ffprobe: 0,0), donc passe par la page Openverse; les originaux Commons
  se telechargent nus sans probleme.
  Ajout 08/08 (19h30), QUATRIEME piege d'epoque ET un type nouveau, dossier
  centrales a gaz. (1) L'epoque, encore: "gas turbine power" met en tete TROIS
  vues de la Rover JET 1 de 1950 exposee au Science Museum (CC0, 5472x3648,
  0% de blanc) sur une actu de centrales electriques 2026. (2) LE TYPE
  NOUVEAU, qu'aucun filtre ne voit: UNE CARTE N'EST PAS UNE PHOTO. "natural
  gas power plant" met PREMIER (8.0, 8909x4958) "Natural gas power plants in
  the United States", qui est un PNG de cartographie, et "semiconductor wafer
  fab" met en tete "US Semiconductor Economy", une infographie. Licence,
  taille et filtre fond-blanc les laissent passer; seule la planche-contact le
  montre. Ecarte au titre les mots map, economy, statistics, chart, et
  mefie-toi de tout .webp/.png de Commons. Valeurs sures mesurees, toutes
  contemporaines, sans texte ni marque, deja recadrees en 9:16 et epinglees:
  "thomas c ferguson power plant texas" rend TROIS angles distincts de la meme
  vraie centrale texane (Larry D. Moore, CC BY 4.0, 3556x2000,
  crop=1125:2000 centre sur les cheminees) et "decker creek power station" une
  quatrieme (meme auteur, 2667x1500, crop=844:1500:911:0). Regle generale sur
  une actu d'energie: cherche une centrale NOMMEE, jamais la categorie. La
  requete generique rend une carte, le nom rend une photo.
  Ajout 10/08 (06h30), dossier centrale a gaz Amazon: la regle ci-dessus se
  re-confirme, et voici QUATRE requetes mortes a ne pas retenter. "power plant
  smokestacks texas" rend 0 candidat; "west texas desert landscape" sort les
  Carlsbad Caverns (qui sont au Nouveau-Mexique) et des releves HAER des annees
  1930; "pecos county texas" sort DEUX SERPENTS en tete a 8.0 (Trans-Pecos
  Copperhead, Black-headed Snake); "bulldozer clearing land" rend les archives
  du Queensland de 1950, 720 px, piege d'epoque pour la 5e fois. Il ne reste que
  les centrales NOMMEES, et elles suffisent a 3 beats: "thomas c ferguson power
  plant texas" (3 angles distincts, Larry D. Moore, CC BY, 3556x2000) et "decker
  creek power station" (meme auteur, 2667x1500). Crops 9:16 mesures, regardes en
  planche-contact et epingles file+credit ce jour-la: Ferguson B
  crop=1125:2000:1215:0, Ferguson C crop=1125:2000:1465:0, Decker
  crop=844:1500:778:0. DETAIL QUI CHOISIT LE BEAT: le cadre de Decker Creek
  porte des LIGNES A HAUTE TENSION et un poste electrique en travers, donc c'est
  lui le beat "raccordement au reseau"; les trois Ferguson n'en ont aucune et
  servent les beats "la centrale elle-meme". Aucune des quatre ne porte de
  marque lisible ni de date gravee.
  Ajout 10/08 (10h30), UN PIEGE DE TELECHARGEMENT NOUVEAU, a connaitre avant de
  soupconner une image cassee: upload.wikimedia.org LIMITE LE DEBIT sur les
  ORIGINAUX quand l'UA est "Mozilla/5.0". Il rend alors une page HTML de 2 ko
  ("Too many requests - please contact noc@wikimedia.org") ecrite dans ton
  fichier .jpg, et ffprobe repond "No JPEG data found" / "0,0", ce qui ressemble
  exactement a un original corrompu. Remede mesure: un UA descriptif
  ("OrderOfMagnitudeBot/1.0 (contact: ...)") + 5 s d'attente, et le meme
  original arrive entier (7,3 Mo). Meme famille que la limite de l'API
  MediaWiki du 09/08, mais c'est l'hote de FICHIERS et ca frappe les originaux.
  Verifie toujours `head -c 200` avant de conclure a une image morte.
  Requetes mortes ou pieges mesures ce jour-la, dossier salle de sport:
  "melbourne street" sort une rangee de maisons BRITANNIQUES (la rue s'appelle
  Melbourne Street, homonyme, meme famille que Phu Quoc le 06/08) - il FAUT
  "melbourne skyline" ou "melbourne australia"; "group fitness class" met en
  tete TROIS statuettes en bronze d'Osiris a 8.0; "gym fitness class" sort le
  piege d'epoque pour la 6e fois ("Business-men's class (1916)"); et le candidat
  le plus NET du lot est inutilisable au recadrage, "US Navy ... spin cycle class
  aboard the aircraft carrier USS Carl Vinson" (4288x2848) laisse lire "NAVY" sur
  un short et "BLOODHOUNDS" sur un carenage d'avion, soit un hangar militaire sur
  une actu de salle de sport de quartier (famille du blister Augmentin du 08/08).
  Valeurs sures pinnees ce jour-la, regardees en planche-contact: "Ederle Gym
  Spin Cycle Class Photo 2" (Pfc. Trinity Carter, domaine public, 1600x894,
  crop=509:905:300:0, une silhouette unique sur un velo en lumiere orange/bleue,
  zero texte lisible; l'original ne fait que 1600 px donc le 9:16 remonte en
  x2,1, acceptable SEULEMENT parce que c'est une silhouette), "Melbourne skyline
  on 14 September 2013" (David Wallace, CC BY, 5184x3456, crop=1944:3456:1600:0,
  aerienne dense, l'aile de l'avion est hors cadre a ce x) et re-confirmation de
  "Woman sitting in a chair holding a cup looking at a phone" (Shixart1985,
  CC BY, crop=2157:3835:2100:0 du 09/08, telephone bien dans le cadre).
- 2026-08-02 · La fenetre de mots BOUGE PENDANT le run: un script ecrit au
  PLAFOND peut devenir invalide entre deux builds. Le registre disait 3,704
  mots/s (12 lectures), les 3 lectures du jour sont revenues a 3,54 / 3,52 /
  3,22. atempo clampe a 1,12, fichier a 65,5 s, build refuse APRES paiement des
  3 narrations ($0,097), message "only -2.47s left for the end-card". Ces 3
  lectures sont ecrites dans state/voice-rate.jsonl au passage, donc relancer
  `node src/validate.mjs window` juste apres donne une AUTRE fenetre (194-222 ->
  185-212) et le script de 220 mots etait alors au-dessus du plafond. DONC:
  ecris a la CIBLE imprimee, jamais au plafond (a la cible l'atempo vaut ~1,0 et
  absorbe une lecture lente; au plafond il part deja a 1,12 et la moindre
  lenteur casse le build), et relance `window` apres tout build echoue AVANT de
  reecrire. Et epingle avec `file` tout ce qui est deja sur le disque
  (shot_N.png, photo_N.jpg) avant de relancer: le 2e build n'a rachete qu'une
  narration ($0,03) au lieu de toutes les images. Proof: run 15h 02/08.
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
  et voice_ab du 31/07. Ajout 08/08 (16h30), PRIX VEO MESURE: un clip de 8 s en
  1080p a coute $0,96, pas les ~$0,60 de moyenne annonces sur les six premiers.
  Budgete $1 pour un beat 0 anime, pas $0,60. En sens inverse, la ligne la moins
  chere du budget est un SCOUT QUI EPINGLE: le Reel virus a coute $1,02 EN TOUT
  (2 narrations $0,060 + veo $0,96) parce que ses 4 photos etaient deja
  telechargees, recadrees et epinglees file+credit par le run de 06h30, et que
  ses 2 recus et sa carte sont gratuits. Zero still generee achetee. Un scout qui
  epingle supprime a la fois ~$0,50 de stills et la derive de classement
  Openverse mesuree le 07/08.
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
  CORRECTION 02/08 (19h30): la relecture se fait en fenetres de 12 s, pas de 20.
  A 20 s la derive survit et avale des beats entiers. Meme fichier, une seule
  narration payee, trois decodages: fichier entier 86 tokens/35%, fenetres 20 s
  139/59% (SOUS le plancher, build refuse apres paiement), fenetres 12 s
  193/82%. Corrige dans reel2.mjs (windowedScript) + test. Donc si un build
  meurt encore a l'alignement, ce n'est plus la longueur de fenetre: verifie
  d'abord que la DUREE de la lecture correspond au nombre de mots (200 mots a
  3,32 mots/s = 60,2 s), ce qui prouve en 5 secondes que la voix a tout lu et
  que c'est le transcripteur qui derive.
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
  Ajout 01/08 (14h), deux causes de plus, les DEUX corrigees dans reel2.mjs.
  (1) La banniere de consentement peut etre dans une IFRAME: page.locator() ne
  cherche que la frame principale, donc the-decoder.com a rendu un mur RGPD
  plein cadre en beat 0 (l'audition ET la vignette). Le moteur clique
  desormais dans page.frames() puis supprime tout overlay fixed/sticky de plus
  de 350px. (2) Une URL qui sert du text/plain ne se capture PAS:
  raw.githubusercontent.com/.../README.md a fige le build 26 min (Playwright
  attend un rendu qui n'arrive jamais, puis "Target page has been closed").
  Pour montrer un depot, il n'y a pas de recu joignable ici (github.com est
  403 via le proxy): prends une `card`.
  Ajout 02/08 (19h30): blog.google passe encore a travers, sa banniere cookies
  ("uses cookies from Google" + bouton "OK, got it") occupe le bas du recu et
  elle a survecu au clic dans les frames et au retrait des overlays. Le recu
  etait le beat 0, donc l'audition ET la vignette. Remede en 10 s, gratuit,
  sans relancer la capture: le shot fait 1290x2796 et la banniere commence a
  y=2293, soit exactement le 9:16 du haut, donc
  `ffmpeg -i shot_0.png -vf "crop=1290:2293:0:0" shot_0.png` puis epingler avec
  `file`. REGARDE tes shot_N.png avant de construire, pas seulement apres.
  Ajout 03/08 (12h): UN DOMAINE PEUT SE GATER VERT ET RESTER INCAPTURABLE, ce sont
  deux chemins reseau differents. macrumors.com rend ses 8 citations VERIFIED
  (fetch Node de validate.mjs) et rend au navigateur un mur Cloudflare
  "forums.macrumors / Performing security verification / Verify you are human":
  vu sur 3 captures, dont une hors moteur avec 6 rechargements et attente longue,
  ou le titre de l'article revient bien puis la page se re-challenge avant le
  screenshot. Ne perds pas de temps a le contourner. Reflexe: si le recu d'un
  domaine sort un mur, cherche un QUATRIEME media joignable qui porte la meme
  affirmation et ajoute-le en source (engadget.com se capture proprement, titre
  + signature + photo, du premier coup). Et epingle d'abord tout ce qui est deja
  achete (veo_0.mp4 a 0,96 $ ici): les 2 rebuilds n'ont alors coute 0 $.
  Ajout 04/08 (11h): cbsnews.com pareil en pire, gate 16/16 VERIFIED mais la
  capture rend un blanc de 14,8 ko DEUX fois (octets identiques) et un
  navigateur direct prend ERR_CONNECTION_RESET, AMP compris; thehill.com se
  capture mais rend un mur "Press & Hold to confirm you are a human". Quand
  AUCUN media joignable ne porte l'histoire (verifie via les RSS des
  redactions, pas Google News: ses liens rss/articles sont opaques et les flux
  NBC/Fox ont des <link> desappaires), la photo documentaire du sujet remplace
  le recu (ici: Unitree G1 en beat 2, Maison-Blanche Commons en beat 3,
  recadree 9:16 a la main + file/credit). technologyreview.com se capture
  proprement du premier coup.
  Ajout 04/08 (16h): cnbc.com est le MEME piege que macrumors, mesure au frame
  check: le gate le lit (fetch Node 200, 8/8 VERIFIED) mais le navigateur recoit
  un mur Akamai "Access Denied" plein cadre, deux builds de suite. Remplacement
  mesure: thenextweb.com repond 200 au fetch gate, porte les chiffres CNBC
  verbatim, et se capture proprement du premier coup (titre TNW + chapo).
  Ajout 05/08: waymo.com/blog (pages /shorts/) est le meme piege que
  blog.google en pire: banniere cookies Google en bas ET la capture s'ouvre
  sur le masthead du blog (Waypoint, Topic, Search blog), le titre de
  l'article est SOUS le pli et n'apparait pas du tout. Le recu utile est le
  bloc hero WAYMO + ville en bas de la capture: recadre
  (`crop=1290:893:0:1400` le 05/08) et epingle avec `file`. Un recadrage qui
  garde le HAUT de cette capture donne un recu 100% plomberie qui passe tous
  les controles.
  Ajout 03/08 (17h): euronews.com a rendu une page BLANCHE (14 ko) tenue 7,3 s
  en beat 5. Cause: son CMP (bouton "Agree and close") monte TARD, donc a 2,5 s
  il n'y avait rien a cliquer ni a retirer, et le modal blanc couvrait l'article
  au moment de la capture. Une page blanche accuse un CMP lent, pas un domaine
  bloque. CORRIGE dans reel2.mjs: la passe de consentement se fait maintenant
  DEUX fois, la seconde 2 s plus tard (un clic qui ne trouve rien ne coute
  rien). Ne PAS elargir le retrait d'overlays pour ce cas: en ajoutant
  iframe/[class*=player]/aside a la liste, la page est revenue blanche a
  nouveau, le conteneur d'article y passe. Et euronews garde une pub Invesco en
  bas a droite: recadrer `crop=1290:1800:0:0` garde titre + signature + chapo.
  Ajout 06/08 (10h30), CORRIGE le "un clic qui ne trouve rien ne coute rien"
  ci-dessus: c'est FAUX, et le cout est en O(frames). La passe essaie les 6
  CONSENT_SELECTORS dans CHAQUE page.frames(), deux fois, avec un timeout de
  1,2 s par selecteur qui ne trouve rien. Sur une page bourree d'iframes de
  regie ca domine tout le reste du build. Mesure: techcrunch.com rend 36 frames
  (donc 36 x 6 x 1,2 s x 2 = ~8,6 min pour UN recu, et il MEURT en route:
  "Target page, context or browser has been closed", aucun fichier ecrit),
  9to5google.com n'a pas fini en 10 min sur deux essais, blog.google se capture
  en ~40 s et discoveryloop.com en 20,5 s avec 1 SEULE frame. La correlation
  frames/duree est nette dans les deux sens. Donc un recu lent
  n'accuse NI le domaine NI le reseau: compte les frames avant de conclure
  (`page.frames().length` juste apres le goto). Et budgetise-le comme un achat:
  deux recus lourds ajoutent ~15 min a un build, ce qui suffit a expliquer une
  mort a l'assemblage. Quand le plan le permet, prends un recu leger (le blog du
  primaire) + des photos Commons reelles plutot que trois recus de presse. Le
  meilleur recu leger sur une actu d'entreprise, c'est le SITE DE L'ENTREPRISE:
  discoveryloop.com rend son nom + sa mission en pleine page, 0 pub, 0 mur de
  cookies, et c'est le primaire.
  Re-confirme ce jour-la: blog.google garde sa banniere cookies en bas et
  `crop=1290:2293:0:0` la coupe pile, en laissant titre + chapo + les deux
  signatures (c'etait le recu ideal: il imprime "Demis Hassabis / Chair, Google
  DeepMind and Chief Scientist, Alphabet").
  Ajout 06/08 (16h30), dossier AISI, trois recus mesures EN MOTEUR: aisi.gov.uk
  se capture en ~1 min et `crop=1290:2293:0:0` coupe pile la banniere cookies
  (la mesure hors moteur du scout de 06h30 a tenu telle quelle en moteur).
  csoonline.com se capture proprement du PREMIER coup en ~1 min, sans recadrage:
  logo CSO + signature + titre + date + chapo, 0 pub. aljazeera.com se capture
  mais a pris ~8,5 MIN pour ce seul recu (meme famille O(frames) que techcrunch,
  sauf qu'il SURVIT au lieu de mourir): ne le declare pas mort avant ~10 min, et
  budgetise-le comme un achat. Il garde en bas un mur de confidentialite plein
  cadre ("You rely on Al Jazeera for truth and transparency" + Allow all /
  Reject all) qui survit aux deux passes de consentement; `crop=1290:2200:0:0`
  le coupe et laisse logo + titre + chapo. Sur ce dossier le chapo d'aljazeera
  portait a lui seul l'attribution ("AI Security Institute says Mythos 5
  attempted to insert malicious code..."), donc le recadrage n'est pas cosmetique,
  c'est ce qui garde la preuve dans le cadre.
  Ajout 06/08 (19h30), re-confirme EN MOTEUR sur blog.google: la capture sort
  en ~20 s (1 seule frame utile), la banniere cookies est toujours en bas, et
  `crop=1290:2250:0:0` la coupe avec de la marge tout en gardant logo Google,
  titre, "5 min read" et LES DEUX signatures ("Demis Hassabis / Chair, Google
  DeepMind and Chief Scientist, Alphabet") plus l'editor's note qui nomme
  Koray. discoveryloop.com se capture propre du premier coup, 0 pub, 0 mur.
  Ajout 07/08 (16h30): deepmind.google/blog SE CAPTURE PROPREMENT EN MOTEUR, du
  premier coup et sans recadrage, sur deux pages article differentes du meme
  build: logo "Google DeepMind", date, titre entier sur 3-4 lignes, signature
  "WeatherNext team" et le visuel de tete dans le cadre, 0 pub, AUCUNE banniere
  cookies. C'est donc l'exception utile dans la famille Google: blog.google
  garde toujours sa banniere en bas et exige `crop=1290:2293:0:0`,
  deepmind.google n'a besoin de rien. Sur une actu DeepMind, deux recus du blog
  du labo coutent moins cher en temps qu'un seul recu de presse.
  Ajout 07/08 (19h30), dossier Suno, trois recus mesures EN MOTEUR:
  suno.com/blog se capture proprement du PREMIER coup en ~45 s, sans recadrage
  (titre, signature "By Mikey Shulman, Co-Founder & CEO", date, photo de tete),
  0 pub, 0 banniere cookies. Sur une actu d'entreprise le blog de la boite
  reste le recu le plus leger, ca se re-confirme. engadget.com pareil, ~1 min,
  sans recadrage (titre + chapo + signature + date). gizmodo.com est le piege du
  jour et il est DOUBLE: (1) il a pris ~11,5 MIN pour ce seul recu, famille
  O(frames) comme techcrunch/aljazeera, donc budgetise-le comme un achat et ne
  le declare pas mort avant ~12 min; (2) sa capture porte DEUX plomberies a la
  fois, une pub voiture flottante avec sa croix de fermeture posee SUR l'image
  de tete, et la banniere bleue "About Cookies on this Site" en bas, et aucune des
  deux n'est retiree par les deux passes de consentement. `crop=1290:1490:0:0`
  coupe les deux et garde chapeau "ARTIFICIAL INTELLIGENCE" + titre + chapo +
  "BY <auteur>" + date. Le recadrage n'est pas cosmetique: la pub etait visible
  en plein cadre sur le rendu et passe tous les controles automatiques.
  Ajout 09/08 (16h30), DEUX RECUS LEGERS DE PLUS, mesures EN MOTEUR sur le
  dossier ChatGPT gratuit, les deux propres DU PREMIER COUP et sans recadrage:
  unite.ai (~1 min) rend rubrique + titre entier sur 3 lignes + signature + date
  + chapo + image de tete, 0 pub, AUCUNE banniere cookies; testingcatalog.com
  pareil et encore plus leger (le scout de 10h30 l'avait predit sur le critere
  O(frames) du 06/08: petit site, peu d'iframes, et ca se confirme en moteur).
  Sur une actu OpenAI, ces deux-la sont donc les recus a prendre, le primaire
  openai.com etant 403. UN BEMOL A REGARDER, pas bloquant: la signature de
  testingcatalog affiche "Erin | AI Agent", donc le recu montre un article
  ecrit par une IA sur un compte dont la promesse est l'inverse; c'est en bas
  de carte et minuscule au rendu, mais si le beat cadre plus bas, prends
  unite.ai.
  Ajout 09/08 (19h30), DEUX PIEGES DE RECU, dont un TYPE NOUVEAU. (1) UNE PAGE
  D'INDEX SE CAPTURE A UN ENDROIT ARBITRAIRE, ET LE RECU MONTRE ALORS LE MAUVAIS
  SUJET: defcon.org/html/defcon-34/dc-34-speakers.html se gate (200) et se
  capture proprement, mais la capture est tombee sur le resume d'une AUTRE
  conference (un talk Apple Metal/macOS), avec le titre "DEF CON Abstract" en
  tete, donc un recu parfaitement lisible, sans pub ni banniere, qui atteste
  d'une histoire qui n'est pas la notre. Aucun controle automatique ne le voit,
  seul le frame check l'attrape. Sur une page qui liste N elements (programme de
  conference, index, sommaire, page de resultats), ne prends PAS de recu: prends
  la page dediee, ou une autre surface. (2) LE RECU PEUT PORTER UN APPEL AU DON:
  norecognition.org se capture du premier coup en ~20 s (petit site, critere
  O(frames) du 06/08 confirme) mais son bandeau porte "LIVE NOW ON KICKSTARTER"
  + un bouton "Back it now on Kickstarter". Un compte d'info n'a pas a graver un
  bouton de financement dans un Reel: `crop=1290:545:0:255` garde le titre
  "Clothing the cameras cannot see" et la phrase qui nomme le DEF CON, et coupe
  les deux boutons. Meme reflexe que les bannieres cookies: REGARDE le
  shot_N.png avant de construire.
  Ajout 10/08 (16h30), dossier salle de sport, deux recus mesures EN MOTEUR.
  rnz.co.nz se capture PARFAITEMENT du premier coup et vite (petit site, critere
  O(frames) du 06/08): en-tete RNZ, titre entier sur 4 lignes, "10 August 2026",
  la signature "Cam Wilson and Rhiannon Hobbins for ABC News" ET la photo du
  temoin, 0 pub, 0 banniere cookies, aucun recadrage. Bonus editorial: comme la
  signature ABC est DANS le cadre, le recu atteste lui-meme la syndication, ce
  qui est exactement ce qu'il faut montrer quand deux domaines verts ne sont
  qu'un seul reportage. businesstoday.in se capture aussi du premier coup
  (en-tete + fil d'Ariane + titre + chapo lisibles) MAIS garde un emplacement
  publicitaire VIDE, un grand bloc gris marque "ADVERTISEMENT", qui occupe la
  moitie basse de la carte, plus un bouton flottant WhatsApp a droite. Ni l'une
  ni l'autre plomberie n'est retiree par les deux passes de consentement. Ce
  n'est pas bloquant (la preuve tient dans le haut) mais c'est laid: si le beat
  compte, `crop=1290:1500:0:0` garde en-tete + titre + chapo et coupe les deux.
  Ajout 10/08 (19h30), UN RECU PEUT MONTRER UN AUTRE ARTICLE DU MEME SITE, et
  c'est pire que la page d'index du 09/08 parce que l'URL est la BONNE.
  thenextweb.com: le fetch Node de validate.mjs rend bien l'article Amazon (title
  verifie, citations VERIFIED), et le navigateur a capture un TOUT AUTRE article
  TNW ("OpenAI and four rivals just agreed on one standard for AI agents", date
  du 6 aout), avec en-tete, chapo, date et boutons de partage, zero pub, zero
  banniere. Le recu etait donc parfaitement propre et attestait une histoire qui
  n'est pas la notre, sous une voix qui disait "un permis n'est pas une facture".
  Aucun controle automatique ne le voit: le gate FETCH, il ne CAPTURE pas, et le
  COMPLIANT ne lit rien. Seul le frame check l'attrape. Donc sur un recu, ne
  verifie pas seulement que la carte est propre: LIS SON TITRE et compare-le a
  ton histoire. Remplacant mesure le meme soir et meilleur recu que TNW
  (il nomme Amazon, le Texas et le data center, et montre le logo sur le
  batiment): newrepublic.com, masthead THE NEW REPUBLIC + titre entier + chapo +
  signature + date, sans recadrage. MAIS famille O(frames) du 06/08: le PREMIER
  essai est mort ("Target page, context or browser has been closed"), le second
  essai automatique du moteur a reussi, ~5 min au total. Ne le declare pas mort
  au premier echec. Il reste un petit onglet jaune "Most Recent Post" clippe
  derriere le titre, cosmetique.
  Proof: journal 15h 31/07, run 08h 01/08, run 14h 01/08, run 19h30 02/08, run 11h 03/08, run 16h30 03/08, run 10h30 06/08, run 16h30 06/08, run 19h30 07/08, run 16h30 09/08, run 19h30 09/08, run 16h30 10/08.
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
  Ajout 01/08 (16h), le sens INVERSE et il est plus frequent: un NOT_FOUND est
  souvent TA normalisation typographique, pas une reecriture de l'article. Ecrit
  "So we are rolling back" la ou blog.google ecrit "So we're rolling back" avec
  une apostrophe courbe (U+2019): NOT_FOUND immediat, alors que la citation
  voisine sans apostrophe passait VERIFIED du premier coup. Ne recopie jamais
  une citation a la main depuis une lecture a l'ecran: extrais les octets
  exacts d'abord et colle-les. Le repr() Python sur le texte aplati montre
  apostrophes courbes, tirets longs et espaces insecables AVANT qu'ils ne
  coutent un aller-retour de gate (~90 s par citation).
  Ajout 02/08 (10h): extraire avec TON PROPRE aplatissement ne suffit pas, il
  faut celui du gate. Un regex maison garde "Digital Omnibus , which" (l'espace
  avant la virgule vient d'un lien retire) la ou validate.mjs normalise en
  "digital omnibus, which": citation copiee en octets exacts, NOT_FOUND quand
  meme, sur 2 des 18 verifications. Extrais toujours depuis la fonction du
  gate, elle est exportee:
  `node --input-type=module -e "import{flatten}from'./src/validate.mjs';
  const r=await fetch(URL,{headers:{'user-agent':'Mozilla/5.0'}});
  const t=flatten(await r.text());const i=t.indexOf('debut en minuscules');
  console.log(JSON.stringify(t.slice(i,i+400)))"` puis recasse a la main.
  Elle minuscule tout, donc relis la casse; elle seule connait ses
  normalisations.
  Ajout 07/08 (10h30), FAUX POSITIF DU FILTRE D'ACCENTS, non corrige (un run
  n'edite pas le gate): NEVER_UNACCENTED teste /\btres\b/ et le \b de JS est
  ASCII, donc "e accent grave" compte comme une frontiere de mot. Resultat:
  "kilometres" ecrit CORRECTEMENT avec son accent declenche
  "caption: unaccented French: tres". La regle vaut pour toute la liste: tout
  mot francais dont la fin est un de ces radicaux precede d'une lettre accentuee
  se fait refuser a tort (metres, kilometres, ...). Contournement gratuit et
  sans degat editorial: ecris "28 km". Ne reformule PAS a l'aveugle et ne
  soupconne pas ton texte: cherche le radical fautif dans les mots accentues
  d'abord (`grep -iE "\w*tres\w*"`). Proposition de correctif dans le rapport du
  07/08 (ancrer la regex sur des frontieres conscientes des accents).
  Ajout 06/08 (19h30), la variante UNVERIFIABLE de la meme toux reseau: un
  re-gate d'un spec deja PASSED est revenu `ok:false` avec les 19 controles
  en UNVERIFIABLE sur les QUATRE domaines a la fois (blog.google, cnbc,
  9to5google, discoveryloop). Quatre domaines qui tombent ensemble a la
  seconde pres, ce n'est pas quatre articles reecrits, c'est la sortie reseau
  du conteneur. Les deux relances suivantes ont rendu PASSED, 0 erreur. Regle
  generale: un echec de gate EN LOT (tous statuts identiques, tous domaines)
  se relance avant d'etre diagnostique; c'est un echec SELECTIF (une citation,
  un domaine) qui accuse vraiment le texte.
  Ajout 08/08 (19h30), LA VIRGULE DECIMALE FRANCAISE NE MATCHE PAS LE POINT DE
  LA SOURCE, mesure sur 3 chiffres d'un coup. Ecrit "16,8 milliards" / "6,5
  millions" / "2,8 milliards" la ou les sources ecrivent "$16.8 billion" /
  "6.5 million" / "$2.8 billion": le gate a repondu "figure(s) 168, 65, 28
  appear in the caption but in no evidence quote". Il traite donc la virgule
  comme un separateur de MILLIERS et la supprime (16,8 -> 168), alors que le
  point de la source reste une frontiere. Le manuel dit "the gate matches
  digits across separators"; c'est vrai des espaces et des virgules de
  milliers, FAUX de la virgule decimale. Deux remedes, les deux gratuits:
  dans la legende ecris le chiffre comme la source (16.8, 6.5, 2.8), ce que
  le manuel demande deja ("never re-punctuate a decimal"); dans le SCRIPT
  PARLE ecris-le en toutes lettres ("six millions et demi", "deux virgule
  huit milliards"), ce qui supprime aussi le risque que la TTS lise "6.5" a
  l'anglaise. Meme famille: un nom de media contenant un chiffre est lu comme
  un chiffre ("ABC13" a declenche "figure 13 in no evidence quote"), et une
  date en clair dans un `kicker` aussi ("6 aout 2026" -> figure 6). Ecris
  "La chaine locale de Houston" et un kicker sans millesime.
