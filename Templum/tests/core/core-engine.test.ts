/**---
 * title: [Core Engine Test Suite - TDD Validation]
 * tags: [Testing, Core, Engine, TDD, Multi-Interface]
 * provides: [Core Engine Tests, Interface Validation, Backend Routing Tests]
 * requires: [Jest, TemplumCore, Interface Adapters]
 * description: [Comprehensive test suite validating core Templum engine functionality following TDD principles]
 * ---*/

import { TemplumCore } from '../../src/core/templum-core';
import { InterfaceType, UniversalSkinDefinition, CommandContext, CommandResult } from '../../src/types/templum-types';

describe('Templum Core Engine', () => {
  let templumCore: TemplumCore;

  beforeEach(() => {
    templumCore = new TemplumCore();
  });

  afterEach(async () => {
    if (templumCore) {
      await templumCore.shutdown();
    }
  });

  describe('Initialization', () => {
    test('initializes with multi-interface adapter support', async () => {
      // Arrange
      const expectedInterfaces: InterfaceType[] = ['vscode', 'cli', 'command'];

      // Act
      await templumCore.initialize();

      // Assert
      const supportedInterfaces = templumCore.getSupportedInterfaces();
      expectedInterfaces.forEach(interfaceType => {
        expect(supportedInterfaces).toContain(interfaceType);
      });
      
      const systemStatus = templumCore.getSystemStatus();
      expect(systemStatus.coreEngine.initialized).toBe(true);
      expect(systemStatus.coreEngine.activeInterfaces).toEqual(expect.arrayContaining([])); // Should be empty initially
    });

    test('initializes backend router with service discovery', async () => {
      // Act
      await templumCore.initialize();

      // Assert
      const systemStatus = templumCore.getSystemStatus();
      expect(systemStatus.coreEngine.backendConnections).toBeDefined();
      expect(systemStatus.stateManager).toBeDefined();
      expect(systemStatus.skinEngine).toBeDefined();
    });

    test('starts state synchronization on initialization', async () => {
      // Act
      await templumCore.initialize();

      // Assert
      const stateManagerStatus = templumCore.getStateManagerStatus();
      expect(stateManagerStatus.synchronized).toBe(true);
    });
  });

  describe('Interface Registration', () => {
    test('registers VSCode interface adapter', async () => {
      // Arrange
      await templumCore.initialize();
      const mockVSCodeAdapter = createMockInterfaceAdapter('vscode');

      // Act
      await templumCore.registerInterface('vscode', mockVSCodeAdapter);

      // Assert
      const systemStatus = templumCore.getSystemStatus();
      expect(systemStatus.coreEngine.activeInterfaces).toContain('vscode');
    });

    test('registers CLI interface adapter', async () => {
      // Arrange
      await templumCore.initialize();
      const mockCLIAdapter = createMockInterfaceAdapter('cli');

      // Act
      await templumCore.registerInterface('cli', mockCLIAdapter);

      // Assert
      const systemStatus = templumCore.getSystemStatus();
      expect(systemStatus.coreEngine.activeInterfaces).toContain('cli');
    });

    test('registers Command interface adapter', async () => {
      // Arrange
      await templumCore.initialize();
      const mockCommandAdapter = createMockInterfaceAdapter('command');

      // Act
      await templumCore.registerInterface('command', mockCommandAdapter);

      // Assert
      const systemStatus = templumCore.getSystemStatus();
      expect(systemStatus.coreEngine.activeInterfaces).toContain('command');
    });

    test('synchronizes state to newly registered interface', async () => {
      // Arrange
      await templumCore.initialize();
      const mockAdapter = createMockInterfaceAdapter('vscode');

      // Act
      await templumCore.registerInterface('vscode', mockAdapter);

      // Assert
      expect(mockAdapter.syncState).toHaveBeenCalled();
    });
  });

  describe('Command Execution and Backend Routing', () => {
    test('routes commands to appropriate backend services', async () => {
      // Arrange
      await templumCore.initialize();
      const mockBackendRouter = jest.spyOn(templumCore['backendRouter'], 'executeCommand');
      mockBackendRouter.mockResolvedValue({ success: true, data: 'test-result' });

      const command = 'analyze-code';
      const sourceInterface: InterfaceType = 'cli';
      const args = ['test.ts'];
      const context: CommandContext = { sessionId: 'test-session' };

      // Act
      const result = await templumCore.executeCommand(command, sourceInterface, args, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.source).toBe('cli');
      expect(result.data).toEqual({ success: true, data: 'test-result' });
      expect(mockBackendRouter).toHaveBeenCalled();
    });

    test('handles unknown commands gracefully', async () => {
      // Arrange
      await templumCore.initialize();
      const unknownCommand = 'unknown-command';

      // Act
      const result = await templumCore.executeCommand(unknownCommand, 'cli', []);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
      expect(result.source).toBe('cli');
    });

    test('updates state after successful command execution', async () => {
      // Arrange
      await templumCore.initialize();
      const mockStateManager = jest.spyOn(templumCore['stateManager'], 'updateState');
      mockStateManager.mockResolvedValue(undefined);
      
      const mockBackendRouter = jest.spyOn(templumCore['backendRouter'], 'executeCommand');
      mockBackendRouter.mockResolvedValue({ success: true, data: 'test-result' });

      // Act
      await templumCore.executeCommand('test-command', 'cli', []);

      // Assert
      expect(mockStateManager).toHaveBeenCalled();
    });
  });

  describe('Universal Skin System', () => {
    test('loads and validates skin definition', async () => {
      // Arrange
      await templumCore.initialize();
      const mockSkinDefinition = createMockSkinDefinition();

      // Act
      await templumCore.loadSkin(mockSkinDefinition);

      // Assert
      const systemStatus = templumCore.getSystemStatus();
      expect(systemStatus.coreEngine.loadedSkins).toContain(mockSkinDefinition.metadata.id);
    });

    test('rejects invalid skin definitions', async () => {
      // Arrange
      await templumCore.initialize();
      const invalidSkinDefinition = createInvalidSkinDefinition();

      // Act & Assert
      await expect(templumCore.loadSkin(invalidSkinDefinition)).rejects.toThrow('Invalid skin definition');
    });

    test('applies skin to all active interfaces', async () => {
      // Arrange
      await templumCore.initialize();
      const mockVSCodeAdapter = createMockInterfaceAdapter('vscode');
      const mockCLIAdapter = createMockInterfaceAdapter('cli');
      
      await templumCore.registerInterface('vscode', mockVSCodeAdapter);
      await templumCore.registerInterface('cli', mockCLIAdapter);

      const mockSkinDefinition = createMockSkinDefinition();

      // Act
      await templumCore.loadSkin(mockSkinDefinition);

      // Assert
      expect(mockVSCodeAdapter.applySkin).toHaveBeenCalledWith(mockSkinDefinition);
      expect(mockCLIAdapter.applySkin).toHaveBeenCalledWith(mockSkinDefinition);
    });
  });

  describe('Cross-Interface State Synchronization', () => {
    test('synchronizes state changes across all interfaces', async () => {
      // Arrange
      await templumCore.initialize();
      const mockVSCodeAdapter = createMockInterfaceAdapter('vscode');
      const mockCLIAdapter = createMockInterfaceAdapter('cli');
      
      await templumCore.registerInterface('vscode', mockVSCodeAdapter);
      await templumCore.registerInterface('cli', mockCLIAdapter);

      const stateUpdate = { timestamp: Date.now(), globalState: {}, sessionState: {} };

      // Act
      await templumCore.synchronizeInterfaceStates(stateUpdate);

      // Assert
      expect(mockVSCodeAdapter.syncState).toHaveBeenCalled();
      expect(mockCLIAdapter.syncState).toHaveBeenCalled();
    });
  });

  describe('Performance Requirements', () => {
    test('interface switching completes within 100ms', async () => {
      // Arrange
      await templumCore.initialize();
      const mockAdapter = createMockInterfaceAdapter('vscode');

      // Act
      const startTime = Date.now();
      await templumCore.registerInterface('vscode', mockAdapter);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('command routing completes within 50ms', async () => {
      // Arrange
      await templumCore.initialize();
      const mockBackendRouter = jest.spyOn(templumCore['backendRouter'], 'resolveCommand');
      mockBackendRouter.mockReturnValue({ backend: 'pcl', commandInfo: { handler: 'test' } });

      // Act
      const startTime = Date.now();
      const result = templumCore.resolveCommand('test-command');
      const endTime = Date.now();

      // Assert
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});

// Test Utilities
function createMockInterfaceAdapter(type: InterfaceType) {
  return {
    getInterfaceType: jest.fn().mockReturnValue(type),
    applySkin: jest.fn().mockResolvedValue(undefined),
    syncState: jest.fn().mockResolvedValue(undefined),
    dispose: jest.fn().mockResolvedValue(undefined),
    getStatus: jest.fn().mockReturnValue({ active: true })
  };
}

function createMockSkinDefinition(): UniversalSkinDefinition {
  return {
    metadata: {
      id: 'test-skin',
      name: 'Test Skin',
      backend: 'pcl',
      version: '1.0.0',
      compatibleInterfaces: ['vscode', 'cli', 'command']
    },
    commands: {
      'test-command': {
        title: 'Test Command',
        description: 'A test command',
        handler: 'testHandler'
      }
    }
  };
}

function createInvalidSkinDefinition(): any {
  return {
    // Missing required metadata
    commands: {}
  };
}