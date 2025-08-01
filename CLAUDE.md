# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

### Phoenix Code Lite - TDD Workflow Orchestrator

This repository contains the active development of **Phoenix-Code-Lite**, a TypeScript-based TDD workflow orchestrator designed to integrate seamlessly with Claude Code SDK. Phoenix-Code-Lite operates as an intelligent extension within the Claude Code ecosystem, focusing on systematic Test-Driven Development workflow orchestration.

**Core Purpose**: Transform natural language task descriptions into tested, working code through a structured 3-phase TDD workflow powered by specialized AI agents.

### Architecture Overview

Phoenix-Code-Lite implements a systematic approach to AI-driven development:

``` text
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

**Technology Stack**:

- **Language**: TypeScript/Node.js
- **LLM Integration**: Claude Code SDK
- **Validation**: Zod schemas for runtime type safety
- **Testing**: Jest with comprehensive coverage
- **Development**: ESLint, Prettier, ts-node
- **Architecture**: Plugin-like extension within Claude Code ecosystem

### Agent Specialization System

Phoenix-Code-Lite uses three specialized agents optimized for TDD workflow phases:

1. **Planning Analyst**: Requirements analysis, test strategy, comprehensive test planning
2. **Implementation Engineer**: Clean code generation, minimal implementation to pass tests
3. **Quality Reviewer**: Code refactoring, documentation, performance optimization

## Development Roadmap

### 8-Phase Development Approach

Phoenix-Code-Lite follows a systematic 8-phase development plan with strict TDD methodology:

#### **Phase 1: Environment Setup & Foundation**

- Complete TypeScript development environment
- Package.json with Claude Code SDK dependencies  
- Jest testing framework and code quality tools
- Basic project structure and build system

#### **Phase 2: Core Architecture & Claude Code Integration**

- Zod-validated type system for all workflow interfaces
- Claude Code client integration with retry mechanisms
- Agent specialization system implementation
- Comprehensive security guardrails system

#### **Phase 3: TDD Workflow Engine Implementation**

- Three-phase TDD orchestrator (Plan & Test → Implement & Fix → Refactor & Document)
- StateFlow finite state machine for workflow management
- Agent coordination with specialized system prompts

#### **Phase 4: Quality Gates & Validation Framework**

- 4-tier quality validation system (syntax, tests, quality, documentation)
- Quality gate manager with configurable thresholds  
- Weighted quality scoring algorithm

#### **Phase 5: Configuration Management System**

- Zod-validated configuration schema with runtime type safety
- Configuration templates (Starter, Enterprise, Performance)
- Agent-specific settings and customization

#### **Phase 6: Audit Logging & Metrics Collection**

- Structured audit logging with session correlation
- Performance metrics collection (token usage, execution time, quality scores)
- Workflow analytics with success rates and failure patterns

#### **Phase 7: CLI Interface & User Experience**

- Advanced CLI with Commander.js integration
- Progress tracking with multi-phase indicators
- Context-aware help system

#### **Phase 8: Integration Testing & Documentation**

- Comprehensive end-to-end testing suite
- Performance benchmarking and regression detection
- Professional documentation and production readiness validation

## Development Commands

### Core Development

```bash
# Build TypeScript to JavaScript
npm run build

# Run development version with ts-node  
npm run dev

# Execute Jest test suite with coverage
npm test

# ESLint validation with TypeScript rules
npm run lint

# Start CLI application
npm start
```

### TDD Workflow Development

```bash
# Continuous testing during development
npm run test:watch

# Generate coverage reports
npm run test:coverage  

# Validate TypeScript compilation
npm run build:check

# Run specific test suites
npm test -- --testNamePattern="Phase 2"
```

## Project Structure

``` text
phoenix-code-lite/
├── src/
│   ├── cli/           # CLI interface and commands
│   ├── tdd/           # TDD workflow orchestration
│   ├── claude/        # Claude Code SDK integration
│   │   ├── client.ts  # Validated Claude Code client wrapper
│   │   └── prompts.ts # Agent-aware prompt templates
│   ├── config/        # Configuration management
│   ├── security/      # Security guardrails system
│   ├── types/         # Zod schemas and TypeScript interfaces
│   │   ├── workflow.ts # Core workflow data structures
│   │   └── agents.ts   # Agent specialization definitions
│   └── utils/         # Utility functions
├── tests/
│   ├── integration/   # Integration tests
│   └── unit/         # Unit tests
├── docs/             # Project documentation
└── scripts/          # Development and build scripts
```

## TDD Development Methodology

### Phase-Based TDD Implementation

Each development phase follows strict TDD methodology:

1. **Write Comprehensive Tests First**: Create failing tests that define expected behavior
2. **Minimal Implementation**: Write only the code needed to pass tests
3. **Refactor with Safety**: Improve code quality while maintaining test coverage
4. **Validate Against Success Criteria**: Ensure phase completion meets all requirements

### Agent-Driven TDD Workflow

The core TDD workflow orchestrates three specialized agents:

```typescript
// Example workflow structure
interface TDDWorkflowPhases {
  planAndTest: {
    agent: "Planning Analyst",
    input: TaskDescription,
    output: ComprehensiveTestSuite
  },
  implementAndFix: {
    agent: "Implementation Engineer", 
    input: TestResults,
    output: MinimalImplementation
  },
  refactorAndDocument: {
    agent: "Quality Reviewer",
    input: WorkingImplementation,
    output: ProductionReadyCode
  }
}
```

## Security Considerations

### Security Guardrails System

Phoenix-Code-Lite implements comprehensive security controls:

- **File System Access Control**: Whitelist/blacklist path validation
- **Command Execution Security**: Approved command list with dangerous pattern detection  
- **Size and Time Limits**: File size and execution time constraints
- **Audit Logging**: Complete security event tracking
- **Approval Workflows**: Manual approval for sensitive operations

### Security Policies

Default security policy includes:

- **Allowed Paths**: `./src/**`, `./tests/**`, `./docs/**`, configuration files
- **Blocked Paths**: System directories, secrets, node_modules, .git
- **Allowed Commands**: npm, node, tsc, jest, eslint, git, basic shell utilities
- **Blocked Commands**: rm, sudo, curl, network tools, system modification commands

## Claude Code Integration Patterns

### Agent-Specialized Prompting

Each agent uses specialized system prompts and expertise areas:

```typescript
// Planning Analyst specialization
const planningAnalyst = {
  role: "Senior Technical Analyst & Test Designer",
  expertise: ["requirements analysis", "test strategy", "edge case identification"],
  approach: "methodical, comprehensive, risk-aware, systematic",
  output_format: "structured plan with comprehensive test specifications"
}

// Implementation Engineer specialization  
const implementationEngineer = {
  role: "Senior Software Engineer",
  expertise: ["clean code", "design patterns", "performance optimization"],
  approach: "pragmatic, test-driven, maintainable, efficient", 
  output_format: "production-ready code with clear structure and comments"
}
```

### Context-Aware Development

- **Project Context**: Maintain awareness of current development phase
- **Task Context**: Include language, framework, and project path information
- **Quality Context**: Apply appropriate quality standards for each phase
- **Security Context**: Ensure all operations comply with security policies

## Data Validation and Type Safety

### Zod Schema Validation

All data structures use Zod schemas for runtime validation:

```typescript
// Example: Task context validation
export const TaskContextSchema = z.object({
  taskDescription: z.string()
    .min(10, 'Task description must be at least 10 characters')
    .max(1000, 'Task description too long'),
  projectPath: z.string().min(1, 'Project path is required'),
  language: z.string().optional(),
  framework: z.string().optional(),
  maxTurns: z.number().min(1).max(10).default(3)
});

export type TaskContext = z.infer<typeof TaskContextSchema>;
```

### Structured Data Flow

- **Input Validation**: All user inputs validated against schemas
- **Agent Communication**: Structured data exchange between agents
- **Output Validation**: All LLM responses validated before processing
- **Error Handling**: Comprehensive validation error reporting

## Quality Standards

### Code Quality Requirements

- **Test Coverage**: >90% for all new code
- **Type Safety**: 100% TypeScript strict mode compliance
- **Code Quality**: ESLint score >95%, Prettier formatting enforced
- **Documentation**: All public APIs documented with examples

### Performance Benchmarks

- **Workflow Execution**: <30 seconds for typical tasks
- **CLI Responsiveness**: <100ms for interactive commands
- **Memory Usage**: <200MB peak during normal operations
- **Token Efficiency**: Optimized prompts reducing API costs by 30%

## Development Guidelines

### Working with Phoenix Code Lite

When implementing features for Phoenix-Code-Lite:

1. **Follow the Phase Structure**: Implement features according to the 8-phase roadmap
2. **TDD First**: Always write tests before implementation
3. **Security Awareness**: All file operations and commands must go through security guardrails
4. **Agent Specialization**: Use appropriate agent personas for different tasks
5. **Validation Everything**: All data must be validated with Zod schemas
6. **Documentation**: Maintain comprehensive documentation for all components

### Current Development Status

**Active Phase**: Core Architecture & Claude Code Integration (Phase 2)
**Next Milestone**: TDD Workflow Engine Implementation (Phase 3)
**Development Timeline**: 4-6 weeks total development time

This repository represents an active TypeScript development project implementing a sophisticated TDD workflow orchestrator. Focus on the systematic approach, agent specialization, security considerations, and comprehensive validation that distinguish Phoenix-Code-Lite as a professional-grade development tool.

## User Memory

``` text
# SuperClaude Entry Point

@COMMANDS.md
@FLAGS.md
@PRINCIPLES.md
@RULES.md
@MCP.md
@PERSONAS.md
@ORCHESTRATOR.md
@MODES.md
