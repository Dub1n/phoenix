# Task: Zero-knowledge backend registry auto-discovery verification

## Requirement Summary

- Status: `[~]`
- Requirement text: "Zero-knowledge backend registry with auto-discovery (needs verification in latest build)."

## Prerequisites

- [ ] [?] Multi-protocol auto-registration with health checks (documented; requires runtime validation). — ensures discovery verification spans the health-scored manifests emitted by each protocol.

## Implementation Steps

### Unblocked Actions

- [ ] Extend `src/backend/service-discovery.ts:60` so `ServiceDiscoveryOptions` can accept an explicit `watchDirectories` override and reuse it in `initializeFileWatching()` to point the watcher at test/workspace-specific `.templum/services` paths without touching the developer profile.
- [ ] Add a Jest scenario in `src/tests/backend/service-discovery.test.ts:45` that provisions a temporary `.templum/services` directory, writes/updates/removes a manifest JSON, and asserts `serviceDiscovered` / `serviceRemoved` events update `getBackendConfigs()` with health-checked entries.
- [ ] Expand `src/tests/backend/generic-backend-integration.test.ts:520` (or add a focused spec) to seed a discovered service via the watcher path, stub `ConnectionFactory.create`, and verify `TemplumBackendServiceRouter.discoverAndConnect()` promotes the service into `serviceHealth` and connection caches.
- [ ] Capture the latest-build manual verification checklist in `docs/current/1.2-Backend-Integration-Guide.md:200` covering `examples/minimal-backend`, the generated `~/.templum/services/*.json`, and expected discovery/health log output.

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
- src/backend/service-discovery.ts:76
- src/backend/backend-service-router.ts:649
- src/tests/backend/service-discovery.test.ts:45
- src/tests/backend/generic-backend-integration.test.ts:520
- examples/README.md:37
