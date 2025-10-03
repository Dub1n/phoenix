import {
  assessServices,
  summariseThemeUsage,
  ThemeUsageRecord,
} from '../../utils/service-utils';
import { isTemplumError } from '../../types/templum-types';

describe('ServiceUtils', () => {
  const sample = () => [
    {
      id: 'haruspex',
      name: 'Haruspex',
      connected: true,
      health: 'healthy' as const,
      priority: 2,
      responseTime: 42,
      confidence: 0.92,
      lastCheck: 1_690_000_000_000
    },
    {
      id: 'templum-core',
      name: 'Templum Core',
      connected: true,
      health: 'degraded' as const,
      priority: 3,
      responseTime: 95,
      confidence: 0.81,
      lastCheck: 1_690_000_100_000
    },
    {
      id: 'phoenix-lite',
      name: 'Phoenix Lite',
      connected: false,
      health: 'healthy' as const,
      priority: 1,
      responseTime: 88,
      confidence: 0.54,
      lastCheck: 1_690_000_050_000
    }
  ];

  test('orders services by connectivity, health, priority, and name', () => {
    const { ordered } = assessServices(sample());

    expect(ordered.map(service => service.id)).toEqual([
      'haruspex',
      'templum-core',
      'phoenix-lite'
    ]);

    expect(ordered[0].score).toBeGreaterThan(ordered[1].score);
    expect(ordered[1].score).toBeGreaterThan(ordered[2].score);
  });

  test('summarises connection and health metrics with latency averages', () => {
    const { summary } = assessServices(sample());

    expect(summary.connection.connected).toBe(2);
    expect(summary.connection.disconnected).toBe(1);
    expect(summary.health.healthy).toBe(2);
    expect(summary.health.degraded).toBe(1);
    expect(summary.latency.averageMs).toBeCloseTo((42 + 95 + 88) / 3, 5);
    expect(summary.confidence.mean).toBeGreaterThan(0.7);
    expect(summary.confidence.min).toBeCloseTo(0.54, 2);
  });

  test('deduplicates by service id preferring highest confidence and freshest data', () => {
    const duplicates = [
      {
        id: 'haruspex',
        connected: false,
        health: 'degraded' as const,
        priority: 1,
        confidence: 0.4,
        responseTime: 150,
        lastCheck: 1_689_999_900_000
      },
      {
        id: 'haruspex',
        connected: true,
        health: 'healthy' as const,
        priority: 2,
        confidence: 0.87,
        responseTime: 35,
        lastCheck: 1_690_000_200_000
      }
    ];

    const { byId } = assessServices(duplicates);

    const record = byId.get('haruspex');
    expect(record?.connected).toBe(true);
    expect(record?.confidence).toBeCloseTo(0.87, 2);
    expect(record?.responseTime).toBe(35);
  });

  test('exposes helper to pick ordered subset for dependency resolution', () => {
    const required = ['templum-core', 'haruspex'];
    const { pick } = assessServices(sample());

    const selection = pick(required);
    expect(selection.map(service => service.id)).toEqual(['haruspex', 'templum-core']);
  });

  test('throws templum error when a service record is missing a valid id', () => {
    try {
      assessServices([
        {
          name: 'Broken Service',
        } as any,
      ]);
      fail('Expected assessServices to throw');
    } catch (error) {
      expect(isTemplumError(error)).toBe(true);
      if (isTemplumError(error)) {
        expect(error.code).toBe('SERVICE_UTILS_INVALID_INPUT');
        expect(error.context).toMatchObject({ missingField: 'id' });
      }
    }
  });

  test('sanitises invalid assessment options using type guard fallbacks', () => {
    const result = assessServices(sample(), {
      now: 'not-a-function' as any,
      lowConfidenceThreshold: 'untrusted' as any,
    } as any);

    expect(typeof result.summary.updatedAt).toBe('number');
    expect(result.summary.confidence.lowConfidence).toContain('phoenix-lite');
  });

  describe('theme metrics', () => {
    const themeRecord = (
      partial: Partial<ThemeUsageRecord> & Pick<ThemeUsageRecord, 'id'>,
    ): ThemeUsageRecord => ({
      theme: 'default',
      applied: true,
      fallbackMode: 'unicode',
      capabilities: { supportsColor: true, supportsUnicode: true },
      overrides: [],
      ...partial,
    });

    test('deduplicates theme usage records and reports fallback counts', () => {
      const summary = summariseThemeUsage([
        themeRecord({ id: 'cli', theme: 'default-light' }),
        themeRecord({
          id: 'cli',
          applied: false,
          fallbackMode: 'ascii',
          capabilities: { supportsColor: false, supportsUnicode: false },
        }),
        themeRecord({
          id: 'window',
          theme: 'high-contrast',
          fallbackMode: 'ascii',
          capabilities: { supportsColor: true, supportsUnicode: false },
          overrides: ['border'],
        }),
      ]);

      expect(summary.total).toBe(2);
      expect(summary.applied).toBe(2);
      expect(summary.fallbackModes.unicode).toBe(1);
      expect(summary.fallbackModes.ascii).toBe(1);
      expect(summary.fallbackModes.simple).toBe(0);
      expect(summary.overridesApplied).toBe(1);
      expect(summary.capabilityScore.max).toBeCloseTo(1, 5);
      expect(summary.capabilityScore.min).toBeCloseTo(0.45, 5);
      expect(summary.capabilityScore.average).toBeCloseTo(0.725, 5);
    });
  });

});
