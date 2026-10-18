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

## 2. The counter (afternoon): a background and customer tokens

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
`public/art/tokens/customer-faithful.png`, `customer-traveler.png`, `customer-merchant.png`, `customer-bee.png`. One token per customer type, no walk cycle:
the game slides and bobs them. Prompt: "{shared style words} A small round top-down token of a {type}, 32x32, transparent background, readable at a
glance": Faithful = a mouse pilgrim with a hood; Traveler = a mouse with a pointed hat and a backpack; Merchant = a mouse with a round hat and a coin
purse; Bee = a round bee with striped back and small wings.

**Clerk token** (done at 32 x 32, drawn at that size behind the counter): `public/art/tokens/clerk.png`, same style, a mouse in an apron seen from above.

**Mood marks (optional, 12 x 12 each, transparent)**: `public/art/tokens/mood-happy.png` (a heart), `mood-impatient.png` (a "!"), `mood-angry.png`.
The game shows plain symbols for now (hearts above a seated customer, a "!" when about to leave); these would replace them (wired when delivered).

## 3. Item icons: 15 candies and 8 ingredients

Slot size **96 x 96**, transparent background, centred object with a soft shadow, seen slightly from above. Save as `public/art/<slot id>.png`, run `npm run art:link`.
Prompt: "{shared style words} A single {name} candy, 96x96, transparent background, centred, three-quarter top view, soft shadow."

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

## 4. Other slots

| Slot | Size | Where it shows | Status |
|---|---|---|---|
| `map-strip` | 640 x 120 | the strip of the map in the evening | used: a wide strip of the road with the places along it |
| `worker-clerk` | 96 x 96 | the clerk's portrait | used in the clerk panel data; check before drawing |
| `shop-counter`, `station-cauldron`, `station-auto-cauldron`, `customer-*` (96 x 120) | various | older screens | no longer displayed (the scenes replaced them): do not draw |

## 5. Day transitions (optional pixel versions of the CSS placeholders)

Today a wooden sign flips Closed / Open, and a sky of gradients carries a sun and a moon, all CSS. Drawn versions: `public/art/ui/sign-closed.png`,
`sign-open.png` (about 96 x 40, a hanging wooden board with the word drawn in the pixel font), `sun.png`, `moon.png` (32 x 32), and optionally a night sky
`sky-night.png` (256 x 144, stars). Wired when delivered.

## 6. The accounting mouse

Done: `scenes/accounting-idle.png` and `scenes/accounting.png` (208 x 128). Optional: a writing loop, 4 frames, a strip of the mouse alone at the size of its
frame over the empty desk (see `prompt-accounting-mouse.md`).

## 7. The ending sequence

Built from what exists (the workshop picture, the mice's idle strips, the Sweet Tooth candy icon), so it needs no art to run. To make it richer: a pixel version of
each mouse as a candy (`public/art/sprites/<role>-candy.png`, 64 x 64, one frame) to replace the pink fade, and a drawn Sweet Tooth. Not wired yet; say which you make.
