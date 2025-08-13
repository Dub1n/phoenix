# VDL_Vault Repository - Project Navigation Index

> **Purpose**: Quick navigation guide for Claude Code development across all VDL_Vault projects  
> **Scope**: Repository-wide project locations, documentation, and development resources  
> **Updated**: 2025-08-12

## Quick Navigation by Project

### * Phoenix Code Lite (PCL)
**Primary TypeScript TDD Workflow Orchestrator**

#### Key Locations
- **Source Code**: `phoenix-code-lite/src/`
- **Tests**: `phoenix-code-lite/tests/`
- **Documentation**: `phoenix-code-lite/docs/`
- **Configuration**: `phoenix-code-lite/package.json`, `phoenix-code-lite/tsconfig.json`

#### Essential Documentation
- **[Codebase Index](./../references/PHOENIX-CODE-LITE-INDEX.md)** - Complete file-by-file documentation
- **[API Reference](./../references/PHOENIX-CODE-LITE-API.md)** - TypeScript interfaces and method signatures
- **[Architecture Diagram](./../architecture/PHOENIX-CODE-LITE-ARCHITECTURE.md)** - Visual system architecture

#### Development Commands
```bash
cd phoenix-code-lite
npm install          # Install dependencies
npm run build        # TypeScript compilation
npm test             # Jest test suite
npm run lint         # ESLint validation
npm start            # Start CLI application
```

#### Key Components for Development
- **CLI System**: `src/cli/` - Interactive CLI and commands
- **TDD Engine**: `src/tdd/` - TDD workflow orchestration
- **Core Infrastructure**: `src/core/` - Foundation, config, session management
- **QMS Preparation**: `src/preparation/` - Regulatory compliance validators
- **Configuration**: `src/config/` - Template and settings management

---

### 🏥 QMS Infrastructure
**Medical Device Software Compliance Framework**

#### Key Locations
- **Primary Integration**: Within Phoenix Code Lite (`phoenix-code-lite/src/preparation/`)
- **Documentation**: `Obsidian/QMS/`
- **Standards**: `Obsidian/QMS/Docs/AAMI/`, `Obsidian/QMS/Docs/EN 62304-2006+A1-2015/`
- **Process Documentation**: `Obsidian/QMS/Docs/SSI-SOP-*/`

#### Regulatory Standards Covered
- **EN 62304**: Medical device software lifecycle requirements
- **AAMI TIR45**: AGILE practices in medical device development
- **ISO Standards**: Quality management systems
- **QMS Processes**: Design controls, risk management, validation

#### QMS Components for Development
- **Compliance Validators**: `phoenix-code-lite/src/preparation/*-validator.ts`
- **Document Processors**: `phoenix-code-lite/src/preparation/regulatory-document-processor.ts`
- **Standards Analyzers**: `phoenix-code-lite/src/preparation/en62304-requirement-analyzer.ts`
- **Performance Validators**: `phoenix-code-lite/src/preparation/performance-baseline-validator.ts`

---

### 🔮 Haruspex
**Enhanced Analysis and Prediction System**

#### Key Locations
- **Documentation**: `Haruspex/docs/`
- **Architecture**: `Haruspex/docs/enhanced_noderr_architecture_design.md`
- **Analysis**: `Haruspex/docs/noderr_critical_analysis_and_solutions.md`

#### Current Status
- **Phase**: Early planning and architecture design
- **Integration**: Planned integration with noderr architecture verification
- **Purpose**: Enhanced analysis capabilities beyond current PCL scope

---

### 📚 Documentation Systems

#### Phoenix Core Documentation (`docs/Phoenix-Core/`)
**Comprehensive framework documentation and guides**

- **Framework Overview**: `docs/Phoenix-Core/01-Framework-Overview/`
- **Core Concepts**: `docs/Phoenix-Core/02-Core-Concepts/`
- **Implementation Guides**: `docs/Phoenix-Core/03-Implementation-Guides/`
- **Technical Reference**: `docs/Phoenix-Core/04-Technical-Reference/`
- **Examples & Templates**: `docs/Phoenix-Core/05-Examples-and-Templates/`
- **Development Roadmaps**: `docs/Phoenix-Core/06-Development/`, `docs/Phoenix-Core/07-Phoenix-Code-Lite-Dev/`
- **Maintenance & Changes**: `docs/Phoenix-Core/08-Maintenance/`

#### PCL Strategic Documentation (`PCL-Info/`)
**Strategic analysis and planning for PCL development**

- **Overview**: `PCL-Info/00-PCL-Overview/`
- **QMS Integration**: `PCL-Info/01-QMS-via-PCL.md`
- **Skins Proposal**: `PCL-Info/02-PCL-Skins-Proposal/`
- **CRUD Integration**: `PCL-Info/03-CRUD-via-PCL.md`
- **Current State**: `PCL-Info/05-Current-State.md`

#### QMS Documentation (`docs/PCL-QMS/`)
**QMS infrastructure technical documentation**

- **Roadmap**: `docs/PCL-QMS/QMS_Roadmap/`
- **Technical Notes**: `docs/PCL-QMS/QMS-Infrastructure-Technical-Notes.md`
- **Usage Guide**: `docs/PCL-QMS/QMS-Infrastructure-Usage-Guide.md`
- **Knowledge Transfer**: `docs/PCL-QMS/QMS-Knowledge-Transfer-Guide.md`

---

### ◦ Infrastructure & Tooling

#### Scripts (`scripts/`)
**Development automation and tooling**

- **Terminal Management**: `scripts/terminal-completer/`
- **Update Tools**: `scripts/update-phoenix/`
- **NoDeRR Audit**: `scripts/noderr-audit/`

#### NoDeRR (`noderr/`)
**Error analysis and architecture verification**

- **Architecture**: `noderr/noderr_architecture.md`
- **Project Analysis**: `noderr/noderr_project.md`
- **Audit System**: `noderr/audit/`
- **Specifications**: `noderr/specs/`
- **Prompts**: `noderr/prompts/`

---

## Development Context by Task Type

### TDD Development Tasks
**Primary Location**: Phoenix Code Lite

```bash
# Navigate to PCL for TDD work
cd phoenix-code-lite

# Key files for TDD development:
# - src/tdd/orchestrator.ts (main TDD controller)
# - src/tdd/phases/ (individual workflow phases)
# - src/tdd/quality-gates.ts (quality validation)
# - tests/integration/tdd-workflow.test.ts (integration tests)
```

**Essential Documentation**:
- [PCL Codebase Index](./../references/PHOENIX-CODE-LITE-INDEX.md)
- [TDD Standards](./../standards/TDD-STANDARDS.md)
- [Development Workflow](./../workflows/DEVELOPMENT-WORKFLOW.md)

### QMS Compliance Tasks
**Primary Locations**: PCL preparation/ + Obsidian/QMS/

```bash
# For QMS validator development
cd phoenix-code-lite/src/preparation

# For QMS documentation and standards
cd Obsidian/QMS/Docs

# Key validator files:
# - en62304-requirement-analyzer.ts
# - aami-tir45-requirement-analyzer.ts
# - compliance-criteria-validator.ts
# - regulatory-document-processor.ts
```

**Essential Documentation**:
- QMS Standards in `Obsidian/QMS/Docs/`
- QMS Roadmap in `docs/PCL-QMS/QMS_Roadmap/`
- Regulatory requirements documentation

### CLI Development Tasks
**Primary Location**: Phoenix Code Lite CLI system

```bash
cd phoenix-code-lite/src/cli

# Key CLI components:
# - session.ts (interactive session management)
# - commands.ts (core command implementations)
# - menu-system.ts (navigation and menus)
# - interactive/ (enhanced interactive components)
```

### Documentation Tasks
**Locations**: Varies by documentation type

```bash
# For Phoenix Core framework docs
cd docs/Phoenix-Core

# For PCL technical documentation
cd phoenix-code-lite/docs

# For QMS documentation
cd Obsidian/QMS

# For strategic analysis
cd PCL-Info
```

### Cross-Project Integration Tasks
**Multiple Locations**: Coordinate across projects

**Planning Approach**:
1. **Impact Assessment**: Review all affected projects
2. **Dependency Analysis**: Check cross-project dependencies
3. **Coordinated Implementation**: Plan sequenced changes
4. **Integration Testing**: Verify compatibility across projects

**Key Integration Points**:
- Shared TypeScript patterns and utilities
- Common configuration and template systems
- Cross-project documentation references
- Shared development and quality standards

---

## Quick Commands by Project

### Phoenix Code Lite Development
```bash
cd phoenix-code-lite
npm run build && npm test && npm run lint  # Full validation
npm run dev                                # Development mode
npm start                                  # CLI application
```

### Documentation Validation
```bash
# Check markdown links and formatting
# (Project-specific validation varies)
```

### Repository-Wide Checks
```bash
# Check for cross-project impacts
find . -name "*.ts" -exec grep -l "specific-pattern" {} \;
find . -name "*.md" -exec grep -l "cross-reference" {} \;
```

---

## Integration with Claude Code

### Claude Code Configuration Files
- **Repository Root**: `.claude/` (this directory structure)
- **Workflows**: `.claude/workflows/DEVELOPMENT-WORKFLOW.md`
- **Standards**: `.claude/standards/TDD-STANDARDS.md`
- **Architecture**: `.claude/architecture/`
- **References**: `.claude/references/` (this file and project indices)

### AI Development Patterns
- **PCL**: TDD workflow orchestration with comprehensive testing
- **QMS**: Compliance-first development with regulatory validation
- **Documentation**: Consistent documentation patterns across projects
- **Integration**: Cross-project coordination and impact assessment

---

**Navigation Tips**:
- Use this index to quickly locate project resources
- Follow project-specific development patterns
- Consult project documentation before making changes
- Consider cross-project impacts for all modifications
- Maintain consistency with established patterns and standards