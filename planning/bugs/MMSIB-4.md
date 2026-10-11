# MMSIB-4 — Fine candies cost the same ingredients as Plain, so Plain was pointless

**Reported:** Plain and Fine recipes use the same number of ingredients; once Fine is unlocked there is no reason to ever make Plain.

**Root cause:** `fine` had no cost beyond an extra oven step (labour, not a resource), while selling for 1.6x. That broke the design rule "cheapest-first upgrades must stay relevant" (`docs/incremental-game.md`).

**Fix:** Fine now needs +1 honey per batch (`extraIngredients` on the `fine` quality row): 3 honey for 4 candies instead of 2. Per honey, Plain earns about 10 coins and Fine about 10.7 when sold at full price, but only 8 when sold to a budget-6 Faithful customer (see MMSIB-3), so Plain stays the efficient choice for cheap customers and Fine is for Travelers, Merchants (who require it) and contracts. Perfect still costs a dark seed.

**Verified:** `npm test` 85 passing (Fine needs 3 honey in the craft session; supply 4 -> 1 after a Fine batch, 4 -> 2 after a Plain batch). In the browser a Fine batch left 1 honey. `npm run sim` still plays through all stages.

**Open follow-up:** Numbers are placeholders for the M6 balance pass; Perfect (honey 2 + a seed for 3x price) may still dominate Fine, and the +1 honey is a first guess, not a tuned value.
