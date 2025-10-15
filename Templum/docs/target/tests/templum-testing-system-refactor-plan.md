---
date: 2025-10-04T00:00:00Z
name: templum-testing-system-refactor-plan
TASK-ID: [INTERNAL-TEST-ARCH-001]
category: remediation-report
status: [ ]
patterns: [test-architecture, remediation-plan, phase6]
components: [Phase6IntegrationValidationSuite, ComprehensiveBackendValidation, jest-config, tsconfig]
dependencies: [examples/minimal-backend, scripts/run-phase6-integration-validation.ts]
tags: [testing, jest, integration, phase6, architecture]
---

# Templum Test Architecture Assessment & Refactor Plan

## Context

- Multiple emergency patches (timeouts, forced shutdown hooks, console suppression) have accumulated across the Phase 6 harness and backend validation suites. Stakeholders requested an audit to ensure the system is cohesive rather than ad hoc.
- This report inspects the current layout and behaviour of the test stack, highlights structural risks, and lays out a staged implementation plan to restore maintainability and trust in the suites.

## Key Observations

1. **Monolithic integration harness** – `src/tests/integration-validation-framework.ts:1` spans 4 485 lines, mixing child-process orchestration, workflow definitions, metrics aggregation, logging, and Jest-facing utilities. It violates SRP/ISP guidance, complicates reviews, and makes it impossible to reason about lifecycle boundaries.
2. **Comprehensive backend suite bloating** – `src/tests/backend/comprehensive-backend-validation.test.ts:1` holds 969 lines combining backend fixture management, router assertions, CLI serialization tests, and Phase 6 smoke cases. The suite currently fails because generated skin fixtures lack `backendConfig` metadata (`src/tests/backend/comprehensive-backend-validation.test.ts:525,655,692`) and the IPC block instantiates `TemplumCore` directly (`src/tests/backend/comprehensive-backend-validation.test.ts:924`), bypassing the DI surface used in production.
3. **Production build pulls test harness** – `jest.config.js:4-19` includes `<rootDir>/src` in `roots` and `collectCoverageFrom`, while `tsconfig.json:32-56` compiles every `src/tests/**` artefact into `dist/`. As a result, the integration harness ships with the extension, inflating coverage and exposing internal test helpers at runtime.
4. **Fixture drift and TODO debt** – Existing TODOs (`dev/tasks/backend-contract-fixtures.md:13-18`) call for shared backend fixtures, yet the current suites each rebuild partial mocks. Missing fixtures explain the undefined capability profiles noted above and keep `npm run phase6-health` failing despite a successful build.
5. **Global setup overreach** – `tests/setup.ts:1-119` globally mocks VSCode APIs, console logging, and timestamp helpers. Integration suites in `src/tests/**` rely on real timers/processes, so tests mix incompatible environments (console suppressed vs. diagnostics required), creating brittle behaviour when suites are run out of sequence.
6. **Console noise in leak-guard harness** – Running the new CI entry (`cd Templum && npm run test:ci -- --runTestsByPath tests/core/adapter-registry.test.ts`) emits repeated warnings from the guard validation layer (`Templum/src/core/adapter-registry.ts:1193-1250`), cluttering output even on success. Consider promoting these notices to a structured logger or gating them behind a verbose flag so the leak guard stays readable.

### Recent stabilisation work

- Timer and socket lifecycle management now exists in `EnhancedStateManager`, `StatePersistence`, `CrossInterfaceSync`, `PCLBackendIntegrator`, and `TemplumBackendServiceRouter`. Long-running intervals/timeouts register through shared helpers and are disposed in `shutdown()/dispose()`.
- Added `tests/globalTeardown.ts` (wired via `jest.config.js`) and the `scripts/run-jest-ci.mjs` wrapper. CI runs use `--runInBand --detectOpenHandles --forceExit` with `JEST_FORCE_EXIT=1`; teardown fails fast when leaked handles remain. Hanging jobs are eliminated, though the adapter-registry suite still fails functionally until fixtures/DI wiring are corrected.

## Impact

- **Maintainability** – Mega-files and duplicated fixture logic discourage refactors, breed silent regressions, and hinder onboarding.
- **Reliability** – Phase 6 suites regularly fail or hang without delivering actionable feedback, eroding trust in pre-release checks.
- **Release readiness** – Shipping test harness code inflates the extension bundle and blurs separation between runtime and verification concerns.

## Implementation Plan

### Phase 0 – Stabilise & Document (1-2 days)

- [x] Wire hard fails for leaked handles / hanging suites (global teardown + `scripts/run-jest-ci.mjs`).
- [x] Document the CI entry point and leak expectations (`docs/current/testing-guide.md`).
- [ ] Freeze current behaviour with targeted skip markers or explicit `test.todo` entries where fixtures are incomplete (document in `docs/current/testing-guide.md`).
- [ ] Add CI guardrail to run `npm test -- --passWithNoTests --listTests` to alert when suites disappear unexpectedly.

### Phase 1 – Harness Extraction (3-4 days)

- Carve `src/tests/integration-validation-framework.ts` into modules under `src/testing/harness/`:
  - `process-manager.ts` handles spawn/kill and timeout logic (reuse in scripts).
  - `contract-validation.ts` encapsulates `MockBackendContractValidator` usage.
  - `reporting.ts` produces the Phase 6 JSON artefacts.
- Expose a slim orchestrator entry exported from `src/testing/index.ts` for reuse by `src/scripts/run-phase6-integration-validation.ts:14` and CLI commands.
- Update Jest suites to import the orchestrator wrapper, reducing individual spec size to <300 lines.

### Phase 2 – Fixture Consolidation (2-3 days)

- Implement the fixture module proposed in `dev/tasks/backend-contract-fixtures.md:13-18` inside `tests/__fixtures__/backend/`.
- Refactor `src/tests/backend/comprehensive-backend-validation.test.ts` and peers to consume shared builders so skin definitions include `backendConfig`, capability metadata, and command registries.
- Re-enable failing assertions and ensure router capability lookups succeed.
- Align adapter-registry assertions with the restored DI wiring (current failures stem from missing fixtures rather than lifecycle leaks).

### Phase 3 – Configuration Hygiene (1-2 days)

- Adjust `jest.config.js:4-19` to treat `src/tests/**` as tests (not roots for coverage) or relocate reusable harness code to `src/testing/**` while keeping specs under `tests/**`.
- Update `tsconfig.json:45-54` to exclude pure Jest files from the production build; include only harness modules in `src/testing/**` as needed.
- Ensure `npm run build` omits `src/tests/**` outputs, shrinking `dist/` and clarifying runtime boundaries.
- Introduce domain-scoped guardrail Jest configs (e.g., interface adapters, backend connectivity, skin engine) that narrow `collectCoverageFrom` to each seam while inheriting shared thresholds; document the mapping so future lanes reuse the same presets instead of cloning configs. Initial implementation: `jest.guardrail-interface-adapter.config.js` using `coverageThresholds.guardrailInterfaceAdapter`, referenced by Pattern 1 Stage 6 guardrails.

### Phase 4 – Reliability Hardening (ongoing)

- Introduce targeted health checks (e.g., `npm run test -- --runTestsByPath src/tests/backend/service-discovery.test.ts --runInBand`) into CI to catch regression early.
- layer integration retries via utilities inside the harness rather than spec-level `setTimeout` patches.
- audit global setup; split VSCode mocks into opt-in helpers so integration suites can opt-out of console suppression when debugging.

## Acceptance Criteria

- Comprehensive backend suite passes with real fixtures; `npm run phase6-health` succeeds after a clean build.
- No `.ts` under `src/tests/**` ships in `dist/`; harness utilities reside in `src/testing/**` and are covered by dedicated unit tests.
- Longest Jest spec drops below 400 lines; orchestration responsibilities live in reusable helpers.
- Testing guide updated with new command references and harness overview.
- CI pipeline proves smoke coverage via explicit integration checks.

## Risks & Mitigations

- **Fixture divergence** – Mitigate by centralising fixture definitions and snapshotting representative contracts.
- **Refactor churn** – Sequence phases to keep suites runnable between steps; add interim feature flags to avoid blocking daily work.
- **Developer ergonomics** – Provide migration snippets and VSCode tasks to run new harness commands locally.

## Open Questions

1. Do we intend to support real Haruspex backends before fixtures land? If yes, the harness extraction must maintain environment toggles for both mocked and real modes.
2. Should Phase 6 orchestration live in its own package (e.g., `@templum/test-harness`) to enforce boundaries further?
3. Can we retire the global console suppression in `tests/setup.ts` once harness logging is scoped?

## Next Actions

- Secure stakeholder buy-in for the phased plan.
- Assign owners for Phase 1 extraction (backend & tooling pairing recommended).
- Schedule follow-up review to validate Phase 2 fixture rollout and update the testing guide accordingly.
