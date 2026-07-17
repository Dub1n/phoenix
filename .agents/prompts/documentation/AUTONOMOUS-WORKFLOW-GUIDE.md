# Autonomous Workflow Guide

**Purpose**: User guide for the three-phase autonomous task execution workflow

**Target Audience**: Developers and project managers using the autonomous workflow system

**Key Principle**: Clear separation of implementation, validation, and documentation ensures quality and prevents premature completion claims

---

## Quick Start - Three-Phase Workflow

### Overview

The autonomous workflow separates task execution into three distinct phases to ensure quality and prevent agents from claiming completion without actual testing:

``` workflow
Phase 1: IMPLEMENTATION    →    Phase 2: VALIDATION    →    Phase 3: DOCUMENTATION
/pr:task                        /pr:validate              /pr:document
Status: [~] or [B]             Status: [T] or [B]        Status: [x]
```

### Immediate Workflow

**Start a task:**

```bash
/pr:task Templum TASK-CLI-016 "Fix service discovery bug"
```

**After implementation complete, validate:**

```bash
/pr:validate
```

**After validation passes, document:**

```bash
/pr:document --tracker
```

**Or run both validation and documentation together:**

```bash
/pr:complete --tracker
```

---

## Command Reference

### `/pr:task` - Implementation Phase

**Purpose**: Task selection and code implementation

**Status Progression**: `[ ]` → `[~]` or `[B]`

**What it does**:

- Selects appropriate task from active task queue
- Routes to quick-fix-guide.md or comprehensive-fix-guide.md
- Implements code changes with basic compilation check
- Creates TODO tags for discovered issues
- **Does NOT validate or document**

**When complete**: Run `/pr:validate` to test functionality

**Arguments**:

```bash
/pr:task [Project] [TASK-ID] "description"     # Implement specific task
/pr:task [Project] [TASK-ID]                   # Implement from active queue  
/pr:task [Project] "description"               # Create and implement new task
```

### `/pr:validate` - Testing Phase

**Purpose**: Comprehensive functionality testing and evidence collection

**Status Progression**: `[~]/[B]` → `[T]` or back to `[B]`

**What it does**:

- Executes tests from TEMPLUM-TESTING-GUIDE based on task type
- Collects evidence (command outputs, logs, screenshots)
- Validates actual functionality, not just compilation
- Generates validation report with evidence
- **Forces proof that code actually works**

**Prerequisites**: Task must be [~] or [B] (implementation complete)

**Key Feature**: **Can be run multiple times** during debugging cycle

### `/pr:document` - Documentation Phase  

**Purpose**: Pattern documentation and project tracking

**Status Progression**: `[T]` → `[x]`

**What it does**:

- Processes TODO tags and consolidates tasks
- Creates fix documentation using templates
- Updates pattern documentation
- Updates project tracker
- **Only runs after successful validation**

**Prerequisites**: Task must be [T] (validation passed)

**Arguments**:

```bash
/pr:document --tracker    # Include project tracker updates
```

### `/pr:complete` - Orchestrator

**Purpose**: Runs validation + documentation in sequence

**What it does**:

- Executes `/pr:validate` functionality
- If validation passes, executes `/pr:document` functionality
- If validation fails, stops and returns to implementation
- **Backward compatibility** with existing workflows

**Use when**: You want complete workflow automation after implementation

---

## Status Progression & Gates

### Task Status Flow

``` workflow
[~] in-progress        →  Implementation complete
[B] broken-implemented →  Implementation with compilation issues

        ↓ (Run /pr:validate)

[T] implemented-testing →  Validation passed, ready for documentation  
[B] broken-implemented  →  Validation failed, return to implementation

        ↓ (Run /pr:document)

[x] completed          →  Full workflow complete with documentation
```

### Quality Gates

**Gate 1**: Implementation → Validation

- Code compiles without errors in task scope
- Basic functionality not obviously broken
- TODO tags created for discovered issues

**Gate 2**: Validation → Documentation

- All applicable tests from TEMPLUM-TESTING-GUIDE pass
- Evidence collected (command outputs, logs, screenshots)
- Actual functionality demonstrated working

**Gate 3**: Documentation Complete

- Fix documentation created using templates
- Pattern documentation updated
- Project tracker updated (if enabled)

---

## Validation Requirements by Task Type

### Backend Service Tasks

**Tests**: TEMPLUM-TESTING-GUIDE Section 2

- HTTP Endpoint Testing (2.1)
- Skin Definition Validation (2.2)  
- Command Parameter Handling (2.3)
- **Evidence**: JSON responses, health checks, API outputs

### Service Discovery Tasks  

**Tests**: TEMPLUM-TESTING-GUIDE Section 1

- Auto-Registration Testing (1.1)
- Registry File Discovery (1.2)
- Service Cleanup Testing (1.3)
- **Evidence**: Service files, registration JSONs, cleanup proof

### CLI Enhancement Tasks

**Tests**: TEMPLUM-TESTING-GUIDE Section 3

- CLI Service Discovery (3.1)
- CLI Menu Rendering (3.2)
- CLI Command Execution (3.3)
- **Evidence**: CLI screenshots, command outputs, interactions

### End-to-End Workflow Tasks

**Tests**: TEMPLUM-TESTING-GUIDE Section 4

- Complete Service Lifecycle (4.1)
- **Evidence**: Full workflow logs, state changes, integration proof

---

## 💡 Workflow Examples

### Example 1: Simple Bug Fix

```bash
# 1. Implement the fix
/pr:task Templum TASK-CLI-003 "Fix button click handler"
# Status: [~] in-progress → Implementation complete

# 2. Test the fix  
/pr:validate
# Runs CLI tests, verifies button actually works
# Status: [~] → [T] implemented-testing

# 3. Document the fix
/pr:document --tracker  
# Status: [T] → [x] completed
```

### Example 2: Complex Feature with Debugging

```bash
# 1. Implement the feature
/pr:task Templum TASK-NEW-055 "Add service health monitoring"
# Status: [~] in-progress → Implementation complete

# 2. First validation attempt
/pr:validate
# Tests fail - health endpoint returns 500 error
# Status: [~] → [B] broken-implemented

# 3. Debug and fix the issue
/pr:task --continue
# Fix the health endpoint implementation  
# Status: [B] → [~] in-progress

# 4. Validate again
/pr:validate
# Tests pass - health endpoint returns proper JSON
# Status: [~] → [T] implemented-testing

# 5. Document the completed feature
/pr:document --tracker
# Status: [T] → [x] completed
```

### Example 3: Quick Complete Workflow

```bash
# 1. Implement 
/pr:task Templum TASK-QUICK-001 "Update import paths"
# Status: [~] → Implementation complete

# 2. Validate and document in one command
/pr:complete --tracker
# Runs validation → passes → runs documentation
# Status: [~] → [T] → [x] completed
```

---

## Common Issues & Solutions

### "Agent Claims Complete Without Testing"

**Problem**: Agent runs `/pr:task`, marks as [x], and claims "production ready"

**Solution**:

- Tasks can only be marked [x] in documentation phase
- Implementation phase can only mark [~] or [B]
- Validation phase must pass before documentation runs
- **Agents cannot skip validation phase**

### "Validation Fails But Agent Continues"

**Problem**: `/pr:validate` finds issues but agent proceeds to documentation

**Solution**:

- Documentation phase checks prerequisites (task must be [T])
- Validation failures result in [B] status, blocking documentation
- **Clear status gates prevent premature completion**

### "Testing is Too Generic"

**Problem**: Agent runs generic tests instead of task-specific validation

**Solution**:

- TEMPLUM-TESTING-GUIDE provides specific test procedures by task type
- Evidence requirements force actual command execution
- **No generic "tests pass" claims accepted**

### "Evidence is Missing or Fake"

**Problem**: Agent claims validation passed without providing proof

**Solution**:

- Validation phase requires specific evidence collection
- Evidence format specified in testing guide
- **Must provide actual command outputs, logs, screenshots**

---

## Best Practices

### For Implementation Phase

1. **Keep Implementation Focused**: Only implement the specific task, don't expand scope
2. **Create Comprehensive TODOs**: Tag all discovered issues for later processing
3. **Basic Verification Only**: Just check compilation, leave testing for validation phase
4. **Status Accuracy**: Never mark [x] during implementation

### For Validation Phase

1. **Use Specific Tests**: Follow TEMPLUM-TESTING-GUIDE sections for task type
2. **Collect Real Evidence**: Actual command outputs, not summaries or descriptions
3. **Test User Scenarios**: Validate from user's perspective, not just technical function  
4. **Iterate When Needed**: Re-run validation after fixing issues

### For Documentation Phase

1. **Wait for Validation**: Only document after tests pass
2. **Use Templates**: Copy and fill provided documentation templates
3. **Update Patterns**: Consolidate patterns, don't duplicate
4. **Track Progress**: Update project tracker for visibility

### For Project Managers

1. **Check Status Progression**: [~] → [T] → [x] shows proper workflow
2. **Require Evidence**: Validation reports should contain actual proof
3. **Review Documentation**: Fix documents should reference validation evidence
4. **Monitor Quality Gates**: Each phase has clear success criteria

---

## Advanced Usage

### Iterative Development

**Scenario**: Working on complex feature with multiple test cycles

```bash
# Initial implementation
/pr:task Templum TASK-COMPLEX-001 "Multi-service integration"

# Test early and often
/pr:validate    # May fail multiple times during development

# Continue implementation based on test results
/pr:task --continue

# Repeat until validation passes
/pr:validate    # Finally passes

# Document the completed work
/pr:document --tracker
```

### Parallel Development

**Scenario**: Multiple developers working on related tasks

```bash
# Developer A
/pr:task Templum TASK-A-001 "Backend API changes"
/pr:validate    # Passes
# Don't document yet, wait for integration

# Developer B  
/pr:task Templum TASK-B-001 "Frontend integration"
/pr:validate    # May need backend changes from Task A

# After both components working
/pr:document --tracker  # Document both tasks
```

### Quality Assurance

**Scenario**: QA wants to verify agent claims

```bash
# Check task status in active-tasks.md
# If status is [x], validation should have evidence

# Re-run validation to verify claims
/pr:validate    # Should pass if properly implemented

# Check validation evidence
# Review logs, outputs, screenshots from validation report
```

---

## Success Metrics

### Workflow Quality Indicators

**Good Workflow Signs**:

- Status progression follows [~] → [T] → [x] pattern
- Validation evidence exists and shows working functionality
- Documentation references validation results
- No [x] status without prior [T] status

**Warning Signs**:

- Tasks marked [x] without [T] status in history  
- Missing validation evidence or generic test claims
- Documentation created without validation reference
- Status jumps from [~] directly to [x]

### Project Health Tracking

**Monitor These Metrics**:

- **Validation Pass Rate**: % of tasks that pass validation on first try
- **Evidence Quality**: Completeness of validation evidence collection
- **Status Compliance**: % of tasks following proper status progression
- **Documentation Coverage**: % of completed tasks with proper fix documentation

---

## Integration Points

### With Existing Tools

**TEMPLUM-TESTING-GUIDE**: Primary validation document with specific test procedures

**Project Trackers**: Updated during documentation phase for progress visibility

**Pattern Documentation**: Consolidated during documentation phase to prevent duplication

**Fix Templates**: Used during documentation phase for consistent documentation

### With Development Workflow

**Git Integration**: Each phase can correspond to different commit points

- Implementation: Initial commit with working code
- Validation: Validation evidence and any bug fixes  
- Documentation: Final documentation and pattern updates

**CI/CD Integration**: Validation phase can trigger automated testing pipelines

**Code Review**: Documentation phase provides evidence for code review process

---

**Remember**: The three-phase workflow ensures quality by making validation mandatory and preventing documentation of unvalidated code. Each phase has clear responsibilities and gates that agents cannot skip.

> **Success = Implementation + Validated Evidence + Proper Documentation**
