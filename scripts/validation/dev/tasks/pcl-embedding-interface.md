# Task: API/CLI interface for PCL embedding

## Requirement Summary
- Status: `[ ]`
- Requirement text: "- [ ] API/CLI interface for embedding in PCL workflows (roadmap item)."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Capture Phoenix Code Lite integration contract details (category mapping, promotion gating data needs) by cross-referencing `phoenix-code-lite/dev/tasks/validation-system-integration.md` and summarise the Validation System handshake under an "Integration Points" subsection in `docs/current/architecture-spec.md` so consumers have a canonical contract reference.
- [ ] Add failing unit tests in `tests/unit/integration/pcl-interface-adapter.test.js` that inject a mocked `EnhancedValidationOrchestrator` and assert `PclValidationAdapter.runValidation` returns a normalized payload (`status`, `durationMs`, `validatorSummaries`, `artifacts`, `warnings`) and translates orchestrator throws into a typed `IntegrationError`.
- [ ] Add an integration test in `tests/integration/pcl-interface-cli.test.js` that exercises the new CLI entry with a temp project config, expecting `--format json` output to stream a single JSON object on stdout and non-zero exit codes on failure.
- [ ] Implement `src/integration/pcl-validation-adapter.ts` exposing a `PclValidationAdapter` class that reuses `EnhancedValidationOrchestrator` via dependency injection, maps validation categories to PCL lifecycle scopes, and de-duplicates report generation by delegating to `ValidationReportService` for artifact paths.
- [ ] Wire a dedicated CLI entry (`src/core/pcl-integration-cli.js`) that parses `--project`, `--categories`, `--task-id`, and `--format` flags, instantiates `PclValidationAdapter`, and supports both single-run CLI usage and importable functions for API embedding without duplicating orchestrator setup.
- [ ] Document usage: add a runnable example under `docs/current/architecture-spec.md` Integration Points explaining CLI flags/API methods, and note in `docs/current/progress.md` that PCL consumers should reference `dev/tasks/pcl-embedding-interface.md` when upgrading.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- Tests to run: `node tests/unit/integration/pcl-interface-adapter.test.js`, `node tests/integration/pcl-interface-cli.test.js`, `node tests/validation-system-enhancement-test.js`.
- Validation/commands: `node src/core/pcl-integration-cli.js --project phoenix-code-lite --categories build,quality --task-id PCL-HANDSHAKE --format json` to verify JSON payloads and exit codes; `node src/core/enhanced-orchestrator.js --category quality --project phoenix-code-lite --task-id PCL-BACKSTOP --health-check` as a regression check.
- Documentation to update: `docs/current/architecture-spec.md` (Integration Points + Verification), `docs/current/progress.md` (status notes/link), cross-reference in `phoenix-code-lite/dev/tasks/validation-system-integration.md` if the handshake changes.

## References
- Progress entry: `docs/current/progress.md:19`
- Architecture spec sections: `docs/current/architecture-spec.md:26`, `docs/current/architecture-spec.md:42`, `docs/current/architecture-spec.md:52`
- Related task files: `dev/tasks/validator-result-exports.md:1`, `phoenix-code-lite/dev/tasks/validation-system-integration.md:1`
