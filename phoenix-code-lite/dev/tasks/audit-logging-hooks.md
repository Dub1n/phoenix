# Task: Audit logging hooks for compliance

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Audit logging hooks for compliance."

## Prerequisites
- [~] Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage). - Compliance hooks must enrich events with finalized traceability identifiers once the domain model stabilizes.
- [ ] Validation System integration blocking promotions on failed checks. - Hooks need the validator lifecycle to emit gate results and attach failure evidence.

## Implementation Steps
### Unblocked Actions
- [ ] Start with Jest coverage in `phoenix-code-lite/tests/integration/audit/compliance-hooks.test.ts` (and targeted unit specs under `phoenix-code-lite/tests/unit/audit/`) that spin up `CoreFoundation`/CLI flows with a `MockAuditLogger`, asserting emission of structured compliance events for config changes, session transitions, TDD workflow phases, and manual CLI commands.
- [ ] Define canonical compliance event schemas in `phoenix-code-lite/src/compliance/audit-events.ts` (using `zod`) covering traceability updates, validator outcomes, release actions, and user overrides; expose helpers to normalize metadata (regulation, artifact ids, actor, hash).
- [ ] Implement `ComplianceAuditHooks` in `phoenix-code-lite/src/compliance/audit-hooks.ts` to register listeners on `CoreFoundation`, `SessionManager`, `TDDOrchestrator`, CLI command factory, and `AuditLogger`, ensuring hooks enrich and forward events via `AuditLogger.logEvent` into a dedicated `.phoenix-code-lite/audit/compliance` channel.
- [ ] Thread the hook dispatcher through runtime wiring: update `phoenix-code-lite/src/core/foundation.ts`, `src/core/session-manager.ts`, `src/tdd/orchestrator.ts`, `src/cli/commands/*.ts`, and `src/cli/adapters/audit-logger-adapter.ts` so each compliance-sensitive action emits the correct event type and metrics (including deterministic hashes leveraging `AuditCryptographyValidator`).
- [ ] Extend configuration surfaces (`phoenix-code-lite/src/config/settings.ts`, CLI `config` command help, and generated docs) to expose compliance audit destinations/retention defaults, and document operational controls in `docs/current/architecture-spec.md` once behaviour is validated.

### Blocked Actions (pending `[~] Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage).`)
- [ ] Map compliance events to the finalized traceability graph (design input -> requirement -> risk -> verification) so hooks attach authoritative identifiers and lineage snapshots.

### Blocked Actions (pending `[ ] Validation System integration blocking promotions on failed checks.`)
- [ ] Instrument validator orchestration to emit `validation_gate_passed`/`validation_gate_failed` hooks with attached evidence payloads and gating outcomes once the Validation System integration is live.

## Definition of Done
- Tests to run (`npm test`, focused suites like `npm run test:e2e`, and the new compliance hook specs).
- Validation/commands (`phoenix-code-lite audits tail --limit 5` or equivalent CLI inspection to confirm compliance events; dry-run `phoenix-code-lite generate ...` should produce linked audit entries).
- Documentation to update (`phoenix-code-lite/docs/current/progress.md`, `phoenix-code-lite/docs/current/architecture-spec.md` Operational Considerations and Outstanding Work, plus a changelog entry summarizing compliance audit coverage).

## References
- Progress entry: `phoenix-code-lite/docs/current/progress.md:28`.
- Architecture spec: `phoenix-code-lite/docs/current/architecture-spec.md:49`, `phoenix-code-lite/docs/current/architecture-spec.md:55`.
- Related task: `phoenix-code-lite/dev/tasks/release-package-export.md:9`.

## Current Status (2025-02-15)
- Implementation: base `AuditLogger` utility exists but no compliance hooks, event schemas, or listener wiring; audit output is generic workflow logging without QMS metadata.
- Tests executed: none — compliance hook suites and adapters are not present.
- Coverage snapshot: audit modules show 0% statements/branches in coverage because no targeted tests run.
- Gaps blocking completion: need compliance event schemas, hook dispatcher across core modules, validator handshake, and documentation of retention/controls.
