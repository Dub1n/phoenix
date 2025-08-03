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