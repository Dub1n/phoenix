# Task: Artifact production for PCL traceability

## Requirement Summary
- Status: [ ]
- Requirement text: "Artifact production for PCL traceability (align with QMS design)."

## Prerequisites
- [ ] Machine-readable result exports (JSON/JUnit) standardised. — PCL traceability packages must wrap the canonical JSON feed instead of reserializing orchestrator state to avoid drift.

## Implementation Steps
### Unblocked Actions
- [ ] Capture PCL traceability artifact scope and metadata requirements in `scripts/validation/docs/current/architecture-spec.md` (Integration Points + Outstanding Work) using the Phoenix Code Lite QMS traceability model so developers align fields with the downstream system.
- [ ] Implement `scripts/validation/src/core/pcl-artifact-service.js` to transform validator run outputs (status, evidence, test metrics) into QMS-ready bundles containing structured JSON plus Markdown summaries, and expose an interface friendly to dependency injection.
- [ ] Wire the new artifact service into the post-execution path in `scripts/validation/src/core/enhanced-orchestrator.js` so successful runs emit traceability artifacts when `projectConfig.validation.pcl_traceability` (or similar) is enabled; ensure report generation stays DRY by reusing `ValidationReportService` helpers.
- [ ] Extend project configuration validation (`scripts/validation/src/core/enhanced-orchestrator.js`) and defaults (`scripts/validation/config/projects/templum-valconfig.json`) with PCL traceability settings (output directory, PCL requirement identifiers, retention policy) and update schema/validation errors accordingly.
- [ ] Add focused tests under `scripts/validation/tests/unit/pcl-artifact-service.test.js` covering artifact metadata, file writes, and error handling, plus an integration assertion in `scripts/validation/tests/integration/test-complete-workflow.js` that verifies artifacts are produced into an isolated temp directory when the feature flag is set.
- [ ] Document operator usage and artifact locations in `scripts/validation/docs/current/architecture-spec.md` (Operational Considerations + Verification & Validation) and record the output path patterns under `scripts/validation/dev/reports/` for traceability audits.

### Blocked Actions (pending Machine-readable result exports (JSON/JUnit) standardised.)
- [ ] Swap interim data assembly for the canonical JSON/JUnit payload once the export task lands, update the artifact service to consume the shared schema, and delete duplicate serialization logic introduced during bootstrap.

## Definition of Done
- Tests: `node scripts/validation/tests/unit/pcl-artifact-service.test.js`, `node scripts/validation/tests/integration/test-complete-workflow.js` with PCL traceability enabled.
- Validation/commands: `node scripts/validation/src/core/enhanced-orchestrator.js --category <cat> --project <proj> --task-id PCL-TRACE-DEMO` confirming artifacts land under the configured directory.
- Documentation: refresh `scripts/validation/docs/current/architecture-spec.md` sections noted above and update `scripts/validation/docs/current/progress.md` status/link upon completion.

## References
- Progress entry: `scripts/validation/docs/current/progress.md`
- Architecture spec: `scripts/validation/docs/current/architecture-spec.md`
- QMS traceability blueprint: `phoenix-code-lite/docs/current/progress.md`
