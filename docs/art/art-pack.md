# Art pack: everything left to draw

One page for Pixellab: every missing picture with its size, the exact file to save it to, how the game picks it up, and a prompt
to start from. Palette for all of it: `sweet-tooth-32.hex` (see `palette.md`). Outlines `cocoa-900`, never black. Pixel art is shown
with `image-rendering: pixelated`, scaled by whole numbers where there is room.

**Shared style words** (use at the start of every prompt):
> Cozy pixel art, 16-bit, soft warm lighting, rounded shapes, dark cocoa outlines, clean pixels, no anti-aliasing, no text.

For a picture with characters add: "a small cute mouse character, transparent background". For a background add: "no characters, no
animals, no people" (a first test painted mice into the scene when a background prompt mentioned them).

**How pictures reach the game**
- A *sprite strip* is named in `content/core/sprites.json` (frame size, frame count, fps): save over the file, change `frames` if you
  draw more or fewer.
- An *item icon* is an art slot (`content/core/artSlots.json`). Save `public/art/<slot id>.png`, then run `npm run art:link`: the slot is
  pointed at the new file and the placeholder is left behind. Draw at the slot's size.
- *Backgrounds and tokens* are picked up by file name when they exist; until then the placeholders stay.

## 0. Keeping to the palette, whatever tool you use

Any generator or editor: run `python scripts/art/palettize.py <files> [--size 256x144]` (`scripts/art/palettize.py` has the details) and every pixel is mapped to
the nearest of the 32 colours, transparency kept; `--size` first shrinks an oversized output cleanly. Check the result at 1x before use.

## 1. The workshop (already has a background; mice are placeholders)

Scene 256 x 144. Mice are **64 x 64 frames in a horizontal strip** (4 frames = a 256 x 64 file), facing the camera in three-quarter view,
standing where the anchors in `scenes.json` put them. Today's strips are made by `scripts/art/make_placeholder_sheets.py` from your cleaned
crops in `assets/mice-crops/` (a pixel of bob): replace them with real animation, same file names.

| Mouse | Does | Files | Where it stands |
|---|---|---|---|
| Porter | fills (brings the ingredients) | `public/art/sprites/porter-idle.png`, `porter-work.png` | on the floor in front of the hearth |
| Stirrer | stirs the cauldron | `stirrer-idle.png`, `stirrer-work.png` | on the ladder platform at the cauldron |
| Baker | the oven (and the oven timer) | `baker-idle.png`, `baker-work.png` | in front of the oven |
| Puller | rolls and stretches the paste (the pull step) | `puller-idle.png`, `puller-work.png` | at the work table, left |
| Sculptor | shapes the candies (the form step) | `sculptor-idle.png`, `sculptor-work.png` | on the wooden edge above the cauldron, looking left at the jars |

Idle: 4 frames, 3 fps (a breath, a tail flick). Work: 4 frames, 6 fps (the gesture of the role: carrying a sack, stirring with a ladle, opening the
oven door, pulling a rope of candy, filling a jar). Each role has its own apron and hat so the family reads as one cast. Optional later: `walk`
and `carry` strips (the scene does not use them yet).

Prompt (one per role, change the role line): "{shared style words} A small cute mouse character, transparent background, 64x64, three-quarter
front view, wearing a {role apron and hat}, {role gesture}. 4-frame animation strip." Roles: porter = a sack on the shoulder; stirrer = a
chef hat and a long wooden ladle; baker = a tall white hat and oven mitts; puller = rolled sleeves, a long rope of pink candy paste in the
paws; sculptor = a small cap, shaping a candy with a little tool.

## 2. The counter (afternoon): a background and customer tokens (both done, generated)

Top-down view, scene **256 x 176**. Today it is coloured rectangles; the layout below is where things go so a picture drops in:

- Counter: across the top, x 24 to 232, y 6 to 30. The clerk stands behind it (token at x 114, y 4, 28 x 26).
- The queue lane, up the middle from the door to the counter, two customers wide: positions x 88 and x 136, rows every 34 px from y 40 (8 places).
  Keep it as open floor, a carpet or a path.
- Four tables, two seats each: left side at (6, 44) and (6, 108), right side at (202, 44) and (202, 108), each 48 x 52. Sitters are drawn 22 px wide.
- The door: bottom centre, x 108 to 148.
- Everything else is yours: shelves with candy jars against the top wall, a window, plants, lanterns.

**Background**: `public/art/scenes/counter.png`, 256 x 176 (done; the layout below was fitted to it). Prompt: "{shared style words} A cozy candy shop seen from directly above (top-down):
a long wooden counter across the top with glass candy jars on shelves behind it, a clear carpeted path running from the door at the bottom up to the
counter, four small round wooden tables with chairs, two on each side, warm lantern light, no characters, no animals, no people. 256x176."

**Customer tokens (done: 32 x 32 for the four types, and the clerk)** (a head or a round figure seen from above, **32 x 32**, transparent background; the game draws them as circles, so keep them round):
Customer tokens: `public/art/tokens/customer-<type>-<n>.png` (types faithful, traveler, merchant, bee), several variants per type, picked by customer id (`src/ui/tokenArt.ts` holds the counts). Cut from the Pixellab sheets `assets/customers.png` and `assets/bees.png` by `scripts/art/cut_token_sheets.py`; `queen.png` is stored for later, unused. No walk cycle:
the game slides and bobs them. Prompt: "{shared style words} A small round top-down token of a {type}, 32x32, transparent background, readable at a
glance": Faithful = a mouse pilgrim with a hood; Traveler = a mouse with a pointed hat and a backpack; Merchant = a mouse with a round hat and a coin
purse; Bee = a round bee with striped back and small wings.

**Clerk token** (done at 32 x 32, drawn at that size behind the counter): `public/art/tokens/clerk.png`, same style, a mouse in an apron seen from above.

**Mood marks (optional, 12 x 12 each, transparent)**: `public/art/tokens/mood-happy.png` (a heart), `mood-impatient.png` (a "!"), `mood-angry.png`.
The game shows plain symbols for now (hearts above a seated customer, a "!" when about to leave); these would replace them (wired when delivered).

Sheet prompt (one generation, 3 icons in a row, shrunk to 12 x 12 each): "{shared style words} A sprite sheet of 3 tiny mood icons in a row on a transparent background, evenly spaced, each isolated and centred: a small pink heart; a bold red exclamation mark; an angry red face with furrowed eyebrows and a small steam puff. Bold readable shapes, thick dark outline, readable at 12x12 pixels."

## 3. Item icons: 15 candies and 8 ingredients

Slot size **64 x 64** (was 96 x 96; the delivered sheets are drawn at about 64, so 32 would lose detail): icons show at 14 to 80 px in the game (mostly 22 to 44), so 96 was more than needed. Transparent background, centred object with a soft shadow, seen slightly from above. Slots are set to 64 x 64 in `content/core/artSlots.json`; display sizes that are whole multiples (16, 32, 64) look cleanest. Save as `public/art/<slot id>.png`, run `npm run art:link`.
Single-icon prompt: "{shared style words} A single {name} candy, 64x64, transparent background, centred, three-quarter top view, soft shadow."

**Status (2026-11-05): done.** All 23 icons come from the sheets `assets/ingredients.png`, `assets/candies-1.png`, `assets/candies-2.png`, cut by `python scripts/art/cut_icon_sheet.py` (palette-mapped, trimmed, centred on 64 x 64) into `public/art/<slot id>.png` and linked with `npm run art:link`. To replace one with a hand-drawn icon, save a 64 x 64 PNG over its file.

| Slot | Candy | Made from |
|---|---|---|
| `candy-candy-cane` | Candy cane | Honey |
| `candy-sunflower-brittle` | Sunflower brittle | Sunflower seed |
| `candy-sunflower-nougat` | Sunflower nougat | Honey, Sunflower seed |
| `candy-toffee` | Toffee | Milk |
| `candy-berrycorice` | Berrycorice | Blueberry |
| `candy-honey-fudge` | Honey fudge | Honey, Milk |
| `candy-honey-berry-gums` | Honey-berry gums | Honey, Blueberry |
| `candy-seed-praline` | Seed praline | Sunflower seed, Milk |
| `candy-berry-crunch` | Berry crunch | Sunflower seed, Blueberry |
| `candy-berry-cream-chews` | Berry cream chews | Milk, Blueberry |
| `candy-golden-truffle` | Golden truffle | Honey, Sunflower seed, Milk |
| `candy-meadow-bar` | Meadow bar | Honey, Sunflower seed, Blueberry |
| `candy-berry-cloud` | Berry cloud | Honey, Milk, Blueberry |
| `candy-cheesecake-bites` | Cheesecake bites | Sunflower seed, Milk, Blueberry |
| `candy-sweet-tooth` | The Sweet Tooth | Honey, Sunflower seed, Milk, Blueberry |

| Slot | Ingredient |
|---|---|
| `ingredient-honey` | Honey |
| `ingredient-royal-jelly` | Royal jelly |
| `ingredient-sunflower-seed` | Sunflower seed |
| `ingredient-dark-seed` | Dark sunflower seed |
| `ingredient-milk` | Milk |
| `ingredient-stumpsville-cream` | Cream from Stumpsville |
| `ingredient-blueberry` | Blueberry |
| `ingredient-cursed-blackberry` | Cursed blackberry |

Ingredients: "{shared style words} {name} as a small pile or a jar, 96x96, transparent background, centred." Make the three qualities readable by the
rings the game draws around the icon: do **not** paint the quality into the picture.

**Sheet prompts (Pixellab, about 256 x 128 each; shrink to 32 x 32 per icon afterwards, then `palettize.py`)**

Ingredients (8, 4 x 2): "{shared style words} A sprite sheet of 8 food ingredient icons in a 4 by 2 grid on a plain transparent background, evenly spaced, each isolated and centred in its own cell, same style and lighting: a jar of honey, royal jelly in a small pot, a sunflower seed, a dark sunflower seed, a bottle of milk, a jug of cream, a blueberry, a cursed blackberry with a purple glow."

Candies, sheet 1 (8, 4 x 2): "{shared style words} A sprite sheet of 8 candy icons in a 4 by 2 grid on a plain transparent background, evenly spaced, each isolated and centred in its own cell, same style, same lighting, three-quarter top view, small soft shadow under each. Row 1: a red and cream striped candy cane; a golden brittle slab studded with sunflower seeds; a pale amber nougat bar with sunflower seeds; a square of caramel toffee in a twisted wrapper. Row 2: a black berry-licorice twist with blue highlights; a creamy amber honey fudge square; round honey-and-blueberry gummy drops, amber and blue; a round seed praline, brown chocolate with sunflower seeds on top."

Candies, sheet 2 (7, 4 x 2, one empty cell): "{shared style words} A sprite sheet of 7 candy icons in a 4 by 2 grid on a plain transparent background, evenly spaced, each isolated and centred in its own cell, same style, same lighting, three-quarter top view, small soft shadow under each, one empty cell at the bottom right. Row 1: a crunchy berry cluster bar, blue and golden with seeds; soft cream-coloured berry chews in blue and white; a golden truffle dusted with gold sparkle; a meadow bar with honey, seeds and blueberries pressed into a rectangle. Row 2: a fluffy pink-blue berry cloud, like cotton candy; three bite-size cheesecake squares with blueberry topping; the Sweet Tooth, a glowing golden tooth-shaped candy, larger and more special than the others." If the Sweet Tooth comes out plain, regenerate it alone: the ending reuses it.

## 4. Other slots

| Slot | Size | Where it shows | Status |
|---|---|---|---|
| `map-strip` | 640 x 120 | the strip of the map in the evening | used: a wide strip of the road with the places along it |
| `scenes/map.png` | 256 x 176 | the hex-flower map in the evening | done and wired (MMSIM-35); pins per place in `places.json` |
| `worker-clerk` | 96 x 96 | the clerk's portrait | used in the clerk panel data; check before drawing |
| `shop-counter`, `station-cauldron`, `station-auto-cauldron`, `customer-*` (96 x 120) | various | older screens | no longer displayed (the scenes replaced them): do not draw |

## 5. Day transitions (optional pixel versions of the CSS placeholders)

Today a wooden sign flips Closed / Open, and a sky of gradients carries a sun and a moon, all CSS (`src/ui/PhaseTransition.svelte`). Proposed pixel versions, **to confirm before wiring** (they change the transition's look, so they go in `docs/incremental-game.md` first). All transparent PNGs, whole-number scaling:

| File | Size | What | Prompt (after the shared style words) |
|---|---|---|---|
| `public/art/ui/sign-closed.png` | 96 x 40 | a hanging wooden board with two short ropes at the top, the word CLOSED (EN) painted in the pixel font | "A small wooden shop sign hanging from two ropes, the word CLOSED painted in cream pixel letters, 96x40, transparent background, no characters." |
| `public/art/ui/sign-open.png` | 96 x 40 | same board, OPEN | same, "the word OPEN" |
| `public/art/ui/sun.png` | 32 x 32 | a round sun with a few short rays | "A round pixel sun with short rays, warm yellow and orange, 32x32, transparent background, no face." |
| `public/art/ui/moon.png` | 32 x 32 | a crescent or full moon | "A pixel moon, pale cream and soft blue, 32x32, transparent background, no face." |
| `public/art/ui/sky-night.png` | 256 x 144 | optional starry night sky, tiles or stretches | "A night sky of deep purple and blue with a few small stars, 256x144, no characters, no moon, no sun." |

**Done and wired (2026-11-05)**: `public/art/ui/sign-closed.png`, `sign-open.png` (96 x 40), `sun.png`, `moon.png` (32 x 32). The sign drops in from the top and goes back up; sun and moon ride one wheel (circular arcs). The night sky stays a CSS gradient (no `sky-night.png`). The signs say CLOSED / OPEN in English whatever the language: French boards (FERME / OUVERT) are still to make.

The word on the signs is in the picture, so the French board needs its own pair (`sign-closed-fr.png`, `sign-open-fr.png`: FERME / OUVERT), or draw them blank and let the game print the word on top.

Motion (code, no art): the sign slides in from the top and back up (no flip). Sun and moon are two sprites moved along circular arcs, the sun setting on the right-to-left arc as the moon rises on the opposite side, the reverse at dawn, instead of today's mix of arcs and straight lines.

## 6. The accounting mouse

Done: `scenes/accounting-idle.png` and `scenes/accounting.png` (208 x 128). Optional: a writing loop, 4 frames, a strip of the mouse alone at the size of its
frame over the empty desk (see `prompt-accounting-mouse.md`).

## 7. The ending sequence

Built from what exists (the workshop picture, the mice's idle strips, the Sweet Tooth candy icon), so it needs no art to run. To make it richer: a pixel version of
each mouse as a candy (`public/art/sprites/<role>-candy.png`, 64 x 64, one frame) to replace the pink fade, and a drawn Sweet Tooth. Not wired yet; say which you make.

## 8. Hex-flower map (proposed, replaces the map strip)

One pointy-top hex tile per place, transparent outside the hex, 48 x 42: a tiny landscape that fits its place, flat enough to tile edge to edge. Nine places plus the shop is ten hexes, so the flower is the centre, a ring of six and the first hexes of the second ring (19 slots, the rest stay empty or show plain meadow), and the layout can follow the campaign's world map if you share it. Prompt per tile: "{shared style words} A single pointy-top hexagon map tile, 48x42, transparent background, a top-down tiny landscape of {a mill pond / an old apple orchard / a sunflower hollow / a stump village road / a market stall / a roadside inn / a cobbled market / a pilgrim hostel / a fairground / a candy shop}, no characters, no text." Add one plain meadow tile for empty slots. Code to follow once the tiles exist (`MapStrip.svelte` draws the strip today).
