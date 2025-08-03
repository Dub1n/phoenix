"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeCodeClient = void 0;
const workflow_1 = require("../types/workflow");
const zod_1 = require("zod");
class ClaudeCodeClient {
    constructor(_options) {
        // Initialize Claude Code SDK when available
        // For now, create placeholder that throws descriptive errors
        this.claude = {
            query: async () => {
                throw new Error('Claude Code SDK integration pending - Phase 2 implementation in progress');
            },
            executeCommand: async () => {
                throw new Error('Claude Code SDK integration pending - Phase 2 implementation in progress');
            },
            editFile: async () => {
                throw new Error('Claude Code SDK integration pending - Phase 2 implementation in progress');
            }
        };
    }
    async query(prompt, context, persona) {
        try {
            // Validate input context if provided
            if (context) {
                const validatedContext = workflow_1.TaskContextSchema.parse(context);
                context = validatedContext;
            }
            // Build system prompt with persona if provided
            let systemPrompt = context?.systemPrompt;
            if (persona) {
                systemPrompt = persona.systemPrompt || `You are a ${persona.role} with expertise in: ${persona.expertise.join(', ')}.`;
            }
            const response = await this.claude.query(prompt, {
                maxTurns: context?.maxTurns || 3,
                systemPrompt,
            });
            // Validate and return response
            const validatedResponse = workflow_1.LLMResponseSchema.parse({
                content: response.content || '',
                usage: response.usage,
                metadata: response.metadata,
            });
            return validatedResponse;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new Error(`Validation error: ${error.issues.map((e) => e.message).join(', ')}`);
            }
            throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async executeCommand(command) {
        try {
            const result = await this.claude.executeCommand(command);
            // Validate command result
            return workflow_1.CommandResultSchema.parse({
                stdout: result.stdout || '',
                stderr: result.stderr || '',
                exitCode: result.exitCode || 0,
                duration: result.duration || 0,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new Error(`Command result validation error: ${error.issues.map((e) => e.message).join(', ')}`);
            }
            throw new Error(`Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async editFile(filePath, content) {
        // Input validation
        if (!filePath || filePath.trim().length === 0) {
            throw new Error('File path is required');
        }
        if (typeof content !== 'string') {
            throw new Error('File content must be a string');
        }
        // Use Claude Code's file editing capabilities  
        await this.claude.editFile(filePath, content);
    }
    // Enhanced validation method
    async validateWorkflowContext(context) {
        const errors = [];
        try {
            workflow_1.TaskContextSchema.parse(context);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                errors.push(...error.issues.map((e) => `${e.path.join('.')}: ${e.message}`));
            }
        }
        return errors;
    }
}
exports.ClaudeCodeClient = ClaudeCodeClient;
//# sourceMappingURL=client.js.map