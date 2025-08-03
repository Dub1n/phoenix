export interface CommandExample {
    description: string;
    command: string;
    explanation?: string;
}
export declare class HelpSystem {
    private examples;
    constructor();
    getContextualHelp(projectPath?: string): Promise<string>;
    getCommandExamples(command: string): CommandExample[];
    generateQuickReference(): string;
    private analyzeProjectContext;
    private getBaseHelp;
    private getConfigFoundHelp;
    private getNoConfigHelp;
    private getAuditLogsHelp;
    private getLanguageSpecificHelp;
    private initializeExamples;
}
//# sourceMappingURL=help-system.d.ts.map