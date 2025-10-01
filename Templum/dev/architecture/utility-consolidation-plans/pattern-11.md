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

## Stage 2.5 — Migration Orchestration

- **Date**: 2025-10-02T14:00:00Z
- **Stage Lead**: Codex Agent
- **Stage Status**: Phase 0 lanes currently 0a[ ], 0b[ ], 0c[ ]; keep the Stage 2.5 row at `[~]` in the schedule until each lane is `[x]`.
- **Baseline**: Stage 2 suite is green (`npm test -- src/tests/utils/serialization-utils.test.ts` on 2025-10-01); rerun after any helper edits.

### Phase 0 — Helper & Preflight (required)
- [ ] 0a Schema coverage + defaults — add `Templum/src/backend/schemas/serialization-registry.ts` with Zod models for service registry entries, IPC/WebSocket handshake payloads, and CLI request envelopes; surface typed defaults in `Templum/src/backend/defaults/serialization-defaults.ts`. Extend backend fixtures (`Templum/src/tests/backend/service-discovery.test.ts`, plus a focused serializer harness) to cover success, defaults, and fallback flows. Owner: Codex Agent (Stage 2.5).
- [ ] 0b Logging + metadata bridge — introduce a shared backend serialization logger helper (e.g. `Templum/src/backend/backend-serialization-log.ts`) that wraps `createLogger('serialization-utils')` and exposes `emitSerializationWarnings(context, outcome)`. Wire helper exports via `Templum/src/backend/index.ts` for reuse. Owner: Codex Agent (Stage 2.5).
- [ ] 0c CLI & observability fallbacks — document canonical CLI/observability payload defaults in `Templum/src/backend/defaults/serialization-defaults.ts`, ensure telemetry writers consume them, and add regression coverage in `Templum/src/tests/backend/comprehensive-backend-validation.test.ts`. Owner: Codex Agent (Stage 2.5).
- **Validation**: `npm test -- src/tests/utils/serialization-utils.test.ts`, `npm test -- src/tests/backend/service-discovery.test.ts` (new fixtures), and lint on new modules.

### Phase 1 — Backend data sources (Service Discovery + Connection Factory)
- **Owner**: Stage 3 primary (default Codex Agent once 0a–0c are `[x]`).
- **Dependencies**: Phase 0 lanes 0a and 0b.
- **Targets**: `Templum/src/backend/service-discovery.ts`, `Templum/src/backend/connection-factory.ts`, `Templum/src/tests/backend/service-discovery.test.ts`, `Templum/src/tests/backend/backend-dependency-integration.test.ts`.
- [ ] Replace direct `JSON.parse`/`JSON.stringify` with `serialization.fromJson(...).context('backend:service-discovery:<lane>')` and `.json(...)` builders, using Phase 0 schemas/defaults.
- [ ] Forward `result.meta` warnings and statuses to the backend serialization logger; drop raw `console` usage.
- [ ] Refresh mocks/tests to consume the new helpers and assert warning propagation.
- **Validation**: `npm test -- src/tests/backend/service-discovery.test.ts`, `npm test -- src/tests/backend/backend-dependency-integration.test.ts`, `npm run phase6-services`.
- **Contingency**: If additional payload shapes surface, add them to Phase 0a (create 0d lane if needed) before resuming migrations.

### Phase 2 — Router messaging & streaming (Backend Service Router)
- **Owner**: Stage 3 co-agent (assign before kickoff).
- **Dependencies**: Phase 0 lanes 0a/0b complete; Phase 1 recommended first to supply handshake defaults.
- **Targets**: `Templum/src/backend/backend-service-router.ts`, `Templum/src/tests/backend/comprehensive-backend-validation.test.ts`, plus IPC/WebSocket mocks.
- [ ] Wrap IPC/WebSocket message parsing/stringifying with serialization contexts (`backend:router:<channel>`), leveraging shared schemas for `IPCMessage`/`IPCResponse`.
- [ ] Surface serialization outcomes to router health metrics and emit warnings through the shared logger.
- [ ] Update integration tests to expect status-driven flows (`success`/`defaults`/`fallback`) and adjust fixtures.
- **Validation**: `npm test -- src/tests/backend/comprehensive-backend-validation.test.ts`, `npm run phase6-services`.
- **Contingency**: If router traffic reveals missing schemas, pause and extend Phase 0a with dedicated IPC lanes (label as 0d, 0e) before continuing.

### Phase 3 — Core & CLI config surfaces
- **Owner**: Stage 3 agent (assign once Phase 0c is `[x]`).
- **Dependencies**: Phase 0 lanes 0a and 0c; Phase 1 outputs for registry defaults.
- **Targets**: `Templum/src/core/templum-core.ts`, `Templum/src/cli-entry.ts`, `Templum/src/scripts/run-phase6-integration-validation.ts`, related fixtures/mocks.
- [ ] Replace CLI/core JSON writers/readers with serialization builders, ensuring defaults/fallbacks align with Phase 0 constants.
- [ ] Route degraded statuses to CLI feedback channels and templum-core telemetry; remove manual try/catch/console blocks.
- [ ] Update CLI/backend validation suites to assert new metadata propagation.
- **Validation**: `npm test -- src/tests/backend/comprehensive-backend-validation.test.ts`, `npm run phase6-health`, `npm run phase6-validation`.
- **Contingency**: If CLI flow needs extra defaults, expand Phase 0c or add 0f lane; document in activity log before resuming.

### Phase 4 — Observability, skin engine, and remaining consumers
- **Owner**: Stage 3 agent (may run in parallel with Phase 3 after Phase 0 lanes `[x]`).
- **Dependencies**: Phase 0 lanes 0b/0c; coordinate with Phase 2 for shared logging.
- **Targets**: `Templum/src/observability/templum-observability-system.ts`, `Templum/src/skin/universal-skin-engine.ts`, `Templum/src/mcp-channel/src/visual-feedback-system.ts`, `Templum/src/mcp-channel/src/service-registration.ts`, `Templum/src/scripts/run-phase6-integration-validation.ts` (report writers).
- [ ] Swap JSON writers/readers for serialization helpers, reusing shared logger + defaults; use `meta.bytes` to replace manual size calculations.
- [ ] Ensure masked fields and telemetry warnings feed into observability outputs instead of bare `console.log`.
- [ ] Refresh integration/e2e fixtures to recognise serialization metadata.
- **Validation**: `npm test -- src/tests/backend/generic-backend-integration.test.ts`, `npm run phase6-validation`, targeted observability smoke scripts.
- **Contingency**: If additional consumers appear, append them under Phase 4 with sub-checkboxes and update the schedule; create new Phase 0x lanes when helper coverage is required.

### Synchronisation & Reporting
- Update `Templum/dev/architecture/utility-consolidation-schedule.md` after each lane/phase status change (Phase 0 glyphs + Stage 2.5 row).
- Record every phase kickoff/completion in `Templum/dev/architecture/utility-consolidation-activity-log.md` and align checkboxes in `safe-consolidation-candidates.md`.
- When migrations begin, keep Phase 0 lanes locked at `[x]`; if a blocker reopens them, revert the schedule glyph to `[~]` and add a fresh Stage 2.5 log entry before continuing.
- Stage 3 agents should coordinate with type-guards/validator owners when touching shared files; log any cross-utility dependencies.

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
