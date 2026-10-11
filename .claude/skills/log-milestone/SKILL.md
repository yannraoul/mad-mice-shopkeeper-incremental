---
name: log-milestone
description: Use when a real, scoped feature/scope-change has just been finished in the Mad Mice Shopkeeper Incremental repo and needs a planning/ROADMAP.md entry — not for bug fixes discovered after a milestone already shipped (use log-bugfix for those). Triggers on phrases like "log this as a milestone", "add this to the roadmap", or naturally at the end of implementing a feature the user scoped as its own unit of work.
---

Create a new milestone entry in its own `planning/features/MMSIM-x.md`
file, add its index line to `planning/ROADMAP.md`, and — if commits are
pre-authorized in `instructions.md` — create the commit.

## Steps

1. Read `instructions.md` and the last 1-2 milestone files (`ls planning/features/`
   to find the highest `MMSIM-x`; skip `_TEMPLATE.md`) to match
   tone/structure. If none exist yet, use `planning/features/_TEMPLATE.md`.
2. Determine the next id: the highest existing `MMSIM-x` + 1 (start at
   1). Ask for a short title if it isn't obvious from context.
3. Create `planning/features/MMSIM-x.md` following `_TEMPLATE.md`:
   motivation, IN/OUT, what changed with the *why* behind non-obvious
   choices, **Verified** (how it was actually confirmed — never "should
   work"), open decisions.
4. Add its index line to `planning/ROADMAP.md`'s `## Milestones` list, in order:
   `- [MMSIM-x](features/MMSIM-x.md) — <short title>`.
5. If this milestone graduated an idea out of `planning/BACKLOG.md`, remove
   that bullet from the backlog.
6. Run the project's checks if not already confirmed clean: `npm run check` (svelte-check), `npm run check:content`, `npm test`.
7. Per `instructions.md`, commit with exactly `feat: MMSIM-x <name>`
   (subject line only, no body or trailers), staging the new features file,
   roadmap index, backlog edit and the code changes. **Do not push** — that
   always needs asking first.
