# Terminal Safety System

A comprehensive PowerShell-based terminal safety system that prevents hanging commands in development environments by implementing automatic timeouts and process management.

## Architecture

The system is organized into logical modules for better maintainability:

```filestructure
terminal-completer/
├── core/                                   # Core terminal safety engine
│   ├── enhanced-terminal-manager.ps1       # **NEW** Phase 2 enhanced version (recommended)
│   ├── enhanced-process-monitor.ps1        # **NEW** Phase 2 core enhanced monitoring engine
│   ├── auto-terminal-manager.ps1           # **LEGACY** Original safety engine (backward compatibility)
│   ├── kill-hanging.ps1                    # Process cleanup utility
│   └── archive/                            # Deprecated files
│       └── terminal-manager.ps1.deprecated # **ARCHIVED** - Superseded by enhanced version
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
│   ├── user-guide.md                       # User documentation and usage guide
│   ├── developer-guide.md                  # Developer documentation and architecture guide
│   ├── README-Phase1.md                 v  # Phase 1 implementation details
│   └── README-Phase2.md                    # **NEW** Phase 2 implementation details
├── terminal-safety.ps1                     # Main entry point (updated for Phase 2)
└── README.md                               # Project overview (this file)
```

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

## Core Components

### Enhanced Terminal Manager (`core/enhanced-terminal-manager.ps1`) **RECOMMENDED**

The **new Phase 2 enhanced terminal safety engine** that:

- **Extends** the original auto-terminal-manager with enhanced monitoring
- **Integrates** Phase 2 responsiveness monitoring and advanced pattern recognition
- **Maintains** full backward compatibility with existing workflows
- **Provides** intelligent hanging detection beyond simple timeouts
- **Supports** command-specific pattern recognition with context-aware matching
- **Features** output change tracking and comprehensive hanging risk assessment

### Enhanced Process Monitor (`core/enhanced-process-monitor.ps1`) **NEW Phase 2**

The **core enhanced monitoring engine** that provides:

- **Real-time responsiveness monitoring** with CPU/memory activity tracking
- **Process state analysis** using multi-sample pattern detection
- **Advanced output pattern recognition** for hanging and interactive commands
- **Command-specific timeout configurations** (npm: 45s, jest: 60s, tsc: 30s, etc.)
- **Context-aware pattern matching** to reduce false positives
- **Output change tracking and analysis** for stagnation detection
- **Comprehensive hanging risk assessment** with actionable recommendations

### Auto Terminal Manager (`core/auto-terminal-manager.ps1`) **LEGACY**

The **original terminal safety engine** that:

- Automatically applies timeouts to commands
- Prevents hanging processes
- Manages terminal resources efficiently
- Provides detailed logging and monitoring

**Note**: This is maintained for backward compatibility. New development should use `enhanced-terminal-manager.ps1`.

### Backward Compatibility

- **Drop-in Replacement**: Enhanced terminal manager works as direct replacement
- **Optional Enhancement**: Can disable enhanced features if needed
- **Legacy Support**: Original auto-terminal-manager still fully supported for compatibility
- **No Breaking Changes**: Existing workflows continue to work unchanged

### Process Cleanup (`core/kill-hanging.ps1`)

Utility for cleaning up hanging processes:

- Identifies stuck processes
- Safely terminates hanging operations
- Logs cleanup activities
- Prevents resource leaks

### Archive (`core/archive/`)

Contains deprecated files that are no longer actively maintained:

- **`terminal-manager.ps1.deprecated`**: Superseded by enhanced terminal manager
- **Migration**: Replace usage with `enhanced-terminal-manager.ps1`
- **Status**: Preserved for historical reference only

## 🚀 Phase 2 Enhanced Features

### Phase 2: Enhanced Hanging Pattern Detection

- **Command-Specific Timeouts**: Tailored timeouts for different command types (npm: 45s, jest: 60s, tsc: 30s, etc.)
- **Context-Aware Matching**: Patterns only considered when relevant context is present in output
- **Extended Pattern Sets**: Support for 20+ command types including yarn, docker, python, maven
- **Pattern Match Duration Tracking**: Monitor how long patterns have been matched

### Phase 2: Enhanced Interactive Command Detection

- **Categorized Patterns**: Organized into user_input, confirmation, authentication, choice_selection
- **Context-Specific Recommendations**: Tailored guidance based on detected interactive pattern type
- **Better User Guidance**: Clear actions and recommendations for different interactive scenarios

### Phase 2: Output Change Tracking and Analysis

- **Character-Level Detection**: Monitors output changes with configurable thresholds
- **Stagnation Identification**: Detects when output stops changing
- **Change Rate Analysis**: Calculates change metrics for hanging risk assessment
- **Configurable Parameters**: Adjustable check intervals, thresholds, and timeouts

### Phase 2: Comprehensive Hanging Risk Assessment

- **Multi-Factor Evaluation**: Combines patterns, context, interactive prompts, and stagnation
- **Risk Levels**: Low, Medium, High with corresponding confidence scores
- **Actionable Recommendations**: Specific guidance for addressing detected issues
- **Context-Aware Suggestions**: Tailored advice based on detected problems

### Phase 2: Backward Compatibility

- **Drop-in Replacement**: Enhanced terminal manager works as direct replacement
- **Optional Enhancement**: Can disable enhanced features if needed
- **Legacy Support**: Original auto-terminal-manager still fully supported for compatibility
- **No Breaking Changes**: Existing workflows continue to work unchanged

## 🔌 Integration Options

### VSCode Integration

Automatically configures VSCode to use terminal safety:

- Updates `settings.json` with terminal safety configuration
- Applies safety to all integrated terminals
- Maintains existing VSCode settings

### Cursor Integration

Configures Cursor for terminal safety:

- Creates terminal safety rules in `.cursor/rules`
- Applies safety to all Cursor terminal operations
- Maintains Cursor-specific configurations

### Global Integration

System-wide terminal safety:

- Updates PowerShell profile
- Applies safety to all PowerShell sessions
- Requires administrator privileges

## 🧪 Testing

### Test Suite

The comprehensive test suite (`testing/test-suite.ps1`) validates:

- Core functionality
- Installation scripts
- Integration scripts
- Documentation availability

### Phase 2 Testing

```powershell
# Test Phase 2 features specifically
.\terminal-safety.ps1 phase2

# Enhanced monitoring tests
.\testing\test-enhanced-monitoring.ps1 -TestPhase2

# Phase 2 demo mode
.\testing\test-enhanced-monitoring.ps1 -Demo
```

### Running Tests

```powershell
# Full test suite
powershell -ExecutionPolicy Bypass -File "testing/test-suite.ps1"

# Quick test (basic validation)
powershell -ExecutionPolicy Bypass -File "testing/test-suite.ps1" -Quick

# Test specific components
powershell -ExecutionPolicy Bypass -File "testing/test-suite.ps1" -TestFilter core
```

## 📚 Documentation

### Main Guides

- **README-Phase2.md**: **NEW** - Comprehensive Phase 2 implementation details
- **README-Phase1.md**: Phase 1 implementation details
- **AUTOMATIC-TERMINAL-SOLUTION.md**: Complete solution overview
- **terminal-safety-implementation.md**: Implementation details
- **QUICK-KILL-REFERENCE.md**: Quick reference guide
- **terminal-hanging-solution.md**: Hanging problem solutions

### Installation Guides

- **unified-installer.ps1**: Single installer for all environments
- **Legacy installers**: Maintained for backward compatibility

## 🛠️ Configuration

### Timeout Settings

Default timeout values can be configured in the core scripts:

- Quick commands: 5 seconds
- Normal commands: 30 seconds
- Long-running commands: 60 seconds
- **NEW**: Command-specific timeouts (npm: 45s, jest: 60s, tsc: 30s, etc.)

### Enhanced Monitoring Configuration

Phase 2 introduces advanced configuration options:

```json
{
  "outputTracking": {
    "checkInterval": 1000,
    "minChangeThreshold": 10,
    "maxBufferSize": 10000,
    "changeTimeout": 30000,
    "patternMatchTimeout": 15000
  },
  "hangingPatterns": {
    "npm": {
      "patterns": ["Building...", "Installing...", "Running tests..."],
      "timeout": 45000,
      "context": ["package.json", "node_modules"]
    }
  }
}
```

### Logging

The system provides comprehensive logging:

- Installation activities
- Terminal safety events
- Error conditions
- Performance metrics
- **NEW**: Pattern matching and risk assessment details

## 🔒 Security

### Execution Policy

The system respects PowerShell execution policies:

- Provides guidance for restricted environments
- Supports RemoteSigned and Unrestricted policies
- Warns about security implications

### Process Isolation

Terminal safety operates in isolated contexts:

- No access to system processes
- Limited to user-owned processes
- Safe cleanup procedures

## 🚨 Troubleshooting

### Common Issues

1. **Execution Policy Restricted**

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Permission Denied**
   - Ensure running with appropriate privileges
   - Check file permissions
   - Verify PowerShell version (5.0+)

3. **Integration Not Working**
   - Run test suite to validate installation
   - Check configuration files
   - Verify script paths

### Getting Help

1. Run the test suite to identify issues
2. Check the documentation in `docs/`
3. Review installation logs
4. Verify environment compatibility
5. **NEW**: Use Phase 2 testing for enhanced diagnostics

## 🔄 Maintenance

### Updates

The system is designed for easy updates:

- Backup existing configurations
- Run unified installer
- Validate with test suite
- Restore customizations if needed

### Monitoring

Monitor system health through:

- Test suite execution
- Log file review
- Performance monitoring
- Error tracking
- **NEW**: Phase 2 risk assessment metrics

## 📄 License

This terminal safety system is part of the VDL Vault project and follows the project's licensing terms.

## 🤝 Contributing

To contribute to the terminal safety system:

1. Follow the established folder structure
2. Maintain backward compatibility
3. Update tests for new functionality
4. Document all changes
5. Run the test suite before submitting
6. **NEW**: Include Phase 2 testing for enhanced features

---

**Last Updated**: December 2024  
**Version**: 2.2 (Phase 2 Enhanced)  
**Status**: Production Ready with Phase 2 Enhancements  
**Architecture**: Modular PowerShell system with advanced pattern recognition
