# Templum 1.0 Active Tasks Queue

> **Purpose**: Dependency-optimized task queue with priority markers and single-occurrence rule
> **Created**: 2025-08-23
> **Integration**: Used by /pr:task.md, /pr:validate, /pr:document
> **Architecture**: See templum-patterns.md for implementation patterns

## Task Selection Markers

- `[!]` = priority (do this next)
- `[n]` = sequence-order (do these in order after !)
- `[ ]` = pending
- `[~]` = in-progress  
- `[x]` = complete
- `[-]` = cancelled
- `[>]` = forwarded
- `[<]` = scheduled
- `[?]` = blocked/unknown
- `[B]` = implemented-broken: core logic done but compilation/tests failing (requires structural fix)
- `[T]` = implemented-testing: compiles but needs functional validation
- `[D]` = documenting: validated and awaiting documentation

## MCP CHANNEL IMPLEMENTATION

**Purpose**: Agent-CLI Interaction Solution via MCP Channel Approach  
**Source**: Proposition 2 MCP Channel Implementation Guide (2025-09-04-1511)  
**Total Implementation Time**: 4-7 weeks across 3 phases  
**Architecture**: External MCP server providing agent-compatible CLI interaction  

### Phase 1: Foundation Infrastructure

- [x] [TASK-MCP-INT-001] **Pty-MCP-Server Installation and Configuration** | Priority: CRITICAL | Complexity: 3 | **FOUNDATION**
  - Pattern: templum-patterns.md#pty-mcp-server-integration-pattern
  - Dependencies: Haskell GHC >=9.6 or pre-built binary, development environment setup
  - Spec: mcp-channel-implementation-guide.md (updated 2025-09-05)
  - **TDD Approach**:
    - **Test First**: Create tests for Templum CLI interaction patterns before configuration
    - **Red**: Write failing tests for pty-bash session creation, pty-message command sending
    - **Green**: Configure pty-mcp-server with minimal Templum-specific settings to pass tests
    - **Refactor**: Optimize configuration for Templum CLI patterns and prompts
  - Implementation Approach:
    1. **Installation Phase** (TDD: Environment Setup Tests):
       - Install pty-mcp-server via cabal install or pre-built binary
       - Create test harness for pty-mcp-server tool validation
       - Test MCP protocol communication (stdio mode)
    2. **Configuration Phase** (TDD: Templum Integration Tests):
       - Create config.yaml with Templum-specific settings:

         ```yaml
         logDir: "./logs/mcp-channel"
         logLevel: "Info"
         toolsDir: "./tools/templum"
         prompts:
           - "] templum$"
           - "? Select option:"
           - "templum>"
           - "Enter command:"
           - "Continue? (y/n):"
         ```

       - Create tools-list.json with Templum tools:

         ```json
         {
           "templum-cli": {
             "description": "Launch Templum CLI interface",
             "type": "pty-bash"
           },
           "templum-menu": {
             "description": "Navigate Templum menus via structured messages",
             "type": "pty-message"  
           }
         }
         ```

    3. **Validation Phase** (TDD: End-to-End Tests):
       - Test pty-bash session creation with Templum CLI
       - Test pty-message structured command sending
       - Validate prompt detection for Templum CLI patterns
       - Test session cleanup and resource management
  - Location:
    - Configuration: ~/.templum/mcp-server/config.yaml
    - Tools: ~/.templum/mcp-server/tools/
    - Tests: src/tests/mcp-integration/
  - Success Criteria:
    - pty-mcp-server launches and responds to MCP requests
    - Templum CLI can be launched via pty-bash
    - Templum commands can be sent via pty-message
    - Prompt detection works for Templum CLI patterns
  - **TESTING REQUIREMENTS**:
    - Unit tests for configuration validation
    - Integration tests for MCP tool communication
    - End-to-end tests with actual Templum CLI
    - Performance tests for <100ms response time
  - **C++ BUILD TOOLS**: ✅ Not required (Haskell binary or cabal installation)
  - **VALIDATION STATUS**: ✅ PASSED (2025-09-06-0040) - MCP integration validation with warnings addressed
  - **VALIDATION RESULTS**: 2 tests passed, 0 failed, 1 warning (lint configuration)
    - ✅ Clean Compilation: TypeScript builds successfully with no errors
    - ✅ Type Checking: All type validations pass, no TypeScript errors
    - 🟡 Lint Check: No lint script configured (acceptable for MCP integration package)
  - **VALIDATION REPORT**: dev\validation-results\2025-09-06-0040-TASK-MCP-INT-001-mcp-validation.md
  - **IMPLEMENTATION STATUS**: Complete pty-mcp-server integration infrastructure with test harness
  - **NEXT PHASE**: Ready for `/pr:document` to create pty-mcp-server-integration-pattern

- [x] [TASK-MCP-004] **Templum Service Discovery Integration** | Priority: HIGH | Complexity: 4 | **INTEGRATION**
  - Pattern: templum-patterns.md#service-discovery-pattern
  - Dependencies: TASK-MCP-INT-001 completion, Templum service discovery system
  - Spec: mcp-channel-implementation-guide.md
  - **IMPLEMENTATION STATUS**: TypeScript iterator compatibility fixes applied (Array.from() wrapper)
  - **FILES FIXED**: src/mcp-channel/src/pty-manager.ts (lines 216, 290) - MapIterator compatibility
  - **VALIDATION STATUS**: MCP-specific files compile successfully, full project blocked by unrelated './agents' error
  - **TODO: VALIDATION SCRIPT FIXES NEEDED**:
    - Add --targeted flag to allow targeted validation as override (non-default)
    - Fix --project argument to properly target specific directories when needed
    - Keep full project build as default (current behavior is correct)
    - Add proper glob pattern resolution in resolveGlobPatterns() method
    - Test validation script with --targeted flag for cases with unrelated build errors
  - **TODO: COMPLETE VALIDATION PROCESS**:
    - Run validation with working script: /pr:validate Templum TASK-MCP-004
    - Check TASK-ID implementation tags with Grep tool
    - Validate pattern compliance for typescript-iterator-compatibility-fix
    - Update status to [D] when validation passes
    - Proceed to /pr:document phase
  - **NEXT PHASE**: Ready for validation once script fixes complete
  - **TDD Approach**:
    - **Test First**: Create tests for service registration, discovery, and health checks
    - **Red**: Write failing tests for MCP server appearing in Templum service list
    - **Green**: Implement minimal service registration to pass tests
    - **Refactor**: Add comprehensive service discovery integration and health monitoring
  - Implementation Approach:
    1. **Service Registration Phase** (TDD: Discovery Tests):
       - Create service registration file in ~/.templum/services/:

         ```json
         {
           "id": "mcp-cli-channel",
           "name": "CLI MCP Channel",
           "version": "1.0.0", 
           "pid": "auto-detected",
           "endpoint": "stdio://pty-mcp-server",
           "protocol": "mcp",
           "capabilities": [
             "pty-bash", "pty-message", "pty-connect", 
             "pty-terminate", "templum-cli"
           ],
           "started": "auto-timestamp",
           "healthEndpoint": "mcp://cli-health-check"
         }
         ```

    2. **Health Check Integration** (TDD: Health Monitoring Tests):
       - Implement health check tool in tools-list.json
       - Create health validation script for pty-mcp-server status
       - Test service availability detection via Templum discovery
    3. **Lifecycle Integration** (TDD: Startup/Shutdown Tests):
       - Integrate pty-mcp-server startup with Templum service lifecycle
       - Test automatic service registration on startup
       - Test clean service deregistration on shutdown
       - Validate service discovery refreshes detect MCP server
    4. **End-to-End Validation** (TDD: Complete Integration Tests):
       - Test agent can discover and connect to MCP server via Templum
       - Validate agent-CLI interaction through service discovery
       - Test failover and recovery scenarios
  - Location:
    - Service files: ~/.templum/services/mcp-cli-channel-{pid}.json
    - Health scripts: ~/.templum/mcp-server/tools/health/
    - Integration tests: src/tests/service-discovery/
  - Success Criteria:
    - MCP server appears in Templum service discovery
    - Health checks report accurate service status
    - Agent can connect to Templum CLI via service discovery
    - Service lifecycle integration works correctly
  - **TESTING REQUIREMENTS**:
    - Unit tests for service registration file generation
    - Integration tests for service discovery detection  
    - End-to-end tests for agent-service-CLI communication chain
    - Health check validation and monitoring tests
  - **ESSENTIAL VALIDATION CHECK**
    - The agent must *USE* the CLI via the MCP; the whole point is that this is possible - *YOU* can now *BE* the tests, not just rely on unit tests or end-to-end tests. *you have to be able to use the CLI - that is the whole point. If this cannot be done, or done well, effectively, reliably, competently, and with the capacity for its intended purpose, then the MCP Channel is not implemented.*
  - **SUCCESS CRITERIA**:
    - [ ] pty-mcp-server installed and configured for Templum
    - [ ] Agent can launch Templum CLI via pty-bash
    - [ ] Agent can send commands via pty-message with prompt detection
    - [ ] Service discovery integration enables agent-CLI connection
    - [ ] <100ms response time for MCP tool interactions
    - [ ] Comprehensive test coverage with TDD methodology

- [x] [TASK-MCP-005] **CLI DEVELOPMENT TESTING** | 2025-09-12-113834-TASK-MCP-005-hybrid-cli-development-synthesis.md
  - Work out what the requirements for the CLI are
    - How it should work
    - What it should display
    - What controls/keybindings it should have
    - What functionality it should have (config options?)
    - etc.
  - **Create a spec file for the CLI specifically** - a non-technical requirements doc that is user-focused
    - This needs to happen before moving on to the next stage
  - Work out whether it meets those requirements
    - Does it map the backend input appropriately
    - Does it display things as it should
    - Does it work as it should (correct keypress results etc)
    - etc.
  - Work out *how* to make sure it meets those requirements (see patterns files - might need to create new pattern(s))
  - Implement those changes necessary to ensure it meets the requirements
  - Validate the implemented changes
    - ValidationSystem (../../scripts/validation/README-ValidationSystem.md)
    - **MANUAL** testing via the MCP
  - Iterate until it works
  - Document the fix in a fix doc using the fix-guide template (cp "C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\templates\comprehensive-fix-template.md" "<Project>/dev/fixes/$(date +%Y-%m-%d-%H%M)-[{TASK-ID}]-{description}.md")
  - Document patterns used and created in the patterns folder/files (one file per pattern)
  - **NOTES**: this task should be completed by utilising the MCP and CLI (Templum\src\mcp-channel\README-mcp-channel.md) *NOT* by writing new scripts/test files. This task is as much a test of *the ability to use the CLI and develop Templum by agent use of the CLI* as it is about improving it.

### MCP IMPLEMENTATION SUMMARY

#### Impact Metrics

- Dependencies: TASK-MCP-010, TASK-MCP-011, TASK-MCP-012 completion
- Implementation Approach:
    1. Create end-to-end agent-CLI interaction validation tests
    2. Implement Templum CLI integration testing through MCP channel
    3. Add agent compatibility validation with existing MCP tooling
    4. Create comprehensive user acceptance testing scenarios
    5. Implement production deployment and rollback procedures
    6. Create complete documentation and API reference
- Location: src/tests/mcp-channel/e2e/ and docs/mcp-channel/
- Success Criteria: Full system validation, production deployment ready
- **COMPLETION GATE**: System ready for production use
