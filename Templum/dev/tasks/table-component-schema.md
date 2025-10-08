# Task: Add structured table component to skin schema and adapters

Related requirement: `docs/current/progress.md` → Skin-Driven Rendering → "Table component schema & rendering support".

Tags: `#feature`

## Checklist

- [ ] Update universal skin schema (TypeScript + docs) with a reusable table component definition (columns, rows, cell hints, editable flag, optional actions).
- [ ] Extend Phoenix Code Lite skin exporter contract to emit the new component for QMS checklists/risk registers; document payload expectations with examples referencing Development-Process-1.pdf prompts.
- [ ] Implement CLI + VS Code adapter rendering (including inline editable fields, checkboxes, tooltips) and ensure fallbacks degrade gracefully.
- [ ] Wire row/cell actions to command execution and state updates; persist cell edits back to Phoenix Code Lite via existing command APIs.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: add structured table component` after tests.

## References

- Code: `Templum/src/types/universal-skin-definition.ts`, `Templum/src/types/universal-skin-engine-types.ts`, adapter renderers under `Templum/src/interfaces/`
- Tests: CLI/VS Code integration suites covering rendering + command execution
- Docs: `Templum/docs/current/1.2-Backend-Integration-Guide.md`, `docs/05-QMS-Realignment/01-Aims-and-Objectives.md`, `Development-Process-1.pdf` (pp.6–12)

## Notes

- **Rationale:** Development-Process-1.pdf expects practical developer prompts (Practical Developer Guide, pp.14–21) and IEC 62304 design-review/risk tracking to happen inside the tooling. A structured table/checklist component lets Phoenix Code Lite surface those prompts without hard-coding QMS knowledge into Templum, and the same component can power CRUD dashboards.
- **Schema shape:** Table component should define `columns` (id, label, optional display hints), `rows` (id, `cells` keyed by column id, optional row-level metadata), and per-cell objects containing:
  - `value`: display text or data payload.
  - Optional `ui` hint (e.g., `{ kind: 'checkbox' | 'status' | 'text' | 'badge', display?: 'inline' | 'tooltip' }`).
  - `editable` boolean (default false). Editable cells may include input descriptors (`inputType`, `placeholder`).
  - Optional `actions`: array of buttons/commands with labels, command ids, parameter schema reused from existing command definitions.
  - Optional `state` metadata so Phoenix Code Lite can send updates (e.g., risk status transitions).
- **Rendering obligations:** adapters must render:
  - Static tables when only text cells are present.
  - Checkboxes/inline buttons when `ui.kind` includes interactive hints.
  - Tooltips or note drawers when `display: 'tooltip'` is provided.
  - Inline editing for `editable: true` cells (enter value, submit via action or default “commit” command).
- **Backwards compatibility:** Keep existing skins functioning; adapters should ignore unknown `ui.kind` gracefully. Anchor TypeScript types with discriminated unions where helpful but default to permissive key-value to avoid breaking external backends.
- **Phoenix Code Lite integration:** Document how PCL checklists/risk registers emit rows for Practical Developer Guide items, referencing `Development-Process-1.pdf` sections (e.g., §5.2 unit testing, §3.2 design reviews, §7 risk control). Provide example payload for a sprint checklist row:

```jsonc
{
  "components": {
    "sprintChecklist": {
      "type": "table",
      "title": "Sprint Exit",
      "columns": [
        { "id": "step", "label": "Step" },
        { "id": "status", "label": "Status" },
        { "id": "guidance", "label": "Guidance", "display": "tooltip" },
        { "id": "action", "label": "Action" }
      ],
      "rows": [
        {
          "id": "tdd",
          "cells": {
            "step": { "value": "Unit tests run (Practical Developer Guide §5.2)" },
            "status": { "value": "pending", "ui": { "kind": "status" } },
            "guidance": { "value": "Document test results incrementally.", "ui": { "kind": "note", "display": "tooltip" } },
            "action": {
              "value": "Record result",
              "ui": { "kind": "button" },
              "actions": [
                {
                  "label": "Record result",
                  "command": "qms.recordTestOutcome",
                  "parameters": [
                    { "name": "status", "type": "enum", "choices": ["pass", "fail"] },
                    { "name": "evidencePath", "type": "string", "required": false }
                  ]
                }
              ]
            }
          }
        }
      ]
    }
  }
}
```
- **Potential uses beyond QMS:** CRUD backends can emit inventory tables with inline edit buttons, Haruspex can publish analysis dashboards, and future skin-driven forms can reuse editable cells without adding new schema primitives.
- **Testing:** Add adapter integration tests for CLI/VS Code verifying table rendering, checkbox toggles, editable cells, and command execution; ensure non-interactive tables still render as plain lists.
- Coordinate with procedural windowed TUI task so the new component works with upcoming layout system.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
