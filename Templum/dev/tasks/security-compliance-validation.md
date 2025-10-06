# Task: Security and compliance validation sign-off

## Requirement Summary

- Status: [ ]
- Requirement text: "Security and compliance validation sign-off (threat model, audit evidence packaged)."

## Prerequisites

- [ ] Audit hooks aligned with compliance requirements. — The evidence bundle must ingest the structured audit events emitted once the audit service wiring is complete.
- [ ] Release pipeline hardening and packaging verification (artifact signing, CI gating, rollback paths). — Sign-off depends on producing signed artifacts and pipeline reports that the security review references.

## Implementation Steps

### Unblocked Actions

- [ ] Author a STRIDE-based threat model in `docs/current/security/threat-model.md` cataloguing Templum assets (e.g., `TemplumCore`, `BackendIntegrationConfig`, `AuditTrailService`), trust boundaries across adapters/backends, and mitigation status mapped to `src/core/templum-core.ts`, `src/backend/service-discovery.ts`, and `src/commands/universal-command-registry.ts`; include residual-risk rankings and sign-off owners.
- [ ] Introduce `src/security/compliance-evidence-collector.ts` exporting helpers to gather hashed audit extracts, validation reports, and configuration snapshots (pulling from `TemplumConfigManager`, `backendIntegrationConfig`, and the audit service), enforce a Zod schema for evidence, and persist `reports/security/evidence-bundle.json` alongside checksum metadata.
- [ ] Extend `src/tests/integration-validation-framework.ts:2969` so `validateSecurityCompliance()` invokes the new collector, verifies encryption settings (`TemplumConfigManager` secrets, backend credential redaction), checks signed artifact metadata, and appends pass/fail results plus pointers to `reports/security/evidence-bundle.json`.
- [ ] Add `tests/compliance/security-validation.integration.test.ts` that spins up `TemplumCore` with mocked credentials, ensures secrets are masked in audit events, asserts `compliance-evidence-collector` outputs the expected schema, and snapshots the bundle for regression.
- [ ] Create `scripts/security/generate-security-evidence.js` to run `npm run test -- tests/compliance/security-validation.integration.test.ts`, execute the integration validation suite, call the collector to produce `reports/security/templum-security-report.json`, and emit a summary to stdout; add an npm script `security:validate` in `package.json` that wraps the workflow.
- [ ] Update operator documentation: describe the security validation flow, evidence storage, and approval checklist in `docs/current/architecture-spec.md` (Sections 4 & 6) and add a compliance walkthrough in `docs/current/1.2-Backend-Integration-Guide.md` pointing stakeholders to the new reports directory.

### Blocked Actions (pending Audit hooks aligned with compliance requirements)

- [ ] Replace mocked audit ingest in `compliance-evidence-collector` with the real audit trail service, include retention proofs, and attach hash manifests for `.templum/audit/` once audit hooks emit production-ready events.

### Blocked Actions (pending Release pipeline hardening and packaging verification (artifact signing, CI gating, rollback paths).)

- [ ] Wire `security:validate` into the hardened release orchestrator (`scripts/release/run-release-verification.js`) so the pipeline archives `reports/security/templum-security-report.json` and rejects builds lacking fresh evidence signatures.

## Definition of Done

- Tests to run: `npm run security:validate`, `npm run test`, `npm run test:coverage`, `npm run phase6-validation`, `npm run lint`, `npm run check:types`.
- Validation/commands: regenerate `reports/security/evidence-bundle.json` and `reports/security/templum-security-report.json`, verify checksums, and ensure the threat model doc is approved by compliance/security stakeholders.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, `docs/current/1.2-Backend-Integration-Guide.md`, `docs/current/security/threat-model.md`.

## References

- Progress entry: `docs/current/progress.md:36`
- Architecture spec: `docs/current/architecture-spec.md:54`, `docs/current/architecture-spec.md:68`
- Validation harness: `src/tests/integration-validation-framework.ts:2969`
- Configuration & audit touchpoints: `src/core/templum-config-manager.ts:32`, `src/backend/backend-integration-config.ts:14`, `dev/tasks/audit-hooks.md`
