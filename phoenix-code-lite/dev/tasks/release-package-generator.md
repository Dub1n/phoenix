# Task: Release package generator (zip/pdf) verification

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Release package generator (zip/pdf) verified."

## Prerequisites
- [ ] Release package export with immutable audit history. — Verification depends on the exporter’s manifest/ledger outputs and bundle layout.
- [ ] Audit logging hooks for compliance. — Ledger cross-checks in the verification suite require the unified audit stream.

## Implementation Steps
### Unblocked Actions
- [ ] Author TDD coverage for the bundle flow: add `tests/integration/release/package-generator-cli.test.ts` that runs `phoenix-code-lite export release --project-path <fixture>` against a synthetic repo under `tests/fixtures/release-project/`, then asserts a `.phoenix-code-lite/releases/<timestamp>/` directory contains both `bundle.zip` and `bundle.pdf`, verifies the zip members (manifest JSON, ledger JSONL, evidence directory) via `yauzl` or `adm-zip`, and loads the PDF with `pdf-lib` to check metadata/pages.
- [ ] Create focused unit tests in `tests/unit/release/package-verifier.test.ts` exercising failure modes: tampered manifest signatures, missing evidence files, mismatched SHA256 chain. Use temporary archives produced during the test to avoid static fixtures.
- [ ] Extend `src/types/release-package.ts` with `ReleaseVerificationReport`, `BundleIssue`, and helper guards so verification logic can surface actionable diagnostics while reusing the exporter’s manifest schema.
- [ ] Implement `src/release/package-verifier.ts` providing `verifyReleaseBundle(bundlePath: string)` that: (1) extracts a zip stream to memory-safe temp space, (2) recalculates ledger hashes, (3) validates manifest ↔ evidence references, (4) confirms PDF generation by rendering the exported Markdown to PDF (reuse `pdf-lib` pipeline) and comparing digests, and (5) returns a typed verification report.
- [ ] Wire a CLI/API surface: add `src/commands/release-verify-command.ts` registered in `src/commands/command-registration.ts`, expose `phoenix-code-lite release verify --bundle <path> [--json]`, print pass/fail tables, and record outcomes via the audit logger; mirror the capability in the Fastify server (`src/api/external-ingest-server.ts` or new `src/api/release-package-server.ts`) to allow `POST /api/releases/verify` uploads.
- [ ] Update developer ergonomics: extend `src/cli/help-system.ts` to describe the new commands/flags, surface a “Release Verification” action in `src/cli/skin-menu-renderer.ts` under the QMS domain menu, and document configuration toggles in `docs/current/architecture-spec.md` Operational Considerations once verification is stable.

### Blocked Actions (pending `[ ] Audit logging hooks for compliance.`)
- [ ] After audit hooks land, assert the verification command writes immutable pass/fail entries by extending the unit tests to inspect the audit stream and by adding a regression in `tests/integration/release/package-generator-cli.test.ts` that fails if ledger/audit counts diverge.

## Definition of Done
- `npm run build`
- `npm test -- tests/unit/release/package-verifier.test.ts`
- `npm test -- tests/integration/release/package-generator-cli.test.ts`
- Manual smoke: `phoenix-code-lite export release --project-path <fixture>` followed by `phoenix-code-lite release verify --bundle <bundle.zip>` produces a passing report and regenerated PDF that matches the manifest digest.
- Documentation updated (progress tracker status, architecture spec release section, any runbooks referencing release verification).

## References
- Progress entry: `docs/current/progress.md:34`
- Architecture spec release notes: `docs/current/architecture-spec.md:29-46`
- Export task context: `dev/tasks/release-package-export.md:1`
- CLI command registry: `src/commands/command-registration.ts:1`
- Help/documentation surface: `src/cli/help-system.ts:1`

## Current Status (2025-02-15)
- Implementation: no release verifier modules, CLI commands, or tests exist; exporter itself is still pending, so verification tooling has not started.
- Tests executed: none — package generator/verifier suites are not present.
- Coverage snapshot: not applicable because release verification code is absent.
- Gaps blocking completion: waiting on exporter pipeline, audit hook integration, zip/PDF generation utilities, and CLI/API exposure.
