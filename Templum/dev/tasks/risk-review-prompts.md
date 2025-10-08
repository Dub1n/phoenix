# Task: Sprint risk review prompts in Templum

Related requirement: `docs/current/progress.md` → Developer Workflow Alignment → "Sprint review risk prompts".

Tags: `#feature`

## Checklist

- [ ] Consume Phoenix Code Lite risk ledger API to fetch outstanding risks ahead of sprint review workflows.
- [ ] Present CLI/VS Code prompts summarising each risk, capturing reviewer notes and acknowledgement.
- [ ] Sync updates back to Phoenix Code Lite with provenance (user, timestamp, decisions).
- [ ] Ensure prompts skip automatically when Phoenix Code Lite indicates the sprint review updates already occurred.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: add sprint risk prompts` after tests.

## References

- Code: `src/interfaces/*`, `src/session/review-*`
- Tests: `tests/interfaces/reviews/`, `tests/session/risk-review/`
- Docs: `docs/05-QMS-Realignment/01-Aims-and-Objectives.md`, `docs/05-QMS-Realignment/02-Solution-Alignment.md`

## Notes

- Provide quick navigation from prompts to additional risk detail if Phoenix Code Lite exposes deeper context.
- Coordinate with Validation System to display most recent mitigation result identifiers where available.
- Ensure offline handling: prompts should cache necessary risk data for the session but fail safely if ledger becomes unreachable (with re-sync on reconnect).

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
