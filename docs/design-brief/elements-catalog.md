# Elements catalog

Every game element as tables, generated from the real data files by `npm run catalog` (so it cannot drift
from the game). English names. "Unlocked by" values are internal unlock ids: see the skill tree and errands
tables for what grants them. Part of the design brief: see `README.md`.

### Ingredients

| Name | Delivered each morning (base) | Unlocked by | Notes |
| --- | --- | --- | --- |
| Honey | 2 | from the start |  |
| Royal jelly | 0 | `royal-jelly` | rare alternate of Honey: each delivered unit has a 25% chance to arrive as this instead |
| Sunflower seed | 2 | `sunflower` |  |
| Dark sunflower seed | 0 | `dark-garden` | rare alternate of Sunflower seed: each delivered unit has a 25% chance to arrive as this instead |
| Milk | 2 | `milk` |  |
| Cream from Stumpsville | 0 | `cream` | rare alternate of Milk: each delivered unit has a 25% chance to arrive as this instead |
| Blueberry | 2 | `blueberry` |  |
| Cursed blackberry | 0 | `blackberry` | rare alternate of Blueberry: each delivered unit has a 25% chance to arrive as this instead |

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
| Bigger cauldrons | 5 | 40 / 150 / 450 / 1000 / 2400 | - | +1 capacity | Each batch makes more candies. |
| An extra batch | 1 | 6000 | - | +1 batches | One more batch of the hand cauldron each day. |
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
| Order book | 1 | 300 | Second cauldron | unlocks `order-book` | The Second cauldron first works on the open contracts and delivery errands, with the cheapest quality that qualifies, then makes the candy you prefer. Pick it on the Craft screen. |
| Delivery mouse | 1 | 420 | Order book | unlocks `delivery-mouse` | A mouse that hands in contracts and delivery errands as soon as the stock covers them (never the final quest). |
| Dark pantry | 2 | 250 / 600 | - | +1 store:dark-seed; +0.05 altChance:dark-seed | A cool pantry for dark seeds: the shelf holds one more and they arrive a little more often. |
| Cold cellar | 2 | 180 / 420 | - | +1 store:stumpsville-cream; +0.05 altChance:stumpsville-cream | A cold cellar for Stumpsville cream: the shelf holds one more and it arrives a little more often. |
| Bramble basket | 2 | 220 / 500 | - | +1 store:cursed-blackberry; +0.05 altChance:cursed-blackberry | A deep basket for cursed blackberries: the shelf holds one more and they arrive a little more often. |

**Shop**

| Upgrade | Levels | Cost per level | Requires | Effect | Description |
| --- | --- | --- | --- | --- | --- |
| Counter space | 6 | 30 / 120 / 400 / 1000 / 2200 / 4500 | - | +1 counterSpace | The shop can welcome more customers each day. |
| Patience | 5 | 30 / 120 / 400 / 900 / 2000 | - | +1 patience | Customers wait longer. |
| Hire a clerk | 1 | 100 | - | unlocks `clerk` | Serves Faithful customers for you. |
| Contract board | 1 | 120 | - | unlocks `contractBoard` | Merchants post orders with a quantity and a deadline. |
| Reputation | 7 | 120 / 300 / 700 / 1500 / 3000 / 5500 / 9000 | - | +6 priceBonus | Pilgrims talk: every sale brings 6% more, rounded up (at least a coin more on cheap candies), per level. |
| Foreman mouse | 1 | 600 | Hire a clerk, Porter mouse, Stirrer mouse, Sculptor mouse | unlocks `routine` | A mouse that runs the day: with your helpers it makes candy, serves the counter and waits for you in the evening, unless you hire an accounting mouse. A switch lets you take over at any moment. |
| Accounting mouse | 1 | 1500 | Foreman mouse | unlocks `accountant` | With the routine on, a mouse with round glasses runs the evening too: it buys the cheapest upgrade you can afford, again and again, then puts the shop to sleep. |

**Temple / Hive**

| Upgrade | Levels | Cost per level | Requires | Effect | Description |
| --- | --- | --- | --- | --- | --- |
| The Faithful | 3 | 40 / 200 / 700 | - | +2 weight:faithful; +1 arrivals | More regular customers come. |
| Hive bond | 3 | 200 / 500 / 1100 | The Faithful | +1 store:royal-jelly; +0.05 altChance:royal-jelly; +2 arrivals | The hive keeps more royal jelly for you: the shelf holds one more and it arrives a little more often. Its visitors fill the shop. |
| Errands board | 1 | 90 | The Faithful | unlocks `errandsBoard` | The hive and the temple post errands with lasting rewards. |
| Map strip | 1 | 60 | The Faithful | unlocks `map` | Reveals places around the shop as the weeks go by. |

### Quests

| Quest | Needs | Goals | Coins (bonus) | Customer volume once done | Rival hive once done |
| --- | --- | --- | --- | --- | --- |
| The first steps | - | earn 240 coins in all | 0 | x1.5 | steals 1 Honey per morning from day 3 of the week |
| Gathering pilgrims | `q1` | earn 860 coins in all | 0 (+50 within 7 days) | x2 | steals 2 Honey per morning from day 2 of the week |
| A name on the road | `q2` | earn 2450 coins in all | 0 (+100 within 7 days) | x2.4 | - |
| The pilgrims' table | `q3` | earn 5200 coins in all | 0 (+150 within 7 days) | x2.8 | - |
| Whispers of the cauldron | `q4` | earn 8800 coins in all | 0 (+250 within 7 days) | x3 | - |
| The hive's blessing | `q5` | earn 12800 coins in all | 0 (+350 within 7 days) | x3 | - |
| Crowds at the door | `q6` | earn 18000 coins in all | 0 (+450 within 7 days) | x3 | - |
| The long table | `q7` | earn 25000 coins in all | 0 (+600 within 7 days) | x3 | - |
| A helping paw | `q1` | own porter-mouse | 60 | - | - |
| The queen's thanks | `q1` | finish errand queen-fever | 120 | - | - |
| Peace with the hive | `q1` | finish errand rival-hive | 80 | - | - |
| The pilgrims' feast | `q2` | finish errand pilgrim-feast | 200 | - | - |
| The scarecrow watch | `q2` | finish errand scarecrow-mice | 150 | - | - |
| Milk and honey | `q3` | finish errand dairy-cart | 250 | - | - |
| Pulled to excellence | `q3` | own pulling-machine | 200 | - | - |
| The shop runs itself | `q3` | own foreman-mouse | 800 | - | - |
| The bramble way | `q4` | finish errand bramble-thicket | 300 | - | - |
| The cauldron stirs | `q4` | finish errand magic-cauldron | 400 | - | - |
| The hive's gratitude | `q5` | finish errand royal-gift | 500 | - | - |
| The road to Stumpsville | `q5` | finish errand stumpsville-trade | 500 | - | - |
| The cursed harvest | `q6` | finish errand cursed-bramble | 650 | - | - |

### Errands

| Name | Kind | Needs | Opens with quest | Reward / effect | Description |
| --- | --- | --- | --- | --- | --- |
| The queen is sick | deliver goods | `errandsBoard`, `oven`, 4 Candy cane (Fine) | q1 | +2 supply:honey; unlocks `bee-customers` | The hive queen has a fever. Bring four Fine candy canes. The hive will repay you with more honey, for good, and once she is well the bees will visit your shop. |
| The pilgrims' feast | deliver goods | `errandsBoard`, `oven`, `sunflower`, 8 Sunflower brittle (Fine) | q2 | +1 counterSpace; +2 arrivals | The faithful plan a feast. Bring eight Fine sunflower brittles and the counter will be widened for good. |
| A splinter hive | mission: Clerk away 2 days | `errandsBoard`, `clerk` | q1 | +9 rivalRelief | Send the clerk to parley with the rival hive for two days. If it works, the honey they steal comes back for good. |
| The magic cauldron | deliver goods | `errandsBoard`, `pulling-machine`, 4 Candy cane (Excellent) | q4 | unlocks `magic-cauldron` | The old cauldron stirs by itself when it is fed well. Bring four Excellent candy canes and it will learn to make Perfect candies from rare ingredients: royal jelly, dark seeds and the like. |
| The hive's gratitude | deliver goods | `errandsBoard`, `magic-cauldron`, `sunflower`, 8 Sunflower nougat (Fine) | q5 | unlocks `royal-jelly` | The queen is well again and the hive wants to thank you with its rarest gift. Bring eight Fine sunflower nougats for the feast and royal jelly will sometimes come with your honey. |
| The offering to Sweet Tooth | deliver goods | `errandsBoard`, `magic-cauldron`, `royal-jelly`, `dark-garden`, `cream`, `blackberry`, 3 The Sweet Tooth (Perfect) | q8 | unlocks `ending` | The cult asks for one thing: three Perfect Sweet Tooth candies, made of royal jelly, dark seeds, Stumpsville cream and cursed blackberries, laid before Sweet Tooth itself. After that the shop runs on and the cult is pleased. |
| The scarecrow mice | deliver goods | `errandsBoard`, `oven`, `sunflower`, 6 Candy cane (Fine) | q2 | +2 supply:sunflower-seed | Crows keep eating the seeds in the hollow. Bring six Fine candy canes to the scarecrow mice and they will guard the patch for good: two more sunflower seeds every morning. |
| The Stumpsville dairy cart | deliver goods | `errandsBoard`, `sunflower`, 8 Sunflower brittle (Plain) | q3 | unlocks `milk`; +1 supply:milk | A cart from Stumpsville has broken a wheel at your door, loaded with milk. Feed the dairy mice eight sunflower brittles and they will leave milk at your door every morning. |
| The bramble thicket | deliver goods | `errandsBoard`, `oven`, `sunflower`, 6 Sunflower nougat (Fine) | q4 | unlocks `blueberry`; +1 supply:blueberry | Behind the mill grows a thicket full of blueberries and thorns. Bring six Fine sunflower nougats to the thicket mice and the berries are yours, every morning. |
| The Stumpsville trade route | deliver goods | `errandsBoard`, `map`, `magic-cauldron`, `milk`, `oven`, 6 Honey fudge (Fine) | q5 | unlocks `cream` | The dairy mice of Stumpsville used to make the richest cream in the valley. Bring six Fine honey fudges to open the old trade route: their cream will sometimes come with your milk. |
| The cursed bramble | deliver goods | `errandsBoard`, `magic-cauldron`, `blueberry`, `oven`, 6 Honey-berry gums (Fine) | q6 | unlocks `blackberry` | One bramble bears black berries that whisper. The thicket mice will let you pick them if you bring six Fine honey-berry gums: cursed blackberries will sometimes come with your blueberries. |

### Map places

| Place | Opens with quest | Cost | Income a day |
| --- | --- | --- | --- |
| Millpond | q2 | free | 3 |
| Old orchard | q3 | free | 5 |
| Sunflower hollow | q4 | free | 8 |
| Stumpsville road | q5 | free | 10 |
| Market stall | q6 | free | 12 |
| Roadside inn | q7 | free | 18 |
| Cobbled market | q5 | 600 | 30 |
| Pilgrim hostel | q6 | 1600 | 80 |
| Fairground | q7 | 3800 | 190 |

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
| Base customers per day (before any quest) | 8 |

