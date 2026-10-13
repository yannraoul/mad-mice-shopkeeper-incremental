# Alternates v3 and the late economy (alternates built as MMSIM-17; the economy part moved to the v4 doc)

Source: playtest 4 and the save at stage 8 (day 64). Nothing here is built yet; the open questions are at the end.

## 1. What the save tells us
- **Money is not a constraint after stage 4.** 8953 coins unspent at stage 8, all 26 upgrades bought by stage 6 (week 8). Weeks beat their target by 15 to 50 percent (5403 / 3500, 4659 / 4000).
- **The limit is customers, not ingredients.** 32 arrivals a day at the counter cap, 35 candies crafted a day, yet 78 plain brittle, 43 excellent Sweet Tooth, 28 nougat and about 200 more in stock. Ingredients unused in the shop: honey 10, milk 7, blueberry 6 on a single morning.
- **The Second cauldron runs** (14 plain brittle that morning, preferred candy) but is invisible and the preferred candy is the cheapest: it adds to the pile. MMSIB-18 makes it visible.
- **Alternates today are an afterthought**: 15 percent of each delivered base unit, replaced in the supply, sold at closing for 5. Perfect asks for an alternate in place of every ingredient, so it is rarely made.
- Stage 3 feels slow, then milk, reputation and tips make cash "flow": the curve is flat early and steep late.

## 2. Proposal: alternates are a small stock you keep
- Each day, each unlocked alternate has a **chance (proposed 25 percent)** to be delivered: **one unit**, never replacing a base unit.
- The shop **stores at most 1 of each alternate** (2 or 3 with upgrades). If the store is full, no new one arrives that day.
- **They carry over** and are **not sold at closing**. Base leftovers still sell for 1 coin.
- **Upgrades raise the cap and the chance** per alternate; the hive bond fits "2 royal jelly" naturally (see 5).

### Perfect = Excellent + one alternate
- Perfect is the **Excellent recipe plus one unit of one alternate**, the one that **fits the candy** (a field on the candy, `perfectAlt`). Rising quality always means more ingredients: Plain, then Fine (+), Excellent (+), Perfect (+ alternate).
- The batch size stays, so one alternate turns a whole batch into Perfect: a precious unit, a real choice of when to spend it.
- Proposed fits (to be validated, French names too):

| Candy | Alternate | Why |
| --- | --- | --- |
| Candy cane, Honey fudge, Honey-berry gums, Sunflower nougat | Royal jelly | honey is the soul of it |
| Sunflower brittle, Seed praline, Berry crunch | Dark seed | the seed is the crunch |
| Toffee, Berry-cream chews | Stumpsville cream | milk and cream |
| Berrycorice, Cheesecake bites | Cursed blackberry | the dark fruit note |
| Golden truffle, Meadow bar, Berry cloud | to choose (one of its ingredients' alternates) | |
| Sweet Tooth | see questions | |

## 3. Economy consequences
- Perfect sells for more (x3.5 today) but is gated by about one alternate per few days per kind, so Perfect becomes a **weekly treat** and contracts or errands ask for it.
- Alternates stop being coins: surplus income from them (up to about 40 a day late) disappears. Base leftovers stay.
- Perfect becomes the main sink for the idle stock of Excellent; **stage targets must be refit** (bots must learn to keep and spend alternates). Targets at stages 7 to 9 should rise, since money is plentiful and nothing is left to buy.
- **Late sinks needed**: stages 7 to 9 have nothing to buy. Options: more levels of counter space, cauldron size, reputation and patience; paying to open places on the map; a second automatic cauldron; alternate store upgrades (section 5).
- **Stage 3 slow**: lower its target a little or give stage 2 and 3 a small early income (a place on the map earlier).

## 4. The Sweet Tooth
- Made **one at a time** (done, MMSIB-18). Final quest = 3 Perfect Sweet Tooth.
- A Perfect Sweet Tooth needs one alternate: if it must be **one of each of the four** (the real feel of the sweet tooth) it needs 4 alternates for one candy and 12 for the quest: a long chase with stores of 1 or 2. If **one alternate of choice**, three batches. I suggest 1 of each of two, as a middle path, or one of each of four with the stores raised to 3 by then. Your call.

## 5. Hive bond and the upgrade list
- Hive bond (stage 2, after Faithful) is bought late because honey is rarely short. Proposal: it becomes the **alternate store** upgrade for royal jelly (level 1: store 2; later levels also raise the chance), and loses its extra honey (honey comes from honey yield). Same idea for the other three alternates, in the branch of their ingredient (dark garden, dairy, bramble).
- Missing upgrades: by stage 6 everything is bought. Either spread the levels over more stages (higher level counts, costs scaling), or fewer stages (7?). I prefer more levels and the late sinks above over cutting stages.

## 6. Questions
1. Chance per day per alternate: 25 percent, or lower for rarer ones (cursed blackberry)?
2. Store sizes: 1, then 2 with the hive-bond style upgrade, then 3? One upgrade per alternate?
3. Sweet Tooth Perfect: one of each of the four alternates, two, or one of choice?
4. Mixed candies: one alternate chosen by me from the table above, or the player picks any of the alternates of its ingredients when making Perfect?
5. Should the Second cauldron ever make Perfect (it cannot whisper), or only Excellent at most?
6. Stages: keep nine and add sinks, or reduce?
