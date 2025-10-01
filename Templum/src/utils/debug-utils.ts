import { inspect as serialize } from 'util';
import { createLogger, Logger, LogLevel } from './logger';
import { handle as defaultErrorHandler } from './error-handler';

export type DebugLogger = Pick<Logger, 'debug' | 'info' | 'warn' | 'error' | 'setLevel' | 'child'>;

export interface DebugToolkitConfig {
  namespace?: string;
  enabled?: boolean;
  level?: LogLevel;
  historyLimit?: number;
  logger?: DebugLogger;
  errorHandler?: (error: unknown, context: string, metadata?: Record<string, unknown>) => unknown;
  clock?: () => number;
}

export interface DebugLogOptions {
  level?: LogLevel;
  data?: unknown;
  scope?: string;
}

export interface InspectOptions {
  label?: string;
  level?: LogLevel;
  scope?: string;
  maxDepth?: number;
  maxArrayLength?: number;
}

export interface ProfileOptions<T> {
  level?: LogLevel;
  scope?: string;
  metadata?: Record<string, unknown>;
  swallowError?: boolean;
  fallbackValue?: T;
  onError?: (error: unknown) => void;
}

export type DebugHistoryEntry =
  | {
      type: 'log';
      namespace: string;
      level: LogLevel;
      message: string;
      timestamp: number;
      data?: unknown;
    }
  | {
      type: 'inspect';
      namespace: string;
      level: LogLevel;
      label?: string;
      snapshot: string;
      timestamp: number;
    }
  | {
      type: 'profile';
      namespace: string;
      level: LogLevel;
      label: string;
      durationMs: number;
      timestamp: number;
      metadata?: Record<string, unknown>;
      error?: unknown;
    };

export interface DebugToolkit {
  log(message: string, options?: DebugLogOptions): DebugToolkit;
  inspect<T>(target: T, options?: InspectOptions): DebugToolkit;
  profile<T>(label: string, operation: () => Promise<T> | T, options?: ProfileOptions<T>): Promise<T>;
  onTeardown(handler: () => void): DebugToolkit;
  teardown(): void;
  withContext(context: string): DebugToolkit;
  getHistory(): ReadonlyArray<DebugHistoryEntry>;
}

interface NormalizedConfig {
  namespace: string;
  enabled: boolean;
  level: LogLevel;
  historyLimit: number;
  logger: DebugLogger;
  errorHandler: (error: unknown, context: string, metadata?: Record<string, unknown>) => unknown;
  clock: () => number;
}

interface SharedState {
  history: DebugHistoryEntry[];
  cleanupHandlers: Set<() => void>;
  disposed: boolean;
}

const DEFAULT_HISTORY_LIMIT = 50;

export function createDebugToolkit(config: DebugToolkitConfig = {}): DebugToolkit {
  const namespace = config.namespace?.trim() || 'debug-utils';
  const logger = (config.logger ?? createLogger(namespace)) as DebugLogger;
  if (config.level !== undefined) {
    logger.setLevel(config.level);
  }

  const normalized: NormalizedConfig = {
    namespace,
    enabled: config.enabled ?? true,
    level: config.level ?? LogLevel.DEBUG,
    historyLimit: config.historyLimit ?? DEFAULT_HISTORY_LIMIT,
    logger,
    errorHandler: config.errorHandler ?? defaultErrorHandler,
    clock: config.clock ?? (() => Date.now())
  };

  const shared: SharedState = {
    history: [],
    cleanupHandlers: new Set(),
    disposed: false
  };

  return new DebugToolkitImpl(normalized, shared);
}

class DebugToolkitImpl implements DebugToolkit {
  private readonly scopedLoggers = new Map<string, DebugLogger>();

  constructor(
    private readonly config: NormalizedConfig,
    private readonly state: SharedState
  ) {
    this.scopedLoggers.set(config.namespace, config.logger);
  }

  log(message: string, options: DebugLogOptions = {}): DebugToolkit {
    const level = options.level ?? LogLevel.DEBUG;
    if (!this.shouldEmit(level)) {
      return this;
    }

    const namespace = this.composeNamespace(options.scope);
    this.dispatch(level, namespace, message, options.data);
    this.recordHistory({
      type: 'log',
      namespace,
      level,
      message,
      timestamp: this.now(),
      data: options.data
    });
    return this;
  }

  inspect<T>(target: T, options: InspectOptions = {}): DebugToolkit {
    const level = options.level ?? LogLevel.DEBUG;
    if (!this.shouldEmit(level)) {
      return this;
    }

    const namespace = this.composeNamespace(options.scope);
    const snapshot = serialize(target, {
      depth: options.maxDepth ?? 2,
      maxArrayLength: options.maxArrayLength ?? 20,
      breakLength: 120
    });
    const label = options.label ?? 'inspection';

    this.dispatch(level, namespace, label, { snapshot });
    this.recordHistory({
      type: 'inspect',
      namespace,
      level,
      label,
      snapshot,
      timestamp: this.now()
    });
    return this;
  }

  async profile<T>(
    label: string,
    operation: () => Promise<T> | T,
    options: ProfileOptions<T> = {}
  ): Promise<T> {
    const level = options.level ?? LogLevel.DEBUG;
    const namespace = this.composeNamespace(options.scope);
    const start = this.now();

    try {
      const result = await operation();
      const durationMs = this.now() - start;
      if (this.shouldEmit(level)) {
        const payload = { durationMs, ...(options.metadata ?? {}) };
        this.dispatch(level, namespace, `${label} completed`, payload);
      }
      this.recordHistory({
        type: 'profile',
        namespace,
        level,
        label,
        durationMs,
        timestamp: this.now(),
        metadata: options.metadata
      });
      return result;
    } catch (error) {
      const durationMs = this.now() - start;
      const metadata = { ...(options.metadata ?? {}), durationMs, phase: 'profile' };
      const context = `${namespace}:${label}`;
      const handled = this.config.errorHandler(error, context, metadata);
      if (this.shouldEmit(LogLevel.ERROR)) {
        this.dispatch(LogLevel.ERROR, namespace, `${label} failed`, {
          ...metadata,
          error: handled ?? error
        });
      }
      this.recordHistory({
        type: 'profile',
        namespace,
        level: LogLevel.ERROR,
        label,
        durationMs,
        timestamp: this.now(),
        metadata,
        error: handled ?? error
      });
      if (options.onError) {
        options.onError(handled ?? error);
      }
      if (options.swallowError) {
        return options.fallbackValue as T;
      }
      throw handled ?? error;
    }
  }

  onTeardown(handler: () => void): DebugToolkit {
    if (this.state.disposed) {
      this.invokeCleanup(handler);
      return this;
    }
    this.state.cleanupHandlers.add(handler);
    return this;
  }

  teardown(): void {
    if (this.state.disposed) {
      return;
    }
    this.state.disposed = true;
    for (const handler of this.state.cleanupHandlers) {
      this.invokeCleanup(handler);
    }
    this.state.cleanupHandlers.clear();
    this.state.history.length = 0;
  }

  withContext(context: string): DebugToolkit {
    const namespace = this.composeNamespace(context);
    const logger = this.getScopedLogger(namespace);
    const nextConfig: NormalizedConfig = {
      ...this.config,
      namespace,
      logger
    };
    return new DebugToolkitImpl(nextConfig, this.state);
  }

  getHistory(): ReadonlyArray<DebugHistoryEntry> {
    return [...this.state.history];
  }

  private shouldEmit(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return level <= this.config.level;
  }

  private now(): number {
    return this.config.clock();
  }

  private composeNamespace(scope?: string): string {
    if (!scope || !scope.trim()) {
      return this.config.namespace;
    }
    if (!this.config.namespace) {
      return scope.trim();
    }
    return `${this.config.namespace}:${scope.trim()}`;
  }

  private dispatch(level: LogLevel, namespace: string, message: string, data?: unknown): void {
    const logger = this.getScopedLogger(namespace);
    switch (level) {
      case LogLevel.ERROR:
        logger.error(message, null, data);
        break;
      case LogLevel.WARN:
        logger.warn(message, data);
        break;
      case LogLevel.INFO:
        logger.info(message, data);
        break;
      default:
        logger.debug(message, data);
    }
  }

  private getScopedLogger(namespace: string): DebugLogger {
    const existing = this.scopedLoggers.get(namespace);
    if (existing) {
      return existing;
    }

    if (!this.config.namespace || namespace === this.config.namespace) {
      this.scopedLoggers.set(namespace, this.config.logger);
      return this.config.logger;
    }

    const suffix = namespace.slice(this.config.namespace.length).replace(/^:/, '');
    if (!suffix) {
      this.scopedLoggers.set(namespace, this.config.logger);
      return this.config.logger;
    }

    const segments = suffix.split(':');
    let current: Logger = this.config.logger as unknown as Logger;
    for (const segment of segments) {
      if (!segment) {
        continue;
      }
      current = current.child(segment);
    }

    const scoped = current as unknown as DebugLogger;
    this.scopedLoggers.set(namespace, scoped);
    return scoped;
  }

  private recordHistory(entry: DebugHistoryEntry): void {
    this.state.history.push(entry);
    if (this.state.history.length > this.config.historyLimit) {
      this.state.history.splice(0, this.state.history.length - this.config.historyLimit);
    }
  }

  private invokeCleanup(handler: () => void): void {
    try {
      handler();
    } catch (error) {
      this.config.errorHandler(error, `${this.config.namespace}:teardown`, { phase: 'teardown' });
    }
  }
}
