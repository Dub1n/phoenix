# MCP Integration for Claude Code

Repo-agnostic MCP (Model Context Protocol) integration using `pty-mcp-server` for agent-CLI interaction.

## Overview

This package provides a standardized way to integrate any CLI application with Claude Code agents through the MCP protocol using pseudoterminals (PTY).

**TASK-MCP-INT-001**: Pty-MCP-Server Installation and Configuration  
**Created**: 2025-09-05  
**Location**: `.claude/mcp-integration/` (cross-project reusable)  
**Architecture**: External pty-mcp-server integration approach

## Quick Start

### 1. Installation

```bash
# Option A: Install via Haskell Cabal (requires GHC >=9.6)
cabal install pty-mcp-server

# Option B: Download pre-built binary
# Visit pty-mcp-server releases page for platform-specific binaries
```

### 2. Configuration

The configuration is already set up in:

- `config.yaml` - MCP server settings and CLI prompts
- `tools-list.json` - Available MCP tools (pty-bash, pty-message)

### 3. Usage

```bash
# Launch pty-mcp-server with configuration
pty-mcp-server --config ./config.yaml

# Or use stdio mode for MCP client integration
pty-mcp-server --config ./config.yaml --stdio
```

### 4. Testing

```bash
npm install
npm test
```

## Architecture

### TDD Approach

This implementation follows Test-Driven Development:

1. **Red**: Write failing tests for pty-mcp-server integration
2. **Green**: Configure pty-mcp-server to pass tests  
3. **Refactor**: Optimize configuration for performance and reliability

### Integration Points

- **MCP Protocol**: Standard MCP communication via stdio
- **PTY Management**: Pseudoterminal session lifecycle
- **CLI Detection**: Configurable prompt detection patterns
- **Tool Registry**: Extensible tool definitions for different CLI interfaces

## Configuration

### config.yaml

```yaml
logDir: "./logs/mcp-channel"
logLevel: "Info"
toolsDir: "./tools/templum"
prompts:
  - "] templum$"      # Templum CLI
  - "? Select option:" # Interactive prompts
  - "$ "              # Generic shell
  - "> "              # Command prompts
  - "Press any key to continue..."
```

### tools-list.json

```json
{
  "templum-cli": {
    "description": "Launch Templum CLI interface",
    "type": "pty-bash"
  },
  "generic-cli": {
    "description": "Launch generic CLI interface",
    "type": "pty-bash"
  }
}
```

## MCP Tools

### pty-bash

Creates new pseudoterminal sessions for CLI applications.

### pty-message  

Sends structured messages to existing PTY sessions with prompt detection.

### pty-connect

Connects to existing PTY sessions for command interaction.

### pty-terminate

Cleanly terminates PTY sessions with resource cleanup.

## Success Criteria

- [ ] pty-mcp-server launches and responds to MCP requests
- [ ] CLI applications can be launched via pty-bash
- [ ] Commands can be sent via pty-message with prompt detection
- [ ] Session cleanup works correctly
- [ ] <100ms response time for MCP operations

## Development

### Project Structure

```filesystem
.claude/mcp-integration/
├── config.yaml           # MCP server configuration
├── tools-list.json       # MCP tool definitions
├── package.json          # Node.js test dependencies
├── tests/
│   └── pty-mcp-server-test-harness.test.ts
└── README.md
```

### Benefits of External pty-mcp-server

- **Mature Software**: Production-tested with comprehensive features
- **Reduced Complexity**: Eliminates 20+ custom implementation tasks
- **Cross-Platform**: Native Windows, macOS, Linux support
- **Maintained**: Active development and community support

## Integration with Other Projects

This setup is designed to be repo-agnostic and can be used with any CLI application by:

1. Adding project-specific prompts to `config.yaml`
2. Defining project-specific tools in `tools-list.json`  
3. Creating project-specific test cases

## Related Documentation

- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [pty-mcp-server GitHub](https://github.com/pborenstein/pty-mcp-server)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)

## TODO Tags

```typescript
/**
 * TODO: [TASK-MCP-INT-001] Pattern: pty-mcp-server-integration-pattern | Complexity: 3
 * Context: Repo-agnostic MCP integration setup for CLI interaction
 * Location: .claude/mcp-integration/ (cross-project reusable)
 * Validation-Required: pty-mcp-server-installation, mcp-protocol-communication, cli-integration
 */
```
