# MMSIM-36 — The workshop mice animated from the author's GIFs

Motivation: the author drew a 4-frame GIF for each workshop mouse (2026-11-05); they replace the placeholder bob strips of MMSIM-22. The mice no longer scale in when they appear.

- IN:
  - `scripts/art/make_placeholder_sheets.py` reads `assets/mice-crops/<role>.gif` (4 frames, 64 x 64, 170 ms) and writes the strips `public/art/sprites/<role>-idle.png` / `-work.png`; both actions use the same frames (idle runs slower through `fps` in `sprites.json`). A role with no GIF still gets the old bob.
  - The GIFs have no transparency, only a solid black backdrop: it is keyed out by a flood from the frame edges. The puller drops every pure-black pixel (the stool legs enclose some). The sculptor's jar outline was black like the backdrop, so it is redrawn in the palette outline colour (`#2b1c0e`) around the jar.
  - Per-role `NUDGE` of the frame, applied inside each 64 px cell so nothing bleeds into the next frame: puller 3 px left, porter 5 px left, sculptor 4 px right and 1 px up. The baker is moved in the scene instead (`scenes.json`: 116, 49, was 122, 58): moving it inside its frame would clip the spatula, which starts 2 px from the left edge.
  - The puller and the stirrer GIFs carry their stool, so no stool is drawn elsewhere.
  - `Scene.svelte`: the `pop` entrance animation (scale 0.4 to 1) is gone; it looked like the stools bubbling into place. The ghost/dim opacity stays.
- OUT: separate idle and work animations (one GIF per mouse for now), the customer and clerk tokens.
- Verified: `npm run check`, `npm run check:content`, `npm test` (266); the strips were inspected as images (transparency, jar outline, stool legs, nothing clipped), and the author confirmed the placement in the browser. Not checked: phone width.
