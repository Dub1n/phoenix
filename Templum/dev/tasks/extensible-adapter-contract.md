# Task: Extensible adapter contract exercised beyond CLI/VSCode

## Requirement Summary

- Status: [ ]
- Requirement text: "Extensible adapter contract exercised beyond CLI/VSCode."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Add regression-first coverage proving the adapter contract extends past CLI/VSCode: introduce `tests/interfaces/mcp-adapter-contract.test.ts` (or extend `tests/interfaces/interface-adapter-integration.test.ts`) to register a `'mcp'` adapter through `TemplumAdapterRegistry`, assert `TemplumCore.getSupportedInterfaces()` reports it, and exercise skin application, state sync, and command execution using a mocked `EnhancedMCPIntegration`/`CLIMCPServer` so zero-knowledge routing is preserved.
- [ ] Expand interface typing and factories: update `src/types/universal-skin-definition.ts` (`InterfaceType` union), `src/interfaces/templum-orchestrator-interface.ts`, `src/interfaces/interface-adapter-registry.ts`, and `src/core/templum-core.ts` so `'mcp'` is a first-class interface, adjusting `TemplumAdapterRegistry` configuration and status snapshots to expose the new adapter without breaking existing CLI/VSCode/command wiring.
- [ ] Implement an `MCPInterfaceAdapter` in `src/interfaces/mcp-adapter-abstracted.ts` that satisfies `IInterfaceAdapter`, orchestrates command/session flows via `src/mcp-channel/src/enhanced-mcp-integration.ts`, emits sanitized telemetry, and enforces the same dependency-inversion patterns as the existing adapters.
- [ ] Wire orchestrator/session plumbing: ensure `UniversalInterfaceManager`, `SessionContextFoundation`, and `EnhancedStateManager` propagate state updates to the MCP adapter, and verify the shared session continues to synchronise CLI/VSCode/command/MCP state in the new tests before refactoring production code.
- [ ] Surface MCP capabilities to operators: extend `src/commands/universal-command-registry.ts` and `src/observability/observability-adapter.ts` so MCP interactions are auditable, update adapter factory registration defaults, and refresh CLI/VSCode command palettes or status panes to expose the new interface hook without leaking backend details.
- [ ] Update documentation and task tracking once the adapter passes tests—capture the new interface path in `docs/current/architecture-spec.md` (Interface Delivery section) and add Validation/System usage notes if the MCP bridge introduces new health commands.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests to run: `npm test -- tests/interfaces/mcp-adapter-contract.test.ts tests/interfaces/interface-adapter-integration.test.ts`, `npm run test:coverage`.
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-services` if the MCP bridge touches backend orchestration.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md` (Interface Delivery), `docs/current/1.2-Backend-Integration-Guide.md` if MCP onboarding requires runtime steps.

> Scope: **Post-MVP** — focus MVP on CLI and VSCode adapters; broader adapter contract extensions can follow once the core interfaces are stable.

## References

- Progress entry: `docs/current/progress.md:27`
- Architecture spec: `docs/current/architecture-spec.md:31`
- Code: `src/core/templum-core.ts`, `src/interfaces/interface-adapter-registry.ts`, `src/interfaces/command-adapter-abstracted.ts`, `src/interfaces/templum-orchestrator-interface.ts`, `src/mcp-channel/src/enhanced-mcp-integration.ts`
- Tests: `tests/interfaces/interface-adapter-integration.test.ts`

## Current Assessment (2025-10-05)

- Implementation: MCP compatibility scaffolding exists for CLI preservation, but `TemplumAdapterRegistry` only registers CLI/VSCode/command adapters and exposes no mechanism to add a third runtime interface.
- Tests: No adapter contract suites exercise alternate interface types; interface integration tests continue to focus on CLI and VSCode.
- Follow-up: implement registry support for additional adapters (e.g. MCP), add contract tests, and reflect the change in orchestrator/session wiring before marking this task progressed.
