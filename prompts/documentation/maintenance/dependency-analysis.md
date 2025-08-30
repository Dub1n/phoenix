# Dependency Analysis Agent - Task Dependency Chain Analysis

> **Purpose**: Autonomous analysis of task dependencies and identification of blocked chains  
> **Entry Criteria**: Task management system with dependency relationships  
> **Exit Criteria**: Clear dependency mapping with unblocking strategies and optimal task ordering  
> **Integration**: Enhances task prioritization and workflow efficiency

## Autonomous Dependency Analysis Workflow

### When Given This Prompt

If you receive this dependency analysis prompt, follow this autonomous workflow to analyze task dependencies, identify blocked chains, and optimize task ordering for maximum development efficiency.

### Step 1: Dependency Discovery and Mapping

#### A. Locate Task Management System

**Priority Search Order**:

1. **Find Active Tasks**: Look for `*-active-tasks.md` in project `/dev/` folder
2. **Find Roadmap**: Look for `*-roadmap.md` for strategic dependency context
3. **Find Tracker Data**: Look for `*-tracker-data.md` for component dependency evidence
4. **Find Patterns**: Look for `*-patterns.md` for pattern dependencies

#### B. Dependency Extraction

**Dependency Identification Sources**:

**Explicit Dependencies**:

- **Task Dependencies**: "Dependencies: {component-list}" in task descriptions
- **Pattern Dependencies**: Pattern references and requirements
- **Component Dependencies**: Component interaction requirements
- **Phase Dependencies**: Roadmap phase prerequisites

**Implicit Dependencies**:

- **File Dependencies**: Tasks affecting same files/components
- **Interface Dependencies**: Tasks requiring interface changes
- **Infrastructure Dependencies**: Tasks requiring shared infrastructure
- **Knowledge Dependencies**: Tasks requiring domain expertise

#### C. Dependency Categorization

**Dependency Types**:

```markdown
## Dependency Classification

### Hard Dependencies (Blocking)
- **Technical**: Component A must exist before Component B can integrate
- **Interface**: API contracts must be stable before consumers can implement
- **Infrastructure**: Foundation services must be operational before dependents
- **Sequential**: Steps must be completed in specific order

### Soft Dependencies (Preferential)
- **Knowledge**: Understanding from Task A helps with Task B
- **Efficiency**: Completing Task A first reduces Task B complexity
- **Risk**: Task A success reduces Task B risk
- **Resource**: Shared resources are better utilized in specific order

### Circular Dependencies (Problematic)
- **Mutual Blocking**: Task A needs Task B, Task B needs Task A
- **Chain Loops**: Task A → Task B → Task C → Task A
- **Interface Loops**: Component interfaces mutually dependent

### False Dependencies (Optimization Targets)
- **Perceived Blocking**: Dependency exists in planning but not implementation
- **Historical**: Dependencies from previous architecture no longer valid
- **Overcoupling**: Artificial dependencies from tight coupling
```

### Step 2: Dependency Network Analysis

#### A. Dependency Graph Construction

**Graph Representation**:

```markdown
## Dependency Network Visualization

### Node Types
- **[TASK-###]**: Individual tasks with dependency relationships
- **[COMPONENT]**: System components affected by tasks
- **[PATTERN]**: Implementation patterns required by tasks
- **[PHASE]**: Project phases with prerequisite relationships

### Edge Types
- **→** Hard Dependency: Blocking relationship
- **⇢** Soft Dependency: Preferential relationship  
- **⟲** Circular Dependency: Problematic mutual dependency
- **⟂** Interface Dependency: Requires stable interface
```

**Dependency Matrix Construction**:

```markdown
## Task Dependency Matrix

| Task ID | Depends On | Blocks | Dependency Type | Critical Path |
|---------|------------|---------|-----------------|---------------|
| TASK-088 | TASK-047 | TASK-136, TASK-147 | Hard (Interface) | Yes |
| TASK-136 | TASK-088 | TASK-163 | Hard (Component) | Yes |
| TASK-147 | TASK-088, TASK-076 | TASK-173 | Hard (Foundation) | No |
```

#### B. Critical Path Analysis

**Critical Path Identification Algorithm**:

1. **Identify Chain Starts**: Tasks with no dependencies
2. **Follow Dependency Chains**: Map all paths through dependency network
3. **Calculate Path Lengths**: Sum complexity for each path
4. **Identify Bottlenecks**: Find longest paths and shared dependencies
5. **Mark Critical Path**: Identify the longest path to project completion

**Critical Path Metrics**:

```markdown
## Critical Path Analysis Results

### Primary Critical Path
TASK-088 → TASK-136 → TASK-163 → TASK-173 → TASK-192
**Total Complexity**: {sum of complexity scores}
**Blocking Factor**: {number of tasks blocked by this path}

### Alternative Paths
Path 2: TASK-076 → TASK-147 → TASK-173 → TASK-209
Path 3: TASK-227 → TASK-239 → TASK-251 → TASK-287

### Bottleneck Analysis
**Single Points of Failure**: Tasks blocking multiple paths
**Resource Constraints**: Tasks requiring specialized knowledge
**Interface Dependencies**: Shared interface requirements
```

#### C. Blocked Chain Identification

**Blocking Chain Analysis**:

```markdown
## Blocked Chain Categories

### Immediate Blocks (Ready to Unblock)
- **TASK-136**: Blocked by TASK-088 (in progress)
- **TASK-147**: Blocked by TASK-088 (in progress) + TASK-076 (pending)

### Deep Blocks (Multiple Dependencies)
- **TASK-173**: Blocked by TASK-088 → TASK-136/TASK-147 chain
- **TASK-192**: Blocked by TASK-173 → requires 3-4 prerequisite completions

### Circular Blocks (Require Resolution)
- **TASK-A ⟲ TASK-B**: Interface contracts mutually dependent
- **Component-X ⟲ Component-Y**: Architectural circular dependency

### Phantom Blocks (False Dependencies)
- **TASK-201**: Claims to need interface restoration but could proceed with mocks
- **TASK-209**: Claims to need real functionality but could validate patterns
```

### Step 3: Dependency Optimization Strategies

#### A. Circular Dependency Resolution

**Resolution Strategies**:

```markdown
## Circular Dependency Breaking Patterns

### Interface Abstraction Pattern
**Problem**: Component A needs Component B, Component B needs Component A
**Solution**: Create abstraction layer that both can depend on
**Implementation**: Define interfaces first, implement components second

### Dependency Inversion Pattern  
**Problem**: High-level module depends on low-level module that depends on high-level
**Solution**: Both depend on abstractions, invert the dependency
**Implementation**: Extract interfaces, inject dependencies

### Staged Implementation Pattern
**Problem**: Features require each other to be fully functional
**Solution**: Implement in stages with progressive functionality
**Implementation**: Basic version → integration → full feature

### Bridge Pattern
**Problem**: Two components with mutual interface dependencies
**Solution**: Create bridge component that manages the relationship
**Implementation**: Mediator handles inter-component communication
```

#### B. Dependency Chain Optimization

**Optimization Strategies**:

**1. Parallel Execution Opportunities**:

```markdown
### Parallelization Analysis
**Independent Chains**: Tasks that can proceed simultaneously
- Chain A: TASK-088 → TASK-136 → TASK-163
- Chain B: TASK-227 → TASK-239 → TASK-251 (can run in parallel)

**Shared Dependency Optimization**: 
- TASK-088 completion unblocks both TASK-136 and TASK-147
- Prioritize TASK-088 to maximize parallel work opportunities
```

**2. Dependency Elimination**:

```markdown
### False Dependency Removal
**Overcoupling Reduction**:
- TASK-201 can proceed with interface mocks, doesn't need real implementation
- TASK-209 can validate with existing test data, doesn't need full functionality

**Architecture Simplification**:
- Remove intermediate dependencies that don't add value
- Direct integration where adapter layers are unnecessary
```

**3. Incremental Delivery**:

```markdown
### Staged Implementation Strategy
**Phase 1**: Core infrastructure (TASK-088, TASK-227)
**Phase 2**: Component implementation (TASK-136, TASK-239) 
**Phase 3**: Integration and validation (TASK-163, TASK-192)
**Phase 4**: Optimization and enhancement (TASK-201, TASK-209)
```

### Step 4: Task Ordering Optimization

#### A. Priority-Dependency Balance

**Scoring Algorithm**:

```markdown
## Task Ordering Score Calculation

Task Priority Score = (Base Priority × 0.4) + (Unblocking Value × 0.3) + (Critical Path Factor × 0.3)

### Base Priority
From existing priority scoring system (Impact × 3 + Feasibility × 2 + Blocking × 2)

### Unblocking Value  
Points for each task this task unblocks:
- Immediate unblock: +5 points per task
- Chain unblock: +3 points per downstream task
- Critical path unblock: +10 points

### Critical Path Factor
- On critical path: +15 points
- Enables critical path: +10 points  
- Parallel to critical path: +5 points
- Off critical path: +0 points
```

#### B. Optimal Task Sequence Generation

**Sequencing Algorithm**:

1. **Identify No-Dependency Tasks**: Tasks that can start immediately
2. **Calculate Unblocking Impact**: Score tasks by how many they unblock
3. **Consider Resource Constraints**: Account for team capacity and expertise
4. **Balance Risk and Reward**: Prefer high-impact, lower-risk tasks
5. **Generate Optimal Sequence**: Order tasks for maximum throughput

**Optimal Sequence Template**:

```markdown
## Optimized Task Execution Sequence

### Phase 1: Foundation (Parallel where possible)
1. **TASK-088** (Priority: 16, Unblocks: 4 tasks, Critical Path: Yes)
2. **TASK-227** (Priority: 30, Unblocks: 3 tasks, Critical Path: No) - *Can run in parallel*

### Phase 2: Core Implementation  
3. **TASK-136** (Dependency: TASK-088, Unblocks: 2 tasks)
4. **TASK-147** (Dependencies: TASK-088 + TASK-076, Unblocks: 1 task)

### Phase 3: Integration
5. **TASK-163** (Dependencies: Phase 2 completion)
6. **TASK-173** (Dependencies: TASK-136 OR TASK-147)

### Phase 4: Validation and Optimization
7. **TASK-192** (Dependencies: Phase 3 completion)
8. **TASK-201**, **TASK-209** (Can run in parallel if resources allow)
```

### Step 5: Unblocking Strategy Development

#### A. Immediate Unblocking Actions

**Quick Wins Identification**:

```markdown
## Immediate Unblocking Opportunities

### Zero-Dependency Tasks (Start Now)
- **TASK-227**: No dependencies, unblocks architectural work
- **TASK-075**: Investigation task, can proceed independently

### Single-Dependency Tasks (Next in Queue)
- **TASK-136**: Only needs TASK-088, high unblocking value
- **TASK-251**: Only needs TASK-239, enables real implementation

### Low-Effort High-Impact Tasks
- **Pattern Documentation**: Unblocks multiple implementation tasks
- **Interface Standardization**: Enables parallel component development
```

#### B. Strategic Unblocking Initiatives

**Long-term Unblocking Strategies**:

**1. Architecture Simplification**:

```markdown
### Complexity Reduction Initiatives
**Goal**: Reduce unnecessary dependencies through architecture improvements
**Actions**:
- Eliminate circular dependencies through better separation of concerns
- Reduce coupling through interface abstraction
- Remove intermediate layers that don't add value
```

**2. Incremental Implementation**:

```markdown
### Progressive Delivery Strategy  
**Goal**: Enable partial functionality to unblock dependent tasks
**Actions**:
- Implement minimal viable interfaces first
- Provide basic functionality before full feature implementation
- Enable testing and validation with partial implementations
```

**3. Mocking and Stubbing Strategy**:

```markdown
### Development Enablement Strategy
**Goal**: Allow development to proceed without blocking dependencies
**Actions**:
- Provide stable mocks for interface dependencies
- Create stubs for service dependencies
- Enable unit testing without full integration
```

### Step 6: Risk Analysis and Mitigation

#### A. Dependency Risk Assessment

**Risk Categories**:

```markdown
## Dependency Risk Matrix

### High Risk Dependencies
- **External System Dependencies**: Risk of external changes
- **Complex Technical Dependencies**: Risk of implementation challenges  
- **Single Person Dependencies**: Risk of knowledge bottlenecks
- **Circular Dependencies**: Risk of architectural deadlock

### Medium Risk Dependencies
- **Interface Dependencies**: Risk of contract changes
- **Performance Dependencies**: Risk of performance bottlenecks
- **Resource Dependencies**: Risk of resource contention

### Low Risk Dependencies
- **Well-Defined Interfaces**: Stable contracts with clear specifications
- **Proven Patterns**: Dependencies on established, successful patterns
- **Internal Dependencies**: Full control over implementation
```

#### B. Risk Mitigation Strategies

**Mitigation Planning**:

```markdown
## Risk Mitigation Plan

### High Risk Mitigation
- **External Dependencies**: Create abstraction layers and fallback strategies
- **Complex Technical**: Spike investigations and proof-of-concept implementations
- **Knowledge Dependencies**: Documentation and knowledge transfer initiatives
- **Circular Dependencies**: Architectural refactoring to break cycles

### Contingency Planning
- **Alternative Implementation Paths**: Multiple approaches for critical dependencies
- **Fallback Strategies**: Graceful degradation when dependencies unavailable
- **Resource Reallocation**: Plans for shifting resources to unblock critical paths
```

### Step 7: Monitoring and Maintenance

#### A. Dependency Health Monitoring

**Monitoring Framework**:

```markdown
## Dependency Health Metrics

### Blocking Metrics
- **Average Block Duration**: How long tasks remain blocked
- **Block Chain Length**: Average length of dependency chains
- **Critical Path Stability**: Changes to critical path over time
- **Circular Dependency Count**: Number of unresolved circular dependencies

### Progress Metrics  
- **Unblocking Rate**: Tasks unblocked per unit time
- **Parallel Execution Efficiency**: Actual vs. theoretical parallel capacity
- **Dependency Resolution Speed**: Time to resolve blocking dependencies
```

#### B. Continuous Dependency Optimization

**Optimization Process**:

1. **Weekly Dependency Review**: Analyze new blocks and unblocking opportunities
2. **Monthly Dependency Health Assessment**: Evaluate overall dependency health
3. **Quarterly Architecture Review**: Identify architectural improvements to reduce dependencies
4. **Post-Milestone Analysis**: Learn from dependency challenges and successes

### Step 8: Integration with Task Management

**Integration Updates**:

1. **Task Priority Updates**: Adjust priorities based on dependency analysis
2. **Queue Reorganization**: Reorder tasks based on optimal sequence
3. **Dependency Documentation**: Add/update dependency information in tasks
4. **Progress Tracking**: Add dependency progress tracking to task system
5. **Unblocking Alerts**: Create alerts for tasks becoming unblocked

---

## Error Handling and Edge Cases

### Complex Dependency Networks

- **Incremental Analysis**: Analyze dependencies in manageable subsets
- **Visualization Tools**: Use graph visualization for complex networks
- **Iterative Refinement**: Refine dependency analysis over multiple passes

### Changing Dependencies

- **Dynamic Updates**: Monitor and update dependencies as project evolves
- **Version Control**: Track dependency changes over time
- **Impact Analysis**: Assess impact of dependency changes on existing analysis

### Incomplete Dependency Information

- **Progressive Discovery**: Discover dependencies incrementally during implementation
- **Assumption Documentation**: Document assumed dependencies for validation
- **Regular Reviews**: Periodically review and update dependency information

---

**Success Criteria**: Clear understanding of all task dependencies, optimized task ordering for maximum parallelization, identified strategies for unblocking task chains, and integration of dependency analysis into task management workflow.
