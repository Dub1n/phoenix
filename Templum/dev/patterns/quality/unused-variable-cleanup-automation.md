---
date-created: 2025-09-11-0000
last-updated: 2025-09-11-0000
name: unused-variable-cleanup-automation
description: Automated script that intelligently distinguishes between unused imports and variables for ESLint cleanup
status: established
category: quality
use-when:
  - Large codebases accumulate unused variables causing ESLint errors
  - TypeScript compilation failures from incorrectly handled imports
  - Manual cleanup is time-consuming and error-prone
  - Need to reduce ESLint warnings while maintaining compilation
keywords:
  - eslint
  - typescript
  - automation
  - unused-variables
  - imports
  - code-quality
  - compilation
prerequisites:
  - eslint-configuration
  - typescript-setup
related-patterns:
  - automated-code-quality
  - build-integration
  - ci-cd-gates
---

<!-- TODO: [TASK-PATTERN-001] Pattern: frontmatter-standardization | Complexity: 2 | Dependencies: template-system
Context: Updated YAML frontmatter following standardized template format with kebab-case fields
Validation-Required: yaml-syntax, field-completeness, pattern-searchability
Pattern-Info: { approach: "template-substitution", alternatives: "manual-update", trade-offs: "standardization-vs-flexibility" } -->

### Unused Variable Cleanup Automation Pattern

#### Unused Variable Cleanup Automation Pattern: Pattern Overview

**Status**: NEW | **Category**: Quality | **Difficulty**: 🟡 | **Time**: ~2-3 hours

**Problem**: Large codebases accumulate unused variables that cause ESLint errors and can lead to TypeScript compilation failures when imports are incorrectly handled. Manual cleanup is time-consuming and error-prone, especially with hundreds of errors across multiple files.

**Solution**: Automated script that intelligently distinguishes between unused imports (which should be removed entirely) and other unused variables (which should be prefixed with underscore) to maintain TypeScript compilation while reducing ESLint warnings.

#### Unused Variable Cleanup Automation Pattern: Implementation Steps

**Step 1**: Core Implementation

**Script Architecture**:

```javascript
// Enhanced unused variable fix script structure
function getUnusedVariables(filePath) { /* ESLint integration */ }
function isImportStatement(line, variable) { /* Import detection */ }
function removeUnusedImport(line, variable) { /* Import removal */ }
function fixUnusedVariables(filePath, unusedVars) { /* Main logic */ }
```

**Key Logic Patterns**:

1. **Import Detection**: `importRegex = /^\s*import\s+/` to identify import statements
2. **Import Removal**: Handle named, default, and namespace imports differently
3. **Variable Prefixing**: Apply underscore prefix to function parameters, local variables, catch blocks
4. **Compilation Verification**: Include TypeScript compilation check in validation

**Import Pattern Handling**:

- **Named imports**: `import { var1, var2 } from 'module'` → Remove unused from list
- **Default imports**: `import variable from 'module'` → Remove entire line if unused
- **Namespace imports**: `import * as variable from 'module'` → Remove entire line if unused

**Step 2**: Foundation

1. **Script Enhancement** (~1 hour):
   - Add `isImportStatement()` and `removeUnusedImport()` functions
   - Enhance main logic to handle imports separately from other variables
   - Add compilation verification to script output

2. **Import Prefix Correction** (~1 hour):
   - Create correction script to fix existing incorrect prefixes
   - Run on affected files to restore correct import names
   - Verify TypeScript compilation success

3. **Validation & Testing** (~30-60 minutes):
   - Run enhanced script on target file sets
   - Verify compilation passes with TypeScript `--noEmit`
   - Confirm ESLint error reduction without regression

**Step 3**: Key Success Patterns

**Critical Decision Points**:

- **Import vs Variable**: Always remove unused imports entirely, never prefix them
- **Compilation Safety**: Include TypeScript compilation check in script workflow
- **Incremental Approach**: Test script changes on small file sets before full codebase

**Error Prevention**:

- Never apply underscore prefix to import statements
- Verify imports match exported names exactly
- Test compilation after any automated changes

**Step 4**: Integration Points

**Tool Integration**:

- ESLint JSON output parsing for unused variable detection
- TypeScript compiler for validation
- File system operations for batch processing

**Project Integration**:

- Can be used across TypeScript/JavaScript projects with ESLint
- Integrates with existing build/CI pipelines
- Supports different module systems (CommonJS, ES modules)

#### Unused Variable Cleanup Automation Pattern: Implementation Feedback

- **[2025-09-03] - [TASK-ESLINT-003,004,005]**: Successfully restored TypeScript compilation by enhancing unused variable cleanup script with proper import handling. Fixed 87 TypeScript errors caused by incorrect import prefixes. Achieved 56% reduction in unused variables (356 → 157 errors). Critical discovery: imports must be removed entirely, not prefixed. Script enhancements included import detection, removal logic, and compilation verification. Actual time: 8h vs est. 6h due to import prefix correction needs. Pattern now robust for complex codebases with extensive import/export relationships.

- **[2025-09-03] - [TASK-ESLINT-003]**: Applied to interfaces directory with excellent results. Automated script handled 23/36 cases (64% automation rate), manual fixes completed remaining 13 cases. Two-phase approach (automated + manual) provided comprehensive coverage without TypeScript compilation issues. Pattern's import vs parameter distinction worked perfectly - no false removals. Used import aliases for ESLint false positives. Actual time: 1.5h vs est. 2-3h. Pattern ready for similar interface cleanup tasks. Key insight: Pattern scales well for focused directory scopes with mixed import/parameter scenarios.

- **[2025-09-04] - [TASK-ESLINT-005]**: Manual cleanup of final 6 unused variables using underscore prefix pattern. Fixed edge cases in extension.ts (errorMessage, treeView, disposable), cli-entry.ts (spawn), universal-menu-registry.ts (backendId), and pcl-menu-registry.ts (menuId). Pattern worked perfectly for all variable types including destructured parameters, loop variables, and error handlers. Completed 100% elimination of unused variables (6 → 0 errors). Time taken: 1.5 hours for manual review and validation. Demonstrated pattern effectiveness for finishing automated cleanup work.

#### Unused Variable Cleanup Automation Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-ESLINT-003,004,005] ✅ COMPLETED (2025-09-03)
**Successfully Applied**: Code Quality / Compilation Restoration (2025-09-03)
**Projected Usage**: Large TypeScript codebases with ESLint, automated code quality improvements, CI/CD integration
**Files Using This Pattern**: scripts/fix-unused-vars.js, scripts/fix-import-prefixes.js
**Integration Points**: ESLint configuration, TypeScript compiler, build processes, code quality gates
