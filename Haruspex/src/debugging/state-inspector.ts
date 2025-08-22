/**---
 * title: [Haruspex State Inspector - Real-Time State Monitoring]
 * tags: [State-Inspection, Real-Time, Debugging, Monitoring]
 * provides: [StateInspector, StateDiff, StateWatch, PropertyTracking]
 * requires: [Core Engine, Debug Manager, IPC Protocol]
 * description: [Real-time state inspection and monitoring system for Haruspex extension debugging]
 * ---*/

import { EventEmitter } from 'events';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';
import { HaruspexDebugManager } from './haruspex-debug-manager';
import { StateChangeEvent } from './ipc-protocol';

export interface StateSnapshot {
  timestamp: number;
  engine: {
    health: any;
    metrics: any;
    isInitialized: boolean;
    pclIntegration: boolean;
  };
  debug: {
    debugInfo: any;
    activationStatus: any;
    errors: string[];
    warnings: string[];
  };
  performance: {
    memoryUsage: number;
    cpuUsage?: number;
    operationMetrics: any;
    responseTimeTrends: number[];
  };
  workspace: {
    hasWorkspace: boolean;
    root?: string;
    fileCount: number;
    haruspexFiles: number;
    supportedFiles: number;
  };
  providers: {
    documentationTree: any;
    webviews: any;
  };
}

export interface StateDiff {
  timestamp: number;
  changes: StateChange[];
}

export interface StateChange {
  path: string;
  component: string;
  property: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
  significance: 'low' | 'medium' | 'high' | 'critical';
}

export interface StateWatchConfig {
  components?: string[];
  properties?: string[];
  threshold?: number; // Minimum time between updates (ms)
  includeMetrics?: boolean;
  includePerformance?: boolean;
  maxHistory?: number;
}

export interface PropertyWatch {
  id: string;
  path: string;
  component: string;
  property: string;
  condition?: (value: any) => boolean;
  onChange?: (change: StateChange) => void;
}

/**
 * Real-time state inspection and monitoring system
 * 
 * Provides comprehensive state tracking with:
 * - Snapshot-based state monitoring
 * - Automatic change detection and diffing
 * - Property-level watching with conditions
 * - Performance trend analysis
 * - Historical state management
 */
export class HaruspexStateInspector extends EventEmitter {
  private currentSnapshot: StateSnapshot | undefined;
  private stateHistory: StateSnapshot[] = [];
  private propertyWatches = new Map<string, PropertyWatch>();
  private watchTimer: NodeJS.Timeout | undefined;
  private watchConfig: StateWatchConfig;
  private lastUpdateTime = 0;

  constructor(
    private coreEngine: HaruspexCoreEngine,
    private debugManager: HaruspexDebugManager,
    config: StateWatchConfig = {}
  ) {
    super();
    
    this.watchConfig = {
      threshold: 1000, // 1 second minimum between updates
      includeMetrics: true,
      includePerformance: true,
      maxHistory: 100,
      ...config
    };
  }

  /**
   * Start real-time state monitoring
   */
  async startWatching(interval: number = 2000): Promise<void> {
    if (this.watchTimer) {
      this.stopWatching();
    }

    // Take initial snapshot
    await this.takeSnapshot();

    this.watchTimer = setInterval(async () => {
      try {
        await this.updateState();
      } catch (error) {
        this.emit('error', new Error(`State update failed: ${error}`));
      }
    }, interval);

    this.emit('watching_started', { interval, config: this.watchConfig });
  }

  /**
   * Stop real-time state monitoring
   */
  stopWatching(): void {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = undefined;
      this.emit('watching_stopped');
    }
  }

  /**
   * Take a complete state snapshot
   */
  async takeSnapshot(): Promise<StateSnapshot> {
    const timestamp = Date.now();

    try {
      // Collect engine state
      const health = this.coreEngine.getHealthStatus();
      const metrics = this.coreEngine.getMetrics();
      const debugInfo = await this.debugManager.collectDebugInfo();

      // Collect performance data
      const memoryUsage = process.memoryUsage();
      const responseTimeTrends = this.extractResponseTimeTrends(metrics);

      const snapshot: StateSnapshot = {
        timestamp,
        engine: {
          health,
          metrics,
          isInitialized: health.components.circuitBreaker !== 'open',
          pclIntegration: this.coreEngine.isPCLIntegrationAvailable()
        },
        debug: {
          debugInfo,
          activationStatus: debugInfo.activation,
          errors: debugInfo.activation.errors || [],
          warnings: debugInfo.activation.warnings || []
        },
        performance: {
          memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
          operationMetrics: metrics.operations,
          responseTimeTrends
        },
        workspace: {
          hasWorkspace: debugInfo.workspace.hasWorkspaceFolder,
          ...(debugInfo.workspace.workspaceRoot && { 
            root: debugInfo.workspace.workspaceRoot 
          }),
          fileCount: debugInfo.workspace.fileCount,
          haruspexFiles: debugInfo.workspace.haruspexFiles,
          supportedFiles: debugInfo.workspace.supportedFiles
        },
        providers: {
          documentationTree: debugInfo.providers.documentationTree,
          webviews: debugInfo.providers.webviews
        }
      };

      // Store snapshot
      this.currentSnapshot = snapshot;
      this.addToHistory(snapshot);

      return snapshot;

    } catch (error) {
      throw new Error(`Failed to take state snapshot: ${error}`);
    }
  }

  /**
   * Update state and detect changes
   */
  private async updateState(): Promise<void> {
    const now = Date.now();
    
    // Throttle updates
    if (now - this.lastUpdateTime < this.watchConfig.threshold!) {
      return;
    }

    const previousSnapshot = this.currentSnapshot;
    const newSnapshot = await this.takeSnapshot();

    if (previousSnapshot) {
      const diff = this.createStateDiff(previousSnapshot, newSnapshot);
      
      if (diff.changes.length > 0) {
        this.emit('state_changed', diff);
        
        // Process property watches
        this.processPropertyWatches(diff.changes);
        
        // Emit specific change events
        for (const change of diff.changes) {
          this.emit('property_changed', change);
          
          // Emit component-specific events
          this.emit(`${change.component}_changed`, change);
          
          // Emit critical changes
          if (change.significance === 'critical') {
            this.emit('critical_change', change);
          }
        }
      }
    }

    this.lastUpdateTime = now;
  }

  /**
   * Create diff between two state snapshots
   */
  private createStateDiff(oldSnapshot: StateSnapshot, newSnapshot: StateSnapshot): StateDiff {
    const changes: StateChange[] = [];

    // Compare engine state
    this.compareObjects('engine', oldSnapshot.engine, newSnapshot.engine, changes);
    
    // Compare debug state
    this.compareObjects('debug', oldSnapshot.debug, newSnapshot.debug, changes);
    
    // Compare performance state
    this.compareObjects('performance', oldSnapshot.performance, newSnapshot.performance, changes);
    
    // Compare workspace state
    this.compareObjects('workspace', oldSnapshot.workspace, newSnapshot.workspace, changes);
    
    // Compare providers state
    this.compareObjects('providers', oldSnapshot.providers, newSnapshot.providers, changes);

    return {
      timestamp: newSnapshot.timestamp,
      changes
    };
  }

  /**
   * Compare two objects and detect changes
   */
  private compareObjects(
    component: string, 
    oldObj: any, 
    newObj: any, 
    changes: StateChange[],
    path: string = ''
  ): void {
    const currentPath = path ? `${path}.${component}` : component;

    // Handle null/undefined cases
    if (oldObj === null || oldObj === undefined) {
      if (newObj !== null && newObj !== undefined) {
        changes.push({
          path: currentPath,
          component,
          property: path || 'root',
          oldValue: oldObj,
          newValue: newObj,
          changeType: 'added',
          significance: this.determineSignificance(component, path || 'root', oldObj, newObj)
        });
      }
      return;
    }

    if (newObj === null || newObj === undefined) {
      changes.push({
        path: currentPath,
        component,
        property: path || 'root',
        oldValue: oldObj,
        newValue: newObj,
        changeType: 'removed',
        significance: this.determineSignificance(component, path || 'root', oldObj, newObj)
      });
      return;
    }

    // Handle primitive values
    if (typeof oldObj !== 'object' || typeof newObj !== 'object') {
      if (oldObj !== newObj) {
        changes.push({
          path: currentPath,
          component,
          property: path || 'root',
          oldValue: oldObj,
          newValue: newObj,
          changeType: 'modified',
          significance: this.determineSignificance(component, path || 'root', oldObj, newObj)
        });
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(oldObj) || Array.isArray(newObj)) {
      if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
        changes.push({
          path: currentPath,
          component,
          property: path || 'root',
          oldValue: oldObj,
          newValue: newObj,
          changeType: 'modified',
          significance: this.determineSignificance(component, path || 'root', oldObj, newObj)
        });
      }
      return;
    }

    // Handle objects
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    
    for (const key of allKeys) {
      const oldValue = oldObj[key];
      const newValue = newObj[key];
      const propertyPath = path ? `${path}.${key}` : key;

      if (!(key in oldObj)) {
        // Property added
        changes.push({
          path: `${currentPath}.${key}`,
          component,
          property: propertyPath,
          oldValue: undefined,
          newValue,
          changeType: 'added',
          significance: this.determineSignificance(component, propertyPath, undefined, newValue)
        });
      } else if (!(key in newObj)) {
        // Property removed
        changes.push({
          path: `${currentPath}.${key}`,
          component,
          property: propertyPath,
          oldValue,
          newValue: undefined,
          changeType: 'removed',
          significance: this.determineSignificance(component, propertyPath, oldValue, undefined)
        });
      } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
        // Recursively compare nested objects
        this.compareObjects(component, oldValue, newValue, changes, propertyPath);
      } else if (oldValue !== newValue) {
        // Property modified
        changes.push({
          path: `${currentPath}.${key}`,
          component,
          property: propertyPath,
          oldValue,
          newValue,
          changeType: 'modified',
          significance: this.determineSignificance(component, propertyPath, oldValue, newValue)
        });
      }
    }
  }

  /**
   * Determine significance of a state change
   */
  private determineSignificance(component: string, property: string, oldValue: any, newValue: any): 'low' | 'medium' | 'high' | 'critical' {
    // Critical changes
    if (component === 'engine' && property === 'health.overall') {
      if (oldValue === 'healthy' && newValue !== 'healthy') return 'critical';
      if (oldValue !== 'healthy' && newValue === 'healthy') return 'high';
    }

    if (component === 'engine' && property === 'isInitialized') {
      return oldValue !== newValue ? 'critical' : 'low';
    }

    if (component === 'debug' && property.includes('errors')) {
      if (Array.isArray(newValue) && newValue.length > (Array.isArray(oldValue) ? oldValue.length : 0)) {
        return 'high';
      }
    }

    // High significance changes
    if (component === 'workspace' && property === 'hasWorkspace') {
      return 'high';
    }

    if (component === 'performance' && property === 'memoryUsage') {
      const diff = Math.abs(newValue - oldValue);
      if (diff > 100) return 'high'; // More than 100MB change
      if (diff > 50) return 'medium';
    }

    // Medium significance changes
    if (component === 'engine' && property.includes('metrics')) {
      return 'medium';
    }

    if (component === 'providers') {
      return 'medium';
    }

    // Default to low significance
    return 'low';
  }

  /**
   * Process property watches and trigger callbacks
   */
  private processPropertyWatches(changes: StateChange[]): void {
    for (const change of changes) {
      for (const [watchId, watch] of this.propertyWatches) {
        if (this.matchesWatch(change, watch)) {
          // Check condition if specified
          if (watch.condition && !watch.condition(change.newValue)) {
            continue;
          }

          // Trigger callback
          if (watch.onChange) {
            try {
              watch.onChange(change);
            } catch (error) {
              this.emit('watch_error', { watchId, error, change });
            }
          }

          // Emit watch-specific event
          this.emit('watch_triggered', { watchId, watch, change });
        }
      }
    }
  }

  /**
   * Check if a change matches a property watch
   */
  private matchesWatch(change: StateChange, watch: PropertyWatch): boolean {
    if (watch.component && change.component !== watch.component) {
      return false;
    }

    if (watch.property && change.property !== watch.property) {
      return false;
    }

    if (watch.path && change.path !== watch.path) {
      return false;
    }

    return true;
  }

  /**
   * Extract response time trends from metrics
   */
  private extractResponseTimeTrends(metrics: any): number[] {
    if (metrics.operations?.responseTimes && Array.isArray(metrics.operations.responseTimes)) {
      return metrics.operations.responseTimes.slice(-20); // Last 20 response times
    }
    return [];
  }

  /**
   * Add snapshot to history with size management
   */
  private addToHistory(snapshot: StateSnapshot): void {
    this.stateHistory.push(snapshot);
    
    // Maintain history size limit
    if (this.stateHistory.length > this.watchConfig.maxHistory!) {
      this.stateHistory = this.stateHistory.slice(-this.watchConfig.maxHistory!);
    }
  }

  // Public API Methods

  /**
   * Get current state snapshot
   */
  getCurrentSnapshot(): StateSnapshot | undefined {
    return this.currentSnapshot;
  }

  /**
   * Get state history
   */
  getStateHistory(count?: number): StateSnapshot[] {
    if (count) {
      return this.stateHistory.slice(-count);
    }
    return [...this.stateHistory];
  }

  /**
   * Get specific property value from current state
   */
  getProperty(path: string): any {
    if (!this.currentSnapshot) {
      return undefined;
    }

    const pathParts = path.split('.');
    let current: any = this.currentSnapshot;

    for (const part of pathParts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Add property watch
   */
  addPropertyWatch(watch: Omit<PropertyWatch, 'id'>): string {
    const id = `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullWatch: PropertyWatch = { ...watch, id };
    
    this.propertyWatches.set(id, fullWatch);
    this.emit('watch_added', { id, watch: fullWatch });
    
    return id;
  }

  /**
   * Remove property watch
   */
  removePropertyWatch(id: string): boolean {
    const removed = this.propertyWatches.delete(id);
    if (removed) {
      this.emit('watch_removed', { id });
    }
    return removed;
  }

  /**
   * Get all property watches
   */
  getPropertyWatches(): PropertyWatch[] {
    return Array.from(this.propertyWatches.values());
  }

  /**
   * Clear all property watches
   */
  clearPropertyWatches(): void {
    const count = this.propertyWatches.size;
    this.propertyWatches.clear();
    this.emit('watches_cleared', { count });
  }

  /**
   * Get performance trends analysis
   */
  getPerformanceTrends(timeWindow?: number): any {
    const snapshots = timeWindow ? 
      this.stateHistory.filter(s => s.timestamp > Date.now() - timeWindow) :
      this.stateHistory;

    if (snapshots.length === 0) {
      return null;
    }

    const memoryTrend = snapshots.map(s => s.performance.memoryUsage);
    const responseTimes = snapshots.flatMap(s => s.performance.responseTimeTrends);

    return {
      memory: {
        current: memoryTrend[memoryTrend.length - 1],
        min: Math.min(...memoryTrend),
        max: Math.max(...memoryTrend),
        average: memoryTrend.reduce((a, b) => a + b, 0) / memoryTrend.length,
        trend: memoryTrend
      },
      responseTime: {
        samples: responseTimes.length,
        min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        average: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0
      },
      timeWindow: {
        start: snapshots[0].timestamp,
        end: snapshots[snapshots.length - 1].timestamp,
        duration: snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp,
        samples: snapshots.length
      }
    };
  }

  /**
   * Export state data for analysis
   */
  exportStateData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        currentSnapshot: this.currentSnapshot,
        history: this.stateHistory,
        watches: Array.from(this.propertyWatches.values()),
        exportedAt: Date.now()
      }, null, 2);
    }

    if (format === 'csv') {
      // Create CSV with key metrics over time
      const headers = ['timestamp', 'health', 'memoryUsage', 'totalOperations', 'failedOperations', 'avgResponseTime'];
      const rows = this.stateHistory.map(snapshot => [
        snapshot.timestamp,
        snapshot.engine.health.overall,
        snapshot.performance.memoryUsage,
        snapshot.engine.metrics.operations?.totalOperations || 0,
        snapshot.engine.metrics.operations?.failedOperations || 0,
        snapshot.engine.health.metrics?.averageResponseTime || 0
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): any {
    return {
      isWatching: !!this.watchTimer,
      currentSnapshot: !!this.currentSnapshot,
      historySize: this.stateHistory.length,
      watchCount: this.propertyWatches.size,
      lastUpdateTime: this.lastUpdateTime,
      config: this.watchConfig
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopWatching();
    this.clearPropertyWatches();
    this.stateHistory = [];
    this.currentSnapshot = undefined;
    this.removeAllListeners();
  }
}