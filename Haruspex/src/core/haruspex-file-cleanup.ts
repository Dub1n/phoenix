/**---
 * title: [Haruspex File Cleanup Manager - Safe Temporary File Management]
 * tags: [Core, File-Management, Cleanup, Safety, Temporary-Files]
 * provides: [SafeFileCleanup, UserWorkProtection, TemporaryFileManagement, ConfigPreservation]
 * requires: [Node.js File System, Path Resolution, Safety Validation, Shared Configuration, Structured Errors]
 * description: [Safe file cleanup system with unified configuration patterns, structured error handling, and comprehensive safety mechanisms]
 * ---*/

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { FileCleanupConfig, FileCleanupConfigSchema, validateConfig, ValidationResult } from './shared-schemas';
import { 
  HaruspexError, 
  FileManagementError, 
  FileAccessError, 
  FileSafetyError,
  TimeoutError,
  AsyncOperationError,
  ErrorClassifier,
  ErrorClassification,
  RecoveryStrategy,
  ErrorAggregator,
  ErrorSeverity
} from './shared-errors';

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

// Configuration interface is now imported from shared-schemas.ts

export interface FileCleanupResult {
  /** Number of files successfully deleted */
  filesDeleted: number;
  /** Number of directories removed */
  directoriesRemoved: number;
  /** Number of files skipped for safety */
  filesSkipped: number;
  /** Total bytes freed */
  bytesFreed: number;
  /** Total duration of cleanup operation (ms) */
  duration?: number;
  /** Files that couldn't be deleted */
  failures: Array<{
    path: string;
    error: string;
  }>;
  /** Details about what was cleaned */
  details: Array<{
    path: string;
    action: 'deleted' | 'skipped' | 'failed';
    reason: string;
    size?: number;
  }>;
}

export interface FileSafetyAnalysis {
  /** Is this file safe to delete? */
  safeToDelete: boolean;
  /** Reason for safety decision */
  reason: string;
  /** File classification */
  classification: 'user-work' | 'haruspex-config' | 'haruspex-temp' | 'system' | 'unknown';
  /** Additional safety warnings */
  warnings: string[];
}

/**
 * Safe file cleanup manager for Haruspex temporary files
 * 
 * Safety Features:
 * - Only cleans files in designated temporary directories
 * - Protects user source code and configuration
 * - Age-based cleanup for temporary files
 * - Pattern-based protection for important files
 * - Dry-run mode for testing cleanup rules
 * - Comprehensive logging of all cleanup actions
 */
export class HaruspexFileCleanup extends EventEmitter {
  private config: FileCleanupConfig;
  private workspaceRoot: string;
  private errorAggregator = new ErrorAggregator();
  private configValidation: ValidationResult<FileCleanupConfig>;

  constructor(
    workspaceRoot: string,
    private debugLog: (message: string, level?: 'info' | 'warning' | 'error') => void,
    config: Partial<FileCleanupConfig> = {}
  ) {
    super();
    this.workspaceRoot = workspaceRoot;
    
    // Validate and merge configuration with comprehensive schema validation
    this.configValidation = this.validateAndMergeConfig(config);
    
    // Emit configuration validation event
    this.emit('configuration_validated', this.configValidation);
    
    if (!this.configValidation.success) {
      const error = new (class extends HaruspexError {
        getClassification() { return ErrorClassification.CONFIGURATION; }
        getRecoveryStrategy() { return RecoveryStrategy.USER_INTERVENTION; }
      })(
        `File Cleanup configuration validation failed: ${this.configValidation.errors.map(e => e.message).join(', ')}`,
        'FileCleanup',
        ErrorSeverity.ERROR,
        false,
        { validationErrors: this.configValidation.errors }
      );
      
      this.errorAggregator.add(error);
      this.debugLog(`Configuration validation failed: ${error.message}`, 'error');
      
      // Use defaults but log the issues
      this.config = this.createDefaultConfig();
    } else {
      this.config = this.configValidation.data!;
    }
  }

  /**
   * Validate and merge configuration with schema validation
   */
  private validateAndMergeConfig(config: Partial<FileCleanupConfig>): ValidationResult<FileCleanupConfig> {
    const defaultConfig = this.createDefaultConfig();
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      // Merge nested objects properly
      directories: {
        ...defaultConfig.directories,
        ...config.directories
      },
      patterns: {
        ...defaultConfig.patterns,
        ...config.patterns
      },
      ageThresholds: {
        ...defaultConfig.ageThresholds,
        ...config.ageThresholds
      }
    };
    
    return validateConfig(FileCleanupConfigSchema, mergedConfig, 'FileCleanup');
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): FileCleanupConfig {
    return {
      enableDetailedLogging: true,
      enableSafetyChecks: true,
      dryRun: false,
      gracefulTimeout: 10000,
      ageThresholds: {
        minFileAge: 3600000, // 1 hour
        maxTempAge: 86400000, // 24 hours  
        maxTempFileAge: 3600000, // 1 hour
        maxLogFileAge: 86400000, // 24 hours
        maxCacheFileAge: 7200000, // 2 hours
        enableAgeCheck: true
      },
      directories: {
        tempDirectories: ['/tmp', '/temp'],
        safeTempDirectories: [
          '.haruspex/temp',
          '.haruspex/cache',
          '.haruspex/logs'
        ],
        protectedDirectories: [
          '.git',
          '.vscode',
          'node_modules',
          'src',
          'docs'
        ],
        enableDirectoryCleanup: true
      },
      patterns: {
        includePaths: ['**/*.tmp', '**/*.temp'],
        excludePaths: ['**/node_modules/**', '**/.git/**'],
        preserveUserWork: true,
        userWorkPatterns: ['**/*.md', '**/*.txt', '**/*.json'],
        protectedPatterns: [
          '**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx',
          '**/*.md', '**/*.json', '**/*.yaml', '**/*.yml',
          '.vscode/**/*', 'package.json', 'tsconfig.json',
          '.haruspex/config.json', '.haruspex/settings.json'
        ],
        tempFileExtensions: [
          '.tmp', '.temp', '.log', '.pid', '.lock'
        ],
        tempFilePatterns: [
          '.haruspex/temp/**/*',
          '.haruspex/cache/**/*',
          '.haruspex/logs/*.log',
          '.haruspex/*-connection.json',
          '.haruspex/processes.json'
        ]
      }
    };
  }

  /**
   * Execute operation with timeout protection
   */
  private async executeWithTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new TimeoutError(
          `Operation '${operationName}' timed out after ${timeoutMs}ms`,
          'FileCleanup',
          timeoutMs,
          operationName
        );
        this.errorAggregator.add(error);
        reject(error);
      }, timeoutMs);

      operation
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Perform comprehensive file cleanup with enhanced error handling
   */
  async cleanupFiles(): Promise<FileCleanupResult> {
    this.debugLog(`Starting file cleanup (dry-run: ${this.config.dryRun})...`);
    this.emit('cleanup_started');
    
    const result: FileCleanupResult = {
      filesDeleted: 0,
      directoriesRemoved: 0,
      filesSkipped: 0,
      bytesFreed: 0,
      failures: [],
      details: []
    };

    try {
      // Validate configuration before proceeding
      if (!this.configValidation.success) {
        throw new AsyncOperationError(
          'Cannot perform cleanup with invalid configuration',
          'FileCleanup',
          'cleanup',
          undefined,
          { configErrors: this.configValidation.errors }
        );
      }

      // Clean up temporary directories
      const safeDirs = this.config.directories?.safeTempDirectories || [];
      for (const tempDir of safeDirs) {
        const fullPath = path.join(this.workspaceRoot, tempDir);
        if (fs.existsSync(fullPath)) {
          await this.executeWithTimeout(
            this.cleanupDirectory(fullPath, result),
            this.config.gracefulTimeout || 10000,
            `Cleanup directory ${tempDir}`
          );
        }
      }

      // Clean up specific temporary files
      await this.executeWithTimeout(
        this.cleanupTemporaryFiles(result),
        this.config.gracefulTimeout || 10000,
        'Cleanup temporary files'
      );

      // Clean up old process tracking files
      await this.executeWithTimeout(
        this.cleanupProcessTrackingFiles(result),
        this.config.gracefulTimeout || 10000,
        'Cleanup process tracking files'
      );

      this.debugLog(
        `File cleanup complete: ${result.filesDeleted} files deleted, ` +
        `${result.filesSkipped} skipped, ${result.failures.length} failed`
      );

    } catch (error) {
      const structuredError = ErrorClassifier.createStructuredError(
        error,
        'FileCleanup',
        { operation: 'cleanup', workspaceRoot: this.workspaceRoot }
      );
      
      this.errorAggregator.add(structuredError);
      this.debugLog(`File cleanup failed: ${structuredError.message}`, 'error');
      result.failures.push({
        path: 'cleanup-process',
        error: structuredError.message
      });
    }

    this.emit('cleanup_completed', result);
    return result;
  }

  /**
   * Scan for temporary files without deleting them
   */
  async scanTempFiles(): Promise<{
    tempFiles: string[];
    totalSize: number;
    oldestFile?: {
      path: string;
      age: number;
    };
    newestFile?: {
      path: string;
      age: number;
    };
  }> {
    const result = {
      tempFiles: [] as string[],
      totalSize: 0,
      oldestFile: undefined as { path: string; age: number } | undefined,
      newestFile: undefined as { path: string; age: number } | undefined
    };

    try {
      const now = Date.now();

      // Scan all temporary directories
      const safeTempDirectories = this.config.directories?.safeTempDirectories || [];
      for (const tempDir of safeTempDirectories) {
        const fullPath = path.join(this.workspaceRoot, tempDir);
        if (fs.existsSync(fullPath)) {
          await this.scanDirectoryForTempFiles(fullPath, result, now);
        }
      }

      // Scan for specific temporary files
      await this.scanSpecificTempFiles(result, now);

      this.debugLog(`Temp file scan complete: ${result.tempFiles.length} files found, ${result.totalSize} bytes`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.debugLog(`Temp file scan failed: ${errorMessage}`, 'error');
    }

    return result;
  }

  /**
   * Clean up temporary files (public method)
   */
  async cleanupTempFiles(): Promise<FileCleanupResult> {
    return await this.cleanupFiles();
  }

  /**
   * Check if a specific file is protected from deletion
   */
  isFileProtected(filePath: string): boolean {
    const analysis = this.analyzeFileSafety(filePath);
    return !analysis.safeToDelete;
  }

  /**
   * Analyze if a file is safe to delete with enhanced error handling
   */
  analyzeFileSafety(filePath: string): FileSafetyAnalysis {
    const relativePath = path.relative(this.workspaceRoot, filePath);
    const analysis: FileSafetyAnalysis = {
      safeToDelete: false,
      reason: '',
      classification: 'unknown',
      warnings: []
    };

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        analysis.reason = 'File does not exist';
        analysis.safeToDelete = false;
        return analysis;
      }

      // Never delete files outside workspace
      if (relativePath.startsWith('..')) {
        analysis.reason = 'File is outside workspace';
        analysis.classification = 'system';
        analysis.warnings.push('Attempting to delete file outside workspace');
        
        const safetyError = new FileSafetyError(
          'Attempted to access file outside workspace',
          filePath,
          'outside_workspace'
        );
        this.errorAggregator.add(safetyError);
        return analysis;
      }

      // Check protected directories
      const protectedDirs = this.config.directories?.protectedDirectories || [];
      for (const protectedDir of protectedDirs) {
        if (relativePath.startsWith(protectedDir)) {
          analysis.reason = `File is in protected directory: ${protectedDir}`;
          analysis.classification = 'user-work';
          return analysis;
        }
      }

      // Check protected patterns
      const protectedPatterns = this.config.patterns?.protectedPatterns || [];
      for (const pattern of protectedPatterns) {
        if (this.matchesPattern(relativePath, pattern)) {
          analysis.reason = `Matches protected pattern: ${pattern}`;
          analysis.classification = this.classifyProtectedFile(relativePath);
          return analysis;
        }
      }

      // Check if it's in a safe temporary directory
      const safeTempDirs = this.config.directories?.safeTempDirectories || [];
      const isTempLocation = safeTempDirs.some(tempDir => 
        relativePath.startsWith(tempDir)
      );

      if (!isTempLocation) {
        analysis.reason = 'Not in a designated temporary directory';
        analysis.classification = 'user-work';
        return analysis;
      }

      // Check temporary file patterns
      const tempPatterns = this.config.patterns?.tempFilePatterns || [];
      const isTempFile = tempPatterns.some(pattern =>
        this.matchesPattern(relativePath, pattern)
      );

      if (isTempFile) {
        // Check age for temporary files based on file type
        const stats = fs.statSync(filePath);
        const age = Date.now() - stats.mtime.getTime();
        
        let maxAge = this.config.ageThresholds?.maxTempFileAge || 3600000;
        
        // Use specific age thresholds for different file types
        if (relativePath.includes('/logs/')) {
          maxAge = this.config.ageThresholds?.maxLogFileAge || 86400000;
        } else if (relativePath.includes('/cache/')) {
          maxAge = this.config.ageThresholds?.maxCacheFileAge || 7200000;
        }
        
        if (age > maxAge) {
          analysis.safeToDelete = true;
          analysis.reason = `Temporary file older than ${maxAge}ms (age: ${age}ms)`;
          analysis.classification = 'haruspex-temp';
        } else {
          analysis.reason = `Temporary file too recent (age: ${age}ms, threshold: ${maxAge}ms)`;
          analysis.classification = 'haruspex-temp';
        }
      } else {
        // Check file extension
        const tempExtensions = this.config.patterns?.tempFileExtensions || [];
        const fileExt = path.extname(filePath);
        
        if (tempExtensions.includes(fileExt)) {
          analysis.safeToDelete = true;
          analysis.reason = `File has temporary extension: ${fileExt}`;
          analysis.classification = 'haruspex-temp';
        } else {
          analysis.reason = 'Does not match temporary file patterns or extensions';
          analysis.classification = 'unknown';
        }
      }

    } catch (error) {
      const analysisError = ErrorClassifier.createStructuredError(
        error,
        'FileCleanup',
        { operation: 'file_safety_analysis', filePath }
      );
      this.errorAggregator.add(analysisError);
      
      analysis.reason = `Error analyzing file: ${analysisError.message}`;
      analysis.warnings.push('File analysis failed');
    }

    return analysis;
  }

  /**
   * Cleanup a specific directory
   */
  private async cleanupDirectory(dirPath: string, result: FileCleanupResult): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const items = await readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await stat(itemPath);
        
        if (stats.isDirectory()) {
          // Recursively clean subdirectories
          await this.cleanupDirectory(itemPath, result);
          
          // Try to remove empty directory
          try {
            const remainingItems = await readdir(itemPath);
            if (remainingItems.length === 0) {
              if (!this.config.dryRun) {
                await rmdir(itemPath);
              }
              result.directoriesRemoved++;
              result.details.push({
                path: itemPath,
                action: 'deleted',
                reason: 'Empty directory removed'
              });
            }
          } catch (error) {
            // Directory not empty or other error
          }
        } else {
          // Analyze and potentially delete file
          await this.cleanupFile(itemPath, result);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.failures.push({
        path: dirPath,
        error: `Directory cleanup failed: ${errorMessage}`
      });
    }
  }

  /**
   * Cleanup a specific file with comprehensive error handling
   */
  private async cleanupFile(filePath: string, result: FileCleanupResult): Promise<void> {
    const analysis = this.analyzeFileSafety(filePath);
    
    if (analysis.safeToDelete) {
      try {
        const stats = await stat(filePath);
        
        // Create backup if enabled
        if (this.config.safety?.enableFileBackup) {
          const backupPath = `${filePath}.backup.${Date.now()}`;
          await fs.promises.copyFile(filePath, backupPath);
        }
        
        if (!this.config.dryRun) {
          await unlink(filePath);
        }
        
        result.filesDeleted++;
        result.bytesFreed += stats.size;
        result.details.push({
          path: filePath,
          action: 'deleted',
          reason: analysis.reason,
          size: stats.size
        });
        
        this.debugLog(`Deleted temporary file: ${path.relative(this.workspaceRoot, filePath)}`);
        
      } catch (error) {
        const cleanupError = new FileAccessError(
          `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          filePath,
          'delete'
        );
        this.errorAggregator.add(cleanupError);
        
        result.failures.push({
          path: filePath,
          error: cleanupError.message
        });
        result.details.push({
          path: filePath,
          action: 'failed',
          reason: cleanupError.message
        });
      }
    } else {
      result.filesSkipped++;
      result.details.push({
        path: filePath,
        action: 'skipped',
        reason: analysis.reason
      });
      
      if (analysis.warnings.length > 0) {
        this.debugLog(`Safety warning for ${filePath}: ${analysis.warnings.join(', ')}`, 'warning');
      }
    }
  }

  /**
   * Clean up specific temporary files by pattern
   */
  private async cleanupTemporaryFiles(result: FileCleanupResult): Promise<void> {
    const haruspexDir = path.join(this.workspaceRoot, '.haruspex');
    
    if (!fs.existsSync(haruspexDir)) {
      return;
    }

    // Look for specific temporary files
    const tempFiles = [
      'haruspex-debug-connection.json',
      'processes.json'
    ];

    for (const fileName of tempFiles) {
      const filePath = path.join(haruspexDir, fileName);
      if (fs.existsSync(filePath)) {
        await this.cleanupFile(filePath, result);
      }
    }
  }

  /**
   * Clean up old process tracking files from crashed sessions
   */
  private async cleanupProcessTrackingFiles(result: FileCleanupResult): Promise<void> {
    const haruspexDir = path.join(this.workspaceRoot, '.haruspex');
    
    if (!fs.existsSync(haruspexDir)) {
      return;
    }

    try {
      const files = await readdir(haruspexDir);
      
      for (const file of files) {
        if (file.match(/^processes-\d+\.json$/)) {
          const filePath = path.join(haruspexDir, file);
          const stats = await stat(filePath);
          const age = Date.now() - stats.mtime.getTime();
          
          // Remove old process tracking files (older than 1 hour)
          if (age > 60 * 60 * 1000) {
            await this.cleanupFile(filePath, result);
          }
        }
      }
    } catch (error) {
      this.debugLog(`Failed to cleanup process tracking files: ${error}`, 'warning');
    }
  }

  /**
   * Check if a path matches a glob-like pattern
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple pattern matching for common cases
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')        // ** matches anything
      .replace(/\*/g, '[^/]*')       // * matches anything except /
      .replace(/\?/g, '[^/]')        // ? matches single character except /
      .replace(/\./g, '\\.');        // Escape dots
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Classify a protected file
   */
  private classifyProtectedFile(filePath: string): FileSafetyAnalysis['classification'] {
    if (filePath.includes('.haruspex/config') || filePath.includes('.haruspex/settings')) {
      return 'haruspex-config';
    }
    
    if (filePath.includes('.vscode') || filePath.includes('package.json') || 
        filePath.includes('tsconfig.json')) {
      return 'system';
    }
    
    return 'user-work';
  }

  /**
   * Get cleanup statistics without actually cleaning
   */
  async getCleanupStats(): Promise<{
    tempFiles: number;
    tempBytes: number;
    protectedFiles: number;
    directories: string[];
  }> {
    const stats = {
      tempFiles: 0,
      tempBytes: 0,
      protectedFiles: 0,
      directories: [] as string[]
    };

    const safeTempDirectories = this.config.directories?.safeTempDirectories || [];
    for (const tempDir of safeTempDirectories) {
      const fullPath = path.join(this.workspaceRoot, tempDir);
      if (fs.existsSync(fullPath)) {
        stats.directories.push(tempDir);
        await this.analyzeDirectory(fullPath, stats);
      }
    }

    return stats;
  }

  /**
   * Analyze directory for statistics
   */
  private async analyzeDirectory(dirPath: string, stats: any): Promise<void> {
    try {
      const items = await readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemStats = await stat(itemPath);
        
        if (itemStats.isDirectory()) {
          await this.analyzeDirectory(itemPath, stats);
        } else {
          const analysis = this.analyzeFileSafety(itemPath);
          if (analysis.safeToDelete) {
            stats.tempFiles++;
            stats.tempBytes += itemStats.size;
          } else {
            stats.protectedFiles++;
          }
        }
      }
    } catch (error) {
      // Ignore errors during analysis
    }
  }

  /**
   * Scan a directory for temporary files
   */
  private async scanDirectoryForTempFiles(
    dirPath: string, 
    result: { tempFiles: string[]; totalSize: number; oldestFile?: { path: string; age: number }; newestFile?: { path: string; age: number } }, 
    now: number
  ): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const items = await readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await stat(itemPath);
        
        if (stats.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanDirectoryForTempFiles(itemPath, result, now);
        } else {
          // Check if file is temporary
          const analysis = this.analyzeFileSafety(itemPath);
          if (analysis.classification === 'haruspex-temp' || analysis.safeToDelete) {
            result.tempFiles.push(itemPath);
            result.totalSize += stats.size;
            
            const age = now - stats.mtime.getTime();
            
            // Track oldest file
            if (!result.oldestFile || age > result.oldestFile.age) {
              result.oldestFile = { path: itemPath, age };
            }
            
            // Track newest file
            if (!result.newestFile || age < result.newestFile.age) {
              result.newestFile = { path: itemPath, age };
            }
          }
        }
      }
    } catch (error) {
      this.debugLog(`Error scanning directory ${dirPath}: ${error}`, 'warning');
    }
  }

  /**
   * Scan for specific temporary files
   */
  private async scanSpecificTempFiles(
    result: { tempFiles: string[]; totalSize: number; oldestFile?: { path: string; age: number }; newestFile?: { path: string; age: number } }, 
    now: number
  ): Promise<void> {
    const haruspexDir = path.join(this.workspaceRoot, '.haruspex');
    
    if (!fs.existsSync(haruspexDir)) {
      return;
    }

    // Specific temporary files to check
    const tempFiles = [
      'haruspex-debug-connection.json',
      'processes.json'
    ];

    for (const fileName of tempFiles) {
      const filePath = path.join(haruspexDir, fileName);
      if (fs.existsSync(filePath)) {
        try {
          const stats = await stat(filePath);
          const analysis = this.analyzeFileSafety(filePath);
          
          if (analysis.safeToDelete) {
            result.tempFiles.push(filePath);
            result.totalSize += stats.size;
            
            const age = now - stats.mtime.getTime();
            
            // Track oldest file
            if (!result.oldestFile || age > result.oldestFile.age) {
              result.oldestFile = { path: filePath, age };
            }
            
            // Track newest file
            if (!result.newestFile || age < result.newestFile.age) {
              result.newestFile = { path: filePath, age };
            }
          }
        } catch (error) {
          this.debugLog(`Error checking temp file ${filePath}: ${error}`, 'warning');
        }
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): FileCleanupConfig {
    return { ...this.config };
  }

  /**
   * Get configuration validation result
   */
  getConfigurationValidation(): ValidationResult<FileCleanupConfig> {
    return this.configValidation;
  }

  /**
   * Get aggregated errors
   */
  getErrors(): import('./shared-errors').StructuredError[] {
    return this.errorAggregator.getErrors().map(error => error.toStructured());
  }

  /**
   * Get error summary
   */
  getErrorSummary(): ReturnType<ErrorAggregator['getSummary']> {
    return this.errorAggregator.getSummary();
  }

  /**
   * Clear all accumulated errors
   */
  clearErrors(): void {
    this.errorAggregator.clear();
  }

  /**
   * Get current status
   */
  getStatus(): {
    initialized: boolean;
    canCleanup: boolean;
    configuration: {
      valid: boolean;
    };
  } {
    return {
      initialized: false,
      canCleanup: true,
      configuration: {
        valid: this.configValidation.success
      }
    };
  }

  /**
   * Generate comprehensive status report
   */
  generateStatusReport(): {
    configuration: { valid: boolean };
    patterns: { includePaths: string[] };
    safety: { userWorkProtection: boolean };
    errors: { total: number };
  } {
    return {
      configuration: {
        valid: this.configValidation.success
      },
      patterns: {
        includePaths: this.config.patterns?.includePaths || []
      },
      safety: {
        userWorkProtection: this.config.patterns?.preserveUserWork || false
      },
      errors: {
        total: this.errorAggregator.getErrors().length
      }
    };
  }

  /**
   * Create cleanup configuration for testing
   */
  static createTestConfig(overrides: Partial<FileCleanupConfig> = {}): FileCleanupConfig {
    return {
      enableDetailedLogging: false,
      enableSafetyChecks: true,
      dryRun: true, // Safe default for testing
      gracefulTimeout: 5000,
      ageThresholds: {
        minFileAge: 0, // Delete immediately in test
        maxTempAge: 0, 
        maxTempFileAge: 0, // Delete all temp files immediately in test
        maxLogFileAge: 0,
        maxCacheFileAge: 0,
        enableAgeCheck: true
      },
      directories: {
        tempDirectories: ['/tmp', '/temp'],
        safeTempDirectories: ['.haruspex/temp', '.haruspex/test'],
        protectedDirectories: ['.git', '.vscode', 'src'],
        enableDirectoryCleanup: true
      },
      patterns: {
        includePaths: ['**/*.tmp', '**/*.temp'],
        excludePaths: ['**/node_modules/**', '**/.git/**'],
        preserveUserWork: true,
        userWorkPatterns: ['**/*.md', '**/*.txt', '**/*.json'],
        protectedPatterns: ['**/*.ts', '**/*.js', '**/*.json'],
        tempFileExtensions: ['.tmp', '.test'],
        tempFilePatterns: ['.haruspex/temp/**/*', '.haruspex/test/**/*']
      },
      ...overrides
    };
  }
}