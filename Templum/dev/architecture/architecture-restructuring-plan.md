---
date: 2025-09-13T190000Z
name: templum-architecture-restructuring-plan
TASK-ID: ['TASK-ARCH-001']
category: architecture-planning
status: ['[ ]']
patterns: ['architectural-refactoring', 'component-optimization', 'pattern-organization']
components: ['templum-core', 'interface-adapters', 'backend-services', 'pattern-library']
dependencies: ['existing-architecture', 'backward-compatibility', 'skin-definition-system']
tags: ['architecture', 'restructuring', 'optimization', 'multi-session-plan']
---

# Templum Architecture Restructuring Plan

## Executive Summary

This document outlines a balanced approach to restructuring the Templum architecture, addressing complexity and redundancy while preserving core capabilities: zero-knowledge backend connectivity, dynamic skin-based rendering, and multi-interface support.

## Core Principles

### Must Preserve

1. **Zero-Knowledge Backend Connectivity**: Ability to connect to any backend providing a skin definition without hardcoded knowledge
2. **Dynamic Skin-Based Rendering**: All UI elements generated from skin definitions, no hardcoded paths
3. **Multi-Interface Support**: VSCode, CLI, command mode, and future interfaces
4. **Separation of Concerns**: Clear boundaries between components
5. **LLM-Friendly File Sizes**: Keep files under 2000 lines for agent readability

### Goals

- Reduce redundancy without losing flexibility
- Improve code organization and discoverability
- Optimize performance while maintaining capabilities
- Enhance maintainability across multiple sessions

## Phase 1: Analysis and Documentation (Session 1)

### 1.1 Component Dependency Mapping

**Goal**: Understand exact dependencies before making changes

**Tasks**:

- [ ] Create dependency graph for interface adapters
- [ ] Map backend service component interactions
- [ ] Document pattern usage across codebase
- [ ] Identify truly redundant vs necessarily separated code

**Deliverables**:

- `component-dependency-map.md`
- `pattern-usage-analysis.md`
- `redundancy-report.md`

### 1.2 Safe Consolidation Candidates

**Goal**: Identify what can be safely merged without breaking core capabilities

**Safe to Merge**:

- Utility functions with identical functionality
- Validation logic that's duplicated across components
- Error handling patterns that are repeated
- Test utilities and helpers

**Must Keep Separate**:

- Interface adapters (each serves different UI paradigm)
- Service discovery mechanisms (enable zero-knowledge connectivity)
- Skin rendering engines (maintain interface independence)
- Connection factories (support multiple protocol types)

## Phase 2: Utility Consolidation (Session 2)

### 2.1 Create Shared Utility Libraries

**Goal**: Eliminate massive code duplication by creating centralized utilities

#### 2.1.1 Logging Utility

**Problem**: 1,840 console.log/warn/error calls across 75 files

**Solution**: Create `utils/logger.ts`

```typescript
export class Logger {
  private context: string;
  private level: LogLevel;
  
  // Structured logging with context
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error, data?: any): void;
  debug(message: string, data?: any): void;
  
  // Performance logging
  time(label: string): void;
  timeEnd(label: string): void;
  
  // Child loggers for components
  child(context: string): Logger;
}
```

**Benefits**:

- Consistent log format
- Easy to switch logging backends
- Structured data for debugging
- Performance tracking built-in

#### 2.1.2 Error Handling Utility

**Problem**: 638 catch blocks across 80 files with similar patterns

**Solution**: Create `utils/error-handler.ts`

```typescript
export class ErrorHandler {
  // Standardized error handling
  static handle(error: unknown, context: string): TemplumError;
  static handleAsync<T>(
    promise: Promise<T>, 
    context: string,
    fallback?: T
  ): Promise<T>;
  
  // Common error patterns
  static wrap<T>(fn: () => T, context: string): T | null;
  static wrapAsync<T>(
    fn: () => Promise<T>, 
    context: string
  ): Promise<T | null>;
  
  // Error recovery strategies
  static withFallback<T>(
    fn: () => T,
    fallback: T,
    logError?: boolean
  ): T;
}
```

#### 2.1.3 Async Utilities

**Problem**: 252 setTimeout/setInterval calls, retry logic in only 3 files

**Solution**: Create `utils/async-utils.ts`

```typescript
export class AsyncUtils {
  // Retry with exponential backoff
  static retry<T>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T>;
  
  // Timeout wrapper
  static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutError?: Error
  ): Promise<T>;
  
  // Debounce/throttle
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delayMs: number
  ): T;
  
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    limitMs: number
  ): T;
  
  // Promise utilities
  static sleep(ms: number): Promise<void>;
  static raceWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T>;
}
```

#### 2.1.4 Terminal Formatting Utility

**Problem**: 279 chalk calls across 14 files, inconsistent formatting

**Solution**: Create `utils/terminal-formatter.ts`

```typescript
export class TerminalFormatter {
  private theme: TerminalTheme;
  
  // Semantic formatting
  success(text: string): string;
  error(text: string): string;
  warning(text: string): string;
  info(text: string): string;
  
  // UI elements
  border(style: BorderStyle): string;
  separator(width: number): string;
  table(data: any[][], options?: TableOptions): string;
  
  // Progressive enhancement
  static detectCapabilities(): TerminalCapabilities;
  withFallback(text: string, fallback: string): string;
}
```

#### 2.1.5 Validation Utility

**Problem**: Validation logic scattered across multiple components

**Solution**: Create `utils/validator.ts`

```typescript
export class Validator {
  // Common validation patterns
  static isValidPort(port: number): boolean;
  static isValidUrl(url: string): boolean;
  static isValidPath(path: string): boolean;
  static isValidSkinDefinition(skin: any): boolean;
  
  // Schema validation
  static validateSchema<T>(
    data: unknown,
    schema: Schema
  ): ValidationResult<T>;
  
  // Composite validation
  static all(...validators: Validator[]): Validator;
  static any(...validators: Validator[]): Validator;
}
```

#### 2.1.6 Path Utility

**Problem**: Path manipulation repeated across files

**Solution**: Create `utils/path-utils.ts`

```typescript
export class PathUtils {
  // Safe path operations
  static safejoin(...paths: string[]): string;
  static normalize(path: string): string;
  static relative(from: string, to: string): string;
  
  // File system helpers
  static async exists(path: string): Promise<boolean>;
  static async ensureDir(path: string): Promise<void>;
  static async readJSON<T>(path: string): Promise<T>;
  static async writeJSON(path: string, data: any): Promise<void>;
}
```

### 2.2 Migration Strategy

**Phase 2a: Create Utilities** (Session 2a)

1. Create `src/utils/` directory
2. Implement each utility with tests
3. Export from central `utils/index.ts`

**Phase 2b: Gradual Migration** (Session 2b)

1. Update one module at a time
2. Replace inline implementations with utility calls
3. Run tests after each module update
4. Document any behavior changes

### 2.3 Expected Impact

**Code Reduction**:

- ~2000 lines removed from duplicate implementations
- ~30% reduction in total codebase size
- Consistent behavior across all components

**Quality Improvements**:

- Centralized error handling
- Consistent logging format
- Reliable retry logic
- Better debugging capabilities

## Phase 3: File Size Optimization (Session 3)

### 3.1 Split Large Files

**Problem**: Some files exceed LLM-friendly sizes

**Action Items**:

```diagram
backend-service-router.ts (120KB) → Split into:
  ├── backend-service-core.ts (~30KB)
  ├── backend-health-monitor.ts (~20KB)
  ├── backend-connection-manager.ts (~30KB)
  ├── backend-command-handler.ts (~20KB)
  └── backend-event-coordinator.ts (~20KB)

cli-adapter-abstracted.ts (75KB) → Split into:
  ├── cli-adapter-core.ts (~25KB)
  ├── cli-navigation-handler.ts (~20KB)
  ├── cli-rendering-engine.ts (~15KB)
  └── cli-state-manager.ts (~15KB)
```

### 3.2 Consolidate Small Related Files

**Only merge files that**:

- Have identical purposes
- Are always used together
- Don't exceed 1500 lines combined
- Don't break separation of concerns

**Examples**:

```diagram
display-standards-calculator.ts + layout-normalizer.ts 
  → display-layout-utils.ts (if < 1500 lines)

service-discovery-validator.ts (inline into service-discovery.ts 
  if total < 2000 lines)
```

## Phase 4: Pattern Organization (Session 4)

### 4.1 Pattern Categorization (Keep All 71 Patterns)

**Instead of reducing patterns, organize them better**:

```diagram
patterns/
├── README.md (pattern index with search tags)
├── core-patterns/ (10-12 patterns)
│   ├── dependency-injection.md
│   ├── error-recovery.md
│   └── ...
├── interface-patterns/ (12-15 patterns)
│   ├── cli-specific/
│   ├── vscode-specific/
│   └── shared/
├── backend-patterns/ (12-15 patterns)
│   ├── service-discovery/
│   ├── connection-management/
│   └── protocol-handling/
├── ui-patterns/ (15-18 patterns)
│   ├── window-management/
│   ├── terminal-rendering/
│   └── accessibility/
├── testing-patterns/ (10-12 patterns)
└── experimental-patterns/ (10-12 patterns)
```

### 4.2 Pattern Index Enhancement

**Create searchable index with**:

- Use case mappings
- Dependency relationships
- Implementation complexity
- Session history (which patterns used in which tasks)

## Phase 5: Interface Layer Optimization (Session 5)

### 5.1 Preserve Adapter Separation

**Keep distinct adapters for**:

- `cli-adapter.ts` - CLI-specific implementation
- `vscode-adapter.ts` - VSCode extension integration
- `command-adapter.ts` - Command mode handling

**But create shared utilities**:

- `interface-utils.ts` - Common adapter utilities
- `adapter-base.ts` - Shared base class (if applicable)

### 5.2 Window Management Consolidation

**Carefully merge display components**:

```typescript
// window-manager.ts - Consolidated but modular
export class WindowManager {
  private borderRenderer: BorderRenderer;
  private layoutCalculator: LayoutCalculator;
  private displayNormalizer: DisplayNormalizer;
  
  // Keep internal separation but single export
}
```

## Phase 6: Backend Optimization (Session 6)

### 6.1 Backend Service Architecture

**Preserve flexibility while reducing redundancy**:

```filesystem
backend/
├── core/
│   ├── backend-manager.ts (orchestration only)
│   ├── connection-factory.ts (KEEP - enables zero-knowledge)
│   └── service-discovery.ts (KEEP - critical for dynamic backends)
├── protocols/
│   ├── http-handler.ts
│   ├── websocket-handler.ts
│   └── ipc-handler.ts
├── integration/
│   ├── pcl-integration.ts (KEEP if PCL-specific)
│   └── skin-loader.ts
└── utils/
    ├── backend-validators.ts
    └── backend-health.ts
```

### 6.2 Maintain Protocol Abstraction

**Critical**: Keep protocol handling abstract to support any backend type

## Phase 7: State Management (Session 7)

### 7.1 Careful State Consolidation

**Merge only if**:

- Combined size < 1500 lines
- Clear module boundaries can be maintained
- No interface-specific state logic is mixed

```typescript
// state-manager.ts - Modular internal structure
export class StateManager {
  private sessionManager: SessionManager;
  private syncManager: SyncManager;
  private persistenceManager: PersistenceManager;
  
  // Public API remains simple
  public async saveState(): Promise<void>;
  public async loadState(): Promise<State>;
  public async syncState(): Promise<void>;
}
```

## Phase 8: Testing and Validation (Session 8)

### 8.1 Validation Approach

**Before removing any abstraction**:

1. Write test to verify current capability
2. Make change
3. Ensure test still passes
4. Document any API changes

### 8.2 Critical Test Scenarios

- [ ] Connect to unknown backend with only skin definition
- [ ] Switch between CLI and VSCode interfaces preserving state
- [ ] Render complex UI from skin without hardcoded elements
- [ ] Handle multiple simultaneous backend connections
- [ ] Gracefully degrade when components unavailable

## Phase 9: Documentation and Cleanup (Session 9)

### 9.1 Documentation Updates

- Update architecture diagrams
- Revise pattern index with new organization
- Document breaking changes (if any)
- Create migration guide for dependent projects

### 9.2 Code Cleanup

**Safe cleanup tasks**:

- Remove commented code blocks
- Delete truly unused files (after verification)
- Standardize import statements
- Consistent error handling patterns

## Implementation Guidelines

### For Each Session

1. **Start with**: Review this plan and previous session's work
2. **Focus on**: One phase only (don't jump ahead)
3. **Document**: Changes made and decisions
4. **Test**: Run validation suite after changes
5. **Commit**: With clear message referencing this plan

### Decision Framework

**When considering merging components, ask**:

1. Will this break zero-knowledge backend connectivity?
2. Will this couple interface-specific logic?
3. Will the merged file exceed 2000 lines?
4. Does this preserve separation of concerns?
5. Can this be split instead of merged?

**If any answer is "yes" to 1-3 or "no" to 4**: Don't merge, refactor instead

### Risk Mitigation

1. **Feature Branches**: One branch per phase
2. **Incremental Changes**: Small, testable commits
3. **Backward Compatibility**: Maintain old APIs during transition
4. **Validation Suite**: Run after each change
5. **Rollback Plan**: Keep original structure accessible

## Success Metrics

### Quantitative

- No files over 2000 lines (LLM-friendly)
- Pattern organization improves discoverability (measurable via search success)
- Startup time improved by 20%
- Test coverage maintained at >80%

### Qualitative

- Preserved all core capabilities
- Improved code discoverability
- Easier multi-session development
- Clearer separation of concerns
- Better pattern organization

## Session Plan

### Session Breakdown (Estimated)

1. **Session 1** (2-3 hours): Analysis and documentation
2. **Session 2a** (2-3 hours): Create utility libraries
3. **Session 2b** (3-4 hours): Migrate to utilities across codebase
4. **Session 3** (3-4 hours): File size optimization (split large files)
5. **Session 4** (2-3 hours): Pattern organization
6. **Session 5** (3-4 hours): Interface layer optimization
7. **Session 6** (3-4 hours): Backend optimization
8. **Session 7** (2-3 hours): State management
9. **Session 8** (2-3 hours): Testing and validation
10. **Session 9** (2-3 hours): Documentation and cleanup

**Total Estimated Time**: 24-32 hours across 10 sessions

**Priority Impact**: Utility consolidation (Sessions 2a-2b) will likely have the highest impact on code quality and maintainability, reducing duplicate code by ~2000 lines.

## Notes and Warnings

### Critical Warnings

- **DO NOT** merge interface adapters - they enable multi-interface support
- **DO NOT** combine service discovery with specific implementations
- **DO NOT** hardcode any paths or navigation - preserve skin-based generation
- **DO NOT** create files over 2000 lines - split instead

### Architecture Philosophy

The current complexity exists for good reasons. The goal is not maximum simplification but optimal organization. Every abstraction should be evaluated for its purpose:

- Does it enable flexibility?
- Does it preserve capability?
- Does it maintain separation of concerns?

If yes to any, preserve it but organize it better.

## Appendix: Current Architecture Issues

### Identified Problems

1. **File Sizes**: Several files exceed LLM-friendly limits
2. **Pattern Overload**: 71 patterns without clear organization
3. **Redundant Validation**: Similar validation logic in multiple places
4. **Complex Dependencies**: Unclear component relationships
5. **Mixed Concerns**: Some files handle multiple responsibilities

### Preserved Strengths

1. **Flexibility**: Connect to any backend type
2. **Extensibility**: Easy to add new interfaces
3. **Skin System**: Complete UI generation from definitions
4. **Protocol Agnostic**: Support multiple connection types
5. **State Management**: Comprehensive state preservation

## Conclusion

This restructuring plan balances optimization with preservation of core capabilities. By focusing on organization rather than aggressive consolidation, we maintain the flexibility that makes Templum powerful while improving maintainability and discoverability.

The multi-session approach ensures thorough testing and validation at each step, reducing the risk of breaking critical functionality. Each session has clear goals and deliverables, making progress trackable and reversible if needed.
