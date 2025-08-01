---
tags: [template, index, documentation]
provides: [index_template]
requires: [project_structure]
---

# INDEX.md Template

## Usage Instructions
This template provides a standardized structure for creating or updating the `INDEX.md` file at the project root or in subdirectories. Follow these steps:

1. Copy this template to the desired location (typically project root)
2. Fill in the project-specific details in each section
3. Update the file tree to reflect your actual project structure
4. Add descriptions for key files and directories
5. Remove any sections that don't apply to your project

## Template Structure

---
tags: [project_index]
provides: [file_index, project_structure_overview]
requires: []
---

# Project Index

This document provides an index and overview of the [PROJECT_NAME] project's file structure and key components.

## File Tree Overview

- [/](#root-files)
    - [README.md](#root-readme)
    - [Other key files...](#corresponding-anchor-links)
- [/directory1/](#directory1-description)
    - [key_file1.ext](#directory1-key-file1)
- [/directory2/](#directory2-description)
    - [subdirectory/](#directory2-subdirectory)
        - [key_file2.ext](#directory2-subdirectory-key-file2)

## Detailed Component Descriptions

### Root Files

Important configuration and entry points located at the root of the repository.

#### Root README.md

The main README file for the project, providing a general introduction and overview.

### Directory1 (`/directory1/`)

[Brief description of this directory's purpose and contents]

#### directory1/key_file1.ext

[Description of what this file does and its importance]

### Directory2 (`/directory2/`)

[Brief description of this directory's purpose and contents]

#### directory2/subdirectory/

[Description of this subdirectory's purpose]

#### directory2/subdirectory/key_file2.ext

[Description of what this file does and its importance]

## Related Documentation

- [Link to related doc 1](relative/path/to/doc1.md) - Brief description
- [Link to related doc 2](relative/path/to/doc2.md) - Brief description 