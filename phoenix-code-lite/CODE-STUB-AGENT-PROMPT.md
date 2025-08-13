# Phoenix Code Lite - Code Stub Implementation Agent Prompt

**Created:** 2025-01-12-152200  
**Purpose:** Systematic agent prompt for implementing standardized code stubs across the Phoenix Code Lite codebase  
**Project:** Phoenix Code Lite - Noderr Integration Enhancement  

---

## AGENT MISSION STATEMENT

You are tasked with systematically updating the Phoenix Code Lite codebase to implement standardized code stubs across all TypeScript, JavaScript, and Markdown files. This is a critical infrastructure enhancement that will improve code documentation, searchability, and maintainability for the Noderr project management system.

---

## CORE INSTRUCTIONS

### Primary Objective

Implement consistent, accurate, and informative code stubs using the established template format from `src/index.ts` across all identified files in the `CODE-STUB-INVENTORY.md`.

### Success Criteria

- ✓ Every file has a properly formatted code stub
- ✓ Stubs accurately reflect each file's purpose and functionality  
- ✓ Template format consistency maintained across all files
- ✓ Existing code functionality preserved without modification
- ✓ Noderr specification alignment where applicable

---

## EXECUTION STRATEGY

### Phase-Based Implementation

Execute in the priority order defined in `CODE-STUB-INVENTORY.md`:

1. **Phase 1 (HIGH PRIORITY):** Core Infrastructure, CLI System, TDD Engine, Type Definitions
2. **Phase 2 (MEDIUM PRIORITY):** Configuration System, Claude Integration, Utilities, Testing
3. **Phase 3 (LOW PRIORITY):** QMS/Preparation System, Documentation, Security

### File-by-File Process

For each file, follow this systematic approach:

1. **Read and Analyze**: Read the entire file to understand its purpose, exports, and dependencies
2. **Identify Category**: Determine the appropriate template category from the inventory
3. **Extract Information**: Identify key components (provides, requires, functionality)
4. **Consult Specifications**: Reference relevant `/noderr/specs/` files for detailed understanding
5. **Generate Stub**: Create accurate stub using the appropriate template
6. **Implementation**: Add stub at the top of the file, preserving all existing code
7. **Validate**: Ensure stub accuracy and template compliance

---

## TEMPLATE IMPLEMENTATION GUIDE

### Standard Template Format

```typescript
/**---
 * title: [Descriptive Title - Module/Component Name]
 * tags: [Functional-Tag, Category-Tag, Framework-Tag, Purpose-Tag]
 * provides: [Primary-Capability, Secondary-Capability, Interface-Export, Type-Export]
 * requires: [Dependency-Module, Required-Service, Framework-Requirement]
 * description: [Clear description of what this module does, its role in the system, and key responsibilities]
 * ---*/
```

### Template Selection Rules

**Core Infrastructure Files** → Use "Core Infrastructure Component" template

- Files in `/core/` directory
- Entry points (`index.ts`, `index-di.ts`, etc.)
- Foundation services

**CLI System Files** → Use "CLI Interface Module" template

- Files in `/cli/` directory and subdirectories
- User interaction components
- Command processing modules

**Service Modules** → Use "Core Service Module" template

- Business logic processors
- Data management services
- Integration services

**Utility Files** → Use "Utility Functions Module" template

- Files in `/utils/` directory
- Helper functions and tools
- Support libraries

**Type Definition Files** → Use "Type Definitions Module" template

- Files in `/types/` directory
- Interface and schema definitions
- Validation rules

**Testing Files** → Use "Test Suite Module" template

- Files in `/testing/` directory
- Mock objects and test utilities
- Validation functions

### Tag Selection Guidelines

**Functional Tags**: Core, CLI, TDD, Configuration, Testing, Security, QMS, Documentation
**Category Tags**: Infrastructure, Service, Utility, Interface, Validation, Integration, Command
**Framework Tags**: TypeScript, Node.js, Jest, Zod, Commander, Inquirer
**Purpose Tags**: Entry-Point, Session-Management, User-Interaction, Data-Processing, Quality-Assurance

---

## NODERR INTEGRATION REQUIREMENTS

### Reference Materials

Before implementing stubs, consult these Noderr specification files for accurate understanding:

- `/noderr/specs/CORE_Foundation.md` - For core infrastructure files
- `/noderr/specs/CLI_*.md` - For CLI-related files  
- `/noderr/specs/TDD_*.md` - For TDD workflow files
- `/noderr/specs/TYPE_*.md` - For type definition files
- `/noderr/noderr_project.md` - For overall project context

### Alignment Strategy

- **Title**: Should align with Noderr specification naming conventions
- **Tags**: Include relevant Noderr architectural categories
- **Provides**: List capabilities as defined in Noderr specs
- **Requires**: Reference dependencies mentioned in Noderr architecture
- **Description**: Incorporate purpose statements from Noderr specifications

---

## QUALITY STANDARDS

### Accuracy Requirements

- **100% File Coverage**: Every file in the inventory must receive a stub
- **Specification Alignment**: Stubs must accurately reflect Noderr specifications
- **Template Compliance**: Every stub must follow the exact template format
- **Context Awareness**: Stubs must reflect each file's role in the larger system

### Content Quality Standards

- **Precise Titles**: Clear, descriptive titles that immediately convey purpose
- **Relevant Tags**: 3-4 tags that accurately categorize the module's function
- **Comprehensive Provides**: List all major exports and capabilities
- **Accurate Requires**: Identify all significant dependencies
- **Clear Descriptions**: 1-2 sentences explaining purpose and system role

### Technical Requirements  
- **Preserve Functionality**: Never modify existing code logic or imports
- **Maintain Formatting**: Preserve existing code style and formatting
- **Comment Standards**: Use exact `/**---` and `---*/` delimiters
- **Timestamp Integration**: Include creation timestamp where appropriate

#### Team Preferences Update (2025-08-12)
- Prefer omitting inline "Created ..." timestamps inside stub descriptions. Track timing in change docs instead (see `docs/Phoenix-Core/08-Maintenance/Changes/`).

---

## ERROR HANDLING AND VALIDATION

### Pre-Implementation Validation

Before starting each file:

- ✓ Verify file exists and is readable
- ✓ Confirm no existing stub (if exists, update rather than replace)
- ✓ Identify file type and select appropriate template
- ✓ Locate relevant Noderr specification if available

### Post-Implementation Validation

After implementing each stub:

- ✓ Verify template format compliance
- ✓ Confirm no syntax errors introduced
- ✓ Validate stub content accuracy
- ✓ Check preservation of existing functionality

### Error Recovery

If errors occur:

- **Syntax Issues**: Fix immediately and revalidate
- **Template Violations**: Correct format and reapply
- **Content Inaccuracies**: Research specifications and update
- **Functionality Breaks**: Restore original file and retry

---

## IMPLEMENTATION EXAMPLES

### Example 1: Core Infrastructure File

```typescript
/**---
 * title: [Core Foundation - Phase 1 Infrastructure Manager]
 * tags: [Core, Infrastructure, Session-Management, System-Initialization]
 * provides: [CoreFoundation Class, System Health Monitoring, Service Coordination, Lifecycle Management]
 * requires: [SessionManager, ModeManager, AuditLogger, Configuration System]
 * description: [Provides foundational infrastructure for Phoenix Code Lite system initialization, health monitoring, and core service coordination across all application phases]
 * ---*/
```

### Example 2: CLI Interface File

```typescript
/**---
 * title: [Interactive Session Manager - CLI Session Orchestrator]
 * tags: [CLI, Interface, Session-Management, User-Interaction]
 * provides: [Session Lifecycle, Interactive Menus, Command Processing, Context Management]
 * requires: [InteractionManager, CLI Framework, Core Foundation]
 * description: [Manages persistent CLI sessions with menu navigation, command processing, and context-aware user interactions for both interactive and command-line modes]
 * ---*/
```

### Example 3: Utility Module

```typescript
/**---
 * title: [Display Utilities - Terminal Output Formatting Tools]
 * tags: [Utility, Display, Terminal, Formatting]
 * provides: [Output Formatting, Color Management, Terminal Utilities, Display Helpers]
 * requires: [Chalk, Terminal Framework]
 * description: [Provides comprehensive terminal output formatting utilities including color management, layout assistance, and display helper functions for CLI interfaces]
 * ---*/
```

---

## COMPLETION REPORTING

### Progress Tracking

For every file updated, provide:

- ✓ File path
- ✓ Stub category used
- ✓ Key capabilities identified
- ✓ Any issues encountered
- ✓ Validation status

### Current Progress Snapshot (as of 2025-08-12)

- **Phase 1 – Core Infrastructure (Completed):**
  - `src/index-di.ts`, `src/index-unified.ts`
  - `src/core/foundation.ts`, `src/core/config-manager.ts`, `src/core/error-handler.ts`, `src/core/session-manager.ts`, `src/core/mode-manager.ts`, `src/core/command-registry.ts`, `src/core/menu-registry.ts`, `src/core/unified-session-manager.ts`, `src/core/user-settings-manager.ts`, `src/core/index.ts`
- **Phase 1 – CLI System (In Progress):**
  - Completed (Core): `src/cli/args.ts`, `src/cli/commands.ts`, `src/cli/session.ts`, `src/cli/interaction-manager.ts`, `src/cli/enhanced-commands.ts`, `src/cli/menu-system.ts`, `src/cli/interactive/interactive-session.ts`
  - Completed (Advanced): `src/cli/advanced-cli.ts`, `src/cli/progress-tracker.ts`, `src/cli/project-discovery.ts`, `src/cli/help-system.ts`, `src/cli/document-configuration-editor.ts`, `src/cli/config-formatter.ts`
  - Completed (Menu System): `src/cli/menu-layout-manager.ts`, `src/cli/menu-composer.ts`, `src/cli/menu-content-converter.ts`, `src/cli/skin-menu-renderer.ts`, `src/cli/unified-layout-engine.ts`, `src/cli/layout-system-validation.ts`, `src/cli/static-menu-demo.ts`
  - Remaining (Advanced): `src/cli/enhanced-wizard.ts`, `src/cli/interactive.ts`
  - Remaining (Architecture): `src/cli/factories/command-factory.ts`, `src/cli/adapters/claude-client-adapter.ts`, `src/cli/adapters/config-manager-adapter.ts`, `src/cli/adapters/audit-logger-adapter.ts`
  - Completed (Interfaces): `src/cli/interfaces/config-manager.ts`, `src/cli/interfaces/audit-logger.ts`, `src/cli/interfaces/claude-client.ts`, `src/cli/interfaces/file-system.ts`
  - Remaining (Examples): `src/cli/menu-migration-example.ts`
- **Phase 1 – TDD Engine (Completed):**
  - `src/tdd/orchestrator.ts`, `src/tdd/quality-gates.ts`, `src/tdd/codebase-scanner.ts`, `src/tdd/phases/plan-test.ts`, `src/tdd/phases/implement-fix.ts`, `src/tdd/phases/refactor-document.ts`
- **Phase 1 – Type Definitions (Completed):**
  - `src/types/menu-definitions.ts`, `src/types/command-execution.ts`, `src/types/interaction-abstraction.ts`, `src/types/document-management.ts`, `src/types/interaction-modes.ts`, `src/types/workflow.ts`, `src/types/agents.ts`

- Build/Validation: Latest changes compile successfully (no syntax errors).
- Change Log: See `docs/Phoenix-Core/08-Maintenance/Changes/2025-08-12-173350-code-stub-headers-phase1.md`.

### Final Deliverables

Upon completion, provide:

1. **Summary Report**: Total files updated, categories covered, issues resolved
2. **Quality Metrics**: Template compliance rate, accuracy validation results
3. **Issue Log**: Any files that required special handling or had complications
4. **Recommendations**: Suggestions for future maintenance and improvements

---

## EXECUTION COMMAND

**Begin systematic implementation using this strategy:**

"Read through the CODE-STUB-INVENTORY.md file systematically. For each file listed, implement or update the code stub using the appropriate template from the inventory. Follow the phase-based priority order (HIGH → MEDIUM → LOW). Ensure 100% template compliance and accuracy. Reference Noderr specifications where available. Preserve all existing functionality. Report progress and issues as you work through each file."

### Next Targets for the Next Developer
- Phase 1 – CLI Advanced: `src/cli/enhanced-wizard.ts`, `src/cli/interactive.ts`
- Phase 1 – CLI Architecture: `src/cli/factories/command-factory.ts`, `src/cli/adapters/claude-client-adapter.ts`, `src/cli/adapters/config-manager-adapter.ts`, `src/cli/adapters/audit-logger-adapter.ts`
- Phase 1 – CLI Examples: `src/cli/menu-migration-example.ts`
- Re-run build and spot-check a few files after each logical batch

---

## SUCCESS VALIDATION

The implementation is considered successful when:

- ✓ All 97 files have appropriate code stubs implemented
- ✓ All stubs follow the exact template format established
- ✓ Stub content accurately reflects each file's purpose and capabilities
- ✓ No existing functionality has been altered or broken
- ✓ Noderr specification alignment achieved where applicable
- ✓ Quality standards met across all implementations

---

**Agent: Begin implementation systematically, following the priority order and quality standards defined above. Ensure thorough, accurate, and consistent execution across all files.**
