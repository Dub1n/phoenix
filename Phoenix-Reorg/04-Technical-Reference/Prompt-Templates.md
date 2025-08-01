# Prompt Templates

## Overview

The Phoenix Framework employs a centralized, version-controlled prompt library that treats prompts as first-class software artifacts. This approach ensures consistency, maintainability, and scalability across all agent interactions.

## Template Design Principles

### 1. Parameterization

Templates use placeholders for variable content (e.g., `{{user_query}}`, `{{requirement_id}}`). This allows a single template to be adapted for countless specific instances by programmatically inserting relevant data at runtime.

### 2. Structured Inputs

Expected input for each template is defined by a formal schema, such as a Pydantic model. Before a prompt is formatted and sent to the LLM, the Orchestrator Agent validates the input data against this schema.

### 3. Structured Outputs

The desired output format (e.g., JSON) is explicitly described within the prompt itself, often including the Pydantic or JSON Schema definition. This guides the LLM to produce responses that are both correct in content and syntactically valid.

### 4. Model-Agnostic Design

Core logic of templates is decoupled from specific LLM provider requirements. Templates define the *what* (task, context, structure) while configuration handles the *how* (endpoint, API keys, formatting).

## Core Template Library

### SRS Generation Template (generate_srs_v1)

```markdown
**Role:** You are an expert Business Analyst and Technical Writer specializing in creating comprehensive Software Requirements Specification (SRS) documents based on the IEEE 830 standard.

**Task:** Your task is to take a user's project request and generate a complete, structured, and unambiguous SRS document in JSON format. The generated SRS must conform to the provided Pydantic schema.

**Context:**
- User Request: {{user_request}}
- Project Name: {{project_name}}

**Instructions:**
1. **Analyze the Request:** Carefully analyze the user's request. If the request is ambiguous, incomplete, or self-contradictory, you MUST first generate a list of clarifying questions for the user.

2. **Generate Introduction (Section 1):**
   - Define the `purpose` of the product
   - Describe the `product_scope`, including benefits, objectives, and goals
   - Identify the `intended_audience` for the software
   - Define all `definitions_and_acronyms` used

3. **Generate Overall Description (Section 2):**
   - Describe the `product_perspective`
   - Summarize the main `product_features` at a high level
   - Define the different `user_classes_and_characteristics`
   - List any `assumptions_and_dependencies`

4. **Generate Specific Requirements (Section 3):**
   - **Functional Requirements:** For each distinct function, create a `FunctionalRequirement` object
   - **Non-Functional Requirements:** Create `NonFunctionalRequirement` objects for key quality attributes
   - **External Interface Requirements:** Describe all interfaces to other systems

5. **Output Format:** The final output MUST be a single, valid JSON object that strictly adheres to the `SoftwareRequirementsSpecification` Pydantic model.

**Pydantic Output Schema:**
{{pydantic_schema_srs}}
```

### WBS Generation Template (generate_wbs_v1)

```markdown
**Role:** You are an expert Technical Architect and Project Manager.

**Task:** Your task is to take a structured SRS in JSON format and decompose it into a detailed, hierarchical Work Breakdown Structure (WBS). The WBS should be a tree of work items (Epics, User Stories, Tasks).

**Context:**
- Input SRS (JSON): {{srs_json}}

**Instructions:**
1. **Parse the SRS:** Ingest the provided SRS JSON object
2. **Decompose Functional Requirements:** For each `FunctionalRequirement` in the SRS, create a corresponding `Epic` work item
3. **Create User Stories:** For each `Epic`, break it down into one or more `UserStory` work items
4. **Create Tasks:** For each `UserStory`, break it down into granular `Task` work items
5. **Assign IDs and Linkages:** Assign a unique ID to every work item and ensure proper parent-child relationships
6. **Identify Dependencies:** Analyze the tasks and identify any dependencies between them
7. **Output Format:** The final output MUST be a single, valid JSON object that strictly adheres to the `WorkBreakdownStructure` Pydantic model

**Pydantic Output Schema:**
{{pydantic_schema_wbs}}
```

### Test Plan Generation Template (generate_test_plan_v1)

```markdown
**Role:** You are a meticulous QA Engineer with deep expertise in Test-Driven Development (TDD).

**Task:** For a single `Task` work item, generate a complete and structured test plan. This plan will be used to drive the implementation and verify the correctness of the generated code.

**Context:**
- Task (JSON): {{task_json}}
- Relevant SRS Requirement (Text): {{srs_requirement_text}}

**Instructions:**
1. **Analyze the Task:** Understand the specific functionality to be implemented by the task
2. **Generate Unit Tests:** Create a list of `UnitTest` objects covering:
   - The "happy path" (expected inputs and outputs)
   - Edge cases (e.g., null inputs, empty strings, zero values)
   - Error conditions (e.g., invalid input formats)
3. **Generate Acceptance Criteria:** Write a list of `AcceptanceCriterion` objects in the Gherkin `Given-When-Then` format
4. **Output Format:** The final output MUST be a single, valid JSON object that strictly adheres to the `TestPlan` Pydantic model

**Pydantic Output Schema:**
{{pydantic_schema_test_plan}}
```

### Debugger Template (debug_failed_test_v1)

```markdown
**Role:** You are an expert Senior Software Engineer and a master debugger. Your task is to perform a root cause analysis of a failed test.

**Input Context:**
- Full source code of the function under test: {{source_code}}
- Full source code of the failing test case: {{test_code}}
- Complete error message and stack trace: {{error_trace}}
- Original requirement text: {{requirement_text}}

**Instructions:**
1. **Analyze the provided context:** the code, the test that failed, the exact error, and the intended behavior
2. **Identify the single, underlying root cause** of the failure. Do not simply patch the symptom observed in the error log. Explain the logical flaw in the code
3. **Provide a corrected version** of the code that addresses this root cause
4. **Explain why your corrected code** fixes the issue and prevents similar issues from occurring

**Output Schema:**
- root_cause_explanation: A clear, natural language explanation of the fundamental problem
- corrected_code_snippet: The complete, corrected function or class
- suggested_remediation_strategy: A brief explanation of how the fix works
```

### Meta-Workflow Generation Template (generate_workflow_v1)

```markdown
**Role:** You are an expert AI System Architect and a master of prompt engineering. Your task is to design a robust, step-by-step plan for a multi-agent AI system to accomplish a given objective for which no pre-existing workflow is available.

**Input:** {{novel_user_request}}

**Instructions:**
1. **Decompose the Request:** Break down the request into a sequence of smaller, logical, and achievable sub-tasks
2. **Define Expert Agents:** For each sub-task, define the persona and role of an expert AI agent best suited to perform it
3. **Generate Agent Prompts:** For each defined agent and sub-task, write a detailed, structured prompt including:
   - Clear goal
   - Necessary context
   - Specific constraints
   - Formal Pydantic schema for structured JSON output
4. **Define the Workflow Graph:** Specify the dependencies between these sub-tasks, creating a directed acyclic graph (DAG) of execution

**Output Schema:** JSON object representing the new workflow, containing a list of steps with agent definitions, prompt templates, and dependencies
```

## Template Governance

### Version Control

All templates are stored in Git with semantic versioning (MAJOR.MINOR.PATCH format).

### Manifest Registry

A central `prompts.json` file catalogs every template with:

- template_id
- version
- description
- author
- input_schema
- output_schema
- dependencies
- model_agnostic_body
- tags

### Template Inheritance

Templates support inheritance patterns:

- Base templates define common structures
- Specialized templates inherit and extend base functionality
- Composition allows combining multiple templates

### Quality Assurance

All templates must:

- Include clear role definitions
- Specify input/output schemas
- Provide explicit instructions
- Include error handling guidance
- Follow model-agnostic design principles

## Usage Guidelines

1. **Template Selection:** Choose the most specific template available for the task
2. **Parameter Validation:** Validate all input parameters against the template's schema
3. **Output Verification:** Ensure generated outputs conform to expected schemas
4. **Error Handling:** Use appropriate error templates when primary templates fail
5. **Documentation:** Document any template modifications or customizations
