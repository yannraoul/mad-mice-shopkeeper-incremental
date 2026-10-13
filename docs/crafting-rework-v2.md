# Crafting rework (design, not built yet)

Status: direction agreed after playtest 2 and the review answers below; numbers and the minigame rewards are drafts. The
rework does not change the economy by itself: it changes how much hand work a batch costs and what that work is.

## Decisions taken in review

- Both **machines** (oven, pulling machine) and **hired mice** (hands) automate steps.
- A batch made by hand can earn an extra candy; the rewards below are per step.
- **Multi-batch** uses up the day's batches (3 a day). Instead of a quantity stepper first, the panel gets **"Make another
  batch"**: when a batch is done, the recipe, quality and quantity stay selected and one tap starts the next, instead of
  falling back to the default state. With every step automated that is one tap per batch.
- The **auto cauldron is an upgrade of the Second cauldron**, with a preferred candy (details in slice 4).
- **The content fill (milk, blueberries, all main ingredients) comes first**, the crafting slices after it.
- Each step has its own minigame and its own **auto / play toggle**, remembered, available once that step can be automated.

## How crafting works today (facts)

- One hand batch = pick an ingredient, tap the cauldron once per unit (fill), then the steps in order: Stir, the extras of
  the quality (Bake, Pull, Whisper), Shape. A plain candy cane is about 4 taps, a Fine one 5, an Excellent nougat 8 or more.
  Only the last step sends the engine action `craft {station, candy, quality}`; the steps live in `src/craft/session.ts` and
  `src/view/craft.ts` (`craftReduce`), the engine never sees them.
- A hand cauldron makes 3 batches a day, each of `capacity` candies. The Second cauldron makes 2 batches of plain candy cane
  every dawn. The clerk sells (to Faithful) once taught a recipe; he does not craft.
- The bots call `craft` directly, so the balance numbers say nothing about how tiring a day is.

## What is wrong

1. The same taps every batch; by batch 20 it is a chore and the real decision (what to make) is buried.
2. Filling is the most repetitive part (select an ingredient, then one tap per unit) and carries no decision.
3. Upgrades add output or options, never change how the hands work.
4. After each batch the panel resets, so making three of the same thing means choosing it three times.
5. No play in the play.

## Principles

- **Output does not depend on effort**, except for the small optional bonuses and risks of the played steps.
- **Every step has an owner who can take it over** (a machine or a mouse), so the late game is a planning screen.
- **Playing is a choice, never a requirement**: once a step can be automated the player picks Auto or Play; before that it
  is a plain tap. No reward is locked behind a gesture that has no tap version.
- Anything that can grow is a content row (steps, workers, upgrades), never a code branch; the engine stays pure.

## The slices

### 0. Tap an ingredient to add it (tiny, can go now)
Tapping an ingredient on the shelf puts one unit in the cauldron straight away: no "pick up, then tap the cauldron", no held
state. The held/armed states and the hint texts go. This is `craftReduce` and the Craft view only; the cauldron stays a
passive target for the later drag and drop.

### 1. Autofill and "Make another batch"
- **Autofill**: a "Fill all" button (and later the Auto toggle of the Fill step) puts every unit of the recipe in at once.
- **Make another batch**: after the shaping step the result line stays and the panel keeps its selection with a "Make another
  batch" button; the batch counter shows what is left today. Changing recipe or quality is still one tap.
- Engine unchanged (a batch is still one `craft` action).

### 2. Steps become content, each with an auto / play toggle
A table replaces the hard-coded `stir`/`form` and the quality extras:

```
craftSteps.json: { id, nameKey, owner: "machine" | "mouse", automatedBy: <unlock id>, minigame: <id> }
```

| Step | Owner | Automated by | Minigame (slice 5) |
|---|---|---|---|
| Fill | porter mouse | a hired mouse | drag and drop ingredients |
| Stir | stirrer mouse | a hired mouse | drag a spoon through the cauldron |
| Bake | the oven | an oven timer | active reload: take the tray out in time |
| Pull | the pulling machine | a motor | pull and release without breaking the candy |
| Shape | sculptor mouse | a hired mouse | taps on the moulds |
| Whisper | the cauldron | the magic cauldron's last quest | an edge case: a ritual, kept as a single tap for now |

Before its unlock a step is a plain tap (hand). Once unlocked, clicking the step in the track toggles **Auto** and **Play**; the
choice is remembered per step. Auto skips the step (a one line "the mouse stirs" in the batch panel); Play runs its minigame.
Mice are `workers.json` rows with `does: [step ids]`; machines are upgrades. Prices are one-off, no wages.

### 3. Rewards and risks of the played steps
A played step ends with a result (miss, ok, great). Draft rewards, per batch, in candies, with a cap so the total from all
steps stays within -1 to +1 per batch (a content value):

| Step | Great | Miss |
|---|---|---|
| Fill | nothing (it replaces clicking) | nothing |
| Stir | nothing, or a slightly better chance at a tip later | nothing |
| Bake | +1 candy (perfect timing) | burnt: -1 candy |
| Pull | +1 candy (precise, nothing broke) | a candy breaks: -1 candy |
| Shape | +1 candy if the whole combo lands | nothing |

The batch's engine action takes a `flourish` of -1, 0 or +1 (the sum, clamped), checked against the content cap, so bots and
tests pass 0 and the game stays deterministic. A batch is never below one candy.

### 4. The Second cauldron grows up
- **Base** (today): every dawn it makes plain candy cane with the day's honey.
- **Order book** (upgrade): it first works on what is being asked right now (an open contract, a delivery errand) with the
  cheapest quality that qualifies, and makes the **preferred candy** (chosen on the Craft screen, default candy cane) with
  what is left. The order lives in the state; the content keeps the default (save version bump).
- **Delivery mouse** (upgrade): when a batch finishes that completes an open contract or errand, it is delivered by itself.
With the order book and the delivery mouse the player's day is: look at what is wanted, make the special things by hand.

### 5. The minigames (last)
Warioware-sized, a few seconds each, mouse and touch: drag the ingredient icons into the cauldron (one by one, or select all
of one type and drag once), drag a spoon along a circle path, stop a moving marker inside the green zone to take the tray out
(active reload), pull and release a candy with a tension meter that must not hit red, tap the moulds as they light up. Each has
a generous tolerance; every step keeps its Auto option, and Settings has "simple mode" (everything is a tap, no minigames).
Animation (steam, stirring, drops) is fed by the same steps.

## Order and numbering (proposal)
1. **Quick fix batch**: slice 0 (tap an ingredient to add it).
2. **MMSIM-14**: the content fill: milk and blueberries with their alternates (cream from Stumpsville, cursed blackberry), their
   narrative quests that raise the supply, the other 12 candies (pairs, triples, the Sweet Tooth), the final quest becomes
   "3 Perfect Sweet Tooth", the stage schedule gets what each stage opens.
3. **MMSIM-15**: slices 1 (Fill all, Make another batch) and 2 (steps as content, toggles, mice and machines).
4. **MMSIM-16**: slice 4 (order book, delivery mouse).
5. **MMSIM-17**: slices 3 and 5 (minigames with their rewards and risks).

## Effort metric for balance
The balance harness gets a "hand actions per day" figure: steps a human would do given the automation owned. Target to tune: about
25 taps at the start, about 12 after the first mouse, one or two taps per batch type at the end, never zero (the choice stays).

## Risks
- A skipped step must not feel like lost content: show who does it.
- The order book spends ingredients the player may have wanted: it runs at dawn, as today, and the shelf shows what it will use.
- Minigames on a phone: a big touch area and generous tolerance; simple mode is a first-class way to play.
- Risk and reward must not punish: a miss costs at most one candy and the player can always switch the step back to Auto.

## Open questions
1. Are the draft rewards right (extra candy for Bake, Pull and Shape; the risk of losing one), or should Bake raise the selling
   value of the batch instead (needs a per batch value in the stock, a bigger change)?
2. Stir has no reward in this draft: is that fine, or should it do something?
3. Should "Make another batch" also remember the last quantity if a stepper is added later?
4. Mice appear as workers next to the clerk: do you want them on the Serve/Craft screen with art, or only in the upgrade list?
