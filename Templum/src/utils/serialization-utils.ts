import { performance } from 'perf_hooks';
import { createTemplumError } from '../types/templum-types';
import { handle as handleError } from './error-handler';

export type CircularRefStrategy = 'error' | 'ignore' | 'placeholder';
export type FallbackStrategy = 'default' | 'null' | 'throw';

export interface SerializationConfig {
  maxDepth: number;
  maxSize: number;
  circularRefStrategy: CircularRefStrategy;
  confidenceThreshold: number;
  fallbackStrategy: FallbackStrategy;
}

export interface SerializationMetadata {
  processingTime: number;
  dataSize: number;
  validationPassed: boolean;
}

export interface SerializationResult<T> {
  success: boolean;
  data?: T;
  error?: SerializationError;
  confidence: number;
  metadata: SerializationMetadata;
}

export interface SchemaValidator<T> {
  parse(data: unknown): T;
  safeParse?(data: unknown): { success: boolean; data?: T; error?: unknown };
}

export interface ParseOptions<T> {
  schema?: SchemaValidator<T>;
  fallback?: T;
  confidence?: number;
}

const DEFAULT_CONFIG: SerializationConfig = {
  maxDepth: 10,
  maxSize: 1024 * 1024,
  circularRefStrategy: 'placeholder',
  confidenceThreshold: 0.8,
  fallbackStrategy: 'default'
};

export class SerializationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'SerializationError';
  }
}

export class SerializationUtils {
  private static config: SerializationConfig = { ...DEFAULT_CONFIG };

  static configure(overrides: Partial<SerializationConfig>): void {
    this.config = { ...this.config, ...overrides };
  }

  static stringify(value: unknown, overrides: Partial<SerializationConfig> = {}): SerializationResult<string> {
    const config = { ...this.config, ...overrides };
    const start = performance.now();
    const seen = new WeakSet();
    let size = 0;

    try {
      const json = JSON.stringify(value, (_key, current) => {
        if (typeof current === 'object' && current !== null) {
          if (seen.has(current)) {
            return this.handleCircular(current, config);
          }
          seen.add(current);
        }

        const segment = this.estimateSize(current);
        size += segment;
        if (size > config.maxSize) {
          throw new SerializationError('Serialized content exceeds configured size limit');
        }

        return current;
      });

      return {
        success: true,
        data: json,
        confidence: 1,
        metadata: {
          processingTime: performance.now() - start,
          dataSize: size,
          validationPassed: true
        }
      };
    } catch (error) {
      const handled = this.toSerializationError(error);
      return {
        success: false,
        error: handled,
        confidence: 0,
        metadata: {
          processingTime: performance.now() - start,
          dataSize: size,
          validationPassed: false
        }
      };
    }
  }

  static parse<T = unknown>(json: string, options: ParseOptions<T> = {}): SerializationResult<T> {
    const start = performance.now();
    let size = json.length;

    try {
      const parsed = JSON.parse(json);
      this.enforceDepth(parsed, this.config.maxDepth);
      return this.validate(parsed, options, start, size);
    } catch (error) {
      const handled = this.toSerializationError(error);
      const fallback = this.resolveFallback(options.fallback, handled, options.confidence);

      return {
        success: Boolean(fallback.data),
        data: fallback.data,
        error: fallback.error ?? handled,
        confidence: fallback.confidence,
        metadata: {
          processingTime: performance.now() - start,
          dataSize: size,
          validationPassed: Boolean(fallback.data)
        }
      };
    }
  }

  static parseWithSchema<T>(json: string, schema: SchemaValidator<T>, options: ParseOptions<T> = {}): SerializationResult<T> {
    return this.parse(json, { ...options, schema });
  }

  private static validate<T>(
    parsed: unknown,
    options: ParseOptions<T>,
    start: number,
    size: number
  ): SerializationResult<T> {
    const schema = options.schema;

    if (!schema) {
      return {
        success: true,
        data: parsed as T,
        confidence: options.confidence ?? 1,
        metadata: {
          processingTime: performance.now() - start,
          dataSize: size,
          validationPassed: true
        }
      };
    }

    try {
      if (schema.safeParse) {
        const result = schema.safeParse(parsed);
        if (result.success) {
          return {
            success: true,
            data: result.data,
            confidence: 1,
            metadata: {
              processingTime: performance.now() - start,
              dataSize: size,
              validationPassed: true
            }
          };
        }

        const fallback = this.resolveFallback(options.fallback, this.toSerializationError(result.error), options.confidence);
        return {
          success: Boolean(fallback.data),
          data: fallback.data,
          error: fallback.error,
          confidence: fallback.confidence,
          metadata: {
            processingTime: performance.now() - start,
            dataSize: size,
            validationPassed: Boolean(fallback.data)
          }
        };
      }

      const value = schema.parse(parsed);
      return {
        success: true,
        data: value,
        confidence: 1,
        metadata: {
          processingTime: performance.now() - start,
          dataSize: size,
          validationPassed: true
        }
      };
    } catch (error) {
      const fallback = this.resolveFallback(options.fallback, this.toSerializationError(error), options.confidence);
      return {
        success: Boolean(fallback.data),
        data: fallback.data,
        error: fallback.error,
        confidence: fallback.confidence,
        metadata: {
          processingTime: performance.now() - start,
          dataSize: size,
          validationPassed: Boolean(fallback.data)
        }
      };
    }
  }

  private static enforceDepth(value: unknown, maxDepth: number, currentDepth = 0): void {
    if (typeof value !== 'object' || value === null) {
      return;
    }

    if (currentDepth > maxDepth) {
      throw new SerializationError('JSON depth exceeds configured limit');
    }

    for (const child of Object.values(value)) {
      this.enforceDepth(child, maxDepth, currentDepth + 1);
    }
  }

  private static handleCircular(value: unknown, config: SerializationConfig): unknown {
    switch (config.circularRefStrategy) {
      case 'ignore':
        return undefined;
      case 'error':
        throw new SerializationError('Circular reference detected');
      default:
        return '[Circular]';
    }
  }

  private static resolveFallback<T>(
    fallback: T | undefined,
    error: SerializationError,
    confidence = 0
  ): { data?: T; error?: SerializationError; confidence: number } {
    switch (this.config.fallbackStrategy) {
      case 'default':
        if (fallback !== undefined) {
          return { data: fallback, confidence: confidence || this.config.confidenceThreshold };
        }
        return { error, confidence: 0 };
      case 'null':
        return { data: null as unknown as T, confidence: confidence || 0.5 };
      case 'throw':
      default:
        handleError(error, 'serialization');
        return { error, confidence: 0 };
    }
  }

  private static toSerializationError(error: unknown): SerializationError {
    if (error instanceof SerializationError) {
      return error;
    }
    if (error instanceof Error) {
      return new SerializationError(error.message, error);
    }
    return new SerializationError('Unknown serialization error', error);
  }

  private static estimateSize(value: unknown): number {
    if (value === null || value === undefined) {
      return 4;
    }
    if (typeof value === 'string') {
      return value.length;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value).length;
    }
    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this.estimateSize(item) + 2, 2);
    }
    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).reduce((sum, [key, val]) => {
        return sum + key.length + this.estimateSize(val) + 2;
      }, 2);
    }
    return 0;
  }
}

export const { stringify, parse, parseWithSchema, configure } = SerializationUtils;
