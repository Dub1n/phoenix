# Task: CLI generator uses skin metadata

## Requirement Summary

- Status: `[~]`
- Requirement text: "CLI generator uses skin metadata (partially wired, needs full migration)."

## Prerequisites

- [x] Skin payload consumption powering full UI without hardcoding (see dev/tasks/skin-payload-consumption.md) — ensures the orchestrator delivers complete skin descriptors to CLI consumers.

## Implementation Steps

### Unblocked Actions

- [x] Add regression-first coverage: introduce `tests/cli/cli-generator.integration.test.ts` (or extend `tests/interfaces/interface-adapter-integration.test.ts`) to assert `CLIInterfaceAdapter.applySkin` renders menus/commands sourced from `UniversalSkinDefinition.metadata` fields (commands, menu structure, theme) without referencing legacy scaffolds. *(Implemented metadata-specific integration test and exercised the adapter shortcut map.)*
- [x] Expand `tests/e2e/e2e-complete-workflows.test.ts` with CLI scenarios that start from a skin descriptor and verify generated prompts, shortcuts, and navigation align with metadata (`metadata.compatibleInterfaces`, `menus`, `commands`). *(Added CLI metadata scenario covering shortcut hydration.)*
- [x] Lift the current partial wiring in `src/cli-entry.ts` (`bootstrapCLI`) so service discovery pulls skin metadata, hands it to a dedicated generator module, and hydrates CLI sessions via dependency injection rather than inline mappings. *(CLI entry point now injects the generator when instantiating the adapter.)*
- [x] Extract a reusable generator in `src/interfaces/cli-generator.ts` (create `buildCLIMenuModel`, `buildCLICommandBindings`) that transforms `UniversalSkinDefinition` into the CLI window/menu model (`UniversalMenuRegistry`, `ContentLayoutSystem`), replacing `CLIInterfaceAdapter.generateFallbackCLIOutput` paths with metadata-driven rendering.
- [x] Refactor `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/adaptive-cli-integration.ts`, and `src/interfaces/cli-display-consistency-engine.ts` to rely on the new generator output (menu tree, navigation stack, command bindings) and strip out hardcoded defaults. *(Adapters now hydrate keyboard shortcuts, menu registry, and navigation config from the generated model.)*
- [x] Ensure orchestrator plumbing (`src/core/templum-core.ts` `TemplumCore.loadSkin`, `src/core/adapter-registry.ts` `TemplumAdapterRegistry.buildCLIAdapter`) supplies the generator with validated skins and handles error surfacing when metadata is incomplete, plugging into observability hooks for telemetry.
- [x] Update documentation (`docs/current/architecture-spec.md` Interface Delivery + Skin-Driven Rendering sections) describing the metadata-driven CLI pipeline and log the migration in `docs/current/progress.md` once complete.
- [~] Finalize fallback removal and legacy template deletion once the metadata-to-CLI pipeline is proven stable in tests. *(Legacy compatibility scaffolds in `RemoteTemplumAdapter`/IPC paths still exist; schedule clean-up after broader validation runs.)*
- [~] Wire CLI generator output into `TemplumUniversalSessionManager` to keep CLI state in sync with other adapters using shared skin-derived descriptors. *(Menu registry now loads generated skins, but session manager/state-sync alignment remains to do.)*

## Definition of Done

- Tests to run: `npm test`, `npm run test:coverage`, focused Jest runs for new CLI generator suites.
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-validation` (verify generator integration doesn’t break validation harnesses).
- Documentation to update: `docs/current/progress.md` status/notes, `docs/current/architecture-spec.md` Interface Delivery sections, change-log or release notes covering the CLI generator migration.

## References

- Progress entry: `docs/current/progress.md:26`
- Architecture spec: `docs/current/architecture-spec.md` → Sections 1 (Current State Snapshot) & 3 (Ideal Requirements vs. Status).
- Code: `src/cli-entry.ts`, `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/adaptive-cli-integration.ts`, `src/interfaces/cli-display-consistency-engine.ts`, `src/menus/universal-menu-registry.ts`, `src/core/templum-core.ts`, `src/core/adapter-registry.ts`.
- Tests: `tests/interfaces/interface-adapter-integration.test.ts`, `tests/e2e/e2e-complete-workflows.test.ts`.

## Current Assessment (2025-10-16)

- Implementation: Metadata-driven CLI generator now feeds `CLIInterfaceAdapter`, `AdaptiveCLIIntegration`, and the display consistency engine with menu graphs, command bindings, and shortcuts; `TemplumCore`/adapter registry invoke the generator during skin loads and expose observability warnings on malformed payloads. CLI bootstrap wires the generator through DI, and the CLI adapter hydrates the universal menu registry instead of emitting fallback scaffolds.
- Tests: New coverage in `tests/cli/cli-generator.integration.test.ts` and the updated CLI scenario inside `tests/e2e/e2e-complete-workflows.test.ts` confirm shortcut hydration and metadata alignment. Follow-up full suite (`npm run test` / `npm run test:ci`) still pending to capture regressions under the broader harness.
- Required work: Remove IPC-era fallback templates once real-backend validation is rerun, and extend `TemplumUniversalSessionManager` wiring so session snapshots carry generator-derived menu context across interface boundaries.

## Reassessment (2026-07-16)

- The generator and injection seams are reusable and remain implemented.
- Completion is reduced to partial because the generated model does not own the live interactive menu; `InteractiveMenuRenderer` still constructs hardcoded defaults.
- The character-grid view-model stage must either adopt the generator's pure transformations or replace them with a narrower renderer-neutral model. It must not preserve a second navigation graph.
- Renderer integration work is owned by `cli-character-grid-renderer.md`; generator-specific cleanup remains here.

### Follow-up Actions

- Remove the IPC discovery/`RemoteTemplumAdapter` fallback templates after the Phase 6 real-backend window runs clean. **Blocked** by `dev/tasks/phase6-validation-signal.md` (awaiting partner service availability and the gated validation battery).
- Extend `TemplumUniversalSessionManager` / `SessionContextFoundation` wiring so generator-derived menu context and shortcut bindings propagate across interfaces. **Actionable now** (no additional external dependencies); capture implementation in a fresh task doc before starting.
