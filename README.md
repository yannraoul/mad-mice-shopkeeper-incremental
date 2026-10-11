# Mad Mice Shopkeeper Incremental

An incremental game about mad mice running a shop.

Stack: TypeScript + Vite + Svelte 5, JSON content (FR/EN), Vitest.

## Project layout

- `CLAUDE.md` / `instructions.md` — guidance and rulebook for Claude Code sessions.
- `planning/` — `ROADMAP.md`, `CHANGELOG.md`, `BACKLOG.md`, with `features/` and `bugs/` write-ups.
- `design/` — design handoffs and design decisions (read-only reference).
- `docs/` — original documentation, briefs, research.

## Setup

```
npm install
npm run dev            # dev server
npm test               # engine + content tests
npm run check          # svelte-check / type-check
npm run check:content  # validate content + FR/EN string parity
npm run sim -- --days 30 --seed 1   # headless balance simulation
npm run build          # full build -> dist/
npm run build:preview  # build WITHOUT optional packs -> dist-preview/
```
