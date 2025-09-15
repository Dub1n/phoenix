# CLAUDE.md

[!] **NEVER EVER UNDER ANY CIRCUMSTANCES WRITE EMOJIS IN ANY CAPACITY**

Response style for all responses:
@.claude/claude-guides/Critical-Collaborator.md

Frontmatter for every file except schema files:
@.claude/claude-guides/frontmatter-schema.json
Commenting conventions for every implementation: TypeScript: /**...*/; JavaScript: /*...*/; Python: '''...'''; Markdown: no comments needed; Other: use the standard for that format
If editing a file that doesn't contain this frontmatter in this format, add it/update the existing frontmatter

Status Legend:
[ ] pending
[~] in-progress
[x] complete (**WORKING**)
[n] sequence-order
[-] cancelled
[!] priority
[>] forwarded
[<] scheduled
[?] blocked
[B] implemented-broken
[T] implemented-testing
[F] failure

## Repository Overview

### Multi-Project Development Ecosystem

The VDL_Vault repository is a comprehensive ecosystem for medical device software development, QMS infrastructure, and related tooling. It consists of multiple interconnected projects that work together to provide a complete development and compliance framework.

### Active Projects

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

#### Active Project: Haruspex [NEEDS UPDATING]

- **Purpose**: Enhanced analysis and prediction capabilities  
- **Location**: `Haruspex/`
- **Status**: Early planning/architecture phase

#### Active Project: Templum

Universal Interface Connecter and  Orchestrator

Provides multiple interfaces, connects to any backend service, coordinates multiple connections

[NEEDS COMPLETING]

## Key Guidelines for Claude Code

### MCP Tool Usage

#### sequential-thinking MCP

**Tools Available**:

- Dynamic problem breakdown into manageable steps
- LLM-driven tool recommendations with confidence scoring
- Step tracking and progress monitoring
- Memory management with configurable history limits
- Support for branching and revision of thoughts

**Use for**: Complex problem breakdown, planning, systematic problem-solving, tool coordination, and multi-step solution development

### Repository-Wide Development Guidelines

#### Formatting **NEVER EVER UNDER ANY CIRCUMSTANCES WRITE EMOJIS IN ANY CAPACITY**

- **DO NOT USE EMOJIS**: use standard characters that do not cause syntax errors, erring on the side of caution so that no extra fixing steps are necessary.
- **Replace any emojis**: should you find any in a file, remove it.

#### Before Any Development Task

1. **Check Project Scope**
2. **Review Architecture**
3. **Follow Workflow**
4. **Apply Standards**

#### Documentation Management

- **Repository Structure**: All project documentation remains in original project directories  
- **Update References**
- **Project Context**: Always include the yaml frontmatter with the appropriate fields
- **Documentation**: Only create documentation files when requested/standard procedure for the given task

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
