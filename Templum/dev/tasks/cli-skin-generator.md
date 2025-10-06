# Task: CLI generator uses skin metadata

## Requirement Summary

- Status: [~]
- Requirement text: "CLI generator uses skin metadata (partially wired, needs full migration)."

## Prerequisites

- [ ] Skin payload consumption powering full UI without hardcoding (see dev/tasks/skin-payload-consumption.md) — ensures the orchestrator delivers complete skin descriptors to CLI consumers.

## Implementation Steps

### Unblocked Actions

- [ ] Add regression-first coverage: introduce `tests/cli/cli-generator.integration.test.ts` (or extend `tests/interfaces/interface-adapter-integration.test.ts`) to assert `CLIInterfaceAdapter.applySkin` renders menus/commands sourced from `UniversalSkinDefinition.metadata` fields (commands, menu structure, theme) without referencing legacy scaffolds.
- [ ] Expand `tests/e2e/e2e-complete-workflows.test.ts` with CLI scenarios that start from a skin descriptor and verify generated prompts, shortcuts, and navigation align with metadata (`metadata.compatibleInterfaces`, `menus`, `commands`).
- [ ] Lift the current partial wiring in `src/cli-entry.ts` (`bootstrapCLI`) so service discovery pulls skin metadata, hands it to a dedicated generator module, and hydrates CLI sessions via dependency injection rather than inline mappings.
- [ ] Extract a reusable generator in `src/interfaces/cli-generator.ts` (create `buildCLIMenuModel`, `buildCLICommandBindings`) that transforms `UniversalSkinDefinition` into the CLI window/menu model (`UniversalMenuRegistry`, `ContentLayoutSystem`), replacing `CLIInterfaceAdapter.generateFallbackCLIOutput` paths with metadata-driven rendering.
- [ ] Refactor `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/adaptive-cli-integration.ts`, and `src/interfaces/cli-display-consistency-engine.ts` to rely on the new generator output (menu tree, navigation stack, command bindings) and strip out hardcoded defaults.
- [ ] Ensure orchestrator plumbing (`src/core/templum-core.ts` `TemplumCore.loadSkin`, `src/core/adapter-registry.ts` `TemplumAdapterRegistry.buildCLIAdapter`) supplies the generator with validated skins and handles error surfacing when metadata is incomplete, plugging into observability hooks for telemetry.
- [ ] Update documentation (`docs/current/architecture-spec.md` Interface Delivery + Skin-Driven Rendering sections) describing the metadata-driven CLI pipeline and log the migration in `docs/current/progress.md` once complete.

### Blocked Actions (pending Skin payload consumption powering full UI without hardcoding)

- [ ] Finalize fallback removal and legacy template deletion once the metadata-to-CLI pipeline is proven stable in tests.
- [ ] Wire CLI generator output into `TemplumUniversalSessionManager` to keep CLI state in sync with other adapters using shared skin-derived descriptors.

## Definition of Done

- Tests to run: `npm test`, `npm run test:coverage`, focused Jest runs for new CLI generator suites.
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-validation` (verify generator integration doesn’t break validation harnesses).
- Documentation to update: `docs/current/progress.md` status/notes, `docs/current/architecture-spec.md` Interface Delivery sections, change-log or release notes covering the CLI generator migration.

## References

- Progress entry: `docs/current/progress.md:26`
- Architecture spec: `docs/current/architecture-spec.md` → Sections 1 (Current State Snapshot) & 3 (Ideal Requirements vs. Status).
- Code: `src/cli-entry.ts`, `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/adaptive-cli-integration.ts`, `src/interfaces/cli-display-consistency-engine.ts`, `src/menus/universal-menu-registry.ts`, `src/core/templum-core.ts`, `src/core/adapter-registry.ts`.
- Tests: `tests/interfaces/interface-adapter-integration.test.ts`, `tests/e2e/e2e-complete-workflows.test.ts`.

## Current Assessment (2025-10-05)

- Implementation: There is no dedicated CLI generator module; CLI adapters continue to call `generateFallbackCLIOutput` with serialized skin data instead of constructing menu/window structures.
- Tests: Existing interface adapter tests verify legacy behaviour only; no suite asserts that menus or commands originate from skin metadata.
- Required work: extract the generator, update CLI adapters to consume it, and add integration/e2e coverage for metadata-driven menus before re-running Phase 6 validations.
