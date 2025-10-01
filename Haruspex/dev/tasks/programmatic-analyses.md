# Task: Expose Programmatic Analyses API

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Programmatic analyses (architecture drift, coupling metrics, risk flags) exposed via API."

## Prerequisites
- [ ] [?] Codebase ingestion pipeline (static analysis modules partially migrated from extension; verify pure backend operation). — API delivery depends on the headless ingestion flow producing analysis snapshots without VSCode adapters.
- [ ] [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies. — Architecture drift and coupling calculations require verified module graphs and dependency matrices.

## Implementation Steps
### Unblocked Actions
- [ ] Add a `ProgrammaticAnalysisService` (and supporting domain types) under `Haruspex/src/analysis/` that accepts `ArchitectureData` snapshots, computes drift deltas, coupling statistics (afferent/efferent counts, instability ratios, cycle detection), and derives risk flags without randomised scoring.
- [ ] Create targeted Jest coverage in `Haruspex/src/analysis/__tests__/programmatic-analysis-service.test.ts` exercising added/removed module scenarios, coupling threshold breaches, and risk flag combinations.
- [ ] Introduce reusable repository fixtures under `Haruspex/test/fixtures/programmatic-analyses/` plus a loader utility to feed the service with real TypeScript samples for regression checks.

### Blocked Actions (pending [?] Codebase ingestion pipeline)
- [ ] Wire ingestion outputs in `Haruspex/src/core/backend-dependencies.ts` and `Haruspex/src/core/haruspex-core-engine.ts` to emit normalised architecture snapshots for the new service, persisting baselines via `CacheManager` once headless ingestion is verified.

### Blocked Actions (pending [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies)
- [ ] Extend `Haruspex/src/core/haruspex-core-engine.ts` and `Haruspex/src/haruspex-backend-service.ts` with `runProgrammaticAnalyses()`/`getProgrammaticAnalyses()` methods that surface the computed drift, coupling metrics, and risk flags.
- [ ] Update API contracts and validation (`Haruspex/src/api/types/api-contracts.ts`, `Haruspex/src/api/gateway/validation/request-validator.ts`) and register HTTP/WebSocket routes in `Haruspex/src/api/gateway/api-gateway.ts` to deliver the analyses payload with proper 503 handling when snapshots are unavailable.
- [ ] Add end-to-end coverage hitting the new endpoint (`Haruspex/test/test-http-integration.js` or a dedicated `Haruspex/test/api/programmatic-analyses.test.ts`), and document the contract in `Haruspex/docs/current/architecture-spec.md`.

## Definition of Done
- Tests to run: `npm test -- Haruspex/src/analysis`, full backend suite `npm test -- Haruspex`, HTTP integration `node Haruspex/test/test-http-integration.js`.
- Validation/commands: `npm run build --workspace Haruspex`, execute Validation System backend category once available.
- Documentation to update: `Haruspex/docs/current/progress.md`, `Haruspex/docs/current/architecture-spec.md`, project changelog if maintained.

## References
- Progress entry: `Haruspex/docs/current/progress.md:13`.
- Architecture spec: `Haruspex/docs/current/architecture-spec.md:21`, `Haruspex/docs/current/architecture-spec.md:53`.
- Related task file: `Haruspex/dev/tasks/backend-skin-generator.md`.
