---
date: 2025-09-13T130000Z
name: templum-cli-current-architecture-data-flow-analysis
TASK-ID: ['TASK-ARCH-001']
category: architecture-analysis
status: ['[x]']
patterns: [data-flow-analysis, architecture-documentation, system-visualization]
components: [templum-core, cli-adapter, backend-service-router, skin-engine, service-discovery]
dependencies: [mermaid-diagrams, architecture-analysis, current-state-documentation]
tags: [architecture, data-flow, cli-design, system-analysis]
---

# Templum Current Architecture - Data Flow Analysis

This document provides a comprehensive analysis of the current Templum data architecture and flow, showing how data moves through the system from backend discovery to user interface rendering. This analysis enables understanding where changes need to be made for the CLI 2.1 design implementation.

## 1. System Overview & Core Orchestration

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Core Orchestration Layer"
        TC[TemplumCore<br/>Main Orchestrator]
        AR[Adapter Registry<br/>Dependency Injection]
        UIM[Universal Interface Manager]
    end
    
    subgraph "Interface Adapters"
        CLI[CLI Adapter]
        VSC[VSCode Adapter]  
        CMD[Command Adapter]
    end
    
    subgraph "Backend Integration"
        BSR[Backend Service Router]
        SD[Service Discovery]
        CF[Connection Factory]
        DCR[Dynamic Command Router]
    end
    
    subgraph "Rendering & State"
        USE[Universal Skin Engine]
        SM[State Manager]
        RM[Resource Manager]
    end
    
    TC --> AR
    AR --> UIM
    TC --> CLI
    TC --> VSC
    TC --> CMD
    TC --> BSR
    BSR --> SD
    BSR --> CF
    BSR --> DCR
    TC --> USE
    TC --> SM
    TC --> RM
```

### Data Flow Description

The **TemplumCore** serves as the central orchestrator, initialized with dependency injection through the **Adapter Registry**. It coordinates all interface adapters (CLI, VSCode, Command), manages backend connections through the **Backend Service Router**, and maintains global state.

**Key Components:**

- **TemplumCore**: Main event-driven orchestrator managing system lifecycle
- **Adapter Registry**: Provides dependency injection for loose coupling between components
- **Universal Interface Manager**: Handles switching between interface modalities while maintaining state
- **Interface Adapters**: Provide interface-specific rendering and interaction handling
- **Backend Service Router**: Manages all backend service connections and health monitoring
- **Universal Skin Engine**: Processes and renders skin definitions from backends

**Data Flow Pattern:** The core uses an event-driven architecture where components communicate through EventEmitter patterns, ensuring loose coupling and reactive state management.

## 2. Backend Service Discovery & Connection Flow

### Discovery Sequence Diagram

```mermaid
sequenceDiagram
    participant TC as TemplumCore
    participant BSR as Backend Service Router
    participant SD as Service Discovery
    participant REG as Registry Strategy
    participant DIR as Directory Scanner
    participant CF as Connection Factory
    participant BE as Backend Service
    
    TC->>BSR: discoverAndConnect()
    BSR->>SD: discoverServices()
    
    par Registry Discovery (Priority 100)
        SD->>REG: Check ~/.templum/service-registry.json
        REG->>REG: Validate PID alive
        REG->>SD: Return legacy services
    and Directory Discovery (Priority 100)
        SD->>DIR: Scan ~/.templum/services/*.json
        DIR->>DIR: Check process running
        DIR->>SD: Return active services
    end
    
    SD->>BSR: Return discovered services
    
    loop For each service
        BSR->>CF: create(serviceId, backendConfig)
        CF->>BE: Connect (IPC/HTTP/WebSocket/gRPC)
        BE->>CF: Connection established
        CF->>BSR: Return BackendConnection
        BSR->>BSR: Store connection & health status
    end
    
    BSR->>TC: Discovery complete with status
```

### Discovery Flow Description

Service discovery uses a **multi-strategy approach** with priority-based execution:

1. **Registry-based discovery** (priority 100):
   - Checks legacy single registry file `~/.templum/service-registry.json`
   - Scans services directory `~/.templum/services/*.json` for auto-registration
   - Validates process IDs are still running
   - Auto-cleans stale service entries

2. **Configuration-based discovery** (priority 75):
   - Reads from user-defined configuration files
   - Supports manual backend definitions with authentication

3. **Endpoint scanning** (priority 50):
   - Scans configured ports for `/api/skin` endpoints
   - Tests multiple protocols (HTTP, WebSocket, IPC)
   - Lower confidence but enables discovery of undocumented services

**File System Watching:** The system includes real-time backend detection using **chokidar**. When a backend starts, it creates a JSON file in `~/.templum/services/` with connection details, triggering immediate discovery.

**Connection Factory:** Creates protocol-specific connections (IPC, HTTP, WebSocket, gRPC) based on each backend's `BackendConfig` specification.

## 3. Skin Definition Processing Flow

### Skin Processing Pipeline

```mermaid
graph LR
    subgraph "Backend Service"
        BSD[Backend Skin Definition]
        API[/api/skin endpoint]
        HEALTH[/api/health endpoint]
    end
    
    subgraph "Skin Loading Process"
        BSR[Backend Service Router]
        SL[Skin Loader]
        USE[Universal Skin Engine]
        VM[Version Manager]
    end
    
    subgraph "Skin Components"
        USD[UniversalSkinDefinition]
        BC[BackendConfig]
        TD[ThemeDefinitions]
        MD[Menu Definitions]
        CD[Command Definitions]
        VD[View Definitions]
        WF[Workflows]
    end
    
    subgraph "Registration & Storage"
        SR[Skin Registry]
        VC[Version Control]
        CI[Conflict Resolution]
    end
    
    BSD --> API
    API --> BSR
    BSR --> SL
    SL --> USD
    USD --> BC
    USD --> TD
    USD --> MD
    USD --> CD
    USD --> VD
    USD --> WF
    SL --> USE
    USE --> VM
    VM --> SR
    SR --> VC
    VC --> CI
    HEALTH --> BSR
```

### Skin Definition Data Structure

**UniversalSkinDefinition** contains self-describing backend interface specifications:

- **BackendConfig**: Protocol (IPC/HTTP/WebSocket/gRPC), endpoint, authentication, health endpoints
- **Themes**: Color palettes, typography systems, spacing, borders, shadows, animations
- **Menus**: CLI menu structures, navigation paths, dynamic content
- **Commands**: Available commands, argument specifications, help text
- **Views**: VSCode tree views, panels, webview configurations
- **Workflows**: Multi-step automation sequences

**Processing Flow:**

1. Backend provides skin definition via API endpoint
2. **Skin Loader** fetches and validates the definition
3. **Universal Skin Engine** registers with version management
4. **Version Manager** handles conflicts using resolution strategies
5. **Skin Registry** stores processed skins for cross-interface use

**PCL Integration:** The **PCL Rendering Adapter** enables 70% code reuse from Phoenix Code Lite patterns for consistent UX across interfaces.

## 4. CLI Interface Data Flow

### CLI State Machine

```mermaid
stateDiagram-v2
    [*] --> Initialize
    Initialize --> LoadMenuRegistry
    LoadMenuRegistry --> RenderMenu
    
    state RenderMenu {
        [*] --> GetMenuData
        GetMenuData --> ApplyTheme
        ApplyTheme --> LayoutEngine
        LayoutEngine --> ConsoleOutput
    }
    
    ConsoleOutput --> WaitForInput
    
    state WaitForInput {
        [*] --> ReadlineInterface
        ReadlineInterface --> ProcessInput
    }
    
    state ProcessInput {
        KeyboardInput --> NavigationCommand
        KeyboardInput --> MenuSelection
        KeyboardInput --> CommandExecution
        KeyboardInput --> SearchMode
        KeyboardInput --> BackendManagement
    }
    
    NavigationCommand --> UpdateHistory
    MenuSelection --> ExecuteAction
    CommandExecution --> RouteToBackend
    SearchMode --> InteractiveSearch
    BackendManagement --> LoadSkin
    
    UpdateHistory --> RenderMenu
    ExecuteAction --> RenderMenu
    RouteToBackend --> DisplayResult
    InteractiveSearch --> HandleSearchResult
    LoadSkin --> SwitchInterface
    
    DisplayResult --> WaitForInput
    HandleSearchResult --> RenderMenu
    SwitchInterface --> RenderMenu
```

### CLI Interface Components

**Key CLI Components:**

- **CLI Adapter**: Main interface coordinator (`CLIInterfaceAdapter`)
- **Menu Registry**: Manages skin-defined and fallback menus (`UniversalMenuRegistry`)
- **Interactive Menu Renderer**: Handles display and navigation (`InteractiveMenuRenderer`)
- **Universal Layout Engine**: Consistent formatting across interfaces (`UniversalLayoutEngine`)
- **Terminal UI Components**: Reusable UI elements with theming support
- **Session Context Foundation**: Maintains navigation history and session state

**Data Flow Stages:**

1. **Initialization**: Setup readline interface, load menu registry, initialize themes
2. **Menu Loading**: Get current menu data from registry or skin definitions
3. **Rendering**: Apply theme, calculate layout, output to console
4. **Input Processing**: Handle keyboard input through readline interface
5. **Command Routing**: Route commands to backends or local handlers
6. **State Management**: Update navigation history, session context

**Interactive Features:**

- **Arrow key navigation** with visual selection indicators
- **Interactive search** with fuzzy matching across menus and commands
- **Backend management** commands (load, unload, status, refresh)
- **Session persistence** with navigation history

## 5. Menu Navigation & Rendering Pipeline

### Menu Rendering Pipeline

```mermaid
graph TD
    subgraph "Menu Data Sources"
        SD[Skin Definition Menus]
        DM[Default Menu Registry]
        DS[Dynamic System State]
    end
    
    subgraph "Menu Processing"
        MR[Menu Registry]
        IMR[Interactive Menu Renderer]
        DCE[Display Consistency Engine]
        SOM[Service Ordering Manager]
    end
    
    subgraph "Layout & Rendering"
        ULE[Universal Layout Engine]
        TUI[Terminal UI Components]
        TC[Theme Controller]
        CF[Chalk Formatter]
    end
    
    subgraph "Output Structure"
        WIN[Window Border]
        TTL[Title Bar - Centered]
        PD[Page Description]
        CNT[Page Content]
        MI[Menu Items - Numbered]
        SEP[Menu Separator ───]
        NAV[Navigation: Back/Home/Help/Exit]
    end
    
    SD --> MR
    DM --> MR
    DS --> IMR
    MR --> IMR
    IMR --> DCE
    DCE --> SOM
    SOM --> ULE
    ULE --> TUI
    TUI --> TC
    TC --> CF
    CF --> WIN
    WIN --> TTL
    TTL --> PD
    PD --> CNT
    CNT --> MI
    MI --> SEP
    SEP --> NAV
```

### Menu Data Processing Description

**Menu Data Sources:**

- **Skin Definition Menus**: Backend-provided menu structures
- **Default Menu Registry**: Fallback menus for core Templum functionality  
- **Dynamic System State**: Real-time backend status, connection info

**Processing Pipeline:**

1. **Menu Registry** manages loaded skins and their menu definitions
2. **Interactive Menu Renderer** updates dynamic content (backend status, capabilities)
3. **Display Consistency Engine** enforces width standards, padding rules
4. **Service Ordering Manager** orders backends (connected first, then alphabetical)
5. **Universal Layout Engine** calculates window dimensions, content positioning
6. **Terminal UI Components** provide reusable elements (borders, separators, themes)
7. **Theme Controller** applies color schemes, typography
8. **Chalk Formatter** handles terminal color output

**Current Menu Structure (CLI 1.0):**

- Simple list with emoji icons
- Basic navigation with numbered selections
- Inline status display
- Mixed connected/disconnected service listing

## 6. Command Execution Flow

### Command Routing Sequence

```mermaid
sequenceDiagram
    participant User
    participant CLI as CLI Adapter
    participant TC as TemplumCore
    participant DCR as Dynamic Command Router
    participant BSR as Backend Service Router
    participant BC as Backend Connection
    participant BE as Backend Service
    
    User->>CLI: Enter command
    CLI->>CLI: processInteractiveInput(command)
    
    alt Backend Command Route
        CLI->>TC: executeCommand(command, interface, args)
        TC->>DCR: routeCommand(command)
        DCR->>DCR: Lookup command mapping
        DCR->>BSR: executeCommand(backendId, command, args)
        BSR->>BC: Send protocol message
        BC->>BE: IPC/HTTP/WebSocket request
        BE->>BC: Response with result
        BC->>BSR: Parsed response
        BSR->>DCR: Command result
        DCR->>TC: Execution result
        TC->>CLI: Command output
        CLI->>User: Display formatted result
    else Local Command Route
        CLI->>CLI: Check local command registry
        CLI->>CLI: Execute built-in handler
        alt Navigation Command
            CLI->>CLI: Update menu state
            CLI->>CLI: Re-render interface
        else System Command  
            CLI->>CLI: Execute system function
        end
        CLI->>User: Display result
    end
```

### Command Types & Routing

**Command Categories:**

1. **Backend Commands**: Routed to specific backend services via Dynamic Command Router
2. **Navigation Commands**: Local handling for menu navigation (back, home, help)
3. **System Commands**: Local CLI management (status, refresh, search, backends)
4. **Backend Management**: Special commands for loading/unloading backend skins

**Dynamic Command Router:**

- Maintains mapping of command IDs to backend connections
- Automatically populated from skin definitions during backend registration
- Enables zero-hardcoded command routing
- Supports command aliases and help text extraction

**Protocol Support:**

- **IPC**: JSON message passing over named pipes/sockets
- **HTTP**: REST API calls with JSON payloads  
- **WebSocket**: Real-time bidirectional messaging
- **gRPC**: High-performance binary protocol (planned)

**Error Handling:**

- Circuit breaker patterns for unhealthy backends
- Graceful fallback to local command registry
- Timeout management per protocol
- Connection retry with exponential backoff

## 7. State Synchronization Architecture

### State Management Flow

```mermaid
graph TB
    subgraph "State Sources"
        BS[Backend State Changes]
        UI[User Interface Actions]
        SS[Session Navigation]
        BH[Backend Health Updates]
    end
    
    subgraph "State Management Layer"
        SC[Session Context Foundation]
        ESS[Enhanced State Synchronization]
        SM[State Manager]
        EM[Event Manager]
    end
    
    subgraph "State Consumers"
        CLI[CLI Interface]
        VSC[VSCode Interface] 
        CMD[Command Interface]
        MR[Menu Registry]
    end
    
    subgraph "Persistence"
        MEM[In-Memory Cache]
        HIST[Navigation History]
        PREFS[User Preferences]
    end
    
    BS --> ESS
    UI --> SC
    SS --> SC
    BH --> SM
    
    SC --> ESS
    ESS --> SM
    SM --> EM
    
    EM --> CLI
    EM --> VSC
    EM --> CMD
    EM --> MR
    
    SM --> MEM
    SC --> HIST
    CLI --> PREFS
```

### State Synchronization Description

**State Management Components:**

- **Session Context Foundation**: Per-session state management with unique session IDs
- **Enhanced State Synchronization**: Cross-interface state propagation
- **State Manager**: Central state store with event emission
- **Event Manager**: Coordinates state change notifications

**State Categories:**

1. **Navigation State**: Current menu, history stack, breadcrumbs
2. **Backend State**: Connection status, health, capabilities, loaded skins
3. **Interface State**: Theme selection, window dimensions, user preferences  
4. **Session State**: Active sessions, timeout management, user context

**Synchronization Patterns:**

- **Event-driven updates**: State changes emit events to all registered listeners
- **Cross-interface consistency**: UI updates propagate between CLI/VSCode/Command modes
- **Lazy loading**: State fetched on-demand to minimize memory usage
- **Debounced updates**: Rapid state changes batched to prevent UI flicker

**Persistence Strategy:**

- **In-memory cache** for active session data
- **Navigation history** stored per session with size limits
- **User preferences** persisted to configuration files
- **Backend state** cached with TTL for performance

## 8. Current Issues & Data Flow Problems

### Issues Affecting CLI 2.1 Implementation

Based on the architecture analysis, here are the key data flow issues that need resolution for CLI 2.1:

#### 8.1 Window/Page Structure Issues

**Problem**: The current system doesn't have clear separation between Window, Page, and Menu components. Everything renders as a single output block.

**Current Flow**:

```
MenuData → LayoutEngine → ConsoleOutput
```

**Required Flow**:

```  
MenuData → WindowManager → PageRenderer → ContentLayout → ConsoleOutput
```

**Impact**: Cannot implement the nested window structure required by CLI 2.1 design (Window > Page > Content).

#### 8.2 Menu Data Routing Problems

**Problem**: Menu navigation is partially hardcoded rather than fully skin-driven. The path from menu item to page isn't dynamically determined.

**Current Issues**:

- Hardcoded menu IDs and navigation paths
- Backend services listed separately from menu structure
- No dynamic page generation from skin definitions

**Required Changes**:

- Full skin-driven menu routing
- Dynamic page generation based on backend capabilities
- Integrated service listing within menu hierarchy

#### 8.3 Backend Skin Interface Switching

**Problem**: The "load" command loads backend skins but doesn't fully switch interface context - commands are available but menu structure doesn't change.

**Current Behavior**:

```
load pcl → LoadSkin → RegisterCommands → (Menu unchanged)
```

**Required Behavior**:

```
load pcl → LoadSkin → SwitchInterface → UpdateMenus → ReRender
```

**Missing Components**:

- Interface context switching
- Menu structure replacement from skin
- Dynamic interface generation

#### 8.4 Service Display & Ordering

**Problem**: Backend services aren't consistently ordered (connected first, alphabetical) in displays.

**Current Issues**:

- Mixed ordering in different contexts
- Inconsistent status display (Connected/Disconnected vs Health)
- Service info scattered across different commands

**Required Implementation**:

- Consistent service ordering: Connected → Alphabetical, Disconnected → Alphabetical
- Unified status display: Connected services show health, Disconnected services show "Disconnected"
- Centralized service information management

#### 8.5 Navigation Consistency

**Problem**: The Back/Home/Help/Exit menu isn't consistently shown on all pages.

**Current Implementation**:

- Some pages show "Press Enter to continue"
- Navigation options vary by page type
- Inconsistent menu separators

**Required Changes**:

- All pages must have consistent navigation footer
- Standardized menu separator: `───────────`
- Home page Back/Home options greyed out

#### 8.6 Input Handling Architecture

**Problem**: Input is handled inline rather than in a positioned TextBox component.

**Current Flow**:

```
ReadlineInterface → ProcessInput → DisplayResult
```

**Required Flow**:

```
WindowRenderer → TextBoxPositioning → ReadlineInterface → ProcessInput
```

**Missing Components**:

- TextBox positioning system
- Input area coordinate management
- Dynamic input field rendering

#### 8.7 Status Display Integration

**Problem**: Connection/Health status shown separately rather than unified display.

**Current Issues**:

- Separate "status" command for backend health
- Service list doesn't integrate with status display
- Health information scattered across different views

**Required Integration**:

- Unified status in service listings
- Consistent health/connection terminology
- Integrated capability information

### Priority Fixes for CLI 2.1

1. **High Priority**: Window/Page structure separation
2. **High Priority**: Menu routing from skin definitions
3. **Medium Priority**: Backend interface switching
4. **Medium Priority**: Service ordering and status display
5. **Low Priority**: TextBox positioning
6. **Low Priority**: Navigation consistency

This architecture analysis provides the foundation for implementing CLI 2.1 by identifying exactly where the current data flow needs modification to support the new windowed interface design.
