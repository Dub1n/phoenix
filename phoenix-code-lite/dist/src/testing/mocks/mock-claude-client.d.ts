import { IClaudeClient } from '../../cli/interfaces/claude-client';
import { TaskContext, LLMResponse } from '../../types/workflow';
export declare class MockClaudeClient implements IClaudeClient {
    private connected;
    private messages;
    sendMessage(message: string, context?: TaskContext): Promise<LLMResponse>;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getMessageHistory(): {
        message: string;
        context?: TaskContext;
    }[];
    clearMessageHistory(): void;
}
//# sourceMappingURL=mock-claude-client.d.ts.map