# Agent Verification Protocol

> **Purpose**: Standardized instructions for agents to verify implementation claims vs reality  
> **Created**: 2025-08-21  
> **Target Audience**: AI agents working on Haruspex/Templum separation project  
> **Critical Priority**: Prevent false "success" claims without actual verification evidence

## ⚠️ MANDATORY VERIFICATION REQUIREMENTS

### For Agents Reading This Document

When you claim that any component, feature, or integration is "complete", "working", or "excellent", you MUST provide evidence by following this exact protocol. **No exceptions.**

**CRITICAL RULE**: If you cannot provide actual execution evidence (compilation output, test results, runtime logs), you MUST state clearly that your assessment is **theoretical** and **unverified**.

## Standard Verification Commands

### 1. File Existence Check

**What to run**:

```bash
ls -la [component-path]
stat [specific-file]
find . -name "[pattern]" -type f
```

**What to report**:

- Exact file paths found
- File sizes and modification dates
- "File exists at [path]" or "File not found: [path]"

**Example**:

``` text
✅ GOOD: "File exists: src/analysis/engine.ts (2.3KB, modified 2025-08-21)"
❌ BAD: "The analysis engine is implemented"
```

### 2. TypeScript Compilation Check

**What to run**:

```bash
npx tsc --noEmit [specific-file]
npx tsc --noEmit src/**/*.ts
npm run build
```

**What to report**:

- Exact error count: "0 errors" or "15 errors found"
- First 5 specific error messages with line numbers
- Full compilation output if under 50 lines

**Example**:

``` text
✅ GOOD: "Compilation result: 3 errors found:
  - src/types.ts:15 - Cannot find name 'WebSocket'
  - src/router.ts:42 - Property 'send' does not exist on type 'unknown'  
  - src/config.ts:8 - Module 'fs/promises' not found"
❌ BAD: "The component compiles successfully"
```

### 3. Dependency Verification

**What to run**:

```bash
npm ls [package-name]
npm list --depth=0
node -e "console.log(require('[package-name]'))"
```

**What to report**:

- Installed package versions
- Missing dependencies with specific names
- Import/require success or failure

**Example**:

``` text
✅ GOOD: "Dependency check: 'ws' package missing from node_modules, 'typescript' version 5.1.0 installed"
❌ BAD: "All dependencies are properly configured"
```

### 4. Test Execution Check

**What to run**:

```bash
npm test [specific-component]
npx jest src/[component].test.ts
npm run test:unit
```

**What to report**:

- Exact pass/fail counts: "5 tests passed, 2 failed"
- Names of failing tests
- Test coverage percentages if available

**Example**:

``` text
✅ GOOD: "Test results: 3/5 tests passed
  - ✅ should initialize correctly  
  - ✅ should handle valid input
  - ❌ should connect to WebSocket (TypeError: WebSocket is not defined)
  - ❌ should retry failed connections (ReferenceError: RetryConfig not found)"
❌ BAD: "All tests are passing"
```

### 5. Runtime Execution Check

**What to run**:

```bash
node -e "const x = require('./[component]'); console.log(x)"
npm start
node src/[component].js
```

**What to report**:

- Successful import/require or specific error
- Service startup success or failure details
- Console output or error messages

**Example**:

``` text
✅ GOOD: "Runtime test: 
  - require('./src/router.js') → Error: Cannot find module 'ws'  
  - Service startup failed: TypeError: config.websocket is undefined"
❌ BAD: "The service runs correctly"
```

## Critical Verification Questions

### Questions You MUST Answer With Evidence

When claiming implementation completion, answer these questions with actual command output:

#### 1. Compilation Status

- **Question**: "Does this component compile without errors?"
- **Required Evidence**: Output from `npx tsc --noEmit [file]`
- **Acceptable Answers**:
  - "Yes, 0 compilation errors" + output
  - "No, 7 compilation errors found" + specific error list

#### 2. Dependency Status  

- **Question**: "Are all required dependencies installed and working?"
- **Required Evidence**: Output from `npm ls` and import tests
- **Acceptable Answers**:
  - "Yes, all dependencies resolved" + package list
  - "No, missing: ws, @types/node" + npm ls output

#### 3. Test Status

- **Question**: "Do the tests pass when executed?"
- **Required Evidence**: Output from actual test execution
- **Acceptable Answers**:
  - "Yes, 12/12 tests passing" + test runner output
  - "No, 3/12 tests failing" + specific failure details

#### 4. Runtime Status

- **Question**: "Can this component be imported and instantiated successfully?"
- **Required Evidence**: Output from require/import attempt
- **Acceptable Answers**:
  - "Yes, imports successfully" + console output
  - "No, import fails with [specific error]" + error details

#### 5. Integration Status  

- **Question**: "Does this component communicate successfully with other components?"
- **Required Evidence**: Output from integration test or manual connection attempt
- **Acceptable Answers**:
  - "Yes, successfully connected to [backend]" + connection logs
  - "No, connection failed: [specific error]" + error logs

## Mock vs Real Implementation Detection

### CRITICAL: Always Disclose Mock Usage

When any part of your implementation uses mock, placeholder, or simulated components, you MUST:

1. **Explicitly State Mock Usage**: "This validation uses mock backends because..."
2. **Identify Mock Components**: List each mock/placeholder component by name
3. **Explain Why Mocks Needed**: "Real backend unavailable due to [specific blocking issue]"  
4. **Clarify Limitations**: "This proves the validation concept but not real integration"

### Mock Disclosure Examples

``` text
✅ GOOD: "Integration test successful using mock backends. 
Mock components used:
- MockHaruspexService (replaces real Haruspex backend due to compilation errors)
- MockPCLService (replaces real PCL backend due to missing dependencies)
Real integration blocked by: 100+ TypeScript compilation errors in target services"

❌ BAD: "Integration test successful, all backends responding correctly"
```

## Red Flag Phrases to Avoid

### Phrases That Indicate Insufficient Verification

❌ **NEVER USE**: "Should work correctly"  
✅ **USE INSTEAD**: "Works correctly - verified by [specific test with output]"

❌ **NEVER USE**: "The component is excellent"  
✅ **USE INSTEAD**: "Component functions as specified - test results: [specific output]"

❌ **NEVER USE**: "Integration is complete"  
✅ **USE INSTEAD**: "Integration verified - connection test output: [actual logs]"

❌ **NEVER USE**: "All tests are passing"  
✅ **USE INSTEAD**: "Test results: 15/15 passed - [show test runner output]"

❌ **NEVER USE**: "The build is successful"  
✅ **USE INSTEAD**: "Build completed with 0 errors - [show compilation output]"

## Evidence Documentation Requirements

### What Counts as Valid Evidence

1. **Command Line Output**: Copy-paste of actual terminal output
2. **Log Files**: Contents of generated log files
3. **Test Reports**: Actual test runner output with pass/fail details
4. **Error Messages**: Complete error messages with stack traces
5. **File Listings**: Output from ls, find, or directory exploration
6. **Package Information**: Output from npm ls, npm list, package.json inspection

### What Does NOT Count as Evidence

1. **Descriptions**: "The file compiles cleanly" (show the output!)
2. **Assertions**: "All tests pass" (show the test results!)  
3. **Theories**: "This should work" (prove it works!)
4. **Documentation**: "According to the spec" (show runtime proof!)
5. **Assumptions**: "The integration is functional" (demonstrate it!)

## Verification Workflow

### Step-by-Step Verification Process

#### Phase 1: Basic Health Check

1. Verify file existence with `ls -la [paths]`
2. Check TypeScript compilation with `npx tsc --noEmit`
3. Validate dependencies with `npm ls`
4. Document all findings with exact output

#### Phase 2: Component Testing

1. Run unit tests with `npm test [component]`
2. Attempt manual import/require
3. Test basic component instantiation
4. Document pass/fail results with details

#### Phase 3: Integration Testing

1. Start required backend services
2. Test component-to-component communication
3. Verify data flow and state synchronization
4. Document connection success/failure with logs

#### Phase 4: Documentation

1. Update appropriate tracker file (Haruspex or Templum)
2. Record evidence in Evidence Archive section
3. Update component status from "Claimed" to "Verified" or "Broken"
4. Add any discovered issues to TODO queue

## Updating Implementation Trackers

### When Verification Complete

After completing verification protocol, update the relevant tracker:

1. **Haruspex-Implementation-Tracker.md** for Haruspex backend components
2. **Templum-Implementation-Tracker.md** for Templum interface components

### Status Updates Required

Update these fields in the component status table:

- **Verified**: Change from ❌ to ✅ or ⏳
- **Status**: Update to reflect actual state (🟢/🟡/🔴)
- **Evidence**: Add summary of verification results
- **Notes**: Add details about issues found or verification method

### Evidence Archive Updates

Add entry to Evidence Archive section:

- **Date**: Verification date
- **Component**: What was verified
- **Method**: How verification was performed  
- **Results**: Summary of findings
- **Evidence**: Reference to detailed output/logs

## Example Verification Session

### Good Verification Example

``` text
Agent: "I will now verify the Haruspex analysis engine component."

Step 1 - File Check:
$ ls -la src/analysis/
-rw-r--r-- 1 user user 3421 2025-08-21 15:30 engine.ts
-rw-r--r-- 1 user user 1205 2025-08-21 15:25 types.ts
Files exist: engine.ts (3.4KB), types.ts (1.2KB)

Step 2 - Compilation Check:
$ npx tsc --noEmit src/analysis/engine.ts
src/analysis/engine.ts:15:23 - error TS2304: Cannot find name 'WebSocket'.
src/analysis/types.ts:8:14 - error TS2307: Cannot find module 'ws'.
Found 2 errors.

Step 3 - Dependency Check:
$ npm ls ws
npm ERR! 404 ws@* missing

Step 4 - Update Tracker:
Component: Haruspex Analysis Engine
Status: 🔴 Broken - Missing WebSocket dependencies  
Evidence: 2 TypeScript errors, 'ws' package not installed
Action Required: Install WebSocket dependencies and fix imports

Conclusion: Component files exist but cannot compile due to missing dependencies. 
Not functional in current state.
```

### Bad Verification Example

``` text
❌ Agent: "The Haruspex analysis engine is excellent and fully functional. 
All components are working perfectly and the integration is complete."

Missing: No command output, no compilation check, no evidence provided.
This is insufficient verification.
```

## Escalation Protocol

### When to Escalate to Human

If you encounter any of these situations, immediately inform the human:

1. **Cannot Provide Evidence**: If verification commands fail to run
2. **Significant Discrepancies**: If claimed vs actual state differs dramatically  
3. **Mock Requirements**: If real verification requires mock implementations
4. **Blocking Issues**: If verification reveals system-wide problems
5. **Uncertainty**: If you're unsure whether something is real or placeholder

### Escalation Format

``` text
⚠️ ESCALATION REQUIRED ⚠️

Issue: [Brief description]
Component: [What was being verified]  
Problem: [Why verification cannot proceed]
Evidence: [Any partial verification results]
Recommendation: [Suggested next steps]
```

---

## Protocol Summary

**REMEMBER**: Evidence, not assertions. Show, don't tell. Prove, don't claim.

This protocol exists because previous phases reported "excellent" and "complete" implementations that were actually broken or mock-based. Your job is to establish ground truth through actual verification evidence.
