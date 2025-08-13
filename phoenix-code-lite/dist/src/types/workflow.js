"use strict";
/**---
 * title: [Workflow Schemas & Types - TDD Contracts]
 * tags: [Types, Workflow, TDD, Zod]
 * provides: [TaskContextSchema, LLMResponseSchema, CommandResultSchema, PhaseResultSchema, WorkflowResultSchema, SessionStateSchema]
 * requires: [zod]
 * description: [Defines core schemas and types for the Phoenix Code Lite TDD workflow, including context, results, and session state.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeConfigSchema = exports.SessionStateSchema = exports.WorkflowResultSchema = exports.PhaseResultSchema = exports.CommandResultSchema = exports.LLMResponseSchema = exports.TaskContextSchema = void 0;
const zod_1 = require("zod");
// Core workflow schemas with comprehensive validation
exports.TaskContextSchema = zod_1.z.object({
    taskDescription: zod_1.z.string()
        .min(10, 'Task description must be at least 10 characters')
        .max(1000, 'Task description too long'),
    projectPath: zod_1.z.string().min(1, 'Project path is required'),
    language: zod_1.z.string().optional(),
    framework: zod_1.z.string().optional(),
    maxTurns: zod_1.z.number().min(1).max(10).default(3),
    systemPrompt: zod_1.z.string().optional(),
});
exports.LLMResponseSchema = zod_1.z.object({
    content: zod_1.z.string(),
    usage: zod_1.z.object({
        inputTokens: zod_1.z.number(),
        outputTokens: zod_1.z.number(),
    }).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.CommandResultSchema = zod_1.z.object({
    stdout: zod_1.z.string(),
    stderr: zod_1.z.string(),
    exitCode: zod_1.z.number(),
    duration: zod_1.z.number(),
});
exports.PhaseResultSchema = zod_1.z.object({
    name: zod_1.z.string(),
    startTime: zod_1.z.date(),
    endTime: zod_1.z.date().optional(),
    success: zod_1.z.boolean(),
    output: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
    artifacts: zod_1.z.array(zod_1.z.string()),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.WorkflowResultSchema = zod_1.z.object({
    taskDescription: zod_1.z.string(),
    startTime: zod_1.z.date(),
    endTime: zod_1.z.date().optional(),
    duration: zod_1.z.number().optional(),
    phases: zod_1.z.array(exports.PhaseResultSchema),
    success: zod_1.z.boolean(),
    error: zod_1.z.string().optional(),
    artifacts: zod_1.z.array(zod_1.z.string()),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
// Session management schemas
exports.SessionStateSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    startTime: zod_1.z.date(),
    endTime: zod_1.z.date().optional(),
    mode: zod_1.z.enum(['standalone', 'integrated']),
    status: zod_1.z.enum(['active', 'paused', 'completed', 'failed']),
    currentPhase: zod_1.z.string().optional(),
    context: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    metrics: zod_1.z.object({
        commandsExecuted: zod_1.z.number().default(0),
        tokensUsed: zod_1.z.number().default(0),
        errorsEncountered: zod_1.z.number().default(0),
        phaseTransitions: zod_1.z.number().default(0)
    }).optional()
});
exports.ModeConfigSchema = zod_1.z.object({
    mode: zod_1.z.enum(['standalone', 'integrated']),
    features: zod_1.z.object({
        cliInterface: zod_1.z.boolean().default(true),
        claudeCodeIntegration: zod_1.z.boolean().default(false),
        auditLogging: zod_1.z.boolean().default(true),
        interactiveMode: zod_1.z.boolean().default(true)
    }),
    limits: zod_1.z.object({
        maxConcurrentSessions: zod_1.z.number().min(1).max(10).default(3),
        maxSessionDuration: zod_1.z.number().min(60).default(3600), // seconds
        maxMemoryUsage: zod_1.z.number().min(100).default(500) // MB
    })
});
//# sourceMappingURL=workflow.js.map