# Quick Fix Guide - Low Complexity Issue Resolution

> **Purpose**: Standalone guide for simple, quick fixes  
> **Scope**: Low complexity issues (compilation errors, simple missing implementations)  
> **Target Time**: <3 hours completion  
> **Template**: Streamlined Quick Fix documentation only

## ⚡ When to Use This Guide

**Use this guide for issues with**:

- Clear error messages with obvious solutions
- Single component or <5 files affected  
- No architectural changes required
- Complexity score 3-5 points (see `shared-components.md` for scoring)

**Typical Quick Fix scenarios**:

- TypeScript compilation errors
- Missing import/export statements
- Simple type definition mismatches  
- Straightforward mock-to-real transitions

## 🎯 Autonomous Quick Fix Workflow

### Step 1: Locate Issue (if not specified)

**Priority Task Sources**:

1. **Check Fix Planning Queue**: Look for `*-fix-planning.md` in project `/dev/` folder
   - Immediate Priority Queue (ready-to-implement tasks)
   - Verification Queue (validation tasks suitable for quick fixes)
2. **Fallback to Tracker Data**: Look for `*-tracker-data.md` or legacy tracker files
3. **Common locations**: `/dev/` folder (preferred), project root, `/docs/`

**Select quick fix candidate from planning queue**:

- Items marked with Low complexity scores (0-7 points)  
- Verification tasks needing simple validation
- Small investigation items with clear scope

**Fallback selection from tracker**:

- 🔴 **Broken** components with <10 compilation errors
- Clear error messages with specific file locations
- Components marked as ready for simple fixes

### Step 2: Validate Quick Fix Suitability

**Quick Checklist**:

- [ ] Error count: <10 compilation errors
- [ ] Clear error messages: TypeScript/build errors with specific locations
- [ ] File scope: ≤5 files need modification
- [ ] No dependencies: Fix doesn't require other components
- [ ] Time estimate: <3 hours based on error clarity

**If any criteria fail**: Escalate to `comprehensive-fix-guide.md`

### Step 3: Implement Fix

1. **Read component files** - Understand the specific errors
2. **Apply direct fix** - Resolve compilation/import issues
3. **Verify immediately** - Test compilation and basic functionality
4. **No complex investigation** - If root cause unclear, escalate

### Step 4: Validation

**Required validation**:

```bash
# TypeScript compilation
npx tsc --noEmit

# Basic functionality test
npm test <component-name> # if component tests exist

# Quick integration check
npm run build # if build exists
```

### Step 5: Document and Update Files

1. **Create Fix Document** using Quick Fix template (below)
2. **Update Tracker Status** in `project/dev/*-tracker-data.md`
3. **Update Planning Queue** in `project/dev/*-fix-planning.md`:
   - Mark task as completed (check off item)
   - Remove from appropriate queue
   - Add any new discoveries to investigation queue

## ⚡ Quick Fix Documentation Template

**Create file**: `dev/fixes/YYYY-MM-DD-HHMMSS-quick-fix-description.md`

```markdown
# Quick Fix: {Issue Description}

## Fix Summary
- **Date**: {Use: `powershell "Get-Date -Format 'yyyy-MM-dd-HHmmss'"` or `date`}
- **Component**: {Component name and location}
- **Fix Type**: Compilation Error | Missing Implementation | Type Error | Import Fix
- **Tracker**: {Implementation Tracker file name}

## Issue Details
**Original Problem**: {Copy from Implementation Tracker}
**Error Messages**: {Specific compilation/build errors}

## Root Cause
{1-2 sentence explanation of underlying issue}

## Fix Applied
{Concise description of what was changed}

### Files Modified
- `{path/to/file.ts}` - {Brief description of fix}

## Verification Results
- [ ] TypeScript Compilation: ✓/✗ 
- [ ] Component Tests: ✓/✗ ({X} tests passed)
- [ ] Build Success: ✓/✗
- [ ] No New Errors: ✓/✗

## Tracker Update
**Component Status Change**:
- Before: {Status with error count}  
- After: {Status with verification}

**Build Issues Log Entry**: Added {date} - {Component} quick fix completed

---
**Generated**: {timestamp}  
**Fix Duration**: {Actual time spent}
**Template**: Quick Fix
```

## 🔄 Implementation Tracker Integration

**Update these tracker sections**:

1. **Component Status Table**: Change from 🔴 Broken to 🟢 Working
2. **Build Issues Log**: Add entry with date and fix summary
3. **Component Summary**: Update broken/working counts

**Status transition format**:

``` log
Before: "Component Name - STATUS: 🔴 Broken (X compilation errors)"
After:  "Component Name - STATUS: 🟢 Working (0 compilation errors, verified)"
```

## ❌ When to Escalate

**Escalate to comprehensive-fix-guide.md if**:

- Fix takes >30 minutes to understand
- Requires changes to >5 files
- Discovers additional broken components  
- Needs architectural changes
- Uncovers security issues

**Escalation process**:

1. Document investigation findings in tracker
2. Note escalation reason
3. Switch to `comprehensive-fix-guide.md`

## 📊 Quick Reference Links

**For detailed scoring**: See `shared-components.md`
**For complex fixes**: Use `comprehensive-fix-guide.md`  
**For tracker structure**: See `tracker-template.md`

**Validation scripts** (placeholder):

```bash
node scripts/validation/validate-component.js <component-name>
node scripts/validation/verify-fix.js <component-name>
```

## ✅ Success Criteria

**A successful quick fix**:

- Resolves all identified compilation errors
- Takes <3 hours total time
- Requires no architectural changes
- Introduces no new errors or regressions
- Updates tracker status accurately

**Quality standards**:

- Clean TypeScript compilation
- Basic functionality verified
- Tracker integration complete
- Documentation follows template

---
**Template Type**: Quick Fix Guide  
**Context**: Minimal for fast execution  
**Integration**: Standalone with optional tracker integration
