# Phoenix-Code-Lite Enhancement Proposal

> Strategic improvements to Phoenix-Code-Lite that maintain simplicity while incorporating key Phoenix Framework architectural principles

## Enhancement Philosophy

### Core Principle: Simplicity First

Phoenix-Code-Lite's primary value is its **streamlined approach** and **minimal setup**. Any enhancements must:

- ✓ **Preserve simplicity** - No complex setup or configuration required
- ✓ **Remain optional** - Core functionality unchanged if features not used
- ✓ **Add incremental value** - Each enhancement provides clear, immediate benefit
- ✓ **Maintain TDD focus** - Enhancements support the core TDD workflow
- ✓ **Keep lightweight** - No significant performance or complexity overhead

### Target Phoenix Alignment

While maintaining Phoenix-Code-Lite's streamlined nature, selectively incorporate Phoenix Framework principles that provide high value with low complexity:

|  *Phoenix Principle*           |  *Enhancement Level*       |  *Rationale*                         |
| ------------------------------ | -------------------------- | ------------------------------------ |
|  **Code-as-Data Paradigm**     |  ✓ Basic Implementation    |  High value, manageable complexity   |
|  **Agent Specialization**      |  ✓ Simple Prompt Contexts  |  Significant quality improvement     |
|  **Quality Gates**             |  ✓ Basic Validation        |  Essential for reliability           |
|  **Audit Trails**              |  ✓ Simple Logging          |  Debugging value without complexity  |
|  **Configuration Management**  |  ✓ Optional Settings       |  User customization with defaults    |
|  **Multi-Agent Coordination**  |  ✗ Too Complex             |  Would compromise simplicity         |
|  **Event Sourcing**            |  ✗ Too Complex             |  Overkill for target use cases       |
|  **H-FSM State Management**    |  ✗ Too Complex             |  Linear workflow is appropriate      |

---

## Proposed Enhancements

### Enhancement 1: Structured Data Validation (Code-as-Data)

#### Enhancement 1: Current State

```typescript
// Basic TypeScript types with no runtime validation
interface TaskContext {
  taskDescription: string;
  projectPath: string;
  language?: string;
}

// No validation of outputs
const result = await claudeClient.query(prompt, context);
return result.content; // Raw string, no structure
```

#### Enhancement 1: Enhanced Implementation

```typescript
import { z } from 'zod';

// Structured schemas with runtime validation
const TaskContextSchema = z.object({
  taskDescription: z.string().min(10).max(1000),
  projectPath: z.string(),
  language: z.string().optional(),
  framework: z.string().optional(),
  requirements: z.array(z.string()).optional(),
});

const TestSuiteSchema = z.object({
  testFiles: z.array(z.object({
    path: z.string(),
    content: z.string(),
    testCount: z.number(),
    coverage: z.array(z.string()),
  })),
  summary: z.object({
    totalTests: z.number(),
    estimatedCoverage: z.number().min(0).max(1),
    complexity: z.enum(['low', 'medium', 'high']),
  }),
});

const ImplementationSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    purpose: z.string(),
  })),
  dependencies: z.array(z.string()),
  documentation: z.string(),
  metrics: z.object({
    linesOfCode: z.number(),
    functions: z.number(),
    complexity: z.number(),
  }),
});

// Enhanced workflow with validation
class EnhancedPhoenixCodeLite {
  async planAndTest(context: TaskContext): Promise<TestSuite> {
    // Validate input
    const validatedContext = TaskContextSchema.parse(context);
    
    // Generate with structured output requirement
    const prompt = this.buildStructuredPrompt(validatedContext, TestSuiteSchema);
    const response = await this.claudeClient.query(prompt, {
      outputSchema: TestSuiteSchema,
      validateResponse: true,
    });
    
    // Validate and return structured output
    return TestSuiteSchema.parse(response.structured);
  }
}
```

#### Enhancement 1: Benefits

- **Runtime Validation**: Catch data inconsistencies early
- **Better Error Messages**: Clear validation errors vs generic failures
- **IDE Support**: Enhanced autocomplete and type checking
- **Quality Assurance**: Ensure outputs meet expected structure
- **Debugging**: Structured data easier to inspect and debug

#### Enhancement 1: Implementation Effort: ⚡ **Low** (2-4 hours)

- Add Zod dependency
- Define 3-5 core schemas
- Update workflow methods to use schemas
- Add validation error handling

### Enhancement 2: Agent Specialization Through Prompt Contexts

#### Enhancement 2: Current State

```typescript
// Single orchestrator with generic prompts
class TDDOrchestrator {
  async planAndTest(task: string): Promise<PhaseResult> {
    const prompt = `Plan and create tests for: ${task}`;
    return await this.claudeClient.query(prompt);
  }
  
  async implement(plan: string): Promise<PhaseResult> {
    const prompt = `Implement code for: ${plan}`;
    return await this.claudeClient.query(prompt);
  }
}
```

#### Enhancement 2: Enhanced Implementation

```typescript
// Specialized agent contexts with expertise
interface AgentPersona {
  role: string;
  expertise: string[];
  approach: string;
  quality_standards: string[];
  output_format: string;
}

class SpecializedAgentContexts {
  static readonly PLANNING_ANALYST: AgentPersona = {
    role: "Senior Technical Analyst & Test Designer",
    expertise: ["requirements analysis", "test strategy", "edge case identification"],
    approach: "methodical, comprehensive, risk-aware",
    quality_standards: ["complete coverage", "clear acceptance criteria", "testable requirements"],
    output_format: "structured plan with test specifications",
  };
  
  static readonly IMPLEMENTATION_ENGINEER: AgentPersona = {
    role: "Senior Software Engineer",
    expertise: ["clean code", "design patterns", "performance optimization"],
    approach: "pragmatic, test-driven, maintainable",
    quality_standards: ["passes all tests", "follows conventions", "minimal complexity"],
    output_format: "production-ready code with clear structure",
  };
  
  static readonly QUALITY_REVIEWER: AgentPersona = {
    role: "Senior Code Reviewer & Documentation Specialist",
    expertise: ["code quality", "maintainability", "documentation", "refactoring"],
    approach: "detail-oriented, improvement-focused, user-centric",
    quality_standards: ["clean code principles", "comprehensive docs", "optimal performance"],
    output_format: "refactored code with documentation",
  };
}

class EnhancedTDDOrchestrator {
  private buildContextualPrompt(
    persona: AgentPersona, 
    task: string, 
    context: any
  ): string {
    return `
You are a ${persona.role} with deep expertise in: ${persona.expertise.join(', ')}.

Your approach: ${persona.approach}
Your quality standards: ${persona.quality_standards.join(', ')}
Expected output: ${persona.output_format}

Task: ${task}

Context: ${JSON.stringify(context, null, 2)}

Please provide your expert analysis and implementation following your specialized approach and quality standards.
    `.trim();
  }
  
  async planAndTest(task: string, context: TaskContext): Promise<TestSuite> {
    const prompt = this.buildContextualPrompt(
      SpecializedAgentContexts.PLANNING_ANALYST,
      `Analyze requirements and create comprehensive test suite for: ${task}`,
      context
    );
    
    return await this.claudeClient.query(prompt, {
      systemPrompt: "Focus on test-driven development methodology",
      maxTurns: 2,
      outputSchema: TestSuiteSchema,
    });
  }
  
  async implement(testSuite: TestSuite, context: TaskContext): Promise<Implementation> {
    const prompt = this.buildContextualPrompt(
      SpecializedAgentContexts.IMPLEMENTATION_ENGINEER,
      `Implement minimal code to pass all tests: ${testSuite.summary}`,
      { testSuite, ...context }
    );
    
    return await this.claudeClient.query(prompt, {
      systemPrompt: "Write only the code needed to pass tests, no more",
      maxTurns: 3,
      outputSchema: ImplementationSchema,
    });
  }
}
```

#### Enhancement 2: Benefits

- **Specialized Expertise**: Each phase gets appropriate expert perspective
- **Higher Quality Outputs**: Domain-specific knowledge applied to each phase
- **Better Error Handling**: Specialized agents better at recovering from failures
- **Consistent Approach**: Each agent maintains consistent methodology
- **Improved Results**: More targeted and effective responses

#### Enhancement 2: Implementation Effort: ⚡ **Low** (3-5 hours)

- Define 3 agent personas
- Create contextual prompt builder
- Update existing methods to use specialized contexts
- No architectural changes required

### Enhancement 3: Simple Audit Logging

#### Enhancement 3: Current State

```typescript
// No logging of workflow steps or decisions
async executeWorkflow(task: string): Promise<WorkflowResult> {
  const phase1 = await this.planAndTest(task);
  const phase2 = await this.implement(phase1);
  const phase3 = await this.refactor(phase2);
  return { success: true, result: phase3 }; // No audit trail
}
```

#### Enhancement 3: Enhanced Implementation

```typescript
interface AuditEvent {
  id: string;
  timestamp: Date;
  phase: string;
  agent: string;
  input: any;
  output: any;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface WorkflowAuditLog {
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  taskDescription: string;
  events: AuditEvent[];
  summary: {
    totalDuration: number;
    phasesCompleted: number;
    errorCount: number;
    finalSuccess: boolean;
  };
}

class AuditLogger {
  private currentWorkflow: WorkflowAuditLog | null = null;
  
  startWorkflow(taskDescription: string): string {
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentWorkflow = {
      workflowId,
      startTime: new Date(),
      taskDescription,
      events: [],
      summary: {
        totalDuration: 0,
        phasesCompleted: 0,
        errorCount: 0,
        finalSuccess: false,
      },
    };
    
    return workflowId;
  }
  
  logEvent(phase: string, agent: string, input: any, output: any, duration: number, error?: string): void {
    if (!this.currentWorkflow) return;
    
    const event: AuditEvent = {
      id: `event-${this.currentWorkflow.events.length + 1}`,
      timestamp: new Date(),
      phase,
      agent,
      input: this.sanitizeForLogging(input),
      output: this.sanitizeForLogging(output),
      duration,
      success: !error,
      error,
      metadata: {
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    };
    
    this.currentWorkflow.events.push(event);
    
    if (error) {
      this.currentWorkflow.summary.errorCount++;
    } else {
      this.currentWorkflow.summary.phasesCompleted++;
    }
  }
  
  finishWorkflow(success: boolean): WorkflowAuditLog | null {
    if (!this.currentWorkflow) return null;
    
    this.currentWorkflow.endTime = new Date();
    this.currentWorkflow.summary.totalDuration = 
      this.currentWorkflow.endTime.getTime() - this.currentWorkflow.startTime.getTime();
    this.currentWorkflow.summary.finalSuccess = success;
    
    // Save to file for debugging
    this.saveAuditLog(this.currentWorkflow);
    
    const completed = this.currentWorkflow;
    this.currentWorkflow = null;
    return completed;
  }
  
  private async saveAuditLog(log: WorkflowAuditLog): Promise<void> {
    try {
      const logDir = path.join(process.cwd(), '.phoenix-code-lite', 'logs');
      await fs.mkdir(logDir, { recursive: true });
      
      const filename = `${log.workflowId}.json`;
      const filepath = path.join(logDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(log, null, 2));
    } catch (error) {
      console.warn('Failed to save audit log:', error.message);
    }
  }
}

// Enhanced orchestrator with audit logging
class AuditedTDDOrchestrator {
  private auditLogger = new AuditLogger();
  
  async executeWorkflow(task: string, context: TaskContext): Promise<WorkflowResult> {
    const workflowId = this.auditLogger.startWorkflow(task);
    
    try {
      // Phase 1: Plan & Test
      const phase1Start = Date.now();
      const testSuite = await this.planAndTest(task, context);
      this.auditLogger.logEvent(
        'plan-test', 
        'planning-analyst', 
        { task, context }, 
        testSuite, 
        Date.now() - phase1Start
      );
      
      // Phase 2: Implement
      const phase2Start = Date.now();
      const implementation = await this.implement(testSuite, context);
      this.auditLogger.logEvent(
        'implement', 
        'implementation-engineer', 
        testSuite, 
        implementation, 
        Date.now() - phase2Start
      );
      
      // Phase 3: Refactor
      const phase3Start = Date.now();
      const final = await this.refactor(implementation, context);
      this.auditLogger.logEvent(
        'refactor', 
        'quality-reviewer', 
        implementation, 
        final, 
        Date.now() - phase3Start
      );
      
      const auditLog = this.auditLogger.finishWorkflow(true);
      
      return {
        success: true,
        result: final,
        auditLog,
        workflowId,
      };
      
    } catch (error) {
      this.auditLogger.logEvent(
        'error', 
        'system', 
        { task, context }, 
        null, 
        0, 
        error.message
      );
      
      const auditLog = this.auditLogger.finishWorkflow(false);
      
      return {
        success: false,
        error: error.message,
        auditLog,
        workflowId,
      };
    }
  }
}
```

#### Enhancement 3: Benefits

- **Debugging Support**: Complete record of what happened during workflow
- **Performance Analysis**: Duration tracking for optimization
- **Error Investigation**: Detailed context for failure analysis
- **Quality Metrics**: Track improvements over time
- **User Transparency**: Show users exactly what the system did

#### Enhancement 3: Implementation Effort: ⚡ **Low-Medium** (4-6 hours)

- Create audit logging classes
- Add logging calls to existing workflow
- Implement file-based log storage
- Add optional log viewing functionality

### Enhancement 4: Quality Validation Gates

#### Enhancement 4: Current State

```typescript
// Basic success/failure with minimal validation
async implement(testSuite: TestSuite): Promise<Implementation> {
  const implementation = await this.claudeClient.query(prompt);
  // No validation beyond basic parsing
  return implementation;
}
```

#### Enhancement 4: Enhanced Implementation

```typescript
interface QualityGate {
  name: string;
  description: string;
  validator: (artifact: any, context?: any) => Promise<QualityResult>;
  required: boolean;
  weight: number; // For scoring
}

interface QualityResult {
  passed: boolean;
  score: number; // 0-1
  issues: string[];
  suggestions: string[];
  metadata?: Record<string, any>;
}

class QualityGateManager {
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
    context: any, 
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
  
  private async validateSyntax(artifact: Implementation, context: any): Promise<QualityResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let validFiles = 0;
    
    for (const file of artifact.files) {
      try {
        // Basic syntax validation (would use appropriate parser for language)
        if (file.content.trim().length === 0) {
          issues.push(`Empty file: ${file.path}`);
        } else if (!this.hasValidStructure(file.content, context.language)) {
          issues.push(`Invalid structure in: ${file.path}`);
          suggestions.push(`Review ${context.language} syntax in ${file.path}`);
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
  
  private async validateTestCoverage(artifact: any, context: any): Promise<QualityResult> {
    // Simple heuristic-based coverage validation
    const testFileCount = artifact.testFiles ? artifact.testFiles.length : 0;
    const implementationFileCount = artifact.files ? artifact.files.length : 0;
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (testFileCount === 0) {
      issues.push('No test files found');
      suggestions.push('Create test files for your implementation');
    }
    
    if (implementationFileCount > 0 && testFileCount / implementationFileCount < 0.5) {
      issues.push('Low test-to-implementation ratio');
      suggestions.push('Consider adding more comprehensive tests');
    }
    
    const score = implementationFileCount > 0 ? 
      Math.min(1.0, testFileCount / implementationFileCount) : 
      (testFileCount > 0 ? 1.0 : 0.0);
    
    return {
      passed: issues.length === 0,
      score,
      issues,
      suggestions,
      metadata: { testFiles: testFileCount, implementationFiles: implementationFileCount },
    };
  }
}

// Enhanced orchestrator with quality gates
class QualityGatedOrchestrator {
  private qualityGates = new QualityGateManager();
  
  async implement(testSuite: TestSuite, context: TaskContext): Promise<Implementation> {
    const maxAttempts = 3;
    let attempt = 0;
    let lastQualityReport: QualityGateReport | null = null;
    
    while (attempt < maxAttempts) {
      attempt++;
      
      // Generate implementation
      const implementation = await this.generateImplementation(testSuite, context, lastQualityReport);
      
      // Run quality gates
      const qualityReport = await this.qualityGates.runQualityGates(
        implementation, 
        context, 
        'implementation'
      );
      
      if (qualityReport.overallPassed) {
        return {
          ...implementation,
          qualityReport,
          attemptCount: attempt,
        };
      }
      
      lastQualityReport = qualityReport;
      
      if (attempt < maxAttempts) {
        console.log(`Quality gates failed (attempt ${attempt}/${maxAttempts}), retrying with feedback...`);
      }
    }
    
    throw new Error(
      `Quality gates failed after ${maxAttempts} attempts. ` +
      `Issues: ${lastQualityReport?.gateResults ? 
        Object.values(lastQualityReport.gateResults)
          .flatMap(r => r.issues)
          .join(', ') : 'Unknown'}`
    );
  }
}
```

#### Enhancement 4: Benefits

- **Quality Assurance**: Systematic validation of outputs
- **Automatic Retry**: Failed quality gates trigger regeneration with feedback
- **Transparent Scoring**: Clear quality metrics for continuous improvement
- **Configurable Standards**: Adjustable quality requirements
- **Learning Integration**: Quality feedback improves subsequent generations

#### Enhancement 4: Implementation Effort: ⚠ **Medium** (6-8 hours)

- Create quality gate framework
- Implement 4-5 basic validators
- Integrate with existing workflow
- Add retry logic with quality feedback

### Enhancement 5: Optional Configuration Management

#### Enhancement 5: Current State

```typescript
// Hard-coded configuration with no customization
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 30000;
// No user preferences or project-specific settings
```

#### Enhancement 5: Enhanced Implementation

```typescript
interface PhoenixCodeLiteConfig {
  version: string;
  
  // Workflow configuration
  workflow: {
    maxImplementationAttempts: number;
    enableQualityGates: boolean;
    enableAuditLogging: boolean;
    timeoutMs: number;
  };
  
  // Agent configuration
  agents: {
    useSpecializedContexts: boolean;
    maxContextTurns: number;
    enableMemory: boolean;
  };
  
  // Quality settings
  quality: {
    requiredGates: string[];
    minimumScore: number;
    enableCoverage: boolean;
    enableDocumentation: boolean;
  };
  
  // Output settings
  output: {
    verbose: boolean;
    saveArtifacts: boolean;
    showQualityReports: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  
  // Project-specific settings
  project: {
    defaultLanguage?: string;
    defaultFramework?: string;
    testFramework?: string;
    packageManager?: 'npm' | 'yarn' | 'pnpm';
  };
}

class ConfigManager {
  private static readonly CONFIG_FILE = '.phoenix-code-lite.json';
  private static readonly DEFAULT_CONFIG: PhoenixCodeLiteConfig = {
    version: '1.0.0',
    workflow: {
      maxImplementationAttempts: 3,
      enableQualityGates: true,
      enableAuditLogging: true,
      timeoutMs: 60000,
    },
    agents: {
      useSpecializedContexts: true,
      maxContextTurns: 3,
      enableMemory: false,
    },
    quality: {
      requiredGates: ['syntax-validation', 'test-coverage'],
      minimumScore: 0.7,
      enableCoverage: true,
      enableDocumentation: false,
    },
    output: {
      verbose: false,
      saveArtifacts: true,
      showQualityReports: true,
      logLevel: 'info',
    },
    project: {},
  };
  
  static async load(projectPath?: string): Promise<PhoenixCodeLiteConfig> {
    const configPath = path.join(projectPath || process.cwd(), this.CONFIG_FILE);
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const userConfig = JSON.parse(content);
      
      // Merge with defaults (deep merge)
      return this.mergeConfigs(this.DEFAULT_CONFIG, userConfig);
    } catch (error) {
      // Return defaults if config file doesn't exist or is invalid
      return { ...this.DEFAULT_CONFIG };
    }
  }
  
  static async save(config: PhoenixCodeLiteConfig, projectPath?: string): Promise<void> {
    const configPath = path.join(projectPath || process.cwd(), this.CONFIG_FILE);
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, content, 'utf-8');
  }
  
  static async init(projectPath?: string, force: boolean = false): Promise<void> {
    const configPath = path.join(projectPath || process.cwd(), this.CONFIG_FILE);
    
    if (!force && await this.fileExists(configPath)) {
      throw new Error('Configuration file already exists. Use --force to overwrite.');
    }
    
    await this.save(this.DEFAULT_CONFIG, projectPath);
    console.log('Phoenix-Code-Lite configuration initialized:', configPath);
  }
}

// Enhanced orchestrator with configuration
class ConfigurableOrchestrator {
  private config: PhoenixCodeLiteConfig;
  
  constructor(config: PhoenixCodeLiteConfig) {
    this.config = config;
  }
  
  static async create(projectPath?: string): Promise<ConfigurableOrchestrator> {
    const config = await ConfigManager.load(projectPath);
    return new ConfigurableOrchestrator(config);
  }
  
  async executeWorkflow(task: string, context: TaskContext): Promise<WorkflowResult> {
    // Use configuration to control workflow behavior
    const maxAttempts = this.config.workflow.maxImplementationAttempts;
    const enableQualityGates = this.config.workflow.enableQualityGates;
    const enableAuditLogging = this.config.workflow.enableAuditLogging;
    const useSpecializedContexts = this.config.agents.useSpecializedContexts;
    
    // Configure components based on settings
    if (enableAuditLogging) {
      this.auditLogger.startWorkflow(task);
    }
    
    // Execute workflow with configured behavior
    // ... workflow implementation using configuration values
  }
}
```

#### Enhancement 5: Benefits

- **User Customization**: Tailor behavior to specific needs and preferences
- **Project Settings**: Different configurations for different projects
- **Quality Control**: Configurable quality standards and requirements
- **Debugging Support**: Adjustable logging and verbosity levels
- **Team Consistency**: Shared configuration across team members

#### Enhancement 5: Implementation Effort: ⚡ **Low-Medium** (4-6 hours)

- Define configuration schema
- Create configuration manager
- Add CLI commands for config management
- Update orchestrator to use configuration

### Enhancement 6: Per-Agent Document Context System

#### Enhancement 6: Current State

```typescript
// Static agent contexts with no customization
static readonly PLANNING_ANALYST: AgentPersona = {
  role: "Senior Technical Analyst & Test Designer",
  expertise: ["requirements analysis", "test strategy", "edge case identification"],
  approach: "methodical, comprehensive, risk-aware",
  quality_standards: ["complete coverage", "clear acceptance criteria", "testable requirements"],
  output_format: "structured plan with test specifications",
};

// No per-agent document loading or user customization
```

#### Enhancement 6: Enhanced Implementation

```typescript
interface EnhancedAgentPersona {
  // Existing fields
  role: string;
  expertise: string[];
  approach: string;
  quality_standards: string[];
  output_format: string;
  
  // New fields for document context
  context_documents: string[];     // Paths to agent-specific docs
  shared_documents: string[];      // Paths to shared docs
  custom_rules: string[];          // User-defined rules
  memory_snippets: string[];       // Claude Code-style memories
  
  // Configuration
  context_priority: 'agent_first' | 'shared_first' | 'balanced';
  max_context_tokens: number;
}

class AgentContextManager {
  private contextBasePath = '.phoenix-code-lite/agents';
  
  async loadAgentContext(agentName: string): Promise<string> {
    const context = [];
    const agentPath = path.join(this.contextBasePath, agentName);
    
    // 1. Load agent-specific documents
    const agentDocs = await this.loadAgentDocuments(agentPath);
    context.push(...agentDocs);
    
    // 2. Load shared documents
    const sharedDocs = await this.loadSharedDocuments();
    context.push(...sharedDocs);
    
    // 3. Load user memories
    const memories = await this.loadAgentMemories(agentName);
    context.push(...memories);
    
    // 4. Prioritize and truncate to token limit
    return this.prioritizeAndTruncate(context, agentName);
  }
  
  private async loadAgentDocuments(agentPath: string): Promise<string[]> {
    const documents = [];
    const standardFiles = ['rules.md', 'examples.md', 'standards.md'];
    
    for (const file of standardFiles) {
      const filePath = path.join(agentPath, file);
      if (await this.fileExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf-8');
        documents.push(`## ${file.replace('.md', '').toUpperCase()}\n${content}`);
      }
    }
    
    // Load custom directory files
    const customPath = path.join(agentPath, 'custom');
    if (await this.directoryExists(customPath)) {
      const customFiles = await fs.readdir(customPath);
      for (const file of customFiles.filter(f => f.endsWith('.md'))) {
        const content = await fs.readFile(path.join(customPath, file), 'utf-8');
        documents.push(`## CUSTOM: ${file.toUpperCase()}\n${content}`);
      }
    }
    
    return documents;
  }
}

class AgentMemoryManager {
  private memoryPath = '.phoenix-code-lite/agents';
  
  async addMemory(agentName: string, content: string): Promise<void> {
    const agentMemoryPath = path.join(this.memoryPath, agentName, 'memories.json');
    
    let memories = [];
    if (await this.fileExists(agentMemoryPath)) {
      const content = await fs.readFile(agentMemoryPath, 'utf-8');
      memories = JSON.parse(content);
    }
    
    memories.push({
      id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      created_at: new Date().toISOString(),
      type: 'user_added'
    });
    
    await fs.writeFile(agentMemoryPath, JSON.stringify(memories, null, 2));
  }
  
  async addMemoryFromFile(agentName: string, filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const memory = {
      id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: `# From: ${filePath}\n\n${content}`,
      created_at: new Date().toISOString(),
      type: 'file_import',
      source_file: filePath
    };
    
    const agentMemoryPath = path.join(this.memoryPath, agentName, 'memories.json');
    let memories = [];
    if (await this.fileExists(agentMemoryPath)) {
      const existingContent = await fs.readFile(agentMemoryPath, 'utf-8');
      memories = JSON.parse(existingContent);
    }
    
    memories.push(memory);
    await fs.writeFile(agentMemoryPath, JSON.stringify(memories, null, 2));
  }
  
  async listMemories(agentName: string): Promise<any[]> {
    const agentMemoryPath = path.join(this.memoryPath, agentName, 'memories.json');
    if (await this.fileExists(agentMemoryPath)) {
      const content = await fs.readFile(agentMemoryPath, 'utf-8');
      return JSON.parse(content);
    }
    return [];
  }
}

// Enhanced orchestrator with agent context loading
class ContextAwareOrchestrator {
  private contextManager = new AgentContextManager();
  private memoryManager = new AgentMemoryManager();
  
  private async buildEnhancedContextualPrompt(
    persona: EnhancedAgentPersona, 
    task: string, 
    context: any
  ): Promise<string> {
    // Load agent-specific context
    const agentContext = await this.contextManager.loadAgentContext(persona.role);
    
    return `
You are a ${persona.role} with deep expertise in: ${persona.expertise.join(', ')}.

Your approach: ${persona.approach}
Your quality standards: ${persona.quality_standards.join(', ')}
Expected output: ${persona.output_format}

## AGENT-SPECIFIC CONTEXT
${agentContext}

## TASK
${task}

## PROJECT CONTEXT
${JSON.stringify(context, null, 2)}

Please provide your expert analysis and implementation following your specialized approach, quality standards, and the agent-specific context provided above.
    `.trim();
  }
}
```

#### Enhancement 6: Folder Structure

``` text
.phoenix-code-lite/
├── agents/
│   ├── PLANNING_ANALYST/
│   │   ├── rules.md              # Agent-specific methodology rules
│   │   ├── examples.md           # Code examples & patterns
│   │   ├── standards.md          # Quality standards and acceptance criteria
│   │   ├── memories.json         # User-added memories
│   │   └── custom/               # User-defined documents
│   │       ├── double_diamond.md # Custom methodologies
│   │       └── project_templates.md
│   ├── IMPLEMENTATION_ENGINEER/
│   │   ├── rules.md              # Coding standards and conventions
│   │   ├── examples.md           # Code patterns and examples
│   │   ├── standards.md          # Code quality standards
│   │   ├── memories.json         # User-added memories
│   │   └── custom/
│   │       ├── naming_conventions.md
│   │       ├── formatting_rules.md
│   │       └── framework_patterns.md
│   ├── QUALITY_REVIEWER/
│   │   ├── rules.md              # Review methodology
│   │   ├── examples.md           # Refactoring examples
│   │   ├── standards.md          # Quality metrics
│   │   ├── memories.json         # User-added memories
│   │   └── custom/
│   │       ├── review_checklist.md
│   │       └── documentation_standards.md
│   └── shared/                   # Cross-agent documents
│       ├── company_standards.md
│       ├── general_patterns.md
│       └── project_conventions.md
└── config/
    └── agent_config.json         # Agent configuration
```

#### Enhancement 6: CLI Commands

```bash
# Memory management (inspired by Claude Code)
phoenix-lite memory add PLANNING_ANALYST "use the double diamond method for requirement analysis"
phoenix-lite memory add IMPLEMENTATION_ENGINEER "./coding_standards.md"
phoenix-lite memory list PLANNING_ANALYST
phoenix-lite memory remove PLANNING_ANALYST memory-001

# Context management
phoenix-lite context init                             # Initialize folder structure
phoenix-lite context edit PLANNING_ANALYST rules      # Edit agent rules
phoenix-lite context show PLANNING_ANALYST            # Show current context
phoenix-lite context validate                         # Validate all contexts
```

#### Enhancement 6: Benefits

- **Deep Customization**: Define coding standards, naming conventions, documentation style per agent
- **Team Consistency**: Ensure all team members follow same standards through shared contexts
- **Domain Specialization**: Customize agents for specific domains (security, mobile, AI/ML, etc.)
- **Learning Integration**: Capture and reuse successful patterns and methodologies
- **Familiar UX**: Memory system inspired by Claude Code's # memory system
- **Flexible Organization**: Both structured documents and freeform memories supported

#### Enhancement 6: Implementation Effort: ⚡ **Low-Medium** (8-12 hours)

- Extend AgentPersona interface with context fields
- Implement AgentContextManager for document loading
- Create AgentMemoryManager for memory-style additions
- Add CLI commands for context and memory management
- Create default folder structure and templates
- Integrate with existing buildContextualPrompt method

### Enhancement 7: Dynamic Agent Creation System

#### Enhancement 7: Current State

```typescript
// Hard-coded static agent definitions
class SpecializedAgentContexts {
  static readonly PLANNING_ANALYST: AgentPersona = { /* fixed definition */ };
  static readonly IMPLEMENTATION_ENGINEER: AgentPersona = { /* fixed definition */ };
  static readonly QUALITY_REVIEWER: AgentPersona = { /* fixed definition */ };
  
  // No ability to create custom agents
}
```

#### Enhancement 7: Enhanced Implementation

```typescript
interface AgentDefinition {
  agent_id: string;
  role: string;
  expertise: string[];
  approach: string;
  quality_standards: string[];
  output_format: string;
  
  // Context configuration
  context_config: {
    documents: string[];           // Default documents to create
    shared_documents: string[];    // Links to shared documents
    max_context_tokens: number;
    priority: 'agent_first' | 'shared_first' | 'balanced';
  };
  
  // Metadata
  created_by: 'builtin' | 'user';
  created_at: string;
  version: string;
  description?: string;
  tags?: string[];
}

interface AgentConfig {
  version: string;
  builtin_agents: AgentDefinition[];
  custom_agents: AgentDefinition[];
  templates: AgentTemplate[];
}

class DynamicAgentManager {
  private configPath = '.phoenix-code-lite/config/agent_config.json';
  private agentBasePath = '.phoenix-code-lite/agents';
  
  async createAgent(agentDef: AgentDefinition): Promise<void> {
    // Validate agent definition
    this.validateAgentDefinition(agentDef);
    
    // Create agent folder structure
    await this.createAgentFolders(agentDef.agent_id);
    
    // Initialize default documents
    await this.initializeAgentDocuments(agentDef);
    
    // Save to configuration
    await this.saveAgentDefinition(agentDef);
    
    console.log(`Created agent: ${agentDef.agent_id}`);
  }
  
  async createAgentFromTemplate(templateName: string, agentId: string, customizations: Partial<AgentDefinition>): Promise<void> {
    const template = await this.getAgentTemplate(templateName);
    const agentDef: AgentDefinition = {
      ...template,
      agent_id: agentId,
      ...customizations,
      created_by: 'user',
      created_at: new Date().toISOString(),
      version: '1.0'
    };
    
    await this.createAgent(agentDef);
  }
  
  async listAgents(): Promise<AgentDefinition[]> {
    const config = await this.loadAgentConfig();
    return [...config.builtin_agents, ...config.custom_agents];
  }
  
  async removeAgent(agentId: string): Promise<void> {
    const config = await this.loadAgentConfig();
    const agent = [...config.builtin_agents, ...config.custom_agents]
      .find(a => a.agent_id === agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    if (agent.created_by === 'builtin') {
      throw new Error('Cannot remove built-in agents');
    }
    
    // Remove from config
    config.custom_agents = config.custom_agents.filter(a => a.agent_id !== agentId);
    await this.saveAgentConfig(config);
    
    // Optionally remove folder (with confirmation)
    console.log(`Removed agent: ${agentId}`);
    console.log(`Note: Agent folder preserved at: ${path.join(this.agentBasePath, agentId)}`);
  }
  
  private async createAgentFolders(agentId: string): Promise<void> {
    const agentPath = path.join(this.agentBasePath, agentId);
    const customPath = path.join(agentPath, 'custom');
    
    await fs.mkdir(agentPath, { recursive: true });
    await fs.mkdir(customPath, { recursive: true });
  }
  
  private async initializeAgentDocuments(agentDef: AgentDefinition): Promise<void> {
    const agentPath = path.join(this.agentBasePath, agentDef.agent_id);
    
    // Create default documents
    const defaultDocs = {
      'rules.md': this.generateRulesTemplate(agentDef),
      'examples.md': this.generateExamplesTemplate(agentDef),
      'standards.md': this.generateStandardsTemplate(agentDef),
      'memories.json': '[]'
    };
    
    for (const [filename, content] of Object.entries(defaultDocs)) {
      await fs.writeFile(path.join(agentPath, filename), content);
    }
  }
  
  private generateRulesTemplate(agentDef: AgentDefinition): string {
    return `# ${agentDef.role} - Rules and Methodology

## Role
${agentDef.role}

## Approach
${agentDef.approach}

## Core Principles
${agentDef.expertise.map(e => `- **${e}**: [Add specific rules for ${e}]`).join('\n')}

## Workflow
1. [Define your specific workflow steps]
2. [Add methodology details]
3. [Include decision criteria]

## Quality Checkpoints
${agentDef.quality_standards.map(s => `- ${s}`).join('\n')}

---
*This document defines the core rules and methodology for the ${agentDef.agent_id} agent.*
*Customize these rules to match your specific requirements and standards.*
`;
  }
}

// Enhanced orchestrator with dynamic agent support
class DynamicAgentOrchestrator {
  private agentManager = new DynamicAgentManager();
  
  async getAvailableAgents(): Promise<AgentDefinition[]> {
    return await this.agentManager.listAgents();
  }
  
  async executeWithAgent(agentId: string, task: string, context: any): Promise<any> {
    const agents = await this.getAvailableAgents();
    const agent = agents.find(a => a.agent_id === agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Convert to persona format and execute
    const persona = this.convertToPersona(agent);
    return await this.executeWithPersona(persona, task, context);
  }
}
```

#### Enhancement 7: Agent Templates

```typescript
interface AgentTemplate {
  template_id: string;
  name: string;
  description: string;
  category: string;
  base_definition: Partial<AgentDefinition>;
}

const BUILTIN_TEMPLATES: AgentTemplate[] = [
  {
    template_id: 'security_specialist',
    name: 'Security Specialist',
    description: 'Expert in secure coding, threat modeling, and vulnerability assessment',
    category: 'security',
    base_definition: {
      role: 'Senior Security Engineer & Penetration Tester',
      expertise: ['threat modeling', 'secure coding', 'vulnerability assessment', 'compliance'],
      approach: 'security-first, defense-in-depth, zero-trust',
      quality_standards: ['OWASP compliance', 'secure by default', 'minimal attack surface'],
      output_format: 'secure code with threat analysis',
      context_config: {
        documents: ['security_guidelines.md', 'owasp_checklist.md', 'threat_models.md'],
        shared_documents: ['general_standards.md'],
        max_context_tokens: 4000,
        priority: 'agent_first'
      }
    }
  },
  {
    template_id: 'mobile_developer',
    name: 'Mobile Developer',
    description: 'Expert in iOS and Android development with cross-platform knowledge',
    category: 'mobile',
    base_definition: {
      role: 'Senior Mobile Developer',
      expertise: ['iOS development', 'Android development', 'React Native', 'Flutter', 'mobile UX'],
      approach: 'mobile-first, performance-conscious, platform-appropriate',
      quality_standards: ['responsive design', 'offline capability', 'battery efficiency'],
      output_format: 'mobile-optimized code with platform considerations',
      context_config: {
        documents: ['mobile_patterns.md', 'platform_guidelines.md', 'performance_rules.md'],
        shared_documents: ['general_standards.md'],
        max_context_tokens: 3500,
        priority: 'agent_first'
      }
    }
  },
  {
    template_id: 'devops_engineer',
    name: 'DevOps Engineer',
    description: 'Expert in CI/CD, infrastructure as code, and deployment automation',
    category: 'infrastructure',
    base_definition: {
      role: 'Senior DevOps Engineer',
      expertise: ['CI/CD', 'infrastructure as code', 'containerization', 'monitoring', 'automation'],
      approach: 'automation-first, infrastructure-as-code, observability-driven',
      quality_standards: ['automated deployment', 'comprehensive monitoring', 'disaster recovery'],
      output_format: 'infrastructure code with deployment documentation',
      context_config: {
        documents: ['deployment_patterns.md', 'monitoring_standards.md', 'automation_rules.md'],
        shared_documents: ['general_standards.md'],
        max_context_tokens: 4000,
        priority: 'agent_first'
      }
    }
  }
];
```

#### Enhancement 7: CLI Commands

```bash
# Create agents
phoenix-lite agent create                                    # Interactive creation
phoenix-lite agent create --template security_specialist    # From template
phoenix-lite agent create --from-file ./my_agent.json      # From JSON file

# Manage agents
phoenix-lite agent list                                     # List all agents
phoenix-lite agent list --templates                        # List available templates
phoenix-lite agent show SECURITY_SPECIALIST               # Show agent details
phoenix-lite agent remove SECURITY_SPECIALIST             # Remove custom agent

# Templates
phoenix-lite agent template list                           # List templates
phoenix-lite agent template show security_specialist      # Show template details

# Validation
phoenix-lite agent validate SECURITY_SPECIALIST           # Validate agent configuration
phoenix-lite agent validate --all                         # Validate all agents
```

#### Enhancement 7: Benefits

- **Unlimited Specialization**: Create agents for any domain (security, mobile, AI/ML, blockchain, etc.)
- **Template System**: Quick creation from proven templates
- **Team Sharing**: Export/import agent definitions across teams
- **Community Ecosystem**: Share and discover agent definitions
- **Incremental Adoption**: Start with built-in agents, add custom ones as needed
- **Version Control**: Agent definitions are JSON files that can be version controlled
- **Validation**: Built-in validation ensures agent definitions are well-formed

#### Enhancement 7: Implementation Effort: ⚡ **Low-Medium** (6-10 hours)

- Create AgentDefinition schema and validation
- Implement DynamicAgentManager class
- Add built-in agent templates
- Create CLI commands for agent management
- Add agent template system
- Integrate with existing orchestrator

---

## Implementation Strategy

### Phase 1: Foundation Enhancements (8-12 hours)

1. **Structured Data Validation** - Implement Zod schemas and validation
2. **Agent Specialization** - Add specialized prompt contexts
3. **Basic Configuration** - Simple configuration management

**Deliverable**: Enhanced Phoenix-Code-Lite with better structure and specialization

### Phase 2: Quality & Observability (10-14 hours)

1. **Quality Gates** - Implement validation framework
2. **Audit Logging** - Add workflow tracking and debugging
3. **Enhanced Error Handling** - Better error reporting with context

**Deliverable**: Production-ready Phoenix-Code-Lite with quality assurance

### Phase 3: Agent Context & Customization (14-22 hours)

1. **Per-Agent Document Context System** - Agent-specific document loading and memory management
2. **Dynamic Agent Creation System** - User-defined agents with templates
3. **CLI Extensions** - Memory and agent management commands

**Deliverable**: Highly customizable Phoenix-Code-Lite with unlimited agent specialization

### Phase 4: Polish & Documentation (4-6 hours)

1. **Configuration UI** - CLI commands for configuration management
2. **Enhanced Reporting** - Quality reports and metrics
3. **Documentation** - Update documentation with new features
4. **Agent Templates** - Built-in templates for common domains

**Deliverable**: Feature-complete enhanced Phoenix-Code-Lite

### Backward Compatibility Strategy

All enhancements are designed to be **fully backward compatible**:

```typescript
// Existing simple usage continues to work unchanged
const orchestrator = new TDDOrchestrator(claudeClient);
const result = await orchestrator.executeWorkflow(task, context);

// Enhanced usage is opt-in
const config = await ConfigManager.load();
const enhancedOrchestrator = new ConfigurableOrchestrator(config);
const enhancedResult = await enhancedOrchestrator.executeWorkflow(task, context);
```

**Migration Path**: Users can adopt enhancements incrementally without breaking existing workflows.

---

## Expected Benefits

### Quality Improvements

|  *Enhancement*                |  *Quality Impact*         |  *Measurement*                                        |
| ----------------------------- | ------------------------- | ----------------------------------------------------- |
|  **Structured Data**          |  Higher reliability       |  Fewer parsing errors, better validation              |
|  **Agent Specialization**     |  Better outputs           |  Higher user satisfaction, fewer retries              |
|  **Quality Gates**            |  Consistency              |  Quality score improvements, fewer failures           |
|  **Audit Logging**            |  Debuggability            |  Faster issue resolution, better understanding        |
|  **Configuration**            |  Customization            |  Better fit for specific use cases                    |
|  **Per-Agent Context**        |  Domain-specific quality  |  Improved code consistency, fewer standard violations |
|  **Dynamic Agents**           |  Unlimited specialization |  Perfect domain fit, custom quality standards         |

### User Experience Improvements

- **Better Error Messages**: Structured validation provides clear, actionable error messages
- **Predictable Quality**: Quality gates ensure consistent output standards
- **Customizable Behavior**: Configuration allows adaptation to specific needs
- **Better Debugging**: Audit logs provide detailed insight into workflow execution
- **Professional Results**: Specialized agents produce more expert-level outputs
- **Deep Customization**: Per-agent contexts enable coding standards, naming conventions, and domain-specific rules
- **Familiar Memory System**: Claude Code-inspired memory commands for intuitive context management
- **Unlimited Specialization**: Create custom agents for any domain or methodology
- **Team Consistency**: Shared agent definitions ensure uniform standards across team members

### Maintainability Benefits

- **Structured Codebase**: Schemas and types improve code organization
- **Clear Separation**: Agent specialization creates clear responsibility boundaries
- **Observable Behavior**: Audit logging makes system behavior transparent
- **Configurable Complexity**: Users can choose their desired complexity level
- **Quality Assurance**: Automated quality gates reduce manual review burden

---

## Risk Assessment

### Low Risk Enhancements

- ✓ **Structured Data Validation** - Purely additive, improves reliability
- ✓ **Agent Specialization** - Better prompts with no architectural changes
- ✓ **Configuration Management** - Optional feature with sensible defaults
- ✓ **Per-Agent Context System** - Extends existing agent system, no breaking changes
- ✓ **Dynamic Agent Creation** - JSON-based definitions, simple validation

### Medium Risk Enhancements

- ⚠ **Quality Gates** - Could slow down workflow if too strict
- ⚠ **Audit Logging** - Could consume disk space if not managed

### Mitigation Strategies

- **Gradual Rollout**: Implement enhancements incrementally
- **Feature Flags**: All enhancements are configurable/optional
- **Performance Monitoring**: Track impact on workflow speed
- **User Feedback**: Gather feedback during implementation
- **Fallback Options**: Always maintain simple usage path

---

## Conclusion

### Enhancement Value Proposition

These enhancements transform Phoenix-Code-Lite from a **simple TDD tool** into a **professional-grade development orchestrator** while preserving its core simplicity and ease of use.

#### For Individual Developers

- Better quality outputs with minimal additional complexity
- Professional-grade results from a simple tool
- Customizable to personal preferences and workflow

#### For Small Teams

- Consistent quality standards across team members
- Shared configuration ensures uniform behavior
- Audit trails for debugging and improvement

#### For Learning & Education

- Structured outputs help understand TDD principles
- Quality gates provide educational feedback
- Audit logs show complete workflow for learning

### Strategic Alignment with Phoenix Framework

While maintaining Phoenix-Code-Lite's simplicity, these enhancements selectively incorporate Phoenix Framework's most valuable principles:

|  *Phoenix Principle*       |  *Enhancement Approach*         |  *Benefit*                                            |
| -------------------------- | ------------------------------- | ----------------------------------------------------- |
|  **Code-as-Data**          |  Basic structured validation    |  Reliability without complexity                       |
|  **Agent Specialization**  |  Prompt context specialization  |  Quality without architecture overhead                |
|  **Quality Assurance**     |  Configurable validation gates  |  Professional results with user control               |
|  **Observability**         |  Simple audit logging           |  Debugging support without event sourcing complexity  |
|  **Customization**         |  Optional configuration         |  Flexibility without mandatory complexity             |

### Recommendation

**Proceed with phased implementation** of all proposed enhancements. The benefits significantly outweigh the risks, and the backward compatibility ensures no disruption to existing users while providing substantial value to those who opt into enhanced features.

**Expected Outcome**: Phoenix-Code-Lite becomes a **best-in-class TDD orchestrator** that maintains its simplicity advantage while offering professional-grade capabilities for users who need them.

---

**Enhancement Status**: ✓ **RECOMMENDED FOR IMPLEMENTATION**  
**Implementation Effort**: 22-32 hours total across 3 phases  
**Risk Level**: Low (all enhancements are optional and backward compatible)  
**Expected Impact**: Transform Phoenix-Code-Lite into professional-grade tool while preserving simplicity
