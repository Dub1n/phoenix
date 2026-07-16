---
doc-type: target-architecture
id: minimal-mcp-terminal-bridge
tags: [templum, cli, mcp, pty, automation]
status: draft
last_updated: 2026-07-16
---

# Minimal MCP Terminal Bridge — Blueprint & Stage 2 Implementation

## 0. Summary

- **Purpose:** Provide a lean, stateful MCP transport that lets agents press keys, send text, and see the resulting Templum CLI screen without the “enterprise” MCP scaffolding (health monitors, caches, registry hooks).
- **Outcome:** A FastMCP-based Python service that launches the compiled Templum CLI inside a pseudo-terminal, exposes three MCP tools (`create_session`, `send_input`, `destroy_session`), and returns both raw and ANSI-stripped buffers so agents can reason about the UI.
- **Implementation Status:** Stage 2 scaffolding lives in `scripts/mcp/minimal_terminal_bridge/server.py`; it provides the session store, PTY reader, idle reaper, and unified input tool emitting raw/clean buffers. Stage 3 adds `get_state` + diff packaging so agents can request snapshots without mutating CLI state. 2025-10-15: Added a CommonJS export shim for the mock `node-pty` module so Jest-based harnesses can require the bridge helpers without ESM loaders.
- **Interface Touchpoints:** The bridge shells out to `node dist/src/cli-entry.js` (same binary exposed by the `templum` npm bin). No changes inside Templum core—`ServiceDiscovery`, `ConnectionFactory`, and the CLI adapter operate unchanged; the bridge only orchestrates the terminal process and buffers.
- **Follow-up:** Subsequent stages (per `dev/tasks/minimal-mcp-terminal-bridge.md`) implement the tools, add buffer/diff helpers, and formally remove the legacy MCP integration plans from the documentation set.

## 1. Research Snapshot (Oct 2025)

| Project | Fit | Notes |
| --- | --- | --- |
| [`jlowin/fastmcp`](https://github.com/jlowin/fastmcp) | ⭐️ Primary choice | Actively maintained framework from Prefect; handles stdio transport, session lifecycle, and packaging; plays nicely with uv/pip. |
| [`qodo-ai/pty-mcp`](https://github.com/qodo-ai/pty-mcp) | Reference / optional dependency | Already exposes a sessioned PTY over MCP. Gives implementation ideas for stream handling; however it bundles extra tooling (history tracking, async workers) we don’t immediately need. |
| [`GongRzhe/terminal-controller-mcp`](https://github.com/GongRzhe/terminal-controller-mcp) | Reference | Focuses on secure terminal automation with rich command surface (fs ops, history). Useful for hardening ideas; overshoots our minimal scope. |
| [`modelcontextprotocol/python-sdk`](https://github.com/modelcontextprotocol/python-sdk) | Base layer | The official SDK now embeds the original FastMCP 1.x helpers. If FastMCP 2.x becomes too heavy we can drop to the SDK directly. |

> (optional) What advantage does FastMCP give us over wiring the raw MCP SDK ourselves?

## 2. Goals & Non-Goals

**Goals**

- Agent can create a named CLI session, stream keystrokes/text, and fetch the latest terminal snapshot (<150 ms round-trip target).
- Maintain raw terminal output plus an ANSI-stripped copy; optionally add lightweight diffing in Stage 3.
- Keep the bridge self-contained with minimal dependencies (`fastmcp`, `ptyprocess`, `pyte` or `ansiwrap`).
- Run entirely outside Templum’s runtime—no changes to `TemplumCore`, zero coupling to backend assumptions.

**Non-Goals**

- No multi-tenant health registry, caching layer, or metrics exporter in the minimal bridge.
- No attempt to interpret CLI state beyond buffer cleaning (advanced parsing can layer on later).
- No MCP resource/prompt surface; a single composite tool API is enough for agent automation.

## 3. Proposed Architecture

### 3.1 Component Overview

```
┌───────────────────────────────┐
│        FastMCP Server         │
│  (uv / pip install fastmcp)   │
├──────────────┬────────────────┤
│ SessionStore │ InputHandler   │
├──────────────┴────────────────┤
│           PTYSession          │
│  ├─ PtyProcess (ptyprocess)   │
│  ├─ OutputBuffer (raw, clean) │
│  └─ ScreenState (pyte, opt.)  │
└───────────────────────────────┘
             │
             ▼
┌───────────────────────────────┐
│      Templum CLI Process      │
│  node dist/src/cli-entry.js   │
│  (requires prior `npm run build`) │
└───────────────────────────────┘
```

- **FastMCP Server:** Provides the MCP transport; defined in `scripts/mcp/minimal_terminal_bridge/server.py`.
- **SessionStore:** In-memory map `{session_id → PTYSession}` with idle timeout (default 15 min). Responsible for stats, cleanup, and evidence logging (Stage 1 requirement).
- **PTYSession:** Wraps `ptyprocess.PtyProcessUnicode`, spawns the CLI with `env={"NODE_ENV": "production"}` (matches current CLI expectations), and continuously reads output onto a ring buffer.
- **OutputBuffer:** Maintains `raw` (full ANSI text) and `clean` (using `ansi_escape` regex or `pyte`) and now records bounded snapshots for diff support.
- **InputHandler:** Coalesces `send_input` payloads. Supports `{"type": "key", "sequence": "\u001b[A"}` for arrows and `{"type": "text", "value": "backends\n"}` for text entry.

### 3.2 MCP Tool Surface (Stage 2/3 status)

| Tool | Signature | Behaviour |
| --- | --- | --- |
| `templum-cli.create_session` | `(session_id: str, command?: str)` | Spawns PTY running `node dist/src/cli-entry.js`. Optional `command` lets us override for tests. Returns `{sessionId, pid, startedAt}`. |
| `templum-cli.send_input` | `(session_id: str, input: {type, payload})` | Writes either key sequences or plain text; flushes buffer; returns `{success, raw, clean, cursor}`. |
| `templum-cli.get_state` | `(session_id: str, since?: number, record?: boolean)` | Retrieves latest buffers without sending input; optional `since` field returns clean/raw diffs. |
| `templum-cli.destroy_session` | `(session_id: str)` | Terminates PTY, clears buffers, logs evidence. |

### 3.3 Lifecycle & Logging

1. **Create Session:** Validate `session_id`, ensure CLI binary exists (check `dist/src/cli-entry.js`; if missing, return actionable error instructing to run `npm run build`). On success log to `dev/tasks/minimal-mcp-terminal-bridge.md` evidence block during implementation.
2. **Steady State:** Background reader (`asyncio` task) appends to `raw_buffer` and updates `clean_buffer` on each read. Maintain `last_activity`.
3. **Snapshot Diff Guardrails:** Every snapshot optionally records into a bounded history (20 entries, 1s tolerance) so `since` diffs compare against the closest earlier timestamp. Unified diffs are truncated at 8k chars to avoid runaway payloads.
4. **Timeout:** Idle sessions closed automatically after configurable duration; notify via MCP error on next call.
5. **Destroy:** Send `SIGTERM` → fallback `SIGKILL` if needed; remove service registry artifacts created by the CLI (delegates to existing CLI teardown).

## 4. Integration Points with Templum

| Integration | Detail | Notes |
| --- | --- | --- |
| CLI binary | `node dist/src/cli-entry.js` (same path used by `npm run start:cli`) | Bridge should verify build artifacts and surface guidance if missing. |
| Working directory | Repository root (`Templum/`) | Provides access to `.templum/services` so discovery works as if user launched CLI manually. |
| Environment | `PORT=3001` etc as needed; reuse `.env` if present | Bridge does **not** inject backend knowledge; agents must still start backends per normal docs. |
| Cleanup | CLI already clears `.templum/services` entries on exit; bridge enforces `destroy_session`/timeout to avoid orphaned processes. |

No changes required in `TemplumCore` or the CLI adapter—this bridge is a sidecar process that simply hosts the CLI.

## 5. Dependency & Packaging Callouts

- **Python runtime:** Target 3.11+ (aligns with FastMCP and ptyprocess requirements).
- **Dependencies:** `fastmcp>=2.0`, `ptyprocess`, `pyte` (optional but improves clean buffer handling), `ansiwrap` or a simple regex for stripping codes.
- **Distribution:** Ship as `uv` project under `scripts/mcp/minimal-terminal-bridge/pyproject.toml`. Provide `uv run mcp --config scripts/.../bridge.json` helper.
- **Local UX:** Add `npm run mcp:templum-cli` script that calls `uv run` if uv is installed, otherwise prints instructions.

## 6. Risk & Mitigation Notes

- **TTY Layout Drift:** Without a virtual screen emulator the bridge might miss cursor positioning. Future enhancement: integrate `pyte` so `get_state` can return a reconstructed screen when diffs are insufficient.
- **Long-Running Output:** For commands that stream (e.g., service logs), ensure buffer caps (default 128 KB) with truncation notice.
- **Signal Handling:** Catch CLI exits and notify agents; do not auto-restart to avoid masking crashes.
- **Legacy MCP Artefacts:** Stage 4 removed unused enterprise MCP directions; the superseded CLI architecture is preserved at `docs/archive/cli/CLI-design-2.1-architecture-data-flow.md` to prevent accidental rescope while retaining history.

## 7. Evidence & Next Steps

- Stage 2/3 implementation delivers the server scaffolding at `scripts/mcp/minimal_terminal_bridge/server.py`; run with `uv run fastmcp run server.py` after `npm run build`. The MCP tools respond exactly as described in §3.2 (including `get_state` + diff packaging).
- Record commands and outcomes in the Stage log once initial smoke runs exist (`uv run fastmcp run server.py --check` planned).
- Stage 4 complete — removal list and doc updates captured in §9; future work focuses on smoke evidence + automated validation.

## 8. Stage 2 Runbook (current)

1. `npm run build` in `Templum/` to ensure `dist/src/cli-entry.js` exists.
2. `cd scripts/mcp/minimal_terminal_bridge && uv sync` (or `pip install -e .`) to pull FastMCP + PTY dependencies.
3. Launch the server: `uv run fastmcp run server.py`.
4. From an MCP client (or helper script), call:
   - `templum-cli.create_session` with a unique `session_id`. Pass `command` to override the default CLI while the Templum build is unavailable (e.g., `/bin/sh`).
   - `templum-cli.send_input` with `{ "type": "text", "value": "help\n" }` or `{ "type": "key", "sequence": "\u001b[A" }`. Pass `since` from a previous response to receive unified diffs.
   - `templum-cli.get_state` to poll without new input (optional `record=false` if you do not want to add to history).
   - Observe `raw` vs `clean` buffers in the response; `alive` flag mirrors PTY liveness.
   - `templum-cli.destroy_session` when finished (sessions also auto-expire after 15 min idle).
5. File evidence in `dev/tasks/minimal-mcp-terminal-bridge.md` once the smoke run is captured (pending).

> (optional) Why do we keep both raw and clean buffers even before the diff helper exists?

## 9. Stage 4 Cleanup (completed)

- Removed the enterprise MCP architecture direction from the active CLI design set. The historical document now lives at `docs/archive/cli/CLI-design-2.1-architecture-data-flow.md`; current direction points directly to this blueprint.
- Added a historical disclaimer to `dev/auto/agent-cli-interaction-analysis.md` so future work recognises the minimal bridge as the active solution.
- Confirmed no runtime dependencies remain on the deprecated health/caching scaffolding; the bridge relies solely on FastMCP + PTY helpers.
- Captured a sanity run using `/bin/sh`: `.venv/bin/python` harness (`create_session` → `send_input` "echo hello" → `get_state` diff → `destroy_session`) verifying raw/clean buffer updates and diff packaging.
- Verified Jest harness compatibility via `npm test -- --runTestsByPath src/mcp-channel/src/__tests__/node-pty-types.cjs.test.ts tests/service-discovery/pty-mcp-server-test-harness.test.ts`, ensuring the CommonJS shim prevents the prior import error.
- Removed the in-repo MCP integration surface (`MCPIntegrationManager`, CLI validation component, templum config fields) so the bridge is purely a developer tool; validation now skips MCP scenarios by default.
- Next validation step: rerun the same cycle with the built Templum CLI once it boots reliably and log evidence in the task file before closing the task.

## 10. Codex MCP Registration Notes

The Codex CLI expects MCP servers to emit machine-friendly stdio (no banners, flush output). If it hangs on “request timed out”, confirm:

- **Use the bridge venv binary** so dependencies resolve without sourcing another shell:
  ```bash
  /home/gabri/dev/VDL_VAULT/Templum/scripts/mcp/minimal_terminal_bridge/.venv/bin/fastmcp \
    run /home/gabri/dev/VDL_VAULT/Templum/scripts/mcp/minimal_terminal_bridge/server.py \
    --no-banner --log-level WARNING
  ```
- **Register with Codex via absolute paths** so the launcher works regardless of working directory:
  ```bash
  codex mcp add --env PYTHONUNBUFFERED=1 \
    templum-bridge \
    /home/gabri/dev/VDL_VAULT/Templum/scripts/mcp/minimal_terminal_bridge/.venv/bin/fastmcp \
    run /home/gabri/dev/VDL_VAULT/Templum/scripts/mcp/minimal_terminal_bridge/server.py \
    --no-banner --log-level WARNING
  ```
  `codex mcp get templum-bridge` should reflect the full path and `PYTHONUNBUFFERED=1`.
- **Sanity test via the MCP tool** (after restarting Codex) by creating a `/bin/sh` session:
  ```json
  templum-bridge.create_session { "session_id": "mcp-smoke", "command": "/bin/sh" }
  templum-bridge.send_input { "session_id": "mcp-smoke", "input": { "type": "text", "value": "echo hello\n" } }
  templum-bridge.get_state { "session_id": "mcp-smoke", "since": <timestamp from send_input> }
  templum-bridge.destroy_session { "session_id": "mcp-smoke" }
  ```
- If Codex still times out, compare with the known-good Stelae config (`codex mcp get stelae`)—ensure no banner/noise is printed and that the command path points at an executable binary.
