# Customer cravings, happiness and tips

Status: **built in MMSIM-12** (see `planning/features/MMSIM-12.md`; the alternate counts 3 units, the merchant needs 1 ingredient for now). The forecast lean and the clerk question below are still open.

## Why

With 15 candies and 12 candies crafted a day, "one customer wants one exact candy" makes most recipes irrelevant and the
stock unmanageable. A craving for an ingredient lets many candies serve one customer, so crafting and serving both
become decisions, and complex candies are valuable without being required.

## What a customer wants

Each customer type has a kind of want:

| Type | Wants | Notes |
|---|---|---|
| Faithful | a specific candy ("my usual") plus a minimum quality | keeps the basic recipes relevant |
| Traveler | one ingredient ("something with honey"), sometimes two | any candy containing it works |
| Bee | honey or royal jelly cravings | replaces the old tonic-only rule (the tonic becomes an ordinary recipe) |
| Merchant | a minimum quality and at least N ingredients in the candy | big budget, little patience |
| (later types) | e.g. a pilgrim wants a candy never served before | easy to add as data |

Which ingredients are craved is limited to the ones **unlocked** by the player; the day's forecast can lean toward one
("honey is on every tongue today"), reusing the forecast slot that exists today.

## Matching and happiness

- A candy satisfies an ingredient craving if it contains that ingredient (an alternate counts as its base).
- **Happiness is 1 to 3 hearts**:
  - ingredient craving: hearts = units of the craved ingredient in the candy served (a Perfect candy counts its alternate
    as 2 units). Candy cane Plain = 1, Fine = 2, Excellent = 3; a nougat is 1 or 2 honey.
  - specific candy: 1 heart at the minimum quality, +1 per quality tier above it, up to 3.
  - merchant: hearts = number of ingredients in the candy (1, 2, 3 or more).
- **Tip** = price x 0.5 x (hearts - 1) / 2, so 0% at 1 heart and +50% at 3 hearts. All of this is balance data.
- **Budget caps the price, not the tip.** A rich merchant takes a Sweet Tooth; a poor traveler cannot afford one, so
  the expensive candies are not a universal joker.
- Refusing is still possible and costs nothing; a customer who leaves unserved is lost, as today.

## The decision this creates

A traveler (budget 12) craving honey, with a candy cane Excellent (3 honey, price 11, 3 hearts, tip about +5) against a
honey fudge Plain (price 15, over budget so paid 12, 1 heart, no tip) or a nougat Fine. The cheap but very happy
candy can beat the more expensive one, and the choice depends on stock, which pushes the crafting plan.

## Serve screen

- The customer card states the want ("Wants: honey", "Wants: Honey drop, Fine or better").
- Only candies from stock that satisfy the want are offered, best expected payout first, each showing price, hearts and
  the expected tip. Quality and stock rules stay as today. Stock keys stay `candy:quality`.
- The clerk still serves the simple wants on his own once trained; training is per candy, so it needs a rule for
  cravings (open question below).

## Contracts and errands

Contracts stay specific (a candy, a quantity, a deadline). Errands that deliver a candy stay specific too.

## Engine and balance changes

- Customer type data: `want` kind and its parameters, replacing `onlyWants`; stock matching in the engine; the sale
  event records hearts and tip; the journal and report show tips.
- Bots choose the best payout among matches and plan batches from the expected cravings.
- `npm run balance` reports tips earned and the share of customers served at 3 hearts.

## Open questions

1. How does the clerk's training (served by hand N times) work with cravings: per ingredient, per candy, or "he serves
   plain candies of your best match"?
2. Is happiness shown only as hearts at the counter, or also tracked (a "regulars" stat that raises Faithful weight)?
