# Task: Restore consolidation CLI shared parser

Related requirement: `docs/current/progress.md` → Interface Delivery → "Consolidation CLI shared parser restored".

Tags: `#bugfix`

## Checklist

- [ ] Audit CLI consolidation tooling and make sure every consumer imports from `dev/architecture/consolidation-scripts/cli-shared-parser.mjs` so command parsing logic remains sourced from the shared helper instead of ad-hoc stubs.
- [ ] Update `dev/architecture/consolidation-scripts/cli-command-stub.mjs` and related helpers to import the restored parser, keeping CLI argument validation consistent across `npm run consolidate` workflows.
- [ ] Backfill the Jest suite (`tests/scripts/cli-shared-parser.test.ts`) plus helper probe (`tests/scripts/helpers/cli-parser-probe.mjs`) to assert acknowledgement sequencing, help alias resolution, and error paths with the real parser implementation.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `project: short summary` after tests.

## References

- Code: `dev/architecture/consolidation-scripts/*.mjs`, `package.json` consolidate scripts.
- Tests: `tests/scripts/cli-shared-parser.test.ts`, `tests/scripts/helpers/cli-parser-probe.mjs`.
- Docs: `dev/architecture/consolidation-cli-design.md`, `docs/current/progress.md`.

## Notes

- 2025-10-12 Jest runs fail with `ERR_MODULE_NOT_FOUND` because `dev/architecture/cli-shared-parser.mjs` was removed during consolidation; restore or replace the parser so CLI task automation remains covered.
- 2025-10-13 Backfilled compatibility re-exports (top-level `dev/architecture/cli-shared-parser.mjs`, `dev/architecture/cli-command-registry.mjs`) so the shared parser and registry resolve again. 2025-10-14 sweep replaced those shims with direct imports from `dev/architecture/consolidation-scripts/`, keeping tests green while eliminating duplicate entry points; capture doc updates before closing the task.
- 2025-10-14 Pattern 2 Stage 3 replan added guardrail lane 4f and runtime lane 6e to migrate CLI/Phase6 scripts onto `ErrorHandler`. Keep shared parser changes in lockstep and extend `tests/scripts/phase6-validation-cli.test.ts` coverage before marking this task complete. TODO 2025-10-14: align CLI tooling evidence logging with new guardrail expectations.
- Ensure any regenerated schedule/config artefacts reference the restored parser path to avoid future removals when pruning archive files.
- 2025-11-07 CLI review: current design keeps registry authoritative with strong guidance (stage reminders, search-term guards, activity logging), but `cli-command-stub.mjs` has grown complex—consider extracting guard/search helpers and command handlers into focused modules and backfilling unit coverage around `filterGitIgnoredFiles`, cleanup enforcement, and stage guidance to stabilise future refactors.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
