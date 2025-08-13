/**---
 * title: [Enhanced Logue Wrapper - Utility Functions Module]
 * tags: [Utility, Logging, Process-Management, Testing]
 * provides: [EnhancedLogue Class, enhancedLogue Function, Process Cleanup Hooks]
 * requires: [logue Library, Node.js Child Process Streams]
 * description: [Wraps logue to add robust process and stream cleanup to prevent hanging tests and ensure safe CLI automation]
 * ---*/
interface LogueResult {
    status: string;
    stdout: string;
    line: string;
}
export declare class EnhancedLogue {
    private logueInstance;
    private childProcess;
    private cleanupHandlers;
    constructor(command: string, args?: string[]);
    private setupCleanupHandlers;
    private performCleanup;
    waitFor(matcher: string): Promise<this>;
    input(text: string): this;
    get stdout(): string;
    end(): Promise<LogueResult>;
}
/**
 * Enhanced logue function with proper cleanup
 */
export declare function enhancedLogue(command: string, args?: string[]): EnhancedLogue;
export {};
//# sourceMappingURL=logue-wrapper.d.ts.map