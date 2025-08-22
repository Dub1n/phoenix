# Haruspex VSCode Extension - Practical Debugging Test Scenario

> **Created**: 2025-08-15  
> **Purpose**: Comprehensive real-world testing of the Haruspex debugging system  
> **Approach**: Test the actual VSCode extension with the haruspex-debug CLI  
> **Status**: Ready to execute

## 🎯 Test Overview

This is a **practical debugging test** that exercises the real Haruspex VSCode extension using the debugging system described in `02-CC-debugging-guide.md`. We'll test:

1. **Extension Activation** - Real VSCode extension loading
2. **Debug CLI Connection** - haruspex-debug CLI connecting to running extension
3. **Real-time Debugging** - Live state inspection and control
4. **Error Recovery** - Testing emergency recovery procedures
5. **Performance Monitoring** - Real performance metrics and optimization

## 📋 Pre-Test Setup Checklist

### ✅ 1. Build and Install Extension

```bash
cd C:\Users\gabri\Documents\Infotopology\VDL_Vault\Haruspex
npm run build
npm run install:cli  # Optional: Install CLI globally
```

### ✅ 2. VSCode Extension Installation

```bash
# Method 1: Package and install VSIX
npx vsce package
code --install-extension haruspex-0.0.1.vsix

# Method 2: Development installation  
# Copy dist/ folder to VSCode extensions directory
# OR open project in VSCode and press F5 to run in Extension Development Host
```

### ✅ 3. Test Workspace Setup

Create a test workspace with:

- Mixed file types (TypeScript, JavaScript, Markdown, JSON)
- Some documentation files  
- Various project structures

```bash
# Create test workspace
mkdir C:\temp\haruspex-test-workspace
cd C:\temp\haruspex-test-workspace

# Create sample files
echo "# Test Documentation" > README.md
echo "export const test = 'hello world';" > test.ts
echo '{"name": "test-project", "version": "1.0.0"}' > package.json

# Create subdirectories
mkdir docs src
echo "# Architecture" > docs\architecture.md
echo "# API Reference" > docs\api.md
echo "console.log('test');" > src\index.ts
```

## 🧪 Test Scenarios

### **Scenario 1: Extension Activation & Health Check**

**🎯 Goal**: Verify extension activates properly and debugging system initializes

#### Step 1.1: Launch VSCode with Test Workspace

```bash
code C:\temp\haruspex-test-workspace
```

#### Step 1.2: Verify Extension Activation

- Check VSCode activity bar for Haruspex icon (🔮)
- Open Command Palette (`Ctrl+Shift+P`)
- Look for "Haruspex:" commands
- Check VSCode Developer Console for activation messages

#### Step 1.3: Test Extension Commands

```bash
# In VSCode Command Palette
Haruspex: Show Health Status
Haruspex: Show Engine Metrics  
Haruspex: Refresh All
```

#### Step 1.4: Connect Debugging CLI

```bash
# In separate terminal
cd C:\Users\gabri\Documents\Infotopology\VDL_Vault\Haruspex

# Use built CLI
node dist/debugging/cli-bin.js connect

# OR if installed globally
haruspex-debug connect
```

**Expected Results**:

- ✅ Extension activates without errors
- ✅ Health status shows "healthy" or "degraded" with metrics
- ✅ CLI connects successfully
- ✅ Debug commands respond with structured data

---

### **Scenario 2: Real-Time State Inspection**

**🎯 Goal**: Test live monitoring of extension state and automatic change detection

#### Step 2.1: Start Real-Time Monitoring

```bash
# In CLI terminal
haruspex-debug watch

# In another terminal for interactive commands
haruspex-debug interactive
```

#### Step 2.2: Generate Extension Activity

**In VSCode**, perform these actions while monitoring:

1. **File Operations**:
   - Open/close files
   - Edit documentation files  
   - Create new files
   - Delete/rename files

2. **Haruspex Operations**:
   - Refresh documentation tree
   - Open webview panels (Architecture, Kanban, Health Dashboard)
   - Run workspace initialization wizard

3. **Stress Testing**:
   - Open many files rapidly
   - Generate file system events
   - Switch between workspaces

#### Step 2.3: Monitor State Changes

Watch CLI output for:

- File system change events
- Extension state updates
- Memory usage changes
- Performance metrics
- Error events

**Expected Results**:

- ✅ Real-time state updates appear in CLI
- ✅ File changes trigger appropriate responses
- ✅ Memory and performance metrics update
- ✅ No critical errors or memory leaks

---

### **Scenario 3: Interactive Command Execution**

**🎯 Goal**: Test remote command execution and extension control

#### Step 3.1: Execute Commands Remotely

```bash
# In interactive CLI session
status
health  
metrics

# Execute VSCode commands
exec haruspex.refreshAll
exec haruspex.showHealth  
exec haruspex.setup.runWizard
```

#### Step 3.2: Test Advanced Operations

```bash
# Diagnostic commands
diagnose --fix
emergency-recovery

# State inspection
get-debug-info --detailed
get-state --include-performance
```

#### Step 3.3: WebView Control

```bash
# WebView operations (if implemented)
refresh-webviews
update-mermaid
update-kanban
update-truth-matrix
```

**Expected Results**:

- ✅ Commands execute successfully in VSCode
- ✅ Extension responds to remote commands
- ✅ WebViews update when commanded
- ✅ Error recovery works when needed

---

### **Scenario 4: Error Injection & Recovery Testing**

**🎯 Goal**: Test debugging system resilience and recovery procedures

#### Step 4.1: Simulate Common Errors

**File System Stress**:

```bash
# Create rapid file changes
for i in {1..50}; do
  echo "Test content $i" > "temp_file_$i.md"
  sleep 0.1
done

# Delete files rapidly  
rm temp_file_*.md
```

**Memory Pressure**:

```bash
# Open many large files
for i in {1..20}; do
  echo "# Large file $i" > "large_$i.md"
  # Add substantial content
  for j in {1..1000}; do
    echo "Line $j content..." >> "large_$i.md"
  done
done
```

#### Step 4.2: Trigger Error Conditions

- Corrupt workspace files
- Remove permissions on files
- Fill up disk space (carefully!)
- Interrupt operations mid-execution

#### Step 4.3: Test Recovery Procedures

```bash
# In debugging CLI
emergency-recovery
diagnose --fix --aggressive
restart-components
health-check --repair
```

**Expected Results**:

- ✅ Extension handles errors gracefully
- ✅ Recovery procedures restore functionality  
- ✅ No permanent corruption or data loss
- ✅ Extension remains responsive during stress

---

### **Scenario 5: Performance & Memory Analysis**

**🎯 Goal**: Analyze extension performance under realistic workloads

#### Step 5.1: Baseline Performance

```bash
# Get clean baseline
haruspex-debug metrics --baseline
haruspex-debug get-state --performance
```

#### Step 5.2: Load Testing

**Create realistic workspace**:

- 100+ files of mixed types
- Deep directory structures (5+ levels)
- Large files (1MB+ documentation)
- Complex project configurations

#### Step 5.3: Monitor Under Load

```bash
# Start monitoring
haruspex-debug watch --metrics --memory

# Generate sustained activity
# (Open files, edit, save, repeat)
```

#### Step 5.4: Memory Leak Detection

```bash
# Run for extended period (10+ minutes)
haruspex-debug metrics --memory --trend
haruspex-debug get-state --memory-analysis
```

**Expected Results**:

- ✅ Performance remains acceptable under load
- ✅ Memory usage stabilizes (no leaks)
- ✅ Response times stay under thresholds
- ✅ CPU usage remains reasonable

---

### **Scenario 6: Multi-Workspace Testing**

**🎯 Goal**: Test debugging system with multiple VSCode workspaces

#### Step 6.1: Setup Multiple Workspaces

```bash
# Create workspace 1 (TypeScript project)
mkdir C:\temp\haruspex-test-ts
cd C:\temp\haruspex-test-ts
npm init -y
echo "export const hello = 'world';" > index.ts

# Create workspace 2 (Documentation project)  
mkdir C:\temp\haruspex-test-docs
cd C:\temp\haruspex-test-docs
mkdir docs
echo "# Documentation Project" > README.md
echo "# User Guide" > docs\guide.md

# Create workspace 3 (Mixed project)
mkdir C:\temp\haruspex-test-mixed  
cd C:\temp\haruspex-test-mixed
mkdir src docs tests
echo "# Mixed Project" > README.md
```

#### Step 6.2: Test Workspace Switching

- Open each workspace in separate VSCode windows
- Connect debugging CLI to each instance
- Switch between workspaces rapidly
- Monitor performance across instances

#### Step 6.3: Cross-Workspace Operations

```bash
# Connect to specific workspace
haruspex-debug connect --workspace C:\temp\haruspex-test-ts

# Switch workspaces  
haruspex-debug switch-workspace C:\temp\haruspex-test-docs

# Compare workspace states
haruspex-debug compare-workspaces
```

**Expected Results**:

- ✅ Each workspace maintains separate state
- ✅ CLI can connect to specific instances
- ✅ No cross-contamination between workspaces
- ✅ Performance scales reasonably

---

## 📊 Success Criteria

### 🏆 Critical Success Factors

- [ ] Extension activates successfully in VSCode
- [ ] Debug CLI connects and communicates with extension
- [ ] Real-time state monitoring works accurately
- [ ] Remote command execution functions properly
- [ ] Error recovery procedures are effective
- [ ] Performance remains acceptable under load

### 📈 Performance Benchmarks

- **CLI Response Time**: < 500ms for most commands
- **Extension Memory**: < 100MB under normal load
- **File Change Response**: < 200ms for file system events
- **Connection Reliability**: 99%+ uptime during testing
- **Error Recovery Time**: < 30 seconds for most issues

### 🐛 Acceptable Issues

- Minor UI glitches that don't affect functionality
- Performance degradation under extreme stress (1000+ files)
- Non-critical warning messages in logs
- Cosmetic issues in WebView displays

### 🚨 Test Failures

- Extension crashes or fails to activate
- CLI cannot connect to extension
- Data corruption or loss during operations  
- Memory leaks or excessive resource usage
- Complete unresponsiveness requiring VSCode restart

---

## 📝 Test Execution Log

### Run 1: [Date/Time]

**Tester**: [Your Name]
**VSCode Version**: [Version]
**Node.js Version**: [Version]  
**OS**: [Windows/Mac/Linux + Version]

#### Scenario 1 Results

- [ ] ✅ Extension activated
- [ ] ✅ CLI connected
- [ ] ⚠️ Minor issues: [Description]
- [ ] ❌ Critical issues: [Description]

#### Scenario 2 Results

- [ ] State monitoring: [Status]
- [ ] Performance: [Metrics]
- [ ] Issues: [Description]

#### Overall Assessment

[Detailed assessment of the debugging system functionality]

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

**Extension Won't Activate**:

```bash
# Check extension logs
code --log info
# Look for Haruspex errors in Developer Console
```

**CLI Won't Connect**:

```bash
# Check if IPC server is running
haruspex-debug status --verbose
# Try emergency recovery
haruspex-debug emergency-recovery
```

**Performance Issues**:

```bash
# Check memory usage
haruspex-debug metrics --memory
# Restart components
haruspex-debug restart-components  
```

**WebViews Not Loading**:

```bash
# Refresh all views
haruspex-debug exec haruspex.refreshAll
# Check webview status
haruspex-debug get-debug-info --webviews
```

---

## 🚀 Advanced Testing

### Integration with Phoenix Code Lite

If PCL is available, test integration:

- Haruspex + PCL workflow coordination
- Cross-tool debugging capabilities
- Shared configuration and state management

### Custom Test Scenarios

Add your own test scenarios based on:

- Your specific use cases
- Known pain points
- Edge cases in your environment  
- Performance requirements

### Automated Testing

```bash
# Run automated test suite (if available)
npm run test:debugging
npm run test:integration
npm run test:performance
```

---

**This test provides comprehensive validation of the Haruspex debugging system using real VSCode extension functionality rather than mocked components.**
