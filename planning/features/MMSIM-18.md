# MMSIM-18 — The daily routine: a foreman mouse runs the day

Motivation: step 1 of the cozy loop in `docs/quests-and-cozy-loop-v4.md`. With helpers (MMSIM-15) and the Second cauldron (MMSIM-16) the player should be able to let the day run and take over for what matters (Perfect, contracts, the Sweet Tooth).

- IN:
  - **Foreman mouse** (shop branch, 600 coins, stage 4, needs the clerk and the three basic helpers): unlocks the **Routine** switch, in the action bar next to the phase button, with a one-line status of what the mice are doing.
  - **What the routine does** (`src/engine/routine.ts`, a pure function of the state, `nextRoutineAction`):
    - Morning: hands in the contracts and delivery errands that stock covers (never the final quest), makes batches, then ends the morning. A batch is chosen for what is asked first (cheapest quality that qualifies), then for the candy there is least of, while stock stays under `routineStock` (12). It makes only qualities whose **every step has a helper hired and switched on**; Perfect is never made by it and rare ingredients are never spent.
    - Afternoon: serves the most impatient customer with the best payout, turns away those nothing fits, then ends the afternoon.
    - **Evening: the routine waits.** Upgrades are the player's; ending the day starts the next morning, which the routine takes up by itself.
  - The routine can only be switched on while a helper exists for fill, stir and shape; if one is taken back, the routine switches itself off. Switching it off is the way to take over at any moment.
  - The app beats the routine on a timer (350 ms per action) so the day can be watched; `GameSession.tickRoutine()` does one beat (tests loop it).
  - `State.routine`, engine action `setRoutine`, fail codes `no-routine` and `routine-needs-helpers`; save version 10 with a migration. Settings: `routineStock`. Strings EN/FR. The smart bot buys the upgrade.
- OUT: animated mice (the routine only changes the screens, as a player would), a speed setting, the routine choosing the Second cauldron's preferred candy, minigames, anything for the weekdays (market day and rest day come later).
- Decisions taken where the design left room:
  - Routine serving takes the customers in an order that favours the impatient, as a good player would; it is not slower than the player, since the helpers were paid for.
  - Hand batches already begun on the Craft bench are not cancelled by the routine; a half-made batch could then miss its ingredients (it is refused, nothing breaks).
  - The pace is fixed for now.
- Verified: `npm run check`, `npm test` (a new `src/engine/routine.test.ts`), `npm run check:content`, `npm run balance` (unchanged: bots do not use the routine); browser: with the foreman and three helpers the day went morning, afternoon, then stopped on the evening note.
- Open decisions: a speed control; whether the routine should also hand in the final quest or leave it; whether a routine day should earn a bit less than a played one.
