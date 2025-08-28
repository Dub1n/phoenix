# Task Discovery Agent - Codebase Analysis and Task Creation

> **Purpose**: Autonomous codebase analysis for undocumented issues and task creation  
> **Entry Criteria**: Project with existing task management system  
> **Exit Criteria**: All discovered issues documented with appropriate markers and priorities  
> **Integration**: Works with existing *-active-tasks.md and workflow system

## ⚡ Autonomous Task Discovery Workflow

### When Given This Prompt

If you receive this task discovery prompt, follow this autonomous workflow to analyze the codebase and create new tasks for undocumented needed changes.

### Step 1: Locate Project Task Management System

**Priority Search Order**:

1. **Find Active Tasks Queue**: Look for `*-active-tasks.md` in project `/dev/` folder (PRIMARY INTEGRATION POINT)
2. **Find Patterns Document**: Look for `*-patterns.md` in project `/dev/` folder (PATTERN REFERENCE)
3. **Find Tracker Data**: Look for `*-tracker-data.md` in project `/dev/` folder (STATUS REFERENCE)
4. **Common locations**: `/dev/` folder (preferred), project root, `/docs/` folder

**Integration Validation**:

- Verify task management system uses marker syntax: `[ ]`, `[!]`, `[1-9]`, etc.
- Confirm pattern references exist: `See: patterns.md#pattern-name`
- Validate priority scoring system is in place

### Step 2: Comprehensive Codebase Analysis

#### A. TODO/FIXME Comment Discovery

**Search Patterns**:

```bash
# Comprehensive comment pattern search
grep -r "TODO\|FIXME\|HACK\|XXX\|BUG\|NOTE.*ISSUE" --include="*.ts" --include="*.js" --include="*.md" .
```

**Discovery Categories**:

- **TODO**: Implementation needed
- **FIXME**: Bugs or broken functionality  
- **HACK**: Temporary solutions needing proper implementation
- **XXX**: Critical issues requiring attention
- **BUG**: Confirmed defects
- **NOTE.*ISSUE**: Documented problems

#### B. Code Quality Analysis

**Automated Scans**:

1. **Dead Code Detection**:
   - Unused exports and imports
   - Unreferenced functions and classes
   - Commented-out code blocks

2. **Pattern Violations**:
   - Hardcoded values in configuration contexts
   - Direct coupling where abstraction expected
   - Missing error handling in critical paths

3. **Dependency Issues**:
   - Circular dependencies
   - Missing dependencies
   - Version conflicts in package.json

#### C. Architecture Compliance Audit

**Compliance Checks**:

- **Separation of Concerns**: Business logic in appropriate layers
- **Interface Adherence**: Components following defined interfaces
- **Testing Coverage**: Missing or inadequate test coverage
- **Documentation Gaps**: Missing or outdated documentation

### Step 3: Task Classification and Creation

#### A. Issue Categorization

**Category Mapping**:

- **Critical Issues** → Immediate Priority Queue
- **Architecture Violations** → Architecture Queue  
- **Implementation Gaps** → Investigation Queue
- **Quality Issues** → Verification Queue
- **Documentation Gaps** → Documentation Queue

#### B. Priority Scoring (Reference: shared-components.md)

**Priority Score Formula**:

> Priority Score = (Impact × 3) + (Feasibility × 2) + (Blocking Factor × 2)
> Maximum: 35 points

**Scoring Criteria**:

- **Impact (1-5)**: System impact level
- **Feasibility (1-5)**: Implementation difficulty
- **Blocking Factor (1-5)**: Dependency blocking level

#### C. Complexity Assessment (Reference: shared-components.md)

**Complexity Score Formula**:

> Complexity Score = (Files × 1) + (Dependencies × 2) + (Uncertainty × 3)
> Maximum: 35 points

### Step 4: Task Documentation with Markers

#### A. Task Entry Format

**Standard Task Template**:

```markdown
- [ ] **{Task Title}** [TASK-{ID}]
  - Priority: {score} | Complexity: {score} | Status: {description}
  - Pattern: {pattern-reference}
  - Dependencies: {dependency-list}
  - **Location**: {file-path:line-number}
  - **Discovery**: {discovery-method} | Found: {timestamp}
  - See: {patterns.md#pattern-reference}
```

#### B. Marker Placement in Source Code

**Marker Strategy**:

1. **Non-Intrusive Comments**: Add discovery markers as comments
2. **Link to Task**: Include task ID in comment for traceability
3. **Context Preservation**: Maintain existing code structure

**Marker Examples**:

```typescript
// TODO: TASK-NEW-025 - Implement real authentication integration
// DISCOVERED: 2025-08-27 via task-discovery-agent
// Pattern: authentication-integration-pattern
function authenticateUser(credentials: any): Promise<boolean> {
```

#### C. Evidence Documentation

**Evidence Requirements**:

- **File Location**: Exact file path and line numbers
- **Error Context**: Specific error messages or issues
- **Impact Analysis**: Affected components and workflows
- **Dependency Chain**: Related components requiring changes

### Step 5: Integration with Existing Workflow

#### A. Active Tasks Integration

**Integration Steps**:

1. **Append to Appropriate Queue**: Place tasks in correct priority queue
2. **Update Task Count**: Increment task count in document footer
3. **Cross-Reference Validation**: Ensure pattern references exist
4. **Priority Ordering**: Insert tasks in priority score order

#### B. Tracker Data Updates

**Tracker Integration**:

1. **Component Status Update**: Update component health status
2. **Issue Count Updates**: Increment discovered issue counts
3. **Evidence Links**: Add evidence links to tracker entries
4. **Discovery Source**: Document discovery method and timestamp

#### C. Pattern Documentation

**Pattern Integration**:

1. **Pattern Validation**: Verify referenced patterns exist
2. **New Pattern Creation**: Create patterns for recurring issues
3. **Pattern Cross-References**: Update pattern references in tasks
4. **Pattern Usage Tracking**: Track pattern application success

### Step 6: Quality Assurance and Validation

#### A. Task Validation Checklist

**Pre-Integration Validation**:

- [ ] All tasks have valid priority and complexity scores
- [ ] Pattern references exist in patterns document
- [ ] File locations and line numbers are accurate
- [ ] Dependencies are correctly identified
- [ ] No duplicate tasks created

#### B. Integration Testing

**Post-Integration Verification**:

- [ ] Task numbers are sequential and unique
- [ ] Cross-references between documents are valid
- [ ] Task count in footer matches actual count
- [ ] All pattern references resolve correctly
- [ ] Marker comments are properly formatted

#### C. Workflow Compatibility

**Compatibility Checks**:

- [ ] Tasks integrate with issue-fix-selector.md workflow
- [ ] Priority markers follow established conventions
- [ ] Complexity assessments align with fix guide expectations
- [ ] Documentation standards maintained

### Step 7: Integration Verification

**Post-Integration Checklist**:

- [ ] All discovered tasks integrated into active-tasks.md
- [ ] Task counts updated across all documents
- [ ] Pattern references validated and created as needed
- [ ] Tracker data updated with new component status
- [ ] Cross-references validated across document system

### Step 8: Continuous Discovery Recommendations

#### A. Scheduled Discovery

**Recommendations for Regular Execution**:

- **Weekly**: Run after major implementation sessions
- **Pre-Release**: Comprehensive discovery before releases
- **Post-Refactor**: Discovery after significant code changes
- **Phase Transitions**: Discovery at major project milestones

#### B. Integration with Development Workflow

**Workflow Integration Points**:

- **Post-Fix**: Run discovery after completing major fixes
- **Architecture Changes**: Mandatory discovery after architectural modifications
- **Code Reviews**: Include discovery in review process
- **Sprint Planning**: Discovery results inform sprint planning

---

## Error Handling and Edge Cases

### Incomplete Task Management System

- **Fallback**: Create minimal task structure if none exists
- **Bootstrap**: Initialize basic task management files
- **Integration**: Adapt to project-specific conventions

### Large Codebases

- **Batching**: Process files in manageable batches
- **Filtering**: Focus on recently changed files first
- **Prioritization**: Start with critical paths and core components
- **Incremental**: Support incremental discovery across sessions

### Pattern Conflicts

- **Resolution**: Identify conflicting patterns and consolidate
- **Documentation**: Document pattern evolution and decisions
- **Migration**: Provide migration paths for pattern changes
- **Validation**: Ensure pattern consistency across tasks

---

**Success Criteria**: All undocumented issues converted to trackable tasks with appropriate priorities, patterns, and integration with existing workflow system.
