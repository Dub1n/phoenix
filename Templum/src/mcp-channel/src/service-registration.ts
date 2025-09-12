/**
 * @fileoverview MCP Service Registration Module
 * @author Claude Code Implementation  
 * @created 2025-09-11
 * 
 * MCP Service Discovery Integration - Service registration module for automatic discovery
 * 
 * Provides automatic service registration for MCP server with Templum service discovery.
 * Implements health checks, lifecycle coordination, and performance optimization.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CLIMCPServer } from './cli-mcp-server';
import { PTYManager } from './pty-manager';

export interface MCPServiceConfig {
  id: string;
  name: string;
  endpoint: string;
  protocol: 'mcp' | 'stdio' | 'tcp';
  port?: number;
  pid: number;
  health: string;
  capabilities: string[];
  version: string;
  registrationTime: number;
  lastSeen: number;
  authentication?: {
    type: 'none' | 'token' | 'basic';
    [key: string]: any;
  };
}

export interface ServiceRegistrationOptions {
  serviceId?: string;
  serviceName?: string;
  port?: number;
  protocol?: 'mcp' | 'stdio' | 'tcp';
  healthCheckInterval?: number;
  servicesDir?: string;
  enableAutoCleanup?: boolean;
}

/**
 * MCP Service Registration Manager
 * 
 * Handles automatic registration of MCP server with Templum service discovery system.
 * Provides health monitoring, lifecycle coordination, and performance optimization.
 */
export class MCPServiceRegistration {
  private config: MCPServiceConfig;
  private options: Required<ServiceRegistrationOptions>;
  private healthCheckTimer?: NodeJS.Timeout;
  private isRegistered: boolean = false;
  private serviceFilePath: string;
  private mcpServer?: CLIMCPServer;
  private ptyManager?: PTYManager;

  constructor(options: ServiceRegistrationOptions = {}) {
    // Generate service configuration
    const serviceId = options.serviceId || `mcp-server-${Date.now()}`;
    const defaultServicesDir = path.join(os.homedir(), '.templum', 'services');
    
    this.options = {
      serviceId,
      serviceName: options.serviceName || 'Templum MCP Server',
      port: options.port || 0, // 0 means stdio/direct communication
      protocol: options.protocol || 'mcp',
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      servicesDir: options.servicesDir || defaultServicesDir,
      enableAutoCleanup: options.enableAutoCleanup ?? true
    };

    this.serviceFilePath = path.join(this.options.servicesDir, `${serviceId}.json`);

    // Initialize service configuration
    this.config = {
      id: serviceId,
      name: this.options.serviceName,
      endpoint: '', // Will be set after config is initialized
      protocol: this.options.protocol,
      port: this.options.port,
      pid: process.pid,
      health: '', // Will be set after config is initialized
      capabilities: this.getMCPCapabilities(),
      version: this.getVersion(),
      registrationTime: Date.now(),
      lastSeen: Date.now(),
      authentication: { type: 'none' }
    };

    // Set endpoints after config is initialized
    this.config.endpoint = this.generateEndpoint();
    this.config.health = this.generateHealthEndpoint();
  }

  /**
   * Initialize MCP server integration
   */
  initialize(mcpServer: CLIMCPServer, ptyManager: PTYManager): void {
    this.mcpServer = mcpServer;
    this.ptyManager = ptyManager;
  }

  /**
   * Register MCP service with service discovery
   */
  async register(): Promise<void> {
    try {
      // Ensure services directory exists
      if (!fs.existsSync(this.options.servicesDir)) {
        console.log(`[MCP_REGISTRATION] Creating services directory: ${this.options.servicesDir}`);
        fs.mkdirSync(this.options.servicesDir, { recursive: true });
      }

      // Write service registration file
      fs.writeFileSync(this.serviceFilePath, JSON.stringify(this.config, null, 2));
      
      this.isRegistered = true;
      console.log(`[MCP_REGISTRATION] Service registered: ${this.config.id}`);
      console.log(`[MCP_REGISTRATION] Service file: ${this.serviceFilePath}`);

      // Start health check monitoring
      this.startHealthChecking();

      // Setup cleanup on process exit
      if (this.options.enableAutoCleanup) {
        this.setupCleanupHandlers();
      }

    } catch (error) {
      console.error('[MCP_REGISTRATION] Registration failed:', error);
      throw new Error(`MCP service registration failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Unregister MCP service from service discovery
   */
  async unregister(): Promise<void> {
    try {
      // Stop health checking
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = undefined;
      }

      // Remove service file
      if (fs.existsSync(this.serviceFilePath)) {
        fs.unlinkSync(this.serviceFilePath);
        console.log(`[MCP_REGISTRATION] Service unregistered: ${this.config.id}`);
      }

      this.isRegistered = false;

    } catch (error) {
      console.error('[MCP_REGISTRATION] Unregistration failed:', error);
      throw new Error(`MCP service unregistration failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Update service health status and last seen timestamp
   */
  private async updateHealth(): Promise<void> {
    if (!this.isRegistered) return;

    try {
      // Update health status based on MCP server and PTY manager health
      const isHealthy = await this.checkHealth();
      
      if (isHealthy) {
        // Update last seen timestamp
        this.config.lastSeen = Date.now();
        
        // Update service file
        fs.writeFileSync(this.serviceFilePath, JSON.stringify(this.config, null, 2));
        
        console.log(`[MCP_HEALTH] Health updated: ${this.config.id} (${new Date(this.config.lastSeen).toISOString()})`);
      } else {
        console.warn(`[MCP_HEALTH] Health check failed for: ${this.config.id}`);
        // Optionally unregister if unhealthy for too long
        // await this.unregister();
      }

    } catch (error) {
      console.error('[MCP_HEALTH] Health update failed:', error);
    }
  }

  /**
   * Check MCP server health status
   */
  private async checkHealth(): Promise<boolean> {
    try {
      // Check if MCP server is responsive
      if (this.mcpServer) {
        const tools = this.mcpServer.getAvailableTools();
        if (tools.length === 0) {
          return false;
        }
      }

      // Check if PTY manager is functional
      if (this.ptyManager) {
        // PTY manager is functional if it can list sessions (even if empty)
        try {
          // This should not throw if PTY manager is working
          const sessions = this.ptyManager.getActiveSessions();
          console.log(`[MCP_HEALTH] Active PTY sessions: ${sessions.length}`);
        } catch (_error) {
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('[MCP_HEALTH] Health check error:', error);
      return false;
    }
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.updateHealth();
    }, this.options.healthCheckInterval);

    console.log(`[MCP_REGISTRATION] Health checking started (interval: ${this.options.healthCheckInterval}ms)`);
  }

  /**
   * Setup cleanup handlers for graceful shutdown
   */
  private setupCleanupHandlers(): void {
    const cleanup = async () => {
      console.log('[MCP_REGISTRATION] Performing cleanup...');
      await this.unregister();
      process.exit(0);
    };

    // Handle various termination signals
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGHUP', cleanup);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('[MCP_REGISTRATION] Uncaught exception:', error);
      await this.unregister();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      console.error('[MCP_REGISTRATION] Unhandled rejection:', reason);
      await this.unregister();
      process.exit(1);
    });
  }

  /**
   * Generate endpoint URL for MCP service
   */
  private generateEndpoint(): string {
    switch (this.options.protocol) {
      case 'tcp':
        return `tcp://localhost:${this.options.port}`;
      case 'stdio':
        return 'stdio://local';
      case 'mcp':
      default:
        return `mcp://local/${this.config.id}`;
    }
  }

  /**
   * Generate health check endpoint
   */
  private generateHealthEndpoint(): string {
    return `local://mcp-health/${this.config.id}`;
  }

  /**
   * Get MCP server capabilities
   */
  private getMCPCapabilities(): string[] {
    return [
      'cli-create-session',
      'cli-navigate', 
      'cli-send-text',
      'cli-get-state',
      'cli-destroy-session',
      'tools/list',
      'tools/call'
    ];
  }

  /**
   * Get version from package.json
   */
  private getVersion(): string {
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        return packageData.version || '1.0.0';
      }
    } catch (_error) {
      // Ignore and use default
    }
    return '1.0.0';
  }

  /**
   * Get current service configuration
   */
  getConfig(): MCPServiceConfig {
    return { ...this.config };
  }

  /**
   * Check if service is currently registered
   */
  isServiceRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Get service file path
   */
  getServiceFilePath(): string {
    return this.serviceFilePath;
  }
}

/**
 * Factory function to create and register MCP service
 */
export async function createMCPServiceRegistration(
  mcpServer: CLIMCPServer,
  ptyManager: PTYManager,
  options?: ServiceRegistrationOptions
): Promise<MCPServiceRegistration> {
  const registration = new MCPServiceRegistration(options);
  registration.initialize(mcpServer, ptyManager);
  await registration.register();
  return registration;
}