import { inspect } from 'util';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogRecord {
  level: LogLevel;
  message: string;
  context: string;
  timestamp: Date;
  data?: unknown;
  error?: Error;
  durationMs?: number;
}

export interface LoggerTransport {
  log(record: LogRecord): void;
}

export interface LoggerOptions {
  context?: string;
  level?: LogLevel;
}

export interface LoggerConfiguration {
  level: LogLevel;
  structured: boolean;
  transport: LoggerTransport;
  serializer?: (record: LogRecord) => unknown;
}

const DEFAULT_CONFIGURATION: LoggerConfiguration = {
  level: LogLevel.INFO,
  structured: false,
  transport: {
    log(record: LogRecord): void {
      const { level, message, context, timestamp, data, error, durationMs } = record;
      const levelLabel = LogLevel[level];
      const prefix = `[${timestamp.toISOString()}] [${context}] [${levelLabel}]`;

      if (error) {
        console.error(prefix, message, formatPayload(data), formatError(error));
        return;
      }

      const target = level === LogLevel.ERROR
        ? console.error
        : level === LogLevel.WARN
          ? console.warn
          : level === LogLevel.DEBUG
            ? console.debug
            : console.log;

      if (data !== undefined || durationMs !== undefined) {
        target(prefix, message, mergePayload(data, durationMs));
      } else {
        target(prefix, message);
      }
    }
  }
};

let activeConfiguration: LoggerConfiguration = { ...DEFAULT_CONFIGURATION };

function mergePayload(data: unknown, durationMs?: number): unknown {
  if (durationMs === undefined) {
    return data;
  }
  if (data && typeof data === 'object') {
    return { ...(data as Record<string, unknown>), durationMs };
  }
  return { data, durationMs };
}

function formatPayload(data: unknown): unknown {
  if (data === undefined) {
    return undefined;
  }
  if (typeof data === 'string') {
    return data;
  }
  try {
    return inspect(data, { depth: 4, colors: false, getters: true });
  } catch {
    return String(data);
  }
}

function formatError(error: Error): Record<string, unknown> {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

export class Logger {
  private readonly context: string;
  private level: LogLevel;
  private readonly timers = new Map<string, number>();

  constructor(options: LoggerOptions = {}) {
    this.context = options.context ?? detectContext();
    this.level = options.level ?? activeConfiguration.level;
  }

  info(message: string, data?: unknown): void {
    this.dispatch(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.dispatch(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | null, data?: unknown): void {
    this.dispatch(LogLevel.ERROR, message, data, error ?? undefined);
  }

  debug(message: string, data?: unknown): void {
    this.dispatch(LogLevel.DEBUG, message, data);
  }

  time(label: string): void {
    this.timers.set(label, Date.now());
  }

  timeEnd(label: string, data?: Record<string, unknown>): void {
    const start = this.timers.get(label);
    if (start === undefined) {
      return;
    }
    this.timers.delete(label);
    const durationMs = Date.now() - start;
    this.dispatch(LogLevel.INFO, `${label} completed`, data, undefined, durationMs);
  }

  child(suffix: string, options: Partial<LoggerOptions> = {}): Logger {
    const context = `${this.context}:${suffix}`;
    return new Logger({ context, level: options.level ?? this.level });
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private dispatch(level: LogLevel, message: string, data?: unknown, error?: Error, durationMs?: number): void {
    if (level > this.level || level > activeConfiguration.level) {
      return;
    }

    const record: LogRecord = {
      level,
      message,
      context: this.context,
      timestamp: new Date(),
      data,
      error,
      durationMs
    };

    if (activeConfiguration.structured) {
      const payload = activeConfiguration.serializer
        ? activeConfiguration.serializer(record)
        : {
            timestamp: record.timestamp.toISOString(),
            level: LogLevel[record.level],
            context: record.context,
            message: record.message,
            data: record.data,
            error: record.error ? formatError(record.error) : undefined,
            durationMs: record.durationMs
          };
      activeConfiguration.transport.log({ ...record, data: payload });
      return;
    }

    activeConfiguration.transport.log(record);
  }
}

export class LoggerConfig {
  static configure(configuration: Partial<LoggerConfiguration>): void {
    activeConfiguration = {
      ...activeConfiguration,
      ...configuration,
      transport: configuration.transport ?? activeConfiguration.transport
    };
  }

  static setLevel(level: LogLevel): void {
    activeConfiguration.level = level;
  }

  static useStructuredLogging(serializer?: LoggerConfiguration['serializer']): void {
    activeConfiguration.structured = true;
    if (serializer) {
      activeConfiguration.serializer = serializer;
    }
  }

  static disableStructuredLogging(): void {
    activeConfiguration.structured = false;
  }

  static useTransport(transport: LoggerTransport): void {
    activeConfiguration.transport = transport;
  }

  static getConfiguration(): LoggerConfiguration {
    return { ...activeConfiguration };
  }
}

export function createLogger(context?: string, options: Partial<LoggerOptions> = {}): Logger {
  return new Logger({ context, level: options.level });
}

export const log = new Logger();

function detectContext(): string {
  const stack = new Error().stack;
  if (!stack) {
    return 'unknown';
  }

  const frames = stack.split('\n');
  for (const frame of frames) {
    const match = frame.match(/\(([^)]+\.[tj]s):\d+:\d+\)$/);
    if (match) {
      const path = match[1].replace(/\\/g, '/');
      const fileName = path.substring(path.lastIndexOf('/') + 1);
      return fileName.replace(/\.[tj]s$/, '');
    }
  }

  return 'unknown';
}

