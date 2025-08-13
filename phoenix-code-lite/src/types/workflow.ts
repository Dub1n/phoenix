/**---
 * title: [Workflow Schemas & Types - TDD Contracts]
 * tags: [Types, Workflow, TDD, Zod]
 * provides: [TaskContextSchema, LLMResponseSchema, CommandResultSchema, PhaseResultSchema, WorkflowResultSchema, SessionStateSchema]
 * requires: [zod]
 * description: [Defines core schemas and types for the Phoenix Code Lite TDD workflow, including context, results, and session state.]
 * ---*/

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

// Session management schemas
export const SessionStateSchema = z.object({
  sessionId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date().optional(),
  mode: z.enum(['standalone', 'integrated']),
  status: z.enum(['active', 'paused', 'completed', 'failed']),
  currentPhase: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
  metrics: z.object({
    commandsExecuted: z.number().default(0),
    tokensUsed: z.number().default(0),
    errorsEncountered: z.number().default(0),
    phaseTransitions: z.number().default(0)
  }).optional()
});

export const ModeConfigSchema = z.object({
  mode: z.enum(['standalone', 'integrated']),
  features: z.object({
    cliInterface: z.boolean().default(true),
    claudeCodeIntegration: z.boolean().default(false),
    auditLogging: z.boolean().default(true),
    interactiveMode: z.boolean().default(true)
  }),
  limits: z.object({
    maxConcurrentSessions: z.number().min(1).max(10).default(3),
    maxSessionDuration: z.number().min(60).default(3600), // seconds
    maxMemoryUsage: z.number().min(100).default(500) // MB
  })
});

// TypeScript types inferred from schemas
export type TaskContext = z.infer<typeof TaskContextSchema>;
export type LLMResponse = z.infer<typeof LLMResponseSchema>;
export type CommandResult = z.infer<typeof CommandResultSchema>;
export type PhaseResult = z.infer<typeof PhaseResultSchema>;
export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
export type ModeConfig = z.infer<typeof ModeConfigSchema>;
