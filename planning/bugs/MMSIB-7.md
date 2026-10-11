# MMSIB-7 — Royal tonic stayed craftable after its errand and nothing said nobody buys it

**Reported (playtest):** After the queen's errand, do customers ever ask for the Royal tonic? It felt like no, so the player kept making it for nothing.

**Root cause:** The recipe is errand-only (customers and contracts never ask for it, by design: `errandOnly`), but that was not shown anywhere, and the recipe stayed in the craft list for ever after the unlock.

**Fix:** An errand-only recipe can only be crafted while an errand that asks for it is under way (engine rule `isCandyCraftable`, `craftableCandies` in the UI): it disappears from the craft list once the errand is done. While available it is labelled "(errand only)" in the craft list, the stock list says "errand only, nobody buys it", and the errand text says only the queen wants it.

**Verified:** Engine tests: not craftable before accepting, craftable while active, locked again after delivery. In the browser: after accepting the errand the craft list shows "Royal tonic (errand only)"; after delivering, only "Honey drop" remains.

**Open follow-up:** A player who over-made the tonic keeps the leftover stock (it cannot be sold); a sell-back or refund was not added.

**Superseded:** by MMSIB-9 (the author preferred bee customers buying the tonic over restricting it).
