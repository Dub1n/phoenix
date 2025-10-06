# MVP Task: Baseline Observability Wiring

## Purpose

Establish minimal structured logging and health metrics needed for the Templum MVP without enabling the full observability blueprint.

## Scope

- Wrap existing `console` calls in backends/discovery with `observabilityService` so lifecycle events and errors emit structured logs.
- Emit a single health counter/heartbeat (registry discovery success) to prove metric plumbing.
- Provide a `reset()` hook on the observability adapter for tests to clear listeners/records.

## Implementation Checklist

- [ ] Instantiate the lightweight observability adapter in `src/index.ts` (`bootstrapService`), `src/cli-entry.ts` (`bootstrapCLI`), and `src/extension.ts` (`activate`) before other components start.
- [ ] Update `TemplumCore` discovery hooks (`TemplumCore.registerBackendEvents`, `TemplumCore.handleDiscoveryCompleted`) to log `discoveryStarted`, `serviceDiscovered`, `serviceRemoved`, and lifecycle failures through the adapter.
- [ ] Emit a heartbeat metric (e.g., `registry.last_success_timestamp`) after successful discovery inside `TemplumBackendServiceRouter.discoverAndConnect` and expose a getter for tests.
- [ ] Add targeted Jest coverage under `tests/core/observability-adapter.test.ts` to assert structured logs & heartbeat emission.

## Out of Scope (Post-MVP)

- ~~Rich telemetry for interface adapters and MCP runtime.~~
- ~~Alerting integrations, dashboards, or advanced metric suites.~~
- ~~Full blueprint reconciliation and documentation refresh.~~

## References

- `dev/tasks/observability-instrumentation.md` (full blueprint, deferred work)
- `src/observability/observability-adapter.ts`
- `tests/core/observability-adapter.test.ts`
- Progress entry: `docs/current/progress.md` (Observability section)
