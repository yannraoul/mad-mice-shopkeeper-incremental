# Quests instead of stages, weekdays, and the cozy loop (design, not built)

Source: playtest 4 follow-up. Nothing here is built. It replaces sections 3 and 5 of `alternates-and-economy-v3.md`.

## 1. From stages to a quest chain
Today: nine weekly stages with a coin target; failing a stage only repeats it with a lower target, so it is a pacing gate more than a challenge. The stage also gates upgrades, errands and places (`minStage`), sets the customer rush and the rival hive.

Proposal: **remove the weekly target and the stage index. Progress is a chain of quests**, each unlocking when its **requirements** are met (earlier quests done and/or upgrades owned and/or days played), and each **granting** things: upgrades, places, ingredients, qualities, the next quests.
- `minStage` becomes `requires: [quest or upgrade ids]` (nodes and errands already have `requires` and `needs`; places and errands gain the same fields). Difficulty comes from a **shop level** that quests raise (customers per day, the rival hive), not from a calendar.
- Existing content maps over: each stage's "what it opens" list becomes a quest ("Open the oven", "Hire a clerk"...) whose reward is that unlock. The current errands stay and gain `requires`.
- **Pressure so it is not toothless**: quests can have a **deadline in days** that only costs the *bonus* (coins), never blocks the chain; the rival hive keeps stealing until its quest is done.
- The **final quest** stays "3 Perfect Sweet Tooth" and unlocks at the end of the chain.
- **Late sinks** (money is idle after about stage 6): more levels on counter space, cauldron size, reputation and patience; places on the map bought with coins; the store upgrades of v3. Costs scale so the last quests need real saving.
- Effort: large (engine state, save migration, content for about 25 quests, the stage strip becomes a quest log, balance rewrite: bots follow the chain, targets disappear, the guard becomes "time to finish"). Two milestones: **A** the chain engine with quests mapped one to one from the stages; **B** new quests, sinks and the retune.

## 2. Days of the week (your idea)
A week only has a rhythm if its days differ. Candidates, each small:
- **Market day** (day 3 or 6): more travelers, better prices on contracts.
- **Rest day** (day 7): fewer customers and **cleaning**, a short mini-game: skip it and the next week starts with one fewer batch; do it for a small tip bonus. A hired mouse could take cleaning over (the same helper pattern).
- **Delivery day**: the supply of one ingredient doubles, or the alternates' chance rises.
Danger: a mandatory weekly chore is what automation is meant to remove, so cleaning should be a *choice* a mouse can take over. I suggest starting with a market day and a rest-day cleaning that costs nothing if skipped and only gives the bonus.

## 3. The cozy loop (the end goal)
With the helpers (MMSIM-15, 16) a day can run by itself. The goal you describe:
- **Morning**: animated mice fill, stir, bake and shape in the kitchen scene; the order book decides what.
- **Afternoon**: the scene switches to the shop: mice serve customers, coins pop.
- **Evening**: a count-up of the revenue while the player picks upgrades.
- **A pause button** to take over: make the Perfect Sweet Tooth by hand while the rest runs.
Steps: (1) **auto-run**: a "run the day" toggle that plays morning, afternoon and evening without clicks, using the existing helpers and the clerk (the engine already supports it; the bots show it); (2) **animated mice** in the kitchen and shop (needs art: sprite sheets per role: porter, stirrer, sculptor, clerk, customer); (3) the pause and take-over interaction. Step 1 needs no art, so hand crafting stays for what matters (Perfect, contracts).

## 4. Order
1. Quest chain A (engine, one to one from the stages), then B (content and retune).
2. Auto-run toggle (cozy step 1); it can also come first, it is small.
3. Minigames, the rest day, animated mice with the art.

## 5. Questions
1. OK to remove the weekly target entirely (keeping weeks only as a calendar)?
2. Quest deadlines that only cost a bonus: yes, or none at all?
3. Which weekday ideas do you want (market day, rest day with cleaning, delivery day)?
4. Do you want the auto-run toggle before the quest chain (it is smaller and helps playtesting the late game)?
