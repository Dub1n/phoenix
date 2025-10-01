/**---
 * title: Mock Backend Contract Definitions
 * tags: [Phase-6, Mock-Harness, Contract-Validation]
 * provides: [MockBackendContractValidator, MockBackendResponseFactory]
 * requires: [zod, WorkflowStep]
 * description: Centralises request/response schemas for the mock backend harness so Phase 6 runs catch API drift when real services are unavailable
 * ---*/

import { z, ZodIssue } from 'zod';
import { BackendServiceInstance, WorkflowStep } from './integration-validation-framework';

type ContractKey = string;

const services = ['haruspex', 'pcl', 'templum'] as const satisfies BackendServiceInstance['name'][];
const interfaces = ['ipc', 'http', 'websocket', 'cli', 'vscode'] as const satisfies WorkflowStep['interface'][];

const serviceEnum = z.enum(services);
const interfaceEnum = z.enum(interfaces);

const analysisResultsSchema = z
  .object({
    score: z.number().min(0).max(100),
    recommendations: z.array(z.string()),
    coverage: z.number().min(0).max(100).optional(),
    issues: z.array(z.string()).optional(),
  })
  .strict();

const skinDefinitionSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    metadata: z.object({ source: z.string(), generatedAt: z.number() }).strict(),
    components: z.array(z.record(z.any())),
  })
  .strict();

const requestContracts: Record<ContractKey, z.ZodTypeAny> = {
  'pcl-tdd-init': z
    .object({
      command: z.literal('tdd:start'),
      projectPath: z.string().min(1),
      testType: z.literal('integration'),
      projectContext: z.record(z.any()).optional(),
    })
    .strict(),
  'haruspex-analysis': z
    .object({
      code: z.string().min(1),
      analysisType: z.enum(['comprehensive', 'baseline', 'quick']),
      projectContext: z.record(z.any()).optional(),
    })
    .strict(),
  'pcl-result-coordination': z
    .object({
      analysisResults: analysisResultsSchema,
      nextAction: z.enum(['refactor', 'merge', 'deploy']),
      qualityGateValidation: z.boolean(),
    })
    .strict(),
  'haruspex-skin-definition': z
    .object({
      requestType: z.literal('skin-definition'),
      customization: z.record(z.any()),
    })
    .strict(),
  'templum-skin-processing': z
    .object({
      skinDefinition: skinDefinitionSchema,
      targetInterface: z.enum(['universal', 'cli', 'vscode']),
      optimizationLevel: z.enum(['production', 'staging', 'development']),
    })
    .strict(),
  'state-sync-validation': z
    .object({
      syncType: z.enum(['bi-directional', 'uni-directional']),
      services: z.array(serviceEnum).min(1),
      conflictResolution: z.enum(['latest-wins', 'first-wins', 'prompt-user']),
    })
    .strict(),
  'e2e-test-planning': z
    .object({
      feature: z.string().min(1),
      testStrategy: z.enum(['comprehensive', 'risk-based', 'smoke']),
      coverage: z.enum(['cross-system', 'targeted', 'minimal']),
    })
    .strict(),
  'e2e-code-analysis': z
    .object({
      analysisScope: z.enum(['multi-system', 'component', 'incremental']),
      codebase: z.any().optional(),
      predictionTypes: z.array(z.enum(['integration-risks', 'performance-bottlenecks', 'quality-gates'])),
    })
    .strict(),
  'e2e-interface-orchestration': z
    .object({
      orchestrationType: z.enum(['end-to-end', 'partial']),
      analysisResults: z.record(z.any()),
      interfaceTargets: z.array(z.enum(['cli', 'vscode', 'http'])).min(1),
    })
    .strict(),
  'e2e-integration-validation': z
    .object({
      validationType: z.enum(['complete-system', 'focused']),
      haruspexResults: z.record(z.any()),
      templumOrchestration: z.record(z.any()),
      qualityGates: z.array(z.string()).min(1),
    })
    .strict(),
  'cross-interface-pcl-cli': z
    .object({
      operation: z.literal('sync-state'),
      crossInterfaceData: z.record(z.any()),
      consistencyCheck: z.boolean(),
    })
    .strict(),
  'cross-interface-templum-vscode': z
    .object({
      operation: z.literal('sync-state'),
      crossInterfaceData: z.record(z.any()),
      consistencyCheck: z.boolean(),
    })
    .strict(),
  'cross-interface-haruspex-http': z
    .object({
      operation: z.literal('sync-state'),
      crossInterfaceData: z.record(z.any()),
      consistencyCheck: z.boolean(),
    })
    .strict(),
  'pcl:http': z
    .object({
      operation: z.string().optional(),
    })
    .passthrough(),
  'haruspex:ipc': z
    .object({
      code: z.string().optional(),
      analysisType: z.string().optional(),
    })
    .passthrough(),
  'haruspex:http': z
    .object({
      requestType: z.string().optional(),
    })
    .passthrough(),
  'templum:websocket': z
    .object({
      targetInterface: z.string().optional(),
    })
    .passthrough(),
  'templum:ipc': z
    .object({
      syncType: z.string().optional(),
    })
    .passthrough(),
};

const baseResponseSchema = z
  .object({
    status: z.enum(['success', 'ok']),
    service: serviceEnum,
    interface: interfaceEnum,
    timestamp: z.number().int(),
  })
  .strict();

const responseContracts: Record<ContractKey, z.ZodTypeAny> = {
  'pcl-tdd-init': baseResponseSchema.extend({
    command: z.literal('tdd:start'),
    generatedTests: z.array(z.string()).min(1),
    nextAction: z.enum(['analysis', 'refine']),
    summary: z.object({ estimatedDuration: z.number(), plannedSuites: z.number() }).strict(),
  }),
  'haruspex-analysis': baseResponseSchema.extend({
    analysisResults: analysisResultsSchema,
    artifacts: z.object({ generatedCode: z.string() }).strict(),
  }),
  'pcl-result-coordination': baseResponseSchema.extend({
    coordinationStatus: z.enum(['complete', 'pending']),
    followUpAction: z.enum(['refactor', 'report']),
  }),
  'haruspex-skin-definition': baseResponseSchema.extend({
    skinDefinition: skinDefinitionSchema,
  }),
  'templum-skin-processing': baseResponseSchema.extend({
    renderedInterface: z.object({
      mode: z.enum(['preview', 'interactive']),
      renderTimeMs: z.number(),
      componentCount: z.number(),
    }).strict(),
  }),
  'state-sync-validation': baseResponseSchema.extend({
    syncResult: z.object({
      consistencyScore: z.number().min(0).max(100),
      conflictsResolved: z.number().min(0),
    }).strict(),
  }),
  'e2e-test-planning': baseResponseSchema.extend({
    testPlan: z.object({
      suites: z.number().min(1),
      coverageGoal: z.number().min(0).max(100),
    }).strict(),
  }),
  'e2e-code-analysis': baseResponseSchema.extend({
    analysisSummary: z.object({
      riskScore: z.number().min(0).max(100),
      hotSpots: z.array(z.string()),
    }).strict(),
  }),
  'e2e-interface-orchestration': baseResponseSchema.extend({
    orchestrationSummary: z.object({
      activeInterfaces: z.array(z.enum(['cli', 'vscode', 'http'])),
      orchestrationLatency: z.number(),
    }).strict(),
  }),
  'e2e-integration-validation': baseResponseSchema.extend({
    validationSummary: z.object({
      overallScore: z.number().min(0).max(100),
      failingGates: z.array(z.string()),
    }).strict(),
  }),
  'cross-interface-pcl-cli': baseResponseSchema.extend({
    syncSummary: z.object({
      interfaceConsistency: z.number().min(0).max(100),
      operations: z.number().min(1),
    }).strict(),
  }),
  'cross-interface-templum-vscode': baseResponseSchema.extend({
    syncSummary: z.object({
      interfaceConsistency: z.number().min(0).max(100),
      operations: z.number().min(1),
    }).strict(),
  }),
  'cross-interface-haruspex-http': baseResponseSchema.extend({
    syncSummary: z.object({
      interfaceConsistency: z.number().min(0).max(100),
      operations: z.number().min(1),
    }).strict(),
  }),
  __generic: baseResponseSchema.extend({ data: z.any().optional() }).passthrough(),
};

const formatIssues = (issues: ZodIssue[]): string =>
  issues.map((issue) => `${issue.path.length ? issue.path.join('.') : '<root>'}: ${issue.message}`).join('; ');

const deriveKeys = (step: WorkflowStep): ContractKey[] => [
  step.stepId,
  `${step.service}:${step.interface}`,
  '__generic',
];

class MockBackendContractValidator {
  validateRequest(step: WorkflowStep, payload: unknown): void {
    this.validate('request', step, payload, requestContracts);
  }

  validateResponse(step: WorkflowStep, payload: unknown): void {
    this.validate('response', step, payload, responseContracts);
  }

  private validate(
    type: 'request' | 'response',
    step: WorkflowStep,
    payload: unknown,
    contracts: Record<ContractKey, z.ZodTypeAny>,
  ): void {
    for (const key of deriveKeys(step)) {
      const schema = contracts[key];
      if (!schema) {
        continue;
      }

      const result = schema.safeParse(payload);

      if (result.success) {
        return;
      }

      throw new Error(
        `Mock contract violation [${type}] (${key}): ${formatIssues(result.error.issues)}`,
      );
    }

    throw new Error(`Mock contract violation [${type}] (${step.stepId}): No contract found`);
  }
}

class MockBackendResponseFactory {
  buildResponse(step: WorkflowStep, payload: any): any {
    const base = {
      status: 'success' as const,
      service: step.service,
      interface: step.interface,
      timestamp: Date.now(),
    };

    switch (step.stepId) {
      case 'pcl-tdd-init':
        return {
          ...base,
          command: 'tdd:start',
          generatedTests: ['integration-smoke', 'integration-regression'],
          nextAction: 'analysis',
          summary: {
            estimatedDuration: 12,
            plannedSuites: 3,
          },
        };
      case 'haruspex-analysis':
        return {
          ...base,
          analysisResults: {
            score: 98,
            recommendations: ['Adjust concurrency limits'],
            coverage: 92,
            issues: [],
          },
          artifacts: {
            generatedCode: payload.code ?? 'function mockGenerated() { return true; }',
          },
        };
      case 'pcl-result-coordination':
        return {
          ...base,
          coordinationStatus: 'complete' as const,
          followUpAction: 'refactor' as const,
        };
      case 'haruspex-skin-definition':
        return {
          ...base,
          skinDefinition: {
            id: 'mock-skin',
            name: 'Mock Haruspex Skin',
            version: '1.0.0',
            metadata: {
              source: 'mock-harness',
              generatedAt: Date.now(),
            },
            components: [],
          },
        };
      case 'templum-skin-processing':
        return {
          ...base,
          renderedInterface: {
            mode: 'preview' as const,
            renderTimeMs: 42,
            componentCount: (payload?.skinDefinition?.components || []).length,
          },
        };
      case 'state-sync-validation':
        return {
          ...base,
          syncResult: {
            consistencyScore: 100,
            conflictsResolved: 0,
          },
        };
      case 'e2e-test-planning':
        return {
          ...base,
          testPlan: {
            suites: 4,
            coverageGoal: payload?.coverage === 'minimal' ? 60 : 90,
          },
        };
      case 'e2e-code-analysis':
        return {
          ...base,
          analysisSummary: {
            riskScore: 12,
            hotSpots: [],
          },
        };
      case 'e2e-interface-orchestration':
        return {
          ...base,
          orchestrationSummary: {
            activeInterfaces: payload?.interfaceTargets ?? ['cli', 'vscode'],
            orchestrationLatency: 85,
          },
        };
      case 'e2e-integration-validation':
        return {
          ...base,
          validationSummary: {
            overallScore: 97,
            failingGates: [],
          },
        };
      default:
        if (step.stepId.startsWith('cross-interface-')) {
          return {
            ...base,
            syncSummary: {
              interfaceConsistency: 100,
              operations: 3,
            },
          };
        }

        return {
          ...base,
          data: payload,
        };
    }
  }
}

export { MockBackendContractValidator, MockBackendResponseFactory };

