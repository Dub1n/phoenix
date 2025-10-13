# Task: Test architecture consolidation & coverage governance

## Requirement Summary

- Status: `[ ]`
- Requirement text: "Test architecture consolidation and coverage governance (unit/integration/e2e thresholds codified)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Capture the unit/integration/e2e test taxonomy and required coverage bands inside `docs/current/architecture-spec.md` (Verification & Validation), mapping existing suites (`tests/core`, `tests/backend`, `tests/e2e`, `tests/interfaces`) and referencing `scripts/coverage-reality-check.js` so expectations are explicit.
- [ ] Introduce suite-specific coverage thresholds: add a `coverageThreshold` block to `jest.config.js` for unit scope, enable coverage collection and thresholds in `jest.backend.config.js`, and author a dedicated `jest.e2e.config.js` mirroring `tests/e2e/*.test.ts`.
- [ ] Extend `scripts/coverage-reality-check.js` (functions `generateCoverage`, `analyzeCoverage`, `checkThresholds`) to execute the unit, backend integration, and e2e configs sequentially, merge their coverage artefacts, and persist aggregated metrics in `.coverage-history.json` while failing when any suite dips below its codified thresholds.
- [ ] Update `package.json` (and any CI workflow scripts) to run the consolidated coverage check (e.g., expose `coverage:governance` that invokes the updated script) and ensure `scripts/check-tests.js` and precommit hooks invoke the new governance flow.
- [ ] Backfill missing e2e instrumentation helpers under `src/tests/e2e/` (e.g., wiring mocks in `tests/e2e/e2e-complete-workflows.test.ts`) if coverage reveals gaps, so thresholds are realistically achievable without manual instrumentation.
- [ ] Triage the failing suites observed on 2025-10-12 (`tests/e2e/e2e-complete-workflows.test.ts` variance regression, `tests/interfaces/interface-adapter-integration.test.ts` snapshot drift, `tests/scripts/cli-shared-parser.test.ts` missing `dev/architecture/cli-shared-parser.mjs`, `src/tests/utils/path-utils.test.ts` TypeScript syntax error) and stabilise them before codifying thresholds.

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

## Current Assessment (2025-10-05)

- Implementation: `scripts/coverage-reality-check.js` still runs a single Jest config and lacks per-suite thresholds; `jest.backend.config.js` contains invalid options (e.g. `moduleNameMapping`, `jest-junit` reporter without dependency).
- Commands: `node scripts/run-with-timeout.mjs --timeout 180000 -- npm run test:coverage -- --passWithNoTests` fails with `TypeError: The "original" argument must be of type function` thrown by `babel-plugin-istanbul`, so coverage artefacts are not generated.
- Required follow-up: repair the coverage stack, introduce suite-specific configs and thresholds, and ensure governance scripts exit cleanly before updating documentation/checklists. As of 2025-10-12 the governance push is additionally blocked by red suites (see list above), so the fix plan must triage those regressions alongside coverage tooling.
