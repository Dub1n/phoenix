# Investigation: Current Backend Prioritization and Scoring System

## Fix Summary

- **Date**: 2025-09-01-084500
- **Task ID**: TASK-SKIN-003
- **Component**: Backend Service Router + Templum Core
- **Fix Type**: Investigation and Documentation
- **Priority**: HIGH
- **Complexity**: 4

## Investigation Objective

Document the existing backend prioritization algorithm in BackendServiceRouter, identify all places using health/capabilities/version data, map current scoring factors and weights, and design fair comparison system for health-enabled vs health-less backends.

## Current Prioritization Algorithm Documentation

### Primary Location: `src/core/templum-core.ts:308-318`

The current backend prioritization algorithm is located in the `executeCommand` method:

```typescript
// Get available backends and select the best one for command execution
const systemStatus = this.getSystemStatus();
const healthyBackends = Object.entries(systemStatus.coreEngine.backendConnections.backends)
  .filter(([_, status]) => status.connected && status.health === 'healthy')
  .sort((a, b) => {
    // Prioritize by capabilities and response time
    const aCaps = a[1].capabilities?.length || 0;
    const bCaps = b[1].capabilities?.length || 0;
    const aTime = a[1].responseTime || 1000;
    const bTime = b[1].responseTime || 1000;
    return (bCaps - aCaps) + (aTime - bTime) * 0.1;
  });
```

**Algorithm Components:**

1. **Filter Step**: Only considers backends with `connected: true` AND `health: 'healthy'`
2. **Scoring Factors**:
   - **Capabilities Count** (Primary): Higher capability count = higher priority
   - **Response Time** (Secondary): Lower response time = higher priority (weighted 0.1)
3. **Selection**: Takes the first backend from sorted array (highest score)

## Health/Capabilities/Version Data Usage Analysis

### 1. BackendServiceRouter Health Monitoring (`src/backend/backend-service-router.ts`)

**Health Data Structure** (Lines 97-105):

```typescript
export interface BackendStatus {
  connected: boolean;
  health: 'healthy' | 'unhealthy' | 'error';
  lastCheck: number;
  lastError?: string;
  capabilities?: string[];
  version?: string;
  responseTime?: number;
}
```

**Health Monitoring Locations:**

1. **`performHealthCheck()` (Lines 263-314)**
   - Continuous background health monitoring (30-second intervals)
   - Updates `serviceHealth` Map with current status
   - Measures `responseTime` for each backend

2. **`detectServiceCapabilities()` (Lines 774-796)**
   - Calls `/api/capabilities` endpoint on backends
   - Stores capabilities array in `BackendStatus.capabilities`

3. **`getServiceVersion()` (Lines 821-840)**
   - Calls `/api/version` endpoint on backends
   - Stores version string in `BackendStatus.version`

4. **`updateServiceHealth()` (Lines 878-889)**
   - Central health status update method
   - Updates connected, health, lastCheck, lastError, version, responseTime

### 2. TemplumCore Usage (`src/core/templum-core.ts`)

**Health Data Consumption** (Lines 308-318):

- Filters backends by `status.connected && status.health === 'healthy'`
- Uses `capabilities?.length` for primary scoring
- Uses `responseTime` for secondary scoring (0.1 weight)

**System Status Integration** (Lines 478-482):

- Exposes backend connection status via `getSystemStatus()`
- Provides health data to UI components and monitoring systems

## Current Scoring Factors and Weights

### Scoring Formula Analysis

**Current Formula:**

``` formula
score = (capabilities_count_difference) + (response_time_difference * 0.1)
```

**Factor Breakdown:**

1. **Capabilities Count (Weight: 1.0)**
   - **Source**: `BackendStatus.capabilities?.length || 0`
   - **Impact**: Primary differentiator
   - **Range**: 0 to ~10+ capabilities per backend

2. **Response Time (Weight: 0.1)**
   - **Source**: `BackendStatus.responseTime || 1000`
   - **Impact**: Secondary tiebreaker
   - **Range**: Typically 1ms-1000ms+
   - **Default**: 1000ms for unknown response time

### Scoring Limitations Identified

1. **Binary Health Filter**: Only `healthy` backends considered - no degraded performance handling
2. **No Version Preference**: Version information collected but not used in scoring
3. **Equal Capability Weighting**: All capabilities treated equally regardless of relevance
4. **Static Response Time Weight**: 0.1 weight may not be optimal for all scenarios
5. **No Backend Type Preference**: No consideration of backend specialization

## Fair Comparison System Design for Health-Enabled vs Health-Less Backends

### Problem Statement

The current system assumes all backends expose health/capabilities/version endpoints. This creates unfair prioritization for minimal backends that only provide skin definitions without auxiliary endpoints.

### Proposed Two-Tier Prioritization System

#### Tier 1: Full-Featured Backends (Health-Enabled)

**Available Data:**

- Health status (healthy/unhealthy/error)
- Capabilities array
- Version information
- Response time metrics

**Scoring Formula:**

``` formula
score = (health_factor * 100) + (capabilities_count * 10) + (response_time_factor * 5) + (version_factor * 2)
```

**Factors:**

- `health_factor`: 1.0 (healthy), 0.5 (degraded), 0.0 (unhealthy)
- `capabilities_count`: Number of advertised capabilities
- `response_time_factor`: (1000 - response_time_ms) / 100
- `version_factor`: Calculated from semantic versioning

#### Tier 2: Minimal Backends (Skin-Definition-Only)

**Available Data:**

- Connection stability
- Skin definition completeness
- Command availability from skin

**Scoring Formula:**

``` formula
score = (connection_stability * 80) + (skin_completeness * 15) + (command_count * 5)
```

**Factors:**

- `connection_stability`: Success rate of recent connection attempts
- `skin_completeness`: Percentage of complete skin definition fields
- `command_count`: Number of commands available in skin definition

### Cross-Tier Comparison Algorithm

**Priority Order:**

1. **High-capability health-enabled backends** (Tier 1, score > 80)
2. **Stable minimal backends** (Tier 2, score > 60)
3. **Medium-capability health-enabled backends** (Tier 1, score 40-80)
4. **Unstable minimal backends** (Tier 2, score < 60)
5. **Low-capability health-enabled backends** (Tier 1, score < 40)

### Implementation Requirements for Fair System

1. **Backend Type Detection**

   ```typescript
   interface BackendCapabilityProfile {
     hasHealthEndpoint: boolean;
     hasCapabilitiesEndpoint: boolean;
     hasVersionEndpoint: boolean;
     skinDefinitionQuality: 'complete' | 'partial' | 'minimal';
   }
   ```

2. **Adaptive Scoring Engine**

   ```typescript
   calculateBackendScore(backend: BackendStatus, profile: BackendCapabilityProfile): number {
     if (profile.hasHealthEndpoint) {
       return this.calculateTier1Score(backend);
     } else {
       return this.calculateTier2Score(backend, profile);
     }
   }
   ```

3. **Connection Stability Tracking**

   ```typescript
   interface ConnectionStabilityMetrics {
     totalAttempts: number;
     successfulConnections: number;
     averageResponseTime: number;
     lastFailureTimestamp?: number;
   }
   ```

## UI Impact Analysis

### Current UI Health Display

The system currently displays backend health in binary states:

- Connected/Disconnected
- Healthy/Unhealthy/Error

### Proposed UI Enhancements

1. **Conditional Health Display**
   - Show health status only when health endpoint available
   - Show "Connected" status for minimal backends
   - Display connection stability percentage for skin-only backends

2. **Capability Visualization**
   - Health-enabled: Show capability count and health status
   - Minimal: Show available commands from skin definition

3. **Backend Type Indicators**
   - Visual distinction between full-featured and minimal backends
   - Tooltip explanations for different backend types

## Next Steps and Implementation Dependencies

### Prerequisites Completed

- ✅ TASK-API-001: Fault-tolerant endpoint handling established

### Implementation Sequence

1. **TASK-SKIN-004**: Implement capability extraction from skin definition
   - Modify `queryServiceCapabilities()` to check skin definition first
   - Only call capabilities endpoint if explicitly specified

2. **TASK-SKIN-005**: Implement optional health monitoring with intelligent prioritization
   - Implement two-tier prioritization system
   - Add connection stability tracking for minimal backends

3. **TASK-SKIN-006**: Extract version from skin definition metadata
   - Primary: Use `skinDefinition.metadata.version`
   - Fallback: Optional version endpoint

## Architecture Patterns Applied

**Pattern Used**: backend-service-integration-unified

- **Status**: ✅ ESTABLISHED
- **Location**: `templum-patterns.md#backend-service-integration-unified`
- **Integration Points**: Universal Interface Orchestration, Protocol Communication

## Investigation Completion

### Validation Results

- ✅ **Existing Algorithm Documented**: Located and analyzed prioritization logic
- ✅ **Health Data Usage Mapped**: Identified all consumption points
- ✅ **Scoring Factors Analyzed**: Current formula and weights documented
- ✅ **Fair Comparison System Designed**: Two-tier approach proposed

### Key Findings

1. **Current system is health-endpoint dependent** - unfairly disadvantages minimal backends
2. **Simple additive scoring** - capabilities count dominates response time
3. **Binary health filtering** - no degraded performance handling
4. **No backend specialization** - all backends treated identically

### Recommended Architecture Changes

1. **Progressive Enhancement Model**: Backends self-describe capabilities through skin definitions
2. **Two-Tier Scoring**: Separate algorithms for health-enabled vs minimal backends
3. **Cross-Tier Comparison**: Fair ranking system across different backend types
4. **UI Adaptation**: Conditional display based on backend capabilities

---
**Generated**: 2025-09-01-084500
**Investigation Duration**: 45 minutes
**Template**: Investigation Report
**Status**: Complete - Ready for Implementation Phase
