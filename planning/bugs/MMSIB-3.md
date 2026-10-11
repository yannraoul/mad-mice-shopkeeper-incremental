# MMSIB-3 — A better quality could not be sold to a customer with a smaller budget

**Reported:** With Fine honey drops in stock, a Faithful customer wanting "at least Plain" could not be given one: it felt contradictory.

**Root cause:** The engine accepted any quality at or above the customer's minimum, but then charged that quality's full price and refused when it exceeded the budget (Fine costs 8, a Faithful budget is 6), so the Serve button was disabled. "At least Plain" therefore meant "Plain only" for cheap customers. The clerk's `workerChoice` had the same price test.

**Fix:** New helpers `salePrice` (price of the quality, capped at the customer's budget) and `canAfford` (the quality they asked for, at minimum, is within budget) in `src/engine/economy.ts`. `serve`, the clerk, the simulator bot and the Serve screen use them: a better quality is always acceptable and the customer pays at most their budget (Fine to a budget-6 Faithful: 6 coins). `over-budget` now only fires when even the asked-for quality is out of reach. The clerk sells the cheapest stocked quality that satisfies the customer.

**Verified:** 5 new engine tests (capped price, full price when affordable, refusal only beyond the asked-for quality, clerk sells Fine for 6, cost rule). In the browser: a Faithful card with only Fine in stock showed an enabled "Serve Fine (6)", serving earned 6; a Traveler showed "Serve Fine (8)".

**Open follow-up:** Selling a better quality at a discount means plain customers absorb high-quality stock at their budget; whether the cap should be lower (a generosity penalty) is an M6 balance question.
