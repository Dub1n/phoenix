# Task: Build live risk register ledger linked to requirements and validators

Related requirement: `docs/current/progress.md` → QMS Domain Model → "Risk register ledger".

Tags: `#feature`

## Checklist

- [ ] Define risk entry schema (ID, description, owner, severity, mitigation, linked requirements, linked validator runs, status timestamps).
- [ ] Implement storage layer and APIs/CLI commands for creating, updating, and querying risk entries.
- [ ] Ensure sprint review updates are captured with provenance (who updated, when, notes) and exposed to Templum.
- [ ] Integrate with validation results so mitigations show current pass/fail status via deterministic identifiers.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `pcl: add risk register ledger` after tests.

## References

- Code: `src/domain/risk/`, `src/api/`, `src/cli/`
- Tests: `tests/domain/risk/`, `tests/api/risk/`
- Docs: `docs/05-QMS-Realignment/01-Aims-and-Objectives.md`, `docs/05-QMS-Realignment/02-Solution-Alignment.md`, `docs/05-QMS-Realignment/03-Traceability-Matrix.md`

## Notes

- Schema must support linkage to IEC 62304 Section 7 obligations; capture traceability to requirements and corresponding validator outputs.
- Provide efficient queries for sprint review context (e.g., outstanding high-risk items) and release bundler integration.
- Coordinate with Validation System team to embed risk-control identifiers in result exports.
- Consider audit trail requirements: maintain append-only log or versioning for risk entries to show historical decisions.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
