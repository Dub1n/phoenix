---
doc-type: documentation-index
id: templum-requirement-task-logs
status: current
tags: [development, tasks, documentation, navigation]
last_updated: 2026-07-16
---

# Requirement Task Logs

Task files in this directory are execution records linked from `docs/current/progress.md`. They are not a second project-wide backlog.

## Lifecycle

- `[ ]` - unstarted requirement with actionable work.
- `[~]` - partially implemented or actively in progress.
- `[!]` - broken or priority-blocking requirement.
- `[x]` - verified complete; retain while linked from current progress as evidence.
- `Superseded` - no new work; identify the replacement task and archive when live references have migrated.

## Ownership

- `progress.md` owns requirement status and prioritisation.
- Each task file owns its checklist, dependencies, validation commands, evidence, and remaining gaps.
- `architecture-spec.md` owns claims about implemented behaviour.
- Generated dependency maps and historical top-level queues do not override these sources.

## 2026-07-16 Audit Note

The legacy `templum-active-tasks.md`, `templum-future-tasks.md`, `templum-roadmap.md`, and `templum-tracker-data.md` system was archived. Its active queue contained only a completed utility-pattern item; its future queue contained unverified 2025 backlog proposals and obsolete metrics. Items were not promoted automatically. Any still-relevant proposal must be revalidated against current code, added to `progress.md`, and given a focused task file.

Completed task logs remain in this directory when `progress.md` links to them as requirement evidence. Superseded logs may be archived after all live links point to their replacement.
