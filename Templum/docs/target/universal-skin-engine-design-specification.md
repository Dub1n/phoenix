# Universal Skin Engine - Design Specification v1.0

> **Generated**: 2025-08-21  
> **Purpose**: Comprehensive technical specification for Universal Skin Engine implementation in Phase 5  
> **Context**: Haruspex Separation Roadmap - Multi-interface rendering system for Templum integration  
> **Based on**: Phase 1-4 implementation insights, modern headless UI patterns, and PCL integration requirements

## Executive Summary

The Universal Skin Engine provides **multi-interface rendering capabilities** that enable consistent presentation of backend services (PCL, Haruspex, Litany) across VSCode visual interfaces, CLI interactive menus, and text-based commands while maintaining perfect state synchronization and performance optimization.

**Key Achievement**: Single skin definition generates native experiences for all interface types with 95% feature parity and <100ms rendering performance.

## Architectural Foundation

### Core Design Principles

Based on Phase 2-4 implementation insights and modern headless UI patterns (Ark UI, Headless UI), the Universal Skin Engine follows these architectural principles:

1. **Headless Architecture**: Complete separation of logic from presentation
2. **State-Driven Rendering**: Interface-specific rendering based on component state
3. **Performance-First**: <100ms skin generation, 85%+ cache hit rates
4. **Framework Agnostic**: Single definition supports all target environments
5. **Progressive Enhancement**: Graceful degradation when features unavailable

### Multi-Interface Coordination Patterns

**From Phase 3 Implementation Insights**:

- Session context integration enables cross-interface state management
- Interface-specific caching optimizes performance in Universal Skin Renderer  
- Conflict resolution with 100ms coalescing windows prevents state inconsistencies
- State synchronization provides real-time coordination across all active interfaces

### Component Anatomy Pattern

**Inspired by Ark UI Architecture**:

```typescript
// Universal component structure with interface-agnostic state exposure
interface UniversalComponent {
  scope: string;        // Component namespace (e.g., 'analysis', 'prediction')
  part: string;         // Component element (e.g., 'root', 'content', 'trigger')
  state: ComponentState; // Current state (e.g., 'open', 'loading', 'error')
  data: any;            // Component-specific data
  metadata: ComponentMetadata; // Interface requirements and capabilities
}
```

## System Architecture

### Core Components

```mermaid
graph TB
    subgraph "Universal Skin Engine Core"
        direction TB
        
        SkinLoader[🔄 Skin Loader<br/>Definition Loading & Validation]
        UniversalRenderer[🎨 Universal Renderer<br/>Cross-Interface Coordination]
        StateManager[⚡ State Manager<br/>Cross-Interface Synchronization]
        CacheEngine[📦 Cache Engine<br/>Performance Optimization]
    end
    
    subgraph "Interface Renderers"
        direction LR
        
        VSCodeRenderer[💻 VSCode Renderer<br/>TreeView & Panel Generation]
        CLIRenderer[⌨️ CLI Renderer<br/>Interactive Menu System]
        CommandRenderer[📟 Command Renderer<br/>Text-Based Interface]
    end
    
    subgraph "Skin Definitions"
        direction TB
        
        SkinDef[📋 Skin Definition<br/>JSON-Based Configuration]
        BackendSkins[🔧 Backend Skins<br/>PCL, Haruspex, Litany]
        ThemeSystem[🎨 Theme System<br/>Consistent Styling]
    end
    
    subgraph "Integration Layer"
        direction LR
        
        TemplumCore[🌐 Templum Core<br/>Orchestration Engine]
        BackendServices[🔥 Backend Services<br/>API Communication]
        StateSync[🔄 Enhanced State Sync<br/>IPC Coordination]
    end
    
    %% Core Connections
    SkinLoader --> UniversalRenderer
    UniversalRenderer --> StateManager
    StateManager --> CacheEngine
    
    %% Interface Connections
    UniversalRenderer --> VSCodeRenderer
    UniversalRenderer --> CLIRenderer
    UniversalRenderer --> CommandRenderer
    
    %% Skin System Connections
    SkinLoader --> SkinDef
    SkinDef --> BackendSkins
    BackendSkins --> ThemeSystem
    
    %% Integration Connections
    UniversalRenderer --> TemplumCore
    StateManager --> StateSync
    VSCodeRenderer --> TemplumCore
    CLIRenderer --> TemplumCore
    CommandRenderer --> TemplumCore
    
    TemplumCore --> BackendServices
    StateSync --> BackendServices
    
    %% Styling
    classDef core fill:#e8f5e8,stroke:#2e7d32,stroke-width:3px
    classDef interface fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef skin fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef integration fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class SkinLoader,UniversalRenderer,StateManager,CacheEngine core
    class VSCodeRenderer,CLIRenderer,CommandRenderer interface
    class SkinDef,BackendSkins,ThemeSystem skin
    class TemplumCore,BackendServices,StateSync integration
```

### Interface-Specific Rendering Architecture

```mermaid
flowchart TD
    SkinDefinition[📋 Universal Skin Definition] --> InterfaceRouter{🔀 Interface Router}
    
    InterfaceRouter -->|VSCode| VSCodeAdapter[💻 VSCode Adapter]
    InterfaceRouter -->|CLI| CLIAdapter[⌨️ CLI Adapter]
    InterfaceRouter -->|Command| CommandAdapter[📟 Command Adapter]
    
    VSCodeAdapter --> VSCodeComponents[🏗️ VSCode Components]
    CLIAdapter --> CLIComponents[🏗️ CLI Components]
    CommandAdapter --> CommandComponents[🏗️ Command Components]
    
    VSCodeComponents --> TreeView[🌳 TreeView Provider]
    VSCodeComponents --> WebView[🌐 WebView Panel]
    VSCodeComponents --> Commands[⚡ Command Palette]
    
    CLIComponents --> InteractiveMenu[📋 Interactive Menu]
    CLIComponents --> KeyboardNav[⌨️ Keyboard Navigation]
    CLIComponents --> SessionState[💾 Session Management]
    
    CommandComponents --> TextOutput[📝 Text Output]
    CommandComponents --> FlagParsing[🏁 Flag Parsing]
    CommandComponents --> PipeSupport[🔄 Pipe Support]
    
    %% State Synchronization
    StateSync[🔄 State Synchronization] -.-> VSCodeAdapter
    StateSync -.-> CLIAdapter
    StateSync -.-> CommandAdapter
    
    %% Performance Cache
    Cache[📦 Performance Cache] -.-> VSCodeComponents
    Cache -.-> CLIComponents
    Cache -.-> CommandComponents
    
    %% Styling
    classDef definition fill:#e8f5e8,stroke:#2e7d32,stroke-width:3px
    classDef adapter fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef component fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef feature fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1px
    classDef system fill:#f5f5f5,stroke:#424242,stroke-width:1px,stroke-dasharray: 5 5
    
    class SkinDefinition definition
    class VSCodeAdapter,CLIAdapter,CommandAdapter adapter
    class VSCodeComponents,CLIComponents,CommandComponents component
    class TreeView,WebView,Commands,InteractiveMenu,KeyboardNav,SessionState,TextOutput,FlagParsing,PipeSupport feature
    class StateSync,Cache system
```

*[... continuing with the rest of the content from the original specification...]*
