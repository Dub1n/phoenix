/**---
 * title: [Unified CLI Entry - Core Infrastructure Component]
 * tags: [Core, Infrastructure, Entry-Point, CLI]
 * provides: [initializeUnifiedPhoenixCLI Function, runUnifiedCLI Function]
 * requires: [MenuRegistry, UnifiedCommandRegistry, UnifiedSessionManager, UserSettingsManager, chalk]
 * description: [Main entry point for the unified CLI architecture, wiring menus, commands and session management with persisted user settings]
 * ---*/
/**
 * Initialize and start the unified Phoenix Code Lite CLI
 */
export declare function initializeUnifiedPhoenixCLI(): Promise<void>;
/**
 * CLI entry point - uses settings for mode selection
 */
export declare function runUnifiedCLI(): Promise<void>;
//# sourceMappingURL=unified-cli.d.ts.map