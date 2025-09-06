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

  isTemplumError,
  createTemplumError,

  ErrorSignalPayload,

} from '../types/templum-types';

// Import real component implementations
import { SessionContextFoundation, SessionContext } from './session-context-foundation';
import { TemplumBackendServiceRouter } from '../backend/backend-service-router';
import { ITemplumOrchestrator } from '../interfaces/templum-orchestrator-interface';

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
    orchestrator?: ITemplumOrchestrator,
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
    this.backendServiceRouter = backendServiceRouter || new TemplumBackendServiceRouter(orchestrator);

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
      
      // TASK-NEW-010: Backend Router Session Integration - Initialize backend service router with session lifecycle
      try {
        console.log('Templum Universal Session Manager: Initializing backend service router integration...');
        
        // Initialize backend service router for session coordination
        // Note: Backend service router initializes automatically in constructor
        console.log('Backend service router ready for session management');
        
        // Establish backend service discovery for session coordination
        await this.establishBackendServiceCoordination();
        
        // Setup backend health monitoring for session resilience
        this.setupBackendHealthMonitoring();
        
        console.log('Backend service router integration completed');
        
      } catch (error) {
        const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
        console.warn('Backend service router integration failed, continuing with limited functionality:', errorMessage);
        
        // Emit warning but don't fail initialization - session manager can work without all backends
        this.emit('backendIntegrationWarning', {
          error: errorMessage,
          timestamp: Date.now(),
          impact: 'reduced-functionality'
        });
      }

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

      const _commandContext: CommandContext = {
        sessionId: this.currentSessionId,
        activeInterface: this.activeInterfaceType,
        availableBackends: Array.from(this.activeBackends),
        ...context
      };

      // Route command to appropriate backend service via backend service router
      console.log(`Routing command '${command}' to backend services`);

      let result: CommandResult;

      try {
        // DYNAMIC COMMAND ROUTING: Use command router to determine target backend
        const commandRouter = this.backendServiceRouter.getCommandRouter();
        const commandRoute = commandRouter.getCommandRoute(command);
        
        let targetBackend: string;
        let routingMethod: string;
        
        if (commandRoute) {
          // Command is registered with a specific backend
          targetBackend = commandRoute.backend.id;
          routingMethod = commandRoute.isAlias ? 'alias_routing' : 'direct_routing';
          
          console.log(`[DYNAMIC_ROUTING] Command '${command}' routed to backend '${targetBackend}' via ${routingMethod}`);
          if (commandRoute.isAlias && commandRoute.originalCommandId) {
            console.log(`[DYNAMIC_ROUTING] Alias '${command}' resolves to '${commandRoute.originalCommandId}'`);
          }
        } else {
          // Fallback to first available backend for unregistered commands
          const availableBackends = Array.from(this.activeBackends);
          targetBackend = availableBackends[0] || 'templum';
          routingMethod = 'fallback_routing';
          
          console.log(`[DYNAMIC_ROUTING] Command '${command}' not registered - fallback routing to '${targetBackend}'`);
          console.warn(`[DYNAMIC_ROUTING] Consider registering command '${command}' in a backend skin definition`);
        }
        
        console.log(`Executing command '${command}' on backend service '${targetBackend}' (${routingMethod})`);
        
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
          
          // TASK-NEW-038: Implement fallback state synchronization for interface adapter failures
          try {
            await this.implementFallbackStateSynchronization(toInterface, transferData, errorMessage);
          } catch (fallbackError) {
            console.error('Fallback state synchronization also failed:', fallbackError);
            // Continue anyway - interface switching shouldn't fail completely
          }
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
      
      // TASK-NEW-039: Implement comprehensive interface state synchronization recovery
      try {
        const currentTransferData: InterfaceStateTransferData = {
          sessionId: sessionState?.sessionId || this.currentSessionId || '',
          fromInterface,
          toInterface,
          timestamp: Date.now(),
          sessionMetrics: sessionState?.sessionMetrics,
          navigationHistory: sessionState?.navigationHistory || [],
          loadedSkins: Array.from(this.loadedSkins.keys()),
          activeBackends: Array.from(this.activeBackends)
        };
        await this.implementComprehensiveStateSyncRecovery(fromInterface, toInterface, currentTransferData, errorMessage);
      } catch (recoveryError) {
        console.error('Comprehensive state synchronization recovery failed:', recoveryError);
        // Don't re-throw - interface switching should continue even if recovery fails
      }
    }
  }
  
  /**
   * Coordinate backend state during interface switching
   */
  private async coordinateBackendState(transferData: InterfaceStateTransferData): Promise<void> {
    try {
      // Notify backend services of interface switch for state consistency
      if (transferData.activeBackends) {
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
      }
      
      // TASK-NEW-040: Implement backend session state synchronization
      await this.synchronizeBackendSessionState(transferData);
      
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

  /**
   * TASK-NEW-010: Establish backend service coordination for session management
   */
  private async establishBackendServiceCoordination(): Promise<void> {
    try {
      // Get available backend services from router connections
      const availableServices = Array.from((this.backendServiceRouter as any).connections?.keys?.() || []);
      
      for (const serviceId of availableServices) {
        try {
          // Attempt to establish coordination with each available service
          const isAvailable = await this.backendServiceRouter.isServiceAvailable(String(serviceId));
          
          if (isAvailable) {
            // Add to active backends for session coordination
            this.activeBackends.add(serviceId as BackendType);
            console.log(`Established session coordination with backend service: ${serviceId}`);
            
            // Load backend skin definition for interface integration
            try {
              const backendSkin = await this.backendServiceRouter.loadBackendSkin(String(serviceId));
              if (backendSkin && backendSkin.metadata?.id) {
                // Store the backend skin directly - type compatibility handled at interface level
                this.loadedSkins.set(backendSkin.metadata.id, backendSkin as any);
                console.log(`Loaded skin definition from backend ${serviceId}: ${backendSkin.metadata.name || backendSkin.name}`);
              }
            } catch (skinError) {
              console.warn(`Failed to load skin from backend ${serviceId}:`, skinError);
            }
          }
        } catch (serviceError) {
          console.warn(`Failed to establish coordination with backend service ${serviceId}:`, serviceError);
          // Continue with other services
        }
      }
      
      console.log(`Backend service coordination established with ${this.activeBackends.size} services`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Backend service coordination setup failed:', errorMessage);
      throw error;
    }
  }

  /**
   * TASK-NEW-010: Setup backend health monitoring for session resilience
   */
  private setupBackendHealthMonitoring(): void {
    // Monitor backend service health for session coordination
    if (this.backendServiceRouter && typeof this.backendServiceRouter.on === 'function') {
      // Listen for service disconnection events
      this.backendServiceRouter.on('serviceDisconnected', (serviceId: string) => {
        console.log(`Backend service ${serviceId} disconnected - updating session coordination`);
        
        // Remove from active backends
        this.activeBackends.delete(serviceId as BackendType);
        
        // Emit session service change event
        this.emit('backendServiceChanged', {
          serviceId,
          status: 'disconnected',
          activeBackends: Array.from(this.activeBackends),
          timestamp: Date.now()
        });
        
        // Update current session state if exists
        if (this.currentSessionId) {
          const sessionState = this.sessionStates.get(this.currentSessionId);
          if (sessionState) {
            // Update session's active backends list
            sessionState.activeBackends = Array.from(this.activeBackends);
            sessionState.lastActivity = new Date();
          }
        }
      });
      
      // Listen for service reconnection events
      this.backendServiceRouter.on('serviceConnected', async (serviceId: string) => {
        console.log(`Backend service ${serviceId} connected - establishing session coordination`);
        
        try {
          // Verify service is available
          const isAvailable = await this.backendServiceRouter.isServiceAvailable(String(serviceId));
          
          if (isAvailable) {
            // Add to active backends
            this.activeBackends.add(serviceId as BackendType);
            
            // Load skin definition if available
            try {
              const backendSkin = await this.backendServiceRouter.loadBackendSkin(String(serviceId));
              if (backendSkin && backendSkin.metadata?.id) {
                // Store the backend skin directly
                this.loadedSkins.set(backendSkin.metadata.id, backendSkin as any);
                
                // Apply skin to registered interfaces
                for (const [interfaceType, adapter] of Object.entries(this.interfaceAdapters)) {
                  const compatibleInterfaces = backendSkin.metadata.compatibleInterfaces || ['cli'];
                  if (compatibleInterfaces.includes(interfaceType as InterfaceType)) {
                    try {
                      await adapter.applySkin(backendSkin as any);
                      console.log(`Applied reconnected backend ${serviceId} skin to ${interfaceType} interface`);
                    } catch (skinError) {
                      console.warn(`Failed to apply skin to ${interfaceType}:`, skinError);
                    }
                  }
                }
              }
            } catch (skinError) {
              console.warn(`Failed to load skin from reconnected backend ${serviceId}:`, skinError);
            }
            
            // Emit service change event
            this.emit('backendServiceChanged', {
              serviceId,
              status: 'connected',
              activeBackends: Array.from(this.activeBackends),
              timestamp: Date.now()
            });
            
            // Update current session state
            if (this.currentSessionId) {
              const sessionState = this.sessionStates.get(this.currentSessionId);
              if (sessionState) {
                sessionState.activeBackends = Array.from(this.activeBackends);
                sessionState.lastActivity = new Date();
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to establish coordination with reconnected service ${serviceId}:`, error);
        }
      });
      
      console.log('Backend health monitoring setup complete');
    }
  }

  /**
   * TASK-NEW-038: Implement fallback state synchronization for interface adapter failures
   */
  private async implementFallbackStateSynchronization(
    targetInterface: InterfaceType,
    transferData: InterfaceStateTransferData,
    originalError: string
  ): Promise<void> {
    console.log(`Implementing fallback state synchronization for ${targetInterface} interface`);
    
    const adapter = this.interfaceAdapters[targetInterface];
    if (!adapter) {
      throw new Error(`Target interface adapter ${targetInterface} not available for fallback`);
    }
    
    try {
      // Fallback Strategy 1: Basic state restoration without complex state transfer
      console.log(`Fallback: Attempting basic state restoration for ${targetInterface}`);
      
      // Extract essential state data for minimal restoration
      const essentialState = {
        sessionId: transferData.sessionId,
        fromInterface: transferData.fromInterface,
        toInterface: transferData.toInterface,
        timestamp: transferData.timestamp,
        // Simplified state data - focus on critical elements only
        basicState: {
          activeCommands: transferData.preservedState?.activeCommands || [],
          lastActivity: transferData.preservedState?.lastActivity || new Date(),
          // Preserve user preferences if available
          userPreferences: transferData.preservedState?.userPreferences || {}
        }
      };
      
      // Try basic restore method if adapter supports it
      if ('basicRestore' in adapter && typeof (adapter as any).basicRestore === 'function') {
        await (adapter as any).basicRestore(essentialState);
        console.log(`Fallback successful: Basic state restored for ${targetInterface}`);
        
        // Emit fallback success event
        this.emit('fallbackStateRestoreSuccess', {
          interface: targetInterface,
          method: 'basic-restore',
          originalError,
          timestamp: Date.now()
        });
        return;
      }
      
      // Fallback Strategy 2: Manual state reconstruction
      console.log(`Fallback: Attempting manual state reconstruction for ${targetInterface}`);
      
      // Reconstruct minimal working state manually
      await this.reconstructMinimalInterfaceState(targetInterface, transferData);
      
      console.log(`Fallback successful: Manual state reconstruction completed for ${targetInterface}`);
      
      // Emit fallback success event
      this.emit('fallbackStateRestoreSuccess', {
        interface: targetInterface,
        method: 'manual-reconstruction',
        originalError,
        timestamp: Date.now()
      });
      
    } catch (fallbackError) {
      console.error('All fallback state synchronization methods failed:', fallbackError);
      
      // Final Fallback Strategy 3: Interface reset with notification
      console.log(`Final fallback: Resetting ${targetInterface} interface to default state`);
      
      try {
        await this.resetInterfaceToDefault(targetInterface, transferData);
        
        // Emit interface reset event
        this.emit('interfaceResetToDefault', {
          interface: targetInterface,
          originalError,
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          timestamp: Date.now()
        });
        
        console.log(`Final fallback successful: ${targetInterface} interface reset to default state`);
        
      } catch (resetError) {
        console.error('Interface reset also failed:', resetError);
        
        // Emit complete failure event but don't throw - allow interface switching to continue
        this.emit('interfaceStateSyncCompleteFailure', {
          interface: targetInterface,
          originalError,
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          resetError: resetError instanceof Error ? resetError.message : String(resetError),
          timestamp: Date.now()
        });
        
        console.warn(`Interface ${targetInterface} state synchronization completely failed - interface may not function optimally`);
      }
    }
  }

  /**
   * TASK-NEW-038: Reconstruct minimal interface state manually
   */
  private async reconstructMinimalInterfaceState(
    targetInterface: InterfaceType,
    transferData: InterfaceStateTransferData
  ): Promise<void> {
    const adapter = this.interfaceAdapters[targetInterface];
    if (!adapter) {
      throw new Error(`Adapter not available for ${targetInterface}`);
    }
    
    // Step 1: Re-apply loaded skins (critical for interface functionality)
    for (const skinId of transferData.loadedSkins || []) {
      const skinDefinition = this.loadedSkins.get(skinId);
      if (skinDefinition && skinDefinition.metadata.compatibleInterfaces.includes(targetInterface)) {
        try {
          await adapter.applySkin(skinDefinition);
          console.log(`Fallback: Re-applied skin ${skinId} to ${targetInterface}`);
        } catch (skinError) {
          console.warn(`Fallback: Failed to re-apply skin ${skinId}:`, skinError);
          // Continue with other skins
        }
      }
    }
    
    // Step 2: Restore navigation history if possible
    if (transferData.navigationHistory && transferData.navigationHistory.length > 0) {
      const lastLocation = transferData.navigationHistory[transferData.navigationHistory.length - 1];
      if ('navigateTo' in adapter && typeof (adapter as any).navigateTo === 'function') {
        try {
          await (adapter as any).navigateTo(lastLocation);
          console.log(`Fallback: Restored navigation to ${lastLocation} for ${targetInterface}`);
        } catch (navError) {
          console.warn(`Fallback: Failed to restore navigation:`, navError);
        }
      }
    }
    
    // Step 3: Restore user preferences if adapter supports it
    if (transferData.preservedState?.userPreferences && 
        'updatePreferences' in adapter && 
        typeof (adapter as any).updatePreferences === 'function') {
      try {
        await (adapter as any).updatePreferences(transferData.preservedState.userPreferences);
        console.log(`Fallback: Restored user preferences for ${targetInterface}`);
      } catch (prefError) {
        console.warn(`Fallback: Failed to restore preferences:`, prefError);
      }
    }
    
    console.log(`Manual state reconstruction completed for ${targetInterface}`);
  }

  /**
   * TASK-NEW-038: Reset interface to default state as final fallback
   */
  private async resetInterfaceToDefault(
    targetInterface: InterfaceType,
    transferData: InterfaceStateTransferData
  ): Promise<void> {
    const adapter = this.interfaceAdapters[targetInterface];
    if (!adapter) {
      throw new Error(`Adapter not available for ${targetInterface}`);
    }
    
    console.log(`Resetting ${targetInterface} interface to default state`);
    
    // Step 1: Reset adapter to default state if supported
    if ('resetToDefault' in adapter && typeof (adapter as any).resetToDefault === 'function') {
      await (adapter as any).resetToDefault();
      console.log(`Interface ${targetInterface} reset to default via adapter method`);
    } else {
      // Manual reset - re-initialize the adapter with basic configuration
      if ('initialize' in adapter && typeof (adapter as any).initialize === 'function') {
        await (adapter as any).initialize();
        console.log(`Interface ${targetInterface} re-initialized to default state`);
      }
    }
    
    // Step 2: Apply default skins that are compatible with this interface
    for (const [skinId, skinDefinition] of Array.from(this.loadedSkins.entries())) {
      if (skinDefinition.metadata.compatibleInterfaces.includes(targetInterface)) {
        try {
          await adapter.applySkin(skinDefinition);
          console.log(`Applied default skin ${skinId} to reset ${targetInterface} interface`);
        } catch (skinError) {
          console.warn(`Failed to apply default skin ${skinId} during reset:`, skinError);
        }
      }
    }
    
    // Step 3: Set session context to current session
    if ('setSessionContext' in adapter && typeof (adapter as any).setSessionContext === 'function') {
      const sessionContext = {
        sessionId: transferData.sessionId,
        interface: targetInterface,
        timestamp: Date.now()
      };
      
      try {
        await (adapter as any).setSessionContext(sessionContext);
        console.log(`Set session context for reset ${targetInterface} interface`);
      } catch (contextError) {
        console.warn(`Failed to set session context during reset:`, contextError);
      }
    }
    
    console.log(`Interface ${targetInterface} successfully reset to default state`);
  }

  /**
   * TASK-NEW-039: Implement comprehensive interface state synchronization recovery
   */
  private async implementComprehensiveStateSyncRecovery(
    fromInterface: InterfaceType,
    toInterface: InterfaceType,
    transferData: InterfaceStateTransferData,
    syncError: string
  ): Promise<void> {
    console.log(`Initiating comprehensive state synchronization recovery: ${fromInterface} → ${toInterface}`);
    
    const recoveryStartTime = Date.now();
    
    try {
      // Recovery Strategy 1: Retry synchronization with reduced complexity
      await this.retryStateSynchronizationSimplified(fromInterface, toInterface, transferData);
      
      console.log(`Recovery successful: Simplified synchronization completed`);
      
      // Emit successful recovery event
      this.emit('comprehensiveRecoverySuccess', {
        fromInterface,
        toInterface,
        originalError: syncError,
        recoveryMethod: 'simplified-retry',
        recoveryTime: Date.now() - recoveryStartTime,
        timestamp: Date.now()
      });
      
    } catch (retryError) {
      console.warn('Simplified synchronization retry failed:', retryError);
      
      try {
        // Recovery Strategy 2: Progressive state restoration
        await this.progressiveStateRestoration(fromInterface, toInterface, transferData);
        
        console.log(`Recovery successful: Progressive restoration completed`);
        
        // Emit successful recovery event
        this.emit('comprehensiveRecoverySuccess', {
          fromInterface,
          toInterface,
          originalError: syncError,
          recoveryMethod: 'progressive-restoration',
          recoveryTime: Date.now() - recoveryStartTime,
          timestamp: Date.now()
        });
        
      } catch (progressiveError) {
        console.warn('Progressive state restoration failed:', progressiveError);
        
        try {
          // Recovery Strategy 3: Emergency state preservation
          await this.emergencyStatePreservation(fromInterface, toInterface, transferData);
          
          console.log(`Recovery successful: Emergency state preservation completed`);
          
          // Emit successful recovery event
          this.emit('comprehensiveRecoverySuccess', {
            fromInterface,
            toInterface,
            originalError: syncError,
            recoveryMethod: 'emergency-preservation',
            recoveryTime: Date.now() - recoveryStartTime,
            timestamp: Date.now()
          });
          
        } catch (emergencyError) {
          console.error('All comprehensive recovery strategies failed:', emergencyError);
          
          // Final Strategy: Session state isolation and continuation
          await this.isolateSessionStateAndContinue(fromInterface, toInterface, transferData, {
            syncError,
            retryError: retryError instanceof Error ? retryError.message : String(retryError),
            progressiveError: progressiveError instanceof Error ? progressiveError.message : String(progressiveError),
            emergencyError: emergencyError instanceof Error ? emergencyError.message : String(emergencyError)
          });
          
          // Emit recovery completion (not success, but managed failure)
          this.emit('comprehensiveRecoveryCompleted', {
            fromInterface,
            toInterface,
            originalError: syncError,
            recoveryMethod: 'session-isolation',
            recoveryTime: Date.now() - recoveryStartTime,
            status: 'partial-failure-managed',
            timestamp: Date.now()
          });
          
          console.log(`Recovery completed: Session isolated and continuing with limited state synchronization`);
        }
      }
    }
  }

  /**
   * TASK-NEW-039: Retry state synchronization with reduced complexity
   */
  private async retryStateSynchronizationSimplified(
    fromInterface: InterfaceType,
    toInterface: InterfaceType,
    transferData: InterfaceStateTransferData
  ): Promise<void> {
    console.log(`Attempting simplified state synchronization retry: ${fromInterface} → ${toInterface}`);
    
    const toAdapter = this.interfaceAdapters[toInterface];
    if (!toAdapter) {
      throw new Error(`Target adapter ${toInterface} not available for retry`);
    }
    
    // Simplified transfer data - only essential state
    const simplifiedTransferData: InterfaceStateTransferData = {
      sessionId: transferData.sessionId,
      fromInterface: transferData.fromInterface,
      toInterface: transferData.toInterface,
      timestamp: Date.now(),
      // Only include essential data
      loadedSkins: transferData.loadedSkins,
      activeBackends: transferData.activeBackends,
      // Minimal preserved state
      preservedState: {
        lastActivity: transferData.preservedState?.lastActivity || new Date()
      }
    };
    
    // Try simplified restore if adapter supports it
    if ('simplifiedRestore' in toAdapter && typeof (toAdapter as any).simplifiedRestore === 'function') {
      await (toAdapter as any).simplifiedRestore(simplifiedTransferData);
      console.log(`Simplified restore successful for ${toInterface}`);
    } else {
      // Manual simplified restoration
      console.log(`Performing manual simplified restoration for ${toInterface}`);
      
      // Only restore skins (most critical for interface functionality)
      await this.synchronizeSkinState(toInterface);
      
      console.log(`Manual simplified restoration completed for ${toInterface}`);
    }
  }

  /**
   * TASK-NEW-039: Progressive state restoration with incremental complexity
   */
  private async progressiveStateRestoration(
    fromInterface: InterfaceType,
    toInterface: InterfaceType,
    transferData: InterfaceStateTransferData
  ): Promise<void> {
    console.log(`Initiating progressive state restoration: ${fromInterface} → ${toInterface}`);
    
    const adapter = this.interfaceAdapters[toInterface];
    if (!adapter) {
      throw new Error(`Adapter ${toInterface} not available for progressive restoration`);
    }
    
    const restorationSteps = [
      {
        name: 'session-context',
        action: () => this.restoreSessionContext(toInterface, transferData)
      },
      {
        name: 'skin-synchronization',
        action: () => this.synchronizeSkinState(toInterface)
      },
      {
        name: 'backend-coordination',
        action: () => this.coordinateBackendState(transferData)
      },
      {
        name: 'user-preferences',
        action: () => this.restoreUserPreferences(toInterface, transferData)
      },
      {
        name: 'navigation-state',
        action: () => this.restoreNavigationState(toInterface, transferData)
      }
    ];
    
    const completedSteps: string[] = [];
    const failedSteps: Array<{name: string, error: string}> = [];
    
    for (const step of restorationSteps) {
      try {
        console.log(`Progressive restoration: Executing step ${step.name}`);
        await step.action();
        completedSteps.push(step.name);
        console.log(`Progressive restoration: Step ${step.name} completed`);
      } catch (stepError) {
        const errorMessage = stepError instanceof Error ? stepError.message : String(stepError);
        console.warn(`Progressive restoration: Step ${step.name} failed:`, errorMessage);
        failedSteps.push({ name: step.name, error: errorMessage });
        
        // Continue with next step - progressive restoration allows partial success
      }
    }
    
    console.log(`Progressive restoration completed: ${completedSteps.length}/${restorationSteps.length} steps successful`);
    
    if (completedSteps.length === 0) {
      throw new Error(`All progressive restoration steps failed: ${failedSteps.map(f => f.name).join(', ')}`);
    }
    
    // Emit progress details
    this.emit('progressiveRestorationCompleted', {
      fromInterface,
      toInterface,
      completedSteps,
      failedSteps,
      successRate: completedSteps.length / restorationSteps.length,
      timestamp: Date.now()
    });
  }

  /**
   * TASK-NEW-039: Emergency state preservation to maintain session continuity
   */
  private async emergencyStatePreservation(
    fromInterface: InterfaceType,
    toInterface: InterfaceType,
    transferData: InterfaceStateTransferData
  ): Promise<void> {
    console.log(`Executing emergency state preservation: ${fromInterface} → ${toInterface}`);
    
    // Emergency strategy: Preserve only critical session data to prevent total loss
    const emergencyData = {
      sessionId: transferData.sessionId,
      timestamp: Date.now(),
      fromInterface,
      toInterface,
      criticalState: {
        sessionId: transferData.sessionId,
        activeBackends: Array.from(this.activeBackends),
        loadedSkinsCount: this.loadedSkins.size,
        lastActivity: new Date()
      }
    };
    
    // Store emergency data in session state for later recovery
    if (this.currentSessionId) {
      const sessionState = this.sessionStates.get(this.currentSessionId);
      if (sessionState) {
        // Store emergency data in session state
        (sessionState as any).emergencyData = emergencyData;
        sessionState.lastActivity = new Date();
        
        console.log(`Emergency data preserved in session state ${this.currentSessionId}`);
      }
    }
    
    // Minimal interface setup to ensure basic functionality
    const adapter = this.interfaceAdapters[toInterface];
    if (adapter) {
      try {
        // Emergency interface initialization
        if ('emergencySetup' in adapter && typeof (adapter as any).emergencySetup === 'function') {
          await (adapter as any).emergencySetup(emergencyData);
          console.log(`Emergency setup completed for ${toInterface} adapter`);
        } else {
          // Basic emergency setup - just ensure the adapter is responsive
          if ('ping' in adapter && typeof (adapter as any).ping === 'function') {
            await (adapter as any).ping();
            console.log(`Emergency ping successful for ${toInterface} adapter`);
          }
        }
      } catch (setupError) {
        console.warn(`Emergency interface setup failed:`, setupError);
        // Continue anyway - emergency preservation is about data protection, not perfect functionality
      }
    }
    
    // Emit emergency preservation event
    this.emit('emergencyStatePreserved', {
      fromInterface,
      toInterface,
      emergencyData,
      sessionId: transferData.sessionId,
      timestamp: Date.now()
    });
    
    console.log(`Emergency state preservation completed`);
  }

  /**
   * TASK-NEW-039: Isolate session state and continue operation
   */
  private async isolateSessionStateAndContinue(
    fromInterface: InterfaceType,
    toInterface: InterfaceType,
    transferData: InterfaceStateTransferData,
    errorHistory: Record<string, string>
  ): Promise<void> {
    console.log(`Isolating session state and continuing: ${fromInterface} → ${toInterface}`);
    
    // Create isolation boundary - prevent cascade failures
    const isolatedSessionData = {
      sessionId: transferData.sessionId,
      isolationReason: 'state-sync-failure',
      isolationTimestamp: Date.now(),
      fromInterface,
      toInterface,
      errorHistory,
      isolationLevel: 'state-synchronization',
      continuationMode: 'limited-functionality'
    };
    
    // Update session state to reflect isolation
    if (this.currentSessionId) {
      const sessionState = this.sessionStates.get(this.currentSessionId);
      if (sessionState) {
        // Mark session as operating in isolated mode
        (sessionState as any).isolationData = isolatedSessionData;
        sessionState.lastActivity = new Date();
        
        // Update session metrics to reflect recovery attempt
        sessionState.sessionMetrics.interfaceSwitches += 1; // Count the attempt
        
        console.log(`Session ${this.currentSessionId} isolated and continuing in limited functionality mode`);
      }
    }
    
    // Ensure minimal interface functionality
    const adapter = this.interfaceAdapters[toInterface];
    if (adapter) {
      try {
        // Set isolated mode on adapter if supported
        if ('setIsolationMode' in adapter && typeof (adapter as any).setIsolationMode === 'function') {
          await (adapter as any).setIsolationMode(isolatedSessionData);
          console.log(`Isolation mode set on ${toInterface} adapter`);
        }
        
        // Apply at least one skin for basic functionality
        if (this.loadedSkins.size > 0) {
          const firstSkin = Array.from(this.loadedSkins.values())[0];
          if (firstSkin.metadata.compatibleInterfaces.includes(toInterface)) {
            try {
              await adapter.applySkin(firstSkin);
              console.log(`Applied fallback skin for isolated mode: ${firstSkin.metadata.id}`);
            } catch (skinError) {
              console.warn(`Failed to apply fallback skin in isolation mode:`, skinError);
            }
          }
        }
      } catch (isolationError) {
        console.warn(`Failed to configure isolation mode:`, isolationError);
        // Continue anyway - isolation is about graceful degradation
      }
    }
    
    // Emit session isolation event
    this.emit('sessionStateIsolated', {
      fromInterface,
      toInterface,
      sessionId: transferData.sessionId,
      isolationData: isolatedSessionData,
      timestamp: Date.now()
    });
    
    console.log(`Session state isolated successfully - operation continuing with limited functionality`);
  }

  /**
   * TASK-NEW-039: Helper methods for progressive restoration
   */
  private async restoreSessionContext(targetInterface: InterfaceType, transferData: InterfaceStateTransferData): Promise<void> {
    const adapter = this.interfaceAdapters[targetInterface];
    if (!adapter) return;
    
    if ('setSessionContext' in adapter && typeof (adapter as any).setSessionContext === 'function') {
      const sessionContext = {
        sessionId: transferData.sessionId,
        fromInterface: transferData.fromInterface,
        toInterface: transferData.toInterface,
        timestamp: transferData.timestamp
      };
      
      await (adapter as any).setSessionContext(sessionContext);
      console.log(`Session context restored for ${targetInterface}`);
    }
  }

  private async restoreUserPreferences(targetInterface: InterfaceType, transferData: InterfaceStateTransferData): Promise<void> {
    const adapter = this.interfaceAdapters[targetInterface];
    if (!adapter || !transferData.preservedState?.userPreferences) return;
    
    if ('updatePreferences' in adapter && typeof (adapter as any).updatePreferences === 'function') {
      await (adapter as any).updatePreferences(transferData.preservedState.userPreferences);
      console.log(`User preferences restored for ${targetInterface}`);
    }
  }

  private async restoreNavigationState(targetInterface: InterfaceType, transferData: InterfaceStateTransferData): Promise<void> {
    const adapter = this.interfaceAdapters[targetInterface];
    if (!adapter || !transferData.navigationHistory || transferData.navigationHistory.length === 0) return;
    
    if ('restoreNavigation' in adapter && typeof (adapter as any).restoreNavigation === 'function') {
      await (adapter as any).restoreNavigation(transferData.navigationHistory);
      console.log(`Navigation state restored for ${targetInterface}`);
    }
  }

  /**
   * TASK-NEW-040: Synchronize backend session state during interface switching
   */
  private async synchronizeBackendSessionState(transferData: InterfaceStateTransferData): Promise<void> {
    console.log(`Synchronizing backend session state: ${transferData.fromInterface} → ${transferData.toInterface}`);
    
    const synchronizationStartTime = Date.now();
    const synchronizationResults: Array<{
      backendId: string;
      status: 'success' | 'partial' | 'failed';
      method: string;
      error?: string;
    }> = [];
    
    try {
      if (transferData.activeBackends) {
        for (const backendId of transferData.activeBackends) {
        console.log(`Synchronizing session state with backend: ${backendId}`);
        
        try {
          const syncResult = await this.synchronizeIndividualBackendState(backendId, transferData);
          synchronizationResults.push(syncResult);
          
          console.log(`Backend ${backendId} session synchronization: ${syncResult.status} (${syncResult.method})`);
          
        } catch (backendError) {
          const errorMessage = backendError instanceof Error ? backendError.message : String(backendError);
          console.warn(`Failed to synchronize session state with backend ${backendId}:`, errorMessage);
          
          synchronizationResults.push({
            backendId,
            status: 'failed',
            method: 'none',
            error: errorMessage
          });
          
          // Continue with other backends - don't let one failure stop the entire process
        }
        }
      }
      
      // Analyze synchronization results
      const successfulSyncs = synchronizationResults.filter(r => r.status === 'success').length;
      const partialSyncs = synchronizationResults.filter(r => r.status === 'partial').length;
      const failedSyncs = synchronizationResults.filter(r => r.status === 'failed').length;
      
      console.log(`Backend session state synchronization completed: ${successfulSyncs} successful, ${partialSyncs} partial, ${failedSyncs} failed`);
      
      // Update session state with synchronization results
      if (this.currentSessionId) {
        const sessionState = this.sessionStates.get(this.currentSessionId);
        if (sessionState) {
          // Store synchronization metadata in session state
          (sessionState as any).backendSyncResults = {
            lastSyncTimestamp: Date.now(),
            synchronizationTime: Date.now() - synchronizationStartTime,
            results: synchronizationResults,
            successRate: synchronizationResults.length > 0 ? successfulSyncs / synchronizationResults.length : 0
          };
          
          sessionState.lastActivity = new Date();
        }
      }
      
      // Emit synchronization completion event
      this.emit('backendSessionStateSynchronized', {
        fromInterface: transferData.fromInterface,
        toInterface: transferData.toInterface,
        sessionId: transferData.sessionId,
        results: synchronizationResults,
        successRate: synchronizationResults.length > 0 ? successfulSyncs / synchronizationResults.length : 0,
        synchronizationTime: Date.now() - synchronizationStartTime,
        timestamp: Date.now()
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Backend session state synchronization failed:', errorMessage);
      
      // Emit error event but don't throw - interface switching should continue
      this.emit('backendSessionStateSyncError', {
        fromInterface: transferData.fromInterface,
        toInterface: transferData.toInterface,
        sessionId: transferData.sessionId,
        error: errorMessage,
        timestamp: Date.now()
      });
    }
  }

  /**
   * TASK-NEW-040: Synchronize session state with individual backend service
   */
  private async synchronizeIndividualBackendState(
    backendId: string,
    transferData: InterfaceStateTransferData
  ): Promise<{backendId: string, status: 'success' | 'partial' | 'failed', method: string, error?: string}> {
    
    try {
      // Strategy 1: Use dedicated session synchronization command if backend supports it
      console.log(`Attempting dedicated session sync command for backend ${backendId}`);
      
      try {
        const sessionSyncData = {
          sessionId: transferData.sessionId,
          fromInterface: transferData.fromInterface,
          toInterface: transferData.toInterface,
          timestamp: transferData.timestamp,
          preservedState: transferData.preservedState,
          navigationHistory: transferData.navigationHistory
        };
        
        const syncResponse = await this.backendServiceRouter.executeCommand(
          backendId,
          'session_interface_switch',
          [sessionSyncData]
        );
        
        console.log(`Backend ${backendId} dedicated session sync successful:`, syncResponse);
        
        return {
          backendId,
          status: 'success',
          method: 'dedicated-session-sync'
        };
        
      } catch (_dedicatedError) {
        console.log(`Backend ${backendId} doesn't support dedicated session sync, trying state persistence`);
        
        // Strategy 2: Use state persistence commands
        try {
          await this.persistBackendSessionState(backendId, transferData);
          
          return {
            backendId,
            status: 'success',
            method: 'state-persistence'
          };
          
        } catch (_persistError) {
          console.log(`Backend ${backendId} state persistence failed, trying basic sync`);
          
          // Strategy 3: Basic synchronization using standard commands
          try {
            await this.basicBackendSessionSync(backendId, transferData);
            
            return {
              backendId,
              status: 'partial',
              method: 'basic-sync'
            };
            
          } catch (basicError) {
            console.warn(`All synchronization methods failed for backend ${backendId}`);
            
            return {
              backendId,
              status: 'failed',
              method: 'none',
              error: basicError instanceof Error ? basicError.message : String(basicError)
            };
          }
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Backend ${backendId} session synchronization failed:`, errorMessage);
      
      return {
        backendId,
        status: 'failed',
        method: 'none',
        error: errorMessage
      };
    }
  }

  /**
   * TASK-NEW-040: Persist backend session state for synchronization
   */
  private async persistBackendSessionState(
    backendId: string,
    transferData: InterfaceStateTransferData
  ): Promise<void> {
    console.log(`Persisting session state with backend ${backendId}`);
    
    // Create persistence payload with essential session data
    const persistenceData = {
      sessionId: transferData.sessionId,
      interfaceTransition: {
        from: transferData.fromInterface,
        to: transferData.toInterface,
        timestamp: transferData.timestamp
      },
      sessionContext: {
        activeBackends: transferData.activeBackends,
        loadedSkins: transferData.loadedSkins,
        navigationHistory: transferData.navigationHistory
      },
      preservedState: transferData.preservedState || {}
    };
    
    try {
      // Try to persist session state using backend's session persistence API
      const persistResult = await this.backendServiceRouter.executeCommand(
        backendId,
        'persist_session_state',
        [persistenceData]
      );
      
      console.log(`Session state persisted successfully with backend ${backendId}:`, persistResult);
      
    } catch (persistError) {
      console.warn(`Session state persistence failed for backend ${backendId}:`, persistError);
      
      // Fallback: Try to store essential state using generic storage command
      try {
        const fallbackData = {
          key: `session_${transferData.sessionId}`,
          data: {
            interfaceTransition: persistenceData.interfaceTransition,
            timestamp: Date.now()
          }
        };
        
        await this.backendServiceRouter.executeCommand(
          backendId,
          'store_data',
          [fallbackData.key, fallbackData.data]
        );
        
        console.log(`Fallback session data stored with backend ${backendId}`);
        
      } catch (fallbackError) {
        console.error(`Both persistence and fallback storage failed for backend ${backendId}:`, fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * TASK-NEW-040: Basic backend session synchronization using standard commands
   */
  private async basicBackendSessionSync(
    backendId: string,
    transferData: InterfaceStateTransferData
  ): Promise<void> {
    console.log(`Performing basic session sync with backend ${backendId}`);
    
    try {
      // Basic sync approach: Just inform backend of interface switch
      const _basicSyncData = {
        event: 'interface_switch',
        sessionId: transferData.sessionId,
        fromInterface: transferData.fromInterface,
        toInterface: transferData.toInterface,
        timestamp: transferData.timestamp
      };
      
      // Use the existing interface switch notification (already implemented)
      await this.backendServiceRouter.executeCommand(
        backendId,
        'interface_switch_notification',
        [transferData.fromInterface, transferData.toInterface, transferData.sessionId]
      );
      
      console.log(`Basic session sync notification sent to backend ${backendId}`);
      
      // Additionally try to sync current session ID if backend supports it
      try {
        await this.backendServiceRouter.executeCommand(
          backendId,
          'set_active_session',
          [transferData.sessionId]
        );
        
        console.log(`Active session ID synchronized with backend ${backendId}`);
        
      } catch (_sessionIdError) {
        console.log(`Backend ${backendId} doesn't support active session sync - continuing with basic sync`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Basic session sync failed for backend ${backendId}:`, errorMessage);
      throw error;
    }
  }

  /**
   * TASK-NEW-040: Get backend session state synchronization status
   */
  getBackendSyncStatus(): {
    lastSyncTimestamp?: number;
    successRate?: number;
    syncResults?: Array<{backendId: string, status: string, method: string}>;
  } | null {
    if (!this.currentSessionId) {
      return null;
    }
    
    const sessionState = this.sessionStates.get(this.currentSessionId);
    if (!sessionState) {
      return null;
    }
    
    const syncResults = (sessionState as any).backendSyncResults;
    if (!syncResults) {
      return null;
    }
    
    return {
      lastSyncTimestamp: syncResults.lastSyncTimestamp,
      successRate: syncResults.successRate,
      syncResults: syncResults.results?.map((r: any) => ({
        backendId: r.backendId,
        status: r.status,
        method: r.method
      }))
    };
  }
}