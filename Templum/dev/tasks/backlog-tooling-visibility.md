# Task: Surface backlog tooling decision inside Templum onboarding

Related requirement: `docs/current/progress.md` → Interface Delivery → "Backlog tooling visibility".

Tags: `#docs`

## Checklist

- [ ] Sync with Phoenix Code Lite to obtain the final backlog tooling decision note (YouTrack or justified alternative).
- [ ] Update Templum CLI/VS Code onboarding flows to reference the chosen tooling and provide links or commands for QMS tasks.
- [ ] Add contextual help text or command (`templum help qms-tooling`) summarising the decision and integration expectations.
- [ ] Capture changelog entry and internal announcement so teams know where to access QMS workflows.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: document backlog tooling decision` after tests.

## References

- Code: `src/interfaces/cli/onboarding/*`, `src/interfaces/vscode/*`
- Tests: `tests/interfaces/cli`, `tests/interfaces/vscode`
- Docs: `docs/05-QMS-Realignment/01-Aims-and-Objectives.md`, `docs/05-QMS-Realignment/02-Solution-Alignment.md`, `docs/05-QMS-Realignment/03-Traceability-Matrix.md`

## Notes

- If YouTrack is adopted, include notes on available knowledge base and GitHub integration as highlighted in Development-Process-1 Software Comparison. If an alternative is chosen, summarise the mitigation plan supplied by Phoenix Code Lite.
- Keep messaging concise and consistent across CLI and VS Code surfaces; the goal is awareness, not duplicating Phoenix Code Lite documentation.
- Ensure updates do not introduce additional prompts for users once they have acknowledged the tooling decision.
- Coordinate with observability to log how often the onboarding snippet/help command is accessed (optional but useful for effectiveness tracking).

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
