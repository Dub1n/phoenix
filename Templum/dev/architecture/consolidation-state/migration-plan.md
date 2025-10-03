# Migration Plan — Manual Workflow → Registry-Driven Process (Draft)

## Guiding Principles

- No disruption to the current consolidation cohort; manual updates continue until the registry workflow proves parity.
- Incremental adoption: introduce registry + tools alongside existing docs, validate outputs, then flip the source of truth.
- Preserve audit history: generated Markdown must retain prior entries/notes (import historical data into registry before cut-over).

## Stage 0 — Preparation (Week 0)

1. **Backfill registry**
   - Populate `consolidation-state.json` using current plan/tracker/log data for Patterns 5–7.
   - Run schema validation and peer review entries for completeness.
2. **Set up tooling scaffold**
   - Implement CLI skeleton with read-only commands (`status`, `regen`).
   - Implement generator pipeline, but write outputs to `*.generated.md` for comparison only.
3. **Review**
   - Share outputs with cohort; verify that generated views match the manually maintained files (diff check).

## Stage 1 — Dual Write (Week 1)

1. **Enable CLI updates for pilot lanes**
   - Agents continue manual documentation but also run `update-lane` to record the same data in the registry.
   - Introduce `npm run consolidate -- regen --check` in CI to detect discrepancies between registry-generated views and manual files.
2. **Reconcile discrepancies**
   - When diff arises, determine whether registry or manual doc has the source truth.
   - Update both to stay consistent; capture lessons learned about missing fields or CLI gaps.
3. **Feedback loop**
   - Collect agent feedback on CLI prompts, data shape, missing guardrails, etc.

## Stage 2 — Generated Views (Week 2)

1. **Flip Markdown to generated**
   - Replace manual plan/tracker/log with generator output.
   - Archive prior manual copies under `archive/` for historical reference.
   - Update `README.md` in each doc folder to state they are auto-generated.
2. **Retire manual edits**
   - Update playbook/onboarding to instruct agents to use the CLI for all status updates.
   - Add git pre-commit hook to block direct edits to generated files (unless `ALLOW_DOC_EDIT=1`).

## Stage 3 — Full Adoption (Week 3)

1. **Remove redundant workflows**
   - Delete manual update sections from playbook.
   - Update `safe-consolidation-candidates.md` references to point to CLI commands for status.
2. **Extend registry coverage**
   - Import remaining patterns (8+). Ensure data quality by pairing with owners.
3. **Automate validations**
   - Add CI job to validate schema + ensure generator output matches committed Markdown.
   - Add optional metrics (e.g., percent lanes complete) for reporting.

## Rollback Strategy

- If generated docs diverge or CLI blocks critical work, fall back to manual updates by restoring previous Markdown copies (kept in git history) and pausing registry writes.
- Registry entries can be regenerated from manual docs using import scripts; keep import tooling ready until cut-over stabilizes.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Agents forget to run CLI | Add reminder in Stage 6 gating checklist; instrument lint rule that fails if registry missing expected activity entry. |
| CLI errors block urgent work | Provide manual override flag (`--force`) that logs the bypass and requires follow-up review. |
| Schema becomes too rigid | Versioned schema allows incremental evolution; maintain migration scripts between versions. |
| Generated docs lose context | Preserve free-form appendices; ensure historical activity entries imported before flip. |

## Success Criteria

- Generated Markdown matches manual doc content for at least two consecutive weeks.
- Agents report lower overhead (single update action) with no loss in clarity.
- CI enforces schema validation and doc regeneration without false positives.
