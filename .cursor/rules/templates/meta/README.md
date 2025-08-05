---
tags: [meta, templates, documentation]
provides: [meta_templates_overview]
requires: [meta/templates/README.md]
---

# Meta Templates

This directory contains templates for meta-level documentation files within the DSS framework.

## Available Templates

### integration_template.md

Template for documenting tool integrations and compatibility solutions. Use this when proposing or documenting:

- Editor plugins (Obsidian, VS Code, Cursor)
- Platform integrations (GitHub Actions, CI/CD workflows)
- AI tool compatibility solutions
- Custom automation tools

The template follows the standardized structure used in `meta/integrations/` and includes all required sections for comprehensive integration documentation.

### assistant_workflow_template.md

Standardized template for creating assistant workflow documents with optimized structure for clarity, consistency, and DSS integration. Use this when creating new assistant workflows that define:

- Step-by-step processes for specific task types
- Clear criteria for workflow selection
- Integration with the DSS maintenance system
- Transition guidance between workflows

The template synthesizes best practices from existing workflows and includes standardized sections for decision-making, maintenance integration, and practical examples.

## Usage

When creating new meta-level documentation:

1. Copy the appropriate template to your target location
2. Replace all placeholder text (indicated by `[brackets]` and `UPPERCASE_PLACEHOLDERS`)
3. Fill in the frontmatter with appropriate tags, provides, and requires
4. Update the status field as the integration progresses
5. Follow the section structure but adapt content to your specific needs

## Related Documentation

- [Integration Guidelines](../../integrations/README.md) - How to use the integration template
- [Template Overview](../README.md) - General template usage guidelines
- [DSS Configuration](../../dss_config.yml) - Default metadata and tagging rules
