# Templum Testing & Validation Guide

**Purpose**: Universal validation framework for all Templum development tasks
**Key Principle**: Every change requires evidence-based validation appropriate to its scope

---

## PRIMARY METHOD: Automated Validation

**RECOMMENDED APPROACH**: Use the automated task validator script for all validation tasks.

### Automated Task Validation Script

**Single Command Validation**:

```bash
# Navigate to project directory (e.g., Templum, Haruspex, etc.)
cd <project-directory>

# Run automated validation based on task category
node ../scripts/validation/templum-task-validator.js --category <category> --task-id <TASK-ID> --save
```

**Available Categories**:

- `backend` - Backend/Service Tasks (health checks, service discovery, command execution)
- `ui` - UI/Interface Tasks (CLI functionality, component rendering, interactions)
- `core` - Core System Tasks (unit tests, integration, state persistence)
- `build` - Compilation/Build Tasks (clean build, TypeScript, dependencies)
- `quality` - Code Quality Tasks (ESLint, formatting, regression, complexity)
- `architecture` - Architecture/Pattern Tasks (patterns, DI validation, scalability)
- `feature` - Feature Enhancement Tasks (end-to-end, regression, integration)

**What the Script Automates**:

- ✅ Runs ALL mandatory validation commands for the selected category
- ✅ Automatically captures and formats evidence
- ✅ Generates validation reports in correct format
- ✅ Handles service startup/shutdown as needed
- ✅ Provides clear pass/fail status with detailed error reporting
- ✅ No possibility of skipping tests or providing incomplete evidence

**Example Usage**:

```bash
# Backend service validation
node ../scripts/validation/templum-task-validator.js --category backend --task-id TASK-CLI-015 --save

# Quality validation  
node ../scripts/validation/templum-task-validator.js --category quality --task-id TASK-QUALITY-001 --save

# Build validation
node ../scripts/validation/templum-task-validator.js --category build --task-id TASK-BUILD-005 --save
```

---

## MANUAL VALIDATION (FALLBACK ONLY)

**When to Use Manual Validation**:

- Automated script fails or is not available
- Category not yet supported by automated script
- Special edge cases requiring human judgment
- Debugging script failures
- Development or testing of new validation procedures

**Manual Validation Checklist**:

**Backend Service Tasks**:

- [ ] Execute Guide Section 1: "Backend/Service Tasks"  
- [ ] Run commands from Section 1.1: Service Health Check
- [ ] Verify Section 1.2: Command Execution Testing
- [ ] Test Section 1.3: Service Registration Verification
- [ ] **Evidence Required**: JSON responses, command outputs, health check results

**UI/Interface Tasks**:

- [ ] Execute Guide Section 2: "UI/Interface Tasks"
- [ ] Run Section 2.1: CLI Functionality Testing
- [ ] Test Section 2.2: Component Rendering Tests
- [ ] Verify Section 2.3: UI Interaction Testing
- [ ] **Evidence Required**: CLI screenshots, command outputs, menu interactions

**Core System Tasks**:

- [ ] Execute Guide Section 3: "Core System Tasks"
- [ ] Run Section 3.1: Unit Tests with Coverage
- [ ] Test Section 3.2: Integration Test Suite
- [ ] Verify Section 3.3: System State Persistence
- [ ] **Evidence Required**: Test results, coverage reports, state changes

**Compilation/Build Tasks**:

- [ ] Execute Guide Section 4: "Compilation/Build Tasks"
- [ ] Run Section 4.1: Clean Build Testing
- [ ] Test Section 4.2: TypeScript Type Checking
- [ ] Verify Section 4.3: Dependency Validation
- [ ] **Evidence Required**: Build outputs, compilation results, dependency reports

**Code Quality Tasks**:

- [ ] Execute Guide Section 5: "Code Quality Tasks"
- [ ] Run Section 5.1: ESLint Validation
- [ ] Test Section 5.2: Code Formatting Verification
- [ ] Verify Section 5.3: Regression Testing
- [ ] **Evidence Required**: Lint reports, format results, test outcomes

**Architecture/Pattern Tasks**:

- [ ] Execute Guide Section 6: "Architecture/Pattern Tasks"
- [ ] Run Section 6.1: Pattern Implementation Testing
- [ ] Test Section 6.2: Design Pattern Compliance
- [ ] Verify Section 6.3: Scalability Testing
- [ ] **Evidence Required**: Pattern tests, compliance reports, load test results

**Feature Enhancement Tasks**:

- [ ] Execute Guide Section 7: "Feature Enhancement Tasks"
- [ ] Run Section 7.1: End-to-End Feature Testing
- [ ] Test Section 7.2: Comprehensive Regression Testing
- [ ] Verify Section 7.3: Integration Verification
- [ ] **Evidence Required**: Feature demos, regression reports, integration tests

**Manual Evidence Collection**:

- [ ] **Command Outputs**: Copy actual terminal output showing working functionality
- [ ] **Log Evidence**: Include relevant log entries proving events/actions occurred
- [ ] **State Changes**: Document before/after system state demonstrating impact
- [ ] **Screenshots**: For UI/CLI changes showing visual evidence
- [ ] **JSON Outputs**: For API/service tasks showing structured data responses

**Manual Evidence Format**:

```markdown
## Validation Evidence - [TASK-ID] - [DATE]

### Test: [Specific Test Name]
**Command**: `[exact command run]`
**Output**:
```

[copy-paste actual output]

```log
**Result**: ✅ PASS / ❌ FAIL
**Notes**: [any observations]
```

**Manual Report Template**:

```markdown
---
date: [YYYY-MM-DD-HHMM]
TASK-ID: [TASK-ID from active tasks]
source: [project-active-tasks.md]
validation_type: [manual]
category: [backend|ui|core|build|quality|architecture|feature]
priority: [critical|high|medium|low]
complexity: [numeric score from task]
components: [affected file names without paths]
initial_status: [~|B]
end_status: [T|B]
tags: [searchable keywords separated by commas]
---

# Manual Validation Report - [TASK-ID] - [TIMESTAMP]

## Tests Executed:
- [ ] [Test 1 Name] - ✅ PASS / ❌ FAIL
- [ ] [Test 2 Name] - ✅ PASS / ❌ FAIL
- [ ] [Test 3 Name] - ✅ PASS / ❌ FAIL

## Evidence Collected:
- Command outputs: [count] files
- Log entries: [count] entries  
- Screenshots: [count] images
- Performance metrics: [if applicable]

## Next Steps:
- [T] Ready for /pr:document
- [B] Return to implementation (issues listed below)

## Issues Found (if any):
1. [Issue description] - [Fix required]
2. [Issue description] - [Fix required]
```

Save manual reports to: `<Project>/dev/validation/{TIMESTAMP}-{TASK-ID}.md`

---

## CRITICAL VALIDATION PRINCIPLE

**!!! MANDATORY COMPLIANCE !!!**: **DO NOT CLAIM SUCCESS WITHOUT VALIDATED EVIDENCE**

- **COMPILATION SUCCESS ≠ FUNCTIONAL SUCCESS**
- **"IT SHOULD WORK" ≠ "IT WORKS"**
- **EVERY CLAIM REQUIRES REPRODUCIBLE PROOF**
- **IF ANY VALIDATION FAILS → STOP → DO NOT CONTINUE**

**CONSEQUENCE**: Claims of success without evidence = TASK FAILURE

---

## MANDATORY VALIDATION FRAMEWORK

**CRITICAL**: Before marking ANY task complete, you MUST answer ALL questions with EVIDENCE:

1. **Does it compile?** → MUST show clean build output with 0 errors
2. **Does it run?** → MUST show execution without errors  
3. **Does it work?** → MUST show expected behavior/output matching specifications
4. **Is it integrated?** → MUST show working with other components
5. **Will it break?** → MUST show edge case handling with error states

**STOP CONDITION**: If you cannot provide evidence for ANY question, the task is INCOMPLETE.

---

## Category-Specific Testing Requirements

### 1. Backend/Service Tasks

**Examples**: Service discovery, command routing, backend integration

#### Backend/Service Tasks: MANDATORY Validation Commands

**RUN THESE EXACT COMMANDS - NO SUBSTITUTIONS ALLOWED WITHOUT EVIDENCE**:

```bash
# 1. Service health check (MUST return healthy status)
curl -s http://localhost:3004/health | jq '.'
# EXPECTED OUTPUT: {"status": "healthy", "uptime": <number>, ...}
# FAILURE CONDITION: Any HTTP error, malformed JSON, or status != "healthy"

# 2. Command execution test (MUST show success=true)
curl -X POST http://localhost:3004/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.hello", "args": {"name": "TestUser"}}'
# EXPECTED OUTPUT: {"success": true, "result": {"message": "Hello, TestUser!"}}
# FAILURE CONDITION: success != true or missing result data

# 3. Service registration verification (MUST find service file)
find . -path "*/.templum/services/*.json" -exec ls -la {} \;
# EXPECTED OUTPUT: File path with recent timestamp and current PID in filename
# FAILURE CONDITION: No files found or files with incorrect PID

# 4. Service file content validation (MUST contain valid registration data)
find . -path "*/.templum/services/*.json" -exec cat {} \;
# EXPECTED OUTPUT: JSON with "endpoint", "protocol", "started" timestamp
# FAILURE CONDITION: Missing required fields or malformed JSON
```

#### Backend/Service Tasks: MANDATORY Success Criteria

**STOP CONDITION**: If ANY criterion fails, DO NOT continue to other tasks.

- [ ] Service starts without errors (VERIFY: No error messages in console output)
- [ ] All endpoints return HTTP 200 with expected JSON structure
- [ ] Service discovery/registration creates service file with correct PID
- [ ] Commands execute returning `{"success": true, ...}` with expected result data
- [ ] Cleanup removes all service files and stops all processes

### 2. UI/Interface Tasks  

**Examples**: CLI menus, VSCode integration, UI components

#### UI/Interface Tasks: MANDATORY Validation Commands

**RUN THESE EXACT COMMANDS - NO SUBSTITUTIONS ALLOWED WITHOUT EVIDENCE**:

```bash
# 1. CLI functionality test (MUST show discovered services)
npm run start:cli -- --list-services 2>&1 | head -20
# EXPECTED OUTPUT: "Templum services found:" followed by service list
# FAILURE CONDITION: "No services found" or console errors

# 2. Component rendering test (MUST pass all tests)
npm run test -- --testNamePattern="Component" --verbose
# EXPECTED OUTPUT: All tests passed, no failures or errors
# FAILURE CONDITION: Any test failures, compilation errors, or runtime exceptions

# 3. UI interaction test (MUST respond to user input)
# Manual verification required:
# Start: npm run start:cli
# Action: Navigate with arrow keys, select with Enter
# EXPECTED: Menu responds, no crashes, commands execute
# FAILURE CONDITION: Interface freeze, crashes, or non-responsive input

# 4. Error handling test (MUST handle invalid input gracefully)
# Manual verification required:
# Action: Enter invalid commands or data
# EXPECTED: Clear error messages, interface remains stable
# FAILURE CONDITION: Crashes, unclear errors, or interface corruption
```

#### UI/Interface Tasks: MANDATORY Success Criteria

**STOP CONDITION**: If ANY criterion fails, DO NOT continue to other tasks.

- [ ] Interface renders without console errors or exceptions
- [ ] User interactions produce expected visual/behavioral changes
- [ ] Navigation/menu systems respond to input and change state correctly
- [ ] Error states display appropriate messages and don't crash application
- [ ] Accessibility testing passes automated checks (aria labels, keyboard navigation)

### 3. Core System Tasks

**Examples**: State management, configuration, resource handling

#### Core System Tasks: MANDATORY Validation Commands

**RUN THESE EXACT COMMANDS - NO SUBSTITUTIONS ALLOWED WITHOUT EVIDENCE**:

```bash
# 1. Unit tests with coverage (MUST achieve >80% coverage)
npm run test -- --coverage --testPathPattern="src/core/" --verbose
# EXPECTED OUTPUT: All tests passed + coverage report showing >80%
# FAILURE CONDITION: Any test failures or coverage below 80%

# 2. Integration test suite (MUST verify cross-component functionality)
npm run test:integration -- --verbose
# EXPECTED OUTPUT: All integration tests passed with component interaction verified
# FAILURE CONDITION: Integration failures, component communication errors

# 3. System state persistence test (MUST maintain state across restarts)
bash -c 'npm run start:cli -- --save-state test-state && pkill -f "npm run start:cli" && sleep 2 && npm run start:cli -- --load-state test-state'
# EXPECTED OUTPUT: State successfully restored after restart
# FAILURE CONDITION: State lost, errors during save/load operations

# 4. Resource cleanup verification (MUST clean up all resources)
npm run test -- --testNamePattern="cleanup" && ps aux | grep -v grep | grep templum
# EXPECTED OUTPUT: Tests pass, no lingering Templum processes
# FAILURE CONDITION: Memory leaks, orphaned processes, uncleaned files
```

#### Core System Tasks: MANDATORY Success Criteria

**STOP CONDITION**: If ANY criterion fails, DO NOT continue to other tasks.

- [ ] Unit tests pass with >80% coverage (VERIFY: Coverage report shows actual percentages)
- [ ] Integration tests demonstrate cross-component functionality with expected outputs
- [ ] Configuration changes persist after restart and produce expected behavior
- [ ] Resource cleanup verified (no memory leaks, files cleaned up, processes terminated)
- [ ] Performance benchmarks met (response times <500ms, memory usage stable)

### 4. Compilation/Build Tasks

**Examples**: TypeScript fixes, library compatibility, build configuration

#### Compilation/Build Tasks: MANDATORY Validation Commands

**RUN THESE EXACT COMMANDS - NO SUBSTITUTIONS ALLOWED WITHOUT EVIDENCE**:

```bash
# 1. Clean build test (MUST compile with zero errors)
rm -rf dist/ node_modules/.cache && npm ci && npm run build
# EXPECTED OUTPUT: "Build completed successfully" with no error messages
# FAILURE CONDITION: Any compilation errors, warnings, or build failures

# 2. TypeScript type checking (MUST have no type errors)
npx tsc --noEmit --strict
# EXPECTED OUTPUT: No output (silent success)
# FAILURE CONDITION: Any TypeScript errors or type violations

# 3. Dependency validation (MUST have no conflicts)
npm ls --depth=0 2>&1 | grep -E "(UNMET|ERROR|WARN)"
# EXPECTED OUTPUT: No output (no dependency issues)
# FAILURE CONDITION: Unmet dependencies, version conflicts, or warnings

# 4. Build artifact verification (MUST generate expected output files)
ls -la dist/ && find dist/ -name "*.js" -exec echo "File: {}" \; -exec head -5 {} \;
# EXPECTED OUTPUT: dist/ directory with .js files containing valid JavaScript
# FAILURE CONDITION: Missing files, empty files, or malformed output
```

#### Compilation/Build Tasks: MANDATORY Success Criteria

**STOP CONDITION**: If ANY criterion fails, DO NOT continue to other tasks.

- [ ] Clean compilation with exactly 0 errors and 0 warnings in target scope
- [ ] All test files compile without TypeScript or syntax errors
- [ ] Extension builds successfully producing expected output files
- [ ] Dependency analysis shows no circular import chains
- [ ] Build artifacts exist in expected locations with correct file sizes >0

### 5. Code Quality Tasks

**Examples**: ESLint fixes, refactoring, cleanup

#### Code Quality Tasks: MANDATORY Validation Commands

**RUN THESE EXACT COMMANDS - NO SUBSTITUTIONS ALLOWED WITHOUT EVIDENCE**:

```bash
# 1. ESLint validation (MUST show zero violations)
npm run lint -- --format=json | jq '.[] | select(.errorCount > 0 or .warningCount > 0)'
# EXPECTED OUTPUT: No output (empty result means no violations)
# FAILURE CONDITION: Any errors or warnings reported

# 2. Code formatting verification (MUST match style standards)
npm run format:check || (echo "Formatting issues found:" && npm run format:diff)
# EXPECTED OUTPUT: "All files properly formatted" or detailed diff of issues
# FAILURE CONDITION: Formatting inconsistencies or style violations

# 3. Regression testing (MUST verify no functionality broken)
npm run test -- --passWithNoTests=false
# EXPECTED OUTPUT: All existing tests pass, no new failures
# FAILURE CONDITION: Any test failures or regressions introduced

# 4. Code complexity analysis (MUST meet maintainability standards)
npx ts-complexity-check src/ --max-complexity=10
# EXPECTED OUTPUT: All functions below complexity threshold
# FAILURE CONDITION: Functions exceeding complexity limits
```

#### Code Quality Tasks: MANDATORY Success Criteria

**STOP CONDITION**: If ANY criterion fails, DO NOT continue to other tasks.

- [ ] ESLint/TSLint shows exactly 0 violations for modified files
- [ ] All existing tests still pass (regression verification)
- [ ] Code follows project conventions (naming, structure, patterns)
- [ ] Comments and documentation updated to reflect changes
- [ ] Performance benchmarks show no degradation (within 5% of baseline)

### 6. Architecture/Pattern Tasks

**Examples**: New patterns, architectural changes, system design

#### Architecture/Pattern Tasks: MANDATORY Validation Commands

**RUN THESE EXACT COMMANDS - NO SUBSTITUTIONS ALLOWED WITHOUT EVIDENCE**:

```bash
# 1. Pattern implementation verification (MUST demonstrate pattern works correctly)
npm run test -- --testNamePattern="Pattern|Architecture" --verbose
# EXPECTED OUTPUT: All pattern tests pass with behavioral verification
# FAILURE CONDITION: Pattern tests fail or behavioral expectations not met

# 2. Design pattern compliance (MUST follow established architectural patterns)
grep -r "class\|interface\|function" src/ | head -10 && echo "Checking pattern adherence..."
# EXPECTED OUTPUT: Code follows consistent patterns and naming conventions
# FAILURE CONDITION: Inconsistent patterns or architectural violations

# 3. Dependency injection validation (MUST demonstrate proper DI implementation)
npm run test -- --testNamePattern="inject|depend" --verbose
# EXPECTED OUTPUT: Dependency injection tests pass, loose coupling verified
# FAILURE CONDITION: Tight coupling, DI failures, or injection errors

# 4. Scalability testing (MUST handle expected load)
for i in {1..10}; do curl -s http://localhost:3004/health & done; wait
# EXPECTED OUTPUT: All requests succeed within acceptable time limits
# FAILURE CONDITION: Timeouts, errors, or performance degradation under load
```

#### Architecture/Pattern Tasks: MANDATORY Success Criteria

**STOP CONDITION**: If ANY criterion fails, DO NOT continue to other tasks.

- [ ] Pattern implementation matches design specification exactly
- [ ] All integration points tested with expected data flows
- [ ] Performance benchmarks meet or exceed requirements
- [ ] Load testing demonstrates scalability under expected traffic
- [ ] Architecture documentation complete with diagrams and examples

### 7. Feature Enhancement Tasks

**Examples**: New capabilities, workflow improvements, optimizations

#### Feature Enhancement Tasks: MANDATORY Validation Commands

**RUN THESE EXACT COMMANDS - NO SUBSTITUTIONS ALLOWED WITHOUT EVIDENCE**:

```bash
# 1. Feature functionality demonstration (MUST show feature working end-to-end)
# Replace [FEATURE_COMMAND] with actual command for your feature:
# Example: curl -X POST http://localhost:3004/executeCommand -d '{"command": "new.feature", "args": {}}'
echo "MANDATORY: Replace this with actual feature test command and run it"
# EXPECTED OUTPUT: Feature produces expected results matching specification
# FAILURE CONDITION: Feature doesn't work, produces wrong output, or errors

# 2. Comprehensive regression testing (MUST verify no existing functionality broken)
npm run test -- --coverage --testTimeout=10000
# EXPECTED OUTPUT: All tests pass, coverage maintained or improved
# FAILURE CONDITION: Any test failures, reduced coverage, or performance regression

# 3. Integration verification (MUST show feature integrates with existing system)
# Example for service integration:
curl -s http://localhost:3004/getSkinDefinition | jq '.commands | keys[]' | grep -q "new.feature"
# EXPECTED OUTPUT: New feature appears in system's command registry
# FAILURE CONDITION: Feature not registered or not discoverable by system

# 4. User workflow testing (MUST demonstrate complete user experience)
# Manual verification required:
# 1. Start: npm run start:cli
# 2. Navigate to new feature in UI
# 3. Execute feature with various inputs
# 4. Verify expected outputs and error handling
# EXPECTED: Complete workflow functions without errors
# FAILURE CONDITION: Workflow breaks, unclear UX, or missing error handling
```

#### Feature Enhancement Tasks: MANDATORY Success Criteria

**STOP CONDITION**: If ANY criterion fails, DO NOT continue to other tasks.

- [ ] Feature produces exactly the specified behavior with test evidence
- [ ] Edge cases handled gracefully (empty inputs, boundary conditions, error states)
- [ ] All existing functionality works unchanged (backward compatibility verified)
- [ ] User documentation includes working examples and expected outputs
- [ ] End-to-end testing demonstrates feature integration with real usage scenarios

---

## Universal Testing Commands

### MANDATORY UNIVERSAL COMMANDS (NO EXCEPTIONS)

**MUST RUN ALL COMMANDS FOR EVERY TASK - NO SHORTCUTS**:

```bash
# 1. MANDATORY: Clean compilation check
rm -rf dist/ && npm run build
# EXPECTED: "Build completed successfully" with 0 errors
# IF FAILS: STOP - Fix compilation errors before continuing

# 2. MANDATORY: Complete test suite
npm run test -- --coverage --verbose
# EXPECTED: All tests pass with >80% coverage
# IF FAILS: STOP - Fix failing tests before continuing

# 3. MANDATORY: Lint validation (only if code modified)
if git diff --name-only HEAD~1 | grep -E "\.(ts|js|tsx|jsx)$"; then
  npm run lint -- --format=json | jq '.[] | select(.errorCount > 0 or .warningCount > 0)'
  # EXPECTED: No output (no violations)
  # IF FAILS: STOP - Fix lint violations before continuing
fi

# 4. MANDATORY: TypeScript type checking
npx tsc --noEmit --strict
# EXPECTED: No output (silent success)
# IF FAILS: STOP - Fix type errors before continuing
```

### MANDATORY INTEGRATION TESTING (FOR SYSTEM CHANGES)

**MUST RUN WHEN TASK AFFECTS MULTIPLE COMPONENTS**:

```bash
#!/bin/bash
echo "Starting mandatory integration test sequence..."

# 1. Start test backend
echo "Starting test backend..."
cd examples/minimal-backend && npm start &
BACKEND_PID=$!
cd ..
sleep 3

# 2. Verify backend is running
echo "Verifying backend startup..."
curl -f http://localhost:3004/health || { echo "FAIL: Backend not responding"; kill $BACKEND_PID; exit 1; }

# 3. Run integration tests
echo "Running integration tests..."
npm run test:integration || { echo "FAIL: Integration tests failed"; kill $BACKEND_PID; exit 1; }

# 4. Test CLI integration
echo "Testing CLI integration..."
timeout 10 npm run start:cli -- --list-services | grep -q "minimal-example" || { echo "FAIL: CLI integration failed"; kill $BACKEND_PID; exit 1; }

# 5. Cleanup
echo "Cleaning up..."
kill $BACKEND_PID
sleep 1

echo "SUCCESS: All integration tests passed"
```

---

## MANDATORY EVIDENCE COLLECTION

**CRITICAL**: NO TASK IS COMPLETE WITHOUT ALL REQUIRED EVIDENCE BELOW

**FAILURE TO PROVIDE EVIDENCE** *=* **TASK INCOMPLETE**

### 1. COMPILATION EVIDENCE (REQUIRED FOR ALL TASKS)

**MUST PROVIDE EXACT COMMAND OUTPUT**:

``` bash
$ npm run build
> templum@1.0.0 build
> tsc && tsc-alias

✓ Compiled successfully in [X]ms
✓ 0 errors, 0 warnings
✓ Build artifacts generated in dist/
```

**FAILURE INDICATORS**: Any error messages, warnings, or missing success confirmations

### 2. FUNCTIONALITY EVIDENCE (REQUIRED - NO EXCEPTIONS)

**MUST SHOW ACTUAL EXECUTION WITH REAL OUTPUT**:

``` bash
$ [EXACT command you ran]
[COMPLETE actual output - not summarized or truncated]
[TIMESTAMP of execution]
```

**REQUIREMENTS**:

- Copy-paste actual terminal output
- Include timestamps where applicable
- Show complete command with all parameters
- Demonstrate expected behavior achieved

### 3. INTEGRATION EVIDENCE (REQUIRED FOR SYSTEM CHANGES)

**MUST DEMONSTRATE WORKING WITH OTHER COMPONENTS**:

``` bash
$ [Integration test command]
[Output showing successful integration]
$ [Second verification command]
[Output confirming system-wide functionality]
```

**REQUIREMENTS**:

- Test interaction with at least 2 other system components
- Verify data flows correctly between components  
- Confirm no disruption to existing functionality

### 4. QUALITY EVIDENCE (REQUIRED WHEN CODE MODIFIED)

**MUST SHOW QUALITY GATES PASSING**:

``` bash
$ npm run lint -- [modified files or directories]
✓ 0 errors, 0 warnings found in [X] files

$ npm run test -- [relevant test pattern]
✓ Tests passed: [X] of [X]
✓ Test coverage: [X]% (must be >80%)
```

### 5. PERFORMANCE EVIDENCE (REQUIRED FOR PERFORMANCE-RELATED TASKS)

**MUST INCLUDE BEFORE/AFTER METRICS**:

``` bash
$ time [performance test command]
real    0m[X]s
user    0m[X]s  
sys     0m[X]s

Before: [baseline metric]
After:  [improved metric]
Improvement: [X]% better
```

---

## AUTOMATION SCRIPTS FOR VALIDATION

### Complete Task Validation Script

**COPY AND RUN THIS SCRIPT FOR ANY TASK**:

```bash
#!/bin/bash
set -e  # Exit on any failure

echo "=== MANDATORY TEMPLUM TASK VALIDATION SCRIPT ==="
echo "Task: $1"  # Pass task description as argument
echo "Started: $(date)"

echo "\n1. ENVIRONMENT CLEANUP"
rm -rf dist/ node_modules/.cache
npm ci

echo "\n2. COMPILATION VALIDATION"
npm run build || { echo "FAIL: Compilation failed"; exit 1; }

echo "\n3. TYPE CHECKING"
npx tsc --noEmit --strict || { echo "FAIL: Type errors found"; exit 1; }

echo "\n4. LINT VALIDATION"
if git diff --name-only HEAD~1 | grep -E "\.(ts|js|tsx|jsx)$" > /dev/null; then
  npm run lint || { echo "FAIL: Lint violations found"; exit 1; }
else
  echo "No code changes detected, skipping lint"
fi

echo "\n5. TEST EXECUTION"
npm run test -- --coverage || { echo "FAIL: Tests failed"; exit 1; }

echo "\n6. INTEGRATION TESTING (if applicable)"
if [ -f "examples/minimal-backend/server.js" ]; then
  echo "Starting backend for integration testing..."
  cd examples/minimal-backend && npm start &
  BACKEND_PID=$!
  cd ../..
  sleep 3
  
  # Test backend health
  curl -f http://localhost:3004/health || { echo "FAIL: Backend health check failed"; kill $BACKEND_PID; exit 1; }
  
  # Test CLI integration
  timeout 10 npm run start:cli -- --list-services | grep -q "minimal-example" || { echo "FAIL: CLI integration failed"; kill $BACKEND_PID; exit 1; }
  
  # Cleanup
  kill $BACKEND_PID
  echo "Integration tests passed"
fi

echo "\n7. PERFORMANCE CHECK"
if command -v time > /dev/null; then
  echo "Testing CLI startup performance..."
  time timeout 5 npm run start:cli -- --version || echo "Performance test completed"
fi

echo "\n=== ALL VALIDATIONS PASSED ==="
echo "Task '$1' completed successfully at $(date)"
echo "EVIDENCE: All commands above completed without errors"
```

### Quick Backend Validation Script

```bash
#!/bin/bash
echo "=== BACKEND VALIDATION SCRIPT ==="

# Start backend
cd examples/minimal-backend && npm start &
BACKEND_PID=$!
cd ..
sleep 3

# Test all endpoints
echo "Testing /health endpoint:"
curl -s http://localhost:3004/health | jq '.status' | grep -q "healthy" && echo "[x] Health OK" || echo "[F] Health FAIL"

echo "Testing /getSkinDefinition endpoint:"
curl -s http://localhost:3004/getSkinDefinition | jq '.metadata.id' | grep -q "minimal-example" && echo "[x] Skin OK" || echo "[F] Skin FAIL"

echo "Testing /executeCommand endpoint:"
curl -s -X POST http://localhost:3004/executeCommand -H "Content-Type: application/json" -d '{"command": "example.hello", "args": {"name": "TestUser"}}' | jq '.success' | grep -q "true" && echo "[x] Command OK" || echo "[F] Command FAIL"

# Cleanup
kill $BACKEND_PID
echo "Backend validation complete"
```

## COMMON VALIDATION FAILURES & SOLUTIONS

### FAILURE: "Works on my machine"

**MANDATORY SOLUTION**: Test in clean environment

```bash
# REQUIRED: Clean environment test
git stash
rm -rf node_modules dist
npm ci
npm run build
npm test
# EXPECTED: All commands succeed in clean environment
# IF FAILS: Environment-specific issues exist - must fix
```

### FAILURE: "It compiled so it works"  

**MANDATORY SOLUTION**: Run actual functionality tests

```bash
# REQUIRED: Functional verification after compilation
npm run build && npm run start:cli -- --test-mode
# EXPECTED: CLI starts and functions correctly
# IF FAILS: Compilation != working feature - must fix functionality
```

### FAILURE: "Tests pass but feature doesn't work"

**MANDATORY SOLUTION**: Add integration/e2e tests

```bash
# REQUIRED: End-to-end workflow testing
npm run test:e2e || echo "E2E tests missing - must implement"
# Manual workflow test also required
# EXPECTED: Complete user workflow functions correctly
# IF FAILS: Tests don't cover real usage - must add proper tests
```

---

## MANDATORY COMPLETION CHECKLIST

**CRITICAL**: ALL ITEMS MUST BE CHECKED WITH EVIDENCE OR TASK IS INCOMPLETE

***DO NOT* CHECK ANY BOX WITHOUT PROVIDING ACTUAL EVIDENCE**

- [ ] **Build**: Clean compilation with 0 errors (EVIDENCE: Copy-paste build output)
- [ ] **Test**: All relevant tests pass with >80% coverage (EVIDENCE: Test results with coverage report)
- [ ] **Execute**: Feature runs producing expected output (EVIDENCE: Terminal output showing execution)
- [ ] **Integrate**: Verified working with existing system components (EVIDENCE: Integration test results)
- [ ] **Document**: All required evidence provided above (EVIDENCE: Complete evidence sections filled)
- [ ] **Review**: Edge cases tested and error conditions handled (EVIDENCE: Error handling test results)
- [ ] **Performance**: No degradation in response times or resource usage (EVIDENCE: Performance comparison)
- [ ] **Security**: No security vulnerabilities introduced (EVIDENCE: Security scan results)

**STOP CONDITIONS**:

- If ANY checkbox cannot be checked with evidence → TASK INCOMPLETE
- If ANY test fails → STOP, fix issues, re-validate
- If ANY integration breaks → STOP, repair integration, re-test
- If ANY performance degrades → STOP, optimize, re-benchmark

**CONSEQUENCES OF INCOMPLETE VALIDATION**:

- Task will be marked as failed
- Changes may need to be reverted  
- Additional work required to meet standards

---

## Quick Task Validation Guide

| Task Type | Minimum Evidence Required |
|-----------|--------------------------|
| Backend Service | Health check + command execution |
| UI Component | Render test + interaction test |
| Core System | Unit tests + integration test |
| Build/Compilation | Clean build + type check |
| Code Quality | Lint pass + regression test |
| Architecture | Pattern test + integration test |
| Feature | Functionality + regression + integration |

---

**FINAL WARNING**:

**IF YOU CANNOT PROVE IT WORKS WITH EVIDENCE → *IT DOES NOT WORK***

**IF YOU CLAIM SUCCESS WITHOUT EVIDENCE → *TASK FAILED***

**IF YOU SKIP VALIDATION STEPS → *WORK MUST BE REDONE***

**EVIDENCE IS NOT OPTIONAL - *IT IS MANDATORY FOR TASK COMPLETION***

---

**SUCCESS** *=* **EVIDENCE-BACKED VALIDATION, NOT ASSUMPTIONS OR PROMISES**
