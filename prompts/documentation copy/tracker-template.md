# Dual-File Tracker Template - Generation & Maintenance Guide

> **Purpose**: Instructions for creating and maintaining dual-file tracking systems  
> **Scope**: Two-file tracker generation, templates, integration, and maintenance  
> **Usage**: Reference when creating new trackers or migrating single-file systems  
> **Integration**: Designed for seamless fix documentation workflow with planning separation

## 🔄 Two-File System Overview

### System Architecture

The dual-file tracker system separates concerns between **status tracking** and **work planning**:

- **Tracker Data File** (`[project-name]-tracker-data.md`): Historical records, current status, evidence, and metrics
- **Planning File** (`[project-name]-fix-planning.md`): Work queues, task organization, and actionable next steps

### Key Benefits

- **Clear Separation**: Status tracking vs. actionable planning
- **Reduced Confusion**: Agents know whether to record status or plan work
- **Better Maintenance**: Planning can change frequently without affecting historical data
- **Enhanced Integration**: Each file optimized for its specific purpose in the workflow

### When to Use This System

- **Complex Projects**: 20+ components or multi-phase development
- **Team Collaboration**: Multiple agents working on different aspects
- **Long-term Tracking**: Projects spanning weeks or months
- **Evidence-based Development**: Requiring comprehensive status documentation

## 📋 Project File Structure

### Recommended File Organization

**Tracker Data**: `project/dev/[project-name]-tracker-data.md` (status and evidence)  
**Fix Planning**: `project/dev/[project-name]-fix-planning.md` (task organization)  
**Fix Documents**: `project/dev/fixes/` (completed fix documentation)  
**Validation Scripts**: `scripts/validation/` (shared across projects)

**Separation principle**: Data tracking vs. work planning vs. templates (this file)

### File Content Organization

#### Tracker Data File Sections (in order)

1. **Header & Metadata** - Project info, creation date, integration references
2. **Quick Status Dashboard** - At-a-glance health metrics and current state
3. **Component Status Tables** - Detailed implementation status with evidence
4. **Build Issues Log** - Historical record of discovered problems
5. **Fix Success Metrics Dashboard** - Performance tracking and success rates
6. **Lessons Learned** - Knowledge capture for future development
7. **Evidence Archive** - Verification records and agent performance data

#### Planning File Sections (in order)

1. **Header & Integration Info** - Purpose, data source references, integration points
2. **Immediate Priority Queue** - Ready-to-implement tasks with full context
3. **Investigation Queue** - Tasks requiring analysis before implementation
4. **Verification Queue** - Items needing validation or testing
5. **Architecture & Technical Debt Queue** - System-level design work
6. **Queue Management Guidelines** - Usage rules and update protocols

### Integration Flow

``` diagram
Tracker Data ←→ Planning File ←→ Fix Guides ←→ Completed Fixes → Tracker Data
     ↑                                                              ↓
     Status Updates                                        Evidence & Metrics
```

## 🎯 Tracker Data File Templates

### 1. Tracker Data Header Template

```markdown
# [Project Name] Implementation Tracker Data

> **Purpose**: Track actual implementation status vs claimed status for [project description]  
> **Created**: [YYYY-MM-DD]  
> **Last Updated**: [YYYY-MM-DD] (update with every change)  
> **Status**: [Current overall project status]  
> **Integration**: Uses [issue-fix-selector.md | quick-fix-guide.md | comprehensive-fix-guide.md]  
> **Planning**: See [project-name]-fix-planning.md for task queues and work organization
```

### 2. Quick Status Dashboard Template

```markdown
## Quick Status Dashboard

- **Build Status**: [🔴 Failing | 🟡 Issues | 🟢 Success] - [Brief description with error counts]
- **Component Health**: [🔴 X/Y Missing | 🟡 X/Y Partial | 🟢 X/Y Working] - [Overall health summary]
- **Fix Progress**: [X fixes completed this period, Y in progress, Z planned]
- **Priority Issues**: [Number of Critical/High priority issues remaining]
- **Last Fix Completed**: [Date and component name]
- **Next Priority Target**: [Component name and rationale]
- **Overall Health**: [🔴 Critical | 🟡 Needs Work | 🟢 Stable] - [Brief assessment]
```

**Dashboard Update Rules**:

- Update with every component status change
- Use exact error counts, not estimates
- Reference specific evidence for status claims
- Update dates using commands: `powershell "Get-Date -Format 'yyyy-MM-dd'"` or `date "+%Y-%m-%d"`

### 3. Component Status Tables Template

#### Component Summary Table

```markdown
## Component Implementation Status

### 📈 Component Summary

| Category | Total | Working | Broken | Missing | Health |
|----------|-------|---------|--------|---------|--------|
| [Category Name] | X | Y | Z | W | [🟢/🟡/🔴] [Status] |
| [Category Name] | X | Y | Z | W | [🟢/🟡/🔴] [Status] |
| **Overall** | **X** | **Y** | **Z** | **W** | **[🟢/🟡/🔴] [Status]** |
```

#### Detailed Component Tables

```markdown
### 🔴 Critical Issues (Priority Score ≥21)

| Component | Location | Priority Score | Complexity Score | Status | Evidence | Last Updated |
|-----------|----------|----------------|------------------|--------|----------|--------------|
| [Name] | `path/to/component` | [Score] | [Score] | ❌ **Missing** | [Specific evidence] | [Date] |
| [Name] | `path/to/component` | [Score] | [Score] | 🔴 **Broken** | [Error count and type] | [Date] |

### 🟡 In Progress (Priority Score 14-20)

| Component | Location | Priority Score | Complexity Score | Status | Evidence | Last Updated |
|-----------|----------|----------------|------------------|--------|----------|--------------|
| [Name] | `path/to/component` | [Score] | [Score] | 🟡 **Partial** | [Current state] | [Date] |

### 🟢 Working Components

| Component | Location | Status | Verification | Last Verified |
|-----------|----------|--------|--------------|---------------|
| [Name] | `path/to/component` | ✅ **Working** | [Evidence of functionality] | [Date] |
```

**Component Table Guidelines**:

- **Priority Scores**: Use exact scores from `shared-components.md` formula
- **Complexity Scores**: Calculate using `shared-components.md` framework
- **Evidence**: Specific, verifiable information (error counts, test results)
- **Status Consistency**: Use standard status indicators (🔴🟡🟢❌)

### 4. Build Issues Log Template

```markdown
## Build Issues Log

### [YYYY-MM-DD] - [Issue Type]: [Brief Description]

- **Component**: [Component name and location]
- **Issue Type**: [Compilation Error | Integration Issue | Missing Implementation]
- **Priority Score**: [Number] ([Critical/High/Medium/Low])
- **Complexity Score**: [Number] ([Low/Medium/High])
- **Status**: [New | In Progress | Fixed | Escalated]
- **Evidence**: [Specific error messages, test results, compilation output]
- **Fix Documentation**: [Link to fix document if completed]
- **Agent Notes**: [Any agent behavior patterns or verification issues]
```

**Log Entry Rules**:

- Add entry for every new issue discovered
- Update status as work progresses
- Include evidence-based status changes only
- Link to fix documents when completed

### 5. Fix Success Metrics Dashboard Template

```markdown
## Fix Success Metrics Dashboard

### Current Period: [Month YYYY]

**Overall Success Rates**:
- **Complete Fixes**: [X]/[Y] attempts ([Z]% success rate)
- **First-Attempt Success**: [X]/[Y] fixes ([Z]% fixed without escalation)
- **Complexity Estimation Accuracy**: [X]/[Y] estimates within 25% ([Z]% accuracy)
- **Template Usage**: Quick Fix [X]% | Comprehensive [Y]%

**Success Rate by Category**:
| Category | Attempts | Completed | Success Rate | Avg Time |
|----------|----------|-----------|--------------|----------|
| Compilation Errors | [X] | [Y] | [Z]% | [H] hours |
| Integration Issues | [X] | [Y] | [Z]% | [H] hours |
| Mock Transitions | [X] | [Y] | [Z]% | [H] hours |
| Architecture Changes | [X] | [Y] | [Z]% | [H] hours |

**Agent Performance Metrics**:
- **Verification Accuracy**: [X]/[Y] claims verified ([Z]% accurate)
- **Escalation Appropriateness**: [X]/[Y] escalations justified ([Z]% appropriate)
- **Documentation Completeness**: [X]/[Y] templates fully completed ([Z]% complete)
```

### 6. Lessons Learned Template

```markdown
## Lessons Learned

### [YYYY-MM-DD] - [Issue Type]: [Brief Description]

**Category**: [Compilation/Integration/Architecture/etc]
**Component Type**: [Backend Service/CLI Component/API Gateway/etc]
**Outcome**: [Successfully Fixed/Escalated/Partial Progress]

**Key Learning**:
- [Primary insight from this fix]
- [What worked well or what should be avoided]
- [Recommended approach for similar issues]

**Agent Verification**: [Specific verification steps that worked/failed]
**Complexity Notes**: [Actual vs estimated complexity]
**Future Reference**: [When this lesson should be applied]
```

### 7. Evidence Archive Template

```markdown
## Evidence Archive

### [YYYY-MM-DD] - [Verification Method]: [Brief Description]

- **Verification Type**: [Agent Verification Protocol | Compilation Test | Integration Test]
- **Components Tested**: [List of components verified]
- **Evidence Method**: [PowerShell Test-Path | npx tsc | npm test | etc]
- **Results**: [Detailed results with exact outputs]
- **Documentation**: [References to related fix documents]
- **Agent Performance**: [Accuracy of agent claims vs. evidence]
```

## 📋 Planning File Templates

### 1. Planning File Header Template

```markdown
# [Project Name] Fix Planning Queue

> **Purpose**: Task planning and work queues for [project name] issue resolution  
> **Created**: [YYYY-MM-DD]  
> **Last Updated**: [YYYY-MM-DD]  
> **Status**: [Current planning phase]  
> **Integration**: Used by issue-fix-selector.md, quick-fix-guide.md, comprehensive-fix-guide.md  
> **Data Source**: [project-name]-tracker-data.md (status data)
```

### 2. Immediate Priority Queue Template

```markdown
## 🔥 Immediate Priority Queue

**Start Here** - Ready for immediate implementation:

- [ ] **[Component Name]** 
  - **Priority Score**: [Number] ([Critical/High/Medium/Low])
  - **Complexity Score**: [Number] ([Low/Medium/High] - use [quick/comprehensive]-fix-guide.md)
  - **Location**: `path/to/component`
  - **Status**: [Brief status description]
  - **Evidence**: [Specific evidence of current state]
  - **Next Action**: [Clear actionable next step]
  - **Dependencies**: [None/List dependencies]
```

### 3. Investigation Queue Template

```markdown
## 🔧 Investigation Queue

**Requires analysis before implementation**:

- [ ] **[Issue Name]**
  - **Priority Score**: [Number] ([Priority Level])
  - **Complexity Score**: [Number] ([Complexity Level])
  - **Location**: `path/to/component`
  - **Status**: [Current investigation status]
  - **Evidence**: [What evidence exists]
  - **Next Action**: [Analysis steps needed]
  - **Dependencies**: [What's needed to proceed]
```

### 4. Queue Management Guidelines Template

```markdown
## 📋 Queue Management Guidelines

### Task Selection Rules
1. **Start with Immediate Priority Queue** - highest impact, ready to implement
2. **Investigation items** require analysis before implementation planning
3. **Verification items** are good for shorter sessions or validation-focused work
4. **Architecture items** require design decisions and longer time investment

### Queue Updates Protocol
- [ ] **Mark tasks in progress** when starting work
- [ ] **Move completed items** to appropriate tracker sections
- [ ] **Add new discoveries** from investigation work
- [ ] **Update dependencies** as architecture evolves

### Integration with Fix Guides
- **Immediate Priority**: Use appropriate guide based on complexity score
- **Investigation**: Use comprehensive-fix-guide.md for systematic analysis
- **Verification**: Use quick-fix-guide.md for simple validations
- **Architecture**: Use comprehensive-fix-guide.md with escalation protocol

---
**Queue Type**: Task Planning & Work Organization  
**Integration**: Bridges discovery (tracker-data.md) with implementation (fix guides)  
**Maintenance**: Update after each fix session, add new discoveries from investigation
```

## 🚀 Initial File Generation Guide

### Step 1: Project Discovery Process

```bash
# Run discovery commands to gather initial data
npm test                    # Test status
npx tsc --noEmit           # Compilation status  
npm run lint               # Code quality
find . -name "*.ts" | wc -l # File counts
```

### Step 2: Create Tracker Data File

1. **Start with header template** using project-specific information
2. **Populate Quick Status Dashboard** with discovery results
3. **Create Component Summary Table** categorizing found components
4. **Add Build Issues Log entries** for each discovered problem
5. **Initialize empty sections** for metrics, lessons, and evidence

### Step 3: Create Planning File

1. **Start with header template** referencing the tracker data file
2. **Analyze component issues** from tracker data
3. **Categorize into queues** based on readiness and complexity
4. **Add task details** with priority/complexity scores
5. **Set up queue management guidelines** for the project

### Step 4: Cross-Reference Integration

- Add **Planning reference** in tracker data header
- Add **Data Source reference** in planning file header  
- Ensure **consistent naming** for issues across both files
- Set up **update protocols** for maintaining synchronization

## 🔄 Integration with Fix Documentation

See prompts\documentation\issue-fix-selector.md and files referenced there.

**For each completed fix**:

see prompts\documentation\issue-fix-documentation.md or prompts\documentation\quick-fix-guide.md depending on the fix type.

## 🔧 Validation Script Integration

**Automated tools available** in `scripts/validation/` for maintaining tracker accuracy:

### Evidence Generation and Validation

```bash
# Generate evidence for tracker updates
node scripts/validation/generate-evidence.js <fix-id>

# Validate component health for status updates
node scripts/validation/validate-component.js <component-name>

# Verify fixes before updating tracker status
node scripts/validation/verify-fix.js <component-name>
```

### Tracker Maintenance Workflow

**When updating component status**:

1. Run `validate-component.js` to confirm current health
2. Update tracker with validation results
3. Include health score and evidence in tracker entry

**When completing fixes**:

1. Run `verify-fix.js` to confirm fix success
2. Run `generate-evidence.js` to create documentation evidence
3. Update tracker with verification results and evidence links

**For evidence field updates**:

- Use output from `validate-component.js` for current health evidence  
- Use output from `generate-evidence.js` for before/after fix evidence
- Include validation timestamps for audit trail

### Automated Tracker Updates

**Evidence field format** (when using validation scripts):

``` log
Evidence: Health Score: XX/100 | Validation: YYYY-MM-DD | Status: [Working/Broken/Partial] | Details: [Script output summary]
```

**Build Issues Log format** (when using verification):

``` log
[DATE] - [Component]: Fix verified via scripts | Before: X errors | After: Y errors | Verification: PASS/FAIL
```

## 🔄 File Synchronization & Maintenance

### Regular Synchronization Protocol

#### When Updating Tracker Data

- [ ] Update "Last Updated" date when making changes
- [ ] Record any new issues discovered
- [ ] Update component status if fixes completed
- [ ] **Sync to Planning**: Move completed tasks from planning queues to tracker

#### When Updating Planning File

- [ ] Update "Last Updated" date  
- [ ] Add new tasks discovered during investigation
- [ ] Remove completed tasks (move details to tracker data)
- [ ] **Sync from Tracker**: Check for new issues to add to appropriate queues

### Medium-term Coordination Reviews

#### Tracker Data Maintenance

- [ ] Verify all status claims have evidence
- [ ] Update Quick Status Dashboard metrics
- [ ] Review and update priority scores if needed
- [ ] Clean up outdated "In Progress" items

#### Planning File Maintenance

- [ ] Review queue priorities based on latest tracker data
- [ ] Reorganize queues if priorities have shifted
- [ ] Add new investigation tasks from recent discoveries

#### Cross-File Validation

- [ ] Ensure consistent issue naming between files
- [ ] Verify priority scores match between files  
- [ ] Check that completed tasks have proper tracker documentation
- [ ] Validate that all critical issues appear in appropriate planning queues

### Long-term Strategic Reviews

#### Tracker Data Analysis

- [ ] Analyze success patterns in Lessons Learned
- [ ] Update Fix Success Metrics Dashboard
- [ ] Review complexity estimation accuracy
- [ ] Plan improvements based on patterns

#### Planning Optimization

- [ ] Review queue organization effectiveness
- [ ] Adjust queue categories based on experience
- [ ] Update queue management guidelines
- [ ] Optimize task categorization rules

### Workflow Integration Patterns

#### Starting Work (Planning → Action)

1. **Select task** from appropriate planning queue
2. **Mark in progress** in planning file
3. **Create tracker entry** if major issue discovered
4. **Follow fix guide** based on complexity score
5. **Document progress** in planning file

#### Completing Work (Action → Tracker)

1. **Update component status** in tracker data with evidence
2. **Mark task complete** in planning file
3. **Add lessons learned** entry to tracker if significant
4. **Move task details** to tracker's build issues log
5. **Update success metrics** in tracker dashboard

#### Discovering New Issues (Investigation → Planning)

1. **Document evidence** in tracker data
2. **Add to appropriate queue** in planning file
3. **Calculate priority/complexity scores** using standard formulas
4. **Set dependencies**
5. **Update both files' "Last Updated" dates

### Quality Standards

**Evidence Requirements**:

- All status claims must have verifiable evidence
- Use exact error counts, not estimates
- Include command outputs for verification claims
- Date all evidence entries

**Scoring Consistency**:

- Use `shared-components.md` formulas exactly
- Recalculate scores when conditions change
- Document reasoning for score changes
- Maintain score history for learning

**Integration Compliance**:

- All fix references must link to actual documents
- Status transitions must match fix document claims
- Evidence formats must align with fix documentation
- Cross-references must be bidirectional

## 🎯 Best Practices

### Component Categorization

- Group by functional area or system layer
- Separate critical path components from supporting ones
- Use consistent naming conventions
- Prioritize based on user/system impact

### Evidence Collection  

- Always use commands for timestamps and verification
- Capture exact error messages and counts
- Include context (what was being attempted)
- Document verification methods used

### Agent Collaboration

- Record agent verification accuracy
- Note patterns in agent behavior
- Document effective verification approaches
- Track complexity estimation improvements

## 🤖 Agent Implementation Guide

### For AI Agents: Creating the Two-File System

#### Initial Setup Checklist

When given a repository and asked to create tracking systems:

1. **Repository Analysis**:

   ```bash
   # Gather project data
   find . -name "*.ts" -o -name "*.js" -o -name "*.json" | head -20
   npm test 2>&1 | head -10  
   npx tsc --noEmit 2>&1 | head -10
   ls -la src/ 2>/dev/null || ls -la .
   ```

2. **Create Tracker Data File** (`[project-name]-tracker-data.md`):
   - Use tracker data templates from this document
   - Populate with actual discovery results
   - Include real error counts and file paths
   - Create evidence-based status entries

3. **Create Planning File** (`[project-name]-fix-planning.md`):
   - Use planning templates from this document  
   - Organize issues into appropriate queues
   - Calculate real priority/complexity scores
   - Set up project-specific queue guidelines

4. **Cross-Reference Setup**:
   - Add planning file reference to tracker header
   - Add tracker data source reference to planning header
   - Ensure consistent issue naming
   - Set up synchronization protocols

#### Agent Decision Matrix for File Usage

| Situation | Use Tracker Data | Use Planning File |
|-----------|------------------|-------------------|
| Recording build status | ✅ Yes | ❌ No |
| Planning next work session | ❌ No | ✅ Yes |
| Documenting completed fix | ✅ Yes | ❌ No |
| Organizing work queues | ❌ No | ✅ Yes |
| Recording evidence/metrics | ✅ Yes | ❌ No |
| Setting task priorities | ❌ No | ✅ Yes |
| Updating success rates | ✅ Yes | ❌ No |
| Managing dependencies | ❌ No | ✅ Yes |

#### Common Agent Mistakes to Avoid

- **Don't mix concerns**: Status in tracker, planning in planning file
- **Don't duplicate content**: Reference between files, don't copy
- **Don't skip synchronization**: Update both files when completing work
- **Don't guess at metrics**: Use real evidence for all status claims
- **Don't ignore file naming**: Use consistent issue names across files

### Example: Haruspex Project Implementation

The Haruspex project provides excellent examples:

#### Tracker Data Example (`haruspex-tracker-data.md`)

- **Status Focus**: Current build status, component health, evidence archive
- **Quantitative Data**: Exact error counts, success metrics, verification results
- **Historical Records**: Build issues log, lessons learned, fix success tracking

#### Planning Example (`haruspex-fix-planning.md`)

- **Action Focus**: Task queues, next actions, work organization  
- **Forward-Looking**: Priority analysis, dependency mapping
- **Work Coordination**: Queue management, task selection rules, integration protocols

### Integration Success Patterns

#### When System Works Well

- Agents can quickly find status information in tracker data
- Agents can easily select next tasks from planning queues  
- Work flows smoothly from planning → action → tracker updates
- Historical data accumulates for future pattern analysis
- Cross-references stay synchronized automatically

#### When System Needs Adjustment

- Information frequently searched for in wrong file
- Tasks get lost between planning and tracking
- Agents skip synchronization steps
- Evidence quality degrades over time
- Priority calculations become inconsistent

---
**Template Version**: Dual-file tracking system with agent implementation guide  
**Maintenance**: Update based on agent usage patterns and system evolution  
**Integration**: Designed for `issue-fix-selector.md`, `quick-fix-guide.md`, and `comprehensive-fix-guide.md`  
**Examples**: See `Haruspex/dev/haruspex-tracker-data.md` and `Haruspex/dev/haruspex-fix-planning.md`
