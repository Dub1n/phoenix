/**---
 * title: [Haruspex Process Manager Tests - Comprehensive Unit Testing]
 * tags: [Testing, Process-Management, Safety, Validation, Coverage]
 * provides: [UnitTests, SafetyValidation, ConfigurationTesting, ErrorHandling]
 * requires: [Jest, Test Utilities, Process Manager, Shared Schemas, Shared Errors]
 * description: [Comprehensive unit tests for HaruspexProcessManager covering Priority 1 fixes, Priority 2 enhancements, and critical safety mechanisms]
 * ---*/

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { HaruspexProcessManager, ProcessTracker, ProcessCleanupResult, OrphanDetectionResult } from '../haruspex-process-manager';
import { ProcessManagerConfig } from '../shared-schemas';
import { HaruspexError, ProcessManagementError, ProcessNotFoundError, ProcessTerminationError, ProcessOwnershipError, TimeoutError, ErrorSeverity } from '../shared-errors';
import {
  createMockDebugLog,
  createTestProcessManagerConfig,
  createTestProcessTracker,
  createTestProcessCleanupResult,
  createTestOrphanDetectionResult,
  createMockProcess,
  createTestWorkspace,
  cleanupTestWorkspace,
  waitForAsync,
  createTimeoutPromise,
  validateProcessOwnership,
  expectErrorAggregation
} from './test-utils/cleanup-test-utils';

// Mock Node.js process APIs
jest.mock('fs');
jest.mock('child_process');

describe('HaruspexProcessManager', () => {
  let processManager: HaruspexProcessManager;
  let mockDebugLog: jest.MockedFunction<any>;
  let testWorkspace: string;
  let testConfig: ProcessManagerConfig;
  
  beforeAll(() => {
    testWorkspace = createTestWorkspace();
  });
  
  afterAll(() => {
    cleanupTestWorkspace(testWorkspace);
  });
  
  beforeEach(() => {
    mockDebugLog = createMockDebugLog();
    testConfig = createTestProcessManagerConfig({
      tracking: {
        trackingFile: path.join(testWorkspace, 'test-tracking.json'),
        enableHeartbeat: false, // Disable for unit tests
        enablePersistentTracking: true
      }
    });
    
    processManager = new HaruspexProcessManager(testWorkspace, mockDebugLog, testConfig);
    
    // Clear any existing mock calls
    jest.clearAllMocks();
  });
  
  afterEach(async () => {
    // Cleanup any tracked processes
    if (processManager) {
      try {
        await processManager.emergencyShutdown();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  // =============================================================================
  // CONSTRUCTION AND CONFIGURATION TESTS
  // =============================================================================

  describe('Constructor and Configuration', () => {
    it('should create process manager with valid configuration', () => {
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, testConfig);
      expect(manager).toBeInstanceOf(HaruspexProcessManager);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('Process Manager created')
      );
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = { ...testConfig, gracefulTimeout: -1000 }; // Invalid timeout
      
      expect(() => {
        new HaruspexProcessManager(testWorkspace, mockDebugLog, invalidConfig);
      }).toThrow();
    });

    it('should use default configuration when partial config provided', () => {
      const partialConfig: Partial<ProcessManagerConfig> = {
        enableDetailedLogging: false
      };
      
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, partialConfig);
      expect(manager).toBeInstanceOf(HaruspexProcessManager);
      
      const config = manager.getConfiguration();
      expect(config.enableDetailedLogging).toBe(false);
      expect(config.enableSafetyChecks).toBe(true); // Should use default
    });

    it('should validate session ID format', () => {
      const configWithInvalidSession = {
        ...testConfig,
        sessionId: 'invalid-session-format!'
      };
      
      expect(() => {
        new HaruspexProcessManager(testWorkspace, mockDebugLog, configWithInvalidSession);
      }).toThrow();
    });

    it('should emit configuration events', (done) => {
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, testConfig);
      
      manager.on('configuration_validated', (result) => {
        expect(result.success).toBe(true);
        done();
      });
    });
  });

  // =============================================================================
  // INITIALIZATION AND ORPHAN DETECTION TESTS  
  // =============================================================================

  describe('Initialization and Orphan Detection', () => {
    it('should initialize successfully with clean state', async () => {
      const result = await processManager.initialize();
      
      expect(result.orphansFound).toBe(0);
      expect(result.orphansCleaned).toBe(0);
      expect(result.orphansRemaining).toEqual([]);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('Process Manager initialized')
      );
    });

    it('should detect and clean orphaned processes', async () => {
      // Create a tracking file with orphaned processes
      const orphanData = {
        processes: [
          { pid: 99999, name: 'orphan-1', type: 'ipc-server', startTime: Date.now() - 60000 },
          { pid: 99998, name: 'orphan-2', type: 'file-watcher', startTime: Date.now() - 30000 }
        ]
      };
      
      const trackingFile = testConfig.tracking!.trackingFile;
      fs.writeFileSync(trackingFile, JSON.stringify(orphanData));
      
      // Mock process.kill to simulate successful termination
      const originalKill = process.kill;
      const mockKill = jest.fn().mockImplementation((pid: number, signal?: string | number) => {
        // Simulate process doesn't exist (already cleaned)
        const error = new Error('ESRCH: No such process');
        (error as any).code = 'ESRCH';
        throw error;
      });
      process.kill = mockKill as any;
      
      try {
        const result = await processManager.initialize();
        
        expect(result.orphansFound).toBe(2);
        expect(result.orphansCleaned).toBe(2); // Both should be "cleaned" (already gone)
        expect(result.orphansRemaining).toEqual([]);
        expect(result.details.length).toBe(2);
      } finally {
        process.kill = originalKill;
      }
    });

    it('should handle corrupted tracking file gracefully', async () => {
      // Create corrupted tracking file
      const trackingFile = testConfig.tracking!.trackingFile;
      fs.writeFileSync(trackingFile, 'invalid json content {');
      
      const result = await processManager.initialize();
      
      expect(result.orphansFound).toBe(0);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load tracking file'),
        'warning'
      );
    });

    it('should respect orphan detection configuration', async () => {
      const configWithoutOrphanDetection = createTestProcessManagerConfig({
        orphanDetection: {
          enableOrphanDetection: false,
          orphanDetectionThreshold: 30000,
          enableAutomaticCleanup: false
        }
      });
      
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, configWithoutOrphanDetection);
      const result = await manager.initialize();
      
      expect(result.orphansFound).toBe(0);
      expect(result.orphansCleaned).toBe(0);
    });

    it('should handle initialization timeout', async () => {
      const shortTimeoutConfig = createTestProcessManagerConfig({
        timing: {
          gracefulShutdownTimeout: 1, // Very short timeout
          heartbeatInterval: 1000,
          retryDelay: 100,
          maxRetryAttempts: 1
        }
      });
      
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, shortTimeoutConfig);
      
      // Mock a slow initialization
      const mockReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        // Simulate slow file read - return empty tracking data
        return JSON.stringify({ processes: [] });
      });
      
      try {
        const result = await manager.initialize();
        expect(result).toBeDefined(); // Should still complete
      } finally {
        mockReadFileSync.mockRestore();
      }
    });
  });

  // =============================================================================
  // PROCESS TRACKING TESTS (Priority 1 Fixes)
  // =============================================================================

  describe('Process Tracking - Priority 1 Fixes', () => {
    it('should track process with complete metadata', () => {
      const processTracker = createTestProcessTracker({
        pid: 12345,
        name: 'test-ipc-server',
        type: 'ipc-server',
        metadata: {
          command: 'node ipc-server.js',
          parentPid: process.pid,
          sessionId: testConfig.sessionId,
          resources: ['port:8080', '/tmp/ipc.sock']
        }
      });
      
      processManager.trackProcess(processTracker);
      
      const tracked = processManager.getTrackedProcesses();
      expect(tracked).toHaveLength(1);
      expect(tracked[0]).toMatchObject(processTracker);
      expect(tracked[0].startTime).toBeGreaterThan(0);
    });

    it('should validate process ownership before tracking', () => {
      const processTracker = createTestProcessTracker({
        pid: 54321,
        metadata: {
          parentPid: 99999 // Different parent PID
        }
      });
      
      const configWithOwnershipValidation = createTestProcessManagerConfig({
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: false,
          enableFileBackup: false,
          maxAgeThreshold: 60000
        }
      });
      
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, configWithOwnershipValidation);
      
      // This should log a warning but still track (for now)
      manager.trackProcess(processTracker);
      
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('ownership verification'),
        'warning'
      );
    });

    it('should generate and assign session ID when missing', () => {
      const processTracker = createTestProcessTracker({
        metadata: {} // No session ID
      });
      
      processManager.trackProcess(processTracker);
      
      const tracked = processManager.getTrackedProcesses();
      expect(tracked[0].metadata.sessionId).toBeDefined();
      expect(tracked[0].metadata.sessionId).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it('should track timer with proper metadata', () => {
      const mockTimer = { ref: jest.fn(), unref: jest.fn() } as any;
      const timerPid = processManager.trackTimer(mockTimer, 'test-timer', 'interval');
      
      expect(timerPid).toBeGreaterThan(0);
      
      const tracked = processManager.getTrackedProcesses();
      const timerProcess = tracked.find(p => p.pid === timerPid);
      
      expect(timerProcess).toBeDefined();
      expect(timerProcess?.type).toBe('interval');
      expect(timerProcess?.name).toBe('test-timer');
      expect(timerProcess?.metadata.timerRef).toBe(mockTimer);
    });

    it('should track server with network metadata', () => {
      const mockServer = {
        listening: true,
        close: jest.fn(),
        address: () => ({ port: 8080, address: '127.0.0.1' })
      };
      
      const serverPid = processManager.trackServer(mockServer, 'test-server', 8080, '127.0.0.1');
      
      expect(serverPid).toBeGreaterThan(0);
      
      const tracked = processManager.getTrackedProcesses();
      const serverProcess = tracked.find(p => p.pid === serverPid);
      
      expect(serverProcess).toBeDefined();
      expect(serverProcess?.metadata.serverRef).toBe(mockServer);
      expect(serverProcess?.metadata.resources).toContain('port:8080');
    });

    it('should untrack process correctly', () => {
      const processTracker = createTestProcessTracker({ pid: 11111 });
      processManager.trackProcess(processTracker);
      
      expect(processManager.getTrackedProcesses()).toHaveLength(1);
      
      processManager.untrackProcess(11111);
      
      expect(processManager.getTrackedProcesses()).toHaveLength(0);
    });

    it('should handle duplicate process tracking', () => {
      const processTracker = createTestProcessTracker({ pid: 22222 });
      
      processManager.trackProcess(processTracker);
      processManager.trackProcess(processTracker); // Duplicate
      
      const tracked = processManager.getTrackedProcesses();
      expect(tracked).toHaveLength(1); // Should not duplicate
      
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('already tracked'),
        'warning'
      );
    });
  });

  // =============================================================================
  // PROCESS CLEANUP TESTS (Priority 2 Enhancements)
  // =============================================================================

  describe('Process Cleanup - Priority 2 Enhancements', () => {
    it('should perform graceful shutdown successfully', async () => {
      // Track some test processes
      const processes = [
        createTestProcessTracker({ pid: 10001, name: 'test-proc-1', type: 'child-process' }),
        createTestProcessTracker({ pid: 10002, name: 'test-proc-2', type: 'ipc-server' }),
        createTestProcessTracker({ pid: 10003, name: 'test-timer', type: 'interval' })
      ];
      
      processes.forEach(p => processManager.trackProcess(p));
      
      // Mock successful process termination
      const mockKill = jest.fn().mockReturnValue(true);
      process.kill = mockKill as any;
      
      const result = await processManager.gracefulShutdown();
      
      expect(result.cleaned).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.alreadyGone).toBe(0);
      expect(result.details).toHaveLength(3);
      
      expect(mockKill).toHaveBeenCalledTimes(3);
    });

    it('should handle process termination failures', async () => {
      const processTracker = createTestProcessTracker({ pid: 20001 });
      processManager.trackProcess(processTracker);
      
      // Mock process kill failure
      const mockKill = jest.fn().mockImplementation((pid: number) => {
        throw new Error('Operation not permitted');
      });
      process.kill = mockKill as any;
      
      const result = await processManager.gracefulShutdown();
      
      expect(result.cleaned).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.details[0].success).toBe(false);
      expect(result.details[0].error).toContain('Operation not permitted');
    });

    it('should detect already terminated processes', async () => {
      const processTracker = createTestProcessTracker({ pid: 30001 });
      processManager.trackProcess(processTracker);
      
      // Mock process doesn't exist
      const mockKill = jest.fn().mockImplementation((pid: number) => {
        const error = new Error('ESRCH: No such process');
        (error as any).code = 'ESRCH';
        throw error;
      });
      process.kill = mockKill as any;
      
      const result = await processManager.gracefulShutdown();
      
      expect(result.cleaned).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.alreadyGone).toBe(1);
      expect(result.details[0].success).toBe(true);
    });

    it('should handle emergency shutdown with force termination', async () => {
      const processTracker = createTestProcessTracker({ 
        pid: 40001, 
        type: 'child-process',
        cleanupFn: jest.fn().mockRejectedValue(new Error('Cleanup failed'))
      });
      processManager.trackProcess(processTracker);
      
      // Mock kill to succeed only with SIGKILL
      let killAttempts = 0;
      const mockKill = jest.fn().mockImplementation((pid: number, signal?: string | number) => {
        killAttempts++;
        if (signal === 'SIGKILL') {
          return true;
        }
        throw new Error('Process did not terminate gracefully');
      });
      process.kill = mockKill as any;
      
      const result = await processManager.emergencyShutdown();
      
      expect(result.cleaned).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockKill).toHaveBeenCalledWith(40001, 'SIGKILL');
    });

    it('should respect termination configuration', async () => {
      const configWithCustomTermination = createTestProcessManagerConfig({
        termination: {
          enableGracefulTermination: false,
          forceTerminationDelay: 500,
          enableSignalEscalation: false
        }
      });
      
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, configWithCustomTermination);
      const processTracker = createTestProcessTracker({ pid: 50001 });
      manager.trackProcess(processTracker);
      
      const mockKill = jest.fn().mockReturnValue(true);
      process.kill = mockKill as any;
      
      const result = await manager.gracefulShutdown();
      
      expect(result.cleaned).toBe(1);
      // Should directly use SIGKILL since graceful termination is disabled
      expect(mockKill).toHaveBeenCalledWith(50001, 'SIGKILL');
    });

    it('should handle custom cleanup functions', async () => {
      const mockCleanupFn = jest.fn().mockResolvedValue(undefined);
      const processTracker = createTestProcessTracker({ 
        pid: 60001,
        cleanupFn: mockCleanupFn
      });
      
      processManager.trackProcess(processTracker);
      
      const mockKill = jest.fn().mockReturnValue(true);
      process.kill = mockKill as any;
      
      const result = await processManager.gracefulShutdown();
      
      expect(mockCleanupFn).toHaveBeenCalled();
      expect(result.cleaned).toBe(1);
    });

    it('should handle cleanup timeouts', async () => {
      const slowCleanupFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000)) // Very slow cleanup
      );
      
      const processTracker = createTestProcessTracker({ 
        pid: 70001,
        cleanupFn: slowCleanupFn
      });
      
      const shortTimeoutConfig = createTestProcessManagerConfig({
        timing: {
          gracefulShutdownTimeout: 100, // Very short timeout
          heartbeatInterval: 1000,
          retryDelay: 50,
          maxRetryAttempts: 1
        }
      });
      
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, shortTimeoutConfig);
      manager.trackProcess(processTracker);
      
      const result = await manager.gracefulShutdown();
      
      // Should timeout and still complete
      expect(result).toBeDefined();
      expect(result.duration).toBeLessThan(1000);
    });
  });

  // =============================================================================
  // ERROR HANDLING AND RECOVERY TESTS
  // =============================================================================

  describe('Error Handling and Recovery', () => {
    it('should collect and report errors properly', async () => {
      const processTracker = createTestProcessTracker({ pid: 80001 });
      processManager.trackProcess(processTracker);
      
      // Mock process kill to throw different types of errors
      const mockKill = jest.fn().mockImplementation((pid: number) => {
        throw new ProcessTerminationError(
          `Failed to terminate process ${pid}`,
          pid,
          'test-process',
          'SIGTERM'
        );
      });
      process.kill = mockKill as any;
      
      await processManager.gracefulShutdown();
      
      const errors = processManager.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      const errorSummary = processManager.getErrorSummary();
      expect(errorSummary.total).toBeGreaterThan(0);
      expect(errorSummary.byClassification.system).toBeGreaterThan(0);
    });

    it('should handle process ownership errors', () => {
      const processTracker = createTestProcessTracker({ 
        pid: 90001,
        metadata: { parentPid: 99999 } // Invalid parent
      });
      
      const configWithStrictOwnership = createTestProcessManagerConfig({
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: false,
          enableFileBackup: false,
          maxAgeThreshold: 60000
        }
      });
      
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, configWithStrictOwnership);
      manager.trackProcess(processTracker);
      
      const errors = manager.getErrors();
      expectErrorAggregation(errors, 0, ['ProcessOwnershipError']);
    });

    it('should clear errors when requested', async () => {
      const processTracker = createTestProcessTracker({ pid: 95001 });
      processManager.trackProcess(processTracker);
      
      // Generate an error
      const mockKill = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      process.kill = mockKill as any;
      
      await processManager.gracefulShutdown();
      
      expect(processManager.getErrors().length).toBeGreaterThan(0);
      
      processManager.clearErrors();
      
      expect(processManager.getErrors()).toHaveLength(0);
    });

    it('should provide structured error information', async () => {
      const processTracker = createTestProcessTracker({ pid: 96001 });
      processManager.trackProcess(processTracker);
      
      const customError = new ProcessNotFoundError(
        'Test process not found',
        96001,
        'test-process'
      );
      
      const mockKill = jest.fn().mockImplementation(() => {
        throw customError;
      });
      process.kill = mockKill as any;
      
      await processManager.gracefulShutdown();
      
      const errors = processManager.getErrors();
      const structuredError = errors[0];
      
      expect(structuredError.errorId).toBeDefined();
      expect(structuredError.name).toBe('ProcessNotFoundError');
      expect(structuredError.component).toBe('ProcessManager');
      expect(structuredError.severity).toBe(ErrorSeverity.WARNING);
      expect(structuredError.timestamp).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // CONFIGURATION VALIDATION TESTS
  // =============================================================================

  describe('Configuration Validation - Priority 2', () => {
    it('should validate timing configuration', () => {
      expect(() => {
        new HaruspexProcessManager(testWorkspace, mockDebugLog, {
          ...testConfig,
          timing: {
            gracefulShutdownTimeout: -1000, // Invalid
            heartbeatInterval: 1000,
            retryDelay: 100,
            maxRetryAttempts: 3
          }
        });
      }).toThrow();
    });

    it('should validate safety configuration', () => {
      const validConfig = createTestProcessManagerConfig({
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: false,
          enableFileBackup: false,
          maxAgeThreshold: 1000 // Minimum 1000ms
        }
      });
      
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, validConfig);
      expect(manager).toBeInstanceOf(HaruspexProcessManager);
    });

    it('should provide configuration validation results', () => {
      const validationResult = processManager.getConfigurationValidation();
      expect(validationResult.success).toBe(true);
      expect(validationResult.data).toBeDefined();
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should handle invalid tracking file path', () => {
      expect(() => {
        new HaruspexProcessManager(testWorkspace, mockDebugLog, {
          ...testConfig,
          tracking: {
            trackingFile: '', // Invalid empty path
            enableHeartbeat: true,
            enablePersistentTracking: true
          }
        });
      }).toThrow();
    });

    it('should merge partial configurations correctly', () => {
      const partialConfig: Partial<ProcessManagerConfig> = {
        enableDetailedLogging: false,
        timing: {
          gracefulShutdownTimeout: 15000,
          heartbeatInterval: 2000,
          retryDelay: 200,
          maxRetryAttempts: 5
        }
      };
      
      const manager = new HaruspexProcessManager(testWorkspace, mockDebugLog, partialConfig);
      const mergedConfig = manager.getConfiguration();
      
      expect(mergedConfig.enableDetailedLogging).toBe(false);
      expect(mergedConfig.timing?.gracefulShutdownTimeout).toBe(15000);
      expect(mergedConfig.enableSafetyChecks).toBe(true); // Default value
      expect(mergedConfig.safety?.enableOwnershipVerification).toBe(true); // Default value
    });
  });

  // =============================================================================
  // INTEGRATION AND STATUS TESTS
  // =============================================================================

  describe('Status and Integration', () => {
    it('should provide comprehensive status information', () => {
      const processTracker = createTestProcessTracker({ pid: 97001 });
      processManager.trackProcess(processTracker);
      
      const status = processManager.getStatus();
      
      expect(status.initialized).toBe(false); // Not initialized yet
      expect(status.processCount).toBe(1);
      expect(status.canCleanup).toBe(true);
    });

    it('should generate comprehensive status report', async () => {
      await processManager.initialize();
      
      const processTracker = createTestProcessTracker({ pid: 98001 });
      processManager.trackProcess(processTracker);
      
      const report = processManager.generateStatusReport();
      
      expect(report.initialized).toBe(true);
      expect(report.processCount).toBe(1);
      expect(report.processes).toHaveLength(1);
      expect(report.errors.total).toBe(0);
      expect(report.configuration.valid).toBe(true);
    });

    it('should emit lifecycle events', (done) => {
      let eventCount = 0;
      const expectedEvents = ['initialized', 'process_tracked', 'shutdown_started'];
      
      processManager.on('initialized', () => {
        eventCount++;
        if (eventCount === 3) done();
      });
      
      processManager.on('process_tracked', () => {
        eventCount++;
        if (eventCount === 3) done();
      });
      
      processManager.on('shutdown_started', () => {
        eventCount++;
        if (eventCount === 3) done();
      });
      
      // Trigger events
      processManager.initialize().then(() => {
        const processTracker = createTestProcessTracker({ pid: 99001 });
        processManager.trackProcess(processTracker);
        processManager.gracefulShutdown();
      });
    });

    it('should handle concurrent operations safely', async () => {
      const processTracker = createTestProcessTracker({ pid: 100001 });
      processManager.trackProcess(processTracker);
      
      // Start multiple operations concurrently
      const operations = [
        processManager.initialize(),
        processManager.gracefulShutdown(),
        processManager.emergencyShutdown()
      ];
      
      const results = await Promise.allSettled(operations);
      
      // At least one should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should maintain consistent state across operations', async () => {
      await processManager.initialize();
      
      const tracker1 = createTestProcessTracker({ pid: 101001 });
      const tracker2 = createTestProcessTracker({ pid: 101002 });
      
      processManager.trackProcess(tracker1);
      processManager.trackProcess(tracker2);
      
      expect(processManager.getTrackedProcesses()).toHaveLength(2);
      
      const mockKill = jest.fn().mockReturnValue(true);
      process.kill = mockKill as any;
      
      await processManager.gracefulShutdown();
      
      // After shutdown, tracked processes should be cleaned up
      expect(processManager.getTrackedProcesses()).toHaveLength(0);
    });
  });

  // =============================================================================
  // EDGE CASE AND STRESS TESTS
  // =============================================================================

  describe('Edge Cases and Stress Tests', () => {
    it('should handle tracking many processes', () => {
      const processCount = 100;
      const processes = Array.from({ length: processCount }, (_, i) =>
        createTestProcessTracker({ pid: 200000 + i, name: `stress-process-${i}` })
      );
      
      processes.forEach(p => processManager.trackProcess(p));
      
      expect(processManager.getTrackedProcesses()).toHaveLength(processCount);
    });

    it('should handle rapid tracking and untracking', () => {
      const iterations = 50;
      
      for (let i = 0; i < iterations; i++) {
        const pid = 300000 + i;
        const processTracker = createTestProcessTracker({ pid });
        
        processManager.trackProcess(processTracker);
        expect(processManager.getTrackedProcesses().some(p => p.pid === pid)).toBe(true);
        
        processManager.untrackProcess(pid);
        expect(processManager.getTrackedProcesses().some(p => p.pid === pid)).toBe(false);
      }
    });

    it('should handle process tracking with missing metadata gracefully', () => {
      const minimalTracker: ProcessTracker = {
        pid: 400001,
        type: 'child-process',
        name: 'minimal-process',
        startTime: Date.now(),
        metadata: {} // Minimal metadata
      };
      
      expect(() => {
        processManager.trackProcess(minimalTracker);
      }).not.toThrow();
      
      const tracked = processManager.getTrackedProcesses();
      expect(tracked).toHaveLength(1);
      expect(tracked[0].metadata.sessionId).toBeDefined(); // Should be auto-generated
    });

    it('should handle system resource constraints', async () => {
      // Mock system resource limits
      const originalUlimit = process.getuid;
      process.getuid = jest.fn().mockImplementation(() => {
        throw new Error('Resource unavailable');
      });
      
      try {
        const result = await processManager.initialize();
        expect(result).toBeDefined(); // Should handle gracefully
      } finally {
        process.getuid = originalUlimit;
      }
    });
  });
});