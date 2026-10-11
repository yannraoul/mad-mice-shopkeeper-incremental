---
name: log-bugfix
description: Use when a bug has just been fixed in the Mad Mice Shopkeeper Incremental repo that was discovered after the milestone that introduced it had already shipped — needs a planning/CHANGELOG.md entry, not a planning/ROADMAP.md one (use log-milestone if this is a new feature, or if the bug was found while that feature's own milestone was still in progress). Triggers on phrases like "log this bug fix", "add this to the changelog", or naturally at the end of fixing a reported bug that isn't part of active feature work.
---

Create a new bug entry in its own `planning/bugs/MMSIB-y.md` file, add
its index line to `planning/CHANGELOG.md`, and — if commits are pre-authorized
in `instructions.md` — create the commit.

## Steps

1. Read `instructions.md` and skim the last 1-2 files under `planning/bugs/`
   (skip `_TEMPLATE.md`) to match tone/structure.
2. Determine the next id: the highest existing `MMSIB-y` + 1 (start at 1).
3. Create `planning/bugs/MMSIB-y.md` following `_TEMPLATE.md`: Reported,
   Root cause (the actual mechanism, not just a diff summary), Fix,
   Verified (how it was actually confirmed — never "should work"). Add an
   **Open follow-up** line if the fix is narrower than the general pattern
   behind the bug.
4. Add its index line to `planning/CHANGELOG.md`'s `## Bugs` list, in order:
   `- [MMSIB-y](bugs/MMSIB-y.md) — <short title>`.
5. Run the project's checks if not already confirmed clean: `npm run check` (svelte-check), `npm run check:content`, `npm test`.
6. Per `instructions.md`, commit with exactly `fix: MMSIB-y <content>`
   (subject line only, no body or trailers), staging the bug file, changelog
   index and the code changes. **Do not push** — that always needs asking first.
