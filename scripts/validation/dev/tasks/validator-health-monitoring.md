# Task: Validator Health and Performance Monitoring

## Requirement Summary
- Status: `[ ]`
- Requirement text: "[ ] Validator health/performance monitoring."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Add failing unit coverage in `scripts/validation/tests/unit/validator-health-monitoring.test.js` that instantiates the monitoring layer with synthetic validator runs, asserts metric aggregation (counts, rolling averages, percentile buckets), and verifies status transitions when a validator reports degraded diagnostics.
- [ ] Extend integration coverage via `scripts/validation/tests/integration/validator-health-monitoring.test.js` to run `EnhancedValidationOrchestrator` with metrics toggled on, ensuring `--health-check` outputs include validator status, recent durations, and emit structured data for downstream dashboards.
- [ ] Introduce `scripts/validation/src/observability/monitoring-service.js` exposing APIs such as `recordRun`, `summarizeHealth`, and `serializeMetrics`, wired for dependency injection and Ajv-validated payloads to guard against malformed inputs.
- [ ] Refactor `scripts/validation/src/core/enhanced-orchestrator.js` to enable metrics via `enhanced-config.json` flags, delegate to `MonitoringService`, re-activate `updateMetrics`/`checkValidatorsHealth`/`updateValidatorMetrics`, and surface health summaries through the existing `--health-check` command.
- [ ] Enrich observability settings in `scripts/validation/config/enhanced-config.json` (e.g., thresholds, sample windows, output paths) and document operator guidance in `scripts/validation/docs/current/architecture-spec.md` and `scripts/validation/docs/current/guides/CORE-VALIDATION-README.md`.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- Tests to run: `node scripts/validation/tests/unit/validator-health-monitoring.test.js`; `node scripts/validation/tests/integration/validator-health-monitoring.test.js`.
- Validation/commands: `node scripts/validation/src/core/enhanced-orchestrator.js --health-check`; sample category run `node scripts/validation/src/core/enhanced-orchestrator.js --category quality --project templum --task-id HEALTH-METRICS` to inspect report annotations.
- Documentation to update: `scripts/validation/docs/current/progress.md`, `scripts/validation/docs/current/architecture-spec.md`, `scripts/validation/docs/current/guides/CORE-VALIDATION-README.md`, release/changelog notes if maintained.

## References
- Progress entry: `scripts/validation/docs/current/progress.md:26`
- Architecture overview: `scripts/validation/docs/current/architecture-spec.md:48`
- Core guide context: `scripts/validation/docs/current/guides/CORE-VALIDATION-README.md:1`
- Config toggles: `scripts/validation/config/enhanced-config.json:23`
- Existing orchestrator stubs: `scripts/validation/src/core/enhanced-orchestrator.js:65`
