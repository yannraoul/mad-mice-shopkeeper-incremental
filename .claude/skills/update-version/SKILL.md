---
name: update-version
description: Use to bump the version in the Mad Mice Shopkeeper Incremental repo. Auto-detects the right semver bump (patch/minor) from the commit types landed since the last version-bump commit — see instructions.md's Versioning section. Not run automatically after every commit; only on explicit request. Triggers on phrases like "update version", "bump version", "let's version this", or "cut a release" (pass "major" as args for an explicit major bump).
---

Bump the version by exactly one semver step, sized from what's actually landed
since the last version-bump commit, then commit that bump on its own. One bump
per invocation — never chained onto every commit.

## Steps

1. Find the last version-bump commit:
   `git log --grep='^chore: bump version to ' -1 --format=%H`.
   If none exists, stop and ask the user what baseline to bump from.
2. List every commit subject since it: `git log <hash>..HEAD --format=%s`.
   If empty, tell the user there's nothing to bump and stop.
3. Determine the bump type:
   - If `args` clearly requests a major bump, use **major** regardless of the
     log (the one deliberately manual case).
   - Otherwise any `feat: ...` → **minor**; else any `fix: ...` or
     `chore: ...` → **patch**. Other subjects don't count toward either.
4. Compute the new version from the current one: patch → `X.Y.(Z+1)`; minor →
   `X.(Y+1).0`; major → `(X+1).0.0`.
5. Apply it:

   Update `package.json` (and the lockfile) with
   `npm version <new-version> --no-git-tag-version`. Never hand-edit the files
   individually. Confirm via `git diff --stat` that only version files changed.
6. Commit with exactly `chore: bump version to <new-version>` — no body. This
   is a `chore:` commit covered by the commit pre-authorization in
   `instructions.md`; do not push (always ask separately).
7. Report concisely: old → new version, the bump type and the
   `feat:`/`fix:`/`chore:` commits that drove it.
