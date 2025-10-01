# Task: Structural representations without VSCode dependencies

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Structural representations (module graphs, dependency matrices) generated without VSCode dependencies."

## Prerequisites
- None.

## Implementation Steps
### Unblocked Actions
- [ ] Capture the desired backend-only behaviour with failing tests first in `Haruspex/src/core/__tests__/haruspex-structure-representation.test.ts`, creating a temp workspace fixture under `Haruspex/test/fixtures/structure-sample/` and instantiating `HaruspexCoreEngine` via `createBackendDependencies(createDefaultBackendConfig(tmpDir))`; assert the new API returns module graph nodes plus a dependency matrix without relying on any `vscode` mocks.
- [ ] Implement a dedicated structural analyser (e.g. `Haruspex/src/core/haruspex-structural-analyzer.ts`) that consumes parsed stubs from `Haruspex/src/components/haruspex-stub-parser.ts`, resolves local and package imports against the workspace root, and produces both a normalised module graph and an adjacency/dependency matrix; replace the current heuristic logic in `buildDependencyGraph` with calls into this analyser.
- [ ] Extend `Haruspex/src/core/haruspex-core-engine.ts` to own the new analyser, expose a `getStructuralRepresentation()` method, and update `Haruspex/src/core/__tests__/haruspex-core-engine.test.ts` to verify the method in a backend runtime (expect `runtimeContext` to be `"backend"` and no `vscode` imports in the execution path).
- [ ] Add API contract types for structural data to `Haruspex/src/api/types/api-contracts.ts`, surface a backend service method in `Haruspex/src/haruspex-backend-service.ts`, and register an HTTP route via `Haruspex/src/api/gateway/api-gateway.ts` and `Haruspex/src/api/gateway/routing/request-router.ts` that returns the module graph and dependency matrix with existing rate-limit/response formatting policies.
- [ ] Update CLI and monitoring flows (`Haruspex/src/debugging/haruspex-cli.ts`, `Haruspex/src/debugging/interactive-controller.ts`, and related `cli-bin.ts`) to call the new backend endpoint, emit exportable JSON artifacts under `Haruspex/dev/03-debugging/`, and confirm with `rg 'vscode' src/core src/api src/debugging` that the structural generation path is VSCode-free.

### Blocked Actions (if any)
- None.

## Definition of Done
- Tests: `npm run test:unit` (including the new structural representation spec) and the backend ingestion suite (`npm run test:validate-system`) pass locally.
- Validation: `npm run start:backend` then `curl http://localhost:3002/api/structures?format=json` returns module graph + dependency matrix for a sample repo, and `rg 'vscode' src/core src/api src/debugging` shows no new dependencies.
- Documentation: Update `Haruspex/docs/current/architecture-spec.md` sections 1–3 with the backend structural pipeline, drop the blocker from `Haruspex/dev/tasks/codebase-ingestion-pipeline.md`, and mark the `docs/current/progress.md` requirement complete.

## References
- Progress entry: `Haruspex/docs/current/progress.md:8`
- Architecture spec: `Haruspex/docs/current/architecture-spec.md:10`, `Haruspex/docs/current/architecture-spec.md:31`
- Related task: `Haruspex/dev/tasks/codebase-ingestion-pipeline.md`
- Core engine: `Haruspex/src/core/haruspex-core-engine.ts`
- Stub parser: `Haruspex/src/components/haruspex-stub-parser.ts`
