/**---
 * title: [Haruspex Backend Service Tests - TDD Validation Suite]
 * tags: [Testing, TDD, Backend-Service, API-Validation, Integration-Tests]
 * provides: [Test-Coverage, API-Validation, Service-Verification]
 * requires: [Jest, Test-Utils, Backend-Service, Mock-Data]
 * description: [Comprehensive test suite validating Haruspex 2.0 backend service API completeness and functionality]
 * ---*/

import { HaruspexBackendService } from '../haruspex-backend-service';
import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { 
  HaruspexServiceConfig,
  AnalysisRequest,
  PredictionRequest,
  ServiceUnavailableError,
  HaruspexAPIError
} from '../api/types/api-contracts';

// Mock implementations for testing
jest.mock('../engines/analysis-engine');
jest.mock('../engines/prediction-engine');
jest.mock('../api/gateway/api-gateway');
jest.mock('../diagnostics/diagnostic-system');
jest.mock('../cache/cache-manager');
jest.mock('../skin/skin-provider');

describe('Haruspex Backend Service - Phase 4 TDD Validation', () => {
  let service: HaruspexBackendService;
  let mockConfig: HaruspexServiceConfig;

  beforeEach(() => {
    mockConfig = {
      api: {
        ipc: { port: 3002, timeout: 30000, maxConnections: 100 },
        http: { port: 3003, cors: true, rateLimit: { requests: 100, windowMs: 60000 } },
        websocket: { port: 3004, heartbeat: 30000, maxClients: 50 }
      },
      analysis: {
        maxConcurrentAnalyses: 10,
        timeoutMs: 30000,
        cacheEnabled: true,
        cacheTtlMs: 300000
      },
      prediction: {
        modelsPath: './models',
        confidenceThreshold: 0.7,
        maxPredictionTime: 45000
      },
      diagnostics: {
        healthCheckInterval: 30000,
        metricsRetention: 86400000,
        alertThresholds: {
          memoryUsageMB: 500,
          responseTimeMs: 2000,
          errorRate: 0.05
        }
      }
    };

    service = new HaruspexBackendService(mockConfig);
  });

  afterEach(async () => {
    if (service.getStatus().status !== 'stopped') {
      await service.shutdown();
    }
  });

  describe('✅ TDD Test: Phase 4 Haruspex Backend Service API Completeness', () => {
    test('runs as headless service without UI dependencies', async () => {
      // Initialize service
      await service.initialize();
      
      // Verify it's a pure backend service
      expect(service.hasUIComponents()).toBe(false);
      
      // Verify API endpoints are available
      const endpoints = service.getApiEndpoints();
      expect(endpoints).toContain('ipc://localhost:3002');
      expect(endpoints).toContain('http://localhost:3003');
      expect(endpoints).toContain('ws://localhost:3004');
      
      // Verify service status
      const status = service.getStatus();
      expect(status.status).toBe('healthy');
      expect(status.components.analysisEngine).toBe('operational');
      expect(status.components.predictionEngine).toBe('operational');
      expect(status.components.apiGateway).toBe('operational');
    });

    test('provides skin definitions for Templum consumption', async () => {
      await service.initialize();
      
      const skinDef = await service.provideSkinDefinition();
      
      expect(skinDef.id).toBe('haruspex-analysis');
      expect(skinDef.name).toBe('Haruspex Code Analysis');
      expect(skinDef.version).toBe('2.1.0');
      expect(skinDef.metadata.id).toBe('haruspex-analysis');
      expect(skinDef.metadata.backend).toBe('haruspex');
      expect(skinDef.metadata.backendService).toBe('haruspex-service');
      expect(skinDef.metadata.version).toBe('2.1.0');
      expect(skinDef.views.treeViews).toHaveLength(1);
      expect(skinDef.commands).toHaveProperty(['haruspex.analyzeCode']);
      expect(skinDef.commands).toHaveProperty(['haruspex.predictEvolution']);
      expect(skinDef.backendConfig.protocol).toBe('http');
    });

    test('exposes all original Haruspex functionality through APIs', async () => {
      await service.initialize();
      
      // Test analysis functionality
      const analysisRequest: AnalysisRequest = {
        code: 'function test() { return "hello"; }',
        language: 'typescript',
        depth: 'standard',
        contentHash: 'test-hash-123'
      };
      
      const analysisResult = await service.analyzeCode(analysisRequest);
      expect(analysisResult.sessionId).toBeDefined();
      expect(analysisResult.codeStructure).toBeDefined();
      expect(analysisResult.performance).toBeDefined();
      expect(analysisResult.security).toBeDefined();
      expect(analysisResult.architecture).toBeDefined();
      
      // Test prediction functionality
      const predictionRequest: PredictionRequest = {
        codeContext: {
          projectPath: '/test/project',
          files: ['test.ts'],
          dependencies: { production: {}, development: {} },
          configuration: {
            language: 'typescript',
            framework: 'node',
            buildTool: 'tsc'
          }
        },
        timeHorizon: '30d',
        predictionTypes: ['pattern-evolution', 'bug-prediction']
      };
      
      const predictionResult = await service.predictCodeEvolution(predictionRequest);
      expect(predictionResult.sessionId).toBeDefined();
      expect(predictionResult.patterns).toBeDefined();
      expect(predictionResult.bugs).toBeDefined();
      expect(predictionResult.confidence).toBeGreaterThanOrEqual(0);
      
      // Test diagnostics functionality
      const diagnostics = await service.getSystemDiagnostics();
      expect(diagnostics.coreEngine.status).toBe('healthy');
      expect(diagnostics.analysisEngine.status).toBe('operational');
      expect(diagnostics.predictionEngine.status).toBe('operational');
      expect(diagnostics.apiGateway.servers.ipc.running).toBe(true);
      expect(diagnostics.apiGateway.servers.http.running).toBe(true);
      expect(diagnostics.apiGateway.servers.websocket.running).toBe(true);
    });
  });

  describe('🚀 Backend Service Lifecycle Management', () => {
    test('initializes all components in correct order', async () => {
      const initPromise = service.initialize();
      
      // Should emit initialization event
      const initEvent = await new Promise((resolve) => {
        service.once('initialized', resolve);
      });
      
      await initPromise;
      
      expect(initEvent).toHaveProperty('timestamp');
      expect(initEvent).toHaveProperty('initializationTime');
      expect(initEvent).toHaveProperty('version');
      
      const status = service.getStatus();
      expect(status.status).toBe('healthy');
      expect(status.uptime).toBeGreaterThan(0);
    });

    test('handles initialization failures gracefully', async () => {
      // Mock a component failure during initialization
      const mockAnalysisEngine = require('../engines/analysis-engine').AnalysisEngine;
      mockAnalysisEngine.prototype.initialize.mockRejectedValueOnce(new Error('Mock initialization failure'));
      
      const failingService = new HaruspexBackendService(mockConfig);
      
      await expect(failingService.initialize()).rejects.toThrow('Mock initialization failure');
      
      const status = failingService.getStatus();
      expect(status.status).toBe('critical');
    });

    test('shuts down gracefully', async () => {
      await service.initialize();
      
      const shutdownPromise = service.shutdown();
      
      // Should emit shutdown event
      const shutdownEvent = await new Promise((resolve) => {
        service.once('shutdown', resolve);
      });
      
      await shutdownPromise;
      
      expect(shutdownEvent).toHaveProperty('timestamp');
      expect(shutdownEvent).toHaveProperty('totalUptime');
      
      const status = service.getStatus();
      expect(status.status).toBe('stopped');
    });

    test('waits for active operations during shutdown', async () => {
      await service.initialize();
      
      // Start a long-running analysis
      const analysisPromise = service.analyzeCode({
        code: 'long running code',
        language: 'typescript',
        depth: 'comprehensive',
        contentHash: 'long-hash'
      });
      
      // Start shutdown
      const shutdownStart = Date.now();
      const shutdownPromise = service.shutdown();
      
      // Complete the analysis
      await analysisPromise;
      
      // Shutdown should complete after analysis
      await shutdownPromise;
      const shutdownDuration = Date.now() - shutdownStart;
      
      expect(shutdownDuration).toBeGreaterThan(0);
    });
  });

  describe('⚡ Performance and Reliability', () => {
    test('analysis response time meets requirements (<200ms for standard)', async () => {
      await service.initialize();
      
      const analysisRequest: AnalysisRequest = {
        code: 'function simpleTest() { return 42; }',
        language: 'typescript',
        depth: 'standard',
        contentHash: 'simple-hash'
      };
      
      const startTime = Date.now();
      await service.analyzeCode(analysisRequest);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(200);
    });

    test('handles concurrent analyses without degradation', async () => {
      await service.initialize();
      
      const analysisRequests = Array.from({ length: 5 }, (_, i) => ({
        code: `function test${i}() { return ${i}; }`,
        language: 'typescript' as const,
        depth: 'standard' as const,
        contentHash: `hash-${i}`
      }));
      
      const startTime = Date.now();
      const results = await Promise.all(
        analysisRequests.map(req => service.analyzeCode(req))
      );
      const totalDuration = Date.now() - startTime;
      
      expect(results).toHaveLength(5);
      expect(totalDuration).toBeLessThan(1000); // Should handle 5 concurrent analyses in <1s
      
      results.forEach((result, i) => {
        expect(result.sessionId).toBeDefined();
        expect(result.codeStructure).toBeDefined();
      });
    });

    test('implements caching for improved performance', async () => {
      await service.initialize();
      
      const analysisRequest: AnalysisRequest = {
        code: 'function cachedTest() { return "cached"; }',
        language: 'typescript',
        depth: 'standard',
        contentHash: 'cache-test-hash'
      };
      
      // First request - should miss cache
      const startTime1 = Date.now();
      const result1 = await service.analyzeCode(analysisRequest);
      const duration1 = Date.now() - startTime1;
      
      // Second request - should hit cache
      const startTime2 = Date.now();
      const result2 = await service.analyzeCode(analysisRequest);
      const duration2 = Date.now() - startTime2;
      
      expect(result1.metadata.cacheHit).toBe(false);
      expect(result2.metadata.cacheHit).toBe(true);
      expect(duration2).toBeLessThan(duration1); // Cache hit should be faster
    });

    test('handles errors gracefully without crashing', async () => {
      await service.initialize();
      
      // Test with invalid analysis request
      const invalidRequest = {
        code: '', // Empty code should cause error
        language: 'invalid-language' as any,
        depth: 'standard' as const,
        contentHash: 'error-hash'
      };
      
      await expect(service.analyzeCode(invalidRequest))
        .rejects.toThrow(HaruspexAPIError);
      
      // Service should still be operational
      const status = service.getStatus();
      expect(status.status).toBe('healthy');
    });
  });

  describe('🔧 API Gateway Integration', () => {
    test('API gateway provides correct status information', async () => {
      await service.initialize();
      
      const diagnostics = await service.getSystemDiagnostics();
      const apiStatus = diagnostics.apiGateway;
      
      expect(apiStatus.servers.ipc.running).toBe(true);
      expect(apiStatus.servers.ipc.port).toBe(3002);
      expect(apiStatus.servers.http.running).toBe(true);
      expect(apiStatus.servers.http.port).toBe(3003);
      expect(apiStatus.servers.websocket.running).toBe(true);
      expect(apiStatus.servers.websocket.port).toBe(3004);
      
      expect(apiStatus.connections.total).toBeGreaterThanOrEqual(0);
      expect(apiStatus.performance.requestsPerMinute).toBeGreaterThanOrEqual(0);
      expect(apiStatus.performance.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    test('supports multiple protocol endpoints simultaneously', async () => {
      await service.initialize();
      
      const endpoints = service.getApiEndpoints();
      
      expect(endpoints).toHaveLength(3);
      expect(endpoints.some(e => e.startsWith('ipc://'))).toBe(true);
      expect(endpoints.some(e => e.startsWith('http://'))).toBe(true);
      expect(endpoints.some(e => e.startsWith('ws://'))).toBe(true);
    });
  });

  describe('🎨 Skin Provider Integration', () => {
    test('generates valid skin definition with all required components', async () => {
      await service.initialize();
      
      const skinDef = await service.provideSkinDefinition();
      
      // Verify metadata
      expect(skinDef.metadata).toMatchObject({
        id: 'haruspex-analysis',
        name: 'Haruspex Code Analysis',
        backend: 'haruspex',
        backendService: 'haruspex-service',
        version: '2.1.0'
      });
      
      // Verify views
      expect(skinDef.views.treeViews).toBeDefined();
      expect(skinDef.views.panels).toBeDefined();
      expect(skinDef.views.statusBar).toBeDefined();
      
      // Verify menus
      expect(skinDef.menus.main).toBeDefined();
      expect(skinDef.menus.main.items).toHaveLength(2);
      
      // Verify commands
      expect(skinDef.commands['haruspex.analyzeCode']).toBeDefined();
      expect(skinDef.commands['haruspex.predictEvolution']).toBeDefined();
      expect(skinDef.commands['haruspex.getDiagnostics']).toBeDefined();
      
      // Verify backend configuration
      expect(skinDef.backendConfig.service).toBe('haruspex-service');
      expect(skinDef.backendConfig.endpoint).toBe('http://localhost:3001');
      expect(skinDef.backendConfig.protocol).toBe('http');
    });

    test('skin definition supports all interface types', async () => {
      await service.initialize();
      
      const skinDef = await service.provideSkinDefinition();
      
      expect(skinDef.metadata.compatibleInterfaces).toContain('vscode');
      expect(skinDef.metadata.compatibleInterfaces).toContain('cli');
    });

    test('emits a Templum schema-conforming skin definition', async () => {
      await service.initialize();

      const skinDef = await service.provideSkinDefinition();
      const schemaPath = resolve(__dirname, '../../../Templum/schemas/universal-skin-definition.schema.json');
      const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(schema);

      expect(skinDef).toMatchObject({
        id: 'haruspex-analysis',
        name: 'Haruspex Code Analysis',
        version: '2.1.0',
        metadata: {
          backend: 'haruspex',
          backendService: 'haruspex-service'
        },
        backendConfig: {
          service: 'haruspex-service',
          version: '2.1.0',
          protocol: 'http',
          endpoint: 'http://localhost:3001'
        }
      });
      expect(validate(skinDef)).toBe(true);
    });
  });

  describe('📊 Health Monitoring and Diagnostics', () => {
    test('provides comprehensive system diagnostics', async () => {
      await service.initialize();
      
      const diagnostics = await service.getSystemDiagnostics();
      
      expect(diagnostics.timestamp).toBeDefined();
      expect(diagnostics.coreEngine.status).toBe('healthy');
      expect(diagnostics.analysisEngine.status).toBe('operational');
      expect(diagnostics.predictionEngine.status).toBe('operational');
      expect(diagnostics.performance).toBeDefined();
      expect(diagnostics.health).toBeDefined();
    });

    test('tracks performance metrics accurately', async () => {
      await service.initialize();
      
      // Perform some operations to generate metrics
      await service.analyzeCode({
        code: 'function metricsTest() { return "metrics"; }',
        language: 'typescript',
        depth: 'standard',
        contentHash: 'metrics-hash'
      });
      
      const diagnostics = await service.getSystemDiagnostics();
      
      expect(diagnostics.coreEngine.totalAnalyses).toBeGreaterThan(0);
      expect(diagnostics.coreEngine.averageResponseTime).toBeGreaterThan(0);
      expect(diagnostics.coreEngine.memoryUsage).toBeGreaterThan(0);
    });

    test('detects and reports health issues', async () => {
      await service.initialize();
      
      // Mock a component degradation
      const mockAnalysisEngine = require('../engines/analysis-engine').AnalysisEngine;
      mockAnalysisEngine.prototype.getDiagnostics.mockResolvedValueOnce({
        status: 'degraded',
        analyzers: {
          codeAnalyzer: { status: 'degraded' },
          performanceAnalyzer: { status: 'operational' },
          securityAnalyzer: { status: 'operational' },
          architectureAnalyzer: { status: 'operational' }
        }
      });
      
      const diagnostics = await service.getSystemDiagnostics();
      
      expect(diagnostics.analysisEngine.status).toBe('degraded');
    });
  });

  describe('🛡️ Error Handling and Recovery', () => {
    test('throws appropriate errors for invalid requests', async () => {
      await service.initialize();
      
      // Test invalid analysis request
      await expect(service.analyzeCode({} as any))
        .rejects.toThrow(HaruspexAPIError);
      
      // Test invalid prediction request
      await expect(service.predictCodeEvolution({} as any))
        .rejects.toThrow(HaruspexAPIError);
    });

    test('handles service unavailable scenarios', async () => {
      // Test operations before initialization
      await expect(service.analyzeCode({
        code: 'test',
        language: 'typescript',
        depth: 'standard',
        contentHash: 'test'
      })).rejects.toThrow(ServiceUnavailableError);
      
      // Test operations after shutdown
      await service.initialize();
      await service.shutdown();
      
      await expect(service.analyzeCode({
        code: 'test',
        language: 'typescript',
        depth: 'standard',
        contentHash: 'test'
      })).rejects.toThrow(ServiceUnavailableError);
    });

    test('maintains service stability during component failures', async () => {
      await service.initialize();
      
      // Mock a temporary component failure
      const mockAnalysisEngine = require('../engines/analysis-engine').AnalysisEngine;
      mockAnalysisEngine.prototype.analyzeCode
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          sessionId: 'recovery-session',
          codeStructure: {},
          performance: {},
          security: {},
          architecture: {},
          patterns: {}
        });
      
      // First request should fail
      await expect(service.analyzeCode({
        code: 'failing code',
        language: 'typescript',
        depth: 'standard',
        contentHash: 'fail-hash'
      })).rejects.toThrow();
      
      // Second request should succeed (recovery)
      const result = await service.analyzeCode({
        code: 'recovery code',
        language: 'typescript',
        depth: 'standard',
        contentHash: 'recovery-hash'
      });
      
      expect(result.sessionId).toBe('recovery-session');
    });
  });
});
