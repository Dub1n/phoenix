# Task: Test architecture consolidation & coverage governance

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Test architecture consolidation and coverage governance (unit/integration/e2e thresholds codified)."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Capture the unit/integration/e2e test taxonomy and required coverage bands inside `docs/current/architecture-spec.md` (Verification & Validation), mapping existing suites (`tests/core`, `tests/backend`, `tests/e2e`, `tests/interfaces`) and referencing `scripts/coverage-reality-check.js` so expectations are explicit.
- [ ] Introduce suite-specific coverage thresholds: add a `coverageThreshold` block to `jest.config.js` for unit scope, enable coverage collection and thresholds in `jest.backend.config.js`, and author a dedicated `jest.e2e.config.js` (mirroring `tests/e2e/*.test.ts`) with ts-jest, deterministic timeouts, and matching thresholds.
- [ ] Extend `scripts/coverage-reality-check.js` to execute the unit, backend integration, and e2e configs sequentially, merge their coverage artefacts (combine `coverage-final.json` into a unified report), and persist aggregated metrics in `.coverage-history.json` while failing when any suite dips below its codified thresholds.
- [ ] Update `package.json` (and any CI workflow scripts) to run the consolidated coverage check (e.g., expose `coverage:governance` that invokes the updated script) and ensure `scripts/check-tests.js` and precommit hooks invoke the new governance flow.
- [ ] Backfill missing e2e instrumentation helpers under `src/tests/e2e/` (e.g., wiring mocks in `tests/e2e/e2e-complete-workflows.test.ts`) if coverage reveals gaps, so thresholds are realistically achievable without manual instrumentation.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- Unit tests with coverage: `npm run test:coverage` (uses updated thresholds).
- Backend integration suite: `npx jest --config jest.backend.config.js --coverage`.
- E2E suite: `npx jest --config jest.e2e.config.js --coverage`.
- Governance check: `npm run coverage:reality-check` (or the renamed `coverage:governance`).
- Documentation refreshed: `docs/current/progress.md` status/link updated, `docs/current/architecture-spec.md` Verification & Validation section reflects the codified coverage governance.

## References
- docs/current/progress.md:31
- docs/current/architecture-spec.md
- scripts/coverage-reality-check.js
- jest.config.js
- jest.backend.config.js
- tests/e2e/e2e-complete-workflows.test.ts
