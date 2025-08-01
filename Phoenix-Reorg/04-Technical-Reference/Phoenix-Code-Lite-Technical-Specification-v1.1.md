# Phoenix-Code-Lite Technical Specification (v1.1)

> A pragmatic technical architecture and design specification for Phoenix-Code-Lite: A streamlined TDD workflow orchestrator built on the Claude Code SDK.

## Executive Summary

Phoenix-Code-Lite represents a paradigm shift in the Phoenix Framework ecosystem, leveraging the Claude Code SDK to create a streamlined, integrated development experience. Unlike Phoenix-Lite's standalone approach, Phoenix-Code-Lite operates as an intelligent extension within the Claude Code ecosystem, focusing exclusively on TDD workflow orchestration while delegating infrastructure concerns to Claude Code's robust foundation.

### Key Architectural Decisions

1. **Simplicity First**: Prioritize a minimal dependency, lightweight, and easy-to-use tool over a complex, feature-heavy framework.
2. **Claude Code SDK Integration**: Leverage existing infrastructure rather than reinventing it.
3. **Extension Pattern**: Plugin-like architecture that feels native within Claude Code.
4. **Workflow Orchestration Focus**: Concentrate on TDD logic, not infrastructure.
5. **TypeScript Implementation**: Better SDK compatibility and developer experience.

---

## Architecture Philosophy

### Design Principles

#### 1. Leverage, Don't Reinvent

Phoenix-Code-Lite embraces the Unix philosophy of building on existing tools. Claude Code already provides excellent file operations, git integration, command execution, and LLM interaction capabilities. Phoenix-Code-Lite focuses solely on orchestrating these capabilities into a structured TDD workflow.

#### 2. Extension Over Application

Rather than building a standalone CLI tool, Phoenix-Code-Lite operates as an intelligent extension that enhances Claude Code's capabilities. This approach provides a seamless integration that feels native to the user's environment.

#### 3. Workflow Orchestration Specialization

Phoenix-Code-Lite's core competency is orchestrating a linear, three-phase TDD workflow:

- **Phase 1**: Plan & Test Generation
- **Phase 2**: Implementation & Verification
- **Phase 3**: Refactoring & Documentation

All other concerns (file I/O, git operations, command execution) are delegated to Claude Code.

#### 4. Quality Through Structure

By imposing a structured TDD workflow, Phoenix-Code-Lite ensures:

- **Consistent Quality**: Every implementation follows TDD principles.
- **Measurable Progress**: Clear phases with defined success criteria.
- **Self-Correction**: Built-in retry and error handling mechanisms.
- **Audit Trail**: Simple, file-based logging for workflow history and debugging.

---

## Technical Architecture

### Technology Stack

| Component | Phoenix-Code-Lite |
| --------- | ----------------- |
| **Language** | TypeScript/Node.js |
| **LLM Integration** | Claude Code SDK |
| **Orchestration** | Custom TDD Orchestrator |
| **File Operations** | Claude Code SDK |
| **Git Integration** | Claude Code SDK |
| **Testing** | Claude Code execution |
| **Configuration** | JSON |
| **Deployment** | npm package |

### Core Architecture Components

```text
┌─────────────────────────────────────────────────────────────┐
│                         Phoenix-Code-Lite                   │
├─────────────────────────────────────────────────────────────┤
│  CLI Interface (Commander.js)                               │
├─────────────────────────────────────────────────────────────┤
│  TDD Workflow Orchestrator                                  │
│  ├── Phase 1: Plan & Test                                   │
│  ├── Phase 2: Implement & Fix                               │
│  └── Phase 3: Refactor & Document                           │
├─────────────────────────────────────────────────────────────┤
│  Claude Code Integration Layer                              │
│  ├── SDK Client Wrapper                                     │
│  └── Agent-Aware Prompt Management                          │
├─────────────────────────────────────────────────────────────┤
│  Utilities & Support                                        │
│  ├── Configuration Management (Optional)                    │
│  ├── Simple Audit Logging                                   │
│  └── Basic Quality Gates                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code SDK                        │
├─────────────────────────────────────────────────────────────┤
│  ✓ LLM Query Interface                                      │
│  ✓ File Editing Capabilities                                │
│  ✓ Command Execution & Git Integration                      │
└─────────────────────────────────────────────────────────────┘
```

### Module Organization

```text
src/
├── index.ts                    // Main entry point
├── cli/                        // Command-line interface
│   ├── commands.ts             // Command implementations
│   └── args.ts                 // Argument parsing
├── tdd/                        // TDD workflow engine
│   ├── orchestrator.ts         // Main linear workflow controller
│   ├── phases/                 // Phase implementations
│   │   ├── plan-test.ts
│   │   ├── implement-fix.ts
│   │   └── refactor-document.ts
│   └── quality-gates.ts        // Basic quality validation system
├── claude/                     // Claude Code SDK integration
│   ├── client.ts               // SDK client wrapper
│   └── prompts.ts              // Prompt templates with agent contexts
├── config/                     // Optional configuration management
│   ├── settings.ts             // Configuration loading and validation
│   └── templates.ts            // Configuration templates
├── utils/                      // Utility modules
│   ├── logger.ts               // Simple audit logging
│   └── schemas.ts              // Zod validation schemas
└── types/                      // TypeScript type definitions
    ├── workflow.ts             // Core workflow types
    └── agents.ts               // Agent persona definitions
```

---

## TDD Workflow Engine Design

### Streamlined Orchestration Architecture

The TDD Orchestrator implements a simple, linear pipeline. Each phase is executed sequentially, depending on the successful completion of the previous one. This approach prioritizes simplicity and predictability over the complexity of a formal state machine.

### Core Data Structures with Zod Validation

To ensure reliability, all key data objects are validated at runtime using Zod schemas.

```typescript
import { z } from 'zod';

// Defines the initial user request
const TaskContextSchema = z.object({
  taskDescription: z.string().min(10, "Task description is too short."),
  projectPath: z.string(),
  language: z.string().optional(),
  framework: z.string().optional(),
});

// Defines the output of the planning phase
const TestSuiteSchema = z.object({
  testFiles: z.array(z.object({ path: z.string(), content: z.string() })),
  summary: z.string(),
});

// Defines the output of the implementation phase
const ImplementationSchema = z.object({
  files: z.array(z.object({ path: z.string(), content: z.string() })),
  summary: z.string(),
});
```

### Phase 1: Plan & Test Generation

**Objective**: Transform a task description into a comprehensive test suite using a specialized "Planning Analyst" agent persona.

**Agent Persona**:

- **Role**: Senior Technical Analyst & Test Designer
- **Expertise**: Requirements analysis, test strategy, edge case identification.
- **Approach**: Methodical, comprehensive, and risk-aware.

### Phase 2: Implementation & Verification

**Objective**: Generate the minimal code required to satisfy all tests generated in Phase 1, using an "Implementation Engineer" agent persona. This phase includes a simple, configurable retry loop to automatically fix failing tests.

**Agent Persona**:

- **Role**: Senior Software Engineer
- **Expertise**: Clean code, design patterns, and performance optimization.
- **Approach**: Pragmatic, test-driven, and focused on maintainability.

### Phase 3: Refactoring & Documentation

**Objective**: Improve the quality, readability, and documentation of the code from Phase 2, using a "Quality Reviewer" agent persona. A final test run ensures no regressions were introduced.

**Agent Persona**:

- **Role**: Senior Code Reviewer & Documentation Specialist
- **Expertise**: Code quality, maintainability, documentation, and refactoring.
- **Approach**: Detail-oriented and focused on long-term code health.

---

## Error Handling & Resilience

### Core Error Handling Strategy

Phoenix-Code-Lite implements simple but robust error handling patterns to ensure reliable operation while maintaining the simplicity-first philosophy.

#### API Failure Management

**Claude Code SDK Failures**:

- **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Timeout Handling**: 30-second timeout for API calls
- **Graceful Degradation**: Clear error messages with suggested actions
- **Session Recovery**: Automatic session restoration on connection issues

**Network and Connectivity Issues**:

- **Connection Timeout**: 15-second initial connection timeout
- **Read Timeout**: 45-second response timeout for complex operations
- **Retry Strategy**: Intelligent retry with backoff for transient failures
- **Offline Handling**: Clear messaging when network unavailable

#### Validation and Schema Errors

**Zod Schema Validation**:

- **Input Validation**: All user inputs validated before processing
- **LLM Response Validation**: Agent outputs validated against expected schemas
- **Error Recovery**: Malformed responses trigger retry with clarified prompts
- **Fallback Handling**: Graceful fallback to simplified operations on validation failures

#### File System and Permission Errors

**File Operation Failures**:

- **Permission Validation**: Pre-flight checks for file/directory access
- **Path Validation**: Security-aware path resolution and validation
- **Atomic Operations**: File operations designed to be atomic where possible
- **Recovery Mechanisms**: Clear error messages with specific resolution steps

#### Phase-Specific Error Handling

**Phase 1 (Plan & Test) Failures**:

- **Incomplete Requirements**: Request clarification with specific questions
- **Test Generation Errors**: Retry with simplified or more specific prompts
- **Schema Validation Failures**: Re-prompt with schema requirements

**Phase 2 (Implement & Fix) Failures**:

- **Compilation Errors**: Automatic retry with error context
- **Test Failures**: Iterative fixing with detailed error analysis
- **Timeout Handling**: Progress checkpoints for long-running implementations

**Phase 3 (Refactor & Document) Failures**:

- **Refactoring Errors**: Validation against original test suite
- **Documentation Generation**: Fallback to minimal documentation on failures
- **Regression Detection**: Automatic rollback on test suite failures

### Error Logging and Debugging

**Structured Error Logging**:

- **Error Context**: Full context preservation for debugging
- **Session Correlation**: Errors correlated with workflow session IDs
- **User-Friendly Messages**: Technical details logged, user sees actionable messages
- **Debug Mode**: Optional verbose error reporting for troubleshooting

---

## Security Implementation

### Security-First Design Principles

Phoenix-Code-Lite implements comprehensive security controls without compromising usability, ensuring safe operation in diverse development environments.

#### File System Security

**Allowed File Paths** (Whitelist Approach):

```typescript
const ALLOWED_PATHS = [
  './src/**',           // Source code directory
  './tests/**',         // Test files directory
  './test/**',          // Alternative test directory
  './docs/**',          // Documentation directory
  './spec/**',          // Specification directory
  './*.json',           // Configuration files (package.json, tsconfig.json)
  './*.js',             // Root-level JavaScript files
  './*.ts',             // Root-level TypeScript files
  './*.md',             // Documentation files
  './README*',          // README files
  './CHANGELOG*',       // Changelog files
];
```

**Blocked File Paths** (Security Controls):

```typescript
const BLOCKED_PATHS = [
  '/etc/**',            // System configuration
  '/var/**',            // System variables
  '/usr/**',            // System binaries
  '/bin/**',            // System binaries
  './node_modules/**',  // Dependencies (read-only)
  './.git/**',          // Git metadata (read-only)
  './.env*',            // Environment secrets
  './.*key*',           // Private keys
  './.*secret*',        // Secret files
  './.*password*',      // Password files
];
```

#### Command Execution Security

**Allowed Commands** (Safe Operations):

```typescript
const ALLOWED_COMMANDS = [
  'npm',                // Package management (with arg validation)
  'node',               // Node.js execution (path restricted)
  'tsc',                // TypeScript compiler
  'jest',               // Testing framework
  'eslint',             // Code linting
  'prettier',           // Code formatting
  'git status',         // Git read operations
  'git diff',           // Git read operations
  'git log',            // Git read operations
];
```

**Blocked Commands** (Security Risk Mitigation):

```typescript
const BLOCKED_COMMANDS = [
  'rm',                 // File deletion
  'sudo',               // Privilege escalation
  'curl',               // Network requests
  'wget',               // Network requests
  'ssh',                // Network connections
  'scp',                // File transfer
  'chmod +x',           // Permission changes
  'eval',               // Code execution
  'exec',               // Process execution
];
```

#### Input Validation and Sanitization

**Task Description Validation**:

```typescript
const TaskDescriptionSchema = z.string()
  .min(10, 'Task description too short')
  .max(1000, 'Task description too long')
  .refine(val => !val.includes('<script'), 'No script tags allowed')
  .refine(val => !val.includes('rm -rf'), 'No destructive commands')
  .refine(val => !val.includes('sudo'), 'No privilege escalation');
```

**File Path Validation**:

```typescript
const validateFilePath = (path: string): boolean => {
  // Prevent path traversal attacks
  if (path.includes('../') || path.includes('..\\')) return false;
  
  // Ensure path is within allowed directories
  return ALLOWED_PATHS.some(pattern => minimatch(path, pattern));
};
```

#### LLM Response Security

**Content Filtering**:

- **Code Injection Prevention**: Validate generated code for malicious patterns
- **Command Injection Prevention**: Strip dangerous commands from responses
- **Path Traversal Prevention**: Validate all file paths in responses
- **Secret Exposure Prevention**: Scan for potential secret patterns

**Response Validation Pipeline**:

1. **Schema Validation**: Ensure response matches expected structure
2. **Content Scanning**: Check for malicious patterns or commands
3. **Path Validation**: Verify all file paths are within allowed directories
4. **Command Validation**: Ensure any commands are in the allowed list
5. **Size Limits**: Enforce reasonable limits on response size

### Security Audit and Logging

**Security Event Logging**:

- **Access Attempts**: Log all file and command access attempts
- **Validation Failures**: Record security validation failures
- **Blocked Operations**: Track blocked commands and file operations
- **Session Security**: Monitor session integrity and authentication

**Audit Trail Requirements**:

- **Immutable Logs**: Security events logged to append-only files
- **Session Correlation**: All security events tied to workflow sessions
- **Timestamps**: UTC timestamps for all security events
- **User Context**: Associate security events with user sessions

---

## Claude Code SDK Integration

### Integration Architecture

Phoenix-Code-Lite leverages the Claude Code SDK as its foundation, implementing a thin orchestration layer that coordinates TDD workflows while delegating core operations to the robust SDK infrastructure.

#### SDK Client Wrapper Design

**Enhanced Client Implementation**:

```typescript
import { ClaudeCodeSDK } from '@anthropic-ai/claude-code-sdk';

export class PhoenixClaudeClient {
  private client: ClaudeCodeSDK;
  private sessionId: string;
  private retryConfig: RetryConfig;
  
  constructor(config: PhoenixConfig) {
    this.client = new ClaudeCodeSDK({
      apiKey: config.anthropicApiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
    });
    
    this.sessionId = generateSessionId();
    this.retryConfig = config.retry || DEFAULT_RETRY_CONFIG;
  }
  
  async executePhase(phase: WorkflowPhase, context: PhaseContext): Promise<PhaseResult> {
    return this.withRetry(async () => {
      const prompt = this.buildPhasePrompt(phase, context);
      const response = await this.client.chat({
        messages: [{ role: 'user', content: prompt }],
        sessionId: this.sessionId,
        context: this.buildSDKContext(context),
      });
      
      return this.validatePhaseResponse(phase, response);
    });
  }
}
```

#### Context Management and Session Handling

**Session Persistence**:

- **Session ID Generation**: UUID-based session identification
- **Context Propagation**: Workflow context maintained across SDK calls
- **State Recovery**: Ability to resume interrupted workflows
- **Session Cleanup**: Proper cleanup of session resources

**Context Building Strategy**:

```typescript
private buildSDKContext(context: PhaseContext): SDKContext {
  return {
    projectPath: context.projectPath,
    language: context.language,
    framework: context.framework,
    workflowPhase: context.currentPhase,
    previousResults: context.previousPhaseResults,
    qualityGates: this.config.qualityGates,
    securityPolicy: this.config.securityPolicy,
  };
}
```

#### Error Handling and SDK Integration

**SDK Error Mapping**:

```typescript
class SDKErrorHandler {
  static mapSDKError(error: SDKError): PhoenixError {
    switch (error.type) {
      case 'RATE_LIMIT_EXCEEDED':
        return new PhoenixError('RATE_LIMIT', 'API rate limit exceeded, please wait');
      case 'AUTHENTICATION_FAILED':
        return new PhoenixError('AUTH_FAILED', 'Claude Code authentication failed');
      case 'NETWORK_ERROR':
        return new PhoenixError('NETWORK', 'Network connection failed');
      case 'TIMEOUT':
        return new PhoenixError('TIMEOUT', 'Request timed out');
      default:
        return new PhoenixError('SDK_ERROR', error.message);
    }
  }
}
```

**Retry Logic Integration**:

```typescript
private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!this.shouldRetry(error, attempt)) {
        throw SDKErrorHandler.mapSDKError(error);
      }
      
      await this.delay(this.calculateBackoff(attempt));
    }
  }
  
  throw SDKErrorHandler.mapSDKError(lastError);
}
```

#### File Operations Delegation

**File System Operations**:

- **Read Operations**: Delegate to SDK file reading capabilities
- **Write Operations**: Use SDK file writing with security validation
- **Directory Operations**: Leverage SDK directory management
- **Git Integration**: Utilize SDK git operations for version control

**Operation Coordination**:

```typescript
export class FileOperationCoordinator {
  constructor(private client: PhoenixClaudeClient) {}
  
  async writeTestFiles(testSuite: TestSuite): Promise<void> {
    for (const testFile of testSuite.testFiles) {
      await this.client.writeFile({
        path: testFile.path,
        content: testFile.content,
        createDirectories: true,
        backup: true,
      });
    }
  }
  
  async executeTests(testCommand: string): Promise<TestResults> {
    return this.client.executeCommand({
      command: testCommand,
      workingDirectory: this.projectPath,
      timeout: 60000,
      captureOutput: true,
    });
  }
}
```

---

## Quality & Configuration

### Basic Quality Gates

To ensure a baseline of quality without adding significant overhead, the orchestrator runs a series of simple validation checks after key phases. These are not a complex, weighted scoring system but rather a set of pass/fail criteria.

- **Syntax Validation**: Checks for basic syntax errors in generated code.
- **Test Execution**: Verifies that the test suite runs and passes.
- **Test Coverage Heuristic**: Ensures test files were generated for corresponding implementation files.
- **Documentation Check (Optional)**: Verifies that comments or a README were generated.

### Optional Configuration Management

Phoenix-Code-Lite is designed to work out-of-the-box with zero configuration. For users who need more control, an optional `.phoenix-code-lite.json` file can be used to customize behavior, such as the number of retry attempts or enabling specific quality gates.

#### Configuration Schema and Validation

```typescript
export const PhoenixConfigSchema = z.object({
  // Core settings
  anthropicApiKey: z.string().optional(), // Falls back to env var
  projectPath: z.string().default('./'),
  
  // Workflow configuration
  maxRetries: z.number().min(1).max(5).default(3),
  timeout: z.number().min(5000).max(120000).default(30000),
  
  // Quality gates
  qualityGates: z.object({
    syntaxValidation: z.boolean().default(true),
    testExecution: z.boolean().default(true),
    coverageCheck: z.boolean().default(false),
    documentationCheck: z.boolean().default(false),
  }).default({}),
  
  // Agent configuration
  agents: z.object({
    planningAnalyst: z.object({
      temperature: z.number().min(0).max(1).default(0.3),
      maxTokens: z.number().min(500).max(4000).default(2000),
    }).default({}),
    implementationEngineer: z.object({
      temperature: z.number().min(0).max(1).default(0.2),
      maxTokens: z.number().min(1000).max(8000).default(4000),
    }).default({}),
    qualityReviewer: z.object({
      temperature: z.number().min(0).max(1).default(0.1),
      maxTokens: z.number().min(500).max(3000).default(1500),
    }).default({}),
  }).default({}),
  
  // Security settings
  security: z.object({
    allowedPaths: z.array(z.string()).optional(),
    blockedPaths: z.array(z.string()).optional(),
    allowedCommands: z.array(z.string()).optional(),
    blockedCommands: z.array(z.string()).optional(),
  }).default({}),
});

export type PhoenixConfig = z.infer<typeof PhoenixConfigSchema>;
```

#### Configuration Templates

**Starter Template** (`.phoenix-code-lite.json`):

```json
{
  "qualityGates": {
    "syntaxValidation": true,
    "testExecution": true,
    "coverageCheck": false,
    "documentationCheck": false
  },
  "maxRetries": 3,
  "timeout": 30000
}
```

**Professional Template**:

```json
{
  "qualityGates": {
    "syntaxValidation": true,
    "testExecution": true,
    "coverageCheck": true,
    "documentationCheck": true
  },
  "agents": {
    "planningAnalyst": {
      "temperature": 0.2,
      "maxTokens": 3000
    },
    "implementationEngineer": {
      "temperature": 0.1,
      "maxTokens": 6000
    },
    "qualityReviewer": {
      "temperature": 0.05,
      "maxTokens": 2000
    }
  },
  "maxRetries": 5,
  "timeout": 60000
}
```

---

## Development Process & Build Workflow

### Development Environment Setup

Phoenix-Code-Lite follows a systematic development approach designed for reliability and maintainability.

#### Prerequisites and Dependencies

**System Requirements**:

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- TypeScript 5.0+
- Git for version control

**Core Dependencies**:

```json
{
  "dependencies": {
    "@anthropic-ai/claude-code-sdk": "^1.0.0",
    "commander": "^11.0.0",
    "zod": "^3.22.0",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0",
    "jest": "^29.6.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.1.0"
  }
}
```

#### Development Commands and Scripts

**Core Development Workflow**:

```bash
# Initial setup
npm install                    # Install dependencies
npm run build:check           # Validate TypeScript compilation

# Development cycle
npm run dev                    # Run with ts-node for development
npm run build                  # Compile TypeScript to JavaScript
npm run test                   # Execute Jest test suite
npm run test:watch            # Continuous testing during development
npm run test:coverage         # Generate coverage reports

# Code quality
npm run lint                   # ESLint validation
npm run lint:fix              # Auto-fix ESLint issues
npm run format                # Prettier code formatting
npm run format:check          # Check Prettier formatting

# Production
npm run build:prod            # Production build with optimizations
npm start                     # Run compiled application
```

**Package.json Scripts Configuration**:

```json
{
  "scripts": {
    "build": "tsc",
    "build:check": "tsc --noEmit",
    "build:prod": "tsc --build --verbose",
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.ts",
    "format:check": "prettier --check src/**/*.ts",
    "clean": "rimraf dist",
    "prepare": "npm run build"
  }
}
```

### Build System Configuration

#### TypeScript Configuration

**tsconfig.json** (Strict Configuration):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### Code Quality Configuration

**ESLint Configuration** (.eslintrc.js):

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-const': 'error',
    'no-console': 'warn'
  }
};
```

**Prettier Configuration** (.prettierrc):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Quality Assurance Process

#### Pre-commit Validation Pipeline

**Validation Steps** (Automated):

1. **TypeScript Compilation**: `tsc --noEmit` for type checking
2. **ESLint Validation**: Code quality and style enforcement
3. **Prettier Check**: Code formatting consistency
4. **Unit Tests**: `jest` test suite execution
5. **Coverage Threshold**: Minimum 80% code coverage requirement

**Git Hooks Integration** (husky + lint-staged):

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test && npm run build:check"
    }
  },
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

#### Continuous Integration Requirements

**CI/CD Pipeline Steps**:

1. **Environment Setup**: Node.js 18+ environment preparation
2. **Dependency Installation**: `npm ci` for reproducible builds
3. **Code Quality Gates**: ESLint, Prettier, TypeScript compilation
4. **Test Execution**: Full test suite with coverage reporting
5. **Build Validation**: Production build verification
6. **Security Scanning**: npm audit for vulnerability detection
7. **Package Validation**: Installation and basic functionality tests

---

## Performance Expectations & Guidelines

### Performance Benchmarks and Targets

Phoenix-Code-Lite is designed for efficient operation while maintaining quality and reliability standards.

#### Workflow Execution Performance

**Target Performance Metrics**:

- **Total Workflow Time**: < 60 seconds for typical tasks (simple functions, components)
- **Phase 1 (Planning)**: < 15 seconds for test generation
- **Phase 2 (Implementation)**: < 30 seconds for code generation and validation
- **Phase 3 (Refactoring)**: < 15 seconds for documentation and cleanup
- **Retry Operations**: < 10 seconds additional per retry attempt

**Complexity-Based Scaling**:

```typescript
interface PerformanceTargets {
  simple: {
    maxWorkflowTime: 45,     // seconds
    maxPhase1Time: 10,       // seconds
    maxPhase2Time: 25,       // seconds
    maxPhase3Time: 10,       // seconds
  },
  moderate: {
    maxWorkflowTime: 90,     // seconds
    maxPhase1Time: 20,       // seconds
    maxPhase2Time: 50,       // seconds
    maxPhase3Time: 20,       // seconds
  },
  complex: {
    maxWorkflowTime: 180,    // seconds
    maxPhase1Time: 40,       // seconds
    maxPhase2Time: 100,      // seconds
    maxPhase3Time: 40,       // seconds
  }
}
```

#### Resource Usage Guidelines

**Memory Usage Targets**:

- **Peak Memory Usage**: < 500MB during normal operations
- **Baseline Memory**: < 100MB when idle
- **Memory Growth**: < 50MB per concurrent workflow
- **Garbage Collection**: Efficient cleanup between workflows

**API Efficiency Targets**:

- **Token Usage Optimization**: 30-50% reduction through prompt engineering
- **API Call Minimization**: < 10 API calls per workflow phase
- **Response Caching**: 80% cache hit rate for similar operations
- **Batch Operations**: Group related operations where possible

#### Network and I/O Performance

**Network Performance**:

- **API Response Time**: < 5 seconds for standard operations
- **Connection Timeout**: 15 seconds for initial connection
- **Read Timeout**: 45 seconds for complex operations
- **Retry Backoff**: Exponential backoff with 1s, 2s, 4s intervals

**File System Performance**:

- **File Read Operations**: < 100ms for typical source files
- **File Write Operations**: < 200ms with backup and validation
- **Directory Operations**: < 50ms for directory creation/validation
- **Concurrent File Ops**: Limited to 3 concurrent operations

### Performance Monitoring and Optimization

#### Built-in Performance Metrics

**Automatic Metrics Collection**:

```typescript
interface PerformanceMetrics {
  workflowStartTime: number;
  phaseTimings: {
    phase1Duration: number;
    phase2Duration: number;
    phase3Duration: number;
  };
  apiMetrics: {
    totalApiCalls: number;
    totalTokensUsed: number;
    averageResponseTime: number;
  };
  resourceUsage: {
    peakMemoryUsage: number;
    averageMemoryUsage: number;
    fileOperationsCount: number;
  };
}
```

**Performance Logging**:

- **Workflow Timing**: Detailed timing for each phase and operation
- **Resource Monitoring**: Memory and CPU usage tracking
- **API Efficiency**: Token usage and response time monitoring
- **Bottleneck Detection**: Automatic identification of slow operations

#### Performance Optimization Strategies

**Prompt Engineering Optimization**:

- **Template Reuse**: Cached prompt templates for common operations
- **Context Minimization**: Include only essential context in prompts
- **Response Formatting**: Structured responses to minimize parsing overhead
- **Batch Processing**: Group related operations in single API calls

**Caching and State Management**:

- **Response Caching**: Cache LLM responses for identical inputs
- **Session State**: Maintain session state to avoid redundant operations
- **File System Caching**: Cache file contents and metadata
- **Schema Validation Caching**: Cache compiled Zod schemas

**Resource Management**:

- **Memory Cleanup**: Explicit cleanup of large objects after use
- **Stream Processing**: Use streams for large file operations
- **Connection Pooling**: Reuse HTTP connections where possible
- **Lazy Loading**: Load modules and resources only when needed

### Performance Degradation Handling

**Automatic Performance Adjustment**:

- **Timeout Scaling**: Increase timeouts under high load conditions
- **Retry Reduction**: Reduce retry attempts when experiencing consistent delays
- **Quality Gate Adjustment**: Temporarily disable non-critical quality gates
- **Batch Size Reduction**: Reduce operation batch sizes under resource pressure

**Performance Alert Thresholds**:

- **Workflow Time > 120s**: Warning alert with optimization suggestions
- **Memory Usage > 750MB**: Resource warning with cleanup recommendations
- **API Response Time > 10s**: Network performance alert
- **Error Rate > 10%**: System stability alert

---

## Agent Prompt Engineering & Specialization

### Agent Persona Implementation

Phoenix-Code-Lite employs three specialized agent personas, each optimized for specific phases of the TDD workflow with carefully engineered prompts and behavioral patterns.

#### Planning Analyst Agent

**Core Identity and Expertise**:

```typescript
const PLANNING_ANALYST_PERSONA = {
  role: \"Senior Technical Analyst & Test Designer\",
  expertise: [
    \"Requirements analysis and decomposition\",
    \"Test strategy development\",
    \"Edge case identification\",
    \"Risk assessment and mitigation\",
    \"Technical specification creation\"
  ],
  approach: \"methodical, comprehensive, risk-aware, systematic\",
  outputFormat: \"structured test specifications with comprehensive coverage\"
};
```

**System Prompt Template**:

```typescript
const PLANNING_ANALYST_PROMPT = `
You are a Senior Technical Analyst & Test Designer with deep expertise in test-driven development and requirements analysis.

Your primary responsibilities:
1. Analyze task requirements comprehensively
2. Identify potential edge cases and failure modes
3. Design comprehensive test strategies
4. Create detailed test specifications
5. Ensure complete requirement coverage

Approach:
- Be methodical and systematic in your analysis
- Consider both happy path and edge cases
- Think about error conditions and boundary cases
- Focus on testable, measurable outcomes
- Provide clear, actionable test specifications

Output Format:
Provide a structured response with:
- Requirement analysis summary
- Test strategy overview
- Detailed test cases with expected outcomes
- Edge cases and error conditions
- Implementation guidance

Language: {language}
Framework: {framework}
Project Context: {projectContext}

Task: {taskDescription}
`;
```

**Specialized Prompt Variations**:

- **Frontend Components**: Emphasizes accessibility, responsive design, user interaction testing
- **Backend APIs**: Focuses on data validation, error handling, security considerations
- **Utility Functions**: Concentrates on pure function testing, input validation, performance

#### Implementation Engineer Agent

**Core Identity and Expertise**:

```typescript
const IMPLEMENTATION_ENGINEER_PERSONA = {
  role: \"Senior Software Engineer\",
  expertise: [
    \"Clean code architecture\",
    \"Design pattern implementation\",
    \"Performance optimization\",
    \"Test-driven development\",
    \"Code maintainability\"
  ],
  approach: \"pragmatic, test-driven, maintainable, efficient\",
  outputFormat: \"production-ready code with clear structure and minimal implementation\"
};
```

**System Prompt Template**:

```typescript
const IMPLEMENTATION_ENGINEER_PROMPT = `
You are a Senior Software Engineer specializing in test-driven development and clean code architecture.

Your primary responsibilities:
1. Implement code that passes all provided tests
2. Write clean, maintainable, and well-structured code
3. Follow established patterns and conventions
4. Optimize for readability and maintainability
5. Implement minimal viable solutions that satisfy requirements

Coding Principles:
- Write only the code necessary to pass tests
- Follow SOLID principles and clean code practices
- Use appropriate design patterns
- Include clear, concise comments
- Handle errors gracefully
- Optimize for maintainability over cleverness

Test Results Context:
{testResults}

Failing Tests:
{failingTests}

Project Structure:
{projectStructure}

Language: {language}
Framework: {framework}

Implement the minimal code required to pass all tests.
`;
```

**Error-Driven Refinement Prompts**:

```typescript
const ERROR_REFINEMENT_PROMPT = `
The previous implementation has failing tests. Analyze the failures and provide targeted fixes.

Failing Test Results:
{testFailures}

Current Implementation:
{currentImplementation}

Focus on:
1. Understanding the specific test failures
2. Identifying the root cause of each failure
3. Making minimal, targeted changes
4. Ensuring no existing functionality is broken

Provide only the necessary changes to fix the failing tests.
`;
```

#### Quality Reviewer Agent

**Core Identity and Expertise**:

```typescript
const QUALITY_REVIEWER_PERSONA = {
  role: \"Senior Code Reviewer & Documentation Specialist\",
  expertise: [
    \"Code quality assessment\",
    \"Refactoring strategies\",
    \"Documentation standards\",
    \"Performance optimization\",
    \"Maintainability improvement\"
  ],
  approach: \"detail-oriented, quality-focused, long-term maintainability\",
  outputFormat: \"polished code with comprehensive documentation\"
};
```

**System Prompt Template**:

```typescript
const QUALITY_REVIEWER_PROMPT = `
You are a Senior Code Reviewer & Documentation Specialist focused on code quality and long-term maintainability.

Your primary responsibilities:
1. Review and improve code quality without changing functionality
2. Enhance readability and maintainability
3. Add comprehensive documentation
4. Optimize performance where appropriate
5. Ensure adherence to best practices

Review Focus Areas:
- Code structure and organization
- Variable and function naming
- Comment quality and documentation
- Error handling completeness
- Performance optimization opportunities
- Adherence to language/framework conventions

Current Implementation:
{currentImplementation}

Test Suite:
{testSuite}

Quality Criteria:
- All tests must continue to pass
- Improve code readability and maintainability
- Add clear, helpful documentation
- Follow established project conventions
- Optimize for long-term maintenance

Language: {language}
Framework: {framework}

Provide the refined implementation with quality improvements.
`;
```

### Context-Aware Prompt Engineering

#### Dynamic Context Integration

**Project Context Building**:

```typescript
interface PromptContext {
  taskDescription: string;
  language: string;
  framework?: string;
  projectStructure: ProjectStructure;
  existingCode?: string;
  testResults?: TestResults;
  previousPhaseResults?: PhaseResults;
  qualityGates: QualityGateConfig;
}

class PromptContextBuilder {
  static buildContext(phase: WorkflowPhase, input: PhaseInput): PromptContext {
    return {
      taskDescription: input.taskDescription,
      language: input.language || 'TypeScript',
      framework: input.framework,
      projectStructure: this.analyzeProjectStructure(input.projectPath),
      existingCode: this.loadExistingCode(input.projectPath),
      testResults: phase > 1 ? input.previousPhaseResults?.testResults : undefined,
      previousPhaseResults: input.previousPhaseResults,
      qualityGates: input.config.qualityGates,
    };
  }
}
```

#### Framework-Specific Adaptations

**React/Frontend Specialization**:

```typescript
const REACT_SPECIFIC_ADDITIONS = `
Additional React Considerations:
- Use functional components with hooks
- Follow React best practices and conventions
- Implement proper prop validation with TypeScript or PropTypes
- Consider accessibility (ARIA labels, semantic HTML)
- Include responsive design considerations
- Test user interactions and component states
`;
```

**Node.js/Backend Specialization**:

```typescript
const NODEJS_SPECIFIC_ADDITIONS = `
Additional Node.js Considerations:
- Implement proper error handling with try-catch blocks
- Use async/await for asynchronous operations
- Include input validation and sanitization
- Consider security implications (OWASP guidelines)
- Implement proper logging for debugging
- Handle edge cases and error conditions
`;
```

### Prompt Optimization Strategies

#### Token Efficiency Techniques

**Template Reuse and Caching**:

- **Base Templates**: Reusable prompt templates for common scenarios
- **Context Injection**: Dynamic context insertion into cached templates
- **Response Parsing**: Structured response formats to minimize parsing overhead
- **Incremental Updates**: Send only changes rather than full context

**Context Minimization**:

```typescript
class ContextOptimizer {
  static minimizeContext(context: PromptContext, phase: WorkflowPhase): OptimizedContext {
    // Include only relevant context for current phase
    switch (phase) {
      case WorkflowPhase.PLAN_AND_TEST:
        return {
          taskDescription: context.taskDescription,
          language: context.language,
          framework: context.framework,
          projectStructure: this.summarizeStructure(context.projectStructure),
        };
      case WorkflowPhase.IMPLEMENT_AND_FIX:
        return {
          testResults: context.testResults,
          failingTests: this.extractFailingTests(context.testResults),
          language: context.language,
          framework: context.framework,
        };
      // ... other phases
    }
  }
}
```

---

## Testing Strategy & Quality Assurance

### Comprehensive Testing Framework

Phoenix-Code-Lite implements a multi-layered testing strategy to ensure reliability, performance, and quality across all components.

#### Testing Architecture

**Testing Pyramid Implementation**:

```text
                    ┌─────────────────┐
                    │   E2E Tests     │  <- Full workflow integration
                    │   (5-10 tests)  │
                ┌───┴─────────────────┴───┐
                │    Integration Tests    │  <- Component interaction
                │      (20-30 tests)      │
            ┌───┴─────────────────────────┴───┐
            │           Unit Tests            │  <- Individual functions
            │          (100+ tests)           │
            └─────────────────────────────────┘
```

#### Unit Testing Strategy

**Jest Configuration** (jest.config.js):

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

**Core Component Testing**:

*TDD Orchestrator Tests*:

```typescript
describe('TDD Orchestrator', () => {
  let orchestrator: TDDOrchestrator;
  let mockClaudeClient: jest.Mocked<PhoenixClaudeClient>;

  beforeEach(() => {
    mockClaudeClient = createMockClaudeClient();
    orchestrator = new TDDOrchestrator(mockClaudeClient, testConfig);
  });

  describe('workflow execution', () => {
    it('should execute complete workflow successfully', async () => {
      const taskContext = createTestTaskContext();
      const result = await orchestrator.executeWorkflow(taskContext);
      
      expect(result.success).toBe(true);
      expect(result.phases).toHaveLength(3);
      expect(mockClaudeClient.executePhase).toHaveBeenCalledTimes(3);
    });

    it('should handle phase failures with retries', async () => {
      mockClaudeClient.executePhase
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(createMockPhaseResult());
      
      const result = await orchestrator.executeWorkflow(createTestTaskContext());
      
      expect(result.success).toBe(true);
      expect(mockClaudeClient.executePhase).toHaveBeenCalledTimes(4); // 1 failure + 3 successes
    });
  });
});
```

*Schema Validation Tests*:

```typescript
describe('Schema Validation', () => {
  describe('TaskContextSchema', () => {
    it('should validate correct task context', () => {
      const validContext = {
        taskDescription: 'Create a user authentication function',
        projectPath: './src',
        language: 'TypeScript',
        framework: 'Express'
      };
      
      expect(() => TaskContextSchema.parse(validContext)).not.toThrow();
    });

    it('should reject invalid task descriptions', () => {
      const invalidContext = {
        taskDescription: 'Short', // Too short
        projectPath: './src'
      };
      
      expect(() => TaskContextSchema.parse(invalidContext)).toThrow();
    });
  });
});
```

#### Integration Testing Strategy

**Component Integration Tests**:

```typescript
describe('Integration: TDD Workflow', () => {
  let testEnvironment: TestEnvironment;
  
  beforeEach(async () => {
    testEnvironment = await createTestEnvironment();
  });
  
  afterEach(async () => {
    await testEnvironment.cleanup();
  });
  
  it('should complete full TDD workflow for simple function', async () => {
    const taskContext = {
      taskDescription: 'Create a function that adds two numbers',
      projectPath: testEnvironment.projectPath,
      language: 'TypeScript'
    };
    
    const result = await testEnvironment.executeWorkflow(taskContext);
    
    expect(result.success).toBe(true);
    expect(testEnvironment.hasFile('src/add.ts')).toBe(true);
    expect(testEnvironment.hasFile('tests/add.test.ts')).toBe(true);
    
    const testResults = await testEnvironment.runTests();
    expect(testResults.success).toBe(true);
  });
});
```

**Claude Code SDK Integration**:

```typescript
describe('Integration: Claude Code SDK', () => {
  it('should handle SDK authentication errors gracefully', async () => {
    const clientWithBadAuth = new PhoenixClaudeClient({
      anthropicApiKey: 'invalid-key',
      ...testConfig
    });
    
    await expect(clientWithBadAuth.executePhase(
      WorkflowPhase.PLAN_AND_TEST,
      createTestContext()
    )).rejects.toThrow('Authentication failed');
  });
  
  it('should retry on network failures', async () => {
    const networkFailureClient = createNetworkFailureClient();
    
    const result = await networkFailureClient.executePhase(
      WorkflowPhase.PLAN_AND_TEST,
      createTestContext()
    );
    
    expect(result).toBeDefined();
    expect(networkFailureClient.getRetryCount()).toBeGreaterThan(0);
  });
});
```

#### End-to-End Testing Strategy

**Full Workflow E2E Tests**:

```typescript
describe('E2E: Complete Workflows', () => {
  let e2eEnvironment: E2EEnvironment;
  
  beforeAll(async () => {
    e2eEnvironment = await E2EEnvironment.create();
  });
  
  afterAll(async () => {
    await e2eEnvironment.destroy();
  });
  
  it('should complete React component workflow', async () => {
    const result = await e2eEnvironment.runCLI([
      'create-component',
      '--task', 'Create a LoginButton component with click handling',
      '--language', 'TypeScript',
      '--framework', 'React',
      '--project-path', './test-project'
    ]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Workflow completed successfully');
    
    // Verify generated files
    expect(e2eEnvironment.fileExists('./test-project/src/LoginButton.tsx')).toBe(true);
    expect(e2eEnvironment.fileExists('./test-project/tests/LoginButton.test.tsx')).toBe(true);
    
    // Verify tests pass
    const testResults = await e2eEnvironment.runCommand('npm test');
    expect(testResults.exitCode).toBe(0);
  });
});
```

### Quality Gates and Validation

#### Automated Quality Validation

**Quality Gate Implementation**:

```typescript
class QualityGateValidator {
  async validatePhaseOutput(phase: WorkflowPhase, output: PhaseOutput): Promise<QualityResult> {
    const results = await Promise.all([
      this.validateSyntax(output),
      this.validateTests(output),
      this.validateCoverage(output),
      this.validateDocumentation(output),
    ]);
    
    return {
      passed: results.every(r => r.passed),
      results: results,
      overall_score: this.calculateOverallScore(results),
    };
  }
  
  private async validateSyntax(output: PhaseOutput): Promise<ValidationResult> {
    try {
      // Use TypeScript compiler API for syntax validation
      const diagnostics = await this.compileTypeScript(output.files);
      return {
        passed: diagnostics.length === 0,
        message: diagnostics.length > 0 ? `Syntax errors: ${diagnostics.length}` : 'Syntax valid',
        details: diagnostics,
      };
    } catch (error) {
      return {
        passed: false,
        message: `Syntax validation failed: ${error.message}`,
        details: error,
      };
    }
  }
}
```

#### Performance Testing

**Performance Regression Tests**:

```typescript
describe('Performance Regression Tests', () => {
  const PERFORMANCE_THRESHOLDS = {
    maxWorkflowTime: 60000, // 60 seconds
    maxMemoryUsage: 500 * 1024 * 1024, // 500MB
    maxApiCalls: 10,
  };
  
  it('should complete simple workflow within time threshold', async () => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    const result = await executeSimpleWorkflow();
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    expect(endTime - startTime).toBeLessThan(PERFORMANCE_THRESHOLDS.maxWorkflowTime);
    expect(endMemory - startMemory).toBeLessThan(PERFORMANCE_THRESHOLDS.maxMemoryUsage);
    expect(result.apiCallCount).toBeLessThan(PERFORMANCE_THRESHOLDS.maxApiCalls);
  });
});
```

---

## Deployment & Distribution

### Package Distribution Strategy

Phoenix-Code-Lite is distributed as an npm package with global CLI installation capabilities, designed for seamless integration into development workflows.

#### NPM Package Configuration

**Package.json Configuration**:

```json
{
  \"name\": \"phoenix-code-lite\",
  \"version\": \"1.0.0\",
  \"description\": \"Streamlined TDD workflow orchestrator built on Claude Code SDK\",
  \"main\": \"dist/index.js\",
  \"types\": \"dist/index.d.ts\",
  \"bin\": {
    \"phoenix-code-lite\": \"dist/cli.js\",
    \"pcl\": \"dist/cli.js\"
  },
  \"files\": [
    \"dist/**/*\",
    \"README.md\",
    \"LICENSE\",
    \"CHANGELOG.md\"
  ],
  \"engines\": {
    \"node\": \">=18.0.0\",
    \"npm\": \">=9.0.0\"
  },
  \"os\": [\"darwin\", \"linux\", \"win32\"],
  \"keywords\": [
    \"tdd\",
    \"test-driven-development\",
    \"claude-code\",
    \"ai-development\",
    \"workflow-automation\",
    \"typescript\"
  ],
  \"repository\": {
    \"type\": \"git\",
    \"url\": \"https://github.com/phoenix-framework/phoenix-code-lite.git\"
  },
  \"bugs\": {
    \"url\": \"https://github.com/phoenix-framework/phoenix-code-lite/issues\"
  },
  \"homepage\": \"https://github.com/phoenix-framework/phoenix-code-lite#readme\",
  \"license\": \"MIT\"
}
```

#### Build and Distribution Pipeline

**Production Build Process**:

```bash
#!/bin/bash
# build-production.sh

set -e

echo \"Starting production build...\"

# Clean previous builds
npm run clean

# Install dependencies
npm ci

# Run quality checks
npm run lint
npm run format:check
npm run test

# TypeScript compilation
npm run build

# Validate build
node dist/index.js --version

# Package validation
npm pack --dry-run

echo \"Production build completed successfully\"
```

**GitHub Actions CI/CD**:

```yaml
name: Build and Publish

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 21]
    
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run lint
  
  publish:
    needs: test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Installation and Setup

#### Global Installation

**Primary Installation Method**:

```bash
# Global installation (recommended)
npm install -g phoenix-code-lite

# Verify installation
phoenix-code-lite --version
pcl --version  # Short alias

# Alternative: npx usage (no installation)
npx phoenix-code-lite --help
```

**Local Project Installation**:

```bash
# Local installation for project-specific use
npm install --save-dev phoenix-code-lite

# Add to package.json scripts
{
  \"scripts\": {
    \"tdd\": \"phoenix-code-lite\",
    \"create-component\": \"pcl create-component\"
  }
}
```

#### Environment Setup and Configuration

**Required Environment Variables**:

```bash
# Required: Anthropic API key for Claude Code SDK
export ANTHROPIC_API_KEY=\"your-api-key-here\"

# Optional: Custom configuration
export PHOENIX_CONFIG_PATH=\"./custom-phoenix-config.json\"

# Optional: Debug mode
export PHOENIX_DEBUG=true
```

**Post-Installation Verification**:

```bash
#!/bin/bash
# verify-installation.sh

echo \"Verifying Phoenix-Code-Lite installation...\"

# Check command availability
if ! command -v phoenix-code-lite &> /dev/null; then
    echo \"✗ phoenix-code-lite command not found\"
    exit 1
fi

# Check version
VERSION=$(phoenix-code-lite --version)
echo \"✓ Version: $VERSION\"

# Check API key
if [ -z \"$ANTHROPIC_API_KEY\" ]; then
    echo \"⚠  ANTHROPIC_API_KEY not set\"
    echo \"   Set your API key: export ANTHROPIC_API_KEY='your-key'\"
else
    echo \"✓ API key configured\"
fi

# Test basic functionality
echo \"Testing basic functionality...\"
phoenix-code-lite --help > /dev/null
if [ $? -eq 0 ]; then
    echo \"✓ Basic functionality working\"
else
    echo \"✗ Basic functionality test failed\"
    exit 1
fi

echo \"✓ Installation verified successfully\"
```

### Platform-Specific Considerations

#### Cross-Platform Compatibility

**File Path Handling**:

```typescript
import * as path from 'path';
import * as os from 'os';

class PlatformUtils {
  static normalizePath(inputPath: string): string {
    // Normalize path separators across platforms
    return path.resolve(inputPath);
  }
  
  static getConfigDirectory(): string {
    const homeDir = os.homedir();
    switch (os.platform()) {
      case 'win32':
        return path.join(homeDir, 'AppData', 'Roaming', 'phoenix-code-lite');
      case 'darwin':
        return path.join(homeDir, 'Library', 'Application Support', 'phoenix-code-lite');
      default:
        return path.join(homeDir, '.config', 'phoenix-code-lite');
    }
  }
}
```

**Command Execution**:

```typescript
import { spawn } from 'child_process';

class CommandExecutor {
  static executeCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const isWindows = os.platform() === 'win32';
      const cmd = isWindows ? 'cmd' : 'sh';
      const cmdArgs = isWindows ? ['/c', command, ...args] : ['-c', `${command} ${args.join(' ')}`];
      
      const child = spawn(cmd, cmdArgs, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: isWindows
      });
      
      // Handle output and completion...
    });
  }
}
```

#### Distribution Channels

**Primary Distribution**:

- **NPM Registry**: Main distribution channel with semantic versioning
- **GitHub Releases**: Source code and release notes
- **Documentation Site**: Installation guides and tutorials

**Alternative Installation Methods**:

```bash
# Direct from GitHub (development versions)
npm install -g github:phoenix-framework/phoenix-code-lite

# Specific version installation
npm install -g phoenix-code-lite@1.0.0

# Pre-release versions
npm install -g phoenix-code-lite@beta
```

---

## Evolution Roadmap & Future Vision

This specification defines the core, streamlined version of Phoenix-Code-Lite. The architecture is designed to be extensible, and future versions may incorporate more advanced concepts from the full Phoenix Framework.

The following features are explicitly deferred from this version to maintain simplicity:

- **Advanced State Management**: A formal Hierarchical Finite State Machine (H-FSM) for managing complex, non-linear workflows is considered out of scope. The current linear orchestrator is sufficient.
- **Agent Memory System**: A persistent memory system for agents to learn across sessions is a powerful but complex feature reserved for future exploration.
- **Advanced Quality Gates**: A sophisticated, weighted quality scoring system is deferred in favor of the current basic validation checks.
- **Automated Security Scanning**: Integration with static analysis security tools (SAST) is a planned future enhancement.
- **Team Collaboration Features**: Functionality for multi-developer workflows and shared configurations will be considered in a future version.

---

## Conclusion

This specification outlines a pragmatic and achievable vision for Phoenix-Code-Lite. By focusing on a simple, linear TDD workflow and leveraging the power of the Claude Code SDK, the project can deliver significant value without the architectural overhead of more complex frameworks. It provides a solid foundation for quality-driven, AI-assisted development, with a clear path for future evolution.

---

**Document Version**: 1.1 (Revised for Simplicity and Clarity)  
**Status**: Approved for Implementation  
**Last Updated**: January 2025
