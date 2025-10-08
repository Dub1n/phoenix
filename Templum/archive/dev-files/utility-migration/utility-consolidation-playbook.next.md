---
date: 2025-10-02T23:15:00Z
name: templum-utility-consolidation-playbook-next
status: ['[draft]']
tags: ['playbook', 'registry', 'workflow']
dependencies: ['consolidation-state.json', 'cli-design.md', 'generators.md']
---

# Utility Consolidation Execution Playbook — Registry Edition (Draft)

This playbook adapts the existing seven-stage workflow to the registry-driven infrastructure. Agents must route every status change through the CLI so the registry remains authoritative and generated artefacts stay accurate.

## Core Principles

- `consolidation-state.json` is the **single source of truth** for stages, lanes, evidence, approvals.
- `npm run consolidate -- …` is the only mechanism permitted to mutate registry data.
- Markdown artefacts (`pattern-<id>.md`, `safe-consolidation-candidates.md`, `utility-consolidation-activity-log.md`) are generated views; treat them as read-only.
- Each stage transition requires updated evidence (commands, log paths) captured in the registry before the CLI marks the gate complete.
- Activity log entries are appended automatically; agents supply concise summaries via CLI prompts.

## Stage Overview

1. Stage 1 — Orientation & Planning
2. Stage 2 — Test-First Utility Implementation
3. Stage 3 — Migration Orchestration & Coordination
4. Stage 4 — Migration Prerequisites
5. Stage 5 — Cohort Alignment & Pattern Prep
6. Stage 6 — Consumer Migration & Hardening
7. Stage 7 — Validation & Reporting

Pause at stage boundaries when the session ends. Always run `npm run consolidate -- status <patternId>` before resuming to avoid drifting from the latest registry state.

---

## Stage 1 — Orientation & Planning

**Inputs**: Registry entry (`status` command), pattern spec, architecture references, redundancy metrics.

1. Run `npm run consolidate -- claim <patternId> --agent <name>` if not already claimed.
2. Review the Stage 1 orientation block via `npm run consolidate -- guide <patternId>` and set the gate to `in_progress` when work begins (`update-stage … --status in_progress`).
3. Capture consumer inventory, redundancy findings, and discovery commands with `npm run consolidate -- stage-note <patternId> 1 --body "Consumers: …; Commands: rg …" [--agent <name>]` so downstream owners inherit the context.
4. Summarise outstanding risks/open questions in the same stage note (include evidence paths where helpful). Stage 1 does **not** pre-populate Stage 4 lanes—that work is owned by the Stage 3 planning pass.
5. When Stage 1 readiness is met, mark the gate complete with `npm run consolidate -- update-stage <patternId> 1 --status complete --notes "Summary of findings" [--agent <name>]`.

Outputs:

- Stage 1 gate `complete` in registry (with timestamp/notes).
- Stage 1 note in the registry capturing consumers/commands/guardrails for Stage 2/3 references.
- Generated plan/tracker reflect Stage 1 completion after regeneration.

## Stage 2 — Test-First Utility Implementation

**Inputs**: Stage 1 plan details, testing guide, pattern spec.

1. Draft Jest tests; record planned commands via `update-lane` on Stage 4 entries if they serve as prerequisites.
2. Before implementation, log TDD intent using `npm run consolidate -- stage-note <patternId> 2 --body "Tests: …; Focus: …"` (or update the existing Stage 2 note).
3. After tests pass, run `npm run consolidate -- update-stage <patternId> 2 --status complete --notes "Suite xyz executed"`.
4. Provide command evidence (command string, timestamp, exit code, log path) when prompted; CLI stores it in `stageGates["2"]` and `evidence` array.

Outputs:

- Stage 2 gate complete with associated test commands.
- Updated registry evidence enabling automated regeneration of Stage 2 notes in plan/tracker.

## Stage 3 — Migration Orchestration & Coordination

**Inputs**: Stage 2 completion, Stage 4 placeholder lanes, cohort dependencies.

1. Execute `npm run consolidate -- status <patternId>` to review pending lanes and dependencies.
2. Use `update-stage` to set Stage 3 `in_progress` and attach readiness summary (prerequisites, coordination owners, risks).
3. When finalizing Stage 3, ensure each Stage 4 lane has concrete tasks, command list, and dependencies. CLI blocks Stage 3 completion if any Stage 4 lane lacks `scope` or `commands`.
4. On completion, mark Stage 3 `complete`. CLI records timestamp and prompts for coordination notes (referencing dependency pattern IDs).

Outputs:

- Stage 4 lanes fully defined.
- Activity log entry referencing Stage 3 summary.

## Stage 4 — Migration Prerequisites

**Inputs**: Stage 3 plan, Stage 4 lane definitions, shared guardrails.

For each Stage 4 lane (e.g., `4a`, `4b`, `4c`):

1. Run `npm run consolidate -- update-lane <patternId> 4a --status in_progress` before executing tasks.
2. Execute commands; log each via CLI prompt (command, log path, exit code, executedAt). CLI refuses `complete` status until all commands are recorded.
3. If blockers surface, set lane `blocked` with `notes` describing the issue. CLI automatically adds Stage 3 activity entry for required replan.
4. Once all Stage 4 lanes are `complete`, the CLI sets Stage 4 gate to `complete` and announces readiness for Stage 5.

Outputs:

- Stage 4 gate `complete` with evidence per lane.
- Dependencies satisfied to unlock Stage 5 alignment.

## Stage 5 — Cohort Alignment & Pattern Preparation

**Inputs**: Completed Stage 4 lanes, cohort alignment spec, registry handoff data.

1. Coordinator records guardrails, shared files, and acknowledgements with `npm run consolidate -- update-handoff <patternId> --add-guardrail "…" --add-file "…" --add-ack "Agent" [--ack-note "…"]` (use `--list` to review entries and `--remove-ack-agent <name>`/indexes to tidy them).
2. Stage 5A: Run `update-stage` with `in_progress`, attaching summary of cohort alignment session (include dependency pattern IDs in the notes/summary) and capture supporting details in a Stage 5 note when needed.
3. Stage 5B: verify Stage 6 lanes `status` remain `pending` but have `commands` flagged as gating tests. Execute gating battery and record logs through CLI.
4. Mark Stage 5 `ready` once all acknowledgements and evidence exist. CLI prevents `complete` until Stage 6 lanes begin.

Outputs:

- Cohort approvals recorded in registry.
- Stage 6 lanes flagged `pending` with gating evidence attached.

## Stage 6 — Consumer Migration & Hardening

**Inputs**: Stage 5 readiness, Stage 6 lane definitions, gating evidence.

For each lane (`6a`–`6d`):

1. Claim the lane with `npm run consolidate -- claim-lane <patternId> [laneId] --agent <name>` so the status flips to `in_progress` safely (auto-skipping lanes whose dependencies are still blocked).
2. Execute the required commands; provide log paths and exit codes when the CLI prompts.
3. Finish with `npm run consolidate -- update-lane <patternId> <laneId> --status complete --summary "..." --files tmp/...log`. The CLI enforces dependencies (e.g., Lane 6c requires Patterns 6/7 Stage 5 `ready`); overrides require `--force` and add an audit note.
4. If new prerequisites emerge, set the lane `blocked`; the CLI prompts for Stage 3 updates before allowing further Stage 6 transitions. When blockers clear, dependent lanes auto-transition to `scheduled` and become eligible for `claim-lane`.

Outputs:

- Stage 6 lane statuses with full evidence trail.
- Generated plan/tracker show lane completion, and activity log captures each lane entry.

## Stage 7 — Validation & Reporting

**Inputs**: Completed Stage 6 lanes, final validation commands.

1. Run the prescribed validation commands; capture logs.
2. `npm run consolidate -- update-stage <patternId> 7 --status complete` and provide summary (metrics, outstanding follow-ups).
3. Ensure pattern documentation, testing guide references, and `display-stack-alignment.md` (if applicable) are updated; note paths in CLI prompt.

Outputs:

- Stage 7 gate complete with evidence.
- Activity log entry summarizing closeout and follow-ups.
- Registry `stage` auto-advances to 7 with timestamp.

## Regeneration & Verification

- After any registry mutation, run `npm run consolidate -- regen` to refresh Markdown outputs. CI will also run `npm run consolidate -- regen --check` to ensure committed docs match the registry.
- If `--check` fails, regenerate and re-commit; do not hand-edit generated files.

## Hand-Off Protocol

- End each session by running `status` and sharing outstanding blockers in the CLI prompt (activity log captures the summary).
- If you exit mid-lane, leave it `in_progress` with `notes` to signal partial work.
- For cross-agent coordination, record joint activity via `append-activity` so history reflects shared contributions.

## Quick Reference Commands

| Action          | Command                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| Show status     | `npm run consolidate -- status 5`                                                       |
| Claim pattern   | `npm run consolidate -- claim 5 --agent Codex`                                          |
| Update stage    | `npm run consolidate -- update-stage 5 3 --status complete --notes "Stage 3 readiness"` |
| Update lane     | `npm run consolidate -- update-lane 5 6a --status complete --log tmp/... --exit 0`      |
| Regenerate docs | `npm run consolidate -- regen`                                                          |
| Dry-run         | Append `--dry-run` to any command                                                       |

Follow this playbook to maintain a fail-safe consolidation workflow with minimal duplication and auditable progress.
