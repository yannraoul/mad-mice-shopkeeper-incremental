# MMSIM-17 — Alternates v3: a small store you keep, and Perfect = Excellent + the candy's alternates

Motivation: playtest 4 (alternates replaced base units, were sold at closing and made Perfect rare and flat). Design in `docs/alternates-and-economy-v3.md`, answers to its questions taken as proposed.

- IN:
  - **Alternates are a store.** Each morning an unlocked alternate has a **25 percent** chance (`chance`, plus `altChance:` upgrades) to add **one unit**, if its store is not full. The store holds **1** (`store`, plus `store:` upgrades). Alternates **never replace a base unit**, **carry over** between days and are **never sold** at closing (base leftovers still sell for 1 coin).
  - **Perfect = the Excellent recipe plus one unit of each alternate the candy names** (`Candy.perfect`). Rising quality always adds ingredients. Honey candies use royal jelly, seed candies dark seed, milk candies cream, berry candies cursed blackberry; mixed ones: Golden truffle uses cream, Meadow bar dark seed, Berry cloud and Cheesecake bites cursed blackberry. **The Sweet Tooth needs all four**, one unit each, and is made one at a time, so the final quest needs 12 alternates over three batches.
  - **Store upgrades**, each +1 store and +5 percent chance: Hive bond (royal jelly; now needs royal jelly, no longer adds honey, still adds visitors; 3 levels), Dark pantry (dark seed), Cold cellar (cream), Bramble basket (cursed blackberry); 2 levels each.
  - The Craft shelf shows an alternate's store as slots (its cap) instead of the day's delivery; the surplus note says rare ingredients are kept.
  - Content validation: every candy names alternates, each the alternate of one of its own ingredients; `store:` and `altChance:` stats exist only for alternates.
  - The Second cauldron cannot whisper, so it never makes Perfect (Excellent at most).
  - Bots keep their alternates for the final errand (they no longer spend them on ordinary Perfect batches) and buy the new upgrades.
- OUT: refitting stage targets (the stage chain is about to be redesigned, see `docs/quests-and-cozy-loop-v4.md`); making the Perfect Sweet Tooth feel like a ritual.
- Decisions: start store 1 for every alternate (upgrades raise it); Perfect keeps its single "whisper" step and no oven or pull step; hive bond lost its extra honey (honey has its own yield upgrade).
- Verified: `npm run check`, `npm test` (221), `npm run check:content`, `npm run balance` (pacing within the guards; the casual bot is a little slower late because alternates no longer pay coins).
- Open decisions: the late-game economy and stages (v4 doc); whether 25 percent should be lower for the cursed blackberry; the Sweet Tooth chase length.
