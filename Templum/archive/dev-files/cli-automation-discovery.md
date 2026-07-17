# Templum CLI Automation Discovery

**Date**: 2025-09-04-1302
**Purpose**: Testing interactive CLI automation capabilities for Claude Code agent integration

## Background

While investigating TypeScript compilation issues, we discovered that moving test framework files resolved "Cannot find name 'describe'" errors. This led to exploring how Claude Code agents can interact with interactive CLIs, specifically for the Templum CLI.

## Key Discovery: Agent-Terminal Architecture

### How Claude Code Agents Work with Terminals

- **Agents are NOT "in" the terminal** - they send commands to terminal services
- **Background execution** - commands return immediately with a PID
- **BashOutput tool** - agents must explicitly check results using the PID
- **Intelligent truncation** - long outputs are filtered to show relevant information

### Interactive CLI Automation Capabilities

#### ✅ What Works: Piped Input

```bash
echo -e "1\n2\n3\nexit\n" | your-cli-tool
```

- **Perfect for automation** - reliable and predictable
- **Full interaction capture** - BashOutput shows complete flow
- **Platform independent** - works across different systems
- **Agent-friendly** - no timing dependencies

#### ⚠️ What's Limited: Real-time Keypresses

```powershell
[System.Windows.Forms.SendKeys]::SendWait("1{ENTER}")
```

- **Doesn't reach background processes** - SendKeys targets active window
- **Unexpected discovery** - actually sends to Claude Code interface as user messages
- **Potential for meta-automation** - could control Claude Code itself programmatically

## Templum CLI Testing Strategy

### Current Startup Process

1. **Main App**: `node Templum/dist/src/index.js` (starts the core service)
2. **CLI Tool**: `cd templum && npm run start:cli` (launches CLI interface)

### Proposed Test Approach

#### Option 1: Sequential Startup

```bash
# Start main app in background
node Templum/dist/src/index.js &
sleep 2
# Then test CLI with piped input
echo -e "help\nstatus\nexit\n" | npm run start:cli
```

#### Option 2: Auto-Start Integration

- Modify CLI to check if main app is running
- Auto-start main app if not detected
- Provide graceful error handling

## BashOutput Capabilities for CLI Testing

### What We Can See

- Text-based menus and prompts
- Command responses and output
- Error messages and warnings
- Interactive dialogues (with piped input)

### What We Cannot See

- ncurses/visual interfaces
- Real-time terminal updates
- Color formatting
- Complex terminal graphics

## Implementation Plan

### 1. Test Script Creation

- Create automated test script using piped input
- Test various CLI commands and workflows
- Capture and analyze BashOutput results

### 2. CLI Enhancement Opportunities

- Add `--batch` mode for non-interactive use
- Implement `--json` output for structured responses
- Create `--health-check` for service status
- Add `--auto-start` to launch main app if needed

### 3. Agent Integration Patterns

- Design input files for complex workflows
- Create error recovery patterns
- Build validation for agent-generated commands

## Technical Notes

### Current CLI Architecture Analysis Needed

- [ ] How does CLI detect if main app is running?
- [ ] What ports/protocols are used for communication?
- [ ] Can CLI auto-start the main app?
- [ ] What's the graceful shutdown process?

### Testing Priorities

1. Basic CLI functionality with piped input
2. Service communication validation
3. Error handling with invalid input
4. Multi-step workflow automation
5. Performance and timeout behavior

## Expected Benefits

### For Development

- Automated testing of CLI workflows
- Validation of service integration
- Regression testing capabilities
- CI/CD integration potential

### For Claude Code Agents

- Reliable CLI automation
- Predictable interaction patterns
- Structured error handling
- Consistent output parsing

## Optimal Test Script Design for Claude Code Agents

### Key Insight: Environment-Specific Optimization

When designing automation scripts for Claude Code agents, the optimal approach differs significantly from human-oriented scripts.

#### For Claude Code Agents (Bash version - OPTIMAL)

```bash
#!/bin/bash
# Uses piped input strategy - proven to work perfectly
{
  echo "help"
  echo "status" 
  echo "version"
  echo "exit"
} | npm run start:cli
```

**Why this is ideal for agents:**

- **Uses available tools**: Bash commands that agents can execute reliably
- **Piped input strategy**: The exact approach we proved works perfectly
- **Background process management**: Uses PID tracking agents can handle
- **Simple text output**: Creates files agents can easily read with Read tool
- **Error handling**: `set -e` provides predictable behavior
- **No external dependencies**: Just bash, node, npm - universally available tools
- **Cross-platform**: Works in any bash environment
- **Direct**: Uses exactly the patterns tested successfully

#### For Human Users (PowerShell version)

```powershell
# Better structured output (JSON), sophisticated error handling
$Results = @{
    TestMode = $TestMode
    Success = $LASTEXITCODE -eq 0
    Output = $CLIOutput -split "`n"
}
$Results | ConvertTo-Json -Depth 3 | Out-File "results.json"
```

**Why PowerShell is better for humans:**

- Richer parameter options and structured output
- Windows-native integration
- Better error reporting and handling
- Interactive parameter prompts

### Environment Architecture Impact

This reinforces the core discovery about agent-terminal architecture:

- **Agents optimize for**: Simplicity, reliability, text-based results
- **Humans optimize for**: Rich interfaces, structured data, interactive features
- **The separation is architectural**: Not just preference, but fundamental tool capabilities

## Test Scripts Created

1. **`test-templum-cli.sh`** - Optimized for Claude Code agents
2. **`test-templum-cli.ps1`** - Optimized for human users

Both test the same functionality but use environment-appropriate approaches.

## Next Steps

1. **✅ Create test script** - Automated Templum CLI testing (COMPLETED)
2. **Analyze CLI behavior** - Document current capabilities using created scripts
3. **Identify enhancement opportunities** - Batch mode, auto-start, etc.
4. **Document integration patterns** - Best practices for agent vs. human use
5. **Test error scenarios** - Invalid input, service unavailable, etc.

---

*This discovery session revealed the architectural separation between Claude Code agents and terminal interfaces, and demonstrated how optimal automation strategies must be tailored to the specific capabilities and constraints of each environment.*
