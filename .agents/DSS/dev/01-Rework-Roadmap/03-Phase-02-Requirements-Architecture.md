# Phase 2: Requirements & Architecture Design

## High-Level Goal

Define comprehensive Backend Service requirements for Litany and design an optimal MCP server architecture with Universal Skin Provider that achieves 60-80% token reduction while providing seamless Templum integration and leveraging PCL infrastructure components.

## Detailed Context and Rationale

### Why This Phase Exists

With empirical analysis from Phase 1 complete, this phase translates findings into actionable requirements and architectural design. The architecture must balance token efficiency with functionality, user control with automation, and standalone capability with integration potential.

### Technical Justification

Based on Phase 1 analysis showing excessive context bloat and the MCP protocol's dynamic retrieval capabilities, this phase designs a pure backend service architecture that:

- Reduces token usage through on-demand tool calling vs. static context injection
- Enables algorithmic file updates without LLM overhead
- Supports flexible metadata management for optimal performance
- Integrates with Templum's Universal Interface System as a Backend Service provider
- Leverages PCL infrastructure components to eliminate redundant development

### Architecture Integration

This phase establishes Litany's backend service architectural patterns:

- MCP server structure with optimized tool definitions
- Universal Skin Provider for Templum integration
- Backend Service interface specification and implementation
- Metadata management strategy (in-file vs. external)
- Caching and update mechanisms coordinated with Templum state management
- PCL infrastructure component reuse strategy

## Prerequisites & Verification

### Prerequisites from Phase 1

- Token analysis report with concrete metrics
- MCP protocol research documentation
- Project architecture analysis (Haruspex and PCL)
- Identified reusable DSS components
- Pain points and optimization opportunities documented

### Recommendations from Phase 1 Implementation

[This section will be populated with actual recommendations from Phase 1 implementation]

### Validation Commands

```bash
# Verify Phase 1 deliverables exist
test -f "DSS/dev/01-Rework-Roadmap/analysis_report.md" && echo "Analysis report found"

# Check for token metrics
grep -q "token_usage" analysis_report.md && echo "Token metrics documented"

# Verify MCP research
test -f "DSS/dev/01-Rework-Roadmap/mcp_research.md" && echo "MCP research complete"
```

### Expected Results

- Analysis report contains token usage metrics
- MCP protocol capabilities documented
- Integration points identified

## Step-by-Step Implementation Guide

### 1. Test-Driven Development (TDD) First - Requirements Validation

**Test Name**: "Phase 2 Requirements and Architecture Validation"

Create tests that validate requirements completeness and architecture soundness:

```python
# tests/test_requirements_architecture.py
import unittest
from litany.requirements import RequirementsValidator
from litany.architecture import ArchitectureDesigner

class TestRequirementsArchitecture(unittest.TestCase):
    def test_requirements_completeness(self):
        """Test that all requirement categories are defined"""
        validator = RequirementsValidator()
        requirements = validator.load_requirements("requirements.yaml")
        
        required_categories = [
            "functional", "performance", "integration", 
            "user_control", "security"
        ]
        
        for category in required_categories:
            self.assertIn(category, requirements)
            self.assertTrue(len(requirements[category]) > 0)
    
    def test_token_reduction_requirement(self):
        """Test token reduction targets are achievable"""
        designer = ArchitectureDesigner()
        
        baseline_tokens = 10000  # From Phase 1 analysis
        target_tokens = designer.calculate_target_tokens()
        
        reduction = (baseline_tokens - target_tokens) / baseline_tokens
        self.assertGreaterEqual(reduction, 0.6)  # 60% minimum reduction
        self.assertLessEqual(reduction, 0.8)      # 80% maximum reduction
    
    def test_mcp_tool_design(self):
        """Test MCP tool definitions are valid"""
        designer = ArchitectureDesigner()
        tools = designer.design_mcp_tools()
        
        for tool in tools:
            self.assertIn("name", tool)
            self.assertIn("description", tool)
            self.assertIn("parameters", tool)
            self.assertTrue(len(tool["description"]) < 500)  # Concise descriptions
```

### 2. Define Litany Requirements

Create comprehensive requirements specification:

```yaml
# requirements/litany_requirements.yaml
functional_requirements:
  - id: FR-001
    description: "Dynamic information retrieval via MCP tools"
    priority: HIGH
    validation: "Tool calls return requested information"
  
  - id: FR-002
    description: "Metadata-driven file selection"
    priority: HIGH
    validation: "Files selected based on context metadata"
  
  - id: FR-003
    description: "Algorithmic file updates without LLM"
    priority: MEDIUM
    validation: "Updates complete without LLM calls"

performance_requirements:
  - id: PR-001
    description: "60-80% token reduction vs DSS"
    priority: HIGH
    validation: "Measured token usage within target range"
  
  - id: PR-002
    description: "Response time <200ms for tool calls"
    priority: MEDIUM
    validation: "Performance benchmarks pass"

integration_requirements:
  - id: IR-001
    description: "Templum Universal Interface integration"
    priority: HIGH
    validation: "Backend service integrates with Templum through Universal Skin Provider"
  
  - id: IR-002
    description: "PCL infrastructure component reuse"
    priority: HIGH
    validation: "Reuses PCL SessionManager, ConfigManager, AuditLogger, and SkinMenuRenderer"
  
  - id: IR-003
    description: "Universal Skin Definition generation"
    priority: HIGH
    validation: "Generates valid Templum-compatible skin definitions for all interface types"
  
  - id: IR-004
    description: "Cross-interface state coordination"
    priority: MEDIUM
    validation: "State synchronized across VSCode, CLI, and Command interfaces via Templum"

user_control_requirements:
  - id: UC-001
    description: "Simple file addition interface"
    priority: HIGH
    validation: "Users can add files with metadata"
  
  - id: UC-002
    description: "Configurable metadata parameters"
    priority: MEDIUM
    validation: "Metadata customizable per file"
```

### 3. Design Litany Architecture

Create detailed architecture design:

```python
# architecture/litany_architecture.py
class LitanyArchitecture:
    def design_mcp_server(self):
        """Design optimized MCP server structure"""
        return {
            "server_name": "litany_mcp_server",
            "transport": "stdio",  # For easy integration
            "tools": [
                {
                    "name": "get_contextual_info",
                    "description": "Retrieve context-specific information",
                    "parameters": {
                        "context": "string",
                        "tags": "array[string]",
                        "limit": "integer"
                    }
                },
                {
                    "name": "list_available_contexts",
                    "description": "List available information contexts",
                    "parameters": {
                        "category": "string"
                    }
                },
                {
                    "name": "update_metadata",
                    "description": "Update file metadata algorithmically",
                    "parameters": {
                        "file_id": "string",
                        "metadata": "object"
                    }
                }
            ],
            "resources": self.design_resources(),
            "prompts": self.design_prompt_templates()
        }
    
    def design_metadata_management(self):
        """Design metadata strategy"""
        return {
            "strategy": "hybrid",
            "in_file": {
                "format": "yaml_frontmatter",
                "fields": ["tags", "when_to_call", "requires", "provides"]
            },
            "external": {
                "format": "json",
                "location": "litany_metadata.json",
                "fields": ["file_id", "last_updated", "usage_stats"]
            }
        }
```

### 4. Design Templum Integration Architecture

Define integration patterns with Templum and PCL:

```typescript
// integration/templum_integration_architecture.ts
interface LitanyTemplumIntegration {
    // Templum Backend Service Integration
    backendService: {
        interface: "BackendService";
        implementation: "LitanyBackendService";
        skinProvider: {
            generateUniversalSkin(): UniversalSkinDefinition;
            handleCommand(command: string, context: any): Promise<any>;
        };
    };
    
    // PCL Infrastructure Reuse
    pcl: {
        components: {
            sessionManager: "LitanySessionManager extends PCLSessionManager";
            configManager: "LitanyConfigManager extends PCLConfigurationManager";
            auditLogger: "LitanyAuditLogger extends PCLAuditLogger";
            skinMenuRenderer: "reuse PCL SkinMenuRenderer for CLI compatibility";
        };
        coordination: {
            stateSync: "syncWithTemplum(templumState: TemplumState)";
            configIntegration: "LitanyConfiguration extends PCLConfiguration";
            auditIntegration: "logMCPOperation, logTemplumSync";
        };
    };
    
    // Universal Interface Support
    interfaces: {
        vscode: "Tree views, panels, status bar through Templum adapter";
        cli: "Interactive menus using PCL SkinMenuRenderer via Templum";
        command: "Text commands with shortcuts through Templum command adapter";
    };
}

### 5. Create Templum-Integrated Architecture Documentation

Generate comprehensive architecture document aligned with Templum integration:

```markdown
# Litany Backend Service Architecture Design

## Core Backend Architecture
- Pure backend service with MCP server implementation
- Universal Skin Provider for Templum integration
- Hybrid metadata management (YAML frontmatter + JSON index)
- Intelligent caching with 5-minute TTL coordinated with Templum state
- PCL infrastructure reuse for proven reliability

## Token Optimization Strategy
1. Dynamic MCP tool retrieval (60-70% reduction)
2. Templum-coordinated metadata filtering (15% reduction)
3. Cross-interface caching (10% reduction)
4. Content compression (5-10% reduction)

## Templum Integration Architecture
### Universal Interface Access
- VSCode: Tree views, panels, status bar via Templum VSCode adapter
- CLI: Interactive menus using PCL SkinMenuRenderer via Templum CLI adapter
- Command: Text commands with shortcuts via Templum command adapter

### PCL Infrastructure Reuse
- SessionManager: Extended with context state and Templum coordination
- ConfigManager: Template-based configuration with Litany-specific settings
- AuditLogger: MCP operations and Templum sync event logging
- SkinMenuRenderer: Reused for CLI menu generation through Templum

### Backend Service Benefits
- Zero interface duplication through Templum Universal Skin System
- Proven infrastructure patterns from PCL ecosystem
- Cross-interface state synchronization managed by Templum
- Reduced implementation timeline from 12-17 days to 8-12 days
```

### 6. Validation & Testing

Validate requirements and architecture:

```bash
# Run requirements validation
python -m pytest tests/test_requirements_architecture.py

# Validate architecture against requirements
python validation/validate_architecture.py

# Check integration compatibility
python integration/test_integration_points.py
```

## Implementation Documentation & Phase Transition (2 parts - both required for completion)

- [ ] **Part A**: Document implementation lessons learned in current phase
  - Create comprehensive "Implementation Notes & Lessons Learned" section with:
    - **Requirements Challenges**: Balancing token efficiency with functionality
    - **Architecture Decisions**: Trade-offs in metadata management strategy
    - **Integration Complexities**: Haruspex embedded vs abstraction layer decision
    - **Performance Considerations**: Caching strategy and update frequency
    - **Testing Strategy Results**: Architecture validation approach effectiveness
    - **Security/Quality Findings**: MCP server security considerations
    - **User Experience Insights**: Metadata configuration complexity
    - **Additional Discoveries**: Unexpected integration opportunities
    - **Recommendations for Phase 3**: Implementation priorities based on architecture

- [ ] **Part B**: Transfer recommendations to next phase document
  - **Target File**: `04-Phase-03-MCP-Server-Implementation.md`
  - **Location**: After Prerequisites section  
  - **Acceptance Criteria**: Phase 3 document contains all recommendation categories from Phase 2
  - **Validation Method**: Read Phase 3 file to confirm recommendations are present

## Success Criteria

Successfully defining comprehensive requirements and designing an elegant architecture that achieves significant token reduction while maintaining full functionality and enabling seamless integration with existing projects.

## Definition of Done

• **Backend Service Requirements Complete** - All requirement categories defined with Templum integration validation criteria
• **Templum Integration Architecture Designed** - MCP server structure, Universal Skin Provider, and PCL integration patterns specified
• **Token Reduction Strategy Defined** - Clear path to 60-80% reduction through dynamic loading documented
• **PCL Infrastructure Reuse Documented** - SessionManager, ConfigManager, AuditLogger, and SkinMenuRenderer integration patterns specified
• **Universal Skin Definition Specification** - Complete skin definition structure for VSCode, CLI, and Command interfaces
• **Validation Tests Passing** - All backend service requirements and Templum integration validation tests pass
• **Templum-Integrated Architecture Documentation Complete** - Comprehensive backend service design document with cross-interface coordination
• **PCL Infrastructure Trade-off Analysis** - Component reuse decisions with rationale and adaptation strategies
• **Cross-Phase Knowledge Transfer**: Phase-03 document contains Templum integration recommendations from Phase-02 implementation
• **Validation Required**: Read Phase 03 document to confirm backend service and PCL integration recommendations transferred successfully  
• **File Dependencies**: Both Phase 02 and Phase 03 documents modified with Templum integration approach
• **Implementation Documentation Complete**: Current phase contains comprehensive lessons learned section focused on backend service architecture
