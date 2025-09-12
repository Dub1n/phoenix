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
3. **IMMEDIATELY DELEGATE TO Analysis Agent**

**ASSESSMENT LIMIT**: Maximum 2 file reads, then delegate

**DO NOT:**

- Analyze requirements yourself
- Plan implementation details
- Understand technical context
- Make decisions about approach

## **STEP 2: DELEGATE - NO MAIN AGENT WORK**

### **DELEGATION REQUIREMENTS**

**Analysis Agent**: **ALL ANALYSIS AND PLANNING**

- Task state assessment
- Requirement analysis
- Implementation planning
- Resource coordination

**Execution Agent**: **ALL CODE IMPLEMENTATION**  

- Code writing
- File modifications
- System changes
- Technical implementation

**Validation Agent**: **ALL TESTING AND VALIDATION**

- Test execution
- Quality checking
- Validation procedures
- Result verification

**Documentation Agent**: **ALL DOCUMENTATION**

- Documentation creation
- Pattern updates
- Task completion
- Status tracking

### **DELEGATION ROUTING - IMMEDIATE HANDOFF**

**Task States → Agent Delegation**:

- **NOT_EXISTS + description** → **Analysis Agent** (create and implement)
- **PENDING [ ]** → **Analysis Agent** (analyze and delegate)
- **IN_PROGRESS [~]** → **Analysis Agent** (assess next steps)
- **TESTING_READY [T]** → **Validation Agent** (test directly)
- **BROKEN [B]** → **Analysis Agent** (analyze and fix)
- **COMPLETED [x]** → **Verify and exit**
- **--validate-only** → **Validation Agent** (direct delegation)
- **--document-only** → **Documentation Agent** (direct delegation)

**CRITICAL**: You assess task state, then **IMMEDIATELY DELEGATE**

## **STEP 3: AGENT DELEGATION COMMANDS**

### **Analysis Agent Delegation**

**DELEGATE WITH**:

```javascript
Task({
  subagent_type: "Analysis Agent", 
  description: "Complete task analysis",
  prompt: `Task: ${taskId || description}
           Project: ${project}
           
           **YOU HANDLE ALL ANALYSIS**
           **DELEGATE TO OTHER AGENTS AS NEEDED**`
});
```

**DO NOT**:

- Provide detailed instructions
- Specify agent approach
- Micromanage agent decisions

### **Execution Agent Delegation**

**DELEGATE WITH**:

```javascript
Task({
  subagent_type: "Execution Agent",
  description: "Execute task implementation", 
  prompt: `Task: ${taskId}
           Project: ${project}
           
           **YOU HANDLE ALL IMPLEMENTATION**
           **USE SAFETY CHECKS AND PATTERN APPLICATION**`
});
```

**DO NOT**:

- Specify implementation approach
- Provide technical instructions
- Micromanage code modifications

### **Validation Agent Delegation**

**DELEGATE WITH**:

```javascript
Task({
  subagent_type: "Validation Agent",
  description: "Validate task completion", 
  prompt: `Task: ${taskId}
           Project: ${project}
           
           **YOU HANDLE ALL VALIDATION**
           **ADAPT TO AVAILABLE RESOURCES**`
});
```

**DO NOT**:

- Specify validation approach
- List resource availability details
- Provide validation instructions

### **Documentation Agent Delegation**

**DELEGATE WITH**:

```javascript
Task({
  subagent_type: "Documentation Agent",
  description: "Document task completion",
  prompt: `Task: ${taskId}
           Project: ${project}
           
           **YOU HANDLE ALL DOCUMENTATION**
           **UPDATE ALL TRACKING SYSTEMS**`
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

**Analysis Agent**: Handles analysis failures
**Execution Agent**: Handles implementation failures
**Validation Agent**: Handles testing failures
**Documentation Agent**: Handles documentation failures

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
2. **IMMEDIATELY DELEGATE** to Analysis Agent
3. Process agent responses and route as needed

### **Example 2: Testing Ready Task**

```bash
/workflow Templum TASK-AUTH-001
```

**YOUR ACTIONS**:

1. Find task status [T] in active-tasks.md
2. **IMMEDIATELY DELEGATE** to Validation Agent  
3. Route to Documentation Agent on success

### **Example 3: Pending Task**

```bash
/workflow Templum TASK-VAL-007
```

**YOUR ACTIONS**:

1. Find task status [ ] in active-tasks.md
2. **IMMEDIATELY DELEGATE** to Analysis Agent
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

***THIS WORKFLOW EXISTS TO PREVENT MAIN AGENT OVERWORK***

**YOUR ROLE**: Dispatcher, not worker
**AGENT ROLES**: All analysis, implementation, validation, documentation
**SUCCESS MEASURE**: How quickly you delegate vs. how much you do yourself
