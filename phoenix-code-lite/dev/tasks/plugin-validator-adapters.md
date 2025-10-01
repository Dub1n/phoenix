# Task: Plug-in validator/adapters configuration.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "- [ ] Plug-in validator/adapters configuration. *(see `dev/tasks/plugin-validator-adapters.md`)*"

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Add failing unit coverage in `tests/unit/validation/validator-plugin-registry.test.ts` asserting a registry loads enabled plugins, enforces schema errors, and resolves adapters for real modules such as `scripts/validation/src/validators/quality-validator.js`.
- [ ] Add integration regression `tests/integration/validation/tdd-orchestrator-plugins.integration.test.ts` confirming the orchestrator executes external validators and honors enable/disable toggles from configuration.
- [ ] Extend configuration schemas in `src/core/foundation.ts` and `src/config/settings.ts` to add `validators.plugins[]` (id, modulePath, adapter, scopes, enabled) and persist through `ConfigManager`, committing a default manifest under `config/validators.default.json` seeded with active Validation System adapters.
- [ ] Implement `src/validation/plugin-registry.ts` plus adapters under `src/validation/adapters/` that load metadata, instantiate validator handlers, expose `list()/run()` APIs, and cache capability metadata for downstream services.
- [ ] Wire the registry into `src/tdd/quality-gates.ts` and `src/tdd/orchestrator.ts` so plugin validators register as additional gates, emit audit events through `src/utils/audit-logger.ts`, and feed quality reports.
- [ ] Surface management via CLI by extending `src/cli/commands/config-command.ts` (e.g., `--validators` subcommand) to list, enable, disable, and reload plugins, updating help text and persistence behaviour.
- [ ] Update documentation (e.g., plugin section in `docs/current/architecture-spec.md` and configuration notes) describing adapter responsibilities, storage layout, and Validation System bridge expectations.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- Tests to run: `npm test -- tests/unit/validation/validator-plugin-registry.test.ts`, `npm test -- --runTestsByPath tests/integration/validation/tdd-orchestrator-plugins.integration.test.ts`.
- Validation/commands: `npm run build`; exercise CLI `node dist/unified-cli.js config --validators --list` (or equivalent) to confirm registry state updates.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, configuration README covering validator manifests.

## References
- Progress entry: `docs/current/progress.md:27`
- Architecture context: `docs/current/architecture-spec.md:13`
- Quality gate wiring: `src/tdd/orchestrator.ts:34`, `src/tdd/quality-gates.ts:37`
- Configuration systems: `src/core/config-manager.ts:1`, `src/config/settings.ts:1`
- DI entry point: `src/index-di.ts:19`
- Validation System source adapters: `scripts/validation/src/validators/quality-validator.js:1`, `scripts/validation/src/validators/architecture-validator.js:1`
