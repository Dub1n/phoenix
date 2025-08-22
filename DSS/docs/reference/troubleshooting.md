---
tags: [troubleshooting, help, support, guide]
provides: [troubleshooting_guide]
requires: [docs/getting_started.md]
---

# DSS Troubleshooting Guide

_This guide covers common issues you might encounter when working with the DSS framework and provides solutions to help you resolve them quickly._

**Last updated:** 2023-07-10

## 📋 Quick Reference

| Issue | Symptoms | Quick Solution |
|-------|----------|----------------|
| Environment Setup | Python errors, missing dependencies | Check virtual environment and `pip install -r meta/requirements.txt` |
| Front-matter Validation | Error: "Invalid front-matter in file.md" | Run `python meta/scripts/frontmatter_validation.py --fix` |
| Documentation Generation | LLM API errors, timeouts | Verify OpenAI API key is set correctly in environment |
| Template Customization | Jinja2 template errors | Ensure template syntax is correct and variables are defined |
| Git Integration | Pre-commit hooks failing | Check file naming conventions and front-matter structure |

## 📚 Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Problems](#configuration-problems)
- [Front-matter Validation Errors](#front-matter-validation-errors)
- [Documentation Generation Issues](#documentation-generation-issues)
- [Template Customization Problems](#template-customization-problems)
- [Git Integration Issues](#git-integration-issues)
- [Diagnostic Tools](#diagnostic-tools)
- [Troubleshooting Decision Tree](#troubleshooting-decision-tree)

## Installation Issues

### Issue: Python Environment Setup Failures

**Symptoms:**

- Error messages about missing packages
- Python version compatibility warnings
- Virtual environment not activating correctly

**Causes:**

- Incorrect Python version (DSS requires Python 3.8+)
- Virtual environment not created or activated
- Dependencies not installed

**Solutions:**

1. **Verify Python Version:**

   ```bash
   python --version
   ```

   Make sure you have Python 3.8 or higher installed.

2. **Create a Fresh Virtual Environment:**

   ```bash
   # On macOS/Linux
   python -m venv .venv
   source .venv/bin/activate
   
   # On Windows
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Install Dependencies:**

   ```bash
   pip install -r meta/requirements.txt
   ```

**Prevention:**
Always use a virtual environment for DSS projects and ensure you've activated it before running any commands.

### Issue: OpenAI API Key Configuration

**Symptoms:**

- Authentication errors when running LLM tasks
- Error message about missing API key

**Causes:**

- API key not set in environment
- Incorrect or expired API key

**Solutions:**

1. **Use Cursor with trial or a good free model in Agent mode**

2. **Set API Key in Environment:**

   ```bash
   # On macOS/Linux
   export OPENAI_API_KEY=sk-your-key-here
   
   # On Windows
   set OPENAI_API_KEY=sk-your-key-here
   ```

3. **Create/Update .env File:**

   ```text
   # Add to .env file in project root
   OPENAI_API_KEY=sk-your-key-here
   ```

**Prevention:**
Use a `.env` file with your project and ensure it's included in `.gitignore` to avoid accidentally committing your API key.

## Configuration Problems

### Issue: DSS Config File Errors

**Symptoms:**

- Error messages about invalid configuration
- Scripts failing with configuration-related errors

**Causes:**

- Malformed YAML in `meta/dss_config.yml`
- Missing required configuration sections

**Solutions:**

1. **Validate YAML Syntax:**

   ```bash
   python -c "import yaml; yaml.safe_load(open('meta/dss_config.yml'))"
   ```

   If this returns without error, your YAML syntax is valid.

2. **Restore Default Configuration:**

   ```bash
   cp meta/templates/dss_config.yml.template meta/dss_config.yml
   ```

   Then customize the restored default configuration.

**Prevention:**
Use a YAML linter in your editor to catch syntax errors before saving changes to configuration files.

### Issue: Project Structure Inconsistencies

**Symptoms:**

- Scripts can't find expected directories
- Error messages about missing paths

**Causes:**

- Manually modified directory structure
- Missing required directories

**Solutions:**

1. **Verify Project Structure:**

   ```bash
   ls -la
   ```

   Ensure you have the standard DSS directories: `src/`, `docs/`, `meta/`, `data/`, `canvas/`, and `tests/`.

2. **Recreate Missing Directories:**

   ```bash
   mkdir -p src docs meta data canvas tests
   ```

**Prevention:**
Don't manually delete or rename the standard DSS directories. If you need to reorganize, use the provided scripts.

## Front-matter Validation Errors

### Error: Invalid Front-matter Format

**Symptoms:**

- Error message: "Invalid front-matter in file.md"
- Front-matter validation script fails

**Causes:**

- Malformed YAML in front-matter
- Missing required fields (tags, provides, requires)
- Indentation errors in YAML

**Solutions:**

1. **Run Auto-correction Tool:**

   ```bash
   python meta/scripts/frontmatter_validation.py --fix
   ```

   This will attempt to auto-correct common front-matter issues.

2. **Manually Fix Front-matter:**
   Ensure your front-matter follows this format:

   ```markdown
   ---
   tags: [tag1, tag2]
   provides: [concept_name]
   requires: [dependency1, dependency2]
   ---
   ```

**Prevention:**
Use the documentation templates provided in `meta/templates/docs/` which include correct front-matter structure.

### Error: Missing Required Tags

**Symptoms:**

- Error message about missing required tags
- Front-matter validation failing on specific files

**Causes:**

- Empty tags array
- Missing tags field entirely

**Solutions:**

1. **Add Required Tags:**
   Edit the file and add appropriate tags to the front-matter:

   ```markdown
   ---
   tags: [appropriate_tag, another_tag]
   provides: [concept_name]
   requires: []
   ---
   ```

2. **Run Validation with Suggestions:**

   ```bash
   python meta/scripts/frontmatter_validation.py --suggest
   ```

   This will suggest appropriate tags based on file content.

**Prevention:**
Always add at least one relevant tag when creating new files.

## Documentation Generation Issues

### Issue: LLM API Errors

**Symptoms:**

- Error messages about API rate limits
- Authentication errors
- Timeouts during document generation

**Causes:**

- API key issues
- Rate limiting
- Network connectivity problems

**Solutions:**

1. **Verify API Key:**

   ```bash
   python -c "import os; print('API Key set' if 'OPENAI_API_KEY' in os.environ else 'API Key missing')"
   ```

2. **Check for Rate Limiting:**
   If you're hitting rate limits, try spacing out your requests or using a different API key.

3. **Test Network Connectivity:**

   ```bash
   curl https://api.openai.com/v1/models
   ```

   This should return a JSON response with available models.

**Prevention:**
For large documentation generation tasks, consider breaking them into smaller batches to avoid rate limits.

### Issue: Incomplete Documentation Generation

**Symptoms:**

- Documentation generated but missing sections
- Error messages during generation

**Causes:**

- LLM context limitations
- Malformed input files
- Script interruption

**Solutions:**

1. **Break Down Large Files:**
   Split very large files into smaller modules before generating documentation.

2. **Run Generation in Smaller Batches:**

   ```bash
   python meta/llm_tasks.py --mode docs --dir docs/specific_subdirectory
   ```

**Prevention:**
Keep individual files focused and concise to avoid hitting context limits when generating documentation.

## Template Customization Problems

### Issue: Template Variable Errors

**Symptoms:**

- Error messages about undefined variables
- Templates not rendering correctly

**Causes:**

- Missing template variables
- Syntax errors in template placeholders

**Solutions:**

1. **Check Template Variables:**
   Review the template to identify all required variables:

   ```bash
   grep -o "{{.*}}" path/to/template.md
   ```

2. **Provide All Required Variables:**
   Ensure all variables are defined when using the template.

**Prevention:**
Document all required variables in template comments and provide default values where possible.

### Issue: Template File Not Found

**Symptoms:**

- Error message about missing template file
- Template customization failing

**Causes:**

- Incorrect template path
- Template file deleted or moved

**Solutions:**

1. **Verify Template Exists:**

   ```bash
   ls -la meta/templates/
   ```

2. **Restore from Template Repository:**
   If a template is missing, check the template repository for the original version.

**Prevention:**
Don't delete or rename files in the `meta/templates/` directory.

## Git Integration Issues

### Issue: Pre-commit Hooks Failing

**Symptoms:**

- Git commit fails with error messages
- Pre-commit validation errors

**Causes:**

- Front-matter validation failures
- Filename convention violations
- Other pre-commit checks failing

**Solutions:**

1. **Run Validation Manually:**

   ```bash
   python meta/scripts/frontmatter_validation.py
   python meta/scripts/filename_validation.py
   ```

   Fix any issues identified.

2. **Temporarily Bypass Hooks (Use Cautiously):**

   ```bash
   git commit --no-verify -m "Your message"
   ```

   Note: This should only be used in exceptional circumstances.

**Prevention:**
Run validation scripts before committing to identify and fix issues early.

## Diagnostic Tools

### Tool: DSS Validator

Description: A comprehensive validation tool that checks your DSS project for common issues.

```bash
python meta/scripts/dss_validator.py
```

### Tool: Front-matter Inspector

Description: A tool to inspect and analyze front-matter across your project.

```bash
python meta/scripts/frontmatter_inspector.py
```

## Troubleshooting Decision Tree

Start with the most common issues and follow the tree to diagnose problems:

1. **Is the project set up correctly?**
   - No → See [Installation Issues](#installation-issues)
   - Yes → Proceed to next question

2. **Are configuration files correct?**
   - No → See [Configuration Problems](#configuration-problems)
   - Yes → Proceed to next question

3. **Are you seeing front-matter validation errors?**
   - Yes → See [Front-matter Validation Errors](#front-matter-validation-errors)
   - No → Proceed to next question

4. **Is documentation generation failing?**
   - Yes → See [Documentation Generation Issues](#documentation-generation-issues)
   - No → Proceed to next question

5. **Are templates working correctly?**
   - No → See [Template Customization Problems](#template-customization-problems)
   - Yes → Proceed to next question

6. **Are Git operations failing?**
   - Yes → See [Git Integration Issues](#git-integration-issues)
   - No → Try using [Diagnostic Tools](#diagnostic-tools) to identify the issue

## Getting Additional Help

If you couldn't resolve your issue using this guide:

1. Check the [DSS documentation](mdc:docs/documentation_index.md) for more detailed information
2. Search existing [GitHub issues](https://github.com/yourusername/dss_repo/issues) for similar problems
3. Create a new issue with detailed information about your problem, including:
   - DSS version
   - Environment details (OS, Python version)
   - Steps to reproduce
   - Error messages or logs

## Related Documentation

- [Getting Started Guide](mdc:docs/getting_started.md)
- [Documentation Index](mdc:docs/documentation_index.md)
- [DSS Guide](mdc:meta/DSS_GUIDE.md)

---

## Feedback

If you found a solution that isn't documented here or have suggestions for improving this troubleshooting guide, please contribute to our  
documentation or submit an issue with the tag `documentation-improvement`.
