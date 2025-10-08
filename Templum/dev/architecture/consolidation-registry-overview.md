# Consolidation State Registry — Overview

This directory houses the live workflow backbone for utility consolidation. It introduces a single source of truth (`consolidation-state.json`), supporting schema, and automation entrypoints that drive the plan/tracker/log outputs.

The registry, schema, and CLI are production-ready; agents operate via `npm run consolidate` without consulting ancillary docs. Run `npm run consolidate -- help` whenever you need the command surface or schema references.

## Contents

- `consolidation-state.json` — Authoritative registry seeded with Stage 1 orientation blocks for all 24 patterns (ingested from the safe-candidate analysis) plus live Pattern 5 data. Each pattern entry tracks its own `updatedAt` timestamp so regenerated artefacts only change when that pattern does.
- `consolidation-state.schema.json` — JSON Schema describing valid registry structure, enforced by tooling/CI.
- `consolidation-cli-design.md` — Interaction design for the `npm run consolidate` companion, including prompts, validation rules, and update flows (see it when extending tooling; agents can rely on inline guidance).
- `consolidation-scripts/seed-registry-from-candidates.mjs` — Utility for re-importing `safe-consolidation-candidates.md` into the registry (useful during doc/archive cleanup or when the candidate analysis is refreshed).
- `claim-lane` helper (CLI) — Run `npm run consolidate -- claim-lane <patternId> --agent <name>` to atomically claim the next Stage 6 lane without risking collisions.
- `append-activity` helper (CLI) — Run `npm run consolidate -- append-activity <patternId> --lane 6b --summary "Notes"` (or `--stage N`) to log collaborative evidence without altering lane status.

Maintainers should review the schema alongside the CLI/generator design when extending edge-case handling (multiple agents, reopened stages, evidence updates, etc.). Routine operation does not require manual schema edits—stick to the CLI flows.

Once ratified, the registry will become authoritative; Markdown files move to generated artefacts with minimal manual editing.

Historical planning artefacts (`PLAN_TEMPLATE.next.md`, `migration-plan.md`, `utility-consolidation-*.next.md`, etc.) now live under `Templum/archive/dev-files/` for reference without cluttering the active workflow.

> Stage 1 onboarding data is embedded in the registry itself. After running the seeding script (or the CLI refresh pipeline), `safe-consolidation-candidates.md` can be archived without losing pattern context.

> The CLI regenerates generated Markdown (plans, tracker, activity log) automatically after each write. Use `npm run consolidate -- regen --check` only when you need a dry-run verification, such as in CI.

> Stage 5 owners manage guardrails, shared files, approvals, and acknowledgements through `npm run consolidate -- update-handoff`, which keeps hand-off contracts in the registry and visible inside the CLI guidance. Log-path validation remains a manual responsibility—double-check evidence paths before closing lanes or stages.
