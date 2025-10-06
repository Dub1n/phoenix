# Task: Template variants for different release types.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "- [ ] Template variants for different release types."

## Prerequisites
- [ ] Validation System integration blocking promotions on failed checks. — Release templates must attach validator bundles to the categories once the integration exposes an authoritative taxonomy.
- [ ] Lifecycle orchestration with gated transitions and signatures. — Template-defined sign-off stages need the orchestration state machine to exist before wiring gates.

## Implementation Steps
### Unblocked Actions
- [ ] Drive the work with failing Jest coverage in `phoenix-code-lite/tests/unit/config/release-template-variants.test.ts`, covering registry resolution for `prototype`, `production`, and `emergency-fix` templates plus CLI selection flows (`ConfigCommand` + `MockConfigManager`) so behaviour is locked before production code.
- [ ] Define strongly typed release template contracts (`ReleaseType`, `ReleaseTemplateDefinition`, `ValidatorBundle`, `SignOffGate`) in `phoenix-code-lite/src/release/templates/release-template-types.ts`, and implement a dependency-injected `ReleaseTemplateRegistry` in `phoenix-code-lite/src/release/templates/release-template-registry.ts` that reuses `ConfigurationTemplates.mergeTemplates` to stay DRY.
- [ ] Extend `PhoenixCodeLiteConfigData` in `phoenix-code-lite/src/config/settings.ts` with a `release` section capturing `currentType`, `requiredValidators`, `documentationPacks`, and `signOffRoles`; update schema defaults, validation, and serialization so legacy configs remain valid.
- [ ] Update `ConfigurationTemplates` in `phoenix-code-lite/src/config/templates.ts` to expose `getReleaseTemplates()` and `applyReleaseTemplate()` that hydrate the new `release` section with canonical bundles, documentation packs, and audit metadata before persisting via the config manager.
- [ ] Enhance CLI surfaces (`phoenix-code-lite/src/cli/args.ts`, `phoenix-code-lite/src/cli/commands/config-command.ts`) to support `--release-template <type>`, ensure audit logging, and extend `phoenix-code-lite/tests/unit/cli/commands/config-command.test.ts` to cover happy/error paths.

### Blocked Actions (pending `[ ] Validation System integration blocking promotions on failed checks.`)
- [ ] Replace stubbed validator category strings with live taxonomy from the Validation System client and add integration coverage in `tests/integration/validation/release-template-matrix.test.ts` once the integration exposes APIs.

### Blocked Actions (pending `[ ] Lifecycle orchestration with gated transitions and signatures.`)
- [ ] Inject release template gating (`signOffGates`, `requiredRoles`) into the lifecycle orchestrator delivered by that requirement (land the hook under `phoenix-code-lite/src/qms/workflow/lifecycle-orchestrator.ts`) so template selection drives state transitions and approval enforcement.

## Definition of Done
- Tests to run (`npm test -- tests/unit/config/release-template-variants.test.ts`, `npm test -- tests/unit/cli/commands/config-command.test.ts`, full CI via `npm test`).
- Validation/commands (`node dist/unified-cli.js config --release-template production`, `node dist/unified-cli.js config --show` to confirm persistence, `npm run lint`).
- Documentation to update (`phoenix-code-lite/docs/current/progress.md`, `phoenix-code-lite/docs/current/architecture-spec.md` Workflow Automation + Operational sections, `docs/03-PCL-QMS/` release process notes).

## References
- Progress entry: `phoenix-code-lite/docs/current/progress.md:16`.
- Architecture spec: `phoenix-code-lite/docs/current/architecture-spec.md:26`, `phoenix-code-lite/docs/current/architecture-spec.md:33`.
- Target architecture: `meta/ARCHITECTURE.md:100`.

## Current Status (2025-02-15)
- Implementation: release template registry, config schema extensions, and CLI flags have not been introduced; configuration templates remain limited to starter/enterprise/performance profiles with no release dimension.
- Tests executed: none — template variant suites referenced in the plan do not exist.
- Coverage snapshot: not applicable (release template code missing).
- Gaps blocking completion: awaiting validation integration taxonomy, lifecycle orchestrator hooks, registry implementation, and CLI/config updates.
