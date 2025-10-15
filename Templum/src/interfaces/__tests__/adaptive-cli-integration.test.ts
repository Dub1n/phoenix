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

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import {
  AdaptiveCLIIntegration,
  AdaptiveCLIConfig,
  AdaptiveCLIResult,
  MCPIntegrationResult,
  createAdaptiveCLIIntegration,
  setupEnhancedCLI,
  setupAccessibleCLI,
} from "../adaptive-cli-integration";

import { CLIInterfaceAdapter } from "../cli-adapter";
import type {
  CommandResult,
  InterfaceType,
  TemplumSystemStatus,
  UniversalSkinDefinition,
} from "../../types/templum-types";
import { UniversalMenuDefinition } from "../../menus/universal-menu-registry";
import { UniversalCommandRegistry } from "../../commands/universal-command-registry";
import { UniversalMenuRegistry } from "../../menus/universal-menu-registry";
import { SessionContextFoundation } from "../../session/session-context-foundation";
import type {
  TemplumSessionManagerContract,
  TemplumSessionState,
  SessionStateUpdate,
} from "../../session/universal-session-manager.types";
import { ITemplumOrchestrator } from "../templum-orchestrator-interface";

import {
  TerminalCompatibilitySystem,
  TerminalCapabilities,
  CompatibilityTestResult,
} from "../navigation/terminal-compatibility";
import { DisplayUtils } from "../../utils/display-utils";
import { WindowUtils } from "../../utils/window-utils";
import {
  configureFormatter,
  resetFormatterConfiguration,
} from "../../utils/terminal-formatter";
import { createFormatterCapabilities } from "../../tests/helpers/terminal-formatter-fixtures";

const ansiPattern = /\u001b\[[0-9;]*m/g;

const overrideStdoutColumns = (width: number): (() => void) => {
  const original = process.stdout.columns;
  Object.defineProperty(process.stdout, "columns", {
    configurable: true,
    writable: true,
    value: width,
  });

  return () => {
    Object.defineProperty(process.stdout, "columns", {
      configurable: true,
      writable: true,
      value: original,
    });
  };
};

const analyzeRenderedMenu = async (
  adapter: CLIInterfaceAdapter,
  menuDefinition: any,
) => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  try {
    const result = await adapter.render(menuDefinition);
    if (!result.success || !result.output) {
      throw new Error(result.errors?.join("; ") || "render failed");
    }

    const sanitizedLines = result.output
      .split("\n")
      .map((line) => line.replace(ansiPattern, ""))
      .filter((line) => line.trim().length > 0);

    const lineLengths = sanitizedLines.map((line) => line.length);
    const separatorLengths = sanitizedLines
      .map((line) => line.replace(/[┌┐└┘├┤┬┴┼│]/g, ""))
      .map((line) => line.replace(/\s+/g, ""))
      .filter((segment) => segment.length > 0 && /^[\-─═]+$/.test(segment))
      .map((segment) => segment.length);

    return {
      output: result.output,
      sanitizedLines,
      lineLengths,
      maxLineLength: lineLengths.length ? Math.max(...lineLengths) : 0,
      separatorLengths,
    };
  } finally {
    consoleSpy.mockRestore();
  }
};

// TODO: [TASK-ID-005] Pattern: test-setup | Complexity: 3 | Dependencies: mock-dependencies
// Context: Test environment setup with mocked dependencies for isolation
// Validation-Required: mock-accuracy, test-isolation, setup-teardown
// Pattern-Info: { approach: "comprehensive-mocking", alternatives: "partial-mocking", trade-offs: "isolation-realism" }

/**
 * Mock dependencies
 */
const mockCommandRegistry = {
  executeCommand: jest.fn(),
} as unknown as UniversalCommandRegistry;

const mockMenuRegistry = {
  getMenu: jest.fn(),
  getAvailableMenuIds: jest.fn(),
  loadSkin: jest.fn(),
  updateMenuState: jest.fn(),
  on: jest.fn(),
} as unknown as UniversalMenuRegistry;

const mockSessionContext = {
  getActiveSession: jest.fn(),
  createSession: jest.fn(),
  setActiveSession: jest.fn(),
  updateSessionState: jest.fn(),
  on: jest.fn(),
} as unknown as SessionContextFoundation;

const createDefaultSessionSnapshot = (): TemplumSessionState => ({
  sessionId: 'session-cli-1',
  userId: 'test-user',
  startTime: new Date(),
  activeInterface: 'cli',
  preferences: {},
  capabilities: [],
  activeBackends: [] as InterfaceType[],
  loadedSkins: [],
  interfaceHistory: ['cli'],
  sessionMetrics: {
    interfaceSwitches: 0,
    backendInteractions: 0,
    commandsExecuted: 0,
    sessionsCreated: 1,
    totalSkinLoads: 0,
    averageSwitchTime: 0,
    completion: { completed: false },
  },
  lastActivity: new Date(),
  navigationHistory: ['main'],
  currentMenu: 'main',
  interactionMode: 'menu',
  commandHistory: [],
});

class StubSessionManager implements TemplumSessionManagerContract {
  private snapshot: TemplumSessionState = createDefaultSessionSnapshot();

  async initialize(): Promise<void> {}

  attachOrchestrator(): void {}

  async ensureSessionForInterface(interfaceType: InterfaceType): Promise<string> {
    this.snapshot = {
      ...this.snapshot,
      activeInterface: interfaceType,
    };
    return this.snapshot.sessionId;
  }

  getActiveSessionId(): string | null {
    return this.snapshot.sessionId;
  }

  getSessionSnapshot(): TemplumSessionState | null {
    return this.snapshot;
  }

  async updateSessionState(update: SessionStateUpdate): Promise<void> {
    this.snapshot = {
      ...this.snapshot,
      navigationHistory: update.state.navigationStack ?? this.snapshot.navigationHistory,
      currentMenu: update.state.currentMenu ?? this.snapshot.currentMenu,
      interactionMode: update.state.interactionMode ?? this.snapshot.interactionMode,
      commandHistory: update.state.commandHistory ?? this.snapshot.commandHistory,
      lastActivity: new Date(),
    };
  }

  async registerInterfaceAdapter(): Promise<void> {}

  async syncInterfaces(): Promise<void> {}

  notifyInterfaceDisconnect(): void {}

  on(): void {}

  off(): void {}
}

const createMockOrchestrator = () => {
  const sessionManager = new StubSessionManager();

  const skinEngine = {
    renderForInterface: jest.fn(
      async (
        skinDefinition: UniversalSkinDefinition,
        interfaceType: InterfaceType,
      ) => {
        const items = skinDefinition?.menus?.main?.items ?? [];
        const labels = items.map((item) => item.label).join(' | ');

        return {
          success: true,
          interface: interfaceType,
          metadata: {
            skinId: skinDefinition?.id ?? 'stub-skin',
            backendService: skinDefinition?.metadata?.backendService ?? 'stub-backend',
          },
          components: [],
          performance: {
            renderTime: 1,
            outputSize: labels.length,
            cacheHit: false,
          },
          customization: {},
          inheritance: { parentSkin: undefined, applied: false },
          renderedContent: {
            cli: `CLI_RENDER:${labels}`,
            html: `<div data-skin="${skinDefinition?.id ?? 'stub-skin'}">${labels}</div>`,
          },
        };
      },
    ),
    generateSkinHTML: jest.fn((renderResult) => renderResult.renderedContent?.html ?? ''),
  };

  const systemStatus: TemplumSystemStatus = {
    coreEngine: {
      initialized: true,
      activeInterfaces: ['cli'],
      loadedSkins: [],
      backendConnections: {
        totalConnections: 0,
        healthyConnections: 0,
        backends: {},
      },
    },
    stateManager: {
      synchronized: true,
      globalState: { lastModified: Date.now(), backendStates: [] },
      sessionState: { startTime: Date.now(), totalCommands: 0, lastCommand: '' },
      subscribers: 0,
      historySize: 0,
      persistence: {},
    },
    skinEngine: {
      cachedSkins: 0,
      renderers: { vscode: {}, cli: {}, command: {} },
      performance: { cacheHitRate: 0, averageRenderTime: 0 },
    },
    performance: {
      memory: { heapUsed: 0, rss: 0 },
      cpu: { user: 0, system: 0 },
      interfaces: {},
    },
  };

  const orchestrator = {
    isInitialized: jest.fn().mockReturnValue(true),
    registerInterface: jest.fn().mockResolvedValue(undefined),
    executeCommand: jest.fn(async (): Promise<CommandResult> => ({
      success: true,
      timestamp: Date.now(),
    })),
    loadBackendSkin: jest.fn(async () => null),
    loadSkin: jest.fn(async () => {}),
    getSystemStatus: jest.fn().mockReturnValue(systemStatus),
    getUniversalSkinEngine: jest.fn().mockReturnValue(skinEngine),
    getLoadedSkins: jest.fn().mockReturnValue([] as UniversalSkinDefinition[]),
    getSessionManager: jest.fn().mockReturnValue(sessionManager),
    refreshBackendServices: jest.fn().mockResolvedValue(undefined),
    applyManualOverride: jest.fn().mockResolvedValue({ serviceId: 'stub', active: true, overrides: {} }),
    clearManualOverride: jest.fn().mockResolvedValue({ cleared: [], remaining: [] }),
    getManualOverrideSnapshot: jest.fn().mockReturnValue({ overrides: [] }),
    getBackendRouter: jest.fn().mockReturnValue({
      discoverAndConnect: jest.fn().mockResolvedValue(undefined),
    }),
    getResourceManager: jest.fn().mockReturnValue({
      getAsset: jest.fn(),
    }),
    notifyInterfaceDisconnect: jest.fn(),
    getSupportedInterfaces: jest.fn().mockReturnValue(['cli', 'vscode', 'command'] as InterfaceType[]),
  } as unknown as jest.Mocked<ITemplumOrchestrator>;

  return {
    orchestrator,
    sessionManager,
    skinEngine,
  };
};

let mockOrchestrator: jest.Mocked<ITemplumOrchestrator>;

/**
 * Test fixtures
 */
const mockTerminalCapabilities: TerminalCapabilities = {
  name: "Test Terminal",
  version: "1.0.0",
  platform: "test",
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
  renderingSpeed: "fast",
  refreshRate: 60,
  screenReaderCompatible: false,
  highContrastMode: false,
  knownIssues: [],
  limitations: [],
  detectionConfidence: 95,
  featureReliability: 90,
};

const mockCompatibilityTestResult: CompatibilityTestResult = {
  overall: "excellent",
  score: 95,
  capabilities: mockTerminalCapabilities,
  tests: [],
  recommendations: [],
  fallbacksRequired: [],
};

describe("AdaptiveCLIIntegration", () => {
  let originalAdapter: CLIInterfaceAdapter;
  let integration: AdaptiveCLIIntegration;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    DisplayUtils.reset();
    resetFormatterConfiguration();

    // Build orchestrator and supporting stubs
    const build = createMockOrchestrator();
    mockOrchestrator = build.orchestrator;

    // Create original adapter
    originalAdapter = new CLIInterfaceAdapter({
      enableInteractiveMode: true,
    });

    await originalAdapter.initialize(mockOrchestrator);
  });

  afterEach(async () => {
    DisplayUtils.reset();
    resetFormatterConfiguration();
    if (integration) {
      await integration.cleanup();
      integration = undefined as unknown as AdaptiveCLIIntegration;
    }

    if (originalAdapter) {
      await originalAdapter.cleanup();
    }
  });

  describe("Initialization", () => {
    test("configures terminal display dependencies", async () => {
      const displayConfigureSpy = jest.spyOn(DisplayUtils, "configure");
      const windowConfigureSpy = jest.spyOn(WindowUtils, "configure");

      const adapter = new CLIInterfaceAdapter({
        enableInteractiveMode: true,
      });

      await adapter.initialize(mockOrchestrator);

      expect(displayConfigureSpy).toHaveBeenCalled();
      expect(windowConfigureSpy).toHaveBeenCalled();

      await adapter.cleanup();

      displayConfigureSpy.mockRestore();
      windowConfigureSpy.mockRestore();
    });

    test("should initialize with default configuration", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);

      const result = await integration.initialize();

      expect(result.success).toBe(true);
      expect(integration.getCurrentMode()).toBeDefined();
      expect(integration.getState().originalAdapter).toBe(originalAdapter);
    });

    test("should initialize with custom configuration", async () => {
      const config: AdaptiveCLIConfig = {
        compatibility: {
          enableDetection: true,
          forceDetection: false,
          fallbackTimeout: 3000,
          retryAttempts: 1,
        },
        accessibility: {
          forceAccessibleMode: true,
          enableVerboseOutput: true,
        },
      };

      integration = createAdaptiveCLIIntegration(originalAdapter, config);

      const result = await integration.initialize();

      expect(result.success).toBe(true);
      expect(integration.getCurrentMode()).toBe("accessibility");
    });

    test("should handle initialization errors gracefully", async () => {
      // Mock a failing scenario
      const failingConfig: AdaptiveCLIConfig = {
        mcpPreservation: {
          enableValidation: true,
          fallbackToOriginal: true,
        },
      };

      integration = createAdaptiveCLIIntegration(
        originalAdapter,
        failingConfig,
      );

      // Force an error in the navigation system
      jest
        .spyOn(integration as any, "initializeNavigationSystem")
        .mockRejectedValue(new Error("Navigation failed"));

      const result = await integration.initialize();

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Navigation system initialization failed: Navigation failed",
      );
      expect(integration.getCurrentMode()).toBe("original");
    });
  });

  describe("Terminal Compatibility Detection", () => {
    test("should detect terminal capabilities accurately", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { enableDetection: true },
      });

      const result = await integration.initialize();

      expect(result.capabilities).toBeDefined();
      expect(result.compatibilityScore).toBeGreaterThan(0);
    });

    test("should apply fallbacks for incompatible terminals", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { enableDetection: true },
      });

      // Mock poor compatibility
      const compatibilitySystem = integration.getCompatibilitySystem();
      if (compatibilitySystem) {
        jest
          .spyOn(compatibilitySystem as any, "evaluateCompatibility")
          .mockReturnValue({
            overall: "poor",
            score: 30,
            capabilities: {
              ...mockTerminalCapabilities,
              supportsUnicode: false,
              supportsColor: false,
            },
            tests: [],
            recommendations: ["Enable UTF-8 support"],
            fallbacksRequired: ["unicode", "color"],
          });
      }

      const result = await integration.initialize();

      expect(result.fallbacksActive).toContain("unicode");
      expect(result.fallbacksActive).toContain("color");
      expect(integration.getCurrentMode()).toBe("fallback");
    });

    test("should cache capabilities for performance", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        performance: { cacheCapabilities: true },
      });

      // Initialize twice
      await integration.initialize();
      const firstResult = await integration.initialize();

      // Should use cached results
      expect(firstResult.success).toBe(true);
    });
  });

  describe("Type Guard Enforcement", () => {
    test("render rejects non-plain menu payloads", async () => {
      const menuPayload = new (class MenuPayload {
        sections = [{ items: [{ label: "Start Application" }] }];
      })();

      const result = await originalAdapter.render(menuPayload as any);

      expect(result.success).toBe(false);
      expect(result.rendered).toBe(false);
      expect(result.errors?.[0]).toContain("plain object");
    });
  });

  describe("MCP Channel Compatibility", () => {
    test("should preserve MCP channel functionality", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        mcpPreservation: { enableValidation: true },
      });

      const result = await integration.initialize();

      expect(result.mcpChannelPreserved).toBe(true);
    });

    test("should detect MCP integration issues", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        mcpPreservation: { enableValidation: true },
      });

      // Mock MCP validation failure
      const state = integration.getState();
      if (state.mcpBridge) {
        jest.spyOn(state.mcpBridge, "testMCPIntegration").mockResolvedValue({
          success: false,
          ptySessionsActive: false,
          agentInteractionPreserved: false,
          keyboardHandlingWorking: false,
          searchInterfaceWorking: false,
          errors: ["PTY sessions not functional"],
          warnings: [],
        });
      }

      const result = await integration.initialize();

      expect(result.mcpChannelPreserved).toBe(false);
      expect(result.errors).toContain("PTY sessions not functional");
    });

    test("should fallback to original when MCP validation fails", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        mcpPreservation: {
          enableValidation: true,
          fallbackToOriginal: true,
        },
      });

      // Mock MCP validation failure
      const state = integration.getState();
      if (state.mcpBridge) {
        jest.spyOn(state.mcpBridge, "testMCPIntegration").mockResolvedValue({
          success: false,
          ptySessionsActive: false,
          agentInteractionPreserved: false,
          keyboardHandlingWorking: false,
          searchInterfaceWorking: false,
          errors: ["Critical MCP failure"],
          warnings: [],
        });
      }

      const result = await integration.initialize();

      expect(integration.getCurrentMode()).toBe("original");
      expect(result.warnings).toContain(
        "Falling back to original CLI adapter due to integration issues",
      );
    });
  });

  describe("Navigation System Integration", () => {
    test("should initialize navigation system with appropriate configuration", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        navigation: {
          compatibility: { detectCapabilities: true },
          accessibility: { enableKeyboardNavigation: true },
        },
      });

      const result = await integration.initialize();

      expect(result.navigationSystemActive).toBe(true);
      expect(integration.getNavigationSystem()).toBeDefined();
    });

    test("should adapt navigation configuration to terminal capabilities", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { enableDetection: true },
      });

      const result = await integration.initialize();

      const navigationSystem = integration.getNavigationSystem();
      expect(navigationSystem).toBeDefined();

      const config = navigationSystem?.getConfig();
      expect(config).toBeDefined();
    });

    test("should handle navigation system initialization failures", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);

      // Mock navigation system failure
      jest
        .spyOn(integration as any, "initializeNavigationSystem")
        .mockRejectedValue(new Error("Navigation initialization failed"));

      const result = await integration.initialize();

      expect(result.success).toBe(false);
      expect(result.navigationSystemActive).toBe(false);
    });
  });

  describe("Responsive Layout Safeguards", () => {
    const createMenuDefinition = (): UniversalMenuDefinition => ({
      id: "display-standards-menu",
      title: "Display Standards Console",
      subtitle: "Baseline layout rendering story",
      sections: [
        {
          id: "primary-actions",
          heading: "Primary Actions",
          items: [
            {
              id: "connect-core-display",
              label: "Connect to Primary Display Orchestrator",
              description:
                "Initialize handshake across connectors and calibrators for terminal rendering",
              action: { type: "command", target: "connect-core-display" },
            },
            {
              id: "synchronize-multi-cloud",
              label:
                "Synchronize Observability Metrics Across Multi-Cloud Connectors",
              description:
                "Aligns telemetry ingestion, redraw intervals, and constraint registries across environments",
              action: { type: "command", target: "sync-metrics" },
            },
            {
              id: "diagnostics-pass",
              label: "Execute Full Diagnostics and Layout Verification Sweep",
              description:
                "Collects status metrics, redraw traces, and separator drift data for analysis",
              action: { type: "command", target: "run-diagnostics" },
            },
          ],
        },
        {
          id: "secondary-actions",
          heading: "Secondary Controls",
          items: [
            {
              id: "fallback-refresh",
              label: "Refresh fallback layout caches",
              description:
                "Ensures recursive separator rebuilds respect cached measurements",
              action: { type: "command", target: "refresh-fallback-cache" },
            },
            {
              id: "export-layout-baseline",
              label: "Export layout snapshot for audit trail review",
              description:
                "Persists separator widths, recursive depth, and padding metadata to disk",
              action: { type: "command", target: "export-layout-snapshot" },
            },
          ],
        },
      ],
      metadata: {
        allowBack: true,
        category: "display",
      },
    });

    test("respects constrained terminal widths before migrations", async () => {
      const columns = 58;
      const restoreColumns = overrideStdoutColumns(columns);
      DisplayUtils.configure({ columnsProvider: () => columns });
      try {
        const analysis = await analyzeRenderedMenu(
          originalAdapter,
          createMenuDefinition(),
        );

        const standards = DisplayUtils.standards;
        const measured = analysis.separatorLengths[0] ?? 0;
        expect(measured).toBeGreaterThan(0);
        expect(measured).toBeLessThanOrEqual(standards.separatorLength);
        expect(measured).toBeGreaterThanOrEqual(
          Math.max(1, standards.separatorLength - standards.separatorMargin),
        );
        expect(analysis.maxLineLength).toBeGreaterThanOrEqual(measured);
        expect(analysis.maxLineLength).toBeLessThanOrEqual(
          standards.separatorLength + standards.borderWidth,
        );
        expect(analysis.maxLineLength - measured).toBeLessThanOrEqual(
          standards.borderWidth,
        );
      } finally {
        DisplayUtils.reset();
        restoreColumns();
      }
    });

    test("saturates at design max when ample width available", async () => {
      const columns = 140;
      const restoreColumns = overrideStdoutColumns(columns);
      DisplayUtils.configure({ columnsProvider: () => columns });
      try {
        const analysis = await analyzeRenderedMenu(
          originalAdapter,
          createMenuDefinition(),
        );

        const standards = DisplayUtils.standards;
        const measured = analysis.separatorLengths[0] ?? 0;
        expect(measured).toBeGreaterThan(0);
        expect(measured).toBeLessThanOrEqual(standards.separatorLength);
        expect(measured).toBeGreaterThanOrEqual(
          Math.max(1, standards.separatorLength - standards.separatorMargin),
        );
        expect(analysis.maxLineLength).toBeGreaterThanOrEqual(measured);
        expect(analysis.maxLineLength).toBeLessThanOrEqual(
          standards.separatorLength + standards.borderWidth,
        );
        expect(analysis.maxLineLength - measured).toBeLessThanOrEqual(
          standards.borderWidth,
        );
      } finally {
        DisplayUtils.reset();
        restoreColumns();
      }
    });

    test("aligns separators with DisplayUtils standards", async () => {
      const columns = 96;
      const restoreColumns = overrideStdoutColumns(columns);
      DisplayUtils.configure({ columnsProvider: () => columns });
      try {
        const analysis = await analyzeRenderedMenu(
          originalAdapter,
          createMenuDefinition(),
        );

        const standards = DisplayUtils.standards;
        const measured = analysis.separatorLengths[0] ?? 0;
        expect(measured).toBeGreaterThan(0);
        expect(measured).toBeLessThanOrEqual(standards.separatorLength);
        expect(measured).toBeGreaterThanOrEqual(
          Math.max(1, standards.separatorLength - standards.separatorMargin),
        );
        expect(analysis.maxLineLength).toBeGreaterThanOrEqual(measured);
        expect(analysis.maxLineLength).toBeLessThanOrEqual(
          standards.separatorLength + standards.borderWidth,
        );
        expect(analysis.maxLineLength - measured).toBeLessThanOrEqual(
          standards.borderWidth,
        );
      } finally {
        DisplayUtils.reset();
        restoreColumns();
      }
    });
  });

  describe("Window and Theme Baselines", () => {
    const createWindowScenario = (): UniversalMenuDefinition => ({
      id: "window-layout-menu",
      title: "Window Layout Baseline",
      subtitle: "Theme + capability snapshot",
      sections: [
        {
          id: "window-primary",
          heading: "Primary Window Actions",
          items: [
            {
              id: "open-window",
              label: "Open orchestrated window",
              description:
                "Creates a terminal window using default formatter + theme",
              action: { type: "command", target: "open-window" },
            },
            {
              id: "pin-layout",
              label: "Pin adaptive layout snapshot",
              description:
                "Locks current window layout for comparison during migrations",
              action: { type: "command", target: "pin-layout" },
            },
          ],
        },
        {
          id: "window-secondary",
          heading: "Secondary Diagnostics",
          items: [
            {
              id: "preview-theme",
              label: "Preview current theme blend",
              description: "Prints terminal theme accents for inline audit",
              action: { type: "command", target: "preview-theme" },
            },
            {
              id: "fallback-theme",
              label: "Trigger fallback safe mode",
              description:
                "Simulates color/unicode fallback for regression harness",
              action: { type: "command", target: "fallback-theme" },
            },
          ],
        },
      ],
      metadata: {
        allowBack: true,
        window: "stage4c-baseline",
        theme: "default",
      },
    });

    const captureBaseline = async (columns: number) => {
      const restoreColumns = overrideStdoutColumns(columns);
      try {
        const analysis = await analyzeRenderedMenu(
          originalAdapter,
          createWindowScenario(),
        );
        const colorSegments = analysis.output.match(/\u001b\[[0-9;]*m/g) ?? [];

        return {
          columns,
          sanitizedPreview: analysis.sanitizedLines.slice(0, 6),
          lineLengths: analysis.lineLengths.slice(0, 6),
          separatorLengths: analysis.separatorLengths.slice(0, 2),
          colorSegments: colorSegments.length,
        };
      } finally {
        restoreColumns();
      }
    };

    test("captures default theme window layout snapshot", async () => {
      const baseline = await captureBaseline(96);
      const standards = DisplayUtils.standards;

      expect(new Set(baseline.lineLengths)).toEqual(
        new Set([standards.separatorLength + standards.borderWidth]),
      );
      expect(new Set(baseline.separatorLengths)).toEqual(
        new Set([standards.separatorLength]),
      );
      expect(baseline.colorSegments).toBe(0);
      expect(baseline.sanitizedPreview[0][0]).toBe('┌');
      expect(baseline.sanitizedPreview[0].length).toBe(
        standards.separatorLength + standards.borderWidth,
      );
      expect(baseline.sanitizedPreview[1]).toContain('Window Layout Baseline');
      expect(
        baseline.sanitizedPreview.join(' '),
      ).toContain('Theme + capability snapshot');
    });

    test("captures fallback snapshot when color support disabled", async () => {
      configureFormatter({
        capabilitiesProvider: () =>
          createFormatterCapabilities({
            supportsColor: false,
            supportsUnicode: false,
          }),
      });

      try {
        const baseline = await captureBaseline(96);
        const standards = DisplayUtils.standards;

        expect(new Set(baseline.lineLengths)).toEqual(
          new Set([standards.separatorLength + standards.borderWidth]),
        );
        expect(new Set(baseline.separatorLengths)).toEqual(
          new Set([standards.separatorLength]),
        );
        expect(baseline.colorSegments).toBe(0);
        expect(baseline.sanitizedPreview[0].length).toBe(
          standards.separatorLength + standards.borderWidth,
        );
        expect(
          baseline.sanitizedPreview.join(' '),
        ).toContain('Theme + capability snapshot');
      } finally {
        resetFormatterConfiguration();
      }
    });
  });

  describe("Mode Switching", () => {
    beforeEach(async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);
      await integration.initialize();
    });

    test("should switch between operating modes", async () => {
      const initialMode = integration.getCurrentMode();

      const success = await integration.switchMode("accessibility");

      expect(success).toBe(true);
      expect(integration.getCurrentMode()).toBe("accessibility");
      expect(integration.getCurrentMode()).not.toBe(initialMode);
    });

    test("should emit mode change events", async () => {
      const modeChangeListener = jest.fn();
      integration.on("modeChanged", modeChangeListener);

      await integration.switchMode("fallback");

      expect(modeChangeListener).toHaveBeenCalledWith(
        "fallback",
        expect.any(String),
      );
    });

    test("should handle mode switch failures", async () => {
      // Mock a failure scenario
      jest
        .spyOn(integration as any, "enhanceOriginalAdapter")
        .mockRejectedValue(new Error("Enhancement failed"));

      const originalMode = integration.getCurrentMode();
      const success = await integration.switchMode("enhanced");

      expect(success).toBe(false);
      expect(integration.getCurrentMode()).toBe(originalMode);
    });
  });

  describe("Statistics and Monitoring", () => {
    beforeEach(async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);
      await integration.initialize();
    });

    test("should provide integration statistics", () => {
      const stats = integration.getStatistics();

      expect(stats).toHaveProperty("currentMode");
      expect(stats).toHaveProperty("navigationSystemActive");
      expect(stats).toHaveProperty("mcpChannelPreserved");
      expect(stats).toHaveProperty("compatibilityScore");
      expect(stats).toHaveProperty("activeFallbacks");
    });

    test("should track terminal capabilities", () => {
      const capabilities = integration.getCapabilities();
      const stats = integration.getStatistics();

      if (capabilities) {
        expect(stats.terminalCapabilities).toBeDefined();
        expect(stats.terminalCapabilities.name).toBe(capabilities.name);
      }
    });

    test("should track active fallbacks", () => {
      const fallbacks = integration.getActiveFallbacks();
      const stats = integration.getStatistics();

      expect(stats.activeFallbacks).toEqual(fallbacks);
    });
  });

  describe("Factory Functions", () => {
    test("setupEnhancedCLI should create properly configured integration", async () => {
      const enhancedIntegration = await setupEnhancedCLI(
        mockCommandRegistry,
        mockMenuRegistry,
        mockSessionContext,
        mockOrchestrator,
      );

      expect(enhancedIntegration).toBeInstanceOf(AdaptiveCLIIntegration);
      expect(enhancedIntegration.isEnhanced()).toBeTruthy();

      await enhancedIntegration.cleanup();
    });

    test("setupAccessibleCLI should create accessibility-focused integration", async () => {
      const accessibleIntegration = await setupAccessibleCLI(
        mockCommandRegistry,
        mockMenuRegistry,
        mockSessionContext,
        mockOrchestrator,
      );

      expect(accessibleIntegration).toBeInstanceOf(AdaptiveCLIIntegration);
      expect(accessibleIntegration.getCurrentMode()).toBe("accessibility");

      await accessibleIntegration.cleanup();
    });
  });

  describe("Error Recovery", () => {
    test("should recover from transient initialization failures", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { retryAttempts: 2 },
      });

      // Mock transient failure followed by success
      let callCount = 0;
      jest
        .spyOn(integration as any, "initializeCompatibilitySystem")
        .mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error("Transient failure");
          }
          return Promise.resolve();
        });

      const result = await integration.initialize();

      // Should eventually succeed after retry
      expect(result.success).toBe(true);
    });

    test("should handle permanent failures gracefully", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        compatibility: { retryAttempts: 1 },
        mcpPreservation: { fallbackToOriginal: true },
      });

      // Mock permanent failure
      jest
        .spyOn(integration as any, "initializeNavigationSystem")
        .mockRejectedValue(new Error("Permanent failure"));

      const result = await integration.initialize();

      expect(result.success).toBe(false);
      expect(integration.getCurrentMode()).toBe("original");
    });
  });

  describe("Resource Management", () => {
    test("should cleanup resources properly", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);
      await integration.initialize();

      const navigationSystem = integration.getNavigationSystem();
      const cleanupSpy = navigationSystem
        ? jest.spyOn(navigationSystem, "cleanup")
        : null;

      await integration.cleanup();

      if (cleanupSpy) {
        expect(cleanupSpy).toHaveBeenCalled();
      }
    });

    test("should handle cleanup errors gracefully", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);
      await integration.initialize();

      const navigationSystem = integration.getNavigationSystem();
      if (navigationSystem) {
        jest
          .spyOn(navigationSystem, "cleanup")
          .mockRejectedValue(new Error("Cleanup failed"));
      }

      // Should not throw
      await expect(integration.cleanup()).resolves.toBeUndefined();
    });
  });

  describe("Performance", () => {
    test("should initialize within reasonable time", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter);

      const startTime = Date.now();
      await integration.initialize();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    });

    test("should handle background detection if enabled", async () => {
      integration = createAdaptiveCLIIntegration(originalAdapter, {
        performance: { backgroundDetection: true },
      });

      const result = await integration.initialize();

      expect(result.success).toBe(true);
      // Background detection should not block initialization
    });
  });
});

describe("MCP Channel Integration Tests", () => {
  let integration: AdaptiveCLIIntegration;
  let originalAdapter: CLIInterfaceAdapter;

  beforeEach(async () => {
    const build = createMockOrchestrator();
    mockOrchestrator = build.orchestrator;

    originalAdapter = new CLIInterfaceAdapter({ enableInteractiveMode: true });
    await originalAdapter.initialize(mockOrchestrator);

    integration = createAdaptiveCLIIntegration(originalAdapter, {
      mcpPreservation: { enableValidation: true },
    });
  });

  afterEach(async () => {
    await integration.cleanup();
  });

  test("should preserve PTY session management", async () => {
    await integration.initialize();

    const state = integration.getState();
    const mcpResult = state.mcpValidationResult;

    expect(mcpResult).toBeDefined();
    expect(mcpResult?.ptySessionsActive).toBe(true);
  });

  test("should preserve agent interaction patterns", async () => {
    await integration.initialize();

    const state = integration.getState();
    const mcpResult = state.mcpValidationResult;

    expect(mcpResult?.agentInteractionPreserved).toBe(true);
  });

  test("should preserve keyboard handling", async () => {
    await integration.initialize();

    const state = integration.getState();
    const mcpResult = state.mcpValidationResult;

    expect(mcpResult?.keyboardHandlingWorking).toBe(true);
  });

  test("should preserve search interface functionality", async () => {
    await integration.initialize();

    const state = integration.getState();
    const mcpResult = state.mcpValidationResult;

    expect(mcpResult?.searchInterfaceWorking).toBe(true);
  });
});

describe("Accessibility Integration Tests", () => {
  test("should configure for screen reader compatibility", async () => {
    const build = createMockOrchestrator();
    mockOrchestrator = build.orchestrator;

    const originalAdapter = new CLIInterfaceAdapter({
      enableColorOutput: false,
    });
    await originalAdapter.initialize(mockOrchestrator);

    const integration = createAdaptiveCLIIntegration(originalAdapter, {
      accessibility: {
        forceAccessibleMode: true,
        enableVerboseOutput: true,
        preferScreenReaderMode: true,
      },
    });

    const result = await integration.initialize();

    expect(result.success).toBe(true);
    expect(integration.getCurrentMode()).toBe("accessibility");

    await integration.cleanup();
    await originalAdapter.cleanup();

    const navigationSystem = integration.getNavigationSystem();
    const config = navigationSystem?.getConfig();

    expect(config?.accessibility?.enableScreenReader).toBe(true);
    expect(config?.accessibility?.verbosityLevel).toBe("verbose");

    await integration.cleanup();
  });

  test("should enable high contrast mode for visibility", async () => {
    const build = createMockOrchestrator();
    mockOrchestrator = build.orchestrator;

    const originalAdapter = new CLIInterfaceAdapter();
    await originalAdapter.initialize(mockOrchestrator);

    const integration = createAdaptiveCLIIntegration(originalAdapter, {
      accessibility: { forceAccessibleMode: true },
    });

    const result = await integration.initialize();

    const navigationSystem = integration.getNavigationSystem();
    const config = navigationSystem?.getConfig();

    expect(config?.accessibility?.highContrastMode).toBe(true);

    await integration.cleanup();
    await originalAdapter.cleanup();
  });
});
