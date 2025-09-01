/**
 * @fileoverview Generic Service Discovery System
 * @author Claude Code Implementation
 * @created 2025-08-29
 * 
 * Multi-strategy service discovery system that replaces hardcoded backend discovery
 * with registry-based, endpoint scanning, and configuration-based discovery strategies.
 * 
 * TASK: TASK-GENERIC-003 - Generic Service Discovery Mechanism
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as WebSocket from 'ws';
import * as net from 'net';
import { BackendConfig } from '../types/universal-skin-engine-types';
import { backendIntegrationConfig } from './backend-integration-config';
import { createTemplumError, isTemplumError } from '../types/templum-types';

export interface DiscoveredService {
  id: string;
  config: BackendConfig;
  discoveryMethod: 'registry' | 'scanning' | 'configuration';
  confidence: number; // 0.0 to 1.0
  timestamp: number;
}

export interface ServiceRegistry {
  services: Record<string, {
    id: string;
    endpoint: string;
    protocol: 'http' | 'websocket' | 'ipc';
    health: string;
    capabilities: string[];
    version: string;
    registrationTime: number;
    lastSeen: number;
  }>;
  version: number;
  lastUpdated: number;
}

export interface DiscoveryStrategy {
  readonly name: string;
  readonly priority: number; // Higher numbers = higher priority
  discover(): Promise<DiscoveredService[]>;
}

export interface ServiceDiscoveryOptions {
  strategies?: DiscoveryStrategy[];
  enableRegistryDiscovery?: boolean;
  enableEndpointScanning?: boolean;
  enableConfigurationDiscovery?: boolean;
  registryPath?: string;
  scanPorts?: number[];
  scanHosts?: string[];
  configurationPath?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Multi-strategy service discovery system
 * Replaces hardcoded backend discovery with intelligent discovery strategies
 */
export class ServiceDiscovery extends EventEmitter {
  private strategies: DiscoveryStrategy[] = [];
  private discoveredServices: Map<string, DiscoveredService> = new Map();
  private options: Required<ServiceDiscoveryOptions>;

  constructor(options: ServiceDiscoveryOptions = {}) {
    super();
    
    this.options = {
      strategies: options.strategies || [],
      enableRegistryDiscovery: options.enableRegistryDiscovery ?? true,
      enableEndpointScanning: options.enableEndpointScanning ?? true,
      enableConfigurationDiscovery: options.enableConfigurationDiscovery ?? true,
      registryPath: options.registryPath || path.join(process.cwd(), '.templum', 'service-registry.json'),
      // PHASE 1: Use configurable port scanning from feature flag system
      scanPorts: options.scanPorts || backendIntegrationConfig.getConfig().serviceDiscovery.scanPorts,
      scanHosts: options.scanHosts || ['localhost', '127.0.0.1'],
      configurationPath: options.configurationPath || path.join(process.cwd(), '.templum', 'backend-config.json'),
      timeout: options.timeout || 5000,
      maxRetries: options.maxRetries || 2
    };

    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default discovery strategies
   */
  private initializeDefaultStrategies(): void {
    // Clear existing strategies if user provided custom ones
    if (this.options.strategies.length > 0) {
      this.strategies = [...this.options.strategies];
      return;
    }

    // Add registry-based discovery (highest priority)
    if (this.options.enableRegistryDiscovery) {
      this.strategies.push(new RegistryBasedDiscoveryStrategy({
        registryPath: this.options.registryPath,
        timeout: this.options.timeout
      }));
    }

    // Add configuration-based discovery (medium priority) 
    if (this.options.enableConfigurationDiscovery) {
      this.strategies.push(new ConfigurationBasedDiscoveryStrategy({
        configurationPath: this.options.configurationPath,
        timeout: this.options.timeout
      }));
    }

    // Add endpoint scanning discovery (lowest priority, most resource intensive)
    if (this.options.enableEndpointScanning) {
      this.strategies.push(new EndpointScanningDiscoveryStrategy({
        scanPorts: this.options.scanPorts,
        scanHosts: this.options.scanHosts,
        timeout: this.options.timeout,
        maxRetries: this.options.maxRetries
      }));
    }

    // Sort strategies by priority (higher priority first)
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Discover all available services using enabled strategies
   */
  async discoverServices(): Promise<DiscoveredService[]> {
    console.log(`[SERVICE_DISCOVERY] Starting discovery with ${this.strategies.length} strategies`);
    this.emit('discoveryStarted', { strategies: this.strategies.length });

    const allDiscoveredServices: DiscoveredService[] = [];
    const discoveryPromises = this.strategies.map(async (strategy) => {
      try {
        console.log(`[SERVICE_DISCOVERY] Running ${strategy.name} strategy (priority: ${strategy.priority})`);
        const services = await strategy.discover();
        console.log(`[SERVICE_DISCOVERY] ${strategy.name} discovered ${services.length} services`);
        return services;
      } catch (error) {
        console.warn(`[SERVICE_DISCOVERY] Strategy ${strategy.name} failed:`, error);
        this.emit('strategyError', { strategy: strategy.name, error });
        return [];
      }
    });

    const results = await Promise.allSettled(discoveryPromises);
    
    // Collect all discovered services
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allDiscoveredServices.push(...result.value);
      }
    }

    // Deduplicate and merge services (prefer higher confidence, newer discoveries)
    const uniqueServices = this.deduplicateServices(allDiscoveredServices);
    
    // Update internal cache
    this.discoveredServices.clear();
    for (const service of uniqueServices) {
      this.discoveredServices.set(service.id, service);
    }

    console.log(`[SERVICE_DISCOVERY] Discovery completed: ${uniqueServices.length} unique services found`);
    this.emit('discoveryCompleted', { 
      discovered: uniqueServices.length, 
      strategies: this.strategies.length 
    });

    return uniqueServices;
  }

  /**
   * Deduplicate discovered services, preferring higher confidence and newer discoveries
   */
  private deduplicateServices(services: DiscoveredService[]): DiscoveredService[] {
    const serviceMap = new Map<string, DiscoveredService>();

    for (const service of services) {
      const existing = serviceMap.get(service.id);
      
      if (!existing) {
        serviceMap.set(service.id, service);
      } else {
        // Prefer higher confidence, then newer timestamp
        if (service.confidence > existing.confidence || 
           (service.confidence === existing.confidence && service.timestamp > existing.timestamp)) {
          serviceMap.set(service.id, service);
        }
      }
    }

    return Array.from(serviceMap.values());
  }

  /**
   * Get cached discovered services
   */
  getDiscoveredServices(): DiscoveredService[] {
    return Array.from(this.discoveredServices.values());
  }

  /**
   * Get discovered service by ID
   */
  getServiceById(id: string): DiscoveredService | undefined {
    return this.discoveredServices.get(id);
  }

  /**
   * Convert discovered services to backend configs
   */
  getBackendConfigs(): Map<string, BackendConfig> {
    const configs = new Map<string, BackendConfig>();
    
    for (const [id, service] of Array.from(this.discoveredServices.entries())) {
      configs.set(id, service.config);
    }

    return configs;
  }

  /**
   * Add a custom discovery strategy
   */
  addStrategy(strategy: DiscoveryStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a discovery strategy by name
   */
  removeStrategy(name: string): boolean {
    const initialLength = this.strategies.length;
    this.strategies = this.strategies.filter(s => s.name !== name);
    return this.strategies.length < initialLength;
  }
}

/**
 * Enhanced registry-based discovery strategy
 * Supports both single registry file AND services directory for flexible discovery
 * - Single file: ~/.templum/service-registry.json (legacy support)
 * - Directory: ~/.templum/services/*.json (new auto-discovery)
 */
export class RegistryBasedDiscoveryStrategy implements DiscoveryStrategy {
  readonly name = 'registry-based';
  readonly priority = 100;

  constructor(private options: { 
    registryPath: string; 
    timeout: number;
    servicesDir?: string; // Optional services directory
  }) {
    // Default services directory to same folder as registry
    if (!this.options.servicesDir) {
      const registryDir = path.dirname(this.options.registryPath);
      this.options.servicesDir = path.join(registryDir, 'services');
    }
  }

  async discover(): Promise<DiscoveredService[]> {
    const services: DiscoveredService[] = [];

    // Discover from both single registry file AND services directory
    const singleFileServices = await this.discoverFromRegistryFile();
    const directoryServices = await this.discoverFromServicesDirectory();

    services.push(...singleFileServices, ...directoryServices);
    return services;
  }

  /**
   * Legacy discovery from single registry file
   */
  private async discoverFromRegistryFile(): Promise<DiscoveredService[]> {
    const services: DiscoveredService[] = [];

    try {
      if (!fs.existsSync(this.options.registryPath)) {
        console.log(`[REGISTRY_DISCOVERY] Registry file not found: ${this.options.registryPath}`);
        return services;
      }

      const registryData = JSON.parse(fs.readFileSync(this.options.registryPath, 'utf-8')) as ServiceRegistry;
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [serviceId, registration] of Object.entries(registryData.services)) {
        // Skip stale registrations
        if (now - registration.lastSeen > staleThreshold) {
          console.log(`[REGISTRY_DISCOVERY] Skipping stale registration for ${serviceId}`);
          continue;
        }

        // Validate health endpoint if available
        const isHealthy = await this.validateServiceHealth(registration.health);
        if (!isHealthy) {
          console.log(`[REGISTRY_DISCOVERY] Service ${serviceId} failed health check`);
          continue;
        }

        const config: BackendConfig = {
          service: serviceId,
          version: registration.version,
          protocol: registration.protocol,
          endpoint: registration.endpoint,
          timeout: this.options.timeout,
          retries: 2,
          keepAlive: true,
          authentication: { type: 'none' },
          healthEndpoint: registration.health
        };

        services.push({
          id: serviceId,
          config,
          discoveryMethod: 'registry',
          confidence: 0.9, // High confidence for registry-based discovery
          timestamp: now
        });

        console.log(`[REGISTRY_DISCOVERY] Discovered ${serviceId} via registry file`);
      }
    } catch (error) {
      console.warn(`[REGISTRY_DISCOVERY] Registry file discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return services;
  }

  /**
   * Enhanced discovery from services directory
   * Each .json file represents a self-registered backend service
   * 
   * TODO: NEEDS PROPER IMPLEMENTATION - This is a temporary workaround
   * Should properly resolve to user's home directory ~/.templum/services/
   * Currently searches both project directory and parent directory fallback
   */
  private async discoverFromServicesDirectory(): Promise<DiscoveredService[]> {
    const services: DiscoveredService[] = [];

    try {
      // Check primary services directory
      if (!this.options.servicesDir || !fs.existsSync(this.options.servicesDir)) {
        console.log(`[REGISTRY_DISCOVERY] Services directory not found: ${this.options.servicesDir}`);
        
        // FIXED: Check VDL_Vault root .templum/services directory (shared multi-repo location)
        // Navigate up from Templum project to VDL_Vault root
        const vdlVaultTemplumDir = path.join(process.cwd(), '..', '.templum', 'services');
        if (fs.existsSync(vdlVaultTemplumDir)) {
          console.log(`[REGISTRY_DISCOVERY] Using VDL_Vault shared directory: ${vdlVaultTemplumDir}`);
          const vdlServices = await this.discoverFromDirectory(vdlVaultTemplumDir);
          services.push(...vdlServices);
        } else {
          console.log(`[REGISTRY_DISCOVERY] VDL_Vault shared directory not found: ${vdlVaultTemplumDir}`);
        }
        
        return services;
      }

      // Use primary services directory
      const primaryServices = await this.discoverFromDirectory(this.options.servicesDir);
      services.push(...primaryServices);
      
    } catch (error) {
      console.warn(`[REGISTRY_DISCOVERY] Services directory discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return services;
  }

  /**
   * Helper method to discover services from any directory
   */
  private async discoverFromDirectory(servicesDir: string): Promise<DiscoveredService[]> {
    const services: DiscoveredService[] = [];
    
    try {
      const serviceFiles = fs.readdirSync(servicesDir)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(servicesDir, file));

      console.log(`[REGISTRY_DISCOVERY] Scanning ${serviceFiles.length} service files in ${servicesDir}`);

      for (const filePath of serviceFiles) {
        try {
          const serviceData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          // Validate required fields
          if (!serviceData.id || !serviceData.endpoint) {
            console.warn(`[REGISTRY_DISCOVERY] Invalid service file ${filePath}: missing id or endpoint`);
            continue;
          }

          // Check if process is still running (if pid provided)
          if (serviceData.pid && !this.isProcessRunning(serviceData.pid)) {
            console.log(`[REGISTRY_DISCOVERY] Process ${serviceData.pid} not running, removing stale service file`);
            fs.unlinkSync(filePath); // Auto-cleanup dead services
            continue;
          }

          // Validate health endpoint if available
          const healthEndpoint = serviceData.health || `${serviceData.endpoint}/health`;
          const isHealthy = await this.validateServiceHealth(healthEndpoint);
          if (!isHealthy) {
            console.log(`[REGISTRY_DISCOVERY] Service ${serviceData.id} failed health check`);
            continue;
          }

          const config: BackendConfig = {
            service: serviceData.id,
            version: serviceData.version || '1.0.0',
            protocol: serviceData.protocol || 'http',
            endpoint: serviceData.endpoint,
            timeout: this.options.timeout,
            retries: 2,
            keepAlive: true,
            authentication: serviceData.authentication || { type: 'none' },
            healthEndpoint: healthEndpoint
          };

          services.push({
            id: serviceData.id,
            config,
            discoveryMethod: 'registry',
            confidence: 0.95, // Very high confidence for active process-based discovery
            timestamp: Date.now()
          });

          console.log(`[REGISTRY_DISCOVERY] Discovered ${serviceData.id} via services directory (PID: ${serviceData.pid})`);

        } catch (error) {
          console.warn(`[REGISTRY_DISCOVERY] Failed to parse service file ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.warn(`[REGISTRY_DISCOVERY] Directory discovery failed for ${servicesDir}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return services;
  }

  /**
   * Check if a process ID is still running
   */
  private isProcessRunning(pid: number): boolean {
    try {
      // process.kill with signal 0 checks if process exists without killing it
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async validateServiceHealth(healthEndpoint?: string): Promise<boolean> {
    if (!healthEndpoint) return true; // No health check specified

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), this.options.timeout);
      
      const request = http.get(healthEndpoint, (res) => {
        clearTimeout(timeout);
        resolve(res.statusCode === 200);
      });

      request.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }
}

/**
 * Configuration-based discovery strategy
 * Reads backend configurations from user-specified configuration files
 */
export class ConfigurationBasedDiscoveryStrategy implements DiscoveryStrategy {
  readonly name = 'configuration-based';
  readonly priority = 75;

  constructor(private options: { configurationPath: string; timeout: number }) {}

  async discover(): Promise<DiscoveredService[]> {
    const services: DiscoveredService[] = [];

    try {
      if (!fs.existsSync(this.options.configurationPath)) {
        console.log(`[CONFIG_DISCOVERY] Configuration file not found: ${this.options.configurationPath}`);
        return services;
      }

      const configData = JSON.parse(fs.readFileSync(this.options.configurationPath, 'utf-8'));
      const now = Date.now();

      if (!configData.backends || !Array.isArray(configData.backends)) {
        console.warn(`[CONFIG_DISCOVERY] Invalid configuration format in ${this.options.configurationPath}`);
        return services;
      }

      for (const backendConfig of configData.backends) {
        if (!this.validateBackendConfig(backendConfig)) {
          console.warn(`[CONFIG_DISCOVERY] Invalid backend configuration:`, backendConfig);
          continue;
        }

        const config: BackendConfig = {
          service: backendConfig.service,
          version: backendConfig.version || '1.0.0',
          protocol: backendConfig.protocol,
          endpoint: backendConfig.endpoint,
          timeout: backendConfig.timeout || this.options.timeout,
          retries: backendConfig.retries || 2,
          keepAlive: backendConfig.keepAlive ?? true,
          authentication: backendConfig.authentication || { type: 'none' },
          healthEndpoint: backendConfig.healthEndpoint,
          capabilitiesEndpoint: backendConfig.capabilitiesEndpoint,
          options: backendConfig.options
        };

        services.push({
          id: backendConfig.service,
          config,
          discoveryMethod: 'configuration',
          confidence: 0.8, // Medium-high confidence for configuration-based
          timestamp: now
        });

        console.log(`[CONFIG_DISCOVERY] Discovered ${backendConfig.service} via configuration`);
      }
    } catch (error) {
      throw createTemplumError(
        `Configuration discovery failed: ${error instanceof Error ? error.message : String(error)}`,
        'CONFIG_DISCOVERY_ERROR', 
        'configuration'
      );
    }

    return services;
  }

  private validateBackendConfig(config: any): boolean {
    return config &&
           typeof config.service === 'string' &&
           typeof config.protocol === 'string' &&
           typeof config.endpoint === 'string' &&
           ['http', 'websocket', 'ipc'].includes(config.protocol);
  }
}

/**
 * Endpoint scanning discovery strategy
 * Scans common ports and protocols for `/api/skin` endpoints
 */
export class EndpointScanningDiscoveryStrategy implements DiscoveryStrategy {
  readonly name = 'endpoint-scanning';
  readonly priority = 50;

  constructor(private options: {
    scanPorts: number[];
    scanHosts: string[];
    timeout: number;
    maxRetries: number;
  }) {}

  async discover(): Promise<DiscoveredService[]> {
    const services: DiscoveredService[] = [];
    const scanPromises: Promise<DiscoveredService | null>[] = [];

    console.log(`[SCAN_DISCOVERY] Scanning ${this.options.scanHosts.length} hosts on ${this.options.scanPorts.length} ports`);

    // Scan all host/port combinations
    for (const host of this.options.scanHosts) {
      for (const port of this.options.scanPorts) {
        // HTTP scanning
        scanPromises.push(this.scanHttpEndpoint(host, port));
        
        // WebSocket scanning
        scanPromises.push(this.scanWebSocketEndpoint(host, port));
        
        // IPC scanning (for localhost only)
        if (host === 'localhost' || host === '127.0.0.1') {
          scanPromises.push(this.scanIpcEndpoint(host, port));
        }
      }
    }

    // Wait for all scans to complete
    const results = await Promise.allSettled(scanPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        services.push(result.value);
      }
    }

    console.log(`[SCAN_DISCOVERY] Completed scanning: ${services.length} services discovered`);
    return services;
  }

  private async scanHttpEndpoint(host: string, port: number): Promise<DiscoveredService | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), this.options.timeout);
      
      const skinEndpoint = `http://${host}:${port}/api/skin`;
      const request = http.get(skinEndpoint, (res) => {
        clearTimeout(timeout);
        
        if (res.statusCode === 200) {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const skinDefinition = JSON.parse(data);
              if (skinDefinition.service) {
                const config: BackendConfig = {
                  service: skinDefinition.service,
                  version: skinDefinition.version || '1.0.0',
                  protocol: 'http',
                  endpoint: `http://${host}:${port}`,
                  timeout: this.options.timeout,
                  retries: this.options.maxRetries,
                  keepAlive: true,
                  authentication: { type: 'none' },
                  healthEndpoint: `http://${host}:${port}/api/health`,
                  capabilitiesEndpoint: `http://${host}:${port}/api/capabilities`
                };

                resolve({
                  id: skinDefinition.service,
                  config,
                  discoveryMethod: 'scanning',
                  confidence: 0.7, // Medium confidence for scanning
                  timestamp: Date.now()
                });
                return;
              }
            } catch (error) {
              // Invalid skin definition
            }
          });
        }
        resolve(null);
      });

      request.on('error', () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });
  }

  private async scanWebSocketEndpoint(host: string, port: number): Promise<DiscoveredService | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), this.options.timeout);
      
      try {
        const ws = new WebSocket(`ws://${host}:${port}`);
        
        ws.on('open', () => {
          // Send skin definition request
          ws.send(JSON.stringify({
            id: 'scan-' + Date.now(),
            type: 'getSkinDefinition',
            timestamp: Date.now()
          }));
        });

        ws.on('message', (data: any) => {
          clearTimeout(timeout);
          try {
            const response = JSON.parse(data.toString());
            if (response.type === 'skin_definition_response' && response.data) {
              const skinDefinition = response.data;
              
              const config: BackendConfig = {
                service: skinDefinition.service || 'unknown-websocket',
                version: skinDefinition.version || '1.0.0',
                protocol: 'websocket',
                endpoint: `ws://${host}:${port}`,
                timeout: this.options.timeout,
                retries: this.options.maxRetries,
                keepAlive: true,
                authentication: { type: 'none' }
              };

              resolve({
                id: skinDefinition.service || 'unknown-websocket',
                config,
                discoveryMethod: 'scanning',
                confidence: 0.6, // Lower confidence for WebSocket scanning
                timestamp: Date.now()
              });
              
              ws.close();
              return;
            }
          } catch (error) {
            // Invalid response
          }
          
          ws.close();
          resolve(null);
        });

        ws.on('error', () => {
          clearTimeout(timeout);
          resolve(null);
        });

      } catch (error) {
        clearTimeout(timeout);
        resolve(null);
      }
    });
  }

  private async scanIpcEndpoint(host: string, port: number): Promise<DiscoveredService | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), this.options.timeout);
      
      const socket = new net.Socket();
      
      socket.connect(port, host, () => {
        // Send skin definition request
        const message = JSON.stringify({
          id: 'scan-' + Date.now(),
          type: 'getSkinDefinition',
          timestamp: Date.now()
        }) + '\n';
        
        socket.write(message);
      });

      let buffer = '';
      socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.type === 'skin_definition_response' && response.data) {
                clearTimeout(timeout);
                
                const skinDefinition = response.data;
                const config: BackendConfig = {
                  service: skinDefinition.service || 'unknown-ipc',
                  version: skinDefinition.version || '1.0.0',
                  protocol: 'ipc',
                  endpoint: `ipc://${host}:${port}`,
                  timeout: this.options.timeout,
                  retries: this.options.maxRetries,
                  keepAlive: true,
                  authentication: { type: 'none' }
                };

                resolve({
                  id: skinDefinition.service || 'unknown-ipc',
                  config,
                  discoveryMethod: 'scanning',
                  confidence: 0.6,
                  timestamp: Date.now()
                });
                
                socket.destroy();
                return;
              }
            } catch (error) {
              // Invalid response, continue listening
            }
          }
        }
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve(null);
      });

      socket.on('close', () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });
  }
}