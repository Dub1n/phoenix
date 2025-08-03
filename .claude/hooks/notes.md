# Claude Code Hooks Documentation

## Overview
This document catalogs Claude Code hooks research, recommendations, and implementation strategies based on our successful TypeScript hook implementation.

## Current Hook Status ✅
- **TypeScript + ESLint Hook**: Working successfully with comprehensive detection strategies
- **Dual Validation**: TypeScript type checking + ESLint linting for JS/TS files
- **Markdown Formatting Hook**: Auto-formats markdown files using markdownlint-cli2
- **Auto-Fix Capability**: Automatically fixes markdown formatting issues
- **Error Handling**: Non-blocking warnings, blocking errors only for actual issues
- **Windows Support**: Full nvm4w compatibility with fallback strategies

## Hook Categories

### 1. Code Quality Hooks
**Purpose**: Validate code style, catch bugs, ensure consistency

**Existing Examples**:
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting validation  
- **Python linting** - flake8, pylint, black
- **Rust clippy** - Rust code analysis
- **Go vet** - Go code validation

**Implementation Priority**: HIGH
**Template**: Use our TypeScript hook as base

### 2. Security Hooks
**Purpose**: Prevent vulnerabilities, detect secrets, audit dependencies

**Existing Examples**:
- **npm audit** - Dependency vulnerability scanning
- **snyk** - Security analysis
- **truffleHog** - Secret detection
- **bandit** - Python security linting

**Implementation Priority**: CRITICAL
**Blocking**: TRUE (should block on security issues)

### 3. Documentation Hooks
**Purpose**: Ensure documentation completeness and consistency

**Existing Examples**:
- **JSDoc validation** - Documentation completeness
- **README checks** - Documentation structure
- **API doc generation** - OpenAPI/Swagger validation

**Implementation Priority**: MEDIUM
**Template**: Frontmatter validation for DSS

### 4. Testing Hooks
**Purpose**: Validate test coverage and test file completeness

**Existing Examples**:
- **Test coverage** - Coverage percentage checks
- **Unit test validation** - Test file completeness
- **Integration test triggers** - End-to-end test validation

**Implementation Priority**: MEDIUM
**Blocking**: FALSE (warnings only)

## Recommended Implementation Order

### Phase 1: High Impact (Immediate)
1. **✅ TypeScript + ESLint Hook** - Combined validation working
2. **✅ Markdown Formatting Hook** - Auto-formats markdown documents
3. **Frontmatter Validation** - DSS-specific, critical for structure
4. **Security Audit** - Safety critical, should block on issues

### Phase 2: Project-Specific (Short-term)
5. **Template Validation** - Phoenix CLI template validation
6. **Cross-Reference Validation** - DSS link checking
7. **Package.json Validation** - npm configuration validation

### Phase 3: Workflow Enhancement (Medium-term)
8. **Commit Message Hook** - Conventional commit validation
9. **Branch Naming Hook** - Git workflow validation
10. **Documentation Sync Hook** - Code-docs alignment

## Custom Hook Concepts

### DSS-Specific Hooks

#### DSS Structure Validation Hook
```python
# .claude/hooks/dss_structure.py
# Validates DSS folder structure compliance
# Checks src/, docs/, data/, meta/, tests/ organization
# Validates file naming conventions
```

#### DSS Metadata Hook
```python
# .claude/hooks/dss_metadata.py
# Validates frontmatter in all DSS files
# Ensures tags, provides, requires relationships
# Checks for orphaned or missing dependencies
```

#### DSS Archive Hook
```python
# .claude/hooks/dss_archive.py
# Prevents editing of archived content
# Validates archive directory structure
# Ensures proper archival process
```

### Phoenix-Specific Hooks

#### Phoenix CLI Validation Hook
```python
# .claude/hooks/phoenix_cli.py
# Validates CLI command structure
# Checks command documentation completeness
# Validates interactive menu flows
```

#### Phoenix Template Hook
```python
# .claude/hooks/phoenix_template.py
# Validates configuration templates
# Checks template syntax and structure
# Ensures template documentation completeness
```

#### Phoenix Workflow Hook
```python
# .claude/hooks/phoenix_workflow.py
# Validates TDD workflow implementation
# Checks phase transitions and quality gates
# Validates orchestrator logic
```

## Implemented Hooks Details

### Markdown Formatting Hook ✅
**File**: `.claude/hooks/markdown_format.py`
**Purpose**: Automatically format markdown files after creation or editing

**Features**:
- **Auto-fix capability**: Uses `markdownlint-cli2 --fix` to automatically fix formatting issues
- **Multi-tool support**: Falls back to Prettier if markdownlint not available  
- **File type coverage**: Handles `.md`, `.mdx`, `.markdown` files
- **Non-blocking**: Only blocks on unfixable errors, formats automatically otherwise
- **Detection strategies**: Uses same robust detection pattern as TypeScript hook

**Tools Used**:
1. **Primary**: `markdownlint-cli2` with `--fix` flag
2. **Fallback**: Prettier with markdown parser
3. **Detection**: npx, direct command, local node_modules, Windows paths

**What it fixes**:
- Heading spacing (e.g., `##Title` → `## Title`)
- Trailing whitespace
- Multiple blank lines
- List formatting inconsistencies
- Code block spacing
- Link formatting

**Installation**: `npm install -g markdownlint-cli2`

### TypeScript + ESLint Hook ✅
**File**: `.claude/hooks/type_check.py`
**Purpose**: Combined TypeScript type checking and ESLint linting

**Features**:
- **Dual validation**: Runs both TypeScript and ESLint checks
- **File type coverage**: `.ts`, `.tsx`, `.js`, `.jsx` files
- **Independent execution**: Both tools run separately, either can fail gracefully
- **Comprehensive detection**: Multiple strategies for finding tools

## Implementation Template

### Base Hook Structure (from successful TypeScript hook)
```python
import json
import sys
import subprocess
import re
from pathlib import Path

def find_tool():
    """Multi-strategy tool detection"""
    # Strategy 1: Direct command
    # Strategy 2: npx wrapper  
    # Strategy 3: Local node_modules
    # Strategy 4: Windows-specific paths
    # Strategy 5: Graceful fallback

def run_validation():
    """Run the actual validation"""
    # Non-blocking exit codes (0 for warnings, 2 for errors)
    # Proper error handling
    # Helpful error messages
```

### Exit Code Strategy
- **Exit 0**: Warnings only, operation continues
- **Exit 1**: Non-blocking errors (deprecated, use 0)
- **Exit 2**: Blocking errors, operation stops

### Error Handling Best Practices
1. **Graceful degradation** - Continue if tool unavailable
2. **Clear messaging** - Explain what's happening
3. **Context awareness** - Adapt to project type
4. **Non-blocking by default** - Only block on critical issues

## Hook Configuration Strategy

### Recommended Configuration File
```yaml
# .claude/hooks/config.yml
hooks:
  typescript:
    enabled: true
    blocking: false
  eslint:
    enabled: true
    blocking: false
  frontmatter:
    enabled: true
    blocking: true  # Critical for DSS
  security:
    enabled: true
    blocking: true  # Critical for safety
```

### Environment-Specific Settings
- **Development**: All hooks enabled, warnings only
- **Production**: Critical hooks blocking, security strict
- **CI/CD**: All hooks blocking, strict validation

## Advanced Hook Concepts

### Multi-Tool Orchestration Hook
```python
# .claude/hooks/workflow_orchestrator.py
# Coordinates multiple validation tools
# Runs TypeScript + ESLint + Security in sequence
# Provides unified error reporting
```

### Context-Aware Hook
```python
# .claude/hooks/context_validation.py
# Adapts validation based on file type and project context
# Different rules for Phoenix vs DSS vs general code
```

### Learning Hook
```python
# .claude/hooks/pattern_learning.py
# Learns from your coding patterns
# Suggests improvements based on project history
```

## Troubleshooting Guide

### Common Issues
1. **Tool not found**: Use multi-strategy detection
2. **Permission errors**: Check PATH and file permissions
3. **Timeout issues**: Add timeout parameters
4. **Environment differences**: Test in multiple contexts

### Debug Strategies
1. **Add debug output**: Print tool detection steps
2. **Test manually**: Run hook commands directly
3. **Check environment**: Verify PATH and dependencies
4. **Validate exit codes**: Ensure proper error handling

## Success Metrics

### Hook Effectiveness
- **Reduced errors**: Fewer issues caught in CI/CD
- **Improved quality**: Better code consistency
- **Faster feedback**: Issues caught during development
- **Developer satisfaction**: Less manual validation needed

### Implementation Success
- **Non-blocking operation**: Workflow continues smoothly
- **Clear messaging**: Developers understand what's happening
- **Reliable detection**: Tools found consistently
- **Proper error handling**: Graceful degradation when needed

## Future Enhancements

### Planned Improvements
1. **Hook chaining**: Coordinate multiple hooks
2. **Performance optimization**: Parallel execution
3. **Custom rules**: Project-specific validation
4. **Integration**: Connect with CI/CD pipelines

### Research Areas
1. **Community hooks**: Learn from other developers
2. **Tool ecosystem**: Explore new validation tools
3. **Best practices**: Stay current with hook patterns
4. **Performance**: Optimize for large codebases

---

## Notes
- Last updated: Added markdown formatting hook with auto-fix capability
- Status: Two powerful hooks working (TypeScript+ESLint, Markdown formatting)
- Next priority: Frontmatter validation hook for DSS structure validation
- Template: Use existing hooks as base - proven detection and error handling patterns
