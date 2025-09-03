# Templum Testing & Debugging Guide

**Purpose**: Comprehensive validation guide for Templum backend service detection, CLI functionality, and end-to-end testing

**Target Audience**: Developers, QA testers, and LLM agents performing Templum validation

**Key Principle**: !!! **COMPILATION SUCCESS ≠ FUNCTIONAL SUCCESS** !!!

---

## CRITICAL VALIDATION PRINCIPLE

**DO NOT claim Templum is "working" or "production-ready" unless ALL tests in this guide pass with actual evidence.**

Building without errors means NOTHING. Only actual execution with verified outputs proves functionality.

---

## Quick Start - Essential Validation (5 minutes)

Run these commands to immediately verify core functionality:

### 1. Backend Service Test

```bash
cd ../examples/minimal-backend
npm install
node server.js &
sleep 3
curl -s http://localhost:3004/health | jq '.'
```

**SUCCESS CRITERIA**: Returns JSON with `"status": "healthy"` and uptime > 0

### 2. Service Discovery Test

```bash
ls ~/.templum/services/ || ls ../../.templum/services/
```

**SUCCESS CRITERIA**: Shows `minimal-example-*.json` file with current PID

### 3. Command Execution Test

```bash
curl -s -X POST http://localhost:3004/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.hello", "args": {"name": "TestUser"}}' | jq '.'
```

**SUCCESS CRITERIA**: Returns `"success": true` with greeting message

### 4. CLI Discovery Test

```bash
cd ..
npm run start:cli
# Should show "Templum services found" and minimal-example backend
```

**SUCCESS CRITERIA**: CLI shows discovered backend services, not "No services found"

If ANY of these fail, Templum is NOT working. Do not proceed with other tasks.

---

## Prerequisites & Setup Verification

### Required Dependencies

```bash
# Verify installations
node --version    # >= 18.0.0
npm --version     # >= 9.0.0
curl --version    # Any version
jq --version      # Any version (install with: apt-get install jq / brew install jq)
```

### Directory Structure Check

```bash
cd ..
ls -la | grep -E "(src/|examples/|tests/|package.json)"
```

**SUCCESS CRITERIA**: All directories exist

### Configuration Verification

```bash
# Check critical files exist
test -f package.json && echo "✓ package.json exists"
test -f tsconfig.json && echo "✓ tsconfig.json exists" 
test -f ../examples/minimal-backend/server.js && echo "✓ minimal backend exists"
```

---

## Core Testing Areas

### Area 1: Service Discovery System

#### 1.1 Auto-Registration Testing

```bash
# Start a backend and verify auto-registration
cd ../examples/minimal-backend
npm install
PORT=3005 node server.js &
BACKEND_PID=$!
sleep 2

# Check service file was created
ls ~/.templum/services/minimal-example-*.json || ls ../../.templum/services/minimal-example-*.json
cat ~/.templum/services/minimal-example-$BACKEND_PID.json || cat ../../.templum/services/minimal-example-$BACKEND_PID.json
```

**EVIDENCE OF SUCCESS**:

- Service file exists with correct PID
- JSON contains endpoint matching the port (3005)
- File includes "started" timestamp

#### 1.2 Registry File Discovery

```bash
# Create manual registry entry
mkdir -p ~/.templum || mkdir -p ../../.templum
cat > ~/.templum/service-registry.json << EOF
{
  "services": {
    "test-backend": {
      "id": "test-backend",
      "endpoint": "http://localhost:3005",
      "protocol": "http",
      "health": "http://localhost:3005/health",
      "capabilities": ["getSkinDefinition", "executeCommand"],
      "version": "1.0.0",
      "registrationTime": $(date +%s)000,
      "lastSeen": $(date +%s)000
    }
  },
  "version": 1,
  "lastUpdated": $(date +%s)000
}
EOF

# Test registry reading (requires Templum service discovery code)
cd ..
npm run test -- --testNamePattern="ServiceDiscovery.*registry"
```

#### 1.3 Service Cleanup Testing

```bash
# Kill backend and verify cleanup
kill $BACKEND_PID
sleep 1

# Service file should be removed
ls ~/.templum/services/minimal-example-*.json && echo "[!] Cleanup failed" || echo "[x] Cleanup successful"
```

### Area 2: Backend Connection Validation

#### 2.1 HTTP Endpoint Testing

```bash
cd ../examples/minimal-backend
node server.js &
sleep 2

# Test all required endpoints
echo "Testing /health endpoint:"
curl -s http://localhost:3004/health | jq '.status' | grep -q "healthy" && echo "[x] Health OK" || echo "[F] Health FAIL"

echo "Testing /getSkinDefinition endpoint:"
curl -s http://localhost:3004/getSkinDefinition | jq '.metadata.id' | grep -q "minimal-example" && echo "[x] Skin OK" || echo "[F] Skin FAIL"

echo "Testing /executeCommand endpoint:"
curl -s -X POST http://localhost:3004/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.hello", "args": {"name": "TestUser"}}' | \
  jq '.success' | grep -q "true" && echo "[x] Command OK" || echo "[F] Command FAIL"
```

#### 2.2 Skin Definition Validation

```bash
# Verify skin definition structure
curl -s http://localhost:3004/getSkinDefinition > skin.json
jq -e '.metadata.id' skin.json
jq -e '.backendConfig.protocol' skin.json  
jq -e '.commands."example.hello"' skin.json
jq -e '.menus.main.items' skin.json
rm skin.json
```

**EVIDENCE OF SUCCESS**: All jq commands return values without errors

#### 2.3 Command Parameter Handling

```bash
# Test command with parameters
curl -s -X POST http://localhost:3004/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.hello", "args": {"name": "ParameterTest"}}' | \
  jq -r '.result.message' | grep -q "ParameterTest" && echo "[x] Parameters work" || echo "[F] Parameters fail"

# Test command without optional parameters  
curl -s -X POST http://localhost:3004/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.hello", "args": {}}' | \
  jq -r '.result.message' | grep -q "World" && echo "[x] Defaults work" || echo "[F] Defaults fail"
```

### Area 3: CLI Functionality Testing

#### 3.1 CLI Service Discovery

```bash
cd ..
# Ensure a backend is running
cd ../examples/minimal-backend && node server.js &
sleep 2
cd ..

# Test CLI can discover services
timeout 10 npm run start:cli -- --test-mode 2>&1 | grep -q "minimal-example" && echo "[x] CLI discovers backend" || echo "[F] CLI discovery fails"
```

#### 3.2 CLI Menu Rendering

```bash
# Test CLI shows backend menus (requires interactive testing or mock)
# This validates the skin definition was loaded and rendered
echo "Manual test required: Start 'npm run start:cli' and verify:"
echo "1. Backend services are listed"
echo "2. Menu items are displayed" 
echo "3. Commands can be selected"
```

#### 3.3 CLI Command Execution

```bash
# Test CLI can execute commands (manual verification required)
echo "Manual test: In CLI interface, execute 'example.hello' command"
echo "Expected: Returns greeting message with success"
echo "Evidence: Screenshot or copy-paste of successful command output"
```

### Area 4: End-to-End Workflow Testing

#### 4.1 Complete Service Lifecycle

```bash
#!/bin/bash
echo "=== Complete Service Lifecycle Test ==="

cd ..

# 1. Start backend service
echo "Starting backend..."
cd ../examples/minimal-backend
node server.js &
BACKEND_PID=$!
cd ../..
sleep 3

# 2. Verify service registration
echo "Checking service registration..."
SERVICE_FILE=$(find . -path "*/.templum/services/minimal-example-*.json" 2>/dev/null | head -1)
if [ -f "$SERVICE_FILE" ]; then
    echo "[x] Service registered: $SERVICE_FILE"
else
    echo "[F] Service registration failed"
    exit 1
fi

# 3. Test service discovery
echo "Testing service discovery..."
if curl -s http://localhost:3004/health | jq -e '.status == "healthy"' > /dev/null; then
    echo "[x] Service is healthy"
else
    echo "[F] Service health check failed"
    exit 1
fi

# 4. Execute commands
echo "Testing command execution..."
RESULT=$(curl -s -X POST http://localhost:3004/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.status"}' | jq -r '.result.status')

if [ "$RESULT" = "running" ]; then
    echo "[x] Commands execute successfully"
else
    echo "[F] Command execution failed"
    exit 1
fi

# 5. Test CLI connection (automated check)
echo "Testing CLI connection..."
timeout 5 npm run start:cli -- --list-services 2>/dev/null | grep -q "minimal-example" && \
    echo "[x] CLI connects successfully" || echo "[!] CLI connection test skipped (manual verification required)"

# 6. Cleanup
echo "Cleaning up..."
kill $BACKEND_PID
sleep 1

# Verify cleanup
if [ -f "$SERVICE_FILE" ]; then
    echo "[F] Service file not cleaned up"
else
    echo "[x] Service cleanup successful"
fi

echo "=== End-to-End Test Complete ==="
```

---

## [x] Evidence of Success

### What Constitutes "Working"

For each test area, collect this evidence:

#### Backend Service Evidence

- [ ] `/health` returns HTTP 200 with `{"status": "healthy"}`
- [ ] `/getSkinDefinition` returns valid JSON with required fields
- [ ] `/executeCommand` successfully processes commands
- [ ] Service auto-registers in `.templum/services/` directory
- [ ] Service file contains correct PID and endpoint

#### CLI Functionality Evidence

- [ ] CLI displays "Services found" message
- [ ] Backend appears in service list by name
- [ ] Menu items from skin definition are rendered
- [ ] Commands can be selected and executed
- [ ] Command results are displayed correctly

#### System Integration Evidence

- [ ] Multiple backends can run simultaneously
- [ ] Service discovery finds all running backends
- [ ] Commands route to correct backend
- [ ] State persists across CLI sessions
- [ ] Dead services are cleaned up automatically

### Required Screenshots/Output

1. Terminal output of successful health check
2. JSON output of skin definition
3. Command execution result with success=true
4. CLI interface showing discovered backends
5. Service files in .templum/services/ directory

---

## Common Failures & Solutions

### "Backend Not Found" Errors

**Symptoms**: CLI shows "No services found"
**Causes**:

- Backend not running on expected port
- Service files not created in correct location  
- Permissions issue with .templum directory

**Solutions**:

```bash
# Check backend is actually running
netstat -tulpn | grep :3004
# Verify service file location
find . -name "*.json" -path "*/.templum/services/*"
# Check permissions
ls -la .templum/
```

### Command Execution Failures

**Symptoms**: Commands return error or no response
**Causes**:

- Backend command handlers not implemented
- JSON parsing errors in requests
- Network connectivity issues

**Solutions**:

```bash
# Test backend directly
curl -v -X POST http://localhost:3004/executeCommand \
  -H "Content-Type: application/json" \
  -d '{"command": "example.hello"}'
# Check backend logs
tail -f ../examples/minimal-backend/backend.log
```

### Service Discovery Issues  

**Symptoms**: Services start but aren't discovered
**Causes**:

- Wrong .templum directory location
- File system permissions
- Service registration code not executing

**Solutions**:

```bash
# Manually check service registration
strace -e write node server.js 2>&1 | grep templum
# Verify directory creation
mkdir -p ~/.templum/services
chmod 755 ~/.templum/services
```

### CLI Connection Problems

**Symptoms**: CLI starts but can't connect to services  
**Causes**:

- Service discovery not finding registry files
- IPC communication failures
- Port conflicts

**Solutions**:

```bash
# Debug CLI discovery
DEBUG=templum:discovery npm run start:cli
# Check port availability
netstat -tulpn | grep :300[0-9]
# Verify IPC endpoints
ls /tmp/ | grep templum
```

---

## Automated Test Scripts

### Run Existing Test Suite

```bash
# Backend service tests
npm run test:backend

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e

# Health monitoring
node scripts/test-health-monitor.js

# Comprehensive backend tests
node scripts/run-comprehensive-backend-tests.js
```

### Coverage Verification

```bash
# Generate test coverage report
npm run test -- --coverage
open coverage/lcov-report/index.html

# Required coverage thresholds:
# - Statements: >80%
# - Branches: >75%  
# - Functions: >80%
# - Lines: >80%
```

### Continuous Testing

```bash
# Watch mode for development
npm run test:watch

# Run tests on file changes
npm run test:watch -- --testPathPattern=backend
```

---

## Manual Testing Procedures

### Interactive CLI Testing Checklist

1. **Start CLI Interface**

   ```bash
   npm run start:cli
   ```

2. **Verify Service Discovery**
   - [ ] Services are listed by name
   - [ ] Service status shows "connected"
   - [ ] Menu structure matches skin definition

3. **Test Navigation**
   - [ ] Arrow keys navigate menu items
   - [ ] Enter selects menu items
   - [ ] Escape returns to previous level
   - [ ] Tab completion works for commands

4. **Execute Commands**
   - [ ] Select "Say Hello" command
   - [ ] Enter parameter when prompted
   - [ ] Verify command output displays
   - [ ] Test command with no parameters

5. **Test Error Handling**
   - [ ] Enter invalid command
   - [ ] Verify error message displays
   - [ ] Confirm CLI remains responsive

6. **Test Multiple Backends**
   - [ ] Start second backend service
   - [ ] Verify both appear in CLI
   - [ ] Test commands from each backend
   - [ ] Confirm no cross-talk between backends

### Cross-Interface Validation

1. **State Synchronization**
   - Start CLI and execute command
   - Note any state changes
   - Start VSCode extension
   - Verify state is consistent

2. **Command Consistency**
   - Execute same command via CLI
   - Execute same command via VSCode
   - Execute same command via curl
   - Confirm identical results

---

## Performance Benchmarks

### Response Time Targets

- Health check: < 100ms
- Skin definition: < 200ms  
- Command execution: < 500ms
- CLI startup: < 3s
- Service discovery: < 2s

### Load Testing

```bash
# Test concurrent requests
for i in {1..10}; do
  curl -s http://localhost:3004/health &
done
wait

# Measure response times
time curl -s http://localhost:3004/executeCommand \
  -X POST -H "Content-Type: application/json" \
  -d '{"command": "example.status"}'
```

---

## Production Readiness Checklist

Before claiming Templum is "production-ready":

### Core Functionality

- [ ] All automated tests pass
- [ ] Manual testing procedures completed
- [ ] Performance benchmarks met
- [ ] Error handling tested and verified
- [ ] Resource cleanup confirmed

### Security Validation  

- [ ] No sensitive information in logs
- [ ] Service files have appropriate permissions
- [ ] Network connections are secure
- [ ] Input validation prevents injection attacks

### Scalability Testing

- [ ] Multiple backend services supported
- [ ] CLI handles service discovery at scale
- [ ] Memory usage remains stable under load
- [ ] Graceful degradation when services fail

### Documentation Compliance

- [ ] All examples in guides work correctly
- [ ] API contracts match implementations
- [ ] Configuration options are validated
- [ ] Troubleshooting guides are accurate

---

## Test Evidence Documentation

### Required Documentation for "Complete" Status

When claiming work is complete, provide:

1. **Command Output Logs**
   - Copy-paste of all successful test commands
   - Error messages for any failures encountered
   - Resolution steps for any issues found

2. **Service Files Content**

   ```bash
   # Include actual content of generated service files
   cat ~/.templum/services/minimal-example-*.json || cat ../.templum/services/minimal-example-*.json
   ```

3. **CLI Screenshots**
   - Service discovery screen
   - Menu navigation  
   - Command execution results
   - Error handling examples

4. **Performance Metrics**
   - Response time measurements
   - Memory usage during testing
   - CPU utilization under load

5. **Test Coverage Report**
   - Link to coverage report
   - Explanation of any uncovered code
   - Plan for improving coverage

---

## Quick Debug Commands

When debugging issues, run these commands to collect information:

```bash
# System status
ps aux | grep node
netstat -tulpn | grep :300[0-9]
ls -la ~/.templum/services/ || ls -la ../.templum/services/

# Service health  
curl -s http://localhost:3004/health | jq '.'
curl -s http://localhost:3004/getSkinDefinition | jq '.metadata'

# Backend logs
tail -n 50 ../examples/minimal-backend/backend.log

# Templum service status
npm run status

# Test framework status
npm run test -- --listTests
```

---

**Remember: A successful build is just the beginning. Real validation requires actual execution with verified results.**

**Success = Evidence-backed functional validation, not compilation success.**
