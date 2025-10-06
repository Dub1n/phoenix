# Task: Connection lifecycle event broadcasting

## Requirement Summary

- Status: [ ]
- Requirement text: "Connection lifecycle event broadcasting to interfaces/logs."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Add Jest coverage first in `src/tests/backend/generic-backend-integration.test.ts` (or a focused `src/tests/backend/backend-connection-lifecycle.test.ts`) that drives the generic discovery/connection path with mocked `ServiceDiscovery` and `ConnectionFactory` so the router emits `connection:lifecycle` payloads via `TemplumBackendServiceRouter.emitLifecycleEvent` for success, retry failure, and explicit disconnect; assert payload shape (`backendId`, `state`, timing, error detail) to lock behaviour before implementation.
- [ ] Introduce a core-level spec (e.g., `src/tests/core/templum-core-connection-events.test.ts`) with stubbed `stateManager`/`observabilityService` dependencies to prove `TemplumCore` subscribes to lifecycle events, logs via `TemplumCore.logInfo`/`TemplumCore.logWarn`, re-emits the payload, and calls `stateManager.syncState` with interface-facing notifications/status updates keyed by backend.
- [ ] Extend `src/types/templum-types.ts` with a reusable `BackendConnectionLifecycleEvent` contract and update `src/backend/backend-service-router.ts` (`connectToServiceGeneric`, `handleServiceFailure`, `handleSuccessfulConnection`) to emit normalized lifecycle events (`connected`, `disconnected`, `recovered`, `failed`, `health-degraded`) from the connect/disconnect/recovery paths, ensuring helper utilities deduplicate chatter and update existing health maps consistently.
- [ ] Wire `src/core/templum-core.ts` initialization (`TemplumCore.initialize`, `TemplumCore.registerBackendEvents`) to register the router listeners, funnel events through the observability adapter (info vs warn/error), re-emit them from the core, and invoke the enhanced state manager so adapters receive a broadcast-ready status/notification payload.
- [ ] Teach `src/state/enhanced-state-synchronization.ts` (`EnhancedStateManager.handleBackendLifecycleEvent`, `EnhancedStateManager.broadcastLifecycleUpdate`) to accept the new lifecycle updates—convert them into broadcast messages/notifications without flooding, and make sure CLI/VSCode adapters can render the latest backend connection state.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests to run: `npm test -- --testPathPattern="backend-connection-lifecycle"`, `npm test -- --testPathPattern="templum-core-connection-events"`, followed by full `npm test` once targeted suites pass.
- Validation/commands: `npm run validate:component` if adapter wiring changes touch DI factory expectations.
- Documentation to update: `docs/current/progress.md` (status note + task link), `docs/current/architecture-spec.md` Backend Connectivity & Operations sections, interface adapter docs if new notification surfaces.

## References

- Progress entry: `docs/current/progress.md:14`
- Architecture: `docs/current/architecture-spec.md` (Backend Connectivity, Operations & Observability)
- Source: `src/backend/backend-service-router.ts`, `src/core/templum-core.ts`, `src/state/enhanced-state-synchronization.ts`, `src/types/templum-types.ts`
- Tests: `src/tests/backend/generic-backend-integration.test.ts`, `src/tests/core/templum-core-connection-events.test.ts`

## Current Assessment (2025-10-05)

- Implementation: `TemplumBackendServiceRouter` does not emit any lifecycle payloads; there is no `BackendConnectionLifecycleEvent` type or wiring in the codebase.
- Tests: No suites cover lifecycle broadcasting, and the existing backend integration test already fails earlier (see `npm test -- src/tests/backend/generic-backend-integration.test.ts`).
- Follow-up: introduce the contract/interface types, add router/core listeners, and build targeted tests before revisiting integration coverage.
