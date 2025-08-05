import { TaskContext, LLMResponse } from '../../types/workflow';
export interface IClaudeClient {
    sendMessage(message: string, context?: TaskContext): Promise<LLMResponse>;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=claude-client.d.ts.map