# /pr:task_subagent - Enhanced Task Implementation with ResearchAgent Integration

## Purpose

Select and implement tasks from the tracker with ResearchAgent-powered intelligent selection and context optimization. **NEVER use emojis**

**TASK-SUBAGENT-003 Integration**: File-based handoff system for 70%+ context reduction and enhanced pattern analysis.

## Usage

``` command
/pr:task_subagent [Project] [TASK-ID] "description" [--research-agent] [--fallback-manual]
```

## Arguments

- `Project` - Project to be developed (optional)
- `TASK-ID` - TASK-ID in the Active Tasks Queue (optional)
- `description` - Description of untracked task
- `--research-agent` - Force ResearchAgent usage (default: auto)
- `--fallback-manual` - Force manual analysis fallback

If /pr:validate --continue, Project and TASK-ID(s) carry over + skip to Step 3: Implementation Execution
If first command in sequence with no Project and no TASK-ID, request these values from the user
If first command in sequence with Project and TASK-ID, continue
If first command in sequence with Project and no TASK-ID, continue
If first command in sequence with no Project and with TASK-ID, continue

## TodoWrite

Add the following tasks to your todo list:

[ ] Step 1: Locate Project Files # (exclude if --continue)
[ ] Step 2: Enhanced Task Selection with ResearchAgent # (exclude if --continue)
[ ] Step 3: Implementation Execution
[ ] Step 4: Check the task status is [~|B|?|T], *NOT* [x]

## Execution

### Step 1: Locate Project Files

**Priority Search Order**:

1. **Find Active Tasks Queue**: Look for `<project>-active-tasks.md` in `<Project>/dev/` folder (PRIMARY TASK SOURCE)
2. **Find Patterns Document**: Look for `*-patterns.md` in `<Project>/dev/` folder
3. **Common locations**: `/dev/` folder (preferred), project root, `/docs/` folder

**File Validation**:

- **Planning file**: Must contain task queues (Immediate Priority, Investigation, Verification)
- **Active Tasks file**: Must contain component status and evidence data
- **Integration**: Both files should cross-reference each other

### Step 2: Enhanced Task Selection with ResearchAgent

**TASK-SUBAGENT-003 Enhancement**: File-based handoff system replacing context-heavy pattern reading.

#### 2a: Task from Description

If the user provides a task description, e.g. `/pr:task_subagent [Project] "I am getting the following error:..."`:

1. Create a new task in the relevant Active Tasks tracker following the guidelines below
2. Execute the rest of the pr:task_subagent steps from 3 onwards.

#### 2b: Enhanced Task Selection Process

**ResearchAgent Integration Workflow**:

```typescript
async function enhancedTaskSelection(projectName: string, taskId?: string): Promise<TaskSelectionResult> {
  const useResearchAgent = shouldUseResearchAgent(projectName, taskId);
  
  if (useResearchAgent) {
    try {
      // Generate unique task identifier
      const selectionTaskId = generateTaskId('RESEARCH');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Prepare file paths
      const inputFile = `./.claude/handoff/input/research-context-${selectionTaskId}-${timestamp}.json`;
      const outputFile = `./.claude/handoff/output/research-results-${selectionTaskId}-${timestamp}.json`;
      
      // Create research context
      const researchContext: HandoffInput = {
        project: projectName,
        task_id: selectionTaskId,
        workflow_phase: 'research',
        context: {
          task_description: taskId ? `Select and analyze task ${taskId}` : "Analyze active tasks and recommend optimal selection",
          requirements: [
            "Identify highest priority task based on complexity and impact",
            "Analyze relevant patterns from templum-patterns.md",
            "Provide implementation guidance and dependency analysis",
            "Assess risk factors and potential blockers"
          ],
          constraints: [
            "Focus on tasks marked as [!] priority or [~] in-progress",
            "Avoid tasks with unresolved dependencies",
            "Consider current project phase (Foundation/Interface/Integration)",
            "Prefer tasks with clear implementation patterns"
          ],
          relevant_files: [
            `${projectName.toLowerCase()}-active-tasks.md`,
            `${projectName.toLowerCase()}-patterns.md`
          ]
        },
        execution_parameters: {
          max_execution_time: 300, // 5 minutes
          confidence_threshold: 'medium',
          fallback_strategy: 'manual_analysis',
          resource_limits: {
            max_context_tokens: 15000,
            max_file_operations: 20
          }
        },
        metadata: {
          created_at: new Date().toISOString(),
          timeout_ms: 300000,
          priority: 'high'
        }
      };
      
      // Write context and launch ResearchAgent
      await writeJSON(inputFile, researchContext);
      
      const agentStatus = await Task({
        subagent_type: "general-purpose",
        description: "ResearchAgent Task Selection",
        prompt: `
          Execute ResearchAgent for intelligent task selection:
          - Input: ${inputFile}
          - Output: ${outputFile}
          - Task: Analyze active tasks, research patterns, recommend optimal implementation
          - Context: Project ${projectName}, focusing on ${taskId || 'optimal task selection'}
          - Requirements: Pattern analysis, complexity assessment, dependency validation
        `
      });
      
      // Process results based on agent status
      if (agentStatus === 'success') {
        const results: HandoffOutput = await readJSON(outputFile);
        
        if (results.status === 'success' && 
            (results.confidence === 'high' || results.confidence === 'medium')) {
          
          // Archive files for audit trail
          await archiveHandoffFiles(inputFile, outputFile, selectionTaskId);
          
          return {
            method: 'research_agent',
            selected_task: results.results.selected_task,
            pattern_analysis: results.results.pattern_analysis,
            implementation_guidance: results.results.recommendations,
            confidence: results.confidence,
            execution_time_ms: results.execution_time_ms
          };
        }
      }
      
      // Log ResearchAgent attempt for metrics
      console.log(`ResearchAgent selection attempt: Status=${agentStatus}, falling back to manual analysis`);
      
    } catch (error) {
      console.warn(`ResearchAgent integration failed: ${error.message}, falling back to manual analysis`);
    }
  }
  
  // Fallback to manual analysis
  return await manualTaskAnalysis(projectName, taskId);
}
```

**Primary Selection Logic** (Manual Fallback):

1. **[TASK-ID]**: If a TASK-ID is provided, select the task with this [TASK-ID] after the name
2. **[!] Priority Override**: User-specified tasks (do this next if no TASK-ID provided)
3. **[n] Sequenced Tasks**: Follow numerical sequence (do this next if no TASK-ID provided or Priority tasks)
4. **[~] In Progress Tasks**: Continue implementation of the in-progress task
5. **[ ] Pending Tasks**: Available tasks by priority score

**Priority Formula** (when ResearchAgent confidence is low):

```
Quick Priority = Impact + Feasibility + Blocking
Each factor: 1-5 points, Total: 3-15 points

Impact (1-5):
    - 5: Prevents build/core functionality
    - 3: Affects important features  
    - 1: Minor/cosmetic issues

Feasibility (1-5):
    - 5: Clear errors, obvious fix
    - 3: Some investigation needed
    - 1: Complex/unclear problem

Blocking (1-5):
    - 5: Blocks all development
    - 3: Blocks other components
    - 1: No blocking impact
```

### Step 3: Implementation Execution

**Enhanced Implementation with ResearchAgent Context**:

1. **Pattern Analysis Integration**:
   - **USE RESEARCH RESULTS**: If ResearchAgent provided pattern analysis, apply recommended patterns
   - **FALLBACK PATTERN SEARCH**: If manual selection, search pattern document for relevant guidance
   - Consider existing patterns before implementing new approaches

2. **TodoWrite Implementation Substeps**:
   - Add specific implementation steps as tasks underneath 'Step 3: Implementation Execution'
   - Break work into logical phases with validation checkpoints
   - Include pattern compliance validation steps

3. **Implementation Strategy** (Enhanced with Research Context):

   **For Simple Tasks (3-5 complexity points)**:
   - Apply direct fix resolving issues/implementing features
   - Use ResearchAgent implementation guidance if available
   - Verify compilation and basic functionality immediately
   - Focus on clear, straightforward solutions

   **For Complex Tasks (6+ complexity points)**:
   - **Root Cause Analysis**: Use ResearchAgent insights if available, trace problems to source
   - **Solution Architecture**: Design fix considering ResearchAgent pattern recommendations
   - **Incremental Implementation**: Break into phases, maintain working state
   - **Pattern Compliance**: Ensure implementation follows recommended patterns

4. **Knowledge Transfer Tags with Research Integration**:

```typescript
// TODO: [TASK-XYZ-001] Pattern: {research_pattern || discovered_pattern} | Complexity: N | Dependencies: dep1,dep2
// Research-Method: {research_agent || manual_analysis} | Confidence: {high|medium|low}
// Context: Clear description of what was implemented and why
// Validation-Required: pattern-compliance, performance-baseline, error-handling
// Pattern-Info: { approach: "approach-used", alternatives: "considered", trade-offs: "made" }
// Agent-Insights: {ResearchAgent recommendations if used}
```

**Implementation Verification** (Enhanced):

- [ ] **Build Compilation**: `npx tsc --noEmit` passes
- [ ] **Component Compilation**: Affected components compile without errors
- [ ] **Pattern Compliance**: Implementation follows research recommendations
- [ ] **No Major Regressions**: Existing functionality not obviously broken
- [ ] **TASK-ID Tags Applied**: Knowledge transfer tags added with research method noted

**Task Status Update** (REQUIRED at implementation completion):

**When implementation is complete, update task status**:

1. **Mark Status**: Update task to appropriate status in `<project>-active-tasks.md`
2. **Research Method Documentation**: Note whether ResearchAgent or manual analysis was used
3. **Run Validation**: Execute `/pr:validate` for comprehensive testing

**Implementation Status Options**:

- **[~]** 'in-progress': Task implementation could not be completed in one session
- **[B]** 'implemented-broken': Core logic done but compilation/tests failing
- **[?]** 'blocked': Cannot proceed due to dependencies or technical issues
- **[T]** 'implemented-testing': Compiles and ready for functional validation

**NEVER mark [x] completed** - completion only happens after documentation phase.

## Utility Functions

### File Management Functions

```typescript
function generateTaskId(prefix: string = 'TASK'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${prefix}-${timestamp}-${random}`;
}

async function writeJSON(filepath: string, data: any): Promise<void> {
  const dir = path.dirname(filepath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
}

async function readJSON(filepath: string): Promise<any> {
  const content = await fs.readFile(filepath, 'utf8');
  return JSON.parse(content);
}

async function archiveHandoffFiles(inputFile: string, outputFile: string, taskId: string): Promise<void> {
  const archiveDir = './.claude/handoff/archive';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  await fs.mkdir(archiveDir, { recursive: true });
  await fs.rename(inputFile, `${archiveDir}/research-archived-${taskId}-${timestamp}-input.json`);
  await fs.rename(outputFile, `${archiveDir}/research-archived-${taskId}-${timestamp}-output.json`);
}

function shouldUseResearchAgent(projectName: string, taskId?: string): boolean {
  // Use ResearchAgent when:
  // 1. No specific task ID provided (need intelligent selection)
  // 2. Complex project with many patterns
  // 3. Not explicitly disabled with --fallback-manual flag
  return !process.argv.includes('--fallback-manual') && 
         (taskId === undefined || projectName === 'Templum');
}

async function manualTaskAnalysis(projectName: string, taskId?: string): Promise<TaskSelectionResult> {
  // Traditional manual selection logic
  // Implementation follows original pr:task selection process
  return {
    method: 'manual_analysis',
    selected_task: null, // Will be filled by manual selection process
    confidence: 'medium',
    execution_time_ms: 0
  };
}
```

### Interface Definitions

```typescript
interface TaskSelectionResult {
  method: 'research_agent' | 'manual_analysis';
  selected_task?: {
    id: string;
    title: string;
    priority: number;
    complexity: number;
    pattern?: string;
  };
  pattern_analysis?: {
    relevant_patterns: string[];
    implementation_guidance: string[];
  };
  implementation_guidance?: string[];
  confidence: 'high' | 'medium' | 'low';
  execution_time_ms: number;
}
```

## Performance Metrics

**TASK-SUBAGENT-003 Success Criteria**:

- [ ] 70%+ reduction in main agent context usage during task selection
- [ ] Equal or better task selection accuracy vs manual approach
- [ ] <5 minute research phase execution time
- [ ] Seamless fallback when ResearchAgent unavailable
- [ ] Integration preserves existing task selection functionality

## Claude Code Integration

- Leverages Read for analysis and file management
- Uses Write, Edit, MultiEdit for implementation and documentation
- Applies TodoWrite and Task for ResearchAgent coordination
- Maintains comprehensive error handling and fallback reporting
- Integrates file-based handoff with existing workflow patterns

## File Storage

**Important**: All new files created by this command are stored in `C:\Users\gabri\Documents\Infotopology\VDL_Vault\.claude` as per TASK-SUBAGENT-003 requirements.