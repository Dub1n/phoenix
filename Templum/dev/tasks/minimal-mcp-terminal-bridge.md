# Task: Minimal MCP terminal bridge for agent CLI validation

Related requirement: `docs/current/progress.md` → Interface Delivery → "Minimal MCP terminal bridge for agent CLI validation".

Tags: `#infra`

## Checklist

- [x] Stage 1 — Blueprint the lean MCP→PTY bridge (confirm CLI entrypoint, minimal tool list, session lifecycle expectations, and evidence logging).
- [x] Stage 2 — Implement session create/destroy plus unified input tool that forwards key/text payloads and persists the latest terminal buffers (raw + ANSI-stripped).
- [x] Stage 3 — Add buffer cleaning, diff packaging, and guardrails so agents can request state snapshots without additional caching/health subsystems.
- [x] Stage 4 — Strip legacy “enterprise” MCP integrations (health monitors, caches, registry hooks) and document removed surfaces + mitigations.
- [x] Restore the Jest harness for `tests/service-discovery/pty-mcp-server-test-harness.test.ts`, ensuring `src/mcp-channel/src/node-pty-types.ts` loads under CommonJS (2025-10-12: current run fails with `SyntaxError: Cannot use import statement outside a module`).
- [x] Update spec/progress/task file.
- [ ] Commit with message `project: short summary` after tests.

## References

- Code: `scripts/mcp/minimal_terminal_bridge/server.py`
- Tests: Pending (smoke run planned)
- Docs: `docs/current/PTY.md`

## Notes

- Target outcome is an MCP transport that mirrors “press key → receive screen” cycles for agents, without the overbuilt tooling stack preserved in `docs/archive/cli/CLI-design-2.1-architecture-data-flow.md`.
- Stage 4 must catalogue every removed integration surface (health checks, caching layers, registry sync, performance monitors) so we can prevent regressions in later enterprise scopes.
- Track follow-up questions about multi-agent concurrency or security hardening separately once the minimal flow is validated.
- Stage 1 blueprint + Stage 2/3 implementation details live in `docs/current/PTY.md`; includes tooling research, CLI entrypoint, session lifecycle expectations, diff guardrails, and the Stage 2 runbook.
- Codex MCP registration guide (absolute paths, `PYTHONUNBUFFERED`, no-banner flags) documented in `docs/current/PTY.md` §10 to accelerate future recovery when Codex client setup drifts.
- Templum validation system no longer instantiates an MCP integration manager; CLI validation scenarios removed so MCP outages no longer block tests.
- 2025-10-09 sanity run (`/bin/sh` override): `.venv/bin/python` harness (create→send→get diff→destroy) confirmed buffer/diff behaviour; rerun with Templum CLI still pending.
- Stage 4 cleanup removed the enterprise MCP direction; the superseded spec is now preserved at `docs/archive/cli/CLI-design-2.1-architecture-data-flow.md`, leaving the minimal bridge as the only active MCP terminal plan.
- 2025-10-15: Added explicit CommonJS export bridging in `src/mcp-channel/src/node-pty-types.ts` alongside a regression test (`src/mcp-channel/src/__tests__/node-pty-types.cjs.test.ts`). `npm test -- --runTestsByPath src/mcp-channel/src/__tests__/node-pty-types.cjs.test.ts tests/service-discovery/pty-mcp-server-test-harness.test.ts` now executes without the prior `SyntaxError`, with global coverage thresholds still tracked for the full suite.
- 2025-10-14 Pattern 2 Stage 3 replan paired guardrail lane 4g with runtime lane 6f to replace MCP catch blocks with ErrorHandler usage; align bridge/server.py work with that migration and capture new evidence in `dev/architecture/evidence/` once the Jest harness is restored. TODO 2025-10-14: coordinate with Pattern 1 logger effort before swapping out `LOG.exception` handlers.
- 2025-10-24: Pattern 1 Stage 7 validation (`dev/architecture/logs/pattern-1-stage7-jest-ci-20251024T222520Z.log`, `dev/architecture/logs/pattern-1-stage7-phase6-health-20251024T222834Z.log`, `dev/architecture/logs/pattern-1-stage7-phase6-validation-20251024T222848Z.log`, sweep `dev/architecture/logs/pattern-1-stage7-sweep-20251024T224015Z.log`) confirmed the MCP harness + CLI adapters are free of raw console usage; the minimal bridge can now depend on `createLogger` outputs instead of temporary console scaffolding when we wire the server processes.

## Checklist (Copy into PR or issue if needed)

- [x] Code/tests updated
- [x] Docs updated
- [x] Progress tracker updated
- [x] Task log updated
- [ ] Checklist completed
