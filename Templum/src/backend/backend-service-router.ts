/**
 * @fileoverview Backend Service Router - Templum-Haruspex Integration
 * @author Claude Code Implementation  
 * @created 2025-08-23
 * 
 * Routes commands to appropriate backend services (Haruspex, PCL, Litany) and 
 * manages backend service connections following Templum 1.0 specification.
 */

import { ChildProcess } from 'child_process';
// Unused imports removed: spawn, createServer
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import * as WebSocket from 'ws';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import { ErrorHandler } from '../utils/error-handler';
import type { TypedEventMap } from '../utils/event-utils';
import { UniversalSkinEngine } from '../skin/universal-skin-engine';
import {
    BackendType,
    BackendConnectionLifecycleEvent,
    createTemplumError,
    InterfaceType,
    isTemplumError,
    SkinTheme
} from '../types/templum-types';
import {
    BackendConfig,
    ColorPalette,
    ColorScale,
    ComponentSkin,
    RenderingConfiguration,
    SkinAssets,
    SkinInheritance,
    SkinPerformanceConfig,
    ThemeDefinition,
    UniversalSkinDefinition
} from '../types/universal-skin-engine-types';
import { BackendConnection, ConnectionFactory } from './connection-factory';
import { DynamicCommandRouter } from './dynamic-command-router';
import { ServiceDiscovery, ServiceDiscoveryOptions } from './service-discovery';
import type { DiscoveredService } from './service-discovery';
import {
  ManualOverrideManager,
  type ManualOverrideOptions,
  type ManualOverrideDescriptor,
  type ManualOverrideSnapshot,
  type ManualOverrideClearResult,
  type ManualOverrideMetadata
} from './manual-override-manager';
// Unused import removed: backendIntegrationConfig
// Available via require('./backend-integration-config') if needed in future
import { ITemplumOrchestrator } from '../interfaces/templum-orchestrator-interface';
// Migration Note (2025-09-01): TemplumSkinDefinition alias no longer needed with unified types
import { SemanticValidators, TypeGuards, TypeValidators } from '../utils/type-guards';
import {
  serialization,
  type JsonParseOptions,
  type JsonStringifyOptions,
  type JsonReviver,
  type JsonReplacer,
  type JsonSchema,
  type SerializationOutcome,
  type SerializationStatus
} from '../utils/serialization-utils';
import { emitSerializationWarnings } from './backend-serialization-log';
import { BackendLifecycleChannel } from './lifecycle/backend-lifecycle-channel';
import {
  createInterval,
  createTimeout,
  sleep,
  type ManagedInterval,
  type ManagedTimeout
} from '../utils/async-utils';
import { createBackendLogger, type ScopedLogEmitter } from './backend-logger';

// IPC Protocol Types (Based on Haruspex IPC Protocol)
export type IPCMessageType = 
  | 'ping' | 'pong'
  | 'get_status' | 'status_response'
  | 'getSkinDefinition' | 'skin_definition_response'
  | 'executeCommand' | 'command_response'
  | 'getCapabilities' | 'capabilities_response'
  | 'getVersion' | 'version_response'
  | 'shutdown' | 'error'
  | 'handshake_ack' | 'handshake_error'
  // Litany WebSocket message types
  | 'skin_definition_updated' | 'context_sync_notification'
  | 'analysis_complete' | 'service_status' | 'error_notification';

// Backend Service Communication Types
export interface BackendServicePayload {
  [key: string]: unknown;
}

export interface BackendApiPayload extends BackendServicePayload {
  skinId?: string;
  command?: string;
  args?: unknown[];
}

export interface BackendEventPayload extends BackendServicePayload {
  backendId: string;
  commandCount?: number;
  aliasCount?: number;
  commandsRemoved?: number;
  aliasesRemoved?: number;
}

interface DiscoveryMetrics {
  totalAttempts: number;
  successfulConnections: number;
  retryAttempts: number;
  discoveryStartTime: number;
}

interface BackendServiceRouterEvents extends TypedEventMap {
  'manualOverride:applied': (descriptor: ManualOverrideDescriptor) => void;
  'manualOverride:cleared': (descriptor?: ManualOverrideDescriptor) => void;
  'manualOverride:snapshot': (snapshot: ManualOverrideSnapshot) => void;
  discoveryStarted: (payload: { strategies: number }) => void;
  discoveryCompleted: (payload: { discovered: number; strategies: number }) => void;
  discoveryError: (payload: { strategy: string; error: unknown }) => void;
  serviceDiscovered: (payload: { serviceId: string; discoveryMethod: string; confidence: number }) => void;
  serviceRemoved: (payload: { serviceId: string }) => void;
  connectionRecovered: (payload: { backendId: string; attempts: number }) => void;
  recoveryFailed: (payload: { backendId: string; attempts: number; error: unknown }) => void;
  'discovery:complete': (payload: {
    discoveredServices: string[];
    failedServices: string[];
    metrics: DiscoveryMetrics;
    successRate: number;
    discoveryDuration: number;
    generic: boolean;
    discoveryMethod: string;
  }) => void;
  'connection:lifecycle': (event: BackendConnectionLifecycleEvent) => void;
}

export interface SkinDefinitionResponse {
  skinDefinition?: object;
  error?: string;
  status?: string;
}

export interface CommandExecutionResponse {
  result?: unknown;
  error?: string;
  executionTime?: number;
}

export interface IPCMessage<T extends BackendServicePayload = BackendServicePayload> {
  id: string;
  type: IPCMessageType;
  method?: string;
  timestamp: number;
  payload?: T;
  requestId?: string;
}

export interface IPCResponse<T extends BackendServicePayload = BackendServicePayload> extends IPCMessage<T> {
  requestId: string;
  success: boolean;
  error?: string;
  data?: T;
  service?: string;
}

// Specialized IPC Message Interfaces for different communication patterns
export interface IPCNotificationMessage<T extends BackendServicePayload = BackendServicePayload> extends IPCMessage<T> {
  data?: T;
}

// Litany WebSocket Notification Interfaces
export interface SkinDefinitionUpdateMessage extends IPCNotificationMessage {
  type: 'skin_definition_updated';
  skinId: string;
  skinDefinition: unknown;
}

export interface ContextSyncNotificationMessage extends IPCNotificationMessage {
  type: 'context_sync_notification';
  contextId: string;
  data?: {
    syncStatus: string;
    [key: string]: unknown;
  };
}

export interface AnalysisCompleteMessage extends IPCNotificationMessage {
  type: 'analysis_complete';
  analysisId: string;
  results: unknown;
}

export interface ServiceStatusMessage extends IPCNotificationMessage {
  type: 'service_status';
  status: string;
}

export interface ErrorNotificationMessage extends IPCNotificationMessage {
  type: 'error_notification';
  error: string;
}

// Union type for all specialized Litany WebSocket message types  
export type LitanyWebSocketMessage = 
  | SkinDefinitionUpdateMessage
  | ContextSyncNotificationMessage  
  | AnalysisCompleteMessage
  | ServiceStatusMessage
  | ErrorNotificationMessage;

interface HaruspexConnectionInfo {
  host: string;
  port: number;
  socketPath: string;
  timestamp: number;
  serverVersion: string;
}


type RouterSerializationDirection = 'inbound' | 'outbound';

interface RouterSerializationSnapshot {
  context: string;
  status: SerializationStatus;
  direction: RouterSerializationDirection;
  warnings: string[];
  bytes: number;
  durationMs: number;
  maskedFields: string[];
  updatedAt: number;
}

interface RouterSerializationRecorder {
  record(snapshot: RouterSerializationSnapshot): void;
}

interface RouterParseOptions<T> {
  context: string;
  serviceId?: string;
  direction?: RouterSerializationDirection;
  defaults?: Partial<T>;
  fallback?: T;
  schema?: JsonSchema<T>;
  reviver?: JsonReviver;
  maxBytes?: number;
}

interface RouterStringifyOptions<T> {
  context: string;
  serviceId?: string;
  direction?: RouterSerializationDirection;
  maskFields?: string[] | string;
  fallback?: string;
  pretty?: boolean | number;
  maxBytes?: number;
  replacer?: JsonReplacer;
}


function createRouterSerializationSnapshot(
  context: string,
  direction: RouterSerializationDirection,
  outcome: SerializationOutcome<unknown>
): RouterSerializationSnapshot {
  return {
    context,
    direction,
    status: outcome.status,
    warnings: [...outcome.meta.warnings],
    bytes: outcome.meta.bytes,
    durationMs: outcome.meta.durationMs,
    maskedFields: [...outcome.meta.maskedFields],
    updatedAt: Date.now()
  };
}

function handleRouterSerializationOutcome(
  context: string,
  direction: RouterSerializationDirection,
  outcome: SerializationOutcome<unknown>,
  recorder?: RouterSerializationRecorder
): void {
  emitSerializationWarnings(context, outcome);
  if (recorder) {
    recorder.record(createRouterSerializationSnapshot(context, direction, outcome));
  }
}

function runRouterParse<T>(
  raw: string,
  context: string,
  direction: RouterSerializationDirection,
  options: JsonParseOptions<T> | undefined,
  recorder?: RouterSerializationRecorder
): SerializationOutcome<T> {
  const outcome = serialization.fromJson<T>(raw, options).context(context).parse();
  handleRouterSerializationOutcome(context, direction, outcome as SerializationOutcome<unknown>, recorder);
  return outcome;
}

function runRouterStringify<T>(
  value: T,
  context: string,
  direction: RouterSerializationDirection,
  options: JsonStringifyOptions | undefined,
  recorder?: RouterSerializationRecorder
): SerializationOutcome<string> {
  const outcome = serialization.json(value, options).context(context).stringify();
  handleRouterSerializationOutcome(context, direction, outcome as SerializationOutcome<unknown>, recorder);
  return outcome;
}

function toJsonParseOptions<T>(options: RouterParseOptions<T>): JsonParseOptions<T> {
  const { defaults, fallback, schema, reviver, maxBytes } = options;
  const parseOptions: JsonParseOptions<T> = {};
  if (defaults) {
    parseOptions.defaults = defaults;
  }
  if (fallback !== undefined) {
    parseOptions.fallback = fallback;
  }
  if (schema) {
    parseOptions.schema = schema;
  }
  if (reviver) {
    parseOptions.reviver = reviver;
  }
  if (typeof maxBytes === 'number') {
    parseOptions.maxBytes = maxBytes;
  }
  return parseOptions;
}

function toJsonStringifyOptions<T>(options: RouterStringifyOptions<T>): JsonStringifyOptions {
  const stringifyOptions: JsonStringifyOptions = {};
  if (options.maskFields) {
    stringifyOptions.maskFields = Array.isArray(options.maskFields)
      ? options.maskFields
      : [options.maskFields];
  }
  if (options.fallback !== undefined) {
    stringifyOptions.fallback = options.fallback;
  }
  if (options.pretty !== undefined) {
    stringifyOptions.pretty = options.pretty;
  }
  if (typeof options.maxBytes === 'number') {
    stringifyOptions.maxBytes = options.maxBytes;
  }
  if (options.replacer) {
    stringifyOptions.replacer = options.replacer;
  }
  return stringifyOptions;
}

export interface BackendServiceRouter {
  discoverAndConnect(): Promise<void>;
  getConnectionStatus(): BackendConnectionStatus;
  loadBackendSkin(
    backendId: string,
    options?: { allowFallback?: boolean; visited?: Set<string> }
  ): Promise<UniversalSkinDefinition | null>;
  executeCommand(backendId: string, command: string, args?: unknown[]): Promise<CommandExecutionResponse>;
  isServiceAvailable(backendId: string): Promise<boolean>;
  // TASK-NEW-050: Service Connection Management APIs
  connectToService(serviceId: string): Promise<{ success: boolean; message: string; responseTime?: number }>;
  disconnectFromService(serviceId: string): Promise<{ success: boolean; message: string }>;
  applyManualOverride(serviceId: string, options?: ManualOverrideOptions): Promise<ManualOverrideDescriptor>;
  clearManualOverride(serviceId?: string): Promise<ManualOverrideClearResult>;
  getManualOverrideSnapshot(): ManualOverrideSnapshot;
}

export interface BackendConnectionStatus {
  totalConnections: number;
  healthyConnections: number;
  backends: Record<string, BackendStatus>;
}

export interface BackendStatus {
  connected: boolean;
  health: 'healthy' | 'unhealthy' | 'error';
  lastCheck: number;
  lastError?: string;
  capabilities?: string[];
  version?: string;
  responseTime?: number;
  // TASK-SKIN-005: Connection stability tracking for minimal backends
  connectionStability?: {
    successfulConnections: number;
    totalConnectionAttempts: number;
    stabilityPercentage: number;
    lastConnectionAttempt: number;
    connectionHistory: Array<{
      timestamp: number;
      success: boolean;
      responseTime?: number;
    }>;
  };
  lastSerialization?: RouterSerializationSnapshot;
}

// TASK-SKIN-004B: Backend Capability Profile Detection
export interface BackendCapabilityProfile {
  backendId: string;
  hasHealthEndpoint: boolean;
  hasCapabilitiesEndpoint: boolean;
  hasVersionEndpoint: boolean;
  skinDefinitionQuality: 'complete' | 'partial' | 'minimal';
  endpointAvailability: {
    health: boolean;
    capabilities: boolean;
    version: boolean;
  };
  detectionTimestamp: number;
}


/**
 * Backend Service Router Implementation
 * 
 * Manages connections to multiple backend services and routes commands appropriately.
 * Connects to real backend services: Haruspex, PCL, and Litany.
 */
export class TemplumBackendServiceRouter
  extends EventDrivenComponent<BackendServiceRouterEvents>
  implements BackendServiceRouter {
  private static instanceCounter = 0;
  private connections: Map<string, BackendConnection> = new Map();
  private serviceHealth: Map<string, BackendStatus> = new Map();
  private backendConfigs: Map<string, BackendConfig> = new Map();
  private discoveredServiceCache: Map<string, DiscoveredService> = new Map();
  private backendCapabilityProfiles: Map<string, BackendCapabilityProfile> = new Map(); // TASK-SKIN-004B
  private universalSkinEngine: UniversalSkinEngine;
  private commandRouter: DynamicCommandRouter;
  private serviceDiscovery: ServiceDiscovery;
  private useGenericDiscovery: boolean;
  private orchestrator?: ITemplumOrchestrator;
  private lifecycleChannel: BackendLifecycleChannel;
  private manualOverrideManager: ManualOverrideManager;
  private manualOverrideSnapshot: ManualOverrideSnapshot = { overrides: [], updatedAt: Date.now() };
  private readonly log: ScopedLogEmitter = createBackendLogger('backend-service-router');
  
  // ENHANCED: Background health monitoring and recovery system
  private healthMonitorInterval: ManagedInterval | null = null;
  private healthCheckInterval: number = 30000; // 30 seconds default
  private recoveryAttempts: Map<string, number> = new Map();
  private maxRecoveryAttempts: number = 3;
  private healthMonitoringEnabled: boolean = true;
  private healthCheckKickoffTimeout: ManagedTimeout | null = null;
  private continuousHealthInterval: ManagedInterval | null = null;

  private scheduleTimeout(callback: () => void | Promise<void>, ms: number): ManagedTimeout {
    return createTimeout(callback, ms, { unref: true });
  }

  constructor(
    orchestrator?: ITemplumOrchestrator,
    discoveryOptions?: ServiceDiscoveryOptions & { 
      useGenericDiscovery?: boolean;
      healthCheckInterval?: number;
      maxRecoveryAttempts?: number;
      healthMonitoringEnabled?: boolean;
    }
  ) {
    super(`backend-service-router:${TemplumBackendServiceRouter.instanceCounter++}`, 120);
    this.orchestrator = orchestrator;
    this.universalSkinEngine = new UniversalSkinEngine();
    this.commandRouter = new DynamicCommandRouter();
    this.serviceDiscovery = new ServiceDiscovery(discoveryOptions);
    this.useGenericDiscovery = discoveryOptions?.useGenericDiscovery ?? true;
    this.lifecycleChannel = new BackendLifecycleChannel(this);
    this.manualOverrideManager = new ManualOverrideManager();

    // ENHANCED: Configure health monitoring parameters
    this.healthCheckInterval = discoveryOptions?.healthCheckInterval ?? 30000;
    this.maxRecoveryAttempts = discoveryOptions?.maxRecoveryAttempts ?? 3;
    this.healthMonitoringEnabled = discoveryOptions?.healthMonitoringEnabled ?? true;
    
    // GENERIC SYSTEM: Always use skin-driven approach
    this.log.info('[BACKEND_SERVICE_ROUTER] Using fully generic skin-driven backend integration');
    this.setupManualOverrideIntegration();
    this.setupServiceDiscoveryIntegration();
    this.initializeGenericBackendSystem();
    
    this.setupCommandRouterIntegration();
    
    // ENHANCED: Start background health monitoring when enabled
    if (this.healthMonitoringEnabled) {
      this.startHealthMonitoring();
    }
  }

  private parseRouterMessage<T>(raw: string, options: RouterParseOptions<T>): SerializationOutcome<T> {
    const { context, serviceId, direction = 'inbound' } = options;
    const recorder = serviceId
      ? {
          record: (snapshot: RouterSerializationSnapshot) =>
            this.recordSerializationSnapshot(serviceId, snapshot)
        }
      : undefined;
    const outcome = runRouterParse<T>(
      raw,
      context,
      direction,
      toJsonParseOptions(options),
      recorder
    );
    return outcome;
  }

  private stringifyRouterMessage<T>(value: T, options: RouterStringifyOptions<T>): SerializationOutcome<string> {
    const { context, serviceId, direction = 'outbound' } = options;
    const recorder = serviceId
      ? {
          record: (snapshot: RouterSerializationSnapshot) =>
            this.recordSerializationSnapshot(serviceId, snapshot)
        }
      : undefined;
    return runRouterStringify<T>(
      value,
      context,
      direction,
      toJsonStringifyOptions(options),
      recorder
    );
  }

  private recordSerializationSnapshot(serviceId: string, snapshot: RouterSerializationSnapshot): void {
    const status = this.serviceHealth.get(serviceId);
    if (!status) {
      return;
    }
    status.lastSerialization = snapshot;
  }

/**
 * Set the TemplumCore orchestrator reference for skin loading integration
   * Following Backend Service Integration Unified pattern
   */
  setOrchestrator(orchestrator: ITemplumOrchestrator): void {
    this.orchestrator = orchestrator;
    this.log.info('[BACKEND_SERVICE_ROUTER] TemplumCore orchestrator reference set for skin loading');
  }

  private setupManualOverrideIntegration(): void {
    this.manualOverrideSnapshot = this.manualOverrideManager.getSnapshot();

    this.manualOverrideManager.on('manualOverride:applied', ({ descriptor, snapshot }) => {
      this.updateManualOverrideSnapshot(snapshot);
      this.emit('manualOverride:applied', descriptor);
    });

    this.manualOverrideManager.on('manualOverride:cleared', ({ descriptor, snapshot }) => {
      this.updateManualOverrideSnapshot(snapshot);
      this.emit('manualOverride:cleared', descriptor);
    });
  }

  private updateManualOverrideSnapshot(snapshot: ManualOverrideSnapshot): void {
    this.manualOverrideSnapshot = snapshot;
    this.emit('manualOverride:snapshot', snapshot);
  }

  /**
   * Setup service discovery integration
   * NEW GENERIC APPROACH: Uses multi-strategy discovery instead of hardcoded configurations
   */
  private setupServiceDiscoveryIntegration(): void {
    // Listen for discovery events
    this.serviceDiscovery.on('discoveryStarted', (event) => {
      this.log.info(`[SERVICE_DISCOVERY] Discovery started with ${event.strategies} strategies`);
      this.emit('discoveryStarted', event);
    });

    this.serviceDiscovery.on('discoveryCompleted', (event) => {
      this.log.info(`[SERVICE_DISCOVERY] Discovery completed: ${event.discovered} services found`);
      this.emit('discoveryCompleted', event);
    });

    this.serviceDiscovery.on('strategyError', (event) => {
      this.log.warn(`[SERVICE_DISCOVERY] Strategy ${event.strategy} failed:`, event.error);
      this.emit('discoveryError', event);
    });

    this.serviceDiscovery.on('serviceDiscovered', ({ service }) => {
      this.discoveredServiceCache.set(service.id, service);
      this.backendConfigs.set(service.id, service.config);
      this.manualOverrideManager.syncWithServices(new Set(this.backendConfigs.keys()));
      this.emit('serviceDiscovered', {
        serviceId: service.id,
        discoveryMethod: service.discoveryMethod,
        confidence: service.confidence
      });
    });

    this.serviceDiscovery.on('serviceRemoved', ({ serviceId }) => {
      this.discoveredServiceCache.delete(serviceId);
      this.backendConfigs.delete(serviceId);
      this.manualOverrideManager.handleServiceRemoval(serviceId);
      this.manualOverrideManager.syncWithServices(new Set(this.backendConfigs.keys()));
      this.emit('serviceRemoved', { serviceId });
    });
  }

  /**
   * GENERIC SYSTEM: Backend configurations provided by skin definitions only
   * PHASE 3 COMPLETE: No hardcoded configurations - fully skin-driven approach
   */
  private initializeGenericBackendSystem(): void {
    // Configuration available via backendIntegrationConfig.getConfig() if needed
    this.log.info('[GENERIC_INTEGRATION] Initializing skin-driven backend system');
    
    // GENERIC ARCHITECTURE: No pre-configured backends
    // Backends discovered and configured via:
    // 1. Service discovery finds available backends
    // 2. Skin definitions provide connection parameters
    // 3. Dynamic configuration based on backend self-description
    
    // Clear any existing configs - start fresh with generic discovery
    this.backendConfigs.clear();
    
    this.log.info('[GENERIC_INTEGRATION] Ready for skin-driven backend discovery');
    this.log.info('[GENERIC_INTEGRATION] Backends will be configured dynamically based on skin definitions');
    
    // Initialize service health monitoring
    this.initializeServiceHealth();
  }

  /**
   * Initialize service health tracking
   */
  private initializeServiceHealth(): void {
    this.serviceHealth.set('haruspex', {
      connected: false,
      health: 'unhealthy',
      lastCheck: 0,
      capabilities: ['analysis', 'prediction', 'mermaid-generation', 'skin-provider']
    });

    this.serviceHealth.set('pcl', {
      connected: false, 
      health: 'unhealthy',
      lastCheck: 0,
      capabilities: ['tdd-workflow', 'testing', 'code-generation', 'cli-interface']
    });

    this.serviceHealth.set('litany', {
      connected: false,
      health: 'unhealthy',
      lastCheck: 0,
      capabilities: ['context-management', 'memory-integration', 'semantic-search']
    });
  }

  /**
   * ENHANCED: Start background health monitoring with configurable intervals
   */
  private startHealthMonitoring(): void {
    if (this.healthMonitorInterval) {
      this.healthMonitorInterval.stop();
    }
    
    this.log.info(`[HEALTH_MONITOR] Starting background health monitoring (interval: ${this.healthCheckInterval}ms)`);
    
    this.healthMonitorInterval = createInterval(
      () => this.performHealthCheck(),
      this.healthCheckInterval,
      { unref: true }
    );
    
    // Perform initial health check
    this.healthCheckKickoffTimeout = this.scheduleTimeout(async () => {
      this.healthCheckKickoffTimeout = null;
      await this.performHealthCheck();
    }, 1000);
  }

  /**
   * TASK-SKIN-005: Perform conditional health check based on backend capability profiles
   * Only performs health checks on backends that have health endpoints
   */
  private async performHealthCheck(): Promise<void> {
    const connections = Array.from(this.connections.entries());
    
    if (connections.length === 0) {
      return; // No connections to check yet
    }
    
    this.log.info(`[HEALTH_MONITOR] Performing conditional health check on ${connections.length} connections`);
    
    for (const [backendId, connection] of connections) {
      try {
        const capabilityProfile = this.backendCapabilityProfiles.get(backendId);
        const startTime = Date.now();
        
        if (capabilityProfile?.hasHealthEndpoint) {
          // Tier 1: Health-enabled backends - perform actual health check
          const isHealthy = await this.performActualHealthCheck(backendId, connection);
          const responseTime = Date.now() - startTime;
          
          this.updateServiceHealth(
            backendId, 
            isHealthy, 
            isHealthy ? 'healthy' : 'unhealthy', 
            isHealthy ? undefined : 'Health check failed',
            undefined,
            responseTime
          );
          
          this.log.info(`[HEALTH_MONITOR] Tier 1 (Health-enabled) ${backendId}: ${isHealthy ? 'healthy' : 'unhealthy'} (${responseTime}ms)`);
        } else {
          // Tier 2: Minimal backends - use connection stability instead of health checks
          const isConnected = connection.isConnected();
          const responseTime = Date.now() - startTime;
          
          // For minimal backends, consider them "healthy" if they're connected
          // Their actual ranking will be determined by connection stability in prioritization
          this.updateServiceHealth(
            backendId, 
            isConnected, 
            isConnected ? 'healthy' : 'unhealthy',
            isConnected ? undefined : 'Connection lost',
            undefined,
            responseTime
          );
          
          this.log.info(`[HEALTH_MONITOR] Tier 2 (Minimal) ${backendId}: ${isConnected ? 'connected' : 'disconnected'} (stability: ${this.getConnectionStability(backendId).toFixed(1)}%)`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.updateServiceHealth(
          backendId,
          false,
          'error',
          `Health check failure (${errorMessage})`
        );
        const parsedError = error instanceof Error ? error : new Error(errorMessage);
        this.log.error(
          'Health monitor failed to evaluate backend status',
          parsedError,
          { backendId }
        );
      }
    }
  }

  /**
   * TASK-SKIN-005: Perform actual health endpoint check for health-enabled backends
   */
  private async performActualHealthCheck(backendId: string, connection: BackendConnection): Promise<boolean> {
    try {
      // Try to perform actual health check based on connection type
      if (connection.protocol === 'http') {
        const config = this.backendConfigs.get(backendId);
        if (config?.healthEndpoint) {
          const controller = new AbortController();
          const timeout = this.scheduleTimeout(() => controller.abort(), 5000);
          
          try {
            const response = await fetch(`${config.endpoint}${config.healthEndpoint}`, {
              method: 'GET',
              signal: controller.signal
            });
            return response.ok;
          } finally {
            timeout.cancel();
          }
        }
      }
      
      // For other protocols or if no specific health endpoint, check if connection is alive
      return connection.isConnected();
    } catch (error) {
      this.log.warn(`[HEALTH_CHECK] Health endpoint check failed for ${backendId}:`, error);
      return false;
    }
  }

  /**
   * Legacy method - updated for compatibility
   */
  private async performHealthChecks(): Promise<void> {
    // Delegate to the new conditional health check method
    return this.performHealthCheck();
  }

  /**
   * ENHANCED: Attempt connection recovery with exponential backoff
   */
  private async attemptConnectionRecovery(backendId: string, connection: BackendConnection): Promise<void> {
    const currentAttempts = this.recoveryAttempts.get(backendId) || 0;
    
    if (currentAttempts >= this.maxRecoveryAttempts) {
      this.log.warn(`[RECOVERY] Max recovery attempts (${this.maxRecoveryAttempts}) reached for ${backendId}, skipping recovery`);
      return;
    }
    
    const nextAttempt = currentAttempts + 1;
    this.recoveryAttempts.set(backendId, nextAttempt);
    
    // Exponential backoff: 1s, 2s, 4s, 8s...
    const backoffDelay = Math.pow(2, currentAttempts) * 1000;
    
    this.log.info(`[RECOVERY] Attempting recovery for ${backendId} (attempt ${nextAttempt}/${this.maxRecoveryAttempts}, delay: ${backoffDelay}ms)`);
    
    this.scheduleTimeout(async () => {
      try {
        await connection.connect();
        this.log.info(`[RECOVERY] Successfully recovered connection to ${backendId}`);
        this.recoveryAttempts.delete(backendId);
        this.emit('connectionRecovered', { backendId, attempts: nextAttempt });
        this.lifecycleChannel.emitRecovered(backendId, {
          attempts: nextAttempt,
          retryAttempts: nextAttempt - 1,
          origin: 'recovery'
        });
      } catch (error) {
        this.log.warn(`[RECOVERY] Recovery attempt ${nextAttempt} failed for ${backendId}:`, error);
        this.emit('recoveryFailed', { backendId, attempts: nextAttempt, error });
        this.lifecycleChannel.emitFailed(backendId, error, {
          attempts: nextAttempt,
          retryAttempts: nextAttempt,
          origin: 'recovery'
        });
      }
    }, backoffDelay);
  }

  /**
   * ENHANCED: Stop background health monitoring and cleanup
   */
  private stopHealthMonitoring(): void {
    if (this.healthMonitorInterval) {
      this.healthMonitorInterval.stop();
      this.healthMonitorInterval = null;
      this.log.info('[HEALTH_MONITOR] Background health monitoring stopped');
    }

    if (this.healthCheckKickoffTimeout) {
      this.healthCheckKickoffTimeout.cancel();
      this.healthCheckKickoffTimeout = null;
    }

    if (this.continuousHealthInterval) {
      this.continuousHealthInterval.stop();
      this.continuousHealthInterval = null;
    }
  }

  /**
   * Setup command router integration with backend lifecycle events
   * Handles automatic registration/unregistration of commands when backends connect/disconnect
   */
  private setupCommandRouterIntegration(): void {
    this.log.info('[DYNAMIC_COMMAND_ROUTER] Setting up command router integration');
    
    // Listen for backend connection events to register commands
    this.on('backendConnected', (backendId: string) => {
      // Commands will be registered when skin is loaded via loadBackendSkin
      this.log.info(`[DYNAMIC_COMMAND_ROUTER] Backend ${backendId} connected - awaiting skin registration`);
    });

    // Listen for backend disconnection events to unregister commands
    this.on('backendDisconnected', (backendId: string) => {
      this.log.info(`[DYNAMIC_COMMAND_ROUTER] Backend ${backendId} disconnected - unregistering commands`);
      this.commandRouter.unregisterBackend(backendId);
    });

    // Forward command router events for debugging/monitoring
    this.commandRouter.on('backendRegistered', (event: BackendEventPayload) => {
      this.log.info(`[DYNAMIC_COMMAND_ROUTER] Commands registered for ${event.backendId}: ${event.commandCount} commands, ${event.aliasCount} aliases`);
    });

    this.commandRouter.on('backendUnregistered', (event: BackendEventPayload) => {
      this.log.info(`[DYNAMIC_COMMAND_ROUTER] Commands unregistered for ${event.backendId}: ${event.commandsRemoved} commands, ${event.aliasesRemoved} aliases`);
    });
  }

  /**
   * Get the dynamic command router instance
   * Used by session manager for intelligent command routing
   */
  getCommandRouter(): DynamicCommandRouter {
    return this.commandRouter;
  }

  /**
   * TASK-SKIN-004B: Get backend capability profile for prioritization decisions
   * Used by two-tier prioritization system (TASK-SKIN-005)
   */
  getBackendCapabilityProfile(backendId: string): BackendCapabilityProfile | undefined {
    return this.backendCapabilityProfiles.get(backendId);
  }

  /**
   * TASK-SKIN-004B: Get all backend capability profiles
   * Used for system-wide capability analysis and prioritization
   */
  getAllBackendCapabilityProfiles(): Map<string, BackendCapabilityProfile> {
    return new Map(this.backendCapabilityProfiles);
  }

  /**
   * GENERIC BACKEND INTEGRATION: Register backend via skin definition
   * This is the target architecture - backends self-describe through skin definitions
   */
  async registerBackendFromSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    if (!skinDefinition.backendConfig) {
      this.log.warn('Skin definition does not contain backendConfig - skipping backend registration');
      return;
    }

    // Handle both skin definition formats safely  
    const backendId = 
      skinDefinition.metadata?.backendService ||
      skinDefinition.backendConfig?.service ||
      skinDefinition.metadata?.backend ||
      skinDefinition.id ||
      'unknown-backend';
    const backendConfig = skinDefinition.backendConfig;

    this.log.info(`[GENERIC] Registering backend ${backendId} from skin definition`);
    this.log.info(`[GENERIC] Protocol: ${backendConfig.protocol}, Endpoint: ${backendConfig.endpoint}`);

    // Store the backend configuration
    this.backendConfigs.set(backendId, backendConfig);

    // TASK-SKIN-004B: Detect and store backend capability profile during registration
    const capabilityProfile = this.detectBackendCapabilityProfile(backendId, skinDefinition);
    this.backendCapabilityProfiles.set(backendId, capabilityProfile);
    this.log.info(`[CAPABILITY_PROFILE] Detected profile for ${backendId}: ${capabilityProfile.skinDefinitionQuality} (health:${capabilityProfile.hasHealthEndpoint}, caps:${capabilityProfile.hasCapabilitiesEndpoint}, ver:${capabilityProfile.hasVersionEndpoint})`);

    // Initialize service health for new backend
    this.serviceHealth.set(backendId, {
      connected: false,
      health: 'unhealthy', 
      lastCheck: 0,
      capabilities: []
    });

    // TASK-SKIN-005: Initialize connection stability tracking for new backend
    this.initializeConnectionStability(backendId);

    // Automatically attempt to establish a live connection once the backend is registered.
    // Stage 6 gating relies on the router being able to execute commands immediately after
    // registration, so we initiate the connection here rather than waiting for a manual kick-off.
    try {
      const connectionResult = await this.connectToService(backendId);
      if (connectionResult.success) {
        this.log.info(
          `[GENERIC] Backend ${backendId} auto-connected during skin registration (${connectionResult.responseTime}ms)`
        );
      } else {
        ErrorHandler.handle(
          new Error(connectionResult.message ?? 'Auto-connection deferred'),
          'backend-service-router.auto-connect.deferred',
          { backendId }
        );
        this.log.warn(
          `[GENERIC] Backend ${backendId} auto-connection deferred: ${connectionResult.message}`
        );
      }
    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'backend-service-router.auto-connect', {
        backendId,
        origin: 'skin-registration',
      });
      this.log.warn(`[GENERIC] Backend ${backendId} auto-connection failed:`, templumError);
      this.lifecycleChannel.emitFailed(backendId, templumError, {
        origin: 'discovery',
        metadata: {
          trigger: 'auto-connect',
          scope: 'registration',
        },
      });
    }

    this.log.info(`[GENERIC] Backend ${backendId} registered successfully with generic system`);
  }

  /**
   * TASK-SKIN-004B: Detect backend capability profile from skin definition
   * Determines which endpoints are available and calculates skin definition quality
   */
  private detectBackendCapabilityProfile(backendId: string, skinDefinition: UniversalSkinDefinition): BackendCapabilityProfile {
    const backendConfig = skinDefinition.backendConfig!;
    
    // Detect endpoint availability from skin definition
    const hasHealthEndpoint = !!backendConfig.healthEndpoint;
    const hasCapabilitiesEndpoint = !!backendConfig.capabilitiesEndpoint;
    // Note: Version endpoint detection based on TASK-SKIN-006 - version comes from metadata primarily
    const hasVersionEndpoint = false; // Will be implemented in TASK-SKIN-006 if needed
    const hasVersionInMetadata = !!skinDefinition.metadata?.version;
    
    // Calculate skin definition quality based on completeness
    let skinDefinitionQuality: 'complete' | 'partial' | 'minimal';
    
    // Complete: Has comprehensive backend integration capabilities
    const hasComprehensiveMetadata = !!(skinDefinition.metadata?.version && skinDefinition.metadata?.description);
    const hasDirectCapabilities = !!(backendConfig.capabilities && backendConfig.capabilities.length > 0);
    const hasVersionInfo = hasVersionEndpoint || hasVersionInMetadata;
    
    if ((hasHealthEndpoint && hasCapabilitiesEndpoint && hasVersionInfo) || 
        (hasDirectCapabilities && hasComprehensiveMetadata && (hasHealthEndpoint || hasCapabilitiesEndpoint))) {
      skinDefinitionQuality = 'complete';
    }
    // Partial: Has some endpoints OR has capabilities defined OR has version info
    else if (hasHealthEndpoint || hasCapabilitiesEndpoint || hasVersionInfo || hasDirectCapabilities) {
      skinDefinitionQuality = 'partial';
    }
    // Minimal: Basic skin definition with minimal backend integration
    else {
      skinDefinitionQuality = 'minimal';
    }
    
    const capabilityProfile: BackendCapabilityProfile = {
      backendId,
      hasHealthEndpoint,
      hasCapabilitiesEndpoint,
      hasVersionEndpoint: hasVersionInfo, // Includes both endpoint and metadata-based version detection
      skinDefinitionQuality,
      endpointAvailability: {
        health: hasHealthEndpoint,
        capabilities: hasCapabilitiesEndpoint,
        version: hasVersionInfo
      },
      detectionTimestamp: Date.now()
    };
    
    return capabilityProfile;
  }

  async discoverAndConnect(): Promise<void> {
    const _startTime = Date.now();

    // GENERIC SYSTEM: Always use skin-driven discovery
    this.log.info('[GENERIC_INTEGRATION] Starting skin-driven backend discovery');
    await this.discoverAndConnectGeneric();
  }

  /**
   * Generic service discovery using multi-strategy ServiceDiscovery system
   * NEW APPROACH: Replaces hardcoded discovery with intelligent multi-strategy discovery
   */
  private async discoverAndConnectGeneric(): Promise<void> {
    this.log.info('[SERVICE_DISCOVERY] Starting generic multi-strategy service discovery...');
    
    const discoveredServices: string[] = [];
    const failedServices: string[] = [];
    const discoveryMetrics = {
      totalAttempts: 0,
      successfulConnections: 0,
      retryAttempts: 0,
      discoveryStartTime: Date.now()
    };

    try {
      // Use ServiceDiscovery system to find available backends
      const discoveredBackends = await this.resolveDiscoveredBackends();
      this.log.info(`[SERVICE_DISCOVERY] Discovery found ${discoveredBackends.length} potential backends`);

      // Clear existing backend configs and replace with discovered ones
      this.backendConfigs.clear();
      this.discoveredServiceCache.clear();
      
      // Process discovered services
      for (const discoveredService of discoveredBackends) {
        this.log.info(`[SERVICE_DISCOVERY] Processing discovered service: ${discoveredService.id} (${discoveredService.discoveryMethod}, confidence: ${discoveredService.confidence})`);
        
        // Cache the discovered service metadata for downstream consumers
        this.discoveredServiceCache.set(discoveredService.id, discoveredService);

        // Store the discovered backend configuration
        this.backendConfigs.set(discoveredService.id, discoveredService.config);
        
        // Initialize service health
        this.serviceHealth.set(discoveredService.id, {
          connected: false,
          health: 'unhealthy',
          lastCheck: 0,
          capabilities: []
        });
      }

      // Connect to discovered services using the same connection logic
      const connectionPromises = Array.from(this.backendConfigs.entries()).map(async ([serviceId, config]) => {
        discoveryMetrics.totalAttempts++;
        this.log.info(`[SERVICE_DISCOVERY] Connecting to discovered service ${serviceId} at ${config.endpoint}`);
        
        try {
          const connected = await this.connectToServiceGeneric(serviceId, config, discoveryMetrics, 'discovery');
          
          if (connected) {
            discoveredServices.push(serviceId);
            // Enhanced health monitoring with capability detection
            await this.detectServiceCapabilities(serviceId);
            this.updateServiceHealth(serviceId, true, 'healthy', undefined, await this.getServiceVersion(serviceId));
            this.log.info(`[SERVICE_DISCOVERY] Successfully connected to ${serviceId}`);
          } else {
            failedServices.push(serviceId);
            this.updateServiceHealth(serviceId, false, 'unhealthy', `Connection failed for ${config.endpoint}`);
            this.log.warn(`[SERVICE_DISCOVERY] Connection failed for ${serviceId}`);
          }
        } catch (error) {
          failedServices.push(serviceId);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.updateServiceHealth(serviceId, false, 'error', errorMessage);
          this.log.warn(`[SERVICE_DISCOVERY] Connection error for ${serviceId}: ${errorMessage}`);
        }
      });

      // Wait for all connection attempts to complete
      await Promise.allSettled(connectionPromises);

      this.manualOverrideManager.syncWithServices(new Set(this.backendConfigs.keys()));
      
    } catch (error) {
      this.log.error('[SERVICE_DISCOVERY] Generic discovery failed:', error);
      // Generic system failure - no fallback to hardcoded legacy system
      this.log.warn('[SERVICE_DISCOVERY] Generic discovery failure - system running in standalone mode');
    }

    const discoveryDuration = Date.now() - discoveryMetrics.discoveryStartTime;
    const totalServices = this.backendConfigs.size;
    const successRate = totalServices > 0 ? (discoveredServices.length / totalServices * 100) : 0;

    this.log.info(`[SERVICE_DISCOVERY] Generic discovery complete - ${discoveredServices.length}/${totalServices} services connected`);
    this.log.info(`[SERVICE_DISCOVERY] Metrics - Success rate: ${successRate.toFixed(1)}%, Duration: ${discoveryDuration}ms`);

    // Emit discovery completion event
    this.emit('discovery:complete', {
      discoveredServices,
      failedServices,
      metrics: discoveryMetrics,
      successRate,
      discoveryDuration,
      generic: true,
      discoveryMethod: 'multi-strategy'
    });

    if (discoveredServices.length === 0) {
      this.log.warn('[SERVICE_DISCOVERY] No services connected - system running in standalone mode');
    } else {
      this.log.info(`[SERVICE_DISCOVERY] Successfully connected to ${discoveredServices.length} backend services`);
      if (this.healthMonitoringEnabled) {
        this.startContinuousHealthMonitoring();
      }
    }
  }

  /**
   * Resolve discovered backend services, tolerating mocked discovery instances.
   * Falls back to cached discovery results to keep the router state consistent.
   */
  private async resolveDiscoveredBackends(): Promise<DiscoveredService[]> {
    try {
      const discoveryResult = await this.serviceDiscovery.discoverServices();

      if (Array.isArray(discoveryResult)) {
        return discoveryResult;
      }

      if (discoveryResult !== undefined) {
        this.log.warn(
          `[SERVICE_DISCOVERY] Expected discoverServices() to return an array, received ${typeof discoveryResult}; using cached services instead.`
        );
      }
    } catch (error) {
      this.log.warn('[SERVICE_DISCOVERY] discoverServices() failed; falling back to cached services.', error);
    }

    try {
      const cachedServices = this.serviceDiscovery.getDiscoveredServices();

      if (cachedServices.length > 0) {
        this.log.info(`[SERVICE_DISCOVERY] Using ${cachedServices.length} cached service entries for connection attempts.`);
      }

      return cachedServices;
    } catch (cacheError) {
      this.log.warn('[SERVICE_DISCOVERY] Unable to access cached discovered services; proceeding with empty list.', cacheError);
      return [];
    }
  }


  /**
   * GENERIC CONNECTION: Connect to service using ConnectionFactory
   * Replaces hardcoded connection creation with generic factory approach
   */
  private async connectToServiceGeneric(
    serviceId: string, 
    config: BackendConfig, 
    metrics: { retryAttempts: number },
    origin: 'discovery' | 'manual' | 'recovery' = 'discovery'
  ): Promise<boolean> {
    const maxRetries = config.retries || 3;
    const baseDelayMs = 1000;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const attemptStart = Date.now();
      try {
        this.log.info(`Backend Service Router: [GENERIC] Connection attempt ${attempt + 1}/${maxRetries} for ${serviceId}`);
        
        // USE CONNECTION FACTORY: Create connection based on backend configuration
        const connection = await ConnectionFactory.create(serviceId, config);
        
        if (connection) {
          this.connections.set(serviceId, connection);
          // Test connection
          await connection.connect();
          
          if (connection.isConnected()) {
            this.log.info(`Backend Service Router: [GENERIC] Successfully connected to ${serviceId} on attempt ${attempt + 1}`);
            const responseTimeMs = Date.now() - attemptStart;
            this.lifecycleChannel.emitConnected(serviceId, {
              attempts: attempt + 1,
              retryAttempts: metrics.retryAttempts,
              responseTimeMs,
              origin,
              metadata: {
                endpoint: config.endpoint,
                protocol: config.protocol
              }
            });
            return true;
          }
        }
        
        // Exponential backoff for retries
        if (attempt < maxRetries - 1) {
          const delayMs = baseDelayMs * Math.pow(2, attempt);
          this.log.info(`Backend Service Router: [GENERIC] Retrying ${serviceId} in ${delayMs}ms...`);
          metrics.retryAttempts++;
          await sleep(delayMs);
        }
        
      } catch (error) {
        this.log.warn(`Backend Service Router: [GENERIC] Connection attempt ${attempt + 1} failed for ${serviceId}:`, error);
        metrics.retryAttempts++;
        
        if (attempt === maxRetries - 1) {
          const templumError = ErrorHandler.handle(error, 'backend-service-router.connect-service.generic', {
            serviceId,
            attempt: attempt + 1,
            origin,
            endpoint: config.endpoint,
            protocol: config.protocol,
          });
          this.lifecycleChannel.emitFailed(serviceId, templumError, {
            attempts: attempt + 1,
            retryAttempts: metrics.retryAttempts,
            origin,
            metadata: {
              endpoint: config.endpoint,
              protocol: config.protocol
            }
          });
          throw templumError;
        }
      }
    }
    this.lifecycleChannel.emitFailed(serviceId, 'Connection attempts exhausted without establishing a session', {
      attempts: maxRetries,
      retryAttempts: metrics.retryAttempts,
      origin,
      metadata: {
        endpoint: config.endpoint,
        protocol: config.protocol
      }
    });
    
    return false;
  }

  /**
   * Enhanced service discovery with intelligent retry logic and protocol-specific optimizations
   */
  private async discoverServiceWithRetry(
    serviceId: string, 
    endpoint: string, 
    metrics: { retryAttempts: number }
  ): Promise<boolean> {
    const maxRetries = 3;
    const baseDelayMs = 1000;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.log.info(`Backend Service Router: Discovery attempt ${attempt + 1}/${maxRetries} for ${serviceId}`);
        
        // Protocol-specific discovery optimizations
        const connected = await this.connectToServiceWithDiscovery(serviceId, endpoint);
        
        if (connected) {
          this.log.info(`Backend Service Router: Successfully discovered ${serviceId} on attempt ${attempt + 1}`);
          return true;
        }
        
        // Exponential backoff for retries
        if (attempt < maxRetries - 1) {
          const delayMs = baseDelayMs * Math.pow(2, attempt);
          this.log.info(`Backend Service Router: Retrying ${serviceId} in ${delayMs}ms...`);
          metrics.retryAttempts++;
          await sleep(delayMs);
        }
        
      } catch (error) {
        this.log.warn(`Backend Service Router: Discovery attempt ${attempt + 1} failed for ${serviceId}:`, error);
        metrics.retryAttempts++;
        
        // Continue retrying unless it's the last attempt
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
    }
    
    return false;
  }

  /**
   * Attempt to connect to a specific backend service with enhanced discovery
   */
  private async connectToServiceWithDiscovery(serviceId: string, endpoint: string): Promise<boolean> {
    try {
      // Create protocol-specific connection based on endpoint
      const connection = await this.createServiceConnection(serviceId, endpoint);
      
      if (connection) {
        this.connections.set(serviceId, connection);
        // Test connection with enhanced health check
        await connection.connect();
        
        if (connection.isConnected()) {
          // Perform protocol-specific service verification
          const verified = await this.verifyServiceConnection(serviceId, connection);
          return verified;
        }
      }
      
      return false;
    } catch (error) {
      this.log.error(`Failed to connect to ${serviceId} at ${endpoint}:`, error);
      return false;
    }
  }

  /**
   * Verify service connection with protocol-specific checks
   */
  private async verifyServiceConnection(serviceId: string, connection: BackendConnection): Promise<boolean> {
    try {
      this.log.info(`Backend Service Router: Verifying ${serviceId} connection via ${connection.protocol}...`);
      
      // Protocol-specific verification
      switch (connection.protocol) {
        case 'ipc':
          return await this.verifyIPCService(connection);
        case 'http':
          return await this.verifyHTTPService(connection);
        case 'websocket':
          return await this.verifyWebSocketService(connection);
        default:
          return true; // Basic connection established
      }
    } catch (error) {
      this.log.warn(`Service verification failed for ${serviceId}:`, error);
      return false;
    }
  }

  /**
   * Verify IPC service connection
   */
  private async verifyIPCService(connection: BackendConnection): Promise<boolean> {
    try {
      // Send ping message to verify IPC communication
      if (connection.connection && connection.isConnected()) {
        const childProcess = connection.connection as ChildProcess;
        return new Promise<boolean>((resolve) => {
          let settled = false;
          let timeout: ManagedTimeout;

          const finish = (result: boolean) => {
            if (settled) {
              return;
            }
            settled = true;
            timeout.cancel();
            childProcess.off('message', pingHandler);
            resolve(result);
          };

          const pingHandler = (message: IPCMessage | IPCResponse) => {
            if (message.type === 'pong' || (message as IPCResponse).success) {
              finish(true);
            }
          };

          timeout = this.scheduleTimeout(() => finish(false), 2000);

          childProcess.on('message', pingHandler);
          childProcess.send({ type: 'ping', timestamp: Date.now() });
        });
      }
      return false;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Verify HTTP service connection
   */
  private async verifyHTTPService(connection: BackendConnection): Promise<boolean> {
    try {
      // Test with service-specific health endpoint
      const controller = new AbortController();
      const timeout = this.scheduleTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(`${connection.endpoint}/api/status`, {
          method: 'GET',
          headers: { 'X-Service-Check': connection.id },
          signal: controller.signal
        });

        return response.ok || response.status === 404; // 404 acceptable - service running but endpoint may not exist
      } finally {
        timeout.cancel();
      }
    } catch (_error) {
      // HTTP service may not have status endpoint yet - connection test was sufficient
      return true;
    }
  }

  /**
   * Verify WebSocket service connection
   */
  private async verifyWebSocketService(connection: BackendConnection): Promise<boolean> {
    try {
      if (connection.connection && connection.isConnected()) {
        const ws = connection.connection as WebSocket.WebSocket;
        return new Promise<boolean>((resolve) => {
          let settled = false;
          let timeout: ManagedTimeout;

          const finish = (result: boolean) => {
            if (settled) {
              return;
            }
            settled = true;
            timeout.cancel();
            ws.off('message', messageHandler);
            resolve(result);
          };

          const messageHandler = (data: WebSocket.RawData) => {
            const outcome = this.parseRouterMessage<IPCMessage | IPCResponse>(data.toString(), {
              context: 'backend:router:websocket:verification',
              serviceId: connection.id,
              direction: 'inbound'
            });

            if (outcome.ok && outcome.value) {
              const message = outcome.value;
              if (message.type === 'pong' || (message as IPCResponse).success) {
                finish(true);
              }
            }
          };

          timeout = this.scheduleTimeout(() => finish(false), 2000);

          ws.on('message', messageHandler);
          const pingOutcome = this.stringifyRouterMessage(
            { type: 'ping', timestamp: Date.now() },
            {
              context: 'backend:router:websocket:verification',
              serviceId: connection.id,
              direction: 'outbound'
            }
          );

          if (pingOutcome.ok && pingOutcome.value) {
            ws.send(pingOutcome.value);
          } else {
            this.log.warn('[WebSocket] Verification ping serialization failed', {
              context: pingOutcome.meta.context,
              status: pingOutcome.status
            });
          }
        });
      }
      return false;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Detect service capabilities through API introspection
   */
  private async detectServiceCapabilities(serviceId: string): Promise<void> {
    try {
      const connection = this.connections.get(serviceId);
      if (!connection?.isConnected()) {
        return;
      }

      this.log.info(`Backend Service Router: Detecting capabilities for ${serviceId}...`);
      
      // Attempt to query service capabilities
      const capabilities = await this.queryServiceCapabilities(serviceId, connection);
      
      // Update service status with detected capabilities
      const currentStatus = this.serviceHealth.get(serviceId);
      if (currentStatus && capabilities.length > 0) {
        currentStatus.capabilities = capabilities;
        this.log.info(`Backend Service Router: Detected ${capabilities.length} capabilities for ${serviceId}:`, capabilities);
      }
    } catch (error) {
      this.log.warn(`Capability detection failed for ${serviceId}:`, error);
      // Keep default capabilities from initialization
    }
  }

  /**
   * Query service capabilities - skin definition as single source of truth
   * TASK-SKIN-004: Extract capabilities from skin definition first, API fallback only if explicitly configured
   */
  private async queryServiceCapabilities(serviceId: string, connection: BackendConnection): Promise<string[]> {
    // STEP 1: Check capabilities from skin definition (single source of truth)
    const backendConfig = this.backendConfigs.get(serviceId);
    if (
      backendConfig?.capabilities &&
      TypeValidators.isArrayOf(backendConfig.capabilities, TypeGuards.isNonEmptyString) &&
      backendConfig.capabilities.length > 0
    ) {
      this.log.info(
        `[SKIN-CAPABILITIES] Using capabilities from skin definition for ${serviceId}:`,
        backendConfig.capabilities,
      );
      return backendConfig.capabilities;
    }
    
    // STEP 2: Only call API if explicitly specified in skin definition
    if (backendConfig?.capabilitiesEndpoint) {
      try {
        this.log.info(`[API-CAPABILITIES] Calling explicit capabilitiesEndpoint for ${serviceId}: ${backendConfig.capabilitiesEndpoint}`);
        const response = await this.callBackendServiceAPI(connection, 'getCapabilities', {});
        
        if (
          TypeGuards.isPlainObject(response) &&
          SemanticValidators.hasArrayOf(response, 'capabilities', TypeGuards.isNonEmptyString, {
            required: true,
            minimumConfidence: 75,
          })
        ) {
          const capabilityList = (response as { capabilities: string[] }).capabilities;
          this.log.info(`[API-CAPABILITIES] Retrieved capabilities from endpoint for ${serviceId}:`, capabilityList);
          return capabilityList;
        }
      } catch (error) {
        this.log.warn(`[API-CAPABILITIES] Failed to query capabilities endpoint for ${serviceId}:`, error);
      }
    }
    
    // STEP 3: Return default capabilities as final fallback
    const defaultCapabilities = this.serviceHealth.get(serviceId)?.capabilities || [];
    this.log.info(`[FALLBACK-CAPABILITIES] Using default capabilities for ${serviceId}:`, defaultCapabilities);
    return defaultCapabilities;
  }

  /**
   * Get service version information
   * TASK-SKIN-006: Implements hierarchical version extraction:
   * 1. Primary: skinDefinition.metadata.version  
   * 2. Secondary: backendConfig.versionEndpoint if specified
   * 3. Fallback: no version display
   */
  private async getServiceVersion(serviceId: string): Promise<string | undefined> {
    try {
      const connection = this.connections.get(serviceId);
      if (!connection?.isConnected()) {
        return undefined;
      }

      // TASK-SKIN-006: Primary - Try to get version from skin definition metadata
      try {
        const skinDefinition = await this.loadBackendSkin(serviceId);
        if (skinDefinition?.metadata?.version) {
          this.log.info(`[SKIN-VERSION] ${serviceId} version from skin metadata: ${skinDefinition.metadata.version}`);
          return skinDefinition.metadata.version;
        }
      } catch (skinError) {
        this.log.debug(`[SKIN-VERSION] Could not load skin for ${serviceId}:`, skinError);
        // Continue to secondary method
      }

      // TASK-SKIN-006: Secondary - Use version endpoint if specified in backend config endpoints
      const backendConfig = this.backendConfigs.get(serviceId);
      if (backendConfig?.endpoints?.version) {
        this.log.info(`[SKIN-VERSION] ${serviceId} has version endpoint, querying: ${backendConfig.endpoints.version}`);
        const response = await this.callBackendServiceAPI(connection, 'getVersion', {});
        
        if (response && (response as { version?: string }).version) {
          this.log.info(`[SKIN-VERSION] ${serviceId} version from endpoint: ${(response as { version?: string }).version}`);
          return (response as { version?: string }).version!
        }
      }
    } catch (error) {
      this.log.debug(`[SKIN-VERSION] Version query failed for ${serviceId}:`, error);
      // Continue to fallback
    }
    
    // TASK-SKIN-006: Fallback - Return undefined for no version display
    this.log.debug(`[SKIN-VERSION] No version information available for ${serviceId}`);
    return undefined;
  }

  /**
   * Start continuous health monitoring for connected services
   */
  private startContinuousHealthMonitoring(): void {
    if (!this.healthMonitoringEnabled) {
      return;
    }

    this.log.info('Backend Service Router: Starting continuous health monitoring...');
    
    // GENERIC INTEGRATION: Continuous health monitoring for skin-driven backends
    // Integrated with Universal Skin Engine coordination for enhanced monitoring
    // Implementation: Periodic health checks with degraded service recovery detection
    
    // For now, set up basic periodic health checks
    if (this.continuousHealthInterval) {
      this.continuousHealthInterval.stop();
    }

    this.continuousHealthInterval = createInterval(
      () => this.performHealthChecks(),
      30000,
      { unref: true }
    ); // Check every 30 seconds
  }


  private updateServiceHealth(
    serviceId: string,
    connected: boolean,
    health: 'healthy' | 'unhealthy' | 'error',
    error?: string,
    version?: string,
    responseTime?: number
  ): void {
    const existingStatus = this.serviceHealth.get(serviceId);
    const baselineCapabilities = existingStatus?.capabilities ?? [];
    const status: BackendStatus = existingStatus ?? {
      connected,
      health,
      lastCheck: Date.now(),
      lastError: error,
      capabilities: baselineCapabilities
    };

    if (!existingStatus) {
      this.serviceHealth.set(serviceId, status);
    }

    const wasConnected = existingStatus?.connected === true;
    const previousHealth = existingStatus?.health;

    status.connected = connected;
    status.health = health;
    status.lastCheck = Date.now();
    status.lastError = error;
    if (version) {
      status.version = version;
    }
    if (responseTime !== undefined) {
      status.responseTime = responseTime;
    }
    
    // Emit lifecycle transitions only when the backend was previously connected
    if (wasConnected && connected) {
      if (health === 'healthy' && previousHealth && previousHealth !== 'healthy') {
        this.lifecycleChannel.emitRecovered(serviceId, {
          origin: 'health-monitor',
          metadata: {
            previousHealth,
            error
          }
        });
      } else if (health !== 'healthy' && previousHealth !== health) {
        if (health === 'error') {
          this.lifecycleChannel.emitFailed(serviceId, error ?? 'Backend health reported as error', {
            origin: 'health-monitor',
            metadata: {
              previousHealth,
              error
            }
          });
        } else {
          this.lifecycleChannel.emitHealthDegraded(serviceId, {
            origin: 'health-monitor',
            responseTimeMs: responseTime,
            metadata: {
              previousHealth,
              error
            }
          });
        }
      }
    } else if (wasConnected && !connected) {
      this.lifecycleChannel.emitDisconnected(serviceId, {
        origin: 'health-monitor',
        metadata: {
          previousHealth,
          error
        }
      });
    }
    
    // TASK-SKIN-005: Update connection stability for minimal backends
    this.updateConnectionStability(serviceId, connected, responseTime);
  }

  /**
   * TASK-SKIN-005: Update connection stability tracking for minimal backends
   * Tracks connection success/failure history for two-tier prioritization system
   */
  private updateConnectionStability(serviceId: string, connectionSuccessful: boolean, responseTime?: number): void {
    const status = this.serviceHealth.get(serviceId);
    if (!status) return;

    // Initialize connection stability if not present
    if (!status.connectionStability) {
      status.connectionStability = {
        successfulConnections: 0,
        totalConnectionAttempts: 0,
        stabilityPercentage: 0,
        lastConnectionAttempt: Date.now(),
        connectionHistory: []
      };
    }

    const stability = status.connectionStability;
    stability.totalConnectionAttempts++;
    stability.lastConnectionAttempt = Date.now();

    if (connectionSuccessful) {
      stability.successfulConnections++;
    }

    // Add to connection history (keep last 50 attempts)
    stability.connectionHistory.push({
      timestamp: Date.now(),
      success: connectionSuccessful,
      responseTime
    });

    // Keep only last 50 connection attempts to prevent memory bloat
    if (stability.connectionHistory.length > 50) {
      stability.connectionHistory.shift();
    }

    // Calculate stability percentage
    stability.stabilityPercentage = (stability.successfulConnections / stability.totalConnectionAttempts) * 100;

    this.log.info(`[CONNECTION_STABILITY] ${serviceId} stability: ${stability.stabilityPercentage.toFixed(1)}% (${stability.successfulConnections}/${stability.totalConnectionAttempts})`);
  }

  /**
   * TASK-SKIN-005: Get connection stability percentage for a backend
   * Used by two-tier prioritization system for minimal backends
   */
  getConnectionStability(serviceId: string): number {
    const status = this.serviceHealth.get(serviceId);
    return status?.connectionStability?.stabilityPercentage || 0;
  }

  /**
   * TASK-SKIN-005: Two-tier backend prioritization helper
   * Exposed for orchestration and testing so higher layers can share the same scoring logic
   */
  prioritizeBackendsTwoTier(
    backends: Array<{ backendId: string; status: any }>
  ): Array<{ backendId: string; score: number; tier: 'health-enabled' | 'minimal' }> {
    const prioritized: Array<{ backendId: string; score: number; tier: 'health-enabled' | 'minimal' }> = [];

    for (const { backendId, status } of backends) {
      const capabilityProfile = this.getBackendCapabilityProfile(backendId);

      if (capabilityProfile?.hasHealthEndpoint) {
        const healthFactor = status.health === 'healthy' ? 1 : status.health === 'unhealthy' ? 0.5 : 0;
        const capabilitiesCount = status.capabilities?.length ?? 0;
        const responseTimeFactor = typeof status.responseTime === 'number'
          ? Math.max(0, (1000 - status.responseTime) / 1000)
          : 0.5;
        const versionFactor = status.version ? 1 : 0;

        const score = (healthFactor * 100)
          + (capabilitiesCount * 10)
          + (responseTimeFactor * 5)
          + (versionFactor * 2);

        prioritized.push({ backendId, score, tier: 'health-enabled' });
        continue;
      }

      const connectionStability = this.getConnectionStability(backendId);
      const skinCompleteness = this.calculateSkinCompleteness(capabilityProfile?.skinDefinitionQuality ?? 'minimal');
      const commandCount = status.capabilities?.length ?? 0;

      const score = (connectionStability * 0.8)
        + (skinCompleteness * 15)
        + (commandCount * 5);

      prioritized.push({ backendId, score, tier: 'minimal' });
    }

    prioritized.sort((a, b) => {
      const aAdjusted = a.tier === 'health-enabled' ? a.score : a.score + 50;
      const bAdjusted = b.tier === 'health-enabled' ? b.score : b.score + 50;
      return bAdjusted - aAdjusted;
    });

    return prioritized;
  }

  private calculateSkinCompleteness(quality: string): number {
    switch (quality) {
      case 'complete':
        return 10;
      case 'partial':
        return 6;
      case 'minimal':
        return 3;
      default:
        return 1;
    }
  }

  /**
   * TASK-SKIN-005: Initialize connection stability tracking for a new backend
   * Called during backend registration from skin definition
   */
  private initializeConnectionStability(serviceId: string): void {
    const status = this.serviceHealth.get(serviceId);
    if (status && !status.connectionStability) {
      status.connectionStability = {
        successfulConnections: 0,
        totalConnectionAttempts: 0,
        stabilityPercentage: 0,
        lastConnectionAttempt: Date.now(),
        connectionHistory: []
      };
    }
  }

  /**
   * Create a service connection based on protocol
   */
  private async createServiceConnection(serviceId: string, endpoint: string): Promise<BackendConnection> {
    const url = new URL(endpoint);
    const protocol = url.protocol.slice(0, -1) as 'ipc' | 'http' | 'websocket';

    switch (protocol) {
      case 'ipc':
        return this.createIPCConnection(serviceId, endpoint);
      case 'http':
        return this.createHTTPConnection(serviceId, endpoint);
      case 'websocket':
        return this.createWebSocketConnection(serviceId, endpoint);
      default:
        throw createTemplumError(`Unsupported protocol: ${protocol}`, 'PROTOCOL_ERROR', 'integration');
    }
  }

  /**
   * Create IPC connection (for Haruspex service)
   * Real IPC implementation connecting to existing Haruspex service
   */
  private createIPCConnection(serviceId: string, endpoint: string): BackendConnection {
    // Create instance of Haruspex IPC client for real service communication
    const ipcClient = new HaruspexIPCClient(this.log, undefined, undefined, {
      record: (snapshot: RouterSerializationSnapshot) =>
        this.recordSerializationSnapshot(serviceId, snapshot)
    });
    let connected = false;

    return {
      id: serviceId,
      protocol: 'ipc',
      endpoint,
      connection: ipcClient,
      isConnected: () => {
        const status = ipcClient.getConnectionStatus();
        return status.connected && connected;
      },
      connect: async () => {
        try {
          this.log.info(`[IPC] Establishing real connection to ${serviceId} Haruspex service`);
          
          // Connect to real running Haruspex service using IPC protocol
          await ipcClient.connect();
          connected = true;
          
          this.log.info(`[IPC] Successfully connected to real ${serviceId} service`);
          
          // Verify connection with ping
          try {
            await ipcClient.sendRequest('ping');
            this.log.info(`[IPC] Connection verified with ${serviceId} service`);
          } catch (error) {
            this.log.warn(`[IPC] Ping verification failed, but connection established: ${error}`);
          }
          
        } catch (error) {
          connected = false;
          throw createTemplumError(`Failed to establish real IPC connection to ${serviceId}: ${error}`, 'IPC_CONNECTION_FAILED', 'integration');
        }
      },
      disconnect: async () => {
        try {
          this.log.info(`[IPC] Disconnecting from real ${serviceId} service`);
          await ipcClient.disconnect();
          connected = false;
          this.log.info(`[IPC] Successfully disconnected from ${serviceId} service`);
        } catch (error) {
          this.log.warn(`[IPC] Warning during disconnection from ${serviceId}: ${error}`);
          connected = false;
        }
      }
    };
  }

  /**
   * Create HTTP connection (for PCL service)
   * Real HTTP implementation connecting to Phoenix Code Lite HTTP server
   */
  private createHTTPConnection(serviceId: string, endpoint: string): BackendConnection {
    let httpConnected = false;
    
    return {
      id: serviceId,
      protocol: 'http',
      endpoint,
      isConnected: () => httpConnected,
      connect: async () => {
        try {
          this.log.info(`[HTTP] Testing real connection to ${serviceId} PCL service at ${endpoint}`);
          
          // Real HTTP Communication Implementation - COMPLETE
          // Uses fetch() API for health checks and service verification
          // Supports multiple health endpoints with proper error handling
          
          // Test real PCL HTTP service connection with enhanced health check
          const controller = new AbortController();
          const timeout = this.scheduleTimeout(() => controller.abort(), 10000); // Longer timeout for real service

          try {
            const healthEndpoints = [
              `${endpoint}/api/health`,
              `${endpoint}/api/status`,
              `${endpoint}/health`,
              `${endpoint}/ping`
            ];

            let connected = false;
            for (const healthEndpoint of healthEndpoints) {
              try {
                const response = await fetch(healthEndpoint, {
                  signal: controller.signal,
                  method: 'GET',
                  headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                  const data = await response.text();
                  this.log.info(
                    `[HTTP] Real ${serviceId} service health check successful at ${healthEndpoint}:`,
                    data?.substring(0, 100) || 'OK'
                  );
                  connected = true;
                  break;
                }
              } catch (endpointError) {
                this.log.info(`[HTTP] Health check failed for ${healthEndpoint}: ${endpointError}`);
              }
            }

            if (connected) {
              httpConnected = true;
              this.log.info(`[HTTP] Successfully connected to real ${serviceId} PCL service`);
              await this.testPCLServiceCapabilities(endpoint, serviceId);
            } else {
              throw new Error(`All health endpoints failed for ${serviceId} service`);
            }
          } finally {
            timeout.cancel();
          }
        } catch (error) {
          httpConnected = false;
          throw createTemplumError(`Failed to establish real HTTP connection to ${serviceId}: ${error}`, 'HTTP_CONNECTION_FAILED', 'integration');
        }
      },
      disconnect: async () => {
        this.log.info(`[HTTP] Disconnecting from real ${serviceId} PCL service`);
        httpConnected = false;
      }
    };
  }

  /**
   * Test PCL service capabilities with real service endpoints
   */
  private async testPCLServiceCapabilities(endpoint: string, serviceId: string): Promise<void> {
    try {
      // Test real PCL service API endpoints
      const testEndpoints = [
        `${endpoint}/api/capabilities`,
        `${endpoint}/api/info`,
        `${endpoint}/api/version`
      ];

      this.log.info(`[HTTP] Testing real ${serviceId} PCL service capabilities...`);
      
      for (const testEndpoint of testEndpoints) {
        try {
          const response = await fetch(testEndpoint, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            this.log.info(`[HTTP] Real ${serviceId} service endpoint ${testEndpoint} available:`, data);
          }
        } catch (error) {
          this.log.info(`[HTTP] Real ${serviceId} service endpoint ${testEndpoint} not available: ${error}`);
        }
      }
    } catch (error) {
      this.log.warn(`[HTTP] PCL service capability testing failed: ${error}`);
    }
  }

  /**
   * Create WebSocket connection (for Litany service)
   * Real WebSocket implementation connecting to Litany WebSocket server
   */
  private createWebSocketConnection(serviceId: string, endpoint: string): BackendConnection {
    let ws: WebSocket.WebSocket | null = null;
    let wsConnected = false;

    return {
      id: serviceId,
      protocol: 'websocket',
      endpoint,
      connection: ws,
      isConnected: () => wsConnected && ws !== null && ws.readyState === ws.OPEN,
      connect: async () => {
        try {
          this.log.info(`[WebSocket] Establishing real connection to ${serviceId} Litany service at ${endpoint}`);
          
          // Real WebSocket Communication Implementation - COMPLETED
          // Implements real Litany WebSocket service integration with enhanced handshake protocol
          // Following backend-service-integration-unified pattern from templum-patterns.md
          
          // Connect to real Litany WebSocket service
          const wsUrl = endpoint.replace('ws://', 'ws://').replace('http://', 'ws://');
          ws = new WebSocket.WebSocket(wsUrl);

          return new Promise<void>((resolve, reject) => {
            let timeout: ManagedTimeout | null;
            let settled = false;

            const settle = (action: () => void) => {
              if (settled) {
                return;
              }
              settled = true;
              timeout?.cancel();
              timeout = null;
              action();
            };

            timeout = this.scheduleTimeout(() => {
              wsConnected = false;
              settle(() => reject(new Error(`Real WebSocket connection timeout for ${serviceId}`)));
            }, 15000); // Longer timeout for real service connection

            ws!.onopen = async () => {
              this.log.info(`[WebSocket] Real connection established to ${serviceId} service`);
              
              try {
                await this.performLitanyHandshake(ws!, serviceId);
                wsConnected = true;
                this.log.info(`[WebSocket] Successfully connected to real ${serviceId} service`);
                settle(() => resolve());
              } catch (handshakeError) {
                wsConnected = false;
                this.log.error(`[WebSocket] Handshake failed with real ${serviceId} service:`, handshakeError);
                settle(() => reject(handshakeError));
              }
            };

            ws!.onerror = (error) => {
              wsConnected = false;
              this.log.error(`[WebSocket] Real connection error for ${serviceId}:`, error);
              settle(() => reject(error instanceof Error ? error : new Error(String(error))));
            };

            ws!.onclose = () => {
              wsConnected = false;
              this.log.info(`[WebSocket] Real ${serviceId} service connection closed`);
            };

            ws!.onmessage = (event) => {
              this.log.info(`[WebSocket] Real message from ${serviceId}:`, event.data);
              
              const outcome = this.parseRouterMessage<LitanyWebSocketMessage | IPCMessage>(
                event.data.toString(),
                {
                  context: 'backend:router:websocket:event',
                  serviceId,
                  direction: 'inbound'
                }
              );

              if (outcome.value) {
                this.processLitanyWebSocketMessage(serviceId, outcome.value);
              } else if (!outcome.ok) {
                this.log.warn(`[WebSocket] Failed to parse unsolicited Litany message from ${serviceId}`, {
                  context: outcome.meta.context,
                  status: outcome.status
                });
              }
            };
          });
        } catch (error) {
          wsConnected = false;
          throw createTemplumError(`Failed to establish real WebSocket connection to ${serviceId}: ${error}`, 'WEBSOCKET_CONNECTION_FAILED', 'integration');
        }
      },
      disconnect: async () => {
        if (ws && ws.readyState === ws.OPEN) {
          this.log.info(`[WebSocket] Disconnecting from real ${serviceId} service`);
          ws.close();
          wsConnected = false;
          ws = null;
        }
      }
    };
  }

  /**
   * Perform Litany service handshake with real service protocol
   */
  private async performLitanyHandshake(ws: WebSocket.WebSocket, serviceId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.log.info(`[WebSocket] Performing real handshake with ${serviceId} Litany service`);
      
      let settled = false;
      let handshakeTimeout: ManagedTimeout;

      const finish = (action: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        handshakeTimeout.cancel();
        ws.off('message', handshakeHandler);
        action();
      };

      handshakeTimeout = this.scheduleTimeout(() => {
        finish(() => reject(new Error(`Litany service handshake timeout for ${serviceId}`)));
      }, 5000);

      const handshakeMessage = {
        type: 'handshake',
        service: 'templum-backend-router',
        version: '1.0.0',
        capabilities: ['context-management', 'memory-integration', 'semantic-search'],
        client: 'templum-universal-interface',
        timestamp: Date.now(),
        protocol: 'websocket'
      };

      const handshakeHandler = (data: WebSocket.RawData) => {
        const outcome = this.parseRouterMessage<IPCResponse | IPCMessage>(data.toString(), {
          context: 'backend:router:websocket:handshake',
          serviceId,
          direction: 'inbound'
        });

        if (!outcome.value) {
          return;
        }

        const response = outcome.value as IPCResponse & { success?: boolean; error?: string };

        if (response.type === 'handshake_ack' && response.success) {
          this.log.info(`[WebSocket] Litany service handshake successful for ${serviceId}`);
          finish(() => resolve());
        } else if (response.type === 'handshake_error') {
          finish(() => reject(new Error(`Litany service handshake failed: ${response.error || 'Unknown error'}`)));
        }
      };

      ws.on('message', handshakeHandler);
      
      try {
        const outbound = this.stringifyRouterMessage(handshakeMessage, {
          context: 'backend:router:websocket:handshake',
          serviceId,
          direction: 'outbound'
        });

        if (outbound.ok && outbound.value) {
          ws.send(outbound.value);
          this.log.info(`[WebSocket] Handshake message sent to ${serviceId} Litany service`);
        } else {
          throw new Error(
            `Handshake serialization failed (${outbound.status})`
          );
        }
      } catch (sendError) {
        finish(() => reject(new Error(`Failed to send handshake to Litany service: ${sendError}`)));
      }
    });
  }

  /**
   * Process unsolicited Litany WebSocket messages 
   * Handles notifications, events, and status updates from Litany service
   * Real implementation for context management and skin definition notifications
   */
  private processLitanyWebSocketMessage(serviceId: string, message: LitanyWebSocketMessage | IPCMessage): void {
    this.log.info(`[WebSocket] Processing Litany message from ${serviceId}:`, { 
      type: message.type, 
      method: message.method,
      hasData: !!(message as IPCNotificationMessage).data 
    });

    try {
      // Handle different types of Litany WebSocket messages
      switch (message.type) {
        case 'skin_definition_updated':
          // Handle real-time skin definition updates
          const skinUpdateMsg = message as SkinDefinitionUpdateMessage;
          this.log.info(`[WebSocket] Litany ${serviceId} skin definition updated:`, skinUpdateMsg.skinId);
          if (skinUpdateMsg.skinDefinition) {
            // Emit signal for UI updates - other components can listen for skin changes
            this.log.info(`[WebSocket] Broadcasting skin definition update for ${skinUpdateMsg.skinId}`);
          }
          break;

        case 'context_sync_notification':
          // Handle context synchronization notifications from Litany
          const contextSyncMsg = message as ContextSyncNotificationMessage;
          this.log.info(`[WebSocket] Litany ${serviceId} context sync notification:`, contextSyncMsg.contextId);
          if (contextSyncMsg.data?.syncStatus) {
            this.log.info(`[WebSocket] Context sync ${contextSyncMsg.data.syncStatus} for ${contextSyncMsg.contextId}`);
          }
          break;

        case 'analysis_complete':
          // Handle completed analysis notifications
          const analysisCompleteMsg = message as AnalysisCompleteMessage;
          this.log.info(`[WebSocket] Litany ${serviceId} analysis completed:`, analysisCompleteMsg.analysisId);
          if (analysisCompleteMsg.results) {
            this.log.info(`[WebSocket] Analysis results available for ${analysisCompleteMsg.analysisId}`);
          }
          break;

        case 'service_status':
          // Handle service status updates
          const serviceStatusMsg = message as ServiceStatusMessage;
          this.log.info(`[WebSocket] Litany ${serviceId} status update:`, serviceStatusMsg.status);
          break;

        case 'error_notification':
          // Handle error notifications from Litany service
          const errorNotificationMsg = message as ErrorNotificationMessage;
          this.log.warn(`[WebSocket] Litany ${serviceId} error notification:`, errorNotificationMsg.error);
          break;

        default:
          // Handle unknown message types with graceful logging
          this.log.info(`[WebSocket] Unknown Litany message type from ${serviceId}:`, message.type);
          this.log.info(`[WebSocket] Full message:`, message);
          break;
      }
    } catch (error) {
      this.log.error(`[WebSocket] Error processing Litany message from ${serviceId}:`, error);
      this.log.error(`[WebSocket] Problematic message:`, message);
    }
  }

  /**
   * Generic backend service API caller with protocol routing
   * Routes API calls to appropriate protocol-specific handlers
   */
  private async callBackendServiceAPI(connection: BackendConnection, apiMethod: string, payload: BackendServicePayload): Promise<BackendServicePayload> {
    try {
      this.log.info(`Calling ${apiMethod} on ${connection.id} via ${connection.protocol}...`);
      
      // Protocol-specific API call implementation
      switch (connection.protocol) {
        case 'ipc':
          return await this.callIPCService(connection, apiMethod, payload);
        case 'http':
          return await this.callHTTPService(connection, apiMethod, payload);
        case 'websocket':
          return await this.callWebSocketService(connection, apiMethod, payload);
        default:
          throw createTemplumError(`Unsupported protocol: ${connection.protocol}`, 'PROTOCOL_ERROR', 'integration');
      }
    } catch (error) {
      const errorMsg = isTemplumError(error) ? error.message : `API call failed: ${error}`;
      this.log.error(`Backend service API call failed for ${connection.id}.${apiMethod}:`, errorMsg);
      throw createTemplumError(
        `Backend service API call failed: ${errorMsg}`,
        'API_CALL_FAILED',
        'integration',
        { connectionId: connection.id, protocol: connection.protocol, method: apiMethod }
      );
    }
  }

  /**
   * Call backend service via IPC protocol (Haruspex)
   * Real IPC implementation using HaruspexIPCClient
   */
  private async callIPCService(connection: BackendConnection, apiMethod: string, payload: BackendServicePayload): Promise<BackendServicePayload> {
    this.log.info(`[IPC] Calling ${apiMethod} on ${connection.id}`);
    
    try {
      if (!connection.connection || !connection.isConnected()) {
        throw createTemplumError(`IPC connection to ${connection.id} is not available`, 'IPC_CONNECTION_UNAVAILABLE', 'integration');
      }

      const ipcClient = connection.connection as HaruspexIPCClient;
      
      this.log.info(`[IPC] Sending real IPC request to ${connection.id}:`, { method: apiMethod });
      
      // Map API methods to proper IPC message types
      let messageType: IPCMessageType;
      switch (apiMethod) {
        case 'getSkinDefinition':
          messageType = 'getSkinDefinition';
          break;
        case 'executeCommand':
          messageType = 'executeCommand';
          break;
        case 'getCapabilities':
          messageType = 'getCapabilities';
          break;
        case 'getVersion':
          messageType = 'getVersion';
          break;
        case 'ping':
          messageType = 'ping';
          break;
        default:
          messageType = 'executeCommand'; // Default fallback
      }
      
      // Send real IPC request to Haruspex service
      try {
        const response = await ipcClient.sendRequest(messageType, payload, apiMethod);
        
        this.log.info(`[IPC] Received real response from ${connection.id}:`, { method: apiMethod, hasData: !!response });
        
        // Handle skin definition responses with graceful fallback
        if (apiMethod === 'getSkinDefinition' && !response) {
          this.log.info(`[ARCHITECTURAL SEPARATION] ${connection.id} skin definition not available, using graceful fallback`);
          return { 
            fallback: true, 
            message: 'Skin definition not available from IPC backend',
            source: 'templum-ipc-fallback' 
          };
        }
        
        // Handle different response formats
        if (apiMethod === 'getSkinDefinition' && response) {
          return { skinDefinition: response };
        }
        
        return response;
        
      } catch (requestError) {
        // Handle specific IPC request errors
        const errorMessage = requestError instanceof Error ? requestError.message : String(requestError);
        
        if (errorMessage.includes('timeout')) {
          throw createTemplumError(`IPC call timeout for ${connection.id}.${apiMethod}`, 'IPC_TIMEOUT', 'integration');
        }
        
        if (errorMessage.includes('Not connected')) {
          throw createTemplumError(`IPC connection to ${connection.id} lost during ${apiMethod}`, 'IPC_CONNECTION_LOST', 'integration');
        }
        
        throw requestError;
      }
      
    } catch (error) {
      const errorMsg = isTemplumError(error) ? error.message : `IPC call failed: ${error}`;
      this.log.error(`[IPC] Service call failed for ${connection.id}.${apiMethod}:`, errorMsg);
      
      if (isTemplumError(error)) {
        throw error;
      }
      
      throw createTemplumError(
        `IPC communication failed with ${connection.id}: ${errorMsg}`,
        'IPC_ERROR',
        'integration',
        { protocol: 'ipc', service: connection.id, method: apiMethod, endpoint: connection.endpoint }
      );
    }
  }

  /**
   * Call backend service via HTTP protocol (PCL)
   * Enhanced implementation for real PCL service communication with fallback endpoints
   */
  private async callHTTPService(connection: BackendConnection, apiMethod: string, payload: BackendServicePayload): Promise<BackendServicePayload> {
    this.log.info(`[HTTP] Calling ${apiMethod} on real ${connection.id} PCL service`);
    
    try {
      if (!connection.isConnected()) {
        throw createTemplumError(`HTTP connection to ${connection.id} is not available`, 'HTTP_CONNECTION_UNAVAILABLE', 'integration');
      }

      // Real PCL HTTP API Implementation - Complete with Fault-Tolerant Fallbacks
      // Using fetch() API with proper endpoint mapping, error handling, and timeouts
      // Supports multiple API methods: getSkinDefinition, executeCommand, getCapabilities, getVersion
      // ENHANCEMENT: Fallback endpoints for minimal backends (TASK-API-001)
      
      return await this.tryHTTPEndpointsWithFallback(connection, apiMethod, payload);
      
    } catch (error) {
      const errorMsg = isTemplumError(error) ? error.message : `HTTP call failed: ${error}`;
      this.log.error(`[HTTP] Service call failed for ${connection.id}.${apiMethod}:`, errorMsg);
      
      if (isTemplumError(error)) {
        throw error;
      }
      
      throw createTemplumError(
        `HTTP communication failed with ${connection.id}: ${errorMsg}`,
        'HTTP_ERROR',
        'integration',
        { protocol: 'http', service: connection.id, method: apiMethod, endpoint: connection.endpoint }
      );
    }
  }

  /**
   * Try HTTP endpoints with fault-tolerant fallbacks for minimal backends
   * TASK-API-001: Backend API Endpoint Standardization
   */
  private async tryHTTPEndpointsWithFallback(connection: BackendConnection, apiMethod: string, payload: BackendServicePayload): Promise<BackendServicePayload> {
    const endpointAttempts = this.getEndpointAttempts(connection, apiMethod, payload);
    
    let lastError: Error | null = null;
    
    for (const attempt of endpointAttempts) {
      try {
        this.log.info(`[HTTP] Trying ${connection.id} endpoint: ${attempt.method} ${attempt.endpoint}`);
        
        const controller = new AbortController();
        const timeout = this.scheduleTimeout(() => controller.abort(), 30000);

        try {
          let body: string | undefined;
          if (attempt.method !== 'GET') {
            const bodyOutcome = this.stringifyRouterMessage(attempt.payload ?? {}, {
              context: `backend:router:http:request:${connection.id}`,
              serviceId: connection.id,
              direction: 'outbound'
            });

            if (bodyOutcome.ok && bodyOutcome.value) {
              body = bodyOutcome.value;
            } else {
              throw new Error(`HTTP request serialization failed (${bodyOutcome.status})`);
            }
          }

          const response = await fetch(attempt.endpoint, {
            method: attempt.method,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body,
            signal: controller.signal
          });

          if (response.ok) {
            const responseData = await response.json();
            this.log.info(`[HTTP] SUCCESS ${connection.id} endpoint: ${attempt.method} ${attempt.endpoint}`);
            
            // Handle response transformation if needed
            const result = attempt.transformResponse 
              ? attempt.transformResponse(responseData as BackendServicePayload) 
              : responseData;
            return result as BackendServicePayload;
          } else {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
          }

        } catch (fetchError) {
          throw fetchError;
        } finally {
          timeout.cancel();
        }
        
      } catch (error) {
        this.log.warn(`[HTTP] Failed ${connection.id} endpoint: ${attempt.endpoint} - ${error}`);
        lastError = error as Error;
        continue;
      }
    }
    
    // If all attempts failed, check if we should provide a graceful fallback
    if (this.shouldProvideGracefulFallback(apiMethod)) {
      return this.getGracefulFallbackResponse(connection, apiMethod, payload);
    }
    
    throw lastError || new Error(`All HTTP endpoints failed for ${apiMethod}`);
  }

  /**
   * Get ordered list of endpoints to try for each API method
   */
  private getEndpointAttempts(connection: BackendConnection, apiMethod: string, payload: BackendApiPayload): Array<{
    endpoint: string;
    method: string;
    payload?: BackendApiPayload;
    transformResponse?: (data: unknown) => unknown;
  }> {
    const baseUrl = connection.endpoint;
    
    switch (apiMethod) {
      case 'getSkinDefinition':
        return [
          // Standard PCL endpoint
          {
            endpoint: `${baseUrl}/api/skins/${payload?.skinId || 'default'}`,
            method: 'GET'
          },
          // Minimal backend fallback
          {
            endpoint: `${baseUrl}/getSkinDefinition`,
            method: 'GET'
          }
        ];
        
      case 'getCapabilities':
        return [
          // Standard PCL endpoint
          {
            endpoint: `${baseUrl}/api/capabilities`,
            method: 'GET'
          }
        ];
        
      case 'getVersion':
        return [
          // Standard PCL endpoint
          {
            endpoint: `${baseUrl}/api/version`,
            method: 'GET'
          },
          // Try root endpoint and extract version
          {
            endpoint: `${baseUrl}/`,
            method: 'GET',
            transformResponse: (data: unknown) => 
              (data as { version?: string }).version ? { version: (data as { version?: string }).version } : null
          }
        ];
        
      case 'executeCommand':
        return [
          // Standard PCL endpoint
          {
            endpoint: `${baseUrl}/api/commands/execute`,
            method: 'POST',
            payload: payload
          },
          // Minimal backend fallback
          {
            endpoint: `${baseUrl}/executeCommand`,
            method: 'POST',
            payload: payload
          }
        ];
        
      default:
        return [
          {
            endpoint: `${baseUrl}/api/${apiMethod}`,
            method: 'POST',
            payload: payload
          }
        ];
    }
  }

  /**
   * Check if graceful fallback should be provided for failed API methods
   */
  private shouldProvideGracefulFallback(apiMethod: string): boolean {
    return ['getCapabilities', 'getVersion'].includes(apiMethod);
  }

  /**
   * Provide graceful fallback responses for non-critical endpoints
   */
  private getGracefulFallbackResponse(connection: BackendConnection, apiMethod: string, _payload: BackendServicePayload): BackendServicePayload {
    switch (apiMethod) {
      case 'getCapabilities':
        this.log.info(`[FALLBACK] Providing default capabilities for ${connection.id}`);
        return {
          capabilities: ['getSkinDefinition', 'executeCommand', 'health'],
          source: 'templum-fallback',
          note: 'Default capabilities provided - backend does not expose /api/capabilities endpoint'
        };
        
      case 'getVersion':
        this.log.info(`[FALLBACK] Providing default version for ${connection.id}`);
        return {
          version: 'unknown',
          source: 'templum-fallback',
          note: 'Version not available - backend does not expose /api/version endpoint'
        };
        
      default:
        return {
          fallback: true,
          message: `No fallback available for ${apiMethod}`,
          source: 'templum-fallback-default'
        };
    }
  }

  /**
   * Call backend service via WebSocket protocol (Litany)
   * Enhanced implementation for real Litany service communication
   */
  private async callWebSocketService(connection: BackendConnection, apiMethod: string, payload: BackendServicePayload): Promise<BackendServicePayload> {
    this.log.info(`[WebSocket] Calling ${apiMethod} on real ${connection.id} Litany service`);
    
    try {
      if (!connection.connection || !connection.isConnected()) {
        throw createTemplumError(`WebSocket connection to ${connection.id} is not available`, 'WEBSOCKET_CONNECTION_UNAVAILABLE', 'integration');
      }

      const ws = connection.connection as WebSocket.WebSocket;
      
      // Real Litany WebSocket API Implementation - Enhanced Protocol Communication
      // Implements backend-service-integration-unified pattern with service-specific enhancements
      // Following the established WebSocket protocol pattern from templum-patterns.md

      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Enhanced Litany WebSocket message format with service-specific metadata
      const wsMessage = {
        id: messageId,
        type: 'api_request',
        method: apiMethod,
        payload,
        service: connection.id,
        protocol: 'websocket',
        timestamp: Date.now(),
        // Litany-specific metadata
        client: 'templum-backend-router',
        version: '1.0.0',
        context: 'backend-service-integration'
      };
      
      this.log.info(`[WebSocket] Sending real Litany message:`, { method: apiMethod, messageId, service: connection.id });
      
      // Enhanced WebSocket message handling with longer timeout for real services
      return new Promise((resolve, reject) => {
        let settled = false;
        let timeout: ManagedTimeout;
        let messageHandler: (data: WebSocket.RawData) => void;

        const finish = (action: () => void) => {
          if (settled) {
            return;
          }
          settled = true;
          timeout.cancel();
          ws.off('message', messageHandler);
          action();
        };

        messageHandler = (data: WebSocket.RawData) => {
          const outcome = this.parseRouterMessage<Record<string, any>>(data.toString(), {
            context: 'backend:router:websocket:response',
            serviceId: connection.id,
            direction: 'inbound'
          });

          if (!outcome.value) {
            if (!outcome.ok) {
              this.log.warn('[WebSocket] Failed to parse Litany response', {
                context: outcome.meta.context,
                status: outcome.status
              });
            }
            return;
          }

          const response = outcome.value as {
            id?: string;
            type?: string;
            method?: string;
            requestId?: string;
            success?: boolean;
            error?: string;
            data?: BackendServicePayload;
            result?: BackendServicePayload;
            skinDefinition?: BackendServicePayload;
          };

          if (
            response.id === messageId ||
            (response.type === 'api_response' && response.method === apiMethod) ||
            (response.requestId === messageId)
          ) {
            this.log.info(`[WebSocket] Received response from ${connection.id}:`, {
              method: apiMethod,
              success: response.success !== false,
              hasData: !!response.data
            });

            if (apiMethod === 'getSkinDefinition' && response.skinDefinition) {
              this.log.info(`[WebSocket] Successfully received Litany skin definition`);
              finish(() => resolve({ skinDefinition: response.skinDefinition }));
              return;
            }

            if (apiMethod === 'executeCommand') {
              this.log.info(
                `[WebSocket] Litany command execution result:`,
                response.success ? 'success' : 'failed'
              );
              const resultPayload = response.result ?? response.data;
              if (resultPayload) {
                finish(() => resolve(resultPayload));
                return;
              }

              finish(() => resolve({ success: response.success !== false }));
              return;
            }

            if (apiMethod === 'updateContext' || apiMethod === 'syncMemory') {
              this.log.info(`[WebSocket] Litany context operation completed:`, apiMethod);
              finish(() => resolve(response.data || { success: response.success }));
              return;
            }

            if (response.success === false) {
              finish(() => reject(
                createTemplumError(
                  `Litany service error: ${response.error || 'Unknown error'}`,
                  'WEBSOCKET_SERVICE_ERROR',
                  'integration'
                )
              ));
            } else {
              finish(() => resolve(response.data || response));
            }
          }
        };

        timeout = this.scheduleTimeout(() => {
          finish(() => reject(createTemplumError(
            `Litany WebSocket call timeout for ${apiMethod}`,
            'WEBSOCKET_TIMEOUT',
            'integration'
          )));
        }, 15000);

        ws.on('message', messageHandler);
        
        // Send message to real Litany service
        try {
          const outbound = this.stringifyRouterMessage(wsMessage, {
            context: 'backend:router:websocket:request',
            serviceId: connection.id,
            direction: 'outbound'
          });

          if (outbound.ok && outbound.value) {
            ws.send(outbound.value);
            this.log.info(`[WebSocket] Message sent to real Litany service`);
          } else {
            throw new Error(`WebSocket serialization failed (${outbound.status})`);
          }
        } catch (sendError) {
          finish(() => reject(createTemplumError(
            `Failed to send WebSocket message to Litany service: ${sendError}`,
            'WEBSOCKET_SEND_FAILED',
            'integration'
          )));
        }
      });
      
    } catch (error) {
      const errorMsg = isTemplumError(error) ? error.message : `Litany WebSocket call failed: ${error}`;
      this.log.error(`[WebSocket] Real Litany service call failed for ${apiMethod}:`, errorMsg);
      
      if (isTemplumError(error)) {
        throw error;
      }
      
      throw createTemplumError(
        `Litany WebSocket communication failed: ${errorMsg}`,
        'WEBSOCKET_ERROR',
        'integration',
        { protocol: 'websocket', service: connection.id, method: apiMethod, endpoint: connection.endpoint }
      );
    }
  }

  getConnectionStatus(): BackendConnectionStatus {
    const totalConnections = this.connections.size;
    const healthyConnections = Array.from(this.serviceHealth.values()).filter(
      status => status.connected && status.health === 'healthy'
    ).length;

    const backends: Record<string, BackendStatus> = {};
    for (const [serviceId, status] of Array.from(this.serviceHealth.entries())) {
      backends[serviceId] = { ...status };
    }

    return {
      totalConnections,
      healthyConnections,
      backends
    };
  }

  async loadBackendSkin(
    backendId: string,
    options: { allowFallback?: boolean; visited?: Set<string> } = {}
  ): Promise<UniversalSkinDefinition | null> {
    const { allowFallback = true } = options;
    const visited = options.visited ?? new Set<string>();

    if (visited.has(backendId)) {
      this.log.warn(`[FALLBACK_GUARD] Detected recursive skin load attempt for ${backendId}; aborting to prevent infinite loop`);
      return null;
    }

    visited.add(backendId);

    try {
      const connection = this.connections.get(backendId);
      if (!connection || !connection.isConnected()) {
        this.log.warn(`Backend ${backendId} is not available for skin loading - using Universal Skin Engine fallback`);
        return allowFallback ? await this.getUniversalSkinEngineFallback(backendId, { visited }) : null;
      }

      this.log.info(`Loading skin definition from backend: ${backendId}`);

      const skinDefinitionRequest = {
        backendId,
        timestamp: Date.now(),
        requestedBy: 'templum-backend-router'
      };

      const response = await this.callBackendServiceAPI(connection, 'getSkinDefinition', skinDefinitionRequest);

      const skinPayload =
        response && typeof response === 'object' && 'skinDefinition' in (response as Record<string, unknown>)
          ? (response as { skinDefinition: UniversalSkinDefinition | null }).skinDefinition
          : (response as unknown as UniversalSkinDefinition | null);

      if (skinPayload) {
        this.log.info(`Successfully loaded skin definition from ${backendId}`);

        const skinResponse = { skinDefinition: skinPayload };

        // TASK-SKIN-004: Update stored backend config with capabilities from skin definition
        if (skinResponse.skinDefinition.backendConfig) {
          const currentConfig = this.backendConfigs.get(backendId);
          if (currentConfig) {
            // Merge capabilities from skin definition into stored config
            if (skinResponse.skinDefinition.backendConfig.capabilities) {
              currentConfig.capabilities = skinResponse.skinDefinition.backendConfig.capabilities;
              this.log.info(`[SKIN-CAPABILITIES] Updated stored capabilities for ${backendId}:`, currentConfig.capabilities);
            }
            // Update other backendConfig fields if needed
            Object.assign(currentConfig, skinResponse.skinDefinition.backendConfig);
            this.backendConfigs.set(backendId, currentConfig);
          } else {
            // Store the entire backend config if none exists
            this.backendConfigs.set(backendId, skinResponse.skinDefinition.backendConfig);
            this.log.info(`[SKIN-CAPABILITIES] Stored new backend config for ${backendId}:`, skinResponse.skinDefinition.backendConfig.capabilities);
          }
        }

        // DYNAMIC COMMAND ROUTING: Register backend commands with command router
        try {
          this.commandRouter.registerBackend(connection, skinResponse.skinDefinition);
          this.log.info(`[DYNAMIC_COMMAND_ROUTER] Registered commands for backend: ${backendId}`);
        } catch (routerError) {
          this.log.warn(`[DYNAMIC_COMMAND_ROUTER] Failed to register commands for ${backendId}:`, routerError);
          // Don't fail the skin loading due to command router issues
        }

        // TEMPLUM CORE INTEGRATION: Load skin into Templum Core for interface activation
        try {
          if (this.orchestrator) {
            await this.orchestrator.loadSkin(skinResponse.skinDefinition);
            this.log.info(`[TEMPLUM_CORE] Successfully loaded skin from ${backendId} into Templum Core`);
          } else {
            this.log.warn(`[TEMPLUM_CORE] No orchestrator available - skin loaded into command router only`);
          }
        } catch (coreError) {
          this.log.warn(`[TEMPLUM_CORE] Failed to load skin into Templum Core for ${backendId}:`, coreError);
          // Don't fail the entire skin loading process due to core loading issues
        }

        return skinResponse.skinDefinition;
      }

      this.log.info(`No skin definition available from ${backendId} - using Universal Skin Engine fallback`);
      const fallbackSkin = allowFallback
        ? await this.getUniversalSkinEngineFallback(backendId, { visited })
        : null;

      // Register fallback skin commands if available
      if (fallbackSkin) {
        try {
          this.commandRouter.registerBackend(connection, fallbackSkin as UniversalSkinDefinition);
          this.log.info(`[DYNAMIC_COMMAND_ROUTER] Registered fallback commands for backend: ${backendId}`);
        } catch (routerError) {
          this.log.warn(`[DYNAMIC_COMMAND_ROUTER] Failed to register fallback commands for ${backendId}:`, routerError);
        }

        // TEMPLUM CORE INTEGRATION: Load fallback skin into Templum Core
        try {
          if (this.orchestrator) {
            await this.orchestrator.loadSkin(fallbackSkin);
            this.log.info(`[TEMPLUM_CORE] Successfully loaded fallback skin from ${backendId} into Templum Core`);
          }
        } catch (coreError) {
          this.log.warn(`[TEMPLUM_CORE] Failed to load fallback skin into Templum Core for ${backendId}:`, coreError);
        }
      }

      return fallbackSkin;
    } catch (error) {
      this.log.error(`Failed to load skin from backend ${backendId}:`, error);
      this.log.info(`Using Universal Skin Engine fallback for ${backendId}`);
      const fallbackSkin = allowFallback
        ? await this.getUniversalSkinEngineFallback(backendId, { visited })
        : null;

      // Register fallback skin commands if available
      const connection = this.connections.get(backendId);
      if (fallbackSkin && connection) {
        try {
          this.commandRouter.registerBackend(connection, fallbackSkin as UniversalSkinDefinition);
          this.log.info(`[DYNAMIC_COMMAND_ROUTER] Registered fallback commands for backend: ${backendId} (error recovery)`);
        } catch (routerError) {
          this.log.warn(`[DYNAMIC_COMMAND_ROUTER] Failed to register fallback commands for ${backendId}:`, routerError);
        }
      }

      return fallbackSkin;
    } finally {
      visited.delete(backendId);
    }
  }

  /**
   * Get fallback skin definition through Universal Skin Engine coordination
   * Provides enhanced graceful degradation when backend services are unavailable
   */
  private async getUniversalSkinEngineFallback(
    backendId: string,
    options: { visited?: Set<string> } = {}
  ): Promise<UniversalSkinDefinition | null> {
    const visited = options.visited ?? new Set<string>();
    try {
      this.log.info(`[ENHANCED_FALLBACK_COORDINATION] Coordinating fallback skin generation with Universal Skin Engine for: ${backendId}`);
      
      // Enhanced coordination: delegate to Universal Skin Engine for sophisticated fallback
      const fallbackSkin = await this.generateFallbackThroughEngine(backendId, { visited });
      
      if (fallbackSkin) {
        this.log.info(`[ENHANCED_FALLBACK_COORDINATION] Universal Skin Engine successfully generated fallback skin for ${backendId}`);
        return fallbackSkin;
      } else {
        this.log.warn(`[ENHANCED_FALLBACK_COORDINATION] Universal Skin Engine coordination failed, falling back to simple theme for ${backendId}`);
        return await this.createSimpleFallbackSkin(backendId);
      }
      
    } catch (error) {
      this.log.error(`[ENHANCED_FALLBACK_COORDINATION] Error in enhanced fallback coordination for ${backendId}:`, error);
      
      // Graceful degradation: use simple fallback if Universal Skin Engine coordination fails
      try {
        return await this.createSimpleFallbackSkin(backendId);
      } catch (fallbackError) {
        this.log.error(`[ENHANCED_FALLBACK_COORDINATION] Simple fallback also failed for ${backendId}:`, fallbackError);
        return null;
      }
    }
  }

  /**
   * Generate fallback skin through Universal Skin Engine coordination
   * Leverages Universal Skin Engine capabilities for enhanced fallback quality
   */
  /**
   * ENHANCED: Generate intelligent fallback skin through Universal Skin Engine coordination
   * GENERIC ARCHITECTURE: Leverages skin-driven patterns for enhanced fallback quality
   */
  private async generateFallbackThroughEngine(
    backendId: string,
    options: { visited: Set<string> }
  ): Promise<UniversalSkinDefinition | null> {
    const { visited } = options;
    try {
      const fallbackSkinId = `enhanced-fallback-${backendId}-${Date.now()}`;
      
      this.log.info(`[ENHANCED_COORDINATION] Universal Skin Engine generating intelligent fallback for ${backendId}`);
      
      // ENHANCED: Attempt to derive fallback from any available backend skin definitions
      const availableBackends = Array.from(this.connections.keys());
      let templateSkin: UniversalSkinDefinition | null = null;
      
      // Try to get a reference skin from working backends for better fallback quality
      for (const availableBackend of availableBackends) {
        if (availableBackend !== backendId) {
          try {
            this.log.info(`[ENHANCED_COORDINATION] Attempting to derive fallback from ${availableBackend} skin definition`);
            templateSkin = await this.loadBackendSkin(availableBackend, {
              allowFallback: false,
              visited
            });
            if (templateSkin) {
              this.log.info(`[ENHANCED_COORDINATION] Using ${availableBackend} as template for enhanced fallback`);
              break;
            }
          } catch (error) {
            // Continue to next backend
            this.log.debug(`[ENHANCED_COORDINATION] Could not use ${availableBackend} as template:`, error);
          }
        }
      }
      
      // ENHANCED: Generate fallback based on available template or create minimal fallback
      if (templateSkin) {
        // Create an enhanced fallback by adapting the template
        const enhancedFallback = {
          ...templateSkin,
          id: fallbackSkinId,
          name: `Enhanced Fallback for ${backendId}`,
          version: '1.0.0-fallback',
          description: `Intelligent fallback skin for ${backendId} derived from available backend patterns`,
          metadata: {
            ...templateSkin.metadata,
            id: fallbackSkinId,
            name: `Enhanced Fallback for ${backendId}`,
            backend: backendId.toLowerCase() as BackendType,
            backendService: backendId.toLowerCase(),
            description: `Intelligent fallback derived from ${templateSkin.metadata.backend} patterns`,
            author: 'Templum Universal Skin Engine',
            tags: ['enhanced-fallback', 'template-derived', backendId.toLowerCase(), templateSkin.metadata.backend]
          }
        };
        
        this.log.info(`[ENHANCED_COORDINATION] Generated intelligent fallback skin for ${backendId} using ${templateSkin.metadata.backend} patterns`);
        return enhancedFallback;
      } else {
        // Create minimal fallback when no templates available
        this.log.info(`[ENHANCED_COORDINATION] No template available, creating minimal fallback for ${backendId}`);
        return await this.createSimpleFallbackSkin(backendId);
      }
      
    } catch (error) {
      this.log.error(`[ENHANCED_COORDINATION] Enhanced fallback generation failed for ${backendId}:`, error);
      // Graceful degradation to simple fallback
      return await this.createSimpleFallbackSkin(backendId);
    }
  }

  /**
   * Create simple fallback skin for graceful degradation
   * Used when Universal Skin Engine coordination is unavailable
   */
  private async createSimpleFallbackSkin(backendId: string): Promise<UniversalSkinDefinition | null> {
    try {
      // Determine appropriate interface type based on backend
      const interfaceType = this.mapBackendToInterfaceType(backendId);
      
      // Create basic fallback skin definition using templum-types structure
      const skinId = `simple-fallback-${backendId}-${Date.now()}`;
      const skinName = `Simple Fallback Theme for ${backendId}`;
      const skinVersion = '1.0.0';
      
      // COMPLETED: Type system alignment achieved for fallback skins
      const simpleFallbackSkin: UniversalSkinDefinition = {
        // Root-level properties required by API alignment
        id: skinId,
        name: skinName,
        version: skinVersion,
        description: `Simple fallback skin for ${backendId} (basic degradation)`,
        pclCompatibility: { 
          enabled: false,
          version: '1.0.0',
          reusePercentage: 0,
          inheritancePatterns: [],
          optimizations: []
        },
        
        metadata: {
          id: skinId,
          name: skinName,
          backend: backendId.toLowerCase() as BackendType,
          version: skinVersion,
          compatibleInterfaces: [interfaceType as InterfaceType],
          description: `Simple fallback skin for ${backendId} (basic degradation)`,
          author: 'Templum Backend Service Router',
          backendService: backendId.toLowerCase(),
          tags: ['simple-fallback', 'graceful-degradation', backendId.toLowerCase()]
        },
        themes: {
          light: this.convertSkinThemeToThemeDefinition(this.createSimpleFallbackTheme('light'), 'light')
        },
        components: this.createDefaultComponents(),
        assets: this.createDefaultAssets(),
        inheritance: this.createDefaultInheritance(),
        rendering: this.createDefaultRendering(),
        performance: this.createDefaultPerformance()
      };
      
      return simpleFallbackSkin;
      
    } catch (error) {
      this.log.error(`[GRACEFUL_DEGRADATION] Failed to create simple fallback skin for ${backendId}:`, error);
      return null;
    }
  }

  /**
   * Create a simple fallback theme using the SkinTheme interface
   */
  private createSimpleFallbackTheme(type: 'light' | 'dark'): SkinTheme {
    if (type === 'light') {
      return {
        primary: '#007acc',
        secondary: '#6c757d', 
        accent: '#17a2b8',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        background: '#ffffff',
        foreground: '#333333'
      };
    } else {
      return {
        primary: '#4fc3f7',
        secondary: '#9e9e9e',
        accent: '#26c6da', 
        success: '#66bb6a',
        warning: '#ffca28',
        error: '#ef5350',
        background: '#1e1e1e',
        foreground: '#ffffff'
      };
    }
  }

  /**
   * Convert SkinTheme to ThemeDefinition with proper type structure
   */
  private convertSkinThemeToThemeDefinition(skinTheme: SkinTheme, themeType: 'light' | 'dark'): ThemeDefinition {
    // Create ColorScale from single color values
    const createColorScale = (baseColor: string): ColorScale => ({
      50: this.lightenColor(baseColor, 0.95),
      100: this.lightenColor(baseColor, 0.90),
      200: this.lightenColor(baseColor, 0.75),
      300: this.lightenColor(baseColor, 0.60),
      400: this.lightenColor(baseColor, 0.30),
      500: baseColor, // Base color
      600: this.darkenColor(baseColor, 0.10),
      700: this.darkenColor(baseColor, 0.20),
      800: this.darkenColor(baseColor, 0.30),
      900: this.darkenColor(baseColor, 0.40)
    });

    const colors: ColorPalette = {
      primary: createColorScale(skinTheme.primary),
      secondary: createColorScale(skinTheme.secondary),
      accent: createColorScale(skinTheme.accent),
      neutral: createColorScale(themeType === 'light' ? '#6b7280' : '#9ca3af'),
      semantic: {
        success: createColorScale(skinTheme.success),
        warning: createColorScale(skinTheme.warning),
        error: createColorScale(skinTheme.error),
        info: createColorScale(skinTheme.accent)
      },
      text: {
        primary: skinTheme.foreground,
        secondary: this.adjustOpacity(skinTheme.foreground, 0.8),
        disabled: this.adjustOpacity(skinTheme.foreground, 0.5),
        inverse: skinTheme.background
      },
      background: {
        primary: skinTheme.background,
        secondary: themeType === 'light' ? '#f9fafb' : '#111827',
        tertiary: themeType === 'light' ? '#f3f4f6' : '#1f2937',
        overlay: this.adjustOpacity(skinTheme.background, 0.9)
      },
      border: {
        primary: themeType === 'light' ? '#d1d5db' : '#4b5563',
        secondary: themeType === 'light' ? '#e5e7eb' : '#374151',
        focus: skinTheme.accent,
        error: skinTheme.error
      }
    };

    return {
      name: `Simple Fallback ${themeType} Theme`,
      type: themeType,
      colors,
      typography: {
        fontFamilies: {
          primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          secondary: 'Georgia, serif',
          monospace: '"SF Mono", Monaco, Menlo, Consolas, monospace'
        },
        fontSizes: {
          xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem',
          xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem'
        },
        fontWeights: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 },
        lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
        letterSpacing: { tight: '-0.025em', normal: '0em', wide: '0.025em' }
      },
      spacing: {
        unit: 4, // 4px base unit
        scale: {
          0: 0, 1: 0.25, 2: 0.5, 3: 0.75, 4: 1, 5: 1.25, 6: 1.5,
          8: 2, 10: 2.5, 12: 3, 16: 4, 20: 5, 24: 6, 32: 8
        }
      },
      borders: {
        radii: { none: '0', sm: '0.125rem', base: '0.25rem', md: '0.375rem', lg: '0.5rem' },
        widths: { none: '0', thin: '1px', base: '1px', thick: '2px' },
        styles: { solid: 'solid', dashed: 'dashed', dotted: 'dotted' }
      },
      shadows: {
        elevations: {
          none: 'none',
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        },
        colors: { default: 'rgba(0, 0, 0, 0.1)', accent: this.adjustOpacity(skinTheme.accent, 0.2) }
      },
      animations: {
        durations: { fast: '150ms', base: '300ms', slow: '500ms' },
        easings: { linear: 'linear', easeIn: 'ease-in', easeOut: 'ease-out', easeInOut: 'ease-in-out' },
        transitions: { all: 'all 300ms ease-in-out', opacity: 'opacity 200ms ease-in-out' }
      },
      customProperties: {
        fallbackTheme: true,
        sourceTheme: 'SkinTheme',
        generatedAt: Date.now()
      }
    };
  }

  /**
   * Create default component definitions for fallback skin
   */
  private createDefaultComponents(): Record<string, ComponentSkin> {
    return {
      button: {
        name: 'Button',
        type: 'input',
        variants: {
          primary: { styles: {}, tokens: {}, modifiers: {} },
          secondary: { styles: {}, tokens: {}, modifiers: {} }
        },
        states: {
          idle: 'idle',
          loading: 'loading',
          disabled: 'disabled'
        },
        responsive: {
          breakpoints: { sm: '640px', md: '768px', lg: '1024px' },
          adaptiveStyles: {},
          fluidScaling: false
        },
        accessibility: {
          focusStyles: {},
          highContrastMode: {},
          screenReaderSupport: { ariaLabels: {}, descriptions: {} },
          keyboardNavigation: { tabOrder: 0, shortcuts: {} }
        },
        pclMapping: {
          pclComponent: 'Button',
          reuseLevel: 'high',
          adaptationRequired: false
        }
      }
    };
  }

  /**
   * Create default assets for fallback skin
   */
  private createDefaultAssets(): SkinAssets {
    return {
      icons: {},
      images: {},
      fonts: {
        primary: {
          family: 'system-ui',
          source: 'system',
          weights: [400, 500, 600],
          formats: ['woff2', 'woff']
        }
      },
      sounds: {}
    };
  }

  /**
   * Create default inheritance configuration
   */
  private createDefaultInheritance(): SkinInheritance {
    return {
      parentSkins: [],
      mixins: [],
      overrides: []
    };
  }

  /**
   * Create default rendering configuration
   */
  private createDefaultRendering(): RenderingConfiguration {
    return {
      engine: 'css',
      output: 'css',
      optimizations: {
        treeshaking: true,
        minification: true,
        caching: true,
        lazyLoading: true
      },
      targets: {
        vscode: {
          interface: 'vscode',
          renderer: 'vscode-renderer',
          adaptations: {},
          constraints: {
            colorDepth: 24,
            maxFileSize: 1024 * 1024, // 1MB
            supportedFeatures: ['treeViews', 'panels', 'statusBar']
          }
        },
        cli: {
          interface: 'cli',
          renderer: 'cli-renderer', 
          adaptations: {},
          constraints: {
            colorDepth: 8,
            maxFileSize: 256 * 1024, // 256KB
            supportedFeatures: ['menus', 'navigation', 'colors']
          }
        }
      }
    };
  }

  /**
   * Create default performance configuration
   */
  private createDefaultPerformance(): SkinPerformanceConfig {
    return {
      loadingStrategy: 'lazy',
      cachingPolicy: 'memory',
      compressionLevel: 6,
      criticalPath: ['themes', 'components'],
      metrics: {
        targetLoadTime: 100,
        maxMemoryUsage: 10,
        renderBudget: 16
      }
    };
  }

  /**
   * Utility: Lighten a color by a given factor (0-1)
   */
  private lightenColor(color: string, factor: number): string {
    // Simple hex color lightening - in production, use a proper color library
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.round(r + (255 - r) * factor));
    const newG = Math.min(255, Math.round(g + (255 - g) * factor));
    const newB = Math.min(255, Math.round(b + (255 - b) * factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Utility: Darken a color by a given factor (0-1)
   */
  private darkenColor(color: string, factor: number): string {
    // Simple hex color darkening - in production, use a proper color library
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.max(0, Math.round(r * (1 - factor)));
    const newG = Math.max(0, Math.round(g * (1 - factor)));
    const newB = Math.max(0, Math.round(b * (1 - factor)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Utility: Adjust opacity of a color
   */
  private adjustOpacity(color: string, opacity: number): string {
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color; // Return as-is if not a hex color
  }

  /**
   * Map backend ID to appropriate interface type for skin rendering
   */
  private mapBackendToInterfaceType(backendId: string): string {
    // Backend-Interface mapping logic - see TASK-NEW-059 for enhancements
    switch (backendId.toLowerCase()) {
      case 'haruspex':
        return 'vscode'; // Haruspex typically integrates with VSCode
      case 'pcl':
        return 'cli'; // PCL is command-line focused
      case 'litany':
        return 'command'; // Litany provides command interfaces
      default:
        return 'vscode'; // Default to VSCode interface
    }
  }

  async executeCommand(backendId: string, command: string, args?: unknown[]): Promise<BackendServicePayload> {
    try {
      const connection = this.connections.get(backendId);
      if (!connection || !connection.isConnected()) {
        throw createTemplumError(`Backend ${backendId} is not available`, 'BACKEND_UNAVAILABLE', 'integration');
      }

      this.log.info(`Executing command "${command}" on backend: ${backendId}`);
      
      const commandRequest = {
        command,
        args: args || [],
        backendId,
        timestamp: Date.now(),
        requestedBy: 'templum-backend-router'
      };

      const response = await this.callBackendServiceAPI(connection, 'executeCommand', commandRequest);
      
      this.log.info(`Command "${command}" executed successfully on ${backendId}`);
      return response;
    } catch (error) {
      this.log.error(`Failed to execute command "${command}" on backend ${backendId}:`, error);
      throw error;
    }
  }

  async isServiceAvailable(backendId: string): Promise<boolean> {
    const status = this.serviceHealth.get(backendId);
    return status?.connected === true && status?.health === 'healthy';
  }

  onLifecycleEvent(listener: (event: BackendConnectionLifecycleEvent) => void): () => void {
    this.on('connection:lifecycle', listener);
    return () => this.off('connection:lifecycle', listener);
  }

  /**
   * TASK-NEW-050: Connect to specific backend service
   * Public API for individual service connection management
   * Following backend-service-integration-unified pattern
   */
  async connectToService(serviceId: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const startTime = Date.now();
    
    try {
      this.log.info(`[SERVICE_CONNECTION] Attempting to connect to service: ${serviceId}`);
      
      // Check if service is already connected
      const currentStatus = this.serviceHealth.get(serviceId);
      if (currentStatus?.connected && currentStatus?.health === 'healthy') {
        return {
          success: true,
          message: `Service ${serviceId} is already connected and healthy`,
          responseTime: Date.now() - startTime
        };
      }
      
      // Get backend configuration for the service
      const backendConfig = this.backendConfigs.get(serviceId);
      if (!backendConfig) {
        return {
          success: false,
          message: `Service ${serviceId} configuration not found. Service must be registered first.`
        };
      }
      
      // Attempt connection using generic connection approach
      const connected = await this.connectToServiceGeneric(serviceId, backendConfig, { retryAttempts: 0 }, 'manual');
      
      if (connected) {
        // Detect service capabilities and update health status
        await this.detectServiceCapabilities(serviceId);
        this.updateServiceHealth(serviceId, true, 'healthy', undefined, await this.getServiceVersion(serviceId));
        
        // Load backend skin if orchestrator is available
        if (this.orchestrator) {
          try {
            const skinDefinition = await this.loadBackendSkin(serviceId);
            if (skinDefinition) {
              await this.orchestrator.loadSkin(skinDefinition);
            }
          } catch (skinError) {
            this.log.warn(`[SERVICE_CONNECTION] Skin loading failed for ${serviceId}:`, skinError);
            // Continue - connection successful even if skin loading failed
          }
        }
        
        const responseTime = Date.now() - startTime;
        this.log.info(`[SERVICE_CONNECTION] Successfully connected to ${serviceId} in ${responseTime}ms`);
        
        return {
          success: true,
          message: `Successfully connected to ${serviceId}`,
          responseTime
        };
      } else {
        this.updateServiceHealth(serviceId, false, 'unhealthy', `Connection attempt failed for ${serviceId}`);
        ErrorHandler.handle(
          new Error(`Connection attempt failed for ${serviceId}`),
          'backend-service-router.connect-service.failed',
          { serviceId, origin: 'manual' }
        );
        return {
          success: false,
          message: `Failed to establish connection to ${serviceId}`
        };
      }
      
    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'backend-service-router.connect-service.error', {
        serviceId,
        origin: 'manual',
      });
      const errorMessage = templumError.message;
      this.updateServiceHealth(serviceId, false, 'error', errorMessage);
      this.log.error(`[SERVICE_CONNECTION] Connection error for ${serviceId}:`, templumError);
      
      return {
        success: false,
        message: `Connection failed: ${errorMessage}`
      };
    }
  }

  /**
   * TASK-NEW-050: Disconnect from specific backend service
   * Public API for individual service disconnection management
   * Following backend-service-integration-unified pattern
   */
  async disconnectFromService(serviceId: string): Promise<{ success: boolean; message: string }> {
    try {
      this.log.info(`[SERVICE_DISCONNECTION] Attempting to disconnect from service: ${serviceId}`);
      
      // Check if service is connected
      const connection = this.connections.get(serviceId);
      if (!connection) {
        return {
          success: true,
          message: `Service ${serviceId} is not connected`
        };
      }
      
      // Perform disconnection
      try {
        await connection.disconnect();
        this.log.info(`[SERVICE_DISCONNECTION] Successfully disconnected from ${serviceId}`);
      } catch (disconnectionError) {
        this.log.warn(`[SERVICE_DISCONNECTION] Warning during disconnection from ${serviceId}:`, disconnectionError);
        // Continue with cleanup even if disconnect had issues
      }
      
      // Clean up connection and health status
      this.connections.delete(serviceId);
      this.updateServiceHealth(serviceId, false, 'unhealthy', `Disconnected from ${serviceId}`);
      this.recoveryAttempts.delete(serviceId);
      
      this.log.info(`[SERVICE_DISCONNECTION] Successfully disconnected and cleaned up ${serviceId}`);
      this.lifecycleChannel.emitDisconnected(serviceId, {
        origin: 'manual',
        metadata: {
          reason: 'manual-disconnect'
        }
      });
      
      return {
        success: true,
        message: `Successfully disconnected from ${serviceId}`
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown disconnection error';
      this.log.error(`[SERVICE_DISCONNECTION] Disconnection error for ${serviceId}:`, error);
      this.lifecycleChannel.emitFailed(serviceId, error, {
        origin: 'manual',
        metadata: {
          reason: 'manual-disconnect'
        }
      });
      
      return {
        success: false,
        message: `Disconnection failed: ${errorMessage}`
      };
    }
  }

  async applyManualOverride(
    serviceId: string,
    options: ManualOverrideOptions = {}
  ): Promise<ManualOverrideDescriptor> {
    if (!serviceId || !serviceId.trim()) {
      throw createTemplumError(
        'Manual override requires a service identifier',
        'MANUAL_OVERRIDE_INVALID',
        'validation'
      );
    }

    const normalizedId = serviceId.trim();
    this.manualOverrideManager.pruneExpired();

    let backendConfig = this.backendConfigs.get(normalizedId);
    let discoveredService = this.discoveredServiceCache.get(normalizedId);

    if (!backendConfig) {
      const serviceFromDiscovery = this.serviceDiscovery.getServiceById(normalizedId);
      if (serviceFromDiscovery) {
        backendConfig = serviceFromDiscovery.config;
        discoveredService = serviceFromDiscovery;
        this.backendConfigs.set(normalizedId, backendConfig);
      }
    }

    if (!backendConfig) {
      throw createTemplumError(
        `Cannot apply manual override for unknown service '${normalizedId}'`,
        'MANUAL_OVERRIDE_UNKNOWN_SERVICE',
        'validation',
        { serviceId: normalizedId }
      );
    }

    const metadata: ManualOverrideMetadata | undefined = discoveredService
      ? {
          discoveryMethod: discoveredService.discoveryMethod,
          confidence: discoveredService.confidence
        }
      : undefined;

    const descriptor = this.manualOverrideManager.applyOverride(normalizedId, metadata, options);

    const existingConnection = this.connections.get(normalizedId);
    if (!existingConnection || !existingConnection.isConnected()) {
      const connectionResult = await this.connectToService(normalizedId);
      if (!connectionResult.success) {
        throw createTemplumError(
          connectionResult.message || `Manual override connection failed for '${normalizedId}'`,
          'MANUAL_OVERRIDE_CONNECTION_FAILED',
          'runtime',
          { serviceId: normalizedId }
        );
      }
    }

    return descriptor;
  }

  async clearManualOverride(serviceId?: string): Promise<ManualOverrideClearResult> {
    this.manualOverrideManager.pruneExpired();

    if (serviceId && !serviceId.trim()) {
      throw createTemplumError(
        'Manual override clearance requires a service identifier when provided',
        'MANUAL_OVERRIDE_INVALID',
        'validation'
      );
    }

    const normalizedId = serviceId?.trim();
    const result = this.manualOverrideManager.clearOverride(normalizedId);

    if (normalizedId && !this.manualOverrideManager.hasOverride(normalizedId)) {
      this.log.info(`[MANUAL_OVERRIDE] Cleared manual override for ${normalizedId}`);
    }

    if (!normalizedId) {
      this.log.info('[MANUAL_OVERRIDE] Cleared all manual overrides');
    }

    return result;
  }

  getManualOverrideSnapshot(): ManualOverrideSnapshot {
    return this.manualOverrideSnapshot;
  }

  /**
   * ENHANCED: Cleanup and dispose of the backend service router
   * Call this when the router is no longer needed to properly cleanup resources
   */
  async dispose(): Promise<void> {
    this.log.info('[BACKEND_SERVICE_ROUTER] Disposing backend service router');
    
    // Stop background health monitoring
    this.stopHealthMonitoring();
    
    // Disconnect all backend connections
    const disconnectionPromises: Promise<void>[] = [];
    for (const [backendId, connection] of Array.from(this.connections.entries())) {
      try {
        this.log.info(`[CLEANUP] Disconnecting from backend: ${backendId}`);
        disconnectionPromises.push(connection.disconnect());
      } catch (error) {
        this.log.warn(`[CLEANUP] Error disconnecting from ${backendId}:`, error);
      }
    }
    
    await Promise.allSettled(disconnectionPromises);
    
    // Clear all state
    this.connections.clear();
    this.serviceHealth.clear();
    this.recoveryAttempts.clear();
    
    try {
      await this.serviceDiscovery.close();
    } catch (error) {
      this.log.warn('[BACKEND_SERVICE_ROUTER] Error closing service discovery during dispose:', error);
    }

    // Remove all event listeners
    this.cleanupEvents();
    
    this.log.info('[BACKEND_SERVICE_ROUTER] Cleanup completed');
  }

  /**
   * GENERIC: Get backend configurations (replaces hardcoded endpoints)
   */
  getBackendConfigs(): Record<string, BackendConfig> {
    const configs: Record<string, BackendConfig> = {};
    for (const [serviceId, config] of Array.from(this.backendConfigs.entries())) {
      configs[serviceId] = config;
    }
    return configs;
  }


}

/**
 * Haruspex IPC Client for real service communication
 * Based on Haruspex IPC Protocol implementation
 */

class HaruspexIPCClient {
    private readonly log: ScopedLogEmitter;
    private socket: net.Socket | undefined;
    private isConnected = false;
    private pendingRequests = new Map<string, {
      resolve: (value: unknown) => void;
      reject: (reason: Error) => void;
      timeout: ManagedTimeout;
    }>();
    private messageBuffer = '';
    private connectionInfo: HaruspexConnectionInfo | null = null;
    private workspacePath: string;
    private connectionInfoPath: string;
    private readonly serializationRecorder?: RouterSerializationRecorder;
    private readonly serviceId: string;

    constructor(
      logger: ScopedLogEmitter,
      workspacePath?: string,
      _config?: unknown,
      serializationRecorder?: RouterSerializationRecorder
    ) {
      this.log = logger;
      this.workspacePath = workspacePath || this.findWorkspaceRoot(process.cwd()) || process.cwd();
      this.connectionInfoPath = path.join(this.workspacePath, '.haruspex', 'haruspex-debug-connection.json');
      this.serializationRecorder = serializationRecorder;
      this.serviceId = 'haruspex';
    }

    private scheduleTimeout(callback: () => void | Promise<void>, ms: number): ManagedTimeout {
      return createTimeout(callback, ms, { unref: true });
    }

    private parseIpcMessage<T>(raw: string, context: string): SerializationOutcome<T> {
      return runRouterParse<T>(raw, context, 'inbound', undefined, this.serializationRecorder);
    }

    private stringifyIpcMessage<T>(value: T, context: string): SerializationOutcome<string> {
      return runRouterStringify<T>(value, context, 'outbound', undefined, this.serializationRecorder);
    }

    private findWorkspaceRoot(startPath: string): string | undefined {
      let currentPath = startPath;

      while (currentPath !== path.dirname(currentPath)) {
        const haruspexPath = path.join(currentPath, '.haruspex');
        if (fs.existsSync(haruspexPath)) {
          return currentPath;
        }
        currentPath = path.dirname(currentPath);
      }

      return undefined;
    }

    async connect(): Promise<void> {
      if (this.isConnected) {
        return;
      }

      if (!fs.existsSync(this.connectionInfoPath)) {
        throw new Error(
          `Haruspex connection info not found at ${this.connectionInfoPath}. Ensure Haruspex extension is running.`
        );
      }

      const connectionData = fs.readFileSync(this.connectionInfoPath, 'utf-8');
      const infoOutcome = this.parseIpcMessage<HaruspexConnectionInfo>(
        connectionData,
        'backend:router:ipc:connection-info'
      );

      if (infoOutcome.ok && infoOutcome.value) {
        this.connectionInfo = infoOutcome.value;
      } else {
        const reason = infoOutcome.error instanceof Error
          ? infoOutcome.error.message
          : `status=${infoOutcome.status}`;
        throw new Error(`Failed to parse Haruspex connection info: ${reason}`);
      }

      return new Promise((resolve, reject) => {
        this.socket = new net.Socket();

        let settled = false;
        let timeout: ManagedTimeout;

        const finish = (action: () => void) => {
          if (settled) {
            return;
          }
          settled = true;
          timeout.cancel();
          action();
        };

        timeout = this.scheduleTimeout(() => {
          this.socket?.destroy();
          finish(() => reject(new Error('Connection timeout')));
        }, 10000);

        this.socket.connect(this.connectionInfo!.port, this.connectionInfo!.host, () => {
          this.isConnected = true;
          this.log.info(
            `[IPC] Connected to Haruspex service at ${this.connectionInfo!.host}:${this.connectionInfo!.port}`
          );
          finish(() => resolve());
        });

        this.socket.on('data', (data) => {
          this.handleIncomingData(data);
        });

        this.socket.on('error', (error) => {
          this.isConnected = false;
          finish(() => reject(error instanceof Error ? error : new Error(String(error))));
        });

        this.socket.on('close', () => {
          this.isConnected = false;
          this.log.info('[IPC] Connection to Haruspex service closed');
        });
      });
    }

    async disconnect(): Promise<void> {
      if (this.socket && !this.socket.destroyed) {
        this.socket.destroy();
      }
      this.isConnected = false;

      for (const [_requestId, request] of Array.from(this.pendingRequests.entries())) {
        request.timeout.cancel();
        request.reject(new Error('Connection closed'));
      }
      this.pendingRequests.clear();
    }

    async sendRequest<T extends BackendServicePayload = BackendServicePayload>(
      type: IPCMessageType,
      payload?: BackendServicePayload,
      method?: string
    ): Promise<T> {
      if (!this.isConnected || !this.socket) {
        throw new Error('Not connected to Haruspex service');
      }

      const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const message: IPCMessage = {
        id: requestId,
        type,
        method: method || type,
        timestamp: Date.now(),
        payload,
        requestId
      };

      return new Promise((resolve, reject) => {
        const timeout = this.scheduleTimeout(() => {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Request timeout for ${type}`));
        }, 30000);

        this.pendingRequests.set(requestId, {
          resolve: resolve as (value: unknown) => void,
          reject,
          timeout
        });

        const outbound = this.stringifyIpcMessage(message, 'backend:router:ipc:request');
        if (outbound.ok && outbound.value) {
          this.socket!.write(`${outbound.value}\n`);
        } else {
          timeout.cancel();
          this.pendingRequests.delete(requestId);
          reject(new Error(`IPC serialization failed (${outbound.status})`));
        }
      });
    }

    private handleIncomingData(data: Buffer): void {
      this.messageBuffer += data.toString();
      const messages = this.messageBuffer.split('\n');

      this.messageBuffer = messages.pop() || '';

      for (const messageStr of messages) {
        if (!messageStr.trim()) {
          continue;
        }

        const outcome = this.parseIpcMessage<IPCResponse>(
          messageStr,
          'backend:router:ipc:response'
        );

        if (outcome.value) {
          this.handleMessage(outcome.value);
        } else {
          this.log.error('[IPC] Failed to parse message', {
            context: outcome.meta.context,
            status: outcome.status,
            error: outcome.error instanceof Error ? outcome.error.message : outcome.error
          });
        }
      }
    }

    private handleMessage(message: IPCResponse): void {
      if (message.requestId && this.pendingRequests.has(message.requestId)) {
        const request = this.pendingRequests.get(message.requestId)!;
        request.timeout.cancel();
        this.pendingRequests.delete(message.requestId);

        if (message.success) {
          request.resolve(message.data || message.payload);
        } else {
          request.reject(new Error(message.error || 'Unknown error'));
        }
      }
    }

    getConnectionStatus(): { connected: boolean; info: HaruspexConnectionInfo | null } {
      return {
        connected: this.isConnected,
        info: this.connectionInfo
      };
    }
  }
// BackendConnection interface now imported from connection-factory.ts
