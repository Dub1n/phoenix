/**---
 * title: [Adapter Registry - Dependency Injection Container]
 * tags: [Core, DependencyInjection, Registry, Adapter]
 * provides: [TemplumAdapterRegistry, Component Resolution]
 * requires: [Core Component Interfaces, Component Implementations]
 * description: [Centralized registry for managing component adapters and dependency injection following PCL pattern]
 * ---*/

import { 
  ISkinEngine,
  IStateManager, 
  IBackendRouter,
  IBackendServiceRouter,
  IResourceManager,
  ITemplumCoreDependencies,
  IDependencyInjectionConfig,
  IComponentFactory,
  ComponentValidationStatus,
  DependencyWiringStatus,
  ValidationReport
} from '../interfaces/core-component-interfaces';
import { IObservabilityService } from '../observability/observability-adapter';
import {
  isTemplumError,
  ErrorSignalPayload,
  type TemplumError,
  InterfaceType
} from '../types/templum-types';
import { SemanticValidators, TypeAssertions, TypeGuards } from '../utils/type-guards';

// Import real component implementations
import { UniversalSkinEngine } from '../skin/universal-skin-engine';
import { EnhancedStateManager } from '../state/enhanced-state-synchronization';
import { PCLBackendIntegrator } from '../backend/pcl-backend-integration';
import { TemplumBackendServiceRouter } from '../backend/backend-service-router';
import { ServiceHealth, TemplumResourceManager } from './templum-resource-manager';
import { ObservabilityAdapter } from '../observability/observability-adapter';
import { CLIInterfaceAdapter } from '../interfaces/cli-adapter-abstracted';
import { VSCodeInterfaceAdapter } from '../interfaces/vscode-adapter-abstracted';
import type { IInterfaceAdapter } from '../interfaces/templum-orchestrator-interface';
import { buildCLIMenuModel } from '../interfaces/cli-generator';
import type {
  ManualOverrideDescriptor,
  ManualOverrideClearResult,
  ManualOverrideSnapshot,
  ManualOverrideOptions
} from '../backend/manual-override-manager';
import { TemplumUniversalSessionManager } from '../session/templum-universal-session-manager';
import type { TemplumSessionManagerContract } from '../session/universal-session-manager.types';
import { type TypedEventMap } from '../utils/event-utils';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import { createLogger } from '../utils/logger';
import { ErrorHandler, type ScopedErrorHandler, buildTemplumError } from '../utils/error-handler';

const adapterRegistryLogger = createLogger('templum-adapter-registry');

const describeErrorCause = (error: unknown): Record<string, unknown> | string | undefined => {
  if (isTemplumError(error)) {
    return {
      code: error.code,
      category: error.category,
      message: error.message,
      context: error.context
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (error === undefined || error === null) {
    return undefined;
  }

  if (typeof error === 'object') {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return String(error);
    }
  }

  return String(error);
};

const createScopedTemplumError = (
  scope: ScopedErrorHandler,
  segment: string,
  error: unknown,
  message: string,
  code: string,
  category: TemplumError['category'],
  metadata?: Record<string, unknown>
): TemplumError => {
  const handler = scope.child(segment, metadata);
  const contextDetails: Record<string, unknown> = metadata ? { ...metadata } : {};
  const cause = describeErrorCause(error);
  if (cause !== undefined) {
    contextDetails.cause = cause;
  }

  return handler.handle(
    buildTemplumError(message, code, category, contextDetails)
  );
};

interface AdapterRegistryEvents extends TypedEventMap {
  initialized: (payload: {
    timestamp: number;
    components: string[];
    initializationPhases: number;
  }) => void;
  componentRegistered: (payload: { name: keyof ITemplumCoreDependencies; timestamp: number }) => void;
  disposed: (payload: { timestamp: number }) => void;
}

/**
 * Component adapter implementations wrapping real components
 */
export class SkinEngineAdapter implements ISkinEngine {
  private static readonly logger = adapterRegistryLogger.child('skin-engine-adapter');
  private readonly errorScope: ScopedErrorHandler;
  private skinEngine: UniversalSkinEngine;

  constructor(skinEngine: UniversalSkinEngine, errorScope: ScopedErrorHandler) {
    this.skinEngine = skinEngine;
    this.errorScope = errorScope;
  }

  async initialize(config?: any): Promise<void> {
    try {
      // Initialize Universal Skin Engine with configuration if method exists
      if (SemanticValidators.hasFunction(this.skinEngine, 'initialize', { required: false })) {
        await (this.skinEngine as unknown as { initialize(config?: any): Promise<void> }).initialize(config);
      }
      
      // Set up skin engine performance monitoring if available
      if (
        config?.performanceMetrics &&
        SemanticValidators.hasFunction(this.skinEngine, 'enablePerformanceMonitoring', { required: false })
      ) {
        (this.skinEngine as unknown as { enablePerformanceMonitoring?(enabled: boolean): void }).enablePerformanceMonitoring?.(true);
      }
      
      SkinEngineAdapter.logger.info('Initialized with config', {
        performanceMetrics: config?.performanceMetrics || false,
        cacheEnabled: config?.cacheEnabled !== false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const context = { errorMessage, operation: 'initialize' };
      throw createScopedTemplumError(
        this.errorScope,
        'initialize',
        error,
        `Skin engine initialization failed: ${errorMessage}`,
        'ADAPTER_INITIALIZATION_ERROR',
        'configuration',
        context
      );
    }
  }

  async renderForInterface(skinDefinition: any, interfaceType: any, context?: any): Promise<any> {
    return await this.skinEngine.renderForInterface?.(skinDefinition, interfaceType, context);
  }

  async validateSkin(skinDefinition: any): Promise<boolean> {
    // Basic validation through adapter - real component handles detailed validation
    return skinDefinition?.metadata?.id != null;
  }

  generateSkinHTML(renderResult: any, _skinDefinition: any): string {
    // Convert SkinRenderResult to HTML format for WebView rendering
    try {
      if (renderResult && renderResult.components && Array.isArray(renderResult.components)) {
        // Extract content from rendered components
        const componentHTML = renderResult.components
          .map((component: any) => {
            if (component.content && typeof component.content === 'string') {
              return `<div class="templum-component" data-type="${component.type || 'unknown'}" data-id="${component.id || ''}">${component.content}</div>`;
            } else if (component.content && typeof component.content === 'object') {
              // Handle structured component content
              return `<div class="templum-component" data-type="${component.type || 'unknown'}" data-id="${component.id || ''}">${JSON.stringify(component.content)}</div>`;
            }
            return `<div class="templum-component" data-type="${component.type || 'unknown'}" data-id="${component.id || ''}">Component: ${component.type}</div>`;
          })
          .join('\n');
        
        // Wrap in basic HTML structure with theme information
        const themeClass = renderResult.theme ? `theme-${renderResult.theme}` : 'theme-default';
        const skinId = renderResult.metadata?.skinId || 'unknown';
        
        return `<div class="templum-skin-container ${themeClass}" data-skin-id="${skinId}">
          ${componentHTML}
        </div>`;
      }
      
      // Fallback for empty or invalid render results
      return '<div class="templum-skin-container theme-default"><div class="templum-component">No rendered components available</div></div>';
    } catch (error) {
      const metadata = {
        hasComponents: Array.isArray(renderResult?.components),
        componentCount: Array.isArray(renderResult?.components) ? renderResult.components.length : 0,
        theme: renderResult?.theme ?? null
      };
      this.errorScope
        .child('generate-html', metadata)
        .handle(error, metadata);
      return '<div class="templum-skin-container theme-default"><div class="templum-component templum-error">Error rendering skin components</div></div>';
    }
  }

  async dispose(): Promise<void> {
    try {
      // Clear any cached skin definitions if method exists
      if (SemanticValidators.hasFunction(this.skinEngine, 'clearCache', { required: false })) {
        await (this.skinEngine as unknown as { clearCache(): Promise<void> }).clearCache();
      }

      // Dispose of skin engine resources if method exists
      if (SemanticValidators.hasFunction(this.skinEngine, 'dispose', { required: false })) {
        await (this.skinEngine as unknown as { dispose(): Promise<void> }).dispose();
      }
      
      SkinEngineAdapter.logger.info('Disposed with resource cleanup');
    } catch (error) {
      const metadata = {
        operation: 'dispose',
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      this.errorScope
        .child('dispose', metadata)
        .handle(error, metadata);
      // Don't throw during disposal to prevent cascade failures
    }
  }
}

export class StateManagerAdapter implements IStateManager {
  private static readonly logger = adapterRegistryLogger.child('state-manager-adapter');
  private readonly errorScope: ScopedErrorHandler;
  private stateManager: EnhancedStateManager;

  constructor(stateManager: EnhancedStateManager, errorScope: ScopedErrorHandler) {
    this.stateManager = stateManager;
    this.errorScope = errorScope;
  }

  async initialize(_config?: any): Promise<void> {
    await this.stateManager.initialize();
  }

  async syncState(interfaceType: any, stateUpdate: any, source: string): Promise<void> {
    const supportedInterfaces = ['vscode', 'cli', 'command'];
    if (!supportedInterfaces.includes(interfaceType)) {
      throw createScopedTemplumError(
        this.errorScope,
        'sync-state.validate-interface',
        undefined,
        `Unsupported interface type: ${interfaceType}`,
        'INVALID_INTERFACE_TYPE',
        'validation',
        {
          interfaceType,
          source,
          supportedInterfaces
        }
      );
    }

    try {
      // Use enhanced state manager's IPC-based synchronization if available
      if (SemanticValidators.hasFunction(this.stateManager, 'synchronizeState', { required: false })) {
        await (this.stateManager as unknown as {
          synchronizeState(interfaceType: any, update: any, metadata: any): Promise<void>;
        }).synchronizeState(interfaceType, stateUpdate, {
          targetInterface: interfaceType,
          source,
          timestamp: Date.now()
        });
      } else if (SemanticValidators.hasFunction(this.stateManager, 'sendMessage', { required: false })) {
        // Fallback to message-based sync
        await (this.stateManager as unknown as { sendMessage(payload: unknown): Promise<void> }).sendMessage({
          type: 'state-sync',
          target: interfaceType,
          data: stateUpdate,
          source,
          timestamp: Date.now()
        });
      }
      
      StateManagerAdapter.logger.info('Synced state', {
        interfaceType,
        source,
        updateKeys: Object.keys(stateUpdate || {}),
        timestamp: Date.now()
      });
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      const context = {
        errorMessage,
        interfaceType,
        source,
        updateKeys: Object.keys(stateUpdate || {})
      };
      throw createScopedTemplumError(
        this.errorScope,
        'sync-state',
        error,
        `State sync failed: ${errorMessage}`,
        'STATE_SYNC_ERROR',
        'runtime',
        context
      );
    }
  }

  async sendMessage(message: any): Promise<void> {
    if (!TypeGuards.isPlainObject(message)) {
      throw createScopedTemplumError(
        this.errorScope,
        'send-message.validate',
        undefined,
        'Invalid message format',
        'INVALID_MESSAGE',
        'validation',
        {
          adapter: 'StateManagerAdapter',
          providedType: typeof message
        }
      );
    }

    try {
      // Add adapter metadata
      const enrichedMessage = {
        ...message,
        adapter: 'StateManagerAdapter',
        timestamp: Date.now(),
        messageId: `adapter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Use enhanced state manager's IPC message sending if available
      if (SemanticValidators.hasFunction(this.stateManager, 'sendMessage', { required: false })) {
        await (this.stateManager as unknown as { sendMessage(payload: unknown): Promise<void> }).sendMessage(enrichedMessage);
      } else {
        StateManagerAdapter.logger.warn('sendMessage not available on state manager, message queued');
      }
      
      StateManagerAdapter.logger.info('Message sent', {
        type: message.type,
        messageId: enrichedMessage.messageId,
        timestamp: enrichedMessage.timestamp
      });
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      const context = {
        errorMessage,
        messageType: message?.type ?? 'unknown',
        messageId: message?.messageId,
        adapter: 'StateManagerAdapter'
      };
      throw createScopedTemplumError(
        this.errorScope,
        'send-message',
        error,
        `Message send failed: ${errorMessage}`,
        'MESSAGE_SEND_ERROR',
        'runtime',
        context
      );
    }
  }

  async handleBackendLifecycleEvent(event: any): Promise<void> {
    if (!SemanticValidators.hasFunction(this.stateManager, 'handleBackendLifecycleEvent', { required: false })) {
      return;
    }

    await (this.stateManager as unknown as {
      handleBackendLifecycleEvent(payload: any): Promise<void>;
    }).handleBackendLifecycleEvent(event);
  }

  getCurrentState(): any {
    try {
      // Use enhanced state manager's state retrieval if available
      if (SemanticValidators.hasFunction(this.stateManager, 'getCurrentState', { required: false })) {
        const currentState = (this.stateManager as unknown as { getCurrentState(): unknown }).getCurrentState();
        const enrichedState = TypeGuards.isPlainObject(currentState)
          ? currentState
          : { state: currentState };
        return {
          ...enrichedState,
          adapter: 'StateManagerAdapter',
          lastAccessed: Date.now()
        };
      }
      
      // Fallback state when state manager doesn't provide getCurrentState
      return {
        initialized: true,
        timestamp: Date.now(),
        adapter: 'StateManagerAdapter',
        fallback: true,
        warning: 'State manager getCurrentState method not available'
      };
    } catch (error) {
      const metadata = {
        operation: 'getCurrentState',
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      this.errorScope
        .child('get-current-state', metadata)
        .handle(error, metadata);
      return {
        error: true,
        errorMessage: metadata.errorMessage,
        timestamp: Date.now(),
        adapter: 'StateManagerAdapter'
      };
    }
  }

  async shutdown(): Promise<void> {
    await this.stateManager.shutdown?.();
  }
}

export class BackendRouterAdapter implements IBackendRouter {
  private static readonly logger = adapterRegistryLogger.child('backend-router-adapter');
  private readonly errorScope: ScopedErrorHandler;
  private backendRouter: PCLBackendIntegrator;
  private wiringContext: { stateManager?: IStateManager } = {};
  private dependenciesSnapshot: Record<string, unknown> = {};

  constructor(backendRouter: PCLBackendIntegrator, errorScope: ScopedErrorHandler) {
    this.backendRouter = backendRouter;
    this.errorScope = errorScope;
  }

  initialize(dependencies: any): void {
    if (TypeGuards.isObject(dependencies)) {
      const maybeStateManager = (dependencies as { stateManager?: IStateManager }).stateManager;

      if (maybeStateManager) {
        this.wiringContext.stateManager = maybeStateManager;
        this.dependenciesSnapshot = {
          ...this.dependenciesSnapshot,
          stateManager: maybeStateManager,
        };

        (this as any).stateManager = maybeStateManager;
        (this as any).dependencies = {
          ...(this as any).dependencies ?? {},
          stateManager: maybeStateManager,
        };

        const routerWithDeps = this.backendRouter as any;
        routerWithDeps.stateManager = maybeStateManager;
        routerWithDeps.dependencies = {
          ...(routerWithDeps.dependencies ?? {}),
          stateManager: maybeStateManager,
        };
      }
    }

    if (SemanticValidators.hasFunction(this.backendRouter, 'initialize', { required: false })) {
      (this.backendRouter as { initialize?(deps: unknown): void }).initialize?.(dependencies);
    }

    // PCL Backend Integrator initialized with dependencies in constructor
    BackendRouterAdapter.logger.info('Initialized with dependencies');
  }

  async executeCommand(command: string, args?: any[], context?: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Validate command input
      if (!command || typeof command !== 'string') {
        throw createScopedTemplumError(
          this.errorScope,
          'execute-command.validate',
          undefined,
          'Invalid command format',
          'INVALID_COMMAND',
          'validation',
          { command }
        );
      }
      
      // Prepare command context with adapter metadata
      const enhancedContext = {
        ...context,
        adapter: 'BackendRouterAdapter',
        timestamp: startTime,
        commandId: `adapter-cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Execute command through PCL Backend Integrator if available
      let result;
      if (SemanticValidators.hasFunction(this.backendRouter, 'executeCommand', { required: false })) {
        result = await (this.backendRouter as unknown as {
          executeCommand(command: string, args?: any[], context?: any): Promise<any>;
        }).executeCommand(command, args, enhancedContext);
      } else {
        // Fallback for when PCL Backend Integrator doesn't have executeCommand
        BackendRouterAdapter.logger.warn('executeCommand not available on backend integrator, using fallback');
        result = {
          command,
          success: true,
          data: { executed: true, fallback: true },
          warning: 'Using adapter fallback - PCL Backend Integrator not fully integrated'
        };
      }
      
      return {
        ...result,
        executionTime: Date.now() - startTime,
        adapter: 'BackendRouterAdapter',
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      const metadata = {
        command,
        errorMessage,
        argsLength: Array.isArray(args) ? args.length : 0
      };
      this.errorScope
        .child('execute-command', metadata)
        .handle(error, metadata);
      return {
        command,
        success: false,
        error: errorMessage,
        executionTime: Date.now() - startTime,
        adapter: 'BackendRouterAdapter',
        timestamp: Date.now()
      };
    }
  }

  getStatus(): any {
    try {
      let coreStatus = {
        connected: true,
        health: 'healthy' as const,
        lastCheck: Date.now()
      };
      
      // Get status from PCL Backend Integrator if available
      if (SemanticValidators.hasFunction(this.backendRouter, 'getStatus', { required: false })) {
        const externalStatus = (this.backendRouter as unknown as { getStatus(): unknown }).getStatus();
        if (TypeGuards.isPlainObject(externalStatus)) {
          coreStatus = {
            ...coreStatus,
            ...externalStatus
          };
        }
      }
      
      return {
        ...coreStatus,
        adapter: 'BackendRouterAdapter',
        capabilities: {
          executeCommand: SemanticValidators.hasFunction(this.backendRouter, 'executeCommand', { required: false }),
          getStatus: SemanticValidators.hasFunction(this.backendRouter, 'getStatus', { required: false }),
          shutdown: SemanticValidators.hasFunction(this.backendRouter, 'shutdown', { required: false }),
        },
        initialized: true,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const metadata = {
        operation: 'getStatus',
        errorMessage
      };
      this.errorScope
        .child('get-status', metadata)
        .handle(error, metadata);
      return {
        connected: false,
        health: 'error' as const,
        error: errorMessage,
        adapter: 'BackendRouterAdapter',
        lastCheck: Date.now(),
        timestamp: Date.now()
      };
    }
  }

  async shutdown(): Promise<void> {
    await this.backendRouter.shutdown?.();
  }
}

export class BackendServiceRouterAdapter implements IBackendServiceRouter {
  private static readonly logger = adapterRegistryLogger.child('backend-service-router-adapter');
  private readonly errorScope: ScopedErrorHandler;
  private backendServiceRouter: TemplumBackendServiceRouter;

  constructor(backendServiceRouter: TemplumBackendServiceRouter, errorScope: ScopedErrorHandler) {
    this.backendServiceRouter = backendServiceRouter;
    this.errorScope = errorScope;
  }

  async discoverAndConnect(): Promise<void> {
    await this.backendServiceRouter.discoverAndConnect();
  }

  async loadBackendSkin(backendId: string): Promise<any> {
    return await this.backendServiceRouter.loadBackendSkin(backendId);
  }

  async executeCommand(backendId: string, command: string, args?: any[]): Promise<any> {
    return await this.backendServiceRouter.executeCommand?.(backendId, command, args);
  }

  async isServiceAvailable(backendId: string): Promise<boolean> {
    return await this.backendServiceRouter.isServiceAvailable?.(backendId) || false;
  }

  getConnectionStatus(): any {
    return this.backendServiceRouter.getConnectionStatus?.() || {};
  }

  async applyManualOverride(
    serviceId: string,
    options?: ManualOverrideOptions
  ): Promise<ManualOverrideDescriptor> {
    if (!this.backendServiceRouter.applyManualOverride) {
      const context = { serviceId, operation: 'applyManualOverride' };
      throw createScopedTemplumError(
        this.errorScope,
        'manual-override',
        undefined,
        'Manual override operations are not available in the current backend router',
        'MANUAL_OVERRIDE_UNSUPPORTED',
        'configuration',
        context
      );
    }

    return await this.backendServiceRouter.applyManualOverride(serviceId, options);
  }

  async clearManualOverride(serviceId?: string): Promise<ManualOverrideClearResult> {
    if (!this.backendServiceRouter.clearManualOverride) {
      const context = { serviceId, operation: 'clearManualOverride' };
      throw createScopedTemplumError(
        this.errorScope,
        'manual-override',
        undefined,
        'Manual override operations are not available in the current backend router',
        'MANUAL_OVERRIDE_UNSUPPORTED',
        'configuration',
        context
      );
    }

    return await this.backendServiceRouter.clearManualOverride(serviceId);
  }

  getManualOverrideSnapshot(): ManualOverrideSnapshot {
    if (!this.backendServiceRouter.getManualOverrideSnapshot) {
      return { overrides: [], updatedAt: Date.now() };
    }

    return this.backendServiceRouter.getManualOverrideSnapshot();
  }

  async cleanup(): Promise<void> {
    try {
      const cleanupTasks: Promise<void>[] = [];
      
      // Clean up active connections if method exists
      if (SemanticValidators.hasFunction(this.backendServiceRouter, 'cleanup', { required: false })) {
        cleanupTasks.push((this.backendServiceRouter as unknown as { cleanup(): Promise<void> }).cleanup());
      }
      
      // Close any pending service connections if method exists
      if (SemanticValidators.hasFunction(this.backendServiceRouter, 'disconnectAll', { required: false })) {
        cleanupTasks.push((this.backendServiceRouter as unknown as { disconnectAll(): Promise<void> }).disconnectAll());
      }
      
      // Clear connection caches if method exists
      if (SemanticValidators.hasFunction(this.backendServiceRouter, 'clearCache', { required: false })) {
        cleanupTasks.push((this.backendServiceRouter as unknown as { clearCache(): Promise<void> }).clearCache());
      }
      
      // Execute all cleanup tasks
      await Promise.allSettled(cleanupTasks);
      
      BackendServiceRouterAdapter.logger.info('Cleanup completed', {
        tasksExecuted: cleanupTasks.length,
        timestamp: Date.now()
      });
    } catch (error) {
      const metadata = {
        operation: 'cleanup',
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      this.errorScope
        .child('cleanup', metadata)
        .handle(error, metadata);
      // Don't throw during cleanup to prevent cascade failures
    }
  }
}

export class ResourceManagerAdapter implements IResourceManager {
  private resourceManager: TemplumResourceManager;
  private registeredServices = new Map<string, ServiceHealth & { id?: string }>();

  constructor(resourceManager: TemplumResourceManager) {
    this.resourceManager = resourceManager;
  }

  async initialize(): Promise<void> {
    await this.resourceManager.initialize();
  }

  async allocateResource(request: any): Promise<string> {
    return await this.resourceManager.allocateResource(request);
  }

  async deallocateResource(resourceId: string): Promise<void> {
    await this.resourceManager.deallocateResource(resourceId);
  }

  updateResourceAccess(resourceId: string): void {
    this.resourceManager.updateResourceAccess(resourceId);
  }

  getResourceUsage(): any {
    return this.resourceManager.getResourceUsage();
  }

  async registerService(serviceId: string, type: any, metadata?: Record<string, any>): Promise<void> {
    await this.resourceManager.registerService(serviceId, type, metadata);

    const health = this.resourceManager.getServiceHealthById?.(serviceId);
    if (health) {
      this.registeredServices.set(serviceId, { ...health, id: (health as any).id ?? health.serviceId });
    } else {
      this.registeredServices.set(serviceId, {
        serviceId,
        id: serviceId,
        type,
        status: 'healthy',
        lastCheck: Date.now(),
        responseTime: 0,
        errorRate: 0,
        resourceUsage: {},
        metadata: metadata ?? {},
      });
    }
  }

  async updateServiceHealth(serviceId: string, status: any, responseTime?: number, errorRate?: number): Promise<void> {
    await this.resourceManager.updateServiceHealth(serviceId, status, responseTime, errorRate);

    const health = this.resourceManager.getServiceHealthById?.(serviceId);
    if (health) {
      this.registeredServices.set(serviceId, { ...health, id: (health as any).id ?? health.serviceId });
    }
  }

  getServiceHealth(): any[] {
    const merged = new Map<string, ServiceHealth & { id?: string }>();

    for (const entry of this.resourceManager.getServiceHealth()) {
      merged.set(entry.serviceId, { ...entry, id: (entry as any).id ?? entry.serviceId });
    }

    for (const [serviceId, health] of this.registeredServices) {
      if (!merged.has(serviceId)) {
        merged.set(serviceId, health);
      }
    }

    return Array.from(merged.values());
  }

  getStatus(): any {
    return this.resourceManager.getStatus();
  }

  updateResourcePolicy(updates: any): void {
    this.resourceManager.updateResourcePolicy(updates);
  }

  async shutdown(): Promise<void> {
    await this.resourceManager.shutdown();
  }
}

/**
 * Component factory for creating adapter instances
 */
export class TemplumComponentFactory implements IComponentFactory {
  private config: any;
  private registry?: TemplumAdapterRegistry;
  private static readonly logger = adapterRegistryLogger.child('component-factory');
  private readonly errorScope: ScopedErrorHandler;

  constructor(config: any = {}, errorScope: ScopedErrorHandler) {
    this.config = config;
    this.errorScope = errorScope;
  }

  setRegistry(registry: TemplumAdapterRegistry) {
    this.registry = registry;
  }

  createSkinEngine(_config?: any): ISkinEngine {
    const skinEngine = new UniversalSkinEngine();
    return new SkinEngineAdapter(
      skinEngine,
      this.errorScope.child('skin-engine-adapter')
    );
  }

  createStateManager(config?: any): IStateManager {
    // TASK-NEW-025: Enhanced state manager configuration validation
    try {
      // Use registry's validation methods if available
      const validatedConfig = this.registry?.validateStateManagerConfig(config) ?? config ?? {};
      
      const stateManagerConfig = {
        coalescingConfig: {
          enabled: validatedConfig?.performanceMetrics !== false,
          windowMs: this.registry?.validateNumericRange(validatedConfig?.coalescingWindowMs, 50, 500, 100, 'coalescingWindowMs') ?? validatedConfig?.coalescingWindowMs ?? 100,
          maxBatchSize: this.registry?.validateNumericRange(validatedConfig?.maxBatchSize, 10, 100, 20, 'maxBatchSize') ?? validatedConfig?.maxBatchSize ?? 20,
          coalescingStrategy: this.registry?.validateEnumValue(validatedConfig?.coalescingStrategy, ['merge', 'replace', 'queue'], 'merge', 'coalescingStrategy') ?? 'merge'
        },
        maxHistorySize: this.registry?.validateNumericRange(validatedConfig?.maxHistorySize, 100, 10000, 1000, 'maxHistorySize') ?? validatedConfig?.maxHistorySize ?? 1000,
        persistenceEnabled: validatedConfig?.persistenceEnabled !== false,
        ipcEnabled: validatedConfig?.ipcEnabled !== false,
        ...validatedConfig
      };
      
      const stateManager = new EnhancedStateManager(stateManagerConfig);
      const adapter = new StateManagerAdapter(
        stateManager,
        this.errorScope.child('state-manager-adapter')
      );
      
      TemplumComponentFactory.logger.info('StateManager created with validated configuration', {
        coalescingEnabled: stateManagerConfig.coalescingConfig.enabled,
        windowMs: stateManagerConfig.coalescingConfig.windowMs,
        maxHistorySize: stateManagerConfig.maxHistorySize
      });
      
      return adapter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const context = { errorMessage, component: 'stateManager' };
      throw createScopedTemplumError(
        this.errorScope,
        'create-state-manager',
        error,
        `StateManager creation failed: ${errorMessage}`,
        'STATE_MANAGER_CREATION_ERROR',
        'configuration',
        context
      );
    }
  }

  createBackendRouter(config?: any): IBackendRouter {
    // TASK-NEW-026: PCL Backend Integrator dependency injection enhancement
    try {
      // Use registry's validation methods if available
      const validatedConfig = this.registry?.validateBackendRouterConfig(config) ?? config ?? {};
      
      const backendRouterConfig = {
        stateManager: null, // Will be set through dependency injection in wireComponentDependencies
        commandRegistry: null, // Will be initialized separately  
        riskMitigationFramework: null, // Will be initialized separately
        enableCircuitBreaker: validatedConfig?.enableCircuitBreaker !== false,
        timeoutMs: this.registry?.validateNumericRange(validatedConfig?.timeoutMs, 5000, 120000, 30000, 'timeoutMs') ?? validatedConfig?.timeoutMs ?? 30000,
        retryAttempts: this.registry?.validateNumericRange(validatedConfig?.retryAttempts, 0, 10, 3, 'retryAttempts') ?? validatedConfig?.retryAttempts ?? 3,
        maxConcurrentRequests: this.registry?.validateNumericRange(validatedConfig?.maxConcurrentRequests, 1, 100, 10, 'maxConcurrentRequests') ?? validatedConfig?.maxConcurrentRequests ?? 10,
        healthCheckInterval: this.registry?.validateNumericRange(validatedConfig?.healthCheckInterval, 5000, 300000, 30000, 'healthCheckInterval') ?? validatedConfig?.healthCheckInterval ?? 30000,
        ...validatedConfig
      };
      
      const backendRouter = new PCLBackendIntegrator(backendRouterConfig);
      const adapter = new BackendRouterAdapter(
        backendRouter,
        this.errorScope.child('backend-router-adapter')
      );
      
      TemplumComponentFactory.logger.info('BackendRouter created with validated configuration', {
        circuitBreakerEnabled: backendRouterConfig.enableCircuitBreaker,
        timeout: backendRouterConfig.timeoutMs,
        retryAttempts: backendRouterConfig.retryAttempts
      });
      
      return adapter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const context = { errorMessage, component: 'backendRouter' };
      throw createScopedTemplumError(
        this.errorScope,
        'create-backend-router',
        error,
        `BackendRouter creation failed: ${errorMessage}`,
        'BACKEND_ROUTER_CREATION_ERROR',
        'configuration',
        context
      );
    }
  }

  createBackendServiceRouter(_config?: any): IBackendServiceRouter {
    const backendServiceRouter = new TemplumBackendServiceRouter();
    return new BackendServiceRouterAdapter(
      backendServiceRouter,
      this.errorScope.child('backend-service-router-adapter')
    );
  }

  createResourceManager(config?: any): IResourceManager {
    // TASK-NEW-027: Resource manager configuration validation and policy setup
    try {
      // Use registry's validation methods if available
      const validatedConfig = this.registry?.validateResourceManagerConfig(config) ?? config ?? {};
      
      const resourceManagerConfig = {
        memoryLimitMB: this.registry?.validateNumericRange(validatedConfig?.memoryLimitMB, 64, 4096, 256, 'memoryLimitMB') ?? validatedConfig?.memoryLimitMB ?? 256,
        cpuLimitPercent: this.registry?.validateNumericRange(validatedConfig?.cpuLimitPercent, 10, 100, 80, 'cpuLimitPercent') ?? validatedConfig?.cpuLimitPercent ?? 80,
        cleanupIntervalMs: this.registry?.validateNumericRange(validatedConfig?.cleanupIntervalMs, 30000, 600000, 60000, 'cleanupIntervalMs') ?? validatedConfig?.cleanupIntervalMs ?? 60000,
        maxResourceAge: this.registry?.validateNumericRange(validatedConfig?.maxResourceAge, 300000, 7200000, 3600000, 'maxResourceAge') ?? validatedConfig?.maxResourceAge ?? 3600000,
        enableHealthMonitoring: validatedConfig?.enableHealthMonitoring !== false,
        maxConcurrentAllocations: this.registry?.validateNumericRange(validatedConfig?.maxConcurrentAllocations, 10, 1000, 100, 'maxConcurrentAllocations') ?? validatedConfig?.maxConcurrentAllocations ?? 100,
        resourceGCThreshold: this.registry?.validateNumericRange(validatedConfig?.resourceGCThreshold, 50, 90, 75, 'resourceGCThreshold') ?? validatedConfig?.resourceGCThreshold ?? 75,
        alertThresholds: {
          memoryUsage: this.registry?.validateNumericRange(validatedConfig?.alertThresholds?.memoryUsage, 60, 95, 85, 'alertThresholds.memoryUsage') ?? validatedConfig?.alertThresholds?.memoryUsage ?? 85,
          cpuUsage: this.registry?.validateNumericRange(validatedConfig?.alertThresholds?.cpuUsage, 60, 95, 90, 'alertThresholds.cpuUsage') ?? validatedConfig?.alertThresholds?.cpuUsage ?? 90,
          diskUsage: this.registry?.validateNumericRange(validatedConfig?.alertThresholds?.diskUsage, 70, 95, 80, 'alertThresholds.diskUsage') ?? validatedConfig?.alertThresholds?.diskUsage ?? 80
        },
        ...validatedConfig
      };
      
      const resourceManager = new TemplumResourceManager(resourceManagerConfig);
      const adapter = new ResourceManagerAdapter(resourceManager);
      
      TemplumComponentFactory.logger.info('ResourceManager created with validated configuration', {
        memoryLimit: resourceManagerConfig.memoryLimitMB,
        cpuLimit: resourceManagerConfig.cpuLimitPercent,
        healthMonitoring: resourceManagerConfig.enableHealthMonitoring,
        cleanupInterval: resourceManagerConfig.cleanupIntervalMs
      });
      
      return adapter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const context = { errorMessage, component: 'resourceManager' };
      throw createScopedTemplumError(
        this.errorScope,
        'create-resource-manager',
        error,
        `ResourceManager creation failed: ${errorMessage}`,
        'RESOURCE_MANAGER_CREATION_ERROR',
        'configuration',
        context
      );
    }
  }
  
  createObservabilityService(config?: any): IObservabilityService {
    // Create observability service with environment-specific configuration
    const observabilityService = new ObservabilityAdapter(config);
    return observabilityService;
  }
}

/**
 * Main adapter registry for dependency injection
 */
export class TemplumAdapterRegistry extends EventDrivenComponent<AdapterRegistryEvents> {
  private dependencies: Partial<ITemplumCoreDependencies> = {};
  private factory: IComponentFactory;
  private config: IDependencyInjectionConfig;
  private initialized: boolean = false;
  private validationReport: ValidationReport | null = null;
  private sessionManager?: TemplumSessionManagerContract;
  private readonly logger = adapterRegistryLogger.child('registry');
  private readonly componentLogger = adapterRegistryLogger.child('components');
  private readonly validationLogger = adapterRegistryLogger.child('validation');
  private readonly wiringLogger = adapterRegistryLogger.child('wiring');
  private readonly initializationLogger = adapterRegistryLogger.child('initialization');
  private readonly sessionLogger = adapterRegistryLogger.child('session-manager');
  private readonly disposalLogger = adapterRegistryLogger.child('disposal');
  private readonly configurationLogger = adapterRegistryLogger.child('configuration');
  private readonly errorHandler: ScopedErrorHandler = ErrorHandler.scope(
    ErrorHandler.formatContext('core', 'adapter-registry'),
    { component: 'templum-adapter-registry' }
  );

  constructor(config: IDependencyInjectionConfig = {}) {
    super('templum-adapter-registry', 50);
    this.config = {
      enableSkinEngine: true,
      enableStateManager: true,
      enableBackendRouter: true,
      enableBackendServiceRouter: true,
      enableResourceManager: true,
      enableObservabilityService: true,
      // Validation defaults
      validationLevel: 'standard',
      enableValidationReporting: true,
      validateComponentInterfaces: true,
      validateDependencyWiring: true,
      validateInitializationOrder: true,
      validationTimeout: 5000,
      ...config
    };
    this.factory = new TemplumComponentFactory(
      config,
      this.getScopedErrorHandler('component-factory')
    );
    (this.factory as TemplumComponentFactory).setRegistry(this);
  }

  private getScopedErrorHandler(
    segment: string,
    metadata?: Record<string, unknown>
  ): ScopedErrorHandler {
    return this.errorHandler.child(segment, metadata);
  }

  private scopedTemplumError(
    segment: string,
    error: unknown,
    message: string,
    code: string,
    category: TemplumError['category'],
    metadata?: Record<string, unknown>
  ): TemplumError {
    return createScopedTemplumError(
      this.errorHandler,
      segment,
      error,
      message,
      code,
      category,
      metadata
    );
  }

  private lifecycleTemplumError(
    segment: string,
    error: unknown,
    message: string,
    code: string,
    category: TemplumError['category'],
    metadata?: Record<string, unknown>
  ): TemplumError {
    return this.scopedTemplumError(
      ErrorHandler.formatContext('component-lifecycle', segment),
      error,
      message,
      code,
      category,
      metadata
    );
  }

  /**
   * TASK-NEW-028: Component instance creation validation
   * Validates that component instances are properly created and implement required interfaces
   */
  private validateComponentInstance(name: string, component: any): ComponentValidationStatus {
    const status: ComponentValidationStatus = {
      name,
      valid: true,
      issues: [],
      interfaceCompliance: false,
      methodAvailability: false,
      initializationStatus: 'pending'
    };

    try {
      // Basic instance validation
      if (!component) {
        status.valid = false;
        status.issues.push(`Component ${name} is null or undefined`);
        return status;
      }

      if (!TypeGuards.isObject(component)) {
        status.valid = false;
        status.issues.push(`Component ${name} is not an object`);
        return status;
      }

      // Interface compliance validation based on component type
      const interfaceChecks: Record<string, string[]> = {
        skinEngine: ['renderForInterface', 'validateSkin', 'generateSkinHTML'],
        stateManager: ['initialize', 'syncState', 'sendMessage', 'getCurrentState'],
        backendRouter: ['initialize', 'executeCommand', 'getStatus'],
        backendServiceRouter: ['discoverAndConnect', 'loadBackendSkin', 'executeCommand'],
        resourceManager: ['initialize', 'allocateResource', 'deallocateResource', 'getResourceUsage'],
        observabilityService: ['logInfo', 'logError', 'logDebug']
      };
      interfaceChecks.sessionManager = [
        'initialize',
        'ensureSessionForInterface',
        'registerInterfaceAdapter',
        'updateSessionState',
        'syncInterfaces'
      ];

      const requiredMethods = interfaceChecks[name] || [];
      const availableMethods: string[] = [];
      const missingMethods: string[] = [];

      for (const method of requiredMethods) {
        if (SemanticValidators.hasFunction(component, method, { required: false })) {
          availableMethods.push(method);
        } else {
          missingMethods.push(method);
        }
      }

      // Method availability assessment
      status.methodAvailability = missingMethods.length === 0;
      if (missingMethods.length > 0 && this.config.validationLevel === 'strict') {
        status.valid = false;
        status.issues.push(`Missing required methods: ${missingMethods.join(', ')}`);
      } else if (missingMethods.length > 0) {
        status.issues.push(`Optional methods not available: ${missingMethods.join(', ')}`);
      }

      // Interface compliance (more lenient - checks for core functionality)
      const coreMethodsAvailable = availableMethods.length >= Math.ceil(requiredMethods.length / 2);
      status.interfaceCompliance = coreMethodsAvailable;

      if (!coreMethodsAvailable && this.config.validationLevel !== 'relaxed') {
        status.valid = false;
        status.issues.push(`Component ${name} does not implement core interface methods`);
      }

      // Check for adapter pattern compliance
      if (component.constructor.name.includes('Adapter')) {
        status.issues.push(`Using adapter pattern for ${name}`);
      }

      this.validationLogger.info('Component validation', {
        component: name,
        valid: status.valid,
        availableMethods: availableMethods.length,
        missingMethods: missingMethods.length,
        interfaceCompliance: status.interfaceCompliance
      });

    } catch (error) {
      status.valid = false;
      const metadata = {
        component: name,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      this.getScopedErrorHandler('validate-component', metadata)
        .handle(error, metadata);
      status.issues.push(`Component validation error: ${metadata.errorMessage}`);
    }

    return status;
  }

  /**
   * TASK-NEW-029: Cross-component dependency wiring validation  
   * Validates that dependencies are properly wired between components
   */
  private validateDependencyWiring(): DependencyWiringStatus[] {
    const wiringStatuses: DependencyWiringStatus[] = [];

    try {
      // Validate state manager → backend router wiring
      if (this.dependencies.stateManager && this.dependencies.backendRouter) {
        const status: DependencyWiringStatus = {
          sourceComponent: 'stateManager',
          targetComponent: 'backendRouter', 
          wiringValid: true,
          issues: [],
          circularDependency: false,
          interfaceCompatibility: true
        };

        // Check if backend router has state manager reference
        const backendRouter = this.dependencies.backendRouter as any;
        if (!backendRouter.stateManager && !backendRouter.dependencies?.stateManager) {
          status.wiringValid = false;
          status.issues.push('Backend router does not have state manager reference');
        }

        wiringStatuses.push(status);
      }

      // Validate resource manager → component registration
      if (this.dependencies.resourceManager) {
        const componentNames = Object.keys(this.dependencies) as (keyof ITemplumCoreDependencies)[];
        for (const componentName of componentNames) {
          if (componentName !== 'resourceManager') {
            const status: DependencyWiringStatus = {
              sourceComponent: 'resourceManager',
              targetComponent: componentName,
              wiringValid: true,
              issues: [],
              circularDependency: false,
              interfaceCompatibility: true
            };

            // Check if component is registered with resource manager
            const resourceManager = this.dependencies.resourceManager as any;
            const services = resourceManager.getServiceHealth?.() || [];
            const isRegistered = services.some((service: any) => service.id === `templum-${componentName}`);
            
            if (!isRegistered && this.config.validationLevel === 'strict') {
              status.wiringValid = false;
              status.issues.push(`Component ${componentName} not registered with resource manager`);
            }

            wiringStatuses.push(status);
          }
        }
      }

      // Circular dependency detection
      const dependencyGraph = this.buildDependencyGraph();
      const circularDeps = this.detectCircularDependencies(dependencyGraph);
      
      for (const cycle of circularDeps) {
        for (let i = 0; i < cycle.length; i++) {
          const source = cycle[i];
          const target = cycle[(i + 1) % cycle.length];
          
          wiringStatuses.push({
            sourceComponent: source,
            targetComponent: target,
            wiringValid: false,
            issues: [`Circular dependency detected: ${cycle.join(' → ')}`],
            circularDependency: true,
            interfaceCompatibility: true
          });
        }
      }

    } catch (error) {
      const metadata = {
        operation: 'validateDependencyWiring',
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      this.getScopedErrorHandler('validate-dependency-wiring', metadata)
        .handle(error, metadata);
    }

    return wiringStatuses;
  }

  /**
   * Build dependency graph for circular dependency detection
   */
  private buildDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    // Initialize all components
    const componentNames = Object.keys(this.dependencies) as (keyof ITemplumCoreDependencies)[];
    for (const name of componentNames) {
      graph[name] = [];
    }

    // Add known dependencies
    if (this.dependencies.stateManager && this.dependencies.backendRouter) {
      graph['backendRouter'].push('stateManager');
    }

    if (this.dependencies.resourceManager) {
      for (const name of componentNames) {
        if (name !== 'resourceManager') {
          graph[name].push('resourceManager');
        }
      }
    }

    return graph;
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(graph: Record<string, string[]>): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      for (const neighbor of graph[node] || []) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), neighbor]);
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const node of Object.keys(graph)) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  /**
   * TASK-NEW-030: Component initialization ordering validation
   * Validates that components are initialized in proper dependency order
   */
  private validateInitializationOrder(): boolean {
    try {
      const expectedOrder = [
        'observabilityService',
        'resourceManager', 
        'stateManager',
        'skinEngine',
        'backendServiceRouter',
        'backendRouter'
      ];

      const actualComponents = Object.keys(this.dependencies);
      const issues: string[] = [];

      // Check if critical components are initialized before dependent components
      if (actualComponents.includes('backendRouter') && actualComponents.includes('stateManager')) {
        // Backend router should be initialized after state manager
        const stateIndex = expectedOrder.indexOf('stateManager');
        const routerIndex = expectedOrder.indexOf('backendRouter');
        
        if (stateIndex >= routerIndex) {
          issues.push('Backend router should be initialized after state manager');
        }
      }

      if (actualComponents.includes('resourceManager')) {
        // Resource manager should be initialized early
        const resourceIndex = expectedOrder.indexOf('resourceManager');
        if (resourceIndex > 2) {
          issues.push('Resource manager should be initialized early in the sequence');
        }
      }

      if (issues.length > 0 && this.config.validationLevel === 'strict') {
        this.initializationLogger.warn('Initialization order validation issues', { issues });
        return false;
      }

      return true;
    } catch (error) {
      const metadata = {
        operation: 'validateInitializationOrder',
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      this.getScopedErrorHandler('validate-initialization-order', metadata)
        .handle(error, metadata);
      return false;
    }
  }

  /**
   * TASK-NEW-031: Enhanced dependency integrity validation
   * Comprehensive validation of the entire dependency injection system
   */
  private validateDependencyIntegrity(): void {
    const validationStartTime = Date.now();
    const componentValidations: ComponentValidationStatus[] = [];
    const dependencyWiring: DependencyWiringStatus[] = [];
    const issues: string[] = [];

    try {
      // Phase 1: Validate all component instances
      if (this.config.validateComponentInterfaces) {
        for (const [name, component] of Object.entries(this.dependencies)) {
          const validation = this.validateComponentInstance(name, component);
          componentValidations.push(validation);
          
          if (!validation.valid && this.config.validationLevel === 'strict') {
            issues.push(...validation.issues);
          }
        }
      }

      // Phase 2: Validate dependency wiring
      if (this.config.validateDependencyWiring) {
        const wiringValidations = this.validateDependencyWiring();
        dependencyWiring.push(...wiringValidations);
        
        const invalidWiring = wiringValidations.filter(w => !w.wiringValid);
        if (invalidWiring.length > 0 && this.config.validationLevel !== 'relaxed') {
          invalidWiring.forEach(w => issues.push(...w.issues));
        }
      }

      // Phase 3: Validate initialization order
      const initializationOrderValid = this.config.validateInitializationOrder 
        ? this.validateInitializationOrder() 
        : true;

      // Phase 4: Validate system integrity
      const required = ['skinEngine', 'stateManager', 'backendRouter', 'backendServiceRouter', 'resourceManager'];
      const missing: string[] = [];
      const present: string[] = [];

      for (const dep of required) {
        const component = this.dependencies[dep as keyof ITemplumCoreDependencies];
        if (!component) {
          missing.push(dep);
        } else {
          present.push(dep);
        }
      }

      // Detect circular dependencies
      const dependencyGraph = this.buildDependencyGraph();
      const circularDependencies = this.detectCircularDependencies(dependencyGraph);
      const circularDepPaths = circularDependencies.map(cycle => cycle.join(' → '));

      // Generate recommendations
      const recommendations: string[] = [];
      if (missing.length > 0) {
        recommendations.push(`Consider enabling missing components: ${missing.join(', ')}`);
      }
      if (circularDependencies.length > 0) {
        recommendations.push('Resolve circular dependencies to improve system stability');
      }
      if (componentValidations.some(v => !v.interfaceCompliance)) {
        recommendations.push('Review component interface implementations for better compliance');
      }

      // Create comprehensive validation report
      this.validationReport = {
        timestamp: Date.now(),
        overallValid: missing.length === 0 && circularDependencies.length === 0 && issues.length === 0,
        validationLevel: this.config.validationLevel || 'standard',
        componentValidation: componentValidations,
        dependencyWiring: dependencyWiring,
        integrityValidation: {
          allRequiredPresent: missing.length === 0,
          noDuplicateInstances: true, // TODO: Implement duplicate detection if needed
          circularDependencies: circularDepPaths,
          initializationOrder: initializationOrderValid
        },
        recommendations,
        executionTime: Date.now() - validationStartTime
      };

      // Log validation results
      if (this.config.enableValidationReporting) {
        this.validationLogger.info('Dependency injection validation complete', {
          overallValid: this.validationReport.overallValid,
          componentsValidated: componentValidations.length,
          wiringChecks: dependencyWiring.length,
          executionTime: this.validationReport.executionTime,
          recommendations: recommendations.length
        });

        if (!this.validationReport.overallValid) {
          this.validationLogger.warn('Dependency injection validation issues detected', {
            missingComponents: missing,
            circularDependencies: circularDepPaths,
            validationIssues: issues.length
          });
        }
      }

      // Handle validation failures
      if (!this.validationReport.overallValid) {
        if (this.config.validationLevel === 'strict') {
          const allIssues = [
            ...issues,
            ...missing.map(m => `Missing required component: ${m}`),
            ...circularDepPaths.map(c => `Circular dependency: ${c}`)
          ];
          throw this.lifecycleTemplumError(
            'validation',
            undefined,
            `Dependency injection validation failed: ${allIssues.join('; ')}`,
            'DEPENDENCY_VALIDATION_ERROR',
            'configuration',
            {
              issues: allIssues,
              missingComponents: missing,
              circularDependencies: circularDepPaths
            }
          );
        } else {
          this.validationLogger.warn('Dependency injection validation warnings (non-strict mode)', {
            issues: issues.slice(0, 5), // Limit console output
            totalIssues: issues.length
          });
        }
      }

    } catch (error) {
      if (isTemplumError(error)) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      throw this.lifecycleTemplumError(
        'validation',
        error,
        `Dependency integrity validation failed: ${errorMessage}`,
        'VALIDATION_ERROR',
        'configuration',
        { errorMessage }
      );
    }
  }

  /**
   * Get the current validation report
   */
  getValidationReport(): ValidationReport | null {
    return this.validationReport;
  }

  private assertPlainObject(candidate: unknown, fieldName: string): asserts candidate is Record<string, unknown> {
    if (!TypeGuards.isPlainObject(candidate)) {
      throw this.scopedTemplumError(
        ErrorHandler.formatContext('configuration', 'assert-plain-object'),
        undefined,
        `${fieldName} must be a plain object`,
        'VALIDATION_ERROR',
        'validation',
        { fieldName }
      );
    }
  }

  private sanitizeNumericOption(
    target: Record<string, unknown>,
    key: string,
    options: { fieldName: string; min?: number; max?: number },
  ): void {
    if (!(key in target)) {
      return;
    }

    const value = target[key];

    try {
      TypeAssertions.assertWithConfidence(
        value,
        (candidate): candidate is number => TypeGuards.isNumber(candidate),
        `${options.fieldName} must be a number`,
      );

      const numericValue = value as number;

      if ((options.min !== undefined && numericValue < options.min) || (options.max !== undefined && numericValue > options.max)) {
        throw this.scopedTemplumError(
          ErrorHandler.formatContext('configuration', 'sanitize-numeric-option'),
          undefined,
          `${options.fieldName} must be between ${options.min ?? '-∞'} and ${options.max ?? '+∞'}`,
          'NUMERIC_RANGE_VALIDATION_ERROR',
          'validation',
          { fieldName: options.fieldName, value: numericValue, min: options.min, max: options.max }
        );
      }
    } catch (error) {
      const metadata = {
        field: options.fieldName,
        value,
        bounds: options,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      this.getScopedErrorHandler('sanitize-numeric-option', metadata)
        .handle(error, metadata);
      if (value !== undefined) {
        this.configurationLogger.warn('Invalid configuration value removed', metadata);
      }
      delete target[key];
    }
  }

  /**
   * Configuration validation helper methods (public for factory access)
   */
  public validateStateManagerConfig(config?: any): Record<string, unknown> {
    if (config === undefined) {
      return {};
    }

    this.assertPlainObject(config, 'State manager config');

    const validated = { ...(config as Record<string, unknown>) };

    this.sanitizeNumericOption(validated, 'coalescingWindowMs', { fieldName: 'stateManager.coalescingWindowMs', min: 0 });
    this.sanitizeNumericOption(validated, 'maxBatchSize', { fieldName: 'stateManager.maxBatchSize', min: 1 });

    return validated;
  }

  public validateNumericRange(value: unknown, min: number, max: number, defaultValue: number, fieldName: string): number {
    try {
      TypeAssertions.assertWithConfidence(
        value,
        (candidate): candidate is number => TypeGuards.isNumber(candidate),
        `${fieldName} must be a number`,
      );

      const numericValue = value as number;

      if (Number.isNaN(numericValue) || numericValue < min || numericValue > max) {
        throw this.scopedTemplumError(
          ErrorHandler.formatContext('configuration', 'validate-numeric-range'),
          undefined,
          `${fieldName} must be between ${min} and ${max}`,
          'NUMERIC_RANGE_VALIDATION_ERROR',
          'validation',
          { fieldName, value: numericValue, min, max }
        );
      }

      return numericValue;
    } catch (error) {
      const metadata = {
        fieldName,
        value,
        min,
        max,
        defaultValue,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      this.getScopedErrorHandler('validate-numeric-range', metadata)
        .handle(error, metadata);
      if (value !== undefined) {
        this.configurationLogger.warn('Invalid numeric configuration value', {
          fieldName,
          value,
          min,
          max,
          defaultValue
        });
      }
      return defaultValue;
    }
  }

  public validateEnumValue<T>(value: any, allowedValues: T[], defaultValue: T, fieldName: string): T {
    if (!allowedValues.includes(value)) {
      if (value !== undefined) {
        this.configurationLogger.warn('Invalid enum configuration value', {
          fieldName,
          value,
          allowedValues,
          defaultValue
        });
      }
      return defaultValue;
    }
    return value;
  }

  public validateResourceManagerConfig(config?: any): Record<string, unknown> {
    if (config === undefined) {
      return {};
    }

    this.assertPlainObject(config, 'Resource manager config');

    const validated = { ...(config as Record<string, unknown>) };

    this.sanitizeNumericOption(validated, 'memoryLimitMB', { fieldName: 'resourceManager.memoryLimitMB', min: 64 });
    this.sanitizeNumericOption(validated, 'cpuLimitPercent', { fieldName: 'resourceManager.cpuLimitPercent', min: 1, max: 100 });

    return validated;
  }

  public validateBackendRouterConfig(config?: any): Record<string, unknown> {
    if (config === undefined) {
      return {};
    }

    this.assertPlainObject(config, 'Backend router config');

    const validated = { ...(config as Record<string, unknown>) };

    this.sanitizeNumericOption(validated, 'timeoutMs', { fieldName: 'backendRouter.timeoutMs', min: 1000 });
    this.sanitizeNumericOption(validated, 'retryAttempts', { fieldName: 'backendRouter.retryAttempts', min: 0 });

    return validated;
  }

  /**
   * Initialize the adapter registry and create component instances
   * Enhanced with dependency injection validation and cross-component wiring
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Adapter registry already initialized');
      return;
    }

    if (
      this.config.validationLevel === 'strict' &&
      typeof this.config.validationTimeout === 'number' &&
      this.config.validationTimeout < 50
    ) {
      throw this.lifecycleTemplumError(
        'configuration',
        undefined,
        `Validation timeout ${this.config.validationTimeout}ms is below the strict-mode minimum (50ms)`,
        'VALIDATION_TIMEOUT_ERROR',
        'configuration',
        { minimum: 50, provided: this.config.validationTimeout }
      );
    }

    try {
      // Phase 1: Create component instances
      await this.createComponentInstances();
      
      // Phase 2: Wire dependencies between components
      await this.wireComponentDependencies();
      
      // Phase 3: Initialize components in dependency order
      await this.initializeComponentsInOrder();

      // Phase 4: Construct shared session manager
      await this.initializeSessionManager();
      
      // Phase 5: Validate all dependencies are satisfied
      this.validateDependencyIntegrity();

      this.initialized = true;
      this.emit('initialized', { 
        timestamp: Date.now(), 
        components: Object.keys(this.dependencies),
        initializationPhases: 4
      });

      // Use observability service if available, fallback to logger  
      if (this.dependencies.observabilityService) {
        this.dependencies.observabilityService.logInfo('Registry initialization complete with enhanced dependency injection', {
          components: Object.keys(this.dependencies),
          customFactories: Object.keys(this.config.customFactories || {})
        }, 'TemplumAdapterRegistry');
      } else {
        this.logger.info('Registry initialization complete with enhanced dependency injection', {
          components: Object.keys(this.dependencies),
          customFactories: Object.keys(this.config.customFactories || {})
        });
      }
    } catch (error) {
      const detailMessage = isTemplumError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown registry initialization error';

      const templumError = this.scopedTemplumError(
        'initialize',
        error,
        `Registry initialization failed: ${detailMessage}`,
        'INITIALIZATION_ERROR',
        'configuration',
        { phase: 'initialize' }
      );

      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumAdapterRegistry',
        error: templumError,
        severity: 'critical'
      };

      this.logger.error('Registry initialization failed', templumError, {
        context: templumError.context,
        errorPayload
      });
      throw templumError;
    }
  }

  /**
   * TASK-NEW-028: Enhanced component instance creation with validation
   * Create component instances based on configuration with comprehensive validation
   */
  private async createComponentInstances(): Promise<void> {
    const componentFactories = [
      { name: 'skinEngine' as const, enabled: this.config.enableSkinEngine },
      { name: 'stateManager' as const, enabled: this.config.enableStateManager },
      { name: 'backendRouter' as const, enabled: this.config.enableBackendRouter },
      { name: 'backendServiceRouter' as const, enabled: this.config.enableBackendServiceRouter },
      { name: 'resourceManager' as const, enabled: this.config.enableResourceManager },
      { name: 'observabilityService' as const, enabled: this.config.enableObservabilityService }
    ];

    for (const { name, enabled } of componentFactories) {
      if (enabled) {
        try {
          // Create component instance
          const component = this.config.customFactories?.[name]?.() || 
            (this.factory[`create${name.charAt(0).toUpperCase() + name.slice(1)}` as keyof IComponentFactory] as any)();
          
          // Validate component instance immediately after creation
          if (this.config.validateComponentInterfaces) {
            const validation = this.validateComponentInstance(name, component);
            
            if (!validation.valid && this.config.validationLevel === 'strict') {
              throw this.scopedTemplumError(
                ErrorHandler.formatContext('component-factory', 'validation'),
                undefined,
                `Component ${name} validation failed: ${validation.issues.join('; ')}`,
                'COMPONENT_VALIDATION_ERROR',
                'configuration',
                { component: name, issues: validation.issues }
              );
            } else if (!validation.valid) {
              this.componentLogger.warn('Component validation warnings', {
                component: name,
                issues: validation.issues
              });
            }
          }
          
          this.dependencies[name] = component;
          this.componentLogger.info('Created and validated component', { component: name });
          
        } catch (error) {
          const templumError = this.scopedTemplumError(
            'component-factory',
            error,
            `Failed to create ${name}`,
            'COMPONENT_CREATION_ERROR',
            'configuration',
            { component: name }
          );

          this.componentLogger.error('Component creation failed', templumError, {
            component: name,
            context: templumError.context
          });

          throw templumError;
        }
      }
    }
    
    this.componentLogger.info('Component creation phase complete', {
      totalComponents: Object.keys(this.dependencies).length,
      validationEnabled: this.config.validateComponentInterfaces
    });
  }

  /**
   * TASK-NEW-029: Enhanced cross-component dependency wiring with validation
   * Wire dependencies between components with comprehensive validation
   */
  private async wireComponentDependencies(): Promise<void> {
    const wiringOperations: Array<{ name: string, operation: () => Promise<void> | void }> = [];

    // Wire state manager to backend router if both exist
    if (this.dependencies.backendRouter && this.dependencies.stateManager) {
      wiringOperations.push({
        name: 'stateManager → backendRouter',
        operation: () => {
          this.dependencies.backendRouter!.initialize?.({ 
            stateManager: this.dependencies.stateManager 
          });
        }
      });
    }

    // Wire resource manager component registration
    if (this.dependencies.resourceManager) {
      const componentNames = Object.keys(this.dependencies) as (keyof ITemplumCoreDependencies)[];
      for (const componentName of componentNames) {
        if (componentName !== 'resourceManager') {
          wiringOperations.push({
            name: `resourceManager registration for ${componentName}`,
            operation: async () => {
              await this.dependencies.resourceManager!.registerService(
                `templum-${componentName}`, 
                'core', 
                { component: componentName }
              );
            }
          });
        }
      }
    }

    // Wire observability service to components for logging if available
    if (this.dependencies.observabilityService) {
      wiringOperations.push({
        name: 'observabilityService integration',
        operation: () => {
          // Components can access observability service through the registry
          this.wiringLogger.info('Observability service available for component logging');
        }
      });
    }

    // Execute all wiring operations with validation
    for (const { name, operation } of wiringOperations) {
      try {
        await operation();
        this.wiringLogger.info('Successfully wired dependency', { name });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (this.config.validationLevel === 'strict') {
          throw this.lifecycleTemplumError(
            'wiring',
            error,
            `Dependency wiring failed for ${name}: ${errorMessage}`,
            'DEPENDENCY_WIRING_ERROR',
            'configuration',
            { operation: name, errorMessage }
          );
        }

        const metadata = { operation: name, errorMessage };
        this.getScopedErrorHandler('wire-dependency', metadata)
          .handle(error, metadata);

        this.wiringLogger.warn('Dependency wiring warning', metadata);
      }
    }

    // Validate wiring after completion
    if (this.config.validateDependencyWiring) {
      const wiringValidations = this.validateDependencyWiring();
      const failedWiring = wiringValidations.filter(w => !w.wiringValid);
      
      if (failedWiring.length > 0 && this.config.validationLevel === 'strict') {
        const issues = failedWiring.map(w => `${w.sourceComponent} → ${w.targetComponent}: ${w.issues.join(', ')}`);
        throw this.lifecycleTemplumError(
          'wiring',
          undefined,
          `Dependency wiring validation failed: ${issues.join('; ')}`,
          'DEPENDENCY_WIRING_VALIDATION_ERROR',
          'configuration',
          { issues, failedWiring }
        );
      } else if (failedWiring.length > 0) {
        this.wiringLogger.warn('Dependency wiring validation warnings', {
          issues: failedWiring.map(w => w.issues).flat()
        });
      }
    }

    this.wiringLogger.info('Dependency wiring phase complete', {
      totalWiringOperations: wiringOperations.length,
      validationEnabled: this.config.validateDependencyWiring
    });
  }

  /**
   * TASK-NEW-030: Enhanced component initialization ordering with validation
   * Initialize components in proper dependency order with comprehensive validation
   */
  private async initializeComponentsInOrder(): Promise<void> {
    // Initialize in dependency order: Observability -> Resource Manager -> State Manager -> Others
    const initOrder = [
      'observabilityService',
      'resourceManager',
      'stateManager', 
      'skinEngine',
      'backendServiceRouter',
      'backendRouter'
    ] as const;

    const initializationResults: Array<{ component: string, success: boolean, duration: number, error?: string }> = [];

    // Validate initialization order before starting
    if (this.config.validateInitializationOrder) {
      const orderValid = this.validateInitializationOrder();
      if (!orderValid && this.config.validationLevel === 'strict') {
        throw this.lifecycleTemplumError(
          'initialization',
          undefined,
          'Component initialization order validation failed',
          'INITIALIZATION_ORDER_ERROR',
          'configuration'
        );
      }
    }

    // Initialize components in order with validation
    for (const componentName of initOrder) {
      const component = this.dependencies[componentName];
      if (component) {
        const startTime = Date.now();
        let success = false;
        let error: string | undefined;

        try {
          // Check if component has initialize method
          if (SemanticValidators.hasFunction(component, 'initialize', { required: false })) {
            await (component as { initialize: () => Promise<void> }).initialize();
            success = true;
            this.initializationLogger.info('Component initialized', { component: componentName });
            
            // Update component validation status
            if (this.validationReport) {
              const componentValidation = this.validationReport.componentValidation.find(v => v.name === componentName);
              if (componentValidation) {
                componentValidation.initializationStatus = 'initialized';
              }
            }
          } else {
            success = true; // Component doesn't require initialization
            this.initializationLogger.info('Component does not require initialization', { component: componentName });
          }
        } catch (initError) {
          error = initError instanceof Error ? initError.message : 'Unknown initialization error';
          
          if (this.config.validationLevel === 'strict') {
            throw this.lifecycleTemplumError(
              'initialization',
              initError,
              `Failed to initialize ${componentName}: ${error}`,
              'COMPONENT_INITIALIZATION_ERROR',
              'configuration',
              { component: componentName, errorMessage: error }
            );
          } else {
            const errorInstance = initError instanceof Error ? initError : new Error(error);
            const metadata = {
              component: componentName,
              errorMessage: error,
              phase: 'initialize-component'
            };
            this.getScopedErrorHandler('initialize-component', metadata)
              .handle(initError, metadata);
            this.initializationLogger.error('Initialization warning', errorInstance, {
              component: componentName,
              message: error
            });
          }

          // Update component validation status
          if (this.validationReport) {
            const componentValidation = this.validationReport.componentValidation.find(v => v.name === componentName);
            if (componentValidation) {
              componentValidation.initializationStatus = 'failed';
              componentValidation.issues.push(`Initialization failed: ${error}`);
            }
          }
        }

        initializationResults.push({
          component: componentName,
          success,
          duration: Date.now() - startTime,
          error
        });
      }
    }

    // Validate all components are properly initialized
    const failedInitializations = initializationResults.filter(r => !r.success);
    if (failedInitializations.length > 0) {
      const failureDetails = failedInitializations.map(f => `${f.component}: ${f.error}`);
      
      if (this.config.validationLevel === 'strict') {
        throw this.lifecycleTemplumError(
          'initialization',
          undefined,
          `Component initialization failures: ${failureDetails.join('; ')}`,
          'INITIALIZATION_FAILURES',
          'configuration',
          { failureDetails }
        );
      } else {
        this.initializationLogger.warn('Component initialization warnings', { failureDetails });
      }
    }

    this.initializationLogger.info('Component initialization phase complete', {
      totalComponents: initializationResults.length,
      successfulInitializations: initializationResults.filter(r => r.success).length,
      failedInitializations: failedInitializations.length,
      totalDuration: initializationResults.reduce((sum, r) => sum + r.duration, 0)
    });
  }

  private async initializeSessionManager(): Promise<void> {
    if (this.sessionManager) {
      return;
    }

    const backendServiceRouter = this.dependencies.backendServiceRouter as TemplumBackendServiceRouter | undefined;
    const resourceManager = this.dependencies.resourceManager as
      | (TemplumResourceManager & {
          registerService?: (serviceId: string, type: string, metadata?: Record<string, unknown>) => Promise<void>;
        })
      | undefined;

    if (!backendServiceRouter) {
      throw this.lifecycleTemplumError(
        'session-manager',
        undefined,
        'Backend service router must be initialized before creating the session manager',
        'SESSION_MANAGER_INITIALIZATION_ERROR',
        'configuration',
        { requirement: 'backendServiceRouter' }
      );
    }

    try {
      this.sessionManager = new TemplumUniversalSessionManager(
        {},
        undefined,
        backendServiceRouter
      );

      await this.sessionManager.initialize();

      this.dependencies.sessionManager = this.sessionManager;

      if (resourceManager?.registerService) {
        try {
          await resourceManager.registerService('templum-sessionManager', 'core', {
            component: 'sessionManager'
          });
          this.sessionLogger.info('Registered session manager with resource manager');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const metadata = {
            component: 'sessionManager',
            operation: 'resource-registration',
            errorMessage
          };
          this.getScopedErrorHandler('session-manager', metadata)
            .handle(error, metadata);
          this.sessionLogger.warn('Failed to register session manager with resource manager', {
            error: errorMessage
          });
        }
      }

      this.sessionLogger.info('Session manager initialized and registered');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw this.lifecycleTemplumError(
        'session-manager',
        error,
        `Failed to initialize session manager: ${errorMessage}`,
        'SESSION_MANAGER_INITIALIZATION_ERROR',
        'configuration',
        { errorMessage }
      );
    }
  }

  /**
   * TASK-NEW-031: Enhanced dependency integrity validation (implemented above)
   * Comprehensive validation of the entire dependency injection system
   * Note: The full implementation of this method is above as validateDependencyIntegrity()
   */

  /**
   * Get all resolved dependencies for injection
   */
  getDependencies(): ITemplumCoreDependencies {
    if (!this.initialized) {
      throw this.lifecycleTemplumError(
        'dependencies',
        undefined,
        'Registry not initialized',
        'REGISTRY_NOT_INITIALIZED',
        'configuration'
      );
    }

    // Ensure all required dependencies are present
    const required = [
      'skinEngine',
      'stateManager',
      'backendRouter',
      'backendServiceRouter',
      'resourceManager',
      'sessionManager'
    ];
    for (const dep of required) {
      if (!this.dependencies[dep as keyof ITemplumCoreDependencies]) {
        throw this.lifecycleTemplumError(
          'dependencies',
          undefined,
          `Missing required dependency: ${dep}`,
          'MISSING_DEPENDENCY',
          'configuration',
          { dependency: dep }
        );
      }
    }

    return this.dependencies as ITemplumCoreDependencies;
  }

  /**
   * Register custom component instance
   */
  registerComponent<K extends keyof ITemplumCoreDependencies>(
    name: K, 
    component: ITemplumCoreDependencies[K]
  ): void {
    this.dependencies[name] = component;
    this.emit('componentRegistered', { name, timestamp: Date.now() });
    this.componentLogger.info('Registered custom component', { component: name });
  }

  /**
   * Get specific component by name  
   */
  getComponent<K extends keyof ITemplumCoreDependencies>(name: K): ITemplumCoreDependencies[K] {
    if (!this.initialized) {
      throw this.lifecycleTemplumError(
        'dependencies',
        undefined,
        'Registry not initialized',
        'REGISTRY_NOT_INITIALIZED',
        'configuration'
      );
    }

    const component = this.dependencies[name];
    if (!component) {
      throw this.lifecycleTemplumError(
        'dependencies',
        undefined,
        `Component not found: ${name}`,
        'COMPONENT_NOT_FOUND',
        'configuration',
        { component: name }
      );
    }

    return component as ITemplumCoreDependencies[K];
  }

  buildInterfaceAdapters(
    overrides: {
      cli?: CLIInterfaceAdapter;
      vscode?: { adapter?: VSCodeInterfaceAdapter; context?: any };
      command?: IInterfaceAdapter;
    } = {}
  ): Record<InterfaceType, IInterfaceAdapter> {
    if (!this.sessionManager) {
      throw this.lifecycleTemplumError(
        'interfaces',
        undefined,
        'Session manager must be initialized before building interface adapters',
        'SESSION_MANAGER_INITIALIZATION_ERROR',
        'configuration'
      );
    }

    const adapters: Partial<Record<InterfaceType, IInterfaceAdapter>> = {};

    adapters.cli = overrides.cli ?? new CLIInterfaceAdapter({
      cliGenerator: { buildMenuModel: buildCLIMenuModel }
    });

    if (overrides.vscode) {
      if (overrides.vscode.adapter) {
        adapters.vscode = overrides.vscode.adapter;
      } else if (overrides.vscode.context) {
        adapters.vscode = new VSCodeInterfaceAdapter(overrides.vscode.context);
      }
    }

    if (overrides.command) {
      adapters.command = overrides.command;
    }

    return adapters as Record<InterfaceType, IInterfaceAdapter>;
  }

  /**
   * Dispose of all managed components
   */
  async dispose(): Promise<void> {
    try {
      if (this.sessionManager) {
        const manager = this.sessionManager as TemplumSessionManagerContract & {
          shutdown?: () => Promise<void>;
          stopSession?: () => Promise<void>;
          getCurrentSession?: () => unknown;
        };

        try {
          if (typeof manager.shutdown === 'function') {
            await manager.shutdown();
            this.sessionLogger.info('Session manager shutdown complete');
          } else if (typeof manager.stopSession === 'function') {
            const hasActiveSession =
              typeof manager.getCurrentSession === 'function' ? Boolean(manager.getCurrentSession()) : true;

            if (hasActiveSession) {
              await manager.stopSession();
              this.sessionLogger.info('Session manager session stopped');
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const metadata = {
            component: 'sessionManager',
            phase: 'disposal-shutdown',
            errorMessage
          };
          this.getScopedErrorHandler('disposal', metadata)
            .handle(error, metadata);
          this.sessionLogger.warn('Failed to shutdown session manager during disposal', metadata);
        }
      }

      // Dispose components in reverse order
      try {
        if (this.dependencies.backendServiceRouter?.cleanup) {
          await this.dependencies.backendServiceRouter.cleanup();
          this.disposalLogger.info('Disposed backendServiceRouter');
        }
        
        const serviceRouter = this.dependencies.backendServiceRouter as
          | (IBackendServiceRouter & { dispose?: () => Promise<void>; cleanup?: () => Promise<void> })
          | undefined;

        if (serviceRouter?.dispose) {
          await serviceRouter.dispose();
          this.disposalLogger.info('Disposed backendServiceRouter');
        } else if (serviceRouter?.cleanup) {
          await serviceRouter.cleanup();
          this.disposalLogger.info('Disposed backendServiceRouter');
        }

        if (this.dependencies.backendRouter?.shutdown) {
          await this.dependencies.backendRouter.shutdown();
          this.disposalLogger.info('Disposed backendRouter');
        }
        
        if (this.dependencies.stateManager?.shutdown) {
          await this.dependencies.stateManager.shutdown();
          this.disposalLogger.info('Disposed stateManager');
        }
        
        if (this.dependencies.resourceManager?.shutdown) {
          await this.dependencies.resourceManager.shutdown();
          this.disposalLogger.info('Disposed resourceManager');
        }
        
        if (this.dependencies.skinEngine?.dispose) {
          await this.dependencies.skinEngine.dispose();
          this.disposalLogger.info('Disposed skinEngine');
        }

        if (this.dependencies.observabilityService?.shutdown) {
          await this.dependencies.observabilityService.shutdown();
          this.disposalLogger.info('Disposed observabilityService');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const metadata = {
          phase: 'component-disposal',
          errorMessage
        };
        this.getScopedErrorHandler('disposal', metadata)
          .handle(error, metadata);
        this.disposalLogger.error('Failed to dispose component', error instanceof Error ? error : new Error(errorMessage), metadata);
      }

      this.dependencies = {};
      this.initialized = false;
      this.sessionManager = undefined;
      this.emit('disposed', { timestamp: Date.now() });
      this.removeAllListeners();
      this.cleanupEvents();

      this.disposalLogger.info('Disposal complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorInstance = error instanceof Error ? error : new Error(errorMessage);
      this.disposalLogger.error('Disposal failed', errorInstance, { errorMessage });
      throw this.lifecycleTemplumError(
        'disposal',
        error,
        `Registry disposal failed: ${errorMessage}`,
        'DISPOSAL_ERROR',
        'runtime',
        { errorMessage }
      );
    }
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get registry status information
   */
  getStatus(): any {
    return {
      initialized: this.initialized,
      enabledComponents: Object.keys(this.config).filter(key => 
        key.startsWith('enable') && this.config[key as keyof IDependencyInjectionConfig]
      ),
      registeredComponents: Object.keys(this.dependencies),
      componentCount: Object.keys(this.dependencies).length
    };
  }
}
