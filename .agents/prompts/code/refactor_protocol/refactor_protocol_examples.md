# Refactor Protocol Examples & Workflows

**Purpose**: Comprehensive examples and troubleshooting for the Self-Executing Refactor Protocol  
**Usage**: Reference this file when you need detailed workflow examples or troubleshooting guidance  
**Related**: [Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)

---

## ⊕ Usage Examples

### 1.1 Basic Usage Workflow

**Scenario**: User wants to refactor a messy Python web application

**Step-by-Step Example**:

```bash
# 1. User provides project files and protocol document
User: "Here are my Python Flask project files. Use the refactor protocol to clean up this codebase."

# 2. Agent automatically detects or creates working copy
Agent: "I'll analyze your Python Flask project and begin the refactoring process.
       Creating working copy: refactor_protocol_working.md"

# 3. Agent executes Phase 0: Setup & Context Gathering
Agent: "Phase 0 Complete: Project Context Analysis
       - Language: Python 3.9+
       - Framework: Flask 2.0+
       - Structure: Mixed responsibilities in single files
       - Quality: Multiple code smells detected
       
       Next: Phase 1 - Reconnaissance & Planning"

# 4. User continues the process
User: "Continue with the refactor protocol"

# 5. Agent continues from current state
Agent: "Phase 1 Complete: Code Smell Analysis
       - 15 long methods (>20 lines)
       - 8 large classes (>200 lines)  
       - 12 duplicate code patterns
       
       Next: Phase 2 - Safety Net Creation"
```

### 1.2 Advanced Usage with Customization

**Scenario**: User wants to refactor a TypeScript React project with specific quality targets

**Customized Example**:

```bash
# User provides specific requirements
User: "Refactor my React TypeScript project. Focus on component separation and maintain 95% test coverage."

# Agent adapts templates to user requirements
Agent: "Adapting protocol for React TypeScript with 95% coverage target.
       
       Phase 2: Enhanced Safety Net Creation
       - Target Coverage: 95% (increased from 90%)
       - Focus Areas: Component separation, type safety
       - Testing Framework: Jest + React Testing Library
       
       Creating comprehensive test suites for all components..."
```

### 1.3 Multi-Phase Execution Example

**Scenario**: Complete refactoring workflow from start to finish

**Full Workflow Example**:

```bash
# Phase 0: Setup & Context Gathering
Agent: "Phase 0 Complete: Project Analysis
       - JavaScript Node.js project with Express
       - 45 source files, mixed responsibilities
       - No existing tests, poor error handling
       
       Next: Phase 1 - Reconnaissance & Planning"

# Phase 1: Reconnaissance & Planning  
Agent: "Phase 1 Complete: Refactoring Plan Created
       - 23 code smells identified
       - 8 structural reorganization tasks
       - 15 granular refactoring tasks
       - Estimated effort: 12-18 hours
       
       Next: Phase 2 - Safety Net Creation"

# Phase 2: Safety Net Creation
Agent: "Phase 2 Complete: Test Coverage Achieved
       - 15 test suites created
       - Coverage: 92% (exceeds 90% target)
       - All tests passing
       - Safety net ready for refactoring
       
       Next: Phase 3 - Structural Reorganization"

# Phase 3: Structural Reorganization
Agent: "Phase 3 Complete: Project Structure Improved
       - 8 mixed-responsibility files separated
       - Directory structure follows Express conventions
       - All imports and references updated
       - Architecture significantly improved
       
       Next: Phase 4 - Granular Refactoring"

# Phase 4: Granular Refactoring
Agent: "Phase 4 Complete: Code Quality Improved
       - 23 long methods broken down
       - 12 duplicate code patterns consolidated
       - All tests still passing
       - Code complexity reduced by 40%
       
       Next: Phase 5 - Final Polish & Documentation"

# Phase 5: Final Polish & Documentation
Agent: "Phase 5 Complete: Refactoring Finished
       - Comprehensive documentation generated
       - Final quality review passed
       - All objectives achieved
       
       * Refactoring Complete! Your codebase has been transformed."
```

---

## ◦ Language-Specific Examples

### Python Example

```python
# Before: Mixed responsibilities in single file
class UserManager:
    def __init__(self):
        self.db = Database()
        self.cache = RedisCache()
    
    def create_user(self, user_data):
        # User creation logic
        pass
    
    def send_email(self, user_id, template):
        # Email sending logic
        pass
    
    def validate_user_data(self, data):
        # Validation logic
        pass

# After: Separated into focused files
# user_manager.py - User CRUD operations
# email_service.py - Email functionality  
# validation.py - Data validation logic
```

### TypeScript Example

```typescript
// Before: Large component with mixed concerns
class UserDashboard extends React.Component {
    // 200+ lines of mixed UI, business logic, and data fetching
}

// After: Separated into focused components
// UserDashboard.tsx - Main container component
// UserProfile.tsx - Profile display component
// UserActions.tsx - Action buttons component
// useUserData.ts - Custom hook for data fetching
```

### JavaScript Example

```javascript
// Before: Callback hell and mixed responsibilities
function processUserData(userId, callback) {
    getUser(userId, function(user) {
        if (user) {
            validateUser(user, function(isValid) {
                if (isValid) {
                    updateUser(user, function(updatedUser) {
                        callback(null, updatedUser);
                    });
                } else {
                    callback('Invalid user');
                }
            });
        } else {
            callback('User not found');
        }
    });
}

// After: Clean async/await with separation of concerns
async function processUserData(userId) {
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');
    
    const isValid = await validateUser(user);
    if (!isValid) throw new Error('Invalid user');
    
    return await updateUser(user);
}
```

---

## ⚡ Troubleshooting Procedures

### 2.1 Common Issues and Solutions

#### Issue: Agent can't find or read working copy

**Symptoms**: Agent starts from Phase 0 instead of continuing progress
**Solutions**:

1. **Check file location**: Ensure `refactor_protocol_working.md` is in project root
2. **Verify file permissions**: Check file is readable by the agent
3. **Check file format**: Ensure working copy contains valid JSON state
4. **Manual recovery**: If file is corrupted, manually restore from last known good state

#### Issue: Template resolution fails with unresolved placeholders

**Symptoms**: Templates contain `{{variable}}` placeholders instead of actual values
**Solutions**:

1. **Check project context**: Ensure agent has analyzed project files
2. **Verify context variables**: Check that all required context data is available
3. **Restart analysis**: Ask agent to re-analyze project context
4. **Manual context**: Provide missing context information manually

#### Issue: Phase transitions not working correctly

**Symptoms**: Agent stuck in current phase or skipping required steps
**Solutions**:

1. **Check completion criteria**: Verify all phase requirements are met
2. **Review state data**: Check working copy for missing or invalid data
3. **Force phase check**: Ask agent to verify current phase status
4. **Manual phase advancement**: Manually update working copy state if needed

#### Issue: Tests failing after refactoring

**Symptoms**: Code changes break existing functionality
**Solutions**:

1. **Revert changes**: Return to last working state
2. **Analyze failures**: Review test output to understand issues
3. **Fix refactoring**: Adjust refactoring approach to maintain functionality
4. **Re-run tests**: Verify fixes restore test passing status

### 2.2 Error Recovery Procedures

#### State Corruption Recovery

```bash
# 1. Identify corruption symptoms
- JSON parsing errors in working copy
- Missing required state variables
- Invalid phase or step values

# 2. Attempt automatic recovery
Agent: "Detected corrupted state. Attempting recovery..."

# 3. If automatic recovery fails, manual intervention required
User: "The state is corrupted. Help me recover manually."

# 4. Manual recovery steps
- Backup corrupted working copy
- Restore from last known good state
- Re-run last successful action
- Verify state consistency
```

#### Template Failure Recovery

```bash
# 1. Identify template failure
- Placeholder resolution errors
- Template syntax issues
- Context variable conflicts

# 2. Attempt alternative templates
Agent: "Primary template failed. Attempting fallback template..."

# 3. If all templates fail, request human guidance
Agent: "All templates failed. I need your guidance to proceed."

# 4. Manual template selection
User: "Use the basic refactoring template for this step."
```

#### Progress Loss Recovery

```bash
# 1. Identify progress loss
- Working copy missing or corrupted
- Session restart without progress preservation
- Agent change without state transfer

# 2. Attempt progress restoration
Agent: "Progress lost. Attempting to restore from available sources..."

# 3. If restoration fails, manual progress reconstruction
User: "Help me reconstruct the progress manually."

# 4. Manual progress reconstruction
- Review project changes made so far
- Identify current refactoring phase
- Recreate working copy with current state
- Continue from reconstructed state
```

### 2.3 Performance Issue Resolution

#### Slow Template Processing

```bash
# Symptoms: Template resolution takes >1 second
# Solutions:
1. Check context variable complexity
2. Simplify template logic
3. Cache frequently used context data
4. Break complex templates into smaller parts
```

#### Memory Usage Issues

```bash
# Symptoms: Memory usage >100MB for large projects
# Solutions:
1. Limit context variable storage
2. Implement context data cleanup
3. Use streaming for large file analysis
4. Implement memory usage monitoring
```

#### Large Project Handling

```bash
# Symptoms: Timeouts or crashes with 100+ files
# Solutions:
1. Break analysis into smaller chunks
2. Implement incremental processing
3. Use background processing for large tasks
4. Implement progress checkpointing
```

---

## ◊ Sample Outputs

### 3.1 Phase Completion Reports

#### Phase 0 Completion Report

```markdown
## Phase 0 Complete: Setup & Context Gathering

### Project Context Extracted
- **Language**: Python 3.9+
- **Framework**: Django 4.0+
- **Structure**: Monolithic application with mixed responsibilities
- **Size**: 67 source files, 12,450 lines of code
- **Quality**: Multiple code smells, poor test coverage

### Environment Setup Complete
- **Git Status**: ✓ Refactoring branch created: refactor/django-cleanup-2024-01-15
- **Build Status**: ✓ Django server starts successfully
- **Test Status**: ⚠ 23% test coverage (below 90% target)
- **Workspace**: ✓ Ready for refactoring

### Next Phase Ready
**Phase 1**: Reconnaissance & Planning
- Code smell analysis
- Refactoring opportunity identification
- Comprehensive refactoring plan creation
```

#### Phase 1 Completion Report

```markdown
## Phase 1 Complete: Reconnaissance & Planning

### Code Smell Analysis Results
- **Long Methods**: 18 methods >20 lines (critical: 8, high: 6, medium: 4)
- **Large Classes**: 12 classes >200 lines (critical: 5, high: 4, medium: 3)
- **Code Duplication**: 15 duplicate patterns across 23 files
- **Deep Nesting**: 9 functions with >3 nesting levels
- **Mixed Responsibilities**: 14 files violate single responsibility principle

### Refactoring Plan Created
**Phase 2: Safety Net Creation**
- Task 2.1: Create tests for `UserManager` class (estimated: 2 hours)
- Task 2.2: Create tests for `OrderProcessor` class (estimated: 3 hours)
- Task 2.3: Create tests for `PaymentValidator` class (estimated: 2 hours)

**Phase 3: Structural Reorganization**
- Task 3.1: Separate `UserManager` into focused classes (estimated: 4 hours)
- Task 3.2: Reorganize project directory structure (estimated: 3 hours)

**Phase 4: Granular Refactoring**
- Task 4.1: Extract methods from long functions (estimated: 6 hours)
- Task 4.2: Consolidate duplicate code patterns (estimated: 4 hours)

### Risk Assessment
- **High Risk**: UserManager separation (affects 8 other modules)
- **Medium Risk**: Directory restructuring (requires import updates)
- **Low Risk**: Method extraction and duplicate consolidation

### Timeline Estimate
- **Total Effort**: 28 hours
- **Phase 2**: 7 hours (safety net creation)
- **Phase 3**: 7 hours (structural reorganization)
- **Phase 4**: 14 hours (granular refactoring)
```

### 3.2 Template Output Examples

#### Template 2.1 Output (Test Suite Generation)

```markdown
## Test Suite Generated for UserManager Module

### Test File Created
**Location**: `tests/test_user_manager.py`
**Framework**: pytest
**Coverage Target**: >90%

### Test Coverage Achieved
- **Overall Coverage**: 94%
- **Function Coverage**: 100% (all 8 public methods tested)
- **Line Coverage**: 94% (missing edge cases in error handling)
- **Branch Coverage**: 91% (some conditional paths not fully tested)

### Test Results
- **Total Tests**: 23
- **Passing**: 23 ✓
- **Failing**: 0 ✗
- **Test Categories**:
  - Unit tests: 18
  - Integration tests: 3
  - Edge case tests: 2

### What's Tested
- User creation with valid data
- User creation with invalid data
- User retrieval by ID
- User update operations
- User deletion
- Error handling for database failures
- Edge cases (empty data, null values, boundary conditions)

### Safety Net Status
✓ **Ready for refactoring** - Tests will catch behavioral changes
```

#### Template 3.1 Output (File Separation)

```markdown
## File Separation Complete for UserManager

### New File 1: `user_management.py`
**Purpose**: Core user CRUD operations
**Responsibilities**: User creation, retrieval, updates, deletion
**Dependencies**: Database connection, validation utilities

> ```python
> class UserManager:
>     """Core user management operations."""
>     
>     def __init__(self, db_connection):
>         self.db = db_connection
>     
>     def create_user(self, user_data):
>         """Create new user with validation."""
>         # Implementation here
>     
>     def get_user(self, user_id):
>         """Retrieve user by ID."""
>         # Implementation here
>     
>     # ... other user operations
> ```

### New File 2: `user_validation.py`

**Purpose**: User data validation logic
**Responsibilities**: Input validation, business rule enforcement
**Dependencies**: Validation schemas, business rule engine

> ```python
> class UserValidator:
>     """User data validation and business rules."""
>     
>     def validate_user_data(self, data):
>         """Validate user input data."""
>         # Implementation here
>     
>     def enforce_business_rules(self, user_data):
>         """Apply business-specific validation rules."""
>         # Implementation here
> ```

### Import Updates Required

- Update `models.py` to import from new files
- Update `views.py` to use separated classes
- Update `admin.py` to reference new structure

### Separation Complete

✓ **Single Responsibility Principle** achieved
✓ **All functionality preserved**
✓ **Clean separation of concerns**
✓ **Ready for Phase 4: Granular Refactoring**
```

### 3.3 Progress Tracking Examples

#### Progress Summary Report

```markdown
## Refactoring Progress Summary

### Overall Progress: 67% Complete
- **Phase 0**: Setup & Context Gathering - ✓ COMPLETED
- **Phase 1**: Reconnaissance & Planning - ✓ COMPLETED  
- **Phase 2**: Safety Net Creation - ✓ COMPLETED
- **Phase 3**: Structural Reorganization - ⇔ IN PROGRESS (80%)
- **Phase 4**: Granular Refactoring - ‖ PENDING
- **Phase 5**: Final Polish & Documentation - ‖ PENDING

### Current Status
- **Phase**: 3 - Structural Reorganization
- **Step**: File separation for OrderProcessor class
- **Action Required**: Separate mixed responsibilities in OrderProcessor

### Completed Work
- ✓ Project context analysis and environment setup
- ✓ Code smell analysis and refactoring plan creation
- ✓ Test suites created for all critical modules (94% coverage)
- ✓ UserManager class separated into focused files
- ✓ Project directory structure reorganized

### Next Actions
1. Complete OrderProcessor file separation
2. Finish remaining structural reorganization tasks
3. Begin Phase 4: Granular Refactoring
4. Extract methods from long functions
5. Consolidate duplicate code patterns

### Estimated Time Remaining: 8-12 hours
```

#### Error Recovery Report

```markdown
## Error Recovery Report

### Error Encountered
**Type**: Template Resolution Failure
**Location**: Phase 3, Template 3.1 (File Separation)
**Description**: Unable to resolve {{current.code_snippet}} placeholder

### Root Cause Analysis
- Context variable `current.code_snippet` not populated
- File analysis incomplete for OrderProcessor class
- Missing code extraction from source files

### Recovery Actions Taken
1. ✓ **Automatic Recovery Attempted**: Fallback template used
2. ✓ **Context Re-analysis**: Project files re-analyzed
3. ✓ **Code Extraction**: OrderProcessor code extracted and analyzed
4. ✓ **Template Re-execution**: File separation completed successfully

### Current Status
- **Error Resolved**: ✓
- **Recovery Successful**: ✓
- **Progress Preserved**: ✓
- **Ready to Continue**: ✓

### Prevention Measures
- Enhanced context validation before template execution
- Improved error detection for missing context variables
- Better fallback template selection logic
```

---

## * Best Practices and Tips

### 4.1 For Users

#### Getting Started

1. **Start Simple**: Begin with small, focused refactoring tasks
2. **Trust the Process**: Let the protocol guide you through each phase
3. **Monitor Progress**: Check progress tracking regularly
4. **Ask Questions**: Request clarification when steps aren't clear

#### Managing Large Projects

1. **Break It Down**: Large refactoring efforts can be overwhelming
2. **Focus on Phases**: Complete one phase before moving to the next
3. **Regular Check-ins**: Continue the protocol regularly to maintain momentum
4. **Celebrate Progress**: Acknowledge improvements as they happen

#### Handling Interruptions

1. **Save Progress**: The working copy preserves your progress
2. **Resume Easily**: Simply say "Continue with the refactor protocol"
3. **Review Changes**: Check what's been accomplished before continuing
4. **Maintain Context**: The agent remembers where you left off

### 4.2 For Agents

#### Template Execution

1. **Always Validate Context**: Ensure all placeholders can be resolved
2. **Check Completion Criteria**: Verify phase requirements before advancing
3. **Update Progress**: Keep working copy current after each action
4. **Handle Errors Gracefully**: Provide clear error messages and recovery steps

#### State Management

1. **Preserve Progress**: Never overwrite existing working copies
2. **Validate State**: Check state consistency before proceeding
3. **Update Timestamps**: Keep last_updated current
4. **Handle Corruption**: Detect and recover from corrupted states

#### User Communication

1. **Clear Instructions**: Provide actionable next steps
2. **Progress Visibility**: Show current status and completion percentage
3. **Error Explanation**: Explain what went wrong and how to fix it
4. **Recovery Guidance**: Help users resume after interruptions

---

## ∞ Related Documentation

- **[Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)** - Core execution engine and templates
- **[Template Reference](mdc:prompts/code/refactor_protocol_templates.md)** - Extended template variations
- **[Testing Guide](mdc:prompts/code/refactor_protocol_testing.md)** - Testing procedures and validation
- **[Language Specifics](mdc:prompts/code/refactor_protocol_language_specifics.md)** - Language-specific patterns
- **[Troubleshooting Guide](mdc:prompts/code/refactor_protocol_troubleshooting.md)** - Extended troubleshooting

---

**Remember**: These examples demonstrate the protocol in action. Use them as reference when implementing your own refactoring workflows or when troubleshooting issues.
