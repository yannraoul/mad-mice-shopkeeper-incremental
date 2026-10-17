# MMSIM-28 — The accounting mouse

Motivation: with everything else automated, the evening was the one phase the routine left to the player; and a late-game player had nothing to do but click through upgrades (playtest, 2026-10-17). The art (a desk with a mouse accountant, and the empty desk) came from the player.

- IN:
  - Node `accounting-mouse` (shop branch, one level, 1,500 coins, requires `foreman-mouse`) unlocking `accountant`. Strings EN/FR. The foreman mouse's description mentions it.
  - `nextRoutineAction` (`src/engine/routine.ts`), evening with `accountant`: the cheapest affordable upgrade (`buy`), or `endPhase` when none is. Without it the evening stays the player's (null), as before. Routine off = nothing happens, so the Routine switch is the only control.
  - Routine status text in the evening with the accounting mouse ("The accounting mouse is buying upgrades…").
  - `EveningView.journal.accountant` (hired and routine on); the journal card cross-fades `accounting.png` (mouse at work) over `accounting-idle.png` (empty desk).
  - The simulator's smart bot buys it last (median day 54 smart, 62 casual); pacing is unchanged (final quest median day 56 / 64). Routine tests: the evening is the player's without it; cheapest affordable first; a whole evening ends in the morning.
- OUT: a spending reserve or a focus branch (the player asked for the routine switch to be the only control), buying map places, a list of what was bought tonight (the evening goes by in a beat when the routine runs it), a writing animation (no frames yet), the node's own art.
- Verified: `npm run check`, `npm test`, `npm run check:content`, `npm run balance`; in the browser (`?endgame=1`): with the routine on the day runs on through the evening into the next morning, and the mouse picture appears on the journal card only while the routine runs the evening.
