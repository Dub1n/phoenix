# Task: Release package export with immutable audit history

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Release package export with immutable audit history."

## Prerequisites
- [~] Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage). - Exporter must consume the normalized traceability dataset this work finalizes.
- [ ] Audit logging hooks for compliance. - Immutable ledger relies on system-wide audit events emitted by this integration.

## Implementation Steps
### Unblocked Actions
- [ ] Drive the implementation with Jest in `phoenix-code-lite/tests/unit/release/package-exporter.test.ts`, covering manifest generation, ledger hashing, tamper detection, and CLI invocation paths before writing production code.
- [ ] Add release bundle contracts in `phoenix-code-lite/src/types/release-package.ts` using `zod` schemas for `ReleaseManifest`, `AuditLedgerEntry`, and verification helpers consumed by both exporter and tests.
- [ ] Implement append-only ledger utilities in `phoenix-code-lite/src/release/immutable-ledger.ts` that persist JSONL entries, chain `sha256` hashes (reusing `AuditCryptographyValidator` checks), and expose `verifyLedger()`.
- [ ] Build `ReleasePackageExporter` in `phoenix-code-lite/src/release/package-exporter.ts` to assemble traceability snapshots, validator outputs, and linked artefacts into a zip bundle under `.phoenix-code-lite/releases/<timestamp>/`, returning manifest metadata plus the immutable ledger digest.
- [ ] Expose a CLI command in `phoenix-code-lite/src/cli/args.ts` and handler `phoenix-code-lite/src/cli/commands/export-release-command.ts` that resolves dependencies (`DocumentManager`, validators, `AuditLogger`), audits the export event, and invokes the exporter.

### Blocked Actions (pending `[~] Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage).`)
- [ ] Wire `ReleasePackageExporter` to the finalized traceability APIs once they surface, ensuring the manifest links design inputs -> requirements -> risks -> validations without schema drift.

### Blocked Actions (pending `[ ] Audit logging hooks for compliance.`)
- [ ] Replace temporary ledger feeds with the unified audit stream delivered by compliance hooks, enforcing completeness checks before publishing a release bundle.

## Definition of Done
- Tests to run (`npm test`, `npm run test:e2e` for the export path).
- Validation/commands (`phoenix-code-lite export release --project-path <path> --label <release>` to produce a bundle and `ReleasePackageExporter.verify()` to confirm immutable audit history).
- Documentation to update (`phoenix-code-lite/docs/current/architecture-spec.md` Operational Considerations, `phoenix-code-lite/docs/current/progress.md`, changelog entry describing the release export capability).

## References
- Progress entry: `phoenix-code-lite/docs/current/progress.md:8`.
- Architecture spec: `phoenix-code-lite/docs/current/architecture-spec.md:28`, `phoenix-code-lite/docs/current/architecture-spec.md:48`.

## Current Status (2025-02-15)
- Implementation: no `src/release/` modules, immutable ledger utilities, or CLI wiring have been created, so the runtime cannot build or verify release bundles.
- Tests executed: none — exporter-specific suites referenced in the plan are absent, and current Jest runs omit any release packaging coverage.
- Coverage snapshot: not applicable; exporter code does not exist.
- Gaps blocking completion: awaiting the canonical traceability dataset, compliance audit stream, release output directory management, and end-to-end tests verifying manifest integrity.
