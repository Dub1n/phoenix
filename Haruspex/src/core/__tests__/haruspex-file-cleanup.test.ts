/**---
 * title: [Haruspex File Cleanup Tests - Safe File Operations Testing]
 * tags: [Testing, File-Cleanup, Safety, User-Protection, Validation]
 * provides: [UnitTests, SafetyValidation, UserWorkProtection, FileSystemTesting]
 * requires: [Jest, Test Utilities, File Cleanup, Shared Schemas, File System APIs]
 * description: [Comprehensive unit tests for HaruspexFileCleanup with emphasis on user work protection, safety mechanisms, and configuration validation]
 * ---*/

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { HaruspexFileCleanup, FileCleanupResult } from '../haruspex-file-cleanup';
import { FileCleanupConfig } from '../shared-schemas';
import { HaruspexError, FileSystemError, FileProtectionError, ErrorSeverity } from '../shared-errors';
import {
  createMockDebugLog,
  createMockFileSystem,
  createTestFileCleanupConfig,
  createTestFileCleanupResult,
  createTestWorkspace,
  cleanupTestWorkspace,
  waitForAsync,
  validateUserWorkProtection,
  expectErrorAggregation
} from './test-utils/cleanup-test-utils';

// Mock Node.js file system APIs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
    rmdir: jest.fn(),
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

describe('HaruspexFileCleanup', () => {
  let fileCleanup: HaruspexFileCleanup;
  let mockDebugLog: jest.MockedFunction<any>;
  let mockFileSystem: ReturnType<typeof createMockFileSystem>;
  let testWorkspace: string;
  let testConfig: FileCleanupConfig;
  
  beforeAll(() => {
    testWorkspace = createTestWorkspace();
  });
  
  afterAll(() => {
    cleanupTestWorkspace(testWorkspace);
  });
  
  beforeEach(() => {
    mockDebugLog = createMockDebugLog();
    mockFileSystem = createMockFileSystem();
    testConfig = createTestFileCleanupConfig();
    
    fileCleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, testConfig);
    
    // Setup default mock implementations
    (fs.promises.readdir as jest.Mock).mockImplementation(mockFileSystem.readdir);
    (fs.promises.stat as jest.Mock).mockImplementation(mockFileSystem.stat);
    (fs.promises.unlink as jest.Mock).mockImplementation(mockFileSystem.unlink);
    (fs.promises.rmdir as jest.Mock).mockImplementation(mockFileSystem.rmdir);
    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
    
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    mockFileSystem.clearMocks();
  });

  // =============================================================================
  // CONSTRUCTION AND CONFIGURATION TESTS
  // =============================================================================

  describe('Constructor and Configuration', () => {
    it('should create file cleanup with valid configuration', () => {
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, testConfig);
      expect(cleanup).toBeInstanceOf(HaruspexFileCleanup);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('File Cleanup created')
      );
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = { 
        ...testConfig, 
        cleanup: {
          enableRecursiveCleanup: true,
          maxFileSize: -1, // Invalid negative size
          minFileAge: 3600000,
          enableEmptyDirectoryCleanup: true
        }
      };
      
      expect(() => {
        new HaruspexFileCleanup(testWorkspace, mockDebugLog, invalidConfig);
      }).toThrow();
    });

    it('should use default configuration when partial config provided', () => {
      const partialConfig: Partial<FileCleanupConfig> = {
        enableDetailedLogging: false,
        patterns: {
          includePaths: ['**/*.temp'],
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: [],
          protectedPatterns: ['**/*.ts', '**/*.js'],
          tempFileExtensions: ['.tmp'],
          tempFilePatterns: ['**/*.temp']
        }
      };
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, partialConfig);
      expect(cleanup).toBeInstanceOf(HaruspexFileCleanup);
      
      const config = cleanup.getConfiguration();
      expect(config.enableDetailedLogging).toBe(false);
      expect(config.enableSafetyChecks).toBe(true); // Should use default
    });

    it('should validate file patterns', () => {
      const configWithInvalidPatterns = {
        ...testConfig,
        patterns: {
          includePaths: ['[invalid-glob'], // Invalid glob pattern
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: [],
          protectedPatterns: [],
          tempFileExtensions: ['.tmp'],
          tempFilePatterns: ['**/*.tmp']
        }
      };
      
      expect(() => {
        new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithInvalidPatterns);
      }).toThrow();
    });

    it('should emit configuration events', (done) => {
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, testConfig);
      
      cleanup.on('configuration_validated', (result) => {
        expect(result.success).toBe(true);
        done();
      });
    });
  });

  // =============================================================================
  // FILE DISCOVERY AND FILTERING TESTS
  // =============================================================================

  describe('File Discovery and Filtering', () => {
    beforeEach(() => {
      // Setup test file structure
      mockFileSystem.addMockFile('/test/temp/file1.tmp', 'temporary content');
      mockFileSystem.addMockFile('/test/temp/file2.temp', 'another temp file');
      mockFileSystem.addMockFile('/test/important/README.md', '# Important Documentation');
      mockFileSystem.addMockFile('/test/important/config.json', '{"key": "value"}');
      mockFileSystem.addMockFile('/test/logs/old.log', 'old log content');
      mockFileSystem.addMockFile('/test/node_modules/package/index.js', 'module content');
      mockFileSystem.addMockDirectory('/test/temp');
      mockFileSystem.addMockDirectory('/test/important');
      mockFileSystem.addMockDirectory('/test/logs');
      mockFileSystem.addMockDirectory('/test/node_modules');
    });

    it('should discover files matching include patterns', async () => {
      const configWithPatterns = createTestFileCleanupConfig({
        patterns: {
          includePaths: ['**/*.tmp', '**/*.temp'],
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: [],
          protectedPatterns: [],
          tempFileExtensions: ['.tmp', '.temp'],
          tempFilePatterns: ['**/*.tmp', '**/*.temp']
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithPatterns);
      
      // Mock fs.promises.readdir to return our test structure
      (fs.promises.readdir as jest.Mock).mockImplementation(async (dirPath) => {
        if (dirPath.includes('temp')) {
          return ['file1.tmp', 'file2.temp'];
        }
        return ['temp', 'important', 'logs', 'node_modules'];
      });
      
      const result = await cleanup.cleanupFiles();
      
      expect(result.filesDeleted).toBe(2); // Should match both .tmp and .temp files
      expect(result.failures).toHaveLength(0);
    });

    it('should exclude files based on exclude patterns', async () => {
      const configWithExcludes = createTestFileCleanupConfig({
        patterns: {
          includePaths: ['**/*'],
          excludePaths: ['**/node_modules/**', '**/important/**'],
          preserveUserWork: true,
          userWorkPatterns: [],
          protectedPatterns: [],
          tempFileExtensions: ['.tmp', '.temp'],
          tempFilePatterns: ['**/*.tmp', '**/*.temp']
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithExcludes);
      
      (fs.promises.readdir as jest.Mock).mockImplementation(async (dirPath) => {
        if (dirPath.includes('temp')) {
          return ['file1.tmp', 'file2.temp'];
        } else if (dirPath.includes('logs')) {
          return ['old.log'];
        }
        return ['temp', 'important', 'logs', 'node_modules'];
      });
      
      const result = await cleanup.cleanupFiles();
      
      // Should clean temp and logs but not important or node_modules
      expect(result.filesDeleted).toBe(3); // 2 temp files + 1 log file
      expect(result.failures).toHaveLength(0);
    });

    it('should protect user work files', async () => {
      const configWithUserProtection = createTestFileCleanupConfig({
        patterns: {
          includePaths: ['**/*'],
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: ['**/*.md', '**/*.json', '**/*.txt'],
          protectedPatterns: ['**/*.md', '**/*.json', '**/*.txt'],
          tempFileExtensions: ['.tmp', '.temp'],
          tempFilePatterns: ['**/*.tmp', '**/*.temp']
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithUserProtection);
      
      (fs.promises.readdir as jest.Mock).mockImplementation(async (dirPath) => {
        if (dirPath.includes('temp')) {
          return ['file1.tmp', 'file2.temp'];
        } else if (dirPath.includes('important')) {
          return ['README.md', 'config.json'];
        }
        return ['temp', 'important'];
      });
      
      const result = await cleanup.cleanupFiles();
      
      validateUserWorkProtection(result, ['/test/important/README.md', '/test/important/config.json']);
      expect(result.filesSkipped).toBeGreaterThan(0);
    });

    it('should handle file age filtering', async () => {
      const oldFile = '/test/old-file.tmp';
      const newFile = '/test/new-file.tmp';
      
      mockFileSystem.addMockFile(oldFile, 'old content');
      mockFileSystem.addMockFile(newFile, 'new content');
      
      const configWithAgeFilter = createTestFileCleanupConfig({
        cleanup: {
          enableRecursiveCleanup: true,
          maxFileSize: 1024 * 1024,
          minFileAge: 1000, // 1 second
          enableEmptyDirectoryCleanup: true
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithAgeFilter);
      
      // Mock stat to return different ages
      (fs.promises.stat as jest.Mock).mockImplementation(async (filePath) => {
        const isOld = filePath.includes('old-file');
        return {
          isFile: () => true,
          isDirectory: () => false,
          size: 100,
          mtime: new Date(Date.now() - (isOld ? 5000 : 500)), // Old file vs new file
          ctime: new Date()
        };
      });
      
      const result = await cleanup.cleanupFiles();
      
      // Should only delete old file
      expect(result.filesDeleted).toBe(1);
      expect(result.filesSkipped).toBeGreaterThanOrEqual(1);
    });

    it('should handle file size filtering', async () => {
      const smallFile = '/test/small.tmp';
      const largeFile = '/test/large.tmp';
      
      mockFileSystem.addMockFile(smallFile, 'small');
      mockFileSystem.addMockFile(largeFile, 'very large content'.repeat(1000));
      
      const configWithSizeFilter = createTestFileCleanupConfig({
        cleanup: {
          enableRecursiveCleanup: true,
          maxFileSize: 100, // 100 bytes limit
          minFileAge: 0,
          enableEmptyDirectoryCleanup: true
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithSizeFilter);
      
      // Mock stat to return different sizes
      (fs.promises.stat as jest.Mock).mockImplementation(async (filePath) => {
        const isLarge = filePath.includes('large');
        return {
          isFile: () => true,
          isDirectory: () => false,
          size: isLarge ? 50000 : 50, // Large vs small file
          mtime: new Date(Date.now() - 5000),
          ctime: new Date()
        };
      });
      
      const result = await cleanup.cleanupFiles();
      
      // Should only delete small file
      expect(result.filesDeleted).toBe(1);
      expect(result.filesSkipped).toBeGreaterThanOrEqual(1);
    });
  });

  // =============================================================================
  // SAFE FILE DELETION TESTS
  // =============================================================================

  describe('Safe File Deletion', () => {
    it('should perform safe file deletion with validation', async () => {
      const testFile = '/test/safe-delete.tmp';
      mockFileSystem.addMockFile(testFile, 'content to delete');
      
      const result = await fileCleanup.cleanupFiles();
      
      expect(mockFileSystem.unlink).toHaveBeenCalled();
      expect(result.filesDeleted).toBeGreaterThan(0);
      expect(result.failures).toHaveLength(0);
    });

    it('should handle file deletion failures gracefully', async () => {
      const protectedFile = '/test/protected.tmp';
      mockFileSystem.addMockFile(protectedFile, 'protected content');
      
      // Mock unlink to fail for protected file
      (fs.promises.unlink as jest.Mock).mockRejectedValue(new Error('Permission denied'));
      
      const result = await fileCleanup.cleanupFiles();
      
      expect(result.filesDeleted).toBe(0);
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.failures[0]).toContain('Permission denied');
    });

    it('should validate file ownership before deletion', async () => {
      const configWithOwnership = createTestFileCleanupConfig({
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: false,
          enableFileBackup: false,
          maxAgeThreshold: 60000
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithOwnership);
      
      const testFile = '/test/ownership-test.tmp';
      mockFileSystem.addMockFile(testFile, 'test content');
      
      // Mock stat to return ownership info
      (fs.promises.stat as jest.Mock).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 100,
        mtime: new Date(Date.now() - 5000),
        ctime: new Date(),
        uid: process.getuid ? process.getuid() : 1000,
        gid: process.getgid ? process.getgid() : 1000
      });
      
      const result = await cleanup.cleanupFiles();
      
      expect(result.filesDeleted).toBeGreaterThan(0);
      expect(mockDebugLog).not.toHaveBeenCalledWith(
        expect.stringContaining('ownership verification failed'),
        'warning'
      );
    });

    it('should create backups when configured', async () => {
      const configWithBackup = createTestFileCleanupConfig({
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: true,
          enableFileBackup: true,
          maxAgeThreshold: 60000
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithBackup);
      
      const testFile = '/test/backup-test.tmp';
      const testContent = 'important backup content';
      mockFileSystem.addMockFile(testFile, testContent);
      
      // Mock readFile for backup creation
      (fs.promises.readFile as jest.Mock).mockResolvedValue(testContent);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      
      const result = await cleanup.cleanupFiles();
      
      expect(fs.promises.readFile).toHaveBeenCalledWith(testFile, 'utf-8');
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.backup'),
        testContent
      );
      expect(result.filesDeleted).toBeGreaterThan(0);
    });

    it('should handle backup creation failures', async () => {
      const configWithBackup = createTestFileCleanupConfig({
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: true,
          enableFileBackup: true,
          maxAgeThreshold: 60000
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithBackup);
      
      const testFile = '/test/backup-fail.tmp';
      mockFileSystem.addMockFile(testFile, 'content');
      
      // Mock backup creation to fail
      (fs.promises.readFile as jest.Mock).mockResolvedValue('content');
      (fs.promises.writeFile as jest.Mock).mockRejectedValue(new Error('Backup failed'));
      
      const result = await cleanup.cleanupFiles();
      
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.failures[0]).toContain('Backup failed');
      expect(result.filesDeleted).toBe(0); // Should not delete if backup fails
    });
  });

  // =============================================================================
  // DIRECTORY CLEANUP TESTS
  // =============================================================================

  describe('Directory Cleanup', () => {
    beforeEach(() => {
      mockFileSystem.addMockDirectory('/test/empty-dir');
      mockFileSystem.addMockDirectory('/test/non-empty-dir');
      mockFileSystem.addMockFile('/test/non-empty-dir/file.txt', 'content');
    });

    it('should remove empty directories when enabled', async () => {
      const configWithDirCleanup = createTestFileCleanupConfig({
        cleanup: {
          enableRecursiveCleanup: true,
          maxFileSize: 1024 * 1024,
          minFileAge: 0,
          enableEmptyDirectoryCleanup: true
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithDirCleanup);
      
      // Mock readdir to return empty for empty-dir
      (fs.promises.readdir as jest.Mock).mockImplementation(async (dirPath) => {
        if (dirPath.includes('empty-dir')) {
          return [];
        }
        return ['file.txt'];
      });
      
      const result = await cleanup.cleanupFiles();
      
      expect(mockFileSystem.rmdir).toHaveBeenCalledWith(
        expect.stringContaining('empty-dir')
      );
      expect(result.directoriesRemoved).toBeGreaterThan(0);
    });

    it('should not remove non-empty directories', async () => {
      const configWithDirCleanup = createTestFileCleanupConfig({
        cleanup: {
          enableRecursiveCleanup: true,
          maxFileSize: 1024 * 1024,
          minFileAge: 0,
          enableEmptyDirectoryCleanup: true
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithDirCleanup);
      
      // Mock readdir to return files for non-empty-dir
      (fs.promises.readdir as jest.Mock).mockImplementation(async (dirPath) => {
        if (dirPath.includes('empty-dir')) {
          return [];
        }
        return ['file.txt'];
      });
      
      const result = await cleanup.cleanupFiles();
      
      expect(mockFileSystem.rmdir).not.toHaveBeenCalledWith(
        expect.stringContaining('non-empty-dir')
      );
    });

    it('should handle directory removal failures', async () => {
      const configWithDirCleanup = createTestFileCleanupConfig({
        cleanup: {
          enableRecursiveCleanup: true,
          maxFileSize: 1024 * 1024,
          minFileAge: 0,
          enableEmptyDirectoryCleanup: true
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithDirCleanup);
      
      // Mock readdir to return empty directory
      (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
      
      // Mock rmdir to fail
      (fs.promises.rmdir as jest.Mock).mockRejectedValue(new Error('Directory in use'));
      
      const result = await cleanup.cleanupFiles();
      
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.failures[0]).toContain('Directory in use');
    });
  });

  // =============================================================================
  // DRY RUN MODE TESTS
  // =============================================================================

  describe('Dry Run Mode', () => {
    beforeEach(() => {
      mockFileSystem.addMockFile('/test/dry-run-test.tmp', 'test content');
      mockFileSystem.addMockDirectory('/test/empty-for-dry-run');
    });

    it('should simulate cleanup without actual deletion in dry run mode', async () => {
      const dryRunConfig = createTestFileCleanupConfig({
        dryRun: true
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, dryRunConfig);
      const result = await cleanup.cleanupFiles();
      
      expect(mockFileSystem.unlink).not.toHaveBeenCalled();
      expect(mockFileSystem.rmdir).not.toHaveBeenCalled();
      expect(result.filesDeleted).toBe(0);
      expect(result.directoriesRemoved).toBe(0);
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('DRY RUN'),
        'info'
      );
    });

    it('should provide detailed dry run reporting', async () => {
      const dryRunConfig = createTestFileCleanupConfig({
        dryRun: true,
        enableDetailedLogging: true
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, dryRunConfig);
      const result = await cleanup.cleanupFiles();
      
      expect(result.details.length).toBeGreaterThan(0);
      expect(result.details.some(detail => 
        detail.reason.includes('would be deleted') || detail.reason.includes('would be removed')
      )).toBe(true);
    });
  });

  // =============================================================================
  // ERROR HANDLING AND RECOVERY TESTS
  // =============================================================================

  describe('Error Handling and Recovery', () => {
    it('should collect and report file system errors', async () => {
      const testFile = '/test/error-file.tmp';
      mockFileSystem.addMockFile(testFile, 'content');
      
      // Mock unlink to throw file system error
      (fs.promises.unlink as jest.Mock).mockRejectedValue(
        new FileSystemError(
          'File system access error',
          'FileCleanup',
          testFile,
          'unlink'
        )
      );
      
      await fileCleanup.cleanupFiles();
      
      const errors = fileCleanup.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      const errorSummary = fileCleanup.getErrorSummary();
      expect(errorSummary.total).toBeGreaterThan(0);
      expect(errorSummary.byClassification.system).toBeGreaterThan(0);
    });

    it('should handle file protection errors', async () => {
      const protectedFile = '/test/user-work.md';
      mockFileSystem.addMockFile(protectedFile, '# User Documentation');
      
      const configWithProtection = createTestFileCleanupConfig({
        patterns: {
          includePaths: ['**/*'],
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: ['**/*.md'],
          protectedPatterns: ['**/*.md'],
          tempFileExtensions: ['.tmp'],
          tempFilePatterns: ['**/*.tmp']
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithProtection);
      
      // Even if unlink is called, it should be skipped due to protection
      (fs.promises.unlink as jest.Mock).mockImplementation(async (filePath) => {
        if (filePath.includes('user-work.md')) {
          throw new FileProtectionError(
            'File protected by user work patterns',
            'FileCleanup',
            filePath
          );
        }
      });
      
      const result = await cleanup.cleanupFiles();
      
      expect(result.filesSkipped).toBeGreaterThan(0);
      expect(result.failures).toHaveLength(0); // Should be skipped, not failed
    });

    it('should provide structured error information', async () => {
      const testFile = '/test/error-structured.tmp';
      mockFileSystem.addMockFile(testFile, 'content');
      
      const customError = new FileSystemError(
        'Test file system error',
        'FileCleanup',
        testFile,
        'unlink'
      );
      
      (fs.promises.unlink as jest.Mock).mockRejectedValue(customError);
      
      await fileCleanup.cleanupFiles();
      
      const errors = fileCleanup.getErrors();
      const structuredError = errors[0];
      
      expect(structuredError.errorId).toBeDefined();
      expect(structuredError.name).toBe('FileSystemError');
      expect(structuredError.component).toBe('FileCleanup');
      expect(structuredError.severity).toBe(ErrorSeverity.ERROR);
      expect(structuredError.context.filePath).toBe(testFile);
    });

    it('should clear errors when requested', async () => {
      const testFile = '/test/clear-error.tmp';
      mockFileSystem.addMockFile(testFile, 'content');
      
      (fs.promises.unlink as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      await fileCleanup.cleanupFiles();
      expect(fileCleanup.getErrors().length).toBeGreaterThan(0);
      
      fileCleanup.clearErrors();
      expect(fileCleanup.getErrors()).toHaveLength(0);
    });
  });

  // =============================================================================
  // CONFIGURATION VALIDATION TESTS
  // =============================================================================

  describe('Configuration Validation', () => {
    it('should validate pattern configuration', () => {
      expect(() => {
        new HaruspexFileCleanup(testWorkspace, mockDebugLog, {
          ...testConfig,
          patterns: {
            includePaths: [], // Empty include paths
            excludePaths: [],
            preserveUserWork: true,
            userWorkPatterns: [],
            protectedPatterns: [],
            tempFileExtensions: [],
            tempFilePatterns: []
          }
        });
      }).toThrow();
    });

    it('should validate cleanup configuration', () => {
      const validConfig = createTestFileCleanupConfig({
        cleanup: {
          enableRecursiveCleanup: true,
          maxFileSize: 1024,
          minFileAge: 1000,
          enableEmptyDirectoryCleanup: true
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, validConfig);
      expect(cleanup).toBeInstanceOf(HaruspexFileCleanup);
    });

    it('should provide configuration validation results', () => {
      const validationResult = fileCleanup.getConfigurationValidation();
      expect(validationResult.success).toBe(true);
      expect(validationResult.data).toBeDefined();
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should merge partial configurations correctly', () => {
      const partialConfig: Partial<FileCleanupConfig> = {
        enableDetailedLogging: false,
        patterns: {
          includePaths: ['**/*.temp'],
          excludePaths: ['**/protected/**'],
          preserveUserWork: false,
          userWorkPatterns: [],
          protectedPatterns: [],
          tempFileExtensions: ['.temp'],
          tempFilePatterns: ['**/*.temp']
        }
      };
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, partialConfig);
      const mergedConfig = cleanup.getConfiguration();
      
      expect(mergedConfig.enableDetailedLogging).toBe(false);
      expect(mergedConfig.patterns?.preserveUserWork).toBe(false);
      expect(mergedConfig.enableSafetyChecks).toBe(true); // Default value
    });
  });

  // =============================================================================
  // INTEGRATION AND STATUS TESTS
  // =============================================================================

  describe('Status and Integration', () => {
    it('should provide comprehensive status information', () => {
      const status = fileCleanup.getStatus();
      
      expect(status.initialized).toBe(false); // Not initialized yet
      expect(status.canCleanup).toBe(true);
      expect(status.configuration.valid).toBe(true);
    });

    it('should generate comprehensive status report', () => {
      mockFileSystem.addMockFile('/test/status-test.tmp', 'content');
      
      const report = fileCleanup.generateStatusReport();
      
      expect(report.configuration.valid).toBe(true);
      expect(report.patterns.includePaths.length).toBeGreaterThan(0);
      expect(report.safety.userWorkProtection).toBe(true);
      expect(report.errors.total).toBe(0);
    });

    it('should emit lifecycle events', (done) => {
      let eventCount = 0;
      
      fileCleanup.on('cleanup_started', () => {
        eventCount++;
        if (eventCount === 2) done();
      });
      
      fileCleanup.on('cleanup_completed', () => {
        eventCount++;
        if (eventCount === 2) done();
      });
      
      // Trigger cleanup
      fileCleanup.cleanupFiles();
    });

    it('should handle concurrent cleanup requests safely', async () => {
      mockFileSystem.addMockFile('/test/concurrent.tmp', 'content');
      
      const cleanupPromises = [
        fileCleanup.cleanupFiles(),
        fileCleanup.cleanupFiles(),
        fileCleanup.cleanupFiles()
      ];
      
      const results = await Promise.allSettled(cleanupPromises);
      
      // All should succeed (or be handled gracefully)
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(3);
    });
  });

  // =============================================================================
  // SAFETY AND EDGE CASE TESTS
  // =============================================================================

  describe('Safety and Edge Cases', () => {
    it('should handle missing workspace directory', async () => {
      const nonExistentWorkspace = '/non/existent/path';
      const cleanup = new HaruspexFileCleanup(nonExistentWorkspace, mockDebugLog, testConfig);
      
      (fs.promises.readdir as jest.Mock).mockRejectedValue(new Error('ENOENT: no such file or directory'));
      
      const result = await cleanup.cleanupFiles();
      
      expect(result.filesDeleted).toBe(0);
      expect(result.failures.length).toBeGreaterThan(0);
    });

    it('should handle permission denied errors gracefully', async () => {
      const protectedFile = '/test/no-permission.tmp';
      mockFileSystem.addMockFile(protectedFile, 'protected');
      
      (fs.promises.unlink as jest.Mock).mockRejectedValue({
        code: 'EACCES',
        message: 'Permission denied'
      });
      
      const result = await fileCleanup.cleanupFiles();
      
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.failures[0]).toContain('Permission denied');
    });

    it('should handle file system full errors', async () => {
      const testFile = '/test/filesystem-full.tmp';
      mockFileSystem.addMockFile(testFile, 'content');
      
      // Mock backup creation to fail due to no space
      (fs.promises.writeFile as jest.Mock).mockRejectedValue({
        code: 'ENOSPC',
        message: 'No space left on device'
      });
      
      const configWithBackup = createTestFileCleanupConfig({
        safety: {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: true,
          enableFileBackup: true,
          maxAgeThreshold: 60000
        }
      });
      
      const cleanup = new HaruspexFileCleanup(testWorkspace, mockDebugLog, configWithBackup);
      const result = await cleanup.cleanupFiles();
      
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.failures[0]).toContain('No space left on device');
    });

    it('should handle symbolic links safely', async () => {
      const symlinkFile = '/test/symlink.tmp';
      mockFileSystem.addMockFile(symlinkFile, 'symlink content');
      
      // Mock stat to indicate symbolic link
      (fs.promises.stat as jest.Mock).mockResolvedValue({
        isFile: () => false,
        isDirectory: () => false,
        isSymbolicLink: () => true,
        size: 100,
        mtime: new Date(Date.now() - 5000),
        ctime: new Date()
      });
      
      const result = await fileCleanup.cleanupFiles();
      
      // Should handle symbolic links appropriately
      expect(result).toBeDefined();
      expect(mockDebugLog).toHaveBeenCalledWith(
        expect.stringContaining('symbolic link'),
        expect.any(String)
      );
    });

    it('should handle very large file lists', async () => {
      const largeFileCount = 1000;
      
      // Add many mock files
      for (let i = 0; i < largeFileCount; i++) {
        mockFileSystem.addMockFile(`/test/large-${i}.tmp`, `content ${i}`);
      }
      
      // Mock readdir to return large file list
      (fs.promises.readdir as jest.Mock).mockResolvedValue(
        Array.from({ length: largeFileCount }, (_, i) => `large-${i}.tmp`)
      );
      
      const result = await fileCleanup.cleanupFiles();
      
      // Should handle large file lists without issues
      expect(result).toBeDefined();
      expect(typeof result.filesDeleted).toBe('number');
      expect(typeof result.duration).toBe('number');
    });
  });
});