# Development Workflow

## ⊕ Overview

This document defines the step-by-step development workflow for making changes to any project. Following this workflow ensures consistency, quality, and maintainability across different codebases and technologies.

## ⋇ Pre-Development Checklist

### 1. Context Understanding

- [ ] **Read the task** - Understand exactly what needs to be done
- [ ] **Review user context** - Understand where this fits in user workflows
- [ ] **Check related documentation** - Review relevant API docs, user guides, and architecture documentation
- [ ] **Identify affected components** - Determine which parts of the system will be modified

### 2. Environment Preparation

- [ ] **Verify development environment** - Ensure required tools and dependencies are up to date
- [ ] **Run existing tests** - Confirm all tests pass before making changes
- [ ] **Check build status** - Ensure compilation/build succeeds
- [ ] **Review current configuration** - Understand current system state

```bash
# Environment verification commands (adapt for your project)
npm test                    # For Node.js projects
npm run lint               # For projects with linting
npm run build              # For projects with build process
# Or equivalent commands for your technology stack
```

### 3. Architecture Review

- [ ] **Review component architecture** - Understand how the affected components interact
- [ ] **Check security implications** - Consider security guardrails and policies
- [ ] **Assess integration points** - Identify how changes might affect other components
- [ ] **Plan change scope** - Define minimal scope to achieve the objective

## ⇔ TDD Development Cycle

### Phase 1: Test Planning and Design

#### 1.1 Analyze Requirements

```markdown
Task: {Write the specific task here}

Requirements Analysis:
- Functional requirements: {What should the system do?}
- Non-functional requirements: {Performance, security, usability}
- User experience requirements: {How should users interact with this?}
- Integration requirements: {How does this fit with existing features?}
```

#### 1.2 Design Test Strategy

- [ ] **Identify test categories** - Unit tests, integration tests, user experience tests
- [ ] **Plan test data** - What test data and mocks are needed?
- [ ] **Design test scenarios** - Happy path, edge cases, error conditions
- [ ] **Consider performance tests** - If change affects performance

#### 1.3 Write Failing Tests First

```typescript
// Example test structure (adapt for your testing framework)
describe('Feature/Component Name', () => {
  // Setup and teardown
  beforeEach(() => {
    // Test setup
  });

  // Happy path tests
  it('should handle the primary use case', () => {
    // Arrange
    // Act  
    // Assert
  });

  // Edge case tests
  it('should handle edge case scenarios', () => {
    // Test edge cases
  });

  // Error condition tests
  it('should handle error conditions gracefully', () => {
    // Test error handling
  });
});
```

### Phase 2: Implementation

#### 2.1 Minimal Implementation

- [ ] **Write minimal code** - Only what's needed to pass the current test
- [ ] **Follow language standards** - Use appropriate typing and proper interfaces
- [ ] **Apply security practices** - Follow security guidelines for your project
- [ ] **Use existing patterns** - Follow established patterns in the codebase

#### 2.2 Iterative Development

```bash
# Development iteration cycle (adapt for your project)
npm test                    # Run tests
npm run lint               # Check code quality
npm run build              # Verify compilation
# Fix any issues and repeat
```

#### 2.3 Integration Testing

- [ ] **Test component integration** - Ensure changes work with existing components
- [ ] **Test user workflows** - Verify user experience isn't degraded
- [ ] **Test error scenarios** - Confirm error handling works correctly
- [ ] **Test security constraints** - Verify security guardrails still function

### Phase 3: Refactor and Polish

#### 3.1 Code Quality Improvement

- [ ] **Refactor for clarity** - Improve code readability and structure
- [ ] **Optimize performance** - Address any performance concerns
- [ ] **Add comprehensive comments** - Document complex logic and decisions
- [ ] **Ensure code quality** - Verify compliance with project standards

#### 3.2 Documentation Updates

- [ ] **Update API documentation** - If public interfaces changed
- [ ] **Update user documentation** - If user-facing behavior changed
- [ ] **Update architecture documentation** - If system architecture affected
- [ ] **Add code comments** - For complex or non-obvious implementations

## ◊ Quality Gates Validation

### Code Quality Gates

```bash
# Run all quality checks (adapt for your project)
npm run lint               # Linting validation
npm run build              # Compilation/build (must succeed)
npm test                   # Test execution (must pass all tests)
npm run test:coverage      # Coverage check (target: >90%)
```

### Security Gates

- [ ] **File access validation** - Ensure changes respect security guardrails
- [ ] **Input validation** - All user inputs properly validated
- [ ] **Error handling** - No sensitive information exposed in errors
- [ ] **Command execution** - Only safe commands allowed

### Integration Gates

- [ ] **Backward compatibility** - Existing functionality still works
- [ ] **Configuration compatibility** - Existing configurations still valid
- [ ] **Performance impact** - No significant performance degradation
- [ ] **User experience** - User workflows improved or maintained

## ⋇ Documentation Workflow

### During Development

1. **Start change documentation** - Create change document following your project's template
2. **Update documentation continuously** - Record decisions and challenges as they occur
3. **Document test results** - Record actual test outcomes, not assumptions

### Change Document Creation

```bash
# Generate timestamp for change document
timestamp=$(date "+%Y-%m-%d-%H%M")
filename="$timestamp-{brief-description}.md"

# Create change document in your project's changes directory
echo "Creating change document: $filename"
```

### Documentation Completion

- [ ] **Complete all template sections** - Fill out every section in your change document template
- [ ] **Verify timestamp accuracy** - Use command-generated timestamps
- [ ] **Include specific file paths** - List all modified files with exact paths
- [ ] **Document user impact** - Explain how changes affect user experience

## ◦ Component-Specific Workflows

### Interactive CLI Session Components

When modifying interactive CLI components:

1. **Test session persistence** - Verify session state is maintained across interactions
2. **Test navigation consistency** - Ensure navigation and back commands work
3. **Test mode switching** - Verify seamless switching between interaction modes
4. **Test context preservation** - Ensure user context is maintained throughout session

```typescript
// Interactive session testing patterns (adapt for your framework)
describe('CLISession', () => {
  let mockInput: MockInputStream;
  let session: CLISession;
  
  beforeEach(() => {
    mockInput = new MockInputStream();
    session = new CLISession({ 
      interactionManager: new MockInteractionManager() 
    });
  });

  it('should maintain session context across navigation', async () => {
    // Test navigation flow: Main → Config → Documents → Back
    mockInput.push('2\n');        // Select Configuration
    mockInput.push('3\n');        // Select Document Management  
    mockInput.push('back\n');     // Navigate back
    
    const result = await session.handleUserInteraction();
    expect(result.context.location).toBe('configuration');
  });
});
```

### Document Management Integration Testing

When implementing document management features:

1. **Use dependency injection** - Inject dependencies for proper testing
2. **Mock interactive components** - Create mocks for session and menu interactions
3. **Test template integration** - Verify document settings persist per template
4. **Test security validation** - Ensure security policies are properly enforced

```typescript
// Document management testing with proper architecture
describe('DocumentManager Integration', () => {
  let documentManager: DocumentManager;
  let mockSecurityManager: jest.Mocked<SecurityManager>;
  
  beforeEach(() => {
    // Use dependency injection for testing
    mockSecurityManager = createMockSecurityManager();
    documentManager = new DocumentManager(testPath, mockSecurityManager);
  });

  it('should integrate with session-based configuration', async () => {
    const configEditor = new DocumentConfigurationEditor();
    const mockSession = createMockSession();
    
    await configEditor.editTemplateDocuments('enterprise', mockSession);
    
    expect(mockSession.updateContext).toHaveBeenCalledWith({
      location: 'configuration.documents',
      template: 'enterprise'
    });
  });
});
```

### Configuration System Changes

When modifying configuration:

1. **Test template loading** - Verify all templates load correctly
2. **Test validation** - Ensure validation catches invalid configurations
3. **Test migration** - Verify existing configurations continue to work
4. **Test interactive editor** - If modifying the configuration editor

### Workflow Changes

When modifying workflow components:

1. **Test workflow orchestration** - Verify all phases execute correctly
2. **Test quality gates** - Ensure quality validation works properly
3. **Test error recovery** - Verify graceful handling of failures
4. **Test integration** - Ensure external integrations function correctly

### Security Component Changes

When modifying security:

1. **Test security policies** - Verify guardrails enforce security constraints
2. **Test access controls** - Ensure file and command restrictions work
3. **Test audit logging** - Verify security events are properly logged
4. **Test error handling** - Ensure security errors don't expose sensitive information

## ⚡ Error Handling Workflow

### When Things Go Wrong

1. **Don't panic** - Systematic debugging is more effective than rushed fixes
2. **Preserve evidence** - Save error messages, logs, and system state
3. **Isolate the problem** - Use tests to identify the specific issue
4. **Apply minimal fix** - Make the smallest change that resolves the issue
5. **Test thoroughly** - Ensure the fix doesn't introduce new problems

### Debugging Steps

```bash
# Systematic debugging approach (adapt for your project)
npm test -- --verbose      # Get detailed test output
npm run lint -- --fix      # Fix any code style issues
npm run build -- --listFiles  # Check compilation issues
# Add runtime debugging as appropriate for your stack
```

### Recovery Procedures

- **Test failures** - Analyze test output, fix one test at a time
- **Build failures** - Address compilation errors systematically
- **Runtime errors** - Use logging and debugging tools to identify root cause
- **Integration failures** - Test components in isolation to identify integration issues

## ✓ Completion Checklist

### Before Considering Work Complete

- [ ] **All tests pass** - Including new tests and existing regression tests
- [ ] **Quality gates pass** - Lint, build, coverage, security checks
- [ ] **Documentation complete** - Change document fully filled out with accurate information
- [ ] **User impact considered** - Changes improve or maintain user experience
- [ ] **Security validated** - Security guardrails still function correctly
- [ ] **Performance maintained** - No significant performance degradation
- [ ] **Integration verified** - Changes work correctly with existing components

### Final Validation

```bash
# Complete validation suite (adapt for your project)
npm run build && npm test && npm run lint
echo "Validation complete: $(date)"
```

### Change Document Finalization

1. **Complete timestamp** - Add final completion timestamp using `date` command
2. **Review all sections** - Ensure no template sections left incomplete
3. **Verify file accuracy** - Confirm all modified files are listed correctly
4. **Document lessons learned** - Record insights for future development

---

**Remember**: Quality is achieved through process, not shortcuts. Following this workflow consistently leads to reliable, maintainable code that serves users well across any project or technology stack.
