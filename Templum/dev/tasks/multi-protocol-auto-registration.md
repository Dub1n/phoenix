# Task: Multi-protocol auto-registration runtime validation

## Requirement Summary

- Status: `[?]`
- Requirement text: "Multi-protocol auto-registration with health checks (documented; requires runtime validation)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Standardise `.templum/services` manifest parsing in `src/backend/service-discovery.ts:340` and `src/backend/service-discovery.ts:639` by introducing a typed manifest schema that captures `protocol`, `healthCheck` (type + endpoint), `capabilities`, and `lastSeen`, then route `validateServiceHealth` through protocol-aware helpers (HTTP `http.get`, WebSocket ping via `ws`, IPC handshake via `ConnectionFactory.create`).
- [ ] Update auto-registration producers (`src/core/templum-core.ts:575`, `src/mcp-channel/src/service-registration.ts:67`, `examples/minimal-backend/server.js:240`) to emit the enriched manifest fields for IPC, MCP/TCP, and HTTP services so discovery receives accurate health metadata instead of HTTP-only defaults.
- [ ] Extend `src/tests/backend/service-discovery.test.ts:45` with fixtures that drop HTTP, WebSocket, and IPC manifests into a temporary services directory, then assert `serviceDiscovered` events fire and `getBackendConfigs()` retains healthy entries while rejecting malformed or unhealthy manifests per protocol.
- [ ] Add integration assertions in `src/tests/backend/backend-dependency-integration.test.ts:20` and `src/tests/backend/generic-backend-integration.test.ts:520` that seed multi-protocol manifests, stub protocol-specific health probes, and confirm `ServiceDiscoveryValidator.validateAllServices()` plus `TemplumBackendServiceRouter.discoverAndConnect()` report the services as healthy and connected.
- [ ] Document the runtime verification flow in `docs/current/1.2-Backend-Integration-Guide.md:204`, covering the minimal HTTP backend, `npm run phase6-services` Haruspex/Templum runs, expected `.templum/services/*.json` artefacts for each protocol, and the log signatures proving health checks passed.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests: `npm test -- src/tests/backend/service-discovery.test.ts src/tests/backend/backend-dependency-integration.test.ts src/tests/backend/generic-backend-integration.test.ts`; `npm run test:health`.
- Validation: `npm run phase6-services` to start the multi-protocol suite and confirm `.templum/services/*.json` entries remain after health validation; tail `logs/service-discovery.log` for `[SERVICE_DISCOVERY]` success messages.
- Documentation: Update `docs/current/progress.md`, `docs/current/architecture-spec.md` (ServiceDiscovery/Backend Connectivity), and `docs/current/1.2-Backend-Integration-Guide.md` with recorded verification outcomes.

## References

- docs/current/progress.md:13
- docs/current/architecture-spec.md:32
- docs/current/1.2-Backend-Integration-Guide.md:204
- src/backend/service-discovery.ts:340
- src/backend/service-discovery.ts:639
- src/core/templum-core.ts:575
- src/mcp-channel/src/service-registration.ts:67
- src/tests/backend/service-discovery.test.ts:45
- src/tests/backend/backend-dependency-integration.test.ts:20
- src/tests/backend/generic-backend-integration.test.ts:520
- examples/minimal-backend/server.js:240
