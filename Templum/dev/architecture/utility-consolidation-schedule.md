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

| Slot A                         | Slot B                                | Slot C                         |
| ------------------------------ | ------------------------------------- | ------------------------------ |
| [x] P:10, S:0–1                | [x] P:11, S:0–1                       | [x] P:12, S:0–1                |
| -                              | -                                     | [x] P:12, S:2                  |
| -                              | -                                     | [x] P:12, S:2.5 (0a[x], 0b[x]) |
| [x] P:10, S:2                  | -                                     | [x] P:12, S:3                  |
| [x] P:10, S:2.5 (0a[x], 0b[x]) | [x] P:11, S:2                         | [x] P:12, S:4                  |
| [~] P:10, S:3                  | [~] P:11, S:2.5 (0a[~], 0b[~], 0c[ ]) | -                              |
| [ ] P:10, S:4                  | [ ] P:11, S:3                         | [ ] P:12, S:C                  |
| [ ] P:10, S:C                  | [ ] P:11, S:4                         | [ ] A Closeout                 |
| -                              | [ ] P:11, S:C                         | -                              |

## Execution Grid — Cohort B (Display & Terminal)

Begin once Cohort A reaches the “Cohort A Closeout” row.

| Slot A                        | Slot B         | Slot C         |
| ----------------------------- | -------------- | -------------- |
| [ ] P:5, S:0–1                | [ ] P:6, S:0–1 | [ ] P:7, S:0–1 |
| [ ] P:5, S:2                  | -              | -              |
| [ ] P:5, S:2.5 (0a[ ], 0b[ ]) | -              | -              |
| [ ] P:5, S:3                  | [ ] P:6, S:2   | [ ] P:7, S:2   |
| [ ] P:5, S:4                  | [ ] P:6, S:2.5 | [ ] P:7, S:3   |
| [ ] P:5, S:C                  | [ ] P:6, S:4   | [ ] P:7, S:3   |
| [ ] B Closeout                | [ ] P:6, S:C   | [ ] P:7, S:4   |
| -                             | -              | [ ] P:7, S:C   |

## Purpose

Give coordinators an initial cohort plan that balances throughput with low collision risk. Use this as a living schedule alongside the playbook; update statuses and assignments as stages progress.

## Scheduling Principles

- Limit each active cohort to utilities that target the same category (reduces cross-file churn).
- Allow **Stage 0–1** work to run in parallel for up to three patterns; pause before Stage 2 until downstream files are clear.
- Only two utilities may sit in **Stage 2** simultaneously. Begin the next utility’s Stage 2 only after an existing one advances to Stage 2.5.
- Treat Stage **2.5** as the hub for Phase 0 work: break remediation tasks into parallel Phase 0a/0b/0c lanes, list them in this schedule using `[ ]`, `[~]`, `[x]`, or `[B]`, and keep the plan/playbook entries in sync.
- Stage **2.5** must show all Phase 0 lanes at `[x]` before any Stage 3 migrations begin; verify the pattern plan checkboxes are ticked first.
- Stage **2.5** must show all Phase 0 lanes at `[x]` before any Stage 3 migrations begin; verify the pattern plan checkboxes are ticked first. Phases 1–4 can proceed in parallel once Phase 0 lanes are complete—each agent keeps their glyph at `[x]` when their deliverables/tests are done and documents any dependencies on sibling phases in plan/log notes.
- Stage **3** is a living phase. Only one utility per cohort should advance into Stage 3 migrations at a time, but completed phases stay checked while new blockers are routed back through Stage 2.5. If validation hinges on a parallel phase, leave the completed phase marker at `[x]` and annotate the dependency rather than downgrading status.
- Hand-offs occur after Stages 1, 2, 2.5, and 3. Each hand-off requires an updated plan (`utility-consolidation-plans/pattern-{{Pattern}}.md`) and activity-log entry.

## Cohort Overview

- **Cohort A — Data Management**
  - Pattern 12: String Utils (`chainable-string-utils`)
  - Pattern 10: Type Guards (`type-guards`)
  - Pattern 11: Serialization Utils (`serialization-utils`)
- **Cohort B — Display & Terminal**
  - Pattern 5: Display Utils (`display-utils`)
  - Pattern 6: Terminal Formatter (`terminal-formatter`)
  - Pattern 7: Theme/Window Utils (`theme-utils` / `window-utils`)
- Future cohorts will follow once Cohorts A and B complete Stage 4; replicate the pattern of three utilities per batch aligned by category.

## Updating the Schedule

- After each Stage 1 hand-off, add a note under the applicable row linking to the plan file and activity-log timestamp.
- When a utility advances to Stage 2.5, list each Phase 0 lane in the cell (e.g., `0a[x] helpers`, `0b[~] build remediation`). Agents own keeping their lane status accurate using `[ ]` (not started), `[~]` (in progress), `[x]` (complete), or `[B]` (blocked, with the blocker noted in the activity log).
- When a Phase 0 lane finishes, flip its glyph to `[x]` here, in the pattern plan, and in `safe-consolidation-candidates.md`. If a lane becomes blocked, mark `[B]`, capture the issue in the activity log, and revisit Stage 2.5 planning.
- When a utility advances to Stage 3, verify that no other cohort is scheduled to migrate the same consumers; reschedule if clashes emerge. Leave previously completed phases checked while new blockers route back through Stage 2.5.
- Upon closing a cohort, archive a brief retrospective entry in the activity log referencing this schedule (e.g., “Cohort A closed — schedule updated to reflect completion”).
- 2025-10-02: Pattern 12 Phase 0b remediation complete — TypeScript build and navigation Jest suites now passing; `npm run phase6-health` now succeeds using the mock-backed `phoenix-code-lite` `start:service` (delegates to `Templum/tests/integration/mocks/pcl-mock-service.ts` while Haruspex stays skipped by default).
- If additional cohorts are required, clone the grid structure, align patterns by category, and append to this document. Apply the same Phase 0 lane notation for new Stage 2.5 entries.
