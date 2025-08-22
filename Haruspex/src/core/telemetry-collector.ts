/**
 * Telemetry Collector Implementation for Haruspex Core Engine
 * 
 * Provides privacy-compliant telemetry collection with zero PII emission
 * for performance monitoring and operational visibility.
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

import * as vscode from 'vscode';

export interface TelemetryConfig {
  /** Whether privacy-compliant telemetry is enabled */
  privacyCompliant: boolean;
  /** Whether to collect performance metrics */
  performanceMetrics: boolean;
  /** Whether to report errors (without sensitive data) */
  errorReporting: boolean;
  /** Maximum number of events to keep in memory */
  maxEventHistory?: number;
  /** Whether to emit events to VSCode output channel */
  outputChannel?: boolean;
  /** Whether to show events in status bar */
  statusBarNotifications?: boolean;
}

export interface TelemetryEvent {
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

export interface TelemetryMetrics {
  /** Total events recorded */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<string, number>;
  /** Events by source */
  eventsBySource: Record<string, number>;
  /** Recent events */
  recentEvents: TelemetryEvent[];
  /** Collection start time */
  collectionStartTime: number;
}

/**
 * PII sanitization patterns - these patterns identify potentially sensitive data
 */
const PII_PATTERNS = [
  'filePath',
  'fileName', 
  'path',
  'userName',
  'user',
  'email',
  'projectName',
  'projectPath',
  'workspacePath',
  'absolutePath',
  'directory',
  'folder',
  'personalData',
  'sensitiveData'
] as const;

/**
 * Telemetry Collector with strict privacy compliance and zero PII emission
 * 
 * Collects operational metrics, performance data, and error information
 * while ensuring no personally identifiable information is captured or transmitted.
 */
export class TelemetryCollector {
  private events: TelemetryEvent[] = [];
  private eventsByType: Record<string, number> = {};
  private eventsBySource: Record<string, number> = {};
  private collectionStartTime = Date.now();
  private outputChannel?: vscode.OutputChannel;

  constructor(private readonly config: TelemetryConfig) {
    // Validate configuration
    if (!config.privacyCompliant) {
      throw new Error('TelemetryCollector requires privacyCompliant to be true');
    }

    // Set defaults
    this.config.maxEventHistory = config.maxEventHistory ?? 1000;
    this.config.outputChannel = config.outputChannel ?? true;
    this.config.statusBarNotifications = config.statusBarNotifications ?? false;

    // Create output channel if enabled
    if (this.config.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel('Haruspex Telemetry');
    }
  }

  /**
   * Record a telemetry event with automatic PII sanitization
   * 
   * @param name - Event name
   * @param data - Event data (will be sanitized)
   * @param source - Source component
   * @param level - Event severity level
   */
  recordEvent(
    name: string, 
    data: Record<string, unknown> = {},
    source = 'unknown',
    level: 'info' | 'warning' | 'error' = 'info'
  ): void {
    if (!this.config.privacyCompliant) {
      return;
    }

    // Sanitize data to remove PII
    const sanitizedData = this.sanitizeData(data);

    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      data: sanitizedData,
      source,
      level
    };

    // Add to internal storage
    this.events.push(event);
    this.eventsByType[name] = (this.eventsByType[name] ?? 0) + 1;
    this.eventsBySource[source] = (this.eventsBySource[source] ?? 0) + 1;

    // Maintain event history limit
    if (this.events.length > (this.config.maxEventHistory ?? 1000)) {
      this.events = this.events.slice(-(this.config.maxEventHistory ?? 1000));
    }

    // Emit to configured sinks
    this.emitEvent(event);
  }

  /**
   * Record a performance event
   */
  recordPerformanceEvent(
    operation: string,
    durationMs: number,
    additionalData: Record<string, unknown> = {}
  ): void {
    if (!this.config.performanceMetrics) {
      return;
    }

    this.recordEvent('performance', {
      operation,
      duration_ms: durationMs,
      ...additionalData
    }, 'performance', 'info');
  }

  /**
   * Record an error event (without sensitive information)
   */
  recordErrorEvent(
    errorType: string,
    component: string,
    additionalData: Record<string, unknown> = {}
  ): void {
    if (!this.config.errorReporting) {
      return;
    }

    this.recordEvent('error', {
      error_type: errorType,
      component,
      ...additionalData
    }, component, 'error');
  }

  /**
   * Record startup and activation events
   */
  recordStartupEvent(event: string, data: Record<string, unknown> = {}): void {
    this.recordEvent(`startup.${event}`, data, 'core', 'info');
  }

  /**
   * Record compatibility validation events
   */
  recordCompatibilityEvent(
    score: number,
    componentsValidated: number,
    issuesFound: number
  ): void {
    this.recordEvent('pcl_compatibility_validated', {
      score,
      components_validated: componentsValidated,
      issues_found: issuesFound
    }, 'compatibility', 'info');
  }

  /**
   * Get telemetry metrics
   */
  getMetrics(): TelemetryMetrics {
    return {
      totalEvents: this.events.length,
      eventsByType: { ...this.eventsByType },
      eventsBySource: { ...this.eventsBySource },
      recentEvents: this.events.slice(-20), // Last 20 events
      collectionStartTime: this.collectionStartTime
    };
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string, limit = 10): TelemetryEvent[] {
    return this.events
      .filter(event => event.name === eventType)
      .slice(-limit);
  }

  /**
   * Clear all collected telemetry data
   */
  clear(): void {
    this.events = [];
    this.eventsByType = {};
    this.eventsBySource = {};
    this.collectionStartTime = Date.now();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.outputChannel?.dispose();
  }

  /**
   * Sanitize data to remove all PII
   */
  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Check if key matches PII patterns
      const isPIIKey = PII_PATTERNS.some(pattern => 
        key.toLowerCase().includes(pattern.toLowerCase())
      );

      if (isPIIKey) {
        // Remove PII fields completely
        continue;
      }

      // Sanitize string values that might contain paths or personal data
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeData(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        // Sanitize arrays
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) :
          typeof item === 'object' && item !== null ? this.sanitizeData(item as Record<string, unknown>) :
          item
        );
      } else {
        // Keep primitive values (numbers, booleans, null)
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize string values to remove potential PII
   */
  private sanitizeString(value: string): string {
    // Remove file paths by replacing with generic indicators
    let sanitized = value;

    // Remove absolute paths
    sanitized = sanitized.replace(/[A-Za-z]:[\\\/][^\\\/\s]*[\\\/]/g, '[PATH]/');
    sanitized = sanitized.replace(/\/[^\/\s]*\/[^\/\s]*/g, '[PATH]/');
    
    // Remove usernames from paths
    sanitized = sanitized.replace(/\/Users\/[^\/]+\//g, '/Users/[USER]/');
    sanitized = sanitized.replace(/\\Users\\[^\\]+\\/g, '\\Users\\[USER]\\');
    
    // Remove email patterns
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    
    // Remove potential project names (sequences of word characters in paths)
    sanitized = sanitized.replace(/\/([A-Za-z][A-Za-z0-9_-]{2,})\//g, '/[PROJECT]/');
    
    return sanitized;
  }

  /**
   * Emit event to configured sinks
   */
  private emitEvent(event: TelemetryEvent): void {
    // Emit to VSCode Output channel
    if (this.outputChannel && this.config.outputChannel) {
      const timestamp = new Date(event.timestamp).toISOString();
      const logLine = `[${timestamp}] ${event.level?.toUpperCase()} ${event.source}: ${event.name} ${JSON.stringify(event.data)}`;
      this.outputChannel.appendLine(logLine);
    }

    // Emit to status bar for important events
    if (this.config.statusBarNotifications && event.level === 'error') {
      vscode.window.showWarningMessage(`Haruspex: ${event.name}`);
    }
  }
}