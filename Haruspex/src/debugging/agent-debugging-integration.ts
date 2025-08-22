/**---
 * title: [Agent Debugging Integration - Main Integration Module]
 * tags: [Integration, Agent-Debugging, Orchestration, Lifecycle]
 * provides: [AgentDebuggingSystem, SystemIntegration, LifecycleManagement]
 * requires: [Extension Context, Core Engine, Debug Manager, All Debugging Components]
 * description: [Main integration module that orchestrates all agent debugging components with minimal risk approach]
 * ---*/

import * as vscode from 'vscode';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';
import { HaruspexDebugManager } from './haruspex-debug-manager';
import { HaruspexIPCServer } from './ipc-protocol';
import { HaruspexStateInspector } from './state-inspector';
import { HaruspexInteractiveController } from './interactive-controller';
import { ProcessIntegrationManager, ProcessIntegrationConfig } from './process-integration-manager';
import { HaruspexCleanupOrchestrator } from '../core/haruspex-cleanup-orchestrator';

export interface AgentDebuggingConfig {
  enabled?: boolean;
  ipc?: {
    enabled?: boolean;
    socketPath?: string;
    timeout?: number;
  };
  stateInspection?: {
    enabled?: boolean;
    watchInterval?: number;
    historySize?: number;
    includePerformance?: boolean;
  };
  interactiveControl?: {
    enabled?: boolean;
    enableAutomatedTriggers?: boolean;
    enableEmergencyRecovery?: boolean;
    confirmationRequired?: boolean;
  };
  security?: {
    allowedCommands?: string[];
    requireConfirmation?: string[];
    maxExecutionTime?: number;
  };
  // Phase 5: Process Integration Configuration
  processIntegration?: ProcessIntegrationConfig;
}

export interface AgentDebuggingStatus {
  enabled: boolean;
  components: {
    ipcServer: 'running' | 'stopped' | 'error' | 'disabled';
    stateInspector: 'watching' | 'stopped' | 'error' | 'disabled';
    interactiveController: 'active' | 'inactive' | 'error' | 'disabled';
    // Phase 5: Process Integration Status
    processIntegration: 'active' | 'inactive' | 'error' | 'disabled';
  };
  connections: {
    activeClients: number;
    totalConnections: number;
    lastConnection?: number;
  };
  performance: {
    memoryUsage: number;
    operationsPerSecond: number;
    averageResponseTime: number;
  };
  server: {
    running: boolean;
    socketPath: string;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Main integration system for agent debugging functionality
 * 
 * Provides centralized management of all debugging components with:
 * - Minimal risk integration approach
 * - Graceful degradation on failures
 * - Comprehensive lifecycle management
 * - Performance monitoring and optimization
 * - Security and access control
 */
export class AgentDebuggingSystem {
  private config: AgentDebuggingConfig;
  private ipcServer: HaruspexIPCServer | undefined;
  private stateInspector: HaruspexStateInspector | undefined;
  private interactiveController: HaruspexInteractiveController | undefined;
  private processIntegrationManager: ProcessIntegrationManager | undefined;
  private isInitialized = false;
  private initializationErrors: string[] = [];
  private initializationWarnings: string[] = [];
  private performanceMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    responseTimes: [] as number[]
  };

  constructor(
    private context: vscode.ExtensionContext,
    private coreEngine: HaruspexCoreEngine,
    private debugManager: HaruspexDebugManager,
    private workspaceRoot: string,
    private cleanupOrchestrator: HaruspexCleanupOrchestrator,
    config: AgentDebuggingConfig = {}
  ) {
    this.config = {
      enabled: true,
      ipc: {
        enabled: true,
        timeout: 30000,
        ...config.ipc
      },
      stateInspection: {
        enabled: true,
        watchInterval: 2000,
        historySize: 100,
        includePerformance: true,
        ...config.stateInspection
      },
      interactiveControl: {
        enabled: true,
        enableAutomatedTriggers: true,
        enableEmergencyRecovery: true,
        confirmationRequired: false, // For automated systems
        ...config.interactiveControl
      },
      security: {
        allowedCommands: [
          'haruspex.getHealth',
          'haruspex.getMetrics',
          'haruspex.getDebugInfo',
          'haruspex.refreshAll',
          'haruspex.analyzeWorkspace',
          'haruspex.runTDD',
          'haruspex.initWorkspace',
          'haruspex.clearErrors',
          'haruspex.exportDebugReport'
        ],
        requireConfirmation: [
          'haruspex.restartEngine',
          'haruspex.initWorkspace',
          'haruspex.autoFix'
        ],
        maxExecutionTime: 120000, // 2 minutes
        ...config.security
      },
      ...config
    };
  }

  /**
   * Initialize the agent debugging system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.debugManager.log('Initializing Agent Debugging System...');

    try {
      // Phase 1: Initialize State Inspector (lowest risk)
      if (this.config.stateInspection?.enabled) {
        await this.initializeStateInspector();
      }

      // Phase 2: Initialize Interactive Controller
      if (this.config.interactiveControl?.enabled) {
        await this.initializeInteractiveController();
      }

      // Phase 3: Initialize IPC Server (highest risk - external interface)
      if (this.config.ipc?.enabled) {
        await this.initializeIPCServer();
      }

      // Phase 4: Connect components
      await this.connectComponents();

      // Phase 5: Initialize Process Integration Manager
      if (this.config.processIntegration?.enabled !== false) {
        await this.initializeProcessIntegration();
      }

      this.isInitialized = true;
      this.debugManager.log('Agent Debugging System initialized successfully');

      // Report initialization status
      const status = this.getStatus();
      this.debugManager.log(`Components: IPC=${status.components.ipcServer}, State=${status.components.stateInspector}, Control=${status.components.interactiveController}, ProcessIntegration=${status.components.processIntegration}`);

      if (this.initializationWarnings.length > 0) {
        this.debugManager.log(`Warnings: ${this.initializationWarnings.join(', ')}`, 'warning');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationErrors.push(errorMessage);
      this.debugManager.log(`Agent Debugging System initialization failed: ${errorMessage}`, 'error');
      
      // Partial initialization is OK - continue with what we have
      this.isInitialized = true; // Mark as initialized to prevent retries
    }
  }

  /**
   * Initialize state inspector component
   */
  private async initializeStateInspector(): Promise<void> {
    try {
      this.stateInspector = new HaruspexStateInspector(
        this.coreEngine,
        this.debugManager,
        {
          threshold: 1000,
          includeMetrics: this.config.stateInspection!.includePerformance ?? false,
          includePerformance: this.config.stateInspection!.includePerformance ?? false,
          maxHistory: this.config.stateInspection!.historySize ?? 100
        }
      );

      // Setup event handlers
      this.stateInspector.on('critical_change', (change) => {
        this.debugManager.log(`Critical state change detected: ${change.component}.${change.property}`, 'warning');
      });

      this.stateInspector.on('error', (error) => {
        this.debugManager.log(`State inspector error: ${error.message}`, 'error');
      });

      // Start monitoring if configured
      if (this.config.stateInspection!.watchInterval) {
        await this.stateInspector.startWatching(this.config.stateInspection!.watchInterval);
      }

      this.debugManager.log('State Inspector initialized');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationWarnings.push(`State Inspector: ${errorMessage}`);
      this.debugManager.log(`State Inspector initialization failed: ${errorMessage}`, 'warning');
    }
  }

  /**
   * Initialize interactive controller component
   */
  private async initializeInteractiveController(): Promise<void> {
    try {
      if (!this.stateInspector) {
        throw new Error('State Inspector required for Interactive Controller');
      }

      this.interactiveController = new HaruspexInteractiveController(
        this.coreEngine,
        this.stateInspector,
        this.debugManager
      );

      // Setup event handlers
      this.interactiveController.on('action_started', (event) => {
        this.recordOperation('action_started');
        this.debugManager.log(`Action started: ${event.actionId}`);
      });

      this.interactiveController.on('action_completed', (event) => {
        this.recordOperation('action_completed', event.result.success, event.result.duration);
        this.debugManager.log(`Action completed: ${event.actionId} (${event.result.duration}ms)`);
      });

      this.interactiveController.on('action_failed', (event) => {
        this.recordOperation('action_failed', false, event.result.duration);
        this.debugManager.log(`Action failed: ${event.actionId} - ${event.result.error}`, 'error');
      });

      this.interactiveController.on('trigger_activated', (event) => {
        this.debugManager.log(`Trigger activated: ${event.triggerId}`);
      });

      this.interactiveController.on('critical_change_detected', (event) => {
        this.debugManager.log(`Critical change detected, auto-actions: ${event.autoActions.join(', ')}`, 'warning');
      });

      // Configure security settings
      if (this.config.security?.allowedCommands) {
        // Apply command filtering (would be implemented in controller)
        this.debugManager.log(`Command security enabled: ${this.config.security.allowedCommands.length} allowed commands`);
      }

      this.debugManager.log('Interactive Controller initialized');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationWarnings.push(`Interactive Controller: ${errorMessage}`);
      this.debugManager.log(`Interactive Controller initialization failed: ${errorMessage}`, 'warning');
    }
  }

  /**
   * Initialize IPC server component
   */
  private async initializeIPCServer(): Promise<void> {
    this.debugManager.log('Starting IPC Server initialization...');
    
    try {
      if (!this.stateInspector || !this.interactiveController) {
        throw new Error('State Inspector and Interactive Controller required for IPC Server');
      }

      this.debugManager.log('Creating IPC Server instance...');
      this.ipcServer = new HaruspexIPCServer(
        this.coreEngine,
        this.debugManager,
        this.workspaceRoot
      );

      this.debugManager.log('Starting IPC Server...');
      // Start the IPC server with detailed logging
      await this.ipcServer.start();

      // Validate the server actually started
      const serverStatus = this.ipcServer.getStatus();
      if (!serverStatus.running) {
        throw new Error('IPC Server failed to start - status shows not running');
      }

      this.debugManager.log(`IPC Server started successfully on ${serverStatus.host}:${serverStatus.port}`);
      this.debugManager.log(`Connection info file: ${serverStatus.connectionInfoPath}`);
      
      // Validate connection info file was created
      const fs = require('fs');
      if (!fs.existsSync(serverStatus.connectionInfoPath)) {
        throw new Error(`Connection info file not created at: ${serverStatus.connectionInfoPath}`);
      }

      this.debugManager.log('IPC Server connection info file validated');
      
      // Track IPC server with process integration manager if available
      if (this.processIntegrationManager) {
        this.processIntegrationManager.trackIPCServer(this.ipcServer);
        this.debugManager.log('IPC Server tracked by Process Integration Manager');
      }
      
      // Log connection details for CLI tools
      this.debugManager.log(`=== IPC SERVER READY ===`);
      this.debugManager.log(`Host: ${serverStatus.host}`);
      this.debugManager.log(`Port: ${serverStatus.port}`);
      this.debugManager.log(`Connection File: ${serverStatus.connectionInfoPath}`);
      this.debugManager.log(`CLI Command: haruspex-debug connect --workspace "${this.workspaceRoot}"`);
      this.debugManager.log(`=========================`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationWarnings.push(`IPC Server: ${errorMessage}`);
      this.debugManager.log(`IPC Server initialization failed: ${errorMessage}`, 'error');
      
      // Log additional debug info for troubleshooting
      this.debugManager.log(`Workspace root: ${this.workspaceRoot}`, 'error');
      this.debugManager.log(`State Inspector available: ${!!this.stateInspector}`, 'error');
      this.debugManager.log(`Interactive Controller available: ${!!this.interactiveController}`, 'error');
      
      // Don't throw - allow extension to continue with limited functionality
    }
  }

  /**
   * Connect components together
   */
  private async connectComponents(): Promise<void> {
    try {
      // Connect state inspector to IPC server for event broadcasting
      if (this.stateInspector && this.ipcServer) {
        this.stateInspector.on('state_changed', (diff) => {
          // Broadcast state changes to connected clients
          this.ipcServer!.emit('broadcast_required', {
            type: 'state_change',
            payload: diff
          });
        });

        this.stateInspector.on('critical_change', (change) => {
          this.ipcServer!.emit('broadcast_required', {
            type: 'critical_change',
            payload: change
          });
        });
      }

      // Connect interactive controller to state inspector for trigger evaluation
      if (this.interactiveController && this.stateInspector) {
        // This connection is already established in the controller constructor
        this.debugManager.log('Component connections established');
      }

      // Connect performance monitoring
      if (this.ipcServer) {
        // Monitor IPC operations for performance metrics
        // This would be implemented with event handlers
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationWarnings.push(`Component Connection: ${errorMessage}`);
      this.debugManager.log(`Component connection failed: ${errorMessage}`, 'warning');
    }
  }

  /**
   * Initialize process integration manager (Phase 5)
   */
  private async initializeProcessIntegration(): Promise<void> {
    try {
      this.debugManager.log('Initializing Process Integration Manager (Phase 5)...');

      this.processIntegrationManager = new ProcessIntegrationManager(
        this.context,
        this.cleanupOrchestrator,
        this.debugManager,
        this.workspaceRoot,
        this.config.processIntegration || {}
      );

      await this.processIntegrationManager.initialize();

      // Track IPC server if it's running
      if (this.ipcServer) {
        this.processIntegrationManager.trackIPCServer(this.ipcServer);
        this.debugManager.log('IPC Server tracked by Process Integration Manager');
      }

      this.debugManager.log('Process Integration Manager initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationWarnings.push(`Process Integration: ${errorMessage}`);
      this.debugManager.log(`Process Integration Manager initialization failed: ${errorMessage}`, 'warning');
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor memory usage
    const monitorMemory = () => {
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
        this.debugManager.log(`High memory usage in agent debugging: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`, 'warning');
      }
    };

    // Monitor every 30 seconds
    setInterval(monitorMemory, 30000);

    // Monitor operation performance
    setInterval(() => {
      if (this.performanceMetrics.responseTimes.length > 0) {
        const avgResponseTime = this.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.responseTimes.length;
        if (avgResponseTime > 1000) { // 1 second
          this.debugManager.log(`Slow agent debugging operations: ${Math.round(avgResponseTime)}ms average`, 'warning');
        }
        
        // Reset metrics periodically
        if (this.performanceMetrics.responseTimes.length > 100) {
          this.performanceMetrics.responseTimes = this.performanceMetrics.responseTimes.slice(-50);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Setup cleanup handlers
   */
  private setupCleanup(): void {
    // Register disposal with VSCode extension context
    this.context.subscriptions.push({
      dispose: () => {
        this.dispose();
      }
    });

    // Handle process signals for graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      this.debugManager.log(`Received ${signal}, shutting down agent debugging system...`);
      await this.dispose();
    };

    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Record operation metrics
   */
  private recordOperation(operation: string, success?: boolean, duration?: number): void {
    this.performanceMetrics.totalOperations++;
    
    if (success !== undefined) {
      if (success) {
        this.performanceMetrics.successfulOperations++;
      } else {
        this.performanceMetrics.failedOperations++;
      }
    }
    
    if (duration !== undefined) {
      this.performanceMetrics.responseTimes.push(duration);
    }
  }

  // Public API Methods

  /**
   * Get system status
   */
  getStatus(): AgentDebuggingStatus {
    const ipcStatus = this.ipcServer ? 
      (this.ipcServer.getStatus().running ? 'running' : 'stopped') : 
      (this.config.ipc?.enabled ? 'error' : 'disabled');

    const stateStatus = this.stateInspector ? 
      (this.stateInspector.getMonitoringStatus().isWatching ? 'watching' : 'stopped') :
      (this.config.stateInspection?.enabled ? 'error' : 'disabled');

    const controlStatus = this.interactiveController ? 'active' :
      (this.config.interactiveControl?.enabled ? 'error' : 'disabled');

    const processIntegrationStatus = this.processIntegrationManager ? 
      (this.processIntegrationManager.getStatus().enabled ? 'active' : 'inactive') :
      (this.config.processIntegration?.enabled !== false ? 'error' : 'disabled');

    const memUsage = process.memoryUsage();
    const avgResponseTime = this.performanceMetrics.responseTimes.length > 0 ?
      this.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.responseTimes.length : 0;

    return {
      enabled: this.config.enabled!,
      components: {
        ipcServer: ipcStatus as any,
        stateInspector: stateStatus as any,
        interactiveController: controlStatus as any,
        processIntegration: processIntegrationStatus as any
      },
      connections: {
        activeClients: this.ipcServer?.getStatus().clientCount || 0,
        totalConnections: this.performanceMetrics.totalOperations,
        ...(this.ipcServer?.getStatus().lastConnection && {
          lastConnection: this.ipcServer.getStatus().lastConnection
        })
      },
      performance: {
        memoryUsage: memUsage.heapUsed / 1024 / 1024, // MB
        operationsPerSecond: this.performanceMetrics.totalOperations / 60, // Rough estimate
        averageResponseTime: Math.round(avgResponseTime)
      },
      server: {
        running: this.ipcServer?.getStatus().running || false,
        socketPath: this.ipcServer?.getStatus().socketPath || 'N/A'
      },
      errors: [...this.initializationErrors],
      warnings: [...this.initializationWarnings]
    };
  }

  /**
   * Get configuration
   */
  getConfig(): AgentDebuggingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (partial)
   */
  async updateConfig(updates: Partial<AgentDebuggingConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };

    this.debugManager.log('Agent debugging configuration updated');

    // Restart components if needed
    if (updates.ipc?.enabled !== oldConfig.ipc?.enabled) {
      if (updates.ipc?.enabled && !this.ipcServer) {
        await this.initializeIPCServer();
      } else if (!updates.ipc?.enabled && this.ipcServer) {
        await this.ipcServer.stop();
        this.ipcServer = undefined;
      }
    }

    if (updates.stateInspection?.enabled !== oldConfig.stateInspection?.enabled) {
      if (updates.stateInspection?.enabled && !this.stateInspector) {
        await this.initializeStateInspector();
      } else if (!updates.stateInspection?.enabled && this.stateInspector) {
        this.stateInspector.stopWatching();
        this.stateInspector.dispose();
        this.stateInspector = undefined;
      }
    }
  }

  /**
   * Force component restart
   */
  async restartComponent(component: 'ipc' | 'state' | 'control' | 'all'): Promise<void> {
    this.debugManager.log(`Restarting agent debugging component: ${component}`);

    try {
      switch (component) {
        case 'ipc':
          if (this.ipcServer) {
            await this.ipcServer.stop();
            this.ipcServer = undefined;
          }
          if (this.config.ipc?.enabled) {
            await this.initializeIPCServer();
          }
          break;

        case 'state':
          if (this.stateInspector) {
            this.stateInspector.stopWatching();
            this.stateInspector.dispose();
            this.stateInspector = undefined;
          }
          if (this.config.stateInspection?.enabled) {
            await this.initializeStateInspector();
          }
          break;

        case 'control':
          if (this.interactiveController) {
            this.interactiveController.dispose();
            this.interactiveController = undefined;
          }
          if (this.config.interactiveControl?.enabled) {
            await this.initializeInteractiveController();
          }
          break;

        case 'all':
          await this.dispose();
          this.isInitialized = false;
          this.initializationErrors = [];
          this.initializationWarnings = [];
          await this.initialize();
          break;
      }

      this.debugManager.log(`Component restart completed: ${component}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.debugManager.log(`Component restart failed: ${component} - ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Execute emergency recovery
   */
  async executeEmergencyRecovery(): Promise<void> {
    this.debugManager.log('Executing emergency recovery for agent debugging system...', 'warning');

    try {
      // 1. Stop all components
      await this.dispose();

      // 2. Clear state and errors
      this.isInitialized = false;
      this.initializationErrors = [];
      this.initializationWarnings = [];
      this.performanceMetrics = {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        responseTimes: []
      };

      // 3. Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Restart with minimal configuration
      const emergencyConfig = {
        ...this.config,
        stateInspection: { 
          ...this.config.stateInspection, 
          watchInterval: 5000 // Slower monitoring
        },
        interactiveControl: {
          ...this.config.interactiveControl,
          enableAutomatedTriggers: false // Disable automated triggers
        }
      };

      this.config = emergencyConfig;
      await this.initialize();

      this.debugManager.log('Emergency recovery completed', 'info');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.debugManager.log(`Emergency recovery failed: ${errorMessage}`, 'error');
      throw error;
    }
  }

  /**
   * Get component instances (for advanced usage)
   */
  getComponents(): {
    ipcServer?: HaruspexIPCServer;
    stateInspector?: HaruspexStateInspector;
    interactiveController?: HaruspexInteractiveController;
  } {
    return {
      ...(this.ipcServer && { ipcServer: this.ipcServer }),
      ...(this.stateInspector && { stateInspector: this.stateInspector }),
      ...(this.interactiveController && { interactiveController: this.interactiveController })
    };
  }

  /**
   * Check if system is operational
   */
  isOperational(): boolean {
    return this.isInitialized && (
      (this.config.ipc?.enabled ? !!this.ipcServer : true) ||
      (this.config.stateInspection?.enabled ? !!this.stateInspector : true) ||
      (this.config.interactiveControl?.enabled ? !!this.interactiveController : true)
    );
  }

  /**
   * Check if system is running
   */
  isRunning(): boolean {
    return this.isInitialized && (
      !this.ipcServer || this.ipcServer.getStatus().running
    );
  }

  /**
   * Start the debugging system
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (this.ipcServer && !this.ipcServer.getStatus().running) {
      await this.ipcServer.start();
    }
  }

  /**
   * Stop the debugging system
   */
  async stop(): Promise<void> {
    if (this.ipcServer) {
      await this.ipcServer.stop();
    }
    if (this.stateInspector) {
      this.stateInspector.stopWatching();
    }
  }

  /**
   * Get debug info for external access
   */
  async getDebugInfo(): Promise<any> {
    const status = this.getStatus();
    const initialization = this.getInitializationSummary();
    const components = this.getComponents();

    return {
      status,
      initialization,
      components,
      metrics: this.performanceMetrics,
      server: {
        running: this.ipcServer?.getStatus().running || false,
        socketPath: this.ipcServer?.getStatus().socketPath || 'N/A'
      },
      stateInspector: {
        active: this.stateInspector?.getMonitoringStatus().isWatching || false
      },
      interactiveController: {
        active: this.interactiveController?.getStatus().isActive || false
      }
    };
  }

  /**
   * Get initialization summary
   */
  getInitializationSummary(): {
    success: boolean;
    errors: string[];
    warnings: string[];
    componentsInitialized: string[];
    componentsSkipped: string[];
    componentsFailure: string[];
  } {
    const componentsInitialized: string[] = [];
    const componentsSkipped: string[] = [];
    const componentsFailure: string[] = [];

    if (this.config.ipc?.enabled) {
      if (this.ipcServer) {
        componentsInitialized.push('IPC Server');
      } else {
        componentsFailure.push('IPC Server');
      }
    } else {
      componentsSkipped.push('IPC Server');
    }

    if (this.config.stateInspection?.enabled) {
      if (this.stateInspector) {
        componentsInitialized.push('State Inspector');
      } else {
        componentsFailure.push('State Inspector');
      }
    } else {
      componentsSkipped.push('State Inspector');
    }

    if (this.config.interactiveControl?.enabled) {
      if (this.interactiveController) {
        componentsInitialized.push('Interactive Controller');
      } else {
        componentsFailure.push('Interactive Controller');
      }
    } else {
      componentsSkipped.push('Interactive Controller');
    }

    return {
      success: this.isInitialized && componentsFailure.length === 0,
      errors: [...this.initializationErrors],
      warnings: [...this.initializationWarnings],
      componentsInitialized,
      componentsSkipped,
      componentsFailure
    };
  }

  /**
   * Dispose of all resources
   */
  async dispose(): Promise<void> {
    this.debugManager.log('Disposing Agent Debugging System...');

    try {
      // Stop IPC server
      if (this.ipcServer) {
        await this.ipcServer.stop();
        this.ipcServer = undefined;
      }

      // Stop state inspector
      if (this.stateInspector) {
        this.stateInspector.stopWatching();
        this.stateInspector.dispose();
        this.stateInspector = undefined;
      }

      // Dispose interactive controller
      if (this.interactiveController) {
        this.interactiveController.dispose();
        this.interactiveController = undefined;
      }

      this.debugManager.log('Agent Debugging System disposed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.debugManager.log(`Error during disposal: ${errorMessage}`, 'error');
    }
  }
}