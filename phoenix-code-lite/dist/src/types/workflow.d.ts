/**---
 * title: [Workflow Schemas & Types - TDD Contracts]
 * tags: [Types, Workflow, TDD, Zod]
 * provides: [TaskContextSchema, LLMResponseSchema, CommandResultSchema, PhaseResultSchema, WorkflowResultSchema, SessionStateSchema]
 * requires: [zod]
 * description: [Defines core schemas and types for the Phoenix Code Lite TDD workflow, including context, results, and session state.]
 * ---*/
import { z } from 'zod';
export declare const TaskContextSchema: z.ZodObject<{
    taskDescription: z.ZodString;
    projectPath: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
    maxTurns: z.ZodDefault<z.ZodNumber>;
    systemPrompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const LLMResponseSchema: z.ZodObject<{
    content: z.ZodString;
    usage: z.ZodOptional<z.ZodObject<{
        inputTokens: z.ZodNumber;
        outputTokens: z.ZodNumber;
    }, z.core.$strip>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const CommandResultSchema: z.ZodObject<{
    stdout: z.ZodString;
    stderr: z.ZodString;
    exitCode: z.ZodNumber;
    duration: z.ZodNumber;
}, z.core.$strip>;
export declare const PhaseResultSchema: z.ZodObject<{
    name: z.ZodString;
    startTime: z.ZodDate;
    endTime: z.ZodOptional<z.ZodDate>;
    success: z.ZodBoolean;
    output: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    artifacts: z.ZodArray<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const WorkflowResultSchema: z.ZodObject<{
    taskDescription: z.ZodString;
    startTime: z.ZodDate;
    endTime: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
    phases: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        startTime: z.ZodDate;
        endTime: z.ZodOptional<z.ZodDate>;
        success: z.ZodBoolean;
        output: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
        artifacts: z.ZodArray<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>>;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    artifacts: z.ZodArray<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const SessionStateSchema: z.ZodObject<{
    sessionId: z.ZodString;
    startTime: z.ZodDate;
    endTime: z.ZodOptional<z.ZodDate>;
    mode: z.ZodEnum<{
        standalone: "standalone";
        integrated: "integrated";
    }>;
    status: z.ZodEnum<{
        active: "active";
        paused: "paused";
        completed: "completed";
        failed: "failed";
    }>;
    currentPhase: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metrics: z.ZodOptional<z.ZodObject<{
        commandsExecuted: z.ZodDefault<z.ZodNumber>;
        tokensUsed: z.ZodDefault<z.ZodNumber>;
        errorsEncountered: z.ZodDefault<z.ZodNumber>;
        phaseTransitions: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ModeConfigSchema: z.ZodObject<{
    mode: z.ZodEnum<{
        standalone: "standalone";
        integrated: "integrated";
    }>;
    features: z.ZodObject<{
        cliInterface: z.ZodDefault<z.ZodBoolean>;
        claudeCodeIntegration: z.ZodDefault<z.ZodBoolean>;
        auditLogging: z.ZodDefault<z.ZodBoolean>;
        interactiveMode: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
    limits: z.ZodObject<{
        maxConcurrentSessions: z.ZodDefault<z.ZodNumber>;
        maxSessionDuration: z.ZodDefault<z.ZodNumber>;
        maxMemoryUsage: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type TaskContext = z.infer<typeof TaskContextSchema>;
export type LLMResponse = z.infer<typeof LLMResponseSchema>;
export type CommandResult = z.infer<typeof CommandResultSchema>;
export type PhaseResult = z.infer<typeof PhaseResultSchema>;
export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
export type ModeConfig = z.infer<typeof ModeConfigSchema>;
//# sourceMappingURL=workflow.d.ts.map