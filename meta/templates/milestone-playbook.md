# Milestone Playbook — Template

## 1. Summary

- **Milestone name:** `<Milestone>`
- **Target window:** `<YYYY-MM-DD → YYYY-MM-DD>`
- **Primary outcome:** `<What cross-project capability is delivered?>`
- **Leads:** `<Coordinator / reviewer>` · `<Automation contact>`

## 2. Scope & Boundaries

- **Included:** `<Systems/interfaces covered>`
- **Excluded:** `<Deferred areas or explicit out-of-scope work>`
- **Entry criteria:**
  - `<Prereq 1>`
  - `<Prereq 2>`
- **Exit criteria:**
  - `<Demonstrable outcome or validation>`
  - `<Documentation updates required>`

## 3. Workstreams

| Stream   | Intent                     | Key tasks                      | Owners                |
| -------- | -------------------------- | ------------------------------ | --------------------- |
| `<Name>` | `<Why this stream exists>` | `<Task refs (dev/tasks/*.md)>` | `<Agents / rotation>` |
|          |                            |                                |                       |

> **Note:** Reference task markdown files directly. If new work is needed, create a task file before listing it here.

## 4. Agent Operating Instructions

- **Briefing cadence:** `<Async stand-up checklist / office hours>`
- **Pre-flight checklist (run before editing):**
  - `<Command>` (e.g., `npm run lint`)
  - `<Command>` (e.g., targeted tests)
- **Handoff protocol:** `<What evidence/logs must be attached before a task is marked complete?>`
- **Documentation updates:** `<List of docs to touch + responsible stream>`

## 5. Evidence Ledger

| Artifact                   | Location      | Produced by    | Notes              |
| -------------------------- | ------------- | -------------- | ------------------ |
| `<Generated skin payload>` | `reports/...` | `<Task/agent>` | `<Validation cmd>` |
|                            |               |                |                    |

Store raw outputs inside the referenced path and link them here. Keep filenames stable (append timestamps if multiple revisions are expected).

## 6. Automation & Quality Gates

- **Preparation:** Confirm every script or command listed below exists; create or stub missing scripts before kickoff and record the location in the playbook.
- **Smoke scripts:** `<Command + expected status>`
- **CI hooks / scheduled jobs:** `<Workflow name or manual trigger instructions>`
- **Blocking conditions:** `<Describe what halts the milestone (e.g., failed smoke, missing artifact)>`

## 7. Coordination Log

- `<YYYY-MM-DD>` — `<Decision / escalation>`
- `<YYYY-MM-DD>` — `<Dependency resolved>`

Keep log entries short; link to supporting docs or PRs.

## 8. Post-Milestone Tasks

- `<Follow-up task file>` — `<owner>`
- `<Retro / doc consolidation>` — `<owner>`

---

> Duplicate this template for each milestone and file it under `meta/workflows/`. Update the metadata in Section 1 and keep sections synchronized with progress trackers.
