"use strict";
/**---
 * title: [TDD Prompts - Phase-Specific Prompt Builders]
 * tags: [Claude, Prompts, TDD]
 * provides: [TDDPrompts, Planning Prompt, Implementation Prompt, Refactor Prompt]
 * requires: []
 * description: [Centralized prompt templates for planning, implementation, and refactoring phases used by the TDD orchestrator.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDDPrompts = void 0;
const agents_1 = require("../types/agents");
class TDDPrompts {
    static buildContextualPrompt(persona, task, context, additionalContext) {
        const baseContext = `
You are a ${persona.role} with deep expertise in: ${persona.expertise.join(', ')}.

Your approach: ${persona.approach}
Your quality standards: ${persona.quality_standards.join(', ')}
Expected output: ${persona.output_format}

Task: ${task}

Context:
- Language: ${context.language || 'auto-detect'}
- Framework: ${context.framework || 'auto-detect'}  
- Project Path: ${context.projectPath}
${additionalContext ? `\nAdditional Context:\n${additionalContext}` : ''}

Please provide your expert analysis and implementation following your specialized approach and quality standards.
    `.trim();
        return baseContext;
    }
    static planAndTestPrompt(taskDescription, context) {
        const persona = agents_1.SpecializedAgentContexts.PLANNING_ANALYST;
        const specificGuidelines = `
Please provide:
1. **Implementation Plan**: A clear, step-by-step plan with risk analysis
2. **Test Suite**: Comprehensive tests covering:
   - Happy path scenarios with clear success criteria
   - Edge cases and boundary conditions
   - Error conditions and failure modes
   - Integration points and dependencies
   - Performance considerations
3. **Success Criteria**: Measurable completion criteria
4. **Risk Assessment**: Potential issues and mitigation strategies

Use your file editing capabilities to create the test files.
Focus on failing tests first, then outline the implementation needed.
Ensure comprehensive coverage and clear acceptance criteria for each test.
    `;
        return this.buildContextualPrompt(persona, taskDescription, context, specificGuidelines);
    }
    static implementationPrompt(planContext, testResults, context) {
        const persona = agents_1.SpecializedAgentContexts.IMPLEMENTATION_ENGINEER;
        const specificGuidelines = `
Based on the following plan and test failures:

Plan Context:
${planContext}

Test Results:
${testResults}

Write the minimal, clean implementation to make all tests pass.
Use your file editing capabilities to create/modify the implementation files.

Implementation Guidelines:
- Write only the code needed to pass tests (no over-engineering)
- Follow established project patterns and conventions
- Include proper error handling and input validation
- Maintain clean, readable code structure
- Add clear, concise comments for complex logic
- Ensure code is maintainable and follows best practices
    `;
        return this.buildContextualPrompt(persona, 'Implement code to pass tests', context, specificGuidelines);
    }
    static refactorPrompt(implementationContext, context) {
        const persona = agents_1.SpecializedAgentContexts.QUALITY_REVIEWER;
        const specificGuidelines = `
Review and improve the following implementation:

${implementationContext}

Quality Improvement Tasks:
1. **Refactor** for better readability and maintainability
2. **Document** with clear comments, docstrings, and usage examples
3. **Optimize** for performance where appropriate
4. **Validate** that all tests still pass after changes
5. **Structure** code for long-term maintainability
6. **Review** for security considerations and best practices

Use your file editing capabilities to apply improvements.
Focus on code quality, documentation, and maintainability improvements.
    `;
        return this.buildContextualPrompt(persona, 'Refactor and document code', context, specificGuidelines);
    }
    // Utility method for custom persona prompts
    static customPersonaPrompt(persona, task, context, guidelines) {
        return this.buildContextualPrompt(persona, task, context, guidelines);
    }
}
exports.TDDPrompts = TDDPrompts;
//# sourceMappingURL=prompts.js.map