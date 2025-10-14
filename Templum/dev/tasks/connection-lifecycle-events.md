# Task: Connection lifecycle event broadcasting

## Requirement Summary

- Status: [x]
- Requirement text: "Connection lifecycle event broadcasting to interfaces/logs."

## Prerequisites

- [ ] None.

## Implementation Steps

- Added Jest coverage in `src/tests/backend/backend-connection-lifecycle.test.ts` to drive mocked discovery/connection flows and assert lifecycle payloads for connect, failure, disconnect, health degraded, and recovery, ensuring `TemplumBackendServiceRouter` emits normalized events via the new lifecycle channel.
- Added `src/tests/core/templum-core-connection-events.test.ts` to verify `TemplumCore` subscribes to router lifecycle events, logs via the observability adapter, re-emits them, and forwards updates to the state manager/adapters.
- Extended `src/types/templum-types.ts` with the `BackendConnectionLifecycleEvent` contract and introduced `BackendLifecycleChannel` (`src/backend/lifecycle/backend-lifecycle-channel.ts`) to emit deduplicated lifecycle states (`connected`, `disconnected`, `recovered`, `failed`, `health-degraded`) during connect/disconnect/recovery paths.
- Wired `TemplumBackendServiceRouter` to use the lifecycle channel, expose an `onLifecycleEvent` hook, and respect disabled health monitoring in tests while still updating state and broadcasting transitions.
- Updated `TemplumCore` to subscribe to lifecycle events during initialization, log via observability, re-emit `backend:lifecycle`, and call the enhanced state manager to sync adapter-facing status/notifications.
- Enhanced `EnhancedStateManager` to accept lifecycle events, dedupe them, broadcast via IPC, and maintain a snapshot for downstream consumers.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests executed: `npm test -- --runTestsByPath src/tests/backend/backend-connection-lifecycle.test.ts` (via `scripts/run-with-timeout.mjs`). `npm test -- --runTestsByPath src/tests/core/templum-core-connection-events.test.ts` pending broader stability effort.
- Validation/commands: `npm run validate:component` not required (DI contracts untouched beyond lifecycle listener additions).
- Documentation updates in progress: `docs/current/progress.md`, `docs/current/architecture-spec.md`, `docs/target/post-mvp-progress.md` (if applicable).

## References

- Progress entry: `docs/current/progress.md:14`
- Architecture: `docs/current/architecture-spec.md` (Backend Connectivity, Operations & Observability)
- Source: `src/backend/backend-service-router.ts`, `src/core/templum-core.ts`, `src/state/enhanced-state-synchronization.ts`, `src/types/templum-types.ts`
- Tests: `src/tests/backend/generic-backend-integration.test.ts`, `src/tests/core/templum-core-connection-events.test.ts`

## Current Assessment (2025-10-14)

- Implementation: Lifecycle broadcasting remains fully wired—`TemplumBackendServiceRouter` now hosts its events via `createEventBusHost` (Stage 6 lane 6i), forwarding typed lifecycle payloads through `BackendLifecycleChannel` while `TemplumCore` and the state/observability stacks consume the shared bus introduced during Stage 4. Stage 6 lane 6i closed by refactoring `src/utils/event-bus-adapter.ts`, updating the router hand-off, and stabilising the `PathUtils` guard; evidence captured at `tmp/consolidation/pattern-4-stage6/lane-6i-test-ci-20251013T224301Z.log`, `tmp/consolidation/pattern-4-stage6/lane-6i-phase6-validation-20251013T224530Z.log`, and `tmp/consolidation/pattern-4-stage6/lane-6i-phase6-health-20251013T224542Z.log`. Stage 6 lane 6j (2025-10-13) aligned the downstream observability, monitoring, risk, and validation consumers with the same typed bus, eliminating raw `EventEmitter` subclasses in `src/observability/templum-observability-system.ts`, `src/monitoring/cli-performance-monitor.ts`, `src/risk/*.ts`, and `src/validation/*.ts` so lifecycle telemetry stays zero-knowledge end-to-end. Stage 6 lane 6l (2025-10-14) collapsed the observability scoped bus onto the shared adapter, ensuring risk emitters and telemetry consumers share the event-driven seam without extra bridging before the live backend rerun.
- Implementation: Stage 5 alignment (2025-10-12) reran the gating battery under mocks, confirmed ServiceDiscovery/ConnectionFactory operate without backend knowledge, and positioned Stage 6 lanes to begin with pending real-backend validation. Stage 7 refreshed the backend validation artefacts (`tmp/consolidation/pattern-4-stage7/`) and corrected the logger context wiring in `src/backend/connection-factory.ts` so the TypeScript build consistently passes before we schedule the live backend window.
- Tests: Targeted coverage (`npm run test -- --runTestsByPath src/tests/backend/backend-connection-lifecycle.test.ts src/tests/core/templum-core-connection-events.test.ts`) stays green alongside Stage 5 gating commands (`npm run phase6-validation`, `npm run phase6-health`, `npm run test -- --runTestsByPath src/tests/backend/backend-serialization-log.test.ts src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/manual-override-flow.test.ts src/tests/backend/manual-override-watcher.integration.test.ts`) with logs stored in `tmp/consolidation/pattern-4-stage5/`; the mock harness parity fix (log `tmp/consolidation/pattern-4-stage5/phase6-validation-after-mock-perf-adjust.log`) captures the updated Phase 6 report (`validation-reports/phase6-validation-2025-10-12T12-38-55-983Z.md`) where false-positive performance/cross-interface warnings are cleared. Stage 7 re-ran the backend serialization/connection/manual-override battery plus `npm run phase6-validation`/`npm run phase6-health`, with new logs archived in `tmp/consolidation/pattern-4-stage7/`. Stage 6 lane 6g extends the typed bus audit to the backend/MCP harness with the consolidated Jest run stored at `tmp/consolidation/pattern-4-stage6/lane-6g-test-run-20251012T205958Z.log`, Stage 6 lane 6j records the CI + Phase 6 gating reruns under `tmp/consolidation/pattern-4-lane-6j/`, and Stage 6 lane 6l adds the focused event-driven regression sweep (`tmp/consolidation/pattern-4-stage6/lane-6l/event-driven-migration-tests.log`) covering the adapter stack and new risk emitter guard.
- Follow-up: Repeat the gating battery against live backends once partner services are available, and chase the performance regression/cross-interface warnings captured in the mock-backed Phase 6 report before closing Stage 6 lane 6a.
