# Validator Development Template

This directory contains the standardized template for creating new validators in the validation system.

## Template Usage

### 1. Copy the Template

```bash
cp templates/validator-template.js src/validators/your-category-validator.js
```

### 2. Replace Template Variables

The template uses bracketed placeholders that must be replaced:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `[VALIDATOR_NAME]` | Human-readable validator name | `UI Validation` |
| `[CATEGORY_DESCRIPTION]` | Brief category description | `UI/UX Tasks` |
| `[CATEGORY_NAME]` | Category identifier | `ui` |
| `[DETAILED_DESCRIPTION]` | Full description | `UI component validation, responsive design, accessibility` |
| `[SECTION_REFERENCE]` | Testing guide section | `5` |
| `[CREATION_DATE]` | Creation date | `2025-09-10` |
| `[VALIDATOR_CLASS_NAME]` | Class name | `UIValidator` |
| `[SCOPE_PATTERN_X]` | File patterns to validate | `src/ui/**/*.ts` |
| `[HAS_INTEGRATION_TESTS]` | Boolean for integration tests | `true` |
| `[INTERNAL_STATE]` | Internal state property name | `uiComponents` |
| `[TEST_X_NAME]` | Test method names | `Component Structure Test` |
| `[TEST_X_METHOD]` | Test method names | `executeComponentStructureTest` |
| `[DEPENDENCY_X]` | Required dependencies | `typescript`, `eslint` |
| `[PERFORMANCE_PROFILE]` | Performance profile | `standard` |
| `[CUSTOM_DIAGNOSTIC_NAME]` | Custom diagnostic name | `UI Component Discovery` |
| `[CUSTOM_DIAGNOSTIC_METHOD]` | Custom diagnostic method | `checkUIComponentDiscovery` |
| `[FULL_DESCRIPTION]` | Complete description | `UI/UX Tasks - Component validation, responsive design, accessibility` |
| `[TEST_COVERAGE_PERCENTAGE]` | Test coverage percentage | `85` |

### 3. Implement Test Methods

Each validator should have 4 main test methods:

1. **Structure/Configuration Test**: Verify required files and configuration
2. **Functional Test**: Test core functionality
3. **Integration Test**: Test integration with other components  
4. **Quality/Safety Test**: Test quality gates and safety measures

### 4. Integration Requirements

#### 4.1 IValidator Interface Compliance

All validators must implement these methods:
- `validate(projectInfo, scopeConfig, options)` - Main validation method
- `getCapabilities()` - Return supported projects, scopes, dependencies
- `checkInterfaceCompliance()` - Verify interface compliance
- `runSelfDiagnostics()` - System health checks
- `getMetadata()` - Validator metadata

#### 4.2 Capability Matrix Integration

Add your validator to `config/capability-matrix.json`:

```json
{
  "categories": {
    "your_category": {
      "validator": "your-category-validator.js",
      "description": "Your category description",
      "scope": "your validation scope",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "time estimate"
    }
  }
}
```

#### 4.3 Enhanced Orchestrator Integration

The enhanced orchestrator will automatically:
- Load your validator from the capability matrix
- Perform interface compliance checking
- Execute validation with safety monitoring
- Handle errors with detailed logging
- Provide rollback capabilities

### 5. Testing Procedures

#### 5.1 Unit Testing

Test your validator independently:

```bash
node src/validators/your-category-validator.js
```

#### 5.2 Integration Testing

Test within the validation system:

```bash
node src/core/enhanced-orchestrator.js --category your_category --project /path/to/test/project
```

#### 5.3 System Health Check

Verify system health after adding your validator:

```bash
node src/core/enhanced-orchestrator.js --health
```

## Best Practices

### 1. Error Handling
- Always use try-catch blocks
- Provide meaningful error messages
- Include context information
- Use appropriate test status ('PASS', 'FAIL', 'WARN', 'SKIP')

### 2. Evidence Collection
- Collect evidence for all test results
- Include file paths, command outputs, verification results
- Store evidence in structured format

### 3. Resource Management
- Clean up all spawned processes
- Close file handles
- Remove temporary files
- Use the cleanup() method properly

### 4. Performance Considerations
- Use appropriate timeouts for external commands
- Implement caching where beneficial
- Monitor resource usage
- Optimize for sub-60s validation targets

### 5. Cross-Platform Compatibility
- Test on Windows and Unix-like systems
- Use platform-appropriate commands
- Handle path separators correctly
- Account for different shell environments

## Template Customization Examples

### Example 1: Database Validator

```javascript
export class DatabaseValidator {
  constructor() {
    this.category = 'database';
    this.version = '3.0.0';
    this.scopes = ['src/models/**/*.ts', 'migrations/**/*.sql'];
    this.hasIntegrationTests = true;
    
    this.connections = [];
    this.validationStartTime = null;
  }
  
  async executeSchemaValidationTest(projectInfo) {
    // Implementation for database schema validation
  }
}
```

### Example 2: Security Validator

```javascript
export class SecurityValidator {
  constructor() {
    this.category = 'security';
    this.version = '3.0.0';
    this.scopes = ['src/**/*.ts', 'config/**/*.json'];
    this.hasIntegrationTests = true;
    
    this.scanProcesses = [];
    this.validationStartTime = null;
  }
  
  async executeVulnerabilityScanTest(projectInfo) {
    // Implementation for security vulnerability scanning
  }
}
```

## Troubleshooting

### Common Issues

1. **Module Import Errors**: Ensure proper ES6 module syntax and default export
2. **Interface Compliance Failures**: Verify all required methods are implemented
3. **Path Resolution Issues**: Use absolute paths and platform-appropriate separators
4. **Timeout Issues**: Adjust command timeouts for slower systems
5. **Permission Issues**: Ensure proper file and directory permissions

### Debugging Tips

1. Enable detailed logging in enhanced orchestrator
2. Test validators individually before system integration
3. Use the error history feature for troubleshooting
4. Check capability matrix configuration
5. Verify all dependencies are installed

## Support

For questions or issues with validator development:

1. Review existing validators in `src/validators/` for examples
2. Check the enhanced orchestrator documentation
3. Test with the validation system health checks
4. Use the error logging features for debugging

---

**Template Version**: 1.0.0  
**Last Updated**: 2025-09-10  
**Compatibility**: Enhanced Validation System v3.0.0