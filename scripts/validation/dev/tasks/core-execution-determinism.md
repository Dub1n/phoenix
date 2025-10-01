# Task: Core execution loop deterministic across projects

- [?] Core execution loop deterministic across projects (requires recent smoke tests).

## Requirement Summary
- Status: `[?]`
- Requirement text: "Core execution loop deterministic across projects (requires recent smoke tests)."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Enforce deterministic ordering in the orchestrator by sorting categories/projects before iteration and persisting the run sequence for checks (`scripts/validation/src/core/enhanced-orchestrator.js:386`, `scripts/validation/src/core/enhanced-orchestrator.js:732`, `scripts/validation/src/core/enhanced-orchestrator.js:1423`).
- [ ] Add explicit valconfig files for each supported repository (Templum, Haruspex, Phoenix Code Lite) under `scripts/validation/config/projects/`, mirroring the template structure and command mapping (`scripts/validation/config/project-template.json:1`).
- [ ] Build a cross-project smoke harness that exercises sorted runs twice and asserts identical order/results across projects and categories (extend or add alongside `scripts/validation/tests/integration/test-enhanced-system.js:31`) and emit summary artifacts for inspection.
- [ ] Augment unit coverage so repeated plan generation returns the same sequence and command resolution (`scripts/validation/tests/unit/test-framework.js:1`).

### Blocked Actions
- [ ] None.

## Definition of Done
- Tests to run: `node scripts/validation/tests/integration/test-cross-project-determinism.js` (new harness), `node scripts/validation/src/core/enhanced-orchestrator.js --health-check`.
- Validation/commands: `node scripts/validation/src/core/enhanced-orchestrator.js --category backend --project templum --task-id smoke-templum-backend`, repeat for `haruspex` and `phoenix-code-lite` across required categories.
- Documentation to update: `scripts/validation/docs/current/architecture-spec.md` Section 6 (deterministic smoke guidance), `scripts/validation/docs/current/progress.md` entry for this requirement.

## References
- `scripts/validation/docs/current/progress.md:7`
- `scripts/validation/docs/current/architecture-spec.md:10`
- `scripts/validation/src/core/enhanced-orchestrator.js:386`
- `scripts/validation/src/core/enhanced-orchestrator.js:732`
- `scripts/validation/src/core/enhanced-orchestrator.js:1423`
- `scripts/validation/tests/integration/test-enhanced-system.js:31`
- `scripts/validation/tests/unit/test-framework.js:1`
- `scripts/validation/config/project-template.json:1`
