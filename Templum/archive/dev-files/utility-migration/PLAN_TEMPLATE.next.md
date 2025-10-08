# Utility Consolidation Plan — Pattern {{patternId}} (Registry Edition Draft)

> Generated sections (status tables, lane checklists, activity logs) will be populated automatically from `consolidation-state.json`. Agents only edit the **Freeform Context** section below when additional narrative is required.

## Freeform Context (Optional)

Use this section for qualitative notes that do not fit the registry data model (e.g., design alternatives considered, stakeholder comms). Keep it concise; do not restate registry data.

---

## Generated Sections (read-only once generation is enabled)

### Stage Summary

| Stage | Status            | Completed At           | Notes            |
| ----- | ----------------- | ---------------------- | ---------------- |
| 1     | {{stage1.status}} | {{stage1.completedAt}} | {{stage1.notes}} |
| 2     | {{stage2.status}} | {{stage2.completedAt}} | {{stage2.notes}} |
| 3     | {{stage3.status}} | {{stage3.completedAt}} | {{stage3.notes}} |
| 4     | {{stage4.status}} | {{stage4.completedAt}} | {{stage4.notes}} |
| 5     | {{stage5.status}} | {{stage5.completedAt}} | {{stage5.notes}} |
| 6     | {{stage6.status}} | {{stage6.completedAt}} | {{stage6.notes}} |
| 7     | {{stage7.status}} | {{stage7.completedAt}} | {{stage7.notes}} |

### Stage 4 Lanes (Prerequisites)

| Lane | Status | Scope | Dependencies | Commands |
| --- | --- | --- | --- | --- |
{{#each stage4Lanes}}
| {{@key}} | {{status}} | {{scope}} | {{formatDependencies dependencies}} | {{formatCommands commands}} |
{{/each}}

### Stage 5 Alignment Snapshot

- **Guardrails**: {{guardrails}}
- **Shared Files**: {{sharedFiles}}
- **Acknowledgements**:
  {{#each acknowledgements}}
  - {{agent}} — {{timestamp}} ({{note}})
  {{/each}}
- **Dependencies**: {{formatDependencies dependencies}}

### Stage 6 Lanes (Living Stage)

| Lane | Status | Scope | Last Updated | Commands |
| --- | --- | --- | --- | --- |
{{#each stage6Lanes}}
| {{@key}} | {{status}} | {{scope}} | {{updatedAt}} | {{formatCommands commands}} |
{{/each}}

### Evidence Archive

| Type | Path | Description |
| --- | --- | --- |
 {{#each evidence}}
| {{type}} | {{path}} | {{description}} |
{{/each}}

### Activity History

{{#each activity}}

#### {{timestamp}} — {{stage}}

- **Agent**: {{agent}}
- **Summary**: {{summary}}
{{#if files}}- **Files**: {{formatFiles files}}
{{/if}}
{{/each}}

---

## Editing Guidance

- Update structured data via CLI commands; do not edit generated sections manually.
- If freeform context contradicts registry content, resolve the registry first.
- Use `npm run consolidate -- regen` after registry changes to refresh this file.

*Template helper functions such as `formatDependencies` and `formatCommands` are defined in the generator pipeline (see `generators.md`).*
