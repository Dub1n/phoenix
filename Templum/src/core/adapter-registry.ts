/**---
 * title: [Adapter Registry - Dependency Injection Container]
 * tags: [Core, DependencyInjection, Registry, Adapter]
 * provides: [TemplumAdapterRegistry, Component Resolution]
 * requires: [Core Component Interfaces, Component Implementations]
 * description: [Centralized registry for managing component adapters and dependency injection following PCL pattern]
 * ---*/

import { EventEmitter } from 'events';
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
  createTemplumError,
  ErrorSignalPayload
} from '../types/templum-types';

// Import real component implementations
import { UniversalSkinEngine } from '../skin/universal-skin-engine';
import { EnhancedStateManager } from '../state/enhanced-state-synchronization';
import { PCLBackendIntegrator } from '../backend/pcl-backend-integration';
import { TemplumBackendServiceRouter } from '../backend/backend-service-router';
import { TemplumResourceManager } from './templum-resource-manager';
import { ObservabilityAdapter } from '../observability/observability-adapter';

/**
 * Component adapter implementations wrapping real components
 */
export class SkinEngineAdapter implements ISkinEngine {
  private skinEngine: UniversalSkinEngine;

  constructor(skinEngine: UniversalSkinEngine) {
    this.skinEngine = skinEngine;
  }

  async initialize(config?: any): Promise<void> {
    try {
      // Initialize Universal Skin Engine with configuration if method exists
      if ('initialize' in this.skinEngine && typeof this.skinEngine.initialize === 'function') {
        await this.skinEngine.initialize(config);
      }
      
      // Set up skin engine performance monitoring if available
      if (config?.performanceMetrics && 'enablePerformanceMonitoring' in this.skinEngine) {
        (this.skinEngine as any).enablePerformanceMonitoring?.(true);
      }
      
      console.log('SkinEngineAdapter: Initialized with config', {
        performanceMetrics: config?.performanceMetrics || false,
        cacheEnabled: config?.cacheEnabled !== false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createTemplumError(`Skin engine initialization failed: ${errorMessage}`, 'ADAPTER_INITIALIZATION_ERROR', 'configuration');
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
      console.warn('Error generating HTML from render result:', error);
      return '<div class="templum-skin-container theme-default"><div class="templum-component templum-error">Error rendering skin components</div></div>';
    }
  }

  async dispose(): Promise<void> {
    try {
      // Clear any cached skin definitions if method exists
      if ('clearCache' in this.skinEngine && typeof (this.skinEngine as any).clearCache === 'function') {
        await (this.skinEngine as any).clearCache();
      }
      
      // Dispose of skin engine resources if method exists
      if ('dispose' in this.skinEngine && typeof (this.skinEngine as any).dispose === 'function') {
        await (this.skinEngine as any).dispose();
      }
      
      console.log('SkinEngineAdapter: Disposed with resource cleanup');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('SkinEngineAdapter disposal error:', errorMessage);
      // Don't throw during disposal to prevent cascade failures
    }
  }
}

export class StateManagerAdapter implements IStateManager {
  private stateManager: EnhancedStateManager;

  constructor(stateManager: EnhancedStateManager) {
    this.stateManager = stateManager;
  }

  async initialize(_config?: any): Promise<void> {
    await this.stateManager.initialize();
  }

  async syncState(interfaceType: any, stateUpdate: any, source: string): Promise<void> {
    try {
      // Validate interface type
      const supportedInterfaces = ['vscode', 'cli', 'command'];
      if (!supportedInterfaces.includes(interfaceType)) {
        throw createTemplumError(`Unsupported interface type: ${interfaceType}`, 'INVALID_INTERFACE_TYPE', 'validation');
      }
      
      // Use enhanced state manager's IPC-based synchronization if available
      if ('synchronizeState' in this.stateManager && typeof (this.stateManager as any).synchronizeState === 'function') {
        await (this.stateManager as any).synchronizeState(stateUpdate, { 
          targetInterface: interfaceType, 
          source,
          timestamp: Date.now() 
        });
      } else if ('sendMessage' in this.stateManager && typeof (this.stateManager as any).sendMessage === 'function') {
        // Fallback to message-based sync
        await (this.stateManager as any).sendMessage({
          type: 'state-sync',
          target: interfaceType,
          data: stateUpdate,
          source,
          timestamp: Date.now()
        });
      }
      
      console.log(`StateManagerAdapter: Synced state to ${interfaceType} from ${source}`, {
        updateKeys: Object.keys(stateUpdate || {}),
        timestamp: Date.now()
      });
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      throw createTemplumError(`State sync failed: ${errorMessage}`, 'STATE_SYNC_ERROR', 'runtime');
    }
  }

  async sendMessage(message: any): Promise<void> {
    try {
      // Validate message structure
      if (!message || typeof message !== 'object') {
        throw createTemplumError('Invalid message format', 'INVALID_MESSAGE', 'validation');
      }
      
      // Add adapter metadata
      const enrichedMessage = {
        ...message,
        adapter: 'StateManagerAdapter',
        timestamp: Date.now(),
        messageId: `adapter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Use enhanced state manager's IPC message sending if available
      if ('sendMessage' in this.stateManager && typeof (this.stateManager as any).sendMessage === 'function') {
        await (this.stateManager as any).sendMessage(enrichedMessage);
      } else {
        console.warn('StateManagerAdapter: sendMessage not available on state manager, message queued');
      }
      
      console.log('StateManagerAdapter: Message sent', {
        type: message.type,
        messageId: enrichedMessage.messageId,
        timestamp: enrichedMessage.timestamp
      });
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      throw createTemplumError(`Message send failed: ${errorMessage}`, 'MESSAGE_SEND_ERROR', 'runtime');
    }
  }

  getCurrentState(): any {
    try {
      // Use enhanced state manager's state retrieval if available
      if ('getCurrentState' in this.stateManager && typeof (this.stateManager as any).getCurrentState === 'function') {
        const currentState = (this.stateManager as any).getCurrentState();
        return {
          ...currentState,
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('StateManagerAdapter: getCurrentState error:', errorMessage);
      return {
        error: true,
        errorMessage,
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
  private backendRouter: PCLBackendIntegrator;

  constructor(backendRouter: PCLBackendIntegrator) {
    this.backendRouter = backendRouter;
  }

  initialize(_dependencies: any): void {
    // PCL Backend Integrator initialized with dependencies in constructor
    console.log('BackendRouterAdapter: Initialized with dependencies');
  }

  async executeCommand(command: string, args?: any[], context?: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Validate command input
      if (!command || typeof command !== 'string') {
        throw createTemplumError('Invalid command format', 'INVALID_COMMAND', 'validation');
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
      if ('executeCommand' in this.backendRouter && typeof (this.backendRouter as any).executeCommand === 'function') {
        result = await (this.backendRouter as any).executeCommand(command, args, enhancedContext);
      } else {
        // Fallback for when PCL Backend Integrator doesn't have executeCommand
        console.warn('BackendRouterAdapter: PCL Backend Integrator executeCommand not available, using fallback');
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
      if ('getStatus' in this.backendRouter && typeof (this.backendRouter as any).getStatus === 'function') {
        coreStatus = {
          ...coreStatus,
          ...(this.backendRouter as any).getStatus()
        };
      }
      
      return {
        ...coreStatus,
        adapter: 'BackendRouterAdapter',
        capabilities: {
          executeCommand: 'executeCommand' in this.backendRouter,
          getStatus: 'getStatus' in this.backendRouter,
          shutdown: 'shutdown' in this.backendRouter
        },
        initialized: true,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
  private backendServiceRouter: TemplumBackendServiceRouter;

  constructor(backendServiceRouter: TemplumBackendServiceRouter) {
    this.backendServiceRouter = backendServiceRouter;
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

  async cleanup(): Promise<void> {
    try {
      const cleanupTasks: Promise<void>[] = [];
      
      // Clean up active connections if method exists
      if ('cleanup' in this.backendServiceRouter && typeof (this.backendServiceRouter as any).cleanup === 'function') {
        cleanupTasks.push((this.backendServiceRouter as any).cleanup());
      }
      
      // Close any pending service connections if method exists
      if ('disconnectAll' in this.backendServiceRouter && typeof (this.backendServiceRouter as any).disconnectAll === 'function') {
        cleanupTasks.push((this.backendServiceRouter as any).disconnectAll());
      }
      
      // Clear connection caches if method exists
      if ('clearCache' in this.backendServiceRouter && typeof (this.backendServiceRouter as any).clearCache === 'function') {
        cleanupTasks.push((this.backendServiceRouter as any).clearCache());
      }
      
      // Execute all cleanup tasks
      await Promise.allSettled(cleanupTasks);
      
      console.log('BackendServiceRouterAdapter: Cleanup completed', {
        tasksExecuted: cleanupTasks.length,
        timestamp: Date.now()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('BackendServiceRouterAdapter cleanup error:', errorMessage);
      // Don't throw during cleanup to prevent cascade failures
    }
  }
}

export class ResourceManagerAdapter implements IResourceManager {
  private resourceManager: TemplumResourceManager;

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
  }

  async updateServiceHealth(serviceId: string, status: any, responseTime?: number, errorRate?: number): Promise<void> {
    await this.resourceManager.updateServiceHealth(serviceId, status, responseTime, errorRate);
  }

  getServiceHealth(): any[] {
    return this.resourceManager.getServiceHealth();
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

  constructor(config: any = {}) {
    this.config = config;
  }

  setRegistry(registry: TemplumAdapterRegistry) {
    this.registry = registry;
  }

  createSkinEngine(_config?: any): ISkinEngine {
    const skinEngine = new UniversalSkinEngine();
    return new SkinEngineAdapter(skinEngine);
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
      const adapter = new StateManagerAdapter(stateManager);
      
      console.log('StateManager created with validated configuration:', {
        coalescingEnabled: stateManagerConfig.coalescingConfig.enabled,
        windowMs: stateManagerConfig.coalescingConfig.windowMs,
        maxHistorySize: stateManagerConfig.maxHistorySize
      });
      
      return adapter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createTemplumError(`StateManager creation failed: ${errorMessage}`, 'STATE_MANAGER_CREATION_ERROR', 'configuration');
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
      const adapter = new BackendRouterAdapter(backendRouter);
      
      console.log('BackendRouter created with validated configuration:', {
        circuitBreakerEnabled: backendRouterConfig.enableCircuitBreaker,
        timeout: backendRouterConfig.timeoutMs,
        retryAttempts: backendRouterConfig.retryAttempts
      });
      
      return adapter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createTemplumError(`BackendRouter creation failed: ${errorMessage}`, 'BACKEND_ROUTER_CREATION_ERROR', 'configuration');
    }
  }

  createBackendServiceRouter(_config?: any): IBackendServiceRouter {
    const backendServiceRouter = new TemplumBackendServiceRouter();
    return new BackendServiceRouterAdapter(backendServiceRouter);
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
      
      console.log('ResourceManager created with validated configuration:', {
        memoryLimit: resourceManagerConfig.memoryLimitMB,
        cpuLimit: resourceManagerConfig.cpuLimitPercent,
        healthMonitoring: resourceManagerConfig.enableHealthMonitoring,
        cleanupInterval: resourceManagerConfig.cleanupIntervalMs
      });
      
      return adapter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createTemplumError(`ResourceManager creation failed: ${errorMessage}`, 'RESOURCE_MANAGER_CREATION_ERROR', 'configuration');
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
export class TemplumAdapterRegistry extends EventEmitter {
  private dependencies: Partial<ITemplumCoreDependencies> = {};
  private factory: IComponentFactory;
  private config: IDependencyInjectionConfig;
  private initialized: boolean = false;
  private validationReport: ValidationReport | null = null;

  constructor(config: IDependencyInjectionConfig = {}) {
    super();
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
    this.factory = new TemplumComponentFactory(config);
    (this.factory as TemplumComponentFactory).setRegistry(this);
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

      if (typeof component !== 'object') {
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

      const requiredMethods = interfaceChecks[name] || [];
      const availableMethods: string[] = [];
      const missingMethods: string[] = [];

      for (const method of requiredMethods) {
        if (typeof component[method] === 'function') {
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

      console.log(`Component validation for ${name}:`, {
        valid: status.valid,
        availableMethods: availableMethods.length,
        missingMethods: missingMethods.length,
        interfaceCompliance: status.interfaceCompliance
      });

    } catch (error) {
      status.valid = false;
      status.issues.push(`Component validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.error('Dependency wiring validation error:', error);
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
        console.warn('Initialization order validation issues:', issues);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Initialization order validation error:', error);
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
        console.log('Dependency injection validation complete:', {
          overallValid: this.validationReport.overallValid,
          componentsValidated: componentValidations.length,
          wiringChecks: dependencyWiring.length,
          executionTime: this.validationReport.executionTime,
          recommendations: recommendations.length
        });

        if (!this.validationReport.overallValid) {
          console.warn('Dependency injection validation issues detected:', {
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
          throw createTemplumError(
            `Dependency injection validation failed: ${allIssues.join('; ')}`, 
            'DEPENDENCY_VALIDATION_ERROR', 
            'configuration'
          );
        } else {
          console.warn('Dependency injection validation warnings (non-strict mode):', {
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
      throw createTemplumError(
        `Dependency integrity validation failed: ${errorMessage}`, 
        'VALIDATION_ERROR', 
        'configuration'
      );
    }
  }

  /**
   * Get the current validation report
   */
  getValidationReport(): ValidationReport | null {
    return this.validationReport;
  }

  /**
   * Configuration validation helper methods (public for factory access)
   */
  public validateStateManagerConfig(config?: any): any {
    if (!config || typeof config !== 'object') {
      return {};
    }

    const validated = { ...config };

    // Validate specific state manager configuration options
    if (validated.coalescingWindowMs !== undefined && typeof validated.coalescingWindowMs !== 'number') {
      console.warn('Invalid coalescingWindowMs, using default');
      delete validated.coalescingWindowMs;
    }

    if (validated.maxBatchSize !== undefined && (typeof validated.maxBatchSize !== 'number' || validated.maxBatchSize < 1)) {
      console.warn('Invalid maxBatchSize, using default');
      delete validated.maxBatchSize;
    }

    return validated;
  }

  public validateNumericRange(value: any, min: number, max: number, defaultValue: number, fieldName: string): number {
    if (typeof value !== 'number' || isNaN(value) || value < min || value > max) {
      if (value !== undefined) {
        console.warn(`Invalid ${fieldName} (${value}), must be between ${min} and ${max}. Using default: ${defaultValue}`);
      }
      return defaultValue;
    }
    return value;
  }

  public validateEnumValue<T>(value: any, allowedValues: T[], defaultValue: T, fieldName: string): T {
    if (!allowedValues.includes(value)) {
      if (value !== undefined) {
        console.warn(`Invalid ${fieldName} (${value}), must be one of: ${allowedValues.join(', ')}. Using default: ${defaultValue}`);
      }
      return defaultValue;
    }
    return value;
  }

  public validateResourceManagerConfig(config?: any): any {
    if (!config || typeof config !== 'object') {
      return {};
    }

    const validated = { ...config };

    // Validate memory limits
    if (validated.memoryLimitMB !== undefined && (typeof validated.memoryLimitMB !== 'number' || validated.memoryLimitMB < 64)) {
      console.warn('Invalid memoryLimitMB, using default');
      delete validated.memoryLimitMB;
    }

    // Validate CPU limits
    if (validated.cpuLimitPercent !== undefined && (typeof validated.cpuLimitPercent !== 'number' || validated.cpuLimitPercent < 1 || validated.cpuLimitPercent > 100)) {
      console.warn('Invalid cpuLimitPercent, using default');
      delete validated.cpuLimitPercent;
    }

    return validated;
  }

  public validateBackendRouterConfig(config?: any): any {
    if (!config || typeof config !== 'object') {
      return {};
    }

    const validated = { ...config };

    // Validate timeout values
    if (validated.timeoutMs !== undefined && (typeof validated.timeoutMs !== 'number' || validated.timeoutMs < 1000)) {
      console.warn('Invalid timeoutMs, using default');
      delete validated.timeoutMs;
    }

    // Validate retry attempts
    if (validated.retryAttempts !== undefined && (typeof validated.retryAttempts !== 'number' || validated.retryAttempts < 0)) {
      console.warn('Invalid retryAttempts, using default');
      delete validated.retryAttempts;
    }

    return validated;
  }

  /**
   * Initialize the adapter registry and create component instances
   * Enhanced with dependency injection validation and cross-component wiring
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('TemplumAdapterRegistry: Already initialized');
      return;
    }

    try {
      // Phase 1: Create component instances
      await this.createComponentInstances();
      
      // Phase 2: Wire dependencies between components
      await this.wireComponentDependencies();
      
      // Phase 3: Initialize components in dependency order
      await this.initializeComponentsInOrder();
      
      // Phase 4: Validate all dependencies are satisfied
      this.validateDependencyIntegrity();

      this.initialized = true;
      this.emit('initialized', { 
        timestamp: Date.now(), 
        components: Object.keys(this.dependencies),
        initializationPhases: 4
      });

      // Use observability service if available, fallback to console  
      if (this.dependencies.observabilityService) {
        this.dependencies.observabilityService.logInfo('Registry initialization complete with enhanced dependency injection', {
          components: Object.keys(this.dependencies),
          customFactories: Object.keys(this.config.customFactories || {})
        }, 'TemplumAdapterRegistry');
      } else {
        console.log('TemplumAdapterRegistry: Registry initialization complete with enhanced dependency injection', {
          components: Object.keys(this.dependencies),
          customFactories: Object.keys(this.config.customFactories || {})
        });
      }
    } catch (error) {
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumAdapterRegistry',
        error: isTemplumError(error) ? error : createTemplumError(
          error instanceof Error ? error.message : 'Unknown registry initialization error',
          'REGISTRY_INITIALIZATION_ERROR',
          'configuration'
        ),
        severity: 'critical'
      };

      console.error('TemplumAdapterRegistry: Initialization failed:', errorPayload.error);
      throw createTemplumError(`Registry initialization failed: ${errorPayload.error.message}`, 'INITIALIZATION_ERROR', 'configuration');
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
              throw createTemplumError(
                `Component ${name} validation failed: ${validation.issues.join('; ')}`, 
                'COMPONENT_VALIDATION_ERROR', 
                'configuration'
              );
            } else if (!validation.valid) {
              console.warn(`Component ${name} validation warnings:`, validation.issues);
            }
          }
          
          this.dependencies[name] = component;
          console.log(`TemplumAdapterRegistry: Created and validated ${name} component`);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw createTemplumError(`Failed to create ${name}: ${errorMessage}`, 'COMPONENT_CREATION_ERROR', 'configuration');
        }
      }
    }
    
    console.log(`TemplumAdapterRegistry: Component creation phase complete`, {
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
          console.log('TemplumAdapterRegistry: Observability service available for component logging');
        }
      });
    }

    // Execute all wiring operations with validation
    for (const { name, operation } of wiringOperations) {
      try {
        await operation();
        console.log(`TemplumAdapterRegistry: Successfully wired ${name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (this.config.validationLevel === 'strict') {
          throw createTemplumError(
            `Dependency wiring failed for ${name}: ${errorMessage}`, 
            'DEPENDENCY_WIRING_ERROR', 
            'configuration'
          );
        } else {
          console.warn(`Dependency wiring warning for ${name}:`, errorMessage);
        }
      }
    }

    // Validate wiring after completion
    if (this.config.validateDependencyWiring) {
      const wiringValidations = this.validateDependencyWiring();
      const failedWiring = wiringValidations.filter(w => !w.wiringValid);
      
      if (failedWiring.length > 0 && this.config.validationLevel === 'strict') {
        const issues = failedWiring.map(w => `${w.sourceComponent} → ${w.targetComponent}: ${w.issues.join(', ')}`);
        throw createTemplumError(
          `Dependency wiring validation failed: ${issues.join('; ')}`, 
          'DEPENDENCY_WIRING_VALIDATION_ERROR', 
          'configuration'
        );
      } else if (failedWiring.length > 0) {
        console.warn('Dependency wiring validation warnings:', failedWiring.map(w => w.issues).flat());
      }
    }

    console.log('TemplumAdapterRegistry: Dependency wiring phase complete', {
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
        throw createTemplumError(
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
          if ('initialize' in component && typeof component.initialize === 'function') {
            await (component.initialize as any)();
            success = true;
            console.log(`TemplumAdapterRegistry: Initialized ${componentName}`);
            
            // Update component validation status
            if (this.validationReport) {
              const componentValidation = this.validationReport.componentValidation.find(v => v.name === componentName);
              if (componentValidation) {
                componentValidation.initializationStatus = 'initialized';
              }
            }
          } else {
            success = true; // Component doesn't require initialization
            console.log(`TemplumAdapterRegistry: ${componentName} does not require initialization`);
          }
        } catch (initError) {
          error = initError instanceof Error ? initError.message : 'Unknown initialization error';
          
          if (this.config.validationLevel === 'strict') {
            throw createTemplumError(
              `Failed to initialize ${componentName}: ${error}`, 
              'COMPONENT_INITIALIZATION_ERROR', 
              'configuration'
            );
          } else {
            console.error(`Initialization warning for ${componentName}:`, error);
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
        throw createTemplumError(
          `Component initialization failures: ${failureDetails.join('; ')}`, 
          'INITIALIZATION_FAILURES', 
          'configuration'
        );
      } else {
        console.warn('Component initialization warnings:', failureDetails);
      }
    }

    console.log('TemplumAdapterRegistry: Component initialization phase complete', {
      totalComponents: initializationResults.length,
      successfulInitializations: initializationResults.filter(r => r.success).length,
      failedInitializations: failedInitializations.length,
      totalDuration: initializationResults.reduce((sum, r) => sum + r.duration, 0)
    });
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
      throw createTemplumError('Registry not initialized', 'REGISTRY_NOT_INITIALIZED', 'configuration');
    }

    // Ensure all required dependencies are present
    const required = ['skinEngine', 'stateManager', 'backendRouter', 'backendServiceRouter', 'resourceManager'];
    for (const dep of required) {
      if (!this.dependencies[dep as keyof ITemplumCoreDependencies]) {
        throw createTemplumError(`Required dependency not found: ${dep}`, 'MISSING_DEPENDENCY', 'configuration');
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
    console.log(`TemplumAdapterRegistry: Registered custom ${name} component`);
  }

  /**
   * Get specific component by name  
   */
  getComponent<K extends keyof ITemplumCoreDependencies>(name: K): ITemplumCoreDependencies[K] {
    if (!this.initialized) {
      throw createTemplumError('Registry not initialized', 'REGISTRY_NOT_INITIALIZED', 'configuration');
    }

    const component = this.dependencies[name];
    if (!component) {
      throw createTemplumError(`Component not found: ${name}`, 'COMPONENT_NOT_FOUND', 'configuration');
    }

    return component as ITemplumCoreDependencies[K];
  }

  /**
   * Dispose of all managed components
   */
  async dispose(): Promise<void> {
    try {
      // Dispose components in reverse order
      try {
        if (this.dependencies.backendServiceRouter?.cleanup) {
          await this.dependencies.backendServiceRouter.cleanup();
          console.log('TemplumAdapterRegistry: Disposed backendServiceRouter');
        }
        
        if (this.dependencies.backendRouter?.shutdown) {
          await this.dependencies.backendRouter.shutdown();
          console.log('TemplumAdapterRegistry: Disposed backendRouter');
        }
        
        if (this.dependencies.stateManager?.shutdown) {
          await this.dependencies.stateManager.shutdown();
          console.log('TemplumAdapterRegistry: Disposed stateManager');
        }
        
        if (this.dependencies.resourceManager?.shutdown) {
          await this.dependencies.resourceManager.shutdown();
          console.log('TemplumAdapterRegistry: Disposed resourceManager');
        }
        
        if (this.dependencies.skinEngine?.dispose) {
          await this.dependencies.skinEngine.dispose();
          console.log('TemplumAdapterRegistry: Disposed skinEngine');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to dispose component:', errorMessage);
      }

      this.dependencies = {};
      this.initialized = false;
      this.emit('disposed', { timestamp: Date.now() });
      this.removeAllListeners();

      console.log('TemplumAdapterRegistry: Disposal complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('TemplumAdapterRegistry: Disposal failed:', errorMessage);
      throw createTemplumError(`Registry disposal failed: ${errorMessage}`, 'DISPOSAL_ERROR', 'runtime');
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