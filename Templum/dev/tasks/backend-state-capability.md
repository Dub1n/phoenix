# Task: Backend State Capability

Related requirement: `docs/target/post-mvp-progress.md` → Skin-Driven Rendering → "Backend state capability support".

Tags: `#feature`

## Checklist

- [ ] Implement optional backend `state` capability wiring (manifest + `backendConfig.capabilities` propagation).
- [ ] Provide a state snapshot contract (`GET /state` or `state` blocks in command responses) and document usage in `docs/current/1.2-Backend-Integration-Guide.md`.
- [ ] Update adapters and Phase 6 validation to consume state snapshots when the capability is present while retaining current behaviour otherwise.
- [ ] Add test coverage for state-capable backends (canonical mock, integration suites) and negative-path handling.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: add backend state capability` after tests.

## References

- Code: `Templum/src/core/templum-core.ts`, `Templum/src/interfaces/**`, `Templum/src/tests/integration-validation-framework.ts`
- Tests: `tests/backend/**`, `tests/integration/**`, `npm run phase6-validation`
- Docs: `Templum/docs/current/1.2-Backend-Integration-Guide.md`, `Templum/docs/current/tests/universal-backend-mock-spec.md`

## Notes

- Capability remains optional; absence should not affect simple command-routing backends.
- Coordinate with the canonical mock task so the shared backend example exposes a sample state snapshot once this landing occurs.
- Ensure state payloads integrate with the existing session/state manager without duplicating client-side aggregation.
- If this task changes prerequisites or dependency relationships, regenerate the project’s dependency map JSON (see `dev/tasks/*_task_dependencies.json`) and attach the updated file in the related progress planner.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
