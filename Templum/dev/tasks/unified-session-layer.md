# Task: Unified session/context layer across adapters

## Requirement Summary

- Status: [ ]
- Requirement text: "Unified session/context layer across adapters (see dev/tasks/unified-session-layer.md)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Capture the current gap with failing integration coverage: write new session orchestration specs in `tests/interfaces/interface-adapter-integration.test.ts` (and, if cleaner, `tests/session/unified-session-manager.integration.test.ts`) that prove a single `TemplumUniversalSessionManager` instance keeps CLI ↔ VSCode session state (active menu, navigation stack, preferences) in sync and surfaces disconnect errors.
- [ ] Extend `tests/templum/pcl-integration.test.ts` to assert `SessionContextFoundation` lifecycle hooks (`SessionContextFoundation.initialize`, `SessionContextFoundation.closeSession`) survive interface switching and enforce the <150 ms sync SLA, giving a regression harness before touching the implementation.
- [ ] Refactor `src/core/templum-core.ts` (`TemplumCore.initialize`, `TemplumCore.loadSkin`) and `src/core/adapter-registry.ts` (`TemplumAdapterRegistry.initialize`, `TemplumAdapterRegistry.buildInterfaceAdapters`) to construct one `TemplumUniversalSessionManager` and inject it into CLI and VSCode adapters, replacing bespoke session state held in `src/interfaces/cli-adapter-abstracted.ts` (`CLIInterfaceAdapter`) and `src/interfaces/vscode-adapter.ts` (`VSCodeInterfaceAdapter`).
- [ ] Update adapter implementations and the `UniversalInteractionManager` (`src/interfaces/universal-interaction-manager.ts`) to persist everything through the shared manager/foundation, deleting redundant `CLISessionManager` logic and ensuring state mutations call into `SessionContextFoundation`/state-sync helpers rather than local caches.
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

## Current Assessment (2025-10-05)

- Implementation: `TemplumUniversalSessionManager` is implemented but never injected; adapters still instantiate their own managers (`CLISessionManager` in `src/interfaces/cli-adapter-abstracted.ts`), so sessions diverge per interface.
- Tests: `scripts/run-with-timeout.mjs --timeout 180000 -- npm test -- tests/interfaces/interface-adapter-integration.test.ts` passes but logs repeated "adapter not ready" messages and hangs until forcibly terminated, reinforcing that session disposal and shared context wiring are incomplete.
- Coverage: `node scripts/run-with-timeout.mjs -- npm run test:coverage -- --passWithNoTests` fails with the `babel-plugin-istanbul` TypeError, leaving no coverage trend for the session work.
- Gaps: inject the shared manager through `TemplumCore`/`TemplumAdapterRegistry`, add cross-interface session sync tests, and ensure listeners are cleaned up so Jest exits cleanly.
