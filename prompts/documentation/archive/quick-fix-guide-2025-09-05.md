# Quick Fix Guide - Low Complexity Issue Resolution

> **Purpose**: Standalone guide for simple, quick fixes  
> **Scope**: Low complexity issues (compilation errors, simple missing implementations)  
> **Target Time**: <3 hours completion  
> **Template**: Streamlined Quick Fix documentation only

## TodoWrite

Add the following tasks to your todo list:

[ ] Step 1: Implement Fix
[ ] Step 2: Basic Implementation Verification
[ ] Step 3: Implementation Completion
[ ] -- 3.5: Select Status from [~|B|?]

## Autonomous Quick Fix Workflow

### Step 1: Implement Fix

1. **Search for patterns** - Find relevant information from the patterns doc
2. **Read component files** - Understand the specific errors
   - If any [TASK-ID] or TODO markers referenced in task, search codebase for this task's [TASK-ID]
3. **TodoWrite** - Add the implementation steps underneath Step 1
4. **Apply direct fix** - Resolve issues/implement feature/complete task
5. **Verify immediately** - Test compilation and basic functionality
6. **No complex investigation** - If root cause unclear, escalate

### Step 2: Implementation and Knowledge Transfer

**After implementing solution, add TASK-ID tag for knowledge transfer**:

```typescript
// TODO: [TASK-XYZ-001] Pattern: pattern-name | Complexity: N | Dependencies: dep1,dep2
// Context: Clear description of what was implemented and why
// Validation-Required: pattern-compliance, performance-baseline
// Pattern-Info: { approach: "approach-used", trade-offs: "made" }
```

**Tag Checklist**:

- [ ] Pattern name identified (existing or create new name)
- [ ] Complexity score (1-10) estimated  
- [ ] Implementation context documented
- [ ] Dependencies listed

**Basic Implementation Verification**:

- [ ] **Build Compilation**: `npx tsc --noEmit` - basic compilation check
- [ ] **Component Compilation**: Affected components compile without errors
- [ ] **No Major Regressions**: Existing functionality not obviously broken
- [ ] **TASK-ID Tag Applied**: Knowledge transfer tag added to implementation

### Step 3: Implementation Completion

**When implementation is complete**:

1. **Mark Status**: Update task to appropriate status [~|B|?] **NEVER ~~[x]~~**
2. **Run Validation**: Execute `/pr:validate` for comprehensive testing

**Implementation Status Options**:

Select from one of these three:
    - **[~]** 'in-progress': Active development work ongoing  
    - **[B]** 'broken-implemented': Core logic done but compilation/tests failing
    - **[?]** 'blocked': Cannot proceed due to dependencies or technical issues

**Next Phase**: Run `/pr:validate` to test functionality and collect evidence

## Task Discovery Protocols - TODO Tags (During implementation)

During implementation, add tags following the format for any future development task:

```typescript
// TODO: [TASK-NEW-XXX] Description | Priority: High/Medium/Low | Phase: Foundation/Interface/Integration
// Complexity: 1-10 | Location: Context | Dependencies: List
```

## Post-Implementation Workflow

**Implementation Complete**: Run `/pr:validate` for comprehensive testing and evidence collection.

**Validation Complete**: Run `/pr:document` for pattern documentation and project tracking.

**Documentation and validation are handled in separate phases to ensure quality and completeness.**

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
