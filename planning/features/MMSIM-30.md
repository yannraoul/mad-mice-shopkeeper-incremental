# MMSIM-30 — Counter tokens, the fifth mouse, and the art pack

Motivation: the counter's customers should be simple round tokens that move around, not animated figures from above; and every missing picture needed one place that says what to draw, at what size, and where the game picks it up (playtest, 2026-10-18).

- IN:
  - `CounterScene.svelte`: customers are circle tokens. Each draws `public/art/tokens/customer-<type>.png` over its coloured circle when the file exists (hidden on a load error), bobs in place (out of step with the next), shakes when about to leave, shows a "!" then; a served customer seated at a table shows hearts for how happy they were (from the `sold` event). The shop picture `public/art/scenes/counter.png` (256 x 176) and the clerk token `public/art/tokens/clerk.png` are picked up the same way: while there is no picture the placeholder counter, tables and door show; with one they are hidden.
  - **The fifth mouse**: a `shaper` sprite and scene actor for the `form` step at the jars (placeholder: copies of the porter's strips, `shaper-idle.png`, `shaper-work.png`). A batch now plays fill, stir, the quality's extra steps, then shape. Tests updated.
  - `npm run art:link` (`scripts/art/link-art.ts`): points an art slot at `public/art/<slot id>.png` (or `.webp`) when one exists and lists the slots still on placeholders.
  - `docs/art/art-pack.md`: every picture left to draw, with sizes, file names, how the game picks it up, the counter layout coordinates, the list of the 15 candies and 8 ingredients, and a prompt to start from for each family.
- OUT: mood sprites (symbols for now), drawn versions of the sign, sun and moon (CSS for now), walk cycles, the real art itself, the end screen.
- Verified: `npm run check`, `npm test` (260), `npm run check:content`; in the browser (`?endgame=1`): five mice and five zones in the workshop; round bobbing tokens with the placeholder fallbacks working when no files exist. Not checked with real art files.
