# MMSIM-1 — Project scaffolding (v1 scope M0)

Motivation: `docs/incremental-game-v1-scope.md` M0: repo, TypeScript + Vite + Svelte, content schema, FR/EN string check in the build.

- IN: Vite + Svelte 5 + TS app shell; pure-TS `src/engine/` (day phase state machine only); zod content schema and loader; `content/core/` with one row per table (3 qualities, 1 candy, 3 customer types, 1 station, 1 art slot) and EN/FR strings; optional packs `ending` and `plot-errands` (empty); language toggle; `ImageSlot` with a placeholder SVG at its final slot size; Vitest.
- OUT: any gameplay (M1+), recipes/orders/revenue, saves, skill tree, simulator.
- Content is read by `scripts/contentPlugin.ts` into a `virtual:content` module rather than `import.meta.glob`, so `vite build --mode preview` excludes `content/packs/*` at build time (nothing excluded can reach the browser). The same loader validates schema, duplicate ids, cross-references, that every `*Key` exists in both languages, and EN/FR key parity; invalid content fails `npm run build`, `npm run build:preview` and `npm run check:content`.
- Svelte 5 chosen per the "pending OK" stack proposal in `docs/incremental-game.md`; the user asked to scaffold per the specs.
- Verified: `npm run check` 0 errors, `npm test` 5 passing, `npm run check:content` OK (full and preview), `npm run build` and `npm run build:preview` succeed.
- Open decisions: no real placeholder art beyond one slot; slot sizes will be added per screen in M2.
