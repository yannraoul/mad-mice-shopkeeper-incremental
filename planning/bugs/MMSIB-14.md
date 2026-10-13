# MMSIB-14 — Filling the cauldron took a pick-up tap and a drop tap per unit

**Reported (playtest 2):** "1 click to select an ingredient, then x clicks in the cauldron": too many taps for a decision-free step.

**Root cause:** the hand-crafting session held an ingredient (`held`) and the cauldron had to be tapped once per unit to place it.

**Fix:** tapping an ingredient on the shelf puts one unit in the cauldron straight away (`add` in `src/craft/session.ts`; the `held` state, the `tapStation` event, the armed cauldron, the dimmed shelf and the "Now tap the cauldron" hint are gone). A shelf tile is only tappable while the recipe still needs that ingredient. The cauldron is now a passive picture, ready to become a drop target for the drag and drop minigame later (`docs/crafting-rework-v2.md`, slice 5).

**Verified:** `npm run check`, `npm test` (189); browser: a Fine batch takes 2 taps for 2 honey (0/2, 1/2, 2/2), the tile disables when the recipe has all it needs, "Next: Stir" appears; the cauldron is no longer a button.

**Open follow-up:** "Fill all" and "Make another batch" (slice 1 of the crafting rework).
