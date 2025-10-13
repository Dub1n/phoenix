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
import { ProgressiveTimeoutManager, createOperationSpecificTimeoutManager } from './progressive-timeout-manager';
import { AsyncUtils, type ManagedInterval } from '../../utils/async-utils';
import { serialization, type SerializationOutcome } from '../../utils/serialization-utils';
import { emitSerializationWarnings } from '../../backend/backend-serialization-log';

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
  enableProgressiveTimeout?: boolean;
  registrationTimeout?: number;
  maxRegistrationRetries?: number;
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
  private healthCheckTimer?: ManagedInterval;
  private isRegistered: boolean = false;
  private serviceFilePath: string;
  private mcpServer?: CLIMCPServer;
  private ptyManager?: PTYManager;
  private progressiveTimeoutManager?: ProgressiveTimeoutManager;
  private registrationAttempts: number = 0;

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
      enableAutoCleanup: options.enableAutoCleanup ?? true,
      enableProgressiveTimeout: options.enableProgressiveTimeout ?? true,
      registrationTimeout: options.registrationTimeout || 30000, // 30 seconds default
      maxRegistrationRetries: options.maxRegistrationRetries || 3
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

    // Initialize progressive timeout manager if enabled
    if (this.options.enableProgressiveTimeout) {
      this.progressiveTimeoutManager = createOperationSpecificTimeoutManager('service-discovery');
      console.log('[MCP_REGISTRATION] Progressive timeout management enabled');
    }
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
    if (this.options.enableProgressiveTimeout && this.progressiveTimeoutManager) {
      // Use progressive timeout management for registration
      return this.progressiveTimeoutManager.executeWithProgressiveTimeout(
        `service-registration-${this.config.id}`,
        'service-discovery',
        () => this.performRegistration()
      );
    } else {
      // Use traditional timeout
      return this.performRegistrationWithTimeout();
    }
  }

  /**
   * Perform actual registration with progressive timeout support
   */
  private async performRegistration(): Promise<void> {
    // TODO: [TASK-MCP-007-REGISTRATION-001] Pattern: progressive-service-registration | Complexity: 6 | Dependencies: timeout-management,error-recovery
    // Context: Service registration with progressive timeout and retry logic for >90% success rate
    // Validation-Required: registration-success-rate, timeout-adaptation, error-recovery-effectiveness
    // Pattern-Info: { approach: "progressive-retry", alternatives: "fixed-timeout,exponential-backoff", trade-offs: "complexity-vs-reliability" }
    
    this.registrationAttempts++;
    
    try {
      // Ensure services directory exists
      if (!fs.existsSync(this.options.servicesDir)) {
        console.log(`[MCP_REGISTRATION] Creating services directory: ${this.options.servicesDir}`);
        fs.mkdirSync(this.options.servicesDir, { recursive: true });
      }

      // Validate service configuration before registration
      await this.validateServiceConfiguration();

      // Perform connectivity validation
      await this.validateConnectivity();

      // Write service registration file with retry logic
      await this.writeServiceRegistrationFile();
      
      this.isRegistered = true;
      console.log(`[MCP_REGISTRATION] Service registered: ${this.config.id} (attempt ${this.registrationAttempts})`);
      console.log(`[MCP_REGISTRATION] Service file: ${this.serviceFilePath}`);

      // Start health check monitoring
      this.startHealthChecking();

      // Setup cleanup on process exit
      if (this.options.enableAutoCleanup) {
        this.setupCleanupHandlers();
      }

    } catch (error) {
      console.error(`[MCP_REGISTRATION] Registration failed (attempt ${this.registrationAttempts}):`, error);
      
      // Reset attempt counter if max retries exceeded
      if (this.registrationAttempts >= this.options.maxRegistrationRetries) {
        this.registrationAttempts = 0;
      }
      
      throw new Error(`MCP service registration failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Perform registration with traditional timeout
   */
  private async performRegistrationWithTimeout(): Promise<void> {
    await AsyncUtils.withTimeout(
      this.performRegistration(),
      this.options.registrationTimeout,
      new Error(`Registration timed out after ${this.options.registrationTimeout}ms`)
    );
  }

  /**
   * Unregister MCP service from service discovery
   */
  async unregister(): Promise<void> {
    try {
      // Stop health checking
      this.healthCheckTimer?.stop();
      this.healthCheckTimer = undefined;

      // Cleanup progressive timeout manager
      this.cleanupProgressiveTimeout();

      // Remove service file
      if (fs.existsSync(this.serviceFilePath)) {
        fs.unlinkSync(this.serviceFilePath);
        console.log(`[MCP_REGISTRATION] Service unregistered: ${this.config.id}`);
      }

      this.isRegistered = false;
      this.registrationAttempts = 0;

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
        this.writeConfigToFile(this.serviceFilePath, 'mcp:service-registration:health-update');
        
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
    this.healthCheckTimer?.stop();

    this.healthCheckTimer = AsyncUtils.createInterval(async () => {
      await this.updateHealth();
    }, this.options.healthCheckInterval, { unref: true });

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
        const packageData = this.readJsonFile<Record<string, unknown>>(
          packagePath,
          'mcp:service-registration:package-json',
          {}
        );
        const version = packageData?.version;
        return typeof version === 'string' && version.length > 0 ? version : '1.0.0';
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

  /**
   * Validate service configuration before registration
   */
  private async validateServiceConfiguration(): Promise<void> {
    // TODO: [TASK-MCP-007-VALIDATION-001] Pattern: service-configuration-validation | Complexity: 4 | Dependencies: config-schema,endpoint-validation
    // Context: Comprehensive service configuration validation for reliable registration
    // Validation-Required: config-completeness, endpoint-validity, protocol-support
    // Pattern-Info: { approach: "schema-based-validation", alternatives: "runtime-validation,manual-checks", trade-offs: "validation-depth-vs-performance" }
    
    // Validate required configuration fields
    if (!this.config.id || !this.config.name || !this.config.endpoint) {
      throw new Error('Invalid service configuration: missing required fields');
    }

    // Validate endpoint format
    if (!this.isValidEndpoint(this.config.endpoint)) {
      throw new Error(`Invalid endpoint format: ${this.config.endpoint}`);
    }

    // Validate protocol support
    if (!['mcp', 'stdio', 'tcp'].includes(this.config.protocol)) {
      throw new Error(`Unsupported protocol: ${this.config.protocol}`);
    }

    // Validate port for TCP protocol
    if (this.config.protocol === 'tcp' && (!this.config.port || this.config.port <= 0)) {
      throw new Error('TCP protocol requires valid port number');
    }

    console.log('[MCP_REGISTRATION] Service configuration validated');
  }

  /**
   * Validate connectivity before registration
   */
  private async validateConnectivity(): Promise<void> {
    // TODO: [TASK-MCP-007-CONNECTIVITY-001] Pattern: connectivity-validation | Complexity: 7 | Dependencies: network-checks,service-availability
    // Context: Connectivity validation with progressive timeout and error recovery
    // Validation-Required: network-connectivity, service-availability, response-validation
    // Pattern-Info: { approach: "progressive-validation", alternatives: "ping-check,service-call", trade-offs: "validation-thoroughness-vs-speed" }
    
    try {
      // Validate MCP server is responsive
      if (this.mcpServer) {
        const tools = this.mcpServer.getAvailableTools();
        if (tools.length === 0) {
          throw new Error('MCP server has no available tools');
        }
      }

      // Validate PTY manager is functional
      if (this.ptyManager) {
        const sessions = this.ptyManager.getActiveSessions();
        console.log(`[MCP_REGISTRATION] PTY manager functional with ${sessions.length} sessions`);
      }

      // Validate services directory is writable
      try {
        const testFile = path.join(this.options.servicesDir, 'test-write.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        throw new Error(`Services directory not writable: ${this.options.servicesDir}`);
      }

      console.log('[MCP_REGISTRATION] Connectivity validation passed');
      
    } catch (error) {
      console.error('[MCP_REGISTRATION] Connectivity validation failed:', error);
      throw new Error(`Connectivity validation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Write service registration file with error handling
   */
  private async writeServiceRegistrationFile(): Promise<void> {
    try {
      // Update last seen timestamp
      this.config.lastSeen = Date.now();
      
      // Write service registration file atomically
      const tempFilePath = `${this.serviceFilePath}.tmp`;
      this.writeConfigToFile(tempFilePath, 'mcp:service-registration:temp-config');
      fs.renameSync(tempFilePath, this.serviceFilePath);
      
      console.log('[MCP_REGISTRATION] Service registration file written successfully');
      
    } catch (error) {
      console.error('[MCP_REGISTRATION] Failed to write service registration file:', error);
      throw new Error(`Failed to write service registration: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Validate endpoint format
   */
  private isValidEndpoint(endpoint: string): boolean {
    // Basic endpoint format validation
    const patterns = [
      /^mcp:\/\/local\/[\w-]+$/, // MCP protocol
      /^stdio:\/\/local$/, // STDIO protocol
      /^tcp:\/\/localhost:\d+$/ // TCP protocol
    ];
    
    return patterns.some(pattern => pattern.test(endpoint));
  }

  /**
   * Get progressive timeout manager metrics
   */
  getTimeoutMetrics() {
    return this.progressiveTimeoutManager?.getAdaptationMetrics() || null;
  }

  /**
   * Reset progressive timeout context
   */
  resetTimeoutContext(): void {
    if (this.progressiveTimeoutManager) {
      this.progressiveTimeoutManager.resetOperationContext(`service-registration-${this.config.id}`);
      console.log('[MCP_REGISTRATION] Progressive timeout context reset');
    }
  }

  private writeConfigToFile(filePath: string, context: string): void {
    const outcome = this.serializeWithMetrics(this.config, context, 2);
    fs.writeFileSync(filePath, outcome.value ?? '{}');
  }

  private readJsonFile<T>(filePath: string, context: string, fallback: T): T {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const outcome = serialization
      .fromJson<T>(raw)
      .context(context)
      .fallback(fallback)
      .parse();

    emitSerializationWarnings(context, outcome);

    if (!outcome.ok || outcome.value === undefined) {
      return fallback;
    }

    return outcome.value;
  }

  private serializeWithMetrics(
    value: unknown,
    context: string,
    prettySpacing?: number
  ): SerializationOutcome<string> {
    const builder = serialization.json(value).context(context);
    if (typeof prettySpacing === 'number') {
      builder.pretty(prettySpacing);
    }
    builder.fallback('{}');
    const outcome = builder.stringify();
    emitSerializationWarnings(context, outcome);
    return outcome;
  }

  /**
   * Cleanup progressive timeout manager
   */
  private cleanupProgressiveTimeout(): void {
    if (this.progressiveTimeoutManager) {
      this.progressiveTimeoutManager.cleanup();
      this.progressiveTimeoutManager = undefined;
    }
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
