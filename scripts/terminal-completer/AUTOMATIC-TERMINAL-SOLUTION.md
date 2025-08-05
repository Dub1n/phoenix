# Automatic Terminal Hanging Prevention Solution

## Problem Solved

Cursor agent terminal tool calls frequently hang, requiring manual intervention and disrupting workflow.

## Solution Overview

Automatic terminal management that prevents hanging calls without any manual oversight needed.

## Key Components

### 1. Automatic Terminal Manager (`scripts/auto-terminal-manager.ps1`)

- **Automatic command detection**: Detects npm, node, git, and other command types
- **Smart timeouts**: Applies appropriate timeouts based on command type
- **Hanging prevention**: Kills hanging processes before new commands
- **Retry logic**: Automatically retries failed commands
- **Background support**: Runs long processes in background when needed

### 2. Quick Kill Script (`scripts/kill-hanging.ps1`)

- **Emergency cleanup**: Kills all hanging processes immediately
- **Process targeting**: Focuses on common hanging processes (node.exe, npm.cmd, tsc.exe)
- **PowerShell job cleanup**: Stops hanging PowerShell jobs

### 3. Configuration (`cursor/terminal-config.json`)

- **Timeout settings**: Per-command timeout values
- **Process patterns**: Identifies hanging vs safe processes
- **Retry settings**: Configurable retry counts per command type
- **Background job limits**: Controls concurrent background processes

### 4. Cursor Agent Rules (`.cursor/rules/guidelines/06-terminal-safety.mdc`)

- **Mandatory usage**: Forces agents to use safe terminal execution
- **Command patterns**: Provides templates for different command types
- **Debug support**: Includes troubleshooting guidelines

## Usage Examples

### For Agents (Automatic)

```powershell
# ❌ WRONG - Direct terminal call
run_terminal_cmd("npm test")

# ✅ CORRECT - Safe terminal call with automatic timeout
run_terminal_cmd("powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'npm test'")
```

### For Users (Manual)

```powershell
# Kill hanging processes
.\scripts\kill-hanging.ps1

# Execute with automatic safety
.\scripts\auto-terminal-manager.ps1 -Command 'npm test'

# Background job
.\scripts\auto-terminal-manager.ps1 -Command 'npm start' -Background

# Debug mode
.\scripts\auto-terminal-manager.ps1 -Command 'npm test' -Debug
```

## Automatic Features

### 1. Command Detection

- **npm commands**: 60s timeout for tests, 30s for start, 120s for build
- **node commands**: 30s timeout
- **git commands**: 15s timeout
- **system commands**: 10s timeout

### 2. Hanging Prevention

- **Pre-execution cleanup**: Kills hanging processes before new commands
- **Timeout enforcement**: Automatically kills processes that exceed timeouts
- **Process monitoring**: Tracks and manages hanging processes

### 3. Error Handling

- **Retry logic**: Automatically retries failed commands
- **Graceful degradation**: Falls back to safe defaults if config fails
- **Detailed logging**: Provides debug information when needed

## Configuration

The system uses `.cursor/terminal-config.json` for:

```json
{
  "terminal": {
    "timeout": {
      "default": 30000,
      "short": 10000,
      "long": 120000
    },
    "commands": {
      "npm": {
        "test": { "timeout": 60000, "background": false, "retry": 2 },
        "start": { "timeout": 30000, "background": true, "retry": 1 },
        "build": { "timeout": 120000, "background": false, "retry": 1 }
      }
    }
  }
}
```

## Testing

### Demo Script

```powershell
# Run the demo to see all features
.\scripts\demo-terminal-safety.ps1
```

### Manual Testing

```powershell
# Test quick command
powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'echo "test"'

# Test timeout (should fail after 30s)
powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'node -e "setTimeout(() => {}, 60000)"'

# Test process cleanup
powershell -ExecutionPolicy Bypass -File scripts/kill-hanging.ps1
```

## Integration with QMS Project

This solution integrates with the QMS infrastructure refactoring by:

1. **Supporting TDD**: Reliable test execution without hanging
2. **Enabling CI/CD**: Stable build and deployment processes
3. **Facilitating Development**: Uninterrupted development cycles
4. **Ensuring Quality**: Reliable validation and testing

## Benefits

### For Users

- **No manual intervention**: Completely automatic hanging prevention
- **Transparent operation**: Same interface as regular terminal commands
- **Reliable execution**: Commands complete or timeout predictably
- **Debug support**: Detailed logging for troubleshooting

### For Agents

- **Automatic safety**: All terminal calls are automatically protected
- **Configurable timeouts**: Appropriate timeouts for different command types
- **Retry capability**: Failed commands are automatically retried
- **Background support**: Long processes run in background

### For Projects

- **Improved reliability**: No more hanging terminal calls
- **Better productivity**: Uninterrupted development workflow
- **Consistent behavior**: Predictable command execution
- **Maintainable**: Easy to configure and update

## Maintenance

### Regular Tasks

- Monitor script performance
- Update configuration as needed
- Test with new command types
- Validate timeout settings

### Updates

- Keep scripts in sync with project needs
- Update configuration based on feedback
- Maintain compatibility with Cursor updates

## Troubleshooting

### Common Issues

1. **Permission Denied**: Run PowerShell as Administrator
2. **Process Not Found**: Normal - means no hanging processes
3. **Script Execution Policy**: Use `-ExecutionPolicy Bypass`

### Debug Commands

```powershell
# Check running processes
tasklist /FI "IMAGENAME eq node.exe"

# Check PowerShell jobs
Get-Job

# Test with debug mode
.\scripts\auto-terminal-manager.ps1 -Command 'npm test' -Debug
```

## Success Metrics

- ✅ **No manual intervention required**
- ✅ **Automatic timeout enforcement**
- ✅ **Hanging process prevention**
- ✅ **Retry logic for failed commands**
- ✅ **Background job support**
- ✅ **Configuration-driven behavior**
- ✅ **Debug and troubleshooting support**

This solution provides complete automatic terminal hanging prevention without any manual oversight needed.
