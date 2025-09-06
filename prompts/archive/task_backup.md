---
allowed-tools: [Read, Write, Edit, MultiEdit, Glob, TodoWrite, Task]
description: "Implemet a task from a Project task tracker: [Project] [TASK-ID] \"description\""
---

# /pr:task - Task Implementation

## Purpose

Follow a fix-guide to select and implement a task from the tasks tracker and document implementation details. **NEVER use emojis**

## Usage

``` command
/pr:task [Project] [TASK-ID] "description"
```

## Arguments

- `Project` - Project to be developed (optional)
- `TASK-ID` - TASK-ID in the Active Tasks Queue (optional)
- `description` - Description of untracked task

If continuing from /pr:document --continue, Project and TASK-ID(s) carry over
If first command in sequence with no Project and no TASK-ID, request these values from the user
If first command in sequence with Project and TASK-ID, continue
If first command in sequence with Project and no TASK-ID, continue
If first command in sequence with no Project and with TASK-ID, continue

## TodoWrite

Add the following tasks to your todo list:

[ ] Step 1: Locate Project Files
[ ] Step 2: Task Allocation
[ ] Step 3: Route to Appropriate Implementation Guide

## Execution

### Step 1: Locate Project Files

**Priority Search Order**:

1. **Find Active Tasks Queue**: Look for `<project>-active-tasks.md` in `<Project>/dev/` folder (PRIMARY TASK SOURCE)
2. **Find Patterns Document**: Look for `*-patterns.md` in `<Project>/dev/` folder
    - **FIND PATTERNS**: Search/grep until you have exhausted the pattern document for relevant pattern information. You may have to try differnt wording or formatting, e.g. [templum-issue-pattern|Templum-Issue-Pattern|templum issue pattern|Templum Issue Pattern|Templum-Issue|templum-issue|Templum Issue|templum issue]
3. **Common locations**: `/dev/` folder (preferred), project root, `/docs/` folder

**File Validation**:

- **Planning file**: Must contain task queues (Immediate Priority, Investigation, Verification)
- **Active Tasks file**: Must contain component status and evidence data
- **Integration**: Both files should cross-reference each other

### Step 2a: Task from Description

If the user provides a task description, e.g. `/pr:task [Project] "I am getting the following error:..."`:

1. Create a new task in the relevant Active Tasks tracker following the guidelines below
2. Execute the rest of the pr:task steps from 3 onwards.

### Step 2b: Select from Planning Queues

If the user does not provide a task description:

**Primary Selection**:

1. **[TASK-ID]**: If a TASK-ID is provided, select the task with this [TASK-ID] after the name
    - If TASK-ID is provided and no Project is provided, locate the TASK-ID from ...-active-tasks.md(s) in repo
2. **[!] Priority Override**: User-specified tasks (do this next if no TASK-ID provided)
    - If multiple priority tasks present, select the one with the highest priority score
    - If no priority score(s), use the Priority formula to determine the task with the highest priority and add the priority values to the tasks detials
3. **[n] Sequenced Tasks**: Follow numerical sequence (do this next if no TASK-ID provided or Priority tasks)
4. **[ ] Pending Tasks**: Available tasks by priority score
    - If no priority score(s), use the Priority formula to determine the task with the highest priority and add the priority values to the tasks detials
5. **Unclear Selection**: Find Strategic Roadmap and proceed to - Look for `<project>-roadmap.md` in `<Project>/dev/` folder
    - **Phase-Aware Selection**: Consider current roadmap phase (Foundation/Interface/Integration)
    - **Investigation Queue**: Tasks requiring analysis before implementation
    - **Discovered Issues**: Items from TODO tags during development

**Note**: If discovering new issues during selection process, task creation guidance is provided in the fix guides:

- For complex issues → Use comprehensive-fix-guide.md Task Discovery Protocols
- For simple fixes → Use quick-fix-guide.md Task Discovery Protocols

**Fallback Selection** (if no planning file):

- **Broken** components with specific error counts
- **Critical Missing Components** with implementation gaps  
- **Mock-Dependent** components ready for real implementation
- Build errors with clear compilation failure counts

**Avoid These Issues**:

- Tasks without clear next actions or requirements
- Issues requiring architectural decisions without design context
- Components with complex dependency chains blocking implementation

``` Priority formula
Quick Priority = Impact + Feasibility + Blocking
Each factor: 1-5 points, Total: 3-15 points

Impact (1-5):
    - 5: Prevents build/core functionality
    - 3: Affects important features  
    - 1: Minor/cosmetic issues

Feasibility (1-5):
    - 5: Clear errors, obvious fix
    - 3: Some investigation needed
    - 1: Complex/unclear problem

Blocking (1-5):
    - 5: Blocks all development
    - 3: Blocks other components
    - 1: No blocking impact
```

### Step 3: Route to Appropriate Implementation Guide

**Low Complexity (3-5 points)**: READ `C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\quick-fix-guide.md`

- Simple fixes, clear solutions
- Expected implementation time: <3 hours
- Focus: Direct implementation with basic compilation verification
- **Next Phase**: Run `/pr:validate` after implementation

**Medium/High Complexity (6+ points)**: READ `C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\comprehensive-fix-guide.md`

- Complex fixes requiring detailed analysis
- Expected implementation time: >3 hours  
- Focus: Architectural analysis and systematic implementation
- **Next Phase**: Run `/pr:validate` after implementation

[!] **ROUTE BY INCLUDING THE APPROPRIATE GUIDE IN YOUR CONTEXT**:

``` bash
# For Low Complexity
Continue with quick-fix-guide.md for implementation guidance

# For Medium/High Complexity  
Continue with comprehensive-fix-guide.md for implementation guidance
```

**Important**: Fix guides now focus purely on implementation. Validation and documentation are handled in separate phases via `/pr:validate` and `/pr:document` commands.

## Enhanced Selection Checklist

**Before proceeding with any issue**:

### Basic Requirements

- [ ] Issue selection assessment completed
- [!] *Appropriate guide selected* !IMPORTANT
- [!] *Appropriate guide ADDED TO CONTEXT* !IMPORTANT

### Implementation Commitments

- [ ] **Compilation Responsibility**: Commit to maintaining TypeScript compilation for task scope
- [ ] **Regression Prevention**: Commit to preserving existing functionality  
- [ ] **TODO Documentation**: Commit to creating TODO tags for all discovered issues
- [ ] **Status Accuracy**: Commit to using status system accurately ([~] or [B] only)
- [ ] **Phase Separation**: Will run `/pr:validate` after implementation for testing

### Pre-Implementation Verification

- [ ] **Baseline Check**: Run `npx tsc --noEmit` to establish current compilation state
- [ ] **Build Check**: Verify current build process works (if applicable)
- [ ] **Functionality Check**: Verify existing functionality works as expected
- [ ] **Validation Planning**: Identify what validation will be required in next phase

## Claude Code Integration

- Leverages Read for analysis
- Uses Write, Edit, MultiEdit for implementation and documentation
- Applies TodoWrite and Task for task tracking
- Maintains comprehensive error handling and reporting

### MCP Servers

**Context7** for library documentation lookup
    - Auto-activates: External library imports, framework questions, patterns to be implemented not found in `<project>-patterns.md`
    - Detection: import/require/from/use statements, framework keywords
    - Workflow: resolve-library-id → get-library-docs → implement

**Sequential** for complex multi-step analysis
    - Auto-activates: Complex debugging, system design, --think flags
    - Detection: debug/trace/analyze keywords, nested conditionals, async chains

**Magic** for UI component generation
    - Auto-activates: UI component requests, design system queries
    - Detection: component/button/form keywords, JSX patterns, accessibility requirements

**Playwright** for cross-browser automation and E2E testing
    - Auto-activates: testing workflows, performance monitoring, QA work
    - Detection: test/e2e keywords, performance monitoring, visual testing, cross-browser requirements
