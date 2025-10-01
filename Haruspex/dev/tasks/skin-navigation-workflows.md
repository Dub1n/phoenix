# Task: Navigation workflows encoded in skin payloads

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Navigation workflows encoded in skin payloads."

## Prerequisites
- [ ] Skin definition emission for dashboards/code navigation *(see `dev/tasks/backend-skin-generator.md`)* — navigation workflows must ride on the live skin payload endpoint before they can be exercised or validated.

## Implementation Steps
### Unblocked Actions
- [ ] Drive the change from tests by adding a backend-focused spec (e.g. `Haruspex/src/skin/__tests__/skin-navigation-workflows.test.ts`) that uses `HaruspexMenuSystem` test doubles plus `createBackendDependencies(createDefaultBackendConfig(tmpDir))` to assert `SkinProvider.generateSkinDefinition` emits deterministic workflow entries for primary navigation paths (`analysis`, `predictions`, `diagnostics`) with serialized step metadata and no `vscode` mocks.
- [ ] Implement a reusable navigation workflow builder (`Haruspex/src/skin/navigation-workflow-builder.ts`) that accepts a `HaruspexMenuSystem` tree, resolves command IDs via `Haruspex/src/integration/adapters/MenuSystemAdapter.ts`, and outputs normalized workflow/shortcut tuples; refactor the existing ad-hoc logic in `Haruspex/src/skin/skin-provider.ts` to delegate to the builder so navigation steps stay DRY across interfaces.
- [ ] Extend `Haruspex/src/skin/skin-provider.ts` to merge builder output into `SkinWorkflows` and `SkinMenus`, ensure workflow IDs follow the `nav.<path>` convention, and thread builder injection through `SkinProvider` so backend unit tests can swap deterministic fixtures.
- [ ] Update the backend surface (`Haruspex/src/haruspex-backend-service.ts` and `Haruspex/src/api/gateway/api-gateway.ts`) to feed the live menu tree into `SkinProvider`, expose the enriched payload on the skin endpoint/Templum registration, and add request-router coverage so `/api/skin` responses include `workflows.nav.*` entries.
- [ ] Wire CLI/monitoring flows (`Haruspex/src/debugging/haruspex-cli.ts`, `Haruspex/src/debugging/interactive-controller.ts`, and `Haruspex/src/debugging/cli-bin.ts`) to surface the new navigation workflows (e.g. JSON export or selection menus) and add regression coverage ensuring navigation serialization works when `process.env.HARUSPEX_MODE='backend'`.

### Blocked Actions (if any)
- [ ] Pending completion of Skin definition emission for dashboards/code navigation *(see `dev/tasks/backend-skin-generator.md`)* — until the endpoint is live, defer end-to-end validation with Templum and the CLI.

## Definition of Done
- Tests: `npm run test:unit` (including the new navigation workflow spec) and the skin endpoint integration tests in `npm run test:ext` pass; backend start-up under `npm run start:backend` returns a skin payload where `workflows.nav.analysis` and related entries exist.
- Validation: `curl http://localhost:3002/api/skin | jq '.workflows | keys'` lists the nav workflows, and `rg "vscode" src/skin src/debugging -g"*.ts"` shows no new VSCode dependencies in the navigation path.
- Documentation: Update `Haruspex/docs/current/architecture-spec.md` sections 1–3 to record navigation workflow encoding, note availability in `dev/tasks/backend-skin-generator.md`, and flip the progress entry to reference this task when complete.

## References
- Progress entry: `Haruspex/docs/current/progress.md:25`
- Architecture spec: `Haruspex/docs/current/architecture-spec.md:16`, `Haruspex/docs/current/architecture-spec.md:32`
- Related task: `Haruspex/dev/tasks/backend-skin-generator.md`
- Menu adapter: `Haruspex/src/integration/adapters/MenuSystemAdapter.ts`
- Skin provider: `Haruspex/src/skin/skin-provider.ts`
