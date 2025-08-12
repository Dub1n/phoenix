# Phoenix Code Lite - Claude Code Integration Guide

This file provides specific guidance for Claude Code development within the Phoenix Code Lite codebase.

## 📚 Essential Documentation References

**Start Here - Complete System Understanding**:
- **[Codebase Index](docs/index/CODEBASE-INDEX.md)** - Comprehensive file-by-file documentation with dependencies, purposes, and relationships
- **[Architecture Diagram](docs/index/ARCHITECTURE-DIAGRAM.md)** - Visual system architecture using Mermaid diagrams following C4 model
- **[API Reference](docs/index/API-REFERENCE.md)** - Detailed TypeScript interfaces, method signatures, and usage examples
- **[API Integration Plan](docs/API-INTEGRATION-PLAN.md)** - Documentation integration strategy and maintenance plan

## 🚀 Optimized Claude Code Development Workflow

### Pre-Development Analysis
1. **Read Codebase Index First**: Always consult `docs/CODEBASE-INDEX.md` to understand:
   - File purposes and responsibilities
   - Dependency relationships and references  
   - Integration points and architectural patterns
   
2. **Consult Architecture Diagrams**: Review `docs/ARCHITECTURE-DIAGRAM.md` for:
   - System flow and data movement
   - Component interaction patterns
   - Layer separation and boundaries

3. **Quick Navigation**: Use `docs/STRUCTURE-MAP.md` for rapid file location

### Development Best Practices

#### File Relationship Awareness
- **Before editing**: Check "Referenced by" and "References" sections in Codebase Index
- **Impact analysis**: Use the dependency matrix to understand change impact
- **Testing strategy**: Reference the functional groups to identify related test files

#### Architecture Compliance
- **Layer boundaries**: Follow the established architecture layers shown in diagrams
- **Data flow**: Respect the documented data flow patterns
- **Component isolation**: Maintain separation between CLI, Core, TDD, and QMS systems

#### Type Safety & Validation
```typescript
// Always use existing Zod schemas from types/
import { WorkflowStateSchema } from './types/workflow.ts';

// Follow established patterns for error handling
import { ErrorHandler } from './core/error-handler.ts';

// Leverage existing audit logging
import { AuditLogger } from './utils/audit-logger.ts';
```

## 🏗️ System Architecture Quick Reference

### Entry Points
- `src/index.ts` - Main CLI entry with session management
- `src/index-di.ts` - Dependency injection entry for testing

### Core Foundation (Always Preserve)
- `src/core/foundation.ts` - System initialization and health monitoring
- `src/core/config-manager.ts` - Configuration with hot reloading
- `src/core/session-manager.ts` - Session lifecycle with metrics
- `src/core/error-handler.ts` - Centralized error handling

### CLI System Architecture
- `src/cli/session.ts` - Interactive session management
- `src/cli/commands.ts` - Core command implementations
- `src/cli/menu-system.ts` - Navigation and menu handling
- `src/cli/interaction-manager.ts` - Mode switching logic

### TDD Workflow Engine
- `src/tdd/orchestrator.ts` - Main workflow controller
- `src/tdd/quality-gates.ts` - Quality validation system
- `src/tdd/phases/` - Individual workflow phases

### QMS Preparation System
- `src/preparation/` - All QMS compliance validators
- Regulatory standards integration (EN 62304, AAMI TIR45)

## ⚡ Development Efficiency Tips

### Rapid Context Building
1. **File Purpose**: Check Codebase Index "Purpose" field for instant context
2. **Dependencies**: Review "References" and "Referenced by" for impact analysis
3. **Architecture Layer**: Use the functional groups to understand system boundaries

### Change Impact Analysis
1. **Dependency Tree**: Follow reference chains in the Codebase Index
2. **Data Flow**: Trace through Architecture Diagram data flows
3. **Testing Strategy**: Use functional groups to identify related test files

### Common Development Patterns

#### Adding New Features
1. Check existing patterns in similar components (use Codebase Index)
2. Follow architecture layer boundaries (reference Architecture Diagram)
3. Implement proper error handling and audit logging
4. Add comprehensive tests following existing patterns

#### Debugging Issues
1. Use the dependency matrix to trace issue sources
2. Follow data flow diagrams to understand state changes
3. Leverage existing audit logging for investigation

#### Code Quality Maintenance
1. Follow established patterns documented in Codebase Index
2. Maintain type safety with existing Zod schemas
3. Use quality gates system for validation
4. Preserve separation of concerns shown in architecture

## 📋 Development Commands (From Package.json)

```bash
# Development workflow
npm run build         # TypeScript compilation
npm run dev          # Development mode with ts-node
npm test             # Jest test suite with coverage
npm run lint         # ESLint validation
npm start            # Start CLI application

# Advanced development
npm run test:watch   # Watch mode for testing
npm run build:clean  # Clean build directory
```

## 🎯 Focus Areas for Development

### Current Priorities
1. **QMS Infrastructure**: Building medical device compliance system
2. **Phoenix Code Lite Integration**: Preserving existing functionality
3. **Documentation Systems**: Maintaining and extending documentation

### Architectural Principles
- **Preserve Core**: All existing Phoenix Code Lite functionality must remain intact
- **Extend Systematically**: New QMS features follow established patterns
- **Maintain Quality**: Use existing quality gates and validation systems
- **Document Changes**: Update documentation indices when making significant changes

## 🔍 Quick Reference - Key Files by Function

### Configuration & Settings
- `src/config/settings.ts` - Main configuration schema
- `src/config/templates.ts` - Configuration templates
- `src/core/config-manager.ts` - Configuration management with validation

### Error Handling & Logging  
- `src/core/error-handler.ts` - Centralized error processing
- `src/utils/audit-logger.ts` - Security audit logging
- `src/utils/test-utils.ts` - Safe process management

### Testing Infrastructure
- `tests/integration/` - Integration test suites
- `tests/unit/` - Unit test organization
- `src/testing/` - Testing utilities and mocks

### Type Definitions
- `src/types/workflow.ts` - Workflow and session schemas
- `src/types/interaction-modes.ts` - CLI interaction patterns
- `src/types/document-management.ts` - QMS document types

---

**Remember**: Always consult the documentation indices before making changes. They contain the complete system knowledge and will help you develop more efficiently while maintaining architectural integrity.