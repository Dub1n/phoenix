# Task: Skin Definition Emission for Dashboards/Code Navigation

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Skin definition emission for dashboards/code navigation (see dev/tasks/backend-skin-generator.md)."

## Prerequisites
- None.

## Implementation Steps
### Unblocked Actions
- [ ] Replace the static payload inside `Haruspex/src/core/haruspex-core-engine.ts:1412` with a call to `SkinProvider.generateSkinDefinition` so the response is built from backend runtime config (ports from `Haruspex/src/haruspex-backend-service.ts`, detected capabilities, templum version), and log telemetry when runtime data is missing.
- [ ] Wire `Haruspex/src/haruspex-backend-service.ts:145` to configure `SkinProvider` using `TemplumConfigurationManager` values (service version, enabled features, API endpoints) and pass them to the core engine so `backendConfig`/`metadata.compatibleInterfaces` reflect real deployment modes instead of hard-coded defaults.
- [ ] Extend `Haruspex/src/api/gateway/api-gateway.ts:368` routing to return the generated skin with immutable caching headers/ETag and to surface contract errors as `HaruspexAPIError` when validation fails; ensure `/api/v1/skin` and `/getSkinDefinition` are backed by the same validator.
- [ ] Add contract tests: create `Haruspex/src/api/__tests__/skin-endpoint.test.ts` that boots the gateway with a mocked core engine and asserts the JSON matches the `UniversalSkinDefinition` contract from `Templum/docs/current/1.2-Backend-Integration-Guide.md`; update `Haruspex/src/__tests__/backend-service.test.ts` to check that ports, protocols, and capability lists are pulled from runtime config.
- [ ] Update `Haruspex/docs/current/architecture-spec.md` section 2 to describe the skin generation flow (Core Engine → SkinProvider → API Gateway) and section 6 to include the new endpoint validation procedure; note in `Haruspex/docs/current/progress.md` when the task closes.

### Blocked Actions (pending [ ] Navigation workflows encoded in skin payloads.)
- [ ] Expand `Haruspex/src/skin/skin-provider.ts` workflow definitions to mirror the finalized navigation flows once the navigation requirement lands, and add coverage ensuring workflow metadata matches the published navigation schema.

## Definition of Done
- `npm run build` and `npm run test:unit` both succeed; new `skin-endpoint` test suite passes locally.
- `npm run start:backend` followed by `curl http://localhost:<httpPort>/getSkinDefinition` returns the generated skin with no VSCode dependencies and consistent metadata.
- Documentation updated: `docs/current/architecture-spec.md` and `docs/current/progress.md` reflect the shipped endpoint and close-out notes.

## References
- Progress entry: `Haruspex/docs/current/progress.md:21`
- Architecture spec: `Haruspex/docs/current/architecture-spec.md:14`, `Haruspex/docs/current/architecture-spec.md:60`
- Backend gateway: `Haruspex/src/api/gateway/api-gateway.ts`
- Skin generator: `Haruspex/src/skin/skin-provider.ts`
- Core engine delegation: `Haruspex/src/core/haruspex-core-engine.ts`
- Templum contract: `Templum/docs/current/1.2-Backend-Integration-Guide.md`
