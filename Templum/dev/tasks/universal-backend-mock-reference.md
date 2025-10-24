# Task: Canonical Backend Mock Reference

Related requirement: `docs/current/progress.md` → Quality & Runtime Stability → "Canonical backend mock reference".

Tags: `#infra`

## Checklist

- [x] Align on backend capability tiers (core vs optional) and update docs/specs accordingly (`dev/tasks/backend-capability-tiering.md`, `docs/current/1.2-Backend-Integration-Guide.md`, `docs/current/tests/universal-backend-mock-spec.md`). *(Capability taxonomy captured in both docs; implementation follow-up tracked in `backend-capability-tiering.md`.)*
- [x] Finalise canonical mock requirements with stakeholder review (discovery combinations, command routing scope, telemetry expectations). *(Requirements locked per `docs/current/tests/universal-backend-mock-spec.md`; further adjustments will track via follow-up tasks.)*
- [x] Identify test suites slated for migration and note blocking dependencies (Phase 6 harness, backend integration suites, e2e scaffolds). *(Migration buckets detailed in `docs/current/tests/universal-backend-mock-spec.md` Section 6; specialized holdouts flagged for follow-up.)*
- [x] Capture the current mock landscape (examples/minimal-backend, Phase 6 in-memory harness, Phase 6 simple CLI) with gaps noted against Haruspex/PCL expectations. *(Documented in `docs/current/tests/universal-backend-mock-spec.md` Section 8 with per-mock capabilities/gaps.)*
- [x] Draft the target mock architecture/specification (discovery modes, skin endpoint, command routing, optional health/telemetry) and confirm alignment with `optional-backend-mock-harness.md` plus `docs/current/tests/universal-backend-mock-spec.md`. *(Sections 1–5 outline architectural expectations; optional features/deferred work cross-referenced with relevant follow-up tasks.)*
- [ ] Produce the high-fidelity mock services and orchestration (derive from minimal backend where possible, add partner-specific flows).
- [ ] Switch Phase 6 harness/scripts/tests and other backend-dependent suites to the new mock stack while keeping real-backend opt-in paths stable.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: add canonical backend mock` after tests.

## References

- Code: `Templum/examples/minimal-backend/server.js`, `Templum/src/tests/integration-validation-framework.ts`, `Templum/src/scripts/run-phase6-integration-validation.ts`
- Tests: `npm run phase6-validation`, `npm run phase6-health`, `npx jest --config jest.backend.config.js`
- Docs: `Templum/docs/current/testing-guide.md`, `Templum/docs/current/architecture-spec.md`, `Templum/docs/current/tests/universal-backend-mock-spec.md`, `Templum/dev/tasks/phase6-validation-signal.md`

## Notes

- Extends the work tracked in `optional-backend-mock-harness.md`; this task focuses on parity with Haruspex/PCL behaviour (IPC flows, richer payloads, telemetry) while remaining usable across all backend-dependent suites.
- Coordinate with Haruspex/PCL integration tasks to keep contracts and progress trackers in sync once mocks emulate their flows.
- Ensure new mocks emit structured metrics compatible with the performance baseline loader so Phase 6 raw payload diffs remain meaningful; health/telemetry endpoints are part of the MVP deliverable for this mock.
- Migrate backend-focused Jest suites (integration, e2e, validation) that currently bootstrap bespoke services to this canonical mock to avoid divergence and duplicated behaviour, including IPC/WebSocket transport tests.
- Incorporate error-path coverage and the shared execution helper into the canonical mock so long-running command simulations stay aligned with capability flags; streaming output support is deferred to `dev/tasks/backend-streaming-support.md`.
- If this task changes prerequisites or dependency relationships, regenerate the project’s dependency map JSON (see `dev/tasks/*_task_dependencies.json`) and attach the updated file in the related progress planner.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
