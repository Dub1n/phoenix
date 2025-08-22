---
tags: [documentation, guide, frontmatter, validation]
provides: [frontmatter_validation_usage]
requires: [meta/scripts/frontmatter_utils.py, meta/guidelines/validation_rules.md]
---

# Frontmatter Validation & Auto-correction Tools

This document describes how to use the frontmatter validation and auto-correction tools provided in `meta/scripts/frontmatter_utils.py`.

## Overview

The frontmatter validation tool checks YAML frontmatter in Markdown and Python files against the DSS guidelines. It can also automatically fix common issues when run with the auto-correction option.

### Features

- Validates frontmatter in Markdown (.md) and Python (.py) files
- Checks for required fields (tags, provides, requires)
- Validates field types and formats
- Auto-corrects common issues:
  - Adding missing required fields
  - Converting string values to lists
  - Fixing non-string items in lists
- Processes individual files or entire directories
- Provides detailed error messages and correction reports

## Installation

The script requires Python 3.6+ and the following dependencies:

- PyYAML
- pathlib (included in Python 3.4+)

These dependencies are already included in the repository's requirements.

## Usage

### Basic Usage

To validate frontmatter in a single file:

```bash
python meta/scripts/frontmatter_utils.py path/to/file.md
```

To validate frontmatter in a directory:

```bash
python meta/scripts/frontmatter_utils.py path/to/directory
```

### Auto-correction

To automatically fix issues found during validation:

```bash
python meta/scripts/frontmatter_utils.py --auto-correct path/to/file.md
```

### Recursive Directory Processing

To process directories recursively:

```bash
python meta/scripts/frontmatter_utils.py --recursive path/to/directory
```

### Dry Run Mode

To check what changes would be made without actually making them:

```bash
python meta/scripts/frontmatter_utils.py --auto-correct --dry-run path/to/file.md
```

### Verbose Output

For detailed validation messages:

```bash
python meta/scripts/frontmatter_utils.py --verbose path/to/file.md
```

### Custom Configuration

To use a custom DSS configuration file:

```bash
python meta/scripts/frontmatter_utils.py --config path/to/config.yml path/to/file.md
```

## Command-line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--auto-correct` | `-a` | Automatically correct issues |
| `--dry-run` | `-d` | Only validate, don't modify files |
| `--recursive` | `-r` | Process directories recursively |
| `--verbose` | `-v` | Show detailed validation messages |
| `--config` | `-c` | Path to DSS config file |

## Examples

### Example 1: Basic Validation

```bash
python meta/scripts/frontmatter_utils.py docs/getting_started.md
```

Output:
```
❌ docs/getting_started.md
  - Validation error: Missing required field: provides

Processed 1 files:
  - 0 passed validation
  - 1 had validation errors
```

### Example 2: Auto-correction

```bash
python meta/scripts/frontmatter_utils.py --auto-correct docs/getting_started.md
```

Output:
```
❌ docs/getting_started.md
  - Validation error: Missing required field: provides
  - Auto-correction: Added missing field: provides
  - Updated frontmatter in: docs/getting_started.md

Processed 1 files:
  - 0 passed validation
  - 1 had validation errors
```

### Example 3: Recursive Directory Processing

```bash
python meta/scripts/frontmatter_utils.py --recursive --auto-correct docs/
```

Output:
```
✅ docs/index.md
❌ docs/getting_started.md
  - Validation error: Missing required field: provides
  - Auto-correction: Added missing field: provides
  - Updated frontmatter in: docs/getting_started.md
❌ docs/tutorials/basic.md
  - Validation error: Tags must be a list
  - Auto-correction: Converted tags from string to list
  - Updated frontmatter in: docs/tutorials/basic.md

Processed 3 files:
  - 1 passed validation
  - 2 had validation errors
```

## Integration with Other Tools

### Pre-commit Hook

You can add the frontmatter validation as a pre-commit hook by adding the following to your `.pre-commit-config.yaml`:

```yaml
- repo: local
  hooks:
    - id: validate-frontmatter
      name: Validate Frontmatter
      entry: python meta/scripts/frontmatter_utils.py --dry-run
      language: system
      types: [markdown, python]
      exclude: (docs/🔒archive/|.*\.md\.backup)
```

### Continuous Integration

For GitHub Actions workflow:

```yaml
- name: Validate Frontmatter
  run: python meta/scripts/frontmatter_utils.py --recursive .
```

## Validation Rules

The frontmatter validation follows the rules defined in [meta/guidelines/validation_rules.md](mdc:meta/guidelines/validation_rules.md). Key requirements include:

1. All DSS files should have frontmatter with `tags`, `provides`, and `requires` fields
2. All fields must be correctly formatted (arrays of strings)
3. Frontmatter must be at the beginning of the file

For more details, refer to the validation rules documentation.

## Troubleshooting

### Common Errors

- **No frontmatter found**: The file does not have a frontmatter section. Add a frontmatter section at the beginning of the file or use the auto-correction feature.
- **Malformed YAML**: The YAML syntax in the frontmatter is invalid. Check for missing quotes, incorrect indentation, or invalid characters.
- **Missing required field**: A required field is missing in the frontmatter. Add the missing field with appropriate values.
- **Field must be a list**: A field that should be an array is defined as a scalar or object. Change to an array format, e.g., `tags: [documentation, guide]`.

## Related Documentation

- [Frontmatter Validation Rules](mdc:meta/guidelines/validation_rules.md)
- [Frontmatter Validation Algorithm](mdc:meta/scripts/docs/frontmatter_validation_algorithm.md)
- [Frontmatter Auto-Correction Logic](mdc:meta/scripts/docs/frontmatter_auto_correction.md)
- [DSS Configuration](mdc:meta/dss_config.yml) 