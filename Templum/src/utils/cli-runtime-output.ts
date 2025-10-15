import { inspect } from 'util';
import { createLogger, Logger } from './logger';
import { StringWidthUtils } from './chainable-string-utils';

export interface CliRuntimeOutputOptions {
  context?: string;
  logger?: Logger;
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
}

type OutputLevel = 'info' | 'warn' | 'error';

interface EmitOptions {
  level: OutputLevel;
  message: string;
  stream: 'stdout' | 'stderr';
  data?: unknown;
  error?: unknown;
}

const hasTrailingNewline = (value: string): boolean => value.endsWith('\n');

export class CliRuntimeOutput {
  private readonly logger: Logger;
  private readonly stdout: NodeJS.WritableStream;
  private readonly stderr: NodeJS.WritableStream;

  constructor(options: CliRuntimeOutputOptions = {}) {
    this.logger = options.logger ?? createLogger(options.context ?? 'cli-runtime');
    this.stdout = options.stdout ?? process.stdout;
    this.stderr = options.stderr ?? process.stderr;
  }

  info(message: string, data?: unknown): void {
    this.emit({ level: 'info', message, stream: 'stdout', data });
  }

  success(message: string, data?: unknown): void {
    this.info(message, data);
  }

  muted(message: string, data?: unknown): void {
    this.info(message, data);
  }

  command(message: string, data?: unknown): void {
    this.info(message, data);
  }

  separator(message: string, data?: unknown): void {
    this.info(message, data);
  }

  warn(message: string, data?: unknown): void {
    this.emit({ level: 'warn', message, stream: 'stderr', data });
  }

  error(message: string, error?: unknown, data?: unknown): void {
    this.emit({ level: 'error', message, stream: 'stderr', error, data });
  }

  blank(stream: 'stdout' | 'stderr' = 'stdout'): void {
    this.write('', stream);
  }

  private emit(options: EmitOptions): void {
    const { level, message, stream, data, error } = options;
    const sanitizedMessage = StringWidthUtils.stripAnsi(message);

    switch (level) {
      case 'info': {
        this.logger.info(sanitizedMessage, data);
        this.write(message, stream);
        if (data !== undefined) {
          this.writeDiagnostic(data, stream);
        }
        break;
      }
      case 'warn': {
        const normalized = this.normalizeErrorPayload(error);
        const payload = data ?? normalized;
        this.logger.warn(sanitizedMessage, payload);
        this.write(message, stream);
        if (payload !== undefined) {
          this.writeDiagnostic(payload, stream);
        }
        break;
      }
      case 'error': {
        const resolvedError = this.toError(error ?? (data instanceof Error ? data : undefined));
        const metadata = resolvedError ? data : data ?? (error instanceof Error ? undefined : error);
        this.logger.error(sanitizedMessage, resolvedError, metadata);
        this.write(message, stream);
        if (resolvedError?.stack) {
          this.write(resolvedError.stack, stream);
        } else if (metadata !== undefined) {
          this.writeDiagnostic(metadata, stream);
        }
        break;
      }
      default:
        break;
    }
  }

  private write(message: string, stream: 'stdout' | 'stderr'): void {
    const target = stream === 'stdout' ? this.stdout : this.stderr;
    const value = message === '' ? '\n' : hasTrailingNewline(message) ? message : `${message}\n`;
    target.write(value);
  }

  private writeDiagnostic(value: unknown, stream: 'stdout' | 'stderr'): void {
    const diagnostic = this.formatDiagnostic(value);
    if (diagnostic) {
      this.write(diagnostic, stream);
    }
  }

  private formatDiagnostic(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (value instanceof Error) {
      return value.stack ?? value.message ?? null;
    }

    if (typeof value === 'string') {
      return value;
    }

    try {
      return inspect(value, { depth: 4, colors: true });
    } catch {
      return String(value);
    }
  }

  private toError(value: unknown): Error | undefined {
    return value instanceof Error ? value : undefined;
  }

  private normalizeErrorPayload(value: unknown): unknown {
    if (value instanceof Error) {
      return { error: value.message };
    }
    return value;
  }
}

export const createCliRuntimeOutput = (options?: CliRuntimeOutputOptions): CliRuntimeOutput =>
  new CliRuntimeOutput(options);
