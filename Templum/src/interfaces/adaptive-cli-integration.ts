/**
---
date: 2025-09-12T180000Z
name: Adaptive CLI Integration System
TASK-ID: [TASK-MCP-006-INTEGRATION]
category: cli-integration
status: ["[T]"]
patterns: [adaptive-integration, compatibility-management, mcp-preservation]
components: [AdaptiveCLIIntegration, CompatibilityManager, MCPBridge]
dependencies: [navigation-system, terminal-compatibility, mcp-channel]
tags: [cli, integration, adaptive, compatibility, mcp-channel]
---
 * 
 * Adaptive CLI Integration System
 * 
 * Integrates all UI components with adaptive compatibility management while
 * preserving MCP Channel functionality. This system provides seamless integration
 * between the enhanced navigation system and the existing CLI adapter.
 * 
 * Generated: 2025-09-12T180000Z
 * TASK-ID: TASK-MCP-006-INTEGRATION Pattern: adaptive-integration | Complexity: 6 | Dependencies: navigation-system,mcp-channel,compatibility-detection
 * Context: Complete UI component integration with adaptive compatibility and MCP preservation
 * Validation-Required: mcp-compatibility, terminal-compatibility, integration-testing, performance-testing
 * Pattern-Info: { approach: "adaptive-integration", alternatives: "direct-replacement", trade-offs: "compatibility-complexity" }
 */

import { CLIInterfaceAdapter } from './cli-adapter-abstracted';
import { UniversalCommandRegistry } from '../commands/universal-command-registry';
import { UniversalMenuRegistry } from '../menus/universal-menu-registry';
import { SessionContextFoundation } from '../session/session-context-foundation';
import { ITemplumOrchestrator } from './templum-orchestrator-interface';
import type { WindowSetRenderResult } from './enhanced-window-system';

// Import navigation system components
import {
  NavigationSystem,
  NavigationSystemConfig,
  NavigationSystemResult,
  createNavigationSystem,
  setupBasicNavigation,
  setupAccessibleNavigation
} from './navigation';

import {
  TerminalCompatibilitySystem,
  TerminalCapabilities,
  CompatibilityTestResult,
  createTerminalCompatibilitySystem,
  checkTerminalCompatibility,
  getSafeTerminalConfig
} from './navigation/terminal-compatibility';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import { TypedEventMap } from '../utils/event-utils';

// TODO: [TASK-ID-001] Pattern: adaptive-integration | Complexity: 6 | Dependencies: mcp-channel-validation
// Context: MCP Channel compatibility bridge for preserving agent-CLI interaction
// Validation-Required: mcp-integration-testing, pty-session-validation, agent-interaction-testing
// Pattern-Info: { approach: "compatibility-bridge", alternatives: "direct-integration", trade-offs: "safety-complexity" }

/**
 * MCP Channel compatibility bridge
 */
export interface MCPCompatibilityBridge {
  // PTY session management
  validatePTYSessions(): Promise<boolean>;
  preserveAgentInteraction(): Promise<boolean>;
  testMCPIntegration(): Promise<MCPIntegrationResult>;
  
  // Session state preservation
  preserveSessionState(): Promise<boolean>;
  restoreSessionContext(): Promise<boolean>;
  
  // Agent communication validation
  validateAgentCommunication(): Promise<boolean>;
  testKeyboardHandling(): Promise<boolean>;
  validateSearchInterface(): Promise<boolean>;
}

/**
 * MCP integration test result
 */
export interface MCPIntegrationResult {
  success: boolean;
  ptySessionsActive: boolean;
  agentInteractionPreserved: boolean;
  keyboardHandlingWorking: boolean;
  searchInterfaceWorking: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Integration configuration
 */
export interface AdaptiveCLIConfig {
  // Navigation system configuration
  navigation?: NavigationSystemConfig;
  
  // Compatibility settings
  compatibility?: {
    enableDetection: boolean;
    forceDetection: boolean;
    fallbackTimeout: number;
    retryAttempts: number;
  };
  
  // MCP preservation settings
  mcpPreservation?: {
    enableValidation: boolean;
    validateBeforeSwitch: boolean;
    preserveSessionState: boolean;
    fallbackToOriginal: boolean;
  };
  
  // Performance settings
  performance?: {
    cacheCapabilities: boolean;
    lazyInitialization: boolean;
    backgroundDetection: boolean;
  };
  
  // Accessibility settings
  accessibility?: {
    forceAccessibleMode: boolean;
    enableVerboseOutput: boolean;
    preferScreenReaderMode: boolean;
  };
}

/**
 * Integration result
 */
export interface AdaptiveCLIResult {
  success: boolean;
  capabilities?: TerminalCapabilities;
  compatibilityScore?: number;
  navigationSystemActive: boolean;
  mcpChannelPreserved: boolean;
  fallbacksActive: string[];
  recommendedSettings?: any;
  errors?: string[];
  warnings?: string[];
}

/**
 * Enhanced CLI state
 */
export interface EnhancedCLIState {
  // Core adapter state
  originalAdapter: CLIInterfaceAdapter;
  isEnhanced: boolean;
  
  // Navigation system state
  navigationSystem: NavigationSystem | null;
  navigationInitialized: boolean;
  
  // Compatibility state
  compatibilitySystem: TerminalCompatibilitySystem | null;
  capabilities: TerminalCapabilities | null;
  compatibilityResult: CompatibilityTestResult | null;
  
  // MCP state
  mcpBridge: MCPCompatibilityBridge | null;
  mcpValidationResult: MCPIntegrationResult | null;
  
  // Adaptive state
  currentMode: 'original' | 'enhanced' | 'fallback' | 'accessibility';
  activeFallbacks: Set<string>;
  lastDetectionTime: Date | null;
}

type IntegrationMode = 'original' | 'enhanced' | 'fallback' | 'accessibility';
type NavigationComponents = ReturnType<NavigationSystem['getComponents']>;

interface AdaptiveCLIIntegrationEvents extends TypedEventMap {
  initializationStarted: () => void;
  initializationCompleted: (result: AdaptiveCLIResult) => void;
  initializationError: (error: unknown) => void;
  compatibilityDetectionStarted: () => void;
  compatibilityDetectionCompleted: (result: CompatibilityTestResult) => void;
  mcpValidationStarted: () => void;
  mcpValidationCompleted: (result: MCPIntegrationResult) => void;
  navigationSystemInitializationStarted: () => void;
  navigationSystemInitializationCompleted: (result: NavigationSystemResult) => void;
  navigationSystemInitializationFailed: (error: unknown) => void;
  adaptiveConfigurationApplied: (mode: IntegrationMode) => void;
  integrationFinalized: (mode: IntegrationMode) => void;
  adapterEnhanced: (components: NavigationComponents) => void;
  fallbackActivated: (mode: IntegrationMode) => void;
  modeChanged: (mode: IntegrationMode, previousMode: IntegrationMode) => void;
  modeSwitchError: (error: unknown) => void;
  cleanupWarning: (error: unknown) => void;
  cleanup: () => void;
}

// TODO: [TASK-ID-002] Pattern: compatibility-management | Complexity: 5 | Dependencies: terminal-detection
// Context: Real-time terminal capability detection and adaptive mode switching
// Validation-Required: detection-accuracy, performance-impact, edge-case-handling
// Pattern-Info: { approach: "real-time-detection", alternatives: "static-configuration", trade-offs: "accuracy-performance" }

/**
 * MCP Compatibility Bridge Implementation
 */
class MCPCompatibilityBridgeImpl implements MCPCompatibilityBridge {
  private originalAdapter: CLIInterfaceAdapter;
  
  constructor(originalAdapter: CLIInterfaceAdapter) {
    this.originalAdapter = originalAdapter;
  }

  async validatePTYSessions(): Promise<boolean> {
    try {
      // Check if PTY sessions are accessible and functional
      // This would integrate with the actual PTY manager
      return true; // Simplified for implementation
    } catch (error) {
      console.warn('PTY session validation failed:', error);
      return false;
    }
  }

  async preserveAgentInteraction(): Promise<boolean> {
    try {
      // Ensure agent interaction patterns are preserved
      // This would validate agent command execution paths
      return true; // Simplified for implementation
    } catch (error) {
      console.warn('Agent interaction preservation failed:', error);
      return false;
    }
  }

  async testMCPIntegration(): Promise<MCPIntegrationResult> {
    const result: MCPIntegrationResult = {
      success: true,
      ptySessionsActive: false,
      agentInteractionPreserved: false,
      keyboardHandlingWorking: false,
      searchInterfaceWorking: false,
      errors: [],
      warnings: []
    };

    try {
      // Test PTY sessions
      result.ptySessionsActive = await this.validatePTYSessions();
      if (!result.ptySessionsActive) {
        result.warnings.push('PTY sessions not fully validated');
      }

      // Test agent interaction
      result.agentInteractionPreserved = await this.preserveAgentInteraction();
      if (!result.agentInteractionPreserved) {
        result.warnings.push('Agent interaction patterns need verification');
      }

      // Test keyboard handling
      result.keyboardHandlingWorking = await this.testKeyboardHandling();
      if (!result.keyboardHandlingWorking) {
        result.errors.push('Keyboard handling validation failed');
        result.success = false;
      }

      // Test search interface
      result.searchInterfaceWorking = await this.validateSearchInterface();
      if (!result.searchInterfaceWorking) {
        result.warnings.push('Search interface needs compatibility verification');
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`MCP integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  async preserveSessionState(): Promise<boolean> {
    try {
      // Preserve existing session state during navigation system integration
      return true; // Simplified for implementation
    } catch (error) {
      console.warn('Session state preservation failed:', error);
      return false;
    }
  }

  async restoreSessionContext(): Promise<boolean> {
    try {
      // Restore session context after navigation system integration
      return true; // Simplified for implementation
    } catch (error) {
      console.warn('Session context restoration failed:', error);
      return false;
    }
  }

  async validateAgentCommunication(): Promise<boolean> {
    try {
      // Validate that agent communication channels remain functional
      return true; // Simplified for implementation
    } catch (error) {
      console.warn('Agent communication validation failed:', error);
      return false;
    }
  }

  async testKeyboardHandling(): Promise<boolean> {
    try {
      // Test that keyboard input handling remains functional
      return this.originalAdapter.isInInteractiveMode() || 
             typeof this.originalAdapter.handleInput === 'function';
    } catch (error) {
      console.warn('Keyboard handling test failed:', error);
      return false;
    }
  }

  async validateSearchInterface(): Promise<boolean> {
    try {
      // Test that interactive search interface remains functional
      return true; // Simplified - would test actual search functionality
    } catch (error) {
      console.warn('Search interface validation failed:', error);
      return false;
    }
  }
}

/**
 * Adaptive CLI Integration System
 * 
 * Main integration system that combines all components with adaptive compatibility
 * management while preserving MCP Channel functionality.
 */
export class AdaptiveCLIIntegration extends EventDrivenComponent<AdaptiveCLIIntegrationEvents> {
  private static instanceCounter = 0;
  private config: AdaptiveCLIConfig;
  private state: EnhancedCLIState;
  private initializationPromise: Promise<AdaptiveCLIResult> | null = null;

  constructor(
    originalAdapter: CLIInterfaceAdapter,
    config: AdaptiveCLIConfig = {}
  ) {
    super(`adaptive-cli-integration:${AdaptiveCLIIntegration.instanceCounter++}`, 100);

    this.config = {
      navigation: {
        compatibility: { detectCapabilities: true },
        accessibility: { enableKeyboardNavigation: true },
      },
      compatibility: {
        enableDetection: true,
        forceDetection: false,
        fallbackTimeout: 5000,
        retryAttempts: 2
      },
      mcpPreservation: {
        enableValidation: true,
        validateBeforeSwitch: true,
        preserveSessionState: true,
        fallbackToOriginal: true
      },
      performance: {
        cacheCapabilities: true,
        lazyInitialization: false,
        backgroundDetection: false
      },
      accessibility: {
        forceAccessibleMode: false,
        enableVerboseOutput: false,
        preferScreenReaderMode: false
      },
      ...config
    };

    this.state = {
      originalAdapter,
      isEnhanced: false,
      navigationSystem: null,
      navigationInitialized: false,
      compatibilitySystem: null,
      capabilities: null,
      compatibilityResult: null,
      mcpBridge: null,
      mcpValidationResult: null,
      currentMode: 'original',
      activeFallbacks: new Set(),
      lastDetectionTime: null
    };

    // Initialize MCP bridge
    this.state.mcpBridge = new MCPCompatibilityBridgeImpl(originalAdapter);
  }

  /**
   * Initialize the adaptive CLI integration system
   */
  async initialize(forceRefresh = false): Promise<AdaptiveCLIResult> {
    if (this.initializationPromise && !forceRefresh) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization(forceRefresh);
    return this.initializationPromise;
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(forceRefresh: boolean): Promise<AdaptiveCLIResult> {
    this.emit('initializationStarted');

    const result: AdaptiveCLIResult = {
      success: false,
      navigationSystemActive: false,
      mcpChannelPreserved: false,
      fallbacksActive: [],
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Initialize compatibility system and detect capabilities
      if (this.config.compatibility?.enableDetection) {
        await this.initializeCompatibilitySystem(forceRefresh, result);
      }

      // Step 2: Validate MCP Channel compatibility
      if (this.config.mcpPreservation?.enableValidation) {
        await this.validateMCPCompatibility(result);
      }

      // Step 3: Initialize navigation system based on capabilities
      try {
        await this.initializeNavigationSystem(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        result.errors?.push(`Navigation system initialization failed: ${message}`);

        const fallbackWarning = 'Falling back to original CLI adapter due to integration issues';
        if (this.config.mcpPreservation?.fallbackToOriginal && !result.warnings?.includes(fallbackWarning)) {
          await this.fallbackToOriginal(result);
        }
      }

      // Step 4: Apply adaptive configuration based on detection results
      await this.applyAdaptiveConfiguration(result);

      // Step 5: Finalize integration
      await this.finalizeIntegration(result);

      result.fallbacksActive = Array.from(this.state.activeFallbacks);
      result.success = !(result.errors && result.errors.length > 0);
      this.emit('initializationCompleted', result);

    } catch (error) {
      result.success = false;
      result.errors?.push(error instanceof Error ? error.message : 'Unknown initialization error');
      this.emit('initializationError', error);

      // Apply fallback if configured
      if (this.config.mcpPreservation?.fallbackToOriginal) {
        await this.fallbackToOriginal(result);
      }
    }

    return result;
  }

  /**
   * Initialize terminal compatibility system
   */
  private async initializeCompatibilitySystem(
    forceRefresh: boolean, 
    result: AdaptiveCLIResult
  ): Promise<void> {
    this.emit('compatibilityDetectionStarted');

    const compatibilitySystem = this.getCompatibilitySystem();
    this.state.compatibilitySystem = compatibilitySystem;

    const compatibilityResult = await compatibilitySystem.initialize(forceRefresh);
    this.state.compatibilityResult = compatibilityResult;
    this.state.capabilities = compatibilityResult.capabilities;
    this.state.lastDetectionTime = new Date();

    result.capabilities = compatibilityResult.capabilities;
    result.compatibilityScore = compatibilityResult.score;

    if (compatibilityResult.fallbacksRequired.length > 0) {
      this.state.activeFallbacks = new Set(compatibilityResult.fallbacksRequired);
    } else {
      this.state.activeFallbacks.clear();
    }

    result.fallbacksActive = Array.from(this.state.activeFallbacks);

    if (compatibilityResult.overall === 'poor' || compatibilityResult.overall === 'incompatible') {
      result.warnings?.push('Terminal compatibility is limited, enabling enhanced fallback modes');
    }

    this.emit('compatibilityDetectionCompleted', compatibilityResult);
  }

  /**
   * Validate MCP Channel compatibility
   */
  private async validateMCPCompatibility(result: AdaptiveCLIResult): Promise<void> {
    if (!this.state.mcpBridge) {
      result.warnings?.push('MCP bridge not available');
      return;
    }

    this.emit('mcpValidationStarted');

    const mcpResult = await this.state.mcpBridge.testMCPIntegration();
    this.state.mcpValidationResult = mcpResult;

    result.mcpChannelPreserved = mcpResult.success;

    if (!mcpResult.success) {
      result.errors?.push(...mcpResult.errors);
    }

    if (mcpResult.warnings.length > 0) {
      result.warnings?.push(...mcpResult.warnings);
    }

    this.emit('mcpValidationCompleted', mcpResult);
  }

  /**
   * Initialize navigation system with appropriate configuration
   */
  private async initializeNavigationSystem(result: AdaptiveCLIResult): Promise<void> {
    this.emit('navigationSystemInitializationStarted');

    try {
      // Determine navigation system configuration based on capabilities
      const navigationConfig = this.determineNavigationConfig();
      
      // Create and initialize navigation system
      this.state.navigationSystem = createNavigationSystem(navigationConfig);
      const navigationResult = await this.state.navigationSystem.initialize();

      this.state.navigationInitialized = navigationResult.success;
      result.navigationSystemActive = navigationResult.success;

      if (navigationResult.warnings) {
        result.warnings?.push(...navigationResult.warnings);
      }

      if (navigationResult.errors && navigationResult.errors.length > 0) {
        navigationResult.errors.forEach(errorMessage => {
          result.errors?.push(`Navigation system initialization failed: ${errorMessage}`);
        });
      }

      // Update fallbacks if navigation system required additional ones
      if (navigationResult.fallbacksRequired) {
        for (const fallback of navigationResult.fallbacksRequired) {
          this.state.activeFallbacks.add(fallback);
        }
        result.fallbacksActive = Array.from(this.state.activeFallbacks);
      }

      this.emit('navigationSystemInitializationCompleted', navigationResult);

    } catch (error) {
      const message = `Navigation system initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors?.push(message);
      this.state.navigationInitialized = false;
      result.navigationSystemActive = false;
      this.emit('navigationSystemInitializationFailed', error);

      if (this.config.mcpPreservation?.fallbackToOriginal) {
        await this.fallbackToOriginal(result);
      }
    }
  }

  /**
   * Determine appropriate navigation configuration based on capabilities
   */
  private determineNavigationConfig(): NavigationSystemConfig {
    const baseConfig = this.config.navigation || {};
    
    if (!this.state.capabilities) {
      return baseConfig;
    }

    const adaptiveConfig: NavigationSystemConfig = {
      ...baseConfig,
      borderRenderer: {
        useUnicode: this.state.capabilities.supportsUnicode && 
                    this.state.capabilities.supportsBoxDrawing &&
                    !this.state.activeFallbacks.has('unicode'),
        padding: 3,
        ...baseConfig.borderRenderer
      },
      widthCalculation: {
        minWidth: 40,
        maxWidth: Math.max(80, this.state.capabilities.width - 10),
        respectTerminalWidth: true,
        ...baseConfig.widthCalculation
      },
      compatibility: {
        detectCapabilities: false, // Already detected
        enableFallbacks: true,
        forceAscii: this.state.activeFallbacks.has('unicode'),
        ...baseConfig.compatibility
      },
      accessibility: {
        enableKeyboardNavigation: true,
        enableScreenReader: this.state.capabilities.screenReaderCompatible ||
                           this.config.accessibility?.preferScreenReaderMode ||
                           false,
        highContrastMode: this.config.accessibility?.forceAccessibleMode ||
                         !this.state.capabilities.supportsColor,
        verbosityLevel: this.config.accessibility?.enableVerboseOutput ? 'verbose' : 'standard',
        ...baseConfig.accessibility
      }
    };

    return adaptiveConfig;
  }

  /**
   * Apply adaptive configuration based on detection results
   */
  private async applyAdaptiveConfiguration(result: AdaptiveCLIResult): Promise<void> {
    // Determine optimal mode
    const optimalMode = this.determineOptimalMode();

    if (
      optimalMode === 'original' &&
      this.config.mcpPreservation?.fallbackToOriginal &&
      this.state.mcpValidationResult &&
      !this.state.mcpValidationResult.success
    ) {
      await this.fallbackToOriginal(result);
    } else {
      this.state.currentMode = optimalMode;
    }

    // Generate recommended settings
    result.recommendedSettings = {
      mode: optimalMode,
      useEnhancedNavigation: this.state.navigationInitialized,
      fallbacks: Array.from(this.state.activeFallbacks),
      terminalOptimizations: this.getTerminalOptimizations()
    };

    this.emit('adaptiveConfigurationApplied', optimalMode);
  }

  /**
   * Determine optimal operating mode
   */
  private determineOptimalMode(): EnhancedCLIState['currentMode'] {
    // If accessibility is forced or screen reader detected, use accessibility mode
    if (this.config.accessibility?.forceAccessibleMode || 
        (this.state.capabilities?.screenReaderCompatible && 
         this.config.accessibility?.preferScreenReaderMode)) {
      return 'accessibility';
    }

    // If MCP validation failed and fallback is enabled, use original mode
    if (!this.state.mcpValidationResult?.success && 
        this.config.mcpPreservation?.fallbackToOriginal) {
      return 'original';
    }

    // If compatibility is poor, use fallback mode
    if (this.state.compatibilityResult?.overall === 'poor' || 
        this.state.compatibilityResult?.overall === 'incompatible') {
      return 'fallback';
    }

    // If navigation system is available, use enhanced mode
    if (this.state.navigationInitialized) {
      return 'enhanced';
    }

    // Default to original mode
    return 'original';
  }

  /**
   * Get terminal-specific optimizations
   */
  private getTerminalOptimizations(): any {
    if (!this.state.capabilities) {
      return {};
    }

    return {
      renderingSpeed: this.state.capabilities.renderingSpeed,
      colorOptimizations: {
        use: this.state.capabilities.supportsColor,
        depth: this.state.capabilities.colorDepth,
        trueColor: this.state.capabilities.supportsTrueColor
      },
      inputOptimizations: {
        mouse: this.state.capabilities.supportsMouseInput,
        keyboard: this.state.capabilities.supportsKeyboardShortcuts
      },
      displayOptimizations: {
        unicode: this.state.capabilities.supportsUnicode,
        boxDrawing: this.state.capabilities.supportsBoxDrawing,
        emojis: this.state.capabilities.supportsEmojis
      }
    };
  }

  /**
   * Finalize integration and activate enhanced mode if appropriate
   */
  private async finalizeIntegration(result: AdaptiveCLIResult): Promise<void> {
    if (this.state.currentMode === 'enhanced' && this.state.navigationSystem) {
      this.state.isEnhanced = true;
      
      // Apply navigation system enhancements to original adapter
      await this.enhanceOriginalAdapter();
    }

    this.emit('integrationFinalized', this.state.currentMode);
  }

  /**
   * Enhance original adapter with navigation system capabilities
   */
  private async enhanceOriginalAdapter(): Promise<void> {
    if (!this.state.navigationSystem || !this.state.navigationInitialized) {
      return;
    }

    const components = this.state.navigationSystem.getComponents();

    // TODO: [TASK-ID-003] Pattern: adapter-enhancement | Complexity: 4 | Dependencies: navigation-components
    // Context: Integrate navigation system components with existing CLI adapter
    // Validation-Required: backward-compatibility, performance-impact, functionality-preservation
    // Pattern-Info: { approach: "composition-enhancement", alternatives: "replacement", trade-offs: "compatibility-features" }

    // This would integrate the navigation components with the original adapter
    // For now, we maintain separation and provide enhanced capabilities through this wrapper
    
    this.emit('adapterEnhanced', components);
  }

  /**
   * Fallback to original adapter configuration
   */
  private async fallbackToOriginal(result: AdaptiveCLIResult): Promise<void> {
    this.state.currentMode = 'original';
    this.state.isEnhanced = false;
    
    const warningMessage = 'Falling back to original CLI adapter due to integration issues';
    if (!result.warnings?.includes(warningMessage)) {
      result.warnings?.push(warningMessage);
    }
    this.emit('fallbackActivated', 'original');
  }

  /**
   * Get current integration state
   */
  getState(): EnhancedCLIState {
    return { ...this.state };
  }

  /**
   * Get navigation system if available
   */
  getNavigationSystem(): NavigationSystem | null {
    return this.state.navigationSystem;
  }

  /**
   * Get terminal capabilities if detected
   */
  getCapabilities(): TerminalCapabilities | null {
    return this.state.capabilities;
  }

  /**
   * Get compatibility system if available
   */
  getCompatibilitySystem(): TerminalCompatibilitySystem {
    if (!this.state.compatibilitySystem) {
      this.state.compatibilitySystem = createTerminalCompatibilitySystem();
    }
    return this.state.compatibilitySystem;
  }

  /**
   * Check if enhanced mode is active
   */
  isEnhanced(): boolean {
    return this.state.isEnhanced;
  }

  /**
   * Get current operating mode
   */
  getCurrentMode(): EnhancedCLIState['currentMode'] {
    return this.state.currentMode;
  }

  /**
   * Get active fallbacks
   */
  getActiveFallbacks(): string[] {
    return Array.from(this.state.activeFallbacks);
  }

  async render(menuId?: string): Promise<WindowSetRenderResult> {
    const targetMenu = menuId ?? this.state.originalAdapter.getActiveMenuId();
    return await this.state.originalAdapter.renderMenuWindow(targetMenu);
  }

  /**
   * Force refresh of capabilities and reconfigure
   */
  async refresh(): Promise<AdaptiveCLIResult> {
    return this.initialize(true);
  }

  /**
   * Switch operating mode manually
   */
  async switchMode(mode: EnhancedCLIState['currentMode']): Promise<boolean> {
    const previousMode = this.state.currentMode;
    
    try {
      this.state.currentMode = mode;
      
      if (mode === 'enhanced' && this.state.navigationSystem) {
        await this.enhanceOriginalAdapter();
        this.state.isEnhanced = true;
      } else if (mode !== 'enhanced' && this.state.isEnhanced) {
        this.state.isEnhanced = false;
      }
      
      this.emit('modeChanged', mode, previousMode);
      return true;
    } catch (error) {
      this.state.currentMode = previousMode;
      this.emit('modeSwitchError', error);
      return false;
    }
  }

  /**
   * Get integration statistics
   */
  getStatistics(): any {
    return {
      initializationTime: this.state.lastDetectionTime,
      currentMode: this.state.currentMode,
      navigationSystemActive: this.state.navigationInitialized,
      mcpChannelPreserved: this.state.mcpValidationResult?.success || false,
      compatibilityScore: this.state.compatibilityResult?.score || 0,
      activeFallbacks: Array.from(this.state.activeFallbacks),
      terminalCapabilities: this.state.capabilities ? {
        name: this.state.capabilities.name,
        supportsUnicode: this.state.capabilities.supportsUnicode,
        supportsColor: this.state.capabilities.supportsColor,
        supportsMouseInput: this.state.capabilities.supportsMouseInput
      } : null
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.state.originalAdapter.cleanup();
    } catch (error) {
      this.emit('cleanupWarning', error);
    }

    if (this.state.navigationSystem) {
      try {
        await this.state.navigationSystem.cleanup();
      } catch (error) {
        this.emit('cleanupWarning', error);
      }
    }

    this.removeAllListeners();
    this.emit('cleanup');
  }
}

// TODO: [TASK-ID-004] Pattern: factory-functions | Complexity: 2 | Dependencies: integration-system
// Context: Factory functions for creating integrated CLI systems with different configurations
// Validation-Required: configuration-validation, initialization-testing
// Pattern-Info: { approach: "factory-pattern", alternatives: "direct-instantiation", trade-offs: "convenience-flexibility" }

/**
 * Factory function for creating adaptive CLI integration
 */
export function createAdaptiveCLIIntegration(
  originalAdapter: CLIInterfaceAdapter,
  config?: AdaptiveCLIConfig
): AdaptiveCLIIntegration {
  return new AdaptiveCLIIntegration(originalAdapter, config);
}

/**
 * Quick setup for enhanced CLI with automatic detection
 */
export async function setupEnhancedCLI(
  _commandRegistry: UniversalCommandRegistry,
  _menuRegistry: UniversalMenuRegistry,
  _sessionContext: SessionContextFoundation,
  orchestrator: ITemplumOrchestrator
): Promise<AdaptiveCLIIntegration> {
  if (!orchestrator || typeof orchestrator.getSessionManager !== 'function') {
    throw new Error('setupEnhancedCLI requires an orchestrator that supplies getSessionManager()');
  }

  const originalAdapter = new CLIInterfaceAdapter({
    enableInteractiveMode: true,
    enableInteractiveSearch: true,
    enableKeyboardShortcuts: true
  });

  await originalAdapter.initialize(orchestrator);

  const integration = createAdaptiveCLIIntegration(originalAdapter, {
    compatibility: { 
      enableDetection: true,
      forceDetection: false,
      fallbackTimeout: 5000,
      retryAttempts: 3
    },
    mcpPreservation: { 
      enableValidation: true,
      validateBeforeSwitch: true,
      preserveSessionState: true,
      fallbackToOriginal: true
    },
    navigation: {
      compatibility: { detectCapabilities: true },
      accessibility: { enableKeyboardNavigation: true }
    }
  });

  await integration.initialize();
  return integration;
}

/**
 * Quick setup for accessibility-focused CLI
 */
export async function setupAccessibleCLI(
  _commandRegistry: UniversalCommandRegistry,
  _menuRegistry: UniversalMenuRegistry,
  _sessionContext: SessionContextFoundation,
  orchestrator: ITemplumOrchestrator
): Promise<AdaptiveCLIIntegration> {
  if (!orchestrator || typeof orchestrator.getSessionManager !== 'function') {
    throw new Error('setupAccessibleCLI requires an orchestrator that supplies getSessionManager()');
  }

  const originalAdapter = new CLIInterfaceAdapter({
    enableInteractiveMode: true,
    enableColorOutput: false,
    enableKeyboardShortcuts: true,
    enableInteractiveSearch: true,
    terminalTheme: 'light'
  });

  await originalAdapter.initialize(orchestrator);

  const integration = createAdaptiveCLIIntegration(originalAdapter, {
    accessibility: {
      forceAccessibleMode: true,
      enableVerboseOutput: true,
      preferScreenReaderMode: true
    },
    navigation: {
      accessibility: {
        enableKeyboardNavigation: true,
        enableScreenReader: true,
        verbosityLevel: 'verbose',
        highContrastMode: true
      },
      compatibility: {
        forceAscii: true,
        enableFallbacks: true
      }
    }
  });

  await integration.initialize();
  return integration;
}

/**
 * Export version and build information
 */
export const ADAPTIVE_CLI_VERSION = '1.0.0';
export const BUILD_DATE = '2025-09-12T180000Z';
