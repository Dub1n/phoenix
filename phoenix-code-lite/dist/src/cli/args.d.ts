/**---
 * title: [CLI Argument Parser - CLI Interface Module]
 * tags: [CLI, Interface, Command-Processing, TypeScript]
 * provides: [setupCLI Function, PhoenixCodeLiteOptions Type, Command Definitions]
 * requires: [commander, fs, path, Commands Hub]
 * description: [Defines Phoenix Code Lite command-line interface with commands (generate, init, wizard, config, template) and options parsing using Commander.]
 * ---*/
import { Command } from 'commander';
export interface PhoenixCodeLiteOptions {
    task: string;
    projectPath?: string;
    language?: string;
    framework?: string;
    verbose?: boolean;
    skipDocs?: boolean;
    maxAttempts?: number;
    withTests?: boolean;
    type?: 'component' | 'api' | 'service' | 'feature';
}
export declare function setupCLI(): Command;
//# sourceMappingURL=args.d.ts.map