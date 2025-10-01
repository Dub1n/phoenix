# Task: Offline/online sync strategy implemented.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "- [ ] Offline/online sync strategy implemented."

## Prerequisites
- [ ] Startup configuration validation (validators/templates/storage paths). — Sync services must piggyback on validated storage locations, credentials, and feature flags established during startup checks.
- [ ] API/CLI endpoints for ingesting external repo data. — Online reconciliation depends on standardized ingest/export endpoints to pull regulator-reviewed artefacts into Phoenix.
- [ ] Audit logging hooks for compliance. — Every sync cycle and conflict resolution needs the compliance audit stream to remain regulator-ready.

## Implementation Steps
### Unblocked Actions
- [ ] Add failing Jest coverage in `phoenix-code-lite/tests/qms/offline-sync-strategy.test.ts` that simulates: (a) offline queueing of lifecycle events, (b) replay when connectivity resumes, (c) conflict detection with newer remote revisions, and (d) verification that persisted digests match local files.
- [ ] Define canonical sync contracts in `phoenix-code-lite/src/qms/sync/sync-contracts.ts` using `zod` for `SyncEnvelope`, `SyncOperation`, `SyncConflict`, and ledger metadata; export helpers for hashing payloads with `AuditCryptographyValidator` so tests can reuse deterministic digests.
- [ ] Implement a file-backed `OfflineSyncStore` in `phoenix-code-lite/src/qms/sync/offline-store.ts` that persists queued operations under `.phoenix-code-lite/sync/queue.jsonl`, tracks last-sync checkpoints, encrypts sensitive payloads via `SecurityGuardrailsManager`, and exposes transactional APIs (`enqueue`, `peekBatch`, `acknowledge`, `rollback`).
- [ ] Build a resumable `SyncCoordinator` in `phoenix-code-lite/src/qms/sync/sync-coordinator.ts` that consumes the store, exposes `goOffline`, `goOnline`, and `reconcile()` methods, emits state changes through `SessionManager`, and provides extension points for transport adapters (HTTP, file drop, MCP) without yet calling external endpoints.
- [ ] Surface operator controls by registering a `qms:sync` command in `phoenix-code-lite/src/commands/core-commands.ts` with handlers in `phoenix-code-lite/src/commands/qms-sync.ts`; wire CLI options in `src/cli/args.ts` (e.g., `PhoenixCodeLiteOptions` gains `syncMode`, `syncTarget`) so engineers can check status, force flushes, and inspect queued operations from the unified CLI.
- [ ] Document the offline cache directory, reconciliation flow, and failure handling expectations in `docs/current/architecture-spec.md` (Operational Guarantees) and add a troubleshooting subsection in `docs/current/index/CODEBASE-INDEX.md` describing how the sync coordinator interacts with DocumentManager assets.

### Blocked Actions (pending `[ ] Startup configuration validation (validators/templates/storage paths).`)
- [ ] Extend the startup validator suite to register the sync feature flag, required directories, and credential providers, failing fast when `.phoenix-code-lite/sync/` is missing or misconfigured.

### Blocked Actions (pending `[ ] API/CLI endpoints for ingesting external repo data.`)
- [ ] Replace the placeholder transport adapter with real connectors that call the ingestion endpoints, add integration coverage in `tests/integration/qms-sync-ingest.test.ts`, and ensure bidirectional diff/merge logic respects the external API contracts.

### Blocked Actions (pending `[ ] Audit logging hooks for compliance.`)
- [ ] Wire `SyncCoordinator` events into the unified audit logger once the compliance hooks exist, guaranteeing every offline replay and conflict decision produces immutable audit events and aligns with the regulator-facing ledger.

## Definition of Done
- Tests to run: `npm test -- tests/qms/offline-sync-strategy.test.ts`, `npm test -- tests/integration/qms-sync-ingest.test.ts`, `npm run build`.
- Validation/commands: `node dist/unified-cli.js qms:sync status`, `node dist/unified-cli.js qms:sync reconcile --target staging` to exercise offline→online flow without errors.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, `docs/current/index/CODEBASE-INDEX.md`, changelog note summarizing the sync capability.

## References
- Progress entry: `docs/current/progress.md:33`
- Architecture spec: `docs/current/architecture-spec.md:31`, `docs/current/architecture-spec.md:48`
- Supporting modules: `src/config/document-manager.ts:1`, `src/utils/file-system.ts:1`, `src/core/session-manager.ts:1`, `src/preparation/audit-cryptography-validator.ts:1`
