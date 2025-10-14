/**---
 * title: [Rollback Criteria Event Bus Integration Tests]
 * tags: [Testing, Risk, EventBus, Integration]
 * provides: [RollbackCriteria EventDrivenComponent Tests]
 * requires: [Jest, RollbackCriteria, EventEmitter]
 * description: [Validates that RollbackCriteria leverages EventDrivenComponent semantics for event emission]
 * ---*/

import { EventEmitter } from 'events';
import {
  RollbackCriteria,
  type RollbackCriterion
} from '../../src/risk/rollback-criteria';

const createCriterion = (overrides: Partial<RollbackCriterion> = {}): RollbackCriterion => ({
  id: 'criterion-1',
  name: 'High Error Rate',
  type: 'error-rate',
  severity: 'critical',
  condition: {
    metric: 'errorRate',
    operator: '>',
    threshold: 0.5
  },
  action: 'rollback',
  dependencies: [],
  weight: 5,
  enabled: true,
  metadata: {
    description: 'Triggers when the error rate exceeds the safe threshold',
    rationale: 'Prevent cascading failures by initiating rollback when errors spike',
    impact: 'Interface downtime avoided',
    recovery: 'Automatic rollback to last known good state'
  },
  ...overrides
});

describe('RollbackCriteria EventDrivenComponent integration', () => {
  let rollbackCriteria: RollbackCriteria;

  beforeEach(() => {
    rollbackCriteria = new RollbackCriteria();
  });

  afterEach(() => {
    rollbackCriteria.removeAllListeners();
  });

  test('emits criterionRegistered when a criterion is added', () => {
    const handler = jest.fn();
    rollbackCriteria.on('criterionRegistered', handler);

    rollbackCriteria.registerCriterion(createCriterion());

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        criterionId: 'criterion-1',
        severity: 'critical',
        weight: 5
      })
    );
  });

  test('notifies listeners when continuous monitoring starts', () => {
    const handler = jest.fn();
    rollbackCriteria.on('continuousMonitoringStarted', handler);
    const performanceMonitor = new EventEmitter();

    rollbackCriteria.startContinuousMonitoring('component-A', 'cli', performanceMonitor);

    expect(handler).toHaveBeenCalledTimes(1);
    const payload = handler.mock.calls[0][0];
    expect(payload).toMatchObject({
      componentId: 'component-A',
      interfaceType: 'cli'
    });
    expect(typeof payload.timestamp).toBe('number');

    performanceMonitor.removeAllListeners();
  });
});
