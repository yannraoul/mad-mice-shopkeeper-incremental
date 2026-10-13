# MMSIM-16 — The Second cauldron grows up: order book and delivery mouse

Motivation: slice 4 of `docs/crafting-rework-v2.md`. The Second cauldron only ever made plain candy cane; with contracts and delivery errands the player's day was still "look at what is asked, make it by hand". Now the cauldron can work on what is asked, and a mouse can hand it in.

- IN:
  - **Order book** (kitchen branch, 300 coins, stage 3, needs the Second cauldron): at dawn the Second cauldron first works on the open orders, then makes the **preferred candy** (chosen on the Craft screen, default candy cane) with what the orders leave.
    - Orders = open contracts (soonest deadline first), then delivery errands under way, one demand per row.
    - For each demand it makes the **cheapest quality at or above the one asked** that it can make: unlocked, and with no step only hands can do (the whisper of Perfect). Candies already in stock count, and earlier demands set their candies aside first, so two orders never count the same stock.
    - It stops when its batches or the day's ingredients run out; a demand it cannot finish is left to the player.
  - **Delivery mouse** (kitchen branch, 420 coins, stage 4, needs the order book): hands in every open contract and delivery errand that stock now covers, at dawn after the cauldron has worked and after every batch the player makes by hand. **Never the final quest**: the ending stays a moment the player chooses.
  - The order lives in the state (`State.autoCandy`, engine action `setAutoCandy`, fail code `no-order-book`); the station keeps its content default. Save version 9 with a migration.
  - The Craft screen gets an **Order book** card: the orders the cauldron will work on tomorrow (marked "by hand" when it cannot make that quality), the preferred-candy select, and a line about the delivery mouse.
  - Contracts are now posted before the cauldron runs at dawn, so it sees them the same morning (same random draws as before).
  - Strings EN/FR; smart bot buys both upgrades last; catalog regenerated.
- OUT: the cauldron's own minigame-free upgrades such as more batches; wages; choosing a preferred quality (always the station's plain); animated mice.
- Decisions taken where the design left room:
  - Delivery by the mouse also follows hand batches, not only dawn: the doc said "when a batch finishes".
  - Without the order book nothing changes: the cauldron makes plain candy cane.
  - The preferred candy is made in plain quality only; it may use ingredients the player wanted, so the card names it.
  - Helper prices are guesses; the bots do not use the new features (they just buy them), so the balance run shows no change in pacing.
- Verified: `npm run check`, `npm test` (a new `src/engine/orderBook.test.ts` and a view test), `npm run check:content`, `npm run balance` (unchanged pacing).
- Open decisions: whether the preferred quality should be choosable; whether a stocked-up demand should skip the delivery mouse for a customer who wants the same candy; bots that use the order book.
