# Haruspex Agent Briefing Template

## 1. Context
- Milestone / playbook: `<link to meta/workflows/...>`
- Progress tracker reference: `docs/current/progress.md` → Step 0 / Action Items / relevant requirement.
- Dependency map: `dev/tasks/haruspex_task_dependencies.json` (regenerate after prerequisite edits).

## 2. Pre-Flight
- Sync repository, install dependencies (`npm install`).
- Verify assigned task prerequisites and update the playbook coordination log with planned work.
- Run baseline checks:
  - `npm run build`
  - `npm test -- --runTestsByPath <target suites>` or `npm run phase6-services -- --services haruspex` as applicable.

## 3. Execution Notes
- Follow playbook workstream guidance and record artifacts in `reports/integration/haruspex/`.
- Publish interim fixtures (e.g., skin payloads, analysis snapshots) to support parallel streams.
- Note blockers/decisions in the playbook coordination log.

## 4. Handoff Checklist
- Provide change summary and commands executed.
- Update playbook evidence ledger with artifact locations and validation results.
- Refresh `docs/current/progress.md` status and any referenced guides.
- Regenerate `haruspex_task_dependencies.json` if task dependencies shifted.

## 5. References
- Architecture spec: `docs/current/architecture-spec.md`
- Playbooks: `meta/workflows/`
- Templates: `meta/templates/`
