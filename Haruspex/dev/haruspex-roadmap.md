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

### Templum 2.1 Migration Architecture Approach

**Strategy**: Migrate from VSCode-centric 2.0 to Templum-compatible 2.1 pure backend  
**Focus**: HTTP Gateway → Universal Skin → Auto-Registration → Backend Refactoring  
**Risk**: Medium - architectural migration with clear 2.1 specification and Templum integration patterns

### Component Development Priority (2.1 Migration)

1. **Templum Foundation**: HTTP Gateway, Universal Skin Provider, Auto-Registration, Protocol Adapter (immediate)
2. **Backend Migration**: Backend Service refactoring, Core Engine HTTP migration, VSCode decoupling, Command system
3. **Integration & Validation**: Health monitoring, caching optimization, model integration, performance validation

## 📋 Implementation Phases

### Phase 1: Templum Foundation (ACTIVE)

**Completion Gate**: Templum 1.2 integration operational  
**Status**: 0/4 foundation tasks complete  
**Current Focus**: [!] HTTP Gateway Implementation for Templum [TASK-H-M01]

**Phase 1 Migration Tasks** (Reference only - see haruspex-active-tasks.md for details):

- [!] HTTP Gateway Implementation for Templum
- [1] Universal Skin Provider Implementation  
- [2] Auto-Registration Service Implementation
- [3] Templum Protocol Adapter Implementation

**Success Criteria**:

- [ ] HTTP Gateway serves required Templum endpoints (/getSkinDefinition, /executeCommand, /health)
- [ ] Universal Skin Definition generated and Templum-compliant
- [ ] Auto-registration works with ~/.templum/services directory
- [ ] Templum can discover, connect, and communicate with Haruspex
- [ ] All basic commands work via HTTP instead of IPC

### Phase 2: Backend Migration (PENDING)

**Completion Gate**: Pure backend architecture operational without VSCode  
**Status**: Not started - awaits Phase 1 completion

**Phase 2 Migration Focus**: Core refactoring and VSCode decoupling

**Success Criteria**:

- [ ] Backend Service operates without VSCode dependencies
- [ ] Core Engine provides analysis via HTTP endpoints  
- [ ] VSCode extension fully decoupled from backend functionality
- [ ] Command execution system maps skin commands to HTTP operations
- [ ] All existing functionality preserved through HTTP API

### Phase 3: Integration & Validation (PENDING)  

**Completion Gate**: Full Haruspex 2.1 compliance and production readiness  
**Status**: Not started - awaits Phase 2 completion

**Phase 3 Migration Focus**: Integration testing, performance optimization, multi-interface support

**Success Criteria**:

- [ ] Health monitoring provides comprehensive Templum-compliant status
- [ ] Cache management optimized for HTTP request/response patterns  
- [ ] ML model management integrated with HTTP prediction endpoints
- [ ] Configuration system works for pure backend deployment
- [ ] All performance targets met (<200ms health, <2s analysis, <5s predictions)
- [ ] Multi-interface compatibility (VSCode, CLI, command-line) validated

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
