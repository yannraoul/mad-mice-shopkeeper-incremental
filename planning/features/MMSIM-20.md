# MMSIM-20 — The quest chain, part B: objectives, rewards, late money sinks, the retune

Motivation: after part A (MMSIM-19) the chain was only coins; money was idle from stage 6 on and nothing asked the player to *do* anything. Design in `docs/quests-and-cozy-loop-v4.md` (section 1), proposals taken as written.

- IN:
  - **Quest descriptions** (`descKey`) for every quest, EN/FR, shown in the goals list.
  - **Rewards and bonuses**: a quest pays `coins` when done (not counted as revenue, so it never feeds the `earn` goals) and may carry a `bonus` of more coins if it is done within `days` days of opening (the day the last quest it needs was done). A bonus, never a fail: the spine quests q2 to q8 carry one (50, 100, 150, 250, 350, 450, 600 coins within 7 days).
  - **A new goal type**: `errand` (an errand finished).
  - **Thirteen objective quests** next to the money spine, each opening with the quest its content opens with: buy the Porter mouse, finish the queen's, the rival hive's, the pilgrims', the scarecrows', the dairy, the bramble, the magic cauldron, the royal gift, the Stumpsville and the cursed errands, buy the pulling machine, hire the Foreman mouse. They pay 60 to 800 coins. They teach the order of the game and give mid-game a push.
  - **The goals list**: the strip lists every open quest (name, text, each goal with its progress, reward and bonus) behind "+N more goal(s)".
  - **Late money sinks**:
    - More upgrade levels: counter space 4 to 6 (1000, 2200, 4500), patience 3 to 5 (900, 2000), cauldron size 4 and 5 (1000, 2400), reputation 6 and 7 (5500, 9000). Counter space and reputation raise the income ceiling, so they are real choices, not decoration.
    - **Places for sale on the map**: three new places with a cost (Cobbled market 600, income 30; Pilgrim hostel 1600, income 80; Fairground 3800, income 190), bought with the new action `buyPlace` in the evening once their quest is done and the map is owned. The six earlier places stay free. `State.places`; save version 12.
  - **The retune**: the spine's coin goals were refitted to the casual bot's cumulative revenue with the new sinks and rewards: 240, 860, 2450, 5200, 8800, 12800, 18000, 25000 coins in all. The smart bot does the chain by about day 55 and delivers the final quest on day 54; the casual bot on day 62; no run fails to finish.
  - The smart bot buys the new levels (they are in its upgrade list) and opens the places once the tree is done; tests for rewards, bonuses, errand goals, buying places and the new views; catalog; EN/FR strings.
- OUT: weekdays (market day, rest day), quest deadlines that remove things (only bonuses exist), a separate quest screen, `batches` and similar goal types, music of the Sweet Tooth chase (it is still the long alternate hunt).
- Decisions taken where the design left room:
  - Objective quests are optional side goals: nothing is gated behind them yet, only the spine gates content, so a player who ignores them loses coins, not progress.
  - Costed places are not opened for free by finishing the game.
  - Quest coins come on top of `earn` so objective quests do not speed up the spine by themselves (they speed up buying power, which does).
  - The first thresholds are bot tuned; real players beat the bots by about half again, which the 9-week target absorbs.
- Verified: `npm run check`, `npm test` (234), `npm run check:content`, `npm run build`, `npm run balance`; browser (fresh dev server): the goals list with its eleven open quests, descriptions and rewards in French, and the map in the evening.
- Open decisions: market day and rest day (next milestone); whether the objective quests should gate something (a recipe, a customer type) to matter more; whether the last quests need an `own` goal for the late upgrade levels so money has a stated purpose.
