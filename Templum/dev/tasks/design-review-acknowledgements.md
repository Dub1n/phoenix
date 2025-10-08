# Task: Templum design review acknowledgement flow

Related requirement: `docs/current/progress.md` → Developer Workflow Alignment → "Design review acknowledgements".

Tags: `#feature`

## Checklist

- [ ] Consume Phoenix Code Lite review schema to present required reviewer roles and independence statements within Templum.
- [ ] Build acknowledgement UI for CLI and VS Code adapters capturing reviewer identity, independence confirmation, and timestamp.
- [ ] Persist acknowledgements back to Phoenix Code Lite via review API (idempotent on resubmission).
- [ ] Provide audit trail view in Templum so reviewers can confirm recorded entries before closing sessions.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: add design review acknowledgements` after tests.

## References

- Code: `src/interfaces/*`, `src/session/review-*`
- Tests: `tests/interfaces/reviews/`, `tests/session/reviews/`
- Docs: `docs/05-QMS-Realignment/01-Aims-and-Objectives.md`, `docs/05-QMS-Realignment/02-Solution-Alignment.md`

## Notes

- Ensure reviewers only see prompts relevant to their role and that independent reviewers are flagged appropriately.
- Support asynchronous review: acknowledgements should be resumable if a reviewer disconnects mid-session.
- Coordinate with Phoenix Code Lite to guarantee acknowledgement payloads meet ledger requirements and to surface any validation errors clearly.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
