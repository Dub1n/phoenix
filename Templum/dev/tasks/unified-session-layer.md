# Task: Unified session/context layer across adapters

## Requirement Summary

- Status: [ ]
- Requirement text: "Unified session/context layer across adapters (see dev/tasks/unified-session-layer.md)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [x] Capture the current gap with failing integration coverage: write new session orchestration specs in `tests/interfaces/interface-adapter-integration.test.ts` (and, if cleaner, `tests/session/unified-session-manager.integration.test.ts`) that prove a single `TemplumUniversalSessionManager` instance keeps CLI ↔ VSCode session state (active menu, navigation stack, preferences) in sync and surfaces disconnect errors.
- [x] Extend `tests/templum/pcl-integration.test.ts` to assert `SessionContextFoundation` lifecycle hooks (`SessionContextFoundation.initialize`, `SessionContextFoundation.closeSession`) survive interface switching and enforce the <150 ms sync SLA, giving a regression harness before touching the implementation.
- [x] Refactor `src/core/templum-core.ts` (`TemplumCore.initialize`, `TemplumCore.loadSkin`) and `src/core/adapter-registry.ts` (`TemplumAdapterRegistry.initialize`, `TemplumAdapterRegistry.buildInterfaceAdapters`) to construct one `TemplumUniversalSessionManager` and inject it into CLI and VSCode adapters, replacing bespoke session state held in `src/interfaces/cli-adapter-abstracted.ts` (`CLIInterfaceAdapter`) and `src/interfaces/vscode-adapter.ts` (`VSCodeInterfaceAdapter`).
- [ ] **Interaction manager cleanup (Stage 3):**
  - Audit `src/interfaces/universal-interaction-manager.ts` for any state derived from local `inputHistory`/mode caches and re-route those updates through `SessionContextFoundation` using the new `SessionStateUpdate` contract.
  - Remove bespoke persistence helpers once they’re bridged; rely on `sessionManager.updateSessionState` and `sessionManager.syncInterfaces` for cross-interface propagation.
  - Update or extend unit coverage (e.g., add focused tests under `tests/interfaces` or new interaction manager specs) to confirm command history and mode switches flow through the shared manager.
- [ ] **CLI adapter legacy state removal (Stage 4):**
  - Replace any residual references to `this.navigationHistory`, `this.interactionMode`, or other local caches in `src/interfaces/cli-adapter-abstracted.ts` with calls into `CLISessionBridge` (or helpers backed by the universal manager).
  - Ensure menu rendering, prompt updates, and shortcut handling read/write via the bridge so the CLI doesn’t diverge from other interfaces.
  - Add adapter-level tests (extend existing CLI scenarios in `tests/interfaces/interface-adapter-integration.test.ts` or craft targeted unit specs) to prove state changes round-trip through the shared manager and survive dispose/teardown.
- [ ] **Test harness stability & teardown (Stage 5):**
  - Identify suites that still hang (notably full adapter bundles) and track open handles using `npm run test:ci -- --detectOpenHandles` or the timeout wrapper logs.
  - Ensure adapters/universal manager clean up listeners in `dispose`/`stopSession` paths (CLI bridge, VSCode adapter, interaction manager). Wire `SessionContextFoundation.closeSession` as part of teardown where appropriate.
  - Update integration specs to assert teardown behavior (e.g., expect no listeners after adapter disposal) and document the commands to reproduce the clean run.
- [ ] ~~Augment `src/state/state-sync-foundation.ts` and related observability hooks so session updates emit metrics/events consumed by adapters, then wire those signals into the new tests.~~ *(post-MVP)*
- [ ] Document the dependency changes and session flow in `docs/current/architecture-spec.md` (Universal Interface Core section) and record the validation outcome back in `docs/current/progress.md` when complete.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests to run: `npm test`, `npm run test:coverage` (ensure new session specs meet ≥80 % coverage), targeted watch runs for the new files.
- Validation/commands: `npm run lint`, `npm run check:types`, and `npm run phase6-validation` if session wiring touches validation flows.
- Documentation to update: `docs/current/progress.md` status/notes, `docs/current/architecture-spec.md` Section 1 & 3 session discussions, changelog or release notes tracking interface coordination.

## References

- Progress entry: `docs/current/progress.md:9`
- Architecture spec: `docs/current/architecture-spec.md` → Sections 1 and 3.
- Code: `src/session/session-context-foundation.ts`, `src/session/templum-universal-session-manager.ts`, `src/core/templum-core.ts`, `src/core/adapter-registry.ts`, `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/vscode-adapter.ts`, `src/interfaces/universal-interaction-manager.ts`, `src/state/state-sync-foundation.ts`
- Tests: `tests/interfaces/interface-adapter-integration.test.ts`, `tests/templum/pcl-integration.test.ts`

## Current Assessment (2025-10-06)

- Implementation: Core injection now delivers a single `TemplumUniversalSessionManager`; CLI uses `CLISessionBridge`, VSCode initializes against the shared manager, and the interaction manager persists command/menu state. Remaining work is trimming legacy caches and finishing universal cleanup hooks.
- Tests: `node scripts/run-with-timeout.mjs --timeout 180000 -- npm test -- --runTestsByPath tests/session/unified-session-manager.integration.test.ts` and the focused adapter scenario both pass, proving cross-interface sync; longer adapter suites still leave open handles due to unrelated legacy listeners.
- Coverage: Broader coverage command is still blocked by the long-standing `babel-plugin-istanbul` issue (see `test-architecture-governance` task) but the new integration specs run under the timeout wrapper.
- Gaps: remove the last CLI-only session state paths and finish routing interaction-manager persistence through the foundation so Jest suites stop leaving handles.
