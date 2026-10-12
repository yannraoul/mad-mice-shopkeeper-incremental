# MMSIB-13 — Playtest 2 follow-up: base supply 2, alternates sold, contracts pay for quality, reputation

**Reported:** (1) Selling leftovers does not fix "I buy the first honey upgrade and cannot use it": 3 honey already covers the 3 batches. (2) Alternates should be sold too, for more, not carried over. (3) Does a contract pay more when handed a better quality? (4) Reputation at 4% is nothing on a 5 coin candy.

**Root cause:** (1) Base honey equalled the number of batches, so no level of "more honey" had a use until Fine. (3) The posted reward was fixed at the asked quality. (4) The bonus was rounded to the nearest coin, so +4% on 5 coins is 0.

**Fix:** (1) Honey and sunflower seeds start at 2 a day, so the first upgrade makes 3 and matches the 3 batches. To keep the pacing, honey has one more level (5) and sunflower one more (4), all cheaper (honey 15 / 40 / 100 / 250 / 550, sunflower 40 / 100 / 220 / 450). (2) Alternates are sold at closing like the rest, for 5 coins each (a base unit is 1); the carry-over of MMSIB-12 is gone. (3) The posted contract reward is a minimum ("from 20 coins"): the cheapest qualities that qualify are handed over first, and if what is handed over is worth more (each unit at its own price x the contract multiplier) that is paid instead. Errand rewards stay fixed. (4) Reputation is +6% per level, rounded up, so one level is at least a coin on cheap candies (5 coins sells for 6, a Fine cane for 9); five levels are about +30%.

**Verified:** `npm run check`, `npm test` (189), `npm run balance`: competent and average bots now both finish the nine stages around day 63 to 70 (average repeats about one and a half weeks), stage targets were lowered to 240 / 520 / 1050 / 1650 / 2300 / 2700 / 3100 / 3300 / 3450 because weeks 2 to 4 earn less with 2 honey a day.

**Open follow-up:** the first days are tighter (8 candies on day 1, not 12); week 2 is the first to feel the difference. Alternates sold for 5 mean a Perfect batch is worth less than selling the jelly would suggest early on only if the Perfect price stays near 18; to watch when the Sweet Tooth arrives.
