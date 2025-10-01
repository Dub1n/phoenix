# Task: Extension hooks for additional static analysis engines

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Extension hooks for additional static analysis engines."

## Prerequisites
- [?] Codebase ingestion pipeline (static analysis modules partially migrated from extension; verify pure backend operation). — Hook registration must attach to the finalized ingestion lifecycle so third-party engines receive repository snapshots without VSCode shims.
- [ ] Programmatic analyses (architecture drift, coupling metrics, risk flags) exposed via API. — External engines need a stable API surface to publish results to clients and Templum.

## Implementation Steps
### Unblocked Actions
- [ ] Update `Haruspex/docs/current/architecture-spec.md` (Sections 2 & 5) with the extension-hook design: engine lifecycle, registration contracts, configuration surface, and observability expectations.

### Blocked Actions (pending [?] Codebase ingestion pipeline (static analysis modules partially migrated from extension; verify pure backend operation).)
- [ ] Add failing coverage in `Haruspex/src/engines/__tests__/analysis-engine-hooks.test.ts` capturing: (a) dynamic registration of external engines, (b) isolation when a hook throws, and (c) teardown sequencing tied to ingestion shutdown.
- [ ] Introduce `Haruspex/src/engines/extensions/static-analysis-extension.ts` defining the hook interface, capability metadata, and execution contract (pure async API, deterministic output schema, explicit resource limits).
- [ ] Implement a registry orchestrator in `Haruspex/src/core/static-analysis-registry.ts` (or similar) that loads hooks, enforces capability flags, and exposes metrics for diagnostics.
- [ ] Refactor `Haruspex/src/engines/analysis-engine.ts` to resolve engines via the registry, run them after the core analysis phases, and persist results into the existing cache without VSCode dependencies.
- [ ] Wire hook discovery into service startup by updating `Haruspex/src/haruspex-backend-service.ts` and `Haruspex/src/config/templum-configuration-manager.ts` so administrators can declare engines (paths, npm packages) and toggle them at runtime.
- [ ] Provide a sample deterministic engine under `Haruspex/src/engines/extensions/example-structural-engine.ts` used only for tests and documentation, ensuring it exercises the registry pipeline without using mocks.

### Blocked Actions (pending [ ] Programmatic analyses (architecture drift, coupling metrics, risk flags) exposed via API.)
- [ ] Extend `Haruspex/src/api/types/api-contracts.ts` and validation utilities so analysis responses include external engine findings (metadata, provenance, timestamps, capability tags).
- [ ] Update `Haruspex/src/api/gateway/api-gateway.ts` handlers and the diagnostics payload to surface registered hooks and their health, and expose a new `GET /api/v1/analysis-engines` endpoint for clients.
- [ ] Enhance `Haruspex/src/__tests__/backend-service.test.ts` (or create `tests/api/analysis-engines.e2e.test.ts`) to verify API responses include hook metadata and that failing hooks degrade gracefully without breaking primary analyses.
- [ ] Refresh `Haruspex/src/skin/skin-provider.ts` so Templum commands and dashboards can discover hook-contributed metrics, keeping the skin contract deterministic.
- [ ] Document operational procedures in `Haruspex/docs/current/architecture-spec.md` and `Haruspex/dev/haruspex-patterns.md` covering how to package, register, and monitor new engines once exposed via the API.

## Definition of Done
- `npm run test:unit` passes with new registry and API tests, and hook-specific suites achieve ≥80% coverage.
- Manual validation: start the backend (`node dist/src/backend-main.js`), register the sample engine via config, and confirm `GET /api/v1/analysis-engines` plus `POST /api/v1/analyze` show hook output while diagnostics list the engine as healthy.
- Documentation updated: architecture spec, `Haruspex/dev/haruspex-patterns.md`, and `docs/current/progress.md` reflect the shipping hook system; changelog or release notes capture activation steps.
- Operational notes distributed to Templum integration docs so downstream consumers know how to enable third-party engines.

## References
- Progress entry: `Haruspex/docs/current/progress.md` (Operations & Compliance section).
- Architecture spec: `Haruspex/docs/current/architecture-spec.md` §§2, 5, 6.
- Analysis pipeline: `Haruspex/src/engines/analysis-engine.ts`, `Haruspex/src/cache/cache-manager.ts`.
- Service orchestration: `Haruspex/src/haruspex-backend-service.ts`.
- API surface: `Haruspex/src/api/gateway/api-gateway.ts`, `Haruspex/src/api/types/api-contracts.ts`.
