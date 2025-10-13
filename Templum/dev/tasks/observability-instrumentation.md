# Task: Structured metrics and logging in place

## Requirement Summary

- Status: `[~]`
- Requirement text: "Structured metrics and logging in place (observability blueprint documented; confirm runtime wiring)."

## Prerequisites

- [ ] None.

> MVP subset: see `dev/tasks/mvp/observability-baseline.md` for the minimal logging/metric wiring required before shipping.

## Implementation Steps

### Unblocked Actions

- [ ] Fix the ObservabilityAdapter initialization regression surfaced by `npm test -- --runTestsByPath tests/core/observability-adapter.test.ts` (2025-10-12: fails with `Cannot read properties of null (reading 'level')` when bootstrapping without a configured sink) so console fallbacks are no longer triggered and structured metrics/logging initialize cleanly.
- [ ] Reconcile the documented blueprint with the active implementation by reviewing `docs/archive/observability-infrastructure.md` and module exports under `Templum/src/observability/` so defaults, alerting rules, and helper factories match the runtime needs for logging, metrics, and alerts.
- [x] Wrap observability/resilience emitters with the shared `EventUtils` batch subscription/forwarding flow so `TemplumObservabilitySystem` mirrors Node `process` payloads onto the global bus and resilience managers expose scoped buses with cleanup-aware teardown (2025-10-12).
- [ ] Ensure every runtime entrypoint (`Templum/src/index.ts`, `Templum/src/extension.ts`, `Templum/src/cli-entry.ts`) instantiates an environment-appropriate `IObservabilityService` (e.g., `createProductionObservabilityAdapter` for packaged builds) before other subsystems start, wiring it into dependency injection and replacing direct `console.*` logging with structured observability calls except where user-facing output must remain.
- [ ] Audit initialization and dependency wiring in `Templum/src/core/adapter-registry.ts` and `Templum/src/core/templum-core.ts` so registry phases, backend discovery, and resource registration record structured logs, counters, and timers via `observabilityService`, adding correlation IDs and runtime metrics instead of console fallbacks.
- [ ] ~~Propagate observability context and telemetry through interface/transport layers by instrumenting `Templum/src/interfaces/adaptive-cli-integration.ts`, `Templum/src/mcp-channel/src/event-listener-manager.ts`, and related MCP lifecycle files to emit metrics for session events, command throughput, and health checks while retiring ad-hoc console statements.~~
- [ ] Extend automated coverage to lock in the wiring: update or add Jest suites (`Templum/tests/core/observability-adapter.test.ts`, `Templum/tests/core/adapter-registry.test.ts`, plus CLI/runtime-focused specs) to assert structured logging hooks, metric emission, and fallback behaviour when observability is unavailable.

## Definition of Done

- Tests to run: `npm test -- --runTestsByPath tests/core/observability-adapter.test.ts tests/core/adapter-registry.test.ts`, `npm run test:health`.
- Validation/commands: `npm run build`, `npm run start:service` (verify structured logs/metrics emitted via observability sinks).
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md` operational observability notes, any affected runbooks or integration guides referencing instrumentation.

## References

- Progress entry: `Templum/docs/current/progress.md:46`
- Architecture context: `Templum/docs/current/architecture-spec.md:17`, `Templum/docs/current/architecture-spec.md:56`
- Observability blueprint: `Templum/docs/archive/observability-infrastructure.md:1`
- Runtime observability modules: `Templum/src/observability/templum-observability-system.ts:1`, `Templum/src/observability/observability-adapter.ts:1`, `Templum/src/observability/index.ts:1`
- Core wiring touchpoints: `Templum/src/core/adapter-registry.ts:1237`, `Templum/src/core/templum-core.ts:110`
- Existing tests: `Templum/tests/core/observability-adapter.test.ts:1`, `Templum/tests/core/adapter-registry.test.ts:35`

## Current Assessment (2025-10-12)

- Implementation: Stage 4 lane 4c aligns the observability system and resilience utilities with the shared `EventUtils` infrastructure — `TemplumObservabilitySystem` batch-subscribes to the Node `process` emitter for `templum:error`/`templum:metrics` payloads and forwards them to the global bus plus the system emitter, while `ResilienceManager` instances expose scoped buses that forward fallback/rollback telemetry with cleanup-aware teardown and mirrored debug logging. Run 2025-10-12 revealed the adapter bootstrap path now throws (`Cannot read properties of null (reading 'level')`) during `ObservabilityAdapter.initialize`, so structured wiring must be reinstated before progressing.
- Tests: `npm run test -- --runTestsByPath src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/backend-serialization-log.test.ts` confirms the consolidated emitters keep backend lifecycle and serialization logging flows stable.
- Gaps: Entry-point wiring (`src/index.ts`, `src/extension.ts`, `src/cli-entry.ts`) still relies on console fallbacks, and blueprint reconciliation across adapter/registry layers remains open per the remaining checklist items.
