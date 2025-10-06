# Task: Startup configuration validation (validators/templates/storage paths).

## Requirement Summary
- Status: `[ ]`
- Requirement text: "- [ ] Startup configuration validation (validators/templates/storage paths)."

## Prerequisites
- [ ] Validation System integration blocking promotions on failed checks. — Canonical validator categories must come from the real integration so startup checks alert on missing coverage instead of hard-coded lists.
- [ ] Template variants for different release types *(see `dev/tasks/release-template-variants.md`)*. — Release-specific template bundles supply the metadata this validator must confirm before boot completes.

## Implementation Steps
### Unblocked Actions
- [ ] Add red-green tests in `phoenix-code-lite/tests/unit/core/startup-configuration-validator.test.ts` that cover: (1) happy path when required directories, templates, and validator category stubs are present; (2) failure when `.phoenix-code-lite/config.json`, `.phoenix-code-lite/templates/`, `.phoenix-code-lite/audit/`, or `.phoenix-documents/` are missing; (3) failure when the config’s declared templates or validator categories are not registered. Use filesystem sandbox helpers so tests never touch the real workspace.
- [ ] Introduce `StartupConfigurationValidator` and `StartupConfigurationError` in `phoenix-code-lite/src/core/startup/startup-configuration-validator.ts`, injected with abstractions (`FileSystemAdapter`, `TemplateCatalog`, `ValidatorCatalog`) so checks stay testable and reusable. Ensure it verifies required directories (creating them when allowed), confirms configured template identifiers exist in `ConfigurationTemplates`/`TemplateManager`, and validates `validators.requiredCategories` against the catalog.
- [ ] Extend `PhoenixCodeLiteConfigSchema` in `phoenix-code-lite/src/config/settings.ts` with a `startup` section (e.g., `paths`, `requiredTemplates`, `requiredValidatorCategories`, `autoCreateMissingDirs`) and surface defaults that preserve backwards compatibility. Update `PhoenixCodeLiteConfig` helpers and serialization to persist the new section without breaking existing configs.
- [ ] Wire the validator into `CoreFoundation.initialize()` (in `phoenix-code-lite/src/core/foundation.ts`) so startup halts with descriptive errors when validation fails. Emit audit events through `AuditLogger` (`startup_config_validation_passed`/`failed`) and log actionable remediation messages.
- [ ] Expose a CLI diagnostic (`phoenix-code-lite/src/cli/commands/config-command.ts` or a dedicated `validate-startup` command) that runs the startup validator on demand. Cover success/error flows with Jest in `phoenix-code-lite/tests/unit/cli/commands/config-command.test.ts` so operator tooling stays verifiable.

### Blocked Actions (pending `[ ] Validation System integration blocking promotions on failed checks.`)
- [ ] Replace the interim validator catalog stub with the real Validation System gateway, ensuring startup verifies every lifecycle-required category resolves and fails fast when integrations drift. Add integration coverage in `tests/integration/validation/startup-config-validation.test.ts` once the gateway exists.

### Blocked Actions (pending `[ ] Template variants for different release types *(see dev/tasks/release-template-variants.md)*`.)
- [ ] Expand startup validation to confirm every release template declared in the config has accompanying bundles (`requiredValidators`, `documentationPacks`, `signOffRoles`). Add assertions to the release template registry tests so template drift is caught before boot.

## Definition of Done
- Tests to run (`npm test -- tests/unit/core/startup-configuration-validator.test.ts`, `npm test -- tests/unit/cli/commands/config-command.test.ts`, full `npm test`).
- Validation/commands (`node dist/unified-cli.js config --validate-startup`, `node dist/unified-cli.js config --show` to confirm persisted startup section, `npm run lint`).
- Documentation to update (`phoenix-code-lite/docs/current/progress.md`, `phoenix-code-lite/docs/current/architecture-spec.md` Operational Guarantees, `meta/ARCHITECTURE.md` reminders for startup audits).

## References
- Progress entry: `phoenix-code-lite/docs/current/progress.md:32`.
- Architecture spec: `phoenix-code-lite/docs/current/architecture-spec.md:48`.
- Target architecture: `meta/ARCHITECTURE.md:113`.

## Current Status (2025-02-15)
- Implementation: existing `ConfigManager` performs schema validation, but no dedicated startup validator, config `startup` section, or CLI diagnostics have been added; foundational directories are not checked at boot.
- Tests executed: none — startup validation suites cited in the plan are absent, and current Jest runs skip configuration diagnostics.
- Coverage snapshot: configuration modules show base coverage from other tests (e.g., `ConfigManager`) but no metrics for startup validation because the feature is missing.
- Gaps blocking completion: requires config schema extensions, validator implementation, integration with `CoreFoundation.initialize`, CLI hook, and coordination with validation/template tasks.
