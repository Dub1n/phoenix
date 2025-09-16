import path from 'path';
import { createLogger, Logger } from './logger';
import { ErrorHandler } from './error-handler';
import { UniversalSkinDefinition } from '../types/universal-skin-definition';

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: string[];
  value?: T;
}

export interface SchemaProperty {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  allowEmpty?: boolean;
  pattern?: RegExp;
  enum?: unknown[];
  validator?: (value: unknown) => boolean | string;
}

export type Schema<T = Record<string, unknown>> = {
  [K in keyof T]?: SchemaProperty;
} & {
  required?: (keyof T)[];
};

export interface PortValidationOptions {
  min?: number;
  max?: number;
}

export interface UrlValidationOptions {
  protocols?: string[];
  requireHost?: boolean;
}

export interface PathValidationOptions {
  allowRelative?: boolean;
  baseDir?: string;
  extensionWhitelist?: string[];
}

type ValidatorFn<T> = (value: T) => ValidationResult<T>;

export class Validator {
  private static logger: Logger = createLogger('validator');

  static isValidPort(port: number, options: PortValidationOptions = {}): boolean {
    return this.port(port, options).isValid;
  }

  static port(port: number, options: PortValidationOptions = {}): ValidationResult<number> {
    const { min = 1024, max = 65535 } = options;

    if (!Number.isInteger(port)) {
      return this.fail(`Port ${port} must be an integer.`);
    }
    if (port < min || port > max) {
      return this.fail(`Port ${port} must be between ${min} and ${max}.`);
    }
    return this.success(port);
  }

  static isValidUrl(url: string, options: UrlValidationOptions = {}): boolean {
    return this.url(url, options).isValid;
  }

  static url(url: string, options: UrlValidationOptions = {}): ValidationResult<string> {
    const { protocols = ['http', 'https'], requireHost = true } = options;
    try {
      const parsed = new URL(url);
      const protocol = parsed.protocol.replace(':', '');
      if (!protocols.includes(protocol)) {
        return this.fail(`Protocol '${protocol}' is not allowed. Allowed: ${protocols.join(', ')}`);
      }
      if (requireHost && !parsed.hostname) {
        return this.fail('URL must include a hostname.');
      }
      return this.success(url);
    } catch (error) {
      this.logger.warn('URL validation failed', { url, error: error instanceof Error ? error.message : error });
      return this.fail(`Invalid URL: ${url}`);
    }
  }

  static isValidPath(value: string, options: PathValidationOptions = {}): boolean {
    return this.path(value, options).isValid;
  }

  static path(value: string, options: PathValidationOptions = {}): ValidationResult<string> {
    if (!value || typeof value !== 'string') {
      return this.fail('Path must be a non-empty string.');
    }

    const normalized = path.normalize(value);

    if (!options.allowRelative && !path.isAbsolute(normalized)) {
      return this.fail('Path must be absolute.');
    }

    if (options.baseDir) {
      const base = path.resolve(options.baseDir);
      const resolved = path.resolve(normalized);
      if (!resolved.startsWith(base)) {
        return this.fail(`Path must be within base directory ${base}.`);
      }
    }

    if (options.extensionWhitelist && options.extensionWhitelist.length > 0) {
      const ext = path.extname(normalized).toLowerCase();
      if (ext && !options.extensionWhitelist.includes(ext)) {
        return this.fail(`Extension '${ext}' not allowed. Allowed: ${options.extensionWhitelist.join(', ')}`);
      }
    }

    return this.success(normalized);
  }

  static isValidSkinDefinition(value: unknown): value is UniversalSkinDefinition {
    return this.skinDefinition(value).isValid;
  }

  static skinDefinition(value: unknown): ValidationResult<UniversalSkinDefinition> {
    if (typeof value !== 'object' || value === null) {
      return this.fail('Skin definition must be an object.');
    }

    const skin = value as UniversalSkinDefinition;

    const missing = ['id', 'name', 'version']
      .filter(key => !(skin as Record<string, unknown>)[key]);

    if (missing.length > 0) {
      return this.fail(`Skin definition missing required fields: ${missing.join(', ')}.`);
    }

    if (typeof skin.metadata !== 'object' || skin.metadata === null) {
      return this.fail('Skin metadata is required.');
    }

    const metadataRequired: Array<keyof UniversalSkinDefinition['metadata']> = [
      'backend',
      'backendService',
      'compatibleInterfaces'
    ];

    const metadataMissing = metadataRequired.filter(key => !(skin.metadata as Record<string, unknown>)[key]);
    if (metadataMissing.length > 0) {
      return this.fail(`Skin metadata missing fields: ${metadataMissing.join(', ')}.`);
    }

    if (!Array.isArray(skin.metadata.compatibleInterfaces) || skin.metadata.compatibleInterfaces.length === 0) {
      return this.fail('Skin must define at least one compatible interface.');
    }

    return this.success(skin);
  }

  static validateSchema<T>(data: unknown, schema: Schema<T>): ValidationResult<T> {
    if (typeof data !== 'object' || data === null) {
      return this.fail('Schema validation requires an object.');
    }

    const errors: string[] = [];
    const payload = data as Record<string, unknown>;

    const requiredFields = schema.required ?? [];
    for (const field of requiredFields) {
      if (!(field in payload)) {
        errors.push(`Missing required field '${String(field)}'.`);
      }
    }

    for (const [key, rule] of Object.entries<SchemaProperty>(schema)) {
      if (key === 'required') continue;
      const value = payload[key];

      if (value === undefined || value === null) {
        if (rule.required) {
          errors.push(`Missing required field '${key}'.`);
        }
        continue;
      }

      if (!rule.allowEmpty && typeof value === 'string' && value.trim().length === 0) {
        errors.push(`Field '${key}' cannot be empty.`);
      }

      if (rule.type) {
        if (rule.type === 'array' && !Array.isArray(value)) {
          errors.push(`Field '${key}' must be an array.`);
        } else if (rule.type !== 'array' && typeof value !== rule.type) {
          errors.push(`Field '${key}' must be of type ${rule.type}.`);
        }
      }

      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`Field '${key}' does not match required pattern.`);
      }

      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`Field '${key}' must be one of: ${rule.enum.join(', ')}.`);
      }

      if (rule.validator) {
        const result = rule.validator(value);
        if (result === false) {
          errors.push(`Field '${key}' failed custom validation.`);
        } else if (typeof result === 'string') {
          errors.push(result);
        }
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [], value: data as T };
  }

  static chain(): ValidatorChain {
    return new ValidatorChain();
  }

  static all<T>(...validators: Array<ValidatorFn<T>>): ValidatorFn<T> {
    return (value: T) => {
      const errors: string[] = [];
      let currentValue: T = value;

      for (const validator of validators) {
        const result = validator(currentValue);
        if (!result.isValid) {
          errors.push(...result.errors);
        } else if (result.value !== undefined) {
          currentValue = result.value as T;
        }
      }

      if (errors.length > 0) {
        return { isValid: false, errors };
      }
      return { isValid: true, errors: [], value: currentValue };
    };
  }

  static any<T>(...validators: Array<ValidatorFn<T>>): ValidatorFn<T> {
    return (value: T) => {
      const collectedErrors: string[] = [];
      for (const validator of validators) {
        const result = validator(value);
        if (result.isValid) {
          return result;
        }
        collectedErrors.push(...result.errors);
      }
      return { isValid: false, errors: collectedErrors };
    };
  }

  private static fail<T>(message: string): ValidationResult<T> {
    this.logger.warn(message);
    return { isValid: false, errors: [message] };
  }

  private static success<T>(value: T): ValidationResult<T> {
    return { isValid: true, errors: [], value };
  }
}

export class ValidatorChain {
  private readonly results: string[] = [];
  private valid = true;

  port(value: number, options?: PortValidationOptions): this {
    return this.apply(Validator.port(value, options));
  }

  url(value: string, options?: UrlValidationOptions): this {
    return this.apply(Validator.url(value, options));
  }

  path(value: string, options?: PathValidationOptions): this {
    return this.apply(Validator.path(value, options));
  }

  schema<T>(data: unknown, schema: Schema<T>): this {
    return this.apply(Validator.validateSchema(data, schema));
  }

  custom(result: ValidationResult | boolean | string, message?: string): this {
    if (typeof result === 'boolean') {
      if (!result) {
        this.valid = false;
        if (message) {
          this.results.push(message);
        }
      }
      return this;
    }

    if (typeof result === 'string') {
      this.valid = false;
      this.results.push(result);
      return this;
    }

    return this.apply(result);
  }

  validate(): ValidationResult {
    return { isValid: this.valid, errors: [...this.results] };
  }

  assert(context = 'validation'): void {
    const result = this.validate();
    if (!result.isValid) {
      const errorMessage = `Validation failed: ${result.errors.join('; ')}`;
      throw ErrorHandler.handle(new Error(errorMessage), context, { errors: result.errors });
    }
  }

  private apply(result: ValidationResult): this {
    if (!result.isValid) {
      this.valid = false;
      this.results.push(...result.errors);
    }
    return this;
  }
}

export const {
  isValidPort,
  port: validatePort,
  isValidUrl,
  url: validateUrl,
  isValidPath,
  path: validatePath,
  isValidSkinDefinition,
  skinDefinition: validateSkinDefinition,
  validateSchema,
  chain,
  all,
  any
} = Validator;

