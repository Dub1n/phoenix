# Terminal Hanging Solution Guide

## Problem
Cursor agent terminal tool calls frequently hang, even after commands complete. This creates workflow interruptions and requires manual intervention.

## Root Causes
1. **Process Lifecycle Management**: Node.js processes don't always terminate cleanly
2. **Background Jobs**: Long-running processes continue after completion
3. **Timeout Configuration**: Default timeouts may be too long or too short
4. **Process Inheritance**: Child processes not properly managed

## Solution Components

### 1. Quick Kill Script
```powershell
# Use this immediately when terminal calls hang
.\scripts\kill-hanging.ps1
```

### 2. Terminal Manager
```powershell
# For controlled command execution
.\scripts\terminal-manager.ps1 -Command "npm test" -Timeout 30000
```

### 3. Configuration-Based Management
The `.cursor/terminal-config.json` file defines:
- Timeout values for different command types
- Process management rules
- Background job limits

## Best Practices

### For the Agent
1. **Use Appropriate Timeouts**: 
   - Short commands: 10-15 seconds
   - Build commands: 60-120 seconds
   - Test commands: 30-60 seconds

2. **Background vs Foreground**:
   - Use background for long-running processes
   - Use foreground for quick commands that need output

3. **Process Monitoring**:
   - Check for hanging processes before new commands
   - Kill hanging processes when detected

### For the User
1. **Keyboard Shortcuts**:
   - `Ctrl+C` twice for immediate termination
   - `Ctrl+C` then `Y` + `Enter` for batch jobs

2. **Manual Intervention**:
   - Run `.\scripts\kill-hanging.ps1` when needed
   - Use Task Manager for stubborn processes

3. **Prevention**:
   - Monitor system resources during long operations
   - Use appropriate timeouts for different command types

## Implementation Strategy

### Phase 1: Immediate Relief
- [x] Create kill-hanging script
- [x] Create terminal manager
- [x] Test basic functionality

### Phase 2: Configuration Integration
- [ ] Integrate with Cursor agent configuration
- [ ] Add automatic timeout detection
- [ ] Implement process monitoring

### Phase 3: Advanced Features
- [ ] Add retry logic for failed commands
- [ ] Implement process dependency tracking
- [ ] Add performance monitoring

## Usage Examples

### Kill Hanging Processes
```powershell
.\scripts\kill-hanging.ps1
```

### Execute Command with Timeout
```powershell
.\scripts\terminal-manager.ps1 -Command "npm test" -Timeout 30000
```

### Background Job
```powershell
.\scripts\terminal-manager.ps1 -Command "npm start" -Background
```

### Kill All Hanging
```powershell
.\scripts\terminal-manager.ps1 -KillHanging
```

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

# Check process tree
wmic process where "name='node.exe'" get ProcessId,ParentProcessId
```

## Integration with QMS Project

This solution integrates with the QMS infrastructure refactoring by:

1. **Supporting Test-Driven Development**: Reliable test execution
2. **Enabling Continuous Integration**: Stable build processes
3. **Facilitating Development Workflow**: Uninterrupted development cycles
4. **Ensuring Quality Gates**: Reliable validation processes

## Maintenance

### Regular Tasks
- Monitor script performance
- Update process patterns as needed
- Adjust timeout values based on project needs
- Test with new command types

### Updates
- Keep scripts in sync with project requirements
- Update configuration based on team feedback
- Maintain compatibility with Cursor updates 