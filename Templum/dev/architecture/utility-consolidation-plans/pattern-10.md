# Utility Consolidation Plan — Pattern 10

## Stage 1 Snapshot

- **Utility / Pattern**: Type Guards Utility
- **Agent**: Codex
- **Date**: 2025-10-01T13:30:00Z
- **Primary References**: `Templum/dev/architecture/safe-consolidation-candidates.md` (Type Guards entry), `Templum/dev/patterns/utilities/data/type-guards.md`, `Templum/dev/architecture/redundancy-report.md`, `Templum/dev/architecture/component-dependency-map.md`

### Intended Work Scope

- Tests to create/update:
  - `Templum/tests/utils/type-guards.test.ts` — coverage for primitives, complex guards, property confidence checks
  - `Templum/tests/backend/service-discovery.test.ts` — extend cases that rely on consolidated guards
  - `Templum/tests/interfaces/navigation/__tests__/navigation-system.test.ts` — regression coverage for selector/navigation guard usage
- Utility modules to touch:
  - `Templum/src/utils/type-guards.ts`
  - `Templum/src/utils/index.ts`
- Planned consumer migration order:
  1. Backend discovery + router modules (`Templum/src/backend/service-discovery.ts`, `Templum/src/backend/backend-service-router.ts`, `Templum/src/backend/service-discovery-validator.ts`)
  2. Core registries/config managers (`Templum/src/core/adapter-registry.ts`, `Templum/src/core/templum-config-manager.ts`, `Templum/src/core/universal-interface-manager.ts`)
  3. Interface & navigation stack (`Templum/src/interfaces/cli-adapter.ts`, `Templum/src/interfaces/cli-display-consistency-engine.ts`, `Templum/src/interfaces/navigation/selector-updater.ts`, `Templum/src/interfaces/terminal-ui-components.ts`, `Templum/src/navigation/skin-navigation-parser.ts`)
  4. Session + supporting utilities/tests (`Templum/src/session/templum-universal-session-manager.ts`, `Templum/src/utils/service-utils.ts`, `Templum/src/utils/terminal-formatter.ts`, `Templum/src/utils/protocol-utils.ts`)
- Guardrails / constraints to enforce:
  - Preserve dependency injection boundaries and keep helpers pure/composable
  - Route assertion failures through `TemplumError` + logger utilities; avoid direct console usage
  - Keep functions <30 lines and file <400 lines; extract helpers if surface grows
  - Maintain minimal-footprint API surface to support tree-shaking and avoid interface-specific coupling

### Coordination Notes

- Dependent utilities / agents:
  - Monitor overlap with validator/serialization utility work; coordinate if migrations touch shared files.
- Shared files to coordinate:
  - `Templum/src/utils/index.ts`
  - Backend + interface test suites that may be under parallel refactors
- Risks or assumptions:
  - No hidden legacy `type-guards` export should remain elsewhere (validate during Stage 2)
  - Confirm Jest setup hooks (`Templum/tests/setup.ts`) have no implicit guard helpers before rewiring

## Stage 2.5 — Migration Orchestration & Agent Tasking

- **Date**: 2025-10-01T13:50:00Z
- Helpers / prerequisites before migrations (0a and 0b may proceed in parallel once branches are cut):
  - [ ] Implement `TypeGuards.isPlainObject` (Phase 0a)
  - [ ] Implement `SemanticValidators.hasFunction` (Phase 0a)
  - [ ] Implement `SemanticValidators.hasArrayOf` (Phase 0a)
  - [ ] Extend `Templum/tests/utils/type-guards.test.ts` to cover new helpers (Phase 0b)
  - [ ] Verify `npm test -- type-guards` passes after helper work (Phase 0b)
- Phase assignments (update agent names when delegated):
  - [ ] **Phase 0a — Helper Implementation** (Agent TBD): Add `isPlainObject`, `hasFunction`, `hasArrayOf`, ensure typings/docs updated.
  - [ ] **Phase 0b — Helper Validation & Tests** (Agent TBD): Extend utility Jest suite, run `npm test -- type-guards`, capture results.
  - [ ] **Phase 1 — Backend Migration** (Agent TBD): Migrate `service-discovery.ts`, `backend-service-router.ts`, `service-discovery-validator.ts`; extend backend suites; run `npm test -- service-discovery` & `npm test -- type-guards`.
  - [ ] **Phase 2 — Core Orchestration** (Agent TBD): Refactor `core/adapter-registry.ts`, `templum-config-manager.ts`, `universal-interface-manager.ts`; run `npm test -- adapter-registry` & `npm test -- type-guards`.
  - [ ] **Phase 3 — Interface & Navigation** (Agent TBD): Update CLI/navigation modules; run `npm test -- navigation-system` & `npm test -- type-guards`.
  - [ ] **Phase 4 — Session & Shared Utilities** (Agent TBD): Update session manager/shared utils; run `npm test -- session-manager` (or `npm test -- terminal-formatter`) & `npm test -- type-guards`.
- Coordination instructions:
  - Before starting your phase, confirm Phase 0a/0b checkboxes for tasks impacting your scope are complete (0a and 0b can run in parallel but 0b should rerun tests after pulling latest helper changes), review any blockers noted for your phase, and pull the latest hub plan/tracker updates. Phases 1–4 may proceed in parallel once both Phase 0a and Phase 0b are complete.
  - Each phase appends a Stage 3 entry to `utility-consolidation-activity-log.md`, updates `safe-consolidation-candidates.md`, and notes test commands executed.
  - Agents operate in isolated environments; rely on this plan for hand-offs and leave TODO comments plus notes below when future phases need follow-up.
  - Flag helper gaps or blockers in **Coordination Notes / Blockers** and pause downstream phases until resolved; add corresponding entries to the activity log.

## Stage 3 Execution Log

### Phase Completion Checklist

- [ ] Phase 0a — Helper implementation complete (helpers committed)
- [ ] Phase 0b — Helper validation/tests complete (`npm test -- type-guards`)
- [ ] Phase 1 — Backend migration complete (tests: `npm test -- type-guards`, `npm test -- service-discovery`)
- [ ] Phase 2 — Core orchestration migration complete (tests: `npm test -- type-guards`, `npm test -- adapter-registry`)
- [ ] Phase 3 — Interface & navigation migration complete (tests: `npm test -- type-guards`, `npm test -- navigation-system`)
- [ ] Phase 4 — Session & utilities migration complete (tests: `npm test -- type-guards`, `npm test -- session-manager` / `npm test -- terminal-formatter`)

### Validation Artefacts & Commands

- `npm test -- type-guards`
- `npm test -- service-discovery`
- `npm test -- adapter-registry`
- `npm test -- navigation-system`
- `npm test -- session-manager`

### Adjustments & Additional Consumers

- ...

### Issues Encountered & Mitigations

- ...

### Coordination Notes / Blockers

- ...

## Stage 4 Close-Out

- **Date**: {{YYYY-MM-DD'T'HH:MM:SS'Z'}}
- Final validation summary:
  - Tests/scripts executed, coverage insights
- Remaining follow-ups or TODOs:
  - ...
- Evidence links:
  - Activity log entry, PR, screenshots, etc.

_Copy this template to `pattern-{{Pattern}}.md` and fill sections as the work progresses._
