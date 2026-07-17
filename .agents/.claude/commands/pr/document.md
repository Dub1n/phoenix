---
allowed-tools: [Read, Write, Edit, MultiEdit, Glob, TodoWrite, Task]
description: "Document validated task implementation with patterns and tracker updates"
---

# /pr:document - Task Documentation & Completion

## Purpose

Document validated task implementations, update patterns, and complete project tracking after successful validation.

## Usage

``` command
/pr:document [Project] [TASK-ID]
```

## Arguments

- `Project` - Project of the task to be documented (optional)
- `TASK-ID` - TASK-ID of the task to be documented (optional)

If continuing from /pr:validate with same Project and same TASK-ID, Project and TASK-ID(s) carry over
If continuing from /pr:validate with no Project or no TASK-ID, Project and TASK-ID(s) carry over
If continuing from /pr:validate with new Project or new TASK-ID, execute the command using the new value(s)
If first command in sequence with Project and TASK-ID, select the Project's TASK-ID task
If first command in sequence with no Project and no TASK-ID, request these values from the user
If first command in sequence with Project and no TASK-ID, select the first [D] documenting Task
If first command in sequence with no Project and with TASK-ID, located the TASK-ID from ...-active-tasks.md(s) in repo

## Prerequisites

- Task must be in [D] documenting status (validation passed)
- Validation evidence must exist from /pr:validate execution
  - look for <Project>/dev/validation/{TIMESTAMP}-{TASK-ID}.md
  - Timestamp is in YYYY-MM-DD-HHmm format
- All tests from TEMPLUM-TESTING-GUIDE must have passed

## Execution

> **Only execute steps or actions within steps that have not already been executed**

### Step 1: Prerequisite Validation

**Status Verification**:

- [ ] Confirm task is marked [D] in `<project>-active-tasks.md`
- [ ] Verify validation evidence exists (validation report or evidence files)
- [ ] Check that no code changes occurred since validation

**Evidence Review**:

- [ ] Review validation evidence for completeness
- [ ] Confirm all required tests passed
- [ ] Verify evidence meets TEMPLUM-TESTING-GUIDE standards

### Step 2: TODO Processing and Task Consolidation

#### Step 2a: Consolidation Analysis (REQUIRED FIRST)

```bash
- Search for related existing tasks: Use `Grep` tool with pattern matching in
`<project>-active-tasks.md`
- Search TODO discovery: Use `Grep` tool with pattern `TODO: \[TASK-{TASK-ID}` in project     
directory
- For tasks affecting other folders: Include `{folder}` path in Grep tool search
```

**APPEND to Existing Task When**:

- Same file(s) being modified (>70% overlap)
- Related functionality or domain area
- Similar implementation patterns required
- Combined complexity <50 points total
- Logical implementation sequence exists

**CREATE New Task When**:

- Different domains/expertise areas
- No file overlap (<30%)
- Combined complexity >50 points
- Independent implementation possible
- Different patterns or approaches needed

#### Step 2b: Task Processing

**TODO Discovery and Processing**:

- [ ] Search codebase using Grep tool:
  - Pattern: `"TODO: \[TASK-{TASK-ID}"`
  - Path: Project root directory
  - For cross-project tasks: Include `.claude` folder path
  - Output mode: content with line numbers- [ ] **Apply consolidation analysis** for each TODO found
- [ ] **If consolidatable**: Append using consolidation template below
- [ ] **If independent**: Consult `<project>-roadmap.md` for classification and add to active tasks
- [ ] Replace TODO tags with appropriate [TASK-ID] references

**Consolidation Implementation Template**:

**For Task Appendage**:

1. Update task title: `Original Task → Enhanced [Original + New] System`
2. Add to "Consolidated From": `+ NEW-DISCOVERY (complexity)`
3. Expand "Implementation Approach" with new steps
4. Update complexity score: `Original + New = Total`
5. Preserve all useful details from both sources

**Example**:

```markdown
- [TASK-CONSOLIDATED] **Enhanced Backend Integration System**
  - **Consolidated From**: TASK-ORIGINAL (12) + TASK-DISCOVERED (8)
  - **Implementation Approach**:
    1. Original functionality (steps 1-3)
    2. NEW: Additional service discovery (step 4)
    3. Enhanced validation (step 5)
  - **Complexity**: 20 (12+8)
```

**Consolidation Quality Gates**:

- [ ] Epic scope remains coherent
- [ ] Implementation sequence flows logically
- [ ] Total complexity reasonable (<50 points)
- [ ] All implementation details preserved

### Step 3: Fix Documentation Creation

#### Step 3a: Documentation Template

**Template Selection and command**:

```bash
# For quick fixes (complexity ≤10)
cp "C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\templates\quick-fix-template.md" "<Project>/dev/fixes/$(date +%Y-%m-%d-%H%M)-[{TASK-ID}]-{description}.md"

# For comprehensive fixes (complexity >10)
cp "C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\templates\comprehensive-fix-template.md" "<Project>/dev/fixes/$(date +%Y-%m-%d-%H%M)-[{TASK-ID}]-{description}.md"
```

#### Step 3b: Complete Fix Documentation

**Documentation Requirements**:

- [ ] **Validate Metadata**: Ensure all required frontmatter fields are completed
- [ ] **Fill Placeholders**: Replace all `[placeholder]` values with actual data
- [ ] **Include Validation Evidence**: Reference validation results and evidence
- [ ] **Implementation Details**: Document what was actually implemented
- [ ] **Delete Unused Sections**: Remove sections that don't apply to your specific fix

**Validation Evidence Integration**:

- [ ] Link to validation report or embed key evidence
- [ ] Include before/after comparisons where applicable
- [ ] Document any issues found during validation and their resolution
- [ ] Reference specific TEMPLUM-TESTING-GUIDE sections used

### Step 4: Pattern Documentation and TASK-ID Cleanup

#### Pattern Discovery from TASK-ID Tags

**Find Implementation Patterns**:

- [ ] **Use Grep tool to find TASK-ID tags**:
  - Pattern: `"TODO: \[{TASK-ID}\]"`
  - Path: Project directory (include .claude folder if applicable)
  - Output mode: content with line numbers
- [ ] **Extract Pattern Information**: From each tag, extract:
  - Pattern name used/created
  - Complexity and dependencies
  - Implementation context and approach
  - Validation requirements met

#### Pattern Creation and Enhancement Framework

**Decision Tree**: Pattern Discovery → Existing Similar? **YES** → ENHANCE existing | **NO** → Novel Approach? **YES** → CREATE new | **NO** → Document in fix only

**Enhanced Pattern Creation**: For novel patterns discovered in TASK-ID tags:

- [ ] **Create New Pattern**: If pattern doesn't exist in `<project>-patterns.md`
- [ ] **Document Implementation Approach**: Use Pattern-Info from TASK-ID tags
- [ ] **Add Cross-References**: Link pattern to task implementation

**Status**: IN DEVELOPMENT (<3 uses) | ESTABLISHED (3+ uses)
**Categories**: Foundation | Integration | Technical

#### Pattern Documentation Process

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

#### Implementation Feedback
- **[DATE] - [TASK-ID]**: {Implementation experience, adjustments, time taken}
```

#### Pattern Compliance Checklist

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

#### Pattern Application Feedback

**When Applying Existing Patterns**:

If you used an existing pattern from `<project>-patterns.md`, document the implementation experience:

1. **Navigate to the pattern's "Implementation Feedback" section**
2. **Add a new entry with format**:

   ``` markdown
   - **[DATE] - [TASK-ID]**: {Brief description of:
     - Any adjustments needed for this specific case
     - Unexpected issues encountered
     - Success metrics achieved
     - Time taken vs. estimate}
   ```

3. **If pattern required significant modification**:
   - Consider if this warrants pattern enhancement (3+ similar modifications)
   - Document variation in feedback for future consolidation

#### TASK-ID Tag Cleanup

**After pattern documentation is complete, clean up TASK-ID tags**:

- [ ] **Use Grep tool to relocate all TASK-ID tags**:
  - Pattern: `"TODO: \[{TASK-ID}\]"`
  - Path: Project directory (include .claude folder if applicable)
  - Confirm all pattern information has been transferred to documentation

- [ ] **Remove TASK-ID tags from code**:
  - [ ] **Validate Transfer**: Ensure all pattern information is captured in documentation
  - [ ] **Clean Code**: Remove the structured TASK-ID comment blocks
  - [ ] **Preserve Context**: Keep any essential inline comments (without TASK-ID structure)
  - [ ] **Verify Compilation**: Ensure code still compiles after tag removal

- [ ] **Quality Assurance**:
  - [ ] **Cross-reference Check**: Verify pattern documentation references are accurate
  - [ ] **No Information Loss**: Confirm all implementation context is preserved
  - [ ] **Clean Build**: Ensure project builds successfully after cleanup

### Step 5: Task Status Updates

**Status Progression**:

- [ ] Update task status from [D] to [x] in `<project>-active-tasks.md`
- [ ] Add ONE-LINE entry to `<project>-tracker-data.md` log: `Date | Component | x | fix-document.md`
- [ ] NO duplication: Details ONLY in fix document

**Task Status Log Entry Format**:

```markdown
[DATE] | [Component/Area] | [x] | [fix-document-filename.md]
```

### Step 6: Chain Completion & Roadmap Updates

**Chain Analysis**:

- [ ] Check if task completes entire dependency chain
- [ ] If chain complete AND no pending dependencies:
  - [ ] REMOVE entire chain from `<project>-active-tasks.md`
  - [ ] Update roadmap phase status if phase complete

**Roadmap Reassessment Check**:

- [ ] Were >3 new tasks added to one phase? → Consider phase restructuring
- [ ] Did user change task priorities with [!] or [1-9]? → Update roadmap focus
- [ ] Is an entire phase now complete? → Update phase status, activate next phase
- [ ] Do new tasks change critical dependencies? → Update roadmap dependency chains

### Step 7: Project Tracker Updates (Only if --tracker flag enabled)

**Update `<Project>/dev/<project>-tracker-data.md` with**:

- [ ] **Fix History Log**: Add line to top of the table in single line format
  - **Log Format**: Timestamp (YYYY-MM-DD-HHmm) | Task ID | Component | Status | Fix Document Title (excluding the date and TASK-ID)
- [ ] **Component Implementation Status**: Update all affected components
  - **Component Summary**: If a component was created or changed status, update relevant cell and totals
  - **Critical/High Priority Issues**: If a task was created or changed status to/from one of these, update the relevant table
  - **Working Components**: If the task resulted in a newly working componenet, add it to the table

### Step 8: Final Validation

**Documentation Completeness Check**:

- [ ] Fix document created and completed
- [ ] All placeholders replaced with actual values
- [ ] Validation evidence properly referenced
- [ ] Pattern documentation updated (if applicable)
- [ ] Task status updated to [x]
- [ ] Tracker updated

**Quality Gates**:

- [ ] Implementation evidence clearly documented
- [ ] Validation results properly referenced
- [ ] No unresolved TODO tags remain
- [ ] All cross-references are valid
- [ ] Documentation follows project conventions

## Success Criteria

**Documentation Completes When**:

- Fix document created using proper template and fully completed
- All validation evidence properly integrated and referenced
- Pattern documentation updated following consolidation framework
- Task status updated to [x] in active tasks
- Project tracker updated with completion metrics
- All cross-references and links validated
- No unresolved TODO tags or missing information

**Quality Standards**:

- **Comprehensive Evidence**: Validation results clearly documented with specific test outputs
- **Pattern Compliance**: All patterns properly documented and consolidated
- **Traceability**: Clear connection between implementation, validation, and documentation
- **Maintainability**: Future developers can understand and build upon the work
- **Project Integration**: All project systems updated consistently

## Claude Code Integration

- Leverages Read for template processing and pattern analysis
- Uses Write, Edit, MultiEdit for documentation creation and updates
- Applies TodoWrite for tracking documentation tasks
- Maintains comprehensive cross-reference validation

### MCP Servers

**Context7** for documentation patterns and best practices

- Auto-activates: Documentation format questions, pattern templates
- Detection: Documentation creation, pattern analysis

**Sequential** for complex documentation workflows

- Auto-activates: Multi-step documentation processes, pattern consolidation
- Detection: Complex documentation requirements, consolidation analysis
