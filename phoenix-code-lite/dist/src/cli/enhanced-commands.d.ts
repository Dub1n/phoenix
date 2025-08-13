/**---
 * title: [Enhanced CLI Commands - Guided Workflow Orchestrations]
 * tags: [CLI, Commands, Workflow, UX]
 * provides: [enhancedGenerateCommand, wizardCommand, Template Utilities, Progress Integration]
 * requires: [AdvancedCLI, ProgressTracker, InteractivePrompts, TDDOrchestrator, ClaudeCodeClient, PhoenixCodeLiteConfig, ConfigurationTemplates, ConfigFormatter, DocumentManager]
 * description: [Implements enhanced CLI commands with progressive UX, banners, template-aware configuration, and orchestration of TDD workflows.]
 * ---*/
import { PhoenixCodeLiteOptions } from './args';
import { SessionContext } from './session';
export declare function enhancedGenerateCommand(options: PhoenixCodeLiteOptions): Promise<void>;
export declare function wizardCommand(): Promise<void>;
export declare function historyCommand(options: any): Promise<void>;
export declare function helpCommand(options: any): Promise<void>;
export declare function executeSessionAction(action: string, data: any, context: SessionContext): Promise<void>;
//# sourceMappingURL=enhanced-commands.d.ts.map