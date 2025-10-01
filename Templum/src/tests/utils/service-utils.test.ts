import { assessServices } from '../../utils/service-utils';

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
});
