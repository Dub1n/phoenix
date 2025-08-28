/**
 * State Synchronization Foundation
 * 
 * Core state management with basic cross-interface state coordination using Phase 2 IPC patterns.
 * Implements foundational conflict resolution with 100ms coalescing windows.
 * 
 * Performance Target: Maintain 50-150ms state sync baseline from Phase 2
 * Integration Point: Leverages Enhanced State Synchronization architecture from Phase 2
 * 
 * Generated: 2025-08-21
 */

import { EventEmitter } from 'events';

export interface StateUpdate {
  interfaceId: string;
  timestamp: Date;
  updates: Record<string, any>;
  version: number;
}

export interface StateConflict {
  key: string;
  conflicts: StateUpdate[];
  resolvedValue: any;
  resolutionStrategy: 'latest' | 'merge' | 'priority';
}

export interface StateSyncMetrics {
  totalUpdates: number;
  conflictsResolved: number;
  averageSyncTime: number;
  lastSyncTimestamp: Date;
}

export interface CoalescingWindow {
  startTime: Date;
  endTime: Date;
  pendingUpdates: StateUpdate[];
  isProcessing: boolean;
}

/**
 * Foundation component for cross-interface state synchronization
 * Provides basic state management required by all dependent components
 */
export class StateSyncFoundation extends EventEmitter {
  private globalState: Record<string, any> = {};
  private interfaceStates: Map<string, Record<string, any>> = new Map();
  private updateQueue: StateUpdate[] = [];
  private coalescingWindow: CoalescingWindow | null = null;
  private conflictResolution: Map<string, StateConflict> = new Map();
  private metrics: StateSyncMetrics = {
    totalUpdates: 0,
    conflictsResolved: 0,
    averageSyncTime: 0,
    lastSyncTimestamp: new Date()
  };
  private initialized = false;
  private processingTimeout: NodeJS.Timeout | null = null;
  private versionCounter = 0;

  /**
   * Initialize the state synchronization foundation
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.setupEventHandlers();
    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Update state for a specific interface with coalescing
   */
  async updateState(interfaceId: string, updates: Record<string, any>): Promise<boolean> {
    const startTime = Date.now();

    const stateUpdate: StateUpdate = {
      interfaceId,
      timestamp: new Date(),
      updates,
      version: ++this.versionCounter
    };

    this.updateQueue.push(stateUpdate);
    this.metrics.totalUpdates++;

    // Start or extend coalescing window
    this.startCoalescingWindow();

    const syncTime = Date.now() - startTime;
    this.updateAverageSyncTime(syncTime);

    this.emit('stateUpdateQueued', stateUpdate);
    return true;
  }

  /**
   * Get current state for interface or global state
   */
  async getState(interfaceId?: string): Promise<Record<string, any>> {
    if (interfaceId) {
      const interfaceState = this.interfaceStates.get(interfaceId) || {};
      return {
        ...interfaceState,
        syncLatency: this.getLastSyncLatency(),
        conflictsResolved: this.hasConflictsResolved()
      };
    }

    return { 
      ...this.globalState,
      conflictsResolved: this.hasConflictsResolved(),
      syncLatency: this.getLastSyncLatency()
    };
  }

  /**
   * Get synchronized state with conflict resolution status
   */
  async getSynchronizedState(): Promise<{
    state: Record<string, any>;
    conflictsResolved: boolean;
    syncLatency: number;
  }> {
    const startTime = Date.now();
    
    // Wait for any pending coalescing to complete
    if (this.coalescingWindow?.isProcessing) {
      await this.waitForCoalescingComplete();
    }

    const syncLatency = Date.now() - startTime;

    return {
      state: { ...this.globalState },
      conflictsResolved: this.conflictResolution.size > 0,
      syncLatency
    };
  }

  /**
   * Force immediate synchronization (bypass coalescing)
   */
  async forceSynchronization(): Promise<void> {
    if (this.coalescingWindow) {
      await this.processCoalescingWindow();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): StateSyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if foundation is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get active interface count
   */
  getActiveInterfaceCount(): number {
    return this.interfaceStates.size;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    this.updateQueue = [];
    this.coalescingWindow = null;
    this.conflictResolution.clear();
    this.interfaceStates.clear();
    this.globalState = {};
    this.initialized = false;
    this.removeAllListeners();

    this.emit('cleanup');
  }

  /**
   * Start or extend coalescing window (100ms from Phase 2)
   */
  private startCoalescingWindow(): void {
    const now = new Date();

    if (!this.coalescingWindow) {
      this.coalescingWindow = {
        startTime: now,
        endTime: new Date(now.getTime() + 100), // 100ms window
        pendingUpdates: [],
        isProcessing: false
      };

      // Schedule processing
      this.processingTimeout = setTimeout(() => {
        this.processCoalescingWindow();
      }, 100);
    } else {
      // Extend window if not already processing
      if (!this.coalescingWindow.isProcessing) {
        this.coalescingWindow.endTime = new Date(now.getTime() + 100);
      }
    }
  }

  /**
   * Process the coalescing window and resolve conflicts
   */
  private async processCoalescingWindow(): Promise<void> {
    if (!this.coalescingWindow) return;

    this.coalescingWindow.isProcessing = true;
    const updates = [...this.updateQueue];
    this.updateQueue = [];

    // Group updates by key to detect conflicts
    const updatesByKey = new Map<string, StateUpdate[]>();
    
    for (const update of updates) {
      for (const [key, value] of Object.entries(update.updates)) {
        if (!updatesByKey.has(key)) {
          updatesByKey.set(key, []);
        }
        updatesByKey.get(key)!.push({
          ...update,
          updates: { [key]: value }
        });
      }
    }

    // Process each key and resolve conflicts
    for (const [key, keyUpdates] of updatesByKey) {
      if (keyUpdates.length > 1) {
        // Conflict detected
        await this.resolveConflict(key, keyUpdates);
      } else if (keyUpdates.length === 1) {
        // No conflict, apply directly
        this.applyStateUpdate(key, keyUpdates[0]);
      }
    }

    // Update interface-specific states
    this.updateInterfaceStates(updates);

    this.coalescingWindow = null;
    this.processingTimeout = null;
    this.metrics.lastSyncTimestamp = new Date();

    this.emit('coalescingComplete', updates.length);
  }

  /**
   * Resolve conflicts using strategy (latest wins by default)
   */
  private async resolveConflict(key: string, conflicts: StateUpdate[]): Promise<void> {
    // Sort by timestamp (latest first)
    const sortedConflicts = conflicts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const resolvedValue = sortedConflicts[0].updates[key];
    
    const conflict: StateConflict = {
      key,
      conflicts,
      resolvedValue,
      resolutionStrategy: 'latest'
    };

    this.conflictResolution.set(key, conflict);
    this.applyStateUpdate(key, sortedConflicts[0]);
    this.metrics.conflictsResolved++;

    this.emit('conflictResolved', conflict);
  }

  /**
   * Apply a single state update to global state
   */
  private applyStateUpdate(key: string, update: StateUpdate): void {
    const value = update.updates[key];
    this.globalState[key] = value;
    this.emit('stateUpdated', key, value, update.interfaceId);
  }

  /**
   * Update interface-specific state maps
   */
  private updateInterfaceStates(updates: StateUpdate[]): void {
    for (const update of updates) {
      let interfaceState = this.interfaceStates.get(update.interfaceId);
      if (!interfaceState) {
        interfaceState = {};
        this.interfaceStates.set(update.interfaceId, interfaceState);
      }

      Object.assign(interfaceState, update.updates);
    }
  }

  /**
   * Wait for current coalescing window to complete
   */
  private async waitForCoalescingComplete(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.coalescingWindow?.isProcessing) {
        resolve();
        return;
      }

      const checkComplete = () => {
        if (!this.coalescingWindow?.isProcessing) {
          resolve();
        } else {
          setTimeout(checkComplete, 10);
        }
      };

      checkComplete();
    });
  }

  /**
   * Update average sync time for metrics
   */
  private updateAverageSyncTime(newTime: number): void {
    if (this.metrics.totalUpdates === 1) {
      this.metrics.averageSyncTime = newTime;
    } else {
      this.metrics.averageSyncTime = 
        (this.metrics.averageSyncTime * (this.metrics.totalUpdates - 1) + newTime) / 
        this.metrics.totalUpdates;
    }
  }

  /**
   * Get the last synchronization latency
   */
  private getLastSyncLatency(): number {
    return this.metrics.averageSyncTime;
  }

  /**
   * Check if any conflicts have been resolved
   */
  private hasConflictsResolved(): boolean {
    return this.metrics.conflictsResolved > 0;
  }

  /**
   * Setup event handlers for foundation
   */
  private setupEventHandlers(): void {
    // Monitor performance and warn if sync time exceeds baseline
    this.on('stateUpdated', (key, value, interfaceId) => {
      if (this.metrics.averageSyncTime > 150) {
        console.warn(`State sync average time exceeding 150ms baseline: ${this.metrics.averageSyncTime}ms`);
      }
    });

    // Log conflict resolutions for debugging
    this.on('conflictResolved', (conflict) => {
      console.debug(`State conflict resolved for key '${conflict.key}' using ${conflict.resolutionStrategy} strategy`);
    });
  }
}