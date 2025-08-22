/**---
 * title: [Haruspex Process Manager - Robust Process Lifecycle Management]
 * tags: [Core, Process-Management, Cleanup, Safety, Lifecycle]
 * provides: [ProcessTracking, SafeTermination, OrphanDetection, ResourceCleanup]
 * requires: [Node.js Process APIs, File System, VS Code Extension Context, Shared Configuration, Structured Errors]
 * description: [Comprehensive process tracking and cleanup system with safety mechanisms, unified configuration patterns, and structured error handling]
 * ---*/

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { ProcessManagerConfig, ProcessManagerConfigSchema, validateConfig, ValidationResult } from './shared-schemas';
import { 
  HaruspexError, 
  ProcessManagementError, 
  ProcessNotFoundError, 
  ProcessTerminationError, 
  ProcessOwnershipError,
  TimeoutError,
  AsyncOperationError,
  ErrorClassifier,
  ErrorAggregator,
  ErrorSeverity,
  ErrorClassification,
  RecoveryStrategy
} from './shared-errors';

export interface ProcessTracker {
  /** Process ID for tracking and termination */
  pid: number;
  /** Type classification for cleanup strategy */
  type: 'ipc-server' | 'file-watcher' | 'state-inspector' | 'child-process' | 'interval' | 'timeout';
  /** Human-readable name for logging */
  name: string;
  /** When this process/resource was created */
  startTime: number;
  /** Additional metadata for process identification */
  metadata: {
    /** Command line arguments if applicable */
    command?: string;
    /** Parent process info for ownership verification */
    parentPid?: number;
    /** Resource identifiers (port, file paths, etc.) */
    resources?: string[];
    /** VS Code session identifier */
    sessionId?: string;
    /** Timer reference for cleanup */
    timerRef?: any;
    /** Server reference for cleanup */
    serverRef?: any;
    /** Additional metadata fields */
    [key: string]: any;
  };
  /** Custom cleanup function for this resource */
  cleanupFn?: () => Promise<void>;
  /** Whether this process is critical (affects shutdown strategy) */
  critical?: boolean;
}

// Configuration interface is now imported from shared-schemas.ts

export interface ProcessCleanupResult {
  /** Number of processes successfully cleaned up */
  cleaned: number;
  /** Number of processes that failed cleanup */
  failed: number;
  /** Number of processes that were already gone */
  alreadyGone: number;
  /** Duration of cleanup operation in milliseconds */
  duration?: number;
  /** Details about each cleanup attempt */
  details: Array<{
    pid: number;
    name: string;
    success: boolean;
    error?: string;
  }>;
}

export interface OrphanDetectionResult {
  /** Number of orphaned processes found */
  orphansFound: number;
  /** Number successfully cleaned up */
  orphansCleaned: number;
  /** Processes that couldn't be cleaned */
  orphansRemaining: string[];
  /** Details about orphan cleanup */
  details: string[];
}

/**
 * Status information interface
 */
export interface ProcessManagerStatus {
  /** Whether the manager has been initialized */
  initialized: boolean;
  /** Number of currently tracked processes */
  processCount: number;
  /** Whether cleanup operations can be performed */
  canCleanup: boolean;
}

/**
 * Comprehensive status report interface
 */
export interface ProcessManagerStatusReport {
  /** Whether the manager has been initialized */
  initialized: boolean;
  /** Number of currently tracked processes */
  processCount: number;
  /** List of tracked processes */
  processes: ProcessTracker[];
  /** Error summary */
  errors: {
    total: number;
  };
  /** Configuration validation status */
  configuration: {
    valid: boolean;
  };
}

/**
 * Comprehensive process lifecycle manager for Haruspex extension
 * 
 * Features:
 * - Tracks all spawned processes and resources with PIDs
 * - Implements safe termination with ownership verification
 * - Detects and cleans up orphaned processes from crashes
 * - Provides graceful and emergency shutdown procedures
 * - Maintains persistent tracking for crash recovery
 */
export class HaruspexProcessManager extends EventEmitter {
  private trackedProcesses = new Map<number, ProcessTracker>();
  private heartbeatTimer: NodeJS.Timeout | undefined;
  private isShuttingDown = false;
  private initialized = false;
  private sessionId: string;
  private config: ProcessManagerConfig;
  private errorAggregator = new ErrorAggregator();
  private configValidation: ValidationResult<ProcessManagerConfig>;

  constructor(
    private workspaceRoot: string,
    private debugLog: (message: string, level?: 'info' | 'warning' | 'error') => void,
    config: Partial<ProcessManagerConfig> = {}
  ) {
    super();
    
    // Enhanced session ID generation for better uniqueness
    this.sessionId = this.generateSessionId();
    
    // Validate and merge configuration with comprehensive schema validation
    this.configValidation = this.validateAndMergeConfig(config);
    
    if (!this.configValidation.success) {
      const error = new (class extends HaruspexError {
        getClassification() { return ErrorClassification.CONFIGURATION; }
        getRecoveryStrategy() { return RecoveryStrategy.USER_INTERVENTION; }
      })(
        `Process Manager configuration validation failed: ${this.configValidation.errors.map(e => e.message).join(', ')}`,
        'ProcessManager',
        ErrorSeverity.ERROR,
        false,
        { validationErrors: this.configValidation.errors }
      );
      
      this.errorAggregator.add(error);
      this.debugLog(`Configuration validation failed: ${error.message}`, 'error');
      
      // Use defaults but log the issues
      this.config = this.createDefaultConfig();
    } else {
      this.config = this.configValidation.data!;
    }

    this.ensureTrackingDirectory();
  }

  /**
   * Validate and merge configuration with schema validation
   */
  private validateAndMergeConfig(config: Partial<ProcessManagerConfig>): ValidationResult<ProcessManagerConfig> {
    const defaultConfig = this.createDefaultConfig();
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      // Ensure tracking file path is properly set
      tracking: {
        ...defaultConfig.tracking,
        ...config.tracking,
        trackingFile: config.tracking?.trackingFile || path.join(this.workspaceRoot, '.haruspex', 'processes.json')
      }
    };
    
    return validateConfig(ProcessManagerConfigSchema, mergedConfig, 'ProcessManager');
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): ProcessManagerConfig {
    return {
      enableDetailedLogging: true,
      enableSafetyChecks: true,
      dryRun: false,
      gracefulTimeout: 10000,
      timing: {
        gracefulShutdownTimeout: 10000,
        heartbeatInterval: 5000,
        retryDelay: 1000,
        maxRetryAttempts: 3
      },
      safety: {
        enableOwnershipVerification: true,
        enableResourceValidation: true,
        enableBackupCreation: false,
        enableFileBackup: false,
        maxAgeThreshold: 3600000
      },
      tracking: {
        trackingFile: path.join(this.workspaceRoot, '.haruspex', 'processes.json'),
        enableHeartbeat: true,
        enablePersistentTracking: true
      },
      orphanDetection: {
        enableOrphanDetection: true,
        orphanDetectionThreshold: 30000,
        enableAutomaticCleanup: true
      },
      termination: {
        enableGracefulTermination: true,
        forceTerminationDelay: 5000,
        enableSignalEscalation: true
      }
    };
  }

  /**
   * Generate a unique session ID with better entropy
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const pid = process.pid;
    const random = Math.random().toString(36).substring(2, 15);
    const hostname = os.hostname().replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    
    return `haruspex_${timestamp}_${pid}_${hostname}_${random}`;
  }

  /**
   * Validate session ID format
   */
  private isValidSessionId(sessionId: string): boolean {
    // Session ID format: haruspex_timestamp_pid_hostname_random
    const pattern = /^haruspex_\d+_\d+_[a-zA-Z0-9]+_[a-zA-Z0-9]+$/;
    return pattern.test(sessionId);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current configuration
   */
  getConfiguration(): ProcessManagerConfig {
    return { ...this.config };
  }

  /**
   * Get configuration validation result
   */
  getConfigurationValidation(): ValidationResult<ProcessManagerConfig> {
    return this.configValidation;
  }

  /**
   * Get aggregated errors
   */
  getErrors(): import('./shared-errors').StructuredError[] {
    return this.errorAggregator.getErrors().map(error => error.toStructured());
  }

  /**
   * Get error summary
   */
  getErrorSummary(): ReturnType<ErrorAggregator['getSummary']> {
    return this.errorAggregator.getSummary();
  }

  /**
   * Clear all accumulated errors
   */
  clearErrors(): void {
    this.errorAggregator.clear();
  }

  /**
   * Get current status information
   */
  getStatus(): ProcessManagerStatus {
    return {
      initialized: this.initialized,
      processCount: this.trackedProcesses.size,
      canCleanup: !this.isShuttingDown && this.configValidation.success
    };
  }

  /**
   * Generate comprehensive status report
   */
  generateStatusReport(): ProcessManagerStatusReport {
    return {
      initialized: this.initialized,
      processCount: this.trackedProcesses.size,
      processes: Array.from(this.trackedProcesses.values()),
      errors: {
        total: this.errorAggregator.getErrors().length
      },
      configuration: {
        valid: this.configValidation.success
      }
    };
  }

  /**
   * Initialize the process manager and detect orphaned processes
   */
  async initialize(): Promise<OrphanDetectionResult> {
    this.debugLog('Initializing Haruspex Process Manager...');
    
    let orphanResult: OrphanDetectionResult = {
      orphansFound: 0,
      orphansCleaned: 0,
      orphansRemaining: [],
      details: []
    };

    try {
      // Validate configuration if not already done
      if (!this.configValidation.success) {
        throw new AsyncOperationError(
          'Cannot initialize with invalid configuration',
          'ProcessManager',
          'initialization',
          undefined,
          { configErrors: this.configValidation.errors }
        );
      }

      // Detect and clean up orphaned processes from previous sessions
      if (this.config.orphanDetection?.enableOrphanDetection) {
        orphanResult = await this.detectAndCleanupOrphans();
      }

      // Start heartbeat monitoring
      if (this.config.tracking?.enableHeartbeat) {
        this.startHeartbeat();
      }

      // Setup emergency shutdown handlers
      this.setupEmergencyHandlers();

      this.initialized = true;
      this.debugLog(`Process Manager initialized. Session: ${this.sessionId}`);
      this.emit('initialized', { sessionId: this.sessionId, orphanResult });

    } catch (error) {
      const structuredError = ErrorClassifier.createStructuredError(
        error,
        'ProcessManager',
        { operation: 'initialization', sessionId: this.sessionId }
      );
      
      this.errorAggregator.add(structuredError);
      this.debugLog(`Process Manager initialization failed: ${structuredError.message}`, 'error');
      throw structuredError;
    }

    return orphanResult;
  }

  /**
   * Track a new process or resource
   */
  trackProcess(tracker: Omit<ProcessTracker, 'startTime'>): void {
    const fullTracker: ProcessTracker = {
      ...tracker,
      startTime: Date.now(),
      metadata: {
        ...tracker.metadata,
        sessionId: this.sessionId,
        parentPid: process.pid
      }
    };

    this.trackedProcesses.set(tracker.pid, fullTracker);
    this.persistTracking();
    
    this.debugLog(`Tracking ${tracker.type}: ${tracker.name} (PID: ${tracker.pid})`);
    this.emit('process_tracked', fullTracker);
  }

  /**
   * Track a timer/interval resource (creates virtual PID)
   */
  trackTimer(timer: NodeJS.Timeout, name: string, type: 'interval' | 'timeout'): number {
    // Create a virtual PID for timers using a combination of timestamp and random
    const virtualPid = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    
    this.trackProcess({
      pid: virtualPid,
      type,
      name,
      metadata: {
        resources: ['timer'],
        timerRef: timer // Store reference for cleanup
      },
      cleanupFn: async () => {
        clearInterval(timer);
        clearTimeout(timer);
      }
    });

    return virtualPid;
  }

  /**
   * Track a server resource with port information
   */
  trackServer(server: any, name: string, port?: number, host?: string): number {
    const serverPid = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    
    this.trackProcess({
      pid: serverPid,
      type: 'ipc-server',
      name,
      metadata: {
        resources: port ? [`${host || 'localhost'}:${port}`] : ['server'],
        serverRef: server
      },
      cleanupFn: async () => {
        if (server && typeof server.close === 'function') {
          return new Promise<void>((resolve) => {
            server.close(() => resolve());
          });
        }
      }
    });

    return serverPid;
  }

  /**
   * Untrack a process (when it's cleanly disposed)
   */
  untrackProcess(pid: number): void {
    const tracker = this.trackedProcesses.get(pid);
    if (tracker) {
      this.trackedProcesses.delete(pid);
      this.persistTracking();
      this.debugLog(`Untracked ${tracker.type}: ${tracker.name} (PID: ${pid})`);
      this.emit('process_untracked', tracker);
    }
  }

  /**
   * Get all currently tracked processes
   */
  getTrackedProcesses(): ProcessTracker[] {
    return Array.from(this.trackedProcesses.values());
  }

  /**
   * Verify if a process is still running and belongs to us
   */
  async verifyProcess(pid: number): Promise<boolean> {
    if (!this.config.safety?.enableOwnershipVerification) {
      return true; // Skip verification if disabled
    }

    try {
      // For virtual PIDs (timers), check if we have the tracker
      if (pid > 1000000000) { // Virtual PID range
        return this.trackedProcesses.has(pid);
      }

      // For real PIDs, check if process exists
      process.kill(pid, 0); // Signal 0 just checks if process exists
      
      // Enhanced ownership verification
      const tracker = this.trackedProcesses.get(pid);
      if (!tracker) {
        const error = new ProcessNotFoundError(
          `PID ${pid} not in our tracking records`,
          pid,
          'unknown'
        );
        this.errorAggregator.add(error);
        this.debugLog(error.message, 'warning');
        return false;
      }

      // Verify session ownership
      if (tracker.metadata.sessionId !== this.sessionId) {
        const error = new ProcessOwnershipError(
          `PID ${pid} belongs to different session: ${tracker.metadata.sessionId}`,
          pid,
          tracker.name,
          { expectedSession: this.sessionId, actualSession: tracker.metadata.sessionId }
        );
        this.errorAggregator.add(error);
        this.debugLog(error.message, 'warning');
        return false;
      }

      // Verify parent process if available
      if (tracker.metadata.parentPid && tracker.metadata.parentPid !== process.pid) {
        const error = new ProcessOwnershipError(
          `PID ${pid} has different parent: expected ${process.pid}, got ${tracker.metadata.parentPid}`,
          pid,
          tracker.name,
          { expectedParent: process.pid, actualParent: tracker.metadata.parentPid }
        );
        this.errorAggregator.add(error);
        this.debugLog(error.message, 'warning');
        return false;
      }

      // Additional ownership verification for critical processes
      if (tracker.critical) {
        try {
          // For critical processes, perform extra verification
          if (!tracker.metadata.command && tracker.type === 'child-process') {
            const error = new ProcessOwnershipError(
              `Critical process ${pid} missing command metadata`,
              pid,
              tracker.name,
              { critical: true, missingMetadata: 'command' }
            );
            this.errorAggregator.add(error);
            this.debugLog(error.message, 'warning');
            return false;
          }
        } catch (verifyError) {
          const error = new ProcessOwnershipError(
            `Enhanced verification failed for critical PID ${pid}`,
            pid,
            tracker.name,
            { critical: true, verifyError: verifyError instanceof Error ? verifyError.message : String(verifyError) }
          );
          this.errorAggregator.add(error);
          this.debugLog(error.message, 'warning');
          return false;
        }
      }

      return true;

    } catch (error) {
      // Process doesn't exist or we don't have permission - this is normal
      return false;
    }
  }

  /**
   * Detect orphaned processes from previous sessions (now public)
   */
  async detectOrphanedProcesses(): Promise<OrphanDetectionResult> {
    return await this.detectAndCleanupOrphans();
  }

  /**
   * Clean up all tracked processes (public method)
   */
  async cleanupAllProcesses(force: boolean = false): Promise<ProcessCleanupResult> {
    if (force) {
      return await this.emergencyShutdown();
    } else {
      return await this.gracefulShutdown();
    }
  }

  /**
   * Safely terminate a tracked process with comprehensive error handling
   */
  async terminateProcess(pid: number, force = false): Promise<boolean> {
    const tracker = this.trackedProcesses.get(pid);
    if (!tracker) {
      const error = new ProcessNotFoundError(
        `Cannot terminate PID ${pid}: not tracked`,
        pid,
        'unknown'
      );
      this.errorAggregator.add(error);
      this.debugLog(error.message, 'warning');
      return false;
    }

    this.debugLog(`Terminating ${tracker.name} (PID: ${pid})${force ? ' [FORCE]' : ''}`);

    try {
      // Try custom cleanup function first
      if (tracker.cleanupFn) {
        await this.executeWithTimeout(
          tracker.cleanupFn(),
          this.config.timing?.gracefulShutdownTimeout || 10000,
          `Custom cleanup for ${tracker.name}`
        );
        this.untrackProcess(pid);
        return true;
      }

      // For virtual PIDs (timers), use metadata reference
      if (pid > 1000000000 && tracker.metadata.timerRef) {
        clearInterval(tracker.metadata.timerRef as NodeJS.Timeout);
        clearTimeout(tracker.metadata.timerRef as NodeJS.Timeout);
        this.untrackProcess(pid);
        return true;
      }

      // For servers, use server reference
      if (tracker.type === 'ipc-server' && tracker.metadata.serverRef) {
        const server = tracker.metadata.serverRef;
        if (typeof server.close === 'function') {
          await this.executeWithTimeout(
            new Promise<void>((resolve) => {
              server.close(() => resolve());
            }),
            this.config.timing?.gracefulShutdownTimeout || 10000,
            `Server close for ${tracker.name}`
          );
          this.untrackProcess(pid);
          return true;
        }
      }

      // For real processes, verify ownership before termination
      if (!(await this.verifyProcess(pid))) {
        const error = new ProcessOwnershipError(
          `Refusing to terminate PID ${pid}: ownership verification failed`,
          pid,
          tracker.name
        );
        this.errorAggregator.add(error);
        this.debugLog(error.message, 'error');
        return false;
      }

      // Attempt graceful termination first
      if (!force && this.config.termination?.enableGracefulTermination) {
        try {
          process.kill(pid, 'SIGTERM');
          
          // Wait for graceful shutdown
          const gracefulDelay = this.config.termination?.forceTerminationDelay || 5000;
          await new Promise(resolve => setTimeout(resolve, Math.min(gracefulDelay, 1000)));
          
          // Check if it's still running
          if (!(await this.verifyProcess(pid))) {
            this.untrackProcess(pid);
            return true;
          }
        } catch (signalError) {
          // Process might already be gone, continue to force termination
        }
      }

      // Force termination if necessary and enabled
      if (this.config.termination?.enableSignalEscalation) {
        try {
          process.kill(pid, 'SIGKILL');
          this.untrackProcess(pid);
          return true;
        } catch (killError) {
          // Process might already be gone
          this.untrackProcess(pid);
          return true;
        }
      }

      // If we get here, termination failed
      const error = new ProcessTerminationError(
        `Failed to terminate process after all attempts`,
        pid,
        tracker.name,
        force ? 'SIGKILL' : 'SIGTERM'
      );
      this.errorAggregator.add(error);
      this.debugLog(error.message, 'error');
      return false;

    } catch (error) {
      const structuredError = new ProcessTerminationError(
        `Termination failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        pid,
        tracker.name,
        force ? 'SIGKILL' : 'SIGTERM',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
      this.errorAggregator.add(structuredError);
      this.debugLog(structuredError.message, 'error');
      return false;
    }
  }

  /**
   * Graceful shutdown of all tracked processes
   */
  async gracefulShutdown(): Promise<ProcessCleanupResult> {
    if (this.isShuttingDown) {
      this.debugLog('Shutdown already in progress', 'warning');
      return { cleaned: 0, failed: 0, alreadyGone: 0, details: [] };
    }

    this.isShuttingDown = true;
    this.debugLog('Starting graceful shutdown of all tracked processes...');

    const result: ProcessCleanupResult = {
      cleaned: 0,
      failed: 0,
      alreadyGone: 0,
      details: []
    };

    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    // Sort processes by criticality (non-critical first)
    const processes = Array.from(this.trackedProcesses.values())
      .sort((a, b) => (a.critical ? 1 : 0) - (b.critical ? 1 : 0));

    // Clean up each process
    for (const tracker of processes) {
      try {
        const success = await this.terminateProcess(tracker.pid, false);
        
        if (success) {
          result.cleaned++;
          result.details.push({
            pid: tracker.pid,
            name: tracker.name,
            success: true
          });
        } else {
          result.failed++;
          result.details.push({
            pid: tracker.pid,
            name: tracker.name,
            success: false,
            error: 'Termination failed'
          });
        }

      } catch (error) {
        result.failed++;
        result.details.push({
          pid: tracker.pid,
          name: tracker.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Clean up tracking file if all processes are cleaned
    if (result.failed === 0) {
      this.cleanupTrackingFile();
    }

    this.debugLog(`Graceful shutdown complete: ${result.cleaned} cleaned, ${result.failed} failed`);
    this.emit('shutdown_complete', result);

    return result;
  }

  /**
   * Emergency shutdown with force termination
   */
  async emergencyShutdown(): Promise<ProcessCleanupResult> {
    this.debugLog('EMERGENCY SHUTDOWN: Force terminating all processes', 'warning');
    
    const processes = Array.from(this.trackedProcesses.values());
    const result: ProcessCleanupResult = {
      cleaned: 0,
      failed: 0,
      alreadyGone: 0,
      details: []
    };

    // Force terminate everything immediately
    const terminationPromises = processes.map(async (tracker) => {
      try {
        const success = await this.terminateProcess(tracker.pid, true);
        return {
          pid: tracker.pid,
          name: tracker.name,
          success
        };
      } catch (error) {
        return {
          pid: tracker.pid,
          name: tracker.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.allSettled(terminationPromises);
    
    for (const resultPromise of results) {
      if (resultPromise.status === 'fulfilled') {
        const detail = resultPromise.value;
        if (detail.success) {
          result.cleaned++;
        } else {
          result.failed++;
        }
        result.details.push(detail);
      } else {
        result.failed++;
        result.details.push({
          pid: 0,
          name: 'unknown',
          success: false,
          error: resultPromise.reason
        });
      }
    }

    // Force cleanup tracking file
    this.cleanupTrackingFile();

    this.debugLog(`Emergency shutdown complete: ${result.cleaned} cleaned, ${result.failed} failed`);
    return result;
  }

  /**
   * Detect and cleanup orphaned processes from previous sessions
   */
  private async detectAndCleanupOrphans(): Promise<OrphanDetectionResult> {
    const result: OrphanDetectionResult = {
      orphansFound: 0,
      orphansCleaned: 0,
      orphansRemaining: [],
      details: []
    };

    try {
      const trackingFile = this.config.tracking?.trackingFile;
      if (!trackingFile || !fs.existsSync(trackingFile)) {
        result.details.push('No previous tracking file found');
        return result;
      }

      const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
      const now = Date.now();
      const orphanThreshold = this.config.orphanDetection?.orphanDetectionThreshold || 30000;
      
      for (const tracker of trackingData.processes || []) {
        try {
          // Skip if it's from current session
          if (tracker.metadata?.sessionId === this.sessionId) {
            continue;
          }

          // Validate session ID format for additional safety
          if (tracker.metadata?.sessionId && !this.isValidSessionId(tracker.metadata.sessionId)) {
            this.debugLog(`Invalid session ID format detected: ${tracker.metadata.sessionId}`, 'warning');
            continue;
          }

          // Check if process is old enough to be considered orphaned
          const age = now - (tracker.startTime || 0);
          if (age < orphanThreshold) {
            continue;
          }

          result.orphansFound++;
          
          // Try to clean up the orphan if automatic cleanup is enabled
          if (this.config.orphanDetection?.enableAutomaticCleanup) {
            const stillExists = await this.verifyProcess(tracker.pid);
            if (stillExists) {
              try {
                // For real PIDs, send SIGTERM (safer than SIGKILL)
                if (tracker.pid < 1000000000) {
                  process.kill(tracker.pid, 'SIGTERM');
                }
                result.orphansCleaned++;
                result.details.push(`Cleaned orphaned ${tracker.name} (PID: ${tracker.pid})`);
              } catch (error) {
                const cleanupError = ErrorClassifier.createStructuredError(
                  error,
                  'ProcessManager',
                  { operation: 'orphan_cleanup', pid: tracker.pid, name: tracker.name }
                );
                this.errorAggregator.add(cleanupError);
                result.orphansRemaining.push(`${tracker.name} (PID: ${tracker.pid})`);
                result.details.push(`Failed to clean ${tracker.name}: ${cleanupError.message}`);
              }
            } else {
              result.details.push(`Orphaned ${tracker.name} (PID: ${tracker.pid}) already gone`);
            }
          } else {
            result.details.push(`Orphan detected but cleanup disabled: ${tracker.name} (PID: ${tracker.pid})`);
          }
          
        } catch (error) {
          const processingError = ErrorClassifier.createStructuredError(
            error,
            'ProcessManager',
            { operation: 'orphan_processing', tracker }
          );
          this.errorAggregator.add(processingError);
          result.details.push(`Error processing orphan: ${processingError.message}`);
        }
      }

      this.debugLog(`Orphan detection: ${result.orphansFound} found, ${result.orphansCleaned} cleaned`);

    } catch (error) {
      const detectionError = ErrorClassifier.createStructuredError(
        error,
        'ProcessManager',
        { operation: 'orphan_detection' }
      );
      this.errorAggregator.add(detectionError);
      result.details.push(`Orphan detection failed: ${detectionError.message}`);
      this.debugLog(`Orphan detection failed: ${detectionError.message}`, 'error');
    }

    return result;
  }

  /**
   * Setup emergency shutdown handlers for ungraceful termination
   */
  private setupEmergencyHandlers(): void {
    const emergencyHandler = async (signal: string) => {
      this.debugLog(`Received ${signal}, starting emergency shutdown...`, 'warning');
      try {
        await this.emergencyShutdown();
      } catch (error) {
        this.debugLog(`Emergency shutdown failed: ${error}`, 'error');
      }
      process.exit(1);
    };

    // Handle various termination signals
    process.once('SIGTERM', () => emergencyHandler('SIGTERM'));
    process.once('SIGINT', () => emergencyHandler('SIGINT'));
    process.once('SIGHUP', () => emergencyHandler('SIGHUP'));
    
    // Handle uncaught exceptions
    process.once('uncaughtException', (error) => {
      this.debugLog(`Uncaught exception: ${error.message}`, 'error');
      emergencyHandler('uncaughtException');
    });

    process.once('unhandledRejection', (reason) => {
      this.debugLog(`Unhandled rejection: ${reason}`, 'error');
      emergencyHandler('unhandledRejection');
    });
  }

  /**
   * Execute operation with timeout protection
   */
  private async executeWithTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new TimeoutError(
          `Operation '${operationName}' timed out after ${timeoutMs}ms`,
          'ProcessManager',
          timeoutMs,
          operationName
        );
        this.errorAggregator.add(error);
        reject(error);
      }, timeoutMs);

      operation
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Start heartbeat monitoring for process health
   */
  private startHeartbeat(): void {
    const heartbeatInterval = this.config.timing?.heartbeatInterval || 5000;
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isShuttingDown) return;
      
      try {
        this.emit('heartbeat', {
          sessionId: this.sessionId,
          processCount: this.trackedProcesses.size,
          timestamp: Date.now(),
          errors: this.errorAggregator.getSummary()
        });
      } catch (error) {
        const structuredError = ErrorClassifier.createStructuredError(
          error,
          'ProcessManager',
          { operation: 'heartbeat' }
        );
        this.errorAggregator.add(structuredError);
        this.debugLog(`Heartbeat error: ${structuredError.message}`, 'warning');
      }
    }, heartbeatInterval);

    // Track the heartbeat timer itself
    this.trackTimer(this.heartbeatTimer, 'heartbeat-monitor', 'interval');
  }

  /**
   * Ensure the tracking directory exists
   */
  private ensureTrackingDirectory(): void {
    const trackingFile = this.config.tracking?.trackingFile;
    if (!trackingFile) {
      return;
    }
    
    const trackingDir = path.dirname(trackingFile);
    if (!fs.existsSync(trackingDir)) {
      fs.mkdirSync(trackingDir, { recursive: true });
    }
  }

  /**
   * Persist current tracking state to file with error handling
   */
  private persistTracking(): void {
    try {
      if (!this.config.tracking?.enablePersistentTracking) {
        return; // Persistent tracking disabled
      }

      const trackingFile = this.config.tracking?.trackingFile;
      if (!trackingFile) {
        throw new Error('Tracking file path not configured');
      }

      const trackingData = {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        processCount: this.trackedProcesses.size,
        processes: Array.from(this.trackedProcesses.values()).map(tracker => ({
          ...tracker,
          // Don't serialize function references
          cleanupFn: undefined,
          metadata: {
            ...tracker.metadata,
            // Don't serialize object references
            timerRef: undefined,
            serverRef: undefined
          }
        }))
      };

      fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
    } catch (error) {
      const persistError = ErrorClassifier.createStructuredError(
        error,
        'ProcessManager',
        { operation: 'persist_tracking' }
      );
      this.errorAggregator.add(persistError);
      this.debugLog(`Failed to persist tracking data: ${persistError.message}`, 'error');
    }
  }

  /**
   * Clean up the tracking file
   */
  private cleanupTrackingFile(): void {
    try {
      const trackingFile = this.config.tracking?.trackingFile;
      if (trackingFile && fs.existsSync(trackingFile)) {
        fs.unlinkSync(trackingFile);
        this.debugLog('Tracking file cleaned up');
      }
    } catch (error) {
      this.debugLog(`Failed to cleanup tracking file: ${error}`, 'warning');
    }
  }

  /**
   * Dispose of the process manager
   */
  async dispose(): Promise<ProcessCleanupResult> {
    this.debugLog('Disposing Haruspex Process Manager...');
    
    const result = await this.gracefulShutdown();
    
    // Remove all listeners
    this.removeAllListeners();
    
    return result;
  }
}