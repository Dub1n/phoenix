/**---
 * title: [Adapter Registry Test Suite - Dependency Injection Validation]
 * tags: [Testing, Core, Adapter-Registry, Dependency-Injection, TDD]
 * provides: [Adapter Registry Tests, Component Creation Tests, Dependency Wiring Tests]
 * requires: [Jest, TemplumAdapterRegistry, Core Component Interfaces]
 * description: [Comprehensive test suite validating adapter registry functionality following TDD principles]
 * ---*/

import { TemplumAdapterRegistry, TemplumComponentFactory } from '../../src/core/adapter-registry';
import { 
  ISkinEngine,
  IStateManager, 
  IBackendRouter,
  IBackendServiceRouter,
  IResourceManager,
  IDependencyInjectionConfig
} from '../../src/interfaces/core-component-interfaces';
import { IObservabilityService } from '../../src/observability/observability-adapter';
import { 
  TemplumError,
  createTemplumError
} from '../../src/types/templum-types';
import {
  LoggerConfig,
  LoggerTransport,
  LogLevel,
  LogRecord,
} from '../../src/utils/logger';

class RecordingTransport implements LoggerTransport {
  public readonly records: LogRecord[] = [];

  log(record: LogRecord): void {
    this.records.push(record);
  }
}

const baselineLoggerConfig = LoggerConfig.getConfiguration();

const restoreLoggerConfiguration = (): void => {
  LoggerConfig.configure({
    level: baselineLoggerConfig.level,
    structured: baselineLoggerConfig.structured,
    serializer: baselineLoggerConfig.serializer,
    transport: baselineLoggerConfig.transport,
  });

  if (baselineLoggerConfig.structured) {
    LoggerConfig.useStructuredLogging(baselineLoggerConfig.serializer);
  } else {
    LoggerConfig.disableStructuredLogging();
  }
};

describe('TemplumAdapterRegistry', () => {
  let registry: TemplumAdapterRegistry;
  let mockConfig: IDependencyInjectionConfig;
  let transport: RecordingTransport;

  beforeEach(() => {
    transport = new RecordingTransport();
    LoggerConfig.configure({
      transport,
      level: LogLevel.DEBUG,
      structured: false,
      serializer: undefined,
    });
    LoggerConfig.disableStructuredLogging();

    mockConfig = {
      enableSkinEngine: true,
      enableStateManager: true,
      enableBackendRouter: true,
      enableBackendServiceRouter: true,
      enableResourceManager: true,
      enableObservabilityService: true,
      validationLevel: 'standard'
    };
    registry = new TemplumAdapterRegistry(mockConfig);
  });

  afterEach(() => {
    restoreLoggerConfiguration();
  });

  afterEach(async () => {
    try {
      await registry.dispose();
    } catch (error) {
      console.error('Cleanup failed after test:', error);
    }
  });

  describe('Initialization', () => {
    test('initializes with default configuration', () => {
      const defaultRegistry = new TemplumAdapterRegistry();
      expect(defaultRegistry).toBeDefined();
      expect(defaultRegistry.isInitialized()).toBe(false);
    });

    test('initializes with custom configuration', () => {
      expect(registry).toBeDefined();
      expect(registry.isInitialized()).toBe(false);
      
      const status = registry.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.enabledComponents).toContain('enableSkinEngine');
      expect(status.enabledComponents).toContain('enableStateManager');
    });

    test('successfully initializes all components', async () => {
      // Act
      await registry.initialize();

      // Assert
      expect(registry.isInitialized()).toBe(true);
      
      const dependencies = registry.getDependencies();
      expect(dependencies.skinEngine).toBeDefined();
      expect(dependencies.stateManager).toBeDefined();
      expect(dependencies.backendRouter).toBeDefined();
      expect(dependencies.backendServiceRouter).toBeDefined();
      expect(dependencies.resourceManager).toBeDefined();
      expect(dependencies.observabilityService).toBeDefined();
    });

    test('prevents double initialization', async () => {
      // Arrange
      await registry.initialize();
      transport.records.length = 0;

      // Act
      await registry.initialize();

      // Assert
      const warningRecord = transport.records.find(
        (record) =>
          record.level === LogLevel.WARN &&
          record.context === 'templum-adapter-registry:registry' &&
          record.message === 'Adapter registry already initialized'
      );

      expect(warningRecord).toBeDefined();
      const warnRecords = transport.records.filter(
        (record) =>
          record.context === 'templum-adapter-registry:registry' &&
          record.level === LogLevel.WARN
      );
      expect(warnRecords).toHaveLength(1);
    });

    test('emits initialized event on successful initialization', async () => {
      // Arrange
      const eventSpy = jest.fn();
      registry.on('initialized', eventSpy);

      // Act
      await registry.initialize();

      // Assert
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        timestamp: expect.any(Number),
        components: expect.arrayContaining(['skinEngine', 'stateManager']),
        initializationPhases: 4
      }));
    });

    test('handles initialization errors gracefully', async () => {
      // Arrange
      const invalidConfig: IDependencyInjectionConfig = {
        enableSkinEngine: true,
        validationLevel: 'strict',
        validationTimeout: 1 // Very short timeout to trigger error
      };
      const failingRegistry = new TemplumAdapterRegistry(invalidConfig);

      // Act & Assert
      await expect(failingRegistry.initialize()).rejects.toThrow();
      expect(failingRegistry.isInitialized()).toBe(false);
    });
  });

  describe('Component Creation', () => {
    test('creates skin engine component with configuration', async () => {
      // Arrange
      await registry.initialize();

      // Act
      const dependencies = registry.getDependencies();

      // Assert
      expect(dependencies.skinEngine).toBeDefined();
      expect(typeof dependencies.skinEngine.renderForInterface).toBe('function');
      expect(typeof dependencies.skinEngine.validateSkin).toBe('function');
      expect(typeof dependencies.skinEngine.generateSkinHTML).toBe('function');
    });

    test('creates state manager with validated configuration', async () => {
      // Arrange
      await registry.initialize();

      // Act
      const dependencies = registry.getDependencies();

      // Assert
      expect(dependencies.stateManager).toBeDefined();
      expect(typeof dependencies.stateManager.initialize).toBe('function');
      expect(typeof dependencies.stateManager.syncState).toBe('function');
      expect(typeof dependencies.stateManager.sendMessage).toBe('function');
      expect(typeof dependencies.stateManager.getCurrentState).toBe('function');
    });

    test('creates backend router with circuit breaker configuration', async () => {
      // Arrange
      await registry.initialize();

      // Act
      const dependencies = registry.getDependencies();

      // Assert
      expect(dependencies.backendRouter).toBeDefined();
      expect(typeof dependencies.backendRouter.executeCommand).toBe('function');
      expect(typeof dependencies.backendRouter.getStatus).toBe('function');
    });

    test('creates resource manager with policy validation', async () => {
      // Arrange
      await registry.initialize();

      // Act
      const dependencies = registry.getDependencies();

      // Assert
      expect(dependencies.resourceManager).toBeDefined();
      expect(typeof dependencies.resourceManager.allocateResource).toBe('function');
      expect(typeof dependencies.resourceManager.deallocateResource).toBe('function');
      expect(typeof dependencies.resourceManager.getResourceUsage).toBe('function');
    });

    test('creates observability service with environment configuration', async () => {
      // Arrange
      await registry.initialize();

      // Act
      const dependencies = registry.getDependencies();

      // Assert
      expect(dependencies.observabilityService).toBeDefined();
      expect(typeof dependencies.observabilityService.logInfo).toBe('function');
      expect(typeof dependencies.observabilityService.logError).toBe('function');
      expect(typeof dependencies.observabilityService.logDebug).toBe('function');
    });
  });

  describe('Component Validation', () => {
    test('validates component interfaces in standard mode', async () => {
      // Arrange
      const validationConfig = { ...mockConfig, validationLevel: 'standard' as const };
      const validationRegistry = new TemplumAdapterRegistry(validationConfig);

      // Act
      await validationRegistry.initialize();

      // Assert
      const validationReport = validationRegistry.getValidationReport();
      expect(validationReport).toBeDefined();
      expect(validationReport!.overallValid).toBe(true);
      expect(validationReport!.componentValidation.length).toBeGreaterThan(0);
      
      // All components should have valid interface compliance
      validationReport!.componentValidation.forEach(validation => {
        expect(validation.interfaceCompliance).toBe(true);
      });

      await validationRegistry.dispose();
    });

    test('validates dependency wiring between components', async () => {
      // Arrange
      await registry.initialize();

      // Act
      const validationReport = registry.getValidationReport();

      // Assert
      expect(validationReport).toBeDefined();
      expect(validationReport!.dependencyWiring.length).toBeGreaterThan(0);
      
      // Check for state manager to backend router wiring
      const stateToBackendWiring = validationReport!.dependencyWiring.find(
        w => w.sourceComponent === 'stateManager' && w.targetComponent === 'backendRouter'
      );
      expect(stateToBackendWiring).toBeDefined();
      expect(stateToBackendWiring!.wiringValid).toBe(true);
    });

    test('detects circular dependencies in dependency graph', async () => {
      // This test validates that the circular dependency detection works
      // In normal operation, there should be no circular dependencies
      await registry.initialize();

      const validationReport = registry.getValidationReport();
      expect(validationReport).toBeDefined();
      expect(validationReport!.integrityValidation.circularDependencies).toEqual([]);
    });

    test('validates initialization order requirements', async () => {
      // Arrange
      const strictConfig = { ...mockConfig, validationLevel: 'strict' as const };
      const strictRegistry = new TemplumAdapterRegistry(strictConfig);

      // Act
      await strictRegistry.initialize();

      // Assert
      const validationReport = strictRegistry.getValidationReport();
      expect(validationReport!.integrityValidation.initializationOrder).toBe(true);

      await strictRegistry.dispose();
    });
  });

  describe('Guarded configuration helpers', () => {
    test('validateStateManagerConfig rejects non-plain objects', () => {
      const registry = new TemplumAdapterRegistry();

      expect(() => registry.validateStateManagerConfig('not-a-config')).toThrow(
        /state manager config must be a plain object/i,
      );
    });

    test('validateStateManagerConfig preserves known numeric options', () => {
      const registry = new TemplumAdapterRegistry();
      const config = registry.validateStateManagerConfig({
        coalescingWindowMs: 250,
        maxBatchSize: 5,
      });

      expect(config.coalescingWindowMs).toBe(250);
      expect(config.maxBatchSize).toBe(5);
    });
  });

  describe('Configuration Validation', () => {
    test('validates state manager configuration with defaults', () => {
      const validatedConfig = registry.validateStateManagerConfig({
        coalescingWindowMs: 150,
        maxBatchSize: 25,
        invalidField: 'should-be-ignored'
      });

      expect(validatedConfig.coalescingWindowMs).toBe(150);
      expect(validatedConfig.maxBatchSize).toBe(25);
      expect(validatedConfig.invalidField).toBe('should-be-ignored'); // Preserved but not validated
    });

    test('validates numeric ranges with bounds checking', () => {
      // Test within valid range
      expect(registry.validateNumericRange(50, 10, 100, 25, 'testField')).toBe(50);
      
      // Test below minimum
      expect(registry.validateNumericRange(5, 10, 100, 25, 'testField')).toBe(25);
      
      // Test above maximum  
      expect(registry.validateNumericRange(150, 10, 100, 25, 'testField')).toBe(25);
      
      // Test invalid type
      expect(registry.validateNumericRange('invalid', 10, 100, 25, 'testField')).toBe(25);
    });

    test('validates enum values with fallback defaults', () => {
      const allowedValues = ['merge', 'replace', 'queue'];
      
      // Test valid value
      expect(registry.validateEnumValue('merge', allowedValues, 'merge', 'testEnum')).toBe('merge');
      
      // Test invalid value
      expect(registry.validateEnumValue('invalid', allowedValues, 'merge', 'testEnum')).toBe('merge');
    });

    test('validates resource manager configuration with constraints', () => {
      const validatedConfig = registry.validateResourceManagerConfig({
        cpuLimitPercent: 90,
        memoryLimitMB: 32 // Too low, should be removed
      });

      expect(validatedConfig.cpuLimitPercent).toBe(90);
      // memoryLimitMB should be removed due to validation failure
      expect(validatedConfig.memoryLimitMB).toBeUndefined();
    });
  });

  describe('Component Access', () => {
    test('retrieves specific component by name', async () => {
      // Arrange
      await registry.initialize();

      // Act
      const skinEngine = registry.getComponent('skinEngine');
      const stateManager = registry.getComponent('stateManager');

      // Assert
      expect(skinEngine).toBeDefined();
      expect(stateManager).toBeDefined();
      expect(typeof skinEngine.validateSkin).toBe('function');
      expect(typeof stateManager.syncState).toBe('function');
    });

    test('throws error when accessing component before initialization', () => {
      // Act & Assert
      expect(() => registry.getComponent('skinEngine')).toThrow('Registry not initialized');
    });

    test('throws error when accessing non-existent component', async () => {
      // Arrange
      await registry.initialize();

      // Act & Assert
      expect(() => registry.getComponent('nonExistent' as any)).toThrow('Component not found: nonExistent');
    });

    test('registers custom component instances', () => {
      // Arrange
      const mockSkinEngine: ISkinEngine = {
        renderForInterface: jest.fn(),
        validateSkin: jest.fn(),
        generateSkinHTML: jest.fn(),
        initialize: jest.fn(),
        dispose: jest.fn()
      };

      const eventSpy = jest.fn();
      registry.on('componentRegistered', eventSpy);

      // Act
      registry.registerComponent('skinEngine', mockSkinEngine);

      // Assert
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'skinEngine',
        timestamp: expect.any(Number)
      }));
    });
  });

  describe('Error Handling', () => {
    test('handles missing required dependencies gracefully', async () => {
      // Arrange
      const incompleteConfig: IDependencyInjectionConfig = {
        enableSkinEngine: true,
        enableStateManager: false, // Missing required dependency
        enableBackendRouter: true,
        enableBackendServiceRouter: true,
        enableResourceManager: true
      };
      const incompleteRegistry = new TemplumAdapterRegistry(incompleteConfig);
      
      await incompleteRegistry.initialize();

      // Act & Assert
      expect(() => incompleteRegistry.getDependencies()).toThrow('Missing required dependency: stateManager');
      
      await incompleteRegistry.dispose();
    });

    test('handles component creation failures in strict mode', async () => {
      // Arrange
      const strictConfig = { ...mockConfig, validationLevel: 'strict' as const, validationTimeout: 1 };
      const strictRegistry = new TemplumAdapterRegistry(strictConfig);

      // Act & Assert
      await expect(strictRegistry.initialize()).rejects.toThrow();
    });
  });

  describe('Lifecycle Management', () => {
    test('disposes all components in reverse order', async () => {
      // Arrange
      await registry.initialize();
      const eventSpy = jest.fn();
      registry.on('disposed', eventSpy);

      // Act
      await registry.dispose();

      // Assert
      expect(registry.isInitialized()).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        timestamp: expect.any(Number)
      }));
    });

    test('handles disposal errors gracefully', async () => {
      // Arrange
      await registry.initialize();
      
      // Mock a component disposal to throw an error
      const dependencies = registry.getDependencies();
      const originalDispose = dependencies.skinEngine.dispose;
      dependencies.skinEngine.dispose = jest.fn().mockRejectedValue(new Error('Disposal failed'));

      transport.records.length = 0;

      // Act
      await registry.dispose();

      // Assert
      expect(registry.isInitialized()).toBe(false);
      const errorRecord = transport.records.find(
        (record) =>
          record.level === LogLevel.ERROR &&
          record.context === 'templum-adapter-registry:disposal' &&
          record.message === 'Failed to dispose component'
      );

      expect(errorRecord).toBeDefined();
      expect(errorRecord?.data).toEqual({ errorMessage: 'Disposal failed' });
      expect(errorRecord?.error).toBeInstanceOf(Error);

      // Restore original dispose method
      dependencies.skinEngine.dispose = originalDispose;
    });

    test('shuts down session manager and observability service during disposal', async () => {
      // Arrange
      await registry.initialize();
      const dependencies = registry.getDependencies();
      const sessionShutdownSpy = jest.spyOn(dependencies.sessionManager as any, 'shutdown');
      const observabilityShutdownSpy = jest.spyOn(dependencies.observabilityService, 'shutdown');

      // Act
      await registry.dispose();

      // Assert
      expect(sessionShutdownSpy).toHaveBeenCalledTimes(1);
      expect(observabilityShutdownSpy).toHaveBeenCalledTimes(1);

      sessionShutdownSpy.mockRestore();
      observabilityShutdownSpy.mockRestore();
    });

    test('returns comprehensive status information', async () => {
      // Arrange
      await registry.initialize();

      // Act
      const status = registry.getStatus();

      // Assert
      expect(status.initialized).toBe(true);
      expect(status.enabledComponents.length).toBeGreaterThan(0);
      expect(status.registeredComponents.length).toBeGreaterThan(0);
      expect(status.componentCount).toBeGreaterThan(0);
      expect(status.registeredComponents).toContain('skinEngine');
      expect(status.registeredComponents).toContain('stateManager');
    });
  });
});

describe('TemplumComponentFactory', () => {
  let factory: TemplumComponentFactory;
  let mockRegistry: TemplumAdapterRegistry;

  beforeEach(() => {
    factory = new TemplumComponentFactory();
    mockRegistry = new TemplumAdapterRegistry();
    factory.setRegistry(mockRegistry);
  });

  describe('Component Factory Methods', () => {
    test('creates skin engine with default configuration', () => {
      // Act
      const skinEngine = factory.createSkinEngine();

      // Assert
      expect(skinEngine).toBeDefined();
      expect(typeof skinEngine.renderForInterface).toBe('function');
      expect(typeof skinEngine.validateSkin).toBe('function');
      expect(typeof skinEngine.generateSkinHTML).toBe('function');
    });

    test('creates state manager with validated configuration', () => {
      // Arrange
      const config = {
        coalescingWindowMs: 200,
        maxBatchSize: 30,
        performanceMetrics: true
      };

      // Act
      const stateManager = factory.createStateManager(config);

      // Assert
      expect(stateManager).toBeDefined();
      expect(typeof stateManager.initialize).toBe('function');
      expect(typeof stateManager.syncState).toBe('function');
    });

    test('creates backend router with circuit breaker configuration', () => {
      // Arrange
      const config = {
        enableCircuitBreaker: true,
        timeoutMs: 25000,
        retryAttempts: 5
      };

      // Act
      const backendRouter = factory.createBackendRouter(config);

      // Assert
      expect(backendRouter).toBeDefined();
      expect(typeof backendRouter.executeCommand).toBe('function');
      expect(typeof backendRouter.getStatus).toBe('function');
    });

    test('creates resource manager with policy setup', () => {
      // Arrange
      const config = {
        memoryLimitMB: 512,
        cpuLimitPercent: 85,
        enableHealthMonitoring: true
      };

      // Act
      const resourceManager = factory.createResourceManager(config);

      // Assert
      expect(resourceManager).toBeDefined();
      expect(typeof resourceManager.allocateResource).toBe('function');
      expect(typeof resourceManager.deallocateResource).toBe('function');
    });

    test('creates observability service with environment configuration', () => {
      // Act
      const observabilityService = factory.createObservabilityService();

      // Assert
      expect(observabilityService).toBeDefined();
      expect(typeof observabilityService.logInfo).toBe('function');
      expect(typeof observabilityService.logError).toBe('function');
      expect(typeof observabilityService.initialize).toBe('function');
    });
  });
});
