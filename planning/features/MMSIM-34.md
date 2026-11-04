# MMSIM-34 — Item icons from the sheets, 64 x 64 slots, the day-transition sprites

Motivation: the author's Pixellab sheets for the ingredients, the candies, the shop signs, the sun and the moon arrived (2026-11-05); the placeholder SVGs and the CSS transition give way to them.

- IN:
  - `scripts/art/cut_icon_sheet.py` cuts `assets/ingredients.png`, `candies-1.png`, `candies-2.png` (4 x 2 cells, left to right, top to bottom) onto the 32-colour palette, trims each icon and centres it, bottom-aligned, on a transparent 64 x 64 canvas: `public/art/<slot id>.png` for the 8 ingredients and 15 candies. `npm run art:link` points the slots at them.
  - The 23 slots in `content/core/artSlots.json` are 64 x 64 (were 96): the sheet icons are drawn at about 64 px, 32 would lose detail. `ImageSlot` draws pixelated and no longer paints a striped box behind a loaded picture.
  - `PhaseTransition.svelte`: the sign (`public/art/ui/sign-open.png` / `sign-closed.png`, 96 x 40, drawn at 3x, 2x on phones) drops in from the top, sways and goes back up, instead of the CSS flip. Over the night the sun and the moon sit on opposite ends of one wheel turning about the bottom centre of the screen (a full turn, sprites kept upright), so both follow circular arcs: the sun sets on the right, the moon comes up on the left and crosses, the sun rises again. The sky stays a CSS gradient.
- OUT: the French signs (the words are in the pictures; FERME / OUVERT to draw), the hex-flower map (`assets/hexflowermap.png`, 256 x 176, added but not wired), the old placeholder SVGs (left in place, unused), the unused `transition.open/closed` strings.
- Verified: `npm run check`, `npm run check:content`, `npm test` (266); in the browser (`?endgame=1`): the OPEN sign drops in on opening the shop; on going to sleep the sun sets right and the moon rises left. Not checked: phone width, the icons across every screen, the Closed sign.
