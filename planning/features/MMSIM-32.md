# MMSIM-32 — Art drop: the puller, the sculptor, the counter picture, a palette tool

Motivation: the author drew the counter and a new mouse and renamed the old "sculptor" to "puller" (2026-10-18).

- IN:
  - **Puller and sculptor**: the pulling mouse is now `puller` (step `pull`, at the work table); the sculptor is its own mouse (step `form`), standing on the wooden edge above the cauldron, looking left at the jars (frame at x 183, y -20: feet at y 37). The jars' toggle zone grows to cover it. The fifth-mouse placeholder (`shaper`) is gone. `scripts/art/make_placeholder_sheets.py` reads `puller-nostool.png` and `sculptor.png`; placeholder strips regenerated.
  - **The counter picture** `public/art/scenes/counter.png` (256 x 176) is shown behind the scene; the layout follows it: tokens 28 px in two columns on the carpet (three rows, six places, the rest in the "+N" badge), four round tables with a chair each side, the counter and the clerk placeholder.
  - `scripts/art/palettize.py`: maps any picture onto the 32 colours of `docs/art/sweet-tooth-32.hex` (nearest in Lab space, optional `--size` shrink and ordered dither, alpha kept), so art from any tool can join the set. The author's pictures so far are already exactly on the palette.
  - `docs/art/art-pack.md` updated (mouse names, palette tool).
- OUT: real mouse animations, the clerk token, customer tokens, candy and ingredient icons.
- Verified: `npm run check`, `npm test` (265), `npm run check:content`; in the browser (`?endgame=1`): the five mice with the sculptor at the new spot, the counter picture with tokens on the carpet.
