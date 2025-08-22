---
tags: [guide, autoformatter, usage, tutorial]
provides: [autoformatter_usage_guide]
requires: [docs/automated_formatting.md, meta/scripts/dss_autoformat.py]
---

# DSS Auto-formatter Usage Guide

This guide provides practical instructions for using the DSS auto-formatter to transform any repository into DSS structure.

## Installation

### Option 1: Quick Installation

```bash
# Download and run the installer
curl -O https://raw.githubusercontent.com/yourusername/dss_template_repo/main/meta/scripts/install_dss_autoformatter.py
python install_dss_autoformatter.py

# Add to PATH (if needed)
export PATH="$HOME/.local/bin:$PATH"
```

### Option 2: Manual Setup

```bash
# Clone the DSS template repository
git clone https://github.com/yourusername/dss_template_repo.git
cd dss_template_repo

# Install dependencies
pip install -r meta/requirements_autoformatter.txt

# Use the script directly
python meta/scripts/dss_autoformat.py --help
```

## Basic Usage

### Transform a Repository

```bash
# Basic transformation
dss-autoformat --source ./my-project --dest ./my-project-dss

# With dry run to preview changes
dss-autoformat --source ./my-project --dest ./my-project-dss --dry-run

# Transform current directory
dss-autoformat --source . --dest ../my-project-dss
```

### Advanced Options

```bash
# Disable LLM features (faster, rule-based only)
dss-autoformat --source ./my-project --dest ./my-project-dss --no-llm

# Use custom configuration
dss-autoformat --source ./my-project --dest ./my-project-dss --config custom_config.yml

# Preserve git history
dss-autoformat --source ./my-project --dest ./my-project-dss --preserve-git
```

## Configuration

Create a custom configuration file to control the transformation:

```yaml
# custom_dss_config.yml
use_llm_classification: true
preserve_git_history: true
dry_run: false

ignore_patterns:
  - "**/.git/**"
  - "**/node_modules/**"
  - "**/__pycache__/**"
  - "**/.venv/**"
  - "**/build/**"

classification_rules:
  src:
    - "**/*.py"
    - "**/*.js"
    - "**/*.ts"
    - "**/src/**"
    - "**/lib/**"
    - "**/app/**"
  data:
    - "**/*.csv"
    - "**/*.parquet"
    - "**/*.json"
    - "**/*.jsonl"
    - "**/data/**"
    - "**/datasets/**"
  docs:
    - "**/*.md"
    - "**/*.rst"
    - "**/*.txt"
    - "**/docs/**"
    - "**/documentation/**"
  tests:
    - "**/test_*.py"
    - "**/*_test.py"
    - "**/tests/**"
    - "**/spec/**"
  meta:
    - "**/meta/**"
    - "**/.github/**"
    - "**/scripts/**"
    - "**/config/**"
```

## Workflow Examples

### Example 1: Python Data Science Project

```bash
# Transform a typical data science repository
dss-autoformat \
  --source ./ml-project \
  --dest ./ml-project-dss \
  --config data_science_config.yml
```

Expected transformation:
```
Original:                    DSS Structure:
├── notebook.ipynb         ├── src/
├── train.py               │   ├── train.py
├── model.py               │   └── model.py
├── data.csv               ├── data/
├── README.md              │   └── data.csv
└── requirements.txt       ├── docs/
                          │   └── README.md
                          └── meta/
                              └── requirements.txt
```

### Example 2: Web Application

```bash
# Transform a web application
dss-autoformat \
  --source ./my-webapp \
  --dest ./my-webapp-dss \
  --preserve-git
```

Expected transformation:
```
Original:                    DSS Structure:
├── app.py                 ├── src/
├── models.py              │   ├── app.py
├── static/                │   ├── models.py
├── templates/             │   ├── static/
├── tests/                 │   └── templates/
├── README.md              ├── tests/
└── config.yml             │   └── [test files]
                          ├── docs/
                          │   └── README.md
                          └── meta/
                              └── config.yml
```

### Example 3: Research Repository

```bash
# Transform a research repository with papers and code
dss-autoformat \
  --source ./research-project \
  --dest ./research-project-dss \
  --llm-assist
```

The LLM will help classify ambiguous files like:
- Jupyter notebooks (analysis vs documentation)
- LaTeX files (docs vs templates)
- Configuration files (meta vs data)

## Post-Transformation Steps

After running the auto-formatter:

### 1. Review the Structure

```bash
cd my-project-dss
tree -L 2
```

### 2. Verify Cursor Integration (if using Cursor IDE)

Check that the AI assistant intelligence was installed correctly:

```bash
# Check that Cursor rules were installed
ls .cursor/rules/
# Should show: assistant.mdc, dss-overview.mdc, dss-guide.mdc, etc.

# Test the assistant - open any file in Cursor and ask:
# "Create a new analysis notebook following DSS conventions"
# The assistant should understand DSS structure and apply proper frontmatter
```

### 3. Update File Descriptions

Edit the generated `README.md` files in each directory to add meaningful descriptions:

```markdown
## Files

| File | Purpose |
|------|---------|
| train.py | Main training script for the ML model |
| model.py | Model architecture and utilities |
```

### 4. Set Up Development Environment

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r meta/requirements.txt

# Test that everything works
python src/main.py  # or whatever your entry point is
```

### 5. Review and Update Metadata

Check the YAML front-matter added to files and update as needed:

```yaml
---
tags: [ml, training, pytorch]  # Add relevant tags
provides: [trained_model, model_metrics]
requires: [data/training_data.csv, src/model.py]
---
```

### 6. Generate Documentation

If you have an OpenAI API key, generate comprehensive documentation:

```bash
export OPENAI_API_KEY=your_key_here
python meta/llm_tasks.py --mode docs
```

## Troubleshooting

### Common Issues

**1. Permission Errors**
```bash
# Make sure you have write permissions
chmod 755 /path/to/destination
```

**2. Missing Dependencies**
```bash
# Install all optional dependencies
pip install openai gitpython PyYAML
```

**3. LLM Classification Fails**
```bash
# Use without LLM features
dss-autoformat --source ./repo --dest ./repo-dss --no-llm
```

**4. Git History Issues**
```bash
# Skip git history preservation
dss-autoformat --source ./repo --dest ./repo-dss --no-preserve-git
```

### Validation

After transformation, validate the result:

```bash
# Check structure
ls -la my-project-dss/
ls -la my-project-dss/src/
ls -la my-project-dss/docs/

# Check metadata injection
head -10 my-project-dss/src/main.py
head -10 my-project-dss/docs/README.md

# Test functionality (if applicable)
cd my-project-dss
python src/main.py
```

## Best Practices

1. **Always run a dry-run first** to preview changes
2. **Backup your original repository** before transformation
3. **Use custom configurations** for project-specific needs
4. **Review and update generated documentation** after transformation
5. **Test functionality** in the transformed repository
6. **Add meaningful tags and descriptions** to the metadata

## Getting Help

- Review the [Automated Formatting Guide](automated_formatting.md) for technical details
- Check the [DSS Guide](../meta/DSS_GUIDE.md) for framework concepts
- Look at transformation examples in the DSS template repository
- Report issues or ask questions on the GitHub repository

---

The DSS auto-formatter is designed to be safe and reversible. If you encounter any issues, you can always start over with the original repository and adjust the configuration as needed. 