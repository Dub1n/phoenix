---
date-created: 2025-09-14T181000Z
last-updated: 2025-09-14T181000Z
name: error-handler-utility-consolidation-pattern
description: Centralized error handling to standardize 695 catch blocks with consistent error wrapping, recovery strategies, and minimal usage footprint
status: established
category: core-infrastructure
use-when:
  - Standardizing scattered try/catch blocks across components
  - Need for consistent error wrapping and recovery patterns
  - Timeout and retry error handling required
  - Centralized error logging and context management needed
keywords:
  - error-handling
  - catch-block-consolidation
  - error-recovery
  - timeout-management
  - structured-errors
prerequisites:
  - logger-utility
related-patterns:
  - async-utils-utility
  - logger-utility
  - resilience-utils-utility
---

### Error Handler Utility Consolidation Pattern

**Problem**: Templum has 695 catch blocks with repeated patterns of manual error wrapping, inconsistent timeout handling, and scattered recovery strategies across 80+ files.

**Current State Examples**:

```typescript
try {
  const result = await backendOperation();
  return result;
} catch (error) {
  console.error(`[BACKEND] Operation failed: ${error.message}`);
  return createTemplumError('OPERATION_FAILED', error.message);
}

// Manual timeout with cleanup
const timeoutId = setTimeout(() => {
  reject(new Error('Operation timed out'));
}, 5000);
try {
  const result = await operation();
  clearTimeout(timeoutId);
  return result;
} catch (error) {
  clearTimeout(timeoutId);
  throw error;
}
```

**Solution**: Centralized ErrorHandler utility with one-line error wrapping, automatic timeout management, recovery strategies, and integration with structured logging.

#### Error Handler Implementation

**Core ErrorHandler Class** (Minimal Usage Design):

```typescript
import { createLogger } from './logger-utility';

export class ErrorHandler {
  private static logger = createLogger('error-handler');
  
  // One-line error handling with automatic context
  static handle(error: unknown, context: string): TemplumError {
    const templumError = this.wrapError(error, context);
    this.logger.error(`Error in ${context}`, templumError, { originalError: error });
    return templumError;
  }
  
  // Async operation wrapper with timeout and error handling  
  static async handleAsync<T>(
    promise: Promise<T>, 
    context: string,
    options: AsyncErrorOptions = {}
  ): Promise<T> {
    const { timeout = 5000, fallback } = options;
    
    try {
      if (timeout > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`${context} timed out after ${timeout}ms`)), timeout);
        });
        return await Promise.race([promise, timeoutPromise]);
      } else {
        return await promise;
      }
    } catch (error) {
      const templumError = this.handle(error, context);
      if (fallback !== undefined) {
        this.logger.warn(`Using fallback for ${context}`, { fallback });
        return fallback;
      }
      throw templumError;
    }
  }
  
  // Synchronous operation wrapper - minimal footprint
  static wrap<T>(fn: () => T, context: string): T | null {
    try {
      return fn();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }
  
  // Async operation wrapper without timeout
  static async wrapAsync<T>(
    fn: () => Promise<T>, 
    context: string,
    fallback?: T
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      return fallback ?? null;
    }
  }
  
  // Operation with fallback - guaranteed return
  static withFallback<T>(
    fn: () => T,
    fallback: T,
    context: string,
    logError: boolean = true
  ): T {
    try {
      return fn();
    } catch (error) {
      if (logError) {
        this.handle(error, context);
      }
      return fallback;
    }
  }
  
  // Async operation with fallback
  static async withFallbackAsync<T>(
    fn: () => Promise<T>,
    fallback: T,
    context: string,
    logError: boolean = true
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (logError) {
        this.handle(error, context);
      }
      return fallback;
    }
  }
  
  // Retry operation with exponential backoff
  static async retry<T>(
    fn: () => Promise<T>,
    context: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000 } = options;
    
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        this.logger.warn(`${context} failed, retrying in ${delay}ms`, { 
          attempt, 
          maxAttempts, 
          error: error instanceof Error ? error.message : String(error) 
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw this.handle(lastError, `${context} (after ${maxAttempts} attempts)`);
  }
  
  private static wrapError(error: unknown, context: string): TemplumError {
    if (isTemplumError(error)) {
      return error;
    }
    
    if (error instanceof Error) {
      return createTemplumError('OPERATION_FAILED', `${context}: ${error.message}`, {
        originalError: error.message,
        stack: error.stack,
        context
      });
    }
    
    return createTemplumError('UNKNOWN_ERROR', `${context}: ${String(error)}`, {
      originalError: String(error),
      context
    });
  }
}

// Types for configuration
interface AsyncErrorOptions {
  timeout?: number;
  fallback?: any;
}

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

// Convenience functions for even more minimal usage
export const { handle, handleAsync, wrap, wrapAsync, withFallback, retry } = ErrorHandler;
```

#### Usage Examples (Minimal Footprint)

**Before** (Current scattered approach):

```typescript
// Manual error handling with logging (87 patterns in backend-service-router.ts)
try {
  const connection = await this.connectToBackend(config);
  return connection;
} catch (error) {
  console.error(`[BACKEND_ROUTER] Connection failed: ${error.message}`);
  return createTemplumError('CONNECTION_FAILED', error.message);
}

// Manual timeout with cleanup (54 patterns in connection-factory.ts)
return new Promise((resolve, reject) => {
  const timeoutId = setTimeout(() => {
    reject(new Error('Connection timeout'));
  }, 5000);
  
  this.attemptConnection()
    .then(result => {
      clearTimeout(timeoutId);
      resolve(result);
    })
    .catch(error => {
      clearTimeout(timeoutId);
      reject(createTemplumError('CONNECTION_FAILED', error.message));
    });
});
```

**After** (Consolidated with one-line calls):

```typescript
// One-line error handling with automatic logging and context
const connection = await handleAsync(
  this.connectToBackend(config),
  'backend-connection'
);

// One-line operation with timeout (auto-cleanup)
const connection = await handleAsync(
  this.attemptConnection(),
  'connection-attempt',
  { timeout: 5000 }
);

// One-line with fallback
const config = withFallback(
  () => this.loadConfig(),
  defaultConfig,
  'config-loading'
);

// One-line retry with exponential backoff
const result = await retry(
  () => this.unstableOperation(),
  'unstable-operation',
  { maxAttempts: 3, baseDelay: 1000 }
);

// Ultra-minimal sync error handling
const result = wrap(() => dangerousOperation(), 'dangerous-op');
```

#### Files Using This Pattern

**Backend Components** (Heavy async error handling):

- [ ] `src/backend/backend-service-router.ts` (87 catch blocks → `handleAsync` patterns)
- [ ] `src/backend/service-discovery.ts` (76 catch blocks → `retry` and `withFallback` patterns)
- [ ] `src/backend/connection-factory.ts` (54 catch blocks → `handleAsync` with timeout)
- [ ] `src/backend/dynamic-command-router.ts` (34 catch blocks → `wrap` patterns)

**Interface Components** (UI error handling):

- [ ] `src/interfaces/cli-adapter-abstracted.ts` (63 catch blocks → `withFallback` for UI stability)
- [ ] `src/interfaces/terminal-ui-components.ts` (41 catch blocks → `wrap` for component safety)
- [ ] `src/interfaces/cli-adapter.ts` (37 catch blocks → error handling with user feedback)

**Core Components** (System error handling):

- [ ] `src/core/templum-core.ts` (58 catch blocks → orchestrator error management)
- [ ] `src/skin/universal-skin-engine.ts` (71 catch blocks → skin processing error recovery)
- [ ] `src/session/templum-universal-session-manager.ts` (45 catch blocks → session state recovery)

**All Additional Components** (74+ files with remaining 129 catch blocks):

- [ ] All components with try/catch patterns migrate to centralized error handling

#### Expected Impact

**Quantitative Benefits**:

- **Catch Blocks Standardized**: 695 catch blocks → consistent error handling patterns
- **Files Affected**: 80+ files with try/catch usage
- **Lines Reduced**: ~400 lines of manual error handling code
- **Consistency**: 100% consistent error wrapping and logging

**Qualitative Benefits**:

- **Automatic Timeout Management**: No more manual timeout cleanup
- **Structured Error Logging**: Integration with logger utility
- **Recovery Strategies**: Built-in fallback and retry patterns
- **Context Preservation**: All errors include operation context
- **Type Safety**: Proper TemplumError wrapping

#### Integration with Other Utilities

**Logger Integration**:

```typescript
// Automatic structured logging of all errors
ErrorHandler.handle(error, 'operation'); // → Logger.error with context
```

**Async Utils Integration**:

```typescript
// Built-in timeout management eliminates need for separate timeout utils
await handleAsync(promise, 'context', { timeout: 5000 });
```

#### Implementation Validation

**Before Migration**:

- [ ] Catalog all 695 catch blocks and their patterns
- [ ] Identify manual timeout handling instances
- [ ] Map fallback and recovery strategies

**During Migration**:

- [ ] Replace try/catch with appropriate ErrorHandler methods
- [ ] Convert manual timeouts to `handleAsync` with timeout option
- [ ] Replace manual fallbacks with `withFallback` calls
- [ ] Add retry logic where beneficial

**After Migration**:

- [ ] Verify all catch blocks use standardized patterns
- [ ] Confirm consistent error logging across components  
- [ ] Test timeout handling and automatic cleanup
- [ ] Validate retry logic and exponential backoff

#### Anti-Patterns

- **X** Don't manually wrap errors in try/catch after migration
- **X** Don't use setTimeout for timeouts - use `handleAsync` with timeout
- **X** Don't manually log errors - ErrorHandler integrates with logger
- **X** Don't ignore error context - always provide meaningful context strings

#### Pattern Metadata

**Used By Active Tasks**: Phase 2 Utility Consolidation  
**Implementation Priority**: CRITICAL (Second highest impact)  
**Dependencies**: Logger Utility (for structured error logging)  
**Integration Points**: All components with error handling across codebase  
**Migration Complexity**: Medium (requires pattern analysis and context identification)  
**Performance Impact**: Positive (eliminates manual cleanup, consistent error handling)
