/**---
 * title: [CLI Commands Hub - CLI Interface Module]
 * tags: [CLI, Interface, Command-Processing, Orchestration]
 * provides: [generateCommand, initCommand, configCommand, templateCommand, Support Utilities]
 * requires: [ClaudeCodeClient, TDDOrchestrator, PhoenixCodeLiteConfig, ConfigurationTemplates, InteractivePrompts, ConfigFormatter]
 * description: [Implements Phoenix Code Lite CLI command handlers bridging CLI parsing to TDD workflow, configuration management, and interactive operations.]
 * ---*/
import { PhoenixCodeLiteOptions } from './args';
export declare function generateCommand(options: PhoenixCodeLiteOptions): Promise<void>;
export declare function initCommand(options: any): Promise<void>;
export declare function configCommand(options: any): Promise<void>;
export declare function templateCommand(options: any): Promise<void>;
//# sourceMappingURL=commands.d.ts.map