/**
 * @fileoverview Generic Service Discovery System with File System Watching
 * @author Claude Code Implementation
 * @created 2025-08-29
 * @updated 2025-09-03 - TASK-CLI-015: Added dynamic file system watching
 * 
 * Multi-strategy service discovery system that replaces hardcoded backend discovery
 * with registry-based, endpoint scanning, and configuration-based discovery strategies.
 * Enhanced with real-time file system watching for dynamic backend discovery.
 * 
 * TASK: TASK-GENERIC-003 - Generic Service Discovery Mechanism
 * TASK: TASK-CLI-015 - File System Watching for Dynamic Backend Discovery
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
// Unused import removed: https
import { WebSocket } from 'ws';
import * as net from 'net';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import type { TypedEventMap } from '../utils/event-utils';
import { BackendConfig } from '../types/universal-skin-engine-types';
import { backendIntegrationConfig } from './backend-integration-config';
import { createTemplumError } from '../types/templum-types';
import { SemanticValidators, TypeGuards, TypeValidators } from '../utils/type-guards';
// Unused import removed: isTemplumError

import { serialization, type JsonParseOptions, type JsonStringifyOptions, type SerializationOutcome } from '../utils/serialization-utils';
import { emitSerializationWarnings, getBackendSerializationLogger } from './backend-serialization-log';
import { buildServiceRegistryDefaults } from './defaults/serialization-defaults';
import { serviceRegistryEntrySchema, serviceRegistrySchema, type ServiceRegistryEntry, type ServiceRegistryDocument } from './schemas/serialization-registry';
import {
  buildBackendConfigFromManifest,
  manifestFromRegistryEntry,
  normalizeServiceManifest,
  type NormalizedServiceManifest,
} from './schemas/service-manifest';
import { performServiceHealthCheck } from './service-health-check';
import {
  ServiceDiscoveryFileWatcher,
  resolveWatchDirectories,
  type ServiceFileEvent,
} from './service-discovery/file-watcher';
import { createTimeout, TIMEOUTS } from '../utils/async-utils';
import type { ManagedTimeout } from '../utils/async-utils';
import type { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';

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
  enableFileWatching?: boolean; // NEW: Enable file system watching for dynamic discovery
  enableHealthChecks?: boolean; // NEW: Enable health endpoint validation (default: true)
  registryPath?: string;
  scanPorts?: number[];
  scanHosts?: string[];
  configurationPath?: string;
  timeout?: number;
  maxRetries?: number;
  watchDirectories?: string[];
}

const SUPPORTED_PROTOCOLS: ReadonlyArray<BackendConfig['protocol']> = ['ipc', 'http', 'websocket'];

interface ParsedServiceDescriptor {
  service: DiscoveredService;
  pid?: number;
}

interface ServiceHealthValidationContext {
  manifest: NormalizedServiceManifest;
  config: BackendConfig;
  logger: Logger;
  context: string;
}

interface ServiceDescriptorContext {
  logPrefix: string;
  filePath: string;
  timeout: number;
  enforceHealthCheck: boolean;
  discoveryMethod: DiscoveredService['discoveryMethod'];
  confidence?: number;
  removeOnStale?: boolean;
  logger: Logger;
  isProcessRunning: (pid: number) => boolean;
  validateServiceHealth: (validationContext: ServiceHealthValidationContext) => Promise<boolean>;
}

const serviceDiscoveryLogger = getBackendSerializationLogger('service-discovery');
const registryLogger = serviceDiscoveryLogger.child('registry');
const configurationLogger = serviceDiscoveryLogger.child('configuration');
const fileWatcherLogger = serviceDiscoveryLogger.child('file-watcher');
const scanningLogger = serviceDiscoveryLogger.child('scanning');

interface ServiceDiscoveryEvents extends TypedEventMap {
  discoveryStarted: (payload: { strategies: number }) => void;
  strategyError: (payload: { strategy: string; error: unknown }) => void;
  discoveryCompleted: (payload: { discovered: number; strategies: number }) => void;
  watcherError: (error: unknown) => void;
  serviceDiscovered: (payload: { service: DiscoveredService; eventType: ServiceFileEvent; filePath: string }) => void;
  serviceRemoved: (payload: { serviceId: string; filePath: string }) => void;
}

function unwrapSerializationOutcome<T>(context: string, outcome: SerializationOutcome<T>): T | null {
  emitSerializationWarnings(context, outcome as SerializationOutcome<unknown>);
  if (!outcome.ok || outcome.value === undefined) {
    return null;
  }
  return outcome.value;
}

function parseJsonString<T>(context: string, input: string, options?: JsonParseOptions<T>): T | null {
  const outcome = serialization.fromJson<T>(input, options).context(context).parse();
  return unwrapSerializationOutcome(context, outcome);
}

function parseJsonFile<T>(
  filePath: string,
  context: string,
  options?: JsonParseOptions<T>,
  logger: Logger = serviceDiscoveryLogger
): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return parseJsonString(context, raw, options);
  } catch (error) {
    const templumError = ErrorHandler.handle(error, 'backend:service-discovery:parse-json-file', {
      context,
      filePath,
    });
    logger.error('Failed to read JSON file', templumError, { context, filePath });
    return null;
  }
}

function stringifyJsonValue<T>(context: string, value: T, options?: JsonStringifyOptions): string | null {
  const outcome = serialization.json(value, options).context(context).stringify();
  return unwrapSerializationOutcome(context, outcome);
}

function isPidActive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (_error) {
    return false;
  }
}

function parseRegistryEntry(serviceId: string, candidate: unknown): ServiceRegistryEntry | null {
  if (!TypeGuards.isPlainObject(candidate)) {
    registryLogger.warn('Registry entry is not an object', { serviceId });
    return null;
  }

  const candidateRecord = candidate as Record<string, unknown>;
  const endpointCandidate = candidateRecord.endpoint;

  if (!TypeGuards.isNonEmptyString(endpointCandidate)) {
    registryLogger.warn('Registry entry missing endpoint', { serviceId });
    return null;
  }

  const defaults = buildServiceRegistryDefaults({
    id: serviceId,
    endpoint: endpointCandidate,
    protocol: TypeGuards.isNonEmptyString(candidateRecord.protocol)
      ? (candidateRecord.protocol as ServiceRegistryEntry['protocol'])
      : undefined,
    health: TypeGuards.isNonEmptyString(candidateRecord.health)
      ? (candidateRecord.health as string)
      : undefined,
    capabilities: TypeValidators.isArrayOf(candidateRecord.capabilities, TypeGuards.isNonEmptyString)
      ? (candidateRecord.capabilities as string[])
      : undefined,
    version: TypeGuards.isNonEmptyString(candidateRecord.version)
      ? (candidateRecord.version as string)
      : undefined,
    registrationTime: TypeGuards.isNumber(candidateRecord.registrationTime)
      ? (candidateRecord.registrationTime as number)
      : undefined,
    lastSeen: TypeGuards.isNumber(candidateRecord.lastSeen)
      ? (candidateRecord.lastSeen as number)
      : undefined,
    capabilitiesEndpoint: TypeGuards.isNonEmptyString(candidateRecord.capabilitiesEndpoint)
      ? (candidateRecord.capabilitiesEndpoint as string)
      : undefined,
    versionEndpoint: TypeGuards.isNonEmptyString(candidateRecord.versionEndpoint)
      ? (candidateRecord.versionEndpoint as string)
      : undefined,
    pid: TypeGuards.isNumber(candidateRecord.pid)
      ? (candidateRecord.pid as number)
      : undefined,
    authentication: TypeGuards.isPlainObject(candidateRecord.authentication)
      ? (candidateRecord.authentication as ServiceRegistryEntry['authentication'])
      : undefined,
    metadata: TypeGuards.isPlainObject(candidateRecord.metadata)
      ? (candidateRecord.metadata as Record<string, unknown>)
      : undefined,
  });

  const entryContext = `backend:service-discovery:registry:entry:${serviceId}`;
  const serializedCandidate = stringifyJsonValue(entryContext + ':snapshot', candidateRecord);

  if (!serializedCandidate) {
    return defaults;
  }

  const parsedEntry = parseJsonString<ServiceRegistryEntry>(entryContext, serializedCandidate, {
    schema: serviceRegistryEntrySchema,
    defaults,
  });

  return parsedEntry ?? defaults;
}

async function parseServiceDescriptor(
  descriptor: unknown,
  context: ServiceDescriptorContext,
): Promise<ParsedServiceDescriptor | null> {
  const descriptorLogger = context.logger;
  const manifest = normalizeServiceManifest(descriptor);

  if (!manifest) {
    descriptorLogger.warn('Invalid service manifest payload', { filePath: context.filePath });
    return null;
  }

  if (manifest.pid !== undefined) {
    if (!context.isProcessRunning(manifest.pid)) {
      descriptorLogger.info('Service manifest references inactive process', {
        filePath: context.filePath,
        pid: manifest.pid,
        removeOnStale: context.removeOnStale ?? false,
      });
      if (context.removeOnStale) {
        fs.unlinkSync(context.filePath);
      }
      return null;
    }
  }

  const backendConfig = buildBackendConfigFromManifest(manifest, { timeout: context.timeout });

  if (context.enforceHealthCheck) {
    const isHealthy = await context.validateServiceHealth({
      manifest,
      config: backendConfig,
      logger: descriptorLogger,
      context: context.logPrefix,
    });

    if (!isHealthy) {
      descriptorLogger.warn('Service failed health check', {
        filePath: context.filePath,
        serviceId: manifest.id,
      });
      return null;
    }
  }

  const service: DiscoveredService = {
    id: manifest.id,
    config: backendConfig,
    discoveryMethod: context.discoveryMethod,
    confidence: context.confidence ?? 0.95,
    timestamp: manifest.lastSeen ?? manifest.registrationTime ?? Date.now(),
  };

  return {
    service,
    pid: manifest.pid,
  };
}

/**
 * Multi-strategy service discovery system
 * Replaces hardcoded backend discovery with intelligent discovery strategies
 */
export class ServiceDiscovery extends EventDrivenComponent<ServiceDiscoveryEvents> {
  private static instanceCounter = 0;
  private strategies: DiscoveryStrategy[] = [];
  private discoveredServices: Map<string, DiscoveredService> = new Map();
  private options: Required<ServiceDiscoveryOptions>;
  private fileWatcher?: ServiceDiscoveryFileWatcher; // NEW: File system watcher instance

  constructor(options: ServiceDiscoveryOptions = {}) {
    super(`service-discovery:${ServiceDiscovery.instanceCounter++}`, 80);
    
    this.options = {
      strategies: options.strategies || [],
      enableRegistryDiscovery: options.enableRegistryDiscovery ?? true,
      enableEndpointScanning: options.enableEndpointScanning ?? true,
      enableConfigurationDiscovery: options.enableConfigurationDiscovery ?? true,
      enableFileWatching: options.enableFileWatching ?? true, // NEW: Enable file watching by default
      enableHealthChecks: options.enableHealthChecks ?? true, // NEW: Enable health checks by default
      registryPath: options.registryPath || path.join(process.cwd(), '.templum', 'service-registry.json'),
      // PHASE 1: Use configurable port scanning from feature flag system
      scanPorts: options.scanPorts || backendIntegrationConfig.getConfig().serviceDiscovery.scanPorts,
      scanHosts: options.scanHosts || ['localhost', '127.0.0.1'],
      configurationPath: options.configurationPath || path.join(process.cwd(), '.templum', 'backend-config.json'),
      timeout: options.timeout || 5000,
      maxRetries: options.maxRetries || 2,
      watchDirectories: options.watchDirectories ?? [],
    };

    this.initializeDefaultStrategies();
    this.initializeFileWatching(); // NEW: Initialize file system watching
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
    serviceDiscoveryLogger.info('Starting discovery', {
      strategies: this.strategies.length,
    });
    this.emit('discoveryStarted', { strategies: this.strategies.length });

    const allDiscoveredServices: DiscoveredService[] = [];
    const discoveryPromises = this.strategies.map(async (strategy) => {
      try {
        if (!SemanticValidators.hasFunction(strategy, 'discover', { required: true, minimumConfidence: 80 })) {
          const error = createTemplumError(
            `Discovery strategy '${strategy.name}' is missing a discover implementation`,
            'STRATEGY_VALIDATION_ERROR',
            'validation',
            { strategy: strategy.name },
          );

          serviceDiscoveryLogger.warn('Strategy failed runtime validation', {
            strategy: strategy.name,
          });
          this.emit('strategyError', { strategy: strategy.name, error });
          return [];
        }

        serviceDiscoveryLogger.debug('Running discovery strategy', {
          strategy: strategy.name,
          priority: strategy.priority,
        });
        const services = await strategy.discover();
        serviceDiscoveryLogger.debug('Strategy completed', {
          strategy: strategy.name,
          discovered: services.length,
        });
        return services;
      } catch (error) {
        const templumError = ErrorHandler.handle(
          error,
          'backend:service-discovery:strategy-discover',
          { strategy: strategy.name },
        );
        serviceDiscoveryLogger.warn('Strategy failed', {
          strategy: strategy.name,
          errorCode: templumError.code,
          errorMessage: templumError.message,
        });
        this.emit('strategyError', { strategy: strategy.name, error: templumError });
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

    serviceDiscoveryLogger.info('Discovery completed', {
      discovered: uniqueServices.length,
      strategies: this.strategies.length,
    });
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

  /**
   * Initialize file system watching for dynamic service discovery
   * NEW: TASK-CLI-015 implementation
   */
  private initializeFileWatching(): void {
    if (!this.options.enableFileWatching) {
      return;
    }

    const directories = resolveWatchDirectories({
      registryPath: this.options.registryPath,
      explicitDirectories: this.options.watchDirectories,
      cwd: process.cwd(),
    });

    this.fileWatcher = new ServiceDiscoveryFileWatcher({
      directories,
      logger: fileWatcherLogger,
      onServiceFileChange: (filePath, eventType) => this.handleServiceFileChange(filePath, eventType),
      onServiceFileRemoval: (filePath) => this.handleServiceFileRemoval(filePath),
      onWatcherError: (error) => this.emit('watcherError', error),
    });

    this.fileWatcher.start();
  }

  /**
   * Handle service file changes (add/update)
   * NEW: TASK-CLI-015 implementation
   */
  private async handleServiceFileChange(filePath: string, eventType: ServiceFileEvent): Promise<void> {
    try {
      const descriptorPayload = parseJsonFile<unknown>(
        filePath,
        'backend:service-discovery:file-watcher:descriptor',
        undefined,
        fileWatcherLogger,
      );

      if (!descriptorPayload) {
        return;
      }

      const descriptor = await parseServiceDescriptor(descriptorPayload, {
        logPrefix: '[FILE_WATCHER]',
        filePath,
        timeout: this.options.timeout,
        enforceHealthCheck: this.options.enableHealthChecks,
        discoveryMethod: 'registry',
        confidence: 0.95,
        logger: fileWatcherLogger,
        isProcessRunning: (pid) => this.isProcessRunning(pid),
        validateServiceHealth: (validationContext) => this.validateServiceHealth(validationContext),
      });

      if (!descriptor) {
        return;
      }

      const { service, pid } = descriptor;

      this.discoveredServices.set(service.id, service);

      fileWatcherLogger.info('Service descriptor processed', {
        serviceId: service.id,
        eventType,
        filePath,
        pid: pid ?? 'n/a',
      });

      this.emit('serviceDiscovered', {
        service,
        eventType,
        filePath,
      });
    } catch (error) {
      const templumError = ErrorHandler.handle(
        error,
        'backend:service-discovery:file-watcher:update',
        { filePath, eventType },
      );
      fileWatcherLogger.error('Failed to process service file', templumError, {
        filePath,
        eventType,
      });
    }
  }

  /**
   * Handle service file removal
   * NEW: TASK-CLI-015 implementation
   */
  private handleServiceFileRemoval(filePath: string): void {
    // Extract service ID from file path or try to find matching service
    const fileName = path.basename(filePath, '.json');
    
    // Find service by matching file path or service ID
    let removedServiceId: string | null = null;
    for (const [serviceId] of Array.from(this.discoveredServices.entries())) {
      if (serviceId === fileName || serviceId.includes(fileName)) {
        removedServiceId = serviceId;
        break;
      }
    }

    if (removedServiceId) {
      this.discoveredServices.delete(removedServiceId);
      fileWatcherLogger.info('Service descriptor removed', {
        serviceId: removedServiceId,
        filePath,
      });

      this.emit('serviceRemoved', {
        serviceId: removedServiceId,
        filePath,
      });
    }
  }

  /**
   * Check if a process ID is still running
   * NEW: Helper method for file watching validation
   */
  private isProcessRunning(pid: number): boolean {
    return isPidActive(pid);
  }

  /**
   * Validate service health endpoint
   * NEW: Helper method for file watching validation  
   */
  private async validateServiceHealth(validationContext: ServiceHealthValidationContext): Promise<boolean> {
    const timeoutMs = validationContext.config.timeout ?? this.options.timeout ?? 5000;
    const config: BackendConfig = {
      ...validationContext.config,
      timeout: timeoutMs,
    };

    return performServiceHealthCheck({
      manifest: validationContext.manifest,
      config,
      timeoutMs,
      logger: validationContext.logger,
      context: validationContext.context,
    });
  }

  /**
   * Cleanup file watcher and resources
   * NEW: Proper resource cleanup for file watching
   */
  async close(): Promise<void> {
    if (this.fileWatcher) {
      fileWatcherLogger.info('Closing file system watcher');
      await this.fileWatcher.close();
      this.fileWatcher = undefined;
    }
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
        registryLogger.info('Registry file not found', { path: this.options.registryPath });
        return services;
      }

      const document = parseJsonFile<Record<string, unknown>>(
        this.options.registryPath,
        'backend:service-discovery:registry',
        undefined,
        registryLogger,
      );

      if (!document) {
        return services;
      }

      const serviceMapCandidate = (document as { services?: unknown }).services;
      if (!TypeGuards.isPlainObject(serviceMapCandidate)) {
        registryLogger.warn('Registry document missing services map', { path: this.options.registryPath });
        return services;
      }

      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [serviceId, entryCandidate] of Object.entries(serviceMapCandidate)) {
        const registration = parseRegistryEntry(serviceId, entryCandidate);

        if (!registration) {
          continue;
        }

        if (now - registration.lastSeen > staleThreshold) {
          registryLogger.warn('Skipping stale registration', { serviceId });
          continue;
        }

        const manifest = manifestFromRegistryEntry(registration);
        const backendConfig = buildBackendConfigFromManifest(manifest, { timeout: this.options.timeout });

        const isHealthy = await this.validateServiceHealth({
          manifest,
          config: backendConfig,
          logger: registryLogger,
          context: '[REGISTRY_DISCOVERY]',
        });

        if (!isHealthy) {
          registryLogger.warn('Service failed health check', { serviceId });
          continue;
        }

        services.push({
          id: serviceId,
          config: backendConfig,
          discoveryMethod: 'registry',
          confidence: 0.9,
          timestamp: manifest.lastSeen ?? manifest.registrationTime ?? now,
        });

        registryLogger.info('Discovered service via registry', { serviceId });
      }
    } catch (error) {
      const templumError = ErrorHandler.handle(
        error,
        'backend:service-discovery:registry-discover',
        { registryPath: this.options.registryPath },
      );
      registryLogger.error('Registry file discovery failed', templumError, {
        path: this.options.registryPath,
      });
    }

    return services;
  }

  /**
   * Enhanced discovery from services directory
   * Each .json file represents a self-registered backend service
   * 
   * FIXED: Always scan both primary and VDL_Vault services directories
   * This ensures service discovery works regardless of which directories exist
   */
  private async discoverFromServicesDirectory(): Promise<DiscoveredService[]> {
    const services: DiscoveredService[] = [];

    try {
      // Always scan primary services directory if it exists
      if (this.options.servicesDir && fs.existsSync(this.options.servicesDir)) {
        registryLogger.info('Scanning primary services directory', { directory: this.options.servicesDir });
        const primaryServices = await this.discoverFromDirectory(this.options.servicesDir);
        services.push(...primaryServices);
      } else if (this.options.servicesDir) {
        registryLogger.info('Primary services directory not found', { directory: this.options.servicesDir });
      }

      // Always scan VDL_Vault root .templum/services directory (shared multi-repo location)
      const vdlVaultTemplumDir = path.resolve(process.cwd(), '..', '.templum', 'services');
      if (fs.existsSync(vdlVaultTemplumDir)) {
        registryLogger.info('Scanning shared VDL_Vault services directory', { directory: vdlVaultTemplumDir });
        const vdlServices = await this.discoverFromDirectory(vdlVaultTemplumDir);
        services.push(...vdlServices);
      } else {
        registryLogger.info('VDL_Vault shared directory not found', { directory: vdlVaultTemplumDir });
      }
      
    } catch (error) {
      const templumError = ErrorHandler.handle(
        error,
        'backend:service-discovery:services-directory-discover',
        {
          directory: this.options.servicesDir,
          sharedDirectory: path.resolve(process.cwd(), '..', '.templum', 'services'),
        },
      );
      registryLogger.error('Services directory discovery failed', templumError, {
        directory: this.options.servicesDir,
      });
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

      registryLogger.info('Scanning services directory', {
        directory: servicesDir,
        files: serviceFiles.length,
      });

      for (const filePath of serviceFiles) {
        const descriptorPayload = parseJsonFile<unknown>(
          filePath,
          'backend:service-discovery:registry:descriptor',
          undefined,
          registryLogger,
        );

        if (!descriptorPayload) {
          continue;
        }

        const descriptor = await parseServiceDescriptor(descriptorPayload, {
          logPrefix: '[REGISTRY_DISCOVERY]',
          filePath,
          timeout: this.options.timeout,
          enforceHealthCheck: true,
          discoveryMethod: 'registry',
          confidence: 0.9,
          logger: registryLogger,
          removeOnStale: true,
          isProcessRunning: (pid) => this.isProcessRunning(pid),
          validateServiceHealth: (validationContext) => this.validateServiceHealth(validationContext),
        });

        if (!descriptor) {
          continue;
        }

        services.push(descriptor.service);

        registryLogger.info('Discovered service via services directory', {
          serviceId: descriptor.service.id,
          directory: servicesDir,
          pid: descriptor.pid ?? 'n/a',
        });
      }
    } catch (error) {
      const templumError = ErrorHandler.handle(
        error,
        'backend:service-discovery:scan-directory',
        { directory: servicesDir },
      );
      registryLogger.error('Directory discovery failed', templumError, { directory: servicesDir });
    }

    return services;
  }

  /**
   * Check if a process ID is still running
   */
  private isProcessRunning(pid: number): boolean {
    return isPidActive(pid);
  }

  private async validateServiceHealth(validationContext: ServiceHealthValidationContext): Promise<boolean> {
    const timeoutMs = validationContext.config.timeout ?? this.options.timeout ?? 5000;
    const config: BackendConfig = {
      ...validationContext.config,
      timeout: timeoutMs,
    };

    return performServiceHealthCheck({
      manifest: validationContext.manifest,
      config,
      timeoutMs,
      logger: validationContext.logger,
      context: validationContext.context,
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
        configurationLogger.info('Configuration file not found', { path: this.options.configurationPath });
        return services;
      }

      const configData = parseJsonFile<Record<string, unknown>>(
        this.options.configurationPath,
        'backend:service-discovery:configuration',
        undefined,
        configurationLogger,
      );

      if (!configData) {
        return services;
      }

      const now = Date.now();

      if (!TypeGuards.isPlainObject(configData)) {
        configurationLogger.warn('Invalid configuration format', { path: this.options.configurationPath });
        return services;
      }

      const backends = (configData as Record<string, unknown>).backends;

      if (!TypeValidators.isArrayOf(backends, TypeGuards.isPlainObject)) {
        configurationLogger.warn('Invalid configuration backends list', { path: this.options.configurationPath });
        return services;
      }

      for (const backendConfig of backends) {
        if (!this.validateBackendConfig(backendConfig)) {
          configurationLogger.warn('Invalid backend configuration entry', { backendConfig });
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
          options: backendConfig.options,
        };

        services.push({
          id: backendConfig.service,
          config,
          discoveryMethod: 'configuration',
          confidence: 0.8,
          timestamp: now,
        });

        configurationLogger.info('Discovered service via configuration', {
          serviceId: backendConfig.service,
        });
      }
    } catch (error) {
      const templumError = ErrorHandler.handle(
        error,
        'backend:service-discovery:configuration-discover',
        { path: this.options.configurationPath },
      );
      const configDiscoveryError = createTemplumError(
        `Configuration discovery failed: ${templumError.message}`,
        'CONFIG_DISCOVERY_ERROR',
        'configuration',
        {
          path: this.options.configurationPath,
          cause: templumError,
        },
      );
      configurationLogger.error('Configuration discovery failed', configDiscoveryError, {
        path: this.options.configurationPath,
      });

      throw configDiscoveryError;
    }

    return services;
  }

  private validateBackendConfig(config: unknown): config is BackendConfig {
    if (!TypeGuards.isPlainObject(config)) {
      return false;
    }

    const candidate = config as Record<string, unknown>;
    const { service, protocol, endpoint, capabilities, capabilitiesEndpoint, healthEndpoint } = candidate;

    if (!TypeGuards.isNonEmptyString(service) || !TypeGuards.isNonEmptyString(endpoint)) {
      return false;
    }

    if (!TypeGuards.isNonEmptyString(protocol)) {
      return false;
    }

    if (!SUPPORTED_PROTOCOLS.includes(protocol as BackendConfig['protocol'])) {
      return false;
    }

    if (capabilities !== undefined && !TypeValidators.isArrayOf(capabilities, TypeGuards.isNonEmptyString)) {
      return false;
    }

    if (capabilitiesEndpoint !== undefined && !TypeGuards.isNonEmptyString(capabilitiesEndpoint)) {
      return false;
    }

    if (healthEndpoint !== undefined && !TypeGuards.isNonEmptyString(healthEndpoint)) {
      return false;
    }

    return true;
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

    scanningLogger.info('Scanning hosts and ports', {
      hosts: this.options.scanHosts.length,
      ports: this.options.scanPorts.length,
    });

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

    scanningLogger.info('Completed scanning', { discovered: services.length });
    return services;
  }

  private async scanHttpEndpoint(host: string, port: number): Promise<DiscoveredService | null> {
    return new Promise((resolve) => {
      const timeoutMs = this.options.timeout ?? TIMEOUTS.NORMAL;
      let settled = false;
      let timeoutGuard: ManagedTimeout;
      let request: http.ClientRequest | undefined;

      const finish = (service: DiscoveredService | null) => {
        if (settled) {
          return;
        }
        settled = true;
        timeoutGuard.cancel();
        if (request) {
          const candidate = request as unknown as {
            destroy?: () => void;
            abort?: () => void;
          };
          if (typeof candidate.destroy === 'function') {
            candidate.destroy();
          } else if (typeof candidate.abort === 'function') {
            candidate.abort();
          }
          request = undefined;
        }
        resolve(service);
      };

      timeoutGuard = createTimeout(() => {
        finish(null);
      }, timeoutMs);

      const skinEndpoint = `http://${host}:${port}/api/skin`;
      request = http.get(skinEndpoint, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          finish(null);
          return;
        }

        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          const skinDefinition = parseJsonString<Record<string, unknown>>(
            'backend:service-discovery:scan:http',
            data,
          );

          if (!skinDefinition || !TypeGuards.isNonEmptyString(skinDefinition.service)) {
            finish(null);
            return;
          }

          const version = TypeGuards.isNonEmptyString(skinDefinition.version)
            ? (skinDefinition.version as string)
            : '1.0.0';

          const config: BackendConfig = {
            service: skinDefinition.service,
            version,
            protocol: 'http',
            endpoint: `http://${host}:${port}`,
            timeout: timeoutMs,
            retries: this.options.maxRetries,
            keepAlive: true,
            authentication: { type: 'none' },
            healthEndpoint: `http://${host}:${port}/api/health`,
            capabilitiesEndpoint: `http://${host}:${port}/api/capabilities`,
          };

          finish({
            id: skinDefinition.service,
            config,
            discoveryMethod: 'scanning',
            confidence: 0.7,
            timestamp: Date.now(),
          });
        });
        res.on('error', () => {
          finish(null);
        });
      });

      request.on('error', () => {
        finish(null);
      });
    });
  }

  private async scanWebSocketEndpoint(host: string, port: number): Promise<DiscoveredService | null> {
    return new Promise((resolve) => {
      const timeoutMs = this.options.timeout ?? TIMEOUTS.NORMAL;
      let settled = false;
      let timeoutGuard: ManagedTimeout;
      let ws: WebSocket | undefined;

      const finish = (service: DiscoveredService | null) => {
        if (settled) {
          return;
        }
        settled = true;
        timeoutGuard.cancel();
        if (ws) {
          if (typeof ws.close === 'function') {
            ws.close();
          } else if (typeof (ws as unknown as { terminate?: () => void }).terminate === 'function') {
            (ws as unknown as { terminate?: () => void }).terminate?.();
          }
          ws = undefined;
        }
        resolve(service);
      };

      try {
        ws = new WebSocket(`ws://${host}:${port}`);
      } catch (_error) {
        resolve(null);
        return;
      }

      timeoutGuard = createTimeout(() => {
        finish(null);
      }, timeoutMs);

      ws.on('open', () => {
        const payload = stringifyJsonValue('backend:service-discovery:scan:websocket:request', {
          id: `scan-${Date.now()}`,
          type: 'getSkinDefinition',
          timestamp: Date.now(),
        });

        if (!payload) {
          finish(null);
          return;
        }

        ws?.send(payload);
      });

      ws.on('message', (data: Buffer) => {
        try {
          const response = parseJsonString<Record<string, unknown>>(
            'backend:service-discovery:scan:websocket:response',
            data.toString(),
          );

          const skinDefinition = response?.data as Record<string, unknown> | undefined;

          if (
            response &&
            response.type === 'skin_definition_response' &&
            skinDefinition &&
            (TypeGuards.isNonEmptyString(skinDefinition.service) || skinDefinition.service === undefined)
          ) {
            const serviceId = TypeGuards.isNonEmptyString(skinDefinition.service)
              ? (skinDefinition.service as string)
              : 'unknown-websocket';

            const config: BackendConfig = {
              service: serviceId,
              version: TypeGuards.isNonEmptyString(skinDefinition.version)
                ? (skinDefinition.version as string)
                : '1.0.0',
              protocol: 'websocket',
              endpoint: `ws://${host}:${port}`,
              timeout: timeoutMs,
              retries: this.options.maxRetries,
              keepAlive: true,
              authentication: { type: 'none' }
            };

            finish({
              id: serviceId,
              config,
              discoveryMethod: 'scanning',
              confidence: 0.6,
              timestamp: Date.now()
            });
            return;
          }
        } catch (_error) {
          // Ignore malformed responses and fall through to finish(null)
        }

        finish(null);
      });

      ws.on('error', () => {
        finish(null);
      });

      ws.on('close', () => {
        finish(null);
      });
    });
  }

  private async scanIpcEndpoint(host: string, port: number): Promise<DiscoveredService | null> {
    return new Promise((resolve) => {
      const timeoutMs = this.options.timeout ?? TIMEOUTS.NORMAL;
      const socket = new net.Socket();
      let settled = false;
      let timeoutGuard: ManagedTimeout;

      const finish = (service: DiscoveredService | null) => {
        if (settled) {
          return;
        }
        settled = true;
        timeoutGuard.cancel();
        if (typeof socket.destroy === 'function') {
          socket.destroy();
        } else {
          socket.end?.();
        }
        resolve(service);
      };

      timeoutGuard = createTimeout(() => {
        finish(null);
      }, timeoutMs);

      socket.connect(port, host, () => {
        const payload = stringifyJsonValue('backend:service-discovery:scan:ipc:request', {
          id: `scan-${Date.now()}`,
          type: 'getSkinDefinition',
          timestamp: Date.now(),
        });

        if (!payload) {
          finish(null);
          return;
        }

        socket.write(`${payload}\n`);
      });

      let buffer = '';
      socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          try {
            const response = parseJsonString<Record<string, unknown>>(
              'backend:service-discovery:scan:ipc:response',
              line,
            );
            const skinDefinition = response?.data as Record<string, unknown> | undefined;

            if (
              response &&
              response.type === 'skin_definition_response' &&
              skinDefinition &&
              (TypeGuards.isNonEmptyString(skinDefinition.service) || skinDefinition.service === undefined)
            ) {
              const serviceId = TypeGuards.isNonEmptyString(skinDefinition.service)
                ? (skinDefinition.service as string)
                : 'unknown-ipc';
              const config: BackendConfig = {
                service: serviceId,
                version: TypeGuards.isNonEmptyString(skinDefinition.version)
                  ? (skinDefinition.version as string)
                  : '1.0.0',
                protocol: 'ipc',
                endpoint: `ipc://${host}:${port}`,
                timeout: timeoutMs,
                retries: this.options.maxRetries,
                keepAlive: true,
                authentication: { type: 'none' }
              };

              finish({
                id: serviceId,
                config,
                discoveryMethod: 'scanning',
                confidence: 0.6,
                timestamp: Date.now()
              });
              return;
            }
          } catch (_error) {
            // Continue processing remaining lines
          }
        }
      });

      socket.on('error', () => {
        finish(null);
      });

      socket.on('close', () => {
        finish(null);
      });
    });
  }
}
