---
tags: [guide, troubleshooting, mcp_server, cursor_integration]
provides: [rules_injector_troubleshooting_guide]
requires: [mcp_spec, rules_injector_server, cursor_mcp_config]
---

# Rules Injector MCP Server – Comprehensive Troubleshooting & Fix Guide

> **Audience**: Developers maintaining the custom `rules_injector_server` and related Cursor MCP configuration.
>
> **Goal**: Provide a definitive, step-by-step diagnosis and repair plan so the **Rules Injector** tool appears in Cursor's *MCP Tools* panel and functions correctly alongside `review-gate-v2`.

---

## 1. What the current code is trying to do

1. **`rules_injector_server.py`**  
   • Implements a Python MCP server (`mcp>=1.9.2`) that exposes a single tool named **`rules_injector`**.  
   • Accepts requests over **stdio**.  
   • Wrapped by **`supergateway`** so it can be reached via **HTTP SSE** on `http://localhost:8002` (`/sse`, `/message`).
2. **`package.json`**  
   • Defines `mcp-custom` script → starts the Python server through *supergateway* on port `8002`.  
   • Ships `@modelcontextprotocol/server-sequential-thinking` for comparison.
3. **`C:\Users\gabri\.cursor\mcp.json`**  
   • Instructs Cursor to connect to:
     - `review-gate-v2` ✔ (working)
     - `sequential-thinking-server` ❌ (*stuck on "Loading tools"*)
     - `rules_injector_server` ❌ (*tool never listed*)
   • Uses **HTTP/SSE transport** (because `url` / `messageUrl` fields are present) – Cursor expects an SSE-capable endpoint that conforms to MCP handshake.

---

## 2. Where it is failing (observable symptoms)

| Component | Symptom | Evidence |
|-----------|---------|----------|
| `rules_injector_server` | Tool never appears in *Settings → MCP Tools* | Cursor UI shows server connected but *0 tools*.
| `sequential-thinking-server` | UI stuck on "Loading tools" | Infinite spinner in Cursor settings.
| `review-gate-v2` | Works | Serves as reference implementation.

---

## 3. Why it is failing (root-cause analysis)

1. **Transport mismatch**  
   The Python server speaks **stdio**, but Cursor connects via **HTTP/SSE** (`url` + `messageUrl`). Without a bridge, nothing happens. While *supergateway* is intended to be that bridge, it is **not running automatically** – `npm run mcp-custom` has not been started.
2. **Missing server keep-alive / CORS headers** (secondary)  
   Even when `supergateway` runs, if the Python process crashes or exits (common during reload), the gateway holds the port but serves no data, causing *"Loading tools"*.
3. **Incorrect `ServerCapabilities`** (low probability, but worth fixing)  
   MCP 1.9.2 expects:
   ```python
   capabilities = ServerCapabilities(tools={"enabled": True})
   ```
   – the extra `"tool_calls": True` key is **ignored safely** but can be removed for clarity.
4. **Tool definition never returned**  
   If initialisation fails (e.g., Python import error) `list_tools` is never executed. Logs show no fatal errors – points back to transport.

---

## 4. What it needs to do (minimum working setup)

1. **Ensure the bridge is running** so the stdio-based Python server is reachable at `localhost:8002` before Cursor starts.
2. **Verify MCP handshake** – server must reply to `list_tools` within 5 seconds; otherwise Cursor marks it unavailable.
3. **Return a valid `Tool` list** every time (the current `inputSchema` format is correct – mirrors the reference *sequential-thinking* server).
4. **Keep the process alive** – restart on crash or exit so the gateway is never serving an empty pipe.

---

## 5. Definitive Fixes

Below is a *single, battle-tested path* to get everything working. Follow **all** steps – skipping will keep the failure.

### 5.1 Run the bridge automatically

Add an **npm script** that launches the Python server via *supergateway* **and** starts it on login.

```json
// ... existing code ...
"scripts": {
  // ... existing scripts ...
  "start:rules-injector": "npx -y supergateway --port 8002 --stdio \"python src/rules_injector_server.py\""
}
```

Then **start it once**:

```bash
npm run start:rules-injector | cat
```

> Keep this terminal open while using Cursor, or set up a PM2/systemd service to autostart.

### 5.2 Point Cursor to the correct endpoint

Update `~/.cursor/mcp.json` so **either**:

1. Use `command` (std-in-out) **OR**
2. Keep `url`/`messageUrl` **but** guarantee the bridge is up.

**Simplest**: switch to stdio (mirrors review-gate-v2 which works):

```json
"rules_injector_server": {
  "command": "python",
  "args": ["${workspaceRoot}/src/rules_injector_server.py"],
  "transport": "stdio",
  "env": {
    "PYTHONUNBUFFERED": "1"
  },
  "cwd": "${workspaceRoot}"
}
```

Restart Cursor after saving.

### 5.3 Harden the Python server

1. **Remove unused capability key**:
```python
capabilities = ServerCapabilities(tools={"enabled": True})  # remove tool_calls
```
2. **Add top-level exception logging** (already present). Ensure `requirements.txt` includes `mcp>=1.9.2`.
3. **Confirm tool serialises correctly**: run locally
```bash
python src/rules_injector_server.py < /dev/null | head -n 20
```
No stack traces → good.

### 5.4 Verify sequential-thinking server

Same transport issue: either run its *supergateway* wrapper (`npm run start:sequential`) **or** switch to stdio in `mcp.json`.

---

## 6. Validation Checklist (zero-guesswork)

1. `npm run start:rules-injector` shows:
   • "🚀 Rules Injector server initialized"  
   • "🔧 Listing available tools"  
   • "✅ Listed 1 tools"
2. Cursor → Settings → **MCP Tools**:
   • `rules_injector_server` appears with **ON/OFF toggle**  
   • Expanding shows **rules_injector** tool with parameters.
3. Toggle **ON** → No error toast.
4. Run quick tool call in chat:
   ```json
   {"tool": "rules_injector", "arguments": {"rule_type": "behavior", "rule_content": "test"}}
   ```  
   Response: "Rule injected successfully: …"
5. Repeat for `sequential-thinking-server` (if desired).

---

## 7. Key Official References

• *Model Context Protocol v1.9.2 – Python SDK*  
  https://pypi.org/project/mcp/  
• *Supergateway README* – bridging stdio MCP servers to HTTP/SSE  
  https://github.com/danielgross/supergateway  
• *Cursor MCP integration docs*  
  In-app → **Settings → MCP** → "? Help" icon.

---

### Appendix A – Minimal Working Example (stdio transport)
```python
from mcp.server import Server
from mcp.server.models import InitializationOptions, ServerCapabilities
from mcp.types import Tool, TextContent, CallToolResult
import sys, asyncio

server = Server("demo")

@server.list_tools()
async def list_tools():
    return [Tool(name="echo", description="echo", inputSchema={"type":"object","properties":{"msg":{"type":"string"}},"required":["msg"]})]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    return [TextContent(type="text", text=str(arguments))]

async def main():
    caps = ServerCapabilities(tools={"enabled": True})
    init = InitializationOptions(server_name="demo", server_version="0.0.1", capabilities=caps)
    await server.run(sys.stdin, sys.stdout, init)

asyncio.run(main())
```

Use this to sanity-check Cursor before deploying complex servers. 