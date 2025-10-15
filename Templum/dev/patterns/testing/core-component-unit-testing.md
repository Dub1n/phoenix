---
date-created: 2025-09-01-0000
last-updated: 2025-09-11-0000
name: core-component-unit-testing
description: Comprehensive unit testing pattern with mock management, integration test orchestration, and real backend validation for critical components
status: "[x]"
category: testing
use-when:
  - Testing core components in Templum with external dependencies
  - Ensuring reliability of backend integration points
  - Validating service discovery and connection factory logic
  - Implementing comprehensive test coverage for critical components
keywords:
  - unit-testing
  - mock-management
  - integration-testing
  - backend-validation
  - jest
  - typescript
  - service-discovery
  - connection-factory
prerequisites:
  - jest-framework-setup
  - typescript-configuration
  - mock-patterns
related-patterns:
  - integration-testing
  - backend-service-patterns
  - mock-management
  - test-orchestration
---

### Core Component Unit Testing Pattern

**Problem**: Core components in Templum required comprehensive testing coverage to ensure reliability, but lacked consistent testing patterns for backend integration, service discovery, connection factories, and mock management.

**Solution**: Comprehensive unit testing pattern with mock management, integration test orchestration, and real backend validation for critical components.

#### Core Component Unit Testing Pattern: Architecture

The pattern provides three testing tiers:

1. **Unit Tests**: Individual component logic with mocked dependencies
2. **Integration Tests**: Multi-component orchestration with controlled environments  
3. **E2E Tests**: Full system validation with real backend instances

#### Core Component Unit Testing Pattern: Implementation Steps

**Step 1**: Test Environment Setup

```typescript
import { jest } from '@jest/globals';
import { BackendServiceRouter } from '../../backend/backend-service-router';
import { ConnectionFactory } from '../../backend/connection-factory';
import { UniversalSkinDefinition, BackendConfig } from '../../types/universal-skin-engine-types';

// Mock external dependencies
jest.mock('../../backend/connection-factory');
jest.mock('../../backend/service-discovery');

const mockConnectionFactory = ConnectionFactory as jest.Mocked<typeof ConnectionFactory>;
```

**Step 2**: Mock Data Factories

```typescript
const createMockSkinDefinition = (): UniversalSkinDefinition => ({
  metadata: {
    name: 'Test Backend',
    version: '1.0.0',
    description: 'Test backend for validation',
    author: 'Test Suite'
  },
  backendConfig: {
    service: 'test-backend',
    protocol: 'http',
    endpoint: 'http://localhost:3001',
    timeout: 5000,
    retries: 2,
    healthEndpoint: '/health',
    authentication: { type: 'none' }
  }
});
```

**Step 3**: Component Testing with Mocks

```typescript
describe('BackendServiceRouter', () => {
  let router: BackendServiceRouter;
  
  beforeEach(() => {
    jest.clearAllMocks();
    router = new BackendServiceRouter();
  });

  it('should handle backend connection failures gracefully', async () => {
    mockConnectionFactory.create.mockRejectedValue(
      new Error('Connection failed')
    );
    
    const result = await router.executeCommand('test-command', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Connection failed');
  });
});
```

**Step 4**: Real Backend Integration Testing

```typescript
class TestBackendManager {
  private instances: Map<string, TestBackendInstance> = new Map();
  
  async startMinimalBackend(id: string, port: number): Promise<TestBackendInstance> {
    const process = spawn('node', ['server.js'], {
      cwd: this.minimalBackendPath,
      env: { ...process.env, PORT: port.toString() }
    });
    
    // Wait for backend to be ready
    await this.waitForBackendReady(port);
    
    return { process, port, type: 'minimal', id };
  }
}
```

**Step 5**: E2E Validation with Real Services

```typescript
describe('End-to-End Backend Integration', () => {
  let backendManager: TestBackendManager;
  let router: BackendServiceRouter;
  
  beforeAll(async () => {
    backendManager = new TestBackendManager();
    await backendManager.startMinimalBackend('test-pcl', 3001);
  }, 30000);
  
  afterAll(async () => {
    await backendManager.cleanup();
  });
  
  it('should discover and connect to real backend', async () => {
    const discovery = new ServiceDiscovery();
    const services = await discovery.discoverServices();
    
    expect(services.length).toBeGreaterThan(0);
    expect(services[0].endpoint).toBe('http://localhost:3001');
  });
});
```

#### Core Component Unit Testing Pattern: Success Metrics

- **Test Coverage**: >90% line coverage for critical components
- **Mock Isolation**: 100% external dependency isolation in unit tests
- **Integration Validation**: Real backend connection testing
- **Error Scenarios**: Comprehensive error condition coverage
- **Performance**: Test execution <30 seconds for full suite

#### Core Component Unit Testing Pattern: Anti-Patterns

- **Over-mocking**: Don't mock internal component logic, only external dependencies
- **Brittle Tests**: Avoid testing implementation details, focus on behavior
- **Test Pollution**: Ensure proper cleanup between tests
- **Missing Edge Cases**: Always test error conditions and edge cases

#### Core Component Unit Testing Pattern: Validation Checklist

- [ ] Unit tests isolate component logic with mocks
- [ ] Integration tests validate multi-component orchestration
- [ ] E2E tests use real backend instances
- [ ] Error scenarios are comprehensively covered
- [ ] Test cleanup prevents test pollution
- [ ] Performance tests validate response times

#### Core Component Unit Testing Pattern: Implementation Feedback

// TODO: [TASK-PATTERN-001] Pattern: core-component-unit-testing | Complexity: 6 | Dependencies: jest,typescript,mock-patterns
// Context: Updated frontmatter format to standardized YAML template with proper kebab-case fields and structured metadata
// Validation-Required: pattern-compliance, frontmatter-syntax, searchability-enhancement
// Pattern-Info: { approach: "template-based-standardization", alternatives: "manual-formatting", trade-offs: "consistency-vs-flexibility" }

**Successfully Applied**: TASK-SKIN-007 Comprehensive Backend Integration Validation, TASK-CLEAN-001 Generic Backend Validation, TASK-GENERIC-003 Generic Service Discovery Testing

**Pattern Metadata**:

- **Files Using This Pattern**: `src/tests/backend/*.test.ts`, `src/tests/e2e/*.ts`, `src/tests/integration-validation-framework.ts`
- **Integration Points**: Jest framework, Backend components, Service discovery, Connection management
- **Dependencies**: Jest, spawn for backend management, axios for HTTP testing, WebSocket for real-time testing
