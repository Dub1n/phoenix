---
date: 2025-10-10T14:30:00Z
name: display-stack-alignment
TASK-ID: ['TASK-ARCH-005-ALIGN']
category: architecture-operations
status: ['[x]']
tags: ['utility-consolidation', 'stage-5', 'alignment', 'display-stack']
dependencies: ['utility-consolidation-playbook', 'utility-consolidation-plans/pattern-5.md', 'utility-consolidation-plans/pattern-6.5.md', 'utility-consolidation-plans/pattern-7.md']
---

# Display Stack Stage 5 Alignment Spec

Stage 4 prerequisites across Patterns 5–7 are complete; this document captures the consolidated baseline and Stage 5 outcomes so migrations can proceed without re-scraping individual plans.

## Alignment Snapshot

- **Coordinator**: Codex (assigned 2025-10-09)
- **Last Updated**: 2025-10-10T14:30:00Z (Stage 5 alignment session)
- **Stage 4 Status**:
  - Pattern 5: Stage 4 handoff block populated 2025-10-08 — see `utility-consolidation-plans/pattern-5.md#stage-4-handoff-block`
  - Pattern 6.5: Stage 4 lanes 4a/4b/4c closed 2025-10-07 — DI seams and spacing constants logged in `utility-consolidation-plans/pattern-6.5.md`
  - Pattern 7: Stage 4 lanes 4a/4b/4c closed 2025-10-08 — window/theme constants and CLI regression harness recorded in `utility-consolidation-plans/pattern-7.md`

## Shared Constants & Defaults (Stage 4 baseline)

| Domain | Baseline Value | Notes |
| ------ | -------------- | ----- |
| Terminal width fallback | `80` columns | Terminal Formatter capability provider (`pattern-6.5` Stage 4a) |
| Test width baseline | `96` columns | `display-columns-provider` mock shared across cohorts |
| Separator length clamp | `Math.min(width - 4, 60)` | Display/Window utils rely on formatter spacing constants |
| Default padding | `2` | Applies to separator + window spacing helpers |
| Window border glyph map | `WINDOW_BORDER_GLYPHS` | Exported from Window Utils Stage 4b |

## Dependency Injection Seams

- `DisplayUtils.configure({ logger, formatter, columnsProvider })`
- `WindowUtils.configureWindowUtilsFormatter(formatterProvider)`
- `TerminalFormatter.configure({ capabilitiesProvider, columnsFallback })`

Provider wiring across utilities now shares the formatter and columns provider helpers; Stage 5 should verify that consumer modules adopt these seams without introducing additional globals.

## Reusable Test Helpers

- `Templum/src/tests/helpers/display-columns-provider.ts`
- `Templum/src/tests/helpers/terminal-formatter-fixtures.ts`
- `Templum/src/tests/helpers/terminal-capabilities.ts`
- `Templum/src/tests/helpers/window-utils-fixtures.ts`
- `Templum/src/tests/utils/terminal-formatter.test.ts`
- `Templum/src/interfaces/__tests__/adaptive-cli-integration.test.ts` (Stage 4 regression baselines)

## Stage 5 Session Summary

- **Meeting Time**: 2025-10-10T14:00:00Z (45 min, async follow-up for notes)
- **Attendees**: Codex (Coordinator, Patterns 5–7 owner), Display Utils owner, Terminal Formatter owner, Window Utils owner
- **Agenda**: Confirm shared constants, lock DI + testing seams, and publish Stage 6 gating checklist.
- **Decisions**:
  - Retain `TERMINAL_FORMATTER_SPACING`/`WINDOW_SPACING` as the single source for separator length, padding, and margin; Stage 6 migrations must remove any bespoke constants they encounter instead of adding adapter layers.
  - All consumer modules entering Stage 6 must inject formatter + columns providers via `DisplayUtils.configure` and `WindowUtils.configureWindowUtilsFormatter`; direct `chalk` imports remain prohibited and must be flagged during migration reviews.
  - CLI and navigation migrations will treat `96` columns as the deterministic test baseline and assert ASCII fallbacks using `TerminalFormatter.withFallback`; leak-guard harnesses (`run-with-timeout.mjs`) stay mandatory for the CLI suites listed below.
  - Shared helper ownership: Pattern 6.5 maintains `terminal-formatter-fixtures`, Pattern 5 owns `display-columns-provider`, and Pattern 7 maintains `window-utils-fixtures`; any changes require cross-pattern review before merge.
- **Deliverables**:
  - This spec updated to reflect Stage 5 outcomes and approvals.
  - Stage 5 sections in patterns 5–7 plans updated with acknowledgement checkboxes and Stage 6 readiness notes.
  - Tracker cells (schedule + safe-consolidation) flipped to `[x]` for Stage 5.

## Per-Pattern Stage 5 Preparation Checklist

- Update each pattern plan (Stage 5B) with Stage 6 readiness notes, referencing this spec for constants, DI seams, and helper ownership.
- Execute the Stage 6 gating suites listed below (and re-run as needed) until every lane shows `Ready` with evidence paths stored in the plan and activity log; scheduling without execution keeps Stage 5B open.
- Confirm dependency seams (`configure`/`reset` hooks) are ready for injection and capture any coordination requirements before opening Stage 6 lanes.
- Flip the schedule cell to `C[x] P[x]` only after Stage 5B notes are committed, the activity log entry is filed, and all Stage 6 lanes are unblocked with attached evidence.
- Escalate unresolved blockers back to Stage 3 and annotate them here so subsequent cohorts inherit the context.

## Approvals

- Pattern 5 owner (Display Utils): `[x]` — Codex (2025-10-10T14:22:00Z)
- Pattern 6.5 owner (Terminal Formatter): `[x]` — Codex (2025-10-10T14:23:00Z)
- Pattern 7 owner (Window Utils): `[x]` — Codex (2025-10-10T14:24:00Z)

## Outstanding Risks / Follow-ups

- Theme Utils (Pattern 8) remains in discovery; re-run the CLI + formatter gating suites when palette APIs land to ensure spacing constants hold.
- Watch for lingering chalk imports uncovered by Stage 6 diffs; if discovered, reopen Stage 3 to add remediation tasks before continuing migrations.
- Keep leak-guard tooling (`run-with-timeout.mjs`) in the CLI workflows; Stage 6 completion requires attaching the resulting log files to activity entries.

## Stage 6 Entry Checklist

- Re-run the shared gating suites before migrating each lane: `src/tests/utils/terminal-formatter.test.ts`, `src/tests/utils/display-utils.test.ts`, `src/tests/utils/window-utils.test.ts`, `src/interfaces/__tests__/adaptive-cli-integration.test.ts`, `src/interfaces/navigation/__tests__/navigation-system.test.ts`.
- Confirm every consumer module calls `DisplayUtils.configure`/`reset`, `WindowUtils.configure`/`reset`, and uses `createFormatter` outputs instead of local chalk instances.
- Capture Stage 6 lane evidence in pattern plans and link back to this spec for any DI or constant references.
- Update `docs/current/progress.md` once the first Stage 6 lane closes to broadcast the alignment milestone.

## Activity Log References

- 2025-10-10 — Cohort B Display Stack — Stage 5 alignment session (see `utility-consolidation-activity-log.md`).

Update this document during Stage 5 execution and link back to each pattern plan & tracker entry.
