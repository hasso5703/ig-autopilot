# Revue des prompts de la routine — 2026-08-04

Demandée par Hasan : « qu'est-ce que je dois changer pour que le modèle
applique beaucoup plus les règles, ne fasse pas n'importe quoi, et qu'on
débloque quelque chose de nouveau, sans perdre aucune information ? »

Audit mené sur le dépôt réel (manuel de 2 340 lignes, carnet, 19 journaux de
vol, code des gates, historique git), plus l'état de la recherche sur le
suivi d'instructions en prompt long (sources en fin de rapport).

---

## TL;DR

**Le contenu de vos règles est exceptionnel. Le problème n'est pas ce que les
prompts disent, c'est leur architecture.** Trois chantiers, par ordre d'effet :

1. **Trois copies de la vérité qui se contredisent.** Le prompt stocké dans le
   scheduler résume le manuel, le manuel traque les divergences du prompt
   stocké, `cron-prompt.md` traque les deux — et au 04/08 les trois couches de
   méta-suivi se contredisaient *entre elles*. Chaque run commence donc par
   arbitrer entre deux autorités avant de travailler. **Corrigé sur cette
   branche** : le prompt stocké devient un *loader* minimal sans aucune
   politique (il ne peut plus jamais être périmé) ; tu le colles une fois.

2. **Le manuel a dépassé le budget d'attention du modèle et croît de ~40 % par
   semaine.** ~24 000 mots de règles, 323 passages en gras, 110 « never »,
   auxquels s'ajoutent le carnet (5 300 mots) et le prompt stocké : ~45 000
   tokens d'instructions avant la première minute de travail. La recherche
   mesure une décroissance quasi exponentielle du taux de suivi quand le
   nombre d'instructions simultanées monte (68 % pour les meilleurs modèles à
   500 instructions), avec un biais de primauté : ce qui est au milieu se perd
   d'abord. Chaque incident ajoute aujourd'hui 90 à 240 lignes au manuel :
   c'est une bombe à retardement, pas un état stable. **Le remède n'est pas de
   couper des règles, c'est de les compacter au format décision et de déplacer
   la jurisprudence en annexe lue à la demande** (plan en §P1, exemple
   travaillé en annexe B — ~8× plus court, zéro règle perdue).

3. **Ce qui a vraiment fait progresser la conformité chez vous, ce ne sont pas
   les paragraphes, ce sont les formes fermées et les gates.** La ligne 8b du
   rapport (a/b/c obligatoire) a tué en un jour un contournement que cinq runs
   avaient pratiqué en silence ; `format.mjs` porte lui-même la philosophie
   (« une règle qui vit dans trois fichiers, c'est trois règles »). Il faut
   généraliser : squelette de rapport imprimé par le code, lignes de journal
   canoniques au moment de la décision, constantes uniquement dans le code, et
   un vérificateur à contexte frais avant publication (§P2, §P3 — c'est là
   qu'est le « quelque chose de nouveau »).

Honnêteté oblige : les journaux des 3 derniers jours montrent des runs
*disciplinés* (le 16h30 du 03/08 a trouvé et corrigé seul trois images
fautives, réutilisé la narration, dépensé 0,27 $ ; le scout du 04/08 a évité
le piège du Capitole de Californie et corrigé un bug d'imagery avec test). Le
système marche. Ce qui est cassé, c'est sa capacité à *rester* fiable en
grandissant — et c'est réparable maintenant, à froid, plutôt qu'après la
prochaine dérive.

---

## Ce qui est déjà excellent (et rare) — à ne pas toucher

- **Des règles mesurées, datées, causées.** Chaque règle porte sa date, son
  incident déclencheur, souvent le verbatim de ta décision. C'est le meilleur
  antidote au « rule-lawyering » d'un modèle : il voit *pourquoi* la règle
  existe et cesse de chercher la faille.
- **Les promesses classées** (véracité > deux Reels > plafond par run) : un
  ordre de préséance explicite qui tranche les conflits. La recherche sur les
  hiérarchies d'instructions confirme que c'est exactement ce qu'il faut.
- **La trajectoire prose → gate.** À chaque récidive, la règle passe de la
  prose au code (fenêtre de mots, furniture rule, hook rules, cadence,
  first-line…). C'est la seule vraie courbe d'apprentissage d'un système à
  base de LLM.
- **Le journal de vol et `land.mjs`** : l'état survit aux morts de runs, et
  l'atterrissage est prouvé, pas espéré.
- **La ligne 8b du rapport** : la première « forme fermée » du système, née
  d'un échec précis, et elle marche (le journal du 03/08 16h30 écrit même la
  décision *au moment où elle se prend*, pas après — voir §P2.2).

---

## Diagnostic

### D1 — Trois copies de la vérité, et les trois se contredisaient (corrigé)

L'état constaté ce matin, pièces en main :

- **`prompts/cron-prompt.md` (en-tête)** disait « LAST SYNCED WITH routine.md:
  2026-08-02 » et listait des divergences du 08-01/08-02… alors que son propre
  corps contenait déjà les règles du 08-03 (beat 0 veo, l'action pas la
  destination, la courbe). L'en-tête était périmé par rapport à son propre
  fichier.
- **`prompts/routine.md` (préambule)** affirmait « the live prompt still ranks
  veo fifth of six surfaces » et « cost line ($1.20 to $1.60) is stale »…
  alors que le prompt réellement stocké (celui que tu m'as collé) contient la
  règle veo du 08-03 et la ligne $1.80–$2.20. Le manuel décrivait un prompt
  live qui n'existe plus : tu avais re-collé après le 03/08 et aucune des deux
  couches de suivi ne l'a su.
- **Conséquence pour un run** : ~600 mots de méta-règles à lire et arbitrer
  avant la première action, et un précédent toxique — le run apprend que la
  documentation du système peut mentir sur elle-même.

Au-delà du suivi périmé, la duplication elle-même divergeait sur le fond :

- Fenêtre de mots : le prompt stocké dit « it moved three times in one day »,
  le manuel dit « it changed twice in one day » (et ailleurs « 180 → 195 →
  186 → 206 »).
- Débit de la voix : le prompt stocké cite « 3.49 once and 3.22, 3.34, 3.44
  when measured », le manuel (étape 10) « 3.26, 3.51 and 3.70 ». Deux séries
  de mesures différentes pour la même leçon, sans rien qui dise au lecteur
  qu'elles ne mesurent pas la même chose.
- Deux faits n'existaient QUE dans le prompt stocké et nulle part dans le
  manuel : les plafonds de la `card` (value 12 caractères, label 62, karaoké
  coupé sur les cards) et la spécification complète du rapport final en 14
  sections. Si tu avais collé un prompt raccourci un jour, ces règles
  disparaissaient du système.

**Le correctif appliqué (cette branche)** :

- `prompts/cron-prompt.md` est réécrit en **loader minimal** : identité, ordre
  de lecture, cinq rails de sécurité, zéro politique. Un loader sans politique
  ne peut pas se périmer ; le rituel du re-collage disparaît (tu colles une
  fois, et une modification de règle dans routine.md ne demande plus JAMAIS de
  re-coller).
- Les deux contenus uniques du prompt stocké sont **absorbés dans routine.md**
  (plafonds/karaoké de la card en §5d ; rapport 14 sections dans « Ending the
  run », fusionné avec l'existant sans perte).
- Le préambule de routine.md est réécrit : une seule règle générale (« si ton
  prompt de lancement porte de la politique, c'est un vieux collage, ce
  fichier gagne ») remplace la liste datée de divergences, qui n'a plus de
  raison d'exister — elle est archivée en annexe A de ce rapport.

**Ce qui te reste (toi seul peux le faire)** : coller le corps du nouveau
`prompts/cron-prompt.md` (sous la ligne pointillée) dans le prompt de la
routine `oom-daily`, dans l'app Claude Code, et mettre à jour la ligne
« LAST PASTED » de l'en-tête. Cinq minutes, et D1 est mort définitivement.
Au passage, vérifie l'encodage après collage : le prompt stocké actuel a
perdu ses accents dans la section « LA COURBE » (« chute a ~25% », « premieres
secondes ») alors que routine.md les a — le pipeline de collage strippe ou
quelqu'un a tapé sans accents ; anodin pour le modèle, mais c'est un signal
que le texte stocké n'est pas byte-identique au fichier.

### D2 — Le manuel dépasse le budget d'attention, et il croît de ~40 %/semaine

Les chiffres du dépôt, mesurés ce matin :

| Fichier | Mots | Notes |
|---|---:|---|
| `prompts/routine.md` | ~23 900 | 2 340 lignes, **323 passages en gras, 110 « never »** |
| `prompts/notes.md` | ~5 300 | « 26 entrées » sur le papier, voir D7 |
| prompt stocké (ancien) | ~3 500 | remplacé par le loader (~450 mots) |
| **Total chargé avant tout travail** | **~32 700 mots ≈ 43–45 k tokens** | hors journaux, feeds (288 items), sources lues, spec… |

Croissance de routine.md sur ses 9 derniers commits de fond : +107, +112,
+13, +83, +26, +242, +179, +93, +86 lignes — **~940 lignes en une semaine sur
une base de 1 662**. Chaque incident ajoute une section narrative complète. À
ce rythme le manuel double toutes les deux à trois semaines, et chaque
nouvelle règle amincit l'attention disponible pour toutes les autres.

Ce que dit la mesure externe, et elle converge avec votre propre philosophie :

- Le benchmark **IFScale** (« How Many Instructions Can LLMs Follow at
  Once? », 2025) : le taux de satisfaction de *toutes* les instructions décroît
  quasi exponentiellement avec leur nombre ; **les meilleurs modèles frontier
  tiennent 68 % à 500 instructions**, avec un **biais de primauté** (les
  instructions du début sont privilégiées, celles du milieu s'omettent
  d'abord). Votre manuel porte, à la louche, 300 à 500 impératifs discrets :
  vous êtes dans la zone mesurée du phénomène.
- **Anthropic, « Effective context engineering for AI agents »** : « LLMs have
  an *attention budget* that they draw on when parsing large volumes of
  context » ; l'objectif est « the smallest possible set of high-signal tokens
  that maximize the likelihood of some desired outcome » ; et surtout : « Do
  not stuff a laundry list of edge cases into a prompt » — préférer des
  exemples canoniques et le chargement *just-in-time* de la référence.
- Vos propres incidents le confirment de l'intérieur : le 31/07, un run a
  **lu l'instruction exacte** (« ne calcule pas la fenêtre toi-même ») **puis a
  écrit son propre calcul quand même**. Ce n'est pas de la désobéissance,
  c'est de la dilution : l'instruction était à ~1 600 lignes de profondeur
  dans un contexte déjà énorme.

**Le remède n'est PAS de supprimer des règles** (tu ne veux rien perdre, et
les récits ont une vraie valeur : ils motivent la règle et coupent l'envie de
la contourner). Le remède est un changement de *format* et de *placement* :

1. **Couche règles** : chaque règle au format décision — FAIS / SAUF /
   VÉRIFIE / JAMAIS / POURQUOI-en-2-lignes + identifiant + date. Scannable,
   une seule déclaration canonique par règle, le POURQUOI court attaché.
2. **Couche jurisprudence** : les récits complets (le verre d'eau, la
   barrette avalée, les 141 006 sessions…) déplacés dans
   `prompts/jurisprudence.md`, indexés par identifiant de règle, **lus à la
   demande** quand un run doute d'une règle ou s'apprête à la contester.
   Rien n'est supprimé ; tout change de couche. C'est exactement le pattern
   « just-in-time context » qu'Anthropic documente (et celui des Skills de
   Claude Code : un index court, des références chargées au besoin).
3. **Cible** : couche règles ≈ 8–9 000 mots (−60 %), jurisprudence à volonté.
   L'exemple travaillé en annexe B convertit « L'ouverture doit bouger »
   (~1 100 mots) en ~130 mots de règle sans perdre un seul impératif.

Méthode de migration sûre (ton exigence « aucune information perdue ») :
une section par session interactive avec toi, chaque diff relu, et pour
chaque section migrée une table de correspondance « ancienne phrase
impérative → nouvel emplacement » (comme l'annexe A de ce rapport le fait
pour le prompt stocké). Jamais de big-bang.

### D3 — Les règles sont enterrées dans leur propre jurisprudence

Le format actuel type : 6 lignes de récit, l'impératif au milieu d'un
paragraphe, 3 lignes de conséquence, le tout en gras à 40 %. Trois effets
mesurables :

- **La saturation d'emphase annule l'emphase.** 323 gras dans un fichier,
  c'est un fichier sans gras : le canal « ceci est important » est épuisé.
  (Même chose pour « never » ×110 : un modèle sur-contraint par des négations
  omniprésentes sur-généralise la prudence là où tu veux de l'audace — c'est
  précisément la tension « cool ET exact » que tu essaies de tenir.)
- **La même règle est redite en 2 à 4 endroits avec des dérives de chiffres**
  (voir D1). Chaque redite est une chance de divergence à la prochaine
  édition, et l'histoire du dépôt montre que ça arrive réellement.
- **Les tables de réécriture sont votre meilleur outil pédagogique** (openers
  publiés → ce qu'ils auraient dû être ; stakes ; hooks). Elles font
  exactement ce que la recherche recommande (« exemples canoniques » plutôt
  que règles énumérées). Garde-les dans la couche règles ; c'est la prose
  autour qui part en jurisprudence.

### D4 — Des nombres que le code possède, recopiés dans la prose

`format.mjs` l'écrit lui-même : « A rule that lives in three files is three
rules. » Vous avez appliqué ce principe à la fenêtre de mots (le manuel dit
« lance la commande, n'apprends jamais le chiffre ») — c'est la bonne règle,
et elle n'est appliquée qu'à moitié. Restent recopiés dans la prose alors que
le code les possède et les imprime déjà en cas d'infraction : plafonds beats
(7–10), stills (4), surfaces réelles (3), reçus (3), cards (2), mots par beat
(6), 8,6 s veo, 52 caractères du titre, 12/62 de la card, 40–125 de la
première ligne, coûts $1.20–1.60 / $1.80–2.20…

Deux dérives documentées prouvent le risque (D1). **Règle d'écriture à
adopter dans la constitution** : *tout nombre que le code fait respecter
n'apparaît dans la prose que comme référence à la commande qui l'imprime.*
Et pour rendre ça pratique : ajouter `node src/validate.mjs rules` qui
imprime toutes les constantes courantes (fenêtre comprise) — 20 lignes de
code, et le manuel peut dire « lance `rules` » au lieu de porter 15 chiffres
qui vieillissent.

(Les coûts, eux, ne sont pas dans le code : soit ils y entrent — genmedia
sait ce qu'il paie, spend.jsonl aussi, une moyenne glissante est imprimable —
soit ils restent en prose mais à UN seul endroit, l'étape 10.)

### D5 — Les décisions ouvertes sans forme fermée (le vrai siège de
« il ne suit pas les règles »)

L'échec le plus instructif de tout le dépôt : entre le 01/08 et le 03/08,
**cinq runs consécutifs** ont exécuté l'audition veo demandée, conclu « pas de
moment », et expédié des stills — chacun honnêtement, aucun ne l'écrivant.
La règle existait, elle était lue, elle était même *appliquée* ; c'est sa
**sortie** qui n'avait pas de forme. Le correctif (8b : trois options
énumérées, obligatoire, jamais implicite) a rendu le contournement impossible
en un jour.

Généralisation : **toute décision de jugement que le manuel exige doit
laisser une trace fermée (options énumérées) au moment où elle se prend, pas
un essai a posteriori.** Le journal du 03/08 16h30 l'a déjà inventé tout
seul : `step 5d OPENER DECISION: option (b), no moment exists…` écrit AVANT
le build. C'est la meilleure pratique du dépôt et elle n'est écrite nulle
part. À formaliser (§P2.2) : lignes de journal canoniques par étape
(`step 3 PICK: <slug> score <x> runner-up <slug>`, `step 5d OPENER: (a|b|c)
<phrase>`, `step 10 STRIP: same-object=oui/non`…). Elles coûtent zéro, elles
s'écrivent au moment où l'attention est sur la décision, et elles sont
lint-ables.

### D6 — Les sections retraitées occupent les meilleures places

Les étapes 7 et 8 (« RETIRED, do not run ») occupent ~60 lignes en plein
milieu de la procédure, et l'histoire des carrousels est racontée en entier à
quatre endroits. Or ces sections contiennent AUSSI des règles vivantes
(l'orphan check, le SHA-pinning, « a publish error is not proof… ») : le
vivant et le mort sont tressés. À la migration D2 : les règles vivantes
remontent dans les étapes vivantes (0 et 10), les sections retraitées
deviennent des pierres tombales d'une ligne, le récit part en jurisprudence.
Un modèle qui lit une procédure ne devrait jamais parser « ne fais pas ce
paragraphe » au milieu de paragraphes à faire.

### D7 — Le carnet contourne son propre plafond

Le test plafonne à 26 *puces* ; les runs (de bonne foi) enrichissent donc les
puces existantes : la première entrée fait ~60 lignes et 8 « Ajout » datés,
le fichier fait 5 300 mots. Le plafond tient sur le papier et le budget
d'attention explose quand même. Correctif mécanique simple : le même test
plafonne aussi la section ENTRIES en lignes (par ex. 300 ; elle en fait ~430
aujourd'hui, ce qui forcera un élagage sain — plusieurs « Ajouts » sont des
leçons désormais encodées dans le code, donc supprimables selon vos propres
règles de rétention). C'est un changement de test : à faire par toi ou par
une session interactive, pas par un run (constitution).

### D8 — Un seul contexte géant, jamais d'yeux frais (le déblocage nouveau)

Un run fait tout dans un contexte qui ne cesse de s'alourdir : 45 k tokens de
règles, puis 288 items de feeds, les sources, l'écriture, le gate, le build,
les frames… La recherche et vos incidents disent la même chose : la fin de
run est l'endroit où l'instruction lue au début ne pèse plus rien (le calcul
de fenêtre du 31/07 est un échec de fin de contexte typique). Deux remèdes,
complémentaires :

1. **Relecture d'ancrage au seuil de phase** (coût quasi nul) : avant 5d,
   relire §5d ; avant publication, relire « Ending the run ». Une ligne dans
   la procédure ; avec la couche règles compactée (D2), relire une section
   coûtera 300 mots, pas 3 000.
2. **Le vérificateur à contexte frais avant publication** — c'est le
   « quelque chose de nouveau » que tu demandes. Anthropic documente le
   pattern (« specialized sub-agents can handle focused tasks with clean
   context windows ») et votre histoire le réclame : *chaque faute grave
   expédiée a passé tous les contrôles automatiques et a été construite par
   un contexte qui avait des raisons d'y croire* (biais du constructeur : il
   a payé les images, il veut publier). Concrètement, juste avant
   `publish-reel.mjs publish`, le run lance un sous-agent (Task tool, dispo
   dans vos sessions cloud) qui reçoit UNIQUEMENT : le spec gaté, la sortie
   du gate, les frames extraites, la pellicule si veo, et une checklist
   fermée. Il n'a ni l'historique du run, ni les coûts engagés, ni la
   fatigue. Prompt suggéré :

   > Tu n'as pas construit ce Reel et tu ne sais pas ce qu'il a coûté. Réponds
   > par oui/non + une phrase, uniquement d'après les pièces jointes :
   > 1. Frame 0 : la carte d'accroche est-elle entièrement lisible, et
   >    arrêterait-elle TON pouce ?
   > 2. Un beat montre-t-il du mobilier / une métaphore / du texte inventé ?
   > 3. Pellicule (si veo) : même objet, même taille, présent vignette 8 ?
   > 4. L'attaque parle-t-elle à quelqu'un qui se fiche de l'IA, et nomme-t-elle
   >    l'acteur de l'affirmation centrale ?
   > 5. La première phrase et le titre disent-ils la même chose (mauvais) ou
   >    deux choses (bon) ?
   > Un NON bloque la publication et dit quoi refaire.

   Coût : 2–3 minutes, zéro dollar. À tester sur quelques runs 16h30 et à
   garder si le taux d'attrapage est non nul (il le sera : c'est exactement le
   profil des fautes des 29/07, 31/07 et 03/08).

### D9 — La boucle Hasan → constitution est manuelle et perd des décisions

Le rapport du scout 10h30 d'aujourd'hui le montre en direct : « le manuel dit
que 5 lectures sous 40 % est une décision qui te revient — on en est à 8. »
Cette question t'est re-posée dans chaque rapport, re-argumentée à chaque
fois (des tokens), et rien ne l'accumule nulle part : si tu ne réponds pas
dans le chat, elle repart dans le vide. Correctif léger :
`prompts/decisions.md` — un fichier constitution-adjacent où un run AJOUTE
une question en une ligne datée (« 8/8 lectures < 40 % : changer quoi ? »),
où toi seul écris la réponse, et que chaque run lit avec le carnet. Une
question posée = une ligne, plus jamais un paragraphe par rapport. (Et les
réponses déjà données cessent d'être re-plaidées : le fichier fait foi.)

À noter : la décision elle-même (que faire à 8 lectures < 40 %) n'est pas
l'objet de cette revue, mais les nouvelles règles du 02–03/08 (registre grand
public + ouverture veo) n'ont encore JAMAIS été testées ensemble sur un
Reel publié — le FCC/robots humanoïdes de ce 16h30 sera le premier point de
mesure. Ne change rien d'autre tant que 3–4 Reels du nouveau régime n'ont pas
leurs lectures : une variable à la fois, c'est votre propre discipline.

### D10 — Divers

- **Quatre créneaux, un seul prompt** : le run déduit son rôle de l'horloge.
  Ça marche, mais si le scheduler permet quatre routines, quatre loaders
  identiques à une ligne près (« You are the 06:30 scout run ») suppriment
  une classe entière d'erreurs de branchement. Optionnel, toi seul peux le
  faire, et avec le loader sans politique ces quatre prompts ne coûtent plus
  rien à maintenir.
- **Accents** : `frenchAccentIssues()` protège le texte public ; les rapports,
  commits et le prompt stocké sont en français sans accents. Aucun effet
  modèle ; effet lisibilité pour toi. Si c'est une habitude défensive
  d'encodage des runs, elle peut sauter (les fichiers du dépôt sont UTF-8 et
  le carnet mélange déjà les deux).
- **Modèle** : la question « opus, autre chose ? » est secondaire tant que D1,
  D2 et P2 ne sont pas faits — un meilleur modèle dans une architecture qui
  se contredit re-produit les mêmes classes d'erreurs. Après la migration,
  tester un cran de modèle au même prompt est un A/B propre (aucune
  dépendance du pipeline au modèle, la calibration voix n'est pas concernée).

---

## Le plan, dans l'ordre

| # | Action | Qui | Effort | Statut |
|---|---|---|---|---|
| P0.1 | Coller le nouveau loader dans la routine `oom-daily` (+ mettre à jour la ligne LAST PASTED, vérifier les accents après collage) | **Toi** | 5 min | ⬜ en attente |
| P0.2 | Merger cette branche (`claude/routine-system-prompt-review-g7u80u`) sur main | Toi | 5 min | ⬜ |
| P1 | Migration de routine.md au format règle + `prompts/jurisprudence.md` (annexe B = le format ; une section par session, mapping obligatoire, diff relu par toi) | Toi + sessions interactives | ~3–4 sessions | ⬜ |
| P2.1 | `node src/report.mjs skeleton` : imprime les 14 sections à remplir (tue les omissions par construction) | run/session (code + test) | ~30 min | ⬜ proposé |
| P2.2 | Lignes de journal canoniques par étape (PICK / OPENER / STRIP / SPEND…), formalisées dans le manuel, lint doux dans land.mjs au moment de publier | session (constitution + code) | ~1 h | ⬜ proposé |
| P2.3 | `node src/validate.mjs rules` : imprime toutes les constantes ; règle d'écriture « un nombre possédé par le code ne se recopie pas en prose » | session | ~30 min | ⬜ proposé |
| P2.4 | Test carnet : plafond en lignes en plus des 26 puces | Toi/session (test = constitution) | ~15 min | ⬜ proposé |
| P2.5 | `publish-reel.mjs` refuse de publier si les frames extraites (et strip.jpg quand veo) n'existent pas dans media/<slug> — « look at the output » devient prouvable | session | ~45 min | ⬜ proposé |
| P3 | Vérificateur à contexte frais avant publication (sous-agent, prompt en D8) + relecture d'ancrage au seuil de phase | constitution + essai sur 3 runs | ~1 session | ⬜ proposé |
| P4 | `prompts/decisions.md` (questions en attente ↔ tes réponses) | Toi + session | ~20 min | ⬜ proposé |
| P5 | Quatre loaders par créneau (optionnel) | Toi | 10 min | ⬜ optionnel |

**Fait sur cette branche aujourd'hui** : loader minimal (`prompts/cron-prompt.md`
réécrit) ; absorption dans routine.md des deux contenus uniques du prompt
stocké (card 12/62 + karaoké muet en §5d ; rapport 14 sections dans « Ending
the run ») ; préambule de routine.md réécrit (une règle générale au lieu du
suivi de divergences, l'historique archivé en annexe A) ; ce rapport.

---

## Annexe A — Preuve de non-perte : où vit chaque bloc de l'ancien prompt stocké

| Bloc de l'ancien prompt stocké (~3 500 mots) | Où c'est maintenant |
|---|---|
| Identité, français, ordre de lecture, constitution | Le loader (nouveau cron-prompt.md) + préambule routine.md |
| PARLER À TOUT LE MONDE (digest) | routine.md § Parler à tout le monde (version complète, dont le digest était extrait) |
| THE DAY HAS ONE SHAPE (créneaux, hand-launch) | routine.md, table des créneaux (§ What a run is) + étape 0 (hand-launch, décision d'Hasan) |
| Carrousels retirés, plafond par run, promesses classées, owedToday | routine.md § What a run is (promesses classées, owedToday, plafonds) |
| FLIGHT RECORDER AND LANDING | routine.md étape 0 (journal), étape 9 (land.mjs), § When things go wrong (refus land.mjs) |
| THE ENGINE, AND THE MONEY (title 52, voix Sadaltager, fenêtre, 60.0 s, 3 lectures, coûts, `file`) | routine.md §5d (title, voix, fenêtre, file) + étape 10 (60.0 s, retries, coûts, paliers) |
| WHAT YOU SHOW (hiérarchie, gate spec↔sources, LA COURBE, screenshot ≠ audition, beat 0 veo, L'action pas la destination, card, métaphores) | routine.md § How attention actually works (courbe, L'ouverture doit bouger) + §5d (hiérarchie, veo, action, card) |
| — dont card « value 12 / label 62 / karaoké muet » (n'existait QUE dans le prompt stocké) | **absorbé le 04/08 dans routine.md §5d** |
| WHAT MUST SURVIVE EVERY REWRITE (noms, evidence, look at output, close, cadence, em dashes, caption 40–125) | routine.md § Name the thing, § Non-negotiables, § The close, §5b |
| FINAL REPORT 1–14 (n'existait en entier QUE dans le prompt stocké) | **absorbé le 04/08 dans routine.md § Ending the run** (fusion sans perte avec l'existant) |
| En-tête : update_trigger refus, qui peut coller | préambule routine.md + en-tête du loader |
| Liste datée des divergences (08-01 : « One Reel a day is a hard ceiling », « publish iff no Reel yet », « if the day has its Reel: scout » ; 08-02 : second Reel optionnel, « Only roomToday 0 makes you a scout », rien sur le registre) | Historique, archivé ici même — plus nécessaire dans le manuel une fois le loader collé |

## Annexe B — Le format cible des règles (exemple travaillé)

« L'ouverture doit bouger » fait aujourd'hui ~1 100 mots. La même règle, format
décision, aucune obligation perdue :

```markdown
### R-OPENER-VEO (2026-08-03, Hasan ×2)
FAIS : beat 0 = clip `veo` du sujet propre de l'histoire, saisi en pleine
  action, issue pas encore visible à la dernière image. Attaque ~28–30 mots
  (un beat veo ne parle pas au-delà de ~8,6 s ; le gate refuse au-delà).
SAUF : aucune phrase des sources ne rapporte de moment physique (jugement,
  règlement, valorisation) → beat 0 = visage ou reçu, et rapport §8b(b).
VÉRIFIE : pellicule 8 vignettes (commande §10) — même objet, même taille,
  encore présent vignette 8, sinon rachat (~$0,60). Rapport §8b (a|b|c).
JAMAIS : métaphore visuelle ; un plan que tu ne peux pas attacher à une
  phrase précise des sources ; économiser le clip pour réduire le coût.
POURQUOI (jurisprudence J-12) : 6 Reels mesurés — 5 ouvertures fixes à
  10–21 % de rétention, la seule veo à 30 % (n=1, confondu) ; 5 runs de suite
  ont conclu « pas de moment » sans l'écrire ; la falaise du 03/08 met 75 %
  de la perte avant 3 s.
```

Le récit complet (les citations d'Hasan, la table des six Reels, la physique
de l'« unresolved action », la barrette avalée) part dans
`prompts/jurisprudence.md` sous J-12, lu quand un run doute. Compression ~8×,
zéro impératif perdu, et la règle devient citable (« R-OPENER-VEO ») dans les
journaux et les rapports.

## Sources

- [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
  (budget d'attention, « smallest set of high-signal tokens », exemples
  canoniques vs laundry list, just-in-time context, note-taking, sous-agents)
- [Jaroslawicz et al. — How Many Instructions Can LLMs Follow at Once? (IFScale, arXiv:2507.11538)](https://arxiv.org/abs/2507.11538)
  (68 % à 500 instructions pour les meilleurs modèles, biais de primauté,
  décroissance avec la densité d'instructions)
- [Anthropic — Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
  (structuration des workflows multi-fenêtres)
- [Prompt Design at Scale: How Format, Instruction Count, and Context Length Shape Instruction Adherence (arXiv:2607.19257)](https://arxiv.org/html/2607.19257)
  (dilution d'instructions, effets de primauté/récence)
- [Claude — Best practices for prompt engineering (2026)](https://claude.com/blog/best-practices-for-prompt-engineering)
