# Task: Configuration Discovery With Schema Validation

Requirement: [ ] Configuration discovery with schema validation (ensure configs align with new structure).

## Requirement Summary
- Status: `[ ]`
- Requirement text: "[ ] Configuration discovery with schema validation (ensure configs align with new structure)."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Add failing unit coverage for project configuration discovery under `scripts/validation/tests/unit/config-discovery.test.js` that scans `config/projects`, asserts invalid configs return Ajv validation errors, and confirms valid configs surface normalized metadata.
- [ ] Define `scripts/validation/config/project-config-schema.json` to capture the v3.0.1 valconfig structure (version metadata, `project` block, `validation` commands/timeouts/resources, `reporting` settings, optional monitoring/performance) and align it with `config/project-template.json`.
- [ ] Implement `scripts/validation/src/core/config-discovery.js` to enumerate `config/projects/*.json`, validate each file with Ajv, emit structured diagnostics, and expose helpers such as `discoverProjectConfigs()` and `loadProjectConfig(name)` for reuse.
- [ ] Refactor `scripts/validation/src/core/enhanced-orchestrator.js` to delegate config loading/validation to the new discovery helpers, ensuring `initialize`, `resolveProjectInfo`, and `resolveProjectConfig` no longer duplicate schema checks and that failures report actionable context.
- [ ] Update documentation after implementation: describe the discovery workflow and schema contract in `scripts/validation/docs/current/architecture-spec.md` (sections 3 and 4) and record completion context in `scripts/validation/docs/current/progress.md`.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- Tests to run: `node scripts/validation/tests/unit/config-discovery.test.js`; `node scripts/validation/tests/validation-system-enhancement-test.js`.
- Validation/commands: dry-run `node scripts/validation/src/core/enhanced-orchestrator.js --category quality --project templum --task-id CONFIG-CHECK` to confirm discovery resolves active config without manual wiring.
- Documentation to update: `scripts/validation/docs/current/progress.md`, `scripts/validation/docs/current/architecture-spec.md`, changelog or release notes if maintained.

## References
- Progress entry: `scripts/validation/docs/current/progress.md:9`
- Architecture spec: `scripts/validation/docs/current/architecture-spec.md:41`
- Current loader implementation: `scripts/validation/src/core/enhanced-orchestrator.js:90`
- Template alignment: `scripts/validation/config/project-template.json`
