# Handoff: Cult of Sweet Tooth, UI restyle v2

## Overview
Visual redesign of the five screens of *Cult of Sweet Tooth* (web game, PC and phone, EN/FR): Craft (idle and bench), Serve, Evening, Settings. Structure, rules and information are unchanged from `original-brief/`. This is a restyle and re-layout, plus a state sheet (upgrades, errands, focus ring), a 390px phone layout and a logo and icon set.

## About the design files
Files in `reference/` are **design references built in HTML**. They show the intended look and behaviour. Do not ship them. Recreate the designs in the game's existing environment (Svelte components in `src/ui/*.svelte` plus `src/ui/app.css`, per the brief), using its patterns. Each component only renders a ready-made view description, so the work is markup and CSS.

To view them, open `reference/Sweet Tooth Screens v2.dc.html` in a browser (keep `support.js` beside it). A switcher at the top of the page changes the screen. The page has Tweaks for theme (dark/light) and the rival warning.
`reference/Sweet Tooth States.dc.html` shows every state of the upgrade card and the errand, plus the focus ring.
`reference/Sweet Tooth Mobile.dc.html` shows the five screens at 390px (canvas, pan and zoom).
`reference/Sweet Tooth Logo.dc.html` shows the logo and icon set.
The three screen files take a `theme` tweak (dark or light).

## Fidelity
**High fidelity.** Colours, type, spacing, radii and shadows are final. Pictures are placeholders at the slot sizes in the brief and must keep those sizes so nothing shifts when art arrives.

## Visual concept
A candy shop in a shack. Two surface levels:
1. **Wood frames** (level 1): header, Workshop, Counter, Skill tree, Errands card, Around the shop. A 12px wooden border (grain + plank seams) around a plain panel. The header is wood all the way through.
2. **Flat panels** (level 2): everything inside the frames, plus the app background. No texture.
Exception: the "notes" (Today's board, In stock, Journal) are parchment paper, slightly rotated (-0.4 to -0.6deg).

Buttons:
- **Primary on wood and in phase controls**: raised honey button with a bevel and a bottom shadow. It sinks 3px when pressed.
- **Secondary on wood (header EN, Settings)**: dark wooden plate, quieter than primary, sinks 2px when pressed.
- **Secondary on flat panels**: transparent with a 1px `--line` outline (Refuse, Cancel, Stir, Shape).

## Design tokens
Defined as CSS variables on the app root (names match the existing `--bg --panel --ink --muted --accent --line --ok --warn`, plus new ones).

| Token | Dark | Light |
|---|---|---|
| `--bg` (app background, flat) | #1b1612 | #f3e8d0 |
| `--panel` | #2a211a | #fffaf0 |
| `--panel2` (wells, inner cards) | #352a20 | #f3e6c9 |
| `--ink` | #fbf0dc | #2b1c0e |
| `--muted` | #d1bfa4 | #5f4a30 |
| `--accent` (text/pips/outline) | #f5b83d | #c97b0c |
| `--accentInk` (text on honey) | #2a1704 | #2a1704 |
| `--line` | #5a4635 | #d2bd92 |
| `--ok` | #a6d98f | #3f7a2c |
| `--warn` | #ff9c85 | #b4412c |
| `--shelf` | #3b2d21 | #e6d2a8 |
| `--shelfEdge` | #241a12 | #cdb383 |
| `--scene` (cauldron stage) | #241c15 | #efe0bd |
| `--paperInk` | #2e2010 | #2b1f12 |
| `--slotInk` | #f1e4cc | #3d2f1e |
| `--slotC` (clerk slot) | #4f7a60 | #b9d4bf |
| Branch: `--kit` Kitchen | #f5a85a | #a8550a |
| Branch: `--shop` Shop | #78cfc1 | #12695e |
| Branch: `--tem` Temple/Hive | #cdb0f4 | #62399e |

Composite tokens (full values in `reference/Sweet Tooth Screens v2.dc.html`, function in `renderVals`, search `const T = dark`):
- `--btn`: `linear-gradient(180deg,#ffd878,#eba526)` (both themes).
- `--btnShadow` dark: `inset 0 1px 0 rgba(255,255,255,.55), 0 3px 0 #8f5c0e, 0 7px 10px rgba(0,0,0,.35)`. Light: same with `.6` highlight and `rgba(80,40,0,.3)` drop.
- `--btn2` dark `linear-gradient(180deg,#46331f,#33261a)`, border `#150e08`, shadow `inset 0 1px 0 rgba(255,225,170,.2), 0 2px 0 rgba(0,0,0,.5)`. Light `linear-gradient(180deg,#ead5a3,#d9bd85)`, border `#8d6837`, shadow `inset 0 1px 0 rgba(255,255,255,.5), 0 2px 0 rgba(120,80,30,.45)`.
- `--paper`: parchment noise over `linear-gradient(180deg,#f3e5c0,#e5d1a2)` dark theme, `#fff5d6 to #f4e3b4` light.
- `--wood`: see "Wood texture".

### Wood texture (CSS only, no image files)
Layers, top to bottom: plank seams, dark grain, light grain, optional knots, base gradient.
- **Seams**: `repeating-linear-gradient(180deg, transparent 0 166px, rgba(0,0,0,.45) 166px 168px, rgba(255,205,140,.07) 168px 170px)` (period 170px).
- **Grain**: SVG data-URI tile 420x420 using `feTurbulence type=fractalNoise stitchTiles=stitch numOctaves=3`, then `feColorMatrix` mapping the red channel to alpha. Dark grain: `baseFrequency="0.004 0.16" seed=4`, colour rgb(.05,.025,0), alpha = 1.0*R - 0.3. Light grain: `baseFrequency="0.003 0.22" seed=9`, colour rgb(1,.75,.45), alpha = 0.35*R - 0.17. Knots: `0.02 0.09 seed=2`, rgb(.04,.02,0), alpha = 2.4*R - 0.95.
- **Base (dark)**: `linear-gradient(180deg,#4a3422,#3b2a1b)`. **Base (light)**: `#f0d8a8 to #e4c68e`, seams at .2/.25 alpha.
- Tune grain strength only through the alpha slope/offset. Frequency x is low and y is higher so streaks run horizontally.
- Write `url(#f)` inside the SVG, then URI-encode the whole string once (double encoding breaks the filter).

Wood frame recipe (level-1 cards):
`background: linear-gradient(var(--panel),var(--panel)) padding-box, var(--wood); border: 12px solid transparent; border-radius: 22px; box-shadow: inset 0 1px 0 rgba(255,225,170,.18), inset 0 -2px 0 rgba(0,0,0,.25), 0 8px 0 -3px rgba(0,0,0,.3), 0 16px 26px rgba(0,0,0,.3);`
Header: `background: var(--wood); border: 1px solid var(--line); border-radius: 18px; padding: 12px 16px 12px 20px;` same shadow.

### Type
- Display: **Young Serif** 400. H2 28px (text-shadow `0 2px 0 rgba(0,0,0,.35)`), card titles 18 to 20px, customer type 20px, numbers (coins, day) 22 to 24px, journal 22px/1.3 italic, logo title 19px.
- UI/body: **Bricolage Grotesque** 400/500/700. Body 14 to 15px, buttons 14 to 16px/700, captions 12 to 13px, overline labels 11px/700 with 0.1em tracking, uppercase.
- Data/slots: **JetBrains Mono** 500, 10 to 13px (budget, costs, placeholder labels).
- Minimum text size 12px. French runs 20 to 30% longer: no fixed widths on text boxes.

### Spacing, radii, elevation
- Page max-width 1200px, 16px side padding, 16px gaps between blocks. Frames use 12px wood + 22 to 24px inner padding.
- Radii: frames 22px, header and cards 18px, inner cards 12 to 16px, buttons 10 to 12px (primary phase button and pills 999px), slots 10 to 14px.
- Tap targets 44px minimum (primary 48px).
- Shadows: see frame recipe. Buttons: `--btnShadow`, `--btn2Shadow`.

## Layout (desktop, about 1200px)
Persistent top, in order:
1. **Header** (wood): logo 48px + "Cult of Sweet Tooth"; right group: DAY n/7, phase pill (Morning, Afternoon, Evening; active = honey button), coins (honey coin 26px + number), **end-phase button** (Open the shop / Close the shop / Go to sleep, 48px high, with arrow), EN button, Settings button. Right group wraps under the logo on narrow widths.
2. **Stage strip**: one line: stage name + day, "n / 800 coins earned" (mono), and 7 day pips (10px high, current day honey, day 3 outlined in `--warn` when the rival is coming). The **rival warning** is a chip at the right (`▲ Rival hive from day 3 · hint ▾`, 1px `--warn` outline) that opens a popover (340px) with the two full original lines. The warning is shown only when a rival warning exists.
3. **Screen**: two columns, main (flex 3 1 560px) and rail (flex 1 1 280px), wrapping to one column when narrow.

### Craft, idle (Morning)
- Main = Workshop frame. Row 1: **Shelf** (230px wide, `--shelf` plank with 6px `--shelfEdge` bottom): ingredient tiles (96px slot, name, supply as pips, "n left"). Next to it the **cauldron stage** (`--scene`, 6px bottom edge): 240x180 station slot, batch counters (3 circles, 28px, filled = remaining) and "3 batches, 4 candies each".
- Row 2 "Start a batch": three recipe cards in a row (96px candy slot, name, ingredient cost, price in mono honey colour; selected = 2px `--accent` border on `--panel`, others `--panel2`), then a quality segmented control (Plain x1, Fine x1.6 oven, Perfect x3 dark seed; unavailable = 40% opacity, disabled) and the primary **Start batch** button.
- Rail: **Today's board** (parchment note: forecast, contracts, candy in stock; red dot), **Errands** (wood frame, rows that expand).

### Craft, bench
Same scene. The held ingredient tile gets a `--panel` background, 2px `--accent` border and a 4px glow ring; the other ingredient dims to 45%. The cauldron stage shows a dashed 3px `--accent` ring (armed) and "In the cauldron: Honey 1 / 2". Under it: a **4-step track** (Fill, Stir, Bake, Shape; current = `--panel` with accent border and filled number dot; Bake dims when not Fine). Below: instruction banner (honey button style, "Now tap the Cauldron to put it in."), Stir and Shape (disabled secondary), Cancel (outline, right-aligned).

### Serve (Afternoon)
- Main = Counter frame, header line "At the counter: 4 / 4 · Today: 2 served, 0 lost, 10 coins". **2x2 grid of customer cards** (`--panel`, 18px radius). Each card: customer portrait slot 96x120 on the left; right: type (Young Serif 20px) + "n coins max", a "Wants" row (48px candy slot, wanted candy, "At least Quality"), and the **patience meter** (label + N segments, 10px high, rounded). Meter colours: >50% `--ok`, <=50% `--accent`, 1 left `--warn` with label "Leaving!" and a warn outline + glow on the card. Bottom row: primary **Serve Plain · price** when a stocked quality fits; otherwise a "⊘" reason line ("Nothing in stock fits this customer."); **Refuse** outline button on the right. One serve button per quality in stock (only Plain shown in the mock).
- Under the grid: "n waiting customer(s) will leave if you close now." in `--warn`.
- Rail: **Clerk** card (96px slot, toggle 46x26 switch, label, "Knows how to sell...", one training bar per recipe with "0 / 2 by hand"), **In stock / Contracts** note, **Latest** feed (two lines, the clerk's line in muted).

### Evening
- Top row: **Journal** parchment note (22px italic Young Serif) and **Today's report** (6 stats in a 3-column grid, big number + caption; Earned in honey).
- **Skill tree** frame: legend (Owned, Can afford, Short of coins, Locked) and **three columns**, one per branch, with an identity colour: Kitchen `--kit`, Shop `--shop`, Temple/Hive `--tem`. Each column has a header chip (glyph + name + 3px bottom border in branch colour). Upgrade cards: name, state label (Can afford in honey, Locked in muted), description, level pips in branch colour with "n / N", then:
  - **Can afford**: card border and 3px inset left bar in branch colour, honey primary-style **Buy · cost**.
  - **Short of coins**: card normal, dashed-outline muted Buy button.
  - **Locked**: card at 60% opacity, no Buy, "🔒 Requires X first."
  - **Owned** (one-time unlock) and **Maxed** (top level): see "Upgrade card states" below.
- Rail: **Around the shop** (wood frame; 640x120 map slot shown at 96px high, place chips, locked place dashed), **Errands**.

### Errands (component, both screens)
Collapsed row (`--panel2`, 12px radius, 56px min height, 10px vertical padding): name, requirement in mono, optional "Against the rival hive" chip (below the requirement, 6px top margin, 1px `--warn`), **Accept** (36px high honey button). Tapping the row expands the original description. Other states: see "Errand states" below. The rival chip sits **under the requirement line, inside the title column** (not as a separate column), `align-self:flex-start`, 6px top margin. Keep it there on every screen.

### Settings
Single column card, max-width 620px: Language segmented (English / Français), New game (seed input 48px mono + outlined `--warn` "Start over..." button + confirm note), Save (Export / Import outline buttons + autosave note), primary "Back to the shop".

## Interactions and behaviour
- All buttons: 44px minimum targets; no interaction relies on hover or drag.
- Press: primary sinks `translateY(3px)`, shadow collapses to inset, brightness .94, 60ms. Secondary on wood sinks 2px. Hover on primary: brightness 1.08.
- Phase pill follows the day phase. The end-phase button advances the phase.
- Rival chip toggles its popover (native details element in the reference; any disclosure works).
- Errand rows expand and collapse on tap.
- Build patience as a segmented meter so it can later drain continuously; customers as cards that could become characters; steps as buttons that could become gestures (see section 7 of the brief).
- Focus states are not drawn in the mock: use a 2px `--accent` outline with 2px offset.

## State management
Unchanged from the engine. The UI reads the existing view descriptions. New derived presentation state: patience tier (ok, low, urgent) from remaining/max, upgrade state (owned, maxed, affordable, short, locked + reason), errand state (available, under way, locked, done), held ingredient and armed cauldron during crafting.

## Art slots
Keep the fixed sizes from the brief: candy 96x96 (x4), ingredient 96x96 (x2), clerk 96x96, station 240x180 (x2), map strip 640x120, shop counter 320x200. Placeholders are striped rectangles (135deg, 16px period, 7% white or black) with the slot id and size in mono.
Requested new slots: customer x4, 96x120 (shown); bee; rival hive 240x180; upgrade icons 48x48; Sweet Tooth 320x320; shop background 1200x240.

## New strings
Compared with the current UI, the following are new (EN, translate to FR):
Start batch (replaces Start), Fill / Stir / Bake / Shape (step names), Wants, Leaving!, Patience n, Can afford, Locked, Owned, Short of coins (legend), Can afford, "n left", "n batches · 4 candies each", "Rival hive from day n" (chip label, short form of the warning), "hint". All other text is verbatim from the original strings.

## Upgrade card states
Reference: `Sweet Tooth States.dc.html` (assumes 130 coins). Card: `--panel`, 1px `--line`, 14px radius, 12px padding, 8px gap. Branch colour `c` = `--kit` / `--shop` / `--tem`.
| State | Border | Background | Label | Controls |
|---|---|---|---|---|
| Locked | 1px `--line` | `--panel`, 60% opacity | "Locked" (muted) | no button; "🔒 Requires X first." |
| Short of coins | 1px `--line` | `--panel` | none | dashed 1px `--line` Buy button, muted; "Short by n coins" under it |
| Can afford | 1px `c` + 3px inset left bar `c` | `--panel` | "Can afford" (`--accent`) | honey Buy button, 44px, bevel |
| Owned (one-time) | 1px `c` | `c` at 13% over `--panel` | "Owned" in `c` | 22px check badge in `c` on the top-right corner (-8px, ring 3px `--bg`), no button, no pips |
| Maxed (levels) | same as Owned | same | "Maxed" in `c` | check badge, all pips filled in `c`, no button |
Level pips: 8px high, 4px radius, filled in `c`, empty `--line`; "n / N" in mono 12px.

## Errand states
Reference: `Sweet Tooth States.dc.html`. Card: `--panel2`, 12px radius, 12px padding, 10px gap. Always expanded in the sheet; collapsed rows follow the "Errands" component above.
| State | Border | Chip (top-right) | Body | Action |
|---|---|---|---|---|
| Available | none | none | name, requirement (mono), description | honey **Accept** |
| Available, against rival | 1px `--warn` | none | + "Against the rival hive" badge under the requirement | honey **Accept** |
| Under way, deliver goods | 1px `--accent` | "Under way" (`--accent` outline) | progress label "In stock", n / N mono, N pips in `--accent` | **Deliver**, dashed muted (disabled) until stock is enough |
| Under way, mission | 1px `--accent` | "Clerk away" | label "Day", n / N, one pip per day | none |
| Ready to deliver | 1px `--ok` | "Ready" (`--ok` outline) | pips all filled in `--ok` | honey **Deliver** |
| Locked | none, 60% opacity | none | "🔒 Requires the errands board first." | none |
| Done | none, 60% opacity | "Done" (`--ok` outline) | "✓ Reward received." in `--ok` | none |
Chips: 11px/700, 4px 8px padding, 999px radius, 1px outline in the state colour. State is never colour only: the chip text says it.

## Focus ring
Keyboard focus only (`:focus-visible`). A 2px dark gap then a 3px light-honey ring: `box-shadow: 0 0 0 2px #1b1612, 0 0 0 5px #ffe08a`. Keep the element's own shadow after the ring (for example `, 0 3px 0 #8f5c0e` on honey buttons). The gap keeps the ring visible on wood, honey and flat panels, in dark and light themes. Applies to primary and secondary buttons, outline buttons, segmented options, toggles, text inputs, errand rows (ring on the whole row), upgrade Buy buttons, customer card actions.

## Mobile layout (390px)
Reference: `Sweet Tooth Mobile.dc.html`. Page padding 12px, 12px gaps, one column, tap targets 44px minimum (primary actions 48 to 52px). Same tokens, wood frames and press behaviour as desktop; wood frame border is **8px** (12px on desktop), inner panel padding 14px, radii 22px / 14px. Frame edge shown in the mock (34px radius, black bezel) is only a mock device.
- **Header** (wood, 18px radius, 10px 12px padding, two rows). Row 1: logo 40px, title (Young Serif 17px, flex 1), coin pill (22px coin + number 18px), Settings icon button 44x44 (secondary-on-wood style, gear glyph, accessible name "Settings"). Language moves into Settings. Row 2: DAY n / 7 + a 3-segment phase pill filling the rest (segments 13px/700, 10px 4px padding, active = honey button).
- **Stage strip**: stage name and day, "n / 800" in mono, 7 day pips (10px). The rival warning is a full-width collapsible row (44px high, 1px `--warn` outline, 14px radius) labelled "Rival hive from day 3" with "hint" on the right; expanded it shows the two original lines. Expanded in the Craft mock as an example.
- **Today card** (parchment, collapsible, directly under the stage strip on Craft and Serve, collapsed by default). Collapsed: row 1 forecast (☀ + text, Young Serif 16px) + red dot + chevron; row 2 "STOCK" label and **stock chips**: 22px candy icon circle + count in mono 14px, one chip per candy in stock; ring on the icon = quality (none Plain, one ring Fine, two rings Perfect); "Nothing in stock." when empty. Expanded: Contracts, "Candy in stock" as text (+ ring legend), and on Serve the **Latest** feed (two lines). This replaces the desktop board, in-stock note and Latest panel.
- **Craft idle**: Workshop frame. Shelf as a 2-column grid of tiles (96px slot, name, supply pips, "n left") on the `--shelf` plank. Cauldron stage centred (240x180 slot, `--scene` plank), batch circles (26px) and "3 batches · 4 candies each". "Start a batch": three recipe rows in a vertical list (96px slot, name, cost, price in mono honey, radio circle at the right; selected = 2px `--accent` border on `--panel2`); quality segmented control in 3 equal columns (52px tall, name + small note); **Start batch** full width 52px. Errands card below (rows 56px min, Accept 44px high).
- **Craft bench**: same shelf (held tile highlighted, other dimmed) and cauldron (dashed 3px `--accent` ring, "Honey 1 / 2" below). Step track as 4 columns (number dot, name, small note; current has accent border; Bake dims when not Fine). Instruction banner (honey, centred), Stir and Shape in 2 columns (disabled outline), Cancel full width outline.
- **Serve**: Counter frame, one customer card per row (`--panel2`, 16px radius): portrait slot 96x120 left; right: type (Young Serif 19px) + budget mono, "Wants" mini row (48px candy slot + name + "At least Quality"); below, patience meter (label + 10px segments, same colours as desktop); bottom row: honey **Serve Plain · price** (flex 1, 48px) or the "⊘" reason line, and **Refuse** outline (48px). Warning line under the list. **Clerk** is a collapsible card: collapsed row 60px with title, "Faithful customers", the on/off toggle and a chevron (so it can be switched without opening); expanded: 96px slot, label, "Knows how to sell...", training bars.
- **Evening**: Journal note, report as a 3-column grid (6 stats), Skill tree frame with **branch tabs** (3 equal tabs: glyph, name, "n can afford"; active tab has a 3px branch-colour underline and `--panel2` fill) showing one branch at a time as single-column upgrade cards (same states as above, Buy button 48px high). Then Around the shop (map slot shown 72px high) and Errands.
- **Settings**: one column; language and save buttons as 2-column grids; seed input and Start over full width.
- **Bottom action bar**: wood bar fixed to the bottom edge of the screen holding the full-width primary phase button (52px; Open the shop / Close the shop / Go to sleep, arrow). Add bottom safe-area padding on real devices. Same press behaviour (sinks 3px).
- Nothing depends on hover or drag. French strings are longer: the phase pill, tabs and chips must wrap or truncate gracefully.

## New strings (additions to the list above)
"Short by n coins", "Under way", "Clerk away", "Ready", "Done", "Deliver", "Reward received.", "Requires the errands board first." (errand lock reason), "n can afford" (tab sub-label), "STOCK" (summary label), "Ring on the icon: none = Plain, one = Fine, two = Perfect.", "Swipe or tap Shop and Temple / Hive for their upgrades." (hint under mobile tree; drop it if tabs alone are clear), "Faithful customers" (clerk collapsed row), "Settings" icon button accessible name.

## Logo and icons
Honey pot mark: amber body, darker rim, one drip, honeycomb seal on the front. Three cells at 72px and up (two dark, one lit), one cell below 72px.
`assets/logo/`:
- `app-icon.svg`: rounded-square icon, full detail. Source for PNGs 72 to 1024. Used in the header at 48px.
- `app-icon-small.svg`: single hexagon, for 57 and 60px.
- `favicon.svg`, `favicon.ico` (16, 32, 48 px): single hexagon.
- `maskable-icon.svg`: full-bleed, mark inside the 80% safe zone.
- `logo-mark.svg`, `logo-mark-small.svg`: transparent background.
- `logo-mono.svg`, `logo-mono-light.svg`, `logo-mono-small.svg`: single colour.
- `png/`: favicon 16 to 64, app-icon 57 to 1024 (iOS, Android, desktop), maskable 192 and 512, logo-mark 256 and 512.
- `site.webmanifest`: PWA manifest. Theme and background colour #2b1e14.
Logo colours: honey #f5b83d, rim #c9871a, drip #ffd878, dark #2a1d13, icon ground #2b1e14.

## Motion (non-binding, first candidates)
Cauldron steam and stirring, ingredient drop into the cauldron, patience meter draining, coin burst on sale, button press (done).

## Files
- `reference/Sweet Tooth Screens v2.dc.html`: all desktop screens (switcher at top), tokens in the logic class.
- `reference/Sweet Tooth States.dc.html`: upgrade card states, errand states, focus ring.
- `reference/Sweet Tooth Mobile.dc.html`: the five screens at 390px.
- `reference/Sweet Tooth Logo.dc.html`: logo and icon sheet.
- `reference/logo/`, `assets/logo/`: the same icon set (use `assets/`).
- `reference/support.js`: runtime needed to open the reference files.
- `original-brief/`: the original brief and element catalogue (rules, data, constraints).
Screenshots are not included.
