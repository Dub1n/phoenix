# Task: Test architecture consolidation & coverage governance

## Requirement Summary

- Status: `[~]`
- Requirement text: "Test architecture consolidation and coverage governance (unit/integration/e2e thresholds codified)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [x] Capture the unit/integration/e2e test taxonomy and required coverage bands inside `docs/current/architecture-spec.md` (Verification & Validation), mapping existing suites (`tests/core`, `tests/backend`, `tests/e2e`, `tests/interfaces`) and referencing `scripts/coverage-reality-check.js` so expectations are explicit.
- [x] Introduce suite-specific coverage thresholds: add a `coverageThreshold` block to `jest.config.js` for unit scope, enable coverage collection and thresholds in `jest.backend.config.js`, and author a dedicated `jest.e2e.config.js` mirroring `tests/e2e/*.test.ts`.
- [x] Extend `scripts/coverage-reality-check.js` (functions `generateCoverage`, `analyzeCoverage`, `checkThresholds`) to execute the unit, backend integration, and e2e configs sequentially, merge their coverage artefacts, and persist aggregated metrics in `.coverage-history.json` while failing when any suite dips below its codified thresholds.
- [x] Update `package.json` (and any CI workflow scripts) to run the consolidated coverage check (exposed as `coverage:governance`) and ensure `scripts/check-tests.js` and precommit hooks invoke the new governance flow.
- [x] Backfill missing e2e instrumentation helpers under `src/tests/e2e/` (coverage run confirmed existing helpers deliver ≥35/12/30/35, no additional harness shims required).
- [x] Triage the failing suites observed on 2025-10-12 (`tests/e2e/e2e-complete-workflows.test.ts` variance regression, `tests/interfaces/interface-adapter-integration.test.ts` snapshot drift, `tests/scripts/cli-shared-parser.test.ts` missing the restored parser entry at `dev/architecture/consolidation-scripts/cli-shared-parser.mjs`, `src/tests/utils/path-utils.test.ts` TypeScript syntax error) and the newly failing governance blockers captured on 2025-10-13 (`tests/core/interface-switching.test.ts` bootstrap expectations, `src/tests/core/templum-core-connection-events.test.ts` warning assertions, `tests/development-tools/debug-utils.test.ts` namespace/log-level drift) so the gating battery returns green before codifying thresholds.

### Follow-up Actions

- [ ] **CLI error-handler guardrail** — Update `cli-adapter-abstracted.ts` catch blocks (or the guardrail fixtures) so `tests/interfaces/interface-session-error-handler.guardrail.test.ts` recognises compliant usage of `ErrorHandler.handle`. Document the resolution and rerun the guardrail suite.
- [ ] **Skin payload integration** — Adjust procedural rendering outputs or expectations so `tests/rendering/skin-payload-consumption.integration.test.ts` passes for both CLI and VSCode paths (clean up timeouts while verifying rendered content).
- [ ] **Backend auto-connection guardrail** — Restore the lane 4d guardrail (`src/tests/backend/generic-backend-integration.test.ts`) by ensuring auto-connection failures still invoke centralized error handling after the procedural window refactor.
- [ ] **Adaptive CLI initialization** — Patch `AdaptiveCLIIntegration` setup (and its spec coverage) so the newest `renderMenuWindow` flows no longer cause initialization errors in `src/interfaces/__tests__/adaptive-cli-integration.test.ts`.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Unit tests with coverage: `npm run test:coverage` (writes to `coverage/unit` and honours 30/22/30/30 thresholds when run under governance).
- Backend integration suite: `npx jest --config jest.backend.config.js --coverage`.
- E2E suite: `npx jest --config jest.e2e.config.js --coverage`.
- Governance check: `npm run coverage:governance`.
- Documentation refreshed: `docs/current/progress.md` status/link updated, `docs/current/architecture-spec.md` Verification & Validation section reflects the codified coverage governance, and `docs/current/testing-guide.md` lists the new command set.

## References

- docs/current/progress.md:31
- docs/current/architecture-spec.md
- scripts/coverage-reality-check.js
- jest.config.js
- jest.backend.config.js
- tests/e2e/e2e-complete-workflows.test.ts

## Current Assessment (2025-10-13)

- Implementation: `scripts/coverage-reality-check.js` orchestrates unit/back/e2e configs in sequence, merges their `coverage-summary.json` files, and enforces thresholds sourced from `scripts/coverage-thresholds.js`. Coverage artefacts are written to `coverage/unit`, `coverage/backend`, and `coverage/e2e`, with aggregate metrics persisted in `.coverage-history.json` (bounded to 50 entries).
- Commands: `npm run coverage:governance` passes on the baseline repo (unit 34.35/24.86/35.33/34.89, backend 23.96/14.43/23.05/24.29, e2e 39.86/14.15/34.65/40.5, aggregate 33.19/23.46/34.05/33.69). Pre-commit flow now runs `check:tests -- --skip-governance`, `coverage:governance`, and `test:health`.
- Required follow-up: target the newly failing suites identified on 2025-10-14 (CLI error-handler guardrail, skin payload integration, backend auto-connection guardrail, Adaptive CLI initialization) so governance can pass again under `npm run test:coverage`. Coverage tooling is healthy; unblock by reconciling the regressions.
- 2025-10-14 follow-up: `npm run test:coverage` no longer throws the `babel-plugin-istanbul` TypeError; the run now aborts on guardrail and integration failures (e.g., `tests/interfaces/interface-session-error-handler.guardrail.test.ts` enumerating catch blocks in `src/interfaces/cli-adapter.ts`, `tests/rendering/skin-payload-consumption.integration.test.ts` CLI/VSCode assertions, and related backend guardrails). The coverage tooling itself executes successfully, so the blocking workstream should focus on reconciling these suite regressions rather than the Istanbul plugin.
