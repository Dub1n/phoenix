import { jest } from '@jest/globals';
import * as fs from 'fs';

import {
  ServiceDiscovery,
  ConfigurationBasedDiscoveryStrategy,
  DiscoveryStrategy,
} from '../../backend/service-discovery';

const noopStrategyOptions = {
  enableFileWatching: false,
  enableHealthChecks: false,
  enableRegistryDiscovery: false,
  enableConfigurationDiscovery: false,
  enableEndpointScanning: false,
};

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ServiceDiscovery migration guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits strategyError when a strategy is missing discover implementation', async () => {
    const invalidStrategy = { name: 'invalid', priority: 10 } as unknown as DiscoveryStrategy;
    const discovery = new ServiceDiscovery({
      strategies: [invalidStrategy],
      ...noopStrategyOptions,
    });

    const errorSpy = jest.fn();
    discovery.on('strategyError', errorSpy);

    const result = await discovery.discoverServices();

    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        strategy: 'invalid',
        error: expect.any(Error),
      }),
    );
  });

  it('skips non-object entries in configuration backends array', async () => {
    const strategy = new ConfigurationBasedDiscoveryStrategy({
      configurationPath: '/tmp/backend-config.json',
      timeout: 250,
    });

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({ backends: ['bad-entry', 123, null] }));

    const discovered = await strategy.discover();

    expect(discovered).toHaveLength(0);
  });

  it('ignores service file changes when pid is not numeric', async () => {
    const discovery = new ServiceDiscovery({
      strategies: [],
      ...noopStrategyOptions,
    });

    const servicePath = '/tmp/service.json';
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ id: 'svc', endpoint: 'http://localhost:4000', pid: 'abc' }),
    );
    mockFs.unlinkSync.mockImplementation(() => undefined as unknown as void);

    await (
      discovery as unknown as {
        handleServiceFileChange: (path: string, event: 'add' | 'change') => Promise<void>;
      }
    ).handleServiceFileChange(servicePath, 'add');

    expect(discovery.getDiscoveredServices()).toHaveLength(0);
    expect(mockFs.unlinkSync).not.toHaveBeenCalled();
  });
});
