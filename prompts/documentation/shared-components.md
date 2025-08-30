# Shared Components - Scoring Systems & Integration Standards

> **Purpose**: Reusable frameworks and standards for consistent issue assessment and documentation  
> **Scope**: Common components referenced by all fix guides and tracker templates  
> **Usage**: Reference file - import specific sections as needed

## Priority Scoring Matrix

**Formula**:

``` formula
Priority Score = (Impact × 3) + (Feasibility × 2) + (Blocking Factor × 2)
Maximum possible: 35 points
```

### Impact Score (1-5)

- **5**: Core system functionality broken, affects all users
- **4**: Major component broken, affects multiple workflows  
- **3**: Important component broken, affects specific workflows
- **2**: Minor component broken, workarounds available
- **1**: Cosmetic issue, minimal user impact

### Feasibility Score (1-5)

- **5**: Clear error messages, obvious fix, <3 files affected
- **4**: Clear problem, straightforward solution, <5 files affected
- **3**: Moderate complexity, some investigation needed, <10 files
- **2**: Complex issue, significant investigation, <20 files
- **1**: Unclear problem, extensive investigation, >20 files

### Blocking Factor Score (1-5)

- **5**: Prevents build/compilation, blocks all development
- **4**: Blocks multiple other components from working
- **3**: Blocks 1-2 other components from working  
- **2**: Some components waiting on this fix
- **1**: No other components blocked

### Priority Levels

- **30-35**: **Critical Priority** - Fix immediately
- **21-29**: **High Priority** - Fix within 24 hours
- **14-20**: **Medium Priority** - Fix within week
- **7-13**: **Low Priority** - Fix when convenient
- **0-6**: **Defer** - Consider if worth fixing

## Complexity Scoring Framework

**Formula**:

``` formula
Complexity Score = (Files × 1) + (Dependencies × 2) + (Uncertainty × 3)
Maximum possible: 35 points
```

### Files Affected Score (1-5)

- **1**: Single file, isolated change
- **2**: 2-3 files, related components
- **3**: 4-8 files, module-level changes
- **4**: 9-20 files, cross-module changes
- **5**: >20 files, system-wide changes

### Dependencies Score (1-5)

- **1**: No dependencies, self-contained fix
- **2**: 1-2 direct dependencies, clear interfaces
- **3**: 3-5 dependencies, some interface changes needed
- **4**: 6-10 dependencies, significant interface changes
- **5**: >10 dependencies, architectural changes required

### Uncertainty Score (1-5)

- **1**: Clear problem, obvious solution, well-understood domain
- **2**: Clear problem, straightforward solution, some investigation needed
- **3**: Moderate problem clarity, solution requires research
- **4**: Unclear problem, solution uncertain, significant investigation
- **5**: Problem unclear, solution unknown, major investigation required

### Refactoring vs. Architecture Assessment

**Apply this modifier to prevent over-engineering**:

**Refactoring Indicators** (Reduce complexity score by 5-10 points):

- Method name changes but same conceptual operations
- Constructor parameter differences that can be handled with initialization
- Async/sync pattern differences (just add `await`)
- Real implementations exist and work
- API differences but same data flow

**True Architectural Issues** (Maintain or increase complexity score):

- Fundamental paradigm differences (event vs. request-response)
- Circular dependencies requiring design changes
- Security model conflicts requiring system changes
- Performance requirement conflicts
- Missing implementations requiring new design

### Complexity Levels & Guide Selection

**Apply Refactoring vs. Architecture Assessment first**:

- **25-35**: **High Complexity** - Use comprehensive-fix-guide.md, consider escalation
- **15-24**: **Medium Complexity** - Use comprehensive-fix-guide.md, proceed with caution  
- **8-14**: **Low-Medium Complexity** - **Check refactoring indicators** - may be simple refactoring
- **0-7**: **Low Complexity** - Use quick-fix-guide.md

### Common Over-Engineering Prevention

**Warning Signs of Over-Engineering**:

1. **Treating refactoring as architecture**
   - Method name differences → "API incompatibility"
   - Constructor parameters → "Complex dependency injection"
   - Async differences → "Architectural paradigm conflict"

2. **Creating unnecessary abstractions**
   - Adapter layers for simple method mapping
   - Compatibility interfaces for parameter differences
   - Event systems for direct method calls

3. **Escalating normal development work**
   - "Requires architectural review" for method updates
   - "Cross-system implications" for constructor parameters
   - "Unknown complexity" for well-documented APIs

**Simplicity Check Questions**:

- Can you explain the solution in one sentence?
- Would a junior developer understand this as normal refactoring?
- Are you creating more code than you're replacing?
- Is the "complex" solution really simpler long-term?

## Tracker-to-Fix Evidence Mapping

**Essential Field Mappings** for consistency between Implementation Tracker and Fix Documentation:

### Standard Mappings

```markdown
Tracker Field                    → Fix Document Field
----------------------------------------
Component "Evidence" field       → "Evidence of Issue" section
Component "Status" description   → "Original Issue from Implementation Tracker" 
Component "Priority" level       → "Severity" field
"Build Issues Log" entries       → "Build Health Verification" section
Component location path          → "Files Modified" section
Error counts/messages           → "Root Cause Analysis" section
"Last Verified" date            → Reference for timeline context
```

### Evidence Format Standards

**In Implementation Tracker**:

``` log
Evidence: "[X] compilation errors in [component], [specific error types]"
```

**In Fix Document**:

```markdown
### Evidence of Issue
From Implementation Tracker:
[X] compilation errors in [component], [specific error types]

### Root Cause Analysis  
[Explanation of underlying cause based on evidence]
```

### Status Transition Format

``` log
Tracker Before: "STATUS: 🔴 Broken ([X] compilation errors)"
Fix Document: "Component Status: Broken, Build Errors: [X]"

Tracker After: "STATUS: 🟢 Working (0 compilation errors, functionality verified)"  
Fix Document: "Component Status: Working, Build Errors: 0"
```

## Validation Commands Reference

**Placeholder Scripts** (implementation planned for Session 2):

### Stage-Based Validation

```bash
# After issue selection
node scripts/validation/validate-component.js <component-name>

# Before implementation starts  
node scripts/validation/estimate-complexity.js <issue-id>

# After implementation complete
node scripts/validation/verify-fix.js <component-name>

# Before creating fix documentation
node scripts/validation/generate-evidence.js <fix-id>
```

### Script Purposes

- **validate-component.js**: Component health, compilation, integration checks
- **estimate-complexity.js**: Quantitative complexity scoring and template recommendation
- **verify-fix.js**: Fix completeness validation with compilation and test verification
- **generate-evidence.js**: Structured evidence collection for documentation

## Common Definitions

### Issue Categories

- **Compilation Errors**: TypeScript, import/export, type definition issues
- **Integration Issues**: Component communication, interface mismatches  
- **Mock-to-Real Transitions**: Placeholder replacement patterns
- **Architecture Changes**: Structural modifications, dependency updates
- **Performance Issues**: Optimization patterns, bottleneck resolutions

### Component Status Types

- **🟢 Working**: Verified functional with evidence
- **🟡 Mock-Dependent**: Functional but using placeholder implementations
- **🔴 Broken**: Non-functional with specific error evidence
- **❌ Missing**: Component does not exist but is required

### Agent Behavior Categories

- **Verification Failures**: Cases where agents reported completion without evidence
- **Complexity Underestimation**: Issues that escalated beyond initial estimates
- **Success Patterns**: Approaches that consistently work well
- **Anti-Patterns**: Common mistakes to avoid

## 🏗️ Template Selection Logic

### Decision Tree

``` diagram
1. Calculate Priority Score (Impact×3 + Feasibility×2 + Blocking×2)
   └─ If score <9: Consider deferring or deprioritizing

2. Calculate Complexity Score (Files×1 + Dependencies×2 + Uncertainty×3)
   ├─ If score 0-7: Use quick-fix-guide.md
   ├─ If score 8-14: Consider factors, lean toward quick for simple cases
   └─ If score 15+: Use comprehensive-fix-guide.md

3. Cross-Check Factors
   ├─ Time constraint: <3 hours → quick-fix-guide.md
   ├─ Architectural changes needed → comprehensive-fix-guide.md
   ├─ Security implications → comprehensive-fix-guide.md
   └─ Multiple components affected → comprehensive-fix-guide.md
```

## Validation Script Integration

**Automated Assessment Tools** available in `scripts/validation/`:

### Component Health Validation

```bash
node scripts/validation/validate-component.js <component-name>
```

**Use when**: Before starting any fix, during implementation, after completion  
**Output**: Health score (0-100), status indicators, compilation errors, test results

### Complexity Estimation  

```bash
node scripts/validation/estimate-complexity.js <issue-id-or-component>
```

**Use when**: Before selecting fix approach, during pre-assessment  
**Output**: Complexity score (0-35), template recommendation, time estimate

### Fix Verification

```bash
node scripts/validation/verify-fix.js <component-name>
```

**Use when**: After implementing fixes, before marking complete  
**Output**: Multi-stage verification results, pass/fail status, regression detection

### Evidence Generation

```bash
node scripts/validation/generate-evidence.js <fix-id>
```

**Use when**: For comprehensive fixes, tracker updates, documentation  
**Output**: Before/after analysis, JSON evidence, tracker update entries

### Integration with Scoring Systems

**Validation scripts provide automated scoring** that maps to the manual scoring frameworks:

- **Component Health Score** (0-100) → Direct mapping to component status
- **Complexity Score** (0-35) → Maps to Complexity Scoring Framework  
- **Priority Assessment** → Can inform Impact and Blocking Factor scores
- **Evidence Collection** → Provides structured data for Evidence Mapping

**Workflow Integration Points**:

- **Issue Selection**: Use `validate-component.js` to assess baseline health
- **Template Selection**: Use `estimate-complexity.js` for automated routing
- **Progress Tracking**: Use `verify-fix.js` for validation checkpoints
- **Documentation**: Use `generate-evidence.js` for tracker integration

## Success Metrics Framework

### Key Performance Indicators

**Efficiency KPIs**:

- Fix success rate: Target >80%
- First-attempt success: Target >70%
- Time estimate accuracy: Target within 25%
- Template completion rate: Target >90%

**Quality KPIs**:

- Verification accuracy: Target >95%
- Escalation appropriateness: Target >85%
- Regression introduction rate: Target <5%

**Learning KPIs**:

- Complexity estimation improvement: Target +10% annually
- Pattern recognition accuracy: Target >75%
- Process refinement rate: Monthly improvements

---
**Purpose**: Shared reference for consistent scoring and integration  
**Integration**: Referenced by all guides and tracker templates  
**Maintenance**: Update centrally to propagate to all dependent documents
