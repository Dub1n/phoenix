# Task: Manual override flow without breaking zero-knowledge behaviour

## Requirement Summary

- Status: [x]
- Requirement text: "Manual override flow without breaking zero-knowledge behaviour."

## Prerequisites

- [x] Zero-knowledge backend registry with auto-discovery (needs verification in latest build). *(see `dev/tasks/zero-knowledge-registry.md`)* — ensures manual overrides operate on the verified discovery registry without introducing hardcoded backend knowledge.

## Implementation Steps

### Unblocked Actions

- [x] Add backend-first tests for the manual override workflow in `src/tests/backend/manual-override-flow.test.ts`, covering applying an override, emitting sanitized override payloads, and reverting to automatic discovery; reuse the existing `MockBackendConnection` helper so the suite asserts we never leak raw endpoints when an override toggles.
- [x] Introduce a dedicated `ManualOverrideManager` (`src/backend/manual-override-manager.ts`) that tracks override descriptors (serviceId, scope, expiry) with redacted metadata, emits `manualOverride:applied`/`manualOverride:cleared` events, and consolidates override bookkeeping currently scattered across adapters.
- [x] Refactor `src/backend/backend-service-router.ts` (`discoverAndConnectGeneric`, `connectToServiceGeneric`, `executeCommand`) to own the manager: resolve overrides before the automatic ranking while sourcing connection details from `backendConfigs`, and publish sanitized override snapshots through the router’s event emitter for subscribers.
- [x] Extend `src/backend/service-discovery.ts` (`handleServiceFileChange`, `handleServiceFileRemoval`) to surface sanitized descriptors (service id, capability tags, health) for manual overrides and to auto-clear overrides when a watched service file or manifest disappears, ensuring overrides remain aligned with the discovery cache.
- [x] Expose manual override controls via `src/core/templum-core.ts` (`TemplumCore.applyManualOverride`, `TemplumCore.clearManualOverride`) and `src/commands/universal-command-registry.ts` so CLI/VSCode adapters can apply or clear overrides using discovered service identifiers while keeping endpoints and credentials hidden from interface payloads.
- [x] Augment observability/audit logging in `src/observability/observability-adapter.ts` (and related monitoring hooks) to record manual override apply/clear events with hashed identifiers, and update the Backend Connectivity section in `docs/current/architecture-spec.md` to describe the zero-knowledge-safe override path.

### Blocked Actions (pending [~] Zero-knowledge backend registry with auto-discovery (needs verification in latest build). *(see `dev/tasks/zero-knowledge-registry.md`)* )

- [x] After the registry verification lands, exercise the override flow against the real `.templum/services` watcher (drop a manual manifest, assert overrides apply/clear via file events) and capture the results plus any operational guidance in `docs/current/1.2-Backend-Integration-Guide.md`.

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

## Current Assessment (2025-10-05)

- Implementation: Manual override manager now drives sanitized descriptors, router/service discovery emit redacted snapshots, and core/command registry expose apply/clear hooks. Watcher validation passes via `src/tests/backend/manual-override-watcher.integration.test.ts`, which drops manifests into `.templum/services`, exercises the file-watcher path, and verifies overrides auto-clear when manifests disappear. Operator guidance captured in `docs/current/1.2-Backend-Integration-Guide.md`.
- Tests: Backend override suites cover both direct apply/clear behaviour (`src/tests/backend/manual-override-flow.test.ts`) and watcher-driven flows (`src/tests/backend/manual-override-watcher.integration.test.ts`).
- Recommendation: Keep the watcher test in the nightly integration bundle and rerun against partner manifests once Haruspex/PCL exports are available.
- 2025-10-14: Pattern 2 Stage 3 replan moved these suites into guardrail lane 4d (paired with runtime lane 6c) to enforce ErrorHandler adoption across the router/resolver/health flows. TODO 2025-10-14: keep the manual override guardrail failing until the migration lands, then capture fresh evidence in `Templum/archive/dev-files/utility-migration/evidence/pattern-2/stage4/lane4d/`.
- 2025-10-15: Pattern 2 Stage 6 lane 6g closed — universal skin engine + backend/router/service-discovery watchers now emit through scoped loggers with WARN thresholds, eliminating direct `console.*` usage. Guardrail suite `node scripts/run-with-timeout.mjs --preset jest-suite -- npx jest src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/comprehensive-backend-validation.test.ts src/tests/backend/generic-backend-integration.test.ts src/tests/backend/manual-override-flow.test.ts src/tests/backend/manual-override-watcher.integration.test.ts` now passes (artefacts: fail `Templum/archive/dev-files/utility-migration/evidence/pattern-2/stage6/lane6g/guardrail-fail-20251015T174627Z.log`, pass `Templum/archive/dev-files/utility-migration/evidence/pattern-2/stage6/lane6g/guardrail-pass-20251015T182547Z.log`); sweep confirms no regressions in `src/skin/universal-skin-engine.ts`.
