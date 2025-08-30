/**---
 * title: [Backend File Monitor - Pure Backend Implementation]
 * tags: [Backend, File-Monitoring, Node.js, Pure-Backend, VSCode-Independent]
 * provides: [HaruspexFileMonitor, Backend-Compatible-File-Monitoring]
 * requires: [Node.js-Runtime, fs-Module, chokidar]
 * description: [Pure backend implementation of file monitoring using Node.js chokidar instead of VSCode file system APIs]
 * ---*/

import * as fs from 'fs/promises';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';

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
  /** Root path to monitor (defaults to process.cwd()) */
  rootPath?: string;
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
  /** Whether monitoring is active */
  isMonitoring: boolean;
}

/**
 * Backend File Monitor
 * 
 * Pure backend implementation that provides file system monitoring using Node.js chokidar
 * instead of VSCode-specific file system APIs. Suitable for standalone backend services.
 */
export class BackendFileMonitor extends EventEmitter {
  private watcher?: chokidar.FSWatcher;
  private changes: FileChangeEvent[] = [];
  private startTime: number = 0;
  private isMonitoring: boolean = false;
  private changesByType: Record<FileChangeEvent['type'], number> = {
    created: 0,
    changed: 0,
    deleted: 0
  };
  private changesByExtension: Record<string, number> = {};
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private workspaceRoot: string,
    private config: FileMonitorConfig
  ) {
    super();
    this.workspaceRoot = config.rootPath || workspaceRoot || process.cwd();
    this.log(`Backend File Monitor initialized for: ${this.workspaceRoot}`, 'info');
  }

  /**
   * Start file monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      this.log('File monitoring is already active', 'warn');
      return;
    }

    try {
      this.log('Starting file monitoring...', 'info');
      this.startTime = Date.now();
      
      // Configure chokidar options
      const watchOptions: chokidar.WatchOptions = {
        recursive: this.config.recursive,
        ignored: this.config.excludePatterns || [
          '**/node_modules/**',
          '**/.git/**',
          '**/.vscode/**',
          '**/dist/**',
          '**/build/**',
          '**/.DS_Store'
        ],
        ignoreInitial: true,
        persistent: true,
        depth: this.config.recursive ? undefined : 1,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 100
        }
      };

      // Create watcher for the workspace root or specific patterns
      const watchPaths = this.config.patterns.length > 0 
        ? this.config.patterns.map(pattern => path.resolve(this.workspaceRoot, pattern))
        : [this.workspaceRoot];

      this.watcher = chokidar.watch(watchPaths, watchOptions);

      // Setup event handlers
      this.watcher
        .on('add', (filePath: string) => this.handleFileChange('created', filePath))
        .on('change', (filePath: string) => this.handleFileChange('changed', filePath))
        .on('unlink', (filePath: string) => this.handleFileChange('deleted', filePath))
        .on('error', (error: Error) => {
          this.log(`File monitor error: ${error.message}`, 'error');
          this.emit('error', error);
        })
        .on('ready', () => {
          this.isMonitoring = true;
          this.log(`File monitoring started successfully`, 'info');
          this.emit('ready');
        });

    } catch (error) {
      this.log(`Failed to start file monitoring: ${error}`, 'error');
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop file monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.log('Stopping file monitoring...', 'info');
    
    try {
      // Clear debounce timers
      this.debounceTimers.forEach((timer) => clearTimeout(timer));
      this.debounceTimers.clear();

      // Close watcher
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = undefined;
      }

      this.isMonitoring = false;
      this.log('File monitoring stopped', 'info');
      this.emit('stopped');

    } catch (error) {
      this.log(`Error stopping file monitoring: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Get monitoring metrics
   */
  getMetrics(): FileMonitorMetrics {
    const recentCount = Math.min(50, this.changes.length);
    
    return {
      totalChanges: this.changes.length,
      changesByType: { ...this.changesByType },
      changesByExtension: { ...this.changesByExtension },
      recentChanges: this.changes.slice(-recentCount),
      monitorStartTime: this.startTime,
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Get recent file changes
   */
  getRecentChanges(count: number = 50): FileChangeEvent[] {
    return this.changes.slice(-count);
  }

  /**
   * Check if a file path should be monitored
   */
  isFileMonitored(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    const monitoredExtensions = ['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.yml', '.yaml'];
    return monitoredExtensions.includes(extension);
  }

  /**
   * Clear change history
   */
  clearHistory(): void {
    this.changes = [];
    this.changesByType = { created: 0, changed: 0, deleted: 0 };
    this.changesByExtension = {};
    this.log('File change history cleared', 'info');
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.log('Disposing Backend File Monitor...', 'info');
    this.stopMonitoring().catch(error => {
      this.log(`Error during disposal: ${error}`, 'error');
    });
  }

  /**
   * Handle file change events with debouncing
   */
  private handleFileChange(type: FileChangeEvent['type'], filePath: string): void {
    // Clear existing debounce timer for this file
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.processFileChange(type, filePath);
      this.debounceTimers.delete(filePath);
    }, this.config.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Process debounced file change
   */
  private processFileChange(type: FileChangeEvent['type'], filePath: string): void {
    const extension = path.extname(filePath);
    const isMonitored = this.isFileMonitored(filePath);

    // Create change event
    const changeEvent: FileChangeEvent = {
      type,
      filePath,
      timestamp: Date.now(),
      extension,
      isMonitored
    };

    // Add to changes history
    this.changes.push(changeEvent);

    // Maintain max queue size
    if (this.changes.length > this.config.maxQueueSize) {
      this.changes = this.changes.slice(-this.config.maxQueueSize);
    }

    // Update metrics
    this.changesByType[type]++;
    this.changesByExtension[extension] = (this.changesByExtension[extension] || 0) + 1;

    // Emit event
    this.emit('fileChange', changeEvent);

    // Log if monitored file
    if (isMonitored) {
      this.log(`File ${type}: ${path.relative(this.workspaceRoot, filePath)}`, 'info');
    }
  }

  /**
   * Log internal messages
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [BackendFileMonitor]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}