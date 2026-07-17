# /chain:inspection-team - Chain-Engineered Task Orchestration with Full Inspection and Critique

## Purpose

Specialized workflow command that delegates chain **DESIGN** to expert Chain Engineer agents, then executes their optimized chain specifications exactly as provided. This command focuses purely on orchestration - you design nothing, you execute everything.

## Usage

```command
/agent:workflow-chain [Project] [TASK-ID] "description"
```

## Arguments

- `Project` - Target project name (auto-detected if omitted)
- `TASK-ID` - Specific task identifier
- `description` - New task description

## Execution Protocol

### Step 1: Create Chain Design Workspace

**YOUR ONLY ANALYSIS**: Basic task context gathering (max 3 file reads)

**Create Handoff Folder**:
Create folder: `.claude/handoff/{timestamp}-{taskId}/`

**Multi-Engineer Chain Design** (all 5 Chain Engineers + Chain Analyst):

```javascript
// Phase 1: Multiple Chain Engineers (ALL IN ONE MESSAGE)
const folderPath = `.claude/handoff/chain-design/{timestamp}-${taskId}`;

Task({
  subagent_type: "Chain Engineer v1.0",
  description: "Design chain - practical approach",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           Folder Path: ${folderPath}
           
           *DESIGN CHAIN USING v1.0 PRACTICAL APPROACH*
           Focus on proven, reliable execution patterns.
           Complete your chain design thinking fully **BEFORE** reading the schema.
           Then write your design to: ${folderPath}/v1.0.json
           Use schema format: .claude/chains/schemas/chain-design-schema.json
           
           Respond only with: "written the chain-design to ${folderPath}/v1.0.json"`
});
Task({
  subagent_type: "Chain Engineer v1.1", 
  description: "Design chain - algorithmic approach",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           Folder Path: ${folderPath}
           
           *DESIGN CHAIN USING v1.1 ALGORITHMIC APPROACH*
           Apply sophisticated optimization algorithms.
           Complete your chain design thinking fully **BEFORE** reading the schema.
           Then write your design to: ${folderPath}/v1.1.json
           Use schema format: .claude/chains/schemas/chain-design-schema.json
           
           Respond only with: "written the chain-design to ${folderPath}/v1.1.json"`
});
Task({
  subagent_type: "Chain Engineer v1.2",
  description: "Design chain - pattern approach",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           Folder Path: ${folderPath}
           
           *DESIGN CHAIN USING v1.2 PATTERN APPROACH*
           Leverage historical patterns and learning.
           Complete your chain design thinking fully **BEFORE** reading the schema.
           Then write your design to: ${folderPath}/v1.2.json
           Use schema format: .claude/chains/schemas/chain-design-schema.json
           
           Respond only with: "written the chain-design to ${folderPath}/v1.2.json"`
});
Task({
  subagent_type: "Chain Engineer v1.3",
  description: "Design chain - risk adaptive",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           Folder Path: ${folderPath}
           
           *DESIGN CHAIN USING v1.3 RISK-ADAPTIVE APPROACH*
           Emphasize robust error handling and uncertainty management.
           Complete your chain design thinking fully **BEFORE** reading the schema.
           Then write your design to: ${folderPath}/v1.3.json
           Use schema format: .claude/chains/schemas/chain-design-schema.json
           
           Respond only with: "written the chain-design to ${folderPath}/v1.3.json"`
});
Task({
  subagent_type: "Chain Engineer v1.4",
  description: "Design chain - speed optimized", 
  prompt: `Task: ${taskId || description}
           Project: ${project}
           Folder Path: ${folderPath}
           
           *DESIGN CHAIN USING v1.4 SPEED-OPTIMIZED APPROACH*
           Prioritize rapid execution and delivery.
           Complete your chain design thinking fully **BEFORE** reading the schema.
           Then write your design to: ${folderPath}/v1.4.json
           Use schema format: .claude/chains/schemas/chain-design-schema.json
           
           Respond only with: "written the chain-design to ${folderPath}/v1.4.json"`
});

// Phase 2: Chain Analyst Synthesis
Task({
  subagent_type: "Chain Analyst",
  description: "Synthesize optimal hybrid chain",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           Folder Path: ${folderPath}
           
           **SYNTHESIZE OPTIMAL CHAIN FROM MULTIPLE PROPOSALS**
           Read chain designs from these files:
           - ${folderPath}/v1.0.json
           - ${folderPath}/v1.1.json
           - ${folderPath}/v1.2.json
           - ${folderPath}/v1.3.json
           - ${folderPath}/v1.4.json
           
           Create superior hybrid design combining best elements.
           Write synthesis to: ${folderPath}/hybrid.json
           Use same schema format as the input files.
           
           Respond only with: "written the hybrid chain-design to ${folderPath}/hybrid.json"`
});
```

### Step 2: Chain Reception and Parsing

**Read Hybrid Chain Design**: Extract execution instructions from synthesized chain file:

```yaml
expected_chain_format:
  metadata:
    complexity_score: [1-100]
    estimated_duration: [minutes]
    pattern_type: [sequential|parallel|hybrid|iterative]
  
  execution_instructions:
    - phase_1: "exact Task invocation code"
    - phase_2: "exact Task invocation code" 
    - phase_n: "exact Task invocation code"
  
  handoff_strategy:
    - agent_1: "standalone | create_handoff | read_handoff"
    - agent_2: "routing instruction"
  
  error_recovery:
    - phase_failures: "recovery procedures"
```

**Chain Design Summary**:

Provide a summary of the proposed chain to the user. Example:

```Markdown
Phase 1: Backend Analysis
  - 3 Analysis Agents analyse files backend1.ts, backend2.ts, backend3.ts
Phase 2: <Backend-Component> Fix and <Backend-Component> Enhancement
  - 2 Execution Agents fix the issues in backend1.ts and backend2.ts
  - 1 Execution Agnet implements the enhancement in backend3.ts
Phase 3: Fix and Enhancement Validation
  - 3 Validation Agents verify the fixes and enhancement quality
[Phase 3+4 loop until fully functional]
Phase 5: Documentation
  - 1 Documentation Agent writes the fix document and updates the task tracker
```

### Step 3: Chain Execution

**CRITICAL EXECUTION RULES**:

1. **Execute Exactly**: Use provided Task invocations without modification
2. **Preserve Order**: Follow sequential/parallel instructions precisely  
3. **Parallel Batching**: Multiple simultaneous Task calls in ONE message
4. **No Interpretation**: Don't optimize, modify, or improve the chain
5. **Follow Routing**: Use chain's handoff and routing decisions

**Sequential Execution Example**:

```javascript
// Execute provided Task invocations in sequence
// Phase 1 (analysis agent)
[Execute Phase 1 Task invocation exactly as provided]

// Wait for completion, then Phase 2
[Execute Phase 2 Task invocation exactly as provided]

// Continue until chain complete
```

**Parallel Execution Example**:

```javascript
// Execute multiple Task invocations in ONE message
[Execute all parallel Task invocations from chain design]

// Process all responses before continuing
```

### Step 4: Response Processing and Orchestration

**Agent Response Processing**:

```yaml
response_handling:
  success_with_handoff:
    action: "Continue to next phase as designed"
    handoff: "Read handoff file if specified"
    
  success_standalone:
    action: "Complete phase, continue to next"
    handoff: "No handoff processing needed"
    
  partial_success:
    action: "Follow chain's contingency plan"
    decision: "Use designed error recovery"
    
  failure:
    action: "Execute designed recovery strategy"
    escalation: "Follow chain's escalation plan"
    
  blocked:
    action: "Apply designed mitigation"
    manual: "Escalate only if chain specifies"
```

**Routing Decisions**:

- **Use chain's routing logic** - don't make independent decisions
- **Follow designed handoff strategy** - create/read handoffs as specified
- **Apply designed error recovery** - don't improvise solutions

### Step 5: Results Logging

1. Create {timestamp}-{taskId}-results.json to `.claude/chains/results/` following the schema `.claude/chains/schemas/chain-results-schema.json`
2. Fill in the feedback form `.claude/chains/schemas/workflow-feedback-template.md`, writing it to `.claude/chains/workflow-feedback/` as {timestamp}-{taskID}-feedback.md

### Step 6: Critical Analysis and Inspection

**Comprehensive Analysis Phase**: Execute thorough multi-perspective validation followed by harsh, objective critique of chain execution to identify improvement opportunities and verify claims.

#### Part A: Inspection Team Analysis

**Specialized Validation Phase**: Deploy inspection team of specialized validation agents to comprehensively evaluate chain execution from multiple expert perspectives.

**Inspection Team Composition**:

- **Core Inspection Agents** (always deployed):
  - claude-md-compliance-checker: Verify adherence to CLAUDE.md project guidelines
  - code-quality-pragmatist: Detect over-engineering and unnecessary complexity
  - jenny: Verify implementation matches specifications
  - karen: Realistic assessment of actual vs claimed completion
  - task-completion-validator: Functional verification that implementations work

- **Conditional Inspection Agents** (deployed based on task type):
  - ui-comprehensive-tester: Include when task involves UI/frontend components
  - ultrathink-debugger: Include when task involves debugging or error resolution

```javascript
// Build conditional subagents based on task characteristics
const conditionalSubagents = [];
const conditionalDescriptions = [];
const conditionalTasks = [];

const taskContent = (taskId || description).toLowerCase();

// UI/Frontend detection
if (taskContent.includes('ui') ||
    taskContent.includes('frontend') ||
    taskContent.includes('interface')) {
    conditionalSubagents.push('ui-comprehensive-tester');
    conditionalDescriptions.push('UI and interface testing');
    conditionalTasks.push('UI testing and validation');
}

// Debug/Error detection
if (taskContent.includes('debug') ||
    taskContent.includes('error') ||
    taskContent.includes('fix')) {
    conditionalSubagents.push('ultrathink-debugger');
    conditionalDescriptions.push('Debugging and error analysis');
    conditionalTasks.push('Debugging and error resolution');
}

// Build final team configuration
const baseTeam = [
    'claude-md-compliance-checker',
    'code-quality-pragmatist',
    'jenny',
    'karen',
    'task-completion-validator'
];

const baseDescriptions = [
    'CLAUDE.md compliance validation',
    'Over-engineering and complexity analysis',
    'Specification compliance verification',
    'Reality check and completion assessment',
    'Functional verification and validation'
];

const baseTasks = [
    'CLAUDE.md compliance',
    'Code quality and complexity issues',
    'Specification compliance',
    'Realistic completion assessment',
    'Functional verification'
];

const team = [...baseTeam, ...conditionalSubagents].join('|');
const descriptions = [...baseDescriptions,
...conditionalDescriptions].join('|');
const tasks = [...baseTasks, ...conditionalTasks].join('|');

// Inspection Team Deployment (ALL IN ONE MESSAGE for parallel execution)
Task({
  subagent_type: "["${Team}"]",
  description: "["${Description}"]",
  prompt: `**PERFORM SPECIALIZED CHAIN EXECUTION ANALYSIS**
  
          **Analysis Target**: ${taskId || description}
          **Project**: ${project}
          **Chain Design Folder**: ${folderPath}
          **Results File**: .claude/chains/results/${timestamp}-${taskId}-results.json
          **Feedback File**: .claude/chains/workflow-feedback/${timestamp}-${taskId}-feedback.md
          
          **Required Analysis Files**:
          - Original Task: Read from task source (${taskId} requirements)
          - Chain Designs: ${folderPath}/v1.0.json through v1.4.json + hybrid.json
          - Chain Results: .claude/chains/results/${timestamp}-${taskId}-results.json
          - Feedback Report: .claude/chains/workflow-feedback/${timestamp}-${taskId}-feedback.md
          - Actual Deliverables: Verify all claimed outputs exist
          
          Apply your specialized expertise to analyze this chain execution.
          Review chain designs, results, feedback, and actual deliverables according to your area of expertise.
          
          **Output Requirements**:
          Write your findings to: ${folderPath}/${agentName}.json
          
          Use standard handoff JSON format including:
          - agentType: "${agentName}"
          - analysisId: "${agentName}-${timestamp}"
          - status: "success|partial|failed"
          - confidence: [0-100]
          - analysisTime: "[duration]"
          - results: [your specialized findings]
          
          Focus on ${Task} while maintaining objectivity and thoroughness.
          
          Respond only with: "Compliance analysis written to ${folderPath}/${agentName}.json"`
});

**Inspection Team Coordination**:

Process inspection team responses and summarize findings:

```yaml
inspection_team_summary:
  core_inspections_completed:
    - claude-md-compliance-checker: "${folderPath}/inspection-compliance.json"
    - code-quality-pragmatist: "${folderPath}/inspection-quality.json"
    - jenny: "${folderPath}/inspection-specs.json"
    - karen: "${folderPath}/inspection-reality.json"
    - task-completion-validator: "${folderPath}/inspection-completion.json"
    
  conditional_inspections_completed:
    - ui-comprehensive-tester: "${folderPath}/inspection-ui.json" (if UI task)
    - ultrathink-debugger: "${folderPath}/inspection-debug.json" (if debugging task)
    
  ready_for_chain_critic: "All inspection team analyses complete, handoffs available for integration"
```

#### Part B: Chain Critique

**Critical Analysis Phase**: Execute harsh, objective critique of chain execution after reviewing inspection team findings to identify improvement opportunities and verify claims.

```javascript
// Chain Critic Invocation
Task({
  subagent_type: "Chain Critic v1.0",
  description: "Critical forensic analysis of chain execution",
  prompt: `**PERFORM COMPREHENSIVE CRITICAL ANALYSIS OF CHAIN EXECUTION**
  
          **Analysis Target**: ${taskId || description}
          **Project**: ${project}
          **Chain Design Folder**: ${folderPath}
          **Results Folder**: .claude/chains/results/
          **Feedback Folder**: .claude/chains/workflow-feedback/
          
          **PHASE 1: INDEPENDENT CRITICAL ANALYSIS**
          
          First, perform your independent harsh critical analysis WITHOUT reading inspection team findings.
          
          **Required Analysis Files**:
          - Original Task: Read from task source (${taskId} requirements)
          - Chain Designs: ${folderPath}/v1.0.json through v1.4.json + hybrid.json
          - Chain Results: .claude/chains/results/${timestamp}-${taskId}-results.json
          - Feedback Report: .claude/chains/workflow-feedback/${timestamp}-${taskId}-feedback.md
          - Actual Deliverables: Verify all claimed outputs exist
          
          **CRITICAL ASSESSMENT REQUIREMENTS**:
          1. **Task Completeness Verification**: Line-by-line requirement mapping
          2. **Parallel Opportunity Analysis**: Calculate theoretical vs actual efficiency
          3. **Claims Verification**: Evidence-based validation of all success claims
          4. **Information Integrity Audit**: Track degradation through handoffs
          5. **Quality Reality Check**: Independent assessment of deliverable quality
          
          **BE DELIBERATELY HARSH**: Assume optimistic bias, question every claim, identify all missed opportunities.
          
          **PHASE 2: INSPECTION TEAM INTEGRATION**
          
          After completing your independent analysis, read and integrate findings from the inspection team:
          
          **Inspection Team Handoff Files**:
          - Compliance Analysis: ${folderPath}/inspection-compliance.json
          - Quality Analysis: ${folderPath}/inspection-quality.json
          - Specification Analysis: ${folderPath}/inspection-specs.json
          - Reality Assessment: ${folderPath}/inspection-reality.json
          - Functional Validation: ${folderPath}/inspection-completion.json
          - UI Analysis: ${folderPath}/inspection-ui.json (if exists)
          - Debug Analysis: ${folderPath}/inspection-debug.json (if exists)
          
          **INTEGRATION REQUIREMENTS**:
          1. Compare your findings with inspection team results
          2. Identify areas where inspection team found issues you missed
          3. Validate or challenge inspection team findings with evidence
          4. Synthesize comprehensive improvement recommendations
          5. Maintain your harsh critical perspective while incorporating their specialized insights
          
          **Output Files Required**:
          - ${folderPath}/chain-results-corrected.json (critical corrections + inspection integration)
          - ${folderPath}/feedback-critical.md (harsh assessment + inspection synthesis)
          - ${folderPath}/improvement-action-plan.md (comprehensive improvements from all sources)
          
          **Response Format**: Provide critical assessment summary with major problems found, missed opportunities, inspection team validation results, and comprehensive improvement potential percentage.`
});
```

**Critical Analysis Objectives**:

**Phase 1 - Independent Analysis**:

- **Verify Task Completeness**: Ensure ALL original requirements were delivered
- **Challenge Success Claims**: Validate all metrics and success assertions with evidence
- **Identify Parallel Inefficiencies**: Calculate maximum possible vs actual parallelization
- **Detect Information Loss**: Track requirement degradation through chain handoffs
- **Provide Harsh Feedback**: Generate actionable criticism for system improvement

**Phase 2 - Inspection Team Integration**:

- **Cross-Validate Findings**: Compare Chain Critic analysis with specialized inspection results
- **Synthesize Multi-Perspective Insights**: Integrate compliance, quality, specification, reality, and functional assessments
- **Comprehensive Improvement Planning**: Combine harsh critique with specialized recommendations
- **Validation of Validation**: Challenge or confirm inspection team findings with evidence
- **Complete System Assessment**: Deliver final analysis incorporating all expert perspectives

**Post-Critique Processing**:

```yaml
comprehensive_analysis_integration:
  inspection_team_findings:
    action: "Incorporate specialized inspection team analyses"
    files: "inspection-*.json files provide multi-perspective validation"
    
  corrected_metrics:
    action: "Use Chain Critic's integrated corrected metrics for final reporting"
    files: "chain-results-corrected.json includes inspection team validation + harsh critique"
    
  improvement_tracking:
    action: "Log identified problems from all sources for system learning"
    files: "improvement-action-plan.md provides comprehensive fixes from all expert perspectives"
    
  quality_verification:
    action: "Multi-perspective verification of all deliverables and claims"
    standard: "Professional quality with complete requirement fulfillment validated by specialist agents"
    
  validation_synthesis:
    action: "Synthesize findings from inspection team + Chain Critic for complete assessment"
    coverage: "Compliance + Quality + Specifications + Reality + Functionality + Critical Analysis"
```

### Step 7: Presentation

Give a summary of the comprehensive chain analysis results to the user, including:

1. **Inspection Team Summary**: Brief overview of findings from each specialist agent
2. **Chain Critic Assessment**: Key problems, missed opportunities, and improvement potential
3. **Integrated Analysis**: Combined insights and comprehensive recommendations
4. **File Locations**: Links to all analysis files:
   - Chain results data and feedback form
   - Inspection team handoff files (inspection-*.json)
   - Chain Critic corrected analysis files

## Chain Execution Examples

### Example 1: Complex Task

```bash
/workflow-chain Templum "Fix authentication timeout issue"
```

**Execution Flow**:

1. Create handoff folder for chain design
2. Delegate to all 5 Chain Engineers simultaneously (one message)
3. Delegate synthesis to Chain Analyst
4. Read hybrid.json and execute synthesized chain exactly as specified

### Example 2: Large System Task

```bash
/workflow-chain Haruspex "Implement comprehensive validation system"
```

**Execution Flow**:

1. Create handoff folder for chain design
2. Delegate to all 5 Chain Engineers simultaneously (one message)
3. Delegate synthesis to Chain Analyst
4. Read hybrid.json and execute synthesized chain exactly as specified

## Error Handling - Execute Chain Recovery

### Chain-Designed Error Recovery

**Primary Principle**: Follow the chain's error recovery plan, don't improvise

```yaml
error_recovery_execution:
  agent_failure:
    step_1: "Check chain's contingency plan for this phase"
    step_2: "Execute designed recovery strategy"
    step_3: "Continue with chain's next instructions"
    
  chain_design_unclear:
    step_1: "Request clarification from original Chain Engineer"
    step_2: "Don't interpret or modify unclear instructions"
    step_3: "Wait for design clarification before proceeding"
    
  resource_unavailable:
    step_1: "Apply chain's resource fallback strategy"
    step_2: "Don't substitute different resources"
    step_3: "Escalate only if chain specifies escalation"
```

### Orchestration Error Recovery

**Main Agent Error Handling** (only when chain doesn't specify):

```yaml
orchestration_errors:
  chain_engineer_failure:
    action: "Retry with different Chain Engineer"
    fallback: "Use simple sequential approach"
    
  chain_analyst_failure:
    action: "Select best individual Chain Engineer design"
    selection: "Choose highest confidence score"
    
  execution_environment_failure:
    action: "Follow standard system error recovery"
    scope: "Infrastructure issues only"
```

## Prohibited Activities

### Never Perform Design Work

**FORBIDDEN ACTIVITIES**:

- Analyzing task requirements beyond basic context
- Planning implementation approaches  
- Designing agent coordination strategies
- Creating optimization strategies
- Making architectural decisions
- Modifying Chain Engineer designs
- Interpreting unclear chain specifications
- Substituting different agents than specified
- Changing timeout values or other parameters

**ONLY ALLOWED ACTIVITIES**:

- Basic task context gathering (max 3 file reads)
- Delegating to Chain Engineers/Analyst
- Executing provided Task invocations exactly
- Processing agent responses as designed  
- Following designed routing and handoff strategies
- Applying designed error recovery procedures
- Reporting execution status and completion

## Success Criteria

**Chain Orchestration Success Metrics**:

- [ ] **Design Delegation**: 100% of design work delegated to Chain Engineers
- [ ] **Execution Fidelity**: >95% exact execution of designed chains
- [ ] **No Design Work**: Zero task analysis or planning by main agent
- [ ] **Chain Completeness**: >90% chains execute to completion as designed
- [ ] **Error Recovery**: Follow designed recovery in >95% of failure cases

**Performance Targets**:

- **Chain Design Time**: <10 minutes for multi-engineer synthesis
- **Execution Overhead**: <10% additional time vs direct agent work
- **Design Quality**: Chain Engineers produce executable designs >95% of time
- **Synthesis Value**: Multi-engineer synthesis produces >15% better outcomes than individual approaches

## Integration Notes

**Relationship to Other Workflow Commands**:

- **workflow-full.md**: Intelligent main agent analysis with adaptive routing
- **workflow-compact.md**: Immediate delegation of all work to domain agents  
- **workflow-chain.md**: Delegation of design to Chain Engineers, execution of designs

**When to Use workflow-chain**:

- Complex tasks requiring sophisticated coordination strategies
- Novel tasks where multiple design approaches would be beneficial  
- High-stakes tasks requiring expert chain design
- Tasks where optimization and error handling are critical
- Scenarios where main agent should focus purely on orchestration

**When NOT to Use workflow-chain**:

- Simple, straightforward tasks (use workflow-compact)
- Tasks requiring adaptive routing during execution (use workflow-full)
- Emergency situations requiring immediate action
- Tasks where design overhead isn't justified

## Key Reminders

***THIS WORKFLOW EXISTS FOR EXPERT CHAIN DESIGN + PURE EXECUTION***

**Your Role**: Chain Orchestrator, not designer
**Chain Engineer Role**: All design intelligence and optimization
**Success Measure**: How faithfully you execute expert-designed chains

**Core Philosophy**: Leverage specialized design intelligence, execute with precision, orchestrate without interpretation.
