# Fact-check — « Bostrom a prouvé que notre monde est une simulation »

Demandé le 2026-08-01, à partir d'une capture d'écran de X. **Rien n'a été publié
sur Instagram** : aucun appel à `publish-reel.mjs`, aucun `land.mjs`, aucune
touche à `posts/`. Les deux specs ci-dessous vivent dans `reports/factcheck/`
et n'ont pas de bloc `reel2`, donc rien dans la pipeline ne peut les construire
ni les envoyer.

## L'affirmation vérifiée

> **Kekius Maximus** (@Kekius_Sage) — 17 h
> Oxford scholar Nick Bostrom **proved** our world is statistically almost
> certain to be a computer simulation.
>
> This logic implies that the universe and its physical rules were deliberately
> programmed by a higher intelligence.

*(250 réponses, 185 reposts, 1,3k likes, 89,6k vues au moment de la capture.)*

## Verdict : **faux**, sur les trois points

| # | Ce que le tweet dit | Ce que la source dit |
|---|---|---|
| 1 | Bostrom a **prouvé** | Il **argumente**. « this paper **argues** that at least one of the following propositions is true » |
| 2 | notre monde est **presque certainement** une simulation | C'est **une des trois branches** d'un trilemme, et il refuse de trancher : « apportion one's credence **roughly evenly** between (1), (2), and (3) » |
| 3 | l'univers a été programmé par une **intelligence supérieure** | Les simulateurs seraient des « **naturalistic entities** […] not strictly omniscient or omnipotent », et l'hypothèse « **does not imply** the existence of such a deity » |

Le tweet transforme une **disjonction** (A ou B ou C) en **conclusion** (C). Bostrom
a écrit une FAQ entière dont la question 2 existe précisément pour empêcher cette
lecture — et il y qualifie d'« overconfident » ceux qui, dans les deux sens,
choisissent une branche.

Détail secondaire : « Oxford scholar » était exact en 2003 (« by Nick Bostrom,
Faculty of Philosophy, Oxford University »), mais ne l'est plus. Le Future of
Humanity Institute a fermé en 2024 ; Bostrom en « was the founding director of
the later defunct » institut et « has become principal researcher at the
Macrostrategy Research Initiative ».

## Comment le gate du repo a été utilisé

`src/validate.mjs` fait tourner, entre autres, cette règle : *chaque phrase doit
citer une source, la page est réellement téléchargée, et la citation doit s'y
trouver mot pour mot*. Les deux versions de la même histoire ont été soumises au
même gate, en ligne.

### A. L'affirmation telle que tweetée — `bostrom-simulation-tweet-AS-CLAIMED.json`

```
$ node src/validate.mjs reports/factcheck/bostrom-simulation-tweet-AS-CLAIMED.json
REJECTED — 4 error(s)
```

Les quatre erreurs sont **toutes** des erreurs de preuve, aucune de forme :

| | source | statut |
|---|---|---|
| slide 1 | simulation-argument.com/simulation.html | `NOT_FOUND` |
| slide 2 | en.wikipedia.org/wiki/Simulation_hypothesis | `NOT_FOUND` |
| corroboration 1 | simulation-argument.com/simulation.html | `NOT_FOUND` |
| corroboration 2 | en.wikipedia.org/wiki/Simulation_hypothesis | `NOT_FOUND` |

> `the evidence quote does not appear on … — either it was paraphrased or it was invented`

C'est le résultat qui compte : pour que le tweet passe, il faudrait qu'une phrase
disant ça existe quelque part. Elle n'existe sur aucune des deux pages.

### B. La même histoire, sourcée — `bostrom-simulation-tweet-AS-SOURCED.json`

```
$ node src/validate.mjs reports/factcheck/bostrom-simulation-tweet-AS-SOURCED.json
PASSED
```

**18 citations sur 18 `VERIFIED`.** Zéro erreur. Deux avertissements seulement,
sur la finesse du recouvrement de vocabulaire — pas sur les faits.

Toutes les citations de ce rapport sont dans cette spec, donc chacune a été
retéléchargée depuis sa page et comparée mot pour mot. Rien ici n'est cité de
mémoire.

## Les reçus, mot pour mot

**Le trilemme** — *simulation-argument.com/simulation.html*, résumé de l'article
(Philosophical Quarterly, 2003) :

> this paper argues that at least one of the following propositions is true: (1)
> the human species is very likely to go extinct before reaching a "posthuman"
> stage; (2) any posthuman civilization is extremely unlikely to run a
> significant number of simulations of their evolutionary history (or variations
> thereof); (3) we are almost certainly living in a computer simulation.

**Il ne tranche pas** — même page, dernière section :

> in the dark forest of our current ignorance, it seems sensible to apportion
> one's credence roughly evenly between (1), (2), and (3).

**Accepter l'argument n'oblige pas à accepter la conclusion** —
*simulation-argument.com/faq.html*, question 2 :

> the argument shows only that at least one of three possibilities obtains, but
> it does not tell us which one(s). one could accept the simulation argument
> while rejecting the simulation hypothesis (i.e. that we are in a simulation).

Et, sur le chiffre que le tweet donne pour acquis :

> i would assign a "substantial probability" to the simulation hypothesis. i tend
> to refrain from providing a specific number.

**Pas d'intelligence supérieure** — FAQ, question 13 :

> it is important to stress that the simulators implied by the simulation
> hypothesis would be naturalistic entities, subject to the laws of nature at
> their own level of reality. they would not be strictly omniscient or
> omnipotent, and they might well be finite.

> it does not seem to have any direct logical connection with religious
> conceptions of a literally omniscient, omnibenevolent, and omnipotent deity.
> the simulation hypothesis does not imply the existence of such a deity, nor
> does it imply its non-existence.

**Et l'univers n'aurait justement pas besoin d'être programmé en entier** —
article, section III :

> simulating the entire universe down to the quantum level is obviously
> infeasible, unless radically new physics is discovered. but in order to get a
> realistic simulation of human experience, much less is needed

**Confirmation indépendante** — *en.wikipedia.org/wiki/Simulation_hypothesis* :

> in 2003, bostrom proposed a trilemma that he called "the simulation argument".
> despite its name, the "simulation argument" does not directly argue that humans
> live in a simulation; instead, it argues that one of three unlikely-seeming
> propositions is almost certainly true

**Affiliation** — *en.wikipedia.org/wiki/Nick_Bostrom* :

> he was the founding director of the later defunct future of humanity institute
> at the university of oxford

> has become principal researcher at the macrostrategy research initiative

> until its shutdown in 2024, researched the far future of human civilization

## Note

Les citations sont reproduites telles que le gate les lit, c'est-à-dire après
`flatten()` : minuscules, guillemets droits, espaces normalisés. C'est la forme
exacte qui a été comparée aux pages téléchargées.
