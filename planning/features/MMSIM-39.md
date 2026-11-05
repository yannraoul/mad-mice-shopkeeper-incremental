# MMSIM-39 — Explaining the rare ingredients and the code card

Motivation: the only explanation of alternates (rare ingredients) was one sentence under the shelf, and nothing said what Perfect needs. Design in `docs/incremental-game.md` ("Explaining the rare ingredients").

- IN:
  - Each rare ingredient's shelf tile has a tooltip: its chance each morning (base plus `altChance:` upgrades), how many are kept (`altStore`), that it carries over and is never sold, and the unlocked candies whose Perfect version uses it (locked candies are not named). A visible line under the shelf says the same in general terms (hover for the odds), once any rare ingredient is unlocked. `ShelfItem.help`, `CraftScene.altNote`.
  - A line under the quality buttons when a Perfect-style quality (`alternates: true`) is selected: the best ordinary recipe plus one of each rare ingredient the candy needs, which the recipe costs already show. `qualityNote`.
  - The finale card says the code can be shown again from Settings (`finale.again`).
  - EN and FR strings in the core pack.
- OUT: touch-friendly tooltips (the title attribute does not show on a phone, the visible line and the cost icons are what a phone gets), a tutorial popup the first time a rare ingredient arrives.
- Verified: `npm run check`, `npm run check:content`, `npm test` (273); in the browser (`?endgame=1`): the four rare ingredients each carry a tooltip with their own figures and candy list, and selecting Perfect shows the quality line. Not checked: phone width, how the note looks beside the surplus line.
