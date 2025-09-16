import {
  createTemplumError,
  isTemplumError,
  TemplumError
} from '../types/templum-types';

export interface PropertyValidationResult {
  exists: boolean;
  confidence: number;
  issues: string[];
  value?: unknown;
}

export interface PropertyValidationOptions {
  required?: boolean;
  allowUndefined?: boolean;
  allowNull?: boolean;
  typeGuard?: (value: unknown) => boolean;
  customValidator?: (value: unknown) => boolean;
}

export const TypeGuards = {
  isString(value: unknown): value is string {
    return typeof value === 'string';
  },
  isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  },
  isNumber(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
  },
  isPositiveNumber(value: unknown): value is number {
    return TypeGuards.isNumber(value) && value > 0;
  },
  isNonNegativeNumber(value: unknown): value is number {
    return TypeGuards.isNumber(value) && value >= 0;
  },
  isInteger(value: unknown): value is number {
    return TypeGuards.isNumber(value) && Number.isInteger(value);
  },
  isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  },
  isFunction(value: unknown): value is (...args: any[]) => unknown {
    return typeof value === 'function';
  },
  isUndefined(value: unknown): value is undefined {
    return typeof value === 'undefined';
  },
  isNull(value: unknown): value is null {
    return value === null;
  },
  isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  },
  isEmptyArray(value: unknown): value is [] {
    return Array.isArray(value) && value.length === 0;
  },
  isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },
  isEmptyObject(value: unknown): value is Record<string, never> {
    return TypeGuards.isObject(value) && Object.keys(value).length === 0;
  }
};

export class TypeValidators {
  static isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
    return TypeGuards.isArray(value) && value.every(guard);
  }

  static matchesShape<T extends Record<string, unknown>>(
    value: unknown,
    validator: (candidate: Record<string, unknown>) => candidate is T
  ): value is T {
    return TypeGuards.isObject(value) && validator(value);
  }

  static isInstanceOf<T>(value: unknown, ctor: new (...args: any[]) => T): value is T {
    return value instanceof ctor;
  }

  static isOneOf<T1, T2>(
    value: unknown,
    guard1: (candidate: unknown) => candidate is T1,
    guard2: (candidate: unknown) => candidate is T2
  ): value is T1 | T2 {
    return guard1(value) || guard2(value);
  }
}

export class PropertyGuards {
  static validateProperty(
    obj: unknown,
    propertyPath: string,
    options: PropertyValidationOptions = {}
  ): PropertyValidationResult {
    const result: PropertyValidationResult = {
      exists: false,
      confidence: 0,
      issues: []
    };

    if (!TypeGuards.isObject(obj)) {
      result.issues.push('Target is not an object');
      return result;
    }

    const parts = propertyPath.split('.');
    let current: any = obj;
    let path = '';

    for (const segment of parts) {
      path = path ? `${path}.${segment}` : segment;

      if (!TypeGuards.isObject(current)) {
        result.issues.push(`Path '${path}' is not navigable`);
        return result;
      }

      if (!(segment in current)) {
        if (options.required) {
          result.issues.push(`Required property '${path}' is missing`);
        }
        return result;
      }

      current = current[segment];
    }

    result.exists = true;
    result.value = current;
    result.confidence = 90;

    if (options.typeGuard && !options.typeGuard(current)) {
      result.confidence -= 30;
      result.issues.push(`Property '${propertyPath}' failed type validation`);
    }

    if (options.customValidator && !options.customValidator(current)) {
      result.confidence -= 20;
      result.issues.push(`Property '${propertyPath}' failed custom validation`);
    }

    if (current === null && options.allowNull === false) {
      result.confidence -= 25;
      result.issues.push(`Property '${propertyPath}' is null but not allowed`);
    }

    if (current === undefined && options.allowUndefined === false) {
      result.confidence -= 25;
      result.issues.push(`Property '${propertyPath}' is undefined but not allowed`);
    }

    return result;
  }

  static validateProperties(
    obj: unknown,
    specs: Record<string, PropertyValidationOptions>
  ): { allValid: boolean; overallConfidence: number; results: Record<string, PropertyValidationResult> } {
    const results: Record<string, PropertyValidationResult> = {};
    let totalConfidence = 0;
    let validCount = 0;

    for (const [property, options] of Object.entries(specs)) {
      const result = this.validateProperty(obj, property, options);
      results[property] = result;
      if (result.exists && result.confidence > 50) {
        totalConfidence += result.confidence;
        validCount += 1;
      }
    }

    const overallConfidence = validCount > 0 ? totalConfidence / validCount : 0;
    const allValid = Object.values(results).every(r => r.exists && r.confidence > 50);

    return { allValid, overallConfidence, results };
  }
}

export class SemanticValidators {
  static hasRequiredProperties<T extends Record<string, unknown>>(
    obj: unknown,
    required: (keyof T)[]
  ): obj is T {
    if (!TypeGuards.isObject(obj)) {
      return false;
    }

    return required.every(property => {
      const result = PropertyGuards.validateProperty(obj, String(property), {
        required: true,
        allowNull: false,
        allowUndefined: false
      });
      return result.exists && result.confidence >= 80;
    });
  }

  static isValidStructure<T>(
    obj: unknown,
    validator: (candidate: Record<string, unknown>) => candidate is T
  ): obj is T {
    return TypeGuards.isObject(obj) && validator(obj);
  }

  static isValidConfiguration(obj: unknown): PropertyValidationResult {
    return PropertyGuards.validateProperty(obj, 'type', {
      required: true,
      typeGuard: TypeGuards.isNonEmptyString,
      allowUndefined: false,
      allowNull: false
    });
  }

  static isValidAPIResponse(obj: unknown): boolean {
    const validation = PropertyGuards.validateProperties(obj, {
      success: { required: true, typeGuard: TypeGuards.isBoolean },
      data: { allowUndefined: true },
      error: { allowUndefined: true }
    });

    return validation.allValid && validation.overallConfidence >= 75;
  }
}

export class TypeAssertions {
  static assertWithConfidence<T>(
    value: unknown,
    guard: (candidate: unknown) => candidate is T,
    errorMessage: string,
    minimumConfidence = 90
  ): asserts value is T {
    if (!guard(value)) {
      throw createTemplumError(
        `Type assertion failed: ${errorMessage}`,
        'TypeValidationError',
        'validation'
      );
    }
    if (minimumConfidence > 100 || minimumConfidence < 0) {
      throw new Error('Invalid confidence threshold supplied');
    }
  }

  static assertPropertyExists(
    obj: unknown,
    propertyPath: string,
    options: PropertyValidationOptions = {}
  ): asserts obj is Record<string, unknown> {
    const result = PropertyGuards.validateProperty(obj, propertyPath, {
      required: true,
      ...options
    });

    if (!result.exists || result.confidence < 80) {
      const issues = result.issues.join('; ') || 'Unknown issue';
      throw createTemplumError(
        `Property assertion failed for '${propertyPath}': ${issues}`,
        'PropertyValidationError',
        'validation'
      );
    }
  }

  static safeCast<T>(value: unknown, guard: (candidate: unknown) => candidate is T, fallback: T): T {
    return guard(value) ? value : fallback;
  }

  static narrowType<T>(value: unknown, guard: (candidate: unknown) => candidate is T, context: string): T {
    if (!guard(value)) {
      throw createTemplumError(
        `Type narrowing failed in context: ${context}`,
        'TypeNarrowingError',
        'validation'
      );
    }
    return value;
  }
}

export class PerformanceTypeGuards {
  private static typeCache = new Map<string, boolean>();

  static cachedTypeCheck(value: unknown, typeName: string, validator: () => boolean): boolean {
    const key = `${typeName}:${typeof value}`;
    if (this.typeCache.has(key)) {
      return this.typeCache.get(key)!;
    }
    const result = validator();
    this.typeCache.set(key, result);
    return result;
  }

  static bulkValidate<T>(
    values: unknown[],
    guard: (candidate: unknown) => candidate is T
  ): { valid: T[]; invalid: unknown[]; stats: { validCount: number; invalidCount: number; confidence: number } } {
    const valid: T[] = [];
    const invalid: unknown[] = [];

    for (const value of values) {
      if (guard(value)) {
        valid.push(value);
      } else {
        invalid.push(value);
      }
    }

    const confidence = values.length > 0 ? (valid.length / values.length) * 100 : 0;

    return {
      valid,
      invalid,
      stats: {
        validCount: valid.length,
        invalidCount: invalid.length,
        confidence
      }
    };
  }

  static clearCache(): void {
    this.typeCache.clear();
  }
}

export class TypeGuardErrorHandlers {
  static handleValidationError(error: unknown, context: string): TemplumError {
    const base = `Type validation failed in ${context}`;

    if (isTemplumError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return createTemplumError(`${base}: ${error.message}`, 'TypeValidationError', 'validation');
    }

    return createTemplumError(`${base}: Unknown error`, 'TypeValidationError', 'validation');
  }

  static safeValidate<T>(
    value: unknown,
    guard: (candidate: unknown) => candidate is T,
    context: string
  ): { success: boolean; result?: T; error?: TemplumError } {
    try {
      if (guard(value)) {
        return { success: true, result: value };
      }

      return {
        success: false,
        error: createTemplumError(
          `Type validation failed for ${context}`,
          'TypeValidationError',
          'validation'
        )
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleValidationError(error, context)
      };
    }
  }
}

export const typeGuards = TypeGuards;
export const typeValidators = TypeValidators;
export const propertyGuards = PropertyGuards;
export const semanticValidators = SemanticValidators;
export const typeAssertions = TypeAssertions;
export const performanceTypeGuards = PerformanceTypeGuards;
export const typeGuardErrorHandlers = TypeGuardErrorHandlers;
