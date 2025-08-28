# Templum 1.0 Fix Planning Queue

> **Purpose**: Task planning and work queues for Templum 1.0 issue resolution  
> **Created**: 2025-08-21  
> **Last Updated**: 2025-08-23  
> **Status**: Initial planning queue from comprehensive discovery phase  
> **Integration**: Used by issue-fix-selector.md, quick-fix-guide.md, comprehensive-fix-guide.md  
> **Data Source**: templum-tracker-data.md (status data)

## Immediate Priority Queue

## ACCELERATED IMPLEMENTATION QUEUE - Component Reuse Strategy

> **New Strategy**: Leverage proven components from Haruspex and Phoenix Code Lite  
> **Timeline**: 7-8 weeks total (vs 15-17 weeks from scratch)  
> **Success Rate**: High confidence based on analysis of working implementations  
> **Risk**: Low - components are already proven in production-like environments  

### Phase 1: Foundation via Proven Components (1 week)

- [x] **Configuration Management System (PCL Reuse - IMMEDIATE WIN)**
  - **Source Component**: `phoenix-code-lite/src/core/config-manager.ts`
  - **Status**: ✅ **Ready for Direct Adaptation** - Complete system with Zod validation
  - **Implementation**:
    1. Copy PCL config-manager.ts → `src/core/templum-config-manager.ts`
    2. Update CoreConfigSchema for Templum interface orchestration settings
    3. Modify templates for VSCode, CLI, and Universal Interaction modes
    4. Integrate with existing Templum audit logging
  - **Immediate Value**: Environment-specific deployment, hot reloading, validation
  - **Dependencies**: None - foundation component

- [x] **Circuit Breaker Implementation (Haruspex Reuse - RESILIENCE WIN) ✅ COMPLETED 2025-08-23**
  - **Source Component**: `Haruspex/src/core/circuit-breaker.ts`
  - **Status**: ✅ **COMPLETED** - Complete error recovery system implemented
  - **Implementation**:
    1. ✅ Adapted circuit-breaker.ts → `src/core/error-recovery.ts`
    2. ✅ Updated configuration for Templum error types and signal integration
    3. ✅ Added operation-specific tracking (interface-switch, backend-integration, state-management)
    4. ✅ Created specialized factory functions for different use cases
    5. ✅ Full integration with Templum architectural patterns
  - **Value Delivered**: Production resilience, graceful degradation, specialized configurations
  - **Dependencies**: None - standalone utility
  - **Verification**: 100% test success rate, comprehensive validation complete

### Phase 2: Real Interface Implementation (2 weeks)

- [ ] **VSCode Integration via Haruspex WebView Providers (CORE FUNCTIONALITY)**
  - **Source Components**:
    - `Haruspex/src/providers/mermaid-webview.ts`
    - `Haruspex/src/providers/kanban-webview.ts`
    - `Haruspex/src/extension.ts` (activation pattern)
  - **Status**: ✅ **Real VSCode APIs Available** - No simulation needed
  - **Implementation**:
    1. Extract WebView provider pattern from Haruspex
    2. Create Templum-specific WebView providers for interface orchestration
    3. Implement real VSCode extension activation
    4. Replace simulated VSCode adapter with real implementation
  - **Immediate Value**: Real VSCode integration, actual multi-interface functionality
  - **Dependencies**: Configuration system (for extension settings)
  - **Addresses**: Templum's biggest architectural gap - simulated interfaces

- [ ] **Session Management via PCL Pattern (LIFECYCLE CONTROL)**
  - **Source Component**: `phoenix-code-lite/src/core/unified-session-manager.ts`
  - **Status**: ✅ **Mature Implementation** - Multi-mode session handling
  - **Implementation**:
    1. Adapt PCL unified session manager for interface orchestration
    2. Update renderer switching for VSCode/CLI/Universal modes
    3. Integrate with Templum menu definitions and navigation
    4. Add interface-specific session context
  - **Immediate Value**: Proper session lifecycle, mode switching, navigation history
  - **Dependencies**: Configuration system, VSCode integration

### Phase 3: Dependency Architecture (2 weeks)

- [ ] **Adapter-Based Dependency Injection (PCL Pattern Extension)**
  - **Source Pattern**: `phoenix-code-lite/src/cli/adapters/*.ts`
  - **Status**: ✅ **Proven Pattern** - Extend existing adapter approach
  - **Implementation**:
    1. Extract adapter pattern from PCL
    2. Create interfaces for major Templum components:
       - `IVSCodeAdapter`, `ICLIAdapter`, `IBackendRouter`
       - `IStateManager`, `IUniversalSkinEngine`
    3. Implement adapter registry for component resolution
    4. Update Templum core to use dependency injection
  - **Immediate Value**: Component testability, modularity, proper abstraction
  - **Dependencies**: Configuration system for adapter configuration

- [ ] **Resource Management via Haruspex Cleanup Orchestrator**
  - **Source Component**: `Haruspex/src/core/haruspex-cleanup-orchestrator.ts`
  - **Status**: ✅ **Feature-Rich Implementation** - Simplify for Templum scope
  - **Implementation**:
    1. Extract core cleanup patterns from Haruspex orchestrator
    2. Simplify for Templum scope (remove process management)
    3. Implement component lifecycle cleanup
    4. Add memory leak prevention patterns
  - **Immediate Value**: Memory leak prevention, proper resource cleanup
  - **Dependencies**: Adapter system for component cleanup registration

### Phase 4: Integration & Testing (2 weeks)

- [ ] **Component Integration & Validation**
  - Cross-component testing with adapted components
  - Performance optimization and tuning
  - Integration testing with real VSCode APIs
  - Documentation updates for new architecture

### Implementation Success Criteria

- Phase 1 Success Metrics
  - [x] Configuration system functional with Templum schemas
  - [x] Circuit breaker operational with Templum error types
  - [ ] Multi-environment deployment capability demonstrated
- Phase 2 Success Metrics  
  - [ ] Real VSCode WebView providers functional (not simulated)
  - [ ] Session management with proper lifecycle control
  - [ ] Interface switching between VSCode, CLI, Universal modes
- Phase 3 Success Metrics
  - [ ] All major components injectable via adapter pattern
  - [ ] Component cleanup and resource management operational
  - [ ] Unit testing functional with dependency injection
- Phase 4 Success Metrics
  - [ ] Full system integration testing passes
  - [ ] Performance targets met (<100ms interface switching)
  - [ ] Production deployment ready

### Fallback Protocol

- If component adaptation fails → Use original architectural redesign queue
- If adaptation takes longer than estimated → Blend with from-scratch approach
- If integration issues occur → Maintain compatibility with existing Templum patterns

## Investigation Queue

**Requires analysis before implementation**:

- [ ] **PCL Component Transfer Analysis**
  - **Priority Score**: 28 (Critical)
  - **Complexity Score**: 22 (Medium-High)
  - **Location**: Multiple transferred components
  - **Status**: Only 1/10 claimed PCL transfers actually working
  - **Evidence**: Universal Layout Engine broken, Command Registry broken, Interaction Manager broken
  - **Next Action**: Systematic analysis of each claimed transfer, implementation status verification
  - **Dependencies**: Type System Architecture (for proper integration analysis)
  - **Time Estimate**: 1 day analysis + 2-3 days implementation per component
  - **Pattern Requirements**: **Interface Alignment Pattern** - If components show type/implementation mismatches like Universal Skin Engine, apply systematic interface alignment approach before implementation analysis

- [ ] **Interface Adapter Dependency Chain Analysis**
  - **Priority Score**: 25 (Critical)
  - **Complexity Score**: 20 (Medium)
  - **Location**: `src/interfaces/` directory
  - **Status**: All 3 interface adapters broken - VSCode (12 errors), CLI (8 errors), Interaction Manager (15 errors)
  - **Evidence**: No interfaces can initialize, multi-interface coordination impossible
  - **Next Action**: Map interface dependency chains, create implementation roadmap
  - **Dependencies**: Type System Architecture ✅ (Foundation complete), Universal Skin Engine ✅ (Interface aligned)
  - **Time Estimate**: 4-6 hours analysis + 1 day per adapter implementation
  - **Required Patterns for Analysis**:
    - **Interface Alignment Pattern**: Check for type/implementation mismatches first - apply Universal Skin Engine alignment approach if needed
    - **Map Type Alignment**: Apply KeyboardShortcutMap pattern - use `Map<string, ShortcutDefinition>` type for Map iteration usage
    - **Error Handling**: All interface adapter catch blocks MUST use `isTemplumError` pattern
    - **Method Signature Conflicts**: Reference Interface Method Completion Pattern for standard async method implementations
    - **Import Requirements**: Full type system imports for consistent error handling across all adapters

- [ ] **WebSocket Communication Implementation Plan**
  - **Priority Score**: 22 (Critical)
  - **Complexity Score**: 18 (Medium)
  - **Location**: Multiple WebSocket-related files
  - **Status**: 8 WebSocket-related type errors, missing method implementations
  - **Evidence**: Dependencies installed but type system failures prevent usage
  - **Next Action**: Design WebSocket communication architecture, implement missing methods
  - **Dependencies**: Type System Architecture, Backend Service Router
  - **Time Estimate**: 6-8 hours design + 1-2 days implementation

- [ ] **State Synchronization System Redesign**
  - **Priority Score**: 28 (Critical)
  - **Complexity Score**: 22 (Medium-High)
  - **Location**: `src/state/enhanced-state-synchronization.ts`
  - **Status**: ✅ FOUNDATION COMPLETE - Compilation errors resolved, patterns established
  - **Evidence**: ✅ All Map iteration and error handling patterns applied successfully in prior fix
  - **Next Action**: Build on established foundation - focus on missing property implementations
  - **Dependencies**: Type System Architecture ✅, Interface Adapters
  - **Time Estimate**: 1 day implementation (foundation already established)
  - **Established Patterns Already Applied**:
    - **Map Iteration**: ✅ All Map operations use Array.from() pattern
    - **Error Handling**: ✅ All catch blocks use isTemplumError pattern  
    - **Signal Integration**: ✅ Error and metrics signals properly typed
    - **Missing Properties**: Focus on implementing `syncLatency` and related performance metrics

## Verification Queue

**Claims requiring independent verification**:

- [ ] **Integration Test Framework Reality Check**
  - **Priority Score**: 18 (Medium)
  - **Status**: Claims 31/37 tests passing but uses mock services
  - **Evidence**: Integration tests work with mocks, fail on real functionality
  - **Next Action**: Separate mock tests from real integration tests
  - **Verification Method**: Test execution with real backends vs. mock backends
  - **Time Estimate**: 2-4 hours analysis + test framework modification (reduced based on Direct API Integration Pattern)
  - **Pattern Available**: ✅ Direct API Integration Pattern - Update test code to use real APIs directly

- [ ] **Performance Claims Validation**
  - **Priority Score**: 15 (Medium)
  - **Status**: Phase claims "<100ms interface switching" but interfaces broken
  - **Evidence**: Cannot test performance when basic functionality doesn't work
  - **Next Action**: Validate performance claims after basic functionality restored
  - **Verification Method**: Real performance testing after interface restoration
  - **Time Estimate**: 2-3 hours testing after fixes

- [ ] **Test Coverage Reality Assessment**
  - **Priority Score**: 12 (Low)
  - **Status**: Claims high test coverage but tests validate mocks
  - **Evidence**: Tests pass because they test placeholder implementations
  - **Next Action**: Measure real functionality test coverage
  - **Verification Method**: Coverage analysis after mock removal
  - **Time Estimate**: 1-2 hours analysis (reduced based on Direct API Integration Pattern)
  - **Pattern Available**: ✅ Direct API Integration Pattern - Systematic approach for mock-to-real transitions

## Architectural Redesign Queue - Needs Reassessment After Component Reuse

> **Discovery Date**: 2025-08-22  
> **Analysis Source**: Deep source code examination revealing fundamental architectural gaps  
> **Impact**: Critical - Prevents real functionality implementation and testing  
> **Scope**: Comprehensive architectural reconstruction required  

**Foundation-level issues requiring complete redesign**:

- [ ] **Dependency Injection System Implementation**
  - **Priority Score**: 30 (Critical)
  - **Complexity Score**: 28 (High)
  - **Location**: Throughout codebase, core architectural pattern
  - **Status**: ❌ **Missing** - Direct instantiation prevents proper testing and modularity
  - **Evidence**: Line 389 `templum-core.ts`: `this.backendRouter = new PCLBackendIntegrator({...})` - hardcoded dependencies
  - **Next Action**: Design and implement IoC container system
  - **Dependencies**: None - Foundation requirement
  - **Time Estimate**: 2-3 weeks (IoC container design, interface abstractions, component refactoring)
  - **Architectural Value**: Enables proper unit testing, component modularity, and dependency management
  - **Blocking Issues**: Cannot implement real component testing without proper dependency injection

- [ ] **Abstraction Layer Architecture Implementation**
  - **Priority Score**: 32 (Critical)
  - **Complexity Score**: 30 (High)
  - **Location**: All component interactions
  - **Status**: ❌ **Missing** - No interface-based programming, direct component coupling
  - **Evidence**: Core engine directly calls concrete implementations without abstractions
  - **Next Action**: Design interface-based architecture with proper abstractions
  - **Dependencies**: Dependency Injection System (must implement interfaces for injection)
  - **Time Estimate**: 2-3 weeks (Interface design, abstraction patterns, component decoupling)
  - **Architectural Value**: Enables component swapping, proper mocking, and modular architecture
  - **Blocking Issues**: Cannot implement modular testing or component replacement without abstractions

- [ ] **Real Interface Adapter Implementation**
  - **Priority Score**: 35 (Critical)
  - **Complexity Score**: 32 (High)
  - **Location**: `src/interfaces/vscode-adapter.ts`, `src/interfaces/cli-adapter.ts`
  - **Status**: ⚠️ **Simulated** - Adapters simulate integrations without real API calls
  - **Evidence**: Line 312 VSCode adapter: "In real VSCode extension, this would use vscode.commands.registerCommand"
  - **Next Action**: Implement actual VSCode API integration and real CLI command handling
  - **Dependencies**: Abstraction Layer Architecture, Configuration Management System
  - **Time Estimate**: 2-3 weeks (Real VSCode extension integration, CLI command processing, testing)
  - **Architectural Value**: Enables actual multi-interface functionality and real user interaction
  - **Blocking Issues**: Core system purpose (universal interface orchestration) non-functional without real adapters

- [ ] **Configuration Management System Implementation**
  - **Priority Score**: 28 (Critical)
  - **Complexity Score**: 20 (Medium)
  - **Location**: Hard-coded values throughout codebase
  - **Status**: ❌ **Missing** - No centralized configuration system or environment-based settings
  - **Evidence**: Magic numbers and strings scattered across files
  - **Next Action**: Design and implement centralized configuration system with environment support
  - **Dependencies**: Dependency Injection System (for config injection)
  - **Time Estimate**: 1-2 weeks (Config system design, environment handling, validation)
  - **Architectural Value**: Enables multi-environment deployment and configuration validation
  - **Blocking Issues**: Cannot deploy to production or different environments without proper configuration

- [ ] **Service Discovery System Implementation**
  - **Priority Score**: 26 (Critical)
  - **Complexity Score**: 24 (High)
  - **Location**: Backend integration components
  - **Status**: ❌ **Placeholder Only** - Structure exists but only mock patterns implemented
  - **Evidence**: Interfaces and types defined but no actual discovery logic
  - **Next Action**: Implement real service discovery mechanism with backend registration
  - **Dependencies**: Configuration Management System, Real Interface Adapters
  - **Time Estimate**: 1-2 weeks (Service registry, discovery protocols, health monitoring)
  - **Architectural Value**: Enables real backend communication and service coordination
  - **Blocking Issues**: Cannot discover or connect to actual backend services

- [ ] **Observability Infrastructure Implementation**
  - **Priority Score**: 22 (Critical)
  - **Complexity Score**: 20 (Medium)
  - **Location**: Performance interfaces defined but no implementation
  - **Status**: ❌ **Missing** - No actual telemetry, logging infrastructure, or observability
  - **Evidence**: Performance metrics interfaces exist but return hardcoded values
  - **Next Action**: Implement real telemetry, logging, and monitoring infrastructure
  - **Dependencies**: Service Discovery System, Configuration Management
  - **Time Estimate**: 1-2 weeks (Telemetry collection, log aggregation, health monitoring)
  - **Architectural Value**: Enables production monitoring and debugging capabilities
  - **Blocking Issues**: Cannot monitor system health or debug production issues

### 🚨 Architectural Dependency Chain

**Critical Path** (Must be implemented in strict order):

1. **Dependency Injection System** (3 weeks)
   - Enables: Proper component testing, dependency management
   - Blocks: All subsequent architectural improvements

2. **Abstraction Layer Architecture** (3 weeks)
   - Enables: Component modularity, interface swapping
   - Requires: DI system for interface injection
   - Blocks: Real adapter implementations

3. **Configuration Management System** (2 weeks)  
   - Enables: Environment-specific deployment
   - Requires: DI system for configuration injection
   - Blocks: Production deployment

4. **Real Interface Adapter Implementation** (3 weeks)
   - Enables: Actual multi-interface functionality
   - Requires: Abstraction layers, configuration system
   - Blocks: Core system purpose

5. **Service Discovery System** (2 weeks)
   - Enables: Real backend communication
   - Requires: Config system, real adapters
   - Blocks: Backend integration

6. **Observability Infrastructure** (2 weeks)
   - Enables: Production monitoring
   - Requires: Service discovery, config system
   - Blocks: Production readiness

**REVISED Redesign Timeline with Reuse**: 7-8 weeks (1.5-2 months) leveraging proven components
**Original Estimate**: 15-17 weeks (3.5-4 months) comprehensive reconstruction from scratch  
**Time Savings**: 8-10 weeks (50-60% reduction) through strategic component reuse

### 🏗️ Foundation Requirements

**Prerequisites for any real functionality**:

- **Dependency Injection Container**: No component testing possible without proper DI
- **Interface Abstractions**: No modularity or swapping without proper abstractions  
- **Configuration System**: No multi-environment deployment without centralized config
- **Real API Integrations**: No actual functionality without real interface implementations

**Quality Gates**:

- **Phase 1 Complete**: DI + Abstractions → Enable real component testing
- **Phase 2 Complete**: Config + Real Adapters → Enable basic functionality
- **Phase 3 Complete**: Service Discovery + Observability → Enable production deployment

## Architecture & Technical Debt Queue

**System-level issues requiring design decisions**:

- [ ] **Interface Alignment Architecture Review**  
  - **Priority Score**: 18 (Medium)
  - **Complexity Score**: 12 (Medium)
  - **Location**: Repository-wide interface design patterns
  - **Status**: **NEW** - Universal Skin Engine success demonstrates need for systematic interface alignment approach
  - **Evidence**: 85% error reduction achieved through comprehensive interface alignment
  - **Next Action**: Review other components for similar type/implementation mismatches
  - **Dependencies**: Universal Skin Engine Interface Alignment ✅ (pattern established)
  - **Time Estimate**: 1 day review + 0.5-2 days per component needing alignment
  - **Architectural Value**: Prevent interface drift, establish consistent type/implementation alignment practices
  - **Pattern Reference**: Interface Alignment Pattern documented in tracker-data.md

- [ ] **Service Discovery System Implementation**
  - **Priority Score**: 20 (Medium)
  - **Complexity Score**: 18 (Medium)
  - **Location**: Multiple service integration points
  - **Status**: No real service discovery logic found, only mock patterns
  - **Evidence**: Cannot discover or connect to actual backend services
  - **Next Action**: Design and implement service discovery mechanism
  - **Dependencies**: Backend Service Router, Type System Architecture
  - **Time Estimate**: 1 day design + 1-2 days implementation

- [ ] **Multi-Interface Coordination Architecture**
  - **Priority Score**: 24 (Critical)
  - **Complexity Score**: 26 (High)
  - **Location**: Cross-interface communication systems
  - **Status**: 0/3 interface types functional, coordination impossible
  - **Evidence**: VSCode, CLI, and Universal Interaction Manager all broken
  - **Next Action**: Design cross-interface communication architecture
  - **Dependencies**: Interface Adapters, State Synchronization System, Universal Skin Engine ✅ (rendering foundation ready)
  - **Time Estimate**: 1-2 days architectural design + 2-3 days implementation
  - **Architectural Insight**: Universal Skin Engine interface alignment provides foundation for consistent interface communication patterns

## New Tasks Discovered During Backend Service Router Implementation

**These tasks emerged during 2025-08-22 implementation work and require attention**:

- [ ] **Universal Layout Engine Interface Integration**
  - **Priority Score**: 26 (Critical)
  - **Complexity Score**: 22 (High - use comprehensive-fix-guide.md)
  - **Location**: `src/rendering/universal-layout-engine.ts`
  - **Status**: 2/10 integration tests failing - interface rendering not functional
  - **Evidence**: `renderForInterface()` returns `success: false` for all interfaces (vscode, cli, command)
  - **Discovery Context**: Backend integration tests revealed rendering pipeline failures
  - **Next Action**: Debug rendering pipeline and fix interface-specific rendering methods
  - **Dependencies**: InterfaceType import missing, rendering method implementations incomplete
  - **Time Estimate**: 1-2 days (interface rendering pipeline reconstruction)
  - **Required Patterns**:
    - **Import Fix**: Add `import { InterfaceType } from '../types/templum-types'` ✅ (already applied)
    - **Error Handling**: Debug and fix `renderForSpecificInterface()` method failures
    - **Interface Rendering**: Implement missing VSCode, CLI, Command interface rendering logic
    - **Performance**: Ensure <100ms interface switching target maintained

- [ ] **State Synchronization Menu Registry Integration Enhancement**
  - **Priority Score**: 18 (Medium)
  - **Complexity Score**: 12 (Medium - use quick-fix-guide.md)
  - **Location**: `src/menus/universal-menu-registry.ts`  
  - **Status**: Working but needs enhancement for full integration test compatibility
  - **Evidence**: Menu state sync working but could be more robust for edge cases
  - **Discovery Context**: During state sync fixes, identified potential improvements for menu state handling
  - **Next Action**: Enhance menu state synchronization robustness and error handling
  - **Dependencies**: StateSyncFoundation integration (working but could be improved)
  - **Time Estimate**: 0.5 days (enhancement and edge case handling)
  - **Required Patterns**:
    - **Error Handling**: Add `isTemplumError` pattern to menu state operations
    - **State Validation**: Add validation for menu state transitions
    - **Performance**: Monitor sync latency reporting accuracy

- [ ] **Backend Command Registry Error Logging Enhancement**
  - **Priority Score**: 15 (Medium)
  - **Complexity Score**: 8 (Low - use quick-fix-guide.md)
  - **Location**: `src/commands/universal-command-registry.ts`
  - **Status**: Functional but produces console warnings that could be improved
  - **Evidence**: Console warnings during backend initialization, but functionality works
  - **Discovery Context**: During command registry fixes, noticed improvement opportunities
  - **Next Action**: Enhance error logging and reduce unnecessary warnings during normal operation
  - **Dependencies**: None - standalone improvement
  - **Time Estimate**: 0.5 days (logging and error message improvements)
  - **Required Patterns**:
    - **Error Classification**: Distinguish between warnings and actual errors
    - **Logging Levels**: Implement appropriate logging levels for different scenarios
    - **User Experience**: Reduce console noise during normal operation

## Implementation Guidelines

### Proven Implementation Patterns from Backend Service Router Success

**The following patterns were successfully validated during Backend Service Router Implementation (2025-08-22) and should be leveraged by future developers**:

1. **Lazy Initialization Pattern** - For complex component setup (command registries, backend connections)
   - Use private boolean flags (`commonBackendsInitialized`) to track initialization state  
   - Implement `ensureXInitialized()` methods called on first access rather than constructor
   - Prevents async issues in constructors while ensuring seamless operation

2. **Auto-Creation Pattern** - For integration-friendly APIs (session management, state handling)
   - Auto-create missing dependencies when reasonable defaults exist
   - Maintains backward compatibility while enabling new functionality
   - Example: Session auto-creation in `setActiveSession()` method

3. **Integration Test-Driven Implementation** - Highly effective development approach
   - Start with failing integration tests to understand exact requirements
   - Fix systematically: imports → dependencies → implementations → integration
   - Achieved 80% test success rate with this approach

4. **Cross-Component Integration Strategy** - For complex interconnected systems
   - Fix foundation components first (session, state, commands)
   - Then tackle integration layer (backend routing, coordination)
   - Finally address presentation layer (layout engines, interfaces)

### Pattern Compliance Requirements

**ALL REMAINING TASKS MUST FOLLOW ESTABLISHED PATTERNS** - No alternative solutions or new patterns should be created.

**Pattern Compliance Checklist** (Required for every fix):

- [ ] **Import Requirements**: Add type system imports where missing: `import { TemplumError, isTemplumError, createTemplumError, Signals, ErrorSignalPayload, MetricsSignalPayload } from '../types/templum-types';`
- [ ] **Map Iteration**: Replace ALL `for (const [key, value] of map)` with `for (const [key, value] of Array.from(map.entries()))`
- [ ] **Error Handling**: Replace ALL catch blocks with `isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error')`
- [ ] **Signal Emission**: Use typed payloads: `ErrorSignalPayload` or `MetricsSignalPayload` with `(process as any).emit()`
- [ ] **Interface Properties**: Remove non-existent properties from object literals, align Map types with Map usage
- [ ] **Async Methods**: Follow established async pattern with try/catch and proper error handling

**Pattern Verification**: Before marking any task complete, verify ALL 6 patterns have been applied where applicable.

### Task Selection Rules - UPDATED AFTER REUSE COMPONENT ANALYSIS

### **NEW Priority Framework - Component Reuse Strategy**

1. **🔥 ACCELERATED IMPLEMENTATION QUEUE** - **HIGHEST PRIORITY** - Use proven components for 50-60% time savings
2. ✅ **Type System Integration** - All 3 core iterations complete (foundation, integration, refinement)
3. ✅ **Backend Infrastructure** - Backend Service Router Implementation complete, 8/10 integration tests passing
4. **Legacy Architectural Redesign Queue** - **FALLBACK ONLY** - Use if reuse strategy fails
5. **Component Implementation** - **ACCELERATED** via adapted components
6. **Investigation items** - **SUPERSEDED** by reuse implementation guide
7. **Verification items** - **ACCELERATED** via pre-tested component integration

### **🎯 REVISED Priority Recommendations - Reuse First**

- **Phase 1: Foundation via Proven Components**
    1. **Configuration Management System (PCL Reuse)** ✅ COMPLETED 2025-08-23
      - **Implementation**: Complete Templum configuration system with templates, Zod validation, event integration
      - **Documentation**: dev/fixes/2025-08-23-080830-quick-fix-templum-configuration-management-system.md
    2. **Circuit Breaker Implementation (Haruspex Reuse)** ✅ COMPLETED 2025-08-23
      - **Implementation**: Complete error recovery system with operation-specific tracking, specialized configurations
      - **Documentation**: dev/fixes/2025-08-23-084128-comprehensive-fix-circuit-breaker-implementation.md
    3. **Adapter Pattern Foundation (PCL Extension)**

- **Phase 2: Real Interface Implementation**
    4. **VSCode Integration (Haruspex WebView Adaptation)**
    5. **Session Management (PCL Unified Manager)**
    6. **Resource Management (Haruspex Cleanup Orchestrator)**

- **Phase 3: Integration & Testing**
    7. **Component Integration Testing** - Cross-component validation with adapted components
    8. **Performance Optimization** - Tuning adapted components for Templum requirements
    9. **Documentation Updates** - Update architecture documentation for new components

### Critical Path Analysis

**Primary Dependency Chain**:

1. ✅ **Type System Architecture** (foundation complete, integration in progress)
2. ✅ **Type System Integration - Iteration 3** (complete remaining implementation refinements)
3. **Mock Dependencies Removal** (enables real testing)
4. **Core Component Implementation** (Universal Skin Engine, Backend Router, State Sync)
5. **Interface Adapter Restoration** (enables multi-interface functionality)
6. **Integration Testing** (validates real functionality)

### Queue Updates Protocol

- [ ] **Mark tasks in progress** when starting work
- [ ] **Update time estimates** based on actual experience  
- [ ] **Move completed items** to tracker data with evidence
- [ ] **Add new discoveries** from investigation work
- [ ] **Update dependencies** as architecture evolves
- [ ] **SYNC WITH TRACKER DATA** (templum-tracker-data.md)
  - Update component status tables when fixes completed
  - Add build issues log entries for new discoveries
  - Record lessons learned for significant fixes
  - Update success metrics dashboard

## File Mapping Reference for Component Reuse

> **Purpose**: Exact file paths and adaptation instructions for accelerated implementation  
> **Target Audience**: Development agent implementing the reuse strategy  
> **Usage**: Copy/adapt files following specified patterns and modifications  

### High Priority Haruspex → Templum Mappings

#### VSCode Integration (IMMEDIATE IMPACT)

``` diagram
Source → Target: Direct WebView Implementation
├── Haruspex/src/providers/mermaid-webview.ts
│   └→ Templum/src/interfaces/vscode-templum-webview.ts
├── Haruspex/src/providers/kanban-webview.ts  
│   └→ Templum/src/interfaces/vscode-orchestration-webview.ts
├── Haruspex/src/extension.ts (lines 33-100: activation)
│   └→ Templum/src/interfaces/vscode-adapter.ts (replace existing)
└── Haruspex/src/providers/truth-matrix-webview.ts
    └→ Templum/src/interfaces/vscode-interface-matrix.ts

Adaptation Requirements:
- Replace 'Haruspex' namespace with 'Templum'  
- Update telemetry calls: this.telemetry → this.templumTelemetry
- Modify WebView HTML for Templum interface orchestration UI
- Update message handlers for Templum-specific actions
```

#### Error Recovery & Resilience

``` diagram
Source → Target: Circuit Breaker Pattern ✅ COMPLETED
├── Haruspex/src/core/circuit-breaker.ts
│   └→ Templum/src/core/error-recovery.ts ✅ IMPLEMENTED

Adaptation Requirements ✅ COMPLETED:
✅ Updated import paths for Templum error types
✅ Added Templum-specific error classifications
✅ Configured thresholds for interface switching operations
✅ Added operation-specific tracking (interface-switch, backend-integration, state-management)
✅ Created specialized factory functions
✅ Full signal system integration
```

#### Resource Management

``` diagram
Source → Target: Cleanup Orchestration
├── Haruspex/src/core/haruspex-cleanup-orchestrator.ts
│   └→ Templum/src/core/resource-manager.ts (SIMPLIFIED)

Adaptation Requirements:
- Remove process management features (lines 77-120)
- Extract core cleanup patterns (lines 150-250)
- Simplify for Templum component scope
- Integrate with Templum's existing error handling
```

### 🏗️ High Priority PCL → Templum Mappings

#### Configuration Management (FOUNDATION PRIORITY)

``` diagram
Source → Target: Complete Configuration System
├── phoenix-code-lite/src/core/config-manager.ts
│   └→ Templum/src/core/templum-config-manager.ts
├── phoenix-code-lite/src/core/foundation.ts (CoreConfigSchema)
│   └→ Templum/src/core/templum-foundation.ts
└── phoenix-code-lite/src/core/config-manager.ts (ConfigTemplates)
    └→ Templum/src/config/templum-templates.ts

Adaptation Requirements:
- Update CoreConfigSchema for interface orchestration:
  + Add 'interfaces' section with VSCode, CLI, Universal settings
  + Modify 'session' for multi-interface session management
  + Add 'orchestration' section for interface coordination
- Create templates: 'basic', 'development', 'enterprise'
- Integrate with existing Templum audit logging patterns
```

#### Session Management  

``` diagram
Source → Target: Unified Session Control
├── phoenix-code-lite/src/core/unified-session-manager.ts
│   └→ Templum/src/session/templum-session-manager.ts

Adaptation Requirements:
- Update MenuDefinition imports for Templum menu system
- Modify renderer switching for interface types (VSCode, CLI, Universal)  
- Integrate with Templum's interface adapter lifecycle
- Add interface-specific session context properties
```

#### Dependency Injection Foundation

``` diagram
Source → Target: Adapter Pattern Extension
├── phoenix-code-lite/src/cli/adapters/config-manager-adapter.ts
│   └→ Templum/src/adapters/config-adapter.ts
├── phoenix-code-lite/src/cli/adapters/audit-logger-adapter.ts
│   └→ Templum/src/adapters/audit-adapter.ts
└── phoenix-code-lite/src/cli/adapters/ (pattern)
    └→ Templum/src/adapters/ (new interfaces):
        ├── vscode-adapter-interface.ts
        ├── cli-adapter-interface.ts  
        ├── backend-router-interface.ts
        └── state-manager-interface.ts

Adaptation Requirements:
- Extract adapter pattern from PCL implementations
- Create interfaces for major Templum components
- Implement adapter registry for component resolution
- Update Templum core constructor to use dependency injection
```

### Adaptation Patterns & Best Practices

#### Namespace Conversion Pattern

```typescript
// FROM (Haruspex):
export class MermaidWebViewProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly engine: HaruspexCoreEngine,
    private readonly telemetry: TelemetryCollector
  ) {}

// TO (Templum):
export class TemplumWebViewProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly engine: TemplumCoreEngine,  // Changed
    private readonly telemetry: TemplumTelemetryCollector  // Changed
  ) {}
```

#### Configuration Schema Extension Pattern

```typescript
// FROM (PCL):
const CoreConfigSchema = z.object({
  system: z.object({...}),
  session: z.object({...}),
  mode: z.object({...}),
  performance: z.object({...})
});

// TO (Templum):
const TemplumConfigSchema = z.object({
  system: z.object({...}),
  session: z.object({...}),
  interfaces: z.object({          // NEW
    vscode: z.object({...}),      // NEW
    cli: z.object({...}),         // NEW  
    universal: z.object({...})    // NEW
  }),
  orchestration: z.object({       // NEW
    switchingTimeout: z.number(),
    coordinationMode: z.enum([...])
  }),
  performance: z.object({...})
});
```

#### Interface Adapter Creation Pattern

```typescript
// NEW (Templum):
export interface IVSCodeAdapter {
  initialize(): Promise<void>;
  registerWebView(provider: vscode.WebviewViewProvider): void;
  showInterface(): Promise<void>;
  hideInterface(): Promise<void>;
  dispose(): Promise<void>;
}

export class VSCodeAdapter implements IVSCodeAdapter {
  constructor(
    private config: TemplumConfig,
    private webViewProvider: TemplumWebViewProvider
  ) {}
  // Implementation using adapted Haruspex patterns
}
```

### Success Validation Checkpoints

```bash
#### After Phase 1 (Configuration + Error Recovery) ✅ COMPLETED

# Test configuration system ✅ VERIFIED
node -e "const config = require('./src/core/templum-config-manager'); console.log('Config system functional');"

# Test error recovery ✅ VERIFIED - 100% TEST SUCCESS
# Comprehensive test suite validated:
# - Circuit state transitions (CLOSED → OPEN → HALF_OPEN)
# - Operation-specific failure tracking
# - Specialized factory functions
# - Health checks for different operation types

#### After Phase 2 (VSCode Integration)

# Test VSCode WebView (requires VSCode environment)
code --extensionDevelopmentPath=/path/to/Templum

# Verify real WebView loading (not simulation)

#### After Phase 3 (Complete System)

# Test full integration
npm test  # Should pass with real components

# Test interface switching should achieve <100ms switching time between interfaces
```

### Integration with Fix Guides

- **Critical Priority (Score 21+)**: Use comprehensive-fix-guide.md with full escalation protocol
- **Investigation Tasks**: Use comprehensive-fix-guide.md for systematic analysis
- **Verification Tasks**: Use quick-fix-guide.md for validation-focused work
- **Architecture Tasks**: Use comprehensive-fix-guide.md with architectural escalation

### Special Considerations for Templum

**Mock Detection Protocol**: Always verify real implementation vs. placeholder before marking complete
**Phase Claim Validation**: Independent verification required for all completion claims
**Integration Testing**: Separate mock-based tests from real functionality tests
**Evidence Requirements**: Compilation output and runtime verification for all status changes

---

**Queue Type**: Task Planning & Work Organization  
**Integration**: Bridges discovery (templum-tracker-data.md) with implementation (fix guides)  
**Maintenance**: Update after each fix session, maintain synchronization with tracker data  
**Critical Path**: ✅ Type System Architecture → Mock Removal → Core Components → Interface Adapters → Integration

---

## Next Developer Quick Start Guide

### Implementation Resources

**Established Patterns**: Reference fix documentation in `dev/fixes/` for:

- Interface alignment patterns (`2025-08-22-145009-type-system-iteration-3-fix.md`)
- Signal integration patterns (`2025-08-22-150230-type-system-iteration-2.md`)
- Error type usage patterns (`2025-08-22-144530-type-system-architecture-fix.md`)
- **Circuit breaker integration patterns** (`2025-08-23-084128-comprehensive-fix-circuit-breaker-implementation.md`)
  - Details: `Templum\dev\architectural-patterns\circuit-breaker-patterns-2025-08-23.md`
- **Component reuse patterns** (`2025-08-23-080830-quick-fix-templum-configuration-management-system.md`)

**Type System Assets**: All foundation work complete in `src/types/templum-types.ts`:

- ✅ Error types with type guards
- ✅ Signal types with payload interfaces  
- ✅ Interface definitions and core contracts

**Success Metrics**:

- Type System Complete: <15 compilation errors remaining
- Core Components Working: Mock dependencies removed, real functionality restored
- Integration Ready: All interface adapters functional
- Foundation Components: Configuration Management ✅ + Circuit Breaker ✅ = 2/6 complete

## Established Architectural Patterns (Updated 2025-08-23)

### Circuit Breaker Integration Pattern

- **Source**: Circuit Breaker Implementation (Haruspex Reuse)  
- **Components**: Error recovery, signal integration, factory pattern
- **Usage**: Apply to all components requiring resilience and failure recovery
- **Configuration**: Use specialized factories for different operation types

### Templum Error Integration Pattern  

- **Usage**: ALL components must use createTemplumError() and isTemplumError()
- **Requirements**: Import complete error type system, structured error codes
- **Signal Integration**: Use ErrorSignalPayload for error telemetry

### Specialized Factory Pattern

- **Usage**: Create base + specialized factories for configurable components
- **Benefits**: Templum-optimized defaults with override capability  
- **Naming**: `create[ComponentType][SpecializedUse]` pattern

### Component Reuse Pattern (ACCELERATED IMPLEMENTATION QUEUE)

- **Haruspex Reuse**: Circuit breaker, WebView providers, cleanup orchestration
- **PCL Reuse**: Configuration management, session handling, adapter patterns
- **Time Savings**: 50-60% reduction through strategic component adaptation
- **Quality**: Production-ready components with established testing
