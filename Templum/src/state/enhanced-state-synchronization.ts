/**---
 * title: Enhanced State Synchronization - IPC-based Coordination System
 * tags: [State-Management, IPC-Coordination, Conflict-Resolution, Performance-Optimized]
 * provides: [EnhancedStateManager, IPCCoordinator, ConflictResolver, StatePersistence, CrossInterfaceSync]
 * requires: [Performance-Monitor, Component-Transfer-Strategy, PCL-Registry-Integration]
 * description: IPC-based state synchronization with conflict resolution and change coalescing for multi-interface coordination, addressing Phase 2 realignment architectural gaps
 * ---*/

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import {TemplumError, isTemplumError, ErrorSignalPayload} from '../types/templum-types';

// Core interfaces for IPC-based state coordination
export interface IPCStateMessage {
  type: 'state-update' | 'state-request' | 'conflict-resolution';
  componentId: string;
  interfaceType: string;
  stateData: any;
  timestamp: number;
  changeId: string;
}

export interface StateChange {
  id: string;
  componentId: string;
  path: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  source: string;
}

export interface StateSnapshot {
  id: string;
  componentId: string;
  state: any;
  timestamp: number;
  version: number;
}

export interface ConflictResolutionStrategy {
  type: 'last-writer-wins' | 'merge' | 'rollback' | 'custom';
  handler?: (conflicts: StateChange[]) => StateChange;
}

export interface StateCoalescingConfig {
  enabled: boolean;
  windowMs: number;
  maxBatchSize: number;
  coalescingStrategy: 'merge' | 'latest' | 'accumulate';
}

// Performance monitoring integration
interface PerformanceMetrics {
  operationCount: number;
  averageResponseTime: number;
  maxResponseTime: number;
  errorCount: number;
  coalescingEfficiency: number;
}

/**
 * IPCCoordinator - Handles IPC message routing and communication
 * Provides async coordination between multiple interfaces via EventEmitter-based IPC
 */
export class IPCCoordinator extends EventEmitter {
  private messageQueue: Map<string, IPCStateMessage[]> = new Map();
  private processingQueue: boolean = false;
  private readonly maxQueueSize: number = 1000;
  private readonly processingIntervalMs: number = 10; // High-frequency processing for <50ms targets
  private processingHandle?: NodeJS.Timeout;

  constructor() {
    super();
    this.setMaxListeners(50); // Support multiple interface connections
    this.startMessageProcessing();
  }

  /**
   * Send IPC message to specific interface or broadcast to all
   */
  async sendMessage(message: IPCStateMessage, targetInterface?: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      if (targetInterface) {
        this.emit(`message:${targetInterface}`, message);
      } else {
        this.emit('message:broadcast', message);
      }
      
      // Track performance for <50ms target
      const duration = performance.now() - startTime;
      this.emit('performance:ipc-message', { duration, messageType: message.type });
      
    } catch (error) {
      this.emit('error:ipc-send', { error, message, targetInterface });
      throw error;
    }
  }

  /**
   * Register interface for IPC communication
   */
  registerInterface(interfaceType: string, messageHandler: (message: IPCStateMessage) => void): void {
    this.on(`message:${interfaceType}`, messageHandler);
    this.on('message:broadcast', messageHandler);
    
    // Emit registration event for coordination
    this.emit('interface:registered', { interfaceType, timestamp: Date.now() });
  }

  /**
   * Queue message for batch processing (performance optimization)
   */
  queueMessage(message: IPCStateMessage): void {
    const queueKey = `${message.componentId}:${message.interfaceType}`;
    
    if (!this.messageQueue.has(queueKey)) {
      this.messageQueue.set(queueKey, []);
    }
    
    const queue = this.messageQueue.get(queueKey)!;
    if (queue.length < this.maxQueueSize) {
      queue.push(message);
    } else {
      // Queue overflow - process immediately and emit warning
      this.emit('warning:queue-overflow', { queueKey, queueSize: queue.length });
      this.processMessageQueue(queueKey);
    }
  }

  private startMessageProcessing(): void {
    this.stopMessageProcessing();
    this.processingHandle = setInterval(() => {
      if (!this.processingQueue && this.messageQueue.size > 0) {
        this.processAllQueues();
      }
    }, this.processingIntervalMs);
    this.processingHandle.unref?.();
  }

  private stopMessageProcessing(): void {
    if (this.processingHandle) {
      clearInterval(this.processingHandle);
      this.processingHandle = undefined;
    }
  }

  private async processAllQueues(): Promise<void> {
    this.processingQueue = true;
    
    try {
      for (const [queueKey] of Array.from(this.messageQueue)) {
        await this.processMessageQueue(queueKey);
      }
    } finally {
      this.processingQueue = false;
    }
  }

  private async processMessageQueue(queueKey: string): Promise<void> {
    const messages = this.messageQueue.get(queueKey);
    if (!messages || messages.length === 0) return;

    // Process batch of messages for efficiency
    const batch = messages.splice(0, 10); // Process up to 10 messages per batch
    
    for (const message of batch) {
      await this.sendMessage(message);
    }

    if (messages.length === 0) {
      this.messageQueue.delete(queueKey);
    }
  }

  dispose(): void {
    this.stopMessageProcessing();
    this.removeAllListeners();
    this.messageQueue.clear();
  }
}

/**
 * ConflictResolver - Handles state conflicts with change coalescing
 * Implements sophisticated conflict resolution strategies with performance optimization
 */
export class ConflictResolver {
  private conflictHistory: Map<string, StateChange[]> = new Map();
  private coalescingConfig: StateCoalescingConfig;
  private pendingChanges: Map<string, StateChange[]> = new Map();
  private coalescingTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(coalescingConfig: Partial<StateCoalescingConfig> = {}) {
    this.coalescingConfig = {
      enabled: true,
      windowMs: 100, // 100ms coalescing window for performance
      maxBatchSize: 20,
      coalescingStrategy: 'merge',
      ...coalescingConfig
    };
  }

  /**
   * Resolve conflicts between multiple state changes
   */
  async resolveConflicts(changes: StateChange[], strategy: ConflictResolutionStrategy = { type: 'last-writer-wins' }): Promise<StateChange[]> {
    const startTime = performance.now();
    
    try {
      // Group conflicts by component and path
      const conflictGroups = this.groupConflictsByPath(changes);
      const resolvedChanges: StateChange[] = [];

      for (const [path, pathChanges] of Array.from(conflictGroups)) {
        if (pathChanges.length === 1) {
          resolvedChanges.push(pathChanges[0]);
          continue;
        }

        // Apply resolution strategy
        const resolvedChange = await this.applyResolutionStrategy(pathChanges, strategy);
        if (resolvedChange) {
          resolvedChanges.push(resolvedChange);
          
          // Track conflict for history
          this.trackConflict(path, pathChanges);
        }
      }

      // Performance tracking
      const duration = performance.now() - startTime;
      this.emitMetrics('conflict-resolution', duration, changes.length);

      return resolvedChanges;
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown conflict resolution error');
      throw new Error(`Conflict resolution failed: ${errorMessage}`);
    }
  }

  /**
   * Handle change coalescing for performance optimization
   */
  async coalesceChanges(change: StateChange): Promise<StateChange[]> {
    if (!this.coalescingConfig.enabled) {
      return [change];
    }

    const coalescingKey = `${change.componentId}:${change.path}`;
    
    // Add to pending changes
    if (!this.pendingChanges.has(coalescingKey)) {
      this.pendingChanges.set(coalescingKey, []);
    }
    
    this.pendingChanges.get(coalescingKey)!.push(change);

    // Clear existing timer and set new one
    if (this.coalescingTimers.has(coalescingKey)) {
      clearTimeout(this.coalescingTimers.get(coalescingKey)!);
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const changes = this.pendingChanges.get(coalescingKey) || [];
        this.pendingChanges.delete(coalescingKey);
        this.coalescingTimers.delete(coalescingKey);
        
        const coalesced = this.performCoalescing(changes);
        resolve(coalesced);
      }, this.coalescingConfig.windowMs);

      this.coalescingTimers.set(coalescingKey, timer);
    });
  }

  private groupConflictsByPath(changes: StateChange[]): Map<string, StateChange[]> {
    const groups = new Map<string, StateChange[]>();
    
    for (const change of changes) {
      const key = `${change.componentId}:${change.path}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(change);
    }
    
    return groups;
  }

  private async applyResolutionStrategy(changes: StateChange[], strategy: ConflictResolutionStrategy): Promise<StateChange | null> {
    switch (strategy.type) {
      case 'last-writer-wins':
        return changes.sort((a, b) => b.timestamp - a.timestamp)[0];
      
      case 'merge':
        return this.mergeChanges(changes);
      
      case 'rollback':
        // Signal rollback needed
        return null;
      
      case 'custom':
        return strategy.handler ? strategy.handler(changes) : null;
      
      default:
        return changes[0]; // Fallback
    }
  }

  private mergeChanges(changes: StateChange[]): StateChange {
    // Sort by timestamp
    const sortedChanges = changes.sort((a, b) => a.timestamp - b.timestamp);
    const baseChange = sortedChanges[0];
    
    // Create merged change
    return {
      id: `merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      componentId: baseChange.componentId,
      path: baseChange.path,
      oldValue: baseChange.oldValue,
      newValue: sortedChanges[sortedChanges.length - 1].newValue,
      timestamp: Date.now(),
      source: 'conflict-resolver'
    };
  }

  private performCoalescing(changes: StateChange[]): StateChange[] {
    if (changes.length <= 1) return changes;

    switch (this.coalescingConfig.coalescingStrategy) {
      case 'latest':
        return [changes[changes.length - 1]];
      
      case 'merge':
        return [this.mergeChanges(changes)];
      
      case 'accumulate':
        // Keep all changes but optimize order
        return changes.sort((a, b) => a.timestamp - b.timestamp);
      
      default:
        return changes;
    }
  }

  private trackConflict(path: string, changes: StateChange[]): void {
    if (!this.conflictHistory.has(path)) {
      this.conflictHistory.set(path, []);
    }
    this.conflictHistory.get(path)!.push(...changes);
    
    // Limit history size for memory optimization
    const history = this.conflictHistory.get(path)!;
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  private emitMetrics(operation: string, duration: number, changeCount: number): void {
    // Emit to be consumed by Performance Monitor
    process.nextTick(() => {
      (process as any).emit('state-sync:metrics', {
        operation,
        duration,
        changeCount,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Get conflict statistics for monitoring
   */
  getConflictStats(): { totalConflicts: number; averageResolutionTime: number; topConflictPaths: string[] } {
    const totalConflicts = Array.from(this.conflictHistory.values()).reduce((sum, conflicts) => sum + conflicts.length, 0);
    
    const topPaths = Array.from(this.conflictHistory.entries())
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 5)
      .map(([path]) => path);

    return {
      totalConflicts,
      averageResolutionTime: 0, // Would be calculated from timing data
      topConflictPaths: topPaths
    };
  }
}

/**
 * StatePersistence - Optimized state storage and recovery
 * Handles efficient serialization/deserialization with performance targets
 */
export class StatePersistence {
  private memoryCache: Map<string, StateSnapshot> = new Map();
  private persistenceConfig: {
    memoryLimit: number;
    diskPersistence: boolean;
    compressionEnabled: boolean;
    snapshotIntervalMs: number;
  };
  private snapshotTimer?: NodeJS.Timeout;

  constructor(config: Partial<StatePersistence['persistenceConfig']> = {}) {
    this.persistenceConfig = {
      memoryLimit: 200 * 1024 * 1024, // 200MB memory limit from Phase 1 requirements
      diskPersistence: false, // Memory-first for <50ms performance
      compressionEnabled: true,
      snapshotIntervalMs: 5000,
      ...config
    };

    this.startSnapshotTimer();
  }

  /**
   * Store state with optimized serialization
   */
  async storeState(componentId: string, state: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      const snapshot: StateSnapshot = {
        id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        componentId,
        state: this.optimizeStateData(state),
        timestamp: Date.now(),
        version: this.getNextVersion(componentId)
      };

      // Store in memory cache
      this.memoryCache.set(componentId, snapshot);
      
      // Memory management
      await this.manageMemoryUsage();
      
      const duration = performance.now() - startTime;
      this.emitMetrics('state-store', duration, 1);
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown state storage error');
      throw new Error(`State storage failed: ${errorMessage}`);
    }
  }

  /**
   * Retrieve state with <50ms performance target
   */
  async retrieveState(componentId: string): Promise<any | null> {
    const startTime = performance.now();
    
    try {
      const snapshot = this.memoryCache.get(componentId);
      
      const duration = performance.now() - startTime;
      this.emitMetrics('state-retrieve', duration, 1);
      
      return snapshot ? this.deserializeStateData(snapshot.state) : null;
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown state retrieval error');
      throw new Error(`State retrieval failed: ${errorMessage}`);
    }
  }

  /**
   * Create state snapshot for rollback capability
   */
  async createSnapshot(componentId: string): Promise<string> {
    const snapshot = this.memoryCache.get(componentId);
    if (!snapshot) {
      throw new Error(`No state found for component: ${componentId}`);
    }

    const snapshotId = `rollback_${Date.now()}_${componentId}`;
    this.memoryCache.set(snapshotId, { ...snapshot, id: snapshotId });
    
    return snapshotId;
  }

  /**
   * Restore from snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<{ componentId: string; state: any }> {
    const snapshot = this.memoryCache.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    return {
      componentId: snapshot.componentId,
      state: this.deserializeStateData(snapshot.state)
    };
  }

  private optimizeStateData(state: any): any {
    if (!this.persistenceConfig.compressionEnabled) {
      return state;
    }

    // Simple optimization - remove undefined values and optimize JSON structure
    return JSON.parse(JSON.stringify(state, (key, value) => {
      if (value === undefined) return null;
      return value;
    }));
  }

  private deserializeStateData(optimizedState: any): any {
    return optimizedState;
  }

  private getNextVersion(componentId: string): number {
    const current = this.memoryCache.get(componentId);
    return current ? current.version + 1 : 1;
  }

  private async manageMemoryUsage(): Promise<void> {
    const memoryUsage = this.estimateMemoryUsage();
    
    if (memoryUsage > this.persistenceConfig.memoryLimit) {
      // Remove oldest snapshots
      const entries = Array.from(this.memoryCache.entries());
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = Math.ceil(entries.length * 0.1); // Remove 10%
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation - would use more sophisticated memory profiling in production
    return this.memoryCache.size * 1024; // Rough estimate
  }

  private startSnapshotTimer(): void {
    this.stopSnapshotTimer();
    this.snapshotTimer = setInterval(() => {
      // Periodic cleanup and optimization
      this.manageMemoryUsage();
    }, this.persistenceConfig.snapshotIntervalMs);
    this.snapshotTimer.unref?.();
  }

  private stopSnapshotTimer(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = undefined;
    }
  }

  private emitMetrics(operation: string, duration: number, operationCount: number): void {
    process.nextTick(() => {
      (process as any).emit('state-sync:metrics', {
        operation: `persistence-${operation}`,
        duration,
        operationCount,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Get persistence statistics
   */
  getPersistenceStats(): { cacheSize: number; memoryUsage: number; hitRatio: number } {
    return {
      cacheSize: this.memoryCache.size,
      memoryUsage: this.estimateMemoryUsage(),
      hitRatio: 0.95 // Would track actual hit ratio
    };
  }

  dispose(): void {
    this.stopSnapshotTimer();
    this.memoryCache.clear();
  }
}

/**
 * CrossInterfaceSync - Multi-interface coordination
 * Ensures state consistency across different interface types
 */
export class CrossInterfaceSync {
  private interfaceRegistry: Map<string, {
    type: string;
    capabilities: string[];
    lastSync: number;
    syncHandler: (state: any) => Promise<void>;
  }> = new Map();
  
  private syncQueue: Map<string, any[]> = new Map();
  private readonly syncIntervalMs = 50; // High-frequency sync for responsive interfaces
  private syncIntervalHandle?: NodeJS.Timeout;

  constructor() {
    this.startSyncProcessor();
  }

  /**
   * Register interface for cross-interface synchronization
   */
  registerInterface(interfaceId: string, interfaceType: string, capabilities: string[], syncHandler: (state: any) => Promise<void>): void {
    this.interfaceRegistry.set(interfaceId, {
      type: interfaceType,
      capabilities,
      lastSync: Date.now(),
      syncHandler
    });
  }

  /**
   * Synchronize state across all relevant interfaces
   */
  async syncState(componentId: string, state: any, sourceInterface?: string): Promise<void> {
    const startTime = performance.now();
    const syncPromises: Promise<void>[] = [];

    try {
      for (const [interfaceId, interfaceInfo] of Array.from(this.interfaceRegistry)) {
        // Skip source interface to avoid loops
        if (interfaceId === sourceInterface) continue;

        // Check if interface needs this state update
        if (this.shouldSyncToInterface(componentId, interfaceInfo)) {
          syncPromises.push(this.syncToInterface(interfaceId, interfaceInfo, state));
        }
      }

      await Promise.allSettled(syncPromises);
      
      const duration = performance.now() - startTime;
      this.emitMetrics('cross-interface-sync', duration, syncPromises.length);
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown cross-interface sync error');
      throw new Error(`Cross-interface sync failed: ${errorMessage}`);
    }
  }

  /**
   * Queue state change for batched synchronization
   */
  queueSync(interfaceId: string, state: any): void {
    if (!this.syncQueue.has(interfaceId)) {
      this.syncQueue.set(interfaceId, []);
    }
    this.syncQueue.get(interfaceId)!.push(state);
  }

  private shouldSyncToInterface(componentId: string, interfaceInfo: any): boolean {
    // Basic capability checking - would be more sophisticated in production
    return interfaceInfo.capabilities.includes(componentId) || interfaceInfo.capabilities.includes('*');
  }

  private async syncToInterface(interfaceId: string, interfaceInfo: any, state: any): Promise<void> {
    try {
      await interfaceInfo.syncHandler(state);
      this.interfaceRegistry.get(interfaceId)!.lastSync = Date.now();
    } catch (error) {
      // Log error but don't fail entire sync
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: `cross-interface-sync:${interfaceId}`,
        error: isTemplumError(error) ? error : {
          name: 'SyncError',
          message: (error instanceof Error ? error.message : 'Unknown sync error'),
          code: 'SYNC_INTERFACE_ERROR',
          category: 'integration' as const,
          timestamp: Date.now(),
        } as TemplumError,
        severity: 'medium' as const
      };
      (process as any).emit('state-sync:error', errorPayload);
    }
  }

  private startSyncProcessor(): void {
    this.stopSyncProcessor();
    this.syncIntervalHandle = setInterval(() => {
      this.processSyncQueue();
    }, this.syncIntervalMs);
    this.syncIntervalHandle.unref?.();
  }

  private stopSyncProcessor(): void {
    if (this.syncIntervalHandle) {
      clearInterval(this.syncIntervalHandle);
      this.syncIntervalHandle = undefined;
    }
  }

  private async processSyncQueue(): Promise<void> {
    const processPromises: Promise<void>[] = [];

    for (const [interfaceId, stateQueue] of Array.from(this.syncQueue)) {
      if (stateQueue.length === 0) continue;

      const interfaceInfo = this.interfaceRegistry.get(interfaceId);
      if (!interfaceInfo) continue;

      // Process batch
      const batch = stateQueue.splice(0, 5); // Process up to 5 state changes per batch
      
      for (const state of batch) {
        processPromises.push(this.syncToInterface(interfaceId, interfaceInfo, state));
      }
    }

    await Promise.allSettled(processPromises);
  }

  private emitMetrics(operation: string, duration: number, interfaceCount: number): void {
    process.nextTick(() => {
      (process as any).emit('state-sync:metrics', {
        operation: `cross-interface-${operation}`,
        duration,
        interfaceCount,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Get synchronization statistics
   */
  getSyncStats(): { interfaceCount: number; averageSyncTime: number; queueSizes: Record<string, number> } {
    const queueSizes: Record<string, number> = {};
    
    for (const [interfaceId, queue] of Array.from(this.syncQueue)) {
      queueSizes[interfaceId] = queue.length;
    }

    return {
      interfaceCount: this.interfaceRegistry.size,
      averageSyncTime: 0, // Would calculate from timing data
      queueSizes
    };
  }

  dispose(): void {
    this.stopSyncProcessor();
    this.interfaceRegistry.clear();
    this.syncQueue.clear();
  }
}

/**
 * EnhancedStateManager - Main orchestrator for state synchronization
 * Coordinates all state operations with performance monitoring and integration hooks
 */
export class EnhancedStateManager extends EventEmitter {
  private ipcCoordinator: IPCCoordinator;
  private conflictResolver: ConflictResolver;
  private statePersistence: StatePersistence;
  private crossInterfaceSync: CrossInterfaceSync;
  
  private performanceMetrics: PerformanceMetrics = {
    operationCount: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    errorCount: 0,
    coalescingEfficiency: 0
  };
  
  private readonly performanceThreshold = 30; // 30% degradation threshold from Phase 1
  private cleanupTasks: Array<() => void> = [];

  constructor(config: {
    coalescingConfig?: Partial<StateCoalescingConfig>;
    persistenceConfig?: Partial<StatePersistence['persistenceConfig']>;
  } = {}) {
    super();
    
    // Initialize core components
    this.ipcCoordinator = new IPCCoordinator();
    this.conflictResolver = new ConflictResolver(config.coalescingConfig);
    this.statePersistence = new StatePersistence(config.persistenceConfig);
    this.crossInterfaceSync = new CrossInterfaceSync();
    
    this.setupEventHandlers();
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize state manager with component integrations
   */
  async initialize(): Promise<void> {
    try {
      // Setup integration hooks for existing components
      this.setupComponentTransferIntegration();
      this.setupPCLRegistryIntegration();
      this.setupRiskMitigationIntegration();
      this.setupUniversalSkinIntegration();
      
      this.emit('initialized', { timestamp: Date.now() });
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown initialization error');
      this.emit('error', { error: errorMessage, operation: 'initialization' });
      throw error;
    }
  }

  /**
   * Update component state with full coordination
   */
  async updateState(componentId: string, statePath: string, newValue: any, options: {
    sourceInterface?: string;
    skipCoalescing?: boolean;
    priority?: 'high' | 'normal' | 'low';
  } = {}): Promise<void> {
    const startTime = performance.now();
    const changeId = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create state change record
      const change: StateChange = {
        id: changeId,
        componentId,
        path: statePath,
        oldValue: await this.statePersistence.retrieveState(componentId),
        newValue,
        timestamp: Date.now(),
        source: options.sourceInterface || 'unknown'
      };

      // Apply conflict resolution and coalescing
      let finalChanges: StateChange[];
      if (options.skipCoalescing) {
        finalChanges = [change];
      } else {
        finalChanges = await this.conflictResolver.coalesceChanges(change);
      }

      // Apply changes
      for (const finalChange of finalChanges) {
        await this.applyStateChange(finalChange, options);
      }

      // Update performance metrics
      const duration = performance.now() - startTime;
      this.updatePerformanceMetrics('state-update', duration);
      
      // Check performance threshold
      if (duration > 50) { // 50ms target exceeded
        this.emit('performance-warning', {
          operation: 'updateState',
          duration,
          componentId,
          threshold: 50
        });
      }

    } catch (error) {
      this.performanceMetrics.errorCount++;
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown update state error');
      this.emit('error', { error: errorMessage, operation: 'updateState', componentId });
      throw error;
    }
  }

  /**
   * Request current state from component
   */
  async requestState(componentId: string, interfaceType: string): Promise<any> {
    const startTime = performance.now();
    
    try {
      // Try local persistence first
      let state = await this.statePersistence.retrieveState(componentId);
      
      if (!state) {
        // Send IPC request for state
        const message: IPCStateMessage = {
          type: 'state-request',
          componentId,
          interfaceType,
          stateData: null,
          timestamp: Date.now(),
          changeId: `request_${Date.now()}`
        };
        
        await this.ipcCoordinator.sendMessage(message);
        
        // Wait for response (with timeout)
        state = await this.waitForStateResponse(componentId, 100); // 100ms timeout
      }

      const duration = performance.now() - startTime;
      this.updatePerformanceMetrics('state-request', duration);
      
      return state;
      
    } catch (error) {
      this.performanceMetrics.errorCount++;
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown request state error');
      throw isTemplumError(error) ? error : new Error(`State request failed: ${errorMessage}`);
    }
  }

  /**
   * Register interface for state synchronization
   */
  registerInterface(interfaceId: string, interfaceType: string, capabilities: string[]): void {
    // Register with IPC coordinator
    this.ipcCoordinator.registerInterface(interfaceType, (message: IPCStateMessage) => {
      this.handleIPCMessage(message, interfaceId);
    });

    // Register with cross-interface sync
    this.crossInterfaceSync.registerInterface(interfaceId, interfaceType, capabilities, async (state: any) => {
      await this.syncStateToInterface(interfaceId, state);
    });

    this.emit('interface-registered', { interfaceId, interfaceType, capabilities });
  }

  private async applyStateChange(change: StateChange, options: any): Promise<void> {
    // Store state
    await this.statePersistence.storeState(change.componentId, change.newValue);
    
    // Create IPC message
    const message: IPCStateMessage = {
      type: 'state-update',
      componentId: change.componentId,
      interfaceType: options.sourceInterface || 'unknown',
      stateData: change.newValue,
      timestamp: change.timestamp,
      changeId: change.id
    };
    
    // Send IPC message
    await this.ipcCoordinator.sendMessage(message);
    
    // Sync across interfaces
    await this.crossInterfaceSync.syncState(change.componentId, change.newValue, options.sourceInterface);
    
    this.emit('state-changed', { change, options });
  }

  private async handleIPCMessage(message: IPCStateMessage, interfaceId: string): Promise<void> {
    switch (message.type) {
      case 'state-update':
        await this.handleStateUpdate(message, interfaceId);
        break;
      case 'state-request':
        await this.handleStateRequest(message, interfaceId);
        break;
      case 'conflict-resolution':
        await this.handleConflictResolution(message, interfaceId);
        break;
    }
  }

  private async handleStateUpdate(message: IPCStateMessage, interfaceId: string): Promise<void> {
    await this.statePersistence.storeState(message.componentId, message.stateData);
    await this.crossInterfaceSync.syncState(message.componentId, message.stateData, interfaceId);
  }

  private async handleStateRequest(message: IPCStateMessage, interfaceId: string): Promise<void> {
    const state = await this.statePersistence.retrieveState(message.componentId);
    
    const response: IPCStateMessage = {
      type: 'state-update',
      componentId: message.componentId,
      interfaceType: message.interfaceType,
      stateData: state,
      timestamp: Date.now(),
      changeId: `response_${message.changeId}`
    };
    
    await this.ipcCoordinator.sendMessage(response, interfaceId);
  }

  private async handleConflictResolution(message: IPCStateMessage, interfaceId: string): Promise<void> {
    // Handle conflict resolution - implementation would depend on specific conflict resolution strategy
    this.emit('conflict-detected', { message, interfaceId });
  }

  private async waitForStateResponse(componentId: string, timeoutMs: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`State request timeout for ${componentId}`));
      }, timeoutMs);

      const handler = (data: any) => {
        if (data.componentId === componentId) {
          clearTimeout(timeout);
          this.off('state-response', handler);
          resolve(data.state);
        }
      };

      this.on('state-response', handler);
    });
  }

  private async syncStateToInterface(interfaceId: string, state: any): Promise<void> {
    // Interface-specific synchronization logic
    this.emit('sync-to-interface', { interfaceId, state });
  }

  private setupEventHandlers(): void {
    // Listen for performance metrics from components
    const metricsHandler = (metrics: any) => {
      this.updatePerformanceMetrics(metrics.operation, metrics.duration);
    };
    process.on('state-sync:metrics', metricsHandler);
    this.registerCleanup(() => process.off('state-sync:metrics', metricsHandler));

    // Listen for errors from components
    const errorHandler = (error: any) => {
      this.performanceMetrics.errorCount++;
      this.emit('error', error);
    };
    process.on('state-sync:error', errorHandler);
    this.registerCleanup(() => process.off('state-sync:error', errorHandler));
  }

  private setupPerformanceMonitoring(): void {
    // Performance monitoring integration for 30% degradation threshold
    const handle = setInterval(() => {
      const currentPerformance = this.calculateCurrentPerformance();
      
      if (currentPerformance.degradationPercentage > this.performanceThreshold) {
        this.emit('performance-threshold-exceeded', {
          currentPerformance,
          threshold: this.performanceThreshold,
          timestamp: Date.now()
        });
      }
    }, 5000); // Check every 5 seconds
    handle.unref?.();
    this.registerCleanup(() => clearInterval(handle));
  }

  private setupComponentTransferIntegration(): void {
    // Integration with Component Transfer Strategy
    this.on('component-transfer-start', async (data: any) => {
      await this.statePersistence.createSnapshot(data.componentId);
    });

    this.on('component-transfer-complete', async (data: any) => {
      await this.crossInterfaceSync.syncState(data.componentId, data.newState);
    });
  }

  private setupPCLRegistryIntegration(): void {
    // Integration with PCL Registry changes
    this.on('pcl-registry-update', async (data: any) => {
      await this.updateState(data.registryType, data.path, data.newValue, {
        sourceInterface: 'pcl-registry',
        priority: 'high'
      });
    });
  }

  private setupRiskMitigationIntegration(): void {
    // Integration with Risk Mitigation Framework
    this.on('performance-degradation-detected', async (data: any) => {
      if (data.degradationPercentage > this.performanceThreshold) {
        // Trigger rollback if needed
        this.emit('rollback-recommended', data);
      }
    });
  }

  private setupUniversalSkinIntegration(): void {
    // Integration with Universal Skin Engine
    this.on('skin-theme-change', async (data: any) => {
      await this.updateState('universal-skin', 'theme', data.newTheme, {
        sourceInterface: 'skin-engine',
        skipCoalescing: true // Theme changes should be immediate
      });
    });
  }

  private updatePerformanceMetrics(operation: string, duration: number): void {
    this.performanceMetrics.operationCount++;
    this.performanceMetrics.maxResponseTime = Math.max(this.performanceMetrics.maxResponseTime, duration);
    
    // Update rolling average
    const oldAvg = this.performanceMetrics.averageResponseTime;
    const newAvg = (oldAvg * (this.performanceMetrics.operationCount - 1) + duration) / this.performanceMetrics.operationCount;
    this.performanceMetrics.averageResponseTime = newAvg;
  }

  private calculateCurrentPerformance(): { degradationPercentage: number; averageResponseTime: number } {
    const baselineResponseTime = 25; // 25ms baseline from Phase 1
    const degradationPercentage = ((this.performanceMetrics.averageResponseTime - baselineResponseTime) / baselineResponseTime) * 100;
    
    return {
      degradationPercentage: Math.max(0, degradationPercentage),
      averageResponseTime: this.performanceMetrics.averageResponseTime
    };
  }

  /**
   * Get comprehensive system statistics
   */
  getSystemStats(): {
    performance: PerformanceMetrics;
    conflicts: ReturnType<ConflictResolver['getConflictStats']>;
    persistence: ReturnType<StatePersistence['getPersistenceStats']>;
    sync: ReturnType<CrossInterfaceSync['getSyncStats']>;
  } {
    return {
      performance: { ...this.performanceMetrics },
      conflicts: this.conflictResolver.getConflictStats(),
      persistence: this.statePersistence.getPersistenceStats(),
      sync: this.crossInterfaceSync.getSyncStats()
    };
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    this.emit('shutting-down', { timestamp: Date.now() });
    this.cleanupResources();
    
    // Clean up timers and resources
    this.removeAllListeners();
    
    this.emit('shutdown-complete', { timestamp: Date.now() });
  }

  private registerCleanup(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  private cleanupResources(): void {
    while (this.cleanupTasks.length) {
      const task = this.cleanupTasks.pop();
      try {
        task?.();
      } catch (error) {
        console.error('EnhancedStateManager: cleanup task failed', error);
      }
    }
    this.ipcCoordinator.dispose();
    this.statePersistence.dispose();
    this.crossInterfaceSync.dispose();
  }
}

// Export default instance for convenience
export const stateManager = new EnhancedStateManager();
