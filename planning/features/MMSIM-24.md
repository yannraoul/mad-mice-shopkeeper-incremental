# MMSIM-24 — Late game: a fourth batch, and customers who leave when nothing fits

Motivation (playtest of a 100 % save, 2026-10-16): the last reputation upgrade (9,000) took days of doing nothing on automatic, and refusing a customer nothing in stock could satisfy cost the others a patience turn, which felt unfair.

- IN:
  - Node `extra-batch` (kitchen, one level, 6,000 coins): stat `batches` +1, applied each morning to stations that are not automatic (hand cauldron 3 to 4). `batches` is a valid modifier stat; strings EN/FR.
  - Setting `stuckLeaveTurns` (2). `Customer.stuck` (optional, absent = 0) counts the turns a customer has had nothing servable (by the player or a worker). After each served or refused customer, the others are re-checked; at `stuckLeaveTurns` they leave (`left` event, counted as lost), without touching anyone's patience. No `SAVE_VERSION` bump: the field is optional and the save schema accepts it; old saves load unchanged.
  - `refuse` no longer drains the others' patience (serving still does). The routine's last resort (refuse the first customer when nobody can be served) is therefore free.
  - Engine tests: refusing is free, a stuck customer leaves after two turns. The simulator bot buys `extra-batch` before the last two reputation levels (median day 36 smart / 40 casual); the stock-on-open band in `balance.test.ts` goes from 250 to 280 on purpose (more production, 260 at 98 days). Campaign pacing is unchanged: final quest median day 57 (smart) and 65 (casual).
- OUT: a `?endgame=` dev hook for a mock end-game save (dev hooks cover unlocks, stage, money, completed but not node levels); the end screen (the summoning); counter scene and the other ideas in `planning/BACKLOG.md`.
- Verified: `npm run check`, `npm test`, `npm run check:content`, `npm run balance`. Not checked in the browser.
