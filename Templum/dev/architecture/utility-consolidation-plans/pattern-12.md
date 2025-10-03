# Utility Consolidation Plan — Pattern 12

## Stage 1 Snapshot

- **Utility / Pattern**: Chainable String Utils (Pattern 12)
- **Agent**: Codex
- **Date**: 2025-10-01T13:30:00Z
- **Primary References**:
  - `Templum/dev/architecture/safe-consolidation-candidates.md` (§Category 3 — String Utils)
  - `Templum/dev/patterns/utilities/data/chainable-string-utils.md`
  - `Templum/dev/architecture/redundancy-report.md`
  - `Templum/dev/architecture/pattern-usage-analysis.md`

### Intended Work Scope

- Tests to create/update:
  - `Templum/src/tests/utils/chainable-string-utils.test.ts`
  - Extend CLI output snapshot coverage in `Templum/src/tests/interfaces` if regression gaps surface during Stage 3
- Utility modules to touch:
  - `Templum/src/utils/chainable-string-utils.ts` (new)
  - `Templum/src/utils/index.ts`
- Planned consumer migration order:
  1. `Templum/src/interfaces/cli-adapter.ts`
  2. `Templum/src/interfaces/cli-adapter-abstracted.ts`
  3. `Templum/src/interfaces/terminal-ui-components.ts`
  4. `Templum/src/interfaces/navigation/border-renderer.ts`
  5. `Templum/src/interfaces/border-renderer.ts`
  6. `Templum/src/interfaces/layout-normalizer.ts`
  7. `Templum/src/interfaces/navigation/width-calculator.ts`
  8. `Templum/src/rendering/universal-layout-engine.ts`
  9. `Templum/src/rendering/content-layout-system.ts`
  10. `Templum/src/scripts/run-phase6-integration-validation.ts`
  11. `Templum/src/scripts/simple-phase6-validation.ts`
- Guardrails / constraints to enforce:
  - Inject `createLogger('string-utils')` integrations with warning thresholds
  - Route fatal parameter issues through `error-handler`
  - Reuse `terminal-formatter` width helpers for ANSI + wide-character safety
  - Keep public API fluent, side-effect free, and functions <30 lines where possible
  - Preserve DI boundaries: accept dependencies via factory parameters for testability

### Coordination Notes

- Dependent utilities / agents:
  - `terminal-formatter`, `display-utils`, and `validator` teams for shared width/casing assumptions
- Shared files to coordinate:
  - `Templum/src/interfaces/terminal-ui-components.ts`
  - `Templum/src/interfaces/navigation/width-calculator.ts`
  - `Templum/src/rendering/content-layout-system.ts`
- Risks or assumptions:
  - Existing `StringWidthUtils` helper must be retired without regressing double-width handling
  - Several target files exceed 1,000 LOC; migrations will proceed in small, reviewable chunks
  - Snapshot baselines may require refresh; flag to coordinators before regenerating

## Stage 3 — Migration Orchestration & Coordination

- **Date**: 2025-10-01T21:10:00Z
- Readiness Summary:
  - Stage 4 lanes `[x]` (helper finalisation, build remediation, navigation prep).
  - Stage 5 lanes defined (a–d covering CLI adapters, navigation, layouts, scripts) with owners/tests captured below.
  - Contingencies: If new helper gaps emerge, revert to Stage 3 to add Stage 4 lanes before continuing migrations.
- Coordination Snapshot:
  - Tracker status: Stage 3 `[x]` — plan stored in `pattern-12.md`.
  - Activity log entry: 2025-10-01 Stage 3 (Pattern 12) — includes evidence and follow-ups.
  - Additional notes: Ensure CLI snapshot parity monitored during Stage 5c; document any visual diffs.

## Stage 4 Execution Log (Prerequisites)

- _All Stage 4 lanes completed; see Stage 3 summary._

### Lane 4a — Helper finalisation (Complete)

- [x] Tests/commands: `npx jest --runTestsByPath src/tests/utils/chainable-string-utils.test.ts`

### Lane 4b — Build/navigation remediation (Complete)

- [x] Tests/commands: `npm run phase6-health`

### Lane 4c — Navigation prep (Complete)

- [x] Tests/commands: `npx jest --runTestsByPath src/interfaces/navigation/__tests__/navigation-system.test.ts`

## Stage 5 Execution Log (Living Stage)

### Lane 5a — CLI adapters & menus

- [x] Status checkbox
- Scope & tasks:
  - Migrate CLI adapters, CLI entry, and interactive menus to chainable string utils.
- Tests/commands:
  - `npx jest --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts`
  - `npx jest --runTestsByPath src/tests/utils/chainable-string-utils.test.ts`
- Contingencies / notes:
  - Monitor CLI snapshot parity; log differences.

### Lane 5b — Navigation width & borders

- [x] Status checkbox
- Scope & tasks:
  - Update navigation width calculators and border renderers to chainable utils.
- Tests/commands:
  - `npx jest --runTestsByPath src/interfaces/navigation/__tests__/navigation-system.test.ts`
- Contingencies / notes:
  - Ensure width calculations align with Display/Window Utils updates.

### Lane 5c — Layout engines & terminal UI components

- [x] Status checkbox
- Scope & tasks:
  - Refactor universal layout engine, content layout system, terminal UI components.
- Tests/commands:
  - `npx jest --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts`
  - `npx jest --runTestsByPath src/tests/utils/chainable-string-utils.test.ts`
- Contingencies / notes:
  - Capture CLI snapshots before/after migrations.

### Lane 5d — Phase 6 scripts & validation harnesses

- [x] Status checkbox
- Scope & tasks:
  - Update Phase 6 scripts and validation harness to rely on chainable string utils.
- Tests/commands:
  - `npm run phase6-health`
  - `npm run phase6-validation`
- Contingencies / notes:
  - Monitor health scores; revert to Stage 3 if new issues found.

### Validation Artefacts & Commands (summary)

- `npx jest --runTestsByPath src/tests/utils/chainable-string-utils.test.ts`
- `npx jest --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts`
- `npx jest --runTestsByPath src/interfaces/navigation/__tests__/navigation-system.test.ts`
- `npm run phase6-health`

### Adjustments & Additional Consumers

- Documented CLI snapshot adjustments post Stage 5c.

### Issues Encountered & Mitigations

- Phase 6 mock harness validated; Haruspex dependency remains skipped by default.

### Coordination Notes / Blockers

- None post Stage 5 completion.

## Stage 6 Close-Out

- **Date**: 2025-10-02T19:59:00Z
- Final validation summary:
  - Re-ran `npx jest --no-cache --runInBand --detectOpenHandles --forceExit --runTestsByPath src/tests/utils/chainable-string-utils.test.ts` to confirm leak-free harness behaviour.
  - Re-ran `npx jest --no-cache --runInBand --detectOpenHandles --forceExit --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts src/interfaces/navigation/__tests__/navigation-system.test.ts` to validate CLI + navigation migrations.
  - Executed `npm run phase6-health` and `npm run phase6-validation`; health check scored 100%, full validation produced new reports under `Templum/validation-reports/phase6-validation-2025-10-02T18-59-24-385Z.{json,html,md}` with performance regression score 67/100 (existing warning).
- Remaining follow-ups or TODOs:
  - Snapshot parity follow-up if CLI visuals change.
  - Investigate Phase 6 performance regression warning (67/100 score) with performance owners before closing Cohort A.
- Evidence links:
  - Activity log entry 2025-10-02 Stage 6 hand-off refresh; tracker updates; validation reports noted above.
