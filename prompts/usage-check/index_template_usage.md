---
tags: [guide, documentation, index]
provides: [index_template_usage_guide]
requires: [meta/templates/index_template.md, INDEX.md]
---

# Using the INDEX.md Template

This guide explains how to use the standardized INDEX.md template for creating or updating the project index file.

## Purpose of INDEX.md

The `INDEX.md` file serves multiple purposes in a DSS project:

1. Provides a high-level overview of the project structure
2. Acts as a navigation aid for both humans and AI tools
3. Documents the purpose and contents of key directories and files
4. Establishes relationships between different project components

## When to Use the Template

Use the `index_template.md` template in the following scenarios:

- Creating a new DSS project
- Restructuring an existing project
- Adding a major new component or directory to a project
- Creating index files for complex subdirectories

## How to Use the Template

1. **Access the template**: The template is located at `meta/templates/index_template.md`

2. **Copy the template**: 
   - For the main project index: Copy to the project root as `INDEX.md`
   - For a subdirectory index: Copy to the subdirectory as `INDEX.md`

3. **Fill in the frontmatter**:
   ```yaml
   ---
   tags: [project_index]
   provides: [file_index, project_structure_overview]
   requires: []
   ---
   ```
   
   - Add any additional relevant tags
   - Update the `provides` array if needed
   - List any dependencies in the `requires` array

4. **Update the project overview**:
   - Replace `[PROJECT_NAME]` with your actual project name
   - Write a concise description of the project or directory

5. **Create the file tree**:
   - List all key directories and important files
   - Use proper indentation to show hierarchy
   - Create anchor links for each item (using lowercase with hyphens)

6. **Write detailed descriptions**:
   - For each item in the file tree, provide a clear description
   - Focus on purpose, function, and relationships to other components
   - Use level 3 headings (`###`) for directories and level 4 headings (`####`) for files

7. **Add related documentation**:
   - Link to other relevant documentation files
   - Use relative paths with the `mdc:` prefix for markdown links when appropriate

## Best Practices

- **Be concise**: Keep descriptions clear and to the point
- **Be comprehensive**: Include all important files and directories
- **Be consistent**: Use consistent formatting and naming conventions
- **Update regularly**: Revise the INDEX.md file when the project structure changes

## Example

See the current [INDEX.md](mdc:INDEX.md) file for a complete example of how to implement the template.

## Related Resources

- [How to Update Index Guide](mdc:docs/how_to_update_index.md) - Additional guidance on maintaining the INDEX.md file
- [INDEX.md Template](mdc:meta/templates/index_template.md) - The source template file 