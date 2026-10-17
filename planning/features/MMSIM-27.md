# MMSIM-27 — The shop rating

Motivation: nothing rewarded variety or punished walk-outs, and closing early cost nothing (playtest, 2026-10-17). Spec in "The shop rating" of `docs/incremental-game.md`.

- IN:
  - `State.rating` (0 to 100, 50 at the start, 72 in the `?endgame=1` shop). `DayReport.happy`: hearts / 3 summed over the customers served that day. Updated when the afternoon ends: `rating += 0.3 * (today's score - rating)`, where the score is `happy` over served + turned away + lost, times 100 (skipped on a day nobody came).
  - `ratingMult` (`src/engine/economy.ts`): 1 + 0.1 times the rating's distance from 50, over 40, clamped to plus or minus 1. Applied in `salePrice` with the Reputation bonus (so `serveChoices` and the offers shown include it).
  - Settings `ratingSwing`, `ratingMid`, `ratingRange`, `ratingSmoothing`.
  - **Save version 13**: the migration adds `rating: 50`; day reports default `happy` to 0.
  - UI: a gauge and "Rating 67 · prices +4 %" in the counter's header; the evening report shows the rating in place of the "contracts expired" figure (the grid holds nine).
  - Engine tests (neutral start, plus or minus 10 % at the ends, up after a happy day and down after a bad one), a v12 migration test.
  - Same session, smaller: the workshop's batch dots now count the fourth batch (the dots used the base batches per day), and picking a customer in the scene scrolls their row into view in the queue list.
- Balance (`npm run balance`, 40 runs): the competent bot earns 722 per day (707 before), the final quest median day 56 (57); the average bot 562 (556), day 64 (65). No guard test had to move.
- OUT: the rating in the header, the rating's effect on who arrives, a per-customer-type rating, tuning the numbers with real play.
- Verified: `npm run check`, `npm test`, `npm run check:content`, `npm run balance`; in the browser (`?endgame=1`): four dots, the rating line, the row scroll (instant: a smooth scroll did not run in the preview pane).
