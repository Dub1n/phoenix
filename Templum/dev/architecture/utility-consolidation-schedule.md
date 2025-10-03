---
date: 2025-09-16T13:00:00Z
name: templum-utility-consolidation-schedule
TASK-ID: ['TASK-ARCH-005-SCHED']
category: architecture-operations
status: ['[ ]']
tags: ['utility-consolidation', 'schedule', 'cohort-planning']
dependencies: ['utility-consolidation-playbook', 'utility-consolidation-onboarding']
---

# Utility Consolidation Execution Schedule

## Execution Grid — Cohort A (Data Management)

[10](utility-consolidation-plans/pattern-10.md)
[11](utility-consolidation-plans/pattern-11.md)
[12](utility-consolidation-plans/pattern-12.md)

| Stage | Pattern 10          | Pattern 11          | Pattern 12          |
| ----- | ------------------- | ------------------- | ------------------- |
| 1     | [x]                 | [x]                 | [x]                 |
| 2     | [x]                 | [x]                 | [x]                 |
| 3     | [x]                 | [x]                 | [x]                 |
| 4     | [x]a [x]b           | [x]a [x]b [x]c      | [x]a [x]b           |
| 5A    | [x]                 | [x]                 | [x]                 |
| 5B    | [x]                 | [x]                 | [x]                 |
| 6     | [x]a [x]b [x]c [x]d | [x]a [x]b [x]c [x]d | [x]a [x]b [x]c [x]d |
| 7     | [x]                 | [x]                 | [x]                 |
| C     | [x]                 | [x]                 | [x]                 |

## Execution Grid — Cohort B (Display & Terminal)

[5](utility-consolidation-plans/pattern-5.md)
[6](utility-consolidation-plans/pattern-6.md)
[7](utility-consolidation-plans/pattern-7.md)

| Stage | Pattern 5           | Pattern 6           | Pattern 7           |
| ----- | ------------------- | ------------------- | ------------------- |
| 1     | [x]                 | [x]                 | [x]                 |
| 2     | [x]                 | [x]                 | [x]                 |
| 3     | [x]                 | [x]                 | [x]                 |
| 4     | [x]a [x]b [x]c      | [x]a [x]b [x]c      | [x]a [x]b [x]c      |
| 5A    | [x]                 | [x]                 | [x]                 |
| 5B    | [x]                 | [x]                 | [x]                 |
| 6     | [x]a [x]b [x]c [x]d | [x]a [x]b [x]c [x]d | [x]a [x]b [x]c [x]d |
| 7     | [ ]                 | [ ]                 | [ ]                 |
| C     | [ ]                 | [ ]                 | [ ]                 |

- 2025-10-10: Stage 5 alignment completed for Cohort B — see `Templum/dev/architecture/display-stack-alignment.md` for the shared spec, approvals, and Stage 6 gating checklist.

## Purpose

Give coordinators an initial cohort plan that balances throughput with low collision risk. Use this as a living schedule alongside the playbook; update statuses and assignments as stages progress.

## Scheduling Principles

- Limit each active cohort to utilities that target the same category (reduces cross-file churn).
- Allow **Stage 1** work to run in parallel for up to three patterns; pause before Stage 2 until downstream files are clear.
- Only two utilities may sit in **Stage 2** simultaneously. Begin the next utility’s Stage 2 only after an existing one advances to Stage 3.
- Treat Stage **3** as the hub for Stage 4 readiness: break prerequisites into parallel Stage 4a/4b/4c lanes, list them in this schedule using `[ ]`, `[~]`, `[x]`, or `[B]`, and keep the plan/playbook entries in sync.
- Stage **3** must show all Stage 4 lanes at `[x]` before Stage 5 alignment begins; verify the pattern plan handoff block is complete first.
- Stage **5** captures cross-pattern alignment and pattern preparation; do not advance any cohort into Stage 6 until the Stage 5 coordinator publishes the shared spec and all patterns acknowledge it.
- Record Stage 5 progress with `C[...]` (cohort alignment) and `P[...]` (pattern prep) in each cell. Both markers must be `[x]` before a Stage 6 lane can start.
- Mark `P[x]` only after the Stage 5B agent has executed the full gating battery, attached evidence links in the plan/activity log, and confirmed every Stage 6 lane is unblocked; until then use `[~]` to signal remaining prep work.
- Stage **6** is the living stage. Only one utility per cohort should advance into Stage 6 migrations at a time, but completed lanes stay checked while new blockers are routed back through Stage 3. If validation hinges on a parallel lane, leave the completed marker at `[x]` and annotate the dependency rather than downgrading status.
- Hand-offs occur after Stages 1, 2, 3, and 5. Each hand-off requires an updated plan (`utility-consolidation-plans/pattern-{{Pattern}}.md`) and activity-log entry.

## Cohort Overview

- **Cohort A — Data Management**
  - Pattern 12: String Utils (`chainable-string-utils`)
  - Pattern 10: Type Guards (`type-guards`)
  - Pattern 11: Serialization Utils (`serialization-utils`)
- **Cohort B — Display & Terminal**
  - Pattern 5: Display Utils (`display-utils`)
  - Pattern 6: Terminal Formatter (`terminal-formatter`)
  - Pattern 7: Theme/Window Utils (`theme-utils` / `window-utils`)
- Future cohorts will follow once Cohorts A and B complete Stage 7; replicate the pattern of three utilities per batch aligned by category.

## Updating the Schedule

- After each Stage 1 hand-off, add a note under the applicable row linking to the plan file and activity-log timestamp.
- When a utility advances to Stage 3, list each Stage 4 lane in the cell (e.g., `4a[x] helpers`, `4b[~] build remediation`). Agents own keeping their lane status accurate using `[ ]` (not started), `[~]` (in progress), `[x]` (complete), or `[B]` (blocked, with the blocker noted in the activity log).
- When a Stage 4 lane finishes, flip its glyph to `[x]` here, in the pattern plan, and in `safe-consolidation-candidates.md`. If a lane becomes blocked, mark `[B]`, capture the issue in the activity log, and revisit Stage 3 planning.
- Before a utility advances to Stage 6, confirm Stage 5 alignment is complete across the cohort. Document alignment status in this schedule by noting the shared-spec owner inside the Stage 5 cell.
- When a utility advances to Stage 6, verify that no other cohort is scheduled to migrate the same consumers; reschedule if clashes emerge. Leave previously completed lanes checked while new blockers route back through Stage 3.
- Upon closing a cohort, archive a brief retrospective entry in the activity log referencing this schedule (e.g., “Cohort A closed — schedule updated to reflect completion”).
- 2025-10-02: Pattern 12 Stage 4b remediation complete — TypeScript build and navigation Jest suites now passing; `npm run phase6-health` now succeeds using the mock-backed `phoenix-code-lite` `start:service` (delegates to `Templum/tests/integration/mocks/pcl-mock-service.ts` while Haruspex stays skipped by default).
- 2025-10-02: Pattern 11 Stage 4b logging bridge shipped — shared helper (`backend/backend-serialization-log.ts`) now emits serialization warnings via centralized logger; coverage captured in `src/tests/backend/backend-serialization-log.test.ts`.
- 2025-10-02: Pattern 11 Stage 4a schema/default lane complete — `serialization-registry` schemas + default builders merged with harness `src/tests/backend/serialization-registry-harness.test.ts`; full service-discovery suite still pending refit of HTTP response mocks.
- 2025-10-02: Pattern 5 Stage 4c coordination lane complete — Display/Terminal/Window width + separator defaults reconciled; shared `columnsProvider` mock helper (`Templum/src/tests/helpers/display-columns-provider.ts`) now referenced by regression suites.
- 2025-10-03: Pattern 11 Stage 4c CLI/observability fallbacks landed — shared payload builders + observability fallback wiring validated via targeted Jest runs (`serialization-utils.test.ts`, `comprehensive-backend-validation.test.ts --testNamePattern "Stage 4c" --forceExit`). Stage 3 row updated to `4c[x]` pending Stage 6a kickoff.
- 2025-10-02: Pattern 10 Stage 6b orchestration planning assigned to Codex — Stage 3 plan updated with core module guard consolidation tasks/tests; schedule row stays `6b[ ]` until Stage 6 migrations begin.
- 2025-10-02: Pattern 10 Stage 6c plan locked — interface/navigation lane details added (CLI adapter, navigation stack, terminal UI theme integrity) with validation commands (`CI=1 npm test -- navigation-system`, `CI=1 npm test -- interface-adapter-integration`, `CI=1 npm test -- type-guards`); Stage 6 row remains `6c[ ]` until executor is assigned.
- 2025-10-02: Patterns 10–12 Stage 3 sections now point to Stage 4 checklists and Stage 6 lane ownership for actionable tasks/tests; keep schedule glyphs aligned with Stage 4 lane status and Stage 6 lane ownership going forward.
- If additional cohorts are required, clone the grid structure, align patterns by category, and append to this document. Apply the same Stage 4 lane notation for new Stage 3 entries.
- 2025-10-03: Pattern 10 Stage 6d plan refreshed — session + shared utility migrations queued; see `utility-consolidation-plans/pattern-10.md` Stage 6d notes before commencing Stage 6.
- 2025-10-02: Pattern 6 Stage 4a provider lane complete — formatter DI seam (`configureFormatter`/`resetFormatterConfiguration`) finalised, Display/Window utils reset/configure hooks added, and ASCII border fallbacks aligned with capability detection. Validated via `npm run test:ci -- --runTestsByPath src/tests/utils/terminal-formatter.test.ts --runInBand --forceExit`.
- 2025-10-07: Pattern 6 Stage 4c coordination complete — shared formatter spacing constants exported and consumed by Display/Window helpers; Jest suites run with `--runInBand --no-cache --forceExit` to satisfy leak guard while validating separator alignment.
- 2025-10-02: Pattern 12 Stage 7 hand-off revalidated with leak-guard harness — string utils + CLI/navigation suites and `phase6-health`/`phase6-validation` all green; Stage C now `[x]`. Performance regression monitor still reports score 67/100 (track with performance owners).
- 2025-10-02: Pattern 11 Stage hand-off executed — serialization unit + menu adapter suites, backend Phase 2 subset, and Phase 6 health/validation rerun; readiness holds (health 100%, validation 92%) while performance monitor stays at 67/100 and `phase6-services` requires `start|stop|status`. Plan, tracker, and progress doc updated for downstream owners.
- 2025-10-07: Pattern 10 Stage 7 revalidated after Stage 6 interface/session cleanup — all targeted leak-guard suites green (`CI=1 npm run test:ci --runTestsByPath …`, `CI=1 npm test -- --runTestsByPath tests/utils/type-guards.test.ts --runInBand`); Cohort A Stage 7 glyph flipped to `[x]`.
- 2025-10-07: Cohort A close-out logged — Stage C glyphs confirmed `[x]` after Patterns 10–12 cleared Stage 6; see `utility-consolidation-activity-log.md` entry dated 2025-10-07 for retrospective details.
- 2025-10-09: Cohort B Stage 5 prep captured — `display-stack-alignment.md` pre-populated with Stage 4 baselines and Stage 5 coordinator assigned (closed out by the 2025-10-10 alignment entry above).
