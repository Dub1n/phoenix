# Task: Policy engine for release gating

## Requirement Summary
- Status: `[ ]`
- Requirement text: "[ ] Policy engine for required validators per release type *(see dev/tasks/policy-engine.md)*."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Capture the canonical release types (`prototype`, `production`, `emergency-fix`) from Phoenix Code Lite by reviewing `phoenix-code-lite/dev/tasks/release-template-variants.md` and summarising them into a new policy data file at `scripts/validation/config/policies/release-validator-policy.json` (create the `policies/` folder) with fields for `releaseType`, `requiredValidators`, `optionalValidators`, and `notes`.
- [ ] Start with failing Jest coverage in `scripts/validation/tests/unit/policy-engine.spec.js` that loads the policy JSON, validates schema rules (missing release type, duplicate categories, unknown validator names), and asserts enforcement decisions (`isCompliant`, `missingValidators`, `unexpectedValidators`).
- [ ] Define a JSON schema at `scripts/validation/config/policies/release-validator-policy.schema.json` and validate it via a new helper `scripts/validation/src/core/policy/validator-policy-loader.js`; wire the loader to reuse the existing configuration discovery utilities instead of duplicating file IO.
- [ ] Implement `scripts/validation/src/core/policy/validator-policy-engine.js` that accepts the loaded policy + capability matrix, resolves category aliases, and exposes `evaluateRun({ project, releaseType, executedValidators })` returning structured compliance results suitable for CLI messaging.
- [ ] Add orchestrator hooks in `scripts/validation/src/core/enhanced-orchestrator.js` to pull the release type from the project configuration (`config/projects/<project>-valconfig.json` → `validation.releaseType`), call the policy engine before executing validations, and abort with actionable errors when required validators are missing.
- [ ] Extend integration coverage in `scripts/validation/tests/integration/test-enhanced-system.js` (or a new `test-policy-enforcement.js`) to simulate a release run for each release type and confirm the orchestrator refuses to start when a mandatory category is skipped, producing clear remediation guidance.
- [ ] Update per-project configs (`scripts/validation/config/projects/*.json`) so each includes a `releaseType` and `validators.allowOptional` flag, and ensure capability matrix entries include `releaseSupport` metadata noting which release types each validator satisfies.
- [ ] Document policy behaviour in `scripts/validation/docs/current/architecture-spec.md` (governance section) and add operational guidance for updating the policy file; record the enforcement workflow in `scripts/validation/dev/reports/` once initial validation runs pass.

### Blocked Actions (pending [ ] Validator dependency graph support (pre/post checks, shared resources).)
- [ ] Integrate dependency-aware sequencing so the policy engine verifies not only category presence but also that dependency graph pre/post validators executed before marking a release compliant.

## Definition of Done
- Tests to run: `node scripts/validation/tests/unit/policy-engine.spec.js`, `node scripts/validation/tests/integration/test-enhanced-system.js` (or new policy-specific integration test), plus `npm test` if a consolidated runner exists.
- Validation/commands: `node scripts/validation/src/core/enhanced-orchestrator.js --category <cat> --project <proj> --task-id policy-smoke --scope "**/*"` for each release type to confirm gating, and ensure failures include missing-category diagnostics.
- Documentation to update: `scripts/validation/docs/current/progress.md`, `scripts/validation/docs/current/architecture-spec.md` (Observability & Governance), `phoenix-code-lite/docs/current/progress.md` once release templates consume the policy outputs.

## References
- Progress entry: `scripts/validation/docs/current/progress.md:27`
- Architecture spec governance callout: `scripts/validation/docs/current/architecture-spec.md:52`
- Cross-project release template plan: `phoenix-code-lite/dev/tasks/release-template-variants.md:5`
- Dependency follow-up: `scripts/validation/dev/tasks/validator-dependency-graph.md:33`
