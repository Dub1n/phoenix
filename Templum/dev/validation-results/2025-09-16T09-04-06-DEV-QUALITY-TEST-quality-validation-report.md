---

date: 2025-09-16T09-04

TASK-ID: DEV-QUALITY-TEST

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



# Validation Report - DEV-QUALITY-TEST - 2025-09-16T09-04



## Validation Category: Code Quality Assessment



**Overall Status**: VALIDATION_FAILED

**Execution Time**: 1172ms

**Tests Executed**: 4



## Tests Executed



- [ ] Code Complexity Analysis - ❌ FAIL
- [ ] Technical Debt Assessment - ❌ FAIL
- [ ] Refactoring Recommendations - ❌ FAIL
- [ ] Maintainability Scoring - ❌ FAIL



## Evidence Collected



1. Complexity analysis: src\backend\backend-dependency-resolver.ts (complexity: 94)
2. Complexity analysis: src\backend\backend-integration-config.ts (complexity: 12)
3. Complexity analysis: src\backend\backend-service-router.ts (complexity: 351)
4. Complexity analysis: src\backend\connection-factory.ts (complexity: 71)
5. Complexity analysis: src\backend\dynamic-command-router.ts (complexity: 24)
6. Complexity analysis: src\backend\pcl-backend-integration.ts (complexity: 101)
7. Complexity analysis: src\backend\service-discovery-validator.ts (complexity: 55)
8. Complexity analysis: src\backend\service-discovery.ts (complexity: 136)
9. Complexity analysis: src\cli-entry.ts (complexity: 85)
10. Complexity analysis: src\commands\universal-command-registry.ts (complexity: 123)
11. Complexity analysis: src\core\adapter-registry.ts (complexity: 260)
12. Complexity analysis: src\core\error-recovery.ts (complexity: 42)
13. Complexity analysis: src\core\templum-config-manager.ts (complexity: 45)
14. Complexity analysis: src\core\templum-core.ts (complexity: 264)
15. Complexity analysis: src\core\templum-resource-manager.ts (complexity: 70)
16. Debt assessment: src\backend\backend-dependency-resolver.ts (13 indicators)
17. Debt assessment: src\backend\backend-integration-config.ts (10 indicators)
18. Debt assessment: src\backend\backend-service-router.ts (199 indicators)
19. Debt assessment: src\backend\connection-factory.ts (33 indicators)
20. Debt assessment: src\backend\dynamic-command-router.ts (15 indicators)
21. Debt assessment: src\backend\pcl-backend-integration.ts (40 indicators)
22. Debt assessment: src\backend\service-discovery-validator.ts (4 indicators)
23. Debt assessment: src\backend\service-discovery.ts (37 indicators)
24. Debt assessment: src\cli-entry.ts (60 indicators)
25. Debt assessment: src\commands\universal-command-registry.ts (11 indicators)
26. Debt assessment: src\core\adapter-registry.ts (108 indicators)
27. Debt assessment: src\core\error-recovery.ts (3 indicators)
28. Debt assessment: src\core\templum-config-manager.ts (18 indicators)
29. Debt assessment: src\core\templum-core.ts (67 indicators)
30. Debt assessment: src\core\templum-resource-manager.ts (24 indicators)
31. Debt assessment: src\core\universal-interface-manager.ts (28 indicators)
32. Debt assessment: src\extension.ts (125 indicators)
33. Debt assessment: src\index.ts (12 indicators)
34. Debt assessment: src\interfaces\adaptive-cli-integration.ts (7 indicators)
35. Debt assessment: src\interfaces\border-renderer.ts (0 indicators)
36. Refactoring analysis: src\backend\backend-dependency-resolver.ts (2 recommendations)
37. Refactoring analysis: src\backend\backend-integration-config.ts (1 recommendations)
38. Refactoring analysis: src\backend\backend-service-router.ts (3 recommendations)
39. Refactoring analysis: src\backend\connection-factory.ts (3 recommendations)
40. Refactoring analysis: src\backend\dynamic-command-router.ts (2 recommendations)
41. Refactoring analysis: src\backend\pcl-backend-integration.ts (3 recommendations)
42. Refactoring analysis: src\backend\service-discovery-validator.ts (2 recommendations)
43. Refactoring analysis: src\backend\service-discovery.ts (2 recommendations)
44. Refactoring analysis: src\cli-entry.ts (3 recommendations)
45. Refactoring analysis: src\commands\universal-command-registry.ts (2 recommendations)
46. Refactoring analysis: src\core\adapter-registry.ts (3 recommendations)
47. Refactoring analysis: src\core\error-recovery.ts (3 recommendations)
48. Refactoring analysis: src\core\templum-config-manager.ts (3 recommendations)
49. Refactoring analysis: src\core\templum-core.ts (4 recommendations)
50. Refactoring analysis: src\core\templum-resource-manager.ts (3 recommendations)
51. Maintainability score: src\backend\backend-dependency-resolver.ts (50/100)
52. Maintainability score: src\backend\backend-integration-config.ts (65/100)
53. Maintainability score: src\backend\backend-service-router.ts (50/100)
54. Maintainability score: src\backend\connection-factory.ts (50/100)
55. Maintainability score: src\backend\dynamic-command-router.ts (50/100)
56. Maintainability score: src\backend\pcl-backend-integration.ts (50/100)
57. Maintainability score: src\backend\service-discovery-validator.ts (50/100)
58. Maintainability score: src\backend\service-discovery.ts (50/100)
59. Maintainability score: src\cli-entry.ts (40/100)
60. Maintainability score: src\commands\universal-command-registry.ts (50/100)
61. Maintainability score: src\core\adapter-registry.ts (45/100)
62. Maintainability score: src\core\error-recovery.ts (50/100)
63. Maintainability score: src\core\templum-config-manager.ts (50/100)
64. Maintainability score: src\core\templum-core.ts (50/100)
65. Maintainability score: src\core\templum-resource-manager.ts (50/100)
66. Maintainability score: src\core\universal-interface-manager.ts (50/100)
67. Maintainability score: src\extension.ts (35/100)
68. Maintainability score: src\index.ts (100/100)
69. Maintainability score: src\interfaces\adaptive-cli-integration.ts (30/100)
70. Maintainability score: src\interfaces\border-renderer.ts (50/100)



## Test Results Detail



### Code Complexity Analysis



**Status**: FAIL

**Message**: High code complexity detected

**Evidence**: Complexity analysis: src\backend\backend-dependency-resolver.ts (complexity: 94), Complexity analysis: src\backend\backend-integration-config.ts (complexity: 12), Complexity analysis: src\backend\backend-service-router.ts (complexity: 351), Complexity analysis: src\backend\connection-factory.ts (complexity: 71), Complexity analysis: src\backend\dynamic-command-router.ts (complexity: 24), Complexity analysis: src\backend\pcl-backend-integration.ts (complexity: 101), Complexity analysis: src\backend\service-discovery-validator.ts (complexity: 55), Complexity analysis: src\backend\service-discovery.ts (complexity: 136), Complexity analysis: src\cli-entry.ts (complexity: 85), Complexity analysis: src\commands\universal-command-registry.ts (complexity: 123), Complexity analysis: src\core\adapter-registry.ts (complexity: 260), Complexity analysis: src\core\error-recovery.ts (complexity: 42), Complexity analysis: src\core\templum-config-manager.ts (complexity: 45), Complexity analysis: src\core\templum-core.ts (complexity: 264), Complexity analysis: src\core\templum-resource-manager.ts (complexity: 70)


### Technical Debt Assessment



**Status**: FAIL

**Message**: High technical debt detected

**Evidence**: Debt assessment: src\backend\backend-dependency-resolver.ts (13 indicators), Debt assessment: src\backend\backend-integration-config.ts (10 indicators), Debt assessment: src\backend\backend-service-router.ts (199 indicators), Debt assessment: src\backend\connection-factory.ts (33 indicators), Debt assessment: src\backend\dynamic-command-router.ts (15 indicators), Debt assessment: src\backend\pcl-backend-integration.ts (40 indicators), Debt assessment: src\backend\service-discovery-validator.ts (4 indicators), Debt assessment: src\backend\service-discovery.ts (37 indicators), Debt assessment: src\cli-entry.ts (60 indicators), Debt assessment: src\commands\universal-command-registry.ts (11 indicators), Debt assessment: src\core\adapter-registry.ts (108 indicators), Debt assessment: src\core\error-recovery.ts (3 indicators), Debt assessment: src\core\templum-config-manager.ts (18 indicators), Debt assessment: src\core\templum-core.ts (67 indicators), Debt assessment: src\core\templum-resource-manager.ts (24 indicators), Debt assessment: src\core\universal-interface-manager.ts (28 indicators), Debt assessment: src\extension.ts (125 indicators), Debt assessment: src\index.ts (12 indicators), Debt assessment: src\interfaces\adaptive-cli-integration.ts (7 indicators), Debt assessment: src\interfaces\border-renderer.ts (0 indicators)


### Refactoring Recommendations



**Status**: FAIL

**Message**: Significant refactoring needed

**Evidence**: Refactoring analysis: src\backend\backend-dependency-resolver.ts (2 recommendations), Refactoring analysis: src\backend\backend-integration-config.ts (1 recommendations), Refactoring analysis: src\backend\backend-service-router.ts (3 recommendations), Refactoring analysis: src\backend\connection-factory.ts (3 recommendations), Refactoring analysis: src\backend\dynamic-command-router.ts (2 recommendations), Refactoring analysis: src\backend\pcl-backend-integration.ts (3 recommendations), Refactoring analysis: src\backend\service-discovery-validator.ts (2 recommendations), Refactoring analysis: src\backend\service-discovery.ts (2 recommendations), Refactoring analysis: src\cli-entry.ts (3 recommendations), Refactoring analysis: src\commands\universal-command-registry.ts (2 recommendations), Refactoring analysis: src\core\adapter-registry.ts (3 recommendations), Refactoring analysis: src\core\error-recovery.ts (3 recommendations), Refactoring analysis: src\core\templum-config-manager.ts (3 recommendations), Refactoring analysis: src\core\templum-core.ts (4 recommendations), Refactoring analysis: src\core\templum-resource-manager.ts (3 recommendations)


### Maintainability Scoring



**Status**: FAIL

**Message**: Low maintainability score

**Evidence**: Maintainability score: src\backend\backend-dependency-resolver.ts (50/100), Maintainability score: src\backend\backend-integration-config.ts (65/100), Maintainability score: src\backend\backend-service-router.ts (50/100), Maintainability score: src\backend\connection-factory.ts (50/100), Maintainability score: src\backend\dynamic-command-router.ts (50/100), Maintainability score: src\backend\pcl-backend-integration.ts (50/100), Maintainability score: src\backend\service-discovery-validator.ts (50/100), Maintainability score: src\backend\service-discovery.ts (50/100), Maintainability score: src\cli-entry.ts (40/100), Maintainability score: src\commands\universal-command-registry.ts (50/100), Maintainability score: src\core\adapter-registry.ts (45/100), Maintainability score: src\core\error-recovery.ts (50/100), Maintainability score: src\core\templum-config-manager.ts (50/100), Maintainability score: src\core\templum-core.ts (50/100), Maintainability score: src\core\templum-resource-manager.ts (50/100), Maintainability score: src\core\universal-interface-manager.ts (50/100), Maintainability score: src\extension.ts (35/100), Maintainability score: src\index.ts (100/100), Maintainability score: src\interfaces\adaptive-cli-integration.ts (30/100), Maintainability score: src\interfaces\border-renderer.ts (50/100)





## Errors

- 4 tests failed
- Average complexity: 115.53, 15 high-complexity files need refactoring
- High technical debt: 814 indicators across 19 files require attention
- 39 refactoring opportunities (15 high priority) require attention
- Low maintainability score: 50.8/100 - requires improvement






## Summary



- **Project**: templum

- **Category**: quality

- **Status**: FAIL

- **Duration**: 1172ms

- **Timestamp**: 2025-09-16T09:04:06.807Z

- **Tests Passed**: 0

- **Tests Failed**: 4

- **Tests Warned**: 0

