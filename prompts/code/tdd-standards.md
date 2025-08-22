# Test-Driven Development (TDD) Standards

## ⊕ TDD Philosophy

Test-Driven Development is **mandatory** for all development projects. This ensures code quality, maintainability, and user confidence in the system.

## ⋇ TDD Cycle Overview

### The Red-Green-Refactor Cycle

```text
🔴 RED: Write a failing test
    ↓
🟢 GREEN: Write minimal code to pass
    ↓
🔵 REFACTOR: Improve code quality
    ↓
⇔ REPEAT: Next feature/improvement
```

### Detailed Process

#### 1. 🔴 RED Phase: Write Failing Test

- **Purpose**: Define exactly what functionality should be implemented
- **Test Types**: Unit tests for functions/classes, integration tests for workflows
- **Naming**: Use descriptive test names that explain the expected behavior
- **Coverage**: Test both happy path and error conditions

#### 2. 🟢 GREEN Phase: Minimal Implementation

- **Purpose**: Make the test pass with the simplest possible code
- **Quality**: Code doesn't need to be perfect, just functional
- **Scope**: Implement only what's needed to pass the current test
- **No Over-Engineering**: Resist adding extra features not tested

#### 3. 🔵 REFACTOR Phase: Improve Quality

- **Purpose**: Clean up code while maintaining test coverage
- **Safety**: Tests ensure refactoring doesn't break functionality
- **Quality**: Apply language best practices, improve readability
- **Documentation**: Add comments and improve structure

## ⊎ Testing Framework Standards

### Framework Selection

Choose a testing framework appropriate for your project's technology stack:

```javascript
// Example: Jest configuration for Node.js/TypeScript projects
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/testing/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};

// Adapt for your project's testing framework and language
```

### Test File Organization

```text
tests/
├── unit/                    # Unit tests for individual components
│   ├── core/               # Core application components
│   ├── services/           # Service layer components
│   ├── utils/              # Utility functions
│   └── models/             # Data models and schemas
├── integration/            # Integration tests for workflows
│   ├── api-tests/          # API integration tests
│   ├── workflow-tests/     # End-to-end workflow tests
│   └── database-tests/     # Database integration tests
└── fixtures/               # Test data and mocks
    ├── mock-responses/
    ├── sample-data/
    └── test-configs/
```

## ⋇ Test Writing Standards

### Unit Test Structure

Use the **AAA Pattern**: Arrange, Act, Assert

```typescript
// Example test structure (adapt for your testing framework and language)
describe('ComponentName validation', () => {
  it('should accept valid input', () => {
    // Arrange
    const validInput = {
      field1: 'valid value',
      field2: 42,
      field3: true
    };

    // Act
    const result = ComponentName.validate(validInput);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validInput);
  });

  it('should reject invalid input', () => {
    // Arrange
    const invalidInput = {
      field1: '',  // Invalid: empty string
      field2: -1,  // Invalid: negative number
      field3: null // Invalid: null value
    };

    // Act
    const result = ComponentName.validate(invalidInput);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
```

### Integration Test Structure

Test workflows and component interactions

```typescript
// Example integration test (adapt for your project)
describe('Workflow Integration', () => {
  let orchestrator: WorkflowOrchestrator;
  let mockService: jest.Mocked<ExternalService>;

  beforeEach(() => {
    mockService = createMockExternalService();
    orchestrator = new WorkflowOrchestrator(mockService);
  });

  it('should execute complete workflow', async () => {
    // Arrange
    const workflowContext = {
      input: 'test input',
      config: { timeout: 5000 }
    };

    mockService.process.mockResolvedValueOnce({
      success: true,
      result: 'processed result'
    });

    // Act
    const result = await orchestrator.executeWorkflow(workflowContext);

    // Assert
    expect(result.success).toBe(true);
    expect(result.phases).toHaveLength(3);
    expect(result.phases[0].status).toBe('completed');
  });
});
```

## ⊕ Test Categories by Component

### Core Application Components

Test the fundamental application logic:

```typescript
// Test Core Components
- executeWorkflow() with valid/invalid inputs
- Phase execution order and state management
- Error handling and recovery
- Quality gate integration
- Logging and monitoring functionality

// Test Individual Phases
- InputValidationPhase: Input validation and sanitization
- ProcessingPhase: Core business logic execution
- OutputGenerationPhase: Result formatting and delivery
```

### External Service Integration

Test external service communication:

```typescript
// Test ExternalServiceClient
- Request execution with retry logic
- Response validation and parsing
- Error handling and timeouts
- Rate limiting compliance
- Authentication and authorization

// Test Integration Points
- Service-specific request formatting
- Context-aware parameter construction
- Response transformation and validation
```

### User Interface Components

Test user interface and interaction:

```typescript
// Test UI Components
- Input validation and formatting
- Event handling and state updates
- Error message display
- Progress tracking and feedback

// Test Interactive Features
- Configuration wizards
- Form validation
- User input processing
- Confirmation dialogs
```

### Configuration System

Test configuration management and templates:

```typescript
// Test Configuration Loading
- Template loading and validation
- Configuration merging and inheritance
- Schema validation
- File system operations

// Test Configuration Templates
- Default template validation
- Custom template features
- Template optimization
- Template creation and modification
```

## ⑄ Testing Security Components

### Security Component Testing

```typescript
// Example security testing (adapt for your security framework)
describe('SecurityManager', () => {
  it('should block access to restricted resources', async () => {
    const manager = new SecurityManager();
    
    const result = await manager.validateAccess('/restricted/path', 'read');
    
    expect(result.allowed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('access_violation');
  });

  it('should allow access to permitted resources', async () => {
    const manager = new SecurityManager();
    
    const result = await manager.validateAccess('./src/index.ts', 'read');
    
    expect(result.allowed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
```

## ◊ Coverage Requirements

### Minimum Coverage Thresholds

- **Functions**: 90% - All public methods must be tested
- **Lines**: 90% - Critical code paths must be covered  
- **Branches**: 90% - Error conditions and edge cases tested
- **Statements**: 90% - All logical statements validated

### Coverage Exclusions

Exclude from coverage requirements:

- Type definition files (`*.d.ts`, `*.h`, etc.)
- Test utilities and mocks (`src/testing/**`, `tests/mocks/**`)
- Generated code and build artifacts
- External dependency integrations (test with mocks)

## ^ TDD Implementation Workflow

### For New Features

1. **Understand Requirements**: Read user story or feature specification
2. **Design Test Cases**: Identify test scenarios (happy path, edge cases, errors)
3. **Write Failing Tests**: Implement test cases that describe desired behavior
4. **Run Tests**: Verify tests fail for the right reasons
5. **Implement Code**: Write minimal code to make tests pass
6. **Run Tests Again**: Verify all tests pass
7. **Refactor**: Improve code quality while maintaining test coverage
8. **Update Documentation**: Add/update API documentation and examples

### For Bug Fixes

1. **Reproduce Bug**: Write a test that demonstrates the bug
2. **Verify Failure**: Confirm the test fails due to the bug
3. **Fix Implementation**: Modify code to make the test pass
4. **Regression Testing**: Ensure fix doesn't break existing functionality
5. **Add Edge Cases**: Write additional tests for related scenarios

### For Refactoring

1. **Ensure Test Coverage**: Verify existing tests cover the code being refactored
2. **Run Baseline Tests**: Confirm all tests pass before refactoring
3. **Refactor Code**: Improve structure while maintaining functionality
4. **Continuous Testing**: Run tests frequently during refactoring
5. **Final Validation**: Ensure all tests still pass after refactoring

## ◦ Testing Utilities and Mocks

### Mock External Services

```typescript
// Example mock creation (adapt for your project)
// src/testing/mock-external-service.ts
export function createMockExternalService(): jest.Mocked<ExternalService> {
  return {
    process: jest.fn(),
    validate: jest.fn(),
    authenticate: jest.fn(),
    getStatus: jest.fn()
  } as jest.Mocked<ExternalService>;
}
```

### Test Data Fixtures

```typescript
// Example test fixtures (adapt for your project)
// tests/fixtures/sample-data.ts
export const validWorkflowContext = {
  input: 'Create a function that validates email addresses',
  config: { timeout: 5000, retries: 3 },
  metadata: { priority: 'high', category: 'validation' }
};

export const complexWorkflowContext = {
  input: 'Implement user authentication with JWT tokens and rate limiting',
  config: { timeout: 10000, retries: 5 },
  metadata: { priority: 'critical', category: 'security' }
};
```

## ⊕ Quality Gates for Tests

### Test Quality Requirements

- **Test Names**: Descriptive and explain expected behavior
- **Test Independence**: Each test should run independently
- **Test Stability**: Tests should not be flaky or timing-dependent
- **Test Maintainability**: Tests should be easy to understand and update

### Performance Considerations

- **Test Speed**: Unit tests should run in <5ms, integration tests in <100ms
- **Resource Usage**: Tests should not consume excessive memory or disk space
- **Parallel Execution**: Tests should be safe to run in parallel
- **Cleanup**: Tests should clean up after themselves

## ⋇ TDD Documentation Standards

### Test Documentation

- **Test Purpose**: Comment explaining what the test validates
- **Test Setup**: Document any complex test setup or data requirements
- **Expected Behavior**: Clear description of expected outcomes
- **Edge Cases**: Document why specific edge cases are being tested

### Implementation Documentation

- **Design Decisions**: Document why specific implementation approaches were chosen
- **Performance Considerations**: Note any performance implications
- **Security Implications**: Document security-related implementation details
- **Future Improvements**: Note areas for potential future enhancement

---

**Remember**: TDD is not just about testing—it's a design methodology that leads to better, more maintainable code. The tests you write are the specification for your code's behavior across any project or technology stack.
