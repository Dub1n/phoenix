# Workflow System Feedback Template

**Agent**: [Your identifier]  
**Date**: [YYYY-MM-DD]  
**Workflow Command Used**: [e.g., /workflow Templum TASK-VAL-006]  
**Task Complexity**: [Simple | Moderate | Complex]  
**Chain Length**: [Number of agents used]  

> please place the completed form in .claude\workflows\workflow-feedback once you have filled it in.
> do not worry about being overly-critical of the user or the worlflow, accurate feedback is essential for improvement.

---

## Operation Procedure

[List your workflow - tool calls and other operations. Provide a summary of each, including input and reponse where applicable]

## Overall Workflow Assessment

### Effectiveness Rating

- **Overall Success**: [1-5] (1=Failed, 5=Excellent)
- **Time Efficiency**: [1-5] (1=Much slower than alternatives, 5=Significantly faster)
- **Quality of Outcome**: [1-5] (1=Poor results, 5=Exceptional results)
- **Confidence in Delegation**: [1-5] (1=Uncertain throughout, 5=Highly confident)

### Workflow Flow Experience

- **Command Clarity**: Did the initial command clearly convey what was needed? [Y/N/Partial]
- **Resource Discovery**: Was sufficient context available to understand the task? [Y/N/Partial]
- **Agent Selection**: Did you feel confident in which agents to delegate to? [Y/N/Partial]
- **Natural Flow**: Did the workflow feel logical and efficient? [Y/N/Partial]

---

## Command & Entry Point Analysis

### Initial Command Assessment

Command used: [Full command with arguments]

**Command Compliance Without Reminder** (delete those that don't apply):

- [ ] Delegated tasks to agents
- [ ] Offloaded knowledge transfer to the handoff filesystem
- [ ] Used provided resource discovery context in decision-making
- [ ] Returned standardized status blocks with all required fields
- [ ] Followed specified JSON templates when indicated
- [ ] Updated task states in tracking systems appropriately
- [ ] Adapted approach based on available resource context
- [ ] Implemented autonomous recovery when primary methods unavailable
- [ ] Recognized early exit opportunities when work already complete
- [ ] Maintained context efficiency (avoided unnecessary verbosity)
- [ ] Reported confidence levels accurately
- [ ] Respected command flags and workflow constraints
- [ ] Created proper audit trails and evidence documentation
- [ ] Coordinated effectively in parallel operations
- [ ] Respected existing project structures and conventions

**Command Parsing Issues** (if any):

- [ ] Arguments unclear or ambiguous
- [ ] Missing required information
- [ ] Conflicting parameters
- [ ] Documentation insufficient

**Resource Discovery Effectiveness**:

- **Project Structure Understanding**: [Excellent | Good | Adequate | Poor]
- **Task Context Clarity**: [Clear | Mostly clear | Somewhat unclear | Confusing]
- **Available Tools Recognition**: [All needed tools identified | Most tools | Some missing | Major gaps]

**Suggested Command Improvements**:

[Specific suggestions for command structure, arguments, or documentation]

---

## Agent Delegation Performance

### Agent Selection Process

**Selection Confidence**: [High | Medium | Low]  
**Selection Reasoning**: [Brief explanation of why you chose specific agents]

### Individual Agent Assessment

#### Agent 1: [Agent Type - e.g., AnalysisAgent]

- **Task Given**: [Brief description]
- **Performance**: [Excellent | Good | Adequate | Poor | Failed]
- **Compliance with Instructions**: [Full | Mostly | Partial | Poor]
- **Output Quality**: [Exceptional | Good | Adequate | Inadequate]
- **Handoff Quality**: [Complete | Mostly complete | Missing elements | Poor]

**Specific Issues**:

- [ ] Agent misunderstood task requirements
- [ ] Agent exceeded scope or did unnecessary work
- [ ] Agent missed critical elements
- [ ] Agent handoff was incomplete or unclear
- [ ] Agent took too long or was inefficient

**Agent Improvements Needed**:

[Specific suggestions for this agent type]

#### Agent 2: [Agent Type]

[Repeat above structure for each agent used]

#### Agent 3: [Agent Type]

[Repeat above structure for each agent used]

#### Agent 4: [Agent Type]

[Repeat above structure for each agent used]

---

## Handoff System Evaluation

### Handoff Document Quality

- **Completeness**: [All information provided | Most information | Some gaps | Major gaps]
- **Clarity**: [Very clear | Clear | Somewhat unclear | Confusing]
- **Actionability**: [Perfectly actionable | Mostly actionable | Some unclear steps | Poor guidance]
- **Consistency**: [Consistent format | Mostly consistent | Some inconsistency | Inconsistent]

### Handoff Issues Encountered

- [ ] Missing critical context between agents
- [ ] Handoff documents not found or accessible
- [ ] Information lost between agent transitions
- [ ] Handoff format inconsistent or unclear
- [ ] Redundant information slowing down workflow

### Chain Coordination

- **Inter-Agent Communication**: [Seamless | Good | Adequate | Poor | Broken]
- **Progress Tracking**: [Clear throughout | Mostly clear | Some confusion | Lost track]
- **Error Propagation**: [Well handled | Adequate | Some issues | Poor recovery]

**Handoff System Improvements**:

[Specific suggestions for handoff format, content, or process]

---

## Tool Usage & Technical Performance

### Tool Effectiveness

- **Task Tool Performance**: [Excellent | Good | Adequate | Poor]
- **Agent Response Time**: [Fast | Acceptable | Slow | Too slow]
- **Tool Integration**: [Seamless | Good | Some issues | Poor integration]

### Technical Issues

- [ ] Agent timeouts or failures
- [ ] Tool limitation prevented optimal workflow
- [ ] Context size limitations
- [ ] Performance bottlenecks
- [ ] Integration failures

**Technical Improvements Needed**:

[Specific technical enhancements or fixes needed]

---

## Workflow Efficiency Analysis

### Time Comparison

- **Estimated time for manual approach**: [X minutes/hours]
- **Actual workflow time**: [X minutes/hours]  
- **Efficiency gain/loss**: [X% faster/slower]

### Process Bottlenecks

- [ ] Initial setup and context gathering
- [ ] Agent selection decision-making
- [ ] Waiting for agent responses
- [ ] Handoff document processing
- [ ] Final coordination and completion

### Parallel Opportunities Missed

[Describe any opportunities where agents could have worked in parallel but didn't]

---

## Quality & Outcome Assessment

### Final Deliverable Quality

- **Completeness**: [Fully complete | Mostly complete | Some gaps | Incomplete]
- **Accuracy**: [Highly accurate | Accurate | Some errors | Multiple errors]
- **Professional Standard**: [Exceeds | Meets | Close to | Below standard]

### Compared to Alternative Approaches

- **Better than single agent**: [Significantly | Somewhat | About same | Worse]
- **Better than manual coordination**: [Significantly | Somewhat | About same | Worse]
- **Appropriate for task complexity**: [Perfect fit | Good fit | Acceptable | Overkill | Insufficient]

---

## Qualitative Feedback

### User Experience

**What felt most natural about the workflow?**

[Open response]

**What felt forced or awkward?**

[Open response]

**Confidence throughout the process**:

[Describe confidence levels at different stages and why]

### Most Valuable Aspects

[What worked exceptionally well that should be preserved/emphasized]

### Most Frustrating Aspects  

[What created friction or inefficiency that needs improvement]

### Unexpected Benefits

[Positive outcomes that weren't anticipated]

### Unexpected Challenges

[Problems that weren't anticipated in the design]

---

## Improvement Recommendations

### High Priority Fixes

1. **[Issue]**: [Description and suggested fix]
2. **[Issue]**: [Description and suggested fix]
3. **[Issue]**: [Description and suggested fix]

### Enhancement Opportunities

1. **[Enhancement]**: [Description and expected benefit]
2. **[Enhancement]**: [Description and expected benefit]
3. **[Enhancement]**: [Description and expected benefit]

### Agent Specialization Improvements

[Suggestions for better agent role definition, capabilities, or templates]

### Workflow Template Improvements

[Suggestions for better prompts, instructions, or workflow structure]

---

## Context-Specific Feedback

### Project Type Considerations

**Project**: [e.g., Templum, Haruspex, Phoenix Code Lite]  
**Workflow fit for this project type**: [Excellent | Good | Adequate | Poor]  
**Project-specific adaptations needed**:

[Any project-specific improvements or considerations]

### Task Type Considerations

**Task Category**: [e.g., Validation, Implementation, Analysis, Documentation]  
**Workflow fit for this task type**: [Excellent | Good | Adequate | Poor]  
**Task-specific adaptations needed**:

[Any task-specific improvements or considerations]

---

## Would You Use This Workflow Again?

**For similar tasks**: [Definitely | Probably | Maybe | Probably not | Definitely not]  
**For different task types**: [Definitely | Probably | Maybe | Probably not | Definitely not]  

**Reasoning**:

[Explain your likelihood to reuse and under what conditions]

---

## Additional Comments

[Any other feedback, observations, or suggestions not covered above]

---

**Submission Date**: [YYYY-MM-DD-HHMM]  
**Review Priority**: [High | Medium | Low] (based on issues severity)
