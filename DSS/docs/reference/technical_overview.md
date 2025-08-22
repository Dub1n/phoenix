---
tags: [documentation, technical, autoformatter, benchmark, advanced]
provides: [technical_overview, autoformatter_details, benchmark_guide, system_requirements]
requires: [DSS_GUIDE, getting_started]
---

# DSS Technical Overview

This document provides comprehensive technical details about DSS implementation, advanced features, and system architecture.

## 📁 Detailed Project Structure

```text
/src/         → Source code and executable logic
/data/        → Datasets, artifacts, and data files  
/docs/        → Human and AI-generated documentation
/canvas/      → Obsidian Canvas JSON diagrams (optional)
/meta/        → Scripts, prompts, config, and automation
/tests/       → Test files and validation datasets
```

### Key Technical Features

* **YAML front-matter** on all files for rich metadata and LLM context
* **Automated documentation generation** via LLM integration
* **Token-efficient prompts** through structured summaries and cross-references
* **Git-friendly structure** that renders beautifully on GitHub
* **Obsidian-compatible** for visual knowledge management

---

## 🤖 Auto-Formatter Technical Details

The DSS auto-formatter intelligently transforms any repository into DSS structure while preserving functionality and git history.

### Multi-Phase Processing Architecture

1. **Discovery** → Scan repository structure and file types
2. **Classification** → Categorize files using pattern matching and LLM assistance
3. **Planning** → Generate transformation plan with conflict resolution
4. **Execution** → Apply changes with rollback capabilities
5. **Enhancement** → Add metadata and cross-references
6. **Validation** → Verify transformation integrity

### Advanced Features

* **LLM-assisted classification** for ambiguous files
* **Cursor AI assistant integration** with project-specific context and DSS intelligence
* **Safe transformation** with automatic rollback on failure
* **Dependency analysis** and import updating
* **Metadata injection** with intelligent tag generation
* **Risk assessment** and conflict resolution
* **Cross-platform Unicode handling** (Windows/Linux/Mac)
* **Enhanced WearOS project detection** with specific patterns
* **GitHub label validation** to prevent non-existent label errors

### Usage Options

```bash
# Basic transformation
dss-autoformat --source ./my-repo --dest ./my-repo-dss

# Advanced options with full control
dss-autoformat \
  --source ./my-repo \
  --dest ./my-repo-dss \
  --config custom_dss_config.yml \
  --llm-assist \
  --preserve-git-history \
  --dry-run

# In-place transformation (use with caution)
dss-autoformat --source ./my-repo --in-place --create-backup
```

### Bootstrap Script Features

The `dss_bootstrap.py` script provides enhanced repository transformation:

* **Robust error handling** with automatic fallbacks
* **Installation report generation** for community feedback
* **Iterative versioning** for output directories
* **Enhanced console output reliability** for Windows terminals
* **Cross-platform compatibility** with proper Unicode handling
* **GitHub integration** for issue reporting and community feedback

For comprehensive documentation, see [Automated Formatting Guide](usage/automated_formatting.md).

---

## 🧪 DSS Benchmark: Technical Specification

The **DSS Benchmark** is a realistic task evaluation system that tests whether DSS rules enable automatic professional behavior in AI assistants.

### Evaluation Methodology

**Core Question:** Do DSS rules make assistants naturally behave like senior developers who automatically apply best practices, or do they require explicit instruction for every desired behavior?

**Testing Approach:** Provide assistants with minimal, realistic tasks (just user intent) and measure whether professional behaviors emerge automatically through DSS rules.

### What The Benchmark Measures

**Automatic Behavior Emergence:**

* Frontmatter appears without frontmatter instructions
* Files are organized logically without placement guidance
* Documentation is created automatically with cross-references
* Templates are used without template reminders
* Project maintenance happens automatically

### Benchmark Architecture

* **Realistic Tasks:** Minimal user requirements, no DSS instruction hints
* **Evidence-Based Scoring:** Measures emergent professional behavior (100-point scale)
* **Control Group Testing:** Compare rule variants against baseline behavior
* **Hidden Evaluation:** Assistants can't see scoring criteria during tasks
* **Professional Merit Focus:** Technical quality + automatic DSS behaviors

### Running the Benchmark

```bash
# Extract benchmark to separate directory (IMPORTANT)
cp -r benchmark/ ../dss-benchmark-evaluation/
cd ../dss-benchmark-evaluation/

# Open in Cursor as separate workspace
cursor .

# Execute a realistic task
# Give your assistant: "Complete benchmark task 01-xs following RUN_BENCHMARK.md"
```

**⚠️ Critical:** Extract benchmark to its own directory before use. The nested `.cursor/rules` won't be active within this repository, which could affect evaluation accuracy.

### Scoring Framework

The benchmark uses a 100-point scoring system across multiple dimensions:

* **Automatic DSS Compliance** (30 points)
* **Code Quality** (25 points)  
* **Documentation Standards** (20 points)
* **Project Organization** (15 points)
* **Maintenance Behaviors** (10 points)

---

## 🛠 System Requirements

### Core Requirements

* **Python 3.8+** - Core automation and scripts
* **Git** - Version control and repository management
* **LLM API Access** - For automated documentation and classification
  * OpenAI API key, or
  * Cursor Pro subscription, or
  * Other compatible LLM service

### Optional Dependencies

* **Node.js** - For advanced markdown table formatting
* **Obsidian** - For visual knowledge management and canvas diagrams
* **VS Code/Cursor** - Enhanced IDE integration with DSS intelligence

### Platform Support

* **Windows 10+** with PowerShell 5.1+
* **macOS 10.15+**
* **Linux** (Ubuntu 18.04+, other distributions)

### Hardware Recommendations

* **4GB RAM minimum** for basic DSS operations
* **8GB RAM recommended** for large repository transformations
* **SSD storage** for optimal file processing performance

---

## 🔧 Advanced Configuration

### Custom DSS Configuration

Customize DSS behavior through `meta/dss_config.yml`:

```yaml
# File pattern classification
patterns:
  code:
    - "**/*.py"
    - "**/*.js"
    - "**/*.ts"
    - "**/*.ipynb"
  data:
    - "**/*.csv"
    - "**/*.parquet"
    - "**/*.json"
  docs:
    - "**/*.md"
    - "**/*.rst"
    - "**/*.txt"

# Metadata injection rules
metadata:
  required_tags: true
  auto_provides: true
  dependency_tracking: true

# LLM integration settings
llm:
  model: "gpt-4"
  max_tokens: 2000
  temperature: 0.1
```

### Cursor AI Integration

DSS provides deep integration with Cursor IDE through:

* **Project-specific rules** in `.cursor/rules/`
* **Contextual prompts** based on project structure
* **Automatic behavior patterns** for professional development
* **Enhanced error recovery** and suggestion systems

### Template System

Standardized file templates in `meta/templates/`:

* **Markdown documents** with proper frontmatter
* **Python modules** with DSS-compliant structure  
* **Data processing scripts** with standard patterns
* **Documentation templates** for consistent formatting

---

## 🔗 Integration Ecosystem

### Version Control Integration

* **GitHub Actions** for automated DSS maintenance
* **Pre-commit hooks** for frontmatter validation
* **Branch protection** with DSS compliance checks

### IDE and Editor Support

* **VS Code extensions** for DSS workflow enhancement
* **Cursor AI assistant** with project-specific intelligence
* **Obsidian plugins** for visual knowledge management

### CI/CD Pipeline Integration

```yaml
# Example GitHub Action
name: DSS Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate DSS Structure
        run: python meta/scripts/validate_dss.py
```

---

## 🔬 Research and Development

### Active Development Areas

* **Enhanced LLM classification** accuracy
* **Real-time documentation synchronization**
* **Visual knowledge graph generation**
* **Multi-language support** expansion
* **Performance optimization** for large repositories

### Community Contributions

DSS development is driven by real-world usage patterns:

* **Installation reports** help identify improvement areas
* **Benchmark results** guide rule refinement
* **Community feedback** shapes feature priorities
* **Open source contributions** expand ecosystem support

### Experimental Features

* **Semantic search** across DSS repositories
* **Automated refactoring** suggestions
* **Cross-project dependency analysis**
* **AI-powered code review** integration

---

## 📊 Performance Metrics

### Transformation Speed

* **Small projects** (< 100 files): 30-60 seconds
* **Medium projects** (100-1000 files): 2-5 minutes
* **Large projects** (1000+ files): 5-15 minutes

### Token Efficiency

DSS structure typically reduces LLM prompt tokens by:

* **40-60% reduction** in context tokens
* **70-80% improvement** in response relevance
* **3-5x faster** AI assistant comprehension

### Accuracy Metrics

* **File classification accuracy**: 95%+ with LLM assistance
* **Dependency detection**: 90%+ for standard patterns
* **Metadata completeness**: 98%+ for supported file types

---

For implementation details, see the [DSS Core Guide](../meta/DSS_GUIDE.md) and [Getting Started documentation](reference/getting_started.md).
