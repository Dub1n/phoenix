# Task: Regulatory metadata catalog (standards clauses, owners, timestamps) live in system.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "- [ ] Regulatory metadata catalog (standards clauses, owners, timestamps) live in system. *(see `dev/tasks/regulatory-metadata-catalog.md`)*"

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Add failing catalog tests under `tests/qms/regulatory-metadata-catalog.test.ts` that assert the catalog returns real EN 62304 and AAMI TIR45 clauses with `clauseId`, `standard`, `ownerRole`, `lastReviewedAt`, `sourceDocument`, and `traceabilityLinks` populated.
- [ ] Define QMS regulatory metadata types (`RegulatoryMetadataEntry`, `RegulatoryMetadataCatalog`) in `src/qms/regulatory/regulatory-metadata-catalog.ts` with persistence hooks (file-backed JSON or database adapter) and dependency injection wiring so other modules consume the catalog via abstractions.
- [ ] Populate canonical clause data in `src/qms/regulatory/data/` by normalizing the existing parsers in `src/preparation/regulatory-document-processor.ts` to emit structured metadata and attaching verified owner assignments from compliance leadership (no placeholder text).
- [ ] Implement catalog services that hydrate on startup, expose query methods (`findByClause`, `listByStandard`, `listByOwner`), and emit audit events to `src/utils/audit-logger.ts` when entries change.
- [ ] Add a CLI/automation surface (e.g., `qms:regulatory-catalog` in `src/commands/core-commands.ts` or dedicated handler) that surfaces catalog status and review timestamps, plus update `docs/current/architecture-spec.md` to describe storage, ownership workflow, and update cadence.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- Tests to run: `npm test -- tests/qms/regulatory-metadata-catalog.test.ts`, `npm test -- --runTestsByPath src/preparation/**/*.test.ts` (or equivalent updated suites).
- Validation/commands: `npm run build`, targeted CLI check `node dist/unified-cli.js qms:regulatory-catalog --describe` (or workspace equivalent).
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, compliance workflow notes under `docs/target/` if they track ownership metadata.

## References
- Progress entry: `docs/current/progress.md:9`
- Architecture spec: `docs/current/architecture-spec.md:28`, `docs/current/architecture-spec.md:55`
- Supporting code: `src/preparation/regulatory-document-processor.ts`, `src/utils/audit-logger.ts`
