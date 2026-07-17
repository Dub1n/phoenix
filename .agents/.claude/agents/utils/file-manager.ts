/**
 * File Management Utilities
 * 
 * Core file operations for handoff communication with comprehensive error handling.
 * Integrates validation, error handling, and file naming utilities.
 * 
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md lines 225-232, 580-592
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { HandoffInput, HandoffOutput, HandoffConfig, HandoffError, HandoffErrorType, HandoffFileNaming } from '../interfaces/handoff-types.js';
import { 
  generateHandoffFilename, 
  generateInputFilename, 
  generateOutputFilename,
  generateTimestamp,
  parseHandoffFilename 
} from './file-naming.js';
import { 
  validateHandoffInput, 
  validateHandoffOutput, 
  sanitizeHandoffInput,
  createValidationError 
} from './validation.js';
import { 
  executeWithRetry, 
  executeWithTimeout, 
  createHandoffError, 
  normalizeError,
  OperationResult,
  DEFAULT_RETRY_CONFIG 
} from './error-handling.js';

/**
 * Default handoff configuration
 */
export const DEFAULT_HANDOFF_CONFIG: HandoffConfig = {
  base_path: '.claude/handoff',
  input_retention_days: 7,
  output_retention_days: 30,
  cleanup_strategy: 'automated',
  file_naming_pattern: '{phase}-{context|results}-{task-id}-{timestamp}.json'
};

/**
 * File operation options
 */
export interface FileOperationOptions {
  timeout?: number;
  retries?: number;
  createDirs?: boolean;
  validate?: boolean;
}

/**
 * Main file manager class for handoff operations
 */
export class HandoffFileManager {
  private config: HandoffConfig;
  
  constructor(config: Partial<HandoffConfig> = {}) {
    this.config = { ...DEFAULT_HANDOFF_CONFIG, ...config };
  }
  
  /**
   * Write handoff input to file
   * 
   * @param input - HandoffInput data
   * @param options - File operation options
   * @returns Promise with operation result
   */
  async writeInput(
    input: HandoffInput,
    options: FileOperationOptions = {}
  ): Promise<OperationResult<string>> {
    const opts = { 
      timeout: 5000, 
      retries: 3, 
      createDirs: true, 
      validate: true, 
      ...options 
    };
    
    return executeWithRetry(async () => {
      return executeWithTimeout(async () => {
        // Sanitize and validate input
        const sanitizedInput = sanitizeHandoffInput(input);
        
        if (opts.validate) {
          const validation = validateHandoffInput(sanitizedInput);
          if (!validation.success) {
            throw createValidationError(validation.errors);
          }
        }
        
        // Generate filename
        const filename = generateInputFilename(
          input.workflow_phase,
          input.task_id,
          generateTimestamp()
        );
        
        const filePath = path.join(this.config.base_path, 'input', filename);
        
        // Create directories if needed
        if (opts.createDirs) {
          await this.ensureDirectoryExists(path.dirname(filePath));
        }
        
        // Write file
        const content = JSON.stringify(sanitizedInput, null, 2);
        await fs.writeFile(filePath, content, 'utf8');
        
        return filePath;
      }, { timeoutMs: opts.timeout });
    }, { 
      maxRetries: opts.retries,
      retryableErrors: [HandoffErrorType.FILE_ACCESS_ERROR, HandoffErrorType.TIMEOUT_ERROR]
    });
  }
  
  /**
   * Read handoff input from file
   * 
   * @param filePath - Path to input file
   * @param options - File operation options
   * @returns Promise with operation result
   */
  async readInput(
    filePath: string,
    options: FileOperationOptions = {}
  ): Promise<OperationResult<HandoffInput>> {
    const opts = { timeout: 5000, retries: 3, validate: true, ...options };
    
    return executeWithRetry(async () => {
      return executeWithTimeout(async () => {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        if (opts.validate) {
          const validation = validateHandoffInput(data);
          if (!validation.success) {
            throw createValidationError(validation.errors, filePath);
          }
          return validation.data!;
        }
        
        return data as HandoffInput;
      }, { timeoutMs: opts.timeout });
    }, { 
      maxRetries: opts.retries,
      retryableErrors: [HandoffErrorType.FILE_ACCESS_ERROR, HandoffErrorType.TIMEOUT_ERROR]
    });
  }
  
  /**
   * Write handoff output to file
   * 
   * @param output - HandoffOutput data
   * @param options - File operation options
   * @returns Promise with operation result
   */
  async writeOutput(
    output: HandoffOutput,
    options: FileOperationOptions = {}
  ): Promise<OperationResult<string>> {
    const opts = { 
      timeout: 5000, 
      retries: 3, 
      createDirs: true, 
      validate: true, 
      ...options 
    };
    
    return executeWithRetry(async () => {
      return executeWithTimeout(async () => {
        // Validate output
        if (opts.validate) {
          const validation = validateHandoffOutput(output);
          if (!validation.success) {
            throw createValidationError(validation.errors);
          }
        }
        
        // Determine phase from existing input file or use 'execution' as default
        const phaseString = await this.determinePhaseFromTaskId(output.task_id) || 'execution';
        const phase = phaseString as HandoffFileNaming['phase'];
        
        // Generate filename
        const filename = generateOutputFilename(
          phase,
          output.task_id,
          generateTimestamp()
        );
        
        const filePath = path.join(this.config.base_path, 'output', filename);
        
        // Create directories if needed
        if (opts.createDirs) {
          await this.ensureDirectoryExists(path.dirname(filePath));
        }
        
        // Write file
        const content = JSON.stringify(output, null, 2);
        await fs.writeFile(filePath, content, 'utf8');
        
        return filePath;
      }, { timeoutMs: opts.timeout });
    }, { 
      maxRetries: opts.retries,
      retryableErrors: [HandoffErrorType.FILE_ACCESS_ERROR, HandoffErrorType.TIMEOUT_ERROR]
    });
  }
  
  /**
   * Read handoff output from file
   * 
   * @param filePath - Path to output file
   * @param options - File operation options
   * @returns Promise with operation result
   */
  async readOutput(
    filePath: string,
    options: FileOperationOptions = {}
  ): Promise<OperationResult<HandoffOutput>> {
    const opts = { timeout: 5000, retries: 3, validate: true, ...options };
    
    return executeWithRetry(async () => {
      return executeWithTimeout(async () => {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        if (opts.validate) {
          const validation = validateHandoffOutput(data);
          if (!validation.success) {
            throw createValidationError(validation.errors, filePath);
          }
          return validation.data!;
        }
        
        return data as HandoffOutput;
      }, { timeoutMs: opts.timeout });
    }, { 
      maxRetries: opts.retries,
      retryableErrors: [HandoffErrorType.FILE_ACCESS_ERROR, HandoffErrorType.TIMEOUT_ERROR]
    });
  }
  
  /**
   * List all input files for a specific task ID
   * 
   * @param taskId - Task identifier
   * @returns Promise with list of input file paths
   */
  async listInputFiles(taskId?: string): Promise<string[]> {
    const inputDir = path.join(this.config.base_path, 'input');
    
    try {
      const files = await fs.readdir(inputDir);
      const handoffFiles = files.filter(file => {
        const parsed = parseHandoffFilename(file);
        return parsed && 
               parsed.type === 'context' && 
               (!taskId || parsed.task_id === taskId);
      });
      
      return handoffFiles.map(file => path.join(inputDir, file));
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw normalizeError(error);
    }
  }
  
  /**
   * List all output files for a specific task ID
   * 
   * @param taskId - Task identifier
   * @returns Promise with list of output file paths
   */
  async listOutputFiles(taskId?: string): Promise<string[]> {
    const outputDir = path.join(this.config.base_path, 'output');
    
    try {
      const files = await fs.readdir(outputDir);
      const handoffFiles = files.filter(file => {
        const parsed = parseHandoffFilename(file);
        return parsed && 
               parsed.type === 'results' && 
               (!taskId || parsed.task_id === taskId);
      });
      
      return handoffFiles.map(file => path.join(outputDir, file));
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw normalizeError(error);
    }
  }
  
  /**
   * Archive completed handoff files
   * 
   * @param taskId - Task identifier
   * @returns Promise with operation result
   */
  async archiveTask(taskId: string): Promise<OperationResult<string[]>> {
    return executeWithRetry(async () => {
      const inputFiles = await this.listInputFiles(taskId);
      const outputFiles = await this.listOutputFiles(taskId);
      const allFiles = [...inputFiles, ...outputFiles];
      
      if (allFiles.length === 0) {
        return [];
      }
      
      const archiveDir = path.join(this.config.base_path, 'archive');
      await this.ensureDirectoryExists(archiveDir);
      
      const archivedFiles: string[] = [];
      
      for (const file of allFiles) {
        const filename = path.basename(file);
        const archivePath = path.join(archiveDir, filename);
        
        // Copy to archive
        await fs.copyFile(file, archivePath);
        
        // Remove original
        await fs.unlink(file);
        
        archivedFiles.push(archivePath);
      }
      
      return archivedFiles;
    }, DEFAULT_RETRY_CONFIG);
  }
  
  /**
   * Get handoff configuration
   */
  getConfig(): HandoffConfig {
    return { ...this.config };
  }
  
  /**
   * Update handoff configuration
   * 
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<HandoffConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Ensure directory exists, creating it if necessary
   * 
   * @param dirPath - Directory path
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
      } else {
        throw normalizeError(error);
      }
    }
  }
  
  /**
   * Determine workflow phase from existing input files for a task
   * 
   * @param taskId - Task identifier
   * @returns Phase or null if not found
   */
  private async determinePhaseFromTaskId(taskId: string): Promise<string | null> {
    try {
      const inputFiles = await this.listInputFiles(taskId);
      
      if (inputFiles.length > 0) {
        const filename = path.basename(inputFiles[inputFiles.length - 1]); // Get latest
        const parsed = parseHandoffFilename(filename);
        return parsed?.phase || null;
      }
      
      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Create a new HandoffFileManager instance
 * 
 * @param config - Optional configuration
 * @returns HandoffFileManager instance
 */
export function createFileManager(config?: Partial<HandoffConfig>): HandoffFileManager {
  return new HandoffFileManager(config);
}

/**
 * Quick write input utility
 * 
 * @param input - HandoffInput data
 * @param config - Optional configuration
 * @returns Promise with file path
 */
export async function writeHandoffInput(
  input: HandoffInput,
  config?: Partial<HandoffConfig>
): Promise<string> {
  const manager = createFileManager(config);
  const result = await manager.writeInput(input);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data!;
}

/**
 * Quick read input utility
 * 
 * @param filePath - Path to input file
 * @param config - Optional configuration
 * @returns Promise with HandoffInput data
 */
export async function readHandoffInput(
  filePath: string,
  config?: Partial<HandoffConfig>
): Promise<HandoffInput> {
  const manager = createFileManager(config);
  const result = await manager.readInput(filePath);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data!;
}

/**
 * Quick write output utility
 * 
 * @param output - HandoffOutput data
 * @param config - Optional configuration
 * @returns Promise with file path
 */
export async function writeHandoffOutput(
  output: HandoffOutput,
  config?: Partial<HandoffConfig>
): Promise<string> {
  const manager = createFileManager(config);
  const result = await manager.writeOutput(output);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data!;
}

/**
 * Quick read output utility
 * 
 * @param filePath - Path to output file
 * @param config - Optional configuration
 * @returns Promise with HandoffOutput data
 */
export async function readHandoffOutput(
  filePath: string,
  config?: Partial<HandoffConfig>
): Promise<HandoffOutput> {
  const manager = createFileManager(config);
  const result = await manager.readOutput(filePath);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data!;
}