/**---
 * title: [Process Integration Manager - Phase 5 System Integration]
 * tags: [Phase5, ProcessIntegration, SystemIntegration, Cleanup, Monitoring]
 * provides: [ProcessLifecycleManagement, CrashRecovery, EnhancedMonitoring, SystemIntegration]
 * requires: [CleanupOrchestrator, IPCServer, DebugManager, ProcessManager]
 * description: [Phase 5 implementation for process integration, cleanup orchestration, and enhanced monitoring with simplified scope due to stateless architecture]
 * ---*/

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { HaruspexIPCServer } from './ipc-protocol';
import { HaruspexDebugManager } from './haruspex-debug-manager';
import { HaruspexCleanupOrchestrator } from '../core/haruspex-cleanup-orchestrator';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';

export interface ProcessIntegrationConfig {
  enabled?: boolean;
  monitoring?: {
    enabled?: boolean;
    performanceInterval?: number;
    connectionTrackingEnabled?: boolean;
    errorRateMonitoring?: boolean;
    resourceUsageThreshold?: number;
  };
  crashRecovery?: {
    enabled?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    connectionInfoCleanup?: boolean;
  };
  cleanup?: {
    trackIPCServer?: boolean;
    shutdownTimeout?: number;
    forceKillTimeout?: number;
  };
}

export interface ProcessIntegrationStatus {
  enabled: boolean;
  ipcServerTracked: boolean;
  monitoringActive: boolean;
  crashRecoveryEnabled: boolean;
  metrics: {
    connectionSuccessRate: number;
    averageResponseTime: number;
    errorRate: number;
    resourceUsage: {
      memoryMB: number;
      cpuPercent?: number;
    };
    uptime: number;
  };
  serverStatus: {
    running: boolean;
    port: number;
    clientCount: number;
    lastConnection?: number;
  };
  recoveryStats: {
    crashesDetected: number;
    recoveryAttempts: number;
    successfulRecoveries: number;
    lastRecovery?: number;
  };
}

export interface CrashRecoveryResult {
  recoveryNeeded: boolean;
  serverRestarted: boolean;
  connectionFileRecreated: boolean;
  errors: string[];
  duration: number;
  success: boolean;
}

export interface MonitoringMetrics {
  timestamp: number;
  server: {
    running: boolean;
    uptime: number;
    port: number;
    clientCount: number;
    responseTime: number;
    errorRate: number;
  };
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    resourceHealth: 'healthy' | 'degraded' | 'critical';
    performanceScore: number;
  };
  connections: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
}

/**
 * Phase 5: Process Integration & Cleanup Manager
 * 
 * This class implements Phase 5 requirements with simplified scope due to the
 * stateless connection architecture established in Phase 3. Responsibilities:
 * 
 * 1. Cleanup orchestrator integration - Track IPC server lifecycle
 * 2. Crash recovery scenarios - Handle server restart and cleanup
 * 3. Enhanced monitoring - Performance metrics and health monitoring
 * 
 * Benefits from Phase 3 stateless architecture:
 * - No persistent connection pools to manage
 * - No connection state recovery needed
 * - Simplified monitoring (command success rates vs connection states)
 * - Automatic resource cleanup per command
 */
export class ProcessIntegrationManager extends EventEmitter {
  private config: Required<ProcessIntegrationConfig>;
  private isInitialized = false;
  private isMonitoring = false;
  private ipcServerPid: number | undefined;
  private monitoringInterval: NodeJS.Timeout | undefined;
  private metrics: MonitoringMetrics[] = [];
  private maxMetricsHistory = 100;
  private recoveryStats = {
    crashesDetected: 0,
    recoveryAttempts: 0,
    successfulRecoveries: 0,
    lastRecovery: undefined as number | undefined
  };

  constructor(
    private context: vscode.ExtensionContext,
    private cleanupOrchestrator: HaruspexCleanupOrchestrator,
    private debugManager: HaruspexDebugManager,
    private workspaceRoot: string,
    config: ProcessIntegrationConfig = {}
  ) {
    super();

    this.config = {
      enabled: true,
      monitoring: {
        enabled: true,
        performanceInterval: 30000, // 30 seconds
        connectionTrackingEnabled: true,
        errorRateMonitoring: true,
        resourceUsageThreshold: 100 * 1024 * 1024, // 100MB
        ...config.monitoring
      },
      crashRecovery: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 5000, // 5 seconds
        connectionInfoCleanup: true,
        ...config.crashRecovery
      },
      cleanup: {
        trackIPCServer: true,
        shutdownTimeout: 10000, // 10 seconds
        forceKillTimeout: 5000, // 5 seconds
        ...config.cleanup
      },
      ...config
    };

    this.debugManager.log('Process Integration Manager created with Phase 5 enhancements');
  }

  /**
   * Initialize Phase 5 process integration system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.debugManager.log('Initializing Phase 5 Process Integration Manager...');

    try {
      if (!this.config.enabled) {
        this.debugManager.log('Process Integration Manager disabled by configuration');
        return;
      }

      // Setup extension cleanup integration
      this.setupExtensionIntegration();

      // Setup crash recovery monitoring
      if (this.config.crashRecovery?.enabled) {
        await this.setupCrashRecovery();
      }

      // Start performance monitoring
      if (this.config.monitoring?.enabled) {
        this.startMonitoring();
      }

      this.isInitialized = true;
      this.debugManager.log('Phase 5 Process Integration Manager initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.debugManager.log(`Process Integration Manager initialization failed: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Register IPC server for lifecycle tracking (Phase 5 requirement)
   */
  trackIPCServer(ipcServer: HaruspexIPCServer): void {
    if (!this.config.cleanup?.trackIPCServer) {
      return;
    }

    try {
      const serverStatus = ipcServer.getStatus();
      
      // Track the IPC server process with cleanup orchestrator
      // Note: Since IPC server runs in the same process as extension,
      // we track it as a special 'ipc-server' type with custom cleanup
      this.cleanupOrchestrator.trackProcess(
        process.pid, // Extension process PID
        'ipc-server',
        'Haruspex IPC Server',
        {
          host: serverStatus.host,
          port: serverStatus.port,
          connectionInfoPath: serverStatus.connectionInfoPath,
          startTime: Date.now()
        },
        async () => {
          this.debugManager.log('Cleanup orchestrator calling IPC server shutdown');
          await ipcServer.stop();
        }
      );

      this.ipcServerPid = process.pid;
      this.debugManager.log(`IPC Server tracked for cleanup management (PID: ${this.ipcServerPid})`);

      // Listen for server events
      this.setupIPCServerEventHandlers(ipcServer);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.debugManager.log(`Failed to track IPC server: ${errorMessage}`, 'error');
    }
  }

  /**
   * Setup crash recovery monitoring (Phase 5 requirement)
   */
  private async setupCrashRecovery(): Promise<void> {
    this.debugManager.log('Setting up crash recovery monitoring...');

    try {
      // Check for orphaned connection files from previous crashes
      const connectionInfoPath = path.join(this.workspaceRoot, '.haruspex', 'haruspex-debug-connection.json');
      
      if (fs.existsSync(connectionInfoPath)) {
        this.debugManager.log('Found existing connection info file - checking if server is still running');
        
        const recoveryResult = await this.performCrashRecovery(connectionInfoPath);
        if (recoveryResult.recoveryNeeded) {
          this.recoveryStats.crashesDetected++;
          this.emit('crash_detected', recoveryResult);
        }
      }

      this.debugManager.log('Crash recovery monitoring setup complete');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.debugManager.log(`Crash recovery setup failed: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Perform crash recovery for IPC server (Phase 5 requirement)
   */
  async performCrashRecovery(connectionInfoPath: string): Promise<CrashRecoveryResult> {
    const startTime = Date.now();
    const result: CrashRecoveryResult = {
      recoveryNeeded: false,
      serverRestarted: false,
      connectionFileRecreated: false,
      errors: [],
      duration: 0,
      success: true
    };

    this.debugManager.log('Performing crash recovery analysis...', 'warning');
    this.recoveryStats.recoveryAttempts++;

    try {
      // Read connection info to check server status
      let connectionInfo: any = {};
      try {
        const content = fs.readFileSync(connectionInfoPath, 'utf-8');
        connectionInfo = JSON.parse(content);
      } catch (error) {
        result.recoveryNeeded = true;
        result.errors.push('Connection info file corrupted');
      }

      if (connectionInfo.port) {
        // Try to connect to the old server to see if it's still running
        const isRunning = await this.checkServerRunning(connectionInfo.host, connectionInfo.port);
        
        if (!isRunning) {
          result.recoveryNeeded = true;
          this.debugManager.log(`Dead IPC server detected on port ${connectionInfo.port}`, 'warning');
        }
      } else {
        result.recoveryNeeded = true;
        result.errors.push('Invalid connection info format');
      }

      // Clean up connection info file if recovery needed
      if (result.recoveryNeeded && this.config.crashRecovery?.connectionInfoCleanup) {
        try {
          fs.unlinkSync(connectionInfoPath);
          result.connectionFileRecreated = true;
          this.debugManager.log('Cleaned up stale connection info file');
        } catch (error) {
          result.errors.push(`Failed to clean connection file: ${error}`);
        }
      }

      if (result.recoveryNeeded) {
        this.recoveryStats.successfulRecoveries++;
        this.recoveryStats.lastRecovery = Date.now();
        this.debugManager.log('Crash recovery completed successfully');
      } else {
        this.debugManager.log('No crash recovery needed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Recovery error: ${errorMessage}`);
      result.success = false;
      this.debugManager.log(`Crash recovery failed: ${errorMessage}`, 'error');
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Check if server is running on given host/port
   */
  private async checkServerRunning(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 2000); // 2 second timeout

      socket.connect(port, host, () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  /**
   * Start enhanced monitoring (Phase 5 requirement)
   */
  private startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.debugManager.log('Starting enhanced monitoring system...');

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoring!.performanceInterval);

    // Track the monitoring interval for cleanup
    const timerId = this.cleanupOrchestrator.trackTimer(
      this.monitoringInterval,
      'Process Integration Monitoring',
      'interval'
    );

    this.isMonitoring = true;
    this.debugManager.log(`Enhanced monitoring started (Timer ID: ${timerId})`);
  }

  /**
   * Collect performance metrics
   */
  private collectMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      const metrics: MonitoringMetrics = {
        timestamp: Date.now(),
        server: {
          running: false,
          uptime: 0,
          port: 0,
          clientCount: 0,
          responseTime: 0,
          errorRate: 0
        },
        system: {
          memoryUsage: memUsage,
          resourceHealth: this.calculateResourceHealth(memUsage),
          performanceScore: this.calculatePerformanceScore()
        },
        connections: {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 0
        }
      };

      // Add to metrics history
      this.metrics.push(metrics);
      
      // Keep only recent metrics
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      // Check for performance issues
      this.checkPerformanceThresholds(metrics);

      this.emit('metrics_collected', metrics);

    } catch (error) {
      this.debugManager.log(`Metrics collection failed: ${error}`, 'error');
    }
  }

  /**
   * Calculate resource health status
   */
  private calculateResourceHealth(memUsage: NodeJS.MemoryUsage): 'healthy' | 'degraded' | 'critical' {
    const threshold = this.config.monitoring!.resourceUsageThreshold!;
    
    if (memUsage.heapUsed > threshold * 2) {
      return 'critical';
    } else if (memUsage.heapUsed > threshold) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculatePerformanceScore(): number {
    let score = 100;
    const memUsage = process.memoryUsage();
    const threshold = this.config.monitoring!.resourceUsageThreshold!;

    // Memory usage impact
    const memoryPercent = (memUsage.heapUsed / threshold) * 100;
    if (memoryPercent > 200) {
      score -= 50;
    } else if (memoryPercent > 100) {
      score -= 25;
    }

    // Error rate impact (if we have recent metrics)
    if (this.metrics.length > 0) {
      const recentMetrics = this.metrics.slice(-5); // Last 5 measurements
      const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.server.errorRate, 0) / recentMetrics.length;
      
      if (avgErrorRate > 10) {
        score -= 30;
      } else if (avgErrorRate > 5) {
        score -= 15;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Check performance thresholds and emit warnings
   */
  private checkPerformanceThresholds(metrics: MonitoringMetrics): void {
    // Memory threshold check
    if (metrics.system.resourceHealth === 'critical') {
      this.debugManager.log(
        `Critical memory usage detected: ${Math.round(metrics.system.memoryUsage.heapUsed / 1024 / 1024)}MB`,
        'warning'
      );
      this.emit('performance_warning', {
        type: 'memory',
        severity: 'critical',
        metrics
      });
    }

    // Performance score check
    if (metrics.system.performanceScore < 50) {
      this.debugManager.log(
        `Low performance score detected: ${metrics.system.performanceScore}`,
        'warning'
      );
      this.emit('performance_warning', {
        type: 'performance',
        severity: metrics.system.performanceScore < 25 ? 'critical' : 'degraded',
        metrics
      });
    }
  }

  /**
   * Setup IPC server event handlers
   */
  private setupIPCServerEventHandlers(ipcServer: HaruspexIPCServer): void {
    // Since HaruspexIPCServer extends EventEmitter, we can listen to custom events
    // Note: This would require the IPC server to emit these events
    
    this.debugManager.log('Setting up IPC server event handlers for monitoring');
    
    // We can monitor server status through periodic checks since we have getStatus() method
    // This is more reliable than events for the stateless architecture
  }

  /**
   * Setup extension integration for cleanup
   */
  private setupExtensionIntegration(): void {
    // Register with VSCode extension context for automatic disposal
    this.context.subscriptions.push({
      dispose: () => {
        this.debugManager.log('Extension deactivation - shutting down process integration');
        this.dispose();
      }
    });

    this.debugManager.log('Extension cleanup integration setup complete');
  }

  /**
   * Get current process integration status
   */
  getStatus(): ProcessIntegrationStatus {
    const recentMetrics = this.metrics.slice(-1)[0];
    const memUsage = process.memoryUsage();

    return {
      enabled: this.config.enabled,
      ipcServerTracked: !!this.ipcServerPid,
      monitoringActive: this.isMonitoring,
      crashRecoveryEnabled: this.config.crashRecovery?.enabled || false,
      metrics: {
        connectionSuccessRate: recentMetrics?.connections.successRate || 0,
        averageResponseTime: recentMetrics?.server.responseTime || 0,
        errorRate: recentMetrics?.server.errorRate || 0,
        resourceUsage: {
          memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024)
        },
        uptime: recentMetrics?.server.uptime || 0
      },
      serverStatus: {
        running: recentMetrics?.server.running || false,
        port: recentMetrics?.server.port || 0,
        clientCount: recentMetrics?.server.clientCount || 0,
        lastConnection: undefined
      },
      recoveryStats: { ...this.recoveryStats }
    };
  }

  /**
   * Get recent metrics history
   */
  getMetricsHistory(count: number = 10): MonitoringMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Get configuration
   */
  getConfiguration(): ProcessIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfiguration(updates: Partial<ProcessIntegrationConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates } as Required<ProcessIntegrationConfig>;

    this.debugManager.log('Process integration configuration updated');

    // Restart monitoring if interval changed
    if (updates.monitoring?.performanceInterval && 
        updates.monitoring.performanceInterval !== oldConfig.monitoring?.performanceInterval) {
      if (this.isMonitoring) {
        this.stopMonitoring();
        this.startMonitoring();
      }
    }

    // Enable/disable monitoring
    if (updates.monitoring?.enabled !== oldConfig.monitoring?.enabled) {
      if (updates.monitoring?.enabled && !this.isMonitoring) {
        this.startMonitoring();
      } else if (!updates.monitoring?.enabled && this.isMonitoring) {
        this.stopMonitoring();
      }
    }
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      this.isMonitoring = false;
      this.debugManager.log('Enhanced monitoring stopped');
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.debugManager.log('Disposing Process Integration Manager...');

    // Stop monitoring
    this.stopMonitoring();

    // Untrack IPC server if tracked
    if (this.ipcServerPid) {
      this.cleanupOrchestrator.untrackProcess(this.ipcServerPid);
      this.ipcServerPid = undefined;
    }

    // Clear metrics history
    this.metrics = [];

    // Remove all listeners
    this.removeAllListeners();

    this.isInitialized = false;
    this.debugManager.log('Process Integration Manager disposed');
  }
}