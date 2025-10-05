---
date-created: 2025-09-11-0000
last-updated: 2025-09-11-0000
name: mock-real-api-contract-testing
description: Contract testing to ensure mock/real API consistency with automated validation
status: experimental
category: testing-integration
use-when:
  - Mock interfaces diverge from real implementations
  - Test expectations fail due to API inconsistencies
  - Need automated validation of mock behavior
keywords:
  - contract-testing
  - mock-validation
  - api-consistency
  - test-infrastructure
  - automated-testing
prerequisites:
  - real-component-api-analysis
related-patterns:
  - test-infrastructure-repair
  - api-signature-matching
---

# Mock-Real API Contract Testing Pattern

**Problem**: Mock interfaces diverge from real implementations, causing test expectations to fail

**Solution**: Contract testing to ensure mock/real API consistency with automated validation

#### Mock-Real API Contract Testing Pattern: Implementation Steps

```typescript
// **X** BROKEN: Mock assumes different API than real implementation
const mockResult = { success: true, interfaceType: 'vscode' };
expect(vscodeResult.success).toBe(true); // Fails - real API returns false

// ✅ FIXED: Mock matches real API structure
interface RealAPIResponse {
success: boolean;
error?: string;
data?: any;
}

const createMockResponse = (overrides: Partial<RealAPIResponse> = {}):  RealAPIResponse => ({
success: false,  // Match real default behavior
error: undefined,
data: undefined,
...overrides
});
```

1. **API Signature Matching**: Ensure mock method signatures match real implementations exactly
2. **Return Type Consistency**: Mock return values must match real component return structures
3. **Error Behavior**: Mock error conditions must match real component error patterns
4. **Automated Testing**: Create contract tests that validate mock/real API consistency

#### Mock-Real API Contract Testing Pattern: Success Metrics

- [Placeholder - Mock/real API consistency metrics]
- [Placeholder - Test expectation failure reduction]

#### Mock-Real API Contract Testing Pattern: Anti-Patterns

- **X** [Placeholder - Common mistakes to avoid]

#### Mock-Real API Contract Testing Pattern: Validation Checklist

- [ ] [Placeholder - Verification steps]

#### Mock-Real API Contract Testing Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

#### Mock-Real API Contract Testing Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-TEST-INFRA-002]
**Successfully Applied**: [Placeholder - completed implementations]
**Integration Points**: Test Infrastructure Repair, Real Component API Analysis
**Files Using This Pattern**: [Placeholder - files using pattern]
