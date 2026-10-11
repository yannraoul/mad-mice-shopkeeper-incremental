# MMSIB-5 — Craft screen: layout jumps when slot images finish loading, so taps miss

**Reported:** Tap Honey, tap the cauldron, the images finish loading, and the second tap on the cauldron does not add the second honey (looks like a loss of focus).

**Root cause:** Not a focus problem: layout. `ImageSlot` sized the image with `max-width:100%; height:auto`, so before the file arrived the `<img>` collapsed to its alt text. Measured with image loading delayed by 1.2 s (a patched `src` setter in the embedded browser): the cauldron button went from 92x72 at x=381 to 252x192 at x=374, and the shelf buttons also resized. A tap aimed at the old position missed. My first attempt (`width:100%`) did not fix it because a percentage width inside a shrink-wrapped button collapses until the image loads.

**Fix:** `ImageSlot` gives every image an explicit pixel width from its slot and an `aspect-ratio`, with a background colour, so its box is the final size from the first frame. `main.ts` also preloads every art slot at startup so images are normally cached before a screen needs them.

**Verified:** Same delayed-loading experiment after the fix: station, shelf and item rectangles identical before and after the images load; with delayed images, tap honey, tap cauldron, wait for load, tap cauldron again gave "Honey: 1 / 2" then "Honey: 2 / 2" in the earlier run, and rectangles stayed stable in the rerun. `npm run check` 0 errors.

**Open follow-up:** Real art of a different aspect ratio must still match the slot size (that is the slot rule). Slot sizes are fixed pixels, so very narrow phones rely on `max-width:100%` shrinking the image.
