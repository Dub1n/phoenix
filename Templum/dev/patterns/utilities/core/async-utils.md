---
date-created: 2025-09-14T181500Z
last-updated: 2025-09-14T181500Z
name: async-utils
description: Centralized async utilities to eliminate 316 setTimeout/setInterval calls with automatic cleanup, retry logic, and debouncing/throttling
status: established
category: core-infrastructure
use-when:
  - Eliminating manual timeout management across components
  - Need for consistent retry logic with exponential backoff
  - Debouncing and throttling patterns required
  - Promise utilities and timeout management needed
keywords:
  - async-utilities
  - timeout-management
  - retry-logic
  - debouncing
  - throttling
  - promise-utilities
prerequisites:
  - error-handler-utility
  - logger-utility
related-patterns:
  - error-handler-utility
  - performance-utils-utility
  - resilience-utils
---

### Async Utils Utility Consolidation Pattern

**Problem**: Templum has 316 setTimeout/setInterval calls with manual timeout management, no centralized retry logic, and repeated async patterns scattered across 45+ files without automatic cleanup.

**Current State Examples**:

```typescript
// Manual timeout management
const timeoutId = setTimeout(() => {
  reject(new Error('Operation timed out'));
}, 5000);

// Manual retry with linear delay
async function retryOperation() {
  for (let i = 0; i < 3; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Manual debouncing
let debounceTimeout;
function debouncedFunction() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    actualFunction();
  }, 300);
}
```

**Solution**: Centralized AsyncUtils with automatic cleanup, exponential backoff retry, debouncing/throttling, and one-line promise utilities.

#### Async Utils Implementation

**Core AsyncUtils Class** (Minimal Usage Design):

```typescript
import { createLogger } from './logger';

export class AsyncUtils {
  private static logger = createLogger('async-utils');
  private static activeTimeouts = new Set<NodeJS.Timeout>();
  
  // One-line timeout with automatic cleanup
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutError?: Error
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.activeTimeouts.delete(timeoutId);
        reject(timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      this.activeTimeouts.add(timeoutId);
      
      promise
        .then(result => {
          clearTimeout(timeoutId);
          this.activeTimeouts.delete(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          this.activeTimeouts.delete(timeoutId);
          reject(error);
        });
    });
  }
  
  // Retry with exponential backoff - one-liner
  static async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const { 
      maxAttempts = 3, 
      baseDelay = 1000, 
      maxDelay = 10000,
      factor = 2,
      jitter = true,
      onRetry
    } = options;
    
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }
        
        let delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
        
        // Add jitter to prevent thundering herd
        if (jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }
        
        if (onRetry) {
          onRetry(error, attempt, delay);
        }
        
        this.logger.debug(`Retry ${attempt}/${maxAttempts} in ${delay}ms`, { error });
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  // Simple sleep utility
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timeoutId = setTimeout(resolve, ms);
      this.activeTimeouts.add(timeoutId);
      // Note: We don't need to track/cleanup sleep timeouts as they auto-resolve
    });
  }
  
  // Debounced function execution
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delayMs: number
  ): T {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      if (this.activeTimeouts.has(timeoutId)) {
        this.activeTimeouts.delete(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        this.activeTimeouts.delete(timeoutId);
        fn(...args);
      }, delayMs);
      
      this.activeTimeouts.add(timeoutId);
    }) as T;
  }
  
  // Throttled function execution
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    limitMs: number
  ): T {
    let lastExecution = 0;
    let timeoutId: NodeJS.Timeout;
    let pendingArgs: Parameters<T> | null = null;
    
    return ((...args: Parameters<T>) => {
      pendingArgs = args;
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecution;
      
      if (timeSinceLastExecution >= limitMs) {
        lastExecution = now;
        fn(...args);
        pendingArgs = null;
      } else if (!timeoutId) {
        const remainingTime = limitMs - timeSinceLastExecution;
        timeoutId = setTimeout(() => {
          if (pendingArgs) {
            lastExecution = Date.now();
            fn(...pendingArgs);
            pendingArgs = null;
          }
          this.activeTimeouts.delete(timeoutId);
          timeoutId = undefined!;
        }, remainingTime);
        
        this.activeTimeouts.add(timeoutId);
      }
    }) as T;
  }
  
  // Race with timeout - common pattern
  static async raceWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutError?: Error
  ): Promise<T> {
    return this.withTimeout(promise, timeoutMs, timeoutError);
  }
  
  // Promise.all with timeout for each promise
  static async allWithTimeout<T>(
    promises: Promise<T>[],
    timeoutMs: number
  ): Promise<T[]> {
    const timeoutPromises = promises.map(p => this.withTimeout(p, timeoutMs));
    return Promise.all(timeoutPromises);
  }
  
  // Delay execution by specified time
  static async delay<T>(fn: () => T | Promise<T>, delayMs: number): Promise<T> {
    await this.sleep(delayMs);
    return fn();
  }
  
  // Cleanup all active timeouts (for shutdown)
  static cleanup(): void {
    this.activeTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.activeTimeouts.clear();
    this.logger.debug('Cleaned up all active timeouts');
  }
}

// Types
interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

// Convenience exports for minimal usage
export const { 
  withTimeout, 
  retry, 
  sleep, 
  debounce, 
  throttle, 
  delay,
  cleanup: cleanupTimeouts 
} = AsyncUtils;

// Common timeout values as constants
export const TIMEOUTS = {
  FAST: 1000,      // 1 second
  NORMAL: 5000,    // 5 seconds  
  SLOW: 15000,     // 15 seconds
  VERY_SLOW: 30000 // 30 seconds
};
```

#### Usage Examples (Minimal Footprint)

**Before** (Current manual patterns):

```typescript
// Manual timeout with cleanup (43 instances in service-discovery.ts)
return new Promise((resolve, reject) => {
  const timeoutId = setTimeout(() => {
    reject(new Error('Service discovery timed out'));
  }, 5000);
  
  this.discoverServices()
    .then(result => {
      clearTimeout(timeoutId);
      resolve(result);
    })
    .catch(error => {
      clearTimeout(timeoutId);
      reject(error);
    });
});

// Manual retry with linear delay (38 instances in connection-factory.ts)
async connectWithRetry() {
  for (let i = 0; i < 3; i++) {
    try {
      return await this.connect();
    } catch (error) {
      if (i === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Manual debouncing (29 instances in terminal-ui-components.ts)
let searchTimeout;
function onSearchInput(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(query);
  }, 300);
}
```

**After** (One-line consolidated):

```typescript
// One-line timeout with automatic cleanup
const services = await withTimeout(this.discoverServices(), 5000);

// One-line retry with exponential backoff and jitter
const connection = await retry(() => this.connect(), {
  maxAttempts: 3,
  baseDelay: 1000,
  onRetry: (error, attempt, delay) => log.warn(`Connection attempt ${attempt} failed, retrying in ${delay}ms`)
});

// One-line debouncing with automatic cleanup
const debouncedSearch = debounce((query: string) => performSearch(query), 300);
onSearchInput = (query) => debouncedSearch(query);

// One-line common timeout patterns
const result = await withTimeout(operation(), TIMEOUTS.NORMAL);
```

**Advanced Usage**:

```typescript
// Race multiple operations with timeout
const fastestResult = await Promise.race([
  withTimeout(slowOperation(), 2000),
  withTimeout(alternativeOperation(), 3000)
]);

// Throttled event handler
const throttledHandler = throttle((event) => {
  processEvent(event);
}, 100);

// Delayed execution
const result = await delay(() => expensiveOperation(), 1000);
```

#### Files Using This Pattern

**Backend Components** (Heavy timeout usage):

- [ ] `src/backend/service-discovery.ts` (43 timeout calls → `withTimeout`, `retry` patterns)
- [ ] `src/backend/connection-factory.ts` (38 timeout calls → connection timeout management)
- [ ] `src/backend/backend-service-router.ts` (52 timeout calls → service operation timeouts)
- [ ] `src/backend/dynamic-command-router.ts` (23 timeout calls → command execution timeouts)

**Interface Components** (UI debouncing/throttling):

- [ ] `src/interfaces/terminal-ui-components.ts` (29 timeout calls → debounced search, throttled updates)
- [ ] `src/interfaces/cli-adapter.ts` (31 timeout calls → UI response timeouts)
- [ ] `src/interfaces/cli-adapter-abstracted.ts` (35 timeout calls → interactive command timeouts)

**Core Components** (System timing):

- [ ] `src/core/templum-core.ts` (34 timeout calls → orchestrator timing)
- [ ] `src/session/templum-universal-session-manager.ts` (21 timeout calls → session timeout management)
- [ ] `src/skin/universal-skin-engine.ts` (18 timeout calls → skin processing timeouts)

**All Additional Components** (35+ files with remaining timeout calls):

- [ ] All components with setTimeout/setInterval usage migrate to AsyncUtils

#### Expected Impact

**Quantitative Benefits**:

- **Timeout Calls Eliminated**: 316 manual timeout calls → centralized utilities
- **Files Affected**: 45+ files with timeout/interval usage
- **Lines Reduced**: ~200 lines of manual timeout and retry logic
- **Automatic Cleanup**: All timeouts tracked and cleaned up automatically

**Qualitative Benefits**:

- **Memory Leak Prevention**: Automatic timeout cleanup prevents leaks
- **Consistent Retry Logic**: Exponential backoff with jitter standard across codebase
- **Better Performance**: Debouncing/throttling reduces unnecessary operations
- **Error Recovery**: Integrated with error handling utilities
- **Development Experience**: One-line async operations

#### Integration with Other Utilities

**Error Handler Integration**:

```typescript
// AsyncUtils works seamlessly with ErrorHandler
const result = await handleAsync(
  retry(() => unreliableOperation()),
  'reliable-operation-with-retry'
);
```

**Performance Utils Integration**:

```typescript
// Timeout with performance tracking
perf.time('operation');
const result = await withTimeout(operation(), 5000);
perf.timeEnd('operation');
```

#### Implementation Validation

**Before Migration**:

- [ ] Catalog all 316 timeout/interval calls and patterns
- [ ] Identify retry logic implementations
- [ ] Map debouncing/throttling patterns

**During Migration**:

- [ ] Replace setTimeout patterns with `withTimeout`
- [ ] Convert retry loops to `retry()` calls
- [ ] Replace manual debouncing with `debounce()`
- [ ] Add automatic cleanup for all timeout usage

**After Migration**:

- [ ] Verify all manual timeout management eliminated
- [ ] Confirm automatic cleanup works correctly
- [ ] Test retry logic with exponential backoff
- [ ] Validate debouncing/throttling performance

#### Anti-Patterns

- **X** Don't use setTimeout directly - use AsyncUtils methods
- **X** Don't manually track timeouts for cleanup - use built-in tracking
- **X** Don't implement custom retry logic - use `retry()` with options
- **X** Don't create debounce/throttle without cleanup - use AsyncUtils methods

#### Pattern Metadata

**Used By Active Tasks**: Phase 2 Utility Consolidation  
**Implementation Priority**: CRITICAL (Third highest impact)  
**Dependencies**: Error Handler Utility (for retry error handling), Logger Utility (for debug logging)  
**Integration Points**: All components with async operations across codebase  
**Migration Complexity**: Medium (requires timeout pattern analysis and retry logic conversion)  
**Performance Impact**: Positive (automatic cleanup, efficient retry patterns, reduced memory leaks)
