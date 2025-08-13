# Test-Driven Development (TDD) Standards for VDL_Vault Repository

## ⊕ TDD Philosophy for TypeScript Projects

Test-Driven Development is **mandatory** for all TypeScript projects in the VDL_Vault repository. This includes Phoenix Code Lite, QMS Infrastructure components, and any other TypeScript-based projects. TDD ensures code quality, maintainability, and user confidence across all systems.

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

## ⊎ Testing Framework Standards by Project

### Framework Standards: PCL (Jest + TypeScript)

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

### Framework Standards: QMS Infrastructure Components

For QMS-related TypeScript components, follow the same Jest configuration but with additional compliance validation:

```javascript
// Add QMS-specific test categories
module.exports = {
  // ... base configuration
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/compliance/**/*.test.ts',
    '<rootDir>/tests/regulatory/**/*.test.ts'
  ]
};
```

### Framework Standards: General TypeScript Projects

For other TypeScript projects in the repository:

```javascript
// Minimal Jest configuration for new TypeScript projects
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## ⋇ Test Writing Standards

### Writing Standards: Universal Unit Test Structure

Use the **AAA Pattern**: Arrange, Act, Assert

```typescript
describe('ComponentName validation', () => {
  it('should handle valid input correctly', () => {
    // Arrange
    const validInput = {
      property: 'valid value',
      otherProperty: 'another valid value'
    };

    // Act
    const result = ComponentName.process(validInput);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(expectedOutput);
  });

  it('should reject invalid input with appropriate error', () => {
    // Arrange
    const invalidInput = {
      property: '',  // Invalid: empty string
      otherProperty: 'valid value'
    };

    // Act
    const result = ComponentName.process(invalidInput);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('property cannot be empty');
  });
});
```

### Writing Standards: Integration Test Structure

Test workflows and component interactions

```typescript
describe('System Workflow Integration', () => {
  let systemComponent: SystemComponent;
  let mockDependency: jest.Mocked<DependencyInterface>;

  beforeEach(() => {
    mockDependency = createMockDependency();
    systemComponent = new SystemComponent(mockDependency);
  });

  it('should execute complete workflow successfully', async () => {
    // Arrange
    const workflowInput = {
      task: 'process user request',
      context: { userId: '123', permissions: ['read', 'write'] }
    };

    mockDependency.process.mockResolvedValueOnce({
      result: 'success',
      data: { processed: true }
    });

    // Act
    const result = await systemComponent.executeWorkflow(workflowInput);

    // Assert
    expect(result.success).toBe(true);
    expect(result.phases).toBeDefined();
    expect(mockDependency.process).toHaveBeenCalledWith(
      expect.objectContaining({ task: 'process user request' })
    );
  });
});
```

## ⊕ Test Categories by Project Type

### Test Categories: Phoenix Code Lite Core Components

Test the TDD workflow engine and CLI systems:

```typescript
// Test Core Infrastructure
- Foundation: System initialization and health monitoring
- ConfigManager: Configuration with hot reloading and validation
- SessionManager: Session lifecycle with metrics
- ErrorHandler: Centralized error handling

// Test TDD Workflow Components
- TDDOrchestrator: Workflow execution and phase management
- QualityGates: Quality validation system
- Individual Phases: Plan, Implement, Refactor phases

// Test CLI Components
- Interactive Session: Menu navigation and user interaction
- Command Processing: Command parsing and execution
- Mode Management: Standalone/integrated mode switching
```

### Test Categories: QMS Infrastructure Components

Test regulatory compliance and document management:

```typescript
// Test Compliance Validators
- EN62304Analyzer: Medical device software compliance
- AAMITIR45Analyzer: AGILE practices compliance
- ComplianceCriteria: Multi-standard validation

// Test Document Processing
- RegulatoryProcessor: Document parsing and validation
- AuditLogger: Compliance audit trail
- CryptographyValidator: Security compliance validation

// Test Performance Validators
- PerformanceBaseline: Performance standard compliance
- QMSPerformanceTarget: QMS-specific performance validation
```

### Test Categories: Cross-Project Integration

Test interactions between different projects:

```typescript
// Test Repository Integration
- CrossProjectDependencies: Dependencies between projects
- DocumentationConsistency: Consistent documentation across projects
- ConfigurationCompatibility: Compatible configurations

// Test Shared Utilities
- SecurityGuardrails: Consistent security across projects
- AuditLogging: Unified audit logging
- ErrorHandling: Consistent error handling patterns
```

## ◊ Coverage Requirements by Project

### Coverage: PCL (Mature Project)

- **Functions**: 90% - All public methods must be tested
- **Lines**: 90% - Critical code paths must be covered  
- **Branches**: 90% - Error conditions and edge cases tested
- **Statements**: 90% - All logical statements validated

### Coverage: QMS Infrastructure (Compliance-Critical)

- **Functions**: 95% - Regulatory compliance requires high coverage
- **Lines**: 95% - Critical for medical device compliance
- **Branches**: 95% - All compliance paths must be tested
- **Statements**: 95% - Regulatory audit requirements

### Coverage: Other TypeScript Projects (New/Experimental)

- **Functions**: 80% - Minimum viable coverage for new projects
- **Lines**: 80% - Adequate coverage for development
- **Branches**: 80% - Basic error handling coverage
- **Statements**: 80% - Standard coverage threshold

### Coverage Exclusions (All Projects)

Exclude from coverage requirements:

- Type definition files (`*.d.ts`)
- Test utilities and mocks (`src/testing/**`, `tests/fixtures/**`)
- Generated code and build artifacts
- External dependency integrations (test with mocks)
- Configuration files (unless they contain business logic)

## ^ TDD Implementation Workflow by Project Type

### TDD: For Phoenix Code Lite Features

1. **Understand Requirements**: Review user story and CLI workflow impact
2. **Design Test Cases**: Interactive CLI tests, session management tests
3. **Write Failing Tests**: Implement tests for CLI interaction patterns
4. **Implement Code**: Write minimal code for CLI/TDD workflow functionality
5. **Integration Testing**: Test with existing CLI and workflow components
6. **Refactor**: Improve CLI user experience and workflow efficiency

### TDD: For QMS Infrastructure Features

1. **Compliance Analysis**: Identify applicable regulatory standards
2. **Validation Design**: Plan compliance validation test scenarios
3. **Write Compliance Tests**: Implement tests for regulatory requirements
4. **Implement Validators**: Write minimal code for compliance checking
5. **Regulatory Testing**: Test against known compliance requirements
6. **Document Compliance**: Create necessary compliance documentation

### TDD: For General Repository Features

1. **Cross-Project Impact**: Assess impact on other projects in repository
2. **Integration Design**: Plan integration with existing repository structure
3. **Write Integration Tests**: Test compatibility with existing projects
4. **Implement Feature**: Write minimal code for required functionality
5. **Repository Testing**: Test impact on overall repository structure
6. **Update Documentation**: Update repository-wide documentation

## ◦ Testing Utilities and Patterns

### Mock Patterns for Different Project Types

#### Phoenix Code Lite Mocks

```typescript
// Mock Claude Code SDK for PCL testing
export function createMockClaudeClient(): jest.Mocked<ClaudeCodeClient> {
  return {
    query: jest.fn(),
    executeCommand: jest.fn(),
    editFile: jest.fn(),
    validateWorkflowContext: jest.fn()
  } as jest.Mocked<ClaudeCodeClient>;
}

// Mock CLI Session for interactive testing
export function createMockCLISession(): jest.Mocked<CLISession> {
  return {
    startInteractive: jest.fn(),
    handleUserInput: jest.fn(),
    updateContext: jest.fn(),
    endSession: jest.fn()
  } as jest.Mocked<CLISession>;
}
```

#### QMS Infrastructure Mocks

```typescript
// Mock regulatory validators
export function createMockComplianceValidator(): jest.Mocked<ComplianceValidator> {
  return {
    validateEN62304: jest.fn(),
    validateAAMITIR45: jest.fn(),
    generateComplianceReport: jest.fn(),
    validateCryptography: jest.fn()
  } as jest.Mocked<ComplianceValidator>;
}

// Mock document processors
export function createMockDocumentProcessor(): jest.Mocked<RegulatoryDocumentProcessor> {
  return {
    processDocument: jest.fn(),
    validateCompliance: jest.fn(),
    generateAuditTrail: jest.fn()
  } as jest.Mocked<RegulatoryDocumentProcessor>;
}
```

### Test Data Fixtures by Domain

#### Phoenix Code Lite Test Data

```typescript
// tests/fixtures/pcl-contexts.ts
export const validTDDContext = {
  taskDescription: 'Create email validation function with comprehensive testing',
  projectPath: './test-project',
  language: 'typescript',
  framework: 'jest',
  maxTurns: 3
};
```

#### QMS Test Data

```typescript
// tests/fixtures/qms-contexts.ts
export const validComplianceContext = {
  standard: 'EN62304',
  deviceClass: 'ClassB',
  softwareType: 'embedded',
  riskLevel: 'medium'
};
```

## ⊕ Quality Gates for Tests

### Test Quality Requirements (All Projects)

- **Test Names**: Descriptive and explain expected behavior
- **Test Independence**: Each test should run independently
- **Test Stability**: Tests should not be flaky or timing-dependent
- **Test Maintainability**: Tests should be easy to understand and update

### Performance Considerations by Project

#### Phoenix Code Lite

- **Unit Tests**: <5ms per test (CLI responsiveness critical)
- **Integration Tests**: <100ms per test (user experience focused)
- **E2E Tests**: <1000ms per test (complete workflow testing)

#### QMS Infrastructure

- **Compliance Tests**: <200ms per test (comprehensive validation)
- **Document Processing**: <500ms per test (regulatory document processing)
- **Audit Tests**: <100ms per test (audit trail integrity)

#### General Repository

- **Unit Tests**: <10ms per test (reasonable for new projects)
- **Integration Tests**: <200ms per test (cross-project testing)
- **System Tests**: <2000ms per test (repository-wide testing)

---

**Remember**: TDD is not just about testing—it's a design methodology that leads to better, more maintainable code across all projects in the VDL_Vault repository. The tests you write are the specification for your code's behavior and ensure consistency across the entire ecosystem.
