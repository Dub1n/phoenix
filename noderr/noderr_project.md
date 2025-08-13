# Project Overview: Phoenix Code Lite

---

**Purpose of this Document:** This `noderr_project.md` is a core artifact of the Noderr v1.9 system. It provides a comprehensive high-level summary of the project, including its goals, scope, technology stack, architecture, coding standards, and quality priorities. The AI Agent will reference this document extensively for context and guidance throughout the development lifecycle, as detailed in `noderr_loop.md`.

---

### 1. Project Goal & Core Problem

*   **Goal:** Phoenix Code Lite is a TDD workflow orchestrator for Claude Code SDK that provides a comprehensive development environment with dual-mode CLI (interactive and command-line) for AI-assisted software development.
*   **Core Problem Solved:** Developers need a structured, AI-assisted workflow that combines Test-Driven Development methodology with Claude Code integration, providing both interactive and command-line interfaces for efficient code generation, testing, and quality assurance.

---

### 2. Scope & Key Features (MVP Focus)

*   **Minimum Viable Product (MVP) Description:** A fully functional TDD workflow orchestrator with interactive CLI session management, Claude Code integration, quality gates, and comprehensive testing framework that can generate, test, and validate code according to TDD principles.
*   **Key Features (In Scope for MVP):**
    *   `TDD Workflow Orchestration`: Complete 3-phase TDD workflow (Plan & Test, Implement & Fix, Refactor & Document) with quality gates
    *   `Interactive CLI Session`: Persistent interactive session with menu navigation and dual-mode support
    *   `Claude Code Integration`: Full integration with Claude Code SDK for AI-assisted development
    *   `Quality Assurance System`: Comprehensive quality gates and validation for all generated code
    *   `Configuration Management`: Template-based configuration system with starter, enterprise, and performance templates
    *   `Codebase Scanning`: Anti-reimplementation system that scans existing codebase before generation
*   **Key Features (Explicitly OUT of Scope for MVP):**
    *   `Production Deployment`: This is a development tool, not a production deployment system
    *   `Multi-User Collaboration`: Single-user development environment focused on individual developer productivity
    *   `Advanced Analytics`: Basic metrics collection only, not comprehensive analytics dashboard

---

### 3. Target Audience

*   **Primary User Group(s):** Software developers, particularly those working with TypeScript/Node.js projects who want to leverage AI assistance while maintaining TDD practices and code quality standards.
*   **Key User Needs Addressed:** Need for structured AI-assisted development workflow, desire to maintain TDD methodology while using AI tools, requirement for quality assurance in AI-generated code, preference for both interactive and command-line interfaces.

---

### 4. Technology Stack (Specific Versions Critical for Agent)

| Category             | Technology                                                                                                                                                        | Specific Version (or latest stable)      | Notes for AI Agent / Rationale                                         |
|:---------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-----------------------------------------|:----------------------------------------------------------------------------|
| Language(s)          | TypeScript                                                                                                                                                        | TypeScript 5.8.3                         | (Agent: Primary language for the entire project)                |
| Backend Framework    | Node.js                                                                                                                                                           | Node.js 18.20.8                          | (Agent: Runtime environment for the CLI application)                           |
| Frontend Framework   | N/A (CLI Application)                                                                                                                                             | N/A                                      | (Agent: This is a command-line tool, no web frontend)                                    |
| UI Library/Kit       | N/A (CLI Application)                                                                                                                                             | N/A                                      | (Agent: Uses terminal-based UI libraries like chalk, inquirer)                                                                             |
| Database             | N/A (File-based configuration)                                                                                                                                     | N/A                                      | (Agent: Configuration stored in JSON files, no database required)         |
| ORM/ODM (If any)     | N/A                                                                                                                                                               | N/A                                      | (Agent: No database operations, file system operations only)               |
| Testing (Unit)       | Jest                                                                                                                                                              | Jest 30.0.5                              | (Agent: Use this for running unit tests)                          |
| Testing (E2E/Integ.) | Jest + Supertest                                                                                                                                                  | Jest 30.0.5 + Supertest 7.1.4           | (Agent: Use this for running integration/E2E tests)               |
| Version Control      | Git                                                                                                                                                               | Git 2.49.0.windows.1                     | Repo hosted locally |
| Deployment Target    | Local Development                                                                                                                                                  | N/A                                      | Development tool, not deployed application.                                              |
| Key Libraries        | @anthropic-ai/claude-code for Claude integration, commander for CLI, inquirer for interactive prompts, zod for validation, chalk for terminal styling | @anthropic-ai/claude-code@1.0.65, commander@13.1.0, inquirer@12.9.0, zod@4.0.14, chalk@4.1.2 | (Agent: Key dependencies to install.)         |
| Other (Specify)      | TypeScript compilation, ESLint for code quality, Prettier for formatting                                                                                           | TypeScript 5.8.3, ESLint 9.32.0, Prettier 3.6.2                                          | (Agent: Development tooling for code quality.)             |

* **Tech Stack Rationale:** TypeScript with Node.js offers rapid development for CLI applications with strong type safety. The Claude Code SDK integration provides cutting-edge AI assistance, while Jest and ESLint ensure code quality. The dual-mode CLI design accommodates both interactive and command-line workflows, making it versatile for different development styles.

---

### 5. High-Level Architecture

* **Architectural Style:** Modular CLI Application with Dual-Mode Architecture (Interactive Session + Command-Line)
* **Key Components & Interactions (Brief Textual Description):** The application uses a core foundation system that initializes configuration management, error handling, and session management. The CLI system supports both interactive sessions (with menu navigation) and traditional command-line operations. The TDD orchestrator manages the 3-phase workflow (Plan & Test, Implement & Fix, Refactor & Document) with quality gates and Claude Code integration. All components are designed with dependency injection and modular architecture for testability and maintainability.
* **Diagram (Mermaid - Agent to Generate):**
    ```mermaid
    graph TD
        A[User via CLI] --> B{CLI Mode Selection};
        B --> C[Interactive Session Mode];
        B --> D[Command-Line Mode];
        
        C --> E[Menu System];
        E --> F[Session Management];
        F --> G[TDD Orchestrator];
        
        D --> H[Command Parser];
        H --> I[Command Execution];
        I --> G;
        
        G --> J[Phase 1: Plan & Test];
        G --> K[Phase 2: Implement & Fix];
        G --> L[Phase 3: Refactor & Document];
        
        J --> M[Claude Code Client];
        K --> M;
        L --> M;
        
        M --> N[Quality Gates];
        N --> O[Codebase Scanner];
        
        subgraph Core Infrastructure
            direction LR
            P[Configuration Manager];
            Q[Error Handler];
            R[Session Manager];
            S[Audit Logger];
        end
        
        G --> P;
        G --> Q;
        G --> R;
        G --> S;
    ```
    *(Agent: This diagram shows the dual-mode CLI architecture with TDD workflow orchestration and Claude Code integration.)*

---

### 6. Core Components/Modules (Logical Breakdown)

* `TDD Workflow Orchestration Module`: Manages the complete 3-phase TDD workflow, coordinates between phases, handles quality gates, and integrates with Claude Code for AI assistance.
* `Interactive CLI Session Module`: Provides persistent interactive sessions with menu navigation, breadcrumb tracking, and dual-mode support (menu vs command).
* `Claude Code Integration Module`: Handles all communication with Claude Code SDK, manages prompts, and processes AI-generated responses.
* `Quality Assurance Module`: Implements quality gates, code validation, and ensures generated code meets project standards.
* `Configuration Management Module`: Manages project configuration, templates, and user settings with template-based approach.

---

### 7. Key UI/UX Considerations

* **Overall Feel:** Professional, developer-focused CLI tool with clear navigation and comprehensive feedback
* **Key Principles:**
    * `Clarity`: Clear menu navigation, descriptive prompts, and comprehensive help system
    * `Efficiency`: Dual-mode support allows both quick commands and detailed interactive workflows
    * `Feedback`: Rich progress tracking, quality gate results, and detailed logging for all operations
    * `Flexibility`: Support for both interactive and command-line workflows based on user preference

---

### 8. Development Environment Focus

**Environment Focus:** This project is designed for LOCAL DEVELOPMENT environment. The Phoenix Code Lite tool itself is a development utility that runs on the developer's local machine. It is NOT a web application that gets deployed to production servers.

**Development vs Production Distinction:**
- **Development Environment**: Local machine where Phoenix Code Lite CLI tool runs
- **Production Environment**: N/A - this tool is not deployed as a service
- **Testing Strategy**: Local Jest tests, manual CLI testing, integration testing with local projects

**Environment Context**: Development environment documented in `noderr/environment_context.md` with Windows-specific configuration and local development setup.

---

### 9. Project Status & Implementation State

**Current Implementation Status**: Phase 1 Core Infrastructure Complete
- ✓ Core foundation system implemented
- ✓ Configuration management system working
- ✓ Error handling and logging implemented
- ✓ Dual-mode CLI architecture implemented
- ✓ TDD orchestrator with 3-phase workflow implemented
- ✓ Claude Code integration implemented
- ✓ Quality gates system implemented
- ✓ Interactive session management implemented
- ✓ Menu system and navigation implemented
- ✓ Testing framework (Jest) configured and working

**Architecture Decisions**: 
- Modular architecture with dependency injection for testability
- Dual-mode CLI supporting both interactive and command-line workflows
- Template-based configuration system for flexibility
- Quality gates integrated into each TDD phase
- Anti-reimplementation system via codebase scanning
- Comprehensive audit logging and metrics collection

**Deviations from Original Plan**: 
- Enhanced interactive CLI beyond original scope
- Added comprehensive quality assurance system
- Implemented advanced session management
- Added template-based configuration system
- Enhanced error handling and recovery mechanisms

---

### 10. Quality Standards & Development Practices

**Coding Standards**: 
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for consistent formatting
- Comprehensive JSDoc documentation
- Unit test coverage requirements

**Testing Strategy**: 
- Jest framework for unit and integration testing
- Mock system for Claude Code integration testing
- Performance testing capabilities
- End-to-end testing for CLI workflows

**Quality Gates**: 
- Code quality validation
- Test coverage requirements
- Performance benchmarks
- Security validation
- Documentation completeness

---

### 11. Future Development Roadmap

**Phase 2 Enhancements**:
- Enhanced template system
- Advanced quality metrics
- Performance optimization
- Extended Claude Code integration features

**Phase 3 Features**:
- Plugin system for extensibility
- Advanced analytics and reporting
- Team collaboration features
- Integration with additional AI models

---

### 12. Critical Success Factors

**Technical Requirements**:
- Claude Code API access and proper configuration
- Node.js 18+ environment
- TypeScript compilation working
- Jest testing framework operational

**User Experience Requirements**:
- Intuitive CLI interface
- Reliable TDD workflow execution
- Clear feedback and progress indication
- Comprehensive error handling and recovery

**Quality Requirements**:
- Generated code meets quality standards
- Tests are comprehensive and reliable
- Documentation is complete and accurate
- Performance meets user expectations

---

**Environment Documentation**: Development environment documented in `noderr/environment_context.md` with Windows-specific configuration, local development setup, and clear distinction between development and production environments.
