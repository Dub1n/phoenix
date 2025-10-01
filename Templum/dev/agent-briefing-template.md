# Templum Agent Briefing Template

## 1. Context

- Milestone / playbook: `<link to meta/workflows/...>`
- Related progress tracker section: `docs/current/progress.md` → Step 0 / Action Items / relevant requirement group.
- Dependency map: `dev/tasks/templum_task_prereq_summary.json` (regenerate if prerequisites change).

## 2. Pre-Flight

- Pull latest main branch and install dependencies (`npm install`).
- Review assigned task files under `dev/tasks/` and confirm prerequisites are satisfied.
- Run baseline health checks before editing:
  - `npm run lint`
  - `npm test -- --runTestsByPath <target suites>`

## 3. Execution Notes

- Follow the active playbook’s workstream instructions and update the evidence ledger paths when artifacts are produced.
- Log status updates in the milestone coordination log (`meta/workflows/...`) using short bullet entries (date + decision).
- Capture generated artifacts under `reports/` using the structure defined in the playbook (e.g., `reports/integration/haruspex/<YYYYMMDD>/`).

## 4. Handoff Checklist

- Summarise code changes (files touched, key decisions) and list commands/tests executed.
- Attach artifact paths + validation logs in the task file and playbook evidence ledger.
- Update `docs/current/progress.md` status and any referenced guides.
- Regenerate dependency map JSON if task prerequisites changed.

## 5. References

- Architecture spec: `docs/current/architecture-spec.md`
- Playbooks directory: `meta/workflows/`
- Templates: `meta/templates/`
