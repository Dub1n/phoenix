# Task: Feature flags for scaling enterprise options

## Requirement Summary

- Status: [ ]
- Requirement text: "Feature flags for scaling enterprise options."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Add TDD coverage in `tests/core/feature-flags-enterprise.test.ts` that instantiates the new feature flag registry, loads defaults from `TemplumConfigManager`, toggles flags, and asserts that downstream consumers (`backendIntegrationConfig`, `TemplumObservabilitySystem`, `UniversalSessionManager`) receive change events or mocked callbacks.
- [ ] Create `src/core/feature-flag-registry.ts` defining the enterprise flag catalog (observability, audit logging, high-concurrency sessions, aggressive discovery) with metadata, dependency validation, and change notifications; export a DI-friendly interface that other modules can consume without duplicating config parsing.
- [ ] Extend `src/core/templum-config-manager.ts` to read/write the `featureFlags` node (Zod schema, templates, persistence) and to emit consolidated `config:feature-flags-updated` events; update `TemplumConfigTemplates` so the `enterprise` template turns all enterprise flags on and non-enterprise templates default them off.
- [ ] Refactor modules currently hardcoding enterprise behaviour—`src/backend/backend-integration-config.ts`, `src/backend/service-discovery.ts`, `src/registry/pcl-menu-registry.ts`, `src/commands/universal-command-registry.ts`, `src/observability/templum-observability-system.ts`, `src/session/universal-session-manager.ts`—to depend on the registry instead of ad hoc checks (remove `PHASE` comments, delete unused fields, ensure feature toggles gate expensive paths and adjust audit log retention/metrics accordingly).
- [ ] Surface configuration knobs for operators: expose CLI toggles via `src/cli-entry.ts` or configuration commands, update `.templum/config.json` bootstrapping (and `templum-valconfig.json`) with documented defaults, and add developer docs under `docs/current/architecture-spec.md` once flag-driven scaling ships.

### Blocked Actions (pending Audit hooks aligned with compliance requirements)

- [ ] Once compliance audit hooks land, map the audit-related feature flag to the finalized sinks so toggling updates `src/commands/universal-command-registry.ts` audit pipelines and compliance reporters.

## Definition of Done

- Tests to run: `npm test`, `npm run test:backend`, focused new suites (`npm test -- tests/core/feature-flags-enterprise.test.ts`), `npm run lint`, `npm run check:types`.
- Validation/commands: `npm run validate:templum` to confirm configuration wiring, `npm run coverage` to verify ≥80% coverage on new units.
- Documentation to update: `docs/current/progress.md` (status + notes), `docs/current/architecture-spec.md` (Operations & Observability + Config sections), operator guides describing feature flag toggles.

## References

- Progress entry: `docs/current/progress.md:48`
- Architecture spec: `docs/current/architecture-spec.md:26`, `docs/current/architecture-spec.md:56`
- Code touchpoints: `src/core/templum-config-manager.ts`, `src/backend/backend-integration-config.ts`, `src/backend/service-discovery.ts`, `src/observability/templum-observability-system.ts`, `src/commands/universal-command-registry.ts`, `src/session/universal-session-manager.ts`
