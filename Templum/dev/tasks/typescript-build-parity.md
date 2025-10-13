# Task: TypeScript build parity restoration

Related requirement: `docs/current/progress.md` → Quality & Runtime Stability → "TypeScript build parity restoration".

Tags: `#bugfix` `#infra`

## Checklist

- [ ] Capture the current `npm run build`, `npm run test:ci`, `npm run phase6-validation`, and `npm run phase6-health` failure sets and store the logs under `tmp/consolidation/pattern-4-stage6/lane-6n/` for Stage 6 evidence.
- [ ] Restore strict typings for recently consolidated async/event utilities (e.g. `service-health-check`, CLI adapters, MCP channel managers) so TypeScript no longer emits `never`/implicit `any` errors.
- [ ] Reconcile module resolution for mocks and shared scripts (`tests/integration/mocks/pcl-mock-service.ts`, CLI/MCP helpers) so consolidation paths resolve without copying source files.
- [ ] Regenerate the consolidated build artefacts (`npm run build`) and rerun the Stage 6 gating battery (`npm run test:ci`, `npm run phase6-validation`, `npm run phase6-health`) to confirm the harness completes.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `project: restore typescript build` after tests.

## References

- Code: `src/backend/service-health-check.ts`, `src/interfaces/cli-adapter.ts`, `src/mcp-channel/src/event-listener-manager.ts`, `tests/integration/mocks/pcl-mock-service.ts`
- Tests: `npm run build`, `npm run phase6-validation`, `npm run phase6-health`
- Docs: `docs/current/progress.md`, `dev/tasks/typescript-build-parity.md`

## Notes

- Ensure the fix respects the zero-knowledge backend registry constraints; avoid reintroducing backend-specific assumptions while addressing typings.
- If TypeScript diagnostics expose broader consolidation gaps, log follow-up artefacts in `archive/dev-files/utility-migration/utility-consolidation-activity-log.md` and reference them from the progress tracker.
- Reuse existing helper exports (e.g. `AsyncUtils`) instead of duplicating timeout logic in mocks or scripts.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
