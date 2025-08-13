/**---
 * title: [Claude Code Client - LLM Integration Service]
 * tags: [Claude, Service, Integration]
 * provides: [ClaudeCodeClient Class, query, executeCommand]
 * requires: [@anthropic-ai/claude-code, zod]
 * description: [Wrapper around Claude Code SDK for querying and command execution with validation and error handling.]
 * ---*/
import { TaskContext, LLMResponse, CommandResult } from '../types/workflow';
import { AgentPersona } from '../types/agents';
interface ClaudeCodeOptions {
    apiKey?: string;
    baseURL?: string;
}
export declare class ClaudeCodeClient {
    private claude;
    constructor(_options?: ClaudeCodeOptions);
    query(prompt: string, context?: TaskContext, persona?: AgentPersona): Promise<LLMResponse>;
    executeCommand(command: string): Promise<CommandResult>;
    editFile(filePath: string, content: string): Promise<void>;
    validateWorkflowContext(context: TaskContext): Promise<string[]>;
}
export {};
//# sourceMappingURL=client.d.ts.map