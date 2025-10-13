import { createLogger, Logger } from './logger';
import { sleep, withTimeout as asyncWithTimeout } from './async-utils';
import {
  createTemplumError,
  isTemplumError,
  TemplumError
} from '../types/templum-types';

export interface AsyncErrorOptions<T = unknown> {
  timeout?: number;
  fallback?: T;
  swallow?: boolean;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: boolean;
  onRetry?: (context: string, error: unknown, attempt: number, delayMs: number) => void;
}

export class ErrorHandler {
  private static logger: Logger = createLogger('error-handler');

  static handle(
    error: unknown,
    context: string,
    metadata?: Record<string, unknown>
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
    const { timeout = 0, fallback, swallow = false } = options;

    try {
      if (timeout && timeout > 0) {
        return await asyncWithTimeout(promise, timeout);
      }
      return await promise;
    } catch (error) {
      const templumError = this.handle(error, context, fallback !== undefined ? { fallback } : undefined);
      if (fallback !== undefined) {
        this.logger.warn(`Using fallback for ${context}`, { fallback });
        return fallback;
      }
      if (swallow) {
        return undefined as unknown as T;
      }
      throw templumError;
    }
  }

  static wrap<T>(fn: () => T, context: string): T | null {
    try {
      return fn();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }

  static async wrapAsync<T>(fn: () => Promise<T>, context: string, fallback?: T): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      return fallback ?? null;
    }
  }

  static withFallback<T>(
    fn: () => T,
    fallback: T,
    context: string,
    logError = true
  ): T {
    try {
      return fn();
    } catch (error) {
      if (logError) {
        this.handle(error, context);
      }
      return fallback;
    }
  }

  static async withFallbackAsync<T>(
    fn: () => Promise<T>,
    fallback: T,
    context: string,
    logError = true
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (logError) {
        this.handle(error, context);
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
      onRetry
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
          error: error instanceof Error ? error.message : String(error)
        });

        if (onRetry) {
          onRetry(context, error, attempt, delay);
        }

        await sleep(delay);
      }
    }

    throw this.handle(lastError, `${context} (after ${maxAttempts} attempts)`);
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
