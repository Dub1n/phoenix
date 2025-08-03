import { TaskContext } from '../types/workflow';
import { AgentPersona } from '../types/agents';
export declare class TDDPrompts {
    static buildContextualPrompt(persona: AgentPersona, task: string, context: TaskContext, additionalContext?: string): string;
    static planAndTestPrompt(taskDescription: string, context: TaskContext): string;
    static implementationPrompt(planContext: string, testResults: string, context: TaskContext): string;
    static refactorPrompt(implementationContext: string, context: TaskContext): string;
    static customPersonaPrompt(persona: AgentPersona, task: string, context: TaskContext, guidelines?: string): string;
}
//# sourceMappingURL=prompts.d.ts.map