---
allowed-tools: [Read, Write, Edit, MultiEdit, Glob, TodoWrite, Task]
description: "Orchestrator command: runs validation then documentation for complete workflow"
---

# /pr:complete - Complete Workflow Orchestrator

## Purpose

Orchestrates the complete task workflow by running both validation and documentation phases. This command is provided for backward compatibility and convenience.

## Usage

``` command
/pr:complete --tracker
```

## Arguments

- `--tracker` - Enables the updating of the Data Tracker (passed to documentation phase)

## Workflow Orchestration

This command executes the following sequence:

### Phase 1: Validation

**Execute**: `/pr:validate` functionality

**Purpose**: Comprehensive testing using TEMPLUM-TESTING-GUIDE

**Prerequisites**: Task must be [~] or [B] status

**Outcome**: Task moves to [T] status if validation passes, or [B] if issues found

### Phase 2: Documentation (Only if validation passes)

**Execute**: `/pr:document --tracker` functionality  

**Purpose**: Pattern documentation and project tracking

**Prerequisites**: Task must be [T] status (validation passed)

**Outcome**: Task moves to [x] status (complete)

## Execution Flow

### Step 1: Task Status Verification

**Verify Prerequisites**:

- [ ] Locate active task in `<project>-active-tasks.md`
- [ ] Confirm task is in [~] or [B] status (implementation complete)
- [ ] Ensure no code changes since last implementation

### Step 2: Execute Validation Phase

**Run Validation Process** (from /pr:validate):

- [ ] Execute task-specific tests from TEMPLUM-TESTING-GUIDE
- [ ] Collect evidence (command outputs, logs, screenshots)
- [ ] Generate validation report
- [ ] Update task status to [T] if passed, [B] if failed

**If Validation Fails**:

- STOP orchestration
- Return to implementation phase (`/pr:task --continue`)
- Do not proceed to documentation

### Step 3: Execute Documentation Phase (Only if validation passed)

**Run Documentation Process** (from /pr:document):

- [ ] Process TODO tags and consolidate tasks
- [ ] Create fix documentation using templates
- [ ] Update pattern documentation
- [ ] Update project tracker (if --tracker enabled)
- [ ] Update task status to [x] (complete)

## Alternative Workflow

**For explicit phase control, use individual commands**:

```bash
# Implementation
/pr:task [Project] [TASK-ID] "description"

# Validation (can be run multiple times)
/pr:validate

# Documentation (only after validation passes)
/pr:document --tracker

# Or use orchestrator for complete workflow
/pr:complete --tracker
```

## Legacy Support

This orchestrator command maintains backward compatibility with existing workflows while enabling the new three-phase structure. For maximum control and iterative development, use the individual phase commands.

## Execution Reference

**Validation Phase**: See `/pr:validate` command documentation for detailed validation procedures

**Documentation Phase**: See `/pr:document` command documentation for detailed documentation procedures

## Success Criteria

**Complete Workflow Succeeds When**:

- All validation tests pass with documented evidence
- Task moves through status progression: [~]/[B] → [T] → [x]
- All documentation is created and project tracking updated
- No regressions introduced to existing functionality

**Failure Handling**:

- Validation failures stop orchestration at validation phase
- Documentation phase only executes after successful validation
- Clear status tracking shows exactly where workflow stopped

## Claude Code Integration

- Leverages orchestration across all three workflow phases
- Uses TodoWrite for tracking orchestration progress  
- Maintains comprehensive error handling and reporting
- Provides clear phase boundaries and status tracking

### MCP Servers

**Sequential** for workflow orchestration and complex validation scenarios

- Auto-activates: Multi-phase workflows, complex validation requirements
- Detection: Orchestration patterns, comprehensive testing needs

**Context7** and other servers activated as needed by individual phases

- Validation phase: Testing documentation and procedures
- Documentation phase: Pattern templates and documentation standards
