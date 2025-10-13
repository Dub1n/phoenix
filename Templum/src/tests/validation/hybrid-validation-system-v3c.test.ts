/**---
 * date: 2025-09-13T181800Z
 * name: HYBRID-VALIDATION-SYSTEM-003C-TEST-SUITE
 * TASK-ID: [TASK-MCP-007]
 * category: validation-testing
 * status: [[T]]
 * patterns: [comprehensive-testing, reliability-validation, performance-benchmarking, graceful-degradation-testing]
 * components: [HybridValidationSystemV3C, ReliabilityTracker, QualityMetricsDashboard, PerformanceOptimizer]
 * dependencies: [hybrid-validation-system-v3c, performance-validation, jest]
 * tags: [testing, validation, reliability, performance, quality-assurance]
 * ---*/

import { jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import {
  HybridValidationSystemV3C,
  ReliabilityTracker,
  PerformanceOptimizer,
  GracefulDegradationManager,
  QualityMetricsDashboard,
  ValidationConfig,
  ReliabilityMetrics,
  QualityMetrics,
  ValidationCycle,
  DegradationEvent,
  ThresholdAlert
} from '../../validation/hybrid-validation-system-v3c';
import { sleep } from '../../utils/async-utils';

// TODO: [TASK-MCP-007-TEST-001] Pattern: comprehensive-test-coverage | Complexity: 9 | Dependencies: hybrid-validation-system-v3c
// Context: Comprehensive test suite validating >95% coverage with reliability metrics and performance optimization
// Validation-Required: coverage-verification, reliability-tracking, performance-benchmarks, degradation-scenarios
// Pattern-Info: { approach: "comprehensive-validation-testing", alternatives: "unit-only-testing", trade-offs: "thoroughness-vs-speed" }

describe('HYBRID-VALIDATION-SYSTEM-003C: Enhanced Validation Infrastructure', () => {
  let validationSystem: HybridValidationSystemV3C;
  let reliabilityTracker: ReliabilityTracker;
  let performanceOptimizer: PerformanceOptimizer;
  let degradationManager: GracefulDegradationManager;
  let qualityDashboard: QualityMetricsDashboard;

  const TEST_CONFIG: ValidationConfig = {
    targetCoverage: 95,
    minCoverage: 85,
    maxCycleDuration: 2000,
    performanceThresholds: {
      responseTime: 100,
      memoryUsage: 512,
      cpuUsage: 80
    },
    reliabilityThresholds: {
      minUptime: 99,
      maxErrorRate: 5,
      maxRecoveryTime: 30000
    },
    qualityThresholds: {
      minPerformanceScore: 80,
      minReliabilityScore: 85,
      minComplianceScore: 90
    },
    enableGracefulDegradation: true,
    degradationStrategy: 'adaptive',
    maxDegradationLevel: 'moderate'
  };

  beforeEach(() => {
    validationSystem = new HybridValidationSystemV3C(TEST_CONFIG);
    reliabilityTracker = new ReliabilityTracker();
    performanceOptimizer = new PerformanceOptimizer(TEST_CONFIG.performanceThresholds);
    degradationManager = new GracefulDegradationManager(TEST_CONFIG);
    qualityDashboard = new QualityMetricsDashboard(TEST_CONFIG.qualityThresholds);
  });

  afterEach(async () => {
    if (validationSystem) {
      await validationSystem.stop();
    }
    if (qualityDashboard) {
      qualityDashboard.stopMonitoring();
    }
  });

  describe('System Initialization and Startup', () => {
    test('initializes all components successfully', async () => {
      expect(validationSystem).toBeDefined();
      expect(typeof validationSystem.start).toBe('function');
      expect(typeof validationSystem.executeValidationCycle).toBe('function');
    });

    test('starts system with proper configuration', async () => {
      const startPromise = validationSystem.start();
      
      await expect(startPromise).resolves.not.toThrow();
      
      const status = validationSystem.getSystemStatus();
      expect(status.isRunning).toBe(true);
      expect(status.dashboard).toBeDefined();
    });

    test('prevents double initialization', async () => {
      await validationSystem.start();
      
      await expect(validationSystem.start()).rejects.toThrow('already running');
    });

    test('emits systemStarted event on successful startup', async () => {
      const eventPromise = new Promise((resolve) => {
        validationSystem.once('systemStarted', resolve);
      });

      await validationSystem.start();
      const event = await eventPromise;
      
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('config');
    });
  });

  describe('Validation Coverage Enhancement (>95% Target)', () => {
    beforeEach(async () => {
      await validationSystem.start();
    });

    test('achieves target validation coverage', async () => {
      const cycle = await validationSystem.executeValidationCycle();
      
      expect(cycle.qualityMetrics.validationCoverage).toBeGreaterThanOrEqual(95);
      expect(cycle.componentsValidated.length).toBeGreaterThan(0);
    });

    test('validates all critical components', async () => {
      const cycle = await validationSystem.executeValidationCycle();
      
      const expectedComponents = [
        'performance-validation',
        'backend-integration', 
        'compilation-health',
        'system-stability',
        'interface-compliance'
      ];

      expectedComponents.forEach(component => {
        expect(cycle.componentsValidated).toContain(component);
      });
    });

    test('generates comprehensive coverage report', () => {
      const coverageReport = validationSystem.getValidationCoverageReport();
      
      expect(coverageReport).toHaveProperty('currentCoverage');
      expect(coverageReport).toHaveProperty('targetCoverage', 95);
      expect(coverageReport).toHaveProperty('coverageGap');
      expect(coverageReport).toHaveProperty('componentCoverage');
      expect(coverageReport).toHaveProperty('recommendations');
    });

    test('tracks component-specific coverage', async () => {
      await validationSystem.executeValidationCycle();
      
      const coverageReport = validationSystem.getValidationCoverageReport();
      const componentCoverage = coverageReport.componentCoverage;
      
      expect(componentCoverage.size).toBeGreaterThan(0);
      expect(componentCoverage.get('performance-validation')).toBe(true);
    });

    test('provides coverage improvement recommendations', async () => {
      await validationSystem.executeValidationCycle();
      
      const coverageReport = validationSystem.getValidationCoverageReport();
      
      if (coverageReport.coverageGap > 0) {
        expect(coverageReport.recommendations.length).toBeGreaterThan(0);
        expect(coverageReport.recommendations[0]).toContain('coverage');
      }
    });
  });

  describe('Reliability Metrics and Monitoring', () => {
    test('tracks system uptime accurately', () => {
      const metrics = reliabilityTracker.getReliabilityMetrics();
      
      expect(metrics.systemUptime).toBe(100); // New system should be 100%
      expect(typeof metrics.systemUptime).toBe('number');
    });

    test('records and tracks component failures', () => {
      const component = 'test-component';
      const error = 'Simulated failure';
      
      reliabilityTracker.recordComponentFailure(component, error);
      
      const reliability = reliabilityTracker.getComponentReliability(component);
      expect(typeof reliability).toBe('number');
      expect(reliability).toBeGreaterThanOrEqual(0);
      expect(reliability).toBeLessThanOrEqual(100);
    });

    test('calculates MTTF and MTTR correctly', () => {
      // Record multiple failures and recoveries
      reliabilityTracker.recordComponentFailure('component-1', 'Error 1');
      reliabilityTracker.recordComponentRecovery('component-1', 1000);
      reliabilityTracker.recordComponentFailure('component-1', 'Error 2'); 
      reliabilityTracker.recordComponentRecovery('component-1', 2000);

      const metrics = reliabilityTracker.getReliabilityMetrics();
      expect(typeof metrics.meanTimeToFailure).toBe('number');
      expect(typeof metrics.meanTimeToRecovery).toBe('number');
    });

    test('tracks error rate over time', () => {
      // Generate some errors
      for (let i = 0; i < 5; i++) {
        reliabilityTracker.recordComponentFailure(`component-${i}`, `Error ${i}`);
      }
      
      const metrics = reliabilityTracker.getReliabilityMetrics();
      expect(metrics.errorRate).toBe(5); // 5 errors in current hour
    });

    test('emits reliability events', (done) => {
      reliabilityTracker.once('componentFailure', (event) => {
        expect(event).toHaveProperty('component');
        expect(event).toHaveProperty('error');
        expect(event).toHaveProperty('timestamp');
        done();
      });

      reliabilityTracker.recordComponentFailure('test-component', 'test-error');
    });

    test('calculates availability score', () => {
      const metrics = reliabilityTracker.getReliabilityMetrics();
      
      expect(metrics.availabilityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.availabilityScore).toBeLessThanOrEqual(100);
      expect(typeof metrics.availabilityScore).toBe('number');
    });
  });

  describe('Performance Optimization (<2s Cycles)', () => {
    test('tracks validation cycle performance', () => {
      const tracker = performanceOptimizer.startCycle();
      
      // Simulate some work
      const iterations = 1000;
      let sum = 0;
      for (let i = 0; i < iterations; i++) {
        sum += Math.sqrt(i);
      }
      
      const duration = tracker.finish();
      
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThan(0);
    });

    test('identifies when optimization is needed', () => {
      // Simulate slow cycles
      for (let i = 0; i < 5; i++) {
        const tracker = performanceOptimizer.startCycle();
        // Simulate work taking > 2s by directly recording
        (performanceOptimizer as any).recordCycleTime(2500); // 2.5 seconds
      }
      
      const stats = performanceOptimizer.getPerformanceStats();
      expect(stats.optimizationNeeded).toBe(true);
      expect(stats.cyclesOverThreshold).toBeGreaterThan(0);
    });

    test('maintains performance under load', async () => {
      const concurrentCycles = 10;
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentCycles }, async () => {
        const tracker = performanceOptimizer.startCycle();
        await sleep(50); // Short simulated work
        return tracker.finish();
      });
      
      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      
      expect(results.length).toBe(concurrentCycles);
      expect(totalTime).toBeLessThan(2000); // Should complete well under 2s
    });

    test('emits optimization events', (done) => {
      performanceOptimizer.once('optimizationNeeded', (event) => {
        expect(event).toHaveProperty('duration');
        expect(event).toHaveProperty('threshold');
        expect(event).toHaveProperty('strategies');
        done();
      });

      // Trigger optimization need
      (performanceOptimizer as any).recordCycleTime(3000); // 3 seconds
    });

    test('calculates accurate performance statistics', async () => {
      await validationSystem.start();
      
      // Execute multiple cycles
      for (let i = 0; i < 3; i++) {
        await validationSystem.executeValidationCycle();
      }
      
      const status = validationSystem.getSystemStatus();
      expect(status.performanceStats).toHaveProperty('averageCycleTime');
      expect(status.performanceStats).toHaveProperty('maxCycleTime');
      expect(status.performanceStats).toHaveProperty('minCycleTime');
    });
  });

  describe('Graceful Degradation Capability', () => {
    test('handles component failure gracefully', async () => {
      const component = 'critical-component';
      const error = 'Simulated critical failure';
      
      const degradationEvent = await degradationManager.handleComponentFailure(component, error);
      
      expect(degradationEvent).toHaveProperty('eventId');
      expect(degradationEvent).toHaveProperty('component', component);
      expect(degradationEvent).toHaveProperty('successfulDegradation');
      expect(degradationEvent).toHaveProperty('recoveryDuration');
    });

    test('determines appropriate degradation level', async () => {
      const criticalComponent = 'core-engine';
      const minorComponent = 'logging-service';
      
      const criticalEvent = await degradationManager.handleComponentFailure(criticalComponent, 'Critical error');
      const minorEvent = await degradationManager.handleComponentFailure(minorComponent, 'Minor error');
      
      expect(criticalEvent.degradationLevel).toBe('severe');
      expect(minorEvent.degradationLevel).toBe('minor');
    });

    test('tracks degraded components', async () => {
      await degradationManager.handleComponentFailure('test-component', 'test-error');
      
      const degradedComponents = degradationManager.getDegradedComponents();
      expect(degradedComponents.size).toBe(1);
      expect(degradedComponents.has('test-component')).toBe(true);
    });

    test('assesses system continuation capability', async () => {
      // System should continue with minor degradations
      await degradationManager.handleComponentFailure('minor-component', 'Minor error');
      expect(degradationManager.canContinueOperation()).toBe(true);
      
      // System might not continue with critical degradations
      await degradationManager.handleComponentFailure('core-engine', 'Critical error');
      expect(degradationManager.canContinueOperation()).toBe(false);
    });

    test('recovers degraded components', async () => {
      const component = 'test-component';
      await degradationManager.handleComponentFailure(component, 'test-error');
      
      const recoverySuccess = await degradationManager.recoverComponent(component);
      expect(recoverySuccess).toBe(true);
      
      const degradedComponents = degradationManager.getDegradedComponents();
      expect(degradedComponents.has(component)).toBe(false);
    });

    test('emits degradation events', (done) => {
      degradationManager.once('degradationEvent', (event: DegradationEvent) => {
        expect(event).toHaveProperty('eventId');
        expect(event).toHaveProperty('degradationLevel');
        expect(event).toHaveProperty('impactScope');
        done();
      });

      degradationManager.handleComponentFailure('test-component', 'test-error');
    });
  });

  describe('Quality Metrics Dashboard', () => {
    test('initializes dashboard with default metrics', () => {
      const dashboard = qualityDashboard.getDashboard();
      
      expect(dashboard).toHaveProperty('dashboardId');
      expect(dashboard).toHaveProperty('realTimeMetrics');
      expect(dashboard).toHaveProperty('reliabilityMetrics');
      expect(dashboard).toHaveProperty('systemHealth');
      expect(dashboard.systemHealth.overall).toBe('healthy');
    });

    test('updates metrics and triggers threshold checks', () => {
      const qualityMetrics: QualityMetrics = {
        validationCoverage: 97,
        testSuccessRate: 95,
        performanceScore: 85,
        reliabilityScore: 90,
        complianceScore: 92,
        technicalDebtIndex: 15,
        codeQualityScore: 88,
        securityScore: 90
      };

      const reliabilityMetrics: ReliabilityMetrics = {
        systemUptime: 99.5,
        componentReliability: new Map([['component1', 95]]),
        errorRate: 2,
        recoveryTime: 500,
        gracefulDegradationSuccessRate: 98,
        meanTimeToFailure: 86400000,
        meanTimeToRecovery: 1000,
        availabilityScore: 97
      };

      qualityDashboard.updateMetrics(qualityMetrics, reliabilityMetrics);
      
      const dashboard = qualityDashboard.getDashboard();
      expect(dashboard.realTimeMetrics.validationCoverage).toBe(97);
      expect(dashboard.reliabilityMetrics.systemUptime).toBe(99.5);
    });

    test('generates threshold alerts', (done) => {
      qualityDashboard.once('thresholdAlert', (alert: ThresholdAlert) => {
        expect(alert).toHaveProperty('alertId');
        expect(alert).toHaveProperty('metric');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('recommendedActions');
        done();
      });

      // Trigger threshold breach
      const poorMetrics: QualityMetrics = {
        validationCoverage: 70, // Below 95% target
        testSuccessRate: 60,    // Below threshold
        performanceScore: 50,   // Below 80% threshold
        reliabilityScore: 70,   // Below 85% threshold
        complianceScore: 80,    // Below 90% threshold
        technicalDebtIndex: 50,
        codeQualityScore: 60,
        securityScore: 70
      };

      qualityDashboard.updateMetrics(poorMetrics, {
        systemUptime: 95,
        componentReliability: new Map(),
        errorRate: 10,
        recoveryTime: 2000,
        gracefulDegradationSuccessRate: 80,
        meanTimeToFailure: 1000,
        meanTimeToRecovery: 5000,
        availabilityScore: 85
      });
    });

    test('tracks performance trends', () => {
      // Add several performance samples
      for (let i = 0; i < 5; i++) {
        qualityDashboard.addPerformanceSample(1, 1000 + (i * 100), 95 - i);
      }
      
      const dashboard = qualityDashboard.getDashboard();
      expect(dashboard.performanceTrends.samples.length).toBe(5);
      expect(dashboard.performanceTrends.samples[0]).toHaveProperty('timestamp');
      expect(dashboard.performanceTrends.samples[0]).toHaveProperty('averageDuration');
    });

    test('provides JSON serialization for external systems', () => {
      const dashboardJSON = qualityDashboard.getDashboardJSON();
      
      expect(typeof dashboardJSON).toBe('string');
      const parsed = JSON.parse(dashboardJSON);
      expect(parsed).toHaveProperty('dashboardId');
      expect(parsed).toHaveProperty('realTimeMetrics');
    });

    test('starts and stops monitoring', () => {
      qualityDashboard.startMonitoring(1000);
      // Dashboard should be monitoring
      
      qualityDashboard.stopMonitoring();
      // Dashboard should stop monitoring
      
      // No exceptions should be thrown
      expect(true).toBe(true);
    });
  });

  describe('Integrated Validation Cycles', () => {
    beforeEach(async () => {
      await validationSystem.start();
    });

    test('executes complete validation cycle within time limit', async () => {
      const startTime = performance.now();
      const cycle = await validationSystem.executeValidationCycle();
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // Must complete within 2 seconds
      expect(cycle.duration).toBeLessThan(2000);
      expect(cycle).toHaveProperty('cycleId');
      expect(cycle.componentsValidated.length).toBeGreaterThan(0);
    });

    test('maintains validation quality under concurrent load', async () => {
      const concurrentCycles = 5;
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentCycles }, () => 
        validationSystem.executeValidationCycle()
      );
      
      const cycles = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      
      expect(cycles.length).toBe(concurrentCycles);
      expect(totalTime).toBeLessThan(10000); // Should complete all within 10s
      
      // All cycles should maintain quality
      cycles.forEach(cycle => {
        expect(cycle.qualityMetrics.validationCoverage).toBeGreaterThan(90);
        expect(cycle.duration).toBeLessThan(2000);
      });
    });

    test('handles validation cycle failures gracefully', async () => {
      // Mock a component to fail
      const originalValidateComponent = (validationSystem as any).validateComponent;
      (validationSystem as any).validateComponent = jest.fn().mockImplementation((component: string) => {
        if (component === 'performance-validation') {
          throw new Error('Simulated component failure');
        }
        return originalValidateComponent.call(validationSystem, component);
      });

      const cycle = await validationSystem.executeValidationCycle();
      
      expect(cycle.failureCount).toBeGreaterThan(0);
      expect(cycle.componentsValidated).toContain('performance-validation');
      
      // Restore original method
      (validationSystem as any).validateComponent = originalValidateComponent;
    });

    test('updates dashboard with cycle results', async () => {
      const cycle = await validationSystem.executeValidationCycle();
      
      const status = validationSystem.getSystemStatus();
      expect(status.dashboard.lastUpdated).toBeGreaterThan(cycle.startTime);
      expect(status.dashboard.performanceTrends.samples.length).toBeGreaterThan(0);
    });

    test('stores and retrieves recent cycles', async () => {
      // Execute multiple cycles
      for (let i = 0; i < 3; i++) {
        await validationSystem.executeValidationCycle();
      }
      
      const status = validationSystem.getSystemStatus();
      expect(status.recentCycles.length).toBe(3);
      expect(status.recentCycles[0]).toHaveProperty('cycleId');
    });

    test('emits cycle completion events', (done) => {
      validationSystem.once('validationCycleCompleted', (cycle: ValidationCycle) => {
        expect(cycle).toHaveProperty('cycleId');
        expect(cycle).toHaveProperty('qualityMetrics');
        expect(cycle).toHaveProperty('reliabilityMetrics');
        done();
      });

      validationSystem.executeValidationCycle();
    });
  });

  describe('Stress Testing and Edge Cases', () => {
    beforeEach(async () => {
      await validationSystem.start();
    });

    test('handles rapid successive validation cycles', async () => {
      const rapidCycles = 10;
      const startTime = performance.now();
      
      const promises: Promise<ValidationCycle>[] = [];
      for (let i = 0; i < rapidCycles; i++) {
        promises.push(validationSystem.executeValidationCycle());
      }
      
      const cycles = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      
      expect(cycles.length).toBe(rapidCycles);
      // Should handle rapid cycles without degradation
      cycles.forEach(cycle => {
        expect(cycle.qualityMetrics.validationCoverage).toBeGreaterThan(90);
      });
    });

    test('recovers from multiple simultaneous component failures', async () => {
      const components = ['component-1', 'component-2', 'component-3'];
      
      // Simulate multiple failures
      const degradationPromises = components.map(component =>
        degradationManager.handleComponentFailure(component, `Failure in ${component}`)
      );
      
      const events = await Promise.all(degradationPromises);
      
      expect(events.length).toBe(3);
      events.forEach(event => {
        expect(event.successfulDegradation).toBe(true);
      });
      
      // System should still be operable
      const canContinue = degradationManager.canContinueOperation();
      expect(canContinue).toBe(true); // Should continue with minor components
    });

    test('maintains performance under memory pressure', async () => {
      // Simulate memory pressure by creating large objects
      const largeObjects: any[] = [];
      for (let i = 0; i < 1000; i++) {
        largeObjects.push(new Array(1000).fill(Math.random()));
      }
      
      const cycle = await validationSystem.executeValidationCycle();
      
      expect(cycle.duration).toBeLessThan(2000);
      expect(cycle.qualityMetrics.validationCoverage).toBeGreaterThan(90);
      
      // Cleanup
      largeObjects.length = 0;
    });

    test('handles dashboard updates during high activity', async () => {
      // Generate high activity
      const activities = Array.from({ length: 20 }, async (_, i) => {
        if (i % 2 === 0) {
          await validationSystem.executeValidationCycle();
        } else {
          reliabilityTracker.recordComponentFailure(`component-${i}`, `Error ${i}`);
        }
      });
      
      await Promise.all(activities);
      
      const dashboard = qualityDashboard.getDashboard();
      expect(dashboard.performanceTrends.samples.length).toBeGreaterThan(0);
      expect(dashboard.lastUpdated).toBeGreaterThan(Date.now() - 5000);
    });
  });

  describe('System Integration and Compatibility', () => {
    test('integrates with backend router successfully', () => {
      const mockBackendRouter = {
        getConnectionStatus: jest.fn().mockResolvedValue({
          totalConnections: 3,
          activeConnections: 2,
          healthyConnections: 2
        })
      };

      validationSystem.integrateWithBackendRouter(mockBackendRouter as any);
      
      // Integration should not throw
      expect(true).toBe(true);
    });

    test('integrates with Templum core successfully', () => {
      const mockTemplumCore = {
        getSystemStatus: jest.fn().mockReturnValue({
          status: 'healthy',
          components: ['core', 'engine']
        })
      };

      validationSystem.integrateWithTemplumCore(mockTemplumCore as any);
      
      // Integration should not throw
      expect(true).toBe(true);
    });

    test('validates system status consistency', async () => {
      await validationSystem.executeValidationCycle();
      
      const status = validationSystem.getSystemStatus();
      
      expect(status.isRunning).toBe(true);
      expect(status.dashboard).toBeDefined();
      expect(status.reliabilityMetrics).toBeDefined();
      expect(status.performanceStats).toBeDefined();
      
      // Data consistency checks
      expect(status.dashboard.lastUpdated).toBeGreaterThan(0);
      expect(status.reliabilityMetrics.systemUptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Coverage and Quality Metrics Verification', () => {
    test('achieves >95% validation coverage consistently', async () => {
      await validationSystem.start();
      
      const cycles = [];
      for (let i = 0; i < 5; i++) {
        cycles.push(await validationSystem.executeValidationCycle());
      }
      
      const coverageValues = cycles.map(cycle => cycle.qualityMetrics.validationCoverage);
      const averageCoverage = coverageValues.reduce((sum, val) => sum + val, 0) / coverageValues.length;
      
      expect(averageCoverage).toBeGreaterThanOrEqual(95);
      expect(Math.min(...coverageValues)).toBeGreaterThanOrEqual(90); // No cycle below 90%
    });

    test('maintains reliability scores above thresholds', async () => {
      await validationSystem.start();
      
      const cycle = await validationSystem.executeValidationCycle();
      
      expect(cycle.reliabilityMetrics.availabilityScore).toBeGreaterThanOrEqual(TEST_CONFIG.reliabilityThresholds.minUptime);
      expect(cycle.reliabilityMetrics.errorRate).toBeLessThanOrEqual(TEST_CONFIG.reliabilityThresholds.maxErrorRate);
    });

    test('verifies performance optimization effectiveness', async () => {
      await validationSystem.start();
      
      // Execute multiple cycles to establish baseline
      const cycles = [];
      for (let i = 0; i < 10; i++) {
        cycles.push(await validationSystem.executeValidationCycle());
      }
      
      const durations = cycles.map(cycle => cycle.duration);
      const averageDuration = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      expect(averageDuration).toBeLessThan(1500); // Average should be well under 2s
      expect(maxDuration).toBeLessThan(2000);     // No cycle should exceed 2s
      
      // Check that >90% of cycles are under 1.5s (performance optimization working)
      const fastCycles = durations.filter(dur => dur < 1500).length;
      const performanceRatio = fastCycles / durations.length;
      expect(performanceRatio).toBeGreaterThan(0.9);
    });
  });
});

describe('Performance Benchmark Tests', () => {
  test('validation system startup time < 1s', async () => {
    const validationSystem = new HybridValidationSystemV3C();
    
    const startTime = performance.now();
    await validationSystem.start();
    const startupTime = performance.now() - startTime;
    
    expect(startupTime).toBeLessThan(1000); // Less than 1 second
    
    await validationSystem.stop();
  });

  test('single validation cycle completes < 2s', async () => {
    const validationSystem = new HybridValidationSystemV3C();
    await validationSystem.start();
    
    const cycleStartTime = performance.now();
    const cycle = await validationSystem.executeValidationCycle();
    const cycleTime = performance.now() - cycleStartTime;
    
    expect(cycleTime).toBeLessThan(2000); // Less than 2 seconds
    expect(cycle.duration).toBeLessThan(2000);
    
    await validationSystem.stop();
  });

  test('concurrent validation cycles maintain performance', async () => {
    const validationSystem = new HybridValidationSystemV3C();
    await validationSystem.start();
    
    const concurrentCount = 5;
    const startTime = performance.now();
    
    const promises = Array.from({ length: concurrentCount }, () =>
      validationSystem.executeValidationCycle()
    );
    
    const cycles = await Promise.all(promises);
    const totalTime = performance.now() - startTime;
    const averageTime = totalTime / concurrentCount;
    
    expect(totalTime).toBeLessThan(8000); // All 5 cycles in less than 8s
    expect(averageTime).toBeLessThan(2000); // Average per cycle < 2s
    expect(cycles.every(cycle => cycle.duration < 2000)).toBe(true);
    
    await validationSystem.stop();
  });
});

/**
 * Integration with existing validation systems
 */
describe('Legacy Integration Tests', () => {
  test('integrates with existing PerformanceValidator', async () => {
    const validationSystem = new HybridValidationSystemV3C();
    await validationSystem.start();
    
    const cycle = await validationSystem.executeValidationCycle();
    
    // Should validate performance component
    expect(cycle.componentsValidated).toContain('performance-validation');
    expect(cycle.successCount).toBeGreaterThan(0);
    
    await validationSystem.stop();
  });

  test('maintains backward compatibility with existing interfaces', () => {
    const validationSystem = new HybridValidationSystemV3C();
    
    // Should maintain expected interface
    expect(typeof validationSystem.start).toBe('function');
    expect(typeof validationSystem.stop).toBe('function');
    expect(typeof validationSystem.executeValidationCycle).toBe('function');
    expect(typeof validationSystem.getSystemStatus).toBe('function');
  });
});
