# Performance Baseline Establishment - Haruspex Separation Project

> **Created**: 2025-08-21  
> **Purpose**: Establish performance baselines before Haruspex 2.0 / Templum 1.0 separation  
> **Scope**: Current PCL and Haruspex 1.2 performance measurements  
> **Target Requirements**: From Templum 1.0 specification

## Performance Targets (From Templum 1.0 Specification)

### Critical Performance Thresholds

```yaml
interface_switching: "<100ms between interface modes"
skin_application: "<200ms for complete skin rendering"  
command_routing: "<50ms for backend command resolution"
state_synchronization: "<150ms across all interfaces"
memory_usage: "<200MB total across all interfaces"
startup_time: "<2s for complete system initialization"
ipc_latency: "<10ms for local IPC communication"
```

### Performance Degradation Limits

- **CLI→VSCode adaptation**: Maximum 50% performance degradation from baseline
- **Interface switching**: Must maintain <100ms target (Templum requirement)
- **State synchronization**: Must maintain <150ms target (Templum requirement)
- **Memory efficiency**: No more than 100% increase from current usage

## Current System Performance Baseline

### Phoenix Code Lite CLI Performance (Current)

#### Menu Rendering Performance

**Unified Layout Engine (`src/cli/unified-layout-engine.ts`)**:

- **Function**: `calculateMenuLayout()` - Menu layout calculation
- **Current Implementation**: Synchronous calculation with theme resolution
- **Key Performance Factors**:
  - Content measurement: String length calculations for menu items
  - Width optimization: Dynamic separator length calculation
  - Height management: Consistent layout height calculation
  - Theme resolution: Color/style mapping for menu elements

**Expected Baseline Measurements**:

```typescript
interface MenuRenderingBaseline {
  simple_menu: {
    calculation_time: "< 5ms";     // calculateMenuLayout()
    render_time: "< 10ms";         // complete menu rendering
    total_response: "< 15ms";      // user input → display
  };
  complex_menu: {
    calculation_time: "< 15ms";    // menus with 10+ items
    render_time: "< 25ms";         // complex theme rendering
    total_response: "< 40ms";      // user input → display
  };
  skin_switching: {
    theme_resolution: "< 5ms";     // resolveTheme() function
    layout_recalculation: "< 10ms"; // full layout update
    total_switch: "< 20ms";        // theme change complete
  };
}
```

#### Interactive Navigation Performance

**Interaction Manager (`src/cli/interaction-manager.ts`)**:

- **Function**: Keyboard input handling and mode switching
- **Current Implementation**: Readline-based input with mode detection
- **Key Performance Factors**:
  - Input detection latency: Readline event processing
  - Mode switching: Menu ↔ Command mode transitions
  - Option resolution: Number/command mapping to actions

**Expected Baseline Measurements**:

```typescript
interface InteractionBaseline {
  input_response: {
    key_detection: "< 5ms";        // keyboard input detection
    mode_switch: "< 10ms";         // menu ↔ command mode
    option_resolution: "< 5ms";    // map input to action
    total_input_cycle: "< 20ms";   // input → action resolution
  };
  navigation: {
    menu_traversal: "< 15ms";      // menu navigation response
    command_parsing: "< 10ms";     // text command parsing
    error_handling: "< 5ms";       // invalid input handling
  };
}
```

#### Skin Menu Renderer Performance

**Skin Menu Renderer (`src/cli/skin-menu-renderer.ts`)**:

- **Function**: Bridge between menu content and layout engine
- **Current Implementation**: PCL-Skins architecture with skin context management
- **Key Performance Factors**:
  - Skin loading: JSON skin definition loading
  - Context management: SkinContext building and validation
  - Rendering coordination: Layout calculation + theme application

**Expected Baseline Measurements**:

```typescript
interface SkinRendererBaseline {
  skin_operations: {
    context_building: "< 2ms";     // SkinContext construction
    skin_validation: "< 5ms";      // validateSkinDefinition()
    layout_integration: "< 8ms";   // unified layout coordination
    total_render_cycle: "< 20ms";  // complete skin rendering
  };
  metrics_tracking: {
    performance_recording: "< 1ms"; // renderingMetrics updates
    context_switching: "< 5ms";     // skin context changes
  };
}
```

### Memory Usage Baseline (Current PCL)

#### Process Memory Profile

**Core Components Memory Usage**:

```typescript
interface MemoryBaseline {
  startup: {
    initial_heap: "< 50MB";        // fresh process startup
    cli_components: "< 30MB";      // CLI system components
    skin_engine: "< 20MB";         // skin rendering system
    total_startup: "< 100MB";      // complete system ready
  };
  runtime: {
    active_session: "< 80MB";      // typical interactive session
    menu_cache: "< 10MB";          // rendered menu cache
    skin_definitions: "< 15MB";    // loaded skin definitions
    peak_usage: "< 150MB";         // maximum observed usage
  };
  scaling: {
    per_skin: "< 5MB";             // additional memory per skin
    per_menu_level: "< 2MB";       // memory per navigation level
    cache_cleanup: "auto";         // automatic memory management
  };
}
```

#### Component-Specific Memory Patterns

**Unified Layout Engine**:

- **Layout calculations**: Minimal memory footprint (temporary calculations)
- **Theme caching**: Static theme definitions, low memory impact
- **Render output**: Temporary string building, garbage collected

**Interaction Manager**:

- **Readline interface**: Single instance, persistent minimal memory
- **Input buffers**: Small temporary buffers for command processing
- **Session context**: Lightweight context objects

**Skin Menu Renderer**:

- **Skin cache**: Map-based caching with configurable limits
- **Context objects**: Small context objects per rendering operation
- **Metrics storage**: Map-based performance metrics tracking

### Startup Time Baseline (Current PCL)

#### System Initialization Sequence

```typescript
interface StartupBaseline {
  components: {
    core_foundation: "< 200ms";    // Foundation system init
    config_manager: "< 150ms";     // Configuration loading
    session_manager: "< 100ms";    // Session system setup
    cli_components: "< 300ms";     // CLI system components
    menu_system: "< 200ms";        // Menu and interaction systems
    total_startup: "< 1000ms";     // Complete system ready
  };
  cold_start: {
    first_run: "< 1500ms";         // First-time initialization
    config_generation: "< 300ms";  // Default config generation
    validation_checks: "< 200ms";  // System validation
  };
}
```

## Performance Measurement Strategy

### Automated Performance Testing

#### Test Suite Implementation

```typescript
/**
 * Performance Test Suite for Baseline Establishment
 */
export interface PerformanceTestSuite {
  // Menu rendering performance tests
  testMenuRenderingPerformance(): Promise<MenuRenderingResults>;
  testSkinSwitchingPerformance(): Promise<SkinSwitchingResults>;
  
  // Interaction performance tests  
  testInputResponseTimes(): Promise<InteractionResults>;
  testModeTransitionPerformance(): Promise<TransitionResults>;
  
  // Memory usage tests
  testMemoryUsagePatterns(): Promise<MemoryResults>;
  testMemoryLeakDetection(): Promise<LeakDetectionResults>;
  
  // System startup tests
  testStartupPerformance(): Promise<StartupResults>;
  testColdStartPerformance(): Promise<ColdStartResults>;
}
```

#### Measurement Tools and Techniques

**Performance Measurement Infrastructure**:

1. **High-Resolution Timing**:

   ```typescript
   const startTime = performance.now();
   // ... operation ...
   const endTime = performance.now();
   const duration = endTime - startTime;
   ```

2. **Memory Usage Monitoring**:

   ```typescript
   const memoryBefore = process.memoryUsage();
   // ... operation ...
   const memoryAfter = process.memoryUsage();
   const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;
   ```

3. **System Resource Monitoring**:

   ```typescript
   const cpuBefore = process.cpuUsage();
   // ... operation ...
   const cpuAfter = process.cpuUsage(cpuBefore);
   ```

### Target System Requirements (Post-Separation)

#### CLI→VSCode Adaptation Requirements

**Performance Preservation Strategy**:

- **Layout Engine Adaptation**: Maintain <20ms layout calculation performance
- **Theme System Compatibility**: Preserve theme resolution speed (<5ms)
- **Context Management**: Maintain context switching performance (<5ms)

**VSCode Interface Targets**:

```typescript
interface VSCodeAdaptationTargets {
  tree_view_rendering: {
    data_provider_refresh: "< 30ms";    // TreeView data refresh
    node_expansion: "< 20ms";           // Tree node expansion
    selection_handling: "< 10ms";       // Selection change processing
  };
  webview_panels: {
    content_loading: "< 100ms";         // Webview content loading
    message_handling: "< 15ms";         // Webview message processing
    state_updates: "< 25ms";            // Panel state updates
  };
  command_execution: {
    command_registration: "< 5ms";      // VSCode command registration
    command_execution: "< 50ms";        // Command execution routing
    result_display: "< 30ms";           // Result presentation
  };
}
```

#### IPC Communication Performance

**Service Communication Requirements**:

```typescript
interface IPCPerformanceTargets {
  message_latency: {
    request_response: "< 10ms";         // Single request/response cycle
    notification: "< 5ms";              // One-way notification
    heartbeat: "< 2ms";                 // Health check ping
  };
  throughput: {
    messages_per_second: "> 1000";      // Message processing rate
    concurrent_connections: "> 10";     // Simultaneous connections
    queue_processing: "< 5ms";          // Message queue processing
  };
  reliability: {
    connection_establishment: "< 50ms";  // Initial connection setup
    reconnection_time: "< 100ms";       // Connection recovery
    timeout_handling: "< 20ms";         // Timeout detection/handling
  };
}
```

#### Cross-Interface State Synchronization

**State Management Performance**:

```typescript
interface StateSyncPerformanceTargets {
  synchronization: {
    state_update_broadcast: "< 25ms";   // Broadcast to all interfaces
    state_merge: "< 10ms";              // Merge state updates
    conflict_resolution: "< 15ms";      // Handle state conflicts
    total_sync_cycle: "< 150ms";        // Complete sync operation
  };
  persistence: {
    state_serialization: "< 20ms";      // Convert state to storage format
    state_deserialization: "< 15ms";    // Load state from storage
    incremental_updates: "< 10ms";      // Apply partial updates
  };
}
```

## Validation Strategy

### Performance Regression Testing

#### Continuous Performance Monitoring

```typescript
interface PerformanceValidation {
  // Automated regression detection
  regression_thresholds: {
    performance_degradation: "< 50%";   // Maximum acceptable degradation
    memory_increase: "< 100%";          // Maximum memory increase
    latency_increase: "< 200%";         // Maximum latency increase
  };
  
  // Validation checkpoints
  validation_points: {
    pre_separation: "baseline_establishment";
    post_architecture_poc: "architecture_validation";
    post_component_transfer: "integration_validation";
    final_validation: "production_readiness";
  };
}
```

#### Performance Benchmarking Process

1. **Baseline Measurement**: Establish current system performance
2. **Architecture POC Validation**: Validate performance assumptions
3. **Component Transfer Validation**: Measure impact of each component transfer
4. **Integration Testing**: Validate complete system performance
5. **Production Readiness**: Final performance validation

### Risk Assessment

#### High-Risk Performance Areas

1. **CLI→VSCode Adaptation**:
   - Risk: Significant performance degradation in UI rendering
   - Mitigation: Proof-of-concept validation required
   - Success Criteria: <50% performance degradation

2. **IPC Communication Overhead**:
   - Risk: Communication latency exceeds targets
   - Mitigation: Local IPC optimization, connection pooling
   - Success Criteria: <10ms average latency

3. **State Synchronization Complexity**:
   - Risk: Cross-interface sync creates bottlenecks
   - Mitigation: Efficient state diffing, incremental updates
   - Success Criteria: <150ms complete sync cycle

4. **Memory Usage Scaling**:
   - Risk: Multiple interfaces cause memory bloat
   - Mitigation: Shared state management, efficient caching
   - Success Criteria: <200MB total memory usage

## Implementation Recommendations

### Performance-First Development Approach

1. **Measure Early**: Establish baselines before any architectural changes
2. **Validate Assumptions**: Test performance assumptions with proof-of-concepts
3. **Monitor Continuously**: Track performance throughout development
4. **Optimize Proactively**: Address performance issues before they compound

### Architecture Decisions for Performance

1. **Component Transfer Strategy**: Prioritize performance-critical components first
2. **IPC Protocol Selection**: Choose optimal protocol based on measured requirements
3. **Caching Strategy**: Implement intelligent caching for skin definitions and state
4. **Resource Management**: Design for efficient resource utilization across interfaces

---

**Next Steps**:

1. Implement performance measurement infrastructure
2. Execute baseline performance tests on current PCL system
3. Create architectural proof-of-concepts with performance validation
4. Establish continuous performance monitoring for separation project
