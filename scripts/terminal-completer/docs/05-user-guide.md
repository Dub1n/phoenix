---
tags: [documentation, user-guide, terminal-safety, usage]
provides: [user_documentation, usage_instructions, troubleshooting]
requires: [terminal-safety-system]
---

# Terminal Safety User Guide

## Overview

The Terminal Safety System automatically prevents hanging terminal commands in your development environment, ensuring reliable and uninterrupted workflow.

## Quick Start

### 1. Install Terminal Safety

```powershell
# Automatic installation (recommended)
powershell -ExecutionPolicy Bypass -File "installation/unified-installer.ps1"

# VSCode-specific installation
powershell -ExecutionPolicy Bypass -File "installation/unified-installer.ps1" -Mode vscode

# Cursor-specific installation
powershell -ExecutionPolicy Bypass -File "installation/unified-installer.ps1" -Mode cursor

# Global installation (requires admin)
powershell -ExecutionPolicy Bypass -File "installation/unified-installer.ps1" -Mode global
```

### 2. Test the Installation

```powershell
# Run comprehensive test suite
powershell -ExecutionPolicy Bypass -File "testing/test-suite.ps1"

# Quick test
powershell -ExecutionPolicy Bypass -File "testing/test-suite.ps1" -Quick

# Test Phase 2 features specifically
.\terminal-safety.ps1 phase2
```

### 3. Use Terminal Safety

Once installed, terminal safety is automatically applied to all terminal operations in your development environment.

## Core Features

### Automatic Hanging Prevention

- **Smart Timeouts**: Automatically applies appropriate timeouts based on command type
- **Enhanced Process Monitoring**: **NEW Phase 2** - Advanced responsiveness monitoring and pattern recognition
- **Process Management**: Kills hanging processes before new commands
- **Background Support**: Runs long processes in background when needed
- **Retry Logic**: Automatically retries failed commands

### Command Type Detection

| Command Type | Default Timeout | Use Case |
|--------------|----------------|----------|
| **npm test** | 60 seconds | Test execution |
| **npm start** | 30 seconds | Development server |
| **npm run build** | 120 seconds | Build processes |
| **git commands** | 15 seconds | Version control |
| **node scripts** | 30 seconds | Script execution |
| **System commands** | 10 seconds | File operations |

### Phase 2 Enhanced Features

- **Enhanced Responsiveness Monitoring**: Detects stuck processes more accurately than simple timeouts
- **Advanced Output Pattern Recognition**: Recognizes hanging patterns specific to command types with context-aware matching
- **Enhanced Interactive Command Detection**: Categorized detection of commands waiting for user input
- **Process State Analysis**: Multi-sample analysis for better stuck detection
- **Output Change Tracking**: Monitors output changes to detect stagnation
- **Comprehensive Risk Assessment**: Multi-factor evaluation with actionable recommendations

## Usage Examples

### Basic Usage (Recommended)

```powershell
# Use enhanced terminal manager with Phase 2 features (default)
.\core\enhanced-terminal-manager.ps1 -Command 'npm test'

# Background job with enhanced monitoring
.\core\enhanced-terminal-manager.ps1 -Command 'npm start' -Background

# Debug mode to see enhanced monitoring in action
.\core\enhanced-terminal-manager.ps1 -Command 'npm test' -Debug

# Disable enhanced monitoring (fallback to original behavior)
.\core\enhanced-terminal-manager.ps1 -Command 'npm test' -EnhancedMonitoring:$false
```

### Legacy Usage (Backward Compatible)

```powershell
# Original auto-terminal-manager (maintained for compatibility)
.\core\auto-terminal-manager.ps1 -Command 'npm test'

# Background job
.\core\auto-terminal-manager.ps1 -Command 'npm start' -Background

# Debug mode
.\core\auto-terminal-manager.ps1 -Command 'npm test' -Debug
```

**Note**: The enhanced terminal manager is now the primary script. The original auto-terminal-manager is maintained for backward compatibility but new development should use the enhanced version.

### Emergency Cleanup

```powershell
# Kill all hanging processes immediately
.\core\kill-hanging.ps1
```

### Status and Information

```powershell
# Check system status
.\terminal-safety.ps1 status

# Run tests
.\terminal-safety.ps1 test

# Test Phase 2 features specifically
.\terminal-safety.ps1 phase2

# Get help
.\terminal-safety.ps1 help
```

## Troubleshooting

### When Terminal Calls Hang

#### Immediate Action

```powershell
# Use the quick kill script
.\core\kill-hanging.ps1
```

#### Keyboard Shortcuts

- **`Ctrl+C` twice** → Immediate termination
- **`Ctrl+C` then `Y` + `Enter`** → Batch job termination

#### Manual Process Kill

```powershell
# Kill specific processes
taskkill /F /IM node.exe
taskkill /F /IM npm.cmd
taskkill /F /IM tsc.exe

# Check what's running
tasklist /FI "IMAGENAME eq node.exe"
```

#### For Stubborn Processes

1. Open Task Manager (`Ctrl+Shift+Esc`)
2. Find hanging processes
3. End task manually

### Common Issues

#### Issue: Installation fails

**Solution**: Check PowerShell execution policy

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue: Commands still hang

**Solution**: Verify installation and check logs

```powershell
.\terminal-safety.ps1 status
```

#### Issue: Timeouts too short/long

**Solution**: Customize configuration in `.cursor/terminal-config.json`

## Configuration

### Enhanced Monitoring Configuration (Phase 2)

The enhanced terminal manager includes advanced configuration options:

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
      "max_attempts": 3
    },
    "background": {
      "enabled": true,
      "max_jobs": 5
    }
  }
}
```

### Advanced Phase 2 Configuration

For power users, Phase 2 introduces advanced configuration options:

```json
{
  "terminal": {
    "hanging_patterns": {
      "npm": {
        "patterns": ["Building...", "Installing...", "Running tests..."],
        "timeout": 45000,
        "context": ["package.json", "node_modules"]
      },
      "jest": {
        "patterns": ["Running tests...", "Test Suites:", "Tests:"],
        "timeout": 60000,
        "context": ["test", "spec", "jest.config"]
      },
      "tsc": {
        "patterns": ["Compiling...", "Found X errors"],
        "timeout": 30000,
        "context": ["tsconfig.json", ".ts", ".tsx"]
      }
    },
    "interactive_patterns": {
      "user_input": ["Password:", "Username:", "Enter choice:"],
      "confirmation": ["Y/N?", "Continue?", "Proceed?"],
      "authentication": ["Login:", "Auth:", "Token:"],
      "choice_selection": ["Select option:", "Choose:", "Pick:"]
    },
    "output_tracking": {
      "check_interval": 1000,
      "min_change_threshold": 10,
      "max_buffer_size": 10000,
      "change_timeout": 30000,
      "pattern_match_timeout": 15000
    }
  }
}
```

### Basic Configuration (Legacy)

```json
{
  "terminal": {
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
      "max_attempts": 3
    },
    "background": {
      "enabled": true,
      "max_jobs": 5
    }
  }
}
```

### Environment Variables

- **`SAFE_TERMINAL_ENABLED`**: Enable/disable terminal safety
- **`SAFE_TERMINAL_PROJECT_ROOT`**: Set project root for path resolution
- **`SAFE_TERMINAL_DEBUG`**: Enable debug logging

## Integration

### VSCode Integration

Automatically configured during installation:

- Updates `settings.json` with terminal safety configuration
- Applies safety to all integrated terminals
- Maintains existing VSCode settings

### Cursor Integration

Automatically configured during installation:

- Creates terminal safety rules in `.cursor/rules/`
- Applies safety to all agent terminal operations
- Provides detailed logging and monitoring

### Global Integration

Optional global installation:

- Updates PowerShell profile
- Applies safety to all PowerShell sessions
- Requires administrator privileges

## Best Practices

### For Daily Development

1. **Monitor System Resources**: Keep an eye on memory and CPU usage
2. **Use Appropriate Timeouts**: Don't set timeouts too short for long operations
3. **Background Long Processes**: Use background mode for development servers
4. **Regular Cleanup**: Run the kill script periodically to prevent accumulation
5. **Leverage Phase 2 Features**: Use context-aware pattern matching for better accuracy

### For Team Development

1. **Standardize Installation**: Use the same installation mode across the team
2. **Share Configuration**: Use consistent timeout and retry settings
3. **Document Customizations**: Keep track of any project-specific settings
4. **Report Issues**: Share feedback to improve the system
5. **Phase 2 Adoption**: Gradually adopt enhanced monitoring features

## Support and Maintenance

### Getting Help

```powershell
# Comprehensive help
.\terminal-safety.ps1 help

# Status information
.\terminal-safety.ps1 status

# Test system
.\terminal-safety.ps1 test

# Test Phase 2 features
.\terminal-safety.ps1 phase2
```

### System Information

- **Version**: 2.2 (Phase 2 Enhanced)
- **Status**: Production Ready with Phase 2 Enhancements
- **Architecture**: Modular PowerShell system with advanced pattern recognition
- **Dependencies**: PowerShell 5.0+, Windows

### Updates and Maintenance

The system is designed to be self-maintaining:

- Automatic process cleanup
- Self-healing configuration
- Comprehensive error handling
- Detailed logging for troubleshooting
- **NEW**: Phase 2 risk assessment and pattern learning

---

**Last Updated**: 2024-12-19  
**Version**: 2.2 (Phase 2 Enhanced)  
**Status**: Production Ready with Phase 2 Enhancements
