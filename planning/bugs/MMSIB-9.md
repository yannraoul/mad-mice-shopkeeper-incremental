# MMSIB-9 — The royal tonic had no customers; bees should come for it after the queen's errand

**Reported (playtest):** Keep the idea of an errand unlocking a new recipe; rather than restricting the tonic (MMSIB-7), let bee customers sometimes come for it once the quest is done.

**Root cause:** MMSIB-7 treated the tonic as a one-off errand item (craftable only while the errand ran). That made the unlocked recipe a dead end instead of a reward.

**Fix:** The restriction from MMSIB-7 was reverted: the tonic is a normal recipe, unlocked when the errand is accepted. New data-driven customer fields: `unlock` (a customer type appears only once that unlock is owned) and `onlyWants` (it asks only for those candies); candies gain `exclusive` (replaces `errandOnly`: regular customers and contracts never ask for it). New customer type **Bee** (budget 10, patience 5, weight 1.5 against 5 / 3 / 2 for the others, unlock `bee-customers`, wants only the Royal tonic), granted by the queen errand's reward. The tonic's price is 10 (honey 2 + a dark seed per batch of 4), so it is a pleasant bonus rather than the best product. The bots now craft whatever is in demand, so they make the tonic once bees exist.

**Verified:** Engine tests: the tonic stays craftable after the errand; no bee before the errand is done (even with the recipe unlocked); afterwards bees appear sometimes (fewer than half of customers over 40 seeds) and only ever ask for the tonic while regular customers and contracts never do; a bee pays 10 for a tonic. Browser: after accepting and delivering the queen's errand the craft list still has "Royal tonic", and a "Bee" card ("Wants Royal tonic, budget 10") appeared at the counter and bought one for 10. `npm run balance` guards pass.

**Open follow-up:** Bee frequency and the tonic price are first guesses (bee weight 1.5, price 10); the bee has no art slot of its own yet (the card shows the tonic image); the old errand-only labels and strings were removed. MMSIB-7 is superseded by this entry.
