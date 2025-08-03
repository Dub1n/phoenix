# Phoenix Code Lite - API Reference

## 🔍 Overview

This document provides comprehensive API documentation for Phoenix Code Lite's TypeScript interfaces, classes, and core functionality.

## 📊 Core Type Definitions

### Workflow Types (`src/types/workflow.ts`)

#### TaskContext

Primary input interface for workflow execution.

```typescript
interface TaskContext {
  taskDescription: string;    // 10-1000 characters required
  projectPath: string;        // Required absolute path
  language?: string;          // Optional language hint (e.g., "typescript", "python")
  framework?: string;         // Optional framework hint (e.g., "react", "express")
  maxTurns: number;          // 1-10, default: 3
  systemPrompt?: string;     // Optional custom system prompt override
}
```

**Validation Schema**: `TaskContextSchema` (Zod)

- `taskDescription`: 10-1000 character validation
- `projectPath`: Non-empty string requirement
- `maxTurns`: Integer range 1-10 with default value

#### LLMResponse

Standardized response structure from Claude Code interactions.

```typescript
interface LLMResponse {
  content: string;                    // Generated content
  usage?: {                          // Optional token usage tracking
    inputTokens: number;
    outputTokens: number;
  };
  metadata?: Record<string, any>;    // Additional response metadata
}
```

#### PhaseResult

Individual workflow phase execution results.

```typescript
interface PhaseResult {
  name: string;                      // Phase identifier
  startTime: Date;                   // Phase start timestamp
  endTime?: Date;                    // Phase completion timestamp
  success: boolean;                  // Phase success indicator
  output?: string;                   // Phase output content
  error?: string;                    // Error message if failed
  artifacts: string[];               // Generated file paths
  metadata?: Record<string, any>;    // Phase-specific metadata
}
```

#### WorkflowResult

Complete workflow execution results.

```typescript
interface WorkflowResult {
  taskDescription: string;           // Original task description
  startTime: Date;                   // Workflow start timestamp
  endTime?: Date;                    // Workflow completion timestamp
  duration?: number;                 // Total execution time (ms)
  phases: PhaseResult[];             // Results from all phases
  success: boolean;                  // Overall workflow success
  error?: string;                    // Error message if failed
  artifacts: string[];               // All generated files
  metadata?: Record<string, any>;    // Workflow metadata including quality reports
}
```

### Agent Types (`src/types/agents.ts`)

#### AgentPersona

Agent specialization configuration.

```typescript
interface AgentPersona {
  role: string;                      // Agent role description
  expertise: string[];               // Areas of expertise
  approach: string;                  // Working methodology
  quality_standards: string[];       // Quality requirements
  output_format: string;             // Expected output format
  systemPrompt?: string;             // Optional custom prompt
}
```

#### Specialized Agent Contexts

Pre-configured agent personas for TDD workflow phases.

```typescript
const SpecializedAgentContexts = {
  PLANNING_ANALYST: AgentPersona;    // Requirements & test planning
  IMPLEMENTATION_ENGINEER: AgentPersona; // Code implementation
  QUALITY_REVIEWER: AgentPersona;    // Refactoring & documentation
} as const;
```

## 🏗️ Core Architecture Classes

### TDDOrchestrator (`src/tdd/orchestrator.ts`)

Main workflow coordination class that manages the complete TDD process.

#### TDDOrchestrator: Constructor

```typescript
constructor(claudeClient: ClaudeCodeClient)
```

**Parameters**:

- `claudeClient`: Validated Claude Code client instance

**Initializes**:

- TDD phase implementations
- Quality gate manager
- Codebase scanner
- Audit logging with unique session ID
- Metrics collection system

#### TDDOrchestrator: Methods

##### executeWorkflow()

```typescript
async executeWorkflow(
  taskDescription: string, 
  context: TaskContext
): Promise<WorkflowResult>
```

**Workflow Process**:

1. **Phase 0**: Mandatory codebase scan (anti-reimplementation)
2. **Phase 1**: Plan & Test generation with quality gates
3. **Phase 2**: Implementation & Fix with quality validation
4. **Phase 3**: Refactor & Document with final assessment

**Returns**: Complete workflow results with quality scores and metrics

##### Private Methods

- `gatherImplementationArtifacts()`: Collect implementation files
- `gatherFinalArtifacts()`: Collect all project files
- `applyQualityImprovements()`: Apply quality gate recommendations
- `calculateOverallQualityScore()`: Compute weighted quality scores
- `validateScanAcknowledgment()`: Ensure agent reviews existing code

### ClaudeCodeClient (`src/claude/client.ts`)

Validated wrapper for Claude Code SDK with enhanced error handling.

#### ClaudeCodeClient: Key Features

- **Retry Logic**: Exponential backoff for failed requests
- **Response Validation**: Zod schema validation for all responses
- **Token Tracking**: Automatic usage monitoring
- **Error Recovery**: Graceful handling of API failures

#### ClaudeCodeClient: Methods

```typescript
async query(prompt: string, context: TaskContext): Promise<LLMResponse>
async validateResponse(response: any): Promise<LLMResponse>
```

### Quality Gates System

#### QualityGateManager (`src/tdd/quality-gates.ts`)

4-tier validation framework with configurable thresholds.

```typescript
interface QualityGateReport {
  phase: string;                     // Workflow phase
  overallPassed: boolean;           // Overall gate status
  overallScore: number;             // 0-1 quality score
  results: QualityGateResult[];     // Individual gate results
  recommendations: string[];         // Improvement suggestions
  metadata: Record<string, any>;    // Validation metadata
}
```

**Quality Gates**:

1. **Syntax Gate**: Language parsing, type checking, compilation
2. **Test Gate**: Test execution, coverage analysis, assertions
3. **Quality Gate**: Code complexity, maintainability, conventions
4. **Documentation Gate**: Comment coverage, API docs, examples

#### QualityGateManager: Methods

```typescript
async runQualityGates(
  artifacts: any, 
  context: TaskContext, 
  phase: string
): Promise<QualityGateReport>
```

### Security Framework

#### SecurityGuardrails (`src/security/guardrails.ts`)

Comprehensive security validation for all file and command operations.

```typescript
interface SecurityPolicy {
  allowedPaths: string[];            // Whitelisted path patterns
  blockedPaths: string[];            // Blacklisted path patterns
  allowedCommands: string[];         // Safe command list
  blockedCommands: string[];         // Dangerous command list
  maxFileSize: number;              // File size limit (bytes)
  maxExecutionTime: number;         // Command timeout (ms)
}
```

#### Methods

```typescript
validatePath(path: string): boolean
validateCommand(command: string): boolean
checkFileSize(path: string): Promise<boolean>
```

## 🎯 TDD Phase Classes

### PlanTestPhase (`src/tdd/phases/plan-test.ts`)

Planning Analyst agent implementation for requirements analysis and test generation.

#### PlanTestPhase: Responsibilities

- Requirements analysis and decomposition
- Test strategy development
- Comprehensive test case generation
- Edge case identification
- Acceptance criteria definition

#### PlanTestPhase: Methods

```typescript
async execute(
  taskDescription: string, 
  context: TaskContext
): Promise<PhaseResult>
```

### ImplementFixPhase (`src/tdd/phases/implement-fix.ts`)

Implementation Engineer agent for minimal code implementation.

#### ImplementFixPhase: Responsibilities

- Clean code generation to pass tests
- Iterative test fixing
- Design pattern application
- Performance-conscious implementation

#### ImplementFixPhase: Methods

```typescript
async execute(
  planResult: PhaseResult, 
  context: TaskContext
): Promise<PhaseResult>
```

### RefactorDocumentPhase (`src/tdd/phases/refactor-document.ts`)

Quality Reviewer agent for code improvement and documentation.

#### RefactorDocumentPhase: Responsibilities

- Code refactoring and optimization
- Comprehensive documentation generation
- API documentation creation
- Performance optimization
- Long-term maintainability improvements

#### RefactorDocumentPhase: Methods

```typescript
async execute(
  implementResult: PhaseResult, 
  context: TaskContext
): Promise<PhaseResult>
```

## 🔧 Utility Classes

### AuditLogger (`src/utils/audit-logger.ts`)

Structured audit logging with session correlation.

```typescript
interface AuditEvent {
  sessionId: string;                 // Session correlation ID
  timestamp: Date;                   // Event timestamp
  eventType: string;                 // Event classification
  phase?: string;                    // Workflow phase
  details: Record<string, any>;      // Event-specific data
  context: TaskContext;              // Request context
}
```

#### AuditLogger: Methods

```typescript
async logWorkflowStart(task: string, context: TaskContext): Promise<void>
async logPhaseStart(phase: string, context: TaskContext): Promise<void>
async logPhaseEnd(result: PhaseResult): Promise<void>
async logError(component: string, error: Error, context: TaskContext): Promise<void>
```

### MetricsCollector (`src/utils/metrics.ts`)

Performance and quality metrics collection.

```typescript
interface WorkflowMetrics {
  sessionId: string;                 // Session identifier
  taskType: string;                  // Task classification
  totalDuration: number;             // Total execution time
  phaseMetrics: PhaseMetrics[];      // Per-phase metrics
  qualityScore: number;              // Overall quality score
  tokenUsage: TokenUsage;            // Claude API usage
  successRate: boolean;              // Workflow success indicator
}
```

### CodebaseScanner (`src/tdd/codebase-scanner.ts`)

Existing code analysis for anti-reimplementation.

```typescript
interface CodebaseScanResult {
  relevantAssets: AssetReference[];   // Existing relevant code
  reuseOpportunities: ReuseOpportunity[]; // Reusable components
  conflictRisks: ConflictRisk[];      // Potential naming/logic conflicts
  architecturalPatterns: string[];    // Detected patterns
  recommendations: string[];          // Integration recommendations
}
```

## 🖥️ CLI Interface

### Enhanced CLI Commands (`src/cli/enhanced-commands.ts`)

```typescript
interface CLICommand {
  name: string;                      // Command name
  description: string;               // Command description
  options: CLIOption[];              // Command options
  handler: (args: any) => Promise<void>; // Command handler
}
```

**Available Commands**:

- `init`: Initialize new TDD workflow
- `run`: Execute specific workflow phase
- `workflow`: Run complete TDD workflow
- `scan`: Analyze existing codebase
- `quality`: Run quality gates analysis
- `config`: Manage configuration settings

### Progress Tracking (`src/cli/progress-tracker.ts`)

Visual progress indication with multi-phase support.

```typescript
interface ProgressConfig {
  phases: string[];                  // Phase names
  currentPhase: number;             // Active phase index
  showETA: boolean;                 // Show estimated completion
  showTokens: boolean;              // Show token usage
}
```

## 🔗 Integration Patterns

### Configuration Templates (`src/config/templates.ts`)

Pre-defined configuration profiles for different use cases.

```typescript
const ConfigurationTemplates = {
  STARTER: ConfigurationTemplate;     // Basic setup for beginners
  ENTERPRISE: ConfigurationTemplate; // Production-grade configuration
  PERFORMANCE: ConfigurationTemplate; // Optimized for speed
} as const;
```

### Testing Utilities (`src/testing/`)

**MockClaude** (`mock-claude.ts`): Claude SDK mocking for testing
**E2ERunner** (`e2e-runner.ts`): End-to-end test execution
**Performance** (`performance.ts`): Performance benchmark utilities

## 📈 Error Handling

### Error Classification

```typescript
enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  CLAUDE_API_ERROR = 'claude_api_error',
  SECURITY_VIOLATION = 'security_violation',
  QUALITY_GATE_FAILURE = 'quality_gate_failure',
  PHASE_EXECUTION_ERROR = 'phase_execution_error'
}

interface PhoenixError extends Error {
  type: ErrorType;
  phase?: string;
  context?: TaskContext;
  recoverable: boolean;
}
```

### Recovery Strategies

- **Validation Errors**: Immediate user feedback with correction guidance
- **API Errors**: Retry with exponential backoff, fallback to cached responses
- **Security Violations**: Audit logging, operation termination
- **Quality Failures**: Improvement recommendations, optional bypass
- **Phase Errors**: Graceful degradation, partial result preservation

---

*This API reference covers the complete Phoenix Code Lite interface. For implementation examples, see the user guide and integration tests.*
