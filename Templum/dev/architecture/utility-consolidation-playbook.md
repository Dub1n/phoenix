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

1. **Stage 0 — Orientation Refresh**
2. **Stage 1 — Spec Alignment & Planning**
3. **Stage 2 — Test-First Utility Implementation**
4. **Stage 2.5 — Migration Orchestration & Agent Tasking**
5. **Stage 3 — Consumer Migration & Hardening**
6. **Stage 4 — Validation & Reporting**

Agents must pause at stage boundaries for hand-off checkpoints when sessions end or context limits approach.
By default, the hand-off checkpoints are after completion of Stages 1, 2, and 3. There is no need to pause after stage 0 unless specifically requested.

## Stage 0 — Orientation Refresh

**Inputs**: Assigned utility ID (e.g., Pattern 12), latest docs (`safe-consolidation-candidates.md`, pattern spec).

- Re-read `utility-consolidation-onboarding.md` sections on shared baselines and guardrails.
- Confirm pattern frontmatter complies with `meta/templates/schema/pattern-frontmatter.json`; update before proceeding if not.
- Record orientation start in `utility-consolidation-activity-log.md` (Stage 0) with timestamp and responsible agent.
- Review `safe-consolidation-candidates.md` entry, noting redundancy counts, API expectations, and outstanding TODOs/checklists.
- Inspect existing `src/utils` exports and `safe-consolidation` status to avoid duplicate work.

**Outputs**: Orientation entry in activity log, list of impacted files, confirmation that pattern spec and onboarding references are up-to-date.

## Stage 1 — Spec Alignment & Planning

**Inputs**: Pattern doc, redundancy metrics (`redundancy-report.md`), dependency maps.

- Map consumer files using `rg` searches (document paths in activity log entry for Stage 1).
- Identify architecture guardrails that apply (logger/error-handler integration, DI boundaries, SOLID thresholds) and note them.
- Draft a concise implementation plan covering:
  - Test files to create/update (under `tests/` or component-specific suites).
  - Utility module structure (`src/utils/<utility>.ts`, export via `src/utils/index.ts`).
  - Migration order for consumers.
- Copy `Templum/dev/architecture/utility-consolidation-plans/PLAN_TEMPLATE.md` to `Templum/dev/architecture/utility-consolidation-plans/pattern-{{Pattern}}.md` and store the plan there, updating it as the work evolves.
- If picking up after another agent, review the latest Stage 0/Stage 1 entries in `utility-consolidation-activity-log.md` before editing the plan.
- If the plan diverges from pattern requirements, update the pattern doc immediately with rationale and cross-link to evidence.
- Add Stage 1 checklist note in `safe-consolidation-candidates.md` (e.g., “Plan drafted — see utility-consolidation-plans/pattern-{{Pattern}}.md”).

**Outputs**: Stage 1 activity log entry, updated pattern spec (if required), migration/test plan, status note in consolidation doc.

## Stage 2 — Test-First Utility Implementation

**Inputs**: Plan, pattern spec, existing utilities for integration.

- Create or extend Jest suites covering every API surface promised by the pattern. Tests must exist before implementation (TDD requirement).
- Implement the utility inside `src/utils/`, wiring dependencies via injection/composition per spec.
- Update `src/utils/index.ts` exports.
- Run targeted tests (`npm test -- <pattern>` or `npm test`) until green. Capture command and result in activity log (Stage 2 entry).
- Before coding, read the Stage 1 plan in `utility-consolidation-plans/pattern-{{Pattern}}.md` and the latest activity-log entry to stay aligned with prior decisions.
- Address lint/type issues encountered; document any temporary skips with remediation plan.

**Outputs**: Passing unit tests, implemented utility, Stage 2 log entry including commands run and coverage highlights.

## Stage 2.5 — Migration Orchestration & Agent Tasking

**Inputs**: Stage 2 activity log/tests, updated pattern plan (`pattern-{{Pattern}}.md`), Stage 1 consumer inventory, helper coverage notes.

- Evaluate the consumer migration surface (backend/core/interface/session groupings) against helper availability; capture any additional utility work required before migrations.
- Populate the Stage 2.5 section of the pattern plan with phase breakdown, helper checklist, per-agent responsibilities, validation commands, and contingencies. Reuse `PLAN_TEMPLATE.md` guidance.
- Decide whether multiple agents will participate; define phase sequencing, isolated-environment expectations, and synchronization points (tests to run, tracker updates) within the plan.
- Update or create phase-specific checkboxes directly in the pattern plan so Stage 3 agents can self-serve assignments.
- Record a Stage 2.5 entry in `utility-consolidation-activity-log.md` referencing the plan section, helper decisions, and outstanding risks.
- Add a Stage 2.5 note in `safe-consolidation-candidates.md` (e.g., “Stage 2.5 plan ready — see pattern doc”).
- If helper changes are required, complete them immediately or log a follow-up item with owner and due stage.
- Define a contingency trigger: if any migration phase later uncovers missing helpers or shared dependencies, pause work, move the Stage 2.5 tracker glyph back to `[~]`, refresh the plan with the new requirements, and record a new Stage 2.5 activity-log entry before resuming Stage 3. Treat this as a normal, Agile iteration—no need to unwind completed migrations unless the refreshed plan explicitly calls for it. When multiple unblockers surface, break them into parallel Phase 0x lanes (0a, 0b, 0c, …) so different agents can tackle them concurrently.
- Update the cohort schedule (`utility-consolidation-schedule.md`) with the new Phase 0 lanes, including status glyphs and brief descriptions, so other agents can see the in-flight work.

**Outputs**: Stage 2.5 activity log entry, pattern plan updated with phase/agent checklist and helper status, tracker checkbox indicating migration plan readiness.

## Stage 3 — Consumer Migration & Hardening

**Inputs**: Working utility + tests, Stage 2.5 phase/agent plan, migration checklist.

- Review the Stage 2.5 plan before starting; claim the phase assigned to you, confirm Phase 0 helper prerequisites are complete, and note any blockers relevant to your scope (Phases 1–4 can run in parallel).
- Migrate consumers in the planned sequence, committing only when each group passes existing smoke scripts where available.
- Replace bespoke helpers with minimal-footprint API calls; remove dead code and ensure file sizes stay within thresholds.
- Add/update integration tests or snapshots when migrations alter observable output. Document evidence links in the Stage 3 log entry.
- Coordinate with other utility owners when touching shared files (log coordination in activity log).
- Update `safe-consolidation-candidates.md` checkboxes for migrated files as they complete.
- Reference the Stage 2.5 plan in `utility-consolidation-plans/pattern-{{Pattern}}.md` when adjustments occur so hand-offs stay coherent. Stage 3 is a living phase: if you hit a new helper/dependency gap, stop your phase, revert to Stage 2.5 (update plan, trackers, schedule, and log), and only resume once the refreshed plan marks your phase ready. Keep previously completed migrations in place unless the updated plan directs otherwise. Update phase checkboxes and coordination notes as phases close.
- Review the most recent Stage 2 activity-log entry before changing consumer files to confirm validation status and outstanding risks.

**Outputs**: Consumers aligned to utility, Stage 3 log entry with migrated files list and validation references, consolidation checklist updates.

## Stage 4 — Validation & Reporting

**Inputs**: Migrated code, test results, documentation status.

- Execute final validation suite (unit + targeted smoke scripts). Capture command outputs or summary metrics, storing links/notes in the Stage 4 log entry.
- Ensure pattern doc, playbook references, and any README snippets reflect final API surface.
- Update `safe-consolidation-candidates.md` to mark the pattern’s checklist as complete and note any follow-up work.
- Archive final migration notes in `utility-consolidation-plans/pattern-{{Pattern}}.md` (e.g., “All consumers migrated; remaining TODOs ...”) so future audits have a single source.
- Re-read the Stage 3 activity-log entry before final validation to verify no outstanding remediation is pending.
- When a notable milestone completes (e.g., first utility in category, high-impact reduction), update `docs/current/progress.md` with current status and evidence path.
- Record Stage 4 completion in the activity log, including outstanding risks or TODOs.

**Outputs**: Final validation evidence, documentation updates, consolidation status changed to complete.

## Reporting Artifacts

Agents must maintain the following artifacts throughout the run:

- **Activity Log**: `Templum/dev/architecture/utility-consolidation-activity-log.md` — append one entry per stage with timestamp, agent, utility, actions taken, validation commands, and follow-up items.
- **Consolidation Tracker**: Update relevant checklist items in `safe-consolidation-candidates.md` as stages complete.
- **Progress Tracker**: When instructed, add or update the consolidation task status in `docs/current/progress.md` with summary and evidence links.
- **Pattern Plan**: Maintain Stage 2.5 and Stage 3 checklists within `pattern-{{Pattern}}.md`, ensuring phase ownership, helper status, and coordination notes stay current.

## Stage Hand-Off Protocol

- Close each session by updating the activity log and pushing Stage status to `safe-consolidation-candidates.md`.
- Clearly state remaining work, blocked items, and next recommended actions in the log. Mention any tests pending or evidence to collect.
- Notify coordinators if overlapping utilities require sequencing adjustments.
- When transitioning between phases, update the Stage 2.5 plan with completion checkmarks, blockers, or reassignment notes so subsequent agents can proceed without direct communication.

## Quick Reference Checklist (per Stage)

| Stage | Checklist |
|-------|-----------|
| 0 | Activity log entry • Pattern doc validated • Consumers identified |
| 1 | Migration/Test plan drafted • Pattern gaps resolved • Tracker noted |
| 2 | Tests authored first • Utility implemented • Tests passing • Log entry updated |
| 2.5 | Phase plan documented • Helper gaps resolved • Tracker entry added • Activity log updated |
| 3 | Consumers migrated per phase plan • Smoke tests run • Plan/trackers updated • Coordination noted • Stage 2.5 revisited if new blockers arise |
| 4 | Final validation run • Docs refreshed • Progress tracker updated (if applicable) • Completion logged |

Print or pin this checklist for quick compliance verification.
