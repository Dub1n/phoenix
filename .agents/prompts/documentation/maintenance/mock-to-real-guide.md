# Specialized Guidance: Mock-to-Real Component Transitions

**Most mock replacement is simple refactoring, not architectural work.**

## Quick Assessment for Mock Replacement

**Before treating as comprehensive fix, verify**:

1. **What are you replacing?**
   - **Placeholder implementations** → Update calling code (Simple refactoring)
   - **True test mocks** → Need real implementation (May be comprehensive)
   - **Architectural stubs** → Need design work (Comprehensive)

2. **Do real implementations exist?**
   - **Yes, with working APIs** → Update method calls (2-4 hours refactoring)
   - **Partially implemented** → Complete the implementation (May be comprehensive)
   - **Don't exist** → Build from scratch (Likely comprehensive)

## Pattern Recognition: Simple Refactoring vs. Architectural Change

**Simple Refactoring Indicators** (Use quick-fix-guide.md):

- Different method names but same conceptual operations (`validateSkin` → `validateSkinDefinition`)
- Constructor parameters that just need proper initialization
- Sync → async conversions (just add `await` and handle promises)
- Missing dependencies that can be passed through constructor
- Parameter reshaping (different parameter names/structure but same data)

**True Architectural Issues** (Use comprehensive-fix-guide.md):

- Fundamentally different paradigms (event-driven vs. request-response)
- Circular dependencies that cannot be resolved with proper initialization order
- Security model conflicts (different authentication/authorization approaches)
- Performance characteristics that conflict with system requirements
- Data flow patterns that are incompatible (pull vs. push models)

## Mock Replacement Workflow

#### Step 1: Understand what you're replacing**

```typescript
// Placeholder implementation (SIMPLE REFACTORING)
validateSkin(skin) { return { valid: true, errors: [] }; }

// vs. Real implementation (SIMPLE REFACTORING) 
async validateSkinDefinition(skin) { /* real validation logic */ }

// vs. Missing implementation (COMPREHENSIVE)
// No real component exists yet
```

#### Step 2: Check if real components exist and work**

```bash
# Look for real implementations
find src -name "*skin-engine*" -type f
grep -r "validateSkinDefinition" src/

# Test basic functionality
node -e "const SkinEngine = require('./real-component'); console.log(new SkinEngine());"
```

#### Step 3: Handle API differences systematically**

```typescript
// OLD (placeholder):
this.skinEngine.validateSkin(skinDef)

// NEW (real component):
await this.skinEngine.validateSkinDefinition(skinDef)
```

#### Step 4: Handle constructor dependencies**

```typescript
// OLD (no dependencies):
this.stateManager = new MockStateManager();

// NEW (with dependencies):
this.stateManager = new EnhancedStateManager({
  coalescingConfig: { enabled: true, windowMs: 100 }
});
```

## When Mock Replacement Becomes Comprehensive

**Escalate to comprehensive approach only when**:

- Real components don't exist and need to be built
- Real components have fundamental design conflicts with system architecture
- Mock replacement reveals 5+ additional broken components
- Security implications of real components require system-wide changes

**Remember**: Most "API compatibility" issues are just method name differences and parameter reshaping - normal refactoring work, not architectural complexity.
