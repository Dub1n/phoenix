/**
 * Integration tests for HaruspexCoreEngine PCL Integration
 * 
 * Tests complete PCL workflow integration through the HaruspexCoreEngine API,
 * validating adapter coordination, error isolation, and telemetry integration.
 * 
 * @implementation Phase 3 PCL Integration - Integration Tests
 * @created 2025-08-14
 */

import { HaruspexCoreEngine } from '../../core/haruspex-core-engine';
import { ProjectDiscoveryAdapter } from '../adapters/ProjectDiscoveryAdapter';
import { SessionManagerAdapter } from '../adapters/SessionManagerAdapter';
import { MenuSystemAdapter } from '../adapters/MenuSystemAdapter';
import { TDDOrchestratorAdapter } from '../adapters/TDDOrchestratorAdapter';

// Mock VSCode API
jest.mock('vscode', () => ({
  commands: {
    registerCommand: jest.fn(),
    getCommands: jest.fn().mockResolvedValue(['haruspex.refreshAll'])
  },
  window: {
    createOutputChannel: jest.fn(() => ({
      append: jest.fn(),
      appendLine: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn(),
      hide: jest.fn(),
      show: jest.fn()
    })),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn()
  },
  workspace: {
    createFileSystemWatcher: jest.fn(() => ({
      onDidCreate: jest.fn(),
      onDidChange: jest.fn(),
      onDidDelete: jest.fn(),
      dispose: jest.fn()
    })),
    getWorkspaceFolder: jest.fn(),
    workspaceFolders: []
  },
  ExtensionContext: jest.fn()
}));

describe('HaruspexCoreEngine PCL Integration', () => {
  let engine: HaruspexCoreEngine;
  let mockPCLComponents: {
    projectDiscovery: any;
    sessionManager: any;
    menuSystem: any;
    tddOrchestrator: any;
  };

  beforeEach(async () => {
    // Create mock PCL components with realistic implementations
    mockPCLComponents = {
      projectDiscovery: {
        scanWorkspace: jest.fn().mockResolvedValue({
          files: ['src/main.ts', 'src/utils.ts', 'package.json'],
          languages: ['typescript', 'json']
        })
      },
      sessionManager: {
        getState: jest.fn().mockResolvedValue({
          id: 'integration-test-session',
          context: { 
            currentProject: '/test/workspace',
            lastOperation: 'initialization',
            preferences: { theme: 'dark' }
          }
        }),
        patchContext: jest.fn().mockImplementation(async (patch) => ({
          id: 'integration-test-session',
          context: {
            currentProject: '/test/workspace',
            lastOperation: 'context_update',
            preferences: { theme: 'dark' },
            ...patch
          }
        }))
      },
      menuSystem: {
        getRootMenu: jest.fn().mockResolvedValue({
          id: 'root',
          label: 'Main Menu',
          children: [
            { id: 'analyze', label: 'Analyze Project' },
            { id: 'generate', label: 'Generate Code' },
            {
              id: 'tools',
              label: 'Tools',
              children: [
                { id: 'tdd', label: 'TDD Workflow' },
                { id: 'docs', label: 'Documentation' }
              ]
            }
          ]
        })
      },
      tddOrchestrator: {
        execute: jest.fn().mockResolvedValue({
          success: true,
          artifacts: ['calculator.ts', 'calculator.test.ts', 'calculator.spec.ts'],
          duration: 3500,
          phases: ['planning', 'red', 'green', 'refactor'],
          qualityScore: 0.92,
          errors: []
        })
      }
    };

    // Create engine with PCL adapters
    engine = new HaruspexCoreEngine(
      '/test/workspace',
      {
        circuitBreaker: { failureThreshold: 3, recoveryTimeout: 10000, monitorWindow: 30000 },
        errorBoundary: { isolationStrategy: 'component', recoveryStrategy: 'graceful-degradation' },
        telemetry: { privacyCompliant: true, performanceMetrics: true, errorReporting: true }
      },
      {
        discovery: new ProjectDiscoveryAdapter(mockPCLComponents.projectDiscovery),
        session: new SessionManagerAdapter(mockPCLComponents.sessionManager),
        menu: new MenuSystemAdapter(mockPCLComponents.menuSystem),
        tdd: new TDDOrchestratorAdapter(mockPCLComponents.tddOrchestrator)
      }
    );

    // Initialize engine
    await engine.initialize();
  });

  afterEach(() => {
    engine.dispose();
    jest.clearAllMocks();
  });

  describe('PCL Integration Availability', () => {
    it('should indicate PCL integration is available when adapters configured', () => {
      expect(engine.isPCLIntegrationAvailable()).toBe(true);
    });

    it('should indicate PCL integration not available without adapters', () => {
      const engineWithoutPCL = new HaruspexCoreEngine('/test');
      expect(engineWithoutPCL.isPCLIntegrationAvailable()).toBe(false);
      engineWithoutPCL.dispose();
    });
  });

  describe('Workspace Analysis Integration', () => {
    it('should analyze workspace via PCL discovery adapter', async () => {
      const result = await engine.analyzeWorkspace();

      expect(result.files).toEqual(['src/main.ts', 'src/utils.ts', 'package.json']);
      expect(result.languages).toEqual(['typescript', 'json']);
      expect(mockPCLComponents.projectDiscovery.scanWorkspace).toHaveBeenCalledWith('/test/workspace');
    });

    it('should analyze custom path via PCL discovery adapter', async () => {
      const customPath = '/custom/project/path';
      const result = await engine.analyzeWorkspace(customPath);

      expect(result.files).toHaveLength(3);
      expect(mockPCLComponents.projectDiscovery.scanWorkspace).toHaveBeenCalledWith(customPath);
    });

    it('should handle discovery errors gracefully with circuit breaker', async () => {
      mockPCLComponents.projectDiscovery.scanWorkspace.mockRejectedValueOnce(
        new Error('Network timeout')
      );

      const result = await engine.analyzeWorkspace();

      // Should return fallback value
      expect(result).toEqual({ files: [], languages: [] });
    });

    it('should retry failed discovery operations with circuit breaker', async () => {
      // Fail first call, succeed second
      mockPCLComponents.projectDiscovery.scanWorkspace
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          files: ['recovered.ts'],
          languages: ['typescript']
        });

      const result = await engine.analyzeWorkspace();

      expect(result.files).toEqual(['recovered.ts']);
      expect(mockPCLComponents.projectDiscovery.scanWorkspace).toHaveBeenCalledTimes(2);
    });
  });

  describe('TDD Workflow Integration', () => {
    it('should execute TDD workflow via PCL orchestrator adapter', async () => {
      const task = 'Create a calculator with add and subtract methods';
      const result = await engine.runTDD(task);

      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual(['calculator.ts', 'calculator.test.ts', 'calculator.spec.ts']);
      expect(result.duration).toBe(3500);
      expect(result.phases).toEqual(['planning', 'red', 'green', 'refactor']);
      expect(result.qualityScore).toBe(0.92);
      expect(result.errors).toEqual([]);

      expect(mockPCLComponents.tddOrchestrator.execute).toHaveBeenCalledWith(task, {
        maxTurns: 3, // Default value
        projectPath: '/test/workspace'
      });
    });

    it('should execute TDD workflow with custom parameters', async () => {
      const task = 'Complex algorithm implementation';
      const maxTurns = 5;
      const options = { framework: 'jest', timeout: 60000 };

      const result = await engine.runTDD(task, maxTurns, options);

      expect(result.success).toBe(true);
      expect(mockPCLComponents.tddOrchestrator.execute).toHaveBeenCalledWith(task, {
        maxTurns: 5,
        projectPath: '/test/workspace',
        framework: 'jest',
        timeout: 60000
      });
    });

    it('should handle TDD execution failures gracefully', async () => {
      mockPCLComponents.tddOrchestrator.execute.mockRejectedValueOnce(
        new Error('TDD execution failed')
      );

      const result = await engine.runTDD('Test task');

      // Should return fallback failed result
      expect(result).toEqual({ success: false, artifacts: [] });
    });
  });

  describe('Session Management Integration', () => {
    it('should retrieve session state via PCL session adapter', async () => {
      const result = await engine.getSessionState();

      expect(result.id).toBe('integration-test-session');
      expect(result.context).toEqual({
        currentProject: '/test/workspace',
        lastOperation: 'initialization',
        preferences: { theme: 'dark' }
      });
      expect(mockPCLComponents.sessionManager.getState).toHaveBeenCalledTimes(1);
    });

    it('should update session context via PCL session adapter', async () => {
      const contextPatch = {
        lastOperation: 'workspace_analysis',
        analysisResults: { fileCount: 25, languageCount: 3 }
      };

      const result = await engine.updateSessionContext(contextPatch);

      expect(result.id).toBe('integration-test-session');
      expect(result.context).toMatchObject({
        currentProject: '/test/workspace',
        lastOperation: 'workspace_analysis',
        analysisResults: { fileCount: 25, languageCount: 3 }
      });
      expect(mockPCLComponents.sessionManager.patchContext).toHaveBeenCalledWith(contextPatch);
    });

    it('should handle session errors gracefully', async () => {
      mockPCLComponents.sessionManager.getState.mockRejectedValueOnce(
        new Error('Session service unavailable')
      );

      const result = await engine.getSessionState();

      // Should return fallback session
      expect(result).toEqual({ id: 'fallback-session', context: {} });
    });
  });

  describe('Menu System Integration', () => {
    it('should retrieve root menu via PCL menu adapter', async () => {
      const result = await engine.getRootMenu();

      expect(result.id).toBe('root');
      expect(result.label).toBe('Main Menu');
      expect(result.children).toHaveLength(3);
      expect(result.children![0]).toEqual({ id: 'analyze', label: 'Analyze Project' });
      expect(result.children![2].children).toHaveLength(2);
      expect(mockPCLComponents.menuSystem.getRootMenu).toHaveBeenCalledTimes(1);
    });

    it('should handle menu retrieval errors gracefully', async () => {
      mockPCLComponents.menuSystem.getRootMenu.mockRejectedValueOnce(
        new Error('Menu service unavailable')
      );

      const result = await engine.getRootMenu();

      // Should return fallback menu
      expect(result).toEqual({ id: 'fallback-root', label: 'Fallback Menu' });
    });
  });

  describe('Error Isolation and Recovery', () => {
    it('should isolate discovery errors without affecting other operations', async () => {
      mockPCLComponents.projectDiscovery.scanWorkspace.mockRejectedValue(
        new Error('Discovery service down')
      );

      // Discovery should fail gracefully
      const discoveryResult = await engine.analyzeWorkspace();
      expect(discoveryResult.files).toEqual([]);

      // Other services should continue working
      const sessionResult = await engine.getSessionState();
      expect(sessionResult.id).toBe('integration-test-session');

      const menuResult = await engine.getRootMenu();
      expect(menuResult.id).toBe('root');
    });

    it('should isolate TDD errors without affecting other operations', async () => {
      mockPCLComponents.tddOrchestrator.execute.mockRejectedValue(
        new Error('TDD service unavailable')
      );

      // TDD should fail gracefully
      const tddResult = await engine.runTDD('Test task');
      expect(tddResult.success).toBe(false);

      // Other services should continue working
      const discoveryResult = await engine.analyzeWorkspace();
      expect(discoveryResult.files).toHaveLength(3);
    });

    it('should recover from transient failures', async () => {
      // Simulate transient failure followed by recovery
      mockPCLComponents.sessionManager.getState
        .mockRejectedValueOnce(new Error('Transient failure'))
        .mockResolvedValueOnce({
          id: 'recovered-session',
          context: { recovered: true }
        });

      // First call should fail gracefully
      const failedResult = await engine.getSessionState();
      expect(failedResult.id).toBe('fallback-session');

      // Second call should succeed
      const recoveredResult = await engine.getSessionState();
      expect(recoveredResult.id).toBe('recovered-session');
      expect(recoveredResult.context).toEqual({ recovered: true });
    });
  });

  describe('Telemetry Integration', () => {
    it('should emit telemetry events for PCL operations', async () => {
      const telemetryMetrics = engine.getMetrics().telemetry;
      const initialEventCount = telemetryMetrics.totalEvents;

      // Perform various PCL operations
      await engine.analyzeWorkspace();
      await engine.getSessionState();
      await engine.getRootMenu();
      await engine.runTDD('Test task');

      const finalMetrics = engine.getMetrics().telemetry;
      
      // Should have emitted multiple telemetry events
      expect(finalMetrics.totalEvents).toBeGreaterThan(initialEventCount);
      
      // Should have recorded performance metrics
      expect(finalMetrics.eventsByType['performance_event'] || 0).toBeGreaterThan(0);
    });

    it('should emit error telemetry for failed PCL operations', async () => {
      mockPCLComponents.projectDiscovery.scanWorkspace.mockRejectedValue(
        new Error('Telemetry test error')
      );

      const initialErrorCount = engine.getMetrics().telemetry.eventsByType['error_event'] || 0;

      await engine.analyzeWorkspace(); // Should fail and emit error telemetry

      const finalErrorCount = engine.getMetrics().telemetry.eventsByType['error_event'] || 0;
      expect(finalErrorCount).toBeGreaterThan(initialErrorCount);
    });
  });

  describe('Performance and Circuit Breaker Integration', () => {
    it('should track performance metrics for PCL operations', async () => {
      const initialMetrics = engine.getMetrics().operations;

      await engine.analyzeWorkspace();
      await engine.runTDD('Performance test task');
      
      const finalMetrics = engine.getMetrics().operations;

      expect(finalMetrics.totalOperations).toBeGreaterThan(initialMetrics.totalOperations);
      expect(finalMetrics.successfulOperations).toBeGreaterThan(initialMetrics.successfulOperations);
    });

    it('should open circuit breaker after repeated failures', async () => {
      // Configure for quick circuit breaking
      const failFastEngine = new HaruspexCoreEngine(
        '/test',
        {
          circuitBreaker: { failureThreshold: 2, recoveryTimeout: 1000, monitorWindow: 5000 }
        },
        {
          discovery: new ProjectDiscoveryAdapter({
            scanWorkspace: jest.fn().mockRejectedValue(new Error('Always fails'))
          }),
          session: new SessionManagerAdapter(mockPCLComponents.sessionManager),
          menu: new MenuSystemAdapter(mockPCLComponents.menuSystem),
          tdd: new TDDOrchestratorAdapter(mockPCLComponents.tddOrchestrator)
        }
      );

      await failFastEngine.initialize();

      // First two failures should still attempt operation
      await failFastEngine.analyzeWorkspace();
      await failFastEngine.analyzeWorkspace();

      const healthStatus = failFastEngine.getHealthStatus();
      
      // Circuit should be open or half-open due to failures
      expect(healthStatus.components.circuitBreaker).toMatch(/open|half_open/);
      expect(healthStatus.overall).toMatch(/degraded|critical/);

      failFastEngine.dispose();
    });
  });

  describe('Engine Health Monitoring', () => {
    it('should report healthy status when PCL integration working', async () => {
      // Perform successful operations
      await engine.analyzeWorkspace();
      await engine.getSessionState();

      const healthStatus = engine.getHealthStatus();

      expect(healthStatus.overall).toBe('healthy');
      expect(healthStatus.components.circuitBreaker).toBe('closed');
      expect(healthStatus.components.errorBoundary).toBe('operational');
      expect(healthStatus.components.telemetry).toBe('active');
      expect(healthStatus.components.compatibility).toBe('compatible');
      expect(healthStatus.metrics?.totalOperations).toBeGreaterThan(0);
    });

    it('should report degraded status during PCL issues', async () => {
      // Simulate some failures to degrade health
      mockPCLComponents.projectDiscovery.scanWorkspace.mockRejectedValue(
        new Error('Simulated failure for health test')
      );

      await engine.analyzeWorkspace(); // This will fail but be handled gracefully

      const healthStatus = engine.getHealthStatus();

      // Should still be operational but may show signs of stress
      expect(['healthy', 'degraded']).toContain(healthStatus.overall);
      expect(healthStatus.metrics?.failedOperations).toBeGreaterThan(0);
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should execute complete PCL workflow end-to-end', async () => {
      // 1. Analyze workspace
      const projectSummary = await engine.analyzeWorkspace();
      expect(projectSummary.files).toContain('src/main.ts');
      expect(projectSummary.languages).toContain('typescript');

      // 2. Get session state
      const initialSession = await engine.getSessionState();
      expect(initialSession.id).toBeTruthy();

      // 3. Update session with analysis results
      const updatedSession = await engine.updateSessionContext({
        analysisComplete: true,
        fileCount: projectSummary.files.length,
        languages: projectSummary.languages
      });
      expect(updatedSession.context).toMatchObject({
        analysisComplete: true,
        fileCount: 3,
        languages: ['typescript', 'json']
      });

      // 4. Get menu structure
      const menu = await engine.getRootMenu();
      expect(menu.children).toHaveLength(3);

      // 5. Execute TDD workflow
      const tddResult = await engine.runTDD('Create utility functions based on analysis');
      expect(tddResult.success).toBe(true);
      expect(tddResult.artifacts).toHaveLength(3);

      // 6. Verify all operations were successful
      const finalMetrics = engine.getMetrics().operations;
      expect(finalMetrics.successfulOperations).toBe(finalMetrics.totalOperations);

      // 7. Verify health status remains healthy
      const finalHealth = engine.getHealthStatus();
      expect(finalHealth.overall).toBe('healthy');
    });

    it('should maintain system stability under mixed success/failure conditions', async () => {
      // Mix of successful and failed operations
      await engine.analyzeWorkspace(); // Success

      mockPCLComponents.sessionManager.getState.mockRejectedValueOnce(new Error('Temporary failure'));
      await engine.getSessionState(); // Failure (graceful)

      await engine.getRootMenu(); // Success

      mockPCLComponents.tddOrchestrator.execute.mockRejectedValueOnce(new Error('TDD failure'));
      await engine.runTDD('Test task'); // Failure (graceful)

      await engine.analyzeWorkspace(); // Success again

      // System should remain stable
      const health = engine.getHealthStatus();
      expect(['healthy', 'degraded']).toContain(health.overall);

      const metrics = engine.getMetrics().operations;
      expect(metrics.totalOperations).toBe(5);
      expect(metrics.successfulOperations).toBe(3);
      expect(metrics.failedOperations).toBe(2);
    });
  });
});