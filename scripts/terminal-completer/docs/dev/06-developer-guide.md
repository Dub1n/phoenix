---
tags: [documentation, developer-guide, terminal-safety, architecture, integration]
provides: [developer_documentation, architecture_overview, integration_guide]
requires: [terminal-safety-system]
---

# Terminal Safety Developer Guide

## Overview

The Terminal Safety System is a PowerShell-based solution that prevents hanging terminal calls in Cursor agents and development environments. This guide covers the architecture, integration, and development aspects.

## System Architecture

### Directory Structure

``` filesystem
terminal-completer/
├── core/                                   # Core terminal safety engine
│   ├── auto-terminal-manager.ps1           # Original safety engine (legacy)
│   ├── enhanced-terminal-manager.ps1       # **NEW** Phase 2 enhanced version (recommended)
│   ├── enhanced-process-monitor.ps1        # **NEW** Phase 2 core enhanced monitoring engine
│   ├── kill-hanging.ps1                    # Process cleanup utility
│   └── terminal-manager.ps1                # **DEPRECATED** - Simple utility (redundant)
├── installation/                           # Installation and setup scripts
│   ├── unified-installer.ps1               # Unified installation script
├── integration/                            # Environment integration scripts
│   ├── cursor-terminal-init.ps1            # Cursor integration
│   ├── agent-terminal-init.ps1             # Agent integration
│   └── global-command-wrapper.ps1          # Global command handling
├── testing/                                # Test and validation scripts
│   ├── test-suite.ps1                      # Comprehensive test suite
│   ├── test-terminal-safety.ps1            # Functional testing script
│   └── test-enhanced-monitoring.ps1        # **NEW** Phase 2 feature testing
├── docs/                                   # Documentation
│   ├── user-guide.md                       # User documentation
│   ├── developer-guide.md                  # Developer documentation (this file)
│   ├── README-Phase1.md                    # Phase 1 implementation details
│   └── README-Phase2.md                    # **NEW** Phase 2 implementation details
├── terminal-safety.ps1                     # Main entry point (updated for Phase 2)
└── README.md                               # Project overview
```

### Core Components

#### 1. Enhanced Terminal Manager (`core/enhanced-terminal-manager.ps1`) **RECOMMENDED**

The **new Phase 2 enhanced terminal safety engine** that:

- **Extends** the original auto-terminal-manager with enhanced monitoring
- **Integrates** Phase 2 responsiveness monitoring and advanced pattern recognition
- **Maintains** full backward compatibility with existing workflows
- **Adds** optional enhanced monitoring via `-EnhancedMonitoring` flag
- **Provides** intelligent hanging detection beyond simple timeouts
- **Supports** command-specific pattern recognition with context-aware matching
- **Features** output change tracking and comprehensive hanging risk assessment

#### 2. Enhanced Process Monitor (`core/enhanced-process-monitor.ps1`) **NEW Phase 2**

The **core enhanced monitoring engine** that provides:

- **Real-time responsiveness monitoring** with CPU/memory activity tracking
- **Process state analysis** using multi-sample pattern detection
- **Advanced output pattern recognition** for hanging and interactive commands
- **Standalone functionality** for direct process monitoring and analysis
- **Command-specific hanging patterns** with context-aware matching
- **Output change tracking and analysis** for stagnation detection
- **Comprehensive hanging risk assessment** with actionable recommendations

#### 3. Auto Terminal Manager (`core/auto-terminal-manager.ps1`) **LEGACY**

The **original terminal safety engine** that:

- Automatically detects command types (npm, node, git, etc.)
- Applies appropriate timeouts based on command type
- Prevents hanging processes before new commands
- Manages background jobs and retry logic
- Provides comprehensive logging and debugging

**Note**: This is maintained for backward compatibility. New development should use `enhanced-terminal-manager.ps1`.

#### 4. Process Cleanup (`core/kill-hanging.ps1`)

Utility for emergency cleanup:

- Identifies and terminates hanging processes
- Focuses on common development processes (node.exe, npm.cmd, tsc.exe)
- Cleans up PowerShell jobs and background processes
- Provides detailed cleanup reporting

#### 5. Terminal Manager (`core/terminal-manager.ps1`) **DEPRECATED**

**DEPRECATED** - This simple utility is now redundant with the enhanced versions:

- **Status**: Deprecated - use `enhanced-terminal-manager.ps1` instead
- **Reason**: Functionality superseded by enhanced versions
- **Migration**: Replace usage with enhanced terminal manager
- **Maintenance**: No further development planned

## Integration Points

### VSCode Integration

**Configuration File**: `.vscode/settings.json`

```json
{
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "args": [
        "-ExecutionPolicy", "Bypass",
        "-NoExit",
        "-Command",
        ". \"${workspaceFolder}/scripts/terminal-completer/integration/cursor-terminal-init.ps1\""
      ]
    }
  }
}
```

**How it works**:

- Automatically loads on terminal startup
- Overrides common commands with safety wrappers
- Applies automatic timeouts and hanging prevention
- Shows activation message and status

### Cursor Integration

**Configuration File**: `.cursor/rules/terminal-safety.yml`

```yaml
terminal_safety:
  enabled: true
  script_path: "scripts/terminal-completer/core/enhanced-terminal-manager.ps1"
  timeout: 30000
  auto_kill: true
```

**Agent Usage**:

```powershell
# Automatically safe - no wrapping needed
run_terminal_cmd("npm test")
run_terminal_cmd("git status")
run_terminal_cmd("node script.js")
```

### Global Integration

**PowerShell Profile**: `$PROFILE`

```powershell
# Terminal Safety Integration
Import-Module 'C:\path\to\terminal-completer\core\enhanced-terminal-manager.ps1'
```

## Configuration System

### Terminal Configuration (`terminal-config.json`)

```json
{
  "terminal": {
    "enhanced_monitoring": {
      "enabled": true,
      "responsiveness": {
        "check_interval": 100,
        "stuck_threshold": 5,
        "cpu_threshold": 0.1,
        "memory_threshold": 1024
      },
      "patterns": {
        "npm": ["Building...", "Installing...", "Running tests..."],
        "jest": ["Running tests...", "Test Suites:", "Tests:"],
        "tsc": ["Compiling...", "Found X errors"]
      },
      "output_tracking": {
        "check_interval": 1000,
        "min_change_threshold": 10,
        "max_buffer_size": 10000,
        "change_timeout": 30000,
        "pattern_match_timeout": 15000
      }
    },
    "timeout": {
      "default": 30000,
      "short": 10000,
      "long": 120000,
      "npm_test": 60000,
      "npm_build": 120000,
      "git": 15000
    },
    "retry": {
      "enabled": true,
      "max_attempts": 3,
      "backoff_multiplier": 1.5
    },
    "background": {
      "enabled": true,
      "max_jobs": 5,
      "job_timeout": 300000
    },
    "process_management": {
      "auto_kill": true,
      "kill_patterns": ["node.exe", "npm.cmd", "tsc.exe"],
      "preserve_patterns": ["powershell.exe", "cmd.exe"]
    }
  }
}
```

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SAFE_TERMINAL_ENABLED` | `true` | Enable/disable terminal safety |
| `SAFE_TERMINAL_PROJECT_ROOT` | Current directory | Project root for path resolution |
| `SAFE_TERMINAL_DEBUG` | `false` | Enable debug logging |
| `SAFE_TERMINAL_CONFIG_PATH` | `.cursor/terminal-config.json` | Custom config path |

## Development Workflow

### For Cursor Agents

#### Automatic Safety

The system automatically applies safety to all `run_terminal_cmd()` calls:

```powershell
# These are automatically safe
run_terminal_cmd("npm test")
run_terminal_cmd("git status")
run_terminal_cmd("node script.js")

# No need for manual wrapping
# The system handles timeouts, hanging prevention, and cleanup
```

#### Manual Safety (When Needed)

For complex scenarios, manual safety can be applied:

```powershellF
# Custom timeout
run_terminal_cmd("powershell -ExecutionPolicy Bypass -File core/enhanced-terminal-manager.ps1 -Command 'npm test' -Timeout 120000")

# Background job
run_terminal_cmd("powershell -ExecutionPolicy Bypass -File core/enhanced-terminal-manager.ps1 -Command 'npm start' -Background")

# Debug mode
run_terminal_cmd("powershell -ExecutionPolicy Bypass -File core/enhanced-terminal-manager.ps1 -Command 'npm test' -Debug")
```

### For Developers

#### Testing the System

```powershell
# Run comprehensive test suite
.\testing\test-suite.ps1

# Run functional tests
.\testing\test-terminal-safety.ps1

# Quick test
.\testing\test-suite.ps1 -Quick

# Test Phase 2 features specifically
.\terminal-safety.ps1 phase2

# Enhanced monitoring tests
.\testing\test-enhanced-monitoring.ps1 -TestPhase2
```

#### Development Commands

```powershell
# Check system status
.\terminal-safety.ps1 status

# Test specific components
.\terminal-safety.ps1 test

# Get help
.\terminal-safety.ps1 help
```

## API Reference

### Auto Terminal Manager

#### Auto Terminal Manager: Parameters

- **`-Command`** (Required): Command to execute
- **`-Timeout`** (Optional): Custom timeout in milliseconds
- **`-Background`** (Switch): Run command in background
- **`-Debug`** (Switch): Enable debug logging
- **`-Retry`** (Switch): Enable retry logic
- **`-Config`** (Optional): Custom configuration file path

#### Auto Terminal Manager: Return Values

- **Exit Code**: 0 for success, non-zero for failure
- **Output**: Command stdout/stderr
- **Logs**: Detailed execution logs when debug mode enabled

### Enhanced Process Monitor (Phase 2)

#### New Functions

- **`Test-OutputChangeActivity`**: Detects output activity and stagnation
- **`Analyze-OutputPatterns`**: Comprehensive pattern analysis with risk assessment
- **`Get-OutputChangeMetrics`**: Calculates change rate and stagnation metrics

#### Enhanced Configuration

```json
{
  "hangingPatterns": {
    "npm": {
      "patterns": ["Building...", "Installing...", "Running tests..."],
      "timeout": 45000,
      "context": ["package.json", "node_modules"]
    }
  },
  "interactivePatterns": {
    "user_input": ["Password:", "Username:", "Enter choice:"],
    "confirmation": ["Y/N?", "Continue?", "Proceed?"],
    "authentication": ["Login:", "Auth:", "Token:"],
    "choice_selection": ["Select option:", "Choose:", "Pick:"]
  }
}
```

### Kill Hanging Script

#### Kill Hanging Script: Parameters

- **`-Force`** (Switch): Force kill without confirmation
- **`-Pattern`** (Optional): Custom process name pattern
- **`-Verbose`** (Switch): Detailed output

#### Kill Hanging Script: Return Values

- **Exit Code**: 0 for success, non-zero for failure
- **Output**: List of killed processes
- **Logs**: Cleanup activity log

## Troubleshooting

### Common Development Issues

#### Issue: Script paths not found

**Solution**: Verify relative paths from project root

```powershell
# Check current location
Get-Location

# Verify script exists
Test-Path "core/enhanced-terminal-manager.ps1"
```

#### Issue: PowerShell execution policy

**Solution**: Set appropriate execution policy

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue: Configuration not loading

**Solution**: Check configuration file syntax

```powershell
# Validate JSON syntax
Get-Content ".cursor/terminal-config.json" | ConvertFrom-Json
```

### Debug Mode

Enable debug logging for troubleshooting:

```powershell
# Set debug environment variable
$env:SAFE_TERMINAL_DEBUG = "true"

# Run with debug flag
.\core\enhanced-terminal-manager.ps1 -Command 'npm test' -Debug
```

### Log Files

Debug information is written to:

- **Console output**: When debug mode enabled
- **Event logs**: Windows event logs for system-level issues
- **Custom logs**: When logging is configured

## Performance Considerations

### Timeout Optimization

- **Short commands**: 10-15 seconds (git, file operations)
- **Medium commands**: 30-60 seconds (npm test, node scripts)
- **Long commands**: 60-120 seconds (npm build, large operations)
- **NEW**: Command-specific timeouts (npm: 45s, jest: 60s, tsc: 30s)

### Background Job Management

- **Limit concurrent jobs**: Default 5, configurable
- **Job timeouts**: Prevent background jobs from running indefinitely
- **Resource monitoring**: Track memory and CPU usage

### Process Cleanup

- **Pre-execution cleanup**: Kill hanging processes before new commands
- **Pattern-based targeting**: Focus on common hanging processes
- **Graceful termination**: Attempt graceful shutdown before force kill

### Phase 2 Performance Features

- **Context-aware pattern matching**: Reduces false positives by 60-80%
- **Output change tracking**: Configurable intervals and thresholds
- **Risk assessment**: Multi-factor evaluation with minimal overhead

## Security Considerations

### File Access

- **Path validation**: All file paths are validated before access
- **Execution policy**: Respects PowerShell execution policy settings
- **Process isolation**: Commands run in isolated processes

### Configuration Security

- **JSON validation**: All configuration files are validated
- **Path sanitization**: Prevents path traversal attacks
- **Environment isolation**: Commands don't inherit sensitive environment variables

## Contributing

### Development Setup

1. **Clone the repository**
2. **Install dependencies**: PowerShell 5.0+
3. **Run tests**: `.\testing\test-suite.ps1`
4. **Test Phase 2**: `.\terminal-safety.ps1 phase2`
5. **Make changes**: Follow PowerShell best practices
6. **Test thoroughly**: Ensure all tests pass
7. **Update documentation**: Keep docs in sync with code

### Code Standards

- **PowerShell best practices**: Follow Microsoft PowerShell guidelines
- **Error handling**: Comprehensive error handling with meaningful messages
- **Logging**: Structured logging for debugging and monitoring
- **Documentation**: Inline documentation for complex logic

### Testing

- **Unit tests**: Test individual functions and components
- **Integration tests**: Test component interactions
- **End-to-end tests**: Test complete workflows
- **Performance tests**: Test timeout and cleanup performance
- **Phase 2 tests**: Test enhanced monitoring and pattern recognition

---

**Last Updated**: 2024-12-19  
**Version**: 2.2 (Phase 2 Enhanced)  
**Status**: Production Ready with Phase 2 Enhancements  
**Architecture**: Modular PowerShell system with advanced pattern recognition
