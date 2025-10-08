# Task: Document evidence bundle schema and SSI-QF crosswalk

Related requirement: `docs/current/progress.md` → QMS Domain Model → "Evidence bundle schema & crosswalk".

Tags: `#docs`

## Checklist

- [ ] Capture current bundle structure (files, sections, fields) in a schema note stored alongside the bundler implementation.
- [ ] Produce a crosswalk mapping each retired SSI-QF artefact/obligation to the new bundle outputs and supporting workflow evidence.
- [ ] Review schema and crosswalk with compliance stakeholders; incorporate feedback and record approval.
- [ ] Link the documentation from release bundler README/onboarding material.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `pcl: document evidence bundle schema` after tests.

## References

- Code: `src/bundler/`, `docs/03-PCL-QMS/`
- Tests: n/a (documentation task)
- Docs: `docs/05-QMS-Realignment/01-Aims-and-Objectives.md`, `docs/05-QMS-Realignment/02-Solution-Alignment.md`, `docs/05-QMS-Realignment/03-Traceability-Matrix.md`

## Notes

- Ensure the crosswalk references Development-Process-1 requirements (e.g., design reviews, release documentation) so auditors can trace compliance without the legacy SSI-QF forms.
- When bundle structure changes, update both schema and crosswalk; add versioning meta so teams can track revisions.
- Coordinate with Templum documentation so onboarding materials can link to the crosswalk.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
