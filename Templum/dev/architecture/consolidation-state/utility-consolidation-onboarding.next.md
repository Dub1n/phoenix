---
date: 2025-10-02T23:10:00Z
name: templum-utility-consolidation-onboarding-next
status: ['[draft]']
tags: ['consolidation', 'registry', 'workflow', 'onboarding']
dependencies: ['consolidation-state.json', 'utility-consolidation-playbook.next.md', 'PLAN_TEMPLATE.next.md']
---

# Templum Utility Consolidation Onboarding — Registry Edition (Draft)

## Purpose

Introduce the registry-driven workflow so agents can execute utility consolidations while keeping the canonical state (`consolidation-state.json`) accurate and the generated artefacts in sync.

## 0. Orientation Checklist (45–60 min)

1. **Review the registry**: Open `Templum/dev/architecture/consolidation-state/consolidation-state.json` and skim your assigned pattern entry. Note current stage, pending lanes, dependencies, and guardrails.
2. **Read generated views**: Inspect the rendered plan (`utility-consolidation-plans/pattern-<id>.md`), tracker (`safe-consolidation-candidates.md`), and activity log sections for your pattern. These files will soon be generated from the registry, so treat them as read-only context.
3. **Refresh architectural baselines**: Revisit `architecture-restructuring-plan.md`, `safe-consolidation-candidates.md`, and pattern specs to confirm guardrails and target impact.
4. **Validate toolchain**: Ensure `npm install` has been run inside `Templum/`. Confirm you can execute `npm run consolidate -- status <patternId>` without errors.
5. **Testing commands**: Re-read `docs/current/testing-guide.md` for the canonical Jest/Phase 6 command matrix.

## 1. Required Tools & References

| Resource | Usage |
| --- | --- |
| `consolidation-state.json` | Single source of truth for stages, lanes, evidence, approvals. Updated exclusively via CLI. |
| `consolidation-state.schema.json` | Schema enforced by the CLI/CI; use when validating manual edits during review. |
| `npm run consolidate -- <command>` | Registry companion (status, update-lane, regen). |
| Pattern spec (`Templum/dev/patterns/...`) | API contract and guardrails for your utility. |
| `docs/current/testing-guide.md` | Test harness instructions and troubleshooting. |
| `display-stack-alignment.md` or cohort spec | Cohort-level agreements referenced by registry dependencies. |

## 2. Workflow Overview

1. **Claim pattern**
   - Run `npm run consolidate -- claim <patternId> --agent <name>` to register ownership. This updates the registry and records `claimedAt`.
   - Verify the Stage 1 gate is `open/ready`. If `blocked`, inspect `dependencies` and resolve before continuing.

2. **Plan (Stages 1–3)**
   - Use the CLI `status` command to list outstanding Stage 4 prerequisites and Stage 6 lanes.
   - Record Stage 1 findings (consumer inventory, guardrails) using `npm run consolidate -- append-activity <patternId> --stage stage-1 --summary "..."` (proposed extension).
   - When Stage 1 plan is ready, mark the Stage 1 gate via `npm run consolidate -- update-stage <patternId> 1 --status complete --notes "..."` (see playbook for command details).

3. **Prerequisites (Stage 4)**
   - Before implementing migrations, ensure each Stage 4 lane has explicit tasks/tests in the registry. Use `update-lane` to capture progress, evidence, and blockers.
   - The CLI refuses Stage 6 lane transitions until Stage 4 gates are `complete`.

4. **Alignment (Stage 5)**
   - Coordinators run `npm run consolidate -- update-stage <patternId> 5 --status ready` only after all cohort acknowledgements are recorded in the registry `handoff.acknowledgements` section.

5. **Migrations (Stage 6)**
   - For each lane (`6a`–`6d`), use `update-lane` to move status from `pending` → `in_progress` → `complete`. Provide command evidence (`executedAt`, `exitCode`, `logPath`).
   - The CLI regenerates plan/tracker/log views after each lane completion when invoked with `--regen` or if `CONSOLIDATION_REGEN=auto` is set.

6. **Validation & Closeout (Stage 7)**
   - Execute the validation suite as defined in the registry. Mark Stage 7 complete and attach evidence (logs, docs) via CLI.
   - Ensure final activity entry summarises completion, remaining risks, and follow-ups.

## 3. Agent Checklist

- ✅ Registry entry claimed and Stage 1–3 notes captured.
- ✅ Stage 4 lanes populated with tasks, commands, dependencies.
- ✅ Cohort alignment approvals recorded in registry (`handoff.acknowledgements`).
- ✅ Stage 6 lanes updated with command evidence (log paths, exit codes, timestamps).
- ✅ Generated artefacts (`plan`, `tracker`, `activity log`) refreshed via `npm run consolidate -- regen`.
- ✅ Stage 7 validation logged, documentation references updated (pattern doc, testing guide pointers).

## 4. Expectations

- **No manual edits** to plan/tracker/log once generation is enabled. If urgent hotfix needed, use CLI `--force` flag and record the exception in the activity log.
- **Evidence discipline**: every executed command must have `logPath` or summary captured; missing artefacts keep the lane in `blocked`.
- **Dependency awareness**: CLI will enforce cross-pattern dependencies. Coordinate with other owners before overriding.
- **Audit trail**: Do not remove past activity entries; append new entries even when reopening lanes to document rationale.

## 5. Support

- Workflow questions → Architecture operations channel (include pattern ID and registry snippet).
- CLI issues → File under `Templum/dev/tasks/phase6-validation-signal.md` until dedicated tracker is created.
- Schema updates → increment `schemaVersion` to `1.x.x` and supply migration script before merging.

By following this registry-first onboarding, agents can deliver consolidations with a single update surface, eliminating duplicate documentation work while keeping coordination fail-safe.
