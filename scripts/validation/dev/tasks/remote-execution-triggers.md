# Task: Remote execution triggers (CI/agent workflows) with idempotent reruns

- [ ] Remote execution triggers (CI/agent workflows) with idempotent reruns.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Remote execution triggers (CI/agent workflows) with idempotent reruns."

## Prerequisites
- [ ] API/CLI interface for embedding in PCL workflows (roadmap item). — Remote triggers depend on the shared adapter/CLI contract (`scripts/validation/dev/tasks/pcl-embedding-interface.md`).
- [?] Core execution loop deterministic across projects (requires recent smoke tests). — Idempotent reruns must lean on the stabilized execution order (`scripts/validation/dev/tasks/core-execution-determinism.md`).

## Implementation Steps
### Unblocked Actions
- [ ] Define the remote-trigger handshake (payload schema, idempotency key expectations, retry policy) and document it under an "Remote Execution" subsection in Integration Points within `scripts/validation/docs/current/architecture-spec.md:26`, including how run metadata is persisted and exposed for auditors.
- [ ] Implement a `RunLedgerService` in `scripts/validation/src/core/run-ledger-service.js` that persists run receipts (project, categories, taskId, checksum, status, artifacts path) to a durable JSON store under `scripts/validation/dev/runtime/remote-runs.json`, including read/append/cleanup helpers and collision handling.
- [ ] Integrate the ledger guard into the orchestrator by short-circuiting duplicate requests ahead of execution and stamping completion metadata after success/failure (touch `scripts/validation/src/core/enhanced-orchestrator.js:120` for the pre-run check and `scripts/validation/src/core/enhanced-orchestrator.js:194` + `scripts/validation/src/core/enhanced-orchestrator.js:210` for completion recording).
- [ ] Extend `ValidationReportService.resolveReportPath` to surface the ledger receipt identifier so reports cross-link to stored metadata (`scripts/validation/src/core/validation-report-service.js:44`).
- [ ] Add focused unit coverage for the ledger and orchestrator guard (new `scripts/validation/tests/unit/test-remote-trigger-ledger.js` referencing the helpers in `scripts/validation/tests/unit/test-framework.js:1` for structure) to assert duplicate submissions reuse the prior record and that stale receipts expire as configured.

### Blocked Actions (pending [ ] API/CLI interface for embedding in PCL workflows (roadmap item).)
- [ ] Expose a dedicated remote-trigger entry point (`scripts/validation/src/core/remote-trigger-cli.js`) that accepts JSON payloads or message file paths, reuses the shared adapter from the PCL interface task, and pipes requests through the ledger-aware orchestrator (`scripts/validation/src/core/enhanced-orchestrator.js:1398`).
- [ ] Create an integration harness (`scripts/validation/tests/integration/test-remote-trigger-cli.js`) that simulates CI/job-runner invocations twice with the same idempotency token and asserts identical outputs/artifacts, using fixtures under `scripts/validation/tests/integration/config/`.
- [ ] Provide a sample agent/CI workflow under `scripts/validation/docs/current/integration/remote-trigger-playbook.md` detailing environment variables, retry cadence, and expected exit codes for adoption.

### Blocked Actions (pending [?] Core execution loop deterministic across projects (requires recent smoke tests).)
- [ ] Once determinism smoke tests are passing, add a regression scenario to `scripts/validation/tests/integration/test-remote-trigger-cli.js` that runs back-to-back remote triggers across `templum`, `haruspex`, and `phoenix-code-lite` and validates the ledger snapshot contains identical command sequences for each rerun.

## Definition of Done
- Tests to run: `node scripts/validation/tests/unit/test-remote-trigger-ledger.js`, `node scripts/validation/tests/integration/test-remote-trigger-cli.js`, `node scripts/validation/tests/integration/test-enhanced-system.js`.
- Validation/commands: `node scripts/validation/src/core/remote-trigger-cli.js --payload fixtures/remote-trigger-sample.json --idempotency-key VS-CI-BACKEND` (repeat twice to confirm reuse), plus `node scripts/validation/src/core/enhanced-orchestrator.js --category backend --project templum --task-id vs-ci-smoke --health-check` as a regression guard.
- Documentation to update: `scripts/validation/docs/current/architecture-spec.md` Integration Points + Verification sections, `scripts/validation/docs/current/progress.md` entry for remote triggers, new remote-trigger playbook once published.

## References
- `scripts/validation/docs/current/progress.md:21`
- `scripts/validation/docs/current/architecture-spec.md:26`
- `scripts/validation/src/core/enhanced-orchestrator.js:120`
- `scripts/validation/src/core/enhanced-orchestrator.js:1398`
- `scripts/validation/src/core/validation-report-service.js:44`
- `scripts/validation/tests/unit/test-framework.js:1`
- `scripts/validation/tests/integration/test-enhanced-system.js:31`
