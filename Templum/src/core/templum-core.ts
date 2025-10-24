/**---
 * title: [Templum Core Engine - Universal Interface Orchestrator]
 * tags: [Core, Engine, Interface, Orchestration, Multi-Backend]
 * provides: [Interface Coordination, State Management, Backend Routing]
 * requires: [Interface Adapters, Skin Engine, Backend Services]
 * description: [Central orchestration engine managing all interface modalities]
 * ---*/

import * as path from 'path';
import type { EventEmitter } from 'events';
import { 
  InterfaceType, 
  InterfaceAdapter, 
  UniversalSkinDefinition, 
  CommandContext, 
  CommandResult, 
  CommandDefinition,
  WorkflowDefinition,
  TemplumConfiguration,
  TemplumSystemStatus,
  StateManagerStatus,
  StateUpdate,
  NotificationUpdate,
  BackendConnectionLifecycleEvent,
  BackendConnectionLifecycleState,
  type TemplumError,
  isTemplumError,
  ErrorSignalPayload
} from '../types/templum-types';
import { BackendStatus } from '../backend/backend-service-router';
import {
  buildCliIpcRequest,
  type CliIpcRequestPayload
} from '../backend/defaults/serialization-defaults';
import { serializeServiceManifest } from '../backend/schemas/service-manifest';
import { buildCLIMenuModel } from '../interfaces/cli-generator';
import {
  serialization,
  type SerializationOutcome,
  type SerializationMeta
} from '../utils/serialization-utils';
import { createLogger } from '../utils/logger';
import type { ErrorMetadata, ScopedErrorHandler } from '../utils/error-handler';
import { createInterval, type ManagedInterval } from '../utils/async-utils';

// Import dependency injection interfaces and registry
import {
  ISkinEngine,
  IBackendServiceRouter,
  IResourceManager,
  ITemplumCoreDependencies,
  IDependencyInjectionConfig
} from '../interfaces/core-component-interfaces';
import { ITemplumOrchestrator } from '../interfaces/templum-orchestrator-interface';
import { FallbackInterfaceAdapter } from '../interfaces/fallback-interface-adapter';
import { TemplumAdapterRegistry } from './adapter-registry';
import { UniversalInterfaceManager } from './universal-interface-manager';
import type { TemplumSessionManagerContract } from '../session/universal-session-manager.types';
import type {
  ManualOverrideOptions,
  ManualOverrideDescriptor,
  ManualOverrideSnapshot,
  ManualOverrideClearResult
} from '../backend/manual-override-manager';
interface TemplumCoreEvents extends TypedEventMap {
  initialized: (payload: { timestamp: number }) => void;
  initializationError: (payload: { error: string; timestamp: number }) => void;
  interfaceRegistered: (payload: {
    interfaceType: InterfaceType;
    timestamp: number;
    totalInterfaces: number;
  }) => void;
  skinLoaded: (payload: {
    skinId: string;
    skinName: string;
    compatibleInterfaces?: InterfaceType[];
    timestamp: number;
    backend?: string;
    cached?: boolean;
    loadTime?: number;
    validationStatus?: string;
  }) => void;
  skinLoadError: (payload: {
    backend: string;
    error: string;
    loadTime: number;
    timestamp: number;
  }) => void;
  commandExecuted: (payload: {
    command: string;
    sourceInterface: InterfaceType;
    result: CommandResult;
    timestamp: number;
  }) => void;
  commandError: (payload: {
    command: string;
    sourceInterface: InterfaceType;
    error: string;
    timestamp: number;
  }) => void;
  'backend-services-refreshed': (payload: { timestamp: number; status: unknown }) => void;
  'backend-refresh-error': (payload: { timestamp: number; error: string }) => void;
  'interface-switch': (payload: {
    timestamp: number;
    fromInterfaces: InterfaceType[];
    toInterface: InterfaceType;
    statePreserved: boolean;
    orchestrated: boolean;
    switchTime?: number;
  }) => void;
  shutdown: (payload: { timestamp: number }) => void;
  'backend:lifecycle': (payload: BackendConnectionLifecycleEvent) => void;
}
import { type TypedEventMap } from '../utils/event-utils';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import {
  captureScopedAsync,
  captureScopedSync,
  createTemplumCoreError,
  createTemplumCoreErrorHandler
} from './templum-core-error-handling';

type RegisteredCommand = CommandDefinition & {
  backend?: string;
  source?: 'core' | 'skin' | 'backend';
};

export class TemplumCore extends EventDrivenComponent<TemplumCoreEvents> implements ITemplumOrchestrator {
  private config: TemplumConfiguration;
  private initialized: boolean = false;
  private activeInterfaces: Set<InterfaceType> = new Set();
  private loadedSkins: Map<string, UniversalSkinDefinition> = new Map();
  private interfaceAdapters: Map<InterfaceType, InterfaceAdapter> = new Map();
  private commandRegistry: Map<string, RegisteredCommand> = new Map();
  
  // Dependency injection - components provided through registry
  private dependencies!: ITemplumCoreDependencies;
  private adapterRegistry: TemplumAdapterRegistry;
  
  // Universal Interface Manager - TASK-NEW-048: Interface Switching Implementation
  private universalInterfaceManager!: UniversalInterfaceManager;
  private teardownBackendLifecycleListener?: () => void;
  private backendLifecycleState: Map<string, BackendConnectionLifecycleEvent> = new Map();
  private sessionManager!: TemplumSessionManagerContract;
  private ipcCommandMonitor?: ManagedInterval;
  private readonly logger = createLogger('templum-core');
  private readonly errorHandler: ScopedErrorHandler = createTemplumCoreErrorHandler();

  constructor(
    config: Partial<TemplumConfiguration> = {},
    dependencyConfig?: IDependencyInjectionConfig
  ) {
    super('templum-core', 200);
    
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
      this.logWarn('Templum Core Engine already initialized');
      return;
    }

    const initializationError = await (async () => {
      // Initialize adapter registry and get dependencies
      await this.adapterRegistry.initialize();
      this.dependencies = this.adapterRegistry.getDependencies();
      this.sessionManager = this.dependencies.sessionManager;
      this.sessionManager.attachOrchestrator(this);
      this.logInfo('Templum Core Engine dependency injection complete');
      
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
      this.bootstrapUniversalInterfaceManager();
      this.logInfo('Universal Interface Manager initialized successfully');
      
      // Initialize backend service router with enhanced error handling (Haruspex pattern)
      const backendRouterResult = await captureScopedAsync(
        this.getScopedErrorHandler('initialize.backend-service-router', {
          operation: 'discover-and-connect'
        }),
        async () => {
          if (this.dependencies.backendServiceRouter && 'setOrchestrator' in this.dependencies.backendServiceRouter) {
            (this.dependencies.backendServiceRouter as any).setOrchestrator(this);
          }

          this.registerBackendLifecycleListeners();
          this.logInfo('Starting backend service router discovery...');
          await this.dependencies.backendServiceRouter.discoverAndConnect();

          const status = this.dependencies.backendServiceRouter.getConnectionStatus?.() ?? {
            totalConnections: 0,
            healthyConnections: 0,
            backends: {}
          };

          if (status.healthyConnections === 0) {
            this.logWarn('No healthy backend connections established', {
              totalAttempted: status.totalConnections,
              backendStates: status.backends
            });
          } else {
            this.logInfo('Backend service router discovery completed successfully', {
              totalConnections: status.totalConnections,
              healthyConnections: status.healthyConnections,
              availableBackends: Object.keys(status.backends),
              backendDetails: status.backends
            });
          }

          Object.entries(status.backends).forEach(([backendId, entry]) => {
            const backendStatus = entry as BackendStatus;
            if (backendStatus.health === 'error') {
              this.logError(`Backend ${backendId} connection failed: ${backendStatus.lastError || 'Unknown error'}`);
            } else if (backendStatus.health === 'unhealthy') {
              this.logWarn(`Backend ${backendId} connection unhealthy`, { responseTime: backendStatus.responseTime });
            }
          });

          return status;
        },
        { phase: 'initialization' }
      );

      const backendConnectionStatus = backendRouterResult.ok
        ? backendRouterResult.value
        : {
            totalConnections: 0,
            healthyConnections: 0,
            backends: {} as Record<string, BackendStatus>
          };

      if (!backendRouterResult.ok) {
        const templumError = backendRouterResult.error;
        this.logError('Backend service router initialization failed', templumError, {
          degradedMode: true
        });

        this.logWarn('Continuing initialization with degraded backend functionality', {
          degradedMode: true,
          context: templumError.context
        });
      }
      
      // Register core Templum services with resource manager for monitoring
      await this.registerCoreServicesForMonitoring();

      // Seed command registry with core command definitions before exposing execution APIs
      this.initializeDefaultCommands();
      
      this.initialized = true;
      this.emit('initialized', { timestamp: Date.now() });
      
      // Start IPC command monitoring for CLI communication
      this.startIPCCommandMonitoring();
      
      const backendSkinResult = await captureScopedAsync(
        this.getScopedErrorHandler('initialize.backend-skin-load', {
          phase: 'post-initialization'
        }),
        async () => {
          const connectionStatus =
            backendConnectionStatus ??
            this.dependencies.backendServiceRouter.getConnectionStatus?.() ?? { backends: {} };

          for (const [backendId, status] of Object.entries(connectionStatus.backends)) {
            const backendStatus = status as BackendStatus;
            if (!backendStatus.connected || backendStatus.health !== 'healthy') {
              continue;
            }

            const skinLoadResult = await captureScopedAsync(
              this.getScopedErrorHandler('initialize.backend-skin-load', {
                backendId
              }),
              async () => {
                this.logInfo(`Loading skin from backend ${backendId}...`);
                await this.loadBackendSkin(backendId);
                this.logInfo(`Successfully loaded skin from backend ${backendId}`);
              },
              { phase: 'initialization' }
            );

            if (!skinLoadResult.ok) {
              const templumError = skinLoadResult.error;
              this.logWarn(`Failed to load skin from backend ${backendId}`, {
                backendId,
                context: templumError.context,
                error: templumError.message
              });
            }
          }
        }
      );

      if (!backendSkinResult.ok) {
        const templumError = backendSkinResult.error;
        this.logWarn('Failed to load skins from backends after initialization', {
          context: templumError.context,
          error: templumError.message
        });
      }
      
      this.logInfo('Templum Core Engine initialization complete with dependency injection');
      return null;
    })().catch((error) => error);

    if (initializationError) {
      const errorMessage = isTemplumError(initializationError)
        ? initializationError.message
        : initializationError instanceof Error
          ? initializationError.message
          : 'Unknown error';

      const templumError = this.raiseScopedError(
        'initialize',
        initializationError,
        `Failed to initialize Templum Core Engine: ${errorMessage}`,
        'INITIALIZATION_ERROR',
        'configuration',
        { stage: 'initialize' }
      );

      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumCoreInitialization',
        error: templumError,
        severity: 'critical'
      };

      this.emit('initializationError', {
        error: templumError.message,
        timestamp: Date.now()
      });
      this.logError('Templum Core initialization failed', templumError, {
        stage: 'initialize',
        context: templumError.context,
        errorPayload
      });

      throw templumError;
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

    await this.sessionManager.ensureSessionForInterface(interfaceType);

    // Store adapter
    this.interfaceAdapters.set(interfaceType, adapter);
    this.activeInterfaces.add(interfaceType);
    
    // Register adapter with Universal Interface Manager - TASK-NEW-048
    if (this.universalInterfaceManager) {
      this.universalInterfaceManager.registerInterfaceAdapter(interfaceType, adapter);
    }

    await this.sessionManager.registerInterfaceAdapter(interfaceType, adapter);
    
    // Apply all loaded skins to new interface
    for (const skin of Array.from(this.loadedSkins.values())) {
      await adapter.applySkin(skin);
    }

    this.logInfo('Synchronizing state to newly registered interface', { interfaceType });
    const stateSnapshot = await this.buildStateUpdate();
    if (this.dependencies?.stateManager?.syncState) {
      await this.dependencies.stateManager.syncState(interfaceType, stateSnapshot, 'core-registration');
    }

    if (typeof adapter.syncState === 'function') {
      await adapter.syncState({ ...stateSnapshot, timestamp: Date.now() });
    }

    this.emit('interfaceRegistered', { 
      interfaceType, 
      timestamp: Date.now(),
      totalInterfaces: this.activeInterfaces.size
    });

    this.logInfo('Templum Core interface registered', {
      interfaceType,
      activeInterfaces: this.activeInterfaces.size
    });
  }

  async loadSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    if (!this.initialized) {
      throw new Error('Templum Core Engine must be initialized before loading skins');
    }

    // Basic skin validation - real component has different validation approach
    if (!skinDefinition.metadata?.id) {
      throw this.raiseScopedError(
        'load-skin.validation',
        undefined,
        'Invalid skin definition: missing required id',
        'SKIN_VALIDATION_ERROR',
        'validation',
        { field: 'metadata.id' }
      );
    }
    if (!skinDefinition.metadata?.name) {
      throw this.raiseScopedError(
        'load-skin.validation',
        undefined,
        'Invalid skin definition: missing required name',
        'SKIN_VALIDATION_ERROR',
        'validation',
        { field: 'metadata.name' }
      );
    }

    // Store skin definition
    this.loadedSkins.set(skinDefinition.metadata.id, skinDefinition);
    this.registerCommandsFromSkin(skinDefinition);

    const menuModelResult = captureScopedSync(
      this.getScopedErrorHandler('load-skin.cli-menu-model', {
        skinId: skinDefinition.metadata.id
      }),
      () => {
        const menuModel = buildCLIMenuModel(skinDefinition);
        this.dependencies.observabilityService?.logInfo(
          'CLI menu model generated',
          {
            skinId: skinDefinition.metadata.id,
            menuCount: Object.keys(menuModel.menuGraph).length
          },
          'TemplumCore'
        );
        return menuModel;
      },
      { operation: 'build-cli-menu-model' }
    );

    if (!menuModelResult.ok) {
      const templumError = menuModelResult.error;
      const logMetadata = {
        skinId: skinDefinition.metadata.id,
        context: templumError.context,
        error: templumError.message
      };

      this.logWarn('CLI generator failed to produce menu model', logMetadata);
      this.dependencies.observabilityService?.logWarn(
        'CLI menu model generation failed',
        logMetadata,
        'TemplumCore'
      );
    }

    // Apply skin across all active interfaces
    await this.applySkinToActiveInterfaces(skinDefinition);

    this.emit('skinLoaded', {
      skinId: skinDefinition.metadata.id,
      skinName: skinDefinition.metadata.name,
      compatibleInterfaces: skinDefinition.metadata.compatibleInterfaces,
      timestamp: Date.now()
    });

    this.logInfo('Templum Core skin loaded', {
      skinId: skinDefinition.metadata.id,
      skinName: skinDefinition.metadata.name
    });
  }

  async executeCommand(
    command: string,
    sourceInterface: InterfaceType,
    args: any[] = [],
    _context: CommandContext = {}
  ): Promise<CommandResult> {
    if (!this.initialized) {
      throw this.raiseScopedError(
        'execute-command.preflight',
        undefined,
        'Templum Core Engine must be initialized before executing commands',
        'CORE_NOT_INITIALIZED',
        'configuration'
      );
    }

    const startTime = Date.now();
    const resolvedCommand = this.resolveCommand(command);

    if (!resolvedCommand) {
      const errorMessage = `Unknown command: ${command}`;
      this.logWarn(errorMessage, { sourceInterface });
      const unknownResult: CommandResult = {
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

      return unknownResult;
    }

    return (async () => {
      this.logInfo(`Executing command '${command}'`, {
        sourceInterface,
        targetBackend: resolvedCommand.backend
      });
      
      // Enhanced real backend command execution with intelligent routing
      let executionResult: any;
      let selectedBackend: string | null = resolvedCommand.backend ?? null;
      const backendServiceRouter = this.dependencies.backendServiceRouter;
      const shouldRouteToBackend =
        !!backendServiceRouter &&
        selectedBackend !== null &&
        selectedBackend !== 'core';

      if (shouldRouteToBackend) {
        const backendPreflightMetadata = {
          command,
          requestedBackend: resolvedCommand.backend ?? 'unknown',
          sourceInterface
        };
        await (async () => {
          // TASK-SKIN-005: Two-tier backend prioritization system
          const systemStatus = this.getSystemStatus();
          const availableBackends = Object.entries(systemStatus.coreEngine.backendConnections.backends)
            .filter(([_, status]) => status.connected) // Only require connection, not health
            .map(([backendId, status]) => ({ backendId, status }));

          // Get the prioritized backends using the two-tier system
          const prioritizedBackends = this.prioritizeBackendsTwoTier(availableBackends);

          if (prioritizedBackends.length > 0) {
            // Select the best backend for command execution
            const prioritizedMatch = selectedBackend
              ? prioritizedBackends.find(candidate => candidate.backendId === selectedBackend)
              : undefined;

            selectedBackend = prioritizedMatch?.backendId ?? prioritizedBackends[0].backendId;
            this.logInfo(`Routing command '${command}' to backend`, {
              backendId: selectedBackend
            });
            
            // Execute command through real backend service
            if (!backendServiceRouter) {
              throw this.raiseScopedError(
                'execute-command.backend.preflight',
                undefined,
                'Backend service router not initialized',
                'SERVICE_NOT_READY',
                'configuration',
                backendPreflightMetadata
              );
            }
            
            if (typeof backendServiceRouter.executeCommand !== 'function') {
              throw this.raiseScopedError(
                'execute-command.backend.preflight',
                undefined,
                'Backend service router executeCommand method not available',
                'SERVICE_NOT_READY',
                'configuration',
                backendPreflightMetadata
              );
            }
            executionResult = await backendServiceRouter.executeCommand(
              selectedBackend,
              command,
              args
            );
            
            this.logInfo(`Command '${command}' executed successfully`, {
              backendId: selectedBackend
            });
            
          } else {
            this.logWarn('No healthy backends available for command execution', {
              requestedBackend: resolvedCommand.backend
            });
            throw this.raiseScopedError(
              'execute-command.backend.prioritization',
              undefined,
              'No healthy backends available for command execution',
              'BACKEND_UNAVAILABLE',
              'runtime',
              {
                command,
                requestedBackend: resolvedCommand.backend ?? 'unknown',
                sourceInterface
              }
            );
          }
          
        })().catch((backendError) => {
          const backendHandler = this.getScopedErrorHandler('execute-command.backend', {
            command,
            backendId: selectedBackend ?? resolvedCommand.backend ?? 'unknown',
            sourceInterface
          });
          const templumError = backendHandler.handle(backendError, {
            operation: 'backend-execution'
          });

          this.logWarn('Backend command execution failed, creating fallback result', {
            command,
            backendId: selectedBackend ?? resolvedCommand.backend,
            context: templumError.context,
            error: templumError.message
          });
          
          // Fallback to local execution result
          executionResult = { 
            executed: true, 
            timestamp: Date.now(),
            fallback: true,
            backendError: templumError.message
          };
        });
      } else {
        this.logWarn('Backend service router not available for command execution, creating local result', {
          requestedBackend: resolvedCommand.backend
        });
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
      await this.synchronizeInterfaceStates({ commandResult: result }).catch((syncError) => {
        const stateSyncHandler = this.getScopedErrorHandler('execute-command.state-sync', {
          command,
          backendId: selectedBackend ?? resolvedCommand.backend
        });
        const templumError = stateSyncHandler.handle(syncError, {
          operation: 'synchronize-interface-states'
        });

        this.logWarn('Interface state synchronization failed after command execution', {
          command,
          context: templumError.context,
          error: templumError.message
        });
        // Continue - synchronization failure shouldn't fail the command
      });

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
    })().catch((error) => {
      const scopedHandler = this.getScopedErrorHandler('execute-command', {
        command,
        sourceInterface
      });
      const templumError = scopedHandler.handle(error, {
        phase: 'command-execution'
      });
      
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: `CommandExecution:${command}`,
        error: templumError,
        severity: 'high'
      };
      
      const errorResult: CommandResult = {
        success: false,
        error: templumError.message,
        source: sourceInterface,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };

      this.emit('commandError', {
        command,
        sourceInterface,
        error: templumError.message,
        timestamp: Date.now()
      });

      this.logError('Templum Core command execution failed', templumError, {
        command,
        sourceInterface,
        context: templumError.context,
        errorPayload
      });
      return errorResult;
    });
  }

  resolveCommand(command: string): { backend: string; commandInfo: RegisteredCommand } | null {
    if (!this.initialized) {
      return null;
    }

    const commandInfo = this.commandRegistry.get(command);
    if (!commandInfo) {
      return null;
    }

    const workflow = commandInfo.workflow as (WorkflowDefinition & { backend?: string; targetBackend?: string }) | undefined;
    const backendFromWorkflow = workflow?.backend ?? workflow?.targetBackend;

    const backend =
      commandInfo.backend ??
      (typeof backendFromWorkflow === 'string' ? backendFromWorkflow : undefined) ??
      (this.dependencies?.backendServiceRouter ? 'pcl' : 'core');

    return {
      backend,
      commandInfo
    };
  }

  async synchronizeInterfaceStates(update: any): Promise<void> {
    const normalizedPayload = this.normalizeStateUpdate(update);
    const baseUpdate = await this.buildStateUpdate(normalizedPayload);

    for (const [interfaceType, adapter] of Array.from(this.interfaceAdapters.entries())) {
      await (async () => {
        const interfaceUpdate: StateUpdate = {
          ...baseUpdate,
          timestamp: Date.now()
        };

        if (this.dependencies?.stateManager?.syncState) {
          await this.dependencies.stateManager.syncState(
            interfaceType, 
            { ...interfaceUpdate }, 
            'templum-core'
          );
        }

        if (typeof adapter?.syncState === 'function') {
          await adapter.syncState({ ...interfaceUpdate });
        }

        this.logInfo('State synchronized to interface', { interfaceType });
      })().catch((error) => {
        const syncHandler = this.getScopedErrorHandler('state-sync.interface', {
          interfaceType
        });
        const templumError = syncHandler.handle(error, {
          operation: 'synchronize-interface-states'
        });

        this.logError(`Failed to sync state to ${interfaceType} interface`, templumError, {
          interfaceType,
          context: templumError.context
        });
      });
    }
  }

  private async buildStateUpdate(partialUpdate: Partial<StateUpdate> = {}): Promise<StateUpdate> {
    let managerState: any = {};

    if (this.dependencies?.stateManager?.getCurrentState) {
      const maybeState = this.dependencies.stateManager.getCurrentState();
      managerState = await Promise.resolve(maybeState).catch((error) => {
        const stateManagerHandler = this.getScopedErrorHandler('state-update.state-manager', {
          operation: 'get-current-state'
        });
        const templumError = stateManagerHandler.handle(error, {
          operation: 'get-current-state'
        });
        this.logWarn('State manager getCurrentState failed', {
          error: templumError.message,
          context: templumError.context
        });
        return {};
      }) ?? {};
    }

    const notificationsCandidate =
      partialUpdate.notifications ??
      (Array.isArray(managerState?.notifications) ? managerState.notifications : undefined);
    const notifications = Array.isArray(notificationsCandidate) ? notificationsCandidate : [];

    return {
      timestamp: partialUpdate.timestamp ?? Date.now(),
      globalState: partialUpdate.globalState ?? managerState?.globalState ?? {},
      sessionState: partialUpdate.sessionState ?? managerState?.sessionState ?? {},
      treeViewUpdates: partialUpdate.treeViewUpdates ?? managerState?.treeViewUpdates ?? {},
      webviewUpdates: partialUpdate.webviewUpdates ?? managerState?.webviewUpdates ?? {},
      menuUpdates: partialUpdate.menuUpdates ?? managerState?.menuUpdates ?? {},
      statusUpdates: partialUpdate.statusUpdates ?? managerState?.statusUpdates ?? {},
      commandResult: partialUpdate.commandResult ?? managerState?.commandResult,
      notifications
    };
  }

  private normalizeStateUpdate(update: any): Partial<StateUpdate> {
    if (!update) {
      return {};
    }

    if (typeof update !== 'object') {
      return { commandResult: update };
    }

    const candidate = update as Partial<StateUpdate>;
    const knownKeys: (keyof StateUpdate)[] = [
      'globalState',
      'sessionState',
      'treeViewUpdates',
      'webviewUpdates',
      'menuUpdates',
      'statusUpdates',
      'commandResult',
      'notifications'
    ];

    const hasKnownShape = knownKeys.some(key => key in candidate);
    if (hasKnownShape) {
      const { timestamp, ...rest } = candidate;
      return {
        ...rest,
        timestamp: typeof timestamp === 'number' ? timestamp : Date.now()
      };
    }

    return { commandResult: candidate };
  }

  private registerCommandsFromSkin(skinDefinition: UniversalSkinDefinition): void {
    const { commands } = skinDefinition;
    if (!commands) {
      return;
    }

    Object.entries(commands).forEach(([key, value]) => {
      if (!this.isCommandDefinition(value)) {
        return;
      }

      const commandId = this.resolveCommandIdentifier(key, value);
      if (!commandId) {
        return;
      }

      this.registerCommand(commandId, {
        ...value,
        backend: skinDefinition.metadata?.backend,
        source: 'skin'
      });
    });

    if (Array.isArray(commands.primary)) {
      commands.primary
        .filter(item => this.isCommandDefinition(item))
        .forEach(definition => {
          const commandId = this.resolveCommandIdentifier(undefined, definition);
          if (!commandId) {
            return;
          }
          this.registerCommand(commandId, {
            ...definition,
            backend: skinDefinition.metadata?.backend,
            source: 'skin'
          });
        });
    }
  }

  private initializeDefaultCommands(): void {
    const defaultCommands: Record<string, RegisteredCommand> = {
      'test-command': {
        title: 'Test Command',
        description: 'Internal verification command for orchestration flows',
        handler: 'templum.core.testCommand',
        backend: 'pcl',
        source: 'core'
      },
      'analyze-code': {
        title: 'Analyze Code',
        description: 'Triggers backend analysis pipeline for active code',
        handler: 'templum.backend.analyzeCode',
        backend: 'pcl',
        source: 'core'
      }
    };

    Object.entries(defaultCommands).forEach(([commandId, definition]) => {
      if (!this.commandRegistry.has(commandId)) {
        this.registerCommand(commandId, definition);
      }
    });
  }

  private registerCommand(commandId: string, commandDefinition: RegisteredCommand): void {
    this.commandRegistry.set(commandId, {
      ...commandDefinition,
      source: commandDefinition.source ?? 'core'
    });
  }

  private isCommandDefinition(value: unknown): value is CommandDefinition {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<CommandDefinition>;
    return typeof candidate.title === 'string' && typeof candidate.description === 'string';
  }

  private resolveCommandIdentifier(
    candidateKey: string | undefined,
    definition: CommandDefinition
  ): string | undefined {
    const reservedKeys = new Set(['primary', 'aliases', 'help', 'completions']);
    if (candidateKey && !reservedKeys.has(candidateKey)) {
      return candidateKey;
    }

    const extended = definition as CommandDefinition & Partial<Record<'id' | 'command' | 'name', string>>;

    if (typeof extended.id === 'string' && extended.id.trim().length > 0) {
      return extended.id;
    }

    if (typeof extended.command === 'string' && extended.command.trim().length > 0) {
      return extended.command;
    }

    if (typeof extended.name === 'string' && extended.name.trim().length > 0) {
      return extended.name;
    }

    return definition.title?.trim().length ? definition.title : undefined;
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

  getLoadedSkins(): UniversalSkinDefinition[] {
    return Array.from(this.loadedSkins.values());
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
      throw this.raiseScopedError(
        'refresh-backend-services.preflight',
        undefined,
        'Cannot refresh backend services: Templum core not initialized',
        'CORE_NOT_INITIALIZED',
        'runtime'
      );
    }

    await (async () => {
      this.logInfo('Refreshing backend services via backend service router');
      
      if (!this.dependencies.backendServiceRouter) {
        throw this.raiseScopedError(
          'refresh-backend-services.preflight',
          undefined,
          'Backend service router not available',
          'BACKEND_ROUTER_UNAVAILABLE',
          'configuration',
          { operation: 'discover-and-connect' }
        );
      }
      
      // Use existing backend service router to rediscover and reconnect to services
      await this.dependencies.backendServiceRouter.discoverAndConnect();
      
      this.logInfo('Backend service refresh completed successfully');
      
      // Emit event to notify interested components
      this.emit('backend-services-refreshed', {
        timestamp: Date.now(),
        status: this.dependencies?.backendServiceRouter?.getConnectionStatus?.() || { healthy: false, lastCheck: Date.now(), services: {} }
      });
      
    })().catch((error) => {
      const scopedHandler = this.getScopedErrorHandler('refresh-backend-services', {
        operation: 'discover-and-connect'
      });
      const templumError = scopedHandler.handle(error, {
        phase: 'refresh'
      });

      this.logError('Backend service refresh failed', templumError, {
        context: templumError.context
      });
      
      // Emit error event
      this.emit('backend-refresh-error', {
        timestamp: Date.now(),
        error: templumError.message
      });
      
      throw templumError;
    });
  }

  /**
   * TASK-CLI-004: Register Templum service for CLI discovery
   * Creates registry entry for separate CLI process to discover and connect
   */
  async registerForCliDiscovery(): Promise<void> {
    if (!this.initialized) {
      throw this.raiseScopedError(
        'cli-discovery.preflight',
        undefined,
        'Cannot register for CLI discovery: Templum core not initialized',
        'CORE_NOT_INITIALIZED',
        'runtime'
      );
    }

    let serviceFilePath: string | undefined;

    await (async () => {
      this.logInfo('Registering Templum service for CLI discovery');
      
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
      
      serviceFilePath = path.join(servicesDir, `templum-core-${process.pid}.json`);
      const now = Date.now();
      const manifestPayload = serializeServiceManifest({
        id: `templum-core-${process.pid}`,
        name: 'Templum Core',
        endpoint: `ipc://templum-core-${process.pid}`,
        protocol: 'ipc',
        version: '1.0.0',
        capabilities: this.getSupportedInterfaces(),
        registrationTime: now,
        lastSeen: now,
        pid: process.pid,
        health: '/health',
        healthCheck: {
          type: 'ipc',
          timeoutMs: 5000,
        },
        metadata: {
          httpEndpoint: `http://localhost:${this.getHttpPort()}`,
        },
        options: {
          workspaceMarkers: ['.templum', '.haruspex', '.git', '.vscode'],
          connectionDir: '.haruspex',
          connectionFile: 'haruspex-debug-connection.json',
        },
      });

      require('fs').writeFileSync(serviceFilePath, manifestPayload, 'utf8');
      
      this.logInfo('Service registered for CLI discovery', { serviceFilePath });
      
      // Setup cleanup on process exit
      const cleanupServiceEntry = () => {
        if (!serviceFilePath || !require('fs').existsSync(serviceFilePath)) {
          return;
        }

        const cleanupResult = captureScopedSync(
          this.getScopedErrorHandler('cli-discovery.cleanup', {
            serviceFilePath
          }),
          () => {
            require('fs').unlinkSync(serviceFilePath);
            this.logInfo('Service registry entry cleaned up', { serviceFilePath });
          },
          { operation: 'cleanup-service-registry-entry' }
        );

        if (!cleanupResult.ok) {
          const templumError = cleanupResult.error;
          this.logWarn('Failed to clean up service registry entry', {
            serviceFilePath,
            context: templumError.context,
            error: templumError.message
          });
        }
      };
      
      process.on('exit', cleanupServiceEntry);
      process.on('SIGINT', cleanupServiceEntry);
      process.on('SIGTERM', cleanupServiceEntry);
      
    })().catch((error) => {
      const scopedHandler = this.getScopedErrorHandler('cli-discovery.register', {
        serviceFilePath
      });
      const templumError = scopedHandler.handle(error, {
        operation: 'register-cli-discovery'
      });
      
      this.logError('Failed to register for CLI discovery', templumError, {
        serviceFilePath,
        context: templumError.context
      });
      
      throw templumError;
    });
  }

  async switchInterface(targetInterface: InterfaceType): Promise<{ success: boolean; message: string }> {
    if (!this.initialized) {
      return {
        success: false,
        message: 'Templum Core not initialized'
      };
    }

    if (!this.universalInterfaceManager) {
      return this.basicSwitchInterface(targetInterface);
    }

    const currentInterfaces = Array.from(this.activeInterfaces);
    const scopedHandler = this.getScopedErrorHandler('interface-switch', {
      targetInterface
    });
    const switchResult = await scopedHandler.captureAsync(
      async () => {
        const result = await this.universalInterfaceManager.executeInterfaceSwitch(targetInterface, {
          preserveSession: true,
          migrateState: true,
          maintainConnections: true,
          performanceMetrics: true
        });

        if (result.success) {
          this.activeInterfaces.clear();
          this.activeInterfaces.add(targetInterface);

          this.emit('interface-switch', {
            timestamp: Date.now(),
            fromInterfaces: currentInterfaces,
            toInterface: targetInterface,
            statePreserved: true,
            switchTime: result.switchTime,
            orchestrated: true
          });

          this.logInfo('Interface switched via Universal Interface Manager', {
            fromInterfaces: currentInterfaces,
            targetInterface,
            switchTime: result.switchTime
          });
        }

        return result;
      },
      { operation: 'execute-interface-switch' }
    );

    if (switchResult.ok) {
      return switchResult.value;
    }

    const templumError = switchResult.error;
    this.logError('Interface switch failed', templumError, {
      targetInterface,
      context: templumError.context
    });

    return {
      success: false,
      message: `Interface switch failed: ${templumError.message}`
    };
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
    const stateManager = this.dependencies?.stateManager;
    if (stateManager && currentInterfaces.length > 0) {
      const scopedHandler = this.getScopedErrorHandler('interface-switch.preserve-state', {
        targetInterface
      });
      const preserveResult = await scopedHandler.captureAsync(
        async () => (stateManager as any).getState?.(),
        { operation: 'preserve-state' }
      );

      if (preserveResult.ok) {
        preservedState = preserveResult.value;
      } else {
        this.logWarn('Failed to preserve state during interface switch', {
          targetInterface,
          context: preserveResult.error.context,
          error: preserveResult.error.message
        });
      }
    }

    // Deactivate current interfaces (but don't remove adapters)
    this.activeInterfaces.clear();

    // Activate target interface
    this.activeInterfaces.add(targetInterface);

    // Restore preserved state to new interface if available
    if (preservedState && stateManager) {
      const scopedHandler = this.getScopedErrorHandler('interface-switch.restore-state', {
        targetInterface
      });
      const restoreResult = await scopedHandler.captureAsync(
        async () => (stateManager as any).setState?.(preservedState),
        { operation: 'restore-state' }
      );

      if (restoreResult.ok) {
        this.logInfo('State preserved and restored during interface switch', {
          targetInterface
        });
      } else {
        this.logWarn('Failed to restore state after interface switch', {
          targetInterface,
          context: restoreResult.error.context,
          error: restoreResult.error.message
        });
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

    this.logInfo('Interface switched in basic mode', {
      fromInterfaces: currentInterfaces,
      targetInterface
    });

    return { 
      success: true, 
      message: `Successfully switched to ${targetInterface} interface (basic mode)` 
    };
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    const scopedHandler = this.getScopedErrorHandler('shutdown', {
      phase: 'teardown'
    });
    const shutdownResult = await scopedHandler.captureAsync(
      async () => {
        this.stopIPCCommandMonitoring();

        for (const [interfaceType, adapter] of Array.from(this.interfaceAdapters.entries())) {
          const adapterHandler = this.getScopedErrorHandler('shutdown.dispose-interface-adapter', {
            interfaceType
          });
          const disposeResult = await adapterHandler.captureAsync(
            async () => adapter.dispose(),
            { operation: 'adapter-disposal' }
          );

          if (!disposeResult.ok) {
            this.logError('Failed to dispose interface adapter during shutdown', disposeResult.error, {
              interfaceType,
              context: disposeResult.error.context
            });
          }
        }

        if (this.sessionManager && 'stopSession' in this.sessionManager) {
          const sessionHandler = this.getScopedErrorHandler('shutdown.session-manager', {
            component: 'session-manager'
          });
          const stopResult = await sessionHandler.captureAsync(
            async () => (this.sessionManager as any).stopSession?.(),
            { operation: 'stop-session' }
          );

          if (!stopResult.ok) {
            this.logWarn('Failed to stop session manager during shutdown', {
              context: stopResult.error.context,
              error: stopResult.error.message
            });
          }
        }

        if (this.dependencies?.stateManager?.shutdown) {
          await this.dependencies.stateManager.shutdown();
        }

        if (this.dependencies?.backendRouter?.shutdown) {
          await this.dependencies.backendRouter.shutdown();
        }

        if (this.dependencies?.backendServiceRouter?.cleanup) {
          await this.dependencies.backendServiceRouter.cleanup();
        }

        await this.adapterRegistry.dispose();

        this.activeInterfaces.clear();
        this.interfaceAdapters.clear();
        this.loadedSkins.clear();
        this.initialized = false;

        this.emit('shutdown', { timestamp: Date.now() });
        this.removeAllListeners();
        this.cleanupEvents();

        this.logInfo('Templum Core Engine shutdown complete with dependency injection cleanup');
      },
      { operation: 'shutdown' }
    );

    if (!shutdownResult.ok) {
      this.logError('Templum Core shutdown failed', shutdownResult.error, {
        context: shutdownResult.error.context
      });
      throw shutdownResult.error;
    }
  }

  private async applySkinToActiveInterfaces(skinDef: UniversalSkinDefinition): Promise<void> {
    const compatibleInterfaces = skinDef.metadata.compatibleInterfaces;

    for (const [interfaceType, adapter] of Array.from(this.interfaceAdapters.entries())) {
      if (!compatibleInterfaces.includes(interfaceType)) {
        continue;
      }

      const scopedHandler = this.getScopedErrorHandler('skin-application.apply-to-interface', {
        interfaceType,
        skinId: skinDef.metadata.id
      });
      const applyResult = await scopedHandler.captureAsync(
        async () => adapter.applySkin(skinDef),
        { operation: 'apply-skin-to-interface' }
      );

      if (!applyResult.ok) {
        this.logError('Failed to apply skin to interface during initialization', applyResult.error, {
          interfaceType,
          skinId: skinDef.metadata.id,
          context: applyResult.error.context
        });
      }
    }
  }

  private async initializeInterfaceAdapters(): Promise<void> {
    const adapters = this.adapterRegistry.buildInterfaceAdapters();

    for (const [adapterKey, adapter] of Object.entries(adapters)) {
      if (!adapter) {
        continue;
      }

      const interfaceType = adapterKey as InterfaceType;
      this.interfaceAdapters.set(interfaceType, adapter);

      const registrationHandler = this.getScopedErrorHandler('interface-adapters.session-registration', {
        interfaceType
      });
      const registrationResult = await registrationHandler.captureAsync(
        async () => {
          if (this.sessionManager?.ensureSessionForInterface) {
            await this.sessionManager.ensureSessionForInterface(interfaceType);
          }

          if (this.sessionManager?.registerInterfaceAdapter) {
            await this.sessionManager.registerInterfaceAdapter(interfaceType, adapter);
          }
        },
        { operation: 'register-interface-adapter' }
      );

      if (!registrationResult.ok) {
        this.logWarn('Failed to register interface adapter with session manager during bootstrap', {
          interfaceType,
          context: registrationResult.error.context,
          error: registrationResult.error.message
        });
      }

      const initializeHandler = this.getScopedErrorHandler('interface-adapters.adapter-initialize', {
        interfaceType
      });
      const initializeResult = await initializeHandler.captureAsync(
        async () => {
          if (typeof (adapter as any).initialize === 'function') {
            await (adapter as any).initialize(this);
          }
        },
        { operation: 'initialize-interface-adapter' }
      );

      if (!initializeResult.ok) {
        this.logWarn('Failed to initialize interface adapter during bootstrap', {
          interfaceType,
          context: initializeResult.error.context,
          error: initializeResult.error.message
        });
      }
    }

    this.bootstrapUniversalInterfaceManager();

    const supportedInterfaces = this.getSupportedInterfaces();
    for (const interfaceType of supportedInterfaces) {
      if (this.interfaceAdapters.has(interfaceType)) {
        continue;
      }

      const fallbackAdapter = new FallbackInterfaceAdapter(interfaceType);
      this.interfaceAdapters.set(interfaceType, fallbackAdapter);

      const fallbackHandler = this.getScopedErrorHandler('interface-adapters.fallback-registration', {
        interfaceType
      });
      const fallbackRegistration = await fallbackHandler.captureAsync(
        async () => {
          if (this.sessionManager?.ensureSessionForInterface) {
            await this.sessionManager.ensureSessionForInterface(interfaceType);
          }

          if (this.sessionManager?.registerInterfaceAdapter) {
            await this.sessionManager.registerInterfaceAdapter(interfaceType, fallbackAdapter);
          }
        },
        { operation: 'register-fallback-adapter' }
      );

      if (!fallbackRegistration.ok) {
        this.logWarn('Failed to register fallback adapter during bootstrap', {
          interfaceType,
          context: fallbackRegistration.error.context,
          error: fallbackRegistration.error.message
        });
      }

      this.logInfo('Templum Core registered fallback interface adapter', {
        interfaceType
      });
    }

    this.logInfo('Interface adapters initialization complete');
  }

  private bootstrapUniversalInterfaceManager(): void {
    if (!this.universalInterfaceManager) {
      return;
    }

    for (const [interfaceType, adapter] of Array.from(this.interfaceAdapters.entries())) {
      const scopedHandler = this.getScopedErrorHandler('universal-interface-manager.register-adapter', {
        interfaceType
      });
      const registrationResult = scopedHandler.capture(
        () => {
          this.universalInterfaceManager.registerInterfaceAdapter(interfaceType, adapter);
          return true;
        },
        { operation: 'register-interface-adapter' }
      );

      if (!registrationResult.ok) {
        this.logWarn('Failed to register adapter with Universal Interface Manager', {
          interfaceType,
          context: registrationResult.error.context,
          error: registrationResult.error.message
        });
      }
    }
  }

  private registerBackendLifecycleListeners(): void {
    const router = this.dependencies?.backendServiceRouter;
    if (!router) {
      return;
    }

    if (this.teardownBackendLifecycleListener) {
      this.teardownBackendLifecycleListener();
      this.teardownBackendLifecycleListener = undefined;
    }

    const handler = (event: BackendConnectionLifecycleEvent) => {
      this.handleBackendLifecycleEvent(event);
    };

    if (router.onLifecycleEvent) {
      this.teardownBackendLifecycleListener = router.onLifecycleEvent(handler);
      return;
    }

    const emitter = router as unknown as EventEmitter;
    if (typeof emitter.on === 'function' && typeof emitter.off === 'function') {
      emitter.on('connection:lifecycle', handler);
      this.teardownBackendLifecycleListener = () => emitter.off('connection:lifecycle', handler);
    }
  }

  private handleBackendLifecycleEvent(event: BackendConnectionLifecycleEvent): void {
    this.backendLifecycleState.set(event.backendId, event);
    this.emit('backend:lifecycle', event);
    this.logLifecycleEvent(event);
    void this.forwardBackendLifecycleEvent(event);
  }

  private async forwardBackendLifecycleEvent(event: BackendConnectionLifecycleEvent): Promise<void> {
    const stateManager = this.dependencies?.stateManager;
    const scopedHandler = this.getScopedErrorHandler('backend-lifecycle.forward-event', {
      backendId: event.backendId,
      state: event.state
    });

    const forwardResult = await scopedHandler.captureAsync(
      async () => {
        if (stateManager?.handleBackendLifecycleEvent) {
          await stateManager.handleBackendLifecycleEvent(event);
        }
        await this.broadcastBackendLifecycleState(event);
      },
      { operation: 'forward-backend-lifecycle-event' }
    );

    if (!forwardResult.ok) {
      this.logWarn('Failed to propagate backend lifecycle event', {
        backendId: event.backendId,
        state: event.state,
        context: forwardResult.error.context,
        error: forwardResult.error.message
      });
    }
  }

  private async broadcastBackendLifecycleState(event: BackendConnectionLifecycleEvent): Promise<void> {
    const stateManager = this.dependencies?.stateManager;
    const syncState = stateManager?.syncState?.bind(stateManager);

    if (!syncState || this.activeInterfaces.size === 0) {
      return;
    }

    const update = this.buildBackendLifecycleStateUpdate(event);
    const interfaceTypes = Array.from(this.activeInterfaces);
    await Promise.all(interfaceTypes.map((interfaceType) => syncState(interfaceType, update, 'backend-lifecycle')));
  }

  private buildBackendLifecycleStateUpdate(event: BackendConnectionLifecycleEvent): StateUpdate {
    const snapshot: Record<string, BackendConnectionLifecycleEvent> = {};
    for (const [backendId, details] of Array.from(this.backendLifecycleState.entries())) {
      snapshot[backendId] = details;
    }

    const statusKey = `backend:${event.backendId}`;
    const notification = this.buildBackendLifecycleNotification(event);

    const update: StateUpdate = {
      timestamp: Date.now(),
      globalState: {
        backendLifecycle: snapshot
      },
      statusUpdates: {
        [statusKey]: {
          text: `${event.backendId}: ${this.resolveLifecycleDescription(event.state)}`,
          tooltip: event.error?.message,
          color: this.resolveLifecycleColor(event.state)
        }
      }
    };

    if (notification) {
      update.notifications = [notification];
    }

    return update;
  }

  private buildBackendLifecycleNotification(event: BackendConnectionLifecycleEvent): NotificationUpdate | undefined {
    if (event.state === 'connected' || event.state === 'recovered') {
      return undefined;
    }

    const type: NotificationUpdate['type'] = event.state === 'failed' ? 'error' : 'warning';

    return {
      type,
      message: `Backend ${event.backendId} ${this.resolveLifecycleDescription(event.state)}`,
      timestamp: Date.now()
    };
  }

  private logLifecycleEvent(event: BackendConnectionLifecycleEvent): void {
    const payload = {
      backendId: event.backendId,
      state: event.state,
      attempts: event.attempts,
      retryAttempts: event.retryAttempts,
      origin: event.origin,
      error: event.error?.message
    };

    switch (event.state) {
      case 'connected':
      case 'recovered':
        this.logInfo(`Backend ${event.backendId} ${event.state}`, payload);
        break;
      case 'disconnected':
        this.logWarn(`Backend ${event.backendId} disconnected`, payload);
        break;
      case 'health-degraded':
        this.logWarn(`Backend ${event.backendId} health-degraded`, payload);
        break;
      case 'failed':
        this.logWarn(`Backend ${event.backendId} connection failed`, payload);
        break;
      default:
        this.logInfo(`Backend ${event.backendId} lifecycle event: ${event.state}`, payload);
        break;
    }
  }

  private resolveLifecycleDescription(state: BackendConnectionLifecycleState): string {
    switch (state) {
      case 'connected':
        return 'connected';
      case 'disconnected':
        return 'disconnected';
      case 'recovered':
        return 'recovered';
      case 'health-degraded':
        return 'health-degraded';
      case 'failed':
      default:
        return 'failed';
    }
  }

  private resolveLifecycleColor(state: BackendConnectionLifecycleState): string {
    switch (state) {
      case 'connected':
      case 'recovered':
        return 'success';
      case 'health-degraded':
      case 'disconnected':
        return 'warning';
      case 'failed':
      default:
        return 'error';
    }
  }


  private setupEventListeners(): void {
    this.on('initialized', ({ timestamp }) => {
      this.logInfo('Templum Core Engine initialized', {
        timestamp: new Date(timestamp).toISOString()
      });
    });

    this.on('interfaceRegistered', ({ interfaceType, totalInterfaces }) => {
      this.logInfo('Interface registered event received', {
        interfaceType,
        totalInterfaces
      });
    });

    this.on('skinLoaded', ({ skinId, skinName }) => {
      this.logInfo('Skin loaded event received', {
        skinId,
        skinName
      });
    });

    this.on('commandExecuted', ({ command, sourceInterface }) => {
      this.logInfo('Command executed event received', {
        command,
        sourceInterface
      });
    });

    this.on('commandError', ({ command, sourceInterface, error: errorPayload }) => {
      const errorMessage = typeof errorPayload === 'string' ? errorPayload : String(errorPayload);
      this.logError('Command error event received', undefined, {
        command,
        sourceInterface,
        errorMessage
      });
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
      throw this.raiseScopedError(
        'backend-router.get',
        undefined,
        'Backend service router not initialized',
        'SERVICE_NOT_READY',
        'configuration'
      );
    }
    return this.dependencies.backendServiceRouter;
  }

  async applyManualOverride(
    serviceId: string,
    options?: ManualOverrideOptions
  ): Promise<ManualOverrideDescriptor> {
    if (!this.initialized) {
      throw this.raiseScopedError(
        'manual-override.apply.preflight',
        undefined,
        'Templum Core not initialized',
        'SERVICE_NOT_READY',
        'configuration'
      );
    }

    const backendRouter = this.getBackendRouter();
    if (!backendRouter.applyManualOverride) {
      throw this.raiseScopedError(
        'manual-override.apply.unsupported',
        undefined,
        'Manual override operations are unavailable in the current backend router',
        'MANUAL_OVERRIDE_UNSUPPORTED',
        'configuration',
        { serviceId }
      );
    }

    const descriptor = await backendRouter.applyManualOverride(serviceId, options);
    this.dependencies?.observabilityService?.recordManualOverrideEvent('applied', descriptor);
    return descriptor;
  }

  async clearManualOverride(serviceId?: string): Promise<ManualOverrideClearResult> {
    if (!this.initialized) {
      throw this.raiseScopedError(
        'manual-override.clear.preflight',
        undefined,
        'Templum Core not initialized',
        'SERVICE_NOT_READY',
        'configuration'
      );
    }

    const backendRouter = this.getBackendRouter();
    if (!backendRouter.clearManualOverride) {
      throw this.raiseScopedError(
        'manual-override.clear.unsupported',
        undefined,
        'Manual override operations are unavailable in the current backend router',
        'MANUAL_OVERRIDE_UNSUPPORTED',
        'configuration',
        { serviceId: serviceId ?? '$all' }
      );
    }

    const result = await backendRouter.clearManualOverride(serviceId);
    const descriptorForLogging: ManualOverrideDescriptor = result.descriptor ?? {
      serviceId: serviceId ?? '$all',
      scope: 'session',
      appliedAt: Date.now()
    };
    this.dependencies?.observabilityService?.recordManualOverrideEvent('cleared', descriptorForLogging);
    return result;
  }

  getManualOverrideSnapshot(): ManualOverrideSnapshot {
    if (!this.initialized) {
      return { overrides: [], updatedAt: Date.now() };
    }

    const backendRouter = this.getBackendRouter();
    if (!backendRouter.getManualOverrideSnapshot) {
      return { overrides: [], updatedAt: Date.now() };
    }

    return backendRouter.getManualOverrideSnapshot();
  }

  /**
   * Get Universal Skin Engine instance for rendering operations
   * Uses dependency injection to provide skin engine
   */
  getUniversalSkinEngine(): ISkinEngine {
    if (!this.dependencies?.skinEngine) {
      throw this.raiseScopedError(
        'skin-engine.get',
        undefined,
        'Universal Skin Engine not initialized',
        'SERVICE_NOT_READY',
        'configuration'
      );
    }
    return this.dependencies.skinEngine;
  }

  /**
   * Get Universal Interface Manager instance for interface switching coordination
   * TASK-NEW-048: Interface Switching Implementation
   */
  getUniversalInterfaceManager(): UniversalInterfaceManager {
    if (!this.universalInterfaceManager) {
      throw this.raiseScopedError(
        'interface-manager.get',
        undefined,
        'Universal Interface Manager not initialized',
        'SERVICE_NOT_READY',
        'configuration'
      );
    }
    return this.universalInterfaceManager;
  }

  getSessionManager(): TemplumSessionManagerContract {
    if (!this.sessionManager) {
      throw this.raiseScopedError(
        'session-manager.get',
        undefined,
        'Session manager not initialized',
        'SERVICE_NOT_READY',
        'configuration'
      );
    }
    return this.sessionManager;
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
      throw this.raiseScopedError(
        'backend-skin.load.preflight',
        undefined,
        'Templum Core not initialized',
        'SERVICE_NOT_READY',
        'configuration',
        { backendId }
      );
    }

    const cacheKey = `backend:${backendId}`;
    const startTime = Date.now();

    const scopedHandler = this.getScopedErrorHandler('backend-skin.load', {
      backendId
    });
    const loadResult = await scopedHandler.captureAsync(
      async () => {
      // Check enhanced cache first with TTL validation
      const cachedEntry = this.skinCache.get(cacheKey);
      if (cachedEntry && this.isCacheEntryValid(cachedEntry)) {
        // Update cache metrics and access patterns
        this.skinCacheMetrics.hits++;
        cachedEntry.lastAccessed = Date.now();
        cachedEntry.accessCount++;
        
        // Update resource access time for cached entry
        this.dependencies.resourceManager.updateResourceAccess(`skin-cache-${cacheKey}`);
        
        this.logInfo('Loaded backend skin from cache', {
          backendId,
          cacheHitRate: this.getCacheHitRate()
        });
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
          this.logInfo('Cleaned up enhanced skin cache resource', {
            backendId
          });
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
          throw this.raiseScopedError(
            'backend-skin.load.validation',
            undefined,
            `Skin validation failed for ${backendId}: ${validationResult.errors.join(', ')}`,
            'SKIN_VALIDATION_ERROR',
            'validation',
            {
              backendId,
              validationErrors: [...validationResult.errors]
            }
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

        const broadcastHandler = this.getScopedErrorHandler('backend-skin.apply-to-interface', {
          backendId,
          skinId: rawSkinDefinition.metadata.id
        });
        const broadcastResult = await broadcastHandler.captureAsync(
          async () => this.applySkinToActiveInterfaces(rawSkinDefinition),
          { operation: 'apply-backend-skin' }
        );

        if (!broadcastResult.ok) {
          this.logWarn('Templum Core: Failed to broadcast backend skin to active interfaces', {
            backendId,
            skinId: rawSkinDefinition.metadata.id,
            context: broadcastResult.error.context,
            error: broadcastResult.error.message
          });
        }

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

        this.logInfo('Loaded and cached backend skin', {
          backendId,
          skinId: rawSkinDefinition.metadata.id,
          loadTime,
          skinSize: this.formatBytes(skinSize)
        });
        
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
      
    },
      { operation: 'load-backend-skin' }
    );

    if (loadResult.ok) {
      return loadResult.value;
    }

    const loadTime = Date.now() - startTime;
    this.skinCacheMetrics.totalLoadTime += loadTime;

    this.logError('Failed to load backend skin', loadResult.error, {
      backendId,
      loadTime,
      context: loadResult.error.context
    });

    this.emit('skinLoadError', {
      backend: backendId,
      error: loadResult.error.message,
      loadTime,
      timestamp: Date.now()
    });

    return null;
  }

  /**
   * Comprehensive skin definition validation - TASK-NEW-009 enhancement
   * Validates both templum-types and universal-skin-engine-types formats
   */
  private validateSkinDefinitionComprehensive(skinDef: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const validationHandler = this.getScopedErrorHandler('backend-skin.validate-definition', {
      scope: 'comprehensive'
    });
    const validationResult = validationHandler.capture(
      () => {
        if (!skinDef || typeof skinDef !== 'object') {
          errors.push('Skin definition must be a valid object');
          return false;
        }

        const hasMetadataId = skinDef.metadata && typeof skinDef.metadata === 'object' && skinDef.metadata.id;
        const hasDirectId = skinDef.id;

        if (hasMetadataId) {
          this.validateTemplumTypesFormat(skinDef, errors);
        } else if (hasDirectId) {
          this.validateUniversalSkinEngineFormat(skinDef, errors);
        } else {
          errors.push('Skin definition missing required id field');
        }

        const version = (skinDef.metadata && skinDef.metadata.version) || skinDef.version;
        if (!version || typeof version !== 'string') {
          errors.push('Skin definition missing or invalid version');
        } else if (!this.isValidSemanticVersion(version)) {
          errors.push('Skin definition version must follow semantic versioning (e.g., 1.0.0)');
        }

        const compatibleInterfaces =
          (skinDef.metadata && skinDef.metadata.compatibleInterfaces) ||
          (skinDef.metadata && skinDef.metadata.supportedInterfaces);
        if (compatibleInterfaces && Array.isArray(compatibleInterfaces)) {
          const validInterfaces = ['vscode', 'cli', 'command'];
          const invalidInterfaces = compatibleInterfaces.filter((iface: string) => !validInterfaces.includes(iface));
          if (invalidInterfaces.length > 0) {
            errors.push(`Invalid interface types: ${invalidInterfaces.join(', ')}`);
          }
        }

        const theme = skinDef.theme || (skinDef.themes && skinDef.themes[0]);
        if (theme) {
          this.validateSkinTheme(theme, errors);
        }

        if (skinDef.menus) {
          this.validateSkinMenus(skinDef.menus, errors);
        }

        if (skinDef.commands) {
          this.validateSkinCommands(skinDef.commands, errors);
        }

        if (skinDef.pclCompatibility) {
          this.validatePCLCompatibility(skinDef.pclCompatibility, errors);
        }

        return true;
      },
      { operation: 'validate-skin-definition' }
    );

    if (!validationResult.ok) {
      const errorMessage = validationResult.error.message || 'Unknown validation error';
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
      this.logInfo('Evicted expired skin cache entries', {
        evictedEntries: entriesToEvict.length
      });
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
      this.logInfo('LRU evicted skin cache entries', {
        evictedEntries: evicted.length,
        freedSpace: this.formatBytes(freedSpace)
      });
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
    
    this.logInfo('Templum Core cache metrics', {
      entries: this.skinCache.size,
      maxEntries: this.SKIN_CACHE_MAX_SIZE,
      totalSize: this.formatBytes(totalSize),
      maxSize: this.formatBytes(this.SKIN_CACHE_MAX_MEMORY),
      hitRate: this.getCacheHitRate(),
      averageLoadTimeMs: this.getAverageLoadTime(),
      evictions: this.skinCacheMetrics.evictions,
      validationFailures: this.skinCacheMetrics.validationFailures
    });
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
      throw this.raiseScopedError(
        'resource-manager.get',
        undefined,
        'Resource Manager not initialized',
        'SERVICE_NOT_READY',
        'configuration'
      );
    }
    return this.dependencies.resourceManager;
  }

  /**
   * Register core Templum services for resource monitoring
   * @private
   */
  private async registerCoreServicesForMonitoring(): Promise<void> {
    const scopedHandler = this.getScopedErrorHandler('resource-monitoring.register-core-services', {
      operation: 'register-services'
    });
    const registrationResult = await scopedHandler.captureAsync(
      async () => {
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
    },
      { operation: 'register-services' }
    );

    if (!registrationResult.ok) {
      this.logError('Failed to register core services for monitoring', registrationResult.error, {
        context: registrationResult.error.context
      });
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

  private getScopedErrorHandler(
    segment: string,
    metadata?: Record<string, unknown>
  ): ScopedErrorHandler {
    return this.errorHandler.child(segment, metadata);
  }

  private describeError(error: unknown): Record<string, unknown> | string | undefined {
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
  }

  private raiseScopedError(
    segment: string,
    error: unknown,
    message: string,
    code: string,
    category: TemplumError['category'],
    metadata?: Record<string, unknown>,
    handlerMetadata?: ErrorMetadata
  ): TemplumError {
    const handler = this.getScopedErrorHandler(segment, metadata);
    const contextDetails: Record<string, unknown> = metadata ? { ...metadata } : {};
    const cause = this.describeError(error);
    if (cause !== undefined) {
      contextDetails.cause = cause;
    }

    return handler.handle(
      createTemplumCoreError(message, code, category, contextDetails),
      handlerMetadata
    );
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
      this.logger.info(message, metadata);
    }
  }

  private logError(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (this.dependencies?.observabilityService) {
      this.dependencies.observabilityService.logError(message, error, metadata, 'TemplumCore');
    } else {
      this.logger.error(message, error, metadata);
    }
  }

  private logWarn(message: string, metadata?: Record<string, any>): void {
    if (this.dependencies?.observabilityService) {
      this.dependencies.observabilityService.logWarn(message, metadata, 'TemplumCore');
    } else {
      this.logger.warn(message, metadata);
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

  private stopIPCCommandMonitoring(): void {
    if (!this.ipcCommandMonitor) {
      return;
    }

    this.ipcCommandMonitor.stop();
    this.ipcCommandMonitor = undefined;
  }

  /**
   * Start monitoring for IPC commands from CLI
   * Implements file-based IPC communication for CLI-to-Core commands
   */
  private startIPCCommandMonitoring(): void {
    if (!this.initialized) {
      return;
    }

    this.logInfo('Starting IPC command monitoring for CLI communication');

    this.stopIPCCommandMonitoring();

    const tempDir = require('os').tmpdir();
    const fs = require('fs');
    const path = require('path');

    const checkForIPCRequests = async (): Promise<void> => {
      const scanHandler = this.getScopedErrorHandler('ipc.directory-scan', {
        directory: tempDir
      });
      const filesResult = scanHandler.capture(
        () => fs.readdirSync(tempDir),
        { operation: 'scan-ipc-request-files' }
      );

      if (!filesResult.ok) {
        return;
      }

      const requestFiles = filesResult.value.filter((file: string) =>
        file.startsWith('templum-cli-') && file.endsWith('-request.json')
      );

      for (const requestFile of requestFiles) {
        const requestPath = path.join(tempDir, requestFile);
        const requestHandler = this.getScopedErrorHandler('ipc.request-file', {
          requestFile
        });

        const requestResult = requestHandler.capture(
          () => {
            const requestData = fs.readFileSync(requestPath, 'utf8');
            const requestId = this.extractCliRequestId(requestFile);
            const responseFile = path.join(tempDir, `templum-${requestId}-response.json`);

            const parseOutcome = serialization.fromJson<Record<string, unknown>>(requestData, {
              context: `core:ipc:request:${requestId}`,
              fallback: {}
            }).parse();

            const parsedRequest = this.handleSerializationOutcome('IPC request read', parseOutcome);
            return { parsedRequest, requestId, responseFile };
          },
          { operation: 'process-ipc-request-file' }
        );

        if (!requestResult.ok) {
          this.logWarn('Failed to process IPC request file', {
            requestFile,
            context: requestResult.error.context,
            error: requestResult.error.message
          });
          this.cleanupIpcRequestFile(requestPath, { requestFile });
          continue;
        }

        const { parsedRequest, requestId, responseFile } = requestResult.value;

        if (!parsedRequest) {
          this.logWarn('Skipping malformed IPC request', { requestFile });
          this.cleanupIpcRequestFile(requestPath, { requestFile });
          continue;
        }

        const normalizedRequest = this.normalizeCliRequestPayload(
          parsedRequest.value,
          requestId,
          responseFile
        );

        void this.processIPCCommandRequest(normalizedRequest, requestPath, parsedRequest.meta);
      }
    };

    this.ipcCommandMonitor = createInterval(checkForIPCRequests, 100, { unref: true });
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

  private cleanupIpcRequestFile(requestPath: string, metadata: Record<string, unknown>): void {
    const fs = require('fs');
    const scopedHandler = this.getScopedErrorHandler('ipc.cleanup-request-file', metadata);
    const cleanupResult = scopedHandler.capture(
      () => {
        fs.unlinkSync(requestPath);
        return true;
      },
      { operation: 'cleanup-ipc-request-file' }
    );

    if (!cleanupResult.ok) {
      this.logWarn('Failed to cleanup IPC request file', {
        ...metadata,
        context: cleanupResult.error.context,
        error: cleanupResult.error.message
      });
    }
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

    const scopedHandler = this.getScopedErrorHandler('ipc.process-request', {
      requestType: request.type,
      requestId: request.requestId
    });

    const executionResult = await scopedHandler.captureAsync(
      async () => {
        if (!request.type || !request.data) {
          throw new Error('Invalid IPC request structure - missing type or data');
        }

        let result: any;
        const payload = (request.data ?? {}) as Record<string, unknown>;

        switch (request.type) {
          case 'executeCommand': {
            const command = typeof payload.command === 'string' ? payload.command : undefined;
            if (!command) {
              throw new Error('Invalid IPC command payload: command missing');
            }

            const sourceInterface = this.normalizeInterfaceType(payload.sourceInterface);
            const args = Array.isArray(payload.args) ? payload.args : [];
            const context = (payload.context && typeof payload.context === 'object') ? payload.context : {};

            this.logInfo('Processing IPC command request from CLI', {
              command,
              clientPid: request.clientPid,
              requestId: request.requestId
            });

            result = await this.executeCommand(
              command,
              sourceInterface,
              args,
              context
            );
            break;
          }
          case 'getSystemStatus': {
            this.logInfo('Processing IPC getSystemStatus request from CLI', {
              clientPid: request.clientPid,
              requestId: request.requestId
            });
            result = this.getSystemStatus();
            break;
          }
          case 'loadBackendSkin': {
            const backendId = typeof payload.backendId === 'string' ? payload.backendId : undefined;
            if (!backendId) {
              throw new Error('Invalid loadBackendSkin payload: backendId missing');
            }

            this.logInfo('Processing IPC loadBackendSkin request from CLI', {
              backendId,
              clientPid: request.clientPid,
              requestId: request.requestId
            });

            if (this.dependencies?.backendServiceRouter) {
              result = await this.dependencies.backendServiceRouter.loadBackendSkin(backendId);
            } else {
              result = null;
            }
            break;
          }
          default:
            throw new Error(`Unsupported IPC message type: ${request.type}`);
        }

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

        this.logInfo('IPC request processed successfully', {
          requestType: request.type,
          requestId: request.requestId
        });
      },
      { operation: 'process-ipc-command' }
    );

    if (!executionResult.ok) {
      const templumError = executionResult.error;
      this.logError('IPC command execution failed', templumError, {
        requestType: request.type,
        requestId: request.requestId,
        context: templumError.context
      });

      if (request.responseFile) {
        const errorResponse = {
          success: false,
          error: templumError.message,
          requestId: request.requestId,
          timestamp: Date.now(),
          serializationMeta: {
            request: requestMeta
          }
        };

        const writeHandler = this.getScopedErrorHandler('ipc.write-error-response', {
          requestType: request.type,
          requestId: request.requestId
        });
        const writeResult = writeHandler.capture(
          () => {
            const errorOutcome = serialization
              .json(errorResponse, {
                context: `core:ipc:response:${request.requestId}:error`,
                maskFields: ['token', 'credentials']
              })
              .stringify();

            const serializedError = this.handleSerializationOutcome('IPC response write (error)', errorOutcome);

            if (serializedError && request.responseFile) {
              fs.writeFileSync(request.responseFile, serializedError.value, 'utf8');
            }
            return true;
          },
          { operation: 'write-ipc-error-response' }
        );

        if (!writeResult.ok) {
          this.logError('Failed to write IPC error response', writeResult.error, {
            requestType: request.type,
            requestId: request.requestId,
            context: writeResult.error.context
          });
        }
      }
    }

    this.cleanupIpcRequestFile(requestPath, {
      requestType: request.type,
      requestId: request.requestId
    });
  }
}
