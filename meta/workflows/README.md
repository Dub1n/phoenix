# Workflow Playbooks

## Purpose

- Centralise milestone playbooks that coordinate multi-stream execution across projects.
- Provide a quick index to active/archived playbooks and ensure agents know where to look before starting work.
- Capture links to supporting templates, dependency maps, and reporting directories.

## Getting Started

1. Review active playbooks listed below and open the relevant file in this directory.
2. If no playbook exists for the upcoming milestone, duplicate `../templates/milestone-playbook.md` and populate the sections (summary, scope, workstreams, evidence ledger, automation).
3. Update the associated project `docs/current/progress.md`:
   - Add the playbook path to **Step 0 — Playbook Setup** and **Action Items**.
   - Insert a milestone marker in the project Gantt chart referencing the playbook.
4. Ensure smoke/validation scripts referenced in the playbook exist (stub them if necessary) before kicking off execution.

## Active Playbooks

- `milestone-01-templum-haruspex-skin-handshake.md` — Templum ↔ Haruspex skin handshake (Templum, Haruspex).

## Templates & References

- Playbook template: `../templates/milestone-playbook.md`
- Architecture overview: `../ARCHITECTURE.md`
- Dependency maps: consult each project’s `dev/tasks/*_task_dependencies.json` (generate fresh copies after major task edits).
- Reporting directories: `reports/` tree per project (see playbook evidence ledgers for exact paths).

## Maintenance Checklist

- [ ] Add new playbooks to “Active Playbooks” with a one-line description.
- [ ] Move completed playbooks to an “Archived” subsection (create when needed) and note the completion date.
- [ ] Verify milestone markers in progress Gantt charts align with active playbooks.
- [ ] Refresh dependency map JSON files after changing task prerequisites and note the update in the related playbook.
