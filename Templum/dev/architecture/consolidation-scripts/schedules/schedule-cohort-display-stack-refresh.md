# Consolidation Schedule (Generated)

Generated at 2025-10-13T11:57:37Z.
Patterns: 5, 6, 7.

| Pa  | Ta  | St  | De         | Ti    | Focus                                                                                 |
| --- | --- | --- | ---------- | ----- | ------------------------------------------------------------------------------------- |
|     |     |     |            |       | `{x}`                                                                                 |
| 5   | 1   | [x] | -          | --:-- | Inventory and scope alignment for Display Utils                                       |
| 5   | 2   | [x] | -          | --:-- | Test-first utility updates across Display Utils                                       |
| 5   | 3   | [x] | -          | --:-- | Migration orchestration plan for Display Utils                                        |
| 5   | 4a  | [x] | -          | --:-- | Service ordering regression harness                                                   |
| 5   | 4b  | [x] | -          | --:-- | CLI layout validation updates                                                         |
| 5   | 4c  | [x] | -          | --:-- | Formatter/window coordination                                                         |
| 5   | 5B  | [x] | -          | --:-- | Cohort gating readiness for Display Utils                                             |
| 5   | 6a  | [x] | -          | --:-- | Validate backend footprint and run consolidated backend test harness.                 |
| 5   | 6b  | [x] | 5:5B       | --:-- | Migrate service-ordering-manager to DisplayUtils orderings and refresh related tests. |
| 5   | 6c  | [x] | 6:5B, 7:5B | --:-- | Centralise interface/navigation layout logic on DisplayUtils calculator.              |
| 5   | 6d  | [x] | 6:6c       | --:-- | Audit shared utilities and documentation alignment for DisplayUtils DI seams.         |
| 5   | 7   | [x] | -          | --:-- | Final verification and wrap-up for Display Utils                                      |
| 6   | 1   | [x] | -          | --:-- | Inventory and scope alignment for Window Utils Consolidation                          |
| 6   | 2   | [x] | -          | --:-- | Test-first utility updates across Window Utils Consolidation                          |
| 6   | 3   | [x] | -          | --:-- | Migration orchestration plan for Window Utils Consolidation                           |
| 6   | 4a  | [x] | -          | --:-- | Formatter provider finalisation                                                       |
| 6   | 4b  | [x] | -          | --:-- | Test harness upgrades                                                                 |
| 6   | 4c  | [x] | -          | --:-- | Theme/Display coordination                                                            |
| 6   | 5B  | [x] | -          | --:-- | Cohort gating readiness for Window Utils Consolidation                                |
| 6   | 6a  | [x] | -          | --:-- | CLI adapter & entrypoint migration                                                    |
| 6   | 6b  | [x] | -          | --:-- | Terminal UI components & rendering                                                    |
| 6   | 6c  | [x] | -          | --:-- | Navigation & compatibility surfaces                                                   |
| 6   | 6d  | [x] | -          | --:-- | MCP channel & observability                                                           |
| 6   | 7   | [x] | -          | --:-- | Final verification and wrap-up for Window Utils Consolidation                         |
| 7   | 1   | [x] | -          | --:-- | Inventory and scope alignment for Terminal Formatter Consolidation                    |
| 7   | 2   | [x] | -          | --:-- | Test-first utility updates across Terminal Formatter Consolidation                    |
| 7   | 3   | [x] | -          | --:-- | Migration orchestration plan for Terminal Formatter Consolidation                     |
| 7   | 4a  | [x] | -          | --:-- | Formatter/provider alignment                                                          |
| 7   | 4b  | [x] | -          | --:-- | Theme/window coordination                                                             |
| 7   | 4c  | [x] | -          | --:-- | CLI regression harness                                                                |
| 7   | 5B  | [x] | -          | --:-- | Cohort gating readiness for Terminal Formatter Consolidation                          |
| 7   | 6a  | [x] | -          | --:-- | Window/layout engine migration                                                        |
| 7   | 6b  | [x] | -          | --:-- | Theme application surfaces                                                            |
| 7   | 6c  | [x] | -          | --:-- | CLI & menu components                                                                 |
| 7   | 6d  | [x] | -          | --:-- | MCP/observability windows                                                             |
| 7   | 7   | [x] | -          | --:-- | Final verification and wrap-up for Terminal Formatter Consolidation                   |
| C   | 5A  | [x] | -          | --:-- | Stage 5A alignment for Display Stack Refresh Cohort                                   |

## Notes

### Pattern 5

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Display & UI Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/display/display-utils.md
    Utility focus: (Templum/src/utils/display-utils.ts)
    Problem: Display calculations repeated in multiple places
    API intent: display.calculate().width(80).order('connected-first') - Fluent API
    Impact: ~25 files, ~400 lines reduction, consistent display standards
    Starter files:
    • src/interfaces/cli-display-consistency-engine.ts - Delegates layout + ordering to Display Utils stack (Stage 6 lane c validation 2025-10-03T19:27Z).
    • src/interfaces/service-ordering-manager.ts - Service display ordering
    • src/rendering/universal-layout-engine.ts - Layout calculations migrated to Display Utils (Stage 6 lane c validation 2025-10-03T19:27Z).
    • Display consistency patterns consolidated across CLI components per Stage 6 lane c close-out (evidence: tmp/stage6/pattern-5/\*.log).

### Pattern 6

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Display & UI Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/display/window-utils.md
    Utility focus: (Templum/src/utils/window-utils.ts)
    Problem: Border and window layout logic duplicated
    API intent: window.border('double').title('Menu').render() - Chainable window API
    Impact: ~15 files, ~300 lines reduction, consistent window management
    Starter files:
    • src/rendering/content-layout-system.ts - BorderRenderer, WindowLayout
    • src/interfaces/terminal-ui-components.ts - Window management
    • Border rendering patterns across CLI components

### Pattern 7

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Display & UI Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/display/terminal-formatter.md
    Utility focus: (Templum/src/utils/terminal-formatter.ts)
    Problem: 266 chalk calls with inconsistent color usage
    API intent: fmt.success('text').border() - Semantic formatting, auto-fallback
    Impact: ~13 files, ~200 lines reduction, consistent terminal styling
    Starter files:
    • src/cli-entry.ts (51 chalk calls)
    • src/mcp-channel/src/visual-feedback-system.ts (47 chalk calls)
    • src/interfaces/cli-adapter-abstracted.ts (44 chalk calls)
    • src/interfaces/terminal-ui-components.ts (35 chalk calls)
    • src/interfaces/interactive-menu-renderer.ts (27 chalk calls)
