# Task: Multi-protocol auto-registration runtime validation

## Requirement Summary

- Status: `[~]`
- Requirement text: "Multi-protocol auto-registration with health checks (documented; requires runtime validation)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

Completed foundations

- [x] Standardise `.templum/services` manifest parsing in `src/backend/service-discovery.ts` ...
- [x] Update auto-registration producers ...
- [x] Extend `src/tests/backend/service-discovery.test.ts:45` ...
- [x] Add integration assertions in `src/tests/backend/backend-dependency-integration.test.ts:20` ...
- [x] Document the runtime verification flow in `docs/current/1.2-Backend-Integration-Guide.md:204` ...

Remaining work (execute in order)

1. [x] **Fix router discovery state** — Resolve `TemplumBackendServiceRouter.discoverAndConnect()` assuming `discoveredBackends.length`; ensure the service cache is initialised before connection attempts (`backend-service-router.ts:904`).
2. [x] **Restore generic integration coverage** — Re-enable `src/tests/backend/generic-backend-integration.test.ts:520` once the router fix lands, updating stubs/mocks so manifest-driven discovery populates command routes and connection factory expectations.
3. [x] **Rerun targeted Jest suite** — `npm test -- src/tests/backend/generic-backend-integration.test.ts` to confirm end-to-end parity after the state fix.
4. [~] **Capture live Phase 6 evidence** — `npm run phase6-services -- start --use-real-backends` (when real services are available) and archive the `[SERVICE_DISCOVERY]` log output alongside manifest snapshots for task evidence. *Rescheduled post-MVP; tracked in `docs/target/post-mvp-progress.md` and `dev/tasks/haruspex-integration.md`.*

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests: `npm test -- src/tests/backend/service-discovery.test.ts src/tests/backend/backend-dependency-integration.test.ts src/tests/backend/generic-backend-integration.test.ts`; `npm run test:health`.
- Validation: `npm run phase6-services` to start the multi-protocol suite and confirm `.templum/services/*.json` entries remain after health validation; tail `logs/service-discovery.log` for `[SERVICE_DISCOVERY]` success messages. *(Real service run deferred post-MVP—execute once partner builds are green.)*
- Documentation: Update `docs/current/progress.md`, `docs/current/architecture-spec.md` (ServiceDiscovery/Backend Connectivity), and `docs/current/1.2-Backend-Integration-Guide.md` with recorded verification outcomes.

## References

- docs/current/progress.md:13
- docs/current/architecture-spec.md:32
- docs/current/1.2-Backend-Integration-Guide.md:204
- src/backend/service-discovery.ts (`ServiceDiscovery.discoverServices`, `ServiceDiscovery.parseServiceDescriptor`, `EndpointScanningDiscoveryStrategy.scanHttpEndpoint`/`scanWebSocketEndpoint`/`scanIpcEndpoint`)
- src/core/templum-core.ts:575
- src/mcp-channel/src/service-registration.ts:67
- src/tests/backend/service-discovery.test.ts:45
- src/tests/backend/backend-dependency-integration.test.ts:20
- src/tests/backend/generic-backend-integration.test.ts:520
- examples/minimal-backend/server.js:240

## Current Assessment (2025-10-06)

- Implementation: `ServiceDiscovery` now parses manifests through `service-manifest.ts`, feeds protocol-aware health checks, and retains only validated entries. Core/minimal-backend producers emit enriched manifests (IPC + HTTP); MCP emission is deferred per updated MVP scope. `ServiceDiscoveryValidator` consumes the upgraded configs without manual patching.
- Tests:
  - `npm test -- src/tests/backend/service-discovery.test.ts src/tests/backend/backend-dependency-integration.test.ts src/tests/backend/generic-backend-integration.test.ts` (pass) alongside `npm run test:health` now covers service cache initialisation, manifest ingestion, and ConnectionFactory routing.
- Validation: Real Phase 6 run is deferred; track re-enablement in `docs/target/post-mvp-progress.md` and `dev/tasks/haruspex-integration.md`.
- Status: Functional parity achieved for this build (mocked + health suites green); live-service verification remains scheduled post-MVP.
- Coverage tooling remains flaky under `npm run test:coverage`; no new attempts were made in this pass.
- Next steps: unblock partner builds, rerun Phase 6 services for live evidence, and retain manifests/logs once Haruspex compilation is green.
