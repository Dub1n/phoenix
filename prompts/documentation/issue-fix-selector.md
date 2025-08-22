# Issue Fix Selector - Autonomous Issue Resolution Router

> **Purpose**: Intelligent router for autonomous issue selection and fix guide routing  
> **Entry Point**: Use this for fully autonomous fix workflows  
> **Bypass Option**: Users can skip this and use fix guides directly  
> **Context**: Minimal - focuses only on selection and routing logic

## ⚡ Quick Start - Autonomous Fix Workflow

**If given this selector without specific instructions**, follow this autonomous workflow:

### Step 1: Locate Project Files

**Priority Search Order**:

1. **Find Fix Planning Queue**: Look for `*-fix-planning.md` in project `/dev/` folder
2. **Find Tracker Data**: Look for `*-tracker-data.md` in project `/dev/` folder  
3. **Fallback**: Look for legacy `*Implementation-Tracker.md` files
4. **Common locations**: `/dev/` folder (preferred), project root, `/docs/` folder

**File Validation**:

- **Planning file**: Must contain task queues (Immediate Priority, Investigation, Verification)
- **Tracker file**: Must contain component status and evidence data
- **Integration**: Both files should cross-reference each other

### Step 2: Select from Planning Queues

**Primary Selection** (if planning file exists):

1. **Immediate Priority Queue**: Ready-to-implement tasks with clear next actions
2. **Investigation Queue**: Tasks requiring analysis before implementation
3. **Verification Queue**: Items needing validation or testing
4. **Architecture Queue**: System-level design tasks

**Fallback Selection** (if no planning file):

- 🔴 **Broken** components with specific error counts
- 🔴 **Critical Missing Components** with implementation gaps  
- 🟡 **Mock-Dependent** components ready for real implementation
- Build errors with clear compilation failure counts

**Avoid These Issues**:

- Tasks without clear next actions or requirements
- Issues requiring architectural decisions without design context
- Components with complex dependency chains blocking implementation

### Step 3: Quick Priority Assessment

**Use this simplified scoring** to rank issues:

``` formula
Quick Priority = Impact + Feasibility + Blocking
Each factor: 1-5 points, Total: 3-15 points
```

**Impact (1-5)**:

- 5: Prevents build/core functionality
- 3: Affects important features  
- 1: Minor/cosmetic issues

**Feasibility (1-5)**:

- 5: Clear errors, obvious fix
- 3: Some investigation needed
- 1: Complex/unclear problem

**Blocking (1-5)**:

- 5: Blocks all development
- 3: Blocks other components
- 1: No blocking impact

**Selection Rule**: Choose highest scoring issue ≥9 points

### Step 4: Complexity Pre-Assessment

**For your selected issue, estimate complexity**:

``` formula
Quick Complexity = Files + Dependencies + Uncertainty
Each factor: 1-3 points, Total: 3-9 points
```

**Files (1-3)**:

- 1: Single file or 2-3 related files
- 2: 4-8 files, module changes
- 3: >8 files, cross-module changes

**Dependencies (1-3)**:

- 1: Self-contained fix
- 2: 2-5 dependencies
- 3: >5 dependencies or architectural changes

**Uncertainty (1-3)**:

- 1: Clear problem and solution
- 2: Some investigation needed
- 3: Unclear problem or solution

### Step 5: Route to Appropriate Guide

**Based on complexity assessment**:

**Low Complexity (3-5 points)**: Use `quick-fix-guide.md`

- Simple fixes, clear solutions
- Expected completion: <3 hours
- Minimal documentation required

**Medium/High Complexity (6-9 points)**: Use `comprehensive-fix-guide.md`

- Complex fixes requiring detailed analysis
- Expected completion: >3 hours
- Full documentation and escalation protocols

**Route by including the appropriate guide in your context**:

``` bash
# For Low Complexity
Continue with quick-fix-guide.md

# For Medium/High Complexity  
Continue with comprehensive-fix-guide.md
```

## 🔍 Issue Selection Examples

### Good Candidate Example

``` log
From Tracker: "Universal Command Registry (src/commands/) - STATUS: Broken (8 compilation errors)"
Evidence: "Method signature conflicts, handler registration failures"

Quick Assessment:
- Impact: 4 (major component affects command functionality)
- Feasibility: 4 (clear errors, specific location)
- Blocking: 5 (prevents build)
- Priority Score: 13 (High Priority - Select This)

Complexity Assessment:
- Files: 1 (registry system isolated)
- Dependencies: 2 (command handlers depend on registry)
- Uncertainty: 1 (clear TypeScript errors)
- Complexity: 4 (Low Complexity)

Route: Use quick-fix-guide.md
```

### Avoid Example

``` log
From Tracker: "Performance issues throughout system (details unknown)"
Evidence: "System feels slow, no specific measurements"

Quick Assessment:
- Impact: 3 (affects user experience)
- Feasibility: 1 (no clear problem definition)
- Blocking: 1 (workarounds exist)
- Priority Score: 5 (Low Priority - Avoid)

Reason: Insufficient evidence, unclear scope, low feasibility
```

## 📋 Selection Checklist

**Before proceeding with any issue**:

- [ ] Issue has specific error counts or clear evidence
- [ ] Component location is clearly identified
- [ ] Fix scope appears manageable (not system-wide)
- [ ] Priority score ≥9 points
- [ ] Complexity assessment completed
- [ ] Appropriate guide selected

## 🛤️ Alternative Entry Points

**If you receive specific instructions**:

**Direct Guide Usage**:

- If given `quick-fix-guide.md` directly, it contains its own issue selection logic
- If given `comprehensive-fix-guide.md` directly, it contains its own workflow

**Specific Issue Assignment**:

- If told to fix a specific component, skip to complexity assessment
- Choose appropriate guide based on complexity score

**Tracker-Only Context**:

- If given only a tracker, use this selector's workflow
- Apply selection criteria to find best candidate issue

## 📊 Reference Files

**Scoring Details**: See `shared-components.md` for detailed scoring matrices

**Fix Guides**:

- `quick-fix-guide.md` - For complexity 3-5 points
- `comprehensive-fix-guide.md` - For complexity 6-9 points

**Support**:

- `tracker-template.md` - Tracker and planning file structure guide
- Validation scripts in `scripts/validation/` (placeholders)
- Planning files in `project/dev/*-fix-planning.md` for organized task queues

## ⚠️ Important Notes

**This selector is optional** - fix guides work independently if you're given them directly.

**Context optimization** - This selector provides only essential routing logic to minimize token usage.

**Fallback behavior** - If tracker not found or issues unclear, default to comprehensive-fix-guide.md for safety.

**Integration** - All selected issues should reference back to the Implementation Tracker for status updates.

---
**Generated**: For modular issue-fix system architecture  
**Purpose**: Autonomous routing with minimal context bloat  
**Integration**: Works with all components independently or together
