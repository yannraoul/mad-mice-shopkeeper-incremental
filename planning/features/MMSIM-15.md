# MMSIM-15 — Crafting helpers: fill all, make another batch, mice and machines that take steps over

Motivation: playtest 2 found hand crafting repetitive ("felt redundant"). Design in `docs/crafting-rework-v2.md` (slices 1 and 2; the tap-to-add fix of slice 0 was MMSIB-14). The economy is untouched: helpers remove hand work, they never make more candy.

- IN:
  - **Fill all**: a button on the bench puts every unit of the recipe in at once (tapping an ingredient still adds one).
  - **Make another batch**: after a batch the recipe, quality and station stay selected and the start button reads "Make another batch"; with every step automated that is one tap per batch.
  - **Crafting steps are content** (`craftSteps.json`: fill, stir, bake, pull, whisper, shape), each with an owner (mouse or machine), a helper name and the unlock that lets it be automated. Content validation: every step the game can ask for has a row, every helper's unlock is granted by an upgrade.
  - **Five helpers, bought in the kitchen branch**: Porter mouse (fills, 90 coins, stage 2), Stirrer mouse (160, stage 3), Sculptor mouse (shapes, 260, stage 4), Oven timer (220, needs the oven, stage 4), Pulling motor (420, needs the pulling machine, stage 5). The whisper of a Perfect batch has no helper: it always stays with the player.
  - A step with a helper is **skipped by itself** when a batch starts: the cauldron is filled, the stir and shape are done, and a batch whose every step is covered is crafted the moment Start is pressed (a Fine batch still waits for the oven unless the oven timer is hired). The step track shows who did what ("Stirrer mouse" in green).
  - **Take a step back by hand**: the Craft form lists each hired helper as a chip ("Stirrer mouse: helping" / "by hand"); the choice is remembered (`State.handSteps`, engine action `setStepMode`). Save version 8 with a migration.
  - Strings EN/FR; the bots buy the new upgrades; the catalog gets the new rows.
- OUT: the played versions of the steps (minigames, MMSIM-17); the Second cauldron's order book and delivery mouse (MMSIM-16); animated mice in the background; wages.
- Decisions taken where the design left room:
  - Until the minigames exist the two states of a step are "a helper does it" and "by hand" (a tap); the doc's "Auto / Play" becomes that.
  - A newly bought helper starts switched on: the player bought it to be helped.
  - The toggle lives on the Craft form (chips), not on the step track mid-batch, so a batch in progress cannot change under the player.
  - Helper prices are guesses; the bots do not feel hand effort, so the balance run only sees the coins they cost.
- Verified: `npm run check`, `npm test` (205, a new `src/craft/helpers.test.ts`), `npm run check:content`, `npm run balance` (unchanged pacing); browser: with three mice hired a Plain batch is made by Start and again by "Make another batch", a Fine batch stops at "Next: Bake in the oven" and the track names the mice.
- Open decisions: how much hand work a day should be (the effort metric of the design doc is not built); mice as pictures on the screen; whether a helper should cost wages.
