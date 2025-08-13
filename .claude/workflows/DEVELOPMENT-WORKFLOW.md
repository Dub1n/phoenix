# Development Workflow for VDL_Vault Repository

## ⊕ Overview

This document defines the step-by-step development workflow for making changes across all projects in the VDL_Vault repository. This includes Phoenix Code Lite, QMS Infrastructure, Haruspex, and other adjacent projects. Following this workflow ensures consistency, quality, and maintainability across the entire repository ecosystem.

## ⋇ Pre-Development Checklist

### 1. Context Understanding

- [ ] **Read the task** - Understand exactly what needs to be done
- [ ] **Identify target project** - Determine which project(s) will be affected (PCL, QMS, Haruspex, docs, etc.)
- [ ] **Review project context** - Understand how this fits in the specific project's workflows
- [ ] **Check related documentation** - Review relevant project docs, architecture documentation
- [ ] **Identify affected components** - Determine which parts of the repository will be modified

### 2. Environment Preparation

- [ ] **Verify development environment** - Ensure tools for target project are available
- [ ] **Check project status** - Understand current state of target project
- [ ] **Review build status** - Ensure current builds succeed (if applicable)
- [ ] **Check dependencies** - Verify project dependencies are satisfied

```bash
# Environment verification for TypeScript projects (PCL, etc.)
cd phoenix-code-lite
npm test
npm run lint
npm run build

# For other projects, check their specific requirements
cd docs && # Review documentation status
cd Obsidian && # Check QMS documentation
```

### 3. Architecture Review

- [ ] **Review project architecture** - Understand how the affected components interact
- [ ] **Check cross-project implications** - Consider how changes might affect other projects
- [ ] **Assess integration points** - Identify dependencies between projects
- [ ] **Plan change scope** - Define minimal scope to achieve the objective

## ⇔ Development Approaches by Project Type

### TypeScript Projects (Phoenix Code Lite)

Follow TDD methodology for all TypeScript development:

#### Phase 1: Test Planning and Design

```markdown
Task: {Write the specific task here}

Project: Phoenix Code Lite / QMS Infrastructure / Other

Requirements Analysis:
- Functional requirements: {What should the system do?}
- Non-functional requirements: {Performance, security, usability}
- User experience requirements: {How should users interact with this?}
- Integration requirements: {How does this fit with existing features?}
```

#### Phase 2: Implementation

- [ ] **Write minimal code** - Only what's needed to pass the current test
- [ ] **Follow project standards** - Use project-specific coding standards
- [ ] **Apply security practices** - Follow security guidelines
- [ ] **Use existing patterns** - Follow established patterns in the target project

#### Phase 3: Refactor and Polish

- [ ] **Refactor for clarity** - Improve code readability and structure
- [ ] **Optimize for project** - Address project-specific performance concerns
- [ ] **Add comprehensive documentation** - Document complex logic and decisions
- [ ] **Ensure project compliance** - Verify compliance with project standards

### Documentation Projects

For changes to documentation (docs/, Obsidian/, etc.):

#### Documentation Development Process

1. **Content Planning**
   - [ ] **Identify audience** - Who will use this documentation?
   - [ ] **Define scope** - What information needs to be covered?
   - [ ] **Check existing content** - What documentation already exists?
   - [ ] **Plan structure** - How should the content be organized?

2. **Content Creation**
   - [ ] **Follow project conventions** - Use established documentation patterns
   - [ ] **Maintain consistency** - Follow existing style and format
   - [ ] **Include examples** - Provide practical examples where applicable
   - [ ] **Cross-reference** - Link to related documentation

3. **Review and Validation**
   - [ ] **Verify accuracy** - Ensure technical accuracy
   - [ ] **Check completeness** - Verify all necessary information is included
   - [ ] **Test examples** - Verify code examples work correctly
   - [ ] **Update indices** - Update relevant indices and references

### QMS/Regulatory Projects

For QMS-related changes (Obsidian/QMS/, preparation systems):

#### QMS Development Process

1. **Compliance Assessment**
   - [ ] **Identify standards** - Which regulatory standards apply?
   - [ ] **Review requirements** - What compliance requirements must be met?
   - [ ] **Check existing compliance** - How does this fit with existing QMS?
   - [ ] **Plan validation** - How will compliance be validated?

2. **Implementation**
   - [ ] **Follow QMS patterns** - Use established QMS patterns and structures
   - [ ] **Maintain traceability** - Ensure proper traceability of requirements
   - [ ] **Document compliance** - Create necessary compliance documentation
   - [ ] **Validate against standards** - Check against regulatory requirements

## ◊ Quality Gates by Project

### Phoenix Code Lite Quality Gates

```bash
# Run all quality checks for PCL
cd phoenix-code-lite
npm run lint               # ESLint validation (target: >95% score)
npm run build              # TypeScript compilation (must succeed)
npm test                   # Test execution (must pass all tests)
npm run test:coverage      # Coverage check (target: >90%)
```

### Documentation Quality Gates

- [ ] **Accuracy validation** - All technical information is correct
- [ ] **Completeness check** - All necessary information is included
- [ ] **Format consistency** - Follows project formatting standards
- [ ] **Cross-reference validation** - All links and references work correctly

### QMS Quality Gates

- [ ] **Regulatory compliance** - Meets applicable regulatory standards
- [ ] **Traceability verification** - Requirements properly traced
- [ ] **Documentation completeness** - All required documentation present
- [ ] **Audit trail integrity** - Changes properly documented and traceable

## ◦ Project-Specific Workflows

### Phoenix Code Lite Interactive CLI Components

When modifying PCL interactive CLI components:

1. **Test session persistence** - Verify session state maintained across interactions
2. **Test navigation consistency** - Ensure breadcrumb navigation works
3. **Test mode switching** - Verify seamless switching between modes
4. **Test context preservation** - Ensure user context maintained throughout

### QMS Document Management

When working with QMS systems:

1. **Ensure regulatory compliance** - All changes maintain regulatory compliance
2. **Update traceability matrices** - Keep requirement traceability current
3. **Validate document integrity** - Ensure document management functions properly
4. **Test compliance validators** - Verify compliance checking continues to work

### Cross-Project Integration

When changes affect multiple projects:

1. **Map dependencies** - Understand all cross-project dependencies
2. **Plan coordinated changes** - Sequence changes to minimize disruption
3. **Test integration points** - Verify inter-project integrations still work
4. **Update all affected documentation** - Keep all relevant docs current

## ⋇ Documentation Workflow

### During Development

1. **Document as you go** - Record decisions and challenges as they occur
2. **Update project indices** - Keep project-specific indices current
3. **Maintain cross-references** - Update links between projects when needed
4. **Record rationale** - Document why specific approaches were chosen

### Change Documentation

```bash
# Generate timestamp for change document
timestamp=$(date "+%Y-%m-%d-%H%M%S")
project="phoenix-code-lite"  # or "qms", "haruspex", "docs", etc.
filename="$timestamp-{brief-description}-$project.md"

# Create change document in appropriate location
echo "Creating change document: $filename"
```

### Documentation Completion

- [ ] **Complete all sections** - Fill out every section in documentation templates
- [ ] **Verify accuracy** - Ensure all information is correct and current
- [ ] **Include specific paths** - List all modified files with exact paths
- [ ] **Document cross-project impact** - Explain how changes affect other projects

## ✓ Completion Checklist

### Before Considering Work Complete

- [ ] **Project-specific tests pass** - All applicable tests for the target project pass
- [ ] **Quality gates pass** - All quality checks for the project pass
- [ ] **Documentation complete** - All necessary documentation is updated
- [ ] **Cross-project impact assessed** - Impact on other projects considered
- [ ] **Integration verified** - Changes work correctly with related projects

### Final Validation by Project Type

#### Validation: TypeScript Projects

```bash
cd phoenix-code-lite
npm run build && npm test && npm run lint
echo "PCL validation complete: $(date)"
```

#### Validation: Documentation Projects

- [ ] **Links verified** - All internal and external links work
- [ ] **Examples tested** - Code examples compile and run correctly
- [ ] **Format validated** - Follows project documentation standards

#### Validation: QMS Projects

- [ ] **Compliance verified** - Meets all applicable regulatory standards
- [ ] **Traceability updated** - All requirement traces are current
- [ ] **Audit trail complete** - All changes properly documented

### Repository-Wide Impact Assessment

1. **Cross-project dependencies** - Verify no unintended impacts on other projects
2. **Documentation consistency** - Ensure documentation remains consistent across projects
3. **Integration integrity** - Verify all inter-project integrations continue to work
4. **Archive coherence** - Ensure repository maintains coherent structure

---

**Remember**: The VDL_Vault repository contains multiple interconnected projects. Always consider the broader impact of changes and maintain consistency across the entire ecosystem while respecting each project's specific requirements and constraints.
