# Task: Minimal MCP terminal bridge for agent CLI validation

Related requirement: `docs/current/progress.md` → Interface Delivery → "Minimal MCP terminal bridge for agent CLI validation".

Tags: `#infra`

## Checklist

- [x] Stage 1 — Blueprint the lean MCP→PTY bridge (confirm CLI entrypoint, minimal tool list, session lifecycle expectations, and evidence logging).
- [x] Stage 2 — Implement session create/destroy plus unified input tool that forwards key/text payloads and persists the latest terminal buffers (raw + ANSI-stripped).
- [x] Stage 3 — Add buffer cleaning, diff packaging, and guardrails so agents can request state snapshots without additional caching/health subsystems.
- [x] Stage 4 — Strip legacy “enterprise” MCP integrations (health monitors, caches, registry hooks) and document removed surfaces + mitigations.
- [ ] Restore the Jest harness for `tests/service-discovery/pty-mcp-server-test-harness.test.ts`, ensuring `src/mcp-channel/src/node-pty-types.ts` loads under CommonJS (2025-10-12: current run fails with `SyntaxError: Cannot use import statement outside a module`).
- [ ] Update spec/progress/task file.
- [ ] Commit with message `project: short summary` after tests.

## References

- Code: `scripts/mcp/minimal_terminal_bridge/server.py`
- Tests: Pending (smoke run planned)
- Docs: `docs/current/PTY.md`

## Notes

- Target outcome is an MCP transport that mirrors “press key → receive screen” cycles for agents, without the overbuilt tooling stack outlined in `dev/CLI/CLI-design-2.1-architecture-data-flow.md`.
- Stage 4 must catalogue every removed integration surface (health checks, caching layers, registry sync, performance monitors) so we can prevent regressions in later enterprise scopes.
- Track follow-up questions about multi-agent concurrency or security hardening separately once the minimal flow is validated.
- Stage 1 blueprint + Stage 2/3 implementation details live in `docs/current/PTY.md`; includes tooling research, CLI entrypoint, session lifecycle expectations, diff guardrails, and the Stage 2 runbook.
- Codex MCP registration guide (absolute paths, `PYTHONUNBUFFERED`, no-banner flags) documented in `docs/current/PTY.md` §10 to accelerate future recovery when Codex client setup drifts.
- Templum validation system no longer instantiates an MCP integration manager; CLI validation scenarios removed so MCP outages no longer block tests.
- 2025-10-09 sanity run (`/bin/sh` override): `.venv/bin/python` harness (create→send→get diff→destroy) confirmed buffer/diff behaviour; rerun with Templum CLI still pending.
- Stage 4 cleanup archived the enterprise MCP spec (`dev/CLI/CLI-design-2.1-architecture-data-flow.md`) and flagged the legacy analysis doc so the minimal bridge is the only active plan.
- Jest harness remains red (2025-10-12) because `src/mcp-channel/src/node-pty-types.ts` now exports as ESM while `node-pty` CJS consumers pull it via CommonJS; update the bridge to expose a CJS-compatible entry point or adjust Jest config before rerunning.
- 2025-10-14 Pattern 2 Stage 3 replan paired guardrail lane 4g with runtime lane 6f to replace MCP catch blocks with ErrorHandler usage; align bridge/server.py work with that migration and capture new evidence in `dev/architecture/evidence/` once the Jest harness is restored. TODO 2025-10-14: coordinate with Pattern 1 logger effort before swapping out `LOG.exception` handlers.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed
