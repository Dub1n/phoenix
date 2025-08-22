/**---
 * title: [Haruspex Command Manager Tests - Conflict Resolution Testing]
 * tags: [Testing, Command-Management, Conflict-Resolution, VS-Code-Integration]
 * provides: [UnitTests, ConflictResolution, CommandRegistration, VSCodeIntegration]
 * requires: [Jest, Test Utilities, Command Manager, VS Code Mock, Shared Schemas]
 * description: [Comprehensive unit tests for HaruspexCommandManager covering command registration, conflict resolution, and VS Code integration patterns]
 * ---*/

import * as vscode from 'vscode';
import { HaruspexCommandManager, CommandRegistrationResult, CommandInfo } from '../haruspex-command-manager';
import { CommandManagerConfig } from '../shared-schemas';
import { HaruspexError, CommandRegistrationError, CommandConflictError, ErrorSeverity } from '../shared-errors';
import {
  createMockExtensionContext,
  createMockDebugLog,
  createTestCommandManagerConfig,
  createTestCommandRegistrationResult,
  createHotReloadConflictScenario,
  expectErrorAggregation,
  waitForAsync
} from './test-utils/cleanup-test-utils';

// Enhanced VS Code mock for command testing
const mockVSCode = {
  commands: {
    registerCommand: jest.fn(),
    getCommands: jest.fn(),
    executeCommand: jest.fn()
  },
  Disposable: {
    from: jest.fn().mockImplementation((...disposables) => ({
      dispose: jest.fn(() => {
        disposables.forEach(d => d && typeof d.dispose === 'function' && d.dispose());
      })
    }))
  }
};

// Mock vscode module
jest.mock('vscode', () => mockVSCode, { virtual: true });

describe('HaruspexCommandManager', () => {
  let commandManager: HaruspexCommandManager;
  let mockContext: any;
  let mockDebugLog: jest.MockedFunction<any>;
  let testConfig: CommandManagerConfig;
  
  beforeEach(() => {
    mockContext = createMockExtensionContext();
    mockDebugLog = createMockDebugLog();
    testConfig = createTestCommandManagerConfig();
    
    commandManager = new HaruspexCommandManager(mockContext, mockDebugLog, testConfig);
    
    // Reset VS Code mocks
    mockVSCode.commands.registerCommand.mockReset();
    mockVSCode.commands.getCommands.mockReset();
    mockVSCode.commands.executeCommand.mockReset();
    
    // Default mock implementations
    mockVSCode.commands.registerCommand.mockImplementation((commandId, handler) => ({
      dispose: jest.fn()
    }));
    mockVSCode.commands.getCommands.mockResolvedValue([]);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    if (commandManager) {
      commandManager.dispose();
    }
  });

  // =============================================================================
  // CONSTRUCTION AND CONFIGURATION TESTS
  // =============================================================================

  describe('Constructor and Configuration', () => {
    it('should create command manager with valid configuration', () => {
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, testConfig);
      expect(manager).toBeInstanceOf(HaruspexCommandManager);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('Command Manager created')
      );
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        ...testConfig,
        timing: {
          gracefulShutdownTimeout: -1000, // Invalid timeout
          heartbeatInterval: 1000,
          retryDelay: 100,
          maxRetryAttempts: 3
        }
      };
      
      expect(() => {
        new HaruspexCommandManager(mockContext, mockDebugLog, invalidConfig);
      }).toThrow();
    });

    it('should use default configuration when partial config provided', () => {
      const partialConfig: Partial<CommandManagerConfig> = {
        enableDetailedLogging: false,
        hotReload: {
          enableHotReloadHandling: true,
          enableConflictResolution: true,
          conflictResolutionStrategy: 'graceful-skip',
          conflictResolutionTimeout: 5000
        }
      };
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, partialConfig);
      expect(manager).toBeInstanceOf(HaruspexCommandManager);
      
      const config = manager.getConfiguration();
      expect(config.enableDetailedLogging).toBe(false);
      expect(config.hotReload?.conflictResolutionStrategy).toBe('graceful-skip');
      expect(config.enableSafetyChecks).toBe(true); // Should use default
    });

    it('should validate conflict resolution strategy', () => {
      const configWithInvalidStrategy = {
        ...testConfig,
        hotReload: {
          enableHotReloadHandling: true,
          enableConflictResolution: true,
          conflictResolutionStrategy: 'invalid-strategy' as any,
          conflictResolutionTimeout: 5000
        }
      };
      
      expect(() => {
        new HaruspexCommandManager(mockContext, mockDebugLog, configWithInvalidStrategy);
      }).toThrow();
    });

    it('should emit configuration events', (done) => {
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, testConfig);
      
      manager.on('configuration_validated', (result) => {
        expect(result.success).toBe(true);
        done();
      });
    });
  });

  // =============================================================================
  // SINGLE COMMAND REGISTRATION TESTS
  // =============================================================================

  describe('Single Command Registration', () => {
    it('should register single command successfully', async () => {
      const commandId = 'haruspex.test.single';
      const handler = jest.fn();
      const metadata = {
        category: 'core' as const,
        description: 'Test command',
        essential: false
      };
      
      const result = await commandManager.registerCommand(commandId, handler, metadata);
      
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.details[0]).toContain('registered successfully');
      
      expect(mockVSCode.commands.registerCommand).toHaveBeenCalledWith(commandId, handler);
    });

    it('should handle command registration failure', async () => {
      const commandId = 'haruspex.test.fail';
      const handler = jest.fn();
      
      // Mock registerCommand to throw error
      mockVSCode.commands.registerCommand.mockImplementation(() => {
        throw new Error('Registration failed');
      });
      
      const result = await commandManager.registerCommand(commandId, handler);
      
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.details[0]).toContain('Registration failed');
    });

    it('should detect command conflicts in single registration', async () => {
      const commandId = 'haruspex.test.conflict';
      const handler = jest.fn();
      
      // Mock existing commands
      mockVSCode.commands.getCommands.mockResolvedValue([commandId]);
      
      const result = await commandManager.registerCommand(commandId, handler);
      
      // Default strategy is 'preserve-existing', so should skip
      expect(result.successful).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.details[0]).toContain('already registered');
    });

    it('should handle different conflict resolution strategies', async () => {
      const commandId = 'haruspex.test.strategy';
      const handler = jest.fn();
      
      // Mock existing commands
      mockVSCode.commands.getCommands.mockResolvedValue([commandId]);
      
      // Test 'overwrite' strategy
      const configWithOverwrite = createTestCommandManagerConfig({
        hotReload: {
          enableHotReloadHandling: true,
          enableConflictResolution: true,
          conflictResolutionStrategy: 'overwrite',
          conflictResolutionTimeout: 5000
        }
      });
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, configWithOverwrite);
      const result = await manager.registerCommand(commandId, handler);
      
      expect(result.successful).toBe(1);
      expect(result.skipped).toBe(0);
      expect(mockVSCode.commands.registerCommand).toHaveBeenCalledWith(commandId, handler);
    });

    it('should validate command metadata', async () => {
      const commandId = 'haruspex.test.metadata';
      const handler = jest.fn();
      const invalidMetadata = {
        category: 'invalid-category' as any,
        description: '',
        essential: 'not-boolean' as any
      };
      
      const result = await commandManager.registerCommand(commandId, handler, invalidMetadata);
      
      expect(result.failed).toBe(1);
      expect(result.details[0]).toContain('metadata validation');
    });

    it('should assign session ID to commands', async () => {
      const commandId = 'haruspex.test.session';
      const handler = jest.fn();
      
      await commandManager.registerCommand(commandId, handler);
      
      const registeredCommands = commandManager.getRegisteredCommands();
      expect(registeredCommands).toHaveLength(1);
      expect(registeredCommands[0].sessionId).toBeDefined();
      expect(registeredCommands[0].sessionId).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  // =============================================================================
  // BATCH COMMAND REGISTRATION TESTS
  // =============================================================================

  describe('Batch Command Registration', () => {
    it('should register multiple commands successfully', async () => {
      const commands = [
        {
          commandId: 'haruspex.batch.cmd1',
          handler: jest.fn(),
          metadata: { category: 'core' as const, description: 'Command 1' }
        },
        {
          commandId: 'haruspex.batch.cmd2',
          handler: jest.fn(),
          metadata: { category: 'ui' as const, description: 'Command 2' }
        },
        {
          commandId: 'haruspex.batch.cmd3',
          handler: jest.fn(),
          metadata: { category: 'debug' as const, description: 'Command 3' }
        }
      ];
      
      const result = await commandManager.registerCommands(commands);
      
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.details).toHaveLength(3);
      
      expect(mockVSCode.commands.registerCommand).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure in batch registration', async () => {
      const commands = [
        {
          commandId: 'haruspex.batch.success',
          handler: jest.fn(),
          metadata: { category: 'core' as const }
        },
        {
          commandId: 'haruspex.batch.fail',
          handler: jest.fn(),
          metadata: { category: 'ui' as const }
        }
      ];
      
      // Mock registerCommand to fail for second command
      let callCount = 0;
      mockVSCode.commands.registerCommand.mockImplementation((commandId) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Second command failed');
        }
        return { dispose: jest.fn() };
      });
      
      const result = await commandManager.registerCommands(commands);
      
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.details).toHaveLength(2);
    });

    it('should handle batch conflict resolution', async () => {
      const { existingCommands, newCommands, expectedResolution } = createHotReloadConflictScenario();
      
      // Mock existing commands
      mockVSCode.commands.getCommands.mockResolvedValue(
        existingCommands.map(cmd => cmd.id)
      );
      
      const result = await commandManager.registerCommands(newCommands);
      
      expect(result.successful).toBe(expectedResolution.successful);
      expect(result.skipped).toBe(expectedResolution.skipped);
      expect(result.failed).toBe(expectedResolution.failed);
    });

    it('should validate all commands in batch before registration', async () => {
      const commands = [
        {
          commandId: 'haruspex.valid.cmd',
          handler: jest.fn(),
          metadata: { category: 'core' as const }
        },
        {
          commandId: '', // Invalid command ID
          handler: jest.fn(),
          metadata: { category: 'ui' as const }
        }
      ];
      
      const configWithValidation = createTestCommandManagerConfig({
        registration: {
          enableParallelRegistration: false,
          enableRegistrationRetry: true,
          registrationRetryDelay: 1000,
          maxRegistrationAttempts: 3
        }
      });
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, configWithValidation);
      const result = await manager.registerCommands(commands);
      
      // Should fail validation for empty command ID
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should support different batch registration strategies', async () => {
      const commands = [
        {
          commandId: 'haruspex.strategy.cmd1',
          handler: jest.fn(),
          metadata: { category: 'core' as const }
        },
        {
          commandId: 'haruspex.strategy.cmd2',
          handler: jest.fn(),
          metadata: { category: 'ui' as const }
        }
      ];
      
      // Test with different registration settings
      const configWithoutValidation = createTestCommandManagerConfig({
        registration: {
          enableParallelRegistration: false,
          enableRegistrationRetry: false,
          registrationRetryDelay: 100,
          maxRegistrationAttempts: 1
        }
      });
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, configWithoutValidation);
      const result = await manager.registerCommands(commands);
      
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  // =============================================================================
  // CONFLICT RESOLUTION TESTS (Priority 2 Enhancement)
  // =============================================================================

  describe('Conflict Resolution - Priority 2 Enhancement', () => {
    it('should detect conflicts using VS Code command list', async () => {
      const existingCommands = ['haruspex.existing1', 'haruspex.existing2', 'other.command'];
      mockVSCode.commands.getCommands.mockResolvedValue(existingCommands);
      
      const result = await commandManager.registerCommand('haruspex.existing1', jest.fn());
      
      expect(result.skipped).toBe(1);
      expect(result.details[0]).toContain('already registered');
    });

    it('should apply preserve-existing strategy correctly', async () => {
      const configWithPreserve = createTestCommandManagerConfig({
        hotReload: {
          enableHotReloadHandling: true,
          enableConflictResolution: true,
          conflictResolutionStrategy: 'preserve-existing',
          conflictResolutionTimeout: 5000
        }
      });
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, configWithPreserve);
      
      mockVSCode.commands.getCommands.mockResolvedValue(['haruspex.preserve.test']);
      
      const result = await manager.registerCommand('haruspex.preserve.test', jest.fn());
      
      expect(result.successful).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockVSCode.commands.registerCommand).not.toHaveBeenCalled();
    });

    it('should apply overwrite strategy correctly', async () => {
      const configWithOverwrite = createTestCommandManagerConfig({
        hotReload: {
          enableHotReloadHandling: true,
          enableConflictResolution: true,
          conflictResolutionStrategy: 'overwrite',
          conflictResolutionTimeout: 5000
        }
      });
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, configWithOverwrite);
      
      mockVSCode.commands.getCommands.mockResolvedValue(['haruspex.overwrite.test']);
      
      const result = await manager.registerCommand('haruspex.overwrite.test', jest.fn());
      
      expect(result.successful).toBe(1);
      expect(result.skipped).toBe(0);
      expect(mockVSCode.commands.registerCommand).toHaveBeenCalled();
    });

    it('should apply skip-conflicts strategy correctly', async () => {
      const configWithSkip = createTestCommandManagerConfig({
        hotReload: {
          enableHotReloadHandling: true,
          enableConflictResolution: true,
          conflictResolutionStrategy: 'skip-conflicts',
          conflictResolutionTimeout: 5000
        }
      });
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, configWithSkip);
      
      mockVSCode.commands.getCommands.mockResolvedValue(['haruspex.skip.test']);
      
      const result = await manager.registerCommand('haruspex.skip.test', jest.fn());
      
      expect(result.successful).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('conflict detected'),
        'info'
      );
    });

    it('should log conflicts when enabled', async () => {
      const configWithLogging = createTestCommandManagerConfig({
        hotReload: {
          enableHotReloadHandling: true,
          enableConflictResolution: true,
          conflictResolutionStrategy: 'preserve-existing',
          conflictResolutionTimeout: 5000
        }
      });
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, configWithLogging);
      
      mockVSCode.commands.getCommands.mockResolvedValue(['haruspex.logged.conflict']);
      
      await manager.registerCommand('haruspex.logged.conflict', jest.fn());
      
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('Command conflict detected'),
        'warning'
      );
    });

    it('should handle conflict detection errors gracefully', async () => {
      mockVSCode.commands.getCommands.mockRejectedValue(new Error('Failed to get commands'));
      
      const result = await commandManager.registerCommand('haruspex.error.test', jest.fn());
      
      // Should proceed with registration despite conflict detection error
      expect(result.successful).toBe(1);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('conflict detection failed'),
        'warning'
      );
    });

    it('should track conflict resolution statistics', async () => {
      mockVSCode.commands.getCommands.mockResolvedValue(['haruspex.stats.conflict']);
      
      await commandManager.registerCommand('haruspex.stats.conflict', jest.fn());
      await commandManager.registerCommand('haruspex.stats.success', jest.fn());
      
      const stats = commandManager.getRegistrationStats();
      
      expect(stats.total).toBe(2);
      expect(stats.byStatus.successful).toBe(1);
      expect(stats.byStatus.skipped).toBe(1);
      expect(stats.byConflictResolution.preserved).toBe(1);
    });
  });

  // =============================================================================
  // COMMAND LIFECYCLE MANAGEMENT TESTS
  // =============================================================================

  describe('Command Lifecycle Management', () => {
    it('should track registered commands', async () => {
      const commands = [
        { commandId: 'haruspex.track.cmd1', handler: jest.fn(), metadata: { category: 'core' as const } },
        { commandId: 'haruspex.track.cmd2', handler: jest.fn(), metadata: { category: 'ui' as const } }
      ];
      
      await commandManager.registerCommands(commands);
      
      const registered = commandManager.getRegisteredCommands();
      expect(registered).toHaveLength(2);
      expect(registered[0].commandId).toBe('haruspex.track.cmd1');
      expect(registered[1].commandId).toBe('haruspex.track.cmd2');
    });

    it('should provide command registration statistics', async () => {
      await commandManager.registerCommand('haruspex.stats.1', jest.fn());
      await commandManager.registerCommand('haruspex.stats.2', jest.fn());
      
      // Mock conflict
      mockVSCode.commands.getCommands.mockResolvedValue(['haruspex.stats.conflict']);
      await commandManager.registerCommand('haruspex.stats.conflict', jest.fn());
      
      const stats = commandManager.getRegistrationStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byStatus.successful).toBe(2);
      expect(stats.byStatus.skipped).toBe(1);
      expect(stats.byCategory.core).toBeGreaterThanOrEqual(0);
    });

    it('should dispose all commands on manager disposal', async () => {
      const mockDispose = jest.fn();
      mockVSCode.commands.registerCommand.mockReturnValue({ dispose: mockDispose });
      
      await commandManager.registerCommand('haruspex.dispose.test', jest.fn());
      
      const disposedCount = commandManager.dispose();
      
      expect(disposedCount).toBe(1);
      expect(mockDispose).toHaveBeenCalled();
    });

    it('should handle disposal errors gracefully', async () => {
      const mockDispose = jest.fn().mockImplementation(() => {
        throw new Error('Disposal failed');
      });
      mockVSCode.commands.registerCommand.mockReturnValue({ dispose: mockDispose });
      
      await commandManager.registerCommand('haruspex.dispose.error', jest.fn());
      
      const disposedCount = commandManager.dispose();
      
      expect(disposedCount).toBe(1); // Should still count as disposed
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('disposal failed'),
        'warning'
      );
    });

    it('should support partial disposal of commands', async () => {
      await commandManager.registerCommands([
        { commandId: 'haruspex.partial.1', handler: jest.fn(), metadata: { category: 'core' as const } },
        { commandId: 'haruspex.partial.2', handler: jest.fn(), metadata: { category: 'ui' as const } },
        { commandId: 'haruspex.partial.3', handler: jest.fn(), metadata: { category: 'debug' as const } }
      ]);
      
      // Dispose specific commands by category
      const disposedCore = commandManager.disposeByCategory('core');
      
      expect(disposedCore).toBe(1);
      expect(commandManager.getRegisteredCommands()).toHaveLength(2);
    });
  });

  // =============================================================================
  // ERROR HANDLING AND RECOVERY TESTS
  // =============================================================================

  describe('Error Handling and Recovery', () => {
    it('should collect and report command registration errors', async () => {
      const commandId = 'haruspex.error.collect';
      
      mockVSCode.commands.registerCommand.mockImplementation(() => {
        throw new CommandRegistrationError(
          'Command registration failed',
          commandId,
          1,
          { reason: 'Handler validation failed' }
        );
      });
      
      await commandManager.registerCommand(commandId, jest.fn());
      
      const errors = commandManager.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      const errorSummary = commandManager.getErrorSummary();
      expect(errorSummary.total).toBeGreaterThan(0);
      expect(errorSummary.bySeverity).toBeDefined();
    });

    it('should handle command conflict errors', async () => {
      const commandId = 'haruspex.conflict.error';
      
      // Mock conflict detection to throw error
      mockVSCode.commands.getCommands.mockImplementation(() => {
        throw new CommandConflictError(
          'Conflict resolution failed',
          commandId,
          'hot-reload',
          'preserve-existing',
          { reason: 'Failed to check existing commands' }
        );
      });
      
      await commandManager.registerCommand(commandId, jest.fn());
      
      const errors = commandManager.getErrors();
      const conflictError = errors.find(e => e.name === 'CommandConflictError');
      
      expect(conflictError).toBeDefined();
      expect(conflictError?.context.commandId).toBe(commandId);
    });

    it('should provide structured error information', async () => {
      const commandId = 'haruspex.structured.error';
      
      const customError = new CommandRegistrationError(
        'Test structured error',
        commandId,
        1,
        { reason: 'Test reason' }
      );
      
      mockVSCode.commands.registerCommand.mockImplementation(() => {
        throw customError;
      });
      
      await commandManager.registerCommand(commandId, jest.fn());
      
      const errors = commandManager.getErrors();
      const structuredError = errors[0];
      
      expect(structuredError.errorId).toBeDefined();
      expect(structuredError.name).toBe('CommandRegistrationError');
      expect(structuredError.component).toBe('CommandManager');
      expect(structuredError.severity).toBe(ErrorSeverity.ERROR);
      expect(structuredError.context.commandId).toBe(commandId);
    });

    it('should clear errors when requested', async () => {
      mockVSCode.commands.registerCommand.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      await commandManager.registerCommand('haruspex.clear.error', jest.fn());
      expect(commandManager.getErrors().length).toBeGreaterThan(0);
      
      commandManager.clearErrors();
      expect(commandManager.getErrors()).toHaveLength(0);
    });

    it('should handle VS Code API unavailability', async () => {
      // Mock VS Code commands API to be undefined
      const originalCommands = mockVSCode.commands;
      (mockVSCode as any).commands = undefined;
      
      try {
        const result = await commandManager.registerCommand('haruspex.api.unavailable', jest.fn());
        
        expect(result.failed).toBe(1);
        expect(result.details[0]).toContain('VS Code commands API unavailable');
      } finally {
        (mockVSCode as any).commands = originalCommands;
      }
    });
  });

  // =============================================================================
  // CONFIGURATION VALIDATION TESTS
  // =============================================================================

  describe('Configuration Validation', () => {
    it('should validate hot-reload configuration', () => {
      expect(() => {
        new HaruspexCommandManager(mockContext, mockDebugLog, {
          ...testConfig,
          hotReload: {
            enableHotReloadHandling: true,
            enableConflictResolution: true,
            conflictResolutionStrategy: 'invalid' as any,
            conflictResolutionTimeout: 5000
          }
        });
      }).toThrow();
    });

    it('should validate registration configuration', () => {
      const validConfig = createTestCommandManagerConfig({
        registration: {
          enableParallelRegistration: false,
          enableRegistrationRetry: true,
          registrationRetryDelay: 1000,
          maxRegistrationAttempts: 3
        }
      });
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, validConfig);
      expect(manager).toBeInstanceOf(HaruspexCommandManager);
    });

    it('should provide configuration validation results', () => {
      const validationResult = commandManager.getConfigurationValidation();
      expect(validationResult.success).toBe(true);
      expect(validationResult.data).toBeDefined();
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should merge partial configurations correctly', () => {
      const partialConfig: Partial<CommandManagerConfig> = {
        enableDetailedLogging: false,
        hotReload: {
          enableHotReloadHandling: false,
          enableConflictResolution: true,
          conflictResolutionStrategy: 'overwrite',
          conflictResolutionTimeout: 3000
        }
      };
      
      const manager = new HaruspexCommandManager(mockContext, mockDebugLog, partialConfig);
      const mergedConfig = manager.getConfiguration();
      
      expect(mergedConfig.enableDetailedLogging).toBe(false);
      expect(mergedConfig.hotReload?.enableHotReloadHandling).toBe(false);
      expect(mergedConfig.enableSafetyChecks).toBe(true); // Default value
    });
  });

  // =============================================================================
  // INTEGRATION AND STATUS TESTS
  // =============================================================================

  describe('Status and Integration', () => {
    it('should provide comprehensive status information', async () => {
      await commandManager.registerCommand('haruspex.status.test', jest.fn());
      
      const status = commandManager.getStatus();
      
      expect(status.initialized).toBe(false); // Commands don't require initialization
      expect(status.commandCount).toBe(1);
      expect(status.canRegister).toBe(true);
    });

    it('should generate comprehensive status report', async () => {
      await commandManager.registerCommands([
        { commandId: 'haruspex.report.1', handler: jest.fn(), metadata: { category: 'core' as const } },
        { commandId: 'haruspex.report.2', handler: jest.fn(), metadata: { category: 'ui' as const } }
      ]);
      
      const report = commandManager.generateStatusReport();
      
      expect(report.configuration.valid).toBe(true);
      expect(report.commands.total).toBe(2);
      expect(report.commands.byCategory.core).toBe(1);
      expect(report.commands.byCategory.ui).toBe(1);
      expect(report.conflicts.detectionEnabled).toBe(true);
      expect(report.errors.total).toBe(0);
    });

    it('should emit lifecycle events', (done) => {
      let eventCount = 0;
      
      commandManager.on('command_registered', (info) => {
        expect(info.commandId).toBeDefined();
        eventCount++;
        if (eventCount === 2) done();
      });
      
      commandManager.on('batch_registration_completed', (result) => {
        expect(result.successful).toBeGreaterThan(0);
        eventCount++;
        if (eventCount === 2) done();
      });
      
      // Trigger events
      commandManager.registerCommand('haruspex.event.test', jest.fn());
    });

    it('should handle concurrent registration requests safely', async () => {
      const commands = [
        { commandId: 'haruspex.concurrent.1', handler: jest.fn() },
        { commandId: 'haruspex.concurrent.2', handler: jest.fn() },
        { commandId: 'haruspex.concurrent.3', handler: jest.fn() }
      ];
      
      const registrationPromises = commands.map(cmd =>
        commandManager.registerCommand(cmd.commandId, cmd.handler)
      );
      
      const results = await Promise.allSettled(registrationPromises);
      
      // All should succeed (or be handled gracefully)
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(3);
    });

    it('should maintain consistent state across operations', async () => {
      const initialCount = commandManager.getRegisteredCommands().length;
      
      await commandManager.registerCommand('haruspex.consistency.1', jest.fn());
      await commandManager.registerCommand('haruspex.consistency.2', jest.fn());
      
      expect(commandManager.getRegisteredCommands()).toHaveLength(initialCount + 2);
      
      const disposedCount = commandManager.dispose();
      expect(disposedCount).toBe(2);
      expect(commandManager.getRegisteredCommands()).toHaveLength(0);
    });
  });

  // =============================================================================
  // EDGE CASE AND STRESS TESTS
  // =============================================================================

  describe('Edge Cases and Stress Tests', () => {
    it('should handle registering many commands', async () => {
      const commandCount = 100;
      const commands = Array.from({ length: commandCount }, (_, i) => ({
        commandId: `haruspex.stress.${i}`,
        handler: jest.fn(),
        metadata: { category: 'core' as const, description: `Stress command ${i}` }
      }));
      
      const result = await commandManager.registerCommands(commands);
      
      expect(result.successful).toBe(commandCount);
      expect(commandManager.getRegisteredCommands()).toHaveLength(commandCount);
    });

    it('should handle rapid registration and disposal', async () => {
      const iterations = 50;
      
      for (let i = 0; i < iterations; i++) {
        await commandManager.registerCommand(`haruspex.rapid.${i}`, jest.fn());
        expect(commandManager.getRegisteredCommands().length).toBeGreaterThan(0);
        
        commandManager.dispose();
        expect(commandManager.getRegisteredCommands()).toHaveLength(0);
      }
    });

    it('should handle command registration with minimal metadata', async () => {
      const commandId = 'haruspex.minimal.metadata';
      const handler = jest.fn();
      
      // No metadata provided
      const result = await commandManager.registerCommand(commandId, handler);
      
      expect(result.successful).toBe(1);
      
      const registered = commandManager.getRegisteredCommands();
      const command = registered.find(cmd => cmd.commandId === commandId);
      
      expect(command).toBeDefined();
      expect(command?.metadata.category).toBeDefined(); // Should have default
    });

    it('should handle VS Code extension context disposal', () => {
      const disposables: any[] = [];
      const mockDispose = jest.fn();
      
      // Mock extension context to track disposables
      mockContext.subscriptions.push = jest.fn().mockImplementation((disposable) => {
        disposables.push(disposable);
      });
      
      // Register command which should add to context subscriptions
      commandManager.registerCommand('haruspex.context.disposal', jest.fn());
      
      // Simulate extension deactivation
      disposables.forEach(d => d.dispose && d.dispose());
      
      // Should handle gracefully
      expect(() => {
        commandManager.dispose();
      }).not.toThrow();
    });

    it('should handle command handler execution errors', async () => {
      const faultyHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler execution failed');
      });
      
      await commandManager.registerCommand('haruspex.faulty.handler', faultyHandler);
      
      // The registration should succeed even if handler might fail during execution
      const registered = commandManager.getRegisteredCommands();
      expect(registered.some(cmd => cmd.commandId === 'haruspex.faulty.handler')).toBe(true);
    });
  });
});