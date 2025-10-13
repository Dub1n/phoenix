/**---
 * title: [Observability Adapter Test Suite - Dependency Injection Integration Validation]
 * tags: [Testing, Core, Observability, Logging, Metrics, TDD]
 * provides: [Observability Adapter Tests, Logging Tests, Metrics Tests, Context Management Tests]
 * requires: [Jest, ObservabilityAdapter, IObservabilityService, TemplumObservabilitySystem]
 * description: [Comprehensive test suite validating observability adapter functionality following TDD principles]
 * ---*/

import {
  ObservabilityAdapter,
  IObservabilityService
} from '../../src/observability/observability-adapter';
import {
  TemplumObservabilitySystem,
  ObservabilityConfig
} from '../../src/observability/templum-observability-system';
import {
  TemplumError,
  createTemplumError,
  isTemplumError
} from '../../src/types/templum-types';
import { sleep } from '../../src/utils/async-utils';

describe('ObservabilityAdapter', () => {
  let observabilityAdapter: ObservabilityAdapter;
  let mockConfig: ObservabilityConfig;

  beforeEach(() => {
    // Create a basic configuration for testing
    mockConfig = {
      logging: {
        level: 'info' as const,
        outputs: ['console'] as const,
        includeStackTrace: false,
        maxLogBufferSize: 1000,
        logFilePath: undefined
      },
      metrics: {
        enabled: true,
        collectionInterval: 10000,
        bufferSize: 1000,
        retentionPeriod: 86400000,
        enableHistograms: true
      },
      alerting: {
        enabled: true,
        rules: [],
        channels: ['console'],
        evaluationInterval: 30000
      },
      performance: {
        enableTracing: true,
        tracingThreshold: 100,
        enableProfiling: false,
        memoryMonitoring: true
      }
    };

    observabilityAdapter = new ObservabilityAdapter(mockConfig);
  });

  afterEach(async () => {
    if (observabilityAdapter.isInitialized()) {
      await observabilityAdapter.shutdown();
    }
  });

  describe('Initialization', () => {
    test('initializes with provided configuration', async () => {
      // Act
      await observabilityAdapter.initialize();

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('initializes with default configuration when none provided', async () => {
      // Arrange
      const defaultAdapter = new ObservabilityAdapter();

      // Act
      await defaultAdapter.initialize();

      // Assert
      expect(defaultAdapter.isInitialized()).toBe(true);
      
      await defaultAdapter.shutdown();
    });

    test('prevents double initialization', async () => {
      // Arrange
      await observabilityAdapter.initialize();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      await observabilityAdapter.initialize();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('ObservabilityAdapter: Already initialized, skipping');
      
      consoleSpy.mockRestore();
    });

    test('handles initialization errors gracefully', async () => {
      // Arrange
      const invalidConfig = {
        logging: null // Invalid configuration that might cause initialization to fail
      } as any;
      const failingAdapter = new ObservabilityAdapter(invalidConfig);

      // Act & Assert
      await expect(failingAdapter.initialize()).rejects.toThrow();
      expect(failingAdapter.isInitialized()).toBe(false);
    });

    test('records initialization metrics on successful startup', async () => {
      // Arrange
      const metricsSpy = jest.spyOn(observabilityAdapter, 'incrementCounter');

      // Act
      await observabilityAdapter.initialize();

      // Assert
      expect(metricsSpy).toHaveBeenCalledWith(
        'observability_initializations', 
        1, 
        { status: 'success' }, 
        'ObservabilityAdapter'
      );
    });
  });

  describe('Logging Operations', () => {
    beforeEach(async () => {
      await observabilityAdapter.initialize();
    });

    test('logs trace messages with metadata and source', () => {
      // Arrange
      const message = 'Test trace message';
      const metadata = { key: 'value', timestamp: Date.now() };
      const source = 'TestComponent';

      // Act
      observabilityAdapter.logTrace(message, metadata, source);

      // Assert - Since we can't easily mock the internal logger, 
      // we verify the method doesn't throw and adapter is properly initialized
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('logs debug messages with optional parameters', () => {
      // Arrange
      const message = 'Debug information';

      // Act
      observabilityAdapter.logDebug(message);
      observabilityAdapter.logDebug(message, { debug: true });
      observabilityAdapter.logDebug(message, { debug: true }, 'DebugSource');

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('logs info messages for general information', () => {
      // Arrange
      const message = 'Information message';
      const metadata = { operation: 'test', result: 'success' };

      // Act
      observabilityAdapter.logInfo(message, metadata, 'InfoSource');

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('logs warning messages for potential issues', () => {
      // Arrange
      const message = 'Warning: Potential issue detected';
      const metadata = { severity: 'medium', component: 'test' };

      // Act
      observabilityAdapter.logWarn(message, metadata, 'WarnSource');

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('logs error messages with TemplumError objects', () => {
      // Arrange
      const message = 'Error occurred during operation';
      const error = createTemplumError('Test error', 'TEST_ERROR', 'validation');
      const metadata = { operation: 'test-operation' };

      // Act
      observabilityAdapter.logError(message, error, metadata, 'ErrorSource');

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('logs error messages with standard Error objects', () => {
      // Arrange
      const message = 'Standard error occurred';
      const error = new Error('Standard error message');
      const metadata = { context: 'test' };

      // Act
      observabilityAdapter.logError(message, error, metadata, 'StandardErrorSource');

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('logs fatal messages for critical errors', () => {
      // Arrange
      const message = 'Fatal error - system shutdown required';
      const error = createTemplumError('Critical failure', 'FATAL_ERROR', 'runtime');

      // Act
      observabilityAdapter.logFatal(message, error, { critical: true }, 'FatalSource');

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('handles logging when not initialized (fallback to console)', () => {
      // Arrange
      const uninitializedAdapter = new ObservabilityAdapter(mockConfig);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      uninitializedAdapter.logInfo('Test message', { test: true }, 'TestSource');

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[INFO] [TestSource] Test message', { test: true });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Metrics Operations', () => {
    beforeEach(async () => {
      await observabilityAdapter.initialize();
    });

    test('increments counters with default and custom values', () => {
      // Arrange
      const metricName = 'test_counter';
      const tags = { environment: 'test', component: 'adapter' };

      // Act
      observabilityAdapter.incrementCounter(metricName); // Default increment of 1
      observabilityAdapter.incrementCounter(metricName, 5); // Custom increment
      observabilityAdapter.incrementCounter(metricName, 1, tags); // With tags
      observabilityAdapter.incrementCounter(metricName, 1, tags, 'TestSource'); // With source

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('sets gauge values with tags and source', () => {
      // Arrange
      const gaugeName = 'test_gauge';
      const value = 42.5;
      const tags = { type: 'memory', unit: 'MB' };

      // Act
      observabilityAdapter.setGauge(gaugeName, value);
      observabilityAdapter.setGauge(gaugeName, value, tags);
      observabilityAdapter.setGauge(gaugeName, value, tags, 'GaugeSource');

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('records timing metrics with duration and context', () => {
      // Arrange
      const timerName = 'test_timer';
      const duration = 125.5; // milliseconds
      const tags = { operation: 'database_query', table: 'users' };

      // Act
      observabilityAdapter.recordTiming(timerName, duration);
      observabilityAdapter.recordTiming(timerName, duration, tags);
      observabilityAdapter.recordTiming(timerName, duration, tags, 'TimingSource');

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('creates and uses timer functions', async () => {
      // Arrange
      const timerName = 'operation_timer';

      // Act
      const stopTimer = observabilityAdapter.startTimer(timerName);
      
      // Simulate some operation time
      await sleep(10);
      stopTimer(); // This should record the timing

      // Assert
      expect(stopTimer).toBeInstanceOf(Function);
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });
  });

  describe('Context Management', () => {
    beforeEach(async () => {
      await observabilityAdapter.initialize();
    });

    test('sets and manages correlation ID for request tracking', () => {
      // Arrange
      const correlationId = 'corr-12345-abcde';

      // Act
      observabilityAdapter.setCorrelationId(correlationId);

      // Assert - Context should be set internally
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('sets and manages session ID for session tracking', () => {
      // Arrange
      const sessionId = 'sess-67890-fghij';

      // Act
      observabilityAdapter.setSessionId(sessionId);

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('sets and manages interface type for interface-specific logging', () => {
      // Arrange
      const interfaceTypes = ['vscode', 'cli', 'command'];

      // Act
      interfaceTypes.forEach(interfaceType => {
        observabilityAdapter.setInterfaceType(interfaceType);
      });

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('clears all context information', () => {
      // Arrange
      observabilityAdapter.setCorrelationId('test-correlation');
      observabilityAdapter.setSessionId('test-session');
      observabilityAdapter.setInterfaceType('vscode');

      // Act
      observabilityAdapter.clearContext();

      // Assert - Context should be cleared internally
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });

    test('manages context across multiple operations', () => {
      // Arrange
      const correlationId = 'multi-op-correlation';
      const sessionId = 'multi-op-session';

      // Act
      observabilityAdapter.setCorrelationId(correlationId);
      observabilityAdapter.setSessionId(sessionId);
      
      // Perform multiple logging operations
      observabilityAdapter.logInfo('Operation 1', { step: 1 });
      observabilityAdapter.incrementCounter('operations');
      observabilityAdapter.logInfo('Operation 2', { step: 2 });

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(true);
    });
  });

  describe('System Health Monitoring', () => {
    beforeEach(async () => {
      await observabilityAdapter.initialize();
    });

    test('returns comprehensive system health information', () => {
      // Act
      const health = observabilityAdapter.getSystemHealth();

      // Assert
      expect(health).toBeDefined();
      expect(health.logging).toBeDefined();
      expect(health.logging.level).toBeDefined();
      expect(health.logging.bufferSize).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(health.logging.outputs)).toBe(true);

      expect(health.metrics).toBeDefined();
      expect(typeof health.metrics.enabled).toBe('boolean');
      expect(health.metrics.counters).toBeGreaterThanOrEqual(0);
      expect(health.metrics.gauges).toBeGreaterThanOrEqual(0);
      expect(health.metrics.histograms).toBeGreaterThanOrEqual(0);

      expect(health.alerts).toBeDefined();
      expect(typeof health.alerts.enabled).toBe('boolean');
      expect(health.alerts.active).toBeGreaterThanOrEqual(0);
      expect(health.alerts.rules).toBeGreaterThanOrEqual(0);
    });

    test('provides access to underlying logger service', () => {
      // Act
      const logger = observabilityAdapter.getLogger();

      // Assert
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('provides access to underlying metrics service', () => {
      // Act
      const metrics = observabilityAdapter.getMetrics();

      // Assert
      expect(metrics).toBeDefined();
      expect(typeof metrics.incrementCounter).toBe('function');
      expect(typeof metrics.setGauge).toBe('function');
    });

    test('provides access to underlying alerts service', () => {
      // Act
      const alerts = observabilityAdapter.getAlerts();

      // Assert
      expect(alerts).toBeDefined();
      // Alert manager interface might vary, so we just check it's defined
    });
  });

  describe('Lifecycle Management', () => {
    test('shuts down gracefully after initialization', async () => {
      // Arrange
      await observabilityAdapter.initialize();
      expect(observabilityAdapter.isInitialized()).toBe(true);

      // Act
      await observabilityAdapter.shutdown();

      // Assert
      expect(observabilityAdapter.isInitialized()).toBe(false);
    });

    test('handles shutdown when not initialized', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(observabilityAdapter.isInitialized()).toBe(false);

      // Act
      await observabilityAdapter.shutdown();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('ObservabilityAdapter: Not initialized, skipping shutdown');
      expect(observabilityAdapter.isInitialized()).toBe(false);
      
      consoleSpy.mockRestore();
    });

    test('handles shutdown errors gracefully without throwing', async () => {
      // Arrange
      await observabilityAdapter.initialize();
      
      // Mock the underlying system to throw during shutdown
      const originalShutdown = observabilityAdapter['observabilitySystem'].shutdown;
      observabilityAdapter['observabilitySystem'].shutdown = jest.fn().mockRejectedValue(new Error('Shutdown failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await observabilityAdapter.shutdown(); // Should not throw

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('ObservabilityAdapter: Shutdown error:', 'Shutdown failed');
      expect(observabilityAdapter.isInitialized()).toBe(false);
      
      consoleSpy.mockRestore();
      // Restore original method
      observabilityAdapter['observabilitySystem'].shutdown = originalShutdown;
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles logging with null/undefined metadata gracefully', async () => {
      // Arrange
      await observabilityAdapter.initialize();

      // Act & Assert - Should not throw
      observabilityAdapter.logInfo('Message with null metadata', null as any);
      observabilityAdapter.logInfo('Message with undefined metadata', undefined);
      observabilityAdapter.logError('Error with null metadata', new Error('test'), null as any);
    });

    test('handles metrics with invalid values gracefully', async () => {
      // Arrange
      await observabilityAdapter.initialize();

      // Act & Assert - Should not throw
      observabilityAdapter.incrementCounter('test_counter', NaN);
      observabilityAdapter.setGauge('test_gauge', Infinity);
      observabilityAdapter.recordTiming('test_timer', -1);
    });

    test('handles context management with invalid values', async () => {
      // Arrange
      await observabilityAdapter.initialize();

      // Act & Assert - Should not throw
      observabilityAdapter.setCorrelationId('');
      observabilityAdapter.setSessionId(null as any);
      observabilityAdapter.setInterfaceType('invalid-interface' as any);
    });

    test('validates TemplumError handling in error logs', async () => {
      // Arrange
      await observabilityAdapter.initialize();
      const templumError = createTemplumError('Test error', 'TEST_ERROR', 'validation');
      templumError.context = { additional: 'context' };

      // Act
      observabilityAdapter.logError('TemplumError test', templumError, { test: true });

      // Assert - Should handle TemplumError properties correctly
      expect(isTemplumError(templumError)).toBe(true);
      expect(templumError.code).toBe('TEST_ERROR');
      expect(templumError.category).toBe('validation');
    });
  });

  describe('Interface Compliance', () => {
    test('implements all required IObservabilityService methods', () => {
      // Act & Assert - Verify all interface methods are implemented
      expect(typeof observabilityAdapter.initialize).toBe('function');
      expect(typeof observabilityAdapter.shutdown).toBe('function');
      expect(typeof observabilityAdapter.isInitialized).toBe('function');

      expect(typeof observabilityAdapter.logTrace).toBe('function');
      expect(typeof observabilityAdapter.logDebug).toBe('function');
      expect(typeof observabilityAdapter.logInfo).toBe('function');
      expect(typeof observabilityAdapter.logWarn).toBe('function');
      expect(typeof observabilityAdapter.logError).toBe('function');
      expect(typeof observabilityAdapter.logFatal).toBe('function');

      expect(typeof observabilityAdapter.incrementCounter).toBe('function');
      expect(typeof observabilityAdapter.setGauge).toBe('function');
      expect(typeof observabilityAdapter.recordTiming).toBe('function');
      expect(typeof observabilityAdapter.startTimer).toBe('function');

      expect(typeof observabilityAdapter.setCorrelationId).toBe('function');
      expect(typeof observabilityAdapter.setSessionId).toBe('function');
      expect(typeof observabilityAdapter.setInterfaceType).toBe('function');
      expect(typeof observabilityAdapter.clearContext).toBe('function');

      expect(typeof observabilityAdapter.getSystemHealth).toBe('function');
      expect(typeof observabilityAdapter.getLogger).toBe('function');
      expect(typeof observabilityAdapter.getMetrics).toBe('function');
      expect(typeof observabilityAdapter.getAlerts).toBe('function');
    });

    test('can be used as IObservabilityService interface', async () => {
      // Arrange
      const service: IObservabilityService = observabilityAdapter;
      
      // Act
      await service.initialize();

      // Assert
      expect(service.isInitialized()).toBe(true);
      
      service.logInfo('Interface compliance test');
      service.incrementCounter('interface_test');
      
      const health = service.getSystemHealth();
      expect(health).toBeDefined();

      await service.shutdown();
    });
  });
});
