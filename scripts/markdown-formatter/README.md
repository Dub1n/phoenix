# Markdown Formatter

A modular, extensible Python system for formatting markdown files with configurable rules.

## Features

- **Modular Architecture**: Each formatting rule is a separate, independent module
- **Easy Extension**: Add new formatting rules by copying the template and implementing your logic
- **Configuration Driven**: Enable/disable rules and configure their behavior via YAML
- **Safe Operation**: Automatic backups and dry-run mode for testing
- **Batch Processing**: Format single files or entire directories recursively
- **Extensible**: Simple interface for adding custom formatting logic

## Quick Start

### Basic Usage

```bash
# Format a single file
python main.py document.md

# Format all markdown files in a directory
python main.py --dir docs/

# Format recursively (including subdirectories)
python main.py --dir docs/ --recursive

# See what would change without applying changes
python main.py --dry-run document.md

# List all available formatting rules
python main.py --list-rules

# Use custom configuration
python main.py --config my-config.yml document.md
```

### Installation

1. Ensure Python 3.7+ is installed
2. Install required dependencies:

   ```bash
   pip install pyyaml
   ```

3. The system is ready to use!

## Architecture

``` filesystem
markdown-formatter/
├── main.py                 # Main orchestrator script
├── config.yml              # Default configuration
├── README.md               # This file
├── DEV-GUIDE.md            # Development guide for agents
├── AGENT-QUICK-REFERENCE.md # Quick reference for agents
├── RULE-DEVELOPMENT-TEMPLATE.md # Progress tracker template
├── demo-formattable.md     # Demo file with formatting issues
└── rules/                  # Formatting rules directory
    ├── __init__.py         # Package initialization
    ├── base_rule.py        # Base class for all rules
    ├── _template_rule.py   # Template for new rules
    └── [rule_name]/        # Individual rule folders
        ├── PROGRESS.md     # Progress tracker for this rule
        └── [rule_name].py  # Rule implementation
```

## Creating New Formatting Rules

### 🚀 For LLM Agents (Recommended)

**Use the development guide**: See `DEV-GUIDE.md` for complete instructions.

**Quick start**:

1. Create rule folder: `mkdir rules/[your_rule_name]`
2. Copy progress tracker: `cp RULE-DEVELOPMENT-TEMPLATE.md rules/[your_rule_name]/PROGRESS.md`
3. Copy template rule: `cp rules/_template_rule.py rules/[your_rule_name]/[your_rule_name].py`
4. Track progress in your `PROGRESS.md` file

### Method 1: Inherit from BaseFormattingRule (Manual)

1. Copy `_template_rule.py` to a new file (e.g., `my_rule.py`)
2. Rename the class and update the description
3. Implement your formatting logic in the `apply()` method
4. Add any configuration options you need

```python
from .base_rule import BaseFormattingRule

class FormattingRule(BaseFormattingRule):
    def __init__(self):
        super().__init__()
        self.description = "My custom formatting rule"
        self.name = "my_rule"
        
        # Add your configuration
        self.config = {
            'enabled': True,
            'my_setting': 'default_value'
        }
    
    def apply(self, content: str, file_path: str) -> str:
        # Your formatting logic here
        formatted_content = content
        
        # Example: Replace multiple spaces with single spaces
        formatted_content = re.sub(r'[ \t]+', ' ', formatted_content)
        
        return formatted_content
```

### Method 2: Simple Rule Interface

For basic rules, you can implement just the required interface:

```python
class SimpleRule:
    def __init__(self):
        self.description = "Simple formatting rule"
        self.name = "simple_rule"
    
    def apply(self, content: str, file_path: str) -> str:
        # Your formatting logic here
        return content
```

### Rule Requirements

Every rule must have:

- `description` attribute: Human-readable description of what the rule does
- `name` attribute: Unique identifier for the rule
- `apply(content, file_path)` method: Main formatting logic

## Configuration

### Configuration File Format

The system uses YAML configuration files with this structure:

```yaml
# Enable/disable rules
enabled_rules:
  - table_formatter
  - list_formatter
  - my_custom_rule

# General settings
backup_files: true
dry_run: false
verbose: false

# Rule-specific settings
rules:
  table_formatter:
    enabled: true
    align_columns: true
    max_column_width: 80
```

### Configuration Loading

1. **Default Config**: Built-in defaults are used if no config file is specified
2. **Custom Config**: Use `--config path/to/config.yml` to load custom settings
3. **Command Line Override**: Command line options override config file settings

### Environment Variables

You can also use environment variables:

- `MDFORMAT_CONFIG`: Path to configuration file
- `MDFORMAT_VERBOSE`: Enable verbose logging
- `MDFORMAT_BACKUP`: Enable/disable backups

## Example Rules

### Table Formatter

Formats markdown tables for consistent alignment and spacing:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

### List Formatter

Ensures consistent list formatting:

```markdown
- First item
- Second item
  - Nested item
  - Another nested item
- Third item
```

### Header Formatter

Standardizes header spacing and formatting:

```markdown
# Header 1
## Header 2
### Header 3
```

## Advanced Usage

### Custom Rule Configuration

Rules can access their configuration from the main config file:

```yaml
rules:
  my_rule:
    enabled: true
    custom_setting: "value"
    max_iterations: 5
```

### Rule Statistics

Each rule tracks its performance:

```python
rule = formatter.rules['my_rule']
stats = rule.get_stats()
print(f"Files processed: {stats['statistics']['files_processed']}")
print(f"Changes made: {stats['statistics']['changes_made']}")
```

### Error Handling

Rules should handle errors gracefully:

```python
def apply(self, content: str, file_path: str) -> str:
    try:
        # Your formatting logic
        return formatted_content
    except Exception as e:
        self.logger.error(f"Rule failed: {e}")
        return content  # Return original content on error
```

## Integration

### VS Code Integration

Add to your VS Code tasks:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Format Markdown",
            "type": "shell",
            "command": "python",
            "args": [
                "${workspaceFolder}/scripts/markdown-formatter/main.py",
                "${file}"
            ],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        }
    ]
}
```

### Pre-commit Hooks

Add to your pre-commit configuration:

```yaml
repos:
  - repo: local
    hooks:
      - id: markdown-format
        name: Format Markdown
        entry: python scripts/markdown-formatter/main.py
        language: system
        files: \.md$
```

## Troubleshooting

### Common Issues

1. **Rule not loading**: Check that the rule file has a `FormattingRule` class
2. **Import errors**: Ensure the rules directory has `__init__.py`
3. **Configuration errors**: Validate YAML syntax and check file paths

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
python main.py --verbose document.md
```

### Rule Testing

Test individual rules:

```bash
cd rules/
python my_rule.py
```

## Contributing

### Adding New Rules

1. Create a new rule file in the `rules/` directory
2. Follow the template structure
3. Add configuration options to `config.yml`
4. Test with various markdown files
5. Update this README with usage examples

### Rule Guidelines

- **Single Responsibility**: Each rule should do one thing well
- **Error Handling**: Always handle errors gracefully
- **Performance**: Keep rules efficient for large files
- **Documentation**: Clear descriptions and examples
- **Testing**: Include test cases for edge cases

## License

This project is open source. Feel free to modify and extend for your needs.

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review rule implementations for examples
3. Enable verbose logging for detailed error information
4. Check that all dependencies are installed
