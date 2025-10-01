# Task: Dual interface sync (CLI/VSCode) validated

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Dual interface sync (CLI/VSCode) validated."

## Prerequisites
- [ ] Skin definition emission for dashboards/code navigation *(see `dev/tasks/backend-skin-generator.md`)*. — Shared skin metadata is required before CLI and VSCode can consume identical navigation primitives.
- [ ] Navigation workflows encoded in skin payloads. — Sync scenarios depend on declarative navigation trees that both clients can render.
- [ ] Analysis launch/approval/export flows mediated by Templum. — Validation must exercise shared job flows across interfaces once Templum orchestration is active.

## Implementation Steps
### Unblocked Actions
- [ ] Add failing coverage in `Haruspex/src/integration/__tests__/dual-interface-sync.test.ts` that spins up a headless `HaruspexCoreEngine`, attaches a stub `HaruspexIPCServer`, and proves `HaruspexCLI` receives identical session context/events (`state_change`, selection updates) emitted by the VSCode-side debug manager.
- [ ] Introduce reusable fixtures under `Haruspex/test/fixtures/dual-interface-sync/` (workspace session snapshots, command payloads, sync drift examples) plus a loader utility consumed by the new test suite.
- [ ] Implement `Haruspex/src/integration/dual-interface-sync-monitor.ts` to subscribe to `HaruspexCoreEngine` session events, normalise payloads (workspace, analysis jobs, diagnostics), and broadcast them to both VSCode (`AgentDebuggingSystem`) and CLI clients via `HaruspexIPCServer`.
- [ ] Extend `Haruspex/src/debugging/ipc-protocol.ts` and `Haruspex/src/debugging/haruspex-cli.ts` so CLI subscribers maintain an in-memory parity snapshot, emit drift warnings when hashes diverge, and expose a `haruspex.sync.status` command for manual inspection.
- [ ] Wire the monitor into `Haruspex/src/extension.ts` activation and `Haruspex/src/debugging/agent-debugging-integration.ts` lifecycle so VSCode dispatches sync events on file changes, job state transitions, and telemetry updates.
- [ ] Document the dual-interface event contract and recovery steps in `Haruspex/docs/current/architecture-spec.md` (Skin-Defined Presentation + Debug Tooling sections) including limits, polling intervals, and failure fallbacks.

### Blocked Actions (pending [ ] Skin definition emission for dashboards/code navigation *(see `dev/tasks/backend-skin-generator.md`)*.)
- [ ] Feed the emitted skin schema through the sync monitor so CLI renders the same dashboards/navigation as VSCode, and capture deterministic snapshots for regression comparison in the test fixtures.

### Blocked Actions (pending [ ] Navigation workflows encoded in skin payloads.)
- [ ] Extend the integration test to validate bidirectional navigation: trigger `haruspex.navigate` commands from CLI, assert VSCode tree reveals the same node, and vice versa.
- [ ] Add `navigationState` propagation in the monitor plus CLI/VSCode UI hooks (e.g., status bar, quick pick) that reflect the shared selection without race conditions.

### Blocked Actions (pending [ ] Analysis launch/approval/export flows mediated by Templum.)
- [ ] Once Templum job orchestration lands, record the shared job lifecycle (launch → approval → export) via the monitor, assert CLI progress bars and VSCode panels stay in lockstep, and add end-to-end coverage under `Haruspex/test/test-cli-connection.js` or a new `Haruspex/test/api/dual-interface-sync.e2e.ts` runner.
- [ ] Update API/command wiring (`Haruspex/src/api/gateway/api-gateway.ts`, Templum command handlers) to propagate job state deltas into the sync stream with 503 fallbacks when orchestration is offline.

## Definition of Done
- Automated tests: `npm test -- Haruspex/src/integration/__tests__/dual-interface-sync.test.ts`, targeted CLI sync suite `npm test -- Haruspex/src/debugging`, and cross-interface smoke `node Haruspex/test/test-cli-connection.js` succeed.
- Validation commands: `npm run build --workspace Haruspex`, execute Validation System backend category once available.
- Documentation updated: `Haruspex/docs/current/architecture-spec.md` and `Haruspex/docs/current/progress.md` reflect validated dual-interface sync behaviour and reference the shared event contract.
- Operational notes added (developer README or Templum integration guide) describing how to run the sync status check and recover from drift.

## References
- Progress entry: `Haruspex/docs/current/progress.md:27`.
- Architecture spec context: `Haruspex/docs/current/architecture-spec.md:19`, `Haruspex/docs/current/architecture-spec.md:25`.
- Core sync touchpoints: `Haruspex/src/debugging/ipc-protocol.ts:1`, `Haruspex/src/debugging/haruspex-cli.ts:1`, `Haruspex/src/debugging/agent-debugging-integration.ts:1`, `Haruspex/src/extension.ts:1`.
