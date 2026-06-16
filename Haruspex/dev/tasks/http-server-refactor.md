# Task: [~] HTTP server boots (handlers still tied to legacy components; replace with backend-native logic).

## Requirement Summary
- Status: `[~]`
- Requirement text: "HTTP server boots (handlers still tied to legacy components; replace with backend-native logic)."

## Prerequisites
- [ ] [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies. — Backend handlers need these VSCode-free graphs before they can drop the extension-era menu/tree providers.
- [ ] [?] Codebase ingestion pipeline (static analysis modules partially migrated from extension; verify pure backend operation). — Confirm ingestion emits backend-native artefacts so new HTTP responses are grounded in real data (see dev/tasks/codebase-ingestion-pipeline.md).

## Implementation Steps
### Unblocked Actions
- [ ] Write failing HTTP integration specs in `Haruspex/src/__tests__/api/http-server-refactor.test.ts` that spin up `HaruspexBackendService` via `startBackendService` and exercise `/api/v1/analyze`, `/api/v1/predict`, and `/api/v1/diagnostics` using `supertest`, asserting responses include non-placeholder metrics (real class/function listings, risk summaries) and no `Templum` command wrappers.
- [ ] Refactor `Haruspex/src/core/haruspex-core-engine.ts:948` to delegate analysis to `AnalysisEngine` (imported from `../engines/analysis-engine`) and surface its structured results, deleting the stubbed metric scaffolding and wiring cache/telemetry through the backend dependency bundle.
- [ ] Extract backend-native controllers under `Haruspex/src/api/http/` (e.g., `analysis-controller.ts`, `diagnostics-controller.ts`) and update `Haruspex/src/api/gateway/api-gateway.ts:352-899` so `handleHTTPRequest` calls these controllers directly while `handleTemplumCommand` is reduced to a thin compatibility adapter.
- [ ] Rework `Haruspex/src/haruspex-backend-service.ts:211` to inject the new controllers into `APIGateway`, ensure cache invalidation is triggered from real analysis/prediction completions, and add telemetry that flags any fallback to legacy VSCode adapters during backend startup.
- [ ] Update `Haruspex/docs/current/architecture-spec.md` sections documenting the Service & API Layer to describe the backend-native HTTP flow and remove references to extension-driven handlers once tests pass.

### Blocked Actions (pending [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies.)
- [ ] Replace the interim dependency placeholders in the new HTTP controllers with finalized structural graph outputs, and extend the integration specs to assert module/edge data once the structural representation requirement closes.

### Blocked Actions (pending [?] Codebase ingestion pipeline (static analysis modules partially migrated from extension; verify pure backend operation).)
- [ ] Promote the integration specs to run against real repository fixtures only after ingestion verification lands, and add assertions that diagnostics expose ingestion-derived metrics without referencing `vscode` namespaces.

## Known Legacy Test Failures (2026-06-16)

During the Templum skin contract cleanup, `npx jest --runTestsByPath src/__tests__/backend-service.test.ts --runInBand --forceExit` still failed on pre-existing backend-service expectations outside the skin contract path. Treat these as part of the HTTP/backend-native refactor rather than regressions from the schema rename:

- Initialization failure handling resolves instead of rejecting when mocked analysis-engine startup fails.
- Cache-hit assertions expect the second analysis request to report `metadata.cacheHit: true`, but current service results report `false`.
- Invalid analysis/prediction and post-shutdown analysis requests resolve with fallback payloads instead of throwing `HaruspexAPIError`/`ServiceUnavailableError`.
- API gateway status reports the IPC server port as `3003` where the test expects `3002`.
- Health degradation mocks leave `diagnostics.analysisEngine.status` as `operational`.

The targeted skin tests in the same suite pass with `--testNamePattern "skin definition|Templum schema-conforming"`. Revisit the broader expectations when backend-native controllers and lifecycle/error semantics are clarified.

## Definition of Done
- `npm run build:backend`, `npm run test:unit`, and the new `npx jest Haruspex/src/__tests__/api/http-server-refactor.test.ts` succeed locally without relying on VSCode mocks.
- `npm run start:backend` serves `/api/v1/analyze`, `/api/v1/predict`, `/api/v1/diagnostics`, and `/health` with backend-native payloads (no `Templum` command wrappers) against a sample repo.
- `Haruspex/docs/current/architecture-spec.md` documents the refactored HTTP flow and any new controller modules.
- `docs/current/progress.md` retains this requirement with its task link and updated status when work completes.

## References
- Haruspex/docs/current/progress.md:19
- Haruspex/docs/current/architecture-spec.md:16
- Haruspex/src/api/gateway/api-gateway.ts:352
- Haruspex/src/core/haruspex-core-engine.ts:948
- Haruspex/src/haruspex-backend-service.ts:211
