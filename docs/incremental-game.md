# Incremental game: spec in progress

Status: brainstorm (no code until this is locked). Started 2026-10-08.

## Locked
- Platform: web, works on PC and phone.
- Visuals: yes, with placeholders in the final format (fixed slot sizes, swappable files, no code change).
- Monetization layer (fake IAP + "you would have spent X" end screen): decide later, not v1.
- Core loop: ACTIVE play, long sit-downs. Idle / "while you're away" progress is OUT (decided 2026-10-08).
- Progression: a proper skill tree (reference: games tested on the RealCivilEngineerGaming channel).
- Core loop shape: craft + serve. Two linked loops: make candy, then sell it; each feeds the other.
- Skill tree (proposed, pending OK): branches per area (Kitchen, Shop, Temple/Hive), repeatable capped nodes inside each branch, a few cross-branch links.
- Audience: me, then my players as a surprise at the end of the campaign. Possible preview builds for players WITHOUT the true ending until the campaign is over.
- Content layer: all names, text, art and the ending live in swappable data files (same principle as image slots). Preview build ships without the ending file; final build adds it. Vault names are used on purpose (custom to the campaign). Only names that come from the published module (e.g. Brother Glace) would need swapping for a public release; fine for table-only.
- Theme: shopkeeper incremental set in the Mausritter / Mad Mice world: the Cult of Sweet Tooth candy enterprise (bees + mice, honey, cauldron in an abandoned shack, "perfect candy" from dark sunflower seeds, goal of summoning Sweet Tooth). Theme only: no shared code or data with the vault.
- IP note: most names are the user's own. Module-derived names/text/art (e.g. Brother Glace) to be swapped only if ever shared publicly.

## Architecture principle: modular and scalable (decided 2026-10-09)
- Everything that can grow is an entry in a data file, never a branch in code: candy types, quality tiers, stations (cauldron, oven...), recipes, worker types, customer types, shops, tree nodes, errands, text, art slot ids.
- Quality is an ordered integer scale, not three hard-coded names. v1 ships 3 tiers; finer steps later = more data rows.
- Stations and shops are instances of a type (n cauldrons, n shops), never singletons.
- Future examples this must absorb without engine changes: more cauldrons, side shops, finer quality steps, candy cane / lollipop recipes, new worker types, new customer types.
- Guard against over-engineering: build the data-driven structure, ship v1 content small. If a new thing needs code, the structure is wrong.

## Loop structure (contracts + forecast + unknown walk-ins APPROVED 2026-10-09; rest proposed)
- Day cycle, player-ended phases (no timers): Morning = craft, Afternoon = serve, Evening = spend + report.
- Information flow (fixes "morning output tells me how far I can go"):
  - Morning board shows CONTRACTS (known orders with deadlines, can span days) and a rough WALK-IN FORECAST (e.g. busy / quiet, mostly pilgrims / mostly travelers). Never exact.
  - Morning is a bet: allocate the day's honey and ingredients across candy types and qualities. Contracts are the safe bet; walk-ins are the gamble.
  - Afternoon: actual customers differ from the forecast. Each has a want, patience, budget and pickiness. Stock carries over to the next day.
- Afternoon is active because each customer is a decision, not a throughput number: serve now vs make them wait, match quality to pickiness, substitute, price tier, upsell, refuse. Employees take customer types the player has delegated.
- Day limit: honey delivered each morning is the supply cap (ties to production growth). The afternoon ends when the queue is empty.
- Milestones: a "week" has a revenue target (stage model, like tower-defense levels). No fail state: falling short means the week repeats with all tree progress kept. Reaching the target opens the next stage.
- Craft = ingredient-picking steps (pick up honey / other ingredient, put in cauldron, stir, oven, form candy). Limits: honey and ingredient supply, cauldron count/size.
- Delegation rule: a recipe must be crafted by hand for 1-2 rounds before an employee can be trained on it. Tree nodes progressively automate steps (e.g. a second automated cauldron).
- Evening: spend on the skill tree, read the journal line, and (later) allocate stock to other shops.
- Expansion: v1 is one shop, but the data model has "shop" from the start. Later shops are run by trained employees and resolve automatically from stock sent + employee skill; the evening shows a one-line report per shop. A map strip with locked nearby places (from the campaign) can appear in v1 as pure flavor.
- Risk: manual craft steps must stop being chores by about the 50th repetition, so automation has to arrive early and in small steps.

## v1 customers and quality (APPROVED 2026-10-09)
- Quality tiers: 3 (Plain, Fine, Perfect). Perfect needs the rare dark seed, ties to the campaign's perfect candy.
- Customer axes: wants (candy type), min quality, patience, budget. Four numbers per customer, nothing more in v1.
- Customer types (3): Faithful (patient, low budget, loyal, any quality), Traveler (mid budget, wants variety, moderate patience), Merchant/Noble (high budget, picky, impatient).
- Contracts: a Merchant/Noble-type buyer with a quantity, quality and deadline.
- Held for v1.1: bee customer (variety), rival-faction spy (flavor).

## Proposed v1 skill tree (pending OK). R = repeatable capped, U = unlock, A = automation
### Kitchen
- R Honey yield (more honey per morning)
- R Cauldron size (more candies per batch)
- A Second cauldron, automated (makes Plain on its own)
- U Oven upgrade: unlocks Fine quality
- U Dark seed garden: unlocks Perfect quality
### Shop
- R Counter space (more waiting customers)
- R Patience (customers wait longer)
- U Second recipe, third recipe (each needs 1-2 manual rounds before delegation)
- A Hire a clerk (serves Faithful customers)
- U Contract board (unlocks Merchant contracts)
### Temple / Hive
- NEW (replaces the missing play-changing node): Errands board. Scripted story errands that use the shop's existing verbs and give PERMANENT rewards (no temporary boosts, no random punishments, no new minigames in v1).
  - Example: Queen is sick -> a special medicine recipe crafted with the normal ingredient-picking steps -> permanent honey yield step.
  - Example: slow the rival hive -> send employees on a mission (assign, result after 1-2 days based on staff skill) -> rival pressure reduced for good.
  - v1: about 3 scripted errands. v1.1: random errands. A minigame only if one proves worth its cost.
  - Errand text lives in the content layer. Errands touching live campaign plot are excluded from player preview builds.
- R Faithful (more regular customers)
- R Hive bond (more daily honey)
- U Rank milestones (week targets open the next stage)
- U Map strip: first nearby place unlocked (flavor, v1)
- U Rival pressure: a hive splinter reduces honey until handled (no fail state)

## Concepts kept from the campaign (inspiration only, not rules)
- Growth axes to scale: number of shops, number of faithful (congregation), production (honey, candy).
- Rank/milestone track toward a final goal (the summoning), as a progression spine.
- Rival pressure on supply (no fail state).
- NOT carried over: vault stats, item effects (e.g. STR/Bloated), rank names and rule details. The player runs the shop and never eats the candy, so those mean nothing here.

## Design constraints from the dump
- No gating, no real purchases, no punishing failure state.
- Spaceplan feel: minimal UI, few tabs, journal/narrator lines, "I can put it down" pacing.
- Cheapest-first upgrades must stay relevant (low tiers must not become obsolete).
- Gauges to fill, skill tree with repeatable upgrades.
- Start simple; content can be added later.
- Possible inspirations: Clumsy Ninja (character grows from clumsy to skilled), Melvor Idle (management), TFT-style "3 of a kind merges".
- Typing mechanic: only if PC-first; web makes it optional.
- Gacha: mixed feelings, not decided.

## Open questions
- Customer axes (what makes customers differ)
- Quality system for candies (how many tiers, what raises quality)
- Whether the weekly target model feels right
- Prestige: yes/no in v1

## Proposed technical stack (pending OK, 2026-10-09)
- Web app, static hosting (no backend: no idle, no accounts, no multiplayer). Unlisted URL for player previews.
- TypeScript + Vite + a reactive UI framework (Svelte preferred; React acceptable). DOM/CSS UI, not canvas or a game engine: this is a UI-heavy, number-heavy game and responsive PC + phone layout comes free. Image slots are plain <img> with fixed sizes.
- Engine = pure TypeScript with no UI imports. Day cycle as an explicit state machine (morning / afternoon / evening).
- Content = JSON files validated by a schema (e.g. zod) at build/load time. Core pack + optional packs (ending, errands tied to live plot). Preview builds EXCLUDE packs at build time (anything shipped to the browser is readable).
- Saves: versioned schema in localStorage/IndexedDB, with export/import string as backup.
- Balance: headless simulator that plays N days with a simple bot and reports revenue curves (same idea as the TCG bot-testing note). Engine unit tests with Vitest.
- Touch input: tap-to-select / tap-to-place for ingredient picking (no drag-and-drop dependency).
- Not chosen: Godot web export (heavy for UI-first game; also the break from Godot), Flutter web (possible if staying in Dart matters, but heavier and less suited to content-as-JSON pipelines).
- Open: text language (FR/EN/both). Keep all strings in content files so translation is data, not code.
