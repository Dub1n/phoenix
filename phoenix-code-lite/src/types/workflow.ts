import { z } from 'zod';

// Core workflow schemas with comprehensive validation
export const TaskContextSchema = z.object({
  taskDescription: z.string()
    .min(10, 'Task description must be at least 10 characters')
    .max(1000, 'Task description too long'),
  projectPath: z.string().min(1, 'Project path is required'),
  language: z.string().optional(),
  framework: z.string().optional(),
  maxTurns: z.number().min(1).max(10).default(3),
  systemPrompt: z.string().optional(),
});

export const LLMResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const CommandResultSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
  duration: z.number(),
});

export const PhaseResultSchema = z.object({
  name: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  success: z.boolean(),
  output: z.string().optional(),
  error: z.string().optional(),
  artifacts: z.array(z.string()),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const WorkflowResultSchema = z.object({
  taskDescription: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  phases: z.array(PhaseResultSchema),
  success: z.boolean(),
  error: z.string().optional(),
  artifacts: z.array(z.string()),
  metadata: z.record(z.string(), z.any()).optional(),
});

// TypeScript types inferred from schemas
export type TaskContext = z.infer<typeof TaskContextSchema>;
export type LLMResponse = z.infer<typeof LLMResponseSchema>;
export type CommandResult = z.infer<typeof CommandResultSchema>;
export type PhaseResult = z.infer<typeof PhaseResultSchema>;
export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;