# Task: Machine-readable result exports (JSON/JUnit) standardised.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Machine-readable result exports (JSON/JUnit) standardised."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Capture current result payload shape from `src/core/enhanced-orchestrator.js` and `src/core/validation-report-service.js` to document the canonical JSON contract (fields for run metadata, per-test outcomes, evidence).
- [ ] Add failing tests that assert JSON and JUnit artefacts are emitted when `ValidationReportService.generateValidationReport` runs (e.g., `tests/unit/reporting/validation-report-service.test.js` using temp directories and snapshots).
- [ ] Refactor `src/core/validation-report-service.js` to extract format-specific writers and emit Markdown, JSON, and JUnit outputs side-by-side under the configured `report_location`.
- [ ] Persist a reusable JUnit serializer (e.g., `src/core/reporters/junit-writer.js`) with schema validation to guard against invalid XML.
- [ ] Update orchestrator and configs (`src/core/enhanced-orchestrator.js`, `config/enhanced-config.json`) to expose toggles/paths for machine-readable exports and ensure legacy consumers continue receiving Markdown.
- [ ] Document the standardised export format and file naming convention in `docs/current/architecture-spec.md` (data flow + verification sections) and note discovery instructions in `docs/current/progress.md` "Validator Modules" context.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- Tests to run: `node tests/unit/reporting/validation-report-service.test.js`, `node tests/validation-system-enhancement-test.js`.
- Validation/commands: `node src/core/enhanced-orchestrator.js --project <project> --category quality --dry-run` to confirm JSON/JUnit artefacts land in `dev/validation-results/`.
- Documentation to update: `docs/current/architecture-spec.md`, `docs/current/progress.md` (status notes), changelog or release notes if maintained.

## References
- Progress entry: `docs/current/progress.md:15`
- Architecture spec sections: `docs/current/architecture-spec.md` §§2-3,5-6
- Related task files: `dev/tasks/policy-engine.md`
