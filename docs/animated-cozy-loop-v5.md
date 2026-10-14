# The animated cozy loop (design, nothing built)

Source: brainstorm after MMSIM-21. Step 2 and 3 of the cozy loop in `quests-and-cozy-loop-v4.md` section 3 (animated mice, then take-over). The routine itself exists (MMSIM-18).

## 1. Decisions taken
- **Pixel art, CSS/DOM sprites** (sprite sheets, `steps()` animation, `image-rendering: pixelated`). No canvas, no new dependency.
- **The scene is the workshop's background**, always visible, with a maximum height (desktop and phone alike). The panels sit over it. Automating a step removes that step's panel and leaves its mouse working at its station.
- **Full automation** (routine on): only the scene and a thin HUD (coins, day, speed, stop) remain. The evening is the player's: the scene dims and the upgrade panel comes in.
- **Cozy pacing**: ingredients added one by one, a stir, into the oven, the wait, "ding", pulled out, shaped. A fast-forward (x1, x2, x4, skip).
- **Hand crafting has no mice**: the same background and anchors calibrate the drag, stir and timer interactions (a later phase).
- The phone gets the same scene in the same way, with a lower scale. It is not the primary target.

## 2. The engine waits on the animation (no spoilers)
The engine stays a pure reducer. `nextRoutineAction(c, s)` already proposes the next action without applying it, and `GameSession.tickRoutine()` dispatches it. So the **scene becomes the clock**:
1. Ask for the next action (do not dispatch).
2. **Choreography before**: play the animation derived from `(state, action)`. A `craft` action is one whole batch, and the recipe in content gives the ingredients, the steps and their order, so the sequence needs no new engine event.
3. Dispatch the action when the animation ends. The state, the stock and the coins then change, with the engine's events driving the **reaction** (crafted: candies pile on the shelf; sold: coin pop, hearts, tip; refused: the customer leaves).
4. Ask again.

Consequences: no presented-state layer is needed (the HUD always shows the true state, which only changes when the animation lands); fast-forward is a speed multiplier on the clip clock; skip is dispatching the remaining actions without clips. The one soft spoiler is the afternoon queue, which exists in the state the moment the morning ends; arrivals are walked in as an entry animation over the first beat.
Needed in code: a pure `describeBeat(c, s, a)` in `src/view/` returning the clip list for an action (role, anchor, sprite action, duration in clip units), and a scene driver in `src/ui/` that sequences the clips and calls `session.tickRoutine()` when idle. `tickRoutine` takes the animation's completion as its timer instead of the fixed 350 ms.

## 3. Stopping and taking over
- The primary choice is in the evening, next to "Go to sleep": **run tomorrow by itself** or not. The routine already waits in the evening, so this is the natural place.
- A **Stop** button in the HUD stays during the day. It finishes the clip in progress, dispatches that action, and switches the routine off, which brings the panels back (the routine switch already is the take-over). It is almost free, and it is the safety net (a wrong setting, a mis-bought helper, Perfect wanted now).
- Not planned: taking over a single step while the rest keeps running.

## 4. Scenes and anchors
Three backgrounds, one fixed size, one palette:
1. **Workshop** (kitchen): cauldron on the right, oven, shaping table, ingredient shelf, the delivery door.
2. **Counter** (shop front): counter, door, queue space, the shelf with the candy jars.
3. **Evening**: the counter without customers (or a dusk tint of the counter first; a dedicated image only if the tint looks flat).
The time of day is a CSS tint, not more art. **Anchors** are named points per background in a content row (`scenes.json`: background, anchors with x/y and sprite layer), so a front end only places things by anchor name. Stations that appear later (the Second cauldron, the oven) are anchors that are empty until owned.

## 5. Sprites as content
A `sprites.json` table: id, sheet path, frame width and height, frame count per action, fps, loop. Roles: `porter` (ingredients), `stirrer`, `baker` (oven, pull), `sculptor` (form), `clerk`, `foreman`, and the customers (`faithful`, `traveler`, `merchant`, `bee`). Actions: `idle`, `walk` (one direction, flipped by CSS), `carry`, `work` (per station: stir, shape, bake), `cheer`. Props are sprites too: the oven door, the steam, the "ding" star, coin pop, hearts. Until the art arrives the table points at placeholder sheets, as `public/art` does.

## 6. Phases
1. **Shell**: `scenes.json`, `sprites.json`, the scene component behind the workshop, anchors, placeholder sprites; the driver and `describeBeat` for `craft`, `serve`, `refuse`, `fulfill` and `endPhase`; routine paced by the driver.
2. **Cozy sequences**: the ingredient-by-ingredient flow for each station and quality, the afternoon walk-ins, the reactions to events; the speed control.
3. **Layout**: per-panel `visible` flags from the view layer by automation, full-automation mode, the thin HUD, Stop, the evening choice.
4. **Art and polish**: the Pixellab sprites and backgrounds, `prefers-reduced-motion` (no clips, straight to the result), a text alternative for the scene.
5. **Hand-crafting overlay** (later, own design): calibrate the existing craft interactions to the anchors; an animated kitchen timer where a timed click or touch gives the bonus (a new interaction, so its numbers go in content).

## 7. Pixellab brief (to adjust once you try it)
- **Scene size 256 x 144** (16:9). Integer scales fit: x1 = 256 (phone, in a 375 px column), x2 = 512, x3 = 768, x4 = 1024 (desktop, cap by the max height). **Characters 32 x 32** (about 9 mice fit across the scene width). Check what canvas sizes Pixellab accepts; if it does not do 256 x 144, make backgrounds at its nearest size and let me re-derive the numbers.
- **Palette**: fixed in `docs/art/palette.md` (32 colors, with `.hex` and PNG files). Warm and soft: cream, caramel, strawberry pink, mint, lavender, cocoa brown; no pure black (use dark cocoa for outlines); night is a cool tint, not new colors. Keep the same palette across all three backgrounds and every sprite.
- **Style prompt (backgrounds)**: "cozy pixel art, 16-bit, soft warm lighting, rounded shapes, dark cocoa outlines, clean pixels, no anti-aliasing, no text, side view, no characters, no animals, no people". Do **not** mention mice in a background prompt: the first test ("run by cute mice") painted mice into the scene. Keep the floor open: "objects only against the back wall and the sides, wide empty floor in the foreground" (the sprites need room at the anchors). Mouse prompts add the mice.
- **Style prompt (characters)**: the same words without "no characters, no animals, no people", plus "a small cute mouse character, transparent background".
- **Workshop prompt**: "{background style}. Interior of a small rustic candy kitchen seen from the front: a large copper cauldron on the right on a stone hearth, a brick oven at the back center, a wooden shaping table on the left, shelves of ingredient jars along the wall, a window, empty floor in front for characters. 256x144."
- **Counter prompt**: "{background style}. A cozy candy shop front seen from the front: a wooden counter across the middle with glass candy jars on a shelf behind it, a door on the left, a window with warm light, an open floor in front of the counter for customers. 256x144."
- **Evening**: the counter prompt plus "dusk, lanterns lit, no customers", or just tint.
- **Mice**: "{character style}. A small mouse in an apron, 32x32, front or three-quarter view, idle pose", then Pixellab's animation tools for walk (side view), carry, and one work loop per role. One base mouse with a different apron and hat per role keeps the family consistent; customers get their own look (faithful, traveler, merchant, a bee).
- **Order of generation**: the palette and one background first, then the base mouse, then the others. Re-do everything for consistency if the first mouse does not sit well on the first background.

## 8. Questions (answered: yes to the sizes, to the evening choice plus Stop, to separate baker and stirrer roles)
1. Is 256 x 144 and 32 x 32 characters a good level of detail (or do you want bigger, more detailed mice)?
2. Evening choice plus Stop: right balance, or no Stop?
3. Do you want one oven mouse (`baker`) and one `stirrer`, or fewer roles reused (a single "cook")?
