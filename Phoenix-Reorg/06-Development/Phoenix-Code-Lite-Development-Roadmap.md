# Phoenix-Code-Lite Development Roadmap: Claude Code SDK Integration

> **Ultimate objective**: Build Phoenix-Code-Lite as a specialized TDD workflow orchestrator that integrates with Claude Code SDK, providing autonomous AI-driven development through the Pragmatic TDD Loop

## ◊ Progress Overview

**Total Tasks**: 127 micro-tasks across 12 integrated phases  
**Estimated Time**: 34-44 hours for V1 + 14-22 hours for V2 advanced features  
**Complexity**: Intermediate TypeScript/Node.js + Claude Code SDK Integration + Professional Enhancements  
**Architecture**: Extension/Plugin for Claude Code ecosystem with enterprise-ready features

---

## 🏗️ Architecture Philosophy

### **Phoenix-Code-Lite vs Phoenix-Lite**

|  *Aspect*               |  *Phoenix-Lite (Original)*  |  *Phoenix-Code-Lite (New)*        |
| ----------------------- | --------------------------- | --------------------------------- |
|  **LLM Integration**    |  Direct Anthropic API       |  Claude Code SDK                  |
|  **File Operations**    |  Custom file handling       |  Claude Code built-in             |
|  **Git Integration**    |  Custom git commands        |  Claude Code native               |
|  **Command Execution**  |  Custom process spawning    |  Claude Code execution            |
|  **Development Tool**   |  Standalone Rust binary     |  Claude Code extension            |
|  **User Experience**    |  Separate CLI               |  Integrated Claude Code workflow  |
|  **Complexity**         |  156 tasks, 13 phases       |  82 tasks, 8 phases               |

### **Core Design Principles**

1. **Leverage, Don't Reinvent**: Use Claude Code's infrastructure
2. **Focus on Workflow**: Implement TDD orchestration logic only  
3. **Seamless Integration**: Feel native within Claude Code ecosystem
4. **Extension Pattern**: Plugin-like architecture for easy installation

---

## Phase 1: Environment Setup & Project Foundation

⚠ **Prerequisites**: Claude Code must be installed and working

### 1.1 Development Environment Verification

- [ ] **Verify Claude Code Installation**
  - [ ] Run `claude --version` to confirm installation
  - [ ] Test basic Claude Code functionality: `claude "hello world"`
  - [ ] Verify Claude Code can execute commands and edit files

- [ ] **Setup Development Workspace**
  - [ ] Create project directory: `mkdir phoenix-code-lite`
  - [ ] Navigate to workspace: `cd phoenix-code-lite`
  - [ ] Initialize as Claude Code project (if applicable)

### 1.2 Node.js Project Initialization

- [ ] **Create Node.js Project**
  - [ ] Run `npm init -y` to create package.json
  - [ ] Set project name to "phoenix-code-lite"
  - [ ] Set description: "TDD workflow orchestrator for Claude Code"
  - [ ] Set main entry point to "src/index.js"

- [ ] **Add Claude Code SDK Dependencies**

  ```json
  {
    "dependencies": {
      "@anthropic-ai/claude-code": "^1.0.0",
      "commander": "^9.0.0",
      "chalk": "^5.0.0",
      "ora": "^6.0.0",
      "inquirer": "^9.0.0"
    },
    "devDependencies": {
      "@types/node": "^18.0.0",
      "typescript": "^5.0.0",
      "jest": "^29.0.0",
      "eslint": "^8.0.0",
      "prettier": "^2.0.0"
    }
  }
  ```

- [ ] **Install Dependencies**
  - [ ] Run `npm install` to install all dependencies
  - [ ] Verify installation: `npx claude-code --version`

### 1.3 Project Structure Setup

- [ ] **Create Core Directory Structure**

  ```text
  phoenix-code-lite/
  ├── package.json
  ├── tsconfig.json
  ├── README.md
  ├── src/
  │   ├── index.ts
  │   ├── cli/
  │   │   ├── commands.ts
  │   │   └── args.ts
  │   ├── tdd/
  │   │   ├── orchestrator.ts
  │   │   ├── phases/
  │   │   │   ├── plan-test.ts
  │   │   │   ├── implement-fix.ts
  │   │   │   └── refactor-document.ts
  │   │   └── workflow.ts
  │   ├── claude/
  │   │   ├── client.ts
  │   │   ├── prompts.ts
  │   │   └── integration.ts
  │   ├── config/
  │   │   ├── settings.ts
  │   │   └── defaults.ts
  │   ├── utils/
  │   │   ├── logger.ts
  │   │   ├── metrics.ts
  │   │   └── validation.ts
  │   └── types/
  │       ├── workflow.ts
  │       ├── task.ts
  │       └── config.ts
  ├── tests/
  │   ├── unit/
  │   ├── integration/
  │   └── fixtures/
  ├── examples/
  │   ├── hello-world/
  │   ├── web-api/
  │   └── cli-tool/
  └── docs/
      ├── usage.md
      └── api.md
  ```

- [ ] **Create Directory Structure**
  - [ ] `mkdir -p src/{cli,tdd/phases,claude,config,utils,types}`
  - [ ] `mkdir -p tests/{unit,integration,fixtures}`
  - [ ] `mkdir -p examples/{hello-world,web-api,cli-tool}`
  - [ ] `mkdir -p docs`

### 1.4 TypeScript Configuration

- [ ] **Create tsconfig.json**

  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "lib": ["ES2020"],
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "tests"]
  }
  ```

- [ ] **Verify TypeScript Setup**
  - [ ] Run `npx tsc --noEmit` to check TypeScript configuration
  - [ ] Create basic src/index.ts with hello world
  - [ ] Test compilation: `npx tsc`

○ **Checkpoint 1**: Claude Code environment verified, Node.js project created with TypeScript

---

## Phase 2: Claude Code SDK Integration + Enhanced Data Validation

### 2.1 Enhanced Dependencies

- [ ] **Add Enhanced Dependencies to package.json**

  ```json
  {
    "dependencies": {
      "@anthropic-ai/claude-code": "^1.0.0",
      "commander": "^9.0.0",
      "chalk": "^5.0.0",
      "ora": "^6.0.0",
      "inquirer": "^9.0.0",
      "zod": "^3.22.0"
    },
    "devDependencies": {
      "@types/node": "^18.0.0",
      "typescript": "^5.0.0",
      "jest": "^29.0.0",
      "eslint": "^8.0.0",
      "prettier": "^2.0.0"
    }
  }
  ```

### 2.2 Structured Data Validation in `src/types/workflow.ts`

- [ ] **Create Zod Schemas with Runtime Validation**

  ```typescript
  import { z } from 'zod';
  
  // Core workflow schemas
  export const TaskContextSchema = z.object({
    taskDescription: z.string().min(10, 'Task description must be at least 10 characters').max(1000, 'Task description too long'),
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
    metadata: z.record(z.any()).optional(),
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
    metadata: z.record(z.any()).optional(),
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
  });
  
  // TypeScript types inferred from schemas
  export type TaskContext = z.infer<typeof TaskContextSchema>;
  export type LLMResponse = z.infer<typeof LLMResponseSchema>;
  export type CommandResult = z.infer<typeof CommandResultSchema>;
  export type PhaseResult = z.infer<typeof PhaseResultSchema>;
  export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;
  ```

### 2.3 Agent Specialization Types in `src/types/agents.ts`

- [ ] **Define Agent Persona System**

  ```typescript
  import { z } from 'zod';
  
  export const AgentPersonaSchema = z.object({
    role: z.string(),
    expertise: z.array(z.string()),
    approach: z.string(),
    quality_standards: z.array(z.string()),
    output_format: z.string(),
    systemPrompt: z.string().optional(),
  });
  
  export type AgentPersona = z.infer<typeof AgentPersonaSchema>;
  
  export const SpecializedAgentContexts = {
    PLANNING_ANALYST: {
      role: "Senior Technical Analyst & Test Designer",
      expertise: ["requirements analysis", "test strategy", "edge case identification", "acceptance criteria"],
      approach: "methodical, comprehensive, risk-aware, systematic",
      quality_standards: ["complete coverage", "clear acceptance criteria", "testable requirements", "edge case consideration"],
      output_format: "structured plan with comprehensive test specifications",
      systemPrompt: "You are a meticulous planning analyst focused on comprehensive test-driven development. Always consider edge cases and create thorough test coverage."
    } satisfies AgentPersona,
    
    IMPLEMENTATION_ENGINEER: {
      role: "Senior Software Engineer",
      expertise: ["clean code", "design patterns", "performance optimization", "best practices"],
      approach: "pragmatic, test-driven, maintainable, efficient",
      quality_standards: ["passes all tests", "follows conventions", "minimal complexity", "readable code"],
      output_format: "production-ready code with clear structure and comments",
      systemPrompt: "You are a senior engineer focused on writing clean, efficient code that passes all tests. Prioritize simplicity and maintainability."
    } satisfies AgentPersona,
    
    QUALITY_REVIEWER: {
      role: "Senior Code Reviewer & Documentation Specialist",
      expertise: ["code quality", "maintainability", "documentation", "refactoring", "performance"],
      approach: "detail-oriented, improvement-focused, user-centric, thorough",
      quality_standards: ["clean code principles", "comprehensive docs", "optimal performance", "maintainable structure"],
      output_format: "refactored code with comprehensive documentation and quality improvements",
      systemPrompt: "You are a quality-focused reviewer who improves code maintainability, performance, and documentation. Focus on long-term code health."
    } satisfies AgentPersona,
  } as const;
  ```

### 2.4 Enhanced Claude Code Client in `src/claude/client.ts`

- [ ] **Create Validated Claude Code Client Wrapper**

  ```typescript
  import { ClaudeCode } from '@anthropic-ai/claude-code';
  import { TaskContext, LLMResponse, CommandResult, TaskContextSchema, LLMResponseSchema } from '../types';
  import { AgentPersona } from '../types/agents';
  
  export class ClaudeCodeClient {
    private claude: ClaudeCode;
    
    constructor(options?: ClaudeCodeOptions) {
      this.claude = new ClaudeCode(options);
    }
    
    async query(prompt: string, context?: TaskContext, persona?: AgentPersona): Promise<LLMResponse> {
      try {
        // Validate input context if provided
        if (context) {
          const validatedContext = TaskContextSchema.parse(context);
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
        const validatedResponse = LLMResponseSchema.parse({
          content: response.content,
          usage: response.usage,
          metadata: response.metadata,
        });
        
        return validatedResponse;
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw new Error(`Query failed: ${error.message}`);
      }
    }
    
    async executeCommand(command: string): Promise<CommandResult> {
      try {
        const result = await this.claude.executeCommand(command);
        
        // Validate command result
        return CommandResultSchema.parse({
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          exitCode: result.exitCode || 0,
          duration: result.duration || 0,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Command result validation error: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw new Error(`Command execution failed: ${error.message}`);
      }
    }
    
    async editFile(filePath: string, content: string): Promise<void> {
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
    async validateWorkflowContext(context: TaskContext): Promise<string[]> {
      const errors: string[] = [];
      
      try {
        TaskContextSchema.parse(context);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
        }
      }
      
      return errors;
    }
  }
  ```

### 2.5 Agent-Aware Prompt Templates in `src/claude/prompts.ts`

- [ ] **Create Enhanced TDD-Specific Prompts with Agent Specialization**

  ```typescript
  import { TaskContext } from '../types/workflow';
  import { AgentPersona, SpecializedAgentContexts } from '../types/agents';
  
  export class TDDPrompts {
    static buildContextualPrompt(persona: AgentPersona, task: string, context: TaskContext, additionalContext?: string): string {
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
    
    static planAndTestPrompt(taskDescription: string, context: TaskContext): string {
      const persona = SpecializedAgentContexts.PLANNING_ANALYST;
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
    
    static implementationPrompt(planContext: string, testResults: string, context: TaskContext): string {
      const persona = SpecializedAgentContexts.IMPLEMENTATION_ENGINEER;
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
    
    static refactorPrompt(implementationContext: string, context: TaskContext): string {
      const persona = SpecializedAgentContexts.QUALITY_REVIEWER;
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
    static customPersonaPrompt(persona: AgentPersona, task: string, context: TaskContext, guidelines?: string): string {
      return this.buildContextualPrompt(persona, task, context, guidelines);
    }
  }
  ```

### 2.3 Claude Code Integration Layer

- [ ] **Create Integration Helper in `src/claude/integration.ts`**

  ```typescript
  import { ClaudeCodeClient } from './client';
  import { TaskContext, WorkflowResult } from '../types';
  
  export class ClaudeCodeIntegration {
    private client: ClaudeCodeClient;
    
    constructor(client: ClaudeCodeClient) {
      this.client = client;
    }
    
    async setupWorkspace(context: TaskContext): Promise<void> {
      // Ensure proper workspace setup
      await this.client.executeCommand(`mkdir -p ${context.projectPath}`);
      
      // Initialize git if not already initialized
      const gitCheck = await this.client.executeCommand('git status');
      if (gitCheck.exitCode !== 0) {
        await this.client.executeCommand('git init');
      }
    }
    
    async runTests(testPath: string): Promise<TestResults> {
      // Use Claude Code to execute tests
      const result = await this.client.executeCommand(`npm test ${testPath}`);
      
      return this.parseTestResults(result);
    }
    
    async validateSyntax(filePath: string): Promise<ValidationResult> {
      // Use Claude Code to check syntax
      const result = await this.client.executeCommand(`npx tsc --noEmit ${filePath}`);
      
      return {
        valid: result.exitCode === 0,
        errors: result.stderr,
        warnings: this.extractWarnings(result.stdout),
      };
    }
    
    private parseTestResults(result: CommandResult): TestResults {
      // Parse test output from npm test
      // Extract passed/failed counts, error messages, etc.
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errors: [],
        duration: result.duration,
      };
    }
  }
  ```

○ **Checkpoint 2**: Claude Code SDK integrated with structured validation, agent specialization, and enhanced prompts

---

## Phase 3: TDD Workflow Engine + Quality Gates

### 3.1 Quality Gate System in `src/tdd/quality-gates.ts`

- [ ] **Create Quality Gate Framework**

  ```typescript
  import { PhaseResult, TaskContext } from '../types/workflow';
  import { z } from 'zod';
  
  export interface QualityGate {
    name: string;
    description: string;
    validator: (artifact: any, context?: TaskContext) => Promise<QualityResult>;
    required: boolean;
    weight: number; // For scoring
  }
  
  export interface QualityResult {
    passed: boolean;
    score: number; // 0-1
    issues: string[];
    suggestions: string[];
    metadata?: Record<string, any>;
  }
  
  export interface QualityGateReport {
    phase: string;
    overallScore: number;
    overallPassed: boolean;
    gateResults: Record<string, QualityResult>;
    recommendations: string[];
  }
  
  export class QualityGateManager {
    private gates: QualityGate[] = [
      {
        name: 'syntax-validation',
        description: 'Validate code syntax and basic structure',
        validator: this.validateSyntax.bind(this),
        required: true,
        weight: 1.0,
      },
      {
        name: 'test-coverage',
        description: 'Ensure adequate test coverage',
        validator: this.validateTestCoverage.bind(this),
        required: true,
        weight: 0.8,
      },
      {
        name: 'code-quality',
        description: 'Check code quality metrics',
        validator: this.validateCodeQuality.bind(this),
        required: false,
        weight: 0.6,
      },
      {
        name: 'documentation',
        description: 'Verify documentation completeness',
        validator: this.validateDocumentation.bind(this),
        required: false,
        weight: 0.4,
      },
    ];
    
    async runQualityGates(
      artifact: any, 
      context: TaskContext, 
      phase: string
    ): Promise<QualityGateReport> {
      const results: Record<string, QualityResult> = {};
      let overallScore = 0;
      let totalWeight = 0;
      let allRequiredPassed = true;
      
      for (const gate of this.gates) {
        try {
          const result = await gate.validator(artifact, context);
          results[gate.name] = result;
          
          overallScore += result.score * gate.weight;
          totalWeight += gate.weight;
          
          if (gate.required && !result.passed) {
            allRequiredPassed = false;
          }
          
        } catch (error) {
          results[gate.name] = {
            passed: false,
            score: 0,
            issues: [`Quality gate error: ${error.message}`],
            suggestions: ['Check artifact structure and try again'],
          };
          
          if (gate.required) {
            allRequiredPassed = false;
          }
        }
      }
      
      return {
        phase,
        overallScore: totalWeight > 0 ? overallScore / totalWeight : 0,
        overallPassed: allRequiredPassed,
        gateResults: results,
        recommendations: this.generateRecommendations(results),
      };
    }
    
    private async validateSyntax(artifact: any, context: TaskContext): Promise<QualityResult> {
      const issues: string[] = [];
      const suggestions: string[] = [];
      let validFiles = 0;
      
      // Validate artifact structure
      if (!artifact || !artifact.files || !Array.isArray(artifact.files)) {
        issues.push('Invalid artifact structure - no files array found');
        return { passed: false, score: 0, issues, suggestions };
      }
      
      for (const file of artifact.files) {
        try {
          if (!file.path || !file.content) {
            issues.push(`Invalid file structure: ${file.path || 'unknown'}`);
            continue;
          }
          
          if (file.content.trim().length === 0) {
            issues.push(`Empty file: ${file.path}`);
          } else if (!this.hasValidStructure(file.content, context.language)) {
            issues.push(`Invalid structure in: ${file.path}`);
            suggestions.push(`Review ${context.language || 'code'} syntax in ${file.path}`);
          } else {
            validFiles++;
          }
        } catch (error) {
          issues.push(`Syntax error in ${file.path}: ${error.message}`);
        }
      }
      
      const score = artifact.files.length > 0 ? validFiles / artifact.files.length : 0;
      
      return {
        passed: issues.length === 0,
        score,
        issues,
        suggestions,
        metadata: { validFiles, totalFiles: artifact.files.length },
      };
    }
    
    private async validateTestCoverage(artifact: any, context: TaskContext): Promise<QualityResult> {
      const issues: string[] = [];
      const suggestions: string[] = [];
      
      const testFiles = artifact.testFiles ? artifact.testFiles.length : 0;
      const implementationFiles = artifact.files ? artifact.files.length : 0;
      
      if (testFiles === 0) {
        issues.push('No test files found');
        suggestions.push('Create test files for your implementation');
      }
      
      if (implementationFiles > 0 && testFiles / implementationFiles < 0.5) {
        issues.push('Low test-to-implementation ratio');
        suggestions.push('Consider adding more comprehensive tests');
      }
      
      const score = implementationFiles > 0 ? 
        Math.min(1.0, testFiles / implementationFiles) : 
        (testFiles > 0 ? 1.0 : 0.0);
      
      return {
        passed: issues.length === 0,
        score,
        issues,
        suggestions,
        metadata: { testFiles, implementationFiles },
      };
    }
    
    private async validateCodeQuality(artifact: any, context: TaskContext): Promise<QualityResult> {
      const issues: string[] = [];
      const suggestions: string[] = [];
      let qualityScore = 1.0;
      
      if (!artifact.files) {
        return { passed: false, score: 0, issues: ['No files to analyze'], suggestions: [] };
      }
      
      for (const file of artifact.files) {
        // Simple heuristic-based quality checks
        const lines = file.content.split('\n');
        const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//'));
        
        // Check for excessively long functions
        const functionBlocks = this.findFunctionBlocks(file.content);
        const longFunctions = functionBlocks.filter(fn => fn.lines > 50);
        
        if (longFunctions.length > 0) {
          issues.push(`${file.path}: Contains ${longFunctions.length} long functions (>50 lines)`);
          suggestions.push(`Consider breaking down large functions in ${file.path}`);
          qualityScore *= 0.9;
        }
        
        // Check for missing error handling
        if (codeLines.length > 10 && !file.content.includes('try') && !file.content.includes('catch')) {
          issues.push(`${file.path}: Missing error handling`);
          suggestions.push(`Add appropriate error handling to ${file.path}`);
          qualityScore *= 0.95;
        }
      }
      
      return {
        passed: issues.length === 0,
        score: qualityScore,
        issues,
        suggestions,
      };
    }
    
    private async validateDocumentation(artifact: any, context: TaskContext): Promise<QualityResult> {
      const issues: string[] = [];
      const suggestions: string[] = [];
      let docScore = 1.0;
      
      if (!artifact.files) {
        return { passed: false, score: 0, issues: ['No files to analyze'], suggestions: [] };
      }
      
      for (const file of artifact.files) {
        const hasComments = file.content.includes('//') || file.content.includes('/*');
        const hasDocstrings = file.content.includes('/**') || file.content.includes('"""');
        
        if (!hasComments && !hasDocstrings) {
          issues.push(`${file.path}: No documentation found`);
          suggestions.push(`Add comments and documentation to ${file.path}`);
          docScore *= 0.8;
        }
      }
      
      return {
        passed: issues.length === 0,
        score: docScore,
        issues,
        suggestions,
      };
    }
    
    private hasValidStructure(content: string, language?: string): boolean {
      if (!content || content.trim().length === 0) return false;
      
      // Basic structure validation based on language
      switch (language?.toLowerCase()) {
        case 'javascript':
        case 'typescript':
          return !content.includes('SyntaxError') && this.hasBalancedBraces(content);
        case 'python':
          return !content.includes('IndentationError') && !content.includes('SyntaxError');
        default:
          return this.hasBalancedBraces(content);
      }
    }
    
    private hasBalancedBraces(content: string): boolean {
      let braces = 0;
      let brackets = 0;
      let parens = 0;
      
      for (const char of content) {
        switch (char) {
          case '{': braces++; break;
          case '}': braces--; break;
          case '[': brackets++; break;
          case ']': brackets--; break;
          case '(': parens++; break;
          case ')': parens--; break;
        }
      }
      
      return braces === 0 && brackets === 0 && parens === 0;
    }
    
    private findFunctionBlocks(content: string): Array<{name: string, lines: number}> {
      const functions: Array<{name: string, lines: number}> = [];
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('function ') || line.includes(' => ') || line.match(/^\s*(async\s+)?function/)) {
          const functionStart = i;
          let braceCount = 0;
          let functionEnd = i;
          
          for (let j = i; j < lines.length; j++) {
            const currentLine = lines[j];
            braceCount += (currentLine.match(/\{/g) || []).length;
            braceCount -= (currentLine.match(/\}/g) || []).length;
            
            if (braceCount === 0 && j > i) {
              functionEnd = j;
              break;
            }
          }
          
          functions.push({
            name: line.substring(0, 50) + '...',
            lines: functionEnd - functionStart + 1
          });
        }
      }
      
      return functions;
    }
    
    private generateRecommendations(results: Record<string, QualityResult>): string[] {
      const recommendations: string[] = [];
      
      Object.entries(results).forEach(([gateName, result]) => {
        if (!result.passed && result.suggestions.length > 0) {
          recommendations.push(`${gateName}: ${result.suggestions.join(', ')}`);
        }
      });
      
      return recommendations;
    }
  }
  ```

### 3.2 Enhanced Workflow Orchestrator in `src/tdd/orchestrator.ts`

- [ ] **Create Quality-Gate Enhanced TDD Orchestrator**

  ```typescript
  import { ClaudeCodeClient } from '../claude/client';
  import { PlanTestPhase } from './phases/plan-test';
  import { ImplementFixPhase } from './phases/implement-fix';
  import { RefactorDocumentPhase } from './phases/refactor-document';
  import { QualityGateManager, QualityGateReport } from './quality-gates';
  import { TaskContext, WorkflowResult, PhaseResult } from '../types';
  
  export class TDDOrchestrator {
    private claudeClient: ClaudeCodeClient;
    private planTestPhase: PlanTestPhase;
    private implementFixPhase: ImplementFixPhase;
    private refactorDocumentPhase: RefactorDocumentPhase;
    private qualityGateManager: QualityGateManager;
    
    constructor(claudeClient: ClaudeCodeClient) {
      this.claudeClient = claudeClient;
      this.planTestPhase = new PlanTestPhase(claudeClient);
      this.implementFixPhase = new ImplementFixPhase(claudeClient);
      this.refactorDocumentPhase = new RefactorDocumentPhase(claudeClient);
      this.qualityGateManager = new QualityGateManager();
    }
    
    async executeWorkflow(taskDescription: string, context: TaskContext): Promise<WorkflowResult> {
      const workflow: WorkflowResult = {
        taskDescription,
        startTime: new Date(),
        phases: [],
        success: false,
        artifacts: [],
      };
      
      const qualityReports: QualityGateReport[] = [];
      
      try {
        // Phase 1: Plan & Test with Quality Gates
        console.log('⋇ PHASE 1: Planning and generating tests...');
        const planResult = await this.planTestPhase.execute(taskDescription, context);
        
        // Run quality gates on planning phase
        const planQualityReport = await this.qualityGateManager.runQualityGates(
          { files: [], testFiles: planResult.artifacts },
          context,
          'plan-test'
        );
        qualityReports.push(planQualityReport);
        
        if (!planQualityReport.overallPassed) {
          console.log('⚠  Quality gates failed for planning phase');
          planResult.metadata = { ...planResult.metadata, qualityReport: planQualityReport };
        }
        
        workflow.phases.push(planResult);
        
        if (!planResult.success) {
          throw new Error(`Planning phase failed: ${planResult.error}`);
        }
        
        // Phase 2: Implement & Fix with Quality Gates
        console.log('⚡ PHASE 2: Implementing code to pass tests...');
        const implementResult = await this.implementFixPhase.execute(planResult, context);
        
        // Run quality gates on implementation
        const implementationArtifact = await this.gatherImplementationArtifacts(context);
        const implementQualityReport = await this.qualityGateManager.runQualityGates(
          implementationArtifact,
          context,
          'implement-fix'
        );
        qualityReports.push(implementQualityReport);
        
        // Apply quality gate feedback
        if (!implementQualityReport.overallPassed) {
          console.log('⚠  Quality gates detected issues, attempting improvements...');
          await this.applyQualityImprovements(implementQualityReport, context);
        }
        
        implementResult.metadata = { ...implementResult.metadata, qualityReport: implementQualityReport };
        workflow.phases.push(implementResult);
        
        if (!implementResult.success) {
          throw new Error(`Implementation phase failed: ${implementResult.error}`);
        }
        
        // Phase 3: Refactor & Document with Final Quality Gates
        console.log('✨ PHASE 3: Refactoring and documenting code...');
        const refactorResult = await this.refactorDocumentPhase.execute(implementResult, context);
        
        // Final quality assessment
        const finalArtifact = await this.gatherFinalArtifacts(context);
        const finalQualityReport = await this.qualityGateManager.runQualityGates(
          finalArtifact,
          context,
          'refactor-document'
        );
        qualityReports.push(finalQualityReport);
        
        refactorResult.metadata = { ...refactorResult.metadata, qualityReport: finalQualityReport };
        workflow.phases.push(refactorResult);
        
        // Overall success depends on final phase and quality gates
        workflow.success = refactorResult.success && finalQualityReport.overallPassed;
        workflow.endTime = new Date();
        workflow.duration = workflow.endTime.getTime() - workflow.startTime.getTime();
        
        // Add quality summary to workflow
        workflow.metadata = {
          qualityReports,
          overallQualityScore: this.calculateOverallQualityScore(qualityReports),
          qualitySummary: this.generateQualitySummary(qualityReports),
        };
        
        // Display quality summary
        this.displayQualitySummary(qualityReports);
        
        return workflow;
        
      } catch (error) {
        workflow.success = false;
        workflow.error = error.message;
        workflow.endTime = new Date();
        workflow.metadata = { qualityReports };
        return workflow;
      }
    }
    
    private async gatherImplementationArtifacts(context: TaskContext): Promise<any> {
      // Gather implementation files for quality assessment
      const implementationFiles = await this.findImplementationFiles(context.projectPath);
      const testFiles = await this.findTestFiles(context.projectPath);
      
      return {
        files: implementationFiles.map(path => ({
          path,
          content: '', // Would be read from filesystem
        })),
        testFiles: testFiles.map(path => ({
          path,
          content: '', // Would be read from filesystem
        })),
        metadata: {
          fileCount: implementationFiles.length,
          testCount: testFiles.length,
        },
      };
    }
    
    private async gatherFinalArtifacts(context: TaskContext): Promise<any> {
      // Gather all artifacts for final quality assessment
      const allFiles = await this.findAllProjectFiles(context.projectPath);
      
      return {
        files: allFiles.map(path => ({
          path,
          content: '', // Would be read from filesystem
        })),
        testFiles: allFiles.filter(path => path.includes('.test.') || path.includes('.spec.')),
        metadata: {
          totalFiles: allFiles.length,
          hasDocumentation: allFiles.some(path => path.includes('README') || path.includes('.md')),
          hasTests: allFiles.some(path => path.includes('.test.') || path.includes('.spec.')),
        },
      };
    }
    
    private async applyQualityImprovements(report: QualityGateReport, context: TaskContext): Promise<void> {
      // Apply quality improvements based on gate feedback
      if (report.recommendations.length > 0) {
        console.log('◦ Applying quality improvements...');
                const improvementPrompt = [
          'Based on the quality analysis, please apply the following improvements:',
          ...report.recommendations.map(rec => `- ${rec}`),
          '',
          'Focus on:',
          '- Fixing syntax issues',
          '- Improving test coverage',
          '- Adding necessary documentation',
          '- Optimizing code structure'
        ].join('\n');
        try {
          await this.claudeClient.query(improvementPrompt, context);
        } catch (error) {
          console.log('⚠  Quality improvement failed:', error.message);
        }
      }
    }
    
    private calculateOverallQualityScore(reports: QualityGateReport[]): number {
      if (reports.length === 0) return 0;
      
      const totalScore = reports.reduce((sum, report) => sum + report.overallScore, 0);
      return totalScore / reports.length;
    }
    
    private generateQualitySummary(reports: QualityGateReport[]): string {
      const overallScore = this.calculateOverallQualityScore(reports);
      const passedGates = reports.filter(r => r.overallPassed).length;
      const totalGates = reports.length;
      
      return `Quality Score: ${(overallScore * 100).toFixed(1)}% | Gates Passed: ${passedGates}/${totalGates}`;
    }
    
    private displayQualitySummary(reports: QualityGateReport[]): void {
      console.log('\n◊ Quality Assessment Summary:');
      console.log('═══════════════════════════════');
      
      reports.forEach((report, index) => {
        const icon = report.overallPassed ? '✓' : '⚠';
        const score = (report.overallScore * 100).toFixed(1);
        
        console.log(`${icon} Phase ${index + 1} (${report.phase}): ${score}%`);
        
        if (report.recommendations.length > 0) {
          console.log(`   Recommendations: ${report.recommendations.length}`);
        }
      });
      
      const overallScore = this.calculateOverallQualityScore(reports);
      console.log(`\n○ Overall Quality Score: ${(overallScore * 100).toFixed(1)}%`);
    }
    
    // Helper methods for file discovery
    private async findImplementationFiles(projectPath: string): Promise<string[]> {
      // Would use Claude Code to find implementation files
      return [];
    }
    
    private async findTestFiles(projectPath: string): Promise<string[]> {
      // Would use Claude Code to find test files
      return [];
    }
    
    private async findAllProjectFiles(projectPath: string): Promise<string[]> {
      // Would use Claude Code to find all project files
      return [];
    }
  }
  ```

### 3.2 Phase 1: Plan & Test in `src/tdd/phases/plan-test.ts`

- [ ] **Implement Planning Phase**

  ```typescript
  import { ClaudeCodeClient } from '../../claude/client';
  import { TDDPrompts } from '../../claude/prompts';
  import { TaskContext, PhaseResult } from '../../types';
  
  export class PlanTestPhase {
    private claudeClient: ClaudeCodeClient;
    
    constructor(claudeClient: ClaudeCodeClient) {
      this.claudeClient = claudeClient;
    }
    
    async execute(taskDescription: string, context: TaskContext): Promise<PhaseResult> {
      const phase: PhaseResult = {
        name: 'plan-test',
        startTime: new Date(),
        success: false,
        artifacts: [],
      };
      
      try {
        // Generate comprehensive prompt
        const prompt = TDDPrompts.planAndTestPrompt(taskDescription, context);
        
        // Ask Claude Code to plan and create tests
        const response = await this.claudeClient.query(prompt, context);
        
        // Validate that tests were created
        const testValidation = await this.validateTestCreation(context);
        
        if (!testValidation.valid) {
          throw new Error(`Test creation failed: ${testValidation.errors.join(', ')}`);
        }
        
        phase.success = true;
        phase.output = response.content;
        phase.artifacts = testValidation.testFiles;
        phase.endTime = new Date();
        
        return phase;
        
      } catch (error) {
        phase.success = false;
        phase.error = error.message;
        phase.endTime = new Date();
        return phase;
      }
    }
    
    private async validateTestCreation(context: TaskContext): Promise<TestValidation> {
      // Check if test files were created
      const testFiles = await this.findTestFiles(context.projectPath);
      
      // Validate test syntax
      const validationResults = await Promise.all(
        testFiles.map(file => this.claudeClient.validateSyntax(file))
      );
      
      return {
        valid: validationResults.every(r => r.valid),
        errors: validationResults.flatMap(r => r.errors),
        testFiles,
      };
    }
  }
  ```

### 3.3 Phase 2: Implement & Fix in `src/tdd/phases/implement-fix.ts`

- [ ] **Implement Implementation Phase with Retry Logic**

  ```typescript
  export class ImplementFixPhase {
    private claudeClient: ClaudeCodeClient;
    private maxAttempts: number = 3;
    
    constructor(claudeClient: ClaudeCodeClient) {
      this.claudeClient = claudeClient;
    }
    
    async execute(planResult: PhaseResult, context: TaskContext): Promise<PhaseResult> {
      const phase: PhaseResult = {
        name: 'implement-fix',
        startTime: new Date(),
        success: false,
        artifacts: [],
      };
      
      let attempt = 0;
      let lastError = '';
      
      while (attempt < this.maxAttempts) {
        attempt++;
        console.log(`  ⇔ Implementation attempt ${attempt}/${this.maxAttempts}`);
        
        try {
          // Create implementation prompt with context
          const prompt = TDDPrompts.implementationPrompt(
            planResult.output || '',
            lastError
          );
          
          // Ask Claude Code to implement
          const response = await this.claudeClient.query(prompt, context);
          
          // Run tests to validate implementation
          const testResults = await this.runTests(context);
          
          if (testResults.failedTests === 0) {
            console.log('  ✓ All tests passed!');
            phase.success = true;
            phase.output = response.content;
            phase.artifacts = await this.getImplementationFiles(context);
            phase.metadata = { testResults, attempts: attempt };
            break;
          } else {
            lastError = this.formatTestErrors(testResults);
            console.log(`  ✗ ${testResults.failedTests} tests failed`);
            
            if (attempt < this.maxAttempts) {
              console.log('  ⇔ Retrying with error feedback...');
            }
          }
          
        } catch (error) {
          lastError = error.message;
          console.log(`  ✗ Implementation error: ${error.message}`);
        }
      }
      
      if (!phase.success) {
        phase.error = `Failed after ${this.maxAttempts} attempts. Last error: ${lastError}`;
      }
      
      phase.endTime = new Date();
      return phase;
    }
    
    private async runTests(context: TaskContext): Promise<TestResults> {
      const result = await this.claudeClient.executeCommand('npm test');
      return this.parseTestResults(result);
    }
  }
  ```

### 3.4 Phase 3: Refactor & Document in `src/tdd/phases/refactor-document.ts`

- [ ] **Implement Refactoring Phase**

  ```typescript
  export class RefactorDocumentPhase {
    private claudeClient: ClaudeCodeClient;
    
    constructor(claudeClient: ClaudeCodeClient) {
      this.claudeClient = claudeClient;
    }
    
    async execute(implementResult: PhaseResult, context: TaskContext): Promise<PhaseResult> {
      const phase: PhaseResult = {
        name: 'refactor-document',
        startTime: new Date(),
        success: false,
        artifacts: [],
      };
      
      try {
        // Create refactoring prompt
        const prompt = TDDPrompts.refactorPrompt(implementResult.output || '');
        
        // Ask Claude Code to refactor and document
        const response = await this.claudeClient.query(prompt, context);
        
        // Validate that tests still pass after refactoring
        const testResults = await this.runRegressionTests(context);
        
        if (testResults.failedTests > 0) {
          throw new Error(`Refactoring broke ${testResults.failedTests} tests`);
        }
        
        // Analyze code quality improvements
        const qualityMetrics = await this.analyzeQualityImprovements(context);
        
        phase.success = true;
        phase.output = response.content;
        phase.artifacts = await this.getFinalArtifacts(context);
        phase.metadata = { testResults, qualityMetrics };
        phase.endTime = new Date();
        
        return phase;
        
      } catch (error) {
        phase.success = false;
        phase.error = error.message;
        phase.endTime = new Date();
        return phase;
      }
    }
    
    private async analyzeQualityImprovements(context: TaskContext): Promise<QualityMetrics> {
      // Use Claude Code to analyze code quality
      const analysisPrompt = `
        Analyze the code quality of the files in ${context.projectPath}.
        Provide metrics on:
        - Code complexity
        - Documentation coverage
        - Test coverage
        - Maintainability
        - Performance considerations
      `;
      
      const response = await this.claudeClient.query(analysisPrompt, context);
      return this.parseQualityMetrics(response.content);
    }
  }
  ```

○ **Checkpoint 3**: Complete TDD workflow engine with all three phases

---

## Phase 4: CLI Interface

### 4.1 Command Structure in `src/cli/args.ts`

- [ ] **Define CLI Arguments with Commander.js**

  ```typescript
  import { Command } from 'commander';
  
  export interface PhoenixCodeLiteOptions {
    task: string;
    projectPath?: string;
    language?: string;
    framework?: string;
    verbose?: boolean;
    skipDocs?: boolean;
    maxAttempts?: number;
  }
  
  export function setupCLI(): Command {
    const program = new Command();
    
    program
      .name('phoenix-code-lite')
      .description('TDD workflow orchestrator for Claude Code')
      .version('1.0.0');
    
    program
      .command('generate')
      .description('Generate code using the TDD workflow')
      .requiredOption('-t, --task <description>', 'Task description')
      .option('-p, --project-path <path>', 'Project path', process.cwd())
      .option('-l, --language <lang>', 'Programming language')
      .option('-f, --framework <framework>', 'Framework to use')
      .option('-v, --verbose', 'Verbose output', false)
      .option('--skip-docs', 'Skip documentation generation', false)
      .option('--max-attempts <number>', 'Maximum implementation attempts', '3')
      .action(async (options: PhoenixCodeLiteOptions) => {
        const { generateCommand } = await import('./commands');
        await generateCommand(options);
      });
    
    program
      .command('init')
      .description('Initialize Phoenix-Code-Lite in current directory')
      .option('-f, --force', 'Overwrite existing configuration')
      .action(async (options) => {
        const { initCommand } = await import('./commands');
        await initCommand(options);
      });
    
    program
      .command('config')
      .description('Manage Phoenix-Code-Lite configuration')
      .option('--show', 'Show current configuration')
      .option('--reset', 'Reset to default configuration')
      .action(async (options) => {
        const { configCommand } = await import('./commands');
        await configCommand(options);
      });
    
    return program;
  }
  ```

### 4.2 Command Implementation in `src/cli/commands.ts`

- [ ] **Implement CLI Commands**

  ```typescript
  import { ClaudeCodeClient } from '../claude/client';
  import { TDDOrchestrator } from '../tdd/orchestrator';
  import { PhoenixCodeLiteConfig } from '../config/settings';
  import { Logger } from '../utils/logger';
  import { MetricsCollector } from '../utils/metrics';
  import chalk from 'chalk';
  import ora from 'ora';
  
  export async function generateCommand(options: PhoenixCodeLiteOptions): Promise<void> {
    const spinner = ora('Initializing Phoenix-Code-Lite workflow...').start();
    
    try {
      // Load configuration
      const config = await PhoenixCodeLiteConfig.load();
      const logger = new Logger(options.verbose);
      const metrics = new MetricsCollector();
      
      // Initialize Claude Code client
      const claudeClient = new ClaudeCodeClient({
        projectPath: options.projectPath,
        verbose: options.verbose,
      });
      
      // Create TDD orchestrator
      const orchestrator = new TDDOrchestrator(claudeClient);
      
      // Setup task context
      const context = {
        taskDescription: options.task,
        projectPath: options.projectPath || process.cwd(),
        language: options.language,
        framework: options.framework,
        maxTurns: parseInt(options.maxAttempts || '3'),
      };
      
      spinner.text = 'Starting TDD workflow...';
      
      // Execute the workflow
      const result = await orchestrator.executeWorkflow(options.task, context);
      
      spinner.stop();
      
      // Display results
      if (result.success) {
        console.log(chalk.green('* Phoenix-Code-Lite workflow completed successfully!'));
        console.log(chalk.gray(`Duration: ${result.duration}ms`));
        console.log(chalk.gray(`Phases completed: ${result.phases.length}`));
        
        if (options.verbose) {
          displayDetailedResults(result);
        }
      } else {
        console.log(chalk.red('✗ Phoenix-Code-Lite workflow failed'));
        console.log(chalk.red(`Error: ${result.error}`));
        process.exit(1);
      }
      
      // Record metrics
      await metrics.recordWorkflow(result);
      
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Fatal error:'), error.message);
      process.exit(1);
    }
  }
  
  export async function initCommand(options: any): Promise<void> {
    console.log(chalk.blue('* Initializing Phoenix-Code-Lite...'));
    
    // Create .phoenix-code-lite.json configuration
    const config = PhoenixCodeLiteConfig.getDefault();
    await config.save(options.force);
    
    console.log(chalk.green('✓ Phoenix-Code-Lite initialized successfully!'));
    console.log(chalk.gray('Run "phoenix-code-lite generate --task \'your task\'" to get started'));
  }
  
  function displayDetailedResults(result: WorkflowResult): void {
    console.log('\n◊ Detailed Results:');
    
    result.phases.forEach((phase, index) => {
      const icon = phase.success ? '✓' : '✗';
      const duration = phase.endTime!.getTime() - phase.startTime.getTime();
      
      console.log(`${icon} Phase ${index + 1}: ${phase.name} (${duration}ms)`);
      
      if (phase.artifacts.length > 0) {
        console.log(`   □ Artifacts: ${phase.artifacts.join(', ')}`);
      }
      
      if (phase.error) {
        console.log(chalk.red(`   ✗ Error: ${phase.error}`));
      }
    });
  }
  ```

### 4.3 Main Entry Point in `src/index.ts`

- [ ] **Create Main Entry Point**

  ```typescript
  #!/usr/bin/env node
  
  import { setupCLI } from './cli/args';
  import { Logger } from './utils/logger';
  
  async function main() {
    try {
      const program = setupCLI();
      await program.parseAsync(process.argv);
    } catch (error) {
      const logger = new Logger(true);
      logger.error('Phoenix-Code-Lite failed:', error);
      process.exit(1);
    }
  }
  
  if (require.main === module) {
    main();
  }
  ```

○ **Checkpoint 4**: Complete CLI interface with all commands

---

## Phase 5: Enhanced Configuration Management + Agent Settings

### 5.1 Enhanced Configuration Schema in `src/config/settings.ts`

- [ ] **Define Enhanced Configuration Structure with Agent Support**

  ```typescript
  import { promises as fs } from 'fs';
  import { join } from 'path';
  import { z } from 'zod';
  
  // Configuration validation schemas
  export const AgentConfigSchema = z.object({
    enabled: z.boolean().default(true),
    priority: z.number().min(0).max(1).default(0.8),
    timeout: z.number().min(1000).max(600000).default(30000), // 30 seconds
    retryAttempts: z.number().min(1).max(5).default(2),
    customPrompts: z.record(z.string()).optional(),
  });
  
  export const QualityGateConfigSchema = z.object({
    enabled: z.boolean().default(true),
    strictMode: z.boolean().default(false),
    thresholds: z.object({
      syntaxValidation: z.number().min(0).max(1).default(1.0),
      testCoverage: z.number().min(0).max(1).default(0.8),
      codeQuality: z.number().min(0).max(1).default(0.7),
      documentation: z.number().min(0).max(1).default(0.6),
    }),
    weights: z.object({
      syntaxValidation: z.number().min(0).max(1).default(1.0),
      testCoverage: z.number().min(0).max(1).default(0.8),
      codeQuality: z.number().min(0).max(1).default(0.6),
      documentation: z.number().min(0).max(1).default(0.4),
    }),
  });
  
  export const PhoenixCodeLiteConfigSchema = z.object({
    version: z.string().default('1.0.0'),
    claude: z.object({
      maxTurns: z.number().min(1).max(10).default(3),
      timeout: z.number().min(30000).max(1800000).default(300000), // 5 minutes
      retryAttempts: z.number().min(1).max(5).default(3),
      model: z.string().optional().default('claude-3-5-sonnet-20241022'),
    }),
    tdd: z.object({
      maxImplementationAttempts: z.number().min(1).max(10).default(5),
      testQualityThreshold: z.number().min(0).max(1).default(0.8),
      enableRefactoring: z.boolean().default(true),
      skipDocumentation: z.boolean().default(false),
      qualityGates: QualityGateConfigSchema,
    }),
    agents: z.object({
      planningAnalyst: AgentConfigSchema,
      implementationEngineer: AgentConfigSchema,
      qualityReviewer: AgentConfigSchema,
      enableSpecialization: z.boolean().default(true),
      fallbackToGeneric: z.boolean().default(true),
    }),
    output: z.object({
      verbose: z.boolean().default(false),
      showMetrics: z.boolean().default(true),
      saveArtifacts: z.boolean().default(true),
      logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
      metricsPath: z.string().default('.phoenix-code-lite/metrics'),
    }),
    quality: z.object({
      minTestCoverage: z.number().min(0).max(1).default(0.8),
      maxComplexity: z.number().min(1).max(50).default(10),
      requireDocumentation: z.boolean().default(true),
      enforceStrictMode: z.boolean().default(false),
      customRules: z.array(z.string()).default([]),
    }),
    project: z.object({
      language: z.string().optional(),
      framework: z.string().optional(),
      testFramework: z.string().optional(),
      packageManager: z.enum(['npm', 'yarn', 'pnpm', 'bun']).default('npm'),
      linter: z.enum(['eslint', 'tslint', 'standard']).optional(),
      formatter: z.enum(['prettier', 'standard']).optional(),
    }),
    hooks: z.object({
      prePhase: z.array(z.string()).default([]),
      postPhase: z.array(z.string()).default([]),
      preWorkflow: z.array(z.string()).default([]),
      postWorkflow: z.array(z.string()).default([]),
    }),
  });
  
  export type PhoenixCodeLiteConfigData = z.infer<typeof PhoenixCodeLiteConfigSchema>;
  export type AgentConfig = z.infer<typeof AgentConfigSchema>;
  export type QualityGateConfig = z.infer<typeof QualityGateConfigSchema>;
  
  export class PhoenixCodeLiteConfig {
    private data: PhoenixCodeLiteConfigData;
    private configPath: string;
    
    constructor(data: PhoenixCodeLiteConfigData, configPath: string) {
      this.data = data;
      this.configPath = configPath;
    }
    
    static async load(projectPath?: string): Promise<PhoenixCodeLiteConfig> {
      const configPath = join(projectPath || process.cwd(), '.phoenix-code-lite.json');
      
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const rawData = JSON.parse(content);
        
        // Validate and parse configuration with Zod
        const data = PhoenixCodeLiteConfigSchema.parse(rawData);
        return new PhoenixCodeLiteConfig(data, configPath);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.warn('Configuration validation failed, using defaults:', error.errors);
        }
        // Return default configuration if file doesn't exist or is invalid
        return PhoenixCodeLiteConfig.getDefault(configPath);
      }
    }
    
    static getDefault(configPath?: string): PhoenixCodeLiteConfig {
      const defaultData = PhoenixCodeLiteConfigSchema.parse({});
      
      return new PhoenixCodeLiteConfig(
        defaultData,
        configPath || join(process.cwd(), '.phoenix-code-lite.json')
      );
    }
    
    async save(force: boolean = false): Promise<void> {
      try {
        // Validate configuration before saving
        const validatedData = PhoenixCodeLiteConfigSchema.parse(this.data);
        
        // Check if file exists
        if (!force) {
          try {
            await fs.access(this.configPath);
            throw new Error('Configuration file already exists. Use --force to overwrite.');
          } catch (error) {
            // File doesn't exist, continue with save
            if (error.message.includes('already exists')) {
              throw error;
            }
          }
        }
        
        const content = JSON.stringify(validatedData, null, 2);
        await fs.writeFile(this.configPath, content, 'utf-8');
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Configuration validation failed: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw new Error(`Failed to save configuration: ${error.message}`);
      }
    }
    
    get<T = any>(key: string): T {
      return this.getNestedValue(this.data, key) as T;
    }
    
    set(key: string, value: any): void {
      this.setNestedValue(this.data, key, value);
      
      // Re-validate after setting
      try {
        this.data = PhoenixCodeLiteConfigSchema.parse(this.data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Invalid configuration value: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    }
    
    getAgentConfig(agentType: 'planningAnalyst' | 'implementationEngineer' | 'qualityReviewer'): AgentConfig {
      return this.data.agents[agentType];
    }
    
    getQualityGateConfig(): QualityGateConfig {
      return this.data.tdd.qualityGates;
    }
    
    isAgentEnabled(agentType: 'planningAnalyst' | 'implementationEngineer' | 'qualityReviewer'): boolean {
      return this.data.agents.enableSpecialization && this.data.agents[agentType].enabled;
    }
    
    shouldFallbackToGeneric(): boolean {
      return this.data.agents.fallbackToGeneric;
    }
    
    validate(): string[] {
      try {
        PhoenixCodeLiteConfigSchema.parse(this.data);
        return [];
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        }
        return [error.message];
      }
    }
    
    // Deep clone configuration for safe modifications
    clone(): PhoenixCodeLiteConfig {
      const clonedData = JSON.parse(JSON.stringify(this.data));
      return new PhoenixCodeLiteConfig(clonedData, this.configPath);
    }
    
    // Merge with another configuration
    merge(otherConfig: Partial<PhoenixCodeLiteConfigData>): PhoenixCodeLiteConfig {
      const mergedData = this.deepMerge(this.data, otherConfig);
      const validatedData = PhoenixCodeLiteConfigSchema.parse(mergedData);
      return new PhoenixCodeLiteConfig(validatedData, this.configPath);
    }
    
    // Export configuration for debugging
    export(): PhoenixCodeLiteConfigData {
      return JSON.parse(JSON.stringify(this.data));
    }
    
    // Configuration migration support
    static async migrate(configPath: string): Promise<PhoenixCodeLiteConfig> {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const rawData = JSON.parse(content);
        
        // Check version and apply migrations
        if (!rawData.version || rawData.version < '1.0.0') {
          console.log('Migrating configuration to v1.0.0...');
          rawData.version = '1.0.0';
          
          // Add any migration logic here
          if (!rawData.agents) {
            rawData.agents = {
              enableSpecialization: true,
              fallbackToGeneric: true,
            };
          }
        }
        
        const data = PhoenixCodeLiteConfigSchema.parse(rawData);
        const config = new PhoenixCodeLiteConfig(data, configPath);
        
        // Save migrated configuration
        await config.save(true);
        
        return config;
      } catch (error) {
        throw new Error(`Configuration migration failed: ${error.message}`);
      }
    }
    
    private getNestedValue(obj: any, key: string): any {
      return key.split('.').reduce((current, prop) => current?.[prop], obj);
    }
    
    private setNestedValue(obj: any, key: string, value: any): void {
      const keys = key.split('.');
      const lastKey = keys.pop()!;
      const target = keys.reduce((current, prop) => {
        if (!(prop in current)) {
          current[prop] = {};
        }
        return current[prop];
      }, obj);
      target[lastKey] = value;
    }
    
    private deepMerge(target: any, source: any): any {
      const result = { ...target };
      
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      
      return result;
    }
  }
  ```

### 5.2 Configuration Templates in `src/config/templates.ts`

- [ ] **Create Configuration Templates for Different Use Cases**

  ```typescript
  import { PhoenixCodeLiteConfigData } from './settings';
  
  export class ConfigurationTemplates {
    static getStarterTemplate(): Partial<PhoenixCodeLiteConfigData> {
      return {
        claude: {
          maxTurns: 2,
          timeout: 180000, // 3 minutes
          retryAttempts: 2,
        },
        tdd: {
          maxImplementationAttempts: 3,
          testQualityThreshold: 0.7,
          enableRefactoring: true,
          skipDocumentation: false,
          qualityGates: {
            enabled: true,
            strictMode: false,
            thresholds: {
              syntaxValidation: 1.0,
              testCoverage: 0.7,
              codeQuality: 0.6,
              documentation: 0.5,
            },
          },
        },
        agents: {
          enableSpecialization: true,
          fallbackToGeneric: true,
          planningAnalyst: { enabled: true, priority: 0.8 },
          implementationEngineer: { enabled: true, priority: 0.9 },
          qualityReviewer: { enabled: true, priority: 0.7 },
        },
        quality: {
          minTestCoverage: 0.7,
          maxComplexity: 15,
          requireDocumentation: false,
          enforceStrictMode: false,
        },
      };
    }
    
    static getEnterpriseTemplate(): Partial<PhoenixCodeLiteConfigData> {
      return {
        claude: {
          maxTurns: 5,
          timeout: 600000, // 10 minutes
          retryAttempts: 3,
        },
        tdd: {
          maxImplementationAttempts: 5,
          testQualityThreshold: 0.9,
          enableRefactoring: true,
          skipDocumentation: false,
          qualityGates: {
            enabled: true,
            strictMode: true,
            thresholds: {
              syntaxValidation: 1.0,
              testCoverage: 0.9,
              codeQuality: 0.8,
              documentation: 0.8,
            },
          },
        },
        agents: {
          enableSpecialization: true,
          fallbackToGeneric: false,
          planningAnalyst: { enabled: true, priority: 0.95, timeout: 60000 },
          implementationEngineer: { enabled: true, priority: 0.95, timeout: 120000 },
          qualityReviewer: { enabled: true, priority: 0.95, timeout: 90000 },
        },
        quality: {
          minTestCoverage: 0.9,
          maxComplexity: 8,
          requireDocumentation: true,
          enforceStrictMode: true,
        },
        hooks: {
          preWorkflow: ['npm run lint', 'npm run type-check'],
          postWorkflow: ['npm run build', 'npm run test:coverage'],
        },
      };
    }
    
    static getPerformanceTemplate(): Partial<PhoenixCodeLiteConfigData> {
      return {
        claude: {
          maxTurns: 2,
          timeout: 120000, // 2 minutes
          retryAttempts: 2,
        },
        tdd: {
          maxImplementationAttempts: 3,
          testQualityThreshold: 0.8,
          enableRefactoring: false, // Skip for speed
          skipDocumentation: true, // Skip for speed
          qualityGates: {
            enabled: true,
            strictMode: false,
            thresholds: {
              syntaxValidation: 1.0,
              testCoverage: 0.6,
              codeQuality: 0.5,
              documentation: 0.0, // Skip documentation
            },
          },
        },
        agents: {
          enableSpecialization: false, // Use generic for speed
          fallbackToGeneric: true,
        },
        output: {
          verbose: false,
          showMetrics: false,
          saveArtifacts: false,
        },
      };
    }
  }
  ```

○ **Checkpoint 5**: Configuration management system complete

---

## Phase 6: Audit Logging & Enhanced Monitoring

### 6.1 Audit Logging System in `src/utils/audit-logger.ts`

- [ ] **Create Comprehensive Audit Trail System**

  ```typescript
  import { promises as fs } from 'fs';
  import { join } from 'path';
  import { PhaseResult, WorkflowResult, TaskContext } from '../types';
  import { QualityGateReport } from '../tdd/quality-gates';
  import { z } from 'zod';
  
  // Audit event schemas
  export const AuditEventSchema = z.object({
    id: z.string(),
    timestamp: z.date(),
    sessionId: z.string(),
    workflowId: z.string().optional(),
    eventType: z.enum([
      'workflow_start',
      'workflow_end',
      'phase_start',
      'phase_end',
      'quality_gate',
      'agent_invocation',
      'error',
      'user_action',
      'config_change',
      'performance_metric'
    ]),
    source: z.string(), // Component that generated the event
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    data: z.record(z.any()).optional(),
    metadata: z.object({
      duration: z.number().optional(),
      tokenUsage: z.object({
        input: z.number(),
        output: z.number(),
        total: z.number(),
      }).optional(),
      qualityScore: z.number().optional(),
      agentType: z.string().optional(),
      phaseType: z.string().optional(),
    }).optional(),
  });
  
  export type AuditEvent = z.infer<typeof AuditEventSchema>;
  
  export interface AuditQuery {
    sessionId?: string;
    workflowId?: string;
    eventType?: string;
    severity?: string;
    source?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }
  
  export class AuditLogger {
    private sessionId: string;
    private auditPath: string;
    private buffer: AuditEvent[] = [];
    private bufferSize: number = 100;
    private autoFlushInterval: NodeJS.Timeout | null = null;
    
    constructor(sessionId: string, auditPath?: string) {
      this.sessionId = sessionId;
      this.auditPath = auditPath || join(process.cwd(), '.phoenix-code-lite', 'audit');
      this.setupAutoFlush();
    }
    
    // Core audit logging methods
    async logWorkflowStart(taskDescription: string, context: TaskContext): Promise<void> {
      await this.log({
        eventType: 'workflow_start',
        source: 'TDDOrchestrator',
        severity: 'medium',
        message: `Workflow started: ${taskDescription}`,
        data: {
          taskDescription,
          context: this.sanitizeContext(context),
        },
      });
    }
    
    async logWorkflowEnd(result: WorkflowResult): Promise<void> {
      await this.log({
        eventType: 'workflow_end',
        source: 'TDDOrchestrator',
        severity: result.success ? 'medium' : 'high',
        message: `Workflow ${result.success ? 'completed' : 'failed'}: ${result.taskDescription}`,
        data: {
          success: result.success,
          duration: result.duration,
          phases: result.phases.length,
          error: result.error,
        },
        metadata: {
          duration: result.duration,
          qualityScore: result.metadata?.overallQualityScore,
        },
      });
    }
    
    async logPhaseStart(phaseName: string, context: TaskContext): Promise<void> {
      await this.log({
        eventType: 'phase_start',
        source: `${phaseName}Phase`,
        severity: 'low',
        message: `Phase started: ${phaseName}`,
        data: { phaseName, context: this.sanitizeContext(context) },
        metadata: { phaseType: phaseName },
      });
    }
    
    async logPhaseEnd(result: PhaseResult): Promise<void> {
      const duration = result.endTime ? 
        result.endTime.getTime() - result.startTime.getTime() : 0;
      
      await this.log({
        eventType: 'phase_end',
        source: `${result.name}Phase`,
        severity: result.success ? 'low' : 'medium',
        message: `Phase ${result.success ? 'completed' : 'failed'}: ${result.name}`,
        data: {
          phaseName: result.name,
          success: result.success,
          artifacts: result.artifacts,
          error: result.error,
        },
        metadata: {
          duration,
          phaseType: result.name,
          qualityScore: result.metadata?.qualityReport?.overallScore,
        },
      });
    }
    
    async logQualityGate(report: QualityGateReport, phase: string): Promise<void> {
      await this.log({
        eventType: 'quality_gate',
        source: 'QualityGateManager',
        severity: report.overallPassed ? 'low' : 'medium',
        message: `Quality gate ${report.overallPassed ? 'passed' : 'failed'} for ${phase}`,
        data: {
          phase,
          overallScore: report.overallScore,
          overallPassed: report.overallPassed,
          gateResults: Object.keys(report.gateResults).map(gate => ({
            gate,
            passed: report.gateResults[gate].passed,
            score: report.gateResults[gate].score,
            issues: report.gateResults[gate].issues.length,
          })),
          recommendations: report.recommendations,
        },
        metadata: {
          qualityScore: report.overallScore,
          phaseType: phase,
        },
      });
    }
    
    async logAgentInvocation(
      agentType: string, 
      prompt: string, 
      response: any, 
      context: TaskContext
    ): Promise<void> {
      await this.log({
        eventType: 'agent_invocation',
        source: 'ClaudeCodeClient',
        severity: 'low',
        message: `Agent invoked: ${agentType}`,
        data: {
          agentType,
          promptLength: prompt.length,
          responseLength: response.content?.length || 0,
          tokenUsage: response.usage,
          context: this.sanitizeContext(context),
        },
        metadata: {
          tokenUsage: response.usage ? {
            input: response.usage.inputTokens || 0,
            output: response.usage.outputTokens || 0,
            total: (response.usage.inputTokens || 0) + (response.usage.outputTokens || 0),
          } : undefined,
          agentType,
        },
      });
    }
    
    async logError(error: Error, source: string, context?: any): Promise<void> {
      await this.log({
        eventType: 'error',
        source,
        severity: 'high',
        message: `Error occurred: ${error.message}`,
        data: {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          context,
        },
      });
    }
    
    async logUserAction(action: string, details?: any): Promise<void> {
      await this.log({
        eventType: 'user_action',
        source: 'CLI',
        severity: 'low',
        message: `User action: ${action}`,
        data: { action, details },
      });
    }
    
    async logConfigChange(key: string, oldValue: any, newValue: any): Promise<void> {
      await this.log({
        eventType: 'config_change',
        source: 'PhoenixCodeLiteConfig',
        severity: 'medium',
        message: `Configuration changed: ${key}`,
        data: { key, oldValue, newValue },
      });
    }
    
    async logPerformanceMetric(metric: string, value: number, unit: string): Promise<void> {
      await this.log({
        eventType: 'performance_metric',
        source: 'MetricsCollector',
        severity: 'low',
        message: `Performance metric: ${metric} = ${value} ${unit}`,
        data: { metric, value, unit },
      });
    }
    
    // Core logging infrastructure
    private async log(event: Partial<AuditEvent>): Promise<void> {
      const fullEvent: AuditEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        sessionId: this.sessionId,
        ...event,
      } as AuditEvent;
      
      // Validate event
      try {
        const validatedEvent = AuditEventSchema.parse(fullEvent);
        this.buffer.push(validatedEvent);
        
        // Auto-flush if buffer is full
        if (this.buffer.length >= this.bufferSize) {
          await this.flush();
        }
      } catch (error) {
        console.error('Failed to log audit event:', error);
      }
    }
    
    async flush(): Promise<void> {
      if (this.buffer.length === 0) return;
      
      try {
        await fs.mkdir(this.auditPath, { recursive: true });
        
        const logFile = join(this.auditPath, `audit-${this.sessionId}.jsonl`);
        const entries = this.buffer.map(event => JSON.stringify(event)).join('\n') + '\n';
        
        await fs.appendFile(logFile, entries, 'utf-8');
        this.buffer = [];
      } catch (error) {
        console.error('Failed to flush audit log:', error);
      }
    }
    
    // Query and analysis methods
    async query(query: AuditQuery): Promise<AuditEvent[]> {
      const logFile = join(this.auditPath, `audit-${query.sessionId || this.sessionId}.jsonl`);
      
      try {
        const content = await fs.readFile(logFile, 'utf-8');
        const events = content
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line) as AuditEvent)
          .map(event => ({
            ...event,
            timestamp: new Date(event.timestamp),
          }));
        
        return this.filterEvents(events, query);
      } catch (error) {
        console.error('Failed to query audit log:', error);
        return [];
      }
    }
    
    async generateReport(sessionId?: string): Promise<string> {
      const events = await this.query({ sessionId: sessionId || this.sessionId });
      
      if (events.length === 0) {
        return 'No audit events found.';
      }
      
      const report = this.buildAuditReport(events);
      return report;
    }
    
    async exportAudit(format: 'json' | 'csv' = 'json'): Promise<string> {
      const events = await this.query({ sessionId: this.sessionId });
      
      if (format === 'csv') {
        return this.exportAsCSV(events);
      }
      
      return JSON.stringify(events, null, 2);
    }
    
    // Utility methods
    private setupAutoFlush(): void {
      // Flush buffer every 30 seconds
      this.autoFlushInterval = setInterval(() => {
        this.flush().catch(error => {
          console.error('Auto-flush failed:', error);
        });
      }, 30000);
    }
    
    private generateEventId(): string {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    private sanitizeContext(context: TaskContext): any {
      // Remove sensitive information from context
      const { systemPrompt, ...sanitized } = context;
      return sanitized;
    }
    
    private filterEvents(events: AuditEvent[], query: AuditQuery): AuditEvent[] {
      let filtered = events;
      
      if (query.eventType) {
        filtered = filtered.filter(e => e.eventType === query.eventType);
      }
      
      if (query.severity) {
        filtered = filtered.filter(e => e.severity === query.severity);
      }
      
      if (query.source) {
        filtered = filtered.filter(e => e.source === query.source);
      }
      
      if (query.startTime) {
        filtered = filtered.filter(e => e.timestamp >= query.startTime!);
      }
      
      if (query.endTime) {
        filtered = filtered.filter(e => e.timestamp <= query.endTime!);
      }
      
      if (query.limit) {
        filtered = filtered.slice(0, query.limit);
      }
      
      return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    
    private buildAuditReport(events: AuditEvent[]): string {
      const startTime = events[0]?.timestamp;
      const endTime = events[events.length - 1]?.timestamp;
      const duration = endTime && startTime ? endTime.getTime() - startTime.getTime() : 0;
      
      const eventCounts = events.reduce((counts, event) => {
        counts[event.eventType] = (counts[event.eventType] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      const severityCounts = events.reduce((counts, event) => {
        counts[event.severity] = (counts[event.severity] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      const errors = events.filter(e => e.eventType === 'error');
      const workflows = events.filter(e => e.eventType === 'workflow_end');
      const successfulWorkflows = workflows.filter(e => e.data?.success === true);
      
      return `
  ⋇ Phoenix-Code-Lite Audit Report
  ═════════════════════════════════
  
  Session ID: ${this.sessionId}
  Time Range: ${startTime?.toISOString()} → ${endTime?.toISOString()}
  Duration: ${this.formatDuration(duration)}
  
  ◊ Event Summary:
  ├─ Total Events: ${events.length}
  ├─ Workflows: ${workflows.length} (${successfulWorkflows.length} successful)
  ├─ Errors: ${errors.length}
  └─ Quality Gates: ${eventCounts.quality_gate || 0}
  
  📈 Event Types:
  ${Object.entries(eventCounts)
    .map(([type, count]) => `├─ ${type}: ${count}`)
    .join('\n')}
  
  ⚠  Severity Distribution:
  ${Object.entries(severityCounts)
    .map(([severity, count]) => `├─ ${severity}: ${count}`)
    .join('\n')}
  
  ${errors.length > 0 ? `
  ⚡ Recent Errors:
  ${errors.slice(-5).map(error => 
    `├─ ${error.timestamp.toISOString()}: ${error.message}`
  ).join('\n')}
  ` : '✓ No errors recorded'}
      `.trim();
    }
    
    private exportAsCSV(events: AuditEvent[]): string {
      const headers = [
        'id', 'timestamp', 'sessionId', 'eventType', 'source', 
        'severity', 'message', 'duration', 'tokenUsage'
      ];
      
      const rows = events.map(event => [
        event.id,
        event.timestamp.toISOString(),
        event.sessionId,
        event.eventType,
        event.source,
        event.severity,
        event.message,
        event.metadata?.duration || '',
        event.metadata?.tokenUsage?.total || '',
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    }
    
    private formatDuration(ms: number): string {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    }
    
    // Cleanup
    async close(): Promise<void> {
      if (this.autoFlushInterval) {
        clearInterval(this.autoFlushInterval);
        this.autoFlushInterval = null;
      }
      
      await this.flush();
    }
  }
  ```

### 6.2 Enhanced Logging System in `src/utils/logger.ts`

- [ ] **Create Integrated Structured Logging with Audit Support**

  ```typescript
  import chalk from 'chalk';
  import { AuditLogger } from './audit-logger';
  
  export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
  }
  
  export class Logger {
    private level: LogLevel;
    private verbose: boolean;
    private auditLogger?: AuditLogger;
    
    constructor(verbose: boolean = false, auditLogger?: AuditLogger) {
      this.verbose = verbose;
      this.level = verbose ? LogLevel.DEBUG : LogLevel.INFO;
      this.auditLogger = auditLogger;
    }
    
    error(message: string, error?: any, source: string = 'Logger'): void {
      if (this.level >= LogLevel.ERROR) {
        console.error(chalk.red('✗ ERROR:'), message);
        if (error && this.verbose) {
          console.error(chalk.gray(error.stack || error.message || error));
        }
      }
      
      // Log to audit trail
      if (this.auditLogger && error) {
        this.auditLogger.logError(error instanceof Error ? error : new Error(message), source);
      }
    }
    
    warn(message: string): void {
      if (this.level >= LogLevel.WARN) {
        console.warn(chalk.yellow('⚠  WARN:'), message);
      }
    }
    
    info(message: string): void {
      if (this.level >= LogLevel.INFO) {
        console.log(chalk.blue('i  INFO:'), message);
      }
    }
    
    debug(message: string, data?: any): void {
      if (this.level >= LogLevel.DEBUG) {
        console.log(chalk.gray('🐛 DEBUG:'), message);
        if (data) {
          console.log(chalk.gray(JSON.stringify(data, null, 2)));
        }
      }
    }
    
    success(message: string): void {
      console.log(chalk.green('✓'), message);
    }
    
    phase(phaseName: string, step?: string): void {
      const stepText = step ? ` - ${step}` : '';
      console.log(chalk.cyan(`⇔ ${phaseName}${stepText}`));
    }
    
    // Audit-integrated methods
    workflow(message: string, isStart: boolean = true): void {
      const icon = isStart ? '^' : '🏁';
      console.log(chalk.magenta(`${icon} WORKFLOW:`), message);
    }
    
    quality(message: string, passed: boolean): void {
      const icon = passed ? '✓' : '⚠';
      const color = passed ? chalk.green : chalk.yellow;
      console.log(color(`${icon} QUALITY:`), message);
    }
    
    agent(agentType: string, action: string): void {
      console.log(chalk.blue('🤖 AGENT:'), `${agentType} - ${action}`);
    }
    
    metric(name: string, value: number, unit: string): void {
      console.log(chalk.cyan('◊ METRIC:'), `${name}: ${value}${unit}`);
    }
    
    // Configuration
    setAuditLogger(auditLogger: AuditLogger): void {
      this.auditLogger = auditLogger;
    }
    
    setLevel(level: LogLevel): void {
      this.level = level;
    }
    
    setVerbose(verbose: boolean): void {
      this.verbose = verbose;
      this.level = verbose ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }
  ```

### 6.2 Metrics Collection in `src/utils/metrics.ts`

- [ ] **Create Metrics System**

  ```typescript
  import { WorkflowResult, PhaseResult } from '../types';
  import { promises as fs } from 'fs';
  import { join } from 'path';
  
  export interface SessionMetrics {
    sessionId: string;
    startTime: Date;
    totalWorkflows: number;
    successfulWorkflows: number;
    failedWorkflows: number;
    averageDuration: number;
    totalTokensUsed: number;
    estimatedCost: number;
    qualityMetrics: QualityMetrics;
  }
  
  export interface QualityMetrics {
    averageTestCoverage: number;
    averageComplexity: number;
    documentationCoverage: number;
    codeQualityScore: number;
  }
  
  export class MetricsCollector {
    private sessionId: string;
    private startTime: Date;
    private workflows: WorkflowResult[] = [];
    
    constructor() {
      this.sessionId = this.generateSessionId();
      this.startTime = new Date();
    }
    
    async recordWorkflow(workflow: WorkflowResult): Promise<void> {
      this.workflows.push(workflow);
      
      // Save metrics to file
      await this.saveMetrics();
    }
    
    generateReport(): string {
      const metrics = this.calculateMetrics();
      
      return `
  ◊ Phoenix-Code-Lite Session Report
  ═══════════════════════════════
  
  Session ID: ${metrics.sessionId}
  Duration: ${this.formatDuration(Date.now() - this.startTime.getTime())}
  
  📈 Workflow Summary:
  ├─ Total Workflows: ${metrics.totalWorkflows}
  ├─ Successful: ${metrics.successfulWorkflows}
  ├─ Failed: ${metrics.failedWorkflows}
  └─ Success Rate: ${((metrics.successfulWorkflows / metrics.totalWorkflows) * 100).toFixed(1)}%
  
  ⚡ Performance:
  ├─ Average Duration: ${this.formatDuration(metrics.averageDuration)}
  ├─ Total Tokens: ${metrics.totalTokensUsed.toLocaleString()}
  └─ Estimated Cost: $${metrics.estimatedCost.toFixed(4)}
  
  🏆 Quality Metrics:
  ├─ Avg Test Coverage: ${(metrics.qualityMetrics.averageTestCoverage * 100).toFixed(1)}%
  ├─ Avg Complexity: ${metrics.qualityMetrics.averageComplexity.toFixed(1)}
  ├─ Documentation: ${(metrics.qualityMetrics.documentationCoverage * 100).toFixed(1)}%
  └─ Code Quality: ${metrics.qualityMetrics.codeQualityScore.toFixed(1)}/10
      `.trim();
    }
    
    private calculateMetrics(): SessionMetrics {
      const successful = this.workflows.filter(w => w.success);
      const totalDuration = this.workflows.reduce((sum, w) => sum + (w.duration || 0), 0);
      
      return {
        sessionId: this.sessionId,
        startTime: this.startTime,
        totalWorkflows: this.workflows.length,
        successfulWorkflows: successful.length,
        failedWorkflows: this.workflows.length - successful.length,
        averageDuration: this.workflows.length > 0 ? totalDuration / this.workflows.length : 0,
        totalTokensUsed: this.calculateTotalTokens(),
        estimatedCost: this.calculateEstimatedCost(),
        qualityMetrics: this.calculateQualityMetrics(),
      };
    }
    
    private async saveMetrics(): Promise<void> {
      const metricsDir = join(process.cwd(), '.phoenix-code-lite', 'metrics');
      await fs.mkdir(metricsDir, { recursive: true });
      
      const metrics = this.calculateMetrics();
      const filePath = join(metricsDir, `session-${this.sessionId}.json`);
      
      await fs.writeFile(filePath, JSON.stringify(metrics, null, 2));
    }
  }
  ```

### 6.3 Validation Utilities in `src/utils/validation.ts`

- [ ] **Create Validation Helpers**

  ```typescript
  import { TaskContext } from '../types';
  
  export class ValidationUtils {
    static validateTaskDescription(task: string): string[] {
      const errors: string[] = [];
      
      if (!task || task.trim().length === 0) {
        errors.push('Task description is required');
      }
      
      if (task.length < 10) {
        errors.push('Task description is too short (minimum 10 characters)');
      }
      
      if (task.length > 1000) {
        errors.push('Task description is too long (maximum 1000 characters)');
      }
      
      // Check for vague descriptions
      const vagueTerms = ['better', 'good', 'nice', 'some', 'stuff', 'things'];
      const lowerTask = task.toLowerCase();
      const hasVagueTerms = vagueTerms.some(term => lowerTask.includes(term));
      
      if (hasVagueTerms) {
        errors.push('Task description appears vague. Be more specific about requirements.');
      }
      
      return errors;
    }
    
    static validateProjectPath(path: string): Promise<boolean> {
      return new Promise((resolve) => {
        // Use Claude Code to validate project path
        resolve(true); // Simplified for now
      });
    }
    
    static validateLanguageFramework(language?: string, framework?: string): string[] {
      const errors: string[] = [];
      
      // Define supported combinations
      const supportedCombinations = {
        'javascript': ['express', 'react', 'vue', 'node'],
        'typescript': ['express', 'react', 'vue', 'node', 'nest'],
        'python': ['flask', 'django', 'fastapi'],
        'rust': ['actix', 'rocket', 'warp'],
        'go': ['gin', 'echo', 'fiber'],
      };
      
      if (language && framework) {
        const supported = supportedCombinations[language.toLowerCase()];
        if (supported && !supported.includes(framework.toLowerCase())) {
          errors.push(`Framework '${framework}' is not commonly used with '${language}'`);
        }
      }
      
      return errors;
    }
  }
  ```

○ **Checkpoint 6**: Complete utilities for logging, metrics, and validation

---

## Phase 7: Testing & Quality Assurance

### 7.1 Unit Tests

- [ ] **Create Test Setup in `tests/unit/`**

  ```typescript
  // tests/unit/orchestrator.test.ts
  import { TDDOrchestrator } from '../../src/tdd/orchestrator';
  import { ClaudeCodeClient } from '../../src/claude/client';
  
  // Mock Claude Code Client
  const mockClaudeClient = {
    query: jest.fn(),
    executeCommand: jest.fn(),
    editFile: jest.fn(),
  } as jest.Mocked<ClaudeCodeClient>;
  
  describe('TDDOrchestrator', () => {
    let orchestrator: TDDOrchestrator;
    
    beforeEach(() => {
      orchestrator = new TDDOrchestrator(mockClaudeClient);
      jest.clearAllMocks();
    });
    
    it('should execute all three phases successfully', async () => {
      // Mock successful responses
      mockClaudeClient.query
        .mockResolvedValueOnce({ content: 'Plan and tests created', usage: {} })
        .mockResolvedValueOnce({ content: 'Implementation created', usage: {} })
        .mockResolvedValueOnce({ content: 'Code refactored and documented', usage: {} });
      
      mockClaudeClient.executeCommand
        .mockResolvedValue({ stdout: 'Tests passed', stderr: '', exitCode: 0, duration: 1000 });
      
      const context = {
        taskDescription: 'Create a hello world function',
        projectPath: '/tmp/test',
      };
      
      const result = await orchestrator.executeWorkflow('Create a hello world function', context);
      
      expect(result.success).toBe(true);
      expect(result.phases).toHaveLength(3);
      expect(mockClaudeClient.query).toHaveBeenCalledTimes(3);
    });
    
    it('should handle planning phase failure', async () => {
      mockClaudeClient.query.mockRejectedValueOnce(new Error('Planning failed'));
      
      const context = {
        taskDescription: 'Invalid task',
        projectPath: '/tmp/test',
      };
      
      const result = await orchestrator.executeWorkflow('Invalid task', context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Planning failed');
    });
  });
  ```

- [ ] **CLI Command Tests**

  ```typescript
  // tests/unit/cli.test.ts
  import { generateCommand } from '../../src/cli/commands';
  import { PhoenixCodeLiteOptions } from '../../src/cli/args';
  
  // Mock dependencies
  jest.mock('../../src/claude/client');
  jest.mock('../../src/tdd/orchestrator');
  
  describe('CLI Commands', () => {
    it('should handle generate command with valid options', async () => {
      const options: PhoenixCodeLiteOptions = {
        task: 'Create a calculator function',
        projectPath: '/tmp/test',
        verbose: true,
      };
      
      // Should not throw
      await expect(generateCommand(options)).resolves.not.toThrow();
    });
    
    it('should validate required task parameter', async () => {
      const options: PhoenixCodeLiteOptions = {
        task: '', // Invalid empty task
      };
      
      await expect(generateCommand(options)).rejects.toThrow('Task description is required');
    });
  });
  ```

### 7.2 Integration Tests

- [ ] **Create End-to-End Tests**

  ```typescript
  // tests/integration/workflow.test.ts
  import { TDDOrchestrator } from '../../src/tdd/orchestrator';
  import { ClaudeCodeClient } from '../../src/claude/client';
  import { tmpdir } from 'os';
  import { join } from 'path';
  import { mkdtemp, rm } from 'fs/promises';
  
  describe('Integration: Complete Workflow', () => {
    let tempDir: string;
    let orchestrator: TDDOrchestrator;
    
    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'phoenix-code-lite-test-'));
      
      // Use real Claude Code client but in test mode
      const claudeClient = new ClaudeCodeClient({
        projectPath: tempDir,
        testMode: true, // If available
      });
      
      orchestrator = new TDDOrchestrator(claudeClient);
    });
    
    afterEach(async () => {
      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
    
    it('should complete a simple hello world task', async () => {
      const context = {
        taskDescription: 'Create a hello world function that takes a name and returns a greeting',
        projectPath: tempDir,
        language: 'javascript',
      };
      
      const result = await orchestrator.executeWorkflow(
        'Create a hello world function that takes a name and returns a greeting',
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.phases).toHaveLength(3);
      
      // Verify files were created
      // Note: This would require actual Claude Code integration
    }, 60000); // 1 minute timeout for integration test
  });
  ```

### 7.3 Test Configuration

- [ ] **Setup Jest Configuration**

  ```json
  // jest.config.js
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/index.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  };
  ```

- [ ] **Create Test Setup File**

  ```typescript
  // tests/setup.ts
  import { jest } from '@jest/globals';
  
  // Global test setup
  jest.setTimeout(30000); // 30 seconds default timeout
  
  // Mock console methods in test environment
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };
  ```

○ **Checkpoint 7**: Comprehensive test suite with unit and integration tests

---

## Phase 8: Documentation & Examples

### 8.1 User Documentation

- [ ] **Create README.md**

  ```markdown
  # Phoenix-Code-Lite: TDD Workflow Orchestrator for Claude Code
  
  Phoenix-Code-Lite brings the power of Test-Driven Development to Claude Code, enabling autonomous AI-driven software development through a structured three-phase workflow.
  
  ## ^ Quick Start
  
  >```bash
    # Install Phoenix-Code-Lite
    npm install -g phoenix-code-lite
    
    # Initialize in your project
    phoenix-code-lite init
    
    # Generate code using TDD workflow
    phoenix-code-lite generate --task "Create a user authentication system with JWT"
  >```
  
  ## ✨ Features
  
  - 🧪 **Automated TDD Cycle**: Plan → Test → Implement → Refactor
  - ⇔ **Self-Correcting**: Automatic retry and error fixing
  - ◊ **Quality Metrics**: Comprehensive code quality tracking
  - ○ **Claude Code Integration**: Seamless workflow within Claude Code
  - ⚡ **Rapid Development**: Generate working code in minutes
  
  ## ⋇ How It Works
  
  Phoenix-Code-Lite orchestrates a three-phase TDD workflow:
  
  1. **Plan & Test Phase**: Analyzes your task and generates comprehensive tests
  2. **Implement & Fix Phase**: Writes minimal code to pass tests with automatic retries
  3. **Refactor & Document Phase**: Improves code quality and adds documentation
  
  ## ○ Best Practices
  
  ### Good Task Descriptions

  ✓ "Create a REST API endpoint for user registration with email validation and password hashing"
  ✓ "Implement a binary search algorithm with comprehensive edge case testing"
  ✓ "Add error handling to the payment processor with retry logic and logging"
  
  ### Poor Task Descriptions  

  ✗ "Make the code better"
  ✗ "Fix everything"
  ✗ "Add some features"
  
  ## 📚 Documentation
  
  - [Usage Guide](./docs/usage.md)
  - [Configuration Reference](./docs/configuration.md)
  - [API Documentation](./docs/api.md)
  - [Examples](./examples/)

  ```

### 8.2 Example Projects

- [ ] **Create Hello World Example**

  ```markdown
  # examples/hello-world/README.md
  
  # Hello World Example
  
  This example demonstrates Phoenix-Code-Lite's basic functionality by creating a simple greeting function.
  
  ## Task Description
  "Create a hello world function that takes a name parameter and returns a personalized greeting message. Include comprehensive tests for different input scenarios including edge cases."
  
  ## Running This Example
  
  >```bash
    cd examples/hello-world
    phoenix-code-lite generate --task "$(cat task.md)"
  >```
  
  ## Expected Output
  
  Phoenix-Code-Lite will generate:
  - Test files with comprehensive coverage
  - Implementation that passes all tests
  - Documentation and usage examples
  - Refactored, production-ready code
  
  ## Generated Files
  
  >```text
    src/
    ├── hello.js          # Main implementation
    └── hello.test.js     # Comprehensive tests
    docs/
    └── hello.md          # Generated documentation
  >```

  ```

- [ ] **Create Web API Example**

  ```markdown
  # examples/web-api/README.md
  
  # REST API Example
  
  This example shows Phoenix-Code-Lite creating a complete REST API with Express.js.
  
  ## Task Description
  "Create a REST API with Express.js for user management including GET /users, POST /users, PUT /users/:id, and DELETE /users/:id endpoints. Include input validation, error handling, and comprehensive tests."
  
  ## Features Demonstrated
  - RESTful endpoint design
  - Input validation with middleware
  - Error handling and HTTP status codes
  - Comprehensive API testing
  - Documentation generation
  
  ## Generated Structure
  
  >```text
    src/
    ├── app.js           # Express app setup
    ├── routes/
    │   └── users.js     # User routes
    ├── middleware/
    │   └── validation.js # Input validation
    └── models/
        └── user.js      # User model
    tests/
    ├── integration/
    │   └── users.test.js # API integration tests
    └── unit/
        └── validation.test.js # Unit tests
  >```

  ```

### 8.3 API Documentation

- [ ] **Generate TypeScript Declarations**

  ```typescript
  // src/types/index.ts - Export all public types
  export * from './workflow';
  export * from './task';
  export * from './config';
  
  // Main API exports
  export { TDDOrchestrator } from '../tdd/orchestrator';
  export { ClaudeCodeClient } from '../claude/client';
  export { PhoenixCodeLiteConfig } from '../config/settings';
  ```

- [ ] **Create API Documentation**

  ```markdown
  # docs/api.md
  
  # Phoenix-Code-Lite API Reference
  
  ## TDDOrchestrator
  
  Main class for orchestrating the TDD workflow.
  
  ### Constructor
  >```typescript
    constructor(claudeClient: ClaudeCodeClient)
  >```
  
  ### Methods
  
  #### executeWorkflow(taskDescription, context)

  Executes the complete TDD workflow.
  
  **Parameters:**
  - `taskDescription` (string): Description of the task to implement
  - `context` (TaskContext): Execution context including project path, language, etc.
  
  **Returns:** Promise<WorkflowResult>
  
  **Example:**

  >```typescript
    const orchestrator = new TDDOrchestrator(claudeClient);
    const result = await orchestrator.executeWorkflow(
      "Create a calculator function",
      { projectPath: "./my-project", language: "javascript" }
    );
  >```
  
  ## ClaudeCodeClient
  
  Client for interacting with Claude Code SDK.
  
  ### Methods
  
  #### query(prompt, context?)

  Send a query to Claude Code.
  
  #### executeCommand(command)

  Execute a shell command via Claude Code.
  
  #### editFile(filePath, content)

  Edit a file using Claude Code's file editing capabilities.

  ```

○ **Checkpoint 8**: Complete documentation with examples and API reference

---

## Final Phase: Production Readiness

### 9.1 Build Configuration

- [ ] **Setup Build Scripts in package.json**

  ```json
  {
    "scripts": {
      "build": "tsc",
      "build:watch": "tsc --watch",
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      "lint": "eslint src --ext .ts",
      "lint:fix": "eslint src --ext .ts --fix",
      "format": "prettier --write src/**/*.ts",
      "prepublishOnly": "npm run build && npm test",
      "start": "node dist/index.js",
      "dev": "ts-node src/index.ts"
    },
    "bin": {
      "phoenix-code-lite": "./dist/index.js"
    },
    "files": [
      "dist",
      "README.md",
      "LICENSE"
    ]
  }
  ```

### 9.2 Quality Gates

- [ ] **ESLint Configuration**

  ```json
  // .eslintrc.json
  {
    "extends": [
      "@typescript-eslint/recommended",
      "prettier"
    ],
    "parser": "@typescript-eslint/parser",
    "plugins": ["@typescript-eslint"],
    "rules": {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  }
  ```

- [ ] **Prettier Configuration**

  ```json
  // .prettierrc
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2
  }
  ```

### 9.3 Final Validation

- [ ] **Run Complete Test Suite**
  - [ ] Unit tests: `npm test`
  - [ ] Integration tests: `npm run test:integration`  
  - [ ] Coverage check: `npm run test:coverage`
  - [ ] Linting: `npm run lint`
  - [ ] Build verification: `npm run build`

- [ ] **Manual Testing Checklist**
  - [ ] CLI help works: `phoenix-code-lite --help`
  - [ ] Init command works: `phoenix-code-lite init`
  - [ ] Generate command works with simple task
  - [ ] Generate command works with complex task
  - [ ] Configuration management works
  - [ ] Error handling is graceful
  - [ ] Metrics collection works
  - [ ] All examples execute successfully

### 9.4 Publication Preparation

- [ ] **Package Metadata**

  ```json
  {
    "name": "phoenix-code-lite",
    "version": "1.0.0",
    "description": "TDD workflow orchestrator for Claude Code",
    "keywords": ["tdd", "claude-code", "ai", "development", "testing"],
    "homepage": "https://github.com/yourusername/phoenix-code-lite",
    "repository": {
      "type": "git",
      "url": "https://github.com/yourusername/phoenix-code-lite.git"
    },
    "bugs": {
      "url": "https://github.com/yourusername/phoenix-code-lite/issues"
    },
    "author": "Your Name <your.email@example.com>",
    "license": "MIT"
  }
  ```

- [ ] **Create LICENSE file**
- [ ] **Version git tags**
- [ ] **Prepare for npm publish**

○ **Final Checkpoint**: Production-ready Phoenix-Code-Lite with complete build system

---

## ^ V2 Advanced Features (Post-Launch)

### Phase 9: Per-Agent Document Context System

**Estimated Time**: 8-12 hours  
**Priority**: Medium (V2 Feature)

#### 9.1 Agent-Specific Context Management in `src/agents/context-manager.ts`

- [ ] **Create Per-Agent Context System**

  ```typescript
  import { promises as fs } from 'fs';
  import { join } from 'path';
  import { z } from 'zod';
  
  export const AgentContextSchema = z.object({
    agentId: z.string(),
    agentType: z.enum(['planningAnalyst', 'implementationEngineer', 'qualityReviewer']),
    sessionId: z.string(),
    contextWindow: z.array(z.object({
      timestamp: z.date(),
      type: z.enum(['task_input', 'analysis_output', 'implementation', 'feedback', 'knowledge']),
      content: z.string(),
      metadata: z.record(z.any()).optional(),
    })),
    knowledge: z.object({
      patterns: z.array(z.string()),
      preferences: z.record(z.any()),
      commonMistakes: z.array(z.string()),
      successfulApproaches: z.array(z.string()),
    }),
    performance: z.object({
      successRate: z.number(),
      averageResponseTime: z.number(),
      qualityScore: z.number(),
      improvementTrends: z.array(z.number()),
    }),
  });
  
  export type AgentContext = z.infer<typeof AgentContextSchema>;
  
  export class AgentContextManager {
    private contextPath: string;
    private contexts: Map<string, AgentContext> = new Map();
    
    constructor(contextPath?: string) {
      this.contextPath = contextPath || join(process.cwd(), '.phoenix-code-lite', 'agents');
    }
    
    async loadAgentContext(agentId: string, agentType: string): Promise<AgentContext> {
      const contextFile = join(this.contextPath, `${agentId}.json`);
      
      try {
        const content = await fs.readFile(contextFile, 'utf-8');
        const rawContext = JSON.parse(content);
        const context = AgentContextSchema.parse({
          ...rawContext,
          contextWindow: rawContext.contextWindow.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
        });
        
        this.contexts.set(agentId, context);
        return context;
      } catch (error) {
        // Create new context if file doesn't exist
        const newContext = this.createDefaultContext(agentId, agentType);
        this.contexts.set(agentId, newContext);
        return newContext;
      }
    }
    
    async saveAgentContext(agentId: string): Promise<void> {
      const context = this.contexts.get(agentId);
      if (!context) return;
      
      await fs.mkdir(this.contextPath, { recursive: true });
      const contextFile = join(this.contextPath, `${agentId}.json`);
      
      const serializable = {
        ...context,
        contextWindow: context.contextWindow.map(item => ({
          ...item,
          timestamp: item.timestamp.toISOString(),
        })),
      };
      
      await fs.writeFile(contextFile, JSON.stringify(serializable, null, 2));
    }
    
    addContextEntry(
      agentId: string, 
      type: 'task_input' | 'analysis_output' | 'implementation' | 'feedback' | 'knowledge',
      content: string,
      metadata?: any
    ): void {
      const context = this.contexts.get(agentId);
      if (!context) return;
      
      context.contextWindow.push({
        timestamp: new Date(),
        type,
        content,
        metadata,
      });
      
      // Keep only last 100 entries
      if (context.contextWindow.length > 100) {
        context.contextWindow = context.contextWindow.slice(-100);
      }
    }
    
    updateAgentKnowledge(agentId: string, knowledge: Partial<AgentContext['knowledge']>): void {
      const context = this.contexts.get(agentId);
      if (!context) return;
      
      context.knowledge = { ...context.knowledge, ...knowledge };
    }
    
    updatePerformanceMetrics(agentId: string, metrics: Partial<AgentContext['performance']>): void {
      const context = this.contexts.get(agentId);
      if (!context) return;
      
      context.performance = { ...context.performance, ...metrics };
    }
    
    getContextualPrompt(agentId: string, basePrompt: string): string {
      const context = this.contexts.get(agentId);
      if (!context) return basePrompt;
      
      const recentContext = context.contextWindow
        .slice(-10)
        .map(entry => `${entry.type}: ${entry.content.substring(0, 200)}...`)
        .join('\n');
      
      const knowledgeContext =
        'Previous successful approaches:\n' +
        context.knowledge.successfulApproaches.slice(-3).join('\n') +
        '\n\nCommon patterns to avoid:\n' +
        context.knowledge.commonMistakes.slice(-3).join('\n');

      return `${basePrompt}

    Context from recent work:
    ${recentContext}

    ${knowledgeContext}

    Based on your performance history (${(context.performance.qualityScore * 100).toFixed(1)}% quality score),
    focus on your strengths while being mindful of past challenges.`;
    }
  }
  ```

#### 9.2 Context-Aware Agent Integration in `src/claude/enhanced-client.ts`

- [ ] **Enhance Claude Client with Context Management**

  ```typescript
  import { ClaudeCodeClient } from './client';
  import { AgentContextManager } from '../agents/context-manager';
  import { AgentPersona } from '../types/agents';
  
  export class ContextAwareClaudeClient extends ClaudeCodeClient {
    private contextManager: AgentContextManager;
    
    constructor(options: any, contextManager: AgentContextManager) {
      super(options);
      this.contextManager = contextManager;
    }
    
    async queryWithContext(
      prompt: string, 
      context: TaskContext, 
      persona: AgentPersona,
      agentId: string
    ): Promise<LLMResponse> {
      // Load agent context
      const agentContext = await this.contextManager.loadAgentContext(agentId, persona.role);
      
      // Create contextual prompt
      const contextualPrompt = this.contextManager.getContextualPrompt(agentId, prompt);
      
      // Record task input
      this.contextManager.addContextEntry(agentId, 'task_input', prompt);
      
      // Execute query
      const response = await this.query(contextualPrompt, context, persona);
      
      // Record response
      this.contextManager.addContextEntry(agentId, 'analysis_output', response.content);
      
      // Update performance metrics
      const qualityScore = this.calculateResponseQuality(response);
      this.contextManager.updatePerformanceMetrics(agentId, {
        qualityScore: (agentContext.performance.qualityScore + qualityScore) / 2,
      });
      
      // Save context
      await this.contextManager.saveAgentContext(agentId);
      
      return response;
    }
    
    private calculateResponseQuality(response: LLMResponse): number {
      // Simple quality heuristics
      let score = 0.5; // Base score
      
      if (response.content.length > 100) score += 0.1;
      if (response.content.includes('```')) score += 0.1; // Has code examples
      if (response.content.includes('test')) score += 0.1; // Mentions testing
      if (response.content.match(/\d+\./)) score += 0.1; // Has numbered steps
      
      return Math.min(1.0, score);
    }
  }
  ```

○ **Checkpoint 9**: Per-agent context system with memory and learning

---

### Phase 10: Dynamic Agent Creation System

**Estimated Time**: 6-10 hours  
**Priority**: Low (V2 Feature)

#### 10.1 Dynamic Agent Factory in `src/agents/dynamic-factory.ts`

- [ ] **Create Dynamic Agent Generation System**

  ```typescript
  import { AgentPersona } from '../types/agents';
  import { z } from 'zod';
  
  export const DynamicAgentRequestSchema = z.object({
    specialization: z.string(),
    taskType: z.string(),
    requiredExpertise: z.array(z.string()),
    qualityStandards: z.array(z.string()),
    outputFormat: z.string(),
    contextualHints: z.array(z.string()).optional(),
  });
  
  export type DynamicAgentRequest = z.infer<typeof DynamicAgentRequestSchema>;
  
  export class DynamicAgentFactory {
    private agentTemplates: Map<string, Partial<AgentPersona>> = new Map();
    
    constructor() {
      this.initializeBaseTemplates();
    }
    
    createSpecializedAgent(request: DynamicAgentRequest): AgentPersona {
      const baseTemplate = this.selectBestTemplate(request);
      
      return {
        role: `Specialized ${request.specialization}`,
        expertise: [...baseTemplate.expertise || [], ...request.requiredExpertise],
        approach: this.generateApproach(request),
        quality_standards: request.qualityStandards,
        output_format: request.outputFormat,
        systemPrompt: this.generateSystemPrompt(request, baseTemplate),
      };
    }
    
    private initializeBaseTemplates(): void {
      this.agentTemplates.set('security', {
        role: 'Security Specialist',
        expertise: ['security', 'encryption', 'authentication', 'vulnerability assessment'],
        approach: 'security-first, comprehensive, risk-aware',
      });
      
      this.agentTemplates.set('performance', {
        role: 'Performance Engineer',
        expertise: ['optimization', 'profiling', 'caching', 'scalability'],
        approach: 'data-driven, measurement-focused, systematic',
      });
      
      this.agentTemplates.set('ui-ux', {
        role: 'UI/UX Specialist',
        expertise: ['user experience', 'accessibility', 'design systems', 'usability'],
        approach: 'user-centered, inclusive, evidence-based',
      });
    }
    
    private selectBestTemplate(request: DynamicAgentRequest): Partial<AgentPersona> {
      let bestMatch = { template: 'general', score: 0 };
      
      for (const [templateName, template] of this.agentTemplates.entries()) {
        const overlap = request.requiredExpertise.filter(skill => 
          template.expertise?.includes(skill)
        ).length;
        
        if (overlap > bestMatch.score) {
          bestMatch = { template: templateName, score: overlap };
        }
      }
      
      return this.agentTemplates.get(bestMatch.template) || {};
    }
    
    private generateApproach(request: DynamicAgentRequest): string {
      const approaches = [
        'methodical and systematic',
        'detail-oriented and thorough',
        'pragmatic and efficient',
        'innovative and creative',
      ];
      
      // Select approach based on task type
      if (request.taskType.includes('analysis')) return approaches[0];
      if (request.taskType.includes('implementation')) return approaches[2];
      if (request.taskType.includes('design')) return approaches[3];
      
      return approaches[1]; // default
    }
    
    private generateSystemPrompt(request: DynamicAgentRequest, template: Partial<AgentPersona>): string {
      return `You are a ${request.specialization} specialist with expertise in: ${request.requiredExpertise.join(', ')}.
  
  Your approach: ${this.generateApproach(request)}
  Your quality standards: ${request.qualityStandards.join(', ')}
  Expected output format: ${request.outputFormat}
  
  ${request.contextualHints?.length ? 
    `Additional context: ${request.contextualHints.join('. ')}` : ''}
  
  Focus on delivering high-quality results that meet the specified standards while leveraging your specialized expertise.`;
    }
  }
  ```

#### 10.2 Agent Registry in `src/agents/registry.ts`

- [ ] **Create Agent Management Registry**

  ```typescript
  export class AgentRegistry {
    private activeAgents: Map<string, AgentPersona> = new Map();
    private agentPerformance: Map<string, AgentPerformanceMetrics> = new Map();
    
    registerAgent(agentId: string, agent: AgentPersona): void {
      this.activeAgents.set(agentId, agent);
      this.agentPerformance.set(agentId, {
        tasksCompleted: 0,
        successRate: 0,
        averageQuality: 0,
        specializations: agent.expertise,
      });
    }
    
    getAgent(agentId: string): AgentPersona | undefined {
      return this.activeAgents.get(agentId);
    }
    
    getBestAgentForTask(taskType: string, requiredSkills: string[]): string | undefined {
      let bestAgent = { id: '', score: 0 };
      
      for (const [agentId, agent] of this.activeAgents.entries()) {
        const skillMatch = requiredSkills.filter(skill => 
          agent.expertise.includes(skill)
        ).length / requiredSkills.length;
        
        const performance = this.agentPerformance.get(agentId);
        const performanceScore = performance ? performance.successRate * performance.averageQuality : 0.5;
        
        const totalScore = (skillMatch * 0.7) + (performanceScore * 0.3);
        
        if (totalScore > bestAgent.score) {
          bestAgent = { id: agentId, score: totalScore };
        }
      }
      
      return bestAgent.id || undefined;
    }
    
    updateAgentPerformance(agentId: string, metrics: Partial<AgentPerformanceMetrics>): void {
      const current = this.agentPerformance.get(agentId);
      if (current) {
        this.agentPerformance.set(agentId, { ...current, ...metrics });
      }
    }
    
    listActiveAgents(): Array<{ id: string; agent: AgentPersona; performance: AgentPerformanceMetrics }> {
      return Array.from(this.activeAgents.entries()).map(([id, agent]) => ({
        id,
        agent,
        performance: this.agentPerformance.get(id)!,
      }));
    }
  }
  ```

○ **Checkpoint 10**: Dynamic agent creation and management system

---

## ◊ Updated Progress Overview

- **Total Tasks**: 127 micro-tasks across 12 integrated phases  
- **Estimated Time**:48-66 hours for complete system (V1 + V2)
  - **V1 (Core Features)**: 34-44 hours across 8 phases
  - **V2 (Advanced Features)**: 14-22 hours across 4 additional phases
- **Architecture**: Extension/Plugin for Claude Code ecosystem with enterprise-ready features and advanced AI capabilities

## * Success Criteria

Upon completion, Phoenix-Code-Lite should achieve:

### V1 Core Requirements

|  *Metric*                     |  *Target*                |  *Validation*           |
| ----------------------------- | ------------------------ | ----------------------- |
|  **CLI Functionality**        |  All commands work       |  Manual testing         |
|  **TDD Workflow**             |  Complete 3-phase cycle  |  Integration tests      |
|  **Claude Code Integration**  |  Seamless SDK usage      |  Real workflow tests    |
|  **Code Quality**             |  >90% test coverage      |  Jest coverage report   |
|  **Documentation**            |  Complete user guide     |  Manual review          |
|  **Examples**                 |  All examples work       |  Automated testing      |
|  **Error Handling**           |  Graceful degradation    |  Error scenario tests   |
|  **Performance**              |  <2 min per simple task  |  Benchmark testing      |
|  **Quality Gates**            |  Comprehensive validation|  Quality metrics        |
|  **Audit Trail**              |  Complete activity log   |  Audit report generation|

### V2 Advanced Features

|  *Metric*                     |  *Target*                |  *Validation*           |
| ----------------------------- | ------------------------ | ----------------------- |
|  **Agent Context**            |  Per-agent memory        |  Context persistence    |
|  **Dynamic Agents**           |  Task-specific creation  |  Agent effectiveness    |
|  **Learning System**          |  Performance improvement |  Metrics trending       |
|  **Specialization**           |  Domain-specific agents  |  Quality improvements   |

---

## ^ Getting Started

1. **Choose Your Approach:**
     - **Claude Code Assisted**: Use Claude Code (this session) to build step-by-step with AI guidance
     - **Manual Development**: Follow the roadmap independently as a detailed implementation guide
     - **Team Development**: Distribute phases across team members with clear handoffs at checkpoints
     - **V1 Core Only**: Focus on Phases 1-8 for essential TDD functionality, skip V2 advanced features
     - **Enterprise Focus**: Prioritize audit logging, quality gates, and configuration management
     - **Learning Path**: Study the roadmap as an educational resource for TDD and AI development patterns

2. **Start with Phase 1:**

   ```bash
   mkdir phoenix-code-lite\
   cd phoenix-code-lite
   npm init -y
   ```

3. **Follow the Checklist:**
   - Check off each micro-task as completed
   - Validate at each checkpoint
   - Ask for help when stuck

**Estimated completion time: 20-30 hours**  
**Result: Production-ready Phoenix-Code-Lite TDD orchestrator**

This streamlined approach leverages Claude Code's existing infrastructure while focusing on the core TDD workflow logic, resulting in a much cleaner and more maintainable implementation than the original Phoenix-Lite design. *
