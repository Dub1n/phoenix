# Task: Implement design review record store with role metadata

Related requirement: `docs/current/progress.md` → Workflow Automation → "Design review record store".

Tags: `#feature`

## Checklist

- [ ] Extend the Phoenix Code Lite data model to capture review sessions with reviewer name, role, independence flag, timestamp, and linked artefacts (requirements, releases).
- [ ] Provide CRUD endpoints/CLI commands for logging and querying review entries, including asynchronous updates from Templum.
- [ ] Persist records in an immutable ledger or append-only log suitable for evidence bundles.
- [ ] Add exports (JSON/Markdown) consumed by Templum and release evidence bundles.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `pcl: add design review record store` after tests.

## References

- Code: `src/domain/reviews/`, `src/api/`, `src/cli/`
- Tests: `tests/domain/reviews/`, `tests/api/reviews/`
- Docs: `docs/05-QMS-Realignment/01-Aims-and-Objectives.md`, `docs/05-QMS-Realignment/02-Solution-Alignment.md`

## Notes

- Align role names and independence criteria with compliance guidance (Project Lead, Software Manager, Independent Reviewer, etc.) while keeping the system flexible for future role expansion.
- Coordinate with Templum to ensure acknowledgement submissions map directly onto stored records; define idempotency behaviour for repeated updates.
- Review storage strategy so historical review entries remain immutable; consider separate append-only log with references to latest state for quick reads.
- Export format must be compatible with the evidence bundle aggregator and crosswalk documentation.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
