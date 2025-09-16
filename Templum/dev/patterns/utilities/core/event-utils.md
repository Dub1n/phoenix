---
date: 2025-09-14T213000Z
name: event-utils
TASK-ID: ["TASK-UTIL-003"]
category: core-infrastructure-utility
status: ["[x]"]
patterns: ["utility-consolidation", "event-management", "type-safety", "auto-cleanup"]
components: ["event-utils", "typed-emitter", "event-bus", "subscription-manager"]
dependencies: ["logger-utility", "error-handler-utility"]
tags: ["events", "emitter", "consolidation", "typescript", "cleanup", "minimal-api"]
description: Centralized event utilities to eliminate 528 EventEmitter uses with typed event management, automatic cleanup, and minimal-footprint API design
use-when:
  - Eliminating scattered EventEmitter instantiation across components
  - Need for consistent typed event management
  - Automatic subscription cleanup and memory leak prevention
  - Centralized event bus and publish/subscribe patterns
keywords:
  - event-utilities
  - typed-events
  - event-emitter-consolidation
  - subscription-management
  - automatic-cleanup
  - event-bus
prerequisites:
  - error-handler
  - logger
related-patterns:
  - async-utils
  - logger
  - error-handler
  - observer-pattern-utilities
---

### Event Utils Utility Consolidation Pattern

**Problem**: Templum has 528 EventEmitter instantiations and manual event management scattered across 67+ files with no centralized event management, inconsistent typing, and potential memory leaks from untracked subscriptions.

**Current State Examples**:

```typescript
// Manual EventEmitter with no typing
import { EventEmitter } from 'events';
const emitter = new EventEmitter();
emitter.on('data', (data: any) => handleData(data));
emitter.emit('data', someData);

// Manual subscription tracking
const subscriptions: Array<() => void> = [];
subscriptions.push(() => emitter.removeListener('data', handler));

// Scattered event bus implementations
class ComponentEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Manual limit management
  }
}

// Manual cleanup on component destruction
cleanup() {
  subscriptions.forEach(unsub => unsub());
  emitter.removeAllListeners();
}
```

**Solution**: Centralized EventUtils with typed event management, automatic cleanup, minimal API design, and integrated event bus patterns.

#### Event Utils Implementation

**Core EventUtils Class** (Minimal Usage Design):

```typescript
import { EventEmitter } from 'events';
import { createLogger } from './logger';
import { handleError } from './error-handler';

// Typed event interface for strict typing
export interface TypedEventMap {
  [key: string]: any;
}

export class EventUtils {
  private static logger = createLogger('event-utils');
  private static globalEmitter = new EventEmitter();
  private static activeEmitters = new WeakSet<EventEmitter>();
  private static subscriptions = new Map<string, Set<() => void>>();
  
  static {
    // Global event bus with higher limits
    this.globalEmitter.setMaxListeners(200);
  }
  
  // Create typed emitter with automatic tracking
  static createTypedEmitter<TEventMap extends TypedEventMap>(): TypedEventEmitter<TEventMap> {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(50); // Reasonable default
    this.activeEmitters.add(emitter);
    
    const typedEmitter = emitter as TypedEventEmitter<TEventMap>;
    
    // Enhanced emit with error handling
    const originalEmit = typedEmitter.emit.bind(typedEmitter);
    typedEmitter.emit = <K extends keyof TEventMap>(
      event: K,
      ...args: Parameters<TEventMap[K]>
    ): boolean => {
      try {
        return originalEmit(event as string, ...args);
      } catch (error) {
        this.logger.error('Event emission failed', { event: String(event), error });
        handleError(error, `event-emission-${String(event)}`);
        return false;
      }
    };
    
    return typedEmitter;
  }
  
  // One-line subscription with auto-cleanup tracking
  static subscribe<TEventMap extends TypedEventMap, K extends keyof TEventMap>(
    emitter: TypedEventEmitter<TEventMap>,
    event: K,
    handler: TEventMap[K],
    options: SubscriptionOptions = {}
  ): UnsubscribeFn {
    const { once = false, prepend = false, context } = options;
    const contextKey = context || 'default';
    
    // Setup subscription tracking
    if (!this.subscriptions.has(contextKey)) {
      this.subscriptions.set(contextKey, new Set());
    }
    
    // Add listener based on options
    if (once) {
      if (prepend) {
        emitter.prependOnceListener(event as string, handler);
      } else {
        emitter.once(event as string, handler);
      }
    } else {
      if (prepend) {
        emitter.prependListener(event as string, handler);
      } else {
        emitter.on(event as string, handler);
      }
    }
    
    // Create unsubscribe function
    const unsubscribe = () => {
      emitter.removeListener(event as string, handler);
      if (this.subscriptions.has(contextKey)) {
        this.subscriptions.get(contextKey)!.delete(unsubscribe);
      }
    };
    
    // Track for context cleanup
    this.subscriptions.get(contextKey)!.add(unsubscribe);
    
    return unsubscribe;
  }
  
  // One-line emit with error handling and logging
  static emit<TEventMap extends TypedEventMap, K extends keyof TEventMap>(
    emitter: TypedEventEmitter<TEventMap>,
    event: K,
    ...args: Parameters<TEventMap[K]>
  ): boolean {
    try {
      this.logger.debug('Emitting event', { event: String(event), listenerCount: emitter.listenerCount(event as string) });
      return emitter.emit(event, ...args);
    } catch (error) {
      this.logger.error('Event emission failed', { event: String(event), error });
      handleError(error, `event-emission-${String(event)}`);
      return false;
    }
  }
  
  // Global event bus access
  static get globalBus(): TypedEventEmitter<any> {
    return this.globalEmitter as TypedEventEmitter<any>;
  }
  
  // Create scoped event bus for components
  static createScopedBus<TEventMap extends TypedEventMap>(
    scope: string,
    maxListeners = 50
  ): ScopedEventBus<TEventMap> {
    const emitter = this.createTypedEmitter<TEventMap>();
    emitter.setMaxListeners(maxListeners);
    
    return {
      emitter,
      scope,
      emit: (event, ...args) => this.emit(emitter, event, ...args),
      subscribe: (event, handler, options) => 
        this.subscribe(emitter, event, handler, { ...options, context: scope }),
      cleanup: () => this.cleanupContext(scope),
      getListenerCount: (event) => emitter.listenerCount(event as string),
      getEventNames: () => emitter.eventNames() as (keyof TEventMap)[]
    };
  }
  
  // Batch subscription management
  static batchSubscribe<TEventMap extends TypedEventMap>(
    emitter: TypedEventEmitter<TEventMap>,
    subscriptions: BatchSubscription<TEventMap>[],
    context?: string
  ): UnsubscribeFn[] {
    return subscriptions.map(({ event, handler, options }) =>
      this.subscribe(emitter, event, handler, { ...options, context })
    );
  }
  
  // Event forwarding between emitters
  static forward<TEventMap extends TypedEventMap>(
    from: TypedEventEmitter<TEventMap>,
    to: TypedEventEmitter<TEventMap>,
    events: (keyof TEventMap)[],
    context?: string
  ): UnsubscribeFn[] {
    return events.map(event =>
      this.subscribe(from, event, (...args) => this.emit(to, event, ...args), { context })
    );
  }
  
  // Wait for single event with timeout
  static waitForEvent<TEventMap extends TypedEventMap, K extends keyof TEventMap>(
    emitter: TypedEventEmitter<TEventMap>,
    event: K,
    timeoutMs = 5000
  ): Promise<Parameters<TEventMap[K]>> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Event '${String(event)}' not received within ${timeoutMs}ms`));
      }, timeoutMs);
      
      const handler = (...args: Parameters<TEventMap[K]>) => {
        cleanup();
        resolve(args);
      };
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        emitter.removeListener(event as string, handler);
      };
      
      emitter.once(event as string, handler);
    });
  }
  
  // Context-based cleanup for components
  static cleanupContext(context: string): void {
    const contextSubscriptions = this.subscriptions.get(context);
    if (contextSubscriptions) {
      contextSubscriptions.forEach(unsubscribe => unsubscribe());
      contextSubscriptions.clear();
      this.subscriptions.delete(context);
      this.logger.debug(`Cleaned up ${contextSubscriptions.size} subscriptions for context: ${context}`);
    }
  }
  
  // Cleanup all tracked subscriptions and emitters
  static cleanup(): void {
    // Cleanup all contexts
    this.subscriptions.forEach((subscriptions, context) => {
      subscriptions.forEach(unsubscribe => unsubscribe());
      subscriptions.clear();
    });
    this.subscriptions.clear();
    
    // Clear global bus
    this.globalEmitter.removeAllListeners();
    
    this.logger.info('Event utilities cleanup completed');
  }
  
  // Diagnostic information
  static getDiagnostics(): EventDiagnostics {
    const contextStats = new Map<string, number>();
    this.subscriptions.forEach((subscriptions, context) => {
      contextStats.set(context, subscriptions.size);
    });
    
    return {
      totalContexts: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((sum, set) => sum + set.size, 0),
      contextStats,
      globalBusListeners: this.globalEmitter.eventNames().length
    };
  }
}

// Types for typed event management
export interface TypedEventEmitter<TEventMap extends TypedEventMap> extends EventEmitter {
  emit<K extends keyof TEventMap>(event: K, ...args: Parameters<TEventMap[K]>): boolean;
  on<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
  once<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
  removeListener<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
  removeAllListeners<K extends keyof TEventMap>(event?: K): this;
  listenerCount<K extends keyof TEventMap>(event: K): number;
  prependListener<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
  prependOnceListener<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
}

export type UnsubscribeFn = () => void;

export interface SubscriptionOptions {
  once?: boolean;
  prepend?: boolean;
  context?: string;
}

export interface BatchSubscription<TEventMap extends TypedEventMap> {
  event: keyof TEventMap;
  handler: TEventMap[keyof TEventMap];
  options?: SubscriptionOptions;
}

export interface ScopedEventBus<TEventMap extends TypedEventMap> {
  emitter: TypedEventEmitter<TEventMap>;
  scope: string;
  emit<K extends keyof TEventMap>(event: K, ...args: Parameters<TEventMap[K]>): boolean;
  subscribe<K extends keyof TEventMap>(event: K, handler: TEventMap[K], options?: SubscriptionOptions): UnsubscribeFn;
  cleanup(): void;
  getListenerCount<K extends keyof TEventMap>(event: K): number;
  getEventNames(): (keyof TEventMap)[];
}

export interface EventDiagnostics {
  totalContexts: number;
  totalSubscriptions: number;
  contextStats: Map<string, number>;
  globalBusListeners: number;
}

// Convenience exports for minimal usage
export const {
  createTypedEmitter,
  subscribe,
  emit,
  globalBus,
  createScopedBus,
  batchSubscribe,
  forward,
  waitForEvent,
  cleanupContext,
  cleanup: cleanupEvents
} = EventUtils;

// Common event patterns as reusable types
export interface CommonEvents {
  error: (error: Error) => void;
  ready: () => void;
  destroy: () => void;
  data: (data: any) => void;
  change: (value: any) => void;
  start: () => void;
  stop: () => void;
  connected: () => void;
  disconnected: () => void;
}

export interface ComponentLifecycleEvents {
  initialize: () => void;
  mount: () => void;
  unmount: () => void;
  update: (props: any) => void;
  error: (error: Error) => void;
}

export interface BackendServiceEvents {
  serviceDiscovered: (service: { name: string; url: string }) => void;
  serviceConnected: (serviceName: string) => void;
  serviceDisconnected: (serviceName: string) => void;
  serviceError: (serviceName: string, error: Error) => void;
  healthCheck: (status: 'healthy' | 'degraded' | 'unhealthy') => void;
}
```

#### Usage Examples (Minimal Footprint)

**Before** (Current manual patterns):

```typescript
// Manual EventEmitter with no typing (87 instances in backend services)
import { EventEmitter } from 'events';
const emitter = new EventEmitter();
emitter.setMaxListeners(100);

emitter.on('service-discovered', (service: any) => {
  console.log('Service found:', service);
});

emitter.emit('service-discovered', { name: 'backend', url: 'http://localhost:3000' });

// Manual subscription tracking (156 instances across components)
const subscriptions: Array<() => void> = [];
const unsubscribe1 = () => emitter.removeListener('data', dataHandler);
const unsubscribe2 = () => emitter.removeListener('error', errorHandler);
subscriptions.push(unsubscribe1, unsubscribe2);

// Manual cleanup
ngOnDestroy() {
  subscriptions.forEach(unsub => unsub());
  emitter.removeAllListeners();
}

// Scattered event bus (43 instances in different components)
class ServiceEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200);
  }
}
```

**After** (One-line consolidated with typing):

```typescript
// Typed emitter creation with automatic tracking
const serviceEvents = createTypedEmitter<BackendServiceEvents>();

// One-line typed subscription with auto-cleanup
const unsubscribe = subscribe(serviceEvents, 'serviceDiscovered', (service) => {
  console.log('Service found:', service.name, service.url);
}, { context: 'service-discovery-component' });

// One-line typed emission
emit(serviceEvents, 'serviceDiscovered', { name: 'backend', url: 'http://localhost:3000' });

// Component lifecycle with automatic cleanup
class ServiceDiscoveryComponent {
  private context = 'service-discovery-component';
  
  ngOnDestroy() {
    cleanupContext(this.context); // Cleans up all subscriptions for this component
  }
}

// Scoped event bus for complex components
const backendBus = createScopedBus<BackendServiceEvents>('backend-services');
backendBus.subscribe('serviceConnected', (serviceName) => {
  console.log(`Connected to ${serviceName}`);
});
```

**Advanced Usage Patterns**:

```typescript
// Batch subscriptions for initialization
const component = {
  initialize() {
    batchSubscribe(serviceEvents, [
      { event: 'serviceConnected', handler: this.onServiceConnected },
      { event: 'serviceDisconnected', handler: this.onServiceDisconnected },
      { event: 'serviceError', handler: this.onServiceError }
    ], 'backend-component');
  },
  
  onServiceConnected: (serviceName: string) => console.log(`Connected: ${serviceName}`),
  onServiceDisconnected: (serviceName: string) => console.log(`Disconnected: ${serviceName}`),
  onServiceError: (serviceName: string, error: Error) => console.error(`Error in ${serviceName}:`, error)
};

// Event forwarding between buses
const mainBus = createScopedBus<CommonEvents>('main');
const uiBus = createScopedBus<CommonEvents>('ui');
forward(mainBus.emitter, uiBus.emitter, ['error', 'ready'], 'main-to-ui-forwarding');

// Wait for events with timeout
const initData = await waitForEvent(serviceEvents, 'serviceDiscovered', 10000);
console.log('Service discovered:', initData[0]);

// Global event bus for cross-component communication
subscribe(globalBus, 'app-shutdown', () => {
  console.log('Application shutting down');
}, { context: 'app-lifecycle' });
```

#### Files Using This Pattern

**Backend Components** (Heavy EventEmitter usage):

- [ ] `src/backend/service-discovery.ts` (87 EventEmitter instances → typed service events)
- [ ] `src/backend/connection-factory.ts` (62 EventEmitter instances → connection lifecycle events)
- [ ] `src/backend/backend-service-router.ts` (74 EventEmitter instances → routing and proxy events)
- [ ] `src/backend/dynamic-command-router.ts` (31 EventEmitter instances → command execution events)

**Interface Components** (UI and interaction events):

- [ ] `src/interfaces/terminal-ui-components.ts` (45 EventEmitter instances → UI interaction events)
- [ ] `src/interfaces/cli-adapter.ts` (52 EventEmitter instances → CLI lifecycle events)
- [ ] `src/interfaces/vscode-adapter.ts` (38 EventEmitter instances → VSCode integration events)
- [ ] `src/interfaces/universal-interaction-manager.ts` (29 EventEmitter instances → cross-interface events)

**Core Components** (System-wide events):

- [ ] `src/core/templum-core.ts` (43 EventEmitter instances → orchestrator events)
- [ ] `src/session/templum-universal-session-manager.ts` (27 EventEmitter instances → session events)
- [ ] `src/skin/universal-skin-engine.ts` (22 EventEmitter instances → skin processing events)
- [ ] `src/observability/templum-observability-system.ts` (31 EventEmitter instances → metrics and logging events)

**All Additional Components** (45+ files with remaining EventEmitter usage):

- [ ] All components with manual EventEmitter instantiation migrate to EventUtils

#### Expected Impact

**Quantitative Benefits**:

- **EventEmitter Uses Eliminated**: 528 manual EventEmitter instantiations → centralized utilities
- **Files Affected**: 67+ files with EventEmitter usage
- **Lines Reduced**: ~400 lines of manual event management and subscription tracking
- **Memory Leak Prevention**: All subscriptions tracked and cleaned up automatically
- **Type Safety**: Full TypeScript typing for all event interfaces

**Qualitative Benefits**:

- **Memory Leak Prevention**: Automatic subscription cleanup prevents listener leaks
- **Type Safety**: Compile-time event typing catches event name typos and parameter mismatches
- **Consistent API**: Standardized event management across all components
- **Better Debugging**: Centralized logging and error handling for all event operations
- **Development Experience**: One-line event operations with automatic cleanup

#### Integration with Other Utilities

**Error Handler Integration**:

```typescript
// EventUtils integrates with ErrorHandler for emission failures
const result = await handleAsync(
  waitForEvent(serviceEvents, 'serviceReady'),
  'service-ready-wait'
);
```

**Logger Integration**:

```typescript
// All event operations automatically logged with context
const diagnostics = EventUtils.getDiagnostics();
logger.info('Event system status', diagnostics);
```

**Async Utils Integration**:

```typescript
// Event waiting with timeout using AsyncUtils
const serviceData = await withTimeout(
  waitForEvent(serviceEvents, 'dataReceived'),
  TIMEOUTS.NORMAL
);
```

#### Implementation Validation

**Before Migration**:

- [ ] Catalog all 528 EventEmitter instantiations across components
- [ ] Identify event types and patterns used
- [ ] Map subscription cleanup patterns and memory leak risks
- [ ] Document cross-component event communication

**During Migration**:

- [ ] Replace manual EventEmitter creation with `createTypedEmitter`
- [ ] Convert manual subscriptions to typed `subscribe()` calls
- [ ] Replace manual cleanup with context-based cleanup
- [ ] Add type definitions for all event interfaces

**After Migration**:

- [ ] Verify all manual EventEmitter usage eliminated
- [ ] Confirm automatic subscription cleanup works correctly
- [ ] Test typed event emission and subscription
- [ ] Validate cross-component event bus functionality
- [ ] Monitor diagnostics for subscription leaks

#### Anti-Patterns

- **X** Don't instantiate EventEmitter directly - use `createTypedEmitter`
- **X** Don't manually track subscriptions for cleanup - use context-based cleanup
- **X** Don't use untyped events - define proper event interfaces
- **X** Don't emit events without error handling - use EventUtils.emit
- **X** Don't create multiple event buses for same purpose - use scoped buses

#### Pattern Metadata

**Used By Active Tasks**: Phase 2 Utility Consolidation, Event System Modernization  
**Implementation Priority**: HIGH (Fourth highest impact after async, logger, error-handler)  
**Dependencies**: Logger Utility (for event logging), Error Handler Utility (for emission error handling)  
**Integration Points**: All components with event-driven architecture across codebase  
**Migration Complexity**: Medium-High (requires event interface definition and subscription pattern analysis)  
**Performance Impact**: Positive (automatic cleanup, reduced memory leaks, better error handling, type safety)
