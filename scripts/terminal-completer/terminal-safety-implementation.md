---
tags: [Terminal, Safety, Automation, VSCode, Cursor, Agent]
provides: [Terminal Safety Implementation, Hanging Prevention, Automatic Timeouts]
requires: [PowerShell, VSCode, Cursor]
---

# Terminal Safety Implementation

## Overview

Successfully implemented automatic terminal safety for both **user terminals** (VSCode/Cursor) and **agent terminals** (Cursor AI agent) to prevent hanging commands and ensure reliable execution.

## Implementation Components

### 1. User Terminal Safety (VSCode/Cursor)

**Files:**

- `.vscode/settings.json` - VSCode terminal profile configuration
- `.cursor/terminal-settings.json` - Cursor terminal profile configuration  
- `scripts/cursor-terminal-init.ps1` - User terminal initialization script

**How it works:**

- Automatically loads on terminal startup
- Overrides common commands (npm, node, git, etc.)
- Applies automatic timeouts and hanging prevention
- Shows "Cursor Terminal Safety Activated" message

**Configuration:**

```json
{
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "args": [
        "-ExecutionPolicy", "Bypass",
        "-NoExit",
        "-Command",
        ". '${workspaceFolder}/scripts/cursor-terminal-init.ps1'"
      ]
    }
  }
}
```

### 2. Agent Terminal Safety (Cursor AI)

**Files:**

- `.cursor/agent-terminal-profile.json` - Agent terminal profile
- `scripts/agent-terminal-init.ps1` - Agent terminal initialization script
- `.cursor/rules/guidelines/06-terminal-safety.mdc` - Agent guidelines

**How it works:**

- Automatically applies to all `run_terminal_cmd()` calls
- No need for manual wrapping - direct commands are automatically safe
- Provides detailed logging and timeout management
- Kills hanging processes before execution

**Agent Usage:**

```powershell
# ✅ Automatically safe - no wrapping needed
run_terminal_cmd("npm test")
run_terminal_cmd("git status")
run_terminal_cmd("node script.js")
```

### 3. Configuration Management

**Files:**

- `.cursor/terminal-config.json` - Centralized configuration
- `scripts/auto-terminal-manager.ps1` - Core safety engine
- `scripts/kill-hanging.ps1` - Quick manual cleanup

**Features:**

- Command-specific timeouts (npm test: 60s, git: 15s, etc.)
- Automatic hanging process detection and cleanup
- Background job management
- Retry logic for failed commands

## Key Benefits

### For Users

- **Zero manual intervention** - safety activates automatically
- **No hanging terminals** - automatic timeout enforcement
- **Detailed feedback** - clear status messages and logging
- **Workspace-specific** - doesn't affect global PowerShell profile

### For Agents

- **Simplified usage** - direct commands are automatically safe
- **Reliable execution** - no more hanging tool calls
- **Automatic cleanup** - hanging processes killed before new commands
- **Detailed logging** - execution status and timeout information

## Testing Results

✅ **User Terminal**: Automatically loads safety script on startup
✅ **Agent Terminal**: Direct commands work without manual wrapping
✅ **Timeout Enforcement**: Commands complete within configured limits
✅ **Hanging Prevention**: Processes killed before new execution
✅ **Configuration Loading**: Settings applied from `.cursor/terminal-config.json`

## Usage Examples

### User Terminal (VSCode/Cursor)

```powershell
# Open new terminal → automatically shows:
# "Cursor Terminal Safety Activated"
# "Safe command overrides loaded: npm, node, git, tsc, jest, yarn, pnpm"

npm test          # ✅ Automatic 60s timeout
git status        # ✅ Automatic 15s timeout
node script.js    # ✅ Automatic 30s timeout
```

### Agent Terminal (Cursor AI)

```powershell
# Agent can use direct commands:
run_terminal_cmd("npm test")      # ✅ Automatic safety
run_terminal_cmd("git status")    # ✅ Automatic safety
run_terminal_cmd("node script.js") # ✅ Automatic safety
```

## Maintenance

### Configuration Updates

- Edit `.cursor/terminal-config.json` for timeout adjustments
- Modify `scripts/cursor-terminal-init.ps1` for user terminal changes
- Update `scripts/agent-terminal-init.ps1` for agent terminal changes

### Troubleshooting

- Use `scripts/kill-hanging.ps1` for manual cleanup
- Check terminal output for detailed error messages
- Restart Cursor if persistent issues occur

## Future Enhancements

- Add more command types to automatic safety
- Implement command history and retry patterns
- Add performance monitoring and optimization
- Extend to other terminal types (bash, cmd)

---

**Status**: ✅ **FULLY IMPLEMENTED AND TESTED**
**Coverage**: User terminals + Agent terminals
**Reliability**: Automatic hanging prevention with detailed logging
