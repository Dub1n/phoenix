/**
---
date: 2025-09-12T174343Z
name: CLI Navigation System Index
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [module-exports, system-integration, public-api]
components: [NavigationSystem, PublicAPI, ModuleExports]
dependencies: [all-navigation-components]
tags: [cli, navigation, index, public-api, integration]
---
 * 
 * CLI Navigation System - Main Export Module
 * 
 * Provides the complete navigation system implementation with all components
 * integrated and ready for use. This module serves as the main entry point
 * for the enhanced CLI navigation system with accessibility and compatibility.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: system-integration | Complexity: 3 | Dependencies: all-components
 * Context: Main export module providing integrated navigation system for CLI redesign
 * Validation-Required: integration-testing, api-consistency, backward-compatibility
 * Pattern-Info: { approach: "comprehensive-integration", alternatives: "individual-components", trade-offs: "convenience-flexibility" }
 */

// Import types and classes used by NavigationSystem class
import type { 
  TerminalCapabilities
} from './terminal-compatibility';
import { 
  TerminalCompatibilitySystem,
  createTerminalCompatibilitySystem
} from './terminal-compatibility';
import { DefaultColorThemes } from '../terminal-ui-components';
import type { CLIMenuModel } from '../cli-generator';

// Import create functions needed by NavigationSystem class
import { createBorderRenderer } from './border-renderer';
import { createWidthCalculator } from './width-calculator';
import { createWindowStack } from './window-stack';
import type { WindowStackConfig } from './window-stack';
import { createBreadcrumbManager } from './breadcrumb-manager';
import { createExitHandler } from './exit-handler';
import { createSelectorUpdater } from './selector-updater';
import type { SelectorConfig } from './selector-updater';
import { createAccessibilityManager } from './accessibility-enhancements';

// Core rendering components
export {
  BorderRenderer,
  AccessibleBorderRenderer,
  BorderCapabilityDetector,
  createBorderRenderer,
  createAccessibleBorderRenderer,
  UNICODE_BORDERS,
  ASCII_BORDERS
} from './border-renderer';

export type {
  WindowBorderConfig,
  BorderCharacterSet,
  BorderRendererTheme,
  BorderRendererDependencies
} from './border-renderer';

export {
  WidthCalculator,
  ResponsiveWidthCalculator,
  ContentAnalyzer,
  createWidthCalculator,
  createResponsiveWidthCalculator
} from './width-calculator';

export type {
  WidthCalculationOptions,
  WidthCalculationResult,
  WidthCalculatorDependencies
} from './width-calculator';

export { StringWidthUtils } from '../../utils/chainable-string-utils';

// Window and navigation management
export {
  WindowStack,
  EnhancedWindowStack,
  createWindowStack,
  createEnhancedWindowStack
} from './window-stack';

export type {
  WindowDefinition,
  NavigationContext,
  BreadcrumbEntry
} from './window-stack';

export {
  BreadcrumbManager,
  PathTracker,
  NavigationRenderer,
  createBreadcrumbManager,
  createBreadcrumbEntry
} from './breadcrumb-manager';

export {
  ExitHandler,
  SessionAwareExitHandler,
  createExitHandler,
  createSessionAwareExitHandler
} from './exit-handler';

export type {
  ExitConfirmationDialog,
  CleanupManager,
  ExitConfirmationConfig,
  ExitContext,
  CleanupTask
} from './exit-handler';

// Text processing and theming
// EmojiRemover functionality removed

export {
  SelectorUpdater,
  AdaptiveSelector,
  MenuFormatter,
  createSelectorUpdater,
  applySelector,
  batchApplySelectors,
  SELECTOR_CHARACTERS
} from './selector-updater';

export type {
  SelectorConfig,
  SelectionState,
  SelectorFormatOptions,
  MenuFormatResult
} from './selector-updater';

// Terminal compatibility and accessibility
export {
  TerminalCompatibilitySystem,
  createTerminalCompatibilitySystem,
  checkTerminalCompatibility,
  getSafeTerminalConfig
} from './terminal-compatibility';

export type {
  FallbackManager,
  TerminalCapabilities,
  CompatibilityTestResult
} from './terminal-compatibility';

export {
  createAccessibilityManager,
  createNavigableElement,
  normalizeKeyboardEvent
} from './accessibility-enhancements';

export type {
  AccessibilityManager,
  ScreenReaderSupport,
  KeyboardNavigator,
  AccessibilityValidator,
  AccessibilityConfig,
  NavigableElement,
  Announcement
} from './accessibility-enhancements';

// TODO: [TASK-ID-015] Pattern: system-integration | Complexity: 4 | Dependencies: all-components
// Context: Complete navigation system integration with configuration management
// Validation-Required: end-to-end-testing, configuration-validation, performance-testing
// Pattern-Info: { approach: "unified-system", alternatives: "component-composition", trade-offs: "simplicity-flexibility" }

/**
 * Complete navigation system configuration
 */
export interface NavigationSystemConfig {
  // Border rendering
  borderRenderer?: {
    useUnicode?: boolean;
    padding?: number;
    theme?: any;
  };
  
  // Width calculation
  widthCalculation?: {
    minWidth?: number;
    maxWidth?: number;
    respectTerminalWidth?: boolean;
  };
  
  // Window management
  windowManagement?: {
    maxStackSize?: number;
    enablePersistence?: boolean;
    enableBreadcrumbs?: boolean;
  };
  
  // Exit handling
  exitHandling?: {
    requireConfirmation?: boolean;
    doubleConfirmation?: boolean;
    confirmationTimeout?: number;
  };
  
  // Terminal compatibility
  compatibility?: {
    detectCapabilities?: boolean;
    enableFallbacks?: boolean;
    forceAscii?: boolean;
  };
  
  // Accessibility
  accessibility?: {
    enableKeyboardNavigation?: boolean;
    enableScreenReader?: boolean;
    highContrastMode?: boolean;
    verbosityLevel?: 'minimal' | 'standard' | 'verbose';
  };

  menuModel?: CLIMenuModel;
}

/**
 * Navigation system initialization result
 */
export interface NavigationSystemResult {
  success: boolean;
  capabilities?: any; // TerminalCapabilities
  compatibilityScore?: number;
  fallbacksRequired?: string[];
  errors?: string[];
  warnings?: string[];
}

/**
 * Complete integrated navigation system
 */
export class NavigationSystem {
  private config: NavigationSystemConfig;
  private borderRenderer?: ReturnType<typeof createBorderRenderer>;
  private widthCalculator?: ReturnType<typeof createWidthCalculator>;
  private windowStack?: ReturnType<typeof createWindowStack>;
  private breadcrumbManager?: ReturnType<typeof createBreadcrumbManager>;
  private exitHandler?: ReturnType<typeof createExitHandler>;
  private selectorUpdater?: ReturnType<typeof createSelectorUpdater>;
  private compatibilitySystem?: ReturnType<typeof createTerminalCompatibilitySystem>;
  private accessibilityManager?: ReturnType<typeof createAccessibilityManager>;
  private initialized = false;
  private readonly menuModel: CLIMenuModel | null;

  constructor(config: NavigationSystemConfig = {}) {
    this.config = {
      borderRenderer: {
        useUnicode: true,
        padding: 3
      },
      widthCalculation: {
        minWidth: 40,
        maxWidth: 120,
        respectTerminalWidth: true
      },
      windowManagement: {
        maxStackSize: 50,
        enablePersistence: true,
        enableBreadcrumbs: true
      },
      exitHandling: {
        requireConfirmation: true,
        doubleConfirmation: true,
        confirmationTimeout: 30000
      },
      compatibility: {
        detectCapabilities: true,
        enableFallbacks: true,
        forceAscii: false
      },
      accessibility: {
        enableKeyboardNavigation: true,
        enableScreenReader: true,
        highContrastMode: false,
        verbosityLevel: 'standard'
      },
      ...config
    };

    this.menuModel = this.config.menuModel ?? null;
  }

  /**
   * Initialize the complete navigation system
   */
  async initialize(): Promise<NavigationSystemResult> {
    if (this.initialized) {
      return { success: true };
    }

    try {
      const warnings: string[] = [];
      let capabilities: any; // TerminalCapabilities type will be resolved through exports
      let compatibilityScore: number | undefined;
      let fallbacksRequired: string[] = [];

      // Initialize terminal compatibility system
      if (this.config.compatibility?.detectCapabilities) {
        this.compatibilitySystem = new TerminalCompatibilitySystem();
        const compatibilityResult = await this.compatibilitySystem.initialize();
        
        capabilities = compatibilityResult?.capabilities;
        compatibilityScore = compatibilityResult?.score;
        fallbacksRequired = compatibilityResult?.fallbacksRequired || [];

        if (compatibilityResult?.overall === 'poor' || compatibilityResult?.overall === 'incompatible') {
          warnings.push('Terminal compatibility is limited, enabling fallback modes');
        }
      }

      // Initialize border renderer with capability-aware settings
      const borderConfig = {
        ...this.config.borderRenderer,
        useUnicode: this.config.compatibility?.forceAscii 
          ? false 
          : capabilities?.supportsUnicode ?? true
      };
      this.borderRenderer = createBorderRenderer(borderConfig);

      // Initialize width calculator
      this.widthCalculator = createWidthCalculator(this.config.widthCalculation);

      // Initialize window stack
      const windowStackConfig: Partial<WindowStackConfig> = {
        ...this.config.windowManagement,
      };

      if (this.menuModel?.theme) {
        windowStackConfig.theme = this.menuModel.theme;
      } else if (!(capabilities?.supportsColor ?? true)) {
        windowStackConfig.theme = DefaultColorThemes.monochrome;
      }

      this.windowStack = createWindowStack(windowStackConfig);

      // Initialize breadcrumb manager
      if (this.config.windowManagement?.enableBreadcrumbs) {
        this.breadcrumbManager = createBreadcrumbManager({
          enableInteraction: capabilities?.supportsMouseInput ?? false,
          responsive: {
            breakpoints: {
              compact: 80,
              minimal: 60,
              hideLabels: 40
            },
            adaptiveLabels: true,
            dynamicSeparators: true,
            overflowHandling: 'truncate'
          }
        });
      }

      // Initialize exit handler
      this.exitHandler = createExitHandler(this.config.exitHandling);

      const selectorConfig: Partial<SelectorConfig> = {
        character: capabilities?.supportsUnicode ? '›' : '>',
        accessibilityMode: !capabilities?.supportsUnicode
      };

      if (this.menuModel?.theme) {
        selectorConfig.theme = this.menuModel.theme;
      } else if (capabilities && !capabilities.supportsColor) {
        selectorConfig.theme = DefaultColorThemes.monochrome;
      }

      this.selectorUpdater = createSelectorUpdater(selectorConfig);

      // Initialize accessibility manager
      if (this.config.accessibility?.enableKeyboardNavigation || 
          this.config.accessibility?.enableScreenReader) {
        this.accessibilityManager = createAccessibilityManager({
          ...this.config.accessibility,
          enableKeyboardNavigation: this.config.accessibility.enableKeyboardNavigation,
          enableScreenReader: this.config.accessibility.enableScreenReader || 
                              capabilities?.screenReaderCompatible,
          keyboardNavigationMode: capabilities?.supportsMouseInput ? 'both' : 'arrow'
        });

        if (capabilities) {
          this.accessibilityManager.initialize(capabilities);
        }
      }

      this.initialized = true;

      return {
        success: true,
        capabilities,
        compatibilityScore,
        fallbacksRequired,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown initialization error']
      };
    }
  }

  /**
   * Get initialized components
   */
  getComponents() {
    return {
      borderRenderer: this.borderRenderer,
      widthCalculator: this.widthCalculator,
      windowStack: this.windowStack,
      breadcrumbManager: this.breadcrumbManager,
      exitHandler: this.exitHandler,
      selectorUpdater: this.selectorUpdater,
      compatibilitySystem: this.compatibilitySystem,
      accessibilityManager: this.accessibilityManager
    };
  }

  /**
   * Check if system is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Update system configuration
   */
  updateConfig(newConfig: Partial<NavigationSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Note: For full reconfiguration, reinitialize the system
  }

  /**
   * Get current configuration
   */
  getConfig(): NavigationSystemConfig {
    return { ...this.config };
  }

  /**
   * Cleanup all system resources
   */
  async cleanup(): Promise<void> {
    await this.exitHandler?.cleanup?.();
    this.accessibilityManager?.cleanup?.();
    this.breadcrumbManager?.cleanup?.();
    this.windowStack?.cleanup?.();

    this.initialized = false;
  }
}

/**
 * Factory function for creating complete navigation system
 */
export function createNavigationSystem(config?: NavigationSystemConfig): NavigationSystem {
  return new NavigationSystem(config);
}

/**
 * Quick setup function for basic navigation system
 */
export async function setupBasicNavigation(): Promise<NavigationSystem> {
  const system = new NavigationSystem({
    compatibility: { detectCapabilities: true },
    accessibility: { enableKeyboardNavigation: true }
  });

  await system.initialize();
  return system;
}

/**
 * Quick setup function for accessibility-enhanced navigation
 */
export async function setupAccessibleNavigation(): Promise<NavigationSystem> {
  const system = new NavigationSystem({
    compatibility: { 
      detectCapabilities: true,
      enableFallbacks: true
    },
    accessibility: { 
      enableKeyboardNavigation: true,
      enableScreenReader: true,
      verbosityLevel: 'verbose',
      highContrastMode: true
    }
  });

  await system.initialize();
  return system;
}

/**
 * Export version information
 */
export const VERSION = '1.0.0';
export const BUILD_DATE = '2025-09-12T174343Z';

// Default export for convenience
export default {
  NavigationSystem,
  createNavigationSystem,
  setupBasicNavigation,
  setupAccessibleNavigation,
  VERSION,
  BUILD_DATE
};
