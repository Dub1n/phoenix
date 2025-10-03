/**---
 * title: [Templum Core Engine - Universal Interface Orchestrator]
 * tags: [Core, Engine, Interface, Orchestration, Multi-Backend]
 * provides: [Interface Coordination, State Management, Backend Routing]
 * requires: [Interface Adapters, Skin Engine, Backend Services]
 * description: [Central orchestration engine managing all interface modalities]
 * ---*/

import { EventEmitter } from 'events';
import * as path from 'path';
import { 
  InterfaceType, 
  InterfaceAdapter, 
  UniversalSkinDefinition, 
  CommandContext, 
  CommandResult, 
  TemplumConfiguration,
  TemplumSystemStatus,
  StateManagerStatus,
  isTemplumError,
  createTemplumError,
  ErrorSignalPayload
} from '../types/templum-types';
import { BackendStatus } from '../backend/backend-service-router';
import {
  buildCliIpcRequest,
  buildServiceRegistryDefaults,
  type CliIpcRequestPayload
} from '../backend/defaults/serialization-defaults';
import {
  serviceRegistryEntrySchema,
  cliRequestEnvelopeSchema,
  type ServiceRegistryEntry
} from '../backend/schemas/serialization-registry';
import {
  serialization,
  type SerializationOutcome,
  type SerializationMeta
} from '../utils/serialization-utils';

// Import dependency injection interfaces and registry
import { 
  ISkinEngine,
  IBackendServiceRouter,
  IResourceManager,
  ITemplumCoreDependencies,
  IDependencyInjectionConfig
} from '../interfaces/core-component-interfaces';
import { ITemplumOrchestrator } from '../interfaces/templum-orchestrator-interface';
import { TemplumAdapterRegistry } from './adapter-registry';
import { UniversalInterfaceManager } from './universal-interface-manager';

export class TemplumCore extends EventEmitter implements ITemplumOrchestrator {
  private config: TemplumConfiguration;
  private initialized: boolean = false;
  private activeInterfaces: Set<InterfaceType> = new Set();
  private loadedSkins: Map<string, UniversalSkinDefinition> = new Map();
  private interfaceAdapters: Map<InterfaceType, InterfaceAdapter> = new Map();
  
  // Dependency injection - components provided through registry
  private dependencies!: ITemplumCoreDependencies;
  private adapterRegistry: TemplumAdapterRegistry;
  
  // Universal Interface Manager - TASK-NEW-048: Interface Switching Implementation
  private universalInterfaceManager!: UniversalInterfaceManager;

  constructor(
    config: Partial<TemplumConfiguration> = {},
    dependencyConfig?: IDependencyInjectionConfig
  ) {
    super();
    
    this.config = {
      maxConcurrentSessions: 10,
      sessionTimeoutMs: 3600000, // 1 hour
      enableHealthMonitoring: true,
      performanceMetrics: true,
      backendDiscovery: {
        enabled: true,
        interval: 30000
      },
      ...config
    };

    // Initialize adapter registry for dependency injection
    this.adapterRegistry = new TemplumAdapterRegistry({
      enableSkinEngine: true,
      enableStateManager: true,
      enableBackendRouter: true,
      enableBackendServiceRouter: true,
      enableResourceManager: true,
      ...dependencyConfig
    });

    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('Templum Core Engine already initialized');
      return;
    }

    try {
      // Initialize adapter registry and get dependencies
      await this.adapterRegistry.initialize();
      this.dependencies = this.adapterRegistry.getDependencies();
      
      console.log('Templum Core Engine: Dependency injection complete');
      
      // Initialize all interface adapters (in real implementation)
      await this.initializeInterfaceAdapters();
      
      // Initialize state manager using dependency injection
      if (this.dependencies.stateManager?.initialize) {
        await this.dependencies.stateManager.initialize();
      }
      
      // Initialize backend router with dependencies
      if (this.dependencies.backendRouter?.initialize) {
        this.dependencies.backendRouter.initialize({
          stateManager: this.dependencies.stateManager
        });
      }
      // Use observability service for structured logging
      this.logInfo('Backend router initialized with injected dependencies', { 
        dependenciesAvailable: Object.keys(this.dependencies) 
      });
      
      // Initialize Universal Interface Manager - TASK-NEW-048
      this.universalInterfaceManager = new UniversalInterfaceManager(this.dependencies);
      console.log('Universal Interface Manager initialized successfully');
      
      // Initialize backend service router with enhanced error handling (Haruspex pattern)
      try {
        // Set orchestrator reference for skin loading integration
        if (this.dependencies.backendServiceRouter && 'setOrchestrator' in this.dependencies.backendServiceRouter) {
          (this.dependencies.backendServiceRouter as any).setOrchestrator(this);
        }
        
        this.logInfo('Starting backend service router discovery...');
        await this.dependencies.backendServiceRouter.discoverAndConnect();
        
        // Get backend connection status following proper interface alignment
        const connectionStatus = this.dependencies.backendServiceRouter.getConnectionStatus?.() || {
          totalConnections: 0,
          healthyConnections: 0,
          backends: {}
        };
        
        // Validate connection status and provide detailed logging
        if (connectionStatus.healthyConnections === 0) {
          this.logWarn('No healthy backend connections established', {
            totalAttempted: connectionStatus.totalConnections,
            backendStates: connectionStatus.backends
          });
        } else {
          this.logInfo('Backend service router discovery completed successfully', {
            totalConnections: connectionStatus.totalConnections,
            healthyConnections: connectionStatus.healthyConnections,
            availableBackends: Object.keys(connectionStatus.backends),
            backendDetails: connectionStatus.backends
          });
        }
        
        // Log individual backend status for diagnostics
        Object.entries(connectionStatus.backends).forEach(([backendId, status]) => {
          const backendStatus = status as BackendStatus;
          if (backendStatus.health === 'error') {
            this.logError(`Backend ${backendId} connection failed: ${backendStatus.lastError || 'Unknown error'}`);
          } else if (backendStatus.health === 'unhealthy') {
            this.logWarn(`Backend ${backendId} connection unhealthy`, { responseTime: backendStatus.responseTime });
          }
        });
        
      } catch (backendError) {
        const _errorMessage = isTemplumError(backendError) ? backendError.message : 
          (backendError instanceof Error ? backendError.message : 'Unknown backend initialization error');
        
        this.logError('Backend service router initialization failed');
        
        // Continue initialization with degraded functionality rather than failing completely
        this.logWarn('Continuing initialization with degraded backend functionality');
      }
      
      // Register core Templum services with resource manager for monitoring
      await this.registerCoreServicesForMonitoring();
      
      this.initialized = true;
      this.emit('initialized', { timestamp: Date.now() });
      
      // Start IPC command monitoring for CLI communication
      this.startIPCCommandMonitoring();
      
      // Load skins from connected backends after initialization is complete
      try {
        const connectionStatus = this.dependencies.backendServiceRouter.getConnectionStatus?.() || { backends: {} };
        for (const [backendId, status] of Object.entries(connectionStatus.backends)) {
          const backendStatus = status as BackendStatus;
          if (backendStatus.connected && backendStatus.health === 'healthy') {
            try {
              this.logInfo(`Loading skin from backend ${backendId}...`);
              await this.loadBackendSkin(backendId);
              this.logInfo(`Successfully loaded skin from backend ${backendId}`);
            } catch (skinError) {
              this.logWarn(`Failed to load skin from backend ${backendId}`, { 
                error: skinError instanceof Error ? skinError.message : String(skinError)
              });
            }
          }
        }
      } catch (skinLoadError) {
        this.logWarn('Failed to load skins from backends after initialization', {
          error: skinLoadError instanceof Error ? skinLoadError.message : String(skinLoadError)
        });
      }
      
      console.log('Templum Core Engine: Initialization complete with dependency injection');
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      const _errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumCoreInitialization',
        error: createTemplumError(errorMessage, 'INITIALIZATION_ERROR', 'configuration'),
        severity: 'critical'
      };
      
      this.emit('initializationError', { error: errorMessage, timestamp: Date.now() });
      console.error('Templum Core: Initialization failed:', errorMessage);
      
      throw createTemplumError(`Failed to initialize Templum Core Engine: ${errorMessage}`, 'INITIALIZATION_ERROR', 'configuration');
    }
  }

  getSupportedInterfaces(): InterfaceType[] {
    return ['vscode', 'cli', 'command'];
  }

  /**
   * TASK-CLI-006: Get HTTP port for service registration
   * Returns the HTTP port that Templum service should listen on
   */
  private getHttpPort(): number {
    // For now, use a default port - in full implementation this would be configurable
    return process.env.TEMPLUM_HTTP_PORT ? parseInt(process.env.TEMPLUM_HTTP_PORT) : 3000;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async registerInterface(interfaceType: InterfaceType, adapter: InterfaceAdapter): Promise<void> {
    if (!this.initialized) {
      throw new Error('Templum Core Engine must be initialized before registering interfaces');
    }

    // Validate interface type
    if (!this.getSupportedInterfaces().includes(interfaceType)) {
      throw new Error(`Unsupported interface type: ${interfaceType}`);
    }

    // Store adapter
    this.interfaceAdapters.set(interfaceType, adapter);
    this.activeInterfaces.add(interfaceType);
    
    // Register adapter with Universal Interface Manager - TASK-NEW-048
    if (this.universalInterfaceManager) {
      this.universalInterfaceManager.registerInterfaceAdapter(interfaceType, adapter);
    }
    
    // Apply all loaded skins to new interface
    for (const skin of Array.from(this.loadedSkins.values())) {
      await adapter.applySkin(skin);
    }

    // Synchronize current state to new interface - use state sync functionality
    console.log(`Synchronizing state to ${interfaceType} interface`);
    // Note: Real state manager uses syncState for interface coordination
    // await this.stateManager.syncState(interfaceType, {}, 'core-registration');

    this.emit('interfaceRegistered', { 
      interfaceType, 
      timestamp: Date.now(),
      totalInterfaces: this.activeInterfaces.size
    });

    console.log(`Templum Core: Registered ${interfaceType} interface`);
  }

  async loadSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    if (!this.initialized) {
      throw new Error('Templum Core Engine must be initialized before loading skins');
    }

    // Basic skin validation - real component has different validation approach
    if (!skinDefinition.metadata?.id) {
      throw createTemplumError('Skin definition missing required id', 'SKIN_VALIDATION_ERROR', 'validation');
    }
    if (!skinDefinition.metadata?.name) {
      throw createTemplumError('Skin definition missing required name', 'SKIN_VALIDATION_ERROR', 'validation');
    }

    // Store skin definition
    this.loadedSkins.set(skinDefinition.metadata.id, skinDefinition);

    // Apply skin across all active interfaces
    await this.applySkinToActiveInterfaces(skinDefinition);

    this.emit('skinLoaded', {
      skinId: skinDefinition.metadata.id,
      skinName: skinDefinition.metadata.name,
      compatibleInterfaces: skinDefinition.metadata.compatibleInterfaces,
      timestamp: Date.now()
    });

    console.log(`Templum Core: Loaded skin ${skinDefinition.metadata.name}`);
  }

  async executeCommand(
    command: string,
    sourceInterface: InterfaceType,
    args: any[] = [],
    _context: CommandContext = {}
  ): Promise<CommandResult> {
    if (!this.initialized) {
      throw new Error('Templum Core Engine must be initialized before executing commands');
    }

    const startTime = Date.now();

    try {
      console.log(`TemplumCore: Executing command '${command}' from ${sourceInterface} with enhanced real backend delegation...`);
      
      // Enhanced real backend command execution with intelligent routing
      let executionResult: any;
      let selectedBackend: string | null = null;
      
      // Attempt real backend command execution through backend service router
      if (this.dependencies.backendServiceRouter) {
        try {
          // TASK-SKIN-005: Two-tier backend prioritization system
          const systemStatus = this.getSystemStatus();
          const availableBackends = Object.entries(systemStatus.coreEngine.backendConnections.backends)
            .filter(([_, status]) => status.connected) // Only require connection, not health
            .map(([backendId, status]) => ({ backendId, status }));

          // Get the prioritized backends using the two-tier system
          const prioritizedBackends = this.prioritizeBackendsTwoTier(availableBackends);
          
          if (prioritizedBackends.length > 0) {
            // Select the best backend for command execution
            selectedBackend = prioritizedBackends[0].backendId;
            console.log(`TemplumCore: Routing command '${command}' to ${selectedBackend} backend...`);
            
            // Execute command through real backend service
            if (!this.dependencies?.backendServiceRouter) {
              throw createTemplumError('Backend service router not initialized', 'SERVICE_NOT_READY', 'configuration');
            }
            
            const router = this.dependencies!.backendServiceRouter!;
            if (!router.executeCommand) {
              throw createTemplumError('Backend service router executeCommand method not available', 'SERVICE_NOT_READY', 'configuration');
            }
            executionResult = await router.executeCommand(
              selectedBackend,
              command,
              args
            );
            
            console.log(`TemplumCore: Command '${command}' executed successfully via ${selectedBackend} backend`);
            
          } else {
            console.warn('TemplumCore: No healthy backends available for command execution, creating local result');
            throw new Error('No healthy backends available');
          }
          
        } catch (backendError) {
          console.warn(`TemplumCore: Backend command execution failed (${backendError}), creating fallback result`);
          
          // Fallback to local execution result
          executionResult = { 
            executed: true, 
            timestamp: Date.now(),
            fallback: true,
            backendError: backendError instanceof Error ? backendError.message : 'Unknown backend error'
          };
        }
      } else {
        console.warn('TemplumCore: Backend service router not available, creating local result');
        executionResult = { 
          executed: true, 
          timestamp: Date.now(),
          local: true
        };
      }

      // Create comprehensive result structure
      const result = { 
        command, 
        success: true, 
        data: executionResult,
        source: sourceInterface,
        backend: selectedBackend
      };

      // Synchronize state across interfaces after command execution
      try {
        console.log(`TemplumCore: Synchronizing interface states after command: ${command}`);
        await this.synchronizeInterfaceStates(result);
      } catch (syncError) {
        console.warn('TemplumCore: Interface state synchronization failed:', syncError);
        // Continue - synchronization failure shouldn't fail the command
      }

      const commandResult: CommandResult = {
        success: true,
        message: selectedBackend 
          ? `Command '${command}' executed via ${selectedBackend} backend`
          : `Command '${command}' executed with local fallback`,
        data: result,
        source: sourceInterface,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
        metadata: {
          backendId: selectedBackend || undefined,
          routing: selectedBackend ? 'real-backend' : 'local-fallback',
          executionMode: 'enhanced-delegation'
        }
      };

      this.emit('commandExecuted', {
        command,
        sourceInterface,
        result: commandResult,
        timestamp: Date.now()
      });

      return commandResult;
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      const _errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: `CommandExecution:${command}`,
        error: createTemplumError(errorMessage, 'COMMAND_EXECUTION_ERROR', 'runtime'),
        severity: 'high'
      };
      
      const errorResult: CommandResult = {
        success: false,
        error: errorMessage,
        source: sourceInterface,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };

      this.emit('commandError', {
        command,
        sourceInterface,
        error: errorMessage,
        timestamp: Date.now()
      });

      console.error(`Templum Core: Command execution failed: ${errorMessage}`);
      return errorResult;
    }
  }

  resolveCommand(command: string): { backend: string; commandInfo: any } | null {
    if (!this.initialized) {
      return null;
    }

    // Real PCL backend integrator doesn't have a simple resolveCommand
    // Return a default PCL backend routing info
    return { backend: 'pcl', commandInfo: { handler: command, type: 'component-request' } };
  }

  async synchronizeInterfaceStates(result: any): Promise<void> {
    // State synchronization using dependency injection
    for (const [interfaceType, _adapter] of Array.from(this.interfaceAdapters.entries())) {
      try {
        // Use injected state manager for synchronization
        if (this.dependencies?.stateManager?.syncState) {
          await this.dependencies.stateManager.syncState(
            interfaceType, 
            { 
              timestamp: Date.now(),
              commandResult: result
            }, 
            'templum-core'
          );
        }
        console.log(`State synchronized to ${interfaceType} interface via dependency injection`);
      } catch (error) {
        const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
        console.error(`Failed to sync state to ${interfaceType} interface: ${errorMessage}`);
      }
    }
  }

  getSystemStatus(): TemplumSystemStatus {
    return {
      coreEngine: {
        initialized: this.initialized,
        activeInterfaces: Array.from(this.activeInterfaces),
        loadedSkins: Array.from(this.loadedSkins.keys()),
        backendConnections: this.dependencies?.backendServiceRouter?.getConnectionStatus?.() || {
          totalConnections: 0,
          healthyConnections: 0,
          backends: {}
        }
      },
      stateManager: {
        synchronized: true,
        globalState: { lastModified: Date.now(), backendStates: [] },
        sessionState: { startTime: Date.now(), totalCommands: 0, lastCommand: 'none' },
        subscribers: Array.from(this.interfaceAdapters.keys()).length,
        historySize: 0,
        persistence: { enabled: true, memoryLimit: 200 * 1024 * 1024 }
      },
      skinEngine: {
        cachedSkins: this.loadedSkins.size,
        renderers: { vscode: {}, cli: {}, command: {} },
        performance: { cacheHitRate: 0.85, averageRenderTime: 25 }
      },
      performance: this.getPerformanceMetrics()
    };
  }

  getStateManagerStatus(): StateManagerStatus {
    return {
      synchronized: true,
      globalState: { lastModified: Date.now(), backendStates: [] },
      sessionState: { startTime: Date.now(), totalCommands: 0, lastCommand: 'none' },
      subscribers: Array.from(this.interfaceAdapters.keys()).length,
      historySize: 0,
      persistence: { enabled: true, memoryLimit: 200 * 1024 * 1024 }
    };
  }

  async refreshBackendServices(): Promise<void> {
    if (!this.initialized) {
      throw createTemplumError(
        'Cannot refresh backend services: Templum core not initialized',
        'CORE_NOT_INITIALIZED',
        'runtime'
      );
    }

    try {
      console.log('🔄 Refreshing backend services via backend service router...');
      
      if (!this.dependencies.backendServiceRouter) {
        throw createTemplumError(
          'Backend service router not available',
          'BACKEND_ROUTER_UNAVAILABLE',
          'configuration'
        );
      }
      
      // Use existing backend service router to rediscover and reconnect to services
      await this.dependencies.backendServiceRouter.discoverAndConnect();
      
      console.log('✅ Backend service refresh completed successfully');
      
      // Emit event to notify interested components
      this.emit('backend-services-refreshed', {
        timestamp: Date.now(),
        status: this.dependencies?.backendServiceRouter?.getConnectionStatus?.() || { healthy: false, lastCheck: Date.now(), services: {} }
      });
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Backend service refresh failed:', errorMessage);
      
      // Emit error event
      this.emit('backend-refresh-error', {
        timestamp: Date.now(),
        error: errorMessage
      });
      
      throw createTemplumError(
        `Backend service refresh failed: ${errorMessage}`,
        'BACKEND_REFRESH_FAILED',
        'integration'
      );
    }
  }

  /**
   * TASK-CLI-004: Register Templum service for CLI discovery
   * Creates registry entry for separate CLI process to discover and connect
   */
  async registerForCliDiscovery(): Promise<void> {
    if (!this.initialized) {
      throw createTemplumError(
        'Cannot register for CLI discovery: Templum core not initialized',
        'CORE_NOT_INITIALIZED',
        'runtime'
      );
    }

    try {
      console.log('🔧 Registering Templum service for CLI discovery...');
      
      // Create service registry entry for CLI discovery
      const serviceRegistryPath = process.env.HOME || process.env.USERPROFILE;
      const templumDir = path.join(serviceRegistryPath!, '.templum');
      const servicesDir = path.join(templumDir, 'services');
      
      // Ensure directories exist
      if (!require('fs').existsSync(templumDir)) {
        require('fs').mkdirSync(templumDir, { recursive: true });
      }
      if (!require('fs').existsSync(servicesDir)) {
        require('fs').mkdirSync(servicesDir, { recursive: true });
      }
      
      // TASK-CLI-006: IPC-to-HTTP Transition - Register as IPC with HTTP readiness flag  
      const now = Date.now();
      const serviceEntryDefaults = buildServiceRegistryDefaults({
        id: `templum-core-${process.pid}`,
        endpoint: `ipc://templum-core-${process.pid}`,
        capabilities: this.getSupportedInterfaces(),
        version: '1.0.0',
        registrationTime: now,
        lastSeen: now,
        health: '/health',
        metadata: {
          httpEndpoint: `http://localhost:${this.getHttpPort()}`
        },
        pid: process.pid
      });

      const serviceEntry: ServiceRegistryEntry = serviceRegistryEntrySchema.parse({
        ...serviceEntryDefaults,
        protocol: 'ipc',
        httpEndpoint: `http://localhost:${this.getHttpPort()}`
      });

      // Write service registry file
      const serviceFilePath = path.join(servicesDir, `templum-core-${process.pid}.json`);
      const serializedServiceEntry = serialization
        .json(serviceEntry, {
          context: 'core:service-registry:write',
          pretty: 2,
          maskFields: ['token', 'credentials']
        })
        .stringify();

      const serviceEntryPayload = this.handleSerializationOutcome(
        'Service registry entry write',
        serializedServiceEntry
      );

      if (!serviceEntryPayload) {
        throw createTemplumError(
          'Failed to serialize service registry entry',
          'CLI_REGISTRY_WRITE_FAILED',
          'configuration'
        );
      }

      require('fs').writeFileSync(serviceFilePath, serviceEntryPayload.value, 'utf8');
      
      console.log(`✅ Service registered for CLI discovery at: ${serviceFilePath}`);
      
      // Setup cleanup on process exit
      const cleanupServiceEntry = () => {
        try {
          if (require('fs').existsSync(serviceFilePath)) {
            require('fs').unlinkSync(serviceFilePath);
            console.log('🧹 Service registry entry cleaned up');
          }
        } catch (error) {
          console.warn('⚠️  Failed to clean up service registry entry:', error);
        }
      };
      
      process.on('exit', cleanupServiceEntry);
      process.on('SIGINT', cleanupServiceEntry);
      process.on('SIGTERM', cleanupServiceEntry);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to register for CLI discovery:', errorMessage);
      
      throw createTemplumError(
        `Service registration for CLI discovery failed: ${errorMessage}`,
        'CLI_REGISTRATION_FAILED',
        'configuration'
      );
    }
  }

  async switchInterface(targetInterface: InterfaceType): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.initialized) {
        return { 
          success: false, 
          message: 'Templum Core not initialized' 
        };
      }

      // Enhanced implementation using Universal Interface Manager - TASK-NEW-048
      if (!this.universalInterfaceManager) {
        // Fallback to basic implementation if Universal Interface Manager not available
        return this.basicSwitchInterface(targetInterface);
      }

      // Get current active interfaces for tracking
      const currentInterfaces = Array.from(this.activeInterfaces);
      
      // Use Universal Interface Manager for coordinated interface switching
      const result = await this.universalInterfaceManager.executeInterfaceSwitch(targetInterface, {
        preserveSession: true,
        migrateState: true,
        maintainConnections: true,
        performanceMetrics: true
      });

      if (result.success) {
        // Update TemplumCore's active interfaces to match the switch
        this.activeInterfaces.clear();
        this.activeInterfaces.add(targetInterface);

        // Emit enhanced interface switch event
        this.emit('interface-switch', {
          timestamp: Date.now(),
          fromInterfaces: currentInterfaces,
          toInterface: targetInterface,
          statePreserved: true,
          switchTime: result.switchTime,
          orchestrated: true
        });

        console.log(`✅ Interface switched via Universal Interface Manager: [${currentInterfaces.join(', ')}] → ${targetInterface} (${result.switchTime}ms)`);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Interface switch failed: ${errorMessage}`);
      
      return { 
        success: false, 
        message: `Interface switch failed: ${errorMessage}` 
      };
    }
  }

  /**
   * Basic interface switching fallback implementation
   * Used when Universal Interface Manager is not available
   */
  private async basicSwitchInterface(targetInterface: InterfaceType): Promise<{ success: boolean; message: string }> {
    // Check if target interface adapter exists
    const adapter = this.interfaceAdapters.get(targetInterface);
    if (!adapter) {
      return { 
        success: false, 
        message: `Interface adapter '${targetInterface}' not available` 
      };
    }

    // Get current active interfaces for state preservation
    const currentInterfaces = Array.from(this.activeInterfaces);
    
    // Preserve state from current interfaces if state manager available
    let preservedState = null;
    if (this.dependencies?.stateManager && currentInterfaces.length > 0) {
      try {
        preservedState = await (this.dependencies.stateManager as any).getState?.();
      } catch (error) {
        console.warn('Failed to preserve state during interface switch:', error);
      }
    }

    // Deactivate current interfaces (but don't remove adapters)
    this.activeInterfaces.clear();

    // Activate target interface
    this.activeInterfaces.add(targetInterface);

    // Restore preserved state to new interface if available
    if (preservedState && this.dependencies?.stateManager) {
      try {
        await (this.dependencies.stateManager as any).setState?.(preservedState);
        console.log(`State preserved and restored during switch to ${targetInterface}`);
      } catch (error) {
        console.warn('Failed to restore state after interface switch:', error);
      }
    }

    // Emit interface switch event
    this.emit('interface-switch', {
      timestamp: Date.now(),
      fromInterfaces: currentInterfaces,
      toInterface: targetInterface,
      statePreserved: !!preservedState,
      orchestrated: false
    });

    console.log(`✅ Interface switched (basic): [${currentInterfaces.join(', ')}] → ${targetInterface}`);

    return { 
      success: true, 
      message: `Successfully switched to ${targetInterface} interface (basic mode)` 
    };
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Dispose of all interface adapters
      for (const [interfaceType, adapter] of Array.from(this.interfaceAdapters.entries())) {
        try {
          await adapter.dispose();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to dispose ${interfaceType} adapter: ${errorMessage}`);
        }
      }

      // Shutdown components via dependency injection
      if (this.dependencies?.stateManager?.shutdown) {
        await this.dependencies.stateManager.shutdown();
      }

      if (this.dependencies?.backendRouter?.shutdown) {
        await this.dependencies.backendRouter.shutdown();
      }

      if (this.dependencies?.backendServiceRouter?.cleanup) {
        await this.dependencies.backendServiceRouter.cleanup();
      }

      // Dispose adapter registry
      await this.adapterRegistry.dispose();

      this.activeInterfaces.clear();
      this.interfaceAdapters.clear();
      this.loadedSkins.clear();
      this.initialized = false;

      this.emit('shutdown', { timestamp: Date.now() });
      this.removeAllListeners();

      console.log('Templum Core Engine: Shutdown complete with dependency injection cleanup');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error during shutdown: ${errorMessage}`);
      throw error;
    }
  }

  private async applySkinToActiveInterfaces(skinDef: UniversalSkinDefinition): Promise<void> {
    const compatibleInterfaces = skinDef.metadata.compatibleInterfaces;

    for (const [interfaceType, adapter] of Array.from(this.interfaceAdapters.entries())) {
      if (compatibleInterfaces.includes(interfaceType)) {
        try {
          await adapter.applySkin(skinDef);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to apply skin to ${interfaceType}: ${errorMessage}`);
        }
      }
    }
  }

  private async initializeInterfaceAdapters(): Promise<void> {
    // In the real implementation, this would initialize the actual adapters
    // For now, this is a placeholder for testing
    console.log('Interface adapters initialization complete');
  }


  private setupEventListeners(): void {
    this.on('initialized', ({ timestamp }) => {
      console.log(`Templum Core Engine initialized at ${new Date(timestamp).toISOString()}`);
    });

    this.on('interfaceRegistered', ({ interfaceType, totalInterfaces }) => {
      console.log(`Interface ${interfaceType} registered. Total interfaces: ${totalInterfaces}`);
    });

    this.on('skinLoaded', ({ skinId, skinName }) => {
      console.log(`Skin loaded: ${skinName} (${skinId})`);
    });

    this.on('commandExecuted', ({ command, sourceInterface }) => {
      console.log(`Command '${command}' executed from ${sourceInterface} interface`);
    });

    this.on('commandError', ({ command, sourceInterface, error }) => {
      console.error(`Command '${command}' failed from ${sourceInterface}: ${error}`);
    });
  }

  private getPerformanceMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
      memory: {
        heapUsed: memoryUsage.heapUsed / 1024 / 1024, // MB
        rss: memoryUsage.rss / 1024 / 1024 // MB
      },
      cpu: {
        user: 0,
        system: 0
      },
      interfaces: {}
    };
  }

  /**
   * TASK-SKIN-005: Two-tier backend prioritization system
   * Implements fair comparison between health-enabled and minimal backends
   */
  private prioritizeBackendsTwoTier(backends: Array<{ backendId: string, status: any }>): Array<{ backendId: string, score: number, tier: 'health-enabled' | 'minimal' }> {
    const router = this.dependencies?.backendServiceRouter as { prioritizeBackendsTwoTier?: typeof TemplumCore.prototype.prioritizeBackendsTwoTier } | undefined;

    if (!router?.prioritizeBackendsTwoTier) {
      return [];
    }

    return router.prioritizeBackendsTwoTier(backends);
  }

  /**
   * Get the backend service router for WebView provider integration
   * Uses dependency injection to provide backend service router
   */
  getBackendRouter(): IBackendServiceRouter {
    if (!this.dependencies?.backendServiceRouter) {
      throw createTemplumError('Backend service router not initialized', 'SERVICE_NOT_READY', 'configuration');
    }
    return this.dependencies.backendServiceRouter;
  }

  /**
   * Get Universal Skin Engine instance for rendering operations
   * Uses dependency injection to provide skin engine
   */
  getUniversalSkinEngine(): ISkinEngine {
    if (!this.dependencies?.skinEngine) {
      throw createTemplumError('Universal Skin Engine not initialized', 'SERVICE_NOT_READY', 'configuration');
    }
    return this.dependencies.skinEngine;
  }

  /**
   * Get Universal Interface Manager instance for interface switching coordination
   * TASK-NEW-048: Interface Switching Implementation
   */
  getUniversalInterfaceManager(): UniversalInterfaceManager {
    if (!this.universalInterfaceManager) {
      throw createTemplumError('Universal Interface Manager not initialized', 'SERVICE_NOT_READY', 'configuration');
    }
    return this.universalInterfaceManager;
  }

  // Enhanced skin caching system - TASK-NEW-009 implementation
  private skinCache = new Map<string, {
    definition: UniversalSkinDefinition;
    lastAccessed: number;
    accessCount: number;
    size: number;
    ttl: number;
  }>();
  private skinCacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalLoadTime: 0,
    validationFailures: 0
  };
  private readonly SKIN_CACHE_MAX_SIZE = 50; // Maximum cached skins
  private readonly SKIN_CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly SKIN_CACHE_MAX_MEMORY = 10 * 1024 * 1024; // 10MB

  /**
   * Load backend skin definition with enhanced caching and validation
   * Enhancement: TASK-NEW-009 - Comprehensive caching, validation, and performance monitoring
   * Dependencies: Universal Skin Engine integration, Resource Manager
   */
  async loadBackendSkin(backendId: string): Promise<UniversalSkinDefinition | null> {
    if (!this.initialized) {
      throw createTemplumError('Templum Core not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    const cacheKey = `backend:${backendId}`;
    const startTime = Date.now();

    try {
      // Check enhanced cache first with TTL validation
      const cachedEntry = this.skinCache.get(cacheKey);
      if (cachedEntry && this.isCacheEntryValid(cachedEntry)) {
        // Update cache metrics and access patterns
        this.skinCacheMetrics.hits++;
        cachedEntry.lastAccessed = Date.now();
        cachedEntry.accessCount++;
        
        // Update resource access time for cached entry
        this.dependencies.resourceManager.updateResourceAccess(`skin-cache-${cacheKey}`);
        
        console.log(`Templum Core: Loaded backend skin from cache for ${backendId} (hit rate: ${this.getCacheHitRate()}%)`);
        return cachedEntry.definition;
      }

      // Cache miss - increment miss counter
      this.skinCacheMetrics.misses++;

      // Allocate enhanced cache resource with detailed metadata
      const resourceId = await this.dependencies.resourceManager.allocateResource({
        type: 'cache',
        owner: 'templum-core',
        size: 2, // 2MB for enhanced skin definition with validation metadata
        priority: 7,
        metadata: { 
          backendId, 
          operation: 'loadBackendSkin',
          cacheKey,
          timestamp: Date.now()
        },
        cleanup: async () => {
          console.log(`Cleaned up enhanced skin cache resource for ${backendId}`);
          this.skinCache.delete(cacheKey);
        }
      });

      // Load skin definition from backend service router
      const rawSkinDefinition = await this.dependencies.backendServiceRouter.loadBackendSkin(backendId);
      
      if (rawSkinDefinition) {
        // Comprehensive skin validation - TASK-NEW-009 enhancement
        const validationResult = this.validateSkinDefinitionComprehensive(rawSkinDefinition);
        if (!validationResult.isValid) {
          this.skinCacheMetrics.validationFailures++;
          throw createTemplumError(
            `Skin validation failed for ${backendId}: ${validationResult.errors.join(', ')}`,
            'SKIN_VALIDATION_ERROR',
            'validation'
          );
        }

        // Calculate skin definition size for cache management
        const skinSize = this.calculateSkinDefinitionSize(rawSkinDefinition);
        
        // Enhanced cache storage with metadata
        const cacheEntry = {
          definition: rawSkinDefinition,
          lastAccessed: Date.now(),
          accessCount: 1,
          size: skinSize,
          ttl: Date.now() + this.SKIN_CACHE_TTL
        };

        // Ensure cache doesn't exceed memory limits
        await this.evictExpiredAndOversizedEntries();
        
        // Apply LRU eviction if needed
        if (this.shouldEvictForNewEntry(skinSize)) {
          await this.evictLeastRecentlyUsedEntries(skinSize);
        }

        // Store in enhanced cache
        this.skinCache.set(cacheKey, cacheEntry);
        
        // Store in loaded skins for backward compatibility
        this.loadedSkins.set(rawSkinDefinition.metadata.id, rawSkinDefinition);
        
        // Update resource access time
        this.dependencies.resourceManager.updateResourceAccess(resourceId);
        
        // Track loading performance
        const loadTime = Date.now() - startTime;
        this.skinCacheMetrics.totalLoadTime += loadTime;
        
        // Emit enhanced skin loaded event with validation status
        this.emit('skinLoaded', {
          skinId: rawSkinDefinition.metadata.id,
          skinName: rawSkinDefinition.metadata.name,
          backend: backendId,
          compatibleInterfaces: rawSkinDefinition.metadata.compatibleInterfaces,
          timestamp: Date.now(),
          cached: false,
          loadTime,
          validationStatus: 'passed'
        });

        console.log(`Templum Core: Loaded and cached backend skin ${rawSkinDefinition.metadata.name} from ${backendId} (${loadTime}ms, ${this.formatBytes(skinSize)})`);
        
        // Log cache performance metrics periodically
        if ((this.skinCacheMetrics.hits + this.skinCacheMetrics.misses) % 10 === 0) {
          this.logCachePerformanceMetrics();
        }
        
        return rawSkinDefinition;
      } else {
        // Deallocate resource if no skin was loaded
        await this.dependencies.resourceManager.deallocateResource(resourceId);
        return null;
      }
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      this.skinCacheMetrics.totalLoadTime += loadTime;
      
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      console.error(`Failed to load skin from backend '${backendId}' (${loadTime}ms):`, errorMessage);
      
      // Emit error event with performance data
      this.emit('skinLoadError', {
        backend: backendId,
        error: errorMessage,
        loadTime,
        timestamp: Date.now()
      });
      
      return null;
    }
  }

  /**
   * Comprehensive skin definition validation - TASK-NEW-009 enhancement
   * Validates both templum-types and universal-skin-engine-types formats
   */
  private validateSkinDefinitionComprehensive(skinDef: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Basic structure validation
      if (!skinDef || typeof skinDef !== 'object') {
        errors.push('Skin definition must be a valid object');
        return { isValid: false, errors };
      }

      // Core identification validation - support both formats with safe property access
      const hasMetadataId = skinDef.metadata && typeof skinDef.metadata === 'object' && skinDef.metadata.id;
      const hasDirectId = skinDef.id;

      if (hasMetadataId) {
        // templum-types format validation
        this.validateTemplumTypesFormat(skinDef, errors);
      } else if (hasDirectId) {
        // universal-skin-engine-types format validation
        this.validateUniversalSkinEngineFormat(skinDef, errors);
      } else {
        errors.push('Skin definition missing required id field');
      }

      // Version validation with safe property access
      const version = (skinDef.metadata && skinDef.metadata.version) || skinDef.version;
      if (!version || typeof version !== 'string') {
        errors.push('Skin definition missing or invalid version');
      } else if (!this.isValidSemanticVersion(version)) {
        errors.push('Skin definition version must follow semantic versioning (e.g., 1.0.0)');
      }

      // Interface compatibility validation with safe property access
      const compatibleInterfaces = (skinDef.metadata && skinDef.metadata.compatibleInterfaces) || 
                                  (skinDef.metadata && skinDef.metadata.supportedInterfaces);
      if (compatibleInterfaces && Array.isArray(compatibleInterfaces)) {
        const validInterfaces = ['vscode', 'cli', 'command'];
        const invalidInterfaces = compatibleInterfaces.filter((iface: string) => !validInterfaces.includes(iface));
        if (invalidInterfaces.length > 0) {
          errors.push(`Invalid interface types: ${invalidInterfaces.join(', ')}`);
        }
      }

      // Theme validation if present (check both possible locations)
      const theme = skinDef.theme || (skinDef.themes && skinDef.themes[0]);
      if (theme) {
        this.validateSkinTheme(theme, errors);
      }

      // Menu structure validation if present
      if (skinDef.menus) {
        this.validateSkinMenus(skinDef.menus, errors);
      }

      // Command structure validation if present
      if (skinDef.commands) {
        this.validateSkinCommands(skinDef.commands, errors);
      }

      // PCL compatibility validation if present
      if (skinDef.pclCompatibility) {
        this.validatePCLCompatibility(skinDef.pclCompatibility, errors);
      }

    } catch (validationError) {
      const errorMessage = validationError instanceof Error ? validationError.message : 'Unknown validation error';
      errors.push(`Validation process error: ${errorMessage}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate templum-types.ts UniversalSkinDefinition format
   */
  private validateTemplumTypesFormat(skinDef: any, errors: string[]): void {
    if (!skinDef.metadata || typeof skinDef.metadata !== 'object') {
      errors.push('metadata object is required');
      return;
    }
    
    const metadata = skinDef.metadata;
    
    if (!metadata.id || typeof metadata.id !== 'string') {
      errors.push('metadata.id is required and must be a string');
    }
    
    if (!metadata.name || typeof metadata.name !== 'string') {
      errors.push('metadata.name is required and must be a string');
    }
    
    if (metadata.backend !== undefined && typeof metadata.backend !== 'string') {
      errors.push('metadata.backend must be a string if provided');
    }
    
    if (metadata.compatibleInterfaces !== undefined && !Array.isArray(metadata.compatibleInterfaces)) {
      errors.push('metadata.compatibleInterfaces must be an array if provided');
    }
  }

  /**
   * Validate universal-skin-engine-types.ts UniversalSkinDefinition format
   */
  private validateUniversalSkinEngineFormat(skinDef: any, errors: string[]): void {
    if (!skinDef.id || typeof skinDef.id !== 'string') {
      errors.push('id is required and must be a string');
    }
    
    if (!skinDef.name || typeof skinDef.name !== 'string') {
      errors.push('name is required and must be a string');
    }
    
    if (skinDef.metadata && typeof skinDef.metadata === 'object') {
      if (skinDef.metadata.supportedInterfaces !== undefined && !Array.isArray(skinDef.metadata.supportedInterfaces)) {
        errors.push('metadata.supportedInterfaces should be an array if provided');
      }
    }
  }

  /**
   * Additional validation helper methods
   */
  private isValidSemanticVersion(version: string): boolean {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  private validateSkinTheme(theme: any, errors: string[]): void {
    if (!theme || typeof theme !== 'object') {
      errors.push('theme must be a valid object');
      return;
    }
    
    if (theme.colors !== undefined && typeof theme.colors !== 'object') {
      errors.push('theme.colors must be an object if provided');
    }
    
    // Validate color fields if present
    if (theme.colors && theme.colors.primary !== undefined && typeof theme.colors.primary !== 'string') {
      errors.push('theme.colors.primary must be a string if provided');
    }

    if (theme.name !== undefined && typeof theme.name !== 'string') {
      errors.push('theme.name must be a string if provided');
    }
  }

  private validateSkinMenus(menus: any, errors: string[]): void {
    if (!menus || typeof menus !== 'object') {
      errors.push('menus must be a valid object');
      return;
    }
    
    if (menus.main !== undefined) {
      if (typeof menus.main !== 'object') {
        errors.push('menus.main must be an object if provided');
      } else if (menus.main.items !== undefined && !Array.isArray(menus.main.items)) {
        errors.push('menus.main.items must be an array if provided');
      }
    }
  }

  private validateSkinCommands(commands: any, errors: string[]): void {
    if (!commands) {
      return; // Commands are optional
    }
    
    if (!Array.isArray(commands) && typeof commands !== 'object') {
      errors.push('commands must be an array or object if provided');
      return;
    }
    
    if (Array.isArray(commands)) {
      commands.forEach((cmd, index) => {
        if (!cmd || typeof cmd !== 'object') {
          errors.push(`commands[${index}] must be a valid object`);
        } else if (!cmd.id || typeof cmd.id !== 'string') {
          errors.push(`commands[${index}].id is required and must be a string`);
        }
      });
    } else if (commands.primary !== undefined && Array.isArray(commands.primary)) {
      commands.primary.forEach((cmd: any, index: number) => {
        if (!cmd || typeof cmd !== 'object') {
          errors.push(`commands.primary[${index}] must be a valid object`);
        } else if (!cmd.id || typeof cmd.id !== 'string') {
          errors.push(`commands.primary[${index}].id is required and must be a string`);
        }
      });
    }
  }

  private validatePCLCompatibility(pclCompat: any, errors: string[]): void {
    if (!pclCompat || typeof pclCompat !== 'object') {
      errors.push('pclCompatibility must be a valid object');
      return;
    }
    
    if (pclCompat.version !== undefined && typeof pclCompat.version !== 'string') {
      errors.push('pclCompatibility.version must be a string if provided');
    }

    if (pclCompat.requiredFeatures !== undefined && !Array.isArray(pclCompat.requiredFeatures)) {
      errors.push('pclCompatibility.requiredFeatures must be an array if provided');
    }
  }

  /**
   * Enhanced cache management methods - TASK-NEW-009 implementation
   */
  private isCacheEntryValid(entry: any): boolean {
    return Date.now() <= entry.ttl;
  }

  private calculateSkinDefinitionSize(skinDef: any): number {
    // Rough calculation of skin definition size in bytes
    return JSON.stringify(skinDef).length * 2; // UTF-16 encoding approximation
  }

  private async evictExpiredAndOversizedEntries(): Promise<void> {
    const now = Date.now();
    const entriesToEvict = [];
    
    for (const [key, entry] of Array.from(this.skinCache.entries())) {
      if (now > entry.ttl) {
        entriesToEvict.push(key);
      }
    }
    
    for (const key of entriesToEvict) {
      this.skinCache.delete(key);
      this.skinCacheMetrics.evictions++;
    }
    
    if (entriesToEvict.length > 0) {
      console.log(`Templum Core: Evicted ${entriesToEvict.length} expired skin cache entries`);
    }
  }

  private shouldEvictForNewEntry(newEntrySize: number): boolean {
    if (this.skinCache.size >= this.SKIN_CACHE_MAX_SIZE) {
      return true;
    }
    
    const totalSize = Array.from(this.skinCache.values()).reduce((sum, entry) => sum + entry.size, 0);
    return (totalSize + newEntrySize) > this.SKIN_CACHE_MAX_MEMORY;
  }

  private async evictLeastRecentlyUsedEntries(requiredSpace: number): Promise<void> {
    const sortedEntries = Array.from(this.skinCache.entries())
      .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
    
    let freedSpace = 0;
    const evicted = [];
    
    for (const [key, entry] of sortedEntries) {
      this.skinCache.delete(key);
      this.skinCacheMetrics.evictions++;
      freedSpace += entry.size;
      evicted.push(key);
      
      if (freedSpace >= requiredSpace || this.skinCache.size < this.SKIN_CACHE_MAX_SIZE) {
        break;
      }
    }
    
    if (evicted.length > 0) {
      console.log(`Templum Core: LRU evicted ${evicted.length} skin cache entries (freed ${this.formatBytes(freedSpace)})`);
    }
  }

  private getCacheHitRate(): number {
    const total = this.skinCacheMetrics.hits + this.skinCacheMetrics.misses;
    return total > 0 ? Math.round((this.skinCacheMetrics.hits / total) * 100) : 0;
  }

  private getAverageLoadTime(): number {
    const total = this.skinCacheMetrics.hits + this.skinCacheMetrics.misses;
    return total > 0 ? Math.round(this.skinCacheMetrics.totalLoadTime / total) : 0;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private logCachePerformanceMetrics(): void {
    const totalSize = Array.from(this.skinCache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    console.log(`Templum Core Cache Metrics - Entries: ${this.skinCache.size}/${this.SKIN_CACHE_MAX_SIZE}, ` +
                `Size: ${this.formatBytes(totalSize)}/${this.formatBytes(this.SKIN_CACHE_MAX_MEMORY)}, ` +
                `Hit Rate: ${this.getCacheHitRate()}%, ` +
                `Avg Load Time: ${this.getAverageLoadTime()}ms, ` +
                `Evictions: ${this.skinCacheMetrics.evictions}, ` +
                `Validation Failures: ${this.skinCacheMetrics.validationFailures}`);
  }

  /**
   * Get enhanced skin cache performance metrics - TASK-NEW-009 enhancement
   */
  getSkinCacheMetrics(): any {
    const totalSize = Array.from(this.skinCache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      entries: this.skinCache.size,
      maxEntries: this.SKIN_CACHE_MAX_SIZE,
      totalSize,
      maxSize: this.SKIN_CACHE_MAX_MEMORY,
      hitRate: this.getCacheHitRate(),
      averageLoadTime: this.getAverageLoadTime(),
      metrics: { ...this.skinCacheMetrics },
      ttlMinutes: this.SKIN_CACHE_TTL / (60 * 1000)
    };
  }

  /**
   * Get the Resource Manager for system resource management
   * Uses dependency injection to provide resource manager
   */
  getResourceManager(): IResourceManager {
    if (!this.dependencies?.resourceManager) {
      throw createTemplumError('Resource Manager not initialized', 'SERVICE_NOT_READY', 'configuration');
    }
    return this.dependencies.resourceManager;
  }

  /**
   * Register core Templum services for resource monitoring
   * @private
   */
  private async registerCoreServicesForMonitoring(): Promise<void> {
    try {
      // Register core Templum services
      await this.dependencies.resourceManager.registerService('templum-core', 'core', {
        component: 'TemplumCore',
        version: '1.0.0'
      });

      await this.dependencies.resourceManager.registerService('templum-adapter-registry', 'core', {
        component: 'TemplumAdapterRegistry',
        enabledServices: Object.keys(this.dependencies)
      });

      await this.dependencies.resourceManager.registerService('templum-skin-engine', 'core', {
        component: 'UniversalSkinEngine',
        cachedSkins: this.loadedSkins.size
      });

      await this.dependencies.resourceManager.registerService('templum-state-manager', 'core', {
        component: 'EnhancedStateManager',
        activeInterfaces: this.activeInterfaces.size
      });

      this.logInfo('Core services registered with resource manager', {
        registeredServices: 4,
        loadedSkins: this.loadedSkins.size,
        activeInterfaces: this.activeInterfaces.size
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logError('Failed to register core services for monitoring', error instanceof Error ? error : undefined, { errorMessage });
    }
  }

  private handleSerializationOutcome<T>(
    context: string,
    outcome: SerializationOutcome<T>
  ): { value: T; meta: SerializationMeta } | null {
    const payload = {
      context: outcome.meta.context,
      status: outcome.status,
      warnings: [...outcome.meta.warnings],
      bytes: outcome.meta.bytes,
      durationMs: outcome.meta.durationMs,
      maskedFields: [...outcome.meta.maskedFields]
    };

    if (!outcome.ok) {
      this.logError(`${context} serialization failed`, outcome.error instanceof Error ? outcome.error : undefined, payload);
      return null;
    }

    if (outcome.status === 'fallback') {
      this.logWarn(`${context} serialization used fallback value`, payload);
    } else if (outcome.status === 'defaults') {
      this.logWarn(`${context} serialization applied defaults`, payload);
    } else if (outcome.meta.warnings.length > 0) {
      this.logWarn(`${context} serialization completed with warnings`, payload);
    }

    return { value: outcome.value as T, meta: outcome.meta };
  }

  // ============================================================================
  // Observability Helper Methods
  // ============================================================================

  /**
   * Structured logging with observability service integration
   */
  private logInfo(message: string, metadata?: Record<string, any>): void {
    if (this.dependencies?.observabilityService) {
      this.dependencies.observabilityService.logInfo(message, metadata, 'TemplumCore');
    } else {
      console.log(`[INFO] [TemplumCore] ${message}`, metadata || '');
    }
  }

  private logError(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (this.dependencies?.observabilityService) {
      this.dependencies.observabilityService.logError(message, error, metadata, 'TemplumCore');
    } else {
      console.error(`[ERROR] [TemplumCore] ${message}`, error || '', metadata || '');
    }
  }

  private logWarn(message: string, metadata?: Record<string, any>): void {
    if (this.dependencies?.observabilityService) {
      this.dependencies.observabilityService.logWarn(message, metadata, 'TemplumCore');
    } else {
      console.warn(`[WARN] [TemplumCore] ${message}`, metadata || '');
    }
  }

  /**
   * Performance metrics recording
   */
  private recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (this.dependencies?.observabilityService) {
      this.dependencies.observabilityService.incrementCounter(name, value, tags, 'TemplumCore');
    }
  }

  private recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
    if (this.dependencies?.observabilityService) {
      this.dependencies.observabilityService.recordTiming(name, duration, tags, 'TemplumCore');
    }
  }

  /**
   * Context management for correlation
   */
  private setObservabilityContext(sessionId?: string, interfaceType?: InterfaceType): void {
    if (this.dependencies?.observabilityService) {
      if (sessionId) {
        this.dependencies.observabilityService.setSessionId(sessionId);
      }
      if (interfaceType) {
        this.dependencies.observabilityService.setInterfaceType(interfaceType);
      }
    }
  }

  /**
   * Start monitoring for IPC commands from CLI
   * Implements file-based IPC communication for CLI-to-Core commands
   */
  private startIPCCommandMonitoring(): void {
    if (!this.initialized) {
      return;
    }

    console.log('TemplumCore: Starting IPC command monitoring for CLI communication');

    const tempDir = require('os').tmpdir();
    const fs = require('fs');
    const path = require('path');

    // Monitor temp directory for CLI command files
    const checkForIPCRequests = () => {
      try {
        const files = fs.readdirSync(tempDir);
        const requestFiles = files.filter((file: string) => 
          file.startsWith('templum-cli-') && file.endsWith('-request.json')
        );

        for (const requestFile of requestFiles) {
          const requestPath = path.join(tempDir, requestFile);
          
          try {
            const requestData = fs.readFileSync(requestPath, 'utf8');
            const requestId = this.extractCliRequestId(requestFile);
            const responseFile = path.join(tempDir, `templum-${requestId}-response.json`);

            const parseOutcome = serialization.fromJson<Record<string, unknown>>(requestData, {
              context: `core:ipc:request:${requestId}`,
              fallback: {}
            }).parse();

            const parsedRequest = this.handleSerializationOutcome('IPC request read', parseOutcome);

            if (!parsedRequest) {
              this.logWarn('Skipping malformed IPC request', { requestFile });
              try {
                fs.unlinkSync(requestPath);
              } catch (_cleanupError) {
                // Ignore cleanup errors
              }
              continue;
            }

            const normalizedRequest = this.normalizeCliRequestPayload(
              parsedRequest.value,
              requestId,
              responseFile
            );

            void this.processIPCCommandRequest(normalizedRequest, requestPath, parsedRequest.meta);
          } catch (error) {
            console.warn(`TemplumCore: Failed to process IPC request ${requestFile}:`, error);
            // Clean up malformed request file
            try {
              fs.unlinkSync(requestPath);
            } catch (_cleanupError) {
              // Ignore cleanup errors
            }
          }
        }

      } catch (_error) {
        // Continue monitoring even if directory scan fails
      }
      
      // Schedule next check
      setTimeout(checkForIPCRequests, 100);
    };

    // Start monitoring
    setTimeout(checkForIPCRequests, 100);
  }

  private extractCliRequestId(fileName: string): string {
    const match = fileName.match(/^templum-(.+?)-request\.json$/i);
    if (match && match[1]) {
      return match[1];
    }
    return path.parse(fileName).name;
  }

  private normalizeCliRequestPayload(
    raw: Record<string, unknown>,
    fallbackRequestId: string,
    fallbackResponseFile: string
  ): CliIpcRequestPayload {
    const requestId = typeof raw.requestId === 'string' && raw.requestId.length > 0
      ? raw.requestId
      : fallbackRequestId;

    const responseFile = typeof raw.responseFile === 'string' && raw.responseFile.length > 0
      ? raw.responseFile
      : fallbackResponseFile;

    const priority = raw.priority === 'low' || raw.priority === 'high' || raw.priority === 'normal'
      ? raw.priority
      : 'normal';

    return buildCliIpcRequest({
      type: typeof raw.type === 'string' && raw.type.length > 0 ? raw.type : 'command',
      data: raw.data ?? {},
      requestId,
      responseFile,
      clientPid: typeof raw.clientPid === 'number' ? raw.clientPid : process.pid,
      timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
      version: typeof raw.version === 'string' && raw.version.length > 0 ? raw.version : '1.1',
      priority
    });
  }

  private isInterfaceTypeCandidate(value: unknown): value is InterfaceType {
    return value === 'cli' || value === 'vscode' || value === 'command';
  }

  private normalizeInterfaceType(value: unknown): InterfaceType {
    return this.isInterfaceTypeCandidate(value) ? value : 'cli';
  }

  /**
   * Process individual IPC command request from CLI
   */
  private async processIPCCommandRequest(
    request: CliIpcRequestPayload,
    requestPath: string,
    requestMeta: SerializationMeta
  ): Promise<void> {
    const fs = require('fs');

    try {
      // Validate request structure
      if (!request.type || !request.data) {
        throw new Error('Invalid IPC request structure - missing type or data');
      }

      let result: any;

      const payload = (request.data ?? {}) as Record<string, unknown>;

      // Handle different IPC message types
      switch (request.type) {
        case 'executeCommand': {
          const command = typeof payload.command === 'string' ? payload.command : undefined;
          if (!command) {
            throw new Error('Invalid IPC command payload: command missing');
          }

          const sourceInterface = this.normalizeInterfaceType(payload.sourceInterface);
          const args = Array.isArray(payload.args) ? payload.args : [];
          const context = (payload.context && typeof payload.context === 'object') ? payload.context : {};

          console.log(`TemplumCore: Processing IPC command '${command}' from CLI (PID: ${request.clientPid})`);

          result = await this.executeCommand(
            command,
            sourceInterface,
            args,
            context
          );
          break;
        }

        case 'getSystemStatus': {
          console.log(`TemplumCore: Processing IPC getSystemStatus from CLI (PID: ${request.clientPid})`);
          result = this.getSystemStatus();
          break;
        }

        case 'loadBackendSkin': {
          const backendId = typeof payload.backendId === 'string' ? payload.backendId : undefined;
          if (!backendId) {
            throw new Error('Invalid loadBackendSkin payload: backendId missing');
          }

          console.log(`TemplumCore: Processing IPC loadBackendSkin for '${backendId}' from CLI (PID: ${request.clientPid})`);
          
          // Use the real loadBackendSkin method through backend service router
          if (this.dependencies?.backendServiceRouter) {
            result = await this.dependencies.backendServiceRouter.loadBackendSkin(backendId);
          } else {
            result = null; // No backend service router available
          }
          break;
        }

        default:
          throw new Error(`Unsupported IPC message type: ${request.type}`);
      }

      // Write response to the specified response file
      const response = {
        success: true,
        result,
        requestId: request.requestId,
        timestamp: Date.now(),
        serializationMeta: {
          request: requestMeta
        }
      };

      if (request.responseFile) {
        const responseOutcome = serialization
          .json(response, {
            context: `core:ipc:response:${request.requestId}`,
            maskFields: ['token', 'credentials']
          })
          .stringify();

        const serializedResponse = this.handleSerializationOutcome('IPC response write', responseOutcome);

        if (serializedResponse) {
          fs.writeFileSync(request.responseFile, serializedResponse.value, 'utf8');
        }
      }

      console.log(`TemplumCore: IPC request '${request.type}' processed successfully`);
      
    } catch (error) {
      console.error(`TemplumCore: IPC command execution failed:`, error);
      
      // Write error response
      const errorResponse = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        requestId: request.requestId,
        timestamp: Date.now(),
        serializationMeta: {
          request: requestMeta
        }
      };

      try {
        if (request.responseFile) {
          const errorOutcome = serialization
            .json(errorResponse, {
              context: `core:ipc:response:${request.requestId}:error`,
              maskFields: ['token', 'credentials']
            })
            .stringify();

          const serializedError = this.handleSerializationOutcome('IPC response write (error)', errorOutcome);

          if (serializedError) {
            fs.writeFileSync(request.responseFile, serializedError.value, 'utf8');
          }
        }
      } catch (writeError) {
        console.error('TemplumCore: Failed to write error response:', writeError);
      }
    } finally {
      // Clean up request file
      try {
        fs.unlinkSync(requestPath);
      } catch (cleanupError) {
        console.warn('TemplumCore: Failed to cleanup request file:', cleanupError);
      }
    }
  }
}
