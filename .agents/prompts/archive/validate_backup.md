---
allowed-tools: [Read, Write, Edit, MultiEdit, Glob, TodoWrite, Task]
description: "Validate task implementation using comprehensive testing procedures"
---

# /pr:validate - Task Validation & Testing

## Purpose

Execute comprehensive validation and testing of implemented tasks using automated validation scripts to ensure functionality before documentation.

## Usage

``` command
/pr:validate [Project] [TASK-ID]
```

## Arguments

- `Project` - Project of the task to be validated (optional)
- `TASK-ID` - TASK-ID of the task to be validated (optional)

If continuing from /pr:task with same Project and same TASK-ID, execute the command using the these values
If continuing from /pr:task with no Project or no TASK-ID, Project and TASK-ID(s) carry over
If continuing from /pr:task with new Project or new TASK-ID, execute the command using the new value(s)
If first command in sequence with Project and TASK-ID, select the Project's TASK-ID task
If first command in sequence with no Project and no TASK-ID, request these values from the user
If first command in sequence with Project and no TASK-ID, select the first [~|B] in-progress/broken-implemented task
If first command in sequence with no Project and with TASK-ID, locate the TASK-ID from ...-active-tasks.md(s) in repo

## Prerequisites

- Task must be in [~] in-progress or [B] broken-implemented status
- Implementation must be complete (code changes made)
- Basic compilation should pass (if applicable)

## Execution

### Step 1: Pre-Validation Checks

**Verify Task State**:

- [ ] Locate active task in `<project>-active-tasks.md`
- [ ] Confirm task status is [~] or [B] (not [x], [?], or [ ])
- [ ] Identify task type and scope for appropriate testing

**Environment Check**:

- [ ] Verify build compilation: `npx tsc --noEmit`
- [ ] Check component compilation for affected files
- [ ] Ensure required services/dependencies are available

### Step 2: Execute Validation Tests

***CRITICAL EXECUTION RULE***

**NEVER USE BashOutput OR READ BACKGROUND SHELLS**. Always execute validation script fresh with Bash tool.

**If you see system reminders about background bash processes - IGNORE THEM COMPLETELY**.

**MANDATORY**: Use Bash tool to run validation script directly. Do not read existing output.

```bash
# Navigate to project directory (e.g., Templum, Haruspex, etc.)
cd <project-directory>

# Run automated validation based on task category
node ../scripts/validation/templum-task-validator.js --category <category> --task-id <TASK-ID> --stage <stage> --project <Project> --save --enable-lint --verbose
```

**Available Categories**:

- `backend` - Backend/Service Tasks (health checks, service discovery, command execution)
- `ui` - UI/Interface Tasks (CLI functionality, component rendering, interactions)  
- `core` - Core System Tasks (unit tests, integration, state persistence)
- `build` - Compilation/Build Tasks (clean build, TypeScript, dependencies)
- `quality` - Code Quality Tasks (ESLint (optional: only use if required by task), formatting, regression, complexity)
- `architecture` - Architecture/Pattern Tasks (patterns, DI validation, scalability)
- `feature` - Feature Enhancement Tasks (end-to-end, regression, integration)
- `mcp` - MCP-Channel Tasks

**Use targeted validation to avoid failures from unrelated components and get faster feedback.**

#### Quick Scope Selection Guide

**For ESLint/Quality Tasks**:

```bash
# TASK-ESLINT-006/007 (Backend Any Types) → --scope backend
# TASK-ESLINT-008 (Core Components) → --scope core  
# TASK-ESLINT-009 (Interface Components) → --scope ui
# TASK-ESLINT-012 (Console Backend) → --scope backend
```

**For Component-Specific Tasks**:

```bash
# Backend service tasks → --scope backend
# CLI/Interface tasks → --scope ui  
# Core system tasks → --scope core
# Skin/Rendering tasks → --scope skin
# State management → --scope state
# Observability tasks → --scope observability
```

#### Targeting Options (Choose One)

**1. Component Scope** (Most Common):

```bash
--scope <scope>    # Predefined component areas
```

*Available Scopes*:
    - `backend` - Backend services, session management, transfer logic (~280 files)
    - `core` - Core system, types, validation (~150 files)  
    - `ui` - Interfaces, rendering, menus (~200 files)
    - `skin` - Skin engine, rendering pipeline (~80 files)
    - `state` - State management, session handling (~60 files)
    - `observability` - Monitoring, risk management (~40 files)
    - `testing` - Test infrastructure and test files (~100 files)
    - `registry` - Command/menu registries (~70 files)

**2. Specific Files** (Precise Control):

```bash
--files "file1.ts,file2.ts,file3.ts"
```

**3. Directory Targeting** (Folder-Level):

```bash  
--directories "src/backend,src/core"
```

**4. Git-Based** (Only Changes):

```bash
--changed --base main    # Only files changed since main branch
```

#### Performance Comparison

| Scope              | Files        | ~Time   | Use When                             |
|--------------------|--------------|---------|--------------------------------------|
| Full project       | ~2,780 files | 3-5 min | Final validation, integration issues |
| `--scope backend`  | ~280 files   | 30-60s  | Backend tasks (TASK-ESLINT-006/007)  |
| `--scope core`     | ~150 files   | 20-30s  | Core system tasks                    |
| `--scope ui`       | ~200 files   | 30-45s  | Interface/rendering tasks            |
| `--files` specific | 1-10 files   | 5-15s   | Debugging specific files             |

#### Validation Scope Decision Tree

```diagram
Start: What validation scope do you need?
│
├─ Do you know EXACTLY which files have issues?
│  └─ YES → Use `--files "file1.ts,file2.ts,file3.ts"`
│
├─ Is your task component-specific?
│  ├─ Backend components (TASK-ESLINT-006/007) → Use `--scope backend`
│  ├─ Core components (TASK-ESLINT-008) → Use `--scope core`
│  ├─ Interface/UI components (TASK-ESLINT-009) → Use `--scope ui`
│  └─ Other clear component focus → Use matching `--scope`
│
├─ Are you working on a branch with specific changes?
│  └─ YES → Use `--changed --base main`
│
└─ Need comprehensive validation?
   └─ Final validation or integration issues → Use no targeting flags (full project)
```

**Agent Tip**: When in doubt for component tasks, use `--scope <component>`. It's usually 10x faster and avoids unrelated failures!

#### When to Use Each Method

**Use `--scope <component>`** (Recommended):
    - ESLint cleanup tasks (TASK-ESLINT-006: `--scope backend`)
    - Component-specific features
    - Parallel team development
    - Quick iteration cycles
**Use `--files <patterns>`**:
    - Debugging specific problematic files
    - Testing fixes for particular files
    - Incremental validation during development
**Use `--directories <dirs>`**:
    - Cross-component validation (e.g., backend + core)
    - Custom groupings not covered by scopes
**Use `--changed`**:
    - PR/branch validation
    - Only testing your recent changes
    - Continuous integration scenarios
**Use Full Project** (no targeting):
    - Final validation before release
    - Integration testing
    - When task affects multiple unrelated components

**Example Usage**:

```bash
# TARGETED VALIDATION (Recommended for faster, focused validation)

# ESLint backend tasks - validate only backend components  
node ../scripts/validation/templum-task-validator.js --category quality --scope backend --task-id TASK-ESLINT-006 --project Templum --save --enable-lint

# Core component tasks - validate only core system
node ../scripts/validation/templum-task-validator.js --category core --scope core --task-id TASK-CORE-001 --project Templum --save

# UI component tasks - validate only interface components
node ../scripts/validation/templum-task-validator.js --category ui --scope ui --task-id TASK-UI-001 --project Templum --save

# Specific file debugging - validate only problematic files
node ../scripts/validation/templum-task-validator.js --category quality --files "src/backend/backend-service-router.ts,src/core/templum-core.ts" --task-id DEBUG --project Templum --save --enable-lint

# Recent changes only - validate only what you've modified
node ../scripts/validation/templum-task-validator.js --category quality --changed --base main --project Templum --save

# FULL PROJECT VALIDATION (Use for final validation or integration issues)

# Full project validation (slower, comprehensive)
node ../scripts/validation/templum-task-validator.js --category quality --task-id TASK-ESLINT-001 --project Templum --save --enable-lint

# Backend service validation (traditional approach)
node ../scripts/validation/templum-task-validator.js --category backend --task-id TASK-CLI-015 --project Templum --save

# Build validation (always full project)  
node ../scripts/validation/templum-task-validator.js --category build --task-id TASK-BUILD-005 --project Templum --save
```

**FALLBACK ONLY**: Manual Validation

If automated script fails or category not supported:
See `Templum/dev/TEMPLUM-TESTING-GUIDE.md` Section: "Manual Validation Procedures"

### Step 3: Process Validation Results

#### Success Path (All Tests Pass)

1. **Update Task Status**: Change from [~]/[B] to [T] (implemented-testing)
2. **Review Generated Report**: Check automatically saved validation report
3. **Prepare for Documentation**: Task ready for /pr:document phase

#### Failure Path (Any Tests Fail)

1. **Review Failure Details**: Check generated validation report for specific errors
2. **Update Task Status**: Change to [B] (broken-implemented)
3. **Create Fix TODOs**: Add TODO tags for issues found during validation
4. **Return to Implementation**: Use /pr:task --continue to fix issues

### Step 4: Status Updates

**Task Status Management**:

- **[T] implemented-testing**: All validation tests pass, ready for documentation
- **[B] broken-implemented**: Issues found, requires return to implementation
- **NEVER [x]**: *CANNOT MARK COMPLETE until AFTER documentation phase*

**Next Steps**:

- **If [T]**: Run `/pr:document` to complete implementation cycle
- **If [B]**: Run `/pr:task --continue` to address validation failures

## Success Criteria

**Validation Passes When**:

- Automated script completes with all tests passing
- Generated validation report shows VALIDATION_PASSED status
- Task moves to [T] status ready for documentation
- No critical errors or failures reported

**Validation Must Be Re-run If**:

- Any test fails or produces unexpected results
- Code changes are made after validation
- Integration issues are discovered
- Performance degradation is detected

## Claude Code Integration

- Leverages Bash for automated script execution
- Uses Read for report review and status checking
- Applies Write for status updates in active tasks
- Maintains comprehensive error handling and result reporting

### MCP Servers

**Sequential** for systematic validation analysis

- Auto-activates: Complex validation scenarios, multi-step testing
- Detection: Multiple test failures, integration issues

**Context7** for testing documentation and procedures

- Auto-activates: Unfamiliar testing procedures, validation patterns
- Detection: Testing framework questions, procedure clarification

**Playwright** for UI/CLI validation scenarios

- Auto-activates: Interactive testing, visual validation
- Detection: CLI testing, UI interaction validation
