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

## Current Assessment (2025-10-05)

- Implementation: `TemplumBackendServiceRouter` does not emit any lifecycle payloads; there is no `BackendConnectionLifecycleEvent` type or wiring in the codebase.
- Tests: No suites cover lifecycle broadcasting, and the existing backend integration test already fails earlier (see `npm test -- src/tests/backend/generic-backend-integration.test.ts`).
- Follow-up: introduce the contract/interface types, add router/core listeners, and build targeted tests before revisiting integration coverage.
