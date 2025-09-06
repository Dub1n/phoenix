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

### Templum Architecture Context

Templum 1.2 is a **Generic Universal Interface Orchestrator** that provides consistent experiences across multiple interface modalities:

- **VSCode Extension**: Rich IDE integration with tree views, panels, and commands
- **CLI Interface**: Interactive terminal-based menus and navigation  
- **Command-Line**: Standard CLI with flag parsing and completion

#### Key Architecture Features Affecting CLI Testing

**1.** CLI Process Separation Pattern (NEW 2025-09-02):

- **Headless Service Architecture**: Core service runs independently of CLI
- **Service Discovery**: CLI connects to service via IPC discovery mechanism
- **Multi-Terminal Support**: Multiple CLI instances can connect to single service
- **Global Command Access**: `templum` command accessible from any terminal

**2.** Zero Backend Knowledge Architecture:

- Templum contains **no hardcoded backend-specific logic**
- Backends **self-describe** through `UniversalSkinDefinition` objects  
- **Protocol-agnostic communication** supports IPC, HTTP, WebSocket, and gRPC
- **Dynamic command routing** eliminates hardcoded command patterns

**3.** Generic Backend Integration Platform:

- **Multi-strategy service discovery** automatically finds and connects to backends
- **Connection factory** creates appropriate connections based on backend configuration
- **Zero code changes required** in Templum for new backend integration

### Current Startup Process

**Option A**: Independent Processes (Recommended):

1. **Main Service**: `node Templum/dist/src/index.js` (headless service)
2. **CLI Tool**: `npm run start:cli` (discovers and connects to service)

**Option B**: Legacy Monolithic (being phased out):

1. Combined service+CLI startup (less flexible for automation)

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

### Templum CLI Architecture Details

**✅ Service Discovery Mechanism:**

- **Registry-based discovery**: Service creates registry entry in `.templum/services/`
- **PID validation**: CLI validates service process is still running
- **Automatic cleanup**: Stale registry entries cleaned up on service exit
- **Multi-strategy discovery**: Supports multiple discovery fallback methods

**✅ Communication Protocol:**

- **IPC-based communication**: Inter-process communication between CLI and service
- **Connection factory**: Dynamic connection creation based on backend configuration
- **Protocol agnostic**: Supports IPC, HTTP, WebSocket, gRPC for backend integration

**✅ Service Auto-Start Capability:**

- **Headless deployment ready**: Service runs independently of CLI
- **CLI-triggered startup**: CLI can potentially auto-start service if not running
- **Process independence**: Service and CLI operate as separate processes

**✅ CLI Commands Expected:**
Based on Universal Interface Orchestrator pattern:

- `help` - Command help and usage
- `status` - Service and backend connection status  
- `list` - List available backends/services
- `connect` - Connect to specific backend
- `disconnect` - Disconnect from backend
- `config` - Configuration management
- `version` - Version information
- Backend-specific commands (dynamically routed)

### Testing Priorities

1. **Service Discovery & Connection** - Test CLI's ability to discover and connect to service
2. **Basic CLI functionality with piped input** - Core command execution via automation
3. **Service communication validation** - IPC communication between CLI and service
4. **Backend integration testing** - Dynamic command routing to backend services  
5. **Error handling scenarios**:
   - Service not running
   - Invalid commands
   - Backend connection failures
   - IPC communication errors
6. **Multi-step workflow automation** - Complex command sequences
7. **Performance and timeout behavior** - Response times and connection stability

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
