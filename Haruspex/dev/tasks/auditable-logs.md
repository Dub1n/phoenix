# Task: Deliver auditable logs for analyses and approvals

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Auditable logs for analyses and approvals."

## Prerequisites
- None.

## Implementation Steps
### Unblocked Actions
- [ ] Drive TDD with `src/__tests__/auditing/audit-log-manager.test.ts` to cover append-only persistence, tamper-evident hashes, retention windows, and redaction of sensitive payload fragments.
- [ ] Introduce `AuditLogManager` and supportive types in `src/monitoring/audit/audit-log-manager.ts` (consider splitting serialization helpers) to persist JSONL entries with chained hashes, rotating files based on size/time, and exposing query APIs for diagnostics.
- [ ] Extend configuration via `src/config/audit-log-config.ts` (and wire into existing config loaders) so retention, storage path, and redaction policies are environment-driven.
- [ ] Instrument `src/haruspex-backend-service.ts` to emit structured audit events for analysis submissions, completions, cancellations, and approval decisions; replace ad-hoc `console.log` diagnostics for those flows.
- [ ] Update `src/api/gateway/api-gateway.ts` to dispatch audit events for HTTP/WebSocket requests (including user identity/context metadata) without blocking the response path.
- [ ] Add fixture-backed integration coverage (e.g., `src/__tests__/auditing/backend-audit-flow.test.ts`) that submits analyses/approvals through public APIs and asserts persisted audit entries plus replay verification.

### Blocked Actions (pending [ ] Access controls for write operations.)
- [ ] Expose `GET /audit/logs` (with pagination/filtering) and `POST /audit/verify` endpoints in `src/api/gateway/api-gateway.ts` once service-level access control enforcement is in place.
- [ ] Document operational access procedures and retention guarantees in `docs/current/architecture-spec.md` + operations runbooks once access control design lands.

## Definition of Done
- Tests to run: `npm test -- src/__tests__/auditing/audit-log-manager.test.ts`, `npm test -- src/__tests__/auditing/backend-audit-flow.test.ts`, and full backend suites (`npm test -- src/__tests__/backend-service.test.ts`).
- Validation/commands: `npm run build && node dist/src/backend-main.js` followed by scripted analysis/approval requests to confirm audit entries and verification tooling; execute Validation System audits for Haruspex backend once updated.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md` (Operational Considerations + Observability), and `dev/04-Separation-Roadmap/` compliance checkpoints if applicable.

## References
- Progress entry: `docs/current/progress.md:31`
- Architecture spec: `docs/current/architecture-spec.md:46`
- Related observability notes: `dev/04-Separation-Roadmap/03-Phases/05-Skin-System-Enhancement.md`
