# Full Phoenix Framework Implementation Guide

## Overview

This guide provides a comprehensive roadmap for implementing the complete Phoenix Framework, including all specialized agents, the StateFlow orchestration system, and advanced capabilities like security auditing, documentation generation, and deployment automation.

## Implementation Strategy: 3-Phase Bootstrapping

The Phoenix Framework follows a proven bootstrapping approach that uses AI to build increasingly sophisticated AI systems:

### Phase 1: Human-Driven PDD (Weeks 1-3)

- **Goal**: Build Phoenix-Lite as the foundation tool
- **Approach**: Human architect + structured prompts + coding assistant (Claude Code)
- **Outcome**: Functional Phoenix-Lite CLI tool

### Phase 2: Semi-Automated PDD (Weeks 4-8)  

- **Goal**: Build full framework components using Phoenix-Lite
- **Approach**: Human planning + Phoenix-Lite execution
- **Outcome**: All core agents and StateFlow logic as tested modules

### Phase 3: The "Phoenix Event" (Weeks 9-10)

- **Goal**: Achieve full autonomous operation
- **Approach**: System integration and validation
- **Outcome**: Complete Phoenix Framework capable of autonomous project generation

## Phase 1: Foundation Development

### Prerequisites and Environment Setup

#### Required Infrastructure

```bash
# Development environment
python3.9+
rust 1.70+ (for performance-critical components)
docker (for sandboxed execution)
postgresql (for project memory)

# AI Services
anthropic-api-key (primary LLM access)
openai-api-key (backup/comparison)

# Development tools
git (version control)
pytest (testing framework)  
black (code formatting)
mypy (type checking)
```

#### Repository Structure

``` text
phoenix-framework/
├── README.md
├── pyproject.toml
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
├── src/phoenix/
│   ├── __init__.py
│   ├── core/           # Core framework logic
│   ├── agents/         # Agent implementations
│   ├── orchestration/  # StateFlow FSM
│   ├── schemas/        # Data models and validation
│   ├── tools/          # Agent tools and utilities
│   └── templates/      # Prompt templates
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── configs/
│   ├── default.yaml
│   ├── development.yaml
│   └── production.yaml
└── scripts/
    ├── setup.sh
    ├── test.sh
    └── deploy.sh
```

### 1.1 Core Data Models

Start by implementing the foundational schemas that enable the "Code as Data" paradigm:

```python
# src/phoenix/schemas/base.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum

class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ProjectStatus(str, Enum):
    INITIALIZING = "initializing"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    HALTED = "halted"

class BaseArtifact(BaseModel):
    """Base class for all Phoenix artifacts"""
    id: str = Field(description="Unique identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
```

```python
# src/phoenix/schemas/requirements.py
from .base import BaseArtifact, Priority
from typing import List
from pydantic import Field

class FunctionalRequirement(BaseArtifact):
    """Structured functional requirement specification"""
    title: str
    description: str
    priority: Priority
    acceptance_criteria: List[str] = Field(default=[])
    business_rules: List[str] = Field(default=[])
    dependencies: List[str] = Field(default=[])

class NonFunctionalRequirement(BaseArtifact):
    """Measurable non-functional requirement"""
    category: str = Field(description="Performance, Security, Reliability, etc.")
    description: str
    metric: str = Field(description="How to measure this requirement")
    target_value: str = Field(description="Specific target to achieve")
    measurement_method: str

class SoftwareRequirementsSpecification(BaseArtifact):
    """Complete project requirements specification"""
    project_name: str
    version: str = "1.0.0"
    functional_requirements: List[FunctionalRequirement]
    non_functional_requirements: List[NonFunctionalRequirement]
    assumptions: List[str] = Field(default=[])
    constraints: List[str] = Field(default=[])
    glossary: Dict[str, str] = Field(default={})
```

### 1.2 Agent Interface Framework

Create the base agent interface that all specialized agents will implement:

```python
# src/phoenix/agents/base.py
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel
import asyncio
import logging

class AgentConfig(BaseModel):
    """Configuration for agent behavior"""
    model: str = "claude-3-5-sonnet"
    temperature: float = 0.1
    max_tokens: int = 4000
    timeout: int = 300
    retry_count: int = 3

class AgentResult(BaseModel):
    """Standardized agent result format"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    execution_time: Optional[float] = None
    token_usage: Optional[Dict[str, int]] = None

class BaseAgent(ABC):
    """Base class for all Phoenix agents"""
    
    def __init__(self, config: AgentConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.name = self.__class__.__name__
    
    @abstractmethod
    async def execute(self, input_data: Any, context: Dict[str, Any]) -> AgentResult:
        """Execute the agent's primary function"""
        pass
    
    @abstractmethod
    def validate_input(self, input_data: Any) -> bool:
        """Validate input data format and content"""
        pass
    
    async def _call_llm(self, prompt: str, schema: Optional[BaseModel] = None) -> Any:
        """Make structured LLM call with retries and validation"""
        # Implementation will use chosen LLM client (Anthropic, OpenAI, etc.)
        pass
```

### 1.3 StateFlow Engine

Implement the finite state machine that orchestrates the entire framework:

```python
# src/phoenix/orchestration/state_flow.py
from enum import Enum
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass
import asyncio
import logging

class ProjectState(str, Enum):
    INITIALIZING = "initializing"
    TRIAGE = "triage"
    REQUIREMENT_INGESTION = "requirement_ingestion"
    DECOMPOSITION = "decomposition"
    GENERATION_CYCLE = "generation_cycle"
    VERIFICATION_CYCLE = "verification_cycle"
    SECURITY_AUDIT = "security_audit"
    AGGREGATION = "aggregation"
    FINAL_REVIEW = "final_review"
    COMPLETED = "completed"
    HALTED = "halted"

@dataclass
class StateTransition:
    """Defines a state transition with conditions"""
    from_state: ProjectState
    to_state: ProjectState
    condition: Callable[[Any], bool]
    action: Optional[Callable[[Any], Any]] = None

class StateFlowEngine:
    """Finite state machine for project orchestration"""
    
    def __init__(self, project_context: Dict[str, Any]):
        self.current_state = ProjectState.INITIALIZING
        self.project_context = project_context
        self.state_history: List[ProjectState] = []
        self.transitions: List[StateTransition] = []
        self.logger = logging.getLogger(self.__class__.__name__)
        self._setup_transitions()
    
    def _setup_transitions(self):
        """Define all valid state transitions"""
        self.transitions = [
            StateTransition(
                ProjectState.INITIALIZING,
                ProjectState.TRIAGE,
                lambda ctx: ctx.get('initialized', False)
            ),
            StateTransition(
                ProjectState.TRIAGE,
                ProjectState.REQUIREMENT_INGESTION,
                lambda ctx: ctx.get('complexity_score', 0) > 6
            ),
            # ... additional transitions
        ]
    
    async def execute_state(self, state: ProjectState) -> Dict[str, Any]:
        """Execute actions for a specific state"""
        handler_name = f"_handle_{state.value}"
        handler = getattr(self, handler_name, None)
        
        if not handler:
            raise NotImplementedError(f"No handler for state {state}")
        
        self.logger.info(f"Executing state: {state}")
        return await handler()
    
    async def transition_to(self, target_state: ProjectState) -> bool:
        """Attempt to transition to target state"""
        valid_transition = self._find_valid_transition(target_state)
        
        if not valid_transition:
            self.logger.error(f"Invalid transition from {self.current_state} to {target_state}")
            return False
        
        # Execute transition action if present
        if valid_transition.action:
            await valid_transition.action(self.project_context)
        
        # Update state
        self.state_history.append(self.current_state)
        self.current_state = target_state
        
        self.logger.info(f"Transitioned to state: {target_state}")
        return True
```

## Phase 2: Agent Implementation

### 2.1 Requirements Analyst Agent

```python
# src/phoenix/agents/requirements_analyst.py
from ..base import BaseAgent, AgentResult
from ..schemas.requirements import SoftwareRequirementsSpecification
from typing import Dict, Any

class RequirementsAnalystAgent(BaseAgent):
    """Transforms user requests into structured SRS documents"""
    
    async def execute(self, user_request: str, context: Dict[str, Any]) -> AgentResult:
        """Generate comprehensive SRS from user request"""
        try:
            # Load prompt template
            prompt_template = self._load_template("generate_srs_v1.md")
            
            # Generate structured prompt
            prompt = prompt_template.format(
                user_request=user_request,
                project_name=context.get('project_name', 'Untitled Project')
            )
            
            # Call LLM with schema validation
            srs_data = await self._call_llm(
                prompt, 
                schema=SoftwareRequirementsSpecification
            )
            
            # Validate and return result
            srs = SoftwareRequirementsSpecification(**srs_data)
            return AgentResult(success=True, data=srs)
            
        except Exception as e:
            self.logger.error(f"SRS generation failed: {e}")
            return AgentResult(success=False, error=str(e))
    
    def validate_input(self, user_request: str) -> bool:
        """Validate user request is sufficient for SRS generation"""
        if not user_request or len(user_request.strip()) < 10:
            return False
        
        # Additional validation logic
        required_keywords = ['create', 'build', 'develop', 'implement', 'system', 'application']
        return any(keyword in user_request.lower() for keyword in required_keywords)
```

### 2.2 Test Engineer Agent

```python
# src/phoenix/agents/test_engineer.py
from ..base import BaseAgent, AgentResult
from ..schemas.testing import TestSuite, TestCase
from typing import Dict, Any, List

class TestEngineerAgent(BaseAgent):
    """Generates comprehensive test suites using GTDD methodology"""
    
    async def execute(self, work_item: Dict[str, Any], context: Dict[str, Any]) -> AgentResult:
        """Generate complete test suite for a work item"""
        try:
            # Analyze work item for testable behaviors
            test_scenarios = await self._identify_test_scenarios(work_item)
            
            # Generate test cases for each scenario
            test_cases = []
            for scenario in test_scenarios:
                test_case = await self._generate_test_case(scenario, context)
                test_cases.append(test_case)
            
            # Create comprehensive test suite
            test_suite = TestSuite(
                name=f"TestSuite_{work_item['id']}",
                description=f"Tests for {work_item['title']}",
                test_cases=test_cases
            )
            
            # Validate test coverage
            coverage_report = await self._validate_test_coverage(test_suite, work_item)
            
            return AgentResult(
                success=True, 
                data=test_suite,
                metadata={'coverage_report': coverage_report}
            )
            
        except Exception as e:
            return AgentResult(success=False, error=str(e))
    
    async def _identify_test_scenarios(self, work_item: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Systematically identify all test scenarios"""
        prompt = self._load_template("identify_test_scenarios.md").format(
            work_item=work_item
        )
        
        scenarios = await self._call_llm(prompt)
        return scenarios.get('test_scenarios', [])
    
    async def _generate_test_case(self, scenario: Dict[str, Any], context: Dict[str, Any]) -> TestCase:
        """Generate executable test case for scenario"""
        prompt = self._load_template("generate_test_case.md").format(
            scenario=scenario,
            context=context
        )
        
        test_data = await self._call_llm(prompt, schema=TestCase)
        return TestCase(**test_data)
```

### 2.3 Implementation Agent

```python
# src/phoenix/agents/implementation.py
from ..base import BaseAgent, AgentResult
from ..schemas.testing import TestSuite
from typing import Dict, Any

class ImplementationAgent(BaseAgent):
    """Generates minimal code to satisfy test requirements"""
    
    async def execute(self, test_suite: TestSuite, context: Dict[str, Any]) -> AgentResult:
        """Implement code to make all tests pass"""
        try:
            # Analyze test requirements
            requirements = await self._analyze_test_requirements(test_suite)
            
            # Generate initial implementation
            implementation = await self._generate_implementation(requirements, context)
            
            # Iterative refinement loop
            max_iterations = 5
            for iteration in range(max_iterations):
                # Run tests against implementation
                test_results = await self._run_tests(test_suite, implementation)
                
                if test_results.all_passed:
                    break
                
                # Fix failing tests
                implementation = await self._fix_implementation(
                    implementation, 
                    test_results.failures
                )
            
            return AgentResult(
                success=test_results.all_passed,
                data=implementation,
                metadata={
                    'iterations': iteration + 1,
                    'test_results': test_results
                }
            )
            
        except Exception as e:
            return AgentResult(success=False, error=str(e))
    
    async def _generate_implementation(self, requirements: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Generate initial code implementation"""
        prompt = self._load_template("generate_implementation.md").format(
            requirements=requirements,
            context=context
        )
        
        result = await self._call_llm(prompt)
        return result.get('implementation_code', '')
```

## Phase 3: Advanced Capabilities

### 3.1 Security Analyst Agent

```python
# src/phoenix/agents/security_analyst.py
from ..base import BaseAgent, AgentResult
from typing import Dict, Any, List
import subprocess
import tempfile
import os

class SecurityAnalystAgent(BaseAgent):
    """Performs comprehensive security analysis using SAST tools"""
    
    async def execute(self, code_artifacts: List[Dict[str, Any]], context: Dict[str, Any]) -> AgentResult:
        """Audit code for security vulnerabilities"""
        try:
            security_report = {
                'vulnerabilities': [],
                'risk_score': 0,
                'recommendations': []
            }
            
            for artifact in code_artifacts:
                # Static analysis
                sast_results = await self._run_sast_analysis(artifact)
                security_report['vulnerabilities'].extend(sast_results)
                
                # Pattern-based analysis
                pattern_results = await self._analyze_security_patterns(artifact)
                security_report['vulnerabilities'].extend(pattern_results)
                
                # Dependency analysis
                if artifact.get('dependencies'):
                    dep_results = await self._analyze_dependencies(artifact['dependencies'])
                    security_report['vulnerabilities'].extend(dep_results)
            
            # Calculate risk score
            security_report['risk_score'] = self._calculate_risk_score(security_report['vulnerabilities'])
            
            # Generate recommendations
            security_report['recommendations'] = await self._generate_security_recommendations(
                security_report['vulnerabilities']
            )
            
            # Determine if security audit passes
            passes_audit = security_report['risk_score'] < 7  # Configurable threshold
            
            return AgentResult(
                success=passes_audit,
                data=security_report,
                metadata={'audit_passed': passes_audit}
            )
            
        except Exception as e:
            return AgentResult(success=False, error=str(e))
    
    async def _run_sast_analysis(self, artifact: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Run static application security testing"""
        # Create temporary file with code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(artifact.get('code', ''))
            temp_file = f.name
        
        try:
            # Run bandit for Python SAST
            result = subprocess.run([
                'bandit', '-r', temp_file, '-f', 'json'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                import json
                bandit_results = json.loads(result.stdout)
                return self._parse_bandit_results(bandit_results)
            else:
                self.logger.warning(f"SAST analysis failed: {result.stderr}")
                return []
                
        finally:
            os.unlink(temp_file)
```

### 3.2 Documentation Agent

```python
# src/phoenix/agents/documentation.py
from ..base import BaseAgent, AgentResult
from typing import Dict, Any, List

class DocumentationAgent(BaseAgent):
    """Generates comprehensive project documentation"""
    
    async def execute(self, project_artifacts: Dict[str, Any], context: Dict[str, Any]) -> AgentResult:
        """Generate complete documentation suite"""
        try:
            documentation = {
                'api_documentation': await self._generate_api_docs(project_artifacts),
                'user_guide': await self._generate_user_guide(project_artifacts),
                'developer_guide': await self._generate_developer_guide(project_artifacts),
                'architecture_docs': await self._generate_architecture_docs(project_artifacts),
                'deployment_guide': await self._generate_deployment_guide(project_artifacts)
            }
            
            return AgentResult(success=True, data=documentation)
            
        except Exception as e:
            return AgentResult(success=False, error=str(e))
    
    async def _generate_api_docs(self, artifacts: Dict[str, Any]) -> str:
        """Generate OpenAPI/Swagger documentation"""
        prompt = self._load_template("generate_api_docs.md").format(
            endpoints=artifacts.get('api_endpoints', []),
            models=artifacts.get('data_models', [])
        )
        
        result = await self._call_llm(prompt)
        return result.get('api_documentation', '')
```

### 3.3 Orchestrator Integration

```python
# src/phoenix/orchestration/orchestrator.py
from ..agents import *
from ..schemas import *
from .state_flow import StateFlowEngine, ProjectState
from typing import Dict, Any
import asyncio

class OrchestratorAgent:
    """Central coordinator for the Phoenix Framework"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.agents = self._initialize_agents()
        self.state_engine = None
        self.project_context = {}
    
    def _initialize_agents(self) -> Dict[str, BaseAgent]:
        """Initialize all specialized agents"""
        return {
            'requirements_analyst': RequirementsAnalystAgent(self.config['agents']['requirements']),
            'test_engineer': TestEngineerAgent(self.config['agents']['test_engineer']),
            'implementation': ImplementationAgent(self.config['agents']['implementation']),
            'security_analyst': SecurityAnalystAgent(self.config['agents']['security']),
            'documentation': DocumentationAgent(self.config['agents']['documentation']),
            # ... other agents
        }
    
    async def generate_project(self, user_request: str, project_config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute complete project generation workflow"""
        try:
            # Initialize project context
            self.project_context = {
                'user_request': user_request,
                'project_config': project_config,
                'start_time': datetime.utcnow(),
                'artifacts': {}
            }
            
            # Initialize state engine
            self.state_engine = StateFlowEngine(self.project_context)
            
            # Execute state flow
            while self.state_engine.current_state != ProjectState.COMPLETED:
                if self.state_engine.current_state == ProjectState.HALTED:
                    # Handle human intervention requirement
                    await self._handle_human_intervention()
                    break
                
                # Execute current state
                state_result = await self.state_engine.execute_state(
                    self.state_engine.current_state
                )
                
                # Determine next state based on result
                next_state = self._determine_next_state(
                    self.state_engine.current_state, 
                    state_result
                )
                
                # Transition to next state
                if not await self.state_engine.transition_to(next_state):
                    # Transition failed, halt for review
                    await self.state_engine.transition_to(ProjectState.HALTED)
            
            return {
                'success': self.state_engine.current_state == ProjectState.COMPLETED,
                'final_state': self.state_engine.current_state,
                'artifacts': self.project_context.get('artifacts', {}),
                'execution_summary': self._generate_execution_summary()
            }
            
        except Exception as e:
            logger.error(f"Project generation failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'artifacts': self.project_context.get('artifacts', {})
            }
```

## Deployment and Production Setup

### 4.1 Configuration Management

```yaml
# configs/production.yaml
phoenix:
  version: "2.1.0"
  mode: "production"

orchestration:
  max_concurrent_projects: 10
  state_persistence: "postgresql"
  execution_timeout: 3600

agents:
  requirements_analyst:
    model: "claude-3-5-sonnet"
    temperature: 0.1
    max_tokens: 4000
  
  test_engineer:
    model: "claude-3-5-sonnet"
    temperature: 0.2
    coverage_threshold: 0.9
  
  implementation:
    model: "claude-3-5-sonnet"
    max_iterations: 5
    timeout_per_iteration: 300

quality_gates:
  min_test_coverage: 0.85
  max_security_risk_score: 6
  required_documentation_coverage: 0.90

resource_management:
  dynamic_model_selection: true
  cost_optimization: true
  parallel_execution: true
  max_cost_per_project: 50.00
```

### 4.2 Monitoring and Observability

```python
# src/phoenix/monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time
from functools import wraps

# Define metrics
projects_total = Counter('phoenix_projects_total', 'Total projects processed')
project_duration = Histogram('phoenix_project_duration_seconds', 'Project completion time')
active_projects = Gauge('phoenix_active_projects', 'Currently active projects')
agent_execution_time = Histogram('phoenix_agent_execution_seconds', 'Agent execution time', ['agent_type'])

def monitor_execution(agent_type: str):
    """Decorator to monitor agent execution"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                agent_execution_time.labels(agent_type=agent_type).observe(time.time() - start_time)
                return result
            except Exception as e:
                # Log error metrics
                raise
        return wrapper
    return decorator
```

### 4.3 Testing Strategy

```python
# tests/integration/test_full_workflow.py
import pytest
from phoenix.orchestration.orchestrator import OrchestratorAgent
from phoenix.schemas.requirements import SoftwareRequirementsSpecification

@pytest.mark.asyncio
async def test_complete_project_generation():
    """Test end-to-end project generation workflow"""
    
    # Setup
    orchestrator = OrchestratorAgent(load_test_config())
    user_request = """
    Create a REST API for a todo application with the following features:
    - User registration and authentication
    - CRUD operations for todo items
    - Todo categories and tagging
    - Due date reminders
    - Basic reporting
    """
    
    # Execute
    result = await orchestrator.generate_project(
        user_request=user_request,
        project_config={'name': 'todo_api', 'language': 'python', 'framework': 'fastapi'}
    )
    
    # Verify
    assert result['success'] == True
    assert 'artifacts' in result
    
    artifacts = result['artifacts']
    assert 'requirements' in artifacts
    assert 'test_suites' in artifacts
    assert 'implementation' in artifacts
    assert 'documentation' in artifacts
    
    # Validate requirements quality
    srs = SoftwareRequirementsSpecification(**artifacts['requirements'])
    assert len(srs.functional_requirements) >= 5
    assert len(srs.non_functional_requirements) >= 3
    
    # Validate test coverage
    total_tests = sum(len(suite.test_cases) for suite in artifacts['test_suites'])
    assert total_tests >= 20
    
    # Validate security audit
    security_report = artifacts.get('security_audit', {})
    assert security_report.get('risk_score', 10) < 7
```

This implementation guide provides a comprehensive roadmap for building the full Phoenix Framework. The modular architecture enables incremental development while the bootstrapping approach ensures each phase builds upon the previous one, ultimately achieving the goal of autonomous software development.

---

*The Full Phoenix Framework represents the pinnacle of AI-driven development automation, capable of handling complex projects with minimal human supervision while maintaining high quality and security standards.*
