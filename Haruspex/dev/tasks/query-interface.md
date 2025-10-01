# Task: Query interface (filters vs. free-form chat) available

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Query interface (filters vs. free-form chat) available."

## Prerequisites
- [ ] Programmatic analyses (architecture drift, coupling metrics, risk flags) exposed via API. — Query handlers must consume deterministic analysis outputs via the backend API layer.
- [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies. — Filter facets rely on repository graphs that operate in the pure backend context.

## Implementation Steps
### Unblocked Actions
- [ ] Update `Haruspex/docs/current/architecture-spec.md` (Analysis & Visualization section) with the planned query flows, filter categories, natural-language fallback strategy, and endpoint/command contract so implementation has an approved target.

### Blocked Actions (pending [ ] Programmatic analyses (architecture drift, coupling metrics, risk flags) exposed via API.)
- [ ] Add failing coverage in `Haruspex/src/__tests__/backend-service.test.ts` (or a new dedicated spec) that exercises `POST /api/v1/queries` and the Templum command equivalent, using realistic `AnalysisResult` fixtures to describe filter-mode vs. free-form responses.
- [ ] Extend `Haruspex/src/api/types/api-contracts.ts` with explicit query request/response schemas (filter descriptors, free-form payload metadata, pagination, scoring) and update validation helpers to enforce them.
- [ ] Implement `Haruspex/src/core/haruspex-query-service.ts` to orchestrate queries over cached `AnalysisResult` data, evaluate structured filters, and translate free-form chat text into deterministic filter sets (no LLM reliance).
- [ ] Inject the query service into `Haruspex/src/haruspex-backend-service.ts` initialization/shutdown flow so API calls can delegate without reintroducing VSCode dependencies.
- [ ] Register the query route and router policy in `Haruspex/src/api/gateway/api-gateway.ts` (add `/api/v1/queries`, RequestRouter entry, handler wiring) and map a new Templum command in `handleTemplumCommand`.
- [ ] Create focused unit tests in `Haruspex/src/core/__tests__/haruspex-query-service.test.ts` that cover filter matching, free-form fallback, cache miss handling, and pagination to sustain ≥80 % coverage for the new module.

### Blocked Actions (pending [ ] Structural representations (module graphs, dependency matrices) generated without VSCode dependencies.)
- [ ] Integrate module/dependency graph data (e.g., via `Haruspex/src/components/haruspex-mermaid-generator.ts` or a dedicated provider) into the query service so structural filters work, and add assertions proving the implementation does not depend on VSCode APIs.

## Definition of Done
- `npm run test:unit` succeeds with new query interface tests.
- Manual smoke test: start backend (`node dist/src/backend-main.js`) and `curl -X POST http://localhost:<port>/api/v1/queries` with representative filter and free-form payloads; capture responses for review.
- Documentation updated: `Haruspex/docs/current/architecture-spec.md` reflects the shipping query interface; `Haruspex/docs/current/progress.md` entry is revised with outcome and link.
- Operational notes added wherever the new endpoint/command needs mention (Templum integration guides, developer README) so downstream consumers can adopt it.

## References
- Progress entry: `Haruspex/docs/current/progress.md` (Analysis & Visualization section).
- Architecture spec: `Haruspex/docs/current/architecture-spec.md` §§3 & 6.
- Core orchestration: `Haruspex/src/haruspex-backend-service.ts`.
- API gateway: `Haruspex/src/api/gateway/api-gateway.ts`.
- Data sources: `Haruspex/src/engines/analysis-engine.ts`, `Haruspex/src/cache/cache-manager.ts`, `Haruspex/src/components/haruspex-mermaid-generator.ts`.
