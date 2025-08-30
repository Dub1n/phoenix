/**---
 * title: [Interface Adapter Integration Tests - Comprehensive Test Suite]
 * tags: [Testing, Integration, Interface, Adapter, TDD]
 * provides: [Interface Adapter Integration Tests, Orchestrator Integration Validation]
 * requires: [Jest, Interface Adapters, TemplumCore, Mock Orchestrator]
 * description: [Comprehensive integration tests for VSCode, CLI, and Command interface adapters with orchestrator interaction validation]
 * ---*/

import { EventEmitter } from 'events';
import { 
  InterfaceType, 
  UniversalSkinDefinition, 
  StateUpdate, 
  InterfaceAdapterStatus,
  createTemplumError
} from '../../src/types/templum-types';
import { 
  ITemplumOrchestrator,
  IInterfaceAdapter 
} from '../../src/interfaces/templum-orchestrator-interface';
import { VSCodeInterfaceAdapter } from '../../src/interfaces/vscode-adapter-abstracted';
import { CLIInterfaceAdapter } from '../../src/interfaces/cli-adapter-abstracted';
import { CommandInterfaceAdapter } from '../../src/interfaces/command-adapter-abstracted';

/**
 * Mock Orchestrator for Testing Interface Adapter Integration
 * 
 * This provides a controlled orchestrator implementation for testing
 * interface adapter behavior without full system dependencies.
 */
class MockTemplumOrchestrator extends EventEmitter implements ITemplumOrchestrator {
  private initialized: boolean = false;
  private registeredInterfaces: Map<InterfaceType, IInterfaceAdapter> = new Map();
  private supportedInterfaces: InterfaceType[] = ['vscode', 'cli', 'command'];

  async initialize(): Promise<void> {
    this.initialized = true;
    this.emit('initialized');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getSupportedInterfaces(): InterfaceType[] {
    return [...this.supportedInterfaces];
  }

  async registerInterface(interfaceType: InterfaceType, adapter: any): Promise<void> {
    if (!this.initialized) {
      throw createTemplumError('Cannot register interface on uninitialized orchestrator', 'SERVICE_NOT_READY', 'configuration');
    }
    this.registeredInterfaces.set(interfaceType, adapter);
    this.emit('interface-registered', { interfaceType, adapter });
  }

  async loadSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    this.emit('skin-loaded', skinDefinition);
  }

  async loadBackendSkin(backendId: string): Promise<UniversalSkinDefinition | null> {
    // Return mock skin for testing
    return {
      id: `mock-skin-${backendId}`,
      name: `Mock Skin for ${backendId}`,
      version: '1.0.0',
      description: `Mock skin for testing ${backendId}`,
      metadata: {
        id: `mock-skin-${backendId}`,
        name: `Mock Skin for ${backendId}`,
        version: '1.0.0',
        description: `Mock skin for testing ${backendId}`,
        backend: 'haruspex' as any,
        compatibleInterfaces: ['vscode', 'cli', 'command']
      },
      theme: {
        primary: '#007ACC',
        secondary: '#00AA44',
        accent: '#FF6600',
        success: '#00AA44',
        warning: '#FFAA00',
        error: '#FF4444',
        background: '#1E1E1E',
        foreground: '#FFFFFF'
      },
      pclCompatibility: {
        enabled: true,
        version: '1.0.0',
        features: []
      }
    };
  }

  async executeCommand(command: string, sourceInterface: InterfaceType, args?: any[]): Promise<any> {
    return {
      success: true,
      message: `Mock execution of ${command} from ${sourceInterface}`,
      data: { command, sourceInterface, args }
    };
  }

  getSystemStatus(): any {
    return {
      health: 'healthy',
      activeInterfaces: Array.from(this.registeredInterfaces.keys()),
      version: '1.0.0-test'
    };
  }

  async refreshBackendServices(): Promise<void> {
    this.emit('backend-services-refreshed');
  }

  getUniversalSkinEngine(): any {
    return {
      renderForInterface: jest.fn().mockResolvedValue('<mock-rendered-content/>')
    };
  }

  getBackendRouter(): any {
    return {
      getConnectionStatus: jest.fn().mockReturnValue({ connected: true, services: [] })
    };
  }

  getResourceManager(): any {
    return {
      getMetrics: jest.fn().mockReturnValue({ memory: 0, cpu: 0 })
    };
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
    this.registeredInterfaces.clear();
    this.emit('shutdown');
  }

  // Helper methods for testing
  getRegisteredInterface(interfaceType: InterfaceType): IInterfaceAdapter | undefined {
    return this.registeredInterfaces.get(interfaceType);
  }

  getRegisteredInterfaceCount(): number {
    return this.registeredInterfaces.size;
  }
}

/**
 * Mock VSCode Context for Testing
 */
class MockVSCodeContext {
  subscriptions: any[] = [];
  globalState = new Map();
  workspaceState = new Map();
  extensionUri = { fsPath: '/mock/extension/path' };
  extensionPath = '/mock/extension/path';

  constructor() {
    // Mock VSCode context implementation
  }
}

describe('Interface Adapter Integration Tests', () => {
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

  describe('VSCode Interface Adapter Integration', () => {
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

    test('initializes with orchestrator and registers interface', async () => {
      // Act
      await vscodeAdapter.initialize(mockOrchestrator);

      // Assert
      expect(mockOrchestrator.getRegisteredInterface('vscode')).toBe(vscodeAdapter);
      expect(mockOrchestrator.getRegisteredInterfaceCount()).toBe(1);
    });

    test('returns correct interface type', () => {
      // Act
      const interfaceType = vscodeAdapter.getInterfaceType();

      // Assert
      expect(interfaceType).toBe('vscode');
    });

    test('applies skin through orchestrator integration', async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);
      const mockSkin: UniversalSkinDefinition = {
        id: 'test-skin',
        name: 'Test Skin',
        version: '1.0.0',
        metadata: {
          id: 'test-skin',
          name: 'Test Skin',
          version: '1.0.0',
          backend: 'haruspex',
          compatibleInterfaces: ['vscode']
        },
        theme: {
          primary: '#007ACC',
          secondary: '#00AA44',
          accent: '#FF6600',
          success: '#00AA44',
          warning: '#FFAA00',
          error: '#FF4444',
          background: '#FFFFFF',
          foreground: '#000000'
        },
        pclCompatibility: {
          enabled: true,
          version: '1.0.0',
          features: []
        }
      };

      // Act & Assert - Should not throw
      await expect(vscodeAdapter.applySkin(mockSkin)).resolves.not.toThrow();
    });

    test('synchronizes state updates from orchestrator', async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);
      const stateUpdate: StateUpdate = {
        timestamp: Date.now(),
        sessionState: { activeMenu: 'main' }
      };

      // Act & Assert - Should not throw
      await expect(vscodeAdapter.syncState(stateUpdate)).resolves.not.toThrow();
    });

    test('reports accurate adapter status', async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);

      // Act
      const status = vscodeAdapter.getStatus();

      // Assert
      expect(status).toMatchObject({
        active: expect.any(Boolean),
        orchestratorConnected: expect.any(Boolean),
        lastActivity: expect.any(Number)
      });
      expect(status.orchestratorConnected).toBe(true);
    });

    test('supports skin compatibility validation', async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);
      const compatibleSkin: UniversalSkinDefinition = {
        id: 'compatible-skin',
        name: 'Compatible Skin',
        version: '1.0.0',
        metadata: {
          id: 'compatible-skin',
          name: 'Compatible Skin',
          version: '1.0.0',
          backend: 'haruspex',
          compatibleInterfaces: ['vscode', 'cli']
        },
        theme: {
          primary: '#007ACC',
          secondary: '#00AA44',
          accent: '#FF6600',
          success: '#00AA44',
          warning: '#FFAA00',
          error: '#FF4444',
          background: '#FFFFFF',
          foreground: '#000000'
        },
        pclCompatibility: {
          enabled: true,
          version: '1.0.0',
          features: []
        }
      };

      // Act
      const supports = vscodeAdapter.supportsSkin(compatibleSkin);

      // Assert
      expect(supports).toBe(true);
    });

    test('executes commands through orchestrator', async () => {
      // Arrange
      await vscodeAdapter.initialize(mockOrchestrator);
      const command = 'test-command';
      const args = ['arg1', 'arg2'];

      // Act
      const result = await vscodeAdapter.executeCommand(command, args);

      // Assert
      expect(result).toMatchObject({
        success: true,
        message: expect.stringContaining(command),
        data: expect.objectContaining({
          command,
          sourceInterface: 'vscode',
          args
        })
      });
    });
  });

  describe('CLI Interface Adapter Integration', () => {
    let cliAdapter: CLIInterfaceAdapter;

    beforeEach(() => {
      cliAdapter = new CLIInterfaceAdapter({
        enableInteractiveMode: false, // Disable for testing
        enableKeyboardShortcuts: false,
        enableColorOutput: false,
        enableProgressIndicators: false,
        clearScreenOnRender: false,
        maxHistorySize: 10
      });
    });

    afterEach(async () => {
      if (cliAdapter) {
        await cliAdapter.dispose();
      }
    });

    test('initializes with orchestrator and registers interface', async () => {
      // Act
      await cliAdapter.initialize(mockOrchestrator);

      // Assert
      expect(mockOrchestrator.getRegisteredInterface('cli')).toBe(cliAdapter);
      expect(mockOrchestrator.getRegisteredInterfaceCount()).toBe(1);
    });

    test('returns correct interface type', () => {
      // Act
      const interfaceType = cliAdapter.getInterfaceType();

      // Assert
      expect(interfaceType).toBe('cli');
    });

    test('synchronizes state updates from orchestrator', async () => {
      // Arrange
      await cliAdapter.initialize(mockOrchestrator);
      const stateUpdate: StateUpdate = {
        timestamp: Date.now(),
        menuUpdates: {
          'main': { refreshRequired: true }
        }
      };

      // Act & Assert - Should not throw
      await expect(cliAdapter.syncState(stateUpdate)).resolves.not.toThrow();
    });

    test('reports accurate adapter status', async () => {
      // Arrange
      await cliAdapter.initialize(mockOrchestrator);

      // Act
      const status = cliAdapter.getStatus();

      // Assert
      expect(status).toMatchObject({
        active: expect.any(Boolean),
        initialized: expect.any(Boolean),
        lastActivity: expect.any(Number)
      });
      expect(status.initialized).toBe(true);
    });

    test('applies skin through orchestrator integration', async () => {
      // Arrange
      await cliAdapter.initialize(mockOrchestrator);
      const mockSkin: UniversalSkinDefinition = {
        id: 'cli-test-skin',
        name: 'CLI Test Skin',
        version: '1.0.0',
        metadata: {
          id: 'cli-test-skin',
          name: 'CLI Test Skin', 
          version: '1.0.0',
          backend: 'pcl',
          compatibleInterfaces: ['cli']
        },
        theme: {
          primary: '#00FF00',
          secondary: '#FFFF00',
          accent: '#FF00FF',
          success: '#00FF00',
          warning: '#FFFF00',
          error: '#FF0000',
          background: '#000000',
          foreground: '#FFFFFF'
        },
        pclCompatibility: {
          enabled: true,
          version: '1.0.0',
          features: []
        }
      };

      // Act & Assert - Should not throw
      await expect(cliAdapter.applySkin(mockSkin)).resolves.not.toThrow();
    });
  });

  describe('Command Interface Adapter Integration', () => {
    let commandAdapter: CommandInterfaceAdapter;

    beforeEach(() => {
      commandAdapter = new CommandInterfaceAdapter({
        enableBatchExecution: true,
        enableAsynchronousExecution: true,
        enableExecutionHistory: true,
        maxQueueSize: 100,
        maxHistorySize: 50,
        defaultTimeout: 30000,
        enableMetrics: true
      });
    });

    afterEach(async () => {
      if (commandAdapter) {
        await commandAdapter.dispose();
      }
    });

    test('initializes with orchestrator and registers interface', async () => {
      // Act
      await commandAdapter.initialize(mockOrchestrator);

      // Assert
      expect(mockOrchestrator.getRegisteredInterface('command')).toBe(commandAdapter);
      expect(mockOrchestrator.getRegisteredInterfaceCount()).toBe(1);
    });

    test('returns correct interface type', () => {
      // Act
      const interfaceType = commandAdapter.getInterfaceType();

      // Assert
      expect(interfaceType).toBe('command');
    });

    test('synchronizes state updates from orchestrator', async () => {
      // Arrange
      await commandAdapter.initialize(mockOrchestrator);
      const stateUpdate: StateUpdate = {
        timestamp: Date.now(),
        sessionState: { commandContext: 'batch' }
      };

      // Act & Assert - Should not throw  
      await expect(commandAdapter.syncState(stateUpdate)).resolves.not.toThrow();
    });

    test('reports accurate adapter status with queue metrics', async () => {
      // Arrange
      await commandAdapter.initialize(mockOrchestrator);

      // Act
      const status = commandAdapter.getStatus();

      // Assert
      expect(status).toMatchObject({
        active: expect.any(Boolean),
        queueSize: expect.any(Number),
        healthy: expect.any(Boolean),
        lastActivity: expect.any(Number)
      });
      expect(status.queueSize).toBeGreaterThanOrEqual(0);
    });

    test('executes commands through orchestrator with proper context', async () => {
      // Arrange
      await commandAdapter.initialize(mockOrchestrator);
      const command = 'batch-test-command';
      const args = ['--verbose', '--output=json'];

      // Act
      const result = await commandAdapter.executeCommand({
        type: 'direct_command',
        command: command
      } as any);

      // Assert
      expect(result).toMatchObject({
        success: true,
        data: expect.objectContaining({
          command,
          sourceInterface: 'command'
        })
      });
    });
  });

  describe('Cross-Interface Integration Scenarios', () => {
    let vscodeAdapter: VSCodeInterfaceAdapter;
    let cliAdapter: CLIInterfaceAdapter;
    let commandAdapter: CommandInterfaceAdapter;

    beforeEach(async () => {
      // Initialize all adapters
      vscodeAdapter = new VSCodeInterfaceAdapter(new MockVSCodeContext() as any);
      cliAdapter = new CLIInterfaceAdapter({ enableInteractiveMode: false });
      commandAdapter = new CommandInterfaceAdapter({
        enableBatchExecution: true,
        maxQueueSize: 10
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
        commandAdapter?.dispose()
      ]);
    });

    test('multiple interface adapters register successfully', () => {
      // Assert
      expect(mockOrchestrator.getRegisteredInterfaceCount()).toBe(3);
      expect(mockOrchestrator.getRegisteredInterface('vscode')).toBe(vscodeAdapter);
      expect(mockOrchestrator.getRegisteredInterface('cli')).toBe(cliAdapter);
      expect(mockOrchestrator.getRegisteredInterface('command')).toBe(commandAdapter);
    });

    test('orchestrator reports all active interfaces in system status', () => {
      // Act
      const systemStatus = mockOrchestrator.getSystemStatus();

      // Assert
      expect(systemStatus.activeInterfaces).toContain('vscode');
      expect(systemStatus.activeInterfaces).toContain('cli');
      expect(systemStatus.activeInterfaces).toContain('command');
      expect(systemStatus.activeInterfaces).toHaveLength(3);
    });

    test('state synchronization broadcasts to all registered interfaces', async () => {
      // Arrange
      const stateUpdate: StateUpdate = {
        timestamp: Date.now(),
        globalState: { theme: 'dark' },
        sessionState: { user: 'test-user' }
      };

      // Act & Assert - All should handle state sync without throwing
      await expect(Promise.all([
        vscodeAdapter.syncState(stateUpdate),
        cliAdapter.syncState(stateUpdate), 
        commandAdapter.syncState(stateUpdate)
      ])).resolves.not.toThrow();
    });

    test('interface switching maintains orchestrator connection', async () => {
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

    test('backend skin loading works across all interface types', async () => {
      // Act
      const backendSkin = await mockOrchestrator.loadBackendSkin('haruspex');

      // Assert
      expect(backendSkin).toBeTruthy();
      expect(backendSkin?.metadata.compatibleInterfaces).toEqual(['vscode', 'cli', 'command']);
      
      // Test skin application across interfaces
      await expect(Promise.all([
        vscodeAdapter.applySkin(backendSkin!),
        cliAdapter.applySkin(backendSkin!),
        commandAdapter.applySkin(backendSkin!)
      ])).resolves.not.toThrow();
    });
  });

  describe('Error Handling and Resilience', () => {
    test('adapter handles orchestrator initialization failure gracefully', async () => {
      // Arrange
      const uninitializedOrchestrator = new MockTemplumOrchestrator();
      const adapter = new VSCodeInterfaceAdapter(new MockVSCodeContext() as any);

      // Act & Assert
      await expect(adapter.initialize(uninitializedOrchestrator))
        .rejects.toThrow('Cannot register interface on uninitialized orchestrator');
    });

    test('adapter status reflects orchestrator connection state', async () => {
      // Arrange
      const adapter = new CLIInterfaceAdapter({ enableInteractiveMode: false });
      await adapter.initialize(mockOrchestrator);

      // Act - Shutdown orchestrator
      await mockOrchestrator.shutdown();
      const status = adapter.getStatus();

      // Assert - Status should reflect disconnected state
      expect(status.initialized).toBe(false);
    });

    test('interface adapters handle state sync errors appropriately', async () => {
      // Arrange
      const adapter = new CommandInterfaceAdapter();
      await adapter.initialize(mockOrchestrator);
      
      // Create invalid state update that might cause errors
      const invalidStateUpdate = null as any;

      // Act & Assert
      await expect(adapter.syncState(invalidStateUpdate))
        .rejects.toThrow();
    });
  });
});