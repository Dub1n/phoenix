import { ErrorHandler } from '../../utils/error-handler';
import type { TemplumError } from '../../types/templum-types';

type MCPDiagnosticLevel = 'info' | 'warn' | 'error';

export interface MCPDiagnosticEntry {
  level: MCPDiagnosticLevel;
  scope: string;
  message: string;
  timestamp: number;
  context?: Record<string, unknown>;
  templumError?: TemplumError;
}

const MAX_ENTRIES = 200;

class MCPDiagnosticsBuffer {
  private entries: MCPDiagnosticEntry[] = [];

  record(entry: MCPDiagnosticEntry): void {
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_ENTRIES);
    }
  }

  snapshot(): MCPDiagnosticEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}

const buffer = new MCPDiagnosticsBuffer();

function record(scope: string, level: MCPDiagnosticLevel, message: string, context?: Record<string, unknown>, templumError?: TemplumError): void {
  buffer.record({
    level,
    scope,
    message,
    context,
    templumError,
    timestamp: Date.now()
  });
}

export function recordMCPInfo(scope: string, message: string, context?: Record<string, unknown>): void {
  record(scope, 'info', message, context);
}

export function recordMCPWarning(scope: string, message: string, context?: Record<string, unknown>): void {
  record(scope, 'warn', message, context);
}

export function recordMCPError(scope: string, message: string, error: unknown, context?: Record<string, unknown>): TemplumError {
  const templumError = ErrorHandler.handle(error, `mcp-channel:${scope}`, context);
  record(scope, 'error', message, context, templumError);
  return templumError;
}

export function getMCPDiagnosticsSnapshot(): MCPDiagnosticEntry[] {
  return buffer.snapshot();
}

export function clearMCPDiagnostics(): void {
  buffer.clear();
}

export interface MCPDiagnosticsHandle {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error: unknown, context?: Record<string, unknown>): TemplumError;
}

export function createMCPDiagnostics(scope: string): MCPDiagnosticsHandle {
  return {
    info(message, context) {
      recordMCPInfo(scope, message, context);
    },
    warn(message, context) {
      recordMCPWarning(scope, message, context);
    },
    error(message, error, context) {
      return recordMCPError(scope, message, error, context);
    }
  };
}
