# Task: Zero-knowledge backend registry auto-discovery verification

## Requirement Summary

- Status: `[x]`
- Requirement text: "Zero-knowledge backend registry with auto-discovery (needs verification in latest build)."
- Waiver: ~~Run latest-build Phase 6 real backend verification~~ — moved to `dev/tasks/phase6-validation-signal.md` for post-MVP tracking (approved 2025-10-07).

## Prerequisites

- [x] Multi-protocol auto-registration with health checks (documented; requires runtime validation). — Completed for this build (see `dev/tasks/multi-protocol-auto-registration.md`); live Phase 6 evidence is deferred post-MVP but no longer blocks registry verification.

## Implementation Steps

### Unblocked Actions

- [x] Extend `src/backend/service-discovery.ts` so `ServiceDiscoveryOptions` can accept an explicit `watchDirectories` override and reuse it in `ServiceDiscovery.initializeFileWatching` to point the watcher at test/workspace-specific `.templum/services` paths without touching the developer profile. *(2025-10-07 — added `ServiceDiscoveryFileWatcher` helper and override plumbing)*
- [x] Add a Jest scenario in `src/tests/backend/service-discovery.test.ts:45` that provisions a temporary `.templum/services` directory, writes/updates/removes a manifest JSON, and asserts `serviceDiscovered` / `serviceRemoved` events update `getBackendConfigs()` with health-checked entries. *(2025-10-07 — new "File watcher integration" suite with chokidar stub)*
- [x] Expand `src/tests/backend/generic-backend-integration.test.ts:520` (or add a focused spec) to seed a discovered service via the watcher path, stub `ConnectionFactory.create`, and verify `TemplumBackendServiceRouter.discoverAndConnect()` promotes the service into `serviceHealth` and connection caches. *(2025-10-07 — added watcher-driven discovery regression test)*
- [x] Capture the latest-build manual verification checklist in `docs/current/1.2-Backend-Integration-Guide.md:200` covering `examples/minimal-backend`, the generated `~/.templum/services/*.json`, and expected discovery/health log output. *(2025-10-07 — added "Manual Verification Checklist" with command snippets and log expectations)*

### Blocked Actions (pending [?] Multi-protocol auto-registration with health checks)

- [ ] After the auto-registration requirement is validated, add cross-protocol coverage (IPC/WebSocket) in `src/tests/backend/generic-backend-integration.test.ts` that drops manifests for Haruspex/Litany backends and confirms discovery confidence + health priority ordering.

## Definition of Done

- Tests: `npm test -- src/tests/backend/service-discovery.test.ts src/tests/backend/generic-backend-integration.test.ts src/tests/backend/backend-dependency-integration.test.ts`; `npm run test:health`.
- Validation: `cd examples && ./test-minimal.sh` (or `test-minimal.bat` on Windows) to confirm manifest auto-discovery logs the connected backend in the latest build.
- Documentation: Update `docs/current/progress.md`, `docs/current/architecture-spec.md`, and `docs/current/1.2-Backend-Integration-Guide.md` with verification outcomes.

## References

- docs/current/progress.md:7
- docs/current/architecture-spec.md:32
- docs/current/1.2-Backend-Integration-Guide.md:204
- src/backend/service-discovery.ts (`ServiceDiscovery.initializeFileWatching`, `ServiceDiscovery.handleServiceFileChange`, `ServiceDiscovery.handleServiceFileRemoval`)
- src/backend/backend-service-router.ts:649
- src/tests/backend/service-discovery.test.ts:45
- src/tests/backend/generic-backend-integration.test.ts:520
- examples/README.md:37

## Current Assessment (2025-10-07)

- Implementation: Service discovery now routes through a dedicated `ServiceDiscoveryFileWatcher`, accepts workspace/test overrides via `watchDirectories`, and keeps `.templum/services` creation scoped to the resolved directories.
- Tests:
  - `npm test -- --runTestsByPath src/tests/backend/service-discovery.test.ts src/tests/backend/generic-backend-integration.test.ts` (pass) exercises manifest add/change/remove flows and router promotion of watcher-discovered services.
  - `npm test -- src/tests/backend/backend-dependency-integration.test.ts` (pass) continues to cover manifest ingestion and ConnectionFactory wiring under mocks.
  - `npm run test:health` (pass) confirms health instrumentation after the router fix.
- Coverage: `npm run test:coverage` remains flaky due to `babel-plugin-istanbul`; coverage work is tracked separately.
- Outstanding gaps: Phase 6 real-service verification remains deferred; capture evidence once partner backends are runnable (tracked via `dev/tasks/phase6-validation-signal.md`).
