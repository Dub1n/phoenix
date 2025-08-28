# Task Maintenance Agent - Active Tasks & Tracker Organization

> **Purpose**: Autonomous maintenance for active-tasks and tracker-data documents  
> **Entry Criteria**: Existing task management system with accumulated tasks  
> **Exit Criteria**: Cleaned, organized, and prioritized task management system  
> **Integration**: Preserves workflow integration while improving organization

## ⚡ Autonomous Task Maintenance Workflow

### When Given This Prompt

If you receive this task maintenance prompt, follow this autonomous workflow to consolidate, reorganize, and assign priorities to active-tasks and tracker-data documents.

### Step 1: System Assessment and Backup

#### A. Locate Task Management Files

**Priority Search Order**:

1. **Find Active Tasks**: Look for `*-active-tasks.md` in project `/dev/` folder
2. **Find Tracker Data**: Look for `*-tracker-data.md` in project `/dev/` folder  
3. **Find Completed Tasks**: Look for `*-completed.md` for archival context
4. **Find Patterns**: Look for `*-patterns.md` for pattern validation

#### B. Pre-Maintenance Assessment

**Document Health Check**:

- **Task Count Validation**: Count tasks vs. footer statistics
- **Cross-Reference Audit**: Validate all pattern and evidence links
- **Duplicate Detection**: Identify potential duplicate tasks
- **Stale Task Identification**: Flag tasks with no activity >30 days

**Assessment Report Template**:

```markdown
## Pre-Maintenance Assessment - {Timestamp}

**Active Tasks Document**:
- Total tasks: {count} (Footer reports: {footer-count})
- Duplicate candidates: {count}
- Stale tasks (>30 days): {count}
- Invalid pattern references: {count}
- Missing priority scores: {count}

**Tracker Data Document**:
- Component entries: {count}
- Outdated evidence links: {count}
- Status inconsistencies: {count}
- Missing integration data: {count}
```

### Step 2: Active Tasks Maintenance

#### A. Duplicate Task Consolidation

**Duplicate Detection Algorithm**:

```markdown
1. **Title Similarity**: >80% string similarity
2. **Location Match**: Same file/component references
3. **Pattern Match**: Same pattern references
4. **Description Overlap**: Similar task descriptions
```

**Consolidation Process**:

1. **Identify Duplicates**: Group similar tasks together
2. **Preserve Information**: Combine all unique information
3. **Maintain Highest Priority**: Keep highest priority/complexity scores
4. **Update References**: Update any cross-references to consolidated task
5. **Document Consolidation**: Add consolidation note to task history

**Consolidation Template**:

```markdown
- [ ] **{Consolidated Title}** [TASK-{PRIMARY-ID}] **CONSOLIDATED**
  - Priority: {highest-score} | Complexity: {highest-score} | Status: {most-current-status}
  - Pattern: {pattern-reference}
  - **Consolidated From**: [TASK-{ID-1}], [TASK-{ID-2}], [TASK-{ID-3}]
  - **Consolidation Date**: {timestamp}
  - See: {patterns.md#pattern-reference}
```

#### B. Priority Recalibration

**Priority Score Validation** (Reference: shared-components.md):

> Priority Score = (Impact × 3) + (Feasibility × 2) + (Blocking Factor × 2)

**Recalibration Criteria**:

- **Project Phase Changes**: Update priorities based on current phase
- **Dependency Resolution**: Lower priority for unblocked tasks
- **System Evolution**: Adjust for architectural changes
- **Resource Availability**: Consider current team capacity

**Priority Adjustment Process**:

1. **Review Current State**: Assess current project status
2. **Update Impact Scores**: Recalibrate based on current needs
3. **Update Feasibility**: Adjust based on team knowledge/resources
4. **Update Blocking**: Reassess blocking relationships
5. **Reorder Queues**: Sort tasks by new priority scores
6. **Document Changes**: Note priority adjustments with rationale

#### C. Queue Reorganization

**Queue Structure Validation**:

```markdown
## Standard Queue Organization
1. **Priority Queue** - [!] and [1-9] marked tasks
2. **Investigation Queue** - Analysis and research tasks
3. **Verification Queue** - Testing and validation tasks  
4. **Architecture Queue** - System design tasks
5. **Discovered Issues** - TODO/FIXME derived tasks
6. **Realignment Queue** - Compliance and cleanup tasks
```

**Reorganization Process**:

1. **Queue Assignment Audit**: Verify tasks in correct queues
2. **Dependency Ordering**: Order tasks by dependency chains
3. **Priority Ordering**: Within queues, order by priority score
4. **Phase Alignment**: Align with current project phase priorities
5. **Capacity Balancing**: Distribute tasks for realistic completion

#### D. Status Marker Cleanup

**Status Marker Audit**:

- **Completed Tasks**: Move `[x]` tasks to completed document
- **Cancelled Tasks**: Archive `[-]` tasks with notes
- **Blocked Tasks**: Validate `[?]` blocking conditions still exist
- **In Progress**: Verify `[~]` tasks are actually active
- **Migrated Tasks**: Validate `[>]` forwarding destinations

### Step 3: Tracker Data Maintenance

#### A. Component Status Reconciliation

**Status Validation Process**:

1. **Evidence Link Verification**: Check all evidence links are valid
2. **Component Health Updates**: Update health based on recent fixes
3. **Integration Status Audit**: Verify integration reality claims
4. **Compilation Error Counts**: Validate error counts are current

**Component Status Categories**:

- **🟢 Working**: All functionality operational with evidence
- **🟡 Partial**: Some functionality working, issues documented
- **🔴 Broken**: Non-functional with specific error evidence
- **⚠️ Mock/Placeholder**: Simulated functionality noted

#### B. Evidence Quality Assurance

**Evidence Validation Checklist**:

- [ ] **File References**: All file paths exist and are current
- [ ] **Error Counts**: Compilation errors match current state
- [ ] **Fix Documentation**: All fix document links are valid
- [ ] **Integration Claims**: Integration status is evidence-based
- [ ] **Test Results**: Test evidence is current and relevant

**Evidence Update Process**:

1. **Validate Links**: Check all evidence links resolve
2. **Update Counts**: Refresh error counts and metrics
3. **Verify Claims**: Ensure integration status claims are accurate
4. **Document Sources**: Add evidence sources and timestamps
5. **Flag Stale Data**: Mark outdated evidence for refresh

#### C. Component Health Dashboard Update

**Dashboard Metrics Recalculation**:

```markdown
## Component Summary Recalculation
| Category | Total | Working | Broken | Missing | Placeholder |
|----------|-------|---------|--------|---------|-------------|
| {category} | {total} | {working} | {broken} | {missing} | {placeholder} |
```

**Health Metric Updates**:

- **Build Status**: Update compilation error progression
- **Component Health**: Recalculate functional/broken ratios
- **Fix Progress**: Update completed fix counts and trends
- **Priority Issues**: Refresh critical issue identification

### Step 4: Cross-Document Synchronization

#### A. Reference Validation and Updates

**Cross-Reference Audit**:

1. **Pattern References**: Verify all `See: patterns.md#pattern` links
2. **Task Cross-References**: Validate task ID references
3. **Evidence Links**: Check fix document and file references
4. **Queue References**: Ensure queue names match between documents

**Synchronization Process**:

1. **Update Task Counts**: Sync task counts across all documents
2. **Update Status Summaries**: Align status reports between documents  
3. **Update Roadmap Progress**: Reflect task completion in roadmap
4. **Update Component Status**: Sync component health across documents

#### B. Consistency Enforcement

**Consistency Checks**:

- **Task ID Uniqueness**: Ensure no duplicate task IDs
- **Priority Score Ranges**: Validate all scores within expected ranges
- **Status Marker Standards**: Ensure consistent marker usage
- **Pattern Name Consistency**: Standardize pattern naming
- **Date Format Consistency**: Standardize all timestamp formats

### Step 5: Archive Management

#### A. Completed Task Archival

**Archival Criteria**:

- **Completed Tasks**: `[x]` marked tasks with completion dates
- **Cancelled Tasks**: `[-]` marked tasks with cancellation rationale
- **Migrated Tasks**: `[>]` tasks successfully forwarded

**Archival Process**:

1. **Extract Completed**: Move completed tasks to *-completed.md
2. **Preserve Context**: Maintain task history and outcomes
3. **Update References**: Remove archived tasks from active counts
4. **Cross-Reference Updates**: Update any references to archived tasks
5. **Success Pattern Extraction**: Extract successful patterns for reuse

#### B. Stale Task Management

**Stale Task Identification**:

- **No Activity**: Tasks with no updates >30 days
- **No Dependencies Met**: Blocked tasks with no progress on blockers
- **Phase Obsolescence**: Tasks no longer relevant to current phase
- **Technical Obsolescence**: Tasks superseded by architectural changes

**Stale Task Processing**:

1. **Relevance Assessment**: Evaluate if task still relevant
2. **Dependency Review**: Check if blockers resolved
3. **Scope Validation**: Confirm task scope still applicable
4. **Action Decision**: Keep, modify, migrate, or cancel
5. **Documentation**: Document decision rationale

### Step 6: Quality Gates and Validation

#### A. Post-Maintenance Validation

**Validation Checklist**:

- [ ] **Task Count Accuracy**: Footer counts match actual task counts
- [ ] **Reference Validity**: All cross-references resolve correctly
- [ ] **Priority Ordering**: Tasks properly ordered by priority within queues
- [ ] **Status Consistency**: Status markers consistent across documents
- [ ] **Pattern References**: All pattern references exist and are valid
- [ ] **Evidence Currency**: Evidence links are current and accessible

#### B. Workflow Integration Testing

**Integration Tests**:

- [ ] **Selector Compatibility**: Tasks compatible with issue-fix-selector.md
- [ ] **Fix Guide Integration**: Tasks integrate with quick/comprehensive guides
- [ ] **Pattern Integration**: Pattern references align with patterns document
- [ ] **Tracker Synchronization**: Active tasks and tracker data are synchronized

### Step 7: Action Items and Follow-up

**Follow-up Tasks**:

- **Pattern Updates**: Create/update patterns based on task consolidation
- **Workflow Improvements**: Recommendations for workflow enhancement
- **Monitoring**: Set up monitoring for task management health
- **Training**: Documentation of maintenance procedures for future use

### Step 8: Continuous Improvement Recommendations

#### A. Maintenance Scheduling

**Recommended Maintenance Frequency**:

- **Weekly Light Maintenance**: Basic cleanup and priority validation
- **Bi-weekly Standard Maintenance**: Full consolidation and organization
- **Monthly Comprehensive Maintenance**: Deep analysis and archival
- **Phase Transition Maintenance**: Major cleanup at project milestones

#### B. System Evolution Recommendations

**Process Improvements**:

- **Automation Opportunities**: Identify tasks suitable for automation
- **Workflow Optimization**: Recommendations for workflow improvements
- **Quality Metrics**: Establish metrics for task management health
- **Tool Integration**: Suggest tools for task management enhancement

---

## Error Handling and Edge Cases

### Conflicting Information

- **Priority Conflicts**: Use most recent evidence-based assessment
- **Status Conflicts**: Validate against actual implementation state
- **Reference Conflicts**: Verify and correct based on source authority

### Large Task Volumes

- **Batching**: Process tasks in manageable batches
- **Prioritization**: Focus on highest impact tasks first
- **Incremental**: Support incremental maintenance across sessions

### System Inconsistencies

- **Recovery**: Rebuild consistency from most authoritative sources
- **Validation**: Extensive validation before finalizing changes
- **Backup**: Maintain backups during maintenance operations

---

**Success Criteria**: Task management system is organized, deduplicated, properly prioritized, and fully synchronized across all documents with valid cross-references and current evidence.
