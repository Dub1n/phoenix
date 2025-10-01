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

## Stage 3 Updates

- **Date**: TBD
- Adjustments to migration plan:
  - Pending Stage 3 execution.
- Additional consumers identified:
  - Pending Stage 3 execution.
- Validation artefacts (tests/scripts run):
  - Pending Stage 3 execution.
- Issues encountered & mitigations:
  - Pending Stage 3 execution.

## Stage 4 Close-Out

- **Date**: TBD
- Final validation summary:
  - Pending Stage 4 execution.
- Remaining follow-ups or TODOs:
  - Pending Stage 4 execution.
- Evidence links:
  - Pending Stage 4 execution.
