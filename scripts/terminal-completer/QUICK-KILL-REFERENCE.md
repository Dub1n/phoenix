# Quick Kill Reference

## When Terminal Calls Hang

### Immediate Action

```powershell
.\scripts\kill-hanging.ps1
```

### Keyboard Shortcuts

- `Ctrl+C` twice → Immediate termination
- `Ctrl+C` then `Y` + `Enter` → Batch job termination

### Manual Process Kill

```powershell
# Kill specific processes
taskkill /F /IM node.exe
taskkill /F /IM npm.cmd
taskkill /F /IM tsc.exe

# Check what's running
tasklist /FI "IMAGENAME eq node.exe"
```

### For Stubborn Processes

1. Open Task Manager (`Ctrl+Shift+Esc`)
2. Find hanging processes
3. End task manually

## Prevention Tips

### For Agents

- Use appropriate timeouts (10-60 seconds)
- Run long processes in background
- Check for hanging processes before new commands

### For Users

- Monitor system resources
- Use the kill script proactively
- Report persistent issues

## Quick Commands

```powershell
# Kill all hanging
.\scripts\kill-hanging.ps1

# Execute with timeout
.\scripts\terminal-manager.ps1 -Command "npm test" -Timeout 30000

# Background job
.\scripts\terminal-manager.ps1 -Command "npm start" -Background
```

---
**Note**: This is a temporary solution. The comprehensive solution is in `docs/terminal-hanging-solution.md`
