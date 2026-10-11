# MMSIB-8 — Two errands for the same problem: the peace offering competed with the real fix

**Reported (playtest):** Having both "A peace offering" and "A splinter hive" for the rival hive is counter-intuitive: the offering costs honey drops that you then cannot sell to earn the coins for the clerk, so the "quick" solution slows down the real one. The other part of the MMSIB-6 fix (grace period, announcement, visible way out) was fine.

**Root cause:** The peace offering (MMSIB-6) was added to give an answer that needs no clerk and no delay, but it consumed the same early resource (honey drops) the player needs to afford the clerk, and the two errands overlapped in purpose.

**Fix:** The `honey-tribute` errand and its strings were removed. Kept from MMSIB-6: the grace period (`rival.startsOnDay`), the day-1 announcement and the week-ahead heads-up, the gentler first dose (1 honey in stage 2), the stage-bar help line pointing at the errand that solves it, the "Against the rival hive" tag, and the splinter-hive mission being available from stage 1 so it can be prepared. The only cure is now the splinter-hive mission (Errands board + clerk).

**Verified:** Tests for the rival grace period, floor and relief by the mission still pass; the peace-offering tests were deleted. `npm run balance` guards pass (competent player clears stages on days 7 / 28 / 49).

**Open follow-up:** With a single cure, the cost to get out of the theft is Faithful (40) + Errands board (90) + clerk (100) coins of upgrades, plus the mission's 2 days; the grace period (stage 2: from day 3) is what makes that possible. Watch for it in the next playtest.
