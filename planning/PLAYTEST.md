# Playtest checklist (v1)

The simulator can only say whether the numbers are *consistent*; whether the game is *fun* is yours to judge.
Play from a fresh game on the plain URL (not the dev hooks), in the language you will ship first.

## Pacing targets the numbers were tuned for (nine stages of a week each; a competent player rarely misses one, an average player misses about three over the game)

| Stages | Cleared around | What opens |
|---|---|---|
| 1 The first steps | day 7 | learning the loop; a handful of cheap upgrades |
| 2 Gathering pilgrims | day 14 | sunflowers, errands board, contract board, the queen's quest; the rival hive steals honey |
| 3 A name on the road | day 21 | second cauldron, hive bond, map (passive income), reputation, the pilgrims' feast |
| 4 to 8 | day 28 to 56 | pulling machine (4), magic cauldron quest (5), dark seed garden and the hive's gratitude (6), more places |
| 9 The feast of Sweet Tooth | day 63 | the final quest: the offering to Sweet Tooth |

A competent player passes each stage in its first week; an average one repeats about three weeks over the game (each repeat has a 10% lower target).

## What to look at, and the knob to turn

| If it feels like... | Look at | Knob |
|---|---|---|
| Week 1 is dull / too slow | first upgrades arrive too late | `skillNodes.json` costs (honey-yield, counter-space, oven), `settings.baseArrivals` |
| A week is missed too often, it feels punishing | targets vs income | `stages.json` `target` |
| A stage drags | the target is too far above income | `stages.json` `target`, `arrivalsMult` |
| Customers walk out constantly | patience / counter | `customerTypes.json` `patience`, node `patience`, `counter-space` |
| Nothing to spend coins on late | tree too cheap | upgrade `costs` (the last levels), or add nodes |
| Crafting steps are a chore by batch ~30 | manual steps | automate earlier: `auto-cauldron` cost, `clerk` cost, `delegateAfterBatches` |
| Fine / Perfect never worth making | quality cost vs price | `qualities.json` `extraIngredients`, `priceMult` |
| The rival hive feels unfair | honey theft | `stages.json` `rival.amount`, `rival.startsOnDay` (grace days), `settings.rivalMinSupply`, errand rewards |
| Errands are ignored | rewards too weak | `errands.json` `reward` |

## Things only a human can check

- [ ] First 5 minutes: do you know what to do without reading anything?
- [ ] Is crafting by hand (tap, tap, stir, shape) still pleasant at batch 20? Which step annoys first?
- [ ] Serving: are there real decisions (refuse, quality choice), or do you always press the first button?
- [ ] The evening: is the tree readable? Do you ever want to buy something you cannot find?
- [ ] "I can put it down" pacing: does ending the day feel like a natural stop?
- [ ] French and English: any awkward or missing text? (Placeholders: journal lines, errand text, ending text are drafts.)
- [ ] Phone: tap targets, nothing overflowing, the craft screen on a small screen.
- [ ] Save: close the tab mid-day, reopen: is everything where you left it?
- [ ] Preview build (`npm run build:preview`): no ending, no live-plot content.

## Notes (fill in while playing)

-
