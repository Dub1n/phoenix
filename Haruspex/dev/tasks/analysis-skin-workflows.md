# Task: Analysis launch/approval/export flows mediated by Templum

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Analysis launch/approval/export flows mediated by Templum."

## Prerequisites
- [ ] Skin definition emission for dashboards/code navigation *(see `dev/tasks/backend-skin-generator.md`)* — Templum must receive the updated skin map before workflow actions surface in the UI.
- [ ] Programmatic analyses (architecture drift, coupling metrics, risk flags) exposed via API. — Workflow steps rely on these endpoints to execute real analyses instead of stubs.

## Implementation Steps
### Unblocked Actions
- [ ] Capture failing Jest coverage in `src/api/__tests__/templum-workflows.test.ts` that exercises the full lifecycle: `POST /templum/workflows/analysis` (launch), `POST /templum/workflows/analysis/:id/approve`, and `POST /templum/workflows/analysis/:id/export` returning deterministic state transitions and audit payloads.
- [ ] Extend `SkinProvider.generateWorkflows` and the related tests (add `src/skin/__tests__/skin-provider.workflows.test.ts`) so the emitted `SkinWorkflows` graph encodes launch → approval → export stages with Templum command IDs and capability flags.
- [ ] Implement an `AnalysisWorkflowService` in `src/workflows/analysis-workflow-service.ts` that coordinates session state, approval gating, export preparation, and telemetry/audit hooks; inject it through `HaruspexBackendService` constructor wiring.
- [ ] Update `HaruspexBackendService` (`src/haruspex-backend-service.ts`) to expose `requestAnalysisWorkflow`, `approveAnalysisWorkflow`, and `exportAnalysisWorkflow` methods that delegate to the new service, enforce determinism, and publish events for CLI/WebSocket consumers.
- [ ] Register new routes and command mappings inside `src/api/gateway/api-gateway.ts` and `src/api/gateway/routing/request-router.ts` (including rate-limit profiles) so Templum commands `haruspex.workflow.launch`, `haruspex.workflow.approve`, and `haruspex.workflow.export` call the service methods.
- [ ] Add CLI affordances in `src/debugging/haruspex-cli.ts` (e.g., `haruspex workflows analysis launch|approve|export`) with automated tests under `src/debugging/__tests__/haruspex-cli-workflows.test.ts` to let developers exercise the flow without Templum running.
- [ ] Document the orchestration contract (state machine, approval rules, export formats) in `docs/current/architecture-spec.md` Section 3 (requirements table) and Section 5 (risks) once the tests pass.

### Blocked Actions (pending [ ] Programmatic analyses (architecture drift, coupling metrics, risk flags) exposed via API.)
- [ ] Replace interim analysis payloads with real architecture drift/coupling metrics in the workflow responses and add regression tests covering those dataset fields.

### Blocked Actions (pending [ ] Skin definition emission for dashboards/code navigation *(see `dev/tasks/backend-skin-generator.md`)*.)
- [ ] Validate end-to-end mediation by loading the generated skin through Templum (CLI + VSCode) and updating `validate-skin.json` to include the new workflow capabilities once the skin endpoint is live.

## Definition of Done
- Tests to run: `npm run test:unit`, focused suites `jest src/api/__tests__/templum-workflows.test.ts`, `jest src/skin/__tests__/skin-provider.workflows.test.ts`, CLI workflow smoke via `npm run debug:cli -- workflows analysis launch --dry-run`.
- Validation/commands: Hit `POST /templum/workflows/analysis` + approval + export via `curl` or `scripts/shimdex/templum-workflow.sh`, verify JSON schema, and ensure Templum CLI renders the workflow steps without manual wiring.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, new audit notes under `dev/audit/workflows/` describing approval/export logs.

## References
- Progress entry: `docs/current/progress.md:26`.
- Architecture spec: `docs/current/architecture-spec.md:32`, `docs/current/architecture-spec.md:55`.
- Integration guide: `Templum/docs/current/1.2-Backend-Integration-Guide.md:1`.
