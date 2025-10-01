# Task: Baseline categories maintained; re-run to confirm outputs

## Requirement Summary
- Status: `[~]`
- Requirement text: "Baseline categories (backend/ui/core/build/quality) maintained; re-run to confirm outputs."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Ensure per-project validation configs cover all baseline categories: validate `scripts/validation/config/projects/templum-valconfig.json` and add `scripts/validation/config/projects/haruspex-valconfig.json` plus `scripts/validation/config/projects/phoenix-code-lite-valconfig.json` (copy from `scripts/validation/config/project-template.json`) with correct `project.project_directory` (`../../Templum`, `../../Haruspex`, `../../phoenix-code-lite`) and populated `validation.commands` pulled from each project's `package.json` (`build`, `test`, `lint`, `typecheck`, `start`).
- [ ] Confirm baseline report directories exist and are writable before executing validators: `Templum/dev/validation-results`, `Haruspex/dev/validation-results`, `phoenix-code-lite/dev/validation-results` (create the Phoenix folder to match `validation.report_location`).
- [ ] Re-run baseline validators for Templum using `scripts/validation/src/core/enhanced-orchestrator.js`; capture PASS/WARN output and resulting markdown artifacts under `Templum/dev/validation-results`.
  ```bash
  node scripts/validation/src/core/enhanced-orchestrator.js --category backend --project templum --task-id templum-baseline-backend
  node scripts/validation/src/core/enhanced-orchestrator.js --category ui --project templum --task-id templum-baseline-ui
  node scripts/validation/src/core/enhanced-orchestrator.js --category core --project templum --task-id templum-baseline-core
  node scripts/validation/src/core/enhanced-orchestrator.js --category build --project templum --task-id templum-baseline-build
  node scripts/validation/src/core/enhanced-orchestrator.js --category quality --project templum --task-id templum-baseline-quality
  ```
- [ ] Re-run baseline validators for Haruspex with matching commands and ensure reports land in `Haruspex/dev/validation-results`; investigate and document any WARN/FAIL output from backend/ui/core/build/quality runs.
  ```bash
  node scripts/validation/src/core/enhanced-orchestrator.js --category backend --project haruspex --task-id haruspex-baseline-backend
  node scripts/validation/src/core/enhanced-orchestrator.js --category ui --project haruspex --task-id haruspex-baseline-ui
  node scripts/validation/src/core/enhanced-orchestrator.js --category core --project haruspex --task-id haruspex-baseline-core
  node scripts/validation/src/core/enhanced-orchestrator.js --category build --project haruspex --task-id haruspex-baseline-build
  node scripts/validation/src/core/enhanced-orchestrator.js --category quality --project haruspex --task-id haruspex-baseline-quality
  ```
- [ ] Re-run baseline validators for Phoenix Code Lite after creating its project config; verify generated reports under `phoenix-code-lite/dev/validation-results` and note any remedial actions needed to reach PASS for backend/ui/core/build/quality.
  ```bash
  node scripts/validation/src/core/enhanced-orchestrator.js --category backend --project phoenix-code-lite --task-id pcl-baseline-backend
  node scripts/validation/src/core/enhanced-orchestrator.js --category ui --project phoenix-code-lite --task-id pcl-baseline-ui
  node scripts/validation/src/core/enhanced-orchestrator.js --category core --project phoenix-code-lite --task-id pcl-baseline-core
  node scripts/validation/src/core/enhanced-orchestrator.js --category build --project phoenix-code-lite --task-id pcl-baseline-build
  node scripts/validation/src/core/enhanced-orchestrator.js --category quality --project phoenix-code-lite --task-id pcl-baseline-quality
  ```
- [ ] Update `scripts/validation/config/capability-matrix.json` for backend/ui/core/build/quality with fresh `safety.lastValidated` timestamps, observed `complianceStatus`, and any new `requiredDependencies` discovered during runs.
- [ ] Archive a short validation summary (category outcomes, follow-up fixes) in `scripts/validation/dev/reports/` or append an entry to the relevant project tracker so baseline evidence is easy to audit.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- Baseline runs for backend/ui/core/build/quality complete across Templum, Haruspex, and Phoenix Code Lite with PASS (or documented WARN) statuses and corresponding reports in each project’s `dev/validation-results`.
- `scripts/validation/config/capability-matrix.json` reflects the new validation timestamps and notes for all five categories.
- Phoenix Code Lite gains a writable `dev/validation-results` directory and project config so orchestrator runs succeed without manual overrides.
- Validation logs or summaries stored under `scripts/validation/dev/reports/` (or per-project trackers) reference the task ID and highlight remediation items.
- `scripts/validation/docs/current/progress.md` entry links to this task and notes updated outcomes.

## References
- Progress entry: `scripts/validation/docs/current/progress.md:13`
- Architecture callout: `scripts/validation/docs/current/architecture-spec.md:17`
- Orchestrator CLI usage: `scripts/validation/src/core/enhanced-orchestrator.js:1400`
- Report generation expectations: `scripts/validation/src/core/validation-report-service.js:1`
