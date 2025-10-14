import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  ServiceDiscovery,
  type DiscoveredService,
} from '../../src/backend/service-discovery';
import type { BackendConfig } from '../../src/types/universal-skin-engine-types';
import { ErrorHandler } from '../../src/utils/error-handler';
import { createTemplumError, type TemplumError } from '../../src/types/templum-types';
import { Logger } from '../../src/utils/logger';

describe('Service discovery cache catch-path instrumentation', () => {
  const baseOptions = {
    strategies: [],
    enableFileWatching: false,
    enableRegistryDiscovery: false,
    enableConfigurationDiscovery: false,
    enableEndpointScanning: false,
    enableHealthChecks: false,
    registryPath: '/tmp/templum/service-registry.json',
    configurationPath: '/tmp/templum/backend-config.json',
  } as const;

  it('retains cached services and logs templum errors when descriptor reads fail', async () => {
    const discovery = new ServiceDiscovery(baseOptions);
    const internals = discovery as unknown as {
      discoveredServices: Map<string, DiscoveredService>;
      handleServiceFileChange: (filePath: string, eventType: 'add' | 'change') => Promise<void>;
    };

    const cachedConfig: BackendConfig = {
      service: 'cached-service',
      version: '1.0.0',
      protocol: 'http',
      endpoint: 'http://localhost:4010',
      timeout: 1500,
      retries: 1,
      keepAlive: true,
    };
    const cachedService: DiscoveredService = {
      id: 'cached-service',
      config: cachedConfig,
      discoveryMethod: 'registry',
      confidence: 0.95,
      timestamp: Date.now(),
    };
    internals.discoveredServices.set(cachedService.id, cachedService);

    const templumErrors: TemplumError[] = [];
    const handleSpy = jest.spyOn(ErrorHandler, 'handle').mockImplementation((error, context, metadata) => {
      const templumError = createTemplumError(
        `${context}: ${(error as Error).message}`,
        'DISCOVERY_CACHE_READ_FAILURE',
        'runtime',
        metadata,
      );
      templumErrors.push(templumError);
      return templumError;
    });
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
    const descriptorPath = path.join(
      os.tmpdir(),
      `templum-missing-cache-${Date.now()}.json`,
    );

    try {
      await internals.handleServiceFileChange(descriptorPath, 'add');

      expect(handleSpy).toHaveBeenCalledWith(
        expect.anything(),
        'backend:service-discovery:parse-json-file',
        {
          context: 'backend:service-discovery:file-watcher:descriptor',
          filePath: descriptorPath,
        },
      );

      const [caughtError] = handleSpy.mock.calls[0] ?? [];
      expect(caughtError).toBeTruthy();
      expect((caughtError as Error).message).toContain('ENOENT');
      expect(templumErrors[0]).toMatchObject({
        code: 'DISCOVERY_CACHE_READ_FAILURE',
        category: 'runtime',
      });

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to read JSON file',
        templumErrors[0],
        {
          context: 'backend:service-discovery:file-watcher:descriptor',
          filePath: descriptorPath,
        },
      );

      expect(discovery.getDiscoveredServices()).toEqual([cachedService]);
    } finally {
      loggerErrorSpy.mockRestore();
      handleSpy.mockRestore();
      await discovery.close();
    }
  });

  it('wraps downstream failures during descriptor processing and preserves discovered services', async () => {
    const discovery = new ServiceDiscovery(baseOptions);
    const internals = discovery as unknown as {
      handleServiceFileChange: (filePath: string, eventType: 'add' | 'change') => Promise<void>;
    };

    const descriptorPath = path.join(
      os.tmpdir(),
      `templum-descriptor-${Date.now()}.json`,
    );

    const descriptorPayload = {
      id: 'throwing-service',
      endpoint: 'http://localhost:4090',
      protocol: 'http',
      version: '1.0.0',
      capabilities: ['discovery-cache'],
    };

    const templumErrors: TemplumError[] = [];
    const manifestModule = await import('../../src/backend/schemas/service-manifest');
    const downstreamError = new Error('descriptor normalization failure');
    const handleSpy = jest.spyOn(ErrorHandler, 'handle').mockImplementation((error, context, metadata) => {
      const templumError = createTemplumError(
        `${context}: ${(error as Error).message}`,
        'SERVICE_DESCRIPTOR_PROCESSING_FAILURE',
        'runtime',
        metadata,
      );
      templumErrors.push(templumError);
      return templumError;
    });
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
    const normalizeSpy = jest
      .spyOn(manifestModule, 'normalizeServiceManifest')
      .mockImplementation(() => {
        throw downstreamError;
      });

    try {
      fs.writeFileSync(descriptorPath, JSON.stringify(descriptorPayload), 'utf-8');

      await internals.handleServiceFileChange(descriptorPath, 'change');

      expect(handleSpy).toHaveBeenCalledWith(
        downstreamError,
        'backend:service-discovery:file-watcher:update',
        {
          filePath: descriptorPath,
          eventType: 'change',
        },
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to process service file',
        templumErrors[0],
        {
          filePath: descriptorPath,
          eventType: 'change',
        },
      );

      const discoveredServices = discovery.getDiscoveredServices();
      expect(discoveredServices).toHaveLength(0);
    } finally {
      normalizeSpy.mockRestore();
      loggerErrorSpy.mockRestore();
      handleSpy.mockRestore();
      await discovery.close();
      if (fs.existsSync(descriptorPath)) {
        fs.unlinkSync(descriptorPath);
      }
    }
  });
});
