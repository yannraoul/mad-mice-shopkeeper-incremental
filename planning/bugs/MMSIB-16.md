# MMSIB-16 — Craft shelf: base and alternate side by side; recipe cards too big

**Reported (playtest 3):** the shelf should be responsive: rows of two put the basic ingredient on the left and its alternate on the right; rows of four put each basic on top and its alternate underneath. The 15 recipes take a lot of space: a compact name layout and a summary of the ingredients.

**Root cause:** the shelf was a flat list (no notion of an alternate belonging to a base) and each recipe card was a 96 px picture with its name, a text cost and a price stacked.

**Fix:** (1) The view groups the shelf into base and alternate pairs (`shelfPairs`, `shelfHasAlternates`). The layout answers to the width of the shelf (a container query): before any alternate exists the bases sit two to a row; with alternates on a narrow shelf (two bases) each row is a base on the left and its alternate on the right; with three or more bases on a wide enough shelf (a 370 px column on desktop, a phone's full width) each base is a column with its alternate underneath, up to four columns. An alternate still locked leaves an invisible placeholder so rows stay aligned. (2) Recipe cards are 60 px tall: a 44 px picture, the name on its own line, the ingredients as small icons with a count (the text cost is still the tooltip and the screen reader text) and the price on the right; they flow in as many 190 px columns as fit (three on desktop, two on a phone), so the 15 recipes take about 355 px instead of about 600.

**Verified:** `npm run check`, `npm test` (195), build; browser at 1280 px (early: Honey next to Sunflower seed; two pairs: Honey | Royal jelly over Sunflower seed | Dark seed; all eight: four columns, alternates under their bases) and at 375 px (four columns, no horizontal overflow, recipes two to a row).

**Open follow-up:** recipes could be grouped by their number of ingredients (singles, pairs, triples) with a filter; the picture of a recipe may not be needed at this size once real art exists (an icon row may do).
