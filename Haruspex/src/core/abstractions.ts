/**---
 * title: [Core Engine Abstractions - Dependency Injection Interfaces]
 * tags: [Abstraction, Dependency-Injection, VSCode-Agnostic, Backend-Compatible]
 * provides: [ITelemetryCollector, IFileMonitor, Abstraction-Interfaces]
 * requires: [Node.js-Runtime]
 * description: [Abstract interfaces for Core Engine dependencies to enable both VSCode and backend implementations]
 * ---*/

import { EventEmitter } from 'events';

// ================================
// Telemetry Abstraction
// ================================

export interface ITelemetryConfig {
  /** Whether privacy-compliant telemetry is enabled */
  privacyCompliant: boolean;
  /** Whether to collect performance metrics */
  performanceMetrics: boolean;
  /** Whether to report errors (without sensitive data) */
  errorReporting: boolean;
  /** Maximum number of events to keep in memory */
  maxEventHistory?: number;
}

export interface ITelemetryEvent {
  /** Event name/type */
  name: string;
  /** Event timestamp */
  timestamp: number;
  /** Sanitized event data (no PII) */
  data: Record<string, unknown>;
  /** Event source component */
  source?: string;
  /** Event severity level */
  level?: 'info' | 'warning' | 'error';
}

export interface ITelemetryMetrics {
  /** Total events recorded */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<string, number>;
  /** Events by source */
  eventsBySource: Record<string, number>;
  /** Recent events */
  recentEvents: ITelemetryEvent[];
  /** Collection start time */
  startTime: number;
  /** Collection duration */
  duration: number;
}

export interface ITelemetryCollector {
  /**
   * Record a telemetry event
   */
  recordEvent(name: string, data: Record<string, unknown>, source?: string, level?: 'info' | 'warning' | 'error'): void;

  /**
   * Record performance metric
   */
  recordPerformanceMetric(operation: string, durationMs: number, metadata?: Record<string, unknown>): void;

  /**
   * Record error (without sensitive data)
   */
  recordError(error: Error | string, context?: Record<string, unknown>): void;

  /**
   * Get current telemetry metrics
   */
  getMetrics(): ITelemetryMetrics;

  /**
   * Enable/disable telemetry collection
   */
  setEnabled(enabled: boolean): void;

  /**
   * Clear all collected events
   */
  clearEvents(): void;

  /**
   * Get recent events
   */
  getRecentEvents(count?: number): ITelemetryEvent[];

  /**
   * Dispose of resources
   */
  dispose(): void;
}

// ================================
// File Monitor Abstraction
// ================================

export interface IFileChangeEvent {
  /** Type of change */
  type: 'created' | 'changed' | 'deleted';
  /** File path that changed */
  filePath: string;
  /** Timestamp of change */
  timestamp: number;
  /** File extension */
  extension: string;
  /** Whether this is a monitored file type */
  isMonitored: boolean;
}

export interface IFileMonitorConfig {
  /** File patterns to monitor */
  patterns: string[];
  /** Whether to monitor recursively */
  recursive: boolean;
  /** Debounce delay in milliseconds */
  debounceMs: number;
  /** Maximum number of changes to queue */
  maxQueueSize: number;
  /** File types to exclude from monitoring */
  excludePatterns?: string[];
  /** Root path to monitor */
  rootPath?: string;
}

export interface IFileMonitorMetrics {
  /** Total number of file changes detected */
  totalChanges: number;
  /** Changes by type */
  changesByType: Record<IFileChangeEvent['type'], number>;
  /** Changes by file extension */
  changesByExtension: Record<string, number>;
  /** Recent changes */
  recentChanges: IFileChangeEvent[];
  /** Monitor start time */
  monitorStartTime: number;
  /** Whether monitoring is active */
  isMonitoring: boolean;
}

export interface IFileMonitor extends EventEmitter {
  /**
   * Start file monitoring
   */
  startMonitoring(): Promise<void>;

  /**
   * Stop file monitoring
   */
  stopMonitoring(): Promise<void>;

  /**
   * Get monitoring metrics
   */
  getMetrics(): IFileMonitorMetrics;

  /**
   * Get recent file changes
   */
  getRecentChanges(count?: number): IFileChangeEvent[];

  /**
   * Check if a file path should be monitored
   */
  isFileMonitored(filePath: string): boolean;

  /**
   * Clear change history
   */
  clearHistory(): void;

  /**
   * Dispose of resources
   */
  dispose(): void;
}

// ================================
// Runtime Context
// ================================

export type RuntimeContext = 'vscode' | 'backend' | 'test';

export interface IRuntimeConfig {
  context: RuntimeContext;
  workspaceRoot: string;
  telemetry: ITelemetryConfig;
  fileMonitor: IFileMonitorConfig;
}

// ================================
// Dependency Factory
// ================================

export interface ICoreEngineDependencies {
  telemetry: ITelemetryCollector;
  fileMonitor: IFileMonitor;
  context: RuntimeContext;
}

export type DependencyFactory = (config: IRuntimeConfig) => Promise<ICoreEngineDependencies>;

// ================================
// Error Types
// ================================

export class DependencyInjectionError extends Error {
  constructor(message: string, public readonly context: string) {
    super(message);
    this.name = 'DependencyInjectionError';
  }
}