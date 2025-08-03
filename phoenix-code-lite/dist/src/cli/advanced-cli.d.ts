import { WorkflowResult } from '../types/workflow';
export interface CommandHistoryEntry {
    command: string;
    options: any;
    timestamp: Date;
    success: boolean;
    duration: number;
}
export declare class AdvancedCLI {
    private basePath;
    private historyPath;
    private helpSystem;
    private prompts;
    constructor(basePath?: string);
    recordCommand(command: string, options: any, success?: boolean, duration?: number): Promise<void>;
    getCommandHistory(): Promise<CommandHistoryEntry[]>;
    getCompletionSuggestions(partial: string): string[];
    generateWorkflowReport(result: WorkflowResult): Promise<string>;
    exportReport(result: WorkflowResult, format: 'json' | 'csv' | 'html', outputPath: string): Promise<void>;
    displayHistory(limit?: number): Promise<void>;
    getContextualHelp(): Promise<string>;
    private convertToCSV;
    private convertToHTML;
}
//# sourceMappingURL=advanced-cli.d.ts.map