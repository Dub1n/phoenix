# Terminal Manager Activation Rule

## Critical Requirement

**ALWAYS** activate the agent terminal manager at the start of ANY development session by running `scripts/terminal-completer/integration/agent-terminal-init.ps1` before executing any other commands.

## Activation Protocol

### 1. Automatic Activation (First Command Only)

When the agent is about to execute ANY terminal command for the first time in a session:

```powershell
# ALWAYS run this first, before any other commands
powershell -ExecutionPolicy Bypass -File scripts/terminal-completer/integration/agent-terminal-init.ps1
```

**Activation Rules:**

- Run **ONCE** per session, before first command
- Run **SILENTLY** - no user notification needed if successful
- Run **AUTOMATICALLY** - no user permission required
- Run **IMMEDIATELY** - before any other terminal operations

### 2. Activation Verification

After running the script, verify activation by checking for:

- Command aliases (npm, node, git, tsc, jest, yarn, pnpm)
- Enhanced monitoring functions
- Heartbeat system status

## Error Handling Protocol

### When Script Fails or Has Issues

If the terminal manager script fails, produces errors, or doesn't activate properly:

#### Step 1: Create TODO Items

Create appropriate TODO items in `TODO.md` for the current assignment:

```markdown
## Terminal Manager Issues - [Current Date]

### [NOT STARTED] Fix Terminal Manager Script
- **Issue**: Terminal manager script failed to activate properly
- **Impact**: Development commands may hang or fail
- **Priority**: High
- **Context**: [Brief description of current assignment]

### [NOT STARTED] Complete Original Assignment
- **Task**: [Original assignment description]
- **Status**: Blocked by terminal manager issues
- **Priority**: [Original priority]
```

#### Step 2: User Decision Request

Ask the user: "The terminal manager script encountered issues. Would you like me to fix it first, or should I proceed with the original assignment?"

#### Step 3A: If User Wants Script Fixed

- Fix the terminal manager script until it works correctly
- Test activation and verify all functions work
- Read the TODO items created in Step 1
- Execute the original assignment tasks
- Mark TODO items as complete

#### Step 3B: If User Declines Script Fix

- Proceed with original assignment using standard terminal commands
- Execute the TODO items created in Step 1
- Mark TODO items as complete

#### Step 4: TODO Completion

Mark all TODO items as complete once implemented:

```markdown
### [COMPLETED] Fix Terminal Manager Script
- **Resolution**: [Description of what was fixed]
- **Completion Time**: [Timestamp]

### [COMPLETED] Complete Original Assignment
- **Resolution**: [Description of what was accomplished]
- **Completion Time**: [Timestamp]
```

## Implementation Details

### Script Location

- **Path**: `scripts/terminal-completer/integration/agent-terminal-init.ps1`
- **Execution**: PowerShell with bypass execution policy
- **Scope**: Global command aliases and enhanced monitoring

### Expected Benefits

- **Command Safety**: All npm, node, git commands automatically timeout-protected
- **Hanging Prevention**: Automatic process termination for hanging commands
- **Enhanced Monitoring**: Real-time command execution tracking
- **Error Recovery**: Automatic retry logic for test commands
- **Session Continuity**: Persistent terminal state throughout development

### Fallback Behavior

If the script cannot be executed for any reason:

- Log the failure in TODO.md
- Continue with standard terminal commands
- Note potential hanging risks to user
- Offer to investigate script issues

## Integration with DSS Workflows

This rule integrates with all DSS workflows:

- **Quick Tasks**: Automatic activation before any command execution
- **Code Modification**: Ensures safe development command execution
- **Task Decomposition**: Maintains terminal safety across complex workflows
- **Documentation**: Automatic TODO creation for tracking issues

## Success Indicators

Terminal manager is successfully activated when:

- [ ] Script executes without errors
- [ ] Command aliases are available (npm, node, git, tsc, jest, yarn, pnpm)
- [ ] Enhanced monitoring functions are loaded
- [ ] Heartbeat system is active
- [ ] No error messages in console output

## Critical Notes

- **NEVER skip this activation** - it's mandatory for all development sessions
- **NEVER ask permission** to run the script initially
- **ALWAYS handle failures gracefully** with TODO creation and user choice
- **ALWAYS complete the original assignment** regardless of script status
- **ALWAYS document issues and resolutions** in TODO.md

---

**Remember**: This terminal manager prevents command hanging and ensures reliable development workflows. Its activation is non-negotiable for any development session.
alwaysApply: true

---
