---
date: 2025-09-16T12:30:00Z
name: templum-utility-consolidation-playbook
TASK-ID: ['TASK-ARCH-005-PLAYBOOK']
category: architecture-operations
status: ['[T]']
tags: ['utility-consolidation', 'playbook', 'workflow', 'tdd', 'reporting']
dependencies: ['safe-consolidation-candidates', 'utility-consolidation-onboarding', 'architecture-restructuring-plan', 'redundancy-report']
---

# Utility Consolidation Execution Playbook

## Purpose

Provide a repeatable, fail-safe workflow that every utility agent follows when converting pattern specs into implemented, validated utilities. This playbook complements `utility-consolidation-onboarding.md` by focusing on day-to-day execution, reporting, and hand-offs.

## Roles & Scope

- **Audience**: Consolidation agents with full onboarding context and ≥1 pattern assignment at a time.
- **Scope per run**: Exactly one utility (pattern doc + implementation + migrations). Multi-utility efforts require a fresh playbook pass for each utility.
- **Outputs**: Updated pattern spec (if gaps discovered), implemented utility code with TDD coverage, migrated consumers, checklist updates in `safe-consolidation-candidates.md`, activity log entries, and (when milestones complete) updates to `docs/current/progress.md`.

## Stage Overview

1. **Stage 1 — Orientation & Planning**
2. **Stage 2 — Test-First Utility Implementation**
3. **Stage 3 — Migration Orchestration & Coordination**
4. **Stage 4 — Migration Prerequisites**
5. **Stage 5 — Cohort Alignment & Pattern Prep**
6. **Stage 6 — Consumer Migration & Hardening**
7. **Stage 7 — Validation & Reporting**

Agents must pause at stage boundaries for hand-off checkpoints when sessions end or context limits approach.
By default, the hand-off checkpoints are after completion of Stages 1, 2, 3, and 5B (pattern preparation). There is no need to pause mid-stage unless specifically requested.

## Stage 1 — Orientation & Planning

**Inputs**: Assigned utility ID (e.g., Pattern 12), latest docs (`safe-consolidation-candidates.md`, pattern spec, redundancy metrics, dependency maps).

### Orientation Refresh

- Re-read `utility-consolidation-onboarding.md` sections on shared baselines and guardrails.
- Confirm pattern frontmatter complies with `meta/templates/schema/pattern-frontmatter.json`; update before proceeding if not.
- Review `docs/current/testing-guide.md` and note required commands/env setup for suites you will run in downstream stages (especially backend or Phase 6 validations).
- Inspect existing `src/utils` exports and `safe-consolidation` status to avoid duplicate work.

### Planning & Alignment

- Map consumer files using `rg` searches; document paths in the Stage 1 activity-log entry.
- Identify architecture guardrails that apply (logger/error-handler integration, DI boundaries, SOLID thresholds) and note them.
- Draft a concise implementation plan covering:
  - Test files to create/update (under `tests/` or component-specific suites).
  - Utility module structure (`src/utils/<utility>.ts`, export via `src/utils/index.ts`).
  - Migration order for consumers.
- Copy `Templum/dev/architecture/utility-consolidation-plans/PLAN_TEMPLATE.md` to `Templum/dev/architecture/utility-consolidation-plans/pattern-{{Pattern}}.md` and store the plan there, updating it as the work evolves.
- If picking up after another agent, review the latest Stage 1 entry in `utility-consolidation-activity-log.md` before revising the plan.
- If the plan diverges from pattern requirements, update the pattern doc immediately with rationale and cross-link to evidence.
- Add a Stage 1 checklist note in `safe-consolidation-candidates.md` (e.g., “Plan drafted — see utility-consolidation-plans/pattern-{{Pattern}}.md”).

**Outputs**: Stage 1 activity log entry capturing orientation + planning, updated pattern spec (if required), migration/test plan, status note in consolidation doc.

## Stage 2 — Test-First Utility Implementation

**Inputs**: Stage 1 plan, pattern spec, existing utilities for integration.

- Create or extend Jest suites covering every API surface promised by the pattern. Tests must exist before implementation (TDD requirement).
- Implement the utility inside `src/utils/`, wiring dependencies via injection/composition per spec.
- Update `src/utils/index.ts` exports.
- Run targeted tests (`npm test -- <pattern>` or `npm test`) until green. Capture command and result in the Stage 2 activity-log entry.
- Before coding, re-read the Stage 1 plan in `utility-consolidation-plans/pattern-{{Pattern}}.md` and the latest activity-log entry to stay aligned with prior decisions.
- Address lint/type issues encountered; document any temporary skips with a remediation plan.

**Outputs**: Passing unit tests, implemented utility, Stage 2 log entry including executed commands and touched files, tracker update noting Stage 2 completion.

## Stage 3 — Migration Orchestration & Coordination

**Inputs**: Stage 2 activity log/tests, updated pattern plan (`pattern-{{Pattern}}.md`), Stage 1 consumer inventory, helper coverage notes.

- Evaluate the consumer migration surface (backend/core/interface/session groupings) against helper availability; capture any additional utility work required before migrations.
- Confirm Stage 4 prerequisites, owners, and gating tests. Record their existence/status succinctly in Stage 3, but document the actionable checklist inside Stage 4 of the pattern plan (use 4a/4b/4c lanes as needed).
- For each Stage 6 lane (a–d), decide ownership, sequencing, validation commands, contingencies, and helper dependencies; document the actionable work inside the Stage 6 subsections so execution details live in one place.
- Provide a Stage 3 readiness summary that points to the Stage 4 checklist and Stage 6 lane details (e.g., “See Stage 6b for guard consolidation tasks/tests”) and names the Stage 5 alignment owner.
- If helper changes are required, complete them immediately or log a follow-up item with owner/due stage, then reference the corresponding Stage 4 entry.
- Record a Stage 3 entry in `utility-consolidation-activity-log.md` referencing the Stage 4 checklist, Stage 5 alignment plan, Stage 6 lane subsections, helper decisions, and outstanding risks.
- Update trackers (`safe-consolidation-candidates.md`, `utility-consolidation-schedule.md`) noting that detailed tasks reside in Stage 4/Stage 6 and keeping readiness glyphs aligned.

**Outputs**: Stage 3 activity log entry, readiness summary pointing to Stage 4 prerequisites, Stage 5 alignment ownership, and Stage 6 lane checklists, plus tracker checkbox indicating migration plan readiness (Stage 4 lanes referenced from the pattern plan).

## Stage 4 — Migration Prerequisites

**Inputs**: Stage 3 readiness summary, Stage 4 checklist inside `pattern-{{Pattern}}.md`, helper updates/tests.

- Complete Stage 4 lanes (e.g., 4a helper remediation, 4b environment/setup, 4c coordination) before touching consumer migrations.
- Mark checkboxes/tests in the plan as they pass; keep `utility-consolidation-schedule.md` and `safe-consolidation-candidates.md` aligned with each lane’s status (`[ ]`, `[~]`, `[x]`, `[B]`).
- If any lane blocks, revert to Stage 3 to refresh the readiness summary and reassign work before resuming.
- Capture evidence (commands, fixtures, notes) in the Stage 4 activity-log entry so subsequent agents can audit prerequisites quickly.
- Populate the Stage 4 handoff block in the pattern plan with consolidated constants, DI seams, test helpers, and risks for Stage 5.

**Outputs**: Stage 4 lanes `[x]`, Stage 4 handoff block completed inside the pattern plan, trackers referencing that block, Stage 4 log entry describing gating tests and helper readiness.

## Stage 5 — Cohort Alignment & Pattern Preparation

Stage 5 now runs in two passes. Complete Stage 5A (cohort alignment) before Stage 5B (pattern preparation). No Stage 6 lane may start until both passes are complete for every pattern in the cohort.

### Stage 5A — Cohort Alignment

**Inputs**: Stage 3 readiness summaries naming the Stage 5 owner, all Stage 4 handoff blocks for the cohort.

- Assign a Stage 5 coordinator to synthesise Stage 4 artefacts into a shared alignment spec (`Templum/dev/architecture/<shared-file>.md` or equivalent) that captures agreed constants, DI seams, reusable helpers, gating commands, date, and owner acknowledgements.
- Add a **Shared Dependencies Matrix** subsection to the alignment spec enumerating every cross-pattern artefact (constants, helpers, teardown hooks, scripts), its owner, relevant stage checkpoints, and collision-watch notes. Update the matrix whenever Stage 4 or Stage 5 work introduces or changes shared dependencies so downstream lanes have a single source of truth.
- Review each pattern plan’s handoff block; copy authoritative values into the shared spec and back-reference the spec from every plan.
- Record a Stage 5 cohort entry in `utility-consolidation-activity-log.md` summarising decisions, spec location, and open risks.
- Update cohort trackers (`utility-consolidation-schedule.md`, Stage 5 row) and `safe-consolidation-candidates.md` with a “Stage 5 Cohort” marker pointing to the shared spec. Stage 6 must remain blocked until this spec exists with approvals.

**Outputs**: Cohort alignment spec published with approvals, activity-log entry recorded, schedule/safe-consolidation trackers referencing the spec with Stage 5A complete.

### Stage 5B — Pattern Preparation

**Inputs**: Published Stage 5 alignment spec, pattern Stage 4 handoff block, Stage 6 lane definitions.

- Each pattern owner reviews the shared spec and updates their plan’s Stage 5B section with Stage 6 readiness notes: gating suites to rerun, DI seams to verify, coordination owners, teardown/reset expectations, Shared Dependencies Matrix rows relevant to the pattern, and evidence targets per lane.
- Execute (not just schedule) the full gating battery and dry-run verifications required to unblock every Stage 6 lane. Record commands, artefact locations, and residual deltas directly in the pattern plan.
- Iterate inside Stage 5B until every Stage 6 lane is marked `Ready`/`Unblocked` in the plan with attached evidence and no unresolved prerequisites. Any blocker discovered during this loop must route back through Stage 3 before Stage 5B can close.
- Capture a pattern-level Stage 5 entry in `utility-consolidation-activity-log.md` referencing plan updates, executed evidence, and outstanding risks.
- Update `safe-consolidation-candidates.md` and the schedule with a “Stage 5 Pattern” marker only after all Stage 6 lanes are unblocked and evidence links are published. Escalate lingering dependencies via Stage 3 instead of carrying TODOs forward.

**Outputs**: Pattern plans updated with executed Stage 5B readiness evidence, activity-log entries per pattern, trackers marked once Stage 6 lanes are all unblocked, Stage 6 readiness notes and artefact links published.

## Stage 6 — Consumer Migration & Hardening

**Inputs**: Working utility + tests, Stage 4 lanes `[x]`, Stage 5A cohort spec published, Stage 5B pattern preparation logged with executed gating evidence and all Stage 6 lanes marked unblocked, Stage 6 checklist (lanes a–d covering backend/core/interface/session or equivalent groupings).

- Claim a Stage 6 lane, execute the detailed tasks/tests documented for that lane, and capture results in the activity log.
- Replace bespoke helpers with minimal-footprint API calls; remove dead code and ensure file sizes stay within thresholds.
- Add/update integration tests or snapshots when migrations alter observable output. Document evidence links in the Stage 6 log entry.
- Coordinate with other utility owners when touching shared files (log coordination in the activity log).
- Update `safe-consolidation-candidates.md` checkboxes for migrated files as they complete.
- Stage 6 remains a living stage: if you encounter a new helper/dependency gap, pause the lane, return to Stage 3 to refresh the plan (updating Stage 4/Stage 5 readiness), then resume once prerequisites are cleared.
- Trigger a Stage 3 revisit any time a lane uncovers prerequisites that are missing from the published plan—for example, discovering a required DI seam or teardown hook that is absent from the harness, needing a new shared fixture/command to unblock validation, or identifying cross-utility constant drifts that demand cohort sign-off. Capture the rollback in the activity log, refresh the plan, and only then resume Stage 6 execution.
- Review the most recent Stage 2, Stage 3, or Stage 5 activity-log entry before changing consumer files to confirm validation status and outstanding risks.

**Outputs**: Stage 6 lanes executed per checklist, Stage 6 log entry with migrated files + validation references, consolidation tracker updates noting completed migrations.

## Stage 7 — Validation & Reporting

**Inputs**: Migrated code, test results, documentation status.

- Execute final validation suite (unit + targeted smoke scripts). Capture command outputs or summary metrics, storing links/notes in the Stage 7 log entry.
- Cross-check required commands against `docs/current/testing-guide.md` so you run the canonical suites for the touched components and Phase 6 workflows.
- Ensure pattern doc, playbook references, and any README snippets reflect final API surface.
- Update `safe-consolidation-candidates.md` to mark the pattern’s checklist as complete and note any follow-up work.
- Archive final migration notes in `utility-consolidation-plans/pattern-{{Pattern}}.md` (e.g., “All consumers migrated; remaining TODOs ...”) so future audits have a single source of truth.
- Notify coordinators if additional validation or monitoring is required post-closeout.

**Outputs**: Final validation evidence, documentation updates, Stage 7 activity-log entry, trackers updated to show completion.

## Stage Hand-Off Protocol

- Close each session by updating the activity log and pushing stage status to `safe-consolidation-candidates.md`.
- Clearly state remaining work, blocked items, and next recommended actions in the log. Mention any tests pending or evidence to collect.
- Notify coordinators if overlapping utilities require sequencing adjustments.
- When transitioning between stages, update the Stage 3 plan details with completion checkmarks, blockers, or reassignment notes so subsequent agents can proceed without direct communication.

## Quick Reference Checklist (per Stage)

| Stage | Checklist |
|-------|-----------|
| 1 | Orientation refreshed • Pattern doc validated • Consumers mapped • Plan stored |
| 2 | Tests authored first • Utility implemented • Tests passing • Log entry updated |
| 3 | Readiness summary captured • Stage 4 checklist & Stage 6 lanes referenced • Alignment owner named |
| 4 | Prerequisite lanes `[x]` • Handoff block populated • Schedule + tracker aligned |
| 5 | Cohort spec published • Pattern prep iterated until all Stage 6 lanes unblocked • Evidence logged • Trackers updated |
| 6 | Migration lanes executed • Validation evidence captured • Trackers updated • Stage 3 revisited if blockers arise |
| 7 | Final validation run • Docs refreshed • Progress tracker updated • Completion logged |

Print or pin this checklist for quick compliance verification.
