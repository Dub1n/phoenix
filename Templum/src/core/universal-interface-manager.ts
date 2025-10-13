/**---
 * title: [Universal Interface Manager - Interface Orchestration Coordinator]
 * tags: [Interface, Manager, Orchestration, State, Coordination]
 * provides: [Interface Switching, State Preservation, Adapter Management]
 * requires: [Interface Adapters, Session Management, Universal Skin Engine]
 * description: [Coordinates interface switching with state preservation and session management]
 * ---*/

import {
  InterfaceType,
  InterfaceAdapter,
  StateUpdate,
  createTemplumError
} from '../types/templum-types';
import {
  ITemplumCoreDependencies
} from '../interfaces/core-component-interfaces';
import { SemanticValidators, TypeGuards } from '../utils/type-guards';
import { type TypedEventMap } from '../utils/event-utils';
import { EventDrivenComponent } from '../utils/event-bus-adapter';

export interface InterfaceSwitchOptions {
  preserveSession?: boolean;
  migrateState?: boolean;
  maintainConnections?: boolean;
  performanceMetrics?: boolean;
}

export interface InterfaceSwitchPreparation {
  success: boolean;
  message?: string;
  preservedState?: any;
  compatibilityIssues?: string[];
  estimatedSwitchTime?: number;
}

export interface InterfaceManagerStatus {
  activeInterface: InterfaceType | null;
  availableInterfaces: InterfaceType[];
  sessionPreservationEnabled: boolean;
  lastSwitchTime?: number;
  switchHistory: Array<{
    from: InterfaceType;
    to: InterfaceType;
    timestamp: number;
    duration: number;
    success: boolean;
  }>;
}

/**
 * Universal Interface Manager
 * Implements the Universal Interface Orchestration pattern
 * Coordinates interface switching with state preservation and session management
 */
interface UniversalInterfaceManagerEvents extends TypedEventMap {
  interfaceAdapterRegistered: (payload: { interfaceType: InterfaceType; adapter: InterfaceAdapter }) => void;
  interfaceSwitchPrepared: (payload: {
    targetInterface: InterfaceType;
    options: InterfaceSwitchOptions;
    result: InterfaceSwitchPreparation;
    preparationTime: number;
  }) => void;
  interfaceSwitchExecuted: (payload: {
    from: InterfaceType | null;
    to: InterfaceType;
    switchTime: number;
    options: InterfaceSwitchOptions;
  }) => void;
  interfaceSwitchFailed: (payload: {
    from: InterfaceType | null;
    to: InterfaceType;
    error: string;
    switchTime: number;
    recovered: boolean;
    fallbackInterface?: InterfaceType;
  }) => void;
  adapterStateUpdate: (payload: { interfaceType: InterfaceType; update: StateUpdate }) => void;
  interfaceSwitchError: (payload: {
    operation: string;
    targetInterface: InterfaceType;
    previousInterface: InterfaceType | null;
    duration: number;
    error: string;
  }) => void;
  disposed: () => void;
}

export class UniversalInterfaceManager extends EventDrivenComponent<UniversalInterfaceManagerEvents> {
  private interfaceAdapters: Map<InterfaceType, InterfaceAdapter> = new Map();
  private activeInterface: InterfaceType | null = null;
  private dependencies: ITemplumCoreDependencies;
  private switchHistory: Array<{
    from: InterfaceType;
    to: InterfaceType;
    timestamp: number;
    duration: number;
    success: boolean;
  }> = [];

  // Interface switching state preservation
  private preservedStates: Map<InterfaceType, any> = new Map();
  private sessionIntegrationEnabled: boolean = true;
  
  constructor(dependencies: ITemplumCoreDependencies) {
    super('universal-interface-manager', 100);
    this.dependencies = dependencies;
  }

  /**
   * Register an interface adapter with the manager
   */
  registerInterfaceAdapter(interfaceType: InterfaceType, adapter: InterfaceAdapter): void {
    if (!TypeGuards.isObject(adapter)) {
      throw createTemplumError(
        `Interface adapter for ${interfaceType} must be an object`,
        'INTERFACE_ADAPTER_INVALID',
        'validation',
        { interfaceType },
      );
    }

    const requiredMethods: Array<keyof InterfaceAdapter> = ['getInterfaceType', 'applySkin', 'syncState', 'dispose', 'getStatus'];

    for (const method of requiredMethods) {
      if (!SemanticValidators.hasFunction(adapter, method as string, { required: true })) {
        throw createTemplumError(
          `Interface adapter for ${interfaceType} must implement ${String(method)}`,
          'INTERFACE_ADAPTER_INVALID',
          'validation',
          { interfaceType, missingMethod: method },
        );
      }
    }

    const declaredType = adapter.getInterfaceType();
    if (declaredType !== interfaceType) {
      throw createTemplumError(
        `Interface adapter declared type ${declaredType} does not match requested ${interfaceType}` ,
        'INTERFACE_ADAPTER_INVALID',
        'validation',
        { interfaceType, declaredType },
      );
    }

    this.interfaceAdapters.set(interfaceType, adapter);

    if (SemanticValidators.hasFunction(adapter, 'on', { required: false })) {
      (adapter as unknown as { on(event: string, handler: (payload: unknown) => void): void }).on(
        'stateUpdate',
        (payload: unknown) => {
          if (this.isStateUpdate(payload)) {
            this.handleAdapterStateUpdate(interfaceType, payload);
          }
        }
      );
    }

    this.emit('interfaceAdapterRegistered', { interfaceType, adapter });
  }

  /**
   * Prepare interface switch with comprehensive validation and state preservation
   * This is the method called by extension.ts
   */
  async prepareInterfaceSwitch(
    targetInterface: InterfaceType,
    options: InterfaceSwitchOptions = {}
  ): Promise<InterfaceSwitchPreparation> {
    const startTime = Date.now();
    
    try {
      // Comprehensive validation of interface switch prerequisites - TASK-NEW-048
      const validationResult = await this.validateInterfaceSwitchPrerequisites(targetInterface, options);
      
      if (!validationResult.valid) {
        return {
          success: false,
          message: `Interface switch validation failed: ${validationResult.issues.join('; ')}`,
          compatibilityIssues: validationResult.issues
        };
      }

      // Report warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('Interface switch warnings:', validationResult.warnings);
      }

      const compatibilityIssues: string[] = [];

      // Enhanced session state preservation - TASK-NEW-048
      let preservedState = null;
      if (options.preserveSession && this.activeInterface) {
        try {
          // Get current session context for state preservation
          let sessionContext = null;
          if (
            this.dependencies.stateManager &&
            SemanticValidators.hasFunction(this.dependencies.stateManager, 'getSessionContext', { required: false })
          ) {
            sessionContext = await (this.dependencies.stateManager as any).getSessionContext();
          }
          
          // Get state from current interface adapter
          const currentAdapter = this.interfaceAdapters.get(this.activeInterface);
          if (currentAdapter && SemanticValidators.hasFunction(currentAdapter, 'getState', { required: false })) {
            preservedState = await (currentAdapter as any).getState();
          }
          
          // Also preserve from state manager with session context
          if (
            this.dependencies.stateManager &&
            SemanticValidators.hasFunction(this.dependencies.stateManager, 'getState', { required: false })
          ) {
            const globalState = await (this.dependencies.stateManager as any).getState();
            preservedState = { 
              ...preservedState, 
              globalState,
              sessionContext: sessionContext || null,
              timestamp: Date.now()
            };
          }
          
          // Store session metadata if available
          if (sessionContext) {
            preservedState.sessionMetadata = {
              sessionId: sessionContext.sessionId,
              activeInterface: this.activeInterface,
              targetInterface: targetInterface,
              switchTimestamp: Date.now()
            };
          }
        } catch (error) {
          console.warn('Failed to preserve state during interface switch preparation:', error);
          compatibilityIssues.push('State preservation failed');
        }
      }

      // Validate Universal Skin Engine compatibility
      if (this.dependencies.skinEngine) {
        try {
          // Check if skin engine supports target interface
          const skinEngineSupport = await this.validateSkinEngineCompatibility(targetInterface);
          if (!skinEngineSupport.compatible) {
            compatibilityIssues.push(`Skin engine compatibility issue: ${skinEngineSupport.reason}`);
          }
        } catch (_error) {
          compatibilityIssues.push('Skin engine validation failed');
        }
      }

      // Estimate switch time based on historical data
      const estimatedSwitchTime = this.estimateSwitchTime(this.activeInterface, targetInterface);

      const result: InterfaceSwitchPreparation = {
        success: compatibilityIssues.length === 0,
        message: compatibilityIssues.length === 0 
          ? 'Interface switch preparation successful'
          : `Preparation completed with ${compatibilityIssues.length} issues`,
        preservedState,
        compatibilityIssues,
        estimatedSwitchTime
      };

      // Store preserved state for later restoration
      if (preservedState && this.activeInterface) {
        this.preservedStates.set(this.activeInterface, preservedState);
      }

      this.emit('interfaceSwitchPrepared', { 
        targetInterface, 
        options, 
        result, 
        preparationTime: Date.now() - startTime 
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Interface switch preparation failed: ${errorMessage}`,
        compatibilityIssues: [errorMessage]
      };
    }
  }

  /**
   * Execute interface switch with enhanced coordination
   */
  async executeInterfaceSwitch(
    targetInterface: InterfaceType,
    options: InterfaceSwitchOptions = {}
  ): Promise<{ success: boolean; message: string; switchTime?: number }> {
    const switchStartTime = Date.now();
    const previousInterface = this.activeInterface;

    try {
      // Get target adapter
      const targetAdapter = this.interfaceAdapters.get(targetInterface);
      if (!targetAdapter) {
        throw createTemplumError(
          `Target interface adapter '${targetInterface}' not available`,
          'INTERFACE_SWITCH_ERROR',
          'runtime'
        );
      }

      // Enhanced Universal Skin Engine coordination for interface-specific rendering - TASK-NEW-048
      if (this.dependencies.skinEngine && options.migrateState) {
        try {
          // Use the Universal Skin Engine directly without switchInterface method
          // since it's not in the ISkinEngine interface
          let switchResult = { success: true, preservedState: options.preserveSession || false };
          
          // Check if the skin engine is actually UniversalSkinEngine with switchInterface method
          if (SemanticValidators.hasFunction(this.dependencies.skinEngine, 'switchInterface', { required: false })) {
            switchResult = await (this.dependencies.skinEngine as any).switchInterface(
              previousInterface || 'none',
              targetInterface,
              options.preserveSession
            );
            
            if (!switchResult.success) {
              console.warn('Skin engine interface switch had issues:', switchResult);
            }
          }
          
          // Apply interface-specific skin rendering if we have loaded skins
          await this.applyInterfaceSpecificRendering(targetInterface, switchResult);
          
        } catch (error) {
          console.warn('Skin engine coordination failed during interface switch:', error);
        }
      }

      // Enhanced state restoration with session coordination - TASK-NEW-048
      if (options.migrateState && this.preservedStates.has(targetInterface)) {
        try {
          const preservedState = this.preservedStates.get(targetInterface);
          
          // Restore to target adapter
          if (SemanticValidators.hasFunction(targetAdapter, 'setState', { required: false })) {
            await (targetAdapter as any).setState(preservedState);
          }
          
          // Restore to state manager with session context
          if (
            this.dependencies.stateManager &&
            SemanticValidators.hasFunction(this.dependencies.stateManager, 'setState', { required: false })
          ) {
            await (this.dependencies.stateManager as any).setState(preservedState.globalState);
          }
          
          // Restore session context if available
          if (preservedState.sessionContext && preservedState.sessionMetadata) {
            try {
              // Update session with interface switch information
              if (
            this.dependencies.stateManager &&
            SemanticValidators.hasFunction(this.dependencies.stateManager, 'updateSessionInterface', { required: false })
          ) {
                await (this.dependencies.stateManager as any).updateSessionInterface(
                  preservedState.sessionMetadata.sessionId,
                  targetInterface
                );
              }
              
              // Set session context on target adapter
              if (SemanticValidators.hasFunction(targetAdapter, 'setSessionContext', { required: false })) {
                const sessionContext = {
                  ...preservedState.sessionContext,
                  activeInterface: targetInterface,
                  lastSwitchTime: Date.now(),
                  interfaceSwitchCount: (preservedState.sessionContext.interfaceSwitchCount || 0) + 1
                };
                await (targetAdapter as any).setSessionContext(sessionContext);
              }
            } catch (sessionError) {
              console.warn('Session context restoration failed during interface switch:', sessionError);
            }
          }
          
          // Clear preserved state after successful restoration
          this.preservedStates.delete(targetInterface);
        } catch (error) {
          console.warn('State restoration failed during interface switch:', error);
        }
      }

      // Update active interface
      this.activeInterface = targetInterface;
      
      // Record switch in history
      const switchTime = Date.now() - switchStartTime;
      this.switchHistory.push({
        from: previousInterface || 'none' as InterfaceType,
        to: targetInterface,
        timestamp: switchStartTime,
        duration: switchTime,
        success: true
      });

      // Emit events for coordination
      this.emit('interfaceSwitchExecuted', {
        from: previousInterface,
        to: targetInterface,
        switchTime,
        options
      });

      return {
        success: true,
        message: `Successfully switched to ${targetInterface} interface`,
        switchTime
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error during interface switch');
      
      // Enhanced error handling with recovery strategies - TASK-NEW-048
      const recoveryResult = await this.handleInterfaceSwitchError(
        err,
        targetInterface,
        previousInterface,
        {
          operation: 'executeInterfaceSwitch',
          startTime: switchStartTime
        }
      );

      // Record failed switch (or recovered switch)
      this.switchHistory.push({
        from: previousInterface || 'none' as InterfaceType,
        to: recoveryResult.fallbackInterface || targetInterface,
        timestamp: switchStartTime,
        duration: Date.now() - switchStartTime,
        success: recoveryResult.recovered
      });

      // Update active interface if recovery was successful
      if (recoveryResult.recovered && recoveryResult.fallbackInterface) {
        this.activeInterface = recoveryResult.fallbackInterface;
      }

      this.emit('interfaceSwitchFailed', {
        from: previousInterface,
        to: targetInterface,
        error: err.message,
        switchTime: Date.now() - switchStartTime,
        recovered: recoveryResult.recovered,
        fallbackInterface: recoveryResult.fallbackInterface
      });

      return {
        success: recoveryResult.recovered,
        message: recoveryResult.message,
        switchTime: Date.now() - switchStartTime
      };
    }
  }

  /**
   * Get current interface manager status
   */
  getStatus(): InterfaceManagerStatus {
    return {
      activeInterface: this.activeInterface,
      availableInterfaces: Array.from(this.interfaceAdapters.keys()),
      sessionPreservationEnabled: this.sessionIntegrationEnabled,
      lastSwitchTime: this.switchHistory.length > 0 
        ? this.switchHistory[this.switchHistory.length - 1].timestamp 
        : undefined,
      switchHistory: [...this.switchHistory]
    };
  }

  /**
   * Handle state updates from interface adapters
   */
  private handleAdapterStateUpdate(interfaceType: InterfaceType, update: StateUpdate): void {
    // Coordinate state updates across adapters if needed
    if (this.sessionIntegrationEnabled && this.dependencies.stateManager) {
      // Forward state update to state manager using syncState method
      if (this.dependencies.stateManager.syncState) {
        this.dependencies.stateManager.syncState(interfaceType, update, 'interface-adapter');
      }
    }
    
    this.emit('adapterStateUpdate', { interfaceType, update });
  }

  private isStateUpdate(value: unknown): value is StateUpdate {
    return TypeGuards.isPlainObject(value);
  }

  /**
   * Comprehensive interface switching validation - TASK-NEW-048
   */
  private async validateInterfaceSwitchPrerequisites(
    targetInterface: InterfaceType,
    options: InterfaceSwitchOptions
  ): Promise<{ valid: boolean; issues: string[]; warnings: string[] }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Validate target interface adapter exists and is functional
      const adapter = this.interfaceAdapters.get(targetInterface);
      if (!adapter) {
        issues.push(`Interface adapter '${targetInterface}' not registered`);
      } else {
        // Check adapter status if available
        if (SemanticValidators.hasFunction(adapter, 'getStatus', { required: false })) {
          const status = adapter.getStatus();
          if (status && 'ready' in status && !status.ready) {
            issues.push(`Interface adapter '${targetInterface}' not ready`);
          }
        }
      }

      // 2. Validate dependencies are initialized
      if (!this.dependencies) {
        issues.push('Universal Interface Manager dependencies not initialized');
      } else {
        // Check critical dependencies
        if (options.migrateState && !this.dependencies.stateManager) {
          warnings.push('State manager not available - state migration will be skipped');
        }
        
        if (!this.dependencies.skinEngine) {
          warnings.push('Skin engine not available - interface rendering may be limited');
        }
      }

      // 3. Validate current interface state
      if (this.activeInterface === targetInterface) {
        warnings.push(`Already on target interface '${targetInterface}'`);
      }

      // 4. Validate session context if session preservation is requested
      if (options.preserveSession) {
        try {
          let hasSessionContext = false;
          if (
            this.dependencies.stateManager &&
            SemanticValidators.hasFunction(this.dependencies.stateManager, 'getSessionContext', { required: false })
          ) {
            const sessionContext = await (this.dependencies.stateManager as any).getSessionContext();
            hasSessionContext = !!sessionContext;
          }
          if (!hasSessionContext) {
            warnings.push('No active session context available for preservation');
          }
        } catch (_error) {
          warnings.push('Failed to validate session context');
        }
      }

      // 5. Validate system resource availability
      const resourceIssues = await this.validateSystemResources();
      issues.push(...resourceIssues.criticalIssues);
      warnings.push(...resourceIssues.warnings);

      return {
        valid: issues.length === 0,
        issues,
        warnings
      };

    } catch (error) {
      issues.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, issues, warnings };
    }
  }

  /**
   * Validate system resources for interface switching
   */
  private async validateSystemResources(): Promise<{ criticalIssues: string[]; warnings: string[] }> {
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    try {
      // Check memory usage if resource manager is available
      if (
            this.dependencies.resourceManager &&
            SemanticValidators.hasFunction(this.dependencies.resourceManager, 'getResourceUsage', { required: false })
          ) {
        const resourceUsage = await (this.dependencies.resourceManager as any).getResourceUsage();
        
        if (resourceUsage && resourceUsage.memoryUsage) {
          const memoryUsage = resourceUsage.memoryUsage.percentage || 0;
          if (memoryUsage > 90) {
            criticalIssues.push('System memory usage critical (>90%)');
          } else if (memoryUsage > 75) {
            warnings.push('High system memory usage detected');
          }
        }
      }

      // Check interface adapter health
      const unhealthyAdapters: string[] = [];
      for (const [interfaceType, adapter] of Array.from(this.interfaceAdapters)) {
        try {
          if (SemanticValidators.hasFunction(adapter, 'healthCheck', { required: false })) {
            const health = await (adapter as any).healthCheck();
            if (!health || !health.healthy) {
              unhealthyAdapters.push(interfaceType);
            }
          }
        } catch (_error) {
          warnings.push(`Health check failed for ${interfaceType} adapter`);
        }
      }

      if (unhealthyAdapters.length > 0) {
        warnings.push(`Unhealthy interface adapters detected: ${unhealthyAdapters.join(', ')}`);
      }

    } catch (_error) {
      warnings.push('System resource validation failed');
    }

    return { criticalIssues, warnings };
  }

  /**
   * Validate skin engine compatibility with target interface
   */
  private async validateSkinEngineCompatibility(
    targetInterface: InterfaceType
  ): Promise<{ compatible: boolean; reason?: string }> {
    try {
      if (!this.dependencies.skinEngine) {
        return { compatible: true }; // No skin engine means no compatibility issues
      }

      // Check if skin engine has interface-specific methods
      if (SemanticValidators.hasFunction(this.dependencies.skinEngine, 'validateInterface', { required: false })) {
        return await (this.dependencies.skinEngine as any).validateInterface(targetInterface);
      }

      // Check if skin engine supports the target interface
      if (SemanticValidators.hasFunction(this.dependencies.skinEngine, 'getSupportedInterfaces', { required: false })) {
        const supportedInterfaces = await (this.dependencies.skinEngine as any).getSupportedInterfaces();
        if (Array.isArray(supportedInterfaces) && !supportedInterfaces.includes(targetInterface)) {
          return {
            compatible: false,
            reason: `Target interface '${targetInterface}' not supported by skin engine`
          };
        }
      }

      // Default compatibility check
      return { compatible: true };
    } catch (error) {
      return {
        compatible: false,
        reason: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Enhanced error handling with recovery strategies
   */
  private async handleInterfaceSwitchError(
    error: Error,
    targetInterface: InterfaceType,
    previousInterface: InterfaceType | null,
    context: { operation: string; startTime: number }
  ): Promise<{ recovered: boolean; fallbackInterface?: InterfaceType; message: string }> {
    const errorContext = {
      operation: context.operation,
      targetInterface,
      previousInterface,
      duration: Date.now() - context.startTime,
      error: error.message
    };

    // Log detailed error information
    console.error('Interface switch error:', errorContext);

    // Emit error event for monitoring
    this.emit('interfaceSwitchError', errorContext);

    // Attempt recovery based on error type
    if (error.message.includes('not registered') || error.message.includes('not available')) {
      // Interface adapter issue - try to fallback to previous interface
      if (previousInterface && this.interfaceAdapters.has(previousInterface)) {
        try {
          this.activeInterface = previousInterface;
          return {
            recovered: true,
            fallbackInterface: previousInterface,
            message: `Recovered by falling back to ${previousInterface} interface`
          };
        } catch (_fallbackError) {
          return {
            recovered: false,
            message: `Failed to recover: ${error.message}. Fallback also failed.`
          };
        }
      }
    }

    if (error.message.includes('State')) {
      // State-related error - continue without state preservation
      return {
        recovered: false,
        message: `Interface switch failed due to state management error: ${error.message}`
      };
    }

    // Generic error handling
    return {
      recovered: false,
      message: `Interface switch failed: ${error.message}`
    };
  }

  /**
   * Estimate switch time based on historical data
   */
  private estimateSwitchTime(fromInterface: InterfaceType | null, toInterface: InterfaceType): number {
    // Find similar switches in history
    const similarSwitches = this.switchHistory.filter(entry => 
      entry.from === fromInterface && entry.to === toInterface && entry.success
    );

    if (similarSwitches.length > 0) {
      // Average of successful similar switches
      const avgTime = similarSwitches.reduce((sum, entry) => sum + entry.duration, 0) / similarSwitches.length;
      return Math.round(avgTime);
    }

    // Default estimates based on interface complexity
    const baseTime = 500; // 500ms base
    const interfaceComplexity = {
      'vscode': 1.5,
      'cli': 1.0,
      'command': 0.8
    };

    return Math.round(baseTime * (interfaceComplexity[toInterface] || 1.0));
  }

  /**
   * Apply interface-specific skin rendering - TASK-NEW-048
   * Enhanced rendering with Universal Skin Engine integration
   */
  private async applyInterfaceSpecificRendering(
    targetInterface: InterfaceType,
    skinSwitchResult: { success: boolean; preservedState: boolean; switchTime?: number }
  ): Promise<void> {
    try {
      if (!this.dependencies.skinEngine) return;

      // Get target interface adapter for rendering
      const targetAdapter = this.interfaceAdapters.get(targetInterface);
      if (!targetAdapter) return;

      // Get any loaded skin definitions from the skin engine
      let currentSkinDefinition = null;
      if (SemanticValidators.hasFunction(this.dependencies.skinEngine, 'getCurrentSkin', { required: false })) {
        currentSkinDefinition = await (this.dependencies.skinEngine as any).getCurrentSkin();
      }

      if (currentSkinDefinition) {
        // Render skin for specific interface with performance optimization
        const renderStartTime = Date.now();
        
        let renderResult = null;
        if (SemanticValidators.hasFunction(this.dependencies.skinEngine, 'renderForInterface', { required: false })) {
          renderResult = await (this.dependencies.skinEngine as any).renderForInterface(
            currentSkinDefinition,
            targetInterface,
            {
              preserveState: skinSwitchResult.preservedState,
              optimizeForPerformance: true,
              interfaceSwitchTime: skinSwitchResult.switchTime
            }
          );
        }

        // Generate interface-specific HTML if this is for VSCode WebView
        if (targetInterface === 'vscode' && renderResult) {
          await this.generateInterfaceHTML(targetAdapter, renderResult, currentSkinDefinition);
        }

        // Apply the rendered skin to the target adapter
        if (renderResult && SemanticValidators.hasFunction(targetAdapter, 'applySkin', { required: false })) {
          await targetAdapter.applySkin(currentSkinDefinition);
        }

        const renderTime = Date.now() - renderStartTime;
        console.log(`Interface-specific rendering applied for ${targetInterface} (${renderTime}ms)`);
      }

    } catch (error) {
      console.warn('Interface-specific rendering failed:', error);
    }
  }

  /**
   * Generate HTML for VSCode WebView rendering - TASK-NEW-048
   * HTML generation pipeline for WebView rendering
   */
  private async generateInterfaceHTML(
    adapter: InterfaceAdapter,
    renderResult: any,
    skinDefinition: any
  ): Promise<void> {
    try {
      // Generate optimized HTML for WebView
      if (SemanticValidators.hasFunction(adapter, 'generateHTML', { required: false })) {
        const htmlContent = await (adapter as any).generateHTML(renderResult, skinDefinition);
        
        // Performance-optimized message handling for WebView
        if (SemanticValidators.hasFunction(adapter, 'postMessage', { required: false })) {
          await (adapter as any).postMessage({
            type: 'render_backend_skin',
            payload: {
              renderResult,
              customHTML: htmlContent,
              performance: {
                generationTime: Date.now(),
                optimized: true
              }
            }
          });
        }
      }
    } catch (error) {
      console.warn('HTML generation failed for VSCode WebView:', error);
    }
  }

  /**
   * Cleanup and disposal
   */
  async dispose(): Promise<void> {
    // Clear all preserved states
    this.preservedStates.clear();
    
    // Clear switch history
    this.switchHistory = [];
    
    // Remove all event listeners
    this.removeAllListeners();
    
    this.emit('disposed');
    this.cleanupEvents();
  }
}
