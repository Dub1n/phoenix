# Task: Phoenix Code Lite skin ingestion validated

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Phoenix Code Lite skin ingestion validated."

## Prerequisites
- [~] Zero-knowledge backend registry with auto-discovery (needs verification in latest build). — Ingestion must ride the discovery path exposed by `ServiceDiscovery` before we can treat validation as production-real.
- [~] Versioned skin contract enforcement (schema validation pending integration tests; see dev/tasks/versioned-skin-contract.md). — Contract enforcement needs to flag incompatible PCL payloads during ingestion.
- [ ] Skin payload consumption powering full UI without hardcoding (see dev/tasks/skin-payload-consumption.md). — UI validation across adapters depends on the renderer consuming skins end-to-end.

## Implementation Steps
### Unblocked Actions
- [ ] Add `tests/backend/pcl-skin-ingestion.test.ts` that spins up a fixture HTTP server (mirroring `createMockPCLSkinDefinition()` from `src/tests/backend/generic-backend-integration.test.ts:28`), feeds the manifest through `TemplumBackendServiceRouter.registerBackendFromSkin()` (`src/backend/backend-service-router.ts:562`), and asserts that command routing, health status, and capability profiles reflect the live PCL backend. Reuse `ConnectionFactory.create()` (`src/backend/connection-factory.ts:152`) so the test exercises the real HTTP handshake.
- [ ] Wire an ingestion export script (`scripts/integration/export-pcl-skin.ts`) that shells to the Phoenix Code Lite CLI (`phoenix-code-lite/package.json`) or imports `convertMenuContentToSkinDefinition` from `phoenix-code-lite/src/cli/layout-system-validation.ts:164` to emit a production-like skin JSON into `reports/integration/pcl/skin-definition.json`. Persist the file in `.templum/services/pcl.json` so `ServiceDiscovery` (`src/backend/service-discovery.ts:274`) can ingest it during development runs.
- [ ] Extend `tests/templum/pcl-integration.test.ts:16` to load the exported manifest, invoke `UniversalLayoutEngine` and `PCLRenderingAdapter.convertToUniversalMenuDefinition()` (`src/skin/pcl-rendering-adapter.ts:107`), and confirm `PCLMenuRegistry.registerMenu()` (`src/registry/pcl-menu-registry.ts:123`) produces CLI/VSCode menus with ≥70% PCL pattern reuse.
- [ ] Capture the end-to-end workflow in `docs/current/integration/pcl-skin-ingestion.md`, referencing the manual verification steps already documented in `docs/current/1.2-Backend-Integration-Guide.md:1088`, and include pointers to generated artefacts under `reports/integration/pcl/` plus troubleshooting notes for operations/partners.
- [ ] Update `Phase6IntegrationValidationSuite` (`src/tests/integration-validation-framework.ts:282`) so the generated `Phase6ValidationReport` fails if the PCL backend is missing, has stale commands, or produces mismatched menu counts versus the ingestion artefact produced above.

### Blocked Actions (pending [~] Zero-knowledge backend registry with auto-discovery (needs verification in latest build).)
- [ ] Swap the direct `.templum/services` write in the ingestion script for discovery-first validation: drop the exported manifest via the registry watcher (`src/backend/service-discovery.ts:611`) and assert the new test observes live discovery events.

### Blocked Actions (pending [~] Versioned skin contract enforcement (schema validation pending integration tests; see dev/tasks/versioned-skin-contract.md).)
- [ ] Once schema enforcement lands, update the ingestion tests to exercise version mismatches and confirm `validateSkinDefinition` rejects outdated PCL payloads before they reach `PCLMenuRegistry`.

### Blocked Actions (pending [ ] Skin payload consumption powering full UI without hardcoding (see dev/tasks/skin-payload-consumption.md).)
- [ ] After the renderer is fully skin-driven, add cross-adapter smoke tests in `tests/e2e/e2e-complete-workflows.test.ts` that manually execute the Phoenix Code Lite workflows exposed via the ingested skin, capturing CLI/VSCode parity metrics in the training artefacts.

## Definition of Done
- Tests to run: `npm test -- tests/backend/pcl-skin-ingestion.test.ts tests/backend/generic-backend-integration.test.ts tests/templum/pcl-integration.test.ts`, `npm run phase6-validation -- --services pcl --format markdown`, and the existing `npm run phase6-health` suite.
- Validation/commands: `node scripts/integration/export-pcl-skin.js` (or `ts-node` variant during development) to refresh `.templum/services/pcl.json`; curl the exported endpoints per `docs/current/1.2-Backend-Integration-Guide.md:1093`; verify the generated `phase6-validation-*.md` includes a healthy PCL block.
- Documentation to update: `docs/current/progress.md` entry, `docs/current/architecture-spec.md` Integration Points/Outstanding Work sections, `docs/current/integration/pcl-skin-ingestion.md`, and any shared runbook or partner enablement pages referencing Phoenix Code Lite.

## References
- `docs/current/progress.md:53`
- `docs/current/architecture-spec.md:37`
- `docs/current/architecture-spec.md:50`
- `docs/current/1.2-Backend-Integration-Guide.md:1088`
- `src/backend/backend-service-router.ts:562`
- `src/backend/connection-factory.ts:152`
- `src/backend/service-discovery.ts:274`
- `src/skin/pcl-rendering-adapter.ts:107`
- `src/registry/pcl-menu-registry.ts:123`
- `src/tests/backend/generic-backend-integration.test.ts:28`
- `tests/templum/pcl-integration.test.ts:16`
- `src/tests/integration-validation-framework.ts:282`
- `phoenix-code-lite/src/cli/layout-system-validation.ts:164`
