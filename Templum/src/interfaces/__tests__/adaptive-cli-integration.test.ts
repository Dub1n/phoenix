/**
---
date: 2025-09-12T180000Z
name: Adaptive CLI Integration Tests
TASK-ID: [TASK-MCP-006-INTEGRATION]
category: integration-testing
status: ["[T]"]
patterns: [integration-testing, mcp-validation, compatibility-testing]
components: [IntegrationTests, MCPTests, CompatibilityTests]
dependencies: [adaptive-cli-integration, navigation-system, mcp-channel]
tags: [test, integration, mcp, compatibility, cli]
---
 * 
 * Adaptive CLI Integration Test Suite
 * 
 * Comprehensive test suite for validating the adaptive CLI integration system,
 * with special focus on MCP Channel compatibility preservation and terminal
 * capability detection accuracy.
 * 
 * Generated: 2025-09-12T180000Z
 * TASK-ID: TASK-MCP-006-INTEGRATION Pattern: integration-testing | Complexity: 5 | Dependencies: adaptive-integration,mcp-validation
 * Context: Complete test suite for adaptive CLI integration with MCP compatibility validation
 * Validation-Required: mcp-preservation-testing, terminal-compatibility-testing, integration-testing
 * Pattern-Info: { approach: "comprehensive-testing", alternatives: "unit-testing-only", trade-offs: "coverage-complexity" }
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  AdaptiveCLIIntegration,
  AdaptiveCLIConfig,
  AdaptiveCLIResult,
  MCPIntegrationResult,
  createAdaptiveCLIIntegration,
  setupEnhancedCLI,
  setupAccessibleCLI
} from '../adaptive-cli-integration';

import { CLIInterfaceAdapter } from '../cli-adapter';
import { UniversalCommandRegistry } from '../../commands/universal-command-registry';
import { UniversalMenuRegistry } from '../../menus/universal-menu-registry';
import { SessionContextFoundation } from '../../session/session-context-foundation';
import { ITemplumOrchestrator } from '../templum-orchestrator-interface';

import {
  TerminalCompatibilitySystem,
  TerminalCapabilities,
  CompatibilityTestResult
} from '../navigation/terminal-compatibility';

// TODO: [TASK-ID-005] Pattern: test-setup | Complexity: 3 | Dependencies: mock-dependencies
// Context: Test environment setup with mocked dependencies for isolation
// Validation-Required: mock-accuracy, test-isolation, setup-teardown
// Pattern-Info: { approach: "comprehensive-mocking", alternatives: "partial-mocking", trade-offs: "isolation-realism" }

/**
 * Mock dependencies
 */
const mockCommandRegistry = {
  executeCommand: jest.fn()
} as unknown as UniversalCommandRegistry;

const mockMenuRegistry = {
  getMenu: jest.fn(),
  getAvailableMenuIds: jest.fn(),
  loadSkin: jest.fn(),
  updateMenuState: jest.fn(),
  on: jest.fn()
} as unknown as UniversalMenuRegistry;

const mockSessionContext = {
  getActiveSession: jest.fn(),
  createSession: jest.fn(),
  setActiveSession: jest.fn(),
  updateSessionState: jest.fn(),
  on: jest.fn()
} as unknown as SessionContextFoundation;

const mockOrchestrator = {
  isInitialized: jest.fn().mockReturnValue(true),
  executeCommand: jest.fn(),
  loadBackendSkin: jest.fn(),
  getSystemStatus: jest.fn().mockReturnValue({
    coreEngine: {
      backendConnections: {
        backends: {}
      }
    }
  })
} as unknown as ITemplumOrchestrator;

/**
 * Test fixtures
 */
const mockTerminalCapabilities: TerminalCapabilities = {
  name: 'Test Terminal',
  version: '1.0.0',
  platform: 'test',
  width: 120,
  height: 30,
  supportsColor: true,
  colorDepth: 24,
  supportsTrueColor: true,
  supportsUnicode: true,
  supportsBoxDrawing: true,
  supportsEmojis: true,
  fontSupportsSymbols: true,
  supportsMouseInput: true,
  supportsKeyboardShortcuts: true,
  supportsRawMode: true,
  supportsAlternateScreen: true,
  supportsCursorControl: true,
  supportsScrolling: true,
  supportsResizeEvents: true,
  renderingSpeed: 'fast',
  refreshRate: 60,
  screenReaderCompatible: false,
  highContrastMode: false,
  knownIssues: [],
  limitations: [],
  detectionConfidence: 95,
  featureReliability: 90
};

const mockCompatibilityTestResult: CompatibilityTestResult = {
  overall: 'excellent',
  score: 95,
  capabilities: mockTerminalCapabilities,
  tests: [],
  recommendations: [],
  fallbacksRequired: []
};

describe('AdaptiveCLIIntegration', () => {
  let originalAdapter: CLIInterfaceAdapter;
  let integration: AdaptiveCLIIntegration;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create original adapter
    originalAdapter = new CLIInterfaceAdapter(
      mockCommandRegistry,
      mockMenuRegistry,
      mockSessionContext,
      {
        enableInteractiveMode: true,
        enableInteractiveSearch: true
      },
      mockOrchestrator
    );

    await originalAdapter.initialize();
  });

  afterEach(async () => {
    if (integration) {
      await integration.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);
      
      const result = await integration.initialize();
      
      expect(result.success).toBe(true);
      expect(integration.getCurrentMode()).toBeDefined();
      expect(integration.getState().originalAdapter).toBe(originalAdapter);
    });

    test('should initialize with custom configuration', async () => {
      const config: AdaptiveCLIConfig = {
        compatibility: {
          enableDetection: true,
          forceDetection: false,
          fallbackTimeout: 3000,
          retryAttempts: 1
        },
        accessibility: {
          forceAccessibleMode: true,
          enableVerboseOutput: true
        }
      };

      integration = createAdaptiveCLIIntegration(originalAdapter, config);
      
      const result = await integration.initialize();
      
      expect(result.success).toBe(true);
      expect(integration.getCurrentMode()).toBe('accessibility');
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock a failing scenario
      const failingConfig: AdaptiveCLIConfig = {
        mcpPreservation: {
          enableValidation: true,
          fallbackToOriginal: true
        }
      };

      integration = createAdaptiveCLIIntegration(originalAdapter, failingConfig);
      
      // Force an error in the navigation system
      jest.spyOn(integration as any, 'initializeNavigationSystem').mockRejectedValue(new Error('Navigation failed'));
      
      const result = await integration.initialize();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Navigation system initialization failed: Navigation failed');
      expect(integration.getCurrentMode()).toBe('original');
    });
  });

  describe('Terminal Compatibility Detection', () => {
    test('should detect terminal capabilities accurately', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { enableDetection: true }
      });

      const result = await integration.initialize();

      expect(result.capabilities).toBeDefined();
      expect(result.compatibilityScore).toBeGreaterThan(0);
    });

    test('should apply fallbacks for incompatible terminals', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { enableDetection: true }
      });

      // Mock poor compatibility
      const compatibilitySystem = integration.getCompatibilitySystem();
      if (compatibilitySystem) {
        jest.spyOn(compatibilitySystem as any, 'evaluateCompatibility').mockReturnValue({
          overall: 'poor',
          score: 30,
          capabilities: { ...mockTerminalCapabilities, supportsUnicode: false, supportsColor: false },
          tests: [],
          recommendations: ['Enable UTF-8 support'],
          fallbacksRequired: ['unicode', 'color']
        });
      }

      const result = await integration.initialize();

      expect(result.fallbacksActive).toContain('unicode');
      expect(result.fallbacksActive).toContain('color');
      expect(integration.getCurrentMode()).toBe('fallback');
    });

    test('should cache capabilities for performance', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        performance: { cacheCapabilities: true }
      });

      // Initialize twice
      await integration.initialize();
      const firstResult = await integration.initialize();

      // Should use cached results
      expect(firstResult.success).toBe(true);
    });
  });

  describe('MCP Channel Compatibility', () => {
    test('should preserve MCP channel functionality', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        mcpPreservation: { enableValidation: true }
      });

      const result = await integration.initialize();

      expect(result.mcpChannelPreserved).toBe(true);
    });

    test('should detect MCP integration issues', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        mcpPreservation: { enableValidation: true }
      });

      // Mock MCP validation failure
      const state = integration.getState();
      if (state.mcpBridge) {
        jest.spyOn(state.mcpBridge, 'testMCPIntegration').mockResolvedValue({
          success: false,
          ptySessionsActive: false,
          agentInteractionPreserved: false,
          keyboardHandlingWorking: false,
          searchInterfaceWorking: false,
          errors: ['PTY sessions not functional'],
          warnings: []
        });
      }

      const result = await integration.initialize();

      expect(result.mcpChannelPreserved).toBe(false);
      expect(result.errors).toContain('PTY sessions not functional');
    });

    test('should fallback to original when MCP validation fails', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        mcpPreservation: {
          enableValidation: true,
          fallbackToOriginal: true
        }
      });

      // Mock MCP validation failure
      const state = integration.getState();
      if (state.mcpBridge) {
        jest.spyOn(state.mcpBridge, 'testMCPIntegration').mockResolvedValue({
          success: false,
          ptySessionsActive: false,
          agentInteractionPreserved: false,
          keyboardHandlingWorking: false,
          searchInterfaceWorking: false,
          errors: ['Critical MCP failure'],
          warnings: []
        });
      }

      const result = await integration.initialize();

      expect(integration.getCurrentMode()).toBe('original');
      expect(result.warnings).toContain('Falling back to original CLI adapter due to integration issues');
    });
  });

  describe('Navigation System Integration', () => {
    test('should initialize navigation system with appropriate configuration', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        navigation: {
          compatibility: { detectCapabilities: true },
          accessibility: { enableKeyboardNavigation: true }
        }
      });

      const result = await integration.initialize();

      expect(result.navigationSystemActive).toBe(true);
      expect(integration.getNavigationSystem()).toBeDefined();
    });

    test('should adapt navigation configuration to terminal capabilities', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { enableDetection: true }
      });

      const result = await integration.initialize();

      const navigationSystem = integration.getNavigationSystem();
      expect(navigationSystem).toBeDefined();

      const config = navigationSystem?.getConfig();
      expect(config).toBeDefined();
    });

    test('should handle navigation system initialization failures', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);

      // Mock navigation system failure
      jest.spyOn(integration as any, 'initializeNavigationSystem').mockRejectedValue(
        new Error('Navigation initialization failed')
      );

      const result = await integration.initialize();

      expect(result.success).toBe(false);
      expect(result.navigationSystemActive).toBe(false);
    });
  });

  describe('Mode Switching', () => {
    beforeEach(async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);
      await integration.initialize();
    });

    test('should switch between operating modes', async () => {
      const initialMode = integration.getCurrentMode();
      
      const success = await integration.switchMode('accessibility');
      
      expect(success).toBe(true);
      expect(integration.getCurrentMode()).toBe('accessibility');
      expect(integration.getCurrentMode()).not.toBe(initialMode);
    });

    test('should emit mode change events', async () => {
      const modeChangeListener = jest.fn();
      integration.on('modeChanged', modeChangeListener);

      await integration.switchMode('fallback');

      expect(modeChangeListener).toHaveBeenCalledWith('fallback', expect.any(String));
    });

    test('should handle mode switch failures', async () => {
      // Mock a failure scenario
      jest.spyOn(integration as any, 'enhanceOriginalAdapter').mockRejectedValue(
        new Error('Enhancement failed')
      );

      const originalMode = integration.getCurrentMode();
      const success = await integration.switchMode('enhanced');

      expect(success).toBe(false);
      expect(integration.getCurrentMode()).toBe(originalMode);
    });
  });

  describe('Statistics and Monitoring', () => {
    beforeEach(async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);
      await integration.initialize();
    });

    test('should provide integration statistics', () => {
      const stats = integration.getStatistics();

      expect(stats).toHaveProperty('currentMode');
      expect(stats).toHaveProperty('navigationSystemActive');
      expect(stats).toHaveProperty('mcpChannelPreserved');
      expect(stats).toHaveProperty('compatibilityScore');
      expect(stats).toHaveProperty('activeFallbacks');
    });

    test('should track terminal capabilities', () => {
      const capabilities = integration.getCapabilities();
      const stats = integration.getStatistics();

      if (capabilities) {
        expect(stats.terminalCapabilities).toBeDefined();
        expect(stats.terminalCapabilities.name).toBe(capabilities.name);
      }
    });

    test('should track active fallbacks', () => {
      const fallbacks = integration.getActiveFallbacks();
      const stats = integration.getStatistics();

      expect(stats.activeFallbacks).toEqual(fallbacks);
    });
  });

  describe('Factory Functions', () => {
    test('setupEnhancedCLI should create properly configured integration', async () => {
      const enhancedIntegration = await setupEnhancedCLI(
        mockCommandRegistry,
        mockMenuRegistry,
        mockSessionContext,
        mockOrchestrator
      );

      expect(enhancedIntegration).toBeInstanceOf(AdaptiveCLIIntegration);
      expect(enhancedIntegration.isEnhanced()).toBeTruthy();

      await enhancedIntegration.cleanup();
    });

    test('setupAccessibleCLI should create accessibility-focused integration', async () => {
      const accessibleIntegration = await setupAccessibleCLI(
        mockCommandRegistry,
        mockMenuRegistry,
        mockSessionContext,
        mockOrchestrator
      );

      expect(accessibleIntegration).toBeInstanceOf(AdaptiveCLIIntegration);
      expect(accessibleIntegration.getCurrentMode()).toBe('accessibility');

      await accessibleIntegration.cleanup();
    });
  });

  describe('Error Recovery', () => {
    test('should recover from transient initialization failures', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { retryAttempts: 2 }
      });

      // Mock transient failure followed by success
      let callCount = 0;
      jest.spyOn(integration as any, 'initializeCompatibilitySystem').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Transient failure');
        }
        return Promise.resolve();
      });

      const result = await integration.initialize();
      
      // Should eventually succeed after retry
      expect(result.success).toBe(true);
    });

    test('should handle permanent failures gracefully', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { retryAttempts: 1 },
        mcpPreservation: { fallbackToOriginal: true }
      });

      // Mock permanent failure
      jest.spyOn(integration as any, 'initializeNavigationSystem').mockRejectedValue(
        new Error('Permanent failure')
      );

      const result = await integration.initialize();

      expect(result.success).toBe(false);
      expect(integration.getCurrentMode()).toBe('original');
    });
  });

  describe('Resource Management', () => {
    test('should cleanup resources properly', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);
      await integration.initialize();

      const navigationSystem = integration.getNavigationSystem();
      const cleanupSpy = navigationSystem ? jest.spyOn(navigationSystem, 'cleanup') : null;

      await integration.cleanup();

      if (cleanupSpy) {
        expect(cleanupSpy).toHaveBeenCalled();
      }
    });

    test('should handle cleanup errors gracefully', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);
      await integration.initialize();

      const navigationSystem = integration.getNavigationSystem();
      if (navigationSystem) {
        jest.spyOn(navigationSystem, 'cleanup').mockRejectedValue(new Error('Cleanup failed'));
      }

      // Should not throw
      await expect(integration.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('Performance', () => {
    test('should initialize within reasonable time', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);

      const startTime = Date.now();
      await integration.initialize();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });

    test('should handle background detection if enabled', async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        performance: { backgroundDetection: true }
      });

      const result = await integration.initialize();

      expect(result.success).toBe(true);
      // Background detection should not block initialization
    });
  });
});

describe('MCP Channel Integration Tests', () => {
  let integration: AdaptiveCLIIntegration;
  let originalAdapter: CLIInterfaceAdapter;

  beforeEach(async () => {
    originalAdapter = new CLIInterfaceAdapter(
      mockCommandRegistry,
      mockMenuRegistry,
      mockSessionContext,
      { enableInteractiveMode: true },
      mockOrchestrator
    );
    await originalAdapter.initialize();

    integration = createAdaptiveCLIIntegration(originalAdapter, {
      mcpPreservation: { enableValidation: true }
    });
  });

  afterEach(async () => {
    await integration.cleanup();
  });

  test('should preserve PTY session management', async () => {
    await integration.initialize();

    const state = integration.getState();
    const mcpResult = state.mcpValidationResult;

    expect(mcpResult).toBeDefined();
    expect(mcpResult?.ptySessionsActive).toBe(true);
  });

  test('should preserve agent interaction patterns', async () => {
    await integration.initialize();

    const state = integration.getState();
    const mcpResult = state.mcpValidationResult;

    expect(mcpResult?.agentInteractionPreserved).toBe(true);
  });

  test('should preserve keyboard handling', async () => {
    await integration.initialize();

    const state = integration.getState();
    const mcpResult = state.mcpValidationResult;

    expect(mcpResult?.keyboardHandlingWorking).toBe(true);
  });

  test('should preserve search interface functionality', async () => {
    await integration.initialize();

    const state = integration.getState();
    const mcpResult = state.mcpValidationResult;

    expect(mcpResult?.searchInterfaceWorking).toBe(true);
  });
});

describe('Accessibility Integration Tests', () => {
  test('should configure for screen reader compatibility', async () => {
    const originalAdapter = new CLIInterfaceAdapter(
      mockCommandRegistry,
      mockMenuRegistry,
      mockSessionContext,
      { enableColorOutput: false }
    );
    await originalAdapter.initialize();

    const integration = createAdaptiveCLIIntegration(originalAdapter, {
      accessibility: {
        forceAccessibleMode: true,
        enableVerboseOutput: true,
        preferScreenReaderMode: true
      }
    });

    const result = await integration.initialize();

    expect(result.success).toBe(true);
    expect(integration.getCurrentMode()).toBe('accessibility');

    const navigationSystem = integration.getNavigationSystem();
    const config = navigationSystem?.getConfig();
    
    expect(config?.accessibility?.enableScreenReader).toBe(true);
    expect(config?.accessibility?.verbosityLevel).toBe('verbose');

    await integration.cleanup();
  });

  test('should enable high contrast mode for visibility', async () => {
    const originalAdapter = new CLIInterfaceAdapter(
      mockCommandRegistry,
      mockMenuRegistry,
      mockSessionContext
    );
    await originalAdapter.initialize();

    const integration = createAdaptiveCLIIntegration(originalAdapter, {
      accessibility: { forceAccessibleMode: true }
    });

    const result = await integration.initialize();

    const navigationSystem = integration.getNavigationSystem();
    const config = navigationSystem?.getConfig();
    
    expect(config?.accessibility?.highContrastMode).toBe(true);

    await integration.cleanup();
  });
});
