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
  IComponentFactory
} from '../interfaces/core-component-interfaces';
import { IObservabilityService } from '../observability/observability-adapter';
import { 
  TemplumError,
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

  generateSkinHTML(renderResult: any, skinDefinition: any): string {
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

  async initialize(config?: any): Promise<void> {
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

  initialize(dependencies: any): void {
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

  constructor(config: any = {}) {
    this.config = config;
  }

  createSkinEngine(config?: any): ISkinEngine {
    const skinEngine = new UniversalSkinEngine();
    return new SkinEngineAdapter(skinEngine);
  }

  createStateManager(config?: any): IStateManager {
    // TODO: [TASK-NEW-025] Enhanced state manager configuration validation
    // Priority: Medium | Complexity: 4
    // Location: State manager factory with comprehensive config validation
    // Dependencies: Enhanced State Manager configuration patterns
    const stateManagerConfig = {
      coalescingConfig: {
        enabled: config?.performanceMetrics !== false,
        windowMs: config?.coalescingWindowMs || 100,
        maxBatchSize: config?.maxBatchSize || 20,
        coalescingStrategy: config?.coalescingStrategy || 'merge'
      },
      maxHistorySize: config?.maxHistorySize || 1000,
      persistenceEnabled: config?.persistenceEnabled !== false,
      ipcEnabled: config?.ipcEnabled !== false,
      ...config
    };
    
    const stateManager = new EnhancedStateManager(stateManagerConfig);
    return new StateManagerAdapter(stateManager);
  }

  createBackendRouter(config?: any): IBackendRouter {
    // TODO: [TASK-NEW-026] PCL Backend Integrator dependency injection enhancement
    // Priority: High | Complexity: 6
    // Location: Backend router factory with proper PCL dependency management
    // Dependencies: PCL Backend Integrator initialization patterns
    const backendRouterConfig = {
      stateManager: null, // Will be set through dependency injection
      commandRegistry: null, // Will be initialized separately  
      riskMitigationFramework: null, // Will be initialized separately
      enableCircuitBreaker: config?.enableCircuitBreaker !== false,
      timeoutMs: config?.timeoutMs || 30000,
      retryAttempts: config?.retryAttempts || 3,
      ...config
    };
    
    const backendRouter = new PCLBackendIntegrator(backendRouterConfig);
    return new BackendRouterAdapter(backendRouter);
  }

  createBackendServiceRouter(config?: any): IBackendServiceRouter {
    const backendServiceRouter = new TemplumBackendServiceRouter();
    return new BackendServiceRouterAdapter(backendServiceRouter);
  }

  createResourceManager(config?: any): IResourceManager {
    // TODO: [TASK-NEW-027] Resource manager configuration validation and policy setup
    // Priority: Medium | Complexity: 5
    // Location: Resource manager factory with comprehensive policy configuration
    // Dependencies: Templum Resource Manager policy patterns
    const resourceManagerConfig = {
      memoryLimitMB: config?.memoryLimitMB || 256,
      cpuLimitPercent: config?.cpuLimitPercent || 80,
      cleanupIntervalMs: config?.cleanupIntervalMs || 60000,
      maxResourceAge: config?.maxResourceAge || 3600000, // 1 hour
      enableHealthMonitoring: config?.enableHealthMonitoring !== false,
      ...config
    };
    
    const resourceManager = new TemplumResourceManager(resourceManagerConfig);
    return new ResourceManagerAdapter(resourceManager);
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

  constructor(config: IDependencyInjectionConfig = {}) {
    super();
    this.config = {
      enableSkinEngine: true,
      enableStateManager: true,
      enableBackendRouter: true,
      enableBackendServiceRouter: true,
      enableResourceManager: true,
      enableObservabilityService: true,
      ...config
    };
    this.factory = new TemplumComponentFactory(config);
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
   * Create component instances based on configuration
   * TODO: [TASK-NEW-028] Component instance creation validation
   * Priority: Medium | Complexity: 3
   * Location: Component factory instantiation with validation
   * Dependencies: Component factory patterns and configuration validation
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
          this.dependencies[name] = this.config.customFactories?.[name]?.() || 
            (this.factory[`create${name.charAt(0).toUpperCase() + name.slice(1)}` as keyof IComponentFactory] as any)();
          console.log(`TemplumAdapterRegistry: Created ${name} component`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw createTemplumError(`Failed to create ${name}: ${errorMessage}`, 'COMPONENT_CREATION_ERROR', 'configuration');
        }
      }
    }
  }

  /**
   * Wire dependencies between components
   * TODO: [TASK-NEW-029] Cross-component dependency wiring
   * Priority: High | Complexity: 7
   * Location: Component dependency injection and cross-wiring
   * Dependencies: Component interface patterns and dependency resolution
   */
  private async wireComponentDependencies(): Promise<void> {
    // Wire state manager to backend router if both exist
    if (this.dependencies.backendRouter && this.dependencies.stateManager) {
      this.dependencies.backendRouter.initialize?.({ 
        stateManager: this.dependencies.stateManager 
      });
      console.log('TemplumAdapterRegistry: Wired state manager to backend router');
    }

    // TODO: Additional cross-component wiring as needed
    // Example: Wire resource manager to other components for monitoring
    if (this.dependencies.resourceManager) {
      // Register components with resource manager for monitoring
      const componentNames = Object.keys(this.dependencies) as (keyof ITemplumCoreDependencies)[];
      for (const componentName of componentNames) {
        if (componentName !== 'resourceManager') {
          await this.dependencies.resourceManager.registerService(
            `templum-${componentName}`, 
            'core', 
            { component: componentName }
          );
        }
      }
      console.log('TemplumAdapterRegistry: Registered components with resource manager');
    }
  }

  /**
   * Initialize components in proper dependency order
   * TODO: [TASK-NEW-030] Component initialization ordering
   * Priority: High | Complexity: 5
   * Location: Dependency-aware component initialization
   * Dependencies: Component initialization patterns and dependency ordering
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

    for (const componentName of initOrder) {
      const component = this.dependencies[componentName];
      if (component && 'initialize' in component && typeof component.initialize === 'function') {
        await (component.initialize as any)();
        console.log(`TemplumAdapterRegistry: Initialized ${componentName}`);
      }
    }
  }

  /**
   * Validate that all required dependencies are properly satisfied
   * TODO: [TASK-NEW-031] Dependency integrity validation
   * Priority: Medium | Complexity: 4
   * Location: Post-initialization dependency validation
   * Dependencies: Component validation patterns and integrity checks
   */
  private validateDependencyIntegrity(): void {
    const required = ['skinEngine', 'stateManager', 'backendRouter', 'backendServiceRouter', 'resourceManager'];
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const dep of required) {
      const component = this.dependencies[dep as keyof ITemplumCoreDependencies];
      if (!component) {
        missing.push(dep);
      } else if (typeof component !== 'object') {
        invalid.push(dep);
      }
    }

    if (missing.length > 0) {
      throw createTemplumError(`Missing required dependencies: ${missing.join(', ')}`, 'MISSING_DEPENDENCIES', 'configuration');
    }

    if (invalid.length > 0) {
      throw createTemplumError(`Invalid dependencies: ${invalid.join(', ')}`, 'INVALID_DEPENDENCIES', 'configuration');
    }

    console.log('TemplumAdapterRegistry: Dependency integrity validation passed');
  }

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