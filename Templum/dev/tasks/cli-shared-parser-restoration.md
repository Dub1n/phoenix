# Task: Restore consolidation CLI shared parser

Related requirement: `docs/current/progress.md` → Interface Delivery → "Consolidation CLI shared parser restored".

Tags: `#bugfix`

## Checklist

- [ ] Audit CLI consolidation tooling and reinstate `dev/architecture/cli-shared-parser.mjs` (or an equivalent entry) so command parsing logic is sourced from the shared helper instead of ad-hoc stubs.
- [ ] Update `dev/architecture/consolidation-scripts/cli-command-stub.mjs` and related helpers to import the restored parser, keeping CLI argument validation consistent across `npm run consolidate` workflows.
- [ ] Backfill the Jest suite (`tests/scripts/cli-shared-parser.test.ts`) plus helper probe (`tests/scripts/helpers/cli-parser-probe.mjs`) to assert acknowledgement sequencing, help alias resolution, and error paths with the real parser implementation.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `project: short summary` after tests.

## References

- Code: `dev/architecture/consolidation-scripts/*.mjs`, `dev/architecture/cli-shared-parser.mjs` (expected location), `package.json` consolidate scripts.
- Tests: `tests/scripts/cli-shared-parser.test.ts`, `tests/scripts/helpers/cli-parser-probe.mjs`.
- Docs: `dev/architecture/consolidation-cli-design.md`, `docs/current/progress.md`.

## Notes

- 2025-10-12 Jest runs fail with `ERR_MODULE_NOT_FOUND` because `dev/architecture/cli-shared-parser.mjs` was removed during consolidation; restore or replace the parser so CLI task automation remains covered.
- 2025-10-13 Backfilled compatibility re-exports (`dev/architecture/cli-shared-parser.mjs`, `dev/architecture/cli-command-registry.mjs`) so the shared parser and registry resolve again; `tests/scripts/cli-shared-parser.test.ts` now passes locally, but consolidate workflows still need a sweep to confirm no lingering path assumptions before closing the task.
- Ensure any regenerated schedule/config artefacts reference the restored parser path to avoid future removals when pruning archive files.
- 2025-11-07 CLI review: current design keeps registry authoritative with strong guidance (stage reminders, search-term guards, activity logging), but `cli-command-stub.mjs` has grown complex—consider extracting guard/search helpers and command handlers into focused modules and backfilling unit coverage around `filterGitIgnoredFiles`, cleanup enforcement, and stage guidance to stabilise future refactors.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
