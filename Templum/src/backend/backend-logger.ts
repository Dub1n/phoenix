import { createLogger, Logger } from '../utils/logger';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface ScopedLogEmitter {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  base(): Logger;
}

export function createBackendLogger(context: string): ScopedLogEmitter {
  const rootLogger = createLogger(context);
  const scopedLoggers = new Map<string, Logger>();

  function normalizeScope(rawScope: string): string {
    return rawScope
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'runtime';
  }

  function parseMessage(rawMessage: string): { scope: string; message: string } {
    const match = rawMessage.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (!match) {
      return { scope: 'runtime', message: rawMessage };
    }
    return { scope: match[1], message: match[2] };
  }

  function getScopedLogger(rawScope: string): Logger {
    const normalizedScope = normalizeScope(rawScope);
    const existing = scopedLoggers.get(normalizedScope);
    if (existing) {
      return existing;
    }
    const scoped = rootLogger.child(normalizedScope);
    scopedLoggers.set(normalizedScope, scoped);
    return scoped;
  }

  function packArgs(args: unknown[]): unknown {
    if (args.length === 0) {
      return undefined;
    }

    if (args.length === 1) {
      const [first] = args;
      return first instanceof Error ? { error: first } : first;
    }

    return args.map(entry => (entry instanceof Error ? { error: entry } : entry));
  }

  function log(level: LogLevel, rawMessage: string, args: unknown[]): void {
    const { scope, message } = parseMessage(rawMessage);
    const logger = getScopedLogger(scope);

    if (level === 'error') {
      const [maybeError, ...rest] = args;
      const error = maybeError instanceof Error ? maybeError : undefined;
      const data = error ? packArgs(rest) : packArgs(args);
      logger.error(message, error ?? undefined, data);
      return;
    }

    if (level === 'warn') {
      logger.warn(message, packArgs(args));
      return;
    }

    if (level === 'debug') {
      logger.debug(message, packArgs(args));
      return;
    }

    logger.info(message, packArgs(args));
  }

  return {
    info(rawMessage: string, ...args: unknown[]): void {
      log('info', rawMessage, args);
    },
    warn(rawMessage: string, ...args: unknown[]): void {
      log('warn', rawMessage, args);
    },
    error(rawMessage: string, ...args: unknown[]): void {
      log('error', rawMessage, args);
    },
    debug(rawMessage: string, ...args: unknown[]): void {
      log('debug', rawMessage, args);
    },
    base(): Logger {
      return rootLogger;
    }
  };
}
