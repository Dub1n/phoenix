# Refactor Protocol Template Reference Library

**Purpose**: Extended template variations and language-specific patterns for the Self-Executing Refactor Protocol  
**Usage**: Reference this file when you need detailed template variations or language-specific patterns  
**Related**: [Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)

---

## ⊕ Template System Overview

### Dynamic Placeholder System

All templates use `{{variable}}` placeholders that get resolved with actual project context:

- **Project Context**: `{{project.language}}`, `{{project.framework}}`, `{{project.testing_framework}}`
- **Current State**: `{{current.file}}`, `{{current.function}}`, `{{current.module}}`
- **Metrics**: `{{metrics.coverage}}`, `{{metrics.complexity}}`, `{{metrics.target}}`
- **Separation**: `{{separation.file1}}`, `{{separation.purpose1}}`, `{{separation.strategy}}`

### Template Resolution Process

1. Agent analyzes project and populates context variables
2. All `{{variable}}` placeholders are replaced with actual values
3. Templates become fully contextualized for the specific project
4. Agent executes the resolved template with complete context

---

## ◦ Phase 0: Setup & Context Gathering

### Template 0.1: Project Context Analysis

#### Template 0.1: Standard Version

```markdown
ACT AS: Expert software architect and refactoring specialist.
TASK: Analyze provided project files to establish refactoring context.
REQUIRED: Language detection, framework identification, structure analysis, quality assessment.
OUTPUT: Project overview, technology stack, current structure, quality assessment, refactoring scope.
```

#### Template 0.1: Python-Specific Version

```markdown
ACT AS: Python expert and software architect.
TASK: Analyze Python project files for refactoring context.
REQUIRED: Python version detection, framework identification (Django/Flask/FastAPI), package analysis, code quality assessment.
OUTPUT: Python version, framework details, dependency analysis, code quality metrics, refactoring scope.
```

#### Template 0.1: TypeScript-Specific Version

```markdown
ACT AS: TypeScript expert and software architect.
TASK: Analyze TypeScript project files for refactoring context.
REQUIRED: TypeScript version, framework identification (React/Express/Angular), build system analysis, type system assessment.
OUTPUT: TypeScript version, framework details, build configuration, type coverage, refactoring scope.
```

### Template 0.2: Environment Setup

#### Template 0.2: Standard Version

```markdown
ACT AS: DevOps engineer and refactoring coordinator.
TASK: Set up refactoring environment and safety measures.
REQUIRED: Git branch creation, dependency verification, build testing, baseline establishment.
OUTPUT: Git status, build status, test status, workspace readiness confirmation.
```

#### Template 0.2: Git-Focused Version

```markdown
ACT AS: Git expert and refactoring coordinator.
TASK: Set up Git-based refactoring environment with safety measures.
REQUIRED: Refactoring branch creation, working directory cleanup, baseline commit, safety branch.
OUTPUT: Git branch status, working directory status, baseline established, safety measures ready.
```

---

## ⌕ Phase 1: Reconnaissance & Planning

### Template 1.1: Code Smell Analysis

#### Template 1.1: Standard Version

```markdown
ACT AS: Static analysis tool and code quality specialist.
TASK: Analyze codebase for code smells and refactoring opportunities.
REQUIRED: Long methods, large classes, duplication, nesting, naming, responsibilities, unused code.
OUTPUT: Code smell summary, critical issues, refactoring opportunities, effort estimates.
```

#### Template 1.1: Language-Specific Versions

**Python Analysis**:

```markdown
ACT AS: Python code quality specialist.
TASK: Analyze Python codebase for Python-specific code smells.
REQUIRED: Long functions (>20 lines), large classes (>200 lines), duplicate imports, mixed responsibilities, unused imports, complex list comprehensions.
OUTPUT: Python-specific code smells, PEP 8 violations, refactoring opportunities, effort estimates.
```

**TypeScript Analysis**:

```markdown
ACT AS: TypeScript code quality specialist.
TASK: Analyze TypeScript codebase for TypeScript-specific code smells.
REQUIRED: Large components, any types, complex interfaces, duplicate type definitions, mixed concerns, unused exports.
OUTPUT: TypeScript-specific code smells, type safety issues, refactoring opportunities, effort estimates.
```

### Template 1.2: Refactoring Plan Creation

#### Template 1.2: Standard Version

```markdown
ACT AS: Project manager and refactoring strategist.
TASK: Create comprehensive, prioritized refactoring plan.
REQUIRED: Task grouping by phase, effort estimation, dependency mapping, execution sequence.
OUTPUT: Structured task list by phase, dependencies, risk assessment, timeline estimates.
```

#### Template 1.2: Risk-Focused Version

```markdown
ACT AS: Risk management specialist and refactoring strategist.
TASK: Create risk-aware refactoring plan with mitigation strategies.
REQUIRED: Risk assessment for each task, dependency analysis, rollback strategies, safety measures.
OUTPUT: Risk-ranked task list, mitigation strategies, rollback procedures, safety checkpoints.
```

---

## ⊜ Phase 2: Safety Net Creation

### Template 2.1: Test Suite Generation

#### Template 2.1: Standard Version

```markdown
ACT AS: Test engineer and quality assurance specialist.
TASK: Create comprehensive test suites for {{current.module}} before refactoring.
REQUIRED: Unit tests, edge cases, error conditions, integration tests, >{{project.coverage_target}}% coverage.
OUTPUT: Test file created, coverage achieved, test results, coverage report.
```

#### Template 2.1: Framework-Specific Versions

**Jest (React/Node.js)**:

```markdown
ACT AS: Jest testing specialist.
TASK: Create Jest-based test suite for {{current.module}}.
REQUIRED: Unit tests with mocks, integration tests, snapshot tests, coverage >{{project.coverage_target}}%.
OUTPUT: Jest test file, coverage report, test results, safety net status.
```

**pytest (Python)**:

```markdown
ACT AS: pytest testing specialist.
TASK: Create pytest-based test suite for {{current.module}}.
REQUIRED: Unit tests with fixtures, parametrized tests, coverage >{{project.coverage_target}}%.
OUTPUT: pytest test file, coverage report, test results, safety net status.
```

### Template 2.2: Test Validation

#### Template 2.2: Standard Version

```markdown
ACT AS: Quality assurance engineer.
TASK: Validate test suite provides adequate safety coverage.
REQUIRED: Test execution, coverage verification, edge case validation, error condition testing.
OUTPUT: Test suite status, coverage report, validation results, safety net readiness.
```

#### Template 2.2: Coverage-Focused Version

```markdown
ACT AS: Coverage analysis specialist.
TASK: Validate test coverage meets quality standards for safe refactoring.
REQUIRED: Line coverage >90%, branch coverage >85%, function coverage 100%, critical path coverage.
OUTPUT: Coverage analysis, gap identification, safety assessment, refactoring readiness.
```

---

## ⊛ Phase 3: Structural Reorganization

### Template 3.1: File Separation

#### Template 3.1: Standard Version

```markdown
ACT AS: Software architect and code organization specialist.
TASK: Separate mixed responsibilities in {{current.file}} into focused, single-purpose files.
REQUIRED: Create {{separation.file1}} for {{separation.purpose1}}, {{separation.file2}} for {{separation.purpose2}}.
OUTPUT: New file contents, import updates, separation confirmation.
```

#### Template 3.1: Responsibility-Focused Version

```markdown
ACT AS: Single Responsibility Principle specialist.
TASK: Apply SRP to separate {{current.file}} into focused components.
REQUIRED: Identify distinct responsibilities, create focused files, maintain functionality, update references.
OUTPUT: Separated files, responsibility mapping, import updates, SRP compliance confirmation.
```

### Template 3.2: Directory Restructuring

#### Template 3.2: Standard Version

```markdown
ACT AS: Project organization specialist.
TASK: Reorganize project structure to follow standard layout conventions.
REQUIRED: Source file organization, test separation, configuration organization, package structure.
OUTPUT: Directory structure, files moved, structure completion confirmation.
```

#### Template 3.2: Framework-Specific Versions

**Express.js Structure**:

```markdown
ACT AS: Express.js architecture specialist.
TASK: Reorganize project to follow Express.js best practices.
REQUIRED: Routes separation, middleware organization, controller/model separation, test organization.
OUTPUT: Express.js structure, file organization, import updates, structure completion.
```

**React Structure**:

```markdown
ACT AS: React architecture specialist.
TASK: Reorganize React project to follow component-based architecture.
REQUIRED: Component separation, hook organization, utility organization, test structure.
OUTPUT: React structure, component organization, import updates, structure completion.
```

---

## ◦ Phase 4: Granular Refactoring

### Template 4.1: Method Extraction

#### Template 4.1: Standard Version

```markdown
ACT AS: Refactoring specialist and clean code practitioner.
TASK: Apply "Extract Method" refactoring to improve {{current.function}}.
REQUIRED: Identify logical blocks, create helper functions, maintain functionality, ensure tests pass.
OUTPUT: Refactored function, new helper methods, test results, refactoring confirmation.
```

#### Template 4.1: Complexity-Focused Version

```markdown
ACT AS: Code complexity specialist.
TASK: Reduce complexity of {{current.function}} through method extraction.
REQUIRED: Identify complex logic blocks, extract to descriptive methods, maintain readability, verify tests.
OUTPUT: Simplified function, extracted methods, complexity reduction, test confirmation.
```

### Template 4.2: Duplicate Code Consolidation

#### Template 4.2: Standard Version

```markdown
ACT AS: Code quality specialist and DRY principle practitioner.
TASK: Consolidate duplicate code patterns found across multiple functions.
REQUIRED: Identify common logic, create utility functions, refactor original functions, maintain tests.
OUTPUT: New utility function, refactored functions, consolidation confirmation.
```

#### Template 4.2: Pattern-Focused Version

```markdown
ACT AS: Design pattern specialist.
TASK: Apply design patterns to eliminate duplicate code in {{current.module}}.
REQUIRED: Identify duplicate patterns, apply appropriate patterns, refactor functions, maintain functionality.
OUTPUT: Pattern implementation, refactored code, duplication elimination, test confirmation.
```

---

## ⑇ Phase 5: Final Polish & Documentation

### Template 5.1: Documentation Generation

#### Template 5.1: Standard Version

```markdown
ACT AS: Technical writer and documentation specialist.
TASK: Generate comprehensive documentation for refactored code.
REQUIRED: Function docstrings, API documentation, usage examples, architecture overview.
OUTPUT: Function documentation, API documentation, usage examples, architecture summary.
```

#### Template 5.1: Language-Specific Versions

**Python Documentation**:

```markdown
ACT AS: Python documentation specialist.
TASK: Generate Python-compliant documentation for refactored code.
REQUIRED: PEP 257 docstrings, type hints, usage examples, architecture documentation.
OUTPUT: Python documentation, type annotations, examples, architecture summary.
```

**TypeScript Documentation**:

```markdown
ACT AS: TypeScript documentation specialist.
TASK: Generate TypeScript-compliant documentation for refactored code.
REQUIRED: JSDoc comments, interface documentation, usage examples, architecture overview.
OUTPUT: TypeScript documentation, interface docs, examples, architecture summary.
```

### Template 5.2: Final Quality Review

#### Template 5.2: Standard Version

```markdown
ACT AS: Code reviewer and quality assurance specialist.
TASK: Perform final quality review of refactored codebase.
REQUIRED: Test verification, code style validation, architectural assessment, functionality confirmation.
OUTPUT: Final test results, quality score, architecture assessment, completion confirmation.
```

#### Template 5.2: Comprehensive Review Version

```markdown
ACT AS: Senior code reviewer and quality specialist.
TASK: Perform comprehensive quality review with metrics and recommendations.
REQUIRED: Test coverage verification, code quality metrics, architectural review, performance assessment.
OUTPUT: Quality metrics, architectural assessment, performance analysis, completion confirmation.
```

---

## ⚡ Edge Case Templates

### Template E.1: Recovery from Failed Refactoring

```markdown
ACT AS: Recovery specialist and refactoring expert.
TASK: Recover from failed refactoring attempt in {{current.phase}}.
REQUIRED: Identify failure point, revert changes, restore functionality, re-plan approach.
OUTPUT: Recovery status, restored functionality, revised plan, next action.
```

### Template E.2: Handling Unusual Project Structures

```markdown
ACT AS: Architecture specialist and refactoring expert.
TASK: Handle unusual project structure in {{current.project}}.
REQUIRED: Analyze unusual patterns, adapt refactoring approach, maintain functionality, document decisions.
OUTPUT: Adapted approach, refactoring plan, documentation, next action.
```

---

## ∞ Related Documentation

- **[Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)** - Core execution engine and templates
- **[Examples & Workflows](mdc:prompts/code/refactor_protocol_examples.md)** - Workflow examples and troubleshooting
- **[Testing Guide](mdc:prompts/code/refactor_protocol_testing.md)** - Testing procedures and validation
- **[Language Specifics](mdc:prompts/code/refactor_protocol_language_specifics.md)** - Language-specific patterns

---

**Remember**: These templates provide variations for different scenarios. Choose the most appropriate template based on your project context and requirements.
