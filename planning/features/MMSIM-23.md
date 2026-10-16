# MMSIM-23 — The animated workshop, part B: the workshop as the main screen

Motivation: the scene sat above a long form and pushed the batch controls below the fold; toggling a helper did not visibly change the scene. See "Workshop as the main screen" in `docs/incremental-game.md`.

- IN:
  - `scenes.json` gets `zones` (step, rectangle in scene pixels); the left mouse now does the `pull` step (it was the `form` sculptor, id kept as `sculptor`). Content check: a zone's step must exist.
  - `buildSceneView` returns the zones (only for steps whose helper is hired) with label, on/off, the actor shown on hover and the `setStepMode` action behind a click.
  - `Scene.svelte`: hover/focus highlight, click toggles, the mouse pops in (also as a preview on hover while the step is by hand), a persistent on/off dot on touch screens.
  - `Craft.svelte`/`CraftScreen.svelte`: top bar (quality, start), scene with the recipe picker on its right, the ingredient shelf as a row, today's board and errands in a closed side drawer. The helper chips are replaced by the zones.
- Layout rows: title and board button; qualities and start; the scene with the ingredient shelf under it, and the recipes ("Recipes", scrolling within the scene column height) on its right. Zones cover the place and the mouse; pixel glints twinkle in them while nothing is hovered.
- Batches the player starts are played on the scene like the routine's: `dispatchPlayed` (`src/ui/game.svelte.ts`) plays each helper's clip in turn, then applies the craft; `sceneClock.busy` blocks a second start (and holds the routine) meanwhile. The mice that are not working fade to 30 %. The routine switch is now a real switch (track and knob) with centered text.
- Later ideas from the same playtest (accounting mouse, counter scene, day transitions) are in `planning/BACKLOG.md`.
- OUT: hand-crafting on the scene, the fifth mouse, real art, the cauldron overlay beyond batches and contents.
- Verified: `npm run check`, `npm test` (scene tests: zones, preview mice, the pulling mouse), `npm run check:content`. In the browser (dev URL with all helpers): clicking a zone toggles its step and removes/restores its mouse, hovering a by-hand zone previews the mouse, the board drawer opens, at 375 px no horizontal overflow. Not done: screenshots of the design brief not regenerated, light/dark not compared, hand-crafting still uses the step track beside the scene.
