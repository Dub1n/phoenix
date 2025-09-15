---
date: 2025-09-13T140000Z
name: templum-cli-2.1-architecture-data-flow-analysis
TASK-ID: ['TASK-ARCH-002']
category: architecture-analysis
status: ['[x]']
patterns: [data-flow-analysis, architecture-documentation, system-visualization, cli-design-2.1]
components: [templum-core, window-management, dynamic-routing, mcp-integration, enhanced-navigation]
dependencies: [mermaid-diagrams, architecture-analysis, cli-design-specification, mcp-agent-interaction]
tags: [architecture, data-flow, cli-design-2.1, system-analysis, change-management]
---

# Templum CLI 2.1 Architecture - Data Flow Analysis

This document provides a comprehensive analysis of the Templum CLI 2.1 architecture and data flow, showing the significant changes from CLI 2.0 and how data moves through the enhanced system from backend discovery to the new windowed user interface rendering. This analysis enables understanding of the major architectural improvements and migration requirements.

## Visual Notation Guide

### Diagram Conventions for Change Visualization

The mermaid diagrams in this document use the following conventions to highlight changes from CLI 2.0 to 2.1:

- **Gray Components**: Deprecated 2.0 features marked for removal
- **Green Components**: New 2.1 features and components
- **Blue Components**: Modified 2.0 features enhanced for 2.1
- **Dotted Lines**: Deprecated data flow paths
- **Thick Lines**: New or enhanced data flow paths
- **Labels**: [2.0 DEPRECATED], [2.1 NEW], [MODIFIED]

## Executive Summary: CLI 2.0 → 2.1 Changes

### Major Architectural Changes

1. **Window Management System (NEW)**: Complete windowed interface with Window→Page→Content hierarchy
2. **Dynamic Routing System (MAJOR CHANGE)**: Skin-definition driven navigation replacing hardcoded menu paths
3. **MCP Agent Integration (NEW)**: Comprehensive MCP server for AI agent interaction via 5 specialized tools
4. **Enhanced Service Management**: Unified status display and consistent service ordering
5. **Cross-Separator Navigation**: Enhanced menu navigation across separator boundaries
6. **Emoji Elimination**: Systematic replacement with text-based indicators
7. **TextBox Positioning**: In-window TextBox positioning instead of below-window input

### Performance and Quality Improvements

- **Response Time**: <200ms target for CLI operations maintained
- **Window Rendering**: <50ms target for window layout calculations
- **MCP Performance**: <100ms target for agent interaction tools
- **Service Discovery**: Enhanced real-time backend detection and health monitoring

## 1. System Overview & Architectural Comparison

### System Architecture: 2.0 vs 2.1 Comparison

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize': '12px'}}}%%        
graph TB
    subgraph "CLI&nbsp;2.0&nbsp;Architecture&nbsp;[DEPRECATED]"
        TC_OLD[TemplumCore<br/>Basic Orchestrator]
        CLI_OLD[CLI Adapter<br/>Simple Menu]
        BSR_OLD[Backend Service Router<br/>Basic Connection]
        MENU_OLD[Menu Registry<br/>Hardcoded Paths]
    end
    
    subgraph "CLI&nbsp;2.1&nbsp;Architecture&nbsp;[NEW]"
        TC_NEW[TemplumCore<br/>Enhanced Orchestrator]
        WM[Window Manager<br/>Bordered Windows] 
        DR[Dynamic Router<br/>Skin-Driven Navigation]
        MCP[MCP Server<br/>Agent Integration]
        ESM[Enhanced Service Manager<br/>Unified Status]
        NAV[Cross-Separator Navigation<br/>Enhanced UX]
        CLI_NEW[CLI Adapter 2.1<br/>Windowed Interface]
    end
    
    subgraph "Data Flow Changes"
        OLD_FLOW[MenuData → LayoutEngine → ConsoleOutput]
        NEW_FLOW[SkinData → WindowManager → PageRenderer → ContentLayout → ConsoleOutput]
    end
    
    TC_OLD -.-> CLI_OLD
    CLI_OLD -.-> BSR_OLD
    BSR_OLD -.-> MENU_OLD
    
    TC_NEW ==> WM
    TC_NEW ==> DR
    TC_NEW ==> MCP
    TC_NEW ==> ESM
    WM ==> CLI_NEW
    DR ==> NAV
    
    classDef deprecated fill:#e0e0e0,stroke:#999,stroke-dasharray: 5 5
    classDef new fill:#d4f4dd,stroke:#4caf50
    classDef modified fill:#e3f2fd,stroke:#2196f3
    
    class TC_OLD,CLI_OLD,BSR_OLD,MENU_OLD,OLD_FLOW deprecated
    class WM,DR,MCP,ESM,NAV,CLI_NEW,NEW_FLOW new
    class TC_NEW modified
```

### Core Orchestration Changes

**CLI 2.0 [DEPRECATED]**:

- Simple event-driven orchestrator
- Direct CLI adapter communication
- Basic menu registry with hardcoded navigation
- Limited state management

**CLI 2.1 [NEW]**:

- **Enhanced Orchestrator** with window management coordination
- **Window Manager** for bordered window rendering with proper visual hierarchy
- **Dynamic Router** enabling skin-definition driven navigation
- **MCP Server** for comprehensive AI agent interaction
- **Enhanced Service Manager** with unified status display and ordering
- **Cross-Separator Navigation** for improved user experience

## 2. Window Management Architecture [2.1 NEW]

### Window System Hierarchy

```mermaid
graph TB
    subgraph "Window Management System [2.1 NEW]"
        WC[WindowConfig<br/>Layout Specification]
        EWL[EnhancedWindowLayoutRenderer<br/>Border Generation]
        WCS[WindowContentSection<br/>Content Organization]
        WCI[WindowContentItem<br/>Individual Elements]
        
        subgraph "Window Layers"
            W[Window<br/>Bordered Container]
            WTB[WindowTitleBar<br/>Centered Title]
            P[Page<br/>Content Area]
            PC[PageContent<br/>Menu Items]
            TB[TextBox<br/>In-Window Input]
        end
        
        subgraph "Layout Calculations"
            WC_CALC[Width Calculator<br/>Content-Based Sizing]
            TC_CALC[Text Centering<br/>Title Positioning]
            PC_CALC[Padding Calculator<br/>3-Character Rule]
        end
    end
    
    WC ==> EWL
    EWL ==> WCS
    WCS ==> WCI
    EWL ==> W
    W ==> WTB
    W ==> P
    P ==> PC
    P ==> TB
    
    EWL ==> WC_CALC
    EWL ==> TC_CALC
    EWL ==> PC_CALC
    
    classDef new fill:#d4f4dd,stroke:#4caf50,stroke-width:2px
    class WC,EWL,WCS,WCI,W,WTB,P,PC,TB,WC_CALC,TC_CALC,PC_CALC new
```

### Window Rendering Data Flow

```mermaid
sequenceDiagram
    participant CLI as CLI Adapter 2.1
    participant WM as Window Manager
    participant EWL as EnhancedWindowLayoutRenderer
    participant TC as Text Calculator
    participant CC as Content Calculator
    participant CR as Console Renderer
    
    Note over CLI,CR: Window Rendering Process [2.1 NEW]
    
    CLI->>WM: renderWindow(windowConfig)
    WM->>EWL: processWindowLayout(config)
    EWL->>CC: calculateOptimalWidth(content)
    CC->>EWL: Return optimal width
    EWL->>TC: centerText(title, width)
    TC->>EWL: Return centered title
    EWL->>EWL: generateBorderedWindow()
    EWL->>CR: renderToConsole(windowString)
    CR->>CLI: Display bordered window
    
    Note over CLI,CR: TextBox Positioning [CHANGED FROM 2.0]
    CLI->>WM: positionTextBox(windowBounds)
    WM->>EWL: calculateTextBoxPosition()
    EWL->>CLI: Return in-window coordinates
```

### Window Layout Components [2.1 NEW]

**WindowLayoutConfig Interface**:

```typescript
interface WindowLayoutConfig {
  title: string;
  subtitle?: string;
  content: WindowContentSection[];
  width?: number; // Auto-calculated if not provided
  theme: TerminalColorTheme;
}
```

**Key Features**:

- **Procedural Width Calculation**: Windows automatically size based on content with 3-character padding
- **Centered Title Rendering**: All titles centered within window borders
- **Unicode Box Drawing**: Proper ┌─┐ │ │ └─┘ border characters
- **Theme Integration**: Full color theme support throughout window components
- **In-Window TextBox**: Input positioned within window boundaries, not below

## 3. Dynamic Routing System [MAJOR CHANGE FROM 2.0]

### Routing Architecture Transformation

```mermaid
graph TB
    subgraph "CLI 2.0 Routing [DEPRECATED]"
        HC_OLD[Hardcoded Commands<br/>Static Menu IDs]
        SP_OLD[Static Paths<br/>Fixed Navigation]
        BL_OLD[Backend List<br/>Separate Display]
    end
    
    subgraph "CLI 2.1 Dynamic Routing [NEW]"
        SD[Skin Definition<br/>Navigation Spec]
        DR[Dynamic Router<br/>Path Resolution]
        PG[Page Generator<br/>Dynamic Creation]
        CR[Command Router<br/>Capability-Based]
        
        subgraph "Route Resolution"
            RR[Route Resolver<br/>Skin-Driven Paths]
            PF[Path Factory<br/>Dynamic Generation]
            CC[Capability Checker<br/>Backend Validation]
        end
    end
    
    subgraph "Data Flow Comparison"
        OLD_ROUTE[User Input → Hardcoded Handler → Static Response]
        NEW_ROUTE[User Input → Skin Lookup → Dynamic Route → Generated Page]
    end
    
    HC_OLD -.-> SP_OLD
    SP_OLD -.-> BL_OLD
    
    SD ==> DR
    DR ==> RR
    RR ==> PF
    PF ==> PG
    DR ==> CR
    CR ==> CC
    
    classDef deprecated fill:#e0e0e0,stroke:#999,stroke-dasharray: 5 5
    classDef new fill:#d4f4dd,stroke:#4caf50
    
    class HC_OLD,SP_OLD,BL_OLD,OLD_ROUTE deprecated
    class SD,DR,PG,CR,RR,PF,CC,NEW_ROUTE new
```

### Skin-Definition Driven Navigation

```mermaid
sequenceDiagram
    participant USER as User
    participant CLI as CLI Adapter 2.1
    participant DR as Dynamic Router
    participant SD as Skin Definition
    participant PG as Page Generator
    participant BSR as Backend Service Router
    
    Note over USER,BSR: Dynamic Navigation Process [2.1 NEW]
    
    USER->>CLI: Select menu item
    CLI->>DR: resolveNavigation(selection, context)
    DR->>SD: lookupNavigation(menuId, itemId)
    SD->>DR: Return navigation spec
    
    alt Backend Service Navigation
        DR->>BSR: getBackendCapabilities(serviceId)
        BSR->>DR: Return backend info
        DR->>PG: generateServicePage(backend, capabilities)
    else System Navigation
        DR->>PG: generateSystemPage(pageSpec)
    end
    
    PG->>CLI: Return generated page config
    CLI->>USER: Display dynamic page
    
    Note over USER,BSR: No Hardcoded Paths [CHANGE FROM 2.0]
```

### Route Resolution Algorithm [2.1 NEW]

**Dynamic Routing Process**:

1. **Menu Selection** → Extract selection context (current page, selected item)
2. **Skin Lookup** → Query skin definition for navigation specification
3. **Capability Check** → Validate backend availability and capabilities
4. **Page Generation** → Create page configuration from skin template
5. **Window Rendering** → Apply window management system for display

**Key Improvements from 2.0**:

- **Zero Hardcoded Paths**: All navigation determined from skin definitions
- **Backend Integration**: Service listings integrated into menu hierarchy
- **Dynamic Generation**: Pages created based on actual backend capabilities
- **Unified Interface**: Same navigation system for Templum and backend services

## 4. MCP Agent Integration Architecture [2.1 NEW]

### MCP Server Architecture

```mermaid
graph TB
    subgraph "MCP Integration System [2.1 NEW]"
        MCP_SERVER[MCP Server<br/>CLI Tools Provider]
        PTY_MGR[PTY Manager<br/>Session Lifecycle]
        TOOL_REG[Tool Registry<br/>5 Core Tools]
        HEALTH_MON[Health Monitor<br/>Performance Tracking]
        
        subgraph "MCP Tools"
            T1[cli-create-session<br/>Session Creation]
            T2[cli-navigate<br/>Keyboard Simulation]
            T3[cli-send-text<br/>Command Input]
            T4[cli-get-state<br/>Status Monitoring]
            T5[cli-destroy-session<br/>Resource Cleanup]
        end
        
        subgraph "Service Integration"
            SR[Service Registry<br/>Auto-Discovery]
            HC[Health Check<br/>Availability Monitoring]
            PM[Performance Monitor<br/><100ms Target]
        end
    end
    
    subgraph "Agent Interaction Flow"
        AGENT[AI Agent<br/>MCP Client]
        SESSION[CLI Session<br/>PTY Instance]
        TEMPLUM[Templum CLI<br/>Target Interface]
    end
    
    MCP_SERVER ==> PTY_MGR
    MCP_SERVER ==> TOOL_REG
    TOOL_REG ==> T1
    TOOL_REG ==> T2
    TOOL_REG ==> T3
    TOOL_REG ==> T4
    TOOL_REG ==> T5
    MCP_SERVER ==> HEALTH_MON
    HEALTH_MON ==> SR
    HEALTH_MON ==> HC
    HEALTH_MON ==> PM
    
    AGENT ==> MCP_SERVER
    PTY_MGR ==> SESSION
    SESSION ==> TEMPLUM
    
    classDef new fill:#d4f4dd,stroke:#4caf50,stroke-width:2px
    class MCP_SERVER,PTY_MGR,TOOL_REG,HEALTH_MON,T1,T2,T3,T4,T5,SR,HC,PM,AGENT,SESSION,TEMPLUM new
```

### MCP Tool Interaction Flow

```mermaid
sequenceDiagram
    participant AGENT as AI Agent
    participant MCP as MCP Server
    participant PTY as PTY Manager
    participant CLI as Templum CLI
    participant SVC as Service Registry
    
    Note over AGENT,SVC: MCP Agent Interaction Process [2.1 NEW]
    
    AGENT->>MCP: cli-create-session(sessionId)
    MCP->>PTY: spawnPTY(sessionId, shell)
    PTY->>CLI: Launch Templum CLI
    CLI->>PTY: Ready state
    PTY->>MCP: Session created
    MCP->>AGENT: Session ready
    
    Note over AGENT,SVC: Navigation and Command Execution
    
    AGENT->>MCP: cli-navigate("arrow-down")
    MCP->>PTY: sendKeypress(arrow-down)
    PTY->>CLI: Key navigation
    CLI->>PTY: Menu update
    PTY->>MCP: State change
    MCP->>AGENT: Navigation result
    
    AGENT->>MCP: cli-send-text("backends")
    MCP->>PTY: sendText("backends")
    PTY->>CLI: Command execution
    CLI->>SVC: Query backend services
    SVC->>CLI: Backend list
    CLI->>PTY: Display results
    PTY->>MCP: Output capture
    MCP->>AGENT: Command result
    
    Note over AGENT,SVC: Session Cleanup
    
    AGENT->>MCP: cli-destroy-session(sessionId)
    MCP->>PTY: terminateSession(sessionId)
    PTY->>CLI: Graceful shutdown
    CLI->>PTY: Exit confirmation
    PTY->>MCP: Session cleaned
    MCP->>AGENT: Cleanup complete
```

### Why MCP Integration Is Complex

**Technical Complexity Factors**:

1. **PTY Management**:
   - Pseudoterminal creation and lifecycle management
   - Session isolation and resource tracking
   - Process cleanup and orphan prevention

2. **Performance Requirements**:
   - <100ms response time target for all MCP tools
   - Intelligent caching for frequently accessed operations
   - Connection pooling and resource optimization

3. **Session State Management**:
   - Real-time state parsing and interpretation
   - Command completion detection
   - Error state recognition and recovery

4. **Service Integration**:
   - Automatic service registry registration
   - Health monitoring and availability tracking
   - Tool versioning and compatibility management

**Current Challenges** (from validation report):

- **Build Failures**: MCP channel compilation issues affecting tool availability
- **Tool Registration**: Verification processes timing out during service discovery
- **Session Lifecycle**: PTY spawn and cleanup processes experiencing timeout issues

### MCP Performance Architecture

```mermaid
graph LR
    subgraph "Performance Optimization [2.1 NEW]"
        CACHE[Response Cache<br/>5s TTL, 100 items]
        POOL[Connection Pool<br/>Session Reuse]
        METRIC[Metrics Collector<br/>Performance Tracking]
        
        subgraph "Caching Strategy"
            TC[Tool List Cache<br/>tools/list responses]
            SC[State Cache<br/>Frequently accessed]
            HC[Health Cache<br/>Service status]
        end
        
        subgraph "Performance Targets"
            T1[Tool Response<br/><100ms]
            T2[Service Registration<br/><100ms]
            T3[Health Check<br/><5000ms]
            T4[File Watch Events<br/><50ms]
        end
    end
    
    CACHE ==> TC
    CACHE ==> SC
    CACHE ==> HC
    METRIC ==> T1
    METRIC ==> T2
    METRIC ==> T3
    METRIC ==> T4
    
    classDef new fill:#d4f4dd,stroke:#4caf50
    class CACHE,POOL,METRIC,TC,SC,HC,T1,T2,T3,T4 new
```

## 5. Enhanced Backend Service Discovery & Connection Flow

### Service Discovery Enhancement [MODIFIED FROM 2.0]

```mermaid
graph TB
    subgraph "CLI&nbsp;2.0&nbsp;Service&nbsp;Discovery&nbsp;[DEPRECATED]"
        REG_OLD[Registry File<br/>Single JSON]
        SCAN_OLD[Directory Scan<br/>Basic PID Check]
        CONN_OLD[Connection Factory<br/>Simple Protocol]
    end
    
    subgraph "CLI 2.1&nbsp;Enhanced Service Discovery [MODIFIED]"
        MS[Multi-Strategy Discovery<br/>Prioritized Execution]
        RT[Real-Time Detection<br/>File System Watching]
        UH[Unified Health<br/>Status Integration]
        SO[Service Ordering<br/>Connected→Alphabetical]
        
        subgraph "Discovery Strategies"
            RS[Registry Strategy<br/>Legacy Support]
            DS[Directory Strategy<br/>Auto-Registration]
            ES[Endpoint Strategy<br/>Port Scanning]
        end
        
        subgraph "Health Integration"
            HS[Health Status<br/>Connected/Disconnected]
            HC[Health Check<br/>Periodic Validation]
            SR[Status Resolution<br/>Unified Display]
        end
    end
    
    REG_OLD -.-> SCAN_OLD
    SCAN_OLD -.-> CONN_OLD
    
    MS ==> RS
    MS ==> DS  
    MS ==> ES
    RT ==> MS
    UH ==> HS
    UH ==> HC
    UH ==> SR
    SO ==> UH
    
    classDef deprecated fill:#e0e0e0,stroke:#999,stroke-dasharray: 5 5
    classDef modified fill:#e3f2fd,stroke:#2196f3
    classDef new fill:#d4f4dd,stroke:#4caf50
    
    class REG_OLD,SCAN_OLD,CONN_OLD deprecated
    class MS,RT,UH,SO modified
    class RS,DS,ES,HS,HC,SR new
```

### Service Status and Ordering [MAJOR CHANGE]

**CLI 2.0 Service Display [DEPRECATED]**:

- Mixed ordering of connected/disconnected services
- Separate Status/Connection and Health displays
- Inconsistent service information presentation

**CLI 2.1 Service Display [NEW]**:

- **Consistent Ordering**: Connected services first (alphabetical), then disconnected services (alphabetical)
- **Unified Status Display**: Connected services show health status, disconnected services show "Disconnected"
- **Integrated Information**: Service capabilities and descriptions consistently available

```mermaid
graph LR
    subgraph "Service&nbsp;Display&nbsp;Logic&nbsp;[2.1&nbsp;NEW]"
        SL[Service List<br/>All Discovered]
        SF[Status Filter<br/>Connected/Disconnected]
        SO[Service Ordering<br/>Algorithm]
        UD[Unified Display<br/>Status Integration]
        
        subgraph "Ordering Algorithm"
            CONN[Connected Services<br/>Sort Alphabetically]
            DISC[Disconnected Services<br/>Sort Alphabetically]
            MERGE[Merge Lists<br/>Connected First]
        end
        
        subgraph "Status Resolution"
            HEALTH[Health Check<br/>If Connected]
            DISCONN[Disconnected Label<br/>If Unavailable]
            STATUS[Final Status<br/>Unified Display]
        end
    end
    
    SL ==> SF
    SF ==> CONN
    SF ==> DISC
    CONN ==> MERGE
    DISC ==> MERGE
    MERGE ==> SO
    SO ==> UD
    
    SF ==> HEALTH
    SF ==> DISCONN
    HEALTH ==> STATUS
    DISCONN ==> STATUS
    STATUS ==> UD
    
    classDef new fill:#d4f4dd,stroke:#4caf50
    class SL,SF,SO,UD,CONN,DISC,MERGE,HEALTH,DISCONN,STATUS new
```

## 6. CLI Interface Data Flow [REDESIGNED FOR 2.1]

### CLI State Machine Evolution

```mermaid
stateDiagram-v2
    [*] --> Initialize
    
    state "CLI 2.0 State Machine [DEPRECATED]" as CLI20 {
        Initialize --> LoadMenuRegistry
        LoadMenuRegistry --> RenderMenu
        RenderMenu --> WaitForInput
        WaitForInput --> ProcessInput
        ProcessInput --> RenderMenu
    }
    
    state "CLI 2.1 Enhanced State Machine [NEW]" as CLI21 {
        Initialize --> LoadSkinDefinitions
        LoadSkinDefinitions --> InitializeWindowManager
        InitializeWindowManager --> RenderBorderedWindow
        
        state RenderBorderedWindow {
            [*] --> CalculateWindowDimensions
            CalculateWindowDimensions --> GenerateWindowBorder
            GenerateWindowBorder --> CenterTitle
            CenterTitle --> RenderPageContent
            RenderPageContent --> PositionTextBox
        }
        
        PositionTextBox --> WaitForInput
        
        state WaitForInput {
            [*] --> EnhancedReadlineInterface
            EnhancedReadlineInterface --> ProcessEnhancedInput
        }
        
        state ProcessEnhancedInput {
            KeyboardInput --> CrossSeparatorNavigation
            KeyboardInput --> DynamicMenuSelection
            KeyboardInput --> BackendCommandExecution
            KeyboardInput --> EnhancedSearch
            KeyboardInput --> WindowedBackendManagement
        }
        
        CrossSeparatorNavigation --> UpdateNavigationContext
        DynamicMenuSelection --> ResolveDynamicRoute
        BackendCommandExecution --> RouteToBackendWithStatus
        EnhancedSearch --> InteractiveWindowedSearch
        WindowedBackendManagement --> LoadBackendSkin
        
        UpdateNavigationContext --> RenderBorderedWindow
        ResolveDynamicRoute --> RenderBorderedWindow
        RouteToBackendWithStatus --> DisplayWindowedResult
        InteractiveWindowedSearch --> RenderBorderedWindow
        LoadBackendSkin --> SwitchInterfaceContext
        
        DisplayWindowedResult --> WaitForInput
        SwitchInterfaceContext --> RenderBorderedWindow
    }
```

### Enhanced CLI Components [2.1 NEW]

**New CLI Architecture Components**:

- **Window Manager**: Coordinates bordered window rendering with theme support
- **Dynamic Route Resolver**: Resolves navigation from skin definitions
- **Cross-Separator Navigator**: Handles navigation across menu separator boundaries
- **Enhanced Service Manager**: Manages backend services with unified status display
- **MCP Integration Handler**: Coordinates with MCP server for agent interactions
- **Emoji Elimination Engine**: Systematically replaces emoji with text indicators

**Data Flow Stages Enhanced**:

1. **Initialization**: Setup window manager, load skin definitions, initialize MCP server
2. **Window Rendering**: Calculate dimensions, generate borders, center titles, position content
3. **Dynamic Routing**: Resolve navigation from skin definitions, generate pages dynamically
4. **Enhanced Input Processing**: Handle cross-separator navigation, dynamic menu resolution
5. **Backend Integration**: Route commands with unified status display and service ordering
6. **Context Management**: Maintain window state, navigation history, and session persistence

## 7. Navigation & Menu System [REDESIGNED]

### Cross-Separator Navigation [2.1 NEW]

```mermaid
graph TB
    subgraph "Enhanced Navigation System [2.1 NEW]"
        CSN[Cross-Separator Navigation<br/>Unified Menu Traversal]
        ESM[Enhanced Selection Manager<br/>Separator-Aware]
        DCE[Double-Confirmation Exit<br/>Safety Pattern]
        
        subgraph "Navigation Elements"
            MI[Menu Items<br/>Selectable Options]
            SEP[Menu Separator<br/>Visual Boundary]
            NAV[Navigation Footer<br/>Back/Home/Help/Exit]
            TB[TextBox<br/>In-Window Input]
        end
        
        subgraph "Selection Logic"
            SA[Separator Awareness<br/>Logical Grouping]
            UA[Unified Addressing<br/>Single Menu System]
            WR[Wrap-Around<br/>Continuous Navigation]
        end
    end
    
    CSN ==> ESM
    ESM ==> DCE
    CSN ==> MI
    MI ==> SEP
    SEP ==> NAV
    NAV ==> TB
    
    ESM ==> SA
    SA ==> UA
    UA ==> WR
    
    classDef new fill:#d4f4dd,stroke:#4caf50,stroke-width:2px
    class CSN,ESM,DCE,MI,SEP,NAV,TB,SA,UA,WR new
```

### Navigation Consistency Rules [2.1 NEW]

**Universal Navigation Footer**:

- All pages display: `Back | Home | Help | Exit`
- Home page: `Back` and `Home` options greyed out
- Consistent separator: `───────────` (matches window width)
- Navigation works across menu separator boundaries

**Exit Handling Enhancement**:

- **Menu Selection**: "Exit" changes to "Press Enter again to shut down Templum CLI"
- **Ctrl+C**: First press shows "Press Ctrl+C again to shut down Templum CLI"
- **Double Confirmation**: Prevents accidental exits, improves user safety

### Menu Structure Integration [CHANGED FROM 2.0]

```mermaid
graph LR
    subgraph "Menu&nbsp;Integration&nbsp;Architecture&nbsp;[2.1&nbsp;NEW]"
        SS[Skin System<br/>Menu Definitions]
        TS[Templum System<br/>Core Menus]
        BS[Backend Services<br/>Dynamic Integration]
        
        subgraph "Unified Menu Structure"
            HM[Home Menu<br/>Connected Services + Core]
            SM[Service Menus<br/>Backend-Specific]
            CM[Core Menus<br/>System Functions]
        end
        
        subgraph "Menu Generation"
            DG[Dynamic Generation<br/>From Skin Specs]
            SI[Service Integration<br/>Live Backend Data]
            MU[Menu Unification<br/>Consistent Navigation]
        end
    end
    
    SS ==> HM
    TS ==> HM
    BS ==> HM
    
    HM ==> DG
    SM ==> DG
    CM ==> DG
    
    DG ==> SI
    SI ==> MU
    
    classDef new fill:#d4f4dd,stroke:#4caf50
    class SS,TS,BS,HM,SM,CM,DG,SI,MU new
```

**Key Changes from 2.0**:

- **Home Menu Enhancement**: Connected backend services appear as shortcuts in main menu
- **Service Integration**: Backend services integrated into menu hierarchy, not listed separately
- **Dynamic Generation**: All menus generated from skin definitions, no hardcoded structures
- **Consistent Navigation**: Same navigation patterns for Templum and backend service menus

## 8. Enhanced State Synchronization Architecture

### State Management Evolution [MODIFIED FROM 2.0]

```mermaid
graph TB
    subgraph "CLI&nbsp;2.0&nbsp;State&nbsp;Management&nbsp;[BASIC]"
        SC_OLD[Session Context<br/>Basic Navigation]
        SM_OLD[State Manager<br/>Simple Memory]
    end
    
    subgraph "CLI 2.1 Enhanced State Management [ENHANCED]"
        ESC[Enhanced Session Context<br/>Window State]
        WSM[Window State Manager<br/>Layout Persistence]
        NSM[Navigation State Manager<br/>Dynamic Context]
        MCP_SM[MCP State Manager<br/>Agent Session Tracking]
        
        subgraph "State Categories"
            WS[Window State<br/>Dimensions, Layout]
            NS[Navigation State<br/>Dynamic Routes, History]
            BS[Backend State<br/>Unified Status, Health]
            AS[Agent State<br/>MCP Session Context]
        end
        
        subgraph "Persistence Strategy"
            MEM[In-Memory Cache<br/>Active Session Data]
            HIST[Navigation History<br/>Dynamic Route Stack]
            PREFS[User Preferences<br/>Window, Theme Settings]
            MCP_CACHE[MCP Cache<br/>Agent Session State]
        end
    end
    
    SC_OLD -.-> SM_OLD
    
    ESC ==> WSM
    ESC ==> NSM
    ESC ==> MCP_SM
    WSM ==> WS
    NSM ==> NS
    WSM ==> BS
    MCP_SM ==> AS
    
    ESC ==> MEM
    NSM ==> HIST
    WSM ==> PREFS
    MCP_SM ==> MCP_CACHE
    
    classDef deprecated fill:#e0e0e0,stroke:#999,stroke-dasharray: 5 5
    classDef modified fill:#e3f2fd,stroke:#2196f3
    classDef new fill:#d4f4dd,stroke:#4caf50
    
    class SC_OLD,SM_OLD deprecated
    class ESC modified
    class WSM,NSM,MCP_SM,WS,NS,BS,AS,MEM,HIST,PREFS,MCP_CACHE new
```

### State Synchronization Enhancements

**Enhanced State Categories**:

1. **Window State**: Border configurations, title positioning, TextBox coordinates
2. **Dynamic Navigation State**: Current route resolved from skin, navigation history stack
3. **Unified Backend State**: Service ordering, health status integration, capability tracking
4. **MCP Agent State**: Active sessions, agent interactions, performance metrics

**Synchronization Improvements**:

- **Window Consistency**: State changes trigger window re-rendering with maintained layout
- **Navigation Context**: Dynamic routes preserved across interface switches
- **Agent Coordination**: MCP sessions synchronized with CLI state for consistent experience
- **Performance Caching**: Intelligent caching reduces state lookup overhead

## 9. Command Execution Flow [ENHANCED]

### Enhanced Command Routing

```mermaid
sequenceDiagram
    participant User
    participant CLI as CLI Adapter 2.1
    participant WM as Window Manager
    participant DR as Dynamic Router
    participant BSR as Backend Service Router
    participant MCP as MCP Server
    participant BC as Backend Connection
    participant BE as Backend Service
    
    Note over User,BE: Enhanced Command Execution [2.1]
    
    User->>CLI: Enter command (in TextBox)
    CLI->>WM: updateTextBoxState(command)
    WM->>CLI: TextBox visual update
    CLI->>DR: resolveCommand(command, context)
    
    alt Dynamic Backend Route
        DR->>DR: lookupSkinDefinition(command)
        DR->>BSR: routeToBackend(backendId, command, args)
        BSR->>BC: executeWithUnifiedStatus(command)
        BC->>BE: Execute command
        BE->>BC: Response with metadata
        BC->>BSR: Unified status response
        BSR->>DR: Command result with health
        DR->>CLI: Execution result
        CLI->>WM: renderResultInWindow(result)
        WM->>User: Display in bordered window
    else MCP Agent Route  
        DR->>MCP: routeToMCP(agentSessionId, command)
        MCP->>MCP: processAgentCommand()
        MCP->>DR: Agent interaction result
        DR->>CLI: MCP result
        CLI->>WM: renderAgentResult(result)
        WM->>User: Display agent interaction
    else Local System Route
        DR->>CLI: executeLocalCommand(command)
        CLI->>CLI: processSystemFunction()
        CLI->>WM: renderSystemResult(result)
        WM->>User: Display in bordered window
    end
```

### Command Categories Enhanced [2.1]

**Enhanced Command Routing**:

1. **Dynamic Backend Commands**: Resolved from skin definitions with unified status display
2. **MCP Agent Commands**: Routed to MCP server for agent interaction processing
3. **Window Management Commands**: Controls window layout, theme, and display preferences
4. **Cross-Separator Navigation**: Enhanced navigation commands working across menu boundaries
5. **Enhanced System Commands**: Window-aware system functions with bordered output display

## 10. Migration Guide: CLI 2.0 → 2.1

### Migration Checklist

**Architecture Changes Required**:

- [ ] Replace hardcoded menu paths with skin-definition routing
- [ ] Implement window management system with bordered rendering
- [ ] Integrate MCP server for agent interactions
- [ ] Update service display with unified status and ordering
- [ ] Enhance navigation with cross-separator support
- [ ] Eliminate emoji usage throughout interface
- [ ] Reposition TextBox within windows instead of below

### Component Migration Map

```mermaid
graph LR
    subgraph "Component&nbsp;Migration&nbsp;[2.0&nbsp;→&nbsp;2.1]"
        subgraph "Remove/Deprecated"
            OLD1[Simple Menu Registry]
            OLD2[Hardcoded Navigation]
            OLD3[Basic Layout Engine]
            OLD4[Emoji Status Indicators]
            OLD5[Below-Window TextBox]
        end
        
        subgraph "Add/New"
            NEW1[Window Management System]
            NEW2[Dynamic Routing System]
            NEW3[MCP Server Integration]
            NEW4[Cross-Separator Navigation]
            NEW5[Enhanced Service Manager]
        end
        
        subgraph "Enhance/Modified"
            MOD1[TemplumCore → Enhanced Orchestrator]
            MOD2[CLI Adapter → Windowed Interface]
            MOD3[State Manager → Multi-Context]
            MOD4[Command Router → Dynamic Resolution]
        end
    end
    
    OLD1 -.->|REMOVE| NEW2
    OLD2 -.->|REMOVE| NEW2
    OLD3 -.->|REMOVE| NEW1
    OLD4 -.->|REMOVE| NEW5
    OLD5 -.->|REMOVE| NEW1
    
    NEW3 ==>|ENHANCE| MOD1
    NEW1 ==>|ENHANCE| MOD2
    NEW4 ==>|ENHANCE| MOD3
    NEW2 ==>|ENHANCE| MOD4
    
    classDef deprecated fill:#e0e0e0,stroke:#999,stroke-dasharray: 5 5
    classDef new fill:#d4f4dd,stroke:#4caf50
    classDef modified fill:#e3f2fd,stroke:#2196f3
    
    class OLD1,OLD2,OLD3,OLD4,OLD5 deprecated
    class NEW1,NEW2,NEW3,NEW4,NEW5 new
    class MOD1,MOD2,MOD3,MOD4 modified
```

### Performance Validation Requirements

**CLI 2.1 Performance Targets**:

- **Window Rendering**: <50ms for typical window layouts
- **Dynamic Route Resolution**: <10ms average lookup time
- **MCP Tool Response**: <100ms for all agent interactions
- **Service Discovery**: <100ms for backend detection
- **Navigation Response**: <200ms for menu transitions
- **Cross-Separator Navigation**: <100ms for enhanced navigation

### Breaking Changes from 2.0

1. **Menu Structure**: All hardcoded menu IDs and paths removed
2. **Navigation API**: Cross-separator navigation requires new event handling
3. **Display System**: Emoji-based indicators replaced with text alternatives
4. **Input Handling**: TextBox positioning changed from below-window to in-window
5. **State Management**: Enhanced context tracking requires migration of session data
6. **Backend Integration**: Unified status display changes service information format

### Implementation Priority Order

1. **Phase 1**: Window Management System implementation
2. **Phase 2**: Dynamic Routing System with skin integration  
3. **Phase 3**: MCP Server setup and agent tools
4. **Phase 4**: Enhanced navigation and cross-separator support
5. **Phase 5**: Service management unification and emoji elimination
6. **Phase 6**: Performance optimization and validation
7. **Phase 7**: Migration testing and rollout

## Summary

The Templum CLI 2.1 architecture represents a significant evolution from CLI 2.0, introducing comprehensive window management, dynamic routing, MCP agent integration, and enhanced user experience patterns. The key architectural improvements enable:

- **Professional Interface**: Bordered windows with consistent visual hierarchy
- **Dynamic Flexibility**: Skin-definition driven navigation eliminating hardcoded paths  
- **Agent Integration**: Comprehensive MCP server enabling AI agent CLI interactions
- **Enhanced UX**: Cross-separator navigation, unified status display, and safety patterns
- **Performance Optimization**: <100ms response targets with intelligent caching
- **Maintainability**: Clear separation of concerns and pattern-based development

This architecture analysis provides the foundation for implementing CLI 2.1 while maintaining backwards compatibility and ensuring smooth migration from the existing CLI 2.0 system.
