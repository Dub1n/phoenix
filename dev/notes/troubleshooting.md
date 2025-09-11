# Claude Code Troubleshooting Guide

This file contains technical insights and solutions discovered while working with Claude Code.

## Hooks System

### Hook Path Resolution Issue
**Problem**: Hooks defined in project-local `.claude/settings.local.json` may not work if using relative paths.

**Root Cause**: Claude Code expects hooks to be in the global `~/.claude/hooks/` directory by default, not project-relative paths.

**Solution**: 
1. Create the global hooks directory: `mkdir -p ~/.claude/hooks`
2. Place hook scripts in `~/.claude/hooks/` (e.g., `~/.claude/hooks/type_check.py`)
3. Reference them in settings with: `"command": "python ~/.claude/hooks/script_name.py"`

**Example Working Configuration**:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python ~/.claude/hooks/type_check.py"
          }
        ]
      }
    ]
  }
}
```

### Type Checking Hook Enhancement
**Insight**: The basic YouTube tutorial type checker only handled TypeScript. Enhanced version supports:
- **JavaScript files** (.js/.jsx): Uses `node --check` for syntax validation
- **TypeScript files** (.ts/.tsx): Uses `tsc --noEmit` for type checking
- **Project-aware configs**: Detects and uses project-specific `tsconfig.json` files

**Enhanced Script Location**: `~/.claude/hooks/type_check.py`

## Settings and Configuration

### Settings File Hierarchy
**Discovery**: Local project settings may not always override global settings as expected.

**Troubleshooting Steps**:
1. Check for global settings in `~/.claude/`
2. Verify local settings in project's `.claude/settings.local.json`
3. Restart Claude Code if settings changes aren't taking effect
4. Use absolute paths for commands when relative paths fail

### Permissions Configuration
**Required Permissions** for typical development workflows:
```json
{
  "permissions": {
    "allow": [
      "Bash(dir:*)",
      "Bash(ls:*)", 
      "Bash(find:*)",
      "Bash(cp:*)",
      "Bash(rm:*)"
    ]
  }
}
```

## Common Issues

### Hook Not Executing
**Symptoms**: PostToolUse hooks don't run after file edits
**Likely Causes**:
1. Hook script not in global `~/.claude/hooks/` directory
2. Incorrect path in settings.local.json
3. Python/Node.js not in PATH
4. Script permissions issues

**Troubleshooting Checklist**:
- [ ] Verify hook script exists at `~/.claude/hooks/script_name.py`
- [ ] Check script permissions (should be readable)
- [ ] Test script manually: `python ~/.claude/hooks/script_name.py`
- [ ] Verify settings.local.json syntax is valid JSON
- [ ] Restart Claude Code to reload settings

### Path Resolution on Windows
**Issue**: Mixed forward/backslash path separators can cause issues
**Solution**: Use forward slashes in JSON configuration files, even on Windows

## Memory and Context Management

### Notes Organization Strategy
- **User Memory** (`~/.claude/CLAUDE.md`): Lightweight references and universal preferences
- **Notes Folder** (`~/.claude/notes/`): Detailed troubleshooting and technical insights  
- **Project Memory** (`./CLAUDE.md`): Project-specific architecture and patterns

**Benefit**: Keeps context clean while maintaining accessible knowledge base.

---

*Last Updated: 2025-01-28*
*Found an issue or discovered a new insight? Add it to this file for future reference.*
