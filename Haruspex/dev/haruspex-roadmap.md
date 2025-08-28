# Haruspex Strategic Roadmap & Task Integration Guide

> **Purpose**: Living strategic guide for task classification, phase management, and integration protocols  
> **Created**: 2025-08-23 (Transformed from haruspex-fix-planning.md)  
> **Integration**: Used by agents for task discovery, classification, and roadmap updates  
> **Task Tracking**: All individual tasks tracked in haruspex-active-tasks.md (single source of truth)

## 🔄 Task Discovery & Integration Protocol

### Discovery Entry Points

#### 1. In-Workflow Discovery (TODO Tags)

**When**: During implementation of existing tasks  
**Pattern**:

```typescript
// TODO: [TASK-H-NEW-XXX] Brief description
// Priority: High|Medium|Low | Complexity: 1-10
// Location: Context where discovered
// Dependencies: List dependencies
// Phase: Foundation|Services|Integration
```

**Processing**: During post-implementation documentation phase

#### 2. Architectural Discovery (Analysis & Reviews)

**When**: During /analyze, /improve, backend service analysis, or architecture reviews  
**Pattern**: Direct addition to haruspex-active-tasks.md using classification guide below  
**Trigger**: Any backend architecture work, service implementation, or system analysis

#### 3. External Discovery (User Requests, Issues)

**When**: User directives, bug reports, feature requests, or external requirements  
**Pattern**: Create task with appropriate phase assignment using classification guide  
**Trigger**: Any external input requiring backend development work

### Task Classification Guide

#### Phase Assignment Rules

When adding ANY new task, determine phase based on:

**Foundation Phase**:

- Core backend services (Analysis Engine, Prediction Engine, IPC Server)
- Essential communication protocols and interfaces
- Basic service discovery and registration
- Foundational architecture components

**Services Phase**:

- HTTP/WebSocket servers and API layers
- Cache management and data persistence
- Service integration and orchestration
- Backend service dependency resolution

**Integration Phase**:

- Cross-system coordination and testing
- Performance optimization and monitoring
- Production deployment features
- Legacy system integration validation

#### Priority Scoring Framework (1-35 scale)

**Impact Score (1-12)**:

- 12: Blocks all backend functionality, critical service missing
- 9-11: Affects core analysis capabilities, major service disruption
- 6-8: Affects secondary services, integration issues
- 1-5: Minor improvements, non-critical features

**Complexity Score (1-12)**:

- 12: New service architecture, ML/AI implementation, >15 files
- 9-11: Multi-service integration, 8-15 files, new protocols
- 6-8: Single service implementation, 4-8 files, established patterns  
- 1-5: Configuration changes, <4 files, clear solutions

**Urgency Score (1-11)**:

- 11: Blocking all development, backend completely non-functional
- 8-10: Blocking other services, critical path dependency
- 5-7: Important for functionality, affects integration timeline
- 1-4: Enhancement, can be deferred without impact

> Total Priority = Impact + Complexity + Urgency

## 🚀 Implementation Strategy

### Backend Service Architecture Approach

**Strategy**: Build missing backend services using proven architectural patterns  
**Focus**: Analysis Engine → Prediction Engine → Communication Layer → Integration  
**Risk**: Medium - architectural work with established patterns from legacy system

### Component Development Priority

1. **Foundation Services**: Analysis Engine, Prediction Engine, IPC Server (immediate)
2. **Service Layer**: HTTP/WebSocket servers, Cache Manager, Backend Service restoration
3. **Integration Layer**: API Gateway, Type System, Diagnostic System, comprehensive testing

## 📋 Implementation Phases

### Phase 1: Backend Foundation (ACTIVE)

**Completion Gate**: Core backend services operational  
**Status**: 0/3 priority tasks complete  
**Current Focus**: [!] Analysis Engine Implementation

**Phase 1 Tasks** (Reference only - see haruspex-active-tasks.md for details):

- [!] Analysis Engine Implementation
- [1] Prediction Engine Implementation  
- [2] IPC Server Implementation

**Success Criteria**:

- [ ] Analysis Engine processes code analysis requests
- [ ] Prediction Engine provides ML-based predictions
- [ ] IPC Server enables Templum communication
- [ ] Core backend compilation successful (0 critical errors)

### Phase 2: Service Integration (PENDING)

**Completion Gate**: Backend services integrated and functional  
**Status**: Not started - awaits Phase 1 completion

**Success Criteria**:

- [ ] Backend Service dependency chain restored
- [ ] HTTP/WebSocket servers operational
- [ ] Cache management functional
- [ ] Service-to-service communication working

### Phase 3: System Integration (PENDING)  

**Completion Gate**: Full system integration with legacy components  
**Status**: Not started - awaits Phase 2 completion

**Success Criteria**:

- [ ] API Gateway protocols complete
- [ ] Type system fully implemented
- [ ] Diagnostic monitoring operational
- [ ] PCL integration verified functional

## 🔄 Roadmap Reassessment Protocol

### Automatic Reassessment Triggers

#### When Task Status Changes

**Trigger**: Any task marked complete or new backend issue discovered
**Actions**:

1. [ ] **Check Phase Completion**: Are all phase tasks complete?
   - If YES → Update phase status to complete
   - If YES → Move to next phase activation

2. [ ] **Check Service Dependencies**: Do new tasks affect dependency chains?
   - If new backend service needed → Add to Foundation phase
   - If integration issue → Add to appropriate service integration queue

#### When Backend Architecture Changes

**Trigger**: Service architecture modifications or new system requirements
**Actions**:

1. [ ] **Update Dependency Mapping**: Reflect new service relationships
2. [ ] **Resequence Services**: Optimize based on new architecture
3. [ ] **Update Phase Gates**: Adjust success criteria for architectural changes

## 📊 Integration with Workflow System

### Fix Guide Integration

**Enhanced Documentation Protocol Reference**:

- Pre-task: Consult roadmap for phase context and service dependencies
- During task: Use discovery protocols for new backend issues found
- Post-task: Update roadmap if phase status or service architecture changed

### Document Integration

- **Task Tracking**: haruspex-active-tasks.md (authoritative task list)
- **Implementation Patterns**: haruspex-patterns.md (backend service solutions)
- **Historical Archive**: haruspex-tracker-data.md (completed work and lessons)
- **Status Dashboard**: haruspex-tracker-data.md (health and metrics)

---

**Document Type**: Strategic Integration Guide  
**Maintenance**: Update when phases complete or backend architecture changes  
**Usage**: Consult for ALL task additions and backend service development decisions
