# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in the VDL_Vault repository.

## User CLAUDE.md Import

%USERPROFILE%\.claude\CLAUDE.md

## ^ Quick Start - Essential Configuration

**Claude Code Configuration**: All essential development guidance is organized in the **.claude/README.md** - update this if any new .claude/ files are added

### 📚 Memory Imports for Context

- **.claude/references/VDL-VAULT-PROJECT-INDEX.md** - Repository navigation and project commands
- **.claude/workflows/DEVELOPMENT-WORKFLOW.md** - Development process for all project typese
- **@.claude/workflows/Critical-Collaborator.md** - Response style for all responses
- **.claude/standards/TDD-STANDARDS.md** - Test-driven development methodology
- **.claude/standards/CODE-STANDARDS.md** - TypeScript coding standards

### 🤖 Specialized Subagents Available

- **tdd-specialist** - Expert TDD workflow specialist for Phoenix Code Lite development
- **qms-specialist** - Expert QMS compliance specialist for medical device software standards  
- **architecture-specialist** - Expert system architecture specialist for cross-project coordination

Use `/spawn tdd-specialist`, `/spawn qms-specialist`, or `/spawn architecture-specialist` to delegate specialized tasks.

### ⋇ Essential References by Development Type

#### References: For Any Development Task

1. **@.claude/references/VDL-VAULT-PROJECT-INDEX.md** - Quick access to all projects and their development commands
2. **@.claude/architecture/VDL-VAULT-REPOSITORY-ARCHITECTURE.md** - Multi-project system overview with Mermaid diagrams
3. **.claude/workflows/DEVELOPMENT-WORKFLOW.md** - Step-by-step development process for all project types

#### References: For Phoenix Code Lite Development

1. **.claude/references/PHOENIX-CODE-LITE-INDEX.md** - Complete file-by-file documentation
2. **.claude/references/PHOENIX-CODE-LITE-API.md** - TypeScript interfaces and method signatures
3. **.claude/standards/TDD-STANDARDS.md** - Test-driven development methodology

#### References: For QMS Infrastructure Development

1. **.claude/architecture/VDL-VAULT-REPOSITORY-ARCHITECTURE.md** - QMS integration patterns
2. **.claude/references/VDL-VAULT-PROJECT-INDEX.md** - QMS component locations and development commands
3. **.claude/workflows/DEVELOPMENT-WORKFLOW.md** - QMS-specific development process

#### References: For Documentation Projects

1. **.claude/standards/CONTEXT-AWARENESS.md** - User-centric documentation principles
2. **.claude/workflows/DEVELOPMENT-WORKFLOW.md** - Documentation creation and maintenance process

### ⚡ Quick Development Workflow

1. **Start Here**: .claude/references/VDL-VAULT-PROJECT-INDEX.md to locate your target project
2. **Understand Architecture**: .claude/architecture/VDL-VAULT-REPOSITORY-ARCHITECTURE.md for system relationships
3. **Follow Process**: .claude/workflows/DEVELOPMENT-WORKFLOW.md for step-by-step guidance
4. **Apply Standards**: Relevant standards from .claude/standards/ directory

## 📚 Repository Overview

### Multi-Project Development Ecosystem

The VDL_Vault repository is a comprehensive ecosystem for medical device software development, QMS infrastructure, and related tooling. It consists of multiple interconnected projects that work together to provide a complete development and compliance framework.

### * Active Projects

#### Active Project: Phoenix Code Lite (PCL)

- **Purpose**: TDD Workflow Orchestrator for Claude Code SDK
- **Technology**: TypeScript, Node.js, Jest, Claude Code SDK
- **Location**: `phoenix-code-lite/`
- **Status**: Mature, actively maintained

#### Active Project: QMS Infrastructure  

- **Purpose**: Medical device software development compliance
- **Technology**: TypeScript, regulatory frameworks, integrated with PCL
- **Location**: `phoenix-code-lite/src/preparation/` + `Obsidian/QMS/`
- **Status**: Active development, compliance-focused

#### Active Project: Haruspex

- **Purpose**: Enhanced analysis and prediction capabilities  
- **Location**: `Haruspex/`
- **Status**: Early planning/architecture phase

### ⋇ Documentation Systems

- **Phoenix Core Documentation** (`docs/Phoenix-Core/`) - Framework documentation and guides
- **PCL Technical Documentation** (`phoenix-code-lite/docs/`) - API reference and codebase indices  
- **QMS Documentation** (`Obsidian/QMS/`) - Regulatory standards and compliance
- **Strategic Documentation** (`PCL-Info/`, `docs/PCL-QMS/`) - Strategic analysis and planning

### ◦ Infrastructure & Tooling

- **Scripts** (`scripts/`) - Development automation and terminal management
- **NoDeRR** (`noderr/`) - Error analysis and architecture verification
- **Claude Integration** (`.claude/`) - AI development workflows and standards

## ⌕ Key Guidelines for Claude Code

### MCP Tool Usage

**Available MCPs**: context7, playwright, ripgrep, sequential-thinking, socket

#### context7 MCP

**Tools Available**:

- `resolve-library-id`: Converts library names to Context7-compatible IDs
- `get-library-docs`: Retrieves library documentation with optional topic focus and token limits

**Use for**: Enhanced context retrieval when standard file reading isn't sufficient, getting up-to-date library documentation and code examples

#### playwright MCP

**Tools Available**:

- **Browser Control**: `browser_navigate`, `browser_navigate_back`, `browser_navigate_forward`, `browser_close`
- **Page Interaction**: `browser_click`, `browser_type`, `browser_hover`, `browser_drag`, `browser_select_option`
- **Page Capture**: `browser_snapshot`, `browser_take_screenshot`, `browser_pdf_save`
- **Tab Management**: `browser_tab_new`, `browser_tab_list`, `browser_tab_select`, `browser_tab_close`
- **Advanced Features**: `browser_evaluate`, `browser_file_upload`, `browser_handle_dialog`, `browser_wait_for`
- **Mouse Operations**: `browser_mouse_click_xy`, `browser_mouse_drag_xy`, `browser_mouse_move_xy`
- **System**: `browser_install`, `browser_resize`, `browser_press_key`, `browser_network_requests`, `browser_console_messages`

**Use for**: Web automation, testing, browser interaction, web scraping, form filling, and any web-based task automation

#### ripgrep MCP

**Tools Available**: Based on the ripgrep command-line tool

- Fast text-based regex search across files
- Respects gitignore rules
- Skips hidden/binary files by default
- Recursive directory searching

**Use for**: Fast text-based regex search when you need to find exact pattern matches across files, code searching, log analysis

#### sequential-thinking MCP

**Tools Available**:

- Dynamic problem breakdown into manageable steps
- LLM-driven tool recommendations with confidence scoring
- Step tracking and progress monitoring
- Memory management with configurable history limits
- Support for branching and revision of thoughts

**Use for**: Complex problem breakdown, planning, systematic problem-solving, tool coordination, and multi-step solution development

#### socket MCP

**Tools Available**: Based on the socket MCP server

- Network communication capabilities
- Real-time data exchange
- Socket-based service interaction

**Use for**: Network communication, real-time data exchange, or when you need to interact with socket-based services

### Repository-Wide Development Guidelines

#### Formatting

- **DO NOT use emojis**: use standard characters that do not cause syntax errors, erring on the side of caution so that no extra fixing steps are necessary.
- **Replace any emojis**: should you find any in a file, replace it with an equivalent if possible, remove if not.

#### ⋇ Before Any Development Task

1. **Check Project Scope**: Use .claude/references/VDL-VAULT-PROJECT-INDEX.md to identify target project(s)
2. **Review Architecture**: Consult .claude/architecture/VDL-VAULT-REPOSITORY-ARCHITECTURE.md for system context
3. **Follow Workflow**: Apply .claude/workflows/DEVELOPMENT-WORKFLOW.md for project type
4. **Apply Standards**: Use appropriate standards from .claude/standards/ directory

#### ⋇ Documentation Management

- **Repository Structure**: All project documentation remains in original project directories  
- **Claude References**: Use .claude/ directory for Claude Code integration guidance
- **Update Coordination**: When source documentation changes, consider updating corresponding .claude/ references
- **Cross-Project Links**: Maintain accurate cross-references between projects

#### ⊛ File Creation Guidelines

- **Project Context**: Always include appropriate file header stubs with timestamps (`Get-Date -Format "yyyy-MM-dd-HHmmss"`)
- **Minimal Creation**: Create files only when absolutely necessary for the goal
- **Edit First**: Prefer editing existing files over creating new ones
- **Documentation**: Only create documentation files when explicitly requested

#### ⇔ Cross-Project Coordination

- **Impact Assessment**: Consider effects on other repository projects
- **Dependency Mapping**: Check for cross-project dependencies before changes
- **Quality Consistency**: Maintain consistent quality standards across projects
- **Documentation Currency**: Keep related documentation synchronized

### Project-Specific Guidelines

#### Guidelines: For Phoenix Code Lite Development

- **Core Reference**: .claude/references/PHOENIX-CODE-LITE-INDEX.md for complete file context
- **API Changes**: Update .claude/references/PHOENIX-CODE-LITE-API.md for interface changes
- **TDD Process**: Follow .claude/standards/TDD-STANDARDS.md rigorously
- **CLI Responsiveness**: Maintain <200ms response times for CLI operations

#### Guidelines: For QMS Infrastructure Development  

- **Compliance First**: All changes must maintain regulatory compliance
- **Audit Requirements**: Comprehensive logging for all QMS operations
- **Standards Validation**: Test against EN 62304, AAMI TIR45 requirements
- **Documentation**: Create necessary compliance documentation

#### Guidelines: For Documentation Projects

- **User Context**: Apply .claude/standards/CONTEXT-AWARENESS.md principles
- **Accuracy**: Verify all technical information for correctness
- **Consistency**: Follow established documentation patterns across projects
- **Cross-References**: Maintain accurate links between related documents

### Important Development Reminders

- **Task Focus**: Do what has been asked; nothing more, nothing less
- **File Minimalism**: Create files only when absolutely necessary for the goal
- **Edit Preference**: Always prefer editing existing files over creating new ones
- **Documentation Restraint**: Only create documentation files when explicitly requested
- **Context Relevance**: Only respond to context when it's highly relevant to the current task

---

## ^ Quick Reference Card

### Essential @ References for Auto-Context

``` links
.claude/references/VDL-VAULT-PROJECT-INDEX.md     # Project navigation
.claude/workflows/DEVELOPMENT-WORKFLOW.md         # Development process
.claude/standards/TDD-STANDARDS.md                # Testing methodology
.claude/standards/CODE-STANDARDS.md               # TypeScript standards
.claude/architecture/VDL-VAULT-REPOSITORY-ARCHITECTURE.md  # System overview
```

### Project-Specific Quick Access

``` links
# Phoenix Code Lite
.claude/references/PHOENIX-CODE-LITE-INDEX.md     # Complete PCL codebase
.claude/references/PHOENIX-CODE-LITE-API.md       # PCL API reference
phoenix-code-lite/src/                             # PCL source code

# QMS Infrastructure  
Obsidian/QMS/                                      # QMS documentation
phoenix-code-lite/src/preparation/                 # QMS validators

# Documentation
docs/Phoenix-Core/                                 # Framework docs
.claude/standards/CONTEXT-AWARENESS.md            # User context principles
```

### Development Commands by Project

```bash
# Phoenix Code Lite
cd phoenix-code-lite && npm run build && npm test && npm run lint

# Repository-wide checks
find . -name "*.ts" -exec grep -l "pattern" {} \;

# Documentation validation  
# (Project-specific validation varies)
```
