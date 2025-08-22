# Markdown Formatter Development Guide

## 🎯 For LLM Agents: How to Create New Formatting Rules

This guide is specifically designed for LLM agents to understand how to implement new formatting rules that integrate seamlessly with the existing system.

## 🚀 Quick Start Template for Agents

When you need to create a new formatting rule, use this exact format:

```markdown
## Task: Create [Rule Name] Formatting Rule

**Based on template**: `scripts/markdown-formatter/rules/_template_rule.py`
**Integration point**: `scripts/markdown-formatter/main.py` (auto-discovers rules)
**Configuration**: Add to `scripts/markdown-formatter/config.yml`

**What the rule should do**: [Your specific formatting requirement]

**Example input**: [Show problematic markdown]
**Example output**: [Show corrected markdown]

**Key considerations**: [Any special requirements or edge cases]
```

## 📋 Rule Implementation Checklist

**⚠️ IMPORTANT**: Use the progress tracker template instead of checking off this guide!

### Setup Your Development Environment

1. **Create your rule folder**:

   ```bash
   mkdir .vscode/scripts/markdown-formatter/rules/[your_rule_name]
   ```

2. **Copy the progress tracker**:

   ```bash
   cp RULE-DEVELOPMENT-TEMPLATE.md rules/[your_rule_name]/PROGRESS.md
   ```

3. **Copy the template rule**:

   ```bash
   cp rules/_template_rule.py rules/[your_rule_name]/[your_rule_name].py
   ```

4. **Track your progress** in `rules/[your_rule_name]/PROGRESS.md`

### Development Steps (Track in your PROGRESS.md)

1. **File Creation** - Copy and rename template files
2. **Class Implementation** - Implement your formatting logic
3. **Configuration Integration** - Add to config.yml
4. **Demo Content & Testing** - Add demo content and test thoroughly

**Remember**: Keep the main DEV-GUIDE.md clean for other agents!

## 🔧 Technical Requirements

### Required Interface

Every rule MUST implement:

```python
class YourRuleFormattingRule(BaseFormattingRule):
    def __init__(self):
        super().__init__()
        self.description = "What this rule does"
        self.name = "your_rule"  # Must match filename
    
    def apply(self, content: str, file_path: str) -> str:
        # Your formatting logic here
        return formatted_content
```

### Error Handling

- Always wrap your logic in try/except
- Return original content if formatting fails
- Log errors using `self.logger.error()`

### Content Processing

- Work with the entire content string
- Use regex patterns for text manipulation
- Preserve line endings and structure
- Return the complete modified content

## 📝 Rule Development Patterns

### Text Replacement Pattern

```python
def apply(self, content: str, file_path: str) -> str:
    try:
        # Use regex for pattern matching
        import re
        
        # Find and replace patterns
        formatted_content = re.sub(
            r'pattern_to_find',
            r'replacement_text',
            content,
            flags=re.MULTILINE
        )
        
        return formatted_content
    except Exception as e:
        self.logger.error(f"Rule failed: {e}")
        return content
```

### Line-by-Line Processing Pattern

```python
def apply(self, content: str, file_path: str) -> str:
    try:
        lines = content.split('\n')
        formatted_lines = []
        
        for line in lines:
            # Process each line
            formatted_line = self.process_line(line)
            formatted_lines.append(formatted_line)
        
        return '\n'.join(formatted_lines)
    except Exception as e:
        self.logger.error(f"Rule failed: {e}")
        return content
```

### Block Processing Pattern

```python
def apply(self, content: str, file_path: str) -> str:
    try:
        # Split into blocks (e.g., by double newlines)
        blocks = content.split('\n\n')
        formatted_blocks = []
        
        for block in blocks:
            # Process each block
            formatted_block = self.process_block(block)
            formatted_blocks.append(formatted_block)
        
        return '\n\n'.join(formatted_blocks)
    except Exception as e:
        self.logger.error(f"Rule failed: {e}")
        return content
```

## 🎨 Common Formatting Tasks

### Header Formatting

```python
# Fix header spacing: "##Header" -> "## Header"
formatted_content = re.sub(r'^(#{1,6})([^#\s])', r'\1 \2', content, flags=re.MULTILINE)
```

### List Formatting

```python
# Standardize list markers: "* item" -> "- item"
formatted_content = re.sub(r'^\s*[\*\+]\s+', r'- ', content, flags=re.MULTILINE)
```

### Table Formatting

```python
# Add spaces around table separators: "|col1|col2|" -> "| col1 | col2 |"
formatted_content = re.sub(r'\|([^|]+)\|', r'| \1 |', content)
```

### Whitespace Cleanup

```python
# Remove multiple spaces: "word    word" -> "word word"
formatted_content = re.sub(r'[ \t]+', ' ', content)

# Remove trailing whitespace
formatted_content = re.sub(r'[ \t]+$', '', content, flags=re.MULTILINE)
```

## 🔍 Testing Your Rule

### 1. Create Test Content

Add problematic content to `demo-formattable.md` that your rule should fix.

### 2. Test Dry Run

```bash
cd .vscode/scripts/markdown-formatter
python main.py --dry-run demo-formattable.md
```

### 3. Test Actual Formatting

```bash
python main.py --output test-output.md demo-formattable.md
```

### 4. Verify Changes

```bash
diff demo-formattable.md test-output.md
```

## 🎭 Demo Content Requirements

### What to Add to `demo-formattable.md`

**ALWAYS add a new section** that showcases your formatting rule in action:

```markdown
## [Your Rule Name] Demo Section

### Before (Problematic Format)
[Add content that your rule will fix - make it obviously wrong]

### After (Expected Result)
[Add a comment showing what it should look like after formatting]
```

### Example Demo Section

```markdown
## Link Formatter Demo Section

### Before (Problematic Format)
[Broken link formatting]
[text](url) - no spaces around brackets
[longer text](longer-url) - inconsistent spacing

### After (Expected Result)
[ text ]( url ) - proper spacing around brackets
[ longer text ]( longer-url ) - consistent spacing
```

### Demo Content Best Practices

1. **Make it obvious**: The "before" content should clearly show the problem
2. **Show variety**: Include different cases your rule handles
3. **Keep it focused**: One demo section per rule, not mixed problems
4. **Add comments**: Use `### Before` and `### After` headers for clarity
5. **Test thoroughly**: Ensure your rule actually fixes the demo content

## 🧪 Complete Testing Workflow

### Step 1: Add Demo Content

```bash
# Edit demo-formattable.md to add your demo section
code demo-formattable.md
```

### Step 2: Test Rule Discovery

```bash
python main.py --list-rules
# Should show your new rule in the list
```

### Step 3: Test Dry Run

```bash
python main.py --dry-run demo-formattable.md
# Should show what your rule would change
```

### Step 4: Test Actual Formatting

```bash
python main.py --output test-output.md demo-formattable.md
# Should create formatted file
```

### Step 5: Verify Results

```bash
# Show the user the before/after
echo "=== BEFORE (Original) ==="
grep -A 10 "## [Your Rule Name] Demo Section" demo-formattable.md

echo "=== AFTER (Formatted) ==="
grep -A 10 "## [Your Rule Name] Demo Section" test-output.md

# Or use diff for a cleaner comparison
diff demo-formattable.md test-output.md
```

### Step 6: Show User the Results

**Always demonstrate to the user that your rule works:**

```bash
echo "🎯 Rule '[Your Rule Name]' successfully applied!"
echo "📝 Check the differences above to see the formatting improvements"
echo "✅ Your rule is working correctly!"
```

## 📚 Integration Points

### Auto-Discovery

The main script automatically finds and loads rules:

- Scans `rules/` directory for `.py` files
- Imports modules and looks for `FormattingRule` class
- Adds to `self.rules` dictionary

### Configuration Loading

Rules can access their config from the main config:

```python
# In your rule's __init__ method
self.config = {
    'enabled': True,
    'custom_setting': 'default_value'
}

# The main script will merge this with config.yml settings
```

### Logging Integration

Use the built-in logger:

```python
self.logger.info("Rule applied successfully")
self.logger.warning("Found potential issue")
self.logger.error("Rule failed")
```

## 🚨 Common Pitfalls

### 1. Filename Mismatch

- Rule filename must match `self.name` exactly
- Use snake_case for filenames: `table_formatter.py`

### 2. Missing Class

- Must have class named `FormattingRule` (or inherit from it)
- Class must be importable

### 3. Import Errors

- Don't use relative imports in rules
- Keep dependencies minimal
- Test imports work from the rules directory

### 4. Content Modification

- Always return the complete content
- Don't modify content in-place
- Preserve original structure

## 🎯 Example: Creating a "Link Formatter" Rule

Here's a complete example of how to implement a link formatting rule:

```python
#!/usr/bin/env python3
"""
Link Formatting Rule

Formats markdown links for consistency and readability.
"""

import re
from .base_rule import BaseFormattingRule


class FormattingRule(BaseFormattingRule):
    def __init__(self):
        super().__init__()
        self.description = "Formats markdown links for consistency"
        self.name = "link_formatter"
        
        self.config = {
            'enabled': True,
            'normalize_urls': True,
            'prefer_relative_links': True
        }
    
    def apply(self, content: str, file_path: str) -> str:
        try:
            formatted_content = content
            
            # Add spaces around link text: [text](url) -> [ text ]( url )
            formatted_content = re.sub(
                r'\[([^\]]+)\]\(([^)]+)\)',
                r'[ \1 ]( \2 )',
                formatted_content
            )
            
            # Remove extra spaces
            formatted_content = re.sub(r'\[ +', '[', formatted_content)
            formatted_content = re.sub(r' +\]', ']', formatted_content)
            formatted_content = re.sub(r'\( +', '(', formatted_content)
            formatted_content = re.sub(r' +\)', ')', formatted_content)
            
            return formatted_content
            
        except Exception as e:
            self.logger.error(f"Link formatter failed: {e}")
            return content
```

## 🔄 Workflow for LLM Agents

### When User Requests a New Rule

1. **Understand the requirement** - What formatting problem are they trying to solve?
2. **Check existing rules** - Is this already covered or similar to existing functionality?
3. **Design the solution** - How will the rule transform the content?
4. **Set up development environment** - Create rule folder and copy templates
5. **Implement the rule** - Use the template and patterns above
6. **Add demo content** - Add a section to `demo-formattable.md` that showcases your rule
7. **Test integration** - Ensure it works with the main system
8. **Update configuration** - Add to config.yml and enabled_rules
9. **Demonstrate results** - Show the user before/after formatting to prove it works
10. **Document usage** - Explain what the rule does and how to configure it

### Example User Request
>
> "I want a rule that adds proper spacing around markdown links like [text](url) -> [text]( url )"

### Agent Response
>
> "I'll create a link formatting rule for you. Based on the template, I'll set up a development folder, implement the rule, add demo content to showcase it, test it thoroughly, and then show you the before/after results to prove it works exactly as you requested..."

## 📖 Additional Resources

- **Template**: `rules/_template_rule.py` - Copy this for new rules
- **Base Class**: `rules/base_rule.py` - Common functionality and interface
- **Configuration**: `config.yml` - Enable/disable rules and set options
- **Demo File**: `demo-formattable.md` - Test your rules safely
- **Main Script**: `main.py` - How rules are discovered and executed

---

**Remember**: The system is designed to be plug-and-play. Create your rule, add it to the config, and it will automatically work with the main formatter!
