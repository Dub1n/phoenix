import { createLogger, Logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

type AnyFunction = (...args: any[]) => any;

export class AsyncUtils {
  private static logger: Logger = createLogger('async-utils');
  private static activeTimeouts: Set<NodeJS.Timeout> = new Set();
  private static activeIntervals: Set<NodeJS.Timeout> = new Set();

  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutError?: Error
  ): Promise<T> {
    if (timeoutMs <= 0) {
      return promise;
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.activeTimeouts.delete(timer);
        const error = timeoutError ?? new Error(`Operation timed out after ${timeoutMs}ms`);
        reject(error);
      }, timeoutMs);

      this.activeTimeouts.add(timer);

      promise
        .then(result => {
          clearTimeout(timer);
          this.activeTimeouts.delete(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          this.activeTimeouts.delete(timer);
          reject(error);
        });
    });
  }

  static async retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
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

        if (onRetry) {
          onRetry(error, attempt, delay);
        }

        this.logger.warn('Retrying async operation', {
          attempt,
          maxAttempts,
          delayMs: Math.round(delay),
          error: error instanceof Error ? error.message : String(error)
        });

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        this.activeTimeouts.delete(timer);
        resolve();
      }, ms);
      this.activeTimeouts.add(timer);
    });
  }

  static debounce<T extends AnyFunction>(fn: T, delayMs: number): T {
    let timeout: NodeJS.Timeout | undefined;

    const debounced = ((...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
        this.activeTimeouts.delete(timeout);
      }

      timeout = setTimeout(() => {
        this.activeTimeouts.delete(timeout!);
        timeout = undefined;
        fn(...args);
      }, delayMs);

      this.activeTimeouts.add(timeout);
    }) as T;

    return debounced;
  }

  static throttle<T extends AnyFunction>(fn: T, limitMs: number): T {
    let lastExecution = 0;
    let timeout: NodeJS.Timeout | undefined;
    let pendingArgs: Parameters<T> | null = null;

    const throttled = ((...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastExecution;
      pendingArgs = args;

      if (elapsed >= limitMs) {
        lastExecution = now;
        pendingArgs = null;
        fn(...args);
        return;
      }

      if (!timeout) {
        const remaining = limitMs - elapsed;
        timeout = setTimeout(() => {
          this.activeTimeouts.delete(timeout!);
          timeout = undefined;
          lastExecution = Date.now();
          if (pendingArgs) {
            const toRun = pendingArgs;
            pendingArgs = null;
            fn(...toRun);
          }
        }, remaining);
        this.activeTimeouts.add(timeout);
      }
    }) as T;

    return throttled;
  }

  static createInterval(
    handler: () => void | Promise<void>,
    intervalMs: number,
    options: { immediate?: boolean; unref?: boolean } = {}
  ): { stop: () => void; ref: () => void; unref: () => void } {
    const { immediate = false, unref = false } = options;

    const invokeHandler = async () => {
      try {
        await handler();
      } catch (error) {
        this.logger.error('Managed interval handler failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    if (immediate) {
      void invokeHandler();
    }

    const interval = setInterval(() => {
      void invokeHandler();
    }, intervalMs);

    if (unref && typeof interval.unref === 'function') {
      interval.unref();
    }

    this.activeIntervals.add(interval);

    return {
      stop: () => {
        clearInterval(interval);
        this.activeIntervals.delete(interval);
      },
      ref: () => {
        interval.ref?.();
      },
      unref: () => {
        interval.unref?.();
      }
    };
  }

  static async raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutError?: Error): Promise<T> {
    return this.withTimeout(promise, timeoutMs, timeoutError);
  }

  static async allWithTimeout<T>(promises: Promise<T>[], timeoutMs: number): Promise<T[]> {
    return Promise.all(promises.map(promise => this.withTimeout(promise, timeoutMs)));
  }

  static async delay<T>(fn: () => T | Promise<T>, delayMs: number): Promise<T> {
    await this.sleep(delayMs);
    return fn();
  }

  static cleanup(): void {
    for (const timeout of this.activeTimeouts) {
      clearTimeout(timeout);
    }
    this.activeTimeouts.clear();

    for (const interval of this.activeIntervals) {
      clearInterval(interval);
    }
    this.activeIntervals.clear();
    this.logger.debug('Cleared active timeouts and intervals');
  }
}

export const {
  withTimeout,
  retry,
  sleep,
  debounce,
  throttle,
  createInterval,
  raceWithTimeout,
  allWithTimeout,
  delay,
  cleanup
} = AsyncUtils;

export const TIMEOUTS = Object.freeze({
  FAST: 1000,
  NORMAL: 5000,
  SLOW: 15000,
  VERY_SLOW: 30000
});

export const cleanupTimeouts = AsyncUtils.cleanup.bind(AsyncUtils);

