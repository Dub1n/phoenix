# Test-Driven Development (TDD) Standards

## ⊕ TDD Philosophy for Phoenix Code Lite

Test-Driven Development is **mandatory** for all Phoenix Code Lite development. This ensures code quality, maintainability, and user confidence in the system.

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
- **Quality**: Apply TypeScript best practices, improve readability
- **Documentation**: Add comments and improve structure

## ⊎ Testing Framework Standards

### Jest Configuration

Phoenix Code Lite uses Jest with TypeScript support via ts-jest.

```javascript
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
```

### Test File Organization

```text
tests/
├── unit/                    # Unit tests for individual components
│   ├── tdd/                # TDD workflow components
│   ├── claude/             # Claude Code integration
│   ├── cli/                # CLI components
│   └── utils/              # Utility functions
├── integration/            # Integration tests for workflows
│   ├── tdd-workflow.test.ts
│   ├── cli-interface.test.ts
│   └── end-to-end.test.ts
└── fixtures/               # Test data and mocks
    ├── mock-responses/
    └── sample-configs/
```

## ⋇ Test Writing Standards

### Unit Test Structure

Use the **AAA Pattern**: Arrange, Act, Assert

```typescript
describe('TaskContextSchema validation', () => {
  it('should accept valid task context', () => {
    // Arrange
    const validContext = {
      taskDescription: 'Create a hello world function',
      projectPath: '/path/to/project',
      maxTurns: 3
    };

    // Act
    const result = TaskContextSchema.safeParse(validContext);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validContext);
  });

  it('should reject task description that is too short', () => {
    // Arrange
    const invalidContext = {
      taskDescription: 'Hi',  // Too short (< 10 characters)
      projectPath: '/path/to/project',
      maxTurns: 3
    };

    // Act
    const result = TaskContextSchema.safeParse(invalidContext);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('at least 10 characters');
  });
});
```

### Integration Test Structure

Test workflows and component interactions

```typescript
describe('TDD Workflow Integration', () => {
  let orchestrator: TDDOrchestrator;
  let mockClaudeClient: jest.Mocked<ClaudeCodeClient>;

  beforeEach(() => {
    mockClaudeClient = createMockClaudeClient();
    orchestrator = new TDDOrchestrator(mockClaudeClient);
  });

  it('should execute complete 3-phase workflow', async () => {
    // Arrange
    const taskContext: TaskContext = {
      taskDescription: 'Create email validation function',
      projectPath: './test-project',
      maxTurns: 3
    };

    mockClaudeClient.query.mockResolvedValueOnce({
      content: 'Test generation response',
      usage: { inputTokens: 100, outputTokens: 200 }
    });

    // Act
    const result = await orchestrator.executeWorkflow(
      taskContext.taskDescription, 
      taskContext
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.phases).toHaveLength(3);
    expect(result.phases[0].name).toBe('plan-test');
    expect(result.phases[1].name).toBe('implement-fix');
    expect(result.phases[2].name).toBe('refactor-document');
  });
});
```

## ⊕ Test Categories by Component

### Core TDD Components

Test the fundamental TDD workflow engine:

```typescript
// Test TDDOrchestrator
- executeWorkflow() with valid/invalid inputs
- Phase execution order and state management
- Error handling and recovery
- Quality gate integration
- Audit logging functionality

// Test Individual Phases
- PlanTestPhase: Test generation and strategy
- ImplementFixPhase: Code generation and fixing
- RefactorDocumentPhase: Quality improvement
```

### Claude Code Integration

Test the Claude SDK wrapper and communication:

```typescript
// Test ClaudeCodeClient
- Query execution with retry logic
- Response validation with Zod schemas
- Token usage tracking
- Error handling and timeouts
- Rate limiting compliance

// Test Prompt Engineering
- Agent-specific prompt generation
- Context-aware prompt construction
- Template rendering and validation
```

### CLI Components

Test user interface and interaction:

```typescript
// Test CLI Commands
- Command parsing and validation
- Option handling and defaults
- Error messages and help text
- Progress tracking and output

// Test Interactive Features
- Configuration wizard
- Template selection
- User input validation
- Confirmation dialogs
```

### Configuration System

Test configuration management and templates:

```typescript
// Test Configuration Loading
- Template loading and validation
- Configuration merging and inheritance
- Schema validation with Zod
- File system operations

// Test Configuration Templates
- Starter template validation
- Enterprise template features
- Performance template optimization
- Custom template creation
```

## ⑄ Testing Security Components

### Security Guardrails Testing

```typescript
describe('SecurityGuardrailsManager', () => {
  it('should block access to restricted paths', async () => {
    const manager = new SecurityGuardrailsManager();
    
    const result = await manager.validateFileAccess('/etc/passwd', 'read');
    
    expect(result.allowed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe('path_violation');
  });

  it('should allow access to project files', async () => {
    const manager = new SecurityGuardrailsManager();
    
    const result = await manager.validateFileAccess('./src/index.ts', 'read');
    
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

- Type definition files (`*.d.ts`)
- Test utilities and mocks (`src/testing/**`)
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

### Mock Claude Code SDK

```typescript
// src/testing/mock-claude.ts
export function createMockClaudeClient(): jest.Mocked<ClaudeCodeClient> {
  return {
    query: jest.fn(),
    executeCommand: jest.fn(),
    editFile: jest.fn(),
    validateWorkflowContext: jest.fn()
  } as jest.Mocked<ClaudeCodeClient>;
}
```

### Test Data Fixtures

```typescript
// tests/fixtures/sample-contexts.ts
export const validTaskContext: TaskContext = {
  taskDescription: 'Create a function that validates email addresses',
  projectPath: './test-project',
  language: 'typescript',
  framework: 'jest',
  maxTurns: 3
};

export const complexTaskContext: TaskContext = {
  taskDescription: 'Implement user authentication with JWT tokens and rate limiting',
  projectPath: './enterprise-project',
  language: 'typescript',
  framework: 'express',
  maxTurns: 5
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

**Remember**: TDD is not just about testing—it's a design methodology that leads to better, more maintainable code. The tests you write are the specification for your code's behavior.
