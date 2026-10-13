# MMSIM-19 — The quest chain, part A: quests replace the weekly stages (engine)

Motivation: failing a weekly stage only repeated it, so the target was a pacing gate with no stakes, and money was idle after stage 6. Design in `docs/quests-and-cozy-loop-v4.md` (section 1, answers: weekly target removed, calendar kept, deadlines may cost a bonus later). This is part A: the engine and a one-to-one mapping of the old content. Part B (new quests, money sinks, the retune, weekdays) comes after.

- IN:
  - **`quests.json`** replaces `stages.json`. A quest has `requires` (quests done), `goals` (all must hold), an optional `reward` (unlocks, stations), and optionally `arrivalsMult` and `rival`. Goal types: `earn` (coins earned in all, counting today's sales), `own` (an upgrade at a level), `day` (the calendar reached a day).
  - **A quest completes by itself** the moment its requirements and goals hold (checked after every successful action, a reward can open the next one at once). No weekly target, no deadline, nothing to fail; empty days only delay it.
  - **Gating by quest.** `minStage` on upgrades, errands and places is replaced by `quest: <id>` ("opens when this quest is done"). Refusal code `quest-locked` ("Opens with the goal ..."), replacing `stage-locked`.
  - **What the shop has grown into** is the latest done quest that sets `arrivalsMult` (customers per day) and `rival` (the rival hive; from the weekday `startsOnDay`).
  - **Calendar only**: weeks and days are just the day count (week W, day D / 7); the strip keeps its seven day pips. `State.quests` (id -> day done), `State.revenueTotal`; `stage`, `lastWeek`, the `weekEnded` event and the easy-mode settings are gone. The journal line for a finished week is now "a quest was done today".
  - **One to one from the stages**: eight quests `q1`..`q8`, named like the old stages 1 to 8, each asking for the running total of the old targets (240, 760, 1910, 3810, 6610, 10110, 14110, 18410 coins in all); quest N carries what stage N+1 had (customer volume, the rival hive of stages 2 and 3). Everything that opened at stage N+1 now opens with quest N; the final quest opens with `q8`.
  - **Strip and header**: the strip shows the open quest, its coins goal and a progress bar, the calendar, the rival chip, "New: ..." for what the latest quest opened (for a day or two), and "+N more goal(s)" when several are open. "Every goal is reached" once all are done.
  - Save version 11: stage N cleared becomes `q1..qN` done and the running total is rebuilt from the day reports. Dev hook `?stage=N` now starts with the first N-1 quests done.
  - Balance tooling reports the day each quest is done; the guards are re-fitted (see below). Catalog, strings EN/FR, tests (`quests.test.ts` replaces `stages.test.ts`, a v10 migration test, a test kit `src/engine/testkit.ts`).
- OUT: new quests and objectives beyond coins, quest deadlines with a bonus, late money sinks, retuning the pace (bots now finish a little faster than before: no weekly rounding up), market and rest days, a quest log screen listing every open quest.
- Decisions taken where the design left room:
  - `earn` counts the running total of coins, not "since the quest opened": simpler to read and nothing to reset; the quest chain stays honest because quests open in order.
  - A completed quest is never undone; rewards apply once.
  - The stage 9 quest was dropped: its only job was to lead to the final quest, which opens with `q8` as it did when stage 9 was reached.
  - Quest names reuse the old stage names (they read as chapter names); descriptions come with part B.
- Verified: `npm run check`, `npm test` (229), `npm run check:content`, `npm run build`, `npm run balance` (smart bot: the quests are done on days 7, 14, 19, 25, 30, 35, 41, 47 and the final quest on day 50; casual bot: final quest on day 56; no run fails to finish); browser: the strip with the open quest, the progress text, the rival chip and the "New:" line.
- Open decisions: the pace (about a week quicker than the staged version), the money sinks, whether `earn` should also be offered as "earn N in a single week" for variety.
