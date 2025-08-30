# Haruspex 2.0 Active Tasks Queue

> **Purpose**: Minimal task queue with priority markers and single-occurrence rule  
> **Created**: 2025-08-23  
> **Integration**: Used by issue-fix-selector.md, quick-fix-guide.md, comprehensive-fix-guide.md  
> **Architecture**: See haruspex-patterns.md for implementation patterns

## Task Selection Markers

- `[!]` = User priority override (do this next)
- `[n]` = Sequence order
- `[ ]` = Pending
- `[~]` = In progress  
- `[x]` = Complete (ready for removal)
- `[-]` cancelled / wont-do
- `[>]` migrated / forwarded
- `[<]` scheduled / rescheduled
- `[?]` question / blocked

## 1.2 Migration - Templum 2.1 Compatible Backend

### Foundation Tasks (Priority Queue)

- [x] **Universal Skin Provider Implementation** [TASK-H-M02] ✅ **COMPLETED**
  - Priority: 33 | Complexity: 26 | Status: Fully implemented and validated
  - Pattern: universal-skin-definition-generator (✅ established)
  - Dependencies: Backend service architecture knowledge (✅ completed)
  - Description: Create complete Universal Skin Definition with commands, views, menus, themes
  - Success: Skin definition validates against Templum 1.2 standards (✅ validated)
  - **Completion**: 2025-08-30 | Fix: `dev/fixes/2025-08-30-103100-comprehensive-fix-universal-skin-provider-implementation.md`

- [x] **Auto-Registration Service Implementation** [TASK-H-M03] ✅ **COMPLETED**
  - Priority: 31 | Complexity: 22 | Status: Fully implemented and validated
  - Pattern: templum-auto-registration-enhanced (✅ established)
  - Dependencies: None (foundation component)
  - Description: Enhanced auto-registration for ~/.templum/services directory with heartbeat
  - Success: Haruspex auto-registers and maintains heartbeat with Templum (✅ validated)
  - **Completion**: 2025-08-30 | Fix: `dev/fixes/2025-08-30-104100-comprehensive-fix-auto-registration-service-implementation.md`

- [x] **Templum Protocol Adapter Implementation** [TASK-H-M04] ✅ **COMPLETED**
  - Priority: 29 | Complexity: 24 | Status: HTTP-first communication implemented
  - Pattern: ipc-to-http-protocol-migration (✅ established)
  - Dependencies: HTTP Gateway, existing IPC system (✅ completed)
  - Description: Convert existing IPC communication to Templum-compatible HTTP protocol
  - Success: All commands work via HTTP instead of IPC (✅ validated)
  - **Completion**: 2025-08-30 | Fix: `dev/fixes/2025-08-30-105902-comprehensive-fix-templum-protocol-adapter-implementation.md`

### Core Refactoring Tasks (Investigation Queue)

- [x] **Backend Service Templum Integration** [TASK-H-M05] ✅ **COMPLETED**
  - Priority: 27 | Complexity: 30 | Status: Pure backend architecture implemented
  - Pattern: backend-service-templum-migration (✅ established)
  - Dependencies: HTTP Gateway, Universal Skin Provider (✅ completed)
  - Description: Update HaruspexBackendService for 2.1 pure backend architecture
  - Success: Backend service operates without VSCode dependencies (✅ validated)
  - **Completion**: 2025-08-30 | Fix: `dev/fixes/2025-08-30-115203-comprehensive-fix-backend-service-templum-integration.md`

- [x] **Core Engine HTTP Migration** [TASK-H-M06] ✅ **COMPLETED**
  - Priority: 25 | Complexity: 28 | Status: HTTP-first architecture implemented  
  - Pattern: core-engine-http-first-migration (✅ established)
  - Dependencies: Backend Service refactoring (✅ completed)
  - Description: Refactor HaruspexCore for HTTP-first communication with Templum
  - Success: Core engine provides analysis via HTTP endpoints (✅ validated)
  - **Completion**: 2025-08-30 | Fix: `dev/fixes/2025-08-30-185830-comprehensive-fix-core-engine-http-first-migration.md`

- [x] **VSCode Extension Decoupling** [TASK-H-M07] ✅ **COMPLETED**
  - Priority: 23 | Complexity: 32 | Status: Dependency injection architecture implemented
  - Pattern: vscode-pure-backend-separation (✅ established)
  - Dependencies: Backend Service migration ✅, Core Engine migration ✅ (both completed)
  - Description: Extract pure backend functionality from VSCode extension wrapper
  - Success: Backend runs independently without VSCode runtime (✅ validated)
  - **Completion**: 2025-08-30 | Fix: `dev/fixes/2025-08-30-143000-comprehensive-fix-vscode-extension-decoupling.md`

- [6] **Command Execution System Templum Compatibility** [TASK-H-M08]
  - Priority: 21 | Complexity: 20 | Status: Command mapping needed
  - Pattern: templum-command-mapping-system
  - Dependencies: Universal Skin Provider, HTTP Gateway
  - Description: Implement command execution system that maps skin commands to operations
  - Success: All skin-defined commands execute correctly via /executeCommand

### Integration Tasks (Architecture Queue)

- [ ] **Health Monitoring Templum Compliance** [TASK-H-M09]
  - Priority: 19 | Complexity: 16 | Status: Health endpoints needed
  - Pattern: templum-health-monitoring-integration
  - Dependencies: HTTP Gateway, Diagnostic System
  - Description: Update diagnostics system for Templum health check requirements
  - Success: /health endpoint provides comprehensive system status

- [ ] **Cache Manager HTTP Optimization** [TASK-H-M10]
  - Priority: 17 | Complexity: 18 | Status: HTTP caching strategy needed
  - Pattern: http-request-caching-optimization
  - Dependencies: Cache Manager, HTTP Gateway
  - Description: Optimize cache management for HTTP request/response patterns
  - Success: Analysis results cached efficiently for HTTP requests

- [ ] **Model Manager Templum Integration** [TASK-H-M11]
  - Priority: 15 | Complexity: 14 | Status: ML model HTTP integration
  - Pattern: ml-model-http-service-integration
  - Dependencies: Prediction Engine, HTTP Gateway
  - Description: Integrate ML model management with HTTP-based prediction requests
  - Success: ML models serve predictions via HTTP endpoints

- [ ] **Configuration System Templum Compatible** [TASK-H-M12]
  - Priority: 13 | Complexity: 12 | Status: Config system modernization
  - Pattern: templum-compatible-configuration
  - Dependencies: Backend Service architecture
  - Description: Update configuration system for pure backend deployment
  - Success: Backend configurable without VSCode settings dependency

### Validation Tasks (Verification Queue)

- [ ] **Templum Connection Integration Testing** [TASK-H-M13]
  - Priority: 11 | Complexity: 8 | Status: End-to-end testing needed
  - Pattern: templum-integration-e2e-testing
  - Dependencies: All foundation tasks complete
  - Description: Comprehensive testing of Templum discovery, connection, and command execution
  - Success: Templum successfully discovers, connects, and executes all commands

- [ ] **Universal Skin Definition Validation** [TASK-H-M14]
  - Priority: 9 | Complexity: 6 | Status: Skin compliance testing
  - Pattern: skin-definition-compliance-testing
  - Dependencies: Universal Skin Provider
  - Description: Validate generated skin definition against Templum 1.2 standards
  - Success: Skin definition passes all Templum compatibility tests

- [ ] **HTTP Performance Benchmarking** [TASK-H-M15]
  - Priority: 7 | Complexity: 10 | Status: Performance validation needed
  - Pattern: http-api-performance-benchmarking
  - Dependencies: HTTP Gateway, all backend components
  - Description: Benchmark HTTP API performance against 2.1 spec requirements
  - Success: <200ms health checks, <2s analysis commands, <5s predictions

- [ ] **Multi-Interface Compatibility Testing** [TASK-H-M16]
  - Priority: 5 | Complexity: 12 | Status: Cross-interface testing needed
  - Pattern: multi-interface-compatibility-validation
  - Dependencies: All migration tasks complete
  - Description: Test backend compatibility with VSCode, CLI, and command-line interfaces
  - Success: Single backend serves all interface types correctly

### Migration Notes

**Architecture Change Summary**: Migration from VSCode-centric 2.0 to Templum-compatible 2.1 pure backend
**Key Dependencies**: Templum 1.2 compatibility, HTTP-first communication, self-describing interfaces
**Breaking Changes**: IPC → HTTP, VSCode dependency removal, skin-driven interface definitions
**Validation Priority**: Foundation tasks must complete before integration testing

## Priority Queue

- [ ] **Analysis Engine Implementation** [TASK-H-001]
  - Priority: 32 | Complexity: 25 | Status: Critical missing file
  - Pattern: backend-service-foundation
  - Dependencies: None (foundation component)
  - See: haruspex-patterns.md#analysis-engine-implementation

- [ ] **Prediction Engine Implementation** [TASK-H-002]
  - Priority: 30 | Complexity: 23 | Status: Missing ML predictions service
  - Pattern: ml-engine-architecture
  - Dependencies: Analysis Engine (can start in parallel)
  - See: haruspex-patterns.md#prediction-engine-implementation

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

## Verification Queue

- [ ] **PCL Integration Workflow Verification** [TASK-H-007]
  - Priority: 15 | Complexity: 8 | Status: Claimed working, needs validation
  - Pattern: integration-testing-validation
  - Dependencies: None (verification task)
  - See: haruspex-patterns.md#pcl-integration-verification

- [ ] **Component Test Coverage Verification** [TASK-H-009]
  - Priority: 12 | Complexity: 4 | Status: Claims 25+ test files, coverage unclear
  - Pattern: test-coverage-analysis
  - Dependencies: None (verification task)
  - See: haruspex-patterns.md#test-coverage-verification

## Architecture Queue

- [ ] **API Contracts Type System Completion** [TASK-H-011]
  - Priority: 16 | Complexity: 24 | Status: 60+ type errors, missing definitions
  - Pattern: comprehensive-type-system
  - Dependencies: Backend Service design
  - See: haruspex-patterns.md#api-contracts-completion

- [<] **WebSocket Server Implementation** [TASK-H-012] - **DEFERRED IN 2.1**
  - Priority: 23 | Complexity: 17 | Status: Not specified in 2.1 spec, HTTP-first approach
  - Pattern: websocket-streaming-architecture → Future enhancement
  - Dependencies: Backend Service, Analysis Engine → HTTP Gateway foundation
  - Migration: Focus on HTTP implementation first, WebSocket as future enhancement

- [ ] **Diagnostic System Design** [TASK-H-013]
  - Priority: 14 | Complexity: 15 | Status: Missing health monitoring system
  - Pattern: health-monitoring-framework
  - Dependencies: Backend Service, Analysis Engine
  - See: haruspex-patterns.md#diagnostic-system-design

## Discovered Issues (From TODO Tags)

### Infrastructure Dependencies (Discovered during TASK-H-M01)

- [ ] **Analysis Engine Stub Implementation** [TASK-H-NEW-006] | Found in: haruspex-backend-service.ts:22 | Priority: High
  - Complexity: 6 | Dependencies: Core analysis interfaces
  - Phase: Infrastructure | Pattern: backend-service-foundation  
  - Description: Missing analysis engine implementation referenced by backend service

- [ ] **Prediction Engine Stub Implementation** [TASK-H-NEW-007] | Found in: haruspex-backend-service.ts:23 | Priority: Medium
  - Complexity: 5 | Dependencies: Analysis engine output types
  - Phase: Infrastructure | Pattern: ml-engine-architecture
  - Description: Missing prediction engine implementation referenced by backend service

### Cache Management Integration (Discovered during command mapping)

- [ ] **Cache Clearing Functionality Integration** [TASK-H-NEW-001] | Found in: api-gateway.ts:539 | Priority: Medium  
  - Complexity: 3 | Dependencies: Cache Manager interface
  - Phase: Integration | Pattern: analysis-result-caching
  - Description: Implement cache clearing functionality for haruspex.clearCache command

- [ ] **Model Refresh Functionality Integration** [TASK-H-NEW-002] | Found in: api-gateway.ts:551 | Priority: Medium
  - Complexity: 4 | Dependencies: Prediction Engine, Model Manager  
  - Phase: Integration | Pattern: ml-engine-architecture
  - Description: Implement model refresh functionality for haruspex.refreshModels command

---

**Task Count**: 13 migration (0 foundation remaining, 2 refactoring, 4 integration, 4 validation), 2 priority, 3 investigation, 3 verification, 2 architecture, 4 discovered (25 total active)  
**Migration Count**: 8 migrated, 1 deprecated, 1 deferred from legacy tasks
**Completed Infrastructure**: 7 critical implementations resolved ✅ (HTTP Server + Request Router + API Contracts Type System + Universal Skin Provider + Auto-Registration Service + Templum Protocol Adapter + Backend Service Templum Integration)
**Next Action**: Complete [4] Core Engine HTTP Migration [TASK-H-M06] (Interface phase continuing)
**Context Required**: backend-service-templum-migration pattern (available)
**Roadmap Status**: Phase 1 (Templum Foundation) - COMPLETE ✅ (HTTP infrastructure + type system + skin provider + auto-registration + protocol adapter all operational)
**Migration Status**: 2.0 → 2.1 - Foundation Phase Complete, Interface Phase in progress (Core Engine HTTP migration next)
**Architecture Change**: VSCode-centric → Templum-compatible pure backend (HTTP Gateway ✅ + Request Router ✅ + Type System ✅ + Skin Provider ✅ + Auto-Registration ✅ + Protocol Adapter ✅ + Backend Service Integration ✅ operational)
