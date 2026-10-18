# MMSIM-31 — The ending sequence

Motivation: the campaign ended on a line of text in the stage bar. Decided with the author (2026-10-18): a one-time cutscene, then play on; built from the scenes and CSS we have; placeholder lines to be rewritten. Spec: "The ending sequence" in `docs/incremental-game.md`.

- IN:
  - `State.endingSeen` and the `ackEnding` action. **Save version 15** (the field defaults to false, so a finished game sees the sequence once). The developer end-game shop (`?endgame=1`) starts with it seen; `?completed=1` plays it.
  - `src/view/ending.ts` (`buildEndingView`): the title and lines from the ending pack (`ending.title`, `ending.beat.1` to `.5`), `available` (completed and the pack is present), `due` (available and not yet seen), the workshop with all five mice for the sequence to play over, the labels. Core strings `ending.skip/continue/replay`.
  - `src/ui/EndingSequence.svelte`, mounted in `App.svelte`: a full-screen overlay; five beats that follow each other every 5.5 s (or by click, Enter or the arrow), Skip and Escape leave. Per beat: the workshop darkens, the three offered Sweet Tooths appear and glow over the cauldron, a flash, the mice turn pink and cross-fade to a candy icon each, the last line waits for "Back to the shop". Reduced motion: no animation, stepped by click. Closing it sends `ackEnding` when it was due; Settings has "Watch the ending" (when available) that plays it again without changing the state.
  - Placeholder EN and FR lines in `content/packs/ending/` (README updated). `npm run build:preview` and `verify:preview` pass: none of the pack's text is in the preview build.
  - Tests: the ending view (not available before completion, due once, absent without the pack, not due in the developer shop) and the v14 migration.
- OUT: real art for the candies the mice become (the Sweet Tooth icon is a placeholder), sound, music, an epilogue after the sequence, stats on the closing line.
- Verified: `npm run check`, `npm test` (265), `npm run check:content`, `build:preview` and `verify:preview`; in the browser (`?completed=1`): the sequence plays through five beats, Continue closes it, Settings replays it. Not checked: phone width, reduced motion.
