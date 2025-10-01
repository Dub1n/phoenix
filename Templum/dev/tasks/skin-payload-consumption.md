# Task: Skin payload consumption powering full UI without hardcoding

## Requirement Summary

- Status: [ ]
- Requirement text: "Skin payload consumption powering full UI without hardcoding."

## Prerequisites

- [~] Versioned skin contract enforcement (schema validation pending integration tests; see dev/tasks/versioned-skin-contract.md). — Guarantees payload shape and version gating before substituting runtime rendering.

## Implementation Steps

### Unblocked Actions

- [ ] Add failing adapter/engine integration coverage first: extend `tests/interfaces/interface-adapter-integration.test.ts` (or introduce `tests/rendering/skin-payload-consumption.integration.test.ts`) to assert CLI and VSCode adapters render menus, commands, and layouts straight from a supplied `UniversalSkinDefinition` without falling back to legacy defaults, asserting menu tree, commands, and theme metadata originate from the payload.
- [ ] Augment `tests/templum/universal-skin-system.test.ts` with cases that exercise `UniversalSkinEngine.renderForInterface` + `UniversalSkinRenderer.renderMenu`, proving the pipeline consumes `skin.menus`, `skin.views`, and `skin.commands` to generate interface-specific outputs and raises when definitions are missing.
- [ ] Wire `src/core/templum-core.ts` and `src/core/adapter-registry.ts` so adapters receive render artifacts from `UniversalSkinEngine`/`UniversalSkinRenderer` rather than bespoke scaffolds; ensure dependency injection passes the composed renderer down to CLI/VSCode adapters.
- [ ] Refactor `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/vscode-adapter.ts`, and `src/interfaces/universal-interaction-manager.ts` to delete hardcoded menu/command fallbacks, consuming the engine’s render output and persisting state through `UniversalMenuRegistry` and `SessionContextFoundation` instead.
- [ ] Teach `src/rendering/universal-skin-renderer.ts` and `src/rendering/universal-layout-engine.ts` to hydrate interface-specific components (TreeViews, panels, menu flows) straight from the payload, including caching/layout hints, and expose structured results consumed by adapters.
- [ ] Update documentation (`docs/current/architecture-spec.md` Section 1 & 3) to describe the skin-driven rendering flow and note the removal of hardcoded UI scaffolding; backfill `docs/current/progress.md` once validations pass.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests to run: `npm test`, `npm run test:coverage`, targeted watch on new integration suites.
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-validation` to ensure renderer/skin wiring passes validation harnesses.
- Documentation to update: `docs/current/progress.md` requirement status/notes, `docs/current/architecture-spec.md` rendering sections, release/changelog entries tracking the UI pipeline shift.

## References

- Progress entry: `docs/current/progress.md:19`
- Architecture spec: `docs/current/architecture-spec.md` → Sections 1 (Current State Snapshot) & 3 (Ideal Requirements vs. Status).
- Code: `src/rendering/universal-skin-renderer.ts`, `src/rendering/universal-layout-engine.ts`, `src/core/templum-core.ts`, `src/core/adapter-registry.ts`, `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/vscode-adapter.ts`, `src/interfaces/universal-interaction-manager.ts`, `src/menus/universal-menu-registry.ts`.
- Tests: `tests/interfaces/interface-adapter-integration.test.ts`, `tests/templum/universal-skin-system.test.ts`.
