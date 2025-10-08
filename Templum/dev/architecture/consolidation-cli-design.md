# Consolidation CLI — Interaction Design

## Goals

- Prevent agents from skipping required gates or forgetting evidence.
- Provide a single entrypoint to read the current registry state, update lanes/stages, and regenerate Markdown artefacts.
- Emit clear terminal cues that surface outstanding prerequisites before allowing progress.

## Command Surface

| Command                                                   | Purpose                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run consolidate -- guide <patternId> [--stage N] [--lane 6b] [--lanes] [--recent] [--next|-n]` | Surface focused guidance for a pattern, optionally narrowed to a stage or specific lane, list all lanes, jump to the next actionable stage, and show the latest activity. |
| `npm run consolidate -- status <patternId>`               | Show registry snapshot (stage, pending lanes, blocking dependencies, latest evidence).     |
| `npm run consolidate -- claim <patternId> --agent <name>` | Assign or refresh ownership metadata (updates `owner.agent/claimedAt`).                   |
| `npm run consolidate -- stage-note <patternId> <stageId> --body "<text>"` | Append a stage-scoped note (auto-tagged in the guide output) to capture discoveries and guardrails. |
| `npm run consolidate -- update-stage <patternId> <stageId> --status <value>` | Update stage gate status, optional notes, and activity entries (unlocks downstream work).  |
| `npm run consolidate -- update-handoff <patternId> [options]` | Maintain shared guardrails, files, and acknowledgements recorded during Stage 5 hand-off. |
| `npm run consolidate -- claim-lane <patternId> [laneId] --agent <name>` | Atomically claim the next assignable Stage 6 lane and switch it to `in_progress` while surfacing guardrails/commands. |
| `npm run consolidate -- update-lane <patternId> <laneId>` | Update lane status (blocked/scheduled/ready/etc.), append notes/evidence, and optionally propagate blockers to downstream lanes. |
| `npm run consolidate -- append-activity <patternId> --scope stage-6\|lane-6b --summary "<text>"` | Append collaborative evidence to the activity log without changing the underlying stage/lane status (combine with `--stage`/`--lane` shortcuts for clarity). |
| `npm run consolidate -- reopen <patternId> <laneId>`      | Roll back a lane to `pending`/`blocked` (forces plan/hand-off review).                     |
| `npm run consolidate -- regen [--check]`                  | Optional manual regeneration (use `--check` for CI/dry-run; normal commands auto-run generators). |

All subcommands operate on `consolidation-state.json`, validate via the schema, and ensure projections are refreshed when the state changes. Stage 5 hand-off metadata remains the single home for approvals—there are no additional per-lane approval prompts.

`guide` defaults to the first auto-assignable lane. When earlier stages (especially Stage 1) are still open, the CLI surfaces the seeded orientation block (pattern summary, problem/API snapshot, starter files) **and** an actionable checklist (Stage actions) so agents can proceed without hopping to `status`. Use `--next`/`-n` to jump ahead to the next incomplete stage, `--stage` to focus elsewhere, `--lane` for a detailed view, `--lanes` to list every lane in the chosen stage, and `--recent` to include the latest activity entries. Stage notes recorded with `stage-note` appear automatically in the guide; run `status` only when you need the full structured snapshot. Stage 1 scaffolding is sourced from the registry via `scripts/seed-registry-from-candidates.mjs`, removing the need to keep `safe-consolidation-candidates.md` open during onboarding. For Stage 5 and 6, the guide also prints the handoff guardrails/shared files/acknowledgements so lane owners see the contract inline.

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
   - Confirm agent identity (`--agent` flag or prompt).
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
5. **Propagation prompts**
   - When a lane is marked `blocked`, `scheduled`, or `complete`, the CLI offers to tag related lanes/stages (e.g., mark siblings as `scheduled` or `blocked`). Suggestions are pre-filled from registry dependencies so agents can accept defaults quickly.
   - Propagated updates append contextual notes ("Blocked due to lane 6a") and recompute downstream stage gates automatically.

### Stage Gate Updates

- Use `npm run consolidate -- update-stage <patternId> <stageId> --status <value>` to advance or reopen a stage gate; the CLI updates timestamps/notes and adds an activity entry automatically.
- Log discovery or coordination details for a stage with `npm run consolidate -- stage-note <patternId> <stageId> --body "..."` so the guidance surface stays current.
- Maintain Stage 5 hand-off guardrails/shared files/acknowledgements with `npm run consolidate -- update-handoff <patternId> [options]` (add/remove entries with `--add-*`, `--remove-*`, or `--remove-ack-agent <name>`; inspect without changes using `--list`) so downstream agents see the contract without opening other docs.

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
