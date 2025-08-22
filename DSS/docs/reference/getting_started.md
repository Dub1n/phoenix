---
tags: [documentation, guide, onboarding, beginner]
provides: [getting_started_guide]
requires: [meta/DSS_GUIDE.md]
---

# Getting Started with DSS (Data SuperStructure)

This guide will walk you through setting up and using the DSS framework for your projects. DSS is designed to make any dataset or codebase  
feel native to LLMs with minimal prompt tokens, zero duplicated effort, and clear navigation for humans.

## Table of Contents

- [What is DSS?](#what-is-dss)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Concepts](#basic-concepts)
- [Common Workflows](#common-workflows)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## What is DSS?

Data SuperStructure (DSS) is a structured, LLM-compatible project framework designed to:

- Enable transparent, documented evolution of code, data, and ideas
- Support human+AI collaboration through consistent structure and metadata
- Use automation and LLMs to generate and maintain clean, living documentation

The core benefits of DSS include:

| Need | DSS Answer |
|------|------------|
| *Fast recall* | Summaries + tags keep prompts short |
| *Modularity* | Each concept lives in its own file—no giant blobs |
| *Human UX* | GitHub renders; Obsidian graphs; Cursor searches |
| *Self-healing* | An LLM can update docs/links/canvas in one pass |

## Prerequisites

Before getting started with DSS, ensure you have:

- Python 3.8 or higher
- Git
- An OpenAI API key (for LLM-powered automation)
- [Optional] VS Code or Cursor IDE for enhanced integration

## Installation

### Option 1: Create a new DSS project

```bash
# Clone the DSS template repository
git clone https://github.com/yourusername/dss_template_repo.git my_project

# Navigate to your new project
cd my_project

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r meta/requirements.txt

# Initialize the project
python meta/init_dss_project.py --name "My Project" --description "A description of my project"
```

### Option 2: Convert an existing project to DSS

```bash
# Clone the DSS template repository
git clone https://github.com/yourusername/dss_template_repo.git dss_tools

# Navigate to the tools
cd dss_tools

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r meta/requirements.txt

# Set your OpenAI API key
export OPENAI_API_KEY=sk-...  # On Windows: set OPENAI_API_KEY=sk-...

# Convert your existing project
python meta/convert_to_dss.py --source ~/path/to/your/project --dest ~/path/to/output
```

## Quick Start

Once you have a DSS project set up, here's how to get started quickly:

1. **Explore the structure**: Browse the folders to understand the organization

   ```text
   /src/         → Source code or execution logic
   /data/        → Data files used or generated
   /docs/        → Documentation written by humans or LLMs
   /canvas/      → Obsidian Canvas JSON diagrams (optional)
   /meta/        → Scripts, prompts, config, and automation logic
   /tests/       → Test files and validation datasets
   ```

2. **Create or edit content**: Add your code to `src/`, documentation to `docs/`, etc.

3. **Generate documentation**: After adding content, run the documentation generator

   ```bash
   python meta/llm_tasks.py --mode docs
   ```

4. **View the INDEX**: Open `INDEX.md` to see a structured overview of your project

## Basic Concepts

### Front-matter

DSS uses YAML front-matter at the top of files for metadata:

```markdown
---
tags: [documentation, guide, example]
provides: [example_concept]
requires: [other_concept]
---

# Document Title
```

Key front-matter fields:

- `tags`: Categories and concepts for indexing
- `provides`: What concepts this file defines
- `requires`: Dependencies on other concepts

### File Organization

DSS organizes content by type and purpose:

- Source code goes in `src/`
- Documentation goes in `docs/`
- Data files go in `data/`
- Diagrams go in `canvas/`
- Configuration and scripts go in `meta/`

### Cross-referencing

Link between files using Markdown links with the `mdc:` prefix:

```markdown
See the [DSS Guide](mdc:meta/DSS_GUIDE.md) for more information.
```

## Common Workflows

### Adding New Content

1. Create your file in the appropriate directory
2. Add front-matter with tags, provides, and requires
3. Link to related files using `mdc:` links
4. Run `python meta/llm_tasks.py --mode docs` to update documentation

### Updating Documentation

```bash
# Generate summaries and documentation
python meta/llm_tasks.py --mode docs

# Update cross-links
python meta/llm_tasks.py --mode links

# Generate visual canvas
python meta/llm_tasks.py --mode canvas
```

### Using with LLMs

1. When using Cursor or another AI-enabled IDE, the DSS structure helps the AI understand your codebase
2. The `assistant.md` file provides instructions to the AI
3. The structured format reduces token usage and improves responses

## Configuration

DSS is configurable through the `meta/dss_config.yml` file:

```yaml
# Example configuration
patterns:
  code:
    - "**/*.py"
    - "**/*.ipynb"
  data:
    - "**/*.csv"
    - "**/*.parquet"
  docs:
    - "**/*.md"
    - "**/*.rst"

defaults:
  tags: ["draft"]
  provides: []
  requires: []

# More configuration options...
```

Key configuration options:

- `patterns`: Define file types for each category
- `defaults`: Default metadata for new files
- `ignore`: Patterns to exclude from processing

## Troubleshooting

### Common Issues

#### Front-matter Validation Errors

If you see errors like "Invalid front-matter in file.md":

1. Check that your YAML front-matter is properly formatted
2. Ensure required fields (tags, provides, requires) are present
3. Run `python meta/scripts/frontmatter_validation.py --fix` to auto-correct issues

#### Documentation Generation Fails

If `llm_tasks.py` fails:

1. Verify your OpenAI API key is set correctly
2. Check for network connectivity issues
3. Look for error messages in the output for specific issues

#### LLM Not Understanding Your Project

If your AI assistant isn't giving good responses:

1. Check that your `assistant.md` file is up to date
2. Ensure your files have proper front-matter
3. Run `python meta/llm_tasks.py --mode docs` to refresh the documentation

## Next Steps

Now that you have a basic understanding of DSS, here are some next steps:

1. Reviewing the [DSS Guide](mdc:meta/DSS_GUIDE.md) for detailed information
2. Exploring the [Examples](mdc:docs/examples/) for practical applications
3. Customizing your project's templates in `meta/templates/`
4. Setting up continuous integration to automate documentation updates

For more detailed information on specific topics, refer to:

- [Documentation Index](mdc:docs/documentation_index.md)
- [CLI Reference](mdc:docs/cli_reference.md)
- [Troubleshooting Guide](mdc:docs/troubleshooting.md)

---

We hope this guide helps you get started with DSS! If you have questions or feedback, please see our  
[Contribution Guidelines](mdc:CONTRIBUTING.md) for how to get involved.
