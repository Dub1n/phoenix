import { createLogger } from './logger';
import { ErrorHandler } from './error-handler';
import { createTemplumError, TemplumError } from '../types/templum-types';

type JsonReplacer = (this: unknown, key: string, value: unknown) => unknown;
type JsonReviver = (this: unknown, key: string, value: unknown) => unknown;

type SafeParseResult<T> = { success: true; data: T } | { success: false; error: unknown };

type PlainObject = Record<string, unknown>;

export type SerializationStatus = 'success' | 'defaults' | 'fallback' | 'error';

export interface SerializationMeta {
  context: string;
  bytes: number;
  durationMs: number;
  warnings: string[];
  maskedFields: string[];
}

export interface SerializationOutcome<T> {
  ok: boolean;
  status: SerializationStatus;
  value?: T;
  error?: TemplumError;
  meta: SerializationMeta;
}

export interface JsonStringifyOptions {
  context?: string;
  pretty?: boolean | number;
  maxBytes?: number;
  maskFields?: string[];
  fallback?: string;
  replacer?: JsonReplacer;
}

export interface JsonParseOptions<T> {
  context?: string;
  schema?: JsonSchema<T>;
  defaults?: Partial<T>;
  fallback?: T;
  reviver?: JsonReviver;
  maxBytes?: number;
}

export interface JsonSchema<T> {
  parse(data: unknown): T;
  safeParse?(data: unknown): { success: boolean; data?: T; error?: unknown };
}

const logger = createLogger('serialization-utils');

class JsonStringifyBuilder<T> {
  private readonly maskedFieldsUsed = new Set<string>();

  constructor(
    private readonly value: T,
    private readonly options: JsonStringifyOptions = {}
  ) {}

  context(context: string): this {
    this.options.context = context;
    return this;
  }

  pretty(space: number = 2): this {
    this.options.pretty = space;
    return this;
  }

  maxBytes(limit: number): this {
    this.options.maxBytes = limit;
    return this;
  }

  mask(fields: string[] | string): this {
    const list = Array.isArray(fields) ? fields : [fields];
    const existing = new Set(this.options.maskFields ?? []);
    list.forEach(field => existing.add(field));
    this.options.maskFields = Array.from(existing);
    return this;
  }

  fallback(value: string): this {
    this.options.fallback = value;
    return this;
  }

  replacer(replacer: JsonReplacer): this {
    this.options.replacer = replacer;
    return this;
  }

  stringify(): SerializationOutcome<string> {
    const context = this.options.context ?? 'serialization.json.stringify';
    const meta: SerializationMeta = {
      context,
      bytes: 0,
      durationMs: 0,
      warnings: [],
      maskedFields: []
    };
    const start = Date.now();

    try {
      const replacer = this.createReplacer();
      const space = this.resolveSpace();
      const serialized = JSON.stringify(this.value, replacer, space);

      meta.bytes = Buffer.byteLength(serialized, 'utf8');
      meta.durationMs = Date.now() - start;
      meta.maskedFields = Array.from(this.maskedFieldsUsed);

      if (this.options.maxBytes && meta.bytes > this.options.maxBytes) {
        const templumError = createTemplumError(
          `Serialized payload exceeded ${this.options.maxBytes} bytes`,
          'SERIALIZATION_SIZE_LIMIT_EXCEEDED',
          'validation',
          { bytes: meta.bytes, limit: this.options.maxBytes, context }
        );
        throw templumError;
      }

      return {
        ok: true,
        status: 'success',
        value: serialized,
        meta
      };
    } catch (error) {
      const templumError = ErrorHandler.handle(error, context, {
        maskFields: this.options.maskFields,
        maxBytes: this.options.maxBytes
      });

      meta.durationMs = Date.now() - start;
      meta.maskedFields = Array.from(this.maskedFieldsUsed);

      if (this.options.fallback !== undefined) {
        logger.warn(`${context}: serialization failed, using fallback`, {
          error: templumError.message
        });
        meta.warnings.push('Serialization failed; using fallback value');
        return {
          ok: true,
          status: 'fallback',
          value: this.options.fallback,
          error: templumError,
          meta
        };
      }

      return {
        ok: false,
        status: 'error',
        error: templumError,
        meta
      };
    }
  }

  private resolveSpace(): number | undefined {
    const { pretty } = this.options;
    if (typeof pretty === 'number') {
      return pretty;
    }
    if (pretty) {
      return 2;
    }
    return undefined;
  }

  private createReplacer(): JsonReplacer {
    const seen = new WeakSet<object>();
    const maskFields = new Set(this.options.maskFields ?? []);
    const delegate = this.options.replacer;

    return (key: string, value: unknown) => {
      const candidate = delegate ? delegate.call(this.value, key, value) : value;

      if (candidate && typeof candidate === 'object') {
        const target = candidate as object;
        if (seen.has(target)) {
          return '[Circular]';
        }
        seen.add(target);
      }

      if (maskFields.size && maskFields.has(key)) {
        this.maskedFieldsUsed.add(key);
        return '[masked]';
      }

      return candidate;
    };
  }
}

class JsonParseBuilder<T> {
  constructor(
    private readonly input: string,
    private readonly options: JsonParseOptions<T> = {}
  ) {}

  context(context: string): this {
    this.options.context = context;
    return this;
  }

  withSchema(schema: JsonSchema<T>): this {
    this.options.schema = schema;
    return this;
  }

  withDefaults(defaults: Partial<T>): this {
    this.options.defaults = defaults;
    return this;
  }

  fallback(value: T): this {
    this.options.fallback = value;
    return this;
  }

  reviver(reviver: JsonReviver): this {
    this.options.reviver = reviver;
    return this;
  }

  maxBytes(limit: number): this {
    this.options.maxBytes = limit;
    return this;
  }

  parse(): SerializationOutcome<T> {
    const context = this.options.context ?? 'serialization.json.parse';
    const meta: SerializationMeta = {
      context,
      bytes: Buffer.byteLength(this.input, 'utf8'),
      durationMs: 0,
      warnings: [],
      maskedFields: []
    };
    const start = Date.now();

    try {
      if (this.options.maxBytes && meta.bytes > this.options.maxBytes) {
        const templumError = createTemplumError(
          `JSON input exceeded ${this.options.maxBytes} bytes`,
          'SERIALIZATION_INPUT_TOO_LARGE',
          'validation',
          { bytes: meta.bytes, maxBytes: this.options.maxBytes, context }
        );
        throw templumError;
      }

      const parsed = JSON.parse(this.input, this.options.reviver);
      return this.validateAndFinalize(parsed as T, meta, start, context);
    } catch (error) {
      const templumError = ErrorHandler.handle(error, context, { bytes: meta.bytes });
      meta.durationMs = Date.now() - start;

      if (this.options.fallback !== undefined) {
        logger.warn(`${context}: parse failed, using fallback`, {
          error: templumError.message
        });
        meta.warnings.push('Failed to parse JSON; using fallback value');
        return {
          ok: true,
          status: 'fallback',
          value: this.options.fallback,
          error: templumError,
          meta
        };
      }

      return {
        ok: false,
        status: 'error',
        error: templumError,
        meta
      };
    }
  }

  private validateAndFinalize(
    value: T,
    meta: SerializationMeta,
    start: number,
    context: string
  ): SerializationOutcome<T> {
    let status: SerializationStatus = 'success';
    let error: TemplumError | undefined;

    if (this.options.schema) {
      const result = safeParse(this.options.schema, value);
      if (result.success) {
        value = result.data;
      } else {
        const issues = extractIssues(result.error);
        error = createTemplumError(
          `${context}: schema validation failed`,
          'SERIALIZATION_SCHEMA_INVALID',
          'validation',
          { issues }
        );

        if (this.options.defaults) {
          logger.warn(`${context}: schema validation failed, applying defaults`, { issues });
          meta.warnings.push('Schema validation failed; applied defaults');
          value = mergeWithDefaults(this.options.defaults, value);
          status = 'defaults';
        } else if (this.options.fallback !== undefined) {
          logger.warn(`${context}: schema validation failed, using fallback`, { issues });
          meta.warnings.push('Schema validation failed; using fallback value');
          value = this.options.fallback;
          status = 'fallback';
        } else {
          meta.durationMs = Date.now() - start;
          return {
            ok: false,
            status: 'error',
            error,
            meta
          };
        }
      }
    } else if (this.options.defaults) {
      value = mergeWithDefaults(this.options.defaults, value);
      status = 'defaults';
    }

    meta.durationMs = Date.now() - start;

    const ok = status === 'success' || status === 'defaults' || status === 'fallback';

    return {
      ok,
      status,
      value,
      error,
      meta
    };
  }
}

function safeParse<T>(schema: JsonSchema<T>, data: unknown): SafeParseResult<T> {
  if (typeof schema.safeParse === 'function') {
    const result = schema.safeParse(data);
    if (result && typeof result === 'object' && 'success' in result) {
      if ((result as { success: boolean }).success) {
        return { success: true, data: (result as { data: T }).data };
      }
      return { success: false, error: (result as { error: unknown }).error };
    }
  }

  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    return { success: false, error };
  }
}

function extractIssues(error: unknown): string[] {
  if (!error) {
    return [];
  }
  if (Array.isArray((error as any).issues)) {
    return (error as any).issues.map((issue: any) => {
      if (issue && typeof issue === 'object') {
        const path = Array.isArray(issue.path) ? issue.path.join('.') : undefined;
        const message = issue.message ?? String(issue);
        return path ? `${path}: ${message}` : message;
      }
      return String(issue);
    });
  }
  if (error instanceof Error) {
    return [error.message];
  }
  return [String(error)];
}

function mergeWithDefaults<T>(defaults: Partial<T>, value: unknown): T {
  return mergeAny(defaults, value) as T;
}

function mergeAny(defaults: unknown, value: unknown): unknown {
  if (isPlainObject(defaults) && isPlainObject(value)) {
    const result: PlainObject = { ...(defaults as PlainObject) };
    const valueObject = value as PlainObject;

    for (const [key, currentValue] of Object.entries(valueObject)) {
      const defaultValue = (defaults as PlainObject)[key];
      result[key] = mergeAny(defaultValue, currentValue);
    }

    return result;
  }

  if (value === undefined || value === null) {
    return defaults;
  }

  return value;
}

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(
    value && typeof value === 'object' && !Array.isArray(value)
  );
}

export const serialization = {
  json<T>(value: T, options?: JsonStringifyOptions): JsonStringifyBuilder<T> {
    return new JsonStringifyBuilder(value, options);
  },
  fromJson<T>(input: string, options?: JsonParseOptions<T>): JsonParseBuilder<T> {
    return new JsonParseBuilder<T>(input, options);
  }
};

export type { JsonReplacer, JsonReviver };
