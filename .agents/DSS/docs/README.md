---
tags: [documentation, overview, guide]
provides: [docs_directory_overview]
requires: [docs/documentation_index.md]
---

# DSS Documentation

This directory contains documentation for the DSS (Data SuperStructure) framework. For a complete and organized view of all documentation, see the [Documentation Index](docs/documentation_index.md).

## Key Documentation Files

### For New Users

- [Getting Started Guide](docs/getting_started.md) - Complete introduction for new users
- [Troubleshooting Guide](docs/troubleshooting.md) - Solutions for common issues and problems

### Core Concepts

- [Task Decomposition](docs/task_decomposition.md) - Method for breaking down tasks into atomic subtasks
- [Designing AI Interaction](docs/designing_ai_interaction.md) - Guidelines for effective LLM interaction
- [Architecture](docs/architecture.md) - System architecture overview

### Tools & Automation

- [Automated Formatting](docs/automated_formatting) - Guide to automatic formatting tools
- [Filename Transformations](docs/filename_transformations.md) - Examples of filename standardization
- [API Reference](docs/api_reference.md) - Reference for DSS API

### Documentation Maintenance

- [How to Update Index](docs/how_to_update_index.md) - Instructions for maintaining the INDEX.md file
- [Index Template Usage](docs/index_template_usage.md) - Guide for using the INDEX.md template

## Templates

Documentation templates can be found in the [meta/templates/docs/](meta/templates/docs/README.md) directory:

- [Tutorial Template](meta/templates/docs/tutorial.md) - For step-by-step instructional content
- [Reference Template](meta/templates/docs/reference.md) - For technical reference documentation
- [Concept Template](meta/templates/docs/concept.md) - For explaining concepts and principles
- [Troubleshooting Template](meta/templates/docs/troubleshooting.md) - For common issues and solutions
- [Quickstart Template](meta/templates/docs/quickstart.md) - For abbreviated guides

## Documentation Standards

All documentation files should:

1. Include YAML front-matter with tags, provides, and requires
2. Use markdown formatting with proper headings and structure
3. Include cross-references to related documentation using `` links
4. Follow the appropriate template for the type of documentation
5. Be placed in the appropriate directory based on content type

## Contributing to Documentation

When adding new documentation:

1. Use the appropriate template from [meta/templates/docs/](meta/templates/docs/README.md)
2. Add the file to the appropriate directory
3. Update the [Documentation Index](docs/documentation_index.md)
4. Update cross-references in related documentation

## Archived Documentation

Deprecated or historical content is stored in the `docs/🔒archive/` directory. This content should not be edited, summarized, or used for generation.
