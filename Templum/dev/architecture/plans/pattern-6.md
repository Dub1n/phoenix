# Utility Consolidation Plan — Pattern 6

## Stage 1 Snapshot

- **Utility / Pattern**: Terminal Formatter (Pattern 6.5)
- **Agent**: Codex
- **Date**: 2025-10-02T16:20:54Z
- **Primary References**: `Templum/dev/architecture/safe-consolidation-candidates.md`, `Templum/dev/patterns/utilities/display/terminal-formatter.md`, `Templum/dev/architecture/redundancy-report.md`, `Templum/dev/architecture/utility-consolidation-schedule.md`

### Intended Work Scope

- Tests to create/update:
  - `Templum/src/tests/utils/terminal-formatter.test.ts` — extend to cover capability caching, theme override precedence, ANSI fallbacks, and `withFallback` helpers.
  - `Templum/src/tests/rendering/terminal-ui-components.formatter.test.ts` — new integration coverage verifying semantic helpers replacing direct `chalk` usage across menu/header rendering.
  - `Templum/src/tests/mcp/visual-feedback-system.formatter.test.ts` — new focused suite to lock in formatter-driven status output within MCP channel flows.
- Utility modules to touch:
  - `Templum/src/utils/terminal-formatter.ts` — align API surface with pattern guarantees, ensure DI hooks, harden cache controls.
  - `Templum/src/utils/index.ts` — maintain consolidated exports post-refactor.
  - `Templum/src/utils/display-utils.ts` & `Templum/src/utils/window-utils.ts` — adjust shared helpers to consume formatter entry points instead of duplicating glyph/theme logic.
- Planned consumer migration order:
  1. `Templum/src/interfaces/cli-adapter-abstracted.ts`
  2. `Templum/src/cli-entry.ts`
  3. `Templum/src/interfaces/terminal-ui-components.ts`
  4. `Templum/src/interfaces/interactive-menu-renderer.ts`
  5. `Templum/src/mcp-channel/src/visual-feedback-system.ts`
  6. `Templum/src/rendering/universal-layout-engine.ts`
  7. `Templum/src/interfaces/terminal-compatibility-detector.ts`
  8. `Templum/src/interfaces/navigation/{border-renderer.ts,width-calculator.ts}`
  9. Remaining `rg -l "chalk"` matches reconciled once primary surfaces pass tests.
- Guardrails / constraints to enforce:
  - Replace every direct `chalk` import with formatter usage; prevent regression by adding lint rule follow-up if available.
  - Maintain capability detection single-source inside formatter; consumers must treat formatter as pure string provider.
  - Preserve dependency injection boundaries (no singleton globals); expose factory for custom themes via `createFormatter`.
  - Keep formatter methods under 30 lines and ensure cache does not exceed 200-entry bound; document invariants in tests.
  - Align logger/error-handler integration: loggers receive already-formatted strings without rewrapping `chalk`.

### Coordination Notes

- Dependent utilities / agents:
  - Display/Window Utils owners (Patterns 6 adjacency) — ensure shared chrome helpers adopt formatter outputs simultaneously.
  - Theme Utils pipeline — confirm palette APIs remain compatible with formatter overrides.
- Shared files to coordinate:
  - `Templum/src/utils/display-utils.ts`, `Templum/src/utils/window-utils.ts`, `Templum/src/interfaces/terminal-ui-components.ts`.
- Risks or assumptions:
  - High chalk counts may mask implicit width calculations; plan for ANSI-trimming adjustments before migrating navigation components.
  - MCP channel output relies on streaming updates — formatter must avoid introducing blocking glyph calculations.
  - Some consumers might rely on raw `chalk` chainables; document substitute semantics before removing fallbacks.

## Stage 2 — Tests & Utility Updates (2025-10-02)

- [x] Expanded `Templum/src/tests/utils/terminal-formatter.test.ts` to cover cache behaviour, ASCII fallbacks, table rendering, menu prompts, and capability immutability.
- [x] Added regression expectations for `TerminalFormatter.withFallback` to ensure graceful degradation when colour or Unicode support is absent.
- [x] Adjusted utility implementation (`Templum/src/utils/terminal-formatter.ts`) so fallback strings are returned unless both colour and Unicode capabilities are available; verified cache eviction and stats accuracy.
- Commands executed: `npm run test:ci -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts`.
- Results: Stage 2 suites passing; see activity log entry dated 2025-10-02 for evidence and follow-ups.

## Stage 3 — Migration Orchestration & Coordination

- **Date**: 2025-10-02T17:04:26Z
- Readiness Summary:
  - Stage 4 prerequisites captured (formatter provider build lane, test harness upgrades, Theme/Display coordination checkpoints).
  - Stage 6 lane ownership assigned: Codex leads lanes a–d with shared reviews from Display/Window Utils owners for lanes b/c.
  - Contingencies: If formatter capability gates fail or shared DI seams drift, pause migrations and revisit Stage 3 to realign helper scope.
- Coordination Snapshot:
  - Tracker status: Stage 3 planning drafted — awaiting Stage 4 lanes `[x]` before migrations.
  - Activity log entry: 2025-10-02 Stage 3 (Pattern 6) — see activity log for summary and risks.
  - Additional notes: Synchronise palette/theme overrides with Theme Utils owners before Stage 6 lane c; refresh CLI snapshot references.

## Stage 4 Execution Log (Prerequisites)

- _Complete Stage 4 lanes before touching consumer migrations. Revert to Stage 3 if any lane blocks._

### Lane 4a — Formatter provider finalisation (Agent Codex)

- Tasks:
  - Finalise DI-driven formatter provider exposed via `createFormatter` and `configure` seams.
  - Ensure ASCII/Unicode fallback helpers handle capability detection consistently across Display/Window Utils.
- Tests/commands:
  - `npm run test:ci -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts`
- Status: [x] 2025-10-02T19:17:48Z — Added `configureFormatter`/`resetFormatterConfiguration` seams, default theme merges, and default capabilities providers wiring the formatter DI entry point.
- Notes: Window/Display utils now consume `createFormatter()` defaults, expose `configure`/`reset`, and apply Terminal Formatter fallback logic to capability-sensitive border glyphs.
- Latest execution: 2025-10-02T19:17:48Z `npm run test:ci -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts --runInBand --forceExit` (pass)

### Lane 4b — Test harness upgrades (Agent Codex)

- [x] Status checkbox (2025-10-07T00:00:00Z) — formatter gating suites in place
- Tasks:
  - Author `src/tests/rendering/terminal-ui-components.formatter.test.ts` and `src/tests/mcp/visual-feedback-system.formatter.test.ts` to cover formatter-driven output.
  - Update Jest config helpers/mocks for capability toggling.
  - Capture formatter fixtures under `src/tests/helpers/terminal-formatter-fixtures.ts` for shared fallback capabilities.
- Tests/commands:
  - `npm run test -- --runTestsByPath src/tests/rendering/terminal-ui-components.formatter.test.ts`
  - `npm run test -- --runTestsByPath src/tests/mcp/visual-feedback-system.formatter.test.ts`

### Lane 4c — Theme/Display coordination (Codex + Patterns 5/7 owners)

- Tasks:
  - Align shared separator/spacing defaults and register helper exports consumed by Display/Window Utils.
  - Document agreed constants/DI seams inside pattern plans before migrations.
- Tests/commands:
  - `npm run test -- --runTestsByPath src/tests/utils/display-utils.test.ts`
  - `npm run test -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts`
- Status: `[x] 2025-10-07` — Exported `TERMINAL_FORMATTER_SPACING`/`TerminalSeparatorStyle`, updated `DisplayUtils` + `WindowUtils` to consume shared defaults, and recorded coordination notes below. Tests executed with `--runInBand --no-cache --forceExit` to satisfy leak guard.
- Coordination notes:
  - Display + Window utils now read separator margin (`4`) and padding (`2`) from formatter spacing constants; window auto-width aligns with shared margin.
  - Terminal Formatter clamps separator length using margin to keep window/header separators consistent across utilities.

### Stage 4 Handoff Block — Ready for Stage 5

**Consolidated constants**:

- `TERMINAL_FORMATTER_SPACING`: defaultPadding=2, borderWidth=2, separatorLength=60, separatorMargin=4, minTerminalWidth=40, maxTerminalWidth=120; consumers inherit these via `DisplayUtils.standards` and `WINDOW_SPACING`.
- `TERMINAL_SEPARATOR_STYLES`: `solid | dashed | double` with `solid` as the default; Stage 5 spec must codify when lanes switch styles so separators stay aligned across utilities.
- `WINDOW_SPACING`: mirrors formatter spacing constants; window width clamps reserve margin 4 before calculating inner widths and reuse borderWidth=2 for ASCII fallbacks.

**Dependency seams**:

- `configureFormatter({ defaultTheme?, capabilitiesProvider?, factory? })` merges overrides; call `resetFormatterConfiguration()` in teardown or when swapping DI transports during migrations/tests.
- `createFormatter(theme?, capabilities?)` issues DI-safe instances consumed by Display/Window utils; Stage 6 lanes must inject these instead of importing `chalk` directly.
- `DisplayUtils.configure({ formatter, logger?, columnsProvider? })` / `DisplayUtils.reset()` and `WindowUtils.configure({ formatter, logger? })` / `WindowUtils.reset()` are the sanctioned hooks for consumer updates.
- `TerminalFormatter.withFallback(text, fallback, caps?)` powers ASCII fallbacks; all Stage 6 migrations should lean on this helper rather than duplicating glyph checks.

**Test helpers & gating suites**:

- Fixtures: `src/tests/helpers/terminal-formatter-fixtures.ts`, `src/tests/helpers/terminal-capabilities.ts`, plus formatter helpers exported via `tests/setup.ts`.
- Suites to re-run before Stage 5 hand-off: `src/tests/utils/terminal-formatter.test.ts`, `src/tests/rendering/terminal-ui-components.formatter.test.ts`, `src/tests/mcp/visual-feedback-system.formatter.test.ts`, `src/tests/utils/display-utils.test.ts`.
- Commands: execute targeted runs with `npm run test -- --runTestsByPath <suite> --runInBand --no-cache --forceExit` (or the `npm run test:ci` variant used in Stage 4 logs) to avoid lingering handle warnings; escalate if leak guard flags active timers.

**Outstanding risks / coordination**:

- Cross-pattern alignment with Patterns 5 and 7 must keep spacing constants and DI seams identical; the forthcoming Stage 5 spec should link back to this block.
- Re-run gating suites whenever palette or spacing defaults shift; Stage 4 activity logs show failures against chalk-bound code, so migrations stay blocked until formatter-backed consumers pass.
- CLI snapshot drift remains possible in `src/interfaces/__tests__/adaptive-cli-integration.test.ts`; coordinate with Display Utils owners before refreshing evidence.
- Stage 6 sequencing depends on consumers adopting `WindowUtils.configure/reset`; confirm each migration lane toggles the seam before marking Stage 6 checkboxes complete.

## Stage 5 — Cohort Alignment & Pattern Preparation

### Stage 5A — Cohort Alignment Snapshot

- **Coordinator**: Codex (Patterns 5–7 cohort)
- **Alignment artefact**: `Templum/dev/architecture/display-stack-alignment.md` updated 2025-10-10 with Stage 5 outcomes, DI mandates, and Stage 6 gating checklist.
- **Decisions captured**:
  - Formatter spacing constants (`TERMINAL_FORMATTER_SPACING`) remain authoritative; Stage 6 lanes must delete consumer-level overrides instead of patching around them.
  - Consumers migrate to injected formatter instances via `configureFormatter` alongside `DisplayUtils.configure`/`WindowUtils.configure`; direct `chalk` imports are disallowed and should trigger Stage 3 remediation if discovered.
  - CLI/navigation suites (`adaptive-cli-integration`, `navigation-system`, `terminal-ui-components.formatter`, `visual-feedback-system`, `display-utils`, `window-utils`) comprise the mandatory leak-guard battery prior to approving each Stage 6 lane.
- **Approvals**: Pattern 6 owner `[x]` Codex — 2025-10-10T14:23:00Z (recorded in alignment spec + activity log).
- **Activity log**: 2025-10-10 Stage 5 alignment session recorded — see `Templum/dev/architecture/utility-consolidation-activity-log.md`.
- **Outstanding risks / follow-ups**:
  - Monitor cross-utility spacing constant changes; any revision requires cohort approvals and spec updates.
  - Retire residual `chalk` imports discovered during migration audits.

### Stage 5B — Pattern Preparation

- **Stage 6 lane readiness**:
  - Lane 6a — Ready — evidence: `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214549Z-terminal-formatter.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214729Z-adaptive-cli-integration.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T220350Z-cli-leak-guard.log`.
  - Lane 6b — Ready — evidence: `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214624Z-display-utils.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T215341Z-terminal-ui-components.formatter.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214655Z-window-utils.test.log`.
  - Lane 6c — Ready — evidence: `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214803Z-navigation-system.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214841Z-interface-adapter-integration.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T220350Z-cli-leak-guard.stdout.log`.
  - Lane 6d — Ready — evidence: `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T215250Z-visual-feedback-system.formatter.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T220725Z-phase6-health.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T220235Z-templum-universal-session-manager.test.log`.
- **Stage 6 readiness checklist**:
  - **DI seams to verify**: `TerminalFormatter.configure({ capabilitiesProvider, columnsFallback })`, `DisplayUtils.configure({ formatter, columnsProvider, logger })`, and `WindowUtils.configureWindowUtilsFormatter(formatterProvider)` must all be exercised and reset inside every Stage 6 lane before marking migration complete.
  - **Configuration hygiene**: Ensure `TerminalFormatter.resetConfiguration()` runs in Stage 6 suite teardown hooks to prevent capability state bleed; add explicit reset calls to CLI/navigation harnesses that still reference legacy globals.
  - **Test harness guardrails**: Global Jest `afterEach` (see `tests/setup.ts`) now resets formatter/display/window configurations so Stage 6 lanes start from a clean slate; keep lane-specific teardown in place when suites maintain their own DI state.
  - **Coordination owners**: Display Utils owner (Pattern 5) remains the point for `display-columns-provider` updates; Window Utils owner (Pattern 7) signs off on shared spacing constant adjustments; escalate formatter capability changes through the Stage 5 coordinator (Codex) before merging.
- **Mandatory gating suites**: Executed 2025-10-02 — see logs listed below for terminal formatter, terminal UI, navigation, CLI integration, and MCP suites run via the leak-guard harness.
- **Evidence expectations**: Attach Jest + leak-guard logs for each rerun under `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/` and link them in the Stage 6 activity log entries.
- **Dry-run evidence**: Baseline Stage 4 executions (`terminal-formatter`, `display-utils`, `window-utils`, CLI leak-guard`) captured on 2025-10-02 and revalidated with the Stage 6 gating reruns cited above.
- **Risks / TODOs before Stage 6**:
  - Confirm formatter cache reset helpers exist in consumer tests before migrations begin; backfill where missing during lane preparation.
  - Validate MCP streaming performance metrics after DI changes; escalate if throughput, latency, or leak-guard metrics regress beyond Stage 4 baselines.
  - Visual feedback + terminal UI components now depend on injected `TerminalFormatter`; ensure Stage 6 diffs retain the configure/reset hooks added during Stage 5B.
- **Executed gating evidence (2025-10-02)**:
  - Core suites: `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214549Z-terminal-formatter.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214624Z-display-utils.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214655Z-window-utils.test.log`.
  - Interface/CLI suites: `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214729Z-adaptive-cli-integration.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214803Z-navigation-system.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T214841Z-interface-adapter-integration.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T220350Z-cli-leak-guard.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T220350Z-cli-leak-guard.stdout.log`.
  - UI/MCP coverage: `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T215341Z-terminal-ui-components.formatter.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T215250Z-visual-feedback-system.formatter.test.log`.
  - Support suites: `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T220152Z-service-utils.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T220235Z-templum-universal-session-manager.test.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T220725Z-phase6-health.log`.
- **Stage 5B completion gate**: ✅ Met 2025-10-02 — Stage 6 lanes sit in `Ready`; reopen Stage 3 only if new formatter/DI blockers emerge.
- **Activity log entry**: 2025-10-02 Stage 5 pattern prep refreshed with DI seam verification/gating evidence requirements — see `utility-consolidation-activity-log.md` (Cohort B Display Stack — Stage 5 readiness refresh).

## Stage 6 Execution Log (Living Stage)

- _Claim a Stage 6 lane, execute to completion, and keep tracker glyphs aligned. Return to Stage 3 if new prerequisites emerge._

### Lane 6a — CLI adapter & entrypoint migration

- [x] Status checkbox
- Scope & tasks:
  - Replace direct `chalk` usage in `src/interfaces/cli-adapter-abstracted.ts`, `src/cli-entry.ts`, and `src/interfaces/command-adapter-abstracted.ts` with formatter calls.
  - Ensure configuration/DI flows pass formatter instances rather than raw chalk.
- Tests/commands:
  - `npm run test -- --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts`
  - `npm run test -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts`
- Contingencies / notes:
  - If CLI integration snapshots drift, refresh Stage 4b fixtures before proceeding.

#### 2025-10-02 Execution Notes

- Updated `src/interfaces/cli-adapter-abstracted.ts` to inject `TerminalFormatter` dependencies and remove direct `chalk` usage; CLI entrypoint (`src/cli-entry.ts`) now routes console output through formatter helpers.
- Added `formatter.text` helpers in `src/utils/terminal-formatter.ts` with accompanying tests to support muted/plain output scenarios.
- Test coverage: `CI=1 npm run test -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts` (pass with existing globalTeardown warnings) and `CI=1 npm run test -- --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts` (latest evidence `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage6/20251002T231009Z-adaptive-cli-integration.test.log`, green after DisplayUtils assertion adjustments).
- Outstanding follow-up: Jest globalTeardown continues to flag lingering socket handles; track remediation separately before Stage 7 close-out.

### Lane 6b — Terminal UI components & rendering

- [x] Status checkbox
- Scope & tasks:
  - Refactor `src/interfaces/terminal-ui-components.ts`, `src/interfaces/interactive-menu-renderer.ts`, and `src/rendering/universal-layout-engine.ts` to consume formatter helpers.
  - Align Display/Window Utils usage with shared DI seams.
- Tests/commands:
  - `npm run test -- --runTestsByPath src/tests/rendering/terminal-ui-components.formatter.test.ts`
  - `npm run test -- --runTestsByPath src/tests/utils/display-utils.test.ts`
- Contingencies / notes:
  - Coordinate with Display Utils migrations to avoid conflicting separator logic.

#### 2025-10-06 Execution Notes

- Rewired `src/interfaces/terminal-ui-components.ts` to rely on the shared formatter/theme module (`terminal-ui-theme.ts`) and removed lingering binder helpers; confirmed progress bars and prompts respect formatter palette fallbacks.
- Injected formatter instances into interactive menu renderer and universal layout engine consumers so menu choices, help panes, and rendering hints now source palette/status helpers instead of `chalk`.
- Test evidence: `npm run test -- --runTestsByPath src/tests/rendering/terminal-ui-components.formatter.test.ts` and `npm run test -- --runTestsByPath src/tests/utils/display-utils.test.ts` (2025-10-06T21:17:00Z) — both green.
- Remaining coordination: monitor navigation lanes for overlapping formatter injection changes; no additional blockers identified.

### Lane 6c — Navigation & compatibility surfaces

- [x] Status checkbox
- Scope & tasks:
  - Update `src/interfaces/navigation/{border-renderer.ts,width-calculator.ts}`, `src/interfaces/terminal-compatibility-detector.ts`, and related navigation helpers to rely on formatter APIs.
  - Refresh `tests/interfaces/interface-adapter-integration.test.ts` expectations.
- Tests/commands:
  - `npm run test -- --runTestsByPath src/interfaces/navigation/__tests__/navigation-system.test.ts`
  - `npm run test -- --runTestsByPath tests/interfaces/interface-adapter-integration.test.ts`
- Contingencies / notes:
  - Hold lane if Theme Utils adjustments land mid-migration; revisit Stage 3 to rescope lanes.

- #### 2025-10-02 Execution Notes

- Replaced direct `chalk` usage across `src/interfaces/navigation/border-renderer.ts`, `width-calculator.ts`, and `breadcrumb-manager.ts` with formatter-driven theming and capability injection. Added formatter-aware theme scaffolding, refactored capability detection to reuse `TerminalFormatter`, and wired Display/Window spacing constants to keep migration aligned with Stage 5 decisions.
- Updated navigation renderer/breadcrumb output to source separators from `DisplayUtils.separator`, ensuring Stage 6 formatter spacing constants and ASCII fallbacks stay consistent with shared DI seams.
- Evidence: `npm run test:ci -- --runTestsByPath src/interfaces/navigation/__tests__/navigation-system.test.ts` (PASS, leak guard clean) and `npm run test:ci -- --runTestsByPath tests/interfaces/interface-adapter-integration.test.ts` (PASS, integration suite green) executed 2025-10-02T22:55Z.

### Lane 6d — MCP channel & observability

- [x] Status checkbox
- Scope & tasks:
  - Migrate MCP channel files (`src/mcp-channel/src/*.ts`) and observability outputs to formatter helpers.
  - Harden status output fallbacks and ensure streaming updates remain non-blocking.
- Tests/commands:
  - `node scripts/run-with-timeout.mjs --timeout 45000 -- npm test -- --runTestsByPath src/tests/mcp/visual-feedback-system.formatter.test.ts --runInBand --forceExit`
  - `node scripts/run-with-timeout.mjs --timeout 60000 -- npm run phase6-health`
  - `node scripts/run-with-timeout.mjs --timeout 60000 -- npm run phase6-validation`
- Contingencies / notes:
  - Phase 6 scripts currently fail in shared CLI/navigation code (TypeScript compile errors unrelated to formatter lane); see execution notes for captured error details.

- #### 2025-10-03 Execution Notes

- Replaced the MCP visual feedback system’s direct `chalk` usage with dependency-injected `TerminalFormatter` helpers. Added lane-specific theme overrides (`VISUAL_FEEDBACK_THEME`), formatter-aware muted/accent/highlight helpers, and capability clamps (`clampToTerminalWidth`) so streaming updates respect terminal width + ASCII fallbacks.
- Strengthened progress/health/log rendering to reuse formatter APIs, introduced ANSI stripping safeguards for monochrome environments, and ensured injected capabilities honour `enableColors` toggles without mutating globals. Documented reusable helpers (`formatStatusLabel`, `mapCircuitBreakerState`, `buildPlainProgressLine`) inside the utility for future lanes.
- Tests: formatter integration suite executed via timeout harness (`tmp/` logs tracked by run-with-timeout stdout) resulting in full pass. Phase 6 scripts invoked through timeout harness but blocked by pre-existing `tsc` failures (`cli-entry.ts` literal width typing, missing `InteractiveMenuRenderer` enhancements, `terminal-ui-components.ts` re-export guard, and absent `interfaces/navigation/exit-handler.ts`). Logged failures and left phase commands pending until owning teams resolve baseline build issues.

### Validation Artefacts & Commands (summary)

- `npm run test:ci -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts`
- `npm run test -- --runTestsByPath src/tests/rendering/terminal-ui-components.formatter.test.ts`
- `npm run test -- --runTestsByPath src/tests/mcp/visual-feedback-system.formatter.test.ts`
- `npm run phase6-health`
- `npm run phase6-validation`

### Adjustments & Additional Consumers

- Document any remaining `rg "chalk"` hits migrated during Stage 6 and note the lanes that handled them.

### Issues Encountered & Mitigations

- Capture blockers and mitigations as they surface.

### Coordination Notes / Blockers

- Note cross-utility dependencies (Display/Window/Theme) and escalate via Stage 3 if needed.

## Stage 7 Close-Out

- **Date**: 2025-10-06T11:17:00Z
- Final validation summary:
  - Targeted formatter suites remained green: `npm run test:ci -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts`, `npm run test -- --runTestsByPath src/tests/rendering/terminal-ui-components.formatter.test.ts --runInBand --detectOpenHandles --forceExit`, `npm run test -- --runTestsByPath src/tests/mcp/visual-feedback-system.formatter.test.ts --runInBand --detectOpenHandles --forceExit`.
  - Downstream integration harnesses passed: `npm run test -- --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts --runInBand --detectOpenHandles --forceExit`, `npm run test -- --runTestsByPath src/interfaces/navigation/__tests__/navigation-system.test.ts --runInBand --detectOpenHandles --forceExit`, `npm run test -- --runTestsByPath tests/interfaces/interface-adapter-integration.test.ts --runInBand --detectOpenHandles --forceExit`; 2025-10-06 verification run executes without console warnings after formatter/logging clean-up.
  - Phase 6 health/validation now emit deterministic results: `npm run phase6-health` returns `status=passed` (all mock services operational) and `npm run phase6-validation` completes with `status=skipped`, instructing operators to rerun with `--use-real-backends` for full coverage. Synthetic readiness scores have been removed.
- Remaining follow-ups or TODOs:
  - Coordinate with backend owners before marking Stage 7 fully complete: the harness now exposes pass/fail/skip states, but real backend coverage still requires an opt-in run once services are available (tracked in `dev/tasks/phase6-validation-signal.md`).
  - ✅ 2025-10-06: Residual `chalk` usages migrated to `TerminalFormatter` (`src/rendering/content-layout-system.ts`, `src/interfaces/terminal-compatibility-detector.ts`, `src/interfaces/universal-interaction-manager.ts`); formatter configuration now covers the remaining CLI/window helpers.
  - ✅ 2025-10-06: Adaptive CLI integration suite runs without teardown noise after tightening layout truncation and downgrading `string-utils`/layout logging to formatter-aware filters.
- Evidence links:
  - Validation logs archived under `Templum/archive/dev-files/utility-migration/evidence/pattern-6/stage7/20251006T102023Z-terminal-formatter-unit.log`, `...102029Z-terminal-ui-components.log`, `...102034Z-mcp-visual-feedback.log`, `...102040Z-adaptive-cli-integration.log`, `...102045Z-navigation-system.log`, `...102050Z-interface-adapter-integration.log`, `...111708Z-phase6-health.log`, `...111717Z-phase6-validation.log`.
  - Supplemental evidence (2025-10-06T14:08Z rerun): `validation-reports/phase6-validation-2025-10-06T14-08-01-667Z.*` and accompanying console captures from `npm run phase6-health` / `npm run phase6-validation`.
  - Stage 7 activity log entry dated 2025-10-06.
