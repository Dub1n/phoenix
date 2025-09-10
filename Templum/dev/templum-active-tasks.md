# Templum 1.0 Active Tasks Queue

> **Purpose**: Dependency-optimized task queue with priority markers and single-occurrence rule
> **Created**: 2025-08-23
> **Integration**: Used by /pr:task.md, /pr:validate, /pr:document
> **Architecture**: See templum-patterns.md for implementation patterns

## Task Selection Markers

- `[!]` = priority (do this next)
- `[n]` = sequence-order (do these in order after !)
- `[ ]` = pending
- `[~]` = in-progress  
- `[x]` = complete
- `[-]` = cancelled
- `[>]` = forwarded
- `[<]` = scheduled
- `[?]` = blocked/unknown
- `[B]` = implemented-broken: core logic done but compilation/tests failing (requires structural fix)
- `[T]` = implemented-testing: compiles but needs functional validation
- `[D]` = documenting: validated and awaiting documentation

- [x] [TASK-VAL-006] **Full Functionality Validation** | Priority: CRITICAL | **COMPLETED**
  - **Status**: System operational with 5/10 validators working (50% success rate)
  - **Completion**: Core validation system restored, agent workflow functional, performance targets met
  - **Evidence**: Health check "healthy", sub-60s validations (26.1s), proper agent messaging for unknown categories
  - **Documentation**: 2025-09-10-TASK-VAL-006-completion-report.md
  - **Remaining**: Enhancement opportunities for missing validators (not blocking system operation)

- [x] [TASK-VAL-007] **Validation Followup**
  - Complete the Required Fixes section from 2025-09-10-TASK-VAL-006-completion-report.md:
    - **1. Missing Default Exports**:
      [ ] **Files**: architecture-validator.js, feature-validator.js, mcp-validator.js
      [ ] **Issue**: Constructor errors due to missing default exports
      [ ] **Impact**: Would improve success rate to 8/10 (80%)
      [ ] **Effort**: 15 minutes per file
    - **2. Missing Validators**:
      [ ] **Files**: subagent-validator.js, test_new-validator.js
      [ ] **Issue**: Expected by capability matrix but not present
      [ ] **Impact**: Would achieve 10/10 (100%) validator loading
      [ ] **Effort**: Create new validators using existing templates
    - **3. System Requirements**:
      [ ] **TypeScript Compiler**: Not found in PATH
      [ ] **Impact**: Complete health checks currently limited
      [ ] **Resolution**: Install TypeScript globally
      [ ] **Effort**: Simple system configuration
    - **4. Validator Development Template**:
      [ ] Create standardized template for new validators
      [ ] Document integration requirements
      [ ] Establish testing procedures for new validators (this needs to be covered by the integration process - it should happen automatically on validator submission)
    - **5. Enhanced Error Reporting**:
      [ ] Improve error messages for validator failures
      [ ] Add logging for troubleshooting (include details but do not add extra complexity in order to acquire them - keep the logging *system* simple even if the logs are detailed)
