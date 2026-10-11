# MMSIB-1 — Craft screen: untranslated error, stale feedback, misleading batch counter

**Reported:** In French, a refused batch showed "Impossible de commencer : not enough honey" (English leaked into a French sentence). After clicking "Commencer" the workshop did not refresh properly: the screen kept saying batches were left while honey was out, and feedback text did not follow the language.

**Root cause:** The engine returned English sentences as its error (`step()` -> `error: string`) and `Craft.svelte` pasted that string into the UI, so no translation was possible. The craft feedback (`message`) was stored as an already-translated string, so it kept the old language after a language switch. The idle workshop only showed the station's batch counter (3/day) while the real limit was the ingredient supply (4 honey = 2 batches), so Start looked available and failed on the third batch.

**Fix:** Engine refusals are now machine-readable: `{ code, params }` (ids only) next to the English `error` kept for logs/tests; the UI translates `error.<code>` with names resolved and lower-cased (`src/ui/errors.ts`). Craft feedback is stored as data and translated at render time. The idle workshop dry-runs Start for the current selection (the engine is still the judge), disables the button and says why, and lists today's remaining ingredients. The batch counter wording no longer pluralises badly. Placeholder SVG labels shrink to fit their slot instead of clipping.

**Verified:** `npm test` 40 passing (new tests for failure codes), `npm run check` 0 errors, content check clean. In the browser (FR): two batches, third Start disabled with "Pas assez de miel.", ingredient list shows Miel: 0; switching to EN re-translated the message, the made-text and the counters; images stayed loaded (checked with naturalWidth) through every Start.

**Open follow-up:** "Placeholders don't reload properly" was interpreted as the stale feedback/counters above; I could not reproduce any image placeholder failing to load. If something else was meant, it is not fixed. `wrong-phase` for contracts says "morning" although the afternoon also works.
