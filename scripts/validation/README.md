# Component Validation Script

## Overview

The `validate:component` script provides comprehensive validation of <Project> project components, analyzing their health, compilation status, test coverage, and dependencies.

## Features

- **File Existence Validation**: Checks if component files exist in expected locations
- **TypeScript Compilation**: Validates TypeScript compilation without errors
- **Dependency Analysis**: Identifies external dependencies and their impact
- **Test Coverage**: Checks for test files and validates test execution
- **Status Scoring**: Provides quantitative health scores (0-100)
- **Priority Assessment**: Assigns Critical/High/Medium/Low priority levels
- **Evidence Collection**: Gathers specific evidence for status assessment
- **Recommendations**: Generates actionable recommendations for improvement
- **Results Persistence**: Saves detailed results to JSON files

## Usage

### Basic Usage

```bash
npm run validate:component <component-name>
```

### Examples

```bash
# Validate a working component
npm run validate:component "<project>-core-engine"

# Validate a broken component  
npm run validate:component "<project>-backend-service"

# Validate a missing component
npm run validate:component "analysis-engine"
```

## Component Discovery

The script automatically searches for components in these locations:

- `src/core/`
- `src/components/`
- `src/providers/`
- `src/api/`
- `src/integration/`
- `src/compatibility/`
- `src/debugging/`
- `src/setup/`
- `src/monitoring/`
- `src/skin/`
- `src/` (root)

## Status Scoring System

### Score Breakdown

- **File Existence**: 25 points
- **Compilation Status**: 35 points  
- **Test Status**: 25 points
- **Dependencies**: 15 points

### Status Levels

- **🟢 Working** (80-100 points): Component is healthy
- **🟡 Partial** (60-79 points): Component has minor issues
- **🔴 Broken** (40-59 points): Component has significant issues
- **🔴 Broken** (0-39 points): Component is critically broken

### Priority Levels

- **Critical**: Immediate attention required
- **High**: High priority fixes needed
- **Medium**: Moderate priority issues
- **Low**: Low priority, can be addressed later

## Output

### Console Output

The script provides detailed console output including:

- Component discovery and file locations
- Compilation status and error details
- Test execution results
- Dependency analysis
- Status score and priority
- Actionable recommendations

### JSON Results

Detailed results are saved to:

``` filesystem
<Project>/dev/validation-results/
├── YYYY-MM-DDTHHmm-{component}-validation.json
└── ...
```

## Validation Results Structure

```json
{
  "componentName": "string",
  "timestamp": "ISO timestamp",
  "status": "🟢 Working | 🔴 Broken | ❌ Missing | 🟡 Partial",
  "priority": "Critical | High | Medium | Low",
  "evidence": ["array of evidence strings"],
  "errors": ["array of error messages"],
  "warnings": ["array of warning messages"],
  "files": ["array of file paths"],
  "compilationStatus": "string",
  "testStatus": "string",
  "dependencies": ["array of external dependencies"],
  "recommendations": ["array of actionable recommendations"]
}
```

## Error Analysis

The script categorizes compilation errors into:

- **Import Errors**: Module resolution issues
- **Type Errors**: TypeScript type mismatches
- **Syntax Errors**: Code syntax problems
- **Other Errors**: Unclassified compilation issues

## Recommendations

The script generates context-aware recommendations:

- **Missing Components**: Implementation guidance
- **Compilation Errors**: Fix suggestions
- **Test Coverage**: Testing recommendations
- **Dependencies**: Dependency management advice
- **Critical Issues**: Escalation guidance

## Integration with Implementation Tracker

This script is designed to work with the <Project> Implementation Tracker:

- Provides evidence-based status assessment
- Generates data for tracker updates
- Supports the issue-fix documentation workflow
- Enables quantitative component health tracking

## Technical Requirements

- Node.js 18+ (ES modules support)
- TypeScript compiler (`npx tsc`)
- Access to <Project> project directory
- npm for test execution

## Troubleshooting

### Common Issues

1. **No Output**: Ensure you're using ES modules (project has `"type": "module"`)
2. **Path Errors**: Verify component names match actual file names
3. **Compilation Failures**: Check TypeScript installation and project configuration
4. **Test Failures**: Ensure npm test is configured and working

### Debug Mode

The script includes extensive logging to help diagnose issues:

- File discovery process
- Compilation attempts
- Test execution details
- Error analysis results

## Future Enhancements

Planned improvements for future versions:

- **Mock Detection**: Identify placeholder implementations
- **Performance Metrics**: Measure component performance
- **Integration Testing**: Validate component interactions
- **Historical Tracking**: Track component health over time
- **Automated Fixes**: Suggest and apply simple fixes
