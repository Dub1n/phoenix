# /workflow-chain - Chain-Engineered Task Orchestration

## Purpose

Specialized workflow command that delegates chain **DESIGN** to expert Chain Engineer agents, then executes their optimized chain specifications exactly as provided. This command focuses purely on orchestration - you design nothing, you execute everything.

**Critical Distinction**:

- `/workflow` commands delegate **WORK** to agents
- `/workflow-chain` delegates **DESIGN** to Chain Engineers, then **EXECUTES** their designs

## Usage

```command
/workflow-chain [strategy] [Project] [TASK-ID] "description" [--debug]
```

## Arguments

- `strategy` - Chain design approach (default: `single`)
  - `single` - Use one Chain Engineer (default: v1.0)
  - `multi` - Use all Chain Engineers + Chain Analyst for synthesis
  - `v1.0` - Practical Execution Focus approach
  - `v1.1` - Comprehensive Algorithmic approach  
  - `v1.2` - Pattern-Centric Learning approach
  - `v1.3` - Risk-Adaptive Planning approach
  - `v1.4` - Speed-Optimized Delivery approach
- `Project` - Target project name (auto-detected if omitted)
- `TASK-ID` - Specific task identifier
- `description` - New task description
- `--debug` - Include chain design rationale in output

## Chain Engineer Selection Guide

### Available Chain Engineers

**Chain Engineer v1.0 - Practical Execution Focus**:

- **Strength**: Clear, proven execution patterns
- **Use When**: Need reliable, straightforward implementation
- **Best For**: Standard tasks with known approaches

**Chain Engineer v1.1 - Comprehensive Algorithmic**:

- **Strength**: Sophisticated optimization algorithms
- **Use When**: Complex tasks requiring advanced coordination
- **Best For**: Multi-component systems with optimization needs

**Chain Engineer v1.2 - Pattern-Centric Learning**:

- **Strength**: Historical pattern analysis and adaptation
- **Use When**: Similar tasks have been done before
- **Best For**: Refinement and standardization tasks

**Chain Engineer v1.3 - Risk-Adaptive Planning**:

- **Strength**: Robust error handling and uncertainty management
- **Use When**: High-stakes or uncertain environments
- **Best For**: Critical systems or novel implementations

**Chain Engineer v1.4 - Speed-Optimized Delivery**:

- **Strength**: Rapid decision-making and execution
- **Use When**: Time pressure is the primary constraint
- **Best For**: Urgent fixes or time-critical deliveries

**Chain Analyst v1.0 - Multi-Proposal Synthesis**:

- **Strength**: Combines strengths of multiple approaches
- **Use When**: Using `multi` strategy to get optimal hybrid design
- **Best For**: Complex tasks benefiting from multiple perspectives

## Execution Protocol

### Step 1: Chain Design Delegation

**YOUR ONLY ANALYSIS**: Basic task context gathering (max 3 file reads)

**Single Strategy**:

```javascript
Task({
  subagent_type: "Chain Engineer",
  description: "Design optimal execution chain",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           
           **DESIGN COMPLETE EXECUTION CHAIN**
           Use your specialized approach to create optimized chain.
           Provide execution-ready Task invocations.
           Include error recovery strategies.`
});
```

**Multi Strategy** (multiple Chain Engineers + Chain Analyst):

```javascript
// Phase 1: Multiple Chain Engineers (ALL IN ONE MESSAGE)
Task({
  subagent_type: "Chain Engineer v1.0",
  description: "Design chain - practical approach",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           
           **DESIGN CHAIN USING v1.0 PRACTICAL APPROACH**
           Focus on proven, reliable execution patterns.`
});
Task({
  subagent_type: "Chain Engineer v1.1", 
  description: "Design chain - algorithmic approach",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           
           **DESIGN CHAIN USING v1.1 ALGORITHMIC APPROACH**
           Apply sophisticated optimization algorithms.`
});
Task({
  subagent_type: "Chain Engineer v1.2",
  description: "Design chain - pattern approach",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           
           **DESIGN CHAIN USING v1.2 PATTERN APPROACH**
           Leverage historical patterns and learning.`
});
Task({
  subagent_type: "Chain Engineer v1.3",
  description: "Design chain - risk adaptive",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           
           **DESIGN CHAIN USING v1.3 RISK-ADAPTIVE APPROACH**
           Emphasize robust error handling and uncertainty management.`
});
Task({
  subagent_type: "Chain Engineer v1.4",
  description: "Design chain - speed optimized", 
  prompt: `Task: ${taskId || description}
           Project: ${project}
           
           **DESIGN CHAIN USING v1.4 SPEED-OPTIMIZED APPROACH**
           Prioritize rapid execution and delivery.`
});

// Phase 2: Chain Analyst Synthesis
Task({
  subagent_type: "Chain Analyst",
  description: "Synthesize optimal hybrid chain",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           
           **SYNTHESIZE OPTIMAL CHAIN FROM MULTIPLE PROPOSALS**
           Read all Chain Engineer outputs from previous phase.
           Create superior hybrid design combining best elements.
           Provide execution-ready chain specification.`
});
```

### Step 2: Chain Reception and Parsing

**Receive Chain Specification**: Extract execution instructions from Chain Engineer output:

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
// Phase 1 (single agent)
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

## Chain Execution Examples

### Example 1: Single Strategy Simple Task

```bash
/workflow-chain single Templum "Fix authentication timeout issue"
```

**Execution Flow**:

1. Delegate to Chain Engineer v1.0 (default single strategy)
2. Receive designed chain (likely sequential: Research → Execute → Validate → Document)  
3. Execute Task invocations exactly as provided
4. Process responses and route as designed

### Example 2: Multi Strategy Complex Task

```bash
/workflow-chain multi Haruspex "Implement comprehensive validation system"
```

**Execution Flow**:

1. Delegate to all 5 Chain Engineers simultaneously (one message)
2. Delegate synthesis to Chain Analyst
3. Receive optimal hybrid chain design
4. Execute synthesized chain exactly as specified

### Example 3: Specific Strategy Risk-Critical Task

```bash
/workflow-chain v1.3 Templum "Migrate production database schema"
```

**Execution Flow**:

1. Delegate to Chain Engineer v1.3 (risk-adaptive approach)
2. Receive risk-aware chain with comprehensive error handling
3. Execute chain with robust fallback strategies as designed

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

- **Chain Design Time**: <5 minutes for single strategy, <10 minutes for multi strategy
- **Execution Overhead**: <10% additional time vs direct agent work
- **Design Quality**: Chain Engineers produce executable designs >95% of time
- **Synthesis Value**: Multi strategy produces >15% better outcomes than single

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
