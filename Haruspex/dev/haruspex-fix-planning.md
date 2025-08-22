# Haruspex Fix Planning Queue

> **Purpose**: Task planning and work queues for Haruspex issue resolution  
> **Created**: 2025-08-22  
> **Last Updated**: 2025-08-22  
> **Status**: Initial planning queue from discovery phase  
> **Integration**: Used by issue-fix-selector.md, quick-fix-guide.md, comprehensive-fix-guide.md  
> **Data Source**: haruspex-tracker-data.md (status data)

## 🔥 Immediate Priority Queue

**Start Here** - Ready for immediate implementation:

- [ ] **Analysis Engine Implementation**
  - **Priority Score**: 32 (Critical)
  - **Complexity Score**: 25 (High - use comprehensive-fix-guide.md)
  - **Location**: `src/engine/analysis-engine.ts`
  - **Status**: Missing file - core backend analysis service never created
  - **Evidence**: File does not exist, imported by haruspex-backend-service.ts
  - **Next Action**: Create analysis engine with PCL integration interface
  - **Dependencies**: None - can start immediately
  - **Time Estimate**: 1-2 days (architectural implementation)

- [ ] **Prediction Engine Implementation**
  - **Priority Score**: 30 (Critical)
  - **Complexity Score**: 23 (High - use comprehensive-fix-guide.md)
  - **Location**: `src/engine/prediction-engine.ts`
  - **Status**: Missing file - ML predictions service never created
  - **Evidence**: File does not exist, would integrate with analysis engine
  - **Next Action**: Create prediction engine framework
  - **Dependencies**: Analysis Engine (can start in parallel)
  - **Time Estimate**: 1-2 days (architectural implementation)

- [ ] **IPC Server Implementation**
  - **Priority Score**: 28 (Critical)
  - **Complexity Score**: 20 (Medium - use comprehensive-fix-guide.md)
  - **Location**: `src/api/ipc-server.ts`
  - **Status**: Missing file - Templum communication layer missing
  - **Evidence**: File does not exist, needed for cross-process communication
  - **Next Action**: Create IPC server for Templum integration
  - **Dependencies**: None - can start immediately
  - **Time Estimate**: 4-8 hours (well-defined interface)

## 🔧 Investigation Queue

**Requires analysis before implementation**:

- [ ] **Backend Service Dependency Resolution**
  - **Priority Score**: 25 (Critical)
  - **Complexity Score**: 22 (Medium-High)
  - **Location**: `src/haruspex-backend-service.ts`
  - **Status**: Exists but broken - 5+ import errors for non-existent modules
  - **Evidence**: Imports analysis-engine, prediction-engine, cache-manager, diagnostic-system
  - **Next Action**: Map all dependencies, create implementation plan
  - **Dependencies**: Analysis Engine, Prediction Engine, Cache Manager, Diagnostic System
  - **Time Estimate**: 2-4 hours investigation + 1 day implementation

- [ ] **Cache Manager Architecture Design**
  - **Priority Score**: 22 (Critical)
  - **Complexity Score**: 16 (Medium)
  - **Location**: `src/cache/cache-manager.ts`
  - **Status**: Missing file - imported by backend service
  - **Evidence**: Referenced in backend service imports
  - **Next Action**: Design caching strategy for analysis results
  - **Dependencies**: Analysis Engine (for cache content structure)
  - **Time Estimate**: 4-6 hours design + implementation

- [ ] **HTTP Server Implementation**
  - **Priority Score**: 24 (Critical)
  - **Complexity Score**: 18 (Medium)
  - **Location**: `src/api/http-server.ts`
  - **Status**: Missing file - REST API server missing
  - **Evidence**: File does not exist, needed for web API access
  - **Next Action**: Design REST API interface, implement server
  - **Dependencies**: Backend Service, API Contracts
  - **Time Estimate**: 6-10 hours (API design + implementation)

## ✅ Verification Queue

**Claimed working - needs independent verification**:

- [ ] **PCL Integration Workflow Verification**
  - **Priority Score**: 15 (Medium)
  - **Status**: Claimed working, needs validation
  - **Evidence**: Integration adapters exist and pass tests
  - **Next Action**: End-to-end workflow testing
  - **Verification Method**: `scripts/validation/validate-component.js` + manual testing
  - **Time Estimate**: 2-4 hours testing

- [ ] **Legacy VSCode Extension Stability**
  - **Priority Score**: 10 (Low)
  - **Status**: Appears working, comprehensive verification needed
  - **Evidence**: Tests pass, functionality demonstrated
  - **Next Action**: Comprehensive integration testing
  - **Verification Method**: Full extension testing in VSCode
  - **Time Estimate**: 2-3 hours

- [ ] **Component Test Coverage Verification**
  - **Priority Score**: 12 (Low)
  - **Status**: Claims 25+ test files, needs coverage analysis
  - **Evidence**: Test files exist, unclear on actual coverage
  - **Next Action**: Generate coverage report, identify gaps
  - **Verification Method**: `npm run coverage` + analysis
  - **Time Estimate**: 1-2 hours

## 🏗️ Architecture & Technical Debt Queue

**System-level issues requiring design decisions**:

- [ ] **API Gateway Protocol Integration**
  - **Priority Score**: 18 (Medium)
  - **Complexity Score**: 20 (Medium)
  - **Location**: `src/api/gateway/api-gateway.ts`
  - **Status**: Exists but 11+ TypeScript errors - missing 8 protocol modules
  - **Evidence**: Gateway exists, protocol layer incomplete
  - **Next Action**: Complete protocol module implementation
  - **Dependencies**: API Contracts, HTTP Server
  - **Time Estimate**: 8-12 hours (protocol design + implementation)

- [ ] **API Contracts Type System Completion**
  - **Priority Score**: 16 (Medium)
  - **Complexity Score**: 24 (High)
  - **Location**: `src/api/types/api-contracts.ts`
  - **Status**: Exists but 60+ type errors - missing 45+ type definitions
  - **Evidence**: Extensive type system gaps
  - **Next Action**: Complete type system design and implementation
  - **Dependencies**: Backend Service design (for accurate types)
  - **Time Estimate**: 1-2 days (comprehensive type system work)

- [ ] **Diagnostic System Design**
  - **Priority Score**: 14 (Medium)
  - **Complexity Score**: 15 (Medium)
  - **Location**: `src/diagnostics/diagnostic-system.ts`
  - **Status**: Missing file - health monitoring system missing
  - **Evidence**: Referenced in backend service architecture
  - **Next Action**: Design health monitoring and diagnostic framework
  - **Dependencies**: Backend Service, Analysis Engine
  - **Time Estimate**: 6-10 hours (monitoring framework design)

## 📋 Queue Management Guidelines

### Task Selection Rules

1. **Start with Immediate Priority Queue** - highest impact, ready to implement
2. **Investigation items** require analysis before implementation planning
3. **Verification items** are good for shorter sessions or validation-focused work
4. **Architecture items** require design decisions and longer time investment

### Queue Updates Protocol

- [ ] **Mark tasks in progress** when starting work
- [ ] **Update time estimates** based on actual experience  
- [ ] **Move completed items** to appropriate tracker sections
- [ ] **Add new discoveries** from investigation work
- [ ] **Update dependencies** as architecture evolves
- [!] **KEEP PROJECT TRACKER DATA DOCUMENT UPDATED** (./tracker-data.md))
  - *Items here will have related items to be updated/logged in the tracker-data file*
  - *The dashboard and other tables will need updating should a fix be implemented*

### Integration with Fix Guides

- **Immediate Priority**: Use appropriate guide based on complexity score
- **Investigation**: Use comprehensive-fix-guide.md for systematic analysis
- **Verification**: Use quick-fix-guide.md for simple validations
- **Architecture**: Use comprehensive-fix-guide.md with escalation protocol

---
**Queue Type**: Task Planning & Work Organization  
**Integration**: Bridges discovery (./tracker-data.md) with implementation (fix guides)  
**Maintenance**: Update after each fix session, add new discoveries from investigation
