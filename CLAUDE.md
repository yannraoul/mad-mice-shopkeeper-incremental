# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in
this repository.

## What this is

An incremental game about mad mice running a shop.

Stack: web (PC + phone), TypeScript + Vite + Svelte 5, DOM/CSS UI, pure-TS engine, JSON content validated by zod, Vitest. Spec: `docs/incremental-game.md` (decisions) and `docs/incremental-game-v1-scope.md` (v1 scope and milestones M0-M6; no gameplay or style change without writing it there first).

## Read these before making changes

- **`instructions.md`** — the actual rulebook: planning-doc conventions,
  commit/push policy, versioning, and project-specific rules. It's a living
  document; update it in the same session a new rule comes up.
- **`planning/ROADMAP.md`** — index of shipped and planned features, one line
  per milestone (**MMSIM-x** ids), linking to that milestone's full
  write-up in `planning/features/MMSIM-x.md`. Read the relevant
  milestone(s) before touching code they describe — most non-obvious design
  decisions are explained there, not in code comments.
- **`planning/CHANGELOG.md`** — index of bugs found and fixed after their
  milestone had already shipped (**MMSIB-y** ids), linking to each bug's
  full write-up in `planning/bugs/MMSIB-y.md`.
- **`planning/BACKLOG.md`** — ideas not yet scoped into a milestone.
- **`design/`** — design handoffs and externally generated design decisions
  (read-only reference; treat measurements, colors and interactions as fixed
  requirements). Empty until something is added.
- **`docs/`** — original documentation, briefs and research notes. Empty until
  something is added.

When you finish a real feature, add its `planning/ROADMAP.md` entry and its
`planning/features/MMSIM-x.md` write-up as part of the same task. When
you fix a bug outside an in-progress milestone, add its
`planning/CHANGELOG.md` entry the same way (the `log-milestone` and
`log-bugfix` skills in `.claude/skills/` do this). See `instructions.md` for
the exact convention, including commit message format.

## Subagents for scoped work

None yet. TODO: if a clearly bounded area emerges (e.g. client vs server),
propose a project subagent under `.claude/agents/` to the user rather than
creating it unprompted.

## Working style

- **Confidence gate**: don't start editing below ~95% confidence in what's
  being asked; ask a targeted question instead of guessing. Once confident,
  stop researching and implement — don't keep exploring "just in case."
- **Analysis budget**: read only the files needed to make the decision at
  hand.
- **Output discipline**: prefer bounded commands over dumping full output;
  read more only when the bounded view doesn't answer the question.

## Applied Learning

Durable, one-line lessons — add a bullet when something fails repeatedly, the
user needs to explain something again, or a workaround/limitation is
discovered.

- (none yet)
