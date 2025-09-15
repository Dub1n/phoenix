/**
 * @fileoverview MCP Lifecycle Coordinator
 * @author Claude Code Implementation
 * @created 2025-09-11
 * 
 * MCP Service Discovery Integration - Lifecycle coordination for service registration
 * 
 * Coordinates MCP server lifecycle with Templum service discovery system.
 * Handles startup, shutdown, health monitoring, and performance optimization.
 */

import * as path from 'path';
import * as os from 'os';
import { CLIMCPServer } from './cli-mcp-server';
import { PTYManager } from './pty-manager';
import { MCPServiceRegistration, ServiceRegistrationOptions } from './service-registration';
import { MCPHealthMonitor, HealthStatus } from './health-monitor';

export interface LifecycleState {
  phase: 'initializing' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  timestamp: number;
  uptime: number;
  services: {
    mcpServer: 'stopped' | 'starting' | 'running' | 'error';
    ptyManager: 'stopped' | 'starting' | 'running' | 'error';
    serviceRegistration: 'stopped' | 'starting' | 'running' | 'error';
    healthMonitor: 'stopped' | 'starting' | 'running' | 'error';
  };
  lastHealth?: HealthStatus;
  errorMessage?: string;
}

export interface LifecycleOptions extends ServiceRegistrationOptions {
  healthCheckInterval?: number;
  startupTimeout?: number;
  shutdownTimeout?: number;
  enablePerformanceOptimization?: boolean;
  enableProgressiveTimeout?: boolean;
  registrationTimeout?: number;
  maxRegistrationRetries?: number;
}

/**
 * MCP Lifecycle Coordinator
 * 
 * Orchestrates the complete lifecycle of MCP server integration with Templum.
 * Handles service discovery registration, health monitoring, and graceful shutdown.
 */
export class MCPLifecycleCoordinator {
  private options: Required<LifecycleOptions>;
  private state: LifecycleState;
  private startTime: number;
  
  // Core components
  private mcpServer?: CLIMCPServer;
  private ptyManager?: PTYManager;
  private serviceRegistration?: MCPServiceRegistration;
  private healthMonitor?: MCPHealthMonitor;
  
  // Monitoring
  private healthCheckTimer?: NodeJS.Timeout;
  private performanceOptimizationTimer?: NodeJS.Timeout;
  
  constructor(options: LifecycleOptions = {}) {
    this.startTime = Date.now();
    
    // TODO: [TASK-MCP-007-CONFIG-001] Pattern: comprehensive-configuration | Complexity: 3 | Dependencies: service-registration
    // Context: Complete lifecycle options with progressive timeout and registration settings
    // Validation-Required: default-value-appropriateness, configuration-completeness, type-safety
    // Pattern-Info: { approach: "comprehensive-defaults", alternatives: "minimal-config", trade-offs: "completeness-vs-simplicity" }
    
    this.options = {
      serviceId: options.serviceId || `mcp-server-${Date.now()}`,
      serviceName: options.serviceName || 'Templum MCP Server',
      port: options.port || 0,
      protocol: options.protocol || 'mcp',
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      servicesDir: options.servicesDir || path.join(os.homedir(), '.templum', 'services'),
      enableAutoCleanup: options.enableAutoCleanup ?? true,
      startupTimeout: options.startupTimeout || 10000, // 10 seconds
      shutdownTimeout: options.shutdownTimeout || 5000, // 5 seconds
      enablePerformanceOptimization: options.enablePerformanceOptimization ?? true,
      enableProgressiveTimeout: options.enableProgressiveTimeout ?? true,
      registrationTimeout: options.registrationTimeout || 30000, // 30 seconds
      maxRegistrationRetries: options.maxRegistrationRetries || 3
    };

    this.state = {
      phase: 'initializing',
      timestamp: Date.now(),
      uptime: 0,
      services: {
        mcpServer: 'stopped',
        ptyManager: 'stopped', 
        serviceRegistration: 'stopped',
        healthMonitor: 'stopped'
      }
    };
  }

  /**
   * Start MCP server with full service integration
   */
  async start(): Promise<void> {
    console.log('[MCP_LIFECYCLE] Starting MCP server with service integration...');
    this.updateState('starting');

    try {
      // Start components in dependency order
      await this.startPTYManager();
      await this.startMCPServer();
      await this.startHealthMonitor();
      await this.startServiceRegistration();
      
      // Start monitoring timers
      this.startHealthChecking();
      if (this.options.enablePerformanceOptimization) {
        this.startPerformanceOptimization();
      }

      this.updateState('running');
      console.log(`[MCP_LIFECYCLE] MCP server started successfully (${Date.now() - this.startTime}ms)`);
      
    } catch (error) {
      this.updateState('error', error instanceof Error ? error.message : String(error));
      console.error('[MCP_LIFECYCLE] Startup failed:', error);
      
      // Attempt cleanup on startup failure
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Get current health status
   */
  async performHealthCheck(): Promise<HealthStatus> {
    if (!this.healthMonitor) {
      throw new Error('Health monitor not initialized');
    }
    return await this.healthMonitor.performHealthCheck();
  }

  /**
   * Stop MCP server and cleanup all resources
   */
  async stop(): Promise<void> {
    console.log('[MCP_LIFECYCLE] Stopping MCP server...');
    this.updateState('stopping');

    try {
      // Stop monitoring first
      this.stopTimers();

      // Stop components in reverse dependency order
      await this.stopServiceRegistration();
      await this.stopHealthMonitor(); 
      await this.stopMCPServer();
      await this.stopPTYManager();

      this.updateState('stopped');
      console.log('[MCP_LIFECYCLE] MCP server stopped successfully');
      
    } catch (error) {
      this.updateState('error', error instanceof Error ? error.message : String(error));
      console.error('[MCP_LIFECYCLE] Shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Get current lifecycle state
   */
  getState(): LifecycleState {
    return {
      ...this.state,
      uptime: Date.now() - this.startTime,
      timestamp: Date.now()
    };
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<HealthStatus | null> {
    if (!this.healthMonitor) {
      return null;
    }
    
    return await this.healthMonitor.performHealthCheck();
  }

  /**
   * Check if MCP server is ready for requests
   */
  isReady(): boolean {
    return this.state.phase === 'running' && 
           this.state.services.mcpServer === 'running' &&
           this.state.services.ptyManager === 'running';
  }

  /**
   * Start PTY Manager
   */
  private async startPTYManager(): Promise<void> {
    console.log('[MCP_LIFECYCLE] Starting PTY Manager...');
    this.state.services.ptyManager = 'starting';
    
    try {
      this.ptyManager = new PTYManager();
      this.state.services.ptyManager = 'running';
      console.log('[MCP_LIFECYCLE] PTY Manager started');
      
    } catch (error) {
      this.state.services.ptyManager = 'error';
      throw new Error(`PTY Manager startup failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Start MCP Server
   */
  private async startMCPServer(): Promise<void> {
    console.log('[MCP_LIFECYCLE] Starting MCP Server...');
    this.state.services.mcpServer = 'starting';
    
    try {
      if (!this.ptyManager) {
        throw new Error('PTY Manager must be started first');
      }
      
      this.mcpServer = new CLIMCPServer();
      this.state.services.mcpServer = 'running';
      console.log('[MCP_LIFECYCLE] MCP Server started');
      
    } catch (error) {
      this.state.services.mcpServer = 'error';
      throw new Error(`MCP Server startup failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Start Health Monitor
   */
  private async startHealthMonitor(): Promise<void> {
    console.log('[MCP_LIFECYCLE] Starting Health Monitor...');
    this.state.services.healthMonitor = 'starting';
    
    try {
      if (!this.mcpServer || !this.ptyManager) {
        throw new Error('MCP Server and PTY Manager must be started first');
      }
      
      this.healthMonitor = new MCPHealthMonitor(this.mcpServer, this.ptyManager);
      this.state.services.healthMonitor = 'running';
      console.log('[MCP_LIFECYCLE] Health Monitor started');
      
    } catch (error) {
      this.state.services.healthMonitor = 'error';
      throw new Error(`Health Monitor startup failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Start Service Registration
   */
  private async startServiceRegistration(): Promise<void> {
    console.log('[MCP_LIFECYCLE] Starting Service Registration...');
    this.state.services.serviceRegistration = 'starting';
    
    try {
      if (!this.mcpServer || !this.ptyManager) {
        throw new Error('MCP Server and PTY Manager must be started first');
      }
      
      this.serviceRegistration = new MCPServiceRegistration({
        serviceId: this.options.serviceId,
        serviceName: this.options.serviceName,
        port: this.options.port,
        protocol: this.options.protocol,
        healthCheckInterval: this.options.healthCheckInterval,
        servicesDir: this.options.servicesDir,
        enableAutoCleanup: this.options.enableAutoCleanup
      });
      
      this.serviceRegistration.initialize(this.mcpServer, this.ptyManager);
      await this.serviceRegistration.register();
      
      this.state.services.serviceRegistration = 'running';
      console.log('[MCP_LIFECYCLE] Service Registration started');
      
    } catch (error) {
      this.state.services.serviceRegistration = 'error';
      throw new Error(`Service Registration startup failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Start health checking timer
   */
  private startHealthChecking(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        if (this.healthMonitor) {
          const health = await this.healthMonitor.performHealthCheck();
          this.state.lastHealth = health;
          
          // Handle degraded performance
          if (health.status === 'degraded') {
            console.warn('[MCP_LIFECYCLE] Service health degraded, considering optimization');
          } else if (health.status === 'unhealthy') {
            console.error('[MCP_LIFECYCLE] Service unhealthy, may need restart');
          }
        }
      } catch (error) {
        console.error('[MCP_LIFECYCLE] Health check failed:', error);
      }
    }, this.options.healthCheckInterval);
  }

  /**
   * Start performance optimization
   */
  private startPerformanceOptimization(): void {
    if (this.performanceOptimizationTimer) {
      clearInterval(this.performanceOptimizationTimer);
    }

    // Run optimization checks every 5 minutes
    this.performanceOptimizationTimer = setInterval(() => {
      this.optimizePerformance();
    }, 5 * 60 * 1000);
  }

  /**
   * Optimize performance based on current metrics
   */
  private optimizePerformance(): void {
    try {
      if (!this.healthMonitor) return;

      const metrics = this.healthMonitor.getPerformanceMetrics();
      
      // Clean up response time history if it gets too large
      if (metrics.responseTimeHistory.length > 100) {
        console.log('[MCP_LIFECYCLE] Optimizing response time history');
        // This is handled in the health monitor itself
      }

      // Suggest PTY session cleanup if many inactive sessions
      if (this.ptyManager) {
        const sessionIds = this.ptyManager.getActiveSessions();
        if (sessionIds.length > 10) {
          console.log(`[MCP_LIFECYCLE] Consider cleaning up ${sessionIds.length} PTY sessions`);
          // Could implement automatic cleanup of old sessions here
        }
      }

      // Memory optimization
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 200 * 1024 * 1024) { // 200MB
        console.log('[MCP_LIFECYCLE] High memory usage detected, suggesting GC');
        if (global.gc) {
          global.gc();
        }
      }

    } catch (error) {
      console.error('[MCP_LIFECYCLE] Performance optimization failed:', error);
    }
  }

  /**
   * Stop all timers
   */
  private stopTimers(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
    
    if (this.performanceOptimizationTimer) {
      clearInterval(this.performanceOptimizationTimer);
      this.performanceOptimizationTimer = undefined;
    }
  }

  /**
   * Stop PTY Manager
   */
  private async stopPTYManager(): Promise<void> {
    if (this.ptyManager) {
      console.log('[MCP_LIFECYCLE] Stopping PTY Manager...');
      this.ptyManager.cleanup();
      this.ptyManager = undefined;
    }
    this.state.services.ptyManager = 'stopped';
  }

  /**
   * Stop MCP Server
   */
  private async stopMCPServer(): Promise<void> {
    if (this.mcpServer) {
      console.log('[MCP_LIFECYCLE] Stopping MCP Server...');
      this.mcpServer.cleanup();
      this.mcpServer = undefined;
    }
    this.state.services.mcpServer = 'stopped';
  }

  /**
   * Stop Health Monitor
   */
  private async stopHealthMonitor(): Promise<void> {
    if (this.healthMonitor) {
      console.log('[MCP_LIFECYCLE] Stopping Health Monitor...');
      // Health monitor doesn't need explicit cleanup
      this.healthMonitor = undefined;
    }
    this.state.services.healthMonitor = 'stopped';
  }

  /**
   * Stop Service Registration
   */
  private async stopServiceRegistration(): Promise<void> {
    if (this.serviceRegistration) {
      console.log('[MCP_LIFECYCLE] Stopping Service Registration...');
      await this.serviceRegistration.unregister();
      this.serviceRegistration = undefined;
    }
    this.state.services.serviceRegistration = 'stopped';
  }

  /**
   * Complete cleanup of all resources
   */
  private async cleanup(): Promise<void> {
    console.log('[MCP_LIFECYCLE] Performing complete cleanup...');
    
    this.stopTimers();
    
    try {
      await Promise.all([
        this.stopServiceRegistration(),
        this.stopHealthMonitor(),
        this.stopMCPServer(),
        this.stopPTYManager()
      ]);
    } catch (error) {
      console.error('[MCP_LIFECYCLE] Cleanup error:', error);
    }
  }

  /**
   * Update lifecycle state
   */
  private updateState(phase: LifecycleState['phase'], errorMessage?: string): void {
    this.state = {
      ...this.state,
      phase,
      timestamp: Date.now(),
      errorMessage
    };
  }
}

/**
 * Factory function to create and start MCP lifecycle coordinator
 */
export async function createMCPLifecycleCoordinator(
  options?: LifecycleOptions
): Promise<MCPLifecycleCoordinator> {
  const coordinator = new MCPLifecycleCoordinator(options);
  await coordinator.start();
  return coordinator;
}

/**
 * Create MCP lifecycle coordinator without auto-start
 */
export function createMCPLifecycleCoordinatorManual(
  options?: LifecycleOptions
): MCPLifecycleCoordinator {
  return new MCPLifecycleCoordinator(options);
}