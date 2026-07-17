# Validation System Agent Briefing Template

## 1. Context
- Milestone / playbook: `<link to meta/workflows/...>` (create in Step 0 before implementing streams).
- Progress tracker reference: `docs/current/progress.md` → Step 0 / relevant requirement group.
- Dependency map: `dev/tasks/validation_task_dependencies.json` (regenerate when prerequisites change).

## 2. Pre-Flight
- Sync repository and install dependencies (`npm install`).
- Review assigned task markdown and verify prerequisites.
- Log planned work in the milestone coordination log (`meta/workflows/`).
- Run baseline checks:
  - `node scripts/validation/tests/unit/<suite>.js`
  - `node scripts/validation/tests/integration/test-enhanced-system.js`

## 3. Execution Notes
- Follow playbook workstream instructions and update evidence ledger entries (e.g., reports under `scripts/validation/results/`).
- Coordinate schema/policy changes with Phoenix Code Lite owners; capture decisions in coordination log.
- Keep smoke/automation scripts referenced in the playbook up to date.

## 4. Handoff Checklist
- Summarise code changes, test commands, and policy/schema updates.
- Update playbook ledger and `docs/current/progress.md` statuses.
- Regenerate `validation_task_dependencies.json` if dependencies changed.
- Attach audit/log outputs in the artifacts directory and link them from the task file.

## 5. References
- Architecture spec: `docs/current/architecture-spec.md`
- Playbooks: `meta/workflows/`
- Templates: `meta/templates/`
