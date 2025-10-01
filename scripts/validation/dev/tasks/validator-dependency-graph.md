# Task: Validator Dependency Graph Support

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Validator dependency graph support (pre/post checks, shared resources)."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Add failing unit coverage in `scripts/validation/tests/unit/validator-dependency-graph.test.js` that expects the orchestrator to topologically order categories, invoke declared pre/post hooks, and reject dependency cycles or missing shared resource definitions.
- [ ] Extend integration fixture `scripts/validation/tests/integration/config/` with a dependency-aware project config and update `scripts/validation/tests/integration/test-complete-workflow.js` to assert that shared resources are locked while dependent validators execute.
- [ ] Update validator typing in `scripts/validation/src/interfaces/validator-interface.ts` and related TypeScript contracts to surface `dependsOn`, `provides`, and `sharedResources` metadata for each validator.
- [ ] Expand the JSON schema at `scripts/validation/config/capability-schema.json` and the matrix at `scripts/validation/config/capability-matrix.json` to define validator dependency metadata (preValidators, postValidators, sharedResources, resourceMode).
- [ ] Implement a graph builder in `scripts/validation/src/core/validator-dependency-graph.js` that loads the capability matrix, validates the dependency definitions, and returns an execution plan with pre/post hooks attached.
- [ ] Introduce a cooperative lock manager in `scripts/validation/src/core/resource-lock-manager.js` and integrate it into `scripts/validation/src/core/enhanced-orchestrator.js` so validators sharing resources serialize access while independent ones can run concurrently.
- [ ] Refactor `scripts/validation/src/core/enhanced-orchestrator.js` to use the dependency graph when orchestrating validators, wiring graph-derived pre/post steps into `preValidationChecks` and `postValidationProcessing` and ensuring rollback covers multi-validator chains.
- [ ] Document the new dependency handling pipeline in `scripts/validation/docs/current/architecture-spec.md` (components overview, execution flow, outstanding risks) and add operational notes for shared resource conflicts.

### Blocked Actions (pending [ ] Policy engine for required validators per release type *(see dev/tasks/policy-engine.md)*)
- [ ] Feed dependency graph outputs into the policy engine ruleset so gating can verify that dependent validators ran in the required order as part of release checks.

## Definition of Done
- Tests to run: `node scripts/validation/tests/unit/validator-dependency-graph.test.js`, `node scripts/validation/tests/integration/test-complete-workflow.js`.
- Validation/commands: execute `node scripts/validation/src/core/enhanced-orchestrator.js --category <cat> --project <proj>` for a dependency-enabled category set.
- Documentation to update: `scripts/validation/docs/current/progress.md`, `scripts/validation/docs/current/architecture-spec.md` dependency sections, and any impacted validator READMEs.

## References
- Progress entry: `scripts/validation/docs/current/progress.md:8`
- Architecture spec sections: `scripts/validation/docs/current/architecture-spec.md:37`, `scripts/validation/docs/current/architecture-spec.md:60`
- Related task files: `scripts/validation/dev/tasks/policy-engine.md`
