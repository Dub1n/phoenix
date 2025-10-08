# Consolidation CLI — Interaction Design

## Goals

- Prevent agents from skipping required gates or forgetting evidence.
- Provide a single entrypoint to read the current registry state, update lanes/stages, and regenerate Markdown artefacts.
- Emit clear terminal cues that surface outstanding prerequisites before allowing progress.

## Command Surface

| Command                                                   | Purpose                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run consolidate -- guide <patternId> [--stage N] [--lane 6b] [--lanes] [--recent] [--next\|-n]` | Surface focused guidance for a pattern, optionally narrowed to a stage or specific lane, list all lanes, highlight the next actionable stage, and show the latest activity. |
| `npm run consolidate -- status <patternId>`               | Show registry snapshot (stage, pending lanes, blocking dependencies, latest evidence).     |
| `npm run consolidate -- claim <patternId> --stage <id>\|--lane 6b [--summary text] [--note text]` | Claim a stage or lane, move it to `in_progress`, and log the deterministic agent id for collision prevention. |
| `npm run consolidate -- stage-note <patternId> <stageId> --body "<text>"` | Append a stage-scoped note (auto-tagged in the guide output) to capture discoveries and guardrails. |
| `npm run consolidate -- update-stage <patternId> <stageId> --status <value>` | Update stage gate status, optional notes, and activity entries (unlocks downstream work).  |
| `npm run consolidate -- update-handoff <patternId> [options]` | Maintain shared guardrails, files, and acknowledgements recorded during Stage 5 hand-off. |
| `npm run consolidate -- update-lane <patternId> <laneId>` | Update lane status (blocked/scheduled/ready/etc.), append notes/evidence, and optionally propagate blockers to downstream lanes. |
| `npm run consolidate -- append-activity <patternId> --scope stage-6\|lane-6b --summary "<text>"` | Append collaborative evidence to the activity log without changing the underlying stage/lane status (combine with `--stage`/`--lane` shortcuts for clarity). |
| `npm run consolidate -- reopen <patternId> <laneId>`      | Roll back a lane to `pending`/`blocked` (forces plan/hand-off review).                     |
| `npm run consolidate -- regen [--check]`                  | Optional manual regeneration (use `--check` for CI/dry-run; normal commands auto-run generators). |

All subcommands operate on `consolidation-state.json`, validate via the schema, and ensure projections are refreshed when the state changes. Stage 5 hand-off metadata remains the single home for approvals—there are no additional per-lane approval prompts.

Agents always start with `guide`: it surfaces readiness, blockers, and guardrails for the target stage or lane. Once the guidance confirms availability, invoke `claim` to move the chosen scope into `in_progress`. The CLI now issues deterministic agent ids (pattern + stage/lane) when claiming so the registry records a single active owner; a future enhancement will swap this for non-repeating codenames.

After a stage is set to `ready`/`complete` or a lane is marked `complete`, the CLI suggests the next assignable stage or lane—complete with the `guide`/`claim` commands to run next—so agents do not bypass the guardrail flow when dependencies unlock new work. If coordination asks you to pause instead of claiming, the CLI reminder also nudges you to commit touched files before exiting.

`guide` defaults to the first auto-assignable lane. When earlier stages (especially Stage 1) are still open, the CLI surfaces the seeded orientation block (pattern summary, problem/API snapshot, starter files) **and** an actionable checklist (Stage actions) so agents can proceed without hopping to `status`. Use `--next`/`-n` to highlight the first actionable stage starting from the current pointer (including that pointer stage when it still needs work), `--stage` to focus elsewhere, `--lane` for a detailed view, `--lanes` to list every lane in the chosen stage, and `--recent` to include the latest activity entries. If a stage or lane has no assignable work (e.g., every lane is blocked), the guide explicitly says so and nudges the agent to coordinate before attempting another claim. Stage notes recorded with `stage-note` appear automatically in the guide; run `status` only when you need the full structured snapshot. Stage 1 scaffolding is sourced from the registry via `scripts/seed-registry-from-candidates.mjs`, removing the need to keep `safe-consolidation-candidates.md` open during onboarding. For Stage 5 and 6, the guide also prints the handoff guardrails/shared files/acknowledgements so lane owners see the contract inline.

### Lane Status Glyphs

| Status               | Glyph | Auto-Assignable? | Usage                                                                  |
| -------------------- | ----- | ---------------- | ---------------------------------------------------------------------- |
| `pending`            | `[ ]` | Yes              | Newly created work, safe for auto-assignment.                          |
| `scheduled`          | `[<]` | Yes              | Dependency cleared and queued for pickup (auto-assigned when blockers resolve). |
| `in_progress`        | `[~]` | No               | Claimed and actively underway.                                         |
| `blocked`            | `[?]` | No               | Blocked by upstream work; CLI captures blocker notes + propagation.    |
| `needs_verification` | `[T]` | No               | Implementation landed; pending mandated test battery.                  |
| `ready_for_handoff`  | `[D]` | No               | Evidence captured, awaiting doc/activity wrap-up.                      |
| `complete`           | `[x]` | No               | Fully complete; no further action required.                            |
| `deferred`           | `[>]` | No               | Work moved to a future cohort; track new owner elsewhere.              |
| `cancelled`          | `[-]` | No               | Scope dropped; retained for audit history.                             |

Stage gates mirror these signals with `[ ] open`, `[<] scheduled`, `[~] in-progress`, `[?] blocked`, `[T] ready`, `[x] complete`, and `[>] deferred`.

`status` highlights lanes that remain assignable and expands blocker/testing notes inline so agents can see impediments without opening the generated Markdown.

## Update Flow (Lane Example)

1. **Prerequisite check**
   - Load registry entry for `<patternId>`.
   - Ensure Stage 5 gate is `ready/complete` before any Stage 6 lane transitions.
   - Ensure declared dependencies (other patterns/lanes) are marked `complete`. If not, abort with a descriptive message.

2. **Prompt sequence**
   - Ensure the lane has already been claimed: the dedicated `claim` command moves it to `in_progress` and auto-logs the deterministic agent id. (`update-lane` refuses to place a lane directly into `in_progress`.)
   - Display lane scope, outstanding commands, and guardrails from the registry.
   - Ask the agent to set the new lane status (`pending`, `scheduled`, `in_progress`, `blocked`, `needs_verification`, `ready_for_handoff`, `complete`, etc.).
   - For each command listed, require details:
     - Did you run this command? [y/N]
     - If yes, capture `executedAt`, `exitCode`, log path, and free-form summary.
     - If no, optionally mark `skipped` with justification (auto-flags lane as `blocked`).
   - Allow additional commands/evidence to be appended (custom entries become part of the registry).

3. **Evidence capture**
   - Record provided command summaries, outcomes, and log paths as-is; agents manually verify evidence paths before closing work.
   - Remind contributors that `append-activity` can log additional context without altering lane status.

4. **Stage consequences**
   - When a lane transitions to `complete`, recompute Stage 6 gate status (complete when all lanes complete).
   - Append an activity entry summarising the action (auto-generated summary + optional agent note).
   - Write the updated registry with ISO8601 timestamp in `updatedAt`.
   - Generators run automatically after each write; no extra `regen` call is needed during normal operation.
   - When the transition unlocks new work, print the next recommended stage or lane alongside the `guide`/`claim` commands to keep agents on the guardrail flow.
5. **Propagation prompts**
   - When a lane is marked `blocked`, `scheduled`, or `complete`, the CLI offers to tag related lanes/stages (e.g., mark siblings as `scheduled` or `blocked`). Suggestions are pre-filled from registry dependencies so agents can accept defaults quickly.
   - Propagated updates append contextual notes ("Blocked due to lane 6a") and recompute downstream stage gates automatically.

### Stage Gate Updates

- Use `npm run consolidate -- update-stage <patternId> <stageId> --status <value>` to advance or reopen a stage gate; the CLI updates timestamps/notes and adds an activity entry automatically.
- Log discovery or coordination details for a stage with `npm run consolidate -- stage-note <patternId> <stageId> --body "..."` so the guidance surface stays current.
- Maintain Stage 5 hand-off guardrails/shared files/acknowledgements with `npm run consolidate -- update-handoff <patternId> [options]` (add/remove entries with `--add-*`, `--remove-*`, or `--remove-ack-agent <name>`; inspect without changes using `--list`) so downstream agents see the contract without opening other docs.

### Claim Guardrails

- `claim` refuses to move a stage into `in_progress` unless its current status is `open`, `scheduled`, or `ready`. Stages already `in_progress`, `blocked`, or closed must be coordinated manually before another agent can pick them up.
- Lane claims require an explicit lane id; the CLI checks that dependencies are satisfied and that the status is assignable (`pending`/`scheduled`). Attempts to skip the guardrails are rejected so parallel agents cannot collide.
- Claiming a stage optionally records a note (scoped to that stage), while lane claims can append lane notes just like before.
- Deterministic agent ids are derived from the pattern and scope (e.g., `24-stage3`, `24-6a`) so coordination logs stay clear even without manually supplying `--agent`.
- When a lane is flipped from `in_progress` to `blocked`, the CLI appends a reminder to log blockers with `append-activity` and to rerun `guide` before reclaiming the work.

## Safety Nets

- **Dry-run mode**: `--dry-run` prints proposed changes without writing.
- **Schema validation**: Each write is validated; failures abort with detailed pointer to the invalid path.
- **Conflict handling**: If `updatedAt` changed since the CLI loaded (e.g., concurrent edit), the CLI aborts and instructs the agent to re-run after pulling latest state.
- **Audit trail**: Write operations append to `.templum/logs/consolidation-cli.log` with diff summary and agent metadata for traceability.

## Implementation Outline

- CLI implemented in Node (ESM) using `commander` or native `node --experimental` modules.
- Read/write via `fs/promises`. Use `ajv` (already dependency) with precompiled schema.
- Markdown regeneration delegates to the generator module described in `generators.md` and runs automatically after write commands.
- Environment flags:
  - `CONSOLIDATION_STATE_PATH` overrides default path (useful for tests).

## Open Questions

None currently. Revisit as additional cohorts surface new workflow needs.
