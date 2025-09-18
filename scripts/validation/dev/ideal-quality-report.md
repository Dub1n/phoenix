---
date: 2025-09-16T15:38:43.117Z
source: validation-system
project: templum
scope: "src/**/*.ts"
category: quality
task-id: validation-collection
duration: 2404ms
Passed: 0
Failed: 4
Warned: 0
---

# Validation Report - validation-collection - 2025-09-16T15-38

## Code Quality Assessment

**Overall Status**: VALIDATION_FAILED
**Tests Executed**: 4
**Items Covered**: 140

- [F] Code Complexity Analysis - High code complexity: 115.53 average, 15 high-complexity files need refactoring
- [F] Technical Debt Assessment - High technical debt: 699 indicators across 20 files require attention
- [F] Refactoring Recommendations - Significant refactoring needed: 48 refactoring opportunities, 41 high priority
- [F] Maintainability Scoring - Low maintainability score: 33.3/100 requires improvement

## Per-file Findings

- [backend-dependency-resolver](../../src/backend/backend-dependency-resolver.ts) - 30.0/100
  - File is over the recommended 200 at 764 non-empty lines
  - 36 duplicate line groups detected with 96 repeated lines:
    - [422, 434, 474, ...]: ``return {``
    - [199, 291, 525, ...]: ``serviceId,``
    - [205, 297, 531, ...]: ``timestamp: Date.now()``
  - Deep nesting detected (max level 10)
    - 179: ``try {``
    - 180: ``console.log(`[DEPENDENCY_RESOLVER] Resolving ${serviceId} (${isRequired ? 'required' : 'optional'})`);``
    - 185: ``if (result.resolved) {``
  - Cyclomatic complexity exceeds limit at 94 due to high branching:
    - 192: ``} else if (isRequired) {``
    - 225: ``if (successRate < 95 && dependencyChain.criticalFailures.length > 0) {``
    - 251: ``if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minute cache``
    - 272: ``if (!bestResult || result.confidence > bestResult.confidence) {``
    - 335: ``if (foundPriority === null && normalized.includes(type)) {``
  - 9x Console logging: [155, 180, 190, ...]
  - 1x TypeScript any: [387]
- [backend-integration-config](../../src/backend/backend-integration-config.ts) - 45.0/100
  - File is over the recommended 200 at 292 non-empty lines
  - 22 duplicate line groups detected with 33 repeated lines:
    - [91, 143, 164, ...] ``features: {``
    - [99, 107, 114, ...] ``},``
    - [49, 54, 75] ``timeout: number;``
  - Deep nesting detected (max level 5)
    - 143: ``features: {``
    - 164: ``features: {``
    - 188: ``features: {``
  - Cyclomatic complexity exceeds comfort range at 12
  - 3x Console logging: [232, 240, 328]
  - 1x TypeScript any: [233]
- [backend-service-router](../../src/backend/backend-service-router.ts) - 30.0/100
  - File is over the recommended 200 at 2670 non-empty lines
  - 170 duplicate line groups detected with 499 repeated lines:
    - [380, 428, 482, ...]: ``try {``
    - [417, 448, 487, ...]: ``} catch (error) {``
    - [285, 290, 295, ...]: ``});``
  - Deep nesting detected (max level 12)
    - 380: ``try {``
    - 384: ``if (capabilityProfile?.hasHealthEndpoint) {``
    - 398: ``console.log(`[HEALTH_MONITOR] Tier 1 (Health-enabled) ${backendId}: ${isHealthy ? 'healthy' : 'unhealthy'} (${responseTime}ms)`);``
  - Long parameter list detected
    - 1522: ``reject(new Error(`Litany service handshake failed: ${response.error || 'Unknown error'}`));``
    - 1987: ``reject(createTemplumError(`Litany WebSocket call timeout for ${apiMethod}`, 'WEBSOCKET_TIMEOUT', 'integration'));``
  - Cyclomatic complexity exceeds limit at 351 due to high branching:
    - 624: ``else if (hasHealthEndpoint || hasCapabilitiesEndpoint || hasVersionInfo || hasDirectCapabilities) {``
    - 619: ``if ((hasHealthEndpoint && hasCapabilitiesEndpoint && hasVersionInfo) ||``
    - 620: ``(hasDirectCapabilities && hasComprehensiveMetadata && (hasHealthEndpoint || hasCapabilitiesEndpoint))) {``
    - 1027: ``if (backendConfig?.capabilities && Array.isArray(backendConfig.capabilities) && backendConfig.capabilities.length > 0) {``
    - 1038: ``if (response && response.capabilities && Array.isArray(response.capabilities)) {``
  - 129x Console logging: [257, 273, 283, ...]
  - 2x TypeScript any: [312, 2254]
- [cli-entry](../../src/cli-entry.ts) - 30.0/100
  - File is over the recommended 200 at 702 non-empty lines
  - 34 duplicate line groups detected with 115 repeated lines:  
    - [67, 78, 109, ...]: ``try {``
    - [92, 99, 160, ...]: ``} catch (error) {``
    - [422, 429, 479, ...]: ``},``
  - Deep nesting detected (max level 10)
    - 68: ``if (!fs.existsSync(this.servicesDir)) {``
    - 77: ``for (const serviceFile of serviceFiles) {``
    - 78: ``try {``
  - Long parameter list detected
    - 261: ``reject(new Error(`IPC timeout after ${timeoutMs}ms for PID ${pid} (request: ${requestId})`));``
  - Cyclomatic complexity exceeds limit at 85 due to high branching:
    - 643: ``if (this.dynamicRouter && this.contentNavigationManager && skinDefinition) {``
    - 225: ``throw new Error(`IPC communication failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);``
    - 284: ``reject(new Error(response.error || response.message || 'Command execution failed'));``
    - 640: ``console.log(chalk.green(`[${serviceProtocol.toUpperCase()}] Real backend skin loaded: ${skinDefinition?.name || backendId}`));``
    - 648: ``console.log(chalk.green(`[ROUTING] Dynamic navigation initialized for ${skinDefinition.name || backendId}`));``
  - 12x Console logging: [16, 17, 35, ...]

## Recommended Actions

- Complexity over limit of 15: Decompose conditional logic into smaller functions or early returns
- Complexity over comfort range of 10: Reduce branching by extracting helper functions or simplifying conditionals
- High branching: Inline simple branches or move nested logic into named utilities
- Console logging: Replace with structured logger or remove debug logging
- TypeScript any: Replace `any` with an explicit interface or type alias
- File has over 200 non-empty lines: Extract independent sections into smaller files or dedicated helpers
- Duplicate line groups detected: Extract shared logic into utility functions or remove duplicate branches
- Deep nesting detected: Refactor by extracting helper functions or using guard clauses to flatten nesting
- Long parameter list detected: Switch to an options object or destructured parameters to improve readability
