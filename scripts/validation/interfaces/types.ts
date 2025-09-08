/**
 * Common types used throughout the validation system
 * Version: 3.0.0
 * Created: 2025-09-06 for TASK-VAL-004
 */

export interface ProjectInfo {
  path: string;
  name: string;
  version: string;
  type: 'typescript' | 'javascript' | 'mixed';
  hasTests: boolean;
  dependencies: string[];
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  nodeVersion?: string;
  framework?: string;
  buildTool?: string;
}

export interface ScopeConfig {
  patterns: string[];
  excludePatterns?: string[];
  includeTests: boolean;
  recursiveSearch: boolean;
  maxDepth?: number;
  followSymlinks?: boolean;
}

export interface ValidationOptions {
  verbose?: boolean;
  includeWarnings?: boolean;
  saveResults?: boolean;
  timeout?: number;
  taskId?: string;
  dryRun?: boolean;
  parallel?: boolean;
  maxParallelTasks?: number;
  continueOnError?: boolean;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  npmVersion?: string;
  validationSystemVersion: string;
  workingDirectory: string;
  timestamp: string;
}

export interface FileInfo {
  path: string;
  size: number;
  lastModified: string;
  type: string;
  exists: boolean;
  readable: boolean;
  writable: boolean;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  resolved?: string;
  integrity?: string;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: any; // NodeJS.MemoryUsage type for Node.js environments
  cpuUsage?: any; // NodeJS.CpuUsage type for Node.js environments  
}

export interface ErrorInfo {
  code: string;
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface WarningInfo {
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type ValidationStatus = 'PASS' | 'FAIL' | 'WARN' | 'SKIP' | 'ERROR';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'blocked';