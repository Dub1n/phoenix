# Pattern 4 Lane 4c — Event Bus Consolidation Evidence

- **Timestamp:** 2025-10-12
- **Scope:** Wired `TemplumObservabilitySystem` and resilience utilities (`src/utils/resilience-utils.ts`) into the shared `EventUtils` batch subscription + forward pipeline so observability/resilience telemetry mirrors the typed global bus with cleanup-aware teardown.
- **Key Changes:**
  - `src/observability/templum-observability-system.ts` now uses a scoped EventUtils bus, batch-subscribes to the Node `process` emitter for `templum:error`/`templum:metrics`, and forwards outputs to both the system emitter and `EventUtils.globalBus`.
  - `src/utils/resilience-utils.ts` exposes scoped buses per manager, forwards fallback/rollback signals to `EventUtils.globalBus`, and registers cleanup-aware telemetry mirrors via `batchSubscribe`.
- **Validation:**
  - `npm run test -- --runTestsByPath src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/backend-serialization-log.test.ts`
    - Result: PASS (observability/resilience event forwarding preserved backend lifecycle + serialization logging flows)

