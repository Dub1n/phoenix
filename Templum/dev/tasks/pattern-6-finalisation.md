# Task: Phase 6 harness & formatter lock-in

Related requirement: `docs/current/progress.md` → Pattern 6 Close-Out → "Phase 6 harness & formatter lock-in".

Tags: `#infra`

## Checklist

- [x] Restore the compiled Phase 6 harness bundle so `dist/src/scripts/run-phase6-integration-validation.js` resolves `../tests/integration-validation-framework` (adjust build includes or rewrite the resolver to point at the emitted module).
- [x] Re-run `npm run phase6-health` / `npm run phase6-validation` and capture new evidence logs once the harness loads without runtime errors.
- [x] Finish migrating residual CLI/window helpers (`src/rendering/content-layout-system.ts`, `src/interfaces/terminal-compatibility-detector.ts`, `src/interfaces/universal-interaction-manager.ts`) to `TerminalFormatter` semantics and delete remaining direct `chalk` imports.
- [x] Eliminate adaptive CLI integration teardown warnings by hardening listener cleanup or logging filters so tests exit cleanly without globalTeardown noise.
- [x] Update pattern/docs trackers (`utility-consolidation-plans/pattern-6.md`, `utility-consolidation-activity-log.md`, `safe-consolidation-candidates.md`, `docs/current/progress.md`) with the final validation evidence.
- [x] Commit with message `templum: lock in terminal formatter validation` after tests.

## References

- Code: `src/scripts/run-phase6-integration-validation.ts`, `src/tests/integration-validation-framework.ts`, `src/rendering/content-layout-system.ts`, `src/interfaces/terminal-compatibility-detector.ts`, `src/interfaces/universal-interaction-manager.ts`, `src/interfaces/__tests__/adaptive-cli-integration.test.ts`.
- Tests: `npm run phase6-health`, `npm run phase6-validation`, `npm run test -- --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts`, `npm run test -- --runTestsByPath tests/interfaces/interface-adapter-integration.test.ts`.
- Docs: `docs/current/progress.md`, `dev/architecture/utility-consolidation-plans/pattern-6.md`, `dev/architecture/utility-consolidation-activity-log.md`, `dev/architecture/safe-consolidation-candidates.md`.

## Notes

- Coordinate with the process-signal listener consolidation task to ensure any listener cleanup changes do not drift.
- Capture updated log paths under `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage7/` and link them in the activity log for audit.
- If this task changes prerequisites or dependency relationships, regenerate the project’s dependency map JSON (see `dev/tasks/*_task_dependencies.json`) and attach the updated file in the related progress planner.

## Checklist (Copy into PR or issue if needed)

- [x] Code/tests updated
- [x] Docs updated
- [x] Progress tracker updated
- [x] Task log updated
- [x] Checklist completed
