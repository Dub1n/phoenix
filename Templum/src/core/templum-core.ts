/**---
 * title: [Templum Core Engine - Universal Interface Orchestrator]
 * tags: [Core, Engine, Interface, Orchestration, Multi-Backend]
 * provides: [Interface Coordination, State Management, Backend Routing]
 * requires: [Interface Adapters, Skin Engine, Backend Services]
 * description: [Central orchestration engine managing all interface modalities]
 * ---*/

import { EventEmitter } from 'events';
import { 
  InterfaceType, 
  InterfaceAdapter, 
  UniversalSkinDefinition, 
  CommandContext, 
  CommandResult, 
  TemplumConfiguration,
  TemplumSystemStatus,
  StateUpdate,
  StateManagerStatus
} from '../types/templum-types';

export class TemplumCore extends EventEmitter {
  private config: TemplumConfiguration;
  private initialized: boolean = false;
  private activeInterfaces: Set<InterfaceType> = new Set();
  private loadedSkins: Map<string, UniversalSkinDefinition> = new Map();
  private interfaceAdapters: Map<InterfaceType, InterfaceAdapter> = new Map();
  
  // Mock internal components (to be implemented in later phases)
  private skinEngine: any;
  private stateManager: any;
  private backendRouter: any;

  constructor(config: Partial<TemplumConfiguration> = {}) {
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

    // Initialize mock components for testing
    this.initializeMockComponents();
    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('Templum Core Engine already initialized');
      return;
    }

    try {
      // Initialize all interface adapters (in real implementation)
      await this.initializeInterfaceAdapters();
      
      // Start cross-interface state synchronization
      await this.stateManager.startSynchronization();
      
      // Connect to available backend services
      await this.backendRouter.discoverAndConnect();
      
      this.initialized = true;
      this.emit('initialized', { timestamp: Date.now() });
      
      console.log('Templum Core Engine: Initialization complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('initializationError', { error: errorMessage, timestamp: Date.now() });
      throw new Error(`Failed to initialize Templum Core Engine: ${errorMessage}`);
    }
  }

  getSupportedInterfaces(): InterfaceType[] {
    return ['vscode', 'cli', 'command'];
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
    
    // Apply all loaded skins to new interface
    for (const skin of this.loadedSkins.values()) {
      await adapter.applySkin(skin);
    }

    // Synchronize current state to new interface
    const currentState = this.stateManager.getCurrentState();
    await adapter.syncState(currentState);

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

    // Validate skin definition
    const validation = this.skinEngine.validateSkin(skinDefinition);
    if (!validation.valid) {
      throw new Error(`Invalid skin definition: ${validation.errors.join(', ')}`);
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
    context: CommandContext = {}
  ): Promise<CommandResult> {
    if (!this.initialized) {
      throw new Error('Templum Core Engine must be initialized before executing commands');
    }

    const startTime = Date.now();

    try {
      // Update session state
      this.stateManager.recordCommandExecution(command, sourceInterface, context);

      // Route command to appropriate backend
      const routingInfo = this.backendRouter.resolveCommand(command);
      if (!routingInfo) {
        return {
          success: false,
          error: `Unknown command: ${command}`,
          source: sourceInterface,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        };
      }

      // Execute command via backend service
      const result = await this.backendRouter.executeCommand(
        routingInfo.backend,
        command,
        args,
        context
      );

      // Update state and synchronize across interfaces
      await this.stateManager.updateState(result);
      await this.synchronizeInterfaceStates(result);

      const commandResult: CommandResult = {
        success: true,
        data: result,
        source: sourceInterface,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };

      this.emit('commandExecuted', {
        command,
        sourceInterface,
        result: commandResult,
        timestamp: Date.now()
      });

      return commandResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

    return this.backendRouter.resolveCommand(command);
  }

  async synchronizeInterfaceStates(result: any): Promise<void> {
    const stateUpdate = this.stateManager.createStateUpdate(result);
    
    // Notify all active interfaces of state change
    for (const [interfaceType, adapter] of this.interfaceAdapters) {
      try {
        await adapter.syncState(stateUpdate);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
        backendConnections: this.backendRouter?.getConnectionStatus() || {
          totalConnections: 0,
          healthyConnections: 0,
          backends: {}
        }
      },
      stateManager: this.stateManager?.getStatus() || {
        synchronized: true,
        globalState: { lastModified: 0, backendStates: [] },
        sessionState: { startTime: 0, totalCommands: 0, lastCommand: 'none' },
        subscribers: 0,
        historySize: 0,
        persistence: {}
      },
      skinEngine: this.skinEngine?.getStatus() || {
        cachedSkins: this.loadedSkins.size,
        renderers: { vscode: {}, cli: {}, command: {} },
        performance: { cacheHitRate: 0, averageRenderTime: 0 }
      },
      performance: this.getPerformanceMetrics()
    };
  }

  getStateManagerStatus(): StateManagerStatus {
    return this.stateManager?.getStatus() || {
      synchronized: true,
      globalState: { lastModified: 0, backendStates: [] },
      sessionState: { startTime: 0, totalCommands: 0, lastCommand: 'none' },
      subscribers: 0,
      historySize: 0,
      persistence: {}
    };
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Dispose of all interface adapters
      for (const [interfaceType, adapter] of this.interfaceAdapters) {
        try {
          await adapter.dispose();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to dispose ${interfaceType} adapter: ${errorMessage}`);
        }
      }

      // Shutdown state manager
      if (this.stateManager?.shutdown) {
        await this.stateManager.shutdown();
      }

      // Shutdown backend router
      if (this.backendRouter?.shutdown) {
        await this.backendRouter.shutdown();
      }

      this.activeInterfaces.clear();
      this.interfaceAdapters.clear();
      this.loadedSkins.clear();
      this.initialized = false;

      this.emit('shutdown', { timestamp: Date.now() });
      this.removeAllListeners();

      console.log('Templum Core Engine: Shutdown complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error during shutdown: ${errorMessage}`);
      throw error;
    }
  }

  private async applySkinToActiveInterfaces(skinDef: UniversalSkinDefinition): Promise<void> {
    const compatibleInterfaces = skinDef.metadata.compatibleInterfaces;

    for (const [interfaceType, adapter] of this.interfaceAdapters) {
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

  private initializeMockComponents(): void {
    // Mock skin engine
    this.skinEngine = {
      validateSkin: (skinDef: UniversalSkinDefinition) => {
        if (!skinDef.metadata?.id) {
          return { valid: false, errors: ['Skin ID is required'] };
        }
        if (!skinDef.metadata?.backend) {
          return { valid: false, errors: ['Backend specification is required'] };
        }
        return { valid: true, errors: [] };
      },
      getStatus: () => ({
        cachedSkins: this.loadedSkins.size,
        renderers: { vscode: {}, cli: {}, command: {} },
        performance: { cacheHitRate: 0.85, averageRenderTime: 25 }
      })
    };

    // Mock state manager
    this.stateManager = {
      startSynchronization: async () => {
        console.log('State synchronization started');
      },
      recordCommandExecution: (command: string, sourceInterface: InterfaceType, context: CommandContext) => {
        // Record command execution
      },
      updateState: async (result: any) => {
        // Update state
      },
      createStateUpdate: (result: any): StateUpdate => ({
        timestamp: Date.now(),
        globalState: {},
        sessionState: {}
      }),
      getCurrentState: () => ({
        timestamp: Date.now(),
        globalState: {},
        sessionState: {}
      }),
      getStatus: () => ({
        synchronized: true,
        globalState: { lastModified: Date.now(), backendStates: [] },
        sessionState: { startTime: Date.now(), totalCommands: 0, lastCommand: 'none' },
        subscribers: 0,
        historySize: 0,
        persistence: {}
      })
    };

    // Mock backend router
    this.backendRouter = {
      discoverAndConnect: async () => {
        console.log('Backend service discovery complete');
      },
      resolveCommand: (command: string) => {
        if (command === 'unknown-command') {
          return null;
        }
        return { backend: 'pcl', commandInfo: { handler: 'test' } };
      },
      executeCommand: async (backend: string, command: string, args: any[], context: CommandContext) => {
        return { success: true, data: 'test-result' };
      },
      getConnectionStatus: () => ({
        totalConnections: 0,
        healthyConnections: 0,
        backends: {}
      })
    };
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
}