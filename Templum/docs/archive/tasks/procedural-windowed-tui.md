# Task: Procedural windowed TUI layout from skin descriptors

## Requirement Summary

- Status: `Superseded 2026-07-16`
- Requirement text: "Procedural windowed TUI layout from skin descriptors."
- Replacement: `dev/tasks/cli-character-grid-renderer.md`

> The procedural renderer produced bordered strings but never became the sole live interactive renderer. Its implementation and tests are retained as migration evidence; completion claims are superseded by the character-grid renderer task.

## Prerequisites

- [x] Skin payload consumption powering full UI without hardcoding (see dev/tasks/skin-payload-consumption.md). — Skin metadata must reach the CLI renderer to drive procedural window layout.

## Implementation Steps

### Unblocked Actions

- [x] Add red-failing layout specs in `tests/rendering/content-layout-system.test.ts` (or new `tests/rendering/procedural-windowed-tui.integration.test.ts`) that load `UniversalSkinDefinition` fixtures and assert the CLI output renders bordered windows (titles, sections, navigation) derived from skin descriptors without fallback text.
- [x] Extend `tests/interfaces/interface-adapter-integration.test.ts` with CLI-focused cases verifying the adapter requests procedural layouts via `UniversalLayoutEngine`/`ContentLayoutSystem` and renders nested windows for multi-level menus.
- [x] Enhance `src/rendering/content-layout-system.ts` (`ContentLayoutSystem.composeWindow`, `ContentLayoutSystem.buildSections`) and `src/rendering/universal-layout-engine.ts` (`UniversalLayoutEngine.renderForCLI`) so window dimensions, borders, and navigation stacks are computed from `skin.views`/`skin.menus` descriptors, including terminal capability fallbacks and consistent numbering.
- [x] Update `src/interfaces/enhanced-window-system.ts` (`EnhancedWindowSystem.renderWindowSet`) to consume the expanded layout API (progressive enhancement paths, capability caching) and expose structured results to CLI adapters, removing any placeholder window scaffolding.
- [x] Wire CLI adapters (`src/interfaces/cli-adapter-abstracted.ts` `CLIInterfaceAdapter.renderMenuWindow`, `src/interfaces/adaptive-cli-integration.ts` `AdaptiveCLIIntegration.render`) to request procedural windows through the shared renderer, persisting state via `UniversalMenuRegistry` and `SessionContextFoundation`.
- [x] Document the procedural window pipeline in `docs/current/architecture-spec.md` (Skin-Driven Rendering section) and capture the verification steps in `docs/current/progress.md` once tests pass.

### Blocked Actions (pending Skin payload consumption powering full UI without hardcoding)

- [x] Final CLI end-to-end validation in `tests/e2e/e2e-complete-workflows.test.ts` asserting loaded skins drive windowed layouts without fallback logic. (2025-10-15 — Added `CLI Procedural Windows` coverage and executed `npm run test -- --runTestsByPath tests/e2e/e2e-complete-workflows.test.ts`.)
- [x] Removal of legacy hardcoded CLI windows/menu scaffolds after upstream payload flow is proven stable. (Replaced fallback ASCII banners with skin-driven warnings; CLI output is now sourced exclusively from `EnhancedWindowSystem.renderWindowSet`.)

## Definition of Done

- Tests to run: `npm test`, `npm run test:coverage`, targeted Jest runs for new rendering specs.
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-validation` to ensure rendering changes remain compliant.
- Documentation to update: `docs/current/progress.md` status/notes, `docs/current/architecture-spec.md` Skin-Driven Rendering section, any changelog/release notes covering CLI layout overhaul.

## References

- Progress entry: `docs/current/progress.md:20`
- Architecture spec: `docs/current/architecture-spec.md` → Sections 1 & 3.
- Code: `src/rendering/content-layout-system.ts`, `src/rendering/universal-layout-engine.ts`, `src/interfaces/enhanced-window-system.ts`, `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/adaptive-cli-integration.ts`, `src/menus/universal-menu-registry.ts`.
- Tests: `tests/rendering/content-layout-system.test.ts`, `tests/interfaces/interface-adapter-integration.test.ts`, `tests/e2e/e2e-complete-workflows.test.ts`.

## Current Assessment (2025-10-15)

- Implementation: CLI adapters now rely solely on procedural window sets delivered by `EnhancedWindowSystem.renderWindowSet`; fallback ASCII scaffolds were removed and replaced with a lightweight warning when no CLI-compatible skins are available.
- Tests: `tests/e2e/e2e-complete-workflows.test.ts` verifies procedural window rendering and the absence of fallback output; adapter integration tests continue to cover nested menu rendering. Command executed: `npm run test -- --runTestsByPath tests/e2e/e2e-complete-workflows.test.ts`.
- Coverage: Global coverage gating still hinges on the `babel-plugin-istanbul` fix in `dev/tasks/test-architecture-governance.md`; targeted rendering and adapter suites pass with the new e2e assertions.
- Next steps: Re-run the full coverage harness once the instrumentation fix lands; keep the warning copy aligned with skin-driven behaviour while live backend payload validation remains pending.

## Supersession Assessment (2026-07-16)

- `EnhancedWindowSystem.renderWindowSet` and `ContentLayoutSystem` can generate procedural windows, but `startInteractiveSession()` continues through `InteractiveMenuRenderer.displayMenu()` and its hardcoded default menu graph.
- The focused tests pass while captured output remains visually non-compliant because assertions check token presence rather than complete frames.
- No further work should be added here. Migrate reusable findings and evidence to `cli-character-grid-renderer.md`.
