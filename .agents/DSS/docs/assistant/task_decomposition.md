---
tags: [docs, task_management, agent_guidelines]
provides: [task_decomposition_guide, hierarchical_atomic_decomposition]
requires: [meta/assistant_workflows/code_modification.md, meta/assistant_workflows/docs_driven_development.md]
---

# Task Decomposition Guide for DSS Agents

> A structured approach to breaking down any task—big or small—into clear, atomic subtasks that Cursor (and other DSS agents) can execute reliably.

---

## 1. Overview

Effective task decomposition is essential for LLM-powered agents like Cursor to work efficiently and predictably. This guide introduces a **Hierarchical Atomic Decomposition (HAD)** method, optimized for the DSS architecture, ensuring each subtask is:

* **Atomic:** Represents a single, unambiguous action.
* **Contextualized:** Includes necessary inputs, dependencies, and expected outputs.
* **Estimable:** Time or complexity is roughly gauged.

Agents following this method will chain together subtasks to complete complex objectives with minimal supervision.

---

## 2. Core Principles

1. **Atomicity**
   * A subtask should be achievable in one API call or reasoning step (target: 1–5 minutes of agent work).

2. **Clarity**
   * Use verb-led titles and concise descriptions.
   * Specify **Inputs**, **Outputs**, and **Dependencies**.

3. **Modularity**
   * Each subtask stands alone and can be reused across different workflows.

4. **Traceability**
   * Maintain a hierarchical ID (e.g., `1.2.3`) for parent–child relationships.

5. **Estimability**
   * Attach a rough complexity score or time estimate to prioritize scheduling and load balancing.

---

## 3. Decomposition Process

1. **Identify the Top-Level Task**
   * Define the primary goal as a verb-driven statement.

2. **Segment into Major Phases**
   * Break the goal into 3–5 broad components (e.g., Research, Draft, Review).

3. **Iterate Downward**
   * For each phase, split into smaller steps until each is atomic (cannot be further subdivided without loss of clarity).

4. **Annotate Each Subtask**
   * **ID:** Hierarchical numbering (`2.1`, `2.1.1`).
   * **Title:** Verb + object (e.g., "Extract data from API").
   * **Inputs:** Required data or context.
   * **Outputs:** Expected result.
   * **Dependencies:** Other subtasks or external resources.
   * **Estimate:** Time or complexity (e.g., "~2 minutes").

5. **Validate for Completeness**
   * Ensure no missing links or overlapping scopes.
   * Confirm each subtask is actionable by the agent.

---

## 4. Subtask Template

```markdown
### {ID}. {Title} `[STATUS]` #{tag1} #{tag2}
*Related: [Link to related file/resource](mdc:path/to/file), [Another resource](mdc:path/to/another/file)*

- **Inputs:** {List of required inputs with links where applicable}
- **Outputs:** {List of expected outputs}
- **Dependencies:** {IDs of prerequisite subtasks}
- **Estimate:** {Time or complexity score}
- **Status:** {Brief status description}
- **References:** {Optional links to relevant documentation or resources}
```

Inline tags (with # prefix) help categorize and filter tasks. See [Tag Conventions](mdc:meta/guidelines/tag_conventions.md) for detailed tagging guidelines.

Include a status indicator for each task and subtask:

* `[NOT STARTED]` - Work has not yet begun
* `[IN PROGRESS]` - Work has started but is not complete
* `[BLOCKED]` - Cannot proceed due to dependencies or obstacles
* `[COMPLETED]` - Task has been finished and verified
* `[DEFERRED]` - Intentionally postponed to a later time

Use this template when authoring tasks in the DSS repo.

---

## 5. Example Breakdown

**Top-Level Task:** Generate a market-analysis report for Product X.
*Related: [Data Analysis Workflows](mdc:docs/data_workflows.md), [Marketing Templates](mdc:meta/templates/marketing.md)*

1. **1. Gather Data** `[IN PROGRESS]`
   1.1. Query sales database for Q1–Q2 figures. `[COMPLETED]`
   1.2. Fetch competitor pricing from API. `[IN PROGRESS]`

2. **2. Clean & Transform** `[BLOCKED]`
   2.1. Normalize date formats. `[BLOCKED]`
   2.2. Fill missing values in revenue dataset. `[BLOCKED]`

3. **3. Analyze Trends** `[NOT STARTED]`
   3.1. Compute monthly growth rate. `[NOT STARTED]`
   3.2. Generate visualizations (line charts). `[NOT STARTED]`

4. **4. Compile Report** `[NOT STARTED]`
   4.1. Assemble sections into Markdown. `[NOT STARTED]`
   4.2. Review for consistency. `[NOT STARTED]`

**Task Status Summary:**

|  Phase                 |  Status           |  Completion  |
| ---------------------- | ----------------- | ------------ |
|  1. Gather Data        |  IN PROGRESS      |  50%         |
|  2. Clean & Transform  |  BLOCKED          |  0%          |
|  3. Analyze Trends     |  NOT STARTED      |  0%          |
|  4. Compile Report     |  NOT STARTED      |  0%          |
|  **OVERALL**           |  **IN PROGRESS**  |  **12.5%**   |

Each of these subtasks would be written using the template above, with IDs, inputs, outputs, estimates, and status indicators.

---

## 6. Integrating with Cursor

1. **Task Loader:** Cursor ingests the `tasks.md` file and parses entries by ID.

2. **Execution Engine:** For each subtask, Cursor:
   * Validates inputs exist in memory or storage.
   * Executes the action (API call, computation, or transformation).
   * Logs outputs and marks the task complete.

3. **Orchestration:** Pointer tracks current ID, advances to next available subtask, and resolves dependencies.

---

## 7. Best Practices & Tips

* **Reusability:** Common subtasks (e.g., date normalization) should be stored in a shared library.
* **Documentation:** Keep descriptions succinct; link to detailed docs if needed.
* **Versioning:** When tasks change, increment the parent version and update child IDs.
* **Status Tracking:** Always include status indicators for tasks and subtasks, and maintain a summary table.
* **Status Updates:** Update task status markers as progress is made, with timestamp and brief explanation when possible.
* **Link Everything:** Add links to related files, resources, and documentation using `mdc:path/to/file` format.
* **Cross-Reference:** Include section links within the document to help navigation (e.g., `[Task 1](#1-task-name)`).
* **Related Documentation:** Add a dedicated section at the end listing all key related documents.
* **Input Linking:** Link directly to input resources when they are files in the repository.

---

## 8. Integrating into Assistant Workflow

When breaking down tasks, consider how completed work will be integrated into the assistant workflow. Each task should include appropriate subtasks for:

1. **Assistant Integration Planning**
   * Identify which assistant workflow(s) will be affected by the implementation
   * Determine where in the workflow the new functionality should be integrated
   * Document potential edge cases and error handling strategies

2. **Workflow Documentation Updates**
   * Add specific subtasks for updating relevant workflow documentation
   * Ensure changes maintain consistent formatting and structure
   * Verify that links to new functionality are correctly added

3. **Maintenance Checklist Integration**
   * Determine if new functionality requires updates to maintenance triggers
   * Add appropriate trigger conditions to the maintenance checklist
   * Document priority levels for new maintenance tasks

4. **Validation Implementation**
   * Add subtasks for validation of changes after integration
   * Include test cases or example scenarios
   * Document expected behavior and outputs

These integration subtasks should be included in the main task breakdown to ensure that completed work is properly incorporated into the assistant's operational guidelines and workflows.

### Example Integration Subtasks

For a feature like "Frontmatter Validation":

```markdown
4.10. Plan Assistant Workflow Integration `[NOT STARTED]`
- **Inputs:** Completed frontmatter validation tool
- **Outputs:** Integration plan document
- **Dependencies:** 4.1-4.9
- **Estimate:** ~15 minutes

4.11. Update Maintenance Checklist `[NOT STARTED]`
- **Inputs:** Integration plan, existing maintenance checklist
- **Outputs:** Updated maintenance checklist with frontmatter validation triggers
- **Dependencies:** 4.10
- **Estimate:** ~10 minutes

4.12. Add to Assistant Workflows `[NOT STARTED]`
- **Inputs:** Integration plan, assistant workflow documents
- **Outputs:** Updated workflow documents with frontmatter validation steps
- **Dependencies:** 4.10
- **Estimate:** ~20 minutes

4.13. Create Validation Examples `[NOT STARTED]`
- **Inputs:** Frontmatter validation tool
- **Outputs:** Example scenarios for testing integration
- **Dependencies:** 4.9
- **Estimate:** ~15 minutes
```

---

*Add this file to `docs/task_decomposition.md` in the DSS repository. Agents can reference it to ensure consistency in breaking down and executing tasks.*
