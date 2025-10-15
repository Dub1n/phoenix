/**---
 * title: [E2E Complete Workflows Test Suite - User Journey Validation]
 * tags: [E2E-Testing, Complete-Workflows, User-Journeys, Cross-Interface-Validation]
 * provides: [E2E Test Suite, Complete User Workflow Validation, Cross-Interface Scenario Testing]
 * requires: [E2E-Test-Framework, E2E-Scenarios, Mock-Orchestrator, Interface-Adapters]
 * description: [Comprehensive E2E test suite validating complete user workflows, cross-interface scenarios, and performance characteristics]
 * ---*/

import { EventEmitter } from 'events';
import { EventDrivenComponent } from '../../src/utils/event-bus-adapter';
import type { GenericEventMap } from '../../src/utils/event-utils';
import {
  E2ETestFramework,
  MockBackendService,
  E2ETestScenario,
  E2ETestOutcome
} from '../../src/testing/e2e-test-framework';
import { E2EScenarioLibrary } from '../../src/tests/e2e/e2e-scenarios';
import {
  CLIInterfaceAdapter
} from '../../src/interfaces/cli-adapter-abstracted';
import {
  InterfaceType,
  UniversalSkinDefinition,
  TemplumSystemStatus,
  CommandResult,
  CommandContext,
  InterfaceAdapter,
  createTemplumError
} from '../../src/types/templum-types';
import {
  ITemplumOrchestrator,
  IInterfaceAdapter
} from '../../src/interfaces/templum-orchestrator-interface';
import {
  ISkinEngine,
  IBackendServiceRouter,
  IResourceManager
} from '../../src/interfaces/core-component-interfaces';
import type { ResourceUsage } from '../../src/core/templum-resource-manager';
import type {
  TemplumSessionManagerContract,
  TemplumSessionState,
  SessionStateUpdate,
  TemplumSessionMetrics,
} from '../../src/session/universal-session-manager.types';
import {
  createFormatter
} from '../../src/utils/terminal-formatter';
import * as TerminalCompatibility from '../../src/interfaces/terminal-compatibility-detector';
import { UniversalSkinEngine } from '../../src/skin/universal-skin-engine';
import type {
  ManualOverrideDescriptor,
  ManualOverrideOptions,
  ManualOverrideSnapshot,
  ManualOverrideClearResult
} from '../../src/backend/manual-override-manager';
import type {
  SessionStateUpdate,
  TemplumSessionManagerContract,
  TemplumSessionMetrics,
  TemplumSessionState
} from '../../src/session/universal-session-manager.types';
import { sleep } from '../../src/utils/async-utils';

// Mock Orchestrator for E2E Testing
class MockE2EOrchestrator extends EventDrivenComponent<GenericEventMap> implements ITemplumOrchestrator {
  private readonly sessionManager: TemplumSessionManagerContract = new (class implements TemplumSessionManagerContract {
    private snapshot: TemplumSessionState = {
      sessionId: 'e2e-session',
      startTime: new Date(),
      activeInterface: 'cli',
      preferences: {},
      capabilities: [],
      activeBackends: [],
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
      } as TemplumSessionMetrics,
      lastActivity: new Date(),
      navigationHistory: [],
      commandHistory: [],
      interactionMode: 'menu',
      currentMenu: 'main',
    };

    async initialize(): Promise<void> {
      return Promise.resolve();
    }

    attachOrchestrator(): void {}

    async ensureSessionForInterface(): Promise<string> {
      return 'e2e-session';
    }

    getActiveSessionId(): string | null {
      return 'e2e-session';
    }

    getSessionSnapshot(): TemplumSessionState | null {
      return this.snapshot;
    }

    async updateSessionState(update: SessionStateUpdate): Promise<void> {
      this.snapshot = {
        ...this.snapshot,
        navigationHistory: update.state.navigationStack ?? this.snapshot.navigationHistory,
        currentMenu: update.state.currentMenu ?? this.snapshot.currentMenu,
        interactionMode: update.state.interactionMode ?? this.snapshot.interactionMode ?? 'menu',
        commandHistory: update.state.commandHistory ?? this.snapshot.commandHistory,
        lastActivity: new Date(),
      };
    }

    async registerInterfaceAdapter(): Promise<void> {
      return Promise.resolve();
    }

    async syncInterfaces(): Promise<void> {
      return Promise.resolve();
    }

    notifyInterfaceDisconnect(): void {}

    on(): void {}

    off(): void {}
  })();
  private initialized: boolean = false;
  private registeredInterfaces: Map<InterfaceType, IInterfaceAdapter> = new Map();
  private supportedInterfaces: InterfaceType[] = ['vscode', 'cli', 'command'];
  private backendServices: Map<string, any> = new Map();
  private manualOverrides = new Map<string, ManualOverrideDescriptor>();
  private loadedSkins: UniversalSkinDefinition[] = [];

  constructor() {
    super('mock-e2e-orchestrator', 120);
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    this.emit('orchestrator-initialized');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getSupportedInterfaces(): InterfaceType[] {
    return [...this.supportedInterfaces];
  }

  async registerInterface(interfaceType: InterfaceType, adapter: InterfaceAdapter): Promise<void> {
    if (!this.initialized) {
      throw createTemplumError('Orchestrator not initialized', 'ORCHESTRATOR_NOT_INITIALIZED', 'runtime');
    }
    
    this.registeredInterfaces.set(interfaceType, adapter as IInterfaceAdapter);
    this.emit('interface-registered', { interfaceType, adapter });
  }

  async loadSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    // Mock skin application with controlled delay for deterministic tests
    await sleep(150);
    this.emit('skin-applied', { skinId: skinDefinition.metadata.id });
  }

  async loadBackendSkin(backendId: string): Promise<UniversalSkinDefinition | null> {
    // TODO: [TASK-NEW-E2E-009] Mock backend skin loading
    // Priority: Medium | Complexity: 4
    // Dependencies: Backend service skin definitions
    // Implementation: Mock backend skin loading with realistic skin structure
    return null;
  }

  async executeCommand(
    command: string,
    sourceInterface: InterfaceType,
    args?: any[],
    context?: CommandContext
  ): Promise<CommandResult> {
    // Mock command execution with deterministic processing time to stabilize tests
    const executionTime = 120;
    await sleep(executionTime);
    
    return {
      success: true,
      data: `Mock execution of ${command}`,
      message: `Command ${command} executed from ${sourceInterface}`,
      timestamp: Date.now(),
      executionTime,
      metadata: {
        sourceInterface,
        args: args || [],
        context: context || {}
      }
    };
  }

  getSystemStatus(): TemplumSystemStatus {
    // TODO: [TASK-NEW-E2E-010] Mock system status implementation  
    // Priority: Medium | Complexity: 5
    // Dependencies: TemplumSystemStatus interface alignment
    // Implementation: Mock system status with realistic component status
    return {
      health: 'healthy',
      activeBackends: Array.from(this.backendServices.keys()),
      activeInterfaces: Array.from(this.registeredInterfaces.keys()),
      coreEngine: { 
        initialized: true, 
        activeInterfaces: Array.from(this.registeredInterfaces.keys()),
        loadedSkins: ['default-skin'],
        backendConnections: { 
          totalConnections: this.backendServices.size,
          healthyConnections: this.backendServices.size,
          backends: Array.from(this.backendServices.keys()).map(key => ({
            id: key,
            name: key,
            type: 'mock',
            status: 'connected'
          })) as any
        }
      },
      stateManager: { 
        synchronized: true,
        globalState: { 
          lastModified: Date.now(),
          backendStates: Array.from(this.backendServices.keys())
        },
        sessionState: { lastUpdate: Date.now(), activeSession: true } as any,
        subscribers: 1,
        historySize: 10,
        persistence: null
      },
      skinEngine: { 
        cachedSkins: 1,
        renderers: {
          vscode: {},
          cli: {},
          command: {}
        },
        performance: { averageRenderTime: 100, cacheHitRate: 80 }
      },
      performance: { 
        memory: {
          heapUsed: process.memoryUsage().heapUsed,
          rss: process.memoryUsage().rss
        },
        cpu: { user: 5, system: 5 },
        interfaces: {
          vscode: { responseTime: 50, lastActivity: Date.now() },
          cli: { responseTime: 30, lastActivity: Date.now() }
        }
      }
    };
  }

  getLoadedSkins(): UniversalSkinDefinition[] {
    return this.loadedSkins;
  }

  async refreshBackendServices(): Promise<void> {
    // Mock backend service refresh
    await sleep(200);
    this.emit('backend-services-refreshed');
  }

  getUniversalSkinEngine(): ISkinEngine {
    // TODO: [TASK-NEW-E2E-011] Mock skin engine implementation
    // Priority: Low | Complexity: 6
    // Dependencies: ISkinEngine interface, mock skin operations
    // Implementation: Mock skin engine for E2E testing scenarios
    return {} as ISkinEngine;
  }

  getBackendRouter(): IBackendServiceRouter {
    // TODO: [TASK-NEW-E2E-012] Mock backend router implementation
    // Priority: Low | Complexity: 6
    // Dependencies: IBackendServiceRouter interface, mock service routing
    // Implementation: Mock backend router for E2E testing scenarios
    return {} as IBackendServiceRouter;
  }

  getResourceManager(): IResourceManager {
    // TODO: [TASK-NEW-E2E-013] Mock resource manager implementation
    // Priority: Low | Complexity: 5
    // Dependencies: IResourceManager interface, mock resource monitoring
    // Implementation: Mock resource manager for E2E testing scenarios
    return {} as IResourceManager;
  }

  getSessionManager(): TemplumSessionManagerContract {
    return this.sessionManager;
  }

  async applyManualOverride(
    serviceId: string,
    options: ManualOverrideOptions = {}
  ): Promise<ManualOverrideDescriptor> {
    const descriptor: ManualOverrideDescriptor = {
      serviceId,
      scope: options.scope ?? 'session',
      appliedAt: Date.now(),
      expiresAt: options.expiresAt,
      reason: options.reason
    };
    this.manualOverrides.set(serviceId, descriptor);
    return descriptor;
  }

  async clearManualOverride(serviceId?: string): Promise<ManualOverrideClearResult> {
    if (serviceId) {
      const descriptor = this.manualOverrides.get(serviceId);
      this.manualOverrides.delete(serviceId);
      return {
        descriptor: descriptor ?? {
          serviceId,
          scope: 'session',
          appliedAt: Date.now()
        },
        snapshot: this.getManualOverrideSnapshot()
      };
    }

    this.manualOverrides.clear();
    return {
      descriptor: undefined,
      snapshot: this.getManualOverrideSnapshot()
    };
  }

  getManualOverrideSnapshot(): ManualOverrideSnapshot {
    return {
      overrides: Array.from(this.manualOverrides.values()),
      updatedAt: Date.now()
    };
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
    this.emit('orchestrator-shutdown');
  }

  // Additional mock methods for E2E testing
  async registerBackendService(name: string, service: any): Promise<void> {
    this.backendServices.set(name, service);
    this.emit('backend-registered', { name, service });
  }

  getRegisteredInterfaces(): Map<InterfaceType, IInterfaceAdapter> {
    return new Map(this.registeredInterfaces);
  }
}

const createCLIMetadataSkin = (): UniversalSkinDefinition => ({
  id: 'cli-metadata-skin',
  name: 'CLI Metadata Skin',
  version: '1.0.0',
  metadata: {
    id: 'cli-metadata-skin',
    name: 'CLI Metadata Skin',
    version: '1.0.0',
    backend: 'pcl',
    backendService: 'pcl',
    compatibleInterfaces: ['cli'],
  },
  menus: {
    main: {
      id: 'main-menu',
      title: 'Metadata Main',
      items: [
        {
          id: 'analyze',
          label: 'Analyze Project',
          command: 'haruspex.analyze',
          shortcuts: ['Ctrl+Shift+A'],
        },
        {
          id: 'settings',
          label: 'Open Settings',
          command: 'templum.openSettings',
          shortcut: 'Ctrl+,',
        },
      ],
    },
  },
  commands: {
    primary: [
      {
        id: 'haruspex.analyze',
        title: 'Analyze Project',
        description: 'Run analysis on the active workspace.',
        handler: 'haruspex.analysis.start',
        parameters: [],
      },
      {
        id: 'templum.openSettings',
        title: 'Open Settings',
        description: 'Open settings menu.',
        handler: 'templum.settings.open',
        parameters: [],
      },
    ],
  },
  shortcuts: {
    'Ctrl+Alt+M': 'templum.openSettings',
  },
});

class ProceduralWindowSessionManager extends EventEmitter implements TemplumSessionManagerContract {
  private readonly sessionId = 'cli-session';
  private snapshot: TemplumSessionState;

  constructor() {
    super();
    const now = new Date();
    this.snapshot = {
      sessionId: this.sessionId,
      startTime: now,
      activeInterface: 'cli',
      preferences: {},
      capabilities: [],
      activeBackends: [],
      loadedSkins: [],
      interfaceHistory: ['cli'],
      sessionMetrics: this.createMetrics(),
      lastActivity: now,
      navigationHistory: ['main-menu'],
      currentMenu: 'main-menu',
      interactionMode: 'menu',
      commandHistory: [],
    };
  }

  private createMetrics(): TemplumSessionMetrics {
    return {
      interfaceSwitches: 0,
      backendInteractions: 0,
      commandsExecuted: 0,
      sessionsCreated: 1,
      totalSkinLoads: 0,
      averageSwitchTime: 0,
      completion: {
        completed: false,
        completionReason: undefined,
        completedAt: undefined,
        finalMetrics: undefined,
      },
    };
  }

  async initialize(): Promise<void> {
    return;
  }

  attachOrchestrator(): void {
    // No-op for procedural CLI harness
  }

  async ensureSessionForInterface(interfaceType: InterfaceType): Promise<string> {
    this.snapshot.activeInterface = interfaceType;
    return this.sessionId;
  }

  getActiveSessionId(): string | null {
    return this.sessionId;
  }

  getSessionSnapshot(): TemplumSessionState | null {
    return this.snapshot;
  }

  async updateSessionState(update: SessionStateUpdate): Promise<void> {
    const { state } = update;
    if (state.currentMenu) {
      this.snapshot.currentMenu = state.currentMenu;
    }
    if (state.navigationStack) {
      this.snapshot.navigationHistory = [...state.navigationStack];
    }
    if (state.commandHistory) {
      this.snapshot.commandHistory = [...state.commandHistory];
    }
    this.snapshot.lastActivity = new Date();
  }

  async registerInterfaceAdapter(): Promise<void> {
    return;
  }

  async syncInterfaces(): Promise<void> {
    return;
  }

  notifyInterfaceDisconnect(): void {
    // No-op for procedural CLI harness
  }
}

class ProceduralWindowOrchestrator implements ITemplumOrchestrator {
  private readonly sessionManager: TemplumSessionManagerContract;
  private readonly skinEngine: UniversalSkinEngine;
  private readonly registeredAdapters = new Map<InterfaceType, IInterfaceAdapter>();
  private readonly loadedSkins: UniversalSkinDefinition[] = [];
  private readonly backendSkins = new Map<string, UniversalSkinDefinition>();
  private readonly manualOverrides = new Map<string, ManualOverrideDescriptor>();

  constructor(sessionManager: TemplumSessionManagerContract) {
    this.sessionManager = sessionManager;
    this.skinEngine = new UniversalSkinEngine();
  }

  isInitialized(): boolean {
    return true;
  }

  getSupportedInterfaces(): InterfaceType[] {
    return ['vscode', 'cli', 'command'];
  }

  async registerInterface(interfaceType: InterfaceType, adapter: InterfaceAdapter): Promise<void> {
    this.registeredAdapters.set(interfaceType, adapter as IInterfaceAdapter);
  }

  async loadSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    this.loadedSkins.push(skinDefinition);
    for (const adapter of this.registeredAdapters.values()) {
      if (typeof adapter.supportsSkin === 'function' && adapter.supportsSkin(skinDefinition)) {
        await adapter.applySkin(skinDefinition);
      }
    }
  }

  async loadBackendSkin(backendId: string): Promise<UniversalSkinDefinition | null> {
    return this.backendSkins.get(backendId) ?? null;
  }

  async executeCommand(
    command: string,
    sourceInterface: InterfaceType,
    args?: any[],
    context?: CommandContext
  ): Promise<CommandResult> {
    return {
      success: true,
      message: `Executed ${command}`,
      data: { sourceInterface, args, context },
      timestamp: Date.now(),
      executionTime: 0,
      metadata: { sourceInterface },
    };
  }

  getSystemStatus(): TemplumSystemStatus {
    const backendEntries = Array.from(this.backendSkins.keys()).reduce<Record<string, any>>((acc, id) => {
      acc[id] = {
        id,
        name: id,
        type: 'mock',
        status: 'connected',
        connected: true,
        health: 'healthy',
        responseTime: 15,
      };
      return acc;
    }, {});

    return {
      health: 'healthy',
      activeBackends: Array.from(this.backendSkins.keys()),
      activeInterfaces: Array.from(this.registeredAdapters.keys()),
      coreEngine: {
        initialized: true,
        activeInterfaces: Array.from(this.registeredAdapters.keys()),
        loadedSkins: this.loadedSkins.map((skin) => skin.id),
        backendConnections: {
          totalConnections: this.backendSkins.size,
          healthyConnections: this.backendSkins.size,
          backends: backendEntries,
        },
      },
      stateManager: {
        synchronized: true,
        globalState: {},
        sessionState: {},
        subscribers: this.registeredAdapters.size,
        historySize: 0,
        persistence: null,
      },
      skinEngine: {
        cachedSkins: this.loadedSkins.length,
        renderers: {},
        performance: { averageRenderTime: 0, cacheHitRate: 1 },
      },
      performance: {
        memory: { heapUsed: 0, rss: 0 },
        cpu: { user: 0, system: 0 },
        interfaces: {},
      },
    };
  }

  getLoadedSkins(): UniversalSkinDefinition[] {
    return [...this.loadedSkins];
  }

  async refreshBackendServices(): Promise<void> {
    return;
  }

  getUniversalSkinEngine(): ISkinEngine {
    return this.skinEngine;
  }

  getBackendRouter(): IBackendServiceRouter {
    const getConnectionStatus = () => ({
      totalConnections: this.backendSkins.size,
      healthyConnections: this.backendSkins.size,
      backends: Array.from(this.backendSkins.keys()).reduce<Record<string, unknown>>((acc, id) => {
        acc[id] = { id, status: 'connected', health: 'healthy' };
        return acc;
      }, {}),
    });

    return {
      discoverAndConnect: async () => undefined,
      loadBackendSkin: (backendId: string) => this.loadBackendSkin(backendId),
      getConnectionStatus,
      applyManualOverride: async (serviceId: string, options: ManualOverrideOptions = {}) =>
        this.applyManualOverride(serviceId, options),
      clearManualOverride: async (serviceId?: string) => this.clearManualOverride(serviceId),
      getManualOverrideSnapshot: () => this.getManualOverrideSnapshot(),
    } as IBackendServiceRouter;
  }

  getResourceManager(): IResourceManager {
    const emptyUsage: ResourceUsage = {
      memory: { used: 0, allocated: 0, limit: 0, percentage: 0 },
      connections: { active: 0, allocated: 0, limit: 0, percentage: 0 },
      cache: { used: 0, limit: 0, hitRate: 0, entries: 0 },
      fileHandles: { open: 0, limit: 0, percentage: 0 },
      processes: { active: 0, limit: 0, percentage: 0 },
    };

    return {
      initialize: async () => undefined,
      allocateResource: async () => 'resource',
      deallocateResource: async () => undefined,
      updateResourceAccess: () => undefined,
      getResourceUsage: () => emptyUsage,
      registerService: async () => undefined,
      updateServiceHealth: async () => undefined,
      getServiceHealth: () => [],
      getStatus: () => ({
        initialized: true,
        resourceUsage: emptyUsage,
        activeResources: 0,
        serviceHealth: [],
        policyViolations: 0,
        lastCleanup: Date.now(),
        nextCleanup: Date.now(),
      }),
      updateResourcePolicy: () => undefined,
      shutdown: async () => undefined,
    } as IResourceManager;
  }

  getSessionManager(): TemplumSessionManagerContract {
    return this.sessionManager;
  }

  async applyManualOverride(serviceId: string, options: ManualOverrideOptions = {}): Promise<ManualOverrideDescriptor> {
    const descriptor: ManualOverrideDescriptor = {
      serviceId,
      scope: options.scope ?? 'session',
      appliedAt: Date.now(),
      expiresAt: options.expiresAt,
      reason: options.reason,
    };
    this.manualOverrides.set(serviceId, descriptor);
    return descriptor;
  }

  async clearManualOverride(serviceId?: string): Promise<ManualOverrideClearResult> {
    if (!serviceId) {
      this.manualOverrides.clear();
      return {
        descriptor: undefined,
        snapshot: this.getManualOverrideSnapshot(),
      };
    }

    const descriptor = this.manualOverrides.get(serviceId);
    this.manualOverrides.delete(serviceId);

    return {
      descriptor: descriptor ?? {
        serviceId,
        scope: 'session',
        appliedAt: Date.now(),
      },
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
    return;
  }

  addBackendSkin(backendId: string, skinDefinition: UniversalSkinDefinition): void {
    this.backendSkins.set(backendId, skinDefinition);
  }
}

// E2E Test Suite
describe('E2E Complete Workflows Test Suite', () => {
  let e2eFramework: E2ETestFramework;
  let mockOrchestrator: MockE2EOrchestrator;
  let testScenarios: E2ETestScenario[];

  beforeAll(async () => {
    // Initialize E2E testing environment
    mockOrchestrator = new MockE2EOrchestrator();
    e2eFramework = new E2ETestFramework(mockOrchestrator);
    testScenarios = E2EScenarioLibrary.getAllScenarios();

    // Setup E2E environment with mock services
    await e2eFramework.setupE2EEnvironment();
    await mockOrchestrator.initialize();
  }, 30000);

  afterAll(async () => {
    // Cleanup E2E environment
    await e2eFramework.teardownE2EEnvironment();
  }, 15000);

  describe('Complete User Workflow Scenarios', () => {
    test('VSCode Extension Startup and Basic Interaction', async () => {
      const scenario = testScenarios.find(s => s.id === 'workflow-vscode-startup');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      // Validate workflow completion
      expect(outcome.success).toBe(true);
      expect(outcome.errors).toHaveLength(0);
      expect(outcome.actualDuration).toBeLessThan(scenario!.timeoutMs);

      // Validate performance characteristics  
      expect(outcome.performanceMetrics.totalExecutionTime).toBeLessThan(30000);
      expect(outcome.performanceMetrics.averageStepTime).toBeLessThan(3000);

      // Validate all steps passed validation
      const passedValidations = outcome.validationResults.filter(v => v.passed);
      expect(passedValidations.length).toBeGreaterThan(0);

      // Validate specific workflow outcomes
      expect(outcome.validationResults).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stepId: expect.stringMatching(/step-vscode-init|step-backend-discovery/),
            passed: true
          })
        ])
      );
    }, 35000);

    test('CLI Session Management and Commands', async () => {
      const scenario = testScenarios.find(s => s.id === 'workflow-cli-session');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      expect(outcome.success).toBe(true);
      expect(outcome.errors).toHaveLength(0);
      expect(outcome.actualDuration).toBeLessThan(scenario!.timeoutMs);

      // Validate CLI-specific performance characteristics
      expect(outcome.performanceMetrics.averageStepTime).toBeLessThan(2000);
      
      // Validate CLI interaction succeeded
      const cliSteps = outcome.validationResults.filter(v => 
        v.stepId.includes('cli') && v.passed
      );
      expect(cliSteps.length).toBeGreaterThan(0);
    }, 30000);

    test('Skin Customization and Application Process', async () => {
      const scenario = testScenarios.find(s => s.id === 'workflow-skin-customization');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      expect(outcome.success).toBe(true);
      expect(outcome.errors).toHaveLength(0);

      // Validate skin application performance
      expect(outcome.performanceMetrics.skinApplicationTime).toBeLessThan(8000);
      
      // Validate customization workflow steps
      const skinSteps = outcome.validationResults.filter(v => 
        v.stepId.includes('skin') || v.stepId.includes('customize')
      );
      expect(skinSteps.every(step => step.passed)).toBe(true);
    }, 40000);

    test('Multi-Interface Coordination Workflow', async () => {
      const scenario = testScenarios.find(s => s.id === 'workflow-multi-interface');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      expect(outcome.success).toBe(true);
      expect(outcome.errors).toHaveLength(0);

      // Validate multi-interface coordination
      expect(outcome.performanceMetrics.stateSyncTime).toBeLessThan(5000);
      
      // Validate state synchronization worked
      const syncSteps = outcome.validationResults.filter(v => 
        v.stepId.includes('sync') || v.stepId.includes('propagation')
      );
      expect(syncSteps.every(step => step.passed)).toBe(true);
    }, 45000);
  });

  describe('Cross-Interface Validation Scenarios', () => {
    test('Interface Switching and State Preservation', async () => {
      const scenario = testScenarios.find(s => s.id === 'cross-interface-switching');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      expect(outcome.success).toBe(true);
      expect(outcome.errors).toHaveLength(0);

      // Validate interface switching performance
      expect(outcome.performanceMetrics.interfaceSwitchTime).toBeLessThan(3000);
      
      // Validate state preservation across switch
      const preservationSteps = outcome.validationResults.filter(v => 
        v.stepId.includes('switch') || v.stepId.includes('verify')
      );
      expect(preservationSteps.every(step => step.passed)).toBe(true);
    }, 25000);

    test('Cross-Interface State Synchronization', async () => {
      const scenario = testScenarios.find(s => s.id === 'cross-interface-state-sync');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      expect(outcome.success).toBe(true);
      expect(outcome.errors).toHaveLength(0);

      // Validate state synchronization consistency
      const consistencyValidations = outcome.validationResults.filter(v => 
        v.stepId.includes('consistency') || v.stepId.includes('concurrent')
      );
      expect(consistencyValidations.every(step => step.passed)).toBe(true);
    }, 20000);

    test('Concurrent Interface Operations', async () => {
      const scenario = testScenarios.find(s => s.id === 'cross-interface-concurrent');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      expect(outcome.success).toBe(true);
      expect(outcome.errors).toHaveLength(0);

      // Validate concurrent operation handling
      expect(outcome.performanceMetrics.totalExecutionTime).toBeLessThan(scenario!.timeoutMs);
      
      // Validate resource management under load
      const resourceSteps = outcome.validationResults.filter(v => 
        v.stepId.includes('concurrent') || v.stepId.includes('resource')
      );
      expect(resourceSteps.every(step => step.passed)).toBe(true);
    }, 30000);
  });

  describe('Performance Validation Scenarios', () => {
    test('Performance Baseline Establishment', async () => {
      const scenario = testScenarios.find(s => s.id === 'performance-baseline');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      expect(outcome.success).toBe(true);
      expect(outcome.errors).toHaveLength(0);

      // Validate performance baselines were established
      const performanceSteps = outcome.validationResults.filter(v => 
        v.stepId.includes('measure') || v.stepId.includes('startup')
      );
      expect(performanceSteps.every(step => step.passed)).toBe(true);

      // Validate performance meets expectations
      expect(outcome.performanceMetrics.totalExecutionTime).toBeLessThan(scenario!.timeoutMs * 0.8);
    }, 35000);

    test('System Stress Testing', async () => {
      const scenario = testScenarios.find(s => s.id === 'performance-stress-test');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      // Note: Stress tests may have controlled failures
      expect(outcome.errors.length).toBeLessThan(3); // Allow some stress-induced errors
      
      // Validate system maintained basic functionality under stress
      const criticalSteps = outcome.validationResults.filter(v => 
        v.stepId.includes('high-frequency') && v.passed
      );
      expect(criticalSteps.length).toBeGreaterThan(0);

      // Validate performance degradation stayed within limits
      expect(outcome.performanceMetrics.totalExecutionTime).toBeLessThan(scenario!.timeoutMs);
    }, 65000);

    test('Memory Leak Detection and Prevention', async () => {
      const scenario = testScenarios.find(s => s.id === 'performance-memory-leak');
      expect(scenario).toBeDefined();

      const outcome = await e2eFramework.runScenario(scenario!);
      
      expect(outcome.success).toBe(true);
      expect(outcome.errors).toHaveLength(0);

      // Validate memory leak detection worked
      const memorySteps = outcome.validationResults.filter(v => 
        v.stepId.includes('memory') || v.stepId.includes('cleanup')
      );
      expect(memorySteps.every(step => step.passed)).toBe(true);

      // Validate extended operation completed successfully
      expect(outcome.performanceMetrics.totalExecutionTime).toBeLessThan(scenario!.timeoutMs * 0.9);
    }, 130000);
  });

  describe('CLI Procedural Windows', () => {
    test('renders bordered windows from skin descriptors without fallback scaffolds', async () => {
      const sessionManager = new ProceduralWindowSessionManager();
      const orchestrator = new ProceduralWindowOrchestrator(sessionManager);

      const formatterCapabilities = {
        supportsColor: false,
        supports256Colors: false,
        supportsTrueColor: false,
        supportsStyles: false,
        supportsUnicode: true,
        width: 80,
        height: 24,
        isInteractive: false,
        platform: 'unix' as const,
      };
      const formatter = createFormatter({}, formatterCapabilities);

      const cliAdapter = new CLIInterfaceAdapter({
        formatter,
        formatterCapabilities,
        enableInteractiveMode: false,
        enableKeyboardShortcuts: false,
        enableProgressIndicators: false,
        clearScreenOnRender: false,
      });

      const compatibility: TerminalCompatibility.TerminalCapabilities = {
        supportsBoxDrawing: true,
        supportsUnicode: true,
        supportsColors: false,
        supportsAnsi: true,
        colorDepth: 1,
        width: 80,
        height: 24,
        terminalType: 'jest',
        platform: 'test',
      };

      const detectSpy = jest
        .spyOn(TerminalCompatibility.TerminalCompatibilityDetector.prototype, 'detectCapabilities')
        .mockResolvedValue(compatibility);
      const capabilitiesSpy = jest
        .spyOn(TerminalCompatibility, 'getTerminalCapabilities')
        .mockResolvedValue(compatibility);

      const writeSpy = jest
        .spyOn(process.stdout, 'write')
        .mockImplementation(((chunk: string | Uint8Array) => true) as any);

      const skinDefinition: UniversalSkinDefinition = {
        id: 'cli-procedural-skin',
        name: 'CLI Procedural Skin',
        version: '1.0.0',
        metadata: {
          id: 'cli-procedural-skin',
          name: 'CLI Procedural Skin',
          version: '1.0.0',
          backend: 'haruspex',
          backendService: 'haruspex',
          compatibleInterfaces: ['cli'],
          supportedInterfaces: ['cli'],
          targetInterfaces: ['cli'],
        },
        menus: {
          main: {
            id: 'main-menu',
            title: 'Root Operations',
            items: [
              { id: 'launch', label: 'Launch Workspace', type: 'command', command: 'workspace:launch' },
              { id: 'inspect', label: 'Inspect Assets', type: 'submenu', submenu: 'inspect-menu' },
            ],
          },
          submenus: {
            'inspect-menu': {
              id: 'inspect-menu',
              title: 'Inspect Assets',
              items: [
                { id: 'open', label: 'Open Asset', type: 'command', command: 'assets:open' },
              ],
              navigation: { canGoBack: true },
            },
          },
        },
        views: {
          panels: [{ id: 'overview', name: 'Overview', type: 'webview' }],
        },
      };

      orchestrator.addBackendSkin('mock-backend', skinDefinition);

      await cliAdapter.initialize(orchestrator);

      try {
        await orchestrator.loadSkin(skinDefinition);

        const renderOutput = writeSpy.mock.calls
          .map((args) => {
            const [chunk, encoding] = args;
            if (typeof chunk === 'string') {
              return chunk;
            }
            if (chunk instanceof Buffer) {
              return chunk.toString((encoding as BufferEncoding | undefined) ?? 'utf8');
            }
            return '';
          })
          .join('');

        expect(renderOutput).toContain('Root Operations');
        expect(renderOutput).toContain('1. Launch Workspace');
        expect(renderOutput).toContain('Inspect Assets');
        expect(renderOutput).toMatch(/┌/);
        expect(renderOutput).not.toContain('Templum Universal Interface - CLI Mode');
        expect(cliAdapter.getActiveMenuId()).toBe('main-menu');
      } finally {
        await cliAdapter.dispose();
        writeSpy.mockRestore();
        detectSpy.mockRestore();
        capabilitiesSpy.mockRestore();
      }
    });
  });

  describe('E2E Test Framework Validation', () => {
    test('Framework Setup and Teardown', async () => {
      // Test framework lifecycle management
      const frameworkStatus = await e2eFramework.getTestResults();
      expect(frameworkStatus.size).toBeGreaterThan(0);

      // Test report generation
      const report = e2eFramework.generateTestReport();
      expect(report.reportId).toBeDefined();
      expect(report.totalScenarios).toBeGreaterThan(0);
      expect(report.generatedAt).toBeLessThanOrEqual(Date.now());
    });

    test('Mock Backend Service Integration', async () => {
      // Validate mock backend services are operational
      const systemStatus = mockOrchestrator.getSystemStatus();
      expect(systemStatus.health).toBe('healthy');
      expect(systemStatus.activeInterfaces).toBeDefined();
      
      // Test mock service response times
      const startTime = Date.now();
      await mockOrchestrator.executeCommand('test-command', 'vscode');
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });

    test('Cross-Scenario Performance Consistency', async () => {
      // Run multiple scenarios and validate performance consistency
      const userWorkflowScenarios = E2EScenarioLibrary.getUserWorkflowScenarios();
      const outcomes = [];

      for (const scenario of userWorkflowScenarios.slice(0, 2)) { // Test first 2 scenarios
        const outcome = await e2eFramework.runScenario(scenario);
        outcomes.push(outcome);
      }

      // Validate consistent performance characteristics
      const executionTimes = outcomes.map(o => o.actualDuration);
      const averageTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
      
      // Validate execution times are within reasonable variance
      const tolerance = 0.8; // Allow up to 80% deviation to accommodate scenario complexity
      const variance = executionTimes.every(time => 
        Math.abs(time - averageTime) / averageTime < tolerance
      );
      expect(variance).toBe(true);
    }, 90000);
  });
});

describe('CLI metadata-driven generator integration', () => {
  test('hydrates keyboard shortcuts directly from skin metadata', async () => {
    const orchestrator = new MockE2EOrchestrator();
    await orchestrator.initialize();

    const cliAdapter = new CLIInterfaceAdapter({ enableKeyboardShortcuts: true });
    await cliAdapter.initialize(orchestrator as unknown as ITemplumOrchestrator);

    const skin = createCLIMetadataSkin();
    await cliAdapter.applySkin(skin);

    const model = cliAdapter.getGeneratedMenuModel();
    expect(model).not.toBeNull();
    expect(model?.commandBindings.find((binding) => binding.commandId === 'haruspex.analyze')).toBeDefined();

    const shortcuts = (cliAdapter as unknown as { keyboardShortcuts: Map<string, string> }).keyboardShortcuts;
    expect(shortcuts.get('Ctrl+Shift+A')).toBe('haruspex.analyze');
    expect(shortcuts.get('Ctrl+,')).toBe('templum.openSettings');
  });
});

// Integration with existing testing patterns
describe('E2E Integration with Existing Test Infrastructure', () => {
  test('E2E Framework integrates with Jest test environment', () => {
    expect(E2ETestFramework).toBeDefined();
    expect(E2EScenarioLibrary).toBeDefined();
    expect(MockBackendService).toBeDefined();
  });

  test('E2E scenarios use existing interface adapter patterns', () => {
    const scenarios = E2EScenarioLibrary.getAllScenarios();
    const interfaceTypes = scenarios.flatMap(s => 
      s.steps.map(step => step.interface)
    ).filter(i => i !== 'system');
    
    // Validate all interface types are supported
    const supportedInterfaces = ['vscode', 'cli', 'command'];
    const unsupportedInterfaces = interfaceTypes.filter(i => 
      !supportedInterfaces.includes(i as string)
    );
    expect(unsupportedInterfaces).toHaveLength(0);
  });

  test('E2E framework uses existing error handling patterns', () => {
    const mockOrchestrator = new MockE2EOrchestrator();
    
    // Validate error handling follows existing patterns
    expect(async () => {
      await mockOrchestrator.registerInterface('vscode', {} as any);
    }).rejects.toThrow('Orchestrator not initialized');
  });
});
