/**---
 * title: [E2E Runner - End-to-End Workflow Testing]
 * tags: [Testing, E2E]
 * provides: [PhoenixCodeLiteE2E Class, End-to-End Harness]
 * requires: [jest]
 * description: [End-to-end test runner for executing Phoenix Code Lite workflows and validating outputs.]
 * ---*/
export interface E2EWorkflowOptions {
    task: string;
    framework?: string;
    language?: string;
    maxAttempts?: number;
    expectFiles?: string[];
    expectTests?: boolean;
    expectDocumentation?: boolean;
    expectRetries?: boolean;
    useExistingConfig?: boolean;
}
export interface E2EWorkflowResult {
    success: boolean;
    duration: number;
    filesGenerated: string[];
    testsPass: boolean;
    qualityScore: number;
    retryCount: number;
    error?: string;
}
export declare class PhoenixCodeLiteE2E {
    private projectPath;
    constructor(projectPath: string);
    runWorkflow(options: E2EWorkflowOptions): Promise<E2EWorkflowResult>;
    runConfigurationWorkflow(template: string): Promise<{
        configCreated: boolean;
        configValid: boolean;
    }>;
    private executeCommand;
    private analyzeWorkflowResults;
    private validateConfigurationStructure;
}
//# sourceMappingURL=e2e-runner.d.ts.map