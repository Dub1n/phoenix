# Phoenix-Code-Lite Technical Specification (v2.0)

> Comprehensive technical architecture and design specification for Phoenix-Code-Lite: An enterprise-grade TDD workflow orchestrator built on Claude Code SDK with advanced quality gates, StateFlow orchestration, and comprehensive observability.

## Executive Summary

Phoenix-Code-Lite represents a paradigm shift in the Phoenix Framework ecosystem, leveraging the Claude Code SDK to create a comprehensive, enterprise-ready development experience. Unlike Phoenix-Lite's standalone approach, Phoenix-Code-Lite operates as an intelligent extension within the Claude Code ecosystem, providing advanced TDD workflow orchestration with sophisticated quality gates, agent specialization, and comprehensive observability while delegating infrastructure concerns to Claude Code's robust foundation.

### Key Architectural Decisions

1. **Claude Code SDK Integration**: Leverage existing infrastructure rather than reinventing it
2. **Enterprise-Grade Architecture**: Advanced state management with StateFlow FSM orchestration
3. **Extension Pattern**: Plugin-like architecture that feels native within Claude Code
4. **Workflow Orchestration Focus**: Concentrate on sophisticated TDD logic with quality gates
5. **TypeScript Implementation**: Better SDK compatibility and developer experience
6. **Agent Specialization**: Three distinct AI personas with specialized system prompts
7. **Comprehensive Observability**: Full audit logging, metrics collection, and analytics

---

## Architecture Philosophy

### Design Principles

#### 1. Leverage, Don't Reinvent

Phoenix-Code-Lite embraces the Unix philosophy of building on existing tools rather than replacing them. Claude Code already provides excellent file operations, git integration, command execution, and LLM interaction capabilities. Phoenix-Code-Lite focuses on orchestrating these capabilities into a sophisticated, enterprise-grade TDD workflow.

#### 2. Extension Over Application

Rather than building a standalone CLI tool, Phoenix-Code-Lite operates as an intelligent extension that enhances Claude Code's capabilities. This approach provides:

- **Seamless Integration**: Feels native within the Claude Code environment
- **Consistent UX**: Users work within familiar Claude Code patterns
- **Automatic Updates**: Inherits improvements from Claude Code updates
- **Reduced Maintenance**: Infrastructure concerns handled by Claude Code team

#### 3. Enterprise-Grade Workflow Orchestration

Phoenix-Code-Lite's core competency is orchestrating sophisticated TDD workflows through:

- **StateFlow FSM**: Formal finite state machine managing complex workflow transitions
- **Phase 1**: Plan & Test Generation with Planning Analyst persona
- **Phase 2**: Implementation with retry logic using Implementation Engineer persona
- **Phase 3**: Refactoring & Documentation with Quality Reviewer persona
- **Quality Gates**: 4-tier validation system with weighted scoring algorithms
- **Security Guardrails**: Comprehensive file system and command execution controls

All infrastructure concerns (file I/O, git operations, command execution) are delegated to Claude Code.

#### 4. Quality Through Structure and Intelligence

By imposing a structured, intelligent TDD workflow on Claude Code's flexible interaction model, Phoenix-Code-Lite ensures:

- **Consistent Quality**: Every implementation follows TDD principles with quality validation
- **Measurable Progress**: Clear phases with defined success criteria and scoring
- **Self-Correction**: Built-in retry and error handling mechanisms
- **Comprehensive Audit Trail**: Complete workflow history, decision tracking, and metrics
- **Agent Specialization**: Specialized AI personas optimized for specific workflow phases

---

## Technical Architecture

### Technology Stack Comparison

| *Component*         | *Phoenix Framework* | *Phoenix-Lite*       | *Phoenix-Code-Lite v2.0*         |
|---------------------|---------------------|----------------------|----------------------------------|
| **Language**        | Python 3.11+        | Rust                 | TypeScript/Node.js               |
| **LLM Integration** | LangChain           | Direct Anthropic API | Claude Code SDK                  |
| **Orchestration**   | LangGraph           | Custom FSM           | StateFlow FSM + Quality Gates    |
| **File Operations** | Python stdlib       | Rust std::fs         | Claude Code SDK                  |
| **Git Integration** | Python subprocess   | Rust Command         | Claude Code SDK                  |
| **Testing**         | pytest              | Custom validation    | Claude Code + Quality Gates      |
| **Configuration**   | YAML/JSON           | TOML                 | Advanced JSON + Templates        |
| **Deployment**      | Docker/K8s          | Cargo binary         | npm package                      |
| **Quality System**  | Basic               | Medium               | Enterprise (4-tier + weighted)   |
| **Observability**   | Limited             | Basic                | Comprehensive (audit + metrics)  |
| **Security**        | Basic               | Medium               | Advanced (guardrails + policies) |

### Core Architecture Components

```text
┌─────────────────────────────────────────────────────────────┐
│                    Phoenix-Code-Lite v2.0                   │
├─────────────────────────────────────────────────────────────┤
│  CLI Interface & User Experience                            │
│  ├── Advanced CLI (Commander.js)                            │
│  ├── Progress Display (multi-phase indicators)              │
│  ├── Interactive Configuration Wizard                       │
│  └── Context-Aware Help System                              │
├─────────────────────────────────────────────────────────────┤
│  Configuration Management System                            │
│  ├── Zod-Validated Schema with Runtime Type Safety          │
│  ├── Configuration Templates (Starter/Enterprise/Perf)      │
│  ├── Agent-Specific Settings and Customization              │
│  └── Configuration Migration and Versioning                 │
├─────────────────────────────────────────────────────────────┤
│  Audit Logging & Metrics Collection                         │
│  ├── Structured Audit Logging with Session Correlation      │
│  ├── Performance Metrics (tokens, time, quality scores)     │
│  ├── Workflow Analytics (success rates, failure patterns)   │
│  └── Export Capabilities (JSON, CSV)                        │
├─────────────────────────────────────────────────────────────┤
│  TDD Workflow Engine with StateFlow FSM                     │
│  ├── StateFlow Orchestrator (Formal FSM)                    │
│  ├── Phase 1: Plan & Test (Planning Analyst)                │
│  ├── Phase 2: Implement & Fix (Implementation Engineer)     │
│  ├── Phase 3: Refactor & Document (Quality Reviewer)        │
│  └── Workflow State Management & Transitions                │
├─────────────────────────────────────────────────────────────┤
│  Quality Gates & Validation Framework                       │
│  ├── 4-Tier Quality Validation System                       │
│  ├── Weighted Quality Scoring Algorithm                     │
│  ├── Quality Gate Manager with Configurable Thresholds      │
│  ├── Validation Result Tracking and Reporting               │
│  └── Integration with StateFlow Workflow Engine             │
├─────────────────────────────────────────────────────────────┤
│  Security Guardrails System                                 │
│  ├── File System Access Control (Policy-Based)              │
│  ├── Command Execution Validation                           │
│  ├── Security Audit Logging                                 │
│  └── Violation Prevention and Reporting                     │
├─────────────────────────────────────────────────────────────┤
│  Claude Code Integration Layer                              │
│  ├── Enhanced SDK Client Wrapper                            │
│  ├── Agent-Aware Prompt Management                          │
│  ├── Codebase Scanner (Anti-Reimplementation)               │
│  ├── File Operations Proxy with Security                    │
│  └── Command Execution Proxy with Validation                │
├─────────────────────────────────────────────────────────────┤
│  Core Architecture & Agent Specialization                   │
│  ├── Zod-Validated Type System                              │
│  ├── Agent Specialization System (3 Personas)               │
│  ├── Runtime Type Safety Implementation                     │
│  └── Error Handling and Resilience Patterns                 │
├─────────────────────────────────────────────────────────────┤
│  Utilities & Support                                        │
│  ├── Advanced Logging Infrastructure                        │
│  ├── Metrics Collection and Analysis                        │
│  ├── Validation Utilities                                   │
│  └── Comprehensive Error Handling                           │
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

### Enhanced Module Organization (30+ Modules)

```text
src/
├── index.ts                     // Main entry point
├── cli/                         // Advanced CLI interface
│   ├── commands.ts              // Command implementations
│   ├── args.ts                  // Argument parsing
│   ├── progress.ts              // Multi-phase progress tracking
│   ├── help.ts                  // Context-aware help system
│   └── wizard.ts                // Interactive configuration wizard
├── tdd/                         // TDD workflow engine with StateFlow
│   ├── orchestrator.ts          // StateFlow FSM orchestrator
│   ├── state-machine.ts         // Formal FSM implementation
│   ├── phases/                  // Phase implementations
│   │   ├── plan-test.ts         // Planning Analyst phase
│   │   └── refactor-document.ts // Quality Reviewer phase
│   ├── quality-gates.ts         // 4-tier quality validation system
│   ├── codebase-scanner.ts      // Anti-reimplementation system
│   └── workflow-manager.ts      // Workflow state management
├── security/                    // Security guardrails system
│   ├── guardrails.ts            // Security policy enforcement
│   ├── policies.ts              // Security policy definitions
│   ├── audit.ts                 // Security audit logging
│   └── validation.ts            // Security validation utilities
├── claude/                      // Enhanced Claude Code SDK integration
│   ├── client.ts                // Enhanced SDK client wrapper
│   ├── prompts.ts               // Agent-aware prompt templates
│   ├── personas.ts              // Specialized agent personas
│   └── context-manager.ts       // Context and session management
├── config/                      // Advanced configuration management
│   ├── settings.ts              // Configuration loading and validation
│   ├── templates.ts             // Configuration templates
│   ├── migration.ts             // Configuration migration support
│   └── validation.ts            // Zod-based configuration validation
├── audit/                       // Audit logging and metrics
│   ├── logger.ts                // Structured audit logging
│   ├── metrics.ts               // Performance metrics collection
│   ├── analytics.ts             // Workflow analytics
│   └── export.ts                // Export capabilities (JSON, CSV)
├── quality/                     // Quality gates and validation
│   ├── gates.ts                 // Quality gate implementations
│   ├── scoring.ts               // Weighted quality scoring
│   ├── validators.ts            // Quality validation utilities
│   └── reports.ts               // Quality reporting system
├── utils/                       // Enhanced utility modules
│   ├── logger.ts                // Advanced logging infrastructure
│   ├── schemas.ts               // Zod validation schemas
│   ├── metrics.ts               // Metrics collection utilities
│   └── error-handling.ts        // Comprehensive error handling
└── types/                       // TypeScript type definitions
    ├── workflow.ts              // Core workflow types
    ├── agents.ts                // Agent persona definitions
    ├── quality.ts               // Quality gate type definitions
    ├── security.ts              // Security policy type definitions
    ├── config.ts                // Configuration type definitions
    └── audit.ts                 // Audit logging type definitions
```

---

## StateFlow Workflow Engine Design

### Enterprise-Grade Orchestration Architecture

Phoenix-Code-Lite employs StateFlow, a formal Finite State Machine (FSM) that orchestrates the entire project generation process through sophisticated state management. The StateFlow engine manages complex workflow transitions with quality gates, error recovery, and comprehensive audit logging.

### StateFlow FSM States and Transitions

```text
┌───────────────────────────────────────────────────────┐
│                     StateFlow FSM                     │
├───────────────────────────────────────────────────────┤
│  INITIALIZATION                                       │
│  ├── Codebase Scan (Anti-Reimplementation)            │
│  ├── Security Policy Validation                       │
│  └── Configuration Loading                            │
│              │                                        │
│              ▼                                        │
│  GENERATION_CYCLE                                     │
│  ├── PLAN_TEST (Planning Analyst Persona)             │
│  │   ├── Requirements Analysis                        │
│  │   ├── Test Strategy Development                    │
│  │   ├── Edge Case Identification                     │
│  │   └── Quality Gate 1: Test Coverage Validation     │
│  │              │                                     │
│  │              ▼                                     │
│  ├── IMPLEMENT_FIX (Implementation Engineer Persona)  │
│  │   ├── Code Generation (TDD-Driven)                 │
│  │   ├── Test Execution and Validation                │
│  │   ├── Retry Logic (Configurable Attempts)          │
│  │   └── Quality Gate 2: Implementation Validation    │
│  │              │                                     │
│  │              ▼                                     │
│  └── REFACTOR_DOCUMENT (Quality Reviewer Persona)     │
│      ├── Code Quality Improvement                     │
│      ├── Documentation Generation                     │
│      ├── Performance Optimization                     │
│      └── Quality Gate 3: Final Quality Validation     │
│              │                                        │
│              ▼                                        │
│  VERIFICATION_CYCLE                                   │
│  ├── Quality Gate 4: Comprehensive Validation         │
│  ├── Security Guardrails Verification                 │
│  ├── Metrics Collection and Analysis                  │
│  └── Audit Log Generation                             │
│              │                                        │
│              ▼                                        │
│  COMPLETION                                           │
│  ├── Workflow Result Compilation                      │
│  ├── Performance Metrics Export                       │
│  └── Session Audit Finalization                       │
└───────────────────────────────────────────────────────┘
```

### Agent Specialization System

#### Planning Analyst Persona

- **Role**: Senior Technical Analyst & Test Designer
- **Expertise**: Requirements analysis, test strategy, edge case identification, risk assessment
- **Approach**: Methodical, comprehensive, and risk-aware with systematic analysis
- **Quality Standards**: Comprehensive test coverage, clear acceptance criteria, edge case identification
- **Output Format**: Structured test suites with detailed documentation and success criteria

#### Implementation Engineer Persona

- **Role**: Senior Software Engineer & Architecture Specialist
- **Expertise**: Clean code, design patterns, performance optimization, maintainable architecture
- **Approach**: Pragmatic, test-driven, focused on maintainability and scalable solutions
- **Quality Standards**: Code clarity, performance efficiency, architectural consistency
- **Output Format**: Production-ready code with comprehensive error handling and documentation

#### Quality Reviewer Persona

- **Role**: Senior Code Reviewer & Documentation Specialist
- **Expertise**: Code quality, maintainability, documentation, refactoring, technical communication
- **Approach**: Detail-oriented, focused on long-term code health and team knowledge transfer
- **Quality Standards**: Documentation completeness, code maintainability, knowledge transfer effectiveness
- **Output Format**: Refined code with comprehensive documentation and improvement recommendations

---

## Quality Gates & Validation Framework

### 4-Tier Quality Validation System

Phoenix-Code-Lite implements a sophisticated, weighted quality scoring system that ensures enterprise-grade code quality through multiple validation layers:

#### Tier 1: Syntax & Structure Validation (Weight: 1.0)

- **Syntax Validation**: Language-specific syntax checking and error detection
- **Structure Analysis**: Code organization, module structure, and architectural patterns
- **Import/Dependency Validation**: Dependency consistency and circular dependency detection
- **Type Safety**: Runtime type validation using Zod schemas

#### Tier 2: Test Coverage & Execution (Weight: 0.8)

- **Test Coverage Analysis**: Comprehensive test coverage measurement and reporting
- **Test Execution Validation**: Automated test suite execution and result validation
- **Test Quality Assessment**: Test comprehensiveness, edge case coverage, and maintainability
- **TDD Compliance**: Verification of test-driven development principles

#### Tier 3: Code Quality & Maintainability (Weight: 0.6)

- **Code Complexity Analysis**: Cyclomatic complexity, cognitive load, and maintainability metrics
- **Design Pattern Compliance**: Adherence to established design patterns and best practices
- **Performance Analysis**: Basic performance profiling and optimization recommendations
- **Security Scanning**: Basic security vulnerability detection and mitigation

#### Tier 4: Documentation & Knowledge Transfer (Weight: 0.4)

- **Documentation Completeness**: API documentation, code comments, and usage examples
- **Knowledge Transfer Assessment**: Code readability, explanation quality, and team onboarding support
- **Maintenance Documentation**: Troubleshooting guides, architecture decisions, and technical debt tracking
- **User Experience Documentation**: End-user guides, configuration documentation, and examples

### Weighted Quality Scoring Algorithm

```typescript
interface QualityScore {
  overallScore: number;        // 0-1 weighted average
  tierScores: {
    syntax: number;            // Tier 1 score
    testing: number;           // Tier 2 score
    quality: number;           // Tier 3 score
    documentation: number;     // Tier 4 score
  };
  passingGates: number;        // Count of gates that passed
  totalGates: number;          // Total number of gates evaluated
  recommendations: string[];   // Specific improvement recommendations
}

// Weighted scoring calculation:
// overallScore = (syntax * 1.0 + testing * 0.8 + quality * 0.6 + documentation * 0.4) / 2.8
```

### Quality Gate Integration with StateFlow

Quality gates are integrated at each StateFlow transition:

- **Gate 1**: After PLAN_TEST phase - validates test coverage and strategy
- **Gate 2**: After IMPLEMENT_FIX phase - validates implementation quality and test passage
- **Gate 3**: After REFACTOR_DOCUMENT phase - validates code quality and documentation
- **Gate 4**: Final validation - comprehensive quality assessment before completion

---

## Configuration Management System

### Advanced Configuration Architecture

Phoenix-Code-Lite provides enterprise-grade configuration management with templates, validation, and migration support:

#### Configuration Templates

**Starter Template**: Basic configuration for simple projects

```json
{
  "version": "2.0",
  "template": "starter",
  "workflow": {
    "maxRetries": 3,
    "timeoutMinutes": 10
  },
  "qualityGates": {
    "required": ["syntax", "testing"],
    "thresholds": {
      "overall": 0.7,
      "syntax": 0.9,
      "testing": 0.8
    }
  }
}
```

**Enterprise Template**: Full-featured configuration for production environments

```json
{
  "version": "2.0", 
  "template": "enterprise",
  "workflow": {
    "maxRetries": 5,
    "timeoutMinutes": 30,
    "enableMetrics": true,
    "enableAuditLogging": true
  },
  "qualityGates": {
    "required": ["syntax", "testing", "quality", "documentation"],
    "thresholds": {
      "overall": 0.85,
      "syntax": 0.95,
      "testing": 0.90,
      "quality": 0.80,
      "documentation": 0.75
    }
  },
  "security": {
    "enableGuardrails": true,
    "requireApproval": true,
    "auditAll": true
  }
}
```

---

## Security Architecture

### Comprehensive Security Guardrails

Phoenix-Code-Lite implements enterprise-grade security controls addressing agentic risks:

#### File System Security

- **Path Validation**: Whitelist/blacklist system with glob pattern matching
- **Access Control**: Policy-based file system access with violation prevention
- **Size Limits**: Configurable file size limits to prevent resource exhaustion
- **Audit Logging**: Comprehensive logging of all file system operations

#### Command Execution Security  

- **Command Validation**: Allowed/blocked command lists with dangerous pattern detection
- **Privilege Control**: Prevention of privilege escalation attempts
- **Execution Monitoring**: Real-time monitoring and logging of command execution
- **Approval Workflows**: Optional manual approval for high-risk operations

#### Anti-Reimplementation System

- **Codebase Scanning**: Mandatory scanning to prevent duplication of existing functionality
- **Asset Discovery**: Comprehensive analysis of existing functions, classes, and components
- **Conflict Detection**: Identification of potential naming conflicts and architectural inconsistencies
- **Reuse Recommendations**: Intelligent suggestions for leveraging existing code assets

---

## Observability & Analytics

### Comprehensive Audit Logging

Phoenix-Code-Lite provides enterprise-grade observability through structured audit logging:

#### Audit Event Types

- **Workflow Events**: Phase transitions, state changes, and completion status
- **Security Events**: Access attempts, violations, and policy enforcement
- **Quality Events**: Quality gate results, validation failures, and improvements
- **Performance Events**: Execution times, resource usage, and optimization opportunities

#### Metrics Collection & Analysis

- **Performance Metrics**: Token usage, execution time, memory consumption
- **Quality Metrics**: Quality scores, improvement trends, and validation success rates
- **Workflow Analytics**: Success rates, failure patterns, and optimization opportunities
- **Export Capabilities**: JSON, CSV export for external analysis and reporting

---

## Development Roadmap Alignment

This specification directly supports the 8-phase development roadmap:

### Phase Implementation Mapping

- **Phase 1**: TypeScript Environment & Foundation → Core Architecture setup
- **Phase 2**: Core Architecture & Claude Code Integration → Agent Specialization & SDK Integration
- **Phase 3**: TDD Workflow Engine Implementation → StateFlow FSM & Workflow Orchestration
- **Phase 4**: Quality Gates & Validation Framework → 4-Tier Quality System & Weighted Scoring
- **Phase 5**: Configuration Management System → Advanced Configuration with Templates
- **Phase 6**: Audit Logging & Metrics Collection → Comprehensive Observability
- **Phase 7**: CLI Interface & User Experience → Advanced CLI with Progress Tracking
- **Phase 8**: Integration Testing & Documentation → Enterprise-Ready Production System

### Enterprise Features

- **Comprehensive Security**: Full security guardrails addressing agentic risks
- **Advanced Observability**: Complete audit logging, metrics, and analytics
- **Sophisticated Quality**: 4-tier weighted quality scoring system
- **Professional UX**: Advanced CLI with progress tracking and help system
- **Configuration Management**: Enterprise-grade configuration with templates and migration

---

## Conclusion

This specification outlines a comprehensive, enterprise-grade vision for Phoenix-Code-Lite v2.0. By implementing sophisticated StateFlow orchestration, advanced quality gates, comprehensive security guardrails, and full observability, Phoenix-Code-Lite v2.0 delivers an industrial-strength TDD workflow orchestrator that meets the demands of professional development teams while leveraging the power of the Claude Code SDK.

The architecture provides a robust foundation for AI-assisted development with enterprise-grade reliability, security, and observability, establishing Phoenix-Code-Lite as the premier choice for teams requiring sophisticated, automated TDD workflows.

---

**Document Version**: 2.0 (Enterprise-Grade Implementation)
**Status**: Matches 07-Phoenix-Code-Lite-Dev Roadmap
**Implementation Target**: Full-Featured Production System  
**Last Updated**: July 2025
