# Code Standards for VDL_Vault Repository

## ⊕ Overview

The VDL_Vault repository maintains consistent coding standards across all TypeScript projects to ensure maintainability, readability, and type safety. These standards apply to Phoenix Code Lite, QMS Infrastructure components, and any other TypeScript projects in the repository.

## ⋇ TypeScript Configuration Standards

### Standard Compiler Settings (tsconfig.json)

For all TypeScript projects in the repository:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "strict": true,                    // Enable all strict type checks
    "noImplicitAny": true,            // Disallow implicit 'any' types
    "strictNullChecks": true,         // Enable strict null checks
    "strictFunctionTypes": true,       // Enable strict function type checks
    "noImplicitReturns": true,        // Report error on unreachable code
    "noImplicitThis": true,           // Report error on 'this' expressions
    "noUnusedLocals": true,           // Report error on unused locals
    "noUnusedParameters": true,       // Report error on unused parameters
    "exactOptionalPropertyTypes": true, // Exact optional property types
    "declaration": true,              // Generate .d.ts files
    "declarationMap": true,           // Generate sourcemaps for declarations
    "sourceMap": true                 // Generate sourcemaps
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests/temp"]
}
```

### Project-Specific Variations

#### Phoenix Code Lite
- Additional `"resolveJsonModule": true` for configuration loading
- `"esModuleInterop": true` for Claude SDK compatibility

#### QMS Infrastructure Components
- Additional `"preserveConstEnums": true` for compliance validation
- `"skipLibCheck": false` for strict regulatory compliance

### ESLint Configuration Standards

Standard ESLint configuration for all TypeScript projects:

```javascript
// eslint.config.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    // Core TypeScript Rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    
    // Code Quality Rules
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
    'curly': 'error',
    
    // Repository-Specific Rules
    'no-console': 'warn',                    // Use logging utilities instead
    'max-len': ['error', { 'code': 120 }],  // Consistent line length
    'indent': ['error', 2],                  // 2-space indentation
  },
  // Project-specific overrides
  overrides: [
    {
      files: ['tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
        'no-console': 'off'                          // Allow console in tests
      }
    }
  ]
};
```

## ⊛ Code Structure Standards

### File Organization

#### Directory Structure
```text
src/
├── core/                 # Core infrastructure (all projects)
├── utils/               # Shared utilities
├── types/               # Type definitions
├── config/              # Configuration management
└── [project-specific]/  # Project-specific modules
    ├── components/      # Feature components
    ├── services/        # Business logic services
    ├── interfaces/      # Public interfaces
    └── adapters/        # External integrations
```

#### File Naming Conventions
- **Classes**: `PascalCase.ts` (e.g., `ConfigManager.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `audit-logger.ts`)
- **Types**: `kebab-case.ts` with descriptive names (e.g., `workflow-types.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`
- **Interfaces**: `I` prefix when needed (e.g., `IAuditLogger`)

### Import Standards

#### Import Order
```typescript
// 1. Node.js built-in modules
import { readFile } from 'fs/promises';
import path from 'path';

// 2. External npm packages
import { z } from 'zod';
import chalk from 'chalk';

// 3. Internal modules (absolute paths from src/)
import { ConfigManager } from '../core/config-manager.js';
import { AuditLogger } from '../utils/audit-logger.js';

// 4. Type-only imports (separated)
import type { WorkflowContext, TaskContext } from '../types/workflow.js';
```

#### Import Path Standards
- Use relative imports for nearby files (`./`, `../`)
- Use absolute imports from `src/` for cross-module imports
- Always include `.js` extension for ES module compatibility
- Group type-only imports separately

### Function and Class Standards

#### Function Declarations
```typescript
// Use explicit return types
function processWorkflow(context: WorkflowContext): Promise<WorkflowResult> {
  // Implementation
}

// Use arrow functions for short utilities
const validateInput = (input: unknown): input is ValidInput => {
  return InputSchema.safeParse(input).success;
};
```

#### Class Structure
```typescript
export class ComponentName {
  // 1. Private readonly properties first
  private readonly config: ComponentConfig;
  private readonly logger: AuditLogger;
  
  // 2. Private mutable properties
  private state: ComponentState;
  
  // 3. Constructor with dependency injection
  constructor(
    config: ComponentConfig,
    logger: AuditLogger = new AuditLogger()
  ) {
    this.config = config;
    this.logger = logger;
    this.state = this.initializeState();
  }
  
  // 4. Public methods
  public async executeOperation(input: OperationInput): Promise<OperationResult> {
    // Implementation
  }
  
  // 5. Private methods
  private initializeState(): ComponentState {
    // Implementation
  }
}
```

## ◊ Type Safety Standards

### Schema-First Development

All data structures must have corresponding Zod schemas:

```typescript
// Define schema first
export const WorkflowContextSchema = z.object({
  taskDescription: z.string().min(10),
  projectPath: z.string(),
  maxTurns: z.number().min(1).max(10),
  language: z.enum(['typescript', 'javascript', 'python']).optional()
});

// Derive type from schema
export type WorkflowContext = z.infer<typeof WorkflowContextSchema>;

// Use in functions
function processWorkflow(context: WorkflowContext): Promise<WorkflowResult> {
  // context is fully typed and validated
}
```

### Error Handling Standards

#### Error Types
```typescript
// Define specific error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public readonly configPath: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
```

#### Result Pattern
```typescript
// Use Result pattern for operations that may fail
export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

// Implementation
function processData(input: unknown): Result<ProcessedData, ValidationError> {
  const validation = DataSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: new ValidationError('Invalid input', 'data', input)
    };
  }
  
  return {
    success: true,
    data: processValidData(validation.data)
  };
}
```

## ⑄ Security Standards

### Input Validation
- **All external input** must be validated with Zod schemas
- **No direct object access** without validation
- **Sanitize file paths** before any file operations
- **Validate configuration** before application

### Secure Coding Practices
```typescript
// Good: Schema validation
function processUserInput(input: unknown): Result<ValidInput> {
  const validation = UserInputSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: new ValidationError('Invalid input') };
  }
  return { success: true, data: validation.data };
}

// Bad: Direct access
function processUserInput(input: any) {
  return { name: input.name, email: input.email }; // No validation
}
```

### File Operations
```typescript
// Use security guardrails for all file operations
import { SecurityGuardrailsManager } from '../security/guardrails.js';

async function readProjectFile(filePath: string): Promise<Result<string>> {
  const security = new SecurityGuardrailsManager();
  const validation = await security.validateFileAccess(filePath, 'read');
  
  if (!validation.allowed) {
    return {
      success: false,
      error: new SecurityError('File access denied', filePath)
    };
  }
  
  // Proceed with secure file read
}
```

## ⋇ Documentation Standards

### Code Comments
```typescript
/**
 * Orchestrates TDD workflow execution with quality gates and audit logging
 * 
 * @param taskDescription - Human-readable description of the task to implement
 * @param context - Workflow context including project settings and constraints
 * @returns Promise resolving to workflow result with phase details and metrics
 * 
 * @example
 * ```typescript
 * const orchestrator = new TDDOrchestrator(claudeClient, auditLogger);
 * const result = await orchestrator.executeWorkflow(
 *   'Create email validation function',
 *   { projectPath: './src', maxTurns: 3 }
 * );
 * ```
 */
public async executeWorkflow(
  taskDescription: string,
  context: WorkflowContext
): Promise<WorkflowResult> {
  // Implementation
}
```

### Interface Documentation
```typescript
/**
 * Configuration settings for TDD workflow orchestration
 * 
 * @interface WorkflowConfig
 */
export interface WorkflowConfig {
  /** Maximum number of TDD cycle iterations */
  maxTurns: number;
  
  /** Quality gate thresholds for validation */
  qualityThresholds: QualityThresholds;
  
  /** Audit logging configuration */
  auditConfig: AuditConfig;
}
```

## ⊕ Project-Specific Standards

### Phoenix Code Lite
- **CLI Responsiveness**: All CLI operations must complete within 200ms or show progress
- **Session Management**: Maintain user context across all interactions
- **Error Recovery**: Graceful degradation with helpful error messages
- **Testing**: 90% coverage minimum for all new code

### QMS Infrastructure
- **Compliance First**: All code must maintain regulatory compliance
- **Audit Trail**: Comprehensive logging for all operations
- **Validation**: 95% test coverage for compliance-critical code
- **Documentation**: All compliance decisions must be documented

### Cross-Project Components
- **Consistency**: Use established patterns from other projects
- **Integration**: Test compatibility with existing project components
- **Documentation**: Update all affected project documentation
- **Migration**: Provide migration guides for breaking changes

## ✓ Quality Gates

### Pre-Commit Checks
```bash
# Run before any commit
npm run lint        # ESLint validation
npm run build       # TypeScript compilation
npm test           # Test execution
npm run type-check # Additional type checking
```

### Code Review Standards
- **Type Safety**: No `any` types without explicit justification
- **Error Handling**: All async operations have proper error handling
- **Testing**: New functionality includes comprehensive tests
- **Documentation**: Public APIs have complete documentation
- **Security**: Security implications reviewed and addressed

### Performance Standards
- **Build Time**: TypeScript compilation under 30 seconds
- **Test Time**: Unit tests complete under 10 seconds
- **Lint Time**: ESLint validation under 5 seconds
- **Memory Usage**: Development tools under 500MB memory usage

---

**These standards ensure**:
- **Consistency**: Uniform code quality across all repository projects
- **Maintainability**: Code that is easy to understand and modify
- **Type Safety**: Comprehensive type checking and validation
- **Security**: Secure coding practices and input validation
- **Quality**: High-quality code that meets project requirements