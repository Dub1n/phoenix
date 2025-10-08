/**---
 * title: [Interface Adapter Integration Tests - Comprehensive Test Suite]
 * tags: [Testing, Integration, Interface, Adapter, TDD]
 * provides: [Interface Adapter Integration Tests, Orchestrator Integration Validation]
 * requires: [Jest, Interface Adapters, TemplumCore, Mock Orchestrator]
 * description: [Comprehensive integration tests for VSCode, CLI, and Command interface adapters with orchestrator interaction validation]
 * ---*/

import { EventEmitter } from "events";
import {
  InterfaceType,
  UniversalSkinDefinition,
  StateUpdate,
  InterfaceAdapterStatus,
  createTemplumError,
} from "../../src/types/templum-types";
import {
  ITemplumOrchestrator,
  IInterfaceAdapter,
} from "../../src/interfaces/templum-orchestrator-interface";
import { VSCodeInterfaceAdapter } from "../../src/interfaces/vscode-adapter-abstracted";
import { CLIInterfaceAdapter } from "../../src/interfaces/cli-adapter-abstracted";
import { CommandInterfaceAdapter } from "../../src/interfaces/command-adapter-abstracted";
import {
  DefaultColorThemes,
  ensureThemeIntegrity,
  ResponsiveLayout,
} from "../../src/interfaces/terminal-ui-components";
import { TemplumUniversalSessionManager } from "../../src/session/templum-universal-session-manager";
import { createTestPCLSkinDefinition } from "../templum/universal-skin-system.test";
import type {
  ManualOverrideDescriptor,
  ManualOverrideOptions,
  ManualOverrideSnapshot,
  ManualOverrideClearResult,
} from "../../src/backend/manual-override-manager";

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

const createStubBackendRouter = () => ({
  discoverAndConnect: jest.fn().mockResolvedValue(undefined),
  loadBackendSkin: jest.fn().mockResolvedValue(null),
  executeCommand: jest.fn().mockResolvedValue(undefined),
  getConnectionStatus: jest.fn().mockReturnValue({
    totalConnections: 0,
    healthyConnections: 0,
    backends: {},
  }),
});

const createVSCodeContext = () => {
  const noop = jest.fn();
  return {
    extensionUri: undefined,
    subscriptions: [],
    globalState: { get: jest.fn(), update: jest.fn() },
    workspaceState: { get: jest.fn(), update: jest.fn() },
    asAbsolutePath: (value: string) => value,
    environmentVariableCollection: {
      persistent: true,
      replace: noop,
      get: noop,
      forEach: noop,
      append: noop,
      prepend: noop,
      clear: noop,
      delete: noop,
    },
  } as any;
};

class StubSessionManager extends EventEmitter {
  initialize = jest.fn().mockResolvedValue(undefined);
  attachOrchestrator = jest.fn();
  ensureSessionForInterface = jest.fn().mockResolvedValue('stub-session');
  registerInterfaceAdapter = jest.fn().mockResolvedValue(undefined);
  updateSessionState = jest.fn().mockResolvedValue(undefined);
  syncInterfaces = jest.fn().mockResolvedValue(undefined);
  notifyInterfaceDisconnect = jest.fn();
  getSessionSnapshot = jest.fn().mockReturnValue(null);
  getActiveSessionId = jest.fn().mockReturnValue('stub-session');
}

/**
 * Mock Orchestrator for Testing Interface Adapter Integration
 *
 * This provides a controlled orchestrator implementation for testing
 * interface adapter behavior without full system dependencies.
 */
class MockTemplumOrchestrator
  extends EventEmitter
  implements ITemplumOrchestrator
{
  private initialized: boolean = false;
  private registeredInterfaces: Map<InterfaceType, IInterfaceAdapter> =
    new Map();
  private supportedInterfaces: InterfaceType[] = ["vscode", "cli", "command"];
  private backendRouterStub = createStubBackendRouter();
  private sessionManager: TemplumUniversalSessionManager | StubSessionManager;
  private manualOverrides = new Map<string, ManualOverrideDescriptor>();
  private loadedSkins: UniversalSkinDefinition[] = [];

  constructor(options: {
    sessionManager?: TemplumUniversalSessionManager;
  } = {}) {
    super();
    this.sessionManager = options.sessionManager ?? new StubSessionManager();
    if ('attachOrchestrator' in this.sessionManager) {
      this.sessionManager.attachOrchestrator(this);
    }
  }

  async initialize(): Promise<void> {
    await (this.sessionManager.initialize?.() ?? Promise.resolve());
    await (this.sessionManager.ensureSessionForInterface?.('cli') ?? Promise.resolve('cli-session'));
    this.initialized = true;
    this.emit("initialized");
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getSupportedInterfaces(): InterfaceType[] {
    return [...this.supportedInterfaces];
  }

  async registerInterface(
    interfaceType: InterfaceType,
    adapter: any,
  ): Promise<void> {
    if (!this.initialized) {
      throw createTemplumError(
        "Cannot register interface on uninitialized orchestrator",
        "SERVICE_NOT_READY",
        "configuration",
      );
    }
    this.registeredInterfaces.set(interfaceType, adapter);
    await (this.sessionManager.ensureSessionForInterface?.(interfaceType) ?? Promise.resolve());
    await (this.sessionManager.registerInterfaceAdapter?.(interfaceType, adapter) ?? Promise.resolve());
    this.emit("interface-registered", { interfaceType, adapter });
  }

  async loadSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    this.emit("skin-loaded", skinDefinition);
  }

  async loadBackendSkin(
    backendId: string,
  ): Promise<UniversalSkinDefinition | null> {
    // Return mock skin for testing
    return {
      id: `mock-skin-${backendId}`,
      name: `Mock Skin for ${backendId}`,
      version: "1.0.0",
      description: `Mock skin for testing ${backendId}`,
      metadata: {
        id: `mock-skin-${backendId}`,
        name: `Mock Skin for ${backendId}`,
        version: "1.0.0",
        description: `Mock skin for testing ${backendId}`,
        backend: "haruspex" as any,
        backendService: "haruspex-service",
        compatibleInterfaces: ["vscode", "cli", "command"],
      },
      theme: {
        primary: "#007ACC",
        secondary: "#00AA44",
        accent: "#FF6600",
        success: "#00AA44",
        warning: "#FFAA00",
        error: "#FF4444",
        background: "#1E1E1E",
        foreground: "#FFFFFF",
      },
      pclCompatibility: {
        enabled: true,
        version: "1.0.0",
        reusePercentage: 75,
        inheritancePatterns: ["command-pattern"],
        optimizations: ["lazy-loading"],
        features: [],
      },
    };
  }

  async executeCommand(
    command: string,
    sourceInterface: InterfaceType,
    args?: any[],
  ): Promise<any> {
    return {
      success: true,
      message: `Mock execution of ${command} from ${sourceInterface}`,
      data: { command, sourceInterface, args },
    };
  }

  getSystemStatus(): any {
    return {
      health: "healthy",
      activeInterfaces: Array.from(this.registeredInterfaces.keys()),
      version: "1.0.0-test",
    };
  }

  getLoadedSkins(): UniversalSkinDefinition[] {
    return this.loadedSkins;
  }

  async refreshBackendServices(): Promise<void> {
    this.emit("backend-services-refreshed");
  }

  getSessionManager(): TemplumUniversalSessionManager | StubSessionManager {
    return this.sessionManager;
  }

  getUniversalSkinEngine(): any {
    return {
      renderForInterface: jest
        .fn()
        .mockResolvedValue("<mock-rendered-content/>"),
    };
  }

  getBackendRouter(): any {
    return {
      getConnectionStatus: jest
        .fn()
        .mockReturnValue({ connected: true, services: [] }),
    };
  }

  getResourceManager(): any {
    return {
      getMetrics: jest.fn().mockReturnValue({ memory: 0, cpu: 0 }),
    };
  }

  async applyManualOverride(
    serviceId: string,
    options: ManualOverrideOptions = {},
  ): Promise<ManualOverrideDescriptor> {
    const descriptor: ManualOverrideDescriptor = {
      serviceId,
      scope: options.scope ?? "session",
      appliedAt: Date.now(),
      expiresAt: options.expiresAt,
      reason: options.reason,
    };
    this.manualOverrides.set(serviceId, descriptor);
    return descriptor;
  }

  async clearManualOverride(
    serviceId?: string,
  ): Promise<ManualOverrideClearResult> {
    if (serviceId) {
      const descriptor = this.manualOverrides.get(serviceId);
      this.manualOverrides.delete(serviceId);
      return {
        descriptor: descriptor ?? {
          serviceId,
          scope: "session",
          appliedAt: Date.now(),
        },
        snapshot: this.getManualOverrideSnapshot(),
      };
    }

    this.manualOverrides.clear();
    return {
      descriptor: undefined,
      snapshot: this.getManualOverrideSnapshot(),
    };
  }

  getManualOverrideSnapshot(): ManualOverrideSnapshot {
    return {
      overrides: Array.from(this.manualOverrides.values()),
      updatedAt: Date.now(),
    };
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
    this.registeredInterfaces.clear();
    await (this.sessionManager as any).stopSession?.();
    this.emit("shutdown");
  }

  // Helper methods for testing
  getRegisteredInterface(
    interfaceType: InterfaceType,
  ): IInterfaceAdapter | undefined {
    return this.registeredInterfaces.get(interfaceType);
  }

  getRegisteredInterfaceCount(): number {
    return this.registeredInterfaces.size;
  }

  setLoadedSkins(skins: UniversalSkinDefinition[]): void {
    this.loadedSkins = skins;
  }
}

/**
 * Mock VSCode Context for Testing
 */
class MockVSCodeContext {
  subscriptions: any[] = [];
  globalState = new Map();
  workspaceState = new Map();
  extensionUri = { fsPath: "/mock/extension/path" };
  extensionPath = "/mock/extension/path";

  constructor() {
    // Mock VSCode context implementation
  }
}

describe("Interface Adapter Integration Tests", () => {
  let mockOrchestrator: MockTemplumOrchestrator;

  beforeEach(async () => {
    mockOrchestrator = new MockTemplumOrchestrator();
    await mockOrchestrator.initialize();
  });

  afterEach(async () => {
    if (mockOrchestrator.isInitialized()) {
      await mockOrchestrator.shutdown();
    }
  });

  describe("VSCode Interface Adapter Integration", () => {
    let vscodeAdapter: VSCodeInterfaceAdapter;
    let mockVSCodeContext: MockVSCodeContext;

    beforeEach(() => {
      mockVSCodeContext = new MockVSCodeContext();
      vscodeAdapter = new VSCodeInterfaceAdapter(mockVSCodeContext as any);
    });

    afterEach(async () => {
      if (vscodeAdapter) {
        await vscodeAdapter.dispose();
      }
    });

    test("initializes with orchestrator and registers interface", async () => {
      // Act
      await vscodeAdapter.initialize(mockOrchestrator);

      // Assert
      expect(mockOrchestrator.getRegisteredInterface("vscode")).toBe(
        vscodeAdapter,
      );
      expect(mockOrchestrator.getRegisteredInterfaceCount()).toBe(1);
    });

    test("returns correct interface type", () => {
      // Act
      const interfaceType = vscodeAdapter.getInterfaceType();

      // Assert
      expect(interfaceType).toBe("vscode");
    });

    test("applies skin through orchestrator integration", async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);
      const mockSkin: UniversalSkinDefinition = {
        id: "test-skin",
        name: "Test Skin",
        version: "1.0.0",
        metadata: {
          id: "test-skin",
          name: "Test Skin",
          version: "1.0.0",
          backend: "haruspex",
          backendService: "haruspex-service",
          compatibleInterfaces: ["vscode"],
        },
        theme: {
          primary: "#007ACC",
          secondary: "#00AA44",
          accent: "#FF6600",
          success: "#00AA44",
          warning: "#FFAA00",
          error: "#FF4444",
          background: "#FFFFFF",
          foreground: "#000000",
        },
        pclCompatibility: {
          enabled: true,
          version: "1.0.0",
          reusePercentage: 75,
          inheritancePatterns: ["command-pattern"],
          optimizations: ["lazy-loading"],
          features: [],
        },
      };

      // Act & Assert - Should not throw
      await expect(vscodeAdapter.applySkin(mockSkin)).resolves.not.toThrow();
    });

    test("synchronizes state updates from orchestrator", async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);
      const stateUpdate: StateUpdate = {
        timestamp: Date.now(),
        sessionState: { activeMenu: "main" },
      };

      // Act & Assert - Should not throw
      await expect(vscodeAdapter.syncState(stateUpdate)).resolves.not.toThrow();
    });

    test("reports accurate adapter status", async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);

      // Act
      const status = vscodeAdapter.getStatus();

      // Assert
      expect(status).toMatchObject({
        active: expect.any(Boolean),
        orchestratorConnected: expect.any(Boolean),
        lastActivity: expect.any(Number),
      });
      expect(status.orchestratorConnected).toBe(true);
    });

    test("supports skin compatibility validation", async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);
      const compatibleSkin: UniversalSkinDefinition = {
        id: "compatible-skin",
        name: "Compatible Skin",
        version: "1.0.0",
        metadata: {
          id: "compatible-skin",
          name: "Compatible Skin",
          version: "1.0.0",
          backend: "haruspex",
          backendService: "haruspex-service",
          compatibleInterfaces: ["vscode", "cli"],
        },
        theme: {
          primary: "#007ACC",
          secondary: "#00AA44",
          accent: "#FF6600",
          success: "#00AA44",
          warning: "#FFAA00",
          error: "#FF4444",
          background: "#FFFFFF",
          foreground: "#000000",
        },
        pclCompatibility: {
          enabled: true,
          version: "1.0.0",
          reusePercentage: 75,
          inheritancePatterns: ["command-pattern"],
          optimizations: ["lazy-loading"],
          features: [],
        },
      };

      // Act
      const supports = vscodeAdapter.supportsSkin(compatibleSkin);

      // Assert
      expect(supports).toBe(true);
    });

    test("executes commands through orchestrator", async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);
      const command = "test-command";
      const args = ["arg1", "arg2"];

      // Act
      const result = await vscodeAdapter.executeCommand(command, args);

      // Assert
      expect(result).toMatchObject({
        success: true,
        message: expect.stringContaining(command),
        data: expect.objectContaining({
          command,
          sourceInterface: "vscode",
          args,
        }),
      });
    });
  });

  describe("CLI Interface Adapter Integration", () => {
    let cliAdapter: CLIInterfaceAdapter;

    beforeEach(() => {
      cliAdapter = new CLIInterfaceAdapter({
        enableInteractiveMode: false, // Disable for testing
        enableKeyboardShortcuts: false,
        enableColorOutput: false,
        enableProgressIndicators: false,
        clearScreenOnRender: false,
        maxHistorySize: 10,
      });
    });

    afterEach(async () => {
      if (cliAdapter) {
        await cliAdapter.dispose();
      }
    });

    test("initializes with orchestrator and registers interface", async () => {
      // Act
      await cliAdapter.initialize(mockOrchestrator);

      // Assert
      expect(mockOrchestrator.getRegisteredInterface("cli")).toBe(cliAdapter);
      expect(mockOrchestrator.getRegisteredInterfaceCount()).toBe(1);
    });

    test("returns correct interface type", () => {
      // Act
      const interfaceType = cliAdapter.getInterfaceType();

      // Assert
      expect(interfaceType).toBe("cli");
    });

    test("synchronizes state updates from orchestrator", async () => {
      // Arrange
      await cliAdapter.initialize(mockOrchestrator);
      const stateUpdate: StateUpdate = {
        timestamp: Date.now(),
        menuUpdates: {
          main: { refreshRequired: true },
        },
      };

      // Act & Assert - Should not throw
      await expect(cliAdapter.syncState(stateUpdate)).resolves.not.toThrow();
    });

    test("reports accurate adapter status", async () => {
      // Arrange
      await cliAdapter.initialize(mockOrchestrator);

      // Act
      const status = cliAdapter.getStatus();

      // Assert
      expect(status).toMatchObject({
        active: expect.any(Boolean),
        initialized: expect.any(Boolean),
        lastActivity: expect.any(Number),
      });
      expect(status.initialized).toBe(true);
    });

    test("applies skin through orchestrator integration", async () => {
      // Arrange
      await cliAdapter.initialize(mockOrchestrator);
      const mockSkin: UniversalSkinDefinition = {
        id: "cli-test-skin",
        name: "CLI Test Skin",
        version: "1.0.0",
        metadata: {
          id: "cli-test-skin",
          name: "CLI Test Skin",
          version: "1.0.0",
          backend: "pcl",
          backendService: "pcl-service",
          compatibleInterfaces: ["cli"],
        },
        theme: {
          primary: "#00FF00",
          secondary: "#FFFF00",
          accent: "#FF00FF",
          success: "#00FF00",
          warning: "#FFFF00",
          error: "#FF0000",
          background: "#000000",
          foreground: "#FFFFFF",
        },
        pclCompatibility: {
          enabled: true,
          version: "1.0.0",
          reusePercentage: 75,
          inheritancePatterns: ["command-pattern"],
          optimizations: ["lazy-loading"],
          features: [],
        },
      };

      // Act & Assert - Should not throw
      await expect(cliAdapter.applySkin(mockSkin)).resolves.not.toThrow();
    });
  });

  describe("Terminal UI Theme Integrity", () => {
    test("ensureThemeIntegrity falls back on invalid theme definitions", () => {
      const invalidTheme = {
        name: "Broken",
        primary: "not a function",
      } as unknown;

      const { theme, resetRequired, issues } =
        ensureThemeIntegrity(invalidTheme);

      expect(theme).toBe(DefaultColorThemes.default);
      expect(resetRequired).toBe(true);
      expect(issues).toContain("primary");
    });

    test("ensureThemeIntegrity preserves valid themes", () => {
      const { theme, resetRequired, issues } = ensureThemeIntegrity(
        DefaultColorThemes.dark,
      );

      expect(theme).toBe(DefaultColorThemes.dark);
      expect(resetRequired).toBe(false);
      expect(issues).toHaveLength(0);
    });
  });

  describe("CLI Window and Theme Baselines", () => {
    const captureResponsiveBaseline = (
      columns: number,
      themeKey: keyof typeof DefaultColorThemes,
    ) => {
      const restoreColumns = overrideStdoutColumns(columns);
      const initialResizeListeners = process.stdout.listenerCount("resize");
      try {
        const layout = new ResponsiveLayout({
          theme: DefaultColorThemes[themeKey],
        });

        const table = layout.createTable(
          [
            {
              Step: "Initialize orchestrator bridges",
              Window: "primary",
              Theme: "accented",
            },
            {
              Step: "Calibrate adaptive layout",
              Window: "secondary",
              Theme: "diagnostic",
            },
            {
              Step: "Persist baseline snapshot",
              Window: "summary",
              Theme: "baseline",
            },
          ],
          ["Step", "Window", "Theme"],
        );

        const sanitizedLines = table
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .map((line) => line.replace(ansiPattern, ""));

        const colorSegments = table.match(/\u001b\[[0-9;]*m/g) ?? [];

        return {
          columns,
          theme: themeKey,
          sanitizedPreview: sanitizedLines.slice(0, 6),
          colorSegments: colorSegments.length,
          tableWidth: sanitizedLines[0]?.length ?? 0,
          resizeListeners: {
            before: initialResizeListeners,
            after: process.stdout.listenerCount("resize"),
          },
        };
      } finally {
        process.stdout.removeAllListeners("resize");
        restoreColumns();
      }
    };

    test("captures default theme responsive baseline snapshot", () => {
      const baseline = captureResponsiveBaseline(88, "default");
      expect(baseline).toMatchInlineSnapshot(`
       {
         "colorSegments": 0,
         "columns": 88,
         "resizeListeners": {
           "after": 6,
           "before": 5,
         },
         "sanitizedPreview": [
           "┌─────────────────────────────────┬───────────┬────────────┐",
           "│                            Step │    Window │      Theme │",
           "├─────────────────────────────────┼───────────┼────────────┤",
           "│ Initialize orchestrator bridges │   primary │   accented │",
           "│       Calibrate adaptive layout │ secondary │ diagnostic │",
           "│       Persist baseline snapshot │   summary │   baseline │",
         ],
         "tableWidth": 60,
         "theme": "default",
       }
      `);
    });

    test("captures monochrome fallback baseline snapshot", () => {
      const baseline = captureResponsiveBaseline(88, "monochrome");
      expect(baseline).toMatchInlineSnapshot(`
       {
         "colorSegments": 0,
         "columns": 88,
         "resizeListeners": {
           "after": 1,
           "before": 0,
         },
         "sanitizedPreview": [
           "┌─────────────────────────────────┬───────────┬────────────┐",
           "│                            Step │    Window │      Theme │",
           "├─────────────────────────────────┼───────────┼────────────┤",
           "│ Initialize orchestrator bridges │   primary │   accented │",
           "│       Calibrate adaptive layout │ secondary │ diagnostic │",
           "│       Persist baseline snapshot │   summary │   baseline │",
         ],
         "tableWidth": 60,
         "theme": "monochrome",
       }
      `);
    });
  });

  describe("Command Interface Adapter Integration", () => {
    let commandAdapter: CommandInterfaceAdapter;

    beforeEach(() => {
      commandAdapter = new CommandInterfaceAdapter({
        enableBatchExecution: true,
        enableAsynchronousExecution: true,
        enableExecutionHistory: true,
        maxQueueSize: 100,
        maxHistorySize: 50,
        defaultTimeout: 30000,
        enableMetrics: true,
      });
    });

    afterEach(async () => {
      if (commandAdapter) {
        await commandAdapter.dispose();
      }
    });

    test("initializes with orchestrator and registers interface", async () => {
      // Act
      await commandAdapter.initialize(mockOrchestrator);

      // Assert
      expect(mockOrchestrator.getRegisteredInterface("command")).toBe(
        commandAdapter,
      );
      expect(mockOrchestrator.getRegisteredInterfaceCount()).toBe(1);
    });

    test("returns correct interface type", () => {
      // Act
      const interfaceType = commandAdapter.getInterfaceType();

      // Assert
      expect(interfaceType).toBe("command");
    });

    test("synchronizes state updates from orchestrator", async () => {
      // Arrange
      await commandAdapter.initialize(mockOrchestrator);
      const stateUpdate: StateUpdate = {
        timestamp: Date.now(),
        sessionState: { commandContext: "batch" },
      };

      // Act & Assert - Should not throw
      await expect(
        commandAdapter.syncState(stateUpdate),
      ).resolves.not.toThrow();
    });

    test("reports accurate adapter status with queue metrics", async () => {
      // Arrange
      await commandAdapter.initialize(mockOrchestrator);

      // Act
      const status = commandAdapter.getStatus();

      // Assert
      expect(status).toMatchObject({
        active: expect.any(Boolean),
        queueSize: expect.any(Number),
        healthy: expect.any(Boolean),
        lastActivity: expect.any(Number),
      });
      expect(status.queueSize).toBeGreaterThanOrEqual(0);
    });

    test("executes commands through orchestrator with proper context", async () => {
      // Arrange
      await commandAdapter.initialize(mockOrchestrator);
      const command = "batch-test-command";
      const args = ["--verbose", "--output=json"];

      // Act
      const result = await commandAdapter.executeCommand({
        type: "direct_command",
        command: command,
      } as any);

      // Assert
      expect(result).toMatchObject({
        success: true,
        data: expect.objectContaining({
          command,
          sourceInterface: "command",
        }),
      });
    });
  });

  describe("Cross-Interface Integration Scenarios", () => {
    let vscodeAdapter: VSCodeInterfaceAdapter;
    let cliAdapter: CLIInterfaceAdapter;
    let commandAdapter: CommandInterfaceAdapter;

    beforeEach(async () => {
      // Initialize all adapters
      vscodeAdapter = new VSCodeInterfaceAdapter(
        new MockVSCodeContext() as any,
      );
      cliAdapter = new CLIInterfaceAdapter({ enableInteractiveMode: false });
      commandAdapter = new CommandInterfaceAdapter({
        enableBatchExecution: true,
        maxQueueSize: 10,
      });

      // Initialize with orchestrator
      await vscodeAdapter.initialize(mockOrchestrator);
      await cliAdapter.initialize(mockOrchestrator);
      await commandAdapter.initialize(mockOrchestrator);
    });

    afterEach(async () => {
      await Promise.all([
        vscodeAdapter?.dispose(),
        cliAdapter?.dispose(),
        commandAdapter?.dispose(),
      ]);
    });

    test("multiple interface adapters register successfully", () => {
      // Assert
      expect(mockOrchestrator.getRegisteredInterfaceCount()).toBe(3);
      expect(mockOrchestrator.getRegisteredInterface("vscode")).toBe(
        vscodeAdapter,
      );
      expect(mockOrchestrator.getRegisteredInterface("cli")).toBe(cliAdapter);
      expect(mockOrchestrator.getRegisteredInterface("command")).toBe(
        commandAdapter,
      );
    });

    test("orchestrator reports all active interfaces in system status", () => {
      // Act
      const systemStatus = mockOrchestrator.getSystemStatus();

      // Assert
      expect(systemStatus.activeInterfaces).toContain("vscode");
      expect(systemStatus.activeInterfaces).toContain("cli");
      expect(systemStatus.activeInterfaces).toContain("command");
      expect(systemStatus.activeInterfaces).toHaveLength(3);
    });

    test("state synchronization broadcasts to all registered interfaces", async () => {
      // Arrange
      const stateUpdate: StateUpdate = {
        timestamp: Date.now(),
        globalState: { theme: "dark" },
        sessionState: { user: "test-user" },
      };

      // Act & Assert - All should handle state sync without throwing
      await expect(
        Promise.all([
          vscodeAdapter.syncState(stateUpdate),
          cliAdapter.syncState(stateUpdate),
          commandAdapter.syncState(stateUpdate),
        ]),
      ).resolves.not.toThrow();
    });

    test("interface switching maintains orchestrator connection", async () => {
      // Arrange - Simulate interface switching by getting status from each

      // Act
      const vscodeStatus = vscodeAdapter.getStatus();
      const cliStatus = cliAdapter.getStatus();
      const commandStatus = commandAdapter.getStatus();

      // Assert - All should maintain orchestrator connection
      expect(vscodeStatus.orchestratorConnected).toBe(true);
      expect(cliStatus.initialized).toBe(true);
      expect(commandStatus.active).toBe(true);
    });

    test("backend skin loading works across all interface types", async () => {
      // Act
      const backendSkin = await mockOrchestrator.loadBackendSkin("haruspex");

      // Assert
      expect(backendSkin).toBeTruthy();
      expect(backendSkin?.metadata.compatibleInterfaces).toEqual([
        "vscode",
        "cli",
        "command",
      ]);

      // Test skin application across interfaces
      await expect(
        Promise.all([
          vscodeAdapter.applySkin(backendSkin!),
          cliAdapter.applySkin(backendSkin!),
          commandAdapter.applySkin(backendSkin!),
        ]),
      ).resolves.not.toThrow();
    });
  });

  describe("Error Handling and Resilience", () => {
    test("adapter handles orchestrator initialization failure gracefully", async () => {
      // Arrange
      const uninitializedOrchestrator = new MockTemplumOrchestrator();
      const adapter = new VSCodeInterfaceAdapter(
        new MockVSCodeContext() as any,
      );

      // Act & Assert
      await expect(
        adapter.initialize(uninitializedOrchestrator),
      ).rejects.toThrow(
        "Cannot register interface on uninitialized orchestrator",
      );
    });

    test("adapter status reflects orchestrator connection state", async () => {
      // Arrange
      const adapter = new CLIInterfaceAdapter({ enableInteractiveMode: false });
      await adapter.initialize(mockOrchestrator);

      // Act - Shutdown orchestrator
      await mockOrchestrator.shutdown();
      const status = adapter.getStatus();

      // Assert - Status should reflect disconnected state
      expect(status.initialized).toBe(false);
    });

    test("interface adapters handle state sync errors appropriately", async () => {
      // Arrange
      const adapter = new CommandInterfaceAdapter();
      await adapter.initialize(mockOrchestrator);

      // Create invalid state update that might cause errors
      const invalidStateUpdate = null as any;

      // Act & Assert
      await expect(adapter.syncState(invalidStateUpdate)).rejects.toThrow();
    });

    test("CLI adapter logs schema validation failures from the skin engine", async () => {
      const adapter = new CLIInterfaceAdapter({ enableInteractiveMode: false });
      await adapter.initialize(mockOrchestrator);

      const validationError = createTemplumError(
        'Skin validation failed: metadata.backendService is required',
        'skin-validation-error',
        'validation'
      );

      const engineSpy = jest.spyOn(mockOrchestrator, 'getUniversalSkinEngine').mockReturnValue({
        renderForInterface: jest.fn().mockRejectedValue(validationError),
        generateSkinHTML: jest.fn()
      } as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await adapter.applySkin(JSON.parse(JSON.stringify(createTestPCLSkinDefinition())));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CLIInterfaceAdapter: Failed to apply skin: Skin validation failed')
      );

      consoleSpy.mockRestore();
      engineSpy.mockRestore();
    });

    test("VSCode adapter surfaces schema validation errors via logger", async () => {
      const adapter = new VSCodeInterfaceAdapter(new MockVSCodeContext() as any);
      await adapter.initialize(mockOrchestrator);

      const validationError = createTemplumError(
        'Skin validation failed: metadata.backendService is required',
        'skin-validation-error',
        'validation'
      );

      const engineSpy = jest.spyOn(mockOrchestrator, 'getUniversalSkinEngine').mockReturnValue({
        renderForInterface: jest.fn().mockRejectedValue(validationError),
        generateSkinHTML: jest.fn()
      } as any);

      const loggerErrorSpy = jest.spyOn((adapter as any).logger, 'error');

      (adapter as any).view = {
        webview: {
          postMessage: jest.fn().mockResolvedValue(true)
        }
      };

      await adapter.applySkin(JSON.parse(JSON.stringify(createTestPCLSkinDefinition())));

      expect(loggerErrorSpy).toHaveBeenCalled();
      const [, , metadata] = loggerErrorSpy.mock.calls[0];
      expect(metadata?.errorMessage).toContain('Skin validation failed');

      loggerErrorSpy.mockRestore();
      engineSpy.mockRestore();
    });
  });

  describe("Unified Session Manager Integration", () => {
    test("shares session state between CLI and VSCode adapters", async () => {
      const sessionManager = new TemplumUniversalSessionManager(
        {},
        undefined,
        createStubBackendRouter() as any,
      );
      const orchestrator = new MockTemplumOrchestrator({ sessionManager });
      await orchestrator.initialize();

      const cliAdapter = new CLIInterfaceAdapter({ enableInteractiveMode: false });
      await cliAdapter.initialize(orchestrator);

      const vscodeAdapter = new VSCodeInterfaceAdapter(createVSCodeContext());
      await vscodeAdapter.initialize(orchestrator);

      const cliSessionBridge = (cliAdapter as any).sessionManager;
      cliSessionBridge.navigateToMenu('settings', true);
      cliSessionBridge.addCommandToHistory('templum.test');
      cliSessionBridge.updatePreferences({ theme: 'light' });

      const snapshot = sessionManager.getSessionSnapshot();
      expect(snapshot?.currentMenu).toBe('settings');
      expect(snapshot?.navigationHistory).toContain('main');
      expect(snapshot?.commandHistory[0]).toBe('templum.test');
      expect(snapshot?.preferences.theme).toBe('light');

      await sessionManager.syncInterfaces('cli', 'vscode');

      const disconnectSpy = jest.fn();
      sessionManager.on('interfaceDisconnected', disconnectSpy);
      sessionManager.notifyInterfaceDisconnect('cli', 'integration-test');
      expect(disconnectSpy).toHaveBeenCalledWith(
        expect.objectContaining({ interfaceType: 'cli', reason: 'integration-test' })
      );

      await vscodeAdapter.dispose();
      await cliAdapter.dispose();
      await orchestrator.shutdown();
    });

    test("CLI adapter navigation bridges through shared session state", async () => {
      const sessionManager = new TemplumUniversalSessionManager(
        {},
        undefined,
        createStubBackendRouter() as any,
      );
      const orchestrator = new MockTemplumOrchestrator({ sessionManager });
      await orchestrator.initialize();

      const cliAdapter = new CLIInterfaceAdapter({ enableInteractiveMode: false });
      await cliAdapter.initialize(orchestrator);

      const bridge = (cliAdapter as any).sessionManager;
      bridge.navigateToMenu('main', false);
      bridge.navigateToMenu('settings', true);

      const navigationResult = await (cliAdapter as any).handleNavigation({
        type: 'navigation',
        value: 'back',
      });
      expect(navigationResult.handled).toBe(true);
      expect(sessionManager.getSessionSnapshot()?.currentMenu).toBe('main');

      await (cliAdapter as any).processLocalCommand('home');
      const snapshot = sessionManager.getSessionSnapshot();
      expect(snapshot?.currentMenu).toBe('main');
      expect(snapshot?.navigationHistory).toHaveLength(0);

      const disconnectSpy = jest.fn();
      sessionManager.on('interfaceDisconnected', disconnectSpy);
      await cliAdapter.dispose();
      expect(disconnectSpy).toHaveBeenCalledWith(
        expect.objectContaining({ interfaceType: 'cli', reason: 'cli-adapter-dispose' })
      );

      await orchestrator.shutdown();
    });
  });
});
