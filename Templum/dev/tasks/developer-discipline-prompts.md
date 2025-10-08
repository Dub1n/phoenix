# Task: Implement Practical Developer Guide prompts and notifications

Related requirement: `docs/current/progress.md` → Interface Delivery → "Developer workflow prompts and notifications".

Tags: `#feature`

## Checklist

- [ ] Inventory deterministic follow-ups (branch naming checks, unit test executions, documentation updates) exposed by Phoenix Code Lite metadata and mark which ones can auto-complete without user interaction.
- [ ] Extend Templum session UI to show auto-complete notifications when deterministic checks succeed (no prompt if evidence already logged).
- [ ] Add targeted prompts for manual confirmations (e.g. documentation updates) and persist acknowledgements to Phoenix Code Lite.
- [ ] Update onboarding/help content to describe the new prompts and how automation reduces manual confirmations.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: add developer discipline prompts` after tests.

## References

- Code: `src/interfaces/*`, `src/session/`
- Tests: `tests/interfaces/`, `tests/session/`
- Docs: `docs/05-QMS-Realignment/01-Aims-and-Objectives.md`, `docs/05-QMS-Realignment/02-Solution-Alignment.md`

## Notes

- Coordinate with Phoenix Code Lite to consume the workflow metadata (branch naming state, TDD status, Definition of Done flags). Deterministic entries should auto-complete without extra prompts—surface a notification with evidence link instead of requiring manual confirmation.
- Ensure prompts are role-aware when necessary (e.g., documentation updates tied to specific roles) and that acknowledgements write back to the Phoenix Code Lite ledger with timestamp, user, and optional notes.
- Capture telemetry to prove >95% of deterministic checks complete automatically; track residual manual prompts so compliance can audit why they required human interaction.
- Confirm that CLI and VS Code adapters present consistent messaging and that session logs integrate with existing observability work.
- After implementation, update the crosswalk to show which Practical Developer Guide clauses are covered automatically versus manually.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
