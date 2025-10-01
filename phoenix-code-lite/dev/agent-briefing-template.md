# Phoenix Code Lite Agent Briefing Template

## 1. Context
- Milestone / playbook: `<link to meta/workflows/...>` (create before beginning work).
- Progress tracker reference: `docs/current/progress.md` → Step 0 / targeted requirement group.
- Dependency map: generate `dev/tasks/pcl_task_dependencies.json` (mirror other projects) and update when task prerequisites shift.

## 2. Pre-Flight
- Update workspace, install dependencies (`npm install`).
- Confirm prerequisite tasks are complete and log intended work in the milestone coordination log.
- Run baseline checks:
  - `npm run lint`
  - `npm test` or targeted suites relevant to assigned tasks.

## 3. Execution Notes
- Use playbook evidence ledger structure for storing artifacts (e.g., `reports/qms/<YYYYMMDD>/`).
- Coordinate schema/contract adjustments with Validation System playbook owners.
- Record interim outputs (skins, validator results, release bundle drafts) for downstream consumers.

## 4. Handoff Checklist
- Document code changes, tests run, and artifact paths.
- Update playbook ledger and `docs/current/progress.md` status entries.
- Regenerate dependency map JSON after modifying task prerequisites.
- Flag cross-project impacts (Validation System, Templum) in the coordination log.

## 5. References
- Architecture spec: `docs/current/architecture-spec.md`
- Playbooks: `meta/workflows/`
- Templates: `meta/templates/`
