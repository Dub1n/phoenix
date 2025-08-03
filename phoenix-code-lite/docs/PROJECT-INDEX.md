# Phoenix Code Lite - Project Documentation Index

## 📖 Project Overview

**Phoenix Code Lite** is a sophisticated TDD (Test-Driven Development) workflow orchestrator designed to integrate seamlessly with the Claude Code SDK. It transforms natural language task descriptions into tested, working code through a structured 3-phase workflow powered by specialized AI agents.

## 🏗️ Architecture

### Core System Components

```text
┌────────────────────────────────────────────────────────────────┐
│                    Phoenix-Code-Lite Architecture              │
├────────────────────────────────────────────────────────────────┤
│  CLI Interface & User Experience                               │
├────────────────────────────────────────────────────────────────┤
│  Configuration Management     │ Audit Logging & Metrics        │
├────────────────────────────────────────────────────────────────┤
│  TDD Workflow Engine & Quality Gates                           │
├────────────────────────────────────────────────────────────────┤
│  Core Architecture & Claude Code Integration                   │
├────────────────────────────────────────────────────────────────┤
│  TypeScript Environment & Foundation                           │
└────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **AI Integration**: Claude Code SDK (`@anthropic-ai/claude-code`)
- **Validation**: Zod schemas for runtime type safety
- **Testing**: Jest with comprehensive coverage
- **CLI**: Commander.js with enhanced UX (chalk, ora, inquirer)
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## 📁 Project Structure

### Core Directory Layout

```text
phoenix-code-lite/
├── src/                          # Source code
│   ├── types/                    # Type definitions & schemas
│   │   ├── workflow.ts           # Core workflow data structures
│   │   └── agents.ts             # Agent specialization definitions
│   ├── claude/                   # Claude Code integration
│   │   ├── client.ts             # Validated Claude client wrapper
│   │   └── prompts.ts            # Agent-aware prompt templates
│   ├── tdd/                      # TDD workflow orchestration
│   │   ├── orchestrator.ts       # Main workflow coordinator
│   │   ├── quality-gates.ts      # Quality validation framework
│   │   ├── codebase-scanner.ts   # Existing code analysis
│   │   └── phases/               # TDD phase implementations
│   │       ├── plan-test.ts      # Planning & test generation
│   │       ├── implement-fix.ts  # Implementation phase
│   │       └── refactor-document.ts # Refactoring & documentation
│   ├── cli/                      # Command-line interface
│   │   ├── args.ts               # Command parsing & setup
│   │   ├── commands.ts           # Core CLI commands
│   │   ├── advanced-cli.ts       # Enhanced CLI features
│   │   ├── progress-tracker.ts   # Progress visualization
│   │   └── help-system.ts        # Context-aware help
│   ├── config/                   # Configuration management
│   │   ├── settings.ts           # Application settings
│   │   └── templates.ts          # Configuration templates
│   ├── security/                 # Security guardrails
│   │   └── guardrails.ts         # File & command security
│   ├── utils/                    # Utility functions
│   │   ├── audit-logger.ts       # Structured audit logging
│   │   └── metrics.ts            # Performance metrics
│   ├── testing/                  # Testing utilities
│   │   ├── mock-claude.ts        # Claude SDK mocking
│   │   ├── e2e-runner.ts         # E2E test runner
│   │   └── performance.ts        # Performance testing
│   ├── docs/                     # Documentation generation
│   │   └── generator.ts          # Doc generation utilities
│   └── index.ts                  # Main application entry
├── tests/                        # Test suites
│   ├── integration/              # Integration tests
│   └── unit/                     # Unit tests (individual components)
├── docs/                         # Project documentation
│   ├── api.md                    # API documentation
│   ├── quick-start.md            # Getting started guide
│   ├── user-guide.md             # User manual
│   └── PROJECT-INDEX.md          # This file
└── dist/                         # Compiled JavaScript output
```

## 🔧 API Reference

### Core Workflow Types

#### TaskContext

```typescript
interface TaskContext {
  taskDescription: string;      // 10-1000 characters
  projectPath: string;          // Required project path
  language?: string;            // Optional language hint
  framework?: string;           // Optional framework hint
  maxTurns: number;            // 1-10, default: 3
  systemPrompt?: string;       // Optional custom prompt
}
```

#### WorkflowResult

```typescript
interface WorkflowResult {
  taskDescription: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  phases: PhaseResult[];
  success: boolean;
  error?: string;
  artifacts: string[];
  metadata?: Record<string, any>;
}
```

### Agent Specializations

#### Planning Analyst

- **Role**: Senior Technical Analyst & Test Designer
- **Expertise**: Requirements analysis, test strategy, edge case identification
- **Approach**: Methodical, comprehensive, risk-aware, systematic
- **Output**: Structured plans with comprehensive test specifications

#### Implementation Engineer

- **Role**: Senior Software Engineer
- **Expertise**: Clean code, design patterns, performance optimization
- **Approach**: Pragmatic, test-driven, maintainable, efficient
- **Output**: Production-ready code with clear structure

#### Quality Reviewer

- **Role**: Senior Code Reviewer & Documentation Specialist
- **Expertise**: Code quality, maintainability, documentation, refactoring
- **Approach**: Detail-oriented, improvement-focused, user-centric
- **Output**: Refactored code with comprehensive documentation

## 🚀 Usage Guide

### Installation & Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development version
npm run dev

# Start CLI application
npm start
```

### Basic Workflow

```bash
# Initialize new TDD workflow
phoenix-code-lite init --task "Create user authentication system"

# Execute specific phase
phoenix-code-lite run --phase plan-test

# Run complete workflow
phoenix-code-lite workflow --task "Add password reset functionality"
```

### Development Commands

```bash
# Testing
npm test                    # Run test suite
npm run test:coverage      # Generate coverage report
npm run test:watch         # Watch mode testing
npm run test:e2e           # End-to-end tests

# Code Quality  
npm run lint               # ESLint validation
npm run build:check        # TypeScript compilation check

# Performance
npm run test:performance   # Performance benchmarks
```

## 🛡️ Security Framework

### Security Guardrails System

Phoenix Code Lite implements comprehensive security controls:

#### File System Access Control

- **Allowed Paths**: `./src/**`, `./tests/**`, `./docs/**`, configuration files
- **Blocked Paths**: System directories, secrets, node_modules, .git
- **Validation**: Whitelist/blacklist path validation with pattern matching

#### Command Execution Security

- **Allowed Commands**: npm, node, tsc, jest, eslint, git, basic shell utilities
- **Blocked Commands**: rm, sudo, curl, network tools, system modification commands
- **Pattern Detection**: Dangerous command pattern recognition

#### Size and Time Limits

- **File Size Limits**: Configurable maximum file sizes for processing
- **Execution Time Limits**: Timeout protection for long-running operations
- **Memory Limits**: Resource usage monitoring and constraints

## 📊 Quality Assurance

### Quality Gates Framework

4-tier validation system with configurable thresholds:

1. **Syntax Validation**: Language parsers, type checking, compilation
2. **Test Validation**: Test execution, coverage analysis, assertion verification
3. **Quality Assessment**: Code complexity, maintainability, best practices
4. **Documentation Review**: Comment coverage, API documentation, examples

### Quality Metrics

- **Test Coverage**: >90% for all new code
- **Type Safety**: 100% TypeScript strict mode compliance
- **Code Quality**: ESLint score >95%, Prettier formatting enforced
- **Performance**: <30s workflow execution for typical tasks

## 🔄 TDD Workflow Phases

### Phase 0: Mandatory Codebase Scan

- **Purpose**: Anti-reimplementation validation
- **Process**: Analyze existing code, identify reuse opportunities, detect conflicts
- **Output**: Scan results with recommendations and conflict warnings

### Phase 1: Plan & Test

- **Agent**: Planning Analyst
- **Input**: Task description + codebase scan results
- **Process**: Requirements analysis, test strategy, comprehensive test generation
- **Output**: Test suite with acceptance criteria

### Phase 2: Implement & Fix

- **Agent**: Implementation Engineer  
- **Input**: Test results + requirements
- **Process**: Minimal implementation to pass tests, iterative fixing
- **Output**: Working implementation with passing tests

### Phase 3: Refactor & Document

- **Agent**: Quality Reviewer
- **Input**: Working implementation
- **Process**: Code refactoring, documentation, performance optimization
- **Output**: Production-ready code with comprehensive documentation

## 📈 Metrics & Monitoring

### Audit Logging System

- **Session Correlation**: Unique session IDs for workflow tracking
- **Structured Logging**: JSON-formatted audit trails
- **Event Types**: Workflow events, phase transitions, security events, errors
- **Retention**: Configurable log retention policies

### Performance Metrics

- **Token Usage**: Claude API token consumption tracking
- **Execution Time**: Phase-by-phase timing analysis
- **Quality Scores**: Weighted quality scoring algorithm
- **Success Rates**: Workflow success/failure pattern analysis

## 🔗 Integration Points

### Claude Code SDK Integration

- **Client Wrapper**: Validated wrapper with retry mechanisms
- **Prompt Templates**: Agent-specialized prompt engineering
- **Response Validation**: Zod schema validation for all LLM responses
- **Error Handling**: Comprehensive error recovery strategies

### Configuration System

- **Templates**: Starter, Enterprise, Performance configurations
- **Agent Settings**: Customizable agent personas and behaviors
- **Security Policies**: Configurable security constraint definitions
- **Quality Thresholds**: Adjustable quality gate parameters

## 📚 Development Resources

### Documentation Files

- [`MASTER-INDEX.md`](./MASTER-INDEX.md) - Complete documentation navigation hub
- [`API-REFERENCE.md`](./API-REFERENCE.md) - Comprehensive API documentation
- [`STRUCTURE-MAP.md`](./STRUCTURE-MAP.md) - Detailed project architecture map- [`quick-start.md`](./quick-start.md) - Getting started tutorial
- [`user-guide.md`](./user-guide.md) - Comprehensive user manual
- [`CLAUDE.md`](../CLAUDE.md) - Claude Code integration guide

### Related Documentation

- [`Phoenix-Reorg/`](../Phoenix-Reorg/) - Complete framework documentation
- [`07-Phoenix-Code-Lite-Dev/`](../Phoenix-Reorg/07-Phoenix-Code-Lite-Dev/) - Development roadmap

### Test Resources

- [`tests/integration/`](../tests/integration/) - Integration test examples
- [`tests/unit/`](../tests/unit/) - Unit test patterns
- [`environment.test.js`](../tests/environment.test.js) - Environment validation

## 🚀 Getting Started

1. **Installation**: `npm install && npm run build`
2. **Configuration**: Review `src/config/templates.ts` for setup options
3. **First Workflow**: `npm run dev init --task "Hello World function"`
4. **Documentation**: Read `docs/quick-start.md` for detailed examples
5. **Development**: Follow TDD methodology with comprehensive testing

## 🎯 Project Status

✅ **Completed Phases**:

- Phase 1: Environment Setup & Foundation
- Phase 2: Core Architecture & Claude Code Integration  
- Phase 3: TDD Workflow Engine Implementation
- Phase 4: CLI Interface & User Experience
- Phase 5: Configuration Management
- Phase 6: Audit Logging & Metrics Collection
- Phase 7: Integration Testing
- Phase 8: Production Readiness

**Current Version**: 1.0.0  
**License**: MIT  
**Node Version**: >=16.0.0

---

*This project represents a production-ready TDD workflow orchestrator that bridges natural language task descriptions with systematic, tested code generation through intelligent AI agent coordination.*
