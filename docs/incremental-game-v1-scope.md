# Candy shop incremental: v1 scope and milestones (working title)

Status: DRAFT for freeze, 2026-10-09. Source of truth for decisions: `incremental-game.md`.

## One-paragraph pitch
An active shopkeeper incremental set in the Mad Mice world. Each day you craft candy from honey and other ingredients (morning), serve a queue of customers with different tastes and budgets (afternoon), and spend what you earned on a three-branch skill tree (evening). Contracts and a rough forecast tell you what to expect but never exactly, so each morning is a bet. You start doing everything by hand and end up managing workers and extra shops. Web, PC and phone, French and English, no idle play, no purchases, no fail state.

## Definition of done for v1
- Playable end to end through about 3 weekly stages, in FR and EN, on PC and phone.
- Day cycle works: morning craft, afternoon serve, evening spend.
- 3 quality tiers, about 3 candies, 3 customer types, contracts, one automated cauldron, one clerk.
- Skill tree with 3 branches of about 5 nodes.
- 3 scripted errands, a map strip with locked places, rival pressure.
- Weekly revenue target; falling short repeats the week with progress kept.
- Save/load with export string. Placeholder images in final-format slots.
- Preview build that excludes the ending pack and live-plot errands.
- A headless simulator that shows the revenue curve across the whole run.

## Not in v1
Bee customer, rival-faction spy, random errands, minigames, extra shops beyond the data model, finer quality tiers, extra candy types beyond 3, prestige, fake-purchase layer, offline/idle progress, accounts, multiplayer.

## Milestones (each self-contained and testable)
- M0: repo, TypeScript + Vite + Svelte, content schema, FR/EN string check in the build.
- M1: engine only, no UI. Day state machine, one recipe, quality tiers, customers, orders, revenue, headless simulator, tests.
- M2: craft screen with tap-to-place ingredient steps and image slots.
- M3: serve screen with queue, decisions, and the clerk automation.
- M4: evening screen: skill tree (3 branches), journal lines, save/load.
- M5: weekly stages, targets, errands, map strip, rival pressure.
- M6: balance with the simulator, personal playtest, preview-build pipeline.

## Rules for the build (from the crawler lesson)
- No gameplay or style changes after this freeze without writing the change here first.
- Placeholders use final slot sizes. Nothing is retrofitted.
- Each milestone ends with something you can play or run.
- Add to the content files, not the engine, whenever possible.
