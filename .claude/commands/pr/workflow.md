# /workflow - Integrated Task Implementation Workflow

## Purpose

Intelligent task implementation workflow using specialized agent orchestration with adaptive routing and resource-aware execution. Replaces the three-prompt system (/pr:task → /pr:validate → /pr:document) with a unified, efficient workflow.

## Usage

```command
/workflow [Project] [TASK-ID] "description" [--continue] [--validate-only] [--document-only] [--force-analysis]
```

## Arguments

- `Project` - Target project name (auto-detected if omitted)
- `TASK-ID` - Specific task identifier (triggers direct task handling)
- `description` - New task description (creates and implements new task)
- `--continue` - Continue previous workflow from last state
- `--validate-only` - Skip to validation phase only
- `--document-only` - Skip to documentation phase only
- `--force-analysis` - Force full analysis regardless of task state

## Workflow Architecture

### Intelligent Entry Point Assessment

The workflow starts with a smart assessment to determine what work is actually needed:

```typescript
function assessWorkflowEntry(input: WorkflowInput): WorkflowPlan {
  // Quick task state assessment
  const taskState = determineTaskState(input);
  const availableResources = discoverResources(input.project);
  
  // Route based on actual needs, not rigid sequence
  return createAdaptivePlan(taskState, availableResources, input);
}
```

### Resource Discovery Phase

Execute once at workflow start to inform all subsequent agent decisions:

```yaml
Resource Discovery:
  validation_methods:
    - validation_script_available: boolean
    - unit_tests_available: boolean
    - linting_available: boolean
    - manual_procedures: boolean
  
  project_structure:
    - active_tasks_file: string
    - patterns_file: string
    - documentation_templates: string[]
    - test_directories: string[]
  
  agent_capabilities:
    - research_agent: available | unavailable
    - validation_agent: available | unavailable  
    - documentation_agent: available | unavailable
    - execution_agent: available | unavailable
```

## Adaptive Workflow Engine

### Task State-Based Routing

Instead of always following Analysis → Validation → Documentation, route intelligently:

```typescript
interface TaskStateRouter {
  // Route based on current task state
  routeWorkflow(taskState: TaskState, resources: ResourceContext): WorkflowPath;
}

enum TaskState {
  NOT_EXISTS = "task_not_found",
  NEW_TASK = "new_from_description", 
  PENDING = "[ ]",
  IN_PROGRESS = "[~]",
  TESTING_READY = "[T]",
  BROKEN = "[B]",
  BLOCKED = "[?]",
  COMPLETED = "[x]"
}

enum WorkflowPath {
  FULL_IMPLEMENTATION = "research_implement_validate_document",
  VALIDATE_ONLY = "validate_document",
  FIX_AND_VALIDATE = "research_fix_validate_document", 
  CONTINUE_IMPLEMENTATION = "assess_continue_validate_document",
  DOCUMENT_ONLY = "document_complete",
  VERIFY_COMPLETE = "verify_exit"
}
```

### Conditional Routing Decision Tree

```yaml
Routing Logic:
  
  IF task_state == NOT_EXISTS AND description_provided:
    → ResearchAgent: Create and select new task
    → ExecutionAgent: Implement task  
    → ValidationAgent: Test implementation
    → DocumentationAgent: Complete documentation
  
  IF task_state == PENDING AND no_task_id:
    → ResearchAgent: Select optimal task from queue
    → ExecutionAgent: Implement selected task
    → ValidationAgent: Test implementation  
    → DocumentationAgent: Complete documentation
  
  IF task_state == IN_PROGRESS:
    → ResearchAgent: Assess completion status and next steps
    → Route to appropriate agent based on assessment
  
  IF task_state == TESTING_READY:
    → ValidationAgent: Execute validation with available methods
    → DocumentationAgent: Complete on validation success
  
  IF task_state == BROKEN:
    → ResearchAgent: Analyze failure and determine fix strategy
    → ExecutionAgent: Apply fixes
    → ValidationAgent: Retest  
    → DocumentationAgent: Complete on success
  
  IF task_state == COMPLETED:
    → Quick verification and exit (no agents needed)
  
  IF --validate-only flag:
    → ValidationAgent: Direct validation execution
  
  IF --document-only flag:
    → DocumentationAgent: Direct documentation completion
```

## Specialized Agent Orchestration

### ResearchAgent Integration

**Purpose**: Task selection, analysis, and implementation planning

**Usage Pattern**:

```typescript
const researchResult = await Task({
  subagent_type: "ResearchAgent", 
  description: "Task analysis and selection",
  prompt: `Use template: task-analysis-selection.json
           Replace {input_type} with: ${inputType}
           Replace {project} with: ${project}
           Replace {task_id} with: ${taskId}
           Replace {description} with: ${description}
           Replace {continue_context} with: ${continueContext}
           
           Available resources: ${JSON.stringify(resources)}
           Chain position: 1 of dynamic - create handoff if further agents needed`
});
```

**Resource-Aware Instructions**:

- Pass discovered resource availability to agent
- Let agent adapt analysis approach based on available tools
- Agent decides if handoff needed or direct response sufficient

### ValidationAgent Integration

**Purpose**: All testing and validation activities (NOT ExecutionAgent)

**Adaptive Validation Approach**:

```typescript
const validationResult = await Task({
  subagent_type: "ValidationAgent",
  description: "Adaptive task validation", 
  prompt: `Use template: task-validation-execution.json
           Replace {validation_category} with: ${category}
           Replace {project_scope} with: ${scope}
           Replace {task_context} with: ${taskContext}
           
           Resource availability context:
           - validation_script: ${resources.validation_script_available}
           - unit_tests: ${resources.unit_tests_available}  
           - linting: ${resources.linting_available}
           - manual_procedures: ${resources.manual_procedures}
           
           INSTRUCTION: Use best available validation approach. If primary script 
           unavailable, use alternative methods autonomously. Adapt validation 
           strategy based on available resources.
           
           Chain position: Validation phase - ${handoffContext}`
});
```

**Autonomous Resource Adaptation**:

- ValidationAgent receives full resource context
- Agent chooses optimal validation approach based on availability
- No main agent micromanagement - agent handles obstacles

### DocumentationAgent Integration

**Purpose**: All documentation creation and completion (NOT ExecutionAgent)

**Smart Documentation Approach**:

```typescript
const documentationResult = await Task({
  subagent_type: "DocumentationAgent",
  description: "Task documentation and completion",
  prompt: `Use template: task-documentation-completion.json
           Replace {documentation_type} with: ${docType}
           Replace {pattern_updates} with: ${patternUpdates}
           Replace {tracking_updates} with: ${trackingUpdates}
           Replace {completion_context} with: ${completionContext}
           
           Available documentation resources:
           - documentation_templates: ${resources.documentation_templates}
           - pattern_files: ${resources.pattern_files}
           - tracking_systems: ${resources.tracking_systems}
           
           INSTRUCTION: Create comprehensive documentation using best available 
           templates and update all relevant tracking systems.
           
           Chain position: Final - respond with completion status`
});
```

## Status-Based Decision Engine

### Agent Response Processing

All agents return standardized status blocks for orchestration:

```markdown
## Execution Status
- **Status**: success | partial | failed | blocked
- **Chain Ready**: true | false | not_applicable
- **Next Agents Needed**: [ValidationAgent] | [DocumentationAgent] | none
- **Resource Issues**: validation_script_missing | templates_unavailable | none
- **Recommended Action**: continue | retry | skip_to_documentation | manual_intervention
- **Confidence**: high | medium | low
```

### Decision Matrix Implementation

```typescript
function processAgentResponse(response: AgentResponse): NextAction {
  switch(response.status) {
    case "success":
      if (response.chainReady && response.nextAgentsNeeded.length > 0) {
        return launchNextAgents(response.nextAgentsNeeded, response.handoffLocation);
      }
      return completeWorkflow(response);
      
    case "partial":
      if (response.confidence === "high") {
        return proceedWithWarning(response);
      }
      return assessPartialResult(response);
      
    case "failed":
      return executeRecoveryStrategy(response);
      
    case "blocked":
      return escalateToManual(response);
  }
}
```

## Error Handling and Recovery

### Agent Autonomous Recovery

Agents handle their domain-specific obstacles:

**ValidationAgent Resource Adaptation**:

```yaml
ValidationAgent Recovery:
  validation_script_unavailable:
    - Try unit tests if available
    - Run linting and type checking
    - Execute manual validation procedures
    - Create validation checklist for manual review
    
  unit_tests_failing:
    - Analyze test failures
    - Suggest fixes if obvious
    - Proceed with manual validation
    - Document test failure context
    
  no_validation_possible:
    - Create validation TODO list
    - Document validation requirements
    - Mark task as validation_pending
    - Provide manual validation guidance
```

**DocumentationAgent Resource Adaptation**:

```yaml
DocumentationAgent Recovery:
  templates_unavailable:
    - Use standard documentation format
    - Create basic documentation structure
    - Document based on task context
    
  pattern_files_missing:
    - Create documentation without pattern updates
    - Note pattern update requirements
    - Suggest pattern file creation
    
  tracking_system_unavailable:
    - Create local documentation
    - Provide manual tracking update instructions
    - Document completion status clearly
```

### Main Agent Recovery Coordination

When agent-level recovery isn't sufficient:

```typescript
interface RecoveryStrategy {
  // Retry with different agent configuration
  retry_with_alternative_agent: (agentType: string, alternativeConfig: Config) => Promise<AgentResponse>;
  
  // Route to different workflow path
  route_to_alternative_path: (alternativePath: WorkflowPath) => Promise<WorkflowResult>;
  
  // Escalate to manual intervention with context
  escalate_to_manual: (context: ErrorContext) => ManualInterventionPlan;
  
  // Parallel approach with multiple agents
  try_parallel_approach: (agents: AgentConfig[]) => Promise<ParallelResult>;
}
```

## Optimization Features

### Parallel Operations

When agents can work simultaneously:

```typescript
async function optimizedExecution(workflowPlan: WorkflowPlan): Promise<WorkflowResult> {
  
  // Identify parallelizable operations
  const parallelOpportunities = identifyParallelOps(workflowPlan);
  
  if (parallelOpportunities.validationAndDocPrep) {
    // Run validation while preparing documentation templates
    const [validationResult, docPrepResult] = await Promise.all([
      executeValidation(workflowPlan.validationContext),
      prepareDocumentation(workflowPlan.documentationContext)
    ]);
    
    return combineResults(validationResult, docPrepResult);
  }
  
  // Fall back to sequential execution if no parallelization possible
  return executeSequential(workflowPlan);
}
```

### Early Exit Conditions

Skip unnecessary work:

```typescript
function checkEarlyExit(taskState: TaskState, flags: CommandFlags): EarlyExitDecision {
  
  if (taskState === TaskState.COMPLETED && !flags.forceAnalysis) {
    return { exit: true, reason: "task_already_complete", action: "verify_and_confirm" };
  }
  
  if (flags.validateOnly && taskState === TaskState.TESTING_READY) {
    return { exit: false, skipTo: "validation", reason: "validation_only_requested" };
  }
  
  if (flags.documentOnly && isValidationComplete(taskState)) {
    return { exit: false, skipTo: "documentation", reason: "documentation_only_requested" };
  }
  
  return { exit: false, reason: "full_workflow_needed" };
}
```

### Smart Handoff Management

Minimize handoff overhead:

```typescript
interface HandoffStrategy {
  // Use direct response when chain complete
  useDirectResponse: boolean;
  
  // Create handoff only when next agent needs structured data
  createHandoffWhenNeeded: boolean;
  
  // Archive handoffs only for audit-critical operations
  archiveForAudit: boolean;
  
  // Clean up temporary handoffs automatically
  autoCleanup: boolean;
}
```

## Workflow Examples

### Example 1: New Task Implementation

```bash
/workflow Templum "Fix authentication timeout issue"
```

**Execution Flow**:

1. Main Agent: Assess → task_not_exists, description_provided
2. ResearchAgent: Create task in active queue → select for implementation
3. ExecutionAgent: Implement authentication fix
4. ValidationAgent: Test fix (adapts to available validation methods)
5. DocumentationAgent: Document fix and update patterns

### Example 2: Continue Testing Ready Task

```bash
/workflow Templum TASK-AUTH-001
```

**Execution Flow**:

1. Main Agent: Assess → task found, status=[T] testing_ready
2. ValidationAgent: Execute validation directly (no analysis needed)
3. DocumentationAgent: Complete documentation on validation success

### Example 3: Validation Script Unavailable

```bash
/workflow Haruspex TASK-PERF-002
```

**Execution Flow**:

1. Main Agent: Assess → task found, status=[T], resources={ validation_script: false }
2. ValidationAgent receives resource context → adapts to manual validation
3. ValidationAgent: Runs unit tests + linting + manual checklist
4. DocumentationAgent: Documents with validation notes

### Example 4: Parallel Optimization

```bash
/workflow Templum --continue
```

**Execution Flow**:

1. Main Agent: Assess → in_progress task found
2. ResearchAgent: Quick assessment → ready for validation
3. Parallel execution:
   - ValidationAgent: Runs tests
   - DocumentationAgent: Prepares templates
4. Results combined for final completion

## Performance Metrics

**Success Criteria**:

- [ ] 60-70% reduction in main agent context usage vs three-prompt system
- [ ] Equal or better task completion accuracy
- [ ] <10 minutes total workflow execution time
- [ ] 90%+ success rate with automatic obstacle handling
- [ ] Seamless integration with existing project structures

**Efficiency Gains**:

- Conditional routing eliminates unnecessary phases
- Specialized agents optimize their domain work
- Parallel operations reduce total execution time
- Resource-aware adaptation prevents failures
- Early exit conditions skip redundant work

## Integration Notes

**Claude Code Compatibility**:

- Leverages all available tools appropriately
- Uses Task tool for specialized agent coordination
- Maintains comprehensive error handling
- Preserves audit trails and evidence collection
- Supports all existing project types and structures

**Migration from Three-Prompt System**:

- Preserves all existing functionality
- Improves efficiency through intelligent routing
- Maintains backward compatibility with project structures
- Provides clear upgrade path for existing workflows
