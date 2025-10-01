import { createTemplumError } from '../types/templum-types';

export type TypeGuard<T> = (value: unknown) => value is T;

export const TypeGuards = {
  isString(value: unknown): value is string {
    return typeof value === 'string';
  },
  isNumber(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
  },
  isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  },
  // eslint-disable-next-line @typescript-eslint/ban-types
  isFunction(value: unknown): value is Function {
    return typeof value === 'function';
  },
  isUndefined(value: unknown): value is undefined {
    return typeof value === 'undefined';
  },
  isNull(value: unknown): value is null {
    return value === null;
  },
  isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },
  isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  },
  isEmptyObject(value: unknown): value is Record<string, never> {
    return TypeGuards.isObject(value) && Object.keys(value).length === 0;
  },
  isEmptyArray(value: unknown): value is [] {
    return TypeGuards.isArray(value) && value.length === 0;
  },
  isNonEmptyString(value: unknown): value is string {
    return TypeGuards.isString(value) && value.trim().length > 0;
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
};

export class TypeValidators {
  static isArrayOf<T>(value: unknown, elementGuard: TypeGuard<T>): value is T[] {
    return TypeGuards.isArray(value) && value.every((item) => elementGuard(item));
  }

  static matchesShape<T extends Record<string, unknown>>(
    value: unknown,
    shapeValidator: (candidate: Record<string, unknown>) => candidate is T,
  ): value is T {
    return TypeGuards.isObject(value) && shapeValidator(value);
  }

  static isInstanceOf<T>(value: unknown, constructor: new (...args: any[]) => T): value is T {
    return value instanceof constructor;
  }

  static isOneOf<T1, T2>(
    value: unknown,
    guard1: TypeGuard<T1>,
    guard2: TypeGuard<T2>,
  ): value is T1 | T2 {
    return guard1(value) || guard2(value);
  }
}

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

export class PropertyGuards {
  static validateProperty(
    obj: unknown,
    propertyPath: string,
    options: PropertyValidationOptions = {},
  ): PropertyValidationResult {
    const result: PropertyValidationResult = {
      exists: false,
      confidence: 0,
      issues: [],
    };

    if (!TypeGuards.isObject(obj)) {
      result.issues.push('Target is not an object');
      return result;
    }

    const pathSegments = propertyPath.split('.');
    let current: unknown = obj;
    let traversedPath = '';

    for (const segment of pathSegments) {
      traversedPath = traversedPath ? `${traversedPath}.${segment}` : segment;

      if (!TypeGuards.isObject(current)) {
        result.issues.push(`Path '${traversedPath}' is not navigable`);
        return result;
      }

      if (!(segment in current)) {
        if (options.required) {
          result.issues.push(`Required property '${traversedPath}' is missing`);
        }
        return result;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    result.exists = true;
    result.value = current;
    result.confidence = 90;

    if (options.typeGuard && !options.typeGuard(current)) {
      result.confidence -= 60;
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

    result.confidence = Math.max(result.confidence, 0);
    return result;
  }

  static validateProperties(
    obj: unknown,
    propertySpecs: Record<string, PropertyValidationOptions>,
  ): {
    allValid: boolean;
    overallConfidence: number;
    results: Record<string, PropertyValidationResult>;
  } {
    const results: Record<string, PropertyValidationResult> = {};
    let confidenceAccumulator = 0;
    let validCount = 0;

    for (const [path, spec] of Object.entries(propertySpecs)) {
      const result = PropertyGuards.validateProperty(obj, path, spec);
      const required = spec.required === true;
      results[path] = result;

      if (!result.exists && !required) {
        confidenceAccumulator += 100;
        validCount += 1;
        continue;
      }

      if (result.exists && result.confidence > 50) {
        confidenceAccumulator += result.confidence;
        validCount += 1;
      }
    }

    const overallConfidence = validCount > 0 ? confidenceAccumulator / validCount : 0;
    const allValid = Object.entries(results).every(([path, entry]) => {
      const required = propertySpecs[path]?.required === true;
      if (!entry.exists) {
        return !required;
      }
      return entry.confidence > 50;
    });

    return { allValid, overallConfidence, results };
  }
}

export class SemanticValidators {
  static hasRequiredProperties<T extends Record<string, unknown>>(
    obj: unknown,
    requiredProps: (keyof T)[],
  ): obj is T {
    if (!TypeGuards.isObject(obj)) {
      return false;
    }

    return requiredProps.every((prop) => {
      const result = PropertyGuards.validateProperty(obj, String(prop), {
        required: true,
        allowUndefined: false,
        allowNull: false,
      });
      return result.exists && result.confidence >= 80;
    });
  }

  static isValidStructure<T extends Record<string, unknown>>(
    obj: unknown,
    validator: (candidate: Record<string, unknown>) => candidate is T,
  ): obj is T {
    return TypeGuards.isObject(obj) && validator(obj);
  }

  static isValidConfiguration(obj: unknown): PropertyValidationResult {
    return PropertyGuards.validateProperty(obj, 'type', {
      required: true,
      typeGuard: TypeGuards.isNonEmptyString,
    });
  }

  static isValidAPIResponse(obj: unknown): boolean {
    const validation = PropertyGuards.validateProperties(obj, {
      success: { required: true, typeGuard: TypeGuards.isBoolean },
      data: { required: false, allowUndefined: true },
      error: { required: false, allowUndefined: true },
    });

    return validation.allValid && validation.overallConfidence >= 75;
  }
}

export class TypeAssertions {
  static assertWithConfidence<T>(
    value: unknown,
    guard: TypeGuard<T>,
    errorMessage: string,
    minimumConfidence = 90,
  ): asserts value is T {
    if (!guard(value)) {
      throw createTemplumError(
        `Type assertion failed: ${errorMessage}`,
        'TYPE_VALIDATION_ERROR',
        'validation',
        { minimumConfidence },
      );
    }
  }

  static assertPropertyExists(
    obj: unknown,
    propertyPath: string,
    options: PropertyValidationOptions = {},
  ): asserts obj is Record<string, unknown> {
    const result = PropertyGuards.validateProperty(obj, propertyPath, {
      required: true,
      allowNull: false,
      allowUndefined: false,
      ...options,
    });

    if (!result.exists || result.confidence < 80) {
      throw createTemplumError(
        `Property assertion failed for '${propertyPath}': ${result.issues.join('; ')}`,
        'PROPERTY_VALIDATION_ERROR',
        'validation',
        { propertyPath, issues: result.issues },
      );
    }
  }

  static safeCast<T>(value: unknown, guard: TypeGuard<T>, fallback: T): T {
    return guard(value) ? value : fallback;
  }

  static narrowType<T>(value: unknown, guard: TypeGuard<T>, context: string): T {
    if (!guard(value)) {
      throw createTemplumError(
        `Type narrowing failed in context: ${context}`,
        'TYPE_NARROWING_ERROR',
        'validation',
        { context },
      );
    }
    return value;
  }
}

export interface BulkValidationStats {
  validCount: number;
  invalidCount: number;
  confidence: number;
}

export interface BulkValidationResult<T> {
  valid: T[];
  invalid: unknown[];
  stats: BulkValidationStats;
}

export class PerformanceTypeGuards {
  private static typeCache = new Map<string, boolean>();

  static cachedTypeCheck(value: unknown, typeName: string, validator: () => boolean): boolean {
    const cacheKey = `${typeName}:${typeof value}`;

    if (PerformanceTypeGuards.typeCache.has(cacheKey)) {
      return PerformanceTypeGuards.typeCache.get(cacheKey)!;
    }

    const result = validator();
    PerformanceTypeGuards.typeCache.set(cacheKey, result);
    return result;
  }

  static bulkValidate<T>(items: unknown[], guard: TypeGuard<T>): BulkValidationResult<T> {
    const valid: T[] = [];
    const invalid: unknown[] = [];

    for (const item of items) {
      if (guard(item)) {
        valid.push(item);
      } else {
        invalid.push(item);
      }
    }

    const confidence = items.length > 0 ? (valid.length / items.length) * 100 : 0;

    return {
      valid,
      invalid,
      stats: {
        validCount: valid.length,
        invalidCount: invalid.length,
        confidence,
      },
    };
  }

  static clearCache(): void {
    PerformanceTypeGuards.typeCache.clear();
  }
}
