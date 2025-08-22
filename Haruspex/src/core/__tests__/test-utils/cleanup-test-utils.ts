/**---
 * title: [Cleanup System Test Utilities - Comprehensive Testing Framework]
 * tags: [Testing, Utilities, Mocking, Safety, Validation]
 * provides: [TestUtilities, MockFactories, TestData, ValidationHelpers]
 * requires: [Jest, VS Code Mocks, File System, Process APIs]
 * description: [Comprehensive test utilities for Haruspex cleanup system testing with safety validation, realistic mocks, and scenario builders]
 * ---*/

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import { 
  ProcessTracker, 
  ProcessCleanupResult, 
  OrphanDetectionResult 
} from '../../haruspex-process-manager';
import {
  FileCleanupResult
} from '../../haruspex-file-cleanup';
import { ConfigurationFactory } from '../../shared-schemas';
import {
  CommandRegistrationResult
} from '../../haruspex-command-manager';
import {
  CleanupResult,
  StartupRecoveryResult
} from '../../haruspex-cleanup-orchestrator';
import {
  ProcessManagerConfig,
  FileCleanupConfig,
  CommandManagerConfig,
  CleanupOrchestratorConfig
} from '../../shared-schemas';
import {
  HaruspexError,
  ErrorSeverity,
  ErrorClassification,
  RecoveryStrategy
} from '../../shared-errors';

// =============================================================================
// MOCK FACTORIES
// =============================================================================

/**
 * Create mock VS Code extension context for testing
 */
export function createMockExtensionContext(): any {
  const subscriptions: any[] = [];
  
  return {
    subscriptions,
    workspaceState: {
      get: jest.fn().mockReturnValue(undefined),
      update: jest.fn().mockResolvedValue(undefined)
    },
    globalState: {
      get: jest.fn().mockReturnValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      setKeysForSync: jest.fn()
    },
    extensionPath: '/mock/extension/path',
    storagePath: '/mock/storage/path',
    globalStoragePath: '/mock/global/storage/path',
    logPath: '/mock/log/path',
    extensionUri: { scheme: 'file', path: '/mock/extension/path' },
    environmentVariableCollection: {
      persistent: true,
      description: 'Mock environment variables',
      clear: jest.fn(),
      delete: jest.fn(),
      forEach: jest.fn(),
      get: jest.fn(),
      prepend: jest.fn(),
      replace: jest.fn(),
      append: jest.fn()
    }
  };
}

/**
 * Create mock debug log function for testing
 */
export function createMockDebugLog(): jest.MockedFunction<(message: string, level?: 'info' | 'warning' | 'error') => void> {
  return jest.fn().mockImplementation((message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    // In test mode, optionally log to console for debugging
    if (process.env.HARUSPEX_TEST_DEBUG === 'true') {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  });
}

/**
 * Create mock file system for testing
 */
export function createMockFileSystem() {
  const mockFiles = new Map<string, string>();
  const mockDirectories = new Set<string>();
  
  return {
    // File operations
    readFile: jest.fn().mockImplementation((filePath: string) => {
      if (mockFiles.has(filePath)) {
        return Promise.resolve(mockFiles.get(filePath));
      }
      return Promise.reject(new Error(`ENOENT: no such file or directory, open '${filePath}'`));
    }),
    
    writeFile: jest.fn().mockImplementation((filePath: string, data: string) => {
      mockFiles.set(filePath, data);
      return Promise.resolve();
    }),
    
    unlink: jest.fn().mockImplementation((filePath: string) => {
      if (mockFiles.has(filePath)) {
        mockFiles.delete(filePath);
        return Promise.resolve();
      }
      return Promise.reject(new Error(`ENOENT: no such file or directory, unlink '${filePath}'`));
    }),
    
    // Directory operations
    mkdir: jest.fn().mockImplementation((dirPath: string) => {
      mockDirectories.add(dirPath);
      return Promise.resolve();
    }),
    
    rmdir: jest.fn().mockImplementation((dirPath: string) => {
      if (mockDirectories.has(dirPath)) {
        mockDirectories.delete(dirPath);
        return Promise.resolve();
      }
      return Promise.reject(new Error(`ENOENT: no such file or directory, rmdir '${dirPath}'`));
    }),
    
    // Status operations
    exists: jest.fn().mockImplementation((filePath: string) => {
      return Promise.resolve(mockFiles.has(filePath) || mockDirectories.has(filePath));
    }),
    
    stat: jest.fn().mockImplementation((filePath: string) => {
      if (mockFiles.has(filePath) || mockDirectories.has(filePath)) {
        return Promise.resolve({
          isFile: () => mockFiles.has(filePath),
          isDirectory: () => mockDirectories.has(filePath),
          size: mockFiles.has(filePath) ? mockFiles.get(filePath)!.length : 0,
          mtime: new Date(),
          ctime: new Date()
        });
      }
      return Promise.reject(new Error(`ENOENT: no such file or directory, stat '${filePath}'`));
    }),
    
    readdir: jest.fn().mockImplementation((dirPath: string) => {
      const entries = Array.from(mockFiles.keys())
        .concat(Array.from(mockDirectories))
        .filter(p => path.dirname(p) === dirPath)
        .map(p => path.basename(p));
      return Promise.resolve(entries);
    }),
    
    // Test utilities
    addMockFile: (filePath: string, content: string = '') => mockFiles.set(filePath, content),
    addMockDirectory: (dirPath: string) => mockDirectories.add(dirPath),
    getMockFiles: () => new Map(mockFiles),
    getMockDirectories: () => new Set(mockDirectories),
    clearMocks: () => {
      mockFiles.clear();
      mockDirectories.clear();
    }
  };
}

/**
 * Create mock process for testing
 */
export function createMockProcess(options: {
  pid?: number;
  killed?: boolean;
  connected?: boolean;
  exitCode?: number | null;
} = {}): any {
  const {
    pid = Math.floor(Math.random() * 10000) + 1000,
    killed = false,
    connected = true,
    exitCode = null
  } = options;

  const mockProcess = new EventEmitter();
  Object.assign(mockProcess, {
    pid,
    killed,
    connected,
    exitCode,
    stdin: null,
    stdout: null,
    stderr: null,
    stdio: [null, null, null],
    kill: jest.fn().mockImplementation((signal?: string | number) => {
      (mockProcess as any).killed = true;
      (mockProcess as any).exitCode = signal === 'SIGKILL' ? -9 : 0;
      setTimeout(() => mockProcess.emit('exit', (mockProcess as any).exitCode, signal), 10);
      return true;
    }),
    disconnect: jest.fn().mockImplementation(() => {
      (mockProcess as any).connected = false;
      setTimeout(() => mockProcess.emit('disconnect'), 10);
    }),
    send: jest.fn().mockResolvedValue(undefined)
  });

  return mockProcess;
}

// =============================================================================
// TEST DATA BUILDERS
// =============================================================================

/**
 * Create test process tracker
 */
export function createTestProcessTracker(overrides: Partial<ProcessTracker> = {}): ProcessTracker {
  const defaults: ProcessTracker = {
    pid: Math.floor(Math.random() * 10000) + 1000,
    type: 'child-process',
    name: 'test-process',
    startTime: Date.now(),
    metadata: {
      command: 'node test-script.js',
      parentPid: process.pid,
      sessionId: generateTestSessionId()
    }
  };

  return { ...defaults, ...overrides };
}

/**
 * Create test process cleanup result
 */
export function createTestProcessCleanupResult(overrides: Partial<ProcessCleanupResult> = {}): ProcessCleanupResult {
  const defaults: ProcessCleanupResult = {
    cleaned: 0,
    failed: 0,
    alreadyGone: 0,
    details: []
  };

  return { ...defaults, ...overrides };
}

/**
 * Create test orphan detection result
 */
export function createTestOrphanDetectionResult(overrides: Partial<OrphanDetectionResult> = {}): OrphanDetectionResult {
  const defaults: OrphanDetectionResult = {
    orphansFound: 0,
    orphansCleaned: 0,
    orphansRemaining: [],
    details: []
  };

  return { ...defaults, ...overrides };
}

/**
 * Create test file cleanup result
 */
export function createTestFileCleanupResult(overrides: Partial<FileCleanupResult> = {}): FileCleanupResult {
  const defaults: FileCleanupResult = {
    filesDeleted: 0,
    directoriesRemoved: 0,
    filesSkipped: 0,
    bytesFreed: 0,
    failures: [],
    details: []
  };

  return { ...defaults, ...overrides };
}

/**
 * Create test command registration result
 */
export function createTestCommandRegistrationResult(overrides: Partial<CommandRegistrationResult> = {}): CommandRegistrationResult {
  const defaults: CommandRegistrationResult = {
    successful: 0,
    skipped: 0,
    failed: 0,
    details: []
  };

  return { ...defaults, ...overrides };
}

/**
 * Create test cleanup result
 */
export function createTestCleanupResult(overrides: Partial<CleanupResult> = {}): CleanupResult {
  const defaults: CleanupResult = {
    success: true,
    duration: 100,
    processes: createTestProcessCleanupResult(),
    files: createTestFileCleanupResult(),
    commands: { disposed: 0, errors: [] },
    errors: [],
    summary: 'Test cleanup completed successfully'
  };

  return { ...defaults, ...overrides };
}

/**
 * Create test startup recovery result
 */
export function createTestStartupRecoveryResult(overrides: Partial<StartupRecoveryResult> = {}): StartupRecoveryResult {
  const defaults: StartupRecoveryResult = {
    recoveryNeeded: false,
    orphanProcesses: createTestOrphanDetectionResult(),
    fileCleanup: createTestFileCleanupResult(),
    commandConflicts: createTestCommandRegistrationResult(),
    summary: 'Clean startup - no recovery needed'
  };

  return { ...defaults, ...overrides };
}

// =============================================================================
// CONFIGURATION BUILDERS
// =============================================================================

/**
 * Create test process manager configuration
 */
export function createTestProcessManagerConfig(overrides: Partial<ProcessManagerConfig> = {}): ProcessManagerConfig {
  const defaults: ProcessManagerConfig = {
    enableDetailedLogging: true,
    enableSafetyChecks: true,
    dryRun: false,
    gracefulTimeout: 5000,
    sessionId: generateTestSessionId(),
    timing: {
      gracefulShutdownTimeout: 5000,
      heartbeatInterval: 1000,
      retryDelay: 100,
      maxRetryAttempts: 3
    },
    safety: {
      enableOwnershipVerification: true,
      enableResourceValidation: true,
      enableBackupCreation: false,
      enableFileBackup: false,
      maxAgeThreshold: 60000
    },
    tracking: {
      trackingFile: path.join(os.tmpdir(), 'haruspex-test-tracking.json'),
      enableHeartbeat: true,
      enablePersistentTracking: true
    },
    orphanDetection: {
      enableOrphanDetection: true,
      orphanDetectionThreshold: 10000,
      enableAutomaticCleanup: true
    },
    termination: {
      enableGracefulTermination: true,
      forceTerminationDelay: 1000,
      enableSignalEscalation: true
    }
  };

  return { ...defaults, ...overrides };
}

/**
 * Create test file cleanup configuration
 */
export function createTestFileCleanupConfig(overrides: Partial<FileCleanupConfig> = {}): FileCleanupConfig {
  const result = ConfigurationFactory.createFileCleanupConfig({
    sessionId: generateTestSessionId(),
    gracefulTimeout: 5000,
    ...overrides
  });
  
  if (!result.success || !result.data) {
    throw new Error(`Failed to create test configuration: ${result.errors?.map(e => e.message).join(', ')}`);
  }
  
  return result.data;
}

/**
 * Create test command manager configuration
 */
export function createTestCommandManagerConfig(overrides: Partial<CommandManagerConfig> = {}): CommandManagerConfig {
  const defaults: CommandManagerConfig = {
    enableDetailedLogging: true,
    enableSafetyChecks: true,
    dryRun: false,
    gracefulTimeout: 5000,
    sessionId: generateTestSessionId(),
    timing: {
      gracefulShutdownTimeout: 5000,
      heartbeatInterval: 1000,
      retryDelay: 100,
      maxRetryAttempts: 3
    },
    safety: {
      enableOwnershipVerification: true,
      enableResourceValidation: true,
      enableBackupCreation: false,
      enableFileBackup: false,
      maxAgeThreshold: 60000
    },
    hotReload: {
      enableHotReloadHandling: true,
      enableConflictResolution: true,
      conflictResolutionStrategy: 'graceful-skip' as const,
      conflictResolutionTimeout: 5000
    },
    registration: {
      maxRegistrationAttempts: 3,
      enableRegistrationRetry: true,
      registrationRetryDelay: 1000,
      enableParallelRegistration: false
    },
    lifecycle: {
      enableDisposalTracking: true,
      enableHealthMonitoring: true,
      registrationTimeout: 10000
    },
    errorHandling: {
      throwOnError: false,
      enableErrorClassification: true,
      enableErrorRecovery: true
    }
  };

  return { ...defaults, ...overrides };
}

/**
 * Create test cleanup orchestrator configuration
 */
export function createTestCleanupOrchestratorConfig(overrides: Partial<CleanupOrchestratorConfig> = {}): CleanupOrchestratorConfig {
  const defaults: CleanupOrchestratorConfig = {
    enableDetailedLogging: true,
    enableSafetyChecks: true,
    dryRun: false,
    gracefulTimeout: 10000,
    sessionId: generateTestSessionId(),
    timing: {
      gracefulShutdownTimeout: 10000,
      heartbeatInterval: 5000,
      retryDelay: 1000,
      maxRetryAttempts: 3
    },
    safety: {
      enableOwnershipVerification: true,
      enableResourceValidation: true,
      enableBackupCreation: false,
      enableFileBackup: false,
      maxAgeThreshold: 3600000
    },
    components: {
      enableProcessManagement: true,
      enableFileCleanup: true,
      enableCommandManagement: true
    },
    orchestration: {
      enableParallelInitialization: false,
      initializationTimeout: 15000,
      shutdownTimeout: 10000
    },
    recovery: {
      enableStartupRecovery: true,
      enableCrashRecovery: true,
      enableBackupValidation: false
    },
    processManagerConfig: createTestProcessManagerConfig(),
    fileCleanupConfig: createTestFileCleanupConfig(),
    commandManagerConfig: createTestCommandManagerConfig()
  };

  return { ...defaults, ...overrides };
}

// =============================================================================
// ERROR BUILDERS
// =============================================================================

/**
 * Create test Haruspex error
 */
export function createTestError(
  message: string = 'Test error',
  component: string = 'TestComponent',
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  recoverable: boolean = true,
  context: Record<string, any> = {}
): HaruspexError {
  return new (class extends HaruspexError {
    getClassification(): ErrorClassification {
      return ErrorClassification.SYSTEM;
    }
    
    getRecoveryStrategy(): RecoveryStrategy {
      return recoverable ? RecoveryStrategy.RETRY : RecoveryStrategy.USER_INTERVENTION;
    }
  })(message, component, severity, recoverable, context);
}

// =============================================================================
// SCENARIO BUILDERS
// =============================================================================

/**
 * Create crash recovery scenario test data
 */
export function createCrashRecoveryScenario() {
  const orphanPids = [12345, 12346, 12347];
  const staleFiles = [
    '/tmp/haruspex-temp-1.json',
    '/tmp/haruspex-temp-2.log',
    '/tmp/haruspex-state.backup'
  ];
  
  return {
    orphanProcesses: createTestOrphanDetectionResult({
      orphansFound: orphanPids.length,
      orphansCleaned: orphanPids.length - 1, // One failed
      orphansRemaining: [orphanPids[2].toString()],
      details: [
        `Process ${orphanPids[0]} (ipc-server) terminated successfully`,
        `Process ${orphanPids[1]} (file-watcher) terminated successfully`, 
        `Process ${orphanPids[2]} (state-inspector) termination failed - access denied`
      ]
    }),
    
    fileCleanup: createTestFileCleanupResult({
      filesDeleted: staleFiles.length - 1, // One protected
      directoriesRemoved: 1,
      filesSkipped: 1,
      bytesFreed: 1024 * 50, // 50KB
      failures: [{ path: staleFiles[2], error: 'Permission denied' }],
      details: [
        { path: staleFiles[0], action: 'deleted', reason: 'Temporary file cleanup', size: 1024 },
        { path: staleFiles[1], action: 'deleted', reason: 'Temporary file cleanup', size: 50176 },
        { path: staleFiles[2], action: 'skipped', reason: 'Protected file' }
      ]
    }),
    
    commandConflicts: createTestCommandRegistrationResult({
      successful: 15,
      skipped: 3,
      failed: 1,
      details: [
        { commandId: 'haruspex.refreshAll', status: 'skipped', reason: 'already registered', attempts: 1 },
        { commandId: 'haruspex.showHealth', status: 'success', reason: 'registered successfully', attempts: 1 },
        { commandId: 'haruspex.debugCommand', status: 'failed', reason: 'invalid handler', attempts: 1 }
      ]
    })
  };
}

/**
 * Create hot-reload conflict scenario
 */
export function createHotReloadConflictScenario() {
  return {
    existingCommands: [
      { id: 'haruspex.refreshAll', category: 'core' as const, registered: true },
      { id: 'haruspex.showHealth', category: 'ui' as const, registered: true },
      { id: 'haruspex.debug.start', category: 'debug' as const, registered: true }
    ],
    
    newCommands: [
      { commandId: 'haruspex.refreshAll', handler: jest.fn(), metadata: { category: 'core' as const } },
      { commandId: 'haruspex.newCommand', handler: jest.fn(), metadata: { category: 'ui' as const } },
      { commandId: 'haruspex.debug.enhanced', handler: jest.fn(), metadata: { category: 'debug' as const } }
    ],
    
    expectedResolution: {
      successful: 2, // newCommand and debug.enhanced
      skipped: 1,    // refreshAll (conflict)
      failed: 0,
      details: [
        { commandId: 'haruspex.refreshAll', status: 'skipped', reason: 'conflict detected, preserved existing registration', attempts: 1 },
        { commandId: 'haruspex.newCommand', status: 'success', reason: 'registered successfully', attempts: 1 },
        { commandId: 'haruspex.debug.enhanced', status: 'success', reason: 'registered successfully', attempts: 1 }
      ]
    }
  };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate that a cleanup result has expected structure
 */
export function validateCleanupResult(result: CleanupResult): void {
  expect(result).toHaveProperty('success');
  expect(result).toHaveProperty('duration');
  expect(result).toHaveProperty('processes');
  expect(result).toHaveProperty('files');
  expect(result).toHaveProperty('commands');
  expect(result).toHaveProperty('errors');
  expect(result).toHaveProperty('summary');
  
  expect(typeof result.success).toBe('boolean');
  expect(typeof result.duration).toBe('number');
  expect(Array.isArray(result.errors)).toBe(true);
  expect(typeof result.summary).toBe('string');
}

/**
 * Validate that a startup recovery result has expected structure
 */
export function validateStartupRecoveryResult(result: StartupRecoveryResult): void {
  expect(result).toHaveProperty('recoveryNeeded');
  expect(result).toHaveProperty('orphanProcesses');
  expect(result).toHaveProperty('fileCleanup');
  expect(result).toHaveProperty('commandConflicts');
  expect(result).toHaveProperty('summary');
  
  expect(typeof result.recoveryNeeded).toBe('boolean');
  expect(typeof result.summary).toBe('string');
}

/**
 * Assert that error aggregation is working correctly
 */
export function expectErrorAggregation(
  errors: any[],
  expectedMinimum: number = 0,
  expectedTypes: string[] = []
): void {
  expect(Array.isArray(errors)).toBe(true);
  expect(errors.length).toBeGreaterThanOrEqual(expectedMinimum);
  
  if (expectedTypes.length > 0) {
    const errorTypes = errors.map(e => e.name || e.type || typeof e);
    expectedTypes.forEach(expectedType => {
      expect(errorTypes).toContain(expectedType);
    });
  }
}

/**
 * Generate test session ID
 */
export function generateTestSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test_session_${timestamp}_${random}`;
}

/**
 * Create temporary test workspace
 */
export function createTestWorkspace(): string {
  const testDir = path.join(os.tmpdir(), `haruspex-test-${Date.now()}`);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  return testDir;
}

/**
 * Cleanup test workspace
 */
export function cleanupTestWorkspace(testDir: string): void {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

/**
 * Wait for async operations to complete
 */
export function waitForAsync(ms: number = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create timeout promise for testing timeout scenarios
 */
export function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
}

// =============================================================================
// SAFETY TEST HELPERS
// =============================================================================

/**
 * Validate that user work protection is functioning
 */
export function validateUserWorkProtection(
  cleanupResult: FileCleanupResult,
  protectedFiles: string[]
): void {
  // Ensure protected files were not deleted
  protectedFiles.forEach(file => {
    const wasDeleted = cleanupResult.details.some(detail => 
      detail.path.includes(file) && detail.action === 'deleted'
    );
    expect(wasDeleted).toBe(false);
  });
  
  // Check that files were properly skipped
  expect(cleanupResult.filesSkipped).toBeGreaterThan(0);
}

/**
 * Validate that process ownership verification is working
 */
export function validateProcessOwnership(
  processTracker: ProcessTracker,
  expectedOwner: number = process.pid
): void {
  expect(processTracker.metadata).toHaveProperty('parentPid');
  expect(processTracker.metadata.parentPid).toBe(expectedOwner);
}

/**
 * Validate that emergency shutdown procedures are safe
 */
export function validateEmergencyShutdownSafety(result: CleanupResult): void {
  // Emergency shutdown should always complete
  expect(result).toBeDefined();
  expect(typeof result.duration).toBe('number');
  expect(result.duration).toBeGreaterThan(0);
  
  // Should have attempted to clean processes even if files were skipped
  expect(result.processes).toBeDefined();
  expect(typeof result.processes.cleaned).toBe('number');
  expect(typeof result.processes.failed).toBe('number');
  
  // Files might be skipped in emergency shutdown
  expect(result.files).toBeDefined();
}