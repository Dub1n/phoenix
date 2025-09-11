# /workflow - **DELEGATION-ONLY** Task Implementation Workflow

## **MANDATORY DELEGATION PROTOCOL**

***YOU MUST DELEGATE IMMEDIATELY - NO MAIN AGENT WORK***

Replaces three-prompt system with unified agent orchestration.

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

## **STEP 1: ASSESS ONLY - DO NOT ANALYZE**

**YOUR ONLY JOBS:**

1. Read active-tasks.md to find task state
2. Check basic resource availability
3. **IMMEDIATELY DELEGATE TO RESEARCHAGENT**

**ASSESSMENT LIMIT**: Maximum 2 file reads, then delegate

**DO NOT:**

- Analyze requirements yourself
- Plan implementation details
- Understand technical context
- Make decisions about approach

## **STEP 2: DELEGATE - NO MAIN AGENT WORK**

### **DELEGATION REQUIREMENTS**

**ResearchAgent**: **ALL ANALYSIS AND PLANNING**

- Task state assessment
- Requirement analysis
- Implementation planning
- Resource coordination

**ExecutionAgent**: **ALL CODE IMPLEMENTATION**  

- Code writing
- File modifications
- System changes
- Technical implementation

**ValidationAgent**: **ALL TESTING AND VALIDATION**

- Test execution
- Quality checking
- Validation procedures
- Result verification

**DocumentationAgent**: **ALL DOCUMENTATION**

- Documentation creation
- Pattern updates
- Task completion
- Status tracking

### **DELEGATION ROUTING - IMMEDIATE HANDOFF**

**Task States → Agent Delegation**:

- **NOT_EXISTS + description** → **ResearchAgent** (create and implement)
- **PENDING [ ]** → **ResearchAgent** (analyze and delegate)
- **IN_PROGRESS [~]** → **ResearchAgent** (assess next steps)
- **TESTING_READY [T]** → **ValidationAgent** (test directly)
- **BROKEN [B]** → **ResearchAgent** (analyze and fix)
- **COMPLETED [x]** → **Verify and exit**
- **--validate-only** → **ValidationAgent** (direct delegation)
- **--document-only** → **DocumentationAgent** (direct delegation)

**CRITICAL**: You assess task state, then **IMMEDIATELY DELEGATE**

## **STEP 3: AGENT DELEGATION COMMANDS**

### **ResearchAgent Delegation**

**DELEGATE WITH**:

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

**DO NOT**:

- Provide detailed instructions
- Specify agent approach
- Micromanage agent decisions

### **ExecutionAgent Delegation**

**DELEGATE WITH**:

```typescript
const executionResult = await Task({
  subagent_type: "ExecutionAgent",
  description: "Task implementation execution",
  prompt: `Use template: task-implementation-execution.json
           Replace {implementation_context} with: ${implementationContext}
           Replace {task_requirements} with: ${taskRequirements}
           Replace {complexity_assessment} with: ${complexityAssessment}
           
           INSTRUCTION: Execute task implementation with safety checks, pattern 
           application, and TASK-ID tag creation
           
           Chain position: Implementation phase - create handoff for validation`
});
```

**DO NOT**:

- Specify implementation approach
- Provide detailed technical instructions
- Micromanage pattern application

### **ValidationAgent Delegation**

**DELEGATE WITH**:

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

**DO NOT**:

- Specify validation approach
- List resource availability details
- Provide validation instructions

### **DocumentationAgent Delegation**

**DELEGATE WITH**:

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

**DO NOT**:

- Specify documentation format
- List available templates
- Provide documentation instructions

## **STEP 4: ORCHESTRATE ONLY**

### **AGENT RESPONSE PROCESSING**

**YOUR ONLY ORCHESTRATION JOBS**:

1. Process agent status responses
2. Route to next agent if needed
3. Report final completion status

**AGENT STATUS RESPONSES**:

- **success** → Route to next agent or complete
- **partial** → Let agent decide next steps
- **failed** → Let agent handle recovery
- **blocked** → Escalate to manual intervention

**NEVER**:

- Analyze agent work
- Make technical decisions
- Override agent recommendations
- Perform agent tasks yourself

## **ERROR HANDLING - AGENTS HANDLE EVERYTHING**

### **AGENTS HANDLE ALL RECOVERY**

**ResearchAgent**: Handles analysis failures
**ExecutionAgent**: Handles implementation failures, rollback, and safety issues  
**ValidationAgent**: Handles testing failures
**DocumentationAgent**: Handles documentation failures

### **YOUR ERROR HANDLING**

**ONLY ESCALATE WHEN**:

- Agent reports "blocked" status
- Agent explicitly requests manual intervention
- Multiple agent failures in sequence

**DO NOT**:

- Try to solve agent problems
- Provide recovery suggestions
- Override agent error handling
- Analyze error causes yourself

## **PROHIBITED ACTIVITIES**

### **NEVER PERFORM AGENT WORK**

**DO NOT**:

- Read technical files for analysis
- Plan implementation approaches
- Write or modify code
- Execute validation procedures
- Create documentation
- Solve technical problems
- Make architectural decisions
- Optimize performance
- Handle complex logic

**ONLY ALLOWED**:

- Read active-tasks.md to find task state
- Basic file existence checks
- Delegate to appropriate agent
- Process agent status responses
- Route between agents
- Report completion status

## **DELEGATION EXAMPLES**

### **Example 1: New Task Implementation**

```bash
/workflow Templum "Fix authentication timeout issue"
```

**YOUR ACTIONS**:

1. Check task doesn't exist in active-tasks.md
2. **IMMEDIATELY DELEGATE** to ResearchAgent
3. Process agent responses and route as needed

### **Example 2: Testing Ready Task**

```bash
/workflow Templum TASK-AUTH-001
```

**YOUR ACTIONS**:

1. Find task status [T] in active-tasks.md
2. **IMMEDIATELY DELEGATE** to ValidationAgent  
3. Route to DocumentationAgent on success

### **Example 3: Pending Task**

```bash
/workflow Templum TASK-VAL-007
```

**YOUR ACTIONS**:

1. Find task status [ ] in active-tasks.md
2. **IMMEDIATELY DELEGATE** to ResearchAgent
3. Follow agent routing recommendations

**CRITICAL**: You assess, delegate, orchestrate - **NEVER ANALYZE OR IMPLEMENT**

## **SUCCESS CRITERIA**

**DELEGATION SUCCESS METRICS**:

- [ ] ≥90% immediate delegation rate (no main agent work)
- [ ] ≤2 file reads before agent delegation
- [ ] 100% agent autonomy in their domains
- [ ] Zero technical analysis by main agent
- [ ] Complete agent self-sufficiency

**FAILURE INDICATORS**:

- Main agent analyzing requirements
- Main agent planning implementation
- Main agent reading technical files
- Main agent making technical decisions
- Main agent performing any agent work

## **CRITICAL REMINDERS**

**THIS WORKFLOW EXISTS TO PREVENT MAIN AGENT OVERWORK**

**YOUR ROLE**: Dispatcher, not worker
**AGENT ROLES**: All analysis, implementation, validation, documentation
**SUCCESS MEASURE**: How quickly you delegate vs. how much you do yourself
