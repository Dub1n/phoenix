# Quick Fix Guide - Low Complexity Issue Resolution

> **Purpose**: Standalone guide for simple, quick fixes  
> **Scope**: Low complexity issues (compilation errors, simple missing implementations)  
> **Target Time**: <3 hours completion  
> **Template**: Streamlined Quick Fix documentation only

## Autonomous Quick Fix Workflow

### Step 1: Implement Fix

1. **Search for patterns** - Find relevant information from the patterns doc
2. **Read component files** - Understand the specific errors
   - If any [TASK-ID] or TODO markers referenced in task, search codebase for this task's [TASK-ID]
3. **Apply direct fix** - Resolve compilation/import issues
4. **Verify immediately** - Test compilation and basic functionality
5. **No complex investigation** - If root cause unclear, escalate

### Step 2: Working State Principle

#### Enhanced Task Status Definitions

**Expanded Status Options**:

- **[x]** 'completed': Fully working, tested, and validated (compilation passes, no regressions)
- **[B]** 'broken-implemented': Core logic done but compilation/tests failing (requires structural fix)
- **[T]** 'iplemented-testing':Compiles but needs functional validation
- **[?]** 'blocked': Cannot proceed due to dependencies or technical issues
- **[~]** 'in-progress': Active development work ongoing

#### Pre-Completion Validation Checklist - MANDATORY

**Before marking ANY task as "completed", ALL must pass**:

- [ ] **Build Compilation Gate**: `npx tsc --noEmit` - *SHOULD PASS* for full build
- [ ] **Component Compilation Gate**: `npx tsc --noEmit --include <path/to/affected/component>` - *MUST PASS* for component(s) within task scope
- [ ] **Build Verification**: `npm run build` - *SHOULD SUCCEED* for full build
- [ ] **Component Verification**: `npm run build -- <path/to/affected/component>` - *MUST SUCCEED* for component(s) within task scope
- [ ] **Validation** 'node C:/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/validation/verify-fix.js <component-name>' - *MUST PASS* for component(s) within task scope
- [ ] **Lint Check**: `npm run lint` - *SHOULD PASS* (document if exceptions needed)
- [ ] **Test Regression**: Previously passing tests still pass - *MUST VERIFY*
- [ ] **End-to-End Scenario Test**: Execute exact user scenario described in task → Document working evidence - *MUST PASS*
- [ ] **Live System Integration**: Test with actual running components → Verify real data flow/events - *MUST PASS*  
- [ ] **User Acceptance Validation**: Original problem solved → Before/after demonstration - *MUST PASS*
- [ ] **Integration Check**: No broken dependencies or imports → Test actual component communication - *MUST VERIFY*

#### Enhanced End-to-End Testing Requirements

**Mandatory E2E Testing by Task Type**:

**File Watching/Discovery Tasks**:

- [ ] Start system → Create/modify/delete watched files → Verify events trigger in logs
- [ ] Demonstrate real-time detection with actual file system operations and evidence

**Service Discovery/Connection Tasks**:

- [ ] Start discovery system → Launch new service → Verify automatic detection within timeframe
- [ ] Show service appears in connected services list with working health checks

**CLI Enhancement Tasks**:

- [ ] Run CLI → Execute new commands/features → Verify expected behavior with output
- [ ] Demonstrate improved user workflow from start to finish

**Backend Integration Tasks**:

- [ ] Start backend → Connect frontend → Verify data flow and actual communication
- [ ] Show actual API calls, responses, and state synchronization working

**Evidence Requirements for All E2E Tests**:

- [ ] **Command Output**: Copy actual terminal output showing working functionality
- [ ] **Log Evidence**: Include relevant log entries proving events/actions occurred  
- [ ] **State Changes**: Document before/after system state demonstrating impact
- [ ] **User Workflow**: Show complete user scenario working end-to-end

**If you cannot fix these issues during implementation**:

1. **Document the implementation attempt** in detail
2. **Mark task as "[B]"** not "[x]"
3. **Create a structural fix task** for the compilation/build issues
4. **Clearly explain technical blockers** preventing completion

#### Emergency Protocol for Broken State

**If implementation leaves system in broken state**:

1. **IMMEDIATE**: Document current state and specific errors
2. **ASSESS**: Can structural issues be fixed within current session?
   - **YES**: Fix immediately as part of current task
   - **NO**: Mark as "implemented-broken" with clear blockers
3. **DOCUMENT**: Create detailed fix document (see fix-guide for Fix Documentaton Template) explaining:
   - What was successfully implemented (functional aspects)
   - What structural issues remain (compilation, build, test failures)
   - Specific steps needed for structural repair
4. **TRACK**: Update task status appropriately - never mark broken code as completed ("[x]")

## Task Discovery Protocols - TODO Tags (During implementation)

```typescript
// TODO: [TASK-NEW-XXX] Description | Priority: High/Medium/Low | Phase: Foundation/Interface/Integration
// Complexity: 1-10 | Location: Context | Dependencies: List
```

## Documentation Protocol

### Post-Implementation Documentation

- [ ] Search for TODO tags: `grep -r "TODO: \[TASK-" .`
- [ ] **Apply consolidation criteria below** for each TODO
- [ ] Use `<project>-roadmap.md` for classification if creating new tasks
- [ ] Update appropriate tasks (consolidated or new) in active-tasks.md
- [ ] Update active task status to [x] in active tasks queue
- [ ] Add ONE-LINE entry to `<project>-tracker-data.md` log
- [ ] Create detailed fix document in `dev/fixes/` folder
- [ ] Extract reusable patterns to `<project>-patterns.md` - see Patterns Documentation

### Task Documentation

#### Step 1: Consolidated Check

```bash
# Search for related existing tasks
grep -i "[component|domain|functionality]" *-active-tasks.md
```

**APPEND to Existing Task When**:
    - Same file(s) being modified
    - Related functional domain
    - Combined effort <30 points (quick fix limit)
    - Logical implementation sequence

**CREATE New Task When**:
    - Different expertise required
    - No file overlap
    - Combined complexity >30 points
    - Independent implementation

#### Step 2a: Task Creation

If task is not to be consolidated following the consolidation check, create a new task in the appropriate section
    - If essential prerequesite for any priority or sequenced task, mark as priorty ("[!]")

**Example**:

```markdown
- [ ] **<Short_Description>** [TASK_ID]
  - Priority: <p> | Complexity: <c> | Status: <errors>
  - Dependencies: <dependencies>
  - Implementation Approach: <steps>
  - Location: path/to/file <line_of_TODO_tag>
  - See: <project>-patterns.md#<relevant_pattern(s)>
```

#### Step 2b: Task Consolidation

**For Task Appendage**:

1. Update task title: `Original Task → Enhanced [Original + New] System`
2. Add to "Consolidated From": `+ NEW-DISCOVERY (complexity)`
3. Expand "Implementation Approach" with new steps
4. Update complexity score: `Original + New = Total`
5. Preserve all useful details from both sources
6. Include locations of TODO tags in code
7. If essential prerequesite for any priority or sequenced tasks, mark as priorty ("[!]")

**Example**:

```markdown
- **<short_description>** [TASK_C_<ID>]
  - Priority: <p> | Complexity: <c1+c2> (<c1>+<c2>) | Status: <errors>
  - Consolidated From: TASK-ORIGINAL + TASK-DISCOVERED
  - Implementation Approach:
    1. Original functionality (step(s) <n-n>)
    2. NEW: Additional requirements (step(s) <n-n>)
    3. Enhanced validation (step <n>)
  - Location: path/to/file <line_of_TODO_tag>
  - See: <project>-patterns.md#<relevant_pattern(s)>
```

#### Step 3: TODO relabel

If any TODO tags were added during implementation and now are referenced in a task, replace the TODO tag(s) in the marker(s) with the [TASK-ID] of the task that references it.

### Status Update

- Update task marker: `[ ]` → `[x]` in `templum-active-tasks.md`
- Tracker log entry: `Date | Component | x | dev/fixes/fix-document.md`
- NO duplication: Details go ONLY in fix document, not tracker-data.md

### Chain Completion & Roadmap Update Protocol

- [ ] Check if completed task finishes entire dependency chain
- [ ] If chain complete AND no other dependencies: REMOVE chain from active tasks
- [ ] Check if phase complete → Update `templum-roadmap.md` phase status
- [ ] Check if new tasks affect phase balance → Consider roadmap updates

### Update Project Dashboard

**After all implementation, validation, and documentation is complete**:

Update `project/dev/*-tracker-data.md` with:

- [ ] **Fix History Log**: Add single-line entry with date, component, and fix document link
- [ ] **Component Status**: Update status if component moved from broken to working  
- [ ] **Build Status**: Update error count if compilation errors were resolved
- [ ] **Quick Status Dashboard**: Update component counts and percentages if appropriate
- [ ] **Fix Success Metrics**: Update success rates if this represents a significant milestone

**Dashboard Update Guidelines**:

- Only update after fix is fully complete and validated
- Keep updates concise - detailed information stays in fix documents
- This provides user visibility into project health trends
- **Note**: Dashboard is for user monitoring only - not part of task selection workflow

## Quick Fix Documentation

1. **COPY**: `cp "C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\templates\quick-fix-template.md" "<Project>/dev/fixes/{date}-[{TASK-ID}]-{description}.md"`
    - [!] *DO NOT WRITE FROM SCRATCH*
2. **Validate Metadata**: Ensure all required frontmatter fields are completed
3. **Fill Placeholders**: Replace all `[placeholder]` values with actual data
4. **Delete Unused Sections**: Remove sections that don't apply to your specific fix

**NOTE**: USE THE BASH COMMAND TO COPY THE TEMPLATE
**NOTE**: DO NOT WRITE THE FIX DOCUMENT WITHOUT IT

## Pattern Documentation

### Pattern Consolidation Framework

**Decision Tree**: Pattern Discovery → Existing Similar? **YES** → ENHANCE existing | **NO** → 3+ Use Cases? **YES** → CREATE new | **NO** → Document in fix only

**Status**: IN DEVELOPMENT (<3 uses) | ESTABLISHED (3+ uses)
**Categories**: Foundation | Integration | Technical

### Pattern Documentation Process

**Required Analysis**:

```markdown
## Pattern Consolidation Analysis
**Existing Pattern Search**: [Results from <project>-patterns.md]
**Decision**: [ENHANCE existing | CREATE new | DOCUMENT in fix only]  
**Usage Projection**: [3+ scenarios required for new patterns]
```

**Enhanced Pattern Template** (when justified):

```markdown
### {Pattern Name}
**Status**: IN DEVELOPMENT | **Category**: Foundation|Integration|Technical
**Difficulty**: 🟢🟡🟠🔴 | **Time**: ~X hours
**Problem**: {one-sentence problem}
**Solution**: {concise solution}
**Implementation**: {essential examples}
```

### Pattern Compliance Checklist

**Architecture Verification**:

- [ ] Data Processing: Follow project conventions
- [ ] Error Handling: Use consistent project patterns  
- [ ] Type System: Integrate with project type foundations
- [ ] Interface Alignment: Match established patterns
- [ ] Async Operations: Follow established error handling

**Consolidation Compliance**:

- [ ] Searched existing patterns before creating new
- [ ] Enhanced existing rather than duplicating
- [ ] Updated bidirectional references and usage tracking
- [ ] Applied difficulty classification (🟢🟡🟠🔴)
- [ ] Maintained reference integrity

**Documentation Updates**:

- [ ] `<project>-patterns.md` - Enhanced/added following template
- [ ] Pattern index - Updated usage frequency indicators
- [ ] Cross-references - Updated "Used By Active Tasks"

## When to Escalate

**Escalate to comprehensive-fix-guide.md if**:

- Fix takes >30 minutes to understand
- Requires changes to >5 files
- Discovers additional broken components  
- Needs architectural changes
- Uncovers security issues
- Creates >3 TODO tags during implementation
- Discovers architectural issues requiring roadmap consultation

**Escalation process**:

1. Document all TODO tags found during investigation
2. Add escalation task to `templum-active-tasks.md` with [!] priority marker
3. Note escalation reason in task description
4. Switch to `comprehensive-fix-guide.md`

## Success Criteria

**A successful quick fix**:

- Resolves all identified compilation errors
- **Passes end-to-end scenario testing with documented evidence** ← ENHANCED REQUIREMENT
- **Demonstrates working functionality in practice** ← ENHANCED REQUIREMENT  
- Takes <3 hours total time
- Requires no architectural changes
- Introduces no new errors or regressions
- Updates tracker status accurately
- **Follows pattern consolidation framework**

**Quality standards**:

- Clean TypeScript compilation
- Basic functionality verified
- Tracker integration complete
- Documentation follows template
- **Pattern documentation maintained** (enhancement over addition)

## Quick Reference Links

**For detailed scoring**: See `shared-components.md`
**For complex fixes**: Use `comprehensive-fix-guide.md`  
**For tracker structure**: See `tracker-template.md`

---
**Template Type**: Quick Fix Guide  
**Context**: Minimal for fast execution  
**Integration**: Standalone with optional tracker integration
