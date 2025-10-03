# Consolidation CLI — Draft Interaction Design

## Goals

- Prevent agents from skipping required gates or forgetting evidence.
- Provide a single entrypoint to read the current registry state, update lanes/stages, and regenerate Markdown artefacts.
- Emit clear terminal cues that surface outstanding prerequisites before allowing progress.

## Command Surface

| Command                                                   | Purpose                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run consolidate -- status <patternId>`               | Show registry snapshot (stage, pending lanes, blocking dependencies, latest evidence).     |
| `npm run consolidate -- claim <patternId> --agent <name>` | Assign ownership / refresh timestamps.                                                     |
| `npm run consolidate -- update-lane <patternId> <laneId>` | Guided prompt to mark a lane `in_progress` or `complete`, capturing commands and evidence. |
| `npm run consolidate -- reopen <patternId> <laneId>`      | Roll back a lane to `pending`/`blocked` (forces plan/hand-off review).                     |
| `npm run consolidate -- regen`                            | Regenerate Markdown views (plans, tracker, activity log).                                  |

All subcommands operate on `consolidation-state.json`, validate via the schema, and ensure projections are refreshed when the state changes.

## Update Flow (Lane Example)

1. **Prerequisite check**
   - Load registry entry for `<patternId>`.
   - Ensure Stage 5 gate is `ready/complete` before any Stage 6 lane transitions.
   - Ensure declared dependencies (other patterns/lanes) are marked `complete`. If not, abort with a descriptive message.

2. **Prompt sequence**
   - Confirm agent identity (`--agent` flag or prompt).
   - Display lane scope, outstanding commands, and guardrails from the registry.
   - Ask the agent to mark status (`pending` → `in_progress` → `complete`).
   - For each command listed, require details:
     - Did you run this command? [y/N]
     - If yes, capture `executedAt`, `exitCode`, log path, and free-form summary.
     - If no, optionally mark `skipped` with justification (auto-flags lane as `blocked`).
   - Allow additional commands/evidence to be appended (custom entries become part of the registry).

3. **Evidence verification**
   - Warn if log paths do not exist relative to repo root.
   - Validate timestamps (`executedAt` must be <= current time).
   - Refuse to mark lane `complete` unless all commands are `passed` or `skipped` with justification.

4. **Stage consequences**
   - When a lane transitions to `complete`, recompute Stage 6 gate status (complete when all lanes complete).
   - Append an activity entry summarising the action (auto-generated summary + optional agent note).
   - Write the updated registry with ISO8601 timestamp in `updatedAt`.
   - Trigger Markdown regeneration when `--regen` flag provided or via post-update hook.

## Safety Nets

- **Dry-run mode**: `--dry-run` prints proposed changes without writing.
- **Schema validation**: Each write is validated; failures abort with detailed pointer to the invalid path.
- **Conflict handling**: If `updatedAt` changed since the CLI loaded (e.g., concurrent edit), the CLI aborts and instructs the agent to re-run after pulling latest state.
- **Audit trail**: Write operations append to `.templum/logs/consolidation-cli.log` with diff summary and agent metadata for traceability.

## Implementation Outline

- CLI implemented in Node (ESM) using `commander` or native `node --experimental` modules.
- Read/write via `fs/promises`. Use `ajv` (already dependency) with precompiled schema.
- Markdown regeneration delegates to generator module described in `generators.md`.
- Environment flags:
  - `CONSOLIDATION_STATE_PATH` overrides default path (useful for tests).
  - `CONSOLIDATION_REGEN=auto` to enable implicit regeneration after each update.

## Open Questions

- Do we need per-lane approvals (beyond Stage 5 ack)? Schema supports them but CLI needs UI decisions.
- How to bundle multi-agent collaboration: allow multiple agents to append evidence before completion, or require explicit reassign? Proposed: allow `append-activity` subcommand to log coordination without altering lane status.
- Should CLI enforce log file existence in git? For now, warn if path missing, but do not block to accommodate soon-to-be-generated logs.
