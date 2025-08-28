# Haruspex 2.0 Active Tasks Queue

> **Purpose**: Minimal task queue with priority markers and single-occurrence rule  
> **Created**: 2025-08-23  
> **Integration**: Used by issue-fix-selector.md, quick-fix-guide.md, comprehensive-fix-guide.md  
> **Architecture**: See haruspex-patterns.md for implementation patterns

## Task Selection Markers

- `[!]` = User priority override (do this next)
- `[1-9]` = Sequence order
- `[ ]` = Pending
- `[~]` = In progress  
- `[x]` = Complete (ready for removal)
- `[-]` cancelled / wont-do
- `[>]` migrated / forwarded
- `[<]` scheduled / rescheduled
- `[?]` question / blocked

## Priority Queue

- [!] **Analysis Engine Implementation** [TASK-H-001]
  - Priority: 32 | Complexity: 25 | Status: Critical missing file
  - Pattern: backend-service-foundation
  - Dependencies: None (foundation component)
  - See: haruspex-patterns.md#analysis-engine-implementation

- [1] **Prediction Engine Implementation** [TASK-H-002]
  - Priority: 30 | Complexity: 23 | Status: Missing ML predictions service
  - Pattern: ml-engine-architecture
  - Dependencies: Analysis Engine (can start in parallel)
  - See: haruspex-patterns.md#prediction-engine-implementation

- [2] **IPC Server Implementation** [TASK-H-003]
  - Priority: 28 | Complexity: 20 | Status: Missing Templum communication
  - Pattern: ipc-communication-layer
  - Dependencies: None (foundation component)
  - See: haruspex-patterns.md#ipc-server-implementation

## Investigation Queue

- [ ] **Backend Service Dependency Resolution** [TASK-H-004]
  - Priority: 25 | Complexity: 22 | Status: 5+ import errors
  - Pattern: dependency-chain-restoration
  - Dependencies: Analysis Engine, Prediction Engine, Cache Manager
  - See: haruspex-patterns.md#backend-service-dependencies

- [ ] **Cache Manager Architecture Design** [TASK-H-005]
  - Priority: 22 | Complexity: 16 | Status: Missing caching strategy
  - Pattern: analysis-result-caching
  - Dependencies: Analysis Engine (for cache structure)
  - See: haruspex-patterns.md#cache-manager-design

- [ ] **HTTP Server Implementation** [TASK-H-006]
  - Priority: 24 | Complexity: 18 | Status: Missing REST API server
  - Pattern: rest-api-architecture
  - Dependencies: Backend Service, API Contracts
  - See: haruspex-patterns.md#http-server-implementation

## Verification Queue

- [ ] **PCL Integration Workflow Verification** [TASK-H-007]
  - Priority: 15 | Complexity: 8 | Status: Claimed working, needs validation
  - Pattern: integration-testing-validation
  - Dependencies: None (verification task)
  - See: haruspex-patterns.md#pcl-integration-verification

- [ ] **Legacy VSCode Extension Stability** [TASK-H-008]
  - Priority: 10 | Complexity: 6 | Status: Appears working, needs comprehensive testing
  - Pattern: extension-stability-testing
  - Dependencies: None (legacy system verification)
  - See: haruspex-patterns.md#vscode-extension-verification

- [ ] **Component Test Coverage Verification** [TASK-H-009]
  - Priority: 12 | Complexity: 4 | Status: Claims 25+ test files, coverage unclear
  - Pattern: test-coverage-analysis
  - Dependencies: None (verification task)
  - See: haruspex-patterns.md#test-coverage-verification

## Architecture Queue

- [ ] **API Gateway Protocol Integration** [TASK-H-010]
  - Priority: 18 | Complexity: 20 | Status: 11+ TypeScript errors, missing protocols
  - Pattern: api-gateway-restoration
  - Dependencies: API Contracts, HTTP Server
  - See: haruspex-patterns.md#api-gateway-protocols

- [ ] **API Contracts Type System Completion** [TASK-H-011]
  - Priority: 16 | Complexity: 24 | Status: 60+ type errors, missing definitions
  - Pattern: comprehensive-type-system
  - Dependencies: Backend Service design
  - See: haruspex-patterns.md#api-contracts-completion

- [ ] **WebSocket Server Implementation** [TASK-H-012]
  - Priority: 23 | Complexity: 17 | Status: Missing streaming analysis server
  - Pattern: websocket-streaming-architecture
  - Dependencies: Backend Service, Analysis Engine
  - See: haruspex-patterns.md#websocket-server-implementation

- [ ] **Diagnostic System Design** [TASK-H-013]
  - Priority: 14 | Complexity: 15 | Status: Missing health monitoring system
  - Pattern: health-monitoring-framework
  - Dependencies: Backend Service, Analysis Engine
  - See: haruspex-patterns.md#diagnostic-system-design

## Discovered Issues (From TODO Tags)

<!-- Issues discovered during implementation will be added here -->
<!-- Use format: -->
<!-- - [ ] Issue Description [TASK-H-NEW-XXX] | Found in: file.ts:line | Priority: High/Medium/Low -->

---

**Task Count**: 3 priority, 3 investigation, 3 verification, 4 architecture, 0 discovered (13 total)  
**Next Action**: Complete [!] Analysis Engine Implementation  
**Context Required**: haruspex-patterns.md#analysis-engine-implementation
**Roadmap Status**: Phase 1 (Backend Foundation) - 0/3 priority complete
