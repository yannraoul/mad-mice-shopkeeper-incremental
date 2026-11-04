# MMSIM-33 — Customer token variants: Pixellab sheets cut per customer type

Motivation: the author's own tokens looked off; Pixellab produced a sheet of customers and a sheet of bees (2026-10-22). Grouping them by hood colour gives each customer type several looks.

- IN:
  - `scripts/art/cut_token_sheets.py` cuts `assets/customers.png` and `assets/bees.png` (8 x 8 cells of 32 x 32), maps them onto the 32-colour palette and writes `public/art/tokens/customer-<type>-<n>.png`: traveler 7 (green hoods), faithful 11 (blue), merchant 9 (purple), bee 20 (plain bees, bees with hats, wings-spread bees). The cell lists live in the script, picked by eye with the author.
  - `src/ui/tokenArt.ts` (`tokenSrc`): the variant is `customer id % count`, so a customer keeps the same picture on the counter and in the queue list and nothing is saved. The counts there must match the script.
  - `CounterScene.svelte` and `QueueList.svelte` use it; the faces still fall back to the coloured circle when a file is missing.
  - New `clerk.png` (grey hood with glasses, cell 8,8 of the customers sheet). `queen.png` (cell 8,8 of the bees sheet) is stored, not used.
  - `docs/art/art-pack.md` token paragraph updated.
- OUT: using the queen, the unused cells (maroon, tan and grey hoods), a variant per quality or mood. The old `customer-<type>.png` files are no longer referenced and were left in place.
- Verified: `npm run check`, `npm run check:content`, `npm test` (266); in the browser (`?endgame=1`, shop open): the counter and queue list show mixed mice and bees with the new clerk. Not checked: phone width.
- Seated customers keep the walking size (32 px, was 24): `SEATED = SIZE`, seats re-centred on the same spots (2026-10-22).
- The candy a customer wants shows in a round badge (7.2 cqw, soft sand #f0c27a with a brown rim, the icon at 88% of it, centred; checked that every candy's opaque pixels stay inside the circle). The icons are now centred both ways on their 64 x 64 canvas (`cut_icon_sheet.py`), not bottom-aligned. Seated customers sit 4 px higher. In the recipe list the ingredient icons are 44 px (were 22) with a smaller count badge (2026-11-06).
