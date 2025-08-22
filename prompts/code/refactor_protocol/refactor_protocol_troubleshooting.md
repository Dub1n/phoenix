# Refactor Protocol Troubleshooting Guide

**Purpose**: Extended troubleshooting procedures and error resolution for the Self-Executing Refactor Protocol  
**Usage**: Reference this file when you encounter issues or need detailed troubleshooting guidance  
**Related**: [Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)

---

## 🚨 **Critical Issue Resolution**

### **Protocol Not Working at All**

**Symptoms**: Agent doesn't recognize or execute the refactor protocol
**Severity**: Critical - Protocol completely non-functional

#### **Immediate Actions**

1. **Verify Document Format**: Ensure the protocol document is properly formatted Markdown
2. **Check Agent Context**: Confirm the agent has access to the full protocol document
3. **Restart Session**: Begin a new chat session with the protocol document
4. **Manual Activation**: Explicitly ask the agent to "Use the refactor protocol to analyze this project"

#### **Root Cause Analysis**

- **Document Corruption**: Protocol document may be corrupted or incomplete
- **Agent Limitations**: Current agent may not support the protocol format
- **Context Issues**: Agent may not have sufficient context to execute protocol
- **Format Problems**: Protocol may not follow expected format patterns

#### **Resolution Steps**

```bash
# 1. Verify protocol document integrity
- Check document length (should be 1000+ lines)
- Verify all sections are present
- Check for formatting issues

# 2. Test with minimal project
- Create simple test project with obvious code smells
- Provide minimal context to agent
- Request explicit protocol execution

# 3. Alternative activation methods
- "Please use the refactor protocol to analyze this codebase"
- "Execute the self-executing refactor protocol for this project"
- "Follow the refactor protocol workflow for this codebase"
```

### **Agent Stuck in Infinite Loop**

**Symptoms**: Agent continuously executes same action without progress
**Severity**: High - Prevents protocol completion

#### **Infinite Loop: Immediate Actions**

1. **Stop Execution**: Use Ctrl+C or stop the current action
2. **Check Working Copy**: Examine `refactor_protocol_working.md` for corruption
3. **Reset State**: Delete working copy and restart from Phase 0
4. **Manual Intervention**: Guide agent to next logical step

#### **Infinite Loop: Root Cause Analysis**

- **State Corruption**: Working copy contains invalid or corrupted state
- **Logic Error**: Phase transition logic has bug or infinite loop
- **Context Mismatch**: Agent context doesn't match expected state
- **Template Failure**: Templates failing to resolve or execute

#### **Infinite Loop: Resolution Steps**

```bash
# 1. Examine working copy
cat refactor_protocol_working.md
# Look for:
# - Invalid JSON
# - Missing required fields
# - Incorrect phase values
# - Infinite loop indicators

# 2. Reset to known good state
rm refactor_protocol_working.md
# Restart protocol from Phase 0

# 3. Manual state correction
# If working copy is partially corrupted, manually fix:
# - Correct phase number
# - Fix completion status
# - Remove invalid entries
```

---

## 🔧 **Common Issue Categories**

### **1. Working Copy Issues**

#### **Working Copy Not Found**

**Symptoms**: Agent starts from Phase 0 instead of continuing progress
**Frequency**: Common - Occurs when working copy is missing or inaccessible

**Diagnosis**:

```bash
# Check for working copy existence
ls -la refactor_protocol_working.md

# Check file permissions
ls -la refactor_protocol_working.md

# Verify file content
head -20 refactor_protocol_working.md
```

**Solutions**:

1. **File Location**: Ensure working copy is in project root directory
2. **File Permissions**: Check file is readable by the agent
3. **File Format**: Verify working copy contains valid JSON state
4. **Manual Recovery**: If file exists but agent can't read it, manually provide state

**Prevention**:

- Always save working copy in project root
- Use consistent file naming
- Verify file permissions after creation
- Backup working copy before major changes

#### **Working Copy Corruption**

**Symptoms**: Agent reports invalid state or crashes when reading working copy
**Frequency**: Uncommon but critical when it occurs

**Diagnosis**:

```bash
# Check JSON validity
python -m json.tool refactor_protocol_working.md

# Check for common corruption patterns
grep -n "null" refactor_protocol_working.md
grep -n "undefined" refactor_protocol_working.md
grep -n "NaN" refactor_protocol_working.md
```

**Solutions**:

1. **JSON Validation**: Fix invalid JSON syntax
2. **State Reconstruction**: Rebuild state from last known good point
3. **Backup Recovery**: Restore from backup if available
4. **Manual State Creation**: Create new working copy with current state

**Prevention**:

- Validate JSON before writing to file
- Use atomic write operations
- Create backups before major state changes
- Implement state validation checks

### **2. Template Resolution Issues**

#### **Unresolved Placeholders**

**Symptoms**: Templates contain `{{variable}}` placeholders instead of actual values
**Frequency**: Common - Occurs when context analysis is incomplete

**Diagnosis**:

```bash
# Check for unresolved placeholders
grep -n "{{" refactor_protocol_working.md

# Check context variables
grep -n "project_context" refactor_protocol_working.md
grep -n "current_state" refactor_protocol_working.md
```

**Solutions**:

1. **Re-run Analysis**: Ask agent to re-analyze project context
2. **Manual Context**: Provide missing context information manually
3. **Template Fallback**: Use alternative templates that don't require missing context
4. **Context Reconstruction**: Manually populate missing context variables

**Prevention**:

- Ensure complete project analysis before template execution
- Validate context variables before template resolution
- Use fallback templates for missing context
- Implement context validation checks

#### **Template Execution Failures**

**Symptoms**: Templates fail to execute or produce invalid output
**Frequency**: Uncommon but disruptive when it occurs

**Diagnosis**:

```bash
# Check template syntax
grep -n "template" refactor_protocol_working.md

# Check execution results
grep -n "execution_result" refactor_protocol_working.md

# Check error messages
grep -n "error" refactor_protocol_working.md
```

**Solutions**:

1. **Template Validation**: Check template syntax and structure
2. **Alternative Templates**: Use different templates for the same action
3. **Manual Execution**: Execute template logic manually
4. **Template Repair**: Fix template syntax or logic issues

**Prevention**:

- Validate templates before execution
- Test templates with sample data
- Implement template fallback mechanisms
- Monitor template execution results

### **3. Phase Transition Issues**

#### **Phase Not Advancing**

**Symptoms**: Agent stuck in current phase despite completing all requirements
**Frequency**: Common - Occurs when completion criteria aren't properly validated

**Diagnosis**:

```bash
# Check current phase
grep -n "phase" refactor_protocol_working.md

# Check completion status
grep -n "completed" refactor_protocol_working.md

# Check phase requirements
grep -n "requirements" refactor_protocol_working.md
```

**Solutions**:

1. **Requirement Check**: Verify all phase requirements are met
2. **Manual Validation**: Manually check completion criteria
3. **Phase Override**: Manually advance to next phase if appropriate
4. **Requirement Analysis**: Identify missing or incomplete requirements

**Prevention**:

- Clear completion criteria for each phase
- Automated requirement validation
- Progress tracking for partial completion
- Clear phase transition rules

#### **Phase Skipping**

**Symptoms**: Agent jumps ahead to later phases without completing prerequisites
**Frequency**: Uncommon but can cause serious issues

**Diagnosis**:

```bash
# Check phase sequence
grep -n "phase" refactor_protocol_working.md | sort

# Check completion history
grep -n "completed" refactor_protocol_working.md

# Check phase dependencies
grep -n "dependencies" refactor_protocol_working.md
```

**Solutions**:

1. **Phase Validation**: Verify all prerequisite phases are complete
2. **Rollback**: Return to missing phase and complete requirements
3. **Dependency Check**: Ensure all dependencies are satisfied
4. **Manual Correction**: Manually correct phase sequence

**Prevention**:

- Clear phase dependencies
- Automated dependency validation
- Phase completion verification
- Rollback mechanisms for invalid transitions

### **4. Progress Tracking Issues**

#### **Progress Loss**

**Symptoms**: Agent loses track of completed work or current status
**Frequency**: Common - Occurs during session restarts or agent changes

**Diagnosis**:

```bash
# Check progress tracking
grep -n "progress" refactor_protocol_working.md

# Check completion history
grep -n "completed" refactor_protocol_working.md

# Check current status
grep -n "current" refactor_protocol_working.md
```

**Solutions**:

1. **Progress Recovery**: Restore progress from working copy
2. **Manual Reconstruction**: Manually reconstruct progress state
3. **Session Continuity**: Ensure agent has access to working copy
4. **Progress Validation**: Verify progress state is accurate

**Prevention**:

- Persistent progress storage
- Regular progress backups
- Progress validation checks
- Clear progress indicators

#### **Progress Corruption**

**Symptoms**: Progress tracking contains invalid or inconsistent data
**Frequency**: Uncommon but critical when it occurs

**Diagnosis**:

```bash
# Check progress consistency
grep -n "progress" refactor_protocol_working.md

# Check for data inconsistencies
grep -n "inconsistent" refactor_protocol_working.md

# Check progress validation
grep -n "validation" refactor_protocol_working.md
```

**Solutions**:

1. **Data Validation**: Validate progress data for consistency
2. **Corruption Recovery**: Recover from corrupted progress data
3. **Progress Reconstruction**: Manually reconstruct progress state
4. **State Reset**: Reset to last known good state

**Prevention**:

- Progress data validation
- Regular progress backups
- Corruption detection mechanisms
- Recovery procedures

---

## 🛠️ **Advanced Troubleshooting**

### **Performance Issues**

#### **Slow Template Processing**

**Symptoms**: Template resolution takes >5 seconds
**Impact**: Poor user experience, potential timeouts

**Diagnosis**:

```bash
# Check template complexity
grep -c "{{" refactor_protocol_working.md

# Check context variable count
grep -c "context" refactor_protocol_working.md

# Check processing time
time template_resolution_command
```

**Solutions**:

1. **Template Simplification**: Reduce template complexity
2. **Context Optimization**: Optimize context variable population
3. **Caching**: Implement template result caching
4. **Async Processing**: Use asynchronous template processing

#### **Memory Usage Issues**

**Symptoms**: Memory usage >100MB for large projects
**Impact**: Potential crashes, poor performance

**Diagnosis**:

```bash
# Check memory usage
ps aux | grep agent_process

# Check context data size
du -sh refactor_protocol_working.md

# Check for memory leaks
grep -n "memory" refactor_protocol_working.md
```

**Solutions**:

1. **Context Cleanup**: Implement context data cleanup
2. **Memory Monitoring**: Monitor memory usage during execution
3. **Data Streaming**: Use streaming for large data sets
4. **Memory Limits**: Implement memory usage limits

### **Integration Issues**

#### **External Tool Failures**

**Symptoms**: External tools (git, tests, linters) fail during execution
**Impact**: Protocol execution stops or produces invalid results

**Diagnosis**:

```bash
# Check external tool status
git status
npm test
python -m pytest

# Check tool configuration
cat .git/config
cat package.json
cat pytest.ini
```

**Solutions**:

1. **Tool Validation**: Validate external tool configuration
2. **Fallback Mechanisms**: Implement fallback for failed tools
3. **Error Handling**: Improve error handling for tool failures
4. **Manual Execution**: Execute failed tools manually

#### **Environment Issues**

**Symptoms**: Protocol fails due to environment configuration problems
**Impact**: Protocol cannot execute in current environment

**Diagnosis**:

```bash
# Check environment variables
env | grep -i refactor

# Check file permissions
ls -la

# Check available tools
which git
which python
which node
```

**Solutions**:

1. **Environment Setup**: Fix environment configuration issues
2. **Permission Fixes**: Fix file and directory permissions
3. **Tool Installation**: Install missing required tools
4. **Environment Validation**: Validate environment before execution

---

## 📊 **Troubleshooting Decision Tree**

### **Issue Classification**

``` diagram
Is the protocol working at all?
├─ NO → Critical Issue Resolution
└─ YES → Continue to next question

Is the agent stuck in a loop?
├─ YES → Infinite Loop Resolution
└─ NO → Continue to next question

Is there a working copy issue?
├─ YES → Working Copy Troubleshooting
└─ NO → Continue to next question

Is there a template issue?
├─ YES → Template Troubleshooting
└─ NO → Continue to next question

Is there a phase transition issue?
├─ YES → Phase Transition Troubleshooting
└─ NO → Continue to next question

Is there a progress tracking issue?
├─ YES → Progress Tracking Troubleshooting
└─ NO → Continue to next question

Is there a performance issue?
├─ YES → Performance Troubleshooting
└─ NO → Continue to next question

Is there an integration issue?
├─ YES → Integration Troubleshooting
└─ NO → Issue not covered in this guide
```

### **Resolution Priority**

1. **Critical Issues** - Protocol completely non-functional
2. **High Priority** - Protocol partially functional but major issues
3. **Medium Priority** - Protocol functional but with significant issues
4. **Low Priority** - Protocol functional with minor issues
5. **Performance Issues** - Protocol functional but slow or resource-intensive

---

## 🔄 **Recovery Procedures**

### **Complete Reset Procedure**

**When to Use**: Protocol completely broken, no recovery possible
**Risk Level**: High - All progress will be lost

**Steps**:

```bash
# 1. Backup current state (if possible)
cp refactor_protocol_working.md refactor_protocol_working.md.backup

# 2. Remove all protocol files
rm refactor_protocol_working.md
rm -rf .refactor_protocol_cache/

# 3. Restart protocol from beginning
# Provide protocol document to agent again
# Start from Phase 0
```

### **Partial Recovery Procedure**

**When to Use**: Protocol partially working, some progress recoverable
**Risk Level**: Medium - Some progress may be lost

**Steps**:

```bash
# 1. Analyze current state
cat refactor_protocol_working.md

# 2. Identify corrupted sections
# Look for invalid JSON, missing fields, etc.

# 3. Repair corrupted sections
# Manually fix JSON syntax, add missing fields

# 4. Validate repaired state
python -m json.tool refactor_protocol_working.md

# 5. Continue from repaired state
# Resume protocol execution
```

### **Incremental Recovery Procedure**

**When to Use**: Protocol mostly working, minor issues to fix
**Risk Level**: Low - Minimal progress loss

**Steps**:

```bash
# 1. Identify specific issues
# Check error messages, failed actions

# 2. Fix individual issues
# Resolve template problems, fix state issues

# 3. Validate fixes
# Test affected functionality

# 4. Continue execution
# Resume normal protocol flow
```

---

## 📚 **Prevention Strategies**

### **Best Practices**

1. **Regular Backups**: Create backups of working copy before major changes
2. **State Validation**: Validate state data before and after major operations
3. **Error Monitoring**: Monitor for errors and address them promptly
4. **Progress Verification**: Verify progress tracking accuracy regularly

### **Monitoring and Alerting**

1. **Progress Monitoring**: Monitor protocol execution progress
2. **Error Detection**: Detect and alert on protocol errors
3. **Performance Monitoring**: Monitor protocol performance metrics
4. **State Validation**: Validate state data integrity

### **Documentation and Training**

1. **User Training**: Train users on proper protocol usage
2. **Troubleshooting Guides**: Provide comprehensive troubleshooting documentation
3. **Best Practices**: Document and share best practices
4. **Lessons Learned**: Document lessons learned from issues

---

## 🔗 **Related Documentation**

- **[Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)** - Core execution engine and templates
- **[Examples & Workflows](mdc:prompts/code/refactor_protocol_examples.md)** - Workflow examples and troubleshooting
- **[Template Reference](mdc:prompts/code/refactor_protocol_templates.md)** - Extended template variations
- **[Testing Guide](mdc:prompts/code/refactor_protocol_testing.md)** - Testing procedures and validation
- **[Language Specifics](mdc:prompts/code/refactor_protocol_language_specifics.md)** - Language-specific patterns

---

**Remember**: Most issues can be resolved with systematic troubleshooting. Start with the critical issues and work your way down the priority list. When in doubt, use the complete reset procedure to start fresh.
