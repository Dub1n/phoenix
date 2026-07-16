# Task: Skin payload consumption powering full UI without hardcoding

## Requirement Summary

- Status: `[~]`
- Requirement text: "Skin payload consumption powering full UI without hardcoding."

## Prerequisites

- [~] Versioned skin contract enforcement (schema validation pending integration tests; see dev/tasks/versioned-skin-contract.md). — Guarantees payload shape and version gating before substituting runtime rendering.

## Implementation Steps

### Unblocked Actions

- [x] Add failing adapter/engine integration coverage first: extend `tests/interfaces/interface-adapter-integration.test.ts` (or introduce `tests/rendering/skin-payload-consumption.integration.test.ts`) to assert CLI and VSCode adapters render menus, commands, and layouts straight from a supplied `UniversalSkinDefinition` without falling back to legacy defaults, asserting menu tree, commands, and theme metadata originate from the payload.
- [~] Augment `tests/templum/universal-skin-system.test.ts` with cases that exercise `UniversalSkinEngine.renderForInterface` + `UniversalSkinRenderer.renderMenu`, proving the pipeline consumes `skin.menus`, `skin.views`, and `skin.commands` to generate interface-specific outputs and raises when definitions are missing. *(Follow-up captured in TODO below.)*
- [x] Wire `src/core/templum-core.ts` and `src/core/adapter-registry.ts` so adapters receive render artifacts from `UniversalSkinEngine`/`UniversalSkinRenderer` rather than bespoke scaffolds; ensure dependency injection passes the composed renderer down to CLI/VSCode adapters.
- [x] Refactor `src/interfaces/cli-adapter-abstracted.ts` (`CLIInterfaceAdapter.applySkin`, `CLIInterfaceAdapter.generateFallbackCLIOutput`), `src/interfaces/vscode-adapter.ts` (`VSCodeInterfaceAdapter.applySkin`), and `src/interfaces/universal-interaction-manager.ts` to delete hardcoded menu/command fallbacks, consuming the engine’s render output and persisting state through `UniversalMenuRegistry` and `SessionContextFoundation` instead.
- [x] Teach `src/rendering/universal-skin-renderer.ts` and `src/rendering/universal-layout-engine.ts` to hydrate interface-specific components (TreeViews, panels, menu flows) straight from the payload, including caching/layout hints, and expose structured results consumed by adapters.
- [ ] Update documentation (`docs/current/architecture-spec.md` Section 1 & 3) to describe the skin-driven rendering flow and note the removal of hardcoded UI scaffolding; backfill `docs/current/progress.md` once validations pass.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests to run: `npm test`, `npm run test:coverage`, targeted watch on new integration suites. *(Executed `npm test -- --runTestsByPath tests/rendering/skin-payload-consumption.integration.test.ts` on 2025-10-06.)*
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-validation` to ensure renderer/skin wiring passes validation harnesses.
- Documentation to update: `docs/current/progress.md` requirement status/notes, `docs/current/architecture-spec.md` rendering sections, release/changelog entries tracking the UI pipeline shift.

## References

- Progress entry: `docs/current/progress.md:19`
- Architecture spec: `docs/current/architecture-spec.md` → Sections 1 (Current State Snapshot) & 3 (Ideal Requirements vs. Status).
- Code: `src/rendering/universal-skin-renderer.ts`, `src/rendering/universal-layout-engine.ts`, `src/core/templum-core.ts`, `src/core/adapter-registry.ts`, `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/vscode-adapter.ts`, `src/interfaces/universal-interaction-manager.ts`, `src/menus/universal-menu-registry.ts`.
- Tests: `tests/interfaces/interface-adapter-integration.test.ts`, `tests/templum/universal-skin-system.test.ts`.

## Current Assessment (2025-10-06)

- Implementation: CLI and VSCode adapters now request renders from the injected skin engine during startup, reuse orchestrator-cached skins when discovery is empty, and receive backend-loaded skins through `TemplumCore.applySkinToActiveInterfaces`, eliminating the bespoke fallback scaffolds.
- Tests: Added `tests/rendering/skin-payload-consumption.integration.test.ts` coverage to assert payload-driven output via both direct `applySkin` and `loadInitialContent` flows (`npm test -- --runTestsByPath tests/rendering/skin-payload-consumption.integration.test.ts`).
- Coverage: Global coverage gating is still blocked on the `babel-plugin-istanbul` tooling regressions (tracked in `dev/tasks/test-architecture-governance.md`).
- Next actions: Extend renderer contract cases in `tests/templum/universal-skin-system.test.ts` once the layout snapshot strategy is agreed; complete doc refresh for architecture/progress sections (pending above).
- TODO (2025-10-06): Add renderer contract assertions in `tests/templum/universal-skin-system.test.ts` to cover missing payload fields and error paths after snapshot baselines settle.

## Reassessment (2026-07-16)

- Validated payload ingestion, caching, and adapter delivery are present and are preserved by the CLI rewrite.
- The "full UI without hardcoding" requirement is not complete for CLI because the live interactive menu still originates from hardcoded defaults.
- CLI completion is delegated to `cli-character-grid-renderer.md`; live partner payload verification remains pending separately.
