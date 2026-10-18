# MMSIM-29 — Three routine switches and a visible accounting mouse

Motivation (playtest, 2026-10-18): the accounting mouse bought everything and slept in a blink, and a single switch could not say "run the shop but let me pick upgrades". Spec: "Three routine switches" in `docs/incremental-game.md`.

- IN:
  - `State.routineAccounting`, `State.routineSleep` next to `State.routine` (the foreman). `setRoutine` takes a `part` ('day' by default, 'accounting', 'sleep'); accounting needs the `accountant` unlock (`no-accountant` error otherwise), sleep needs the foreman's `routine` unlock. **Save version 14**: a save whose routine was on and had the accounting mouse starts with both new switches on, so it keeps playing as before.
  - `nextRoutineAction`: morning and afternoon only with the foreman on; evening: the cheapest affordable upgrade while accounting is on, then `endPhase` while auto sleep is on, otherwise null (the player's evening). `GameSession.tickRoutine`/`peekRoutine` run when any switch is on; a helper taken back still switches the foreman off.
  - `describeBeat`: one 1.4 s beat per `buy` and one 2 s beat for the end of an evening with accounting on (settings `accountingStepMs`, `accountingMinMs`), so the UI loop (which plays whatever clips a routine action has) paces the evening. The journal card shows the mouse picture while accounting is on.
  - `HeaderView.routines` (replaces `routine`): the available switches with their state and the action behind each; `App.svelte` shows them in the action bar (status text hidden on a phone, tooltips instead). Strings `routine.day/accounting/sleep` (replace `routine.on/off`), `error.no-accountant`.
  - Tests: evening parts one by one, the per-part errors, the session playing evening without the foreman, the accounting beats, the v13 migration.
- Follow-up (2026-10-19): the Foreman switch no longer refuses when a hired helper was taken back by hand: turning it on forces fill, stir and form back to automatic (`routineMissingHelpers`: only an unhired helper blocks it). Test and EN/FR error text updated.
- OUT: an accounting animation (no frames), a list of what was bought, a reserve for places.
- Verified: `npm run check`, `npm test` (260), `npm run check:content`; in the browser (`?endgame=1`): three switches, and with accounting and auto sleep on the evening lasts about 2 s with nothing to buy. Not run: the simulator (the bots do not use the routine), a phone width check of the three switches.
