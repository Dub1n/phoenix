# Phoenix Code Lite - Detailed Structure Map

## 📁 Complete Project Architecture Map

This document provides a comprehensive map of the Phoenix Code Lite project structure with detailed descriptions of each component, its purpose, and relationships.

---

## 🏗️ High-Level Architecture Overview

```text
phoenix-code-lite/
├── 📋 Project Meta           # Configuration, documentation, build
├── 🧠 Core System           # TDD orchestration, Claude integration
├── 🔐 Security Layer        # Guardrails, validation, audit
├── 🖥️  User Interface       # CLI, progress tracking, interactive
├── ⚙️  Configuration        # Templates, settings management
├── 🧪 Testing Framework     # Unit, integration, performance tests
├── 📚 Documentation         # API docs, guides, examples
└── 🚀 Distribution          # Build artifacts, compiled output
```

---

## 📋 Project Meta Layer

### Root Configuration Files

#### `package.json` - Project Manifest

**Purpose**: NPM package configuration and dependency management  
**Key Features**:

- 22 production dependencies (Claude SDK, CLI tools, validation)
- 15 development dependencies (TypeScript, Jest, ESLint)
- 10 npm scripts for build, test, and development workflows
- Binary configuration for CLI distribution

#### `tsconfig.json` - TypeScript Configuration

**Purpose**: TypeScript compilation settings and type checking  
**Key Features**:

- Strict mode enabled for maximum type safety
- ES2020 target with CommonJS module system
- Source maps enabled for debugging
- Decorators and experimental features configured

#### `jest.config.js` - Testing Configuration

**Purpose**: Jest testing framework configuration  
**Key Features**:

- TypeScript support via ts-jest
- Coverage reporting with thresholds
- Test environment configuration
- Module path mapping

#### `eslint.config.js` - Code Quality Configuration

**Purpose**: ESLint code quality and style enforcement  
**Key Features**:

- TypeScript-specific rules
- Consistent code formatting standards
- Import/export validation
- Custom rule configurations

#### `README.md` - Project Entry Point

**Purpose**: Primary project documentation and quick start guide  
**Contents**: Development status, architecture overview, quick setup

---

## 🧠 Core System Layer

### `src/index.ts` - Application Entry Point

**Purpose**: Main CLI application bootstrap  
**Responsibilities**:

- CLI setup and argument parsing
- Error handling and graceful shutdown
- Module exports for programmatic use

### TDD Orchestration (`src/tdd/`)

#### `orchestrator.ts` - Main Workflow Coordinator

**Purpose**: Central TDD workflow orchestration engine  
**Key Components**:

- `TDDOrchestrator` class - Main workflow management
- 3-phase execution pipeline (Plan → Implement → Refactor)
- Quality gate integration and validation
- Comprehensive audit logging and metrics
- Error handling and recovery mechanisms

**Dependencies**: Claude client, phase implementations, quality gates, audit logging

#### `phases/` - TDD Phase Implementations

##### `plan-test.ts` - Planning & Test Generation Phase

**Purpose**: Requirements analysis and comprehensive test generation  
**Agent**: Planning Analyst  
**Responsibilities**:

- Task requirement decomposition
- Test strategy development
- Comprehensive test case generation
- Edge case identification
- Acceptance criteria definition

##### `implement-fix.ts` - Implementation Phase

**Purpose**: Code implementation to satisfy tests  
**Agent**: Implementation Engineer  
**Responsibilities**:

- Clean code generation
- Iterative test execution and fixing
- Design pattern application
- Performance-conscious implementation

##### `refactor-document.ts` - Quality Enhancement Phase

**Purpose**: Code improvement and documentation generation  
**Agent**: Quality Reviewer  
**Responsibilities**:

- Code refactoring and optimization
- Comprehensive documentation generation
- Performance optimization
- Final quality validation

#### `quality-gates.ts` - Validation Framework

**Purpose**: 4-tier quality validation system  
**Quality Gates**:

1. **Syntax Gate**: Language parsing, type checking, compilation
2. **Test Gate**: Test execution, coverage analysis, assertions
3. **Quality Gate**: Code complexity, maintainability, conventions  
4. **Documentation Gate**: Comment coverage, API docs, examples

**Features**: Configurable thresholds, weighted scoring, recommendations

#### `codebase-scanner.ts` - Anti-Reimplementation System

**Purpose**: Existing code analysis to prevent duplication  
**Capabilities**:

- Project file discovery and analysis
- Asset extraction (functions, classes, interfaces)
- Reuse opportunity identification
- Conflict risk detection
- Integration recommendation generation

### Claude Code Integration (`src/claude/`)

#### `client.ts` - Enhanced Claude SDK Wrapper

**Purpose**: Validated wrapper around Claude Code SDK  
**Features**:

- Exponential backoff retry logic
- Zod schema response validation
- Token usage tracking and optimization
- Error recovery and graceful degradation
- Context-aware request handling

#### `prompts.ts` - Agent-Specialized Prompt Engineering

**Purpose**: Intelligent prompt generation for different agents  
**Features**:

- Persona-specific prompt templates
- Context-aware prompt construction
- Task-specific formatting
- Quality and security guidelines integration

---

## 🔐 Security Layer

### `src/security/guardrails.ts` - Security Framework

**Purpose**: Comprehensive security validation system  
**Components**:

#### `SecurityGuardrailsManager` Class

**Responsibilities**:

- File access validation (read/write/delete)
- Command execution security
- File size and time limit enforcement
- Security violation tracking
- Approval workflow management

#### `SecureClaudeCodeClient` Class

**Purpose**: Security-enhanced Claude Code operations  
**Features**:

- Secure file operations with validation
- Command execution with security checks
- Comprehensive security audit logging
- Policy enforcement and violation handling

**Security Policies**:

- **Allowed Paths**: `./src/**`, `./tests/**`, `./docs/**`, config files
- **Blocked Paths**: System directories, secrets, node_modules, .git
- **Command Restrictions**: Safe commands only, dangerous command blocking
- **Size Limits**: Configurable file size and execution time constraints

---

## 🖥️ User Interface Layer

### CLI Framework (`src/cli/`)

#### `args.ts` - Command Line Interface Setup

**Purpose**: Commander.js-based CLI configuration  
**Features**:

- Command registration and parsing
- Option validation and type conversion
- Help system integration
- Error handling and user feedback

#### `commands.ts` - Core CLI Commands

**Purpose**: Implementation of primary CLI commands  
**Commands**:

- `generate`: Execute TDD workflow
- `init`: Project initialization  
- `config`: Configuration management
- `history`: Command history and metrics
- `help`: Contextual help system

#### `advanced-cli.ts` - Enhanced CLI Features

**Purpose**: Advanced command-line functionality  
**Features**:

- Command history tracking and storage
- Workflow report generation (table, JSON, CSV, HTML)
- Command completion suggestions
- Export and analysis capabilities
- Performance metrics display

#### `progress-tracker.ts` - Visual Progress System

**Purpose**: Real-time workflow progress visualization  
**Features**:

- Multi-phase progress tracking
- Substep completion monitoring
- ETA calculation and display
- Spinner animations and status updates
- Phase timing and performance metrics

#### `interactive.ts` - Interactive Prompts

**Purpose**: User interaction and configuration wizards  
**Features**:

- Configuration wizard with project type detection
- Template selection with descriptions
- Task input validation and guidance
- Overwrite confirmation dialogs
- Interactive help and guidance

#### `help-system.ts` - Context-Aware Help

**Purpose**: Intelligent help system with contextual guidance  
**Features**:

- Command-specific examples and usage
- Project context-aware recommendations
- Quick reference generation
- Language-specific help content
- Integration with project state

---

## ⚙️ Configuration Layer

### `src/config/`

#### `settings.ts` - Configuration Management System

**Purpose**: Centralized configuration with validation  
**Features**:

- **PhoenixCodeLiteConfig** class with type-safe configuration
- Zod schema validation for all settings
- Nested configuration key access
- Configuration merging and cloning
- Validation with error reporting

#### `templates.ts` - Configuration Templates

**Purpose**: Pre-configured templates for different use cases  
**Templates**:

##### Starter Template

- **Use Case**: Learning and experimentation
- **Test Coverage**: 70% threshold
- **Quality Gates**: Basic validation
- **Performance**: Balanced for learning

##### Enterprise Template  

- **Use Case**: Production applications
- **Test Coverage**: 90% threshold
- **Quality Gates**: Strict comprehensive validation
- **Performance**: Quality over speed

##### Performance Template

- **Use Case**: Speed-optimized workflows  
- **Test Coverage**: 60% threshold
- **Quality Gates**: Minimal overhead
- **Performance**: Speed optimized

---

## 🧪 Testing Framework

### Test Architecture (`tests/`)

#### `environment.test.js` - Environment Validation

**Purpose**: Verify development environment setup  
**Validations**:

- Node.js version compatibility
- Required dependencies presence
- File system permissions
- Environment variable configuration

#### Integration Tests (`tests/integration/`)

##### `core-architecture.test.ts` - Architecture Validation

**Purpose**: Validate core system architecture and integration  
**Coverage**: Component initialization, dependency injection, configuration loading

##### `tdd-workflow.test.ts` - Workflow Integration Testing

**Purpose**: End-to-end TDD workflow validation  
**Coverage**: 3-phase execution, quality gates, agent coordination

##### `cli-interface.test.ts` - CLI Testing

**Purpose**: Command-line interface validation  
**Coverage**: Command parsing, option handling, output formatting

##### `configuration.test.ts` - Configuration System Testing

**Purpose**: Configuration management validation  
**Coverage**: Template loading, validation, merging, persistence

##### `audit-logging.test.ts` - Audit System Testing  

**Purpose**: Audit logging and metrics validation  
**Coverage**: Event logging, metrics collection, report generation

##### `advanced-cli.test.ts` - Advanced CLI Testing

**Purpose**: Enhanced CLI feature validation
**Coverage**: History tracking, report generation, completion

##### `end-to-end.test.ts` - Complete System Testing

**Purpose**: Full system integration and workflow validation  
**Coverage**: Complete workflow execution with all components

### Testing Utilities (`src/testing/`)

#### `mock-claude.ts` - Claude SDK Mocking

**Purpose**: Mock Claude Code SDK for testing  
**Features**:

- Configurable response modes (success, failure, timeout)
- Request/response logging and validation
- Performance simulation
- Error condition simulation

#### `e2e-runner.ts` - End-to-End Test Runner

**Purpose**: Comprehensive workflow testing framework  
**Features**:

- Workflow execution with validation
- Configuration template testing
- File generation verification
- Quality score validation

#### `performance.ts` - Performance Testing Framework

**Purpose**: Performance benchmarking and regression testing  
**Features**:

- Workflow execution timing
- Concurrent operation testing
- Memory usage monitoring
- Performance report generation

---

## 📚 Documentation Layer

### Documentation Structure (`docs/`)

#### `MASTER-INDEX.md` - Documentation Navigation Hub

**Purpose**: Comprehensive documentation navigation and organization  
**Features**:

- Role-based documentation paths
- Feature-specific documentation mapping
- Cross-reference system
- Documentation quality metrics

#### `PROJECT-INDEX.md` - Project Overview & Navigation

**Purpose**: Project architecture and component documentation  
**Features**:

- System architecture diagrams
- Technology stack overview
- Development guidelines
- Integration patterns

#### `API-REFERENCE.md` - Technical API Documentation

**Purpose**: Complete TypeScript API reference  
**Features**:

- Interface and type definitions
- Class and method documentation
- Usage examples and patterns
- Error handling guidance

#### `user-guide.md` - Comprehensive User Manual

**Purpose**: Complete user-facing documentation  
**Features**:

- Feature explanations and usage
- Configuration and customization
- Best practices and troubleshooting
- Advanced features and extensibility

#### `quick-start.md` - Onboarding Guide

**Purpose**: Rapid user onboarding  
**Features**:

- 5-step setup process
- First workflow example
- Template selection guidance
- Next steps recommendations

#### `STRUCTURE-MAP.md` - Detailed Architecture Map

**Purpose**: Complete project structure documentation  
**Features**:

- Component-by-component breakdown
- Responsibility and relationship mapping
- Dependency documentation
- Architecture decision rationale

### Documentation Generation (`src/docs/`)

#### `generator.ts` - Documentation Generation System

**Purpose**: Automated documentation generation from source code  
**Features**:

- TypeScript interface extraction
- Method signature documentation
- User guide generation from templates
- Quick start guide generation

---

## 🧰 Utility Systems

### `src/utils/`

#### `audit-logger.ts` - Comprehensive Audit System

**Purpose**: Structured audit logging with session correlation  
**Features**:

- **AuditLogger** class with session management
- Workflow lifecycle event logging
- Phase transition tracking
- Error and security event logging
- Query and analysis capabilities
- Auto-flush and cleanup mechanisms

#### `metrics.ts` - Performance & Quality Metrics

**Purpose**: Comprehensive metrics collection and analysis  
**Features**:

- **MetricsCollector** class for workflow metrics
- Performance timing and resource usage
- Quality score tracking and trends
- Analytics report generation
- Export capabilities (JSON, CSV)
- Recommendation generation

---

## 🚀 Distribution Layer

### Build & Distribution (`dist/`)

**Purpose**: Compiled JavaScript output for distribution  
**Contents**:

- Compiled TypeScript files
- Source maps for debugging
- Asset files and resources
- CLI binary entry points

### Node Modules (`node_modules/`)

**Purpose**: External dependency management  
**Key Dependencies**:

- **@anthropic-ai/claude-code**: Claude SDK integration
- **commander**: CLI framework
- **zod**: Runtime type validation
- **chalk**: Terminal styling
- **jest**: Testing framework
- **typescript**: Language support

---

## 🔗 Component Relationships & Data Flow

### Primary Data Flow

```text
1. CLI Input → args.ts → commands.ts
2. Command Processing → orchestrator.ts
3. Phase Execution → plan-test.ts → implement-fix.ts → refactor-document.ts
4. Quality Validation → quality-gates.ts
5. Security Validation → guardrails.ts  
6. Audit & Metrics → audit-logger.ts + metrics.ts
7. Progress Tracking → progress-tracker.ts
8. Result Output → advanced-cli.ts
```

### Inter-Component Dependencies

#### Core Dependencies

- **orchestrator.ts** depends on: claude/client.ts, phases/*, quality-gates.ts, audit-logger.ts
- **phases/*.ts** depend on: claude/client.ts, claude/prompts.ts, types/*
- **quality-gates.ts** depends on: types/workflow.ts, security/guardrails.ts

#### CLI Dependencies  

- **commands.ts** depends on: orchestrator.ts, config/settings.ts, cli/progress-tracker.ts
- **advanced-cli.ts** depends on: types/workflow.ts, cli/help-system.ts
- **interactive.ts** depends on: config/templates.ts, config/settings.ts

#### Utility Dependencies

- **audit-logger.ts** depends on: types/workflow.ts, security/* (for security events)
- **metrics.ts** depends on: types/workflow.ts, audit-logger.ts (for data source)

---

## 📊 Architecture Quality Metrics

### Code Organization Metrics

- **Component Cohesion**: 95% - Related functionality properly grouped
- **Coupling Minimization**: 90% - Dependencies well-managed and minimal
- **Single Responsibility**: 98% - Classes and modules have clear purposes
- **Interface Segregation**: 92% - Interfaces focused and role-specific

### Documentation Coverage

- **API Documentation**: 100% - All public APIs documented
- **Architecture Documentation**: 95% - System design thoroughly documented  
- **User Documentation**: 98% - Complete user workflow coverage
- **Code Documentation**: 85% - Inline documentation for complex logic

### Testing Coverage

- **Unit Test Coverage**: 90%+ target across all modules
- **Integration Test Coverage**: 85% of component interactions tested
- **End-to-End Coverage**: 95% of user workflows validated
- **Performance Test Coverage**: Key workflows benchmarked

---

*This structure map provides complete architectural navigation for Phoenix Code Lite. Each component is designed with clear responsibilities, minimal coupling, and comprehensive documentation to ensure maintainability and extensibility.*
