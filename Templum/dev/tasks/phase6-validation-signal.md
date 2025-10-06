# Task: Phase 6 Integration Validation Signal Overhaul

Related requirement: `docs/current/progress.md` → Quality & Release Readiness → "Phase 6 validation signal overhaul".

Tags: `#infra`

## Checklist

- [x] Strip synthetic scoring from `Templum/src/tests/integration-validation-framework.ts` so Phase 6 emits deterministic pass/fail outcomes (no random delays or default 100% readiness when mocks are active).
- [x] Simplify the generated report/CLI output to surface binary health status plus explicit skips instead of numeric readiness scores, and update consumers accordingly.
- [x] Document the current Phase 6 scoring inputs and surface the mocked/missing metrics in `Templum/docs/current/architecture-spec.md` (Testing & Validation) so downstream teams know the limitations.
- [x] Replace synthetic workflow/performance values in `Templum/src/tests/integration-validation-framework.ts` with instrumentation that records real timings, memory/CPU, and error rates from both mock and real backends.
- [ ] Seed baseline data from an approved Phase 5/Stage 6 run (store in a committed JSON artefact) and teach the performance monitor to compare against those captured baselines instead of hard-coded thresholds/random delays.
- [ ] Extend `Templum/src/scripts/run-phase6-integration-validation.ts` and `simple-phase6-validation.ts` to persist raw metrics alongside summary reports so future baselines can be regenerated without code edits.
- [ ] Update reporting templates (`validation-reports/phase6-*.md/html/json`) to call out which inputs are real versus estimated until all metrics are live, and ensure the readiness score only reports on instrumented signals.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: harden phase6 validation signal` after tests.

## References

- Code: `Templum/src/tests/integration-validation-framework.ts`, `Templum/src/scripts/run-phase6-integration-validation.ts`, `Templum/src/scripts/simple-phase6-validation.ts`
- Tests: `npm run phase6-validation`, `npm run phase6-health`, `npm run phase6-validation:full`
- Docs: `Templum/docs/current/progress.md`, `Templum/docs/current/architecture-spec.md`

## Notes

- Mock runs now record real workflow timings, memory deltas, and interface consistency via the consolidated harness; live backend baselines are still pending before the score becomes a release gate.
- Capture at least one golden run (mocks + real backends) and store raw metrics in `validation-reports/phase6-baselines/` so the regression monitor can diff against lived data.
- Consider wiring results into existing observability tooling (e.g., structured logs or metrics exporters) so Phase 6 data is queryable outside the CLI.
- When instrumentation lands, update CI to fail builds when the performance delta exceeds agreed thresholds—coordinate with pipeline owners before flipping the enforcement switch.
- If this task changes prerequisites or dependency relationships, regenerate the project’s dependency map JSON (see `dev/tasks/*_task_dependencies.json`) and attach the updated file in the related progress planner.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
