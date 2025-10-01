# Task: Design inputs/requirements/risk traceability coverage

## Requirement Summary
- Status: `[~]`
- Requirement text: "Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage)."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Introduce shared traceability domain types (`DesignInputRecord`, `RequirementRecord`, `RiskControlRecord`, matrix summary interfaces) under `src/types/qms-traceability.ts`, populate a canonical design input catalog in `src/preparation/design-input-catalog.ts`, and refactor the existing extractors (`src/preparation/regulatory-document-processor.ts`, `src/preparation/en62304-requirement-analyzer.ts`, `src/preparation/aami-tir45-requirement-analyzer.ts`) to emit these unified structures with stable IDs and source metadata.
- [ ] Build `src/preparation/traceability-matrix.ts` that loads design inputs, EN 62304 requirements, AAMI TIR45 practices, and risk findings (e.g., from `src/preparation/architecture-integration-validator.ts` and `src/preparation/compliance-criteria-validator.ts`), producing bidirectional links (design input → requirements → risks) plus coverage metrics and dangling-item detection.
- [ ] Add a `qms:generate-traceability` CLI command (new handler file under `src/commands/qms-traceability.ts` wired into `src/commands/command-registration.ts` and exposed via `src/cli/skin-menu-renderer.ts`) that calls the matrix builder, writes the JSON artifact to `dist/qms/traceability-matrix.json`, and renders a concise summary table in the console.
- [ ] Expand automated coverage: create `tests/preparation/traceability-matrix.test.ts` asserting matrix completeness (all design inputs map to at least one requirement, every requirement traces to a risk control or documented exception) and update `tests/preparation/environment-setup.test.ts` expectations if new services or fixtures are required.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- `npm run build`
- `npm test -- tests/preparation/traceability-matrix.test.ts`
- `npm test -- tests/preparation/environment-setup.test.ts`
- Update architecture/QMS documentation to reference the generated matrix location once validated.
- Confirm `docs/current/progress.md` status updated to reflect completion.

## References
- Progress entry: `docs/current/progress.md:7`
- Architecture spec traceability note: `docs/current/architecture-spec.md:41`
- Architecture diagram snapshot: `docs/current/index/ARCHITECTURE-DIAGRAM.md:25`
- Existing requirement extractors: `src/preparation/regulatory-document-processor.ts:1`, `src/preparation/en62304-requirement-analyzer.ts:1`, `src/preparation/aami-tir45-requirement-analyzer.ts:1`
- Preparation validation suite: `tests/preparation/environment-setup.test.ts:1`
