# Templum 1.0 Active Tasks Queue

> **Purpose**: Minimal task queue with priority markers and single-occurrence rule  
> **Created**: 2025-08-23  
> **Integration**: Used by issue-fix-selector.md, quick-fix-guide.md, comprehensive-fix-guide.md  
> **Architecture**: See templum-patterns.md for implementation patterns

## Task Selection Markers

- `[!]` = User priority override (do this next)
- `[1-9]` = Sequence order (do these in order after !)
- `[ ]` = Pending
- `[~]` = In progress  
- `[x]` = Complete (ready for removal)
- `[-]` cancelled / wont-do
- `[>]` migrated / forwarded
- `[<]` scheduled / rescheduled
- `[?]` question / blocked

## Priority Queue

## Investigation Queue

## Verification Queue

- [ ] [TASK-192] **Integration Test Framework Reality Check**
  - Priority: 18 | Complexity: 12 | Status: Mock-dependent tests
  - Pattern: mock-to-real-testing
  - Dependencies: Real backend implementations
  - See: templum-patterns.md#integration-test-verification

- [ ] [TASK-201] **Performance Claims Validation**
  - Priority: 15 | Complexity: 8 | Status: Cannot test until interfaces work
  - Pattern: performance-validation
  - Dependencies: Interface restoration
  - See: templum-patterns.md#performance-validation

- [ ] [TASK-209] **Test Coverage Reality Assessment**
  - Priority: 12 | Complexity: 6 | Status: High coverage on mocks only
  - Pattern: coverage-analysis
  - Dependencies: Real functionality restoration
  - See: templum-patterns.md#test-coverage-analysis

## Architecture Queue

- [ ] [TASK-355] **Interface Alignment Architecture Review**
  - Priority: 18 | Complexity: 12 | Status: Pattern established, needs expansion
  - Pattern: interface-alignment-review
  - Dependencies: Universal Skin Engine Interface Alignment ✅
  - See: templum-patterns.md#interface-alignment-review

## Discovered Issues (From TODO Tags)

- [ ] [TASK-NEW-005] **Service Discovery Protocols Implementation** | Found in: backend-service-router.ts:118 | Priority: High | Complexity: 15
  - Pattern: backend-service-router-pattern | See: templum-patterns.md#backend-service-integration-unified

- [ ] [TASK-NEW-006] **Real Skin Definition Loading** | Found in: backend-service-router.ts:166 | Priority: High | Complexity: 10
  - Pattern: backend-service-router-pattern | See: templum-patterns.md#backend-service-integration-unified

- [ ] [TASK-NEW-007] **Real Command Execution APIs** | Found in: backend-service-router.ts:262 | Priority: High | Complexity: 12
  - Pattern: backend-service-router-pattern | See: templum-patterns.md#backend-service-integration-unified

- [ ] [TASK-NEW-009] **Skin Caching and Validation Enhancement** | Found in: templum-core.ts:477 | Priority: Medium | Complexity: 8
  - Pattern: templum-universal-interface-adapter | See: templum-patterns.md#universal-interface-orchestration

- [ ] [TASK-NEW-010] **Backend Service Router Session Integration** | Found in: templum-universal-session-manager.ts:69 | Priority: High | Complexity: 8
  - Pattern: backend-service-router-pattern | See: templum-patterns.md#backend-service-integration-unified

- [ ] [TASK-NEW-012] **Backend Service Router Command Routing Integration** | Found in: templum-universal-session-manager.ts:442 | Priority: High | Complexity: 12
  - Pattern: backend-service-router-pattern | See: templum-patterns.md#backend-service-integration-unified

- [ ] [TASK-NEW-018] **Real Haruspex Skin Definition API Call** | Found in: backend-service-router.ts:600 | Priority: High | Complexity: 8
  - Pattern: templum-universal-interface-adapter | See: templum-patterns.md#universal-interface-orchestration
  - Dependencies: Haruspex skin definition endpoint specification
  - Implementation: Replace with actual Haruspex skin API calls

- [ ] [TASK-NEW-020] **Real PCL HTTP Skin Definition API Call** | Found in: backend-service-router.ts:1342 | Priority: High | Complexity: 6
  - Pattern: templum-universal-interface-adapter | See: templum-patterns.md#universal-interface-orchestration
  - Dependencies: PCL HTTP server skin definition endpoint
  - Implementation: Replace with actual PCL HTTP API calls for skin definitions

- [ ] [TASK-NEW-022] **Real Litany WebSocket Skin Definition API Call** | Found in: backend-service-router.ts:1509 | Priority: High | Complexity: 10
  - Pattern: templum-universal-interface-adapter | See: templum-patterns.md#universal-interface-orchestration
  - Dependencies: Litany WebSocket server skin definition message handler
  - Implementation: Replace with actual Litany WebSocket API calls for context management

- [ ] [TASK-NEW-023] **Integrate with Universal Skin Engine Fallback System** | Found in: backend-service-router.ts:270 | Priority: Medium | Complexity: 6
  - Pattern: templum-universal-interface-adapter | See: templum-patterns.md#universal-interface-orchestration
  - Dependencies: Universal Skin Engine default skin generation

- [ ] [TASK-NEW-024] **Enhanced Fallback Coordination with Universal Skin Engine** | Found in: backend-service-router.ts:233 | Priority: Low | Complexity: 4
  - Pattern: templum-universal-interface-adapter | See: templum-patterns.md#universal-interface-orchestration
  - Dependencies: Universal Skin Engine fallback skin generation patterns

- [ ] [TASK-NEW-025] **Enhanced State Manager Configuration Validation** | Found in: adapter-registry.ts:291 | Priority: Medium | Complexity: 4
  - Pattern: enhanced-state-manager-configuration | See: templum-patterns.md#state-manager-configuration
  - Dependencies: Enhanced State Manager configuration patterns

- [ ] [TASK-NEW-026] **PCL Backend Integrator Dependency Injection Enhancement** | Found in: adapter-registry.ts:302 | Priority: High | Complexity: 6
  - Pattern: pcl-backend-integrator-injection | See: templum-patterns.md#backend-integrator-patterns
  - Dependencies: PCL Backend Integrator initialization patterns

- [ ] [TASK-NEW-027] **Resource Manager Configuration Validation and Policy Setup** | Found in: adapter-registry.ts:318 | Priority: Medium | Complexity: 5
  - Pattern: resource-manager-policy-configuration | See: templum-patterns.md#resource-management-patterns
  - Dependencies: Templum Resource Manager policy patterns

- [ ] [TASK-NEW-028] **Component Instance Creation Validation** | Found in: adapter-registry.ts:370 | Priority: Medium | Complexity: 3
  - Pattern: component-factory-validation | See: templum-patterns.md#component-factory-patterns
  - Dependencies: Component factory patterns and configuration validation

- [ ] [TASK-NEW-029] **Cross-Component Dependency Wiring** | Found in: adapter-registry.ts:395 | Priority: High | Complexity: 7
  - Pattern: cross-component-wiring | See: templum-patterns.md#dependency-wiring-patterns
  - Dependencies: Component interface patterns and dependency resolution

- [ ] [TASK-NEW-030] **Component Initialization Ordering** | Found in: adapter-registry.ts:422 | Priority: High | Complexity: 5
  - Pattern: dependency-aware-initialization | See: templum-patterns.md#initialization-ordering-patterns
  - Dependencies: Component initialization patterns and dependency ordering

- [ ] [TASK-NEW-031] **Dependency Integrity Validation** | Found in: adapter-registry.ts:443 | Priority: Medium | Complexity: 4
  - Pattern: dependency-integrity-validation | See: templum-patterns.md#integrity-validation-patterns
  - Dependencies: Component validation patterns and integrity checks

- [ ] [TASK-NEW-032] **Background Service Polling for Recovery** | Found in: backend-service-router.ts:156 | Priority: Medium | Complexity: 6
  - Pattern: backend-service-router-pattern | See: templum-patterns.md#backend-service-integration-unified
  - Dependencies: Service health monitoring, background task scheduling
  - Implementation: Periodic service discovery attempts with exponential backoff

- [ ] [TASK-NEW-033] **Continuous Health Monitoring with Configurable Intervals** | Found in: backend-service-router.ts:425 | Priority: Medium | Complexity: 8
  - Pattern: backend-service-router-pattern | See: templum-patterns.md#backend-service-integration-unified
  - Dependencies: Service health monitoring, background task scheduling
  - Implementation: Periodic health checks with degraded service recovery detection

- [ ] [TASK-NEW-034] **Load Default Backend Skin for Initial Content** | Found in: vscode-adapter-abstracted.ts:154 | Priority: Medium | Complexity: 6
  - Pattern: interface-adapter-pattern | See: templum-patterns.md#interface-adapter-pattern
  - Dependencies: Backend service discovery and default skin configuration
  - Implementation: Initial content loading with backend skin definition for interface adapters

- [ ] [TASK-NEW-056] **VSCode Context Provider Integration** | Found in: interface-adapter-registry.ts:261 | Priority: Medium | Complexity: 4
  - Pattern: factory-registry-pattern | See: templum-patterns.md#factory-registry-pattern
  - Dependencies: VSCode Extension Context, Interface Adapter Registry ✅
  - Phase: Interface

- [ ] [TASK-NEW-037] **Command Interface Adapter Abstraction Layer Implementation** | Found in: interface-adapter-registry.ts:271 | Priority: Medium | Complexity: 6
  - Pattern: abstraction-layer-architecture | See: templum-patterns.md#abstraction-layer-architecture
  - Dependencies: ITemplumOrchestrator interface ✅, Interface adapter pattern ✅
  - Implementation: Create abstracted command interface adapter following CLI and VSCode patterns, complete factory registration

- [ ] [TASK-NEW-036] **Dynamic PCL Component Loading Implementation** | Found in: component-transfer-strategy.ts:511 | Priority: High | Complexity: 6
  - Pattern: pcl-component-integration | See: templum-patterns.md#pcl-component-integration
  - Dependencies: Real PCL component paths, dynamic import system
  - Implementation: Replace mock component loading with actual dynamic import of PCL components for real validation

- [ ] [TASK-NEW-038] **Fallback State Synchronization for Interface Adapter Failures** | Found in: templum-universal-session-manager.ts:803 | Priority: Medium | Complexity: 6
  - Pattern: universal-interface-orchestration | See: templum-patterns.md#universal-interface-orchestration
  - Dependencies: Interface adapter error recovery patterns, state synchronization system ✅
  - Implementation: Interface state synchronization error handling and fallback mechanisms

- [ ] [TASK-NEW-039] **Comprehensive Interface State Synchronization Recovery** | Found in: templum-universal-session-manager.ts:838 | Priority: Medium | Complexity: 8
  - Pattern: universal-interface-orchestration | See: templum-patterns.md#universal-interface-orchestration  
  - Dependencies: Interface adapter resilience patterns, fallback mechanisms, state synchronization system ✅
  - Implementation: Interface state synchronization error recovery and comprehensive failover handling

- [ ] [TASK-NEW-040] **Backend Session State Synchronization** | Found in: templum-universal-session-manager.ts:868 | Priority: High | Complexity: 12
  - Pattern: backend-service-integration-unified | See: templum-patterns.md#backend-service-integration-unified
  - Dependencies: Backend service session management, state persistence, backend service router ✅
  - Implementation: Backend service state coordination during interface switching with session persistence

- [ ] [TASK-NEW-041] **Enhanced PCL Component Item Rendering** | Found in: pcl-rendering-adapter.ts:373 | Priority: Medium | Complexity: 4
  - Pattern: pcl-component-rendering-enhancement | See: templum-patterns.md#pcl-component-patterns
  - Dependencies: PCL component style patterns, theme system integration
  - Phase: Integration
  - Implementation: Enhanced individual menu item rendering using sophisticated PCL component styling patterns for visual consistency

- [ ] [TASK-NEW-046] **VSCode Service Tree Provider Implementation** | Found in: extension.ts:228 | Priority: Medium | Complexity: 8
  - Pattern: vscode-tree-provider | Dependencies: Backend service discovery, TreeDataProvider interface
  - Phase: Interface

- [ ] [TASK-NEW-048] **Interface Switching Implementation** | Found in: extension.ts:277 | Priority: High | Complexity: 10
  - Pattern: universal-interface-orchestration | See: templum-patterns.md#universal-interface-orchestration
  - Dependencies: Universal Interface Manager, interface adapters
  - Phase: Interface

- [ ] [TASK-NEW-049] **Service Tree Refresh Implementation** | Found in: extension.ts:301 | Priority: Medium | Complexity: 4
  - Pattern: vscode-tree-provider | Dependencies: Service tree provider, backend service discovery
  - Phase: Interface

- [ ] [TASK-NEW-050] **Service Connection Implementation** | Found in: extension.ts:311 | Priority: High | Complexity: 8
  - Pattern: backend-service-router-pattern | See: templum-patterns.md#backend-service-integration-unified
  - Dependencies: Backend service router, connection management
  - Phase: Interface

- [ ] [TASK-NEW-051] **Service Disconnection Implementation** | Found in: extension.ts:327 | Priority: Medium | Complexity: 6
  - Pattern: backend-service-router-pattern | See: templum-patterns.md#backend-service-integration-unified
  - Dependencies: Backend service router, connection management
  - Phase: Interface

- [ ] [TASK-NEW-052] **Comprehensive Extension Cleanup Implementation** | Found in: extension.ts:545 | Priority: High | Complexity: 8
  - Pattern: extension-resource-management | Dependencies: Resource cleanup, connection termination, state persistence
  - Phase: Interface

---

## Dependency Analysis Integration

> **Comprehensive Analysis**: See `templum-dependency-analysis-report.md` for complete dependency analysis  
> **Generated**: 2025-08-27 | **Methodology**: Autonomous dependency analysis workflow  
> **Key Findings**: TASK-088 critical bottleneck blocks 4 investigation tasks, TASK-227 enables parallel architectural work

**Critical Path**: ~~TASK-088~~ → ~~TASK-136~~ → ~~TASK-163~~ → ~~TASK-173~~ → TASK-192 → TASK-201 → TASK-209
**Immediate Unblocking**: 7 tasks ready (2 zero-dependency + 5 single-dependency)  
**Phantom Dependencies**: TASK-201, TASK-209 could proceed with enhanced mock testing

---

**Recent Changes**: TASK-NEW-019 completed (2025-08-28) Real HTTP Communication Implementation (documentation update), TASK-NEW-017 completed (2025-08-28) Real IPC Communication Implementation, TASK-147 completed (2025-08-27) Critical interface adapter dependency analysis, TASK-NEW-045 completed (2025-08-27), TASK-163 completed (2025-08-27), 6 new real service integration tasks added (TASK-NEW-017 through TASK-NEW-022)  
**Roadmap Status**: Phase 2 (Interface Implementation) - PHASE COMPLETE (Session Management, Architectural Separation, Backend Service Integration)
**Phase 3 Status**: Phase 3 (Integration & Testing) - ACCELERATING PROGRESS (Foundation: ~~TASK-088~~, ~~TASK-227~~, ~~TASK-275~~, ~~TASK-239~~, ~~TASK-136~~, ~~TASK-163~~ | Key Infrastructure: ~~TASK-287~~ (Observability) | Unblocked: TASK-192, TASK-201, TASK-209, TASK-251, TASK-355)  
**Architecture Status**: Universal interface adapter pattern established ✅, Session management pattern established ✅, Architectural compliance audit complete ✅, **Backend protocol communication layer complete ✅ (Real service integration patterns established)**, Dependency injection system complete ✅, Enhanced service discovery complete ✅, Abstraction layer architecture complete ✅, **Universal Skin Engine PCL integration complete ✅ (75% code reuse achieved)**, PCL component integration pattern established ✅
