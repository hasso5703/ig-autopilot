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
  revisit sans une ligne d'ecrite. Ajout 10/08 (21h36): huggingface.co (pages
  blog) rend 200 au fetch gate et se gate du premier coup (2 citations, dossier
  Muse Glimmer); techcrunch.com re-confirme le meme soir. Et la syndication
  ramaonhealthcare.com rend 200 mais TRONQUE au teaser (2 paragraphes puis
  "Continue Reading" vers VentureBeat): inutilisable pour gater les chiffres
  d'un article VB, contrairement a RNZ qui porte l'article ABC entier.
  Ajout 11/08 (10h30), dossier Google/AI Overviews: rendent 200 au fetch gate et
  se gatent du premier coup thewalrus.ca (nouveau, l'essai "AI eats the web" du
  10/08) et malwarebytes.com; the-decoder.com re-confirme (13/13 VERIFIED du
  premier coup). Bloquent au fetch gate: searchengineland.com (403),
  technology.org (403), loc.gov (403). Sur une actu de RESPONSABILITE d'une IA
  (jugement, plainte), les blogs securite (malwarebytes) et the-decoder portent
  la meme decision verbatim et sont une vraie double lecture. ET LE PIEGE
  CORROBORATION DU JOUR, dossier Stanford/Virtual Biotech remis en revisit hier:
  le PRIMAIRE est gatable, pubmed.ncbi.nlm.nih.gov/41808990 rend l'abstract
  entier (55,984 essais, 37,000 agents, cible B7-H3 poumon), MAIS l'angle
  vendeur (Merck a confirme le medicament, breakthrough FDA) est VentureBeat-only
  et VB rend 429 pour le 5e jour d'affilee; il n'est PAS dans le primaire. Sur
  les seuls faits gatables, c'est un preprint sans rien de deploye (veto 3). Un
  primaire vert ne rachete pas un angle ingatable: garde revisit tant que VB ne
  revient pas ou qu'une 2e redaction ne porte pas la confirmation Merck.
  bioRxiv.org rend 429 (comme la fiche du papier). Proof: scout 10h30 11/08.
  Ajout 11/08 (22h, dossier eclipse/retine, hors IA): rendent 200 au fetch gate et
  se gatent du premier coup afastronomie.fr (le primaire francais: date, heure et
  taux d'occultation en France), eclipse.aas.org/eye-safety (la reference mondiale
  de securite oculaire, endossee par l'AAO), aao.org et science.nasa.gov/eclipses/.
  Bloquent: timeanddate.com (403); science.nasa.gov/eclipses/future-eclipses/... rend
  404 (l'index /eclipses/ porte quand meme la phrase de geometrie). SUR UNE ACTU DE
  PAPIER CLINIQUE, PubMed se re-confirme, mais ATTENTION A L'EXTRACTION: sur une fiche
  pubmed, `indexOf('abstract')` tombe sur le CHROME de l'interface (menus "format
  abstract pubmed pmid", ~1400 caracteres de boutons) et pas sur le resume. L'ancre qui
  marche est le DERNIER `format abstract pubmed pmid abstract` (lastIndexOf), ou
  `lastIndexOf('doi:')` pour attraper titre + auteurs + revue. Et pour trouver les pmid
  sans deviner: regex `/(\d{7,8})/"` sur le HTML BRUT de la page de recherche, le
  flatten les supprime. Les 3 fiches PubMed se capturent aussi parfaitement en moteur
  (titre, revue, abstract lisible, 0 pub, 0 banniere), ca re-confirme le 08/08.
  Ajout 12/08 (06h30), dossier reconnaissance faciale metro de Londres: rendent 200
  au fetch gate et se gatent DU PREMIER COUP (18 verifications sur 18, 0 erreur)
  silicon.co.uk, techradar.com, railuk.com et railadvent.co.uk; repondent 200 aussi
  thamesgazette.com, yourharlow.com, uk.news.yahoo.com et bigbrotherwatch.org.uk.
  Bloquent: btp.police.uk (403 sur la page de presse ET sur la page d'info LFR, donc
  le PRIMAIRE d'une actu de police britannique est ingatable), standard.co.uk (403),
  bbc.com (403, re-confirme). PIEGE DE CORROBORATION, famille du 07/08: railuk,
  railadvent, thamesgazette et yourharlow republient tous le MEME communique TfL/BTP,
  donc quatre domaines verts = un seul texte. Les deux vraies lectures sont
  silicon.co.uk (qui lit les journaux de deploiement lui-meme) et techradar (qui les
  credite explicitement a la BBC): le chiffre "530 000 visages, aucune correspondance"
  vient dans les deux cas des logs de la police, pas de deux enquetes. Sur une actu
  d'agence publique britannique, cherche la presse TECHNIQUE (silicon.co.uk) avant la
  presse sectorielle, elle est la seule a porter le bilan chiffre.
  Ajout 12/08 (10h30): venturebeat.com rend 429 au fetch gate pour le SIXIEME jour
  consecutif (07 au 12/08). L'entree du 10/08 disait "quatrieme", celle du 11/08
  "5e": ce n'est plus une limite passagere, c'est l'etat du domaine depuis une
  semaine. Ne planifie AUCUNE histoire dont il est la seule source (perdu ce jour-la:
  l'exclu Grok Bot de SpaceXAI, mise en revisit sans une ligne d'ecrite, x.ai etant
  403 depuis le 31/07). Rendent 200 le meme jour: techcrunch.com et
  technologyreview.com. ET LE PIEGE BLOOMBERG SE RE-CONFIRME (07/08), dossier
  Phia/cookie stuffing: techcrunch rend 200 et porte sa PROPRE declaration de
  l'entreprise, mais l'affirmation porteuse (les fondatrices savaient depuis
  decembre, Slacks fuites) est Bloomberg-only, et Puck est derive aussi. Un article
  joignable qui contient une citation exclusive ne rend pas gatable l'affirmation
  CENTRALE qu'il emprunte: lis QUI a rapporte quoi dans le corps avant de scorer.
  Ajout 12/08 (16h30), dossier Pixel Watch 5: rendent 200 au fetch gate et se gatent
  DU PREMIER COUP (13 verifications sur 13, 0 erreur) blog.google, techcrunch.com et
  9to5google.com (nouveau). Bloquent le meme jour: cnet.com (403), theverge.com (403),
  arstechnica.com (403), engadget.com (404 sur une URL devinee). ET LE REFLEXE QUI
  TROUVE LE PRIMAIRE EN 30 SECONDES, generalisable a tout blog.google: les pages
  d'index (/products/pixel/, /products-and-platforms/devices/pixel/) sont rendues en
  JS et une extraction de liens n'en sort RIEN d'utile, mais le flux
  <index>/rss/ rend 200 et porte les URL de toutes les annonces du jour, y compris
  celles rangees sous une autre rubrique (le billet sante etait sous
  /products/google-health/, pas sous /devices/pixel/). Va au RSS de la famille produit
  avant de deviner une URL. CORRECTION du 06/08 sur la banniere cookies: le billet
  blog.google s'est capture PARFAITEMENT en moteur, titre + chapo + date + "4 min read"
  dans le cadre 9:16, zero banniere, zero recadrage. Le piege cookies vise aisi.gov.uk,
  pas blog.google en general. techcrunch.com se capture proprement aussi (titre,
  signature, date). Et sur une annonce produit, les notes de bas de page du primaire
  valent l'article: c'est la que Google ecrit que ses mesures ne sont "not a prescreener
  for diabetes and hypertension" et que la detection d'urgence "has not been cleared or
  evaluated by the FDA". Le retournement du Reel etait entierement dans les footnotes.
  Ajout 13/08 (06h30), LE DOMAINE QUI REPOND 200 PUIS 403 AU HASARD, et c'est un
  piege different du 403 franc: theregister.com a rendu 200 puis 403 sur QUATRE
  fetchs gate consecutifs (3 x 403, 1 x 200, mesure directe), et son texte aplati
  ne fait que 9,3 ko avec le corps entrecoupe de blocs promo. Un spec bati dessus
  est donc passe PASSED, puis REJECTED "quote does not appear", puis UNVERIFIABLE
  403, puis PASSED, sans qu'une ligne bouge. Ce n'est ni la toux reseau du 06/08
  (elle frappe TOUS les domaines a la fois) ni une reecriture d'article: c'est UN
  domaine qui limite le debit. Regle: si le MEME domaine alterne 200/403 sur des
  relances espacees, ne le garde pas dans un spec que tu banques pour un run 3 h
  plus tard, remplace-le. Purge faite ce jour-la, spec claude-marque-invisible
  rebati sur techtimes. Rendent 200 et se gatent DU PREMIER COUP ce jour-la:
  searchenginejournal.com, techtimes.com, kotaku.com (nouveaux), engadget.com et
  pcgamer.com (re-confirmes), techcrunch.com (re-confirme). interestingengineering.com
  rend 200 aussi. euronews.com est INSTABLE: 200 au premier fetch, puis "dns
  resolution failure" 4 fois de suite, puis 503 sur sa page d'accueil. ET DEUX
  PRIMAIRES INTROUVABLES, a savoir avant de perdre 20 min: anthropic.com/news rend
  200 mais son index est rendu en JS et ne liste PAS l'annonce du jour, les trois
  chemins RSS (/news/rss.xml, /rss.xml, /news/feed.xml) rendent 404, et
  sitemap.xml (255 URL /news/) ne la porte pas non plus; help.twitch.tv est un
  portail Salesforce qui rend "twitch help portal loading x sorry to interrupt css
  error refresh" au fetch, donc la page d'aide Twitch est INGATABLE. Sur ces deux
  dossiers le primaire n'existe pas d'ici: batis sur la presse et dis-le.
  Ajout 15/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  pcworld.com, thetrucker.com et automotiveworld.com (trois nouveaux);
  engadget.com et techcrunch.com re-confirment. Repondent 200 aussi dmv.ca.gov et
  kodiak.ai. CORRECTION de la note du 31/07: digitaltrends.com rend maintenant 403
  au fetch gate, il ne se gate plus. DEUX PIEGES DE CORROBORATION le meme matin.
  (1) Dossier Google/filigrane: techcrunch, engadget et pcworld reecrivent tous le
  MEME post X de Josh Woodward (x.com est 403), donc trois domaines verts = UNE
  annonce, famille du 09/08. Ce qui sauve le dossier: pcworld a ESSAYE la fonction
  ("i tried it myself... landed without a gemini logo watermark"), seule
  verification independante du lot. Sur une annonce faite d'abord sur X, cherche
  la redaction qui a teste, pas la troisieme reprise. (2) Dossier camions Kodiak:
  thetrucker et automotiveworld reecrivent le meme communique et portent la MEME
  citation Burnette, mais PAS avec la meme phrase d'introduction, donc la citation
  copiee chez l'un revient NOT_FOUND chez l'autre (mesure: 1 erreur de gate).
  Recopie toujours depuis le domaine que tu cites, meme quand deux articles
  semblent identiques.
  Ajout 16/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  arxiv.org (/abs/ ET /html/), reason.com/volokh, lawnews.co.uk (nouveaux), et
  the-decoder.com re-confirme (0 erreur sur 25 verifications, deux dossiers).
  Repondent 200 aussi tomshardware.com, 404media.co, wccftech.com, itdaily.com,
  techjournal.org, mezha.net, ua.news, npr.org et techdirt.com. Bloquent:
  washingtonpost.com (503, re-confirme), help.openai.com (403, donc les notes de
  version ChatGPT sont ingatables), windowsreport.com (403), cryptobriefing.com
  (403), abovethelaw.com (403), pbxscience.com (406), harrisbeachmurtha.com (202
  sans corps). venturebeat.com rend 429 pour le SEPTIEME jour d'affilee (07 au
  16/08): l'entree du 12/08 disait "sixieme", c'est desormais l'etat permanent du
  domaine. Perdu ce matin pour cette raison: l'angle "les modeles sont les plus
  surs d'eux quand ils ont tort", mis en revisit sans une ligne d'ecrite.
  LE PIEGE ARXIV, neuf et couteux: la page /abs/<id> ne porte QUE le resume, donc
  toute phrase du CORPS (chiffres, exemples, notes) copiee depuis /html/<id>vN
  revient NOT_FOUND si tu cites /abs/. Deux citations mortes la-dessus. Cite
  /html/<id>vN des que la phrase n'est pas dans le resume. Et le /abs/ rend le
  LaTeX BRUT: "$>$ 25\\%" s'aplatit en " > > 25%", donc n'englobe jamais une
  formule dans une citation, choisis un empan sans math.
  ET LE PIEGE DE DATE, famille du 08/08 (Willison): cbc.ca rend 200 sur un article
  "ai generated books amazon" qui a l'air parfait pour le dossier du jour et qui
  date de SEPTEMBRE 2024. Lis la date DANS l'article avant de le compter comme
  corroboration, un moteur de recherche ne la donne pas.
  Ajout 16/08 (16h30), dossier texte invisible/tribunal: lawnews.co.uk et
  reason.com/volokh se re-gatent du PREMIER coup en re-gate de publication
  (15 verifications sur 15, 0 erreur, 3 domaines avec the-decoder). Sur une actu
  de DECISION DE JUSTICE americaine, reason.com/volokh est le meilleur primaire
  joignable d'ici: le billet Volokh cite le jugement par paragraphes entiers, donc
  il porte les citations que la presse resume (le texte cache, le comparatif du
  juge avec un jure, le chiffre des CV), la ou lawnews.co.uk porte le resume et le
  numero de role. Les deux se capturent aussi (voir l'entree recus).
  Ajout 17/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  (0 erreur sur 24 verifications, deux dossiers) epoch.ai/publications,
  thenextweb.com et sixthtone.com (nouveaux), the-decoder.com re-confirme pour
  la troisieme journee. Repondent 200 aussi npr.org (re-confirme),
  deepmind.google/blog, engadget.com et techcrunch.com. Bloquent, re-confirmes:
  theverge.com et arstechnica.com (403 au flux, permanents depuis le 28/07).
  LE REFLEXE QUI TROUVE UN PRIMAIRE GOOGLE, generalise depuis blog.google
  (12/08): deepmind.google/blog est rendu en JS et son HTML ne liste que 2 ou 3
  billets, mais **deepmind.google/blog/rss.xml** rend 200 et porte toutes les
  annonces recentes avec leurs URL. La regle "va au RSS de la famille produit"
  vaut donc aussi pour DeepMind. (deepmind.google/rss.xml rend 404, c'est bien
  /blog/rss.xml.) Sur une actu de labo, l'article de presse ne lie pas toujours
  le primaire: engadget ne portait AUCUN lien vers deepmind.google.
  Ajout 17/08 (06h30), OU TROUVER UNE CORROBORATION QUI N'EN EST PAS: sur le
  dossier tribunaux chinois, une recherche rend cinq domaines (kpbs.org,
  krwg.org, kgou.org, iowapublicradio.org, wfdd.org) qui sont TOUS la
  syndication NPR mot pour mot, famille RNZ du 10/08. La vraie seconde lecture
  etait sixthtone.com, qui couvrait une AUTRE affaire (Hangzhou, 260 000 yuans)
  avec son propre reporter. Sur une actu americaine, les stations publiques
  locales en .org sont presque toujours du NPR reempaquete: compte les
  redactions, pas les domaines.
  Ajout 17/08 (19h30), veille: rendent 200 au fetch gate simonwillison.net,
  technologyreview.com (26 ko aplati sur un long reportage, re-confirme),
  techcrunch.com et flyzipline.com. Bloquent: uber.com/newsroom (406, NOUVEAU,
  donc la salle de presse d'Uber est ingatable) et theverge.com (403,
  re-confirme). venturebeat.com rend 429 pour le HUITIEME jour d'affilee. Cote
  flux, Hacker News rend 502 apres 13 essais (nouveau, en plus des 403
  permanents de The Verge et Ars Technica). PRECISION SUR LE PAYWALL 404media,
  l'entree du 08/08 disait "~4 paragraphes (5 ko)": mesure ce soir a 2,1 ko
  aplati, coupe apres le chapo et la seule phrase de methode. Ces deux phrases
  la sont gatables, rien d'autre. ET LE CONTOURNEMENT QUI N'EN EST PAS UN: le
  link-blog simonwillison.net rend 200 et porte un bloc CITE VERBATIM du
  paragraphe paywalle (ici les 1 000 livres, l'AirTag, Biblio, le site VGT3),
  donc la phrase se gate chez lui. Mais il credite explicitement 404 Media:
  c'est de la citation, pas une seconde redaction, famille RNZ du 10/08. Sers-
  t'en pour gater une phrase, jamais pour compter un second domaine.
  Ajout 18/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  (0 erreur sur 27 verifications, deux dossiers) techrepublic.com,
  dataconomy.com et aftermath.site (trois nouveaux); technologyreview.com
  re-confirme. Repondent 200 aussi cultofmac.com, malwarebytes.com,
  techdirt.com, getcoai.com, wiz.io, responsiblestatecraft.org et
  librarian.net. Bloquent: cybernews.com (403), alternativeto.net (403),
  help.openai.com (403, re-confirme le 16/08, donc les pages d'aide OpenAI
  restent ingatables), axios.com (403, re-confirme); mikekalil.com rend 202
  sans corps, 9to5mac et macrumors rendent 404 sur des URL devinees.
  REFLEXE SUR UNE ACTU DE FONCTION PRODUIT dont le primaire est une page
  d'aide OpenAI ou un post X: la presse pro (techrepublic) porte les mises en
  garde que les reprises grand public coupent, ici le stockage EN CLAIR des
  fichiers de memoire et l'avertissement d'injection d'instructions. Et lis la
  fin de l'article: c'est la que techrepublic ecrit l'indisponibilite en
  Espace economique europeen, Suisse et Royaume-Uni, qui est la chute du Reel
  pour un public francais.
  Ajout 18/08 (10h30), meme dossier passe en publication: techrepublic.com et
  dataconomy.com se re-gatent du PREMIER coup en re-gate de publication (14
  verifications sur 14, 0 erreur, 2 fois de suite a 20 min d'intervalle). Les
  DEUX se capturent aussi proprement du premier coup et sans recadrage (voir
  l'entree recus). Sur une actu de FONCTION PRODUIT OpenAI, ce couple est donc
  autosuffisant: le primaire (help.openai.com) reste 403 depuis le 16/08 et on
  n'en a pas besoin.
  Ajout 19/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  (0 erreur sur 31 verifications, deux dossiers) ppc.land, digiday.com,
  trendingtopics.eu (dossier pub ChatGPT) et nats.aero, cam.ac.uk,
  greenairnews.com (dossier trainees de condensation); blog.google et
  techcrunch.com re-confirment. Repondent 200 aussi skift.com (mais paywalle
  apres ~6 paragraphes), techxplore.com et responsiblestatecraft.org.
  openai.com re-confirme 403. LE REFLEXE SUR UNE ACTU DE REGLE OU DE POLITIQUE
  OPENAI, quand le primaire est 403 et que l'annonce est arrivee par COURRIEL
  aux utilisateurs: la presse specialisee publicite lit l'e-mail et la politique
  de confidentialite ligne a ligne. ppc.land en fait un rapport de 12 min qui
  cite le courriel verbatim (heure d'envoi, adresse du responsable de
  traitement, phrases entre guillemets), et digiday apporte la seule lecture
  INDEPENDANTE du lot (une juriste externe, sa propre analyse du fondement
  juridique RGPD). Les autres reprises (trendingtopics, relevantaudience,
  smalk) reecrivent le meme courriel: trois domaines verts = une annonce, dis-le
  dans le rapport. ET LA TOUX DU JOUR, famille du 06/08: blog.google a rendu UNE
  fois "503 server error ... service error -27" (112 octets aplatis) sur une URL
  qui avait rendu 200/340 ko trois minutes plus tot, puis 200 vingt secondes
  apres. Un 503 isole sur un domaine qui marchait n'est pas un blocage.
  Ajout 19/08 (10h30), meme dossier passe en publication: ppc.land,
  trendingtopics.eu et digiday.com se re-gatent du PREMIER coup en re-gate de
  publication (0 erreur, 2 fois a 4 h d'intervalle) et LES TROIS SE CAPTURENT
  proprement du premier coup, sans mur de consentement ni recadrage: titre,
  signature et date lisibles dans le cadre 9:16. Bonus mesure: la capture
  trendingtopics porte la PHOTO de Sam Altman (World Economic Forum) dans son
  chapo, donc un recu peut livrer le visage du dirigeant sans depenser un beat
  photo. ET LE REEL LE MOINS CHER JAMAIS CONSTRUIT, $0.0513 au total: quand un
  scout a pre-epingle les photos, un plan 100% photo+screenshot+card (0 still
  genere, 0 veo) ne paie QUE la narration. Les deux lectures TTS du meme script
  dans le meme build sont sorties a 4.35 puis 3.77 mots/s, la premiere refusee
  hors bande de stretch: budgete toujours 2 achats TTS, pas 1.
  Ajout 19/08 (19h30), dossier sondage Pew: rendent 200 au fetch gate et se
  gatent DU PREMIER COUP (0 erreur sur 17 verifications) pewresearch.org,
  thehill.com et techspot.com (trois nouveaux). venturebeat.com rend 429 pour le
  NEUVIEME jour d'affilee (07 au 19/08): l'entree du 16/08 disait "septieme",
  c'est l'etat permanent du domaine, ne planifie rien dessus (perdu ce soir pour
  cette raison: "85% des entreprises brulees par une erreur d'IA coupent les
  humains qui verifient", mis en revisit sans une ligne d'ecrite). ET LE DOMAINE
  QUI ALTERNE, famille theregister du 13/08: forbes.com a rendu 200 puis 403 sur
  deux fetchs espaces de quelques minutes, sur la MEME url. Ne le banque pas dans
  un spec destine a un run 15 h plus tard. SUR UN SONDAGE, LE PRIMAIRE EST LE
  MEILLEUR ET IL EST JOIGNABLE: la fiche pewresearch.org porte le texte ET les
  tableaux de donnees, donc toutes les citations chiffrees s'y prennent, la ou la
  reprise presse n'en porte qu'une ou deux. Mais ATTENTION, piege propre a Pew:
  les series par age n'existent QUE dans les tableaux ("2021 31 34 41 43"), pas
  en prose, donc une comparaison historique par tranche d'age n'est PAS gatable
  comme phrase. Reste sur les phrases que Pew ecrit vraiment ("the youngest
  adults are now just as likely as those ages 30 to 64"). Piege de contraction
  re-confirme (01/08): Pew ecrit "they're", deux citations recopiees en "they
  are" sont revenues MISS avant le gate, attrapees hors reseau en 10 s avec
  flatten. ET L'ETRANGLEMENT upload.wikimedia SE RE-CONFIRME LE LENDEMAIN de
  l'entree du 19/08 06h30: l'original Screen_time.jpg a rendu la page d'erreur de
  2,2 ko des la premiere requete du run, et le thumb /1280px- a servi l'image
  entiere (194 ko, 1280x854) apres ~20 s de pause. Descends directement a 1280.
  Ajout 20/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  (0 erreur sur 20 verifications) technologyreview.com (re-confirme) et
  prnewswire.com (NOUVEAU, et il CORRIGE l'entree du 28/07 qui ne le connaissait
  qu'en 503 sous WebFetch: le fetch Node rend 200 et 17 ko aplatis). REFLEXE SUR
  UN CHIFFRE D'ENTREPRISE: quand le site de la boite rend son rapport annuel en
  JS ou le formule autrement (bark.us/annual-report-2025/ rend 200 mais ecrit
  "11.1 billion activities"), c'est le COMMUNIQUE prnewswire qui porte la phrase
  gatable ("bark analyzed a record 11.1 billion messages and files in 2025") ET
  la citation du PDG. Repond 200 aussi bark.us. Bloque: cdt.org (403 Cloudflare,
  NOUVEAU). Cote flux, Hacker News rend 502 pour la deuxieme journee (13 essais
  dans feeds.mjs PUIS un fetch Node a la main, 150 octets): la relance manuelle
  du 16/08 ne le ressuscite pas cette fois, il est vraiment mort ce matin. ET LE
  TELECHARGEMENT COMMONS, qui precise l'entree du 19/08: `curl -A "Mozilla/5.0"`
  a rendu la page d'etranglement de 2 010 octets sur DEUX thumbs (1620px et
  2560px), et un fetch Node avec un UA de navigateur COMPLET plus
  `referer: https://commons.wikimedia.org/` a rendu les deux thumbs 1280px du
  premier coup (593 ko et 193 ko). Ce n'est donc pas qu'une affaire de taille:
  ajoute le referer et l'UA complet avant de conclure a l'etranglement.
  Ajout 21/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  (0 erreur sur 27 verifications, deux dossiers) cisa.gov/news-events/
  cybersecurity-advisories/<aaNN-NNNa> (NOUVEAU, et c'est un primaire de premier
  ordre: l'avis conjoint NSA/CISA/FBI/DOE/EPA porte le texte entier, mitigations
  et notes comprises, donc les phrases qui autorisent les chiffres y sont) et
  cyberscoop.com (NOUVEAU); pewresearch.org et techcrunch.com re-confirment.
  Repondent 200 aussi helpnetsecurity.com, techtimes.com et bandt.com.au.
  REFLEXE POUR TROUVER L'URL D'UN AVIS CISA, 30 s: l'index
  /news-events/cybersecurity-advisories rend 200 et porte les liens
  /news-events/cybersecurity-advisories/aaNN-NNNa; la presse ne lie pas toujours
  l'avis. ATTENTION CORROBORATION sur un avis d'agence, famille du 09/08:
  techcrunch et cyberscoop lisent le MEME document public, donc deux domaines
  verts n'attestent que "les agences ont dit x". Ce qui rend le dossier
  publiable quand meme, et qu'il faut dire dans le rapport: chacun a son propre
  reportage a cote (une source incident-response chez techcrunch, Michael Garcia
  + Frenos + la reponse ecrite de Siemens chez cyberscoop). Cote flux ce matin:
  The Verge et Ars Technica 403 (permanents), et Hacker News a rendu timeout
  dans feeds.mjs puis 200 / 10,3 ko au fetch Node 3 min plus tard, meme toux que
  le 14/08 et le 16/08: relance a la main tout flux marque FAIL.
  Ajout 21/08 (16h30), CONTRE-EPREUVE A 9 H D'INTERVALLE SUR LE MEME DOSSIER:
  cisa.gov/news-events/cybersecurity-advisories/aa26-231a, techcrunch.com et
  cyberscoop.com se re-gatent du PREMIER coup en re-gate de publication (16
  verifications sur 16, 0 erreur), 9 h apres le gate du scout. ET LES DEUX RECUS
  EPINGLES HORS MOTEUR PAR LE SCOUT ONT TENU EN MOTEUR SANS UNE SEULE RECAPTURE:
  le replica de screenshotOnce mesure le matin (entree du 21/08 06h30) donne donc
  bien le fichier final, crop compris (crop=1290:2293:0:0 sur cyberscoop, qui
  coupe son bandeau promo Google). Les deux passent le controle du 10/08, le
  titre affiche EST l'histoire, et le build n'a attendu aucun reseau de capture:
  COMPLIANT en 3 min 40 apres la narration. Un scout qui capture hors moteur et
  epingle supprime donc la moitie lente du build, pas seulement la derive.
  Ajout 21/08 (19h30), LE PIEGE LE PLUS DANGEREUX MESURE JUSQU'ICI, techcrunch.com
  EN RECU: le domaine se gate parfaitement au fetch Node (200, article entier),
  mais sa page MOBILE, donc exactement le contexte de screenshotOnce (UA iPhone,
  430x932), REDIRIGE LA PAGE ENTIERE vers loadway.best, une fausse alerte McAfee
  "Scanning your device / Threat Detected!". Reproduit DEUX fois a 10 min
  d'intervalle, 30 s au goto, frames=1, et ni les deux passes de consentement ni
  le strip des overlays fixes n'y peuvent quoi que ce soit: ce n'est pas une
  banniere posee sur l'article, c'est une autre page. Un beat `screenshot` sur
  techcrunch peut donc publier une pub d'arnaque en plein Reel, et le fichier
  sortira COMPLIANT. Verifie `page.url()` apres le goto, ou prends un autre recu.
  ET C'EST NEUF: le recu techcrunch du Reel du 14/08 (media/2026-08-14-trois-ia-
  guerre-serveur/shot_tc_crop.png, encore sur disque) montre l'article propre,
  titre, signature et chapo. Donc entre le 14 et le 21/08 la regie mobile de
  techcrunch s'est mise a rediriger. Traite tout recu techcrunch comme un tirage
  au sort tant que ca n'a pas ete remesure.
  MESURES DU MEME SOIR: gizmodo.com se gate (200, et il porte la reponse d'Oura
  que techcrunch n'a pas) mais NE SE CAPTURE PAS, la page meurt pendant la passe
  de consentement ("target page, context or browser has been closed"), deux fois:
  famille macrumors du 09/08, source oui, recu jamais. ppc.land se recapture
  propre du premier coup (masthead, titre entier, signature, date, chapo qui
  porte le claim central), mais en 232 s et 17 frames: famille O(frames) du
  06/08, il SURVIT, prevois 4 min et ne coupe pas a 240 s. ouraring.com rend 200
  et son texte aplati porte les affirmations attaquees ("99%heart rate accuracy
  r2 compared to ecg21 95%sleep staging accuracy compared to clinical sleep
  lab") - note l'absence d'espace entre le chiffre et le mot suivant apres
  flatten, recopie-la telle quelle; les URL produit sont sous /store/rings/<slug>
  et se lisent dans le HTML de la page d'accueil (les chemins devines /product/
  rendent 404). En revanche il ne fait PAS un recu: la capture rend le hero
  anime ("Built to blend in / Shop Now") et un scroll vers le texte
  "sleep staging accuracy" ne l'atteint pas. Bloque au fetch gate: nhtsa.gov
  (403 sur /?nhtsaId=... ET sur /vehicle-safety), donc le primaire d'une enquete
  de securite routiere americaine est ingatable. Openverse a rendu 503 deux fois
  vers 20h puis remarche 20 min apres (toux, pas blocage); Commons repondait
  pendant ce temps.
  Ajout 22/08 (06h30), dossier Outer Bio: outerbio.com rend 200 au fetch gate et
  se gate DU PREMIER COUP sur ses quatre chemins (/, /technology, /data-and-ai,
  /tissue-supply-chain), 12 verifications sur 12, 0 erreur, en meme temps que
  techcrunch.com (re-confirme, 200). MAIS IL S'ETRANGLE VITE, et la signature
  trompe: apres une dizaine de fetchs rapproches il rend 503 avec un corps aplati
  de 582 OCTETS, donc la citation revient MISS et on croit avoir mal recopie. Il
  repart tout seul en ~2 min. Sur un petit site d'entreprise, espace les fetchs et
  relance avant de suspecter ta citation (famille de la toux du 06/08, mais causee
  par TOI). REFLEXE RE-CONFIRME sur une actu d'entreprise: le site de la boite est
  a la fois le primaire, le recu le plus leger ET le recu qui porte la preuve
  (categorie epoch.ai 17/08): /data-and-ai affiche "rapid compound screening made
  possible by machine learning" et "750m compounds screened annually" dans le
  cadre, /tissue-supply-chain affiche le titre et le debut du texte de don de
  tissu. Les deux se capturent en ~52 s, 1 SEULE frame au goto, zero pub, zero
  banniere cookies, aucun recadrage. ATTENTION CORROBORATION, et c'est la limite
  du dossier: TechCrunch a interviewe l'entreprise et le site est l'entreprise,
  donc deux domaines verts attestent "l'entreprise dit x", pas deux lectures
  independantes; le prepint bioRxiv lie en haut de outerbio.com est le seul
  artefact exterieur et biorxiv rend 429 (07 au 22/08). Dis-le dans le rapport et
  attribue dans le script.
  Ajout 30/08 (16h30), CE QUE COUTE VRAIMENT UN RUN DE PUBLICATION QUAND LE SPEC
  EST DEJA EPINGLE, mesure de bout en bout: 12 MINUTES entre le premier `date -u`
  et le `media_publish` (16h38 -> 16h50 UTC), CONTENEUR FROID COMPRIS (npm
  install, ffmpeg, venv Whisper bootstrap + large-v3-turbo en 21 s). Le spec
  venait du scout de 06h30, re-gate par le run de 10h30 et laisse en banque avec
  son recu et ses deux photos deja sur disque. Aucune capture reseau pendant le
  build. L'entree du 21/08 16h30 disait "le scout supprime la moitie lente du
  build": voila le chiffre. Consequence de planification: un run de 16h30 qui
  herite d'un spec epingle a largement le temps de relire le carnet et les frames
  AVANT de lancer, et un run qui doit encore capturer ses recus n'a pas ce temps.
  Meme jour: cnbc.com et the-decoder.com se re-gatent DU PREMIER COUP en re-gate
  de publication 9 h apres le gate du scout (12 verifications sur 12, 0 erreur,
  0 warning, verifiedOnline true), et le recu the-decoder epingle hors moteur par
  le scout a tenu en moteur sans une seule recapture (masthead, h1 = l'histoire,
  signature, date "Aug 29, 2026" dans le cadre 9:16).
  Ajout 21/08 (19h30), DEUX PIEGES D'OUTILLAGE QUI COUTENT 15 MIN CHACUN.
  (1) Une capture tuee par `timeout` laisse des process chrome vivants, et le
  LANCEMENT SUIVANT se bloque indefiniment sans afficher une seule ligne:
  `pkill -f chrome-linux/chrome` avant de reessayer, et compte 4 min de marge.
  (2) Ne pipe JAMAIS le script de capture dans `tail`: quand `timeout` tue le
  process, le tampon du pipe est perdu et tu ne vois RIEN, ce qui fait
  diagnostiquer un blocage au lancement alors qu'il est ailleurs. Redirige vers
  un fichier (`> log 2>&1`) et lis-le apres.
  CORRECTION 23/08 (19h30) au (1) ci-dessus, et elle est vicieuse parce que le
  remede se retourne contre toi: `pkill -f chrome-linux/chrome` TUE LE SHELL QUI
  LE LANCE. Le motif est cherche dans les lignes de commande entieres, et le
  shell appelant porte la commande elle-meme, donc il se tue en premier: exit
  144, aucune sortie, rien d'execute apres. Le fichier deja ecrit survit et le
  `cd` du shell precedent reste en place, ce qui fait ensuite echouer des chemins
  relatifs. Ecris `pkill -f 'chrome-linux/[c]hrome'` (la classe de caracteres
  empeche le motif de se matcher lui-meme), ou regarde d'abord avec
  `pgrep -fa chrome`. Et travaille en chemins ABSOLUS des qu'un run a fait un
  `cd`.
  Ajout 23/08 (06h30), dossier Torvalds. LE PRIMAIRE D'UNE ACTU NOYAU LINUX EST
  INGATABLE CHEZ KERNEL.ORG ET GATABLE CHEZ GITHUB. lore.kernel.org et
  git.kernel.org rendent HTTP 200 avec un corps de 1 541 octets qui est une
  page de defi Anubis ("making sure you're not a bot", preuve de travail
  javascript): un 200 qui ne contient pas une ligne du commit, donc le piege
  inverse du 03/08 dans l'autre sens, c'est la TAILLE qui trahit, pas le code.
  Le miroir `github.com/<owner>/<repo>/commit/<sha>.patch` rend 200 et porte le
  message de commit ENTIER (en-tetes From/Date/Subject compris) et s'est gate du
  PREMIER coup, 12 verifications sur 12. CORRIGE donc la note du 01/08 qui
  disait github.com intercepte en 403: c'est vrai des pages HTML (voir l'entree
  recus), faux du chemin .patch au fetch Node. Sur une actu de code, va au
  .patch, jamais a kernel.org. Rendent 200 et se gatent du premier coup le meme
  matin: itsfoss.com (NOUVEAU) et phoronix.com/news/<slug> (NOUVEAU). ATTENTION
  phoronix: la page d'ACCUEIL phoronix.com rend 403 et ses pages article rendent
  200, donc un 403 sur la racine d'un domaine ne dit RIEN de ses articles,
  teste l'URL que tu vas citer. Bloque: xda-developers.com (502).
  Rendent 200 et se gatent du premier coup aussi hbs.edu (/foundry et
  /foundry/bootcamps/...) et hbsfoundry.org. ATTENTION CORROBORATION sur les
  deux dossiers du jour, famille du 09/08: cote Torvalds, phoronix et itsfoss
  lisent le MEME commit (itsfoss ecrit "source: phoronix" en bas), donc trois
  domaines verts attestent "Torvalds a ecrit x", ce qui suffit puisque le
  primaire EST sa parole; cote Harvard, techcrunch resume un reportage du New
  York Times (injoignable) et les deux autres domaines sont Harvard elle-meme,
  donc le prix de 699 $ et le nom du fournisseur ne sont confirmes NULLE PART
  ailleurs que dans le NYT. Dis-le dans le rapport et attribue dans le script.
  Ajout 23/08 (19h30), dossier amende Uber: rendent 200 au fetch gate et se
  gatent DU PREMIER COUP ppc.land (re-confirme le 19/08) et thenextweb.com
  (re-confirme); techcrunch.com re-confirme aussi. Repond 200 implicator.ai
  (non gate). Bloquent au fetch gate: autoriteitpersoonsgegevens.nl (403 sur
  /en, /en/current ET /actueel, donc le PRIMAIRE d'une decision de l'autorite
  neerlandaise de protection des donnees est INGATABLE d'ici) et nltimes.nl
  (403). ATTENTION CORROBORATION, famille Bloomberg du 07/08: techcrunch et
  thenextweb creditent TOUS LES DEUX l'exclu Reuters (injoignable), donc le
  chiffre de l'amende est un seul rapport habille de plusieurs domaines. Ce qui
  sauve le dossier: ppc.land lit la decision de l'AP elle-meme (trois phrases de
  Verdier, le calcul du pourcentage du chiffre d'affaires, la liste des quatre
  amendes) et techcrunch porte son propre reportage a cote (interview de
  Paul-Olivier Dehaye). ET LA DIVERGENCE A NE PAS FAIRE PORTER AU TEXTE PUBLIC,
  a chercher sur toute reprise d'exclu: ppc ecrit "between 2018 and 2022" la ou
  thenextweb ecrit "between 2020 and 2022", et ppc compte QUATRE amendes de l'AP
  quand techcrunch ecrit "the third fine". N'ecris ni les annees ni le rang dans
  le script: les deux sources sont vertes au gate et se contredisent quand meme.
  Ajout 24/08 (16h30), dossier enfants/IA: rendent 200 au fetch gate et se gatent
  DU PREMIER COUP (16 verifications sur 16, 0 erreur) technologyreview.com
  (re-confirme) et arxiv.org/abs/ (re-confirme). ET LES DEUX SE CAPTURENT
  PARFAITEMENT EN MOTEUR, sans mur de consentement ni recadrage: la fiche
  arxiv /abs/ tient dans le cadre 9:16 le logo arXiv, l'identifiant, la date de
  soumission, le titre, la liste ENTIERE des auteurs ET les 8 premieres lignes du
  resume, donc le recu AFFICHE la phrase qui porte le centralClaim, lisible.
  C'est le meilleur recu qui existe sur une actu de papier, au meme titre que
  PubMed (08/08). technologyreview.com se capture aussi propre (titre, chapo,
  signature, date). SUR UNE ACTU DE SCIENCE COGNITIVE OU DE PAPIER NLP, le couple
  technologyreview + arxiv/abs est autosuffisant. NUANCE DE CORROBORATION a dire
  dans le rapport, famille du 07/08: ce ne sont pas deux redactions, le reportage
  MIT TR interviewe les AUTEURS du papier arxiv. Ca reste une vraie double lecture
  (le papier est publie en actes de conference, anterieur de 16 mois au reportage)
  mais pas deux enquetes independantes. ET LE PIEGE ARXIV DU 16/08 A L'ENVERS: ici
  la phrase voulue EST dans le resume, donc /abs/ suffit ET se capture; des que la
  phrase vient du corps il faut /html/<id>vN, qui ne porte pas la fiche.
  Ajout 24/08 (19h30), LES CONDITIONS GENERALES D'UNE BOITE SONT UN PRIMAIRE
  GATABLE, et c'est le reflexe a avoir sur toute actu du genre "ce que cette appli
  a le droit de faire de tes donnees": instinct.co/terms rend 200 au fetch gate
  (46 ko aplatis) et porte la phrase de licence VERBATIM ("you grant us a
  nonexclusive, royalty-free, transferable, sub-licensable, worldwide, perpetual
  and irrevocable license to access, use, host, cache, store, ... and modify any
  materials to provide, operate, develop, train, fine-tune..."), et
  instinct.co/privacy-policy rend 200 aussi (16 ko). Donc la depeche presse fait
  le reportage et le contrat fait la preuve: deux domaines, et le second est
  irrefutable puisque c'est l'entreprise qui l'ecrit. ATTENTION a ne pas etendre
  cette corroboration aux INCIDENTS racontes dans l'article (ici quatre
  temoignages dates des 21-22/08): eux sont TechCrunch-only, leurs sources sont
  des posts x.com (403 depuis le 31/07), et le contrat n'en atteste aucun.
  Corrobore les TERMES avec les termes, et dis dans le rapport que les incidents
  reposent sur une seule redaction. Mesures du meme soir: xusheng.dev rend 200
  (21 ko aplatis), et une URL /terms-of-service devinee rend 200 avec 8 OCTETS
  aplatis, soit une page vide qui n'est pas un 404 - lis la taille aplatie, pas
  le code (famille du defi Anubis de kernel.org, 23/08).
  Ajout 25/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  (0 erreur sur 24 verifications, deux dossiers) fortune.com, implicator.ai et
  theregister.com; xusheng.dev se re-confirme. Repondent 200 aussi tomsguide.com
  et gadgetreview.com. venturebeat.com rend 429 pour le DIXIEME jour consecutif
  (07 au 25/08); perdu ce matin pour cette raison le dossier Claude Tag / agent
  Slack, mis en revisit sans une ligne d'ecrite. NUANCE SUR theregister ET SUR
  L'ENTREE DU 13/08 qui le disait alternant 200/403 au hasard: il a rendu 200
  QUATRE fois d'affilee ce matin (2 fetchs gate espaces + 2 captures). Son
  alternance n'est donc pas un etat permanent du domaine: teste-le avant de le
  rayer d'un spec que tu banques. REFLEXE SUR UNE ACTU DE PRIX GRAND PUBLIC: la
  depeche techcrunch n'est qu'une breve, le SCOOP est ailleurs (ici fortune.com
  du 21/08, qui a releve toute la grille tarifaire produit par produit) et
  l'ANALYSE encore ailleurs (implicator.ai, qui relie la hausse au capex IA et
  va chercher l'estimation JPMorgan). Contrairement aux dossiers ou trois
  domaines reecrivent un seul communique, les trois ont ici chacun leur propre
  declaration d'entreprise ou leur propre lecture: c'est une vraie triple
  lecture, et ca se dit dans le rapport dans ce sens-la aussi.
  Ajout 25/08 (16h30), NUANCE SUR theregister.com, le domaine qui alternait
  200/403 (13/08): il a tenu 6 h ce jour-la sans une seule alternance. Un spec
  banque par le scout de 10h30 s'est re-gate DU PREMIER COUP a 16h40 (14
  verifications sur 14, 0 erreur, deux passes a 20 min d'intervalle), plus un
  fetch a la main derriere. La regle du 13/08 (ne pas banquer un spec bati sur
  un domaine qui alterne) reste bonne, mais elle ne condamne pas theregister en
  permanence: teste-le, il peut etre stable une journee entiere. ET LE PIEGE DE
  VERIFICATION A LA MAIN, qui a failli me faire croire que la source avait perdu
  ses phrases: un aplatissement maison
  `replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')` NE DECODE PAS LES ENTITES, et
  theregister colle un `&nbsp;` en plein milieu d'une phrase ("Anthropic
  disclosed &nbsp; earlier this month"). Deux citations pourtant presentes sont
  revenues MISSING sur ce test, alors que le gate les avait validees dix minutes
  plus tot. Quand tu controles une citation hors gate, cherche un empan COURT ou
  un nombre ("190 ai providers"), jamais la phrase entiere, et ne conclus jamais
  a une source cassee sur la foi de ton propre flatten. Proof: run 16h30 25/08.
  Ajout 25/08 (19h30), dossier Waymo/Munich: rendent 200 au fetch gate et se
  gatent DU PREMIER COUP waymo.com/blog (le primaire) et cnbc.com; thenextweb.com
  re-confirme (13 verifications sur 13 apres correction, 3 domaines). Bloquent au
  fetch gate: electrive.com (403), dw.com (403), theverge.com (403, re-confirme).
  heise.de rend 200 mais son index /news/ est rendu en JS et n'expose qu'UN lien:
  joignable, pas enumerable. ET LE PIEGE QUI INVERSE LE REFLEXE RSS (12/08
  blog.google, 17/08 deepmind): sur waymo.com c'est l'inverse exact. L'index HTML
  waymo.com/blog/ porte les URL du jour en clair (/blog/2026/08/waymo-in-munich),
  tandis que waymo.com/blog/rss.xml rend 200 et 385 ko de billets blogspot de
  2020-2021, aucun recent: le flux est un PIEGE PERIME, pas un raccourci. Va a
  l'index HTML sur waymo.com, et verifie toujours une date dans le flux avant de
  t'y fier. PIEGE DE CITATION thenextweb, meme famille que le "they're" de Pew
  (19/08): TNW compose ses citations detachees en guillemets typographiques AVEC
  UNE ESPACE A L'INTERIEUR (`" Our goal ... here, "` une fois aplati), donc une
  citation recopiee en englobant la narration qui suit ("...here, " Hirte said,
  in the same statement...") revient NOT_FOUND. Prends l'empan STRICTEMENT
  INTERIEUR aux guillemets, sans les guillemets ni ce qui les entoure. Proof:
  1 erreur de gate ce soir, verte au coup suivant.
  Ajout 26/08 (06h30), dossier MIT Media Lab: rendent 200 au fetch gate et se
  gatent DU PREMIER COUP (14 verifications sur 14, 0 erreur) news.mit.edu
  (NOUVEAU), technologyreview.com et arxiv.org/abs (re-confirmes). Bloquent au
  fetch gate: dl.acm.org et doi.org (403, donc un papier CHI/ACM n'est PAS
  gatable au primaire), fastcompany.com (403), cryptobriefing.com (403,
  re-confirme). Repond 200 techxplore.com MAIS il ecrit "by massachusetts
  institute of technology" + "provided by massachusetts institute of
  technology": c'est de la SYNDICATION du communique, famille RNZ du 10/08, pas
  une seconde lecture. REFLEXE QUAND L'EDITEUR ACADEMIQUE BLOQUE, meme famille
  que PubMed (08/08): la fiche techxplore porte le DOI en clair, et le DOI mene
  au preprint arXiv des memes auteurs, qui lui se gate ET se capture. Cherche le
  preprint par auteur: `export.arxiv.org/api/query?search_query=au:"<nom>"+AND+
  abs:"<mot>"`. ET LA NUANCE DE CORROBORATION LA PLUS SERREE MESUREE JUSQU'ICI:
  sur une actu de papier academique, le primaire (arXiv), le communique
  (news.mit.edu) et le magazine (technologyreview.com) peuvent etre TROIS
  domaines verts et UNE SEULE INSTITUTION, ici le MIT du debut a la fin (les
  auteurs, leur newsroom, leur magazine d'anciens). Le gate passe au vert, et
  ca n'atteste que "les chercheurs ont mesure x". Publiable en attribuant dans
  le script ("une etude du MIT Media Lab"), jamais lu comme trois lectures.
  Ajout 28/08 (17h30), dossier Flock/plaques: cfpublic.org (Central Florida Public
  Media) rend 200 au fetch gate, se gate DU PREMIER COUP et SE CAPTURE
  parfaitement, NOUVEAU et excellent: titre entier ("DeSantis says license plate
  readers are 'out of control.'"), signature, "Published August 26, 2026", zero
  mur de consentement, zero pub, aucun recadrage, et en prime une photo de
  camera Flock dans le cadre. Sur une actu de POLITIQUE LOCALE americaine, la
  station publique locale porte les citations du gouverneur mot pour mot ET la
  reponse ecrite de l'entreprise, la ou la depeche nationale resume. ATTENTION,
  ce n'est PAS de la syndication NPR (famille du 17/08): l'article est signe
  d'une reporter maison. Verifie la signature avant de classer un .org public
  comme du NPR reempaquete. Meme run: techcrunch.com rend 200 et se gate, mais
  je ne l'ai pas pris en recu (entree du 21/08, redirection mobile vers une
  fausse alerte McAfee, non remesuree).
  Ajout 28/08 (16h30): blog.google se re-gate ET se recapture PARFAITEMENT
  (re-confirme le 12/08, 3e fois): titre, date "Aug 27, 2026", "4 min read",
  signature ET un chapo qui porte le claim central en toutes lettres, dans le
  cadre 9:16, zero banniere, zero recadrage. Sur une actu produit Google c'est
  le recu le plus fort qui existe. techcrunch.com se gate aussi (200) mais je
  ne l'ai PAS pris en recu, entree du 21/08 (redirection mobile vers une fausse
  alerte McAfee) non remesuree. washingtonpost.com rend 503 au fetch gate
  (re-confirme le 16/08): une EXCLU WaPo est donc ingatable, et toutes ses
  reprises sont derivees. Perdu ce soir pour cette raison le sondage YouGov sur
  les lecteurs de plaques Flock (46% contre / 38% pour, 120 000 lecteurs), la
  meilleure histoire du lot, mise en revisit sans une ligne d'ecrite: TechCrunch
  etait le SEUL domaine joignable et il credite le Post. Le reflexe qui coute
  30 s et sauve une heure: sur une depeche qui dit "shared exclusively with X",
  fetch X AVANT de scorer l'histoire.
  Ajout 30/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  (0 erreur sur 28 verifications, deux dossiers) musicbusinessworldwide.com
  (NOUVEAU) et gizmodo.com; cnbc.com, engadget.com, the-decoder.com et
  techcrunch.com re-confirment. SUR UNE ACTU DE L'INDUSTRIE MUSICALE, le
  primaire joignable est MBW: c'est lui qui OBTIENT la plainte ("the complaint
  - obtained by mbw"), il en cite des paragraphes entiers (titres de chansons,
  montants par oeuvre, dates de torrent, citations internes descellees), la ou
  techcrunch n'en fait qu'une breve de 4 paragraphes. Cherche le titre de
  presse SECTORIELLE avant la presse tech sur un dossier musique, cinema ou
  edition. ATTENTION CORROBORATION, famille du 07/08: techcrunch, engadget et
  gizmodo creditent TOUS les trois MBW pour le texte de la plainte, donc trois
  domaines verts = un seul document lu par plusieurs redactions. Ca reste
  publiable (une plainte est une piece publique et chacun la lit), mais dis-le
  dans le rapport. Deuxieme dossier du jour, OpenAI/Cursor: le primaire
  openai.com est 403 (re-confirme depuis le 26/07), et cnbc porte son propre
  reportage a cote (le post X de Musk, le montant du rachat lu dans les
  documents financiers) pendant que the-decoder porte le sien (la citation
  Sottiaux, le precedent Windsurf): la vraie double lecture est la, pas dans le
  nombre de domaines.
  Ajout 31/08 (06h30): rendent 200 au fetch gate et se gatent DU PREMIER COUP
  (0 erreur sur 26 verifications, deux dossiers) sixthtone.com/news/<id>
  (NOUVEAU) et gizmodo.com (NOUVEAU au gate); techcrunch.com et the-decoder.com
  re-confirment. Repond 200 aussi motorbiscuit.com (ferme de contenu, ne le
  compte jamais comme une redaction). Bloquent, tous deux NEUFS et tous deux
  porteurs du primaire d'une histoire du jour: **glassdoor.com/blog (403)** et
  **ft.com (403)**. Consequence de planification, famille Bloomberg du 07/08: le
  rapport Glassdoor sur l'IA au travail et le dossier FT sur les mini-series
  chinoises n'ont AUCUN primaire joignable d'ici, donc toute reprise est
  derivee. Le dossier chinois reste publiable parce que sixthtone a son PROPRE
  reportage de terrain a cote du chiffre CNSA (deux volets signes He Qitong,
  visite de studio, salaires d'acteurs, patron qui revend ses voitures); le
  dossier Glassdoor n'a que des reecritures ET ses chiffres divergent d'une
  reprise a l'autre (43% de positif chez the-decoder, 53% de negatif ailleurs),
  mis en revisit sans une ligne d'ecrite. Ce qui sauve un dossier dont le
  primaire bloque n'est jamais un troisieme domaine, c'est une redaction qui a
  vu quelque chose elle-meme. REFLEXE SUR UNE ACTU CHINOISE: sixthtone.com est
  joignable, signe ses articles, et publie en series de deux volets qui se
  lient l'un l'autre (les URL voisines /news/1018902 et /news/1018935 se lisent
  dans le HTML de chacune): un seul fetch donne les deux moities du dossier.
  Ajout 01/09 (06h30), UN GATE VERT NE PROMET PAS UN RECU, ET C'EST UN QUATRIEME
  CHEMIN RESEAU (famille du piege inverse cnbc du 03/08, mais dans l'autre sens).
  Mesure du matin, dossier pub dans ChatGPT: cnbc.com rend 200 / 920 ko au fetch
  gate et passe TOUTES ses citations VERIFIED du premier coup, mais sa CAPTURE
  rend une page Akamai "Access Denied" en 29 s, avec `"ok": true` et
  `landedUrl` juste. Meme run, siliconangle.com se gate du premier coup et sa
  capture sort une PUB DELL pleine page plus le pied de page,
  `h1` = "A message from John Furrier, co-founder of SiliconANGLE:". Deux
  domaines verts au gate, zero recu utilisable, et les deux disent `ok: true`.
  ET LA DECOUVERTE QUI RENVERSE UNE CONTRAINTE DE PLANIFICATION TENUE DEPUIS LE
  26/07: openai.com rend toujours 403 au fetch gate (donc toujours INGATABLE au
  primaire) MAIS SE CAPTURE PARFAITEMENT, 52 s / 6 frames, h1 juste, zero mur de
  consentement. Le recu tient dans le cadre 9:16 le logo, la date, le titre, le
  chapo qui porte le claim central en toutes lettres ET le bouton "Start
  advertising in ChatGPT". Donc sur une annonce OpenAI, la bonne repartition est:
  les CITATIONS chez les reprises joignables, le RECU chez le primaire. Un seul
  defaut, la plomberie du 10/08: un lecteur video casse ("Player error" +
  "Send Error Log"/"Reload Player") vers y=1270 sur 2796; `crop=1290:1240:0:0`
  garde tout ce qui compte et le coupe. A tester sur les autres primaires
  reputes bloques (anthropic.com se gate deja, x.ai, ft.com, bloomberg.com).
  NOUVEAU ET EXCELLENT: seroundtable.com se gate ET se capture du premier coup
  (115 s), titre entier, date, signature Barry Schwartz, zero banniere; sur une
  actu de REGIE PUBLICITAIRE il porte la liste des pays et le detail des offres
  (ici "these ads in europe will be shown only to users on the free and go
  plans. plus, pro, and enterprise subscriptions will remain ad-free") que la
  presse generaliste coupe, et c'est ce detail qui fait l'angle grand public.
  Se capturent aussi proprement ce matin: engadget.com (275 s / 155 frames, et
  les captures produit de Meta sont DANS le cadre) et techcrunch.com (210 s /
  88 frames, h1 juste, aucune redirection McAfee: l'entree du 21/08 ne s'est
  pas reproduite). REFLEXE DE SCOUT, il coute 2 min et sauve un build: capture
  et EPINGLE (`"file"`) chaque beat `screenshot` AVANT de banquer le spec, et
  lis `h1` et `landedUrl`. Un run de publication qui decouvre a l'achat que ses
  deux recus sont morts n'a plus assez de surfaces reelles pour le plancher de
  trois. Proof: run scout 06h30 01/09, 4 captures, 2 refusees, spec A refait.
  Ajout 01/09 (19h30), LA PRESSE SANTE EST UN MUR ET C'EST NEUF: sur le dossier
  ChatGPT Health / Epic (la meilleure histoire du soir, 325 millions de
  patients), rendent 403 au fetch gate beckershospitalreview.com,
  fiercehealthcare.com, healthcareitnews.com et cryptobriefing.com
  (re-confirme le 16/08); artificialintelligence-news.com rend 202 sans corps
  (famille mikekalil du 18/08). Rendent 200: techcrunch.com (le SEUL newsroom
  joignable sur ce dossier), techtarget.com (/patientengagement/) et
  iatrox.com, qui est un blog d'editeur, pas une redaction. Consequence de
  planification: quand une annonce OpenAI touche la SANTE, la corroboration
  n'est pas seulement en retard, la moitie des redactions qui la couvrent
  d'habitude sont bloquees d'ici. Teste beckers et fierce AVANT d'ecrire, et
  compte sur techtarget comme second domaine plutot que sur la presse
  hospitaliere. Meme soir, dossier Alexa "Update Me When": aboutamazon.com
  (/news/retail/ et /news/devices/) et engadget.com rendent 200 au fetch gate,
  mais AUCUN des deux ne porte la fonction annoncee le jour meme, donc un
  primaire joignable n'est pas un primaire qui a publie. Les deux dossiers
  sont partis en `revisit`, ce qui re-confirme l'entree du 06/08: une annonce
  d'apres-midi n'a souvent pas de second domaine avant le lendemain matin.
  Ajout 02/09 (06h30), LE SITE DE L'EDITEUR EST UN PRIMAIRE GATABLE POUR LE
  CHIFFRE QU'UNE DEPECHE LUI EMPRUNTE, et ca vaut sur tout dossier "X se
  branche sur le logiciel Y": epic.com/about rend 200 au fetch gate (2,3 ko
  aplatis) et porte "More than 325 million patients have a current electronic
  record in Epic.", donc le chiffre que techcrunch avance et que pymnts lui
  re-credite ("according to the report") est atteste par l'entreprise
  elle-meme. Reflexe: quand une depeche cite la taille d'un fournisseur,
  fetch la page /about du fournisseur avant de traiter le chiffre comme
  mono-source. Rendent 200 et se gatent DU PREMIER COUP le meme matin (0
  erreur sur 37 verifications, deux dossiers): techcrunch.com, fortune.com,
  unite.ai et epic.com/about. Bloquent: openai.com (403, re-confirme),
  axios.com (403, re-confirme), gbhackers.com (202 sans corps, famille
  mikekalil du 18/08). ATTENTION unite.ai: sa signature est un AGENT ("Aria
  Bloom ... AI-generated journalist ... Articles authored by Aria Bloom are
  AI-generated"), donc c'est une reecriture du billet de la newsroom, jamais
  une seconde redaction; excellent pour gater une phrase (il porte les 4 363
  notations et les partenaires de lancement que techcrunch coupe), inutile
  pour compter deux lectures. pymnts.com rend 200 mais coupe a un formulaire
  apres le chapo et credite techcrunch pour le chiffre porteur.
  Ajout 02/09 (06h30), CE QUE VOIT VRAIMENT UN BEAT `screenshot`, et ca change
  le choix du recu: segmentFromScreenshot (reel2.mjs:1145) fait
  `scale=880:-1` puis `crop=880:1150:0:0`, donc SEUL LE HAUT DE LA CAPTURE EST
  MONTRE, soit les 1686 premiers pixels d'une capture 1290 de large. Mesure du
  matin: epic.com/about se capture parfaitement (23 s, 1 frame, zero banniere)
  mais sa phrase "More than 325 million patients..." est a y=2560, donc
  INVISIBLE dans le Reel; recu abandonne. Avant d'epingler un recu, regarde ou
  tombe la phrase que tu veux montrer: au-dela de ~1700 px elle n'existe pas
  pour le spectateur. Corollaire utile: techcrunch place titre + signature +
  date sous 1100 px, openai.com place logo + date + titre + chapo sous 1300 px,
  fortune place masthead + rubrique + titre + signature + date sous 1100 px.
  Ajout 02/09 (06h30), fortune.com SE CAPTURE TRES BIEN MAIS SON `h1` MENT:
  1095 s / 159 frames (famille O(frames) du 06/08, il survit), et le champ
  imprime par scout-capture rend `h1` = "Trending" parce que le bandeau des
  articles tendance porte le premier h1 du DOM. Le recu lui-meme est parfait
  (masthead FORTUNE, "AI · OPENAI", titre entier, signature Emily Forlini,
  "September 1, 2026, 4:00 PM ET", photo Altman). Donc sur fortune, `h1` n'est
  PAS le controle: c'est `landedUrl` qui compte, et l'oeil. Meme matin,
  openai.com se re-confirme en recu (68 s / 6 frames et 38 s / 4 frames, h1
  justes, zero mur de consentement) alors qu'il reste 403 au gate, et
  techcrunch se capture propre en 736 s / 120 frames. Budget mesure d'un scout
  qui epingle 4 recus: ~32 min de navigateur, 0 $.
- 2026-08-17 · LE GATE DE FRAICHEUR, STALE_DAYS=4, et c'est le controle le plus
  cher a decouvrir tard: validate.mjs prend la date la PLUS RECENTE des
  `slides[].source.date` et REFUSE le post au-dela de 4 jours ("that is not
  news, it is an archive piece with a date on it"); entre 2 et 4 jours il ne
  fait qu'avertir. Mesure du 17/08: DEUX histoires entierement recherchees,
  ecrites et sourcees sont mortes la-dessus apres coup, la langue des signes
  SL2T de Google DeepMind (annonce du 12/08, 5,3 jours) et les tribunaux
  chinois sur les licenciements dus a l'IA (NPR du 10/08 + Sixth Tone de mai).
  Le contournement N'EST PAS de dater une diapo a la louche: c'est de trouver
  une reprise du jour qui porte l'histoire, ou de changer d'histoire. Attention
  au calcul, il se fait a l'heure pres depuis minuit UTC de la date citee: un
  article date du 13/08 vaut deja 4,3 jours le 17/08 au matin et ne sauve rien.
  REFLEXE DE SCOUT, 10 secondes, AVANT de lire le moindre article: verifie que
  l'histoire a une source datee des 3 derniers jours, sinon ne l'ouvre pas. Un
  dimanche pauvre pousse justement a repecher du 5 aout, et c'est exactement ce
  que ce controle existe pour arreter. Proof: gate du scout 06h30 17/08, deux
  specs perdus, deux reecrits sur des sujets du 15 et du 16/08.
  Ajout 29/08 (06h30), LE MOT DE TEMPS RELATIF EST LA FAUTE QUE PERSONNE NE
  VOIT, et elle vit dans les specs MIS EN BANQUE: un spec ecrit le soir pour
  etre publie le lendemain est relu par un moteur qui ne connait pas la date.
  Mesure ce matin sur 2026-08-29-anthropic-liste-noire, banque la veille a
  20h05: le beat 0 disait "Hier soir, un juge a dit stop" alors que
  l'ordonnance de la juge Lin est de JEUDI soir 27/08 (TechCrunch: "ruled on
  Thursday evening", NPR: "issued a written order Thursday night"). Ecrit le
  28 au soir "hier soir" etait deja faux, et publie le 29 il l'etait deux fois.
  Le gate NE PEUT PAS le voir: "hier" ne porte aucun chiffre, aucun nom de
  produit, et la citation d'evidence de la diapo ne contient pas le jour. Meme
  famille que "en fevrier" dans le meme spec, exact mais adosse a une citation
  TechCrunch qui ne dit que "Earlier this year" (la phrase qui porte fevrier
  est chez NPR, diapo ajoutee ce matin). REFLEXE, 20 s, sur tout spec qu'on
  banque ET sur tout spec qu'on herite: grep -i "hier\|demain\|ce matin\|ce
  soir\|cette semaine\|aujourd'hui\|lundi\|mardi\|mercredi\|jeudi\|vendredi\|
  samedi\|dimanche" sur le JSON, et pour chaque touche exige une phrase source
  qui la porte. Un jour de semaine cite ("jeudi soir") est verifiable et
  survit au report; un mot relatif ("hier") pourrit des que le spec dort une
  nuit. Ecris toujours le jour, jamais le relatif.
- 2026-08-10 · Refonte nocturne, ce qui change pour un run (proof: commits du
  10/08, rebuild verifie image par image, suite 120/120). NOUVELLES COMMANDES:
  `node src/learn.mjs` a l'etape 2b (le digest des lecons, ne throw jamais);
  dimanche au 19h30, `node src/prune-media.mjs --live` puis
  `node src/insights.mjs compact` (l'entree "le depot grossit" est encodee la,
  supprimee d'ici selon la regle 1). CACHES: veo_N.mp4 et still_N.jpg portent
  un sidecar .key comme la narration, un rebuild ne rachete plus; un clip
  REFUSE au filmstrip doit etre rachete avec une action MODIFIEE (la cle
  change, le cache ne peut pas le ressusciter). DEPENSE: coupe-circuit a $6
  par jour UTC dans genmedia (OOM_DAILY_SPEND_CAP pour deroger); un timeout
  Veo laisse une ligne video-orphan dans spend.jsonl. GATE: le resultat porte
  `verifiedOnline`; un pass --offline s'affiche NOT VERIFIED ONLINE, ne le
  cite jamais comme un gate vert. Wayback en fallback de fetch est DORMANT:
  web.archive.org repond 403 x-block-reason hostname_blocked depuis cet
  egress (probe 10/08); s'active seul si Hasan l'allowliste. VISUEL: le
  compte a rebours et les sous-titres agrandis/remontes sont le design,
  pas un defaut (section frames du manuel).
  Ajout 30/08 (19h30), LE TABLEAU "BY PUBLISH HOUR" DE learn.mjs EST UN PIEGE DE
  COMPOSITION, ET RIEN NE LE MARQUE (thin). Mesure du soir sur lessons.json: il
  donne 10h n=11 mediane 477 vues contre 17h n=17 mediane 175, ce qui se lit
  comme "le creneau de l'apres-midi vaut trois fois moins" et pousserait a
  toucher au deuxieme Reel du jour. Apparie DANS LA MEME JOURNEE, sur les 26
  jours a deux Reels reglees, l'ecart disparait: mediane du 1er 193, mediane du
  2e 191, et c'est le SECOND Reel qui fait le plus de vues 16 jours sur 26 (10
  sur 17 depuis le 12/08). La cause est la composition des paniers, pas l'heure:
  le panier 10h ne contient QUE des posts posterieurs au 12/08, personne ne
  publiait le matin avant, et il porte les gros succes du compte, alors que les
  paniers 16h et 17h melangent les deux regimes. Les vues ont une queue lourde,
  donc une mediane sur n=11 bouge avec deux outliers. Un panier NON marque
  (thin) n'est donc pas pour autant un panier comparable: avant de conclure quoi
  que ce soit d'une ligne BY PUBLISH HOUR, reapparie a la journee. Controle sans
  achat: lire state/lessons.json, grouper posts par at.slice(0,10), garder les
  jours a deux entrees settled, comparer 1er contre 2e.
- 2026-07-28 · Cold container costs: npm install ~40s, ffmpeg install ~40s,
  Whisper venv bootstrap ~2min + 140MB model, first Kokoro-free run. Budget
  them before the story work, not during. Proof: journals 27-28/07.
  Ajout 05/08: un premier build complet a froid (venv Whisper + narration +
  veo + stills + captures + rendu) depasse la fenetre de 10 min d'un outil
  Bash en avant-plan: le build du 05/08 a ete TUE a l'assemblage a ~13 min.
  Lance reel2.mjs en arriere-plan (run_in_background). Un build tue apres les
  achats ne perd rien: epingle tout ce qui est sur disque avec `file` et
  relance dans le MEME dossier, le rebuild du 05/08 a coute $0.
  Ajout 21/08 (10h30), CE QUE LE SCOUT QUI EPINGLE FAIT GAGNER EN TEMPS, et
  c'est la moitie de l'economie que les entrees du 08/08 et du 12/08 ne
  comptaient qu'en dollars: un build A FROID (npm install, ffmpeg, venv Whisper
  compris) dont les 4 recus/photos etaient DEJA epingles par le scout a rendu
  COMPLIANT en ~5 min, et le run entier a publie 12 min apres son demarrage
  (10h37 -> 10h49 UTC), 19 min apres le cron. Le manuel table sur ~25 min
  jusqu'a media_publish et un atterrissage a +35 min: c'est le budget d'un run
  qui CAPTURE ses recus (famille O(frames) du 06/08, ou un seul recu de presse
  coute 8 a 12 min). Zero capture = zero attente reseau imprevisible. Mesure du
  meme build: la venv Whisper ne coute plus 2 min mais 21 s pour le modele
  large-v3-turbo (l'entree ci-dessus disait 2 min + 140 Mo). Consequence de
  planification: un run de publication qui herite d'un spec entierement epingle
  peut viser sa fenetre a 15 min pres; un run qui doit capturer ne le peut pas.
  Ajout 27/08 (10h30), DEUX PIEGES D'OUTILLAGE QUI COUTENT CHACUN UN ALLER-
  RETOUR. (1) LE REPERTOIRE COURANT DE L'OUTIL BASH PERSISTE ENTRE LES APPELS,
  et la commande de controle des frames du manuel (etape 10) commence
  justement par `cd media/<slug>`: tout appel suivant se resout alors depuis
  media/<slug>, donc `echo ... >> "$RUN_JOURNAL"` meurt sur "No such file or
  directory" et `node src/...` ne trouve plus rien. Ce n'est pas le journal qui
  a disparu. Remede: mets TOUJOURS les blocs de frames et de filmstrip dans un
  sous-shell, `( cd media/<slug> && for t in ...; done )`, le cwd revient tout
  seul. (2) NE PIPE PAS reel2.mjs DANS `tail` EN ARRIERE-PLAN: `node
  src/reel2.mjs ... | tail -80` ne rend RIEN avant la sortie du process, donc
  le fichier de sortie reste vide pendant les 6 minutes du build et un Monitor
  arme dessus ne voit aucune ligne `spend:` ni aucune `beat N:`. Redirige vers
  un fichier (`> /tmp/build.log 2>&1`) et grep dedans, ou laisse la sortie
  entiere. Ce qui suit un build reellement observable: spend.jsonl et les
  fichiers du dossier media sont, eux, ecrits au fil de l'eau et suffisent a
  suivre l'avancement (voice2.wav -> align.json/words.json -> veo_0.mp4 ->
  still_N.jpg -> reel.mp4).
  Ajout 01/09 (06h30), (3) LE JOURNAL SE DEDOUBLE A CHAQUE HEURE RONDE, et
  personne ne le voit avant `git status`: l'etat du shell ne survit PAS entre
  deux appels de l'outil Bash, donc la ligne du manuel
  `export RUN_JOURNAL="reports/journal/$(date -u +%F)-$(date -u +%H)h.md"`
  doit etre reecrite dans chaque commande -- et elle recalcule `%H`. Un run
  demarre a 06h40 ecrit donc dans -06h.md puis, des 07h00, dans un -07h.md tout
  neuf: l'enregistreur de vol du run est coupe en deux, et le second fichier n'a
  ni en-tete ni les etapes precedentes. Mesure de ce matin, 2 fichiers pour un
  seul run. Remede: fige l'heure de DEMARRAGE une fois et recopie la constante
  (`RUN_JOURNAL=reports/journal/2026-09-01-06h.md`) dans chaque appel, plutot
  que de re-evaluer `date`. Si ca arrive quand meme, `cat le-07h >> le-06h` puis
  `rm` avant de lander: un run, un fichier.
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
  Ajout 24/08 (10h30), LE 503 DU SERVEUR DE SIGNATURE, a ne pas confondre avec
  un conflit: le premier `land.mjs` du run est mort sur `Error: signing failed:
  signing server returned status 503 (95-byte body)` puis `fatal: failed to
  write commit object`. Rien n'etait commite, rien n'etait pousse, et la MEME
  commande relancee telle quelle a rendu `landed and proven` du premier coup.
  Ce n'est ni REAL CONFLICT ni la suite rouge: c'est le hook de signature de
  l'environnement qui tousse (famille de la toux blog.google du 19/08). Relance
  une fois avant de diagnostiquer quoi que ce soit, et ne touche surtout pas a
  git a la main. Mesure: 3 landings ce run, 1 seul 503, sur le premier.
  Ajout 08/08 (06h30), LE HOOK DE FIN DE SESSION MENT, et sa consigne est un
  piege: il imprime "There are N unpushed commit(s) on branch claude/<...>.
  Please push these changes". C'est FAUX apres un land.mjs reussi. Il compare la
  branche de travail a origin/claude/<...>, donc il compte les
  commits de land.mjs comme non pousses alors qu'ils sont deja sur origin/main
  et prouves. CORRECTION 18/08 (10h30) sur le mecanisme, la conclusion ne bouge
  pas: cette entree disait que origin/claude/<...> "n'existe pas". Mesure ce
  jour-la, il EXISTE et il est PERIME (il pointait 32c8e43, le commit du scout
  de 06h30, soit 4 commits de retard), parce que land.mjs avance origin/main
  sans jamais deplacer la branche laterale. Le hook lit cet ecart comme du
  travail non pousse. Les deux cas donnent le meme verdict et la meme preuve en
  5 s: `git rev-parse HEAD` == `git rev-parse origin/main` et
  `git log origin/main..HEAD` vide; en plus fin,
  `git merge-base --is-ancestor <sha> origin/main` sur chacun des N commits
  cites rend 0. Ne pousse toujours PAS la branche laterale. Verifie en 5 s avant de toucher a quoi que ce soit:
  `git rev-parse HEAD` et `git rev-parse origin/main` rendent le MEME sha, et
  `git log origin/main..HEAD` est vide. Ne pousse PAS la branche laterale: le
  prochain run clone la branche par defaut, tout y est deja, et un ref de plus
  vers des commits deja dans main ne sauve rien (voir le 30/07). Meme traitement
  que le hook "Unverified": une ligne dans le rapport, et on passe.
  Ajout 21/08 (06h30), QUATRE RECUS MESURES PAR LE SCOUT, HORS MOTEUR, ET
  EPINGLES: le replica de screenshotOnce (meme contexte 430x932 dSF3, meme
  `ctx.route` fulfill par fetch Node, meme `proxy`, memes deux passes de
  consentement) tourne tres bien depuis le scratchpad A CONDITION d'importer
  playwright par chemin ABSOLU (`/home/user/ig-autopilot/node_modules/playwright/
  index.mjs`): l'ESM resout depuis le fichier importateur, pas depuis le cwd, donc
  un script pose hors du depot rend ERR_MODULE_NOT_FOUND. Chromium est a
  /opt/pw-browsers/chromium-1194/chrome-linux/chrome. Mesures du matin, une
  capture a la fois (regle du 14/08): cisa.gov/news-events/cybersecurity-advisories/
  <alerte> NOUVEAU, propre du PREMIER coup en 65 s, 3 frames au goto, zero pub,
  zero banniere cookies, aucun recadrage: sceau CISA, "CYBERSECURITY ADVISORY",
  titre entier, "Release Date", "Alert Code" ET le debut de l'executive summary
  dans le cadre 9:16. pewresearch.org (data-labs et /methodology/) NOUVEAU,
  propres du premier coup en 35 s et 39 s, 1 SEULE frame au goto, et ils
  rejoignent epoch.ai (17/08), PubMed (08/08) et arxiv /abs (16/08) dans la
  categorie "recu qui porte la preuve": le cadre tient le titre, les cinq
  auteurs, la date ET les phrases chiffrees ("a random sample of 10,000
  webpages", "490,000 pages", "an AI detection tool called Open Pangram").
  cyberscoop.com NOUVEAU, propre aussi mais 7 frames au goto et 132 s (famille
  O(frames) du 06/08, il SURVIT): masthead, rubrique THREATS, titre entier,
  chapo, signature, date ET une photo d'automate en armoire; il garde en bas un
  bandeau promo "Get our latest cybersecurity news first on Google / CLICK
  HERE!" que les deux passes ne retirent pas, `crop=1290:2293:0:0` le coupe. Les
  QUATRE passent le controle du 10/08 (le titre affiche EST l'histoire). Cout
  total: 4 min et 0 $, et les quatre sont epingles avec `file`, donc le run de
  publication ne capture plus rien (mecanique du 17/08).
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
  Ajout 21/08 (19h30), LE VOCABULAIRE DISPONIBLE DEPEND DE LA CASSE DE TES
  CITATIONS, et ca surprend: `storyVocab` retire les NOMS PROPRES, reperes par
  les majuscules dans centralClaim + evidence. Donc une citation qui recopie une
  accroche publicitaire en Title Case ("95% Sleep Staging Accuracy Compared to
  clinical sleep lab") transforme sleep, accuracy, ring et stag en noms propres
  et les SUPPRIME du vocabulaire: un beat "a phone screen showing a simple sleep
  graph" a ete refuse pour "ne partage aucun mot avec les sources" sur un dossier
  ou le mot sommeil est partout. Remede: vise un nom commun que la source ecrit
  en minuscules (finger, sensor, brain, clinical, night, patient, measure), et
  liste-les avant d'ecrire les specs, en 10 s:
  `node --input-type=module -e "import {tokens} from './src/state.mjs'; import {namedActors} from './src/validate.mjs'; ..."` ou plus simplement lis la liste
  que le message d'erreur du gate imprime. Ajout 27/08 (06h30), LA PRECISION QUI
  M'A COUTE UN ALLER-RETOUR DE GATE SUR 4 BEATS D'UN COUP: `storyVocab` est bati
  sur TES CITATIONS D'EVIDENCE, pas sur les pages sources. Un spec "a single
  sealed metal container" a ete refuse sur un dossier ou la page METR ecrit
  pourtant "hack out of their container", parce que cette phrase-la n'etait dans
  aucune de mes evidences. Donc sur une actu 100% NUMERIQUE (pas d'objet
  physique dans l'histoire), choisis les sujets de stills DANS le texte de tes
  citations, pas dans ton souvenir de l'article: ici messages, board,
  transcript, files, internet, screen, monitoring, assessment, selfie,
  fingerprint. ET LE PIEGE INVERSE, celui que le commentaire du code annonce et
  que personne ne verifie: mon beat 0 veo passait sur le mot "another" (venu de
  "one another"), donc sur un CONNECTEUR et pas sur un sujet. Le gate etait vert
  et l'image ne montrait toujours rien de l'histoire. Apres avoir passe le gate,
  relis quel mot a fait le match: si c'est another/before/across/about, ton
  image est encore du mobilier. ET LE COROLLAIRE, sur les noms
  versionnes: le controle "la narration nomme X, absent des citations" fait un
  `includes` SENSIBLE A LA CASSE sur l'evidence, alors que la verification en
  ligne de la citation, elle, passe tout en minuscules. Une citation recopiee
  depuis le texte aplati (donc en minuscules) revient VERIFIED et fait quand meme
  echouer "Oura Ring 5". Recopie les citations avec la casse de la PAGE, pas
  celle du flatten.
  Ajout 30/08 (06h30), LE MOT D'ANCRAGE LE PLUS EVIDENT D'UNE ACTU D'OUTIL IA
  EST INVISIBLE AU FILTRE, et c'est le cas "racine trop courte" du 01/08 sur le
  mot qu'on ecrira le plus souvent: **"coding"**. Les sources ecrivent "the AI
  coding tool", "the AI coding startup", "the coding tool Windsurf", donc le
  mot est partout dans l'histoire ET dans mes citations - mais sa racine est
  "code", 4 lettres, donc il ne compte JAMAIS. Deux specs (le beat 0 veo et la
  still de chute) refuses d'un coup "shares no word with the sources" sur un
  dossier ou tout le monde code. Meme famille que "packed"/"pack" (01/08), sauf
  que la, le mot semble long. Mots surs mesures sur ce dossier (annonce
  d'entreprise, aucun objet physique dans l'histoire, cas du 09/08): contract,
  model, filing, financial, extension, announcement, acquisition, technology,
  service, billion. Remede accepte du premier coup, deux fois: remplacer
  l'ecran "de code" par un ecran "de contrat" ("a computer monitor showing the
  plain grey lines of a contract page on a white background", action "the grey
  contract lines sliding slowly downward"), ce qui est en prime plus fidele a
  l'histoire (OpenAI resilie un CONTRAT). Reflexe: sur une actu d'outil de
  developpement, n'ancre jamais sur code/coding, ancre sur le document.
  Ajout 30/08 (10h30), L'ANCRE PEUT ETRE UN HOMONYME ET LE GATE NE VOIT PAS LA
  DIFFERENCE, famille du connecteur "another" du 27/08 mais plus dure a
  reperer parce que le mot est un vrai nom commun du sujet. Le beat 0 veo du
  dossier Sony/Warner ("a single black vinyl record turning on a plain
  turntable") est passe sur **record**, et record n'entre dans storyVocab que
  par la citation "settling that case for a record-setting $1.5 billion",
  donc par l'ADJECTIF anglais, pas par le disque. Le gate etait vert et
  n'attestait rien du sujet. Ici l'image etait quand meme dans l'histoire (des
  chansons, des editeurs de musique) et elle a rendu propre, mais le controle
  d'apres-gate n'est plus seulement "est-ce que le mot qui a matche est un
  connecteur": c'est "est-ce que ce mot veut dire dans mon spec ce qu'il veut
  dire dans la phrase source". Doubles sens deja croises sur ce seul dossier:
  record, ring, paper, tiger, eye. Imprime le vocabulaire ET relis la citation
  d'ou vient ton ancre. Proof: run 10h30 30/08.
  Ajout 30/08 (10h30), SIXIEME CONFIRMATION DE LA ROTATION SUR PLACE (12/08,
  17/08 x2, 22/08, 28/08), et une recette de beat 0 pour toute actu de MUSIQUE
  ou de droits d'auteur musicaux: subject "a single black vinyl record turning
  on a plain turntable" + action "turning slowly in place, the record staying
  whole, the same size and fully inside the frame the entire time" + camera
  "locked-off static shot, no camera movement, no zoom" + composition "macro
  framing, the record fills most of the frame" + setting "in soft even
  daylight". Accepte DU PREMIER COUP, $0,96 (clip 8 s 1080p, beat de 25 mots
  donc au-dessus du seuil des ~24 mots du 21/08), pellicule 8 vignettes lue:
  meme objet, meme taille, present a la 8e, l'etiquette blanche tourne
  visiblement, zero deformation. Le disque est un objet RIGIDE et l'aiguille
  fabrique le hors-champ de l'action non resolue. Note que le rendu est sorti
  SOMBRE malgre "soft even daylight" (un disque noir reste noir): ce n'est pas
  un defaut, la carte-titre blanche sur bande noire s'y detache tres bien.
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
  Ajout 11/08 (22h), LE PIEGE DE MAJUSCULE FRAPPE UN MOT CENTRAL, dossier eclipse:
  "solar" est ABSENT de storyVocab alors que l'histoire ne parle que de ca, parce que
  les citations portent "Solar retinopathy is a well-recognised..." EN DEBUT DE PHRASE
  (majuscule = nom propre pour namedActors, exactement le cas "Software" du 10/08).
  Donc un spec veo disant "solar filter" est a la fois inutile (le mot ne compte pas)
  et RISQUE (le controle "le spec ne nomme personne du post" matche par mot). Mots surs
  mesures sur ce dossier: eclipse, filter, retina, scotoma, sunlight, sunglass, macular,
  totality. Remede applique: "close-up on the dark filter lenses", accepte du premier
  coup avec 2 ancres (eclipse + filter). Imprime toujours le vocabulaire ENTIER d'abord.
  ET UN CAS DE CHIFFRE NOUVEAU, meme famille que la virgule decimale du 08/08: un nombre
  ECRIT EN TOUTES LETTRES DANS LA SOURCE n'est pas un chiffre pour le gate. Le Lancet
  ecrit "four patients were still symptomatic after 7 months", donc une `card` de valeur
  "4 sur 45" est refusee ("figure(s) 4 appear in no evidence quote") alors que 45 et 7
  passent. Sur une carte, ancre-toi sur un chiffre que la source ecrit EN CHIFFRES:
  "7 mois" + label "quatre patients avaient encore des symptomes" est passe du premier coup.
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
  Ajout 12/08 (10h30), L'ACTION VEO LA PLUS SURE EST UNE ROTATION SUR PLACE, et elle
  resout le cas "l'histoire n'a aucun moment filmable". Dossier reconnaissance
  faciale: `subject` "a black dome camera on top of a tall metal pole" + `action`
  "slowly rotating in place, the dome staying whole and in frame" + `composition`
  "close-up from below" a rendu PROPRE du premier coup, $0,96, pellicule 8 vignettes
  lue: meme objet, meme taille, present a la 8e, une seule rotation. Pourquoi c'est
  generalisable: une rotation ne fait entrer le sujet dans RIEN (la famille a risque
  du 03/08), elle n'a aucun etat final a atteindre, et "staying whole and in frame"
  nomme en positif ce qui doit rester vrai (regle 3). En prime elle FABRIQUE l'action
  non resolue que le manuel demande au beat 0 alors que l'histoire (un deploiement,
  un reglement) ne contient aucun evenement: l'objectif finit par arriver face
  camera, donc le spectateur reste pour voir ou ca regarde. Reflexe: sur une actu de
  surveillance, de capteur ou de machine qui observe, filme l'objet qui TOURNE,
  pas la scene. ECONOMIE MESUREE le meme jour: Reel entier a $0,99 (1 narration
  $0,027 + veo $0,96, ZERO still achetee) parce que le scout de 06h30 avait
  telecharge, recadre et epingle 4 photos Commons + 2 recus. Re-confirme le 08/08:
  un scout qui epingle est la ligne la moins chere du budget.
  Ajout 12/08 (16h30), LE PIEGE DE MAJUSCULE A SON CAS EXTREME: sur une actu de
  FONCTION DE PRODUIT, le nom de la fonction est capitalise dans le primaire, donc
  namedActors mange TOUT le sujet de l'histoire. Dossier Pixel Watch 5: les citations
  portent "Blood Pressure Trends", "Insulin Resistance", "Breathing Emergency
  Detection", donc blood, pressure, insulin, resistance, trend, breath, emergency ET
  detection sont TOUS retires du vocabulaire; "watch" tombe aussi (Pixel Watch 5). Un
  spec "a printed blood pressure chart" est refuse "shares no word with the sources"
  sur une histoire qui ne parle que de tension. Ce n'est plus l'exception Solar/
  Software/Music du 07 au 11/08, c'est la REGLE des que la boite a donne un nom
  commercial a la chose: attends-toi a perdre le vocabulaire central, pas un mot
  isole. Ce qui a survecu et a servi: sensor, pulse, wrist, oxygen, heart, sleep,
  health, monitor, motion, saturation, smartwatch. Les 3 specs qui sont passes du
  premier coup et ont RENDU PROPRE: veo "a wrist with a small green sensor light
  glowing against the skin" + action "slowly rotating in place, the green sensor light
  staying whole and in frame" (rotation re-confirmee 2e jour d'affilee, pellicule 8
  vignettes: meme objet, meme taille, present a la 8e); still "a printed health report
  page filled with columns of numbers" (recette du 09/08, "health" est l'ancre);
  still "a laptop screen filled with A SINGLE COLUMN of heart rate numbers". La
  premiere version disait "rows of" et a ete refusee comme scene a objets multiples,
  la formule "a single column of" du 10/08 passe. Imprime le vocabulaire ENTIER en
  10 s avant d'ecrire un spec: tokens(centralClaim + evidence) MOINS
  tokens(namedActors(...)), namedActors est exporte par validate.mjs, pas state.mjs.
  Ajout 14/08 (16h30), FAMILLE DE PIEGE NEUVE, LE MOT TECHNIQUE QUI A UN SENS COURANT
  PLUS GROS, et elle est plus dangereuse que toutes les precedentes parce qu'elle
  passe TOUS les controles: gate vert, promptIssues vide, simplicityIssues vide,
  vocabulaire ancre. Dossier trois IA / turf war: le spec "a printed MIGRATION report
  page filled with columns of numbers" (l'histoire parle de migrer un backend Python
  vers un autre langage) a rendu une page titree "MIGRATION REPORT 2023-2024" avec les
  colonnes ORIGIN / DESTIN / AGE et les valeurs SYR, TUR, EUR: un tableau de MIGRATION
  HUMAINE, refugies syriens vers la Turquie et l'Europe, lisible en plein cadre pendant
  8,2 s sur une actu d'agents logiciels. Le modele d'image ne connait pas ton contexte,
  il prend le sens majoritaire du mot. Rien ne le voit sauf le REGARD sur still_N.jpg.
  Mots de cette famille a ne jamais mettre dans un spec sans y penser deux fois:
  migration, deportation, asylum, execution, termination, kill, raid, strike, invasion,
  attack, casualty, victim, refugee, native. Remede applique, $0,13 et un rebuild a
  cout nul (narration + veo + 2 stills re-servies par leur .key): "a printed PROCESS LOG
  page filled with columns of numbers" a rendu du premier coup des feuilles de releve
  a colonnes TIMESTAMP / VALUE / STATUS, zero prose inventee, zero date qui vieillit.
  Regle: quand le mot central de ton spec est un terme de metier, demande-toi ce que
  Google Images en ferait, et prefere le mot le plus betement informatique (process,
  log, script, code, terminal). Proof: run 16h30 14/08, still_5 refuse puis rachete.
  Ajout 16/08 (10h30), DEUX RENDUS RATES SUR LE MEME BEAT, dossier livres IA, et le
  second est un piege d'EPOQUE DANS UNE STILL GENEREE (toutes les entrees "epoque" de
  ce carnet parlaient de `photo`). (1) "a laptop screen filled with a single column of
  REVENUE numbers" a rendu un tableur Excel dont la colonne A est remplie de
  MARQUES DE REMPLISSAGE ("--.0-..", "--,---.--") sur ~15 lignes, avec un en-tete
  invente "Generic Revenue": ce n'est pas la prose inventee du 01/08, c'est pire, ca
  a l'air CASSE. La recette du 10/08 ("a single column of ... numbers") ne suffit donc
  pas sur un ecran quand le mot central est un terme COMPTABLE: revenue/sales/budget
  appellent une appli tableur, et un tableur genere se remplit de cellules vides.
  (2) Corrige en "a printed revenue LEDGER page filled with columns of numbers": vrais
  chiffres manuscrits, mais un registre ANCIEN jauni, ecrit a la main, avec la date
  "14.11.23" repetee sur ~40 lignes, sur une actu 2026 d'edition numerique. Le mot
  "ledger" porte l'anciennete a lui seul. (3) CE QUI PASSE, et c'est le mot du 09/08
  inchange: "a printed revenue REPORT page filled with columns of numbers" a rendu du
  premier coup un etat imprime moderne, chiffres et pourcentages reels (dont un -8%),
  en-tetes Q1/Q2/Q3, zero prose, zero marque, AUCUN millesime. Regle: sur un chiffre
  d'argent, ecris "report page", jamais "ledger" (epoque) ni un ECRAN (cellules vides),
  et fais varier la LUMIERE et l'ANGLE plutot que le mot pour distinguer deux stills de
  document (still_3 lampe de bureau oblique / still_6 lumiere du jour vue de dessus:
  deux familles visuelles distinctes avec le meme sujet). Cout de la lecon: $0,385 pour
  un beat, 3 achats. Le rebuild, lui, est gratuit si tu EPINGLES les recus avec `file`
  (chemin depuis la racine): les 2 captures, le veo, la narration et still_3 ont ete
  reservis, seul still_6 a ete rachete. Proof: run 10h30 16/08, still_6 refuse 2 fois.
  Ajout 17/08 (10h30), LE BALAYAGE DE LUMIERE DU 15/08 BRULE UN SUJET COUVERT DE TEXTE,
  et c'est une CORRECTION de cette recette, pas un cas nouveau. Le spec veo "a single
  printed survey report page filled with columns of numbers" + action "tilting slowly so
  the light sweeps across the page, the page staying whole and in frame" + setting
  "bright editorial daylight" a rendu une pellicule ou la page se DELAVE en un aplat
  blanc sans relief des la 6e vignette: les colonnes de chiffres ont disparu, et les
  chiffres des premieres vignettes etaient EN MIROIR par-dessus. La formule marchait le
  15/08 sur un filigrane parce que l'objet etait LISSE; sur une feuille couverte de
  texte, le balayage crame la seule chose qui portait l'information. Clip REFUSE a la
  pellicule, $0,60. Remede rendu PROPRE du premier coup, meme sujet, $0,60: action
  "slowly rotating in place on the table, the columns of numbers staying sharp and in
  frame" + setting "on a plain table in soft even daylight" + composition "seen from
  directly above, the page fills the entire frame". La rotation du 12/08 se re-confirme
  une TROISIEME fois, et deux mots font le travail: "soft even daylight" (jamais bright
  des que le sujet porte du texte) et "seen from directly above" (la face de la page ne
  peut pas sortir du cadre). Regle: sur un sujet PORTEUR DE TEXTE, ne demande jamais un
  balayage de lumiere, demande une rotation vue de dessus. Proof: run 10h30 17/08,
  veo_0 refuse a la pellicule puis rachete, build 2 COMPLIANT.
  CORRECTION 17/08 (16h30), ET ELLE COUTE $2,88: LA ROTATION VUE DE DESSUS NE SAUVE PAS
  UNE FEUILLE, ne la generalise pas depuis le matin. Meme dossier de document (page de
  rapport imprimee), DEUX pellicules refusees d'affilee, DEUX modes de defaillance
  DIFFERENTS. (1) "slowly rotating in place, the columns of numbers staying sharp":
  la page GONFLE et deborde du cadre, delavee en blanc des la 5e vignette. Cause
  trouvee et c'est un FAIT NOUVEAU ET GENERALISABLE: veoPrompt injecte la camera de
  l'humeur, et `tension` porte "slow dolly-in". Un dolly-in + un sujet qui remplit deja
  le cadre = un sujet qui sort du cadre, quel que soit ce que dit `action`. LE REMEDE
  EST UN CHAMP DE SPEC QUE PERSONNE N'AVAIT UTILISE: `camera` est accepte par
  veoPrompt et REMPLACE la camera de l'humeur. "locked-off static shot, no camera
  movement, no zoom" a supprime le gonflement du premier coup. Pense-y sur tout beat 0
  ou le sujet remplit le cadre. (2) Le gonflement corrige, la MEME rotation a fait
  BOUILLONNER la feuille: elle se gondole, se plie et se delite en bouillie illisible
  des la 4e vignette, les colonnes disparaissent. Une feuille de papier est un objet
  MOU: Veo lui invente une physique de tissu des qu'elle tourne. Aucune formulation de
  `action` n'a rattrape ca. (3) CE QUI EST PASSE DU PREMIER COUP, et c'est la vraie
  lecon: ABANDONNE LE PAPIER, PRENDS UN OBJET RIGIDE ET METS LE MOUVEMENT DANS SES
  PIXELS. subject "a laptop screen filled with a single column of flagged transcript
  numbers" + action "the column of numbers sliding slowly downward, the screen staying
  whole and in frame" + camera "locked-off static shot, no camera movement, no zoom" +
  setting "on a plain desk in soft even daylight": pellicule 8 vignettes lue, meme
  objet, meme taille, present a la 8e, zero deformation, et les lignes qui passent au
  ROUGE en defilant fabriquent l'action non resolue que le manuel demande. Un ecran ne
  peut ni se gondoler ni se delaver, et le texte minuscule se lit comme de la notation.
  Regle: sur une actu de RAPPORT ou d'ANNONCE (aucun moment filmable), le beat 0 sur
  est un ECRAN RIGIDE dont le CONTENU bouge, jamais un document qu'on manipule.
  Proof: run 16h30 17/08, 3 achats veo a $0,96, pellicules 1 et 2 refusees, 3 acceptee.
  Ajout 17/08 (16h30), DEUX MOTS DE PLUS QUI RATENT UNE STILL, meme famille que
  "ledger" (16/08) et "names" (15/08). (1) "LOG" ramene un REGISTRE MANUSCRIT: le spec
  "a printed vendor access LOG page filled with columns of numbers" a rendu un cahier
  jauni, ecrit a la main, avec des symboles de livre sterling, sur une actu 2026 -
  exactement le piege d'epoque de "ledger". "report page" a la place a rendu du premier
  coup un etat imprime moderne. Le mot sur reste REPORT, quelle que soit la tentation.
  (2) "CHECKBOXES" ramene l'ecriture inventee: "a printed screening checklist page
  filled with a single column of CHECKBOXES" a rendu des cases cochees accompagnees de
  gribouillis manuscrits qui imitent une ecriture etrangere illisible. La regle du
  15/08 disait "jamais un mot qui designe du LANGAGE (names, labels, titles)"; ajoute
  checkbox, checklist et form: des qu'une case attend une etiquette, le modele ecrit
  a cote. "a printed screening report page filled with columns of numbers" est passe.
  Cout des deux: $0,26 et un rebuild. Proof: run 16h30 17/08, still_3 et still_6.
  Ajout 20/08 (06h30), LA VIRGULE DECIMALE FRANCAISE TUE UN CHIFFRE VRAI, et
  c'est la variante inverse du nombre en toutes lettres du 11/08. Le gate
  normalise les separateurs de MILLIERS dans les deux sens (3 700 matche
  "3,700", 600 000 matche "600,000", 1 000 matche "1,000", mesure 3 fois sur le
  meme post), mais PAS la virgule DECIMALE: "7,5 millions" ecrit en face du
  "7.5 million" de la source revient `figure(s) 75 appear in the body but not in
  the evidence quote`, et "11,1 milliards" en face de "11.1 billion" revient
  `111`. Le manuel dit deja "ne re-ponctue jamais une decimale"; ce qui manquait
  est la SIGNATURE: un nombre COLLE (75, 111) introuvable tel quel dans la
  source, et on perd dix minutes a relire la page en cherchant une coquille qui
  n'existe pas. Ecris la decimale comme la source l'ecrit, point compris, meme
  en francais. ET LE PLAFOND DE `figure`, mesure le meme matin: 6 caracteres au
  maximum sur une diapo stat, donc "11 milliards" (12) est refuse; mets le
  numeral nu dans `figure` et le mot de grandeur dans `unit`.
  Proof: gate 06h30 20/08, 5 erreurs au premier passage, 0 au second.
  Ajout 22/08 (10h30), LA ROTATION SURVIT A UN SUJET MOU S'IL EST DANS UN
  CONTENANT RIGIDE, et ca precise le "ABANDONNE LE PAPIER" du 17/08 16h30 au
  lieu de le contredire. Ce qui avait bouilli ce jour-la etait une feuille NUE
  posee sur une table: Veo lui inventait une physique de tissu des qu'elle
  tournait. Mesure de ce matin, dossier peau vivante, PREMIER coup, $0,96,
  pellicule 8 vignettes lue: subject "a small round piece of pale human tissue
  resting in a shallow glass dish of clear liquid" + action "turning slowly on
  the spot, the piece of tissue staying whole and fully in frame the entire
  time" + camera "locked-off static shot, no camera movement, no zoom" +
  composition "macro framing, the dish fills the entire frame". Meme objet, meme
  taille, present a la 8e vignette, zero deformation; le liquide ondule, ce qui
  est la bonne physique et fabrique en prime l'action non resolue. La regle
  utile n'est donc pas "jamais de sujet mou" mais: un sujet mou a besoin d'un
  BORD RIGIDE qui le tient dans le cadre (boite de Petri, cadre, boitier). La
  rotation sur place se re-confirme pour la QUATRIEME fois (12/08, 17/08 x2,
  22/08). Proof: run 10h30 22/08, veo_0 accepte du premier coup.
  Ajout 22/08 (16h30), LA STILL QUI INVENTE UN CHIFFRE, ET C'EST LA PIRE DE LA
  FAMILLE "prose inventee" (01/08) PARCE QUE LE COMPTE PROMET QUE CHAQUE CHIFFRE
  EST CITE. Le spec "a small screen showing one large percentage figure" a rendu
  un panneau mural affichant **84%** en enorme, plein cadre pendant 3,7 s, sur
  une actu dont tous les pourcentages reels sont 95, 79 et 53.18. Gate vert
  (percentage et figure sont dans storyVocab), promptIssues vide,
  simplicityIssues vide, COMPLIANT: SEUL le regard sur la frame l'attrape, et un
  spectateur lit 84% comme un chiffre de l'histoire. REGLE: ne demande JAMAIS a
  une still un chiffre ISOLE (a percentage figure, a large number, a score, a
  rating) - le modele en invente un et il a l'air d'une affirmation. La recette
  du 10/08 reste la bonne et elle marche parce qu'une COLONNE se lit comme de la
  notation, pas comme un titre: remede accepte et rendu propre du premier coup,
  "a laptop screen filled with a single column of heart rate numbers" + "on a
  plain desk in soft even daylight" + "macro framing, the screen fills the entire
  frame" (colonne 114...144, zero pourcentage, zero prose). Cout $0,1289 et un
  rebuild gratuit (narration, alignement, veo et les 3 autres stills re-servis
  par leur .key). Un chiffre sur une `card` vient de l'evidence; un chiffre dans
  une still generee ne vient de nulle part. Proof: run 16h30 22/08, still_1
  refuse puis rachete.
  Ajout 25/08 (10h30), LA RECETTE "COLONNE = NOTATION" NE S'ETEND PAS AUX PRIX,
  et c'est la nuance qui a failli publier 300 chiffres inventes. Le spec "a
  printed page holding a plain grid of product price numbers, every cell a
  number" a rendu une page de ~30 lignes x 10 colonnes de prix parfaitement
  lisibles (14.99, 29.50, 112.00, 73.95...), plein cadre 6,2 s, sur une actu
  dont les seuls prix reels sont 49.99, 79.99, 109.99, 149.99, 84.99 et 799.99.
  Gate vert, promptIssues vide, COMPLIANT: seul le regard sur la frame l'attrape.
  Un rythme cardiaque en colonne (10/08) se lit comme de la notation parce qu'il
  n'a ni unite ni decimale; UN PRIX EST UNE AFFIRMATION, il porte le $ et les
  centimes, et un spectateur lit la grille comme le tarif d'Amazon. REGLE, qui
  elargit celle du 22/08: pas de chiffre isole, ET pas de TABLEAU de chiffres
  qui portent une unite (prix, montants, tarifs, factures). Meme run, la
  variante papier du meme piege: "a single printed price ticket lying flat"
  rend une soupe de glyphes (@&%$XX#, XOXOOXO, 8888 0000 88) qui se lit comme
  un graphisme corrompu, sur la CHUTE en plus. La famille "document imprime
  porteur de texte" (page de prix, ticket, facture, etiquette, bon) n'a AUCUNE
  variante sure: ne la demande pas, prends une vraie photo de l'objet. Remede
  gratuit et meilleur ce jour-la: les deux stills remplacees par des `photo`
  reelles (plaquette de silicium Openverse pour la mémoire, et bookend sur la
  vraie photo Echo Dot deja epinglee), donc 0 $ de rachat et 7 surfaces reelles
  sur 9 au lieu de 5. Proof: run 10h30 25/08, beats 4 et 8 refuses au controle
  des frames puis remplaces, spend inchange a $1.3753.
  Ajout 25/08 (10h30), PHOTO D'UN PRODUIT GRAND PUBLIC, LES DEUX ECHECS
  SYMETRIQUES: "kindle paperwhite" a fait echouer TOUS les candidats sur le
  filtre near-white (31% et 57% de blanc: ce sont des detourages sur fond blanc,
  la famille du 30/07), et "kindle e-reader" a rendu 200 mais une liseuse posee
  a cote d'une tasse et d'une paire de lunettes, soit exactement "le bureau a la
  place de l'histoire" du manuel, refusee au controle des frames. Sur un produit
  grand public, les index ouverts n'ont souvent QUE ces deux familles (fiche
  produit detouree / scene de vie), aucune des deux publiable: teste la requete
  avec `imagery.mjs candidates` ET regarde la frame, et si les deux echouent,
  reutilise une photo deja epinglee du meme objet en `file` plutot que de
  generer. Proof: meme run, beat 8.
  Ajout 26/08 (16h30), LE BEAT 0 VEO SUR UNE VOITURE, la famille que le manuel
  dit la plus risquee ("un malformed car suffit a faire rayer le compte"), REND
  PROPRE DU PREMIER COUP AVEC UN TRAVELLING LATERAL VERROUILLE. Dossier Waymo:
  subject "a single autonomous vehicle" + action "turning slowly around a street
  corner, the whole vehicle staying whole and fully in frame the entire time" +
  camera "locked-off static shot, no camera movement, no zoom" + setting "on a
  quiet empty European city street in soft even daylight" + composition "medium
  side shot from the pavement". Pellicule 8 vignettes lue: meme objet, meme
  taille, present a la 8e, zero deformation, carrosserie et roues coherentes,
  $0,60 (clip de 6 s, le moteur achete a la duree du beat). DEUX FAITS A
  RETENIR. (1) LE `camera` EXPLICITE EST CE QUI SAUVE LE PLAN, re-confirmation
  directe du 17/08 16h30: l'humeur `tension` injecte "slow dolly-in", et un
  dolly-in sur un vehicule qui traverse deja le cadre est la recette du sujet
  qui gonfle et sort. Sur tout beat 0 dont le sujet SE DEPLACE, ecris `camera`,
  ne laisse pas l'humeur decider. (2) VEO N'A PAS HONORE LE VIRAGE: il a rendu
  un passage lateral rectiligne devant une facade fixe, pas une rotation a
  l'angle. La simplification est coherente (le sujet reste entier, l'action
  reste non resolue) donc le plan est accepte, mais ne compte pas sur une
  trajectoire complexe: ce qui est fiable sur un vehicule, c'est qu'il TRAVERSE
  le cadre devant un fond immobile. Ecris l'action de facon que la version
  simplifiee reste vraie. Proof: run 16h30 26/08, veo_0 accepte du premier coup.
  Ajout 28/08 (17h30), LE MOT "CAMERA" TOUT SEUL RAMENE UN REFLEX, PAS UNE
  CAMERA DE SURVEILLANCE, famille du 14/08 ("migration") et elle passe TOUS les
  controles: gate vert, promptIssues vide, simplicityIssues vide, vocabulaire
  ancre sur camera. Le spec "a single black camera housing seen from below
  against a plain sky" a rendu un APPAREIL PHOTO PROFESSIONNEL sur trepied, vu
  de dos, boitier et molettes lisibles, sur une actu de surveillance policiere.
  Le modele prend le sens majoritaire du mot. SEUL le regard sur la frame
  l'attrape. Remede mesure, $0,129 et rebuild a cout nul (narration,
  alignement, veo et 2 stills re-servis par leur .key): ecrire les DEUX mots,
  "a single black SURVEILLANCE camera fixed to a brick wall" + composition
  "macro framing, the surveillance camera fills the entire frame", rendu propre
  du premier coup, un vrai dome mural. Le beat 0 veo du meme Reel disait deja
  "surveillance camera" et n'avait, lui, jamais rate. Regle: dans un spec, ne
  laisse jamais "camera" seul, colle-lui toujours "surveillance".
  ET UNE PRECISION SUR L'EPINGLAGE D'UN RECU: epingler une capture deja prise
  avec {"type":"file"} la fait compter comme une STILL et plus comme une
  surface reelle, donc le gate refuse "only 2 beat(s) show something real - the
  floor is 3". Un recu se laisse en `screenshot` (il se recapture, ~7 s ici),
  l'epinglage `file` est pour les PHOTOS. Mesure: run 17h30 28/08.
  Ajout 28/08 (16h30), NE RECONSTRUIS PAS storyVocab A LA MAIN, LIS LA LISTE QUE
  LE GATE IMPRIME. Les entrees ci-dessus donnent la formule locale
  tokens(centralClaim+evidence) MOINS tokens(namedActors(...)). Mesure de ce
  soir: cette formule est PLUS LARGE que celle du gate. Elle m'a rendu 48 mots
  dont airlin, flight, hotel, available, describe, choice, international; le
  gate refusait deja airlin (mange par "American Airlines"/"LATAM Airlines"),
  flight ("Flight price tracking" en debut de phrase), hotel ("Hotel booking..."),
  available ("Available in all supported..."). Un beat 0 veo bati sur "a single
  airline cabin window" est donc parti au gate et a ete refuse "shares no word
  with the sources" alors que mon controle local le disait ancre. La liste
  FIABLE est celle du message d'erreur du gate (18 mots, ordre alphabetique):
  fais un premier passage de gate expres pour la lire. La reconstruction locale
  coute le meme aller-retour ET donne une fausse assurance.
  Ajout 28/08 bis, LE GLOBE QUI TOURNE, recette pour une actu de DISPONIBILITE
  MONDIALE (service ouvert dans N pays, deploiement, exclusion geographique),
  famille "aucun moment filmable" du 09/08: subject "a single world globe on a
  plain stand" + action "turning slowly in place, the globe staying whole and
  fully in frame the entire time" + camera "locked-off static shot, no camera
  movement, no zoom" + composition "macro framing, the globe fills the entire
  frame". Accepte du premier coup, $0,96, pellicule 8 vignettes lue: meme objet,
  meme taille, present a la 8e, zero deformation, et AUCUNE etiquette de pays
  lisible (donc pas la prose inventee qu'une carte aurait ramenee). Il s'ancre
  sur "world", presque toujours disponible via "around the world", et il depeint
  litteralement la phrase source. La rotation sur place se re-confirme pour la
  CINQUIEME fois (12/08, 17/08 x2, 22/08, 28/08). Proof: run 16h30 28/08.
  Ajout 31/08 (10h30), LE BEAT 0 D'UNE ACTU DE VOITURE AUTONOME: NE FILME PAS LA
  VOITURE, FILME SON CAPTEUR DE TOIT. Le manuel dit la famille "voiture" la plus
  risquee et le 26/08 ne l'avait sauvee qu'avec un travelling lateral verrouille.
  Il y a plus simple, et c'est la SEPTIEME confirmation de la rotation sur place
  (12/08, 17/08 x2, 22/08, 28/08 x2): subject "a single black sensor unit mounted
  on the roof of a parked car" + action "turning slowly in place, the sensor unit
  staying whole, the same size and fully inside the frame the entire time" +
  camera "locked-off static shot, no camera movement, no zoom" + composition
  "macro framing, the sensor unit fills most of the frame" + setting "under a
  plain open sky in soft even daylight". Accepte du premier coup, $0,96 (clip 8 s
  1080p, beat de 25 mots), pellicule 8 vignettes lue: meme objet, meme taille,
  present a la 8e, la fente du capteur tourne visiblement, zero deformation.
  Pourquoi c'est mieux qu'un plan de voiture: un dome de lidar est un objet RIGIDE
  et SYMETRIQUE, donc rien a deformer (pas de carrosserie, pas de roues, pas de
  vitres), et il n'y a aucune scene a objets multiples a refuser. Ancrage sur
  "sensor" et "car", deux mots que toute source de robotaxi ecrit en minuscules.
  Proof: run 10h30 31/08, veo_0 accepte du premier coup.
  Ajout 31/08 (06h30), CORRECTION DE LA CONSIGNE "ECRIS LES SUJETS DE SPEC AU
  SINGULIER" DE CETTE ENTREE: elle est FAUSSE des que le mot n'existe qu'au
  pluriel dans tes citations. Mesure: `tokens('costume')` rend "costume",
  `tokens('costumes')` rend "costum". La source ecrit "more than 20,000
  costumes", donc storyVocab porte "costum" et un spec disant "a single empty
  costume" est refuse "shares no word with the sources" sur un dossier ou les
  costumes sont l'image centrale. Le 01/08 avait mesure l'inverse exact
  ("spheres" -> "spher" ne matchait pas la source au singulier) et en avait tire
  une regle de forme; la vraie regle est **ecris le mot dans la FORME que tes
  citations emploient**, singulier ou pluriel, et verifie-le en 5 s:
  `node --input-type=module -e "import {tokens} from './src/state.mjs';
  console.log(tokens('costume'), tokens('costumes'))"`. Le controle qui tranche
  sans aller-retour reseau, a faire avant le premier gate: recalculer les ancres
  beat par beat sur tokens(subject+action+setting) INTER storyVocab, les deux
  fonctions etant exportees. Ce matin il a rendu "NONE" sur 3 beats sur 5 avant
  le gate. Proof: scout 06h30 31/08, dossier mini-series chinoises.
  posted.jsonl: a dead run may have published without recording. An unrecorded
  post republished as new is the account's worst failure. Proof: 27/07 death.
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
  reecrit: relance avant de rouvrir la page. Ajout 14/08 (06h30), LE MEME REFLEXE
  VAUT POUR LE FLUX: feeds.mjs a rendu "FAIL 0/0 <- HTTP 503 after 8 tries" sur le
  flux TechCrunch a 06h50, et un fetch Node direct du MEME flux 3 min plus tard a
  rendu 200 et 20 items. Un FAIL TechCrunch dans le rapport de feeds.mjs n'est donc
  pas la panne du jour, c'est la meme toux: relance le flux a la main avant de
  planifier sans lui. Ce jour-la il portait LES DEUX histoires banquees, et le
  rapport de collecte disait qu'il etait mort. Ajout 16/08 (19h30), MEME TOUX SUR
  UN AUTRE FLUX, donc ce n'est pas une specialite TechCrunch: feeds.mjs a rendu
  "FAIL 0/0 <- HTTP 502 after 13 tries" sur hnrss.org/frontpage?points=250, et un
  fetch Node direct du MEME flux 3 min plus tard a rendu 200, 4266 octets, 5 items.
  Treize tentatives echouees puis un succes immediat a la main: le nombre de
  reessais dans le rapport ne prouve pas que le flux est mort. Relance a la main
  TOUT flux marque FAIL avant de planifier sans lui (The Verge et Ars Technica
  restent, eux, des 403 permanents, entree du 28/07). Ce soir-la les 5 items HN ne
  portaient aucune actu IA publiable, donc le run n'a rien perdu, mais la mesure
  vaut pour le prochain. Ajout 24/08 (19h30), ET LA MEME REGLE VAUT CONTRE LA
  LIGNE "COLLECTE" DE watch.mjs, ce que personne n'avait note: le rapport de
  veille a imprime "muets : The Verge, Ars Technica, Hacker News (250+ points)"
  et feeds.mjs, lance TROIS MINUTES plus tard dans le meme run, a rendu HN
  "ok 6/6". La liste des muets du watch est un instantane de la DERNIERE
  collecte enregistree, pas un verdict sur le flux: ne renonce jamais a un flux
  parce que le watch le dit muet, relance-le. The Verge et Ars restent, eux, des
  403 permanents (28/07), et le watch a raison sur eux.
- 2026-07-28 · Outlets edit articles after publication: TechCrunch changed
  "UK" to "U.K." mid-day and a morning-gated candidate went NOT_FOUND by 19h.
  Re-run validate.mjs on any stored spec before building from it; re-copy the
  quote verbatim from the live page. Proof: 19h journal 28/07.
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
  Ajout 02/09 (06h30), LA JOURNEE OU AUCUNE PHOTO N'EST ACQUERABLE, et il faut
  la reperer AVANT d'ecrire un beat `photo`: api.openverse.org a rendu 500,
  504 et des timeouts a repetition tout le matin (7 requetes, 1 seule servie),
  et les candidats Commons qui restaient sont tous tombes sur le filtre
  fond-blanc. Mesure: "doctor patient" -> 5 candidats refuses a 65-80% de
  quasi-blanc (des decoupes stock sur fond blanc), "medical record file",
  "patient consultation doctor", "doctor patient hospital room" -> idem ou
  504. Seul "doctor examining patient" a rendu une vraie photo, et c'etait une
  consultation en clinique rurale africaine: correcte en droit, hors-sujet sur
  un dossier de dossiers medicaux americains, donc refusee a l'oeil. DEUX
  CONSEQUENCES. (1) Le vocabulaire medical generique est le pire cas du filtre
  fond-blanc (la banque d'images medicale est faite de decoupes sur blanc);
  vise un LIEU ou une SCENE, pas un metier. (2) Quand Openverse tousse, un
  scout ne doit banquer AUCUN beat `photo` non epingle: acquireOne jette et le
  build meurt. Les deux specs du jour sont partis sans une seule photo (veo +
  recus + cards + stills), ce qui reste dans les regles (plancher de 3
  surfaces reelles, plafond de 4 stills) et coute zero attente reseau au run
  de publication. Verification qui coute 60 s avant d'ecrire les beats:
  `node src/imagery.mjs candidates "<requete>"` PUIS un acquireOne reel, car
  `candidates` liste des images que le filtre refusera ensuite.
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
  Ajout 14/08 (10h30), DEUX MESURES SUR LE SEED. (1) LE TOKEN SAIT SUPPRIMER UN
  COMMENTAIRE, meme s'il ne sait pas les lire: `DELETE
  graph.instagram.com/v21.0/<commentId>?access_token=...` a rendu
  `{"success":true}` sur notre propre seed, et un POST sur
  /<mediaId>/comments l'a repose. engage.mjs n'expose ni l'un ni l'autre (usage:
  recent | comment | reply), donc une seed a corriger se rattrape en deux appels
  bruts, sans toucher au script. Pense a corriger l'id ET le texte dans
  state/engagement.jsonl a la main dans la foulee, sinon le registre pointe un
  commentaire supprime (le garde-fou anti-double-seed, lui, continue de marcher
  puisqu'il lit le mediaId). (2) LE PIEGE QUI A RENDU LA CORRECTION NECESSAIRE, et
  il vaut pour toute commande shell portant du francais: passer le texte du seed en
  ARGUMENT de `node src/engage.mjs comment ... "..."` invite a l'ecrire sans
  accents pour eviter l'echappement, et c'est exactement ce qui est parti en
  public ("la methode proposee", "etiquettes") sous un compte francais. Le gate
  protege la legende, PAS les commentaires: rien ne l'aurait vu. Ecris le texte
  dans un fichier (/tmp/seed.txt) et lis-le avec fs.readFileSync avant de poster.
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
  Ajout 11/08 (19h30), dossier GPT-5.6-Cyber, deux mesures. (1) "usb security
  key" est une requete MORTE: les 5 candidats sont des cut-outs a 39-90% de
  quasi-blanc, le build meurt a l'acquisition. Remede rendu propre du premier
  coup: still generee "a single black hardware security key lying on a dark
  desk" + extreme close-up (objet sans marque, zero texte invente, la famille
  "objet physique simple" ne declenche pas la prose inventee), APRES avoir mis
  la phrase source "hardware security keys become mandatory..." en
  captionEvidence pour que hardware+security entrent dans storyVocab. (2)
  L'acquisition AUTO peut livrer une rawpixel FILIGRANEE: "woman looking at
  phone" a rendu une image ~1300px couverte du filigrane rawpixel (famille du
  03/08) ET un vieux telephone a boutons hors sujet; licence, taille et filtre
  fond-blanc la laissent passer, seul le REGARD sur photo_N.jpg l'attrape.
  Remede: pin des valeurs sures du 09/08 (Shixart1985), re-confirmees au rendu.
  Ajout 12/08 (06h30), dossier metro de Londres, quatre valeurs sures telechargees,
  regardees en planche-contact, recadrees 9:16 et epinglees file+credit (donc 0 $ de
  still pour ce Reel): "london underground escalator" -> "Escalators on the London
  Underground" (Robert-brook, CC0, 1536x2048 DEJA EN PORTRAIT, le meilleur 9:16 du
  lot, crop=1152:2048:192:0); "london underground platform" -> Whitechapel
  (TheFrog001, CC0, 4032x3024, quai moderne avec panneau de ligne lisible,
  crop=1701:3024:1165:0); "london underground station" -> Clapham Common (Diliff,
  CC BY, 1961x1225, de VRAIS voyageurs sur un quai, crop=689:1225:636:0, remonte en
  x1,57 donc reserve-le a un beat qui n'est pas le 0); "victoria station london" ->
  la facade de 2008 (surprise truck, CC BY, 1600x1202, l'enseigne "London Victoria
  Station" est lisible, crop=675:1202:462:0). REQUETES MORTES OU PIEGEES ce jour-la:
  "cctv camera" et "surveillance camera street" ne rendent que du hors-lieu et du
  hors-epoque (magasin de Tel Aviv, Mumbai, Toronto, une camera sovietique, et des
  cameras delabrees de Bristol avec un NUMERO DE TELEPHONE grave dans le cadre) --
  sur une actu de surveillance, cherche le LIEU nomme, jamais l'objet "camera";
  "silkie carlo" et "demis hassabis" restent a 0 candidat. api.openverse.org a rendu
  503 deux fois de suite sur deux requetes avant de repartir seul, ca re-confirme
  l'entree du 29/07: reessaie, ne debogue pas.
  Ajout 13/08 (06h30), UNE FAMILLE DE PIEGE PHOTO NOUVELLE, LE SELFIE DE PARTICULIER:
  "twitch streamer" met PREMIER a 8.0 "Twtitch Streamer ReconNathan" (Commons, CC0,
  3072x4080 DEJA EN PORTRAIT, 0% de blanc) et c'est un SELFIE D'ADOLESCENT MASQUE
  (cagoule noire) devant un mur de briques: rien du streaming dans le cadre, et un
  particulier identifiable qu'un compte d'info n'a aucune raison de montrer. Licence,
  taille, ratio et filtre fond-blanc le laissent passer, le classement le met en tete:
  SEULE la planche-contact le voit. C'est une famille de plus que l'epoque (CDC 7600),
  la marque (Augmentin), la carte (natural gas power plant) et l'illustration
  (Goodsell). Reflexe: sur une actu de PLATEFORME, ne cherche pas "<plateforme>
  <metier>", tu tombes sur les selfies que les gens ont televerses. Ecarte aussi
  "webcam": le 1er candidat s'appelle "Webcam (Logitech c922)", donc la marque est
  DANS le sujet (famille Augmentin). EXTENSION DE LA LIMITE upload.wikimedia du
  10/08: l'UA descriptif ne suffit plus a lui seul. UN original telecharge, puis les
  TROIS suivants ont rendu la page "Wikimedia Error" de 2 ko malgre 5 s puis 20 s
  d'attente, et ca ne s'est pas retabli en 10 min. Donc un scout qui veut epingler
  doit telecharger EN PREMIER, avant le reste du travail, pas a la fin: le budget de
  l'hote de fichiers se depense en une poignee de requetes. Les 2 specs banques ce
  jour-la sont partis SANS pins pour cette raison, avec l'avertissement au run de
  publication de REGARDER photo_N.jpg.
  Ajout 13/08 (10h30), LA REGLE QUI MANQUAIT CI-DESSUS, ET ELLE A COUTE DEUX BUILDS:
  UNE VALEUR SURE DE CE CARNET QUI VIENT AVEC UN CROP N'EST SURE QUE PINNEE. Le moteur
  acquiert l'image ENTIERE, jamais ton crop, donc "elderly woman phone window" (valeur
  sure du 09/08, crop=4140:7360:772:0) est revenue a 50% de quasi-blanc sur SES DEUX URL
  (original ET thumb 1920px) et a tue le build a l'acquisition: c'est la fenetre derriere
  elle qui est blanche, et le crop du 09/08 existait precisement pour ca. Ne relis jamais
  une valeur sure a crop comme une requete utilisable: telecharge et pin, ou change de
  surface. REQUETE MORTE mesuree le meme jour: "keyboard typing", 5 candidats sur 5
  refuses a 39-88% de quasi-blanc (tous stocksnap). ET L'ETRANGLEMENT upload.wikimedia
  du 13/08 06h30 S'ETEND AUX THUMBS: avec l'UA descriptif, l'original ET
  .../thumb/.../1920px-....jpg rendent tous deux la page "Wikimedia Error" de 2,2 ko,
  non retablie en 10 min. Un run de publication ne peut donc PAS reparer un beat photo
  depuis Commons ce jour-la, et stocksnap ne sert que du 960 px (crop 9:16 -> x3, trop
  mou pour un visage). Consequence assumee: le Reel du jour est parti sans aucun visage
  humain. Un scout qui ne pin pas laisse une mine au run de publication.
  Ajout 13/08 (16h30), LA MINE A EXPLOSE, et c'est la meme journee: le 2e spec banque le
  matin portait TROIS beats photo, et les trois etaient injouables a 16h30. "keyboard
  typing" est la requete morte mesuree a 10h30 (elle aurait tue le build a
  l'acquisition); "writing papers" ne rend que du stocksnap 960 px (crop 9:16 -> x3);
  et "woman podcast" met PREMIER a 8.0 un portrait Commons de particuliere sans aucun
  rapport avec le sujet (Adela Cojab Moadeb, 1600x2133) -- famille du selfie
  ReconNathan du matin, sauf que la requete ne nomme meme pas la plateforme.
  commons.wikimedia.org/w/api.php a re-rendu 503 deux fois de suite (re-confirme le
  12/08). Les trois beats ont ete convertis en veo (beat 0) + 2 stills generees, Reel
  parti sans visage humain pour le 2e Reel d'affilee. REGLE POUR UN SCOUT: un beat
  `photo` non epingle n'est pas un plan, c'est un pari; si upload.wikimedia etrangle,
  banque des `card` et des recus a la place et dis-le dans le spec.
  Ajout 14/08 (06h30), NUANCE SUR L'ETRANGLEMENT upload.wikimedia: il ne frappe PAS
  toujours les thumbs. L'ORIGINAL (Elon_Musk_2021.jpg) a rendu la page d'erreur de
  2,2 ko des la PREMIERE requete du run, avec l'UA descriptif et aucun telechargement
  anterieur, et le chemin /thumb/.../1280px-....jpg a rendu l'image entiere (273 ko,
  1280x1708) dans la seconde qui a suivi. Avant de renoncer a un beat photo Commons,
  essaie donc le thumb: le 13/08 les deux etaient etrangles, le 14/08 seul l'original
  l'etait. Valeurs sures epinglees ce jour-la, regardees en planche-contact: "Elon
  Musk 2021" (Ministerio Das Comunicacoes, CC BY 2.0, original 1531x2043, thumb
  1280x1708), `crop=800:1422:240:0` donne un vrai portrait serre, contemporain, zero
  texte, zero date, ET coupe le logo Tesla du pull qui est plus bas dans le cadre
  (famille Augmentin du 08/08, evitee par le recadrage et pas par la chance); et
  "A messy network server room showing wires, patch panels" (Moses Cursor Ssebunya,
  CC0, pd.w.org 1542x2048 DEJA EN PORTRAIT, `crop=1152:2048:195:0`), un vrai panneau
  de brassage, utile des qu'une histoire parle de machines partagees. pd.w.org n'est
  pas etrangle et sert du 1542 px: c'est la porte de sortie quand Commons ferme.
  Ajout 15/08 (06h30), dossier camions autonomes. REQUETES MORTES OU PIEGEES:
  "freight truck california" met en tete un booster de navette spatiale puis quatre
  trains graffites; "truck driver cab" ne rend que des archives NARA des annees
  1970 (piege d'epoque, 8e occurrence); "semi truck highway" rend du rawpixel
  australien (plafond 1024 px) et un camion-citerne de Hong Kong. CE QUI MARCHE:
  "autonomous truck" -> "Autonomous truck cab on display" (Oregon Department of
  Transportation, CC BY, 4032x3024), une VRAIE cabine surmontee de son rack de
  capteurs. PIEGE DE MARQUE DEDANS, famille Augmentin du 08/08: la portiere porte
  "Embark Trucks Inc." et un numero US DOT parfaitement lisibles, soit une
  entreprise qui n'est PAS dans l'histoire, et le crop 9:16 plein cadre les garde.
  `crop=816:1450:1330:0` ne garde que le rack de capteurs et le haut de la cabine,
  zero marque lisible, et c'est en prime le meilleur cadrage editorial. Et
  "california freeway traffic" -> "LA Traffic - I-210 I-5 Interchange" (Tony
  Webster, CC BY, 2400x1600), panneau "Palmdale Lancaster" lisible,
  `crop=810:1440:780:0` coupe la plaque d'immatriculation lisible du bas.
  MESURE UTILE SUR L'ETRANGLEMENT: upload.wikimedia.org a servi SIX originaux
  d'affilee ce matin (jusqu'a 13 Mo) avec l'UA descriptif et 5 s d'espacement, sans
  une seule page d'erreur. La fermeture du 13/08 n'est donc pas un etat permanent:
  teste avant de renoncer a epingler, mais telecharge toujours EN PREMIER.
  Ajout 16/08 (06h30), dossier livres IA. L'ETRANGLEMENT upload.wikimedia FRAPPE
  DES LA PREMIERE REQUETE DU RUN (page d'erreur de 2,2 ko sur l'original
  Stripped_paperback.jpg, UA descriptif, aucun telechargement anterieur) et le
  chemin /thumb/.../1280px-....jpg a rendu l'image entiere dans la seconde:
  re-confirme le 14/08, essaie TOUJOURS le thumb avant de renoncer. pd.w.org n'est
  jamais etrangle. VALEUR SURE EPINGLEE, regardee en planche-contact, recadree et
  posee dans le spec (donc 0 $ de still sur ce beat): "bookshop shelves" ->
  "Bookshop in Rome" (Elisa Scagnetti, CC0, pd.w.org, 1536x2048 DEJA EN PORTRAIT,
  crop=1152:2048:192:0), une vraie librairie independante avec son enseigne
  BOOKSHOP, des livres en rayon et une personne dedans, zero marque genante, zero
  date gravee: excellent DERNIER beat sur une actu d'edition. REQUETES MORTES OU
  PIEGEES le meme matin: "resume paper" ne rend que des affiches et reliures du
  19e siecle (piege d'epoque, 9e occurrence) alors que l'histoire parle de CV;
  "paperback books" met en tete "Stripped paperback", une vraie photo de livre sans
  couverture, mais en PAYSAGE 1280x960, et le crop 9:16 (540 px) coupe le livre en
  deux et remonte en x2 - une valeur sure de carnet n'existe qu'avec son crop, ca
  re-confirme le 13/08. Et un TYPE NOUVEAU de piege d'identite, sur un LIEU cette
  fois et pas sur une personne: "courthouse connecticut" rend le Fairfield County
  Courthouse, vrai, bien licencie, contemporain, et ce n'est PAS le tribunal du
  dossier (Ansonia/Milford). Montrer le mauvais palais de justice est la meme faute
  que nommer la mauvaise personne, et aucun filtre ne la voit: beat abandonne.
  Ajout 17/08 (06h30), dossier langue des signes. L'ETRANGLEMENT
  upload.wikimedia frappe DES LES PREMIERES REQUETES du run (2 originaux sur 3
  rendus en page d'erreur de 4 ko, UA descriptif, aucun telechargement
  anterieur) et le chemin /thumb/.../1280px-....jpg a rendu les deux images
  entieres dans la seconde: c'est la TROISIEME confirmation apres le 14/08 et
  le 16/08, essaie toujours le thumb, ne renonce jamais au premier echec.
  VALEURS SURES telechargees, regardees en planche-contact et recadrees 9:16
  (le post a ete abandonne sur la fraicheur et les fichiers supprimes, mais les
  crops ci-dessous sont reproductibles en 2 minutes): "Ghanaian sign language for 'school'" (Martin attakee, CC0, thumb
  1280x720, crop=405:720:520:0, un homme qui signe devant un tableau, vrai
  visage, contemporain) et "Sign language, 2014 (01)" (daveynin, CC BY, thumb
  1280x853, crop=480:853:16:0, une femme qui signe a une table, excellent
  visage). Les deux ne font que 1280 de large, donc le 9:16 remonte en x2,2 a
  x2,7: bon pour un beat milieu, pas pour un beat 0. REQUETES PIEGEES le meme
  matin: "american sign language" met en tete "American Sign Language
  Interpreter" (3456x2304, la meilleure resolution du lot) qui est une FOULE de
  supporters des Steelers avec une pancarte "TERRIBLE TOILETS" et un maillot
  "75" lisibles, famille Augmentin du 08/08 doublee d'une scene a objets
  multiples; "sign language" sort en 3e "Relationships between the manual
  alphabets", qui est un DIAGRAMME .png (famille Goodsell du 08/08); "deaf
  communication" sort "Blind Deaf (1904)", piege d'epoque, 10e occurrence.
  ET UNE VALEUR ANTI-SURE A CONNAITRE, famille "la table au lieu de
  l'histoire": rawpixel "View woman working laptop desk" (1024 px, CC0), qui
  sort en tete sur toute requete de bureau, est un flat-lay vu de dessus avec
  plante, bougie, tasse de cafe et lampe en laiton autour du portable. Licence,
  taille et filtre fond-blanc la laissent passer et c'est exactement l'image
  que routine.md dit de racheter. Sur une actu de travail de bureau, il n'y a
  pas de photo libre utilisable ici: prends une `card` ou un recu.
  Ajout 19/08 (06h30), L'ETRANGLEMENT upload.wikimedia SE DESCEND EN TAILLE, et
  ca precise les entrees des 14, 16 et 17/08 qui disaient "essaie le thumb": sur
  5 telechargements, 2 originaux ont rendu la page d'erreur de 2 ko des les
  premieres requetes du run, ET le thumb /2560px- a rendu la MEME erreur pour
  les deux; c'est le thumb /1280px-, apres 20 a 25 s de pause, qui a servi les
  images entieres. Le thumb n'est donc pas une porte de sortie a n'importe
  quelle taille: descends a 1280 avant de renoncer a un beat photo. VALEURS
  SURES telechargees, regardees en planche-contact, recadrees 9:16 et epinglees
  file+credit ce matin (donc 0 $ de still sur deux Reels): "Screen time"
  (Rawpixel, CC0) existe sur Commons en 5000x3334, il n'est PAS plafonne a
  1024 px comme la copie du CDN rawpixel (nuance a l'entree du 03/08),
  crop=1875:3334:1400:0 garde l'homme ET son telephone; "Osuchow - aircraft
  contrails" (Sylwia Botev, CC BY, thumb 1280x960, crop=540:960:370:0), une
  vraie trainee dans un ciel bleu, zero texte, zero marque; "Newark Airport
  Control Tower 01" (Djflem, CC0, thumb 1280x1707, crop=960:1707:160:0), vraie
  tour de controle contemporaine. REQUETES PIEGEES le meme matin, aucun filtre
  ne les voit: "air traffic control centre" met PREMIER a 8.0
  "KLAirTraffcontr" (CC0, 3264x2448) qui est une PHOTO DE RUE devant un
  batiment, pas une salle de controle (famille de la carte du 08/08: le
  classement recompense le titre, pas le contenu); "contrails sunset" met
  premier "Contrails Sunset - 2011" (CC0), de vraies trainees au coucher de
  soleil mais avec une AUTOROUTE americaine et ses panneaux sur tout le tiers
  bas, inutilisable en 9:16 sans perdre la resolution. Et le piege du cadrage du
  09/08 se re-confirme dans l'autre sens: recentrer "Woman sitting in a chair
  holding a cup looking at a phone" a x=1500 pour mieux cadrer le visage SUPPRIME
  le telephone du cadre; garde le x=2100 mesure, le sujet du beat c'est la
  personne AVEC l'objet.
  Ajout 21/08 (06h30), QUATRE REQUETES PHOTO PIEGEES ET DEUX VALEURS SURES,
  dossier eau potable, tous les pieges attrapes a la planche-contact et par
  AUCUN filtre. (1) "programmable logic controller" ne rend qu'UN candidat et il
  porte DEUX defauts a la fois: des gilets haute visibilite ou se lit "FIVE STAR
  ELECTRIC" (marque absente de l'histoire, famille Augmentin du 08/08) ET un
  horodatage grave "7/31/2018" en bas a droite (famille epoque). (2) "kitchen
  faucet" met en tete deux photos de SHOWROOM, etiquettes de prix visibles et
  plaque "MOEN" lisible: pas de robinet de cuisine reel atteignable ici. (3)
  "water tower rural" rend de vrais chateaux d'eau contemporains mais
  l'inscription "MID-DAKOTA RWS" est lisible en grand, et montrer un reseau
  d'eau NOMME qui n'a PAS ete attaque sur une actu de piratage est la faute du
  mauvais tribunal du 16/08: beat abandonne, remplace par une `card`. (4)
  "screen time" sort en 2e position a 8.0 une CARTE de l'empire Maurya (famille
  carte du 08/08), donc meme une valeur sure de ce carnet se pin, jamais se
  relance a l'aveugle. VALEURS SURES telechargees, regardees et epinglees
  file+credit ce matin: "Water Treatment Plant in Parkin, Arkansas"
  (Brandonrush, CC0, thumb 1920x1280, crop=720:1280:225:0), un batiment ou se
  lit PARKIN WATER PLANT, vraie station rurale dans un Etat que le script
  nomme, zero marque, zero date gravee; et "Water flowing from drinking water
  tap" (Mateusz Konieczny, CC0, thumb 1920x1920, crop=1080:1920:600:0), main +
  robinet + eau qui coule, excellent dernier beat. Re-confirmes au rendu:
  "Screen time" (Rawpixel, CC0, thumb 1920x1280, crop=720:1280:537:0, le
  telephone reste dans le cadre) et "A messy network server room" (Moses Cursor
  Ssebunya, CC0, pd.w.org 1542x2048, crop=1152:2048:195:0). ET LA TAILLE DE
  THUMB, qui precise le 19/08: /2560px- a rendu la page "Wikimedia Error" de
  2 009 octets en HTTP 400 sur Screen_time.jpg, alors que /1920px- a rendu
  382 ko sur la MEME image 20 s plus tard et servait deux autres originaux dans
  la meme minute. Ce n'est donc pas un etranglement passager mais la rendition
  2560 qui echoue: demande 1920, jamais 2560.
  Ajout 23/08 (06h30), UNE FAMILLE DE PIEGE PHOTO NEUVE, LA CAPTURE VIDEO AVEC
  SON INTERFACE GRAVEE, et elle sort PREMIERE. "linus torvalds" met en tete
  (3012x1691, wikimedia) "Linus Torvalds in Conversation with Dirk Hohndel 2025",
  qui est une image extraite d'un lecteur video: le texte "Click and drag to make
  a selection." est INCRUSTE en plein milieu du cadre, et on y voit DEUX hommes
  assis, donc l'identite est ambigue en prime. Licence, taille, date et filtre
  fond-blanc la laissent passer; SEULE la planche-contact le voit. Ecarte au
  titre "in conversation with", "interview", "livestream", "keynote video", et
  regarde toujours: une capture d'ecran de video porte l'interface de l'outil.
  Le 2e candidat "Linus Torvalds at DebConf14" (3264x2448) est le piege d'epoque
  pour la 12e fois, avec "DebConf14 Portland ... August 23rd - 31st 2014" ET un
  logo Intel lisibles en grand. VALEUR SURE telechargee, regardee, recadree et
  epinglee ce matin: "Linus Torvalds - Linuxcon2011" (Beraldo Leal, CC BY 2.0),
  thumb 1280x1912 DEJA EN PORTRAIT, `crop=1074:1912:130:0` puis scale 1080:1920,
  soit du NATIF (x1,005) sur un vrai visage net, micro a la main, zero texte,
  zero marque, zero millesime dans le cadre. Il est de 2011 et rien ne le date a
  l'image: sur un visage, l'age de la photo ne se voit pas, c'est la SIGNALETIQUE
  autour qui trahit. Deuxieme valeur sure, dossier Harvard: "harvard business
  school baker library" met PREMIER a 8.0 un scan de manuel de photographie du
  19e siecle (epoque, 13e fois, et hors sujet complet), mais le 3e candidat
  pd.w.org "The entrance of the Harvard Business School at Cambridge" (Hari
  Shanker R, CC0, 2048x1368) porte le PANNEAU "HARVARD BUSINESS SCHOOL" avec son
  ecusson en plein cadre: `crop=769:1368:700:0` puis scale 1080:1920. Sur une
  actu d'ecole ou d'institution, cherche le PANNEAU du campus, il nomme le sujet
  a l'image sans qu'aucune voix ait a le faire. creditLine() a rendu "" sur les
  DEUX (upload.wikimedia et pd.w.org): le createur se lit sur
  `api.openverse.org/v1/images/?q=<titre>&source=wordpress` (champ creator) et,
  cote Commons, sur `commons.wikimedia.org/w/api.php?action=query&prop=imageinfo
  &iiprop=extmetadata&titles=File:<nom>` (extmetadata.Artist + LicenseShortName).
  Ne publie jamais un credit devine. upload.wikimedia a servi 4 fichiers
  d'affilee ce matin (UA de navigateur complet + referer commons, 6 s d'ecart)
  sans une seule page d'erreur.
  Ajout 25/08 (06h30), UNE FAMILLE DE PIEGE PHOTO NEUVE, LA MARQUE D'UN MEDIA
  DANS LE DECOR DE SCENE, et elle sort en tete: "andy jassy" met PREMIER (6.0,
  4032x3024) "Andy Jassy in 2016", qui est un plan large de conference ou
  "WSJ.D LIVE" est ecrit DEUX FOIS en enorme derriere lui, visage minuscule.
  Ce n'est ni l'epoque (CDC 7600) ni la marque d'un produit (Augmentin): c'est
  le logo d'une AUTRE REDACTION grave dans le cadre d'un compte d'info, et
  aucun recadrage 9:16 ne l'enleve puisqu'il occupe tout le fond. Ecarte au
  titre et a l'oeil les photos de scene de conference nommee (LIVE, Summit,
  Forum, Code, Disrupt). Le 2e candidat "Andy Jassy in 2010" (JD Lasica,
  CC BY 2.0) est le bon: vrai portrait poitrine, visage net, zero texte, zero
  marque; thumb 1920px, `crop=717:1275:550:0` (x=300 et x=800 coupent le
  visage, mesures en planche-contact). Son genou reste dans le bas du cadre,
  flou et sombre, sans importance sous la bande karaoke. VALEUR SURE EXCELLENTE
  du meme matin: "tim cook" -> "Tim Cook (2017, cropped)" (Austin Community
  College, CC BY 2.0), thumb 1920x2497 DEJA EN PORTRAIT, `crop=1404:2497:258:0`
  puis scale 1080:1920, soit un DOWNSCALE (x0,77) sur un vrai visage net au
  pupitre, zero texte lisible, zero millesime. Ecarte en revanche les "Visit of
  Tim Cook to the European Commission": DEUX hommes dans le cadre, donc
  identite ambigue (famille du 23/08). ET TROIS REQUETES MORTES OU PIEGEES sur
  un objet pourtant banal, l'imprimante: "office printer" rend 0 candidat;
  "printer" met PREMIER (8.0) un "Game Boy Printer", puis une imprimante 3D,
  puis "Kodak LED Printer" (marque dans le titre ET dans le cadre); "printer
  office desk" sort du Xerox marque, un bureau de poste de 1912 (piege
  d'epoque, 14e occurrence) et un flat-lay de bureau; "laser printer" ne rend
  que "Row of HP laser printers" (marque + objets multiples) et des photos
  d'ENTRAILLES d'imprimante demontee sur un etabli, illisibles comme sujet.
  Sur une actu qui evoque les imprimantes, il n'y a pas de photo utilisable
  ici: prends une still generee ou une `card`. upload.wikimedia et pd.w.org ont
  servi 7 fichiers d'affilee ce matin (UA de navigateur complet + referer
  commons, 6 s d'ecart) sans une seule page d'erreur.
  Ajout 26/08 (06h30), QUATRE REQUETES PIEGEES SUR SIX, dont la pire est une
  requete qui NOMME EXACTEMENT le sujet de l'histoire. (1) "waymo self driving
  car" met PREMIER a 8.0 "Googleplex protest, 20170130-2.jpg", une MANIFESTATION
  devant le Googleplex: aucune voiture autonome dans le cadre, sur la seule
  requete du dossier qui nomme l'entreprise ET l'objet. Un beat photo non epingle
  aurait publie une manif. Les vraies sont en 3e et 4e ("Waymo self-driving car in
  Tempe", zombieite, CC BY 2.0, 5184x3888, thumb 1920, `crop=810:1440:250:0`, le
  logo WAYMO et le lidar de toit lisibles). (2) "pattie maes" met en tete une
  DESOTO DE 1921 puis un recensement d'Alabama (piege d'epoque, 15e occurrence),
  et la bonne est en 3e: "Dubai Future Forum 2024 - Pattie Maes" (Andrew Lih, CC0,
  2138x3207 DEJA EN PORTRAIT, thumb 1280, `crop=1080:1920:100:0`), vrai portrait
  net, le lettrage arabe du fond est flou et illisible; a x=200 il commence a se
  lire, garde x=100. (3) "anku rani" rend la cour du Maharaja Ranjit Singh: sur un
  doctorant, il n'y a AUCUNE photo libre, ne cherche pas. (4) "tekedra mawakana"
  met en tete trois vues d'une meme scene "Strictly VC": la -03 montre DEUX femmes
  avec la banniere "Lightspeed" lisible en grand (famille du fond de scene
  d'une autre marque, 25/08, doublee de l'identite ambigue du 23/08), mais la -01
  de la MEME serie ne montre QU'ELLE, micro en main, zero texte lisible
  (TechCrunch, CC BY 2.0, thumb 1920x1282, `crop=720:1280:811:0`). Regle: quand
  une seance photo sort en plusieurs numeros, regarde-les TOUS, un seul cadrage
  peut etre publiable. Note que le credit grave sera "TechCrunch", soit le nom
  d'une autre redaction, ce qui est une attribution normale et pas la faute du
  25/08. VALEURS SURES RE-CONFIRMEES ce matin: "Screen time" (Rawpixel, CC0,
  thumb 1920x1280, `crop=720:1280:537:0`, l'homme ET son telephone dans le cadre)
  et, nouvelles, "Volkswagen ID. Buzz 1X7A626 in Munich" (AuHaidhausen, CC BY 4.0,
  thumb 1920x1167, `crop=656:1167:620:0`, qui coupe la plaque d'immatriculation
  lisible) et "Hirte, Christian-0221" (Foto-AG Gymnasium Melle, CC BY 3.0, thumb
  1280x1924 DEJA EN PORTRAIT, `crop=1080:1920:100:0`, portrait officiel sur fond
  gris). upload.wikimedia a servi 8 fichiers d'affilee (UA de navigateur complet
  + referer commons, 6 s d'ecart) sans une seule page d'erreur.
  Ajout 28/08 (16h30), LE TITRE QUI DECRIT L'OBJET ET LA PHOTO QUI MONTRE LA
  SALLE, famille du 19/08 (KLAirTraffcontr) mais sur une requete qu'on croit
  sure: "airport departure board" met PREMIER a 8.0 "GIB departures" (Commons,
  CC0, 3648x2736, 0% de blanc) et ce n'est PAS un tableau d'affichage, c'est une
  SALLE D'EMBARQUEMENT BONDEE de Gibraltar, une trentaine de personnes assises,
  enseigne "Duty Free Centre" lisible, et un tirage qui a visiblement quinze ans
  (piege d'epoque, 16e occurrence). Trois defauts d'un coup, licence/taille/
  filtre fond-blanc laissent tout passer, SEULE la planche-contact le voit. Le
  mot "departures" du titre designe le LIEU, pas l'objet. Regle: sur un objet
  d'affichage (tableau, panneau, ecran public), la requete ramene la salle qui
  le contient; regarde avant de planifier le beat. Remede applique ce soir, 0 $:
  revenir a une valeur sure deja mesuree, "Screen time" (Rawpixel, CC0, Commons
  thumb 1920x1280, crop=720:1280:537:0), re-confirmee au rendu pour la 4e fois,
  homme + telephone dans le cadre, zero marque, zero date. Note d'URL: le chemin
  /thumb/ de Screen_time.jpg est sous /6/68/, pas /9/9a/ (un hash devine rend un
  404 de 1,9 ko): passe toujours par `imagery.mjs candidates` pour l'URL exacte.
  Ajout 29/08 (16h30), DEUX PIEGES DE REQUETE PHOTO SUR LE MEME BUILD. (1) LE
  NOM SEUL D'UN RESPONSABLE RAMENE LA SALLE, PAS LE VISAGE: query "Pete Hegseth"
  a rendu "Pete Hegseth, Dan Caine, and Bryn MacDonnell participate in a hearing
  with the Senate Appropriations Committee" (CC BY), plan LARGE d'une salle
  d'audition, trente dos de tetes, aucun visage reconnaissable, sur un beat qui
  nomme le ministre: du mobilier. Remede du premier coup, ajouter "Official
  Portrait" ("Pete Hegseth Official Portrait" -> Commons pdm 1537x1993, score
  8.0, portrait officiel cadre poitrine, impeccable en 9:16). Regle: pour un
  responsable public, demande TOUJOURS le portrait officiel, jamais le nom seul.
  (2) DARIO AMODEI EST INEXPLOITABLE EN `photo` ET CA TUE LE BUILD: les DIX
  candidats Commons (serie TechCrunch Disrupt 2023 + Takaichi 2025) sont TOUS
  refuses par le filtre de marque, 30 a 62% de quasi-blanc (fond de scene
  surexpose), aucun portrait officiel n'existe. Le build meurt sur "every
  candidate for Dario Amodei failed" apres la narration (cache, $0 perdu) et
  avant les achats. Sur une histoire Anthropic, prends le visage de l'autre
  partie (Hegseth, Trump) ou un still.
  Ajout 30/08 (06h30), DEUX VISAGES QUE TOUT LE MONDE VA REDEMANDER, ET LEURS
  DEUX PIEGES: le moteur prend le PREMIER candidat, et sur ces deux requetes le
  premier est mauvais. (1) "elon musk 2021" met PREMIER a 7.0 "Mohammad Al
  Gergawi and Elon Musk at WGS 2019", DEUX hommes dans le cadre donc identite
  ambigue (famille du 23/08): un beat photo non epingle aurait attribue le
  visage du mauvais homme a la voix qui dit "Musk". Le bon est le 2e, "Elon
  Musk 2021" (Ministerio Das Comunicacoes, CC BY), thumb 1280x1708,
  `crop=800:1422:240:0` puis scale 1080:1920, vrai portrait serre, zero texte,
  zero marque, zero millesime a l'image. (2) "sam altman" met PREMIER "Sam
  Altman CropEdit James Tamim" (1998x1999), donc un CARRE: le 9:16 y coupe. La
  valeur sure reste "Sam Altman speaking at TED" (Steve Jurvetson, CC BY) du
  09/08, et voici son crop pour le THUMB 1920 (l'entree du 09/08 donnait celui
  de l'original 2184): thumb 1920x2315, `crop=663:1178:536:53` puis scale
  1080:1920 rend un vrai portrait poitrine net; le 9:16 plein cadre
  (`crop=1302:2315:309:0`) rend, lui, le plan assis en entier AVEC des
  chaussures de marque lisibles (famille Augmentin du 08/08). Deux autres
  valeurs sures epinglees le meme matin, regardees en planche-contact:
  "Bookshop in Rome" (Elisa Scagnetti, CC0, pd.w.org 1536x2048,
  `crop=1152:2048:192:0`, re-confirme le 16/08, l'enseigne BOOKSHOP est dans le
  cadre) et "Vinyl collection at a record store (Unsplash)" (Mr Cup / Fabien
  Barral iammrcup, CC0, thumb 1920x1275, `crop=717:1275:600:0`), des bacs de
  disques chauds, zero texte lisible, zero marque - utile des qu'une histoire
  parle de chansons. upload.wikimedia a servi 6 fichiers d'affilee (UA de
  navigateur complet + referer commons, 6 s d'ecart) sans une page d'erreur.
  Ajout 31/08 (06h30), LES DEUX ROBOTAXIS SONT DISPONIBLES EN VRAIES PHOTOS, et
  c'est rare: sur une actu de voiture autonome, n'achete pas de still. "waymo
  self driving car tempe" met en tete la valeur sure du 26/08 (zombieite,
  CC BY 2.0, original 5184x3888), et le crop du carnet tient tel quel sur le
  thumb 1920: `crop=810:1440:250:0` puis scale 1080:1920 rend un monospace
  Waymo entier, le mot WAYMO et le lidar de toit lisibles, zero visage, zero
  date, zero autre marque. Telecharge, recadre, regarde et epingle en 2 min,
  $0. NOUVEAU du meme matin: "zoox robotaxi" rend QUATRE photos distinctes du
  vrai vehicule Zoox ("Zoox Autonomous Robotaxi - San Francisco May 2025",
  numerotees 1, 4, 5, 6, CC BY, 5476x3636 a 6108x4076), donc de quoi servir
  plusieurs beats sans reprendre la meme image. ATTENTION AU CONTRESENS, et il
  est propre a ce dossier: les blessures declarees a l'OSHA sont arrivees dans
  des TOYOTA HIGHLANDER modifiees, pas dans la nacelle Zoox sans volant. Mettre
  la nacelle sous une phrase qui parle du conducteur projete en avant fabrique
  une accusation fausse par le montage, famille Mythos 5 / Opus 4.7 du 31/07.
  Une vraie photo du bon fabricant peut montrer le mauvais objet. REQUETES
  MORTES OU PIEGEES le meme matin, dossier cinema: "film studio lighting" met en
  tete un appareil Leica (marque dans le titre ET dans le cadre, famille
  Augmentin) puis des projecteurs des studios Gainsborough des annees 1940
  (piege d'epoque, 17e occurrence); "costume rail wardrobe" ne rend que des
  LETTRES MANUSCRITES DE 1849; "empty film set" ne rend rien d'exploitable.
  Sur une actu de tournage il n'y a donc pas de photo libre utilisable ici:
  prends des recus et des stills, comme le dit deja l'entree "quand rien de
  reel n'existe".
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
  Ajout 13/08 (10h30), LA CONTRE-EPREUVE, et elle vaut pour tout run de publication qui
  herite d'un spec de scout: le spec banque faisait 219 mots pour une fenetre 194-222,
  soit 3 mots sous le PLAFOND. Ramene a 205 (cible 206) avant le premier build, la
  PREMIERE lecture est passee: 205 mots en 54,6 s (3,75 mots/s), atempo 0,983. A 219 la
  meme lecture demandait ~1,05, et une lecture 5% plus lente tapait le clamp 1,12. Le trim
  coute 2 minutes, un build refuse apres narration coute la fenetre de publication. Donc
  relance `validate.mjs window` et RECOMPTE les mots d'un spec herite avant de payer, meme
  quand il est PASSED: un spec gate-clean ecrit au plafond reste un spec a risque.
  Ajout 13/08 (16h30), ET MEME A LA CIBLE LES RE-ROLLS ARRIVENT: 211 mots pour une
  fenetre 197-225 (cible 209), donc 2 mots au-dessus de la cible, et il a quand meme
  fallu TROIS lectures (3,27 puis 3,45 puis 3,49 mots/s) la ou le registre annoncait
  3,756 sur 12 lectures. Cout $0,093 au lieu de $0,030, et ~2 min. Le moteur fait son
  travail (il rachete tout seul jusqu'a 3) et le build est passe, mais budgete le temps:
  un run de publication qui demarre a moins de 20 min de sa fenetre ne doit pas
  supposer une lecture unique. Et ne reecris pas le script pour ca, c'est le des du
  31/07, pas ta copie.
  CONTRE-EPREUVE 23/08 (16h30), LES TROIS LECTURES SONT LE CAS NORMAL, PAS LE PIRE
  CAS, et le des tombe des DEUX cotes: 205 mots pour une fenetre 196-224 (cible
  207), donc 2 mots SOUS la cible, et il a encore fallu TROIS lectures. Mais la
  dispersion est l'inverse du 13/08: 4,40 puis 3,32 puis 4,07 mots/s la ou le
  registre annonce 3,731 sur 12 lectures, donc la premiere lecture etait TROP
  RAPIDE (atempo 0,839, sous le plancher 0,90) et la deuxieme trop lente (1,110,
  a un cheveu du plafond 1,12). Ecrire a la cible ne protege donc pas du re-roll,
  ca protege du REFUS: les trois atempos demandes tenaient dans [0,84 ; 1,11] et
  la 3e est passee. Cout $0,079 au lieu de $0,023, ~2 min. Budgete 3 achats TTS
  et 2 min sur toute fenetre de publication, meme sur un spec ecrit a la cible.
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
  Ajout 21/08 (16h30), LE NOMBRE DE MOTS DU BEAT 0 DECIDE LA RESOLUTION ET LE PRIX
  DU CLIP, et personne ne l'avait mesure des deux cotes le meme jour. Le moteur
  achete 4, 6 ou 8 s pour tenir la duree du beat, et le 1080p n'arrive QU'A 8 s
  (entree du 31/07). Or la duree du beat 0 est sa part des mots. Mesure des DEUX
  Reels du 21/08, meme fenetre: beat 0 de 26 mots sur 214 -> 6,22 s -> clip 8 s
  1080p a $0,96; beat 0 de 22 mots sur 209 -> 5,58 s -> clip 6 s 720p a $0,60,
  donc agrandi 1,5x pour remplir le 1080x1920. Raccourcir l'attaque economise
  $0,36 ET fait tomber en 720p le seul beat sur lequel se joue toute l'audition.
  Le seuil est a 6 s de beat, soit environ 24 mots sur 210 a la fenetre actuelle:
  si tu veux le 1080p natif, ecris le beat 0 au-dessus, en restant sous les ~8,6 s
  ou la derniere image gele. A l'oeil, l'agrandissement ne se voit pas sur un
  sujet macro peu texture (ici un boitier gris sur fond sombre); ne compte pas
  dessus sur un plan detaille. Proof: journaux 10h30 et 16h30 du 21/08.
  CONTRE-EPREUVE 22/08 (16h30), le seuil tient: beat 0 de 23 mots sur 210 ->
  5,2 s -> clip 6 s 720p a $0,60. Donc ~24 mots sur 210 est bien la bascule, et
  a 23 on la rate d'un mot. Sujet macro peu texture (une bague metallique sur
  fond uni), l'agrandissement 1,5x ne se voit pas a l'oeil sur la frame rendue,
  ca re-confirme la nuance du 21/08. Si tu heritez d'un spec de scout et que le
  beat 0 est a 22-24 mots, sache que tu choisis la resolution du seul plan sur
  lequel se joue l'audition: +2 mots coutent $0,36 et achetent le 1080p natif.
  Ajout 17/08 (16h30), LE PLAFOND JOURNALIER SE TOUCHE VITE QUAND UN BEAT 0 RESISTE:
  un Reel dont la pellicule refuse deux clips coute $3,57 a lui seul (3 x $0,96 de veo
  + 2 narrations + 5 stills), et la journee a fini a $5,19 sur un coupe-circuit a $6.
  Donc le 2e Reel d'une journee qui a deja achete un veo n'a de la place que pour UN
  seul rachat d'opener avant que genmedia refuse. Reflexe si ta 1re pellicule est
  refusee: lis `state/spend.jsonl` du jour AVANT de racheter, et si la marge est sous
  ~$2, change de SURFACE (recu, photo, card) plutot que de retenter le meme clip. Le
  rebuild lui-meme reste gratuit tant que tu epingles avec `file` tout ce qui est deja
  achete (ce jour-la: narration, alignement, 2 recus et 3 stills re-servis, seul le veo
  paye). Proof: run 16h30 17/08.
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
  Ajout 26/08 (16h30), PREMIER CAS MESURE OU LES TROIS LECTURES ECHOUENT, et la
  cause n'est pas la malchance, c'est OU TU ECRIS DANS LA FENETRE. Script de 214
  mots (fenetre 193-221, cible 205, ledger 3,69 mots/s sur 12 lectures): les
  trois lectures sont sorties a 3,39 / 3,17 / 3,39, soit le groupe le plus LENT
  des 101 lectures du registre, et le moteur a clampe le stretch a 1,120 pour un
  fichier de 60,7 s. Cout: 3 achats TTS ($0,097) au lieu d'un, et ~90 s. La
  mecanique a comprendre une fois: la fenetre est calculee sur la MOYENNE du
  registre, donc ecrire au PLAFOND (221) ne laisse aucune marge quand la lecture
  du jour tombe sous la moyenne, alors qu'ecrire a la CIBLE en laisse des deux
  cotes. Regle: vise le `target` que `validate.mjs window` imprime, jamais le
  `max`; a 214 mots on est deja a +9 de la cible et c'est ce qui a coute les
  trois lectures. Le Reel part quand meme (le manuel l'autorise, 60,7 s), donc
  ce n'est pas un blocage, c'est une depense evitable. Proof: build 16h30 26/08,
  state/voice-rate.jsonl 3 lignes accepted:false.
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
  Ajout 14/08 (10h30), LE GATE PASSE ET LE MOTEUR REFUSE, deux controles differents
  sur le meme spec, et ca coute un build entier si tu l'apprends au moteur. Le gate
  (validate.mjs) teste le partage de vocabulaire; le MOTEUR (promptcraft.promptIssues)
  teste en plus `forbidNames`, construit par extractForbidNames = tous les mots
  capitalises de post.slides + centralClaim, hors CAPITALIZED_NOISE, 40 max. Et il
  matche en MOT ENTIER: le dossier X avait "Label" dans une evidence, donc un spec
  disant "visibility label codes" est refuse ("prompt names Label") alors que le spec
  voisin disant "visibility labels" PASSE, parce que \bLabel\b ne matche pas "labels".
  Singulier refuse, pluriel accepte, sur le meme mot: ce n'est pas storyVocab, ne
  cherche pas de ce cote. Deux beats sont morts la-dessus APRES l'achat du veo. Le
  reflexe qui coute 10 s, a faire AVANT d'ecrire les specs image, en plus du
  vocabulaire: imprime la liste interdite (les capitales de tes diapos), et note que
  les mots francais de tes evidences y entrent aussi (Deux, Les, Pour, Sous, Sur,
  Elles ont ete listes ce jour-la). Ajout 14/08 (10h30) bis, LE REFUS RAI DE VEO EST
  GRATUIT ET SE CONTOURNE: le premier tir a rendu `raiMediaFilteredCount: 1` avec
  "We encountered an issue with the audio for your prompt", aucun uri video, et
  spend.jsonl n'a RIEN facture (verifie: seule la narration y etait). Le sujet
  n'avait rien de sensible (un ecran de portable). Une action reecrite a suffi
  ("scrolling slowly upward" -> "sliding slowly downward") et le meme spec est passe
  au coup suivant, $0,60 pour 6 s. Donc un refus RAI n'accuse pas ton sujet et ne se
  paie pas: change l'action et relance une fois avant de renoncer au beat 0 anime.
  Ajout 15/08 (06h30), UN MOT QUE simplicityIssues REFUSE A LUI SEUL, et il n'est
  dans aucune liste du manuel: "highway". Le spec "a single heavy truck on an empty
  highway lane" est refuse "describes a many-moving-objects scene (highway)" alors
  que l'adjectif dit explicitement que la voie est VIDE et que le sujet est UN
  camion. Le mot seul suffit, l'adjectif ne le rachete pas. Remede accepte du
  premier coup: garder le sujet et sortir le decor ("a single heavy truck seen from
  behind on an empty lane" + setting "in bright daylight"). Sur une actu de route,
  ecris la VOIE, jamais l'autoroute. Et le reflexe qui coute 10 s avant d'ecrire un
  spec veo, en plus du vocabulaire et de la liste interdite: passe tes candidats
  dans `veoPrompt` + `simplicityIssues` en local (les deux sont exportes par
  promptcraft.mjs), quatre variantes se testent en une commande et sans reseau.
  Ajout 15/08 (10h30), LA MARQUE REELLE APPARAIT AUSSI DANS UNE STILL GENEREE, et
  toutes les entrees "marque" de ce carnet (Augmentin 08/08, Embark 15/08, Logitech
  13/08) parlaient de `photo`: c'est donc une famille de plus, et elle passe TOUS les
  controles (gate vert, promptIssues vide, simplicityIssues vide, vocabulaire ancre).
  Le spec "a large truck wheel resting on asphalt" + extreme close-up a rendu un
  pneu ou se lisent en grand MICHELIN (deux fois) et LT 315/80 R22.5, sur une actu
  ou Michelin n'existe pas. Le modele d'image met une vraie marque des que l'objet
  demande est un produit de grande consommation qui en porte une (pneu, telephone,
  portable, electromenager, chaussure). Remede mesure, $0,13 et rebuild a cout nul
  (narration + veo + 2 stills re-servies par leur .key): demander le SOUS-ORGANE qui
  exclut la surface de marque, "a truck wheel hub and its metal bolts" + "extreme
  close-up, the hub fills the entire frame" a rendu du premier coup un moyeu net,
  zero texte lisible. Regle: si l'objet de ton spec porte une marque dans la vraie
  vie, cadre la piece qui n'en porte pas. Rien ne le voit sauf le REGARD sur la
  frame. Proof: run 10h30 15/08, still_5 refuse puis rachete.
  Ajout 15/08 (16h30), LE MOT QUI RAMENE LA PROSE INVENTEE EST "NAMES", et il
  precise la recette du 10/08 au lieu de la contredire. Le spec "a laptop screen
  filled with a single column of transparency setting NAMES" a rendu un ecran de
  lignes bidon lisibles en plein cadre pendant 6 s: *XXXXXXX*, *YYYYY, ZZZZZZ ZZZ,
  AAAAA AAAAA, BBBBBBB B... soit du texte de remplissage alphabetique, famille
  "page de preuve" du 01/08. La recette du 10/08 marche parce qu'elle demande des
  NUMBERS ("a single column of position numbers"), pas parce qu'elle demande une
  colonne: des que le mot final du spec designe du LANGAGE (names, labels, titles,
  settings, options, menu), le modele ecrit des mots, et il les invente. Remede
  mesure, $0,13 et rebuild a cout nul (narration + veo + recu + still 7 re-servis
  par leur .key): "a laptop screen filled with the SOURCE CODE of an image metadata
  reader" a rendu du premier coup un vrai editeur colore (generic_metadata_reader,
  parse_header, read_tags), ca se lit comme de la notation et pas une phrase
  anglaise. Regle: dans un spec d'ecran, le dernier mot doit etre code, numbers,
  log ou timestamps, jamais names. ET UNE ACTION VEO SURE DE PLUS, a cote de la
  rotation du 12/08: "tilting slowly so the light sweeps across the watermark, the
  image staying whole and in frame" a rendu propre du premier coup, $0,96,
  pellicule 8 vignettes lue (meme objet, meme taille, present a la 8e). Comme la
  rotation elle n'a aucun etat final et ne fait entrer le sujet dans rien, et en
  prime le balayage de lumiere FABRIQUE l'action non resolue quand l'histoire
  (un reglage produit qui change) ne contient aucun evenement filmable.
  Proof: run 16h30 15/08, still_3 refuse puis rachete.
  Ajout 16/08 (16h30), LE PIRE CAS DE forbidNames, ET IL TUE LA FORMULE QUE LE
  MANUEL LUI-MEME RECOMMANDE: le mot interdit peut etre un mot anglais BANAL, et
  il matche DANS un compose a trait d'union. Dossier texte invisible: une evidence
  de diapo commence par "Close inspection revealed text set in tiny-point white
  type", donc extractForbidNames retient "Close" (majuscule de debut de phrase,
  famille Solar/Software/Music), et `\bClose\b` matche "close" dans "close-up".
  Or "extreme close-up, the X fills the entire frame" est la formule que routine.md
  imprime en remede du piege "la table au lieu de l'histoire": les QUATRE specs
  image/veo du spec la portaient, donc le build est mort au beat 0 sur
  "prompt names Close". Zero dollar perdu (le refus tombe AVANT l'achat veo, seule
  la narration etait payee, et elle est re-servie par sa .key au rebuild), mais un
  build entier et ~8 min. Remedes mesures, acceptes du premier coup et rendus
  propres: "macro framing, the sheet fills the entire frame" et "seen from the side,
  the stack fills the frame" - garde toujours la moitie "the X fills the entire
  frame", c'est elle qui fait le cadrage serre. REFLEXE, 10 s, a faire AVANT
  d'ecrire un seul spec, en plus du vocabulaire: imprime la liste interdite, elle
  est exportee. `node --input-type=module -e "import fs from 'fs';import
  {extractForbidNames} from './src/reel2.mjs';console.log(extractForbidNames(
  JSON.parse(fs.readFileSync('posts/<slug>.json','utf8'))).join(', '))"`. Sur ce
  dossier elle rendait 19 mots dont Close, Law, News, Media, Reason, Invisible,
  Comment, Consider, Les, Fini: des mots que personne ne lit comme des noms
  propres et qu'on ecrit sans y penser dans un spec. Et les 4 candidats corriges
  se testent hors reseau et gratuitement d'un coup via veoPrompt/imagePrompt +
  promptIssues({forbidNames}) + simplicityIssues (tous exportes), ce qui evite le
  deuxieme aller-retour. Proof: run 16h30 16/08, build 1 refuse, build 2 COMPLIANT.
  Ajout 17/08 (06h30), UN MOT DE PLUS QUE simplicityIssues REFUSE A LUI SEUL,
  meme famille que "highway" (15/08): **"traffic"**. Le spec "a laptop screen
  filled with the source code of a traffic logging service" est refuse
  "describes a many-moving-objects scene (traffic)" alors que le sujet est UN
  ecran et qu'il s'agit de trafic RESEAU, pas de voitures; le controle ne lit
  que le mot. Remede accepte du premier coup: "a request logging service". Sur
  une actu d'infrastructure ou de reseau, ecris requete ou journal, jamais
  trafic. Et le test hors reseau recommande le 15/08 se re-confirme comme le
  meilleur usage de 10 secondes d'un scout: veoPrompt/imagePrompt +
  promptIssues + simplicityIssues ont attrape ce refus AVANT le gate, donc sans
  aller-retour reseau ni build. Mesure aussi ce matin, cote ANCRAGE: sur une
  actu d'ENQUETE ou de RAPPORT, storyVocab ne contient aucun objet filmable
  (cas du 09/08), et les seuls mots surs sont les noms du DOCUMENT lui-meme,
  report, survey, output, screening, logging, vendor, access. Les 8 specs
  image/veo des deux posts banques ce jour-la sont tous ancres la-dessus.
  Ajout 18/08 (06h30), LE MOT INTERDIT QUI VIENT DU MOTEUR ET PAS DE TON SPEC,
  et c'est la pire variante de forbidNames parce qu'aucun mot de ton spec n'est
  en cause: le gabarit de lumiere des humeurs contient "soft even daylight
  through large WINDOWS". Donc des qu'une diapo ecrit "Windows" avec sa
  majuscule (ici "Windows Recall" sur une actu de vie privee),
  extractForbidNames retient Windows et promptIssues refuse LES QUATRE beats
  image/veo du post d'un coup, sur un mot que veoPrompt/imagePrompt injectent
  eux-memes. Mesure: 4 refus sur 4, "prompt names Windows". Remede gratuit,
  applique avant le gate: ecrire la marque autrement dans la diapo ("Recall,
  chez Microsoft"), le script parle et la legende peuvent garder le nom (ils
  n'alimentent pas forbidNames). Meme famille que "Close" le 16/08, sauf que
  la reecriture ne peut PAS se faire cote spec. Regle: les mots du gabarit
  (windows, daylight, desk, screen, frame, lens) sont a bannir des MAJUSCULES
  de tes diapos, pas de tes specs. Le test hors reseau du 15/08 (veoPrompt +
  promptIssues + simplicityIssues sur les 4 candidats) l'a attrape en 10 s,
  avant le gate et avant tout achat.
  Ajout 22/08 (06h30), LE CONTROLE HORS RESEAU SE FAIT AUSSI SUR UN SPEC HERITE,
  et c'est la variante qui coute le plus cher parce que personne ne pense a le
  refaire. Le spec Oura banque la veille etait PASSED au gate, et son beat 0 veo
  ("a smooth metal smart ring") serait mort en moteur sur `prompt names "Ring"`:
  les citations portent "Oura Ring 5", donc Ring est dans extractForbidNames
  (famille Pixel Watch du 12/08, mais sur le mot MEME du sujet). Le refus tombe
  avant tout achat, donc $0, mais c'est un build entier et ~8 min pris sur la
  fenetre de publication. Remede gratuit: le nom generique que le reste du spec
  utilisait deja ("a smooth metal band"), accepte du premier coup. ET LE SECOND
  DEFAUT TROUVE DANS LE MEME BEAT, regle du 17/08 16h30 non appliquee: humeur
  `tension` + "extreme close-up, the X fills the frame" = dolly-in sur un sujet
  qui remplit deja le cadre, donc gonflement hors cadre. Ajoute
  `camera: "locked-off static shot, no camera movement, no zoom"`. REGLE POUR UN
  SCOUT: passe veoPrompt/imagePrompt + promptIssues + simplicityIssues sur TOUS
  les specs de la journee, y compris ceux qu'un run precedent a banques, ca coute
  10 s et ca ne se voit ni au gate ni a l'oeil.
  CONTRE-EPREUVE 26/08 (06h30), ET ELLE A SAUVE UN BUILD A LA MEILLEURE HEURE DE
  LA JOURNEE: le spec Waymo banque la veille etait PASSED au gate, et son beat 0
  veo serait mort en moteur sur `prompt names "Level"` parce que sa `composition`
  disait "medium side shot AT STREET LEVEL" et que les citations portent "Level 4"
  (le cadre juridique allemand). Le mot fautif n'etait donc ni le sujet, ni
  l'action, ni une marque: c'est un mot de cadrage parfaitement anodin, dans le
  champ auquel personne ne pense, famille de "Close" (16/08) mais un cran plus
  vicieux puisque `composition` se recopie d'un spec a l'autre sans etre relu.
  Remede gratuit, accepte du premier coup: "medium side shot from the pavement".
  Le refus serait tombe AVANT l'achat veo (donc $0) mais coutait ~8 min sur une
  fenetre de publication de 13h05 Paris. Regle: passe promptIssues sur TOUS les
  champs de spec d'un spec herite, `camera` et `composition` compris.
  Ajout 18/08 (10h30), LE CLAVIER GENERE EST UN CLAVIER WINDOWS, variante neuve
  de la famille "marque reelle dans une still" (Michelin 15/08, Augmentin
  08/08): le spec "a black keyboard with its keys lit from the side" + "macro
  framing, the keys fill the entire frame" a rendu un clavier PC dont les
  touches win, ctrl et alt sont LISIBLES au rendu 1080x1920, sur une actu qui ne
  parle que de macOS et dont la carte-titre dit "TON MAC". Le modele prend le
  clavier majoritaire, exactement comme il grave une vraie marque sur un pneu.
  Gate vert, promptIssues vide, simplicityIssues vide: SEUL le regard sur la
  frame RENDUE l'attrape. Remede mesure, $0,13 et rebuild a cout nul (narration,
  alignement, veo et 2 stills re-servis par leur .key, 2 recus epingles avec
  `file`): garder le sujet et RESSERRER le cadre pour sortir la rangee de
  modificateurs. "macro framing, four keys fill the entire frame" a rendu du
  premier coup quatre touches de la rangee de repos (A S D F), zero touche
  specifique a un OS, zero marque, et une image plus forte que la large. Regle:
  des qu'un objet existe en version Windows/Apple/Android et que ton histoire
  nomme UNE des plateformes, cadre la piece qui ne tranche pas. Proof: run
  10h30 18/08, still_2 refuse puis rachete.
  Ajout 24/08 (10h30), DEUX RACHATS LE MEME BUILD, et le second corrige une
  croyance sur `composition`. (1) La prose inventee revient par le mot
  "REPORT", pas seulement par "names" (15/08): le spec "a printed driver
  complaints REPORT page filled with columns of numbers" a rendu une vraie
  table dont la colonne "Complaints" etait remplie d'anglais bidon lisible
  ("Complaints uoarted ii wnt-cewrnored events", "Bauwerda caid swols tn
  wnsterred"), avec en prime un mug de cafe dans le cadre, soit exactement la
  "page de preuve" du 01/08. Le mot report/complaints appelle un document en
  PHRASES, et le modele les invente. Remede mesure, $0,13: contraindre le
  contenu cellule par cellule, "a printed page holding a plain grid of driver
  account numbers and dates, EVERY CELL A NUMBER" a rendu du premier coup une
  grille de chiffres nette, zero mot invente. Regle: dans un spec de document,
  decris ce que contient chaque case, pas le genre du document. (2) `composition:
  "macro framing, the screen fills the entire frame"` NE SUFFIT PAS a obtenir le
  gros plan si `setting` nomme du mobilier: "on a plain desk under an angled desk
  lamp" a rendu un plan LARGE de bureau sombre (fenetre, lampe, cable, clavier),
  le sujet plus petit que le decor, soit le declencheur "le bureau au lieu de
  l'histoire" du manuel. Le `setting` gagne contre le `composition`. Remede
  mesure, $0,13: VIDER le setting de tout meuble ("in soft even daylight") et
  laisser le cadrage au composition. Regle: pour un gros plan, ne nomme aucun
  meuble dans setting, le modele cadre ce que tu meubles. Et un rappel qui a
  coute un aller-retour de gate: `simplicityIssues` refuse "rows of" dans un spec
  `image` AUSSI, pas seulement dans un veo ("describes a many-moving-objects
  scene"); "a screen filled with customer star ratings and numbers" passe, et les
  etoiles se generent parfaitement (symboles, pas de la prose). Proof: run 10h30
  24/08, stills 1 et 4 refuses puis rachetes, rebuild a cout nul pour le reste
  (narration + alignement + veo + still 5 re-servis par leur .key, 2 recus
  epingles avec `file`), $0,26 au total pour les deux.
  Ajout 25/08 (16h30), LE SUJET VEO ABSTRAIT N'A PAS DE PERMANENCE, et ca coute
  $0,96. Un beat 0 dont le sujet est une TEXTURE ou une MATIERE (ici "an extreme
  macro view of a bright computer screen where the individual colour pixels are
  visible", action "the pixels slowly brightening one after another") a rendu un
  clip ou l'ecran SORT DU CADRE aux panneaux 3 a 7 du filmstrip: fond noir et
  moire arc-en-ciel abstraite, puis retour de la grille au 8e. Les regles 1 a 4
  du manuel etaient pourtant respectees (motion, une seule etape, "the screen
  staying whole and in frame"): elles ne suffisent pas quand le sujet n'est pas
  un OBJET. Un macro de pixels/de lumiere/de grain n'a aucune silhouette a
  conserver, donc le modele derive vers du motif abstrait, soit exactement le
  wallpaper que l'ouverture doit eviter. REMEDE MESURE, vert du premier coup au
  rachat: remets l'abstrait DANS un objet ordinaire entier et donne le mouvement
  a ce qui apparait dessus. "a computer screen on a desk where a colourful
  generated image is appearing on a plain white background" + action "the
  colourful image fading in gradually from the middle of the white background,
  the whole screen staying still and fully inside the frame the entire time" a
  donne 8 panneaux avec le meme moniteur, meme taille, meme place, l'image qui
  se forme du centre vers les bords. Regle: si tu ne peux pas dessiner la
  SILHOUETTE de ton sujet, ce n'est pas un sujet veo, c'est un fond. Le cache
  n'a pas ressuscite le refus (l'action changee change l'empreinte, conforme au
  manuel). Proof: run 16h30 25/08, veo_0 refuse puis rachete, rebuild a cout nul
  pour tout le reste (narration + alignement + 3 stills re-servis).
  Ajout 26/08 (10h30), SUITE DIRECTE: mettre l'abstrait dans un objet entier
  suffit pour la PERMANENCE et ne suffit pas pour l'AUDITION. Un beat 0 veo
  "a computer monitor filled with a single column of plain accuracy numbers" +
  composition "macro framing, the monitor fills the entire frame" a rendu 8
  panneaux parfaits (moniteur entier, meme taille, meme place: la regle du
  25/08 marche) et une frame zero INUTILISABLE: le modele lit un ecran rempli
  de chiffres comme un TERMINAL SOMBRE, donc fond noir + colonne de chiffres
  blancs, soit exactement le defaut des TROIS COUCHES DE TEXTE que le manuel
  reproche au screenshot en beat 0 (carte-titre + karaoke + mur de caracteres),
  et les chiffres sortent malformes a la lecture ("0.4.304", deux points
  decimaux). Le "Every visible surface and screen is clean... free of readable
  lettering" que promptcraft ajoute ne l'empeche pas: des chiffres ne sont pas
  du lettering. REMEDE MESURE, vert du premier coup au rachat ($0.60): dis la
  couleur du FOND de l'ecran et recule le cadre. "a computer monitor on a desk
  showing a single narrow column of small dark numbers on a plain white
  background" + composition "medium framing, the whole monitor fills most of
  the frame" a rendu une piece claire, un ecran BLANC, la colonne petite et
  grise qui glisse vers le bas, et la carte-titre (bande noire, type blanche)
  se detache enfin. Regle generale: sur un beat 0 veo qui montre un ecran,
  choisis la couleur de fond a la place du modele (famille du "dark computer
  screen" du 23/08 lu comme un theme), et garde le macro pour les beats du
  milieu, jamais sous la carte-titre. Proof: run 10h30 26/08, veo_0 refuse au
  filmstrip+frame puis rachete, rebuild a cout nul pour tout le reste.
  Ajout 27/08 (16h30), UN VERBE DE LUMINOSITE APPLIQUE AU SUJET LE DISSOUT,
  et c'est l'extension la plus large de l'entree du 25/08: la, le sujet etait
  une TEXTURE et n'avait pas de silhouette a garder; ici c'est un TELEPHONE,
  objet ordinaire entier, et il se dematerialise quand meme. Beat 0 "a single
  phone lying flat on a plain table, its screen brightly lit" + action "its
  bright screen dimming steadily, the phone staying whole, the same size and
  fully inside the frame the entire time" (donc la clause de permanence de la
  regle 3 ETAIT ecrite): pellicule verte jusqu'a 4 s, puis des 4,5 s l'appareil
  perd ses aretes et LA TABLE TRANSPARAIT A TRAVERS LUI, jusqu'a un fondu
  translucide sans objet aux 3 derniers panneaux. Diagnostic: `dimming` /
  `fading` / `darkening` decrivent une variation de la LUMINANCE DU SUJET
  LUI-MEME, et un modele video sans permanence lit ca comme l'autorisation de
  faire disparaitre l'objet, quelle que soit la clause de permanence ajoutee
  a cote. Ce n'est PAS un etat terminal au sens de la regle 1 ("toward black"
  aggrave, mais le simple "dimming steadily" suffit). REMEDE MESURE, vert du
  premier coup au rachat ($0.60, clip de 6 s): garde la luminosite du sujet
  CONSTANTE et donne le mouvement a ce qui est AFFICHE dessus, en ancrant le
  corps par sa matiere. "a single phone standing upright on a plain table, its
  bright screen showing a colourful pattern" + action "the colourful pattern on
  its screen sliding downward and out of view, the phone itself staying whole,
  the same size, the same solid dark body and fully inside the frame the entire
  time" a rendu 6 panneaux avec le meme appareil, meme taille, meme place,
  aretes nettes au dernier, et le motif qui bouge sans jamais resoudre. Regle:
  sur un beat 0, ne fais JAMAIS varier la lumiere du sujet; fais varier ce
  qu'il porte. Proof: run 16h30 27/08, veo_0 refuse a la pellicule puis rachete.
  Ajout 27/08 (16h30), LE FILTRE RAI DE VEO REFUSE PARFOIS UN PROMPT INOFFENSIF,
  IL NE FACTURE RIEN, ET LA MEME COMMANDE RELANCEE TELLE QUELLE PASSE. Mesure:
  `Veo finished with no video uri: {"raiMediaFilteredCount":1,
  "raiMediaFilteredReasons":["We encountered an issue with the audio for your
  prompt, which means we could not create your video..."]}`, reel2 sort en
  exit 1, AUCUNE ligne dans state/spend.jsonl (verifie: total du Reel inchange
  a $1.1334 avant/apres). Le prompt refuse etait un telephone sur une table:
  rien a censurer, et le motif invoque ("l'audio") n'a aucun sens pour un
  moteur qui achete du muet. Famille de la toux blog.google (19/08) et du 503
  du serveur de signature (24/08). Regle: sur ce message precis, RELANCE reel2
  une fois dans le MEME repertoire avant de toucher au `spec`, tout le reste
  (narration, alignement, stills deja payes) ressort du cache, donc la relance
  est gratuite. Ne reecris le prompt QUE si le refus se repete.
  Ajout 01/09 (16h30), DEUXIEME MESSAGE DE REFUS VEO, MEME REMEDE, ET IL N'A
  RIEN A VOIR AVEC LE PROMPT: `Veo refused: This model is currently
  experiencing high demand. Spikes in demand are usually temporary. Please try
  again later.` Reel2 sort en exit 1 APRES avoir paye la narration ($0,03) et
  l'alignement. AUCUNE ligne video dans state/spend.jsonl (verifie: la seule
  ligne video du run est le rachat de la relance, $0,60). Relance immediate de
  la MEME commande dans le MEME repertoire: narration et clock ressortent du
  cache ("reusing the reading already bought"), le clip passe du premier coup,
  cout de l'incident $0. Donc sur un refus veo, la question n'est jamais
  "faut-il reecrire le spec" avant d'avoir relance une fois: deux motifs
  distincts (filtre RAI 27/08, saturation 01/09) ont le meme remede, et
  attendre ne sert a rien non plus (relance 3 minutes apres, servie).
  Proof: run 16h30 01/09, journal + spend.jsonl.
  Ajout 27/08 (16h30), DEUX RACHATS DE STILL DU MEME BUILD, ET LE SECOND EST LA
  FAMILLE "monitoring" DU MATIN, CONFIRMEE SUR UN AUTRE MOT. (1) PROSE INVENTEE
  SUR UN DOCUMENT, la famille que le manuel refuse: "a single identity card
  lying on a plain table, its printed surface filling the view" a rendu une
  carte couverte d'anglais inventé et PARFAITEMENT LISIBLE ("SECURITY OF
  EXPERT", "Density difect / cass", "Emergrass Data"), sur le 3e plus long beat
  du Reel. Le cadrage, lui, etait bon: la correction du 27/08 10h30 (objet dans
  `subject` ET dans `composition`) avait marche. REMEDE MESURE, propre du
  premier coup: interdis l'ecriture au lieu d'esperer qu'elle sorte bien,
  "its surface smooth and blank apart from one small gold chip, no writing
  anywhere on it" a rendu une carte blanche nette avec sa seule puce doree.
  Sur tout document genere, decris-le VIERGE et laisse un seul symbole porter
  la lecture. (2) "a single fingerprint pressed onto a clean glass surface" +
  "extreme close-up, the fingerprint fills the entire frame" a rendu une
  EMPREINTE-SCULPTURE dans le hall vitre d'un batiment public, avec des gens
  flous assis autour: exactement le "monitoring -> moniteur medical" du matin,
  sur le DERNIER beat parle. "fingerprint" seul resout vers son referent le
  plus photographie, qui en banque d'images est le monument ou le pictogramme,
  pas la trace. REMEDE MESURE, propre du premier coup: nomme la MATIERE et la
  micro-structure. "one greasy fingerprint left on a clean sheet of glass, its
  curved ridges filling the view" + "extreme macro close-up from directly
  above, the fingerprint ridges fill the entire frame" a rendu une vraie macro
  de crêtes plein cadre. Regle generalisee des deux familles du 27/08: un nom
  ABSTRAIT ou ICONIQUE (monitoring, fingerprint, identite, securite) doit
  toujours etre accompagne de CE QU'ON VOIT PHYSIQUEMENT, la matiere, la
  texture, ou ce qui est affiche, sinon le modele rend le referent le plus
  photographie du mot, qui est presque toujours une autre histoire. Cout des
  deux rachats: $0.2492, tout le reste ressorti du cache.
  Ajout 26/08 (10h30), RE-CONFIRMATION DU VENV WHISPER A MOITIE CONSTRUIT
  (entree du 24/08, point 4): conteneur froid, meme mort exacte sur
  `ReadTimeoutError files.pythonhosted.org` pendant le bootstrap pip, au
  PREMIER build du run. Le remede documente marche tel quel et coute 70 s:
  `/root/.cache/oom-whisper/bin/pip install --retries 5 --timeout 120
  faster-whisper`, puis relance reel2 dans le MEME repertoire. La narration
  deja achetee ($0.0298) est ressortie du cache, $0 perdu, et large-v3-turbo
  s'est retelecharge en 34 s. Ce n'est donc pas un alea rare: sur conteneur
  froid, attends-toi a payer ce detour une fois par run, et ne diagnostique
  rien d'autre avant de l'avoir applique.
  Ajout 31/08 (06h30), TROISIEME MOT INTERDIT QUI VIENT DU GABARIT DU MOTEUR ET
  PAS DE TON SPEC, apres "Windows" (18/08) et la camera d'humeur (17/08), et
  celui-la vient du SON: `veoPrompt` ajoute toujours `Ambient sound: quiet room
  tone` (promptcraft.mjs l.75). Donc des qu'une source s'appelle **Sixth Tone**,
  extractForbidNames retient "Tone" et promptIssues refuse le beat 0 veo sur
  `prompt names "Tone"` - un mot que ton spec n'ecrit nulle part et que tu ne
  peux pas reecrire cote spec, exactement comme "Windows". Contrairement a
  "Windows", il n'y a PAS besoin de toucher aux diapos: `ambient` est un champ
  de spec accepte par veoPrompt et il REMPLACE la valeur par defaut. Remede
  gratuit, accepte du premier coup: `ambient: "a quiet empty room, faint air
  movement"`. Les champs de spec qui ecrasent un gabarit sont donc trois
  (`camera`, `ambient`, `composition`): quand un mot interdit vient du moteur,
  cherche d'abord s'il existe un champ qui le remplace. Attrape hors reseau, $0,
  avant le premier gate, par le controle du 15/08 (veoPrompt + promptIssues +
  simplicityIssues sur tous les specs). Proof: scout 06h30 31/08.
  Ajout 01/09 (10h30), LE SPEC QUI COMMANDE LUI-MEME LA PROSE INVENTEE, et c'est
  la variante que 15 entrees de cette famille n'avaient pas nommee: toutes
  parlaient d'un mot qui APPELLE du texte (report, ledger, names, checkbox,
  log). Ici le spec DEMANDE le texte en toutes lettres. Deux stills banquees par
  le scout portaient "its two short printed words clearly visible" (une carte
  publicitaire, une carte de prix): rendues, elles affichent **"NOW. HERE."** et
  **"NOW DUE"** en gros caracteres lisibles plein cadre, 6,8 s et 10,4 s, la
  seconde en DERNIER beat. Gate vert, promptIssues vide, simplicityIssues vide,
  COMPLIANT: seul le regard sur la frame l'attrape. "NOW DUE" affirme en prime
  une facture que l'histoire ne contient pas. REGLE: ne demande JAMAIS a une
  still des mots visibles, meme deux, meme courts - "printed words", "a label",
  "a short caption", "its title readable" sont la meme commande que la prose du
  01/08. Et relis les specs HERITES d'un scout avec ce grep avant de payer:
  `grep -o "words\|label\|caption\|title\|text" sur les visual.spec`.
  LE REMEDE QUI A MARCHE DU PREMIER COUP SUR UNE ACTU DE CONVERSATION (chatbot,
  messagerie, assistant), et c'est une recette reutilisable a cote de "colonne
  de chiffres" (10/08): decris le texte comme une TEXTURE, pas comme du contenu.
  `subject: "a single phone lying flat on a plain table, its screen showing a
  plain conversation with the message text rendered as fine horizontal grey
  lines rather than readable words, and one small plain grey advertising block
  among them"` + `setting: "in soft even daylight"` (vide de tout meuble, regle
  du 24/08) + `composition: "extreme close-up from directly above, the phone
  screen fills the entire frame"`: rendu des bulles de messages remplies de
  lignes grises, ZERO mot, et l'image reste dans l'histoire. La meme formule
  tenait deja le beat 0 veo du meme Reel (telephone debout, barre de pub qui
  monte dans les lignes grises), accepte du premier coup, pellicule 8 vignettes
  lue: meme objet, meme taille, present a la 8e - re-confirmation du 17/08
  ("un ecran RIGIDE dont le CONTENU bouge") avec une translation verticale a la
  place de la rotation. Cout de la lecon: $0,2586 jetes (les deux stries a mots)
  + $0,1266 de rachat, rebuild a cout nul pour tout le reste (narration,
  alignement, veo, stills 2 et 6 re-servis par leur .key, 2 recus epingles).
  ET LE MEILLEUR RACHAT N'ETAIT PAS UNE STILL: le beat de chute est passe a une
  `photo` reelle deja documentee dans ce carnet, "Screen time" (Rawpixel, CC0,
  thumb 1920x1280, crop=720:1280:537:0, 5e re-confirmation), telechargee et
  epinglee file+credit en 2 min pour $0. Le Reel finit donc sur un vrai visage
  et compte 4 surfaces reelles au lieu de 3. Reflexe: quand une still de fin est
  refusee au controle des frames, regarde d'abord si une valeur sure du carnet
  fait l'affaire - c'est gratuit et c'est plus haut dans la hierarchie.
  Proof: run 10h30 01/09, stills 5 et 8 refusees puis remplacees.
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
  Ajout 11/08 (22h), LE PIN `file` EST RELATIF A LA RACINE DU DEPOT, PAS AU DOSSIER
  media/: le moteur passe la valeur VERBATIM a ffmpeg, qui tourne depuis la racine. Un
  pin "photo_x.jpg" tue donc le build au RENDU (apres la narration ET le veo) sur
  "Error opening input file photo_x.jpg", alors que la sortie, elle, est prefixee par
  media/<slug>/, ce qui rend le message trompeur. Ecris toujours
  "media/<slug>/photo_x.jpg". Cout mesure: un build entier perdu, mais $0 au rebuild
  (narration et veo re-servies par leur .key). Verifie tes pins en 5 s avant de lancer:
  `grep '"file"' posts/<slug>.json` doit montrer des chemins commencant par media/.
  Ajout 12/08 (06h30), UN RECU PEUT S'OUVRIR EN PLEIN MILIEU DE L'ARTICLE, type
  nouveau et different de la page d'index du 09/08: silicon.co.uk se capture
  proprement (0 pub, 0 banniere cookies) mais la page s'ouvre DEJA DEFILEE dans le
  corps du texte, titre et signature hors cadre. Le moteur ne remonte jamais en haut,
  donc un recu silicon pris en moteur montrera toujours du corps de texte. Sur ce
  dossier c'etait une CHANCE (le fragment porte a la fois "more than 530,000 faces,
  resulting in no accurate matches" et la phrase Big Brother Watch), garde par
  `crop=1290:2060:0:0` qui conserve le masthead Silicon et coupe le bloc "Subscribe"
  du bas; il reste une ligne coupee en deux sous le masthead, cosmetique. Si tu veux
  le TITRE d'un domaine qui fait ca, il faut le capturer hors moteur avec
  `page.evaluate(() => window.scrollTo(0,0))` avant le screenshot puis epingler
  `file` (c'est du travail de scout, ca coute 0 $). railadvent.co.uk se capture du
  PREMIER coup, ~4 min, 1 frame au goto et 23 au tir: masthead, titre entier,
  signature, "Last updated: 11th August, 2026" ET la photo de presse TfL du vrai mat
  de cameras LFR; `crop=1290:2340:0:0` coupe le bloc "Discover more" et la cloche de
  notification. techradar.com est de la famille O(frames) du 06/08 en PIRE: tue apres
  20 min sans avoir ecrit un fichier (4 frames au goto pourtant). Traite-le comme une
  source, jamais comme un recu.
  Ajout 13/08 (10h30), TROIS RECUS MESURES EN MOTEUR sur le dossier Twitch/Amazon, et le
  plus lent est le meilleur. engadget.com se capture en ~1 min mais porte en bas une PUB
  FLOTTANTE (encart "Covered California" avec sa croix de fermeture), non retiree par les
  deux passes de consentement: `crop=1290:2250:0:0` la coupe et garde masthead, fil
  d'Ariane, titre entier, chapo, signature et date. kotaku.com se capture en ~2 min et
  porte DEUX plomberies, un encart pub lateral et la banniere rose "About Cookies on this
  Site": `crop=1290:1600:0:0` coupe les deux et garde masthead, titre entier, tags,
  signature, date et le visuel Twitch. pcgamer.com est de la famille O(frames) du 06/08
  mais NE MEURT PAS comme techradar: il n'avait rien ecrit a 24 min, j'ai tue le build, et
  son shot_6.png etait sur le disque a ~28 min, PROPRE du premier coup et sans banniere
  cookies (masthead, "Software > AI", titre entier qui porte la citation Minton, tag News,
  signature, chapo). `crop=1290:2300:0:0` enleve la barre "Follow us / Newsletter" du bas;
  il reste une ligne d'affiliation minuscule, cosmetique. DEUX LECONS: (1) ne declare pas
  un recu pcgamer mort a 20 min, mais ne le mets pas dans un build que tu veux rapide,
  capture-le en scout et pin-le; (2) apres avoir tue un build, REGARDE ce qui est sur le
  disque avant de reecrire le spec, le fichier peut arriver apres le kill (ici il a rendu
  au beat 6 son vrai recu au lieu d'une still generee).
  Ajout 13/08 (16h30), DEUX RECUS MESURES EN MOTEUR sur le dossier filigrane Claude.
  techtimes.com se capture PROPREMENT du premier coup, ~1,5 min, sans recadrage:
  masthead TECH TIMES, fil d'Ariane, titre entier sur 4 lignes, chapo, signature et
  date. C'est le recu leger a prendre sur ce genre d'actu. searchenginejournal.com se
  capture vite AUSSI mais porte DEUX plomberies que les deux passes de consentement ne
  retirent pas: un encart webinar plein cadre en HAUT ("JOIN US / The 3-Part GEO
  Strategy... / Register Now" + une croix) ET un bandeau pub violet coince ENTRE le
  masthead et le chapeau. Les deux etaient visibles en plein cadre au rendu.
  `crop=1290:1600:0:1000` les coupe TOUS LES DEUX et garde le chapeau vert "SEJ · AI
  Search" (qui identifie la source a lui seul), le titre entier, et surtout le bloc
  "Highlights" dont les puces portent l'histoire ET sa nuance ("Marks can appear on
  human writing that Claude only edited or translated"). Sur SEJ, ne garde donc PAS le
  masthead: le recadrage qui commence sous la pub est meilleur recu que la page entiere.
  Ajout 14/08 (06h30), DEUX MESURES, ET LA PREMIERE EST UN PIEGE NEUF.
  (1) anthropic.com/research/<slug> SE GATE VERT ET CAPTURE UNE AUTRE PAGE. Le
  dossier turf war s'est gate 19/19 VERIFIED sur ce primaire, et le navigateur a
  rendu DEUX FOIS de suite, a l'octet pres, la page "U.S. K-12 Data Processing
  Agreement" (une page juridique de pied de site): titre net, zero pub, zero
  banniere cookies, donc un recu parfaitement propre qui atteste une histoire qui
  n'est pas la notre. Meme famille que thenextweb le 10/08, en pire: l'URL est la
  BONNE et c'est le primaire. Sur une actu Anthropic, anthropic.com est une source,
  jamais un recu. (2) NE LANCE JAMAIS DEUX CAPTURES EN PARALLELE dans ce conteneur:
  engadget et techcrunch lances ensemble n'avaient rien ecrit apres 30 min, et
  engadget relance SEUL a rendu en 5 min 34 (2 frames au goto), unite.ai seul en
  24 s (1 frame). Les deux navigateurs se privent l'un l'autre; un scout qui veut
  epingler plusieurs recus les fait a la queue leu leu. Recus mesures ce jour-la:
  engadget.com propre du premier coup, `crop=1290:2293:0:0` enleve le filigrane
  "AD" du bas et garde masthead + fil d'Ariane + titre entier + chapo + signature +
  date + la photo; unite.ai propre en 24 s MAIS sa signature affiche "By Jonas
  Reeve, Cognitive AI & AGI, AI Research Agent" (meme bemol que testingcatalog le
  09/08, un article ecrit par une IA grave dans le recu d'un compte qui promet
  l'inverse) et il date l'article du 12/08 alors que la recherche est du 13/08.
  Ajout 15/08 (10h30), UN RECU LEGER DE PLUS, mesure EN MOTEUR: automotiveworld.com
  se capture PROPREMENT du premier coup et vite, sans recadrage: fil d'Ariane, titre
  entier sur 4 lignes, chapo, date, et le debut du corps. 0 pub, 0 banniere cookies,
  et surtout le titre affiche EST l'histoire ("California grants Kodiak AI autonomous
  trucking permit"), donc il passe le controle du 10/08 (lis le titre du recu, ne
  verifie pas seulement qu'il est propre). Sur une actu industrielle ou automobile,
  c'est le recu a prendre avant la presse tech generaliste, qui est de la famille
  O(frames) du 06/08.
  Ajout 15/08 (16h30), engadget.com SANS RECADRAGE cette fois: la capture est
  sortie propre du premier coup en ~4,5 min (masthead engadget, fil "News > AI",
  titre entier sur 4 lignes, chapo, signature, date, photo), zero pub flottante,
  zero banniere. Le filigrane "AD" du 14/08 et l'encart "Covered California" du
  13/08 n'y etaient pas: la plomberie d'engadget est VARIABLE d'un jour a l'autre,
  donc ne pin pas le crop=1290:2293:0:0 par reflexe, REGARDE le shot_N.png d'abord,
  un recadrage inutile coupe le chapo. Et il passe le controle du 10/08: le titre
  affiche EST l'histoire.
  Ajout 16/08 (10h30), DEUX RECUS LEGERS MESURES EN MOTEUR, dossier livres IA, les deux
  PROPRES DU PREMIER COUP et sans recadrage. arxiv.org/abs/<id> se capture en ~1 min et
  c'est un excellent recu sur une actu de PAPIER: bandeau arXiv, fil "Computer Science >
  Computation and Language", l'identifiant, la date de soumission ET de revision, le
  titre entier, les quatre auteurs, et le resume en entier dans le cadre 9:16, plus la
  ligne "Comments: Working Paper Under Review" qui atteste toute seule la nuance du
  script. Zero pub, zero banniere cookies. Il complete l'entree du 16/08 06h30 (qui ne
  parlait que du gate): /abs se GATE et se CAPTURE, la ou PubMed etait jusqu'ici le seul
  recu sur un papier. the-decoder.com se capture aussi du premier coup (~2 min): titre
  entier sur 3 lignes, signature, date, et surtout son encadre "Topics" dont les puces
  portent l'affirmation centrale ("Revenue per book is falling even for titles with no
  detected AI text"), donc le recu prouve l'histoire et pas seulement la source. Les deux
  passent le controle du 10/08 (le titre affiche EST l'histoire). Bemol a savoir: l'image
  de tete de the-decoder porte la mention "Nano Banana Pro prompted by THE DECODER", donc
  sur une actu de contenu genere par IA le recu montre une illustration elle-meme generee;
  minuscule au rendu, mais lis-le avant de cadrer plus bas.
  Ajout 16/08 (16h30), UN RECU LEGER NEUF, mesure EN MOTEUR: lawnews.co.uk se
  capture PROPREMENT du premier coup et vite (petit site, critere O(frames) du
  06/08), sans recadrage: chapeau orange "LEGAL NEWS", titre entier sur 4 lignes,
  signature, date, "5 Mins Read" et le chapo qui porte l'affirmation centrale ET le
  numero de role. 0 pub, 0 banniere cookies, et le titre affiche EST l'histoire
  (controle du 10/08). Sur une actu juridique c'est le recu a prendre. UN BEMOL
  COSMETIQUE A CONNAITRE, famille du bemol the-decoder de ce matin: son image de
  tete est une photo de stock ou se lit "DIVORCE DECREE" sur le document tenu par
  l'avocat, alors que le dossier n'a rien d'un divorce; c'est petit, c'est l'artwork
  du site, et le recadrer couterait le titre (qui est POSE sur cette image), donc on
  le garde en le sachant. the-decoder.com re-confirme le matin: propre du premier
  coup, titre entier + signature + date, et son image de tete generee porte toujours
  sa mention "Nano Banana Pro prompted by THE DECODER".
  Ajout 17/08 (10h30), UN RECU QUI PORTE LA PREUVE DU CHIFFRE PRONONCE, mesure EN
  MOTEUR: epoch.ai/publications se capture PROPREMENT du premier coup, sans recadrage,
  et le cadre 9:16 tient le masthead EPOCH AI, l'etiquette "Report", la date
  "Aug. 6, 2026", le titre entier sur 3 lignes ET LE RESUME EN ENTIER, dont la phrase
  "We surveyed 1,106 employed US adults about how they use AI for ten work tasks".
  0 pub, 0 banniere cookies, et le titre affiche EST l'histoire (controle du 10/08).
  C'est donc le meilleur recu disponible sur une actu d'ENQUETE ou de RAPPORT, au meme
  titre que PubMed sur un papier (08/08) et arxiv /abs (16/08): il ne montre pas
  seulement la source, il porte la phrase qui autorise le chiffre. Complete l'entree du
  17/08 06h30, qui ne mesurait que le gate. ET LA MESURE DE TEMPS QUI COMPTE POUR UN
  REBUILD: un beat `screenshot` accepte un pin `file` (reel2.mjs l.1571 lit
  `beat.visual.file` AVANT d'appeler screenshot) et le moteur saute alors la capture
  TOUT EN GARDANT la carte-recu, donc un rebuild declenche par un seul beat rate ne
  re-attend pas les deux recus. Les captures ne portent pas de .key, contrairement aux
  stills et au veo: sans pin elles sont refaites a chaque build. Proof: run 10h30 17/08.
  Ajout 18/08 (10h30), DEUX RECUS LEGERS NEUFS, mesures EN MOTEUR, les deux PROPRES DU
  PREMIER COUP et sans recadrage. techrepublic.com: masthead, fil "ARTIFICIAL
  INTELLIGENCE", titre entier sur 4 lignes ET la legende de l'image de tete ("Your Mac
  activity can now become ChatGPT memory"), 0 pub, 0 banniere cookies; seul bemol
  cosmetique, le logo TechRepublic sort en image cassee (texte alt) mais reste lisible.
  dataconomy.com est LE MEILLEUR du lot et rejoint epoch.ai (17/08), PubMed (08/08) et
  arxiv /abs (16/08) dans la categorie "recu qui porte la preuve, pas seulement la
  source": le cadre 9:16 tient titre + chapo + signature + date "August 17, 2026" ET les
  deux paragraphes de corps qui portent l'affirmation centrale verbatim ("logs user
  activity into searchable memories stored as unencrypted plain-text files"). Les deux
  passent le controle du 10/08, le titre affiche EST l'histoire. ET LE PIN QUI FAIT
  GAGNER 2 MIN, re-confirmation directe du 17/08: sur le rebuild, les beats 1 et 7
  epingles avec `file` ont rendu INSTANTANEMENT, aucune re-capture, carte-recu intacte.
  Sur un rebuild declenche par une seule still ratee, epingle TOUJOURS les captures.
  Ajout 19/08 (16h30), dossier Operation Blue Skies. greenairnews.com/?p=9438 SE GATE
  VERT (fetch Node 200, citations VERIFIED) MAIS LA CAPTURE REND UN 404 plein cadre
  ("404 Not Found / The resource requested could not be found on this server"): meme
  famille que macrumors (03/08) et cnbc (04/08), gate et capture sont deux chemins
  reseau differents. Cause mesuree: c'est un shortlink WordPress (?p=ID) qui est SON
  PROPRE canonical (aucun permalink joli, /?page_id=ID rend 200 mais pas la meme page),
  et la navigation navigateur via route.fulfill rend 404 la ou le fetch Node rend 200.
  Sur un domaine dont l'URL est un ?p=ID, teste la capture en scout (replay du ctx.route
  + proxy, cf. 06/08) AVANT de le mettre en beat screenshot, ou prends une autre surface.
  Remplacant mesure et excellent sur ce dossier: cam.ac.uk/research/news/... se capture
  PROPREMENT du premier coup (Menu + titre entier "Operation Blue Skies takes off:
  landmark trial to test AI-driven contrail avoidance" + une vraie photo d'avion+trainee),
  0 pub, 0 banniere, titre = histoire (controle du 10/08). greenair reste une SOURCE
  gatable dans la legende, jamais un recu.
  Ajout 22/08 (06h30), LE BUDGET REEL D'UN RECU, mesure dans le code et pas a
  l'oeil, et ca change comment on recadre: segmentFromScreenshot met la capture a
  880 px de large PUIS la coupe a 1150 px de haut. Une capture 1290x2796 est donc
  reduite d'un facteur 0,682, et LA CARTE NE MONTRE QUE SES ~1686 PREMIERS
  PIXELS. Tout ce qui est plus bas n'existe pas pour le spectateur. Donc ne juge
  pas un recu sur le 9:16 (2293 px) ni sur la capture entiere: regarde
  `crop=1290:1686:0:0` avant d'epingler, c'est exactement le cadre. ET LE
  COROLLAIRE QUI SAUVE L'IDENTITE DE LA SOURCE: screenshotOnce finit par
  `h1.scrollIntoView({block:'start'}) + scrollBy(0,-96)`, et sur un site vitrine
  dont le h1 est deja pres du haut, ce scroll passe SOUS le logo. Mesure du jour
  sur outerbio.com/data-and-ai: la capture moteur commence a "Data & AI", masthead
  hors cadre, donc un recu propre qui ne dit pas de qui il est. Un scout qui
  capture hors moteur remplace ces deux lignes par `window.scrollTo(0,0)` et
  recupere masthead + titre + chapo dans les 1686 px, sans recadrage. Sur un
  article de presse le scroll au h1 reste le bon comportement (le titre est sous
  le chrome); c'est sur les pages produit/vitrine qu'il coute la source.
  CONTRE-EPREUVE AU RENDU, 22/08 (10h30): les DEUX recus outerbio epingles le
  matin par le scout (scrollTo(0,0) hors moteur) sortent du Reel fini avec le
  masthead "OUTER-BIO" LISIBLE dans le cadre, mesure sur les frames a 9,5 s et
  20 s. Le remede du scout tient donc jusqu'au fichier publie, et pas seulement
  jusqu'au png: sur une page vitrine, capturer hors moteur et epingler est le
  seul chemin qui garde l'identite de la source a l'ecran.
  Ajout 23/08 (06h30), QUATRE RECUS MESURES HORS MOTEUR, DONT DEUX REFUS, et le
  premier refus est une famille NEUVE. (1) UN DOMAINE PEUT SE GATER ET SE
  CAPTURER SANS SA FEUILLE DE STYLE: phoronix.com/news/<slug> rend 200 au fetch
  gate et se capture en 303 s (3 frames, aucune erreur, aucun mur), mais la
  carte sort en HTML BRUT, liens bleus soulignes, police a empattements, image
  cassee: le CSS ne survit pas au chemin route.fulfill. Le titre est juste, le
  texte est juste, et un spectateur lit une page cassee. Ce n'est ni macrumors
  (mur) ni greenairnews (404): c'est une capture qui REUSSIT et qui est
  inutilisable. Regarde le rendu, pas le code de retour. (2) github.com en HTML
  est intercepte par le proxy de session: la capture du commit rend le JSON
  `{"message":"GitHub access to this repository is not enabled for this
  session..."}` en plein cadre. Donc sur une actu de code: .patch se GATE
  (entree blocages), la page ne se CAPTURE PAS, et il faut un autre recu.
  (3) itsfoss.com se capture PROPREMENT en 242 s (3 frames), masthead IT'S FOSS,
  titre entier qui EST l'histoire (controle du 10/08), chapo qui porte le chiffre
  du script, signature et date. UN BEMOL A RECADRER: un bandeau sponsor "warp -
  The intelligent terminal / Download FREE" survit aux deux passes de
  consentement ET au CSS anti-pub, et il tombe DANS les 1686 px visibles;
  `crop=1290:1150:0:0` garde masthead + titre + chapo + signature + date et le
  coupe. (4) hbs.edu se capture en 24 s, 1 SEULE frame, ZERO pub, ZERO banniere,
  AUCUN recadrage, sur ses deux pages: /foundry (ecusson Harvard, titre statique,
  chapo qui porte l'affirmation) et /foundry/bootcamps/startup-bootcamp (fond
  noir, titre geant, une vraie photo d'intervenant), donc deux recus de FAMILLES
  VISUELLES differentes sur le meme domaine. Le mode `top` (window.scrollTo(0,0)
  au lieu du scroll au h1) est bien ce qu'il faut sur ces pages vitrines, ca
  re-confirme le 22/08. EN REVANCHE hbsfoundry.org, capture propre en 22 s, est
  REFUSE pour une raison neuve: son titre est une ANIMATION DE MACHINE A ECRIRE
  et la capture l'attrape en plein milieu d'un mot, curseur compris ("The
  AI-Native Bootcamp for A|"). Le flatten le disait deja et personne ne le lit
  comme ca: un texte DOUBLE dans le texte aplati ("hot seathot seat", "your path
  to successsuccess") est la signature d'un titre anime, donc d'un recu qui
  sortira tronque. Cherche ce doublement AVANT de capturer.
  Ajout 23/08 (16h30), LE RECU QUI MONTRE LE VISAGE D'UN AUTRE HOMME QUE CELUI
  QUE TA VOIX NOMME, et c'est une famille NEUVE, plus dangereuse que le mauvais
  tribunal du 16/08 parce que le recu est PARFAIT: bon domaine, bonne URL, bon
  titre, zero pub, zero banniere, le titre affiche EST l'histoire (controle du
  10/08), donc il passe tous les controles, y compris celui-la. Mesure sur
  hbs.edu/foundry/bootcamps/startup-bootcamp: sa photo de tete est le
  PROFESSEUR REZA SATCHU (verifie a l'attribut alt, "Professor Reza Satchu on
  The Founder Mindset"), et le karaoke du beat qui prononce "Jeff Bussgang"
  tombe pile dessus. Un spectateur colle le nom entendu au visage vu: c'est une
  attribution fausse, publique et nommee, fabriquee par le MONTAGE et pas par
  une phrase, exactement la faute du 31/07 (Mythos 5 / Opus 4.7). Le controle
  du 10/08 ne suffit donc plus: sur un recu qui porte un VISAGE et un beat qui
  prononce un NOM, LIS LES alt DES IMAGES avant de publier, en 10 s et sans
  navigateur: `const imgs=[...h.matchAll(/<img[^>]*>/gi)].filter(s=>/alt=/i
  .test(s))` sur le HTML du fetch Node. Remede applique, gratuit et rebuild a
  $0 (narration, alignement, veo et les 3 stills re-servis par leur .key, les
  deux recus epingles avec `file`): `crop=1290:1330:0:0` coupe la photo et garde
  ecusson Harvard, masthead, rubrique Foundry, "Do you have what it takes?", le
  titre "Startup Bootcamp", le chapo et le bouton "Apply Now". Regle generale:
  une page vitrine d'ecole ou d'entreprise met en tete la photo d'UN de ses
  intervenants, jamais forcement celui dont parle ton script.
  Ajout 23/08 (19h30), DEUX RECUS EPINGLES HORS MOTEUR PAR UN RUN DE VEILLE, ET
  L'UN CORRIGE LE 10/08. thenextweb.com se capture PROPREMENT du premier coup en
  38 s, 3 frames, ZERO pub, ZERO banniere, AUCUN recadrage: masthead TNW,
  rubrique LEGAL, titre entier sur 4 lignes ET le chapo qui porte l'affirmation
  centrale verbatim, le tout dans les 1686 px visibles (mesure du 22/08). Le
  10/08 disait que TNW avait capture un TOUT AUTRE article: cette fois
  `page.url()` apres le goto ET le alt de l'image de tete etaient les bons, donc
  TNW n'est pas un domaine a fuir, c'est un domaine a VERIFIER (url + alt, 10 s).
  Detail a connaitre: son h1 revient VIDE a page.evaluate (le titre est rendu
  hors <h1>), donc le scroll au h1 ne bouge pas, et c'est tres bien puisque la
  page s'ouvre deja sur le titre. ppc.land re-confirme le 19/08: propre du
  premier coup, 234 s et 17 frames (famille O(frames), il SURVIT, ne le declare
  pas mort avant 4 min), masthead PPC LAND, illustration de tete, tag News, titre
  entier et chapo, aucun recadrage. Les deux passent le controle du 10/08 (le
  titre affiche EST l'histoire) et celui du 23/08 16h30 (aucun visage dans le
  cadre, seules les vignettes de signature de l'auteur).
  Ajout 25/08 (06h30), LA VARIANTE LA PLUS DANGEREUSE DE LA FAMILLE macrumors
  (03/08) / cnbc (04/08) / greenairnews (19/08), ET C'EST fortune.com: le
  domaine se gate PARFAITEMENT au fetch Node (200, 472 ko, toutes citations
  VERIFIED) et le navigateur recoit LA PAGE D'ERREUR MAISON DE FORTUNE, "Our
  systems need a quick pivot / We're addressing the issue and hope to have it
  fixed soon", avec le masthead FORTUNE en haut, zero pub, zero banniere
  cookies, 2 frames, 23 s. C'est pire qu'un mur Cloudflare ou qu'un 404 nu: le
  recu est PROPRE et il est BRANDE AU BON NOM, donc il passe le controle du
  10/08 si tu ne verifies que l'identite de la source; il faut lire le TITRE.
  La relance a, elle, PENDU au-dela de 10 min (tuee, aucun fichier ecrit): le
  domaine n'est meme pas regulier dans son echec. Regle: fortune.com est une
  SOURCE, jamais un recu. Et la regle generale en sort renforcee: le scout qui
  epingle est le SEUL a pouvoir attraper ca, parce que le gate FETCH, le moteur
  CAPTURE, et COMPLIANT ne lit rien.
  RECUS NEUFS MESURES LE MEME MATIN, hors moteur, a la queue leu leu (regle du
  14/08). xusheng.dev: PROPRE DU PREMIER COUP en 24 s, 1 SEULE frame, aucun
  recadrage, et il rejoint la categorie "recu qui porte la preuve" (PubMed
  08/08, arxiv /abs 16/08, epoch.ai 17/08, dataconomy 18/08), le cadre des
  1686 px visibles tenant le masthead, le titre entier ET le chapo qui porte le
  centralClaim mot pour mot. implicator.ai: PROPRE DU PREMIER COUP aussi, sans
  recadrage, mais en 182 s et 12 frames (famille O(frames) du 06/08, il SURVIT,
  ne le declare pas mort avant 4 min), masthead IMPLICATOR.ai + baseline,
  rubrique AI NEWS, titre entier et chapo chiffre. theregister.com: ~170 s et
  11 frames, mais IL FAUT LE MODE `top` (window.scrollTo(0,0)) - au scroll au
  h1 le masthead rouge passe HORS CADRE et le recu ne dit plus de qui il est
  (famille outerbio du 22/08); en mode top on a masthead + rubrique + titre +
  sous-titre + signature + date dans les 1686 px. BEMOL theregister a connaitre
  avant de s'en etonner au frame check: la ligne de credit de sa photo de tete
  ("Copyright (c) 2026 New Africa/Shutterstock. No use without permission.")
  SURVIT au strip de l'image et s'affiche entre le masthead et le titre; aucun
  recadrage rectangulaire ne l'enleve sans perdre le masthead ou le titre.
  Ajout 27/08 (06h30), GATE: rendent 200 au fetch gate et se gatent DU PREMIER
  COUP (0 erreur sur 32 verifications, deux dossiers) metr.org/blog (NOUVEAU, et
  c'est un primaire de premier ordre sur un incident de labo: l'enquete
  tierce-partie porte le texte entier, chiffres et limites compris) et
  about.fb.com/news (NOUVEAU, la salle de presse Meta); cnn.com,
  technologyreview.com et techcrunch.com re-confirment. Repondent 200 aussi
  mturk.com, nbcnews.com, wsaw.com, metr.org et redwoodresearch.org.
  openai.com re-confirme 403 (l'annonce du jour y est, donc ingatable au
  primaire, comme depuis le 26/07). LE REFLEXE QUI TROUVE UN PRIMAIRE META EN
  30 s, meme famille que le RSS blog.google (12/08) et deepmind (17/08):
  about.fb.com/news/ (l'index) rend 200 et son HTML porte en clair toutes les
  URL /news/AAAA/MM/<slug>/, la ou l'URL devinee depuis le sujet rend 404. ET LA
  NUANCE DE CORROBORATION A DIRE DANS LE RAPPORT sur un dossier d'incident IA:
  techcrunch et technologyreview lisent le MEME rapport OpenAI, mais METR a mene
  son enquete INDEPENDANTE (elle ecrit noir sur blanc n'avoir pris aucun
  paiement d'OpenAI), donc c'est elle, et pas le nombre de domaines, qui fait la
  seconde lecture reelle.
  Ajout 26/08 (06h30), CINQ RECUS EPINGLES HORS MOTEUR PAR LE SCOUT, a la queue
  leu leu (regle du 14/08), et le plus important est un REFUS. (1) waymo.com/blog
  RE-CONFIRME LE PIEGE DU 05/08 sur le chemin /blog/AAAA/MM/<slug> et pas
  seulement sur /shorts/: la capture (140 s, 1 frame) s'ouvre sur le masthead du
  blog et les 1686 px visibles (mesure du 22/08) ne portent QUE de la plomberie,
  "Waypoint / The official Waymo blog / Topic / Search blog / Back", zero titre.
  Un recu 100% chrome qui passe tous les controles automatiques. Le crop mesure
  ce matin, et il est meilleur que la page entiere: `crop=1290:1250:0:1420` garde
  le bloc hero (wordmark WAYMO + "Waymo in Munich" sur une vraie voiture devant le
  Siegestor), le titre entier "Servus Munchen: Waymo is Coming to Germany" ET la
  date. Sur waymo.com, ne pin JAMAIS la capture brute. (2) news.mit.edu NOUVEAU,
  PROPRE du premier coup en 22 s, 1 SEULE frame, aucun recadrage, et il rejoint la
  categorie "recu qui porte la preuve" (PubMed 08/08, arxiv /abs 16/08, epoch.ai
  17/08, dataconomy 18/08, xusheng 25/08): masthead MIT News, titre entier, le
  chapo qui porte l'affirmation centrale, la signature "MIT Media Lab" ET la date.
  (3) arxiv.org/abs re-confirme (24 s, 1 frame): le cadre tient le titre entier,
  LES CINQ AUTEURS et l'abstract jusqu'a la phrase chiffree. (4) technologyreview
  .com propre sans recadrage MAIS en 224 s et famille O(frames) du 06/08, alors
  qu'il se gate en une seconde: c'est exactement le recu qu'un scout doit epingler
  et qu'un run de publication ne doit pas attendre. (5) thenextweb.com re-confirme
  le 23/08: propre en 38 s, 2 frames, aucun recadrage, et `page.url()` + les alt
  etaient les bons (le piege du 10/08 ne s'est pas represente). Cout total: 7 min,
  0 $, et les deux Reels du jour n'ont plus une seule capture a faire.
  Ajout 27/08 (06h30), QUATRE RECUS MESURES HORS MOTEUR, DONT UN REFUS QUI EST LA
  VARIANTE LA PLUS SILENCIEUSE DE LA FAMILLE (macrumors 03/08, cnbc 04/08,
  greenairnews 19/08, fortune 25/08). (1) cnn.com SE GATE PARFAITEMENT (fetch
  Node 200, 14 ko aplatis, toutes citations VERIFIED) ET SE CAPTURE ENTIEREMENT
  BLANC: page blanche pure, 14 845 octets de PNG contre 275 ko pour une vraie
  capture, `page.url()` correct, `h1` VIDE, 1 frame, 22 s. Reproduit DEUX fois.
  Ce n'est ni un mur, ni un 404, ni une page d'erreur brandee: il n'y a
  strictement RIEN, donc aucun controle de titre ne l'attrape, seul le poids du
  fichier ou l'oeil le voit. Regle: cnn.com est une SOURCE, jamais un recu, et
  au moindre doute mesure `ls -la` sur le png (sous ~30 ko = page vide).
  (2) metr.org/blog/<slug>: PROPRE en 26 s, 2 frames, et il rejoint la categorie
  "recu qui porte la preuve" (PubMed 08/08, arxiv 16/08, epoch.ai 17/08,
  dataconomy 18/08, xusheng 25/08, news.mit.edu 26/08). ATTENTION, son titre
  d'article n'est PAS dans un h1: le scroll au h1 tombe sur le titre de SECTION
  "Core takeaways about this incident" et ajoute un #fragment a l'url. C'est une
  CHANCE ici, les 1686 px visibles (mesure du 22/08) tenant le masthead METR ET
  la phrase qui autorise tous les chiffres du script ("~1200 agents sent >70,000
  messages and files on an unsanctioned message board, and ~700 attacked Hugging
  Face"). Reste une ligne coupee sous le masthead, cosmetique. (3) about.fb.com/
  news/<slug>: PROPRE en 25 s, 1 frame, aucun recadrage, et il N'A PAS besoin du
  mode `top` contrairement aux autres pages vitrines d'entreprise (waymo 26/08,
  outerbio 22/08): wordmark Meta, "Back to Newsroom", etiquette META, titre
  entier, date. Sur une actu Meta, la salle de presse est donc a la fois primaire
  gatable et meilleur recu. (4) wsaw.com (Gray TV) PROPRE mais en 278 s et
  90 frames (famille O(frames) du 06/08, tres lourd): masthead WSAW-TV, titre
  entier, signature "The Associated Press", date et chapo chiffre. Deux bemols
  avant de s'en servir: c'est de la SYNDICATION AP (famille RNZ 10/08, NPR
  17/08), donc jamais un second domaine de corroboration; et son SLUG D'URL dit
  "17-billion" la ou le titre affiche "$18 billion" (titre corrige apres coup),
  donc lis le h1, jamais l'url. technologyreview.com re-confirme le 26/08:
  propre, aucun recadrage, masthead + rubrique + titre + chapo + signature +
  date, mais 325 s et 39 frames, c'est LE recu qu'un scout epingle et qu'un run
  de publication ne doit jamais attendre. OUTIL: `node scout-capture.mjs <url>
  <out> [top]` (pose ce jour-la) replique screenshotOnce a l'identique et
  imprime `page.url()`, le h1 et les alt des images en cadre, soit les trois
  controles du 10/08, du 14/08 et du 23/08 en une commande.
  Ajout 30/08 (06h30), TROIS RECUS MESURES HORS MOTEUR, a la queue leu leu.
  (1) musicbusinessworldwide.com NOUVEAU, PROPRE du premier coup en 255 s /
  23 frames, aucun recadrage, zero pub, zero banniere cookies: masthead MBW,
  titre ENTIER en capitales (c'est l'histoire, controle du 10/08),
  "AUGUST 29, 2026" et "BY TIM INGHAM" dans les 1686 px visibles (mesure du
  22/08). Il rejoint la categorie "recu qui porte la preuve" puisque le titre
  contient deja la citation de la plainte. Une barre de partage ("97 SHARES" +
  4 boutons) s'intercale entre le titre et la date: elle est dans le cadre, ce
  n'est pas de la pub, on la garde. (2) engadget.com PROPRE du premier coup et
  SANS recadrage (masthead, fil "News > AI", titre entier, chapo qui porte le
  claim, signature, date) - la plomberie variable du 15/08 se re-confirme, il
  n'y avait ni filigrane AD ni encart ce jour-la. MAIS 333 s et 361 FRAMES,
  soit le plus lourd jamais mesure ici (famille O(frames) du 06/08, il SURVIT):
  c'est exactement le recu qu'un scout epingle et qu'un run de publication ne
  doit jamais attendre. (3) the-decoder.com se recapture propre (169 s /
  106 frames) MAIS IL LUI FAUT LE MODE `top`, precision qui manquait a l'entree
  du 16/08: au scroll au h1 la capture commence SOUS le masthead et le recu ne
  dit plus de qui il est (famille outerbio 22/08, theregister 25/08); en mode
  top (175 s / 83 frames) on a le logo "the decoder", le titre entier, la
  signature et la date, ET la mention "Nano Banana Pro prompted by THE DECODER"
  de son image de tete tombe alors HORS des 1686 px visibles, ce qui resout au
  passage le bemol du 16/08. Sur the-decoder, capture toujours en `top`.
  ET UN PIEGE DE LECTURE, pas de capture, qui fait perdre 2 minutes: relue en
  vignette a 430 px, la police condensee de MBW et celle d'engadget donnent
  l'illusion que le titre ecrit "ANTROPIC" sans H. Recadre la ligne en PLEINE
  resolution (`crop=1290:180:0:<y>`) avant de conclure a une coquille de la
  source: les deux ecrivaient bien "ANTHROPIC".
  Ajout 31/08 (06h30), TROIS RECUS MESURES HORS MOTEUR, a la queue leu leu, dont
  un NEUF et excellent. (1) **sixthtone.com/news/<id> NOUVEAU**: PROPRE du
  premier coup en 81 s / 8 frames, aucun recadrage, zero pub, zero banniere
  cookies. Les 1686 px visibles (mesure du 22/08) tiennent le masthead
  SIXTH TONE, la rubrique FEATURES, le titre ENTIER sur trois lignes (qui EST
  l'histoire, controle du 10/08) et le debut du chapo, et sa photo de tete est
  une vraie camera de tournage sur un plateau, donc le recu porte aussi le
  sujet. Deux details a ne pas lire comme des defauts: `h1` revient VIDE a
  page.evaluate (titre rendu hors <h1>, famille TNW du 23/08) et la page s'ouvre
  quand meme sur le titre; et altsInFrame revient en CHINOIS ("封面" = couverture).
  (2) the-decoder.com re-confirme le 30/08 et son mode `top` est bien
  obligatoire: 184 s / 213 frames, propre, aucun recadrage, logo "the decoder",
  tag Short News, titre entier, signature Matthias Bastian ET la date
  "Aug 29, 2026" dans le cadre, donc le recu prouve lui-meme sa fraicheur.
  (3) techcrunch.com: **le piege du 21/08 (redirection mobile vers la fausse
  alerte McAfee loadway.best) NE S'EST PAS REPRODUIT**, deuxieme mesure
  consecutive apres le 28/08, `landedUrl` et `h1` justes et l'alt de la photo de
  tete conforme au sujet. Mais il coute 880 s / 115 frames, le plus cher du lot,
  et au scroll au h1 le MASTHEAD passe hors cadre: les 1686 px ne montrent que
  la carte verte, la rubrique TRANSPORTATION, le titre entier, la signature Sean
  O'Kane et la date, sans le mot TechCrunch nulle part (famille outerbio 22/08 /
  theregister 25/08 / the-decoder 30/08). ET LE MODE `top` NE LE REPARE PAS,
  contre-epreuve faite le meme matin sur la MEME url (780 s / 450 frames): en
  `top` on recupere bien le logo TC en haut, mais la PHOTO DE TETE occupe alors
  toute la suite des 1686 px visibles et le TITRE tombe SOUS le cadre. Le recu
  montrerait une jolie voiture Waymo et pas une phrase. Aucun des deux cadrages
  ne tient masthead ET titre: sur techcrunch, garde le scroll au h1 (le titre
  est la preuve, controle du 10/08) et laisse l'identite de la source a la
  signature et a la legende. La regle "les gros sites veulent le mode top"
  (outerbio, theregister, the-decoder) n'est donc PAS generale: c'est la
  hauteur de la photo de tete qui decide, et ca se teste en une capture.
  Cout total des quatre captures: 32 min et 0 $, et les deux Reels du jour
  n'ont plus une seule capture a faire. Proof: scout 06h30 31/08.
  Proof: journal 15h 31/07, run 08h 01/08, run 14h 01/08, run 19h30 02/08, run 11h 03/08, run 16h30 03/08, run 10h30 06/08, run 16h30 06/08, run 19h30 07/08, run 16h30 09/08, run 19h30 09/08, run 16h30 10/08, scout 06h30 12/08, run 10h30 13/08, run 16h30 13/08, scout 06h30 14/08, run 10h30 15/08, run 16h30 15/08, run 10h30 16/08, run 16h30 16/08, scout 06h30 22/08, scout 06h30 26/08, scout 06h30 27/08.
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
  Ajout 13/08 (06h30), LE DECLENCHEUR EST MAINTENANT CONNU ET REPRODUCTIBLE:
  gater DEUX specs a la suite suffit. Les deux specs banques ce jour-la partagent
  techcrunch.com; lances dos a dos dans la meme boucle ils sont revenus REJECTED
  2 erreurs et REJECTED 6 erreurs, alors que chacun rendait PASSED 0 erreur seul,
  et re-rendait PASSED apres 30 s de pause. Donc quand un run porte plusieurs
  specs (un scout qui en banque deux, un run de publication qui re-gate avant de
  construire), ESPACE les gates d'au moins 30 s au lieu de les enchainer, et ne
  lis jamais un premier lot rouge comme un verdict sur le texte.
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
  Ajout 11/08 (06h30), LE NOM DE MODELE PRONONCE EST VERIFIE SUR LA CASSE DES
  CITATIONS DE CORROBORATION, pas sur l'evidence des diapos. versionedActors()
  n'attrape "GPT-5.6" que sur du PascalCase (`[A-Z][A-Za-z]{2,}-\d`), et il ne
  lit QUE les quotes de `corroboration` (claimActors), jamais captionEvidence ni
  les evidences de diapos. Les pages ecrivent le modele en minuscules
  ("gpt-5.6-cyber"), donc une quote copiee telle quelle du flatten ne contient
  aucun acteur versionne, et un script qui dit "GPT-5.6-Cyber" se fait refuser
  "names GPT-5.6, appears in no evidence quote". Remede gratuit, sans degat: mets
  la MAJUSCULE au nom du modele DANS une quote de corroboration ("GPT-5.6-Cyber
  answers 95 percent..."); ca se verifie quand meme (flatten minuscule les deux
  cotes) ET ca nourrit claimActors. Et l'acteur du centralClaim doit etre nomme
  dans les DEUX premiers beats: nommer OpenAI ne suffit pas si l'acteur detecte
  est le modele. Enfin, le controle de corroboration exige >=45% de recouvrement
  (CLAIM_OVERLAP_THIN=0.45) du vocabulaire du centralClaim par CHAQUE quote:
  ecris un centralClaim COURT (une affirmation) dont les mots figurent dans les
  deux quotes, sinon une quote vraie et sur-le-sujet est refusee a tort. Mesure:
  gate openai-ia-pirate-chrome, 3 refus d'abord (veo "exploit" absent du vocab,
  nom non capitalise, claim trop long a 3 mots partages), PASSED apres correctifs.
  Ajout 16/08 (06h30), DEUX REFUS DE GATE QUI N'ACCUSENT NI TA SOURCE NI TON TEXTE.
  (1) FAUX POSITIF DE CADENCE, meme famille que l'accent "tres" du 07/08: le
  controle "promises a publishing frequency" matche le mot QUOTIDIEN. Une diapo et
  une legende disant "croises avec les ventes quotidiennes" (des ventes jour par
  jour, aucune promesse de publication) ont declenche deux erreurs bloquantes.
  Contournement gratuit et sans degat editorial: "les releves de ventes". Mefie-toi
  aussi de hebdomadaire, mensuel, chaque jour.
  (2) LE `figure` D'UNE DIAPO stat EST TENU PAR DEUX CONTROLES QUI SE CONTREDISENT,
  et le remede n'est pas evident. Plafond de 6 CARACTERES ("$643,000" fait 8 et est
  refuse "renders clipped"), mais le raccourci naturel "$643k" est refuse LUI AUSSI
  parce que le gate normalise la citation "$643,000" en 643000 et que le jeton 643
  n'y matche plus. Ecrire le chiffre comme la source ne suffit donc pas quand la
  source est longue. Remede applique, passe du premier coup: mettre dans `figure`
  un AUTRE numeral vrai et court de la meme phrase ("80,431" exemplaires) et
  laisser le montant en dollars dans le `body`. Regle: choisis le chiffre de la
  diapo stat sur sa LONGUEUR, pas sur son importance.
  Ajout 17/08 (06h30), TROISIEME FAUX POSITIF DE CADENCE, apres "quotidien"
  (16/08) et l'accent "tres" (07/08): le controle matche **"tous les matins"**.
  Une diapo cta disant "Envoie ca a quelqu'un qui bosse avec une IA tous les
  matins" (une description de la vie du lecteur, aucune promesse de
  publication) est refusee "promises a publishing frequency". Contournement
  gratuit et sans degat: coupe le complement de temps. Mefie-toi de tous les
  soirs, chaque semaine, tous les jours dans une cta ou une legende.
  Ajout 17/08 (06h30), LE HERO QUI REPETE LE TITRE EST UN WARNING, pas une
  erreur, mais il vaut le coup d'oeil: "the hero value 20% already appears in
  the headline. The hero carries the comparison the headline does not". Choisis
  donc le chiffre du hero APRES avoir ecrit le titre, et prends-en un autre.
  ET LE PIEGE DE CHIFFRE PARLE LE PLUS FACILE A MANQUER: un chiffre du SCRIPT
  doit etre dans une citation d'evidence, et une citation qui porte 53% ne
  porte pas forcement 37%. Le beat disant "53% ... contre 37%" a ete refuse
  parce que la citation the-decoder choisie ne contenait que 53. Remede: une
  diapo de plus portant la phrase Epoch qui porte LES DEUX. Quand un beat
  oppose deux pourcentages, cite la phrase source qui les contient tous les deux.
  Ajout 18/08 (06h30), LE STEMMER NE MATCHE PAS ceased AVEC cease, et ca fait
  chuter le controle de corroboration sur une citation qui porte pourtant
  l'affirmation mot pour mot. Dossier robot Moxie: centralClaim ecrit "ceased
  to function", la citation MIT porte "would cease operations", et claimOverlap
  a rendu 33% (thin, sous CLAIM_OVERLAP_THIN=0.45) en ne partageant que
  embodi, moxie, robot. Meme famille que "spheres"/"sphere" du 01/08. Deux
  remedes mesures, tous deux gratuits: allonger la citation d'UNE phrase
  contigue (elle apportait "children", 33% -> 44%, toujours refuse), et
  surtout ECRIRE LE CLAIM AVEC LE VERBE DE TES SOURCES ("will cease to
  function", 70% et 60% sur les deux citations). Ce n'est pas ajuster la
  phrase a la mesure: c'est ecrire le claim dans le vocabulaire de ce que les
  sources disent vraiment. Teste-le hors reseau en 5 s, claimOverlap est
  exporte par validate.mjs: `claimOverlap(claim, quote)` rend shared + ratio.
  Ajout 21/08 (06h30), LE PIEGE DE CITATION LE MOINS EVIDENT, ET IL A COUTE LA
  MOITIE DES ERREURS DU PREMIER PASSAGE: DEUX PHRASES VRAIES DE LA MEME PAGE,
  COLLEES DANS UNE SEULE `evidence`, REVIENNENT NOT_FOUND. Le gate cherche une
  SOUS-CHAINE, donc les phrases doivent etre CONTIGUES ET DANS L'ORDRE DE LA
  PAGE. Mesure: 3 des 6 erreurs du premier gate venaient de la, dont un cas ou
  les deux phrases existaient bien sur la page mais dans l'ordre INVERSE
  ("of all the pages in this sample, 10%..." avant "these dots represent a
  random sample of 10,000..."). Variante plus vicieuse du meme piege: la
  citation s'arrete sur une ponctuation DIFFERENTE de celle de la source
  (ecrit "...was first released." la ou la page ecrit "...was first released,
  and continued as..."), NOT_FOUND immediat sur une citation par ailleurs
  exacte au caractere pres. Le reflexe qui supprime l'aller-retour: imprime le
  VOISINAGE exact avec le flatten du gate (`const i=t.indexOf(ancre);
  t.slice(i,i+420)`) et copie depuis la, puis teste TOUTES tes citations hors
  reseau en une seule commande avant le premier gate. Fait ce matin: les 13
  citations pre-testees sont passees VERIFIED du premier coup, les 3 non
  testees sont exactement celles qui ont echoue.
  Ajout 23/08 (06h30), QUATRIEME FAUX POSITIF DE LA FAMILLE "quotidien" (16/08)
  et "tous les matins" (17/08), cette fois sur les GRANDEURS: le controle des
  magnitudes ecrites en toutes lettres matche le NOM COMMUN francais "double".
  Une legende disant "son double est un peu flippant" (le sosie numerique d'un
  homme, aucune multiplication) a declenche "the caption spells out bare
  magnitude(s) with no adjacent digit: double". Ce n'est qu'un warning, pas une
  erreur, mais il vaut le contournement gratuit et sans degat: "sa copie
  numerique". Mefie-toi aussi de triple, moitie, quart dans leur sens non
  numerique.
  Ajout 23/08 (06h30), LE PIRE forbidNames MESURE JUSQU'ICI VIENT DES ONGLETS
  D'UNE PAGE, pas d'un nom de produit, et il a banni le mot CENTRAL du dossier.
  hbsfoundry.org rend ses etiquettes d'onglets dans le fil du texte, donc une
  citation contigue prise autour de la phrase utile ramasse "Pitch Sales Board
  Meeting" en Title Case, et extractForbidNames a retenu Pitch, Sales, Board,
  Meeting ET Test. Resultat sur une actu ou tout le monde PITCHE: les quatre
  specs image/veo ont ete refuses d'un coup ("prompt names Pitch", "prompt names
  Meeting"). Meme famille que "Close" (16/08) et Pixel Watch (12/08), sauf que
  la cause n'est ni une phrase ni une marque, c'est du CHROME D'INTERFACE aspire
  par une citation trop longue. Remede gratuit, applique avant le gate: arrete
  la citation AVANT la rafale d'etiquettes (elle portait deja l'affirmation), et
  ancre les specs sur un mot que personne ne capitalise, ici "feedback" et
  "session". Regle: quand une citation contient trois noms courts en Title Case
  a la suite, ce n'est pas de la prose, c'est un menu: coupe-la.
  ET LE REFLEXE QUI A TOUT ATTRAPE POUR $0 CE MATIN, sur les DEUX specs: passer
  veoPrompt/imagePrompt + promptIssues + simplicityIssues + extractForbidNames en
  local AVANT le premier gate. Les deux specs sont ensuite passes PASSED, 0
  erreur, 0 warning, DU PREMIER COUP, et aucun build n'a eu a mourir pour
  l'apprendre (le refus serait tombe apres l'achat du veo, cf. 20/08).
- 2026-08-20 · DEUX PIEGES MECANIQUES DU CHEMIN DE PUBLICATION, mesures le meme
  run, chacun coute un cycle entier. (1) LE GATE VERT NE PROTEGE PAS DU REFUS
  D'IMAGE EN COURS DE BUILD: `promptIssues` (promptcraft.mjs) refuse un `spec`
  dont le texte anglais contient, en mot entier, N'IMPORTE QUEL nom de
  `extractForbidNames(post)` , et cette liste contient les tokens des NOMS DE
  SOURCES, pas seulement les entreprises de l'histoire. Mesure: le spec du beat
  7 disait "a column of review numbers" et le build est mort sur
  `prompt names "Review"`, parce que la source est "MIT Technology Review". La
  liste du jour valait: MIT | Technology | Review | Une | Les | Bark | Unis |
  Technologies | Deux | Son | Ces | Gaggle | Label | Garder | Environ | Envoie |
  Chaque. Attention aux mots anglais courants qui y dorment ("son", "label",
  "review", "technology"). Le reflexe qui coute 10 s AVANT de lancer reel2:
  `node --input-type=module -e "import {extractForbidNames} from
  './src/reel2.mjs'; ..."` et relis tes specs contre la liste. Le refus arrive
  APRES l'achat du veo et des stills precedents ($1.09 deja depense ce jour-la),
  mais les .key sauvent tout au rebuild: veo, narration et alignement sont
  ressortis du cache, seul le still rebati a ete rachete ($0.1313).
  (2) `node src/publish-reel.mjs url <slug>` IMPRIME L'URL ENTRE GUILLEMETS
  (sortie JSON). Un `URL=$(... | tail -1)` passe tel quel dans IG_REEL_URL fait
  echouer le dry-run sur `Failed to parse URL from "https://..."`, ce qui
  ressemble a un probleme reseau et n'en est pas. Nettoie: `| tr -d '"' | xargs`,
  puis verifie en 1 s que le SHA est servi:
  `curl -sS -o /dev/null -w "%{http_code}\n" -r 0-1024 "$URL"` (206 attendu).
  (3) Ajout 22/08 (10h30), LE PIEGE QUI FRAPPE AU PIRE MOMENT, entre le Reel
  publie et le record landed: `recordPosted` EXIGE `title`, et aussi `url` et
  `source`, pas seulement { slug, mediaId, permalink, durationS }. L'etape 10 du
  manuel ne cite que `durationS`, donc on ecrit l'appel de memoire et il JETTE
  ("`title` is required - the fingerprint and tokens are derived from it") une
  fois le post deja en ligne. Rien n'est perdu (l'appel est atomique, il suffit
  de le relancer complet) mais c'est un aller-retour pendant la seule minute ou
  le compte porte un post que le registre ne connait pas. Copie la forme depuis
  `tail -1 state/posted.jsonl` AVANT de publier: { slug, mediaId, permalink,
  url, title, source, reel:true, sources:[...], durationS }. Le `title` est le
  titre ANGLAIS de la source, c'est lui qui fabrique le fingerprint qui empeche
  filterFresh de reproposer l'histoire. Proof: run 10h30 22/08.
  (4) Ajout 24/08 (16h30), LE VENV WHISPER PEUT RESTER A MOITIE CONSTRUIT, et le
  moteur ne repare pas tout seul: sur conteneur froid le bootstrap pip est mort
  sur un `ReadTimeout` de files.pythonhosted.org, et les DEUX builds suivants
  sont morts instantanement sur `ModuleNotFoundError: No module named
  'faster_whisper'`: le moteur voit le venv existant et ne relance JAMAIS le
  bootstrap. Ce n'est pas un echec reseau a reessayer, c'est un venv casse.
  Remede, 40 s: `/root/.cache/oom-whisper/bin/pip install --retries 5 --timeout
  120 faster-whisper`, puis relance reel2 dans le MEME repertoire (la narration
  deja achetee ressort du cache, $0 perdu). Le modele large-v3-turbo se
  retelecharge ensuite en 29 s (~1,6 Go).
  (5) Ajout 24/08 (16h30), LE PERMALINK N'ARRIVE PAS PAR LE GRAPH: un
  `fetch graph.facebook.com/v21.0/<mediaId>?fields=permalink` rend un corps SANS
  `permalink` juste apres la publication, donc `recordPosted` ecrit
  `"permalink":""` et le registre perd le lien du post. `node src/publish.mjs
  recent` l'a, lui, immediatement. Lis le permalink LA, avant d'appeler
  recordPosted. ET SURTOUT, si tu l'as deja ecrit vide: NE RE-APPELLE PAS
  recordPosted pour corriger. `reelsToday` (state.mjs:696) compte les LIGNES du
  jour, pas les slugs distincts, donc une deuxieme ligne pour le meme slug fait
  croire au jour qu'il porte 3 Reels, casse `owedToday`/`roomToday` et arme le
  plafond quotidien contre un fantome. Corrige le champ SUR PLACE dans la
  derniere ligne de posted.jsonl, apres avoir verifie que c'est bien la tienne.
  (6) Ajout 31/08 (10h30), LE PENDANT DE (3) SUR recordSeen, meme famille et meme
  minute couteuse: `recordSeen` prend UN TABLEAU d'entrees portant chacune son
  `outcome` et son `reason` en CHAMPS, pas `(item, outcome, reason)` en arguments.
  Ecrit de memoire dans la boucle qui suit la publication, il jette une TypeError
  explicite et la boucle meurt au premier element, donc AUCUNE des 5 entrees n'est
  ecrite alors que le Reel est deja en ligne. Rien n'est perdu (l'appel est
  atomique, on relance) mais c'est un aller-retour de plus dans la fenetre ou le
  registre est en retard sur le compte. Forme juste:
  `recordSeen([{ title, url, source, outcome, reason }, ...])`. Le message
  d'erreur donne la bonne signature: lis-le au lieu de deviner.
  (7) Ajout 02/09 (10h30), LA CLE MEDIA PEUT ETRE PRESENTE ET MORTE, et l'etape 0
  du manuel ne teste que sa PRESENCE: `test -n "$GEMINI_API_KEY"` a dit "present"
  au scout de 06h30 comme a ce run, et le premier achat (la narration) est mort en
  HTTP 401 UNAUTHENTICATED / ACCESS_TOKEN_TYPE_UNSUPPORTED. Ni un bug du code ni
  un probleme de transport: genmedia.mjs envoie bien `x-goog-api-key`
  (genmedia.mjs:156), et les TROIS modes rendent le meme 401 (en-tete
  x-goog-api-key, `?key=`, `Authorization: Bearer`). LA FORME DE LA CLE SUFFIT A
  DIAGNOSTIQUER EN 2 SECONDES: une cle AI Studio valide commence par `AIza` et
  fait 39 caracteres; celle de ce matin commencait par `AQ.Ab8` sur 53
  caracteres, ce qui est un JETON EPHEMERE Google (Live API, ~30 min de vie),
  pas une cle API. Aucune autre variable Google dans l'environnement (`env |
  grep -i gemini\|google` ne rend que GEMINI_API_KEY), donc aucun repli. Le
  REFLEXE, 5 s, AVANT d'ecrire ou de gater quoi que ce soit dans un run de
  publication (le build coute 6 min et meurt sur le premier achat):
  `node -e "const k=process.env.GEMINI_API_KEY||'';console.log(k.length,k.slice(0,4))"`
  puis, si le doute persiste, `curl -s -o /dev/null -w "%{http_code}\n" -H
  "x-goog-api-key: $GEMINI_API_KEY"
  "https://generativelanguage.googleapis.com/v1beta/models"` (200 attendu, gratuit,
  pas de generation). Un 401 ici = rien ne se publiera aujourd'hui, c'est le
  constat de tete du rapport et ca se remonte a Hasan tout de suite: seul lui peut
  remettre la cle dans les variables d'environnement. Le reste du run reste utile
  (specs gate-clean, recus epingles): ils attendent sur disque le run suivant.
  Proof: run 10h30 du 02/09, dernier achat reussi 01/09 16h54, 0 $ depense.
  LA CLE NE SE REPARE PAS TOUTE SEULE ENTRE DEUX CRENEAUX: re-mesuree a 16h40
  le 02/09, meme longueur 53, meme prefixe AQ.Ab8, meme 401 sur
  /v1beta/models, six heures apres le premier constat. Un jeton ephemere expire
  ne se renouvelle pas depuis le conteneur: il n'y a rien a attendre et rien a
  reessayer, donc le run de publication suivant fait le test de 5 s en premier,
  ne gate ni ne recherche rien pour un Reel qu'il ne pourra pas construire, et
  passe directement au travail qui sert (verifier que les specs banques gatent
  toujours en ligne, banquer les candidats, poser l'etat). Les deux specs du
  02/09 ont ete re-gates PASSED a 16h41 sans une seule requete payante.

- 2026-08-23 · (10h30) LE CACHE DU MOTEUR COUVRE AUSSI LES STILLS, ET C'EST CE
  QUI REND UN REFUS DE FRAME GRATUIT A 13 CENTIMES: l'entree du 10/08 ne
  promettait le cache que pour le clip veo. Mesure ce midi, rebuild dans le
  MEME `media/<slug>` apres n'avoir change QUE le `spec` du beat 2: narration
  reutilisee ("no purchase"), alignement Whisper reutilise, clip veo reutilise,
  stills 4, 5 et 6 reutilises, et SEUL le still 2 rachete a $0.1283. Donc
  refuser une image au controle des frames coute un still, jamais un Reel:
  n'hesite pas, et ne vide surtout pas le repertoire entre deux essais.
  ET LE PIEGE DE PROMPT QUI A CAUSE CE RACHAT, generalisable a Nano Banana:
  "a dark computer screen" ne rend PAS un ecran eteint, il rend une interface
  en THEME SOMBRE, ici un moniteur allume plein de graphiques et de code, sur
  un beat dont le script dit "un ecran noir". Le modele lit "dark" comme un
  style, pas comme un etat. La formulation qui marche du premier coup:
  "a computer monitor whose screen is completely black and empty, showing
  nothing at all". Regle generale: pour un objet ETEINT, VIDE ou ABSENT, decris
  l'etat en toutes lettres et au positif ("completely black and empty, showing
  nothing"), jamais par un adjectif d'ambiance. Meme famille que la regle 3 du
  manuel sur veo (dire ce qui doit rester vrai dans la derniere image).
  Se gatent du PREMIER coup ce jour-la, deux fois a 4 h d'intervalle (scout
  06h30 puis re-gate de publication, 12 verifications sur 12, 0 erreur):
  github.com/torvalds/linux/commit/<sha>.patch (le primaire, c'est le message
  de validation de Torvalds lui-meme), itsfoss.com et phoronix.com. itsfoss se
  CAPTURE aussi parfaitement en recu (titre, chapo, signature, date dans le
  cadre 9:16, zero banniere) avec crop=1290:1150:0:0; phoronix reste refuse en
  capture (sort sans CSS), il ne sert que de source.
  Ajout 27/08 (10h30), MEME FAMILLE QUE "dark computer screen", ET CELUI-LA
  SORT CARREMENT D'UNE AUTRE HISTOIRE: "a single monitoring screen showing one
  steady graph" a rendu un MONITEUR MEDICAL DE CHEVET, bras articule compris,
  avec "bpm" et "mmHg" LISIBLES et un trace de signes vitaux, sur le dernier
  beat parle d'un dossier de securite informatique. Le mot "monitoring" (comme
  "monitor") resout vers son referent photographique le plus courant, qui en
  banque d'images est l'hopital: ce n'est pas une image ratee, c'est une image
  reussie d'un autre sujet, donc une metaphore que le gate ne peut pas voir
  (le spec partageait bien du vocabulaire avec les sources). La formulation qui
  a marche DU PREMIER COUP au rachat: "a single computer monitoring screen
  filled with lines of code and timestamps, one line marked in red" - le
  moteur a rendu un vrai ecran de logs (timestamps, GET /api/v1/data, une
  ligne rouge CRITICAL_ERROR). Regle generale: un nom de FONCTION abstraite
  (monitoring, scoring, tracking, reporting) doit toujours etre accompagne de
  CE QU'ON VOIT A L'ECRAN (des lignes de code, des horodatages, des colonnes),
  sinon le modele choisit le decor le plus photographie du mot. Meme rachat a
  $0.13, tout le reste ressorti du cache. Deuxieme refus du meme controle ce
  jour-la, classique celui-la: "a single printed assessment lying open on a
  plain table" + "close-up from above" a rendu une table et une chaise plus
  grandes que le document (le "bureau au lieu de l'histoire" du manuel);
  "its pages filling the view" + "extreme close-up from directly above, the
  open pages fill the entire frame" corrige du premier coup. Quand tu veux
  qu'un objet DOMINE, mets-le dans le `subject` ET dans la `composition`, le
  seul "close-up" ne suffit pas.
  Ajout 28/08 (19h30), LE COUT D'UNE CAPTURE N'EST PAS LE MEME PARTOUT, ET UN
  RECU LENT PEUT MANGER DIX MINUTES DE BUILD: mesure ce soir avec
  scout-capture.mjs, forcepoint.com/blog/x-labs sort en 26 s / 3 frames, recu
  parfait (logo, date, h1, auteur dans le cadre 9:16); csoonline.com sort le
  MEME recu propre (masthead CSO, h1, date, chapo) mais en 601 s / 152 frames,
  la page ne se stabilise jamais (pubs animees). Ce n'est pas un echec, c'est
  un cout: rien dans le log ne previent, la capture rend juste la main dix
  minutes plus tard, en plein milieu d'un run de publication. REFLEXE DE
  SCOUT: capture le recu toi-meme et epingle-le avec
  `"visual": { "type":"screenshot", "url":"...", "file":"media/<slug>/shot_<i>.png" }`
  (reel2.mjs:1571, si `file` est present il ne recapture pas), le fichier est
  commite avec le spec et le run de publication ne paie plus rien. Attention a
  l'index: `i` est celui du beat. Et regarde la capture: celle de csoonline
  porte une illustration de robot en costume en dessous du chapo, exactement
  l'esthetique que le compte refuse, donc verifie ou tombe le cadrage 9:16
  avant de la garder.
  ET LE PIEGE DU MEME SOIR, LE PIRE DE TOUS PARCE QU'IL SORT `"ok": true`:
  npr.org DERIVE VERS UN AUTRE ARTICLE. Capture demandee sur
  npr.org/2026/08/28/nx-s1-5947761/judge-pentagon-anthropic-illegal (le meme
  URL rend 200 et l'article Anthropic correct en curl, et se gate sans
  probleme), capture rendue apres 197 s / 61 frames avec
  `landedUrl` = npr.org/2026/08/28/g-s1-140309/us-iran-middle-east-oil-
  pipelines-hormuz et `h1` = "U.S. says pipelines will make Strait of Hormuz
  irrelevant", plus deux alts sur des champs petroliers irakiens. La page NPR
  continue de naviguer toute seule pendant que le navigateur attend qu'elle se
  stabilise. Un run de publication aurait colle sous une histoire Anthropic le
  recu d'un dossier petrolier, et le gate ne peut pas le voir: il lit les
  citations, pas les pixels. C'est exactement pour ca que scout-capture.mjs
  imprime `landedUrl` et les alts. LIS CES DEUX CHAMPS, un `ok: true` ne dit
  rien. npr.org reste une excellente SOURCE (citations VERIFIED du premier
  coup, y compris la depeche AP), simplement pas un recu. Sur une decision de
  justice sans recu joignable, le beat veut une PHOTO documentaire du visage
  central (commons: "Pete Hegseth Official Portrait", pdm, 1600x2070, score
  8.0) plutot qu'un marteau de juge, que le manuel interdit comme metaphore.
  Meme soir, techcrunch.com se capture CORRECTEMENT (landedUrl et h1 justes,
  titre + signature + date + les deux paragraphes qui portent la citation dans
  le cadre) mais en 694 s / 162 frames. Donc a ce jour, un seul des trois
  grands sites de presse teste ici sort un recu en moins d'une minute
  (forcepoint 26 s); csoonline 601 s, techcrunch 694 s, npr derive. Un run de
  publication qui laisse deux beats `screenshot` sans `file` paie vingt
  minutes de navigateur: le scout capture et epingle, toujours.
  Ajout 29/08 (10h30), LA PROSE EST LE PIRE SUJET QU'ON PUISSE DEMANDER, EN
  VIDEO COMME EN STILL, et ca a coute un rachat veo a $0.96 sur la frame zero.
  Mesure du jour, histoire du resume de mail pirate. (1) VEO: le spec disait
  "a computer screen filled with the text of a single email message" + "one
  extra sentence slowly fading into view". Rendu: un iMac (logo Apple dans le
  cadre, donc le bureau plus le decor) couvert de faux anglais PARFAITEMENT
  LISIBLE ("Nooomt Ury Eonneing", "Thomt men dengebect tiny wmetestaloent ngod
  toun?"). Le filmstrip etait pourtant bon sur la question du manuel (meme
  objet, meme taille, present au 8e panneau): un clip peut passer le controle
  de MOTION et rester a racheter pour son CONTENU. Le remede qui a marche du
  premier coup: demander le SOURCE du mail au lieu du mail, "a computer screen
  filled with email source markup, coloured tags and attributes on a plain
  light background" - le charabia sort alors en notation (crochets, balises,
  tokens colores), ce que le manuel promet du code, et le modele a meme fait
  apparaitre une ligne surlignee en rouge, soit exactement le beat. (2) STILL,
  meme famille, $0.13: "a computer screen showing a short summary of an email,
  the words filling the frame" a rendu un telephone dans un CAFE (passants,
  tasses) avec "JFDHG KLAJSND" en lettres de 100px. Remede du premier coup:
  "its message text reduced to plain soft grey placeholder bars rather than
  readable words" + "a screen-only view with no room, no desk and no people".
  REGLE GENERALE: quand un beat doit montrer du TEXTE, ne demande jamais du
  texte a lire. Demande de la notation (balises, code, horodatages, colonnes
  de chiffres) ou des barres de remplacement explicites. Un document imprime
  reste sur, lui: la facture et la feuille de resultats du meme Reel sont
  sorties avec des mots anglais COHERENTS ("BILL TO", "Amount Due") et des
  colonnes de chiffres, aucun charabia - c'est l'anglais courant genere en
  PARAGRAPHES qui casse, pas les libelles courts.
  ET LE PIEGE DE GATE QUI VA AVEC, 30 s perdues: `simplicityIssues`
  (promptcraft.mjs:158) refuse la chaine "line of" en mot entier, donc
  "one additional line of markup slowly fading" est REJETE comme scene a
  objets multiples. "lines of" passe (le regex vise `rows? of|line of`).
  Ecris "one extra markup line slowly fading". Meme piege pour "row of".
  Enfin, VEO REND PARFOIS "Video generation failed due to an internal server
  issue": c'est transitoire et cote Google, pas un probleme de prompt. Relance
  dans le MEME repertoire, la narration et l'alignement ressortent du cache
  ($0 perdu), seul le clip est achete.
  Ajout 29/08 (16h30), LE REMEDE 'placeholder' DU MATIN A DEUX EFFETS DE BORD,
  chacun un rachat a $0.13. (1) "its text reduced to plain soft grey placeholder
  lines" sur un document a rendu de GROSSES BARRES VERTICALES pleine page: ca lit
  comme un code-barres, pas comme un document, et c'etait la derniere image avant
  la carte de fin. Le modele choisit l'orientation tout seul. Ecris "its body text
  rendered as fine horizontal grey lines rather than readable words" ET impose la
  page unique ("a single printed ... document", "the single page fills the entire
  frame"): rendu du premier coup un vrai document de tribunal, tampon FILED,
  cachet rouge, "vs.", corps en lignes grises. (2) "nothing written on it at all"
  sur un cheque en blanc a supprime AUSSI les libelles imprimes: un rectangle
  blanc a guilloches, meconnaissable. Un objet VIDE garde son mobilier imprime,
  il n'est pas nu. Formulation qui marche: "its printed labels and ruled payment
  lines clearly visible, the amount box and payee line left completely empty"
  (PAY TO THE ORDER OF, THE SUM OF, DOLLARS CENTS, SIGNATURE, tout vide). REGLE
  GENERALE, a cote de celle du 23/08: pour un objet vide, decris ce qui RESTE
  visible, pas seulement ce qui est absent. En VIDEO le meme durcissement a marche
  du premier coup (pile de papiers, lignes grises, zero charabia lisible,
  filmstrip 6 panneaux propre, sujet entier au dernier panneau): $0.60 le clip 6 s.
  Ajout 30/08 (16h30), LA RECETTE "LIGNES GRISES" TIENT AUSSI EN VEO SUR UN ECRAN,
  et c'est la troisieme confirmation d'affilee: beat 0 = "a computer monitor
  showing the plain grey lines of a contract page on a white background" +
  action "the grey contract lines sliding slowly downward, the whole monitor
  staying whole, the same size and fully inside the frame the entire time".
  Rendu du PREMIER coup, $0.96 le clip 8 s / 1080p: zero charabia lisible,
  filmstrip 8 panneaux propre, moniteur meme objet / meme taille / present au 8e.
  Les deux stills du meme Reel ("its body text rendered as fine horizontal grey
  lines rather than readable words" + "the single page fills the entire frame")
  sont sortis du premier coup eux aussi, avec pour seul texte lisible un libelle
  court imprime par le modele ("PAGE 1 OF 3"), ce qui re-confirme l'entree du
  29/08: les LIBELLES COURTS survivent, c'est l'anglais en paragraphes qui casse.
  Ce qui a fait marcher le veo du premier coup est la clause de permanence de la
  regle 3 du manuel ecrite DANS l'action ("staying whole, the same size and fully
  inside the frame"), pas dans le subject: mets-la la, elle y est lue comme une
  contrainte de mouvement.
  Ajout 31/08 (16h30), LA LIMITE DE LA RECETTE "LIGNES GRISES": UN FORMULAIRE
  N'EST PAS UN DOCUMENT. Meme spec que le 29-30/08 ("its body text rendered as
  fine horizontal grey lines rather than readable words" + "the single page fills
  the entire frame") mais sur "a single printed production schedule page": rendu
  refuse au controle des frames, parce qu'un PLANNING est un formulaire et qu'un
  formulaire n'a pas un corps de texte, il a des DIZAINES de micro-libelles de
  champs. Le modele les a tous inventes en charabia ("Dateane:", "Coben:",
  "Suornit:", "Ecola #") et a double l'en-tete ("DAILY PRODUCTION SCHEDULE" aux
  lettres deformees). La regle du 29/08 (les libelles courts survivent) tient
  pour DEUX OU TROIS libelles ("BILL TO", "PAGE 1 OF 3"), pas pour trente. DONC:
  la recette lignes grises ne vaut que pour une page de PROSE (contrat,
  ordonnance, lettre, facture). Devant un formulaire, un planning, un tableau de
  bord ou une fiche a champs, change de sujet plutot que de durcir le prompt.
  LE REMPLACEMENT QUI A MARCHE DU PREMIER COUP, $0.1337, tout le reste ressorti
  du cache (narration, alignement, veo, 3 stills): demander une INTERFACE
  LOGICIELLE au lieu d'un imprime, "a single computer monitor whose screen is
  filled with stacked coloured video clip bars and timestamps" +
  "extreme close-up from directly in front, the screen fills the entire frame".
  Rendu: un vrai plan de montage video (barres de clips, timecode 00:15:30:12,
  vignettes), zero charabia, parce que tout le texte y est de la NOTATION. Une UI
  est le sujet le plus sur de la famille "il faut montrer du texte", devant le
  document imprime. Attention: dis "stacked", jamais "rows of"/"line of"
  (simplicityIssues, entree du 29/08). Meme run, beat 0 veo du PREMIER coup avec
  la recette de glissement du 30/08 transposee a un telephone: "a single small
  vertical video screen ... showing one colourful picture" + action "the
  colourful picture on the screen sliding slowly upward and out of view, the
  screen itself staying whole, the same size and fully inside the frame the
  entire time". Quatrieme confirmation d'affilee, pellicule 8 panneaux propre.

- 2026-09-02 · (16h30, Hasan en direct) LE MODE SILENCIEUX, ET LE BUG DE
  KARAOKE QU'IL A REVELE. Quand la cle media est morte, TOUT est mort: la voix
  passe par le meme GEMINI_API_KEY que les stills et le veo (genmedia.mjs), donc
  "publier sans generer d'images" veut dire publier SANS VOIX. Le jeton
  ephemere AQ.Ab8 est refuse partout, y compris sur l'API Live (le WebSocket
  s'OUVRE puis se ferme en 1008 "unregistered callers": une poignee de main TCP
  n'est pas une authentification, ne conclus rien d'un `OPEN`). Ce qui reste
  gratuit et suffit a faire un Reel: `screenshot` (Chromium local, plafond 3),
  `photo` (Openverse/Commons), `card` (typo maison, plafond 2), la musique, le
  karaoke et la carte de fin. D'ou `OOM_SILENT=1 node src/reel2.mjs ...`
  (reel2.mjs): pas d'achat TTS, pas de passe Whisper, l'horloge des mots est
  derivee du budget de parole (silentWordClock, meme fenetre de mots que le
  gate), la piste voix est un vrai silence et loudnorm remonte le lit musical.
  Mesure: deux Reels 60,0 s COMPLIANT construits pour 0,00 $ en ~4 min chacun.
  DEUX PIEGES: (1) le moteur COUPE le karaoke sur un beat `card` (pour ne pas
  empiler trois textes) - en mode silencieux ca donne 7 a 11 s sans un mot a
  l'ecran, donc SILENT reactive le karaoke sur les cartes; (2) le karaoke
  supprimait les points ET LES VIRGULES A L'INTERIEUR DU MOT: "99.1%" etait
  grave "991%", "12.3 milliards" -> "123 milliards". Invisible depuis toujours
  parce que les cartes etaient muettes, mais ca vivait aussi sur les autres
  beats. Corrige (on ne retire que les bords du token) + test de non-regression
  (124 tests). Pour les photos: l'index Openverse repond mal aux requetes
  medicales ou de bureau (filtre near-white, et des hors-sujet complets: un
  musee radar pour "operating room", le Capitole pour "courthouse", du rawpixel
  filigrane pour "server room dark"). Regarde CHAQUE photo avant de la fixer,
  compte 3 a 4 requetes pour 1 photo utilisable, et prefere les sujets denses
  (bloc operatoire, baie de serveurs, circuit imprime, ecran de code).
