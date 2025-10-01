# Task: Audit hooks aligned with compliance requirements

## Requirement Summary

- Status: [ ]
- Requirement text: "Audit hooks aligned with compliance requirements."

## Prerequisites

- [ ] [?] Structured metrics and logging in place (observability blueprint documented; confirm runtime wiring). — Audit streaming depends on the observability transport being verified so compliance records can piggyback on the same telemetry channel.

## Implementation Steps

### Unblocked Actions

- [ ] Drive compliance-first coverage: add `tests/compliance/audit-hooks.integration.test.ts` that spins up `TemplumCore` with a stubbed `ComplianceAuditSink`, executes representative flows (command execution through `UniversalCommandRegistry`, backend connect/disconnect via `TemplumBackendServiceRouter`, config updates through `TemplumConfigManager`), and asserts sanitized audit envelopes (`eventType`, `severity`, `subjectId` hash, `timestamp` sync) are emitted for every compliance trigger without leaking raw credentials.
- [ ] Introduce a dedicated audit trail service in `src/compliance/audit-trail-service.ts` (interface + implementation) modelled after the Phoenix `AuditLogger`: enforce schema validation (Zod), deterministic hashing of user/session identifiers, disk persistence under `.templum/audit/`, rotation + retention policy metadata, and an injectable adapter `IAuditTrailService` for unit tests.
- [ ] Wire the audit service through dependency injection: extend `TemplumCore`/`adapter-registry` initialisation to resolve the audit service, expose opt-in toggles from `TemplumConfigManager` (honouring `session.auditLogging`), and make `UniversalCommandRegistry`, `TemplumConfigManager`, `ServiceDiscovery`, `BackendServiceRouter`, and the upcoming `ManualOverrideManager` push structured events to the audit sink alongside observability metrics.
- [ ] Extend `ObservabilityAdapter`/`templum-observability-system` so audit events generate compliance-tagged metrics and alerts (e.g., `audit_events_total`, `audit_compliance_gaps`), and propagate new correlation fields (`complianceCategory`, `validationRunId`) for Validation System ingestion.
- [ ] Publish operator access points: surface read-only audit summaries via `UniversalCommandRegistry` (new `templum.audit.export` handler feeding redacted CSV/JSON) and document CLI/VSCode affordances; ensure output respects retention/PII policies and records the export operation itself as an audit event.
- [ ] Update project documentation (`docs/current/architecture-spec.md` Operations & Observability, `docs/current/1.2-Backend-Integration-Guide.md` compliance section) with the new audit pipeline, storage/rotation expectations, and operational runbooks (including how to toggle `auditLogging` and where Validation System collects evidence).

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests to run: `npm test -- tests/compliance/audit-hooks.integration.test.ts tests/core/observability-adapter.test.ts`, `npm run test:coverage`.
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-validation` to feed audit evidence into the Validation System harness.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, `docs/current/1.2-Backend-Integration-Guide.md`, and add audit retention guidance to compliance/runtime runbooks if applicable.

## References

- docs/current/progress.md:39
- docs/current/architecture-spec.md:32
- docs/current/1.2-Backend-Integration-Guide.md:1078
- src/commands/universal-command-registry.ts
- src/core/templum-config-manager.ts
- src/backend/service-discovery.ts
- src/backend/backend-service-router.ts
- src/observability/observability-adapter.ts
