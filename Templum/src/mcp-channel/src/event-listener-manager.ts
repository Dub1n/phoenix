/**
---
date: "2025-09-13T210000Z"
name: "event-listener-manager"
TASK-ID: ["TASK-MCP-007"]
category: "mcp-integration-memory-management"
status: ["[T]"]
patterns: ["event-listener-cleanup", "memory-leak-prevention", "defensive-programming"]
components: ["event-listener-manager", "progressive-timeout-manager", "service-registration"]
dependencies: ["nodejs-events", "process-event-management"]
tags: ["memory-management", "event-cleanup", "leak-prevention", "process-listeners"]
---
* @fileoverview Centralized Event Listener Manager for MCP Channel Integration
* @author Claude Code Implementation
* @created 2025-09-13
* 
* TASK-MCP-007: Memory Leak Prevention with Risk-Adaptive Event Management
* 
* Implements centralized event listener management to prevent EventEmitter memory leaks:
* - Process event listener tracking and cleanup
* - Risk-adaptive listener limit management  
* - Automatic cleanup on service shutdown
* - Defensive programming for listener registration
* - Probabilistic error handling for event management
*/

import { EventEmitter } from 'events';
import type { AnyTypedEventEmitter } from '../../utils/event-utils';

type ManagedEmitter = AnyTypedEventEmitter | NodeJS.Process;

const hasListenerControls = (
  emitter: ManagedEmitter
): emitter is ManagedEmitter & {
  getMaxListeners(): number;
  setMaxListeners(limit: number): void;
} =>
  typeof (emitter as any)?.setMaxListeners === 'function' &&
  typeof (emitter as any)?.getMaxListeners === 'function';

const addListener = (emitter: ManagedEmitter, event: string, listener: (...args: any[]) => void): void => {
  const target = emitter as unknown as EventEmitter;
  if (typeof target.on === 'function') {
    target.on(event, listener);
  } else if (typeof (target as any).addListener === 'function') {
    (target as any).addListener(event, listener);
  }
};

const removeListener = (emitter: ManagedEmitter, event: string, listener: (...args: any[]) => void): void => {
  const target = emitter as unknown as EventEmitter;
  if (typeof target.removeListener === 'function') {
    target.removeListener(event, listener);
  } else if (typeof (target as any).off === 'function') {
    (target as any).off(event, listener);
  }
};

export interface EventListenerRegistration {
  emitter: ManagedEmitter;
  event: string;
  listener: (...args: any[]) => void;
  componentId: string;
  registeredAt: number;
}

export interface EventManagerMetrics {
  totalListeners: number;
  processListeners: number;
  componentBreakdown: Record<string, number>;
  memoryLeakWarnings: number;
  cleanupOperations: number;
}

/**
 * Centralized Event Listener Manager with Memory Leak Prevention
 * Implements risk-adaptive approach to prevent EventEmitter memory leaks
 */
export class EventListenerManager {
  private static instance: EventListenerManager;
  private registrations: Map<string, EventListenerRegistration> = new Map();
  private metrics: EventManagerMetrics = {
    totalListeners: 0,
    processListeners: 0,
    componentBreakdown: {},
    memoryLeakWarnings: 0,
    cleanupOperations: 0
  };
  
  // Risk-adaptive listener limits
  private readonly MAX_PROCESS_LISTENERS = 10;
  private readonly WARNING_THRESHOLD = 8;
  private readonly DEFAULT_MAX_LISTENERS = 15;

  private constructor() {
    // TODO: [TASK-MCP-007-MEMORY-001] Pattern: singleton-event-manager | Complexity: 3 | Dependencies: nodejs-events
    // Context: Centralized management of event listeners to prevent memory leaks
    // Validation-Required: listener-tracking-accuracy, cleanup-effectiveness, memory-usage-monitoring
    // Pattern-Info: { approach: "centralized-event-management", alternatives: "distributed-cleanup", trade-offs: "centralization-vs-coupling" }
    
    this.setupProcessEventHandling();
  }

  public static getInstance(): EventListenerManager {
    if (!EventListenerManager.instance) {
      EventListenerManager.instance = new EventListenerManager();
    }
    return EventListenerManager.instance;
  }

  /**
 * Register an event listener with automatic tracking
 * Implements defensive programming for listener registration
 */
  public registerListener(
    emitter: ManagedEmitter,
    event: string,
    listener: (...args: any[]) => void,
    componentId: string
  ): string {
    // TODO: [TASK-MCP-007-MEMORY-002] Pattern: safe-listener-registration | Complexity: 4 | Dependencies: event-tracking
    // Context: Track event listeners to enable proper cleanup and prevent memory leaks
    // Validation-Required: registration-accuracy, duplicate-prevention, limit-enforcement
    // Pattern-Info: { approach: "tracked-registration-with-limits", alternatives: "untracked-registration", trade-offs: "safety-vs-simplicity" }
    
    try {
      // Risk-adaptive limit checking
      if (emitter === process) {
        if (this.metrics.processListeners >= this.MAX_PROCESS_LISTENERS) {
          console.warn(`[EVENT_MANAGER] Process listener limit (${this.MAX_PROCESS_LISTENERS}) exceeded for component ${componentId}`);
          this.metrics.memoryLeakWarnings++;
          return '';
        }
        
        if (this.metrics.processListeners >= this.WARNING_THRESHOLD) {
          console.warn(`[EVENT_MANAGER] Approaching process listener limit: ${this.metrics.processListeners}/${this.MAX_PROCESS_LISTENERS}`);
        }
      }

      // Generate unique registration ID
      const registrationId = `${componentId}_${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create registration record
      const registration: EventListenerRegistration = {
        emitter,
        event,
        listener,
        componentId,
        registeredAt: Date.now()
      };

      // Set appropriate max listeners if needed
      if (hasListenerControls(emitter) && emitter.getMaxListeners() < this.DEFAULT_MAX_LISTENERS) {
        emitter.setMaxListeners(this.DEFAULT_MAX_LISTENERS);
      }

      // Register the listener
      addListener(emitter, event, listener);
      
      // Track registration
      this.registrations.set(registrationId, registration);
      this.updateMetrics(componentId, 1);
      
      console.log(`[EVENT_MANAGER] Registered ${event} listener for ${componentId} (ID: ${registrationId})`);
      return registrationId;
      
    } catch (error) {
      console.error(`[EVENT_MANAGER] Failed to register listener for ${componentId}:`, error);
      this.metrics.memoryLeakWarnings++;
      return '';
    }
  }

  /**
   * Unregister specific event listener
   */
  public unregisterListener(registrationId: string): boolean {
    // TODO: [TASK-MCP-007-MEMORY-003] Pattern: safe-listener-cleanup | Complexity: 3 | Dependencies: event-tracking
    // Context: Safely remove tracked event listeners to prevent memory leaks
    // Validation-Required: cleanup-accuracy, error-handling, metrics-update
    // Pattern-Info: { approach: "tracked-removal-with-verification", alternatives: "direct-removal", trade-offs: "safety-vs-performance" }
    
    try {
      const registration = this.registrations.get(registrationId);
      if (!registration) {
        console.warn(`[EVENT_MANAGER] Registration ${registrationId} not found`);
        return false;
      }

      // Remove the listener with type safety
      removeListener(registration.emitter, registration.event, registration.listener as any);
      
      // Remove tracking
      this.registrations.delete(registrationId);
      this.updateMetrics(registration.componentId, -1);
      this.metrics.cleanupOperations++;
      
      console.log(`[EVENT_MANAGER] Unregistered ${registration.event} listener for ${registration.componentId}`);
      return true;
      
    } catch (error) {
      console.error(`[EVENT_MANAGER] Failed to unregister listener ${registrationId}:`, error);
      return false;
    }
  }

  /**
   * Cleanup all listeners for a specific component
   */
  public cleanupComponent(componentId: string): number {
    // TODO: [TASK-MCP-007-MEMORY-004] Pattern: component-cleanup | Complexity: 4 | Dependencies: bulk-event-removal
    // Context: Remove all listeners for a component during shutdown or cleanup
    // Validation-Required: complete-cleanup, error-recovery, metrics-accuracy
    // Pattern-Info: { approach: "bulk-cleanup-with-tracking", alternatives: "individual-cleanup", trade-offs: "efficiency-vs-granularity" }
    
    let cleanedCount = 0;
    const componentsToCleanup: string[] = [];
    
    try {
      // Find all registrations for this component
      this.registrations.forEach((registration, registrationId) => {
        if (registration.componentId === componentId) {
          componentsToCleanup.push(registrationId);
        }
      });
      
      // Clean up each registration
      for (const registrationId of componentsToCleanup) {
        if (this.unregisterListener(registrationId)) {
          cleanedCount++;
        }
      }
      
      console.log(`[EVENT_MANAGER] Cleaned up ${cleanedCount} listeners for component ${componentId}`);
      return cleanedCount;
      
    } catch (error) {
      console.error(`[EVENT_MANAGER] Error during component cleanup for ${componentId}:`, error);
      return cleanedCount;
    }
  }

  /**
   * Cleanup all listeners (for shutdown)
   */
  public cleanupAll(): EventManagerMetrics {
    // TODO: [TASK-MCP-007-MEMORY-005] Pattern: complete-cleanup | Complexity: 5 | Dependencies: system-shutdown
    // Context: Remove all tracked listeners during system shutdown
    // Validation-Required: complete-cleanup, graceful-degradation, final-metrics
    // Pattern-Info: { approach: "complete-system-cleanup", alternatives: "partial-cleanup", trade-offs: "thoroughness-vs-speed" }
    
    const finalMetrics = { ...this.metrics };
    
    try {
      const registrationIds = Array.from(this.registrations.keys());
      let successCount = 0;
      
      for (const registrationId of registrationIds) {
        if (this.unregisterListener(registrationId)) {
          successCount++;
        }
      }
      
      console.log(`[EVENT_MANAGER] Final cleanup: ${successCount}/${registrationIds.length} listeners removed`);
      
      // Reset metrics
      this.metrics = {
        totalListeners: 0,
        processListeners: 0,
        componentBreakdown: {},
        memoryLeakWarnings: finalMetrics.memoryLeakWarnings,
        cleanupOperations: finalMetrics.cleanupOperations + successCount
      };
      
      return finalMetrics;
      
    } catch (error) {
      console.error('[EVENT_MANAGER] Error during complete cleanup:', error);
      return finalMetrics;
    }
  }

  /**
   * Get current metrics for monitoring
   */
  public getMetrics(): EventManagerMetrics {
    return { ...this.metrics };
  }

  /**
   * Verify runtime compatibility and detect potential memory leaks
   */
  public verifyMemoryHealth(): boolean {
    // TODO: [TASK-MCP-007-MEMORY-006] Pattern: memory-health-verification | Complexity: 4 | Dependencies: system-monitoring
    // Context: Detect potential memory leaks and verify event management health
    // Validation-Required: leak-detection-accuracy, threshold-validation, system-health
    // Pattern-Info: { approach: "proactive-leak-detection", alternatives: "reactive-monitoring", trade-offs: "prevention-vs-detection" }
    
    try {
      // TODO: [TASK-MCP-007-RUNTIME-001] Pattern: safe-process-introspection | Complexity: 4 | Dependencies: nodejs-process
      // Context: Safely access process event information with defensive programming
      // Validation-Required: cross-platform-compatibility, error-handling, fallback-behavior
      // Pattern-Info: { approach: "defensive-process-access", alternatives: "direct-access", trade-offs: "safety-vs-performance" }
      
      let processListenerCount = this.metrics.processListeners;
      
      // Defensive programming: Check if process events are accessible
      if (typeof process.listenerCount === 'function') {
        try {
          // Use safer approach: iterate through known events rather than accessing _events
          // Use process.listenerCount instead of process.listeners to avoid type issues
          const knownEvents: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
          const knownProcessEvents: string[] = ['exit', 'uncaughtException', 'unhandledRejection'];
          processListenerCount = [...knownEvents, ...knownProcessEvents].reduce((count, eventName) => {
            try {
              const listenerCount = process.listenerCount(eventName as any);
              return count + listenerCount;
            } catch {
              // Ignore events that can't be accessed
              return count;
            }
          }, 0);
        } catch (introspectionError) {
          console.warn('[EVENT_MANAGER] Process introspection failed, using tracked count:', introspectionError);
          processListenerCount = this.metrics.processListeners;
        }
      }
      
      // Check for discrepancies
      if (Math.abs(processListenerCount - this.metrics.processListeners) > 2) {
        console.warn(`[EVENT_MANAGER] Listener count discrepancy: tracked=${this.metrics.processListeners}, actual=${processListenerCount}`);
        this.metrics.memoryLeakWarnings++;
        return false;
      }
      
      // Check for excessive listeners
      if (this.metrics.processListeners > this.WARNING_THRESHOLD) {
        console.warn(`[EVENT_MANAGER] High process listener count: ${this.metrics.processListeners}`);
        return false;
      }
      
      console.log(`[EVENT_MANAGER] Memory health verified: ${this.metrics.processListeners} process listeners, ${this.metrics.totalListeners} total`);
      return true;
      
    } catch (error) {
      console.error('[EVENT_MANAGER] Memory health verification failed:', error);
      return false;
    }
  }

  /**
   * Setup process event handling for cleanup with risk-adaptive approach
   */
  private setupProcessEventHandling(): void {
    // TODO: [TASK-MCP-007-SIGNAL-001] Pattern: defensive-signal-handling | Complexity: 3 | Dependencies: nodejs-process
    // Context: Register process cleanup handlers with cross-platform compatibility
    // Validation-Required: signal-handling-compatibility, cleanup-effectiveness, error-recovery
    // Pattern-Info: { approach: "cross-platform-signal-handling", alternatives: "platform-specific", trade-offs: "compatibility-vs-optimization" }
    
    const cleanup = () => {
      console.log('[EVENT_MANAGER] Process cleanup initiated');
      this.cleanupAll();
    };

    // Use direct process listeners for cleanup (these won't be tracked to avoid recursion)
    // Defensive programming: Handle signals that may not be available on all platforms
    try {
      process.on('exit', cleanup);
      
      // SIGINT and SIGTERM may not be available on Windows
      if (process.platform !== 'win32') {
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
      } else {
        // On Windows, use 'SIGINT' and handle it differently
        process.on('SIGINT', cleanup);
      }
    } catch (signalError) {
      console.warn('[EVENT_MANAGER] Some process signals unavailable:', signalError);
      // Ensure at least exit cleanup is registered
      try {
        process.on('exit', cleanup);
      } catch (exitError) {
        console.error('[EVENT_MANAGER] Critical: Cannot register exit handler:', exitError);
      }
    }
  }

  /**
   * Update internal metrics
   */
  private updateMetrics(componentId: string, delta: number): void {
    this.metrics.totalListeners += delta;
    
    if (!this.metrics.componentBreakdown[componentId]) {
      this.metrics.componentBreakdown[componentId] = 0;
    }
    this.metrics.componentBreakdown[componentId] += delta;
    
    // Count process listeners (simplified heuristic)
    if (delta > 0) {
      this.metrics.processListeners += delta;
    } else {
      this.metrics.processListeners = Math.max(0, this.metrics.processListeners + delta);
    }
  }
}

/**
 * Global convenience functions for event management
 */
export const eventManager = EventListenerManager.getInstance();

export function safeRegisterListener(
  emitter: ManagedEmitter,
  event: string,
  listener: (...args: any[]) => void,
  componentId: string
): string {
  return eventManager.registerListener(emitter, event, listener, componentId);
}

export function safeUnregisterListener(registrationId: string): boolean {
  return eventManager.unregisterListener(registrationId);
}

export function cleanupComponentListeners(componentId: string): number {
  return eventManager.cleanupComponent(componentId);
}
