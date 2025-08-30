/**---
 * title: [Templum Registration Service - Auto-Discovery Integration]
 * tags: [Integration, Templum, Auto-Registration, Service-Discovery]
 * provides: [Service-Registration, Templum-Discovery, Lifecycle-Management]
 * requires: [File-System, Path-Utils, Process-Management]
 * description: [Automatic service registration for Templum 1.2 discovery with lifecycle management]
 * ---*/

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TemplumServiceDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'analysis-service';
  endpoint: string;
  port: number;
  protocol: 'http';
  capabilities: string[];
  status: 'active' | 'inactive';
  pid: number;
  startTime: number;
  lastHeartbeat: number;
  metadata: {
    backend: string;
    templumCompatible: boolean;
    supportedCommands: string[];
  };
}

/**
 * Templum Registration Service
 * 
 * Provides automatic service registration for Templum 1.2 discovery.
 * Handles service file creation, heartbeat updates, and cleanup.
 */
export class TemplumRegistrationService {
  private serviceDefinition: TemplumServiceDefinition;
  private registrationPath: string;
  private heartbeatInterval?: NodeJS.Timeout;
  private isRegistered = false;

  constructor(private config: {
    serviceName: string;
    port: number;
    version: string;
    capabilities: string[];
  }) {
    // Generate service definition
    this.serviceDefinition = {
      id: `haruspex-analysis-${process.pid}`,
      name: this.config.serviceName,
      version: this.config.version,
      description: 'Advanced code analysis and prediction service',
      type: 'analysis-service',
      endpoint: `http://localhost:${this.config.port}`,
      port: this.config.port,
      protocol: 'http',
      capabilities: this.config.capabilities,
      status: 'active',
      pid: process.pid,
      startTime: Date.now(),
      lastHeartbeat: Date.now(),
      metadata: {
        backend: 'haruspex-2.1',
        templumCompatible: true,
        supportedCommands: [
          'haruspex.analyzeCode',
          'haruspex.predictEvolution',
          'haruspex.getDiagnostics',
          'haruspex.getHealthStatus',
          'haruspex.clearCache',
          'haruspex.refreshModels'
        ]
      }
    };

    // Determine registration path
    const homeDir = os.homedir();
    const templumDir = path.join(homeDir, '.templum', 'services');
    this.registrationPath = path.join(templumDir, `${this.serviceDefinition.id}.json`);
  }

  /**
   * Register service with Templum
   */
  async register(): Promise<void> {
    if (this.isRegistered) {
      console.warn('Templum Registration Service: Already registered');
      return;
    }

    try {
      // Ensure services directory exists
      const servicesDir = path.dirname(this.registrationPath);
      await this.ensureDirectoryExists(servicesDir);

      // Write service registration file
      await this.writeServiceFile();

      // Start heartbeat updates
      this.startHeartbeat();

      // Setup cleanup on process exit
      this.setupCleanupHandlers();

      this.isRegistered = true;
      console.log(`Templum Registration Service: Registered at ${this.registrationPath}`);
      console.log(`Templum Registration Service: Service ID ${this.serviceDefinition.id}`);
      console.log(`Templum Registration Service: Endpoint ${this.serviceDefinition.endpoint}`);

    } catch (error) {
      console.error('Templum Registration Service: Failed to register:', error);
      throw error;
    }
  }

  /**
   * Unregister service from Templum
   */
  async unregister(): Promise<void> {
    if (!this.isRegistered) {
      return;
    }

    try {
      // Stop heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = undefined;
      }

      // Remove service file
      if (fs.existsSync(this.registrationPath)) {
        await fs.promises.unlink(this.registrationPath);
        console.log(`Templum Registration Service: Unregistered ${this.serviceDefinition.id}`);
      }

      this.isRegistered = false;

    } catch (error) {
      console.error('Templum Registration Service: Failed to unregister:', error);
    }
  }

  /**
   * Update service status
   */
  async updateStatus(status: 'active' | 'inactive'): Promise<void> {
    if (!this.isRegistered) {
      return;
    }

    this.serviceDefinition.status = status;
    this.serviceDefinition.lastHeartbeat = Date.now();

    try {
      await this.writeServiceFile();
    } catch (error) {
      console.error('Templum Registration Service: Failed to update status:', error);
    }
  }

  /**
   * Get current service definition
   */
  getServiceDefinition(): TemplumServiceDefinition {
    return { ...this.serviceDefinition };
  }

  /**
   * Check if service is registered
   */
  isServiceRegistered(): boolean {
    return this.isRegistered;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
      console.log(`Templum Registration Service: Created directory ${dirPath}`);
    }
  }

  private async writeServiceFile(): Promise<void> {
    const serviceContent = JSON.stringify(this.serviceDefinition, null, 2);
    await fs.promises.writeFile(this.registrationPath, serviceContent, 'utf8');
  }

  private startHeartbeat(): void {
    // Update heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(async () => {
      this.serviceDefinition.lastHeartbeat = Date.now();
      
      try {
        await this.writeServiceFile();
      } catch (error) {
        console.error('Templum Registration Service: Heartbeat update failed:', error);
      }
    }, 30000);
  }

  private setupCleanupHandlers(): void {
    const cleanup = async () => {
      console.log('Templum Registration Service: Cleaning up...');
      await this.unregister();
    };

    // Handle various exit scenarios
    process.on('SIGINT', async () => {
      await cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await cleanup();
      process.exit(0);
    });

    process.on('beforeExit', async () => {
      await cleanup();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      await cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      console.error('Unhandled rejection:', reason);
      await cleanup();
      process.exit(1);
    });
  }
}

/**
 * Factory function to create and register Templum service
 */
export async function createTemplumRegistration(config: {
  serviceName: string;
  port: number;
  version: string;
  capabilities: string[];
}): Promise<TemplumRegistrationService> {
  const service = new TemplumRegistrationService(config);
  await service.register();
  return service;
}

export default TemplumRegistrationService;