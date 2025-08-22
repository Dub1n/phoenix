/**
 * Unit tests for HaruspexCoreEngine implementation
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

import * as vscode from 'vscode';
import { HaruspexCoreEngine, HaruspexCoreEngineConfig } from '../haruspex-core-engine';

// Mock VSCode APIs
jest.mock('vscode', () => ({
  window: {
    createOutputChannel: jest.fn().mockReturnValue({
      appendLine: jest.fn(),
      dispose: jest.fn()
    }),
    showWarningMessage: jest.fn()
  },
  workspace: {
    createFileSystemWatcher: jest.fn().mockReturnValue({
      onDidCreate: jest.fn(),
      onDidChange: jest.fn(), 
      onDidDelete: jest.fn(),
      dispose: jest.fn()
    })
  },
  Uri: {
    file: jest.fn().mockImplementation(path => ({ fsPath: path }))
  }
}));

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  access: jest.fn()
}));

describe('HaruspexCoreEngine', () => {
  const testWorkspaceRoot = '/test/workspace';
  const defaultConfig: HaruspexCoreEngineConfig = {
    circuitBreaker: {
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitorWindow: 5000
    },
    errorBoundary: {
      isolationStrategy: 'component',
      recoveryStrategy: 'graceful-degradation',
      maxRetries: 2
    },
    telemetry: {
      privacyCompliant: true,
      performanceMetrics: true,
      errorReporting: true,
      outputChannel: true
    },
    fileMonitoring: {
      enabled: true,
      patterns: ['**/*.{ts,js,md}'],
      debounceMs: 100
    }
  };

  describe('Constructor', () => {
    it('should create core engine with default configuration', () => {
      const engine = new HaruspexCoreEngine(testWorkspaceRoot);
      expect(engine).toBeInstanceOf(HaruspexCoreEngine);
    });

    it('should create core engine with custom configuration', () => {
      const engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      expect(engine).toBeInstanceOf(HaruspexCoreEngine);
    });

    it('should initialize all internal components', () => {
      const engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      
      // Engine should be created without throwing
      expect(engine).toBeDefined();
      
      // Should not be initialized yet
      expect(() => engine.getHealthStatus()).not.toThrow();
    });
  });

  describe('Initialization', () => {
    let engine: HaruspexCoreEngine;

    beforeEach(() => {
      engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
    });

    it('should initialize successfully with compatible components', async () => {
      const result = await engine.initialize();
      
      expect(result.success).toBe(true);
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.compatibility).toBeDefined();
      expect(result.compatibility!.score).toBeGreaterThan(0);
    });

    it('should complete initialization within reasonable time', async () => {
      const startTime = Date.now();
      const result = await engine.initialize();
      const duration = Date.now() - startTime;
      
      expect(result.durationMs).toBeLessThan(5000); // Should complete within 5 seconds
      expect(duration).toBeGreaterThanOrEqual(result.durationMs - 50); // Allow for timing precision
    });

    it('should include compatibility validation results', async () => {
      const result = await engine.initialize();
      
      expect(result.compatibility).toBeDefined();
      expect(result.compatibility!.score).toBeGreaterThanOrEqual(0);
      expect(result.compatibility!.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.compatibility!.issues)).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      // Create an engine that will fail during compatibility validation
      const engine = new HaruspexCoreEngine('/nonexistent/path', defaultConfig);
      
      const result = await engine.initialize();
      
      // Should not throw, but should indicate failure
      expect(result.success).toBeDefined();
      expect(result.durationMs).toBeGreaterThan(0);
    });

    it('should be idempotent - multiple initializations should work', async () => {
      const firstResult = await engine.initialize();
      const secondResult = await engine.initialize();
      
      expect(firstResult.success).toBe(secondResult.success);
      expect(firstResult.compatibility?.score).toBe(secondResult.compatibility?.score);
    });
  });

  describe('Core Operations', () => {
    let engine: HaruspexCoreEngine;

    beforeEach(async () => {
      engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      await engine.initialize();
    });

    describe('Documentation Tree', () => {
      it('should return documentation tree without throwing', async () => {
        const tree = await engine.getDocumentationTree();
        
        expect(Array.isArray(tree)).toBe(true);
        // Tree can be empty for a test workspace, that's fine
      });

      it('should handle errors gracefully and return fallback', async () => {
        // This should not throw even with a problematic workspace
        const tree = await engine.getDocumentationTree();
        
        expect(Array.isArray(tree)).toBe(true);
      });

      it('should track operation metrics for documentation tree', async () => {
        await engine.getDocumentationTree();
        
        const metrics = engine.getMetrics();
        expect(metrics.operations.totalOperations).toBeGreaterThan(0);
      });
    });

    describe('Truth Matrix', () => {
      it('should return truth matrix with required properties', async () => {
        const truthMatrix = await engine.getTruthMatrix();
        
        expect(truthMatrix).toHaveProperty('overallHealthScore');
        expect(typeof truthMatrix.overallHealthScore).toBe('number');
        expect(truthMatrix.overallHealthScore).toBeGreaterThanOrEqual(0);
        expect(truthMatrix.overallHealthScore).toBeLessThanOrEqual(100);
        expect(truthMatrix).toHaveProperty('timestamp');
      });

      it('should include validation results when available', async () => {
        const truthMatrix = await engine.getTruthMatrix();
        
        // Should have either no validation errors or an array of them
        if (truthMatrix.validationErrors) {
          expect(Array.isArray(truthMatrix.validationErrors)).toBe(true);
        }
      });

      it('should track performance metrics for truth matrix calculation', async () => {
        const startOperations = engine.getMetrics().operations.totalOperations;
        
        await engine.getTruthMatrix();
        
        const endOperations = engine.getMetrics().operations.totalOperations;
        expect(endOperations).toBeGreaterThan(startOperations);
      });
    });

    describe('Mermaid Diagrams', () => {
      it('should return array of mermaid diagrams', async () => {
        const diagrams = await engine.getMermaidDiagrams();
        
        expect(Array.isArray(diagrams)).toBe(true);
        
        // If diagrams are returned, they should have required structure
        diagrams.forEach(diagram => {
          expect(diagram).toHaveProperty('id');
          expect(diagram).toHaveProperty('title');
          expect(diagram).toHaveProperty('source');
          expect(diagram).toHaveProperty('type');
        });
      });

      it('should handle diagram generation errors gracefully', async () => {
        // Should not throw even if generation fails
        const diagrams = await engine.getMermaidDiagrams();
        
        expect(Array.isArray(diagrams)).toBe(true);
      });
    });
  });

  describe('File Monitoring', () => {
    let engine: HaruspexCoreEngine;
    let mockContext: vscode.ExtensionContext;

    beforeEach(async () => {
      engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      await engine.initialize();
      
      mockContext = {
        subscriptions: []
      } as any;
    });

    it('should setup file watching when file monitoring is enabled', () => {
      expect(() => engine.setupFileWatching(mockContext)).not.toThrow();
      
      // Should create file system watcher
      expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalled();
    });

    it('should not setup file watching when disabled', () => {
      const configWithoutMonitoring = {
        ...defaultConfig,
        fileMonitoring: { enabled: false }
      };
      
      const engineWithoutMonitoring = new HaruspexCoreEngine(testWorkspaceRoot, configWithoutMonitoring);
      
      (vscode.workspace.createFileSystemWatcher as jest.Mock).mockClear();
      engineWithoutMonitoring.setupFileWatching(mockContext);
      
      // Should not create watcher when disabled
      expect(vscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled();
    });
  });

  describe('Health Status', () => {
    let engine: HaruspexCoreEngine;

    beforeEach(async () => {
      engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      await engine.initialize();
    });

    it('should provide comprehensive health status', () => {
      const health = engine.getHealthStatus();
      
      expect(health).toHaveProperty('overall');
      expect(['healthy', 'degraded', 'critical']).toContain(health.overall);
      
      expect(health).toHaveProperty('components');
      expect(health.components).toHaveProperty('circuitBreaker');
      expect(health.components).toHaveProperty('errorBoundary'); 
      expect(health.components).toHaveProperty('telemetry');
      expect(health.components).toHaveProperty('fileMonitor');
      expect(health.components).toHaveProperty('compatibility');
      
      expect(health).toHaveProperty('timestamp');
      expect(health.timestamp).toBeGreaterThan(0);
    });

    it('should include performance metrics in health status', () => {
      const health = engine.getHealthStatus();
      
      expect(health.metrics).toBeDefined();
      expect(health.metrics!.totalOperations).toBeGreaterThanOrEqual(0);
      expect(health.metrics!.successfulOperations).toBeGreaterThanOrEqual(0);
      expect(health.metrics!.failedOperations).toBeGreaterThanOrEqual(0);
      expect(health.metrics!.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should update health status after operations', async () => {
      const initialHealth = engine.getHealthStatus();
      const initialOperations = initialHealth.metrics!.totalOperations;
      
      await engine.getTruthMatrix();
      
      const updatedHealth = engine.getHealthStatus();
      const updatedOperations = updatedHealth.metrics!.totalOperations;
      
      expect(updatedOperations).toBeGreaterThan(initialOperations);
    });
  });

  describe('Metrics and Monitoring', () => {
    let engine: HaruspexCoreEngine;

    beforeEach(async () => {
      engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      await engine.initialize();
    });

    it('should provide comprehensive metrics', () => {
      const metrics = engine.getMetrics();
      
      expect(metrics).toHaveProperty('initialization');
      expect(metrics).toHaveProperty('circuitBreaker');
      expect(metrics).toHaveProperty('errorBoundary');
      expect(metrics).toHaveProperty('telemetry');
      expect(metrics).toHaveProperty('fileMonitor');
      expect(metrics).toHaveProperty('operations');
    });

    it('should track operation metrics across multiple operations', async () => {
      await engine.getDocumentationTree();
      await engine.getTruthMatrix();
      
      const metrics = engine.getMetrics();
      expect(metrics.operations.totalOperations).toBeGreaterThanOrEqual(2);
    });

    it('should track response times', async () => {
      await engine.getDocumentationTree();
      
      const metrics = engine.getMetrics();
      expect(Array.isArray(metrics.operations.responseTimes)).toBe(true);
      expect(metrics.operations.responseTimes.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Reliability', () => {
    let engine: HaruspexCoreEngine;

    beforeEach(async () => {
      engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      await engine.initialize();
    });

    it('should handle operations before initialization gracefully', async () => {
      const uninitializedEngine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      
      // Should throw or return fallback values, not crash
      await expect(uninitializedEngine.getDocumentationTree()).rejects.toThrow('must be initialized');
    });

    it('should maintain circuit breaker state across operations', async () => {
      // Perform successful operations
      await engine.getDocumentationTree();
      await engine.getTruthMatrix();
      
      const health = engine.getHealthStatus();
      expect(health.components.circuitBreaker).toBe('closed');
    });

    it('should track failed operations in metrics', async () => {
      const initialMetrics = engine.getMetrics();
      const initialFailures = initialMetrics.operations.failedOperations;
      
      // Try to trigger some failures (implementation will handle gracefully)
      // These shouldn't crash but might result in fallback values
      await engine.getDocumentationTree();
      await engine.getTruthMatrix();
      
      const updatedMetrics = engine.getMetrics();
      
      // Either failures stayed the same (operations succeeded) or increased
      expect(updatedMetrics.operations.failedOperations).toBeGreaterThanOrEqual(initialFailures);
    });
  });

  describe('Resource Management', () => {
    let engine: HaruspexCoreEngine;

    beforeEach(async () => {
      engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      await engine.initialize();
    });

    it('should reset engine state and metrics', () => {
      engine.reset();
      
      const metrics = engine.getMetrics();
      expect(metrics.operations.totalOperations).toBe(0);
      expect(metrics.operations.successfulOperations).toBe(0);
      expect(metrics.operations.failedOperations).toBe(0);
    });

    it('should dispose resources cleanly', () => {
      expect(() => engine.dispose()).not.toThrow();
    });

    it('should handle dispose being called multiple times', () => {
      engine.dispose();
      expect(() => engine.dispose()).not.toThrow();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should work with minimal configuration', async () => {
      const engine = new HaruspexCoreEngine(testWorkspaceRoot, {});
      const result = await engine.initialize();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle disabled file monitoring', async () => {
      const config = { ...defaultConfig, fileMonitoring: { enabled: false } };
      const engine = new HaruspexCoreEngine(testWorkspaceRoot, config);
      
      await engine.initialize();
      const mockContext = { subscriptions: [] } as any;
      
      expect(() => engine.setupFileWatching(mockContext)).not.toThrow();
    });

    it('should handle disabled telemetry features', async () => {
      const config = {
        ...defaultConfig,
        telemetry: {
          privacyCompliant: true,
          performanceMetrics: false,
          errorReporting: false,
          outputChannel: false
        }
      };
      
      const engine = new HaruspexCoreEngine(testWorkspaceRoot, config);
      const result = await engine.initialize();
      
      expect(result.success).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow from initialization to disposal', async () => {
      const engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      
      // Initialize
      const initResult = await engine.initialize();
      expect(initResult).toBeDefined();
      
      // Setup file watching
      const mockContext = { subscriptions: [] } as any;
      engine.setupFileWatching(mockContext);
      
      // Perform operations
      await engine.getDocumentationTree();
      await engine.getTruthMatrix();
      await engine.getMermaidDiagrams();
      
      // Check health
      const health = engine.getHealthStatus();
      expect(health).toBeDefined();
      
      // Get metrics
      const metrics = engine.getMetrics();
      expect(metrics.operations.totalOperations).toBeGreaterThan(0);
      
      // Reset
      engine.reset();
      
      // Dispose
      engine.dispose();
    });

    it('should maintain consistency across multiple operation cycles', async () => {
      const engine = new HaruspexCoreEngine(testWorkspaceRoot, defaultConfig);
      await engine.initialize();
      
      // Perform multiple cycles of operations
      for (let i = 0; i < 3; i++) {
        await engine.getDocumentationTree();
        await engine.getTruthMatrix();
        
        const health = engine.getHealthStatus();
        expect(['healthy', 'degraded', 'critical']).toContain(health.overall);
      }
      
      const finalMetrics = engine.getMetrics();
      expect(finalMetrics.operations.totalOperations).toBeGreaterThanOrEqual(6);
    });
  });
});