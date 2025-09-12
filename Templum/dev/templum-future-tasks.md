# Templum 1.0 Active Tasks Queue

> **Purpose**: Dependency-optimized task queue with priority markers and single-occurrence rule
> **Created**: 2025-08-23
> **Updated**: 2025-09-01 - Dependency analysis optimization applied
> **Integration**: Used by issue-fix-selector.md, quick-fix-guide.md, comprehensive-fix-guide.md
> **Architecture**: See templum-patterns.md for implementation patterns

## Task Selection Markers

- `[!]` = priority (do this next)
- `[n]` = sequence-order (do these in order after !)
- `[ ]` = pending
- `[~]` = in-progress  
- `[x]` = complete
- `[-]` = cancelled
- `[>]` = forwarded
- `[<]` = scheduled
- `[?]` = blocked/unknown
- `[B]` = implemented-broken: core logic done but compilation/tests failing (requires structural fix)
- `[T]` = implemented-testing: compiles but needs functional validation

## Pattern Feedback

> **Purpose**: Tasks derived from implementer recommendations and pattern feedback
> **Source**: Backend Service Integration Unified pattern implementation experiences
> **Priority**: Pattern enhancement and architectural improvements

### Timing & Documentation Enhancement

- [ ] [PATTERN-TIMING-001] **Post-Initialization Timing Guidance Enhancement** | Priority: Medium | Complexity: 4
  - Pattern: templum-patterns.md#backend-service-integration-unified-pattern
  - Dependencies: Pattern analysis from TASK-SKIN-007 implementer feedback
  - Implementation: Add explicit timing guidance section to pattern documentation
  - **Implementer Feedback Source**: "Consider adding explicit guidance on post-initialization timing for skin loading to avoid initialization order issues"
  - Location: templum-patterns.md, integration timing documentation
  - **PATTERN IMPACT**: Prevents initialization order issues for future implementations

- [ ] [PATTERN-PERFORMANCE-001] **Performance Baseline Tracking Integration** | Priority: Medium | Complexity: 6
  - Pattern: templum-patterns.md#backend-service-integration-unified-pattern
  - Dependencies: TASK-SKIN-007 comprehensive testing pattern
  - Implementation: Extend testing pattern with performance baseline tracking for regression detection
  - **Implementer Feedback Source**: "Consider adding performance baseline tracking to the pattern for regression detection"
  - Location: Testing patterns, performance validation systems
  - **PATTERN IMPACT**: Enables automated regression detection in comprehensive validation workflows

### Architecture Enhancement

- [ ] [PATTERN-CACHE-001] **Skin Definition Caching System** | Priority: Medium | Complexity: 8
  - Pattern: templum-patterns.md#skin-definition-caching-pattern | Dependencies: Version extraction patterns from TASK-SKIN-006
  - Implementation: Service-level skin definition caching to prevent repeated loading and circular dependencies
  - **Implementer Feedback Source**: "Consider caching skin definitions at service level to avoid repeated loading. The hierarchical approach works well for progressive enhancement scenarios"
  - Location: src/backend/backend-service-router.ts, skin loading infrastructure
  - **PATTERN IMPACT**: Eliminates circular dependency risks and improves performance for hierarchical data extraction

- [ ] [PATTERN-EXTENSION-001] **Two-Tier Backend Categorization Framework** | Priority: Low | Complexity: 12
  - Pattern: templum-patterns.md#multi-tier-backend-classification-pattern | Dependencies: TASK-SKIN-005 two-tier prioritization system
  - Implementation: Extend two-tier approach to support additional backend categories beyond health-enabled/minimal
  - **Implementer Feedback Source**: "The two-tier approach could be extended to support additional backend categories in the future"
  - Location: Backend prioritization system, capability profile detection
  - **PATTERN IMPACT**: Future-proofs backend categorization system for evolving backend types

- [ ] [PATTERN-VALIDATION-001] **Architecture Validation Pattern Extension** | Priority: Medium | Complexity: 10
  - Pattern: templum-patterns.md#comprehensive-architecture-validation-pattern | Dependencies: TASK-SKIN-007 testing pattern
  - Implementation: Extract and generalize architecture validation approach for other complex integration patterns
  - **Implementer Feedback Source**: "The architecture validation approach could be extended to other complex integration patterns"
  - Location: Pattern templates, validation frameworks
  - **PATTERN IMPACT**: Creates reusable validation framework for complex architectural integrations

## CODE QUALITY IMPROVEMENT (ESLint Cleanup)

### Track B: Type Safety Issues - 1,033 Warnings

- [T] [TASK-ESLINT-006] **Replace Any Types in Backend Services → Enhanced Backend Type System** | Priority: MEDIUM | Complexity: 10 (8+2) | **TYPE-SAFETY**
  - Pattern: any-type-replacement-pattern | Issues: ~280 warnings in backend/*.ts
  - Consolidated From: TASK-ESLINT-006 + TASK-ESLINT-006-FOLLOWUP (interface consistency)
  - Scope: src/backend/ (backend-service-router.ts has ~87 any types, others distributed)
  - Issue Types: @typescript-eslint/no-explicit-any (warnings) - service responses, config objects, HTTP data
  - Implementation Approach:
    1. Define proper interfaces for service responses, create typed config objects, add HTTP request/response types ✅ COMPLETED
    2. Fix IPCMessage interface inconsistencies (missing properties: success, data) ✅ COMPLETED
    3. Extend IPCMessageType enum with missing values ('skin_definition_updated', 'context_sync_notification') ✅ COMPLETED
    4. Create specialized message interfaces for different IPC communication patterns ✅ COMPLETED
    5. Enhanced validation and compilation resolution ✅ COMPLETED
  - Location: src/backend/backend-service-router.ts (TODO resolved), src/backend/service-discovery.ts  
  - Validation: `npm run lint -- src/backend/*.ts` shows reduced no-explicit-any warnings + TypeScript compilation passes ✅
  - **TYPE IMPACT**: Critical for backend service type safety and maintainability - ACHIEVED
  - **PROGRESS**: 14 any types eliminated, complete interface architecture established, ALL compilation errors resolved ✅
  - **VALIDATION ISSUES RESOLVED**: 2025-09-04 TypeScript compilation errors fixed:
    - Line 1687: Fixed by providing proper fallback response instead of null ✅
    - Line 1873: Fixed transform function parameter type from BackendServicePayload to unknown ✅
    - Line 1934: Fixed by providing proper fallback response instead of null ✅
    - Line 3012: Fixed Promise resolver type constraint with proper casting ✅
  - **COMPILATION STATUS**: All TypeScript errors resolved - ready for validation ✅

- [T] [TASK-ESLINT-007] **TASK-ESLINT-006 Continuation → Complete Backend Type Safety** | Priority: MEDIUM | Complexity: 10 | **TYPE-SAFETY**
  - Pattern: any-type-replacement-pattern
  - **IMPLEMENTATION COMPLETE**: All 22 explicit any types eliminated from backend-service-router.ts
  - **Architecture Enhancements**: Extended BackendServicePayload type system with proper generic constraints
  - **Files Modified**: src/backend/backend-service-router.ts (100% any-type elimination achieved)
  - **Validation**: TypeScript compilation passes, ESLint shows 0 no-explicit-any warnings
  - **TYPE IMPACT**: Complete backend service type safety achieved - all API methods, return types, and IPC communication properly typed
  - **VALIDATION ISSUES RESOLVED**: 2025-09-04 TypeScript compilation errors fixed together with TASK-ESLINT-006:
    - Generic constraint violations in Promise resolver patterns ✅
    - Null assignment conflicts with BackendServicePayload type requirements ✅  
    - Type safety improvements compilation conflicts resolved ✅
  - **CONTINUATION DEPENDENCY**: TASK-ESLINT-006 fixes completed - both tasks ready for validation ✅

- [ ] [TASK-ESLINT-008] **Replace Any Types in Core Components** | Priority: MEDIUM | Complexity: 6 | **TYPE-SAFETY**
  - Pattern: any-type-replacement-pattern | Issues: ~200 warnings in core/*.ts
  - Scope: src/core/ (templum-core.ts, resource-manager.ts, config-manager.ts, etc.)
  - Issue Types: @typescript-eslint/no-explicit-any (warnings) - configuration objects, resource data, error handling
  - Implementation: Create typed configuration interfaces, define resource type definitions, improve error type handling
  - Validation: `npm run lint -- src/core/*.ts` shows 0 no-explicit-any warnings
  - **TYPE IMPACT**: Essential for core system type safety and error prevention

- [ ] [TASK-ESLINT-009] **Replace Any Types in Interface Components** | Priority: MEDIUM | Complexity: 7 | **TYPE-SAFETY**
  - Pattern: any-type-replacement-pattern | Issues: ~185 warnings in interfaces/*.ts
  - Scope: src/interfaces/ (cli-adapter.ts, vscode-adapter.ts, UI components, etc.)
  - Issue Types: @typescript-eslint/no-explicit-any (warnings) - UI component data, event handlers, adapter responses
  - Implementation: Define UI component type interfaces, create event handler types, type adapter method signatures
  - Validation: `npm run lint -- src/interfaces/*.ts` shows 0 no-explicit-any warnings
  - **TYPE IMPACT**: Critical for UI/UX type safety and component reusability

- [ ] [TASK-ESLINT-010] **Replace Any Types in Skin and Rendering** | Priority: MEDIUM | Complexity: 6 | **TYPE-SAFETY**
  - Pattern: any-type-replacement-pattern | Issues: ~150 warnings in skin/*.ts, rendering/*.ts
  - Scope: src/skin/, src/rendering/ (universal-skin-engine.ts, layout-engine.ts, etc.)
  - Issue Types: @typescript-eslint/no-explicit-any (warnings) - skin definitions, rendering data, layout configurations
  - Implementation: Create comprehensive skin type definitions, define rendering pipeline types, type layout configurations
  - Validation: `npm run lint -- "src/{skin,rendering}/**/*.ts"` shows 0 no-explicit-any warnings
  - **TYPE IMPACT**: Essential for skin system type safety and rendering reliability

- [ ] [TASK-ESLINT-011] **Replace Any Types in Supporting Components** | Priority: MEDIUM | Complexity: 5 | **TYPE-SAFETY**
  - Pattern: any-type-replacement-pattern | Issues: ~218 warnings in remaining components
  - Scope: src/types/, src/session/, src/state/, src/observability/, etc.
  - Issue Types: @typescript-eslint/no-explicit-any (warnings) - type definitions, session data, state management, observability data
  - Implementation: Improve type definitions, create session management types, define state synchronization types, type observability data
  - Validation: `npm run lint` shows 0 @typescript-eslint/no-explicit-any warnings project-wide
  - **FINAL TYPE-SAFETY**: Eliminates all explicit any types for complete type safety

### Track C: Console Cleanup - 1,235 Warnings

- [ ] [TASK-ESLINT-012] **Clean Console Statements in Backend Services** | Priority: MEDIUM | Complexity: 4 | **PRODUCTION-READY**
  - Pattern: console-cleanup-pattern | Issues: ~385 warnings in backend/*.ts
  - Scope: src/backend/ (backend-service-router.ts has ~87 console statements, others distributed)
  - Issue Types: no-console (warnings) - debug logging, error logging, status logging
  - Implementation: Replace console.log with proper logging framework, remove debug statements, implement structured logging
  - Validation: `npm run lint -- src/backend/*.ts` shows 0 no-console warnings
  - **PRODUCTION IMPACT**: Critical for production deployment and log management

- [ ] [TASK-ESLINT-013] **Clean Console Statements in Core Components** | Priority: MEDIUM | Complexity: 3 | **PRODUCTION-READY**
  - Pattern: console-cleanup-pattern | Issues: ~210 warnings in core/*.ts
  - Scope: src/core/ (templum-core.ts, config-manager.ts, resource-manager.ts, etc.)
  - Issue Types: no-console (warnings) - initialization logging, configuration logging, error reporting
  - Implementation: Implement core component logging strategy, remove debug console statements, add structured logging
  - Validation: `npm run lint -- src/core/*.ts` shows 0 no-console warnings
  - **PRODUCTION IMPACT**: Essential for clean core component production behavior

- [ ] [TASK-ESLINT-014] **Clean Console Statements in Interface Components** | Priority: MEDIUM | Complexity: 3 | **PRODUCTION-READY**
  - Pattern: console-cleanup-pattern | Issues: ~175 warnings in interfaces/*.ts
  - Scope: src/interfaces/ (cli-adapter.ts, vscode-adapter.ts, UI components, etc.)
  - Issue Types: no-console (warnings) - user interaction logging, UI event logging, adapter status
  - Implementation: Implement user interaction logging framework, remove debug UI statements, add proper event logging
  - Validation: `npm run lint -- src/interfaces/*.ts` shows 0 no-console warnings
  - **PRODUCTION IMPACT**: Important for clean user interface experience

- [ ] [TASK-ESLINT-015] **Clean Console Statements in Supporting Components** | Priority: MEDIUM | Complexity: 4 | **PRODUCTION-READY**
  - Pattern: console-cleanup-pattern | Issues: ~465 warnings in remaining components
  - Scope: src/skin/, src/rendering/, src/session/, src/state/, src/tests/, src/validation/, etc.
  - Issue Types: no-console (warnings) - component debugging, test output, validation logging, skin loading
  - Implementation: Remove debug statements, implement component-specific logging, clean up test console output
  - Validation: `npm run lint` shows 0 no-console warnings project-wide
  - **FINAL PRODUCTION**: Eliminates all console statements for production readiness

### Track D: Code Hygiene - 156 Warnings

- [ ] [TASK-ESLINT-016] **Fix Non-Null Assertions in Backend Services** | Priority: LOW | Complexity: 3 | **CODE-HYGIENE**
  - Pattern: non-null-assertion-cleanup-pattern | Issues: ~45 warnings in backend/*.ts
  - Scope: src/backend/ (backend-integration-config.ts, backend-service-router.ts, etc.)
  - Issue Types: @typescript-eslint/no-non-null-assertion (warnings) - service response assertions, config assertions
  - Implementation: Add proper null checks, implement optional chaining, add type guards for safety
  - Validation: `npm run lint -- src/backend/*.ts` shows 0 no-non-null-assertion warnings
  - **SAFETY IMPACT**: Improves runtime safety by eliminating risky assertions

- [ ] [TASK-ESLINT-017] **Fix Non-Null Assertions in Core and Interface Components** | Priority: LOW | Complexity: 3 | **CODE-HYGIENE**
  - Pattern: non-null-assertion-cleanup-pattern | Issues: ~55 warnings in core/*.ts, interfaces/*.ts
  - Scope: src/core/, src/interfaces/ directories
  - Issue Types: @typescript-eslint/no-non-null-assertion (warnings) - component initialization assertions, UI element assertions
  - Implementation: Add initialization checks, implement safe UI element access, add component lifecycle guards
  - Validation: `npm run lint -- "src/{core,interfaces}/**/*.ts"` shows 0 no-non-null-assertion warnings
  - **SAFETY IMPACT**: Prevents potential runtime errors in core and UI components

- [ ] [TASK-ESLINT-018] **Fix Non-Null Assertions in Supporting Components** | Priority: LOW | Complexity: 2 | **CODE-HYGIENE**
  - Pattern: non-null-assertion-cleanup-pattern | Issues: ~56 warnings in remaining components
  - Scope: src/skin/, src/rendering/, src/session/, src/state/, etc.
  - Issue Types: @typescript-eslint/no-non-null-assertion (warnings) - skin loading assertions, state access assertions
  - Implementation: Add safe skin loading checks, implement state access guards, remove risky assertions
  - Validation: `npm run lint` shows 0 @typescript-eslint/no-non-null-assertion warnings project-wide
  - **FINAL SAFETY**: Eliminates all non-null assertions for complete runtime safety

### Track E: Final Polish - 22 Issues

- [ ] [TASK-ESLINT-019] **Fix Require Import and Legacy Issues** | Priority: LOW | Complexity: 2 | **FINAL-POLISH**
  - Pattern: legacy-code-cleanup-pattern | Issues: ~22 miscellaneous warnings
  - Scope: Project-wide scattered issues
  - Issue Types: @typescript-eslint/no-require-imports (8), @typescript-eslint/prefer-as-const (2), no-case-declarations (4), etc.
  - Implementation: Convert require() to ES6 imports, use const assertions, fix switch case declarations, address remaining issues
  - Validation: `npm run lint` shows 0 remaining warnings and errors
  - **COMPLETION**: Final cleanup for complete ESLint compliance

## ARCHITECTURAL INFRASTRUCTURE

### CLI Backend Discovery & Skin Loading Enhancement

- [ ] [TASK-CLI-016] **HTTP Announcement Server for Backend Registration** | Priority: MEDIUM | Complexity: 6 | **ARCHITECTURE**
  - Pattern: templum-patterns.md#http-announcement-system-pattern | New pattern for robust dynamic discovery
  - **Issue**: File-based discovery has limitations across different OS/filesystem types and network backends
  - **Solution**: HTTP endpoint for backends to announce themselves directly to Templum
  - **Implementation**:
    1. Add lightweight HTTP server to Templum core (Express.js minimal)
    2. Create POST /api/announce endpoint for backend service registration
    3. Integrate announcements with existing ServiceDiscovery system
    4. Add authentication/validation for announcement security
    5. Support backend health check endpoints and status updates
  - **Files to Modify**:
    - src/core/templum-core.ts (add HTTP server initialization)
    - Create: src/backend/announcement-server.ts (HTTP announcement handling)
    - src/backend/service-discovery.ts (integration with HTTP announcements)
  - **Quality Gates**: Backends can register via HTTP POST, CLI receives notifications
  - **Validation**: Backend sends HTTP announcement → appears in CLI within seconds
  - **NETWORK SUPPORT**: Enables discovery of backends on different machines/networks

- [ ] [TASK-CLI-017] **CLI Dynamic Discovery Event Integration** | Priority: MEDIUM | Complexity: 3 |
  - Category: Integration
  - Pattern: templum-patterns.md#event-driven-cli-updates-pattern | Reference: EventEmitter patterns
  - **Issue**: CLI doesn't respond to new backends discovered after initialization
  - **Dependencies**: TASK-CLI-015 (file watching) or TASK-CLI-016 (HTTP announcements)
  - **Implementation**:
    1. Subscribe CLIInterfaceAdapter to ServiceDiscovery 'serviceDiscovered' events
    2. Automatically load and integrate new backend skins when discovered
    3. Update interactive search items dynamically
    4. Show CLI notifications when backends connect/disconnect
    5. Handle backend disconnection gracefully with menu updates
  - **Files to Modify**:
    - src/interfaces/cli-adapter.ts (event subscription and handling)
    - Integration with menu registry updates and search item refresh
  - **Quality Gates**: CLI updates in real-time when backends start/stop
  - **Validation**: Start new backend → CLI shows notification → backend interface available immediately

- [ ] [TASK-CLI-019] **Backend Error Handling and Graceful Fallbacks** | Priority: LOW | Complexity: 2
  - Category: Robustness
  - Pattern: templum-patterns.md#error-recovery-pattern | Reference: Circuit Breaker Resilience pattern
  - **Issue**: CLI lacks robust error handling for skin loading failures and backend disconnections
  - **Implementation**:
    1. Handle skin loading failures gracefully with meaningful error messages
    2. Provide fallback generic menus when skin loading fails
    3. Add retry mechanisms for failed backend connections with exponential backoff
    4. Show clear error states in CLI for backend connectivity issues
    5. Implement circuit breaker pattern for persistently failing backends
  - **Files to Modify**:
    - src/interfaces/cli-adapter.ts (error handling enhancement)
    - Integration with existing circuit breaker and error recovery patterns
  - **Quality Gates**: CLI remains functional even when backends fail
  - **Validation**: Kill backend → CLI shows error but remains usable, restart backend → auto-reconnects

- [ ] [TASK-CLI-020] **Implement orchestrator.disconnectFromBackend method** | Priority: MEDIUM | Complexity: 3
  - Category: Backend Management
  - Pattern: templum-patterns.md#backend-service-integration-unified-pattern | Reference: Backend Service Integration patterns
  - **Issue**: Missing implementation for programmatically disconnecting from specific backend services
  - **Implementation**:
    1. Add disconnectFromBackend method to ITemplumOrchestrator interface
    2. Implement backend-specific disconnection logic in Templum orchestrator
    3. Handle graceful shutdown of backend connections with resource cleanup
    4. Update backend connection status tracking when disconnected
    5. Provide proper error handling for disconnection failures
  - **Files to Modify**:
    - src/interfaces/templum-orchestrator-interface.ts (interface definition)
    - src/core/templum-core.ts (implementation)
    - Integration with existing backend connection management
  - **Quality Gates**: Backend disconnection works reliably with proper status updates
  - **Validation**: disconnectFromBackend('pcl') → backend marked as disconnected, resources cleaned up

- [ ] [TASK-CLI-021] **Implement proper skin unloading in UniversalMenuRegistry** | Priority: MEDIUM | Complexity: 3
  - Category: Menu Management
  - Pattern: templum-patterns.md#universal-menu-registry-pattern | Reference: Menu Registry patterns
  - **Issue**: Missing implementation for unloading backend skins from the menu registry
  - **Implementation**:
    1. Add unloadSkin method to UniversalMenuRegistry class
    2. Implement skin-specific menu removal logic
    3. Handle cleanup of skin-related cache entries and state
    4. Update active skin tracking when skins are unloaded
    5. Provide proper error handling for unload failures
  - **Files to Modify**:
    - src/menus/universal-menu-registry.ts (unloadSkin implementation)
    - Integration with existing skin loading and menu management
  - **Quality Gates**: Skin unloading works reliably without breaking menu system
  - **Validation**: registry.unloadSkin('pcl') → PCL menus removed, registry state updated

## Task Category

### Task Sub-Category

- [ ] [TASK-CLI-003] **Advanced Menu Navigation System** | Priority: High | Complexity: 10
  - Pattern: templum-patterns.md#cli-interface-pattern
  - Dependencies: TASK-CLI-002 ✅ SATISFIED (Interactive search system complete 2025-08-31)
  - Implementation: Breadcrumb navigation, history tracking, bookmark system, quick access
  - **DEPENDENCY STATUS**: Ready for immediate execution - no blockers
  - **UNBLOCKING OPPORTUNITY**: Can proceed in parallel with compilation fixes

- [T] [TASK-NEW-046] **VSCode Service Tree Provider Validation** | Found in: extension.ts:228 | Priority: HIGH | Complexity: 2 | **TESTING BLOCKED**
  - Pattern: templum-patterns.md#vscode-tree-provider-pattern | Dependencies: Backend service discovery, TreeDataProvider interface ✅
  - Dependencies: TASK-COMP-004 ✅ RESOLVED (Source code compilation), TASK-COMP-010 (Library compilation resolution), TASK-SESSION-001 completion, TASK-SKIN-005 (Two-tier prioritization system)
  - Phase: Interface → Integration transition
  - SKIN ARCHITECTURE IMPACT: Tree view must use BackendCapabilityProfile for conditional display of health/version/capability info
  - **IMPLEMENTATION COMPLETE**: 2025-09-01 - BackendCapabilityProfile conditional display implemented
  - **VALIDATION STATUS**: Implementation verified but blocked by Zod v4 ESModuleInterop library compilation issues
  - **READY FOR**: TASK-COMP-008 resolution, then functional testing with different backend configurations

- [ ] [TASK-NEW-050] **Service Connection Validation** | Priority: HIGH | Complexity: 2 | **VALIDATION BLOCKED**
  - Pattern: templum-patterns.md#backend-service-router-pattern | Dependencies: TASK-COMP-004 ✅ RESOLVED (Source code compilation), TASK-COMP-010 (Library compilation resolution)
  - **IMPLEMENTATION COMPLETE**: Core service connection management functionality implemented
  - **VALIDATION STATUS**: Source code compilation resolved, blocked by Zod v4 ESModuleInterop library issues
  - **READY FOR**: TASK-COMP-008 resolution, then service connection management validation
  - **UNBLOCKS**: Service management workflow (after compilation resolution)

- [ ] [TASK-NEW-049] **Service Tree Refresh Implementation** | Priority: Medium | Complexity: 4 | **DEPENDENT**
  - Pattern: templum-patterns.md#vscode-tree-provider-pattern | Dependencies: TASK-NEW-046 validation completion
  - Implementation: Service refresh functionality for VSCode integration
  - **DEPENDENCY CHAIN**: TASK-COMP-008 → TASK-COMP-010 → TASK-NEW-046 → TASK-NEW-049
  - **ESTIMATED START**: After TASK-NEW-046 validation complete

## Advanced Features

### Performance Optimization

- [ ] [TASK-PERF-004] **Performance Budgets and Monitoring** | Priority: Medium | Complexity: 8
  - Pattern: templum-patterns.md#performance-monitoring-pattern
  - Dependencies: Observability system, metrics collection
  - Implementation: Performance thresholds, automated alerts, degradation detection
  - **PARALLEL EXECUTION**: Can run alongside interface validation work

- [ ] [TASK-PERF-003] **Intelligent Caching Strategies** | Priority: Medium | Complexity: 14
  - Pattern: templum-patterns.md#caching-pattern
  - Dependencies: Skin engine, state management system (soft dependency)
  - Implementation: Adaptive cache sizing, predictive pre-loading, cache invalidation strategies
  - **PARALLEL EXECUTION**: Can begin development while interface validation completes

- [ ] [TASK-NEW-025] **Enhanced State Manager Configuration Validation** | Priority: Low | Complexity: 4
  - Pattern: templum-patterns.md#state-manager-configuration-pattern
  - Dependencies: Enhanced State Manager configuration patterns
  - **DEFERRAL REASON**: Not on critical path, can be addressed after core integration

- [ ] [TASK-NEW-027] **Resource Manager Configuration Validation and Policy Setup** | Priority: Low | Complexity: 5
  - Pattern: templum-patterns.md#resource-management-pattern
  - Dependencies: Templum Resource Manager policy patterns
  - **DEFERRAL REASON**: Enhancement rather than blocking functionality

- [ ] [TASK-NEW-028] **Component Instance Creation Validation** | Priority: Low | Complexity: 3
  - Pattern: templum-patterns.md#component-factory-pattern
  - Dependencies: Component factory patterns and configuration validation
  - **DEFERRAL REASON**: Validation enhancement, not blocking core functionality

### Other Enhancements

- [ ] [TASK-NEW-064] **Enhanced Command Router Event Handling** | Priority: Low | Complexity: 3 | **INFRASTRUCTURE**
  - Pattern: templum-patterns.md#event-handler-integration | Location: src/backend/dynamic-command-router.ts
  - Dependencies: Event system integration patterns
  - Implementation: Enhanced event handling for command router system
  - Phase: Integration | **INDEPENDENT**: Can proceed without blocking dependencies

- [ ] [TASK-ADV-001] **Workflow Execution Engine** | Priority: Medium | Complexity: 16 | **FUTURE**
  - Pattern: templum-patterns.md#workflow-engine-pattern
  - Dependencies: State management, command routing, error recovery
  - Implementation: Step-by-step execution, rollback capabilities, progress tracking
  - **PHASE DEPENDENCY**: After Phase 3 Integration complete

- [ ] [TASK-ENT-001] **Centralized Configuration Management** | Priority: High | Complexity: 14 | **PARALLEL**
  - Pattern: templum-patterns.md#enterprise-config-pattern
  - Dependencies: Configuration validation, security policies
  - Implementation: Configuration APIs, environment management, policy enforcement
  - **ARCHITECTURAL INDEPENDENCE**: Can proceed without interface validation completion

- [ ] [TASK-ENT-002] **Audit Logging and Compliance System** | Priority: High | Complexity: 16 | **PARALLEL**
  - Pattern: templum-patterns.md#audit-compliance-pattern
  - Dependencies: Observability system, structured logging
  - Implementation: Audit trails, compliance reporting, data retention policies
  - **PARALLEL DEVELOPMENT**: Independent of current critical path

- [ ] [TASK-ENT-003] **Admin Dashboards and Monitoring** | Priority: Medium | Complexity: 18 | **PARALLEL**
  - Pattern: templum-patterns.md#admin-dashboard-pattern
  - Dependencies: Metrics collection, web interface framework
  - Implementation: Real-time monitoring, system health dashboards, user management
  - **ARCHITECTURAL INDEPENDENCE**: Can develop parallel to critical path

### 2. Ecosystem Expansion

- [ ] [TASK-ADV-002] **Skin Marketplace and Versioning System** | Priority: Medium | Complexity: 18 | **FUTURE**
  - Pattern: See: templum-patterns.md#marketplace-pattern
  - Dependencies: Skin versioning system, package management
  - Implementation: Registry API, version resolution, dependency management, security validation
  - **PHASE DEPENDENCY**: After core platform stability achieved

- [ ] [TASK-355] **Interface Alignment Architecture Review**
  - Priority: 18 | Complexity: 12 | Status: Pattern established, needs expansion
  - Pattern: templum-patterns.md#interface-alignment-review-pattern
  - Dependencies: Universal Skin Engine Interface Alignment [x]

- [ ] [TASK-ECO-001] **Plugin Architecture for Third-Party Integrations** | Priority: Medium | Complexity: 22
  - Pattern: templum-patterns.md#plugin-architecture-pattern
  - Dependencies: Developer SDK, security validation framework
  - Implementation: Plugin registry, sandboxing, API versioning, security policies

- [ ] [TASK-ECO-003] **Federated Skin Management System** | Priority: Low | Complexity: 20
  - Pattern: templum-patterns.md#federated-management-pattern
  - Dependencies: Skin marketplace, distributed architecture
  - Implementation: Multi-registry support, skin synchronization, conflict resolution

### 3. UI Enhancement & User Experience

- [ ] [TASK-UI-001] **Adaptive Backend Status UI Enhancement** | Priority: Medium | Complexity: 12
  - Issue: UI needs to conditionally display backend information based on backend capability profiles
  - Pattern: templum-patterns.md#adaptive-ui-pattern
  - Dependencies: TASK-SKIN-005 (Two-tier prioritization system), TASK-SKIN-007 (Comprehensive testing)
  - Root Cause: Current UI assumes all backends expose health/capabilities/version data
  - Implementation Approach:
    1. Implement conditional health display: Show health status only when healthEndpoint available
    2. Add backend type indicators: Visual distinction between full-featured vs minimal backends
    3. Implement capability visualization: Health-enabled shows capability count, minimal shows available commands
    4. Add connection stability display: Show stability percentage for skin-only backends
    5. Implement tooltip explanations: Help users understand different backend types
    6. Update VSCode service tree: Conditional rendering based on BackendCapabilityProfile
  - Location: src/extension.ts (VSCode service tree), src/webview/ (UI components)
  - See: templum-patterns.md#adaptive-ui-pattern
  - **UI IMPACT**: Enhanced user experience with backend-appropriate information display
  - **USER BENEFIT**: Clear understanding of backend capabilities and connection quality

### Haruspex Integration

- [ ] [TASK-HAR-001] **Complete Haruspex 2.0 Integration** | Priority: High | Complexity: 20
  - Pattern: templum-patterns.md#haruspex-integration-pattern
  - Dependencies: Haruspex 2.0 API specification, IPC communication layer
  - Implementation: Service discovery, command routing, skin definitions, state synchronization

- [ ] [TASK-HAR-002] **Analysis Workflow Automation** | Priority: Medium | Complexity: 16
  - Pattern: templum-patterns.md#workflow-automation-pattern
  - Dependencies: Haruspex integration, workflow execution engine
  - Implementation: Automated analysis triggers, result processing, notification systems

- [ ] [TASK-HAR-003] **Predictive Development Features** | Priority: Medium | Complexity: 18
  - Pattern: templum-patterns.md#predictive-pattern
  - Dependencies: Haruspex analysis engine, machine learning models
  - Implementation: Code suggestion system, issue prediction, optimization recommendations
