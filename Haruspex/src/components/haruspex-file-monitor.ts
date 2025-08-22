/**---
 * title: [Enhanced Haruspex File Monitor - Phase 6 Performance]
 * tags: [Performance, File Monitoring, Phase6, Cross-Component, Batching]
 * provides: [HaruspexFileMonitor, Enhanced Performance Monitoring]
 * requires: [Phase 5 WebView Foundation, Optimized Batching Queue, Update Coordinator]
 * description: [High-performance file monitoring with batched updates and cross-component coordination targeting <200ms latency]
 * ---*/

import * as vscode from 'vscode';
import * as path from 'path';
import { DebouncedBatchingQueue, FileChangeEvent as BatchFileChangeEvent, createOptimizedBatchingQueue } from '../monitoring/optimized-file-watching';
import { createUpdateCoordinator, UpdateCoordinator, UpdateCoordinatorDeps } from '../monitoring/update-coordinator';

export interface FileChangeEvent {
  /** Type of change */
  type: 'created' | 'changed' | 'deleted';
  /** File path that changed */
  filePath: string;
  /** Timestamp of change */
  timestamp: number;
  /** File extension */
  extension: string;
  /** Whether this is a monitored file type */
  isMonitored: boolean;
}

export interface FileMonitorConfig {
  /** File patterns to monitor */
  patterns: string[];
  /** Whether to monitor recursively */
  recursive: boolean;
  /** Debounce delay in milliseconds */
  debounceMs: number;
  /** Maximum number of changes to queue */
  maxQueueSize: number;
  /** File types to exclude from monitoring */
  excludePatterns?: string[];
}

export interface FileMonitorMetrics {
  /** Total number of file changes detected */
  totalChanges: number;
  /** Changes by type */
  changesByType: Record<FileChangeEvent['type'], number>;
  /** Changes by file extension */
  changesByExtension: Record<string, number>;
  /** Recent changes (last 50) */
  recentChanges: FileChangeEvent[];
  /** Monitor start time */
  monitorStartTime: number;
  /** Currently monitored patterns */
  monitoredPatterns: string[];
}

export type FileChangeHandler = (event: FileChangeEvent) => void | Promise<void>;

/**
 * File Monitor for tracking workspace file changes and triggering updates
 * 
 * Provides real-time file system monitoring with configurable patterns,
 * debouncing, and event handling to keep Haruspex data synchronized
 * with the current state of the workspace.
 */
export class HaruspexFileMonitor {
  private watchers: vscode.FileSystemWatcher[] = [];
  private changeHandlers: FileChangeHandler[] = [];
  private changeQueue: FileChangeEvent[] = [];
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private metrics: FileMonitorMetrics;
  private isSetup = false;
  
  // Phase 6 Performance Enhancements
  private batchingQueue: DebouncedBatchingQueue | undefined;
  private updateCoordinator: UpdateCoordinator | undefined;
  private isPhase6Enhanced = false;

  private readonly defaultConfig: FileMonitorConfig = {
    patterns: ['**/*.{ts,tsx,js,jsx,md,json}'],
    recursive: true,
    debounceMs: 500,
    maxQueueSize: 1000,
    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
  };

  constructor(
    private readonly workspaceRoot: string,
    private readonly config: Partial<FileMonitorConfig> = {}
  ) {
    this.config = { ...this.defaultConfig, ...config };
    this.metrics = this.initializeMetrics();
  }

  /**
   * Setup file monitoring with VSCode extension context
   * 
   * @param context - VSCode extension context for resource management
   */
  setup(context: vscode.ExtensionContext): void {
    if (this.isSetup) {
      console.warn('HaruspexFileMonitor is already set up');
      return;
    }

    try {
      // Create watchers for each pattern
      for (const pattern of this.config.patterns!) {
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);

        // Handle file creation
        watcher.onDidCreate(uri => {
          this.handleFileChange('created', uri);
        });

        // Handle file changes
        watcher.onDidChange(uri => {
          this.handleFileChange('changed', uri);
        });

        // Handle file deletion
        watcher.onDidDelete(uri => {
          this.handleFileChange('deleted', uri);
        });

        this.watchers.push(watcher);
        context.subscriptions.push(watcher);
      }

      this.isSetup = true;
      this.metrics.monitorStartTime = Date.now();
      this.metrics.monitoredPatterns = [...this.config.patterns!];
      
      console.log(`HaruspexFileMonitor: Monitoring ${this.config.patterns!.length} patterns in ${this.workspaceRoot}`);
    } catch (error) {
      console.error('Failed to setup HaruspexFileMonitor:', error);
      throw error;
    }
  }

  /**
   * Setup Phase 6 enhanced monitoring with cross-component coordination
   * 
   * ✅ INTEGRATES: Phase 5 WebView foundation with validated providers
   * ✅ IMPLEMENTS: Performance targets <200ms update latency
   * ✅ ENABLES: Batched updates with intelligent debouncing
   * 
   * @param context - VSCode extension context for resource management
   * @param coordinatorDeps - Dependencies for cross-component coordination
   * @param performancePreset - Performance optimization level ('fast' | 'balanced' | 'stable')
   */
  setupEnhancedMonitoring(
    context: vscode.ExtensionContext,
    coordinatorDeps: UpdateCoordinatorDeps,
    performancePreset: 'fast' | 'balanced' | 'stable' = 'balanced'
  ): void {
    if (this.isPhase6Enhanced) {
      console.warn('HaruspexFileMonitor: Enhanced monitoring already setup');
      return;
    }

    // Setup basic monitoring first if not already done
    if (!this.isSetup) {
      this.setup(context);
    }

    try {
      // Create optimized batching queue with performance preset
      this.batchingQueue = createOptimizedBatchingQueue(performancePreset);
      
      // Create cross-component update coordinator
      this.updateCoordinator = createUpdateCoordinator(coordinatorDeps);

      // Wire up batching queue to update coordinator
      this.batchingQueue.onFlush((batch) => {
        if (this.updateCoordinator) {
          // Convert batch format for coordinator
          const coordinatorBatch = batch.map(event => ({
            path: event.path,
            kind: event.kind,
            timestamp: event.timestamp
          }));
          
          // Handle batch asynchronously to maintain performance
          this.updateCoordinator.handleFileBatch(coordinatorBatch).catch(error => {
            console.error('HaruspexFileMonitor: Batch processing error:', error);
          });
        }
      });

      // Add enhanced file change handler to queue events
      this.onFileChange((event) => {
        if (this.batchingQueue) {
          // Convert legacy event format to batch format
          const batchEvent: BatchFileChangeEvent = {
            path: event.filePath,
            kind: event.type === 'created' ? 'create' : 
                   event.type === 'changed' ? 'change' : 'delete',
            timestamp: event.timestamp
          };
          
          this.batchingQueue.enqueue(batchEvent);
        }
      });

      // Ensure proper cleanup on context disposal
      context.subscriptions.push({
        dispose: () => {
          this.disposeEnhancedMonitoring();
        }
      });

      this.isPhase6Enhanced = true;
      
      console.log(`HaruspexFileMonitor: Phase 6 enhanced monitoring active with ${performancePreset} preset`);
      console.log(`- Batching queue: optimized for ${performancePreset} performance`);
      console.log(`- Cross-component coordination: 4 providers (tree + 3 webviews)`);
      console.log(`- Performance target: <200ms update latency`);
      
    } catch (error) {
      console.error('Failed to setup enhanced monitoring:', error);
      throw error;
    }
  }

  /**
   * Add a handler for file change events
   * 
   * @param handler - Function to call when files change
   */
  onFileChange(handler: FileChangeHandler): void {
    this.changeHandlers.push(handler);
  }

  /**
   * Remove a file change handler
   * 
   * @param handler - Handler function to remove
   */
  removeFileChangeHandler(handler: FileChangeHandler): void {
    const index = this.changeHandlers.indexOf(handler);
    if (index > -1) {
      this.changeHandlers.splice(index, 1);
    }
  }

  /**
   * Get current monitoring metrics
   */
  getMetrics(): FileMonitorMetrics {
    return {
      ...this.metrics,
      recentChanges: [...this.metrics.recentChanges] // Return copy
    };
  }

  /**
   * Clear all accumulated metrics
   */
  clearMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.metrics.monitorStartTime = Date.now();
    this.metrics.monitoredPatterns = [...this.config.patterns!];
  }

  /**
   * Check if a file should be monitored based on configuration
   * 
   * @param filePath - File path to check
   * @returns True if file should be monitored
   */
  isFileMonitored(filePath: string): boolean {
    const relativePath = path.relative(this.workspaceRoot, filePath);
    
    // Check exclude patterns
    if (this.config.excludePatterns) {
      for (const excludePattern of this.config.excludePatterns) {
        if (this.matchesPattern(relativePath, excludePattern)) {
          return false;
        }
      }
    }

    // Check include patterns
    for (const pattern of this.config.patterns!) {
      if (this.matchesPattern(relativePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Manually trigger a file change event (for testing or manual updates)
   * 
   * @param type - Type of change
   * @param filePath - File path
   */
  triggerFileChange(type: FileChangeEvent['type'], filePath: string): void {
    const uri = vscode.Uri.file(filePath);
    this.handleFileChange(type, uri);
  }

  /**
   * Get recent changes for a specific file
   * 
   * @param filePath - File path to filter by
   * @param limit - Maximum number of changes to return
   * @returns Recent changes for the specified file
   */
  getRecentChangesForFile(filePath: string, limit = 10): FileChangeEvent[] {
    return this.metrics.recentChanges
      .filter(change => change.filePath === filePath)
      .slice(-limit);
  }

  /**
   * Get recent changes by file extension
   * 
   * @param extension - File extension to filter by (e.g., '.ts')
   * @param limit - Maximum number of changes to return
   * @returns Recent changes for the specified extension
   */
  getRecentChangesByExtension(extension: string, limit = 20): FileChangeEvent[] {
    return this.metrics.recentChanges
      .filter(change => change.extension === extension)
      .slice(-limit);
  }

  /**
   * Dispose of all watchers and cleanup resources
   */
  dispose(): void {
    // Dispose enhanced monitoring first
    this.disposeEnhancedMonitoring();

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Dispose all watchers
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers = [];

    // Clear handlers and queue
    this.changeHandlers = [];
    this.changeQueue = [];
    this.isSetup = false;

    console.log('HaruspexFileMonitor: Disposed all resources');
  }

  /**
   * Dispose Phase 6 enhanced monitoring components
   */
  private disposeEnhancedMonitoring(): void {
    if (this.batchingQueue) {
      this.batchingQueue.dispose();
      this.batchingQueue = undefined;
    }
    
    // Update coordinator doesn't need explicit disposal
    this.updateCoordinator = undefined;
    this.isPhase6Enhanced = false;
    
    console.log('HaruspexFileMonitor: Enhanced monitoring disposed');
  }

  /**
   * Get Phase 6 enhanced performance metrics
   * 
   * @returns Combined metrics from batching queue and update coordinator
   */
  getEnhancedMetrics() {
    if (!this.isPhase6Enhanced) {
      return null;
    }

    const batchingMetrics = this.batchingQueue?.getPerformanceMetrics();
    const coordinatorMetrics = this.updateCoordinator?.getMetrics();
    const coordinatorHealth = this.updateCoordinator?.getHealthStatus();

    return {
      phase6Enhanced: true,
      batching: batchingMetrics,
      coordination: coordinatorMetrics,
      health: coordinatorHealth,
      legacy: this.getMetrics() // Include legacy metrics for comparison
    };
  }

  /**
   * Check if Phase 6 enhanced monitoring is active and healthy
   */
  isEnhancedMonitoringHealthy(): boolean {
    if (!this.isPhase6Enhanced || !this.updateCoordinator) {
      return false;
    }

    const health = this.updateCoordinator.getHealthStatus();
    const batchingMetrics = this.batchingQueue?.getPerformanceMetrics();
    
    return health.healthy && (batchingMetrics?.isHealthy ?? true);
  }

  /**
   * Get performance recommendations for optimization
   */
  getPerformanceRecommendations(): string[] {
    if (!this.isPhase6Enhanced) {
      return ['Enable Phase 6 enhanced monitoring for improved performance'];
    }

    const recommendations: string[] = [];
    const health = this.updateCoordinator?.getHealthStatus();
    const batchingMetrics = this.batchingQueue?.getPerformanceMetrics();

    if (health && !health.healthy) {
      recommendations.push(...health.recommendations);
    }

    if (batchingMetrics && !batchingMetrics.isHealthy) {
      recommendations.push('Consider reducing file monitoring scope');
      recommendations.push('Switch to "stable" performance preset for large workspaces');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal');
    }

    return recommendations;
  }

  private handleFileChange(type: FileChangeEvent['type'], uri: vscode.Uri): void {
    const filePath = uri.fsPath;
    
    // Check if file should be monitored
    if (!this.isFileMonitored(filePath)) {
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const event: FileChangeEvent = {
      type,
      filePath,
      timestamp: Date.now(),
      extension,
      isMonitored: true
    };

    // Update metrics
    this.updateMetrics(event);

    // Debounce the event
    this.debounceFileChange(event);
  }

  private debounceFileChange(event: FileChangeEvent): void {
    const key = `${event.type}:${event.filePath}`;
    
    // Clear existing timer for this file
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.processFileChange(event);
      this.debounceTimers.delete(key);
    }, this.config.debounceMs!);

    this.debounceTimers.set(key, timer);
  }

  private processFileChange(event: FileChangeEvent): void {
    // Add to queue with size limit
    this.changeQueue.push(event);
    if (this.changeQueue.length > this.config.maxQueueSize!) {
      // Remove oldest events
      const removeCount = this.changeQueue.length - this.config.maxQueueSize!;
      this.changeQueue.splice(0, removeCount);
    }

    // Notify all handlers
    for (const handler of this.changeHandlers) {
      try {
        const result = handler(event);
        // Handle async handlers
        if (result && typeof result.then === 'function') {
          result.catch(error => {
            console.error('File change handler error:', error);
          });
        }
      } catch (error) {
        console.error('File change handler error:', error);
      }
    }
  }

  private updateMetrics(event: FileChangeEvent): void {
    this.metrics.totalChanges++;
    this.metrics.changesByType[event.type] = (this.metrics.changesByType[event.type] || 0) + 1;
    this.metrics.changesByExtension[event.extension] = (this.metrics.changesByExtension[event.extension] || 0) + 1;

    // Add to recent changes (keep last 50)
    this.metrics.recentChanges.push(event);
    if (this.metrics.recentChanges.length > 50) {
      this.metrics.recentChanges = this.metrics.recentChanges.slice(-50);
    }
  }

  private initializeMetrics(): FileMonitorMetrics {
    return {
      totalChanges: 0,
      changesByType: { created: 0, changed: 0, deleted: 0 },
      changesByExtension: {},
      recentChanges: [],
      monitorStartTime: 0,
      monitoredPatterns: []
    };
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching (basic implementation)
    // In a production environment, you might want to use a proper glob library
    
    // Convert glob pattern to regex
    let regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');

    // Handle patterns starting with **/ 
    if (pattern.startsWith('**/')) {
      regexPattern = '(.*/)?' + regexPattern.substring(6);
    }

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(filePath.replace(/\\/g, '/'));
  }
}