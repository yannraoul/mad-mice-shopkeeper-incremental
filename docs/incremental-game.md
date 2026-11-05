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

## Workshop as the main screen (decided 2026-10-16, MMSIM-23)
- The pixel-art workshop is the main block of the morning screen: where everything happens, not a banner above a form.
- **Zones.** Hovering (or focusing, or tapping on a phone) the scene highlights the areas that toggle a crafting step between "a helper does it" and "by hand"; the matching mouse shows as a preview (no entrance animation since MMSIM-36). Only steps whose helper is hired have a zone. Zones: fill = sacks at the bottom; stir = the cauldron; oven = the hearth; pull = the left work table (the left mouse, formerly the "sculptor", is now the **pulling mouse** that rolls and stretches the candy paste); form (shaping into the final candy) = the rows of jars with candies at the top right, no mouse yet. The scene has 4 mice for 5 steps; the missing one is a later art task.
- **The cauldron in the art is the anchor of the cauldron station**: the batches left and what is in the pot are drawn over it.
- **Where to click (MMSIM-37).** The white glints alone do not tell a new player that a zone can be clicked. Three layers: (1) every hired mouse is always on the scene; one whose step is by hand sleeps (half opacity, desaturated) and wakes with the work preview on hover, so a zone is never an empty spot; (2) a bobbing arrow in the accent colour over each zone the player has never clicked, hidden on hover and for good after the first click on that zone (kept per browser in `localStorage`, not in the save); (3) when a helper is hired, its zone pulses and shows its label for 8 seconds (no call-out for zones that were already there when the game loaded). The glints stay as the quiet ambient layer. Not done: a toast or a sound.
- **Layout (desktop).** Top bar above the scene: quality and "start a batch". The scene in the middle. On its right: the recipe picker (instead of today's board and errands). Under it: the ingredient shelf as a row. Today's board and the errands move into a side drawer, closed by default (a bottom sheet on a phone).
- **Phone.** Same order, the scene scaled down, the recipe list under it; zones are tap targets and show a persistent on/off dot (nothing relies on hover).
- Not in this part: hand-crafting on the scene itself (the step track stays under the scene), the fifth mouse, real art.

## Late game and the counter (decided 2026-10-16, MMSIM-24)
- A kitchen node, **An extra batch** (one level, 6,000 coins), adds a fourth daily batch to the hand cauldron. The last reputation level (9,000) took days of idle waiting for a player who had finished everything.
- A customer nothing in stock can satisfy **leaves on their own after 2 turns** (a turn = a customer served or turned away), at no patience cost to the others; it counts as lost. **Turning someone away no longer costs the others a patience either.** Serving still does.

## The shop rating (decided 2026-10-17, MMSIM-27)
- A rating from 0 to 100 (50 at the start) moves prices by at most **plus or minus 10 %**: at 50 prices are unchanged, falling to -10 % at 10 and below and rising to +10 % at 90 and above (`ratingMid` 50, `ratingRange` 40, `ratingSwing` 0.1). It applies to what customers pay at the counter (not contracts, not surplus), on top of the Reputation upgrade.
- Each afternoon's satisfaction score is: the sum of how happy each served customer was (hearts out of 3) divided by everyone who came and went (served, turned away, impatient, still waiting at closing). Anyone who goes unserved counts for nothing, so a varied stock matters. The rating moves 30 % of the way to the day's score (`ratingSmoothing`), so one bad day does not undo a good week. No fail state: the worst case is -10 %.
- Closing the shop early stays possible: the customers who were still waiting just count as unserved.

## The accounting mouse (decided 2026-10-17, MMSIM-28)
- A Shop-branch upgrade, **Accounting mouse** (one level, 1,500 coins, needs the foreman mouse), makes the daily **routine** run the evening too: it buys the cheapest upgrade the shop can afford, again and again until none is affordable, then ends the day. There is no separate switch: the one Routine switch automates the whole day, so a player who has automated everything also gets the "go to sleep" for free, and turns the routine off to take over.
- It only buys upgrades (not map places) and ignores priorities: cheapest first. The picture on the evening journal card shows the mouse at work while it is hired and the routine is on, and the empty desk otherwise.

### Three routine switches (decided 2026-10-18, MMSIM-29; amends the accounting mouse above)
- The accounting mouse's work went by too fast to see, and one switch did too much. The routine now has **three switches**, each shown once its hire is made: **Foreman** (needs the foreman mouse) runs the morning and the afternoon, cooking then serving; **Accounting** (needs the accounting mouse) buys the cheapest affordable upgrade in the evening; **Auto sleep** (needs the foreman mouse) ends the evening by itself when the evening's work is done. Each works alone: auto sleep with accounting off just skips the evening.
- The accounting mouse takes **one beat per upgrade it buys** (1.4 s, `accountingStepMs`; the purchase lands when the beat ends) and **at least 2 s** (`accountingMinMs`) over the books before the shop sleeps, even with nothing to buy. The beats are timers for now; the animation comes with the art.

## The ending sequence (decided 2026-10-18, MMSIM-31)
- When the final offering (three Perfect Sweet Tooths) is delivered, a **one-time full-screen sequence** plays over the workshop, then the shop **keeps running** (the late game stays playable). It can be **replayed from Settings**. It can be skipped (Skip, Escape) and the beats also advance by click or by themselves.
- Placeholder look, no new art: the workshop darkens, the offering (the Sweet Tooth candy icon) glows on the cauldron, a flash, then every mouse turns pink and becomes a candy, one line of text per beat (title plus up to six lines, the last one telling the player the shop stays open). The lines are in the optional **ending pack** (`ending.title`, `ending.beat.1` to `.6`); the author rewrites them. Without the pack (the preview build) the sequence does not exist and nothing is lost.
- State: `endingSeen` (a finished game that never saw it plays it once on the next load).
- **The preview build's end: a finale code (decided 2026-11-05, MMSIM-38).** The preview build has no ending pack, so when the campaign is completed it shows a card instead: no story, only "the tale is not over", a **name** field and a **code** (`XXXX-XXXX-XXXX-XXXX`, Crockford base32, 80 bits) with a Copy button. The player sends the author the name and the code; the author checks them with `npm run verify-code -- "Name" CODE`. The code is 42 bits of payload (the day of the finish, 16 bits of the run's seed, lifetime revenue in hundreds of coins) and 38 bits of HMAC-SHA256 of the payload and the normalised name (lowercase, no accents, spaces collapsed). So it proves the game was played to the end, ties the code to one name (a code passed to someone else fails), and is unique per run. The secret is `VITE_FINALE_SECRET` in `.env.local` at build time; because it ships in the bundle, a determined reader can forge codes: it stops guessing and sharing, not reverse engineering. The reward for a valid code is decided at the table, outside the app. State: `seed` and `finale` (day and revenue at completion). The card shows once (`endingSeen`) and can be reopened from Settings.
- **Explaining the rare ingredients (decided 2026-11-05, MMSIM-39).** The alternates (rare ingredients) were only explained by one sentence under the shelf. Now: (1) each rare ingredient's tile has a tooltip and the shelf has a visible line saying how it works (a chance each morning, kept up to the store size, carried over, never sold, and which unlocked candies use it in their Perfect version); (2) when a Perfect-style quality is selected, a line under the quality buttons says what it needs (the best ordinary recipe plus one of each rare ingredient the candy names), and the recipe costs already show those icons; (3) the finale card tells the player the code can be shown again from Settings.
- (2026-10-19, amends the three switches) The **Foreman** switch can be turned on whenever every basic helper (porter, stirrer, sculptor) is hired, even if the player took some back by hand: turning it on puts them all back to work. It is refused only while a helper is not hired yet. Taking a helper back while the foreman runs still switches the foreman off.
