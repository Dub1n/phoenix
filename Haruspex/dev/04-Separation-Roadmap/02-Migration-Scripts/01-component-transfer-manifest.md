# Component Transfer Manifest - PCL to Templum Migration

## Overview

This manifest provides the detailed component-by-component transfer plan for migrating Phoenix Code Lite infrastructure to Templum, ensuring systematic and trackable migration progress.

## Phase 1: Direct Transfer Components

### Configuration & Foundation

#### 1. Configuration Management

- **Source**: `phoenix-code-lite/src/config/settings.ts`
- **Target**: `Templum/src/config/templum-config.ts`
- **Dependencies**: `config/templates.ts`, `core/config-manager.ts`
- **Modifications**: Add multi-backend configuration schema
- **Validation**: Configuration loading, validation, and hot reloading tests

#### 2. Error Handling Infrastructure  

- **Source**: `phoenix-code-lite/src/core/error-handler.ts`
- **Target**: `Templum/src/core/error-handler.ts`
- **Dependencies**: `utils/audit-logger.ts`
- **Modifications**: Extend for cross-interface error contexts
- **Validation**: Error categorization, recovery, and logging tests

#### 3. Audit Logging System

- **Source**: `phoenix-code-lite/src/utils/audit-logger.ts`
- **Target**: `Templum/src/utils/audit-logger.ts`
- **Dependencies**: None (standalone utility)
- **Modifications**: Add multi-backend audit trail support
- **Validation**: Security audit trails and compliance tests

#### 4. Testing Infrastructure

- **Source**: `phoenix-code-lite/tests/` structure, `jest.config.js`
- **Target**: `Templum/tests/` structure, configuration files
- **Dependencies**: Test utilities, mock frameworks
- **Modifications**: Extend mocks for multi-interface testing
- **Validation**: Complete test suite execution with coverage >80%

### Core Interface Components

#### 5. Unified Layout Engine

- **Source**: `phoenix-code-lite/src/cli/unified-layout-engine.ts`
- **Target**: `Templum/src/rendering/universal-layout-engine.ts`
- **Dependencies**: `chalk` (color handling)
- **Modifications**:
  - Add interface-specific rendering methods
  - Extend `SkinMenuDefinition` for VSCode TreeView support
  - Add command-line interface layout calculations
- **Validation**: Multi-interface rendering consistency tests

#### 6. Menu Content Converter

- **Source**: `phoenix-code-lite/src/cli/menu-content-converter.ts`
- **Target**: `Templum/src/rendering/menu-content-converter.ts`
- **Dependencies**: `menu-types.ts`, `unified-layout-engine.ts`
- **Modifications**:
  - Add VSCode TreeView conversion functions
  - Extend command-line interface conversion
  - Add backend-specific menu context handling
- **Validation**: Conversion accuracy and backward compatibility tests

## Phase 2: Enhanced Transfer Components

### Registry Systems

#### 7. Menu Registry Enhancement

- **Source**: `phoenix-code-lite/src/core/menu-registry.ts`
- **Target**: `Templum/src/menus/universal-menu-registry.ts`
- **Dependencies**: `menu-definitions.ts`, skin system
- **Modifications**:
  - Add multi-backend menu storage and retrieval
  - Implement skin inheritance and priority system
  - Add menu versioning and compatibility management
- **Validation**: Multi-backend menu loading and priority resolution tests

#### 8. Command Registry Enhancement  

- **Source**: `phoenix-code-lite/src/core/command-registry.ts`
- **Target**: `Templum/src/commands/universal-command-registry.ts`
- **Dependencies**: `command-execution.ts`, audit logging
- **Modifications**:
  - Add backend service routing logic
  - Implement cross-interface command context switching
  - Extend audit logging for multi-backend operations
- **Validation**: Command routing accuracy and audit trail completeness tests

### Interface Management

#### 9. Skin Menu Renderer Enhancement

- **Source**: `phoenix-code-lite/src/cli/skin-menu-renderer.ts`
- **Target**: `Templum/src/rendering/universal-skin-renderer.ts`
- **Dependencies**: `unified-layout-engine.ts`, theme system
- **Modifications**:
  - Add VSCode TreeView and Panel rendering
  - Implement command-line interface rendering
  - Extend theme system for cross-interface consistency
  - Add skin caching for performance optimization
- **Validation**: Multi-interface skin rendering and theme consistency tests

#### 10. Interaction Manager Extension

- **Source**: `phoenix-code-lite/src/cli/interaction-manager.ts`
- **Target**: `Templum/src/interfaces/universal-interaction-manager.ts`
- **Dependencies**: `interaction-modes.ts`, readline
- **Modifications**:
  - Add VSCode command palette integration
  - Extend keyboard shortcuts for all interface types
  - Implement cross-interface input validation
  - Add state synchronization across interfaces
- **Validation**: Multi-interface input handling and state sync tests

### Session Management

#### 11. Session Manager Extension

- **Source**: `phoenix-code-lite/src/core/session-manager.ts`
- **Target**: `Templum/src/session/universal-session-manager.ts`
- **Dependencies**: State management, configuration
- **Modifications**:
  - Implement cross-interface session coordination
  - Add multi-backend session context management
  - Create session persistence and recovery mechanisms
- **Validation**: Session continuity across interface switches tests

## Phase 3: New Development (PCL-Inspired)

### Interface Adapters

#### 12. VSCode Interface Adapter

- **Inspiration**: PCL command registration and session patterns
- **Target**: `Templum/src/interfaces/vscode-adapter.ts`
- **Dependencies**: VSCode API, universal components
- **Implementation**:
  - TreeView data providers using Menu Registry patterns
  - WebView panels using Skin Renderer architecture
  - Command registration using Command Registry integration
  - State synchronization with Universal Session Manager
- **Validation**: VSCode extension functionality and integration tests

#### 13. CLI Interface Adapter  

- **Inspiration**: PCL CLI infrastructure and menu system
- **Target**: `Templum/src/interfaces/cli-adapter.ts`
- **Dependencies**: Universal components, readline
- **Implementation**:
  - Interactive menu navigation from PCL Interaction Manager
  - Skin-based menu rendering using transferred components
  - Keyboard shortcut handling using PCL patterns
  - Backend service integration
- **Validation**: CLI functionality and menu navigation tests

#### 14. Command Interface Adapter

- **Inspiration**: PCL command execution patterns
- **Target**: `Templum/src/interfaces/command-adapter.ts`
- **Dependencies**: Command Registry, argument parsing
- **Implementation**:
  - Text command parsing and execution
  - Help generation using skin definitions
  - Parameter validation and error handling
  - Output formatting consistency
- **Validation**: Command-line interface functionality tests

### Backend Integration

#### 15. Backend Service Router

- **Inspiration**: PCL command routing architecture
- **Target**: `Templum/src/backend/service-router.ts`
- **Dependencies**: Communication protocols (IPC, HTTP, WebSocket)
- **Implementation**:
  - Service discovery and connection management
  - Request routing to appropriate backend services
  - Load balancing and failover mechanisms
  - Health monitoring and diagnostics
- **Validation**: Backend communication reliability and performance tests

#### 16. Cross-Interface State Manager

- **Inspiration**: PCL session management patterns
- **Target**: `Templum/src/state/cross-interface-state-sync.ts`
- **Dependencies**: State persistence, notification system
- **Implementation**:
  - Real-time state synchronization across interfaces
  - Conflict resolution for concurrent operations
  - State persistence and recovery mechanisms
  - Change notification and event handling
- **Validation**: State consistency and synchronization reliability tests

## Migration Execution Plan

### Phase 1: Foundation (Week 1)

```bash
# Day 1-2: Configuration and Testing Infrastructure
cp phoenix-code-lite/src/config/settings.ts Templum/src/config/templum-config.ts
cp phoenix-code-lite/src/core/error-handler.ts Templum/src/core/error-handler.ts
cp -r phoenix-code-lite/tests/unit/cli Templum/tests/unit/rendering
# Adapt imports and extend interfaces

# Day 3-4: Core Interface Components  
cp phoenix-code-lite/src/cli/unified-layout-engine.ts Templum/src/rendering/universal-layout-engine.ts
cp phoenix-code-lite/src/cli/menu-content-converter.ts Templum/src/rendering/menu-content-converter.ts
# Extend interfaces for multi-interface support

# Day 5: Validation and Testing
npm test  # Verify all transferred components functional
```

### Phase 2: Enhancement (Week 2)

```bash
# Day 1-3: Registry System Enhancement
cp phoenix-code-lite/src/core/menu-registry.ts Templum/src/menus/universal-menu-registry.ts  
cp phoenix-code-lite/src/core/command-registry.ts Templum/src/commands/universal-command-registry.ts
# Add multi-backend routing and management

# Day 4-5: Interface Management Enhancement
cp phoenix-code-lite/src/cli/skin-menu-renderer.ts Templum/src/rendering/universal-skin-renderer.ts
cp phoenix-code-lite/src/cli/interaction-manager.ts Templum/src/interfaces/universal-interaction-manager.ts  
# Extend for VSCode and multi-interface support
```

### Phase 3: Integration (Week 3)

```bash
# Day 1-2: New Component Development
# Implement VSCode adapter using PCL patterns
# Create CLI adapter leveraging transferred components

# Day 3-5: Backend Integration  
# Implement service router and state synchronization
# Create cross-interface coordination systems
```

## Quality Validation Checklist

### Component Transfer Validation

- [ ] All source files copied with proper attribution
- [ ] Dependencies resolved and updated for Templum context
- [ ] Interfaces extended for multi-interface support
- [ ] Tests transferred and adapted for new architecture
- [ ] Performance benchmarks maintained or improved

### Integration Validation

- [ ] Components integrate seamlessly with Templum architecture
- [ ] Cross-component communication functional
- [ ] State management consistent across all components
- [ ] Error handling comprehensive and unified
- [ ] Configuration system supports all transferred components

### Functionality Validation  

- [ ] All original PCL functionality preserved
- [ ] Enhanced functionality working across all interfaces
- [ ] Backend integration reliable and performant
- [ ] User experience consistent across interface modalities
- [ ] Documentation complete and accurate

## Success Metrics

### Quantitative Metrics

- **Code Reuse**: 83% total reuse (63% direct + 20% pattern) - Target: >60%
- **Test Coverage**: >80% maintained across all transferred components
- **Performance**: Interface switching <100ms, component response <50ms
- **Integration**: 100% of identified components successfully transferred

### Qualitative Metrics

- **Architecture Cleanliness**: Clean separation between interface and backend concerns
- **Maintainability**: Code organization and documentation enable future enhancement
- **Reliability**: System stability and error recovery across all components
- **User Experience**: Consistent functionality across all interface modalities

---

**Total Components**: 16 transferred/created | **Timeline**: 3 weeks | **Success Target**: 83% code reuse with full functionality preservation
