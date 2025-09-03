# Comprehensive Fix Guide - Complex Issue Resolution

> **Purpose**: Standalone guide for complex, architectural, and high-impact fixes  
> **Scope**: Medium to high complexity issues requiring detailed analysis  
> **Target Time**: 3+ hours, multi-session work acceptable  
> **Template**: Full comprehensive documentation with impact analysis
> **Placeholders**: This guide uses generic placeholders like `<project>` - these are passed in via the /pr:task claude code command

## Autonomous Complex Fix Workflow

### Step 1: Implementation Strategy

**Systematic Implementation Approach**:

1. **Root Cause Analysis**:
   - Trace the problem to its source
   - If any [TASK-ID] or TODO markers referenced in task, search codebase for this task's [TASK-ID]
   - Understand why the issue exists
   - Identify all symptoms vs. underlying cause

2. **Pattern Analysis**:
   - Search (grep) the project's pattern document for relevant information

3. **Solution Architecture**:
   - Take any existing pattern(s) into account
   - Design the fix at a high level
   - Consider alternative approaches
   - Plan for minimal disruption to existing functionality

4. **Incremental Implementation**:
   - Break work into logical phases
   - Implement with frequent validation checkpoints
   - Maintain working state between changes

5. **Comprehensive Testing**:
   - Unit tests for modified components
   - Integration tests for affected interactions
   - Regression tests to prevent unintended breaks

### Step 2: Escalation Evaluation

**Automatic Escalation Triggers**:

- **Scope Expansion**: Discovering 3+ additional broken components
- **Architectural Impact**: Requiring changes to core system interfaces
- **Security Implications**: Finding security vulnerabilities
- **Cross-Project Dependencies**: Involving other projects or external systems
- **Unknown Complexity**: Unable to assess after 30 minutes investigation

#### Solution Simplicity Check

**MANDATORY PAUSE: Before Escalating - Ask These Questions**:

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

**The One-Sentence Test**:

- If you can explain the fix in one sentence ("Update core module to call real component methods"), it's probably **not architectural complexity**.
- If you need multiple sentences with "however" and "but also" → **Maybe architectural**

#### Second Take Protocol

**When you think you need to escalate, MANDATORY PAUSE**:

1. **Write down the "complex" problem** in detail
2. **Write down the simplest possible solution** (ignore why it "won't work")
3. **Ask**: "Why exactly won't the simple solution work?"
4. **If you can't articulate specific technical blockers** → Try the simple solution first

**Common Over-Engineering Traps to Avoid**:

- Treating method name changes as architectural incompatibility
- Creating adapter layers when direct API calls would work  
- Assuming different constructor parameters require complex dependency injection
- Confusing "different method signatures" with "incompatible system designs"
- Escalating async/sync differences (usually just add `await`)

**Escalation Actions** (only if simple solution truly won't work):

1. **STOP implementation work** only after confirming simplicity check
2. **Document both complex and simple approaches** tried
3. **Create escalation request** with specific technical blockers:

   ```markdown
   ### [DATE] - Escalation Request: [Issue Description]  
   - **Original Issue**: [Brief description]
   - **Simple Solution Attempted**: [What was tried and specific failure]
   - **Technical Blockers**: [Specific reasons simple approach failed]
   - **Escalation Trigger**: [Specific reason after simplicity check]
   - **Complexity Reassessment**: [Original → New assessment with justification]
   - **Recommended Action**: [Architecture review/Expert consultation with evidence]
   ```

### Step 3: Implementation Completion

#### Task Status for Implementation Phase

**Implementation Status Options**:

- **[~]** 'in-progress': Active development work ongoing  
- **[B]** 'broken-implemented': Core logic done but compilation/tests failing
- **[?]** 'blocked': Cannot proceed due to dependencies or technical issues

#### Basic Implementation Verification

**Before completing implementation, verify**:

- [ ] **Build Compilation**: Basic compilation check passes
- [ ] **Component Compilation**: Affected components compile without errors
- [ ] **No Major Regressions**: Existing functionality not obviously broken
- [ ] **TODO Tags Created**: All discovered issues tagged for later processing
- [ ] **Architecture Validation**: Changes align with system architecture

#### Implementation Completion

**When implementation is complete**:

1. **Mark Status**: Update task to [~] or [B] based on compilation state
2. **Create TODO Tags**: Add any issues discovered during implementation  
3. **Run Validation**: Execute `/pr:validate` for comprehensive testing
4. **Do Not Mark Complete**: Never mark [x] at this stage

**Next Phase**: Run `/pr:validate` to test functionality and collect evidence

## Task Discovery Protocols

**PRIORITY**: Consolidation First, Create Only When Necessary

#### Discovery Types and Consolidation Workflow

**Task discovery can happen during**:

- Implementation work (TODO tags)
- Analysis, reviews, refactoring
- General development outside specific tasks

**MANDATORY Process for ALL discoveries**:

#### Step 1: Consolidation Analysis (REQUIRED FIRST)

 ```bash
 # Search for related existing tasks
 grep -i "[relevant-keyword|component-name|domain]" <project>-active-tasks.md
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

#### Step 2a: Task Creation

If task is not to be consolidated following the consolidation check, create a new task in the appropriate section
    - If essential prerequesite for any priority or sequenced tasks, mark as priorty ("[!]")

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

**Consolidation Quality Gates**:

- [ ] Epic scope remains coherent
- [ ] Implementation sequence flows logically
- [ ] Total complexity reasonable (<50 points)
- [ ] All implementation details preserved

#### Step 3: TODO relabel

If any TODO tags were added during implementation and now are referenced in a task, replace the TODO tag(s) in the marker(s) with the [TASK-ID] of the task that references it.

## Post-Implementation Workflow

**Implementation Complete**: Run `/pr:validate` for comprehensive testing and evidence collection.

**Validation Complete**: Run `/pr:document` for pattern documentation and project tracking.

**Documentation and validation are handled in separate phases to ensure quality and completeness.**

## Success Criteria for Comprehensive Implementation

**A successful comprehensive implementation must achieve**:

- Resolves all identified compilation and build errors within task scope
- Addresses root cause, not just symptoms
- Maintains system stability and doesn't introduce regressions
- Follows established architectural patterns
- Creates comprehensive TODO tags for discovered issues
- Prepares system for validation phase

**Quality standards for complex implementations**:

- **Architectural Integrity**: Changes align with existing system architecture and patterns
- **Code Quality**: Follows project conventions and best practices
- **Maintainability**: Future developers can understand and extend the implementation
- **Proper Scope**: Implementation stays within defined task boundaries

**Implementation Readiness**:

- Code compiles without errors in task scope
- No obvious functionality regressions
- All discovered issues properly tagged for later processing
- System ready for comprehensive testing via `/pr:validate`

## Reference Integration

**For detailed frameworks**: See `shared-components.md`

- Priority scoring matrices
- Complexity assessment formulas
- Evidence mapping standards

**For quick fixes**: Refer to `quick-fix-guide.md` for simpler issues  

**Fpr Specialized Guidance**:
    - Mock-to-Real Component Transitions: `.\maintenance\mock-to-real-guide.md`

---

**Template Type**: Comprehensive Fix Guide  
**Context**: Full-featured for complex scenarios  
**Integration**: Standalone with complete tracker integration  
**Pattern Framework**: Enhanced consolidation compliance required
