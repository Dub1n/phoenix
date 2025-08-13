/**---
 * title: [Mock Claude Client - Testing Double]
 * tags: [Testing, Mocks]
 * provides: [Mock Claude Client]
 * requires: []
 * description: [Mock implementation of Claude client for deterministic testing.]
 * ---*/
export type ResponseMode = 'success' | 'failure' | 'intermittent-failure' | 'slow';
export declare class MockClaudeServer {
    private server;
    private port;
    private responseMode;
    private requestCount;
    start(): Promise<void>;
    stop(): Promise<void>;
    setResponseMode(mode: ResponseMode): void;
    private handleRequest;
    private sendSuccessResponse;
    private sendFailureResponse;
    private generateMockCode;
}
//# sourceMappingURL=mock-claude.d.ts.map