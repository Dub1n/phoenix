---
Purpose: Simple agent interface for autonomous validation system - Usage Guide
---

# Enhanced Validation System - Agent Guide

## Quick Start

### Basic Validation Command

```bash
node src/core/enhanced-orchestrator.js --category <category> --project <project-path> --task-id <task-id>
```

### Example Usage

```bash
# Backend validation
node src/core/enhanced-orchestrator.js --category backend --project ./Templum --task-id TASK-001

# UI validation  
node src/core/enhanced-orchestrator.js --category ui --project ./phoenix-code-lite --task-id TASK-002

# Build validation
node src/core/enhanced-orchestrator.js --category build --project ./Haruspex --task-id TASK-003
```

## Available Categories

| Category       | Purpose                        | When to Use                        |
|----------------|--------------------------------|------------------------------------|
| `backend`      | Backend/Service validation     | API changes, service modifications |
| `ui`           | Interface/UI validation        | Menu changes, CLI updates          |
| `core`         | Core system validation         | Configuration, state management    |
| `build`        | Build/compilation validation   | TypeScript fixes, build issues     |
| `quality`      | Code quality validation        | ESLint fixes, refactoring          |
| `architecture` | Architectural validation       | Pattern changes, system design     |
| `mcp`          | MCP server validation          | MCP implementations                |
| `feature`      | Feature enhancement validation | New capabilities, optimizations    |
| `subagent`     | Subagent workflow validation   | Agent handoff workflows            |

## What the System Does

### For Existing Categories

1. **Loads appropriate validator** for the specified category
2. **Executes validation** with comprehensive testing
3. **Generates detailed results** with evidence and recommendations
4. **Returns results** in under 60 seconds for most validations

### For New Categories (Autonomous Extension)

1. **Detects unknown category** and initiates extension pipeline
2. **Performs risk assessment** to ensure safe generation
3. **Generates new validator** from templates with safety validation
4. **Tests generated code** in sandboxed environment
5. **Registers new validator** for future use
6. **Executes validation** with the newly generated validator

## Expected Output Examples

### Standard Validation

```log
Enhanced Validation System v3.0.0
Compatibility Check: backend category found
Loading validator: backend-validator.js
Executing validation with safety monitoring
Validation Results: PASS (45 seconds)
All validations completed successfully
```

### Autonomous Extension

```log
Enhanced Validation System v3.0.0
Compatibility Check: mobile category not found
Extension Required - Initiating Safe Extension Process
   Risk Assessment: LOW risk approved
   Pre-Generation Validation: PASSED
   Template-Based Generation: COMPLETED
   Post-Generation Validation: PASSED
   Sandbox Testing: PASSED
   Extension Registration: COMPLETED
Loading generated validator: mobile-validator.js
Executing validation with safety monitoring
Validation Results: PASS (2 minutes 15 seconds)
Extension successful - mobile validator now available
```

## Safety Features

### Automatic Protection

- **Risk Assessment**: Evaluates extension safety before generation
- **Backup System**: Creates automatic backups before any changes
- **Rollback Capability**: Automatic rollback if generation fails
- **Sandbox Testing**: Tests generated code in isolation
- **Interface Compliance**: Ensures all validators meet quality standards

### Human Review Process

For high-risk extensions, the system will:

1. **Generate extension summary** with detailed analysis
2. **Create safety report** with risk assessment
3. **Require explicit approval** before activation
4. **Provide rollback option** if issues are discovered

## Command Arguments

### Required Arguments

- `--category`: Validation category (see table above)
- `--project`: Path to project directory (absolute or relative)
- `--task-id`: Task identifier for tracking and reporting

### Optional Arguments

- `--scope`: Override default scope patterns for validation
- `--save`: Save detailed validation results to file
- `--verbose`: Enable detailed logging and progress information

### System Commands

```bash
# System health and status
node src/core/enhanced-orchestrator.js --health-check

# List available categories  
node src/core/enhanced-orchestrator.js --list-categories

# Validate all existing validators
node src/core/enhanced-orchestrator.js --validate-all
```

## Understanding Results

### Result Types

- **PASS**: All validations successful, no issues found
- **WARN**: Minor issues detected, but functionality intact
- **FAIL**: Significant issues requiring attention before deployment

### Evidence and Recommendations

The system provides:

- **Specific evidence** for each validation check
- **Error details** with file locations and line numbers
- **Actionable recommendations** for fixing identified issues
- **Performance metrics** and timing information

## Troubleshooting

### Common Issues

#### "Category not found"

- **Normal behavior** - System will automatically generate new validator
- **Wait for extension process** to complete (1-3 minutes)
- **Review extension summary** if human approval required

#### "Project path invalid"

- **Check path exists** and contains package.json
- **Use absolute path** if relative path fails
- **Ensure proper permissions** for directory access

#### "Validation failed with errors"

- **Review error details** in output for specific issues
- **Follow recommendations** provided by the validator
- **Re-run validation** after fixes to confirm resolution

#### "Extension generation failed"

- **System automatically rolls back** to previous state
- **Review failure report** for specific issues
- **Contact maintainer** if issue persists

### Getting Help

- **Architecture Documentation**: See `VALIDATION-SYSTEM-ARCHITECTURE-README.md`
- **System Status**: Run `node enhanced-orchestrator.js --health-check`
- **Test System**: Run `node test-enhanced-system.js`

## Best Practices

### For Agents

1. **Always specify task-id** for tracking and debugging
2. **Use appropriate category** that matches the type of changes
3. **Wait for completion** - system may take 1-3 minutes for new categories
4. **Review recommendations** carefully and implement suggested fixes
5. **Re-run validation** after making changes to confirm fixes

### For System Reliability

- **Monitor disk space** - System creates backups automatically
- **Regular health checks** - Run `--health-check` periodically  
- **Review extension logs** - Check generated validator quality
- **Keep system updated** - Follow upgrade procedures when available

## System Architecture Summary

### Core Components

- **Enhanced Orchestrator**: Main system coordinator
- **Extension Generator**: Autonomous validator generation
- **Safety Framework**: Comprehensive protection mechanisms
- **Validator Registry**: Category and capability management

### File Locations

- **Main System**: `src/core/enhanced-orchestrator.js`
- **Validators**: `src/validators/` directory  
- **Configuration**: `config/capability-matrix.json`
- **Extensions**: `data/extensions/` directory
- **Backups**: `data/backups/` directory (automatic)
- **Reports**: Generated in project `dev/validation-results/`

---

## Quick Reference

### Most Common Commands

```bash
# Backend service changes
node src/core/enhanced-orchestrator.js --category backend --project ./Templum --task-id TASK-BE-001

# UI/Interface changes  
node src/core/enhanced-orchestrator.js --category ui --project ./phoenix-code-lite --task-id TASK-UI-001

# Build/compilation issues
node src/core/enhanced-orchestrator.js --category build --project ./project --task-id TASK-BUILD-001

# System health check
node src/core/enhanced-orchestrator.js --health-check
```

### Expected Time Ranges

- **Existing categories**: 30-60 seconds
- **New categories**: 1-3 minutes (includes generation)
- **High-risk extensions**: 3-5 minutes (includes human review)

### Success Indicators

- **Exit code 0**: Validation successful
- **Exit code 1**: Validation failed (check output for details)
- **Green checkmarks**: Individual test successes
- **Extension summary created**: New validator generated successfully

---

**Remember**: The system is designed to be autonomous and safe. Trust the process, follow the recommendations, and contact maintainers if you encounter unexpected behavior.
