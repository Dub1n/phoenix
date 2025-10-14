/**---
 * title: [Backend Telemetry Collector - Pure Backend Implementation]
 * tags: [Backend, Telemetry, Node.js, Pure-Backend, VSCode-Independent]
 * provides: [TelemetryCollector, Backend-Compatible-Telemetry]
 * requires: [Node.js-Runtime, Console-Logging]
 * description: [Pure backend implementation of telemetry collection using Node.js APIs instead of VSCode APIs]
 * ---*/

import * as fs from 'fs/promises';
import * as path from 'path';

export interface TelemetryConfig {
  /** Whether privacy-compliant telemetry is enabled */
  privacyCompliant: boolean;
  /** Whether to collect performance metrics */
  performanceMetrics: boolean;
  /** Whether to report errors (without sensitive data) */
  errorReporting: boolean;
  /** Maximum number of events to keep in memory */
  maxEventHistory?: number;
  /** Log level for console output */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  /** Optional file path for telemetry logs */
  logFilePath?: string;
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
  startTime: number;
  /** Collection duration */
  duration: number;
}

/**
 * Backend Telemetry Collector
 * 
 * Pure backend implementation that provides telemetry collection using Node.js APIs
 * instead of VSCode-specific APIs. Suitable for standalone backend services.
 */
export class BackendTelemetryCollector {
  private events: TelemetryEvent[] = [];
  private startTime: number = Date.now();
  private eventsByType: Record<string, number> = {};
  private eventsBySource: Record<string, number> = {};
  private isEnabled: boolean = true;

  constructor(private config: TelemetryConfig) {
    this.log(`Backend Telemetry Collector initialized`, 'info');
    
    if (config.logFilePath) {
      this.log(`Telemetry will be logged to: ${config.logFilePath}`, 'info');
    }
  }

  /**
   * Record a telemetry event
   */
  recordEvent(name: string, data: Record<string, unknown>, source?: string, level?: 'info' | 'warning' | 'error'): void {
    if (!this.isEnabled || !this.config.privacyCompliant) {
      return;
    }

    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      data: this.sanitizeData(data),
      source,
      level: level || 'info'
    };

    // Add to events history
    this.events.push(event);
    
    // Maintain max history size
    const maxHistory = this.config.maxEventHistory || 1000;
    if (this.events.length > maxHistory) {
      this.events = this.events.slice(-maxHistory);
    }

    // Update metrics
    this.eventsByType[name] = (this.eventsByType[name] || 0) + 1;
    if (source) {
      this.eventsBySource[source] = (this.eventsBySource[source] || 0) + 1;
    }

    // Log to console based on log level
    this.logEvent(event);

    // Write to file if configured
    if (this.config.logFilePath) {
      this.writeToFile(event).catch(error => {
        console.error('Failed to write telemetry to file:', error);
      });
    }
  }

  /**
   * Record performance metric
   */
  recordPerformanceMetric(operation: string, durationMs: number, metadata?: Record<string, unknown>): void {
    if (!this.config.performanceMetrics) {
      return;
    }

    this.recordEvent('performance_metric', {
      operation,
      durationMs,
      ...metadata
    }, 'performance', 'info');
  }

  /**
   * Record error (without sensitive data)
   */
  recordError(error: Error | string, context?: Record<string, unknown>): void {
    if (!this.config.errorReporting) {
      return;
    }

    const errorData = typeof error === 'string' 
      ? { message: error }
      : { 
          message: error.message, 
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 5).join('\n') // Limit stack trace
        };

    this.recordEvent('error', {
      error: errorData,
      context: this.sanitizeData(context || {})
    }, 'error_reporting', 'error');
  }

  /**
   * Get current telemetry metrics
   */
  getMetrics(): TelemetryMetrics {
    const recentCount = Math.min(50, this.events.length);
    
    return {
      totalEvents: this.events.length,
      eventsByType: { ...this.eventsByType },
      eventsBySource: { ...this.eventsBySource },
      recentEvents: this.events.slice(-recentCount),
      startTime: this.startTime,
      duration: Date.now() - this.startTime
    };
  }

  /**
   * Enable/disable telemetry collection
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.log(`Telemetry collection ${enabled ? 'enabled' : 'disabled'}`, 'info');
  }

  /**
   * Clear all collected events
   */
  clearEvents(): void {
    this.events = [];
    this.eventsByType = {};
    this.eventsBySource = {};
    this.log('Telemetry events cleared', 'info');
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 50): TelemetryEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.log('Backend Telemetry Collector disposed', 'info');
    this.isEnabled = false;
  }

  /**
   * Sanitize data to remove PII and sensitive information
   */
  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip potentially sensitive keys
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Handle different value types
      if (typeof value === 'string') {
        // Redact potential file paths with user info
        if (value.includes('Users') || value.includes('/home/')) {
          sanitized[key] = '[PATH_REDACTED]';
        } else {
          sanitized[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Log event to console based on configuration
   */
  private logEvent(event: TelemetryEvent): void {
    const logLevel = this.config.logLevel || 'info';
    
    // Convert log level to number for comparison
    const levels = { debug: 0, info: 1, warn: 2, warning: 2, error: 3 };
    const currentLevel = levels[logLevel];
    const eventLevel = levels[event.level || 'info'];
    
    if (eventLevel >= currentLevel) {
      const timestamp = new Date(event.timestamp).toISOString();
      const message = `[${timestamp}] [${event.source || 'telemetry'}] ${event.name}`;
      
      switch (event.level) {
        case 'error':
          console.error(message, event.data);
          break;
        case 'warning':
          console.warn(message, event.data);
          break;
        default:
          console.log(message, event.data);
      }
    }
  }

  /**
   * Write event to log file
   */
  private async writeToFile(event: TelemetryEvent): Promise<void> {
    if (!this.config.logFilePath) return;

    const logEntry = {
      timestamp: new Date(event.timestamp).toISOString(),
      name: event.name,
      level: event.level,
      source: event.source,
      data: event.data
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      // Ensure directory exists
      const dir = path.dirname(this.config.logFilePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Append to log file
      await fs.appendFile(this.config.logFilePath, logLine);
    } catch (error) {
      // Don't throw - just log to console as fallback
      console.error('Failed to write telemetry to file:', error);
    }
  }

  /**
   * Log internal messages
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [BackendTelemetryCollector]`;
    
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}
