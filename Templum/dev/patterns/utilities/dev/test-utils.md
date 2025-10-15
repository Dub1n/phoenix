---
date-created: 2025-09-14T182500Z
last-updated: 2025-09-14T182500Z
name: test-utils
description: Centralized testing utilities to consolidate massive test files (6,283+ lines) with mock generation, assertion helpers, and test data factories
status: "[x]"
category: development-tools
use-when:
  - Consolidating massive test infrastructure files exceeding LLM limits
  - Need for consistent mock generation patterns across test suites
  - Assertion helpers and test data factories scattered across tests
  - Integration test framework requiring standardization
keywords:
  - test-utilities
  - mock-generation
  - assertion-helpers
  - test-data-factories
  - integration-testing
prerequisites:
  - logger-utility
  - error-handler-utility
related-patterns:
  - enhanced-validation-testing
  - integration-test-framework-transition
  - core-component-unit-testing
---

### Test Utils Utility Consolidation Pattern

**Problem**: Templum has massive test infrastructure files that exceed LLM-friendly limits, with integration-validation-framework.ts (4,234 lines) and hybrid-validation-system-v3c.ts (2,049 lines), plus repeated mock generation and assertion patterns across 23+ test files.

**Current State Issues**:

```typescript
// Massive monolithic test files
// integration-validation-framework.ts (4,234 lines!)
class Phase6IntegrationValidationSuite {
  // Hundreds of test methods in single file
  // Mock generation repeated across tests
  // Custom assertion logic scattered
}

// hybrid-validation-system-v3c.ts (2,049 lines!)  
class HybridValidationSystemV3C {
  // Massive validation testing logic
  // Repeated test data creation
  // Complex assertion patterns
}

// Repeated patterns across 21+ other test files
beforeEach(() => {
  // Mock setup repeated in every test file
  mockBackendService = {
    connect: jest.fn(),
    getSkinDefinition: jest.fn(),
    // ... hundreds of repeated mock setups
  };
});
```

**Solution**: Centralized TestUtils with minimal-footprint APIs for mock generation, assertion helpers, test data factories, and modular test organization that keeps files under LLM-friendly limits.

#### Test Utils Implementation

**Core TestUtils Class** (Minimal Usage Design):

```typescript
import { createLogger } from '../core/logger-utility';
import type { 
  UniversalSkinDefinition, 
  BackendConfig, 
  TemplumSystemStatus,
  BackendConnection 
} from '../../types/templum-types';

export class TestUtils {
  private static logger = createLogger('test-utils');
  private static mockRegistry = new Map<string, any>();
  
  // One-line mock generation
  static mock<T = any>(type: MockType): MockBuilder<T> {
    return new MockBuilder<T>(type);
  }
  
  // Quick assertion helpers
  static assert = {
    // Backend-specific assertions
    validBackendConfig: (config: any) => {
      expect(config).toHaveProperty('protocol');
      expect(config).toHaveProperty('endpoint');
      expect(['ipc', 'http', 'websocket', 'grpc']).toContain(config.protocol);
    },
    
    validSkinDefinition: (skin: any) => {
      expect(skin).toHaveProperty('id');
      expect(skin).toHaveProperty('metadata');
      expect(skin.metadata).toHaveProperty('backendService');
    },
    
    validTemplumError: (error: any) => {
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('context');
    },
    
    // Connection state assertions
    connectionEstablished: (connection: any) => {
      expect(connection).toHaveProperty('status', 'connected');
      expect(connection).toHaveProperty('backendId');
      expect(connection.ping).toBeDefined();
    },
    
    // Menu structure assertions
    validMenuStructure: (menu: any) => {
      expect(menu).toHaveProperty('items');
      expect(Array.isArray(menu.items)).toBe(true);
      menu.items.forEach((item: any) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('display');
      });
    }
  };
  
  // Test data factories with minimal setup
  static data = {
    // Backend configurations
    backendConfig: (overrides: Partial<BackendConfig> = {}): BackendConfig => ({
      protocol: 'http',
      endpoint: 'http://localhost:3000',
      healthEndpoint: '/health',
      apiEndpoint: '/api',
      authentication: { type: 'none' },
      ...overrides
    }),
    
    // Skin definitions
    skinDefinition: (overrides: Partial<UniversalSkinDefinition> = {}): UniversalSkinDefinition => ({
      id: 'test-skin-' + Math.random().toString(36).substr(2, 9),
      version: '1.0.0',
      metadata: {
        backendService: 'test-backend',
        supportedInterfaces: ['cli', 'vscode'],
        author: 'test-suite'
      },
      menus: {
        main: {
          title: 'Test Menu',
          items: [
            { id: 'test-1', display: 'Test Item 1', command: 'test.command1' },
            { id: 'test-2', display: 'Test Item 2', command: 'test.command2' }
          ]
        }
      },
      commands: {
        'test.command1': {
          description: 'Test command 1',
          handler: 'handleTestCommand1'
        }
      },
      ...overrides
    }),
    
    // System status
    systemStatus: (overrides: Partial<TemplumSystemStatus> = {}): TemplumSystemStatus => ({
      coreActive: true,
      connectedBackends: 2,
      activeInterface: 'cli',
      sessionId: 'test-session-' + Date.now(),
      uptime: 1000,
      ...overrides
    }),
    
    // Service arrays for testing
    services: (count: number = 3, overrides: any = {}) => 
      Array.from({ length: count }, (_, i) => ({
        id: `service-${i}`,
        name: `Test Service ${i}`,
        status: i % 2 === 0 ? 'connected' : 'disconnected',
        ...overrides
      }))
  };
  
  // Scenario builders for complex test setups
  static scenario = {
    // Multi-backend environment
    multiBackend: async () => {
      const backends = [
        TestUtils.data.backendConfig({ protocol: 'http', endpoint: 'http://localhost:3001' }),
        TestUtils.data.backendConfig({ protocol: 'ipc', endpoint: '/tmp/backend.sock' }),
        TestUtils.data.backendConfig({ protocol: 'websocket', endpoint: 'ws://localhost:3003' })
      ];
      
      const mocks = backends.map(config => 
        TestUtils.mock('BackendConnection')
          .withConfig(config)
          .healthy()
          .build()
      );
      
      return { backends, mocks };
    },
    
    // Skin switching scenario
    skinSwitch: async () => {
      const skin1 = TestUtils.data.skinDefinition({ 
        id: 'skin-1',
        metadata: { backendService: 'service-1' }
      });
      const skin2 = TestUtils.data.skinDefinition({ 
        id: 'skin-2', 
        metadata: { backendService: 'service-2' }
      });
      
      return { skin1, skin2 };
    },
    
    // Error conditions
    errorConditions: () => ({
      networkError: new Error('Network connection failed'),
      timeoutError: new Error('Operation timed out'),
      invalidSkin: { invalid: 'skin definition' },
      malformedConfig: { protocol: 'unknown' }
    })
  };
  
  // Cleanup utilities
  static cleanup = {
    mocks: () => {
      jest.clearAllMocks();
      TestUtils.mockRegistry.clear();
    },
    
    timeouts: () => {
      // Clear any test timeouts
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    },
    
    all: () => {
      TestUtils.cleanup.mocks();
      TestUtils.cleanup.timeouts();
    }
  };
}

// Mock builder for fluent mock creation
class MockBuilder<T> {
  private mockObject: any = {};
  private mockType: MockType;
  
  constructor(type: MockType) {
    this.mockType = type;
    this.initializeBaseMock();
  }
  
  // Chainable mock configuration
  withConfig(config: any): this {
    Object.assign(this.mockObject, config);
    return this;
  }
  
  healthy(): this {
    if (this.mockType === 'BackendConnection') {
      this.mockObject.ping = jest.fn().mockResolvedValue({ status: 'healthy' });
      this.mockObject.status = 'connected';
    }
    return this;
  }
  
  failing(): this {
    if (this.mockType === 'BackendConnection') {
      this.mockObject.ping = jest.fn().mockRejectedValue(new Error('Connection failed'));
      this.mockObject.status = 'disconnected';
    }
    return this;
  }
  
  withSkin(skin: UniversalSkinDefinition): this {
    if (this.mockType === 'BackendConnection') {
      this.mockObject.getSkinDefinition = jest.fn().mockResolvedValue(skin);
    }
    return this;
  }
  
  build(): T {
    return this.mockObject as T;
  }
  
  private initializeBaseMock(): void {
    switch (this.mockType) {
      case 'BackendConnection':
        this.mockObject = {
          backendId: 'test-backend-' + Math.random().toString(36).substr(2, 6),
          config: TestUtils.data.backendConfig(),
          status: 'connected',
          connect: jest.fn().mockResolvedValue(undefined),
          disconnect: jest.fn().mockResolvedValue(undefined),
          ping: jest.fn().mockResolvedValue({ status: 'healthy' }),
          execute: jest.fn().mockResolvedValue({ success: true }),
          getSkinDefinition: jest.fn().mockResolvedValue(TestUtils.data.skinDefinition())
        };
        break;
        
      case 'TemplumCore':
        this.mockObject = {
          initialize: jest.fn().mockResolvedValue(undefined),
          shutdown: jest.fn().mockResolvedValue(undefined),
          getStatus: jest.fn().mockResolvedValue(TestUtils.data.systemStatus()),
          switchInterface: jest.fn().mockResolvedValue(undefined)
        };
        break;
        
      case 'ServiceDiscovery':
        this.mockObject = {
          discoverServices: jest.fn().mockResolvedValue(TestUtils.data.services()),
          validateService: jest.fn().mockResolvedValue(true),
          watchForChanges: jest.fn().mockImplementation((callback) => callback)
        };
        break;
    }
  }
}

// Types
type MockType = 'BackendConnection' | 'TemplumCore' | 'ServiceDiscovery' | 'UniversalSkinEngine';

// Convenience exports for minimal usage
export const { mock, assert, data, scenario, cleanup } = TestUtils;

// Test suite helpers for organizing large test files
export class TestSuite {
  private name: string;
  private beforeEachHooks: (() => void)[] = [];
  private afterEachHooks: (() => void)[] = [];
  
  constructor(name: string) {
    this.name = name;
  }
  
  // Fluent test organization
  beforeEach(hook: () => void): this {
    this.beforeEachHooks.push(hook);
    return this;
  }
  
  afterEach(hook: () => void): this {
    this.afterEachHooks.push(hook);
    return this;
  }
  
  // Run test suite with automatic setup/cleanup
  run(tests: () => void): void {
    describe(this.name, () => {
      beforeEach(() => {
        this.beforeEachHooks.forEach(hook => hook());
      });
      
      afterEach(() => {
        this.afterEachHooks.forEach(hook => hook());
        cleanup.all();
      });
      
      tests();
    });
  }
}

export const suite = (name: string) => new TestSuite(name);
```

#### Usage Examples (Minimal Footprint)

**Before** (Current massive files):

```typescript
// In integration-validation-framework.ts (4,234 lines!)
describe('Phase 6 Integration Tests', () => {
  let mockBackendService: any;
  let mockConnection: any;
  let mockSkinDefinition: any;
  
  beforeEach(() => {
    // 50+ lines of manual mock setup repeated everywhere
    mockBackendService = {
      connect: jest.fn().mockImplementation(() => Promise.resolve()),
      disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
      ping: jest.fn().mockImplementation(() => Promise.resolve({ status: 'healthy' })),
      getSkinDefinition: jest.fn().mockImplementation(() => Promise.resolve({
        id: 'test-skin',
        version: '1.0.0',
        metadata: { backendService: 'test' },
        // ... hundreds more lines of mock data
      }))
    };
    // ... hundreds more lines of setup
  });
  
  it('should connect to backend and load skin', async () => {
    // Custom assertion logic repeated across tests
    const result = await backendRouter.connectToBackend(mockConfig);
    expect(result).toBeTruthy();
    expect(result.status).toBe('connected');
    // ... more repeated assertion patterns
  });
});
```

**After** (Consolidated with utilities):

```typescript
// Split into focused test files under 500 lines each

// backend-connection.test.ts
suite('Backend Connection Tests')
  .beforeEach(() => cleanup.all())
  .run(() => {
    
    it('should connect to healthy backend', async () => {
      const connection = mock('BackendConnection').healthy().build();
      const result = await backendRouter.connect(connection.config);
      
      assert.connectionEstablished(result);
      assert.validBackendConfig(result.config);
    });
    
    it('should handle multi-backend scenario', async () => {
      const { backends, mocks } = await scenario.multiBackend();
      
      for (const mock of mocks) {
        assert.connectionEstablished(mock);
      }
    });
  });

// skin-definition.test.ts  
suite('Skin Definition Tests')
  .run(() => {
    
    it('should load and validate skin definition', async () => {
      const skin = data.skinDefinition({ 
        metadata: { backendService: 'test-service' } 
      });
      const connection = mock('BackendConnection').withSkin(skin).build();
      
      const result = await skinEngine.loadSkin(connection);
      
      assert.validSkinDefinition(result);
      assert.validMenuStructure(result.menus.main);
    });
  });
```

#### Files Using This Pattern

**Massive Test Infrastructure Files** (Major Impact):

- [ ] `src/tests/integration-validation-framework.ts` (4,234 lines → Split into 8-10 focused test files)
- [ ] `src/validation/hybrid-validation-system-v3c.ts` (2,049 lines → Split into 4-5 validation test files)

**Test File Organization Strategy**:

```filesystem
tests/
├── backend/
│   ├── backend-connection.test.ts (~300 lines)
│   ├── service-discovery.test.ts (~400 lines) 
│   ├── protocol-handling.test.ts (~350 lines)
│   └── backend-integration.test.ts (~450 lines)
├── interface/
│   ├── cli-adapter.test.ts (~400 lines)
│   ├── vscode-adapter.test.ts (~350 lines)
│   └── interface-switching.test.ts (~300 lines)
├── skin/
│   ├── skin-loading.test.ts (~350 lines)
│   ├── skin-rendering.test.ts (~400 lines)
│   └── skin-validation.test.ts (~300 lines)
└── integration/
    ├── end-to-end.test.ts (~500 lines)
    ├── multi-backend.test.ts (~450 lines)
    └── error-scenarios.test.ts (~400 lines)
```

**Existing Test Files** (Mock consolidation):

- [ ] All 21+ existing test files migrate to TestUtils for consistent mock generation
- [ ] Assertion helpers replace repeated custom assertion logic
- [ ] Test data factories eliminate repeated test data creation

#### Expected Impact

**Quantitative Benefits**:

- **Lines Reduced**: ~6,000+ lines from splitting massive files and eliminating duplication
- **Files Organized**: 2 massive files → 12+ focused files under LLM limits
- **Mock Generation**: Consistent across all 23+ test files
- **Test Maintainability**: Each test file under 500 lines, focused responsibility

**Qualitative Benefits**:

- **LLM-Friendly**: All test files under 2000 lines, most under 500 lines
- **Consistent Testing**: Standardized mock generation, assertions, test data
- **Better Organization**: Tests grouped by functionality, easy to navigate
- **Reduced Duplication**: Mock setup and assertion logic centralized
- **Development Speed**: Quick test setup with minimal boilerplate

#### Integration with Other Utilities

**Logger Integration**:

```typescript
// Test logs automatically managed
suite('Backend Tests')
  .beforeEach(() => {
    cleanup.all();
    // Logger automatically configured for test mode
  })
  .run(() => { /* tests */ });
```

**Error Handler Integration**:

```typescript
// Test error scenarios with real error handling
it('should handle backend errors gracefully', async () => {
  const { networkError } = scenario.errorConditions();
  const connection = mock('BackendConnection').failing().build();
  
  // Test real error handler behavior
  const result = await handleAsync(connection.connect(), 'test-connection');
  assert.validTemplumError(result);
});
```

#### Implementation Validation

**Before Migration**:

- [ ] Analyze massive test files and identify repeated patterns
- [ ] Map mock generation patterns across all test files
- [ ] Identify assertion logic that can be standardized

**During Migration**:

- [ ] Split integration-validation-framework.ts into focused test files
- [ ] Split hybrid-validation-system-v3c.ts into validation-focused files
- [ ] Migrate all test files to use TestUtils for mock generation
- [ ] Replace custom assertions with standardized assert helpers

**After Migration**:

- [ ] Verify all test files under LLM-friendly limits (preferably <500 lines)
- [ ] Confirm consistent mock generation across all tests
- [ ] Test that all assertion helpers work correctly
- [ ] Validate test organization and discoverability

#### Anti-Patterns

- **X** Don't create massive monolithic test files - split by functionality
- **X** Don't repeat mock setup - use TestUtils.mock() builders
- **X** Don't write custom assertion logic - use standardized assert helpers
- **X** Don't create test data inline - use data factories

#### Pattern Metadata

**Used By Active Tasks**: Phase 2 Utility Consolidation  
**Implementation Priority**: LOW (But highest impact in development tools category)  
**Dependencies**: Logger Utility (for test logging), Error Handler Utility (for error testing)  
**Integration Points**: All test files across entire codebase  
**Migration Complexity**: High (requires careful file splitting and pattern extraction)  
**Performance Impact**: Positive (faster test execution, better organization, consistent setup)
