# Task: Manual override flow without breaking zero-knowledge behaviour

## Requirement Summary

- Status: [ ]
- Requirement text: "Manual override flow without breaking zero-knowledge behaviour."

## Prerequisites

- [ ] [~] Zero-knowledge backend registry with auto-discovery (needs verification in latest build). *(see `dev/tasks/zero-knowledge-registry.md`)* — ensures manual overrides operate on the verified discovery registry without introducing hardcoded backend knowledge.

## Implementation Steps

### Unblocked Actions

- [ ] Add backend-first tests for the manual override workflow in `src/tests/backend/manual-override-flow.test.ts`, covering applying an override, emitting sanitized override payloads, and reverting to automatic discovery; reuse the existing `MockBackendConnection` helper so the suite asserts we never leak raw endpoints when an override toggles.
- [ ] Introduce a dedicated `ManualOverrideManager` (`src/backend/manual-override-manager.ts`) that tracks override descriptors (serviceId, scope, expiry) with redacted metadata, emits `manualOverride:applied/cleared` events, and consolidates override bookkeeping currently scattered across adapters.
- [ ] Refactor `src/backend/backend-service-router.ts` to own the manager: resolve overrides inside `discoverAndConnectGeneric()`, `connectToService()`, and `executeCommand()`, prioritise overridden services before the automatic ranking while sourcing connection details from `this.backendConfigs`, and publish sanitized override snapshots through the router’s event emitter for subscribers.
- [ ] Extend `src/backend/service-discovery.ts` to surface sanitized descriptors (service id, capability tags, health) for manual overrides and to auto-clear overrides when a watched service file or manifest disappears, ensuring overrides remain aligned with the discovery cache.
- [ ] Expose manual override controls via `src/core/templum-core.ts` and `src/commands/universal-command-registry.ts`, wiring CLI/VSCode adapters so operators can apply or clear overrides using discovered service identifiers while keeping endpoints and credentials hidden from interface payloads.
- [ ] Augment observability/audit logging in `src/observability/observability-adapter.ts` (and related monitoring hooks) to record manual override apply/clear events with hashed identifiers, and update the Backend Connectivity section in `docs/current/architecture-spec.md` to describe the zero-knowledge-safe override path.

### Blocked Actions (pending [~] Zero-knowledge backend registry with auto-discovery (needs verification in latest build). *(see `dev/tasks/zero-knowledge-registry.md`)* )

- [ ] After the registry verification lands, exercise the override flow against the real `.templum/services` watcher (drop a manual manifest, assert overrides apply/clear via file events) and capture the results plus any operational guidance in `docs/current/1.2-Backend-Integration-Guide.md`.

## Definition of Done

- Tests to run: `npm test -- src/tests/backend/manual-override-flow.test.ts src/tests/backend/generic-backend-integration.test.ts src/tests/backend/service-discovery.test.ts`, `npm run test:coverage`.
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-services`.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md` (Backend Connectivity), `docs/current/1.2-Backend-Integration-Guide.md` (manual override procedures).

## References

- docs/current/progress.md:15
- docs/current/architecture-spec.md:32
- dev/tasks/zero-knowledge-registry.md
- src/backend/backend-service-router.ts
- src/backend/service-discovery.ts
- src/core/templum-core.ts
- src/commands/universal-command-registry.ts
- src/observability/observability-adapter.ts
- src/tests/backend/generic-backend-integration.test.ts
- src/tests/backend/service-discovery.test.ts
