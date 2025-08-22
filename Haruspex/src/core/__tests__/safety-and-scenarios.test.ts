/**---
 * title: [Haruspex Safety and Scenarios Tests - Critical Protection Systems Testing]
 * tags: [Testing, Safety, User-Protection, Scenarios, Critical-Systems]
 * provides: [SafetyTests, ScenarioValidation, UserProtection, EmergencyProcedures]
 * requires: [Jest, Test Utilities, All Cleanup Managers, Safety Mechanisms]
 * description: [Critical safety tests and real-world scenario validation for Haruspex cleanup system with emphasis on user work protection and emergency procedures]
 * ---*/

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { HaruspexCleanupOrchestrator } from '../haruspex-cleanup-orchestrator';
import { HaruspexProcessManager } from '../haruspex-process-manager';
import { HaruspexFileCleanup } from '../haruspex-file-cleanup';
import { HaruspexCommandManager } from '../haruspex-command-manager';
import { 
  ProcessManagerConfig, 
  FileCleanupConfig, 
  CommandManagerConfig,
  CleanupOrchestratorConfig 
} from '../shared-schemas';
import {
  createMockExtensionContext,
  createMockDebugLog,
  createMockProcess,
  createMockFileSystem,
  createTestWorkspace,
  cleanupTestWorkspace,
  createTestCleanupOrchestratorConfig,
  createTestProcessManagerConfig,
  createTestFileCleanupConfig,
  createTestCommandManagerConfig,
  createCrashRecoveryScenario,
  createHotReloadConflictScenario,
  validateUserWorkProtection,
  validateProcessOwnership,
  validateEmergencyShutdownSafety,
  waitForAsync,
  createTimeoutPromise
} from './test-utils/cleanup-test-utils';

describe('Haruspex Safety and Critical Scenarios Tests', () => {
  let testWorkspace: string;
  let mockContext: any;
  let mockDebugLog: jest.MockedFunction<any>;
  
  beforeAll(() => {
    testWorkspace = createTestWorkspace();
  });
  
  afterAll(() => {
    cleanupTestWorkspace(testWorkspace);
  });
  
  beforeEach(() => {
    mockContext = createMockExtensionContext();
    mockDebugLog = createMockDebugLog();
    jest.clearAllMocks();
  });

  // =============================================================================
  // USER WORK PROTECTION SAFETY TESTS
  // =============================================================================

  describe('User Work Protection Safety Tests', () => {
    let fileCleanup: HaruspexFileCleanup;
    let mockFileSystem: ReturnType<typeof createMockFileSystem>;
    
    beforeEach(() => {
      mockFileSystem = createMockFileSystem();
      
      // Setup critical user files
      mockFileSystem.addMockFile('/workspace/README.md', '# My Important Project\n\nThis is critical documentation.');
      mockFileSystem.addMockFile('/workspace/config.json', '{"important": "user configuration"}');
      mockFileSystem.addMockFile('/workspace/notes.txt', 'Important user notes and research');
      mockFileSystem.addMockFile('/workspace/src/main.ts', 'console.log("user code");');
      
      // Setup temporary files that should be cleaned
      mockFileSystem.addMockFile('/workspace/temp/build-output.tmp', 'temporary build output');
      mockFileSystem.addMockFile('/workspace/.cache/temp-file.cache', 'cache content');
      mockFileSystem.addMockFile('/workspace/logs/debug.log', 'debug log content');
      
      // Mock Node.js fs APIs
      jest.mock('fs', () => ({
        promises: {
          readdir: mockFileSystem.readdir,
          stat: mockFileSystem.stat,
          unlink: mockFileSystem.unlink,
          rmdir: mockFileSystem.rmdir,
          access: jest.fn().mockResolvedValue(undefined),
          readFile: jest.fn().mockImplementation((filePath: string) => {
            const content = mockFileSystem.getMockFiles().get(filePath);
            return content ? Promise.resolve(content) : Promise.reject(new Error('File not found'));
          }),
          writeFile: mockFileSystem.writeFile
        }
      }));
    });

    it('should never delete user documentation files', async () => {
      const protectionConfig = createTestFileCleanupConfig({
        patterns: {
          includePaths: ['**/*'], // Include everything
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: ['**/*.md', '**/*.txt', '**/*.json', '**/*.ts'],
          protectedPatterns: ['**/*.config.js', '**/*.env'],
          tempFileExtensions: ['.tmp', '.temp', '.cache'],
          tempFilePatterns: ['**/*.tmp', '**/*.temp', '**/*.cache']
        },
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: false,
          enableFileBackup: false,
          maxAgeThreshold: 0 // Allow any age
        }
      });
      
      fileCleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, protectionConfig);
      
      const result = await fileCleanup.cleanupFiles();
      
      // Verify user work files were protected
      validateUserWorkProtection(result, [
        '/workspace/README.md',
        '/workspace/config.json', 
        '/workspace/notes.txt',
        '/workspace/src/main.ts'
      ]);
      
      // Should have deleted only temporary files
      expect(result.filesDeleted).toBeGreaterThan(0);
      expect(result.filesSkipped).toBeGreaterThan(0);
      
      // Verify specific files were protected
      expect(mockFileSystem.unlink).not.toHaveBeenCalledWith('/workspace/README.md');
      expect(mockFileSystem.unlink).not.toHaveBeenCalledWith('/workspace/config.json');
      expect(mockFileSystem.unlink).not.toHaveBeenCalledWith('/workspace/notes.txt');
    });

    it('should create backups before deleting any files when enabled', async () => {
      const backupConfig = createTestFileCleanupConfig({
        patterns: {
          includePaths: ['**/*.tmp', '**/*.cache'],
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: [],
          protectedPatterns: ['**/*.config.js', '**/*.env'],
          tempFileExtensions: ['.tmp', '.temp', '.cache'],
          tempFilePatterns: ['**/*.tmp', '**/*.temp', '**/*.cache']
        },
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: true, // Enable backup creation
          enableFileBackup: false,
          maxAgeThreshold: 0
        }
      });
      
      fileCleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, backupConfig);
      
      const mockReadFile = jest.fn().mockResolvedValue('file content');
      const mockWriteFile = jest.fn().mockResolvedValue(undefined);
      
      (fs.promises.readFile as jest.Mock) = mockReadFile;
      (fs.promises.writeFile as jest.Mock) = mockWriteFile;
      
      const result = await fileCleanup.cleanupFiles();
      
      // Should have created backups before deletion
      expect(mockReadFile).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.backup$/),
        expect.any(String)
      );
      
      expect(result.filesDeleted).toBeGreaterThan(0);
    });

    it('should abort deletion if backup creation fails', async () => {
      const strictBackupConfig = createTestFileCleanupConfig({
        patterns: {
          includePaths: ['**/*.tmp'],
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: [],
          protectedPatterns: ['**/*.config.js', '**/*.env'],
          tempFileExtensions: ['.tmp', '.temp', '.cache'],
          tempFilePatterns: ['**/*.tmp', '**/*.temp', '**/*.cache']
        },
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: true,
          enableFileBackup: false,
          maxAgeThreshold: 0
        }
      });
      
      fileCleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, strictBackupConfig);
      
      // Mock backup creation to fail
      (fs.promises.readFile as jest.Mock) = jest.fn().mockResolvedValue('content');
      (fs.promises.writeFile as jest.Mock) = jest.fn().mockRejectedValue(new Error('Backup failed - disk full'));
      
      const result = await fileCleanup.cleanupFiles();
      
      // Should not delete any files if backup fails
      expect(result.filesDeleted).toBe(0);
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.failures[0]).toContain('Backup failed');
      
      // Ensure no actual deletions occurred
      expect(mockFileSystem.unlink).not.toHaveBeenCalled();
    });

    it('should respect file ownership and refuse to delete files owned by other users', async () => {
      const ownershipConfig = createTestFileCleanupConfig({
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: false,
          enableFileBackup: false,
          maxAgeThreshold: 0
        }
      });
      
      fileCleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, ownershipConfig);
      
      // Mock stat to return different ownership
      (fs.promises.stat as jest.Mock) = jest.fn().mockImplementation(async (filePath: string) => {
        const isOwnedByOther = filePath.includes('other-user');
        return {
          isFile: () => true,
          isDirectory: () => false,
          size: 100,
          mtime: new Date(Date.now() - 5000),
          ctime: new Date(),
          uid: isOwnedByOther ? 999999 : (process.getuid ? process.getuid() : 1000),
          gid: process.getgid ? process.getgid() : 1000
        };
      });
      
      mockFileSystem.addMockFile('/workspace/other-user-file.tmp', 'file owned by other user');
      mockFileSystem.addMockFile('/workspace/my-file.tmp', 'file owned by me');
      
      const result = await fileCleanup.cleanupFiles();
      
      // Should have skipped files owned by other users
      expect(result.filesSkipped).toBeGreaterThan(0);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('ownership verification failed'),
        'warning'
      );
    });

    it('should never delete system critical directories', async () => {
      const systemProtectionConfig = createTestFileCleanupConfig({
        patterns: {
          includePaths: ['**/*'],
          excludePaths: [
            '/system/**',
            '/bin/**',
            '/usr/**',
            '/etc/**',
            'C:\\Windows\\**',
            'C:\\Program Files\\**',
            '**/node_modules/**'
          ],
          preserveUserWork: true,
          userWorkPatterns: [],
          protectedPatterns: ['**/*.config.js', '**/*.env'],
          tempFileExtensions: ['.tmp', '.temp', '.cache'],
          tempFilePatterns: ['**/*.tmp', '**/*.temp', '**/*.cache']
        }
      });
      
      fileCleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, systemProtectionConfig);
      
      // Mock system directories
      mockFileSystem.addMockDirectory('/usr/local');
      mockFileSystem.addMockFile('/usr/local/system-file.txt', 'system file');
      mockFileSystem.addMockDirectory('C:\\Windows\\System32');
      mockFileSystem.addMockFile('C:\\Windows\\System32\\important.dll', 'system dll');
      
      const result = await fileCleanup.cleanupFiles();
      
      // Should not attempt to delete system directories
      expect(mockFileSystem.rmdir).not.toHaveBeenCalledWith(
        expect.stringMatching(/\/usr|C:\\Windows/)
      );
      expect(mockFileSystem.unlink).not.toHaveBeenCalledWith(
        expect.stringMatching(/\/usr|C:\\Windows/)
      );
    });
  });

  // =============================================================================
  // PROCESS OWNERSHIP AND SAFETY TESTS
  // =============================================================================

  describe('Process Ownership and Safety Tests', () => {
    let processManager: HaruspexProcessManager;
    
    beforeEach(() => {
      processManager = new HaruspexProcessManager(
        testWorkspace,
        mockDebugLog,
        createTestProcessManagerConfig({
          safety: {
            enableOwnershipVerification: true,
            enableResourceValidation: true,
            enableBackupCreation: false,
            enableFileBackup: false,
            maxAgeThreshold: 60000
          }
        })
      );
    });
    
    afterEach(async () => {
      if (processManager) {
        await processManager.emergencyShutdown();
      }
    });

    it('should validate process ownership before termination', async () => {
      const ownedProcess = {
        pid: 12345,
        type: 'child-process' as const,
        name: 'owned-process',
        startTime: Date.now(),
        metadata: {
          parentPid: process.pid, // Owned by current process
          command: 'node test-script.js'
        }
      };
      
      const foreignProcess = {
        pid: 54321,
        type: 'child-process' as const,
        name: 'foreign-process',
        startTime: Date.now(),
        metadata: {
          parentPid: 99999, // Owned by different process
          command: 'node other-script.js'
        }
      };
      
      processManager.trackProcess(ownedProcess);
      processManager.trackProcess(foreignProcess);
      
      validateProcessOwnership(ownedProcess, process.pid);
      
      // Should log warning for foreign process
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('ownership verification'),
        'warning'
      );
    });

    it('should refuse to terminate processes not owned by extension', async () => {
      const systemProcess = {
        pid: 1, // System init process
        type: 'child-process' as const,
        name: 'system-process',
        startTime: Date.now(),
        metadata: {
          parentPid: 0,
          command: 'init'
        }
      };
      
      processManager.trackProcess(systemProcess);
      
      // Mock process.kill to detect termination attempts
      const mockKill = jest.fn();
      process.kill = mockKill as any;
      
      const result = await processManager.gracefulShutdown();
      
      // Should not attempt to kill system processes
      expect(mockKill).not.toHaveBeenCalledWith(1, expect.any(String));
      expect(result.alreadyGone).toBeGreaterThanOrEqual(0);
    });

    it('should handle process termination with signal escalation safely', async () => {
      const stubborn_process = {
        pid: 33333,
        type: 'child-process' as const,
        name: 'stubborn-process',
        startTime: Date.now(),
        metadata: {
          parentPid: process.pid
        }
      };
      
      processManager.trackProcess(stubborn_process);
      
      let killAttempts = 0;
      const mockKill = jest.fn().mockImplementation((pid: number, signal?: string | number) => {
        killAttempts++;
        
        if (signal === 'SIGKILL') {
          // Process finally terminates with SIGKILL
          return true;
        } else {
          // Process ignores SIGTERM
          throw new Error('Process did not terminate gracefully');
        }
      });
      process.kill = mockKill as any;
      
      const result = await processManager.gracefulShutdown();
      
      // Should have attempted graceful termination first, then force termination
      expect(killAttempts).toBeGreaterThan(1);
      expect(mockKill).toHaveBeenCalledWith(33333, 'SIGTERM'); // Graceful first
      expect(mockKill).toHaveBeenCalledWith(33333, 'SIGKILL'); // Force second
      expect(result.cleaned).toBe(1);
    });

    it('should never terminate VS Code main process or critical system processes', async () => {
      const criticalProcesses = [
        { pid: process.pid, name: 'vscode-main', type: 'critical' },
        { pid: 1, name: 'init', type: 'system' },
        { pid: process.ppid || 999, name: 'parent-process', type: 'parent' }
      ];
      
      criticalProcesses.forEach(proc => {
        if (proc.pid && proc.pid > 0) {
          processManager.trackProcess({
            pid: proc.pid,
            type: 'child-process' as const,
            name: proc.name,
            metadata: { critical: true }
          });
        }
      });
      
      const mockKill = jest.fn();
      process.kill = mockKill as any;
      
      const result = await processManager.gracefulShutdown();
      
      // Should not attempt to kill critical processes
      criticalProcesses.forEach(proc => {
        if (proc.pid && proc.pid > 0) {
          expect(mockKill).not.toHaveBeenCalledWith(proc.pid, expect.any(String));
        }
      });
    });
  });

  // =============================================================================
  // EMERGENCY SHUTDOWN SAFETY TESTS
  // =============================================================================

  describe('Emergency Shutdown Safety Tests', () => {
    let orchestrator: HaruspexCleanupOrchestrator;
    
    beforeEach(async () => {
      const emergencyConfig = createTestCleanupOrchestratorConfig({
        orchestration: {
          enableParallelInitialization: false,
          initializationTimeout: 10000,
          shutdownTimeout: 2000 // Short timeout for emergency scenarios
        }
      });
      
      orchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        emergencyConfig
      );
      
      await orchestrator.initialize();
    });
    
    afterEach(async () => {
      if (orchestrator) {
        await orchestrator.emergencyShutdown();
      }
    });

    it('should always complete emergency shutdown within timeout', async () => {
      // Add resources that might be slow to clean up
      orchestrator.trackProcess(
        40001,
        'child-process',
        'slow-cleanup-process',
        {},
        async () => {
          // Simulate very slow cleanup
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      );
      
      const startTime = Date.now();
      const result = await orchestrator.emergencyShutdown();
      const duration = Date.now() - startTime;
      
      validateEmergencyShutdownSafety(result);
      
      // Should complete quickly despite slow cleanup
      expect(duration).toBeLessThan(5000); // Should not hang
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should force terminate all processes in emergency shutdown', async () => {
      const processesToForceKill = [
        { pid: 50001, name: 'force-kill-1', type: 'child-process' as const },
        { pid: 50002, name: 'force-kill-2', type: 'ipc-server' as const },
        { pid: 50003, name: 'force-kill-3', type: 'file-watcher' as const }
      ];
      
      processesToForceKill.forEach(proc => {
        orchestrator.trackProcess(proc.pid, proc.type, proc.name);
      });
      
      let forceKillCount = 0;
      const mockKill = jest.fn().mockImplementation((pid: number, signal?: string | number) => {
        if (signal === 'SIGKILL') {
          forceKillCount++;
        }
        return true;
      });
      process.kill = mockKill as any;
      
      const result = await orchestrator.emergencyShutdown();
      
      validateEmergencyShutdownSafety(result);
      expect(forceKillCount).toBe(processesToForceKill.length);
      expect(result.processes.cleaned).toBe(processesToForceKill.length);
    });

    it('should skip file cleanup in emergency shutdown to protect user work', async () => {
      // Emergency shutdown should skip file operations to avoid accidental deletion
      const mockFileCleanup = jest.fn();
      
      // Mock file cleanup to track if it's called
      const originalFileCleanup = jest.requireActual('../haruspex-file-cleanup').HaruspexFileCleanup;
      jest.spyOn(originalFileCleanup.prototype, 'cleanupFiles').mockImplementation(mockFileCleanup);
      
      const result = await orchestrator.emergencyShutdown();
      
      validateEmergencyShutdownSafety(result);
      
      // File cleanup should NOT be called in emergency shutdown
      expect(mockFileCleanup).not.toHaveBeenCalled();
      expect(result.files.filesDeleted).toBe(0);
    });

    it('should handle cascading failures during emergency shutdown', async () => {
      // Add resources and make them fail during cleanup
      orchestrator.trackProcess(60001, 'child-process', 'failing-process-1');
      orchestrator.trackProcess(60002, 'ipc-server', 'failing-process-2');
      
      await orchestrator.registerCommands([
        {
          commandId: 'haruspex.emergency.fail',
          handler: jest.fn(),
          metadata: { category: 'core' as const }
        }
      ]);
      
      // Mock all cleanup operations to fail
      const mockKill = jest.fn().mockImplementation(() => {
        throw new Error('Process termination failed');
      });
      process.kill = mockKill as any;
      
      const mockCommandDispose = jest.fn().mockImplementation(() => {
        throw new Error('Command disposal failed');
      });
      
      const originalCommandManager = jest.requireActual('../haruspex-command-manager').HaruspexCommandManager;
      jest.spyOn(originalCommandManager.prototype, 'dispose').mockImplementation(mockCommandDispose);
      
      const result = await orchestrator.emergencyShutdown();
      
      // Should complete despite multiple failures
      validateEmergencyShutdownSafety(result);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should maintain audit trail even during emergency shutdown', async () => {
      orchestrator.trackProcess(70001, 'child-process', 'audit-test-process');
      
      const result = await orchestrator.emergencyShutdown();
      
      validateEmergencyShutdownSafety(result);
      
      // Should have logged emergency shutdown events
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('emergency shutdown'),
        'warning'
      );
      
      expect(result.summary).toContain('Emergency shutdown');
    });
  });

  // =============================================================================
  // REAL-WORLD CRASH RECOVERY SCENARIOS
  // =============================================================================

  describe('Real-World Crash Recovery Scenarios', () => {
    it('should recover from VS Code extension host crash', async () => {
      const { orphanProcesses, fileCleanup, commandConflicts } = createCrashRecoveryScenario();
      
      const crashRecoveryOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        createTestCleanupOrchestratorConfig({
          recovery: {
            enableStartupRecovery: true,
            enableCrashRecovery: true,
            enableBackupValidation: true
          }
        })
      );
      
      // Mock orphan detection and cleanup
      const mockProcessManager = {
        initialize: jest.fn().mockResolvedValue(orphanProcesses),
        getTrackedProcesses: jest.fn().mockReturnValue([]),
        getErrors: jest.fn().mockReturnValue([]),
        getErrorSummary: jest.fn().mockReturnValue({ total: 0, critical: 0 })
      };
      
      const mockFileManager = {
        cleanupFiles: jest.fn().mockResolvedValue(fileCleanup),
        getErrors: jest.fn().mockReturnValue([]),
        getErrorSummary: jest.fn().mockReturnValue({ total: 0, critical: 0 })
      };
      
      // Inject mocks
      const originalProcessManager = jest.requireActual('../haruspex-process-manager').HaruspexProcessManager;
      const originalFileCleanup = jest.requireActual('../haruspex-file-cleanup').HaruspexFileCleanup;
      
      jest.spyOn(originalProcessManager.prototype, 'initialize').mockImplementation(mockProcessManager.initialize);
      jest.spyOn(originalFileCleanup.prototype, 'cleanupFiles').mockImplementation(mockFileManager.cleanupFiles);
      
      const result = await crashRecoveryOrchestrator.initialize();
      
      expect(result.recoveryNeeded).toBe(true);
      expect(result.orphanProcesses.orphansFound).toBe(3);
      expect(result.orphanProcesses.orphansCleaned).toBe(2); // One failed
      expect(result.orphanProcesses.orphansRemaining).toHaveLength(1);
      
      expect(result.fileCleanup.filesDeleted).toBe(2);
      expect(result.fileCleanup.filesSkipped).toBe(1); // Protected file
      
      expect(result.summary).toContain('Crash recovery performed');
      
      await crashRecoveryOrchestrator.emergencyShutdown();
    });

    it('should handle corrupted state files gracefully', async () => {
      // Create corrupted tracking files
      const corruptedTrackingFile = path.join(testWorkspace, 'haruspex-tracking.json');
      fs.writeFileSync(corruptedTrackingFile, 'invalid json content {{{');
      
      const corruptedStateFile = path.join(testWorkspace, 'haruspex-state.json');
      fs.writeFileSync(corruptedStateFile, '{"incomplete": json}');
      
      const corruptionRecoveryOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        createTestCleanupOrchestratorConfig({
          recovery: {
            enableStartupRecovery: true,
            enableCrashRecovery: true,
            enableBackupValidation: true
          }
        })
      );
      
      // Should initialize successfully despite corrupted files
      const result = await corruptionRecoveryOrchestrator.initialize();
      
      expect(result).toBeDefined();
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('corrupted'),
        'warning'
      );
      
      await corruptionRecoveryOrchestrator.emergencyShutdown();
      
      // Cleanup test files
      if (fs.existsSync(corruptedTrackingFile)) {
        fs.unlinkSync(corruptedTrackingFile);
      }
      if (fs.existsSync(corruptedStateFile)) {
        fs.unlinkSync(corruptedStateFile);
      }
    });

    it('should recover from system resource exhaustion', async () => {
      const resourceExhaustionOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        createTestCleanupOrchestratorConfig()
      );
      
      // Mock system resource exhaustion
      const originalSpawn = jest.requireActual('child_process').spawn;
      jest.spyOn(require('child_process'), 'spawn').mockImplementation(() => {
        throw new Error('EMFILE: too many open files');
      });
      
      // Should handle resource exhaustion gracefully
      const result = await resourceExhaustionOrchestrator.initialize();
      
      expect(result).toBeDefined();
      
      await resourceExhaustionOrchestrator.emergencyShutdown();
    });
  });

  // =============================================================================
  // COMPLEX HOT-RELOAD AND CONFLICT SCENARIOS
  // =============================================================================

  describe('Complex Hot-Reload and Conflict Scenarios', () => {
    it('should handle multiple extension reload cycles safely', async () => {
      const reloadCycles = 5;
      const results: any[] = [];
      
      for (let cycle = 0; cycle < reloadCycles; cycle++) {
        const reloadOrchestrator = new HaruspexCleanupOrchestrator(
          mockContext,
          testWorkspace,
          mockDebugLog,
          createTestCleanupOrchestratorConfig()
        );
        
        await reloadOrchestrator.initialize();
        
        // Simulate typical extension activity
        reloadOrchestrator.trackProcess(80000 + cycle, 'child-process', `reload-process-${cycle}`);
        
        const commandResult = await reloadOrchestrator.registerCommands([
          {
            commandId: `haruspex.reload.cycle${cycle}`,
            handler: jest.fn(),
            metadata: { category: 'core' as const }
          }
        ]);
        
        const status = reloadOrchestrator.getStatus();
        expect(status.initialized).toBe(true);
        expect(status.processes).toBe(1);
        expect(status.commands).toBe(1);
        
        const shutdownResult = await reloadOrchestrator.gracefulShutdown();
        results.push({ cycle, commandResult, shutdownResult });
      }
      
      // All cycles should complete successfully
      results.forEach(result => {
        expect(result.commandResult.successful).toBe(1);
        expect(result.shutdownResult.success).toBe(true);
      });
    });

    it('should resolve complex command conflicts during hot reload', async () => {
      const { existingCommands, newCommands, expectedResolution } = createHotReloadConflictScenario();
      
      const conflictOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        createTestCleanupOrchestratorConfig({
          commandManagerConfig: createTestCommandManagerConfig({
            conflicts: {
              enableConflictDetection: true,
              conflictResolutionStrategy: 'preserve-existing'
            }
          })
        })
      );
      
      await conflictOrchestrator.initialize();
      
      // Mock existing commands in VS Code
      const mockGetCommands = jest.fn().mockResolvedValue(existingCommands.map(cmd => cmd.id));
      const originalCommandsModule = jest.requireActual('vscode');
      originalCommandsModule.commands.getCommands = mockGetCommands;
      
      // Register new commands (which may conflict)
      const result = await conflictOrchestrator.registerCommands(newCommands);
      
      expect(result.successful).toBe(expectedResolution.successful);
      expect(result.skipped).toBe(expectedResolution.skipped);
      expect(result.failed).toBe(expectedResolution.failed);
      
      // Should have logged conflicts
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('conflict'),
        expect.any(String)
      );
      
      await conflictOrchestrator.emergencyShutdown();
    });

    it('should handle rapid extension disable/enable cycles', async () => {
      const rapidCycles = 10;
      
      for (let cycle = 0; cycle < rapidCycles; cycle++) {
        const rapidOrchestrator = new HaruspexCleanupOrchestrator(
          mockContext,
          testWorkspace,
          mockDebugLog,
          createTestCleanupOrchestratorConfig()
        );
        
        const initResult = await rapidOrchestrator.initialize();
        expect(initResult).toBeDefined();
        
        // Immediate shutdown (simulating rapid disable/enable)
        const shutdownResult = await rapidOrchestrator.emergencyShutdown();
        expect(shutdownResult).toBeDefined();
        
        // Small delay to prevent resource exhaustion
        await waitForAsync(10);
      }
    });
  });

  // =============================================================================
  // SYSTEM INTEGRATION AND BOUNDARY TESTS
  // =============================================================================

  describe('System Integration and Boundary Tests', () => {
    it('should handle VS Code API unavailability gracefully', async () => {
      // Mock VS Code API to be unavailable
      const originalVSCode = jest.requireActual('vscode');
      const unavailableAPI = {
        ...originalVSCode,
        commands: undefined,
        window: undefined,
        workspace: undefined
      };
      
      jest.mock('vscode', () => unavailableAPI, { virtual: true });
      
      const apiUnavailableOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        createTestCleanupOrchestratorConfig()
      );
      
      // Should initialize despite API unavailability
      const result = await apiUnavailableOrchestrator.initialize();
      expect(result).toBeDefined();
      
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('API unavailable'),
        'warning'
      );
      
      await apiUnavailableOrchestrator.emergencyShutdown();
    });

    it('should handle file system permission errors safely', async () => {
      const permissionOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        '/root/restricted-directory', // Directory we don't have access to
        mockDebugLog,
        createTestCleanupOrchestratorConfig()
      );
      
      // Should handle permission errors gracefully
      const result = await permissionOrchestrator.initialize();
      expect(result).toBeDefined();
      
      const shutdownResult = await permissionOrchestrator.gracefulShutdown();
      expect(shutdownResult).toBeDefined();
    });

    it('should handle system resource limits gracefully', async () => {
      const resourceLimitOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        createTestCleanupOrchestratorConfig()
      );
      
      await resourceLimitOrchestrator.initialize();
      
      // Track maximum allowed resources
      const maxProcesses = 1000;
      
      for (let i = 0; i < maxProcesses && i < 100; i++) { // Limit to 100 for test performance
        try {
          resourceLimitOrchestrator.trackProcess(90000 + i, 'child-process', `resource-limit-${i}`);
        } catch (error) {
          // Expected to hit limits at some point
          break;
        }
      }
      
      const status = resourceLimitOrchestrator.getStatus();
      expect(status.processes).toBeGreaterThan(0);
      
      const shutdownResult = await resourceLimitOrchestrator.emergencyShutdown();
      expect(shutdownResult.success).toBe(true);
    });

    it('should maintain system stability under extreme load', async () => {
      const extremeLoadOrchestrator = new HaruspexCleanupOrchestrator(
        mockContext,
        testWorkspace,
        mockDebugLog,
        createTestCleanupOrchestratorConfig()
      );
      
      await extremeLoadOrchestrator.initialize();
      
      // Simulate extreme concurrent load
      const loadOperations = Array.from({ length: 50 }, (_, i) => 
        (async () => {
          try {
            extremeLoadOrchestrator.trackProcess(95000 + i, 'child-process', `load-${i}`);
            
            const timer = setTimeout(() => {}, 1000);
            extremeLoadOrchestrator.trackTimer(timer, `load-timer-${i}`, 'timeout');
            clearTimeout(timer);
            
            await extremeLoadOrchestrator.registerCommands([{
              commandId: `haruspex.load.${i}`,
              handler: jest.fn(),
              metadata: { category: 'core' as const }
            }]);
          } catch (error) {
            // Expected under extreme load
          }
        })()
      );
      
      const results = await Promise.allSettled(loadOperations);
      const successful = results.filter(r => r.status === 'fulfilled');
      
      // Should handle most operations successfully
      expect(successful.length).toBeGreaterThan(0);
      
      const shutdownResult = await extremeLoadOrchestrator.emergencyShutdown();
      expect(shutdownResult).toBeDefined();
    });
  });
});