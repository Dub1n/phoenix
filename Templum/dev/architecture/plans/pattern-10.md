# Utility Consolidation Plan — Pattern 10

## Stage 1 Snapshot

- **Utility / Pattern**: Type Guards Utility
- **Agent**: Codex
- **Date**: 2025-10-01T13:30:00Z
- **Primary References**: `Templum/dev/architecture/safe-consolidation-candidates.md` (Type Guards entry), `Templum/dev/patterns/utilities/data/type-guards.md`, `Templum/dev/architecture/redundancy-report.md`, `Templum/dev/architecture/component-dependency-map.md`

### Intended Work Scope

- Tests to create/update:
  - `Templum/tests/utils/type-guards.test.ts` — coverage for primitives, complex guards, property confidence checks
  - `Templum/tests/backend/service-discovery.test.ts` — extend cases that rely on consolidated guards
  - `Templum/tests/interfaces/navigation/__tests__/navigation-system.test.ts` — regression coverage for selector/navigation guard usage
- Utility modules to touch:
  - `Templum/src/utils/type-guards.ts`
  - `Templum/src/utils/index.ts`
- Planned consumer migration order:
  1. Backend discovery + router modules (`Templum/src/backend/service-discovery.ts`, `Templum/src/backend/backend-service-router.ts`, `Templum/src/backend/service-discovery-validator.ts`)
  2. Core registries/config managers (`Templum/src/core/adapter-registry.ts`, `Templum/src/core/templum-config-manager.ts`, `Templum/src/core/universal-interface-manager.ts`)
  3. Interface & navigation stack (`Templum/src/interfaces/cli-adapter.ts`, `Templum/src/interfaces/cli-display-consistency-engine.ts`, `Templum/src/interfaces/navigation/selector-updater.ts`, `Templum/src/interfaces/terminal-ui-components.ts`, `Templum/src/navigation/skin-navigation-parser.ts`)
  4. Session + supporting utilities/tests (`Templum/src/session/templum-universal-session-manager.ts`, `Templum/src/utils/service-utils.ts`, `Templum/src/utils/terminal-formatter.ts`, `Templum/src/utils/protocol-utils.ts`)
- Guardrails / constraints to enforce:
  - Preserve dependency injection boundaries and keep helpers pure/composable
  - Route assertion failures through `TemplumError` + logger utilities; avoid direct console usage
  - Keep functions <30 lines and file <400 lines; extract helpers if surface grows
  - Maintain minimal-footprint API surface to support tree-shaking and avoid interface-specific coupling

### Coordination Notes

- Dependent utilities / agents:
  - Monitor overlap with validator/serialization utility work; coordinate if migrations touch shared files.
- Shared files to coordinate:
  - `Templum/src/utils/index.ts`
  - Backend + interface test suites that may be under parallel refactors
- Risks or assumptions:
  - No hidden legacy `type-guards` export should remain elsewhere (validate during Stage 2)
  - Confirm Jest setup hooks (`Templum/tests/setup.ts`) have no implicit guard helpers before rewiring

## Stage 3 — Migration Orchestration & Coordination

- **Date**: 2025-10-03T12:45:00Z
- Readiness Summary:
  - Stage 4 lanes `[x]` (helper implementation, Jest validation, coordination snapshots).
  - Stage 5 lanes defined (a: backend, b: core orchestration, c: interface/navigation, d: session/shared utilities) with owners/tests.
  - Contingencies: If additional helper gaps surface, revert to Stage 3 to add new Stage 4 lanes before resuming migrations.
- Coordination Snapshot:
  - Tracker status: Stage 3 `[x]` (plan captured in `pattern-10.md`).
  - Activity log entry: 2025-10-02 Stage 3 (Pattern 10) — see activity log for evidence and risks.
  - Additional notes: Monitor navigation listener warnings; tie follow-ups to Stage 5c before closing Stage 6.

## Stage 4 Execution Log (Prerequisites)

- _All Stage 4 lanes completed — see Stage 3 summary for evidence._

### Lane 4a — Helper implementations (Complete)

- [x] Tasks: Build shared guard helpers, update DI seams, ensure TDD coverage in `tests/utils/type-guards.test.ts`.
- Tests/commands: `npm test -- --runTestsByPath tests/utils/type-guards.test.ts`

### Lane 4b — Jest validation (Complete)

- [x] Tasks: Recorded targeted runs for backend/core/interface suites; results embedded in activity log.
- Tests/commands: `npm run test:ci -- --runTestsByPath src/tests/backend/service-discovery.test.ts`

### Lane 4c — Coordination snapshot (Complete)

- [x] Tasks: Aligned Display/Terminal owners on guard adoption; updated schedule + tracker.
- Tests/commands: `npm run test:ci -- --runTestsByPath tests/interfaces/interface-adapter-integration.test.ts`

## Stage 5 Execution Log (Living Stage)

### Lane 5a — Backend Migration

- [x] Status checkbox
- Scope & tasks:
  - Migrate service discovery/router/validator consumers to shared guards.
  - Harden connection factory guard usage.
- Tests/commands:
  - `npm run test:ci -- --runTestsByPath src/tests/backend/service-discovery.test.ts`
  - `npm run test:ci -- --runTestsByPath src/tests/backend/backend-dependency-integration.test.ts`
- Contingencies / notes:
  - Monitor Phase 6 scripts for TypeScript regressions; revert to Stage 3 if new backend helpers needed.

### Lane 5b — Core Orchestration

- [x] Status checkbox
- Scope & tasks:
  - Consolidate guard usage in adapter registry, templum-config-manager, universal-interface-manager.
  - Remove ad-hoc checks once shared helpers are in place.
- Tests/commands:
  - `npm run test:ci -- --runTestsByPath tests/core/adapter-registry.test.ts`
  - `npm run test:ci -- --runTestsByPath tests/core/templum-config-manager-guards.test.ts`
  - `npm run test:ci -- --runTestsByPath tests/core/universal-interface-manager.test.ts`
- Contingencies / notes:
  - If enum/date helpers missing, add Stage 4d lane and revisit Stage 3 before continuing.

### Lane 5c — Interface & Navigation

- [x] Status checkbox
- Scope & tasks:
  - Refactor CLI adapters, navigation parsers, and interface integration tests to shared guards.
  - Address listener warnings via shared cleanup helper.
- Tests/commands:
  - `npm run test:ci -- --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts`
  - `npm run test:ci -- --runTestsByPath src/interfaces/navigation/__tests__/navigation-system.test.ts`
  - `npm run test:ci -- --runTestsByPath tests/interfaces/interface-adapter-integration.test.ts`
- Contingencies / notes:
  - Keep listener warnings tracked; Stage 6 ensures resolution.

### Lane 5d — Session & Shared Utilities

- [x] Status checkbox
- Scope & tasks:
  - Update session manager, service/terminal/protocol utils to rely on shared guards.
  - Confirm DI seams remain intact.
- Tests/commands:
  - `npm run test:ci -- --runTestsByPath src/tests/utils/service-utils.test.ts`
  - `npm run test:ci -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts`
  - `npm run test:ci -- --runTestsByPath src/tests/utils/protocol-utils.test.ts`
  - `npm run test:ci -- --runTestsByPath src/tests/session/templum-universal-session-manager.test.ts`
- Contingencies / notes:
  - Watch for session regressions; if found, expand Stage 4 lanes to cover additional mocks.

### Validation Artefacts & Commands (summary)

- `npm run test:ci -- --runTestsByPath src/tests/backend/service-discovery.test.ts`
- `npm run test:ci -- --runTestsByPath tests/core/adapter-registry.test.ts`
- `npm run test:ci -- --runTestsByPath src/interfaces/navigation/__tests__/navigation-system.test.ts`
- `npm run test:ci -- --runTestsByPath src/tests/utils/service-utils.test.ts`
- `npm run test -- --runTestsByPath tests/utils/type-guards.test.ts`

### Adjustments & Additional Consumers

- Documented reopened navigation listener work; resolved during Stage 5c.

### Issues Encountered & Mitigations

- Addressed TypeScript leak guard warnings; see Stage 5c notes.

### Coordination Notes / Blockers

- Navigation listener warnings escalated and resolved before Stage 6 validation.

## Stage 6 Close-Out

- **Date**: 2025-10-07T14:20:00Z
- Final validation summary:
  - Re-ran targeted leak-guard suites after the Stage 5 interface/session refinements; backend, core, interface, utilities, and session coverage all pass.
  - Confirmed listener cleanup remains stable and TypeGuards helpers back shared migrations without new warnings.
- Validation commands executed:
  - `CI=1 npm run test:ci -- --runTestsByPath src/tests/backend/service-discovery.test.ts`
  - `CI=1 npm run test:ci -- --runTestsByPath tests/core/adapter-registry.test.ts`
  - `CI=1 npm run test:ci -- --runTestsByPath src/interfaces/navigation/__tests__/navigation-system.test.ts`
  - `CI=1 npm run test:ci -- --runTestsByPath src/tests/utils/service-utils.test.ts`
  - `CI=1 npm run test:ci -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts`
  - `CI=1 npm run test:ci -- --runTestsByPath src/tests/utils/protocol-utils.test.ts`
  - `CI=1 npm run test:ci -- --runTestsByPath src/tests/session/templum-universal-session-manager.test.ts`
  - `CI=1 npm test -- --runTestsByPath tests/utils/type-guards.test.ts --runInBand`
- Remaining follow-ups or TODOs:
  - None — continue routine monitoring via Cohort A health checks.
- Evidence links:
  - Activity log entry 2025-10-07 Stage 6, tracker updates, `docs/current/progress.md` snapshot.
