import { IClaudeClient } from '../interfaces/claude-client';
import { ClaudeCodeClient } from '../../claude/client';
import { TaskContext, LLMResponse } from '../../types/workflow';
export declare class ClaudeClientAdapter implements IClaudeClient {
    private client;
    constructor(client: ClaudeCodeClient);
    sendMessage(message: string, context?: TaskContext): Promise<LLMResponse>;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=claude-client-adapter.d.ts.map