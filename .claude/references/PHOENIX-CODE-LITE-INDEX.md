<!--
title: [Codebase Index - Documentation]
tags: [Documentation, Index, Reference, Architecture]
provides: [Complete Codebase Mapping, Dependencies, File Reference Matrix]
requires: [docs/index/ARCHITECTURE-DIAGRAM.md, docs/index/API-REFERENCE.md]
description: [Comprehensive index of Phoenix Code Lite’s codebase structure, components, and relationships]
-->

# Phoenix Code Lite - Comprehensive Codebase Index

> **Generated**: 2025-01-06  
> **Purpose**: Complete documentation of Phoenix Code Lite codebase structure, functionality, and data flow  
> **Companions**:
>
> - **[Architecture Diagram](ARCHITECTURE-DIAGRAM.md)** - Visual system overview with Mermaid diagrams
> - **[API Reference](API-REFERENCE.md)** - TypeScript interfaces, method signatures, and usage examples

## Table of Contents

1. [System Overview](#system-overview)
2. [Entry Points](#entry-points)
3. [Core Infrastructure](#core-infrastructure)
4. [CLI System](#cli-system)
5. [Configuration Management](#configuration-management)
6. [Type Definitions](#type-definitions)
7. [Utilities & Services](#utilities--services)
8. [TDD Workflow Engine](#tdd-workflow-engine)
9. [Testing Framework](#testing-framework)
10. [QMS Preparation System](#qms-preparation-system)
11. [Functional Groups](#functional-groups)
12. [Data Flow Summary](#data-flow-summary)
13. [File Reference Matrix](#file-reference-matrix)

## System Overview

Phoenix Code Lite is a **TDD Workflow Orchestrator** for Claude Code SDK that provides:

- Interactive CLI with dual mode architecture (standalone/integrated)
- Session management with comprehensive state tracking
- Configuration templates and management system
- QMS (Quality Management System) preparation capabilities
- Comprehensive error handling and audit logging

**Technology Stack**: TypeScript, Node.js 18+, Claude Code SDK, Zod validation, Jest testing

## Entry Points

### Primary Entry Points

#### `/src/index.ts`

**Purpose**: Main application entry point with session-based architecture  
**Function**: Initializes core foundation, handles CLI arguments, manages graceful shutdown  
**References**: `cli/args.ts`, `core/foundation.ts`, `core/config-manager.ts`, `core/error-handler.ts`, `cli/session.ts`  
**Referenced by**: `package.json` (main field), `dist/index.js` (compiled output)  
**Key Features**:

- Dual execution mode (interactive vs command-line)
- Core component initialization sequence
- Graceful shutdown with resource cleanup
- Error handling with audit trail

#### `/src/index-di.ts`

**Purpose**: Alternative entry point using dependency injection pattern  
**Function**: Creates service adapters, manages dependency lifetimes, supports testable architecture  
**References**: `cli/factories/command-factory.ts`, `cli/adapters/*`, `cli/interactive/interactive-session.ts`  
**Referenced by**: Alternative execution path for testing and modular deployments  
**Key Features**:

- Dependency injection container
- Service adapter pattern implementation
- Enhanced testability architecture

### Package Configuration

#### `/package.json`

**Purpose**: Project metadata, dependencies, and build configuration  
**Main Entry**: `dist/src/index.js`  
**Binary**: `phoenix-code-lite` -> `./dist/src/index.js`  
**Key Dependencies**: `@anthropic-ai/claude-code`, `commander`, `inquirer`, `zod`, `chalk`

## Core Infrastructure

### System Foundation

#### `/src/core/foundation.ts`

**Purpose**: Core system infrastructure with monitoring, validation, and lifecycle management  
**Function**: Manages session, mode, and performance monitoring; auto-detects integration mode  
**References**: `core/session-manager.ts`, `core/mode-manager.ts`, `utils/audit-logger.ts`  
**Referenced by**: `index.ts`, `index-di.ts`, various CLI components  
**Key Features**:

- System state tracking with real-time metrics
- Dual mode architecture (standalone/integrated)
- Performance monitoring with memory and GC management
- Comprehensive error handling with recovery strategies
- Health monitoring with status reporting

#### `/src/core/config-manager.ts`

**Purpose**: Configuration management with validation, persistence, and hot reloading  
**Function**: Template system, file watching, validation with Zod schemas  
**References**: `core/foundation.ts`, `utils/audit-logger.ts`  
**Referenced by**: `core/foundation.ts`, `cli/commands.ts`, configuration-related CLI commands  
**Key Features**:

- Configuration templates (starter, enterprise, performance)
- Hot reloading with file system watching
- Validation with detailed error reporting
- Audit trail for configuration changes

#### `/src/core/session-manager.ts`

**Purpose**: Session lifecycle management with comprehensive state tracking  
**Function**: Session creation, metrics tracking, cleanup, event emission  
**References**: `types/workflow.ts`, `utils/audit-logger.ts`  
**Referenced by**: `core/foundation.ts`, CLI session handlers  
**Key Features**:

- Session state validation with Zod schemas
- Metrics tracking (commands, tokens, errors, phases)
- Automatic cleanup of expired sessions
- Event-driven architecture for monitoring

#### `/src/core/error-handler.ts`

**Purpose**: Centralized error handling with categorization and recovery  
**Function**: Error classification, recovery strategies, audit logging  
**References**: Various error types and recovery mechanisms  
**Referenced by**: `core/foundation.ts`, `cli/session.ts`, major components  
**Key Features**:

- Error categorization and severity levels
- Recovery strategy recommendations
- Comprehensive error audit trail

#### `/src/core/mode-manager.ts`

**Purpose**: Mode switching between standalone and integrated operation  
**Function**: Mode transition logic, state management, integration detection  
**References**: Mode configuration types  
**Referenced by**: `core/foundation.ts`, integration detection logic  
**Key Features**:

- Dynamic mode switching
- Integration capability detection
- Mode-specific behavior configuration

## CLI System

### Command Processing

#### `/src/cli/args.ts`

**Purpose**: CLI argument parsing and command setup using Commander.js  
**Function**: Defines command structure, options, and delegates to command handlers  
**References**: `cli/commands.ts`, `cli/enhanced-commands.ts`  
**Referenced by**: `index.ts` for command-line mode execution  
**Key Features**:

- Command hierarchy (generate, init, config, template, wizard)
- Option validation and type safety
- Version management and help system

#### `/src/cli/commands.ts`

**Purpose**: Core command implementations with comprehensive error handling  
**Function**: Generate, init, config, template commands with interactive flows  
**References**: `claude/client.ts`, `tdd/orchestrator.ts`, `config/settings.ts`, `cli/interactive.ts`  
**Referenced by**: `cli/args.ts`, `cli/session.ts` for command execution  
**Key Features**:

- TDD workflow orchestration
- Configuration management UI
- Template system management
- Interactive command flows with validation

#### `/src/cli/enhanced-commands.ts`

**Purpose**: Extended command functionality with advanced features  
**Function**: Wizard flows, advanced configuration, session actions  
**References**: Enhanced UI components and advanced configuration systems  
**Referenced by**: `cli/args.ts`, `cli/session.ts` for advanced operations  
**Key Features**:

- Interactive setup wizards
- Advanced configuration options
- Session-specific command execution

### Session Management

#### `/src/cli/session.ts`

**Purpose**: Interactive CLI session management with dual mode support  
**Function**: Session lifecycle, command processing, navigation, error handling  
**References**: `cli/interaction-manager.ts`, `cli/menu-system.ts`, `types/interaction-modes.ts`  
**Referenced by**: `index.ts` for interactive mode execution  
**Key Features**:

- Dual mode support (menu/command)
- Context-aware navigation with breadcrumbs
- Input validation with suggestions
- Comprehensive error handling with recovery

#### `/src/cli/interaction-manager.ts`

**Purpose**: Mode switching and interaction flow management  
**Function**: Manages menu vs command mode presentation and user interaction  
**References**: Menu and command mode configurations  
**Referenced by**: `cli/session.ts`, interactive components  
**Key Features**:

- Dynamic mode switching
- Interaction pattern management
- User preference persistence

#### `/src/cli/menu-system.ts`

**Purpose**: Hierarchical menu system with context-aware navigation  
**Function**: Menu rendering, context handling, command routing  
**References**: Context definitions and navigation structures  
**Referenced by**: `cli/session.ts`, `cli/interaction-manager.ts`  
**Key Features**:

- Context-sensitive menu generation
- Navigation stack management
- Command delegation to appropriate handlers

### CLI Interfaces & Adapters

#### `/src/cli/interfaces/`

**Purpose**: Interface definitions for dependency injection and testing  
**Files**: `audit-logger.ts`, `claude-client.ts`, `config-manager.ts`, `file-system.ts`  
**Function**: Contract definitions for core services  
**Referenced by**: Adapter implementations, testing mocks, dependency injection  
**Key Features**:

- Service contracts for testability
- Dependency injection support
- Interface segregation principle

#### `/src/cli/adapters/`

**Purpose**: Adapter pattern implementations for service integration  
**Files**: `audit-logger-adapter.ts`, `claude-client-adapter.ts`, `config-manager-adapter.ts`  
**Function**: Bridges between interfaces and concrete implementations  
**References**: Core service implementations and CLI interfaces  
**Referenced by**: `index-di.ts`, dependency injection setup  
**Key Features**:

- Clean architecture boundaries
- Testable service integration
- Flexible service substitution

### Command Implementations

#### `/src/cli/commands/`

**Purpose**: Individual command implementations with focused responsibilities  
**Files**: `config-command.ts`, `generate-command.ts`, `help-command.ts`, `init-command.ts`, `version-command.ts`  
**Function**: Specific command logic with parameter handling and validation  
**References**: Service interfaces and shared utilities  
**Referenced by**: `cli/factories/command-factory.ts`, command routing logic  
**Key Features**:

- Single responsibility per command
- Parameter validation and error handling
- Service integration through interfaces

#### `/src/cli/factories/command-factory.ts`

**Purpose**: Command instantiation with dependency injection  
**Function**: Creates command instances with proper dependency wiring  
**References**: Command implementations, service interfaces  
**Referenced by**: `index-di.ts`, dependency injection architecture  
**Key Features**:

- Factory pattern for command creation
- Dependency injection management
- Command lifecycle management

### Interactive Components

#### `/src/cli/interactive/interactive-session.ts`

**Purpose**: Interactive session management with enhanced UX  
**Function**: Session state management, interactive flows, user input handling  
**References**: Command factory, service interfaces  
**Referenced by**: `index-di.ts` for interactive mode execution  
**Key Features**:

- Enhanced interactive experience
- Session context management
- Integration with command factory pattern

#### `/src/cli/interactive.ts`

**Purpose**: Interactive prompts and user interface components  
**Function**: Configuration editors, template management, user input validation  
**References**: Configuration system, template management  
**Referenced by**: `cli/commands.ts`, interactive command flows  
**Key Features**:

- Configuration editing interfaces
- Template selection and customization
- Input validation and user guidance

#### `/src/cli/enhanced-wizard.ts`

**Purpose**: Advanced setup and configuration wizards  
**Function**: Multi-step setup processes, intelligent defaults, user guidance  
**References**: Configuration templates, project discovery  
**Referenced by**: `cli/enhanced-commands.ts`, setup workflows  
**Key Features**:

- Guided setup processes
- Intelligent configuration recommendations
- Project context detection

### Utility Components

#### `/src/cli/progress-tracker.ts`

**Purpose**: Progress indication and user feedback during operations  
**Function**: Progress bars, status updates, completion indicators  
**References**: Operation tracking utilities  
**Referenced by**: Long-running command operations  
**Key Features**:

- Visual progress indication
- Status updates and feedback
- Operation completion tracking

#### `/src/cli/project-discovery.ts`

**Purpose**: Automatic project structure and technology detection  
**Function**: Framework detection, project analysis, configuration suggestions  
**References**: Project structure analysis utilities  
**Referenced by**: `cli/enhanced-wizard.ts`, setup workflows  
**Key Features**:

- Framework and technology detection
- Project structure analysis
- Configuration recommendation engine

#### `/src/cli/help-system.ts`

**Purpose**: Context-aware help and documentation system  
**Function**: Dynamic help generation, command documentation, usage examples  
**References**: Command definitions and documentation  
**Referenced by**: Help commands, interactive assistance  
**Key Features**:

- Context-sensitive help
- Command documentation generation
- Usage example provision

#### `/src/cli/config-formatter.ts`

**Purpose**: Configuration display and formatting utilities  
**Function**: Human-readable configuration display, validation reporting  
**References**: Configuration schemas and templates  
**Referenced by**: Configuration display commands  
**Key Features**:

- User-friendly configuration display
- Validation result formatting
- Configuration comparison utilities

## Configuration Management

### Core Configuration

#### `/src/config/settings.ts`

**Purpose**: Main configuration schema and management system  
**Function**: Configuration validation, loading, saving, schema definitions  
**References**: Configuration templates, validation schemas  
**Referenced by**: `cli/commands.ts`, configuration-related operations  
**Key Features**:

- Zod schema validation
- Configuration persistence
- Template integration
- Default value management

#### `/src/config/templates.ts`

**Purpose**: Pre-defined configuration templates for different use cases  
**Function**: Template definitions, template selection, customization  
**References**: Configuration schemas  
**Referenced by**: `config/settings.ts`, `cli/commands.ts`, template operations  
**Key Features**:

- Starter, enterprise, and performance templates
- Template customization capabilities
- Use case optimization

#### `/src/config/template-manager.ts`

**Purpose**: Template management and application system  
**Function**: Template loading, merging, validation, persistence  
**References**: Template definitions, configuration system  
**Referenced by**: Template-related operations and CLI commands  
**Key Features**:

- Template lifecycle management
- Template merging and validation
- Custom template creation

#### `/src/config/document-manager.ts`

**Purpose**: Document and artifact management for QMS workflows  
**Function**: Document processing, artifact tracking, compliance management  
**References**: QMS preparation system, document processing utilities  
**Referenced by**: QMS workflows and document processing operations  
**Key Features**:

- Document lifecycle management
- Artifact tracking and validation
- Compliance documentation support

## Type Definitions

### Core Types

#### `/src/types/workflow.ts`

**Purpose**: Workflow state management and process orchestration types  
**Function**: Defines session states, workflow phases, task contexts  
**References**: Zod validation schemas  
**Referenced by**: `core/session-manager.ts`, `tdd/orchestrator.ts`, workflow components  
**Key Features**:

- Session state definitions with validation
- Workflow phase tracking
- Task context management
- Metrics and performance tracking

#### `/src/types/agents.ts`

**Purpose**: Agent definitions and AI integration types  
**Function**: Claude Code agent configurations, interaction patterns  
**References**: Claude Code SDK types  
**Referenced by**: `claude/client.ts`, AI integration components  
**Key Features**:

- Agent configuration schemas
- AI interaction patterns
- Response handling definitions

#### `/src/types/interaction-modes.ts`

**Purpose**: CLI interaction patterns and user interface types  
**Function**: Menu configurations, navigation patterns, interaction modes  
**References**: CLI system components  
**Referenced by**: `cli/session.ts`, `cli/interaction-manager.ts`, UI components  
**Key Features**:

- Interaction mode definitions
- Navigation structure types
- Menu configuration schemas

#### `/src/types/document-management.ts`

**Purpose**: Document handling and QMS integration types  
**Function**: Document schemas, processing workflows, compliance tracking  
**References**: QMS preparation system  
**Referenced by**: QMS components, document processing workflows  
**Key Features**:

- Document processing schemas
- Compliance tracking types
- QMS workflow definitions

## Utilities & Services

### Core Utilities

#### `/src/utils/audit-logger.ts`

**Purpose**: Comprehensive audit logging with cryptographic verification  
**Function**: Event logging, audit trail management, security compliance  
**References**: Cryptographic utilities  
**Referenced by**: All major system components for audit trails  
**Key Features**:

- Comprehensive event logging
- Audit trail integrity
- Security compliance support
- Performance-optimized logging

#### `/src/utils/file-system.ts`

**Purpose**: File system operations with error handling and validation  
**Function**: Safe file operations, path validation, error handling  
**References**: Node.js file system APIs  
**Referenced by**: Configuration management, document processing  
**Key Features**:

- Safe file system operations
- Path validation and security
- Error handling and recovery

#### `/src/utils/test-utils.ts`

**Purpose**: Testing utilities and safe process management  
**Function**: Test environment handling, safe process termination, mock utilities  
**References**: Testing framework integration  
**Referenced by**: Main entry points, testing components, process management  
**Key Features**:

- Safe process termination (safeExit)
- Test environment detection
- Mock and stub utilities

#### `/src/utils/metrics.ts`

**Purpose**: Performance monitoring and system metrics collection  
**Function**: Performance tracking, resource monitoring, metrics aggregation  
**References**: System monitoring APIs  
**Referenced by**: Performance monitoring components, system health checks  
**Key Features**:

- Performance metrics collection
- Resource usage monitoring
- System health tracking

#### `/src/utils/logue-wrapper.ts`

**Purpose**: Enhanced logging wrapper with structured output  
**Function**: Log formatting, structured logging, output management  
**References**: Logue logging library  
**Referenced by**: Components requiring structured logging output  
**Key Features**:

- Structured logging format
- Log level management
- Output formatting and filtering

## TDD Workflow Engine

### Core Orchestration

#### `/src/tdd/orchestrator.ts`

**Purpose**: Main TDD workflow orchestration and phase management  
**Function**: Workflow execution, phase coordination, result aggregation  
**References**: `tdd/phases/*`, `claude/client.ts`, quality gates  
**Referenced by**: `cli/commands.ts` for generate operations  
**Key Features**:

- Multi-phase workflow orchestration
- Quality gate enforcement
- Result aggregation and reporting
- Error handling and recovery

#### `/src/tdd/quality-gates.ts`

**Purpose**: Quality validation and gate enforcement system  
**Function**: Quality metrics validation, threshold enforcement, reporting  
**References**: Quality standards and validation rules  
**Referenced by**: `tdd/orchestrator.ts`, workflow phases  
**Key Features**:

- Quality threshold enforcement
- Validation rule engine
- Quality reporting and metrics

#### `/src/tdd/codebase-scanner.ts`

**Purpose**: Codebase analysis and context extraction  
**Function**: Project structure analysis, dependency scanning, context building  
**References**: File system utilities, project analysis tools  
**Referenced by**: `tdd/orchestrator.ts`, project analysis workflows  
**Key Features**:

- Comprehensive codebase analysis
- Dependency graph construction
- Context extraction for AI workflows

### Workflow Phases

#### `/src/tdd/phases/plan-test.ts`

**Purpose**: Test planning and design phase implementation  
**Function**: Test strategy development, test case planning, coverage analysis  
**References**: Testing frameworks, quality standards  
**Referenced by**: `tdd/orchestrator.ts` during test planning phase  
**Key Features**:

- Test strategy development
- Coverage planning and analysis
- Test case design and validation

#### `/src/tdd/phases/implement-fix.ts`

**Purpose**: Implementation and fix application phase  
**Function**: Code implementation, fix application, validation  
**References**: Code generation utilities, validation tools  
**Referenced by**: `tdd/orchestrator.ts` during implementation phase  
**Key Features**:

- Code implementation workflows
- Fix application and validation
- Implementation quality assurance

#### `/src/tdd/phases/refactor-document.ts`

**Purpose**: Code refactoring and documentation phase  
**Function**: Code quality improvement, documentation generation, optimization  
**References**: Refactoring tools, documentation generators  
**Referenced by**: `tdd/orchestrator.ts` during refactoring phase  
**Key Features**:

- Code refactoring and optimization
- Documentation generation
- Quality improvement workflows

## Testing Framework

### Testing Infrastructure

#### `/src/testing/e2e-runner.ts`

**Purpose**: End-to-end testing orchestration and execution  
**Function**: E2E test execution, result aggregation, reporting  
**References**: Testing utilities, mock systems  
**Referenced by**: Test automation workflows  
**Key Features**:

- E2E test orchestration
- Test result aggregation
- Comprehensive reporting

#### `/src/testing/performance.ts`

**Purpose**: Performance testing and benchmarking  
**Function**: Performance measurement, benchmarking, regression detection  
**References**: Metrics utilities, performance monitoring  
**Referenced by**: Performance testing workflows  
**Key Features**:

- Performance benchmarking
- Regression detection
- Performance metrics collection

#### `/src/testing/mock-claude.ts`

**Purpose**: Claude Code SDK mocking for testing  
**Function**: AI interaction mocking, response simulation, test isolation  
**References**: Claude Code SDK interfaces  
**Referenced by**: Testing components requiring AI interaction mocking  
**Key Features**:

- AI interaction mocking
- Response pattern simulation
- Test isolation and determinism

### Testing Utilities

#### `/src/testing/utils/cli-test-utils.ts`

**Purpose**: CLI testing utilities and helpers  
**Function**: CLI interaction simulation, command testing, output validation  
**References**: CLI components, testing frameworks  
**Referenced by**: CLI component tests  
**Key Features**:

- CLI interaction simulation
- Command execution testing
- Output validation and assertion

#### `/src/testing/mocks/`

**Purpose**: Mock implementations for dependency injection testing  
**Files**: `mock-audit-logger.ts`, `mock-claude-client.ts`, `mock-config-manager.ts`, `mock-file-system.ts`  
**Function**: Service mocking, behavior simulation, test isolation  
**References**: Service interfaces, testing frameworks  
**Referenced by**: Unit and integration tests requiring service mocking  
**Key Features**:

- Service behavior simulation
- Test isolation and determinism
- Dependency injection testing support

## QMS Preparation System

### Compliance Analysis

#### `/src/preparation/en62304-requirement-analyzer.ts`

**Purpose**: EN 62304 medical device software standard compliance analysis  
**Function**: Requirement validation, compliance checking, reporting  
**References**: EN 62304 standards, compliance utilities  
**Referenced by**: QMS preparation workflows  
**Key Features**:

- EN 62304 compliance validation
- Medical device software requirements
- Regulatory compliance reporting

#### `/src/preparation/aami-tir45-requirement-analyzer.ts`

**Purpose**: AAMI TIR45 AGILE practices compliance analysis  
**Function**: AGILE process validation, methodology compliance, reporting  
**References**: AAMI TIR45 standards, process validation  
**Referenced by**: QMS preparation workflows  
**Key Features**:

- AGILE methodology compliance
- Process validation and verification
- Development practice assessment

#### `/src/preparation/compliance-criteria-validator.ts`

**Purpose**: General compliance criteria validation system  
**Function**: Multi-standard compliance checking, criteria validation, reporting  
**References**: Various compliance standards  
**Referenced by**: QMS preparation workflows  
**Key Features**:

- Multi-standard compliance validation
- Criteria assessment and reporting
- Compliance gap analysis

### Validation Systems

#### `/src/preparation/audit-cryptography-validator.ts`

**Purpose**: Cryptographic audit trail validation  
**Function**: Cryptographic signature validation, audit integrity, security compliance  
**References**: Cryptographic utilities, security standards  
**Referenced by**: Audit validation workflows  
**Key Features**:

- Cryptographic signature validation
- Audit trail integrity verification
- Security compliance assessment

#### `/src/preparation/crypto-library-validator.ts`

**Purpose**: Cryptographic library compliance and validation  
**Function**: Library validation, security assessment, compliance checking  
**References**: Cryptographic libraries, security standards  
**Referenced by**: Security validation workflows  
**Key Features**:

- Cryptographic library validation
- Security standard compliance
- Vulnerability assessment

#### `/src/preparation/performance-baseline-validator.ts`

**Purpose**: Performance baseline validation and compliance  
**Function**: Performance standards validation, baseline comparison, reporting  
**References**: Performance metrics, baseline standards  
**Referenced by**: Performance compliance workflows  
**Key Features**:

- Performance baseline validation
- Standard compliance verification
- Performance regression detection

#### `/src/preparation/qms-performance-target-validator.ts`

**Purpose**: QMS-specific performance target validation  
**Function**: QMS performance standards, target validation, compliance reporting  
**References**: QMS standards, performance metrics  
**Referenced by**: QMS performance validation workflows  
**Key Features**:

- QMS performance target validation
- Compliance standard verification
- Performance quality assurance

### Infrastructure Validation

#### `/src/preparation/architecture-integration-validator.ts`

**Purpose**: System architecture integration validation  
**Function**: Architecture compliance, integration validation, system verification  
**References**: Architecture standards, integration patterns  
**Referenced by**: Architecture validation workflows  
**Key Features**:

- Architecture pattern validation
- Integration compliance verification
- System design assessment

#### `/src/preparation/pdf-tool-validator.ts`

**Purpose**: PDF processing tool validation and compliance  
**Function**: PDF processing validation, tool compliance, security assessment  
**References**: PDF processing utilities, security standards  
**Referenced by**: Document processing workflows  
**Key Features**:

- PDF processing tool validation
- Document security compliance
- Processing integrity verification

#### `/src/preparation/regulatory-document-processor.ts`

**Purpose**: Regulatory document processing and validation  
**Function**: Document processing, compliance extraction, regulatory validation  
**References**: Document processing utilities, regulatory standards  
**Referenced by**: Regulatory compliance workflows  
**Key Features**:

- Regulatory document processing
- Compliance data extraction
- Regulatory standard validation

## Functional Groups

### * Core System

- **Entry Points**: `index.ts`, `index-di.ts`
- **Foundation**: `core/foundation.ts`, `core/config-manager.ts`, `core/session-manager.ts`
- **Error Handling**: `core/error-handler.ts`, `core/mode-manager.ts`

### ⌨ CLI Interface

- **Command Processing**: `cli/args.ts`, `cli/commands.ts`, `cli/enhanced-commands.ts`
- **Session Management**: `cli/session.ts`, `cli/interaction-manager.ts`, `cli/menu-system.ts`
- **Interactive Components**: `cli/interactive.ts`, `cli/enhanced-wizard.ts`, `cli/project-discovery.ts`
- **Command Implementations**: `cli/commands/*`, `cli/factories/command-factory.ts`

### ⌘ Configuration Management

- **Core Config**: `config/settings.ts`, `config/templates.ts`, `config/template-manager.ts`
- **Document Management**: `config/document-manager.ts`
- **Display & Formatting**: `cli/config-formatter.ts`

### ⋇ Type System

- **Core Types**: `types/workflow.ts`, `types/agents.ts`, `types/interaction-modes.ts`
- **Document Types**: `types/document-management.ts`

### ◦ Utilities & Services

- **Core Utilities**: `utils/audit-logger.ts`, `utils/file-system.ts`, `utils/test-utils.ts`
- **System Monitoring**: `utils/metrics.ts`, `utils/logue-wrapper.ts`
- **Interfaces & Adapters**: `cli/interfaces/*`, `cli/adapters/*`

### ⊎ TDD Workflow Engine

- **Orchestration**: `tdd/orchestrator.ts`, `tdd/quality-gates.ts`, `tdd/codebase-scanner.ts`
- **Workflow Phases**: `tdd/phases/plan-test.ts`, `tdd/phases/implement-fix.ts`, `tdd/phases/refactor-document.ts`

### 🤖 AI Integration

- **Claude Integration**: `claude/client.ts`, `claude/prompts.ts`
- **Agent Systems**: Based on `types/agents.ts` definitions

### ⑄ Security & Compliance

- **Audit System**: `utils/audit-logger.ts`, `security/guardrails.ts`
- **QMS Preparation**: All files in `preparation/*` directory

### ⊎ Testing Framework

- **Test Infrastructure**: `testing/e2e-runner.ts`, `testing/performance.ts`, `testing/mock-claude.ts`
- **Testing Utilities**: `testing/utils/*`, `testing/mocks/*`

### ⋇ Documentation System

- **Documentation Generation**: `docs/generator.ts`
- **Help System**: `cli/help-system.ts`

## Data Flow Summary

### Primary Data Flows

``` diagram
1. **Application Startup Flow**:

    index.ts → Core Foundation → Session Manager → CLI Session → Menu System

2. **Command Execution Flow**:

   CLI Args → Command Router → Command Implementation → Service Layer → Result Processing

3. **Configuration Management Flow**:

   Config Request → Config Manager → Template System → Validation → Persistence

4. **TDD Workflow Flow**:

   Generate Command → TDD Orchestrator → Workflow Phases → Quality Gates → Result Aggregation

5. **Session Management Flow**:

   Session Creation → State Tracking → Metrics Collection → Audit Logging → Cleanup
```

### Cross-Cutting Concerns

- **Error Handling**: Flows through all components via `ErrorHandler` class
- **Audit Logging**: Integrated into all major operations via `AuditLogger`
- **Configuration**: Accessed globally through `ConfigManager`
- **Type Validation**: Applied throughout using Zod schemas

## File Reference Matrix

### High-Level Dependencies

| Component | References | Referenced By |
|-----------|------------|---------------|
| `index.ts` | `cli/args.ts`, `core/foundation.ts`, `cli/session.ts` | `package.json`, npm scripts |
| `core/foundation.ts` | `core/session-manager.ts`, `core/mode-manager.ts`, `utils/audit-logger.ts` | `index.ts`, `index-di.ts` |
| `cli/session.ts` | `cli/interaction-manager.ts`, `cli/menu-system.ts`, `types/interaction-modes.ts` | `index.ts` |
| `cli/commands.ts` | `claude/client.ts`, `tdd/orchestrator.ts`, `config/settings.ts` | `cli/args.ts` |
| `tdd/orchestrator.ts` | `tdd/phases/*`, `tdd/quality-gates.ts`, `claude/client.ts` | `cli/commands.ts` |

### Detailed Reference Mapping

#### Core System References

- `index.ts` → [`cli/args.ts`, `core/foundation.ts`, `core/config-manager.ts`, `core/error-handler.ts`, `cli/session.ts`, `utils/test-utils.ts`]
- `core/foundation.ts` → [`core/session-manager.ts`, `core/mode-manager.ts`, `utils/audit-logger.ts`, `utils/test-utils.ts`]
- `core/config-manager.ts` → [`core/foundation.ts`, `utils/audit-logger.ts`, `fs/promises`, `path`]
- `core/session-manager.ts` → [`types/workflow.ts`, `utils/audit-logger.ts`, `uuid`, `events`]

#### CLI System References

- `cli/args.ts` → [`cli/commands.ts`, `cli/enhanced-commands.ts`, `commander`]
- `cli/commands.ts` → [`claude/client.ts`, `tdd/orchestrator.ts`, `config/settings.ts`, `cli/interactive.ts`, `utils/test-utils.ts`]
- `cli/session.ts` → [`cli/interaction-manager.ts`, `cli/menu-system.ts`, `types/interaction-modes.ts`, `config/settings.ts`]

#### Testing System References  

- `testing/e2e-runner.ts` → [`testing/utils/cli-test-utils.ts`, `testing/mocks/*`]
- `testing/mocks/*` → [`cli/interfaces/*`, respective service implementations]

#### QMS System References

- `preparation/*` → Various compliance standards, validation utilities, security libraries
- Each QMS component references specific regulatory standards and validation frameworks

---

*This index provides comprehensive coverage of the Phoenix Code Lite codebase. For complete system understanding, refer to the companion [Architecture Diagram](ARCHITECTURE-DIAGRAM.md) for visual representation and [API Reference](API-REFERENCE.md) for interface definitions and usage examples.*
