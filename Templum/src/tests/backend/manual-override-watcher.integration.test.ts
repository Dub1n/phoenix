import { once } from 'events';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { jest } from '@jest/globals';

import { TemplumBackendServiceRouter } from '../../backend/backend-service-router';
import { ConnectionFactory } from '../../backend/connection-factory';
import { ServiceDiscovery } from '../../backend/service-discovery';
import type { BackendConfig } from '../../types/universal-skin-engine-types';
import { serializeServiceManifest } from '../../backend/schemas/service-manifest';
import { MockBackendConnection } from './__utils__/mock-backend-connection';

const removeIfExists = (targetPath: string) => {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
};

describe('Manual override watcher integration', () => {
  let tmpDir: string;
  let servicesDir: string;
  let router: TemplumBackendServiceRouter;
  let connectionSpy: jest.SpiedFunction<typeof ConnectionFactory.create>;
  let detectCapabilitiesSpy: jest.SpyInstance;
  let getServiceVersionSpy: jest.SpyInstance;
  let loadBackendSkinSpy: jest.SpyInstance;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'templum-manual-override-'));
    servicesDir = path.join(tmpDir, '.templum', 'services');
    fs.mkdirSync(servicesDir, { recursive: true });

    connectionSpy = jest
      .spyOn(ConnectionFactory, 'create')
      .mockImplementation(async (serviceId, config) => {
        const skin = {
          id: `${serviceId}-skin`,
          name: `${serviceId} Skin`,
          version: '1.0.0',
          metadata: {
            id: `${serviceId}-skin`,
            name: `${serviceId} Skin`,
            version: '1.0.0',
            backend: serviceId,
            backendService: serviceId,
          },
          backendConfig: config,
          commands: {},
        };
        return new MockBackendConnection(skin as any);
      });

    detectCapabilitiesSpy = jest
      .spyOn(TemplumBackendServiceRouter.prototype as unknown as { detectServiceCapabilities(serviceId: string): Promise<void> }, 'detectServiceCapabilities')
      .mockResolvedValue(undefined);
    getServiceVersionSpy = jest
      .spyOn(TemplumBackendServiceRouter.prototype as unknown as { getServiceVersion(serviceId: string): Promise<string | undefined> }, 'getServiceVersion')
      .mockResolvedValue('1.0.0');

    router = new TemplumBackendServiceRouter(undefined, {
      registryPath: path.join(tmpDir, 'service-registry.json'),
      watchDirectories: [servicesDir],
      enableFileWatching: true,
      enableHealthChecks: false,
    });

    loadBackendSkinSpy = jest
      .spyOn(router as unknown as { loadBackendSkin(serviceId: string): Promise<unknown> }, 'loadBackendSkin')
      .mockResolvedValue({
        id: `${Math.random().toString(16).slice(2)}-skin`,
        backendConfig: {
          service: 'watcher-backend',
          protocol: 'http',
          endpoint: 'http://127.0.0.1:4311'
        }
      });

    await router.discoverAndConnect();
  });

  afterEach(async () => {
    connectionSpy.mockRestore();
    detectCapabilitiesSpy.mockRestore();
    getServiceVersionSpy.mockRestore();
    loadBackendSkinSpy.mockRestore();
    if (router) {
      await router.dispose();
    }
    removeIfExists(tmpDir);
  });

  const createManifest = (serviceId: string, overrides: Partial<BackendConfig> = {}) => {
    const manifestPath = path.join(servicesDir, `${serviceId}.json`);
    const manifest = serializeServiceManifest({
      id: serviceId,
      name: `${serviceId} Service`,
      endpoint: 'http://127.0.0.1:4311',
      protocol: 'http',
      version: '1.0.0',
      capabilities: ['test.execute'],
      registrationTime: Date.now(),
      lastSeen: Date.now(),
      healthCheck: {
        type: 'http',
        endpoint: 'http://127.0.0.1:4311/health',
      },
      ...overrides,
    });
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    return manifestPath;
  };

  it('applies override from watcher manifest and auto-clears when manifest is removed', async () => {
    const serviceId = 'watcher-backend';
    const appliedPromise = once(router, 'manualOverride:applied');
    const clearedPromise = once(router, 'manualOverride:cleared');

    const manifestPath = createManifest(serviceId);

    const serviceDiscovery = (router as unknown as { serviceDiscovery: ServiceDiscovery }).serviceDiscovery;
    await (serviceDiscovery as unknown as {
      handleServiceFileChange: (filePath: string, eventType: 'add' | 'change') => Promise<void>;
    }).handleServiceFileChange(manifestPath, 'add');

    const descriptor = await router.applyManualOverride(serviceId, { reason: 'watcher-test' });
    expect(descriptor.serviceId).toBe(serviceId);
    await appliedPromise;
    expect(router.getManualOverrideSnapshot().overrides).toHaveLength(1);

    fs.rmSync(manifestPath);
    (serviceDiscovery as unknown as { handleServiceFileRemoval: (filePath: string) => void }).handleServiceFileRemoval(manifestPath);
    await clearedPromise;

    expect(router.getManualOverrideSnapshot().overrides).toHaveLength(0);
    expect(connectionSpy).toHaveBeenCalledWith(
      serviceId,
      expect.objectContaining({ endpoint: 'http://127.0.0.1:4311' })
    );
  }, 15000);
});
