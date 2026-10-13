# Elements catalog

Every game element as tables, generated from the real data files by `npm run catalog` (so it cannot drift
from the game). English names. "Unlocked by" values are internal unlock ids: see the skill tree and errands
tables for what grants them. Part of the design brief: see `README.md`.

### Ingredients

| Name | Delivered each morning (base) | Unlocked by | Notes |
| --- | --- | --- | --- |
| Honey | 2 | from the start |  |
| Royal jelly | 0 | `royal-jelly` | rare alternate of Honey: each delivered unit has a 15% chance to arrive as this instead |
| Sunflower seed | 2 | `sunflower` |  |
| Dark sunflower seed | 0 | `dark-garden` | rare alternate of Sunflower seed: each delivered unit has a 15% chance to arrive as this instead |
| Milk | 2 | `milk` |  |
| Cream from Stumpsville | 0 | `cream` | rare alternate of Milk: each delivered unit has a 15% chance to arrive as this instead |
| Blueberry | 2 | `blueberry` |  |
| Cursed blackberry | 0 | `blackberry` | rare alternate of Blueberry: each delivered unit has a 15% chance to arrive as this instead |

### Candies (recipes)

| Name | Base price | Plain batch | Extra per quality | Opens when |
| --- | --- | --- | --- | --- |
| Candy cane | 5 | 1 Honey | Fine: +1 Honey; Excellent: +2 Honey | all its ingredients are unlocked |
| Sunflower brittle | 6 | 1 Sunflower seed | Fine: +1 Sunflower seed; Excellent: +2 Sunflower seed | all its ingredients are unlocked |
| Sunflower nougat | 14 | 1 Honey + 1 Sunflower seed | Fine: +1 Honey; Excellent: +1 Honey + 1 Sunflower seed | all its ingredients are unlocked |
| Toffee | 7 | 1 Milk | Fine: +1 Milk; Excellent: +2 Milk | all its ingredients are unlocked |
| Berrycorice | 8 | 1 Blueberry | Fine: +1 Blueberry; Excellent: +2 Blueberry | all its ingredients are unlocked |
| Honey fudge | 15 | 1 Honey + 1 Milk | Fine: +1 Honey; Excellent: +1 Honey + 1 Milk | all its ingredients are unlocked |
| Honey-berry gums | 16 | 1 Honey + 1 Blueberry | Fine: +1 Honey; Excellent: +1 Honey + 1 Blueberry | all its ingredients are unlocked |
| Seed praline | 16 | 1 Sunflower seed + 1 Milk | Fine: +1 Sunflower seed; Excellent: +1 Sunflower seed + 1 Milk | all its ingredients are unlocked |
| Berry crunch | 18 | 1 Sunflower seed + 1 Blueberry | Fine: +1 Sunflower seed; Excellent: +1 Sunflower seed + 1 Blueberry | all its ingredients are unlocked |
| Berry cream chews | 19 | 1 Milk + 1 Blueberry | Fine: +1 Milk; Excellent: +1 Milk + 1 Blueberry | all its ingredients are unlocked |
| Golden truffle | 27 | 1 Honey + 1 Sunflower seed + 1 Milk | Fine: +1 Honey; Excellent: +1 Honey + 1 Sunflower seed | all its ingredients are unlocked |
| Meadow bar | 30 | 1 Honey + 1 Sunflower seed + 1 Blueberry | Fine: +1 Honey; Excellent: +1 Honey + 1 Sunflower seed | all its ingredients are unlocked |
| Berry cloud | 30 | 1 Honey + 1 Milk + 1 Blueberry | Fine: +1 Honey; Excellent: +1 Honey + 1 Milk | all its ingredients are unlocked |
| Cheesecake bites | 32 | 1 Sunflower seed + 1 Milk + 1 Blueberry | Fine: +1 Sunflower seed; Excellent: +1 Sunflower seed + 1 Milk | all its ingredients are unlocked |
| The Sweet Tooth | 46 | 1 Honey + 1 Sunflower seed + 1 Milk + 1 Blueberry | Fine: +1 Honey; Excellent: +1 Honey + 1 Sunflower seed | all its ingredients are unlocked |

### Qualities (ordered)

| Rank | Name | Price multiplier | Cost rule | Extra craft step | Unlocked by |
| --- | --- | --- | --- | --- | --- |
| 0 | Plain | x1 | the plain recipe | - | from the start |
| 1 | Fine | x1.6 | plain recipe plus the candy extra units | Bake in the oven | oven |
| 2 | Excellent | x2.2 | plain recipe plus the candy extra units | Bake in the oven, Pull on the machine | pulling-machine |
| 3 | Perfect | x3.5 | plain recipe, every ingredient replaced by its alternate | Whisper to the cauldron | magic-cauldron |

### Crafting steps and their helpers

| Step | Helper | Kind | Automated by upgrade unlock |
| --- | --- | --- | --- |
| fill | Porter mouse | mouse | `auto-fill` |
| stir | Stirrer mouse | mouse | `auto-stir` |
| oven | Oven timer | machine | `auto-oven` |
| pull | Pulling motor | machine | `auto-pull` |
| magic | The cauldron | machine | always by hand |
| form | Sculptor mouse | mouse | `auto-form` |

### Stations

| Name | Candies per batch | Batches per day | Behaviour |
| --- | --- | --- | --- |
| Cauldron | 4 | 3 | crafted by hand |
| Second cauldron | 4 | 2 | automatic every morning |

### Customer types

| Name | Asks for | Minimum quality | Budget | Patience (actions) | How common | Appears |
| --- | --- | --- | --- | --- | --- | --- |
| Faithful | one specific recipe they can afford | Plain | 6 | 6 | 5 | from the start |
| Traveler | a craving: any candy with an unlocked ingredient | Plain | 12 | 4 | 3 | from the start |
| Merchant | any candy with 2+ ingredients | Fine | 45 | 2 | 2 | from the start |
| Bee | a craving: any candy with Honey | Plain | 10 | 5 | 1.5 | after errand reward `bee-customers` |

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
| Honey yield | 5 | 15 / 40 / 100 / 250 / 550 | - | +1 supply:honey | More honey delivered each morning. |
| Bigger cauldrons | 3 | 40 / 150 / 450 | - | +1 capacity | Each batch makes more candies. |
| Second cauldron | 1 | 250 | Honey yield | adds station Second cauldron | A cauldron that makes Plain honey drops by itself every morning, using the day's honey. |
| Oven | 1 | 60 | - | unlocks `oven` | Unlocks Fine quality. |
| Pulling machine | 1 | 250 | Oven | unlocks `pulling-machine` | Unlocks Excellent quality: more ingredients, a pulling step, a better price. |
| Dark seed garden | 1 | 300 | Sunflower patch | unlocks `dark-garden` | Dark sunflower seeds, the rare alternate of sunflower seeds, now sometimes come with the morning delivery. Needed for Perfect sunflower candies. |
| Sunflower patch | 1 | 80 | - | unlocks `sunflower` | Sunflower seeds arrive every morning: opens Sunflower brittle, Sunflower nougat and more. Make a recipe by hand twice before the clerk can sell it. |
| More sunflower seeds | 4 | 40 / 100 / 220 / 450 | Sunflower patch | +1 supply:sunflower-seed | One more sunflower seed every morning. |
| More milk | 4 | 60 / 140 / 300 / 600 | - | +1 supply:milk | One more jug of milk every morning. |
| More blueberries | 4 | 80 / 180 / 380 / 750 | - | +1 supply:blueberry | One more handful of blueberries every morning. |
| Porter mouse | 1 | 90 | - | unlocks `auto-fill` | A mouse that carries every ingredient into the cauldron for you. You can still fill by hand. |
| Stirrer mouse | 1 | 160 | - | unlocks `auto-stir` | A mouse that stirs for you. You can still stir by hand. |
| Sculptor mouse | 1 | 260 | - | unlocks `auto-form` | A mouse that shapes the candies for you. You can still shape by hand. |
| Oven timer | 1 | 220 | Oven | unlocks `auto-oven` | The oven bakes on its own and takes the tray out at the right moment. You can still bake by hand. |
| Pulling motor | 1 | 420 | Pulling machine | unlocks `auto-pull` | A motor for the pulling machine. You can still pull by hand. |

**Shop**

| Upgrade | Levels | Cost per level | Requires | Effect | Description |
| --- | --- | --- | --- | --- | --- |
| Counter space | 3 | 30 / 120 / 400 | - | +1 counterSpace | The shop can welcome more customers each day. |
| Patience | 3 | 30 / 120 / 400 | - | +1 patience | Customers wait longer. |
| Hire a clerk | 1 | 100 | - | unlocks `clerk` | Serves Faithful customers for you. |
| Contract board | 1 | 120 | - | unlocks `contractBoard` | Merchants post orders with a quantity and a deadline. |
| Reputation | 5 | 120 / 300 / 700 / 1500 / 3000 | - | +6 priceBonus | Pilgrims talk: every sale brings 6% more, rounded up (at least a coin more on cheap candies), per level. |

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
| The first steps | 7 | 240 | x1 | - |
| Gathering pilgrims | 7 | 520 | x1.5 | steals 1 Honey per morning from day 3 |
| A name on the road | 7 | 1150 | x2 | steals 2 Honey per morning from day 2 |
| The pilgrims' table | 7 | 1900 | x2.4 | - |
| Whispers of the cauldron | 7 | 2800 | x2.8 | - |
| The hive's blessing | 7 | 3500 | x3 | - |
| Crowds at the door | 7 | 4000 | x3 | - |
| The long table | 7 | 4300 | x3 | - |
| The feast of Sweet Tooth | 7 | 4500 | x3 | - |

### Errands

| Name | Kind | Needs | Appears from stage | Reward / effect | Description |
| --- | --- | --- | --- | --- | --- |
| The queen is sick | deliver goods | `errandsBoard`, `oven`, 4 Candy cane (Fine) | 2 | +2 supply:honey; unlocks `bee-customers` | The hive queen has a fever. Bring four Fine candy canes. The hive will repay you with more honey, for good, and once she is well the bees will visit your shop. |
| The pilgrims' feast | deliver goods | `errandsBoard`, `oven`, `sunflower`, 8 Sunflower brittle (Fine) | 3 | +1 counterSpace; +2 arrivals | The faithful plan a feast. Bring eight Fine sunflower brittles and the counter will be widened for good. |
| A splinter hive | mission: Clerk away 2 days | `errandsBoard`, `clerk` | 2 | +9 rivalRelief | Send the clerk to parley with the rival hive for two days. If it works, the honey they steal comes back for good. |
| The magic cauldron | deliver goods | `errandsBoard`, `pulling-machine`, 4 Candy cane (Excellent) | 5 | unlocks `magic-cauldron` | The old cauldron stirs by itself when it is fed well. Bring four Excellent candy canes and it will learn to make Perfect candies from rare ingredients: royal jelly, dark seeds and the like. |
| The hive's gratitude | deliver goods | `errandsBoard`, `magic-cauldron`, `sunflower`, 8 Sunflower nougat (Fine) | 6 | unlocks `royal-jelly` | The queen is well again and the hive wants to thank you with its rarest gift. Bring eight Fine sunflower nougats for the feast and royal jelly will sometimes come with your honey. |
| The offering to Sweet Tooth | deliver goods | `errandsBoard`, `magic-cauldron`, `royal-jelly`, `dark-garden`, `cream`, `blackberry`, 3 The Sweet Tooth (Perfect) | 9 | unlocks `ending` | The cult asks for one thing: three Perfect Sweet Tooth candies, made of royal jelly, dark seeds, Stumpsville cream and cursed blackberries, laid before Sweet Tooth itself. After that the shop runs on and the cult is pleased. |
| The scarecrow mice | deliver goods | `errandsBoard`, `oven`, `sunflower`, 6 Candy cane (Fine) | 3 | +2 supply:sunflower-seed | Crows keep eating the seeds in the hollow. Bring six Fine candy canes to the scarecrow mice and they will guard the patch for good: two more sunflower seeds every morning. |
| The Stumpsville dairy cart | deliver goods | `errandsBoard`, `sunflower`, 8 Sunflower brittle (Plain) | 4 | unlocks `milk`; +1 supply:milk | A cart from Stumpsville has broken a wheel at your door, loaded with milk. Feed the dairy mice eight sunflower brittles and they will leave milk at your door every morning. |
| The bramble thicket | deliver goods | `errandsBoard`, `oven`, `sunflower`, 6 Sunflower nougat (Fine) | 5 | unlocks `blueberry`; +1 supply:blueberry | Behind the mill grows a thicket full of blueberries and thorns. Bring six Fine sunflower nougats to the thicket mice and the berries are yours, every morning. |
| The Stumpsville trade route | deliver goods | `errandsBoard`, `map`, `magic-cauldron`, `milk`, `oven`, 6 Honey fudge (Fine) | 6 | unlocks `cream` | The dairy mice of Stumpsville used to make the richest cream in the valley. Bring six Fine honey fudges to open the old trade route: their cream will sometimes come with your milk. |
| The cursed bramble | deliver goods | `errandsBoard`, `magic-cauldron`, `blueberry`, `oven`, 6 Honey-berry gums (Fine) | 7 | unlocks `blackberry` | One bramble bears black berries that whisper. The thicket mice will let you pick them if you bring six Fine honey-berry gums: cursed blackberries will sometimes come with your blueberries. |

### Map places

| Place | Revealed at stage |
| --- | --- |
| Millpond | 3 |
| Old orchard | 4 |
| Sunflower hollow | 5 |
| Stumpsville road | 6 |
| Market stall | 7 |
| Roadside inn | 8 |

### Art slots (placeholders today: final pixel sizes, swappable files)

| Slot id | Size (px) | What it shows |
| --- | --- | --- |
| `shop-counter` | 320 x 200 | The shop counter |
| `ingredient-honey` | 96 x 96 | Honey |
| `ingredient-dark-seed` | 96 x 96 | Dark sunflower seed |
| `candy-candy-cane` | 96 x 96 | Candy cane |
| `candy-sunflower-brittle` | 96 x 96 | Sunflower brittle |
| `station-auto-cauldron` | 240 x 180 | Second cauldron |
| `worker-clerk` | 96 x 96 | Clerk |
| `station-cauldron` | 240 x 180 | Cauldron |
| `map-strip` | 640 x 120 | The map of the surroundings |
| `customer-faithful` | 96 x 120 | A Faithful customer |
| `customer-traveler` | 96 x 120 | A Traveler |
| `customer-merchant` | 96 x 120 | A Merchant |
| `customer-bee` | 96 x 120 | A Bee customer |
| `ingredient-royal-jelly` | 96 x 96 | Royal jelly |
| `ingredient-sunflower-seed` | 96 x 96 | Sunflower seed |
| `candy-sunflower-nougat` | 96 x 96 | Sunflower nougat |
| `ingredient-milk` | 96 x 96 | Milk |
| `ingredient-stumpsville-cream` | 96 x 96 | Cream from Stumpsville |
| `ingredient-blueberry` | 96 x 96 | Blueberry |
| `ingredient-cursed-blackberry` | 96 x 96 | Cursed blackberry |
| `candy-toffee` | 96 x 96 | Toffee |
| `candy-berrycorice` | 96 x 96 | Berrycorice |
| `candy-honey-fudge` | 96 x 96 | Honey fudge |
| `candy-honey-berry-gums` | 96 x 96 | Honey-berry gums |
| `candy-seed-praline` | 96 x 96 | Seed praline |
| `candy-berry-crunch` | 96 x 96 | Berry crunch |
| `candy-berry-cream-chews` | 96 x 96 | Berry cream chews |
| `candy-golden-truffle` | 96 x 96 | Golden truffle |
| `candy-meadow-bar` | 96 x 96 | Meadow bar |
| `candy-berry-cloud` | 96 x 96 | Berry cloud |
| `candy-cheesecake-bites` | 96 x 96 | Cheesecake bites |
| `candy-sweet-tooth` | 96 x 96 | The Sweet Tooth |

### Key numbers

| Setting | Value |
| --- | --- |
| Customers waiting at the counter at once | 4 |
| Customers the shop welcomes per day = counter space x | 4 |
| Hand-made batches before the clerk can sell a recipe | 2 |
| Base customers per day (stage 1) | 8 |

