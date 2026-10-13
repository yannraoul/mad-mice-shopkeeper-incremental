# MMSIB-18 — Playtest 4 quick fixes: pip overflow, stock readability, Sweet Tooth one at a time, silent Second cauldron

**Reported (playtest 4):**
1. With more than four units of an ingredient the dots overflowed the card.
2. "Candy in stock" was one long line: hard to see which candy exists in which quality.
3. The Sweet Tooth should be made one at a time, not by the batch.
4. "The Second cauldron does not seem to produce anything."

**Root causes:**
1. The shelf strip drew one pip per delivered unit with no limit.
2. The board joined every `candy:quality` pair into one string.
3. Every candy used the cauldron's batch size.
4. It does produce (the player's own save shows 14 plain sunflower brittle made that morning and 78 in stock), but nothing on screen said what it had made, and a plain pile of the preferred candy looks like nothing.

**Fix:**
1. Four units or fewer keep the pips; more show a "left/total" label in the same strip.
2. The stock is a table: one row per candy with its picture, one column per quality (short names P, F, E, PP; S, F, E, P in French), "·" for none. Used in every place the stock was a sentence. The icon rings now cover all four qualities (the legend said three).
3. A candy can carry `batch` (a fixed batch size): the Sweet Tooth has `batch: 1`. Engine, Second cauldron and Craft view all use it.
4. The Craft screen says what the automatic cauldron made this morning, or that it made nothing for lack of ingredients (`DayReport.autoMade`, save-safe default).

**Verified:** `npm run check`, `npm test` (219), balance unchanged for pacing.

**Open follow-up:** the Sweet Tooth's one-at-a-time rule makes the final quest slower: the alternates rework (docs/alternates-and-economy-v3.md) decides how much.
