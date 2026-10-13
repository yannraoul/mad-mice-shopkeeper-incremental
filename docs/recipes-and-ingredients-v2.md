# Recipes, ingredients and qualities v2 (design, not built yet)

Status: **MMSIM-14 built the rest** (all four ingredients, 15 candies, the quests, the final quest; see `planning/features/MMSIM-14.md`). **MMSIM-11 built** the mechanics (see `planning/features/MMSIM-11.md`) with honey and sunflower, three candies and the four qualities; milk, blueberry, the other candies and the ingredient quests are MMSIM-14. Alternates arrive by chance (15% of delivered base units once unlocked), not a fixed 1 a day. Numbers are first drafts for `npm run balance`.
Companions: `docs/customer-cravings-v2.md` (who wants what, happiness, tips) and `docs/stages-and-progression-v2.md`
(the chain of weeks that unlocks things).

## Problems this solves

1. The first "more honey" upgrade (20 + 60 coins) does almost nothing: a plain Honey drop costs 2 honey.
2. Sunflower seeds are on the shelf from the start but nothing uses them; "Sunflower brittle" is honey only.
3. Every recipe is honey only, so recipes are price tiers, not an ingredient story.
4. Quality is a global rule instead of part of each recipe.
5. The late game has no candy that asks for everything the player built.

## Ingredients

Four base ingredients, each with one rare **alternate**. The alternate counts as its base ingredient for matching
(a candy with royal jelly "contains honey"), but is only used for Perfect.

| Base | Alternate | Base unlocked by | Alternate unlocked by (recurring supply, about 1 a day) |
|---|---|---|---|
| Honey | Royal jelly | start | the queen's quest (replaces the "queen is sick" tonic) |
| Sunflower seed | Dark sunflower seed | Sunflower patch (node) | Dark garden (node, then quest) |
| Milk | Cream from Stumpsville | Dairy quest: a cart from Stumpsville, opens a place on the map | Stumpsville trade route (map) |
| Blueberry | Cursed blackberry | Bramble quest | The cursed bramble (temple, magic) |

- **Only unlocked ingredients exist in the UI**: no shelf tile, no supply, no mention. The shelf starts with honey only.
- **Each base ingredient has its own narrative quest** that raises its daily supply (like "the queen is sick" for honey).
  The alternate is unlocked by a quest, a bond or a magic node and then arrives every day in small numbers, so it can
  never block the final objective.
- Start: honey 3 a day (one per batch). A bonus bought mid-day arrives next morning.

## Qualities

| Quality | Needs | Recipe cost | Price x (draft) |
|---|---|---|---|
| Plain | start | the default recipe | 1 |
| Fine | Oven | default recipe plus extra units (see below) | 1.6 |
| Excellent | Pulling machine (second hand station, adds a "pull" step; marble slab as an alternative theme) | more extra units | 2.2 |
| Perfect | **Magic cauldron** | the *plain* recipe, every ingredient replaced by its alternate | 3.5 |

- **Fine and Excellent add base ingredients, deterministically, per candy.** Single-ingredient candies are 1x, 2x, 3x
  of their ingredient (candy cane: 1, 2, 3 honey). Candies with several ingredients start at 2 or more and the extra unit
  goes to the ingredient that makes sense for the candy (nougat: more honey for Fine, more seed for Excellent). It is
  data on the candy: `tiers: { fine: [...], excellent: [...] }` of extra units.
- **Perfect costs no extra quantity**: same count as Plain, but every ingredient is its alternate. It is gated by
  alternates being available and by the Magic cauldron, not by volume. A candy cane is 1 royal jelly; a nougat is
  1 royal jelly + 1 dark seed; the Sweet Tooth is all four alternates.
- **Magic cauldron**: a quest that upgrades the cauldron, offered once the cauldron nodes are all bought. It unlocks
  Perfect. It does not replace the normal cauldron for the other qualities.
- **Why Excellent is not a trap**: it uses 3x the honey for 2.2x the price, so Plain is best per honey. Excellent and
  Fine pay off through customers who demand them (minimum quality) and through happiness tips
  (see cravings doc), not through raw price per ingredient.

## Candies (15, plus the Perfect form of each)

Recipe unlock is automatic: a candy is available once every ingredient of its plain recipe is unlocked.
Price draft: `sum(ingredient value) x (1 + 0.25 x (n - 1))`, with values honey 5, sunflower 6, milk 7, blueberry 8, so a
handful of numbers tunes everything. Rounded.

| # | Candy (EN / FR) | Ingredients | Plain price |
|---|---|---|---|
| 1 | Candy cane / Sucre d'orge | honey | 5 |
| 2 | Sunflower brittle / Croquant de tournesol | sunflower | 6 |
| 3 | Toffee / Toffee | milk | 7 |
| 4 | Berrycorice / Réglisse myrtille | blueberry | 8 |
| 5 | Sunflower nougat / Nougat au tournesol | honey + sunflower | 14 |
| 6 | Honey fudge / Fudge au miel | honey + milk | 15 |
| 7 | Berry honey gums / Gommes miel-myrtille | honey + blueberry | 16 |
| 8 | Seed praline / Praliné de tournesol | sunflower + milk | 16 |
| 9 | Berry crunch / Croustillant myrtille | sunflower + blueberry | 18 |
| 10 | Berry cream chews / Chouchous crème-myrtille | milk + blueberry | 19 |
| 11 | Golden truffle / Truffe dorée | honey + sunflower + milk | 27 |
| 12 | Meadow bar / Barre des prés | honey + sunflower + blueberry | 30 |
| 13 | Berry cloud / Nuage de myrtille | honey + milk + blueberry | 30 |
| 14 | Cheesecake bites / Bouchées façon cheesecake | sunflower + milk + blueberry | 32 |
| 15 | **The Sweet Tooth / Le Bec Sucré** | all four | 46 |

Names follow what real confectionery does with those ingredients (nougat = honey and nuts or seeds, fudge and toffee =
milk, praline = seeds in cream, gums and licorice = fruit). The Perfect Sweet Tooth is the final candy.

## Final goal

"Deliver 3 Perfect Sweet Tooth" is the last quest, unlocked by the last stage (see the stages doc). The errands engine
already supports deliver-quest with candy, quality and quantity. One Perfect batch makes `capacity` candies (4), so the
real gate is the four alternates, the Magic cauldron and the stages, not quantity.

## Balance invariants (checked with the simulator)

- **I1.** The first affordable upgrade (day 1 to 2) changes what you can do or earn straight away.
- **I2.** Day-1 supply covers all plain batches (honey 3 for 3 batches).
- **I3.** Every node has a measurable effect in `--ablate`; none is dead on arrival.
- **I4.** The rival hive's theft hurts but a competent player survives it without rushing both the errands board and
  the clerk first.
- **I5.** An alternate's daily supply is enough to reach the final goal on schedule but never enough to make every
  candy Perfect.

## Changes by layer

- **Content schema**: `ingredient.alternate` and `ingredient.unlock`; `candy.tiers` (extra units for Fine and
  Excellent); drop global `quality.extraIngredients`; qualities gain `Excellent` with its station and `Perfect` with its
  node. Validation: every ingredient and candy is reachable, no unused ingredient, no candy without a path to unlock.
- **Engine**: `batchCost(candy, quality)` from candy data (Perfect substitutes alternates); candy unlock derived from
  ingredients; supply only for unlocked ingredients; a quality is selectable only if its station and ingredients exist.
- **Save**: new version with a migration (old honey drop stays; old `recipe-2` becomes the Sunflower patch; old
  `dark-garden` keeps the dark seed; old Fine stays Fine).
- **UI**: shelf shows unlocked ingredients; recipe cards show cost at the chosen quality (done, MMSIB-11); quality
  buttons say what is missing; evening nodes say what they open.
- **Bots and balance**: read costs from data, pick the best affordable quality, `npm run balance` for all three bots,
  update the pacing table in `planning/PLAYTEST.md`.
- **Strings and art**: EN and FR for 8 ingredients, 15 candies, new nodes and quests; placeholder SVG slots.

## Out of this milestone

Cravings, happiness and tips (MMSIM-12), the stage chain (MMSIM-13), and the content fill: the pair and triple candies
and the four ingredient quests (MMSIM-14). MMSIM-11 ships the mechanics with the four single candies, the Sweet Tooth,
and the honey and sunflower ingredients; the rest is data.

## Open questions

1. The pulling machine as a second hand station with a "pull" step, or a station upgrade like the oven? (Doc assumes a
   step, matching "Fine adds the oven step".)
2. Alternates: exactly 1 a day each, or different per ingredient (jelly rarer than cream)?
