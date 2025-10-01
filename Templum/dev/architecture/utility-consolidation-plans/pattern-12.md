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

## Stage 2.5 — Migration Orchestration & Agent Tasking

- **Date**: 2025-10-02T11:40:00Z
- Helpers / prerequisites before migrations:
  - [x] Resolve TypeScript build failures surfaced by `npm run phase6-health` (fix typings/export issues in `src/utils/event-utils.ts`, `src/utils/registry-utils.ts`, `src/interfaces/interface-adapter-registry.ts`, `src/utils/protocol-utils.ts`, `src/utils/resilience-utils.ts`, and `src/utils/type-guards.ts`).
  - [x] Restore navigation theming/constructor exports so `npx jest --no-cache --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts src/interfaces/navigation/__tests__/navigation-system.test.ts` passes.
- Phase assignments (living plan — update agent names as work is delegated):
  - [x] **Phase 0 — Helper Finalisation** (Codex): Implement shared StringUtils helpers + chainable API smoke tests.
- [x] **Phase 0b — Build & Navigation Remediation** (Codex): Address TS build failures and navigation theming gaps blocking Phase 3 completion (consider splitting into sub-phases if different agents take the work).
  - [x] **Phase 1 — Backend/Adapter Migrations** (Codex): `src/interfaces/cli-adapter*.ts`, supporting helpers.
  - [x] **Phase 2 — Core Orchestration** (Codex): `src/interfaces/layout-normalizer.ts`, `src/rendering/universal-layout-engine.ts`, `src/rendering/content-layout-system.ts`.
  - [x] **Phase 3 — Interface & Navigation** (Codex): `src/interfaces/navigation/*`, `src/interfaces/terminal-ui-components.ts` (pending Phase 0b validation).
  - [x] **Phase 4 — Scripts & CLI Reporting** (Codex): `src/scripts/run-phase6-integration-validation.ts`, `src/scripts/simple-phase6-validation.ts`.
- Coordination instructions:
  - Phase 0b must complete before Stage 3 can be marked finished; once done, set Stage 2.5 tracker back to `[x]` and notify agents via activity log.
  - Continue logging migrations per phase in activity log; reference this plan section when phases change or new blockers surface.
  - Shared test suites to monitor: `npm run phase6-health`; `npx jest --no-cache --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts src/interfaces/navigation/__tests__/navigation-system.test.ts`.
  - Contingency trigger checklist: any new helper/dependency gap sends us back to Stage 2.5 (update plan, trackers, and log) before phases resume.
  - Phases 1–4 may run in parallel once Phase 0b is complete; communicate in the activity log before touching files owned by other utilities.
  - Update the cohort schedule entry (`utility-consolidation-schedule.md`) with Phase 0 lane statuses (e.g., `0a[x]`, `0b[~]`) whenever this plan changes.

## Stage 3 Updates

- **Date**: 2025-10-02T19:20:00Z
- Adjustments to migration plan:
  - All planned consumers (CLI adapters, navigation stack, renderer engines, Phase 6 scripts) continue to run on the fluent StringUtils surface with no additional refactors needed; Stage 3 is ready for hand-off into Stage 4 validation once external blockers clear.
  - Retained the shared CLI formatter helper for scripts so downstream updates stay DRY; snapshots remain deferred to Stage 4 while we wait on integration health.
  - Phase 0b remediation (build + navigation theming) remains closed; no new helper gaps surfaced during this validation pass.
- Additional consumers identified:
  - None beyond the original list; inventory remains accurate for tail migrations.
- Validation artefacts (tests/scripts run):
  - `cd Templum && npx jest --no-cache --runInBand --runTestsByPath src/tests/utils/chainable-string-utils.test.ts` (utility smoke, warns only when truncation exceeds 30%).
  - `cd Templum && npx jest --no-cache --runInBand --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts src/interfaces/navigation/__tests__/navigation-system.test.ts` (navigation + CLI integration suites green; emits MaxListeners warnings from Commander harness but no failures).
  - `cd Templum && npm run phase6-health` (passes with optional mock harness; Haruspex stays skipped by default while the `phoenix-code-lite` mock service reports health).
- Issues encountered & mitigations:
  - Added a mock-backed `start:service` script (delegating to `Templum/tests/integration/mocks/pcl-mock-service.ts`) so Phase 6 health checks succeed even when Haruspex stays disabled; real backend runs can toggle via env when reinstated.
  - Commander’s repeated Jest invocations trigger benign MaxListeners warnings; noted for future test harness tuning but no behavioural impact.

## Stage 4 Close-Out

- **Date**: 2025-10-02T20:24:00Z
- Final validation summary:
  - `npx jest --no-cache --runInBand --runTestsByPath src/tests/utils/chainable-string-utils.test.ts` (trim/pad/wrap/ellipsis permutations now covered, includes ANSI + double-width cases).
  - `npx jest --no-cache --runInBand --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts src/interfaces/navigation/__tests__/navigation-system.test.ts` (CLI/navigation regressions absent; runtime console warnings unchanged from pre-migration).
  - `npm run phase6-health` (TypeScript build + health suite green after injecting contract validator/response factory dependencies back into `MultiSystemWorkflowOrchestrator`).
- Remaining follow-ups or TODOs:
  - Capture refreshed CLI snapshots if UI teams request static baselines; integration suites currently cover visual parity through assertions but no stored snapshots.
- Evidence links:
  - Activity log entry “2025-10-02 — Chainable String Utils (Pattern 12) — Stage 4”.
  - `Templum/dev/architecture/safe-consolidation-candidates.md` Pattern 12 Stage 4 note.
