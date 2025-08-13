/**---
 * title: [Claude Client Interface - LLM Integration Contract]
 * tags: [CLI, Interface, Types]
 * provides: [IClaudeClient Interface]
 * requires: [TaskContext, LLMResponse]
 * description: [Defines the contract for Claude client interactions used by CLI and TDD components.]
 * ---*/
import { TaskContext, LLMResponse } from '../../types/workflow';
export interface IClaudeClient {
    sendMessage(message: string, context?: TaskContext): Promise<LLMResponse>;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=claude-client.d.ts.map