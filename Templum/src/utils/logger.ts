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

type StructuredPayload = Record<string, unknown>;

const STREAM_BY_LEVEL: Record<LogLevel, NodeJS.WritableStream> = {
  [LogLevel.ERROR]: process.stderr,
  [LogLevel.WARN]: process.stderr,
  [LogLevel.INFO]: process.stdout,
  [LogLevel.DEBUG]: process.stdout
};

function defaultStructuredSerializer(record: LogRecord): StructuredPayload {
  const payload: StructuredPayload = {
    timestamp: record.timestamp.toISOString(),
    level: LogLevel[record.level],
    context: record.context,
    message: record.message
  };

  if (record.data !== undefined) {
    payload.data = record.data;
  }

  if (record.error) {
    payload.error = formatError(record.error);
  }

  if (record.durationMs !== undefined) {
    payload.durationMs = record.durationMs;
  }

  return payload;
}

function isStructuredPayload(payload: unknown): payload is StructuredPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.timestamp === 'string' &&
    typeof candidate.level === 'string' &&
    typeof candidate.context === 'string' &&
    typeof candidate.message === 'string'
  );
}

function serializeStructuredPayload(payload: StructuredPayload): string {
  try {
    return JSON.stringify(payload);
  } catch {
    return inspect(payload, { depth: 4, colors: false, getters: true });
  }
}

function resolveStructuredPayload(record: LogRecord): StructuredPayload {
  if (isStructuredPayload(record.data)) {
    return record.data;
  }

  return defaultStructuredSerializer(record);
}

const DEFAULT_CONFIGURATION: LoggerConfiguration = {
  level: LogLevel.INFO,
  structured: true,
  serializer: defaultStructuredSerializer,
  transport: {
    log(record: LogRecord): void {
      const stream = STREAM_BY_LEVEL[record.level] ?? process.stdout;
      const payload = resolveStructuredPayload(record);
      stream.write(`${serializeStructuredPayload(payload)}\n`);
    }
  }
};

let activeConfiguration: LoggerConfiguration = { ...DEFAULT_CONFIGURATION };

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

export function normalizeLoggerError(error: unknown): { error?: Error; data?: unknown } {
  if (error instanceof Error) {
    return { error };
  }

  if (error === undefined || error === null) {
    return {};
  }

  if (typeof error === 'object') {
    return { data: error };
  }

  return { data: { details: error } };
}

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
