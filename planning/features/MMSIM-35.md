# MMSIM-35 — The hex-flower map

Motivation: the author drew a hex-flower map of the campaign world (`assets/hexflowermap.png`, 256 x 176) to replace the map strip (2026-11-05).

- IN:
  - `public/art/scenes/map.png` is the picture, shown in the evening card "Around the shop" (`MapStrip.svelte`) instead of the strip slot.
  - Each place has an optional `at` (pixel x, y on the picture) in `content/core/places.json` (schema `Place.at`); the map view turns it into a percent `pin`. A pin is a star when the place is open, a dashed "+" when it is for sale, a "?" while unknown. Buying stays on the list under the picture.
  - The pins sit on the centres of their hexes (flat-top lattice, 36.6 px pitch). The places take the names of the campaign map's locations (ids, quests and save unchanged; EN and FR `place.*` strings only): millpond is River's Rest (bottom of the two log hexes), old-orchard Oaksgrove, sunflower-hollow Poppyseed House, stumpsville-road Stumpsville, market-stall Woodpile, roadside-inn Cave of Gormenghast, cobbled-market Bridge Hideout, pilgrim-hostel The Factory (the company's original base), fairground Menhir Mot. Move a pin by editing its `at`.
- OUT: a pin for the shop, fog over the hexes of unknown places, clicking a pin, cropping the picture's empty margins (the flower fills about two thirds of its width, so it reads small in the narrow side column), removing the unused `map-strip` slot and SVG.
- Verified: `npm run check`, `npm run check:content`, `npm test` (266, the map test now checks every place has a pin); in the browser (`?endgame=1`, evening): the flower with nine star pins. Not checked: phone width, the for-sale and unknown pin looks.
