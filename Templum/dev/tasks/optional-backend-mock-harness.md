# Task: Optional Backend Mock Harness for Integration Suite

Related requirement: `docs/current/progress.md` → Backend Connectivity → "Optional backend mock harness for integration suite".

Tags: `#infra`

## Checklist

- [x] Audit Phase 6 validation flow and identify all backend service touchpoints.
- [x] Introduce mock service runners for Haruspex/peers and wire optionality into `RealBackendServiceOrchestrator`.
- [x] While wiring mocks, temporarily skip the Phase 6 Haruspex harness (add TODOs in the integration framework/CLI sections where the real calls will return) so builds remain green until real backends are re-enabled.
- [x] Extend Phase 6 CLI/scripts to default to mocks with an opt-in flag for real backends.
- [x] Split npm scripts/CI targets and document the new workflow.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: add optional backend mock harness` after tests.

## References

- Code: `Templum/src/tests/integration-validation-framework.ts`, `Templum/src/scripts/run-phase6-integration-validation.ts`
- Tests: `npm run phase6-health`, `npx jest --no-cache --runTestsByPath src/tests/...` (to be adjusted)
- Docs: `Templum/docs/current/progress.md`, `README.md` (integration section)

## Notes

- Mocked services should assert contract expectations so API drift is caught even without real backends.
- Keep a dedicated `npm run phase6-health:real` (or similar) that executes against live services for scheduled pipelines.
- Emit warnings when skipping real backends so coverage gaps are explicit.
- Default CLI/scripts now run against mocks; use `npm run phase6-validation:real` (and corresponding health command) when full backends are available.
- If this task changes prerequisites or dependency relationships, regenerate the project’s dependency map JSON (see `dev/tasks/*_task_dependencies.json`) and attach the updated file in the related progress planner.

## Status Snapshot (2025-10-01)

### Completed

- Introduced `BackendServiceOrchestrator` abstraction with a mock implementation and plumbed the `useRealBackends` toggle through `Phase6IntegrationValidationSuite` and dependants (`Templum/src/tests/integration-validation-framework.ts`).
- CLI now defaults to mocks, exposes `--use-real-backends`, and wires env flags so Haruspex stays skipped unless explicitly enabled (`Templum/src/scripts/run-phase6-integration-validation.ts`).
- Split npm entry points to keep mock runs default while preserving real-service opt-in (`Templum/package.json`).
- Progress tracker marks the requirement in progress with guidance on the new commands (`Templum/docs/current/progress.md`).
- Generated mock-backed validation artifacts for reference (`Templum/validation-reports/phase6-validation-2025-10-01T19-38-34-370Z.*`).
- Mock harness now enforces request/response contracts with reusable schemas and Jest coverage (`Templum/src/tests/mock-backend-contracts.ts`, `Templum/tests/validation/mock-backend-contracts.test.ts`).
- Dual-run automation script `npm run phase6-validation:full` added with opt-in real backend execution and env flag coverage tests (`Templum/scripts/run-phase6-full.js`, `Templum/tests/scripts/phase6-validation-cli.test.ts`).
- Backend integration guide documents the mock vs real workflow and contract enforcement path (`Templum/docs/current/1.2-Backend-Integration-Guide.md`).

### Outstanding

- Wire the new `phase6-validation:full` helper into CI once real backend availability checks are codified; today it relies on manual `PHASE6_RUN_REAL` opt-in.
- README/CLI docs still need the quick reference table for `phase6-validation`, `phase6-validation:full`, `phase6-validation:real`, and the associated env knobs.
- Final task log entry and commit (`templum: add optional backend mock harness`) still outstanding once the above gaps close and tests run.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
