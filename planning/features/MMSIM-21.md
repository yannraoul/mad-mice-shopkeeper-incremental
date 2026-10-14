# MMSIM-21 — Weekdays, part A: market day

Motivation: a week only has a rhythm if its days differ (`docs/quests-and-cozy-loop-v4.md`, section 2). This first slice adds one special day; the rest day (cleaning) and a delivery day come later.

- IN:
  - New content table `content/core/weekdays.json` (schema `Weekday`): `day` (1 to 7), `nameKey`, `noteKey`, `arrivalsMult`, `contractMult`, `weights` (per customer type, like the forecasts). Days without a row are ordinary.
  - **Market day** is day 6 of every week: walk-ins x1.3, travelers and merchants twice as likely, and a contract handed in that day pays x1.25 (the posted reward is a minimum, as before; the multiplier applies to the final payout, so saving a delivery for market day pays, and the delivery mouse benefits too).
  - `weekdayOf(c, s)` in `economy.ts` derives it from the day number, so **no State change and no save migration**.
  - The board shows the day's name and what it does (desktop note; the name leads the forecast line on the phone), and contracts list their reward with the multiplier.
  - Content check: unknown customer types and two rows on the same day are errors. Strings EN/FR.
- OUT: rest day and cleaning, delivery day, a market-day-only stall or contract type, the day name in the header pill.
- Decisions: market day on day 6 (the doc said day 3 or 6; a late-week peak rewards saving stock during the week). Multipliers are first guesses.
- Verified: `npm run check`, `npm run check:content`, `npm test` (new `src/engine/weekdays.test.ts`; the balance bands did not drift). Not checked in the browser.
- Open decisions: whether the multipliers are right after a playtest; whether the header should show the weekday name.
