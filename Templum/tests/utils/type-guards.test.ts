import {
  TypeGuards,
  TypeValidators,
  PropertyGuards,
  SemanticValidators,
  TypeAssertions,
  PerformanceTypeGuards,
} from '../../src/utils/type-guards';
import { createTemplumError, isTemplumError } from '../../src/types/templum-types';

describe('TypeGuards', () => {
  it('identifies primitive and object types accurately', () => {
    expect(TypeGuards.isString('hello')).toBe(true);
    expect(TypeGuards.isString(42)).toBe(false);
    expect(TypeGuards.isNumber(1.23)).toBe(true);
    expect(TypeGuards.isNumber(Number.NaN)).toBe(false);
    expect(TypeGuards.isBoolean(true)).toBe(true);
    expect(TypeGuards.isBoolean('true')).toBe(false);
    expect(TypeGuards.isObject({})).toBe(true);
    expect(TypeGuards.isObject(null)).toBe(false);
    expect(TypeGuards.isObject([])).toBe(false);
    expect(TypeGuards.isArray([])).toBe(true);
    expect(TypeGuards.isArray({ length: 0 })).toBe(false);
  });

  it('provides higher-level semantics for strings and numbers', () => {
    expect(TypeGuards.isNonEmptyString(' templum ')).toBe(true);
    expect(TypeGuards.isNonEmptyString('   ')).toBe(false);
    expect(TypeGuards.isPositiveNumber(5)).toBe(true);
    expect(TypeGuards.isPositiveNumber(-1)).toBe(false);
    expect(TypeGuards.isNonNegativeNumber(0)).toBe(true);
    expect(TypeGuards.isNonNegativeNumber(-0.1)).toBe(false);
    expect(TypeGuards.isInteger(10)).toBe(true);
    expect(TypeGuards.isInteger(10.5)).toBe(false);
  });
});

describe('TypeValidators', () => {
  it('validates arrays using supplied guards', () => {
    const values = ['cli', 'ui'];
    expect(TypeValidators.isArrayOf(values, TypeGuards.isString)).toBe(true);
    const invalidValues = ['cli', 42];
    expect(TypeValidators.isArrayOf(invalidValues, TypeGuards.isString)).toBe(false);
  });

  it('validates structural shapes and union types', () => {
    const candidate = { id: 'svc', enabled: true };
    const matcher = (obj: Record<string, unknown>): obj is { id: string; enabled: boolean } =>
      TypeGuards.isString(obj.id) && TypeGuards.isBoolean(obj.enabled);
    expect(TypeValidators.matchesShape(candidate, matcher)).toBe(true);
    expect(TypeValidators.matchesShape({ id: 1 }, matcher)).toBe(false);

    expect(TypeValidators.isInstanceOf(new Date(), Date)).toBe(true);
    expect(TypeValidators.isInstanceOf({}, Date)).toBe(false);

    const guard = (value: unknown): value is string | number =>
      TypeValidators.isOneOf(value, TypeGuards.isString, TypeGuards.isNumber);
    expect(guard('templum')).toBe(true);
    expect(guard(42)).toBe(true);
    expect(guard(false)).toBe(false);
  });
});

describe('PropertyGuards', () => {
  it('validates nested property existence with confidence scoring', () => {
    const candidate = { meta: { mode: 'cli', retries: 3 } };
    const result = PropertyGuards.validateProperty(candidate, 'meta.mode', {
      required: true,
      typeGuard: TypeGuards.isNonEmptyString,
    });

    expect(result.exists).toBe(true);
    expect(result.value).toBe('cli');
    expect(result.confidence).toBeGreaterThanOrEqual(60);
    expect(result.issues).toHaveLength(0);
  });

  it('captures validation issues and confidence penalties', () => {
    const candidate = { meta: { mode: null } };
    const result = PropertyGuards.validateProperty(candidate, 'meta.mode', {
      required: true,
      typeGuard: TypeGuards.isNonEmptyString,
      allowNull: false,
    });

    expect(result.exists).toBe(true);
    expect(result.confidence).toBeLessThan(90);
    expect(result.issues).toContain("Property 'meta.mode' failed type validation");
    expect(result.issues).toContain("Property 'meta.mode' is null but not allowed");
  });

  it('aggregates multiple property checks with overall confidence', () => {
    const candidate = { success: true, data: { value: 1 } };
    const validation = PropertyGuards.validateProperties(candidate, {
      success: { required: true, typeGuard: TypeGuards.isBoolean },
      'data.value': { required: true, typeGuard: TypeGuards.isNumber },
    });

    expect(validation.allValid).toBe(true);
    expect(validation.overallConfidence).toBeGreaterThan(70);
    expect(validation.results.success.exists).toBe(true);
  });
});

describe('SemanticValidators', () => {
  it('detects required property contracts', () => {
    const candidate = { id: 'svc', status: 'ready' };
    type Service = { id: string; status: string };
    expect(SemanticValidators.hasRequiredProperties<Service>(candidate, ['id', 'status'])).toBe(true);
    expect(SemanticValidators.hasRequiredProperties<Service>({ id: 'svc' }, ['id', 'status'])).toBe(false);
  });

  it('validates API responses using semantic helpers', () => {
    const response = { success: true, data: { value: 1 } };
    expect(SemanticValidators.isValidAPIResponse(response)).toBe(true);
    expect(SemanticValidators.isValidAPIResponse({ success: 'yes' })).toBe(false);
  });
});

describe('TypeAssertions', () => {
  it('asserts values using guards and emits TemplumError on failure', () => {
    expect(() => TypeAssertions.assertWithConfidence('templum', TypeGuards.isString, 'must be string')).not.toThrow();

    try {
      TypeAssertions.assertWithConfidence(42, TypeGuards.isString, 'must be string');
      fail('Expected assertion to throw');
    } catch (error) {
      expect(isTemplumError(error)).toBe(true);
      expect((error as ReturnType<typeof createTemplumError>).code).toBe('TYPE_VALIDATION_ERROR');
      expect(error).toHaveProperty('category', 'validation');
    }
  });

  it('asserts property existence with confidence requirements', () => {
    const candidate = { config: { timeout: 30 } };
    expect(() => TypeAssertions.assertPropertyExists(candidate, 'config.timeout', {
      typeGuard: TypeGuards.isNumber,
      allowUndefined: false,
    })).not.toThrow();

    expect(() =>
      TypeAssertions.assertPropertyExists({}, 'config.timeout', { required: true })
    ).toThrow(/Property assertion failed/);
  });

  it('supports safe casting and narrowing', () => {
    expect(TypeAssertions.safeCast('templum', TypeGuards.isString, 'fallback')).toBe('templum');
    expect(TypeAssertions.safeCast(42, TypeGuards.isString, 'fallback')).toBe('fallback');
    expect(TypeAssertions.narrowType('cli', TypeGuards.isString, 'test')).toBe('cli');
    expect(() => TypeAssertions.narrowType(42, TypeGuards.isString, 'narrow-test')).toThrow(
      /Type narrowing failed/
    );
  });
});

describe('PerformanceTypeGuards', () => {
  afterEach(() => {
    PerformanceTypeGuards.clearCache();
  });

  it('caches repeated type checks', () => {
    const validator = jest.fn(() => true);
    expect(PerformanceTypeGuards.cachedTypeCheck('templum', 'string-check', validator)).toBe(true);
    expect(PerformanceTypeGuards.cachedTypeCheck('templum', 'string-check', validator)).toBe(true);
    expect(validator).toHaveBeenCalledTimes(1);
  });

  it('provides aggregate stats for bulk validation', () => {
    const items = ['a', 'b', 1];
    const result = PerformanceTypeGuards.bulkValidate(items, TypeGuards.isString);

    expect(result.valid).toEqual(['a', 'b']);
    expect(result.invalid).toEqual([1]);
    expect(result.stats.validCount).toBe(2);
    expect(result.stats.invalidCount).toBe(1);
    expect(result.stats.confidence).toBeCloseTo((2 / 3) * 100);
  });

  it('clears cache between validation runs', () => {
    const validator = jest.fn(() => true);
    PerformanceTypeGuards.cachedTypeCheck('templum', 'string-check', validator);
    PerformanceTypeGuards.clearCache();
    PerformanceTypeGuards.cachedTypeCheck('templum', 'string-check', validator);
    expect(validator).toHaveBeenCalledTimes(2);
  });
});
