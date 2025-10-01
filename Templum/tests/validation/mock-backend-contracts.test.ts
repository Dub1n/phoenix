/**---
 * title: Mock Backend Contract Validator Tests
 * tags: [Phase-6, Mock-Harness, Contract-Validation, Jest]
 * provides: [ContractValidationTests]
 * requires: [MockBackendContractValidator, MockBackendResponseFactory]
 * description: Ensures the mock backend harness enforces request/response contracts so API drift is surfaced during mock runs
 * ---*/

import { MockBackendContractValidator, MockBackendResponseFactory } from '../../src/tests/mock-backend-contracts';
import { WorkflowStep } from '../../src/tests/integration-validation-framework';

const createStep = (stepId: string, service: WorkflowStep['service'], iface: WorkflowStep['interface']): WorkflowStep => ({
  stepId,
  stepName: `Test step ${stepId}`,
  service,
  interface: iface,
  startTime: Date.now(),
  duration: 0,
  success: false,
  performanceMetrics: {
    responseTime: 0,
    memoryDelta: 0,
    errorRate: 0,
  },
});

describe('MockBackendContractValidator', () => {
  let validator: MockBackendContractValidator;
  let factory: MockBackendResponseFactory;

  beforeEach(() => {
    validator = new MockBackendContractValidator();
    factory = new MockBackendResponseFactory();
  });

  it('throws when required request fields are missing', () => {
    const step = createStep('pcl-tdd-init', 'pcl', 'http');

    expect(() => {
      validator.validateRequest(step, {
        projectPath: '/tmp/project',
        testType: 'integration',
      });
    }).toThrow(/Mock contract violation/);
  });

  it('accepts valid request/response pairs for known steps', () => {
    const step = createStep('haruspex-analysis', 'haruspex', 'ipc');
    const payload = {
      code: 'function example() { return true; }',
      analysisType: 'comprehensive',
      projectContext: { id: 'ctx-1' },
    };

    expect(() => validator.validateRequest(step, payload)).not.toThrow();

    const response = factory.buildResponse(step, payload);

    expect(() => validator.validateResponse(step, response)).not.toThrow();
  });

  it('fails when mock response deviates from contract expectations', () => {
    const step = createStep('haruspex-skin-definition', 'haruspex', 'http');
    const payload = {
      requestType: 'skin-definition',
      customization: {},
    };

    validator.validateRequest(step, payload);

    const response = factory.buildResponse(step, payload);
    delete (response as any).skinDefinition;

    expect(() => validator.validateResponse(step, response)).toThrow(/Mock contract violation/);
  });
});

