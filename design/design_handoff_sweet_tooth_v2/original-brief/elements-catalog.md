# Elements catalog

Every game element as tables, generated from the real data files by `npm run catalog` (so it cannot drift
from the game). English names. "Unlocked by" values are internal unlock ids: see the skill tree and errands
tables for what grants them. Part of the design brief: see `README.md`.

### Ingredients

| Name | Delivered each morning (base) |
| --- | --- |
| Honey | 4 |
| Dark sunflower seed | 2 |

### Candies (recipes)

| Name | Base price | Ingredients per batch | Unlocked by | Notes |
| --- | --- | --- | --- | --- |
| Honey drop | 5 | 2 Honey | from the start |  |
| Sunflower brittle | 8 | 3 Honey | recipe-2 |  |
| Honey toffee | 12 | 4 Honey | recipe-3 |  |
| Royal tonic | 10 | 2 Honey + 1 Dark sunflower seed | tonic-recipe | sold only to bees |

### Qualities (ordered)

| Rank | Name | Price multiplier | Extra cost per batch | Extra craft step | Unlocked by |
| --- | --- | --- | --- | --- | --- |
| 0 | Plain | x1 | - | - | from the start |
| 1 | Fine | x1.6 | 1 Honey | Bake in the oven | oven |
| 2 | Perfect | x3 | 1 Dark sunflower seed | - | dark-garden |

### Stations

| Name | Candies per batch | Batches per day | Behaviour |
| --- | --- | --- | --- |
| Cauldron | 4 | 3 | crafted by hand |
| Second cauldron | 4 | 2 | automatic every morning |

### Customer types

| Name | Asks for | Minimum quality | Budget | Patience (actions) | How common | Appears |
| --- | --- | --- | --- | --- | --- | --- |
| Faithful | any regular recipe they can afford | Plain | 6 | 6 | 5 | from the start |
| Traveler | any regular recipe they can afford | Plain | 12 | 4 | 3 | from the start |
| Merchant | any regular recipe they can afford | Fine | 30 | 2 | 2 | from the start |
| Bee | Royal tonic | Plain | 10 | 5 | 1.5 | after errand reward `bee-customers` |

### Workers

| Name | Hired by | Serves |
| --- | --- | --- |
| Clerk | `clerk` | Faithful |

### Daily forecasts (shown in the morning, never exact)

| Text | Busyness |
| --- | --- |
| A quiet day is expected | x0.6 |
| A normal day is expected | x1 |
| A busy day is expected | x1.5 |
| Mostly pilgrims are expected | x1.1 |
| Mostly travelers and merchants are expected | x1.1 |

### Skill tree

**Kitchen**

| Upgrade | Levels | Cost per level | Requires | Effect | Description |
| --- | --- | --- | --- | --- | --- |
| Honey yield | 4 | 20 / 60 / 150 / 400 | - | +1 supply:honey | More honey delivered each morning. |
| Bigger cauldrons | 3 | 40 / 150 / 450 | - | +1 capacity | Each batch makes more candies. |
| Second cauldron | 1 | 250 | Honey yield | adds station Second cauldron | A cauldron that makes Plain honey drops by itself every morning, using the day's honey. |
| Oven | 1 | 60 | - | unlocks `oven` | Unlocks Fine quality. |
| Dark seed garden | 1 | 400 | Oven | unlocks `dark-garden` | Unlocks Perfect quality. |

**Shop**

| Upgrade | Levels | Cost per level | Requires | Effect | Description |
| --- | --- | --- | --- | --- | --- |
| Counter space | 3 | 30 / 120 / 400 | - | +1 counterSpace | The shop can welcome more customers each day. |
| Patience | 3 | 30 / 120 / 400 | - | +1 patience | Customers wait longer. |
| Sunflower brittle | 1 | 80 | - | unlocks `recipe-2` | A new recipe. Make it by hand twice before the clerk can sell it. |
| Honey toffee | 1 | 350 | Sunflower brittle | unlocks `recipe-3` | Another new recipe. Make it by hand twice before the clerk can sell it. |
| Hire a clerk | 1 | 100 | - | unlocks `clerk` | Serves Faithful customers for you. |
| Contract board | 1 | 120 | - | unlocks `contractBoard` | Merchants post orders with a quantity and a deadline. |

**Temple / Hive**

| Upgrade | Levels | Cost per level | Requires | Effect | Description |
| --- | --- | --- | --- | --- | --- |
| The Faithful | 3 | 40 / 200 / 700 | - | +2 weight:faithful; +1 arrivals | More regular customers come. |
| Hive bond | 3 | 200 / 500 / 1100 | The Faithful | +1 supply:honey; +2 arrivals | The hive sends a little more honey, and its visitors fill the shop. |
| Errands board | 1 | 90 | The Faithful | unlocks `errandsBoard` | The hive and the temple post errands with lasting rewards. |
| Map strip | 1 | 60 | The Faithful | unlocks `map` | Reveals places around the shop as the weeks go by. |

### Weekly stages

| Stage | Days | Revenue target | Customer volume | Rival hive |
| --- | --- | --- | --- | --- |
| The first week | 7 | 240 | x1 | - |
| Gathering pilgrims | 7 | 800 | x1.5 | steals 1 Honey per morning from day 3 |
| The feast of Sweet Tooth | 7 | 1900 | x2.8 | steals 2 Honey per morning from day 2 |

### Errands

| Name | Kind | Needs | Appears from stage | Reward / effect | Description |
| --- | --- | --- | --- | --- | --- |
| The queen is sick | deliver goods | `errandsBoard`, 4 Royal tonic (Plain) | 1 | +2 supply:honey; unlocks `bee-customers` | The hive queen has a fever. Brew a royal tonic by hand and bring four. The hive will repay you with more honey, for good, and once she is well the bees will come to your shop asking for the tonic too. |
| The pilgrims' feast | deliver goods | `errandsBoard`, `oven`, 8 Honey drop (Fine) | 2 | +1 counterSpace; +2 arrivals | The faithful plan a feast. Bring eight Fine honey drops and the counter will be widened for good. |
| A splinter hive | mission: Clerk away 2 days | `errandsBoard`, `clerk` | 1 | +9 rivalRelief | Send the clerk to parley with the rival hive for two days. If it works, the honey they steal comes back for good. |

### Map places

| Place | Revealed at stage |
| --- | --- |
| Millpond | 1 |
| Old orchard | 2 |
| Sunflower hollow | 3 |

### Art slots (placeholders today: final pixel sizes, swappable files)

| Slot id | Size (px) | What it shows |
| --- | --- | --- |
| `shop-counter` | 320 x 200 | The shop counter |
| `ingredient-honey` | 96 x 96 | Honey |
| `ingredient-dark-seed` | 96 x 96 | Dark sunflower seed |
| `candy-honey-drop` | 96 x 96 | Honey drop |
| `candy-sunflower-brittle` | 96 x 96 | Sunflower brittle |
| `candy-honey-toffee` | 96 x 96 | Honey toffee |
| `station-auto-cauldron` | 240 x 180 | Second cauldron |
| `worker-clerk` | 96 x 96 | Clerk |
| `station-cauldron` | 240 x 180 | Cauldron |
| `candy-royal-tonic` | 96 x 96 | Royal tonic |
| `map-strip` | 640 x 120 | The map of the surroundings |

### Key numbers

| Setting | Value |
| --- | --- |
| Customers waiting at the counter at once | 4 |
| Customers the shop welcomes per day = counter space x | 4 |
| Hand-made batches before the clerk can sell a recipe | 2 |
| Base customers per day (stage 1) | 8 |

