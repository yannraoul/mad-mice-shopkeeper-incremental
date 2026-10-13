# MMSIB-15 — Craft shelf: cramped leftovers note, tall ingredient list

**Reported (playtest 3):** (1) The "Unused ingredients are sold..." card has no padding and the text is almost overflowing on small spaces. (2) The ingredient list is too tall once there are many; the text should sit under the picture and the counter on the picture, without "x left", so a base ingredient and its alternate can sit side by side.

**Root cause:** (1) The note used the class `note`, which is the global parchment card style (no padding of its own here). (2) Each ingredient was a wide row (picture, name, dots, "n left") in a single column.

**Fix:** (1) The note has its own style: padded, small, muted. (2) A compact tile: the picture (80 px) with the counter dots laid over its bottom edge on a dark strip, the name under it; "n left" is kept for screen readers only. The shelf is two tiles a row, and four a row once there are more than four ingredients (base next to its alternate: honey, royal jelly, sunflower, dark seed on the first row, milk, cream, blueberry, blackberry on the second); the shelf column is 250 px, or 370 px with four a row, and on a phone four a row as well.

**Verified:** `npm run check`, `npm test` (195), build; browser at 1280 px with all eight ingredients (two rows, pairs side by side), at 375 px (no horizontal overflow; names at 12 px so "Blueberry" does not break).

**Open follow-up:** the art is still placeholder, a final icon with its own bottom margin will look better than the dark strip.
