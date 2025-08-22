# API Schemas

## Overview

The Phoenix Framework uses structured data schemas throughout the system to ensure type safety, validation, and reliable inter-agent communication. All schemas are defined using Pydantic models in Python implementations.

## Core Data Models

### Software Requirements Specification

```python
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class FunctionalRequirement(BaseModel):
    id: str = Field(description="Unique identifier, e.g., FR-001")
    description: str = Field(description="Clear, implementation-neutral description of the function")
    priority: Literal["High", "Medium", "Low"]

class NonFunctionalRequirement(BaseModel):
    category: Literal["Performance", "Security", "Reliability", "Scalability", "Usability"]
    description: str = Field(description="Specific, measurable requirement")

class SoftwareRequirementsSpecification(BaseModel):
    project_name: str
    version: str = "1.0"
    introduction: dict = Field(description="Purpose, scope, audience, definitions")
    overall_description: dict = Field(description="Product perspective, features, user classes")
    functional_requirements: List[FunctionalRequirement]
    non_functional_requirements: List[NonFunctionalRequirement]
    external_interface_requirements: List[dict]
```

### Work Breakdown Structure

```python
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class WorkItem(BaseModel):
    id: str = Field(description="Unique identifier, e.g., TSK-012")
    type: Literal["Epic", "UserStory", "Task"]
    title: str
    description: str
    srs_requirement_id: Optional[str] = None
    parent_id: Optional[str] = None
    dependencies: List[str] = Field(default=[], description="List of WorkItem IDs this item depends on")
    estimated_effort: Optional[int] = Field(description="Estimated effort in hours")
    status: Literal["Not Started", "In Progress", "Done"] = "Not Started"

class WorkBreakdownStructure(BaseModel):
    project_name: str
    work_items: List[WorkItem]
    total_estimated_effort: Optional[int] = None
```

### Test Planning

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class UnitTest(BaseModel):
    description: str
    input: Dict[str, Any]
    expected_output: Dict[str, Any]
    test_type: Literal["happy_path", "edge_case", "error_condition"]

class AcceptanceCriterion(BaseModel):
    scenario: str
    given: str
    when: str
    then: str

class TestPlan(BaseModel):
    task_id: str
    unit_tests: List[UnitTest]
    acceptance_criteria: List[AcceptanceCriterion]
    test_framework: str = Field(description="e.g., pytest, JUnit")
    coverage_target: float = Field(default=95.0, description="Required code coverage percentage")
```

### Implementation Results

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class CodeArtifact(BaseModel):
    file_path: str
    content: str
    language: str
    checksum: str = Field(description="SHA256 hash of content")

class TestResult(BaseModel):
    test_name: str
    status: Literal["passed", "failed", "skipped"]
    execution_time: float
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None

class ImplementationResult(BaseModel):
    task_id: str
    artifacts: List[CodeArtifact]
    test_results: List[TestResult]
    coverage_percentage: float
    timestamp: datetime
    agent_id: str
    iteration_count: int = Field(description="Number of iterations required to pass tests")
```

### Verification Reports

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class CloverCheck(BaseModel):
    check_type: Literal["code_to_annotation", "annotation_to_code", "annotation_to_docstring"]
    status: Literal["passed", "failed"]
    confidence_score: float = Field(ge=0.0, le=1.0)
    explanation: str

class StaticAnalysisResult(BaseModel):
    tool: str = Field(description="e.g., pylint, mypy, bandit")
    issues_found: int
    severity_breakdown: Dict[str, int]
    passed: bool

class VerificationReport(BaseModel):
    task_id: str
    test_execution_passed: bool
    clover_checks: List[CloverCheck]
    static_analysis: List[StaticAnalysisResult]
    code_coverage: float
    overall_status: Literal["passed", "failed"]
    timestamp: datetime
    issues: List[str] = Field(default=[], description="List of issues that need to be addressed")
```

### State Management

```python
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum

class ProjectState(str, Enum):
    INITIALIZING = "initializing"
    REQUIREMENT_INGESTION = "requirement_ingestion"
    SPECIFICATION_ANALYSIS = "specification_analysis"
    DECOMPOSITION = "decomposition"
    GENERATION_CYCLE = "generation_cycle"
    VERIFICATION_CYCLE = "verification_cycle"
    FAILURE_ANALYSIS = "failure_analysis"
    AGGREGATION = "aggregation"
    FINAL_REVIEW = "final_review"
    COMPLETED = "completed"
    HALTED = "halted"

class StateTransition(BaseModel):
    from_state: ProjectState
    to_state: ProjectState
    timestamp: datetime
    agent_id: str
    trigger: str = Field(description="What caused this transition")
    data: Optional[Dict[str, Any]] = None

class ProjectContext(BaseModel):
    project_id: str
    current_state: ProjectState
    srs: Optional[SoftwareRequirementsSpecification] = None
    wbs: Optional[WorkBreakdownStructure] = None
    current_task_id: Optional[str] = None
    completed_tasks: List[str] = Field(default=[])
    failed_tasks: List[str] = Field(default=[])
    state_history: List[StateTransition] = Field(default=[])
    metadata: Dict[str, Any] = Field(default={})
```

### Agent Communication

```python
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, Literal
from datetime import datetime

class AgentMessage(BaseModel):
    message_id: str
    sender_agent: str
    recipient_agent: Optional[str] = None  # None for broadcast
    message_type: Literal["task", "result", "error", "status", "query"]
    payload: Dict[str, Any]
    timestamp: datetime
    correlation_id: Optional[str] = None  # For tracking related messages

class AgentCapability(BaseModel):
    agent_id: str
    name: str
    version: str
    supported_message_types: List[str]
    input_schemas: Dict[str, str]  # message_type -> schema_name
    output_schemas: Dict[str, str]
    dependencies: List[str] = Field(default=[])
    status: Literal["active", "inactive", "error"]
```

### Error Handling

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ErrorDetails(BaseModel):
    error_code: str
    error_message: str
    stack_trace: Optional[str] = None
    context: Dict[str, Any] = Field(default={})
    suggested_remediation: Optional[str] = None

class FailureAnalysis(BaseModel):
    task_id: str
    failure_type: Literal["compilation_error", "test_failure", "validation_error", "timeout", "agent_error"]
    root_cause: str
    error_details: ErrorDetails
    retry_count: int
    timestamp: datetime
    recovery_actions: List[str] = Field(default=[])
    escalation_required: bool = False
```

## Schema Validation

### Input Validation

All agent inputs must be validated against their respective schemas before processing. Invalid inputs should be rejected with clear error messages.

### Output Validation

All agent outputs must conform to their specified schemas. Non-conforming outputs should trigger error handling workflows.

### Schema Evolution

- Use semantic versioning for schema changes
- Maintain backward compatibility when possible
- Provide migration paths for breaking changes
- Document all schema modifications

## Usage Guidelines

1. **Type Safety:** Always use strongly-typed schemas for data exchange
2. **Validation:** Validate all inputs and outputs against schemas
3. **Documentation:** Keep schemas well-documented with clear field descriptions
4. **Versioning:** Version schemas and manage changes carefully
5. **Error Handling:** Design schemas to support comprehensive error reporting
6. **Extensibility:** Design schemas to be extensible for future requirements

## Implementation Notes

- All timestamps should use UTC timezone
- String fields should have reasonable length limits
- Numeric fields should have appropriate ranges
- Required fields should be clearly marked
- Optional fields should have sensible defaults where applicable
