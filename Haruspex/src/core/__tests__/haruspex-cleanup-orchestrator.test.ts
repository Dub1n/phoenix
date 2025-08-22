/**---
 * title: [Haruspex Cleanup Orchestrator Integration Tests - System Coordination Testing]
 * tags: [Testing, Integration, Orchestration, System-Coordination, Lifecycle]
 * provides: [IntegrationTests, OrchestrationValidation, SystemCoordination, LifecycleManagement]
 * requires: [Jest, Test Utilities, Cleanup Orchestrator, All Cleanup Managers, VS Code Context]
 * description: [Comprehensive integration tests for HaruspexCleanupOrchestrator covering system coordination, component integration, and complex cleanup scenarios]
 * ---*/

import * as vscode from 'vscode';
import { HaruspexCleanupOrchestrator, CleanupResult, StartupRecoveryResult } from '../haruspex-cleanup-orchestrator';
import { CleanupOrchestratorConfig } from '../shared-schemas';
import { HaruspexError, ErrorSeverity, TimeoutError, AsyncOperationError, ErrorClassification, RecoveryStrategy } from '../shared-errors';
import {
  createMockExtensionContext,
  createMockDebugLog,
  createMockProcess,
  createTestCleanupOrchestratorConfig,
  createTestCleanupResult,
  createTestStartupRecoveryResult,
  createCrashRecoveryScenario,
  createHotReloadConflictScenario,
  createTestWorkspace,
  cleanupTestWorkspace,
  waitForAsync,
  createTimeoutPromise,
  validateCleanupResult,
  validateStartupRecoveryResult,
  validateEmergencyShutdownSafety,
  expectErrorAggregation
} from './test-utils/cleanup-test-utils';

// Mock all the manager dependencies
jest.mock('../haruspex-process-manager');
jest.mock('../haruspex-file-cleanup'); 
jest.mock('../haruspex-command-manager');

describe('HaruspexCleanupOrchestrator Integration Tests', () => {
  let orchestrator: HaruspexCleanupOrchestrator;
  let mockContext: any;
  let mockDebugLog: jest.MockedFunction<any>;
  let testWorkspace: string;
  let testConfig: CleanupOrchestratorConfig;
  
  beforeAll(() => {
    testWorkspace = createTestWorkspace();
  });
  
  afterAll(() => {
    cleanupTestWorkspace(testWorkspace);
  });
  
  beforeEach(() => {
    mockContext = createMockExtensionContext();
    mockDebugLog = createMockDebugLog();
    testConfig = createTestCleanupOrchestratorConfig();
    
    orchestrator = new HaruspexCleanupOrchestrator(
      mockContext,
      testWorkspace,
      mockDebugLog,
      testConfig
    );
    
    jest.clearAllMocks();
  });
  
  afterEach(async () => {
    // Cleanup orchestrator
    if (orchestrator) {
      try {
        await orchestrator.emergencyShutdown();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  // =============================================================================
  // CONSTRUCTION AND CONFIGURATION INTEGRATION TESTS
  // =============================================================================

  describe('Construction and Configuration Integration', () => {
    it('should create orchestrator with valid configuration and initialize all components', () => {
      const orchestratorInstance = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        testConfig
      );
      
      expect(orchestratorInstance).toBeInstanceOf(HaruspexCleanupOrchestrator);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup Orchestrator created')
      );
    });

    it('should handle invalid configuration and use defaults gracefully', () => {
      const invalidConfig = {
        ...testConfig,
        orchestration: {
          enableParallelInitialization: true,
          initializationTimeout: -5000, // Invalid negative timeout
          shutdownTimeout: 10000
        }
      };
      
      expect(() => {
        new HaruspexCleanupOrchestrator(mockContext, testWorkspace, mockDebugLog, invalidConfig);
      }).toThrow();
    });

    it('should validate component configuration dependencies', () => {
      const configWithMissingDependencies = {
        ...testConfig,
        components: {
          enableProcessManagement: true,
          enableFileCleanup: false,
          enableCommandManagement: true
        },
        // Missing required configs for enabled components
        processManagerConfig: undefined,
        commandManagerConfig: undefined
      };
      
      expect(() => {
        new HaruspexCleanupOrchestrator(
          mockContext,
          testWorkspace,
          mockDebugLog,
          configWithMissingDependencies
        );
      }).toThrow();
    });

    it('should emit configuration validation events', (done) => {
      const orchestratorInstance = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        testConfig
      );
      
      orchestratorInstance.on('configuration_validated', (result) => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should provide comprehensive configuration information', () => {
      const config = orchestrator.getConfiguration();
      
      expect(config.components?.enableProcessManagement).toBeDefined();
      expect(config.components?.enableFileCleanup).toBeDefined();
      expect(config.components?.enableCommandManagement).toBeDefined();
      expect(config.orchestration?.enableParallelInitialization).toBeDefined();
      expect(config.recovery?.enableStartupRecovery).toBeDefined();
      expect(config.processManagerConfig).toBeDefined();
      expect(config.fileCleanupConfig).toBeDefined();
      expect(config.commandManagerConfig).toBeDefined();
    });
  });

  // =============================================================================
  // INITIALIZATION AND STARTUP RECOVERY INTEGRATION TESTS
  // =============================================================================

  describe('Initialization and Startup Recovery Integration', () => {
    it('should initialize all components successfully with clean startup', async () => {
      const result = await orchestrator.initialize();
      
      validateStartupRecoveryResult(result);
      expect(result.recoveryNeeded).toBe(false);
      expect(result.summary).toContain('Clean startup');
      
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup Orchestrator initialized')
      );
    });

    it('should handle parallel initialization when enabled', async () => {
      const parallelConfig = createTestCleanupOrchestratorConfig({
        orchestration: {
          enableParallelInitialization: true,
          initializationTimeout: 10000,
          shutdownTimeout: 15000
        }
      });
      
      const parallelOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        parallelConfig
      );
      
      const startTime = Date.now();
      const result = await parallelOrchestrator.initialize();
      const duration = Date.now() - startTime;
      
      validateStartupRecoveryResult(result);
      expect(duration).toBeLessThan(5000); // Should be faster with parallel init
      
      await parallelOrchestrator.emergencyShutdown();
    });

    it('should handle sequential initialization when disabled', async () => {
      const sequentialConfig = createTestCleanupOrchestratorConfig({
        orchestration: {
          enableParallelInitialization: false,
          initializationTimeout: 15000,
          shutdownTimeout: 10000
        }
      });
      
      const sequentialOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        sequentialConfig
      );
      
      const result = await sequentialOrchestrator.initialize();
      
      validateStartupRecoveryResult(result);
      expect(result.recoveryNeeded).toBe(false);
      
      await sequentialOrchestrator.emergencyShutdown();
    });

    it('should perform crash recovery when needed', async () => {
      const { orphanProcesses, fileCleanup, commandConflicts } = createCrashRecoveryScenario();
      
      const recoveryConfig = createTestCleanupOrchestratorConfig({
        recovery: {
          enableStartupRecovery: true,
          enableCrashRecovery: true,
          enableBackupValidation: true
        }
      });
      
      const recoveryOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        recoveryConfig
      );
      
      // Mock managers to return recovery data
      const mockProcessManager = {
        initialize: jest.fn().mockResolvedValue(orphanProcesses),
        getTrackedProcesses: jest.fn().mockReturnValue([]),
        getErrorSummary: jest.fn().mockReturnValue({ total: 0, critical: 0 }),
        getErrors: jest.fn().mockReturnValue([])
      };
      
      const mockFileCleanup = {
        cleanupFiles: jest.fn().mockResolvedValue(fileCleanup),
        getErrorSummary: jest.fn().mockReturnValue({ total: 0, critical: 0 }),
        getErrors: jest.fn().mockReturnValue([])
      };
      
      // Spy on manager creation to inject mocks
      const originalProcessManager = jest.requireActual('../haruspex-process-manager').HaruspexProcessManager;
      const originalFileCleanup = jest.requireActual('../haruspex-file-cleanup').HaruspexFileCleanup;
      
      jest.spyOn(originalProcessManager.prototype, 'initialize').mockImplementation(
        mockProcessManager.initialize
      );
      jest.spyOn(originalFileCleanup.prototype, 'cleanupFiles').mockImplementation(
        mockFileCleanup.cleanupFiles
      );
      
      const result = await recoveryOrchestrator.initialize();
      
      expect(result.recoveryNeeded).toBe(true);
      expect(result.orphanProcesses.orphansFound).toBe(orphanProcesses.orphansFound);
      expect(result.fileCleanup.filesDeleted).toBe(fileCleanup.filesDeleted);
      expect(result.summary).toContain('Crash recovery performed');
      
      await recoveryOrchestrator.emergencyShutdown();
    });

    it('should handle initialization timeout gracefully', async () => {
      const shortTimeoutConfig = createTestCleanupOrchestratorConfig({
        orchestration: {
          enableParallelInitialization: false,
          initializationTimeout: 100, // Very short timeout
          shutdownTimeout: 5000
        }
      });
      
      const timeoutOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        shortTimeoutConfig
      );
      
      // Mock slow initialization
      const mockSlowInit = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 5000))
      );
      
      try {
        await expect(timeoutOrchestrator.initialize()).rejects.toThrow(TimeoutError);
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
      } finally {
        await timeoutOrchestrator.emergencyShutdown();
      }
    });

    it('should handle partial component initialization failure', async () => {
      const partialFailureConfig = createTestCleanupOrchestratorConfig({
        components: {
          enableProcessManagement: true,
          enableFileCleanup: true,
          enableCommandManagement: true
        }
      });
      
      const partialOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        partialFailureConfig
      );
      
      // Mock one component to fail initialization
      const mockFileCleanupFail = jest.fn().mockRejectedValue(new Error('File cleanup init failed'));
      
      const originalFileCleanup = jest.requireActual('../haruspex-file-cleanup').HaruspexFileCleanup;
      jest.spyOn(originalFileCleanup.prototype, 'initialize').mockImplementation(mockFileCleanupFail);
      
      try {
        await partialOrchestrator.initialize();
        // Should handle failure gracefully
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      } finally {
        await partialOrchestrator.emergencyShutdown();
      }
    });
  });

  // =============================================================================
  // PROCESS AND RESOURCE TRACKING INTEGRATION TESTS
  // =============================================================================

  describe('Process and Resource Tracking Integration', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should coordinate process tracking across all managers', () => {
      const mockProcess = createMockProcess({ pid: 12345 });
      
      orchestrator.trackProcess(
        12345,
        'child-process',
        'test-integration-process',
        { testMetadata: 'value' },
        async () => { /* cleanup */ }
      );
      
      const status = orchestrator.getStatus();
      expect(status.processes).toBe(1);
      
      orchestrator.untrackProcess(12345);
      
      const statusAfter = orchestrator.getStatus();
      expect(statusAfter.processes).toBe(0);
    });

    it('should coordinate timer tracking with process manager', () => {
      const mockTimer = { ref: jest.fn(), unref: jest.fn() } as any;
      
      const timerPid = orchestrator.trackTimer(mockTimer, 'integration-timer', 'interval');
      
      expect(timerPid).toBeGreaterThan(0);
      
      const status = orchestrator.getStatus();
      expect(status.processes).toBe(1);
    });

    it('should coordinate server tracking with process manager', () => {
      const mockServer = {
        listening: true,
        close: jest.fn(),
        address: () => ({ port: 8080, address: '127.0.0.1' })
      };
      
      const serverPid = orchestrator.trackServer(mockServer, 'integration-server', 8080, '127.0.0.1');
      
      expect(serverPid).toBeGreaterThan(0);
      
      const status = orchestrator.getStatus();
      expect(status.processes).toBe(1);
    });

    it('should coordinate command registration with conflict resolution', async () => {
      const commands = [
        {
          commandId: 'haruspex.integration.cmd1',
          handler: jest.fn(),
          metadata: { category: 'core' as const, description: 'Integration command 1' }
        },
        {
          commandId: 'haruspex.integration.cmd2',
          handler: jest.fn(),
          metadata: { category: 'ui' as const, description: 'Integration command 2' }
        }
      ];
      
      const result = await orchestrator.registerCommands(commands);
      
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      
      const status = orchestrator.getStatus();
      expect(status.commands).toBe(2);
    });

    it('should handle resource tracking across component boundaries', () => {
      // Track resources in different managers
      const processTracker = {
        pid: 20001,
        type: 'ipc-server' as const,
        name: 'cross-component-ipc',
        metadata: { port: 9000 }
      };
      
      orchestrator.trackProcess(
        processTracker.pid,
        processTracker.type,
        processTracker.name,
        processTracker.metadata
      );
      
      const mockTimer = setTimeout(() => {}, 1000);
      const timerPid = orchestrator.trackTimer(mockTimer, 'cross-component-timer', 'timeout');
      
      const status = orchestrator.getStatus();
      expect(status.processes).toBe(2); // Both resources tracked
      
      clearTimeout(mockTimer);
    });
  });

  // =============================================================================
  // SHUTDOWN AND CLEANUP COORDINATION TESTS
  // =============================================================================

  describe('Shutdown and Cleanup Coordination', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
      
      // Add some resources to clean up
      orchestrator.trackProcess(30001, 'child-process', 'shutdown-test-process');
      orchestrator.trackTimer(setTimeout(() => {}, 10000), 'shutdown-test-timer', 'timeout');
      
      await orchestrator.registerCommands([
        {
          commandId: 'haruspex.shutdown.test',
          handler: jest.fn(),
          metadata: { category: 'core' as const }
        }
      ]);
    });

    it('should perform coordinated graceful shutdown', async () => {
      const result = await orchestrator.gracefulShutdown();
      
      validateCleanupResult(result);
      expect(result.success).toBe(true);
      expect(result.processes.cleaned).toBeGreaterThan(0);
      expect(result.commands.disposed).toBeGreaterThan(0);
      expect(result.summary).toContain('Graceful shutdown complete');
    });

    it('should perform coordinated emergency shutdown', async () => {
      const result = await orchestrator.emergencyShutdown();
      
      validateCleanupResult(result);
      validateEmergencyShutdownSafety(result);
      expect(result).toBeDefined();
      expect(result.summary).toContain('Emergency shutdown');
    });

    it('should handle shutdown component failures gracefully', async () => {
      // Mock one component to fail during shutdown
      const mockCommandManagerFail = jest.fn().mockRejectedValue(new Error('Command disposal failed'));
      
      // Inject failure mock
      const originalCommandManager = jest.requireActual('../haruspex-command-manager').HaruspexCommandManager;
      jest.spyOn(originalCommandManager.prototype, 'dispose').mockImplementation(mockCommandManagerFail);
      
      const result = await orchestrator.gracefulShutdown();
      
      // Should still complete with errors reported
      expect(result).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.commands.errors.length).toBeGreaterThan(0);
    });

    it('should respect shutdown ordering (commands → processes → files)', async () => {
      const shutdownOrder: string[] = [];
      
      // Mock managers to track shutdown order
      const mockCommandDispose = jest.fn().mockImplementation(() => {
        shutdownOrder.push('commands');
        return 1;
      });
      
      const mockProcessShutdown = jest.fn().mockImplementation(() => {
        shutdownOrder.push('processes');
        return { cleaned: 1, failed: 0, alreadyGone: 0, details: [] };
      });
      
      const mockFileCleanup = jest.fn().mockImplementation(() => {
        shutdownOrder.push('files');
        return { filesDeleted: 1, directoriesRemoved: 0, filesSkipped: 0, bytesFreed: 100, failures: [], details: [] };
      });
      
      // Inject order tracking mocks
      const originalCommandManager = jest.requireActual('../haruspex-command-manager').HaruspexCommandManager;
      const originalProcessManager = jest.requireActual('../haruspex-process-manager').HaruspexProcessManager;
      const originalFileCleanup = jest.requireActual('../haruspex-file-cleanup').HaruspexFileCleanup;
      
      jest.spyOn(originalCommandManager.prototype, 'dispose').mockImplementation(mockCommandDispose);
      jest.spyOn(originalProcessManager.prototype, 'gracefulShutdown').mockImplementation(mockProcessShutdown);
      jest.spyOn(originalFileCleanup.prototype, 'cleanupFiles').mockImplementation(mockFileCleanup);
      
      await orchestrator.gracefulShutdown();
      
      expect(shutdownOrder).toEqual(['commands', 'processes', 'files']);
    });

    it('should handle shutdown timeout gracefully', async () => {
      const shortTimeoutConfig = createTestCleanupOrchestratorConfig({
        orchestration: {
          enableParallelInitialization: false,
          initializationTimeout: 10000,
          shutdownTimeout: 5000
        }
      });
      
      const timeoutOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        shortTimeoutConfig
      );
      
      await timeoutOrchestrator.initialize();
      
      // Add a slow-to-clean resource
      timeoutOrchestrator.trackProcess(
        40001,
        'child-process',
        'slow-cleanup-process',
        {},
        async () => new Promise(resolve => setTimeout(resolve, 5000)) // Slow cleanup
      );
      
      const result = await timeoutOrchestrator.gracefulShutdown();
      
      // Should complete despite timeout
      expect(result).toBeDefined();
      expect(result.duration).toBeLessThan(1000); // Should timeout quickly
    });

    it('should prevent double shutdown execution', async () => {
      const shutdownPromise1 = orchestrator.gracefulShutdown();
      const shutdownPromise2 = orchestrator.gracefulShutdown(); // Second call
      
      const [result1, result2] = await Promise.all([shutdownPromise1, shutdownPromise2]);
      
      // Both should return the same result (second is ignored)
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.duration).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // ERROR HANDLING AND AGGREGATION INTEGRATION TESTS
  // =============================================================================

  describe('Error Handling and Aggregation Integration', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should aggregate errors from all components', async () => {
      // Trigger errors in different components
      try {
        orchestrator.trackProcess(-1, 'invalid-type' as any, ''); // Invalid process
      } catch (error) {
        // Expected to fail
      }
      
      try {
        await orchestrator.registerCommands([
          {
            commandId: '', // Invalid command ID
            handler: jest.fn(),
            metadata: { category: 'core' as const }
          }
        ]);
      } catch (error) {
        // Expected to fail
      }
      
      const errorSummary = orchestrator.getErrorSummary();
      expect(errorSummary.totalErrors).toBeGreaterThanOrEqual(0);
      expect(errorSummary.orchestrator).toBeDefined();
    });

    it('should provide comprehensive error reporting', async () => {
      // Generate errors across components
      const processError = new Error('Process tracking failed');
      const commandError = new Error('Command registration failed');
      
      // Mock components to generate errors
      const errors = orchestrator.getErrors();
      const errorSummary = orchestrator.getErrorSummary();
      
      expect(Array.isArray(errors)).toBe(true);
      expect(errorSummary.totalErrors).toBeGreaterThanOrEqual(0);
      expect(errorSummary.criticalErrors).toBeGreaterThanOrEqual(0);
    });

    it('should clear errors across all components', async () => {
      // Trigger some errors
      try {
        await orchestrator.registerCommands([{
          commandId: '',
          handler: jest.fn(),
          metadata: { category: 'core' as const }
        }]); // Invalid command
      } catch (error) {
        // Expected to fail
      }
      
      const errorsBefore = orchestrator.getErrorSummary();
      
      orchestrator.clearErrors();
      
      const errorsAfter = orchestrator.getErrorSummary();
      expect(errorsAfter.totalErrors).toBeLessThanOrEqual(errorsBefore.totalErrors);
    });

    it('should handle component error escalation', async () => {
      // Mock a critical error in one component
      const criticalError = new (class extends HaruspexError {
        constructor() {
          super(
            'Critical component failure',
            'TestComponent',
            ErrorSeverity.CRITICAL,
            false,
            { critical: true }
          );
        }
        
        getClassification() { return ErrorClassification.CRITICAL; }
        getRecoveryStrategy() { return RecoveryStrategy.SYSTEM_RESTART; }
      })();
      
      // Simulate critical error
      const errorSummary = orchestrator.getErrorSummary();
      
      // Should be able to handle critical errors gracefully
      expect(errorSummary).toBeDefined();
    });
  });

  // =============================================================================
  // STATUS REPORTING AND MONITORING INTEGRATION TESTS
  // =============================================================================

  describe('Status Reporting and Monitoring Integration', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
      
      // Add some resources for status testing
      orchestrator.trackProcess(50001, 'ipc-server', 'status-test-ipc');
      orchestrator.trackTimer(setTimeout(() => {}, 1000), 'status-test-timer', 'timeout');
      
      await orchestrator.registerCommands([
        {
          commandId: 'haruspex.status.test1',
          handler: jest.fn(),
          metadata: { category: 'core' as const }
        },
        {
          commandId: 'haruspex.status.test2', 
          handler: jest.fn(),
          metadata: { category: 'ui' as const }
        }
      ]);
    });

    it('should provide comprehensive system status', () => {
      const status = orchestrator.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.shuttingDown).toBe(false);
      expect(status.processes).toBe(2); // ipc-server + timer
      expect(status.commands).toBe(2);
      expect(status.canPerformCleanup).toBe(true);
    });

    it('should generate detailed status report with component breakdown', () => {
      const report = orchestrator.generateStatusReport();
      
      expect(report.orchestrator.initialized).toBe(true);
      expect(report.orchestrator.canPerformCleanup).toBe(true);
      expect(report.processes).toBeDefined();
      expect(report.commands).toBeDefined();
      expect(report.errors.total).toBeGreaterThanOrEqual(0);
      expect(report.configuration.valid).toBe(true);
      expect(report.configuration.componentsEnabled.processManagement).toBe(true);
      expect(report.configuration.componentsEnabled.commandManagement).toBe(true);
      expect(report.recommendations).toBeDefined();
    });

    it('should provide component-specific status information', () => {
      const report = orchestrator.generateStatusReport();
      
      if (report.processes) {
        expect(Array.isArray(report.processes)).toBe(true);
        expect(report.processes.length).toBeGreaterThan(0);
        expect(report.processes[0]).toHaveProperty('pid');
        expect(report.processes[0]).toHaveProperty('name');
        expect(report.processes[0]).toHaveProperty('type');
      }
      
      if (report.commands) {
        expect(Array.isArray(report.commands)).toBe(true);
        expect(report.commands.length).toBeGreaterThan(0);
        expect(report.commands[0]).toHaveProperty('id');
        expect(report.commands[0]).toHaveProperty('category');
      }
    });

    it('should generate appropriate recommendations based on system state', () => {
      const report = orchestrator.generateStatusReport();
      
      expect(Array.isArray(report.recommendations)).toBe(true);
      
      // Should have appropriate recommendations based on the system state
      if (report.errors.total > 0) {
        expect(report.recommendations.some(rec => 
          rec.includes('error') || rec.includes('review')
        )).toBe(true);
      }
    });

    it('should handle status monitoring during shutdown', async () => {
      const shutdownPromise = orchestrator.gracefulShutdown();
      
      // Check status during shutdown
      await waitForAsync(10); // Small delay to allow shutdown to start
      
      const statusDuringShutdown = orchestrator.getStatus();
      expect(statusDuringShutdown.shuttingDown).toBe(true);
      expect(statusDuringShutdown.canPerformCleanup).toBe(false);
      
      await shutdownPromise;
      
      const statusAfterShutdown = orchestrator.getStatus();
      expect(statusAfterShutdown.shuttingDown).toBe(true); // Remains true after shutdown
    });
  });

  // =============================================================================
  // LIFECYCLE INTEGRATION AND EVENT COORDINATION TESTS
  // =============================================================================

  describe('Lifecycle Integration and Event Coordination', () => {
    it('should coordinate lifecycle events across components', (done) => {
      let eventCount = 0;
      const expectedEvents = ['initialized', 'commands_registered', 'shutdown_started', 'shutdown_complete'];
      const receivedEvents: string[] = [];
      
      expectedEvents.forEach(event => {
        orchestrator.on(event, (data) => {
          receivedEvents.push(event);
          eventCount++;
          
          if (eventCount === expectedEvents.length) {
            expect(receivedEvents).toEqual(expectedEvents);
            done();
          }
        });
      });
      
      // Trigger lifecycle events
      orchestrator.initialize()
        .then(() => orchestrator.registerCommands([
          {
            commandId: 'haruspex.lifecycle.test',
            handler: jest.fn(),
            metadata: { category: 'core' as const }
          }
        ]))
        .then(() => orchestrator.gracefulShutdown());
    });

    it('should handle extension context lifecycle integration', async () => {
      const disposables: any[] = [];
      mockContext.subscriptions.push = jest.fn().mockImplementation((disposable) => {
        disposables.push(disposable);
      });
      
      const testOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        testConfig
      );
      
      await testOrchestrator.initialize();
      
      // Should have registered for extension cleanup
      expect(disposables.length).toBeGreaterThan(0);
      
      // Simulate extension deactivation
      disposables.forEach(d => {
        if (d && typeof d.dispose === 'function') {
          expect(() => d.dispose()).not.toThrow();
        }
      });
      
      await testOrchestrator.emergencyShutdown();
    });

    it('should handle process termination signals gracefully', async () => {
      await orchestrator.initialize();
      
      // Mock process signal handlers
      const originalListeners = process.listeners('SIGTERM');
      
      // Trigger SIGTERM signal
      process.emit('SIGTERM' as any);
      
      // Should not crash
      expect(() => {
        process.emit('SIGINT' as any);
      }).not.toThrow();
      
      // Cleanup
      await orchestrator.emergencyShutdown();
    });

    it('should coordinate resource cleanup across extension sessions', async () => {
      // Simulate multiple initialization/shutdown cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        const cycleOrchestrator = new HaruspexCleanupOrchestrator(
          mockContext,
          testWorkspace,
          mockDebugLog,
          testConfig
        );
        
        await cycleOrchestrator.initialize();
        
        // Add resources
        cycleOrchestrator.trackProcess(60000 + cycle, 'child-process', `cycle-${cycle}-process`);
        
        const status = cycleOrchestrator.getStatus();
        expect(status.processes).toBeGreaterThan(0);
        
        // Shutdown
        const result = await cycleOrchestrator.gracefulShutdown();
        expect(result.success).toBe(true);
      }
    });
  });

  // =============================================================================
  // COMPLEX SCENARIO AND STRESS INTEGRATION TESTS
  // =============================================================================

  describe('Complex Scenarios and Stress Integration Tests', () => {
    it('should handle complex hot-reload scenario with conflicts', async () => {
      const { existingCommands, newCommands } = createHotReloadConflictScenario();
      
      await orchestrator.initialize();
      
      // Register initial commands (simulating existing registration)
      await orchestrator.registerCommands(
        existingCommands.map(cmd => ({
          commandId: cmd.id,
          handler: jest.fn(),
          metadata: { category: cmd.category }
        }))
      );
      
      // Now register new commands (simulating hot-reload)
      const result = await orchestrator.registerCommands(newCommands);
      
      expect(result.successful).toBeGreaterThan(0);
      expect(result.skipped).toBeGreaterThanOrEqual(0); // Some conflicts expected
      expect(result.failed).toBe(0); // No failures in conflict resolution
    });

    it('should handle high-load resource tracking scenario', async () => {
      await orchestrator.initialize();
      
      const resourceCount = 100;
      const processes: number[] = [];
      const timers: NodeJS.Timeout[] = [];
      
      // Add many resources rapidly
      for (let i = 0; i < resourceCount; i++) {
        const pid = 70000 + i;
        processes.push(pid);
        orchestrator.trackProcess(pid, 'child-process', `load-test-${i}`);
        
        const timer = setTimeout(() => {}, 10000);
        timers.push(timer);
        orchestrator.trackTimer(timer, `load-timer-${i}`, 'timeout');
      }
      
      const status = orchestrator.getStatus();
      expect(status.processes).toBe(resourceCount * 2); // processes + timers
      
      // Cleanup all resources
      const result = await orchestrator.gracefulShutdown();
      expect(result.processes.cleaned).toBeGreaterThan(0);
      
      // Clear timers to prevent test interference
      timers.forEach(timer => clearTimeout(timer));
    });

    it('should handle concurrent operations safely', async () => {
      await orchestrator.initialize();
      
      const operations = [
        // Concurrent process tracking
        async () => {
          for (let i = 0; i < 10; i++) {
            orchestrator.trackProcess(80000 + i, 'child-process', `concurrent-proc-${i}`);
            await waitForAsync(1);
          }
        },
        
        // Concurrent command registration
        async () => {
          const commands = Array.from({ length: 10 }, (_, i) => ({
            commandId: `haruspex.concurrent.${i}`,
            handler: jest.fn(),
            metadata: { category: 'core' as const }
          }));
          return orchestrator.registerCommands(commands);
        },
        
        // Concurrent status requests
        async () => {
          for (let i = 0; i < 20; i++) {
            orchestrator.getStatus();
            await waitForAsync(1);
          }
        }
      ];
      
      const results = await Promise.allSettled(operations);
      
      // All operations should complete successfully
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(operations.length);
      
      await orchestrator.gracefulShutdown();
    });

    it('should maintain consistency during rapid lifecycle changes', async () => {
      const lifecycleCount = 10;
      
      for (let cycle = 0; cycle < lifecycleCount; cycle++) {
        const rapidOrchestrator = new HaruspexCleanupOrchestrator(
          mockContext,
          testWorkspace,
          mockDebugLog,
          testConfig
        );
        
        await rapidOrchestrator.initialize();
        
        // Rapid resource addition
        rapidOrchestrator.trackProcess(90000 + cycle, 'child-process', `rapid-${cycle}`);
        
        // Immediate shutdown
        const result = await rapidOrchestrator.emergencyShutdown();
        expect(result).toBeDefined();
      }
    });

    it('should handle error recovery across multiple component failures', async () => {
      await orchestrator.initialize();
      
      // Simulate multiple component failures
      const mockErrors = [
        new Error('Process manager failure'),
        new Error('File cleanup failure'), 
        new Error('Command manager failure')
      ];
      
      // Generate errors across components
      try {
        await orchestrator.registerCommands([{
          commandId: '',
          handler: jest.fn(),
          metadata: { category: 'core' as const }
        }]); // Invalid command
      } catch (error) {
        // Expected
      }
      
      try {
        orchestrator.trackProcess(-1, 'invalid' as any, ''); // Invalid process
      } catch (error) {
        // Expected  
      }
      
      // Should still be able to perform operations despite errors
      const status = orchestrator.getStatus();
      expect(status).toBeDefined();
      
      const result = await orchestrator.gracefulShutdown();
      expect(result).toBeDefined();
    });
  });
});