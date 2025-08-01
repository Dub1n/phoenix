---
tags: [assistant_workflow, meta, {add_specific_workflow_tags}]
provides: [assistant_{workflow_name}_workflow]
requires: [meta/assistant_guidelines/maintenance_checklist.md, .cursor/rules/assistant.mdc, {add_other_dependencies}]
---

# Assistant Workflow: {Workflow Name}

{1-2 sentence description of what this workflow is for and its purpose within the DSS framework.}

## When to Use {Workflow Name}

A task should use this workflow if it meets {ALL/MOST} of the following criteria:

1. **{Criterion Category}**: {Specific, testable criterion}
2. **{Criterion Category}**: {Specific, testable criterion}
3. **{Criterion Category}**: {Specific, testable criterion}
4. **{Criterion Category}**: {Specific, testable criterion}
5. **{Criterion Category}**: {Specific, testable criterion}

Examples of {workflow type} tasks:
- {Specific, realistic example 1}
- {Specific, realistic example 2}
- {Specific, realistic example 3}
- {Specific, realistic example 4}

## {Workflow Name} Steps

For tasks meeting the above criteria, follow this workflow:

1️⃣ **{Action-Oriented Step Name}:**
   - {Specific action with clear outcome}
   - {Another specific action}
   - {Include links to relevant DSS resources: [Resource Name](mdc:path/to/resource)}

2️⃣ **{Action-Oriented Step Name}:**
   - {Specific action with clear outcome}
   - {Reference to DSS conventions: Follow [Convention Name](mdc:path/to/convention)}

3️⃣ **{Action-Oriented Step Name}:**
   - {Specific action}
   - {Include frontmatter handling if applicable}

{Continue numbering as needed...}

🔧 **DSS Maintenance Integration:**
   - **Update INDEX.md:** If new files were created or project structure changed, update [INDEX.md](mdc:INDEX.md). See [How to Update Index](mdc:docs/how_to_update_index.md).
   - **Validate Frontmatter:** Ensure proper YAML frontmatter follows [DSS Config](mdc:meta/dss_config.yml) standards.
   - **Check Links:** Verify all MDC links remain valid.
   - **Consult Checklist:** Reference [Maintenance Checklist](mdc:meta/assistant_guidelines/maintenance_checklist.md) for comprehensive guidance.

## Reference Materials

{Include this section only if the workflow needs quick-reference tables, templates, or checklists}

### {Reference Name}
{Table, template, or other reference material}

## Decision Points

If during execution you discover that:
- **{Specific condition}** → Transition to [{Target Workflow}](mdc:meta/assistant_workflows/{target_workflow}.md)
- **{Specific condition}** → Transition to [{Target Workflow}](mdc:meta/assistant_workflows/{target_workflow}.md)
- **{Specific condition}** → Continue with this workflow but {adjustment}

## Integration with Core Process

This workflow integrates with the [Core Process Checklist](mdc:.cursor/rules/assistant.mdc):

- **Step 3 (Categorize Task Type)**: {How this workflow is identified and selected}
- **Steps 5-8**: {How the workflow steps map to the core process execution phases}

## Integration with Other Workflows

### Related Workflows
- **[{Related Workflow}](mdc:meta/assistant_workflows/{related}.md)**: {Relationship and when to use each}
- **[{Related Workflow}](mdc:meta/assistant_workflows/{related}.md)**: {Relationship and when to use each}

### Transition Protocol
When transitioning from this workflow to others, refer to [Workflow Transitions](mdc:meta/assistant_workflows/workflow_transitions.md) for guidance on preserving context and maintaining continuity.

## Practical Examples

{Include this section when examples would significantly help with workflow application}

### Example: {Realistic Scenario Name}

**Initial Task**: {Description of a realistic task}

**Criteria Assessment**: 
- ✅ {Criterion}: {How this task meets it}
- ✅ {Criterion}: {How this task meets it}

**Workflow Application**:
1. **{Step}**: {What was done and outcome}
2. **{Step}**: {What was done and outcome}
3. **{Step}**: {What was done and outcome}

**Result**: {Final outcome and any lessons learned}

## Template Usage Notes

{Delete this section when using the template}

**Instructions for using this template:**
1. Replace all `{placeholder}` text with specific content
2. Choose "ALL" or "MOST" for criteria based on workflow exclusivity
3. Delete optional sections (Reference Materials, Examples) if not needed
4. Ensure emoji step numbering follows 1️⃣ 2️⃣ 3️⃣ pattern
5. Include the DSS Maintenance Integration section in every workflow
6. Link to actual DSS resources using `mdc:` prefix
7. Test criteria with realistic scenarios to ensure clarity
8. Update INDEX.md after creating the new workflow file 