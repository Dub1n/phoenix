# Task: Automated artifact generation (forms, reports) from data model

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Automated artifact generation (forms, reports) from data model."

## Prerequisites
- [~] Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage). — Artifact generator must consume the canonical matrix/types delivered by that work to avoid diverging data sources.

## Implementation Steps
### Unblocked Actions
- [ ] Drive development via Jest in `phoenix-code-lite/tests/qms/artifact-generation.test.ts`, covering `QMSArtifactGenerator.generateFromModel()` end-to-end: seed representative `RegulatoryRequirement`, compliance criteria, and performance target fixtures, assert the returned artifact metadata, Markdown sections (design inputs, traceability table, performance KPIs), and filesystem writes into an isolated temporary directory before touching production code.
- [ ] Introduce reusable contracts in `phoenix-code-lite/src/types/qms-artifacts.ts` for `QMSDataModel`, `GeneratedArtifact`, and enum-style discriminators (`'design-input-form' | 'traceability-report' | 'performance-summary'`), re-exporting the underlying structures from `RegulatoryDocumentProcessor`, `ComplianceCriteriaValidator`, and `QMSPerformanceTargetValidator` to keep the generator strongly typed.
- [ ] Implement `QMSArtifactGenerator` under `phoenix-code-lite/src/qms/artifacts/qms-artifact-generator.ts`, injecting the regulatory analyzers, compliance validator, performance target validator, and `DocumentManager`; provide focused helpers to render Markdown templates per artifact, deduplicate common heading/metadata code, and return both in-memory artifacts and on-disk paths when invoked.
- [ ] Add a thin publisher wrapper `phoenix-code-lite/src/qms/artifacts/artifact-publisher.ts` that coordinates write locations via `DocumentManager` (create `/qms/artifacts/` beneath `.phoenix-documents`), enforces safe overwrite rules, captures audit events through `AuditLogger`, and exposes `publishArtifacts()` for the CLI and tests to call.
- [ ] Surface a CLI command handler in `phoenix-code-lite/src/commands/qms-artifacts.ts` (e.g., `qms:artifacts`) that loads the data model, calls the generator/publisher, prints a summary table, and register it in `src/commands/command-registration.ts`; update the QMS menu in `src/cli/skin-menu-renderer.ts` and advanced CLI flow in `src/cli/commands.ts` so `phoenix-code-lite qms:artifacts --output <dir>` is discoverable and auditable.
- [ ] Document the new pipeline in `phoenix-code-lite/docs/current/index/CODEBASE-INDEX.md` and refresh `phoenix-code-lite/docs/current/architecture-spec.md` Operational Considerations to note automated QMS artifact generation.

### Blocked Actions (pending `[~] Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage).`)
- [ ] Swap the fixture-based model for the finalized `TraceabilityMatrixResult` and domain records published by `src/preparation/traceability-matrix.ts`, ensuring `QMSArtifactGenerator` consumes the normalized `DesignInputRecord`, `RequirementRecord`, and `RiskControlRecord` types once that requirement lands so every generated form reflects the authoritative dataset.

## Definition of Done
- Tests to run (`npm test -- tests/qms/artifact-generation.test.ts`, `npm test -- tests/preparation/traceability-matrix.test.ts` once integrated).
- Validation/commands (`phoenix-code-lite qms:artifacts --output .phoenix-documents/qms` to emit the forms and confirm audit logging).
- Documentation to update (`phoenix-code-lite/docs/current/architecture-spec.md`, `phoenix-code-lite/docs/current/index/CODEBASE-INDEX.md`, `phoenix-code-lite/docs/current/progress.md`, changelog entry covering the new automation).

## References
- Progress entry: `phoenix-code-lite/docs/current/progress.md:14`.
- Architecture spec: `phoenix-code-lite/docs/current/architecture-spec.md:11`, `phoenix-code-lite/docs/current/architecture-spec.md:29`, `phoenix-code-lite/docs/current/architecture-spec.md:43`.
- Traceability groundwork: `phoenix-code-lite/dev/tasks/design-traceability-model.md:1`.
- Data sources: `phoenix-code-lite/src/preparation/regulatory-document-processor.ts:1`, `phoenix-code-lite/src/preparation/compliance-criteria-validator.ts:1`, `phoenix-code-lite/src/preparation/qms-performance-target-validator.ts:1`, `phoenix-code-lite/src/config/document-manager.ts:1`.
