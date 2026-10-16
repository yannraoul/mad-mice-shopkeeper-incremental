# MMSIM-26 — The animated counter, part A: a placeholder shop to play with, and the accounting picture

Motivation: the afternoon was a list of cards while the morning is a living workshop. Before drawing anything, try the selling interaction with moving rectangles (playtest discussion, 2026-10-17).

- IN:
  - `src/ui/CounterScene.svelte`: a top-down **placeholder** shop in the units of a 256 x 144 scene (the size of the art to come). A counter with a clerk rectangle at the top, a door at the bottom, three tables. Customers are coloured squares (colour per customer type) that walk in from the door to their place in line (two rows of six), and are clickable. A bubble over each head says what they want: the candy art (a star for "something rich"), the least quality (P/F/E/PP) and patience as a bar; a green outline means we can serve them now, a nudge means about to leave. A served customer walks to a table and sits for 5 s; a refused or departed one walks out of the door.
  - `Serve.svelte`: the scene replaces the grid of cards; clicking a customer opens their order (the same card as before: options with hearts and tips, Refuse) under the scene. The clerk toggles, board and feed stay in the rail. `CustomerCard.bubble` in `src/view/serve.ts` carries what the bubble shows.
  - The accounting picture (`public/art/scenes/accounting-idle.png`, 208 x 128, from `assets/accounting-background.png`) fills the evening journal card and fades into the page under the text. `accounting.png` (with the mouse) is in place but unused: nothing shows the accounting mouse working yet.
  - String `serve.pickOne` (EN, FR).
- OUT: the satisfaction rating (plus or minus 10 % on prices, decided), real customer sprites, a waiter that walks the order to the table, the pending crowd badge ("+N at the door"), the accounting mouse mechanic, art for the counter.
- Decisions: every customer on the counter has a slot, so with the counter at its maximum the second row is full; the scene does not hold the pending customers (they are not at the counter yet).
- Verified: `npm run check`, `npm test`. In the browser (`?endgame=1`): the scene shows the whole queue, a click opens the order, serving sends the customer to a table and the line refills, the journal picture loads. Not checked: phone width, dark mode, the routine's serving animation over many customers.
