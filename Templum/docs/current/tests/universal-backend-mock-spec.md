---
doc-type: architecture-spec
name: Canonical Backend Mock Specification
tags: [templum, backend, mock]
status: draft
last_updated: 2025-10-16
---

# Canonical Backend Mock Specification

## 0. Purpose

- Provide a single, documented backend example that exercises the Universal Interface contract across discovery, skin delivery, and command routing.
- Replace ad-hoc mocks in tests so Phase 6, backend integration, and future partner validation share the same behaviours.
- Enable deterministic, high-fidelity validation without requiring Haruspex or Phoenix Code Lite services during MVP.

## 1. Scope & Goals

- **Scope:** Node-based reference backend (with IPC/HTTP hooks) bundled in-repo under `examples/`.
- **Goals:**
  - Support every discovery pathway called out in `docs/current/1.2-Backend-Integration-Guide.md` (auto-registration file, explicit config, port scan).
  - Serve a standards-compliant `UniversalSkinDefinition` via `GET /getSkinDefinition`.
  - Process command executions via `POST /executeCommand` with deterministic responses and optional latency/telemetry controls.
  - Optionally expose `GET /health` and metrics endpoints so suites that expect them can assert richer signals.
  - Remain lightweight enough for Jest/integration harnesses while still reflecting partner capabilities (skin metadata, multi-command flows, connection lifecycle).

## 2. Capability Tier Definitions

| Tier | Capability Flag | Required Behaviour | Notes |
| --- | --- | --- | --- |
| Core | `command-routing` | Backend advertises at least one discovery path, exposes `GET /getSkinDefinition`, and routes commands via a handler (HTTP `POST /executeCommand` or equivalent bridge). | Minimum contract; guarantees adapters can render skins and execute workflows. |
| Core (optional) | `discovery-manifest` | Drops `.templum/services/*.json` manifest with service metadata. | Strongly recommended for zero-config discovery; not mandatory if static config is supplied. |
| Core (optional) | `discovery-scan` | Listens on ports 3001–3004 with known probe endpoints. | Enables legacy port-scan discovery for CLI demos/tests. |
| Enhanced | `health` | Implements `GET /health` (and optional `/shutdown`) to report service state. | **MVP requirement for canonical mock.** Phase 6 and health scripts consume this when present; absence downgrades status to “estimated”. |
| Enhanced | `telemetry` | Emits structured performance metrics (response time, memory, etc.) via logs or an endpoint. | **MVP requirement for canonical mock.** Allows Phase 6 to diff against baselines. |
| Enhanced | `ipc` / `websocket` | Provides additional transports beyond HTTP for partner scenarios. | **MVP requirement for canonical mock.** Needed to exercise existing IPC/WebSocket validation suites. |
| Enhanced | `streaming` | Supports streaming command output (chunked responses or WebSocket feed) alongside buffered results. | **Post-MVP** — implementation deferred; capability reserved for future use. |
| Enhanced | `state` | Exposes a lightweight state snapshot endpoint or includes `state` blocks in command responses. | Post-MVP roadmap (capability defined; runtime support pending). Optional for backends that manage workflow state server-side; Templum can otherwise aggregate state client-side. |

- Capability flags live alongside `backendConfig.capabilities`, enabling Templum to determine available features without branching code paths.
- Backends advertise whichever optional extras they implement; consumers must treat missing flags as “feature unavailable” rather than failure.

## 3. Canonical Mock Requirement Summary

- **Minimum viable mock (Core tier):**
  - Discovery: auto-registration manifest + static config fixture; optional port scan listener.
  - Interface contract: `GET /getSkinDefinition`, `POST /executeCommand` (with deterministic results, error responses, and stateful example).
  - Metadata: `backendConfig` includes `capabilities: ['command-routing']` and advertises optional extras via additional flags.
  - Command mapping: provide templates for CLI-wrapped tools (e.g., `rg`) illustrating how inputs map to command execution.
- **Enhanced mock bundle (optional tier):**
  - Health endpoint returning status, uptime, mode; supports toggling degraded states via env vars. *(MVP deliverable.)*
  - Telemetry hooks wired into Phase 6 baseline logger (structured log payloads or JSON endpoint). *(MVP deliverable.)*
  - IPC/WebSocket bridge for Haruspex/PCL parity, exercised by integration suites. *(MVP deliverable.)*
  - Configurable latency/error injection to test resilience paths.
- **Deferred enhancements (post-MVP):**
  - Streaming output support (chunked responses/WebSocket feed).
  - Backend-managed state snapshots (`state` capability implementation).
- **Documentation expectations:**
  - Integration guide conveys the tier system and capability flags.
  - Mock README summarises how to start the service in core vs enhanced mode.
  - Visual layout rules follow Appendix A (`mock-design-spec.md`); validation suites should assert canonical window/menu placement against those definitions.

## 4. Discovery & Lifecycle Requirements

- **Auto-registration:** Emit manifest files under `.templum/services/` mirroring Haruspex/PCL descriptors (service id, endpoints, capabilities, timestamps).
- **Manual configuration:** Provide configuration snippets/tests for `ServiceDiscovery` overrides using the same service definition.
- **Port scanning:** Listen on a configurable port within the standard Phase 6 range (3001–3004) so existing scan-based flows stay valid.
- **Lifecycle hooks:** Surface start/stop logs and clean up manifests to keep tests idempotent; expose scripted startup utilities for suites.

## 5. Interface Contract

- **Skin endpoint:** `GET /getSkinDefinition`
  - Returns a fully populated `UniversalSkinDefinition`, including menus, commands, and interface metadata consumed by CLI/VSCode adapters.
  - Should provide sample workflows that prove cross-interface rendering (e.g., CLI menu sections, VSCode tree views).
- **Command execution:** `POST /executeCommand`
  - Accepts `{ command: string, args?: any }`.
  - Routes to deterministic handlers per command id; returns typed payloads matching adapter expectations.
  - Include at least one command that mutates internal state so tests can assert state sync behaviour.
  - When advertising `streaming`, expose either chunked HTTP responses or an auxiliary WebSocket channel flag so adapters can consume incremental output; otherwise return buffered payloads as today.
- **State exposure (optional):** If advertising `state`, either implement `GET /state` returning a snapshot (recent command results, selections) or include a `state` block in command responses so adapters can reconcile multi-step workflows. Otherwise Templum aggregates state client-side.
- **Execution pipeline shim:** Provide a shared helper (spawn/HTTP/IPC) that manages timeouts, logging, and capability toggles so CLI-based mocks and richer partner emulators use consistent routing.
- **Health (optional but recommended):** `GET /health`
  - Reports status, uptime, environment flags to support Phase 6/health scripts.
  - Allow toggling degraded states via env flags for regression tests.
- **Telemetry (optional extension):** Provide structured logs or metrics endpoint for future observability wiring; not required for MVP but leave affordances.

## 6. Testing & Adoption Plan

- **Primary consumers:**
  - Phase 6 validation harness (`src/tests/integration-validation-framework.ts`).
  - Backend integration suites (`tests/backend/**`, `tests/integration/**`).
  - E2E scaffolding plus CLI generator smoke tests.
- **Migration checklist:**
  1. Replace bespoke mock services in tests with the canonical backend boot helper.
  2. Remove deprecated in-memory Phase 6 mocks once parity is reached, or gate them behind explicit flags.
  3. Document command matrix and sample outputs in the testing guide.
- **Automation:** Provide npm scripts for starting/stopping the mock (e.g., `npm run backend:mock:start`) plus helpers to seed data or toggle modes during tests.
- **Targeted test migrations:**
  - Phase 6 harness (`src/tests/integration-validation-framework.ts`, `npm run phase6-validation`, `npm run phase6-health`, `npm run phase6-validation:full`).
  - Comprehensive backend validation flows (`src/tests/backend/comprehensive-backend-validation.test.ts`, `scripts/run-comprehensive-backend-tests.js`).
  - Integration mocks (`tests/integration/mocks/pcl-mock-service.ts`, `phoenix-code-lite/package.json` scripts) — replace bespoke HTTP mock processes with canonical mock modes.
  - E2E scaffolding (`src/testing/e2e-test-framework.ts`, `tests/e2e/e2e-minimal.test.ts`, `tests/e2e/e2e-complete-workflows.test.ts`).
  - Backend utility guardrails with real metrics (`src/tests/backend/manual-override-watcher.integration.test.ts`, discovery cache suites) — point manifest/telemetry assertions at canonical outputs where practical.
  - Scripts relying on bespoke mocks (`src/scripts/simple-phase6-validation.ts`, `scripts/run-phase6-full.js`) — align generated reports with canonical mock telemetry/health payloads.
  - IPC/WebSocket exercises (Phase 6 orchestrator, `ConnectionFactory` integration smoke tests) — ensure canonical mock exposes IPC endpoints consumed during migration.
- **Negative-path coverage:** Ensure the canonical mock exposes failing command scenarios (unknown command, execution error) and degraded health responses so validation suites can assert error handling consistently.

#### Migration Buckets

| Bucket | Suites / Commands | Current backend usage | Action |
| --- | --- | --- | --- |
| Canonical mock (MVP) | `src/tests/integration-validation-framework.ts`, `npm run phase6-validation`, `npm run phase6-health`, `npm run phase6-validation:full`, `src/scripts/run-phase6-integration-validation.ts`, `src/scripts/simple-phase6-validation.ts`, `scripts/run-phase6-full.js` | In-memory mock orchestrator + ad-hoc telemetry | Rewire to launch canonical mock (HTTP + IPC/WebSocket + telemetry) as the default test backend. |
| Canonical mock (MVP) | `src/tests/backend/comprehensive-backend-validation.test.ts`, `scripts/run-comprehensive-backend-tests.js` | Spawns `examples/minimal-backend` instances | Replace with canonical mock bootstrap helpers (multi-transport coverage, shared metrics). |
| Canonical mock (MVP) | `tests/integration/mocks/pcl-mock-service.ts`, `phoenix-code-lite/package.json:start:service` | Custom HTTP service returning health only | Deprecate in favour of canonical mock profiles (PCL mode) once available. |
| Canonical mock (MVP) | `src/testing/e2e-test-framework.ts`, `tests/e2e/e2e-minimal.test.ts`, `tests/e2e/e2e-complete-workflows.test.ts` | Local `MockBackendService` EventDriven stubs | Swap to canonical mock adapters so end-to-end flows exercise real discovery + command routing. |
| Canonical mock (MVP) | `tests/backend/manual-override-watcher.integration.test.ts`, `src/tests/backend/service-discovery-migration.test.ts` | Temp directories + bespoke manifest/telemetry fixtures | Transition to canonical mock manifest outputs and telemetry payloads while retaining targeted file-watcher setup. |
| Specialized (retain) | `src/tests/backend/manual-override-flow.test.ts`, `tests/backend/connection-factory.test.ts`, `tests/validation/mock-backend-contracts.test.ts` | Purpose-built stubs/mocks validating pure business logic | Keep existing lightweight mocks; canonical mock not required. |
| Specialized (retain) | `tests/service-discovery/pty-mcp-server-test-harness.test.ts` | External MCP/PTY harness with manual binaries | Leave as dedicated suite; document dependency on external tooling. |
| Specialized (retain) | `tests/helpers/**`, unit-level stubs (e.g., `tests/session/unified-session-manager.integration.test.ts`) | Jest mocks / synthetic data | Continue using local stubs; no backend interaction needed. |

## 7. Open Questions & Follow-Ups

- Determine whether IPC simulations (e.g., WebSocket bridge) are required for MVP or can be staged post-MVP.
- Validate that the canonical mock meets partner contract expectations; adjust if Haruspex/PCL specs add endpoints beyond skin/command.
- Align with `optional-backend-mock-harness.md` for progression stages and evidence capture.
- Once real partner services are stable, decide how the mock coexists with live validation (fallback vs. parallel path).

> Status: Draft — sync with `dev/tasks/universal-backend-mock-reference.md` before implementation.

## 8. Current Mock Inventory (2025-10-16)

| Mock / Location | Discovery Behaviour | Skin Delivery | Command Handling | Telemetry / Health | Notes |
| --- | --- | --- | --- | --- | --- |
| `examples/minimal-backend/server.js` | Auto-registers via `.templum/services`, supports port scan, manual config possible via README snippets | `GET /getSkinDefinition` returns comprehensive `UniversalSkinDefinition` with menus/views | `POST /executeCommand` with deterministic sample commands (`example.hello`, `example.status`) | `GET /health`, `/capabilities`, `/version` endpoints; logs metrics but no structured export | Closest to full contract; CLI/tests spawn it as child process |
| Phase 6 in-memory orchestrator (`src/tests/integration-validation-framework.ts`) | No real discovery; mocks service map in memory | Fabricates skins via `MockBackendResponseFactory`, not served over HTTP | Contract-enforced mock responses per workflow id | Emits synthetic performance metrics only | Supports complex workflow scenarios but bypasses actual transports/protocols |
| Simple Phase 6 CLI (`src/scripts/simple-phase6-validation.ts`) | None | Generates randomised metrics; no real skin fetch | Simulated tests only | Randomized service health; no actual endpoints | Useful for demos, diverges from strict harness |
| PCL mock service (`tests/integration/mocks/pcl-mock-service.ts`) | HTTP server with manual start; can be pointed to by tests | No skin response; focused on `/health` only | None | `GET /health`, `/shutdown` | Built to simulate readiness delays for PCL-specific flows |
| E2E mock service (`tests/e2e/e2e-minimal.test.ts`, `src/testing/e2e-test-framework.ts`) | In-memory EventDrivenComponent; no discovery | Returns synthetic data via method calls | `executeCommand` simulated with sleep | Basic health method | Intended for workflow scaffolding, not backend contract validation |
| Misc. test mocks (`tests/backend/__utils__/mock-backend-connection.ts`, discovery stubs) | Bypass discovery by constructing objects directly | Injected skin definitions from fixtures | Method stubs returning canned responses | None | Facilitate unit tests but risk diverging from canonical behaviour |

### Observations

- Only the Express-based minimal backend exercises the real HTTP contract and discovery flows.
- Contract-heavy mocks (Phase 6 harness) are transportless; they validate schema but not the connection surfaces described in the integration guide.
- Several suites maintain custom mock logic, leading to drift in command outputs and manifest metadata.

## 9. Contract Surface Audit & Recommended Updates

### What the Code Currently Expects

- `UniversalSkinDefinition.backendConfig` must include `service`, `protocol`, `endpoint`, `healthEndpoint`, `capabilities`, and timing options (`timeout`, `retries`, `keepAlive`) — `ConnectionFactory` normalises these and will throw without them.
- Discovery consumers (`ServiceDiscovery`, `BackendServiceRouter`) read `.templum/services/*.json` manifests with rich metadata (capabilities arrays, timestamps, health endpoints); bare-bones entries hinder lifecycle events.
- Command execution expects JSON payloads `{ command, args }` and responses containing `success` or `status`, optional `result`, and explicit error details; several adapters also record `metadata` fields when present.
- Phase 6 harness compares telemetry (response time, memory) and workflow consistency; while optional, providing hooks for these metrics enables regression checks without real backends.

### Gaps in `1.2-Backend-Integration-Guide.md`

- The guide highlights skin + command endpoints but downplays the requirement for enriched `backendConfig` fields that Templum now assumes (health endpoint, capabilities, timeout defaults).
- Discovery guidance lacks explicit manifest schema (fields like `registrationTime`, `lastSeen`, `metadata.serviceKind`, `capabilitiesEndpoint`).
- Command responses are shown as minimal `{ success, result }`; reality requires consistent error structures and may benefit from returning `metadata` to support observability.
- No acknowledgement of telemetry hooks or structured logging expectations, yet Phase 6 tooling captures these metrics when available.

### Recommendations

1. Update the integration guide to document the full manifest schema and required `backendConfig` properties, reflecting the expectations in `ConnectionFactory` and `ServiceDiscovery`.
2. Expand the command execution section to mandate explicit `success` boolean, `result` payload, `error` object (with `message`, `code`) for failures, and optional `metadata`.
3. Introduce a section on optional-but-encouraged health/telemetry endpoints, clarifying how Phase 6 and health scripts leverage them.
4. Reference the forthcoming canonical mock as the authoritative implementation example, supplanting bespoke snippets scattered across tests.

These changes ensure the canonical mock — and real partner backends — meet the practical contract surface already assumed by the codebase. Once drafted, mirror the updates in `docs/current/1.2-Backend-Integration-Guide.md` to keep external guidance aligned.

## Appendix

- **Appendix A:** [Canonical CLI Mock Layout](mock-design-spec.md) — authoritative visual rules, component names, and validation checklist for the mock-backed CLI pages.
