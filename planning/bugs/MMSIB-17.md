# MMSIB-17 — Recipes listed in content order instead of by number of ingredients

**Reported (playtest 3):** sort the recipes by the number of ingredients of the plain recipe, so Toffee and Berrycorice come before Sunflower nougat.

**Root cause:** the recipe cards followed the order of `candies.json`, where the older pairs were written before the later singles.

**Fix:** the Craft view sorts the recipes by the number of ingredients in the plain recipe (singles, then pairs, then triples, then the Sweet Tooth); the order in the content breaks ties. No data change.

**Verified:** `npm run check`, `npm test` (196, a new test for the order); build.

**Open follow-up:** none.
