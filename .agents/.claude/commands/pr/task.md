---
allowed-tools: [Read, Write, Edit, MultiEdit, Glob, TodoWrite, Task]
description: "Implemet a task from a Project task tracker: [Project] [TASK-ID] \"description\""
---

# /pr:task - Task Implementation

## Purpose

Select and implement a task from the tasks tracker with appropriate implementation depth. **NEVER use emojis**

## Usage

``` command
/pr:task [Project] [TASK-ID] "description"
```

## Arguments

- `Project` - Project to be developed (optional)
- `TASK-ID` - TASK-ID in the Active Tasks Queue (optional)
- `description` - Description of untracked task

If /pr:validate --continue, Project and TASK-ID(s) carry over + skip to Step 3: Implementation Execution
If first command in sequence with no Project and no TASK-ID, request these values from the user
If first command in sequence with Project and TASK-ID, continue
If first command in sequence with Project and no TASK-ID, continue
If first command in sequence with no Project and with TASK-ID, continue

## TodoWrite

Add the following tasks to your todo list:

[ ] Step 1: Locate Project Files # (exclude if --continue)
[ ] Step 2: Task Allocation # (exclude if --continue)
[ ] Step 3: Implementation Execution
[ ] Step 4: Check the task status is [~|B|?|T], *NOT* [x]

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
4. **[~] In Progress Tasks**: Continue implementation of the in-progress task.
5. **[ ] Pending Tasks**: Available tasks by priority score
    - If no priority score(s), use the Priority formula to determine the task with the highest priority and add the priority values to the tasks detials
6. **Unclear Selection**: Find Strategic Roadmap and proceed to - Look for `<project>-roadmap.md` in `<Project>/dev/` folder
    - **Phase-Aware Selection**: Consider current roadmap phase (Foundation/Interface/Integration)
    - **Investigation Queue**: Tasks requiring analysis before implementation
    - **Discovered Issues**: Items from TODO tags during development

**Note**: If discovering new issues during selection process, create tasks following the Task Discovery Protocol in Step 3.

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

### Step 3: Implementation Execution

**Adaptive Implementation Approach**:

1. **Pattern Analysis**:
   - **FIND PATTERNS**: Search/grep pattern document for relevant guidance
   - If any [TASK-ID] or TODO markers referenced in task, search codebase for task context
   - Consider existing patterns before implementing new approaches

2. **TodoWrite Implementation Substeps**:
   - Add specific implementation steps as tasks underneath 'Step 3: Implementation Execution'
   - Break work into logical phases with validation checkpoints

3. **Implementation Strategy**:

   **For Simple Tasks (3-5 complexity points)**:
   - Apply direct fix resolving issues/implementing features
   - Verify compilation and basic functionality immediately
   - Focus on clear, straightforward solutions

   **For Complex Tasks (6+ complexity points)**:
   - **Root Cause Analysis**: Trace problems/requirements to source, understand why issue/need exists
   - **Solution Architecture**: Design fix/implementation considering alternative approaches
   - **Incremental Implementation**: Break into phases, maintain working state
   - **Comprehensive Analysis**: Consider architectural impacts and dependencies

4. **Knowledge Transfer Tags**: Add structured TASK-ID tags during implementation

5. **Escalation Protocol**:

   **Before Escalating - MANDATORY Solution Simplicity Check**:

   1. **Is this really an architectural problem or just refactoring?**
      - If existing code just needs to call different methods → **Simple Refactoring**
      - If fundamental design patterns conflict → **Architectural Issue**

   2. **Can the simplest solution work?**
      - Update calling code to match real APIs → **Simple refactoring (2-4 hours)**
      - Create adapter layers → **Probably over-engineering**
      - Rewrite entire components → **Definitely over-engineering**

   3. **Mock-to-Real Transition Checklist**:
      - [ ] Are the "mocks" actually just placeholder implementations?
      - [ ] Do real implementations already exist with working APIs?
      - [ ] Can I just update method calls to match real component APIs?
      - [ ] Are the differences just method names, parameters, or async patterns?
      - **If YES to all above** → This is **refactoring, not architecture**

   4. **The One-Sentence Test**:
      - If you can explain the fix in one sentence → probably **not architectural complexity**
      - If you need multiple sentences with "however" and "but also" → **Maybe architectural**

   **Common Over-Engineering Traps to Avoid**:
   - Treating method name changes as architectural incompatibility
   - Creating adapter layers when direct API calls would work  
   - Assuming different constructor parameters require complex dependency injection
   - Confusing "different method signatures" with "incompatible system designs"
   - Escalating async/sync differences (usually just add `await`)

   **Escalate Only If**: Fix takes >30 minutes to understand, requires >5 file changes, discovers additional broken components, needs architectural changes, uncovers security issues, AND simplicity check confirms complexity

   **Document Escalation**: Create escalation task with specific technical blockers and evidence that simple approach failed

**Implementation Verification**:

- [ ] **Build Compilation**: `npx tsc --noEmit` passes
- [ ] **Component Compilation**: Affected components compile without errors
- [ ] **No Major Regressions**: Existing functionality not obviously broken
- [ ] **TASK-ID Tags Applied**: Knowledge transfer tags added to implementation

**Task Discovery Protocol** (During Implementation):

When discovering new issues during implementation, add TODO tags:

```typescript
// TODO: [TASK-NEW-XXX] Description | Priority: High/Medium/Low | Phase: Foundation/Interface/Integration
// Complexity: 1-10 | Location: Context | Dependencies: List
```

**Task Status Update** (REQUIRED at implementation completion):

**When implementation is complete, update task status**:

1. **Mark Status**: Update task to appropriate status in `<project>-active-tasks.md`
2. **Run Validation**: Execute `/pr:validate` for comprehensive testing

**Implementation Status Options**:

Select from one of these three:

- **[~]** 'in-progress': Task implementation could not be completed in one session and remains ongoing
- **[B]** 'implemented-broken': Core logic done but compilation/tests failing
- **[?]** 'blocked': Cannot proceed due to dependencies or technical issues
- **[T]** 'implemented-testing': Compiles and ready for functional validation

**NEVER mark [x] completed** - completion only happens after documentation phase.

**Next Phase**: If [~] - Run `/pr:task --continue` for continued development
**Next Phase**: If [B] - Run `/pr:task --continue` to fix the broken task implementation
**Next Phase**: If [?] - Run `/pr:task` for the next task
**Next Phase**: If [T] - Run `/pr:validate` for comprehensive testing and validation of the current task

## Enhanced Selection Checklist

**Before proceeding with any issue**:

### Basic Requirements

- [ ] Issue selection assessment completed
- [ ] Implementation approach determined based on complexity

### Implementation Commitments

- [ ] **Compilation Responsibility**: Commit to maintaining TypeScript compilation for task scope
- [ ] **Regression Prevention**: Commit to preserving existing functionality  
- [ ] **Knowledge Transfer Tags**: Commit to adding structured TASK-ID tags for all implementations
- [ ] **Status Accuracy**: Commit to using status system accurately ([~] or [B] only)
- [ ] **Phase Separation**: Will run `/pr:validate` after implementation for comprehensive testing
- [ ] **Implementation Focus**: Task phase handles implementation only, validation and documentation in separate phases

### Knowledge Transfer Methodology

**After implementing any solution, add structured TASK-ID tags for knowledge transfer**:

```typescript
// TODO: [TASK-XYZ-001] Pattern: pattern-name | Complexity: N | Dependencies: dep1,dep2
// Context: Clear description of what was implemented and why
// Validation-Required: pattern-compliance, performance-baseline, error-handling
// Pattern-Info: { approach: "approach-used", alternatives: "considered", trade-offs: "made" }
```

**Tag Structure Requirements**:

- [ ] **Pattern Name**: Identify pattern used or create new pattern name if novel approach
- [ ] **Complexity Score**: Estimated complexity (1-10) for validation planning
- [ ] **Dependencies**: Components/services this implementation depends on
- [ ] **Context**: Business reason and technical approach taken
- [ ] **Validation Requirements**: What the pr:validate command should check
- [ ] **Pattern Information**: Detailed implementation approach for future pattern documentation

**Pattern Identification Guidelines**:

- **Use Existing Pattern**: If implementation matches existing pattern in `<project>-patterns.md`
- **Create New Pattern**: If implementation uses novel approach not documented in patterns
- **Pattern Naming**: Use kebab-case format (e.g., "backend-service-integration", "file-based-handoff-system")
- **Context Details**: Include business rationale, technical constraints, and design decisions

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

**Documentation Language Guidelines**:

Design vs Reality Distinctions:
    - "Designed to achieve..." (architectural intent)
    - "Measured at..." (empirical evidence)
    - "Validated through..." (specific verification method)
    - "Target of..." (goal, not achievement)

Evidence Requirements:
    - Quantitative Claims: Cite measurement methodology, sample size, timeframe
    - Qualitative Claims: Reference specific feedback sources, evaluation criteria
    - Comparative Claims: Show baseline, measurement method, confidence intervals
    - Success Claims: Define success criteria, show verification process

Qualifying Language:
    - "Framework established for..." (infrastructure ready)
    - "Preliminary results suggest..." (early indicators)
    - "Design targets..." (intended outcomes)
    - "Validation pending..." (measurement framework ready)

Red Flag Phrases to Avoid
    - Validated" without methodology
    - "Confirmed" without verification process
    - "Achieved" without measurement evidence
    - "Proven" without reproducible testing
    - "(✅)" checkmarks for unmeasured claims
