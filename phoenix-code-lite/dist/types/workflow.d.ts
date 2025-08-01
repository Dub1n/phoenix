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
export type TaskContext = z.infer<typeof TaskContextSchema>;
export type LLMResponse = z.infer<typeof LLMResponseSchema>;
export type CommandResult = z.infer<typeof CommandResultSchema>;
export type PhaseResult = z.infer<typeof PhaseResultSchema>;
export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;
//# sourceMappingURL=workflow.d.ts.map