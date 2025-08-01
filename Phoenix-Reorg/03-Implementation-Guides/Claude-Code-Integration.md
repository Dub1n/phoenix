# Claude Code Integration Guide

## Overview

Claude Code is Anthropic's agentic coding tool that serves as an ideal execution engine for the Phoenix Framework. This guide covers comprehensive integration patterns, optimization strategies, and best practices for leveraging Claude Code within Phoenix workflows.

## Architecture Integration

### Phoenix + Claude Code Synergy

The Phoenix Framework and Claude Code are highly complementary:

- **Phoenix Framework**: Provides strategic orchestration, multi-agent coordination, and structured workflows
- **Claude Code**: Serves as the tactical execution engine with deep codebase understanding and file manipulation capabilities

> [Phoenix Orchestrator]
     ↓ (Structured Tasks)
> [Claude Code Agent]
     ↓ (Code Generation & Modification)
> [Quality Validation]
     ↓ (Feedback Loop)
> [Phoenix State Management]

### Integration Patterns

#### Pattern 1: Phoenix as Strategic Layer

Phoenix handles high-level planning and coordination while delegating implementation to Claude Code:

```python
# Phoenix Orchestrator delegates to Claude Code
class PhoenixClaudeIntegration:
    def __init__(self):
        self.claude_client = ClaudeCodeClient(api_key=os.getenv('ANTHROPIC_API_KEY'))
        
    async def execute_implementation_task(self, task: WorkItem, context: ProjectContext) -> ImplementationResult:
        """Execute implementation task using Claude Code"""
        
        # 1. Prepare structured prompt for Claude Code
        prompt = self._generate_claude_prompt(task, context)
        
        # 2. Execute via Claude Code CLI
        result = await self.claude_client.execute_task(
            prompt=prompt,
            project_path=context.project_path,
            files_to_modify=task.target_files
        )
        
        # 3. Validate result against Phoenix quality gates
        validation = await self._validate_implementation(result, task)
        
        return ImplementationResult(
            success=validation.passed,
            artifacts=result.modified_files,
            quality_metrics=validation.metrics
        )
```

#### Pattern 2: Claude Code as Phoenix Agent

Configure Claude Code as a specialized Phoenix agent:

```python
class ClaudeCodeAgent(BaseAgent):
    """Phoenix agent that wraps Claude Code functionality"""
    
    def __init__(self, config: AgentConfig):
        super().__init__(config)
        self.claude_code = ClaudeCodeClient(config.api_key)
        
    async def execute(self, input_data: Any, context: Dict[str, Any]) -> AgentResult:
        """Execute implementation using Claude Code"""
        try:
            # Convert Phoenix task to Claude Code format
            claude_task = self._convert_to_claude_format(input_data, context)
            
            # Execute with Claude Code
            result = await self.claude_code.execute_with_memory(
                task=claude_task,
                project_memory=context.get('claude_memory'),
                constraints=context.get('coding_conventions')
            )
            
            return AgentResult(
                success=True,
                data=result,
                metadata={'execution_time': result.duration}
            )
            
        except Exception as e:
            return AgentResult(success=False, error=str(e))
```

## Claude Code Configuration

### Project Memory Setup

#### CLAUDE.md Configuration

Create a comprehensive project memory file that Phoenix maintains and Claude Code consumes:

```markdown
# Phoenix Project Memory for Claude Code

## Project Overview

- **Framework**: Phoenix AI Development System
- **Language**: Python 3.9+
- **Architecture**: Multi-agent with StateFlow orchestration
- **Testing**: Pytest with GTDD methodology

## Phoenix Integration Context

You are operating as an agent within the Phoenix Framework. Your role is tactical implementation guided by strategic direction from the Phoenix Orchestrator.

### Current Project State

- Phase: {{current_phase}}
- Active Work Items: {{active_work_items}}
- Completed Components: {{completed_components}}
- Quality Gates: {{quality_requirements}}

## Coding Conventions

- **Style**: Black formatting, PEP 8 compliance
- **Type Hints**: Required for all function signatures
- **Error Handling**: Use structured exceptions with Phoenix error schemas
- **Documentation**: Google-style docstrings for all public methods
- **Testing**: Generate tests using Phoenix GTDD patterns

## Phoenix-Specific Guidelines

1. **Structured Output**: All generated artifacts must conform to Phoenix schemas
2. **State Awareness**: Consider current StateFlow state when making implementation decisions
3. **Quality Integration**: Implement built-in validation for Phoenix quality gates
4. **Traceability**: Maintain links between implementation and originating requirements

## File Organization

>``` text
src/phoenix/
├── agents/          # Specialized AI agents
├── orchestration/   # StateFlow and coordination
├── schemas/         # Pydantic data models
├── tools/          # Agent utilities and tools
└── templates/      # Prompt templates
>```

## Common Patterns

### Agent Implementation Pattern

>```python
class NewAgent(BaseAgent):
    async def execute(self, input_data: Any, context: Dict[str, Any]) -> AgentResult:
        # Validate input
        if not self.validate_input(input_data):
            return AgentResult(success=False, error="Invalid input")
        
        # Process with error handling
        try:
            result = await self._process_request(input_data, context)
            return AgentResult(success=True, data=result)
        except Exception as e:
            return AgentResult(success=False, error=str(e))
>```

### Test Generation Pattern

>```python
# Phoenix GTDD requires comprehensive test coverage
def test_{{feature_name}}_happy_path():
    """Test successful {{feature_name}} execution"""
    # Arrange
    # Act  
    # Assert

def test_{{feature_name}}_edge_cases():
    """Test {{feature_name}} boundary conditions"""
    # Test edge cases

def test_{{feature_name}}_error_conditions():
    """Test {{feature_name}} error handling"""
    # Test error scenarios
>```

```

### Custom Slash Commands

Create Phoenix-specific commands to streamline common operations:

```markdown
<!-- .claude/commands/phoenix-implement.md -->
# Phoenix Implementation Command

You are implementing a Phoenix Framework component. Follow these steps:

1. **Analyze Requirements**: Review the provided work item and understand:
   - Functional requirements being addressed
   - Expected inputs and outputs
   - Quality criteria and constraints

2. **Generate Tests First**: Create comprehensive test suite following GTDD:
   - Happy path scenarios
   - Edge cases and boundary conditions  
   - Error handling and validation
   - Integration with existing components

3. **Implement to Tests**: Write minimal code to satisfy all tests:
   - Follow Phoenix coding conventions
   - Implement proper error handling
   - Add comprehensive docstrings
   - Ensure schema compliance

4. **Validate Integration**: Verify integration with Phoenix framework:
   - Check agent interface compliance
   - Validate schema conformance
   - Test state flow integration
   - Confirm quality gate satisfaction

Parameters:
- work_item: The Phoenix work item specification (JSON)
- context: Project context and constraints
- target_files: Files to create or modify
```

```markdown
<!-- .claude/commands/phoenix-debug.md -->
# Phoenix Debug Command

Debug Phoenix Framework issues systematically:

1. **Issue Analysis**: 
   - Identify failing component (agent, state flow, schema validation)
   - Review error logs and stack traces
   - Check Phoenix state consistency

2. **Root Cause Investigation**:
   - Validate input/output schemas
   - Check agent execution flow
   - Verify state transition logic
   - Review quality gate compliance

3. **Fix Implementation**:
   - Address root cause, not symptoms
   - Maintain Phoenix architectural patterns
   - Ensure fix doesn't break other components
   - Add regression tests

4. **Validation**:
   - Run affected test suites
   - Verify state flow still functions
   - Check integration with other agents
   - Confirm quality metrics maintained

Parameters:
- error_description: Description of the issue
- failed_component: Which Phoenix component is failing
- error_logs: Relevant log output
```

### Automation Hooks

Configure hooks to integrate Phoenix quality gates with Claude Code execution:

```json
{
  "hooks": {
    "preToolUse": {
      "command": "python -m phoenix.hooks.pre_execution",
      "description": "Validate Phoenix context before Claude Code execution"
    },
    "postToolUse": {
      "command": "python -m phoenix.hooks.post_execution", 
      "description": "Run Phoenix quality gates after code generation"
    }
  }
}
```

```python
# phoenix/hooks/post_execution.py
import sys
import json
from phoenix.validation import QualityGateValidator
from phoenix.schemas import validate_generated_artifacts

def main():
    """Post-execution hook for Phoenix quality validation"""
    
    # Read execution context from stdin
    context = json.loads(sys.stdin.read())
    
    # Validate generated artifacts
    validator = QualityGateValidator()
    
    results = {
        'schema_validation': validator.validate_schemas(context['modified_files']),
        'test_coverage': validator.check_test_coverage(context['test_files']),
        'code_quality': validator.analyze_code_quality(context['code_files']),
        'integration': validator.verify_phoenix_integration(context['artifacts'])
    }
    
    # Return validation results
    print(json.dumps(results))
    
    # Exit with error code if validation fails
    if not all(result['passed'] for result in results.values()):
        sys.exit(1)

if __name__ == '__main__':
    main()
```

## Advanced Integration Patterns

### Dynamic Model Selection

Implement Phoenix's dynamic model selection through Claude Code:

```python
class DynamicModelSelector:
    """Selects optimal Claude model based on Phoenix task complexity"""
    
    MODEL_MAP = {
        'simple': 'claude-3-haiku',
        'medium': 'claude-3-5-sonnet', 
        'complex': 'claude-3-opus',
        'architectural': 'claude-3-opus'
    }
    
    def select_model(self, task: WorkItem, context: ProjectContext) -> str:
        """Select model based on Phoenix complexity scoring"""
        
        complexity_score = self._calculate_complexity(task)
        
        if complexity_score <= 3:
            return self.MODEL_MAP['simple']
        elif complexity_score <= 6:
            return self.MODEL_MAP['medium']
        elif complexity_score <= 8:
            return self.MODEL_MAP['complex']
        else:
            return self.MODEL_MAP['architectural']
    
    def _calculate_complexity(self, task: WorkItem) -> int:
        """Calculate task complexity using Phoenix metrics"""
        score = 0
        
        # Factor in task type
        type_scores = {'task': 1, 'story': 3, 'epic': 5}
        score += type_scores.get(task.type, 1)
        
        # Factor in dependencies
        score += min(len(task.dependencies), 3)
        
        # Factor in acceptance criteria complexity
        score += min(len(task.acceptance_criteria), 2)
        
        # Factor in estimated effort
        if task.effort_estimate:
            score += min(task.effort_estimate // 4, 3)
        
        return min(score, 10)
```

### Context-Aware Prompting

Generate Claude Code prompts that are aware of Phoenix state and context:

```python
class PhoenixPromptGenerator:
    """Generates context-aware prompts for Claude Code"""
    
    def __init__(self, template_loader: TemplateLoader):
        self.templates = template_loader
    
    def generate_implementation_prompt(self, task: WorkItem, context: ProjectContext) -> str:
        """Generate implementation prompt with full Phoenix context"""
        
        template = self.templates.load('claude_implementation.j2')
        
        return template.render(
            # Task details
            task=task,
            work_item_context=self._get_work_item_context(task, context),
            
            # Phoenix state information
            current_phase=context.current_phase,
            completed_components=context.completed_components,
            active_quality_gates=context.quality_gates,
            
            # Technical context
            project_structure=context.project_structure,
            coding_conventions=context.coding_conventions,
            test_patterns=context.test_patterns,
            
            # Integration requirements
            schema_definitions=self._get_relevant_schemas(task),
            agent_interfaces=self._get_agent_interfaces(task),
            state_flow_context=context.state_flow_position
        )
    
    def _get_work_item_context(self, task: WorkItem, context: ProjectContext) -> Dict[str, Any]:
        """Gather relevant context for the work item"""
        return {
            'parent_requirements': self._get_parent_requirements(task, context),
            'dependent_tasks': self._get_dependent_tasks(task, context),
            'related_components': self._get_related_components(task, context),
            'quality_requirements': self._get_quality_requirements(task, context)
        }
```

### Error Recovery Integration

Implement Phoenix's hierarchical error resolution with Claude Code:

```python
class PhoenixErrorRecovery:
    """Integrates Phoenix error recovery with Claude Code execution"""
    
    def __init__(self, claude_client: ClaudeCodeClient):
        self.claude_client = claude_client
        self.recovery_strategies = self._initialize_strategies()
    
    async def execute_with_recovery(self, task: WorkItem, context: ProjectContext) -> ImplementationResult:
        """Execute task with Phoenix error recovery patterns"""
        
        max_attempts = 3
        current_attempt = 0
        
        while current_attempt < max_attempts:
            try:
                # Execute with Claude Code
                result = await self.claude_client.execute_task(task, context)
                
                # Validate result
                validation = await self._validate_result(result, task, context)
                
                if validation.success:
                    return ImplementationResult(success=True, data=result)
                
                # Level 1: Self-correction with specific feedback
                if current_attempt < 2:
                    recovery_prompt = self._generate_recovery_prompt(validation.issues, result)
                    task = self._enhance_task_with_feedback(task, recovery_prompt)
                    current_attempt += 1
                    continue
                
                # Level 2: Automated rethink (Phoenix Supervisor Agent)
                supervisor_guidance = await self._get_supervisor_guidance(task, validation.issues)
                if supervisor_guidance:
                    task = self._apply_supervisor_guidance(task, supervisor_guidance)
                    current_attempt += 1
                    continue
                
                # Level 3: Human intervention required
                return ImplementationResult(
                    success=False,
                    error="Requires human intervention",
                    metadata={'validation_issues': validation.issues}
                )
                
            except Exception as e:
                current_attempt += 1
                if current_attempt >= max_attempts:
                    return ImplementationResult(success=False, error=str(e))
        
        return ImplementationResult(success=False, error="Max attempts exceeded")
```

## Performance Optimization

### Cost Management

Implement Phoenix's cost optimization strategies:

```python
class CostOptimizedExecution:
    """Optimizes Claude Code usage costs within Phoenix Framework"""
    
    def __init__(self, budget_manager: BudgetManager):
        self.budget_manager = budget_manager
        self.cost_tracker = CostTracker()
    
    async def execute_cost_optimized(self, tasks: List[WorkItem], context: ProjectContext) -> List[ImplementationResult]:
        """Execute tasks with cost optimization"""
        
        # Batch similar tasks
        task_batches = self._group_similar_tasks(tasks)
        
        results = []
        for batch in task_batches:
            # Select optimal model for batch
            optimal_model = self._select_batch_model(batch)
            
            # Execute batch with shared context
            batch_results = await self._execute_batch(batch, optimal_model, context)
            results.extend(batch_results)
            
            # Update cost tracking
            self.cost_tracker.record_batch_execution(batch, batch_results)
            
            # Check budget constraints
            if self.budget_manager.approaching_limit():
                # Switch to more cost-effective model
                context.force_model = 'claude-3-haiku'
        
        return results
    
    def _group_similar_tasks(self, tasks: List[WorkItem]) -> List[List[WorkItem]]:
        """Group similar tasks for batch processing"""
        groups = {}
        
        for task in tasks:
            # Group by type and complexity
            key = (task.type, task.complexity_score // 3)
            if key not in groups:
                groups[key] = []
            groups[key].append(task)
        
        return list(groups.values())
```

### Session Management

Optimize Claude Code session management for Phoenix workflows:

```python
class PhoenixSessionManager:
    """Manages Claude Code sessions for optimal Phoenix integration"""
    
    def __init__(self):
        self.active_sessions = {}
        self.session_contexts = {}
    
    async def get_session_for_component(self, component: str, context: ProjectContext) -> ClaudeCodeSession:
        """Get or create session optimized for specific component"""
        
        session_key = f"{component}_{context.project_id}"
        
        if session_key not in self.active_sessions:
            # Create new session with component-specific context
            session = await self._create_optimized_session(component, context)
            self.active_sessions[session_key] = session
            
            # Set up session memory
            await self._initialize_session_memory(session, component, context)
        
        return self.active_sessions[session_key]
    
    async def _create_optimized_session(self, component: str, context: ProjectContext) -> ClaudeCodeSession:
        """Create session optimized for specific component type"""
        
        # Component-specific configurations
        config = {
            'agents': {
                'temperature': 0.1,
                'max_tokens': 4000,
                'context_window': 'adaptive'
            },
            'orchestration': {
                'temperature': 0.05,
                'max_tokens': 6000,
                'context_window': 'large'
            },
            'schemas': {
                'temperature': 0.0,
                'max_tokens': 2000,
                'context_window': 'medium'
            }
        }
        
        component_config = config.get(component, config['agents'])
        
        return ClaudeCodeSession(
            model=context.selected_model,
            config=component_config,
            project_path=context.project_path
        )
```

## Quality Assurance Integration

### Automated Validation Pipeline

Integrate Phoenix quality gates with Claude Code execution:

```python
class PhoenixQualityPipeline:
    """Integrates Phoenix quality assurance with Claude Code"""
    
    def __init__(self, validators: List[QualityValidator]):
        self.validators = validators
        self.quality_gates = QualityGateManager()
    
    async def validate_claude_output(self, output: ClaudeCodeResult, context: ProjectContext) -> ValidationResult:
        """Run comprehensive Phoenix quality validation"""
        
        validation_results = []
        
        for validator in self.validators:
            try:
                result = await validator.validate(output, context)
                validation_results.append(result)
                
                # Fail fast on critical issues
                if result.severity == 'critical' and not result.passed:
                    return ValidationResult(
                        passed=False,
                        critical_issues=[result],
                        summary="Critical validation failure"
                    )
                    
            except Exception as e:
                validation_results.append(ValidationResult(
                    passed=False,
                    error=str(e),
                    validator=validator.__class__.__name__
                ))
        
        # Aggregate results
        overall_passed = all(r.passed for r in validation_results)
        critical_issues = [r for r in validation_results if r.severity == 'critical' and not r.passed]
        warnings = [r for r in validation_results if r.severity == 'warning' and not r.passed]
        
        return ValidationResult(
            passed=overall_passed,
            critical_issues=critical_issues,
            warnings=warnings,
            detailed_results=validation_results
        )
```

This comprehensive integration guide enables teams to leverage Claude Code as a powerful execution engine within the Phoenix Framework, combining strategic AI orchestration with tactical implementation excellence.

---

*The Phoenix + Claude Code integration represents the optimal combination of strategic planning and tactical execution, enabling autonomous development with human oversight and quality assurance.*
