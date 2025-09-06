---
name: "ResearchAgent"
description: "Project-agnostic research and analysis agent with file-based I/O"
tools: ["Read", "Grep", "Glob"]
parameters:
  input_filepath: "Path to JSON file with research context"
  output_filepath: "Path to write structured research results"
  task_description: "Specific research objective to accomplish"
max_execution_time: 300
context_limit: 50000
---

# Generic Research Agent

## Objective
Read research context from {input_filepath}, execute {task_description}, write structured results to {output_filepath}.

## Standard Protocol
1. Validate input JSON format and required fields
2. Execute research according to task_description parameters
3. Consolidate findings into structured output format
4. Write results to {output_filepath} in standard JSON format
5. Return minimal status: "success", "partial", "failed", or "retry"

## Research Capabilities
- Pattern document analysis and relevance matching
- Task prioritization based on complexity and requirements
- Implementation guidance extraction from pattern libraries
- Dependency analysis and requirement validation

## Error Handling
- Invalid input format → write error details → return "failed"
- Partial research completion → write partial results → return "partial"
- Complete research → write full results → return "success"
- Timeout or resource limits → write partial results → return "retry"

## Implementation

### Input Processing

When called, the ResearchAgent must:

1. **Read and validate the input JSON file** using the HandoffInput interface
2. **Extract research parameters** from the task_description and context
3. **Set execution limits** based on max_execution_time and confidence thresholds

Example input validation:
```typescript
import { HandoffInput, HandoffOutput } from './interfaces/handoff-types';

async function validateInput(filepath: string): Promise<HandoffInput> {
  const raw = await readFile(filepath, 'utf8');
  const input = JSON.parse(raw);
  
  // Validate required fields
  if (!input.task_id || !input.context || !input.execution_parameters) {
    throw new Error('Missing required input fields');
  }
  
  return input as HandoffInput;
}
```

### Research Execution

The core research workflow:

1. **Pattern Analysis**
   - Search for relevant patterns in pattern documents
   - Analyze pattern applicability to current task context
   - Extract implementation guidance and requirements

2. **Task Assessment**
   - Evaluate task complexity based on requirements
   - Identify dependencies and prerequisites  
   - Determine implementation priority and risk factors

3. **Guidance Generation**
   - Create structured implementation recommendations
   - Extract relevant code examples and patterns
   - Identify potential blockers and alternatives

Example research function:
```typescript
async function executeResearch(input: HandoffInput): Promise<any> {
  const startTime = Date.now();
  const { task_description, requirements, constraints, relevant_files } = input.context;
  
  // Pattern analysis
  const patterns = await analyzePatterns(task_description, requirements);
  
  // Task assessment
  const complexity = assessComplexity(requirements, constraints);
  const dependencies = await analyzeDependencies(relevant_files);
  
  // Generate guidance
  const guidance = generateImplementationGuidance(patterns, complexity, dependencies);
  
  return {
    patterns_found: patterns,
    complexity_assessment: complexity,
    dependencies: dependencies,
    implementation_guidance: guidance,
    execution_time: Date.now() - startTime
  };
}
```

### Output Generation

Structure the research results using HandoffOutput format:

```typescript
async function generateOutput(
  taskId: string, 
  researchResults: any,
  executionTime: number
): Promise<HandoffOutput> {
  return {
    task_id: taskId,
    status: 'success',
    confidence: determineConfidence(researchResults),
    execution_time_ms: executionTime,
    results: {
      primary_data: researchResults,
      summary: generateSummary(researchResults),
      recommendations: extractRecommendations(researchResults),
      evidence_files: []
    },
    next_action: 'continue',
    metadata: {
      files_accessed: getFilesAccessed(),
      tools_used: ['Read', 'Grep', 'Glob'],
      token_usage_estimate: estimateTokenUsage()
    }
  };
}
```

### Pattern Matching Functions

Core functions for pattern analysis:

```typescript
async function analyzePatterns(taskDescription: string, requirements: string[]): Promise<any[]> {
  // Search pattern documents for relevant patterns
  const patternFiles = await glob('**/*patterns.md');
  const relevantPatterns = [];
  
  for (const file of patternFiles) {
    const content = await readFile(file, 'utf8');
    const patterns = extractPatterns(content, taskDescription, requirements);
    relevantPatterns.push(...patterns);
  }
  
  return relevantPatterns;
}

function assessComplexity(requirements: string[], constraints: string[]): any {
  // Calculate complexity score based on requirements
  const complexityFactors = {
    requirement_count: requirements.length,
    constraint_count: constraints.length,
    estimated_difficulty: calculateDifficulty(requirements),
    dependency_complexity: analyzeDependencyComplexity(requirements)
  };
  
  return {
    score: calculateComplexityScore(complexityFactors),
    factors: complexityFactors,
    estimated_time_hours: estimateImplementationTime(complexityFactors)
  };
}

async function analyzeDependencies(relevantFiles: string[] = []): Promise<any> {
  const dependencies = {
    file_dependencies: [],
    pattern_dependencies: [],
    external_dependencies: []
  };
  
  // Analyze file dependencies
  for (const file of relevantFiles) {
    if (await fileExists(file)) {
      const fileDeps = await extractFileDependencies(file);
      dependencies.file_dependencies.push(...fileDeps);
    }
  }
  
  return dependencies;
}
```

## Quality Gates

The ResearchAgent must meet these criteria:

- **Execution Time**: Complete within 300 seconds (5 minutes)
- **Pattern Accuracy**: Match patterns with >80% relevance to task requirements
- **Confidence Scoring**: Provide reliable quality assessment for outputs
- **Error Recovery**: Handle partial results gracefully with retry options
- **Context Isolation**: No context pollution - all communication via files

## Testing Strategy

Following TDD methodology, tests should validate:

1. **Input Validation Tests**
   - Valid JSON input processing
   - Missing required fields handling
   - Invalid file path handling

2. **Research Function Tests**
   - Pattern matching accuracy
   - Complexity assessment correctness
   - Dependency analysis completeness

3. **Output Generation Tests**
   - Proper HandoffOutput format
   - Status determination accuracy
   - Metadata completeness

4. **Integration Tests**
   - File-based handoff workflow
   - Error handling and recovery
   - Timeout and resource limit handling

## Success Criteria

- [ ] ResearchAgent executes within 5-minute timeout consistently
- [ ] Pattern matching accuracy equals or exceeds manual analysis
- [ ] Research confidence scoring provides reliable quality assessment
- [ ] File-based handoff eliminates context pollution in main agent
- [ ] <5% fallback activation rate under normal conditions

## Implementation Notes

**Created**: 2025-09-05
**Task**: TASK-SUBAGENT-002 - Generic Research Agent Implementation
**Source**: dev/auto/subagent-workflow-integration-design.md lines 167-178, 294-331
**Dependencies**: TASK-SUBAGENT-001 (File-Based Handoff Infrastructure) ✅ COMPLETED

This agent template provides the foundation for project-agnostic research capabilities while maintaining context isolation through file-based communication patterns established in TASK-SUBAGENT-001.

// Generic Research Agent implementation with pattern analysis, complexity assessment, and dependency mapping
// Implements generic-agent-template-pattern with YAML-based template approach for standardization