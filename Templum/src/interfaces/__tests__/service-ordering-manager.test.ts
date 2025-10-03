/**
---
date: 2025-10-08T14:10:00Z
name: Service Ordering Manager Regression Harness
TASK-ID: [TASK-ARCH-005-PLAYBOOK]
category: regression-testing
status: ["[T]"]
patterns: [display-utils, service-ordering]
components: [ServiceOrderingManager, DisplayUtils]
dependencies: [Templum/src/interfaces/service-ordering-manager.ts, Templum/src/utils/display-utils.ts]
tags: [test, regression, service-ordering, connected-first]
---
*/

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

import {
  ServiceOrderingManager,
  ServiceOrderingResult,
  ServiceInfo
} from '../service-ordering-manager';

import { DisplayUtils, DisplayUtilsDependencies } from '../../utils/display-utils';
import {
  createColumnsProviderMock,
  DEFAULT_TEST_TERMINAL_WIDTH
} from '../../tests/helpers/display-columns-provider';
import type { Logger } from '../../utils/logger';

function createService(name: string, overrides: Partial<ServiceInfo> = {}): ServiceInfo {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    connected: true,
    health: 'healthy',
    ...overrides
  };
}

describe('ServiceOrderingManager — Stage 4a regression harness', () => {
  let manager: ServiceOrderingManager;
  let baselineServices: ServiceInfo[];

  beforeEach(() => {
    manager = new ServiceOrderingManager();
    baselineServices = [
      createService('Analytics Hub', { connected: true, health: 'healthy', responseTime: 85 }),
      createService('Billing Gateway', { connected: false, health: 'healthy' }),
      createService('Chat Relay', { connected: true, health: 'healthy', responseTime: 35 }),
      createService('Diagnostics Core', { connected: false, health: 'unknown' })
    ];
  });

  test('prioritizes connected services and preserves alphabetical ordering within tiers by default', () => {
    const result = manager.orderServices(baselineServices);

    expect(extractIds(result)).toEqual([
      'analytics-hub',
      'chat-relay',
      'billing-gateway',
      'diagnostics-core'
    ]);

    const connected = result.orderedServices.filter(service => service.connected);
    const disconnected = result.orderedServices.filter(service => !service.connected);

    expect(connected.map(service => service.name)).toEqual(['Analytics Hub', 'Chat Relay']);
    expect(disconnected.map(service => service.name)).toEqual(['Billing Gateway', 'Diagnostics Core']);

    expect(result.connectedCount).toBe(2);
    expect(result.disconnectedCount).toBe(2);
    expect(result.orderingMetadata.appliedRules).toEqual(
      expect.arrayContaining([
        'connected-services-first',
        'alphabetical-within-tier',
        'health-priority-ordering'
      ])
    );
  });

  test('supports disabling connected prioritisation while retaining alphabetical fallback', () => {
    manager.updateConfiguration({
      prioritizeConnected: false,
      healthPriority: false
    });

    const result = manager.orderServices(baselineServices);

    expect(extractNames(result)).toEqual([
      'Analytics Hub',
      'Billing Gateway',
      'Chat Relay',
      'Diagnostics Core'
    ]);
    expect(result.orderingMetadata.appliedRules).not.toContain('connected-services-first');
    expect(result.orderingMetadata.appliedRules).toContain('alphabetical-within-tier');
  });

  test('uses alphabetical comparison as the final tiebreaker when all other rules match', () => {
    const peers: ServiceInfo[] = [
      createService('Zeta Sync', {
        connected: true,
        health: 'healthy',
        priority: 2
      }),
      createService('Alpha Sync', {
        connected: true,
        health: 'healthy',
        priority: 2
      })
    ];

    const result = manager.orderServices(peers);
    expect(extractNames(result)).toEqual(['Alpha Sync', 'Zeta Sync']);
  });
});

describe('ServiceOrderingManager — Stage 6 lane b integration', () => {
  let orderServicesSpy: jest.SpiedFunction<typeof DisplayUtils.orderServices>;

  beforeEach(() => {
    orderServicesSpy = jest.spyOn(DisplayUtils, 'orderServices');
  });

  afterEach(() => {
    orderServicesSpy.mockRestore();
  });

  test('delegates ordering to DisplayUtils with mapped statuses and defaults', () => {
    const services = [
      createService('Alpha Service', { connected: true }),
      createService('Beta Service', { connected: false })
    ];

    const manager = new ServiceOrderingManager();
    manager.orderServices(services);

    expect(orderServicesSpy).toHaveBeenCalledTimes(1);
    const [payload, options] = orderServicesSpy.mock.calls[0];

    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'connected', source: services[0] }),
        expect.objectContaining({ status: 'inactive', source: services[1] })
      ])
    );

    expect(options).toEqual(
      expect.objectContaining({ connectedFirst: true, alphabetical: true })
    );
  });

  test('respects configuration flags when delegating to DisplayUtils', () => {
    const services = [
      createService('Beta Service', { connected: false }),
      createService('Alpha Service', { connected: true })
    ];

    const manager = new ServiceOrderingManager();
    manager.updateConfiguration({
      prioritizeConnected: false,
      alphabeticalWithinTier: false
    });

    manager.orderServices(services);

    expect(orderServicesSpy).toHaveBeenCalledTimes(1);
    const [payload, options] = orderServicesSpy.mock.calls[0];

    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'inactive' }),
        expect.objectContaining({ status: 'connected' })
      ])
    );

    expect(options).toEqual(
      expect.objectContaining({ connectedFirst: false, alphabetical: false })
    );
  });
});

describe('DisplayUtils ordering — logging expectations', () => {
  const mockSeparator = jest.fn(() => 'separator');
  const mockLogger = createMockLogger();

  beforeEach(() => {
    resetMocks(mockLogger, mockSeparator);

    const dependencies: DisplayUtilsDependencies = {
      logger: mockLogger,
      formatter: {
        ui: {
          separator: mockSeparator
        }
      },
      columnsProvider: createColumnsProviderMock(DEFAULT_TEST_TERMINAL_WIDTH)
    };

    DisplayUtils.configure(dependencies);
  });

  afterEach(() => {
    DisplayUtils.reset();
  });

  test('emits a debug log with ordering summary when services are reordered', () => {
    const services = [
      { status: 'connected', name: 'Alpha Service' },
      { status: 'inactive', name: 'Beta Service' },
      { status: 'connected', name: 'Gamma Service' }
    ];

    DisplayUtils.orderServices(services);

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Ordered services',
      expect.objectContaining({ total: 3, connected: 2 })
    );
  });
});

function extractIds(result: ServiceOrderingResult): string[] {
  return result.orderedServices.map(service => service.id);
}

function extractNames(result: ServiceOrderingResult): string[] {
  return result.orderedServices.map(service => service.name ?? service.id);
}

function createMockLogger(): Logger {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    time: jest.fn(),
    timeEnd: jest.fn(),
    child: jest.fn(),
    setLevel: jest.fn()
  } as unknown as Logger;

  (logger.child as unknown as jest.Mock).mockImplementation(() => logger);

  return logger;
}

function resetMocks(logger: Logger, separator: jest.Mock): void {
  (logger.debug as unknown as jest.Mock).mockClear();
  (logger.info as unknown as jest.Mock).mockClear();
  (logger.warn as unknown as jest.Mock).mockClear();
  (logger.error as unknown as jest.Mock).mockClear();
  (logger.time as unknown as jest.Mock).mockClear();
  (logger.timeEnd as unknown as jest.Mock).mockClear();
  (logger.child as unknown as jest.Mock).mockClear();
  (logger.setLevel as unknown as jest.Mock).mockClear();
  separator.mockClear();
}
