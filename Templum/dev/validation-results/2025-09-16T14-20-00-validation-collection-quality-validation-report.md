---
author: validation-system
source: validation-system
validation_type: quality
category: quality
priority: medium
complexity: TBD
components: [validation-generated]
initial_status: [~]
end_status: [F]
tags: quality, validation, automated-testing
---

# Validation Report - validation-collection - 2025-09-16T14-20

## Validation Category: Code Quality Assessment

**Overall Status**: VALIDATION_FAILED
**Execution Time**: 1821ms
**Tests Executed**: 4

## Tests Executed

- [ ] Code Complexity Analysis - [F] FAIL
- [ ] Technical Debt Assessment - [F] FAIL
- [ ] Refactoring Recommendations - [F] FAIL
- [ ] Maintainability Scoring - [F] FAIL

## Evidence Collected

1. [SUMMARY] Tests run - 4 total, PASS:0, WARN:0, FAIL:4; Duration:1076ms
2. Complexity analysis: src/backend/backend-dependency-resolver.ts (complexity: 94)
3. Complexity analysis: src/backend/backend-integration-config.ts (complexity: 12)
4. Complexity analysis: src/backend/backend-service-router.ts (complexity: 351)
5. Complexity analysis: src/backend/connection-factory.ts (complexity: 71)
6. Complexity analysis: src/backend/dynamic-command-router.ts (complexity: 24)
7. Complexity analysis: src/backend/pcl-backend-integration.ts (complexity: 101)
8. Complexity analysis: src/backend/service-discovery-validator.ts (complexity: 55)
9. Complexity analysis: src/backend/service-discovery.ts (complexity: 136)
10. Complexity analysis: src/cli-entry.ts (complexity: 85)
11. Complexity analysis: src/commands/universal-command-registry.ts (complexity: 123)
12. Complexity analysis: src/core/adapter-registry.ts (complexity: 260)
13. Complexity analysis: src/core/error-recovery.ts (complexity: 42)
14. Complexity analysis: src/core/templum-config-manager.ts (complexity: 45)
15. Complexity analysis: src/core/templum-core.ts (complexity: 264)
16. Complexity analysis: src/core/templum-resource-manager.ts (complexity: 70)
17. Debt assessment: src/backend/backend-dependency-resolver.ts (13 indicators)
18. Debt assessment: src/backend/backend-integration-config.ts (10 indicators)
19. Debt assessment: src/backend/backend-service-router.ts (199 indicators)
20. Debt assessment: src/backend/connection-factory.ts (33 indicators)
21. Debt assessment: src/backend/dynamic-command-router.ts (15 indicators)
22. Debt assessment: src/backend/pcl-backend-integration.ts (40 indicators)
23. Debt assessment: src/backend/service-discovery-validator.ts (4 indicators)
24. Debt assessment: src/backend/service-discovery.ts (37 indicators)
25. Debt assessment: src/cli-entry.ts (60 indicators)
26. Debt assessment: src/commands/universal-command-registry.ts (11 indicators)
27. Debt assessment: src/core/adapter-registry.ts (108 indicators)
28. Debt assessment: src/core/error-recovery.ts (3 indicators)
29. Debt assessment: src/core/templum-config-manager.ts (18 indicators)
30. Debt assessment: src/core/templum-core.ts (67 indicators)
31. Debt assessment: src/core/templum-resource-manager.ts (24 indicators)
32. Debt assessment: src/core/universal-interface-manager.ts (28 indicators)
33. Debt assessment: src/extension.ts (125 indicators)
34. Debt assessment: src/index.ts (12 indicators)
35. Debt assessment: src/interfaces/__tests__/adaptive-cli-integration.test.ts (8 indicators)
36. Debt assessment: src/interfaces/adaptive-cli-integration.ts (7 indicators)
37. Refactoring analysis: src/backend/backend-dependency-resolver.ts (2 recommendations)
38. Refactoring analysis: src/backend/backend-integration-config.ts (1 recommendations)
39. Refactoring analysis: src/backend/backend-service-router.ts (3 recommendations)
40. Refactoring analysis: src/backend/connection-factory.ts (3 recommendations)
41. Refactoring analysis: src/backend/dynamic-command-router.ts (2 recommendations)
42. Refactoring analysis: src/backend/pcl-backend-integration.ts (3 recommendations)
43. Refactoring analysis: src/backend/service-discovery-validator.ts (2 recommendations)
44. Refactoring analysis: src/backend/service-discovery.ts (2 recommendations)
45. Refactoring analysis: src/cli-entry.ts (3 recommendations)
46. Refactoring analysis: src/commands/universal-command-registry.ts (2 recommendations)
47. Refactoring analysis: src/core/adapter-registry.ts (3 recommendations)
48. Refactoring analysis: src/core/error-recovery.ts (3 recommendations)
49. Refactoring analysis: src/core/templum-config-manager.ts (3 recommendations)
50. Refactoring analysis: src/core/templum-core.ts (4 recommendations)
51. Refactoring analysis: src/core/templum-resource-manager.ts (3 recommendations)
52. Maintainability score: src/backend/backend-dependency-resolver.ts (50/100)
53. Maintainability score: src/backend/backend-integration-config.ts (65/100)
54. Maintainability score: src/backend/backend-service-router.ts (50/100)
55. Maintainability score: src/backend/connection-factory.ts (50/100)
56. Maintainability score: src/backend/dynamic-command-router.ts (50/100)
57. Maintainability score: src/backend/pcl-backend-integration.ts (50/100)
58. Maintainability score: src/backend/service-discovery-validator.ts (50/100)
59. Maintainability score: src/backend/service-discovery.ts (50/100)
60. Maintainability score: src/cli-entry.ts (40/100)
61. Maintainability score: src/commands/universal-command-registry.ts (50/100)
62. Maintainability score: src/core/adapter-registry.ts (45/100)
63. Maintainability score: src/core/error-recovery.ts (50/100)
64. Maintainability score: src/core/templum-config-manager.ts (50/100)
65. Maintainability score: src/core/templum-core.ts (50/100)
66. Maintainability score: src/core/templum-resource-manager.ts (50/100)
67. Maintainability score: src/core/universal-interface-manager.ts (50/100)
68. Maintainability score: src/extension.ts (35/100)
69. Maintainability score: src/index.ts (100/100)
70. Maintainability score: src/interfaces/__tests__/adaptive-cli-integration.test.ts (55/100)
71. Maintainability score: src/interfaces/adaptive-cli-integration.ts (30/100)
72. [BREAKDOWN] Code Complexity Analysis: FAIL - High code complexity detected
73. [BREAKDOWN] Technical Debt Assessment: FAIL - High technical debt detected
74. [BREAKDOWN] Refactoring Recommendations: FAIL - Significant refactoring needed
75. [BREAKDOWN] Maintainability Scoring: FAIL - Low maintainability score
76. [INSIGHT] Evidence coverage: 70 items across 4 tests

## Test Results Detail

### Code Complexity Analysis

**Status**: FAIL
**Message**: High code complexity detected
**Evidence**: Complexity analysis: src/backend/backend-dependency-resolver.ts (complexity: 94), Complexity analysis: src/backend/backend-integration-config.ts (complexity: 12), Complexity analysis: src/backend/backend-service-router.ts (complexity: 351), Complexity analysis: src/backend/connection-factory.ts (complexity: 71), Complexity analysis: src/backend/dynamic-command-router.ts (complexity: 24), Complexity analysis: src/backend/pcl-backend-integration.ts (complexity: 101), Complexity analysis: src/backend/service-discovery-validator.ts (complexity: 55), Complexity analysis: src/backend/service-discovery.ts (complexity: 136), Complexity analysis: src/cli-entry.ts (complexity: 85), Complexity analysis: src/commands/universal-command-registry.ts (complexity: 123), Complexity analysis: src/core/adapter-registry.ts (complexity: 260), Complexity analysis: src/core/error-recovery.ts (complexity: 42), Complexity analysis: src/core/templum-config-manager.ts (complexity: 45), Complexity analysis: src/core/templum-core.ts (complexity: 264), Complexity analysis: src/core/templum-resource-manager.ts (complexity: 70)

### Technical Debt Assessment

**Status**: FAIL
**Message**: High technical debt detected
**Evidence**: Debt assessment: src/backend/backend-dependency-resolver.ts (13 indicators), Debt assessment: src/backend/backend-integration-config.ts (10 indicators), Debt assessment: src/backend/backend-service-router.ts (199 indicators), Debt assessment: src/backend/connection-factory.ts (33 indicators), Debt assessment: src/backend/dynamic-command-router.ts (15 indicators), Debt assessment: src/backend/pcl-backend-integration.ts (40 indicators), Debt assessment: src/backend/service-discovery-validator.ts (4 indicators), Debt assessment: src/backend/service-discovery.ts (37 indicators), Debt assessment: src/cli-entry.ts (60 indicators), Debt assessment: src/commands/universal-command-registry.ts (11 indicators), Debt assessment: src/core/adapter-registry.ts (108 indicators), Debt assessment: src/core/error-recovery.ts (3 indicators), Debt assessment: src/core/templum-config-manager.ts (18 indicators), Debt assessment: src/core/templum-core.ts (67 indicators), Debt assessment: src/core/templum-resource-manager.ts (24 indicators), Debt assessment: src/core/universal-interface-manager.ts (28 indicators), Debt assessment: src/extension.ts (125 indicators), Debt assessment: src/index.ts (12 indicators), Debt assessment: src/interfaces/__tests__/adaptive-cli-integration.test.ts (8 indicators), Debt assessment: src/interfaces/adaptive-cli-integration.ts (7 indicators)

### Refactoring Recommendations

**Status**: FAIL
**Message**: Significant refactoring needed
**Evidence**: Refactoring analysis: src/backend/backend-dependency-resolver.ts (2 recommendations), Refactoring analysis: src/backend/backend-integration-config.ts (1 recommendations), Refactoring analysis: src/backend/backend-service-router.ts (3 recommendations), Refactoring analysis: src/backend/connection-factory.ts (3 recommendations), Refactoring analysis: src/backend/dynamic-command-router.ts (2 recommendations), Refactoring analysis: src/backend/pcl-backend-integration.ts (3 recommendations), Refactoring analysis: src/backend/service-discovery-validator.ts (2 recommendations), Refactoring analysis: src/backend/service-discovery.ts (2 recommendations), Refactoring analysis: src/cli-entry.ts (3 recommendations), Refactoring analysis: src/commands/universal-command-registry.ts (2 recommendations), Refactoring analysis: src/core/adapter-registry.ts (3 recommendations), Refactoring analysis: src/core/error-recovery.ts (3 recommendations), Refactoring analysis: src/core/templum-config-manager.ts (3 recommendations), Refactoring analysis: src/core/templum-core.ts (4 recommendations), Refactoring analysis: src/core/templum-resource-manager.ts (3 recommendations)

### Maintainability Scoring

**Status**: FAIL
**Message**: Low maintainability score
**Evidence**: Maintainability score: src/backend/backend-dependency-resolver.ts (50/100), Maintainability score: src/backend/backend-integration-config.ts (65/100), Maintainability score: src/backend/backend-service-router.ts (50/100), Maintainability score: src/backend/connection-factory.ts (50/100), Maintainability score: src/backend/dynamic-command-router.ts (50/100), Maintainability score: src/backend/pcl-backend-integration.ts (50/100), Maintainability score: src/backend/service-discovery-validator.ts (50/100), Maintainability score: src/backend/service-discovery.ts (50/100), Maintainability score: src/cli-entry.ts (40/100), Maintainability score: src/commands/universal-command-registry.ts (50/100), Maintainability score: src/core/adapter-registry.ts (45/100), Maintainability score: src/core/error-recovery.ts (50/100), Maintainability score: src/core/templum-config-manager.ts (50/100), Maintainability score: src/core/templum-core.ts (50/100), Maintainability score: src/core/templum-resource-manager.ts (50/100), Maintainability score: src/core/universal-interface-manager.ts (50/100), Maintainability score: src/extension.ts (35/100), Maintainability score: src/index.ts (100/100), Maintainability score: src/interfaces/__tests__/adaptive-cli-integration.test.ts (55/100), Maintainability score: src/interfaces/adaptive-cli-integration.ts (30/100)

## Errors

- 4 tests failed
- Average complexity: 115.53, 15 high-complexity files need refactoring
- High technical debt: 822 indicators across 20 files require attention
- 39 refactoring opportunities (15 high priority) require attention
- Low maintainability score: 51.0/100 - requires improvement

## Warnings

- [INSIGHT] Investigate failing tests: Code Complexity Analysis, Technical Debt Assessment, Refactoring Recommendations, Maintainability Scoring

## Summary

- **Project**: templum
- **Category**: quality
- **Status**: FAIL
- **Duration**: 1821ms
- **Timestamp**: 2025-09-16T14:20:00.802Z
- **Tests Passed**: 0
- **Tests Failed**: 4
- **Tests Warned**: 0
