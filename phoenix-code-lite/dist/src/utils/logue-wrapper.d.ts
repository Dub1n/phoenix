/**
 * Enhanced Logue Wrapper with Proper Process Cleanup
 *
 * This wrapper extends the logue library to provide proper cleanup
 * of child processes and stdio handles, preventing Jest hang issues.
 */
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