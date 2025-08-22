# Self-Executing Refactor Protocol

**Version**: 2.1 (Streamlined)  
**Purpose**: Transform messy codebases into clean, maintainable systems through AI-assisted, systematic refactoring  
**Usage**: Provide this document to an AI agent along with your project files to begin automated refactoring

---

## ⋇ Quick Navigation - Section Links

### Main Protocol Sections

| Section                             | Lines    | Description                                     |
|-------------------------------------|----------|-------------------------------------------------|
| **⊕ EXECUTION ENGINE**              | 9-25     | Core execution instructions and agent behavior  |
| **◊ CURRENT STATE**                 | 27-45    | Current protocol state and working copy format  |
| **⋰ PROGRESS TRACKING**             | 47-85    | Progress overview and phase status              |
| **^ NEXT ACTION**                   | 87-115   | Immediate task and expected output              |
| **⇔ PHASE TRANSITION LOGIC**        | 117-165  | Phase progression rules and completion criteria |
| **⋇ TEMPLATE SYSTEM**               | 167-225  | Core template overview and execution patterns   |
| **◦ PHASE 0: SETUP & CONTEXT**      | 227-285  | Initial setup and project analysis              |
| **⌕ PHASE 1: RECONNAISSANCE**       | 287-345  | Code analysis and refactoring planning          |
| **⊜ PHASE 2: SAFETY NET**           | 347-405  | Testing and validation setup                    |
| **⊛ PHASE 3: STRUCTURAL REORG**     | 407-465  | Code organization and file structure            |
| **◦ PHASE 4: GRANULAR REFACTORING** | 467-525  | Detailed code improvements                      |
| **⑇ PHASE 5: FINAL POLISH**         | 527-585  | Documentation and final validation              |
| **⚡ EDGE CASES & ERROR HANDLING**   | 587-645  | Special scenarios and error recovery            |
| **📚 REFERENCE DOCUMENTS**          | 647-1073 | Links to detailed reference materials           |

### Reference Document Navigation

| Document / Key Section                                                        | Purpose / Line Ranges                                                            |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| [Examples & Workflows](mdc:prompts/code/refactor_protocol_examples.md)        | Workflow examples and troubleshooting                                            |
| [Performance Components](mdc:prompts/code/refactor_protocol/refactor_protocol_phase2_performance.ts) | Phase 2 performance optimization implementation |
| [Template Cache](mdc:prompts/code/refactor_protocol/refactor_protocol_template_cache.ts) | Template caching and optimization system |
| [Memory Manager](mdc:prompts/code/refactor_protocol/refactor_protocol_memory_manager.ts) | Memory management and leak detection |
| [Performance Monitor](mdc:prompts/code/refactor_protocol/refactor_protocol_performance_monitor.ts) | Performance monitoring and analysis |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| **⊕ Usage Examples (9-127)**                                                  | Basic workflow (11-44), Advanced usage (46-65), Multi-phase (67-127)             |
| **◦ Language Examples (129-207)**                                             | Python (131-156), TypeScript (158-171), JavaScript (173-207)                     |
| **⚡ Troubleshooting (209-346)**                                               | Common issues (211-280), Error recovery (282-320), Performance (322-346)         |
| **◊ Sample Outputs (348-520)**                                                | Phase reports (350-390), Template examples (392-450), Progress tracking (452-520)|
| **\* Best Practices (522-600)**                                               | User tips (524-560), Agent guidance (562-600)                                    |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| [Template Reference](mdc:prompts/code/refactor_protocol_templates.md)         | Extended template variations                                                     |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| **⊕ Template System (9-25)**                                                  | Placeholder system (11-17), Resolution process (19-25)                           |
| **◦ Phase 0 Templates (27-85)**                                               | Context analysis (29-65), Environment setup (67-85)                              |
| **⌕ Phase 1 Templates (87-125)**                                              | Code smell analysis (89-125)                                                     |
| **⊜ Phase 2 Templates (127-165)**                                             | Test coverage (129-145), Test creation (147-165)                                 |
| **⊛ Phase 3 Templates (167-205)**                                             | File structure (169-185), Separation strategy (187-205)                          |
| **◦ Phase 4 Templates (207-245)**                                             | Method refactoring (209-225), Class refactoring (227-245)                        |
| **⑇ Phase 5 Templates (247-285)**                                             | Final testing (249-265), Documentation (267-285)                                 |
| **⚡ Edge Cases (287-325)**                                                    | Error recovery (289-305), Performance (307-325)                                  |
| **∞ Variations (327-378)**                                                    | Language patterns (329-378)                                                      |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| [Testing Guide](mdc:prompts/code/refactor_protocol_testing.md)                | Testing procedures and validation                                                |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| **⊎ Testing Strategy (9-25)**                                                 | Philosophy (11-13), Categories (15-25)                                           |
| **◦ Execution Testing (27-125)**                                              | Unit tests (29-65), Action determination (67-85), Phase validation (87-125)      |
| **⌕ Template Validation (127-185)**                                           | Placeholder substitution (129-155), Context population (157-185)                 |
| **◊ Progress Tracking (187-245)**                                             | Working copy (189-215), Cross-session (217-245)                                  |
| **⊜ Error Handling (247-305)**                                                | Failure scenarios (249-275), Recovery validation (277-305)                       |
| **∞ Integration Testing (307-365)**                                           | Complete workflow (309-335), Component interaction (337-365)                     |
| **Performance Testing (367-425)**                                             | Large projects (369-395), Resource optimization (397-425)                        |
| **⋇ Implementation (427-485)**                                                | Framework setup (429-455), Validation metrics (457-485)                          |
| **∞ Best Practices (487-508)**                                                | Testing methodology                                                              |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| [Language Patterns](mdc:prompts/code/refactor_protocol_language_specifics.md) | Language-specific refactoring                                                    |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| **⊕ Overview (9-25)**                                                         | Supported languages (11-15), Pattern categories (17-25)                          |
| **🐍 Python (27-185)**                                                        | Smells (29-65), Refactoring (67-125), Testing (127-155), Documentation (157-185) |
| **🔷 TypeScript (187-285)**                                                   | Smells (189-225), Refactoring (227-265), Testing (267-285)                       |
| **🟨 JavaScript (287-385)**                                                   | Smells (289-325), Refactoring (327-365), Testing (367-385)                       |
| **☕ Java (387-485)**                                                         | Smells (389-425), Refactoring (427-465), Testing (467-485)                       |
| **🔷 C# (487-585)**                                                           | Smells (489-525), Refactoring (527-565), Testing (567-585)                       |
| **∞ Cross-Language (587-685)**                                                | Universal patterns (589-625), Techniques (627-665), Testing (667-685)            |
| **∞ Implementation (687-761)**                                                | Selection criteria (689-725), Protocol integration (727-761)                     |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| [Troubleshooting](mdc:prompts/code/refactor_protocol_troubleshooting.md)      | Problem resolution and recovery                                                  |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| **⚡ Critical Issues (9-85)**                                                  | Protocol failures (11-45), Infinite loops (47-85)                                |
| **◦ Common Problems (87-185)**                                                | Working copy issues (89-125), Template failures (127-165), Phase errors (167-185)|
| **⌕ Advanced Troubleshooting (187-285)**                                      | Performance (189-225), Integration problems (227-265), Context issues (267-285)  |
| **🌳 Decision Tree (287-365)**                                                | Problem ID (289-315), Solution selection (317-345), Implementation (347-365)     |
| **⇔ Recovery Procedures (367-485)**                                           | Reset (369-395), Partial (397-425), Incremental (427-455), Data (457-485)        |
| **⊜ Prevention (487-568)**                                                    | Best practices (489-525), Monitoring (527-565), Documentation (567-568)          |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| [Best Practices](mdc:prompts/code/refactor_protocol_best_practices.md)        | Implementation guidance                                                          |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| **⊕ Implementation (9-85)**                                                   | Core principles (11-45), Architecture (47-85)                                    |
| **◦ Strategies (87-185)**                                                     | Phase Des. (89-125), Template impl. (127-165), State management (167-185)        |
| **⊛ Quality Assurance (187-265)**                                             | Testing strategy (189-225), Quality metrics (227-245), Quality gates (247-265)   |
| **⚡ Performance (267-325)**                                                   | Template optimization (269-295), State optimization (297-325)                    |
| **⊜ Security (327-385)**                                                      | File system security (329-355), Code execution safety (357-385)                  |
| **◦ Maintenance (387-482)**                                                   | Maintainence proc. (389-425), Evolution strat (427-465), Documentation (467-482) |
|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------|

---

## ⊕ EXECUTION ENGINE

**WHEN THIS DOCUMENT IS PROVIDED TO AN AGENT:**

1. **CHECK** for existing working copy in the project directory
2. **COPY** this document only if no working copy exists
3. **READ** the Current State section from your working copy
4. **ANALYZE** the project files provided by the user
5. **DETERMINE** the next action based on current state
6. **EXECUTE** that action using the appropriate template
7. **UPDATE** the progress tracking in your working copy
8. **GENERATE** the next prompt for the user

**AGENT INSTRUCTIONS**:

- **FIRST**: Check if `refactor_protocol_working.md` already exists in the project directory
  - **IF EXISTS**: Use the existing working copy (preserves progress across sessions)
  - **IF NOT EXISTS**: Create a new working copy named `refactor_protocol_working.md`
- **WHEN CREATING NEW WORKING COPY**: Update all MDC links (`mdc:path/to/file`) to point to their actual locations relative to project root
  - **Link Resolution**: Convert relative links from the original document location to absolute paths from project root
  - **Example**: `mdc:prompts/code/refactor_protocol_examples.md` becomes `mdc:prompts/code/refactor_protocol_examples.md` (if that's the actual location)
  - **Validation**: Ensure all links point to existing files or provide clear error messages for broken links
- **THEN**: Follow the execution flow exactly, updating your working copy after each action
- **NEVER** skip steps or move phases without completing all requirements
- **ALWAYS** work from your working copy to preserve progress tracking
- **PRESERVE PROGRESS**: Never overwrite an existing working copy - always continue from where it left off

---

## ⚙️ PERFORMANCE MODULE CONFIGURATION

**Optional Performance Features**: The refactor protocol includes an optional performance optimization module that can be enabled for enhanced monitoring and optimization.

### Performance Module Toggle

**Default**: Performance features are **DISABLED** by default to maintain simplicity and focus on core refactoring.

**Enable**: Users can opt-in by adding `--enable-performance` to their request or explicitly requesting performance features.

### What the Performance Module Provides

When enabled, the performance module adds:

1. **📊 Real-time Performance Monitoring**: Track execution times, memory usage, and resource consumption
2. **🧠 Intelligent Memory Management**: Automatic cleanup, leak detection, and session management
3. **⚡ Template Caching & Optimization**: LRU caching, precompilation, and lazy loading
4. **🔍 Bottleneck Detection**: Identify performance issues and provide optimization suggestions
5. **📈 Performance Reporting**: Comprehensive metrics and trend analysis

### Usage Examples

**Basic Refactoring (Default)**:
```
"Use the refactor protocol to clean up this codebase"
```

**With Performance Features**:
```
"Use the refactor protocol with performance monitoring to clean up this codebase"
```

**Explicit Performance Request**:
```
"Use the refactor protocol --enable-performance to clean up this codebase"
```

### Performance Module Integration Points

When enabled, performance features integrate at these protocol phases:

- **Phase 0**: Performance monitoring initialization
- **Phase 1**: Template caching for analysis operations
- **Phase 2**: Memory management during test generation
- **Phase 3**: Performance tracking during structural changes
- **Phase 4**: Optimization suggestions during refactoring
- **Phase 5**: Final performance report and recommendations

---

## ◊ CURRENT STATE

```json
{
  "phase": 0,
  "step": "initial_setup",
  "completed": [],
  "project_context": null,
  "file_analysis": null,
  "test_coverage": null,
  "refactoring_plan": null,
  "next_action": "gather_project_context",
  "last_updated": "initial",
  "performance_module": {
    "enabled": false,
    "initialized": false,
    "monitoring_active": false,
    "caching_enabled": false,
    "memory_management_active": false
  }
}
```

---

## ⋰ PROGRESS TRACKING

### Overall Progress: 0% Complete

- **Phase 0**: Setup & Context Gathering - [NOT STARTED]
- **Phase 1**: Reconnaissance & Planning - [NOT STARTED]  
- **Phase 2**: Safety Net Creation - [NOT STARTED]
- **Phase 3**: Structural Reorganization - [NOT STARTED]
- **Phase 4**: Granular Refactoring - [NOT STARTED]
- **Phase 5**: Final Polish & Documentation - [NOT STARTED]

### Performance Module Status

- **Status**: [DISABLED] (Default) / [ENABLED] (User Requested)
- **Features**: Template Caching, Memory Management, Performance Monitoring
- **Integration**: [NOT INITIALIZED] / [ACTIVE] / [COMPLETED]

### Current Status

- **Phase**: 0 - Setup & Context Gathering
- **Step**: Initial Setup
- **Action Required**: Gather project context and establish refactoring environment

### Completed Work

- None yet

### Next Actions

1. Analyze provided project files
2. Extract project context (language, framework, structure)
3. Set up refactoring environment
4. Move to Phase 1: Reconnaissance

---

## ^ NEXT ACTION

**IMMEDIATE TASK**: Phase 0, Step 1 - Project Context Analysis

**What to do**:

1. Examine the project files provided by the user
2. Identify programming language, frameworks, and current structure
3. Assess the scope and complexity of the refactoring effort
4. Update the Current State with project context
5. Prepare for Phase 1: Reconnaissance

**Expected Output**:

- Project context summary
- Initial file structure analysis
- Refactoring scope assessment
- Clear next steps for Phase 1

---

## ⊎ TESTING & VALIDATION FRAMEWORK

### Testing Strategy Overview

**Phase 3 Implementation**: Comprehensive testing and validation framework to ensure the self-executing refactor protocol works reliably across all scenarios.

**Testing Philosophy**: Test the execution engine logic, validate template resolution, verify progress tracking persistence, and ensure robust error handling and recovery.

---

### 1. Execution Engine Logic Testing

#### 1.1 Unit Test Execution Flow

**Purpose**: Test each phase transition rule independently to ensure correct workflow progression.

**Test Scenarios**:

- **Phase 0 → Phase 1**: project_context + environment_setup complete
- **Phase 1 → Phase 2**: file_analysis + refactoring_plan complete  
- **Phase 2 → Phase 3**: test_coverage > 90% for critical modules
- **Phase 3 → Phase 4**: structural_reorganization complete
- **Phase 4 → Phase 5**: all granular_refactoring_tasks complete

**Validation Criteria**:

- [ ] Each phase transition rule executes correctly
- [ ] Phase progression only occurs when all criteria are met
- [ ] Invalid transitions are properly rejected
- [ ] Edge cases (incomplete data) are handled gracefully

#### 1.2 Action Determination Testing

**Purpose**: Verify correct template selection based on current state and project context.

**Test Scenarios**:

- **Template Selection Logic**: Appropriate templates selected for each phase/step
- **Context-Aware Selection**: Language/framework-specific template selection
- **Fallback Handling**: Behavior when preferred templates unavailable
- **Template Compatibility**: Template selection validation against requirements

**Validation Criteria**:

- [ ] Correct template selected for each action type
- [ ] Context variables properly influence template selection
- [ ] Fallback templates work when primary templates fail
- [ ] Template compatibility validation prevents mismatches

#### 1.3 Phase Progression Validation

**Purpose**: Ensure phases advance only when completion criteria are fully satisfied.

**Test Scenarios**:

- **Completion Criteria Validation**: Each phase's completion requirements
- **Partial Completion Handling**: System doesn't advance with incomplete work
- **Rollback Capability**: Ability to return to previous phases when needed
- **Progress Preservation**: Completed work maintained during phase transitions

**Validation Criteria**:

- [ ] All completion criteria must be satisfied before phase advancement
- [ ] Partial completion is properly tracked and reported
- [ ] Rollback to previous phases works correctly
- [ ] Progress is preserved across phase transitions

#### 1.4 Edge Case Handling

**Purpose**: Test system behavior with incomplete states, missing data, and invalid transitions.

**Test Scenarios**:

- **Incomplete States**: Behavior when required state variables missing
- **Missing Data**: System handles missing project context gracefully
- **Invalid Transitions**: Rejection of impossible phase transitions
- **Corrupted State**: Recovery from corrupted or invalid state data

**Validation Criteria**:

- [ ] System gracefully handles incomplete states
- [ ] Missing data triggers appropriate error messages
- [ ] Invalid transitions are rejected with clear explanations
- [ ] Corrupted state can be recovered or reset

---

### 2. Template Resolution Validation

#### 2.1 Placeholder Substitution Testing

**Purpose**: Verify all `{{variable}}` placeholders get resolved with actual project data.

**Test Scenarios**:

- **Project Context Variables**: Resolution of `{{project.language}}`, `{{project.framework}}`, etc.
- **Current State Variables**: Resolution of `{{current.file}}`, `{{current.function}}`, etc.
- **Metrics Variables**: Resolution of `{{metrics.coverage}}`, `{{metrics.complexity}}`, etc.
- **Separation Variables**: Resolution of `{{separation.file1}}`, `{{separation.strategy}}`, etc.

**Validation Criteria**:

- [ ] 100% of placeholders are successfully resolved
- [ ] No unresolved placeholders remain in final templates
- [ ] Placeholder values are accurate and current
- [ ] Missing context data triggers appropriate fallbacks

#### 2.2 Context Variable Population

**Purpose**: Test that project analysis correctly populates all context variables.

**Test Scenarios**:

- **Language Detection**: Automatic detection of programming languages
- **Framework Detection**: Identification of frameworks and libraries
- **Project Structure Analysis**: Extraction of file organization patterns
- **Code Quality Metrics**: Calculation of complexity and coverage metrics

**Validation Criteria**:

- [ ] Language detection is accurate for Python, TypeScript, JavaScript, etc.
- [ ] Framework detection works for React, Express, Django, etc.
- [ ] Project structure analysis captures current organization
- [ ] Code quality metrics are calculated correctly

#### 2.3 Template Inheritance Testing

**Purpose**: Validate common patterns work across different project types.

**Test Scenarios**:

- **Base Template Patterns**: Common refactoring templates
- **Language-Specific Extensions**: Python, TypeScript, JavaScript variants
- **Framework-Specific Extensions**: React, Express, Django variants
- **Project-Size Adaptations**: Small, medium, large codebase templates

**Validation Criteria**:

- [ ] Base templates provide common functionality
- [ ] Language-specific extensions work correctly
- [ ] Framework-specific extensions adapt appropriately
- [ ] Project-size adaptations scale properly

#### 2.4 Language-Specific Template Testing

**Purpose**: Test Python, TypeScript, JavaScript templates independently.

**Test Scenarios**:

- **Python Templates**: Python-specific refactoring patterns
- **TypeScript Templates**: TypeScript-specific refactoring patterns
- **JavaScript Templates**: JavaScript-specific refactoring patterns
- **Cross-Language Compatibility**: Templates that work across languages

**Validation Criteria**:

- [ ] Python templates handle Python-specific syntax and patterns
- [ ] TypeScript templates handle type system and interfaces
- [ ] JavaScript templates handle dynamic typing and patterns
- [ ] Cross-language templates work consistently

---

### 3. Progress Tracking Persistence

#### 3.1 Cross-Session State Preservation

**Purpose**: Test that progress survives chat session restarts and agent changes.

**Test Scenarios**:

- **Session Restart**: Progress preservation when chat session ends and restarts
- **Agent Changes**: Progress preservation when different agents work on same project
- **Working Copy Detection**: Automatic detection of existing working copies
- **State Synchronization**: Multiple agents can work from same state

**Validation Criteria**:

- [ ] Progress survives chat session restarts
- [ ] Different agents can continue from same working copy
- [ ] Working copy detection works reliably
- [ ] State synchronization prevents conflicts

#### 3.2 Working Copy Detection

**Purpose**: Verify agent correctly finds existing working copies and continues progress.

**Test Scenarios**:

- **File System Detection**: Detection of `refactor_protocol_working.md` files
- **Progress Validation**: Detected working copies contain valid progress
- **Corrupted File Handling**: Recovery from corrupted working copies
- **Multiple Working Copy Resolution**: Handling of multiple working copies

**Validation Criteria**:

- [ ] Working copy detection is reliable and fast (<500ms)
- [ ] Corrupted working copies are detected and handled
- [ ] Multiple working copies are resolved appropriately
- [ ] Progress validation prevents use of invalid states

#### 3.3 State Update Validation

**Purpose**: Test that each action properly updates the current state.

**Test Scenarios**:

- **State Variable Updates**: Updates to phase, step, completed work, etc.
- **Progress Calculation**: Accurate calculation of completion percentages
- **Timestamp Updates**: Last_updated timestamps are current
- **State Consistency**: State remains internally consistent

**Validation Criteria**:

- [ ] All state variables are updated after each action
- [ ] Progress percentages reflect actual completion
- [ ] Timestamps are current and accurate
- [ ] State remains internally consistent

#### 3.4 Progress Calculation Accuracy

**Purpose**: Verify progress percentages reflect actual completion status.

**Test Scenarios**:

- **Phase Completion**: Accurate tracking of phase completion
- **Step Completion**: Tracking of individual step completion
- **Overall Progress**: Calculation of overall project progress
- **Progress Visualization**: Progress is clearly communicated

**Validation Criteria**:

- [ ] Phase completion is accurately tracked
- [ ] Step completion is properly recorded
- [ ] Overall progress calculation is accurate
- [ ] Progress is clearly visible to users

---

### 4. Error Handling and Recovery

#### 4.1 Template Execution Failures

**Purpose**: Test behavior when templates fail to resolve or execute.

**Test Scenarios**:

- **Placeholder Resolution Failures**: Handling of unresolvable placeholders
- **Template Syntax Errors**: Handling of malformed templates
- **Context Variable Conflicts**: Resolution of conflicting context data
- **Template Compatibility Issues**: Handling of incompatible templates

**Validation Criteria**:

- [ ] Template failures are detected and reported clearly
- [ ] Alternative templates are attempted when primary templates fail
- [ ] Error messages explain problems and suggest solutions
- [ ] System gracefully degrades when templates fail

#### 4.2 State Corruption Recovery

**Purpose**: Test recovery from corrupted or invalid state data.

**Test Scenarios**:

- **JSON Parsing Errors**: Handling of malformed JSON state
- **Missing Required Fields**: Handling of incomplete state data
- **Invalid State Values**: Handling of out-of-range or invalid values
- **State File Corruption**: Recovery from corrupted working copy files

**Validation Criteria**:

- [ ] Corrupted state is detected automatically
- [ ] Recovery procedures restore valid state
- [ ] Users are informed of corruption and recovery
- [ ] System can continue from recovered state

#### 4.3 Phase Rollback Testing

**Purpose**: Verify ability to return to previous phases when needed.

**Test Scenarios**:

- **Manual Rollback**: User-initiated phase rollbacks
- **Automatic Rollback**: Automatic rollback on critical failures
- **Partial Rollback**: Rolling back specific steps within phases
- **Rollback Validation**: Rolled back state is valid

**Validation Criteria**:

- [ ] Manual rollbacks work correctly
- [ ] Automatic rollbacks trigger on appropriate failures
- [ ] Partial rollbacks preserve valid work
- [ ] Rolled back state is validated before use

#### 4.4 Human Intervention Triggers

**Purpose**: Test when and how the system requests user guidance.

**Test Scenarios**:

- **Complex Decision Points**: Requests for architectural decisions
- **Conflicting Requirements**: Requests when requirements conflict
- **Resource Limitations**: Requests when system resources are limited
- **Uncertainty Handling**: Requests when multiple valid approaches exist

**Validation Criteria**:

- [ ] Human intervention is requested at appropriate times
- [ ] Requests are clear and actionable
- [ ] System provides context for decisions
- [ ] Users can provide guidance and continue

---

### 5. Integration Testing Scenarios

#### 5.1 Complete Refactoring Workflow

**Purpose**: Test end-to-end execution from Phase 0 to completion.

**Test Scenarios**:

- **Full Workflow Execution**: Complete refactoring process
- **Phase Transitions**: All phase transitions work correctly
- **Progress Tracking**: Progress tracking throughout workflow
- **Final State**: Final state reflects successful completion

**Validation Criteria**:

- [ ] Complete workflow executes without errors
- [ ] All phase transitions occur correctly
- [ ] Progress is tracked accurately throughout
- [ ] Final state shows successful completion

#### 5.2 Real Project Integration

**Purpose**: Test with actual messy codebases (Python, TypeScript, JavaScript).

**Test Scenarios**:

- **Python Messy Codebase**: Python projects containing code smells
- **TypeScript Messy Codebase**: TypeScript projects needing refactoring
- **JavaScript Messy Codebase**: JavaScript projects requiring cleanup
- **Mixed Language Projects**: Projects using multiple languages

**Validation Criteria**:

- [ ] Python projects are handled correctly
- [ ] TypeScript projects are processed appropriately
- [ ] JavaScript projects are refactored successfully
- [ ] Mixed language projects work correctly

#### 5.3 Multi-Agent Collaboration

**Purpose**: Test that multiple agents can work from the same working copy.

**Test Scenarios**:

- **Concurrent Access**: Multiple agents accessing same working copy
- **State Synchronization**: State updates across multiple agents
- **Conflict Resolution**: Handling of conflicting updates
- **Collaborative Progress**: Agents can build on each other's work

**Validation Criteria**:

- [ ] Multiple agents can work concurrently
- [ ] State is synchronized across agents
- [ ] Conflicts are resolved appropriately
- [ ] Collaborative progress is maintained

#### 5.4 Version Control Integration

**Purpose**: Test Git operations and branch management.

**Test Scenarios**:

- **Branch Creation**: Creation of refactoring branches
- **Commit Management**: Committing refactoring changes
- **Conflict Resolution**: Handling of Git conflicts
- **Branch Merging**: Merging refactored code back to main

**Validation Criteria**:

- [ ] Refactoring branches are created correctly
- [ ] Changes are committed appropriately
- [ ] Git conflicts are resolved properly
- [ ] Refactored code can be merged successfully

---

### 6. Performance and Scalability Testing

#### 6.1 Large Codebase Handling

**Purpose**: Test with projects containing 100+ files.

**Test Scenarios**:

- **File Count Scaling**: Performance with increasing file counts
- **Memory Usage**: Memory consumption with large projects
- **Processing Time**: Time required for analysis and planning
- **Progress Tracking Overhead**: Overhead of progress tracking

**Validation Criteria**:

- [ ] Projects with 100+ files are handled efficiently
- [ ] Memory usage remains reasonable (<100MB for large projects)
- [ ] Processing time scales linearly with project size
- [ ] Progress tracking overhead is minimal

#### 6.2 Memory Usage Optimization

**Purpose**: Verify efficient handling of large state objects.

**Test Scenarios**:

- **State Object Size**: Memory usage with large state objects
- **Context Variable Storage**: Memory efficiency of context storage
- **Template Cache Management**: Memory usage of template caching
- **Progress History**: Memory usage of progress tracking

**Validation Criteria**:

- [ ] State objects use memory efficiently
- [ ] Context variables don't consume excessive memory
- [ ] Template caching is memory-efficient
- [ ] Progress history doesn't grow unbounded

#### 6.3 Template Processing Speed

**Purpose**: Test placeholder resolution performance.

**Test Scenarios**:

- **Placeholder Resolution**: Speed of variable substitution
- **Template Selection**: Speed of template selection logic
- **Context Population**: Speed of context variable population
- **Template Validation**: Speed of template compatibility checking

**Validation Criteria**:

- [ ] Placeholder resolution completes in <1 second
- [ ] Template selection is fast and responsive
- [ ] Context population doesn't cause delays
- [ ] Template validation is efficient

#### 6.4 Progress Tracking Efficiency

**Purpose**: Verify minimal overhead for state updates.

**Test Scenarios**:

- **State Updates**: Speed of state variable updates
- **Progress Calculations**: Speed of progress calculations
- **File I/O Operations**: Speed of working copy updates
- **Validation Checks**: Speed of state validation

**Validation Criteria**:

- [ ] State updates complete in <100ms
- [ ] Progress calculations are fast
- [ ] File I/O operations are efficient
- [ ] Validation checks don't cause delays

---

### 7. User Experience Validation

#### 7.1 Prompt Clarity Testing

**Purpose**: Verify generated prompts are clear and actionable.

**Test Scenarios**:

- **Action Instructions**: Clarity of what users should do next
- **Context Information**: Prompts include relevant context
- **Progress Visibility**: Users understand current status
- **Error Communication**: Clarity of error messages and solutions

**Validation Criteria**:

- [ ] All prompts are clear and actionable
- [ ] Context is provided for decision-making
- [ ] Progress is clearly communicated
- [ ] Error messages explain problems and solutions

#### 7.2 Progress Visibility

**Purpose**: Test that users can easily understand current status.

**Test Scenarios**:

- **Current Phase Display**: Clarity of current phase indication
- **Step Progress**: Visibility of current step and progress
- **Completed Work**: Visibility of what has been accomplished
- **Next Actions**: Clarity of upcoming work

**Validation Criteria**:

- [ ] Current phase is clearly indicated
- [ ] Step progress is visible and understandable
- [ ] Completed work is clearly shown
- [ ] Next actions are clearly communicated

#### 7.3 Error Message Clarity

**Purpose**: Validate error messages explain problems and solutions.

**Test Scenarios**:

- **Error Description**: Clarity of what went wrong
- **Root Cause**: Explanation of why the error occurred
- **Solution Steps**: Clarity of how to resolve the error
- **Prevention Guidance**: Guidance on avoiding similar errors

**Validation Criteria**:

- [ ] Error descriptions are clear and specific
- [ ] Root causes are explained understandably
- [ ] Solution steps are actionable
- [ ] Prevention guidance is helpful

#### 7.4 Recovery Guidance

**Purpose**: Test that users know how to resume after interruptions.

**Test Scenarios**:

- **Interruption Handling**: Guidance when workflow is interrupted
- **Resume Instructions**: Clarity of how to resume work
- **State Recovery**: Guidance on recovering from errors
- **Progress Restoration**: Instructions for restoring progress

**Validation Criteria**:

- [ ] Interruptions are handled gracefully
- [ ] Resume instructions are clear
- [ ] State recovery guidance is helpful
- [ ] Progress restoration is straightforward

---

### 8. Template Quality Assurance

#### 8.1 Template Completeness

**Purpose**: Verify all templates cover required scenarios.

**Test Scenarios**:

- **Phase Coverage**: All phases have appropriate templates
- **Scenario Coverage**: Common scenarios are covered
- **Edge Case Coverage**: Edge cases are handled
- **Language Coverage**: All supported languages have templates

**Validation Criteria**:

- [ ] All phases have complete template coverage
- [ ] Common scenarios are fully covered
- [ ] Edge cases are handled appropriately
- [ ] All supported languages have templates

#### 8.2 Output Format Consistency

**Purpose**: Test that all templates produce consistent output structures.

**Test Scenarios**:

- **Output Structure**: Consistency of output format
- **Required Sections**: All required sections are present
- **Formatting Standards**: Consistency of formatting
- **Variable Usage**: Consistent use of context variables

**Validation Criteria**:

- [ ] All templates produce consistent output structure
- [ ] Required sections are always present
- [ ] Formatting is consistent across templates
- [ ] Context variables are used consistently

#### 8.3 Context Variable Coverage

**Purpose**: Ensure all placeholders have corresponding context data.

**Test Scenarios**:

- **Variable Mapping**: All placeholders map to context data
- **Data Availability**: Required context data is available
- **Fallback Values**: Fallback values are provided
- **Variable Validation**: Context variables are validated

**Validation Criteria**:

- [ ] All placeholders have corresponding context data
- [ ] Required context data is always available
- [ ] Fallback values are provided when needed
- [ ] Context variables are validated before use

#### 8.4 Template Maintainability

**Purpose**: Test ease of updating and extending templates.

**Test Scenarios**:

- **Template Modification**: Ease of updating existing templates
- **New Template Addition**: Ease of adding new templates
- **Template Inheritance**: Effectiveness of template inheritance
- **Documentation Quality**: Quality of template documentation

**Validation Criteria**:

- [ ] Existing templates can be easily modified
- [ ] New templates can be easily added
- [ ] Template inheritance works effectively
- [ ] Template documentation is clear and helpful

---

### Testing Implementation Requirements

#### Automated Testing Framework

- **Unit Tests**: Jest for JavaScript/TypeScript, pytest for Python
- **Integration Tests**: End-to-end workflow testing
- **Mock Data**: Synthetic messy codebases for consistent testing
- **Test Harness**: Automated execution of test scenarios

#### Manual Testing Protocol

- **User Experience Testing**: Real users following the protocol
- **Edge Case Testing**: Unusual project structures and configurations
- **Stress Testing**: Large codebases and complex refactoring scenarios
- **Accessibility Testing**: Usability for different user skill levels

#### Continuous Integration

- **Automated Test Execution**: Run tests on every protocol update
- **Regression Testing**: Ensure changes don't break existing functionality
- **Performance Monitoring**: Track performance metrics over time
- **Quality Gates**: Block deployment if tests fail or performance degrades

---

### Validation Metrics

#### Functional Validation

- **Template Resolution Accuracy**: 100% of placeholders correctly resolved
- **Phase Transition Accuracy**: 100% correct phase progression
- **State Persistence**: 100% progress preservation across sessions
- **Error Recovery**: 100% successful recovery from testable errors

#### Performance Validation

- **Template Processing**: <1 second for placeholder resolution
- **State Updates**: <100ms for progress tracking updates
- **Working Copy Detection**: <500ms for file system operations
- **Memory Usage**: <100MB for large project state

#### User Experience Validation

- **Prompt Clarity**: 100% of generated prompts are actionable
- **Progress Visibility**: Users can determine status in <5 seconds
- **Error Communication**: Error messages explain problems and solutions
- **Recovery Guidance**: Users know how to resume after interruptions

---

## 📚 PROGRESSIVE DISCLOSURE REFERENCE

### For Detailed Examples & Extended Documentation

The following sections provide comprehensive examples and detailed guidance. Reference these when you need specific implementation details:

- **[Usage Examples & Workflows](mdc:prompts/code/refactor_protocol_examples.md)** - Complete workflow examples, troubleshooting, and best practices
- **[Template Reference Library](mdc:prompts/code/refactor_protocol_templates.md)** - All templates with detailed explanations and variations
- **[Testing & Validation Guide](mdc:prompts/code/refactor_protocol_testing.md)** - Comprehensive testing procedures and validation criteria

### Core Execution Engine (This File)

This document contains the essential execution logic:

- Phase transition rules
- Progress tracking system
- Template system overview
- Working copy management

**Reference the detailed guides above when you need:**

- Specific implementation examples
- Detailed troubleshooting procedures
- Extended template variations
- Comprehensive testing scenarios

---

## ⇔ PHASE TEMPLATES

### Dynamic Template System

**All templates use dynamic placeholders that get resolved with actual project context:**

#### Project Context Variables

- `{{project.language}}` → Programming language (Python, TypeScript, JavaScript, etc.)
- `{{project.framework}}` → Framework (React, Express, Django, etc.)
- `{{project.testing_framework}}` → Testing framework (Jest, pytest, etc.)
- `{{project.coverage_target}}` → Target test coverage percentage

#### Current State Variables

- `{{current.file}}` → File currently being worked on
- `{{current.function}}` → Function currently being refactored
- `{{current.module}}` → Module currently being processed
- `{{current.code_snippet}}` → Relevant code from current file

#### Metrics Variables

- `{{metrics.current_coverage}}` → Current test coverage percentage
- `{{metrics.function_complexity}}` → Current function complexity score
- `{{metrics.target_complexity}}` → Target complexity after refactoring

#### Separation Variables

- `{{separation.file1}}` → Name of first separated file
- `{{separation.file2}}` → Name of second separated file
- `{{separation.purpose1}}` → Purpose of first separated file
- `{{separation.purpose2}}` → Purpose of second separated file
- `{{separation.strategy}}` → Separation strategy being applied

**Template Resolution Process:**

1. Agent analyzes project and populates context variables
2. All `{{variable}}` placeholders are replaced with actual values
3. Templates become fully contextualized for the specific project
4. Agent executes the resolved template with complete context

---

### CONSOLIDATED TEMPLATES

**Streamlined templates for common scenarios - see [Template Reference Library](mdc:prompts/code/refactor_protocol_templates.md) for detailed variations**

#### Phase 0: Setup & Context Gathering

**Template 0.1: Project Context Analysis**:

```markdown
ACT AS: Expert software architect and refactoring specialist.
TASK: Analyze provided project files to establish refactoring context.
REQUIRED: Language detection, framework identification, structure analysis, quality assessment.
OUTPUT: Project overview, technology stack, current structure, quality assessment, refactoring scope.
```

**Template 0.2: Environment Setup**:

```markdown
ACT AS: DevOps engineer and refactoring coordinator.
TASK: Set up refactoring environment and safety measures.
REQUIRED: Git branch creation, dependency verification, build testing, baseline establishment.
OUTPUT: Git status, build status, test status, workspace readiness confirmation.
```

#### Phase 1: Reconnaissance & Planning

**Template 1.1: Code Smell Analysis**:

```markdown
ACT AS: Static analysis tool and code quality specialist.
TASK: Analyze codebase for code smells and refactoring opportunities.
REQUIRED: Long methods, large classes, duplication, nesting, naming, responsibilities, unused code.
OUTPUT: Code smell summary, critical issues, refactoring opportunities, effort estimates.
```

**Template 1.2: Refactoring Plan Creation**:

```markdown
ACT AS: Project manager and refactoring strategist.
TASK: Create comprehensive, prioritized refactoring plan.
REQUIRED: Task grouping by phase, effort estimation, dependency mapping, execution sequence.
OUTPUT: Structured task list by phase, dependencies, risk assessment, timeline estimates.
```

#### Phase 2: Safety Net Creation

**Template 2.1: Test Suite Generation**:

```markdown
ACT AS: Test engineer and quality assurance specialist.
TASK: Create comprehensive test suites for {{current.module}} before refactoring.
REQUIRED: Unit tests, edge cases, error conditions, integration tests, >{{project.coverage_target}}% coverage.
OUTPUT: Test file created, coverage achieved, test results, coverage report.
```

**Template 2.2: Test Validation**:

```markdown
ACT AS: Quality assurance engineer.
TASK: Validate test suite provides adequate safety coverage.
REQUIRED: Test execution, coverage verification, edge case validation, error condition testing.
OUTPUT: Test suite status, coverage report, validation results, safety net readiness.
```

#### Phase 3: Structural Reorganization

**Template 3.1: File Separation**:

```markdown
ACT AS: Software architect and code organization specialist.
TASK: Separate mixed responsibilities in {{current.file}} into focused, single-purpose files.
REQUIRED: Create {{separation.file1}} for {{separation.purpose1}}, {{separation.file2}} for {{separation.purpose2}}.
OUTPUT: New file contents, import updates, separation confirmation.
```

**Template 3.2: Directory Restructuring**:

```markdown
ACT AS: Project organization specialist.
TASK: Reorganize project structure to follow standard layout conventions.
REQUIRED: Source file organization, test separation, configuration organization, package structure.
OUTPUT: Directory structure, files moved, structure completion confirmation.
```

#### Phase 4: Granular Refactoring

**Template 4.1: Method Extraction**:

```markdown
ACT AS: Refactoring specialist and clean code practitioner.
TASK: Apply "Extract Method" refactoring to improve {{current.function}}.
REQUIRED: Identify logical blocks, create helper functions, maintain functionality, ensure tests pass.
OUTPUT: Refactored function, new helper methods, test results, refactoring confirmation.
```

**Template 4.2: Duplicate Code Consolidation**:

```markdown
ACT AS: Code quality specialist and DRY principle practitioner.
TASK: Consolidate duplicate code patterns found across multiple functions.
REQUIRED: Identify common logic, create utility functions, refactor original functions, maintain tests.
OUTPUT: New utility function, refactored functions, consolidation confirmation.
```

#### Phase 5: Final Polish & Documentation

**Template 5.1: Documentation Generation**:

```markdown
ACT AS: Technical writer and documentation specialist.
TASK: Generate comprehensive documentation for refactored code.
REQUIRED: Function docstrings, API documentation, usage examples, architecture overview.
OUTPUT: Function documentation, API documentation, usage examples, architecture summary.
```

**Template 5.2: Final Quality Review**:

```markdown
ACT AS: Code reviewer and quality assurance specialist.
TASK: Perform final quality review of refactored codebase.
REQUIRED: Test verification, code style validation, architectural assessment, functionality confirmation.
OUTPUT: Final test results, quality score, architecture assessment, completion confirmation.
```

#### Performance Module Templates

**Template P.1: Performance Module Initialization**:

```markdown
ACT AS: Performance optimization specialist and system architect.
TASK: Initialize performance monitoring and optimization systems for refactoring workflow.
REQUIRED: Memory monitoring setup, template caching initialization, performance metrics collection.
OUTPUT: Performance systems initialized, monitoring active, optimization features enabled.
```

**Template P.2: Performance Report Generation**:

```markdown
ACT AS: Performance analyst and optimization specialist.
TASK: Generate comprehensive performance report for completed refactoring workflow.
REQUIRED: Performance metrics analysis, optimization recommendations, memory usage summary.
OUTPUT: Performance report, optimization suggestions, resource usage analysis.
```

---

## ⌘ EXECUTION ENGINE RULES

### Performance Module Integration

**IF** performance_module_enabled == true:
  → **Initialize**: Performance monitoring, memory management, and template caching
  → **Track**: All operations with performance metrics
  → **Optimize**: Template resolution and memory usage automatically

**IF** performance_module_enabled == false:
  → **Skip**: Performance monitoring and optimization features
  → **Focus**: Core refactoring functionality only
  → **Maintain**: Standard execution flow without performance overhead

### Action Determination Logic (Updated)

**IF** current_phase == 0 AND no project_context:
  → **Execute**: Template 0.1 (Project Context Analysis)
  → **IF** performance_module_enabled: Initialize performance monitoring

**IF** current_phase == 0 AND project_context exists AND no environment_setup:
  → **Execute**: Template 0.2 (Environment Setup)
  → **IF** performance_module_enabled: Set up memory management and caching

**IF** current_phase == 1 AND no file_analysis:
  → **Execute**: Template 1.1 (Code Smell Analysis)
  → **IF** performance_module_enabled: Use template caching for analysis operations

**IF** current_phase == 2 AND refactoring_plan has test_requirements:
  → **Execute**: Template 2.1 (Test Suite Generation)
  → **IF** performance_module_enabled: Monitor memory usage during test generation

**IF** current_phase == 3 AND structural_issues exist:
  → **Execute**: Template 3.1 (File Separation) OR Template 3.2 (Directory Restructuring)
  → **IF** performance_module_enabled: Track performance impact of structural changes

**IF** current_phase == 4 AND refactoring_plan has granular_tasks:
  → **Execute**: Template 4.1 (Method Extraction) OR Template 4.2 (Duplicate Code Consolidation)
  → **IF** performance_module_enabled: Provide optimization suggestions during refactoring

**IF** current_phase == 5 AND all_refactoring_complete:
  → **Execute**: Template 5.1 (Documentation Generation) OR Template 5.2 (Final Quality Review)
  → **IF** performance_module_enabled: Generate final performance report and recommendations

### Phase Transition Rules

**Phase 0 → Phase 1**: When project_context AND environment_setup are complete
**Phase 1 → Phase 2**: When file_analysis AND refactoring_plan are complete
**Phase 2 → Phase 3**: When test_coverage > 90% for all critical modules
**Phase 3 → Phase 4**: When structural_reorganization is complete
**Phase 4 → Phase 5**: When all granular_refactoring_tasks are complete
**Phase 5 → Complete**: When documentation AND final_quality_review are complete

### Error Handling Rules

**IF** any action fails:

1. **Log the error** in the progress tracking
2. **Attempt recovery** using alternative approaches
3. **Request human intervention** if recovery fails
4. **Do not proceed** until the issue is resolved

**IF** tests fail after refactoring:

1. **Revert changes** to the last working state
2. **Analyze the failure** to understand the issue
3. **Fix the refactoring** to maintain functionality
4. **Re-run tests** to confirm success

---

## ✓ COMPLETION CRITERIA

### Phase 0 Completion: Setup & Context Gathering

- [ ] Project context extracted and documented
- [ ] Environment setup complete (Git branch, dependencies, build)
- [ ] Baseline established (tests run, build verified)

### Phase 1 Completion: Reconnaissance & Planning

- [ ] Code smell analysis complete
- [ ] Refactoring plan created and prioritized
- [ ] Dependencies and risks identified

### Phase 2 Completion: Safety Net Creation

- [ ] Test suites created for all critical modules
- [ ] Test coverage >90% achieved
- [ ] All tests pass against current code

### Phase 3 Completion: Structural Reorganization

- [ ] Mixed-responsibility files separated
- [ ] Project structure follows standard layout
- [ ] All imports and references updated

### Phase 4 Completion: Granular Refactoring

- [ ] Long methods broken down
- [ ] Duplicate code consolidated
- [ ] All tests still pass
- [ ] Code quality significantly improved

### Phase 5 Completion: Final Polish & Documentation

- [ ] Comprehensive documentation generated
- [ ] Final quality review complete
- [ ] All refactoring objectives achieved

---

## ⚡ TROUBLESHOOTING

### Common Issues

**Tests failing after refactoring**: Revert to last working state and fix the refactoring approach
**Build system issues**: Verify dependencies and environment setup
**Git conflicts**: Resolve conflicts manually and continue
**Memory/performance issues**: Break down large refactoring tasks into smaller chunks

### Recovery Procedures

**Phase rollback**: Return to previous phase and re-execute
**Partial completion**: Resume from last successful step
**Human intervention**: Request user guidance for complex decisions

### Session Recovery

**New chat session**: Agent automatically detects existing working copy and continues from last saved state
**Progress preservation**: All completed work and current phase status maintained across sessions
**No duplicate work**: Agent checks for existing progress before starting new work
**Resume capability**: Simply provide the protocol document again and agent picks up where it left off

---

## ⋇ USAGE INSTRUCTIONS

### For Users

1. **Provide this document** to your AI agent along with your project files
2. **Say**: "Use the refactor protocol to clean up this codebase"
3. **Continue**: Say "Continue with the refactor protocol" as needed
4. **Monitor progress**: Check the Progress Tracking section for updates

**Note**: The agent will create a working copy (`refactor_protocol_working.md`) to track progress. This preserves your original protocol document while allowing the agent to maintain state across multiple interactions.

### For Agents

1. **Read the Current State** section to understand where you are
2. **Execute the Next Action** using the appropriate template
3. **Update the Current State** after each action
4. **Follow the Execution Engine Rules** exactly
5. **Never skip steps** or move phases without completion
6. **When creating working copy**: Update all MDC links to point to actual file locations relative to project root

---

**Remember**: This protocol transforms the complex task of code refactoring into a systematic, safe, and verifiable process. Each phase builds upon the previous one, ensuring that your codebase becomes cleaner, more maintainable, and more professional with every step.

**For detailed examples and extended guidance, reference the [Progressive Disclosure Reference](mdc:#progressive-disclosure-reference) section above.**
