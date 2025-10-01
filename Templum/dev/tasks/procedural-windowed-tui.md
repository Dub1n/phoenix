# Task: Procedural windowed TUI layout from skin descriptors

## Requirement Summary

- Status: [ ]
- Requirement text: "Procedural windowed TUI layout from skin descriptors."

## Prerequisites

- [ ] Skin payload consumption powering full UI without hardcoding (see dev/tasks/skin-payload-consumption.md). — Skin metadata must reach the CLI renderer to drive procedural window layout.

## Implementation Steps

### Unblocked Actions

- [ ] Add red-failing layout specs in `tests/rendering/content-layout-system.test.ts` (or new `tests/rendering/procedural-windowed-tui.integration.test.ts`) that load `UniversalSkinDefinition` fixtures and assert the CLI output renders bordered windows (titles, sections, navigation) derived from skin descriptors without fallback text.
- [ ] Extend `tests/interfaces/interface-adapter-integration.test.ts` with CLI-focused cases verifying the adapter requests procedural layouts via `UniversalLayoutEngine`/`ContentLayoutSystem` and renders nested windows for multi-level menus.
- [ ] Enhance `src/rendering/content-layout-system.ts` and `src/rendering/universal-layout-engine.ts` so window dimensions, borders, and navigation stacks are computed from `skin.views`/`skin.menus` descriptors, including terminal capability fallbacks and consistent numbering.
- [ ] Update `src/interfaces/enhanced-window-system.ts` to consume the expanded layout API (progressive enhancement paths, capability caching) and expose structured results to CLI adapters, removing any placeholder window scaffolding.
- [ ] Wire CLI adapters (`src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/adaptive-cli-integration.ts`) to request procedural windows through the shared renderer, persisting state via `UniversalMenuRegistry` and `SessionContextFoundation`.
- [ ] Document the procedural window pipeline in `docs/current/architecture-spec.md` (Skin-Driven Rendering section) and capture the verification steps in `docs/current/progress.md` once tests pass.

### Blocked Actions (pending Skin payload consumption powering full UI without hardcoding)

- [ ] Final CLI end-to-end validation in `tests/e2e/e2e-complete-workflows.test.ts` asserting loaded skins drive windowed layouts without fallback logic.
- [ ] Removal of legacy hardcoded CLI windows/menu scaffolds after upstream payload flow is proven stable.

## Definition of Done

- Tests to run: `npm test`, `npm run test:coverage`, targeted Jest runs for new rendering specs.
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-validation` to ensure rendering changes remain compliant.
- Documentation to update: `docs/current/progress.md` status/notes, `docs/current/architecture-spec.md` Skin-Driven Rendering section, any changelog/release notes covering CLI layout overhaul.

## References

- Progress entry: `docs/current/progress.md:20`
- Architecture spec: `docs/current/architecture-spec.md` → Sections 1 & 3.
- Code: `src/rendering/content-layout-system.ts`, `src/rendering/universal-layout-engine.ts`, `src/interfaces/enhanced-window-system.ts`, `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/adaptive-cli-integration.ts`, `src/menus/universal-menu-registry.ts`.
- Tests: `tests/rendering/content-layout-system.test.ts`, `tests/interfaces/interface-adapter-integration.test.ts`, `tests/e2e/e2e-complete-workflows.test.ts`.
