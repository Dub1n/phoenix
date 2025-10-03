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

## Stage 2 Snapshot (Optional)

- Implementation/Test summary:
  - ...
- Commands executed:
  - `npm test -- ...`
- Outstanding issues before Stage 3:
  - ...

## Stage 3 — Migration Orchestration & Coordination

- **Date**: {{YYYY-MM-DD'T'HH:MM:SS'Z'}}
- Readiness Summary:
  - Stage 4 prerequisites defined — see Stage 4 lanes for detailed checklist/tests.
  - Stage 5 alignment owner identified — see Stage 5 section for shared-spec expectations.
  - Stage 6 lanes assigned — see Stage 6 subsections for scope and validation commands.
  - Contingency triggers noted; update this summary if new blockers surface.
- Coordination Snapshot:
  - Tracker status: {{e.g., `safe-consolidation-candidates.md` Stage 3 `[x]`}}
  - Activity log entry: {{timestamp/link}}
  - Additional notes (optional): {{brief risks, cross-team coordination}}

## Stage 4 Execution Log (Prerequisites)

- _Complete all Stage 4 lanes before touching consumer migrations. Revert to Stage 3 if any lane blocks._

### Lane 4a — {{Helper / remediation scope}} (Agent ___)

- Tasks:
  - ...
- Tests/commands:
  - `CI=1 npm test -- ...`

### Lane 4b — {{Environment / fixture prep}} (Agent ___)

- Tasks:
  - ...
- Tests/commands:
  - `CI=1 npx jest --runTestsByPath ...`

### Lane 4c — {{Coordination / shared dependency}} (Agent ___)

- Tasks:
  - ...
- Tests/commands:
  - `CI=1 npm test -- ...`

### Additional lanes as required

- [ ] Lane 4? — {{Purpose}} (Agent ___)
  - Tasks:
    - ...
  - Tests/commands:
    - ...

### Stage 4 Handoff Block

- **Shared constants / defaults**: {{terminal width, separators, etc.}}
- **Dependency seams**: {{logger, formatter, columns provider expectations}}
- **Reusable test helpers**: {{path to mocks/helpers}}
- **Outstanding risks**: {{open issues for Stage 5}}
- **Ready for Stage 5 alignment?**: `[ ]` / `[x]` — notes/owner acknowledgement

## Stage 5 — Cohort Alignment & Pattern Preparation

### Stage 5A — Cohort Alignment Snapshot

- **Coordinator**: {{Agent handling shared spec}}
- **Alignment artefact**: `Templum/dev/architecture/{{alignment-file}}.md`
- **Inputs reviewed**: Stage 4 handoff blocks from Patterns {{list}}
- **Summary of agreed values**:
  - Terminal width defaults: ...
  - Separator/formatting: ...
  - DI seams / providers: ...
  - Test helpers: ...
- **Shared Dependencies Matrix** (copy rows from cohort spec and keep in sync):

| Artefact | Owner (Pattern) | Stage checkpoints | Collision watch / notes |
| -------- | --------------- | ----------------- | ----------------------- |
| ...      | ...             | ...               | ...                     |
|          |                 |                   |                         |

- **Approvals / acknowledgements**:
  - Pattern {{X}} owner: `[ ]` / `[x]` — {{initials/date}}
  - Pattern {{Y}} owner: `[ ]` / `[x]`
- **Outstanding risks / follow-ups**:
  - ...
- **Activity log entry**: {{timestamp/link}}

### Stage 5B — Pattern Preparation

- **Stage 6 readiness notes**:
  - Lane checklist (`Ready`/`Blocked`) with gating suites executed for each lane: ...
  - DI seams/config resets confirmed (include who signed off): ...
  - Coordination requirements / owner acknowledgements: ...
  - Shared Dependencies Matrix rows relevant to this pattern copied/linked here: ...
- **Executed evidence**:
  - `npm run test -- ...` (link to logs under `tmp/stage6/{{pattern}}/` or equivalent)
- **Risks / TODOs before Stage 6**:
  - ...
- **Completion gate**: Stage 5B remains open until every Stage 6 lane is `Ready` with evidence attached or the blocker is escalated back through Stage 3.
- **Activity log entry**: {{timestamp/link}}

## Stage 6 Execution Log (Living Stage)

- _Claim a Stage 6 lane, execute to completion, and keep tracker glyphs aligned. Return to Stage 3 if new prerequisites emerge (see playbook Stage 6 guidance on triggers such as missing DI/teardown hooks, new shared fixtures, or cross-utility constant drift)._

### Lane 6a — Backend Migration

- [ ] Status checkbox (mark `[x]` when deliverables/tests complete)
- Scope & tasks:
  - ...
- Tests/commands:
  - `CI=1 npm test -- ...`
- Contingencies / notes:
  - ...

### Lane 6b — Core Orchestration

- [ ] Status checkbox
- Scope & tasks:
  - ...
- Tests/commands:
  - ...
- Contingencies / notes:
  - ...

### Lane 6c — Interface & Navigation

- [ ] Status checkbox
- Scope & tasks:
  - ...
- Tests/commands:
  - ...
- Contingencies / notes:
  - ...

### Lane 6d — Session & Shared Utilities

- [ ] Status checkbox
- Scope & tasks:
  - ...
- Tests/commands:
  - ...
- Contingencies / notes:
  - ...

### Validation Artefacts & Commands (summary)

- `npm test -- ...`
- `npm test -- ...`

### Adjustments & Additional Consumers

- ...

### Issues Encountered & Mitigations

- ...

### Coordination Notes / Blockers

- ...

## Stage 7 Close-Out

- **Date**: {{YYYY-MM-DD'T'HH:MM:SS'Z'}}
- Final validation summary:
  - Tests/scripts executed, coverage insights
- Remaining follow-ups or TODOs:
  - ...
- Evidence links:
  - Activity log entry, PR, screenshots, etc.

_Copy this template to `pattern-{{Pattern}}.md` and fill sections as the work progresses._
