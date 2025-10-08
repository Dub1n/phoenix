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

| Resource                                    | Usage                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `consolidation-state.json`                  | Single source of truth for stages, lanes, evidence, approvals. Updated exclusively via CLI. |
| `consolidation-state.schema.json`           | Schema enforced by the CLI/CI; use when validating manual edits during review.              |
| `npm run consolidate -- <command>`          | Registry companion (status, update-lane, regen).                                            |
| Pattern spec (`Templum/dev/patterns/...`)   | API contract and guardrails for your utility.                                               |
| `docs/current/testing-guide.md`             | Test harness instructions and troubleshooting.                                              |
| `display-stack-alignment.md` or cohort spec | Cohort-level agreements referenced by registry dependencies.                                |

## 2. Workflow Overview

1. **Claim pattern**
   - Run `npm run consolidate -- claim <patternId> --agent <name>` to register ownership. This updates the registry and records `claimedAt`.
   - Verify the Stage 1 gate is `open/ready`. If `blocked`, inspect `dependencies` and resolve before continuing.

2. **Plan (Stages 1–3)**
   - Start with `npm run consolidate -- guide <patternId>` to review the Stage 1 orientation block and Stage actions.
   - Log consumer inventory, redundancy metrics, and discovery commands with `npm run consolidate -- stage-note <patternId> 1 --body "Consumers: …; Commands: rg …" [--agent <name>]` (notes surface directly in the guide).
   - Move the Stage 1 gate through `open → in_progress → complete` using `npm run consolidate -- update-stage <patternId> 1 --status <value> [--notes "..."]` so downstream owners can pick up immediately.
   - Leave Stage 4 lane definitions for the Stage 3 owner; Stage 1’s job is to capture context and guardrails, not to pre-seed lanes.

3. **Prerequisites (Stage 4)**
   - Before implementing migrations, ensure each Stage 4 lane has explicit tasks/tests in the registry. Use `update-lane` to capture progress, evidence, and blockers.
   - The CLI refuses Stage 6 lane transitions until Stage 4 gates are `complete`.

4. **Alignment (Stage 5)**
   - Maintain guardrails/shared files/acknowledgements with `npm run consolidate -- update-handoff <patternId> --add-guardrail "…" --add-file "…" --add-ack "Agent"` (use `--remove-ack-agent <name>`/index flags to tidy entries, `--list` to review) as alignment decisions are made.
   - Log alignment context (owners, risks, mitigations) via `npm run consolidate -- stage-note <patternId> 5 --body "Approvals: …; Risks: …" [--agent <name>]` so Stage 6 inherits the narrative.
   - Coordinators run `npm run consolidate -- update-stage <patternId> 5 --status ready` only after handoff updates and gating evidence are captured in the registry.

5. **Migrations (Stage 6)**
   - For each lane (`6a`–`6d`), use `update-lane` to move status from `pending` → `in_progress` → `complete`. Provide command evidence (`executedAt`, `exitCode`, `logPath`).
   - Claim lanes with `npm run consolidate -- claim-lane <patternId> [laneId] --agent <name>` to avoid collisions as dependencies lift.
   - Summarise cross-lane status or blockers with `npm run consolidate -- stage-note <patternId> 6 --body "Lanes complete: …; Blockers: …"` as you progress.
   - Review the handoff summary surfaced in `guide` to respect guardrails/approvals before touching each lane.
   - The CLI regenerates plan/tracker/log views automatically after each write; manual `regen` calls are only needed for CI dry-runs (`--check`).

6. **Validation & Closeout (Stage 7)**
   - Execute the validation suite as defined in the registry. Mark Stage 7 complete and attach evidence (logs, docs) via CLI.
   - Capture final follow-ups in `npm run consolidate -- stage-note <patternId> 7 --body "Validation: …; Outstanding: …"` before updating the stage gate.
   - Ensure final activity entry summarises completion, remaining risks, and follow-ups.

## 3. Agent Checklist

- ✅ Registry entry claimed and Stage 1–3 notes captured.
- ✅ Stage 4 lanes populated with tasks, commands, dependencies (Stage 3 owner action).
- ✅ Stage 5 handoff block updated via `update-handoff` (guardrails, shared files, acknowledgements).
- ✅ Cohort alignment approvals recorded in registry (`handoff.acknowledgements`).
- ✅ Stage 6 lanes updated with command evidence (log paths, exit codes, timestamps).
- ✅ Generated artefacts (`plan`, `tracker`, `activity log`) refreshed automatically (run `npm run consolidate -- regen --check` only when you need a diff in CI).
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
