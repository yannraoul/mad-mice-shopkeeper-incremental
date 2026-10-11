# Design brief: Cult of Sweet Tooth (v1 proof of concept)

*Culte de Bec Sucré* in French. A web game for PC and phone, in English and French.

This folder is everything a designer (human or Claude Design) needs to restyle the game:

| File | What it is |
|---|---|
| `README.md` (this file) | The game, the loop, the screens, the constraints, what we want back |
| `elements-catalog.md` | Every game element as tables (recipes, customers, upgrades, errands, art slots...), generated from the real data |
| `screens/` | Screenshots of every screen and state (see the index at the end) |

**TL;DR.** It is a small, calm, *active* shopkeeper game: each day you make candy by hand in the
morning, sell it to a queue of customers in the afternoon, and spend your coins on upgrades in the
evening. Weekly revenue targets push you through three stages. Right now the interface is a
deliberately plain set of forms, text and buttons, built to test the rules. **We want a proper visual
design for that same structure**, a static v1, while keeping room for it to become interactive and
animated later (see section 7: this matters for how you design).

---

## 1. The game in one paragraph

You run a candy shop for a cult of mice, in the world of the tabletop RPG *Mausritter* ("mad mice"). The
cult worships **Sweet Tooth**; its enterprise makes candy from **honey** (bees and mice work
together) in a cauldron in an abandoned shack, chasing the "perfect candy" made with **dark sunflower
seeds**, with the final goal of summoning Sweet Tooth. The tone is whimsical, cosy and a little
sinister: honey, cauldrons, bees, pilgrims, a sick queen, a rival hive, a narrator who writes a short
journal line each evening. The player is the shopkeeper; they never eat the candy.

This game is a surprise gift for the players of the author's tabletop campaign, so it should feel
hand-made and charming, not corporate. Spaceplan-like: **minimal UI, few tabs, narrator lines,
"I can put it down" pacing.** No real-money purchases, no time pressure, no punishing failure.

## 2. The gameplay loop

The game is **active and turn-based**. The player ends each phase of the day with a button. There are
no timers and no idle or offline progress.

```
            ┌──────────── one DAY ─────────────┐
   MORNING  │  AFTERNOON         │  EVENING    │
   craft    │  serve             │  spend      │ ──► next day (honey is delivered again,
   candy    │  customers         │  coins      │      unsold candy is kept)
            └───────────────────────────────────┘
   7 days = one WEEK, judged on revenue: reach the target -> next stage; miss it -> the same
   week repeats, nothing is lost (no fail state). 3 stages, then the ending.
```

**Morning: craft.** The board shows a rough forecast of the day (never exact), the contracts on offer,
what is in stock and the errands. In the workshop the player chooses a recipe and a quality, then makes
the batch **by hand**: tap an ingredient on the shelf (honey, dark seeds), tap the cauldron to put one
unit in (repeat until the recipe is full), then **stir**, (for Fine quality) **bake in the oven**, and
**shape the candies**. A batch gives 4 candies. A fixed amount of honey is delivered each morning and
the cauldron can only do 3 batches a day, so the morning is a **bet**: what to make for customers you
cannot see yet. Doing the same steps by hand gets repetitive on purpose; upgrades and the clerk
automate it step by step.

**Afternoon: serve.** Customers arrive (up to 4 stand at the counter, the others wait outside). Each one
has a **type**, **wants one candy**, a **minimum quality**, a **budget** and a **patience**. The player
decides for each: serve with one of the qualities they have in stock (a better quality than asked is fine,
but the customer never pays more than their budget), or refuse. **Every action makes everyone still
waiting a little more impatient**; at zero they leave. When the player closes the shop, anyone still
waiting leaves. A hired **clerk** can serve the Faithful customers automatically once the player has
made that recipe by hand twice.

**Evening: spend.** A report of the day (coins earned, served, lost...), one **journal line** from the
narrator, and the **skill tree**: 3 branches (Kitchen, Shop, Temple/Hive) of upgrades bought with
coins. Some are repeatable (more honey, bigger batches, more counter space, more patience), some are
unlocks (the oven for Fine quality, a garden for Perfect quality, new recipes, the clerk, the contract
board, the errands board, the map). Prices rise with each level, and the cheap ones stay useful.

**The week and the stages.** A week is 7 days with a **revenue target**. Passing it opens the next stage:
more customers, harder problems. Missing it just repeats the week with everything kept. The three
stages: *The first week*, *Gathering pilgrims*, *The feast of Sweet Tooth*. After the last one, an
ending (written by the author; currently a placeholder) is shown and play can continue.

**Story events that make it more than a number game.**
- A **rival hive** starts stealing honey in stage 2 (after a few days of warning). The way out is an
  **errand** ("A splinter hive": send the clerk away for two days). A big design requirement: *the
  game must make it obvious that a problem has a fix, and where to find it* (see the stage bar).
- **Errands** are small scripted quests with permanent rewards. Finishing "The queen is sick"
  (make a special *Royal tonic*) unlocks **bee customers**, who sometimes come asking for it.
- A **map strip** slowly reveals places around the shop (flavour).
- A **contract** is a merchant's order (quantity, quality, deadline) paid at a bonus.

A minute of play: *Morning:* 4 honey, forecast "busy day". I make two batches of honey drops: tap honey,
tap cauldron, tap cauldron, stir, shape, twice. 8 candies. *Afternoon:* five customers. A Traveler wants
a drop and has 12 coins: serve. A Merchant wants Fine quality and I have none: refuse. A Faithful
customer is next, patience 1: serve now. Two walk out. *Evening:* 40 coins. The journal says the bees hummed
something that sounded like sympathy. I buy "Honey yield". Sleep.

## 3. The elements

Full tables are in `elements-catalog.md`. In short:

- **Ingredients:** Honey, Dark sunflower seed (delivered each morning; unused amounts are lost).
- **Candies (recipes):** Honey drop (start), Sunflower brittle, Honey toffee (bought), Royal tonic (errand, sold to bees only).
- **Qualities:** Plain, Fine (oven step, costs more honey, x1.6 price), Perfect (needs a dark seed, x3 price). Ordered scale.
- **Stations:** the Cauldron (by hand) and a Second cauldron (automatic).
- **Customers:** Faithful (patient, poor, loyal), Traveler (moderate), Merchant (rich, picky, impatient, needs Fine), Bee (only the Royal tonic).
- **Worker:** the Clerk.
- **Progression:** the skill tree, weekly stages, errands, the rival hive, the map, the journal.

## 4. The screens

There is one main screen per phase, plus Settings. A **header** (title, language, Settings), a **status
line** (day, phase, coins) and a **stage bar** (weekly progress, warnings, hints) sit above the screen;
the button that **ends the phase** sits at the bottom right.

| Screen | When | Purpose | On it | Main actions | Screenshots |
|---|---|---|---|---|---|
| **Craft** (workshop) | Morning | Prepare candy | Board (forecast, contracts, stock, errands), recipe form, then the **bench** (ingredient shelf, cauldron, steps) | Choose recipe+quality, Start, tap ingredient, tap cauldron, Stir/Bake/Shape, Cancel; deliver contract; accept/deliver errand; "Open the shop" | `01`, `02`, `06` |
| **Serve** (counter) | Afternoon | Sell | Board, the counter: one **customer card** each (type, wanted candy picture, min quality, budget, patience, serve buttons per quality, Refuse), the Clerk panel, a feed of the latest sales | Serve, Refuse, switch the clerk on/off, "Close the shop" | `03`, `07` |
| **Evening** | Evening | Review and spend | Day report, journal line, the **skill tree** (3 branches of upgrade cards), the map strip, errands | Buy an upgrade, accept/deliver errands, "Go to sleep" | `04` |
| **Settings** | Any time (header button) | Meta | Language, **New game** (optional seed), save export/import, autosave note | Start over (with confirmation), export/import, back | `05` |

**States worth designing for** (all in the screenshots): empty (no stock, no contracts, no customers), a
disabled button with its reason ("Not enough coins.", "Requires the faithful first."), a rival warning
with a hint toward its fix, the week result banner ("Target missed last week... the week starts again;
everything you bought stays."), the final-stage-cleared ending, an item that is held/armed during crafting,
a locked map place, an errand that is available / under way / locked / done, an upgrade that is owned /
maxed / unaffordable.

**Persistent chrome.** The stage bar appears on every game screen. It carries the week's progress, any
**warning** (the rival hive) and **hints** (how to stop it). It is important information that currently
takes a lot of room: rethink its weight.

## 5. What matters most on each screen (our priorities, challenge them)

- **Craft:** the *act of crafting* is the game here: the shelf and the cauldron should feel like a small
  place you work at, not a form. Supplies left and batches left must be glanceable. The recipe form is
  secondary once a batch is started.
- **Serve:** the customer is the focus. The decision per customer is: *can I serve them, with what, at what
  price, and how soon will they leave?* Patience should read as urgency at a glance. The picture shown per
  card is the candy wanted; the customer themselves has no picture yet (a good place for art).
- **Evening:** one calm moment: how did today go, one line of story, then choose what to buy. The tree
  should show **what I own, what I can afford now, what is locked and why**. Three branches with
  different identities.
- **Everywhere:** coins, the day/phase, and the one button that moves the day on.

## 6. Constraints

- **Platforms:** desktop and phone, one responsive layout. Phone = touch: nothing may depend on
  hover or drag-and-drop; tap targets at least 44 px.
- **Languages:** English and French, switchable at any time. French runs about 20 to 30 percent longer;
  nothing may be sized for English text. All text comes from string tables (`content/core/strings/`),
  never hard-code words in a design; if a design needs new text, list the strings needed.
- **Light and dark:** both exist (they follow the system setting). Colours are CSS variables in
  `src/ui/app.css` (`--bg --panel --ink --muted --accent --line --ok --warn`).
- **Accessibility:** contrast, focus states, text that scales, no meaning by colour alone.
- **Art slots:** every picture is a **fixed-size slot with a placeholder** (a labelled rectangle at its
  final pixel size). Real art will replace the files later without any code change, so the layout must
  work with *any* image at those sizes, and must not shift when an image arrives.

  | Slot | Size (px) | Slot | Size (px) |
  |---|---|---|---|
  | candy (x4) | 96 x 96 | station (cauldron, second cauldron) | 240 x 180 |
  | ingredient (x2) | 96 x 96 | map strip | 640 x 120 |
  | clerk | 96 x 96 | shop counter (not used on a screen yet) | 320 x 200 |

  Slots that do not exist yet and are probably wanted: **customers** (one per type, so the counter has
  faces), the bee, the rival hive, upgrade icons, the Sweet Tooth itself, a background for the shop. Say so in
  the design and give the sizes you would want.
- **Do not change the rules or the information shown.** This is a restyle and re-layout. If a design
  needs different information, say what and why, as a request.
- **Tech:** Svelte components in `src/ui/*.svelte` plus `src/ui/app.css`. Each component only *renders* a
  ready-made description of the screen (see section 7), so a redesign touches markup and CSS only.

## 7. Important: it will become interactive and animated later

**v1 is a static proof of concept**, and the visuals you design now should be static. But the game is
meant to grow, and **the design should not paint us into a corner.** Ideas we may do later (none are
planned precisely, they are here so your structure leaves room for them):

- **Stirring** the cauldron by moving the mouse or a finger in circles, instead of pressing a "Stir" button.
- Dragging or tapping ingredients into the cauldron with real motion, bubbling, steam, the candy dropping out.
- **A live, animated queue of customers** walking up to the counter, that you could select, "prep for"
  and serve, instead of a list of cards.
- **Real-time patience** (a timer draining while a customer waits) instead of "patience drops by 1 each
  action".
- Sale animations (coins), the clerk walking about, the rival hive's bees, day/night changes, a shop
  scene that changes as you buy upgrades, music and sound.

What this means for the design:

1. **Think in scenes and objects, not only in forms.** The cauldron, the shelf, the counter, the customers
   and the shop are things in a place. Give them a spatial logic that could later hold an animation.
2. **Separate "what it is" from "how it moves".** Each interactive thing (ingredient, cauldron, customer,
   upgrade, errand) should be a self-contained, well-named component with clear visual states (idle, hovered
   or armed, active, disabled, urgent, done) that could later gain transitions.
3. **Do not bake turn-based assumptions into the look.** Patience as a number is today's reality; draw it as
   a *meter* that could one day drain continuously. A customer as a *card* could become a character in a row.
   A step as a *button* could become a gesture.
4. **Keep room.** Reserve space for pictures and for motion (art slots at fixed sizes; no layout shift).
5. **Architecture helps you:** the game is built in layers so the interface can be swapped without touching
   the rules: the rules (`src/engine`), a **view layer** (`src/view`: for each screen, a ready-to-render
   description with every button's action) and thin renderers (`src/ui`). A future animated or canvas
   front end would reuse everything except the renderers. So a designer can propose big changes to how
   things are drawn and arranged without worrying about breaking the game.

## 8. What we would like back

1. **A design system:** colour tokens for light and dark, type scale, spacing, radii, elevation/borders,
   icon style, button and form-control styles, with all states.
2. **Layouts for each screen** (Craft idle + bench, Serve, Evening, Settings) at desktop (about 1200 px)
   and phone (about 390 px), including the empty and warning states listed in section 4.
3. **Component specs** mapped to the current components, so they can be implemented one by one:
   `App` (header, status, end-phase button), `StageBar`, `Board`, `Errands`, `Craft` (form and bench),
   `Serve` (customer card, clerk panel, feed), `Evening` (report, journal, tree node card), `MapStrip`,
   `Settings`, `ImageSlot`.
4. **Art direction** for the placeholder slots (a short style guide: shapes, palette, line, mood) and a list of
   extra art that would help.
5. **Motion notes** (non-binding): where animation would go first, so we can design toward it.
6. A list of **new strings** needed, if any (we will translate EN and FR).

## 9. Known weak points of the current UI (please fix them)

- Every screen is the same grey panels: nothing feels like a *place*, and nothing says "mice" or "candy".
- The stage bar and its warnings take a lot of room on every screen and compete with the screen's own content.
- The errands list is long, text-heavy and uses full-width buttons; it dominates the left column.
- The evening screen is very long on a phone and the upgrade cards all look the same, whatever their branch or state.
- On the Serve screen a customer's patience is just a number; the clerk panel is a wall of small grey text.
- On the Craft bench the ingredient shelf and the cauldron are two boxes; the "steps" are just buttons.
- The header status line (day, phase, coins) is easy to miss, and the end-of-phase button is far from it.
- Placeholder pictures are flat coloured rectangles with a label.

## 10. Screenshot index

All are English, produced by `npm run screenshots` from a throwaway game with fixed seeds (so they can be
regenerated after any change). Desktop is 1200 px wide, phone is 390 px wide at 2x. "Rich" means a mid-game
state with many unlocks, to show as many elements as possible.

| File | Shows |
|---|---|
| `desktop-dark/01-morning-craft-form.png` | Morning, rich game: board, errands, recipe form, rival heads-up in the stage bar |
| `desktop-dark/02-morning-craft-bench.png` | Mid-batch: ingredient in hand (selected), cauldron armed, steps waiting |
| `desktop-dark/03-afternoon-serve.png` | Afternoon: four customers (some with nothing in stock to serve them), the clerk panel, the latest-events feed |
| `desktop-dark/04-evening-tree-and-report.png` | Evening: report, journal line, the skill tree with owned, affordable and locked cards, map strip, errands |
| `desktop-dark/05-settings.png` | Settings: language, New game with seed, save tools |
| `desktop-dark/06-first-day-morning.png` | A brand-new game: how bare it starts |
| `desktop-dark/07-first-day-afternoon.png` | First afternoon of a new game |
| `desktop-dark/08-rival-active-morning.png` | Stage 2, rival hive now stealing honey: warning plus hint to the errand |
| `desktop-dark/09-final-stage-cleared.png` | Final stage cleared: the ending line in the stage bar |
| `desktop-light/01, 03, 04` | The same screens in the light theme |
| `mobile-dark/01, 02, 03, 04, 05` | Phone layout: craft form, bench, serve, evening, settings |

To look at a state yourself, run `npm run dev` and open one of these (they never touch a real save):
- `http://localhost:5173/?seed=11&stage=2&money=420&unlocks=oven,clerk,errandsBoard,map,contractBoard,recipe-2,dark-garden,tonic-recipe` (rich mid-game)
- `http://localhost:5173/?seed=3` (new game) and `...?seed=5&stage=3&completed=1&money=50&unlocks=oven,clerk,errandsBoard,map` (ending)
