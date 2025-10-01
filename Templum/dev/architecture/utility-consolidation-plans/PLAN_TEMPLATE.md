# Utility Consolidation Plan — Pattern {{Pattern}}

## Stage 1 Snapshot

- **Utility / Pattern**: {{Pattern Name}}
- **Agent**: {{Agent}}
- **Date**: {{YYYY-MM-DD'T'HH:MM:SS'Z'}}
- **Primary References**: `safe-consolidation-candidates.md` section, pattern doc path, redundancy metrics

### Intended Work Scope

- Tests to create/update:
  - `tests/...`
- Utility modules to touch:
  - `src/utils/...`
- Planned consumer migration order:
  1. `src/...`
  2. `src/...`
- Guardrails / constraints to enforce:
  - SOLID threshold notes, DI, logger integration, etc.

### Coordination Notes

- Dependent utilities / agents:
- Shared files to coordinate:
- Risks or assumptions:

## Stage 2.5 — Migration Orchestration & Agent Tasking

- **Date**: {{YYYY-MM-DD'T'HH:MM:SS'Z'}}
- Helpers / prerequisites before migrations:
  - [ ] {{Helper or follow-up}}
- Phase assignments (update agent names as work is delegated):
  - [ ] **Phase 0a — Helper Finalisation** (Agent ___): `scope/tests`
  - [ ] **Phase 0b — Remediation Blockers** (Agent ___): `scope/tests`
  - [ ] **Phase 0c — (Add more as needed for parallel blockers)** (Agent ___): `scope/tests`
  - [ ] **Phase 1 — Backend Migration** (Agent ___): `scope/tests`
  - [ ] **Phase 2 — Core Orchestration** (Agent ___): `scope/tests`
  - [ ] **Phase 3 — Interface & Navigation** (Agent ___): `scope/tests`
  - [ ] **Phase 4 — Session & Shared Utilities** (Agent ___): `scope/tests`
- Coordination instructions:
  - Logging expectations per phase (activity log, tracker updates)
  - Shared test suites / files to monitor
  - Contingencies or fallback actions (e.g., helper gaps, shared module blocks)
  - Contingency trigger checklist (what sends the plan back to Stage 2.5, who owns the refresh, where to log it)
  - Clarify that Phase 0x remediations can run in parallel where work streams are independent; document sequencing constraints so downstream phases know which 0x boxes must be checked before they proceed.
  - Update the cohort schedule cell for this pattern with Phase 0 lane names/statuses so parallel agents can coordinate.

## Stage 3 Execution Log (Living Phase)

### Phase Completion Checklist

- [ ] Phase 0 — Helper Finalisation complete (Stage 2.5 prerequisites met)
- [ ] Phase 1 — Backend migration complete (tests run: ___)
- [ ] Phase 2 — Core orchestration migration complete (tests run: ___)
- [ ] Phase 3 — Interface & navigation migration complete (tests run: ___)
- [ ] Phase 4 — Session & utilities migration complete (tests run: ___)
- _If any checkbox is blocked, set the Stage 2.5 status back to `[~]`, capture the blocker below, and refresh the plan before checking the item again; previously completed phases stay complete unless the updated plan says otherwise._

### Validation Artefacts & Commands

- `npm test -- ...`
- `npm test -- ...`

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
