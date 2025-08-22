# 🚀 LLM Agent Quick Reference

## Creating New Formatting Rules

### 📋 Required Steps (Copy-Paste Ready)

1. **Set Up Development Environment**

   ```bash
   mkdir rules/[your_rule_name]
   cp RULE-DEVELOPMENT-TEMPLATE.md rules/[your_rule_name]/PROGRESS.md
   cp rules/_template_rule.py rules/[your_rule_name]/[your_rule_name].py
   ```

2. **Copy Template**

   ```bash
   cp rules/_template_rule.py rules/[your_rule_name].py
   ```

3. **Update Class Name**

   ```python
   class FormattingRule(BaseFormattingRule):  # Change to YourRuleFormattingRule
   ```

4. **Set Rule Identity**

   ```python
   self.description = "What your rule does"
   self.name = "your_rule_name"  # Must match filename exactly
   ```

5. **Implement Logic**

   ```python
   def apply(self, content: str, file_path: str) -> str:
       try:
           # Your formatting logic here
           return formatted_content
       except Exception as e:
           self.logger.error(f"Rule failed: {e}")
           return content
   ```

6. **Add to Config**

   ```yaml
   # In config.yml
   enabled_rules:
     - your_rule_name
   
   rules:
     your_rule_name:
       enabled: true
   ```

### 🎯 Common Patterns

#### Text Replacement

```python
import re
formatted_content = re.sub(r'pattern', r'replacement', content, flags=re.MULTILINE)
```

#### Line Processing

```python
lines = content.split('\n')
formatted_lines = [self.process_line(line) for line in lines]
return '\n'.join(formatted_lines)
```

#### Block Processing

```python
blocks = content.split('\n\n')
formatted_blocks = [self.process_block(block) for block in blocks]
return '\n\n'.join(formatted_blocks)
```

### 🔍 Testing Commands

```bash
# Test discovery
python main.py --list-rules

# Test dry run
python main.py --dry-run demo-formattable.md

# Test actual formatting
python main.py --output test.md demo-formattable.md
```

### 🎭 Demo Content (REQUIRED)

**ALWAYS add a demo section to `demo-formattable.md`:**

```markdown
## [Your Rule Name] Demo Section

### Before (Problematic Format)
[Content your rule will fix]

### After (Expected Result)
[Comment showing expected formatting]
```

### ⚠️ Critical Requirements

- **Filename must match `self.name` exactly**
- **Class must be named `FormattingRule`**
- **Must inherit from `BaseFormattingRule`**
- **Always return complete content**
- **Wrap logic in try/except**
- **Log errors with `self.logger.error()`**

### 📚 Key Files

- **Template**: `rules/_template_rule.py`
- **Base Class**: `rules/base_rule.py`
- **Configuration**: `config.yml`
- **Demo File**: `demo-formattable.md`
- **Main Script**: `main.py`

---

**Remember**: The system auto-discovers rules. Just create the file and add to config - it will work automatically!
