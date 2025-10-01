# Task: Haruspex integration path defined

## Requirement Summary
- Status: `[~]`
- Requirement text: "Haruspex integration path defined (backend pending skin output)."

## Prerequisites
- [~] Zero-knowledge backend registry with auto-discovery (needs verification in latest build). -- Auto-registration must publish the Haruspex IPC manifest before the integration path can rely on it.
- [~] Versioned skin contract enforcement (schema validation pending integration tests; see dev/tasks/versioned-skin-contract.md). -- Haruspex skin payloads must pass the shared contract validation before we treat them as source-of-truth.
- [ ] Skin payload consumption powering full UI (see dev/tasks/skin-payload-consumption.md). -- End-to-end verification of the Haruspex skin requires the renderer to consume backend-provided layouts.

## Implementation Steps
### Unblocked Actions
- [ ] Start with `Templum/tests/service-discovery/haruspex-ipc-discovery.test.ts` to assert that writing `.haruspex/haruspex-debug-connection.json` emits an IPC `BackendConfig` with host, port, and capability metadata, then extend `Templum/src/backend/service-discovery.ts:340` and `Templum/src/backend/backend-integration-config.ts:253` so discovery skips HTTP-only health probes for `ipc`, normalises the endpoint to `ipc://<host>:<port>`, and persists the config through the integration config manager.
- [ ] Add `Templum/tests/backend/haruspex-ipc-client.test.ts` covering ping, timeout, and error propagation, extract the duplicated `HaruspexIPCClient` into `Templum/src/backend/haruspex-ipc-client.ts`, and update `Templum/src/backend/backend-service-router.ts:1227` plus `Templum/src/backend/connection-factory.ts:427` to import the shared client with framed JSON enforcement.
- [ ] Capture the intended mapping in `Templum/tests/backend/haruspex-skin-adapter.test.ts` (mocked IPC responses for `getSkinDefinition` and capability queries), then implement `Templum/src/backend/haruspex-skin-adapter.ts` using the shared IPC client to translate Haruspex payloads into `UniversalSkinDefinition` and have `registerBackendFromSkin` (`Templum/src/backend/backend-service-router.ts:562`) delegate to the adapter.
- [ ] Extend `Templum/src/tests/integration-validation-framework.ts:680` with checks that require the adapter to emit `reports/integration/haruspex-skin.json` (create `Templum/reports/integration/`) and make the workflow fail fast when the backend reports `skinPending`, then surface the evidence in the readiness scoring logic at `Templum/src/tests/integration-validation-framework.ts:3602`.
- [ ] Update `Templum/tests/templum/universal-skin-system.test.ts:446` to import the shared Haruspex skin fixture produced by the adapter tests so CLI/VSCode rendering assertions track the same contract, and ensure the command router wiring still passes by exercising `Templum/src/commands/universal-command-registry.ts:711`.
- [ ] Document the finalised path in `Templum/docs/current/1.2-Backend-Integration-Guide.md` (IPC manifest, adapter usage, validation commands) and refresh the integration narrative in `Templum/docs/current/architecture-spec.md:21` to reflect the discovery → adapter → validation flow.

### Blocked Actions (pending [ ] Skin payload consumption powering full UI (see dev/tasks/skin-payload-consumption.md).)
- [ ] Once the renderer consumes backend skins, walk through VSCode/CLI end-to-end with the Haruspex payload, capture artefacts under `Templum/docs/current/integration-evidence/haruspex/`, and link them in the integration guide.
- [ ] After UI consumption lands, replace the temporary fallback logic in `Templum/src/backend/backend-service-router.ts:2163` so real Haruspex skins drive command registration and retire the Universal Skin Engine fallback for that backend.

## Definition of Done
- Tests to run: `npm test -- --runTestsByPath tests/service-discovery/haruspex-ipc-discovery.test.ts`, `npm test -- --runTestsByPath tests/backend/haruspex-ipc-client.test.ts`, `npm test -- --runTestsByPath tests/backend/haruspex-skin-adapter.test.ts`, and a full suite pass via `npm test`.
- Validation/commands: `npm run phase6-services`, `npm run phase6-validation`, and manually verify the IPC handshake by invoking the adapter after build (for example `node -e "require('./dist/src/backend/haruspex-skin-adapter').debugPing()"`).
- Documentation to update: `docs/current/progress.md` status/link, `docs/current/architecture-spec.md` Sections 1-3, `docs/current/1.2-Backend-Integration-Guide.md` Haruspex subsection, and the generated evidence under `reports/integration/haruspex-skin.json`.

## References
- Progress entry: `docs/current/progress.md:52`
- Architecture spec: `docs/current/architecture-spec.md:21`
- Service discovery: `src/backend/service-discovery.ts:340`
- Integration config: `src/backend/backend-integration-config.ts:253`
- IPC client entry: `src/backend/backend-service-router.ts:1227`
- Connection factory: `src/backend/connection-factory.ts:427`
- Integration validation: `src/tests/integration-validation-framework.ts:680`
- Readiness scoring: `src/tests/integration-validation-framework.ts:3602`
- Universal skin tests: `tests/templum/universal-skin-system.test.ts:446`
- Command registry: `src/commands/universal-command-registry.ts:711`
