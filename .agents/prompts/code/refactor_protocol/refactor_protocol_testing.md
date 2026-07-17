# Refactor Protocol Testing & Validation Guide

**Purpose**: Comprehensive testing procedures and validation criteria for the Self-Executing Refactor Protocol  
**Usage**: Reference this file when you need detailed testing procedures or validation guidance  
**Related**: [Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)

---

## 🧪 **Testing Strategy Overview**

### **Testing Philosophy**

Test the execution engine logic, validate template resolution, verify progress tracking persistence, and ensure robust error handling and recovery.

### **Testing Categories**

1. **Execution Engine Logic Testing** - Phase transitions and action determination
2. **Template Resolution Validation** - Placeholder substitution and context population
3. **Progress Tracking Persistence** - Cross-session state preservation
4. **Error Handling and Recovery** - Failure scenarios and recovery procedures
5. **Integration Testing** - End-to-end workflow validation
6. **Performance and Scalability** - Large project handling and resource usage

---

## 🔧 **1. Execution Engine Logic Testing**

### **1.1 Unit Test Execution Flow**

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

**Test Implementation**:

```typescript
describe('Phase Transition Logic', () => {
  it('should advance from Phase 0 to Phase 1 when context and setup complete', () => {
    const state = {
      phase: 0,
      project_context: { language: 'python', framework: 'django' },
      environment_setup: { git_branch: 'refactor/test', build_status: 'success' }
    };
    
    const nextPhase = determineNextPhase(state);
    expect(nextPhase).toBe(1);
  });
  
  it('should reject phase advancement with incomplete data', () => {
    const state = {
      phase: 0,
      project_context: { language: 'python' },
      environment_setup: null
    };
    
    const nextPhase = determineNextPhase(state);
    expect(nextPhase).toBe(0);
  });
});
```

### **1.2 Action Determination Testing**

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

### **1.3 Phase Progression Validation**

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

---

## 🔍 **2. Template Resolution Validation**

### **2.1 Placeholder Substitution Testing**

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

**Test Implementation**:

```typescript
describe('Template Resolution', () => {
  it('should resolve all placeholders with project context', () => {
    const template = 'Analyzing {{project.language}} project with {{project.framework}}';
    const context = { project: { language: 'Python', framework: 'Django' } };
    
    const resolved = resolveTemplate(template, context);
    expect(resolved).toBe('Analyzing Python project with Django');
    expect(resolved).not.toContain('{{');
  });
  
  it('should handle missing context gracefully', () => {
    const template = 'Language: {{project.language}}';
    const context = { project: {} };
    
    const resolved = resolveTemplate(template, context);
    expect(resolved).toBe('Language: [unknown]');
  });
});
```

### **2.2 Context Variable Population**

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

---

## 💾 **3. Progress Tracking Persistence**

### **3.1 Cross-Session State Preservation**

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

**Test Implementation**:

```typescript
describe('Progress Persistence', () => {
  it('should detect existing working copy', () => {
    const workingCopyPath = 'refactor_protocol_working.md';
    const mockFs = { existsSync: jest.fn().mockReturnValue(true) };
    
    const detected = detectWorkingCopy(workingCopyPath, mockFs);
    expect(detected).toBe(true);
  });
  
  it('should load existing progress state', () => {
    const mockState = { phase: 2, step: 'test_validation' };
    const mockFs = { 
      readFileSync: jest.fn().mockReturnValue(JSON.stringify(mockState))
    };
    
    const loadedState = loadWorkingCopy('working.md', mockFs);
    expect(loadedState.phase).toBe(2);
    expect(loadedState.step).toBe('test_validation');
  });
});
```

### **3.2 Working Copy Detection**

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

---

## 🚨 **4. Error Handling and Recovery**

### **4.1 Template Execution Failures**

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

**Test Implementation**:

```typescript
describe('Error Handling', () => {
  it('should detect template resolution failures', () => {
    const template = '{{invalid.variable}}';
    const context = {};
    
    expect(() => resolveTemplate(template, context))
      .toThrow('Unable to resolve placeholder: {{invalid.variable}}');
  });
  
  it('should attempt fallback templates on failure', () => {
    const primaryTemplate = '{{complex.template}}';
    const fallbackTemplate = 'Basic template for {{project.language}}';
    const context = { project: { language: 'Python' } };
    
    const result = executeTemplateWithFallback(primaryTemplate, fallbackTemplate, context);
    expect(result).toBe('Basic template for Python');
  });
});
```

### **4.2 State Corruption Recovery**

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

---

## 🔄 **5. Integration Testing Scenarios**

### **5.1 Complete Refactoring Workflow**

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

**Test Implementation**:

```typescript
describe('End-to-End Workflow', () => {
  it('should execute complete refactoring workflow', async () => {
    const mockProject = createMockProject();
    const protocol = new RefactorProtocol();
    
    const result = await protocol.executeWorkflow(mockProject);
    
    expect(result.phase).toBe(5);
    expect(result.completed).toContain('final_quality_review');
    expect(result.success).toBe(true);
  });
  
  it('should maintain progress across workflow execution', async () => {
    const protocol = new RefactorProtocol();
    const initialState = { phase: 0, step: 'initial_setup' };
    
    // Execute Phase 0
    const phase0Result = await protocol.executePhase(0, initialState);
    expect(phase0Result.phase).toBe(1);
    expect(phase0Result.completed).toContain('project_context_analysis');
    
    // Continue to Phase 1
    const phase1Result = await protocol.executePhase(1, phase0Result);
    expect(phase1Result.phase).toBe(2);
    expect(phase1Result.completed).toContain('code_smell_analysis');
  });
});
```

### **5.2 Real Project Integration**

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

---

## 📊 **6. Performance and Scalability Testing**

### **6.1 Large Codebase Handling**

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

**Test Implementation**:

```typescript
describe('Performance Testing', () => {
  it('should handle large projects efficiently', async () => {
    const largeProject = createLargeMockProject(150); // 150 files
    const startTime = Date.now();
    
    const result = await analyzeProject(largeProject);
    const processingTime = Date.now() - startTime;
    
    expect(processingTime).toBeLessThan(5000); // <5 seconds
    expect(result.fileCount).toBe(150);
    expect(result.analysisComplete).toBe(true);
  });
  
  it('should maintain memory usage within limits', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    const largeProject = createLargeMockProject(200);
    
    await analyzeProject(largeProject);
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // <100MB
  });
});
```

### **6.2 Template Processing Speed**

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

---

## 🎯 **7. User Experience Validation**

### **7.1 Prompt Clarity Testing**

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

### **7.2 Progress Visibility**

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

---

## 🛠️ **Testing Implementation Requirements**

### **Automated Testing Framework**

- **Unit Tests**: Jest for JavaScript/TypeScript, pytest for Python
- **Integration Tests**: End-to-end workflow testing
- **Mock Data**: Synthetic messy codebases for consistent testing
- **Test Harness**: Automated execution of test scenarios

### **Manual Testing Protocol**

- **User Experience Testing**: Real users following the protocol
- **Edge Case Testing**: Unusual project structures and configurations
- **Stress Testing**: Large codebases and complex refactoring scenarios
- **Accessibility Testing**: Usability for different user skill levels

### **Continuous Integration**

- **Automated Test Execution**: Run tests on every protocol update
- **Regression Testing**: Ensure changes don't break existing functionality
- **Performance Monitoring**: Track performance metrics over time
- **Quality Gates**: Block deployment if tests fail or performance degrades

---

## 📊 **Validation Metrics**

### **Functional Validation**

- **Template Resolution Accuracy**: 100% of placeholders correctly resolved
- **Phase Transition Accuracy**: 100% correct phase progression
- **State Persistence**: 100% progress preservation across sessions
- **Error Recovery**: 100% successful recovery from testable errors

### **Performance Validation**

- **Template Processing**: <1 second for placeholder resolution
- **State Updates**: <100ms for progress tracking updates
- **Working Copy Detection**: <500ms for file system operations
- **Memory Usage**: <100MB for large project state

### **User Experience Validation**

- **Prompt Clarity**: 100% of generated prompts are actionable
- **Progress Visibility**: Users can determine status in <5 seconds
- **Error Communication**: Error messages explain problems and solutions
- **Recovery Guidance**: Users know how to resume after interruptions

---

## 🔗 **Related Documentation**

- **[Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)** - Core execution engine and templates
- **[Examples & Workflows](mdc:prompts/code/refactor_protocol_examples.md)** - Workflow examples and troubleshooting
- **[Template Reference](mdc:prompts/code/refactor_protocol_templates.md)** - Extended template variations
- **[Language Specifics](mdc:prompts/code/refactor_protocol_language_specifics.md)** - Language-specific patterns

---

**Remember**: Comprehensive testing ensures the refactor protocol works reliably across all scenarios. Use these testing procedures to validate your implementation and maintain quality over time.
