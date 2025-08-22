---
tags: [guide]
provides: [how_to_update_index_guide]
requires: [INDEX.md, project_structure]
---

# How to Update the Project Index (INDEX.md)

This guide provides instructions on how to maintain and update the main project index file, `INDEX.md`. The `INDEX.md` file serves as a quick reference to the key directories and components of the DSS project structure.

## Purpose of INDEX.md

`INDEX.md` provides a high-level overview of the project layout, mapping component names (like Data, Code, Docs) to their respective directories and a brief description of their purpose. This helps both humans and automated tools (like LLMs) quickly understand where different parts of the project are located.

## When to Update INDEX.md

Update `INDEX.md` whenever:

*   New top-level directories relevant to the project structure are added.
*   Existing top-level directories are renamed or removed.
*   The core purpose or description of a major project component changes.

## How to Update INDEX.md

1.  **Review the current project structure:** Look at the root directory of the repository to understand the current layout.
2.  **Use the template (recommended):** Use the standardized template located at `meta/templates/index_template.md` as a starting point. See [Using the INDEX.md Template](mdc:docs/index_template_usage.md) for detailed instructions.
3.  **Open `INDEX.md`:** Locate and open the `INDEX.md` file in the project root.
4.  **Update the file structure:** Edit the file tree section to reflect the current project directories and files.
    * Each entry should have a Markdown link to its corresponding anchor in the descriptions section.
    * Use proper indentation to show the hierarchy of directories and files.
5.  **Update the descriptions:** Make sure each item in the file tree has a corresponding description.
    * Use level 3 headings (`###`) for directories and level 4 headings (`####`) for files.
    * Provide a clear, concise description of each item's purpose and function.
6.  **Ensure consistency:** Make sure the document accurately reflects the directories and their contents as described in other documentation (e.g., the Canonical Folder Layout in `docs/automated_formatting.md`)
7.  **Save the file.**

There are currently no automated scripts specifically for updating `INDEX.md`; it is a manual documentation task. For detailed guidance on using the standardized template, refer to [Using the INDEX.md Template](mdc:docs/index_template_usage.md). 