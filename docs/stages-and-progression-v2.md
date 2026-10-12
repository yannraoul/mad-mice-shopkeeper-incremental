# Stages as a chain of unlocks (design, not built yet)

Status: agreed direction, details open. Becomes **MMSIM-13**.

## Idea

There is no "stage 3" as an end any more. The campaign is a **chain of weeks**. Each week has a money target; passing it
gives a permanent reward: new upgrades, quests, places that earn passive income, events. The last reward is the final
quest, "Deliver 3 Perfect Sweet Tooth" (see `docs/recipes-and-ingredients-v2.md`).

This replaces the current model (three stages, the last one is "the end") and makes the weekly loop matter, which was
the main playtest complaint: today a missed target changes nothing.

## Week schedule (draft, 9 to 10 weeks, tuned by `npm run balance`)

| Week | Target (draft) | Reward when passed |
|---|---|---|
| 1 | 240 | Sunflower patch available; first reputation upgrade; the errands board is announced |
| 2 | 800 | Errands board; the queen's quest line (honey supply, royal jelly); rival hive from day 3 of this week |
| 3 | ~1500 | Dairy quest (milk) and the first map place: Stumpsville road; a market stall (passive income) |
| 4 | ~2400 | Bramble quest (blueberry); second reputation tier |
| 5 | ~3500 | Pulling machine (Excellent); an inn on the map (passive income) |
| 6 | ~5000 | Dark garden quest; Stumpsville cream route |
| 7 | ~7000 | Cursed bramble (temple); third reputation tier |
| 8 | ~9500 | Magic cauldron quest (Perfect) |
| 9 | ~12500 | The final quest: deliver 3 Perfect Sweet Tooth; the ending |

The order follows the ingredient quests, so the pairs and triples open as the player earns them, and the Perfect
chain arrives last.

## Passive income and events

- **Map places** become the passive-income source: each bought place pays a fixed number of coins every morning (small
  numbers, so they smooth the stretches where nothing is affordable, not replace the shop).
- **Events** (a caravan, a festival, a storm) are data: a day modifier with a text, drawn like the forecast, some
  triggered by the week reward. Optional for the first version.
- **Reputation upgrades** (repeatable "candies sell +x%") fill the gaps between large purchases.

## What a missed week does (decision needed)

Options, from softest to hardest:
1. The week restarts with the same target; nothing is lost, the reward is only delayed (today's rule).
2. As 1, but the rival hive's theft carries over, and the passive income pauses.
3. As 1, but the target of the repeated week is slightly lower (the shop had a bad week) so the loop does not feel stuck.
4. The shop loses a point of reputation (a visible stat that the player can rebuild).

Recommendation: 1 plus 3 for the first version, since a punishing missed week combined with a long chain risks a
grind, which was a playtest complaint.

## Data and engine changes

- `stages.json`: stages gain `rewards` (effects such as unlock a node, an errand or a place, with a text) and the
  chain can be longer than three; `rival` stays optional per stage.
- The completed game state becomes "the final quest was delivered", not "the last stage was passed".
- Places gain `income` (coins a day) and a cost or quest to open.
- Journal entries and strings for each week; the pacing table in `planning/PLAYTEST.md` is re-measured.

## Open questions

1. How many weeks is too many? (9 weeks is about 63 days; the current campaign is about 49.)
2. Passive income as map places only, or also from hired helpers?
3. Which of the missed-week options above?
