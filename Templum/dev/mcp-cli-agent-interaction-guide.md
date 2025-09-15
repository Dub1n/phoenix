---
name: "MCP CLI Agent Interaction Guide"
description: "Comprehensive usage guide for AI agents to interact with Templum CLI via MCP tools"
created: 2025-09-11
updated: 2025-09-11
version: "1.0.0"
status: "stable"
audience: "AI agents, automation systems"
task-id: "TASK-MCP-004"
---

# MCP CLI Agent Interaction Guide

## Overview

This guide provides comprehensive instructions for AI agents to interact with the Templum CLI through the Model Context Protocol (MCP). The Templum MCP integration provides 5 essential tools for CLI session management, navigation, and state monitoring with optimized performance targeting sub-100ms response times.

## Architecture Summary

The MCP CLI integration consists of:

- **MCP Server**: Provides 5 essential tools via MCP protocol
- **PTY Manager**: Handles pseudoterminal session lifecycle  
- **Service Registration**: Automatic discovery via Templum service registry
- **Health Monitoring**: Comprehensive status tracking and performance metrics
- **Performance Optimization**: Response caching and sub-100ms targeting

## Available MCP Tools

### 1. cli-create-session

Creates a new CLI session for agent interaction.

**Schema:**

```json
{
  "name": "cli-create-session",
  "description": "Create a new CLI session for agent interaction",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Unique session identifier"
      },
      "command": {
        "type": "string", 
        "description": "Optional command to execute (defaults to system shell)",
        "optional": true
      }
    },
    "required": ["sessionId"]
  }
}
```

**Usage Example:**

```typescript
// Basic session creation
const request = {
  id: "req_001",
  method: "tools/call",
  params: {
    name: "cli-create-session",
    arguments: {
      sessionId: "agent_session_001"
    }
  }
};

// Session with specific command
const requestWithCommand = {
  id: "req_002", 
  method: "tools/call",
  params: {
    name: "cli-create-session",
    arguments: {
      sessionId: "agent_session_002",
      command: "bash"
    }
  }
};
```

**Response:**

```json
{
  "id": "req_001",
  "result": {
    "sessionId": "agent_session_001",
    "pid": 12345,
    "command": "/bin/bash",
    "created": "2025-09-11T19:00:00.000Z",
    "currentState": {
      "isWaiting": true,
      "currentPrompt": "user@host:~$ ",
      "availableActions": ["send-text", "navigate"],
      "parsedContent": {
        "type": "prompt",
        "isWaiting": true
      }
    }
  }
}
```

### 2. cli-navigate

Navigate CLI interface using semantic actions.

**Schema:**

```json
{
  "name": "cli-navigate",
  "description": "Navigate CLI interface using semantic actions",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Session identifier"
      },
      "action": {
        "type": "string",
        "enum": ["arrow-up", "arrow-down", "arrow-left", "arrow-right", "enter", "escape", "tab", "select-option", "go-back", "confirm", "cancel"],
        "description": "Navigation action to perform"
      }
    },
    "required": ["sessionId", "action"]
  }
}
```

**Usage Examples:**

```typescript
// Navigate through command history
const navigateUp = {
  id: "req_003",
  method: "tools/call", 
  params: {
    name: "cli-navigate",
    arguments: {
      sessionId: "agent_session_001",
      action: "arrow-up"
    }
  }
};

// Confirm selection
const confirmAction = {
  id: "req_004",
  method: "tools/call",
  params: {
    name: "cli-navigate", 
    arguments: {
      sessionId: "agent_session_001",
      action: "confirm"
    }
  }
};
```

**Navigation Action Mapping:**

- `arrow-up`: Previous command in history / Menu up
- `arrow-down`: Next command in history / Menu down  
- `arrow-left`/`arrow-right`: Cursor movement
- `enter`/`select-option`/`confirm`: Execute/Select
- `escape`/`go-back`/`cancel`: Cancel/Back
- `tab`: Auto-completion

### 3. cli-send-text

Send text input to CLI session.

**Schema:**

```json
{
  "name": "cli-send-text",
  "description": "Send text input to CLI session",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Session identifier"
      },
      "text": {
        "type": "string", 
        "description": "Text to send to CLI"
      }
    },
    "required": ["sessionId", "text"]
  }
}
```

**Usage Examples:**

```typescript
// Send command
const sendCommand = {
  id: "req_005",
  method: "tools/call",
  params: {
    name: "cli-send-text",
    arguments: {
      sessionId: "agent_session_001",
      text: "ls -la"
    }
  }
};

// Send with newline (execute immediately)
const executeCommand = {
  id: "req_006",
  method: "tools/call",
  params: {
    name: "cli-send-text", 
    arguments: {
      sessionId: "agent_session_001",
      text: "pwd\n"
    }
  }
};
```

### 4. cli-get-state

Get current CLI session state and available actions.

**Schema:**

```json
{
  "name": "cli-get-state",
  "description": "Get current CLI session state and available actions",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Session identifier"
      }
    },
    "required": ["sessionId"]
  }
}
```

**Usage Example:**

```typescript
const getState = {
  id: "req_007",
  method: "tools/call",
  params: {
    name: "cli-get-state",
    arguments: {
      sessionId: "agent_session_001"
    }
  }
};
```

**Response:**

```json
{
  "id": "req_007",
  "result": {
    "isWaiting": false,
    "currentPrompt": "user@host:~/Documents$ ", 
    "availableActions": ["send-text", "navigate"],
    "parsedContent": {
      "type": "output",
      "isWaiting": false,
      "lastOutput": "total 24\ndrwxr-xr-x 3 user user 4096 Sep 11 19:00 .\ndrwxr-xr-x 8 user user 4096 Sep 11 18:30 .."
    }
  }
}
```

### 5. cli-destroy-session

Destroy CLI session and cleanup resources.

**Schema:**

```json
{
  "name": "cli-destroy-session", 
  "description": "Destroy CLI session and cleanup resources",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "Session identifier"
      }
    },
    "required": ["sessionId"]
  }
}
```

**Usage Example:**

```typescript
const destroySession = {
  id: "req_008",
  method: "tools/call",
  params: {
    name: "cli-destroy-session",
    arguments: {
      sessionId: "agent_session_001"
    }
  }
};
```

## Service Discovery and Health Assessment

### Checking MCP Service Availability

Before interacting with MCP tools, agents should verify service availability:

**1. List Available Tools:**

```typescript
const listTools = {
  id: "req_tools",
  method: "tools/list"
};

// Expected response
{
  "id": "req_tools", 
  "result": {
    "tools": [
      {
        "name": "cli-create-session",
        "description": "Create a new CLI session for agent interaction"
        // ... schema details
      },
      // ... other 4 tools
    ]
  }
}
```

**2. Service Registry Check:**

```bash
# Check if MCP server is registered in Templum service discovery
ls ~/.templum/services/
# Look for mcp-server-*.json files
```

**3. Health Endpoint Validation:**

```typescript
// MCP server exposes health endpoint for monitoring
// Endpoint available via service registry configuration
```

### Diagnosing MCP Integration Issues

**Common Issues and Solutions:**

1. **Tools Not Available:**
   - Check if MCP server is running
   - Verify service registration in ~/.templum/services/
   - Check MCP server logs in ./logs/mcp-channel

2. **Session Creation Failures:**
   - Verify PTY manager initialization
   - Check system shell availability
   - Review session timeout settings

3. **Performance Issues:**
   - Monitor response times (target: <100ms)
   - Check cache efficiency metrics
   - Review performance logs for slow requests

## Session Lifecycle Management

### Best Practices

**1. Session Creation:**

```typescript
// Always use unique session IDs
const sessionId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create session with error handling
try {
  const session = await createSession(sessionId);
  console.log(`Session created: ${session.sessionId}`);
} catch (error) {
  console.error(`Session creation failed: ${error.message}`);
}
```

**2. Session State Management:**

```typescript
// Always check state before sending commands
const state = await getState(sessionId);

if (state.isWaiting) {
  // CLI is ready for input
  await sendText(sessionId, "ls -la");
} else {
  // Wait for CLI to be ready or check for output
  console.log("CLI busy, waiting...");
}
```

**3. Resource Cleanup:**

```typescript
// Always cleanup sessions when done
try {
  await destroySession(sessionId);
  console.log("Session cleaned up successfully");
} catch (error) {
  console.warn(`Session cleanup warning: ${error.message}`);
}

// Sessions auto-cleanup after timeout (configurable)
```

**4. Error Handling:**

```typescript
// Handle MCP errors properly
const handleMCPResponse = (response) => {
  if (response.error) {
    switch (response.error.code) {
      case -32001: // SESSION_NOT_FOUND
        console.error("Session not found, recreate session");
        break;
      case -32002: // PTY_SPAWN_FAILED  
        console.error("PTY spawn failed, check system configuration");
        break;
      case -32003: // INVALID_ACTION
        console.error("Invalid action, check parameters");
        break;
      case -32004: // TIMEOUT
        console.error("Operation timeout, retry with shorter commands");
        break;
      default:
        console.error(`MCP error: ${response.error.message}`);
    }
    return false;
  }
  return true;
};
```

## Performance Considerations

### Response Time Optimization

**1. Target Performance:**

- All MCP tool responses: <100ms
- Service registration detection: <100ms  
- Health check validation: <5000ms (configurable)
- File watching events: <50ms

**2. Caching Strategy:**

```typescript
// tools/list requests are cached for 5 seconds
// Cache uses LRU eviction with 100 item limit
// Cache cleanup runs every 30 seconds
```

**3. Performance Monitoring:**

```typescript
// Performance metrics available via health endpoint
{
  "requestCount": 150,
  "averageResponseTime": 45.2,
  "cacheHitRate": 0.85,
  "slowRequestCount": 2
}
```

### Optimization Techniques

**1. Batch Operations:**

```typescript
// Group related commands to minimize round trips
const commands = ["cd /tmp", "ls", "pwd"];
for (const cmd of commands) {
  await sendText(sessionId, cmd + "\n");
  await getState(sessionId); // Check completion
}
```

**2. State Caching:**

```typescript
// Cache frequently accessed state
let cachedState = null;
let cacheTime = 0;

const getStateWithCache = async (sessionId) => {
  const now = Date.now();
  if (cachedState && (now - cacheTime) < 1000) { // 1s cache
    return cachedState;
  }
  
  cachedState = await getState(sessionId);
  cacheTime = now;
  return cachedState;
};
```

**3. Parallel Sessions:**

```typescript
// Use multiple sessions for parallel operations  
const sessions = await Promise.all([
  createSession("session_1"),
  createSession("session_2"), 
  createSession("session_3")
]);

// Execute commands in parallel
await Promise.all([
  sendText("session_1", "command1"),
  sendText("session_2", "command2"),
  sendText("session_3", "command3")
]);
```

## Error Handling and Recovery

### Error Types and Recovery Strategies

**1. Session Errors:**

```typescript
// SESSION_NOT_FOUND (-32001)
const handleSessionNotFound = async (sessionId) => {
  console.log("Session expired, recreating...");
  try {
    return await createSession(sessionId);
  } catch (error) {
    console.error("Session recreation failed:", error);
    throw error;
  }
};
```

**2. PTY Errors:**

```typescript
// PTY_SPAWN_FAILED (-32002)
const handlePTYFailure = () => {
  console.error("PTY spawn failed - possible causes:");
  console.error("- System shell not available");
  console.error("- Insufficient permissions");
  console.error("- Resource exhaustion");
  
  // Fallback: try different shell
  return createSession(sessionId, "sh"); // Fallback to sh
};
```

**3. Timeout Handling:**

```typescript
// TIMEOUT (-32004)
const withTimeout = async (operation, timeoutMs = 5000) => {
  return Promise.race([
    operation,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Operation timeout")), timeoutMs)
    )
  ]);
};

try {
  await withTimeout(sendText(sessionId, "long-running-command"));
} catch (error) {
  if (error.message === "Operation timeout") {
    // Handle timeout - maybe cancel command
    await navigate(sessionId, "escape");
  }
}
```

### Recovery Patterns

**1. Graceful Degradation:**

```typescript
const robustCliInteraction = async (sessionId, command) => {
  try {
    // Try primary approach
    await sendText(sessionId, command);
    return await getState(sessionId);
  } catch (error) {
    if (error.code === -32001) { // Session not found
      // Recreate session and retry
      await createSession(sessionId);
      await sendText(sessionId, command);
      return await getState(sessionId);
    }
    throw error; // Re-throw other errors
  }
};
```

**2. Circuit Breaker Pattern:**

```typescript
class MCPCircuitBreaker {
  constructor() {
    this.failures = 0;
    this.lastFailure = 0;
    this.threshold = 5;
    this.timeout = 60000; // 1 minute
  }

  async execute(operation) {
    if (this.isOpen()) {
      throw new Error("Circuit breaker open");
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  isOpen() {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailure) < this.timeout;
  }
  
  onSuccess() {
    this.failures = 0;
  }
  
  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
  }
}
```

## Iteration Patterns for CLI Interaction

### Common Interaction Patterns

**1. Command Execution with Output Capture:**

```typescript
const executeCommand = async (sessionId, command) => {
  // Send command with newline
  await sendText(sessionId, command + "\n");
  
  // Wait for command to complete
  let state;
  let attempts = 0;
  do {
    await new Promise(resolve => setTimeout(resolve, 100));
    state = await getState(sessionId);
    attempts++;
  } while (state.isWaiting && attempts < 50); // 5 second timeout
  
  return state.parsedContent.lastOutput;
};
```

**2. Interactive Menu Navigation:**

```typescript
const navigateMenu = async (sessionId, option) => {
  let state = await getState(sessionId);
  
  // Navigate to desired option
  for (let i = 0; i < option; i++) {
    await navigate(sessionId, "arrow-down");
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Select option
  await navigate(sessionId, "confirm");
  return await getState(sessionId);
};
```

**3. Multi-Step Workflow:**

```typescript
const executeWorkflow = async (sessionId, steps) => {
  const results = [];
  
  for (const step of steps) {
    try {
      let result;
      switch (step.type) {
        case 'command':
          result = await executeCommand(sessionId, step.command);
          break;
        case 'navigate':
          result = await navigate(sessionId, step.action);
          break;
        case 'input':
          result = await sendText(sessionId, step.text);
          break;
      }
      results.push({ step, result, success: true });
    } catch (error) {
      results.push({ step, error, success: false });
      if (step.critical) break; // Stop on critical step failure
    }
  }
  
  return results;
};
```

## Real-World Usage Examples

### Example 1: File System Navigation

```typescript
const exploreDirectory = async () => {
  const sessionId = "explore_" + Date.now();
  
  try {
    // Create session
    await createSession(sessionId);
    
    // Navigate to directory
    await sendText(sessionId, "cd /tmp\n");
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // List files
    await sendText(sessionId, "ls -la\n");
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get directory listing
    const state = await getState(sessionId);
    const listing = state.parsedContent.lastOutput;
    
    console.log("Directory contents:", listing);
    
  } finally {
    // Always cleanup
    await destroySession(sessionId);
  }
};
```

### Example 2: Development Tool Interaction  

```typescript
const runTests = async (projectPath) => {
  const sessionId = "test_" + Date.now();
  
  try {
    await createSession(sessionId);
    
    // Navigate to project
    await sendText(sessionId, `cd ${projectPath}\n`);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Run tests with timeout handling
    await sendText(sessionId, "npm test\n");
    
    // Monitor test execution
    let testRunning = true;
    let timeout = 0;
    while (testRunning && timeout < 300) { // 30 second timeout
      await new Promise(resolve => setTimeout(resolve, 100));
      const state = await getState(sessionId);
      
      if (state.parsedContent.lastOutput.includes("Test Suites:")) {
        testRunning = false;
      }
      timeout++;
    }
    
    const finalState = await getState(sessionId);
    return finalState.parsedContent.lastOutput;
    
  } finally {
    await destroySession(sessionId);
  }
};
```

### Example 3: Interactive Application Control

```typescript
const controlCLIApp = async (appCommand) => {
  const sessionId = "app_" + Date.now();
  
  try {
    await createSession(sessionId);
    
    // Start application
    await sendText(sessionId, appCommand + "\n");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Wait for application to load
    let state = await getState(sessionId);
    
    // Navigate application menu
    await navigate(sessionId, "arrow-down"); // Move to option 2
    await navigate(sessionId, "enter");      // Select
    
    // Handle sub-menu
    await navigate(sessionId, "tab");        // Tab to next field
    await sendText(sessionId, "input_value"); // Enter value
    await navigate(sessionId, "confirm");     // Confirm
    
    // Get final state
    return await getState(sessionId);
    
  } finally {
    // Exit application gracefully
    await navigate(sessionId, "escape");
    await destroySession(sessionId);
  }
};
```

## Configuration and Customization

### MCP Server Configuration

**Configuration File: `mcp-server/config/config.yaml`**

```yaml
mcp:
  server:
    name: "templum-mcp-server"
    version: "1.0.0"
  
  session:
    defaultTimeout: 300000    # 5 minutes
    cleanupInterval: 60000    # 1 minute
    maxSessions: 10
  
  performance:
    responseTimeTarget: 100   # milliseconds
    cacheEnabled: true
    cacheTTL: 5000           # 5 seconds
    maxCacheSize: 100
    
  health:
    checkInterval: 30000     # 30 seconds
    endpoint: "/health"
    
  logging:
    level: "info"
    directory: "./logs/mcp-channel"
```

**Tools Configuration: `mcp-server/tools/tools-list.json`**

```json
{
  "tools": [
    {
      "name": "templum-cli",
      "type": "mcp",
      "enabled": true,
      "config": {
        "sessionTimeout": 300000,
        "performanceMode": true
      }
    }
  ]
}
```

### Service Registration Configuration

The MCP server automatically registers itself in the Templum service discovery:

**Service Registry Entry: `~/.templum/services/mcp-server-{timestamp}.json`**

```json
{
  "id": "mcp-server-20250911190000",
  "name": "Templum MCP Server",
  "version": "1.0.0",
  "pid": 12345,
  "endpoint": "stdio://mcp-server",
  "protocol": "mcp",
  "health": "internal://health-check",
  "capabilities": [
    "cli-create-session",
    "cli-navigate", 
    "cli-send-text",
    "cli-get-state",
    "cli-destroy-session"
  ],
  "started": 1725638400000,
  "performance": {
    "targetResponseTime": 100,
    "cacheEnabled": true
  }
}
```

## Troubleshooting Guide

### Common Issues and Solutions

**Issue**: "Tools not available"

- Check MCP server is running: `ps aux | grep mcp-server`
- Verify service registration: `ls ~/.templum/services/mcp-*.json`
- Check server logs: `tail -f logs/mcp-channel/*.log`

**Issue**: "Session creation fails"

- Verify system shell availability: `echo $SHELL`
- Check permissions: `whoami && groups`
- Try alternative shell: create session with `"command": "sh"`

**Issue**: "Slow response times"

- Monitor performance metrics via health endpoint
- Check cache efficiency: low cache hit rate may indicate issues
- Verify system resources: `top`, `free -h`

**Issue**: "Navigation not working"

- Verify application supports navigation keys
- Check if application is in correct state (menu vs command mode)
- Try alternative navigation actions (escape, then retry)

### Debug Information Collection

```typescript
// Collect debug information
const collectDebugInfo = async () => {
  const info = {
    timestamp: new Date().toISOString(),
    mcp: {
      tools: await listTools(),
      health: await checkHealth(),
      performance: await getPerformanceMetrics()
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      shell: process.env.SHELL,
      user: process.env.USER
    },
    service: {
      registry: await checkServiceRegistry(),
      processes: await listMCPProcesses()
    }
  };
  
  console.log(JSON.stringify(info, null, 2));
  return info;
};
```

## Summary

The Templum MCP CLI integration provides a robust, performant way for AI agents to interact with command-line interfaces. Key benefits include:

- **5 Essential Tools**: Complete CLI session lifecycle management
- **Performance Optimized**: Sub-100ms response times with intelligent caching
- **Error Resilient**: Comprehensive error handling and recovery patterns
- **Service Integrated**: Automatic discovery via Templum service registry
- **Health Monitored**: Continuous performance and availability monitoring

For additional support or advanced usage patterns, refer to the source implementation in `/src/mcp-channel/` or consult the validation reports in `/dev/validation-results/`.
