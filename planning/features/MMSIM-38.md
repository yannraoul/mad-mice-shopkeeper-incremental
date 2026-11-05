# MMSIM-38 — The preview build's end: a name and a finale code

Motivation: the preview build must not spoil the ending, but finishing the campaign should still mean something. The player enters a name and gets a code to send the author, who checks it. Design in `docs/incremental-game.md` ("The preview build's end").

- IN:
  - `src/view/finaleCode.ts` (pure, shared by the game and the verifier): SHA-256 and HMAC written out (no Node or browser API), the code as 42 bits of payload (day 10, seed 16, revenue/100 16) plus a 38-bit HMAC of the payload and the normalised name, in Crockford base32, four groups of four. `checkFinaleCode` also reads O as 0 and I/L as 1.
  - State: `seed` and `finale` (`{day, revenue}` set once, when the final errand completes). Save v16 with a migration: an old game gets its current `rng` as the seed and, if completed, a finale from today's numbers.
  - `buildFinaleView` (`src/view/finale.ts`) and `FinaleCard.svelte`: shown when the game is completed and the build has no ending pack, once (`endingSeen`), reopenable from Settings ("Show my code" instead of "Watch the ending"). EN and FR strings in the core pack.
  - `npm run verify-code -- "Name" CODE` (`scripts/verify-code.ts`) prints the day, run id and revenue, or why it is invalid. The secret is `VITE_FINALE_SECRET` in `.env.local` (gitignored, like the build); without it a development fallback is used and both sides warn or use `dev-secret`.
  - `.claude/launch.json` gets a `preview-build` server for the built preview.
- OUT: an in-game redeem of the code, the reward (decided at the table), checking the code against play stats beyond the payload, hiding the secret better (it ships in the bundle: a reader of the bundle can forge codes).
- Verified: `npm run check`, `npm test` (273, 7 new: SHA-256/HMAC against Node for edge lengths, round trip, name and secret mismatch, altered and malformed codes, clamping); `npm run build:preview` and its leak check; in the built preview (`?endgame=1&seed=777`) Settings > Show my code, typing a name gave `2J0C-4G00-7VAY-NZ63`, and `verify-code` accepted it for "mira oak" (day 82, run 0309) and rejected it for another name. Not checked: phone width, the card appearing by itself on a real finish (the dev hook sets the ending as seen), the clipboard button.
- Open: set a real `VITE_FINALE_SECRET` in `.env.local` before building the preview for players.
