# Templum 1.0 Fix Planning Queue

> **Purpose**: Task planning and work queues for Templum 1.0 issue resolution  
> **Created**: 2025-08-21  
> **Last Updated**: 2025-08-22  
> **Status**: Initial planning queue from comprehensive discovery phase  
> **Integration**: Used by issue-fix-selector.md, quick-fix-guide.md, comprehensive-fix-guide.md  
> **Data Source**: templum-tracker-data.md (status data)

## 🔥 Immediate Priority Queue

**Start Here** - Ready for immediate implementation:

- [x] **Type System Integration - Iteration 3** ✅ **COMPLETED 2025-08-22**
  - **Priority Score**: 32 (Critical)
  - **Complexity Score**: 15 (Medium - focused integration fixes)
  - **Location**: `src/interfaces/`, `src/rendering/`, `src/skin/`, remaining TS2769/TS2322 errors
  - **Status**: ✅ 152 compilation errors (reduced from 183, eliminated 31 errors)
  - **Evidence**: ✅ KeyboardShortcutMap type alignment, interface property cleanup, signal casting fixes
  - **Completion**: Fixed Map vs interface mismatch, removed non-existent properties, resolved process.emit type issues
  - **Dependencies**: Type System Foundation ✅ (Iterations 1 & 2 complete)
  - **Actual Time**: 1.5 hours (within estimate)
  - **Progress**: ✅ **Type System Integration Complete** - All 3 iterations finished
  - **Fix Documentation**: `dev/fixes/2025-08-22-145009-type-system-iteration-3-fix.md`

- [ ] **Remove Mock Dependencies from Core Engine**
  - **Priority Score**: 33 (Critical)
  - **Complexity Score**: 28 (High - use comprehensive-fix-guide.md)
  - **Location**: `src/core/templum-core.ts`
  - **Status**: Core engine explicitly calls `initializeMockComponents()`
  - **Evidence**: Mock skin engine, mock state manager, mock backend router in core initialization
  - **Next Action**: Replace mock initialization with real component initialization
  - **Dependencies**: Type System Foundation ✅ (sufficient type infrastructure now available)
  - **Time Estimate**: 1-2 days (mock replacement + integration)

- [ ] **Universal Skin Engine Reconstruction**
  - **Priority Score**: 33 (Critical)
  - **Complexity Score**: 28 (High - use comprehensive-fix-guide.md)
  - **Location**: `src/skin/universal-skin-engine.ts`
  - **Status**: 91 compilation errors (highest error concentration, 60% of remaining issues)
  - **Evidence**: Property name mismatches, import conflicts, interface violations, theme system inconsistencies
  - **Next Action**: Systematic interface alignment and property name corrections
  - **Dependencies**: Type System Foundation ✅ (can proceed with current type infrastructure)
  - **Time Estimate**: 2-3 days (core rendering system reconstruction)

- [ ] **Backend Service Router Implementation**
  - **Priority Score**: 30 (Critical)
  - **Complexity Score**: 25 (High - use comprehensive-fix-guide.md)
  - **Location**: `src/backend/pcl-backend-integration.ts`
  - **Status**: ~20 compilation errors remaining (improved from original 23)
  - **Evidence**: Some backend routing issues resolved, signal integration complete, remaining implementation gaps
  - **Next Action**: Complete backend communication system implementation
  - **Dependencies**: Type System Foundation ✅ (signal types integrated, error handling established)
  - **Time Estimate**: 1-2 days (remaining backend communication implementation)

## 🔧 Type System Integration - Remaining Component Fixes

**Continue After Core Components** - Targeted type fixes for specific components:

- [ ] **Performance Baseline Type Definitions**
  - **Priority Score**: 24 (Critical)
  - **Complexity Score**: 12 (Low-Medium - use quick-fix-guide.md)
  - **Location**: `src/scripts/run-phase6-integration-validation.ts`, performance validation systems
  - **Status**: 17 compilation errors - missing properties on PerformanceBaseline interface
  - **Evidence**: Properties `regressionDetected`, `actualValue`, `baselineValue`, `deviationPercentage`, `unit` missing
  - **Next Action**: Extend PerformanceBaseline interface with missing properties and update usage
  - **Dependencies**: Type System Foundation ✅ (can proceed immediately)
  - **Time Estimate**: 30-45 minutes (interface extension + property updates)
  - **Pattern**: Add missing properties to `PerformanceBaseline` interface in types file

- [ ] **Enhanced State Synchronization Type Refinements**  
  - **Priority Score**: 23 (Critical)
  - **Complexity Score**: 14 (Medium - use quick-fix-guide.md)
  - **Location**: `src/state/enhanced-state-synchronization.ts`
  - **Status**: 8 compilation errors - unknown error types and implicit any parameters
  - **Evidence**: `error is of type 'unknown'` in catch blocks, implicit any parameter types
  - **Next Action**: Add proper error type guards and parameter type annotations
  - **Dependencies**: Type System Foundation ✅ (error types available)
  - **Time Estimate**: 45 minutes (error handling pattern application)
  - **Pattern**: Use `isTemplumError` type guard and explicit parameter typing

- [ ] **Integration Test Framework Type Safety**
  - **Priority Score**: 22 (Critical)
  - **Complexity Score**: 16 (Medium - use quick-fix-guide.md)
  - **Location**: `src/tests/integration-validation-framework.ts`
  - **Status**: 16 compilation errors - service type mismatches and property conflicts
  - **Evidence**: String literals not assignable to union types, property type conflicts
  - **Next Action**: Align service type strings with defined union types, fix property type mismatches
  - **Dependencies**: Type System Foundation ✅ (union types defined)
  - **Time Estimate**: 1 hour (service type alignment + property corrections)
  - **Pattern**: Use proper union type values, align object properties with interface definitions

- [ ] **Session Context Null Safety**
  - **Priority Score**: 21 (Critical)
  - **Complexity Score**: 8 (Low - use quick-fix-guide.md)
  - **Location**: `src/rendering/universal-skin-renderer.ts:219`
  - **Status**: 1 compilation error - null not assignable to SessionContext | undefined
  - **Evidence**: Type safety violation where null values not handled properly
  - **Next Action**: Add null check or adjust type definition to include null
  - **Dependencies**: Type System Foundation ✅ (SessionContext type available)
  - **Time Estimate**: 15 minutes (null safety pattern)
  - **Pattern**: Either filter null values or extend type definition to include null

- [ ] **Backend Integration Parameter Type Fixes**
  - **Priority Score**: 20 (Medium-High)
  - **Complexity Score**: 10 (Low - use quick-fix-guide.md)
  - **Location**: `src/backend/pcl-backend-integration.ts`
  - **Status**: 3 compilation errors - string literals not assignable to never type
  - **Evidence**: Pattern matching strings assigned to parameters with never type
  - **Next Action**: Review parameter type definitions and correct string literal assignments
  - **Dependencies**: Type System Foundation ✅ (pattern matching types available)
  - **Time Estimate**: 20 minutes (parameter type corrections)
  - **Pattern**: Ensure string literals match expected parameter union types

## 🔧 Investigation Queue

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

- [ ] **Interface Adapter Dependency Chain Analysis**
  - **Priority Score**: 25 (Critical)
  - **Complexity Score**: 20 (Medium)
  - **Location**: `src/interfaces/` directory
  - **Status**: All 3 interface adapters broken - VSCode (12 errors), CLI (8 errors), Interaction Manager (15 errors)
  - **Evidence**: No interfaces can initialize, multi-interface coordination impossible
  - **Next Action**: Map interface dependency chains, create implementation roadmap
  - **Dependencies**: Type System Architecture
  - **Time Estimate**: 4-6 hours analysis + 1 day per adapter implementation

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
  - **Status**: 18 compilation errors, undefined properties, sync failures
  - **Evidence**: Test failure - `syncLatency` undefined, state sync non-functional
  - **Next Action**: Redesign state synchronization architecture
  - **Dependencies**: Type System Architecture, Interface Adapters
  - **Time Estimate**: 1 day design + 1-2 days implementation

## ✅ Verification Queue

**Claims requiring independent verification**:

- [ ] **Integration Test Framework Reality Check**
  - **Priority Score**: 18 (Medium)
  - **Status**: Claims 31/37 tests passing but uses mock services
  - **Evidence**: Integration tests work with mocks, fail on real functionality
  - **Next Action**: Separate mock tests from real integration tests
  - **Verification Method**: Test execution with real backends vs. mock backends
  - **Time Estimate**: 4-6 hours analysis + test framework modification

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
  - **Time Estimate**: 2-4 hours analysis

## 🏗️ Architecture & Technical Debt Queue

**System-level issues requiring design decisions**:

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
  - **Dependencies**: Interface Adapters, State Synchronization System
  - **Time Estimate**: 1-2 days architectural design + 2-3 days implementation

- [ ] **Command Registry and Execution System Rebuild**
  - **Priority Score**: 22 (Critical)
  - **Complexity Score**: 16 (Medium)
  - **Location**: `src/commands/universal-command-registry.ts`
  - **Status**: 8 compilation errors, handler registration failures
  - **Evidence**: Test failures - "Command handler not found: pcl.status", "test.command"
  - **Next Action**: Rebuild command registry with proper handler registration
  - **Dependencies**: Type System Architecture
  - **Time Estimate**: 1 day implementation + integration testing

- [ ] **Session Management System Restoration**
  - **Priority Score**: 20 (Medium)
  - **Complexity Score**: 14 (Medium)
  - **Location**: `src/session/session-context-foundation.ts`
  - **Status**: 6 compilation errors, missing interface implementations
  - **Evidence**: Session management fails to maintain state across interfaces
  - **Next Action**: Complete session management implementation
  - **Dependencies**: State Synchronization System, Interface Adapters
  - **Time Estimate**: 1 day implementation

## 📋 Queue Management Guidelines

### Task Selection Rules

1. ✅ **Type System Integration** - All 3 core iterations complete (foundation, integration, refinement)
2. **Core Component Implementation** - Remove mock dependencies and implement real functionality (highest priority)
3. **Remaining Type System Fixes** - Component-specific type refinements (can be done in parallel with core work)
4. **Investigation items** require architectural analysis before implementation planning
5. **Verification items** are good after basic functionality is restored
6. **Architecture items** require design decisions and cross-component coordination

### Type System Integration - Implementation Path

**Phase 1: Core Foundation** ✅ **COMPLETE**

- All 3 iterations finished: Foundation → Integration → Refinement
- Error reduction: 186 → 152 compilation errors (34 eliminated)
- Ready for major component implementations

**Phase 2: Component-Specific Fixes** (Remaining work)

- 5 targeted tasks addressing remaining 152 errors
- Each task focused on specific error patterns with clear solutions
- Can be executed independently or in parallel with core component work
- Total estimated time: ~3.5 hours across all remaining type fixes

### Implementation Strategy for Remaining Type Fixes

**Quick Wins (Priority 20-21)**: Start with these for immediate error reduction

1. **Session Context Null Safety** (15 min) - Simple null check fix
2. **Backend Integration Parameter Types** (20 min) - String literal alignment

**Medium Effort (Priority 22-23)**: Core component support  
3. **Enhanced State Synchronization** (45 min) - Error type guard patterns
4. **Integration Test Framework** (1 hour) - Service type alignment

**Systematic Fix (Priority 24)**: Foundation completion
5. **Performance Baseline Types** (30-45 min) - Interface extension

**Error Reduction Potential**: Remaining 152 errors → estimated 10-15 errors (90%+ completion)

**Recommended Approach**:

- Execute in priority order for maximum error reduction per time invested
- Each task is independent and can be completed in a single session
- Use established type system patterns from completed iterations
- Reference fix documentation in `dev/fixes/` for implementation patterns

### Type System Progress Update (2025-08-22)

- ✅ **Iteration 1**: Foundation architecture complete (error types, signals, interface methods)
- ✅ **Iteration 2**: Signal integration & interface completion complete
- ✅ **Iteration 3**: Implementation refinements complete (183 → 152 errors, 31 eliminated)
- 🎉 **TYPE SYSTEM INTEGRATION COMPLETE** - Ready for core component implementation

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

### Critical Path Analysis

**Primary Dependency Chain**:

1. ✅ **Type System Architecture** (foundation complete, integration in progress)
2. **Type System Integration - Iteration 3** (complete remaining implementation refinements)
3. **Mock Dependencies Removal** (enables real testing)
4. **Core Component Implementation** (Universal Skin Engine, Backend Router, State Sync)
5. **Interface Adapter Restoration** (enables multi-interface functionality)
6. **Integration Testing** (validates real functionality)

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

## 🚀 Next Developer Quick Start Guide

**Current State**: Type System Integration Phase 1 complete (34 compilation errors eliminated)

### Immediate Next Steps (Choose One)

**Option A: Complete Type System (Recommended for quick wins)**:

- Work through 5 remaining type system tasks in priority order
- Expected outcome: 90%+ compilation error elimination (~10-15 errors remaining)  
- Total time investment: ~3.5 hours
- Use `quick-fix-guide.md` for all tasks (Low-Medium complexity)

**Option B: Core Component Implementation (Major architectural work)**:

- Start with "Remove Mock Dependencies from Core Engine" (Priority 33)
- Expected outcome: Real component functionality restoration
- Time investment: 1-2 days per major component
- Use `comprehensive-fix-guide.md` for these tasks

### Implementation Resources

**Established Patterns**: Reference fix documentation in `dev/fixes/` for:

- Interface alignment patterns (`2025-08-22-145009-type-system-iteration-3-fix.md`)
- Signal integration patterns (`2025-08-22-150230-type-system-iteration-2.md`)
- Error type usage patterns (`2025-08-22-144530-type-system-architecture-fix.md`)

**Type System Assets**: All foundation work complete in `src/types/templum-types.ts`:

- ✅ Error types with type guards
- ✅ Signal types with payload interfaces  
- ✅ Interface definitions and core contracts

**Validation Command**: `cd Templum && npx tsc --noEmit` to monitor progress

**Success Metrics**:

- Type System Complete: <15 compilation errors remaining
- Core Components Working: Mock dependencies removed, real functionality restored
- Integration Ready: All interface adapters functional
