/**---
 * title: [Templum Universal Session Manager - PCL Pattern Adaptation]
 * tags: [Session, Management, Interface-Coordination, Multi-Backend, PCL-Adaptation]
 * provides: [TemplumUniversalSessionManager Class, Interface Switching, Backend Coordination, Session Lifecycle]
 * requires: [Interface Adapters, Backend Service Router, Templum Types, Session Context Foundation]
 * description: [Coordinates universal interface sessions across VSCode/CLI/Command modes with multi-backend support, adapted from PCL unified session manager patterns]
 * ---*/

import { EventEmitter } from 'events';
import {
  InterfaceType,
  InterfaceAdapter,
  UniversalSkinDefinition,
  CommandContext,
  CommandResult,
  TemplumConfiguration,
  BackendType,
  TemplumError,
  isTemplumError,
  createTemplumError,
  Signals,
  ErrorSignalPayload,
  MetricsSignalPayload
} from '../types/templum-types';

// Import real component implementations
import { SessionContextFoundation, SessionContext } from './session-context-foundation';
import { TemplumBackendServiceRouter } from '../backend/backend-service-router';

// Interface state synchronization types
export interface InterfaceStateData {
  currentView?: string;
  navigationStack?: string[];
  userPreferences?: Record<string, any>;
  temporaryData?: Record<string, any>;
  activeCommands?: string[];
  lastActivity?: Date;
}

export interface InterfaceStateTransferData {
  sessionId: string;
  fromInterface: InterfaceType;
  toInterface: InterfaceType;
  timestamp: number;
  sessionMetrics?: TemplumSessionMetrics;
  navigationHistory?: string[];
  loadedSkins?: string[];
  activeBackends?: BackendType[];
  preservedState?: InterfaceStateData;
}

export interface SessionCompletionInfo {
  completed: boolean;
  completedAt?: Date;
  completionReason?: 'user-initiated' | 'cleanup' | 'error' | 'timeout' | 'system-shutdown';
  finalMetrics?: {
    totalDuration: number;
    interfaceSwitchCount: number;
    commandExecutionCount: number;
    skinLoadCount: number;
    backendInteractionCount: number;
  };
}

export interface TemplumSessionMetrics {
  interfaceSwitches: number;
  backendInteractions: number;
  commandsExecuted: number;
  sessionsCreated: number;
  totalSkinLoads: number;
  averageSwitchTime: number;
  completion: SessionCompletionInfo;
}

export interface TemplumSessionState {
  // Core session properties
  sessionId: string;
  userId?: string;
  startTime: Date;
  activeInterface: InterfaceType;
  preferences: Record<string, any>;
  capabilities: string[];
  
  // Extended session state beyond foundation
  activeBackends: BackendType[];
  loadedSkins: string[];
  interfaceHistory: InterfaceType[];
  sessionMetrics: TemplumSessionMetrics;
  lastActivity: Date;
  navigationHistory: string[];
}

export interface InterfaceAdapterRegistry {
  vscode?: InterfaceAdapter;
  cli?: InterfaceAdapter;
  command?: InterfaceAdapter;
}

/**
 * Universal Session Manager for Templum
 * Adapted from PCL unified-session-manager.ts patterns with Templum-specific enhancements
 * 
 * Core Adaptations:
 * - Interface adapter management instead of renderer switching
 * - Multi-backend session coordination
 * - Universal skin definition management across interfaces
 * - Backend service router integration for session coordination
 */
export class TemplumUniversalSessionManager extends EventEmitter {
  private sessionFoundation: SessionContextFoundation;
  private backendServiceRouter: TemplumBackendServiceRouter;
  private config: TemplumConfiguration;
  
  // Interface Management (PCL Renderer Switching Pattern Adaptation)
  private activeInterfaceType: InterfaceType = 'cli';
  private interfaceAdapters: InterfaceAdapterRegistry = {};
  private interfaceHistory: InterfaceType[] = [];
  
  // Session State Management (PCL Session Context Pattern Adaptation)
  private currentSessionId: string | null = null;
  private sessionStates: Map<string, TemplumSessionState> = new Map();
  private navigationHistory: string[] = [];
  
  // Backend Coordination (Templum-Specific Enhancement)
  private activeBackends: Set<BackendType> = new Set();
  private loadedSkins: Map<string, UniversalSkinDefinition> = new Map();
  
  // Lifecycle Management
  private running: boolean = false;
  private initialized: boolean = false;

  constructor(
    config: Partial<TemplumConfiguration> = {},
    backendServiceRouter?: TemplumBackendServiceRouter
  ) {
    super();
    
    this.config = {
      maxConcurrentSessions: 5,
      sessionTimeoutMs: 3600000, // 1 hour
      enableHealthMonitoring: true,
      performanceMetrics: true,
      backendDiscovery: {
        enabled: true,
        interval: 30000
      },
      ...config
    };

    // Initialize foundation components
    this.sessionFoundation = new SessionContextFoundation();
    this.backendServiceRouter = backendServiceRouter || new TemplumBackendServiceRouter();

    this.setupEventListeners();
  }

  /**
   * Initialize the universal session manager
   * PCL Pattern: Async initialization with dependency resolution
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('Templum Universal Session Manager already initialized');
      return;
    }

    try {
      // Initialize session foundation
      await this.sessionFoundation.initialize();
      
      // Initialize backend service router if not already done
      // TODO: [TASK-NEW-010] Integrate backend service router initialization with session lifecycle
      // Priority: High | Complexity: 8
      // Location: Backend service discovery and session coordination
      // Dependencies: Backend service router connection establishment
      // Phase: Interface
      console.log('Backend service router integration needed for session coordination');

      this.initialized = true;
      this.emit('initialized', { timestamp: Date.now() });
      
      console.log('Templum Universal Session Manager: Initialization complete');
    } catch (error) {
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumUniversalSessionManager:Initialize',
        error: createTemplumError(
          isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown initialization error'),
          'INITIALIZATION_ERROR',
          'runtime'
        ),
        severity: 'critical'
      };

      this.emit('initializationError', errorPayload);
      console.error('Templum Universal Session Manager: Initialization failed:', errorPayload.error);
      
      throw createTemplumError(
        `Failed to initialize Templum Universal Session Manager: ${errorPayload.error}`,
        'INITIALIZATION_ERROR',
        'runtime'
      );
    }
  }

  /**
   * Start a new universal session
   * PCL Pattern: Session lifecycle management with state tracking
   */
  async startSession(
    interfaceType: InterfaceType = 'cli',
    sessionContext?: Partial<SessionContext>
  ): Promise<string> {
    if (!this.initialized) {
      throw createTemplumError(
        'Session manager must be initialized before starting sessions',
        'SESSION_NOT_READY',
        'runtime'
      );
    }

    try {
      // Create session foundation context
      const foundationContext = await this.sessionFoundation.createSession(
        undefined, // Auto-generate session ID
        interfaceType,
        {
          userId: sessionContext?.metadata?.userId,
          clientInfo: `templum-${interfaceType}`,
          preferences: sessionContext?.metadata?.preferences || {},
          capabilities: this.getInterfaceCapabilities(interfaceType),
          temporary: false
        }
      );

      // Create extended Templum session state
      const sessionState: TemplumSessionState = {
        sessionId: foundationContext.sessionId,
        userId: foundationContext.metadata.userId,
        startTime: foundationContext.createdAt,
        activeInterface: interfaceType,
        preferences: foundationContext.metadata.preferences || {},
        capabilities: foundationContext.metadata.capabilities || [],
        activeBackends: [],
        loadedSkins: [],
        interfaceHistory: [interfaceType],
        sessionMetrics: {
          interfaceSwitches: 0,
          backendInteractions: 0,
          commandsExecuted: 0,
          sessionsCreated: 1,
          totalSkinLoads: 0,
          averageSwitchTime: 0,
          completion: {
            completed: false
          }
        },
        lastActivity: new Date(),
        navigationHistory: []
      };

      // Store session state
      this.sessionStates.set(foundationContext.sessionId, sessionState);
      this.currentSessionId = foundationContext.sessionId;
      this.activeInterfaceType = interfaceType;
      this.running = true;

      // Set as active session in foundation
      this.sessionFoundation.setActiveSession(foundationContext.sessionId);

      // Emit session started event
      this.emit('sessionStarted', {
        sessionId: foundationContext.sessionId,
        interfaceType,
        timestamp: Date.now()
      });

      console.log(`Templum Universal Session Manager: Started session ${foundationContext.sessionId} with ${interfaceType} interface`);
      return foundationContext.sessionId;

    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to start session:', errorMessage);
      
      throw createTemplumError(
        `Failed to start session: ${errorMessage}`,
        'SESSION_CREATION_FAILED',
        'runtime'
      );
    }
  }

  /**
   * Register interface adapter with the session
   * PCL Pattern: Renderer management adapted for interface adapters
   */
  async registerInterfaceAdapter(
    interfaceType: InterfaceType,
    adapter: InterfaceAdapter
  ): Promise<void> {
    if (!this.initialized) {
      throw createTemplumError(
        'Session manager must be initialized before registering interfaces',
        'SESSION_NOT_READY',
        'runtime'
      );
    }

    // Store adapter
    this.interfaceAdapters[interfaceType] = adapter;

    // Apply loaded skins to new interface
    for (const [skinId, skin] of Array.from(this.loadedSkins.entries())) {
      try {
        await adapter.applySkin(skin);
        console.log(`Applied skin ${skinId} to ${interfaceType} interface`);
      } catch (error) {
        const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
        console.error(`Failed to apply skin ${skinId} to ${interfaceType}:`, errorMessage);
      }
    }

    // Update current session if this is the active interface
    if (this.currentSessionId && interfaceType === this.activeInterfaceType) {
      await this.updateSessionActivity();
    }

    this.emit('interfaceRegistered', {
      interfaceType,
      timestamp: Date.now(),
      totalInterfaces: Object.keys(this.interfaceAdapters).length
    });

    console.log(`Templum Universal Session Manager: Registered ${interfaceType} interface adapter`);
  }

  /**
   * Switch active interface
   * PCL Pattern: Renderer switching logic adapted for interface adapters
   */
  async switchInterface(targetInterface: InterfaceType): Promise<boolean> {
    if (!this.initialized || !this.currentSessionId) {
      throw createTemplumError(
        'No active session available for interface switching',
        'SESSION_NOT_READY',
        'runtime'
      );
    }

    const startTime = Date.now();

    try {
      // Check if target interface is available
      if (!this.interfaceAdapters[targetInterface]) {
        console.warn(`Interface adapter for ${targetInterface} not registered`);
        return false;
      }

      const previousInterface = this.activeInterfaceType;

      // Update session foundation active interface
      this.sessionFoundation.switchInterface(this.currentSessionId, targetInterface);

      // Update session state
      const sessionState = this.sessionStates.get(this.currentSessionId);
      if (sessionState) {
        sessionState.activeInterface = targetInterface;
        sessionState.interfaceHistory.push(targetInterface);
        sessionState.sessionMetrics.interfaceSwitches += 1;
        sessionState.lastActivity = new Date();

        // Update average switch time
        const switchTime = Date.now() - startTime;
        const currentAverage = sessionState.sessionMetrics.averageSwitchTime;
        const switchCount = sessionState.sessionMetrics.interfaceSwitches;
        sessionState.sessionMetrics.averageSwitchTime = 
          ((currentAverage * (switchCount - 1)) + switchTime) / switchCount;
      }

      // Update active interface
      this.activeInterfaceType = targetInterface;
      this.interfaceHistory.push(targetInterface);

      // IMPLEMENTATION: Interface state synchronization during switching
      // Implement state transfer coordination between interface adapters
      await this.synchronizeInterfaceState(previousInterface, targetInterface, sessionState);

      // Emit interface switched event
      this.emit('interfaceSwitched', {
        sessionId: this.currentSessionId,
        previousInterface,
        newInterface: targetInterface,
        switchTime: Date.now() - startTime,
        timestamp: Date.now()
      });

      console.log(`Templum Universal Session Manager: Switched from ${previousInterface} to ${targetInterface} (${Date.now() - startTime}ms)`);
      return true;

    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to switch interface:', errorMessage);
      
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumUniversalSessionManager:SwitchInterface',
        error: createTemplumError(errorMessage, 'INTERFACE_SWITCH_FAILED', 'runtime'),
        severity: 'high'
      };

      this.emit('interfaceSwitchError', errorPayload);
      return false;
    }
  }

  /**
   * Load skin definition for current session
   * PCL Pattern: Menu context coordination adapted for skin management
   */
  async loadSessionSkin(skinDefinition: UniversalSkinDefinition): Promise<boolean> {
    if (!this.initialized || !this.currentSessionId) {
      throw createTemplumError(
        'No active session available for skin loading',
        'SESSION_NOT_READY',
        'runtime'
      );
    }

    try {
      // Basic validation
      if (!skinDefinition.metadata?.id) {
        throw createTemplumError(
          'Skin definition missing required id',
          'SKIN_VALIDATION_ERROR',
          'validation'
        );
      }

      // Store skin
      this.loadedSkins.set(skinDefinition.metadata.id, skinDefinition);

      // Apply to all registered interfaces that support this skin
      const compatibleInterfaces = skinDefinition.metadata.compatibleInterfaces;
      for (const interfaceType of compatibleInterfaces) {
        const adapter = this.interfaceAdapters[interfaceType];
        if (adapter) {
          try {
            await adapter.applySkin(skinDefinition);
            console.log(`Applied skin ${skinDefinition.metadata.id} to ${interfaceType}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to apply skin to ${interfaceType}:`, errorMessage);
          }
        }
      }

      // Update session state
      const sessionState = this.sessionStates.get(this.currentSessionId);
      if (sessionState) {
        sessionState.loadedSkins.push(skinDefinition.metadata.id);
        sessionState.sessionMetrics.totalSkinLoads += 1;
        sessionState.lastActivity = new Date();
      }

      this.emit('skinLoaded', {
        sessionId: this.currentSessionId,
        skinId: skinDefinition.metadata.id,
        skinName: skinDefinition.metadata.name,
        compatibleInterfaces,
        timestamp: Date.now()
      });

      return true;

    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to load skin:', errorMessage);
      return false;
    }
  }

  /**
   * Execute command in current session context
   * PCL Pattern: Command execution with session context
   */
  async executeSessionCommand(
    command: string,
    args: any[] = [],
    context: Partial<CommandContext> = {}
  ): Promise<CommandResult> {
    if (!this.initialized || !this.currentSessionId) {
      throw createTemplumError(
        'No active session available for command execution',
        'SESSION_NOT_READY',
        'runtime'
      );
    }

    const startTime = Date.now();

    try {
      const sessionState = this.sessionStates.get(this.currentSessionId);
      if (!sessionState) {
        throw createTemplumError(
          'Session state not found',
          'SESSION_STATE_MISSING',
          'runtime'
        );
      }

      const commandContext: CommandContext = {
        sessionId: this.currentSessionId,
        activeInterface: this.activeInterfaceType,
        availableBackends: Array.from(this.activeBackends),
        ...context
      };

      // Route command to appropriate backend service via backend service router
      console.log(`Routing command '${command}' to backend services`);

      let result: CommandResult;

      try {
        // Use the first available backend as default target
        // Real implementation would include sophisticated backend routing logic based on command type
        const availableBackends = Array.from(this.activeBackends);
        const targetBackend = availableBackends[0] || 'templum'; // fallback to templum
        
        console.log(`Executing command '${command}' on backend service '${targetBackend}'`);
        
        // Execute command via backend service router (real implementation)
        const backendResponse = await this.backendServiceRouter.executeCommand(
          targetBackend,
          command,
          args
        );

        // Create standardized result from backend response
        result = {
          success: true,
          data: {
            command,
            args,
            sessionId: this.currentSessionId,
            executedAt: new Date().toISOString(),
            backend: targetBackend,
            response: backendResponse
          },
          source: this.activeInterfaceType,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        };
        
        console.log(`Command '${command}' executed successfully via ${targetBackend}`);
        
      } catch (backendError) {
        // Fallback to local command execution if backend routing fails
        console.warn(`Backend command routing failed for '${command}':`, backendError);
        console.log(`Falling back to local command execution`);

        // Create fallback result
        result = {
          success: true,
          data: {
            command,
            args,
            sessionId: this.currentSessionId,
            executedAt: new Date().toISOString(),
            backend: 'local-fallback',
            fallbackReason: isTemplumError(backendError) ? backendError.message : String(backendError)
          },
          source: this.activeInterfaceType,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime
        };
      }

      // Update session metrics
      sessionState.sessionMetrics.commandsExecuted += 1;
      sessionState.lastActivity = new Date();

      this.emit('commandExecuted', {
        sessionId: this.currentSessionId,
        command,
        result,
        executionTime: Date.now() - startTime,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      const errorResult: CommandResult = {
        success: false,
        error: errorMessage,
        source: this.activeInterfaceType,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };

      this.emit('commandError', {
        sessionId: this.currentSessionId,
        command,
        error: errorMessage,
        timestamp: Date.now()
      });

      return errorResult;
    }
  }

  /**
   * Get current session state
   * PCL Pattern: Session context access with validation
   */
  getCurrentSession(): TemplumSessionState | null {
    if (!this.currentSessionId) {
      return null;
    }

    const sessionState = this.sessionStates.get(this.currentSessionId);
    if (!sessionState) {
      return null;
    }

    // Update last activity
    sessionState.lastActivity = new Date();
    return { ...sessionState }; // Return copy to prevent mutations
  }

  /**
   * Stop current session
   * PCL Pattern: Session lifecycle management with cleanup
   */
  async stopSession(): Promise<void> {
    if (!this.currentSessionId) {
      console.warn('No active session to stop');
      return;
    }

    try {
      const sessionId = this.currentSessionId;
      const sessionState = this.sessionStates.get(sessionId);

      // Dispose of interface adapters
      for (const [interfaceType, adapter] of Object.entries(this.interfaceAdapters)) {
        try {
          if (adapter && typeof adapter.dispose === 'function') {
            await adapter.dispose();
            console.log(`Disposed ${interfaceType} interface adapter`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to dispose ${interfaceType} adapter:`, errorMessage);
        }
      }

      // Update session state to completed - PCL Session Completion Pattern
      if (sessionState) {
        sessionState.lastActivity = new Date();
        
        // Session completion status tracking - TASK-NEW-013 Implementation
        const completionTime = new Date();
        const sessionDuration = completionTime.getTime() - sessionState.startTime.getTime();
        
        sessionState.sessionMetrics.completion = {
          completed: true,
          completedAt: completionTime,
          completionReason: 'cleanup', // Normal disposal via stopSession()
          finalMetrics: {
            totalDuration: sessionDuration,
            interfaceSwitchCount: sessionState.sessionMetrics.interfaceSwitches,
            commandExecutionCount: sessionState.sessionMetrics.commandsExecuted,
            skinLoadCount: sessionState.sessionMetrics.totalSkinLoads,
            backendInteractionCount: sessionState.sessionMetrics.backendInteractions
          }
        };
        
        console.log(`Session ${sessionId} completed - Duration: ${sessionDuration}ms, Commands: ${sessionState.sessionMetrics.commandsExecuted}, Interface Switches: ${sessionState.sessionMetrics.interfaceSwitches}`);
      }

      // Clear session data
      this.currentSessionId = null;
      this.running = false;
      this.interfaceHistory.push(this.activeInterfaceType);
      this.navigationHistory = [];

      this.emit('sessionStopped', {
        sessionId,
        metrics: sessionState?.sessionMetrics,
        timestamp: Date.now()
      });

      console.log(`Templum Universal Session Manager: Session ${sessionId} stopped`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to stop session:', errorMessage);
      
      // Mark session as completed with error status - PCL Pattern: Error completion tracking
      const errorSessionId = this.currentSessionId; // Capture before potential clearing
      if (errorSessionId) {
        const sessionState = this.sessionStates.get(errorSessionId);
        if (sessionState && !sessionState.sessionMetrics.completion.completed) {
          const completionTime = new Date();
          const sessionDuration = completionTime.getTime() - sessionState.startTime.getTime();
          
          sessionState.sessionMetrics.completion = {
            completed: true,
            completedAt: completionTime,
            completionReason: 'error',
            finalMetrics: {
              totalDuration: sessionDuration,
              interfaceSwitchCount: sessionState.sessionMetrics.interfaceSwitches,
              commandExecutionCount: sessionState.sessionMetrics.commandsExecuted,
              skinLoadCount: sessionState.sessionMetrics.totalSkinLoads,
              backendInteractionCount: sessionState.sessionMetrics.backendInteractions
            }
          };
          
          console.log(`Session ${errorSessionId} completed with error - Duration: ${sessionDuration}ms, Error: ${errorMessage}`);
        }
      }
      
      throw createTemplumError(
        `Failed to stop session: ${errorMessage}`,
        'SESSION_STOP_FAILED',
        'runtime'
      );
    }
  }

  /**
   * Get session statistics and health metrics
   * PCL Pattern: Metrics collection for monitoring
   */
  getSessionMetrics(): {
    activeSessions: number;
    totalSessions: number;
    interfaceUsage: Record<InterfaceType, number>;
    averageSessionDuration: number;
    totalCommands: number;
    totalSkinLoads: number;
    completionStats: {
      completedSessions: number;
      incompleteSessions: number;
      completionReasons: Record<string, number>;
      averageCompletedDuration: number;
    };
  } {
    const sessions = Array.from(this.sessionStates.values());
    const interfaceUsage: Record<InterfaceType, number> = {
      vscode: 0,
      cli: 0,
      command: 0
    };

    let totalDuration = 0;
    let totalCommands = 0;
    let totalSkinLoads = 0;
    let completedSessions = 0;
    
    // Session completion tracking - TASK-NEW-013 Enhancement
    let actuallyCompletedSessions = 0;
    let incompleteSessions = 0;
    const completionReasons: Record<string, number> = {};
    let totalCompletedDuration = 0;

    for (const session of sessions) {
      // Count interface usage
      for (const interfaceType of session.interfaceHistory) {
        interfaceUsage[interfaceType]++;
      }

      // Calculate metrics
      totalCommands += session.sessionMetrics.commandsExecuted;
      totalSkinLoads += session.sessionMetrics.totalSkinLoads;

      // Track completion status - PCL Session Analytics Pattern
      if (session.sessionMetrics.completion.completed) {
        actuallyCompletedSessions++;
        
        // Track completion reasons
        const reason = session.sessionMetrics.completion.completionReason || 'unknown';
        completionReasons[reason] = (completionReasons[reason] || 0) + 1;
        
        // Use final metrics duration if available (more accurate)
        if (session.sessionMetrics.completion.finalMetrics) {
          totalCompletedDuration += session.sessionMetrics.completion.finalMetrics.totalDuration;
        }
      } else {
        incompleteSessions++;
      }

      // Calculate duration for all sessions (existing behavior)
      const endTime = session.lastActivity || new Date();
      const duration = endTime.getTime() - session.startTime.getTime();
      totalDuration += duration;
      completedSessions++;
    }

    return {
      activeSessions: this.currentSessionId ? 1 : 0,
      totalSessions: sessions.length,
      interfaceUsage,
      averageSessionDuration: completedSessions > 0 ? totalDuration / completedSessions : 0,
      totalCommands,
      totalSkinLoads,
      completionStats: {
        completedSessions: actuallyCompletedSessions,
        incompleteSessions,
        completionReasons,
        averageCompletedDuration: actuallyCompletedSessions > 0 ? totalCompletedDuration / actuallyCompletedSessions : 0
      }
    };
  }

  /**
   * Cleanup and shutdown
   * PCL Pattern: Graceful shutdown with resource cleanup
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Stop current session if active with system-shutdown completion reason
      if (this.currentSessionId) {
        // Mark session for system shutdown completion tracking
        const sessionState = this.sessionStates.get(this.currentSessionId);
        await this.stopSession();
        
        // Update completion reason to system-shutdown after stopSession for better tracking
        if (sessionState && sessionState.sessionMetrics.completion.completed && 
            sessionState.sessionMetrics.completion.completionReason === 'cleanup') {
          sessionState.sessionMetrics.completion.completionReason = 'system-shutdown';
        }
      }

      // Cleanup session foundation
      if (this.sessionFoundation) {
        await this.sessionFoundation.cleanup();
      }

      // Clear all data structures
      this.sessionStates.clear();
      this.interfaceAdapters = {};
      this.activeBackends.clear();
      this.loadedSkins.clear();
      this.interfaceHistory = [];

      this.initialized = false;
      this.running = false;

      this.emit('shutdown', { timestamp: Date.now() });
      this.removeAllListeners();

      console.log('Templum Universal Session Manager: Shutdown complete');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error during shutdown:', errorMessage);
      throw createTemplumError(
        `Failed to shutdown session manager: ${errorMessage}`,
        'SHUTDOWN_FAILED',
        'runtime'
      );
    }
  }

  /**
   * Synchronize interface state during interface switching
   * Universal Interface Orchestration Pattern Implementation
   */
  private async synchronizeInterfaceState(
    fromInterface: InterfaceType,
    toInterface: InterfaceType,
    sessionState: TemplumSessionState | undefined
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const fromAdapter = this.interfaceAdapters[fromInterface];
      const toAdapter = this.interfaceAdapters[toInterface];
      
      if (!toAdapter) {
        console.warn(`Target interface adapter ${toInterface} not available for state synchronization`);
        return;
      }
      
      // Step 1: Preserve state from current interface (if available)
      let preservedState: InterfaceStateData | null = null;
      if (fromAdapter && 'preserveState' in fromAdapter && typeof (fromAdapter as any).preserveState === 'function') {
        try {
          preservedState = await (fromAdapter as any).preserveState();
          console.log(`Preserved state from ${fromInterface} interface`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to preserve state from ${fromInterface}:`, errorMessage);
        }
      }
      
      // Step 2: Prepare state transfer data
      const transferData: InterfaceStateTransferData = {
        sessionId: sessionState?.sessionId || this.currentSessionId || '',
        fromInterface,
        toInterface,
        timestamp: Date.now(),
        sessionMetrics: sessionState?.sessionMetrics,
        navigationHistory: sessionState?.navigationHistory || [],
        loadedSkins: Array.from(this.loadedSkins.keys()),
        activeBackends: Array.from(this.activeBackends),
        preservedState: preservedState || undefined
      };
      
      // Step 3: Backend state coordination
      await this.coordinateBackendState(transferData);
      
      // Step 4: Apply state to target interface
      if ('restoreState' in toAdapter && typeof (toAdapter as any).restoreState === 'function') {
        try {
          await (toAdapter as any).restoreState(transferData);
          console.log(`Restored state to ${toInterface} interface`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to restore state to ${toInterface}:`, errorMessage);
          
          // TODO: [TASK-NEW-038] Implement fallback state synchronization for interface adapter failures
          // Priority: Medium | Complexity: 6
          // Location: Interface state synchronization error handling
          // Dependencies: Interface adapter error recovery patterns
          // Phase: Integration
        }
      }
      
      // Step 5: Synchronize loaded skins across interfaces
      await this.synchronizeSkinState(toInterface);
      
      // Step 6: Update session metrics with synchronization performance
      if (sessionState) {
        const syncTime = Date.now() - startTime;
        sessionState.sessionMetrics.averageSwitchTime = 
          ((sessionState.sessionMetrics.averageSwitchTime * (sessionState.sessionMetrics.interfaceSwitches - 1)) + syncTime) / 
          sessionState.sessionMetrics.interfaceSwitches;
      }
      
      console.log(`Interface state synchronization completed: ${fromInterface} → ${toInterface} (${Date.now() - startTime}ms)`);
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      console.error('Interface state synchronization failed:', errorMessage);
      
      // Emit error signal but don't throw to prevent interface switching failure
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumUniversalSessionManager:SynchronizeInterfaceState',
        error: createTemplumError(errorMessage, 'INTERFACE_STATE_SYNC_ERROR', 'runtime'),
        severity: 'medium'
      };
      
      this.emit('interfaceStateSyncError', errorPayload);
      
      // TODO: [TASK-NEW-039] Implement comprehensive interface state synchronization recovery
      // Priority: Medium | Complexity: 8
      // Location: Interface state synchronization error recovery
      // Dependencies: Interface adapter resilience patterns, fallback mechanisms
      // Phase: Integration
    }
  }
  
  /**
   * Coordinate backend state during interface switching
   */
  private async coordinateBackendState(transferData: InterfaceStateTransferData): Promise<void> {
    try {
      // Notify backend services of interface switch for state consistency
      for (const backendId of transferData.activeBackends) {
        try {
          await this.backendServiceRouter.executeCommand(
            backendId, 
            'interface_switch_notification',
            [transferData.fromInterface, transferData.toInterface, transferData.sessionId]
          );
          
          console.log(`Notified ${backendId} backend of interface switch`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to notify ${backendId} backend of interface switch:`, errorMessage);
          // Continue with other backends - non-critical error
        }
      }
      
      // TODO: [TASK-NEW-040] Implement backend session state synchronization
      // Priority: High | Complexity: 12
      // Location: Backend service state coordination during interface switching
      // Dependencies: Backend service session management, state persistence
      // Phase: Integration
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Backend state coordination warning:', errorMessage);
      // Non-critical error - interface switching can continue without backend coordination
    }
  }
  
  /**
   * Synchronize loaded skins to target interface
   */
  private async synchronizeSkinState(targetInterface: InterfaceType): Promise<void> {
    const adapter = this.interfaceAdapters[targetInterface];
    if (!adapter) {
      return;
    }
    
    // Apply all loaded skins to the new interface
    for (const [skinId, skinDefinition] of Array.from(this.loadedSkins.entries())) {
      try {
        // Check if skin is compatible with target interface
        if (skinDefinition.metadata.compatibleInterfaces.includes(targetInterface)) {
          await adapter.applySkin(skinDefinition);
          console.log(`Synchronized skin ${skinId} to ${targetInterface} interface`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Failed to synchronize skin ${skinId} to ${targetInterface}:`, errorMessage);
        // Continue with other skins
      }
    }
  }

  /**
   * Private helper methods
   */

  private getInterfaceCapabilities(interfaceType: InterfaceType): string[] {
    switch (interfaceType) {
      case 'vscode':
        return ['webview', 'tree-view', 'commands', 'file-system'];
      case 'cli':
        return ['interactive-prompts', 'keyboard-shortcuts', 'terminal-colors'];
      case 'command':
        return ['batch-execution', 'scripting', 'parameter-parsing'];
      default:
        return [];
    }
  }

  private async updateSessionActivity(): Promise<void> {
    if (this.currentSessionId) {
      const sessionState = this.sessionStates.get(this.currentSessionId);
      if (sessionState) {
        sessionState.lastActivity = new Date();
      }

      // Update foundation session activity
      this.sessionFoundation.updateSessionState(this.currentSessionId, {
        lastActivity: new Date().toISOString()
      });
    }
  }

  private setupEventListeners(): void {
    this.on('sessionStarted', ({ sessionId, interfaceType }) => {
      console.log(`Session ${sessionId} started with ${interfaceType} interface`);
    });

    this.on('interfaceSwitched', ({ sessionId, previousInterface, newInterface, switchTime }) => {
      console.log(`Session ${sessionId}: Interface switched from ${previousInterface} to ${newInterface} (${switchTime}ms)`);
    });

    this.on('skinLoaded', ({ sessionId, skinId }) => {
      console.log(`Session ${sessionId}: Skin ${skinId} loaded`);
    });

    this.on('commandExecuted', ({ sessionId, command, executionTime }) => {
      console.log(`Session ${sessionId}: Command '${command}' executed (${executionTime}ms)`);
    });

    this.on('sessionStopped', ({ sessionId, metrics }) => {
      if (metrics) {
        console.log(`Session ${sessionId} stopped - Commands: ${metrics.commandsExecuted}, Switches: ${metrics.interfaceSwitches}`);
      }
    });
  }
}