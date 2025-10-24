import { createLogger, Logger } from './logger';
import { sleep, withTimeout as asyncWithTimeout } from './async-utils';
import {
  createTemplumError,
  isTemplumError,
  TemplumError
} from '../types/templum-types';

export type ErrorMetadata = Record<string, unknown>;

export type HandlerResult<T> = { ok: true; value: T } | { ok: false; error: TemplumError };

export interface AsyncErrorOptions<T = unknown> {
  timeout?: number;
  fallback?: T;
  swallow?: boolean;
  metadata?: ErrorMetadata;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: boolean;
  onRetry?: (context: string, error: unknown, attempt: number, delayMs: number) => void;
  metadata?: ErrorMetadata;
}

export interface WithFallbackOptions {
  logError?: boolean;
  metadata?: ErrorMetadata;
}

export interface ScopedErrorHandler {
  readonly context: string;
  handle(error: unknown, metadata?: ErrorMetadata): TemplumError;
  handleAsync<T>(promise: Promise<T>, options?: AsyncErrorOptions<T>): Promise<T>;
  capture<T>(fn: () => T, metadata?: ErrorMetadata): HandlerResult<T>;
  captureAsync<T>(fn: () => Promise<T>, metadata?: ErrorMetadata): Promise<HandlerResult<T>>;
  withFallback<T>(
    fn: () => T,
    fallback: T,
    options?: boolean | WithFallbackOptions
  ): T;
  withFallbackAsync<T>(
    fn: () => Promise<T>,
    fallback: T,
    options?: boolean | WithFallbackOptions
  ): Promise<T>;
  retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
  child(segment: string, metadata?: ErrorMetadata): ScopedErrorHandler;
}

export class ErrorHandler {
  private static logger: Logger = createLogger('error-handler');

  static handle(
    error: unknown,
    context: string,
    metadata?: ErrorMetadata
  ): TemplumError {
    const templumError = this.normalizeError(error, context);
    this.logger.error(`Error in ${context}`, templumError, {
      originalError: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      ...metadata
    });
    return templumError;
  }

  static async handleAsync<T>(
    promise: Promise<T>,
    context: string,
    options: AsyncErrorOptions<T> = {}
  ): Promise<T> {
    const { timeout = 0, fallback, swallow = false, metadata } = options;

    try {
      if (timeout && timeout > 0) {
        return await asyncWithTimeout(promise, timeout);
      }
      return await promise;
    } catch (error) {
      const templumError = this.handle(
        error,
        context,
        this.mergeMetadata(metadata, fallback !== undefined ? { fallback } : undefined)
      );
      if (fallback !== undefined) {
        const warnPayload = this.mergeMetadata({ fallback }, metadata) ?? { fallback };
        this.logger.warn(`Using fallback for ${context}`, warnPayload);
        return fallback;
      }
      if (swallow) {
        return undefined as unknown as T;
      }
      throw templumError;
    }
  }

  static capture<T>(
    fn: () => T,
    context: string,
    metadata?: ErrorMetadata
  ): HandlerResult<T> {
    try {
      return { ok: true, value: fn() };
    } catch (error) {
      const templumError = this.handle(error, context, metadata);
      return { ok: false, error: templumError };
    }
  }

  static async captureAsync<T>(
    fn: () => Promise<T>,
    context: string,
    metadata?: ErrorMetadata
  ): Promise<HandlerResult<T>> {
    try {
      return { ok: true, value: await fn() };
    } catch (error) {
      const templumError = this.handle(error, context, metadata);
      return { ok: false, error: templumError };
    }
  }

  static wrap<T>(fn: () => T, context: string, metadata?: ErrorMetadata): T | null {
    try {
      return fn();
    } catch (error) {
      this.handle(error, context, metadata);
      return null;
    }
  }

  static async wrapAsync<T>(
    fn: () => Promise<T>,
    context: string,
    fallback?: T,
    metadata?: ErrorMetadata
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context, metadata);
      return fallback ?? null;
    }
  }

  static withFallback<T>(
    fn: () => T,
    fallback: T,
    context: string,
    logErrorOrOptions: boolean | WithFallbackOptions = true,
    metadataArg?: ErrorMetadata
  ): T {
    try {
      return fn();
    } catch (error) {
      const { logError, metadata } = this.resolveWithFallbackArgs(logErrorOrOptions, metadataArg);
      if (logError) {
        this.handle(error, context, metadata);
      }
      return fallback;
    }
  }

  static async withFallbackAsync<T>(
    fn: () => Promise<T>,
    fallback: T,
    context: string,
    logErrorOrOptions: boolean | WithFallbackOptions = true,
    metadataArg?: ErrorMetadata
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const { logError, metadata } = this.resolveWithFallbackArgs(logErrorOrOptions, metadataArg);
      if (logError) {
        this.handle(error, context, metadata);
      }
      return fallback;
    }
  }

  static async retry<T>(
    fn: () => Promise<T>,
    context: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelayMs = 1000,
      maxDelayMs = 10000,
      factor = 2,
      jitter = true,
      onRetry,
      metadata
    } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) {
          break;
        }

        let delay = Math.min(baseDelayMs * Math.pow(factor, attempt - 1), maxDelayMs);
        if (jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }

        this.logger.warn(`${context} attempt ${attempt} failed, retrying`, {
          attempt,
          maxAttempts,
          delayMs: Math.round(delay),
          error: error instanceof Error ? error.message : String(error),
          ...metadata
        });

        if (onRetry) {
          onRetry(context, error, attempt, delay);
        }

        await sleep(delay);
      }
    }

    throw this.handle(
      lastError,
      `${context} (after ${maxAttempts} attempts)`,
      metadata
    );
  }

  private static resolveWithFallbackArgs(
    logErrorOrOptions: boolean | WithFallbackOptions = true,
    metadataArg?: ErrorMetadata
  ): { logError: boolean; metadata?: ErrorMetadata } {
    if (typeof logErrorOrOptions === 'boolean') {
      return {
        logError: logErrorOrOptions,
        metadata: this.mergeMetadata(metadataArg)
      };
    }

    const { logError = true, metadata } = logErrorOrOptions ?? {};
    return {
      logError,
      metadata: this.mergeMetadata(metadataArg, metadata)
    };
  }

  private static mergeMetadata(
    ...sources: Array<ErrorMetadata | undefined>
  ): ErrorMetadata | undefined {
    const merged = sources
      .filter((source): source is ErrorMetadata => Boolean(source))
      .reduce<Record<string, unknown>>((acc, source) => {
        Object.assign(acc, source);
        return acc;
      }, {});

    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  static scope(context: string, baseMetadata: ErrorMetadata = {}): ScopedErrorHandler {
    const applyMetadata = (metadata?: ErrorMetadata) =>
      this.mergeMetadata(baseMetadata, metadata);

    const mapAsyncOptions = <T>(options: AsyncErrorOptions<T> = {}): AsyncErrorOptions<T> => {
      const { metadata, ...rest } = options;
      const mergedMetadata = applyMetadata(metadata);
      return mergedMetadata ? { ...rest, metadata: mergedMetadata } : { ...rest };
    };

    const mapFallbackOptions = (options?: WithFallbackOptions): WithFallbackOptions | undefined => {
      if (!options) {
        const merged = applyMetadata(undefined);
        return merged ? { metadata: merged } : undefined;
      }
      const { metadata, ...rest } = options;
      const merged = applyMetadata(metadata);
      return merged ? { ...rest, metadata: merged } : { ...rest };
    };

    const mapRetryOptions = (options?: RetryOptions): RetryOptions | undefined => {
      if (!options) {
        const merged = applyMetadata(undefined);
        return merged ? { metadata: merged } : undefined;
      }
      const { metadata, ...rest } = options;
      const merged = applyMetadata(metadata);
      return merged ? { ...rest, metadata: merged } : { ...rest };
    };

    return {
      context,
      handle: (error, metadata) => this.handle(error, context, applyMetadata(metadata)),
      handleAsync: <T>(promise: Promise<T>, options?: AsyncErrorOptions<T>) =>
        this.handleAsync(promise, context, mapAsyncOptions(options ?? {})),
      capture: <T>(fn: () => T, metadata?: ErrorMetadata) =>
        this.capture(fn, context, applyMetadata(metadata)),
      captureAsync: <T>(fn: () => Promise<T>, metadata?: ErrorMetadata) =>
        this.captureAsync(fn, context, applyMetadata(metadata)),
      withFallback: <T>(
        fn: () => T,
        fallback: T,
        options?: boolean | WithFallbackOptions
      ) => {
        if (typeof options === 'boolean') {
          const mapped = mapFallbackOptions();
          return this.withFallback(fn, fallback, context, options, mapped?.metadata);
        }
        const mapped = mapFallbackOptions(options);
        return mapped
          ? this.withFallback(fn, fallback, context, mapped)
          : this.withFallback(fn, fallback, context);
      },
      withFallbackAsync: <T>(
        fn: () => Promise<T>,
        fallback: T,
        options?: boolean | WithFallbackOptions
      ) => {
        if (typeof options === 'boolean') {
          const mapped = mapFallbackOptions();
          return this.withFallbackAsync(fn, fallback, context, options, mapped?.metadata);
        }
        const mapped = mapFallbackOptions(options);
        return mapped
          ? this.withFallbackAsync(fn, fallback, context, mapped)
          : this.withFallbackAsync(fn, fallback, context);
      },
      retry: <T>(fn: () => Promise<T>, options?: RetryOptions) =>
        this.retry(fn, context, mapRetryOptions(options)),
      child: (segment: string, metadata?: ErrorMetadata) =>
        this.scope(
          this.formatContext(context, segment),
          applyMetadata(metadata)
        )
    };
  }

  static formatContext(...segments: Array<string | number | null | undefined>): string {
    const trimmed = segments
      .flat()
      .filter((segment): segment is string | number => segment !== undefined && segment !== null && `${segment}`.trim().length > 0)
      .map(segment => `${segment}`.trim());

    return trimmed.join('::');
  }

  private static normalizeError(error: unknown, context: string): TemplumError {
    if (isTemplumError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return createTemplumError(
        `${context}: ${error.message}`,
        error.name || 'UNHANDLED_ERROR',
        'runtime',
        { stack: error.stack, context }
      );
    }

    return createTemplumError(
      `${context}: ${String(error)}`,
      'UNKNOWN_ERROR',
      'runtime',
      { context, originalValue: error }
    );
  }
}

export const handle = ErrorHandler.handle.bind(ErrorHandler);
export const handleError = ErrorHandler.handle.bind(ErrorHandler);
export const handleAsync = ErrorHandler.handleAsync.bind(ErrorHandler);
export const wrap = ErrorHandler.wrap.bind(ErrorHandler);
export const wrapAsync = ErrorHandler.wrapAsync.bind(ErrorHandler);
export const withFallback = ErrorHandler.withFallback.bind(ErrorHandler);
export const withFallbackAsync = ErrorHandler.withFallbackAsync.bind(ErrorHandler);
export const retry = ErrorHandler.retry.bind(ErrorHandler);
export const capture = ErrorHandler.capture.bind(ErrorHandler);
export const captureAsync = ErrorHandler.captureAsync.bind(ErrorHandler);
export const scope = ErrorHandler.scope.bind(ErrorHandler);
export const formatContext = ErrorHandler.formatContext.bind(ErrorHandler);
export const buildTemplumError = createTemplumError;
