# Task: Codebase Ingestion Pipeline Pure Backend Verification

## Requirement Summary
- Status: `[?]`
- Requirement text: "Codebase ingestion pipeline (static analysis modules partially migrated from extension; verify pure backend operation)."

## Prerequisites
- [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies. — backend ingestion depends on VSCode-free structural data before final validation can pass.

## Implementation Steps
### Unblocked Actions
- [ ] Harden backend startup so `Haruspex/src/haruspex-backend-service.ts:163` obtains dependencies via `createBackendDependencies` and asserts the returned `runtimeContext` is `"backend"`, adding telemetry/error handling in `Haruspex/src/core/haruspex-core-engine.ts` to fail fast if VSCode adapters are still selected when `process.env.HARUSPEX_MODE === 'backend'`.
- [ ] Add a backend ingestion integration spec (e.g. `Haruspex/src/integration/__tests__/backend-ingestion.test.ts`) that creates a temp workspace with sample `.ts`/`.md` files, builds backend dependencies via `createBackendDependencies(createDefaultBackendConfig(tmpDir))`, initializes `HaruspexCoreEngine`, and verifies `getDocumentationTree`, `getTruthMatrix`, and `getMermaidDiagrams` succeed without relying on `vscode` mocks.
- [ ] Extend filesystem/telemetry plumbing so `Haruspex/src/components/haruspex-stub-parser.ts` and `Haruspex/src/core/backend-dependencies.ts` emit deterministic backend telemetry for ingestion errors (propagate through `BackendTelemetryCollector`) and sanitize path data before recording metrics.
- [ ] Update `Haruspex/docs/current/architecture-spec.md` sections 1–2 to document the backend-only ingestion flow and remove lingering references to VSCode providers once verification passes, including noting the new integration test in the validation section.

### Blocked Actions (pending [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies.)
- [ ] Replace the stopgap dependency graph generation in `Haruspex/src/components/haruspex-stub-parser.ts`/`Haruspex/src/components/haruspex-mermaid-generator.ts` with the finalized backend structural representation APIs and extend the new integration test to assert module/dependency matrices once that requirement is complete.

## Definition of Done
- `npm run build` completes without regressions.
- `npm run test:unit` plus the new backend ingestion integration test pass locally.
- `npm run start:backend` against a sample repo logs backend ingestion metrics with no VSCode adapter usage.
- `docs/current/progress.md` entry references this task and architecture spec is updated accordingly.

## References
- Progress entry: `Haruspex/docs/current/progress.md:7`
- Architecture spec: `Haruspex/docs/current/architecture-spec.md:16`, `Haruspex/docs/current/architecture-spec.md:32`
- Core engine: `Haruspex/src/core/haruspex-core-engine.ts`
- Backend wiring: `Haruspex/src/haruspex-backend-service.ts`
- Dependency factory: `Haruspex/src/core/backend-dependencies.ts`
