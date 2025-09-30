---
Purpose: Simple agent interface for agent-driven validation system - Usage Guide
---

# Enhanced Validation System - Agent Guide

## Quick Start

> ⚠️ **Verification Reminder:** The command references below assume the orchestrator remains compatible with the current Node toolchain and project scripts. Re-run smoke tests for each project before relying on the defaults.

### Validation & Extension Commands

```bash
node src/core/enhanced-orchestrator.js --category <category> --project <project-name> --task-id <task-id>

# Submit a new validator for a new category
node src/core/enhanced-orchestrator.js --submit-validator <path-to-validator.js> --category <new-category> --project <project-name> --task-id <task-id>

```

### Example Usage

```bash
# Backend validation (using project name, not path)
node src/core/enhanced-orchestrator.js --category backend --project templum --task-id TASK-001

# UI validation  
node src/core/enhanced-orchestrator.js --category ui --project phoenix-code-lite --task-id TASK-002

# Build validation
node src/core/enhanced-orchestrator.js --category build --project haruspex --task-id TASK-003

# Scoped validation (only TypeScript files in src directory)
node src/core/enhanced-orchestrator.js --category quality --project myproject --task-id TASK-004 --scope "src/**/*.ts"

# Multiple scope patterns (src TypeScript and test files)
node src/core/enhanced-orchestrator.js --category build --project myproject --task-id TASK-005 --scope "src/**/*.ts,tests/**/*.js,*.json"
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

## Project Configuration

### Per-Project Settings

Each project can have custom validation settings in `config/projects/{project}-valconfig.json`:

```json
{
  "version": "3.0.1",
  "project": {
    "name": "myproject",
    "display_name": "My Project",
    "project_directory": "../../MyProject"
  },
  "validation": {
    "report_location": "dev/validation-results",
    "timeout_overrides": {
      "backend": 180000,
      "quality": 120000
    },
    "commands": {
      "build": "npm run build",
      "test": "npm test",
      "lint": "npm run lint",
      "typecheck": "npx tsc --noEmit",
      "start": "npm start"
    }
  }
}
```

### Configuration Fields

#### Project Section

- **name**: Internal project identifier (lowercase, matches config filename)
- **display_name**: Human-readable project name for reports
- **project_directory**: Path to project root (relative to validation system or absolute)

#### Validation Section  

- **report_location**: Directory for validation reports (relative to project_directory)
- **timeout_overrides**: Custom timeouts per validation category (milliseconds)
- **commands**: Command definitions for validators (fallback to package.json scripts)

#### Commands Configuration

Commands are used by validators that need to execute project-specific operations:

- **build**: Build/compilation command (used by build validator)  
- **test**: Test execution command (used by test validators)
- **lint**: Code linting command (used by quality validators)
- **typecheck**: TypeScript checking command (used by core validator)
- **start**: Service start command (used by backend validators)

If commands are not specified, the system automatically falls back to common package.json scripts.

### Configuration Setup

1. **Missing Config**: System will provide specific guidance when project config is missing
2. **Template Available**: Use `config/project-template.json` as starting point
3. **Report Location**: Must exist before validation runs (system won't create directories)
4. **Project Directory**: Must exist and be accessible from validation system
5. **Name-based Resolution**: Use `--project <name>` where name maps to `<name>-valconfig.json`

### Upgrading Existing Projects

If you have existing validation configurations that use the old path-based approach:

1. **Add `project_directory` field**: Specify the path to your project directory
2. **Add `commands` section**: Define build, test, lint commands (optional - fallback to package.json)
3. **Update CLI usage**: Change from `--project /path/to/project` to `--project myproject`
4. **Verify paths**: Ensure `report_location` is relative to your project directory

The system will auto-generate new configuration templates with all required fields.

## What the System Does

### For Existing Categories

1. **Resolves project information** from name-based configuration lookup
2. **Loads project configuration** for validation settings and commands
3. **Resolves commands** from config or package.json scripts (automatic fallback)
4. **Validates report directories** exist before starting
5. **Executes validation** with project-specific timeouts and commands
6. **Generates reports automatically** in configured location
7. **Returns results** in under 60 seconds for most validations

### For New Categories (Agent-Driven Extension)

1. **Run Validation**: Agent first attempts to run validation on the new category
2. **System Notification**: The system detects the unknown category and notifies the agent that a new validator script is required
3. **Agent Generates Validator**: The agent writes a new validator script, ensuring it complies with the IValidator interface contract
4. **Agent Submits Validator**: The agent submits the new script to the system using the --submit-validator command
5. **Secure Integration**: The system initiates a secure integration pipeline, performing risk assessment, sandbox testing, and quality checks on the submitted code
6. **Registration & Execution**: If all checks pass, the system registers the new validator and executes the validation task

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

### Agent-Driven Extension Workflow

```log
# Step 1: Agent attempts validation for a new category
$ node src/core/enhanced-orchestrator.js --category mobile --project ./MyMobileApp --task-id TASK-002

Enhanced Validation System v3.0.0
Compatibility Check: Category 'mobile' not found.
Extension Required: Please generate a validator script and submit it using the --submit-validator flag.

# Step 2: Agent generates 'mobile-validator.js' and submits it
$ node src/core/enhanced-orchestrator.js --submit-validator ./mobile-validator.js --category mobile --project ./MyMobileApp --task-id TASK-002

Enhanced Validation System v3.0.0
Received new validator for category 'mobile'.
Initiating Secure Integration Pipeline...
   Risk Assessment: LOW risk approved for submitted code.
   Sandbox Testing: PASSED. Validator is safe to execute.
   Interface Compliance: PASSED. Validator meets IValidator contract.
   Integration Complete: 'mobile' validator registered.
Loading new validator: mobile-validator.js
Executing validation with safety monitoring
Validation Results: PASS (2 minutes 15 seconds)
```

## Safety Features

### Automatic Protection

- **Risk Assessment**: Evaluates submitted code safety before integration
- **Backup System**: Creates automatic backups before any changes
- **Rollback Capability**: Automatic rollback if integration fails
- **Sandbox Testing**: Tests submitted code in isolation
- **Interface Compliance**: Ensures all validators meet quality standards

### Human Review Process

For high-risk submissions, the system will:

1. **Generate extension summary** with detailed analysis
2. **Create safety report** with risk assessment
3. **Require explicit approval** before activation
4. **Provide rollback option** if issues are discovered

## Command Arguments

### Required Arguments

- `--category`: Validation category (see table above)
- `--project`: Project name (maps to `<name>-valconfig.json` in config/projects/)
- `--task-id`: Task identifier for tracking and reporting
- `--submit-validator`: Path to the new validator script to be integrated (used for new categories)

**Note**: The `--project` argument has changed from requiring a filesystem path to requiring a project name. The actual project directory is now configured in the `project_directory` field of the project's configuration file.

### Optional Arguments

- `--scope`: Limit validation to specific file patterns (comma-separated glob patterns)
  - Example: `--scope "src/**/*.ts,tests/**/*.js"`
  - Default: `**/*` (all files)
  - Use when: Large projects, focused validation, testing specific changes

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

#### "Project configuration missing"

- **Expected behavior** - No project config file exists yet
- **Check**: `config/projects/{project}-valconfig.json`
- **Action**: Copy and customize `config/project-template.json`

#### "Report directory does not exist"

- **Check**: Directory specified in project config `report_location`
- **Action**: Create the directory manually (system won't auto-create)
- **Fix**: Update project config with correct path

#### "Category not found"

- **Normal behavior** - This is the expected response for a new category
- **Action Required**: You must now generate a validator script
- **Next Step**: Use the --submit-validator command to provide the new script to the system

#### "Project path invalid"

- **Check path exists** and contains package.json
- **Use absolute path** if relative path fails
- **Ensure proper permissions** for directory access

#### "Validation failed with errors"

- **Review error details** in output for specific issues
- **Follow recommendations** provided by the validator
- **Re-run validation** after fixes to confirm resolution

#### "Extension integration failed"

- **System automatically rolls back** to previous state
- **Review the integration failure report** for specific issues with your submitted code
- **Contact maintainer** if issue persists

### Getting Help

- **Architecture Documentation**: See `VALIDATION-SYSTEM-ARCHITECTURE-README.md`
- **System Status**: Run `node enhanced-orchestrator.js --health-check`
- **Test System**: Run `node test-enhanced-system.js`

## Best Practices

### For Agents

1. **Always specify task-id** for tracking and debugging
2. **For new categories** run a normal validation to get the "Extension Required" notification then generate and submit the new validator
3. **Ensure submitted validators** are well-tested and comply with the `IValidator` interface to pass the integration pipeline
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
- **Extension Manager**: Secure integration pipeline for agent-submitted code
- **Safety Framework**: Comprehensive protection mechanisms
- **Validator Registry**: Category and capability management

### File Locations

- **Main System**: `src/core/enhanced-orchestrator.js`
- **Validators**: `src/validators/` directory  
- **System Configuration**: `config/enhanced-config.json`
- **Project Configurations**: `config/projects/{project}-valconfig.json`
- **Project Template**: `config/project-template.json`
- **Capability Matrix**: `config/capability-matrix.json`
- **Integrated Extensions**: `data/extensions/` directory
- **Backups**: `data/backups/` directory (automatic)
- **Reports**: Generated in project-configured location

---

## Quick Reference

### Most Common Commands

```bash
# Backend service changes (using project name)
node src/core/enhanced-orchestrator.js --category backend --project templum --task-id TASK-BE-001

# UI/Interface changes  
node src/core/enhanced-orchestrator.js --category ui --project phoenix-code-lite --task-id TASK-UI-001

# Build/compilation issues
node src/core/enhanced-orchestrator.js --category build --project myproject --task-id TASK-BUILD-001

# Submit a new validator 
node src/core/enhanced-orchestrator.js --submit-validator ./new-validator.js --category new-cat --project myproject --task-id TASK-NEW-001

# System health check
node src/core/enhanced-orchestrator.js --health-check
```

### Expected Time Ranges

- **Existing categories**: 30-60 seconds
- **New categories**: 1-3 minutes (includes integration pipeline)
- **High-risk extensions**: 3-5 minutes (includes human review)

### Success Indicators

- **Exit code 0**: Validation successful
- **Exit code 1**: Validation failed (check output for details)
- **Green checkmarks**: Individual test successes
- **Integration report created**: New validator integrated successfully

---

**Remember**: The system is designed to safely integrate and run agent-provided code. Ensure your validator scripts are robust and follow the `IValidator` contract. Trust the integration pipeline to catch issues, and review its reports carefully.
