import { Command } from 'commander';
export interface PhoenixCodeLiteOptions {
    task: string;
    projectPath?: string;
    language?: string;
    framework?: string;
    verbose?: boolean;
    skipDocs?: boolean;
    maxAttempts?: number;
}
export declare function setupCLI(): Command;
//# sourceMappingURL=args.d.ts.map