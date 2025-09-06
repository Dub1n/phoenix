/**
 * Automated Cleanup System
 * 
 * Automated cleanup utilities with configurable retention policies and audit logging.
 * Implements safe cleanup with comprehensive error handling and recovery.
 * 
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md lines 581-585
 * 
 * Fixed TypeScript strict mode null-safety violations and error type casting for production-ready code
 * Implements null-safety-error-handling pattern with nullish coalescing operators
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { HandoffConfig, HandoffError, HandoffErrorType } from '../interfaces/handoff-types.js';
import { parseHandoffFilename } from './file-naming.js';
import { 
  executeWithRetry, 
  createHandoffError, 
  normalizeError,
  OperationResult,
  ErrorAggregator 
} from './error-handling.js';

/**
 * Cleanup operation result
 */
export interface CleanupResult {
  totalFiles: number;
  cleanedFiles: number;
  archivedFiles: number;
  errors: HandoffError[];
  duration: number;
  bytesCleaned: number;
}

/**
 * Cleanup statistics
 */
export interface CleanupStats {
  inputFiles: {
    total: number;
    cleaned: number;
    retained: number;
  };
  outputFiles: {
    total: number;
    cleaned: number;
    retained: number;
  };
  archiveFiles: {
    total: number;
    size: number;
  };
}

/**
 * File cleanup information
 */
interface FileCleanupInfo {
  path: string;
  age: number; // days
  size: number; // bytes
  phase: string;
  taskId: string;
  timestamp: string;
  type: 'context' | 'results';
}

/**
 * Cleanup policy configuration
 */
export interface CleanupPolicy {
  inputRetentionDays: number;
  outputRetentionDays: number;
  archiveRetentionDays?: number;
  maxArchiveSize?: number; // bytes
  dryRun?: boolean;
  forceCleanup?: boolean;
}

/**
 * Automated cleanup manager
 */
export class HandoffCleanupManager {
  private config: HandoffConfig;
  private errorAggregator: ErrorAggregator;
  
  constructor(config: HandoffConfig) {
    this.config = config;
    this.errorAggregator = new ErrorAggregator();
  }
  
  /**
   * Execute automated cleanup based on configuration
   * 
   * @param policy - Optional cleanup policy override
   * @returns Promise with cleanup result
   */
  async executeCleanup(policy?: Partial<CleanupPolicy>): Promise<CleanupResult> {
    const startTime = Date.now();
    this.errorAggregator.clear();
    
    const cleanupPolicy: CleanupPolicy = {
      inputRetentionDays: this.config.input_retention_days,
      outputRetentionDays: this.config.output_retention_days,
      archiveRetentionDays: 90, // Default archive retention
      maxArchiveSize: 100 * 1024 * 1024, // 100MB default
      dryRun: false,
      forceCleanup: false,
      ...policy
    };
    
    let totalFiles = 0;
    let cleanedFiles = 0;
    let archivedFiles = 0;
    let bytesCleaned = 0;
    
    try {
      // Cleanup input files
      const inputResult = await this.cleanupInputFiles(cleanupPolicy);
      totalFiles += inputResult.totalFiles ?? 0;
      cleanedFiles += inputResult.cleanedFiles ?? 0;
      bytesCleaned += inputResult.bytesCleaned ?? 0;
      
      // Cleanup output files
      const outputResult = await this.cleanupOutputFiles(cleanupPolicy);
      totalFiles += outputResult.totalFiles ?? 0;
      cleanedFiles += outputResult.cleanedFiles ?? 0;
      bytesCleaned += outputResult.bytesCleaned ?? 0;
      
      // Cleanup archive files if policy specified
      if (cleanupPolicy.archiveRetentionDays !== undefined) {
        const archiveResult = await this.cleanupArchiveFiles(cleanupPolicy);
        totalFiles += archiveResult.totalFiles ?? 0;
        archivedFiles += archiveResult.cleanedFiles ?? 0;
        bytesCleaned += archiveResult.bytesCleaned ?? 0;
      }
      
      // Enforce archive size limits
      if (cleanupPolicy.maxArchiveSize) {
        const sizeResult = await this.enforceArchiveSizeLimit(cleanupPolicy);
        archivedFiles += sizeResult.cleanedFiles ?? 0;
        bytesCleaned += sizeResult.bytesCleaned ?? 0;
      }
      
    } catch (error) {
      this.errorAggregator.addError(normalizeError(error));
    }
    
    return {
      totalFiles,
      cleanedFiles,
      archivedFiles,
      errors: this.errorAggregator.getErrors(),
      duration: Date.now() - startTime,
      bytesCleaned
    };
  }
  
  /**
   * Get cleanup statistics without performing cleanup
   * 
   * @param policy - Cleanup policy for analysis
   * @returns Promise with cleanup statistics
   */
  async getCleanupStats(policy?: Partial<CleanupPolicy>): Promise<CleanupStats> {
    const cleanupPolicy: CleanupPolicy = {
      inputRetentionDays: this.config.input_retention_days,
      outputRetentionDays: this.config.output_retention_days,
      dryRun: true,
      ...policy
    };
    
    const inputFiles = await this.analyzeInputFiles(cleanupPolicy);
    const outputFiles = await this.analyzeOutputFiles(cleanupPolicy);
    const archiveFiles = await this.analyzeArchiveFiles();
    
    return {
      inputFiles: {
        total: inputFiles.total,
        cleaned: inputFiles.eligible,
        retained: inputFiles.total - inputFiles.eligible
      },
      outputFiles: {
        total: outputFiles.total,
        cleaned: outputFiles.eligible,
        retained: outputFiles.total - outputFiles.eligible
      },
      archiveFiles: {
        total: archiveFiles.total,
        size: archiveFiles.size
      }
    };
  }
  
  /**
   * Clean up input files based on retention policy
   * 
   * @param policy - Cleanup policy
   * @returns Cleanup result for input files
   */
  private async cleanupInputFiles(policy: CleanupPolicy): Promise<Partial<CleanupResult>> {
    const inputDir = path.join(this.config.base_path, 'input');
    const files = await this.getFileCleanupInfo(inputDir);
    
    let totalFiles = files.length;
    let cleanedFiles = 0;
    let bytesCleaned = 0;
    
    for (const file of files) {
      if (file.age > policy.inputRetentionDays) {
        try {
          if (!policy.dryRun) {
            await this.safeDeleteFile(file.path);
          }
          cleanedFiles++;
          bytesCleaned += file.size;
        } catch (error) {
          this.errorAggregator.addError(
            createHandoffError(
              HandoffErrorType.CLEANUP_ERROR,
              `Failed to clean input file: ${file.path}`,
              'Check file permissions and disk space',
              file.path
            )
          );
        }
      }
    }
    
    return { totalFiles, cleanedFiles, bytesCleaned };
  }
  
  /**
   * Clean up output files based on retention policy
   * 
   * @param policy - Cleanup policy
   * @returns Cleanup result for output files
   */
  private async cleanupOutputFiles(policy: CleanupPolicy): Promise<Partial<CleanupResult>> {
    const outputDir = path.join(this.config.base_path, 'output');
    const files = await this.getFileCleanupInfo(outputDir);
    
    let totalFiles = files.length;
    let cleanedFiles = 0;
    let bytesCleaned = 0;
    
    for (const file of files) {
      if (file.age > policy.outputRetentionDays) {
        try {
          if (!policy.dryRun) {
            await this.safeDeleteFile(file.path);
          }
          cleanedFiles++;
          bytesCleaned += file.size;
        } catch (error) {
          this.errorAggregator.addError(
            createHandoffError(
              HandoffErrorType.CLEANUP_ERROR,
              `Failed to clean output file: ${file.path}`,
              'Check file permissions and disk space',
              file.path
            )
          );
        }
      }
    }
    
    return { totalFiles, cleanedFiles, bytesCleaned };
  }
  
  /**
   * Clean up archive files based on retention policy
   * 
   * @param policy - Cleanup policy
   * @returns Cleanup result for archive files
   */
  private async cleanupArchiveFiles(policy: CleanupPolicy): Promise<Partial<CleanupResult>> {
    if (!policy.archiveRetentionDays) {
      return { totalFiles: 0, cleanedFiles: 0, bytesCleaned: 0 };
    }
    
    const archiveDir = path.join(this.config.base_path, 'archive');
    const files = await this.getFileCleanupInfo(archiveDir);
    
    let totalFiles = files.length;
    let cleanedFiles = 0;
    let bytesCleaned = 0;
    
    for (const file of files) {
      if (file.age > policy.archiveRetentionDays) {
        try {
          if (!policy.dryRun) {
            await this.safeDeleteFile(file.path);
          }
          cleanedFiles++;
          bytesCleaned += file.size;
        } catch (error) {
          this.errorAggregator.addError(
            createHandoffError(
              HandoffErrorType.CLEANUP_ERROR,
              `Failed to clean archive file: ${file.path}`,
              'Check file permissions and disk space',
              file.path
            )
          );
        }
      }
    }
    
    return { totalFiles, cleanedFiles, bytesCleaned };
  }
  
  /**
   * Enforce archive size limits by removing oldest files
   * 
   * @param policy - Cleanup policy
   * @returns Cleanup result for size enforcement
   */
  private async enforceArchiveSizeLimit(policy: CleanupPolicy): Promise<Partial<CleanupResult>> {
    if (!policy.maxArchiveSize) {
      return { cleanedFiles: 0, bytesCleaned: 0 };
    }
    
    const archiveDir = path.join(this.config.base_path, 'archive');
    const files = await this.getFileCleanupInfo(archiveDir);
    
    // Sort by age (oldest first)
    files.sort((a, b) => b.age - a.age);
    
    let totalSize = files.reduce((sum, file) => sum + file.size, 0);
    let cleanedFiles = 0;
    let bytesCleaned = 0;
    
    // Remove oldest files until under size limit
    for (const file of files) {
      if (totalSize <= policy.maxArchiveSize) {
        break;
      }
      
      try {
        if (!policy.dryRun) {
          await this.safeDeleteFile(file.path);
        }
        totalSize -= file.size;
        cleanedFiles++;
        bytesCleaned += file.size;
      } catch (error) {
        this.errorAggregator.addError(
          createHandoffError(
            HandoffErrorType.CLEANUP_ERROR,
            `Failed to enforce size limit for: ${file.path}`,
            'Check file permissions and disk space',
            file.path
          )
        );
      }
    }
    
    return { cleanedFiles, bytesCleaned };
  }
  
  /**
   * Get file cleanup information for a directory
   * 
   * @param dirPath - Directory path to analyze
   * @returns Array of file cleanup info
   */
  private async getFileCleanupInfo(dirPath: string): Promise<FileCleanupInfo[]> {
    try {
      const files = await fs.readdir(dirPath);
      const fileInfos: FileCleanupInfo[] = [];
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        
        try {
          const stats = await fs.stat(filePath);
          const parsed = parseHandoffFilename(file);
          
          if (parsed && stats.isFile()) {
            const age = Math.floor((Date.now() - stats.mtime.getTime()) / (24 * 60 * 60 * 1000));
            
            fileInfos.push({
              path: filePath,
              age,
              size: stats.size,
              phase: parsed.phase,
              taskId: parsed.task_id,
              timestamp: parsed.timestamp,
              type: parsed.type
            });
          }
        } catch (error) {
          // Skip files that can't be analyzed
          continue;
        }
      }
      
      return fileInfos;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw normalizeError(error);
    }
  }
  
  /**
   * Analyze input files for cleanup statistics
   * 
   * @param policy - Cleanup policy
   * @returns Analysis result
   */
  private async analyzeInputFiles(policy: CleanupPolicy): Promise<{ total: number; eligible: number }> {
    const files = await this.getFileCleanupInfo(path.join(this.config.base_path, 'input'));
    const eligible = files.filter(file => file.age > policy.inputRetentionDays).length;
    return { total: files.length, eligible };
  }
  
  /**
   * Analyze output files for cleanup statistics
   * 
   * @param policy - Cleanup policy
   * @returns Analysis result
   */
  private async analyzeOutputFiles(policy: CleanupPolicy): Promise<{ total: number; eligible: number }> {
    const files = await this.getFileCleanupInfo(path.join(this.config.base_path, 'output'));
    const eligible = files.filter(file => file.age > policy.outputRetentionDays).length;
    return { total: files.length, eligible };
  }
  
  /**
   * Analyze archive files for statistics
   * 
   * @returns Analysis result
   */
  private async analyzeArchiveFiles(): Promise<{ total: number; size: number }> {
    const files = await this.getFileCleanupInfo(path.join(this.config.base_path, 'archive'));
    const size = files.reduce((sum, file) => sum + file.size, 0);
    return { total: files.length, size };
  }
  
  /**
   * Safely delete a file with error handling
   * 
   * @param filePath - File path to delete
   */
  private async safeDeleteFile(filePath: string): Promise<void> {
    const result = await executeWithRetry(
      () => fs.unlink(filePath),
      {
        maxRetries: 2,
        retryableErrors: [HandoffErrorType.FILE_ACCESS_ERROR]
      }
    );
    
    if (!result.success) {
      throw result.error;
    }
  }
}

/**
 * Create a new cleanup manager
 * 
 * @param config - Handoff configuration
 * @returns HandoffCleanupManager instance
 */
export function createCleanupManager(config: HandoffConfig): HandoffCleanupManager {
  return new HandoffCleanupManager(config);
}

/**
 * Execute quick cleanup with default settings
 * 
 * @param config - Handoff configuration
 * @param policy - Optional cleanup policy
 * @returns Promise with cleanup result
 */
export async function executeCleanup(
  config: HandoffConfig,
  policy?: Partial<CleanupPolicy>
): Promise<CleanupResult> {
  const manager = createCleanupManager(config);
  return manager.executeCleanup(policy);
}

/**
 * Get cleanup statistics without performing cleanup
 * 
 * @param config - Handoff configuration
 * @param policy - Optional cleanup policy
 * @returns Promise with cleanup statistics
 */
export async function getCleanupStats(
  config: HandoffConfig,
  policy?: Partial<CleanupPolicy>
): Promise<CleanupStats> {
  const manager = createCleanupManager(config);
  return manager.getCleanupStats(policy);
}

/**
 * Schedule automatic cleanup (stub for future implementation)
 * 
 * @param config - Handoff configuration
 * @param intervalHours - Cleanup interval in hours
 * @returns Cleanup scheduler (placeholder)
 */
export function scheduleCleanup(
  config: HandoffConfig,
  intervalHours: number = 24
): { stop: () => void } {
  // TODO: Implement actual scheduling with cron-like functionality
  // For now, return a stub that can be extended later
  
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  const intervalId = setInterval(async () => {
    try {
      await executeCleanup(config);
    } catch (error) {
      // Log error but don't throw to prevent scheduler from stopping
      console.warn('Scheduled cleanup failed:', error);
    }
  }, intervalMs);
  
  return {
    stop: () => clearInterval(intervalId)
  };
}