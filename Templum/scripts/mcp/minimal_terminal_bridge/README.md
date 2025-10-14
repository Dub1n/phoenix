# Templum MCP Terminal Bridge

Minimal FastMCP server that spawns the compiled Templum CLI inside a pseudo-terminal so automation agents can send key/text inputs and capture the resulting screen.

## Requirements

- Python 3.11+
- [`uv`](https://docs.astral.sh/uv/) (recommended) or `pip`
- Templum build artefacts (`npm run build` so `dist/src/cli-entry.js` exists)

## Quickstart

```bash
cd Templum/scripts/mcp/minimal_terminal_bridge
uv sync  # or pip install -e .
uv run fastmcp run server.py
```

The MCP server exposes four tools:

- `templum-cli.create_session` — spawn the CLI inside a PTY and start streaming output (use the optional `command` override for non-Templum smoke tests).
- `templum-cli.send_input` — forward key/text payloads and return the latest buffers (optional `since` diff).
- `templum-cli.get_state` — fetch the latest buffers without sending input (optional `since` diff).
- `templum-cli.destroy_session` — terminate the PTY and clean up resources.

See `docs/current/PTY.md` for the full architecture blueprint and integration notes.
