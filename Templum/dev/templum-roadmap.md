# Templum Strategic Roadmap & Task Integration Guide

> **Purpose**: Living strategic guide for task classification, phase management, and integration protocols  
> **Created**: 2025-08-23 (Transformed from templum-fix-planning-STREAMLINED.md)  
> **Integration**: Used by agents for task discovery, classification, and roadmap updates  
> **Task Tracking**: All individual tasks tracked in templum-active-tasks.md (single source of truth)

## Task Discovery & Integration Protocol

### Discovery Entry Points

#### 1. In-Workflow Discovery (TODO Tags)

**When**: During implementation of existing tasks  
**Pattern**:

```typescript
// TODO: [TASK-NEW-XXX] Brief description
// Priority: High|Medium|Low | Complexity: 1-10
// Location: Context where discovered
// Dependencies: List dependencies
// Phase: Foundation|Interface|Integration
```

**Processing**: During post-implementation documentation phase

#### 2. Architectural Discovery (Analysis & Reviews)

**When**: During /analyze, /improve, architectural analysis, or code reviews  
**Pattern**: Direct addition to templum-active-tasks.md using classification guide below  
**Trigger**: Any architectural work, refactoring, or system analysis

#### 3. External Discovery (User Requests, Issues)

**When**: User directives, bug reports, feature requests, or external requirements  
**Pattern**: Create task with appropriate phase assignment using classification guide  
**Trigger**: Any external input requiring development work

### Task Classification Guide

#### Phase Assignment Rules

When adding ANY new task, determine phase based on:

**Foundation Phase**:

- Core infrastructure (config, error handling, logging)
- Type systems and foundational patterns
- Circuit breakers and resilience systems
- Basic architectural components

**Interface Phase**:

- UI components and user interaction
- API adapters and external integrations
- WebView providers and interface layers
- Session management and navigation

**Integration Phase**:

- Cross-component coordination
- Testing frameworks and validation
- Performance optimization
- Production deployment features

#### Priority Scoring Framework (1-30 scale)

**Impact Score (1-10)**:

- 10: Blocks critical functionality or user-facing features
- 7-9: Affects important functionality, impacts multiple components
- 4-6: Affects secondary features, limited scope
- 1-3: Minor improvements, cosmetic changes

**Complexity Score (1-10)**:

- 10: System-wide changes, architectural modifications, >20 files
- 7-9: Multi-component changes, 10-20 files, new patterns
- 4-6: Single component changes, 5-10 files, established patterns
- 1-3: Simple fixes, <5 files, clear solutions

**Urgency Score (1-10)**:

- 10: Blocking all development, user priority override
- 7-9: Blocking other components, critical path
- 4-6: Important but not blocking, affects timelines
- 1-3: Nice to have, can be deferred

> Total Priority = Impact + Complexity + Urgency

#### Dependency Analysis Checklist

For each new task, identify:

- [ ] **Consolidation Check**: Have you searched for existing tasks to consolidate with?
- [ ] **Prerequisites**: What must complete before this task?
- [ ] **Unblocks**: What does this task enable?
- [ ] **Phase Gate Impact**: Does this affect phase completion criteria?
- [ ] **Existing Pattern**: Can we reuse established implementation patterns?

### Task Creation Protocol

**BEFORE adding new tasks**: Apply consolidation protocol from fix guides

- Complex issues → comprehensive-fix-guide.md Task Discovery Protocols
- Simple fixes → quick-fix-guide.md Task Discovery Protocols

**Benefits of Consolidation**: ~80% workflow overhead reduction, architectural consistency, comprehensive delivery

## 🚀 Implementation Strategy

### Accelerated Implementation Approach

**Strategy**: Leverage proven components from Haruspex and Phoenix Code Lite  
**Time Savings**: 50-60% reduction through strategic component reuse  
**Risk**: Low - components are production-proven with established patterns

### Component Reuse Priority

1. **Haruspex Patterns**: WebView providers, circuit breakers, cleanup orchestration
2. **PCL Patterns**: Configuration management, session handling, adapter patterns  
3. **Custom Implementation**: Only when proven components don't exist

## Implementation Phases

### Phase 1: Foundation [x]

**Completion Gate**: Core infrastructure operational  
**Status**: 2/2 foundation components complete

**Completed Components**:

- Configuration Management System (PCL Reuse) - 85% time savings
- Circuit Breaker Implementation (Haruspex Reuse) - specialized configurations

**Success Criteria Met**:

- [x] Multi-environment configuration system operational
- [x] Production resilience and error recovery operational
- [x] Foundation patterns established for reuse

### Phase 2: Interface Implementation [x]

**Completion Gate**: Real interfaces functional (not simulated)  
**Status**: 4/4 priority tasks complete + Critical Backend Integration complete
**Current Focus**: Phase 3 preparation

**Phase 2 Tasks** (Reference only - see templum-active-tasks.md for details):

- [x] VSCode Integration via Haruspex WebView Providers (COMPLETED)
- [x] Session Management via PCL Pattern (COMPLETED 2025-08-23)
- [x] Adapter-Based Dependency Injection (COMPLETED 2025-08-23)
- [x] **Backend Service Integration** (COMPLETED 2025-08-23) - Critical enabling infrastructure
- [>] Resource Management via Haruspex Cleanup (moved to Phase 3 - requires backend integration)

**Success Criteria**:

- [x] **Real VSCode WebView functional** - Universal WebView Provider with backend service integration complete
- [x] **Session management with proper lifecycle control** - Universal Session Manager with PCL pattern adaptation complete
- [x] **Dependency injection system operational** - All core components use interface abstraction with adapter registry
- [x] **Backend service communication** - Protocol communication layer complete (IPC, HTTP, WebSocket)
- [>] Interface switching between VSCode, CLI, Universal modes (moved to Phase 3)
- [>] Component cleanup and resource management operational (moved to Phase 3)

**Phase Completion**: TASK-REMEDIATE-002 completed Backend Service Integration, establishing protocol communication layer for all backend services (Haruspex, PCL, Litany). Phase 2 Interface Implementation is now complete with critical enabling infrastructure operational.

### Phase 3: Integration & Testing (READY TO START - OPTIMIZED)

**Completion Gate**: <100ms interface switching + Full system integration  
**Status**: Phase 2 complete - Phase 3 ready with architectural consolidation complete  
**Task Optimization**: 40→36 tasks (10% reduction through duplicate consolidation)

**Success Criteria**:

- [ ] Full system integration testing passes
- [ ] Performance targets met (<100ms interface switching)
- [ ] Production deployment ready
- [ ] All mock dependencies replaced with real implementations

## Roadmap Reassessment Protocol

### Automatic Reassessment Triggers

#### When Task Status Changes

**Trigger**: Any task marked complete or new task added
**Actions**:

1. [ ] **Check Phase Completion**: Are all tasks in a phase complete?
   - If YES → Update phase status to complete
   - If YES → Archive completed chain to templum-data-tracker.md
   - If YES → Move to next phase activation

2. [ ] **Check Phase Balance**: Do new tasks change phase priorities?
   - If >3 new tasks in one phase → Consider phase restructuring
   - If phase becomes too large → Consider splitting phases

#### When User Changes Priorities  

**Trigger**: User marks task with [!] override or changes [1-9] sequence
**Actions**:

1. [ ] **Update Current Focus**: Reflect new user priority in roadmap
2. [ ] **Check Dependencies**: Ensure priority change doesn't break dependency chain
3. [ ] **Update Phase Gates**: Adjust success criteria if needed

#### When Dependencies Change

**Trigger**: Task completion unblocks new work or creates new dependencies
**Actions**:

1. [ ] **Update Dependency Chains**: Reflect new available work
2. [ ] **Resequence Tasks**: Optimize based on new availability
3. [ ] **Update Phase Timeline**: Adjust estimates based on dependency changes

### Manual Reassessment Occasions

- Weekly review of phase progress
- After completing major components (>20 priority score)
- When external requirements change
- When component reuse strategy changes

## Success Validation Framework

### Phase Completion Validation

Before marking a phase complete:

- [ ] All phase tasks marked [x] in templum-active-tasks.md
- [ ] Success criteria validated through testing
- [ ] No critical blocking issues discovered
- [ ] Patterns documented in templum-patterns.md

### CRITICAL: System Integrity Gates

#### Integration-Ready Implementation Standards

**All phase deliverables must meet system integrity requirements**:

- [ ] **Compilation Gate**: All code compiles without TypeScript errors
- [ ] **Build Gate**: Build process completes successfully  
- [ ] **Regression Gate**: No previously working functionality broken
- [ ] **Integration Gate**: New functionality integrates without breaking existing systems
- [ ] **Documentation Gate**: Required documentation complete and accurate

#### Task Completion Redefinition for Phases

**Phase tasks are NOT complete unless**:

1. **Functional Completion**: Feature works as specified
2. **System Integrity**: Compilation, build, and integration succeed
3. **Quality Validation**: No regressions introduced
4. **Documentation**: Implementation properly documented

**Expanded Status Integration with Phases**:

- **completed**: Meets all system integrity criteria
- **implemented-broken**: Feature done but breaks compilation/build
- **implemented-testing**: Compiles and builds, needs functional validation
- **blocked**: Cannot proceed due to dependencies
- **analysis-required**: Needs investigation before implementation

### Roadmap Currency Validation

Monthly check for roadmap accuracy:

- [ ] Phase gates still aligned with project reality
- [ ] Task classification rules producing good results
- [ ] Discovery protocols capturing all new work
- [ ] Agent success rate >95% for using roadmap guidance

## Integration with Workflow System

### Fix Guide Integration

**Enhanced Documentation Protocol Reference**:

- Pre-task: Consult roadmap for phase context and dependencies
- During task: Use discovery protocols for new issues found
- Post-task: Update roadmap if phase status or priorities changed

#### System Integrity Integration with Fix Guides

**Fix Guide Compliance Requirements**:

- **issue-fix-selector.md**: Must include system integrity requirements in selection criteria
- **quick-fix-guide.md**: Must validate compilation and build success before completion
- **comprehensive-fix-guide.md**: Must include full system integrity validation checklist

**Phase Management with System Integrity**:

- **Phase Progress**: Only count tasks meeting system integrity criteria toward phase completion
- **Phase Gates**: All system integrity gates must pass before phase marked complete
- **Rollback Protocol**: Phase marked incomplete if system integrity compromised
- **Quality Assurance**: System integrity requirements prevent phase regression

**Integration Workflow**:

1. **Pre-Implementation**: Establish baseline system state (compilation, build, functionality)
2. **During Implementation**: Monitor system integrity continuously
3. **Post-Implementation**: Validate all system integrity gates before marking complete
4. **Phase Review**: Verify all phase tasks meet system integrity standards

### Document Integration

- **Task Tracking**: templum-active-tasks.md (authoritative task list)
- **Implementation Patterns**: templum-patterns.md (reusable solutions)
- **Status Dashboard**: templum-tracker-data.md (health and metrics)

---

**Document Type**: Strategic Integration Guide  
**Maintenance**: Update when phases complete or strategy changes  
**Usage**: Consult for ALL task additions and phase management decisions
