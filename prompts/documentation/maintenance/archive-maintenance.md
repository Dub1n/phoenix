# Archive Maintenance Agent - Task Lifecycle and Documentation Cleanup

> **Purpose**: Autonomous maintenance of completed tasks and stale documentation cleanup  
> **Entry Criteria**: Task management system with accumulated completed and stale tasks  
> **Exit Criteria**: Clean active system with properly archived historical data and extracted patterns  
> **Integration**: Maintains workflow efficiency while preserving valuable historical information

## ⚡ Autonomous Archive Maintenance Workflow

### When Given This Prompt

If you receive this archive maintenance prompt, follow this autonomous workflow to archive completed tasks, clean up stale documentation, and extract valuable patterns for future use.

### Step 1: Archive System Assessment

#### A. Locate Archive Management Files

**Priority Search Order**:

1. **Find Active Tasks**: Look for `*-active-tasks.md` in project `/dev/` folder
2. **Find Completed Archive**: Look for `*-completed.md` for existing archive structure
3. **Find Tracker Data**: Look for `*-tracker-data.md` for component completion history
4. **Find Patterns**: Look for `*-patterns.md` for pattern success tracking
5. **Find Fix Documentation**: Look for `dev/fixes/` folder for completed fix evidence

#### B. Archive Health Assessment

**Archive Status Evaluation**:

```markdown
## Archive Health Assessment - {Timestamp}

### Active System Health
- **Completed Tasks in Active**: {count} tasks marked [x] ready for archival
- **Cancelled Tasks**: {count} tasks marked [-] ready for archival  
- **Migrated Tasks**: {count} tasks marked [>] ready for archival
- **Stale Active Tasks**: {count} tasks with no activity >30 days

### Archive System Status
- **Existing Archive Size**: {count} archived tasks in completed.md
- **Archive Organization**: {organized/disorganized status}
- **Archive Accessibility**: {searchable/unsearchable status}
- **Historical Pattern Extraction**: {extracted/not-extracted status}

### Documentation Cleanup Needs
- **Orphaned Fix Documents**: {count} fix docs without corresponding tasks
- **Broken References**: {count} references to non-existent tasks/files
- **Outdated Evidence**: {count} evidence links pointing to outdated information
- **Obsolete Patterns**: {count} patterns no longer referenced or used
```

### Step 2: Completed Task Archival

#### A. Completion Verification

**Task Completion Validation**:

```markdown
## Completion Validation Criteria

### Required for Archival
- [ ] **Status Marker**: Task marked with [x] completion marker
- [ ] **Completion Evidence**: Fix documentation or implementation evidence exists
- [ ] **Success Validation**: Evidence shows task objectives were met
- [ ] **Integration Confirmation**: Changes integrated into main system
- [ ] **Quality Gate Passage**: All quality requirements satisfied

### Completion Categories
- **✅ Full Success**: All objectives met, evidence complete
- **🎯 Partial Success**: Core objectives met, some aspects incomplete
- **🔄 Superseded**: Task completed through different approach
- **📋 Merged**: Task completed as part of larger initiative
```

#### B. Success Pattern Extraction

**Pattern Extraction Process**:

```markdown
## Success Pattern Mining

### Extraction Categories
- **Implementation Patterns**: Successful technical approaches
- **Problem-Solving Patterns**: Effective diagnostic and resolution approaches  
- **Process Patterns**: Successful workflow and methodology patterns
- **Anti-Patterns**: Approaches that failed and should be avoided

### Pattern Documentation Template
```markdown
### {Pattern Name} - Extracted from TASK-{ID}
**Source**: {task-title} completed {date}
**Success Evidence**: {reference to fix documentation}
**Applicability**: {when to use this pattern}
**Implementation**: {key implementation details}
**Lessons Learned**: {insights from application}
**Related Tasks**: {other tasks that could benefit from this pattern}
```

#### C. Archive Entry Creation

**Archive Entry Template**:

```markdown
### TASK-{ID} - {Task Title} ✅ COMPLETED {Date}

**Original Priority**: {priority-score} | **Complexity**: {complexity-score}
**Completion Method**: {quick-fix|comprehensive-fix|merged|superseded}
**Fix Documentation**: `{link-to-fix-document}`
**Success Evidence**: {evidence-summary}

**Problem Solved**: {one-sentence problem description}
**Solution Applied**: {solution-summary}
**Pattern Used**: [{pattern-reference}]
**Time Investment**: {actual-time} (estimated: {estimated-time})

**Lessons Learned**:
- ✅ **Success Factors**: {what made this work}
- ⚠️ **Challenges**: {obstacles encountered and overcome}
- 🔄 **Process Insights**: {workflow or methodology insights}

**Reusable Components**:
- **Code Patterns**: {reference to reusable code patterns}
- **Implementation Approach**: {reference to implementation patterns}
- **Testing Strategy**: {reference to validation approaches}

**Related Tasks**: {links to related completed tasks}
**Enabled Tasks**: {tasks that became possible after this completion}
```

### Step 3: Stale Task Management

#### A. Stale Task Identification

**Staleness Criteria**:

```markdown
## Stale Task Classification

### Age-Based Staleness
- **30+ Days No Activity**: Tasks with no updates or progress
- **Phase Obsolescence**: Tasks from previous project phases no longer relevant
- **Priority Drift**: Tasks that have become low priority due to changed circumstances

### Relevance-Based Staleness
- **Superseded by Architecture**: Tasks obsoleted by architectural changes
- **Dependency Resolution**: Tasks no longer needed due to different solutions
- **Scope Changes**: Tasks outside current project scope
- **Technical Obsolescence**: Tasks addressing problems that no longer exist

### Process-Based Staleness
- **Blocked Tasks**: Tasks blocked by dependencies that won't be resolved
- **Resource Unavailable**: Tasks requiring unavailable resources or expertise
- **External Dependencies**: Tasks dependent on external factors beyond control
```

#### B. Stale Task Resolution Strategies

**Resolution Decision Matrix**:

```markdown
## Stale Task Resolution Strategies

### Action Categories
- **Archive as Incomplete**: Task valid but not pursued due to resource/priority constraints
- **Transform and Continue**: Update task scope/approach to make it relevant
- **Merge with Active Task**: Combine with current active task addressing similar issues
- **Convert to Future Consideration**: Move to future roadmap/backlog
- **Cancel with Documentation**: Cancel and document why for future reference

### Resolution Template
```markdown
### TASK-{ID} - {Task Title} 🔄 RESOLVED {Date}

**Resolution Action**: {archive|transform|merge|future|cancel}
**Resolution Rationale**: {explanation of why task became stale and resolution choice}

**Original Context**: {why task was created}
**Changed Circumstances**: {what changed to make task stale}
**Alternative Approaches**: {how problem is being addressed differently, if applicable}

**Extracted Value**: {any valuable insights or components from investigation}
**Future Applicability**: {conditions under which task might become relevant again}
```

### Step 4: Documentation Cleanup

#### A. Orphaned Document Management

**Orphaned Document Categories**:

```markdown
## Orphaned Documentation Identification

### Fix Documents Without Tasks
- **Completed Fixes**: Fix documents for tasks already archived
- **Abandoned Investigations**: Fix documents for cancelled investigations
- **Merged Work**: Fix documents for work merged into larger tasks

### Reference Integrity Issues  
- **Broken Task References**: Documents referencing non-existent tasks
- **Outdated File References**: Documents referencing moved/renamed files
- **Dead Pattern Links**: References to patterns that have been consolidated/removed
```

#### B. Document Consolidation and Cleanup

**Cleanup Process**:

```markdown
## Document Cleanup Workflow

### Evidence Consolidation
1. **Group Related Evidence**: Combine evidence from related fixes
2. **Extract Success Patterns**: Document successful approaches for reuse
3. **Preserve Failure Lessons**: Document what didn't work for future avoidance
4. **Update Reference Systems**: Ensure all references point to consolidated documentation

### Archive Organization
1. **Chronological Organization**: Organize completed tasks by completion date
2. **Thematic Grouping**: Group related completed tasks together
3. **Success Pattern Indexing**: Create index of successful patterns and approaches
4. **Search Optimization**: Add tags and keywords for easy searching
```

### Step 5: Pattern Library Maintenance

#### A. Pattern Success Analysis

**Pattern Effectiveness Evaluation**:

```markdown
## Pattern Success Analysis

### Usage Tracking
- **Application Count**: How many times pattern was successfully applied
- **Success Rate**: Percentage of successful applications vs. attempts  
- **Context Analysis**: In what situations pattern works best/worst
- **Evolution Tracking**: How pattern has improved over time

### Pattern Lifecycle Management
- **Experimental → Proven**: Patterns that have demonstrated success
- **Proven → Deprecated**: Patterns superseded by better approaches
- **Fragmented → Consolidated**: Multiple similar patterns merged
- **Complex → Simplified**: Patterns refined to simpler, more effective forms
```

#### B. Anti-Pattern Documentation

**Failure Pattern Extraction**:

```markdown
## Anti-Pattern Documentation

### Failed Approach Analysis
- **Common Failure Modes**: Patterns of approaches that consistently fail
- **Context Sensitivity**: Approaches that work in some contexts but fail in others
- **Resource Traps**: Approaches that consume excessive resources for minimal benefit
- **Complexity Traps**: Over-engineering patterns that create more problems than they solve

### Anti-Pattern Template
```markdown
### {Anti-Pattern Name} ⚠️ AVOID
**Identified From**: {failed tasks or approaches}
**Problem Intended to Solve**: {what this approach was meant to address}
**Why It Fails**: {specific reasons this approach is problematic}
**Better Alternatives**: [{links to successful patterns}]
**Warning Signs**: {how to recognize when falling into this anti-pattern}
```

#### C. Success-Story Documentation

**Success Pattern Report**:

```markdown
## Success Patterns Extracted - {Timestamp}

### Highly Successful Patterns
1. **{Pattern Name}**: {success-rate}% success rate, applied {count} times
   - **Key Success Factors**: {factors}
   - **Best Context**: {when-to-use}
   - **Implementation Guide**: {reference}

### Emerging Patterns
{Patterns showing promise but need more validation}

### Deprecated Patterns
{Patterns that have been superseded or proven ineffective}

### Anti-Patterns Identified
{Approaches that consistently fail and should be avoided}
```

### Step 6: Archive Organization and Accessibility

#### A. Archive Structure Design

**Archive Organization Schema**:

```markdown
# {Project} Completed Tasks Archive

## Archive Navigation
- [Completion Timeline](#completion-timeline)
- [Success Patterns Index](#success-patterns)
- [Component Completion History](#component-history)
- [Process Evolution](#process-evolution)
- [Lessons Learned Index](#lessons-learned)

## Completion Timeline
### {Year}-{Month}
{Chronologically organized completed tasks}

## Success Patterns Index  
{Cross-referenced successful patterns with task applications}

## Component Completion History
{Completion history organized by system component}

## Process Evolution
{Documentation of how development processes improved over time}

## Lessons Learned Index
{Searchable index of insights and lessons from completed work}
```

#### B. Search and Discovery Enhancement

**Accessibility Improvements**:

```markdown
## Archive Accessibility Enhancements

### Searchable Metadata
- **Task Tags**: Categorical tags for easy filtering
- **Component Tags**: System component associations
- **Pattern Tags**: Pattern usage and success indicators
- **Complexity Tags**: Complexity levels and approaches
- **Outcome Tags**: Success types and failure modes

### Cross-Reference System
- **Task Relationships**: Links between related completed tasks
- **Pattern Applications**: Links from patterns to successful applications
- **Component Evolution**: Links showing component development history
- **Process Improvements**: Links showing process evolution over time
```

### Step 7: Quality Assurance and Validation

#### A. Archive Integrity Validation

**Archive Quality Checklist**:

```markdown
## Archive Quality Validation

### Completeness Validation
- [ ] All completed tasks properly archived with evidence
- [ ] All success patterns extracted and documented
- [ ] All failure lessons captured and indexed
- [ ] All fix documentation properly linked and preserved

### Accuracy Validation
- [ ] Task completion evidence validated against actual implementation
- [ ] Pattern success claims validated against application evidence
- [ ] Historical information accurate and verifiable
- [ ] Cross-references validated and working

### Accessibility Validation
- [ ] Search functionality works effectively
- [ ] Navigation is intuitive and efficient
- [ ] Cross-references enhance understanding
- [ ] Information is well-organized and discoverable
```

#### B. Active System Health Check

**Post-Cleanup Validation**:

```markdown
## Active System Health Validation

### Task Management Health
- [ ] Active tasks file contains only genuinely active tasks
- [ ] Task priorities reflect current project state
- [ ] Dependencies are current and accurate
- [ ] Cross-references to patterns and evidence are valid

### Documentation Health
- [ ] No orphaned documents remain unreferenced
- [ ] All references point to existing, current documents
- [ ] Pattern library contains only actively used patterns
- [ ] Evidence links are current and accessible
```

### Step 8: Continuous Archive Maintenance

#### A. Archive Maintenance Scheduling

**Maintenance Frequency Recommendations**:

```markdown
## Archive Maintenance Schedule

### Weekly Light Maintenance
- **Task Archival**: Move completed tasks to archive
- **Reference Validation**: Check recent references for accuracy
- **Pattern Updates**: Update patterns with new applications

### Monthly Standard Maintenance  
- **Stale Task Review**: Evaluate and resolve stale tasks
- **Document Cleanup**: Consolidate and organize recent documentation
- **Pattern Analysis**: Analyze pattern effectiveness and evolution

### Quarterly Comprehensive Maintenance
- **Archive Organization**: Reorganize archive for improved accessibility
- **Pattern Library Overhaul**: Comprehensive pattern success analysis
- **Process Evolution Documentation**: Document process improvements
- **Historical Analysis**: Extract insights from completed work trends
```

#### B. Archive Evolution and Improvement

**Continuous Improvement Framework**:

```markdown
## Archive Evolution Strategy

### Learning Integration
- **Success Pattern Refinement**: Continuously improve patterns based on applications
- **Process Optimization**: Improve archive processes based on usage patterns
- **Access Pattern Analysis**: Optimize organization based on how archive is used
- **Knowledge Management**: Improve knowledge capture and retrieval

### Archive Enhancement
- **Search Improvements**: Enhance searchability based on user needs
- **Cross-Reference Expansion**: Add valuable connections between archived items
- **Pattern Extraction Automation**: Automate pattern extraction where possible
- **Quality Metrics**: Establish and track archive quality metrics
```

---

## Error Handling and Edge Cases

### Incomplete Archive Information

- **Best Effort Archival**: Archive with available information, mark gaps
- **Progressive Enhancement**: Improve archive entries as more information becomes available
- **Evidence Recovery**: Attempt to reconstruct evidence from available sources

### Large Archive Volumes

- **Batch Processing**: Process archives in manageable batches
- **Incremental Organization**: Improve organization incrementally over time
- **Automated Processing**: Use automation for routine archival tasks

### Complex Task Relationships

- **Relationship Mapping**: Explicitly map complex task relationships in archive
- **Context Preservation**: Preserve sufficient context for future understanding
- **Story Reconstruction**: Document the narrative of complex task sequences

---

**Success Criteria**: Active task management system contains only genuinely active tasks, all completed work is properly archived with extracted patterns, stale documentation is cleaned up, and valuable historical information is preserved and accessible for future reference and learning.
