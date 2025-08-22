# Rule Development Progress Tracker

**Rule Name**: [YOUR_RULE_NAME]  
**Developer**: [AGENT_NAME]  
**Date Started**: [DATE]  
**Status**: [NOT STARTED | IN PROGRESS | COMPLETED | TESTING]

---

## 📋 Development Checklist

### 1. File Creation

- [ ] Copy `_template_rule.py` to `[rule_name].py`
- [ ] Place in `.vscode/scripts/markdown-formatter/rules/` directory
- [ ] Ensure filename matches the rule name exactly

### 2. Class Implementation

- [ ] Rename class from `FormattingRule` to `[RuleName]FormattingRule`
- [ ] Update `self.name` to match filename (without .py)
- [ ] Write clear `self.description` explaining what the rule does
- [ ] Implement `apply(content, file_path)` method with your logic

### 3. Configuration Integration

- [ ] Add rule name to `enabled_rules` list in `config.yml`
- [ ] Add rule-specific settings under `rules:` section if needed
- [ ] Set `enabled: true` by default

### 4. Demo Content & Testing

- [ ] Add demo content to `demo-formattable.md` that showcases your rule
- [ ] Test with `python main.py --dry-run demo-formattable.md`
- [ ] Verify rule appears in `python main.py --list-rules`
- [ ] Test actual formatting with `python main.py --output test.md demo-formattable.md`
- [ ] **Test the rule and show the user the before/after results**

---

## 🎯 Rule Requirements

**What this rule should do**: [DESCRIBE THE FORMATTING REQUIREMENT]

**Example input**: [SHOW PROBLEMATIC MARKDOWN]
**Example output**: [SHOW CORRECTED MARKDOWN]

**Key considerations**: [ANY SPECIAL REQUIREMENTS OR EDGE CASES]

---

## 🧪 Testing Results

### Dry Run Test

- [ ] Completed
- [ ] Issues found: [DESCRIBE ANY ISSUES]
- [ ] Resolved: [YES/NO]

### Rule Discovery Test

- [ ] Completed
- [ ] Rule appears in list: [YES/NO]
- [ ] Issues found: [DESCRIBE ANY ISSUES]

### Actual Formatting Test

- [ ] Completed
- [ ] Output file created: [YES/NO]
- [ ] Formatting applied correctly: [YES/NO]
- [ ] Issues found: [DESCRIBE ANY ISSUES]

### Demo Content Verification

- [ ] Demo content added to `demo-formattable.md`
- [ ] Rule successfully formats demo content
- [ ] Before/after comparison shows expected results

---

## 📝 Implementation Notes

**Design decisions made**: [EXPLAIN KEY IMPLEMENTATION CHOICES]

**Challenges encountered**: [DESCRIBE ANY PROBLEMS AND HOW THEY WERE SOLVED]

**Performance considerations**: [ANY PERFORMANCE IMPACT OR OPTIMIZATIONS]

---

## ✅ Final Validation

- [ ] Rule compiles without errors
- [ ] Rule integrates with main formatter
- [ ] Demo content showcases rule functionality
- [ ] User can see before/after results
- [ ] Rule is properly configured and enabled
- [ ] Documentation is complete and accurate

---

## 🚀 Ready for User Demo

**Rule Status**: [READY/NEEDS WORK]

**What the user will see**: [DESCRIBE THE DEMO RESULTS]

**Next steps**: [ANY ADDITIONAL WORK NEEDED]

---

**Remember**: This guide is for tracking YOUR progress. Don't modify the main DEV-GUIDE.md file!
