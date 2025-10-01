# Task: Diagram generation (Mermaid/graph data) driven by backend results

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Diagram generation (Mermaid/graph data) driven by backend results."

## Prerequisites
- [?] Codebase ingestion pipeline (static analysis modules partially migrated from extension; verify pure backend operation). — Diagrams must consume the same ingestion flow validated for backend use; otherwise they regress to extension-bound data.
- [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies. — The Mermaid payload should reuse the backend module graph/adjacency matrix once that requirement lands to avoid duplicating heuristics.

## Implementation Steps
### Unblocked Actions
- [ ] Add a backend-focused adapter (e.g. `Haruspex/src/components/diagram-data-adapter.ts`) with unit coverage in `Haruspex/src/components/__tests__/diagram-data-adapter.test.ts` that maps `AnalysisResult.codeStructure`, `architecture`, and `patterns` into the `ArchitectureData` shape consumed by `HaruspexMermaidGenerator`.
- [ ] Extend `Haruspex/src/core/haruspex-core-engine.ts` to retain the latest `AnalysisResult` when running in backend/test contexts and have `getMermaidDiagrams()` reuse the adapter whenever backend results exist, falling back to `HaruspexStubParser.loadArchitecture()` only when no session data is cached.
- [ ] Update `Haruspex/src/haruspex-backend-service.ts` so `analyzeCode` stores per-session analysis snapshots for diagram reuse, expose a `getMermaidDiagrams` service method, and ensure cache/telemetry handling does not re-ingest the workspace when diagrams are requested.
- [ ] Wire a `GET /api/v1/diagrams` route (plus the matching `/executeCommand` hook) through `Haruspex/src/api/gateway/api-gateway.ts` and `Haruspex/src/api/gateway/routing/request-router.ts`, including validator/formatter rules that mirror `/api/v1/analyze`, to return the Mermaid payload built from cached backend analysis.
- [ ] Expand `Haruspex/src/core/__tests__/haruspex-core-engine.test.ts` and `Haruspex/src/__tests__/backend-service.test.ts` to cover the "analyze → getMermaidDiagrams" flow, asserting diagrams reflect backend-provided dependencies rather than stubbed filesystem walks.

### Blocked Actions (pending [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies.)
- [ ] Replace the adapter’s fallback heuristics with the module graph and dependency matrix emitted by `Haruspex/src/core/haruspex-structural-analyzer.ts`, update the adapter tests to assert normalized node/edge coverage, and re-baseline any backend integration snapshots once the structural API is available.

### Blocked Actions (pending [?] Codebase ingestion pipeline (static analysis modules partially migrated from extension; verify pure backend operation).)
- [ ] Promote the new diagram route into the backend validation suite (e.g. extend `Haruspex/test/validate-system.js` or add `Haruspex/src/integration/__tests__/backend-diagram-flow.test.ts`) so it exercises a temp workspace analysed via `createBackendDependencies(createDefaultBackendConfig(tmpDir))` once ingestion verification passes, and document the runbook in `docs/current/architecture-spec.md`.

## Definition of Done
- Tests to run: `npm test -- src/components/__tests__/diagram-data-adapter.test.ts`, `npm test -- src/core/__tests__/haruspex-core-engine.test.ts`, and `npm test -- src/__tests__/backend-service.test.ts`.
- Validation/commands: `npm run start:backend` followed by `curl http://localhost:3001/api/v1/diagrams` returns diagrams sourced from the latest analysis session, and the `/executeCommand` path surfaces the same payload without re-triggering analysis jobs.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md` (diagram pipeline + endpoint details), and any debugging playbooks under `dev/03-debugging/` that describe backend inspection flows.

## References
- Progress entry: `Haruspex/docs/current/progress.md:14`
- Architecture spec: `Haruspex/docs/current/architecture-spec.md:21`
- Core engine: `Haruspex/src/core/haruspex-core-engine.ts`
- Backend orchestration: `Haruspex/src/haruspex-backend-service.ts`
- API gateway: `Haruspex/src/api/gateway/api-gateway.ts`
- Mermaid generator: `Haruspex/src/components/haruspex-mermaid-generator.ts`
