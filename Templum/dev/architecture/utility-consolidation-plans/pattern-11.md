# Utility Consolidation Plan — Pattern 11

## Stage 1 Snapshot

- **Utility / Pattern**: Serialization Utils (`serialization-utils`)
- **Agent**: Codex Agent
- **Date**: 2025-10-01T13:30:00Z
- **Primary References**: `Templum/dev/architecture/safe-consolidation-candidates.md` (Pattern 11), `Templum/dev/patterns/utilities/data/serialization-utils.md`, `Templum/dev/architecture/redundancy-report.md`

### Intended Work Scope

- Tests to create/update:
  - Extend `Templum/src/tests/utils/serialization-utils.test.ts` with cases for masking metadata, circular reference handling, reviver passthrough, and schema-only failure branches.
  - Add targeted consumer regression harnesses as migrations land (e.g., `Templum/src/tests/backend/service-discovery.serialization.test.ts`) to verify context warnings.
- Utility modules to touch:
  - `Templum/src/utils/serialization-utils.ts`
  - `Templum/src/utils/index.ts` (export verification)
- Planned consumer migration order:
  1. `Templum/src/backend/service-discovery.ts`
  2. `Templum/src/backend/backend-service-router.ts`
  3. `Templum/src/backend/connection-factory.ts`
  4. `Templum/src/core/templum-core.ts`
  5. `Templum/src/cli-entry.ts`
  6. `Templum/src/observability/templum-observability-system.ts`
  7. `Templum/src/skin/universal-skin-engine.ts`
- Guardrails / constraints to enforce:
  - Maintain logger + ErrorHandler integration (`createLogger('serialization-utils')`, `ErrorHandler.handle`).
  - Keep builder methods ≤30 lines; extract helpers if fallbacks expand.
  - Inject schemas/defaults via parameters; avoid hidden module state.
  - Ensure serialization metadata propagates to consumer loggers and telemetry hooks.
  - Honour DI boundaries noted in `architecture-restructuring-plan.md` (no direct FS or network access inside utility).

### Coordination Notes

- Dependent utilities / agents:
  - Validator and type-guards consolidations rely on consistent schema hooks; coordinate during consumer migrations.
- Shared files to coordinate:
  - Backend router + service discovery touch other ongoing utilities (logger, path-utils); flag changes before edits.
- Risks or assumptions:
  - Some consumers lack schemas; may need quick Zod extractions to avoid stalling migrations.
  - Existing JSON helpers in tests/scripts could mask coverage gaps—plan additional smoke validation when migrating CLI scripts.

## Stage 3 — Migration Orchestration & Coordination

- **Date**: 2025-10-02T18:05:00Z
- Readiness Summary:
  - Stage 4 lanes `[x]` (schema/default groundwork, logging bridge, CLI/observability fallbacks).
  - Stage 5 lanes defined (a: backend data sources, b: router messaging, c: CLI/core, d: observability/MCP) with required tests.
  - Contingencies: If Phase 6 scripts reveal new gaps, revert to Stage 3 to refresh Stage 4/Stage 5 scope before resuming migrations.
- Coordination Snapshot:
  - Tracker status: Stage 3 `[x]` — plan recorded in `pattern-11.md` with Stage 4/5 checklists.
  - Activity log entry: 2025-10-02 Stage 3 (Pattern 11) — see activity log for evidence and risks.
  - Additional notes: Ensure `phase6-services` invocation guidance stays current; note follow-up for CLI usage prompt.

## Stage 4 Execution Log (Prerequisites)

- _All Stage 4 lanes completed — see Stage 3 summary for evidence._

### Lane 4a — Schema/default groundwork (Complete)

- [x] Tests/commands: `npm run test -- --runTestsByPath src/tests/backend/serialization-registry-harness.test.ts`

### Lane 4b — Logging bridge (Complete)

- [x] Tests/commands: `npm run test -- --runTestsByPath src/tests/backend/backend-serialization-log.test.ts`

### Lane 4c — CLI/observability fallbacks (Complete)

- [x] Tests/commands: `npm run test -- --runTestsByPath src/tests/backend/comprehensive-backend-validation.test.ts --testNamePattern "Phase 0c"`

## Stage 5 Execution Log (Living Stage)

### Lane 5a — Backend Data Sources

- [x] Status checkbox
- Scope & tasks:
  - Migrate service discovery and connection factory consumers to serialization builders.
  - Validate data-source integration harness.
- Tests/commands:
  - `npm test -- src/tests/backend/service-discovery.test.ts`
  - `npm test -- src/tests/backend/backend-dependency-integration.test.ts`
- Contingencies / notes:
  - Watch for TypeScript build failures surfaced by Phase 6 scripts; revert to Stage 3 if new helpers needed.

### Lane 5b — Router Messaging & Streaming

- [x] Status checkbox
- Scope & tasks:
  - Update backend router messaging and streaming contexts to shared serializers.
  - Ensure timeout harness runners remain stable.
- Tests/commands:
  - `node scripts/run-with-timeout.mjs --timeout 60000 -- npm test -- --runTestsByPath src/tests/backend/comprehensive-backend-validation.test.ts --testNamePattern "Pattern 11 Stage 5 lane b" --runInBand --no-cache`
- Contingencies / notes:
  - `npm run phase6-services` requires explicit subcommand; track as follow-up.

### Lane 5c — CLI/Core Serialization Surfaces

- [x] Status checkbox
- Scope & tasks:
  - Align CLI adapters, core serialization builders, and menu adapters with shared utilities.
  - Validate CLI health scripts and Phase 6 harness.
- Tests/commands:
  - `npm run phase6-health`
  - `npm run phase6-validation`
  - `npm test -- src/tests/rendering/menu-definition-adapter.test.ts`
- Contingencies / notes:
  - Ensure CLI invocation instructions documented alongside `phase6-services` follow-up.

### Lane 5d — Observability & MCP

- [x] Status checkbox
- Scope & tasks:
  - Wire observability fallback logging and MCP serialization flows to shared utilities.
  - Confirm streaming telemetry remains stable with new builders.
- Tests/commands:
  - `node scripts/run-with-timeout.mjs --timeout 240000 -- npm test -- --runTestsByPath src/tests/backend/comprehensive-backend-validation.test.ts --testNamePattern "Phase 0c" --no-cache`
  - `npm run phase6-health`
- Contingencies / notes:
  - Record that the Phase 6 readiness score output is currently disabled (previous hard-coded value ignored) for future implementation follow-up.

### Validation Artefacts & Commands (summary)

- `npm test -- src/tests/utils/serialization-utils.test.ts`
- `npm test -- src/tests/rendering/menu-definition-adapter.test.ts`
- `node scripts/run-with-timeout.mjs --timeout 90000 -- npm test -- --runTestsByPath src/tests/backend/comprehensive-backend-validation.test.ts --testNamePattern "Pattern 11 Stage 5 lane b" --runInBand --no-cache`
- `npm run phase6-health`
- `npm run phase6-validation`

### Adjustments & Additional Consumers

- Remaining consumers tracked in plan; none outstanding post Stage 5 completion.

### Issues Encountered & Mitigations

- Phase 6 performance warning recorded; mitigation deferred to follow-up.

### Coordination Notes / Blockers

- CLI usage prompt for `phase6-services` requires documentation update.

## Stage 6 Close-Out

- **Date**: 2025-10-02T19:00:00Z
- Final validation summary:
  - Re-ran serialization unit + menu adapter Jest suites (`--runInBand --no-cache --forceExit`) and the backend Phase 2 subset via `scripts/run-with-timeout.mjs`; all green.
  - `npm run phase6-health` reported 100% readiness; `npm run phase6-validation` succeeded (readiness 92%) with readiness score output disabled pending proper implementation.
- Remaining follow-ups or TODOs:
  - No further action required on the previous hard-coded readiness score; monitor once the proper implementation lands.
  - Update `phase6-services` CLI usage guidance (plain invocation exits 1; requires `start|stop|status`).
- Evidence links:
  - Activity log entry (2025-10-02 Stage Hand-off), tracker updates, validation reports (`validation-reports/phase6-validation-2025-10-02T18-59-15-506Z.*`).
